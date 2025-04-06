import { Product } from '../models/types.js';

export class ItemSelectorComponent {
    private element: HTMLDivElement;
    private id: string;
    private products: Product[] = [];

    constructor(id: string, products: Product[]) {
        this.id = id;
        this.products = products;
        this.element = document.createElement('div');
        this.element.className = 'invoice-item';
        this.element.id = id;
        this.initializeComponent();
    }

    private async initializeComponent() {
        // Create the HTML structure
        this.element.innerHTML = `
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label for="${this.id}-product">Product</label>
                    <select class="form-control product-select" id="${this.id}-product" required>
                        <option value="">Select a product</option>
                    </select>
                    <div class="form-group description-group" style="display: none; margin-top: 10px;">
                        <label class="description-label">Description</label>
                        <div class="form-control product-description" style="
                            padding: 8px 12px;
                            background-color: #f8f9fa;
                            border-radius: 4px;
                            border: 1px solid #dee2e6;
                            font-size: 0.9em;
                            color: #495057;
                            height: 38px;
                            display: flex;
                            align-items: center;
                            line-height: 1.5;
                        "></div>
                    </div>
                </div>
                <div class="form-group col-md-6 size-group" style="display: none;">
                    <label for="${this.id}-size">Size</label>
                    <select class="form-control size-select" id="${this.id}-size" required>
                        <option value="">Select a size</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group col-md-6 option-group" style="display: none;">
                    <label for="${this.id}-option">Option</label>
                    <select class="form-control option-select" id="${this.id}-option" required>
                        <option value="">Select an option</option>
                    </select>
                </div>
                <div class="form-group col-md-3 quantity-group" style="display: none;">
                    <label for="${this.id}-quantity">Quantity</label>
                    <input type="number" class="form-control quantity-input" id="${this.id}-quantity" value="1" min="1" required>
                </div>
                <div class="form-group col-md-5 price-group" style="display: none;">
                    <div style="display: flex;align-items: center;justify-content: flex-end;margin-right: 121px;">
                        <label for="item1-price" style="margin-right: 10px;margin-top: 0;">Price:</label>
                        <input type="text" class="form-control price-input" id="item1-price" value="R0.00" readonly="" style="width: 79px;text-align: right;padding-right: 10px;">
                    </div>
                </div>
            </div>
        `;

        // Initialize products in dropdown
        this.initializeProducts();

        // Add event listeners
        this.addEventListeners();
    }

