<?php
$currentPage = basename($_SERVER['PHP_SELF']);
$currentDir = basename(dirname($_SERVER['PHP_SELF']));
$reportsPages = ['salesreport.php', 'inventoryreport.php', 'paymentreport.php'];
$isReportsPage = in_array($currentPage, $reportsPages);
$accountsPages = ['accessrights.php', 'employee.php'];
$isAccountsPage = in_array($currentPage, $accountsPages);
?>
<!-- Main Content -->
<main class="dashboard-main">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
        <!-- Sidebar toggle button moved to header -->
        <img src="../../assets/images/dboardlogo.webp" alt="Black Basket" class="sidebar-logo" />
        <nav class="sidebar-nav">
            <a href="../dashboard/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'dashboard') ? 'active' : ''; ?>">
                <i class="fas fa-chart-line"></i> Dashboard
            </a>
            <a href="../pos/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'pos') ? 'active' : ''; ?>">
                <i class="fas fa-cash-register"></i> POS
            </a>
            <a href="../inventory/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'inventory') ? 'active' : ''; ?>">
                <i class="fas fa-boxes"></i> Inventory
            </a>
            <a href="../reports/salesreport.php" class="nav-item has-submenu<?php echo $isReportsPage ? ' active' : ''; ?>" onclick="toggleSidebarSubmenu(event, 'report-submenu')">
                <i class="fas fa-file-alt"></i> Reports
                <i class="fas submenu-caret <?php echo ($isReportsPage ? 'fa-caret-down' : 'fa-caret-right'); ?>"></i>
            </a>
            <div class="sidebar-submenu<?php echo $isReportsPage ? ' open' : ''; ?>" id="report-submenu">
                <a href="../reports/salesreport.php" class="nav-item submenu-item <?php echo $currentPage == 'salesreport.php' ? 'active' : ''; ?>">
                    Sales Report
                </a>
                <a href="../reports/inventoryreport.php" class="nav-item submenu-item <?php echo $currentPage == 'inventoryreport.php' ? 'active' : ''; ?>">
                    Inventory Report
                </a>
                <a href="../reports/paymentreport.php" class="nav-item submenu-item <?php echo $currentPage == 'paymentreport.php' ? 'active' : ''; ?>">
                    Payment Report
                </a>
            </div>
            <a href="../accounts/accessrights.php" class="nav-item has-submenu<?php echo $isAccountsPage ? ' active' : ''; ?>" onclick="toggleSidebarSubmenu(event, 'accounts-submenu')">
                <i class="fas fa-users-cog"></i> Accounts
                <i class="fas submenu-caret <?php echo ($isAccountsPage ? 'fa-caret-down' : 'fa-caret-right'); ?>"></i>
            </a>
            <div class="sidebar-submenu<?php echo $isAccountsPage ? ' open' : ''; ?>" id="accounts-submenu">
                <a href="../accounts/accessrights.php" class="nav-item submenu-item <?php echo $currentPage == 'accessrights.php' ? 'active' : ''; ?>">
                    Access Rights
                </a>
                <a href="../accounts/employee.php" class="nav-item submenu-item <?php echo $currentPage == 'employee.php' ? 'active' : ''; ?>">
                    Employee
                </a>
            </div>
            <a href="../auditlogs/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'auditlogs') ? 'active' : ''; ?>" onclick="showSection('audit-logs')">
                <i class="fas fa-history"></i> Audit Logs
            </a>
        </nav>
        <a href="#add-product-form" class="nav-item" onclick="showSection('add-product')">
            <i class="fas fa-plus-circle"></i> Add Product
        </a>
        <a href="../settings/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'settings') ? 'active' : ''; ?>" style="margin-top:0;" onclick="showSection('settings')">
            <i class="fas fa-cog"></i> Settings
        </a>
    </aside>
</main>

<script src="../../assets/js/sidebar.js"></script>
<script>
// Prevent reload when clicking the nav item for the current page
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-item.active').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
});
</script>   