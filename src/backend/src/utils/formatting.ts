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
    
    // Always show decimal places
    return `R ${formattedWhole}.${decimal}`;
} 