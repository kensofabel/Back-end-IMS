<?php
// Lightweight permission helper used by templates (navigation, pages).
// This file intentionally keeps a small, safe implementation so including it
// won't break when other scripts expect `_get_user_permissions_cached()`.

// Ensure session is started
if (function_exists('session_status') && session_status() === PHP_SESSION_NONE) {
	@session_start();
} else {
	if (!session_id()) @session_start();
}

// Ensure DB connection is available; include config/db.php if needed
if (!isset($GLOBALS['conn'])) {
	$dbPath = __DIR__ . '/../config/db.php';
	if (file_exists($dbPath)) {
		require_once $dbPath;
	}
}

if (!function_exists('_get_user_permissions_cached')) {
	/**
	 * Return array of permission ids effective for the current session user.
	 * Caches result in session to avoid repeated DB queries during a request.
	 * Behavior:
	 *  - If session owner_id is NULL => treat as Owner account and return ALL permission ids.
	 *  - Otherwise, return distinct permission_ids assigned to roles of the current user.
	 *
	 * @return int[]
	 */
	function _get_user_permissions_cached()
	{
		static $request_cache = null;
		if (is_array($request_cache)) {
			return $request_cache;
		}

		$conn = $GLOBALS['conn'] ?? null;
		$perms = [];

		// No DB connection -> return empty (safe)
		if (!$conn) {
			$request_cache = $perms;
			return $perms;
		}

		$owner_id = isset($_SESSION['owner_id']) ? $_SESSION['owner_id'] : null;
		$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

		// If owner account (owner_id is NULL), grant all permissions
		if ($owner_id === null) {
			$res = $conn->query('SELECT id FROM permissions');
			if ($res) {
				while ($r = $res->fetch_assoc()) {
					$perms[] = (int)$r['id'];
				}
			}
			$request_cache = $perms;
			return $perms;
		}

		// If we have a user_id, collect permissions via user_roles -> role_permissions
		if ($user_id) {
			$stmt = $conn->prepare('SELECT DISTINCT rp.permission_id FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id WHERE ur.user_id = ?');
			if ($stmt) {
				$stmt->bind_param('i', $user_id);
				$stmt->execute();
				$res = $stmt->get_result();
				if ($res) {
					while ($r = $res->fetch_assoc()) {
						$perms[] = (int)$r['permission_id'];
					}
				}
				$stmt->close();
			}
		}

		// Cache for this request and return
		$request_cache = $perms;
		return $perms;
	}
}

// Optional helper: require a permission id (not used by navigation but present in other codebases)
if (!function_exists('require_permission')) {
	function require_permission($permId)
	{
		$perms = _get_user_permissions_cached();
		if (!in_array((int)$permId, $perms, true)) {
			// Simple denial: HTTP 403 and exit
			http_response_code(403);
			echo 'Forbidden';
			exit;
		}
	}
}

