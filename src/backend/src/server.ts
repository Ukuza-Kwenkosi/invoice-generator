import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Augment jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => any;
    }
}

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Types
interface InvoiceItem {
    name: string;
    quantity: number;
    price: number;
    description?: string;
    size?: string;
    option?: string;
}

// Helper function to format currency values
export function formatCurrency(amount: number): string {
    // Convert to string and split into whole and decimal parts
    const [whole, decimal] = amount.toFixed(2).split('.');
    
    // Add thousand separators to the whole part
    const formattedWhole = whole
        .split('')
        .reverse()
        .join('')
        .match(/.{1,3}/g)
        ?.join(' ')
        .split('')
        .reverse()
        .join('') || whole;
    
    // Only show cents if they are non-zero
    const formattedAmount = decimal === '00' ? formattedWhole : `${formattedWhole}.${decimal}`;
    
    // Return formatted amount with R symbol
    return `R ${formattedAmount}`;
}

// Enable CORS
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
    credentials: true
}));

// Increase payload size limit
app.use(express.json({ limit: '10mb' }));

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    if (req.method === 'POST') {
        console.log('Body:', req.body);
    }
    next();
});

// Products endpoint
app.get('/products', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'data.json');
    console.log('Reading products from:', dataPath);
    const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(products);
  } catch (error: any) {
    console.error('Error reading products:', error);
    res.status(500).json({ error: 'Failed to load products', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check request received');
  console.log('Request headers:', req.headers);
  console.log('Request origin:', req.get('origin'));
  res.header('Access-Control-Allow-Origin', '*');
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
            return res.status(400).json({
                error: 'Invalid request data',
                details: `Missing required customer details: ${missingFields.join(', ')}`
            });
        }

        // Validate items array
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Invalid request data',
                details: 'At least one item is required'
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

            return res.status(400).json({
                error: 'Invalid request data',
                details: `Problems found with items:\n${errorDetails}`
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
        res.send(Buffer.from(pdfBuffer));
    } catch (error: any) {
        res.status(500).json({ 
            error: 'Error generating invoice',
            details: error.message
        });
    }
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
    app.listen(Number(port), '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
    }); 
}

export { app }; 