// dashboard.js - Populates dashboard stats and activities with mock data

document.addEventListener('DOMContentLoaded', function() {
  // Fetch and display business name in dashboard section header
  // Fetch and display business name in dashboard section header
  fetch('../settings/get_business_name.php', { credentials: 'same-origin' })
    .then(res => res.ok ? res.json() : null)
    .then(json => {
      if (json && json.success && json.businessName) {
        const welcome = document.getElementById('dashboard-welcome');
        const nameSpan = welcome.querySelector('.business-name');
        if (nameSpan) {
          nameSpan.textContent = ', ' + json.businessName;
        }
      }
    });
});
