document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
   
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('LoginUsername').value;
    const password = document.getElementById('LoginPassword').value;
    try {
        const response = await fetch('/log-in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        if (response.ok) {
            window.location.href = '/homepage';
        } else {
            const data = await response.json();
            alert(data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}
document.getElementById("signupForm").addEventListener("submit", async function (e){
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    console.log('Sending data:', { username, password: password ? '[REDACTED]' : undefined });
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    if (username.includes(' ') || password.includes(' ')) {
        alert('Username and password cannot contain spaces');
        return;
    }
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    try {
        const response = await fetch('/create-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        console.log('Server response:', data);
        if (response.ok) {
            alert('Account created successfully. Please log in.');
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Signup failed. Please try again.');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        alert('An error occurred. Please try again.');
    }
});