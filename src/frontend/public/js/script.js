let dropdown;
let itemCount = 1;
let companyLogo = new Image();
let logoLoaded = false;

// Global variables to store logo colors - using brand colors common in South African businesses
let logoPrimaryColor = [255, 99, 71]; // Darker red for table header
let logoSecondaryColor = [245, 245, 245]; // Very light gray for alternating rows
let footerColor = [211, 211, 211]; // Light grey for footer

// Preload company logo for PDF - improved handling
function preloadLogo() {
    const logoImg = document.getElementById('companyLogo');
    companyLogo = new Image();
    companyLogo.crossOrigin = "Anonymous"; // Handle cross-origin images if needed
    companyLogo.src = logoImg.src;
    companyLogo.onload = function() {
        logoLoaded = true;
    };
    companyLogo.onerror = function() {
        logoLoaded = false;
    };
}

// Function to check if any item is selected and has quantity
function checkItemSelection() {
    const dropdowns = document.querySelectorAll('.item-dropdown');
    const hasValidItem = Array.from(dropdowns).some(dropdown => {
        const itemContainer = dropdown.closest('.item');
        const quantityInput = itemContainer.querySelector('input[type="number"]');
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        
        return selectedOption && 
               selectedOption.value && 
               selectedOption.value !== '' && 
               quantityInput && 
               quantityInput.value && 
               parseFloat(quantityInput.value) > 0;
    });
    
    document.getElementById('addItemBtn').disabled = !hasValidItem;
    document.getElementById('generateInvoiceBtn').disabled = !hasValidItem;
}

// Update event listeners
function setupEventListeners() {
    // Remove the old event listeners since we're using component-based approach
    document.addEventListener('input', function(e) {
        if (e.target.type === 'number') {
            checkItemSelection();
        }
    });
}

// Item Selector Component
class ItemSelectorComponent {
    constructor(id) {
        this.id = id;
        this.element = this.create();
        this.setupEventListeners();
        this.loadData();
    }

    async loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            
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
                option.dataset.itemData = JSON.stringify({
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    sizes: item.sizes,
                    options: item.options
                });
                
