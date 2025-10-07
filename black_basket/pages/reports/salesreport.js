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
function generateSalesReport() {
  const startDate = document.getElementById('report-start-date').value;
  const endDate = document.getElementById('report-end-date').value;

  const tbody = document.getElementById('sales-report-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ff9800;">Loading...</td></tr>';

  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);

  fetch('salesreport_api.php?' + params.toString(), { credentials: 'same-origin', cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Network error')))
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
    })
    .catch(err => {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#f66;">${err.message}</td></tr>`;
    });
}
