// paymentreport.js - Custom JS for Payment Report page

document.addEventListener('DOMContentLoaded', function() {
  // Example: Filter form submission
  const filterForm = document.querySelector('.payment-report-filters');
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // TODO: Implement AJAX/filter logic here
      // Example: fetchPaymentReport();
    });
  }

  // Example: Row click highlight
  const table = document.querySelector('.payment-report-table');
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
  // Attach Generate Report button handler
  window.generatePaymentReport = function() {
    const startDate = document.getElementById('payment-report-start-date').value;
    const endDate = document.getElementById('payment-report-end-date').value;

    const tbody = document.getElementById('payment-report-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ff9800;">Loading...</td></tr>';

    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);

    fetch('paymentreport_api.php?' + params.toString(), { credentials: 'same-origin', cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Network error')))
      .then(json => {
        if (!json || !json.success) throw new Error(json.message || 'Failed to load report');
        const { transactions, summary, currencySymbol } = json;

        // Summary cards
        document.getElementById('total-payment-transactions').textContent = summary.count;
        document.getElementById('total-payment-revenue').textContent = currencySymbol + Number(summary.revenue).toFixed(2);
        document.getElementById('cash-payments').textContent = summary.cash;
        document.getElementById('card-payments').textContent = summary.card;

        // Table
        if (!transactions || transactions.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:.8">No transactions found for the selected range.</td></tr>';
        } else {
          tbody.innerHTML = '';
          transactions.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>TXN${row.id}</td>
              <td>${row.date}</td>
              <td>${row.method}</td>
              <td>${currencySymbol}${Number(row.amount).toFixed(2)}</td>
              <td>${row.products}</td>
            `;
            tbody.appendChild(tr);
          });
        }
      })
      .catch(err => {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#f66;">${err.message}</td></tr>`;
      });
  };