                this.dropdown.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading items data:', error);
            alert('Error loading items. Please refresh the page or try again later.');
        }
    }

    create() {
        const template = document.getElementById('itemSelectorTemplate');
        const content = template.content.cloneNode(true);
        
        // Replace ${id} placeholder with actual ID
        const id = this.id;
        content.querySelectorAll('[id*="${id}"]').forEach(element => {
            element.id = element.id.replace('${id}', id);
        });
        
        // Store references to elements
        this.dropdown = content.querySelector('.item-dropdown');
        this.descriptionGroup = content.querySelector('.description-group');
        this.description = content.querySelector('.item-description');
        this.sizeLabel = content.querySelector('.size-label');
        this.sizeDropdown = content.querySelector('.size-dropdown');
        this.optionLabel = content.querySelector('.option-label');
        this.optionDropdown = content.querySelector('.option-dropdown');
        this.quantityInput = content.querySelector('input[type="number"]');
        this.priceLabel = content.querySelector('#price');
        
        return content;
    }

    setupEventListeners() {
        // We already have all the element references from the create() method
        // No need to query them again from this.element

        if (!this.dropdown || !this.sizeDropdown || !this.optionDropdown || !this.quantityInput || 
            !this.descriptionGroup || !this.description || !this.priceLabel || 
            !this.sizeLabel || !this.optionLabel) {
            throw new Error('Required elements not found in container');
        }

        // Bind event handlers to this instance
        this.dropdown.addEventListener('change', () => this.handleItemSelection());
        this.sizeDropdown.addEventListener('change', () => this.handleSizeSelection());
        this.optionDropdown.addEventListener('change', () => this.handleOptionSelection());
        this.quantityInput.addEventListener('input', () => checkItemSelection());
    }

    handleItemSelection() {
        // Reset all fields
        this.descriptionGroup.style.display = 'none';
        this.description.textContent = '';
        this.priceLabel.style.display = 'none';
        this.priceLabel.textContent = 'Price: R0.00';
        this.sizeDropdown.innerHTML = '<option value="" disabled selected>Select size</option>';
        this.optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
        this.quantityInput.value = '';
        this.quantityInput.closest('.quantity-group').classList.add('hidden');

        // Hide controls initially
        this.sizeLabel.classList.add('hidden');
        this.sizeDropdown.classList.add('hidden');
        this.optionLabel.classList.add('hidden');
        this.optionDropdown.classList.add('hidden');
        this.optionDropdown.disabled = true;

        if (this.dropdown.value) {
            const selectedOption = this.dropdown.options[this.dropdown.selectedIndex];
            const itemData = JSON.parse(selectedOption.dataset.itemData);
            const description = itemData.description;

            // Show description
            if (description && description !== 'undefined') {
                this.descriptionGroup.style.display = 'block';
                this.description.textContent = description;
            }

            // Handle sizes and prices
            if (itemData.sizes) {
                this.sizeLabel.classList.remove('hidden');
                this.sizeDropdown.classList.remove('hidden');
                this.sizeDropdown.disabled = false;
                this.sizeDropdown.innerHTML = '<option value="" disabled selected>Select size</option>';
                
                itemData.sizes.forEach(sizeData => {
                    const sizeOption = document.createElement('option');
                    sizeOption.value = sizeData.size;
                    sizeOption.textContent = sizeData.size;
                    sizeOption.dataset.price = sizeData.price;
                    this.sizeDropdown.appendChild(sizeOption);
                });
            } else if (itemData.size) {
                this.sizeLabel.classList.remove('hidden');
                this.sizeDropdown.classList.remove('hidden');
                this.sizeDropdown.disabled = false;
                this.sizeDropdown.innerHTML = '<option value="" disabled selected>Select size</option>';
                
                const sizeOption = document.createElement('option');
                sizeOption.value = itemData.size;
                sizeOption.textContent = itemData.size;
                sizeOption.dataset.price = itemData.price;
                this.sizeDropdown.appendChild(sizeOption);
                
                this.sizeDropdown.value = itemData.size;
                this.handleSizeSelection();
            } else {
                this.priceLabel.textContent = `Price: R${itemData.price}`;
                this.priceLabel.style.display = 'block';
                this.quantityInput.closest('.quantity-group').classList.remove('hidden');
                this.quantityInput.setAttribute('required', '');
            }
        }

        checkItemSelection();
    }

    handleSizeSelection() {
        // Reset option dropdown and hide controls
        this.optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
        this.optionLabel.classList.add('hidden');
        this.optionDropdown.classList.add('hidden');
        this.optionDropdown.disabled = true;
        this.quantityInput.value = '';
        this.quantityInput.closest('.quantity-group').classList.add('hidden');

        if (this.sizeDropdown.value) {
            const selectedSizeOption = this.sizeDropdown.options[this.sizeDropdown.selectedIndex];
            const price = selectedSizeOption.dataset.price;
            this.priceLabel.textContent = `Price: R${price}`;
            this.priceLabel.style.display = 'block';

            const itemData = JSON.parse(this.dropdown.options[this.dropdown.selectedIndex].dataset.itemData);
            const options = itemData.options || [];

            if (options.length > 0) {
                this.optionLabel.classList.remove('hidden');
                this.optionDropdown.classList.remove('hidden');
                this.optionDropdown.disabled = false;
                this.optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
                
                options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    this.optionDropdown.appendChild(optionElement);
                });
            } else {
                this.quantityInput.closest('.quantity-group').classList.remove('hidden');
                this.quantityInput.setAttribute('required', '');
            }
        }

        checkItemSelection();
    }

    handleOptionSelection() {
        if (this.optionDropdown.value) {
            this.quantityInput.closest('.quantity-group').classList.remove('hidden');
            this.quantityInput.setAttribute('required', '');
        } else {
            this.quantityInput.closest('.quantity-group').classList.add('hidden');
            this.quantityInput.removeAttribute('required');
            this.quantityInput.value = '';
        }

        checkItemSelection();
    }

    getElement() {
        return this.element;
    }
}

// Update the addItem function to use the new component
function addItem() {
    const itemsDiv = document.getElementById('items');
    const itemSelector = new ItemSelectorComponent(itemCount);
    itemsDiv.appendChild(itemSelector.getElement());
    itemCount++;
}

// Update the loadDropDown function to only create the initial component
function loadDropDown() {
    const itemsDiv = document.getElementById('items');
    if (!itemsDiv) {
        throw new Error('Items container not found');
    }
    
    itemsDiv.innerHTML = ''; // Clear existing items
    
    // Create initial item selector
    const itemSelector = new ItemSelectorComponent(0);
    const element = itemSelector.getElement();
    if (!element) {
        throw new Error('Failed to create item selector element');
    }
    
    itemsDiv.appendChild(element);
    checkItemSelection();
}

