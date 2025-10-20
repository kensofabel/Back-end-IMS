<?php
if (session_status() === PHP_SESSION_NONE) session_start();
$token = '';
$message = '';
?>
<div class="profile-popup" id="changePasswordPopup" style="display:none;z-index:3000;">
    <div class="profile-popup-content" style="min-width:350px;max-width:95vw;">
        <span class="profile-popup-close" id="closeChangePasswordPopup">&times;</span>
        <div class="login-header">
            <img class="logo" src="../../assets/images/indexlogo.webp" alt="Black Basket Logo">
        </div>
        <div id="changePasswordMessage"></div>
        <form id="changePasswordForm" class="login-form" method="POST" autocomplete="off" onsubmit="return validateChangePasswordInput();">
            <div class="form-group">
                <input type="password" name="old_password" id="oldPasswordInput" required autocomplete="current-password">
                <label for="oldPasswordInput">Old Password</label>
                <span class="password-toggle slashed" data-toggle-for="oldPasswordInput">👁️</span>
            </div>
            <div class="form-group">
                <input type="password" name="confirm_old_password" id="confirmOldPasswordInput" required autocomplete="current-password">
                <label for="confirmOldPasswordInput">Confirm Old Password</label>
                <span class="password-toggle slashed" data-toggle-for="confirmOldPasswordInput">👁️</span>
            </div>
            <div class="form-group">
                <input type="password" name="password" id="changePasswordInput" required autocomplete="new-password">
                <label for="changePasswordInput">New Password</label>
                <span class="password-toggle slashed" data-toggle-for="changePasswordInput">👁️</span>
            </div>
            <div id="changePasswordError" class="error-message" style="display:none;"></div>
            <button type="submit" class="login-btn">Change Password</button>
        </form>
        <div class="signup-section">
            <p>Return to <a href="#" class="signup-link" id="returnToProfileLink">Profile</a></p>
<script>
// Toggle password visibility for all password fields in this popup
document.addEventListener('DOMContentLoaded', function() {
    var popup = document.getElementById('changePasswordPopup');
    if (popup) {
        popup.querySelectorAll('.password-toggle').forEach(function(toggleIcon) {
            var inputId = toggleIcon.getAttribute('data-toggle-for');
            var input = document.getElementById(inputId);
            if (input) {
                toggleIcon.addEventListener('click', function() {
                    if (input.type === 'password') {
                        input.type = 'text';
                        toggleIcon.classList.remove('slashed');
                    } else {
                        input.type = 'password';
                        toggleIcon.classList.add('slashed');
                    }
                });
            }
        });
    }
});
// Remove old error message when popup opens or input is focused
document.addEventListener('DOMContentLoaded', function() {
    var openBtn = document.getElementById('openChangePasswordPopup');
    var popup = document.getElementById('changePasswordPopup');
    var errorDiv = document.getElementById('changePasswordError');
    var messageDiv = document.getElementById('changePasswordMessage');
    function clearMessagesOnly() {
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
        if (messageDiv) {
            messageDiv.textContent = '';
            messageDiv.style.display = 'none';
        }
        // Reset all password fields to type password and all toggles to slashed
        var popup = document.getElementById('changePasswordPopup');
        if (popup) {
            popup.querySelectorAll('input[type="text"][id$="PasswordInput"]').forEach(function(input) {
                input.type = 'password';
            });
            popup.querySelectorAll('.password-toggle').forEach(function(toggleIcon) {
                toggleIcon.classList.add('slashed');
            });
        }
    }
    if (openBtn && popup) {
        openBtn.addEventListener('click', clearMessagesOnly);
    }
    // Only clear error/success messages on input focus (not password visibility)
    var inputs = popup ? popup.querySelectorAll('input[type="password"]') : [];
    inputs.forEach(function(input) {
        input.addEventListener('focus', function() {
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.style.display = 'none';
            }
            if (messageDiv) {
                messageDiv.textContent = '';
                messageDiv.style.display = 'none';
            }
        });
    });
    // Clear on close
    var closeBtn = document.getElementById('closeChangePasswordPopup');
    if (closeBtn && popup) {
        closeBtn.addEventListener('click', clearMessagesOnly);
    }
});
// Return to Profile link logic
document.addEventListener('DOMContentLoaded', function() {
    var returnLink = document.getElementById('returnToProfileLink');
    var changePopup = document.getElementById('changePasswordPopup');
    var profilePopup = document.getElementById('profilePopup');
    if (returnLink && changePopup && profilePopup) {
        returnLink.addEventListener('click', function(e) {
            e.preventDefault();
            changePopup.style.display = 'none';
            profilePopup.style.display = 'flex';
        });
    }
});
</script>
        </div>
    </div>
