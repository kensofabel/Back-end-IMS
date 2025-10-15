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

		fetch('paymentreport_api.php?' + params.toString(), { credentials: 'same-origin', cache: 'no-store' })
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
				tbody.innerHTML = payments.map(p => `
					<tr>
						<td>PAY${p.id}</td>
						<td>${p.date}</td>
						<td>${currencySymbol}${Number(p.amount).toFixed(2)}</td>
						<td>${p.method}</td>
						<td>${p.status}</td>
					</tr>
				`).join('');
			}

			document.getElementById('total-payments').textContent = summary.totalPayments;
			document.getElementById('total-payment-amount').textContent = currencySymbol + Number(summary.totalAmount).toFixed(2);
			document.getElementById('cash-payments').textContent = summary.cashPayments;
			document.getElementById('card-payments').textContent = summary.cardPayments;
			if (json.pagination) renderPaymentPager(json.pagination);
		})
		.catch(err => {
			console.error('generatePaymentReport error:', err);
			tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#f66;">${err.message}</td></tr>`;
		});
}
