<?php
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<!-- Main Content -->
<main class="dashboard-main">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
        <!-- Sidebar toggle button moved to header -->
        <img src="https://github.com/kensofabel/B2-IMS/blob/main/Inventory%20Management%20System-20250829T034006Z-1-001/Inventory%20Management%20System/Untitled_design__1_-removebg-preview.png?raw=true" alt="Black Basket" class="sidebar-logo" />
        <nav class="sidebar-nav">
            <a href="dashboard.php" class="nav-item <?php echo $currentPage == 'dashboard.php' ? 'active' : ''; ?>">
                <i class="fas fa-chart-line"></i> Dashboard
            </a>
            <a href="pos.php" class="nav-item <?php echo $currentPage == 'pos.php' ? 'active' : ''; ?>">
                <i class="fas fa-cash-register"></i> POS
            </a>
            <a href="inventory.php" class="nav-item <?php echo $currentPage == 'inventory.php' ? 'active' : ''; ?>">
                <i class="fas fa-boxes"></i> Inventory
            </a>
            <a href="#" class="nav-item has-submenu <?php echo in_array($currentPage, ['salesreports.php', 'inventoryreport.php', 'paymentreport.php']) ? 'active' : ''; ?>" onclick="toggleSidebarSubmenu(event, 'report-submenu')">
                <i class="fas fa-file-alt"></i> Reports <i class="fas fa-caret-down submenu-caret"></i>
            </a>
            <div class="sidebar-submenu" id="report-submenu">
                <a href="salesreports.php" class="nav-item submenu-item <?php echo $currentPage == 'salesreports.php' ? 'active' : ''; ?>" onclick="showSection('sales-report')">
                    Sales Report
                </a>
                <a href="inventoryreport.php" class="nav-item submenu-item <?php echo $currentPage == 'inventoryreport.php' ? 'active' : ''; ?>" onclick="showSection('inventory-reports')">
                    Inventory Report
                </a>
                <a href="paymentreport.php" class="nav-item submenu-item <?php echo $currentPage == 'paymentreport.php' ? 'active' : ''; ?>" onclick="showSection('payment-reports')">
                    Payment Report
                </a>
            </div>
            <a href="#" class="nav-item has-submenu <?php echo in_array($currentPage, ['access-rights.php', 'employee.php']) ? 'active' : ''; ?>" onclick="toggleSidebarSubmenu(event, 'accounts-submenu')">
                <i class="fas fa-users-cog"></i> Accounts <i class="fas fa-caret-down submenu-caret"></i>
            </a>
            <div class="sidebar-submenu" id="accounts-submenu">
                <a href="access-rights.php" class="nav-item submenu-item <?php echo $currentPage == 'access-rights.php' ? 'active' : ''; ?>" onclick="showSection('access-rights')">
                    Access Rights
                </a>
                <a href="employee.php" class="nav-item submenu-item <?php echo $currentPage == 'employee.php' ? 'active' : ''; ?>" onclick="showSection('employee')">
                    Employee
                </a>
            </div>
            <a href="audit-logs.php" class="nav-item <?php echo $currentPage == 'audit-logs.php' ? 'active' : ''; ?>" onclick="showSection('audit-logs')">
                <i class="fas fa-history"></i> Audit Logs
            </a>
        </nav>
        <a href="#add-product-form" class="nav-item" onclick="showSection('add-product')">
            <i class="fas fa-plus-circle"></i> Add Product
        </a>
        <a href="settings.php" class="nav-item <?php echo $currentPage == 'settings.php' ? 'active' : ''; ?>" style="margin-top:0;" onclick="showSection('settings')">
            <i class="fas fa-cog"></i> Settings
        </a>
    </aside>
</main>
