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
        itemSelector: ItemSelectorComponent;
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
    console.log('DOM Content Loaded');
    if (!window.location.pathname.includes('login')) {
        console.log('Not on login page, initializing components');
        preloadLogo();
        
        // Initialize components
        const itemsContainer = document.getElementById('itemsContainer');
        console.log('Items container found:', itemsContainer);
        if (itemsContainer) {
            console.log('Creating ItemSelectorComponent');
            window.itemSelector = new ItemSelectorComponent();
            console.log('ItemSelectorComponent created');
        }

        // Initialize customer details
        const customerDetailsContainer = document.getElementById('customerDetailsContainer');
        if (customerDetailsContainer) {
            customerDetailsComponent = new CustomerDetailsComponent();
        }

        // Initialize event listeners
        initializeEventListeners();
    } else {
        const authService = new AuthService();
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (event) => authService.handleLogin(event));
        }
    }
});

function initializeEventListeners(): void {
    // Handle navigation between steps
    const backBtn = document.getElementById('backBtn');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    if (backBtn && step1 && step2) {
        backBtn.addEventListener('click', () => {
            step2.classList.add('hidden');
            step1.classList.remove('hidden');
        });
    }

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
} 