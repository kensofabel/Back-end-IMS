<?php
header('Content-Type: application/json; charset=utf-8');
// Simple API for Sales Report
require_once __DIR__ . '/../../config/db.php';

$start = isset($_GET['start']) && $_GET['start'] !== '' ? $_GET['start'] : null;
$end = isset($_GET['end']) && $_GET['end'] !== '' ? $_GET['end'] : null;
// Pagination params
$per_page = isset($_GET['per_page']) ? max(1, min(500, (int)$_GET['per_page'])) : 20;
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$offset = ($page - 1) * $per_page;

try {
	// Basic validation of dates (allow nulls)
	$where = [];
	$params = [];
	$types = '';

	if ($start) {
		$where[] = 'sale_date >= ?';
		$params[] = $start . ' 00:00:00';
		$types .= 's';
	}
	if ($end) {
		$where[] = 'sale_date <= ?';
		$params[] = $end . ' 23:59:59';
		$types .= 's';
	}

	$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

	// Get total count for pagination
	$countSql = "SELECT COUNT(*) AS c FROM sales $whereSql";
	$countStmt = $conn->prepare($countSql);
	if ($countStmt === false) throw new Exception('Prepare failed');
	if (count($params)) $countStmt->bind_param($types, ...$params);
	$countStmt->execute();
	$countRes = $countStmt->get_result();
	$totalCount = ($countRes && ($r = $countRes->fetch_assoc())) ? (int)$r['c'] : 0;

	// Fetch sales header rows (paged)
	$sql = "SELECT id, customer_name, sale_date, total_amount, payment_method FROM sales $whereSql ORDER BY sale_date DESC LIMIT ? OFFSET ?";
	$stmt = $conn->prepare($sql);
	if ($stmt === false) throw new Exception('Prepare failed');
	// bind dynamic params plus pagination params
	if (count($params)) {
		// add two ints to types
		$bindTypes = $types . 'ii';
		$allParams = array_merge($params, [$per_page, $offset]);
		// mysqli bind_param requires references
		$refs = [];
		foreach ($allParams as $k => $v) {
			$refs[$k] = &$allParams[$k];
		}
		array_unshift($refs, $bindTypes);
		call_user_func_array([$stmt, 'bind_param'], $refs);
	} else {
		$stmt->bind_param('ii', $per_page, $offset);
	}
	if ($stmt === false) throw new Exception('Prepare failed');
	if (count($params)) {
		$stmt->bind_param($types, ...$params);
	}
	$stmt->execute();
	$res = $stmt->get_result();

	$transactions = [];
	$totalRevenue = 0;
	$totalCount = 0;
	$productCounts = [];

	while ($row = $res->fetch_assoc()) {
		$saleId = (int)$row['id'];

		// Get items for this sale
		$itStmt = $conn->prepare('SELECT si.quantity_sold, si.total_price, p.name FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?');
		$itStmt->bind_param('i', $saleId);
		$itStmt->execute();
		$itRes = $itStmt->get_result();

		$products = [];
		$qtySum = 0;
		while ($it = $itRes->fetch_assoc()) {
			$products[] = $it['name'];
			$qtySum += (int)$it['quantity_sold'];
			$productCounts[$it['name']] = ($productCounts[$it['name']] ?? 0) + (int)$it['quantity_sold'];
		}

		$transactions[] = [
			'id' => $saleId,
			'date' => $row['sale_date'],
			'products' => implode(', ', $products),
			'qty' => $qtySum,
			'total' => (float)$row['total_amount'],
			'method' => $row['payment_method']
		];

		$totalRevenue += (float)$row['total_amount'];
		$totalCount++;
	}

	// Summary
	$average = $totalCount ? ($totalRevenue / $totalCount) : 0;
	arsort($productCounts);
	$topProduct = count($productCounts) ? array_key_first($productCounts) : null;

	echo json_encode([
		'success' => true,
		'transactions' => $transactions,
		'summary' => [
			'count' => $totalCount,
			'revenue' => number_format($totalRevenue, 2, '.', ''),
			'average' => number_format($average, 2, '.', ''),
			'topProduct' => $topProduct
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

// Close DB connection
$conn->close();

?>
