// Zovatu Billing Tool - Products JavaScript
// Handles product management, barcode generation, and scanning

class ProductManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredProducts = [];
        this.editingProduct = null;
        this.scanner = null;
        
        this.init();
    }

    init() {
        this.loadProducts();
        this.loadCategories();
        this.setupEventListeners();
        this.updateStatistics();
        this.renderProducts();
        this.populateCategoryFilter();
    }

    loadProducts() {
        this.products = DataManager.get('products') || [];
        this.filteredProducts = [...this.products];
    }

    loadCategories() {
        this.categories = [...new Set(this.products.map(p => p.category).filter(Boolean))];
    }

    saveProducts() {
        DataManager.set('products', this.products);
        this.loadCategories();
        this.updateStatistics();
        this.populateCategoryFilter();
    }

    setupEventListeners() {
        // Add Product Button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openProductModal();
        });

        // Scan Barcode Button
        document.getElementById('scanBarcodeBtn').addEventListener('click', () => {
            this.openScannerModal();
        });

        // Import/Export Buttons
        document.getElementById('importProductsBtn').addEventListener('click', () => {
            this.openImportModal();
        });

        document.getElementById('exportProductsBtn').addEventListener('click', () => {
            this.exportProducts();
        });

        // Product Form
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Generate Barcode Button
        document.getElementById('generateBarcodeBtn').addEventListener('click', () => {
            this.generateBarcode();
        });

        // Search and Filter
        document.getElementById('searchInput').addEventListener('input', 
            ZovatuApp.debounce(() => this.filterProducts(), 300)
        );

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('stockFilter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('sortBy').addEventListener('change', () => {
            this.sortProducts();
        });

        // Import functionality
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importProducts();
        });

        // Scanner result
        document.getElementById('useScanResultBtn').addEventListener('click', () => {
            this.useScanResult();
        });

        // Auto-generate product code when name changes
        document.getElementById('productName').addEventListener('input', () => {
            if (!document.getElementById('productCode').value) {
                this.generateProductCode();
            }
        });
    }

    openProductModal(product = null) {
        this.editingProduct = product;
        const modal = document.getElementById('productModal');
        const title = document.querySelector('#productModal .modal-title');
        
        if (product) {
            title.textContent = 'Edit Product';
            this.populateProductForm(product);
        } else {
            title.textContent = 'Add Product';
            this.clearProductForm();
        }
        
        modal.classList.add('show');
    }

    closeProductModal() {
        document.getElementById('productModal').classList.remove('show');
        this.editingProduct = null;
        this.clearProductForm();
    }

    populateProductForm(product) {
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productCode').value = product.code || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productUnit').value = product.unit || 'pcs';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productCost').value = product.cost || '';
        document.getElementById('productStock').value = product.stock || '';
        document.getElementById('productLowStock').value = product.lowStock || 10;
        document.getElementById('productExpiry').value = product.expiry || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productBarcode').value = product.barcode || '';
        
        if (product.barcode) {
            this.displayBarcode(product.barcode);
        }
    }

    clearProductForm() {
        document.getElementById('productForm').reset();
        document.getElementById('productLowStock').value = 10;
        document.getElementById('barcodePreview').innerHTML = '';
    }

    generateProductCode() {
        const name = document.getElementById('productName').value;
        if (name) {
            const code = name.substring(0, 3).toUpperCase() + 
                        Date.now().toString().slice(-4);
            document.getElementById('productCode').value = code;
        }
    }

    generateBarcode() {
        const code = document.getElementById('productCode').value || 
                    'PROD' + Date.now().toString().slice(-6);
        
        document.getElementById('productCode').value = code;
        document.getElementById('productBarcode').value = code;
        this.displayBarcode(code);
    }

    displayBarcode(code) {
        const preview = document.getElementById('barcodePreview');
        preview.innerHTML = `<canvas id="barcodeCanvas"></canvas>`;
        
        try {
            JsBarcode("#barcodeCanvas", code, {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 10
            });
        } catch (error) {
            preview.innerHTML = '<p class="text-red-500">Invalid barcode format</p>';
        }
    }

    saveProduct() {
        const formData = this.getFormData();
        
        if (!this.validateProductData(formData)) {
            return;
        }

        if (this.editingProduct) {
            // Update existing product
            const index = this.products.findIndex(p => p.id === this.editingProduct.id);
            if (index !== -1) {
                this.products[index] = { ...this.editingProduct, ...formData, updatedAt: new Date().toISOString() };
            }
            ZovatuApp.showNotification('Product updated successfully', 'success');
        } else {
            // Add new product
            const newProduct = {
                id: ZovatuApp.generateId(),
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.products.push(newProduct);
            ZovatuApp.showNotification('Product added successfully', 'success');
        }

        this.saveProducts();
        this.renderProducts();
        this.closeProductModal();
    }

    getFormData() {
        return {
            name: document.getElementById('productName').value.trim(),
            code: document.getElementById('productCode').value.trim() || this.generateUniqueCode(),
            category: document.getElementById('productCategory').value.trim(),
            unit: document.getElementById('productUnit').value,
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            cost: parseFloat(document.getElementById('productCost').value) || 0,
            stock: parseInt(document.getElementById('productStock').value) || 0,
            lowStock: parseInt(document.getElementById('productLowStock').value) || 10,
            expiry: document.getElementById('productExpiry').value || null,
            description: document.getElementById('productDescription').value.trim(),
            barcode: document.getElementById('productBarcode').value.trim(),
            image: null // Will be implemented later for image upload
        };
    }

    generateUniqueCode() {
        let code;
        do {
            code = 'PROD' + Date.now().toString().slice(-6);
        } while (this.products.some(p => p.code === code));
        return code;
    }

    validateProductData(data) {
        if (!data.name) {
            ZovatuApp.showNotification('Product name is required', 'danger');
            return false;
        }

        if (data.price <= 0) {
            ZovatuApp.showNotification('Price must be greater than 0', 'danger');
            return false;
        }

        // Check for duplicate code
        const existingProduct = this.products.find(p => 
            p.code === data.code && (!this.editingProduct || p.id !== this.editingProduct.id)
        );
        
        if (existingProduct) {
            ZovatuApp.showNotification('Product code already exists', 'danger');
            return false;
        }

        return true;
    }

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.renderProducts();
            ZovatuApp.showNotification('Product deleted successfully', 'success');
        }
    }

    updateStatistics() {
        const totalProducts = this.products.length;
        const totalValue = this.products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const lowStockCount = this.products.filter(p => p.stock <= p.lowStock).length;
        const expiredCount = this.products.filter(p => {
            if (!p.expiry) return false;
            return new Date(p.expiry) < new Date();
        }).length;

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalValue').textContent = ZovatuApp.formatCurrency(totalValue);
        document.getElementById('lowStockCount').textContent = lowStockCount;
        document.getElementById('expiredCount').textContent = expiredCount;
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categoryList = document.getElementById('categoryList');
        
        // Clear existing options
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categoryList.innerHTML = '';
        
        // Add categories
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
            
            const datalistOption = document.createElement('option');
            datalistOption.value = category;
            categoryList.appendChild(datalistOption);
        });
    }

    filterProducts() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm) ||
                product.code.toLowerCase().includes(searchTerm) ||
                (product.category && product.category.toLowerCase().includes(searchTerm));

            const matchesCategory = !categoryFilter || product.category === categoryFilter;

            let matchesStock = true;
            if (stockFilter === 'in-stock') {
                matchesStock = product.stock > product.lowStock;
            } else if (stockFilter === 'low-stock') {
                matchesStock = product.stock <= product.lowStock && product.stock > 0;
            } else if (stockFilter === 'out-of-stock') {
                matchesStock = product.stock === 0;
            }

            return matchesSearch && matchesCategory && matchesStock;
        });

        this.currentPage = 1;
        this.renderProducts();
    }

    sortProducts() {
        const sortBy = document.getElementById('sortBy').value;
        
        this.filteredProducts.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'code':
                    return a.code.localeCompare(b.code);
                case 'price':
                    return a.price - b.price;
                case 'stock':
                    return a.stock - b.stock;
                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return 0;
            }
        });

        this.renderProducts();
    }

    renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);

        if (pageProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500">
                        <i class="fas fa-box text-4xl mb-2"></i>
                        <p>No products found.</p>
                    </td>
                </tr>
            `;
            this.renderPagination();
            return;
        }

        tbody.innerHTML = pageProducts.map(product => `
            <tr>
                <td>
                    <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover rounded-lg">` :
                            `<i class="fas fa-box text-gray-400"></i>`
                        }
                    </div>
                </td>
                <td>
                    <div>
                        <p class="font-medium text-gray-900">${product.name}</p>
                        ${product.description ? `<p class="text-sm text-gray-500">${product.description.substring(0, 50)}...</p>` : ''}
                    </div>
                </td>
                <td>
                    <span class="font-mono text-sm">${product.code}</span>
                    ${product.barcode ? `<br><i class="fas fa-barcode text-gray-400" title="Has barcode"></i>` : ''}
                </td>
                <td>
                    ${product.category ? `<span class="badge badge-primary">${product.category}</span>` : '-'}
                </td>
                <td>
                    <span class="font-medium">${ZovatuApp.formatCurrency(product.price)}</span>
                    ${product.cost ? `<br><span class="text-xs text-gray-500">Cost: ${ZovatuApp.formatCurrency(product.cost)}</span>` : ''}
                </td>
                <td>
                    <span class="font-medium">${product.stock} ${product.unit}</span>
                </td>
                <td>
                    ${this.getStockStatusBadge(product)}
                    ${this.getExpiryStatusBadge(product)}
                </td>
                <td>
                    <div class="flex space-x-1">
                        <button onclick="productManager.editProduct('${product.id}')" class="btn btn-sm btn-secondary" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="productManager.printBarcode('${product.id}')" class="btn btn-sm btn-primary" title="Print Barcode">
                            <i class="fas fa-barcode"></i>
                        </button>
                        <button onclick="productManager.deleteProduct('${product.id}')" class="btn btn-sm btn-danger" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    getStockStatusBadge(product) {
        if (product.stock === 0) {
            return '<span class="badge badge-danger">Out of Stock</span>';
        } else if (product.stock <= product.lowStock) {
            return '<span class="badge badge-warning">Low Stock</span>';
        } else {
            return '<span class="badge badge-success">In Stock</span>';
        }
    }

    getExpiryStatusBadge(product) {
        if (!product.expiry) return '';
        
        const expiryDate = new Date(product.expiry);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
            return '<br><span class="badge badge-danger">Expired</span>';
        } else if (daysUntilExpiry <= 7) {
            return '<br><span class="badge badge-warning">Expires Soon</span>';
        }
        
        return '';
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="flex space-x-1">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="productManager.goToPage(${this.currentPage - 1})" class="btn btn-sm btn-secondary">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="btn btn-sm btn-primary">${i}</button>`;
            } else {
                paginationHTML += `<button onclick="productManager.goToPage(${i})" class="btn btn-sm btn-secondary">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button onclick="productManager.goToPage(${this.currentPage + 1})" class="btn btn-sm btn-secondary">Next</button>`;
        }
        
        paginationHTML += '</div>';
        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.openProductModal(product);
        }
    }

    printBarcode(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !product.barcode) {
            ZovatuApp.showNotification('Product has no barcode to print', 'warning');
            return;
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Barcode - ${product.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .barcode-container { text-align: center; margin: 20px 0; }
                    .product-info { margin-bottom: 10px; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            </head>
            <body>
                <div class="barcode-container">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>Code: ${product.code}</p>
                        <p>Price: ${ZovatuApp.formatCurrency(product.price)}</p>
                    </div>
                    <canvas id="barcode"></canvas>
                </div>
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
                <script>
                    JsBarcode("#barcode", "${product.barcode}", {
                        format: "CODE128",
                        width: 2,
                        height: 60,
                        displayValue: true,
                        fontSize: 14,
                        margin: 10
                    });
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    // Barcode Scanner Functions
    openScannerModal() {
        const modal = document.getElementById('scannerModal');
        modal.classList.add('show');
        this.startScanner();
    }

    closeScannerModal() {
        const modal = document.getElementById('scannerModal');
        modal.classList.remove('show');
        this.stopScanner();
        document.getElementById('scanResult').classList.add('hidden');
        document.getElementById('useScanResultBtn').classList.add('hidden');
    }

    startScanner() {
        if (typeof Quagga === 'undefined') {
            ZovatuApp.showNotification('Barcode scanner library not loaded', 'danger');
            return;
        }

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#scanner'),
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
            document.getElementById('scannedCode').textContent = code;
            document.getElementById('scanResult').classList.remove('hidden');
            document.getElementById('useScanResultBtn').classList.remove('hidden');
            this.scannedBarcode = code;
        });
    }

    stopScanner() {
        if (typeof Quagga !== 'undefined') {
            Quagga.stop();
        }
    }

    useScanResult() {
        if (this.scannedBarcode) {
            // Check if product with this barcode exists
            const existingProduct = this.products.find(p => p.barcode === this.scannedBarcode);
            
            if (existingProduct) {
                this.editProduct(existingProduct.id);
                ZovatuApp.showNotification('Product found and opened for editing', 'success');
            } else {
                this.openProductModal();
                document.getElementById('productBarcode').value = this.scannedBarcode;
                document.getElementById('productCode').value = this.scannedBarcode;
                this.displayBarcode(this.scannedBarcode);
                ZovatuApp.showNotification('Barcode added to new product form', 'success');
            }
            
            this.closeScannerModal();
        }
    }

    // Import/Export Functions
    openImportModal() {
        document.getElementById('importModal').classList.add('show');
    }

    closeImportModal() {
        document.getElementById('importModal').classList.remove('show');
        document.getElementById('importFile').value = '';
    }

    importProducts() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            ZovatuApp.showNotification('Please select a file to import', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedProducts = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedProducts)) {
                    throw new Error('Invalid file format');
                }

                let importedCount = 0;
                let skippedCount = 0;

                importedProducts.forEach(productData => {
                    // Validate required fields
                    if (!productData.name || !productData.price) {
                        skippedCount++;
                        return;
                    }

                    // Check for duplicate codes
                    const code = productData.code || this.generateUniqueCode();
                    if (this.products.some(p => p.code === code)) {
                        skippedCount++;
                        return;
                    }

                    // Create new product
                    const newProduct = {
                        id: ZovatuApp.generateId(),
                        name: productData.name,
                        code: code,
                        category: productData.category || '',
                        unit: productData.unit || 'pcs',
                        price: parseFloat(productData.price) || 0,
                        cost: parseFloat(productData.cost) || 0,
                        stock: parseInt(productData.stock) || 0,
                        lowStock: parseInt(productData.lowStock) || 10,
                        expiry: productData.expiry || null,
                        description: productData.description || '',
                        barcode: productData.barcode || code,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    this.products.push(newProduct);
                    importedCount++;
                });

                this.saveProducts();
                this.renderProducts();
                this.closeImportModal();

                ZovatuApp.showNotification(
                    `Import completed: ${importedCount} products imported, ${skippedCount} skipped`,
                    'success'
                );

            } catch (error) {
                ZovatuApp.showNotification('Invalid JSON file format', 'danger');
            }
        };

        reader.readAsText(file);
    }

    exportProducts() {
        if (this.products.length === 0) {
            ZovatuApp.showNotification('No products to export', 'warning');
            return;
        }

        const exportData = this.products.map(product => ({
            name: product.name,
            code: product.code,
            category: product.category,
            unit: product.unit,
            price: product.price,
            cost: product.cost,
            stock: product.stock,
            lowStock: product.lowStock,
            expiry: product.expiry,
            description: product.description,
            barcode: product.barcode
        }));

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const fileName = `products_export_${ZovatuApp.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        
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

        ZovatuApp.showNotification('Products exported successfully', 'success');
    }
}

// Global functions for modal controls
function closeProductModal() {
    if (window.productManager) {
        window.productManager.closeProductModal();
    }
}

function closeScannerModal() {
    if (window.productManager) {
        window.productManager.closeScannerModal();
    }
}

function closeImportModal() {
    if (window.productManager) {
        window.productManager.closeImportModal();
    }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('products.html')) {
        window.productManager = new ProductManager();
    }
});

// Export for use in other modules
window.ProductManager = ProductManager;

