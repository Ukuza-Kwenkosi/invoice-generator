import { ItemData } from '../models/types';

export class ItemSelectorComponent {
    private id: string;
    private element: HTMLElement;
    private dropdown: HTMLSelectElement;
    private descriptionGroup: HTMLElement;
    private description: HTMLElement;
    private sizeLabel: HTMLElement;
    private sizeDropdown: HTMLSelectElement;
    private optionLabel: HTMLElement;
    private optionDropdown: HTMLSelectElement;
    private quantityInput: HTMLInputElement;
    private priceLabel: HTMLElement;

    constructor(id: string) {
        this.id = id;
        const template = document.getElementById('itemSelectorTemplate') as HTMLTemplateElement;
        if (!template) {
            throw new Error('Item selector template not found');
        }
        
        // Clone the template content
        const content = template.content.cloneNode(true) as DocumentFragment;
        this.element = content.querySelector('.item') as HTMLElement;
        
        // Replace all instances of PLACEHOLDER with the actual ID
        const html = this.element.innerHTML.replace(/PLACEHOLDER/g, id);
        this.element.innerHTML = html;
        
        // Get references to elements
        this.dropdown = this.element.querySelector(`#item-dropdown-${id}`) as HTMLSelectElement;
        this.descriptionGroup = this.element.querySelector('.description-group') as HTMLElement;
        this.description = this.element.querySelector('.item-description') as HTMLElement;
        this.sizeLabel = this.element.querySelector('.size-label') as HTMLElement;
        this.sizeDropdown = this.element.querySelector(`#size-dropdown-${id}`) as HTMLSelectElement;
        this.optionLabel = this.element.querySelector('.option-label') as HTMLElement;
        this.optionDropdown = this.element.querySelector(`#option-dropdown-${id}`) as HTMLSelectElement;
        this.quantityInput = this.element.querySelector(`#quantity-${id}`) as HTMLInputElement;
        this.priceLabel = this.element.querySelector('#price') as HTMLElement;
        
        // Initially hide all controls except the item dropdown
        this.hideAllControls();
        
        this.setupEventListeners();
        this.loadData();
    }

    private hideAllControls(): void {
        this.descriptionGroup.style.display = 'none';
        this.sizeLabel.closest('.form-group')?.classList.add('hidden');
        this.optionLabel.closest('.form-group')?.classList.add('hidden');
        this.quantityInput.closest('.form-group')?.classList.add('hidden');
        this.priceLabel.style.display = 'none';
    }

