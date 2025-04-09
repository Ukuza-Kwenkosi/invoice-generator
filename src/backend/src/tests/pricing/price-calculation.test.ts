import { describe, test, expect } from '@jest/globals';
import { formatCurrency } from '../../utils/formatting.js';

describe('Price Calculation', () => {
    test('should calculate price correctly', () => {
        const price = 213600;
        console.log('Input price:', price);
        const formattedResult = formatCurrency(price);
        console.log('Formatted result:', formattedResult);
        expect(formattedResult).toBe('R 213 600.00');
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

    test('should format price with thousands separator', () => {
        const price = 1234567;
        const result = formatCurrency(price);
        expect(result).toBe('R 1 234 567.00');
    });

    test('should handle zero price', () => {
        const price = 0;
        const result = formatCurrency(price);
        expect(result).toBe('R 0.00');
    });

    test('should handle small numbers', () => {
        const price = 123;
        const result = formatCurrency(price);
        expect(result).toBe('R 123.00');
    });

    test('should handle large numbers', () => {
        const price = 9999999;
        const result = formatCurrency(price);
        expect(result).toBe('R 9 999 999.00');
    });
}); 