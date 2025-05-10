document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  // Base API URL
  const API_BASE_URL = 'http://localhost:5085';

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Reset messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!email || !password) {
      showError('Email and password are required.');
      return;
    }

    try {
      // Send login request to API
      const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      // For 401 (Unauthorized) responses, show a standard message without trying to parse the body
      if (response.status === 401) {
        showError('Invalid credentials. Please try again.');
        return;
      }

      // For successful responses
      if (response.ok) {
        // Try to parse response as JSON
        const data = await response.json();

        // Show success message
        showSuccess(data.message || 'Login successful! Redirecting...');

        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('bookHavenToken', data.token);
        }

        // Extract role from the success message if not explicitly provided
        let role = data.role;
        if (!role && data.message) {
          const roleMatch = data.message.match(/Role: (\w+)/);
          if (roleMatch && roleMatch[1]) {
            role = roleMatch[1].toLowerCase();
          }
        }

        // Redirect based on role
        setTimeout(() => {
          if (role === 'admin') {
            window.location.href = 'AdminUser.html';
          } else if (role === 'staff') {
            window.location.href = 'staff-dashboard.html';
          } else {
            window.location.href = 'Home.html';
          }
        }, 1000);
      } else {
        // Handle other error responses
        try {
          const errorData = await response.json();
          showError(
            errorData.message || `Login failed with status: ${response.status}`
          );
        } catch (jsonError) {
          // If JSON parsing fails, try to get text
          const errorText = await response.text();
          showError(
            errorText || `Login failed with status: ${response.status}`
          );
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Network error or server unreachable. Please try again later.');
    }
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
  }
});
