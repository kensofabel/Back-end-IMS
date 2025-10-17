<?php
session_start();
include '../../config/db.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}

// Server-side permission enforcement: ensure current user has 'Dashboard Access'
// Include permission helper (provides _get_user_permissions_cached())
$checkPerm = __DIR__ . '/../../partials/check_permission.php';
if (file_exists($checkPerm)) {
    require_once $checkPerm;
}

// Resolve the permission id for 'Dashboard Access' and verify
$dashboardPermId = null;
$stmtp = $conn->prepare('SELECT id FROM permissions WHERE name = ? LIMIT 1');
if ($stmtp) {
    $pname = 'Dashboard Access';
    $stmtp->bind_param('s', $pname);
    $stmtp->execute();
    $pres = $stmtp->get_result();
    if ($pres && $prow = $pres->fetch_assoc()) {
        $dashboardPermId = (int)$prow['id'];
    }
    $stmtp->close();
}

// If permission exists, check the user's permissions; otherwise treat as denied for non-owners
$hasDashboard = false;
if ($dashboardPermId !== null && function_exists('_get_user_permissions_cached')) {
    $effective = _get_user_permissions_cached();
    if (in_array($dashboardPermId, $effective, true)) {
        $hasDashboard = true;
    }
} else {
    // If permission row missing, only allow owner accounts (owner_id === null)
    if (isset($_SESSION['owner_id']) && $_SESSION['owner_id'] === null) {
        $hasDashboard = true;
    }
}

if (!$hasDashboard) {
    // Redirect to neutral landing if user lacks permission
    header('Location: /black_basket/pages/home.php');
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
    <link rel="stylesheet" href="dashboard.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
            <!-- Content Area -->
            <div class="content-area">
                <!-- Dashboard Section -->
                <section id="dashboard-section" class="section active">
                    <div class="dashboard-header-title">
                        <h1 id="dashboard-welcome">Welcome to<span class="business-name"></span></h1>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-boxes"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="total-products">0</h3>
                                <p>Total Products</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="total-sales">0</h3>
                                <p>Total Sales</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="low-stock">0</h3>
                                <p>Low Stock Items</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-peso-sign"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="total-revenue">₱0.00</h3>
                                <p>Total Revenue</p>
                            </div>
                        </div>
                    </div>

                    <div class="recent-activities">
                        <h2>Recent Activities</h2>
                        <div id="activities-list" class="activities-list">
                            <!-- Activities will be populated by JavaScript -->
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
    <script src="dashboard.js"></script>
</body>
</html>
