# Zovatu Billing Tool

A comprehensive, modern, and responsive billing software built with HTML, CSS, and JavaScript. Perfect for small to medium businesses looking for a professional billing solution that works offline and can be deployed on GitHub Pages.

## 🚀 Features

### 📊 Dashboard Analytics
- Real-time business statistics with percentage changes
- Interactive charts (Sales Trend, Top Products, Revenue vs Profit)
- Quick actions for common tasks
- Recent activity monitoring
- Low stock alerts and due payment tracking

### 📦 Product Management
- Complete CRUD operations for products
- Automatic barcode generation (multiple formats)
- Webcam barcode scanning for quick product lookup
- Category management and filtering
- Stock tracking with low stock alerts
- Bulk import/export functionality
- Professional product catalog with images

### 🧾 Invoice Generation
- Multi-product invoice creation
- Real-time barcode scanning for quick product addition
- Multiple payment methods support
- Automatic calculations (subtotal, discount, tax, total)
- Professional receipt printing (A4, 80mm, 58mm formats)
- Invoice history and management
- Quick sale mode for fast transactions

### 👥 Customer Management
- Complete customer database
- Due tracking and payment history
- Customer statements generation
- Credit limit management
- Overdue detection and reminders
- Customer activity tracking

### 📈 Advanced Reporting
- Comprehensive business analytics
- Sales reports with date filtering
- Top products and customers analysis
- Financial summary with profit/loss calculations
- Inventory reports with stock analysis
- Interactive charts and visualizations
- Export capabilities (JSON, PDF, Excel)

### ⚙️ Admin Panel & Settings
- PIN-based admin authentication
- Comprehensive system configuration
- Business information management
- Print settings customization
- Security and session management
- Data backup and restore

### 💾 Backup & Restore
- Full system backup with selective options
- Scheduled automatic backups
- Data import/export functionality
- Backup history management
- Safe restore with merge/replace options

### 🛠️ Built-in Tools
- **Calculator**: Professional calculator with keyboard support
- **Number to Words**: Convert amounts to words (English/Bengali)
- **Auto Logout**: Configurable session timeout with warnings

### 📱 Modern Features
- **PWA Support**: Install as a mobile/desktop app
- **Responsive Design**: Works perfectly on all devices
- **Offline Capable**: Full functionality without internet
- **Touch Friendly**: Optimized for touch devices
- **Keyboard Shortcuts**: Power user features
- **Dark/Light Theme**: Professional appearance

## 🎯 Technology Stack

- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Charts**: Chart.js for data visualization
- **Barcode**: JSBarcode for barcode generation
- **Scanning**: QuaggaJS for barcode scanning
- **Storage**: LocalStorage for data persistence
- **PWA**: Service Worker for offline functionality

## 📋 Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser
- Camera access for barcode scanning (optional)
- Local storage enabled

## 🚀 Quick Start

### Option 1: GitHub Pages Deployment

1. **Fork this repository**
2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Scroll to Pages section
   - Select source: Deploy from a branch
   - Choose branch: main
   - Folder: / (root)
3. **Access your app**: `https://yourusername.github.io/repository-name`

### Option 2: Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/zovatu-billing-tool.git
   cd zovatu-billing-tool
   ```

2. **Serve locally**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**: `http://localhost:8000`

## 📖 User Guide

### Initial Setup

1. **Access the application** through your deployed URL
2. **Login** with default credentials (if implemented) or set up admin PIN
3. **Configure business settings**:
   - Go to Settings → Business Information
   - Enter your business details
   - Configure invoice settings and tax rates
   - Set up print preferences

### Adding Products

1. **Navigate to Products** page
2. **Click "Add Product"** button
3. **Fill in product details**:
   - Name, code, category
   - Purchase price (admin only) and selling price
   - Stock quantity and minimum stock level
   - Product image (optional)
4. **Generate barcode** automatically or manually
5. **Save** the product

### Creating Invoices

1. **Go to Invoices** page
2. **Click "New Invoice"**
3. **Select customer** or use walk-in customer
4. **Add products**:
   - Search by name/code
   - Scan barcode using camera
   - Adjust quantities as needed
5. **Apply discounts** and tax if applicable
6. **Process payment** and print receipt

### Managing Customers