// Customer class
class Customer {
    constructor(name, address, email, phone) {
        this.name = name;
        this.address = address;
        this.email = email;
        this.phone = phone;
    }
}

// Format currency for PDF
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR'
    }).format(amount);
}

// Generate PDF using jsPDF
function generatePDF(customer, items) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        margins: { top: 25, bottom: 25, left: 25, right: 25 }
    });
    
    const leftMargin = 25;  
    const topMargin = 25;   
    const rightMargin = 185;
    
    if (logoLoaded) {
        const logoWidth = 72; 
        const logoAspectRatio = companyLogo.height / companyLogo.width;
        const logoHeight = logoWidth * logoAspectRatio;
        
        doc.addImage(companyLogo, 'PNG', leftMargin - 10, topMargin, logoWidth, Math.min(logoHeight, 52));
    }
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Ukuza Kwenkosi Enterprises trading as Ukuza Kivenkosi Enterprises', rightMargin, topMargin + 15, { align: 'right' });
    doc.text('Reg No 2012/750142/07 TAX No. 9278518254', rightMargin, topMargin + 20, { align: 'right' });
    doc.text('E2144 Osizeni, Newcastle, KiaZulu-Natal, 2952', rightMargin, topMargin + 25, { align: 'right' });
    
    let customerInfoTopMargin = 55;
    doc.setFontSize(8);
    const quoteNo = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    doc.text(`Quote #: ${quoteNo}`, rightMargin, topMargin + customerInfoTopMargin, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, rightMargin, topMargin + customerInfoTopMargin + 5, { align: 'right' });
    
    doc.text(`Name: ${customer.name}`, leftMargin, topMargin + customerInfoTopMargin);
    doc.text(`Address: ${customer.address}`, leftMargin, topMargin + customerInfoTopMargin + 5);
    doc.text(`Email: ${customer.email}`, leftMargin, topMargin + customerInfoTopMargin + 10);
    doc.text(`Phone: ${customer.phone}`, leftMargin, topMargin + customerInfoTopMargin + 15);
    
    const tableColumn = ["Description", "Price", "Quantity", "Total"];
    const tableRows = [];
    
    let totalAmount = 0;
    
    items.forEach(item => {
        const VAT = 1.15;
        const total = item.price * item.quantity * VAT;
        const price = item.price * VAT;
        totalAmount += total;
        
        tableRows.push([
            item.description,
            formatCurrency(price),
            item.quantity,
            formatCurrency(total)
        ]);
    });
    
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: topMargin + 80,
        margin: { left: leftMargin, right: leftMargin },
        theme: 'grid',
        headStyles: {
            fillColor: logoPrimaryColor,
            textColor: 255,
            halign: 'center',
            fontSize: 8,
            cellPadding: 2
        },
        alternateRowStyles: {
            fillColor: logoSecondaryColor
        },
        foot: [['', '', { content: 'Total', styles: { halign: 'center', fontSize: 8, cellPadding: 2 } }, { content: formatCurrency(totalAmount), styles: { halign: 'center', fontSize: 8, cellPadding: 2 } }]],
        footStyles: {
            fillColor: footerColor,
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            0: { cellWidth: 'auto', cellPadding: 2 },
            1: { cellWidth: 30, halign: 'center', cellPadding: 2 },
            2: { cellWidth: 20, halign: 'center', cellPadding: 2 },
            3: { cellWidth: 40, halign: 'center', cellPadding: 2 }
        },
        styles: {
            fontSize: 8,
            cellPadding: 2
        }
    });
    
    const finalY = doc.lastAutoTable.finalY || (topMargin + 115);
    
    doc.text('Capitec Business', leftMargin, finalY + 37);
    doc.text('Account No: 1052338658', leftMargin, finalY + 44);
    doc.text('Branch Code: 450105', leftMargin, finalY + 51);
    doc.text('Swift code: CABLZAJJ', leftMargin, finalY + 58);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Terms & Conditions:', leftMargin, finalY + 75);
    doc.setFont(undefined, 'normal');
    doc.text('1. This quote is valid for 30 days from the date of issue.', leftMargin, finalY + 85);
    doc.text('2. Payment terms: 50% deposit required to confirm order.', leftMargin, finalY + 92);
    doc.text('3. Delivery time: 2-3 weeks after confirmation of order.', leftMargin, finalY + 99);
    
    return doc.output('blob');
}

