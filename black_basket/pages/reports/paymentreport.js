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
    // Get date range
    const startDate = document.getElementById('payment-report-start-date').value;
    const endDate = document.getElementById('payment-report-end-date').value;

    // Mock data (replace with AJAX/fetch in production)
    const mockData = [
      { id: 'TXN001', date: '2025-09-01 10:00', method: 'Cash', amount: 120.00, products: 'Apples, Bananas' },
      { id: 'TXN002', date: '2025-09-01 11:30', method: 'Card', amount: 75.50, products: 'Oranges' },
      { id: 'TXN003', date: '2025-09-02 09:15', method: 'Cash', amount: 200.00, products: 'Milk, Bread' },
      { id: 'TXN004', date: '2025-09-02 14:20', method: 'Card', amount: 50.00, products: 'Eggs' }
    ];

    // Filter by date if needed (for demo, just use all)
    let filtered = mockData;
    if (startDate) {
      filtered = filtered.filter(row => row.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(row => row.date <= endDate + ' 23:59');
    }

    // Update summary cards
    document.getElementById('total-payment-transactions').textContent = filtered.length;
    const totalRevenue = filtered.reduce((sum, row) => sum + row.amount, 0);
    document.getElementById('total-payment-revenue').textContent = '$' + totalRevenue.toFixed(2);
    const cashCount = filtered.filter(row => row.method === 'Cash').length;
    const cardCount = filtered.filter(row => row.method === 'Card').length;
    document.getElementById('cash-payments').textContent = cashCount;
    document.getElementById('card-payments').textContent = cardCount;

    // Update table
    const tbody = document.getElementById('payment-report-table-body');
    tbody.innerHTML = '';
    filtered.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${row.date}</td>
        <td>${row.method}</td>
        <td>$${row.amount.toFixed(2)}</td>
        <td>${row.products}</td>
      `;
      tbody.appendChild(tr);
    });
  };
