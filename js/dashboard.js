// Dashboard Management

let dashboardData = {
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    lowStockProducts: [],
    recentActivities: [],
    salesData: []
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!auth.protectPage()) return;
    
    loadDashboardData();
    setupRoleBasedAccess();
    displayDashboard();
});

// Setup role-based access
function setupRoleBasedAccess() {
    const user = auth.getCurrentUser();
    if (!user) return;
    
    // Hide admin-only sections for salesman
    if (user.role === 'salesman') {
        const lowStockAlert = document.getElementById('lowStockAlert');
        if (lowStockAlert) {
            lowStockAlert.style.display = 'none';
        }
    } else {
        // Show low stock alert for admin
        const lowStockAlert = document.getElementById('lowStockAlert');
        if (lowStockAlert) {
            lowStockAlert.style.display = 'block';
        }
    }
}

// Load dashboard data
function loadDashboardData() {
    const products = utils.getFromStorage('products', []);
    const customers = utils.getFromStorage('customers', []);
    const invoices = utils.getFromStorage('invoices', []);
    
    // Calculate totals
    dashboardData.totalProducts = products.length;
    dashboardData.totalCustomers = customers.length;
    dashboardData.totalInvoices = invoices.length;
    dashboardData.totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    
    // Get low stock products
    dashboardData.lowStockProducts = products.filter(p => p.stock <= 10 && p.stock > 0);
    
    // Get recent activities
    dashboardData.recentActivities = getRecentActivities(invoices, products, customers);
    
    // Prepare sales data for chart
    dashboardData.salesData = prepareSalesChartData(invoices);
}

// Get recent activities
function getRecentActivities(invoices, products, customers) {
    const activities = [];
    
    // Recent invoices
    const recentInvoices = invoices.slice(-5).reverse();
    recentInvoices.forEach(invoice => {
        activities.push({
            type: 'sale',
            icon: 'fas fa-shopping-cart',
            title: `Invoice ${invoice.invoiceNumber} created`,
            description: `${invoice.customerName} - ${utils.formatCurrency(invoice.grandTotal)}`,
            time: invoice.createdAt,
            color: '#28a745'
        });
    });
    
    // Recent products (last 3)
    const recentProducts = products.slice(-3).reverse();
    recentProducts.forEach(product => {
        activities.push({
            type: 'product',
            icon: 'fas fa-box',
            title: `Product "${product.name}" added`,
            description: `Code: ${product.code} - ${utils.formatCurrency(product.price)}`,
            time: product.createdAt,
            color: '#007bff'
        });
    });
    
    // Recent customers (last 2)
    const recentCustomers = customers.slice(-2).reverse();
    recentCustomers.forEach(customer => {
        activities.push({
            type: 'customer',
            icon: 'fas fa-user-plus',
            title: `Customer "${customer.name}" added`,
            description: `Phone: ${customer.phone}`,
            time: customer.createdAt,
            color: '#6f42c1'
        });
    });
    
    // Sort by time and return top 10
    return activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10);
}

// Prepare sales chart data
function prepareSalesChartData(invoices) {
    const last7Days = [];
    const today = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayInvoices = invoices.filter(inv => inv.date === dateString);
        const dayTotal = dayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        
        last7Days.push({
            date: dateString,
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: dayTotal,
            count: dayInvoices.length
        });
    }
    
    return last7Days;
}

// Display dashboard
function displayDashboard() {
    displayStatsCards();
    displaySalesChart();
    displayRecentActivities();
    displayLowStockAlert();
}

// Display stats cards
function displayStatsCards() {
    const statsContainer = document.getElementById('statsCards');
    if (!statsContainer) return;
    
    const user = auth.getCurrentUser();
    const cards = [
        {
            title: 'Total Sales',
            value: utils.formatCurrency(dashboardData.totalSales),
            icon: 'fas fa-dollar-sign',
            color: '#28a745',
            change: '+12%'
        },
        {
            title: 'Total Invoices',
            value: dashboardData.totalInvoices.toString(),
            icon: 'fas fa-file-invoice',
            color: '#007bff',
            change: '+8%'
        },
        {
            title: 'Products',
            value: dashboardData.totalProducts.toString(),
            icon: 'fas fa-box',
            color: '#6f42c1',
            change: '+5%'
        },
        {
            title: 'Customers',
            value: dashboardData.totalCustomers.toString(),
            icon: 'fas fa-users',
            color: '#fd7e14',
            change: '+15%'
        }
    ];
    
    // Hide customer card for salesman if needed
    const cardsToShow = user.role === 'salesman' ? cards : cards;
    
    statsContainer.innerHTML = cardsToShow.map(card => `
        <div class="card" style="background: linear-gradient(135deg, ${card.color}15, ${card.color}05); border-left: 4px solid ${card.color};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; color: ${card.color}; font-size: 2rem;">${card.value}</h3>
                    <p style="margin: 5px 0; color: #666; font-weight: bold;">${card.title}</p>
                    <small style="color: #28a745; font-weight: bold;">${card.change} from last month</small>
                </div>
                <div style="font-size: 3rem; color: ${card.color}; opacity: 0.3;">
                    <i class="${card.icon}"></i>
                </div>
            </div>
        </div>
    `).join('');
}

// Display sales chart
function displaySalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    const chartData = dashboardData.salesData;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                label: 'Sales Amount',
                data: chartData.map(d => d.sales),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#007bff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
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
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

// Display recent activities
function displayRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    if (dashboardData.recentActivities.length === 0) {
        container.innerHTML = '<p class="no-data">No recent activities</p>';
        return;
    }
    
    container.innerHTML = dashboardData.recentActivities.map(activity => `
        <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${activity.color}15; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                <i class="${activity.icon}" style="color: ${activity.color};"></i>
            </div>
            <div style="flex-grow: 1;">
                <h4 style="margin: 0; font-size: 0.9rem; color: #333;">${activity.title}</h4>
                <p style="margin: 2px 0; font-size: 0.8rem; color: #666;">${activity.description}</p>
                <small style="color: #999;">${utils.formatDateTime(activity.time)}</small>
            </div>
        </div>
    `).join('');
}

// Display low stock alert
function displayLowStockAlert() {
    const container = document.getElementById('lowStockItems');
    if (!container) return;
    
    const user = auth.getCurrentUser();
    if (user.role !== 'admin') return;
    
    if (dashboardData.lowStockProducts.length === 0) {
        container.innerHTML = '<p style="color: #28a745;"><i class="fas fa-check-circle"></i> All products are well stocked</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 15px;">
            <p style="margin: 0; color: #856404;"><strong>Warning:</strong> ${dashboardData.lowStockProducts.length} product(s) are running low on stock.</p>
        </div>
        <div style="max-height: 200px; overflow-y: auto;">
            ${dashboardData.lowStockProducts.map(product => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${product.name}</strong> (${product.code})<br>
                        <small style="color: #666;">Current stock: ${product.stock} ${product.unit || 'pcs'}</small>
                    </div>
                    <button onclick="window.location.href='products.html'" class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fas fa-plus"></i> Restock
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Refresh dashboard data
function refreshDashboard() {
    loadDashboardData();
    displayDashboard();
    utils.showNotification('Dashboard refreshed', 'success');
}

// Auto-refresh dashboard every 5 minutes
setInterval(() => {
    loadDashboardData();
    displayDashboard();
}, 5 * 60 * 1000);

// Export dashboard functions
window.dashboardModule = {
    refreshDashboard,
    dashboardData: () => dashboardData
};

