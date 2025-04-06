import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Enable CORS
app.use(cors({
    origin: ['http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    }
    catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({ error: 'Failed to load products', details: error.message });
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
        if (!customerName)
            missingFields.push('Customer Name');
        if (!customerAddress)
            missingFields.push('Customer Address');
        if (!customerEmail)
            missingFields.push('Customer Email');
        if (!customerPhone)
            missingFields.push('Customer Phone');
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
            if (!item.name)
                issues.push('product name is missing');
            if (!item.size)
                issues.push('size is not selected');
            // Check numeric fields
            if (!item.quantity)
                issues.push('quantity is missing');
            else if (item.quantity <= 0)
                issues.push('quantity must be greater than 0');
            if (!item.price)
                issues.push('price is missing');
            else if (item.price <= 0)
                issues.push('price must be greater than 0');
            return issues.length > 0 ? {
                itemNumber: index + 1,
                issues
            } : null;
        }).filter(item => item !== null);
        if (invalidItems.length > 0) {
            const errorDetails = invalidItems.map(item => `Item #${item.itemNumber}: ${item.issues.join(', ')}`).join('\n');
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
        }
        catch (error) {
            throw new Error(`Failed to add company logo to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Add company details
        try {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('Ukuza Kwenkosi Enterprises trading as Ukuza Kivenkosi Enterprises', rightMargin, topMargin + 15, { align: 'right' });
            doc.text('Reg No 2012/750142/07 TAX No. 9278518254', rightMargin, topMargin + 20, { align: 'right' });
            doc.text('E2144 Osizeni, Newcastle, KiaZulu-Natal, 2952', rightMargin, topMargin + 25, { align: 'right' });
        }
        catch (error) {
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
        }
        catch (error) {
            throw new Error('Failed to add customer details to PDF');
        }
        // Prepare table data
        try {
            const tableColumn = ["Description", "Price", "QTY", "Total"];
            const tableRows = [];
            let totalAmount = 0;
            items.forEach((item, index) => {
                if (!item.name || !item.quantity || !item.price) {
                    throw new Error(`Invalid item data at index ${index}: Missing required fields`);
                }
                const total = item.price * item.quantity;
                totalAmount += total;
                const description = `${item.name}${item.description ? ` - ${item.description}` : ''}${item.size ? ` - ${item.size}` : ''}${item.option ? ` - ${item.option}` : ''}`;
                // Format price with spaces (without R)
                const formattedPrice = item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                // Format total with spaces (with R)
                const formattedTotal = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                tableRows.push([
                    description,
                    formattedPrice,
                    item.quantity.toString(),
                    `R ${formattedTotal}`
                ]);
            });
            // Format total amount with spaces (with R)
            const formattedTotalAmount = totalAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
                    fontSize: 10,
                    cellPadding: 2
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                foot: [['', '',
                        { content: 'Total', styles: { halign: 'center', fontSize: 10, cellPadding: 2 } },
                        { content: `R ${formattedTotalAmount}`, styles: { halign: 'center', fontSize: 10, cellPadding: 2 } }
                    ]],
                footStyles: {
                    fillColor: [255, 99, 71],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 10,
                    cellPadding: 2
                },
                columnStyles: {
                    0: { cellWidth: 'auto', cellPadding: 2 },
                    1: { cellWidth: 25, halign: 'center', cellPadding: 4 },
                    2: { cellWidth: 12, halign: 'center', cellPadding: 4 },
                    3: { cellWidth: 30, halign: 'center', cellPadding: 4 }
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 2
                }
            });
        }
        catch (error) {
            throw new Error('Failed to generate table');
        }
        try {
            const finalY = doc.lastAutoTable.finalY || (topMargin + 115);
            // Add bank details
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Banking Details 1', leftMargin, finalY + 37);
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
            doc.text('2. Payment terms: 50% deposit required to confirm order.', leftMargin, termsY + 10);
            doc.text('3. Delivery time: 2-3 weeks after confirmation of order.', leftMargin, termsY + 15);
            doc.text('4. Terms are strictly Nett for payment of a 50% deposit with order and 50% balance prior to collection.', leftMargin, termsY + 20);
        }
        catch (error) {
            throw new Error('Failed to add footer details to PDF');
        }
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${quoteNo}.pdf`);
        // Send the PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
    }
    catch (error) {
        res.status(500).json({
            error: 'Error generating invoice',
            details: error.message
        });
    }
});
// Start the server
app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
