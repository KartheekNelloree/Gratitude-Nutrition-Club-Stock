// Stub to prevent ReferenceError for renderPurchaseForm
function renderPurchaseForm() {
    // Render purchase items from products in stock
    const container = document.getElementById('purchase-items-container');
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<div class="text-muted">No products available for purchase.</div>';
        return;
    }
    // Default: one purchase item row
    if (purchaseItems.length === 0) {
        purchaseItems = [{ id: Date.now(), productId: '', quantity: 1, price: 0 }];
    }
    container.innerHTML = purchaseItems.map((item, index) => {
        return `
        <div class="row mb-3 align-items-center gx-2" data-item-id="${item.id}">
            <div class="col-lg-5 col-md-6 col-12">
                <label class="form-label fw-bold">Product</label>
                <select class="form-select" onchange="updatePurchaseItem(${index}, 'productId', this.value)" required>
                    <option value="">Select Product</option>
                    ${products.map(product => `<option value="${product.id}" ${item.productId === product.id ? 'selected' : ''}>${product.name} (Stock: ${product.stock})</option>`).join('')}
                </select>
            </div>
            <div class="col-lg-2 col-md-2 col-6">
                <label class="form-label fw-bold">Quantity</label>
                <input type="number" class="form-control" min="1" value="${item.quantity}" onchange="updatePurchaseItem(${index}, 'quantity', parseInt(this.value) || 1)">
            </div>
            <div class="col-lg-3 col-md-2 col-6">
                <label class="form-label fw-bold">Price</label>
                <input type="number" class="form-control" min="0" step="0.01" value="${item.price}" onchange="updatePurchaseItem(${index}, 'price', parseFloat(this.value) || 0)">
            </div>
            <div class="col-lg-2 col-md-2 col-12">
                <label class="form-label fw-bold">Total</label>
                <div class="form-control bg-light fw-bold text-success" style="text-align:right;">Rs. ${(item.quantity * item.price).toFixed(2)}</div>
            </div>
        </div>
        `;
    }).join('');

// Update purchase item fields
function updatePurchaseItem(index, field, value) {
    if (!purchaseItems[index]) return;
    purchaseItems[index][field] = value;
    renderPurchaseForm();
    updatePurchaseSummary();
}

// Update purchase summary
function updatePurchaseSummary() {
    const subtotal = purchaseItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        document.getElementById('purchase-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
    document.getElementById('purchase-total').textContent = `Rs. ${subtotal.toFixed(2)}`;
    // Enable purchase button only if all items are valid
    const button = document.getElementById('complete-purchase-btn');
    const valid = purchaseItems.every(item => item.productId && item.quantity > 0 && item.price > 0);
    button.disabled = !valid;
}
}
// Herbalife Inventory Management System - JavaScript

// Global variables
let products = [];
let customers = [];
let sales = [];
let purchases = [];
let currentEditingProduct = null;
let currentEditingCustomer = null;
let saleItems = [];
let purchaseItems = [];

// Update: Use billing name in messages and PDF
const BILLING_NAME = 'Gratitude Nutrition Club';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeSampleData();
    showSection('dashboard');
    updateLastUpdated();
    
    // Set up navigation
    setupNavigation();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadData();
});

// Initialize the application
function initializeApp() {
    console.log('Herbalife Inventory Management System - Initializing...');
    
    // Load data from localStorage
    products = getFromStorage('herbalife_products', []);
    // Migrate any products with global/shared priceTiers to per-product priceTiers
    products.forEach(product => {
        // If product has prices, do nothing
        if (product.prices) return;
        // If product has priceTiers, migrate to prices
        if (product.priceTiers) {
            product.prices = { ...product.priceTiers };
            delete product.priceTiers;
        }
        // If neither, initialize prices from MRP
        if (!product.prices) {
            product.prices = {
                '25': product.mrp ? product.mrp * 0.75 : 0,
                '35': product.mrp ? product.mrp * 0.65 : 0,
                '42': product.mrp ? product.mrp * 0.58 : 0,
                '50': product.mrp ? product.mrp * 0.50 : 0
            };
        }
    });
    saveToStorage('herbalife_products', products);
    customers = getFromStorage('herbalife_customers', []);
    sales = getFromStorage('herbalife_sales', []);
    purchases = getFromStorage('herbalife_purchases', []);
    
    console.log(`Loaded: ${products.length} products, ${customers.length} customers, ${sales.length} sales, ${purchases.length} purchases`);
}

// Storage utilities
function getFromStorage(key, defaultValue) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return defaultValue;
    }
}

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to storage:', error);
        showAlert('Error saving data. Please try again.', 'danger');
    }
}

