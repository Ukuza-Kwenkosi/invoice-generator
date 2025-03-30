import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import bodyParser from 'body-parser';
import flash from 'connect-flash';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add type definition for jsPDF with autoTable
interface TableStyles {
    fillColor?: number[];
    textColor?: number[];
    fontSize?: number;
    fontStyle?: string;
    cellPadding?: number;
    halign?: 'left' | 'center' | 'right';
    cellWidth?: number | 'auto';
}

interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    theme?: string;
    headStyles?: TableStyles;
    bodyStyles?: TableStyles;
    alternateRowStyles?: TableStyles;
    footStyles?: TableStyles;
    margin?: { top: number; left?: number; right?: number };
    tableWidth?: string;
    columnStyles?: Record<number, TableStyles>;
    styles?: TableStyles;
}

interface JsPDFWithAutoTable extends jsPDF {
    autoTable: (options: AutoTableOptions) => void;
    lastAutoTable: {
        finalY: number;
    };
}

// Product interface
interface Product {
    name: string;
    sizes: {
        size: string;
        price: number;
    }[];
    options?: string[];
    description?: string;
}

// Extend session type
declare module 'express-session' {
    interface SessionData {
        isAuthenticated: boolean;
    }
}

export const app = express();
const PORT = process.env.PORT || 3000;

// Data file paths
const getDataPaths = () => {
    const testPath = process.env.TEST_DATA_PATH;
    if (testPath) {
        return {
            dataDir: path.dirname(testPath),
            dataPath: testPath
        };
    }
    return {
        dataDir: path.join(__dirname, '..'),
        dataPath: path.join(__dirname, '..', 'data.json')
    };
};

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Add CSP headers
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com; " +
        "style-src 'self' 'unsafe-inline' data: https://cdn.jsdelivr.net; " +
        "font-src 'self' data:; " +
        "img-src 'self' data:; " +
        "connect-src 'self'"
    );
    next();
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data endpoint - serve data.json directly (MUST be before static file serving)
app.get('/data.json', (req: Request, res: Response) => {
    try {
        const dataPath = path.join(__dirname, '../data/data.json');
        if (!fs.existsSync(dataPath)) {
            console.error('Data file not found at:', dataPath);
            return res.status(404).json({ error: 'Data file not found' });
        }
        const data = fs.readFileSync(dataPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        console.error('Error serving data.json:', error);
        res.status(500).json({ error: 'Error reading data file' });
    }
});

// Serve static files
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/views', express.static(path.join(__dirname, '../views')));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
    if (req.session?.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Login page
app.get('/login', (req: Request, res: Response) => {
    res.render('login', { messages: req.flash() });
});

// Login endpoint
app.post('/login', (req: Request, res: Response): void => {
    const { username, password } = req.body;
    if (!username || !password) {
        req.flash('error', 'Username and password are required');
        res.redirect('/login');
        return;
    }

    if (username === 'admin' && password === 'admin') {
        req.session.isAuthenticated = true;
        res.redirect('/backoffice');
    } else {
        req.flash('error', 'Invalid credentials');
        res.redirect('/login');
    }
});

// Logout route
app.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((err: Error | null) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// Backoffice page
app.get('/backoffice', isAuthenticated, (_req: Request, res: Response) => {
    const data = readDataFile();
    res.render('backoffice', { products: data });
});

// Helper function to read data file
const readDataFile = (): Product[] => {
    const { dataPath } = getDataPaths();
    try {
        if (!fs.existsSync(dataPath)) {
            return [];
        }
        const data = fs.readFileSync(dataPath, 'utf8');
        try {
            return JSON.parse(data) || [];
        } catch (parseError) {
            return [];
        }
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
            throw new Error('Permission denied');
        }
        return [];
    }
};

// Helper function to write data file
const writeDataFile = (data: Product[]): boolean => {
    const { dataPath, dataDir } = getDataPaths();
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
            throw new Error('Permission denied');
        }
        return false;
    }
};

