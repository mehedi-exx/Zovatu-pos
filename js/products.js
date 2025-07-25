// Products Management

let products = [];
let editingProductId = null;

// Initialize products page
document.addEventListener('DOMContentLoaded', function() {
    if (!auth.protectPage()) return;
    
    loadProducts();
    loadCategories();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Product form submission
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    
    // Auto-generate product code
    document.getElementById('productCode').addEventListener('focus', function() {
        if (!this.value) {
            this.value = utils.generateProductCode();
        }
    });
    
    // Auto-generate barcode value and type
    document.getElementById("productCode").addEventListener("input", function() {
        const productCode = this.value;
        const barcodeValueInput = document.getElementById("barcodeValue");
        const barcodeTypeSelect = document.getElementById("barcodeType");

        if (productCode && !barcodeValueInput.value) {
            barcodeValueInput.value = productCode;
        }
        // Ensure a default barcode type is selected if none is
        if (!barcodeTypeSelect.value) {
            barcodeTypeSelect.value = "CODE128";
        }
        generateBarcode();
    });

    // Generate barcode on barcodeType change
    document.getElementById("barcodeType").addEventListener("change", generateBarcode);

    // Generate barcode on barcodeValue input
    document.getElementById("barcodeValue").addEventListener("input", generateBarcode);
}

// Load products from storage
function loadProducts() {
    products = utils.getFromStorage('products', []);
    displayProducts();
}

// Display products in table
function displayProducts(productsToShow = products) {
    const tbody = document.getElementById('productsTableBody');
    
    if (productsToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No products found</td></tr>';
        return;
    }
    
    tbody.innerHTML = productsToShow.map(product => `
        <tr>
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${product.category || 'N/A'}</td>
            <td>${utils.formatCurrency(product.price)}</td>
            <td>
                <span class="stock-badge ${getStockClass(product.stock)}">
                    ${product.stock} ${product.unit || 'pcs'}
                </span>
            </td>
            <td>
                ${product.barcode ? `
                    <button onclick="showBarcodeModal('${product.id}')" class="btn-secondary" style="padding: 5px 10px;">
                        <i class="fas fa-barcode"></i> View
                    </button>
                ` : 'N/A'}
            </td>
            <td class="actions">
                ${user.role === 'admin' ? `
                    <button onclick="editProduct('${product.id}')" class="btn-primary" style="padding: 5px 10px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct('${product.id}')" class="btn-danger" style="padding: 5px 10px;">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : `
                    <button class="btn-primary" style="padding: 5px 10px;" disabled title="Only admin can edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" style="padding: 5px 10px;" disabled title="Only admin can delete">
                        <i class="fas fa-trash"></i>
                    </button>
                `}
            </td>
        </tr>
    `).join('');
    
    // Add stock badge styles if not already added
    if (!document.getElementById('stockBadgeStyles')) {
        const styles = document.createElement('style');
        styles.id = 'stockBadgeStyles';
        styles.textContent = `
            .stock-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            .stock-in { background-color: #d4edda; color: #155724; }
            .stock-low { background-color: #fff3cd; color: #856404; }
            .stock-out { background-color: #f8d7da; color: #721c24; }
        `;
        document.head.appendChild(styles);
    }
}

// Get stock class for styling
function getStockClass(stock) {
    if (stock <= 0) return 'stock-out';
    if (stock <= 10) return 'stock-low';
    return 'stock-in';
}

// Load categories for filter
function loadCategories() {
    const categories = [...new Set(products.map(p => p.category).filter(c => c))];
    const categoryFilter = document.getElementById('categoryFilter');
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Search products
function searchProducts() {
    const searchTerm = document.getElementById('searchProducts').value;
    const filteredProducts = utils.performSearch(searchTerm, products, ['code', 'name', 'category']);
    displayProducts(filteredProducts);
}

// Filter products
function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
    
    let filteredProducts = products;
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
    }
    
    if (stockFilter) {
        switch (stockFilter) {
            case 'in-stock':
                filteredProducts = filteredProducts.filter(p => p.stock > 10);
                break;
            case 'low-stock':
                filteredProducts = filteredProducts.filter(p => p.stock > 0 && p.stock <= 10);
                break;
            case 'out-of-stock':
                filteredProducts = filteredProducts.filter(p => p.stock <= 0);
                break;
        }
    }
    
    displayProducts(filteredProducts);
}

// Show add product modal
function showAddProductModal() {
    const user = auth.getCurrentUser();
    if (user.role === 'salesman') {
        utils.showNotification('Salesmen are not allowed to add products.', 'error');
        return;
    }

    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productCode').value = utils.generateProductCode();
    document.getElementById('barcodeValue').value = '';
    document.getElementById('barcode').innerHTML = '';
    utils.showModal('productModal');
}

// Hide product modal
function hideProductModal() {
    utils.hideModal('productModal');
    editingProductId = null;
}

// Handle product form submission
function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = {
        code: document.getElementById('productCode').value,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value) || 0,
        unit: document.getElementById('productUnit').value || 'pcs',
        description: document.getElementById('productDescription').value,
        barcodeType: document.getElementById('barcodeType').value,
        barcodeValue: document.getElementById('barcodeValue').value
    };
    
    // Validation
    if (!formData.code || !formData.name || !formData.price) {
        utils.showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Check for duplicate product code
    const existingProduct = products.find(p => p.code === formData.code && p.id !== editingProductId);
    if (existingProduct) {
        utils.showNotification('Product code already exists', 'error');
        return;
    }
    
    if (editingProductId) {
        // Update existing product
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            products[index] = { ...products[index], ...formData, updatedAt: new Date().toISOString() };
            utils.showNotification('Product updated successfully', 'success');
        }
    } else {
        // Add new product
        const newProduct = {
            id: utils.generateId('prod_'),
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        products.push(newProduct);
        utils.showNotification('Product added successfully', 'success');
    }
    
    // Save to storage
    utils.saveToStorage('products', products);
    
    // Refresh display
    loadProducts();
    loadCategories();
    hideProductModal();
}

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    
    // Fill form with product data
    document.getElementById('productCode').value = product.code;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productUnit').value = product.unit || 'pcs';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('barcodeType').value = product.barcodeType || 'CODE128';
    document.getElementById('barcodeValue').value = product.barcodeValue || '';
    
    // Generate barcode preview
    generateBarcode();
    
    utils.showModal('productModal');
}

// Delete product
function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    utils.confirmDialog(`Are you sure you want to delete "${product.name}"?`, () => {
        products = products.filter(p => p.id !== productId);
        utils.saveToStorage('products', products);
        loadProducts();
        loadCategories();
        utils.showNotification('Product deleted successfully', 'success');
    });
}

// Generate barcode
function generateBarcode() {
    const barcodeValue = document.getElementById('barcodeValue').value;
    const barcodeType = document.getElementById('barcodeType').value;
    const barcodeElement = document.getElementById('barcode');
    
    if (!barcodeValue) {
        barcodeElement.innerHTML = '<p style="color: #666; text-align: center;">Enter barcode value to preview</p>';
        return;
    }
    
    try {
        // Clear previous barcode
        barcodeElement.innerHTML = '';
        
        // Generate new barcode
        JsBarcode(barcodeElement, barcodeValue, {
            format: barcodeType,
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 14,
            margin: 10
        });
    } catch (error) {
        barcodeElement.innerHTML = '<p style="color: #dc3545; text-align: center;">Invalid barcode value for selected type</p>'// Show barcode modal
function showBarcodeModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.barcodeValue) return;
    
    document.getElementById("barcodePrintModal").dataset.productId = productId; // Store product ID

    const printBarcodePreview = document.getElementById("printBarcodePreview");
    printBarcodePreview.innerHTML = `
        <h4>${product.name}</h4>
        <svg id="printBarcode"></svg>
        <p><strong>Code:</strong> ${product.code}</p>
        <p><strong>Price:</strong> ${utils.formatCurrency(product.price)}</p>
    `;
    
    try {
        JsBarcode("#printBarcode", product.barcodeValue, {
            format: product.barcodeType || "CODE128",
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 14,
            margin: 10
        });
    } catch (error) {
        printBarcodePreview.innerHTML = 
            `<p style="color: #dc3545;">Error generating barcode</p>`;
    }
    
    utils.showModal("barcodePrintModal");
}// Hide barcode modal
function hideBarcodeModal() {
    utils.hideModal('barcodePr// Print barcode
function printBarcode() {
    const quantity = parseInt(document.getElementById("printQuantity").value) || 1;
    const barcodePrintWidth = parseInt(document.getElementById("barcodePrintWidth").value) || 2;
    const barcodePrintHeight = parseInt(document.getElementById("barcodePrintHeight").value) || 100;

    const product = products.find(p => p.id === document.getElementById("barcodePrintModal").dataset.productId);
    if (!product || !product.barcodeValue) return;

    let content = 
        `<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">`;
    for (let i = 0; i < quantity; i++) {
        // Create a temporary div to render the barcode for printing
        const tempDiv = document.createElement("div");
        tempDiv.style.border = "1px solid #ddd";
        tempDiv.style.padding = "10px";
        tempDiv.style.textAlign = "center";
        tempDiv.innerHTML = `
            <h4>${product.name}</h4>
            <svg id="tempBarcode${i}"></svg>
            <p><strong>Code:</strong> ${product.code}</p>
            <p><strong>Price:</strong> ${utils.formatCurrency(product.price)}</p>
        `;
        document.body.appendChild(tempDiv); // Append to body to render SVG

        try {
            JsBarcode(`#tempBarcode${i}`, product.barcodeValue, {
                format: product.barcodeType || "CODE128",
                width: barcodePrintWidth,
                height: barcodePrintHeight,
                displayValue: true,
                fontSize: 14,
                margin: 10
            });
        } catch (error) {
            tempDiv.innerHTML = 
                `<p style="color: #dc3545;">Error generating barcode for print</p>`;
        }
        content += tempDiv.outerHTML;
        tempDiv.remove(); // Remove temporary div
    }
    content += `</div>`;

    utils.printContent(content, "Barcode Print");
}port products
function exportProducts() {
    if (products.length === 0) {
        utils.showNotification('No products to export', 'warning');
        return;
    }
    
    const exportData = products.map(product => ({
        'Product Code': product.code,
        'Name': product.name,
        'Category': product.category || '',
        'Price': product.price,
        'Stock': product.stock,
        'Unit': product.unit || 'pcs',
        'Description': product.description || '',
        'Barcode Type': product.barcodeType || '',
        'Barcode Value': product.barcodeValue || '',
        'Created Date': utils.formatDate(product.createdAt)
    }));
    
    utils.exportToCSV(exportData, `products-${new Date().toISOString().split('T')[0]}.csv`);
}

// Get product by code (for sales)
function getProductByCode(code) {
    return products.find(p => p.code === code || p.barcodeValue === code);
}

// Update product stock
function updateProductStock(productId, quantity, operation = 'subtract') {
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    
    if (operation === 'subtract') {
        if (product.stock < quantity) {
            return false; // Insufficient stock
        }
        product.stock -= quantity;
    } else if (operation === 'add') {
        product.stock += quantity;
    }
    
    product.updatedAt = new Date().toISOString();
    utils.saveToStorage('products', products);
    return true;
}

// Get low stock products
function getLowStockProducts(threshold = 10) {
    return products.filter(p => p.stock <= threshold && p.stock > 0);
}

// Get out of stock products
function getOutOfStockProducts() {
    return products.filter(p => p.stock <= 0);
}

// Export functions for use in other modules
window.productsModule = {
    getProductByCode,
    updateProductStock,
    getLowStockProducts,
    getOutOfStockProducts,
    products: () => products
};

