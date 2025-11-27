<?php
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<!-- Header -->
        <header class="dashboard-header">
            <div class="header-left" style="display: flex; align-items: center;">
                <button class="sidebar-toggle-btn" id="sidebarToggle" aria-label="Toggle sidebar">&#9776;</button>
                <img class="dashboard-logo" src="../../assets/images/dboardlogo.webp" alt="Black Basket" style="height:40px; width:auto; object-fit:contain;">
            </div>
            <div class="header-search">
                <form id="dashboard-search-form" onsubmit="event.preventDefault(); /* Add search logic here */">
                    <input type="text" id="dashboard-search" placeholder="Search...">
                    <button type="submit"><i class="fas fa-search"></i></button>
                </form>
            </div>
            <div class="header-right">
                <div class="notification-dropdown">
                    <i class="fas fa-bell"></i>
                    <div class="notification-menu">
                        <div class="notification-item">No new notifications</div>
                    </div>
                </div>
                <div class="profile-dropdown">
                    <i class="fas fa-user-circle" id="profileIcon" style="cursor:pointer;"></i>
                </div>
            </div>
        </header>

<?php include __DIR__ . '/profile_popup.php'; ?>
<script>
// Profile popup open/close logic
document.addEventListener('DOMContentLoaded', function() {
    var profilePopup = document.getElementById('profilePopup');
    var closeBtn = document.getElementById('closeProfilePopup');
    var profileIcon = document.getElementById('profileIcon');
    if (profileIcon && profilePopup) {
        profileIcon.addEventListener('click', function() {
            profilePopup.style.display = 'flex';
        });
    }
    if (closeBtn && profilePopup) {
        closeBtn.addEventListener('click', function() {
            profilePopup.style.display = 'none';
        });
    }
    // Close popup when clicking outside
    window.addEventListener('mousedown', function(e) {
        if (profilePopup && profilePopup.style.display === 'flex' && !profilePopup.contains(e.target) && e.target !== profileIcon) {
            profilePopup.style.display = 'none';
        }
    });
});
</script>
<?php
// Include inventory Add Item modal on all pages except the inventory index itself
// so the modal can be opened in-place without navigating away.
$currentDir = basename(dirname($_SERVER['PHP_SELF']));
if ($currentDir !== 'inventory') {
    // Ensure the inventory stylesheet is available so the modal appears styled
    echo '<link rel="stylesheet" href="/black_basket/pages/inventory/inventory.css">';
    $modalPath = __DIR__ . '/../pages/inventory/popupmodal.php';
    if (file_exists($modalPath)) {
        // Buffer the modal HTML and append it to <body> at runtime so the modal
        // is not nested inside the header element (which can clip fixed positioning
        // when parent elements create stacking contexts or have overflow/transform).
        ob_start();
        include $modalPath;
        $modalHtml = ob_get_clean();
        // Emit a script that inserts the modal markup into document.body after DOM ready.
        echo '<script>(function(){ var html = ' . json_encode($modalHtml) . '; function insert(){ try{ var tmp = document.createElement("div"); tmp.innerHTML = html; while(tmp.firstChild) document.body.appendChild(tmp.firstChild); }catch(e){} } if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", insert); } else { insert(); } })();</script>';
    }
        // Patch fetch to rewrite relative inventory AJAX endpoints when the modal
        // is embedded on non-inventory pages. This avoids changing many files.
        echo '<script>(function(){ if (window.__inventoryFetchPatched) return; window.__inventoryFetchPatched = true; window.inventoryFetchBase = window.inventoryFetchBase || "/black_basket/pages/inventory"; const _origFetch = window.fetch.bind(window); window.fetch = function(input, init){ try{ if (typeof input === "string"){ if (!input.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/) && !input.startsWith("/") && !input.startsWith("//")){ input = window.inventoryFetchBase + "/" + input.replace(/^\.\/?/,""); } } else if (input && input.url && typeof input.url === "string"){ var url = input.url; if (!url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/) && !url.startsWith("/") && !url.startsWith("//")){ url = window.inventoryFetchBase + "/" + url.replace(/^\.\/?/,""); input = new Request(url, input); } } }catch(e){} return _origFetch(input, init); }; })();</script>';
}
?>