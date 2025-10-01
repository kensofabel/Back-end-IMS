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
    // Mock data (replace with AJAX/fetch in production)
    const mockData = [
      { name: 'Apple', category: 'Fruits', price: 1.2, stock: 50 },
      { name: 'Banana', category: 'Fruits', price: 0.8, stock: 10 },
      { name: 'Milk', category: 'Dairy', price: 2.5, stock: 0 },
      { name: 'Bread', category: 'Bakery', price: 1.5, stock: 5 },
      { name: 'Eggs', category: 'Dairy', price: 3.0, stock: 100 },
      { name: 'Orange', category: 'Fruits', price: 1.0, stock: 2 }
    ];

    // Calculate summary
    const totalValue = mockData.reduce((sum, item) => sum + item.price * item.stock, 0);
    const totalItems = mockData.length;
    const lowStockCount = mockData.filter(item => item.stock > 0 && item.stock <= 10).length;
    const outOfStockCount = mockData.filter(item => item.stock === 0).length;

    document.getElementById('total-inventory-value').textContent = '$' + totalValue.toFixed(2);
    document.getElementById('total-inventory-items').textContent = totalItems;
    document.getElementById('low-stock-count').textContent = lowStockCount;
    document.getElementById('out-of-stock-count').textContent = outOfStockCount;

    // Update table
    const tbody = document.getElementById('inventory-report-table-body');
    tbody.innerHTML = '';
    mockData.forEach(item => {
      const tr = document.createElement('tr');
      let status = '';
      if (item.stock === 0) status = '<span style="color:#f44336;font-weight:bold">Out of Stock</span>';
      else if (item.stock <= 10) status = '<span style="color:#ff9800;font-weight:bold">Low Stock</span>';
      else status = '<span style="color:#4caf50;font-weight:bold">In Stock</span>';
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>$${item.price.toFixed(2)}</td>
        <td>${item.stock}</td>
        <td>${status}</td>
      `;
      tbody.appendChild(tr);
    });
  };
});
