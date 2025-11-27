<?php
// Load session and DB to determine current user's permissions
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../config/db.php';

$currentPage = basename($_SERVER['PHP_SELF']);
$currentDir = basename(dirname($_SERVER['PHP_SELF']));
$reportsPages = ['salesreport.php', 'inventoryreport.php', 'paymentreport.php'];
$isReportsPage = in_array($currentPage, $reportsPages);
$accountsPages = ['accessrights.php', 'employee.php'];
$isAccountsPage = in_array($currentPage, $accountsPages);

$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
$is_owner = false;
$userPermissions = [];
if ($user_id !== null) {
    // Check if this is an owner account (owner_id is NULL)
    $stmt = $conn->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
    if ($stmt) {
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && $row = $res->fetch_assoc()) {
            $is_owner = is_null($row['owner_id']);
        }
        $stmt->close();
    }

    if ($is_owner) {
        // Owner: grant all permissions
        $pRes = $conn->query('SELECT id FROM permissions');
        if ($pRes) {
            while ($r = $pRes->fetch_assoc()) $userPermissions[] = (int)$r['id'];
        }
    } else {
        // Load effective permissions from active roles
        $permStmt = $conn->prepare("SELECT DISTINCT rp.permission_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id AND r.status = 'active' JOIN role_permissions rp ON rp.role_id = ur.role_id WHERE ur.user_id = ?");
        if ($permStmt) {
            $permStmt->bind_param('i', $user_id);
            $permStmt->execute();
            $permRes = $permStmt->get_result();
            if ($permRes) {
                while ($r = $permRes->fetch_assoc()) $userPermissions[] = (int)$r['permission_id'];
            }
            $permStmt->close();
        }
    }
}

