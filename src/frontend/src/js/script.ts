import { ItemSelectorComponent } from './components/item-selector/item-selector';
import { CustomerDetailsComponent } from './components/customer-details/customer-details';
import { AuthService } from './services/auth';
import { apiService } from './services/api';

// Types
interface InvoiceItem {
    name: string;
    quantity: number;
    price: number;
    size?: string;
    option?: string;
}

interface InvoiceData {
    customerName: string;
    customerAddress: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    invoiceNumber: string;
    items: InvoiceItem[];
}

// Declare global window properties
declare global {
    interface Window {
        selectedItems: InvoiceItem[];
    }
}

// Global variables
let companyLogo: HTMLImageElement = new Image();
let customerDetailsComponent: CustomerDetailsComponent;
window.selectedItems = [];

// Preload company logo for PDF
function preloadLogo(): void {
    const logoImg = document.getElementById('companyLogo') as HTMLImageElement;
    if (!logoImg) return;
    
    companyLogo = new Image();
    companyLogo.crossOrigin = "Anonymous";
    companyLogo.src = logoImg.src;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.location.pathname.includes('login')) {
        preloadLogo();
        initializeEventListeners();

        // Initialize item selector
        const itemsContainer = document.getElementById('itemsContainer');
        if (itemsContainer) {
            const itemSelector = new ItemSelectorComponent();
            itemsContainer.appendChild(itemSelector.getElement());
        }

        // Initialize customer details
        const customerDetailsContainer = document.getElementById('customerDetailsContainer');
        if (customerDetailsContainer) {
            customerDetailsComponent = new CustomerDetailsComponent();
            customerDetailsContainer.appendChild(customerDetailsComponent.getElement());
        }
    } else {
        const authService = new AuthService();
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (event) => authService.handleLogin(event));
        }
    }
});

function initializeEventListeners(): void {
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            const container = document.getElementById('itemsContainer');
            if (!container) return;
            
            const itemSelector = new ItemSelectorComponent();
            container.appendChild(itemSelector.getElement());
        });
        addItemBtn.style.display = 'none'; // Hide by default
    }

    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    if (nextBtn && backBtn && step1 && step2) {
        nextBtn.style.display = 'none'; // Hide by default
        nextBtn.addEventListener('click', () => {
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
        });
        backBtn.addEventListener('click', () => {
            step2.classList.add('hidden');
            step1.classList.remove('hidden');
        });
    }

    document.addEventListener('productSelected', () => {
        const addItemBtn = document.getElementById('addItemBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (addItemBtn && nextBtn) {
            addItemBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }
    });

    // Handle form submission
    const invoiceForm = document.getElementById('invoiceForm');
    const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
    
    if (invoiceForm && generateInvoiceBtn) {
        const handleSubmit = async (event: Event): Promise<void> => {
            event.preventDefault();

            // Get customer details from the component
            const customerDetails = customerDetailsComponent.getFormData();

            // Create the invoice data
            const invoiceData: InvoiceData = {
                customerName: customerDetails.customerName,
                customerAddress: customerDetails.customerAddress,
                customerEmail: customerDetails.customerEmail,
                customerPhone: customerDetails.customerPhone,
                date: new Date().toISOString().split('T')[0],
                invoiceNumber: `INV-${Date.now()}`,
                items: window.selectedItems
            };

            try {
                const pdfBlob = await apiService.createInvoice(invoiceData);
                const url = window.URL.createObjectURL(pdfBlob);
                window.open(url, '_blank');
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error generating invoice:', error);
            }
        };

        invoiceForm.addEventListener('submit', handleSubmit);
        generateInvoiceBtn.addEventListener('click', handleSubmit);
    }

    const authService = new AuthService();
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => authService.handleLogin(event));
    }
} 