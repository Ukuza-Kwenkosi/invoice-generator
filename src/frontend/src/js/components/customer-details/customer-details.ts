import { CustomerDetails } from '@/models/types';

export class CustomerDetailsComponent {
    private element: HTMLElement;
    private generateButton: HTMLElement | null = null;

    constructor() {
        // Get the container where the template is included
        const container = document.getElementById('customerDetailsContainer');
        if (!container) {
            throw new Error('Customer details container not found');
        }
        
        // Use the first child of the container as our element
        this.element = container.firstElementChild as HTMLElement;
        if (!this.element) {
            throw new Error('Customer details template not found');
        }

        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Get all input fields
        const inputs = this.element.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        
        // Add input event listeners to all fields
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateForm());
        });

        // Get the generate button
        this.generateButton = document.getElementById('generateInvoiceBtn');
        if (this.generateButton) {
            this.generateButton.classList.add('hidden');
        }
    }

    private validateForm(): void {
        const inputs = this.element.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        let isValid = true;

        inputs.forEach(input => {
            if (!input.validity.valid) {
                isValid = false;
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        });

        // Show/hide generate button based on validation
        if (this.generateButton) {
            if (isValid) {
                this.generateButton.classList.remove('hidden');
            } else {
                this.generateButton.classList.add('hidden');
            }
        }
    }

    public getFormData(): CustomerDetails {
        const formData: CustomerDetails = {
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerAddress: ''
        };

        const inputs = this.element.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        inputs.forEach(input => {
            const name = input.name as keyof CustomerDetails;
            if (name in formData) {
                formData[name] = input.value;
            }
        });

        return formData;
    }

    public validate(): boolean {
        let isValid = true;
        const inputs = this.element.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        inputs.forEach(input => {
            if (!input.validity.valid) {
                isValid = false;
                input.classList.add('border-red-500');
            }
        });
        return isValid;
    }

    public getElement(): HTMLElement {
        return this.element;
    }
} 