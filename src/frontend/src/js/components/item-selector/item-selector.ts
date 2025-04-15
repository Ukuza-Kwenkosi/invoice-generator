import { apiService } from '../../services/api';
import { Product, Size, SelectedItem } from '../../models/types';

export class ItemSelectorComponent {
    private element: HTMLElement;
    private products: Product[] = [];
    private selectedProduct: Product | null = null;
    private selectedSize: Size | null = null;
    private selectedOption: string | null = null;
    private quantity: number = 1;

    constructor() {
        const template = document.getElementById('itemSelectorTemplate') as HTMLTemplateElement;
        if (!template) {
            throw new Error('Item selector template not found');
        }
        const content = template.content.cloneNode(true) as DocumentFragment;
        this.element = content.firstElementChild as HTMLElement;
        this.loadProducts();
    }

    private async loadProducts(): Promise<void> {
        try {
            const apiProducts = await apiService.getProducts();
            this.products = apiProducts.map(product => ({
                name: product.name,
                description: product.description,
                sizes: product.sizes.map(size => ({
                    size,
                    price: product.price,
                    options: []
                })),
                options: []
            }));
            const productSelect = this.element.querySelector('.product-select');
            if (productSelect) {
                const productOptions = this.products
                    .map(product => `<option value="${product.name}">${product.name}</option>`)
                    .join('');
                productSelect.innerHTML = '<option value="">Select a product</option>' + productOptions;
            }
            this.initializeEventListeners();
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    }

    private initializeEventListeners(): void {
        const productSelect = this.element.querySelector('.product-select') as HTMLSelectElement;
        const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
        const optionSelect = this.element.querySelector('.option-select') as HTMLSelectElement;
        const quantityInput = this.element.querySelector('.quantity-input') as HTMLInputElement;

        if (!productSelect || !sizeSelect || !optionSelect || !quantityInput) {
            console.error('Required elements not found in template');
            return;
        }

        // Remove any existing event listeners
        productSelect.replaceWith(productSelect.cloneNode(true));
        sizeSelect.replaceWith(sizeSelect.cloneNode(true));
        optionSelect.replaceWith(optionSelect.cloneNode(true));
        quantityInput.replaceWith(quantityInput.cloneNode(true));

        // Get fresh references to the elements
        const newProductSelect = this.element.querySelector('.product-select') as HTMLSelectElement;
        const newSizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
        const newOptionSelect = this.element.querySelector('.option-select') as HTMLSelectElement;
        const newQuantityInput = this.element.querySelector('.quantity-input') as HTMLInputElement;

        // Add event listeners
        newProductSelect.addEventListener('change', () => this.handleProductChange(newProductSelect.value));
        newSizeSelect.addEventListener('change', () => this.handleSizeChange(newSizeSelect.value));
        newOptionSelect.addEventListener('change', () => this.handleOptionChange(newOptionSelect.value));
        newQuantityInput.addEventListener('change', () => this.handleQuantityChange(parseInt(newQuantityInput.value)));
    }

    private handleProductChange(productName: string): void {
        this.selectedProduct = this.products.find(p => p.name === productName) || null;
        this.selectedSize = null;
        this.selectedOption = null;
        this.updateSizeOptions();
        this.updateOptionOptions();
        this.updatePrice();

        if (this.selectedProduct) {
            document.dispatchEvent(new Event('productSelected'));
        }
    }

    private handleSizeChange(sizeValue: string): void {
        if (this.selectedProduct) {
            this.selectedSize = this.selectedProduct.sizes.find(s => s.size === sizeValue) || null;
            this.updatePrice();

            const productSelect = this.element.querySelector('.product-select') as HTMLSelectElement;
            const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
            const optionSelect = this.element.querySelector('.option-select') as HTMLSelectElement;
            const quantityInput = this.element.querySelector('.quantity-input') as HTMLInputElement;

            if (productSelect.value && sizeSelect.value && this.selectedSize) {
                const existingItem = (window as any).selectedItems.find(
                    (item: SelectedItem) => item.name === productSelect.value && item.size === sizeSelect.value
                );

                if (existingItem) {
                    existingItem.price = this.selectedSize.price;
                } else {
                    (window as any).selectedItems.push({
                        name: productSelect.value,
                        size: sizeSelect.value,
                        option: optionSelect.value || undefined,
                        quantity: parseInt(quantityInput.value) || 1,
                        price: this.selectedSize.price
                    });
                }
            }
        }
    }

    private handleOptionChange(optionValue: string): void {
        this.selectedOption = optionValue || null;
        this.updatePrice();
    }

    private handleQuantityChange(newQuantity: number): void {
        this.quantity = newQuantity;
        this.updatePrice();

        const productSelect = this.element.querySelector('.product-select') as HTMLSelectElement;
        const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;

        if (productSelect.value && sizeSelect.value && this.selectedSize) {
            const existingItem = (window as any).selectedItems.find(
                (item: SelectedItem) => item.name === productSelect.value && item.size === sizeSelect.value
            );

            if (existingItem) {
                existingItem.quantity = newQuantity;
            }
        }
    }

    private updateSizeOptions(): void {
        const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
        const sizeControl = this.element.querySelector('.size-control') as HTMLElement;
        const optionControl = this.element.querySelector('.option-control') as HTMLElement;
        const quantityControl = this.element.querySelector('.quantity-control') as HTMLElement;
        const priceControl = this.element.querySelector('.price-control') as HTMLElement;

        if (!sizeSelect || !sizeControl || !optionControl || !quantityControl || !priceControl) {
            console.error('Required elements not found for size options');
            return;
        }

        sizeSelect.innerHTML = '<option value="">Select a size</option>';
        sizeControl.classList.add('hidden');
        optionControl.classList.add('hidden');
        quantityControl.classList.add('hidden');
        priceControl.classList.add('hidden');

        if (this.selectedProduct && this.selectedProduct.sizes.length > 0) {
            sizeControl.classList.remove('hidden');
            quantityControl.classList.remove('hidden');
            priceControl.classList.remove('hidden');

            this.selectedProduct.sizes.forEach((size) => {
                const option = document.createElement('option');
                option.value = size.size;
                const formattedPrice = size.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                option.textContent = `${size.size} - R ${formattedPrice}`;
                option.dataset.rawPrice = size.price.toString();
                sizeSelect.appendChild(option);
            });

            sizeSelect.value = this.selectedProduct.sizes[0].size;
            this.handleSizeChange(this.selectedProduct.sizes[0].size);
        }
    }

    private updateOptionOptions(): void {
        const optionSelect = this.element.querySelector('.option-select') as HTMLSelectElement;
        const optionControl = this.element.querySelector('.option-control') as HTMLElement;

        if (!optionSelect || !optionControl) {
            console.error('Required elements not found for option options');
            return;
        }

        optionSelect.innerHTML = '<option value="">Select an option</option>';
        optionControl.classList.add('hidden');

        if (this.selectedProduct && this.selectedProduct.options && this.selectedProduct.options.length > 0) {
            optionControl.classList.remove('hidden');
            this.selectedProduct.options.forEach((option) => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                optionSelect.appendChild(optionElement);
            });

            optionSelect.value = this.selectedProduct.options[0];
            this.handleOptionChange(this.selectedProduct.options[0]);
        }
    }

    private updatePrice(): void {
        const priceLabel = this.element.querySelector('.price-label');
        if (!priceLabel) {
            console.error('Price label element not found');
            return;
        }

        let totalPrice = 0;
        if (this.selectedSize) {
            totalPrice = this.selectedSize.price * this.quantity;
            if (this.selectedOption && this.selectedSize.options) {
                const optionPrice = this.selectedSize.options.find(opt => opt.name === this.selectedOption)?.price || 0;
                totalPrice += optionPrice * this.quantity;
            }
        }

        const formattedPrice = totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        priceLabel.textContent = `R ${formattedPrice}`;
    }

    public getElement(): HTMLElement {
        return this.element;
    }
} 