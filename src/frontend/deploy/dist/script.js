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
        console.log("Logo loaded successfully");
        logoLoaded = true;
    };
    companyLogo.onerror = function() {
        console.error("Error loading logo");
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
    
    console.log('Has valid item:', hasValidItem);
    console.log('Add Item button disabled:', document.getElementById('addItemBtn').disabled);
    console.log('Generate Invoice button disabled:', document.getElementById('generateInvoiceBtn').disabled);
}

// Update event listeners
function setupEventListeners() {
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('item-dropdown')) {
            handleItemSelection(e.target.id);
        } else if (e.target.classList.contains('size-dropdown')) {
            handleSizeSelection(e.target.id);
        } else if (e.target.classList.contains('option-dropdown')) {
            handleOptionSelection(e.target.id);
        }
    });

    document.addEventListener('input', function(e) {
        if (e.target.type === 'number') {
            checkItemSelection();
        }
    });
}

// Load dropdown data from JSON
function loadDropDown() {
    const dataUrl = 'data.json'; 

    fetch(dataUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format');
            }
            
            dropdown = document.getElementById('item0');
            if (!dropdown) {
                console.error('Item dropdown not found');
                return;
            }
            
            dropdown.innerHTML = '';
            
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select board';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            dropdown.appendChild(defaultOption);
            
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                // Store the entire item object in the dataset
                option.dataset.itemData = JSON.stringify(item);
                dropdown.appendChild(option);
            });

            checkItemSelection();
        })
        .catch(error => {
            console.error('Error loading items data:', error);
            const dropdown = document.getElementById('item0');
            if (dropdown) {
                dropdown.innerHTML = '<option value="" disabled selected>Error loading items</option>';
            }
            alert('Error loading items. Please refresh the page or try again later.');
        });
}