// Initialize sample data if empty
function initializeSampleData() {
    if (products.length === 0) {
        const sampleProducts = [
            {
                id: generateId(),
                name: 'Formula 1 Vanilla',
                category: 'Nutrition',
                price: 45.95,
                cost: 25.00,
                stock: 25,
                minStock: 5,
                description: 'Healthy meal replacement shake - Vanilla flavor',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Formula 1 Chocolate',
                category: 'Nutrition',
                price: 45.95,
                cost: 25.00,
                stock: 18,
                minStock: 5,
                description: 'Healthy meal replacement shake - Chocolate flavor',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Tea Concentrate',
                category: 'Energy',
                price: 32.95,
                cost: 18.00,
                stock: 12,
                minStock: 3,
                description: 'Herbal tea concentrate for energy and focus',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Aloe Concentrate',
                category: 'Digestive Health',
                price: 28.95,
                cost: 16.00,
                stock: 8,
                minStock: 5,
                description: 'Soothing aloe vera concentrate',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Multivitamin',
                category: 'Nutrition',
                price: 35.95,
                cost: 20.00,
                stock: 2,
                minStock: 5,
                description: 'Complete daily multivitamin supplement',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        products = sampleProducts;
        saveToStorage('herbalife_products', products);
    }

    if (customers.length === 0) {
        const sampleCustomers = [
            {
                id: generateId(),
                name: 'Sarah Johnson',
                email: 'sarah.johnson@email.com',
                phone: '+1 (555) 123-4567',
                address: '123 Oak Street, Austin, TX 78701',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Michael Brown',
                email: 'michael.brown@email.com',
                phone: '+1 (555) 234-5678',
                address: '456 Pine Avenue, Dallas, TX 75201',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Emily Davis',
                email: 'emily.davis@email.com',
                phone: '+1 (555) 345-6789',
                address: '789 Elm Boulevard, Houston, TX 77001',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        customers = sampleCustomers;
        saveToStorage('herbalife_customers', customers);
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Setup navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
            
            // Update active nav button
            navButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    // Show selected section
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        selectedSection.classList.add('fade-in');
    }
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'products':
            renderProducts();
            break;
        case 'customers':
            renderCustomers();
            break;
        case 'sales':
            renderSalesForm();
            break;
        case 'purchases':
            renderPurchaseForm();
            break;
        case 'reports':
            renderReports();
            break;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Product form
    document.getElementById('add-product-btn').addEventListener('click', openProductModal);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Customer form
    document.getElementById('add-customer-btn').addEventListener('click', openCustomerModal);
    document.getElementById('customer-form').addEventListener('submit', handleCustomerSubmit);
    
    // Sales form
    document.getElementById('sales-form').addEventListener('submit', handleSaleSubmit);
    
    // Purchase form
    document.getElementById('purchase-form').addEventListener('submit', handlePurchaseSubmit);
    
    // Search functionality
    document.getElementById('product-search').addEventListener('input', filterProducts);
    document.getElementById('customer-search').addEventListener('input', filterCustomers);
    
    // Report filters
    document.querySelectorAll('input[name="report-filter"]').forEach(radio => {
        radio.addEventListener('change', renderReports);
    });
    
    // Send SMS button
    document.getElementById('send-sms-btn').addEventListener('click', function() {
        const customerSelect = document.getElementById('sale-customer');
        const customerId = customerSelect.value;
        if (!customerId) {
            showAlert('Please select a customer to send the SMS.', 'danger');
            return;
        }
        const customer = customers.find(c => c.id === customerId);
        if (!customer || !customer.phone) {
            showAlert('Customer phone number not found.', 'danger');
            return;
        }
        let billText = `${BILLING_NAME} Invoice\n\nDear ${customer.name},\nThank you for choosing us!\n\nOrder Details:\n`;
        saleItems.forEach(item => {
            if (item.productId) {
                const product = products.find(p => p.id === item.productId);
                billText += `${product.name} x${item.quantity} - ₹${item.total.toFixed(2)}\n`;
            }
        });
        billText += `\nTotal Amount: ₹${saleItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}\n\nWe appreciate your business.\n${BILLING_NAME}`;
        const smsBody = encodeURIComponent(billText);
        const smsUrl = `sms:${customer.phone}?body=${smsBody}`;
        window.open(smsUrl, '_blank');
    });
}

// Load all data
function loadData() {
    renderDashboard();
    renderProducts();
    renderCustomers();
    renderSalesForm();
    renderPurchaseForm();
    renderReports();
}

// Update last updated timestamp
function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = new Date().toLocaleString();
    }
}

// Show alert message
function showAlert(message, type = 'success', duration = 3000) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        <strong>${type === 'success' ? 'Success!' : 'Error!'}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to body
    document.body.appendChild(alert);
    
    // Auto remove after duration
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, duration);
}

// DASHBOARD FUNCTIONS
function renderDashboard() {
    const stats = calculateStats();
    renderDashboardStats(stats);
    renderQuickOverview(stats);
    renderLowStockAlert(stats);
    // Daily Sales Report
    const today = new Date().toISOString().slice(0, 10);
    const todaysSales = sales.filter(sale => sale.date.slice(0, 10) === today);
    let reportHtml = '';
    if (todaysSales.length === 0) {
        reportHtml = '<div class="text-muted">No sales recorded today.</div>';
    } else {
        reportHtml = `<table class="table table-bordered">
            <thead><tr><th>Time</th><th>Customer</th><th>Products</th><th>Total (₹)</th><th>Discount (%)</th></tr></thead><tbody>`;
        todaysSales.forEach(sale => {
            const time = new Date(sale.date).toLocaleTimeString();
            const customer = sale.customerName;
            const products = sale.items.map(i => i.productName + ' x' + i.quantity).join(', ');
            const total = sale.total.toFixed(2);
            const discount = (() => {
                const cust = customers.find(c => c.id === sale.customerId);
                return cust ? (cust.discount || 0) : 0;
            })();
            reportHtml += `<tr><td>${time}</td><td>${customer}</td><td>${products}</td><td>₹${total}</td><td>${discount}%</td></tr>`;
        });
        reportHtml += '</tbody></table>';
    }
    document.getElementById('daily-sales-report').innerHTML = reportHtml;
    updateLastUpdated();
}

