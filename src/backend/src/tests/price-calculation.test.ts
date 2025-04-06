import { formatCurrency } from '../server.js';

describe('Price Calculation', () => {
    test('should calculate price correctly', () => {
        const price = 213600;
        console.log('Input price:', price);
        const result = formatCurrency(price);
        console.log('Formatted result:', result);
        expect(result).toBe('R 213 600');
    });

    test('should format total amount correctly', () => {
        const price = 213600;
        const quantity = 100;
        const total = price * quantity;
        
        console.log('Price:', price);
        console.log('Quantity:', quantity);
        console.log('Total:', total);
        
        const formattedTotal = formatCurrency(total);
        console.log('Formatted total:', formattedTotal);
        
        expect(formattedTotal).toBe('R 213 600');
    });

    test('should handle total price from frontend correctly', () => {
        // This is what we receive from frontend (already multiplied by quantity)
        const totalPriceFromFrontend = 213600;
        const quantity = 1;
        
        console.log('Total price from frontend:', totalPriceFromFrontend);
        console.log('Quantity:', quantity);
        
        // We should NOT multiply again since frontend already did it
        const finalPrice = totalPriceFromFrontend;
        console.log('Final price (should be same as frontend total):', finalPrice);
        
        const formattedPrice = formatCurrency(finalPrice);
        console.log('Formatted price:', formattedPrice);
        
        expect(formattedPrice).toBe('R 213 600');
    });
}); 