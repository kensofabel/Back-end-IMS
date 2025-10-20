<?php
// Keep this legacy file as a thin redirector to the new POS page to avoid duplicate UIs.
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
header('Location: /black_basket/pages/pos/index.php');
exit();
?>
