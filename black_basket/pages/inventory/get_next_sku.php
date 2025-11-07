<?php
// get_next_sku.php
header('Content-Type: application/json');
require_once '../../config/db.php'; // Adjust path as needed

// Get all SKUs from products and product_variants >= 10000
$skuList = [];
$sql = "SELECT CAST(sku AS UNSIGNED) AS sku_num FROM products WHERE CAST(sku AS UNSIGNED) >= 10000";
$result = $conn->query($sql);
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $skuList[] = intval($row['sku_num']);
    }
}
$sql2 = "SELECT CAST(sku AS UNSIGNED) AS sku_num FROM product_variants WHERE CAST(sku AS UNSIGNED) >= 10000";
$result2 = $conn->query($sql2);
if ($result2) {
    while ($row = $result2->fetch_assoc()) {
        $skuList[] = intval($row['sku_num']);
    }
}
// Remove duplicates and sort
$skuList = array_unique($skuList);
sort($skuList, SORT_NUMERIC);

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
