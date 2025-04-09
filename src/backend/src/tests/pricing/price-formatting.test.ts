import { describe, test, expect } from '@jest/globals';
import { formatCurrency } from '../../utils/formatting.js';
import type { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Test the formatCurrency function
describe('formatCurrency function', () => {
    test('formats whole numbers without cents', () => {
        expect(formatCurrency(14496)).toBe('R 14 496.00');
        expect(formatCurrency(1000)).toBe('R 1 000.00');
        expect(formatCurrency(1000000)).toBe('R 1 000 000.00');
    });

    test('formats numbers with cents', () => {
        expect(formatCurrency(14496.50)).toBe('R 14 496.50');
        expect(formatCurrency(1000.99)).toBe('R 1 000.99');
    });

    test('handles zero values', () => {
        expect(formatCurrency(0)).toBe('R 0.00');
        expect(formatCurrency(0.00)).toBe('R 0.00');
    });
});

// Test the invoice generation process
describe('Invoice Generation', () => {
    // Mock product data
    const testProduct = {
        name: "Classic Magnetic Steel - Folding",
        sizes: [
            {
                size: "1.14m h x 3.6m",
                price: 14496
            }
        ],
        description: "Steel writing board c/w aluminium chalkrail"
    };

    // Mock invoice data
    const testInvoiceData = {
        customerName: "Test Customer",
        customerAddress: "Test Address",
        customerEmail: "test@example.com",
        customerPhone: "1234567890",
        items: [{
            name: testProduct.name,
            size: testProduct.sizes[0].size,
            quantity: 2,
            price: testProduct.sizes[0].price,
            description: testProduct.description
        }]
    };

    test('calculates total correctly', () => {
        const total = testInvoiceData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        expect(total).toBe(28992); // 14496 * 2
    });

    test('formats prices in PDF table correctly', () => {
        const tableRows: string[][] = [];
        let totalAmount = 0;

        // Process items as in the actual code
        testInvoiceData.items.forEach(item => {
            const total = item.price * item.quantity;
            totalAmount += total;
            
            const description = `${item.name}${item.description ? ` - ${item.description}` : ''}${item.size ? ` - ${item.size}` : ''}`;
            const formattedPrice = formatCurrency(item.price).replace('R ', '');
            const formattedTotal = formatCurrency(total);
            
            tableRows.push([
                description,
                formattedPrice,
                item.quantity.toString(),
                formattedTotal
            ]);
        });

        // Verify the formatted values
        expect(tableRows[0][0]).toBe("Classic Magnetic Steel - Folding - Steel writing board c/w aluminium chalkrail - 1.14m h x 3.6m");
        expect(tableRows[0][1]).toBe("14 496.00");
        expect(tableRows[0][2]).toBe("2");
        expect(tableRows[0][3]).toBe("R 28 992.00");
    });

    test('handles multiple items correctly', () => {
        const multipleItemsData = {
            ...testInvoiceData,
            items: [
                ...testInvoiceData.items,
                {
                    name: "Carpet Pinboard",
                    size: "1.2m h x 2.4m w",
                    quantity: 1,
                    price: 2136,
                    description: "Carpet pinboard with Aluminium frame"
                }
            ]
        };

        const total = multipleItemsData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        expect(total).toBe(31128); // (14496 * 2) + (2136 * 1)

        // Process items as in the actual code
        const tableRows: string[][] = [];
        multipleItemsData.items.forEach(item => {
            const total = item.price * item.quantity;
            const description = `${item.name}${item.description ? ` - ${item.description}` : ''}${item.size ? ` - ${item.size}` : ''}`;
            const formattedPrice = formatCurrency(item.price).replace('R ', '');
            const formattedTotal = formatCurrency(total);
            
            tableRows.push([
                description,
                formattedPrice,
                item.quantity.toString(),
                formattedTotal
            ]);
        });

        // Verify the formatted values
        expect(tableRows[0][3]).toBe("R 28 992.00"); // First item total
        expect(tableRows[1][3]).toBe("R 2 136.00");  // Second item total
    });
});

describe('Price Calculation', () => {
    test('should calculate price correctly', () => {
        const price = 213600;
        console.log('Input price:', price);
        const result = formatCurrency(price);
        console.log('Formatted result:', result);
        expect(result).toBe('R 213 600.00');
    });

    test('should format total amount correctly', () => {
        const price = 213600;
        const quantity = 100;
        console.log('Price:', price);
        console.log('Quantity:', quantity);
        const total = price * quantity;
        console.log('Total:', total);
        
        const formattedTotal = formatCurrency(total);
        console.log('Formatted total:', formattedTotal);
        
        expect(formattedTotal).toBe('R 21 360 000.00');
    });

    test('should handle total price from frontend correctly', () => {
        // This is what we receive from frontend (already multiplied by quantity)
        const totalPriceFromFrontend = 213600;
        const quantity = 1;
        console.log('Total price from frontend:', totalPriceFromFrontend);
        console.log('Quantity:', quantity);
        
        // Calculate final price
        const finalPrice = totalPriceFromFrontend;
        console.log('Final price (should be same as frontend total):', finalPrice);
        
        const formattedPrice = formatCurrency(finalPrice);
        console.log('Formatted price:', formattedPrice);
        
        expect(formattedPrice).toBe('R 213 600.00');
    });
}); 