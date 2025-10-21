import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as fs from 'fs';
import * as path from 'path';
import { formatCurrency } from '../utils/formatting';

// Augment jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable?: { finalY: number };
  }
}

interface InvoiceItem {
    name: string;
    quantity: number;
    price: number;
    description?: string;
    size?: string;
    option?: string;
}

interface InvoiceRequest {
    customerName: string;
    customerAddress: string;
    customerEmail: string;
    customerPhone: string;
    items: InvoiceItem[];
}

const json = (c: number, b: any) => ({
  statusCode: c,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(b),
});

export const generate: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!event.body) {
      return json(400, { error: 'Invalid request data', details: 'Request body is required' });
    }

    const { customerName, customerAddress, customerEmail, customerPhone, items } = JSON.parse(event.body) as InvoiceRequest;

    // Validate customer details
    const missingFields = [];
    if (!customerName) missingFields.push('Customer Name');
    if (!customerAddress) missingFields.push('Customer Address');
    if (!customerEmail) missingFields.push('Customer Email');
    if (!customerPhone) missingFields.push('Customer Phone');

    if (missingFields.length > 0) {
      const error = `Missing required customer details: ${missingFields.join(', ')}`;
      return json(400, {
        error: 'Invalid request data',
        details: error
      });
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return json(400, {
        error: 'Invalid request data',
        details: 'At least one item is required'
      });
    }

    // Validate each item
    const invalidItems = items.map((item, index) => {
      const issues = [];
      
      if (!item.name) issues.push('product name is missing');
      if (!item.size) issues.push('size is not selected');
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
        `Item #${item!.itemNumber}: ${item!.issues.join(', ')}`
      ).join('\n');

      return json(400, {
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
      const logoPath = path.join(__dirname, '../images', 'company_logo.png');
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
      doc.addImage(logoBase64, 'PNG', leftMargin - 10, topMargin, 91, 46);
    } catch (error) {
      console.error('Failed to add company logo:', error);
      return json(500, { 
        error: 'Failed to generate invoice', 
        details: `Failed to add company logo to PDF: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
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
    doc.text(`Quote #: ${quoteNo}`, rightMargin, topMargin + customerInfoTopMargin, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, rightMargin, topMargin + customerInfoTopMargin + 5, { align: 'right' });
    
    doc.text(`Name: ${customerName}`, leftMargin, topMargin + customerInfoTopMargin);
    doc.text(`Address: ${customerAddress || ''}`, leftMargin, topMargin + customerInfoTopMargin + 5);
    doc.text(`Email: ${customerEmail}`, leftMargin, topMargin + customerInfoTopMargin + 10);
    doc.text(`Phone: ${customerPhone}`, leftMargin, topMargin + customerInfoTopMargin + 15);

    // Prepare table data
    const tableColumn = ["Description", "Price", "QTY", "Total"];
    const tableRows: string[][] = [];
    let totalAmount = 0;
    
    items.forEach((item: InvoiceItem) => {
      const price = Math.round(item.price);
      const total = price * item.quantity;
      totalAmount += total;
      
      const description = `${item.name}${item.description ? ` - ${item.description}` : ''}${item.size ? ` - ${item.size}` : ''}${item.option ? ` - ${item.option}` : ''}`;
      
      const formattedPrice = formatCurrency(price).replace('R ', '');
      const formattedTotal = formatCurrency(total);
      
      tableRows.push([
        description,
        formattedPrice,
        item.quantity.toString(),
        formattedTotal
      ]);
    });

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

    const finalY = doc.lastAutoTable?.finalY || (topMargin + 115);

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

    // Generate PDF as base64
    const pdfBuffer = doc.output('arraybuffer');
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${quoteNo}.pdf`,
      },
      isBase64Encoded: true,
      body: base64Pdf,
    };
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return json(500, { 
      error: 'Failed to generate invoice', 
      details: error.message || 'Unknown error' 
    });
  }
};
