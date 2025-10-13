document.addEventListener('DOMContentLoaded', function() {
	const filterBtn = document.querySelector('.report-filters button');
	if (filterBtn) filterBtn.addEventListener('click', generateInventoryReport);

	const resetBtn = document.getElementById('reset-inventory-report');
	if (resetBtn) {
		resetBtn.addEventListener('click', function () {
			document.getElementById('report-start-date').value = '';
			document.getElementById('report-end-date').value = '';
			inventoryPageState.page = 1;
			generateInventoryReport();
		});
	}
});

// Pagination state
let inventoryPageState = { page: 1, per_page: 20 };

function renderInventoryPager(pagination) {
	const containerId = 'inventory-report-pager';
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
		<button id="inventory-prev" ${page <= 1 ? 'disabled' : ''}>Prev</button>
		<span style="margin:0 8px">Page ${page} / ${totalPages}</span>
		<button id="inventory-next" ${page >= totalPages ? 'disabled' : ''}>Next</button>
	`;

	document.getElementById('inventory-prev').onclick = () => { inventoryPageState.page = Math.max(1, page - 1); generateInventoryReport(); };
	document.getElementById('inventory-next').onclick = () => { inventoryPageState.page = Math.min(totalPages, page + 1); generateInventoryReport(); };
}

function generateInventoryReport() {
	const startDate = document.getElementById('report-start-date').value;
	const endDate = document.getElementById('report-end-date').value;
	const tbody = document.getElementById('inventory-report-table-body');
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
		params.append('page', inventoryPageState.page);
		params.append('per_page', inventoryPageState.per_page);

		fetch('inventoryreport_api.php?' + params.toString(), { credentials: 'same-origin', cache: 'no-store' })
			.then(async r => {
				if (!r.ok) throw new Error('Network error: ' + r.status + ' ' + r.statusText);
				const ct = r.headers.get('Content-Type') || '';
				const text = await r.text();
				if (!text) throw new Error('Empty response from server');
				if (ct.indexOf('application/json') === -1) {
					console.warn('inventoryreport_api returned non-JSON Content-Type:', ct, 'raw:', text);
				}
						try {
							return JSON.parse(text);
						} catch (e) {
							console.error('Failed to parse inventoryreport_api response, raw:', text);
							throw new Error('Server returned an unexpected response. This may be due to an invalid date range or a server error. Please check your dates and try again.');
						}
			})
			.then(json => {
			if (!json || !json.success) throw new Error(json.message || 'Failed to load inventory');
			const { items, summary, currencySymbol } = json;
			if (!items || items.length === 0) {
				tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:.8">No inventory data available</td></tr>';
			} else {
				tbody.innerHTML = items.map(i => `
					<tr>
						<td>${i.name}</td>
						<td>${i.category}</td>
						<td>${currencySymbol}${Number(i.price).toFixed(2)}</td>
						<td>${i.quantity}</td>
						<td>${i.status}</td>
					</tr>
				`).join('');
			}

			document.getElementById('total-inventory-items').textContent = summary.totalItems;
			document.getElementById('total-inventory-value').textContent = currencySymbol + Number(summary.totalValue).toFixed(2);
			document.getElementById('low-stock-count').textContent = summary.lowStockCount;
			document.getElementById('out-of-stock-count').textContent = summary.outOfStockCount;
			if (json.pagination) renderInventoryPager(json.pagination);
		})
		.catch(err => {
			console.error('generateInventoryReport error:', err);
			tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#f66;">${err.message}</td></tr>`;
		});
}
