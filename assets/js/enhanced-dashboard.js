// Zovatu Billing Tool - Enhanced Dashboard JavaScript
// Handles dashboard analytics, charts, and real-time statistics

class EnhancedDashboardManager {
    constructor() {
        this.salesChart = null;
        this.topProductsChart = null;
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.updateStatistics();
        this.initializeCharts();
        this.loadRecentActivity();
        this.loadLowStockAlerts();
        this.loadDuePayments();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    loadData() {
        this.products = DataManager.get('products') || [];
        this.customers = DataManager.get('customers') || [];
        this.invoices = DataManager.get('invoices') || [];
        this.payments = DataManager.get('payments') || [];
    }

    setupEventListeners() {
        // Chart period selectors
        const salesChartPeriod = document.getElementById('salesChartPeriod');
        const topProductsPeriod = document.getElementById('topProductsPeriod');

        if (salesChartPeriod) {
            salesChartPeriod.addEventListener('change', () => {
                this.updateSalesChart();
            });
        }

        if (topProductsPeriod) {
            topProductsPeriod.addEventListener('change', () => {
                this.updateTopProductsChart();
            });
        }

        // Quick action buttons (if they exist)
        const quickSaleBtn = document.getElementById('quickSale');
        const addProductBtn = document.getElementById('addProduct');
        const addCustomerBtn = document.getElementById('addCustomer');

        if (quickSaleBtn) {
            quickSaleBtn.addEventListener('click', () => {
                window.location.href = 'invoices.html';
            });
        }

        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                window.location.href = 'products.html';
            });
        }

        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => {
                window.location.href = 'customers.html';
            });
        }
    }

    updateStatistics() {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        // Calculate today's sales
        const todayInvoices = this.invoices.filter(inv => 
            new Date(inv.date) >= startOfToday
        );
        const todaysSales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Calculate yesterday's sales for comparison
        const yesterdayInvoices = this.invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= startOfYesterday && invDate < startOfToday;
        });
        const yesterdaysSales = yesterdayInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Calculate monthly sales
        const monthlyInvoices = this.invoices.filter(inv => 
            new Date(inv.date) >= startOfMonth
        );
        const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Calculate last month's sales for comparison
        const lastMonthInvoices = this.invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= startOfLastMonth && invDate <= endOfLastMonth;
        });
        const lastMonthSales = lastMonthInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Calculate percentage changes
        const todayChange = yesterdaysSales > 0 ? 
            ((todaysSales - yesterdaysSales) / yesterdaysSales * 100).toFixed(1) : 0;
        const monthlyChange = lastMonthSales > 0 ? 
            ((monthlySales - lastMonthSales) / lastMonthSales * 100).toFixed(1) : 0;

        // Count new customers this month
        const newCustomersThisMonth = this.customers.filter(customer => 
            new Date(customer.createdAt) >= startOfMonth
        ).length;

        // Update DOM elements safely
        this.updateElement('todaysSales', ZovatuApp.formatCurrency(todaysSales));
        this.updateElement('monthlySales', ZovatuApp.formatCurrency(monthlySales));
        this.updateElement('totalInvoices', this.invoices.length);
        this.updateElement('totalCustomers', this.customers.length);

        // Update change indicators
        this.updateChangeIndicator('todaysSalesChange', todayChange, 'yesterday');
        this.updateChangeIndicator('monthlySalesChange', monthlyChange, 'last month');
        this.updateElement('invoicesThisMonth', `${monthlyInvoices.length} this month`);
        this.updateElement('newCustomersThisMonth', `${newCustomersThisMonth} new this month`);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateChangeIndicator(id, change, period) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = `${change >= 0 ? '+' : ''}${change}% from ${period}`;
            element.className = `text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`;
        }
    }

    initializeCharts() {
        this.initializeSalesChart();
        this.initializeTopProductsChart();
    }

    initializeSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sales',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return ZovatuApp.formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        this.updateSalesChart();
    }

    initializeTopProductsChart() {
        const ctx = document.getElementById('topProductsChart');
        if (!ctx) return;

        this.topProductsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        this.updateTopProductsChart();
    }

    updateSalesChart() {
        if (!this.salesChart) return;

        const periodSelect = document.getElementById('salesChartPeriod');
        const period = periodSelect ? parseInt(periodSelect.value) : 7;
        const salesData = this.getSalesDataForPeriod(period);

        this.salesChart.data.labels = salesData.labels;
        this.salesChart.data.datasets[0].data = salesData.data;
        this.salesChart.update();
    }

    updateTopProductsChart() {
        if (!this.topProductsChart) return;

        const periodSelect = document.getElementById('topProductsPeriod');
        const period = periodSelect ? parseInt(periodSelect.value) : 7;
        const topProductsData = this.getTopProductsDataForPeriod(period);

        this.topProductsChart.data.labels = topProductsData.labels;
        this.topProductsChart.data.datasets[0].data = topProductsData.data;
        this.topProductsChart.update();
    }

    getSalesDataForPeriod(days) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
        
        const labels = [];
        const data = [];

        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // Format label based on period
            let label;
            if (days <= 7) {
                label = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
            } else if (days <= 30) {
                label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            
            labels.push(label);

            // Calculate sales for this date
            const dayInvoices = this.invoices.filter(inv => inv.date === dateStr);
            const dayTotal = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);
            data.push(dayTotal);
        }

        return { labels, data };
    }

    getTopProductsDataForPeriod(days) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
        
        // Get invoices within the period
        const periodInvoices = this.invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= startDate && invDate <= endDate;
        });

        // Count product sales
        const productSales = {};
        periodInvoices.forEach(invoice => {
            if (invoice.items) {
                invoice.items.forEach(item => {
                    if (productSales[item.name]) {
                        productSales[item.name] += item.quantity;
                    } else {
                        productSales[item.name] = item.quantity;
                    }
                });
            }
        });

        // Sort and get top 5
        const sortedProducts = Object.entries(productSales)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const labels = sortedProducts.map(([name]) => name);
        const data = sortedProducts.map(([,quantity]) => quantity);

        return { labels, data };
    }

    loadRecentActivity() {
        const recentActivityContainer = document.getElementById('recentActivity');
        if (!recentActivityContainer) return;

        // Get recent invoices (last 5)
        const recentInvoices = this.invoices
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
            .slice(0, 5);

        if (recentInvoices.length === 0) {
            recentActivityContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        recentActivityContainer.innerHTML = recentInvoices.map(invoice => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <i class="fas fa-file-invoice text-blue-600"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">Invoice ${invoice.number}</p>
                        <p class="text-xs text-gray-500">
                            ${invoice.customer ? invoice.customer.name : 'Walk-in Customer'} • 
                            ${ZovatuApp.formatDate(invoice.date, 'MMM DD')}
                        </p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-gray-900">${ZovatuApp.formatCurrency(invoice.total)}</p>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                    }">
                        ${invoice.status || 'completed'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    loadLowStockAlerts() {
        const lowStockContainer = document.getElementById('lowStockAlerts');
        if (!lowStockContainer) return;

        // Find products with low stock (stock <= lowStockThreshold)
        const lowStockProducts = this.products.filter(product => 
            product.stock <= (product.lowStockThreshold || 10)
        ).slice(0, 5);

        if (lowStockProducts.length === 0) {
            lowStockContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-check-circle text-2xl mb-2 text-green-500"></i>
                    <p>All products in stock</p>
                </div>
            `;
            return;
        }

        lowStockContainer.innerHTML = lowStockProducts.map(product => `
            <div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-orange-600"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">${product.name}</p>
                        <p class="text-xs text-gray-500">SKU: ${product.sku || 'N/A'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-orange-600">${product.stock} left</p>
                    <p class="text-xs text-gray-500">Min: ${product.lowStockThreshold || 10}</p>
                </div>
            </div>
        `).join('');
    }

    loadDuePayments() {
        const duePaymentsContainer = document.getElementById('duePayments');
        if (!duePaymentsContainer) return;

        // Find customers with due amounts
        const customersWithDue = this.customers.filter(customer => 
            customer.dueAmount > 0
        ).sort((a, b) => b.dueAmount - a.dueAmount).slice(0, 5);

        if (customersWithDue.length === 0) {
            duePaymentsContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-check-circle text-2xl mb-2 text-green-500"></i>
                    <p>No pending dues</p>
                </div>
            `;
            return;
        }

        duePaymentsContainer.innerHTML = customersWithDue.map(customer => {
            // Check if overdue
            const isOverdue = customer.lastPurchaseDate && customer.paymentTerms ? 
                new Date() > new Date(new Date(customer.lastPurchaseDate).getTime() + customer.paymentTerms * 24 * 60 * 60 * 1000) : 
                false;

            return `
                <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-user text-red-600"></i>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-gray-900">${customer.name}</p>
                            <p class="text-xs text-gray-500">${customer.phone}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-red-600">${ZovatuApp.formatCurrency(customer.dueAmount)}</p>
                        ${isOverdue ? '<p class="text-xs text-red-500">Overdue</p>' : '<p class="text-xs text-gray-500">Due</p>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    startAutoRefresh() {
        // Refresh dashboard data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadData();
            this.updateStatistics();
            this.updateSalesChart();
            this.updateTopProductsChart();
            this.loadRecentActivity();
            this.loadLowStockAlerts();
            this.loadDuePayments();
        }, 5 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Manual refresh method
    refresh() {
        this.loadData();
        this.updateStatistics();
        this.updateSalesChart();
        this.updateTopProductsChart();
        this.loadRecentActivity();
        this.loadLowStockAlerts();
        this.loadDuePayments();
        
        ZovatuApp.showNotification('Dashboard refreshed', 'success');
    }

    // Cleanup method
    destroy() {
        this.stopAutoRefresh();
        
        if (this.salesChart) {
            this.salesChart.destroy();
            this.salesChart = null;
        }
        
        if (this.topProductsChart) {
            this.topProductsChart.destroy();
            this.topProductsChart = null;
        }
    }
}

// Initialize enhanced dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        window.enhancedDashboardManager = new EnhancedDashboardManager();
    }
});

// Cleanup when leaving the page
window.addEventListener('beforeunload', () => {
    if (window.enhancedDashboardManager) {
        window.enhancedDashboardManager.destroy();
    }
});

// Export for use in other modules
window.EnhancedDashboardManager = EnhancedDashboardManager;