1. **Navigate to Customers** page
2. **Add new customers** with contact details
3. **Track due amounts** and payment history
4. **Generate customer statements**
5. **Set credit limits** and payment terms

### Viewing Reports

1. **Access Reports** page
2. **Select date range** and filters
3. **View analytics**:
   - Sales trends and performance
   - Top selling products
   - Customer analysis
   - Financial summaries
4. **Export reports** in various formats

### Backup & Restore

1. **Go to Backup** page
2. **Create backups**:
   - Full system backup
   - Selective data backup
   - Schedule automatic backups
3. **Restore data** when needed
4. **Manage backup history**

## 🔧 Configuration

### Business Settings

Configure your business information in Settings:

```javascript
// Example business configuration
{
  "businessName": "Your Business Name",
  "address": "Business Address",
  "phone": "+1234567890",
  "email": "business@example.com",
  "taxNumber": "TAX123456",
  "currency": "USD",
  "taxRate": 10
}
```

### Print Settings

Customize receipt printing:

```javascript
// Print configuration
{
  "receiptWidth": "80mm",
  "showLogo": true,
  "showBusinessInfo": true,
  "showTaxInfo": true,
  "footerText": "Thank you for your business!"
}
```

### System Settings

Configure system behavior:

```javascript
// System configuration
{
  "autoLogout": true,
  "logoutTimeout": 30, // minutes
  "lowStockThreshold": 10,
  "autoBackup": true,
  "backupInterval": "daily"
}
```

## 🎨 Customization

### Themes

The application supports theme customization through CSS variables:

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #6b7280;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}
```

### Adding Custom Features

The modular architecture allows easy feature additions:

1. Create new JavaScript modules in `assets/js/`
2. Add corresponding HTML pages
3. Update navigation in `assets/js/main.js`
4. Follow existing patterns for consistency

## 📱 PWA Installation

### Desktop Installation

1. **Open the app** in Chrome/Edge
2. **Look for install icon** in address bar
3. **Click install** and follow prompts
4. **App will be added** to desktop/start menu

### Mobile Installation

1. **Open in mobile browser**
2. **Tap browser menu** (three dots)
3. **Select "Add to Home Screen"**
4. **App icon will appear** on home screen

## 🔒 Security Features

- **PIN-based admin access** for sensitive operations
- **Session management** with auto-logout
- **Data validation** and sanitization
- **Local storage encryption** (optional)
- **Access logging** for audit trails

## 🌐 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 70+ | ✅ Full |
| Firefox | 65+ | ✅ Full |
| Safari | 12+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| Mobile Safari | 12+ | ✅ Full |
| Chrome Mobile | 70+ | ✅ Full |

## 📊 Performance

- **Fast loading**: Optimized assets and lazy loading
- **Responsive**: Smooth performance on all devices
- **Offline capable**: Full functionality without internet
- **Memory efficient**: Optimized data structures
- **Battery friendly**: Minimal background processing

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Q: Barcode scanning not working?**
A: Ensure camera permissions are granted and use HTTPS/localhost.

**Q: Data not saving?**
A: Check if local storage is enabled in browser settings.

**Q: Print not working?**
A: Verify printer connection and browser print permissions.

**Q: App not installing as PWA?**
A: Ensure you're using HTTPS and browser supports PWA.

### Getting Help

- **Documentation**: Check this README and inline help
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support@zovatu.com

## 🎯 Roadmap

### Upcoming Features

- [ ] Multi-language support
- [ ] Advanced inventory management
- [ ] Supplier management
- [ ] Purchase order system
- [ ] Advanced reporting dashboard
- [ ] Cloud sync capabilities
- [ ] Mobile app versions
- [ ] API integrations

### Version History

- **v2.0.0** - Complete rewrite with modern features
- **v1.5.0** - Added PWA support and offline functionality
- **v1.0.0** - Initial release with basic billing features

## 🏆 Acknowledgments

- **Chart.js** for beautiful charts
- **Tailwind CSS** for utility-first styling
- **JSBarcode** for barcode generation
- **QuaggaJS** for barcode scanning
- **FileSaver.js** for file downloads

---

**Made with ❤️ by the Zovatu Team**

*Transform your business with professional billing software that works everywhere!*

