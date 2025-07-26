// Zovatu Billing Tool - Reports & Analytics JavaScript
// Handles comprehensive business reporting, analytics, and data visualization

class ReportsManager {
    constructor() {
        this.charts = {};
        this.currentFilters = {
            dateRange: 'thisMonth',
            startDate: null,
            endDate: null,
            reportType: 'all'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDateFilters();
        this.loadReportData();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Filter controls
        document.getElementById('dateRange')?.addEventListener('change', (e) => {
            this.handleDateRangeChange(e.target.value);
        });
        
        document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
            this.resetFilters();
        });
        
        document.getElementById('exportReportBtn')?.addEventListener('click', () => {
            this.exportCurrentReport();
        });

        // Chart period buttons
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateChartPeriod(e.target.dataset.period);
            });
        });

        // Report action buttons
        document.getElementById('generatePdfBtn')?.addEventListener('click', () => this.generatePdfReport());
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => this.exportToExcel());
        document.getElementById('emailReportBtn')?.addEventListener('click', () => this.emailReport());
        document.getElementById('printReportBtn')?.addEventListener('click', () => this.printReport());
        document.getElementById('scheduleReportBtn')?.addEventListener('click', () => this.scheduleReport());
        document.getElementById('customReportBtn')?.addEventListener('click', () => this.openCustomReportModal());
        
        // Custom report
        document.getElementById('generateCustomReportBtn')?.addEventListener('click', () => this.generateCustomReport());
    }

    initializeDateFilters() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('startDate').value = this.formatDateForInput(startOfMonth);
        document.getElementById('endDate').value = this.formatDateForInput(today);
        
        this.currentFilters.startDate = startOfMonth;
        this.currentFilters.endDate = today;
    }

    handleDateRangeChange(range) {
        const today = new Date();
        let startDate, endDate;

        switch (range) {
            case 'today':
                startDate = endDate = new Date(today);
                break;
            case 'yesterday':
                startDate = endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'thisWeek':
                startDate = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
                endDate = new Date(today);
                break;
            case 'lastWeek':
                const lastWeekStart = new Date(today.getTime() - (today.getDay() + 7) * 24 * 60 * 60 * 1000);
                startDate = lastWeekStart;
                endDate = new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
                break;
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today);
                break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'thisYear':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today);
                break;
            case 'custom':
                // Don't auto-update for custom range
                return;
            default:
                return;
        }

        document.getElementById('startDate').value = this.formatDateForInput(startDate);
        document.getElementById('endDate').value = this.formatDateForInput(endDate);
        
        this.currentFilters.dateRange = range;
        this.currentFilters.startDate = startDate;
        this.currentFilters.endDate = endDate;
    }

    applyFilters() {
        this.currentFilters = {
            dateRange: document.getElementById('dateRange').value,
            startDate: new Date(document.getElementById('startDate').value),
            endDate: new Date(document.getElementById('endDate').value),
            reportType: document.getElementById('reportType').value
        };

        this.loadReportData();
        this.updateCharts();
        ZovatuApp.showNotification('Filters applied successfully', 'success');
    }

    resetFilters() {
        document.getElementById('dateRange').value = 'thisMonth';
        document.getElementById('reportType').value = 'all';
        this.initializeDateFilters();
        this.applyFilters();
    }

    loadReportData() {
        const invoices = DataManager.get('invoices') || [];
        const products = DataManager.get('products') || [];
        const customers = DataManager.get('customers') || [];

        // Filter invoices by date range
        const filteredInvoices = this.filterInvoicesByDate(invoices);
        
        // Calculate statistics
        this.updateQuickStats(filteredInvoices, products, customers);
        this.updateFinancialSummary(filteredInvoices, products);
        this.updateInventoryReports(products);
        this.updateTopProductsTable(filteredInvoices, products);
        this.updateTopCustomersTable(filteredInvoices, customers);
    }

    filterInvoicesByDate(invoices) {
        return invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.date);
            return invoiceDate >= this.currentFilters.startDate && invoiceDate <= this.currentFilters.endDate;
        });
    }

    updateQuickStats(invoices, products, customers) {
        // Calculate current period stats
        const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalOrders = invoices.length;
        const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
        const totalCustomers = customers.length;

        // Calculate previous period for comparison
        const previousPeriodInvoices = this.getPreviousPeriodInvoices();
        const prevTotalSales = previousPeriodInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const prevTotalOrders = previousPeriodInvoices.length;
        const prevAverageOrder = prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;

        // Calculate percentage changes
        const salesChange = this.calculatePercentageChange(totalSales, prevTotalSales);
        const ordersChange = this.calculatePercentageChange(totalOrders, prevTotalOrders);
        const avgOrderChange = this.calculatePercentageChange(averageOrder, prevAverageOrder);

        // Update UI
        document.getElementById('totalSales').textContent = this.formatCurrency(totalSales);
        document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
        document.getElementById('averageOrder').textContent = this.formatCurrency(averageOrder);
        document.getElementById('totalCustomers').textContent = totalCustomers.toLocaleString();

        // Update change indicators
        this.updateChangeIndicator('salesChange', salesChange);
        this.updateChangeIndicator('ordersChange', ordersChange);
        this.updateChangeIndicator('avgOrderChange', avgOrderChange);
        this.updateChangeIndicator('customersChange', 0); // Customer growth calculation would need historical data
    }

    updateChangeIndicator(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const isPositive = change >= 0;
        const icon = isPositive ? '↗' : '↘';
        const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
        
        element.textContent = `${icon} ${Math.abs(change).toFixed(1)}% from last period`;
        element.className = `text-sm ${colorClass}`;
    }

    updateFinancialSummary(invoices, products) {
        let grossRevenue = 0;
        let totalDiscounts = 0;
        let taxCollected = 0;
        let costOfGoods = 0;

        invoices.forEach(invoice => {
            grossRevenue += (invoice.subtotal || 0);
            totalDiscounts += (invoice.discount || 0);
            taxCollected += (invoice.tax || 0);
            
            // Calculate cost of goods sold
            if (invoice.items) {
                invoice.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (product && product.purchasePrice) {
                        costOfGoods += (product.purchasePrice * item.quantity);
                    }
                });
            }
        });

        const netRevenue = grossRevenue - totalDiscounts + taxCollected;
        const grossProfit = netRevenue - costOfGoods;
        const profitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

        // Update UI
        document.getElementById('grossRevenue').textContent = this.formatCurrency(grossRevenue);
        document.getElementById('totalDiscounts').textContent = this.formatCurrency(totalDiscounts);
        document.getElementById('taxCollected').textContent = this.formatCurrency(taxCollected);
        document.getElementById('netRevenue').textContent = this.formatCurrency(netRevenue);
        document.getElementById('costOfGoods').textContent = this.formatCurrency(costOfGoods);
        document.getElementById('grossProfit').textContent = this.formatCurrency(grossProfit);
        document.getElementById('profitMargin').textContent = `${profitMargin.toFixed(1)}%`;
        document.getElementById('netProfit').textContent = this.formatCurrency(grossProfit);
        
        // Simplified calculations for demo
        document.getElementById('operatingCosts').textContent = '$0.00';
        document.getElementById('otherExpenses').textContent = '$0.00';
        document.getElementById('totalCosts').textContent = this.formatCurrency(costOfGoods);
        document.getElementById('returnOnInvestment').textContent = `${profitMargin.toFixed(1)}%`;
    }

    updateInventoryReports(products) {
        const lowStockThreshold = 10; // This could come from settings
        const lowStockItems = products.filter(p => (p.stock || 0) <= lowStockThreshold && (p.stock || 0) > 0);
        const outOfStockItems = products.filter(p => (p.stock || 0) === 0);
        
        const totalStockValue = products.reduce((sum, p) => {
            return sum + ((p.price || 0) * (p.stock || 0));
        }, 0);

        // Update inventory stats
        document.getElementById('totalProducts').textContent = products.length.toLocaleString();
        document.getElementById('totalStockValue').textContent = this.formatCurrency(totalStockValue);
        document.getElementById('lowStockCount').textContent = lowStockItems.length.toLocaleString();
        document.getElementById('outOfStockCount').textContent = outOfStockItems.length.toLocaleString();

        // Update low stock items list
        const lowStockContainer = document.getElementById('lowStockItems');
        if (lowStockItems.length === 0) {
            lowStockContainer.innerHTML = '<p class="text-sm text-gray-500">No low stock items</p>';
        } else {
            lowStockContainer.innerHTML = lowStockItems.slice(0, 5).map(item => `
                <div class="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span class="text-sm font-medium">${item.name}</span>
                    <span class="text-sm text-red-600">${item.stock || 0} left</span>
                </div>
            `).join('');
        }
    }

    updateTopProductsTable(invoices, products) {
        // Calculate product sales
        const productSales = {};
        
        invoices.forEach(invoice => {
            if (invoice.items) {
                invoice.items.forEach(item => {
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = {
                            quantity: 0,
                            revenue: 0,
                            profit: 0
                        };
                    }
                    
                    productSales[item.productId].quantity += item.quantity;
                    productSales[item.productId].revenue += item.total;
                    
                    // Calculate profit if purchase price is available
                    const product = products.find(p => p.id === item.productId);
                    if (product && product.purchasePrice) {
                        const profit = (item.price - product.purchasePrice) * item.quantity;
                        productSales[item.productId].profit += profit;
                    }
                });
            }
        });

        // Sort by revenue and get top 5
        const topProducts = Object.entries(productSales)
            .map(([productId, sales]) => {
                const product = products.find(p => p.id === productId);
                return {
                    product: product,
                    ...sales
                };
            })
            .filter(item => item.product)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Update table
        const tbody = document.getElementById('topProductsTable');
        if (topProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500">No sales data available</td></tr>';
        } else {
            tbody.innerHTML = topProducts.map(item => `
                <tr>
                    <td>
                        <div class="font-medium">${item.product.name}</div>
                        <div class="text-sm text-gray-500">${item.product.sku || 'N/A'}</div>
                    </td>
                    <td>${item.quantity}</td>
                    <td>${this.formatCurrency(item.revenue)}</td>
                    <td class="${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}">${this.formatCurrency(item.profit)}</td>
                </tr>
            `).join('');
        }
    }

    updateTopCustomersTable(invoices, customers) {
        // Calculate customer stats
        const customerStats = {};
        
        invoices.forEach(invoice => {
            const customerId = invoice.customerId || 'walk-in';
            if (!customerStats[customerId]) {
                customerStats[customerId] = {
                    orders: 0,
                    totalSpent: 0,
                    lastOrder: null
                };
            }
            
            customerStats[customerId].orders += 1;
            customerStats[customerId].totalSpent += (invoice.total || 0);
            
            const orderDate = new Date(invoice.date);
            if (!customerStats[customerId].lastOrder || orderDate > customerStats[customerId].lastOrder) {
                customerStats[customerId].lastOrder = orderDate;
            }
        });

        // Sort by total spent and get top 5
        const topCustomers = Object.entries(customerStats)
            .map(([customerId, stats]) => {
                const customer = customers.find(c => c.id === customerId) || { name: 'Walk-in Customer', id: customerId };
                return {
                    customer: customer,
                    ...stats
                };
            })
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);

        // Update table
        const tbody = document.getElementById('topCustomersTable');
        if (topCustomers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500">No customer data available</td></tr>';
        } else {
            tbody.innerHTML = topCustomers.map(item => `
                <tr>
                    <td>
                        <div class="font-medium">${item.customer.name}</div>
                        <div class="text-sm text-gray-500">${item.customer.phone || 'N/A'}</div>
                    </td>
                    <td>${item.orders}</td>
                    <td>${this.formatCurrency(item.totalSpent)}</td>
                    <td>${item.lastOrder ? ZovatuApp.formatDate(item.lastOrder, 'MMM DD, YYYY') : 'N/A'}</td>
                </tr>
            `).join('');
        }
    }

    initializeCharts() {
        this.createSalesTrendChart();
        this.createTopProductsChart();
        this.createRevenueProfitChart();
        this.createCustomerGrowthChart();
    }

    createSalesTrendChart() {
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) return;

        const data = this.generateSalesTrendData(7); // Default to 7 days

        this.charts.salesTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Sales',
                    data: data.values,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
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
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    createTopProductsChart() {
        const ctx = document.getElementById('topProductsChart');
        if (!ctx) return;

        const data = this.generateTopProductsData();

        this.charts.topProducts = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)',
                        'rgb(139, 92, 246)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createRevenueProfitChart() {
        const ctx = document.getElementById('revenueProfitChart');
        if (!ctx) return;

        const data = this.generateRevenueProfitData();

        this.charts.revenueProfit = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Revenue',
                    data: data.revenue,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)'
                }, {
                    label: 'Profit',
                    data: data.profit,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    createCustomerGrowthChart() {
        const ctx = document.getElementById('customerGrowthChart');
        if (!ctx) return;

        const data = this.generateCustomerGrowthData();

        this.charts.customerGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'New Customers',
                    data: data.values,
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
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
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateChartPeriod(period) {
        // Update active button
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // Update sales trend chart
        const data = this.generateSalesTrendData(parseInt(period));
        this.charts.salesTrend.data.labels = data.labels;
        this.charts.salesTrend.data.datasets[0].data = data.values;
        this.charts.salesTrend.update();
    }

    updateCharts() {
        // Regenerate all chart data with current filters
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey]) {
                this.charts[chartKey].destroy();
            }
        });
        
        this.initializeCharts();
    }

    // Data generation methods (simplified for demo)
    generateSalesTrendData(days) {
        const labels = [];
        const values = [];
        const invoices = this.filterInvoicesByDate(DataManager.get('invoices') || []);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dayInvoices = invoices.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.toDateString() === date.toDateString();
            });
            
            const dayTotal = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            values.push(dayTotal);
        }

        return { labels, values };
    }

    generateTopProductsData() {
        const invoices = this.filterInvoicesByDate(DataManager.get('invoices') || []);
        const products = DataManager.get('products') || [];
        const productSales = {};

        invoices.forEach(invoice => {
            if (invoice.items) {
                invoice.items.forEach(item => {
                    productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
                });
            }
        });

        const topProducts = Object.entries(productSales)
            .map(([productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                return { product, quantity };
            })
            .filter(item => item.product)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            labels: topProducts.map(item => item.product.name),
            values: topProducts.map(item => item.quantity)
        };
    }

    generateRevenueProfitData() {
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const revenue = [12000, 15000, 18000, 14000, 20000, 22000];
        const profit = [3000, 4500, 5400, 3500, 6000, 6600];

        return { labels, revenue, profit };
    }

    generateCustomerGrowthData() {
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const values = [5, 8, 12, 15];

        return { labels, values };
    }

    getPreviousPeriodInvoices() {
        // Calculate previous period based on current filters
        const periodLength = this.currentFilters.endDate - this.currentFilters.startDate;
        const prevEndDate = new Date(this.currentFilters.startDate.getTime() - 1);
        const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

        const invoices = DataManager.get('invoices') || [];
        return invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.date);
            return invoiceDate >= prevStartDate && invoiceDate <= prevEndDate;
        });
    }

    calculatePercentageChange(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }

    // Export and action methods
    exportCurrentReport() {
        const reportData = this.generateReportData();
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        
        if (window.saveAs) {
            saveAs(blob, `zovatu-report-${this.formatDateForFilename(new Date())}.json`);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zovatu-report-${this.formatDateForFilename(new Date())}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        ZovatuApp.showNotification('Report exported successfully', 'success');
    }

    generatePdfReport() {
        ZovatuApp.showNotification('PDF generation feature coming soon', 'info');
    }

    exportToExcel() {
        ZovatuApp.showNotification('Excel export feature coming soon', 'info');
    }

    emailReport() {
        ZovatuApp.showNotification('Email report feature coming soon', 'info');
    }

    printReport() {
        window.print();
    }

    scheduleReport() {
        ZovatuApp.showNotification('Schedule report feature coming soon', 'info');
    }

    openCustomReportModal() {
        document.getElementById('customReportModal').style.display = 'flex';
    }

    closeCustomReportModal() {
        document.getElementById('customReportModal').style.display = 'none';
    }

    generateCustomReport() {
        const reportName = document.getElementById('customReportName').value;
        const reportType = document.getElementById('customReportType').value;
        
        if (!reportName) {
            ZovatuApp.showNotification('Please enter a report name', 'error');
            return;
        }

        // Generate custom report based on selections
        ZovatuApp.showNotification(`Custom report "${reportName}" generated successfully`, 'success');
        this.closeCustomReportModal();
    }

    generateReportData() {
        const invoices = this.filterInvoicesByDate(DataManager.get('invoices') || []);
        const products = DataManager.get('products') || [];
        const customers = DataManager.get('customers') || [];

        return {
            metadata: {
                reportType: 'Business Analytics Report',
                generatedAt: new Date().toISOString(),
                dateRange: {
                    start: this.currentFilters.startDate.toISOString(),
                    end: this.currentFilters.endDate.toISOString()
                }
            },
            summary: {
                totalSales: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
                totalOrders: invoices.length,
                totalCustomers: customers.length,
                totalProducts: products.length
            },
            invoices: invoices,
            products: products,
            customers: customers
        };
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateForFilename(date) {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    }
}

// Global functions for modal management
function closeCustomReportModal() {
    if (window.reportsManager) {
        window.reportsManager.closeCustomReportModal();
    }
}

// Initialize reports manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reportsManager = new ReportsManager();
});

// Export for use in other modules
window.ReportsManager = ReportsManager;

