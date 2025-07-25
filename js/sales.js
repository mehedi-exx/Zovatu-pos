// Sales and Invoice Management

let invoices = [];
let customers = [];
let products = [];
let currentInvoice = null;
let scannedItems = [];

// Initialize sales page
document.addEventListener('DOMContentLoaded', function() {
    if (!auth.protectPage()) return;
    
    loadData();
    setupEventListeners();
    setDefaultDate();
});

// Load data from storage
function loadData() {
    invoices = utils.getFromStorage('invoices', []);
    customers = utils.getFromStorage('customers', []);
    products = utils.getFromStorage('products', []);
    
    displayInvoices();
    loadCustomersDropdown();
}

// Setup event listeners
function setupEventListeners() {
    // Invoice form submission
    document.getElementById('invoiceForm').addEventListener('submit', handleInvoiceSubmit);
    
    // Product search input
    document.getElementById('productSearch').addEventListener('input', debounce(searchProductsForInvoice, 300));
    
    // Overall discount and tax change
    document.getElementById('overallDiscount').addEventListener('input', calculateInvoiceTotal);
    document.getElementById('invoiceTax').addEventListener('input', calculateInvoiceTotal);
}

// Set default date
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
}

// Load customers dropdown
function loadCustomersDropdown() {
    const customerSelect = document.getElementById('invoiceCustomer');
    customerSelect.innerHTML = '<option value="">Walk-in Customer</option>' +
        customers.map(customer => `<option value="${customer.id}">${customer.name} - ${customer.phone}</option>`).join('');
}

// Display invoices in table
function displayInvoices(invoicesToShow = invoices) {
    const tbody = document.getElementById('invoicesTableBody');
    
    if (invoicesToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No invoices found</td></tr>';
        return;
    }
    
    tbody.innerHTML = invoicesToShow.map(invoice => `
        <tr>
            <td>${invoice.invoiceNumber}</td>
            <td>${utils.formatDate(invoice.date)}</td>
            <td>${invoice.customerName || 'Walk-in Customer'}</td>
            <td>${invoice.items.length} item(s)</td>
            <td>${utils.formatCurrency(invoice.grandTotal)}</td>
            <td>
                <span class="status-badge status-${invoice.status || 'completed'}">
                    ${(invoice.status || 'completed').charAt(0).toUpperCase() + (invoice.status || 'completed').slice(1)}
                </span>
            </td>
            <td class="actions">
                <button onclick="viewInvoice('${invoice.id}')" class="btn-primary" style="padding: 5px 10px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="printInvoice('${invoice.id}')" class="btn-success" style="padding: 5px 10px;">
                    <i class="fas fa-print"></i>
                </button>
                <button onclick="deleteInvoice('${invoice.id}')" class="btn-danger" style="padding: 5px 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add status badge styles if not already added
    if (!document.getElementById('statusBadgeStyles')) {
        const styles = document.createElement('style');
        styles.id = 'statusBadgeStyles';
        styles.textContent = `
            .status-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            .status-completed { background-color: #d4edda; color: #155724; }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-cancelled { background-color: #f8d7da; color: #721c24; }
            .invoice-totals {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-top: 10px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .total-row input {
                width: 80px;
                text-align: right;
            }
            .grand-total {
                border-top: 2px solid #007bff;
                padding-top: 10px;
                font-size: 1.1rem;
            }
            .suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-top: none;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
            }
            .suggestion-item {
                padding: 10px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            }
            .suggestion-item:hover {
                background-color: #f8f9fa;
            }
            .suggestion-item:last-child {
                border-bottom: none;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Search invoices
function searchInvoices() {
    const searchTerm = document.getElementById('searchInvoices').value;
    const filteredInvoices = utils.performSearch(searchTerm, invoices, ['invoiceNumber', 'customerName']);
    displayInvoices(filteredInvoices);
}

// Filter invoices by date
function filterInvoices() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    let filteredInvoices = invoices;
    
    if (dateFrom) {
        filteredInvoices = filteredInvoices.filter(inv => inv.date >= dateFrom);
    }
    
    if (dateTo) {
        filteredInvoices = filteredInvoices.filter(inv => inv.date <= dateTo);
    }
    
    displayInvoices(filteredInvoices);
}

// Show create invoice modal
function showCreateInvoiceModal() {
    currentInvoice = {
        id: utils.generateId('inv_'),
        invoiceNumber: utils.generateInvoiceNumber(),
        items: [],
        subtotal: 0,
        overallDiscount: 0,
        tax: 0,
        grandTotal: 0
    };
    
    document.getElementById('invoiceModalTitle').textContent = 'Create Invoice';
    document.getElementById('invoiceForm').reset();
    setDefaultDate();
    clearInvoiceItems();
    calculateInvoiceTotal();
    
    utils.showModal('invoiceModal');
}

// Hide invoice modal
function hideInvoiceModal() {
    utils.hideModal('invoiceModal');
    currentInvoice = null;
    clearInvoiceItems();
}

// Search products for invoice
function searchProductsForInvoice() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const suggestions = document.getElementById('productSuggestions');
    
    if (searchTerm.length < 2) {
        suggestions.style.display = 'none';
        return;
    }
    
    const matchingProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.code.toLowerCase().includes(searchTerm) ||
        (product.barcodeValue && product.barcodeValue.toLowerCase().includes(searchTerm))
    ).slice(0, 10);
    
    if (matchingProducts.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    suggestions.innerHTML = matchingProducts.map(product => `
        <div class="suggestion-item" onclick="addProductToInvoice('${product.id}')">
            <strong>${product.name}</strong> (${product.code})<br>
            <small>Price: ${utils.formatCurrency(product.price)} | Stock: ${product.stock}</small>
        </div>
    `).join('');
    
    suggestions.style.display = 'block';
}

// Handle product search keydown
function handleProductSearchKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchTerm = event.target.value;
        
        // Try to find exact match by code or barcode
        const product = products.find(p => 
            p.code === searchTerm || 
            p.barcodeValue === searchTerm
        );
        
        if (product) {
            addProductToInvoice(product.id);
            event.target.value = '';
            document.getElementById('productSuggestions').style.display = 'none';
        }
    }
}

