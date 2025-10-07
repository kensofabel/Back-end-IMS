// inventoryreport.js - Custom JS for Inventory Report page

document.addEventListener('DOMContentLoaded', function() {
  // Example: Filter form submission
  const filterForm = document.querySelector('.inventory-report-filters');
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // TODO: Implement AJAX/filter logic here
      // Example: fetchInventoryReport();
    });
  }

  // Example: Row click highlight
  const table = document.querySelector('.inventory-report-table');
  if (table) {
    table.addEventListener('click', function(e) {
      const row = e.target.closest('tr');
      if (row && row.parentNode.tagName === 'TBODY') {
        table.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected-row'));
        row.classList.add('selected-row');
      }
    });
  }

  // Attach Generate Report button handler
  window.generateInventoryReport = function() {
    const tbody = document.getElementById('inventory-report-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ff9800;">Loading...</td></tr>';

    fetch('inventoryreport_api.php', { credentials: 'same-origin', cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Network error')))
      .then(json => {
        if (!json || !json.success) throw new Error(json.message || 'Failed to load report');
        const { items, summary, currencySymbol } = json;

        // Summary
        document.getElementById('total-inventory-value').textContent = currencySymbol + Number(summary.totalValue).toFixed(2);
        document.getElementById('total-inventory-items').textContent = summary.totalItems;
        document.getElementById('low-stock-count').textContent = summary.lowStock;
        document.getElementById('out-of-stock-count').textContent = summary.outOfStock;

        // Table
        if (!items || items.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:.8">No products found.</td></tr>';
          return;
        }
        tbody.innerHTML = '';
        items.forEach(item => {
          let status = '';
          if (item.status === 'out') status = '<span style="color:#f44336;font-weight:bold">Out of Stock</span>';
          else if (item.status === 'low') status = '<span style="color:#ff9800;font-weight:bold">Low Stock</span>';
          else status = '<span style="color:#4caf50;font-weight:bold">In Stock</span>';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category || ''}</td>
            <td>${currencySymbol}${Number(item.price).toFixed(2)}</td>
            <td>${item.stock}</td>
            <td>${status}</td>
          `;
          tbody.appendChild(tr);
        });
      })
      .catch(err => {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#f66;">${err.message}</td></tr>`;
      });
  };
});
