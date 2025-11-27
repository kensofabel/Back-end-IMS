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
		$where[] = 'created_at >= ?';
		$params[] = $start . ' 00:00:00';
		$types .= 's';
	}
	if ($end) {
		$where[] = 'created_at <= ?';
		$params[] = $end . ' 23:59:59';
		$types .= 's';
	}

	$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

	// total count (for pagination)
	$countSql = "SELECT COUNT(*) AS c FROM sales $whereSql";
	$countStmt = $conn->prepare($countSql);
	if ($countStmt === false) throw new Exception('Prepare failed');
	if (count($params)) $countStmt->bind_param($types, ...$params);
	$countStmt->execute();
	$countRes = $countStmt->get_result();
	$totalRows = ($countRes && ($r = $countRes->fetch_assoc())) ? (int)$r['c'] : 0;

	$sql = "SELECT id, created_at AS sale_date, total_amount, payment_method, COALESCE(status, 'completed') AS status FROM sales $whereSql ORDER BY created_at DESC LIMIT ? OFFSET ?";
	$stmt = $conn->prepare($sql);
	if ($stmt === false) throw new Exception('Prepare failed');
	$bindTypes = $types . 'ii';
	$allParams = array_merge($params, [$per_page, $offset]);
	$refs = [];
	foreach ($allParams as $k => $v) { $refs[$k] = &$allParams[$k]; }
	array_unshift($refs, $bindTypes);
	call_user_func_array([$stmt, 'bind_param'], $refs);
	$stmt->execute();
	$res = $stmt->get_result();

	$payments = [];
	$totalAmount = 0;
	$totalRetrieved = 0;
	$cashCount = 0;
	$cardCount = 0;
	$onlineCount = 0;
	$byMethod = [];
	$byStatus = [];

	// aggregate totals by status for the filtered range
	$aggSql = "SELECT COALESCE(status,'completed') AS status, COUNT(*) AS cnt, COALESCE(SUM(total_amount),0) AS amt FROM sales $whereSql GROUP BY COALESCE(status,'completed')";
	$aggStmt = $conn->prepare($aggSql);
	if ($aggStmt === false) throw new Exception('Prepare failed (agg)');
	if (count($params)) {
		// bind filter params
		$aggStmt->bind_param($types, ...$params);
	}
	$aggStmt->execute();
	$aggRes = $aggStmt->get_result();
	$totalAmountAll = 0;
	while ($ar = $aggRes->fetch_assoc()) {
		$skey = strtolower(trim((string)$ar['status']));
		$byStatus[$skey] = ['count' => (int)$ar['cnt'], 'amount' => (float)$ar['amt']];
		$totalAmountAll += (float)$ar['amt'];
	}
	$aggStmt->close();

	while ($row = $res->fetch_assoc()) {
		$rawStatus = isset($row['status']) ? strtolower(trim((string)$row['status'])) : 'completed';
		$label = 'Completed';
		if ($rawStatus === 'cancelled' || $rawStatus === 'canceled') $label = 'Cancelled';
		else if ($rawStatus === 'refund' || $rawStatus === 'refunded') $label = 'Refunded';

		$payments[] = [
			'id' => (int)$row['id'],
			'date' => $row['sale_date'],
			'amount' => (float)$row['total_amount'],
			'method' => $row['payment_method'],
			'status' => $label,
			'raw_status' => $rawStatus
		];

		$amt = (float)$row['total_amount'];
		$totalAmount += $amt;
		$totalRetrieved++;
		$m = strtolower(trim((string)$row['payment_method']));
		if ($m === 'cash') $cashCount++;
		if ($m === 'card' || $m === 'credit' || $m === 'debit') $cardCount++;
		// treat common online/e-wallet/third-party methods as online payments
		if (strpos($m, 'online') !== false || strpos($m, 'gcash') !== false || strpos($m, 'gpay') !== false || strpos($m, 'pay') !== false || strpos($m, 'paypal') !== false || strpos($m, 'stripe') !== false || strpos($m, 'paymaya') !== false || strpos($m, 'ewallet') !== false || strpos($m, 'e-wallet') !== false) {
			// exclude 'pay' matching 'pay' that might be part of 'payday' etc. but in POS context it's acceptable
			$onlineCount++;
		}
		if (!isset($byMethod[$m])) $byMethod[$m] = ['count' => 0, 'amount' => 0.0];
		$byMethod[$m]['count']++;
		$byMethod[$m]['amount'] += $amt;
	}

	echo json_encode([
		'success' => true,
		'payments' => $payments,
		'summary' => [
			'totalPayments' => $totalRows,
			// total across filtered range (all statuses)
			'totalAmount' => number_format(isset($totalAmountAll) ? $totalAmountAll : $totalAmount,2,'.',''),
			'cashPayments' => $cashCount,
			'cardPayments' => $cardCount,
			'onlinePayments' => $onlineCount,
			'byMethod' => $byMethod,
			'byStatus' => $byStatus
		],
		'pagination' => [
			'page' => $page,
			'per_page' => $per_page,
			'total_count' => $totalRows
		],
		'currencySymbol' => '₱'
	]);

} catch (Exception $ex) {
	http_response_code(500);
	echo json_encode(['success' => false, 'message' => $ex->getMessage()]);
}

$conn->close();

?>
