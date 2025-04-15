import { InvoiceData, Product } from './models/types.js';
import { ItemSelectorComponent } from './components/item-selector.js';
import { apiService } from './services/api.js';

// Global variables
let itemCount: number = 1;
let companyLogo: HTMLImageElement = new Image();
let products: Product[] = []; // Store products globally

// Preload company logo for PDF - improved handling
function preloadLogo(): void {
    const logoImg = document.getElementById('companyLogo') as HTMLImageElement;
    companyLogo = new Image();
    companyLogo.crossOrigin = "Anonymous"; // Handle cross-origin images if needed
    companyLogo.src = logoImg.src;
    companyLogo.onload = function(): void {
        // Logo loaded successfully
    };
    companyLogo.onerror = function(): void {
        // Handle logo load error
    };
}

// Make loadDropDown available globally
declare global {
    interface Window {
        loadDropDown: () => void;
    }
}

async function loadProducts(): Promise<void> {
    try {
        products = await apiService.getProducts();
        if (!Array.isArray(products)) {
            console.error('Failed to load products: Invalid response format');
            products = [];
        }
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
    }
}

function loadDropDown(): void {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    const itemSelector = new ItemSelectorComponent(`item${itemCount}`, products);
    container.appendChild(itemSelector.getElement());
    itemCount++;
}

// Add toast notification function at the top
function showToast(message: string, type: 'success' | 'error' = 'error'): void {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 ${
        type === 'success' ? 'bg-success' : 'bg-error'
    }`;
    toast.style.zIndex = '1000';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize UI components
    preloadLogo();
    initializeEventListeners();
    
    // Load products first
    await loadProducts();
    
    // Then load initial item
    loadDropDown();
    
    // Add event listeners for form submission
    const form = document.getElementById('invoiceForm') as HTMLFormElement;
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading spinner
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'loading-spinner';
            loadingSpinner.innerHTML = `
                <div class="spinner-overlay">
                    <div class="spinner"></div>
                    <p>Generating Invoice...</p>
                </div>
            `;
            document.body.appendChild(loadingSpinner);
            
            try {
                // Collect form data
                const formData = new FormData(form);
                
                // Validate customer details
                const customerName = formData.get('customerName')?.toString() || '';
                const customerAddress = formData.get('customerAddress')?.toString() || '';
                const customerEmail = formData.get('customerEmail')?.toString() || '';
                const customerPhone = formData.get('customerPhone')?.toString() || '';

                // Check if any customer detail is missing
                if (!customerName || !customerAddress || !customerEmail || !customerPhone) {
                    throw new Error('Please fill in all customer details');
                }

                // Get all items and validate them
                const items = Array.from(document.querySelectorAll('.invoice-item')).map(item => {
                    const productSelect = item.querySelector('.product-select') as HTMLSelectElement;
                    const selectedProduct = products.find(p => p.name === productSelect.value);
                    const sizeSelect = item.querySelector('.size-select') as HTMLSelectElement;
                    const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
                    // Get base price from size select instead of total from price input
                    const basePrice = selectedOption ? parseFloat(selectedOption.dataset.rawPrice || '0') : 0;
                    return {
                        name: productSelect.value,
                        size: sizeSelect.value,
                        option: (item.querySelector('.option-select') as HTMLSelectElement).value || undefined,
                        quantity: parseInt((item.querySelector('.quantity-input') as HTMLInputElement).value) || 0,
                        price: basePrice, // Send base price instead of total
                        description: selectedProduct?.description || undefined
                    };
                });

                // Validate items
                if (items.length === 0) {
                    throw new Error('Please add at least one item to the invoice');
                }

                // Check if any item is invalid
                const invalidItem = items.find(item => !item.name || !item.size || item.quantity <= 0 || item.price <= 0);
                if (invalidItem) {
                    throw new Error('Please ensure all items have a product selected, size selected, quantity greater than 0, and valid price');
                }

                const invoiceData: InvoiceData = {
                    customerName,
                    customerAddress,
                    customerEmail,
                    customerPhone,
                    date: new Date().toISOString().split('T')[0],
                    invoiceNumber: Date.now().toString(), // Generate a timestamp-based invoice number
                    items
                };

                // Generate PDF
                const pdfBlob = await apiService.createInvoice(invoiceData);
                
                // Create a URL for the PDF blob
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                // Open PDF in new tab
                window.open(pdfUrl, '_blank');
                
                // Reset form
                form.reset();
                
                // Remove all items except the first one
                const itemsContainer = document.getElementById('itemsContainer');
                if (itemsContainer) {
                    const items = Array.from(itemsContainer.children);
                    items.slice(1).forEach(item => item.remove());
                    
                    // Reset the first item's selections
                    const firstItem = items[0];
                    if (firstItem) {
                        const productSelect = firstItem.querySelector('.product-select') as HTMLSelectElement;
                        if (productSelect) {
                            productSelect.value = '';
                            // Trigger change event to reset dependent fields
                            productSelect.dispatchEvent(new Event('change'));
                        }
                    }
                }
                
                // Reset item counter
                itemCount = 1;
                
            } catch (error) {
                console.error('Error generating invoice:', error);
                const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the invoice';
                const errorDetails = (error as any)?.details?.details || '';
                showToast(`${errorMessage}${errorDetails ? `. ${errorDetails}` : ''}`);
            } finally {
                // Remove loading spinner
                loadingSpinner.remove();
            }
        });
    }
});

function initializeEventListeners() {
    // Add event listener for Add Item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', loadDropDown);
    }

    // Add your event listeners here
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

async function handleLogin(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const credentials = {
        username: formData.get('username') as string,
        password: formData.get('password') as string
    };

    try {
        const response = await apiService.login(credentials);
        if (response.success) {
            window.location.href = '/dashboard.html';
        } else {
            showToast(response.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred during login');
    }
}

async function handleLogout() {
    try {
        const response = await apiService.logout();
        if (response.success) {
            window.location.href = '/login.html';
        } else {
            showToast(response.error || 'Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('An error occurred during logout');
    }
} 