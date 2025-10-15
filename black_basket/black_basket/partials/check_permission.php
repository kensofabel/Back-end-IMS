<?php
// Helper to require/check a permission for the current user.
// Usage: require_permission($permId);
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../config/db.php';

function _get_user_permissions_cached() {
	static $perms = null;
	if ($perms !== null) return $perms;
	$perms = [];
	if (!isset($_SESSION['user_id'])) return $perms;
	$user_id = intval($_SESSION['user_id']);

	// Check if user is owner (owner_id IS NULL) -> grant all perms
	$stmt = $GLOBALS['conn']->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
	if ($stmt) {
		$stmt->bind_param('i', $user_id);
		$stmt->execute();
		$res = $stmt->get_result();
		if ($res && $row = $res->fetch_assoc()) {
			if (is_null($row['owner_id'])) {
				$pRes = $GLOBALS['conn']->query('SELECT id FROM permissions');
				if ($pRes) while ($r = $pRes->fetch_assoc()) $perms[] = (int)$r['id'];
				$stmt->close();
				return $perms;
			}
		}
		$stmt->close();
	}

	// Load effective permissions from active roles
	$permStmt = $GLOBALS['conn']->prepare("SELECT DISTINCT rp.permission_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id AND r.status = 'active' JOIN role_permissions rp ON rp.role_id = ur.role_id WHERE ur.user_id = ?");
	if ($permStmt) {
		$permStmt->bind_param('i', $user_id);
		$permStmt->execute();
		$res = $permStmt->get_result();
		if ($res) while ($r = $res->fetch_assoc()) $perms[] = (int)$r['permission_id'];
		$permStmt->close();
	}
	return $perms;
}

function require_permission($permId) {
	$perms = _get_user_permissions_cached();
	if (!in_array((int)$permId, $perms, true)) {
		// If AJAX or expecting JSON, return 403 JSON
		if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)) {
			http_response_code(403);
			header('Content-Type: application/json');
			echo json_encode(['success' => false, 'message' => 'Forbidden: insufficient permissions']);
			exit();
		}
		// Otherwise redirect to dashboard
		header('Location: /black_basket/pages/dashboard/index.php');
		exit();
	}
}

?>
