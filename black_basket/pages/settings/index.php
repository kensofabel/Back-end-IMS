<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - Black Basket</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
            <!-- Content Area -->
            <div class="content-area">
                    <!-- Modern Settings Section -->
                <section id="settings-section" class="modern-settings">
                    <!-- Hero Header -->
                    <div class="settings-hero">
                        <div class="hero-content">
                            <div class="hero-text">
                                <h1 class="hero-title">
                                    <i class="fas fa-cogs"></i>
                                    General Settings
                                </h1>
                                <p class="hero-subtitle">Customize your Black Basket experience and manage your store preferences</p>
                            </div>
                            <div class="hero-actions">
                                <div class="search-container">
                                    <i class="fas fa-search search-icon"></i>
                                    <input type="text" class="search-input" placeholder="Search settings..." id="settings-search">
                                </div>
                                <!-- Quick Setup button removed -->
                            </div>
                        </div>
                        
                        <!-- Quick Stats -->
                        <div class="quick-stats">
                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-number" id="completed-settings">0</span>
                                    <span class="stat-label">Completed</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-number" id="pending-settings">12</span>
                                    <span class="stat-label">Pending</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-number" id="secure-percent">100%</span>
                                    <span class="stat-label" id="secure-label">Secure</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Settings Navigation (Tabs) -->
                    <div class="settings-navigation">
                        <div class="nav-tabs" role="tablist" aria-label="Settings sections">
                            <button class="nav-tab active" data-tab="general"> <i class="fas fa-cog"></i> General</button>
                            <button class="nav-tab" data-tab="notifications"> <i class="fas fa-bell"></i> Notifications</button>
                            <button class="nav-tab" data-tab="payments"> <i class="fas fa-coins"></i> Payments</button>
                            <button class="nav-tab" data-tab="preferences"> <i class="fas fa-sliders-h"></i> Preferences</button>
                            <button class="nav-tab" data-tab="advanced"> <i class="fas fa-code"></i> Advanced</button>
                        </div>
                    </div>

                    <!-- Settings Content -->
                    <div class="settings-container">
                        <!-- General Tab -->
                        <div class="settings-tab active" id="general-tab">
                            <div class="settings-grid">
                                
                                <!-- Business Profile Card -->
                                <div class="setting-card featured" data-cats="general notifications payments preferences advanced">
                                    <div class="card-header">
                                        <div class="card-icon">
                                            <i class="fas fa-building"></i>
                                        </div>
                                        <div class="card-title">
                                            <h3>Business Profile</h3>
                                            <p>Essential information about your business</p>
                                        </div>
                                        <div class="card-status">
                                            <span class="status-badge incomplete">Incomplete</span>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-grid">
                                            <div class="input-group">
                                                <label for="business-name">
                                                    <i class="fas fa-store"></i>
                                                    Business Name
                                                </label>
                                                <input type="text" id="business-name" placeholder="Enter your business name" class="modern-input">
                                                <div class="input-helper">This appears on receipts and reports</div>
                                            </div>
                                            <div class="input-group">
                                                <label for="business-type">
                                                    <i class="fas fa-tag"></i>
                                                    Business Type
                                                </label>
                                                <select id="business-type" class="modern-select">
                                                    <option value="">Select business type</option>
                                                    <option value="retail">Retail Store</option>
                                                    <option value="restaurant">Restaurant</option>
                                                    <option value="service">Service Business</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div class="input-group full-width">
                                                <label for="business-address">
                                                    <i class="fas fa-map-marker-alt"></i>
                                                    Business Address
                                                </label>
                                                <input type="text" id="business-address" placeholder="Enter your complete address" class="modern-input">
                                            </div>
                                            <div class="input-group">
                                                <label for="business-phone">
                                                    <i class="fas fa-phone"></i>
                                                    Phone Number
                                                </label>
                                                <input type="tel" id="business-phone" placeholder="(555) 123-4567" class="modern-input">
                                            </div>
                                            <div class="input-group">
                                                <label for="business-email">
                                                    <i class="fas fa-envelope"></i>
                                                    Email Address
                                                </label>
                                                <input type="email" id="business-email" placeholder="business@example.com" class="modern-input">
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <!-- Currency & Tax Card -->
                                <div class="setting-card" data-cats="general notifications payments preferences advanced">
                                    <div class="card-header">
                                        <div class="card-icon">
                                            <i class="fas fa-peso-sign"></i>
                                        </div>
                                        <div class="card-title">
                                            <h3>Currency & Tax</h3>
                                            <p>Financial settings and tax configuration</p>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-grid">
                                            <div class="input-group">
                                                <label for="currency">
                                                    <i class="fas fa-coins"></i>
                                                    Currency
                                                </label>
                                                <select id="currency" class="modern-select">
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="CAD">CAD (C$)</option>
                                                    <option value="PHP" selected>PHP (₱)</option>
                                                </select>
                                            </div>
                                            <div class="input-group">
                                                <label for="tax-rate">
                                                    <i class="fas fa-percentage"></i>
                                                    Tax Rate (%)
                                                </label>
                                                <input type="number" id="tax-rate" placeholder="8.25" step="0.01" min="0" max="100" class="modern-input">
                                            </div>
                                            <div class="input-group full-width">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="settings-grid">
                                    <div class="setting-card" data-cats="general notifications payments preferences advanced">
                                        <div class="card-header">
                                            <div class="card-icon">
                                                <i class="fas fa-bell"></i>
                                            </div>
                                            <div class="card-title">
                                                <h3>Notification Preferences</h3>
                                                <p>Choose what notifications you want to receive</p>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="notification-groups">
                                                <div class="notification-group">
                                                    <h4><i class="fas fa-shopping-cart"></i> Sales & Orders</h4>
                                                    <div class="notification-items">
                                                        <div class="notification-item">
                                                            <div class="notification-info">
                                                                <span>New sales</span>
                                                                <small>Get notified when a sale is made</small>
                                                            </div>
                                                            <div class="toggle-switch">
                                                                <input type="checkbox" id="sales-new" checked>
                                                                <label for="sales-new"></label>
                                                            </div>
                                                        </div>
                                                        <div class="notification-item">
                                                            <div class="notification-info">
                                                                <span>Large transactions</span>
                                                                <small>Sales over $100</small>
                                                            </div>
                                                            <div class="toggle-switch">
                                                                <input type="checkbox" id="sales-large">
                                                                <label for="sales-large"></label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="notification-group">
                                                    <h4><i class="fas fa-boxes"></i> Inventory</h4>
                                                    <div class="notification-items">
                                                        <div class="notification-item">
                                                            <div class="notification-info">
                                                                <span>Low stock alerts</span>
                                                                <small>When items are running low</small>
                                                            </div>
                                                            <div class="toggle-switch">
                                                                <input type="checkbox" id="inventory-low" checked>
                                                                <label for="inventory-low"></label>
                                                            </div>
                                                        </div>
                                                        <div class="notification-item">
                                                            <div class="notification-info">
                                                                <span>Out of stock</span>
                                                                <small>When items are completely out</small>
                                                            </div>
                                                            <div class="toggle-switch">
                                                                <input type="checkbox" id="inventory-out" checked>
                                                                <label for="inventory-out"></label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                
                    <!-- Save Actions -->
                    <div class="save-section">
                        <div class="save-container">
                            <div class="save-info">
                                <div class="auto-save-indicator">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <span>Auto-save enabled</span>
                                </div>
                                <div class="last-saved">
                                    <small id="last-saved-time">Last saved: Never</small>
                                </div>
                            </div>
                            <div class="save-actions">
                                <button class="modern-btn secondary" onclick="resetSettings()">
                                    <i class="fas fa-undo"></i>
                                    Reset to Defaults
                                </button>
                                <button class="modern-btn primary" id="save-settings-btn">
                                    <i class="fas fa-save"></i>
                                    Save All Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
    <script src="settings.js"></script>
</body>
</html>
