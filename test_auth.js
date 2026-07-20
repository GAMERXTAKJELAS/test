document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value;
    const errorEl = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');
    const submitBtn = document.getElementById('submitBtn');

    // Reset messages per click event
    errorEl.textContent = "";
    successEl.textContent = "";
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Connecting to Cloudflare D1... <i class='fas fa-spinner fa-spin'></i>";

    try {
        // Send payload directly to our serverless endpoint
        const response = await fetch('/test_verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Save authentication properties into sessionStorage/localStorage matching RBAC policies
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', data.role);

            successEl.innerHTML = `
                <strong>Cloudflare Auth Success!</strong><br>
                Verified Role: <span style="color:var(--accent)">${data.role.toUpperCase()}</span><br>
                <small style="color:var(--muted)">Redirecting to dashboard...</small>
            `;

            // Seamless transition to the analytics layout window
            setTimeout(() => {
                window.location.href = 'admin_dashboard.html';
            }, 1000);
            
        } else {
            // Output explicit system database rejection flags
            errorEl.textContent = data.message || "Invalid database credentials.";
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Run Auth Query</span> <i class="fas fa-terminal"></i>`;
        }
    } catch (err) {
        errorEl.textContent = "Network link error. Ensure assets are uploaded to Cloudflare Pages.";
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Run Auth Query</span> <i class="fas fa-terminal"></i>`;
    }
});