import { apiService } from '../../services/api';
import { Product, Size } from '../../models/types';

export class BackofficeComponent {
    private modal: HTMLDialogElement | null;
    private form: HTMLFormElement | null;
    private sizesContainer: HTMLElement | null;
    private productsTable: HTMLElement | null;
    private editingProduct: Product | null = null;
    private products: Product[] = [];
    private templates: {
        productList: HTMLTemplateElement;
        emptyState: HTMLTemplateElement;
        errorState: HTMLTemplateElement;
        sizeRow: HTMLTemplateElement;
    };

    constructor() {
        this.modal = document.getElementById('productModal') as HTMLDialogElement;
        this.form = document.getElementById('productForm') as HTMLFormElement;
        this.sizesContainer = document.getElementById('sizesContainer');
        this.productsTable = document.querySelector('table tbody');
        
        // Get templates
        this.templates = {
            productList: document.getElementById('productListTemplate') as HTMLTemplateElement,
            emptyState: document.getElementById('emptyStateTemplate') as HTMLTemplateElement,
            errorState: document.getElementById('errorStateTemplate') as HTMLTemplateElement,
            sizeRow: document.getElementById('sizeRowTemplate') as HTMLTemplateElement
        };

        this.initialize();
    }

    private initialize(): void {
        // Add event listeners
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Add button event listeners
        const addSizeBtn = document.getElementById('addSizeBtn');
        if (addSizeBtn) {
            addSizeBtn.addEventListener('click', () => this.addSize());
        }

        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        const addFirstProductBtn = document.getElementById('addFirstProductBtn');
        if (addFirstProductBtn) {
            addFirstProductBtn.addEventListener('click', () => this.showAddProductModal());
        }

        // Load initial data
        this.loadProducts();
    }

    private async loadProducts(): Promise<void> {
        try {
            this.products = await apiService.getProducts();
            if (!this.productsTable) return;

            if (this.products.length === 0) {
                const emptyState = this.templates.emptyState.content.cloneNode(true) as DocumentFragment;
                this.productsTable.appendChild(emptyState);
                return;
            }

            this.productsTable.innerHTML = '';
            this.products.forEach(product => {
                const productRow = this.templates.productList.content.cloneNode(true) as DocumentFragment;
                
                // Set product data
                const nameElement = productRow.querySelector('h3');
                if (nameElement) nameElement.textContent = product.name;
                
                const descriptionElement = productRow.querySelector('p');
                if (descriptionElement) descriptionElement.textContent = product.description || '';
                
                const sizesContainer = productRow.querySelector('.mt-2');
                if (sizesContainer && product.sizes) {
                    sizesContainer.innerHTML = product.sizes.map(size => `
                        <span class="badge badge-primary mr-2">
                            ${size.size} - R${size.price}
                        </span>
                    `).join('');
                }
                
                const editButton = productRow.querySelector('.edit-product-btn');
                if (editButton) {
                    editButton.setAttribute('data-product-name', product.name);
                    editButton.addEventListener('click', () => this.editProduct(product.name));
                }
                
                this.productsTable.appendChild(productRow);
            });
        } catch (error) {
            console.error('Error loading products:', error);
            if (this.productsTable) {
                const errorState = this.templates.errorState.content.cloneNode(true) as DocumentFragment;
                this.productsTable.appendChild(errorState);
            }
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();
        if (!this.form) return;

        const formData = new FormData(this.form);
        const productData = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            options: (formData.get('options') as string)?.split(',').map(opt => opt.trim()) || [],
            sizes: this.getSizes()
        };

        try {
            if (this.editingProduct) {
                await apiService.updateProduct(this.editingProduct.name, productData);
            } else {
                await apiService.createProduct(productData);
            }
            
            await this.loadProducts(); // Reload the products list
            this.closeModal();
        } catch (error) {
            console.error('Error saving product:', error);
            // TODO: Show error message to user
        }
    }

    private getSizes(): Size[] {
        if (!this.sizesContainer) return [];

        const sizeInputs = this.sizesContainer.querySelectorAll('.size-input');
        return Array.from(sizeInputs).map(input => {
            const sizeInput = input.querySelector('input[name="size"]') as HTMLInputElement;
            const priceInput = input.querySelector('input[name="price"]') as HTMLInputElement;
            return {
                size: sizeInput.value,
                price: parseFloat(priceInput.value)
            };
        });
    }

    public showAddProductModal(): void {
        this.editingProduct = null;
        if (this.modal) {
            const title = this.modal.querySelector('#modalTitle');
            if (title) title.textContent = 'Add New Product';
            
            if (this.form) {
                this.form.reset();
                if (this.sizesContainer) {
                    this.sizesContainer.innerHTML = '';
                    this.addSize(); // Add one empty size row by default
                }
            }
            
            this.modal.showModal();
        }
    }

    public closeModal(): void {
        this.editingProduct = null;
        if (this.modal) {
            this.modal.close();
        }
    }

    public addSize(): void {
        if (!this.sizesContainer) return;

        const sizeRow = this.templates.sizeRow.content.cloneNode(true) as DocumentFragment;
        const removeButton = sizeRow.querySelector('.remove-size-btn');
        if (removeButton) {
            removeButton.addEventListener('click', (e) => {
                const button = e.currentTarget as HTMLElement;
                button.closest('.size-input')?.remove();
            });
        }
        this.sizesContainer.appendChild(sizeRow);
    }

    public editProduct(productName: string): void {
        const product = this.products.find(p => p.name === productName);
        if (!product) {
            console.error('Product not found:', productName);
            return;
        }

        this.editingProduct = product;
        
        if (this.modal) {
            const title = this.modal.querySelector('#modalTitle');
            if (title) title.textContent = 'Edit Product';
            
            if (this.form) {
                // Populate form fields
                const nameInput = this.form.querySelector('input[name="name"]') as HTMLInputElement;
                const descriptionInput = this.form.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
                const optionsInput = this.form.querySelector('input[name="options"]') as HTMLInputElement;
                
                if (nameInput) nameInput.value = product.name;
                if (descriptionInput) descriptionInput.value = product.description || '';
                if (optionsInput) optionsInput.value = product.options?.join(', ') || '';
                
                // Clear and populate sizes
                if (this.sizesContainer) {
                    this.sizesContainer.innerHTML = '';
                    product.sizes?.forEach(size => {
                        const sizeRow = this.templates.sizeRow.content.cloneNode(true) as DocumentFragment;
                        const sizeInput = sizeRow.querySelector('input[name="size"]') as HTMLInputElement;
                        const priceInput = sizeRow.querySelector('input[name="price"]') as HTMLInputElement;
                        const removeButton = sizeRow.querySelector('.remove-size-btn');
                        
                        if (sizeInput) sizeInput.value = size.size;
                        if (priceInput) priceInput.value = size.price.toString();
                        if (removeButton) {
                            removeButton.addEventListener('click', (e) => {
                                const button = e.currentTarget as HTMLElement;
                                button.closest('.size-input')?.remove();
                            });
                        }
                        
                        this.sizesContainer.appendChild(sizeRow);
                    });
                }
            }
            
            this.modal.showModal();
        }
    }
}

// Initialize the backoffice component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BackofficeComponent();
}); 