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
                    <i class="fas fa-user-circle"></i>
                    <div class="profile-menu">
                        <div class="profile-item" onclick="profile()"><i class="fas fa-user"></i> Profile</div>
                        <div class="profile-item" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</div>
                    </div>
                </div>
            </div>
        </header>