// Function to reset the page
function resetPage() {
    // Reset form
    document.getElementById('invoiceForm').reset();
    
    // Reset item count
    itemCount = 1;
    
    // Clear items container
    const itemsDiv = document.getElementById('items');
    itemsDiv.innerHTML = '';
    
    // Create initial item selector
    const itemSelector = new ItemSelectorComponent(0);
    itemsDiv.appendChild(itemSelector.getElement());
    
    // Reset buttons
    checkItemSelection();
}

// Handle form submission
document.getElementById('invoiceForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const loader = document.createElement('div');
    loader.className = 'loader';
    
    const text = document.createElement('div');
    text.className = 'overlay-text';
    text.textContent = 'Generating PDF...';
    
    overlay.appendChild(loader);
    overlay.appendChild(text);
    document.body.appendChild(overlay);

    const formData = new FormData(event.target);

    const customer = new Customer(
        formData.get('customerName'),
        formData.get('address'),
        formData.get('emailAddress'),
        formData.get('phone')
    );

    const items = [];
    for (let i = 0; i < itemCount; i++) {
        const itemContainer = document.querySelector(`#items .item:nth-child(${i + 1})`);
        if (!itemContainer) continue;

        const itemDropdown = itemContainer.querySelector('.item-dropdown');
        const sizeDropdown = itemContainer.querySelector('.size-dropdown');
        const optionDropdown = itemContainer.querySelector('.option-dropdown');
        const quantityInput = itemContainer.querySelector('input[type="number"]');

        if (!itemDropdown || !quantityInput) continue;

        const selectedOption = itemDropdown.options[itemDropdown.selectedIndex];
        if (!selectedOption || !selectedOption.value) continue;

        const quantity = parseFloat(quantityInput.value);
        if (!quantity || quantity <= 0) continue;

        // Get the item data
        const itemData = JSON.parse(selectedOption.dataset.itemData);
        if (!itemData) continue;

        let price = parseFloat(itemData.price);
        let description = itemData.name;

        // Add description if available
        if (itemData.description) {
            description += ` - ${itemData.description}`;
        }

        // If size is selected, get price from size dropdown
        if (sizeDropdown && sizeDropdown.value) {
            const selectedSizeOption = sizeDropdown.options[sizeDropdown.selectedIndex];
            price = parseFloat(selectedSizeOption.dataset.price);
            description += ` - ${sizeDropdown.value}`;
        }

        // Add option if selected
        if (optionDropdown && optionDropdown.value) {
            description += ` - ${optionDropdown.value}`;
        }

        // Debug logging
        console.log('Item Data:', itemData);
        console.log('Description:', description);
        console.log('Price:', price);
        console.log('Quantity:', quantity);

        // Validate price before adding to items
        if (isNaN(price)) {
            console.error('Invalid price for item:', description);
            continue;
        }
        
        items.push({
            description: description,
            quantity: quantity,
            price: price
        });
    }

    try {
        if (!logoLoaded) {
            console.warn("Logo not loaded yet, attempting to reload...");
            preloadLogo();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const pdfBlob = generatePDF(customer, items);
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Open in new tab
        window.open(pdfUrl, '_blank');

        // Set up download with friendly filename if user chooses to save
        const timestamp = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const quoteNo = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const sanitizedName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Create a link element for download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Invoice_${timestamp}_Quote${quoteNo}_${sanitizedName}.pdf`;
        document.body.appendChild(link);
        
        setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
            overlay.remove();
            resetPage();
            document.body.removeChild(link);
        }, 3000);
    } catch (error) {
        overlay.remove();
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
});

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load templates first
        const response = await fetch('/templates/item-selector.html');
        if (!response.ok) {
            throw new Error('Failed to load template');
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const template = doc.getElementById('itemSelectorTemplate');
        
        if (!template) {
            throw new Error('Item selector template not found');
        }
        
        // Add template to document
        document.body.appendChild(template);
        
        // Initialize the rest of the application
        preloadLogo();
        setupEventListeners();
        loadDropDown();
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error loading application. Please refresh the page.');
    }
}); 