    async loadData(): Promise<void> {
        try {
            const response = await fetch('/data.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data: ItemData[] = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format');
            }

            // Clear existing options except the default one
            while (this.dropdown.options.length > 1) {
                this.dropdown.remove(1);
            }

            // Populate the dropdown with options
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                
                // Store the complete item data
                option.dataset.itemData = JSON.stringify(item);
                
                this.dropdown.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading items data:', error);
            alert('Error loading items. Please refresh the page or try again later.');
        }
    }

    private setupEventListeners(): void {
        if (!this.dropdown || !this.sizeDropdown || !this.optionDropdown || !this.quantityInput || 
            !this.descriptionGroup || !this.description || !this.priceLabel || 
            !this.sizeLabel || !this.optionLabel) {
            throw new Error('Required elements not found in container');
        }

        // Bind event handlers to this instance
        this.dropdown.addEventListener('change', () => this.handleItemSelection());
        this.sizeDropdown.addEventListener('change', () => this.handleSizeSelection());
        this.optionDropdown.addEventListener('change', () => this.handleOptionSelection());
        this.quantityInput.addEventListener('input', () => this.checkItemSelection());
    }

    private handleItemSelection(): void {
        // Reset and hide all dependent fields
        this.descriptionGroup.style.display = 'none';
        this.description.textContent = '';
        this.sizeLabel.closest('.form-group')?.classList.add('hidden');
        this.optionLabel.closest('.form-group')?.classList.add('hidden');
        this.quantityInput.closest('.form-group')?.classList.add('hidden');
        this.priceLabel.style.display = 'none';
        this.sizeDropdown.innerHTML = '<option value="" disabled selected>Select size</option>';
        this.optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
        this.quantityInput.value = '';

        const selectedOption = this.dropdown.options[this.dropdown.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;

        try {
            const itemData = JSON.parse(selectedOption.dataset.itemData || '');
            
            // Show description if available
            if (itemData.description) {
                this.description.textContent = itemData.description;
                this.descriptionGroup.style.display = 'block';
            }

            // Handle items with only name and price (no size)
            if (itemData.price && !itemData.size && !itemData.sizes) {
                // Show price
                this.priceLabel.textContent = `Price: R${itemData.price.toFixed(2)}`;
                this.priceLabel.style.display = 'block';
                
                // Show quantity input directly
                this.quantityInput.closest('.form-group')?.classList.remove('hidden');
                
                // Update button states
                this.checkItemSelection();
            }
            // Handle items with fixed size/price
            else if (itemData.size && itemData.price) {
                // Show size dropdown
                this.sizeLabel.closest('.form-group')?.classList.remove('hidden');
                
                // Set the fixed size option
                this.sizeDropdown.innerHTML = `<option value="${itemData.size}">${itemData.size}</option>`;
                this.sizeDropdown.value = itemData.size;
                
                // Show price
                this.priceLabel.textContent = `Price: R${itemData.price.toFixed(2)}`;
                this.priceLabel.style.display = 'block';
                
                // Show quantity input directly for fixed-size items
                this.quantityInput.closest('.form-group')?.classList.remove('hidden');
                
                // Update button states
                this.checkItemSelection();
            } 
            // Handle items with size variations
            else if (Array.isArray(itemData.sizes)) {
                // Show size dropdown
                this.sizeLabel.closest('.form-group')?.classList.remove('hidden');
                
                // Clear and add default option
                this.sizeDropdown.innerHTML = '';
                
                // Populate size options
                itemData.sizes.forEach((sizeData: { size: string; price: number }, index: number) => {
                    const option = document.createElement('option');
                    option.value = sizeData.size;
                    option.textContent = sizeData.size;
                    option.dataset.price = sizeData.price.toString();
                    this.sizeDropdown.appendChild(option);
                    
                    // Select first size by default
                    if (index === 0) {
                        option.selected = true;
                        this.priceLabel.textContent = `Price: R${sizeData.price.toFixed(2)}`;
                        this.priceLabel.style.display = 'block';
                    }
                });
                
                // Trigger size selection handler to show options if available
                this.handleSizeSelection();
            }
        } catch (error) {
            console.error('Error parsing item data:', error);
        }
    }

    private handleSizeSelection(): void {
        // Reset and hide dependent fields
        this.optionLabel.closest('.form-group')?.classList.add('hidden');
        this.quantityInput.closest('.form-group')?.classList.add('hidden');
        this.optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
        this.quantityInput.value = '';

        const selectedOption = this.dropdown.options[this.dropdown.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;

        try {
            const itemData = JSON.parse(selectedOption.dataset.itemData || '');
            const selectedSize = this.sizeDropdown.value;
            
            // Find price for selected size
            if (Array.isArray(itemData.sizes)) {
                const sizeData = itemData.sizes.find((s: { size: string }) => s.size === selectedSize);
                if (sizeData) {
                    this.priceLabel.textContent = `Price: R${sizeData.price.toFixed(2)}`;
                    this.priceLabel.style.display = 'block';
                }
            }

            // Show options if available
            if (Array.isArray(itemData.options) && itemData.options.length > 0) {
                this.optionLabel.closest('.form-group')?.classList.remove('hidden');
                this.optionDropdown.required = true;
                
                // Clear and add options
                this.optionDropdown.innerHTML = '';
                
                // Add actual options
                itemData.options.forEach((option: string, index: number) => {
                    const optElement = document.createElement('option');
                    optElement.value = option;
                    optElement.textContent = option;
                    this.optionDropdown.appendChild(optElement);
                    
                    // Select first option by default
                    if (index === 0) {
                        optElement.selected = true;
                    }
                });
                
                // Trigger option selection handler to show quantity input
                this.handleOptionSelection();
            } else {
                // If no options, show quantity input directly and remove required attribute
                this.optionDropdown.required = false;
                this.quantityInput.closest('.form-group')?.classList.remove('hidden');
                this.checkItemSelection();
            }
        } catch (error) {
            console.error('Error handling size selection:', error);
        }
    }

    private handleOptionSelection(): void {
        // Show quantity input when an option is selected
        if (this.optionDropdown.value) {
            this.quantityInput.closest('.form-group')?.classList.remove('hidden');
            this.checkItemSelection();
        } else {
            this.quantityInput.closest('.form-group')?.classList.add('hidden');
            this.quantityInput.value = '';
        }
    }

    private checkItemSelection(): void {
        // Check if we have a valid item and quantity
        const hasValidItem = this.dropdown.value && 
                           this.quantityInput.value && 
                           parseFloat(this.quantityInput.value) > 0;

        // Check if option is required and selected
        const hasValidOption = !this.optionDropdown.required || 
                             (this.optionDropdown.value && this.optionDropdown.value !== '');

        // Get buttons from the document
        const addItemBtn = document.getElementById('addItemBtn') as HTMLButtonElement;
        const generateInvoiceBtn = document.getElementById('generateInvoiceBtn') as HTMLButtonElement;

        // Enable/disable buttons based on valid selection
        if (addItemBtn) addItemBtn.disabled = !(hasValidItem && hasValidOption);
        if (generateInvoiceBtn) generateInvoiceBtn.disabled = !(hasValidItem && hasValidOption);
    }

    public getElement(): HTMLElement {
        return this.element;
    }
} 