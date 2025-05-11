// index.js - Enhanced with animations, error handling, token storage, and role-based redirections

import { storeToken, hasToken, storeUserRole } from './sessionStorage.js';
import { getToken } from './sessionStorage.js';

function getRoleFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  } catch {
    return null;
  }
}


document.addEventListener('DOMContentLoaded', function () {
  // Check if user is already logged in
  if (hasToken()) {
    // Get user role from session storage and redirect accordingly
   const userRole = getRoleFromToken();
redirectBasedOnRole(userRole);

    
    return;
  }

  // DOM Elements
  const loginPage = document.getElementById('loginPage');
  const registerPage = document.getElementById('registerPage');
  const toRegister = document.getElementById('toRegister');
  const toLogin = document.getElementById('toLogin');
  const messageBox = document.getElementById('messageBox') || createMessageBox();
  const currentProjectId = new URLSearchParams(window.location.search).get("projectId");

  // Function to redirect user based on their role
  function redirectBasedOnRole(role) {
    switch(role?.toLowerCase()) {
     case 'admin':
  window.location.href = "Html/AdminDashboard.html";
  break;
case 'staff':
  window.location.href = "Html/StaffDashboard.html";
  break;
case 'member':
  window.location.href = "Html/UserDashboard.html";
  break;
default:
  window.location.href = "index.html";

    }
  }

  // Update navigation links with project ID if present
  document.querySelectorAll(".nav-link").forEach(link => {
    if (currentProjectId && !link.href.includes("projectId")) {
      const href = new URL(link.href);
      href.searchParams.set("projectId", currentProjectId);
      link.href = href.toString();
    }
  });

  // Create message box if it doesn't exist
  function createMessageBox() {
    const box = document.createElement('div');
    box.id = 'messageBox';
    box.style.display = 'none';
    box.style.position = 'fixed';
    box.style.top = '20px';
    box.style.left = '50%';
    box.style.transform = 'translateX(-50%)';
    box.style.zIndex = '1000';
    box.style.padding = '15px 25px';
    box.style.borderRadius = '5px';
    box.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    document.body.appendChild(box);
    return box;
  }

  // Switch between login and register UI
  // Check if we're using the old UI or new UI
  if (toRegister && toLogin) {
    // New UI with page transitions
    toRegister.addEventListener('click', function (e) {
      e.preventDefault();
      loginPage.classList.remove('active');
      setTimeout(() => registerPage.classList.add('active'), 50);
    });

    toLogin.addEventListener('click', function (e) {
      e.preventDefault();
      registerPage.classList.remove('active');
      setTimeout(() => loginPage.classList.add('active'), 50);
    });
  } else {
    // Old UI with tabs
    const tabs = document.querySelectorAll('.tab-btn');
    const formContents = document.querySelectorAll('.form-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all form contents
        formContents.forEach(content => content.classList.add('hidden'));
        
        // Show the selected form content
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.remove('hidden');
      });
    });
  }

  // Password toggle functionality
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const passwordField = document.getElementById(this.getAttribute('data-for'));
      const icon = this.querySelector('i');
      
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordField.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });

  // Add animation styles to document
  addAnimationStyles();

  // Show temporary message with animation
  function showMessage(message, type) {
    if (!messageBox) return;
    
    messageBox.innerHTML = `<div class="${type}">${message}</div>`;
    messageBox.style.display = 'block';
    
    // Apply animations
    if (type === 'error') {
      shakeElement(messageBox);
    } else {
      pulseElement(messageBox);
    }
    
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 5000);
  }

  // Email validation
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Password strength checker
  function checkPasswordStrength(password) {
    const bar = document.getElementById('passwordStrength');
    const text = document.getElementById('strengthText');
    
    if (!bar || !text) return false;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[@$!%*?&]/.test(password)) strength += 12.5;

    bar.style.width = `${strength}%`;

    if (strength < 50) {
      bar.style.background = '#e74c3c';
      text.textContent = 'Weak';
      text.style.color = '#e74c3c';
      return false;
    } else if (strength < 75) {
      bar.style.background = '#f39c12';
      text.textContent = 'Moderate';
      text.style.color = '#f39c12';
      return false;
    } else {
      bar.style.background = '#27ae60';
      text.textContent = 'Strong';
      text.style.color = '#27ae60';
      return true;
    }
  }

  // Reset error states
  function resetErrors(formId) {
    document.querySelectorAll(`#${formId} .input-error`).forEach(e => {
      e.style.display = 'none';
      e.textContent = '';
    });
    document.querySelectorAll(`#${formId} input`).forEach(i => i.classList.remove('error'));
  }

  // Show error with animation
  function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    
    if (!input || !error) {
      showMessage(message, 'error');
      return;
    }
    
    input.classList.add('error');
    error.textContent = message;
    error.style.display = 'block';
    
    // Apply shake animation
    shakeElement(input);
  }

  // Add event listener for password strength
  const passwordField = document.getElementById('password');
  if (passwordField) {
    passwordField.addEventListener('input', function() {
      checkPasswordStrength(this.value);
    });
  }

  // LOGIN FUNCTIONALITY
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    resetErrors('loginForm');

    const loginErrorMessage = document.getElementById('loginErrorMessage');
    const loginSuccessMessage = document.getElementById('loginSuccessMessage');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate inputs
    if (!email) {
      showError('loginEmail', 'loginEmailError', 'Email is required');
      return;
    }
    if (!validateEmail(email)) {
      showError('loginEmail', 'loginEmailError', 'Invalid email format');
      return;
    }
    if (!password) {
      showError('loginPassword', 'loginPasswordError', 'Password is required');
      return;
    }

    try {
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      submitBtn.disabled = true;

      let res;
      try {
        res = await fetch('https://localhost:5085/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      } catch {
        res = await fetch('http://localhost:5085/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      }

      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;

      if (res.status === 401) {
        if (loginErrorMessage) {
          loginErrorMessage.textContent = 'Invalid credentials. Please try again.';
          loginErrorMessage.style.display = 'block';
          shakeElement(loginForm);
        } else {
          showMessage('Invalid credentials. Please try again.', 'error');
        }
        return;
      }

      const contentType = res.headers.get('content-type');
      let data = contentType?.includes('application/json') ? await res.json() : {};

      if (res.ok && data.success && data.token) {
        // ✅ Store token
        storeToken(data.token);

        // ✅ Decode token to extract role
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        const role = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        storeUserRole(role);

        // ✅ Feedback to user
        if (loginSuccessMessage) {
          loginSuccessMessage.textContent = data.message || 'Login successful! Redirecting...';
          loginSuccessMessage.style.display = 'block';
          pulseElement(loginSuccessMessage);
        } else {
          showMessage(data.message || 'Login successful! Redirecting...', 'success');
        }

        // ✅ Redirect based on role
        setTimeout(() => {
          redirectBasedOnRole(role);
        }, 1500);
      } else {
        const errorMsg = data.message || 'Login failed. Please try again.';
        if (data.message?.includes('Invalid Email')) {
          showError('loginEmail', 'loginEmailError', 'Email not found');
        } else if (data.message?.includes('Invalid Password')) {
          showError('loginPassword', 'loginPasswordError', 'Incorrect password');
        } else if (loginErrorMessage) {
          loginErrorMessage.textContent = errorMsg;
          loginErrorMessage.style.display = 'block';
          shakeElement(loginForm);
        } else {
          showMessage(errorMsg, 'error');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (loginErrorMessage) {
        loginErrorMessage.textContent = 'Connection error. Please check your network and try again.';
        loginErrorMessage.style.display = 'block';
      } else {
        showMessage('Connection error. Please check your network and try again.', 'error');
      }
      shakeElement(loginForm);
    }
  });
}


  // REGISTRATION FUNCTIONALITY
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      resetErrors('registerForm');

      const registerErrorMessage = document.getElementById('registerErrorMessage');
      const registerSuccessMessage = document.getElementById('registerSuccessMessage');
      
      // Get form values - support both new and old UI layouts
      const username = document.getElementById('fullName')?.value.trim();
      const firstName = document.getElementById('firstName')?.value.trim();
      const lastName = document.getElementById('lastName')?.value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
      const address = document.getElementById('address')?.value.trim();

      // Initialize validation flag
      let isValid = true;

      // Validate inputs based on UI version
      if (username !== undefined) {
        // New UI
        if (!username || username.length < 3) {
          isValid = false;
          showError('fullName', 'fullNameError', 'Full name is required and must be at least 3 characters');
        }
      } else {
        // Old UI
        if (!firstName) {
          isValid = false;
          showError('firstName', 'firstNameError', 'First name is required');
        }
        if (!lastName) {
          isValid = false;
          showError('lastName', 'lastNameError', 'Last name is required');
        }
      }

      if (!email || !validateEmail(email)) {
        isValid = false;
        showError('email', 'emailError', 'Valid email is required');
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
      if (!password || !passwordRegex.test(password)) {
        isValid = false;
        showError('password', 'passwordError', 'Password must be strong (8+ characters, upper/lowercase, number, symbol)');
      }

      if (!confirmPassword || confirmPassword !== password) {
        isValid = false;
        showError('confirmPassword', 'confirmPasswordError', 'Passwords do not match');
      }

      if (phoneNumber !== undefined && (!phoneNumber || !/^\d{10}$/.test(phoneNumber))) {
        isValid = false;
        showError('phoneNumber', 'phoneNumberError', 'Phone number must be exactly 10 digits');
      }

      if (address !== undefined && !address) {
        isValid = false;
        showError('address', 'addressError', 'Address is required');
      }

      if (!isValid) return;

      try {
        // Add loading state to button
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        submitBtn.disabled = true;

        // SSL error handling - try HTTP if HTTPS fails
        let res;
        let registrationData;
        
        if (username !== undefined) {
          // New UI
          registrationData = { username, email, password };
        } else {
          // Old UI
          registrationData = {
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            address
          };
        }
        
        try {
          res = await fetch('https://localhost:5085/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
          });
        } catch (sslError) {
          console.warn('SSL connection failed, trying HTTP');
          res = await fetch('http://localhost:5085/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
          });
        }

        // Remove loading state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;

        let data;
        try {
          data = await res.json();
        } catch (e) {
          data = { message: "Could not parse server response" };
        }

        if (!res.ok) {
          if (registerErrorMessage) {
            registerErrorMessage.textContent = data.message || 'Registration failed. Please try again.';
            registerErrorMessage.style.display = 'block';
          } else {
            showMessage(data.message || 'Registration failed. Please try again.', 'error');
          }
          shakeElement(registerForm);
          return;
        }

        // Show success message
        if (registerSuccessMessage) {
          registerSuccessMessage.textContent = 'Registration successful! You can now log in.';
          registerSuccessMessage.style.display = 'block';
          pulseElement(registerSuccessMessage);
        } else {
          showMessage('Registration successful! You can now log in.', 'success');
        }

        // Clear form
        registerForm.reset();
        
        // Reset password strength if element exists
        if (document.getElementById('passwordStrength')) {
          document.getElementById('passwordStrength').style.width = '0%';
        }
        if (document.getElementById('strengthText')) {
          document.getElementById('strengthText').textContent = '';
        }

        // Switch to login tab/page after a short delay
        setTimeout(() => {
          if (toLogin) {
            // New UI
            registerPage.classList.remove('active');
            setTimeout(() => loginPage.classList.add('active'), 50);
          } else {
            // Old UI
            document.querySelector('.tab-btn[data-tab="login"]')?.click();
          }
        }, 2000);
      } catch (err) {
        console.error('Registration error:', err);
        if (registerErrorMessage) {
          registerErrorMessage.textContent = 'Connection error. Please check your network and try again.';
          registerErrorMessage.style.display = 'block';
        } else {
          showMessage('Connection error. Please check your network and try again.', 'error');
        }
        shakeElement(registerForm);
      }
    });
  }

  // Real-time email & confirm password validation
  document.querySelectorAll('input[type="email"]').forEach(field => {
    field.addEventListener('blur', function() {
      if (this.value && !validateEmail(this.value)) {
        const errorId = this.id === 'loginEmail' ? 'loginEmailError' : 'emailError';
        showError(this.id, errorId, 'Please enter a valid email');
      }
    });
  });

  const confirmPasswordField = document.getElementById('confirmPassword');
  if (confirmPasswordField) {
    confirmPasswordField.addEventListener('input', function() {
      const pass = document.getElementById('password').value;
      const errorElement = document.getElementById('confirmPasswordError');
      
      if (this.value && this.value !== pass) {
        this.classList.add('error');
        if (errorElement) {
          errorElement.textContent = 'Passwords do not match';
          errorElement.style.display = 'block';
        }
      } else {
        this.classList.remove('error');
        if (errorElement) {
          errorElement.style.display = 'none';
        }
      }
    });
  }

  // Form floating animation
  const formWrapper = document.querySelector('.form-wrapper');
  if (formWrapper) {
    setupFormFloatingAnimation(formWrapper);
  }
});

