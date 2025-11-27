<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/db.php';

$start = isset($_GET['start']) && $_GET['start'] !== '' ? $_GET['start'] : null;
$end = isset($_GET['end']) && $_GET['end'] !== '' ? $_GET['end'] : null;
// Pagination params
$per_page = isset($_GET['per_page']) ? max(1, min(500, (int)$_GET['per_page'])) : 20;
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$offset = ($page - 1) * $per_page;

try {
	$where = [];
	$params = [];
	$types = '';

	if ($start) {
		$where[] = 'p.created_at >= ?';
		$params[] = $start . ' 00:00:00';
		$types .= 's';
	}
	if ($end) {
		$where[] = 'p.created_at <= ?';
		$params[] = $end . ' 23:59:59';
		$types .= 's';
	}

	$whereSql = count($where) ? ('AND ' . implode(' AND ', $where)) : '';

	// total count (from products)
	$countSql = "SELECT COUNT(*) AS c FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE 1=1 $whereSql";
	$countStmt = $conn->prepare($countSql);
	if ($countStmt === false) throw new Exception('Prepare failed');
	if (count($params)) {
		$countStmt->bind_param($types, ...$params);
	}
	$countStmt->execute();
	$countRes = $countStmt->get_result();
	$totalCount = ($countRes && ($r = $countRes->fetch_assoc())) ? (int)$r['c'] : 0;

	// Fetch products (use products.in_stock and products.price)
	// in_stock may contain strings like "34 0" so extract leading numeric part
	$sql = "SELECT p.id, p.name, c.name AS category, ";
	$sql .= "CAST(NULLIF(p.price,'') AS DECIMAL(12,2)) AS unit_price, ";
	$sql .= "COALESCE(CAST(SUBSTRING_INDEX(p.in_stock,' ',1) AS DECIMAL(12,2)),0) AS quantity ";
	$sql .= "FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE 1=1 $whereSql ORDER BY p.name LIMIT ? OFFSET ?";

	$stmt = $conn->prepare($sql);
	if ($stmt === false) throw new Exception('Prepare failed');
	// bind params and pagination
	$bindTypes = $types . 'ii';
	$allParams = array_merge($params, [$per_page, $offset]);
	$refs = [];
	foreach ($allParams as $k => $v) { $refs[$k] = &$allParams[$k]; }
	array_unshift($refs, $bindTypes);
	call_user_func_array([$stmt, 'bind_param'], $refs);

	$stmt->execute();
	$res = $stmt->get_result();

	$items = [];
	$totalValue = 0;
	$totalItems = 0;
	$lowStock = 0;
	$outOfStock = 0;

	// Assume 'low stock' threshold is 5 unless min_stock_level exists (not in schema)
	$lowThreshold = 5;

	while ($row = $res->fetch_assoc()) {
		$qty = (int)$row['quantity'];
		$value = $qty * (float)$row['unit_price'];
		$status = $qty <= 0 ? 'Out of Stock' : ($qty <= $lowThreshold ? 'Low Stock' : 'In Stock');

		if ($qty <= 0) $outOfStock++;
		if ($qty > 0 && $qty <= $lowThreshold) $lowStock++;

		$items[] = [
			'id' => (int)$row['id'],
			'name' => $row['name'],
			'category' => $row['category'],
			'price' => (float)$row['unit_price'],
			'quantity' => $qty,
			'status' => $status
		];

		$totalValue += $value;
		$totalItems += $qty;
	}

	echo json_encode([
		'success' => true,
		'items' => $items,
		'summary' => [
			'totalItems' => $totalItems,
			'totalValue' => number_format($totalValue,2,'.',''),
			'lowStockCount' => $lowStock,
			'outOfStockCount' => $outOfStock
		],
		'pagination' => [
			'page' => $page,
			'per_page' => $per_page,
			'total_count' => $totalCount
		],
		'currencySymbol' => '₱'
	]);

} catch (Exception $ex) {
	http_response_code(500);
	echo json_encode(['success' => false, 'message' => $ex->getMessage()]);
}

$conn->close();

?>
