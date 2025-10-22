<?php
// get_next_sku.php
header('Content-Type: application/json');
require_once '../../config/db.php'; // Adjust path as needed

// Get the highest auto-generated SKU

$sql = "SELECT CAST(sku AS UNSIGNED) AS sku_num FROM products WHERE CAST(sku AS UNSIGNED) >= 10000 ORDER BY sku_num ASC";
$result = $conn->query($sql);
$skuList = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $skuList[] = intval($row['sku_num']);
    }
}
$nextSku = 10000;
foreach ($skuList as $sku) {
    if ($sku == $nextSku) {
        $nextSku++;
    } else if ($sku > $nextSku) {
        // Found a gap
        break;
    }
}
echo json_encode(['next_sku' => $nextSku]);
