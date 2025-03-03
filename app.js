const express = require('express');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

// Set up EJS for templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
console.log('Views directory:', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.render('index');
});

// Generate invoice route
app.post('/generate-invoice', async (req, res) => {
    const { customer, items } = req.body;

    // Convert items to the correct format
    const formattedItems = items.map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity), // Convert to number
        price: parseFloat(item.price) // Convert to number
    }));

    const formatter = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
    });

    // Calculate the total
    let total = formattedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    console.log(total);

    // Read the HTML template from the templates folder
    const templatePath = path.join(__dirname, 'templates', 'invoice-template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders with actual data
    let quoteNo = Math.floor(Math.random() * 1000).toString();
    let date = new Date().toLocaleDateString();

    // Convert the logo image to Base64
    const logoPath = path.join(__dirname, 'public', 'images', 'company_logo.png');
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });

    htmlContent = htmlContent
        .replace(/\[LOGO_PATH\]/g, `data:image/png;base64,${logoBase64}`) // Embed Base64 image
        .replace(/\[Client_Name\]/g, customer.name)
        .replace(/\[Quote_Date\]/g, date)
        .replace(/\[Quote_Number\]/g, quoteNo)
        .replace(/\[Quote_Phone\]/g, customer.phone)
        .replace(/\[Quote_Email\]/g, customer.email)
        .replace(
            /\[Itemized_Table\]/g,
            formattedItems
                .map(
                    (item, index) => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.price}</td>
                        <td>${item.quantity}</td>
                        <td>${formatter.format(item.price * 1.15)}</td>
                    </tr>
                `
                )
                .join('')
        )
        .replace(/\[Total_Price\]/g, `${formatter.format(total)}`);

    // Generate PDF and send as response
    await generateAndOpenPDF(quoteNo + "-" + date + "-" + customer.name, htmlContent, res);
});

async function generateAndOpenPDF(fileName, htmlContent, res) {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });

        console.log('PDF Buffer Length:', pdfBuffer.length);

        await browser.close();

        fileName = fileName.replace(/[<>:"/\\|?*]/g, '_');
        const filePath = path.join(__dirname, fileName + '.pdf');

        // Save the PDF buffer to a file
        fs.writeFileSync(filePath, pdfBuffer);

        // Send the PDF file back to the client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=' + fileName + '.pdf'); // 'inline' opens in the browser
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending PDF:', err);
                res.status(500).send('Error sending PDF.');
            } else {
                // Delete the file after sending it to the client
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting file:', unlinkErr);
                    } else {
                        console.log(`File deleted: ${filePath}`);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF.');
    }
}

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});