// Helper to check permission presence
function nav_has_perm($permId, $userPermissions) {
    return in_array((int)$permId, $userPermissions, true);
}
?>
<!-- Main Content -->
<main class="dashboard-main">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
        <!-- Sidebar toggle button moved to header -->
        <img src="../../assets/images/dboardlogo.webp" alt="Black Basket" class="sidebar-logo" />
        <nav class="sidebar-nav">
            <?php if (empty($user_id) || nav_has_perm(1, $userPermissions) /* Dashboard Access */): ?>
            <a href="../dashboard/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'dashboard') ? 'active' : ''; ?>">
                <i class="fas fa-chart-line"></i> Dashboard
            </a>
            <?php endif; ?>

            <?php if (empty($user_id) || nav_has_perm(6, $userPermissions) /* POS */): ?>
            <a href="../pos/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'pos') ? 'active' : ''; ?>">
                <i class="fas fa-cash-register"></i> POS
            </a>
            <?php endif; ?>

            <?php if (empty($user_id) || nav_has_perm(1, $userPermissions) /* treat inventory under dashboard permission by default */): ?>
            <a href="../inventory/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'inventory') ? 'active' : ''; ?>">
                <i class="fas fa-boxes"></i> Inventory
            </a>
            <?php endif; ?>

            <?php if (empty($user_id) || nav_has_perm(7, $userPermissions) || nav_has_perm(13, $userPermissions) /* Reports access */): ?>
            <a href="../reports/salesreport.php" class="nav-item has-submenu<?php echo $isReportsPage ? ' active' : ''; ?>" onclick="toggleSidebarSubmenu(event, 'report-submenu')">
                <i class="fas fa-file-alt"></i> Reports
                <i class="fas submenu-caret <?php echo ($isReportsPage ? 'fa-caret-down' : 'fa-caret-right'); ?>"></i>
            </a>
            <div class="sidebar-submenu<?php echo $isReportsPage ? ' open' : ''; ?>" id="report-submenu">
                <?php if (empty($user_id) || nav_has_perm(7, $userPermissions)): ?>
                <a href="../reports/salesreport.php" class="nav-item submenu-item <?php echo $currentPage == 'salesreport.php' ? 'active' : ''; ?>">
                    Sales Report
                </a>
                <?php endif; ?>
                <?php if (empty($user_id) || nav_has_perm(1, $userPermissions) /* inventory listing permitted under dashboard */): ?>
                <a href="../reports/inventoryreport.php" class="nav-item submenu-item <?php echo $currentPage == 'inventoryreport.php' ? 'active' : ''; ?>">
                    Inventory Report
                </a>
                <?php endif; ?>
                <?php if (empty($user_id) || nav_has_perm(13, $userPermissions)): ?>
                <a href="../reports/paymentreport.php" class="nav-item submenu-item <?php echo $currentPage == 'paymentreport.php' ? 'active' : ''; ?>">
                    Payment Report
                </a>
                <?php endif; ?>
            </div>
            <?php endif; ?>

            <?php if (empty($user_id) || nav_has_perm(11, $userPermissions) /* Employee Management */): ?>
            <a href="../accounts/accessrights.php" class="nav-item has-submenu<?php echo $isAccountsPage ? ' active' : ''; ?>" onclick="toggleSidebarSubmenu(event, 'accounts-submenu')">
                <i class="fas fa-users-cog"></i> Accounts
                <i class="fas submenu-caret <?php echo ($isAccountsPage ? 'fa-caret-down' : 'fa-caret-right'); ?>"></i>
            </a>
            <div class="sidebar-submenu<?php echo $isAccountsPage ? ' open' : ''; ?>" id="accounts-submenu">
                <?php if (empty($user_id) || nav_has_perm(11, $userPermissions)): ?>
                <a href="../accounts/accessrights.php" class="nav-item submenu-item <?php echo $currentPage == 'accessrights.php' ? 'active' : ''; ?>">
                    Access Rights
                </a>
                <?php endif; ?>
                <?php if (empty($user_id) || nav_has_perm(11, $userPermissions)): ?>
                <a href="../accounts/employee.php" class="nav-item submenu-item <?php echo $currentPage == 'employee.php' ? 'active' : ''; ?>">
                    Employee
                </a>
                <?php endif; ?>
            </div>
            <?php endif; ?>

            <?php if (empty($user_id) || nav_has_perm(12, $userPermissions) /* Audit Logs */): ?>
            <a href="../auditlogs/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'auditlogs') ? 'active' : ''; ?>" onclick="showSection('audit-logs')">
                <i class="fas fa-history"></i> Audit Logs
            </a>
            <?php endif; ?>
        </nav>
        <?php if (empty($user_id) || nav_has_perm(6, $userPermissions) || nav_has_perm(1, $userPermissions)): ?>
        <a href="../inventory/index.php?open_add=1" id="navAddProduct" class="nav-item">
            <i class="fas fa-plus-circle"></i> Add Product
        </a>
        <?php endif; ?>
        <?php if (empty($user_id) || nav_has_perm(1, $userPermissions) /* Dashboard/owner access as proxy for Settings */): ?>
        <a href="../settings/index.php" class="nav-item <?php echo ($currentPage == 'index.php' && $currentDir == 'settings') ? 'active' : ''; ?>" style="margin-top:0;" onclick="showSection('settings')">
            <i class="fas fa-cog"></i> Settings
        </a>
        <?php endif; ?>
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
// Wire Add Product nav item: if already on Inventory page, open the Add modal instead
document.addEventListener('DOMContentLoaded', function() {
    try {
        var navAdd = document.getElementById('navAddProduct');
        if (!navAdd) return;
        navAdd.addEventListener('click', function(e) {
            // Detect whether the current page is the inventory index (several path variants)
            var path = (window.location.pathname || '').toLowerCase();
            var isInventory = path.indexOf('/pages/inventory/index.php') !== -1 || path.indexOf('/inventory/index.php') !== -1 || path.indexOf('/pages/inventory') !== -1 || path.indexOf('/inventory') !== -1;
            if (isInventory) {
                // prevent navigation and try to open the modal by clicking the existing button
                e.preventDefault();
                var addBtn = document.getElementById('addProductBtn') || document.getElementById('emptyAddItemBtn');
                if (addBtn) {
                    try { addBtn.click(); } catch (err) { /* ignore */ }
                    return;
                }
                // If the button isn't present yet, dispatch a custom event that inventory page can listen for
                try { window.dispatchEvent(new CustomEvent('openInventoryAdd')); } catch (err) { /* ignore */ }
            }
            // otherwise let the default navigation to inventory with ?open_add=1 happen
        });
    } catch (e) { console.warn('navAdd wiring failed', e); }
});
</script>   