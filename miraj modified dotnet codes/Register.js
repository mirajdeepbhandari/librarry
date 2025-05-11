document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  // Base API URL - change this to match your backend URL
  const API_BASE_URL = 'http://localhost:5085'; // Update this to match your ASP.NET Core app URL

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Reset messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const address = document.getElementById('address').value.trim();

    // Validate inputs
    if (
      !validateForm(
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        address
      )
    ) {
      return;
    }

    // Create registration data object
    const registrationData = {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      address
    };

    try {
      // Send registration request to API
      const response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.message || 'Registration failed. Please try again.');
        return;
      }

      // Show success message
      showSuccess('Registration successful! You can now log in.');

      // Clear form
      registerForm.reset();

      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      showError('An unexpected error occurred. Please try again later.');
    }
  });

  function validateForm(
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    phoneNumber,
    address
  ) {
    // Check for empty fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber ||
      !address
    ) {
      showError('All fields are required.');
      return false;
    }

    // Validate email format (must be Gmail)
    if (!email.endsWith('@gmail.com')) {
      showError('Email must be a Gmail address (e.g., user@gmail.com).');
      return false;
    }

    // Validate password length
    if (password.length < 8) {
      showError('Password must be at least 8 characters long.');
      return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return false;
    }

    // Validate phone number (must be exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      showError('Phone number must be exactly 10 digits.');
      return false;
    }

    return true;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    // Scroll to error message
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';

    // Scroll to success message
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