    private initializeProducts() {
        const select = this.element.querySelector('.product-select') as HTMLSelectElement;
        select.innerHTML = '<option value="">Select a product</option>';
        
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = product.name;
            select.appendChild(option);
        });
    }

    private updateSizes(product: Product) {
        const sizeGroup = this.element.querySelector('.size-group') as HTMLDivElement;
        const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
        const priceInput = this.element.querySelector('.price-input') as HTMLInputElement;
        sizeSelect.innerHTML = '';

        product.sizes.forEach((size, index) => {
            const option = document.createElement('option');
            option.value = size.size;
            
            // Store the raw price value in the dataset
            option.dataset.rawPrice = size.price.toString();
            
            // Format the price with spaces, only showing cents if non-zero
            const [whole, cents] = size.price.toFixed(2).split('.');
            const formattedWhole = whole
                .split('')
                .reverse()
                .join('')
                .match(/.{1,3}/g)
                ?.join(' ')
                .split('')
                .reverse()
                .join('') || whole;
            
            const formattedPrice = cents === '00' ? formattedWhole : `${formattedWhole}.${cents}`;
            option.textContent = `${size.size} - R ${formattedPrice}`;
            sizeSelect.appendChild(option);
            
            // Auto-select first size
            if (index === 0) {
                option.selected = true;
                // Set initial price when first size is selected
                const quantity = parseFloat((this.element.querySelector('.quantity-input') as HTMLInputElement).value) || 1;
                const total = size.price * quantity;
                
                // Store the raw numeric value in a data attribute
                priceInput.dataset.rawValue = total.toString();
                
                // Format the total with spaces, only showing cents if non-zero
                const [totalWhole, totalCents] = total.toFixed(2).split('.');
                const formattedTotalWhole = totalWhole
                    .split('')
                    .reverse()
                    .join('')
                    .match(/.{1,3}/g)
                    ?.join(' ')
                    .split('')
                    .reverse()
                    .join('') || totalWhole;
                
                const formattedTotal = totalCents === '00' ? formattedTotalWhole : `${formattedTotalWhole}.${totalCents}`;
                priceInput.value = `R ${formattedTotal}`;
            }
        });

        sizeGroup.style.display = 'block';
        this.showQuantityAndPrice();
        this.updatePrice();

        // Add change event listener to size select
        sizeSelect.addEventListener('change', () => {
            this.updatePrice();
        });
    }

    private updateOptions(product: Product) {
        const optionGroup = this.element.querySelector('.option-group') as HTMLDivElement;
        const optionSelect = this.element.querySelector('.option-select') as HTMLSelectElement;
        
        if (product.options && product.options.length > 0) {
            optionSelect.innerHTML = '';
            product.options.forEach((option, index) => {
                const optElement = document.createElement('option');
                optElement.value = option;
                optElement.textContent = option;
                optionSelect.appendChild(optElement);
                
                // Auto-select first option
                if (index === 0) {
                    optElement.selected = true;
                }
            });
            optionGroup.style.display = 'block';
        } else {
            optionGroup.style.display = 'none';
            optionSelect.innerHTML = '<option value="">No options available</option>';
        }
    }

    private showQuantityAndPrice() {
        const quantityGroup = this.element.querySelector('.quantity-group') as HTMLDivElement;
        const priceGroup = this.element.querySelector('.price-group') as HTMLDivElement;
        quantityGroup.style.display = 'block';
        priceGroup.style.display = 'block';
    }

    private addEventListeners() {
        const productSelect = this.element.querySelector('.product-select') as HTMLSelectElement;
        if (productSelect) {
            productSelect.addEventListener('change', () => {
                const selectedProduct = this.products.find(p => p.name === productSelect.value);
                const descriptionElement = this.element.querySelector('.product-description') as HTMLDivElement;
                const descriptionGroup = this.element.querySelector('.description-group') as HTMLDivElement;
                
                if (descriptionElement && descriptionGroup) {
                    if (selectedProduct?.description) {
                        descriptionElement.textContent = selectedProduct.description;
                        descriptionGroup.style.display = 'block';
                    } else {
                        descriptionElement.textContent = '';
                        descriptionGroup.style.display = 'none';
                    }
                }
                
                if (selectedProduct) {
                    this.updateSizes(selectedProduct);
                    this.updateOptions(selectedProduct);
                } else {
                    // Hide all dependent fields if no product is selected
                    const sizeGroup = this.element.querySelector('.size-group') as HTMLDivElement;
                    const optionGroup = this.element.querySelector('.option-group') as HTMLDivElement;
                    const quantityGroup = this.element.querySelector('.quantity-group') as HTMLDivElement;
                    const priceGroup = this.element.querySelector('.price-group') as HTMLDivElement;
                    
                    if (sizeGroup) sizeGroup.style.display = 'none';
                    if (optionGroup) optionGroup.style.display = 'none';
                    if (quantityGroup) quantityGroup.style.display = 'none';
                    if (priceGroup) priceGroup.style.display = 'none';
                    if (descriptionGroup) descriptionGroup.style.display = 'none';
                }
            });
        }

        const quantityInput = this.element.querySelector('.quantity-input') as HTMLInputElement;

        // When quantity changes, update total
        quantityInput.addEventListener('input', () => {
            this.updatePrice();
        });
    }

    private updatePrice() {
        const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
        const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
        const priceInput = this.element.querySelector('.price-input') as HTMLInputElement;
        const quantityInput = this.element.querySelector('.quantity-input') as HTMLInputElement;
        const quantity = parseFloat(quantityInput.value) || 1;

        if (selectedOption && selectedOption.dataset.rawPrice) {
            const basePrice = parseFloat(selectedOption.dataset.rawPrice);
            const total = basePrice * quantity;
            
            // Store the total in the data attribute
            priceInput.dataset.rawValue = total.toString();
            
            // Format the number with spaces, only showing cents if non-zero
            const [whole, cents] = total.toFixed(2).split('.');
            const formattedWhole = whole
                .split('')
                .reverse()
                .join('')
                .match(/.{1,3}/g)
                ?.join(' ')
                .split('')
                .reverse()
                .join('') || whole;
            
            const formattedTotal = cents === '00' ? formattedWhole : `${formattedWhole}.${cents}`;
            priceInput.value = `R ${formattedTotal}`;
        }
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }

    public getData() {
        const nameInput = this.element.querySelector('.product-select') as HTMLSelectElement;
        const descriptionElement = this.element.querySelector('.product-description') as HTMLDivElement;
        const sizeInput = this.element.querySelector('.size-select') as HTMLSelectElement;
        const optionInput = this.element.querySelector('.option-select') as HTMLSelectElement;
        const quantityInput = this.element.querySelector('.quantity-input') as HTMLInputElement;
        const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
        const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
        
        return {
            name: nameInput.value,
            description: descriptionElement.textContent || '',
            size: sizeInput.value,
            option: optionInput.value,
            quantity: parseInt(quantityInput.value) || 0,
            price: selectedOption ? parseFloat(selectedOption.dataset.rawPrice || '0') : 0 // Send base price
        };
    }
} 