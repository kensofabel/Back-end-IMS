// Consolidated DOMContentLoaded event listener for all initialization
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize sidebar navigation
        const sidebarNav = document.querySelector('.sidebar');
        if (sidebarNav) {
            sidebarNav.addEventListener('click', function(e) {
                // Only act if clicking a major nav item (not a submenu item or submenu toggle)
                const navItem = e.target.closest('.nav-item');
                if (navItem && !navItem.classList.contains('has-submenu') && !e.target.classList.contains('submenu-item')) {
                    // Close all open submenus
                    document.querySelectorAll('.sidebar-submenu.open').forEach(s => {
                        s.classList.remove('open');
                    });
                    // Reset all carets and active states
                    document.querySelectorAll('.has-submenu.active').forEach(a => {
                        a.classList.remove('active');
                    });
                    document.querySelectorAll('.submenu-caret').forEach(caret => {
                        caret.classList.remove('fa-caret-down');
                        caret.classList.add('fa-caret-right');
                    });
                }
            });
        }

        // Initialize delayed dropdowns
        function setupDelayedDropdown(dropdownSelector, menuSelector) {
            document.querySelectorAll(dropdownSelector).forEach(function(dropdown) {
                let hideTimeout;
                const menu = dropdown.querySelector(menuSelector);
                if (!menu) return;
                dropdown.addEventListener('mouseenter', function() {
                    clearTimeout(hideTimeout);
                    menu.style.display = 'block';
                });
                dropdown.addEventListener('mouseleave', function() {
                    hideTimeout = setTimeout(function() {
                        menu.style.display = 'none';
                    }, 300);
                });
                menu.addEventListener('mouseenter', function() {
                    clearTimeout(hideTimeout);
                    menu.style.display = 'block';
                });
                menu.addEventListener('mouseleave', function() {
                    hideTimeout = setTimeout(function() {
                        menu.style.display = 'none';
                    }, 300);
                });
            });
        }
        setupDelayedDropdown('.notification-dropdown', '.notification-menu');
        setupDelayedDropdown('.profile-dropdown', '.profile-menu');

        // Initialize submenu carets
        document.querySelectorAll('.submenu-caret').forEach(function(caret) {
            caret.classList.add('fa-caret-right');
        });

        // Initialize role form event listener
        const roleForm = document.getElementById('role-form');
        if (roleForm) {
            roleForm.addEventListener('submit', handleRoleFormSubmit);
        }

        // Initialize permissions modal event listeners
        const permissionsModal = document.getElementById('permissions-modal');
        if (permissionsModal) {
            const closeBtn = permissionsModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', closePermissionsModal);
            }
        }

        // Initialize modal close event listeners
        window.addEventListener('click', function(event) {
            const rolesModal = document.getElementById('roles-modal');
            const roleFormModal = document.getElementById('role-form-modal');
            const permissionsModal = document.getElementById('permissions-modal');

            if (event.target === rolesModal) {
                closeRolesModal();
            }
            if (event.target === roleFormModal) {
                closeRoleFormModal();
            }
            if (event.target === permissionsModal) {
                closePermissionsModal();
            }
        });

        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        let toggleBtnTimeout;
        function openSidebar() {
            sidebar.classList.add('open');
            document.body.classList.add('sidebar-open');
            sidebarToggle.classList.add('hide-toggle-btn');
            if (toggleBtnTimeout) clearTimeout(toggleBtnTimeout);
            localStorage.setItem('sidebarState', 'open');
        }
        function closeSidebar() {
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-open');
            if (toggleBtnTimeout) clearTimeout(toggleBtnTimeout);
            toggleBtnTimeout = setTimeout(function() {
                sidebarToggle.classList.remove('hide-toggle-btn');
            }, 300); // 300ms delay
            localStorage.setItem('sidebarState', 'closed');
        }
        sidebarToggle.addEventListener('click', function() {
            if (window.innerWidth <= 1200) {
                if (!sidebar.classList.contains('open')) {
                    openSidebar();
                } else {
                    closeSidebar();
                }
            }
        });
        document.addEventListener('mousedown', function(e) {
            if (window.innerWidth <= 1200 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    closeSidebar();
                }
            }
        });
        // Restore sidebar state on load
        function restoreSidebarState() {
            const state = localStorage.getItem('sidebarState');
            if (state === 'open') {
                openSidebar();
            } else {
                closeSidebar();
            }
        }
        restoreSidebarState();
        // Restore sidebar state on resize
        window.addEventListener('resize', function() {
            restoreSidebarState();
        });
        // Close sidebar when clicking outside
        document.addEventListener('mousedown', function(e) {
            if (window.innerWidth <= 1200 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // Header search expand/collapse logic
        const headerSearch = document.querySelector('.header-search');
        const searchForm = headerSearch ? headerSearch.querySelector('form') : null;
        const searchInput = searchForm ? searchForm.querySelector('input[type="text"]') : null;
        const searchBtn = searchForm ? searchForm.querySelector('button') : null;

        if (searchBtn && headerSearch) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                headerSearch.classList.toggle('expanded');
                if (headerSearch.classList.contains('expanded')) {
                    searchInput && searchInput.focus();
                }
            });

            document.addEventListener('mousedown', function(e) {
                if (headerSearch.classList.contains('expanded')) {
                    if (!headerSearch.contains(e.target)) {
                        headerSearch.classList.remove('expanded');
                    }
                }
            });
        }
    });
    // Toggle sidebar submenu caret icon
    function toggleSidebarSubmenu(event, submenuId) {
        event.preventDefault();
        const submenu = document.getElementById(submenuId);
        const parent = event.currentTarget;
        const caret = parent.querySelector('.submenu-caret');
        if (submenu.classList.contains('open')) {
            submenu.classList.remove('open');
            parent.classList.remove('active');
            caret.classList.remove('fa-caret-down');
            caret.classList.add('fa-caret-right');
        } else {
            // Close other submenus
            document.querySelectorAll('.sidebar-submenu.open').forEach(s => {
                s.classList.remove('open');
            });
            document.querySelectorAll('.has-submenu.active').forEach(a => {
                a.classList.remove('active');
            });
            document.querySelectorAll('.submenu-caret').forEach(caret => {
                caret.classList.remove('fa-caret-down');
                caret.classList.add('fa-caret-right');
            });
            submenu.classList.add('open');
            parent.classList.add('active');
            caret.classList.remove('fa-caret-right');
            caret.classList.add('fa-caret-down');
        }
    }


// Toggle sidebar collapse/expand
document.getElementById('sidebarToggle').onclick = function() {
  document.getElementById('sidebar').classList.toggle('collapsed');
};

document.addEventListener('click', function(event) {
  const sidebar = document.getElementById('sidebar');x``
  const toggleBtn = document.getElementById('sidebarToggle');
  // Only run on mobile/tablet
  if (window.innerWidth <= 1200) {
    // If sidebar is open and click is outside sidebar and toggle button
    if (!sidebar.classList.contains('collapsed') &&
        !sidebar.contains(event.target) &&
        event.target !== toggleBtn) {
      sidebar.classList.add('collapsed');
    }
  }
});