function calculateStats() {
    const totalProducts = products.length;
    const totalCustomers = customers.length;
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * (p.mrp || 0)), 0);
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const productsInStock = products.filter(p => p.stock > 0).length;
    
    return {
        totalProducts,
        totalCustomers,
        lowStockCount: lowStockProducts.length,
        totalInventoryValue,
        totalSales,
        lowStockProducts: lowStockProducts.slice(0, 5),
        productsInStock,
        averageProductValue: totalProducts > 0 ? totalInventoryValue / totalProducts : 0
    };
}

function renderDashboardStats(stats) {
    const statsContainer = document.getElementById('dashboard-stats');
    statsContainer.innerHTML = `
        <div class="col-md-6 col-xl-3 mb-4">
            <div class="card stat-card border-primary h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <h6 class="card-title text-muted mb-1">Total Products</h6>
                            <h4 class="mb-0 text-primary fw-bold">${stats.totalProducts}</h4>
                        </div>
                        <div class="text-primary opacity-75">
                            <i class="fas fa-box fa-2x"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-6 col-xl-3 mb-4">
            <div class="card stat-card border-info h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <h6 class="card-title text-muted mb-1">Total Customers</h6>
                            <h4 class="mb-0 text-info fw-bold">${stats.totalCustomers}</h4>
                        </div>
                        <div class="text-info opacity-75">
                            <i class="fas fa-users fa-2x"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-6 col-xl-3 mb-4">
            <div class="card stat-card ${stats.lowStockCount > 0 ? 'border-warning' : 'border-success'} h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <h6 class="card-title text-muted mb-1">Low Stock Items</h6>
                            <h4 class="mb-0 ${stats.lowStockCount > 0 ? 'text-warning' : 'text-success'} fw-bold">${stats.lowStockCount}</h4>
                            <small class="text-muted">${stats.lowStockCount > 0 ? 'Needs attention' : 'All good'}</small>
                        </div>
                        <div class="${stats.lowStockCount > 0 ? 'text-warning' : 'text-success'} opacity-75">
                            <i class="fas fa-exclamation-triangle fa-2x"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-6 col-xl-3 mb-4">
            <div class="card stat-card border-success h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <h6 class="card-title text-muted mb-1">Inventory Value</h6>
                            <h4 class="mb-0 text-success fw-bold">₹${stats.totalInventoryValue.toFixed(2)}</h4>
                        </div>
                        <div class="text-success opacity-75">
                            <i class="fas fa-rupee-sign fa-2x"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderQuickOverview(stats) {
    const overviewContainer = document.getElementById('quick-overview');
    overviewContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold text-success">Total Sales Revenue</label>
                    <div class="h4 text-success">₹${stats.totalSales.toFixed(2)}</div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold text-info">Average Product Value</label>
                    <div class="h5 text-info">₹${stats.averageProductValue.toFixed(2)}</div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold text-primary">Products in Stock</label>
                    <div class="h5 text-primary">${stats.productsInStock} / ${stats.totalProducts}</div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold text-warning">Items Need Reorder</label>
                    <div class="h5 text-warning">${stats.lowStockCount} items</div>
                </div>
            </div>
        </div>
    `;
}

