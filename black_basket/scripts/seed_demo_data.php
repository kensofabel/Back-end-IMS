<?php
// scripts/seed_demo_data.php - Seed demo data for products, inventory, and sales
// Usage: http://localhost/black_basket/scripts/seed_demo_data.php

@ini_set('display_errors', '0');
@error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . '/../config/db.php'; // $conn (mysqli)

function table_exists(mysqli $conn, string $table): bool {
    $db = $conn->real_escape_string($conn->query('SELECT DATABASE()')->fetch_row()[0]);
    $t  = $conn->real_escape_string($table);
    $sql = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='$t' LIMIT 1";
    $res = $conn->query($sql);
    return $res && $res->num_rows > 0;
}

function ensure_prereqs(mysqli $conn): array {
    $need = ['products','inventory','sales','sale_items','settings'];
    $missing = [];
    foreach ($need as $t) if (!table_exists($conn, $t)) $missing[] = $t;
    return $missing;
}

$missing = ensure_prereqs($conn);
if (!empty($missing)) {
    header('Content-Type: text/plain');
    echo "Missing required tables: " . implode(', ', $missing) . "\nPlease import updated black_basket_db.sql then retry this seeder.";
    exit;
}

header('Content-Type: text/html; charset=UTF-8');

// 1) Seed settings currency if missing
$conn->query("INSERT INTO settings (setting_key, setting_value) VALUES ('currency','PHP') ON DUPLICATE KEY UPDATE setting_value=setting_value");

// 2) Seed products (idempotent by SKU)
$products = [
    ['sku' => 'APL-001', 'name' => 'Apple',  'category' => 'Fruits', 'unit_price' => 35.00],
    ['sku' => 'BNA-001', 'name' => 'Banana', 'category' => 'Fruits', 'unit_price' => 20.00],
    ['sku' => 'MLK-001', 'name' => 'Milk',   'category' => 'Dairy',  'unit_price' => 80.00],
    ['sku' => 'BRD-001', 'name' => 'Bread',  'category' => 'Bakery', 'unit_price' => 50.00],
    ['sku' => 'EGG-001', 'name' => 'Eggs (Tray)', 'category' => 'Dairy', 'unit_price' => 200.00],
];

$insertedProducts = 0;
$getBySku = $conn->prepare("SELECT id FROM products WHERE sku=? LIMIT 1");
$insProd  = $conn->prepare("INSERT INTO products (name, sku, category, unit_price, created_at) VALUES (?,?,?,?, NOW())");
foreach ($products as $p) {
    $getBySku->bind_param('s', $p['sku']);
    $getBySku->execute();
    $res = $getBySku->get_result();
    if ($res && $res->num_rows > 0) continue;
    $insProd->bind_param('sssd', $p['name'], $p['sku'], $p['category'], $p['unit_price']);
    if ($insProd->execute()) $insertedProducts++;
}
$getBySku->close();
$insProd->close();

// Map SKU -> product_id
$skuToId = [];
$stmt = $conn->prepare("SELECT id FROM products WHERE sku=? LIMIT 1");
foreach ($products as $p) {
    $stmt->bind_param('s', $p['sku']);
    $stmt->execute();
    $idRes = $stmt->get_result();
    if ($idRes && ($row = $idRes->fetch_assoc())) $skuToId[$p['sku']] = (int)$row['id'];
}
$stmt->close();

// 3) Seed inventory for Main Warehouse (upsert if missing)
$invTarget = [
    'APL-001' => 50,
    'BNA-001' => 10,
    'MLK-001' => 0,
    'BRD-001' => 5,
    'EGG-001' => 100,
];
$selInv = $conn->prepare("SELECT id, quantity FROM inventory WHERE product_id=? AND location='Main Warehouse' LIMIT 1");
$insInv = $conn->prepare("INSERT INTO inventory (product_id, location, quantity, last_updated) VALUES (?,?,?, NOW())");
$updInv = $conn->prepare("UPDATE inventory SET quantity=?, last_updated=NOW() WHERE id=?");
$loc = 'Main Warehouse';
$updatedInv = 0; $insertedInv = 0;
foreach ($invTarget as $sku => $qty) {
    if (!isset($skuToId[$sku])) continue;
    $pid = $skuToId[$sku];
    $selInv->bind_param('i', $pid);
    $selInv->execute();
    $r = $selInv->get_result();
    if ($r && ($row = $r->fetch_assoc())) {
        // Update only if different
        if ((int)$row['quantity'] !== (int)$qty) {
            $invId = (int)$row['id'];
            $updInv->bind_param('ii', $qty, $invId);
            if ($updInv->execute()) $updatedInv++;
        }
    } else {
        $insInv->bind_param('isis', $pid, $loc, $qty, $null);
        // Fix parameter types: product_id (i), location (s), quantity (i)
        $insInv->close();
        $insInv = $conn->prepare("INSERT INTO inventory (product_id, location, quantity, last_updated) VALUES (?,?,?, NOW())");
        $insInv->bind_param('isi', $pid, $loc, $qty);
        if ($insInv->execute()) $insertedInv++;
    }
}
$selInv->close();
$insInv->close();
$updInv->close();

// 4) Seed two sample sales if table empty
$countRes = $conn->query("SELECT COUNT(*) AS c FROM sales");
$hasSales = $countRes && ($row = $countRes->fetch_assoc()) ? ((int)$row['c'] > 0) : false;

