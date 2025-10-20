// Toggle password visibility
    function togglePassword() {
    const passwordInput = document.getElementById('signupPassword');
    const toggleIcon = document.querySelector('.password-toggle');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('slashed');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.add('slashed');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;
    console.log(signupForm.outerHTML);
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Clear previous error messages
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }

        // Get form values
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const business = document.getElementById('signupBusiness').value.trim();

        // Client-side validation
        const validationError = validateSignupInput(username, email, password, business);
        if (validationError) {
            showSignupError(validationError);
            setSignupLoading(false);
            return;
        }

        // Prepare form data BEFORE disabling inputs!
        const formData = new FormData(signupForm);
        formData.append('ajax', '1');

        setSignupLoading(true);

        // Debug: Log all FormData values before sending
        for (let pair of formData.entries()) {
            console.log('FormData:', pair[0], '=', pair[1]);
        }

        try {
            const response = await fetch('signup.php', {
                method: 'POST',
                body: formData
            });
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch {
                showSignupError('Server error: ' + text);
                return;
            }
            if (result.success) {
                window.location.href = 'pages/dashboard/index.php';
            } else {
                showSignupError(result.reason || 'Registration failed.');
            }
        } catch (error) {
            showSignupError('Unable to connect to the server. Please try again.');
        } finally {
            setSignupLoading(false);
        }
    });

    function showSignupError(message) {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.classList.add('shake');
            setTimeout(() => {
                errorDiv.classList.remove('shake');
            }, 500);
        }
    }

    function setSignupLoading(isLoading) {
        const signupBtn = document.getElementById('signupBtn');
        const usernameInput = document.getElementById('signupUsername');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const businessInput = document.getElementById('signupBusiness');

        if (isLoading) {
            if (signupBtn) {
                signupBtn.disabled = true;
                signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
            if (usernameInput) usernameInput.disabled = true;
            if (emailInput) emailInput.disabled = true;
            if (passwordInput) passwordInput.disabled = true;
            if (businessInput) businessInput.disabled = true;
        } else {
            if (signupBtn) {
                signupBtn.disabled = false;
                signupBtn.innerHTML = 'Sign up';
            }
            if (usernameInput) usernameInput.disabled = false;
            if (emailInput) emailInput.disabled = false;
            if (passwordInput) passwordInput.disabled = false;
            if (businessInput) businessInput.disabled = false;
        }
    }

    function validateSignupInput(username, email, password, business) {
        if (!username) return 'Username is required';
        if (username.length < 3) return 'Username must be at least 3 characters long';
        if (!email) return 'Email is required';
        if (!password) return 'Password is required';
        if (password.length < 4) return 'Password must be at least 4 characters long';
        const weakPasswords = ['password', '123456', 'admin', '123456789'];
        if (weakPasswords.includes(password.toLowerCase())) {
            return 'This password is too common. Please choose a stronger password.';
        }
        if (!business) return 'Business name is required';
        return null;
    }

});