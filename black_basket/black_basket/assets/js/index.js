// assets/js/index.js

    document.addEventListener('DOMContentLoaded', function() {
        // Password toggle function for login page
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.querySelector('.password-toggle');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('slashed');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.add('slashed');
            }
        }
        window.togglePassword = togglePassword;

        // 2. handleLogin
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            // Clear previous error messages
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Client-side validation
            const validationError = validateLoginInput(username, password);
            if (validationError) {
                showLoginError(validationError);
                setLoginLoading(false);
                return;
            }

            const formData = new FormData(this);
            formData.append('ajax', '1');

            // DEBUG: Log all FormData values before sending
            for (let pair of formData.entries()) {
                console.log('FormData:', pair[0], '=', pair[1]);
            }

            setLoginLoading(true);

            try {
                const response = await fetch('index.php', {
                    method: 'POST',
                    body: formData
                });
                const text = await response.text();
                console.log('Raw response:', text);
                let result;
                try {
                    result = JSON.parse(text);
                } catch (jsonError) {
                    console.error('JSON parse error:', jsonError);
                    handleAuthError({ message: 'Invalid JSON: ' + text });
                    return;
                }
                if (result.success) {
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('lastLoginTime', new Date().toISOString());
                    window.location.href = 'pages/dashboard/index.php';
                } else {
                    handleAuthFailure(result.reason);
                }
            } catch (error) {
                handleAuthError(error);
            } finally {
                setLoginLoading(false);
            }
        });

        // 4. handleAuthFailure
        function handleAuthFailure(reason) {
            let errorMessage = 'Login failed';
            let toastType = 'error';

            switch (reason) {
                case 'Invalid credentials':
                    errorMessage = 'Invalid username or password. Please check your credentials.';
                    break;
                case 'Employee account is inactive':
                    errorMessage = 'Your account is currently inactive. Please contact admin or owner.';
                    break;
                case 'Employee record not found':
                    errorMessage = 'Account not found. Please verify your username or email.';
                    break;
                default:
                    errorMessage = reason || 'Authentication failed. Please try again.';
            }

            showLoginError(errorMessage);
        }

        // 5. handleAuthError
        function handleAuthError(error) {
            let errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';

            if (error.name === 'NetworkError') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.name === 'TimeoutError') {
                errorMessage = 'Connection timeout. Please try again.';
            } else if (error.message && error.message.includes('fetch')) {
                errorMessage = 'Server is currently unavailable. Please try again later.';
            }

            showLoginError(errorMessage);
        }

        // 6. showLoginError
        function showLoginError(message) {
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.classList.add('shake');
            setTimeout(() => {
                errorDiv.classList.remove('shake');
            }, 500);
        }

        // 7. setLoginLoading
        function setLoginLoading(isLoading) {
            const loginBtn = document.getElementById('loginBtn');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            if (isLoading) {
                if (loginBtn) {
                    loginBtn.disabled = true;
                    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                }
                if (usernameInput) usernameInput.disabled = true;
                if (passwordInput) passwordInput.disabled = true;
            } else {
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = 'Log in';
                }
                if (usernameInput) usernameInput.disabled = false;
                if (passwordInput) passwordInput.disabled = false;
            }
        }

        // 8. validateLoginInput
        function validateLoginInput(username, password) {
            if (!username) {
                return 'Username is required';
            }
            if (!password) {
                return 'Password is required';
            }
            return null;
        }

    // ...existing code...
    });