<?php
 $currentPage = basename($_SERVER['PHP_SELF']);
 $currentDir = basename(dirname($_SERVER['PHP_SELF']));

// Which pages belong to the Reports and Accounts groups (used for submenu state)
$reportsPages = ['salesreport.php', 'inventoryreport.php', 'paymentreport.php'];
$isReportsPage = in_array($currentPage, $reportsPages);
$accountsPages = ['accessrights.php', 'employee.php'];
$isAccountsPage = in_array($currentPage, $accountsPages);

// Permission-aware navigation: include permission helper which provides _get_user_permissions_cached()
require_once __DIR__ . '/check_permission.php';

// Helper: check permission by permission name (returns boolean)
function has_permission_by_name($name)
{
    // get effective permission ids for current user
    $perms = _get_user_permissions_cached();
    if (empty($perms)) return false;

    // Resolve permission id by name
    $stmt = $GLOBALS['conn']->prepare('SELECT id FROM permissions WHERE name = ? LIMIT 1');
    if ($stmt) {
        $stmt->bind_param('s', $name);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && $row = $res->fetch_assoc()) {
            $pid = (int)$row['id'];
            $stmt->close();
            return in_array($pid, $perms, true);
        }
        $stmt->close();
    }
    return false;
}

// Compute which top-level groups/links should be shown based on permissions
$canDashboard = has_permission_by_name('Dashboard Access');
$canPOS = has_permission_by_name('POS');
$canInventory = has_permission_by_name('Inventory Management') || has_permission_by_name('Add Products') || has_permission_by_name('Edit Products');
$canReportsSales = has_permission_by_name('View Sales Report');
$canReportsInventory = has_permission_by_name('View Inventory Report');
$canReportsPayment = has_permission_by_name('Payment Report');
$showReports = $canReportsSales || $canReportsInventory || $canReportsPayment;
$canAccessRights = has_permission_by_name('Manage Roles') || has_permission_by_name('Set Permissions');
$canEmployee = has_permission_by_name('Employee Management');
$showAccounts = $canAccessRights || $canEmployee;
$canAuditLogs = has_permission_by_name('Audit Logs Access');
$canViewSettings = has_permission_by_name('View Settings');
?>
<!-- Main Content -->
<main class="dashboard-main">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
        <!-- Sidebar toggle button moved to header -->
        <img src="../../assets/images/dboardlogo.webp" alt="Black Basket" class="sidebar-logo" />
        <nav class="sidebar-nav">
            <?php if ($canDashboard): ?>
            <a href="../dashboard/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'dashboard') ? 'active' : ''; ?>">
                <i class="fas fa-chart-line"></i> Dashboard
            </a>
            <?php endif; ?>

            <?php if ($canPOS): ?>
            <a href="../pos/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'pos') ? 'active' : ''; ?>">
                <i class="fas fa-cash-register"></i> POS
            </a>
            <?php endif; ?>

            <?php if ($canInventory): ?>
            <a href="../inventory/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'inventory') ? 'active' : ''; ?>">
                <i class="fas fa-boxes"></i> Inventory
            </a>
            <?php endif; ?>
            <?php if ($showReports): ?>
            <a href="../reports/salesreport.php" class="nav-item has-submenu<?php echo $isReportsPage ? ' active' : ''; ?>" onclick="toggleSidebarSubmenu(event, 'report-submenu')">
                <i class="fas fa-file-alt"></i> Reports
                <i class="fas submenu-caret <?php echo ($isReportsPage ? 'fa-caret-down' : 'fa-caret-right'); ?>"></i>
            </a>
            <div class="sidebar-submenu<?php echo $isReportsPage ? ' open' : ''; ?>" id="report-submenu">
                <?php if ($canReportsSales): ?>
                <a href="../reports/salesreport.php" class="nav-item submenu-item <?php echo $currentPage == 'salesreport.php' ? 'active' : ''; ?>">
                    Sales Report
                </a>
                <?php endif; ?>
                <?php if ($canReportsInventory): ?>
                <a href="../reports/inventoryreport.php" class="nav-item submenu-item <?php echo $currentPage == 'inventoryreport.php' ? 'active' : ''; ?>">
                    Inventory Report
                </a>
                <?php endif; ?>
                <?php if ($canReportsPayment): ?>
                <a href="../reports/paymentreport.php" class="nav-item submenu-item <?php echo $currentPage == 'paymentreport.php' ? 'active' : ''; ?>">
                    Payment Report
                </a>
                <?php endif; ?>
            </div>
            <?php endif; ?>
            <?php if ($showAccounts): ?>
            <a href="../accounts/accessrights.php" class="nav-item has-submenu<?php echo $isAccountsPage ? ' active' : ''; ?>" onclick="toggleSidebarSubmenu(event, 'accounts-submenu')">
                <i class="fas fa-users-cog"></i> Accounts
                <i class="fas submenu-caret <?php echo ($isAccountsPage ? 'fa-caret-down' : 'fa-caret-right'); ?>"></i>
            </a>
            <div class="sidebar-submenu<?php echo $isAccountsPage ? ' open' : ''; ?>" id="accounts-submenu">
                <?php if ($canAccessRights): ?>
                <a href="../accounts/accessrights.php" class="nav-item submenu-item <?php echo $currentPage == 'accessrights.php' ? 'active' : ''; ?>">
                    Access Rights
                </a>
                <?php endif; ?>
                <?php if ($canEmployee): ?>
                <a href="../accounts/employee.php" class="nav-item submenu-item <?php echo $currentPage == 'employee.php' ? 'active' : ''; ?>">
                    Employee
                </a>
                <?php endif; ?>
            </div>
            <?php endif; ?>
            <?php if ($canAuditLogs): ?>
            <a href="../auditlogs/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'auditlogs') ? 'active' : ''; ?>" onclick="showSection('audit-logs')">
                <i class="fas fa-history"></i> Audit Logs
            </a>
            <?php endif; ?>
        </nav>
        <a href="#add-product-form" class="nav-item" onclick="showSection('add-product')">
            <i class="fas fa-plus-circle"></i> Add Product
        </a>
        <?php if ($canViewSettings): ?>
        <a href="../settings/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'settings') ? 'active' : ''; ?>" style="margin-top:0;" onclick="showSection('settings')">
            <i class="fas fa-cog"></i> Settings
        </a>
        <?php endif; ?>
    </aside>
</main>

<script src="/black_basket/assets/js/sidebar.js"></script>
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