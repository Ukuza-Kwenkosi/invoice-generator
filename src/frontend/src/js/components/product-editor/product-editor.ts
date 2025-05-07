import { apiService } from '../../services/api';
import { Product } from '../../models/types';

export class ProductEditorComponent {
    private modal: HTMLDialogElement;
    private form: HTMLFormElement;
    private sizesContainer: HTMLElement;
    private currentProduct: Product | null = null;

    constructor() {
        this.modal = document.getElementById('productModal') as HTMLDialogElement;
        this.form = document.getElementById('productForm') as HTMLFormElement;
        this.sizesContainer = document.getElementById('sizesContainer') as HTMLElement;
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    public showAddProductModal(): void {
        this.currentProduct = null;
        this.form.reset();
        this.sizesContainer.innerHTML = '';
        this.addSize(); // Add one empty size row by default
        document.getElementById('modalTitle')!.textContent = 'Add New Product';
        this.modal.showModal();
    }

    public showEditProductModal(product: Product): void {
        this.currentProduct = product;
        this.form.reset();
        this.sizesContainer.innerHTML = '';
        
        // Fill form with product data
        (this.form.elements.namedItem('name') as HTMLInputElement).value = product.name;
        (this.form.elements.namedItem('description') as HTMLTextAreaElement).value = product.description || '';
        (this.form.elements.namedItem('options') as HTMLInputElement).value = product.options?.join(', ') || '';
        
        // Add size rows
        product.sizes.forEach(size => {
            this.addSize(size.size, size.price);
        });
        
        document.getElementById('modalTitle')!.textContent = 'Edit Product';
        this.modal.showModal();
    }

    private addSize(size: string = '', price: number = 0): void {
        const sizeRow = document.createElement('div');
        sizeRow.className = 'grid grid-cols-[1fr_120px_50px] gap-4';
        sizeRow.innerHTML = `
            <input type="text" name="size[]" class="input input-bordered" value="${size}" required />
            <input type="number" name="price[]" class="input input-bordered" value="${price}" required min="0" step="0.01" />
            <button type="button" class="btn btn-ghost" onclick="this.closest('.grid').remove()" title="Remove Size">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;
        this.sizesContainer.appendChild(sizeRow);
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();
        
        const formData = new FormData(this.form);
        const product: Product = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            options: (formData.get('options') as string)?.split(',').map(opt => opt.trim()).filter(Boolean) || [],
            sizes: Array.from(formData.getAll('size[]')).map((size, index) => ({
                size: size as string,
                price: parseFloat(formData.getAll('price[]')[index] as string)
            }))
        };

        try {
            if (this.currentProduct) {
                await apiService.updateProduct(this.currentProduct.name, product);
            } else {
                await apiService.createProduct(product);
            }
            this.modal.close();
            // Trigger a refresh of the product list
            window.dispatchEvent(new CustomEvent('productsUpdated'));
        } catch (error) {
            console.error('Error saving product:', error);
            // TODO: Show error message to user
        }
    }

    public closeModal(): void {
        this.modal.close();
    }
} 