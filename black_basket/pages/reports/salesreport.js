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

// Make Generate Report button work
function generateSalesReport() {
  // Get filter values
  const startDate = document.getElementById('report-start-date').value;
  const endDate = document.getElementById('report-end-date').value;

  // TODO: Replace with real AJAX call to backend when available
  // Simulate loading and populate with mock data
  const tbody = document.getElementById('sales-report-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ff9800;">Loading...</td></tr>';

  setTimeout(() => {
    // Example mock data
    const data = [
      {
        id: 'TXN001', date: '2025-09-30 10:15', products: 'Apple, Banana', qty: 5, total: 25.00, method: 'Cash'
      },
      {
        id: 'TXN002', date: '2025-09-30 11:20', products: 'Orange', qty: 2, total: 10.00, method: 'Card'
      }
    ];
    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${row.id}</td>
        <td>${row.date}</td>
        <td>${row.products}</td>
        <td>${row.qty}</td>
        <td>$${row.total.toFixed(2)}</td>
        <td>${row.method}</td>
      </tr>
    `).join('');

    // Update summary
    document.getElementById('total-sales-count').textContent = data.length;
    document.getElementById('total-sales-revenue').textContent = '$' + data.reduce((a, b) => a + b.total, 0).toFixed(2);
    document.getElementById('average-sale').textContent = '$' + (data.reduce((a, b) => a + b.total, 0) / data.length).toFixed(2);
    document.getElementById('top-product').textContent = 'Apple';
  }, 800);
}
