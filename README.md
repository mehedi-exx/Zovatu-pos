# Professional Billing Software

A comprehensive, multi-user billing software designed to run on localhost with advanced features including role-based access control, barcode scanning, flexible printing, and complete business management capabilities.

## 🚀 Features

### 👥 **Multi-User System**
- **Admin Role**: Full access to all features including user management, settings, reports
- **Salesman Role**: Limited access to product management and sales operations
- Secure login with role-based access control

### 📦 **Product Management**
- Add, edit, and delete products
- Automatic barcode generation with multiple format support (CODE128, CODE39, EAN13, etc.)
- Stock management with low stock alerts
- Category-based organization
- Product search and filtering

### 🛒 **Sales & Invoicing**
- Create professional invoices with multiple products
- Product search with barcode scanning support
- Per-item and overall discount options
- Tax calculations
- Walk-in customer support
- Scanner-based quick billing

### 👤 **Customer Management**
- Complete customer database
- Purchase history tracking
- Customer types (Regular, Wholesale, Retail)
- Contact information management

### 📊 **Dashboard & Analytics**
- Real-time sales overview
- Key performance metrics
- Recent activities tracking
- Low stock alerts
- Interactive charts and graphs

### 🖨️ **Flexible Printing**
- Multiple print formats (A4, A5, Receipt)
- Professional invoice templates
- Customizable shop information
- Print-ready layouts

### ⚙️ **Settings & Configuration**
- Shop information setup
- User management
- General application settings
- Currency and date format options
- Automatic daily backup

### 💾 **Data Management**
- Local storage-based data persistence
- Automatic daily backups
- Manual backup and restore
- Data export capabilities

## 🛠️ Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (Python, Node.js, or any HTTP server)

### Quick Start

1. **Download the software**
   ```bash
   # Extract the billing-software-localhost folder to your desired location
   ```

2. **Start a local web server**
   
   **Option A: Using Python (Recommended)**
   ```bash
   cd billing-software-localhost
   python3 -m http.server 8080
   ```
   
   **Option B: Using Node.js**
   ```bash
   cd billing-software-localhost
   npx http-server -p 8080
   ```
   
   **Option C: Using PHP**
   ```bash
   cd billing-software-localhost
   php -S localhost:8080
   ```

3. **Access the application**
   - Open your web browser
   - Navigate to `http://localhost:8080`

4. **First-time login**
   - **Username**: `admin`
   - **Password**: `admin123`
   - **Role**: Admin

## 📖 User Guide

### Initial Setup

1. **Login as Admin**
   - Use the default admin credentials
   - Select "Admin" role from the dropdown

2. **Configure Shop Information**
   - Go to Settings → Shop Information
   - Fill in your business details (name, address, phone, email)
   - Save the configuration

3. **Add Products**
   - Navigate to Products
   - Click "Add Product"
   - Fill in product details
   - Generate barcode automatically or enter custom
   - Save the product

4. **Add Customers** (Optional)
   - Go to Customers
   - Add customer information
   - Set customer type (Regular/Wholesale/Retail)

### Creating Invoices

1. **Standard Invoice Creation**
   - Go to Sales → Create Invoice
   - Select customer (or leave blank for walk-in)
   - Search and add products
   - Apply discounts if needed
   - Save and print invoice

2. **Scanner-Based Billing**
   - Go to Sales → Scanner Billing
   - Scan product barcodes or enter codes manually
   - Adjust quantities as needed
   - Complete sale and print receipt

### User Management

1. **Adding New Users**
   - Go to Settings → User Management
   - Click "Add User"
   - Set username, password, and role
   - Save user

2. **Role Permissions**
   - **Admin**: Full access to all features
   - **Salesman**: Limited to products and sales only

### Data Backup

1. **Automatic Backup**
   - Enabled by default
   - Runs daily at 2 AM
   - Stored in browser's local storage

2. **Manual Backup**
   - Go to Settings → Backup & Restore
   - Click "Download Backup"
   - Save the JSON file securely

3. **Restore Data**
   - Go to Settings → Backup & Restore
   - Select backup file
   - Confirm restoration (will replace current data)

## 🔧 Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser Local Storage
- **Charts**: Chart.js library
- **Barcodes**: JsBarcode library
- **Icons**: Font Awesome

### File Structure
```
billing-software-localhost/
├── index.html              # Login page
├── dashboard.html           # Main dashboard
├── products.html           # Product management
├── customers.html          # Customer management
├── sales.html              # Sales and invoicing
├── purchase.html           # Purchase management
├── settings.html           # Settings and configuration
├── css/
│   └── style.css           # Main stylesheet
├── js/
│   ├── auth.js             # Authentication system
│   ├── utils.js            # Utility functions
│   ├── products.js         # Product management
│   ├── customers.js        # Customer management
│   ├── sales.js            # Sales and invoicing
│   ├── dashboard.js        # Dashboard functionality
│   └── settings.js         # Settings management
└── README.md               # This file
```

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Data Storage
- All data is stored in browser's Local Storage
- Maximum storage: ~5-10MB (varies by browser)
- Data persists until manually cleared

## 🔒 Security Notes

- This is a client-side application suitable for single-user or trusted environment use
- For production use with multiple users, consider implementing server-side authentication
- Regular backups are recommended to prevent data loss
- User passwords are stored with basic hashing (not suitable for sensitive environments)

## 🐛 Troubleshooting

### Common Issues

1. **Application won't load**
   - Ensure you're running a local web server
   - Check browser console for errors
   - Try a different browser

2. **Data not saving**
   - Check if Local Storage is enabled
   - Clear browser cache and try again
   - Ensure sufficient storage space

3. **Barcode not generating**
   - Check internet connection (CDN dependency)
   - Verify product code format
   - Try different barcode type

4. **Print not working**
   - Enable pop-ups for the domain
   - Check browser print settings
   - Try different print format

### Browser Storage Limits
- If you encounter storage limits, export data and clear old records
- Consider using the backup feature regularly

## 📞 Support

For technical support or feature requests:
- Check the troubleshooting section above
- Review browser console for error messages
- Ensure all files are properly uploaded to your web server

## 📄 License

This software is provided as-is for educational and business use. Feel free to modify and distribute according to your needs.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Multi-user authentication system
- Complete product management
- Sales and invoicing
- Customer management
- Dashboard with analytics
- Settings and configuration
- Backup and restore functionality
- Scanner-based billing
- Flexible printing options

---

**Billing Pro** - Professional billing software for modern businesses.

