<?php
session_start();
require_once '../../config/db.php';
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo "Not authorized.";
    exit;
}

// current user id used as default owner when CSV doesn't provide owner_id
$currentUserId = null;
if (isset($_SESSION['user_id'])) $currentUserId = intval($_SESSION['user_id']);
else if (isset($_SESSION['user']) && is_array($_SESSION['user']) && isset($_SESSION['user']['id'])) $currentUserId = intval($_SESSION['user']['id']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

if (!isset($_FILES['import_file']) || $_FILES['import_file']['error'] !== UPLOAD_ERR_OK) {
    $_SESSION['import_result'] = ['success' => false, 'message' => 'No file uploaded or upload error.'];
    header('Location: index.php');
    exit;
}

$uploaddir = __DIR__ . '/../../upload/imports/';
if (!is_dir($uploaddir)) mkdir($uploaddir, 0755, true);
$uploadedName = basename($_FILES['import_file']['name']);
$targetPath = $uploaddir . time() . '_' . preg_replace('/[^a-zA-Z0-9_\.\-]/', '_', $uploadedName);
if (!move_uploaded_file($_FILES['import_file']['tmp_name'], $targetPath)) {
    $_SESSION['import_result'] = ['success' => false, 'message' => 'Failed to save uploaded file.'];
    header('Location: index.php');
    exit;
}

$fh = fopen($targetPath, 'r');
if (!$fh) {
    $_SESSION['import_result'] = ['success' => false, 'message' => 'Unable to open uploaded file.'];
    header('Location: index.php');
    exit;
}

// Read header row
$header = fgetcsv($fh);
if ($header === false) {
    $_SESSION['import_result'] = ['success' => false, 'message' => 'Empty file.'];
    fclose($fh);
    header('Location: index.php');
    exit;
}
// Normalize header keys: make canonical names (accept TitleCase, underscores, spaces)
$columns = array_map(function($v){
    $s = strtolower(trim($v));
    // remove non-alphanumeric so 'Unit Price' or 'unit_price' -> 'unitprice'
    $s2 = preg_replace('/[^a-z0-9]/', '', $s);
    // Map common variations to canonical column names used below
    $map = [
        'name' => 'name',
        'sku' => 'sku',
        'barcode' => 'barcode',
        'category' => 'category',
        'unitprice' => 'unit_price',
        'unit_price' => 'unit_price',
        'price' => 'unit_price',
        'cost' => 'cost',
        'trackstock' => 'track_stock',
        'track_stock' => 'track_stock',
        'instock' => 'in_stock',
        'in_stock' => 'in_stock',
        'lowstock' => 'low_stock',
        'low_stock' => 'low_stock',
        'posavailable' => 'pos_available',
        'pos_available' => 'pos_available',
        'type' => 'type',
        'color' => 'color',
        'shape' => 'shape',
        'imageurl' => 'image_url',
        'ownerid' => 'owner_id',
        'owner_id' => 'owner_id',
        'owner' => 'owner_id',
        'image_url' => 'image_url'
    ];
    return isset($map[$s2]) ? $map[$s2] : $s2;
}, $header);

$allowedCols = ['name','sku','barcode','category','unit_price','cost','track_stock','in_stock','low_stock','pos_available','type','color','shape','image_url','owner_id'];

$inserted = 0; $skipped = 0; $errors = [];

// Prepared statements
$insertStmt = $conn->prepare("INSERT INTO products (name, sku, barcode, category_id, price, cost, track_stock, in_stock, low_stock, pos_available, type, color, shape, image_url, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
if (!$insertStmt) {
    $_SESSION['import_result'] = ['success' => false, 'message' => 'DB prepare error.'];
    fclose($fh);
    header('Location: index.php');
    exit;
}

// helper: get or create category id by name
function getCategoryIdByName($conn, $name) {
    $name = trim($name);
    if ($name === '') return null;
    $stmt = $conn->prepare("SELECT id FROM categories WHERE name = ? LIMIT 1");
    if ($stmt) {
        $stmt->bind_param('s', $name);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && $row = $res->fetch_assoc()) { $id = (int)$row['id']; $stmt->close(); return $id; }
        $stmt->close();
    }
    // Insert
    $ins = $conn->prepare("INSERT INTO categories (name, created_at) VALUES (?, NOW())");
    if ($ins) {
        $ins->bind_param('s', $name);
        if ($ins->execute()) { $id = $conn->insert_id; $ins->close(); return $id; }
        $ins->close();
    }
    return null;
}

// Iterate rows
while (($row = fgetcsv($fh)) !== false) {
    // Map values
    $data = [];
    foreach ($columns as $i => $col) {
        $data[$col] = isset($row[$i]) ? $row[$i] : '';
    }
    // require name
    $name = trim($data['name'] ?? '');
    if ($name === '') { $skipped++; continue; }

    $sku = trim($data['sku'] ?? null);
    $barcode = trim($data['barcode'] ?? null);
    $categoryName = trim($data['category'] ?? '');
    $unit_price = isset($data['unit_price']) && $data['unit_price'] !== '' ? $data['unit_price'] : null;
    $cost = isset($data['cost']) && $data['cost'] !== '' ? $data['cost'] : null;
    // Accept Y/N, yes/no, true/false, 1/0 for boolean fields
    $boolify = function($v) {
        if ($v === null) return 0;
        $s = strtolower(trim((string)$v));
        if ($s === '1' || $s === 'true' || $s === 'y' || $s === 'yes') return 1;
        return 0;
    };
    $track_stock = isset($data['track_stock']) ? $boolify($data['track_stock']) : 0;
    $in_stock = isset($data['in_stock']) && $data['in_stock'] !== '' ? $data['in_stock'] : 0;
    $low_stock = isset($data['low_stock']) && $data['low_stock'] !== '' ? $data['low_stock'] : 0;
    $pos_available = isset($data['pos_available']) ? $boolify($data['pos_available']) : 0;
    $type = isset($data['type']) ? $data['type'] : 'color_shape';
    // Default color/shape when not provided (sample file removes these columns)
    $color = isset($data['color']) && $data['color'] !== '' ? $data['color'] : 'gray';
    $shape = isset($data['shape']) && $data['shape'] !== '' ? $data['shape'] : 'square';
    $image_url = isset($data['image_url']) && $data['image_url'] !== '' ? $data['image_url'] : null;

    // Determine owner_id: prefer CSV value, otherwise default to current user
    $owner_id = null;
    if (isset($data['owner_id']) && $data['owner_id'] !== '') {
        $owner_id = intval($data['owner_id']);
    } else {
        $owner_id = $currentUserId !== null ? intval($currentUserId) : null;
    }

    // Resolve category id
    $category_id = null;
    if ($categoryName !== '') {
        $category_id = getCategoryIdByName($conn, $categoryName);
    }

    // Bind params and execute
    // types: ssssddiiissss? but we'll use a flexible string binding for simplicity
    // Use string binding for all columns for simplicity; MySQL will coerce types as needed.
    $insertStmt->bind_param('ssssssssssssssi', $name, $sku, $barcode, $category_id, $unit_price, $cost, $track_stock, $in_stock, $low_stock, $pos_available, $type, $color, $shape, $image_url, $owner_id);
    $ok = $insertStmt->execute();
    if ($ok) {
        $inserted++;
        // Record audit log for this imported item (best-effort, non-fatal)
        try {
            $auditUserId = null;
            if (isset($_SESSION['user_id'])) $auditUserId = intval($_SESSION['user_id']);
            else if (isset($_SESSION['user']) && is_array($_SESSION['user']) && isset($_SESSION['user']['id'])) $auditUserId = intval($_SESSION['user']['id']);
            $ip = isset($_SERVER['REMOTE_ADDR']) ? $conn->real_escape_string($_SERVER['REMOTE_ADDR']) : '';
            $ua = isset($_SERVER['HTTP_USER_AGENT']) ? $conn->real_escape_string($_SERVER['HTTP_USER_AGENT']) : '';
            $actionEsc = $conn->real_escape_string('Added an Item');
            $detailsEsc = $conn->real_escape_string($name . ' (' . $sku . ')');
            $userIdSql = ($auditUserId !== null) ? intval($auditUserId) : 'NULL';
            $insAudit = "INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at) VALUES (" . $userIdSql . ", '" . $actionEsc . "', '" . $detailsEsc . "', '" . $ip . "', '" . $ua . "', NOW())";
            @$conn->query($insAudit);
        } catch (Exception $e) {
            // non-fatal: ignore audit errors
        }
    } else {
        $skipped++;
        $errors[] = "Row with name {$name} failed: " . $insertStmt->error;
    }
}

$insertStmt->close();
fclose($fh);

$_SESSION['import_result'] = ['success' => true, 'inserted' => $inserted, 'skipped' => $skipped, 'errors' => $errors];
header('Location: index.php');
exit;
?>