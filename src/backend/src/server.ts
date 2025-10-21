import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { DatabaseFactory } from './data/database.factory';
import { formatCurrency } from './utils/formatting';
import { logInvoiceGeneration } from './utils/logger';
import { config } from 'dotenv';
import { Database } from './data/database.interface';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    isAuthenticated: boolean;
  }
}

// Augment jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
  }
}

// Get database instance
const getDatabase = () => DatabaseFactory.getDatabase();

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

// Apply rate limiting to all routes
app.use(limiter);

// Enable CORS
app.use(cors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:3001', 'https://dctxoovo0tr3t.cloudfront.net'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true
}));

// Serve static files from the images directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Increase payload size limit
app.use(express.json({ limit: '10mb' }));

// Types
interface InvoiceItem {
    name: string;
    quantity: number;
    price: number;
    description?: string;
    size?: string;
    option?: string;
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    next();
};

// Login endpoint
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        // Return the API key (which is the admin password in this case)
        res.json({ success: true, apiKey: process.env.ADMIN_PASSWORD });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Logout endpoint (client will handle API key removal)
app.post('/auth/logout', (_req, res) => {
    res.json({ success: true });
});

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    if (req.method === 'POST') {
        console.log('Body:', req.body);
    }
    next();
});

// Public routes
app.get('/products', async (req, res) => {
    try {
        const db = getDatabase();
        const products = await db.getAllProducts();
        res.json(products);
    } catch (error: any) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// Update product endpoint
app.put('/products/:name', requireAuth, async (req, res) => {
    try {
        const { name } = req.params;
        const productData = req.body;
        console.log('Updating product:', name);
        console.log('Product data:', productData);
        
        const db = getDatabase();
        console.log('Database instance:', db);
        
        // Update the product in the database
        await db.updateProduct(name, productData);
        console.log('Product updated successfully');
        
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Invoice generation endpoint
app.post('/generate-invoice', async (req, res) => {
    try {
        const { customerName, customerAddress, customerEmail, customerPhone, items } = req.body;

        // Validate customer details
        const missingFields = [];
        if (!customerName) missingFields.push('Customer Name');
        if (!customerAddress) missingFields.push('Customer Address');
        if (!customerEmail) missingFields.push('Customer Email'); 
        if (!customerPhone) missingFields.push('Customer Phone');

        if (missingFields.length > 0) {
            const error = `Missing required customer details: ${missingFields.join(', ')}`;
            logInvoiceGeneration(req, false, error);
            return res.status(400).json({
                error: 'Invalid request data',
                details: error
            });
        }

        // Validate items array
        if (!items || !Array.isArray(items) || items.length === 0) {
            const error = 'At least one item is required';
            logInvoiceGeneration(req, false, error);
            return res.status(400).json({
                error: 'Invalid request data',
                details: error
            });
        }

        // Validate each item
        const invalidItems = items.map((item, index) => {
            const issues = [];
            
            // Check existence of required fields
            if (!item.name) issues.push('product name is missing');
            if (!item.size) issues.push('size is not selected');
            
            // Check numeric fields
            if (!item.quantity) issues.push('quantity is missing');
            else if (item.quantity <= 0) issues.push('quantity must be greater than 0');
            
            if (!item.price) issues.push('price is missing');
            else if (item.price <= 0) issues.push('price must be greater than 0');
            
            return issues.length > 0 ? {
                itemNumber: index + 1,
                issues
            } : null;
        }).filter(item => item !== null);

        if (invalidItems.length > 0) {
            const errorDetails = invalidItems.map(item => 
                `Item #${item.itemNumber}: ${item.issues.join(', ')}`
            ).join('\n');

            const error = `Problems found with items:\n${errorDetails}`;
            logInvoiceGeneration(req, false, error);
            return res.status(400).json({
                error: 'Invalid request data',
                details: error
            });
        }

        // Generate quote number
        const quoteNo = `Q${Date.now()}`;

        // Create new PDF document
        const doc = new jsPDF();
        
        const leftMargin = 25;  
        const topMargin = 25;   
        const rightMargin = 185;
        const docHeight = doc.internal.pageSize.getHeight();

        // Add company logo
        try {
            const logoPath = path.join(__dirname, 'images', 'company_logo.png');
            const logoData = fs.readFileSync(logoPath);
            const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
            doc.addImage(logoBase64, 'PNG', leftMargin - 10, topMargin, 91, 46);
        } catch (error) {
            throw new Error(`Failed to add company logo to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Add company details
        try {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('Ukuza Kwenkosi Enterprises trading as Ukuza Kivenkosi Enterprises', rightMargin, topMargin + 15, { align: 'right' });
            doc.text('Reg No 2012/750142/07 TAX No. 9278518254', rightMargin, topMargin + 20, { align: 'right' });
            doc.text('E2144 Osizeni, Newcastle, KiaZulu-Natal, 2952', rightMargin, topMargin + 25, { align: 'right' });
        } catch (error) {
            throw new Error('Failed to add company details to PDF');
        }

        // Add customer details
        try {
            let customerInfoTopMargin = 55;
            doc.setFontSize(10);
            doc.text(`Quote #: ${quoteNo}`, rightMargin, topMargin + customerInfoTopMargin, { align: 'right' });
            doc.text(`Date: ${new Date().toLocaleDateString()}`, rightMargin, topMargin + customerInfoTopMargin + 5, { align: 'right' });
            
            doc.text(`Name: ${customerName}`, leftMargin, topMargin + customerInfoTopMargin);
            doc.text(`Address: ${customerAddress || ''}`, leftMargin, topMargin + customerInfoTopMargin + 5);
            doc.text(`Email: ${customerEmail}`, leftMargin, topMargin + customerInfoTopMargin + 10);
            doc.text(`Phone: ${customerPhone}`, leftMargin, topMargin + customerInfoTopMargin + 15);
        } catch (error) {
            throw new Error('Failed to add customer details to PDF');
        }

        // Prepare table data
        try {
            const tableColumn = ["Description", "Price", "QTY", "Total"];
            const tableRows: string[][] = [];
            let totalAmount = 0;
            
            items.forEach((item: InvoiceItem, index: number) => {
                if (!item.name || !item.quantity || !item.price) {
                    throw new Error(`Invalid item data at index ${index}: Missing required fields`);
                }

                // Ensure price is treated as a whole number
                const price = Math.round(item.price);
                const total = price * item.quantity;
                totalAmount += total;
                
                const description = `${item.name}${item.description ? ` - ${item.description}` : ''}${item.size ? ` - ${item.size}` : ''}${item.option ? ` - ${item.option}` : ''}`;
                
                // Format prices using the new formatCurrency function
                const formattedPrice = formatCurrency(price).replace('R ', '');
                const formattedTotal = formatCurrency(total);
                
                tableRows.push([
                    description,
                    formattedPrice,
                    item.quantity.toString(),
                    formattedTotal
                ]);
            });

            // Format total amount using the new formatCurrency function
            const formattedTotalAmount = formatCurrency(totalAmount);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: topMargin + 90,
                margin: { top: 0, left: leftMargin, right: leftMargin },
                theme: 'grid',
                headStyles: {
                    fillColor: [255, 99, 71],
                    textColor: [255, 255, 255],
                    halign: 'center',
                    fontSize: 8,
                    cellPadding: 2
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                    fontSize: 8
                },
                foot: [['', '', 
                    { content: 'Total', styles: { halign: 'center', fontSize: 8, cellPadding: 2 } }, 
                    { content: formattedTotalAmount, styles: { halign: 'center', fontSize: 8, cellPadding: 2 } }
                ]],
                footStyles: {
                    fillColor: [255, 99, 71],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 8,
                    cellPadding: 2
                },
                columnStyles: {
                    0: { cellWidth: 'auto', cellPadding: 2 },
                    1: { cellWidth: 20, halign: 'center', cellPadding: 4 },
                    2: { cellWidth: 15, halign: 'center', cellPadding: 4 },
                    3: { cellWidth: 30, halign: 'center', cellPadding: 4 }
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                }
            });
        } catch (error) {
            throw new Error('Failed to generate table');
        }

        try {
            const finalY = (doc as any).lastAutoTable.finalY || (topMargin + 115);

            // Add bank details
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Banking Details', leftMargin, finalY + 37);
            doc.setFont('helvetica', 'normal');
            doc.text('Bank:', leftMargin, finalY + 44);
            doc.text('Account Holder:', leftMargin, finalY + 51);
            doc.text('Account No:', leftMargin, finalY + 58);
            doc.text('Branch Code:', leftMargin, finalY + 65);
            doc.text('Swift code:', leftMargin, finalY + 72);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Capitec', leftMargin + 40, finalY + 44);
            doc.text('Ukuza Kwenkosi', leftMargin + 40, finalY + 51);
            doc.text('1052338658', leftMargin + 40, finalY + 58);
            doc.text('450105', leftMargin + 40, finalY + 65);
            doc.text('CABLZAJJ', leftMargin + 40, finalY + 72);

            // Add Terms and Conditions
            const termsY = finalY + 105;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('Terms & Conditions:', leftMargin, termsY);
            doc.text('1. This quote is valid for 30 days from the date of issue.', leftMargin, termsY + 5);
            doc.text('2. 4. Terms are strictly Nett for payment of a 50% deposit with order and 50% balance prior to collection.', leftMargin, termsY + 10);
            doc.text('3. Delivery time: 2-3 weeks after confirmation of order.', leftMargin, termsY + 15);
        } catch (error) {
            throw new Error('Failed to add footer details to PDF');
        }

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${quoteNo}.pdf`);

        // Send the PDF
        const pdfBuffer = doc.output('arraybuffer');
        logInvoiceGeneration(req, true);
        res.send(Buffer.from(pdfBuffer));
    } catch (error: any) {
        console.error('Error generating invoice:', error);
        logInvoiceGeneration(req, false, error.message);
        res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
    }
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
    app.listen(Number(port), '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
    }); 
}

export { app }; 