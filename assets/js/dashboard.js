// Zovatu Billing Tool - Dashboard JavaScript
// Handles dashboard analytics, charts, and statistics

class Dashboard {
    constructor() {
        this.charts = {};
        this.stats = {
            totalSales: 0,
            totalProducts: 0,
            totalCustomers: 0,
            totalInvoices: 0,
            lowStockItems: 0,
            expiredProducts: 0
        };
        this.init();
    }

    init() {
        this.loadData();
        this.updateStats();
        this.createCharts();
        this.setupEventListeners();
        this.checkNotifications();
        
        // Refresh data every 5 minutes
        setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
    }

    loadData() {
        // Load data from localStorage
        this.products = DataManager.get('products') || [];
        this.customers = DataManager.get('customers') || [];
        this.invoices = DataManager.get('invoices') || [];
        this.sales = DataManager.get('sales') || [];
    }

    updateStats() {
        // Calculate total sales for today
        const today = new Date().toDateString();
        const todaySales = this.sales.filter(sale => 
            new Date(sale.date).toDateString() === today
        );
        this.stats.totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);

        // Calculate total products
        this.stats.totalProducts = this.products.length;

        // Calculate total customers
        this.stats.totalCustomers = this.customers.length;

        // Calculate total invoices
        this.stats.totalInvoices = this.invoices.length;

        // Calculate low stock items
        const lowStockThreshold = ZovatuApp.settings.notifications.lowStockThreshold || 10;
        this.stats.lowStockItems = this.products.filter(product => 
            product.stock <= lowStockThreshold
        ).length;

        // Calculate expired products
        const today_date = new Date();
        this.stats.expiredProducts = this.products.filter(product => 
            product.expiry && new Date(product.expiry) < today_date
        ).length;

