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
    <title>Inventory Management System</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
            <!-- Content Area -->
            <div class="content-area">
                    <!-- Settings Section -->
                <section id="settings-section" class="section active">
                    <div class="section-header">
                        <h2>Settings</h2>
                    </div>
                    <div class="settings-content">
                        <div class="settings-tabs">
                            <button class="tab-btn active" onclick="showSettingsTab('general')">General</button>
                            <button class="tab-btn" onclick="showSettingsTab('inventory')">Inventory</button>
                            <button class="tab-btn" onclick="showSettingsTab('advanced')">Advanced</button>
                        </div>

                        <div id="general-tab" class="settings-tab active">
                            <div class="settings-overview">
                                <div class="settings-header">
                                    <div class="settings-title-section">
                                        <h3><i class="fas fa-cog"></i> General Settings</h3>
                                        <p class="settings-description">Configure your business information, preferences, and system settings</p>
                                    </div>
                                    <div class="settings-actions">
                                        <div class="settings-search">
                                            <input type="text" id="settings-search" placeholder="Search settings..." oninput="filterSettings(this.value)">
                                            <i class="fas fa-search"></i>
                                        </div>
                                        <div class="quick-actions">
                                            <button class="quick-action-btn" onclick="expandAllCards()" title="Expand All">
                                                <i class="fas fa-expand-arrows-alt"></i>
                                            </button>
                                            <button class="quick-action-btn" onclick="collapseAllCards()" title="Collapse All">
                                                <i class="fas fa-compress-arrows-alt"></i>
                                            </button>
                                            <button class="quick-action-btn" onclick="showSettingsHelp()" title="Help">
                                                <i class="fas fa-question-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="settings-status">
                                    <div class="status-indicators">
                                        <span class="status-indicator" id="settings-status">
                                            <i class="fas fa-circle"></i> Settings loaded
                                        </span>
                                        <span class="completion-indicator" id="settings-completion">
                                            <i class="fas fa-chart-pie"></i> <span id="completion-percent">0%</span> Complete
                                        </span>
                                    </div>
                                    <div class="auto-save-toggle">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="auto-save-toggle" checked>
                                            <span class="toggle-slider"></span>
                                        </label>
                                        <span class="toggle-label">Auto-save</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Settings Summary Card -->
                            <div class="settings-summary-card">
                                <div class="summary-header">
                                    <i class="fas fa-tachometer-alt"></i>
                                    <h4>Settings Overview</h4>
                                </div>
                                <div class="summary-content">
                                    <div class="summary-item">
                                        <span class="summary-label">Business Info</span>
                                        <div class="summary-progress">
                                            <div class="progress-bar" id="business-progress" style="width: 0%"></div>
                                        </div>
                                        <span class="summary-value" id="business-complete">0/4</span>
                                    </div>
                                    <div class="summary-item">
                                        <span class="summary-label">Financial</span>
                                        <div class="summary-progress">
                                            <div class="progress-bar" id="financial-progress" style="width: 0%"></div>
                                        </div>
                                        <span class="summary-value" id="financial-complete">0/3</span>
                                    </div>
                                    <div class="summary-item">
                                        <span class="summary-label">System</span>
                                        <div class="summary-progress">
                                            <div class="progress-bar" id="system-progress" style="width: 0%"></div>
                                        </div>
                                        <span class="summary-value" id="system-complete">0/4</span>
                                    </div>
                                    <div class="summary-item">
                                        <span class="summary-label">Notifications</span>
                                        <div class="summary-progress">
                                            <div class="progress-bar" id="notification-progress" style="width: 0%"></div>
                                        </div>
                                        <span class="summary-value" id="notification-complete">0/3</span>
                                    </div>
                                </div>
                            </div>

                            <div class="settings-cards-grid">
                                <!-- Business Information Card -->
                                <div class="settings-card" data-tooltip="Configure your business details and contact information">
                                    <div class="card-header">
                                        <i class="fas fa-building"></i>
                                        <h4>Business Information</h4>
                                        <div class="card-actions">
                                            <button class="card-expand-btn" onclick="toggleCardExpansion(this)">
                                                <i class="fas fa-chevron-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-content">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="business-name" data-tooltip="Your business name as it appears on receipts and reports">
                                                    <i class="fas fa-store"></i> Business Name
                                                </label>
                                                <input type="text" id="business-name" name="businessName" placeholder="Enter your business name" maxlength="100">
                                                <div class="field-feedback"></div>
                                            </div>
                                            <div class="form-group">
                                                <label for="store-address" data-tooltip="Complete address for your store location">
                                                    <i class="fas fa-map-marker-alt"></i> Store Address
                                                </label>
                                                <input type="text" id="store-address" name="storeAddress" placeholder="Enter store address" maxlength="200">
                                                <div class="field-feedback"></div>
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="store-phone" data-tooltip="Primary contact phone number">
                                                    <i class="fas fa-phone"></i> Phone Number
                                                </label>
                                                <input type="tel" id="store-phone" name="storePhone" placeholder="(555) 123-4567" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">
                                                <div class="field-feedback"></div>
                                            </div>
                                            <div class="form-group">
                                                <label for="store-email" data-tooltip="Business email address for communications">
                                                    <i class="fas fa-envelope"></i> Email Address
                                                </label>
                                                <input type="email" id="store-email" name="storeEmail" placeholder="contact@yourstore.com">
                                                <div class="field-feedback"></div>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="store-hours" data-tooltip="Operating hours for your store">
                                                <i class="fas fa-clock"></i> Store Hours
                                            </label>
                                            <textarea id="store-hours" name="storeHours" rows="3" placeholder="Mon-Fri: 9AM-6PM&#10;Sat: 10AM-4PM&#10;Sun: Closed" maxlength="500"></textarea>
                                            <div class="field-feedback"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Financial Settings Card -->
                                <div class="settings-card" data-tooltip="Configure pricing, taxes, and payment options">
                                    <div class="card-header">
                                        <i class="fas fa-dollar-sign"></i>
                                        <h4>Financial Settings</h4>
                                        <div class="card-actions">
                                            <button class="card-expand-btn" onclick="toggleCardExpansion(this)">
                                                <i class="fas fa-chevron-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-content">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="currency-symbol" data-tooltip="Currency symbol for your region">
                                                    <i class="fas fa-coins"></i> Currency Symbol
                                                </label>
                                                <input type="text" id="currency-symbol" name="currencySymbol" maxlength="3" placeholder="$" value="$">
                                                <div class="field-feedback"></div>
                                            </div>
                                            <div class="form-group">
                                                <label for="tax-rate" data-tooltip="Default tax rate applied to sales">
                                                    <i class="fas fa-percentage"></i> Tax Rate (%)
                                                </label>
                                                <input type="number" id="tax-rate" name="taxRate" step="0.01" min="0" max="100" placeholder="8.25">
                                                <div class="field-feedback"></div>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="payment-types" data-tooltip="Select accepted payment methods">
                                                <i class="fas fa-credit-card"></i> Payment Types
                                            </label>
                                            <div class="payment-types-grid">
                                                <label class="checkbox-option">
                                                    <input type="checkbox" name="paymentCash" checked>
                                                    <span class="checkmark"></span>
                                                    <i class="fas fa-money-bill-wave"></i> Cash
                                                </label>
                                                <label class="checkbox-option">
                                                    <input type="checkbox" name="paymentCard" checked>
                                                    <span class="checkmark"></span>
                                                    <i class="fas fa-credit-card"></i> Card
                                                </label>
                                                <label class="checkbox-option">
                                                    <input type="checkbox" name="paymentDigital">
                                                    <span class="checkmark"></span>
                                                    <i class="fas fa-mobile-alt"></i> Digital Wallet
                                                </label>
                                                <label class="checkbox-option">
                                                    <input type="checkbox" name="paymentCredit">
                                                    <span class="checkmark"></span>
                                                    <i class="fas fa-hand-holding-usd"></i> Credit
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- System Preferences Card -->
                                <div class="settings-card" data-tooltip="Customize system behavior and appearance">
                                    <div class="card-header">
                                        <i class="fas fa-sliders-h"></i>
                                        <h4>System Preferences</h4>
                                        <div class="card-actions">
                                            <button class="card-expand-btn" onclick="toggleCardExpansion(this)">
                                                <i class="fas fa-chevron-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-content">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="language" data-tooltip="Interface language">
                                                    <i class="fas fa-globe"></i> Language
                                                </label>
                                                <select id="language" name="language">
                                                    <option value="en">English</option>
                                                    <option value="es">Spanish</option>
                                                    <option value="fr">French</option>
                                                    <option value="de">German</option>
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label for="timezone" data-tooltip="Your local time zone">
                                                    <i class="fas fa-clock"></i> Time Zone
                                                </label>
                                                <select id="timezone" name="timezone">
                                                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                                                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                                                    <option value="UTC+0">GMT (UTC+0)</option>
                                                    <option value="UTC+1">Central European Time (UTC+1)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="date-format" data-tooltip="Preferred date display format">
                                                    <i class="fas fa-calendar-alt"></i> Date Format
                                                </label>
                                                <select id="date-format" name="dateFormat">
                                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label for="loyalty-program" data-tooltip="Enable customer loyalty program">
                                                    <i class="fas fa-gift"></i> Loyalty Program
                                                </label>
                                                <select id="loyalty-program" name="loyaltyProgram">
                                                    <option value="enabled">Enabled</option>
                                                    <option value="disabled">Disabled</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="theme-mode" data-tooltip="Choose your preferred theme">
                                                    <i class="fas fa-palette"></i> Theme Mode
                                                </label>
                                                <select id="theme-mode" name="themeMode">
                                                    <option value="light">Light</option>
                                                    <option value="dark">Dark</option>
                                                    <option value="auto">Auto (System)</option>
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label for="notifications" data-tooltip="Enable system notifications">
                                                    <i class="fas fa-bell"></i> Notifications
                                                </label>
                                                <select id="notifications" name="notifications">
                                                    <option value="enabled">Enabled</option>
                                                    <option value="disabled">Disabled</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Notification Preferences Card -->
                                <div class="settings-card" data-tooltip="Configure notification settings and preferences">
                                    <div class="card-header">
                                        <i class="fas fa-bell"></i>
                                        <h4>Notification Preferences</h4>
                                        <div class="card-actions">
                                            <button class="card-expand-btn" onclick="toggleCardExpansion(this)">
                                                <i class="fas fa-chevron-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-content">
                                        <div class="notification-settings">
                                            <div class="notification-group">
                                                <h5><i class="fas fa-shopping-cart"></i> Sales Notifications</h5>
                                                <div class="notification-options">
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifyNewSale" checked>
                                                        <span class="checkmark"></span>
                                                        New sales
                                                    </label>
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifyLargeSale">
                                                        <span class="checkmark"></span>
                                                        Large transactions (>$100)
                                                    </label>
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifyDailySummary" checked>
                                                        <span class="checkmark"></span>
                                                        Daily sales summary
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="notification-group">
                                                <h5><i class="fas fa-boxes"></i> Inventory Notifications</h5>
                                                <div class="notification-options">
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifyLowStock" checked>
                                                        <span class="checkmark"></span>
                                                        Low stock alerts
                                                    </label>
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifyOutOfStock">
                                                        <span class="checkmark"></span>
                                                        Out of stock items
                                                    </label>
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifyStockUpdates">
                                                        <span class="checkmark"></span>
                                                        Stock level changes
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="notification-group">
                                                <h5><i class="fas fa-user"></i> System Notifications</h5>
                                                <div class="notification-options">
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifyUserLogin" checked>
                                                        <span class="checkmark"></span>
                                                        User login/logout
                                                    </label>
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifySystemUpdates">
                                                        <span class="checkmark"></span>
                                                        System updates
                                                    </label>
                                                    <label class="checkbox-option">
                                                        <input type="checkbox" name="notifyErrors">
                                                        <span class="checkmark"></span>
                                                        Error notifications
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="settings-actions">
                                <div class="action-buttons">
                                    <button type="submit" form="settings-form" class="btn btn-primary" id="save-settings-btn">
                                        <i class="fas fa-save"></i> Save All Settings
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="resetSettings()">
                                        <i class="fas fa-undo"></i> Reset to Defaults
                                    </button>
                                    <button type="button" class="btn btn-outline" onclick="exportSettings()">
                                        <i class="fas fa-download"></i> Export Settings
                                    </button>
                                    <button type="button" class="btn btn-outline" onclick="importSettings()">
                                        <i class="fas fa-upload"></i> Import Settings
                                    </button>
                                </div>
                                <div class="last-saved">
                                    <small id="last-saved-time">Last saved: Never</small>
                                </div>
                            </div>
                        </div>

                        <div id="inventory-tab" class="settings-tab">
                            
                        </div>

                        <div id="advanced-tab" class="settings-tab">
                            <!-- Advanced settings content removed -->
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
    <script src="settings.js"></script>
</body>
</html>