// Serve the index.ejs as HTML
app.get('/', (_req: Request, res: Response) => {
    try {
        res.render('index', { error: null });
    } catch (error) {
        console.error('Error rendering index:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).render('error', { 
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
    }
});

// Add interface for invoice item
interface InvoiceItem {
    name: string;
    size?: string;
    option?: string;
    quantity: number;
    price: number;
    description?: string;
}

// Generate invoice endpoint
app.post('/generate-invoice', (req, res) => {
    try {
        // Validate incoming request data
        if (!req.body || !req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ error: 'Invalid request data: items array is required' });
        }

        // Create new PDF document
        const doc = new jsPDF() as JsPDFWithAutoTable;
        
        const leftMargin = 25;  
        const topMargin = 25;   
        const rightMargin = 185;
        
        // Add company logo if it exists
        try {
            const logoPath = path.join(__dirname, '../images/company_logo.png');
            if (fs.existsSync(logoPath)) {
                const logo = fs.readFileSync(logoPath);
                doc.addImage(logo, 'PNG', leftMargin - 10, topMargin, 72, 52);
            }
        } catch (error) {
            // Log error but continue without logo
        }

        // Add company details
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Ukuza Kwenkosi Enterprises trading as Ukuza Kivenkosi Enterprises', rightMargin, topMargin + 15, { align: 'right' });
        doc.text('Reg No 2012/750142/07 TAX No. 9278518254', rightMargin, topMargin + 20, { align: 'right' });
        doc.text('E2144 Osizeni, Newcastle, KiaZulu-Natal, 2952', rightMargin, topMargin + 25, { align: 'right' });

        // Add customer details
        let customerInfoTopMargin = 55;
        doc.setFontSize(10);
        const quoteNo = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        doc.text(`Quote #: ${quoteNo}`, rightMargin, topMargin + customerInfoTopMargin, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, rightMargin, topMargin + customerInfoTopMargin + 5, { align: 'right' });
        
        doc.text(`Name: ${req.body.customerDetails.name}`, leftMargin, topMargin + customerInfoTopMargin);
        doc.text(`Address: ${req.body.customerDetails.address || ''}`, leftMargin, topMargin + customerInfoTopMargin + 5);
        doc.text(`Email: ${req.body.customerDetails.email}`, leftMargin, topMargin + customerInfoTopMargin + 10);
        doc.text(`Phone: ${req.body.customerDetails.phone}`, leftMargin, topMargin + customerInfoTopMargin + 15);

        // Prepare table data
        const tableColumn = ["Description", "Price", "QTY", "Total"];
        const tableRows: string[][] = [];
        let totalAmount = 0;
        
        req.body.items.forEach((item: InvoiceItem) => {
            console.log('Processing item:', item); // Debug log
            const VAT = 1.15;
            const total = item.price * item.quantity * VAT;
            const price = item.price * VAT;
            totalAmount += total;
            
            const description = `${item.name}${item.description ? ` - ${item.description}` : ''}${item.size ? ` - ${item.size}` : ''}${item.option ? ` - ${item.option}` : ''}`;
            console.log('Generated description:', description); // Debug log
            
            // Format price with thousand separators and fixed decimal places
            const formattedPrice = `R ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
            const formattedTotal = `R ${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
            
            tableRows.push([
                description,
                formattedPrice,
                item.quantity.toString(),
                formattedTotal
            ]);
        });

        // Generate table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: topMargin + 80,
            margin: { top: 0, left: leftMargin, right: leftMargin },
            theme: 'grid',
            headStyles: {
                fillColor: [255, 99, 71],
                textColor: [255, 255, 255],
                halign: 'center',
                fontSize: 10,
                cellPadding: 2
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            foot: [['', '', 
                { content: 'Total', styles: { halign: 'center', fontSize: 10, cellPadding: 2 } }, 
                { content: `R ${totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, styles: { halign: 'center', fontSize: 10, cellPadding: 2 } }
            ]],
            footStyles: {
                fillColor: [255, 99, 71],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 'auto', cellPadding: 2 },  // Description column remains flexible
                1: { cellWidth: 25, halign: 'center', cellPadding: 4 },  // Price column reduced
                2: { cellWidth: 12, halign: 'center', cellPadding: 4 },  // Quantity column reduced
                3: { cellWidth: 30, halign: 'center', cellPadding: 4 }   // Total column reduced
            },
            styles: {
                fontSize: 10,
                cellPadding: 2
            }
        });

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
        
        // Add values in bold
        doc.setFont('helvetica', 'bold');
        doc.text('Capitec', leftMargin + 40, finalY + 44);
        doc.text('Ukuza Kwenkosi', leftMargin + 40, finalY + 51);
        doc.text('1052338658', leftMargin + 40, finalY + 58);
        doc.text('450105', leftMargin + 40, finalY + 65);
        doc.text('CABLZAJJ', leftMargin + 40, finalY + 72);

        // Add terms and conditions
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', leftMargin, finalY + 120);
        doc.setFont('helvetica', 'normal');
        doc.text('1. This quote is valid for 30 days from the date of issue.', leftMargin, finalY + 130);
        doc.text('2. Payment terms: 50% deposit required to confirm order.', leftMargin, finalY + 137);
        doc.text('3. Delivery time: 2-3 weeks after confirmation of order.', leftMargin, finalY + 144);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${quoteNo}.pdf`);

        // Send the PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ error: 'Error generating invoice' });
    }
});

// Handle 404 errors
app.use((req: Request, res: Response) => {
    res.status(404).send('404 - Page Not Found');
});

// Error handling middleware
app.use((err: Error & { code?: string }, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    
    if (err.code === 'EACCES') {
        res.status(500).send('Permission denied. Please check file permissions.');
    } else {
        res.status(500).send('An error occurred. Please try again later.');
    }
});

// Add product endpoint
app.post('/api/products', (req: Request, res: Response): Response => {
    const { name, sizes, options, description } = req.body;

    if (!name || !sizes || !Array.isArray(sizes) || sizes.length === 0) {
        return res.status(400).json({ success: false, error: 'Name and at least one size with price are required' });
    }

    try {
        const data = readDataFile();
        
        // Check if product already exists
        if (data.some(p => p.name === name)) {
            return res.status(400).json({ success: false, error: 'Product already exists' });
        }

        // Validate sizes
        const validSizes = sizes.filter(size => size.size && size.price !== undefined);
        if (validSizes.length === 0) {
            return res.status(400).json({ success: false, error: 'At least one valid size with price is required' });
        }

        // Add new product
        data.push({
            name,
            sizes: validSizes.map(size => ({
                size: size.size,
                price: Number(size.price)
            })),
            options: options || [],
            description
        });

        // Save to file
        if (!writeDataFile(data)) {
            return res.status(500).json({ success: false, error: 'Failed to save product' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error adding product:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update product endpoint
app.put('/api/products/:name', (req: Request, res: Response): Response => {
    const { name } = req.params;
    const { sizes, options, description } = req.body;

    if (!name || !sizes || !Array.isArray(sizes) || sizes.length === 0) {
        return res.status(400).json({ success: false, error: 'Name and at least one size with price are required' });
    }

    try {
        const data = readDataFile();
        
        // Find the product to update
        const index = data.findIndex(p => p.name === name);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Validate sizes
        const validSizes = sizes.filter(size => size.size && size.price !== undefined);
        if (validSizes.length === 0) {
            return res.status(400).json({ success: false, error: 'At least one valid size with price is required' });
        }

        // Update the product
        data[index] = {
            ...data[index],
            sizes: validSizes.map(size => ({
                size: size.size,
                price: Number(size.price)
            })),
            options: options || [],
            description
        };

        // Save to file
        if (!writeDataFile(data)) {
            return res.status(500).json({ success: false, error: 'Failed to save product' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete product endpoint
app.delete('/api/products/:name?', isAuthenticated, (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        if (!name) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const data = readDataFile();
        const index = data.findIndex(product => product.name === name);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        data.splice(index, 1);
        if (!writeDataFile(data)) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err: Error & { code?: string }) => {
    if (err.code === 'EACCES') {
        console.error(`Port ${PORT} requires elevated privileges`);
    } else {
        console.error('Error starting server:', err);
    }
});