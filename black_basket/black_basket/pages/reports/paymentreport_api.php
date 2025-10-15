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

	// total count
	$countSql = "SELECT COUNT(*) AS c FROM sales $whereSql";
	$countStmt = $conn->prepare($countSql);
	if ($countStmt === false) throw new Exception('Prepare failed');
	if (count($params)) $countStmt->bind_param($types, ...$params);
	$countStmt->execute();
	$countRes = $countStmt->get_result();
	$totalCount = ($countRes && ($r = $countRes->fetch_assoc())) ? (int)$r['c'] : 0;

	$sql = "SELECT id, sale_date, total_amount, payment_method FROM sales $whereSql ORDER BY sale_date DESC LIMIT ? OFFSET ?";
	$stmt = $conn->prepare($sql);
	if ($stmt === false) throw new Exception('Prepare failed');
	if (count($params)) {
		$allParams = array_merge($params, [$per_page, $offset]);
		$refs = [];
		foreach ($allParams as $k => $v) { $refs[$k] = &$allParams[$k]; }
		array_unshift($refs, $types . 'ii');
		call_user_func_array([$stmt, 'bind_param'], $refs);
	} else {
		$stmt->bind_param('ii', $per_page, $offset);
	}
	$stmt->execute();
	$res = $stmt->get_result();

	$payments = [];
	$totalAmount = 0;
	$totalCount = 0;
	$cashCount = 0;
	$cardCount = 0;

	while ($row = $res->fetch_assoc()) {
		$payments[] = [
			'id' => (int)$row['id'],
			'date' => $row['sale_date'],
			'amount' => (float)$row['total_amount'],
			'method' => $row['payment_method'],
			'status' => 'Completed'
		];

		$totalAmount += (float)$row['total_amount'];
		$totalCount++;
		$m = strtolower($row['payment_method']);
		if ($m === 'cash') $cashCount++;
		if ($m === 'card' || $m === 'credit' || $m === 'debit') $cardCount++;
	}

	echo json_encode([
		'success' => true,
		'payments' => $payments,
		'summary' => [
			'totalPayments' => $totalCount,
			'totalAmount' => number_format($totalAmount,2,'.',''),
			'cashPayments' => $cashCount,
			'cardPayments' => $cardCount
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
