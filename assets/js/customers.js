// Zovatu Billing Tool - Customers JavaScript
// Handles customer management, due tracking, and payment history

class CustomerManager {
    constructor() {
        this.customers = [];
        this.invoices = [];
        this.payments = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredCustomers = [];
        this.editingCustomer = null;
        this.selectedCustomer = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateStatistics();
        this.renderCustomers();
    }

    loadData() {
        this.customers = DataManager.get('customers') || [];
        this.invoices = DataManager.get('invoices') || [];
        this.payments = DataManager.get('payments') || [];
        this.filteredCustomers = [...this.customers];
    }

    saveCustomers() {
        DataManager.set('customers', this.customers);
        this.updateStatistics();
    }

    savePayments() {
        DataManager.set('payments', this.payments);
        this.updateStatistics();
    }

    setupEventListeners() {
        // Add Customer Button
        document.getElementById('addCustomerBtn').addEventListener('click', () => {
            this.openCustomerModal();
        });

        // Import/Export Buttons
        document.getElementById('importCustomersBtn').addEventListener('click', () => {
            this.openImportModal();
        });

        document.getElementById('exportCustomersBtn').addEventListener('click', () => {
            this.exportCustomers();
        });

        document.getElementById('sendReminderBtn').addEventListener('click', () => {
            this.sendDueReminders();
        });

        // Customer Form
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        // Payment Form
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPayment();
        });

        // Search and Filter
        document.getElementById('searchInput').addEventListener('input', 
            ZovatuApp.debounce(() => this.filterCustomers(), 300)
        );

        document.getElementById('dueStatusFilter').addEventListener('change', () => {
            this.filterCustomers();
        });

        document.getElementById('customerTypeFilter').addEventListener('change', () => {
            this.filterCustomers();
        });

        document.getElementById('sortBy').addEventListener('change', () => {
            this.sortCustomers();
        });

        // Import functionality
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importCustomers();
        });

        // Customer details modal
        document.getElementById('addPaymentBtn').addEventListener('click', () => {
            this.openPaymentModal();
        });

        document.getElementById('editCustomerBtn').addEventListener('click', () => {
            if (this.selectedCustomer) {
                this.closeCustomerDetailsModal();
                this.openCustomerModal(this.selectedCustomer);
            }
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Statement generation
        document.getElementById('generateStatementBtn').addEventListener('click', () => {
            this.generateStatement();
        });

        // Set default payment date to today
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    }

    openCustomerModal(customer = null) {
        this.editingCustomer = customer;
        const modal = document.getElementById('customerModal');
        const title = document.querySelector('#customerModal .modal-title');
        
        if (customer) {
            title.textContent = 'Edit Customer';
            this.populateCustomerForm(customer);
        } else {
            title.textContent = 'Add Customer';
            this.clearCustomerForm();
        }
        
        modal.classList.add('show');
    }

    closeCustomerModal() {
        document.getElementById('customerModal').classList.remove('show');
        this.editingCustomer = null;
        this.clearCustomerForm();
    }

    populateCustomerForm(customer) {
        document.getElementById('customerName').value = customer.name || '';
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerType').value = customer.type || 'regular';
        document.getElementById('customerCreditLimit').value = customer.creditLimit || '';
        document.getElementById('customerPaymentTerms').value = customer.paymentTerms || 30;
        document.getElementById('customerAddress').value = customer.address || '';
        document.getElementById('customerNotes').value = customer.notes || '';
    }

    clearCustomerForm() {
        document.getElementById('customerForm').reset();
        document.getElementById('customerPaymentTerms').value = 30;
    }

    saveCustomer() {
        const formData = this.getCustomerFormData();
        
        if (!this.validateCustomerData(formData)) {
            return;
        }

        if (this.editingCustomer) {
            // Update existing customer
            const index = this.customers.findIndex(c => c.id === this.editingCustomer.id);
            if (index !== -1) {
                this.customers[index] = { ...this.editingCustomer, ...formData, updatedAt: new Date().toISOString() };
            }
            ZovatuApp.showNotification('Customer updated successfully', 'success');
        } else {
            // Add new customer
            const newCustomer = {
                id: ZovatuApp.generateId(),
                ...formData,
                totalPurchases: 0,
                dueAmount: 0,
                lastPurchaseDate: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.customers.push(newCustomer);
            ZovatuApp.showNotification('Customer added successfully', 'success');
        }

        this.saveCustomers();
        this.renderCustomers();
        this.closeCustomerModal();
    }

    getCustomerFormData() {
        return {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            email: document.getElementById('customerEmail').value.trim(),
            type: document.getElementById('customerType').value,
            creditLimit: parseFloat(document.getElementById('customerCreditLimit').value) || 0,
            paymentTerms: parseInt(document.getElementById('customerPaymentTerms').value) || 30,
            address: document.getElementById('customerAddress').value.trim(),
            notes: document.getElementById('customerNotes').value.trim()
        };
    }

    validateCustomerData(data) {
        if (!data.name) {
            ZovatuApp.showNotification('Customer name is required', 'danger');
            return false;
        }

        if (!data.phone) {
            ZovatuApp.showNotification('Phone number is required', 'danger');
            return false;
        }

        // Check for duplicate phone number
        const existingCustomer = this.customers.find(c => 
            c.phone === data.phone && (!this.editingCustomer || c.id !== this.editingCustomer.id)
        );
        
        if (existingCustomer) {
            ZovatuApp.showNotification('Phone number already exists', 'danger');
            return false;
        }

        return true;
    }

    deleteCustomer(customerId) {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            this.customers = this.customers.filter(c => c.id !== customerId);
            this.saveCustomers();
            this.renderCustomers();
            ZovatuApp.showNotification('Customer deleted successfully', 'success');
        }
    }

    updateStatistics() {
        const totalCustomers = this.customers.length;
        
        // Calculate customer statistics from invoices and payments
        this.customers.forEach(customer => {
            const customerInvoices = this.invoices.filter(inv => 
                inv.customer && inv.customer.id === customer.id
            );
            
            const customerPayments = this.payments.filter(payment => 
                payment.customerId === customer.id
            );

            // Calculate total purchases
            customer.totalPurchases = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
            
            // Calculate due amount
            const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
            customer.dueAmount = Math.max(0, customer.totalPurchases - totalPaid);
            
            // Update last purchase date
            if (customerInvoices.length > 0) {
                const lastInvoice = customerInvoices.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                customer.lastPurchaseDate = lastInvoice.date;
            }
        });

        const totalReceivables = this.customers.reduce((sum, c) => sum + c.dueAmount, 0);
        
        // Count overdue customers (due amount > 0 and last purchase > payment terms)
        const overdueCustomers = this.customers.filter(customer => {
            if (customer.dueAmount <= 0 || !customer.lastPurchaseDate) return false;
            
            const lastPurchase = new Date(customer.lastPurchaseDate);
            const dueDate = new Date(lastPurchase.getTime() + (customer.paymentTerms * 24 * 60 * 60 * 1000));
            return new Date() > dueDate;
        }).length;

        // Count active customers (purchased in last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const activeCustomers = this.customers.filter(customer => 
            customer.lastPurchaseDate && new Date(customer.lastPurchaseDate) > thirtyDaysAgo
        ).length;

        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('totalReceivables').textContent = ZovatuApp.formatCurrency(totalReceivables);
        document.getElementById('overdueCustomers').textContent = overdueCustomers;
        document.getElementById('activeCustomers').textContent = activeCustomers;
    }

    filterCustomers() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const dueStatusFilter = document.getElementById('dueStatusFilter').value;
        const customerTypeFilter = document.getElementById('customerTypeFilter').value;

        this.filteredCustomers = this.customers.filter(customer => {
            const matchesSearch = !searchTerm || 
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.phone.toLowerCase().includes(searchTerm) ||
                (customer.email && customer.email.toLowerCase().includes(searchTerm));

            const matchesType = !customerTypeFilter || customer.type === customerTypeFilter;

            let matchesDueStatus = true;
            if (dueStatusFilter === 'no-due') {
                matchesDueStatus = customer.dueAmount === 0;
            } else if (dueStatusFilter === 'has-due') {
                matchesDueStatus = customer.dueAmount > 0;
            } else if (dueStatusFilter === 'overdue') {
                if (customer.dueAmount <= 0 || !customer.lastPurchaseDate) {
                    matchesDueStatus = false;
                } else {
                    const lastPurchase = new Date(customer.lastPurchaseDate);
                    const dueDate = new Date(lastPurchase.getTime() + (customer.paymentTerms * 24 * 60 * 60 * 1000));
                    matchesDueStatus = new Date() > dueDate;
                }
            }

            return matchesSearch && matchesType && matchesDueStatus;
        });

        this.currentPage = 1;
        this.renderCustomers();
    }

    sortCustomers() {
        const sortBy = document.getElementById('sortBy').value;
        
        this.filteredCustomers.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'due':
                    return b.dueAmount - a.dueAmount;
                case 'lastPurchase':
                    if (!a.lastPurchaseDate && !b.lastPurchaseDate) return 0;
                    if (!a.lastPurchaseDate) return 1;
                    if (!b.lastPurchaseDate) return -1;
                    return new Date(b.lastPurchaseDate) - new Date(a.lastPurchaseDate);
                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return 0;
            }
        });

        this.renderCustomers();
    }

    renderCustomers() {
        const tbody = document.getElementById('customersTableBody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageCustomers = this.filteredCustomers.slice(startIndex, endIndex);

        if (pageCustomers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500">
                        <i class="fas fa-users text-4xl mb-2"></i>
                        <p>No customers found.</p>
                    </td>
                </tr>
            `;
            this.renderPagination();
            return;
        }

        tbody.innerHTML = pageCustomers.map(customer => `
            <tr>
                <td>
                    <div>
                        <p class="font-medium text-gray-900">${customer.name}</p>
                        <p class="text-sm text-gray-500">ID: ${customer.id.substring(0, 8)}</p>
                    </div>
                </td>
                <td>
                    <div>
                        <p class="text-sm">${customer.phone}</p>
                        ${customer.email ? `<p class="text-sm text-gray-500">${customer.email}</p>` : ''}
                    </div>
                </td>
                <td>
                    <span class="badge badge-primary">${customer.type}</span>
                </td>
                <td>
                    <span class="font-medium">${ZovatuApp.formatCurrency(customer.totalPurchases)}</span>
                </td>
                <td>
                    <span class="font-medium ${customer.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}">
                        ${ZovatuApp.formatCurrency(customer.dueAmount)}
                    </span>
                </td>
                <td>
                    ${customer.lastPurchaseDate ? 
                        ZovatuApp.formatDate(customer.lastPurchaseDate, 'MMM DD, YYYY') : 
                        '<span class="text-gray-400">Never</span>'
                    }
                </td>
                <td>
                    ${this.getCustomerStatusBadge(customer)}
                </td>
                <td>
                    <div class="flex space-x-1">
                        <button onclick="customerManager.viewCustomer('${customer.id}')" class="btn btn-sm btn-secondary" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="customerManager.editCustomer('${customer.id}')" class="btn btn-sm btn-primary" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="customerManager.createInvoiceForCustomer('${customer.id}')" class="btn btn-sm btn-success" title="Create Invoice">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button onclick="customerManager.deleteCustomer('${customer.id}')" class="btn btn-sm btn-danger" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    getCustomerStatusBadge(customer) {
        if (customer.dueAmount === 0) {
            return '<span class="badge badge-success">Good</span>';
        } else if (customer.lastPurchaseDate) {
            const lastPurchase = new Date(customer.lastPurchaseDate);
            const dueDate = new Date(lastPurchase.getTime() + (customer.paymentTerms * 24 * 60 * 60 * 1000));
            
            if (new Date() > dueDate) {
                return '<span class="badge badge-danger">Overdue</span>';
            } else {
                return '<span class="badge badge-warning">Due</span>';
            }
        } else {
            return '<span class="badge badge-secondary">New</span>';
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="flex space-x-1">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="customerManager.goToPage(${this.currentPage - 1})" class="btn btn-sm btn-secondary">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="btn btn-sm btn-primary">${i}</button>`;
            } else {
                paginationHTML += `<button onclick="customerManager.goToPage(${i})" class="btn btn-sm btn-secondary">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button onclick="customerManager.goToPage(${this.currentPage + 1})" class="btn btn-sm btn-secondary">Next</button>`;
        }
        
        paginationHTML += '</div>';
        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderCustomers();
    }

    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.openCustomerModal(customer);
        }
    }

    viewCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.selectedCustomer = customer;
            this.openCustomerDetailsModal(customer);
        }
    }

    createInvoiceForCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            // Store customer ID in session storage and redirect to invoices page
            sessionStorage.setItem('selectedCustomerId', customerId);
            window.location.href = 'invoices.html';
        }
    }

    // Customer Details Modal Functions
    openCustomerDetailsModal(customer) {
        const modal = document.getElementById('customerDetailsModal');
        
        // Populate customer info
        this.populateCustomerInfo(customer);
        
        // Load purchase history
        this.loadPurchaseHistory(customer.id);
        
        // Load payment history
        this.loadPaymentHistory(customer.id);
        
        // Switch to purchases tab by default
        this.switchTab('purchases');
        
        modal.classList.add('show');
    }

    closeCustomerDetailsModal() {
        document.getElementById('customerDetailsModal').classList.remove('show');
        this.selectedCustomer = null;
    }

    populateCustomerInfo(customer) {
        const customerInfo = document.getElementById('customerInfo');
        customerInfo.innerHTML = `
            <div class="space-y-2">
                <div>
                    <p class="text-sm text-gray-500">Name</p>
                    <p class="font-medium">${customer.name}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Phone</p>
                    <p class="font-medium">${customer.phone}</p>
                </div>
                ${customer.email ? `
                    <div>
                        <p class="text-sm text-gray-500">Email</p>
                        <p class="font-medium">${customer.email}</p>
                    </div>
                ` : ''}
                <div>
                    <p class="text-sm text-gray-500">Type</p>
                    <p class="font-medium capitalize">${customer.type}</p>
                </div>
                ${customer.address ? `
                    <div>
                        <p class="text-sm text-gray-500">Address</p>
                        <p class="font-medium">${customer.address}</p>
                    </div>
                ` : ''}
                <div>
                    <p class="text-sm text-gray-500">Payment Terms</p>
                    <p class="font-medium">${customer.paymentTerms} days</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Member Since</p>
                    <p class="font-medium">${ZovatuApp.formatDate(customer.createdAt, 'MMM DD, YYYY')}</p>
                </div>
            </div>
        `;

        // Update due management section
        document.getElementById('currentDue').textContent = ZovatuApp.formatCurrency(customer.dueAmount);
        document.getElementById('creditLimit').textContent = ZovatuApp.formatCurrency(customer.creditLimit);
        document.getElementById('availableCredit').textContent = ZovatuApp.formatCurrency(customer.creditLimit - customer.dueAmount);
    }

    switchTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    loadPurchaseHistory(customerId) {
        const customerInvoices = this.invoices.filter(inv => 
            inv.customer && inv.customer.id === customerId
        ).sort((a, b) => new Date(b.date) - new Date(a.date));

        const tbody = document.getElementById('purchaseHistoryBody');
        
        if (customerInvoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-gray-500">
                        No purchase history found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = customerInvoices.map(invoice => `
            <tr>
                <td class="font-mono">${invoice.number}</td>
                <td>${ZovatuApp.formatDate(invoice.date, 'MMM DD, YYYY')}</td>
                <td class="font-medium">${ZovatuApp.formatCurrency(invoice.total)}</td>
                <td>
                    <span class="badge badge-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'info'}">
                        ${invoice.status}
                    </span>
                </td>
                <td>
                    <button onclick="customerManager.viewInvoice('${invoice.id}')" class="btn btn-sm btn-secondary" title="View Invoice">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    loadPaymentHistory(customerId) {
        const customerPayments = this.payments.filter(payment => 
            payment.customerId === customerId
        ).sort((a, b) => new Date(b.date) - new Date(a.date));

        const tbody = document.getElementById('paymentHistoryBody');
        
        if (customerPayments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-gray-500">
                        No payment history found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = customerPayments.map(payment => `
            <tr>
                <td>${ZovatuApp.formatDate(payment.date, 'MMM DD, YYYY')}</td>
                <td class="font-medium">${ZovatuApp.formatCurrency(payment.amount)}</td>
                <td class="capitalize">${payment.method}</td>
                <td>${payment.reference || '-'}</td>
                <td>
                    <button onclick="customerManager.deletePayment('${payment.id}')" class="btn btn-sm btn-danger" title="Delete Payment">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Payment Management Functions
    openPaymentModal() {
        if (!this.selectedCustomer) {
            ZovatuApp.showNotification('No customer selected', 'warning');
            return;
        }

        document.getElementById('paymentModal').classList.add('show');
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    }

    closePaymentModal() {
        document.getElementById('paymentModal').classList.remove('show');
        document.getElementById('paymentForm').reset();
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    }

    addPayment() {
        if (!this.selectedCustomer) {
            ZovatuApp.showNotification('No customer selected', 'warning');
            return;
        }

        const paymentData = {
            id: ZovatuApp.generateId(),
            customerId: this.selectedCustomer.id,
            date: document.getElementById('paymentDate').value,
            amount: parseFloat(document.getElementById('paymentAmount').value),
            method: document.getElementById('paymentMethodSelect').value,
            reference: document.getElementById('paymentReference').value.trim(),
            notes: document.getElementById('paymentNotes').value.trim(),
            createdAt: new Date().toISOString()
        };

        if (!paymentData.amount || paymentData.amount <= 0) {
            ZovatuApp.showNotification('Please enter a valid payment amount', 'danger');
            return;
        }

        if (paymentData.amount > this.selectedCustomer.dueAmount) {
            if (!confirm('Payment amount is greater than due amount. Continue?')) {
                return;
            }
        }

        this.payments.push(paymentData);
        this.savePayments();
        
        // Update customer due amount
        this.updateStatistics();
        
        // Refresh customer details
        this.selectedCustomer = this.customers.find(c => c.id === this.selectedCustomer.id);
        this.populateCustomerInfo(this.selectedCustomer);
        this.loadPaymentHistory(this.selectedCustomer.id);
        
        this.closePaymentModal();
        ZovatuApp.showNotification('Payment added successfully', 'success');
    }

    deletePayment(paymentId) {
        if (confirm('Are you sure you want to delete this payment?')) {
            this.payments = this.payments.filter(p => p.id !== paymentId);
            this.savePayments();
            
            // Update statistics and refresh display
            this.updateStatistics();
            if (this.selectedCustomer) {
                this.selectedCustomer = this.customers.find(c => c.id === this.selectedCustomer.id);
                this.populateCustomerInfo(this.selectedCustomer);
                this.loadPaymentHistory(this.selectedCustomer.id);
            }
            
            ZovatuApp.showNotification('Payment deleted successfully', 'success');
        }
    }

    // Statement Generation
    generateStatement() {
        if (!this.selectedCustomer) {
            ZovatuApp.showNotification('No customer selected', 'warning');
            return;
        }

        const fromDate = document.getElementById('statementFromDate').value;
        const toDate = document.getElementById('statementToDate').value;

        if (!fromDate || !toDate) {
            ZovatuApp.showNotification('Please select date range', 'warning');
            return;
        }

        const customerInvoices = this.invoices.filter(inv => 
            inv.customer && inv.customer.id === this.selectedCustomer.id &&
            inv.date >= fromDate && inv.date <= toDate
        ).sort((a, b) => new Date(a.date) - new Date(b.date));

        const customerPayments = this.payments.filter(payment => 
            payment.customerId === this.selectedCustomer.id &&
            payment.date >= fromDate && payment.date <= toDate
        ).sort((a, b) => new Date(a.date) - new Date(b.date));

        this.renderStatement(customerInvoices, customerPayments, fromDate, toDate);
    }

    renderStatement(invoices, payments, fromDate, toDate) {
        const statementContent = document.getElementById('statementContent');
        
        // Calculate opening balance (invoices before fromDate minus payments before fromDate)
        const openingInvoices = this.invoices.filter(inv => 
            inv.customer && inv.customer.id === this.selectedCustomer.id && inv.date < fromDate
        );
        const openingPayments = this.payments.filter(payment => 
            payment.customerId === this.selectedCustomer.id && payment.date < fromDate
        );
        
        const openingBalance = openingInvoices.reduce((sum, inv) => sum + inv.total, 0) - 
                              openingPayments.reduce((sum, payment) => sum + payment.amount, 0);

        // Combine and sort transactions
        const transactions = [
            ...invoices.map(inv => ({
                date: inv.date,
                type: 'invoice',
                description: `Invoice ${inv.number}`,
                debit: inv.total,
                credit: 0,
                data: inv
            })),
            ...payments.map(payment => ({
                date: payment.date,
                type: 'payment',
                description: `Payment - ${payment.method}`,
                debit: 0,
                credit: payment.amount,
                data: payment
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        let runningBalance = openingBalance;

        statementContent.innerHTML = `
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-center mb-6">
                    <h3 class="text-xl font-bold">Account Statement</h3>
                    <p class="text-gray-600">${this.selectedCustomer.name}</p>
                    <p class="text-sm text-gray-500">Period: ${ZovatuApp.formatDate(fromDate, 'MMM DD, YYYY')} to ${ZovatuApp.formatDate(toDate, 'MMM DD, YYYY')}</p>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border border-gray-300 p-2 text-left">Date</th>
                                <th class="border border-gray-300 p-2 text-left">Description</th>
                                <th class="border border-gray-300 p-2 text-right">Debit</th>
                                <th class="border border-gray-300 p-2 text-right">Credit</th>
                                <th class="border border-gray-300 p-2 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="border border-gray-300 p-2">${ZovatuApp.formatDate(fromDate, 'MMM DD, YYYY')}</td>
                                <td class="border border-gray-300 p-2 font-medium">Opening Balance</td>
                                <td class="border border-gray-300 p-2 text-right">-</td>
                                <td class="border border-gray-300 p-2 text-right">-</td>
                                <td class="border border-gray-300 p-2 text-right font-medium">${ZovatuApp.formatCurrency(openingBalance)}</td>
                            </tr>
                            ${transactions.map(transaction => {
                                runningBalance += transaction.debit - transaction.credit;
                                return `
                                    <tr>
                                        <td class="border border-gray-300 p-2">${ZovatuApp.formatDate(transaction.date, 'MMM DD, YYYY')}</td>
                                        <td class="border border-gray-300 p-2">${transaction.description}</td>
                                        <td class="border border-gray-300 p-2 text-right">${transaction.debit > 0 ? ZovatuApp.formatCurrency(transaction.debit) : '-'}</td>
                                        <td class="border border-gray-300 p-2 text-right">${transaction.credit > 0 ? ZovatuApp.formatCurrency(transaction.credit) : '-'}</td>
                                        <td class="border border-gray-300 p-2 text-right">${ZovatuApp.formatCurrency(runningBalance)}</td>
                                    </tr>
                                `;
                            }).join('')}
                            <tr class="bg-gray-100 font-bold">
                                <td class="border border-gray-300 p-2" colspan="4">Closing Balance</td>
                                <td class="border border-gray-300 p-2 text-right">${ZovatuApp.formatCurrency(runningBalance)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-6 text-center">
                    <button onclick="customerManager.printStatement()" class="btn btn-primary mr-2">
                        <i class="fas fa-print mr-1"></i> Print Statement
                    </button>
                    <button onclick="customerManager.downloadStatement()" class="btn btn-secondary">
                        <i class="fas fa-download mr-1"></i> Download PDF
                    </button>
                </div>
            </div>
        `;
    }

    printStatement() {
        const statementContent = document.getElementById('statementContent').innerHTML;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Account Statement - ${this.selectedCustomer.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${statementContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    downloadStatement() {
        // This would require a PDF library in a real implementation
        ZovatuApp.showNotification('PDF download feature coming soon', 'info');
    }

    // Import/Export Functions
    openImportModal() {
        document.getElementById('importModal').classList.add('show');
    }

    closeImportModal() {
        document.getElementById('importModal').classList.remove('show');
        document.getElementById('importFile').value = '';
    }

    importCustomers() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            ZovatuApp.showNotification('Please select a file to import', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedCustomers = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedCustomers)) {
                    throw new Error('Invalid file format');
                }

                let importedCount = 0;
                let skippedCount = 0;

                importedCustomers.forEach(customerData => {
                    // Validate required fields
                    if (!customerData.name || !customerData.phone) {
                        skippedCount++;
                        return;
                    }

                    // Check for duplicate phone numbers
                    if (this.customers.some(c => c.phone === customerData.phone)) {
                        skippedCount++;
                        return;
                    }

                    // Create new customer
                    const newCustomer = {
                        id: ZovatuApp.generateId(),
                        name: customerData.name,
                        phone: customerData.phone,
                        email: customerData.email || '',
                        type: customerData.type || 'regular',
                        creditLimit: parseFloat(customerData.creditLimit) || 0,
                        paymentTerms: parseInt(customerData.paymentTerms) || 30,
                        address: customerData.address || '',
                        notes: customerData.notes || '',
                        totalPurchases: 0,
                        dueAmount: 0,
                        lastPurchaseDate: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    this.customers.push(newCustomer);
                    importedCount++;
                });

                this.saveCustomers();
                this.renderCustomers();
                this.closeImportModal();

                ZovatuApp.showNotification(
                    `Import completed: ${importedCount} customers imported, ${skippedCount} skipped`,
                    'success'
                );

            } catch (error) {
                ZovatuApp.showNotification('Invalid JSON file format', 'danger');
            }
        };

        reader.readAsText(file);
    }

    exportCustomers() {
        if (this.customers.length === 0) {
            ZovatuApp.showNotification('No customers to export', 'warning');
            return;
        }

        const exportData = this.customers.map(customer => ({
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            type: customer.type,
            creditLimit: customer.creditLimit,
            paymentTerms: customer.paymentTerms,
            address: customer.address,
            notes: customer.notes,
            totalPurchases: customer.totalPurchases,
            dueAmount: customer.dueAmount,
            lastPurchaseDate: customer.lastPurchaseDate
        }));

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const fileName = `customers_export_${ZovatuApp.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        
        if (typeof saveAs !== 'undefined') {
            saveAs(dataBlob, fileName);
        } else {
            // Fallback download method
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);
        }

        ZovatuApp.showNotification('Customers exported successfully', 'success');
    }

    sendDueReminders() {
        const overdueCustomers = this.customers.filter(customer => {
            if (customer.dueAmount <= 0 || !customer.lastPurchaseDate) return false;
            
            const lastPurchase = new Date(customer.lastPurchaseDate);
            const dueDate = new Date(lastPurchase.getTime() + (customer.paymentTerms * 24 * 60 * 60 * 1000));
            return new Date() > dueDate;
        });

        if (overdueCustomers.length === 0) {
            ZovatuApp.showNotification('No overdue customers found', 'info');
            return;
        }

        // In a real implementation, this would send SMS/Email reminders
        ZovatuApp.showNotification(
            `Due reminders would be sent to ${overdueCustomers.length} customers`,
            'info'
        );
    }

    viewInvoice(invoiceId) {
        // Store invoice ID and redirect to invoices page
        sessionStorage.setItem('viewInvoiceId', invoiceId);
        window.location.href = 'invoices.html';
    }
}

// Global functions for modal controls
function closeCustomerModal() {
    if (window.customerManager) {
        window.customerManager.closeCustomerModal();
    }
}

function closeCustomerDetailsModal() {
    if (window.customerManager) {
        window.customerManager.closeCustomerDetailsModal();
    }
}

function closePaymentModal() {
    if (window.customerManager) {
        window.customerManager.closePaymentModal();
    }
}

function closeImportModal() {
    if (window.customerManager) {
        window.customerManager.closeImportModal();
    }
}

// Initialize customer manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('customers.html')) {
        window.customerManager = new CustomerManager();
    }
});

// Export for use in other modules
window.CustomerManager = CustomerManager;