// Animation functions
function shakeElement(element) {
  element.classList.add('shake-animation');
  setTimeout(() => {
    element.classList.remove('shake-animation');
  }, 500);
}

function pulseElement(element) {
  element.classList.add('pulse-animation');
  setTimeout(() => {
    element.classList.remove('pulse-animation');
  }, 1000);
}

function setupFormFloatingAnimation(formWrapper) {
  let floatY = 0;
  let direction = 1;
  
  function floatAnimation() {
    floatY += 0.03 * direction;
    
    if (floatY > 5) direction = -1;
    if (floatY < 0) direction = 1;
    
    formWrapper.style.transform = `translateY(${floatY}px)`;
    requestAnimationFrame(floatAnimation);
  }
  
  // Start floating animation with a subtle effect
  floatAnimation();
}

function addAnimationStyles() {
  // Check if styles already exist
  if (document.getElementById('animation-styles')) return;
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'animation-styles';
  styleSheet.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
    
    .shake-animation {
      animation: shake 0.5s ease-in-out;
    }
    
    .pulse-animation {
      animation: pulse 0.5s ease-in-out 2;
    }
    
    .shake {
      animation: shake 0.5s ease-in-out;
    }

    /* Message box styles */
    #messageBox {
      transition: all 0.3s ease;
    }
    
    #messageBox .error {
      background-color: #ffebee;
      color: #d32f2f;
      border-left: 4px solid #d32f2f;
      padding: 10px 15px;
    }
    
    #messageBox .success {
      background-color: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #2e7d32;
      padding: 10px 15px;
    }
  `;
  document.head.appendChild(styleSheet);
}