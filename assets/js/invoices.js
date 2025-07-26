// Zovatu Billing Tool - Invoices JavaScript
// Handles invoice creation, multi-product entry, calculations, and printing

class InvoiceManager {
    constructor() {
        this.invoices = [];
        this.products = [];
        this.customers = [];
        this.currentInvoice = {
            id: null,
            number: '',
            date: '',
            customer: null,
            items: [],
            subtotal: 0,
            discount: 0,
            discountType: 'amount',
            tax: 0,
            taxRate: 0,
            total: 0,
            amountReceived: 0,
            change: 0,
            paymentMethod: 'cash',
            notes: '',
            status: 'pending'
        };
        this.scanner = null;
        this.calculator = {
            display: '0',
            previousValue: null,
            operation: null,
            waitingForOperand: false
        };
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.generateInvoiceNumber();
        this.setCurrentDate();
        this.populateCustomers();
        this.loadSettings();
        this.renderInvoices();
    }

    loadData() {
        this.invoices = DataManager.get('invoices') || [];
        this.products = DataManager.get('products') || [];
        this.customers = DataManager.get('customers') || [];
    }

    saveInvoices() {
        DataManager.set('invoices', this.invoices);
        // Also save to sales data for dashboard analytics
        const sales = DataManager.get('sales') || [];
        const paidInvoices = this.invoices.filter(inv => inv.status === 'paid');
        DataManager.set('sales', paidInvoices.map(inv => ({
            id: inv.id,
            date: inv.date,
            total: inv.total,
            items: inv.items,
            customer: inv.customer
        })));
    }

    loadSettings() {
        const settings = ZovatuApp.settings;
        if (settings.invoice) {
            document.getElementById('taxRate').value = settings.invoice.taxRate || 0;
        }
    }