// Add a new item row
function addItem() {
    const itemsDiv = document.getElementById('items');
    const newItem = document.createElement('div');
    newItem.classList.add('item');

    const newDropdown = document.createElement('select');
    newDropdown.id = `item${itemCount}`;
    newDropdown.name = `items[${itemCount}][description]`;
    newDropdown.classList.add('item-dropdown');
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select board';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    newDropdown.appendChild(defaultOption);
    
    const originalDropdown = document.getElementById('item0');
    Array.from(originalDropdown.options).slice(1).forEach(option => {
        const newOption = document.createElement('option');
        newOption.value = option.value;
        newOption.textContent = option.textContent;
        newOption.dataset.price = option.dataset.price;
        newOption.dataset.size = option.dataset.size;
        newOption.dataset.options = option.dataset.options;
        newOption.dataset.description = option.dataset.description;
        newDropdown.appendChild(newOption);
    });

    const newSizeLabel = document.createElement('label');
    newSizeLabel.htmlFor = `size${itemCount}`;
    newSizeLabel.textContent = 'Size:';
    newSizeLabel.classList.add('size-label', 'hidden');

    const newSizeDropdown = document.createElement('select');
    newSizeDropdown.id = `size${itemCount}`;
    newSizeDropdown.name = `items[${itemCount}][size]`;
    newSizeDropdown.classList.add('size-dropdown', 'hidden');
    newSizeDropdown.disabled = true;
    newSizeDropdown.value = '';

    const newOptionLabel = document.createElement('label');
    newOptionLabel.htmlFor = `option${itemCount}`;
    newOptionLabel.textContent = 'Options:';
    newOptionLabel.classList.add('option-label', 'hidden');

    const newOptionDropdown = document.createElement('select');
    newOptionDropdown.id = `option${itemCount}`;
    newOptionDropdown.name = `items[${itemCount}][option]`;
    newOptionDropdown.classList.add('option-dropdown', 'hidden');
    newOptionDropdown.disabled = true;
    newOptionDropdown.value = '';

    const newDescriptionGroup = document.createElement('div');
    newDescriptionGroup.id = `descriptionGroup${itemCount}`;
    newDescriptionGroup.classList.add('form-group');
    newDescriptionGroup.style.display = 'none';
    newDescriptionGroup.innerHTML = `
        <label>Description:</label>
        <div id="description${itemCount}" class="description-container">
            <span class="item-description"></span>
        </div>
    `;

    newItem.innerHTML = `
        <label for="${newDropdown.id}">Select an item:</label>
        ${newDropdown.outerHTML}
        ${newDescriptionGroup.outerHTML}
        ${newSizeLabel.outerHTML}
        ${newSizeDropdown.outerHTML}
        ${newOptionLabel.outerHTML}
        ${newOptionDropdown.outerHTML}
        <input type="number" name="items[${itemCount}][quantity]" placeholder="Quantity" style="display: none;" inputmode="numeric" pattern="[0-9]*">
        <label id="price${itemCount}" style="display: none;">Price: R0.00</label>
    `;

    itemsDiv.appendChild(newItem);
    itemCount++;
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
    doc.setFontSize(10);
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
        
        const description = item.description;
        const maxLength = 40;
        let formattedDescription = description;
        
        if (description.length > maxLength) {
            let breakPoint = description.lastIndexOf(' ', maxLength);
            if (breakPoint === -1) {
                breakPoint = description.lastIndexOf('-', maxLength);
            }
            if (breakPoint === -1) {
                breakPoint = maxLength;
            }
            
            formattedDescription = description.substring(0, breakPoint) + '\n' + 
                                description.substring(breakPoint + 1);
        }
        
        tableRows.push([
            formattedDescription,
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
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: logoSecondaryColor
        },
        foot: [['', '', { content: 'Total:', styles: { halign: 'center' } }, { content: formatCurrency(totalAmount), styles: { halign: 'center' } }]],
        footStyles: {
            fillColor: footerColor,
            textColor: [0, 0, 0],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 40, halign: 'center' }
        }
    });
    
    const finalY = doc.lastAutoTable.finalY || (topMargin + 115);
    
    doc.text('Capitec Business', leftMargin, finalY + 37);
    doc.text('Account No: 1052338658', leftMargin, finalY + 44);
    doc.text('Branch Code: 450105', leftMargin, finalY + 51);
    doc.text('Swift code: CABLZAJJ', leftMargin, finalY + 58);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Terms & Conditions:', leftMargin, finalY + 75);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('1. This quote is valid for 30 days from the date of issue.', leftMargin, finalY + 85);
    doc.text('2. Payment terms: 50% deposit required to confirm order.', leftMargin, finalY + 92);
    doc.text('3. Delivery time: 2-3 weeks after confirmation of order.', leftMargin, finalY + 99);
    
    return doc.output('blob');
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
        const description = formData.get(`items[${i}][description]`);
        const quantity = formData.get(`items[${i}][quantity]`);
        const selectedOption = document.getElementById(`item${i}`).options[document.getElementById(`item${i}`).selectedIndex];
        const selectedSize = document.getElementById(`size${i}`).value;
        const selectedOptionValue = document.getElementById(`option${i}`).value;
        
        if (description && 
            description !== 'undefined' && 
            description !== 'null' && 
            description.trim() !== '' && 
            quantity && 
            parseFloat(quantity) > 0) {
            
            const size = selectedOption.dataset.size;
            const itemDescription = selectedOption.dataset.description;
            
            let fullDescription = description;
            if (size && size !== 'undefined' && size !== 'null') {
                fullDescription += ` - ${size}`;
            }                   
            if (itemDescription && itemDescription !== 'undefined' && itemDescription !== 'null') {
                fullDescription += ` (${itemDescription})`;
            }
            if (selectedOptionValue && selectedOptionValue !== 'undefined' && selectedOptionValue !== 'null') {
                fullDescription += ` - ${selectedOptionValue}`;
            }
            
            items.push({
                description: fullDescription,
                quantity: parseFloat(quantity),
                price: parseFloat(selectedOption.dataset.price)
            });
        }
    }

    try {
        if (!logoLoaded) {
            console.warn("Logo not loaded yet, attempting to reload...");
            preloadLogo();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const pdfBlob = generatePDF(customer, items);
        const pdfUrl = URL.createObjectURL(pdfBlob);

        window.open(pdfUrl, '_blank');

        setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
        }, 3000);
    } catch (error) {
        overlay.remove();
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
});

