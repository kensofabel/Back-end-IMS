<?php
// export_inventory.php
require_once '../../config/db.php';
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="inventory_export.csv"');

$output = fopen('php://output', 'w');
fputcsv($output, ['ID', 'Product Name', 'Category', 'Stock', 'Price']);

$sql = "SELECT id, name, category, stock, price FROM inventory";
$result = $conn->query($sql);
if ($result) {
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, $row);
    }
}
fclose($output);
exit;