function renderLowStockAlert(stats) {
    const alertContainer = document.getElementById('low-stock-alert');
    
    if (stats.lowStockProducts.length === 0) {
        alertContainer.innerHTML = `
            <div class="text-center py-3 text-success">
                <i class="fas fa-check-circle fa-2x mb-2"></i>
                <p class="mb-0">All products are well stocked!</p>
            </div>
        `;
    } else {
        const lowStockHtml = stats.lowStockProducts.map(product => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <small class="fw-bold">${product.name}</small>
                    <br>
                    <small class="text-muted">${product.category}</small>
                </div>
                <span class="badge ${product.stock === 0 ? 'bg-danger' : 'bg-warning'}">
                    ${product.stock} left
                </span>
            </div>
        `).join('');
        
        alertContainer.innerHTML = `
            <div>
                ${lowStockHtml}
                ${stats.lowStockCount > 5 ? `
                    <div class="text-center mt-2">
                        <small class="text-muted">And ${stats.lowStockCount - 5} more items...</small>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// PRODUCT FUNCTIONS
// Fix for Stock Reports visibility
function renderProducts() {
    const tbody = document.getElementById('products-table');
    const productCount = document.getElementById('product-count');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-box fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No products added yet.</p>
                    </div>
                </td>
            </tr>
        `;
        productCount.textContent = '0';
        return;
    }
    
    productCount.textContent = products.length;
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="fw-bold">${product.name}</div>
                </div>
            </td>
            <td>${product.category}</td>
            <td class="fw-bold text-primary">₹${(product.mrp || 0).toFixed(2)}</td>
            <td class="fw-bold text-success">₹${product.prices && product.prices['50'] ? product.prices['50'].toFixed(2) : '0.00'}</td>
            <td>${product.stock}</td>
            <td>
                <span class="badge ${getStockStatus(product).badgeClass}">${getStockStatus(product).text}</span>
            </td>
            <td>
                <span class="badge bg-info">${product.mrp && product.prices && product.prices['50'] ? (((product.mrp - product.prices['50']) / product.mrp) * 100).toFixed(1) : '0.0'}%</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editProduct('${product.id}')" title="Edit Product">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteProduct('${product.id}')" title="Delete Product">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStockStatus(product) {
    if (product.stock === 0) {
        return { 
            badgeClass: 'bg-danger', 
            dotClass: 'red',
            text: 'Out of Stock' 
        };
    }
    if (product.stock <= product.minStock) {
        return { 
            badgeClass: 'bg-warning', 
            dotClass: 'yellow',
            text: 'Low Stock' 
        };
    }
    return { 
        badgeClass: 'bg-success', 
        dotClass: 'green',
        text: 'In Stock' 
    };
}

function filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('products-table');
    const productCount = document.getElementById('product-count');
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No products found matching your search.</p>
                    </div>
                </td>
            </tr>
        `;
        productCount.textContent = '0';
        return;
    }
    
    productCount.textContent = filteredProducts.length;
    
    tbody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="fw-bold">${product.name}</div>
                </div>
            </td>
            <td>${product.category}</td>
            <td class="fw-bold text-primary">₹${(product.mrp || 0).toFixed(2)}</td>
            <td class="fw-bold text-success">₹${(product.prices && product.prices['50'] ? product.prices['50'] : 0).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="badge ${getStockStatus(product).badgeClass}">${getStockStatus(product).text}</span>
            </td>
            <td>
                <span class="badge bg-info">${product.mrp && product.prices && product.prices['50'] ? (((product.mrp - product.prices['50']) / product.mrp) * 100).toFixed(1) : '0.0'}%</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editProduct('${product.id}')" title="Edit Product">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteProduct('${product.id}')" title="Delete Product">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openProductModal() {
    currentEditingProduct = null;
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('product-submit-text').textContent = 'Add Product';
    
    // Reset form
    document.getElementById('product-form').reset();
    // Reset price tiers fields to blank
    document.getElementById('product-price-25').value = '';
    document.getElementById('product-price-35').value = '';
    document.getElementById('product-price-42').value = '';
    document.getElementById('product-price-50').value = '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    currentEditingProduct = product;
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-submit-text').textContent = 'Update Product';
    
    // Fill form
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-volume-points').value = product.volumePoints || '';
    document.getElementById('product-mrp').value = product.mrp || '';
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-min-stock').value = product.minStock;
    document.getElementById('product-description').value = product.description;
    // Bind price tiers for this product only
    document.getElementById('product-price-25').value = product.prices && product.prices['25'] ? product.prices['25'] : '';
    document.getElementById('product-price-35').value = product.prices && product.prices['35'] ? product.prices['35'] : '';
    document.getElementById('product-price-42').value = product.prices && product.prices['42'] ? product.prices['42'] : '';
    document.getElementById('product-price-50').value = product.prices && product.prices['50'] ? product.prices['50'] : '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveToStorage('herbalife_products', products);
        renderProducts();
        renderDashboard();
        showAlert('Product deleted successfully!');
    }
}

function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('product-name').value.trim(),
        category: document.getElementById('product-category').value,
        volumePoints: parseFloat(document.getElementById('product-volume-points').value),
        mrp: parseFloat(document.getElementById('product-mrp').value),
        stock: parseInt(document.getElementById('product-stock').value),
        minStock: parseInt(document.getElementById('product-min-stock').value),
        discount: parseFloat(document.getElementById('product-discount').value) || 0,
        prices: {
            '25': parseFloat(document.getElementById('product-price-25').value),
            '35': parseFloat(document.getElementById('product-price-35').value),
            '42': parseFloat(document.getElementById('product-price-42').value),
            '50': parseFloat(document.getElementById('product-price-50').value)
        },
        description: document.getElementById('product-description').value.trim()
    };
    
    if (currentEditingProduct) {
        // Update existing product
        const index = products.findIndex(p => p.id === currentEditingProduct.id);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                ...formData,
                prices: { ...formData.prices }, // ensure prices are unique per product
                updatedAt: new Date().toISOString()
            };
        }
        showAlert('Product updated successfully!');
    } else {
        // Add new product
        const newProduct = {
            id: generateId(),
            ...formData,
            prices: { ...formData.prices }, // ensure prices are unique per product
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        products.push(newProduct);
        showAlert('Product added successfully!');
    }
    // Save all products with their own prices to localStorage
    saveToStorage('herbalife_products', products);
    renderProducts();
    renderDashboard();
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal.hide();
}

// CUSTOMER FUNCTIONS
function renderCustomers() {
    const tbody = document.getElementById('customers-table');
    const customerCount = document.getElementById('customer-count');
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No customers added yet.</p>
                    </div>
                </td>
            </tr>
        `;
        customerCount.textContent = '0';
        return;
    }
    
    customerCount.textContent = customers.length;
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="fw-bold">${customer.name}</div>
                </div>
            </td>
            <td>
                <a href="mailto:${customer.email}" class="text-decoration-none">${customer.email}</a>
            </td>
            <td>
                <a href="tel:${customer.phone}" class="text-decoration-none">${customer.phone}</a>
            </td>
            <td>
                <small class="text-muted">${customer.address}</small>
            </td>
            <td>
                <small class="text-muted">${new Date(customer.createdAt).toLocaleDateString()}</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editCustomer('${customer.id}')" title="Edit Customer">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteCustomer('${customer.id}')" title="Delete Customer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterCustomers() {
    const searchTerm = document.getElementById('customer-search').value.toLowerCase();
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm)
    );
    
    const tbody = document.getElementById('customers-table');
    const customerCount = document.getElementById('customer-count');
    
    if (filteredCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No customers found matching your search.</p>
                    </div>
                </td>
            </tr>
        `;
        customerCount.textContent = '0';
        return;
    }
    
    customerCount.textContent = filteredCustomers.length;
    
    tbody.innerHTML = filteredCustomers.map(customer => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="fw-bold">${customer.name}</div>
                </div>
            </td>
            <td>
                <a href="mailto:${customer.email}" class="text-decoration-none">${customer.email}</a>
            </td>
            <td>
                <a href="tel:${customer.phone}" class="text-decoration-none">${customer.phone}</a>
            </td>
            <td>
                <small class="text-muted">${customer.address}</small>
            </td>
            <td>
                <small class="text-muted">${new Date(customer.createdAt).toLocaleDateString()}</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editCustomer('${customer.id}')" title="Edit Customer">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteCustomer('${customer.id}')" title="Delete Customer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openCustomerModal() {
    currentEditingCustomer = null;
    document.getElementById('customer-modal-title').textContent = 'Add New Customer';
    document.getElementById('customer-submit-text').textContent = 'Add Customer';
    
    // Reset form
    document.getElementById('customer-form').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('customerModal'));
    modal.show();
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    currentEditingCustomer = customer;
    document.getElementById('customer-modal-title').textContent = 'Edit Customer';
    document.getElementById('customer-submit-text').textContent = 'Update Customer';
    
    // Fill form
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-email').value = customer.email;
    document.getElementById('customer-phone').value = customer.phone;
    document.getElementById('customer-address').value = customer.address;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('customerModal'));
    modal.show();
}

function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        customers = customers.filter(c => c.id !== id);
        saveToStorage('herbalife_customers', customers);
        renderCustomers();
        renderDashboard();
        showAlert('Customer deleted successfully!');
    }
}

function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('customer-name').value.trim(),
        email: document.getElementById('customer-email').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        address: document.getElementById('customer-address').value.trim(),
        discount: parseFloat(document.getElementById('customer-discount').value) || 0
    };
    
    if (currentEditingCustomer) {
        // Update existing customer
        const index = customers.findIndex(c => c.id === currentEditingCustomer.id);
        if (index !== -1) {
            customers[index] = {
                ...customers[index],
                ...formData,
                updatedAt: new Date().toISOString()
            };
        }
        showAlert('Customer updated successfully!');
    } else {
        // Add new customer
        const newCustomer = {
            id: generateId(),
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        customers.push(newCustomer);
        showAlert('Customer added successfully!');
    }
    
    saveToStorage('herbalife_customers', customers);
    renderCustomers();
    renderDashboard();
    renderSalesForm(); // Update customer dropdown
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('customerModal'));
    modal.hide();
}

// SALES FUNCTIONS
function renderSalesForm() {
    // Initialize sale items if empty
    if (saleItems.length === 0) {
        saleItems = [{ id: generateId(), productId: '', productName: '', quantity: 1, price: 0, total: 0, discountTier: '50' }];
    }
    
    renderSaleItems();
    renderSaleCustomerDropdown();
    updateSaleTotal();
}

function renderSaleItems() {
    const container = document.getElementById('sale-items-container');
    
    container.innerHTML = saleItems.map((item, index) => {
        const product = products.find(p => p.id === item.productId);
        // Discount selection (dropdown)
        let discountOptions = '';
        if (product && product.prices) {
            discountOptions = `<select class="form-select form-select-sm w-auto d-inline-block ms-2" onchange="updateSaleItem(${index}, 'discountTier', this.value)">` +
                ['25','35','42','50'].map(tier => `<option value="${tier}" ${item.discountTier === tier ? 'selected' : ''}>${tier}%</option>`).join('') + '</select>';
        }
        return `
        <div class="row mb-3 align-items-center border-bottom pb-3 gx-2" data-item-id="${item.id}">
            <div class="col-lg-3 col-md-4 col-12">
                <label class="form-label fw-bold">Product</label>
                <select class="form-select" onchange="updateSaleItem(${index}, 'productId', this.value)" required>
                    <option value="">Select Product</option>
                    ${products.filter(p => p.stock > 0).map(product => `
                        <option value="${product.id}" ${item.productId === product.id ? 'selected' : ''}>
                            ${product.name} (Stock: ${product.stock})
                        </option>
                    `).join('')}
                </select>
                ${discountOptions}
            </div>
            <div class="col-lg-2 col-md-2 col-6">
                <label class="form-label fw-bold">Quantity</label>
                <div class="qty-control d-flex align-items-center gap-1">
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="updateSaleItemQuantity(${index}, -1)">-</button>
                    <input type="number" class="form-control form-control-sm" value="${item.quantity}" min="1" onchange="updateSaleItem(${index}, 'quantity', parseInt(this.value) || 1)">
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="updateSaleItemQuantity(${index}, 1)">+</button>
                </div>
            </div>
            <div class="col-lg-3 col-md-3 col-12">
                <label class="form-label fw-bold">Price</label>
                <input type="number" step="0.01" class="form-control mb-1" value="${item.price}" onchange="updateSaleItem(${index}, 'price', parseFloat(this.value) || 0)" required>
            </div>
            <div class="col-lg-2 col-md-2 col-6">
                <label class="form-label fw-bold">Total</label>
                <div class="form-control bg-light fw-bold text-success mb-2" style="text-align:right; font-size:1.1em; width:100%; box-sizing:border-box;">₹${item.total.toFixed(2)}</div>
            </div>
            <div class="col-lg-2 col-md-1 col-12">
                <div class="btn-group mt-3 mt-md-0">
                    <button type="button" class="btn btn-success btn-sm" onclick="addSaleItem()">
                        <i class="fas fa-plus"></i>
                    </button>
                    ${saleItems.length > 1 ? `
                        <button type="button" class="btn btn-danger btn-sm" onclick="removeSaleItem(${index})">
                            <i class="fas fa-minus"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function renderSaleCustomerDropdown() {
    const select = document.getElementById('sale-customer');
    select.innerHTML = `
        <option value="">Select Customer</option>
        ${customers.map(customer => `
            <option value="${customer.id}">${customer.name} (${customer.discount || 0}% off)</option>
        `).join('')}
    `;
    
    // Add event listener for customer selection
    select.addEventListener('change', function() {
        const customerId = this.value;
        const customerInfo = document.getElementById('selected-customer-info');
        
        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                customerInfo.innerHTML = `
                    <div class="fw-bold">${customer.name}</div>
                    <small class="text-muted">${customer.email}</small>
                    <br>
                    <small class="text-muted">${customer.phone}</small>
                    <br>
                    <span class="badge bg-success">Discount: ${customer.discount || 0}%</span>
                `;
                customerInfo.style.display = 'block';
            }
        } else {
            customerInfo.style.display = 'none';
        }
        
        updateSaleSubmitButton();
    });
}

function addSaleItem() {
    saleItems.push({ id: generateId(), productId: '', productName: '', quantity: 1, price: 0, total: 0, discountTier: '50' });
    renderSaleItems();
}

function removeSaleItem(index) {
    if (saleItems.length > 1) {
        saleItems.splice(index, 1);
        renderSaleItems();
        updateSaleTotal();
    }
}

function updateSaleItem(index, field, value) {
    if (!saleItems[index]) return;
    
    // Prevent adding more than available stock
    if (field === 'quantity') {
        const product = products.find(p => p.id === saleItems[index].productId);
        if (product && value > product.stock) {
            showAlert(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 'danger');
            return; // Do not update quantity
        }
        // Auto-fill price from product default if not set, for this sale item only
        if (product && (!saleItems[index].price || saleItems[index].price === 0)) {
            // Use selected discount tier if set
            const tier = saleItems[index].discountTier || '50';
            saleItems[index].price = product.prices && product.prices[tier] ? product.prices[tier] : (product.mrp || 0);
        }
    }
    saleItems[index][field] = value;
    if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
            saleItems[index].productName = product.name;
            // Set price for this product only, use selected discount tier if set
            const tier = saleItems[index].discountTier || '50';
            saleItems[index].price = product.prices && product.prices[tier] ? product.prices[tier] : (product.mrp || 0);
            saleItems[index].total = saleItems[index].quantity * saleItems[index].price;
        }
    } else if (field === 'discountTier') {
        // When discount tier changes, update price for this sale item only
        const product = products.find(p => p.id === saleItems[index].productId);
        if (product) {
            saleItems[index].price = product.prices && product.prices[value] ? product.prices[value] : (product.mrp || 0);
            saleItems[index].total = saleItems[index].quantity * saleItems[index].price;
        }
    } else if (field === 'price') {
        saleItems[index].price = value;
        saleItems[index].total = saleItems[index].quantity * saleItems[index].price;
    } else if (field === 'quantity') {
        saleItems[index].total = saleItems[index].quantity * saleItems[index].price;
    }
    renderSaleItems();
    updateSaleTotal();
    updateSaleSubmitButton();
}

function updateSaleItemQuantity(index, change) {
    const item = saleItems[index];
    if (!item) return;
    
    const newQuantity = Math.max(1, item.quantity + change);
    
    // Check stock availability
    if (change > 0) {
        const product = products.find(p => p.id === item.productId);
        if (product && newQuantity > product.stock) {
            showAlert(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 'warning');
            return;
        }
    }
    
    updateSaleItem(index, 'quantity', newQuantity);
}

// Fix: Always update order summary amount for billing
function updateSaleTotal() {
    let subtotal = 0;
    let totalVP = 0;
    saleItems.forEach(item => {
        // Always use the selected discount tier for each product
        if (item.productId) {
            const product = products.find(p => p.id === item.productId);
            const tier = item.discountTier || '50';
            if (product && product.prices && product.prices[tier]) {
                item.price = product.prices[tier];
            } else if (product && product.mrp) {
                item.price = product.mrp;
            }
        }
 
        item.total = item.quantity * item.price;
        subtotal += item.total;
        // Calculate total volume points
        const product = products.find(p => p.id === item.productId);
        if (product && product.volumePoints) {
            totalVP += item.quantity * product.volumePoints;
        }
    });
    document.getElementById('sale-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('sale-total').textContent = `₹${subtotal.toFixed(2)}`;
    const vpElem = document.getElementById('sale-total-vp');
    if (vpElem) vpElem.textContent = totalVP.toFixed(2);
}

function updateSaleSubmitButton() {
    const button = document.getElementById('complete-sale-btn');
    const customerId = document.getElementById('sale-customer').value;
    const hasValidItems = saleItems.every(item => item.productId && item.quantity > 0);
    
    button.disabled = !customerId || !hasValidItems;
}

// Send bill and PDF via WhatsApp
function sendBillToCustomer() {
    const customerSelect = document.getElementById('sale-customer');
    const customerId = customerSelect.value;
    if (!customerId) {
        showAlert('Please select a customer to send the bill.', 'danger');
        return;
    }
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.phone) {
        showAlert('Customer phone number not found.', 'danger');
        return;
    }
    let billText = `${BILLING_NAME} Invoice%0A%0ADear ${customer.name},%0AThank you for your purchase!%0A%0AOrder Details:%0A`;
    saleItems.forEach(item => {
        if (item.productId) {
            const product = products.find(p => p.id === item.productId);
            billText += `${product.name} x${item.quantity} - ₹${item.total.toFixed(2)}%0A`;
        }
    });
    billText += `%0ATotal Amount: ₹${saleItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}%0A%0AWe appreciate your business.%0A${BILLING_NAME}`;
    // Generate PDF invoice
    const sale = {
        id: generateId(),
        date: new Date().toISOString(),
        customerId: customer.id,
        customerName: customer.name,
        items: saleItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.total
        })),
        subtotal: saleItems.reduce((sum, item) => sum + item.total, 0),
        tax: 0,
        total: saleItems.reduce((sum, item) => sum + item.total, 0)
    };
    try {
        completeSale(sale);
        generateSaleInvoice(sale, true, customer.phone, billText);
        showAlert('Sale completed and invoice downloaded!', 'success');
    } catch (err) {
        showAlert('Error generating invoice. Please check jsPDF and try again.', 'danger');
        console.error('Invoice error:', err);
    }
}

// Update generateSaleInvoice to support WhatsApp sharing
function generateSaleInvoice(sale, sendWhatsApp = false, phone = '', billText = '') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // Helper for INR formatting
    // Use 'Rs.' prefix to avoid font issues with ₹
    const formatINR = (value) => `Rs. ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Full-width header with big club name
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Gratitude Nutrition Club', 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('INVOICE', 105, 28, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60); // Darker color for details
    doc.text(`Invoice #: ${sale.id}`, 15, 40);
    doc.text(`Date: ${new Date(sale.date).toLocaleDateString()}`, 15, 46);
    doc.text(`Customer: ${sale.customerName}`, 15, 52);

    // Table header (full width, taller and darker gray)
    let y = 60;
    doc.setFillColor(50, 50, 50); // Darker gray
    doc.rect(10, y, 190, 18, 'F'); // Taller header
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Product', 25, y + 12);
    doc.text('Qty', 95, y + 12, { align: 'center' });
    doc.text('Price', 140, y + 12, { align: 'center' });
    doc.text('Total', 185, y + 12, { align: 'right' });

    // Table items (full width, bigger rows and box, improved vertical alignment)
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    sale.items.forEach((item, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 220 : 240, 220, 220); // More visible gray
        doc.rect(10, y, 190, 18, 'F'); // Consistent row height
        doc.setTextColor(30, 30, 30);
        doc.text(item.productName.substring(0, 40), 25, y + 12);
        doc.text(String(item.quantity), 95, y + 12, { align: 'center' });
        doc.text(formatINR(item.price), 140, y + 12, { align: 'center' });
        doc.text(formatINR(item.total), 185, y + 12, { align: 'right' });
        y += 18;
    });

    // Totals section (right aligned, bigger)
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text(`Subtotal: ${formatINR(sale.subtotal)}`, 185, y, { align: 'right' });
    y += 10;
    doc.text(`Total: ${formatINR(sale.total)}`, 185, y, { align: 'right' });

    // Footer
    y += 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for choosing us', 105, y, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Contact: 9343164333', 105, y + 7, { align: 'center' });

    // Save PDF and send via WhatsApp
    const pdfFileName = `sale-invoice-${sale.id}.pdf`;
    doc.save(pdfFileName);
    if (sendWhatsApp && phone) {
        const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${billText}%0A%0AInvoice PDF sent to your email.`;
        window.open(whatsappUrl, '_blank');
        // SMS link (mobile only)
        const smsBody = encodeURIComponent(billText.replace(/%0A/g, '\n'));
        const smsUrl = `sms:${phone}?body=${smsBody}`;
        // Show SMS button
        const smsBtn = document.createElement('a');
        smsBtn.href = smsUrl;
        smsBtn.textContent = 'Send SMS';
        smsBtn.className = 'btn btn-primary ms-2';
        smsBtn.style.position = 'fixed';
        smsBtn.style.top = '80px';
        smsBtn.style.right = '20px';
        smsBtn.style.zIndex = '9999';
        document.body.appendChild(smsBtn);
        setTimeout(() => { smsBtn.remove(); }, 15000); // Remove after 15s
    }
    // ...existing code...
}

function handlePurchaseSubmit(e) {
    e.preventDefault();
    // Get purchase details from form
    const productName = document.getElementById('purchase-product-name').value.trim();
    const quantity = parseInt(document.getElementById('purchase-product-qty').value);
    const cost = parseFloat(document.getElementById('purchase-product-cost').value);
    const supplier = document.getElementById('purchase-supplier').value.trim();
    if (!productName || !quantity || !cost || !supplier) {
        showAlert('Please fill all purchase fields.', 'danger');
        return;
    }
    // Create purchase object
    const purchase = {
        id: generateId(),
        productName,
        quantity,
        cost,
        supplier,
        date: new Date().toISOString(),
        total: quantity * cost
    };
    purchases.push(purchase);
    saveToStorage('herbalife_purchases', purchases);
    renderDashboard();
    showAlert('Purchase completed and invoice generated!', 'success');
    generatePurchaseInvoice(purchase);
    document.getElementById('purchase-form').reset();
}

function generatePurchaseInvoice(purchase) {
    var purchaseDoc = typeof jsPDF !== 'undefined' ? new jsPDF() : null;
    purchaseDoc.setFontSize(20);
    purchaseDoc.setFont('helvetica', 'bold');
    purchaseDoc.text('Gratitude Nutrition Club', 20, 30);
    purchaseDoc.setFontSize(14);
    purchaseDoc.setFont('helvetica', 'normal');
    purchaseDoc.text('Purchase Invoice', 20, 45);
    purchaseDoc.setFontSize(10);
    purchaseDoc.text('Invoice #: ' + purchase.id, 120, 30);
    purchaseDoc.text('Date: ' + new Date(purchase.date).toLocaleDateString(), 120, 40);
    purchaseDoc.text('Supplier: ' + purchase.supplier, 120, 50);
    let y = 70;
    purchaseDoc.setFont('helvetica', 'bold');
    purchaseDoc.text('Product', 20, y);
    purchaseDoc.text('Qty', 120, y);
    purchaseDoc.text('Cost', 140, y);
    purchaseDoc.text('Total', 170, y);
    y += 10;
    purchaseDoc.setFont('helvetica', 'normal');
    purchaseDoc.text(purchase.productName.substring(0, 25), 20, y);
    purchaseDoc.text(String(purchase.quantity), 120, y);
    purchaseDoc.text('₹' + purchase.cost.toFixed(2), 140, y);
    purchaseDoc.text('₹' + purchase.total.toFixed(2), 170, y);
    y += 20;
    purchaseDoc.setFont('helvetica', 'bold');
    purchaseDoc.text('Total: ₹' + purchase.total.toFixed(2), 140, y);
    // Removed 'Thank you for your business!' from invoice footer
    const pdfFileName = 'purchase-invoice-' + purchase.id + '.pdf';
    purchaseDoc.save(pdfFileName);
}

// Set active dashboard tab on load
document.addEventListener('DOMContentLoaded', function() {
    const dashboardBtn = document.querySelector('.nav-btn[data-section="dashboard"]');
    if (dashboardBtn) {
        dashboardBtn.classList.add('active');
    }
});

// Utility function to clear all products and customers and persist empty arrays
function clearAllData() {
    products = [];
    customers = [];
    sales = [];
    purchases = [];
    saveToStorage('herbalife_products', products);
    saveToStorage('herbalife_customers', customers);
    saveToStorage('herbalife_sales', sales);
    saveToStorage('herbalife_purchases', purchases);
    renderProducts();
    renderCustomers();
    renderDashboard();
    renderSalesForm();
    renderPurchaseForm();
    showAlert('All products, customers, sales, and purchases have been deleted. You can now add new data.', 'success');
}

// Call clearAllData() from the console or add a button to trigger it.

// Fix: Ensure default prices show in sales record
function updateProductSelects() {
    const productSelects = document.querySelectorAll('#sale-products .product-select');
    const options = '<option value="">Choose product...</option>' +
        products.filter(p => p.stock > 0).map(p => 
            `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`
        ).join('');
    productSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = options;
        select.value = currentValue;
        // Always set price when product is selected
        select.addEventListener('change', function() {
            const row = select.closest('.sale-product-row');
            const productId = select.value;
            const product = products.find(p => p.id == productId);
            if (product) {
                const priceInput = row.querySelector('.price-input');
                priceInput.value = product.mrp;
                calculateRowTotal(row);
                calculateSaleTotal();
            }
        });
        // Set default price if product is already selected
        const row = select.closest('.sale-product-row');
        const productId = select.value;
        const product = products.find(p => p.id == productId);
        if (product && row) {
            const priceInput = row.querySelector('.price-input');
            priceInput.value = product.mrp;
            calculateRowTotal(row);
            calculateSaleTotal();
        }
    });
}

// Complete Sale button handler
function handleSaleSubmit(e) {
    e.preventDefault();
    const customerId = document.getElementById('sale-customer').value;
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        showAlert('Please select a customer.', 'danger');
        return;
    }
    if (!saleItems.every(item => item.productId && item.quantity > 0)) {
        showAlert('Please add valid products to the sale.', 'danger');
        return;
    }
    // Prepare sale data
    const sale = {
        id: generateId(),
        date: new Date().toISOString(),
        customerId: customer.id,
        customerName: customer.name,
        items: saleItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.total
        })),
        subtotal: saleItems.reduce((sum, item) => sum + item.total, 0),
        tax: 0, // GST removed
        total: saleItems.reduce((sum, item) => sum + item.total, 0)
    };
    completeSale(sale);
    showAlert('Sale completed and invoice generated!', 'success');
    generateSaleInvoice(sale);
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('salesModal'));
    if (modal) {
        modal.hide();
    }
}

// Shared function to finalize sale, update stock, and reports
function completeSale(sale) {
    sales.push(sale);
    saveToStorage('herbalife_sales', sales);
    // Reduce stock
    sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    saveToStorage('herbalife_products', products);
    renderProducts();
    renderDashboard();
    renderSalesForm();
    renderPurchaseForm(); // Ensure purchase form updates after sale
    renderReports();
}

// REPORTS FUNCTIONS
function renderReports() {
    const tbody = document.getElementById('reports-table');
    if (!tbody) return;
    let filteredProducts = products;
    const filter = document.querySelector('input[name="report-filter"]:checked')?.value || 'all';
    if (filter === 'low') {
        filteredProducts = products.filter(p => p.stock <= p.minStock);
    } else if (filter === 'out') {
        filteredProducts = products.filter(p => p.stock === 0);
    }
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5"><div class="empty-state"><i class="fas fa-box fa-3x text-muted mb-3"></i><p class="text-muted">No products found for this report.</p></div></td></tr>`;
        document.getElementById('stock-total-vp').textContent = '0';
        return;
    }
    let totalVP = 0;
    tbody.innerHTML = filteredProducts.map(product => {
        const status = getStockStatus(product);
        const price = typeof product.mrp === 'number' && !isNaN(product.mrp) ? product.mrp : 0;
        totalVP += (product.volumePoints || 0) * (product.stock || 0);
        return `<tr><td>${product.name || ''}</td><td>${product.category || ''}</td><td>${product.stock || 0}</td><td>${product.minStock || 0}</td><td>₹${(price * product.stock).toFixed(2)}</td><td><span class="status-dot ${status.dotClass}"></span><span class="badge ${status.badgeClass}">${status.text}</span></td></tr>`;
    }).join('');
    document.getElementById('stock-total-vp').textContent = totalVP.toFixed(2);
    }
