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

  fetch('salesreport_api.php?' + params.toString(), { credentials: 'same-origin', cache: 'no-store' })
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
      document.getElementById('total-sales-count').textContent = summary.count;
      document.getElementById('total-sales-revenue').textContent = currencySymbol + Number(summary.revenue).toFixed(2);
      document.getElementById('average-sale').textContent = currencySymbol + Number(summary.average).toFixed(2);
      document.getElementById('top-product').textContent = summary.topProduct || 'N/A';

      // Pager
      if (json.pagination) renderSalesPager(json.pagination);
    })
    .catch(err => {
      console.error('generateSalesReport error:', err);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#f66;">${err.message}</td></tr>`;
    });
}