// Function to handle item selection
function handleItemSelection(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const itemNumber = dropdownId.replace('item', '');
    const descriptionGroup = document.getElementById(`descriptionGroup${itemNumber}`);
    const descriptionSpan = descriptionGroup.querySelector('.item-description');
    const priceLabel = document.getElementById(`price${itemNumber}`);
    const sizeLabel = document.querySelector(`label[for="size${itemNumber}"]`);
    const sizeDropdown = document.getElementById(`size${itemNumber}`);
    const optionLabel = document.querySelector(`label[for="option${itemNumber}"]`);
    const optionDropdown = document.getElementById(`option${itemNumber}`);
    const quantityInput = document.querySelector(`input[name="items[${itemNumber}][quantity]"]`);

    // Clear previous values and hide description
    descriptionGroup.style.display = 'none';
    descriptionSpan.textContent = '';
    priceLabel.style.display = 'none';
    priceLabel.textContent = 'Price: R0.00';
    sizeDropdown.innerHTML = '<option value="" disabled selected>Select size</option>';
    optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
    quantityInput.style.display = 'none';
    quantityInput.value = '';

    // Hide size and option controls initially
    sizeLabel.classList.add('hidden');
    sizeDropdown.classList.add('hidden');
    optionLabel.classList.add('hidden');
    optionDropdown.classList.add('hidden');

    if (dropdown.value) {
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        const itemData = JSON.parse(selectedOption.dataset.itemData);
        const description = itemData.description;

        // Show description
        if (description && description !== 'undefined') {
            descriptionGroup.style.display = 'block';
            descriptionSpan.textContent = description;
        }

        // Handle sizes and prices
        if (itemData.sizes) {
            // Item has multiple sizes with different prices
            sizeLabel.classList.remove('hidden');
            sizeDropdown.classList.remove('hidden');
            sizeDropdown.disabled = false;
            sizeDropdown.innerHTML = '<option value="" disabled selected>Select size</option>';
            
            itemData.sizes.forEach(sizeData => {
                const sizeOption = document.createElement('option');
                sizeOption.value = sizeData.size;
                sizeOption.textContent = sizeData.size;
                sizeOption.dataset.price = sizeData.price;
                sizeDropdown.appendChild(sizeOption);
            });
        } else if (itemData.size) {
            // Item has a single size
            sizeLabel.classList.remove('hidden');
            sizeDropdown.classList.remove('hidden');
            sizeDropdown.disabled = false;
            sizeDropdown.innerHTML = '<option value="" disabled selected>Select size</option>';
            
            const sizeOption = document.createElement('option');
            sizeOption.value = itemData.size;
            sizeOption.textContent = itemData.size;
            sizeOption.dataset.price = itemData.price;
            sizeDropdown.appendChild(sizeOption);
            
            // Auto-select size if it's the only option
            sizeDropdown.value = itemData.size;
            handleSizeSelection(sizeDropdown.id);
        } else {
            // Item has no size options
            priceLabel.textContent = `Price: R${itemData.price}`;
            priceLabel.style.display = 'block';
            quantityInput.style.display = 'block';
            quantityInput.setAttribute('required', '');
        }

        // Handle options if available
        if (itemData.options && itemData.options.length > 0) {
            optionLabel.classList.remove('hidden');
            optionDropdown.classList.remove('hidden');
            optionDropdown.disabled = false;
            optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
            
            itemData.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                optionDropdown.appendChild(optionElement);
            });
        }
    }

    // Check if all required fields are filled
    checkItemSelection();
}

// Function to handle size selection
function handleSizeSelection(sizeDropdownId) {
    const sizeDropdown = document.getElementById(sizeDropdownId);
    const itemNumber = sizeDropdownId.replace('size', '');
    const optionLabel = document.querySelector(`label[for="option${itemNumber}"]`);
    const optionDropdown = document.getElementById(`option${itemNumber}`);
    const quantityInput = document.querySelector(`input[name="items[${itemNumber}][quantity]"]`);
    const priceLabel = document.getElementById(`price${itemNumber}`);

    optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
    optionLabel.classList.add('hidden');
    optionDropdown.classList.add('hidden');
    optionDropdown.disabled = true;
    quantityInput.style.display = 'none';
    quantityInput.value = '';

    if (sizeDropdown.value) {
        const selectedSizeOption = sizeDropdown.options[sizeDropdown.selectedIndex];
        const price = selectedSizeOption.dataset.price;
        priceLabel.textContent = `Price: R${price}`;
        priceLabel.style.display = 'block';

        const selectedItem = document.getElementById(`item${itemNumber}`);
        const itemData = JSON.parse(selectedItem.options[selectedItem.selectedIndex].dataset.itemData);
        const options = itemData.options || [];

        if (options.length > 0) {
            optionLabel.classList.remove('hidden');
            optionDropdown.classList.remove('hidden');
            optionDropdown.disabled = false;
            optionDropdown.innerHTML = '<option value="" disabled selected>Select option</option>';
            
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                optionDropdown.appendChild(optionElement);
            });

            if (options.length === 1) {
                optionDropdown.value = options[0];
                handleOptionSelection(optionDropdown.id);
            }
        } else {
            quantityInput.style.display = 'block';
            quantityInput.setAttribute('required', '');
        }
    }

    checkItemSelection();
}

// Function to handle option selection
function handleOptionSelection(optionDropdownId) {
    const optionDropdown = document.getElementById(optionDropdownId);
    const itemNumber = optionDropdownId.replace('option', '');
    const quantityInput = document.querySelector(`input[name="items[${itemNumber}][quantity]"]`);

    if (optionDropdown.value) {
        quantityInput.style.display = 'block';
        quantityInput.setAttribute('required', '');
    } else {
        quantityInput.style.display = 'none';
        quantityInput.removeAttribute('required');
        quantityInput.value = '';
    }

    checkItemSelection();
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.getElementById('item0');
    const descriptionContainer = document.getElementById('description0');
    
    if (!dropdown || !descriptionContainer) {
        console.error('Required DOM elements not found');
        return;
    }

    preloadLogo();
    setupEventListeners();
    loadDropDown();
}); 