// Add product to invoice
function addProductToInvoice(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product already exists in invoice
    const existingItem = currentInvoice.items.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.subtotal = existingItem.quantity * existingItem.price * (1 - existingItem.discount / 100);
    } else {
        const newItem = {
            productId: productId,
            productName: product.name,
            productCode: product.code,
            price: product.price,
            quantity: 1,
            discount: 0,
            subtotal: product.price
        };
        currentInvoice.items.push(newItem);
    }
    
    displayInvoiceItems();
    calculateInvoiceTotal();
    
    // Clear search
    document.getElementById('productSearch').value = '';
    document.getElementById('productSuggestions').style.display = 'none';
}

// Display invoice items
function displayInvoiceItems() {
    const tbody = document.getElementById('invoiceItemsBody');
    const noItemsMessage = document.getElementById('noItemsMessage');
    
    if (currentInvoice.items.length === 0) {
        tbody.innerHTML = '';
        noItemsMessage.style.display = 'block';
        return;
    }
    
    noItemsMessage.style.display = 'none';
    tbody.innerHTML = currentInvoice.items.map((item, index) => `
        <tr>
            <td>${item.productName} (${item.productCode})</td>
            <td>${utils.formatCurrency(item.price)}</td>
            <td>
                <input type="number" value="${item.quantity}" min="1" 
                       onchange="updateItemQuantity(${index}, this.value)" 
                       style="width: 60px;">
            </td>
            <td>
                <input type="number" value="${item.discount}" min="0" max="100" 
                       onchange="updateItemDiscount(${index}, this.value)" 
                       style="width: 60px;">
            </td>
            <td>${utils.formatCurrency(item.subtotal)}</td>
            <td>
                <button onclick="removeInvoiceItem(${index})" class="btn-danger" style="padding: 5px 8px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update item quantity
function updateItemQuantity(index, quantity) {
    const qty = parseInt(quantity) || 1;
    currentInvoice.items[index].quantity = qty;
    currentInvoice.items[index].subtotal = qty * currentInvoice.items[index].price * (1 - currentInvoice.items[index].discount / 100);
    
    displayInvoiceItems();
    calculateInvoiceTotal();
}

// Update item discount
function updateItemDiscount(index, discount) {
    const disc = parseFloat(discount) || 0;
    currentInvoice.items[index].discount = disc;
    currentInvoice.items[index].subtotal = currentInvoice.items[index].quantity * currentInvoice.items[index].price * (1 - disc / 100);
    
    displayInvoiceItems();
    calculateInvoiceTotal();
}

// Remove invoice item
function removeInvoiceItem(index) {
    currentInvoice.items.splice(index, 1);
    displayInvoiceItems();
    calculateInvoiceTotal();
}

// Clear invoice items
function clearInvoiceItems() {
    if (currentInvoice) {
        currentInvoice.items = [];
        displayInvoiceItems();
        calculateInvoiceTotal();
    }
}

// Calculate invoice total
function calculateInvoiceTotal() {
    if (!currentInvoice) return;
    
    // Calculate subtotal
    const subtotal = currentInvoice.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Apply overall discount
    const overallDiscount = parseFloat(document.getElementById('overallDiscount').value) || 0;
    const discountAmount = subtotal * (overallDiscount / 100);
    const afterDiscount = subtotal - discountAmount;
    
    // Apply tax
    const tax = parseFloat(document.getElementById('invoiceTax').value) || 0;
    const taxAmount = afterDiscount * (tax / 100);
    const grandTotal = afterDiscount + taxAmount;
    
    // Update display
    document.getElementById('invoiceSubtotal').textContent = utils.formatCurrency(subtotal);
    document.getElementById('invoiceGrandTotal').textContent = utils.formatCurrency(grandTotal);
    
    // Update current invoice
    currentInvoice.subtotal = subtotal;
    currentInvoice.overallDiscount = overallDiscount;
    currentInvoice.tax = tax;
    currentInvoice.grandTotal = grandTotal;
}

// Handle invoice form submission
function handleInvoiceSubmit(e) {
    e.preventDefault();
    
    if (!currentInvoice || currentInvoice.items.length === 0) {
        utils.showNotification('Please add at least one item to the invoice', 'error');
        return;
    }
    
    // Get form data
    const customerId = document.getElementById('invoiceCustomer').value;
    const customer = customers.find(c => c.id === customerId);
    const date = document.getElementById('invoiceDate').value;
    const notes = document.getElementById('invoiceNotes').value;
    
    // Create invoice
    const invoice = {
        ...currentInvoice,
        customerId: customerId || null,
        customerName: customer ? customer.name : 'Walk-in Customer',
        customerPhone: customer ? customer.phone : '',
        date: date,
        notes: notes,
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: auth.getCurrentUser().username
    };
    
    // Update product stock
    let stockUpdateFailed = false;
    for (const item of invoice.items) {
        if (!window.productsModule.updateProductStock(item.productId, item.quantity, 'subtract')) {
            stockUpdateFailed = true;
            utils.showNotification(`Insufficient stock for ${item.productName}`, 'error');
            break;
        }
    }
    
    if (stockUpdateFailed) {
        return;
    }
    
    // Save invoice
    invoices.push(invoice);
    utils.saveToStorage('invoices', invoices);
    
    // Update customer purchase history
    if (customer) {
        customer.totalPurchases = (customer.totalPurchases || 0) + invoice.grandTotal;
        customer.lastPurchase = date;
        utils.saveToStorage('customers', customers);
    }
    
    utils.showNotification('Invoice created successfully', 'success');
    hideInvoiceModal();
    loadData();
}

// Save and print invoice
function saveAndPrintInvoice() {
    // First save the invoice
    const form = document.getElementById('invoiceForm');
    const submitEvent = new Event('submit');
    form.dispatchEvent(submitEvent);
    
    // Then print it (will be handled after save)
    setTimeout(() => {
        if (invoices.length > 0) {
            const lastInvoice = invoices[invoices.length - 1];
            printInvoice(lastInvoice.id);
        }
    }, 500);
}

// View invoice details
function viewInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const content = generateInvoiceHTML(invoice);
    document.getElementById('invoiceDetailsContent').innerHTML = content;
    utils.showModal('invoiceDetailsModal');
}

// Hide invoice details modal
function hideInvoiceDetailsModal() {
    utils.hideModal('invoiceDetailsModal');
}

// Print invoice
function printInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const content = generateInvoiceHTML(invoice, true);
    utils.printContent(content, `Invoice ${invoice.invoiceNumber}`);
}

// Generate invoice HTML
function generateInvoiceHTML(invoice, forPrint = false) {
    const settings = utils.getFromStorage('settings', {});
    
    return `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #007bff; margin: 0;">${settings.shopName || 'Billing Pro'}</h1>
                <p style="margin: 5px 0;">${settings.shopAddress || ''}</p>
                <p style="margin: 5px 0;">Phone: ${settings.shopPhone || ''} | Email: ${settings.shopEmail || ''}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div>
                    <h2 style="color: #333; margin: 0;">INVOICE</h2>
                    <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                    <p><strong>Date:</strong> ${utils.formatDate(invoice.date)}</p>
                </div>
                <div style="text-align: right;">
                    <h3 style="margin: 0;">Bill To:</h3>
                    <p style="margin: 5px 0;"><strong>${invoice.customerName}</strong></p>
                    ${invoice.customerPhone ? `<p style="margin: 5px 0;">Phone: ${invoice.customerPhone}</p>` : ''}
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Item</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Price</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Qty</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Discount</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;">${item.productName} (${item.productCode})</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${utils.formatCurrency(item.price)}</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.quantity}</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${item.discount}%</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${utils.formatCurrency(item.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="text-align: right; margin-bottom: 20px;">
                <p><strong>Subtotal: ${utils.formatCurrency(invoice.subtotal)}</strong></p>
                ${invoice.overallDiscount > 0 ? `<p>Overall Discount (${invoice.overallDiscount}%): -${utils.formatCurrency(invoice.subtotal * invoice.overallDiscount / 100)}</p>` : ''}
                ${invoice.tax > 0 ? `<p>Tax (${invoice.tax}%): ${utils.formatCurrency((invoice.subtotal - invoice.subtotal * invoice.overallDiscount / 100) * invoice.tax / 100)}</p>` : ''}
                <h3 style="color: #007bff;">Grand Total: ${utils.formatCurrency(invoice.grandTotal)}</h3>
            </div>
            
            ${invoice.notes ? `<div style="margin-bottom: 20px;"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
            
            <div style="text-align: center; margin-top: 40px; font-size: 0.9rem; color: #666;">
                <p>Thank you for your business!</p>
                <p>Generated on ${utils.formatDateTime(new Date().toISOString())}</p>
            </div>
            
            ${!forPrint ? `
                <div style="text-align: center; margin-top: 20px;" class="no-print">
                    <button onclick="printInvoice('${invoice.id}')" class="btn-primary">
                        <i class="fas fa-print"></i> Print Invoice
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Delete invoice
function deleteInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    utils.confirmDialog(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`, () => {
        // Restore product stock
        for (const item of invoice.items) {
            window.productsModule.updateProductStock(item.productId, item.quantity, 'add');
        }
        
        // Remove invoice
        invoices = invoices.filter(inv => inv.id !== invoiceId);
        utils.saveToStorage('invoices', invoices);
        
        loadData();
        utils.showNotification('Invoice deleted successfully', 'success');
    });
}

// Scanner billing functions
function showScannerModal() {
    scannedItems = [];
    document.getElementById('scannerInput').value = '';
    displayScannedItems();
    calculateScannerTotal();
    utils.showModal('scannerModal');
    
    // Focus on scanner input
    setTimeout(() => {
        document.getElementById('scannerInput').focus();
    }, 100);
}

function hideScannerModal() {
    utils.hideModal('scannerModal');
    scannedItems = [];
}

function handleScannerInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const code = event.target.value.trim();
        
        if (code) {
            addScannedProduct(code);
            event.target.value = '';
        }
    }
}

function addScannedProduct(code) {
    const product = products.find(p => p.code === code || p.barcodeValue === code);
    
    if (!product) {
        utils.showNotification('Product not found', 'error');
        return;
    }
    
    // Check if product already scanned
    const existingItem = scannedItems.find(item => item.productId === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.total = existingItem.quantity * existingItem.price;
    } else {
        scannedItems.push({
            productId: product.id,
            productName: product.name,
            productCode: product.code,
            price: product.price,
            quantity: 1,
            total: product.price
        });
    }
    
    displayScannedItems();
    calculateScannerTotal();
}

function displayScannedItems() {
    const tbody = document.getElementById('scannedItemsBody');
    const noItemsMessage = document.getElementById('noScannedItemsMessage');
    
    if (scannedItems.length === 0) {
        tbody.innerHTML = '';
        noItemsMessage.style.display = 'block';
        return;
    }
    
    noItemsMessage.style.display = 'none';
    tbody.innerHTML = scannedItems.map((item, index) => `
        <tr>
            <td>${item.productName} (${item.productCode})</td>
            <td>${utils.formatCurrency(item.price)}</td>
            <td>
                <input type="number" value="${item.quantity}" min="1" 
                       onchange="updateScannedItemQuantity(${index}, this.value)" 
                       style="width: 60px;">
            </td>
            <td>${utils.formatCurrency(item.total)}</td>
            <td>
                <button onclick="removeScannedItem(${index})" class="btn-danger" style="padding: 5px 8px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateScannedItemQuantity(index, quantity) {
    const qty = parseInt(quantity) || 1;
    scannedItems[index].quantity = qty;
    scannedItems[index].total = qty * scannedItems[index].price;
    
    displayScannedItems();
    calculateScannerTotal();
}

function removeScannedItem(index) {
    scannedItems.splice(index, 1);
    displayScannedItems();
    calculateScannerTotal();
}

function clearScannerItems() {
    scannedItems = [];
    displayScannedItems();
    calculateScannerTotal();
}

function calculateScannerTotal() {
    const total = scannedItems.reduce((sum, item) => sum + item.total, 0);
    document.getElementById('scannerTotal').textContent = utils.formatCurrency(total);
}

function completeScannerSale() {
    if (scannedItems.length === 0) {
        utils.showNotification('No items scanned', 'error');
        return;
    }
    
    // Create invoice from scanned items
    const invoice = {
        id: utils.generateId('inv_'),
        invoiceNumber: utils.generateInvoiceNumber(),
        customerId: null,
        customerName: 'Walk-in Customer',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
        items: scannedItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode,
            price: item.price,
            quantity: item.quantity,
            discount: 0,
            subtotal: item.total
        })),
        subtotal: scannedItems.reduce((sum, item) => sum + item.total, 0),
        overallDiscount: 0,
        tax: 0,
        grandTotal: scannedItems.reduce((sum, item) => sum + item.total, 0),
        notes: 'Scanner Sale',
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: auth.getCurrentUser().username
    };
    
    // Update product stock
    let stockUpdateFailed = false;
    for (const item of invoice.items) {
        if (!window.productsModule.updateProductStock(item.productId, item.quantity, 'subtract')) {
            stockUpdateFailed = true;
            utils.showNotification(`Insufficient stock for ${item.productName}`, 'error');
            break;
        }
    }
    
    if (stockUpdateFailed) {
        return;
    }
    
    // Save invoice
    invoices.push(invoice);
    utils.saveToStorage('invoices', invoices);
    
    utils.showNotification('Sale completed successfully', 'success');
    hideScannerModal();
    loadData();
}

