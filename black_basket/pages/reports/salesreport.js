document.addEventListener('DOMContentLoaded', function() {
  // Example: Filter form submission
  const filterForm = document.querySelector('.sales-report-filters');
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // TODO: Implement AJAX/filter logic here
      // Example: fetchSalesReport();
    });
  }

  // Example: Row click highlight
  const table = document.querySelector('.sales-report-table');
  if (table) {
    table.addEventListener('click', function(e) {
      const row = e.target.closest('tr');
      if (row && row.parentNode.tagName === 'TBODY') {
        table.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected-row'));
        row.classList.add('selected-row');
      }
    });
  }
});
// salesreport.js - Custom JS for Sales Report page

document.addEventListener('DOMContentLoaded', function() {
  // Example: Filter form submission
  const filterForm = document.querySelector('.sales-report-filters');
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      generateSalesReport();
    });
  }

  // Reset button
  const resetBtn = document.getElementById('reset-sales-report');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      document.getElementById('report-start-date').value = '';
      document.getElementById('report-end-date').value = '';
      salesPageState.page = 1;
      generateSalesReport();
    });
  }

  // Example: Row click highlight
  const table = document.querySelector('.sales-report-table');
  if (table) {
    table.addEventListener('click', function(e) {
      const row = e.target.closest('tr');
      if (row && row.parentNode.tagName === 'TBODY') {
        table.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected-row'));
        row.classList.add('selected-row');
      }
    });
  }
});

// Make Generate Report button work (fetch real data)
// Pagination state
let salesPageState = { page: 1, per_page: 20 };

function renderSalesPager(pagination) {
  const containerId = 'sales-report-pager';
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
    <button id="sales-prev" ${page <= 1 ? 'disabled' : ''}>Prev</button>
    <span style="margin:0 8px">Page ${page} / ${totalPages}</span>
    <button id="sales-next" ${page >= totalPages ? 'disabled' : ''}>Next</button>
  `;

  document.getElementById('sales-prev').onclick = () => { salesPageState.page = Math.max(1, page - 1); generateSalesReport(); };
  document.getElementById('sales-next').onclick = () => { salesPageState.page = Math.min(totalPages, page + 1); generateSalesReport(); };
}

// Auto-load rows on page load so the sales table is visible immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => { salesPageState.page = 1; generateSalesReport(); }, 50);
} else {
  document.addEventListener('DOMContentLoaded', () => { salesPageState.page = 1; generateSalesReport(); });
}

function generateSalesReport() {
  const startDate = document.getElementById('report-start-date').value;
  const endDate = document.getElementById('report-end-date').value;

  const tbody = document.getElementById('sales-report-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ff9800;">Loading...</td></tr>';

  // Client-side date validation
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s > e) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f66;">Invalid date range: start date must be before or equal to end date.</td></tr>';
      return;
    }
  }

  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);
  params.append('page', salesPageState.page);
  params.append('per_page', salesPageState.per_page);

  // Use absolute path so this fetch works from any page in the app
  fetch('/black_basket/pages/reports/salesreport_api.php?' + params.toString(), { credentials: 'same-origin', cache: 'no-store' })
    .then(async r => {
      if (!r.ok) throw new Error('Network error: ' + r.status + ' ' + r.statusText);
      const ct = r.headers.get('Content-Type') || '';
      const text = await r.text();
      if (!text) throw new Error('Empty response from server');
      if (ct.indexOf('application/json') === -1) {
        // Attempt to parse anyway, but log raw text for debugging
        console.warn('salesreport_api returned non-JSON Content-Type:', ct, 'raw:', text);
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse salesreport_api response, raw:', text);
        throw new Error('Server returned an unexpected response. This may be due to an invalid date range or a server error. Please check your dates and try again.');
      }
    })
    .then(json => {
      if (!json || !json.success) throw new Error(json.message || 'Failed to load report');
      const { transactions, summary, currencySymbol } = json;
      // Render table
      if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;opacity:.8">No transactions found for the selected range.</td></tr>';
      } else {
        tbody.innerHTML = transactions.map(row => `
          <tr>
            <td>TXN${row.id}</td>
            <td>${row.date}</td>
            <td>${row.products}</td>
            <td>${row.qty}</td>
            <td>${currencySymbol}${Number(row.total).toFixed(2)}</td>
            <td>${row.method}</td>
          </tr>
        `).join('');
      }

      // Summary
      if (document.getElementById('total-sales-count')) document.getElementById('total-sales-count').textContent = summary.count;
      if (document.getElementById('total-sales-revenue')) document.getElementById('total-sales-revenue').textContent = currencySymbol + Number(summary.revenue).toFixed(2);
      if (document.getElementById('average-sale')) document.getElementById('average-sale').textContent = currencySymbol + Number(summary.average).toFixed(2);
      if (document.getElementById('top-product')) document.getElementById('top-product').textContent = summary.topProduct || 'N/A';

      // Optional period comparison display
      if (summary.period && summary.previous_period) {
        if (document.getElementById('period-start')) document.getElementById('period-start').textContent = summary.period.start;
        if (document.getElementById('period-end')) document.getElementById('period-end').textContent = summary.period.end;
        if (document.getElementById('prev-period-start')) document.getElementById('prev-period-start').textContent = summary.previous_period.start;
        if (document.getElementById('prev-period-end')) document.getElementById('prev-period-end').textContent = summary.previous_period.end;
        if (document.getElementById('sales-count-change')) document.getElementById('sales-count-change').textContent = (summary.count_change_percent !== null) ? Number(summary.count_change_percent).toFixed(2) + '%' : 'N/A';
        if (document.getElementById('sales-revenue-change')) document.getElementById('sales-revenue-change').textContent = (summary.revenue_change_percent !== null) ? Number(summary.revenue_change_percent).toFixed(2) + '%' : 'N/A';
      }

      // Pager
      if (json.pagination) renderSalesPager(json.pagination);
    })
    .catch(err => {
      console.error('generateSalesReport error:', err);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#f66;">${err.message}</td></tr>`;
    });
}
