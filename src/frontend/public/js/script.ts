import { ItemData } from './models/types';
import { ItemSelectorComponent } from './components/item-selector.js';

// Global variables
let itemCount: number = 1;
let companyLogo: HTMLImageElement = new Image();

// Global variables to store logo colors - using brand colors common in South African businesses
// @ts-ignore - Will be used in PDF generation
let logoPrimaryColor: [number, number, number] = [255, 99, 71]; // Darker red for table header
// @ts-ignore - Will be used in PDF generation
let logoSecondaryColor: [number, number, number] = [245, 245, 245]; // Very light gray for alternating rows
// @ts-ignore - Will be used in PDF generation
let footerColor: [number, number, number] = [211, 211, 211]; // Light grey for footer

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

function loadDropDown(): void {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    const itemSelector = new ItemSelectorComponent(`item${itemCount}`);
    container.appendChild(itemSelector.getElement());
    itemCount++;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    preloadLogo();
    loadDropDown();
    
    // Make loadDropDown available globally
    window.loadDropDown = loadDropDown;

    // Add event listeners
    document.getElementById('addItemBtn')?.addEventListener('click', () => {
        const container = document.getElementById('itemsContainer');
        if (container) {
            const newComponent = new ItemSelectorComponent(`item-${container.children.length + 1}`);
            container.appendChild(newComponent.getElement());
        }
    });

    // Handle form submission
    const quoteForm = document.getElementById('invoiceForm') as HTMLFormElement;
    console.log('Form element:', quoteForm); // Debug log
    
    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            console.log('Form submitted!'); // Debug log
            e.preventDefault(); // Prevent default form submission
            
            try {
                console.log('Starting invoice generation...'); // Debug log
                // Show loading spinner
                const spinner = document.createElement('div');
                spinner.className = 'loading-spinner';
                spinner.innerHTML = `
                    <div class="spinner-overlay">
                        <div class="spinner"></div>
                        <p>Generating invoice...</p>
                    </div>
                `;
                document.body.appendChild(spinner);

                // Get all item components
                const itemsContainer = document.getElementById('itemsContainer');
                if (!itemsContainer) {
                    console.error('Items container not found!'); // Debug log
                    return;
                }

                console.log('Collecting items...');
                const items = Array.from(itemsContainer.children).map(item => {
                    const dropdown = item.querySelector('select[id^="item-dropdown-"]') as HTMLSelectElement;
                    const sizeDropdown = item.querySelector('select[id^="size-dropdown-"]') as HTMLSelectElement;
                    const optionDropdown = item.querySelector('select[id^="option-dropdown-"]') as HTMLSelectElement;
                    const quantityInput = item.querySelector('input[id^="quantity-"]') as HTMLInputElement;

                    if (!dropdown || !quantityInput) {
                        console.log('Missing required fields:', { dropdown, quantityInput }); // Debug log
                        return null;
                    }

                    const selectedOption = dropdown.options[dropdown.selectedIndex];
                    const itemData = JSON.parse(selectedOption.dataset.itemData || '{}');
                    console.log('Selected item data:', itemData); // Debug log

                    // Extract price based on the item type
                    let price: number;
                    if (itemData.size && itemData.price) {
                        // Item has fixed size and price
                        price = itemData.price;
                    } else if (sizeDropdown && sizeDropdown.value) {
                        // Item has multiple sizes
                        const selectedSizeOption = sizeDropdown.options[sizeDropdown.selectedIndex];
                        const sizeData = itemData.sizes?.find((s: any) => s.size === sizeDropdown.value);
                        price = sizeData?.price || 0;
                    } else {
                        console.error('Could not determine price for item:', itemData);
                        return null;
                    }

                    const itemToSend = {
                        name: dropdown.value,
                        description: itemData.description || '',
                        size: sizeDropdown?.value || itemData.size,
                        option: optionDropdown?.value,
                        quantity: parseInt(quantityInput.value),
                        price: price
                    };
                    console.log('Item to send:', itemToSend); // Debug log
                    return itemToSend;
                }).filter(Boolean);

                console.log('Collected items:', items); // Debug log

                // Get customer details
                const customerDetails = {
                    name: (document.getElementById('customerName') as HTMLInputElement).value,
                    email: (document.getElementById('customerEmail') as HTMLInputElement).value,
                    phone: (document.getElementById('customerPhone') as HTMLInputElement).value,
                    address: (document.getElementById('customerAddress') as HTMLTextAreaElement).value
                };

                console.log('Customer details:', customerDetails); // Debug log

                // Send data to server
                console.log('Sending data to server...'); // Debug log
                const response = await fetch('/generate-invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        customerDetails,
                        items
                    })
                });

                console.log('Server response:', response); // Debug log

                if (!response.ok) {
                    throw new Error('Failed to generate invoice');
                }

                // Get the PDF blob
                const blob = await response.blob();
                console.log('Received PDF blob:', blob); // Debug log
                
                // Create URL for the blob
                const url = window.URL.createObjectURL(blob);
                
                // Open PDF in new tab
                const pdfWindow = window.open(url, '_blank');
                if (!pdfWindow) {
                    throw new Error('Failed to open PDF in new tab');
                }

                // Wait for the PDF to load before resetting the form
                setTimeout(() => {
                    // Remove spinner
                    const spinner = document.querySelector('.loading-spinner');
                    if (spinner) {
                        document.body.removeChild(spinner);
                    }

                    // Reset form
                    quoteForm.reset();
                    
                    // Clear items container and add a new empty item selector
                    if (itemsContainer) {
                        itemsContainer.innerHTML = '';
                        const newComponent = new ItemSelectorComponent('item-1');
                        itemsContainer.appendChild(newComponent.getElement());
                    }

                    // Reset item count
                    itemCount = 1;
                }, 1000); // Wait 1 second before resetting

            } catch (error) {
                console.error('Error generating invoice:', error);
                alert('Error generating invoice. Please try again.');
                // Remove spinner in case of error
                const spinner = document.querySelector('.loading-spinner');
                if (spinner) {
                    document.body.removeChild(spinner);
                }
            }
        });
    } else {
        console.error('Quote form not found!'); // Debug log
    }
}); 