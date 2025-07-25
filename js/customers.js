// Customers Management

let customers = [];
let editingCustomerId = null;

// Initialize customers page
document.addEventListener('DOMContentLoaded', function() {
    if (!auth.protectPage()) return;
    
    loadCustomers();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Customer form submission
    document.getElementById('customerForm').addEventListener('submit', handleCustomerSubmit);
}

// Load customers from storage
function loadCustomers() {
    customers = utils.getFromStorage('customers', []);
    displayCustomers();
}

// Display customers in table
function displayCustomers(customersToShow = customers) {
    const tbody = document.getElementById('customersTableBody');
    
    if (customersToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No customers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = customersToShow.map(customer => `
        <tr>
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.phone}</td>
            <td>
                <span class="type-badge type-${customer.type}">
                    ${customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
                </span>
            </td>
            <td>${utils.formatCurrency(customer.totalPurchases || 0)}</td>
            <td class="actions">
                <button onclick="viewCustomer('${customer.id}')" class="btn-primary" style="padding: 5px 10px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editCustomer('${customer.id}')" class="btn-secondary" style="padding: 5px 10px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCustomer('${customer.id}')" class="btn-danger" style="padding: 5px 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add type badge styles if not already added
    if (!document.getElementById('typeBadgeStyles')) {
        const styles = document.createElement('style');
        styles.id = 'typeBadgeStyles';
        styles.textContent = `
            .type-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            .type-regular { background-color: #e3f2fd; color: #1976d2; }
            .type-wholesale { background-color: #f3e5f5; color: #7b1fa2; }
            .type-retail { background-color: #e8f5e8; color: #388e3c; }
        `;
        document.head.appendChild(styles);
    }
}

// Search customers
function searchCustomers() {
    const searchTerm = document.getElementById('searchCustomers').value;
    const filteredCustomers = utils.performSearch(searchTerm, customers, ['name', 'email', 'phone', 'id']);
    displayCustomers(filteredCustomers);
}

// Filter customers
function filterCustomers() {
    const typeFilter = document.getElementById('customerTypeFilter').value;
    
    let filteredCustomers = customers;
    
    if (typeFilter) {
        filteredCustomers = filteredCustomers.filter(c => c.type === typeFilter);
    }
    
    displayCustomers(filteredCustomers);
}

// Show add customer modal
function showAddCustomerModal() {
    editingCustomerId = null;
    document.getElementById('modalTitle').textContent = 'Add Customer';
    document.getElementById('customerForm').reset();
    utils.showModal('customerModal');
}

// Hide customer modal
function hideCustomerModal() {
    utils.hideModal('customerModal');
    editingCustomerId = null;
}

// Handle customer form submission
function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        type: document.getElementById('customerType').value,
        address: document.getElementById('customerAddress').value,
        city: document.getElementById('customerCity').value,
        zip: document.getElementById('customerZip').value,
        notes: document.getElementById('customerNotes').value
    };
    
    // Validation
    if (!formData.name || !formData.phone) {
        utils.showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (formData.email && !utils.validateEmail(formData.email)) {
        utils.showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (!utils.validatePhone(formData.phone)) {
        utils.showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // Check for duplicate phone number
    const existingCustomer = customers.find(c => c.phone === formData.phone && c.id !== editingCustomerId);
    if (existingCustomer) {
        utils.showNotification('A customer with this phone number already exists', 'error');
        return;
    }
    
    if (editingCustomerId) {
        // Update existing customer
        const index = customers.findIndex(c => c.id === editingCustomerId);
        if (index !== -1) {
            customers[index] = { 
                ...customers[index], 
                ...formData, 
                updatedAt: new Date().toISOString() 
            };
            utils.showNotification('Customer updated successfully', 'success');
        }
    } else {
        // Add new customer
        const newCustomer = {
            id: utils.generateCustomerId(),
            ...formData,
            totalPurchases: 0,
            lastPurchase: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        customers.push(newCustomer);
        utils.showNotification('Customer added successfully', 'success');
    }
    
    // Save to storage
    utils.saveToStorage('customers', customers);
    
    // Refresh display
    loadCustomers();
    hideCustomerModal();
}

// Edit customer
function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    editingCustomerId = customerId;
    document.getElementById('modalTitle').textContent = 'Edit Customer';
    
    // Fill form with customer data
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerType').value = customer.type;
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerCity').value = customer.city || '';
    document.getElementById('customerZip').value = customer.zip || '';
    document.getElementById('customerNotes').value = customer.notes || '';
    
    utils.showModal('customerModal');
}

// View customer details
function viewCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // Get customer's purchase history
    const invoices = utils.getFromStorage('invoices', []);
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    
    const content = `
        <div style="max-width: 600px;">
            <div class="grid-2" style="margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0; color: #007bff;">${customer.name}</h3>
                    <p style="margin: 5px 0;"><strong>Customer ID:</strong> ${customer.id}</p>
                    <p style="margin: 5px 0;"><strong>Phone:</strong> ${customer.phone}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}</p>
                </div>
                <div>
                    <p style="margin: 5px 0;"><strong>Total Purchases:</strong> ${utils.formatCurrency(customer.totalPurchases || 0)}</p>
                    <p style="margin: 5px 0;"><strong>Last Purchase:</strong> ${customer.lastPurchase ? utils.formatDate(customer.lastPurchase) : 'Never'}</p>
                    <p style="margin: 5px 0;"><strong>Total Orders:</strong> ${customerInvoices.length}</p>
                    <p style="margin: 5px 0;"><strong>Member Since:</strong> ${utils.formatDate(customer.createdAt)}</p>
                </div>
            </div>
            
            ${customer.address ? `
                <div style="margin-bottom: 20px;">
                    <h4>Address</h4>
                    <p>${customer.address}</p>
                    ${customer.city || customer.zip ? `<p>${customer.city || ''} ${customer.zip || ''}</p>` : ''}
                </div>
            ` : ''}
            
            ${customer.notes ? `
                <div style="margin-bottom: 20px;">
                    <h4>Notes</h4>
                    <p>${customer.notes}</p>
                </div>
            ` : ''}
            
            <div>
                <h4>Recent Purchase History</h4>
                ${customerInvoices.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Invoice #</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customerInvoices.slice(-5).reverse().map(invoice => `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${invoice.invoiceNumber}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${utils.formatDate(invoice.date)}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${utils.formatCurrency(invoice.grandTotal)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p class="no-data">No purchase history found</p>'}
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="editCustomer('${customer.id}'); hideCustomerDetailsModal();" class="btn-primary">
                    <i class="fas fa-edit"></i> Edit Customer
                </button>
                <button onclick="window.location.href='sales.html'" class="btn-success">
                    <i class="fas fa-plus"></i> Create Invoice
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('customerDetailsContent').innerHTML = content;
    utils.showModal('customerDetailsModal');
}

// Hide customer details modal
function hideCustomerDetailsModal() {
    utils.hideModal('customerDetailsModal');
}

// Delete customer
function deleteCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // Check if customer has any invoices
    const invoices = utils.getFromStorage('invoices', []);
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    
    if (customerInvoices.length > 0) {
        utils.showNotification('Cannot delete customer with existing invoices', 'error');
        return;
    }
    
    utils.confirmDialog(`Are you sure you want to delete "${customer.name}"?`, () => {
        customers = customers.filter(c => c.id !== customerId);
        utils.saveToStorage('customers', customers);
        loadCustomers();
        utils.showNotification('Customer deleted successfully', 'success');
    });
}

// Export customers
function exportCustomers() {
    if (customers.length === 0) {
        utils.showNotification('No customers to export', 'warning');
        return;
    }
    
    const exportData = customers.map(customer => ({
        'Customer ID': customer.id,
        'Name': customer.name,
        'Email': customer.email || '',
        'Phone': customer.phone,
        'Type': customer.type,
        'Address': customer.address || '',
        'City': customer.city || '',
        'ZIP Code': customer.zip || '',
        'Total Purchases': customer.totalPurchases || 0,
        'Last Purchase': customer.lastPurchase || '',
        'Notes': customer.notes || '',
        'Created Date': utils.formatDate(customer.createdAt)
    }));
    
    utils.exportToCSV(exportData, `customers-${new Date().toISOString().split('T')[0]}.csv`);
}

// Get customer by ID (for sales)
function getCustomerById(customerId) {
    return customers.find(c => c.id === customerId);
}

// Update customer purchase total
function updateCustomerPurchases(customerId, amount, date) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return false;
    
    customer.totalPurchases = (customer.totalPurchases || 0) + amount;
    customer.lastPurchase = date;
    customer.updatedAt = new Date().toISOString();
    
    utils.saveToStorage('customers', customers);
    return true;
}

// Get top customers by purchase amount
function getTopCustomers(limit = 5) {
    return customers
        .filter(c => c.totalPurchases > 0)
        .sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))
        .slice(0, limit);
}

// Export functions for use in other modules
window.customersModule = {
    getCustomerById,
    updateCustomerPurchases,
    getTopCustomers,
    customers: () => customers
};