    setupEventListeners() {
        // Main action buttons
        document.getElementById('newInvoiceBtn').addEventListener('click', () => {
            this.newInvoice();
        });

        document.getElementById('quickSaleBtn').addEventListener('click', () => {
            this.quickSale();
        });

        document.getElementById('scanProductBtn').addEventListener('click', () => {
            this.openProductScannerModal();
        });

        // Invoice form buttons
        document.getElementById('saveInvoiceBtn').addEventListener('click', () => {
            this.saveInvoice();
        });

        document.getElementById('printInvoiceBtn').addEventListener('click', () => {
            this.printInvoice();
        });

        document.getElementById('clearInvoiceBtn').addEventListener('click', () => {
            this.clearInvoice();
        });

        // Product search and add
        document.getElementById('productSearch').addEventListener('input', 
            ZovatuApp.debounce(() => this.searchProducts(), 300)
        );

        document.getElementById('productSearch').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addProductBySearch();
            }
        });

        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.addProductBySearch();
        });

        // Calculation inputs
        document.getElementById('discountAmount').addEventListener('input', () => {
            this.calculateTotals();
        });

        document.getElementById('discountType').addEventListener('change', () => {
            this.calculateTotals();
        });

        document.getElementById('taxRate').addEventListener('input', () => {
            this.calculateTotals();
        });

        document.getElementById('amountReceived').addEventListener('input', () => {
            this.calculateChange();
        });

        // Quick payment buttons
        document.getElementById('exactAmountBtn').addEventListener('click', () => {
            document.getElementById('amountReceived').value = this.currentInvoice.total;
            this.calculateChange();
        });

        document.getElementById('roundUpBtn').addEventListener('click', () => {
            const roundedAmount = Math.ceil(this.currentInvoice.total);
            document.getElementById('amountReceived').value = roundedAmount;
            this.calculateChange();
        });

        // Calculator
        document.getElementById('calculatorBtn').addEventListener('click', () => {
            this.openCalculatorModal();
        });

        // Calculator buttons
        document.querySelectorAll('.calculator-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCalculatorInput(e.target);
            });
        });

        document.getElementById('useCalculatorResultBtn').addEventListener('click', () => {
            this.useCalculatorResult();
        });

        // Invoice search and filter
        document.getElementById('invoiceSearchInput').addEventListener('input',
            ZovatuApp.debounce(() => this.filterInvoices(), 300)
        );

        document.getElementById('invoiceStatusFilter').addEventListener('change', () => {
            this.filterInvoices();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.printInvoice();
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveInvoice();
            } else if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.newInvoice();
            }
        });

        // Hide product suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#productSearch') && !e.target.closest('#productSuggestions')) {
                this.hideProductSuggestions();
            }
        });
    }

    generateInvoiceNumber() {
        const settings = ZovatuApp.settings.invoice || {};
        const prefix = settings.prefix || 'INV';
        const startNumber = settings.startNumber || 1;
        const nextNumber = this.invoices.length + startNumber;
        const invoiceNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
        
        document.getElementById('invoiceNumber').value = invoiceNumber;
        this.currentInvoice.number = invoiceNumber;
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;
        this.currentInvoice.date = today;
    }

    populateCustomers() {
        const customerSelect = document.getElementById('customerSelect');
        customerSelect.innerHTML = '<option value="">Walk-in Customer</option>';
        
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} - ${customer.phone || 'No phone'}`;
            customerSelect.appendChild(option);
        });
    }

    newInvoice() {
        this.clearInvoice();
        this.generateInvoiceNumber();
        this.setCurrentDate();
        ZovatuApp.showNotification('New invoice created', 'success');
    }

    clearInvoice() {
        this.currentInvoice = {
            id: null,
            number: '',
            date: '',
            customer: null,
            items: [],
            subtotal: 0,
            discount: 0,
            discountType: 'amount',
            tax: 0,
            taxRate: 0,
            total: 0,
            amountReceived: 0,
            change: 0,
            paymentMethod: 'cash',
            notes: '',
            status: 'pending'
        };

        // Clear form
        document.getElementById('customerSelect').value = '';
        document.getElementById('paymentMethod').value = 'cash';
        document.getElementById('productSearch').value = '';
        document.getElementById('discountAmount').value = '';
        document.getElementById('discountType').value = 'amount';
        document.getElementById('taxRate').value = ZovatuApp.settings.invoice?.taxRate || 0;
        document.getElementById('amountReceived').value = '';
        document.getElementById('invoiceNotes').value = '';

        this.renderInvoiceItems();
        this.calculateTotals();
        this.hideProductSuggestions();
    }

    quickSale() {
        this.newInvoice();
        document.getElementById('productSearch').focus();
        ZovatuApp.showNotification('Quick sale mode - scan or search products', 'info');
    }

    searchProducts() {
        const searchTerm = document.getElementById('productSearch').value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            this.hideProductSuggestions();
            return;
        }

        const matchingProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.code.toLowerCase().includes(searchTerm) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm)) ||
            (product.category && product.category.toLowerCase().includes(searchTerm))
        ).slice(0, 10);

        this.showProductSuggestions(matchingProducts);
    }

    showProductSuggestions(products) {
        const suggestionsDiv = document.getElementById('productSuggestions');
        
        if (products.length === 0) {
            this.hideProductSuggestions();
            return;
        }

        suggestionsDiv.innerHTML = products.map(product => `
            <div class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0" 
                 onclick="invoiceManager.addProductToInvoice('${product.id}')">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-medium text-gray-900">${product.name}</p>
                        <p class="text-sm text-gray-500">Code: ${product.code} | Stock: ${product.stock} ${product.unit}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-medium text-blue-600">${ZovatuApp.formatCurrency(product.price)}</p>
                        ${product.stock <= product.lowStock ? '<span class="text-xs text-red-500">Low Stock</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');

        suggestionsDiv.classList.remove('hidden');
    }

    hideProductSuggestions() {
        document.getElementById('productSuggestions').classList.add('hidden');
    }

    addProductBySearch() {
        const searchTerm = document.getElementById('productSearch').value.toLowerCase().trim();
        
        if (!searchTerm) {
            ZovatuApp.showNotification('Please enter a product name or code', 'warning');
            return;
        }

        // Find exact match first
        let product = this.products.find(p => 
            p.code.toLowerCase() === searchTerm ||
            p.barcode === searchTerm
        );

        // If no exact match, find first partial match
        if (!product) {
            product = this.products.find(p => 
                p.name.toLowerCase().includes(searchTerm)
            );
        }

        if (product) {
            this.addProductToInvoice(product.id);
        } else {
            ZovatuApp.showNotification('Product not found', 'warning');
        }
    }

    addProductToInvoice(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        
        if (!product) {
            ZovatuApp.showNotification('Product not found', 'danger');
            return;
        }

        if (product.stock < quantity) {
            ZovatuApp.showNotification('Insufficient stock', 'warning');
            return;
        }

        // Check if product already exists in invoice
        const existingItem = this.currentInvoice.items.find(item => item.productId === productId);
        
        if (existingItem) {
            if (product.stock < existingItem.quantity + quantity) {
                ZovatuApp.showNotification('Insufficient stock for additional quantity', 'warning');
                return;
            }
            existingItem.quantity += quantity;
            existingItem.total = existingItem.quantity * existingItem.price;
        } else {
            this.currentInvoice.items.push({
                productId: productId,
                name: product.name,
                code: product.code,
                price: product.price,
                quantity: quantity,
                total: product.price * quantity,
                unit: product.unit
            });
        }

        document.getElementById('productSearch').value = '';
        this.hideProductSuggestions();
        this.renderInvoiceItems();
        this.calculateTotals();
        
        ZovatuApp.showNotification(`${product.name} added to invoice`, 'success');
    }

    removeItemFromInvoice(index) {
        this.currentInvoice.items.splice(index, 1);
        this.renderInvoiceItems();
        this.calculateTotals();
        ZovatuApp.showNotification('Item removed from invoice', 'success');
    }

    updateItemQuantity(index, newQuantity) {
        const item = this.currentInvoice.items[index];
        const product = this.products.find(p => p.id === item.productId);
        
        if (newQuantity <= 0) {
            this.removeItemFromInvoice(index);
            return;
        }

        if (product && product.stock < newQuantity) {
            ZovatuApp.showNotification('Insufficient stock', 'warning');
            return;
        }

        item.quantity = newQuantity;
        item.total = item.price * newQuantity;
        
        this.renderInvoiceItems();
        this.calculateTotals();
    }

    renderInvoiceItems() {
        const tbody = document.getElementById('invoiceItems');
        
        if (this.currentInvoice.items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500">
                        <i class="fas fa-shopping-cart text-4xl mb-2"></i>
                        <p>No items added. Search and add products to create invoice.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.currentInvoice.items.map((item, index) => `
            <tr>
                <td>
                    <div>
                        <p class="font-medium text-gray-900">${item.name}</p>
                        <p class="text-sm text-gray-500">Code: ${item.code}</p>
                    </div>
                </td>
                <td>
                    <span class="font-medium">${ZovatuApp.formatCurrency(item.price)}</span>
                </td>
                <td>
                    <div class="flex items-center space-x-2">
                        <button onclick="invoiceManager.updateItemQuantity(${index}, ${item.quantity - 1})" 
                                class="btn btn-sm btn-secondary w-8 h-8 p-0">-</button>
                        <input type="number" value="${item.quantity}" min="1" 
                               onchange="invoiceManager.updateItemQuantity(${index}, parseInt(this.value))"
                               class="form-input w-16 text-center">
                        <button onclick="invoiceManager.updateItemQuantity(${index}, ${item.quantity + 1})" 
                                class="btn btn-sm btn-secondary w-8 h-8 p-0">+</button>
                    </div>
                </td>
                <td>
                    <span class="font-medium">${ZovatuApp.formatCurrency(item.total)}</span>
                </td>
                <td>
                    <button onclick="invoiceManager.removeItemFromInvoice(${index})" 
                            class="btn btn-sm btn-danger" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    calculateTotals() {
        // Calculate subtotal
        this.currentInvoice.subtotal = this.currentInvoice.items.reduce((sum, item) => sum + item.total, 0);

        // Calculate discount
        const discountAmount = parseFloat(document.getElementById('discountAmount').value) || 0;
        const discountType = document.getElementById('discountType').value;
        
        if (discountType === 'percent') {
            this.currentInvoice.discount = (this.currentInvoice.subtotal * discountAmount) / 100;
        } else {
            this.currentInvoice.discount = discountAmount;
        }

        // Calculate tax
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        this.currentInvoice.taxRate = taxRate;
        const taxableAmount = this.currentInvoice.subtotal - this.currentInvoice.discount;
        this.currentInvoice.tax = (taxableAmount * taxRate) / 100;

        // Calculate total
        this.currentInvoice.total = this.currentInvoice.subtotal - this.currentInvoice.discount + this.currentInvoice.tax;

        // Update display
        document.getElementById('subtotalAmount').textContent = ZovatuApp.formatCurrency(this.currentInvoice.subtotal);
        document.getElementById('discountDisplayAmount').textContent = '-' + ZovatuApp.formatCurrency(this.currentInvoice.discount);
        document.getElementById('taxAmount').textContent = ZovatuApp.formatCurrency(this.currentInvoice.tax);
        document.getElementById('totalAmount').textContent = ZovatuApp.formatCurrency(this.currentInvoice.total);

        this.calculateChange();
    }

    calculateChange() {
        const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
        this.currentInvoice.amountReceived = amountReceived;
        this.currentInvoice.change = Math.max(0, amountReceived - this.currentInvoice.total);
        
        document.getElementById('changeAmount').textContent = ZovatuApp.formatCurrency(this.currentInvoice.change);
    }

    saveInvoice() {
        if (this.currentInvoice.items.length === 0) {
            ZovatuApp.showNotification('Cannot save empty invoice', 'warning');
            return;
        }

        // Update invoice data from form
        this.currentInvoice.date = document.getElementById('invoiceDate').value;
        this.currentInvoice.paymentMethod = document.getElementById('paymentMethod').value;
        this.currentInvoice.notes = document.getElementById('invoiceNotes').value;
        
        const customerId = document.getElementById('customerSelect').value;
        this.currentInvoice.customer = customerId ? this.customers.find(c => c.id === customerId) : null;

        // Determine status based on payment
        if (this.currentInvoice.amountReceived >= this.currentInvoice.total) {
            this.currentInvoice.status = 'paid';
        } else if (this.currentInvoice.amountReceived > 0) {
            this.currentInvoice.status = 'partial';
        } else {
            this.currentInvoice.status = 'pending';
        }

        // Update product stock
        this.currentInvoice.items.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        // Save invoice
        if (this.currentInvoice.id) {
            // Update existing invoice
            const index = this.invoices.findIndex(inv => inv.id === this.currentInvoice.id);
            if (index !== -1) {
                this.invoices[index] = { ...this.currentInvoice };
            }
        } else {
            // Create new invoice
            this.currentInvoice.id = ZovatuApp.generateId();
            this.currentInvoice.createdAt = new Date().toISOString();
            this.invoices.push({ ...this.currentInvoice });
        }

        this.currentInvoice.updatedAt = new Date().toISOString();

        // Save data
        this.saveInvoices();
        DataManager.set('products', this.products);
        
        this.renderInvoices();
        ZovatuApp.showNotification('Invoice saved successfully', 'success');
    }

    printInvoice() {
        if (this.currentInvoice.items.length === 0) {
            ZovatuApp.showNotification('Cannot print empty invoice', 'warning');
            return;
        }

        this.openPrintPreviewModal();
    }

    // Calculator Functions
    openCalculatorModal() {
        document.getElementById('calculatorModal').classList.add('show');
        this.resetCalculator();
    }

    closeCalculatorModal() {
        document.getElementById('calculatorModal').classList.remove('show');
    }

    resetCalculator() {
        this.calculator = {
            display: '0',
            previousValue: null,
            operation: null,
            waitingForOperand: false
        };
        document.getElementById('calculatorDisplay').value = '0';
    }

    handleCalculatorInput(button) {
        const { dataset } = button;

        if (dataset.number) {
            this.inputNumber(dataset.number);
        } else if (dataset.action) {
            this.performAction(dataset.action);
        }

        document.getElementById('calculatorDisplay').value = this.calculator.display;
    }

    inputNumber(number) {
        const { display, waitingForOperand } = this.calculator;

        if (waitingForOperand) {
            this.calculator.display = number;
            this.calculator.waitingForOperand = false;
        } else {
            this.calculator.display = display === '0' ? number : display + number;
        }
    }

    performAction(action) {
        const { display, previousValue, operation } = this.calculator;
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            this.calculator.previousValue = inputValue;
        } else if (operation) {
            const currentValue = previousValue || 0;
            const newValue = this.calculate(currentValue, inputValue, operation);

            this.calculator.display = String(newValue);
            this.calculator.previousValue = newValue;
        }

        this.calculator.waitingForOperand = true;

        switch (action) {
            case 'add':
                this.calculator.operation = '+';
                break;
            case 'subtract':
                this.calculator.operation = '-';
                break;
            case 'multiply':
                this.calculator.operation = '*';
                break;
            case 'divide':
                this.calculator.operation = '/';
                break;
            case 'equals':
                this.calculator.operation = null;
                this.calculator.previousValue = null;
                this.calculator.waitingForOperand = true;
                break;
            case 'clear':
                this.resetCalculator();
                break;
            case 'backspace':
                if (this.calculator.display.length > 1) {
                    this.calculator.display = this.calculator.display.slice(0, -1);
                } else {
                    this.calculator.display = '0';
                }
                break;
            case 'decimal':
                if (this.calculator.display.indexOf('.') === -1) {
                    this.calculator.display += '.';
                }
                break;
        }
    }

    calculate(firstValue, secondValue, operation) {
        switch (operation) {
            case '+':
                return firstValue + secondValue;
            case '-':
                return firstValue - secondValue;
            case '*':
                return firstValue * secondValue;
            case '/':
                return firstValue / secondValue;
            default:
                return secondValue;
        }
    }

    useCalculatorResult() {
        const result = parseFloat(this.calculator.display);
        document.getElementById('amountReceived').value = result.toFixed(2);
        this.calculateChange();
        this.closeCalculatorModal();
        ZovatuApp.showNotification('Calculator result applied', 'success');
    }

    // Print Functions
    openPrintPreviewModal() {
        document.getElementById('printPreviewModal').classList.add('show');
        this.generatePrintPreview();
    }

    closePrintPreviewModal() {
        document.getElementById('printPreviewModal').classList.remove('show');
    }

    generatePrintPreview() {
        const printSize = document.getElementById('printSize').value;
        const previewContent = document.getElementById('printPreviewContent');
        
        const businessInfo = ZovatuApp.settings.business || {};
        const invoice = this.currentInvoice;
        
        let template = '';
        
        if (printSize === 'A4') {
            template = this.generateA4Template(businessInfo, invoice);
        } else {
            template = this.generateReceiptTemplate(businessInfo, invoice, printSize);
        }
        
        previewContent.innerHTML = template;
    }

    generateA4Template(business, invoice) {
        return `
            <div class="max-w-4xl mx-auto bg-white">
                <!-- Header -->
                <div class="flex justify-between items-start mb-8">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800">${business.name || 'Your Business Name'}</h1>
                        <p class="text-gray-600">${business.address || 'Business Address'}</p>
                        <p class="text-gray-600">Phone: ${business.phone || 'Phone Number'}</p>
                        <p class="text-gray-600">Email: ${business.email || 'Email Address'}</p>
                    </div>
                    <div class="text-right">
                        <h2 class="text-2xl font-bold text-blue-600">INVOICE</h2>
                        <p class="text-gray-600">Invoice #: ${invoice.number}</p>
                        <p class="text-gray-600">Date: ${ZovatuApp.formatDate(invoice.date, 'MMM DD, YYYY')}</p>
                    </div>
                </div>

                <!-- Customer Info -->
                <div class="mb-8">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
                    <div class="bg-gray-50 p-4 rounded">
                        <p class="font-medium">${invoice.customer ? invoice.customer.name : 'Walk-in Customer'}</p>
                        ${invoice.customer ? `
                            <p class="text-gray-600">${invoice.customer.phone || ''}</p>
                            <p class="text-gray-600">${invoice.customer.email || ''}</p>
                            <p class="text-gray-600">${invoice.customer.address || ''}</p>
                        ` : ''}
                    </div>
                </div>

                <!-- Items Table -->
                <div class="mb-8">
                    <table class="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border border-gray-300 p-3 text-left">Item</th>
                                <th class="border border-gray-300 p-3 text-right">Price</th>
                                <th class="border border-gray-300 p-3 text-right">Qty</th>
                                <th class="border border-gray-300 p-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td class="border border-gray-300 p-3">
                                        <div>
                                            <p class="font-medium">${item.name}</p>
                                            <p class="text-sm text-gray-500">Code: ${item.code}</p>
                                        </div>
                                    </td>
                                    <td class="border border-gray-300 p-3 text-right">${ZovatuApp.formatCurrency(item.price)}</td>
                                    <td class="border border-gray-300 p-3 text-right">${item.quantity} ${item.unit}</td>
                                    <td class="border border-gray-300 p-3 text-right">${ZovatuApp.formatCurrency(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Totals -->
                <div class="flex justify-end mb-8">
                    <div class="w-64">
                        <div class="flex justify-between py-2">
                            <span>Subtotal:</span>
                            <span>${ZovatuApp.formatCurrency(invoice.subtotal)}</span>
                        </div>
                        ${invoice.discount > 0 ? `
                            <div class="flex justify-between py-2 text-green-600">
                                <span>Discount:</span>
                                <span>-${ZovatuApp.formatCurrency(invoice.discount)}</span>
                            </div>
                        ` : ''}
                        ${invoice.tax > 0 ? `
                            <div class="flex justify-between py-2">
                                <span>Tax (${invoice.taxRate}%):</span>
                                <span>${ZovatuApp.formatCurrency(invoice.tax)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between py-2 text-lg font-bold border-t border-gray-300">
                            <span>Total:</span>
                            <span>${ZovatuApp.formatCurrency(invoice.total)}</span>
                        </div>
                        ${invoice.amountReceived > 0 ? `
                            <div class="flex justify-between py-2">
                                <span>Amount Received:</span>
                                <span>${ZovatuApp.formatCurrency(invoice.amountReceived)}</span>
                            </div>
                            <div class="flex justify-between py-2">
                                <span>Change:</span>
                                <span>${ZovatuApp.formatCurrency(invoice.change)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Notes -->
                ${invoice.notes ? `
                    <div class="mb-8">
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">Notes:</h3>
                        <p class="text-gray-600">${invoice.notes}</p>
                    </div>
                ` : ''}

                <!-- Footer -->
                <div class="text-center text-gray-500 text-sm">
                    <p>Thank you for your business!</p>
                    <p>Generated by Zovatu Billing Tool</p>
                </div>
            </div>
        `;
    }

    generateReceiptTemplate(business, invoice, size) {
        const width = size === '58mm' ? 'max-w-xs' : 'max-w-sm';
        
        return `
            <div class="${width} mx-auto bg-white font-mono text-sm">
                <!-- Header -->
                <div class="text-center mb-4">
                    <h1 class="text-lg font-bold">${business.name || 'Your Business'}</h1>
                    <p class="text-xs">${business.address || 'Business Address'}</p>
                    <p class="text-xs">Tel: ${business.phone || 'Phone'}</p>
                    <div class="border-t border-dashed border-gray-400 my-2"></div>
                </div>

                <!-- Invoice Info -->
                <div class="mb-4">
                    <div class="flex justify-between">
                        <span>Invoice:</span>
                        <span>${invoice.number}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Date:</span>
                        <span>${ZovatuApp.formatDate(invoice.date, 'DD/MM/YYYY')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Customer:</span>
                        <span>${invoice.customer ? invoice.customer.name : 'Walk-in'}</span>
                    </div>
                    <div class="border-t border-dashed border-gray-400 my-2"></div>
                </div>

                <!-- Items -->
                <div class="mb-4">
                    ${invoice.items.map(item => `
                        <div class="mb-2">
                            <div class="flex justify-between">
                                <span class="truncate">${item.name}</span>
                            </div>
                            <div class="flex justify-between text-xs">
                                <span>${item.quantity} x ${ZovatuApp.formatCurrency(item.price)}</span>
                                <span>${ZovatuApp.formatCurrency(item.total)}</span>
                            </div>
                        </div>
                    `).join('')}
                    <div class="border-t border-dashed border-gray-400 my-2"></div>
                </div>

                <!-- Totals -->
                <div class="mb-4">
                    <div class="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${ZovatuApp.formatCurrency(invoice.subtotal)}</span>
                    </div>
                    ${invoice.discount > 0 ? `
                        <div class="flex justify-between">
                            <span>Discount:</span>
                            <span>-${ZovatuApp.formatCurrency(invoice.discount)}</span>
                        </div>
                    ` : ''}
                    ${invoice.tax > 0 ? `
                        <div class="flex justify-between">
                            <span>Tax:</span>
                            <span>${ZovatuApp.formatCurrency(invoice.tax)}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-between font-bold text-lg">
                        <span>TOTAL:</span>
                        <span>${ZovatuApp.formatCurrency(invoice.total)}</span>
                    </div>
                    ${invoice.amountReceived > 0 ? `
                        <div class="flex justify-between">
                            <span>Received:</span>
                            <span>${ZovatuApp.formatCurrency(invoice.amountReceived)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Change:</span>
                            <span>${ZovatuApp.formatCurrency(invoice.change)}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="text-center text-xs">
                    <div class="border-t border-dashed border-gray-400 my-2"></div>
                    <p>Thank you for your business!</p>
                    <p>Powered by Zovatu</p>
                </div>
            </div>
        `;
    }

    printNow() {
        const printContent = document.getElementById('printPreviewContent').innerHTML;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${this.currentInvoice.number}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .no-print { display: none; }
                    }
                    .max-w-4xl { max-width: 56rem; }
                    .max-w-sm { max-width: 24rem; }
                    .max-w-xs { max-width: 20rem; }
                    .mx-auto { margin-left: auto; margin-right: auto; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-left { text-align: left; }
                    .font-bold { font-weight: bold; }
                    .font-medium { font-weight: 500; }
                    .font-mono { font-family: monospace; }
                    .text-xs { font-size: 0.75rem; }
                    .text-sm { font-size: 0.875rem; }
                    .text-lg { font-size: 1.125rem; }
                    .text-xl { font-size: 1.25rem; }
                    .text-2xl { font-size: 1.5rem; }
                    .text-3xl { font-size: 1.875rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .mb-4 { margin-bottom: 1rem; }
                    .mb-8 { margin-bottom: 2rem; }
                    .p-3 { padding: 0.75rem; }
                    .p-4 { padding: 1rem; }
                    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                    .border { border: 1px solid #d1d5db; }
                    .border-t { border-top: 1px solid #d1d5db; }
                    .border-dashed { border-style: dashed; }
                    .border-gray-300 { border-color: #d1d5db; }
                    .border-gray-400 { border-color: #9ca3af; }
                    .bg-gray-50 { background-color: #f9fafb; }
                    .bg-gray-100 { background-color: #f3f4f6; }
                    .text-gray-500 { color: #6b7280; }
                    .text-gray-600 { color: #4b5563; }
                    .text-gray-800 { color: #1f2937; }
                    .text-blue-600 { color: #2563eb; }
                    .text-green-600 { color: #16a34a; }
                    .w-full { width: 100%; }
                    .w-64 { width: 16rem; }
                    .flex { display: flex; }
                    .justify-between { justify-content: space-between; }
                    .justify-end { justify-content: flex-end; }
                    .items-start { align-items: flex-start; }
                    .border-collapse { border-collapse: collapse; }
                    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
                    .rounded { border-radius: 0.25rem; }
                </style>
            </head>
            <body>
                ${printContent}
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
    }

    // Scanner Functions
    openProductScannerModal() {
        document.getElementById('productScannerModal').classList.add('show');
        this.startProductScanner();
    }

    closeProductScannerModal() {
        document.getElementById('productScannerModal').classList.remove('show');
        this.stopProductScanner();
        document.getElementById('productScanResult').classList.add('hidden');
        document.getElementById('addScannedProductBtn').classList.add('hidden');
    }

    startProductScanner() {
        if (typeof Quagga === 'undefined') {
            ZovatuApp.showNotification('Barcode scanner library not loaded', 'danger');
            return;
        }

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#productScanner'),
                constraints: {
                    width: 480,
                    height: 320,
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"]
            }
        }, (err) => {
            if (err) {
                console.error('Scanner initialization failed:', err);
                ZovatuApp.showNotification('Failed to start camera. Please check permissions.', 'danger');
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((data) => {
            const code = data.codeResult.code;
            const product = this.products.find(p => p.barcode === code || p.code === code);
            
            if (product) {
                document.getElementById('scannedProductName').textContent = product.name;
                document.getElementById('productScanResult').classList.remove('hidden');
                document.getElementById('addScannedProductBtn').classList.remove('hidden');
                this.scannedProduct = product;
            } else {
                ZovatuApp.showNotification('Product not found for barcode: ' + code, 'warning');
            }
        });
    }

    stopProductScanner() {
        if (typeof Quagga !== 'undefined') {
            Quagga.stop();
        }
    }

    addScannedProduct() {
        if (this.scannedProduct) {
            this.addProductToInvoice(this.scannedProduct.id);
            this.closeProductScannerModal();
        }
    }

    // Invoice Management Functions
    renderInvoices() {
        const tbody = document.getElementById('invoicesTableBody');
        const searchTerm = document.getElementById('invoiceSearchInput').value.toLowerCase();
        const statusFilter = document.getElementById('invoiceStatusFilter').value;

        let filteredInvoices = this.invoices;

        // Apply filters
        if (searchTerm) {
            filteredInvoices = filteredInvoices.filter(invoice =>
                invoice.number.toLowerCase().includes(searchTerm) ||
                (invoice.customer && invoice.customer.name.toLowerCase().includes(searchTerm))
            );
        }

        if (statusFilter) {
            filteredInvoices = filteredInvoices.filter(invoice => invoice.status === statusFilter);
        }

        // Sort by date (newest first)
        filteredInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredInvoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-gray-500">
                        <i class="fas fa-file-invoice text-4xl mb-2"></i>
                        <p>No invoices found.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredInvoices.map(invoice => `
            <tr>
                <td>
                    <span class="font-mono font-medium">${invoice.number}</span>
                </td>
                <td>
                    ${ZovatuApp.formatDate(invoice.date, 'MMM DD, YYYY')}
                </td>
                <td>
                    ${invoice.customer ? invoice.customer.name : 'Walk-in Customer'}
                </td>
                <td>
                    ${invoice.items.length} item(s)
                </td>
                <td>
                    <span class="font-medium">${ZovatuApp.formatCurrency(invoice.total)}</span>
                </td>
                <td>
                    ${this.getStatusBadge(invoice.status)}
                </td>
                <td>
                    <div class="flex space-x-1">
                        <button onclick="invoiceManager.viewInvoice('${invoice.id}')" class="btn btn-sm btn-secondary" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="invoiceManager.editInvoice('${invoice.id}')" class="btn btn-sm btn-primary" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="invoiceManager.duplicateInvoice('${invoice.id}')" class="btn btn-sm btn-success" title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="invoiceManager.deleteInvoice('${invoice.id}')" class="btn btn-sm btn-danger" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getStatusBadge(status) {
        const badges = {
            'paid': '<span class="badge badge-success">Paid</span>',
            'pending': '<span class="badge badge-warning">Pending</span>',
            'partial': '<span class="badge badge-info">Partial</span>',
            'cancelled': '<span class="badge badge-danger">Cancelled</span>'
        };
        return badges[status] || '<span class="badge badge-secondary">Unknown</span>';
    }

    filterInvoices() {
        this.renderInvoices();
    }

    viewInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            this.currentInvoice = { ...invoice };
            this.populateInvoiceForm();
            ZovatuApp.showNotification('Invoice loaded for viewing', 'info');
        }
    }

    editInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            this.currentInvoice = { ...invoice };
            this.populateInvoiceForm();
            ZovatuApp.showNotification('Invoice loaded for editing', 'info');
        }
    }

    duplicateInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            this.currentInvoice = { 
                ...invoice, 
                id: null,
                status: 'pending',
                amountReceived: 0,
                change: 0
            };
            this.generateInvoiceNumber();
            this.setCurrentDate();
            this.populateInvoiceForm();
            ZovatuApp.showNotification('Invoice duplicated', 'success');
        }
    }

    deleteInvoice(invoiceId) {
        if (confirm('Are you sure you want to delete this invoice?')) {
            this.invoices = this.invoices.filter(inv => inv.id !== invoiceId);
            this.saveInvoices();
            this.renderInvoices();
            ZovatuApp.showNotification('Invoice deleted successfully', 'success');
        }
    }

    populateInvoiceForm() {
        document.getElementById('invoiceNumber').value = this.currentInvoice.number;
        document.getElementById('invoiceDate').value = this.currentInvoice.date;
        document.getElementById('customerSelect').value = this.currentInvoice.customer ? this.currentInvoice.customer.id : '';
        document.getElementById('paymentMethod').value = this.currentInvoice.paymentMethod;
        document.getElementById('discountAmount').value = this.currentInvoice.discount || '';
        document.getElementById('discountType').value = this.currentInvoice.discountType;
        document.getElementById('taxRate').value = this.currentInvoice.taxRate || 0;
        document.getElementById('amountReceived').value = this.currentInvoice.amountReceived || '';
        document.getElementById('invoiceNotes').value = this.currentInvoice.notes || '';

        this.renderInvoiceItems();
        this.calculateTotals();
    }
}

// Global functions for modal controls
function closeProductScannerModal() {
    if (window.invoiceManager) {
        window.invoiceManager.closeProductScannerModal();
    }
}

function closeCalculatorModal() {
    if (window.invoiceManager) {
        window.invoiceManager.closeCalculatorModal();
    }
}

function closePrintPreviewModal() {
    if (window.invoiceManager) {
        window.invoiceManager.closePrintPreviewModal();
    }
}

// Global print function for F1 shortcut
function printInvoice() {
    if (window.invoiceManager) {
        window.invoiceManager.printInvoice();
    }
}

// Initialize invoice manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('invoices.html')) {
        window.invoiceManager = new InvoiceManager();
        
        // Setup print preview modal buttons
        document.getElementById('printNowBtn').addEventListener('click', () => {
            window.invoiceManager.printNow();
        });

        document.getElementById('addScannedProductBtn').addEventListener('click', () => {
            window.invoiceManager.addScannedProduct();
        });
    }
});

// Export for use in other modules
window.InvoiceManager = InvoiceManager;