        this.renderStats();
    }

    renderStats() {
        // Update stat cards
        this.updateStatCard('total-sales', ZovatuApp.formatCurrency(this.stats.totalSales));
        this.updateStatCard('total-products', this.stats.totalProducts);
        this.updateStatCard('total-customers', this.stats.totalCustomers);
        this.updateStatCard('total-invoices', this.stats.totalInvoices);
        this.updateStatCard('low-stock', this.stats.lowStockItems);
        this.updateStatCard('expired-products', this.stats.expiredProducts);
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    createCharts() {
        this.createSalesChart();
        this.createProductCategoryChart();
        this.createMonthlyRevenueChart();
    }

    createSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        // Get last 7 days sales data
        const last7Days = this.getLast7DaysSales();
        
        this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.labels,
                datasets: [{
                    label: 'Daily Sales',
                    data: last7Days.data,
                    borderColor: '#3b82f6',
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
                }
            }
        });
    }

    createProductCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categoryData = this.getProductCategoryData();
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.data,
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#06b6d4'
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

    createMonthlyRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const monthlyData = this.getMonthlyRevenueData();
        
        this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Monthly Revenue',
                    data: monthlyData.data,
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
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
                }
            }
        });
    }

    getLast7DaysSales() {
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            const daySales = this.sales.filter(sale => 
                new Date(sale.date).toDateString() === dateString
            );
            const dayTotal = daySales.reduce((sum, sale) => sum + sale.total, 0);
            data.push(dayTotal);
        }
        
        return { labels, data };
    }

    getProductCategoryData() {
        const categories = {};
        
        this.products.forEach(product => {
            const category = product.category || 'Uncategorized';
            categories[category] = (categories[category] || 0) + 1;
        });
        
        return {
            labels: Object.keys(categories),
            data: Object.values(categories)
        };
    }

    getMonthlyRevenueData() {
        const labels = [];
        const data = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
            
            const monthSales = this.sales.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate.getMonth() === date.getMonth() && 
                       saleDate.getFullYear() === date.getFullYear();
            });
            
            const monthTotal = monthSales.reduce((sum, sale) => sum + sale.total, 0);
            data.push(monthTotal);
        }
        
        return { labels, data };
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // Quick action buttons
        const quickSaleBtn = document.getElementById('quickSale');
        if (quickSaleBtn) {
            quickSaleBtn.addEventListener('click', () => {
                window.location.href = 'invoices.html';
            });
        }

        const addProductBtn = document.getElementById('addProduct');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                window.location.href = 'products.html';
            });
        }

        const addCustomerBtn = document.getElementById('addCustomer');
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => {
                window.location.href = 'customers.html';
            });
        }
    }

    checkNotifications() {
        const notifications = [];

        // Check for low stock
        if (this.stats.lowStockItems > 0) {
            notifications.push({
                type: 'warning',
                message: `${this.stats.lowStockItems} product(s) are running low on stock`,
                action: 'View Products',
                link: 'products.html'
            });
        }

        // Check for expired products
        if (this.stats.expiredProducts > 0) {
            notifications.push({
                type: 'danger',
                message: `${this.stats.expiredProducts} product(s) have expired`,
                action: 'View Products',
                link: 'products.html'
            });
        }

        // Check for pending invoices (if any)
        const pendingInvoices = this.invoices.filter(invoice => invoice.status === 'pending');
        if (pendingInvoices.length > 0) {
            notifications.push({
                type: 'info',
                message: `${pendingInvoices.length} invoice(s) are pending`,
                action: 'View Invoices',
                link: 'invoices.html'
            });
        }

        this.renderNotifications(notifications);
    }

    renderNotifications(notifications) {
        const container = document.getElementById('notifications');
        if (!container) return;

        container.innerHTML = '';

        if (notifications.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No notifications</p>';
            return;
        }

        notifications.forEach(notification => {
            const notificationEl = document.createElement('div');
            notificationEl.className = `alert alert-${notification.type} flex justify-between items-center`;
            notificationEl.innerHTML = `
                <span>${notification.message}</span>
                <a href="${notification.link}" class="btn btn-sm btn-primary">${notification.action}</a>
            `;
            container.appendChild(notificationEl);
        });
    }

    refreshData() {
        this.loadData();
        this.updateStats();
        this.updateCharts();
        this.checkNotifications();
        
        ZovatuApp.showNotification('Dashboard refreshed', 'success');
    }

    updateCharts() {
        // Update sales chart
        if (this.charts.sales) {
            const last7Days = this.getLast7DaysSales();
            this.charts.sales.data.labels = last7Days.labels;
            this.charts.sales.data.datasets[0].data = last7Days.data;
            this.charts.sales.update();
        }

        // Update category chart
        if (this.charts.category) {
            const categoryData = this.getProductCategoryData();
            this.charts.category.data.labels = categoryData.labels;
            this.charts.category.data.datasets[0].data = categoryData.data;
            this.charts.category.update();
        }

        // Update revenue chart
        if (this.charts.revenue) {
            const monthlyData = this.getMonthlyRevenueData();
            this.charts.revenue.data.labels = monthlyData.labels;
            this.charts.revenue.data.datasets[0].data = monthlyData.data;
            this.charts.revenue.update();
        }
    }

    getBestSellingProducts(limit = 5) {
        const productSales = {};
        
        this.sales.forEach(sale => {
            sale.items.forEach(item => {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            });
        });

        const sortedProducts = Object.entries(productSales)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([productId, quantity]) => {
                const product = this.products.find(p => p.id === productId);
                return {
                    product: product || { name: 'Unknown Product' },
                    quantity
                };
            });

        return sortedProducts;
    }

    renderBestSellingProducts() {
        const container = document.getElementById('bestSellingProducts');
        if (!container) return;

        const bestSelling = this.getBestSellingProducts();
        
        if (bestSelling.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No sales data available</p>';
            return;
        }

        container.innerHTML = bestSelling.map(item => `
            <div class="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <span class="font-medium">${item.product.name}</span>
                <span class="text-gray-600">${item.quantity} sold</span>
            </div>
        `).join('');
    }

    getRecentActivity(limit = 10) {
        const activities = [];

        // Add recent sales
        this.sales.slice(-limit).forEach(sale => {
            activities.push({
                type: 'sale',
                message: `Sale of ${ZovatuApp.formatCurrency(sale.total)}`,
                date: sale.date,
                icon: 'fas fa-shopping-cart',
                color: 'text-green-600'
            });
        });

        // Add recent product additions
        this.products.slice(-5).forEach(product => {
            activities.push({
                type: 'product',
                message: `Added product: ${product.name}`,
                date: product.createdAt || new Date().toISOString(),
                icon: 'fas fa-box',
                color: 'text-blue-600'
            });
        });

        // Sort by date and limit
        return activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const activities = this.getRecentActivity();
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No recent activity</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="flex items-center py-3 border-b border-gray-200 last:border-b-0">
                <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                    <i class="${activity.icon} ${activity.color}"></i>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-900">${activity.message}</p>
                    <p class="text-xs text-gray-500">${ZovatuApp.formatDate(activity.date, 'MMM DD, YYYY HH:mm')}</p>
                </div>
            </div>
        `).join('');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        window.dashboard = new Dashboard();
    }
});

// Export for use in other modules
window.Dashboard = Dashboard;

