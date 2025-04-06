private updatePrice() {
    const priceInput = this.shadowRoot?.querySelector('.price-input') as HTMLInputElement;
    const quantityInput = this.shadowRoot?.querySelector('.quantity-input') as HTMLInputElement;
    const basePrice = this.getBasePrice();
    const quantity = parseInt(quantityInput.value) || 0;
    const total = basePrice * quantity;
    
    if (priceInput) {
        priceInput.value = total.toFixed(2);
    }
}

private getData(): InvoiceItem {
    const nameInput = this.shadowRoot?.querySelector('.name-input') as HTMLInputElement;
    const descriptionInput = this.shadowRoot?.querySelector('.description-input') as HTMLInputElement;
    const sizeInput = this.shadowRoot?.querySelector('.size-input') as HTMLSelectElement;
    const optionInput = this.shadowRoot?.querySelector('.option-input') as HTMLSelectElement;
    const quantityInput = this.shadowRoot?.querySelector('.quantity-input') as HTMLInputElement;
    
    return {
        name: nameInput.value,
        description: descriptionInput.value,
        size: sizeInput.value,
        option: optionInput.value,
        quantity: parseInt(quantityInput.value) || 0,
        price: this.getBasePrice() // Send base price instead of total
    };
} 