function printScannerReceipt() {
    if (scannedItems.length === 0) {
        utils.showNotification('No items to print', 'error');
        return;
    }
    
    const settings = utils.getFromStorage('settings', {});
    const total = scannedItems.reduce((sum, item) => sum + item.total, 0);
    
    const content = `
        <div style="max-width: 300px; margin: 0 auto; font-family: monospace;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">${settings.shopName || 'Billing Pro'}</h2>
                <p style="margin: 5px 0; font-size: 0.9rem;">${settings.shopAddress || ''}</p>
                <p style="margin: 5px 0; font-size: 0.9rem;">Phone: ${settings.shopPhone || ''}</p>
                <hr>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p><strong>Date:</strong> ${utils.formatDateTime(new Date().toISOString())}</p>
                <p><strong>Cashier:</strong> ${auth.getCurrentUser().username}</p>
                <hr>
            </div>
            
            <table style="width: 100%; font-size: 0.9rem;">
                ${scannedItems.map(item => `
                    <tr>
                        <td colspan="3">${item.productName}</td>
                    </tr>
                    <tr>
                        <td>${item.quantity} x ${utils.formatCurrency(item.price)}</td>
                        <td></td>
                        <td style="text-align: right;">${utils.formatCurrency(item.total)}</td>
                    </tr>
                `).join('')}
            </table>
            
            <hr>
            <div style="text-align: right; font-size: 1.1rem;">
                <p><strong>Total: ${utils.formatCurrency(total)}</strong></p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 0.8rem;">
                <p>Thank you for your purchase!</p>
                <p>Please come again</p>
            </div>
        </div>
    `;
    
    utils.printContent(content, 'Receipt');
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Hide suggestions when clicking outside
document.addEventListener('click', function(event) {
    const suggestions = document.getElementById('productSuggestions');
    const searchInput = document.getElementById('productSearch');
    
    if (suggestions && !suggestions.contains(event.target) && event.target !== searchInput) {
        suggestions.style.display = 'none';
    }
});

// Export functions for use in other modules
window.salesModule = {
    invoices: () => invoices,
    getTotalSales: () => invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
    getSalesCount: () => invoices.length,
    getRecentInvoices: (limit = 5) => invoices.slice(-limit).reverse()
};

