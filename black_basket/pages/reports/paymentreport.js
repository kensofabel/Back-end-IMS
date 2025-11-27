document.addEventListener('DOMContentLoaded', function() {
	const filterBtn = document.querySelector('.report-filters button');
	if (filterBtn) filterBtn.addEventListener('click', generatePaymentReport);

	const resetBtn = document.getElementById('reset-payment-report');
	if (resetBtn) {
		resetBtn.addEventListener('click', function () {
			document.getElementById('report-start-date').value = '';
			document.getElementById('report-end-date').value = '';
			paymentPageState.page = 1;
			generatePaymentReport();
		});
	}
});

// Pagination state
let paymentPageState = { page: 1, per_page: 20 };

function renderPaymentPager(pagination) {
	const containerId = 'payment-report-pager';
	let container = document.getElementById(containerId);
	if (!container) {
		container = document.createElement('div');
		container.id = containerId;
		container.style.margin = '12px 0';
		const tableContainer = document.querySelector('.sales-report-table-container');
		tableContainer.parentNode.insertBefore(container, tableContainer.nextSibling);
	}

	const { page, per_page, total_count } = pagination;
	const totalPages = Math.max(1, Math.ceil(total_count / per_page));

	container.innerHTML = `
		<button id="payment-prev" ${page <= 1 ? 'disabled' : ''}>Prev</button>
		<span style="margin:0 8px">Page ${page} / ${totalPages}</span>
		<button id="payment-next" ${page >= totalPages ? 'disabled' : ''}>Next</button>
	`;

	document.getElementById('payment-prev').onclick = () => { paymentPageState.page = Math.max(1, page - 1); generatePaymentReport(); };
	document.getElementById('payment-next').onclick = () => { paymentPageState.page = Math.min(totalPages, page + 1); generatePaymentReport(); };
}

// Auto-load rows on page load so the payment table is visible immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
	setTimeout(() => { paymentPageState.page = 1; generatePaymentReport(); }, 50);
} else {
	document.addEventListener('DOMContentLoaded', () => { paymentPageState.page = 1; generatePaymentReport(); });
}

function generatePaymentReport() {
	const startDate = document.getElementById('report-start-date').value;
	const endDate = document.getElementById('report-end-date').value;
	const tbody = document.getElementById('payment-report-table-body');
	tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ff9800">Loading...</td></tr>';

	// Client-side date validation
	if (startDate && endDate) {
		const s = new Date(startDate);
		const e = new Date(endDate);
		if (s > e) {
			tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#f66;">Invalid date range: start date must be before or equal to end date.</td></tr>';
			return;
		}
	}

		const params = new URLSearchParams();
		if (startDate) params.append('start', startDate);
		if (endDate) params.append('end', endDate);
		params.append('page', paymentPageState.page);
		params.append('per_page', paymentPageState.per_page);

		// Use absolute path so this script works when included from other pages
		fetch('/black_basket/pages/reports/paymentreport_api.php?' + params.toString(), { credentials: 'same-origin', cache: 'no-store' })
		.then(async r => {
			if (!r.ok) throw new Error('Network error: ' + r.status + ' ' + r.statusText);
			const ct = r.headers.get('Content-Type') || '';
			const text = await r.text();
			if (!text) throw new Error('Empty response from server');
			if (ct.indexOf('application/json') === -1) {
				console.warn('paymentreport_api returned non-JSON Content-Type:', ct, 'raw:', text);
			}
					try {
						return JSON.parse(text);
					} catch (e) {
						console.error('Failed to parse paymentreport_api response, raw:', text);
						// Friendly message for users — suggest date check as common cause
						throw new Error('Server returned an unexpected response. This may be due to an invalid date range or a server error. Please check your dates and try again.');
					}
		})
		.then(json => {
			if (!json || !json.success) throw new Error(json.message || 'Failed to load payments');
			const { payments, summary, currencySymbol } = json;
			if (!payments || payments.length === 0) {
				tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:.8">No payments found</td></tr>';
			} else {
				tbody.innerHTML = payments.map(p => {
					const raw = (p.raw_status || String(p.status || '')).toLowerCase();
					let style = '';
					if (raw === 'cancelled' || raw === 'canceled') style = 'color:#f44336';
					else if (raw.indexOf('refund') !== -1 || raw === 'refunded') style = 'color:#ff9800';
					return `
					<tr>
						<td>PAY${p.id}</td>
						<td>${p.date}</td>
						<td>${currencySymbol}${Number(p.amount).toFixed(2)}</td>
						<td>${p.method}</td>
						<td style="${style}">${p.status}</td>
					</tr>
				`}).join('');
			}

		// Summary: support both legacy keys and new byMethod breakdown
		if (document.getElementById('total-payments')) document.getElementById('total-payments').textContent = summary.totalPayments ?? summary.totalPayments ?? 0;
		if (document.getElementById('total-payment-amount')) document.getElementById('total-payment-amount').textContent = currencySymbol + Number(summary.totalAmount ?? 0).toFixed(2);

		// By method breakdown (new API) or legacy cash/card fields
		const byMethod = summary.byMethod ?? {};
		if (Object.keys(byMethod).length) {
			if (document.getElementById('cash-payments')) document.getElementById('cash-payments').textContent = byMethod['cash'] ? byMethod['cash'].count : (summary.cashPayments ?? 0);
			if (document.getElementById('card-payments')) document.getElementById('card-payments').textContent = byMethod['card'] ? byMethod['card'].count : (summary.cardPayments ?? 0);
			if (document.getElementById('online-payments')) {
				// Prefer an explicit 'online' method bucket, otherwise sum common online methods
				if (byMethod['online']) {
					document.getElementById('online-payments').textContent = byMethod['online'].count;
				} else {
					let onlineCount = 0;
					['gcash','gpay','paypal','stripe','paymaya','ewallet','online'].forEach(k => { if (byMethod[k]) onlineCount += byMethod[k].count; });
					// Fallback to API-provided summary.onlinePayments if available
					if (onlineCount === 0 && (summary.onlinePayments || summary.onlinePayments === 0)) onlineCount = summary.onlinePayments;
					document.getElementById('online-payments').textContent = onlineCount;
				}
			}
		} else {
			if (document.getElementById('cash-payments')) document.getElementById('cash-payments').textContent = summary.cashPayments ?? 0;
			if (document.getElementById('card-payments')) document.getElementById('card-payments').textContent = summary.cardPayments ?? 0;
			if (document.getElementById('online-payments')) document.getElementById('online-payments').textContent = summary.onlinePayments ?? 0;
		}

		// Optional analytics placeholders: change percents
		if (document.getElementById('payments-change')) document.getElementById('payments-change').textContent = (summary.payments_change_percent !== null && summary.payments_change_percent !== undefined) ? Number(summary.payments_change_percent).toFixed(2) + '%' : 'N/A';
		if (document.getElementById('amount-change')) document.getElementById('amount-change').textContent = (summary.amount_change_percent !== null && summary.amount_change_percent !== undefined) ? Number(summary.amount_change_percent).toFixed(2) + '%' : 'N/A';
			if (json.pagination) renderPaymentPager(json.pagination);
		})
		.catch(err => {
			console.error('generatePaymentReport error:', err);
			tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#f66;">${err.message}</td></tr>`;
		});
}
