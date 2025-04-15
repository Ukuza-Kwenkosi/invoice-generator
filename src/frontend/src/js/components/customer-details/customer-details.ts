import { CustomerDetails } from '../../models/types';

export class CustomerDetailsComponent {
    private element: HTMLDivElement;

    constructor() {
        this.element = document.createElement('div');
        this.render();
    }

    private render(): void {
        const template = document.getElementById('customerDetailsTemplate') as HTMLTemplateElement;
        if (template) {
            const content = template.content.cloneNode(true);
            this.element.appendChild(content);
        }
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }

    public getFormData(): CustomerDetails {
        const formData: CustomerDetails = {
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerAddress: ''
        };

        const inputs = this.element.querySelectorAll('input');
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
        const inputs = this.element.querySelectorAll('input');
        inputs.forEach(input => {
            if (!input.validity.valid) {
                isValid = false;
                input.classList.add('border-red-500');
            }
        });
        return isValid;
    }
} 