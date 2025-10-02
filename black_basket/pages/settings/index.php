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
                                    Settings
                                </h1>
                                <p class="hero-subtitle">Customize your Black Basket experience and manage your store preferences</p>
                            </div>
                            <div class="hero-actions">
                                <div class="search-container">
                                    <i class="fas fa-search search-icon"></i>
                                    <input type="text" class="search-input" placeholder="Search settings..." id="settings-search">
                                </div>
                                <button class="hero-btn" onclick="showQuickSetup()" title="Quick Setup">
                                    <i class="fas fa-magic"></i>
                                </button>
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

                    <!-- Navigation Tabs -->
                    <div class="settings-navigation">
                        <nav class="nav-tabs">
                            <button class="nav-tab active" data-tab="general">
                                <i class="fas fa-store"></i>
                                <span>General</span>
                            </button>
                            <button class="nav-tab" data-tab="notifications">
                                <i class="fas fa-bell"></i>
                                <span>Notifications</span>
                            </button>
                            <button class="nav-tab" data-tab="advanced">
                                <i class="fas fa-cog"></i>
                                <span>Advanced</span>
                            </button>
                        </nav>
                    </div>

                    <!-- Settings Content -->
                    <div class="settings-container">
                        <!-- General Tab -->
                        <div class="settings-tab active" id="general-tab">
                            <div class="settings-grid">
                                
                                <!-- Business Profile Card -->
                                <div class="setting-card featured">
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
                                <div class="setting-card">
                                    <div class="card-header">
                                        <div class="card-icon">
                                            <i class="fas fa-dollar-sign"></i>
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
                                                    <option value="PHP">PHP (₱)</option>
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
                                                <label>
                                                    <i class="fas fa-credit-card"></i>
                                                    Payment Methods
                                                </label>
                                                <div class="payment-methods">
                                                    <label class="modern-checkbox">
                                                        <input type="checkbox" checked>
                                                        <span class="checkbox-mark"></span>
                                                        <i class="fas fa-money-bill-wave"></i>
                                                        Cash
                                                    </label>
                                                    <label class="modern-checkbox">
                                                        <input type="checkbox" checked>
                                                        <span class="checkbox-mark"></span>
                                                        <i class="fas fa-credit-card"></i>
                                                        Credit/Debit Card
                                                    </label>
                                                    <label class="modern-checkbox">
                                                        <input type="checkbox">
                                                        <span class="checkbox-mark"></span>
                                                        <i class="fab fa-paypal"></i>
                                                        Digital Wallet
                                                    </label>
                                                    <label class="modern-checkbox">
                                                        <input type="checkbox">
                                                        <span class="checkbox-mark"></span>
                                                        <i class="fas fa-handshake"></i>
                                                        Store Credit
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Preferences Card -->
                                <div class="setting-card">
                                    <div class="card-header">
                                        <div class="card-icon">
                                            <i class="fas fa-sliders-h"></i>
                                        </div>
                                        <div class="card-title">
                                            <h3>Preferences</h3>
                                            <p>Interface and system preferences</p>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-grid">
                                            <div class="input-group">
                                                <label for="language">
                                                    <i class="fas fa-globe"></i>
                                                    Language
                                                </label>
                                                <select id="language" class="modern-select">
                                                    <option value="en">English</option>
                                                    <option value="es">Spanish</option>
                                                    <option value="fr">French</option>
                                                    <option value="de">German</option>
                                                </select>
                                            </div>
                                            <div class="input-group">
                                                <label for="timezone">
                                                    <i class="fas fa-clock"></i>
                                                    Time Zone
                                                </label>
                                                <select id="timezone" class="modern-select">
                                                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                                                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                                                    <option value="UTC+0">GMT (UTC+0)</option>
                                                    <option value="UTC+1">Central European (UTC+1)</option>
                                                </select>
                                            </div>
                                            <div class="input-group">
                                                <label for="date-format">
                                                    <i class="fas fa-calendar-alt"></i>
                                                    Date Format
                                                </label>
                                                <select id="date-format" class="modern-select">
                                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                </select>
                                            </div>
                                            <div class="input-group">
                                                <label for="theme">
                                                    <i class="fas fa-palette"></i>
                                                    Theme
                                                </label>
                                                <select id="theme" class="modern-select">
                                                    <option value="dark">Dark Theme</option>
                                                    <option value="light">Light Theme</option>
                                                    <option value="auto">Auto (System)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>


                        <!-- Notifications Tab -->
                        <div class="settings-tab" id="notifications-tab">
                            <div class="settings-grid">
                                <div class="setting-card">
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
                        </div>


                        <!-- Advanced Tab -->
                        <div class="settings-tab" id="advanced-tab">
                            <div class="settings-grid">
                                <div class="setting-card">
                                    <div class="card-header">
                                        <div class="card-icon">
                                            <i class="fas fa-code"></i>
                                        </div>
                                        <div class="card-title">
                                            <h3>Advanced Settings</h3>
                                            <p>System configuration and developer options</p>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="advanced-options">
                                            <div class="option-item">
                                                <label>Debug Mode</label>
                                                <div class="toggle-switch">
                                                    <input type="checkbox" id="debug-mode">
                                                    <label for="debug-mode"></label>
                                                </div>
                                            </div>
                                            <div class="option-item">
                                                <label>Auto Backup</label>
                                                <div class="toggle-switch">
                                                    <input type="checkbox" id="auto-backup" checked>
                                                    <label for="auto-backup"></label>
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
