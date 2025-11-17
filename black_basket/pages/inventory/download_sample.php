<?php
// Simple CSV sample generator for inventory import
// Outputs a CSV with recommended columns which can be opened in Excel
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="sample_items.csv"');
$output = fopen('php://output', 'w');
// optional BOM for Excel compatibility
fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
// Header row - these column names match the import parser in import_items.php
// Headers: first letter capitalized and underscores removed for readability in the sample file.
$headers = [
    'Name',
    'Sku',
    'Barcode',
    'Category',
    'UnitPrice',
    'Cost',
    'TrackStock',
    'InStock',
    'LowStock',
    'PosAvailable',
    'Type'
];
fputcsv($output, $headers);
// Example row: TrackStock and PosAvailable use 'Y'/'N' in the sample (import will convert to 1/0).
fputcsv($output, [
    'Blue T-Shirt',
    'BT-001',
    '1234567890123',
    'Apparel',
    '199.00',
    '100.00',
    'Y',
    '50',
    '5',
    'Y',
    'color_shape'
]);
fclose($output);
exit();