</div>
<script>
function validateChangePasswordInput() {
    const oldPassword = document.getElementById('oldPasswordInput').value;
    const confirmOldPassword = document.getElementById('confirmOldPasswordInput').value;
    const password = document.getElementById('changePasswordInput').value;
    const errorDiv = document.getElementById('changePasswordError');
    let error = null;
    if (!oldPassword) error = 'Old password is required';
    else if (!confirmOldPassword) error = 'Please confirm your old password';
    else if (oldPassword !== confirmOldPassword) error = 'Old passwords do not match';
    else if (!password) error = 'New password is required';
    else if (password.length < 4) error = 'New password must be at least 4 characters long';
    else if (password === oldPassword) error = 'New password must be different from old password.';
    else {
        const weakPasswords = ['password', '123456', 'admin', '123456789'];
        if (weakPasswords.includes(password.toLowerCase())) {
            error = 'This password is too common. Please choose a stronger password.';
        }
    }
    if (error) {
        errorDiv.textContent = error;
        errorDiv.style.display = 'block';
        return false;
    } else {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        return true;
    }
}
// Popup open/close logic
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        var popup = document.getElementById('changePasswordPopup');
        var closeBtn = document.getElementById('closeChangePasswordPopup');
        var profilePopup = document.getElementById('profilePopup');
        if (closeBtn && popup) {
            closeBtn.addEventListener('click', function() {
                popup.style.display = 'none';
                // Do NOT open profile popup here
                if (profilePopup) profilePopup.style.display = 'none';
            });
        }
        window.addEventListener('mousedown', function(e) {
            if (popup && popup.style.display === 'flex' && !popup.contains(e.target)) {
                popup.style.display = 'none';
                // Do NOT open profile popup here
                if (profilePopup) profilePopup.style.display = 'none';
            }
        });
    });
}
</script>
<style>
#changePasswordPopup .profile-popup-content {
    min-width: 350px !important;
    max-width: 350px !important;
    min-height: auto !important;
    height: auto !important;
    padding: 48px 40px 36px 40px !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
}
#changePasswordPopup .login-header,
#changePasswordPopup .login-form,
#changePasswordPopup .signup-section {
    width: 100%;
}
#changePasswordPopup .login-form {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
}
</style>

<script>
    document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateChangePasswordInput()) return;
        const errorDiv = document.getElementById('changePasswordError');
        const messageDiv = document.getElementById('changePasswordMessage');
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        messageDiv.textContent = '';
        messageDiv.style.display = 'none';
        const formData = new FormData(form);
        formData.append('ajax', '1');
        try {
            const response = await fetch('/black_basket/partials/update_password.php', {
                method: 'POST',
                body: formData
            });
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (err) {
                // fallback: treat as plain text
                if (text.includes('success')) {
                    messageDiv.textContent = text;
                    messageDiv.style.display = 'block';
                } else {
                    errorDiv.textContent = text;
                    errorDiv.style.display = 'block';
                }
                return;
            }
            if (result.success) {
                messageDiv.textContent = result.message || 'Password changed successfully!';
                messageDiv.style.display = 'block';
                form.reset();
                    form.style.display = 'none'; // Hide the form after successful password change
            } else {
                errorDiv.textContent = result.message || 'Failed to change password.';
                errorDiv.style.display = 'block';
            }
        } catch (err) {
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
});
</script>
