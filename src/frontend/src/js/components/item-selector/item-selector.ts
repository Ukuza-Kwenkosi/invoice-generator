import { apiService } from '../../services/api';
import { Product, Size, SelectedItem } from '../../models/types';

export class ItemSelectorComponent {
    private element: HTMLElement;
    private products: Product[] = [];
    private selectedProduct: Product | null = null;
    private selectedSize: Size | null = null;
    private selectedOption: string | null = null;
    private quantity: number = 1;
    private nextButton: HTMLElement | null = null;
    private selectedItems: SelectedItem[] = [];

    constructor() {
        // Get the container where the template is included
        const container = document.getElementById('itemsContainer');
        if (!container) {
            throw new Error('Items container not found');
        }
        
        // Use the first child of the container as our element
        this.element = container.firstElementChild as HTMLElement;
        if (!this.element) {
            throw new Error('Item selector template not found');
        }

        // Get the next button
        this.nextButton = document.getElementById('nextBtn');
        if (this.nextButton) {
            this.nextButton.classList.add('hidden');
        }
        
        // Hide all controls initially
        this.toggleControls(false);
        
        this.initializeComponent();
    }

    private updateCartCount(): void {
        const countElement = document.querySelector('.cart-count');
        if (countElement) {
            countElement.textContent = this.selectedItems.length.toString();
        }
    }

    private async initializeComponent(): Promise<void> {
        await this.loadProducts();
        this.updateProductOptions();
        this.initializeEventListeners();
    }

    private async loadProducts(): Promise<void> {
        try {
            this.products = await apiService.getProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    }

    private updateProductOptions(): void {
        const productSelect = this.element.querySelector('.product-select') as HTMLSelectElement;
        if (!productSelect) return;

        // Clear existing options
        productSelect.innerHTML = '';
        
        // Add placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Select a product';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        productSelect.appendChild(placeholderOption);

        // Add product options
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });

        // Add change event listener
        productSelect.addEventListener('change', () => this.handleProductChange(productSelect));
    }

    private initializeEventListeners(): void {
        console.log('Initializing event listeners...');
        
        // Add event listener for quantity input
        const quantityInput = this.element.querySelector('.quantity-input') as HTMLInputElement;
        if (quantityInput) {
            quantityInput.addEventListener('change', () => this.handleQuantityChange(quantityInput));
        }

        // Add event listener for size select
        const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
        if (sizeSelect) {
            sizeSelect.addEventListener('change', () => this.handleSizeChange(sizeSelect));
        }

        // Add event listener for option select
        const optionSelect = this.element.querySelector('.option-select') as HTMLSelectElement;
        if (optionSelect) {
            optionSelect.addEventListener('change', () => this.handleOptionChange(optionSelect));
        }

        // Add event listener for add item button
        const addItemButton = this.element.querySelector('.add-item-btn') as HTMLButtonElement;
        console.log('Add item button found:', addItemButton);
        if (addItemButton) {
            addItemButton.addEventListener('click', () => {
                console.log('Add item button clicked');
                this.handleAddItem();
            });
        }

        // Add event listener for next button
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                const step1 = document.getElementById('step1');
                const step2 = document.getElementById('step2');
                if (step1 && step2) {
                    step1.classList.add('hidden');
                    step2.classList.remove('hidden');
                }
            });
        }
    }

    private toggleControls(show: boolean): void {
        const controls = [
            '.size-control',
            '.option-control',
            '.quantity-control',
            '.price-control',
            '.add-item-control'
        ];

        controls.forEach(control => {
            const element = this.element.querySelector(control);
            if (element) {
                if (show) {
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }
        });
    }

    private updatePrice(): void {
        const priceLabel = this.element.querySelector('.price-label');
        if (!priceLabel || !this.selectedSize) return;

        const price = this.selectedSize.price * this.quantity;
        priceLabel.textContent = `R ${price.toFixed(2)}`;
    }

    public handleProductChange(select: HTMLSelectElement): void {
        // Hide all controls initially
        this.toggleControls(false);

        // If no product selected, return
        if (!select.value) return;

        this.selectedProduct = this.products.find(p => p.name === select.value) || null;
        if (!this.selectedProduct) return;

        const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
        if (sizeSelect && this.selectedProduct.sizes.length) {
            // Clear and add size options
            sizeSelect.innerHTML = '';
            this.selectedProduct.sizes.forEach(size => {
                const option = document.createElement('option');
                option.value = size.size;
                option.textContent = `${size.size} - R ${size.price.toFixed(2)}`;
                option.dataset.rawPrice = size.price.toString();
                sizeSelect.appendChild(option);
            });

            // Show all controls
            this.toggleControls(true);

            // Auto-select first size
            sizeSelect.value = this.selectedProduct.sizes[0].size;
            this.handleSizeChange(sizeSelect);

            // Show options if product has options
            if (this.selectedProduct.options?.length) {
                const optionSelect = this.element.querySelector('.option-select') as HTMLSelectElement;
                if (optionSelect) {
                    // Clear existing options
                    optionSelect.innerHTML = '';

                    // Add option options
                    this.selectedProduct.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        optionSelect.appendChild(optionElement);
                    });

                    // Show option control
                    const optionControl = this.element.querySelector('.option-control');
                    if (optionControl) {
                        optionControl.classList.remove('hidden');
                    }
                }
            }
        }
    }

    public handleSizeChange(select: HTMLSelectElement): void {
        if (!this.selectedProduct) return;

        this.selectedSize = this.selectedProduct.sizes.find(s => s.size === select.value) || null;
        if (!this.selectedSize) return;

        this.updatePrice();
    }

    public handleOptionChange(select: HTMLSelectElement): void {
        this.selectedOption = select.value || null;
    }

    public handleQuantityChange(input: HTMLInputElement): void {
        this.quantity = parseInt(input.value);
        this.updatePrice();
    }

    public handleAddItem(): void {
        if (!this.selectedProduct || !this.selectedSize) return;

        const item: SelectedItem = {
            name: this.selectedProduct.name,
            size: this.selectedSize.size,
            quantity: this.quantity,
            price: this.selectedSize.price,
            option: this.selectedOption || undefined,
            description: this.selectedProduct.description
        };

        this.selectedItems.push(item);
        window.selectedItems = this.selectedItems;
        this.updateCartCount();

        // Show the next button after adding an item
        if (this.nextButton) {
            this.nextButton.classList.remove('hidden');
        }

        // Reset form
        const productSelect = this.element.querySelector('.product-select') as HTMLSelectElement;
        if (productSelect) {
            productSelect.value = '';
            this.selectedProduct = null;
            this.selectedSize = null;
            this.selectedOption = null;
            this.quantity = 1;
            this.toggleControls(false);
        }
    }

    public getSelectedItems(): SelectedItem[] {
        return this.selectedItems;
    }

    public getElement(): HTMLElement {
        return this.element;
    }
} 