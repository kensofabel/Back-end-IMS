<?php
// Simple CSRF helper
// Usage: include this file and call csrf_get_token() to embed in forms,
// and csrf_validate($token) to validate incoming POSTs.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function csrf_get_token() {
    if (!isset($_SESSION['bb_csrf_token'])) {
        $_SESSION['bb_csrf_token'] = bin2hex(random_bytes(32));
        // Optionally track creation time for expiry
        $_SESSION['bb_csrf_token_time'] = time();
    }
    return $_SESSION['bb_csrf_token'];
}

function csrf_validate($token) {
    if (empty($token)) return false;
    if (!isset($_SESSION['bb_csrf_token'])) return false;
    $valid = hash_equals($_SESSION['bb_csrf_token'], $token);
    return $valid;
}

?>