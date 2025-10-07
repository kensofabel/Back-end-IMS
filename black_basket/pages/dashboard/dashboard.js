// dashboard.js - Populates dashboard stats and activities with mock data

document.addEventListener('DOMContentLoaded', function() {
  // Mock stats data
  const stats = {
    totalProducts: 120,
    totalSales: 350,
    lowStock: 8,
    totalRevenue: 12500.75
  };
  document.getElementById('total-products').textContent = stats.totalProducts;
  document.getElementById('total-sales').textContent = stats.totalSales;
  document.getElementById('low-stock').textContent = stats.lowStock;
  document.getElementById('total-revenue').textContent = '₱' + stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

  // Mock activities data
  const activities = [
    { icon: 'fa-box', text: 'Added new product: Orange Juice', time: '2 min ago' },
    { icon: 'fa-shopping-cart', text: 'Sale completed: ₱45.00', time: '10 min ago' },
    { icon: 'fa-exclamation-triangle', text: 'Low stock alert: Milk', time: '30 min ago' },
    { icon: 'fa-user-plus', text: 'New employee registered: John Doe', time: '1 hr ago' },
    { icon: 'fa-dollar-sign', text: 'Revenue updated: ₱12,500.75', time: 'Today' }
  ];
  const activitiesList = document.getElementById('activities-list');
  activitiesList.innerHTML = '';
  activities.forEach(act => {
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `<span class="activity-icon"><i class="fas ${act.icon}"></i></span><span class="activity-text">${act.text}</span><span class="activity-time">${act.time}</span>`;
    activitiesList.appendChild(div);
  });
});
