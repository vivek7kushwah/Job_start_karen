document.getElementById('login-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const userType = document.getElementById('user-type').value;
  const mobile = document.getElementById('mobile').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userType, mobile, password }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('user-info').style.display = 'block';
      const userNameElement = document.getElementById('user-name');
      if (userNameElement && data.name) {
        userNameElement.textContent = `Welcome, ${data.name}!`;
      }
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred during login.');
  }
});

document.getElementById('logout-button').addEventListener('click', async function() {
  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('user-info').style.display = 'none';
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred during logout.');
  }
});

document.getElementById('toggle-login').addEventListener('click', function() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('signup-form').style.display = 'none';
});

document.getElementById('toggle-signup').addEventListener('click', function() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
});

document.getElementById('signup-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const userType = document.getElementById('signup-user-type').value;
  const mobile = document.getElementById('signup-mobile').value;
  const password = document.getElementById('signup-password').value;

  try {
    const response = await fetch('/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userType, mobile, password }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      document.getElementById('signup-form').style.display = 'none';
      document.getElementById('login-form').style.display = 'block';
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred during sign-up.');
  }
}); 