



        showSection(sectionId, event) {

            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            // Show selected section
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`.nav-item[href="#${sectionId}"]`).classList.add('active');

            this.currentSection = sectionId;

            // Load section-specific data
            switch(sectionId) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'inventory':
                    this.loadInventory();
                    break;
                case 'sales':
                    this.loadSales();
                    break;
                case 'sales-report':
                    this.loadSalesReport();
                    break;
                case 'pos':
                    this.loadPOS();
                    break;
                case 'audit-logs':
                    loadAuditLogs();
                    break;
                case 'inventory-reports':
                    this.loadInventoryReports();
                    break;
                case 'payment-reports':
                    this.loadPaymentReports();
                    break;
                case 'settings':
                    this.loadSettings();
                    break;
            }
        }

        loadPOS() {
            // Load products for POS
            this.loadProductsForPOS();
        }

        searchProductsForPOS(e) {
            const query = e.target.value.toLowerCase();
            const products = dataManager.getProducts();
            const productGrid = document.getElementById('product-grid');
            
            const filteredProducts = products.filter(product =>
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query)
            );
            
            productGrid.innerHTML = filteredProducts.map(product => `
                <div class="product-item" onclick="addToCart(${product.id})">
                    <h4>${product.name}</h4>
                    <p>Price: $${product.price.toFixed(2)}</p>
                    <p>Stock: ${product.stock}</p>
                </div>
            `).join('');
        }

        loadProductsForPOS() {
            const products = dataManager.getProducts();
            const productGrid = document.getElementById('product-grid');
            
            productGrid.innerHTML = products.map(product => `
                <div class="product-item" onclick="addToCart(${product.id})">
                    <h4>${product.name}</h4>
                    <p>Price: $${product.price.toFixed(2)}</p>
                    <p>Stock: ${product.stock}</p>
                </div>
            `).join('');
        }

        loadDashboard() {
            const stats = dataManager.getStatistics();
            
            // Update statistics
            document.getElementById('total-products').textContent = stats.totalProducts;
            document.getElementById('total-sales').textContent = stats.totalSales;
            document.getElementById('low-stock').textContent = stats.lowStockItems;
            document.getElementById('total-revenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;

            // Load activities
            this.loadActivities();
        }

        loadSalesReport() {
            const sales = dataManager.getSales();
            const startDateInput = document.getElementById('report-start-date');
            const endDateInput = document.getElementById('report-end-date');
            const tableBody = document.getElementById('sales-report-table-body');

            // Parse dates from inputs
            const startDate = startDateInput && startDateInput.value ? new Date(startDateInput.value) : null;
            const endDate = endDateInput && endDateInput.value ? new Date(endDateInput.value) : null;

            // Filter sales by date range if specified
            let filteredSales = sales;
            if (startDate) {
                filteredSales = filteredSales.filter(sale => new Date(sale.date) >= startDate);
            }
            if (endDate) {
                filteredSales = filteredSales.filter(sale => new Date(sale.date) <= endDate);
            }

            // Calculate summary stats
            const totalTransactions = filteredSales.length;
            const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
            const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

            // Calculate top selling product
            const productSalesCount = {};
            filteredSales.forEach(sale => {
                sale.products.forEach(product => {
                    if (!productSalesCount[product.name]) {
                        productSalesCount[product.name] = 0;
                    }
                    productSalesCount[product.name] += product.quantity;
                });
            });
            const topProduct = Object.entries(productSalesCount).sort((a, b) => b[1] - a[1])[0];
            const topProductName = topProduct ? topProduct[0] : 'N/A';

            // Update summary UI
            document.getElementById('total-sales-count').textContent = totalTransactions;
            document.getElementById('total-sales-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
            document.getElementById('average-sale').textContent = `$${averageSale.toFixed(2)}`;
            document.getElementById('top-product').textContent = topProductName;

            // Populate sales report table
            tableBody.innerHTML = filteredSales.length > 0
                ? filteredSales.map(sale => `
                    <tr>
                        <td>${sale.id}</td>
                        <td>${this.formatDate(sale.date)}</td>
                        <td>${sale.products.map(p => p.name).join(', ')}</td>
                        <td>${sale.products.reduce((sum, p) => sum + p.quantity, 0)}</td>
                        <td>$${sale.totalAmount.toFixed(2)}</td>
                        <td>${sale.paymentMethod}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="6" style="text-align: center;">No sales data available for the selected period</td></tr>';
        }

        addToCart(productId) {
            const product = dataManager.getProducts().find(p => p.id === productId);
            if (product) {
                this.cart.push(product);
                this.updateCart();
            }
        }

        updateCart() {
            const cartItemsContainer = document.getElementById('cart-items');
            cartItemsContainer.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <span>${item.name}</span>
                    <span>$${item.price.toFixed(2)}</span>
                </div>
            `).join('');

            this.updateCartSummary();
        }

        updateCartSummary() {
            const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0);
            const tax = subtotal * 0.08; // 8% tax
            const total = subtotal + tax;

            document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
            document.getElementById('total').textContent = `$${total.toFixed(2)}`;
        }

        loadActivities() {
            const activities = dataManager.getActivities();
            const activitiesList = document.getElementById('activities-list');
            
            activitiesList.innerHTML = activities.length > 0 
                ? activities.map(activity => `
                    <div class="activity-item">
                        <p>${activity.message} - ${this.formatDate(activity.timestamp)}</p>
                    </div>
                `).join('')
                : '<p>No recent activities</p>';
        }

        processPayment(method) {
            const total = this.cart.reduce((sum, item) => sum + item.price, 0);
            const sale = {
                products: this.cart,
                totalAmount: total,
                paymentMethod: method
            };
            dataManager.addSale(sale);
            this.cart = []; // Clear cart after payment
            this.updateCart();
            this.showToast('Payment processed successfully!', 'success');
        }

        clearCart() {
            this.cart = [];
            this.updateCart();
        }

        loadInventory() {
            const products = dataManager.getProducts();
            const tableBody = document.getElementById('inventory-table-body');
            
            tableBody.innerHTML = products.map(product => `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>
                        <span class="status-badge ${
                            product.stock === 0 ? 'status-out-of-stock' :
                            product.stock < 10 ? 'status-low-stock' : 'status-in-stock'
                        }">
                            ${product.stock === 0 ? 'Out of Stock' :
                            product.stock < 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                    </td>
                    <td class="action-buttons">
                        <button class="btn btn-edit" onclick="posSystem.editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-delete" onclick="posSystem.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        handleSearch(e) {
            const query = e.target.value;
            const products = dataManager.searchProducts(query);
            const tableBody = document.getElementById('inventory-table-body');
            
            tableBody.innerHTML = products.map(product => `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>
                        <span class="status-badge ${
                            product.stock === 0 ? 'status-out-of-stock' :
                            product.stock < 10 ? 'status-low-stock' : 'status-in-stock'
                        }">
                            ${product.stock === 0 ? 'Out of Stock' :
                            product.stock < 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                    </td>
                    <td class="action-buttons">
                        <button class="btn btn-edit" onclick="posSystem.editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-delete" onclick="posSystem.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        handleAddProduct(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            // Input validation
            const name = formData.get('name').trim();
            const category = formData.get('category');
            const price = parseFloat(formData.get('price'));
            const stock = parseInt(formData.get('stock'));
            const description = formData.get('description').trim();

            // Validate required fields
            if (!name) {
                this.showToast('Product name is required', 'error');
                return;
            }

            if (!category) {
                this.showToast('Category is required', 'error');
                return;
            }

            if (isNaN(price) || price <= 0) {
                this.showToast('Price must be a positive number', 'error');
                return;
            }

            if (isNaN(stock) || stock < 0) {
                this.showToast('Stock must be a non-negative number', 'error');
                return;
            }

            const product = {
                name,
                category,
                price,
                stock,
                description
            };

            try {
                dataManager.addProduct(product);
                e.target.reset();
                this.showToast('Product added successfully!', 'success');
                this.loadInventory();
                this.loadDashboard(); // Refresh stats
            } catch (error) {
                this.showToast('Error adding product', 'error');
            }
        }

        editProduct(id) {
            const products = dataManager.getProducts();
            const product = products.find(p => p.id === id);
            
            if (product) {
                const newName = prompt('Enter new product name:', product.name);
                const newPrice = prompt('Enter new price:', product.price);
                const newStock = prompt('Enter new stock quantity:', product.stock);
                
                if (newName && newPrice && newStock) {
                    // Input validation
                    const name = newName.trim();
                    const price = parseFloat(newPrice);
                    const stock = parseInt(newStock);
                    
                    if (!name) {
                        this.showToast('Product name is required', 'error');
                        return;
                    }
                    
                    if (isNaN(price) || price <= 0) {
                        this.showToast('Price must be a positive number', 'error');
                        return;
                    }
                    
                    if (isNaN(stock) || stock < 0) {
                        this.showToast('Stock must be a non-negative number', 'error');
                        return;
                    }
                    
                    const updates = {
                        name,
                        price,
                        stock
                    };
                    
                    dataManager.updateProduct(id, updates);
                    this.showToast('Product updated successfully!', 'success');
                    this.loadInventory();
                    this.loadDashboard();
                }
            }
        }

        deleteProduct(id) {
            if (confirm('Are you sure you want to delete this product?')) {
                const success = dataManager.deleteProduct(id);
                if (success) {
                    this.showToast('Product deleted successfully!', 'success');
                    this.loadInventory();
                    this.loadDashboard();
                } else {
                    this.showToast('Error deleting product', 'error');
                }
            }
        }

        loadSales() {
            const sales = dataManager.getSales();
            const tableBody = document.getElementById('sales-table-body');
            
            tableBody.innerHTML = sales.length > 0 
                ? sales.map(sale => `
                    <tr>
                        <td>${sale.id}</td>
                        <td>${this.formatDate(sale.date)}</td>
                        <td>
                            ${sale.products.map(p => 
                                `${p.quantity}x ${p.name} ($${p.price.toFixed(2)} each)`
                            ).join('<br>')}
                        </td>
                        <td>$${sale.totalAmount.toFixed(2)}</td>
                        <td>${sale.paymentMethod}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" style="text-align: center;">No sales recorded yet</td></tr>';
        }

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }

        showToast(message, type = 'info') {
            // Remove existing toasts
            document.querySelectorAll('.toast').forEach(toast => toast.remove());
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            // Auto remove after 3 seconds
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }

        loadInventoryReports() {
            // Load inventory reports data
            const products = dataManager.getProducts();
            const tableBody = document.getElementById('inventory-report-table-body');

            if (tableBody) {
                tableBody.innerHTML = products.length > 0
                    ? products.map(product => {
                        const status = product.stock === 0 ? 'Out of Stock' :
                                    product.stock < 10 ? 'Low Stock' : 'In Stock';
                        const statusClass = product.stock === 0 ? 'status-out-of-stock' :
                                        product.stock < 10 ? 'status-low-stock' : 'status-in-stock';

                        return `
                            <tr>
                                <td>${product.name}</td>
                                <td>${product.category}</td>
                                <td>$${product.price.toFixed(2)}</td>
                                <td>${product.stock}</td>
                                <td>
                                    <span class="status-badge ${statusClass}">${status}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')
                    : '<tr><td colspan="5" style="text-align: center;">No inventory data available</td></tr>';
            }

            // Calculate summary statistics
            const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
            const totalItems = products.reduce((sum, product) => sum + product.stock, 0);
            const lowStockItems = products.filter(product => product.stock < 10).length;
            const outOfStockItems = products.filter(product => product.stock === 0).length;

            // Update summary UI
            document.getElementById('total-inventory-value').textContent = `$${totalValue.toFixed(2)}`;
            document.getElementById('total-inventory-items').textContent = totalItems;
            document.getElementById('low-stock-count').textContent = lowStockItems;
            document.getElementById('out-of-stock-count').textContent = outOfStockItems;

        }

        loadPaymentReports() {
            // Load payment reports data
            const sales = dataManager.getSales();
            const tableBody = document.getElementById('payment-report-table-body');

            if (tableBody) {
                tableBody.innerHTML = sales.length > 0
                    ? sales.map(sale => {
                        const paymentStatus = sale.paymentMethod ? 'Paid' : 'Pending';
                        const statusClass = sale.paymentMethod ? 'status-paid' : 'status-pending';

                        return `
                            <tr>
                                <td>${sale.id}</td>
                                <td>${this.formatDate(sale.date)}</td>
                                <td>$${sale.totalAmount.toFixed(2)}</td>
                                <td>${sale.paymentMethod || 'N/A'}</td>
                                <td>
                                    <span class="status-badge ${statusClass}">${paymentStatus}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')
                    : '<tr><td colspan="5" style="text-align: center;">No payment data available</td></tr>';
            }

            // Calculate summary statistics
            const totalPayments = sales.filter(sale => sale.paymentMethod).length;
            const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
            const cashPayments = sales.filter(sale => sale.paymentMethod === 'Cash').length;
            const cardPayments = sales.filter(sale => sale.paymentMethod === 'Card').length;
            const pendingPayments = sales.filter(sale => !sale.paymentMethod).length;

            // Update summary UI
            document.getElementById('total-payments').textContent = totalPayments;
            document.getElementById('total-payment-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
            document.getElementById('cash-payments').textContent = cashPayments;
            document.getElementById('card-payments').textContent = cardPayments;
            document.getElementById('pending-payments').textContent = pendingPayments;

            this.showToast('Payment reports loaded successfully!', 'success');
        }

        loadSettings() {
            // Load settings from dataManager
            const settings = dataManager.getSettings();

            // Populate basic settings
            document.getElementById('business-name').value = settings.businessName || '';
            document.getElementById('store-address').value = settings.storeAddress || '';
            document.getElementById('store-phone').value = settings.storePhone || '';
            document.getElementById('store-email').value = settings.storeEmail || '';
            document.getElementById('currency-symbol').value = settings.currencySymbol || '$';
            document.getElementById('tax-rate').value = settings.taxRate || 0;
            document.getElementById('store-hours').value = settings.storeHours || '';
            document.getElementById('loyalty-program').value = settings.loyaltyProgram || 'enabled';

            // Populate inventory settings
            document.getElementById('low-stock-threshold').value = settings.lowStockThreshold || 10;
            document.getElementById('default-reorder-point').value = settings.defaultReorderPoint || 5;
            document.getElementById('auto-reorder').value = settings.autoReorder || 'true';
            document.getElementById('barcode-scanning').value = settings.barcodeScanning || 'true';
            document.getElementById('inventory-categories').value = settings.inventoryCategories || 'Fruits & Vegetables\nDairy & Eggs\nMeat & Poultry\nBakery\nBeverages\nSnacks\nFrozen Foods\nHousehold';

            // Populate advanced settings
            document.getElementById('debug-mode').value = settings.debugMode || 'false';
            document.getElementById('performance-monitoring').value = settings.performanceMonitoring || 'false';
            document.getElementById('database-optimization').value = settings.databaseOptimization || 'auto';
            document.getElementById('maintenance-schedule').value = settings.maintenanceSchedule || 'weekly';
            document.getElementById('workflow-automation').value = settings.workflowAutomation || 'false';

            // Update completion status
            this.updateSettingsCompletion();

            this.showToast('Settings loaded successfully!', 'success');
        }

        handleSettingsSubmit(e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(e.target);
            const settings = {
                // Store information
                businessName: formData.get('businessName'),
                storeAddress: formData.get('storeAddress'),
                storePhone: formData.get('storePhone'),
                storeEmail: formData.get('storeEmail'),
                currencySymbol: formData.get('currencySymbol'),
                taxRate: parseFloat(formData.get('taxRate')) || 0,
                storeHours: formData.get('storeHours'),
                loyaltyProgram: formData.get('loyaltyProgram'),

                // Inventory settings
                lowStockThreshold: parseInt(formData.get('lowStockThreshold')) || 10,
                defaultReorderPoint: parseInt(formData.get('defaultReorderPoint')) || 5,
                autoReorder: formData.get('autoReorder'),
                barcodeScanning: formData.get('barcodeScanning'),
                inventoryCategories: formData.get('inventoryCategories'),

                // Advanced settings
                debugMode: formData.get('debugMode'),
                performanceMonitoring: formData.get('performanceMonitoring'),
                databaseOptimization: formData.get('databaseOptimization'),
                maintenanceSchedule: formData.get('maintenanceSchedule'),
                workflowAutomation: formData.get('workflowAutomation')
            };

            // Save settings
            const success = dataManager.saveSettings(settings);
            if (success) {
                this.showToast('Settings saved successfully!', 'success');
                // Reload dashboard to reflect changes
                this.loadDashboard();
            } else {
                this.showToast('Error saving settings', 'error');
            }
        }

        resetSettings() {
            if (confirm('Are you sure you want to reset all settings to defaults?')) {
                dataManager.resetSettings();
                this.loadSettings();
                this.showToast('Settings reset to defaults!', 'success');
            }
        }

        showSettingsTab(tabName) {
            // Hide all settings tabs
            const tabs = document.querySelectorAll('.settings-tab');
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });

            // Remove active class from all tab buttons
            const tabButtons = document.querySelectorAll('.tab-btn');
            tabButtons.forEach(button => {
                button.classList.remove('active');
            });

            // Show selected tab
            const selectedTab = document.getElementById(`${tabName}-tab`);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }

            // Add active class to clicked button
            const activeButton = document.querySelector(`.tab-btn[onclick="showSettingsTab('${tabName}')"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }

        updateSettingsCompletion() {
            // Calculate completion percentage based on filled settings
            const settings = dataManager.getSettings();
            let filledFields = 0;
            let totalFields = 0;

            // Basic settings (8 fields)
            const basicFields = ['businessName', 'storeAddress', 'storePhone', 'storeEmail', 'currencySymbol', 'taxRate', 'storeHours', 'loyaltyProgram'];
            basicFields.forEach(field => {
                totalFields++;
                if (settings[field] && settings[field] !== '') filledFields++;
            });

            // Inventory settings (5 fields)
            const inventoryFields = ['lowStockThreshold', 'defaultReorderPoint', 'autoReorder', 'barcodeScanning', 'inventoryCategories'];
            inventoryFields.forEach(field => {
                totalFields++;
                if (settings[field] !== undefined && settings[field] !== null && settings[field] !== '') filledFields++;
            });

            // Advanced settings (5 fields)
            const advancedFields = ['debugMode', 'performanceMonitoring', 'databaseOptimization', 'maintenanceSchedule', 'workflowAutomation'];
            advancedFields.forEach(field => {
                totalFields++;
                if (settings[field] !== undefined && settings[field] !== null && settings[field] !== '') filledFields++;
            });

            const completionPercentage = Math.round((filledFields / totalFields) * 100);

            // Update UI
            const completionElement = document.getElementById('settings-completion-percentage');
            const progressBar = document.getElementById('settings-progress-bar');

            if (completionElement) {
                completionElement.textContent = `${completionPercentage}%`;
            }

            if (progressBar) {
                progressBar.style.width = `${completionPercentage}%`;
                progressBar.className = `progress-fill ${completionPercentage === 100 ? 'complete' : completionPercentage >= 75 ? 'good' : completionPercentage >= 50 ? 'moderate' : 'low'}`;
            }
        }

        filterSettings() {
            const searchTerm = document.getElementById('settings-search').value.toLowerCase();
            const settingCards = document.querySelectorAll('.setting-card');

            settingCards.forEach(card => {
                const cardText = card.textContent.toLowerCase();
                const isVisible = cardText.includes(searchTerm);
                card.style.display = isVisible ? 'block' : 'none';
            });

            // Update card count
            const visibleCards = document.querySelectorAll('.setting-card[style*="display: block"], .setting-card:not([style*="display"])');
            const totalCards = settingCards.length;
            const countElement = document.getElementById('settings-card-count');

            if (countElement) {
                countElement.textContent = `Showing ${visibleCards.length} of ${totalCards} settings`;
            }
        }

        expandAllCards() {
            const settingCards = document.querySelectorAll('.setting-card');
            settingCards.forEach(card => {
                card.classList.add('expanded');
            });

            // Update button states
            const expandBtn = document.getElementById('expand-all-btn');
            const collapseBtn = document.getElementById('collapse-all-btn');

            if (expandBtn) expandBtn.classList.add('active');
            if (collapseBtn) collapseBtn.classList.remove('active');
        }

        collapseAllCards() {
            const settingCards = document.querySelectorAll('.setting-card');
            settingCards.forEach(card => {
                card.classList.remove('expanded');
            });

            // Update button states
            const expandBtn = document.getElementById('expand-all-btn');
            const collapseBtn = document.getElementById('collapse-all-btn');

            if (expandBtn) expandBtn.classList.remove('active');
            if (collapseBtn) collapseBtn.classList.add('active');
        }

        showSettingsHelp() {
            const helpModal = document.getElementById('settings-help-modal');
            if (helpModal) {
                helpModal.style.display = 'block';
            } else {
                // Create help modal if it doesn't exist
                this.createSettingsHelpModal();
            }
        }

        createSettingsHelpModal() {
            const modal = document.createElement('div');
            modal.id = 'settings-help-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content help-modal">
                    <div class="modal-header">
                        <h2><i class="fas fa-question-circle"></i> Settings Help</h2>
                        <span class="close" onclick="document.getElementById('settings-help-modal').style.display='none'">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="help-section">
                            <h3>Basic Settings</h3>
                            <ul>
                                <li><strong>Business Name:</strong> Your store's official name</li>
                                <li><strong>Store Address:</strong> Complete address for receipts and records</li>
                                <li><strong>Store Phone:</strong> Contact number for customers</li>
                                <li><strong>Store Email:</strong> Email for business communications</li>
                                <li><strong>Currency Symbol:</strong> Symbol for your local currency</li>
                                <li><strong>Tax Rate:</strong> Default tax percentage for sales</li>
                                <li><strong>Store Hours:</strong> Operating hours for reference</li>
                                <li><strong>Loyalty Program:</strong> Enable/disable customer loyalty features</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h3>Inventory Settings</h3>
                            <ul>
                                <li><strong>Low Stock Threshold:</strong> Minimum stock level before alert</li>
                                <li><strong>Default Reorder Point:</strong> Suggested reorder quantity</li>
                                <li><strong>Auto Reorder:</strong> Automatic reorder when stock is low</li>
                                <li><strong>Barcode Scanning:</strong> Enable barcode scanner support</li>
                                <li><strong>Inventory Categories:</strong> Product categories for organization</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h3>Advanced Settings</h3>
                            <ul>
                                <li><strong>Debug Mode:</strong> Enable detailed logging for troubleshooting</li>
                                <li><strong>Performance Monitoring:</strong> Track system performance metrics</li>
                                <li><strong>Database Optimization:</strong> Automatic database maintenance</li>
                                <li><strong>Maintenance Schedule:</strong> When to run system maintenance</li>
                                <li><strong>Workflow Automation:</strong> Automate repetitive tasks</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';
        }

        initializeTooltips() {
            // Initialize tooltips for settings elements
            const tooltipElements = document.querySelectorAll('[data-tooltip]');

            tooltipElements.forEach(element => {
                element.addEventListener('mouseenter', (e) => this.showTooltip(e));
                element.addEventListener('mouseleave', () => this.hideTooltip());
            });
        }

        showTooltip(event) {
            const element = event.target;
            const tooltipText = element.getAttribute('data-tooltip');

            if (!tooltipText) return;

            // Remove existing tooltips
            this.hideTooltip();

            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;

            document.body.appendChild(tooltip);

            // Position tooltip
            const rect = element.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 30}px`;

            // Adjust position if tooltip goes off screen
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.left < 0) {
                tooltip.style.left = '10px';
            } else if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
            }

            if (tooltipRect.top < 0) {
                tooltip.style.top = `${rect.bottom + 10}px`;
            }
        }

        hideTooltip() {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        }
    }

    // Initialize the system
    const posSystem = new POSSystem();

    // Global functions for HTML onclick handlers
    function showSection(sectionId) {
        posSystem.showSection(sectionId);
    }

    function logout() {
        posSystem.logout();
    }

    
    // Global function for HTML onclick handlers
    function addToCart(productId) {
        posSystem.addToCart(productId);
    }

    

    // Employee management functions
    function addEmployee() {
        showAddEmployeeForm();
    }

    function manageEmployees() {
        const modal = document.getElementById('employee-modal');
        if (modal) {
            modal.style.display = 'block';
            loadEmployees();
        }
    }

    // Access rights management functions
    function manageRoles() {
        const modal = document.getElementById('roles-modal');
        if (modal) {
            modal.style.display = 'block';
            loadRoles();
        }
    }

    function closeRolesModal() {
        const modal = document.getElementById('roles-modal');
        if (modal) {
            modal.style.display = 'none';
            // Clear any form data if needed
            const form = document.getElementById('role-form');
            if (form) {
                form.reset();
            }
        }
    }

    function showAddRoleForm() {
        const formModal = document.getElementById('role-form-modal');
        const formTitle = document.getElementById('role-form-title');
        const form = document.getElementById('role-form');

        if (formModal && formTitle && form) {
            formTitle.textContent = 'Add Role';
            form.reset();
            form.removeAttribute('data-editing-id');
            formModal.style.display = 'block';
        }
    }

    function closeRoleFormModal() {
        const modal = document.getElementById('role-form-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function loadRoles() {
        const roles = dataManager.getRoles();
        const rolesList = document.getElementById('roles-list');

        if (rolesList) {
            rolesList.innerHTML = roles.length > 0
                ? roles.map(role => `
                    <div class="role-item">
                        <div class="role-info">
                            <h3>${role.name}</h3>
                            <p>${role.description}</p>
                        </div>
                        <div class="role-actions">
                            <button class="btn btn-edit" onclick="editRole(${role.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-delete" onclick="deleteRole(${role.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('')
                : '<p>No roles found. Click "Add New Role" to create your first role.</p>';
        }
    }

    function editRole(id) {
        const roles = dataManager.getRoles();
        const role = roles.find(r => r.id === id);

        if (role) {
            const formModal = document.getElementById('role-form-modal');
            const formTitle = document.getElementById('role-form-title');
            const form = document.getElementById('role-form');
            const nameInput = document.getElementById('role-name');
            const descriptionInput = document.getElementById('role-description');

            if (formModal && formTitle && form && nameInput && descriptionInput) {
                formTitle.textContent = 'Edit Role';
                nameInput.value = role.name;
                descriptionInput.value = role.description;
                form.setAttribute('data-editing-id', id);
                formModal.style.display = 'block';
            }
        }
    }

    function deleteRole(id) {
        const roles = dataManager.getRoles();
        const role = roles.find(r => r.id === id);

        if (role && confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            const success = dataManager.deleteRole(id);
            if (success) {
                posSystem.showToast('Role deleted successfully!', 'success');
                loadRoles();
            } else {
                posSystem.showToast('Error deleting role', 'error');
            }
        }
    }

    function handleRoleFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const editingId = form.getAttribute('data-editing-id');
        const nameInput = document.getElementById('role-name');
        const descriptionInput = document.getElementById('role-description');

        if (!nameInput || !descriptionInput) return;

        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();

        // Validation
        if (!name) {
            posSystem.showToast('Role name is required', 'error');
            return;
        }

        if (!description) {
            posSystem.showToast('Role description is required', 'error');
            return;
        }

        const roleData = { name, description };

        try {
            if (editingId) {
                // Update existing role
                const success = dataManager.updateRole(parseInt(editingId), roleData);
                if (success) {
                    posSystem.showToast('Role updated successfully!', 'success');
                } else {
                    posSystem.showToast('Error updating role', 'error');
                    return;
                }
            } else {
                // Add new role
                dataManager.addRole(roleData);
                posSystem.showToast('Role added successfully!', 'success');
            }

            closeRoleFormModal();
            loadRoles();
        } catch (error) {
            posSystem.showToast('Error saving role', 'error');
        }
    }

    function setPermissions() {
        // Open a modal or section for setting permissions (basic implementation)
        const modal = document.getElementById('permissions-modal');
        if (modal) {
            modal.style.display = 'block';
            loadPermissions();
        } else {
            alert('Permissions modal not found. Please add the modal HTML.');
        }
    }

    // Close permissions modal
    function closePermissionsModal() {
        const modal = document.getElementById('permissions-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Close employee modal
    function closeEmployeeModal() {
        const modal = document.getElementById('employee-modal');
        if (modal) {
            modal.style.display = 'none';
            // Clear any form data if needed
            const form = document.getElementById('employee-form');
            if (form) {
                form.reset();
            }
        }
    }

    // Close employee form modal
    function closeEmployeeFormModal() {
        const modal = document.getElementById('employee-form-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Load permissions data
    function loadPermissions() {
        const permissionsList = document.getElementById('permissions-list');
        if (permissionsList) {
            const permissions = dataManager.getPermissions();
            const roles = dataManager.getRoles();

            if (roles.length === 0) {
                permissionsList.innerHTML = '<p>No roles available. Please create roles first.</p>';
                return;
            }

            // Create permissions interface for each role
            permissionsList.innerHTML = roles.map(role => {
                const rolePermissions = dataManager.getPermissionsByRole(role.id);

                return `
                    <div class="role-permissions">
                        <h4>${role.name}</h4>
                        <p class="role-description">${role.description}</p>
                        <div class="permissions-grid">
                            ${permissions.map(permission => `
                                <div class="permission-item">
                                    <label class="permission-checkbox">
                                        <input type="checkbox"
                                            id="perm-${role.id}-${permission.id}"
                                            data-role-id="${role.id}"
                                            data-permission-id="${permission.id}"
                                            ${rolePermissions.includes(permission.id) ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        <div class="permission-info">
                                            <strong>${permission.name}</strong>
                                            <small>${permission.description}</small>
                                        </div>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Save permissions
    function savePermissions() {
        const checkboxes = document.querySelectorAll('#permissions-list input[type="checkbox"]');
        const rolePermissionsMap = {};

        // Group permissions by role
        checkboxes.forEach(checkbox => {
            const roleId = parseInt(checkbox.getAttribute('data-role-id'));
            const permissionId = parseInt(checkbox.getAttribute('data-permission-id'));

            if (!rolePermissionsMap[roleId]) {
                rolePermissionsMap[roleId] = [];
            }

            if (checkbox.checked) {
                rolePermissionsMap[roleId].push(permissionId);
            }
        });

        // Save permissions for each role
        let successCount = 0;
        for (const [roleId, permissionIds] of Object.entries(rolePermissionsMap)) {
            const success = dataManager.updateRolePermissions(parseInt(roleId), permissionIds);
            if (success) {
                successCount++;
            }
        }

        if (successCount === Object.keys(rolePermissionsMap).length) {
            posSystem.showToast('Permissions updated successfully!', 'success');
            closePermissionsModal();
        } else {
            posSystem.showToast('Error updating some permissions', 'error');
        }
    }

    // Audit logs functions
    function loadAuditLogs() {
        // Load audit logs data
        const auditLogs = dataManager.getAuditLogs();
        const tableBody = document.getElementById('audit-logs-table-body');

        tableBody.innerHTML = auditLogs.length > 0
            ? auditLogs.map(log => `
                <tr>
                    <td>${posSystem.formatDate(log.timestamp)}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td>${log.details}</td>
                    <td>${log.ipAddress || 'N/A'}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="5" style="text-align: center;">No audit logs available</td></tr>';
    }

    function filterAuditLogs() {
        const filter = document.getElementById('audit-log-filter').value;
        const dateFrom = document.getElementById('audit-log-date-from').value;
        const dateTo = document.getElementById('audit-log-date-to').value;

        let filteredLogs = dataManager.getAuditLogs();

        // Filter by type
        if (filter !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.type === filter);
        }

        // Filter by date range
        if (dateFrom) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(dateFrom));
        }
        if (dateTo) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(dateTo));
        }

        const tableBody = document.getElementById('audit-logs-table-body');
        tableBody.innerHTML = filteredLogs.length > 0
            ? filteredLogs.map(log => `
                <tr>
                    <td>${posSystem.formatDate(log.timestamp)}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td>${log.details}</td>
                    <td>${log.ipAddress || 'N/A'}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="5" style="text-align: center;">No audit logs match the filter criteria</td></tr>';

        posSystem.showToast(`Filtered to ${filteredLogs.length} audit log entries`, 'info');
    }

    function exportAuditLogs() {
        const auditLogs = dataManager.getAuditLogs();
        if (auditLogs.length === 0) {
            posSystem.showToast('No audit logs to export', 'warning');
            return;
        }

        // Create CSV content
        const headers = ['Timestamp', 'User', 'Action', 'Details', 'IP Address'];
        const csvContent = [
            headers.join(','),
            ...auditLogs.map(log => [
                `"${posSystem.formatDate(log.timestamp)}"`,
                `"${log.user}"`,
                `"${log.action}"`,
                `"${log.details}"`,
                `"${log.ipAddress || 'N/A'}"`
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        posSystem.showToast('Audit logs exported successfully!', 'success');
    }