$insertedSales = 0; $insertedItems = 0;
if (!$hasSales) {
    $conn->begin_transaction();
    try {
        // Sale 1 - cash, yesterday
        $sale1 = $conn->prepare("INSERT INTO sales (customer_name, sale_date, total_amount, payment_method, channel, created_at) VALUES (?,?,?,?,?,NOW())");
        $s1Date = (new DateTime('now'))->modify('-1 day')->format('Y-m-d H:i:s');
        $s1Customer = 'Walk-in';
        $s1Method = 'cash';
        $s1Channel = 'in-store';
        $total1 = 0.0;
        $sale1->bind_param('ssdss', $s1Customer, $s1Date, $total1, $s1Method, $s1Channel);
        if (!$sale1->execute()) throw new Exception($sale1->error);
        $sale1Id = $conn->insert_id;
        $sale1->close();

        $items1 = [
            ['sku' => 'APL-001', 'qty' => 5],
            ['sku' => 'BNA-001', 'qty' => 2],
        ];
        $insItem = $conn->prepare("INSERT INTO sale_items (sale_id, product_id, quantity_sold, unit_price, total_price) VALUES (?,?,?,?,?)");
        foreach ($items1 as $it) {
            if (!isset($skuToId[$it['sku']])) continue;
            $pid = $skuToId[$it['sku']];
            $prRes = $conn->query("SELECT unit_price FROM products WHERE id=".$pid);
            $price = $prRes && ($rr = $prRes->fetch_assoc()) ? (float)$rr['unit_price'] : 0.0;
            $total = $price * (int)$it['qty'];
            $insItem->bind_param('iiidd', $sale1Id, $pid, $it['qty'], $price, $total);
            if ($insItem->execute()) { $insertedItems++; $total1 += $total; }
            // deduct inventory
            $conn->query("UPDATE inventory SET quantity = quantity - " . (int)$it['qty'] . ", last_updated=NOW() WHERE product_id=".$pid." AND location='Main Warehouse'");
        }
        $conn->query("UPDATE sales SET total_amount=".$total1." WHERE id=".$sale1Id);
        $insertedSales++;

        // Sale 2 - card, today
        $sale2 = $conn->prepare("INSERT INTO sales (customer_name, sale_date, total_amount, payment_method, channel, created_at) VALUES (?,?,?,?,?,NOW())");
        $s2Date = (new DateTime('now'))->format('Y-m-d H:i:s');
        $s2Customer = 'Online';
        $s2Method = 'card';
        $s2Channel = 'in-store';
        $total2 = 0.0;
        $sale2->bind_param('ssdss', $s2Customer, $s2Date, $total2, $s2Method, $s2Channel);
        if (!$sale2->execute()) throw new Exception($sale2->error);
        $sale2Id = $conn->insert_id;
        $sale2->close();

        $items2 = [
            ['sku' => 'MLK-001', 'qty' => 2],
            ['sku' => 'BRD-001', 'qty' => 3],
        ];
        foreach ($items2 as $it) {
            if (!isset($skuToId[$it['sku']])) continue;
            $pid = $skuToId[$it['sku']];
            $prRes = $conn->query("SELECT unit_price FROM products WHERE id=".$pid);
            $price = $prRes && ($rr = $prRes->fetch_assoc()) ? (float)$rr['unit_price'] : 0.0;
            $total = $price * (int)$it['qty'];
            $insItem->bind_param('iiidd', $sale2Id, $pid, $it['qty'], $price, $total);
            if ($insItem->execute()) { $insertedItems++; $total2 += $total; }
            $conn->query("UPDATE inventory SET quantity = quantity - " . (int)$it['qty'] . ", last_updated=NOW() WHERE product_id=".$pid." AND location='Main Warehouse'");
        }
        $conn->query("UPDATE sales SET total_amount=".$total2." WHERE id=".$sale2Id);
        $insertedSales++;
        $insItem->close();

        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollback();
        echo '<pre style="color:#ff8a80">Seeder failed: '.htmlspecialchars($e->getMessage())."</pre>";
    }
}

// Output summary
echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Seed Demo Data</title></head><body style="font-family:Segoe UI,Arial,sans-serif;background:#111;color:#eee">';
echo '<h2 style="color:#ff9800">Seed Demo Data — Summary</h2>';
echo '<ul>';
echo '<li>Products inserted: <strong>'.$insertedProducts.'</strong></li>';
echo '<li>Inventory rows inserted: <strong>'.$insertedInv.'</strong>, updated: <strong>'.$updatedInv.'</strong></li>';
echo '<li>Sales inserted: <strong>'.$insertedSales.'</strong></li>';
echo '<li>Sale items inserted: <strong>'.$insertedItems.'</strong></li>';
echo '</ul>';
echo '<p>Re-run this page safely; it only adds missing products and seeds sales once if there were none.</p>';
echo '<p><a style="color:#ffb74d" href="/black_basket/pages/reports/salesreport.php">Go to Sales Report</a> · ';
echo '<a style="color:#ffb74d" href="/black_basket/pages/reports/paymentreport.php">Payment Report</a> · ';
echo '<a style="color:#ffb74d" href="/black_basket/pages/reports/inventoryreport.php">Inventory Report</a></p>';
echo '</body></html>';
?>