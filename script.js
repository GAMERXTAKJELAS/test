// Set your Cloudflare Worker URL here
const WORKER_URL = "https://cloudtester.syamsulock0457.workers.dev";

document.addEventListener("DOMContentLoaded", () => {
    checkDatabaseConnection();
    
    const form = document.getElementById("loginForm");
    form.addEventListener("submit", handleLogin);
});

// 1. Check Database Connectivity
async function checkDatabaseConnection() {
    const statusText = document.getElementById("statusText");
    const statusDot = document.getElementById("statusDot");

    try {
        const response = await fetch(`${WORKER_URL}/api/health`);
        const data = await response.json();

        if (response.ok && data.connected) {
            statusText.className = "flex items-center gap-2 font-semibold text-emerald-400";
            statusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400";
            statusText.querySelector("span:last-child").textContent = "Connected";
        } else {
            setDisconnectedState("Not Connected");
        }
    } catch (error) {
        setDisconnectedState("Connection Failed");
    }
}

function setDisconnectedState(message) {
    const statusText = document.getElementById("statusText");
    const statusDot = document.getElementById("statusDot");
    
    statusText.className = "flex items-center gap-2 font-semibold text-red-400";
    statusDot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
    statusText.querySelector("span:last-child").textContent = message;
}

// 2. Handle Login Submit
async function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("username").value.trim();
    const passwordInput = document.getElementById("password").value.trim();
    const submitBtn = document.getElementById("submitBtn");
    const resultBanner = document.getElementById("resultBanner");

    submitBtn.disabled = true;
    submitBtn.textContent = "Authenticating...";
    resultBanner.classList.add("hidden");

    try {
        const response = await fetch(`${WORKER_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        resultBanner.classList.remove("hidden");
        if (response.ok && data.success) {
            resultBanner.className = "p-3 rounded-lg text-xs font-medium text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            resultBanner.textContent = `Welcome, ${data.user.full_name || data.user.username}!`;
        } else {
            resultBanner.className = "p-3 rounded-lg text-xs font-medium text-center bg-red-500/10 text-red-400 border border-red-500/20";
            resultBanner.textContent = data.message || "Invalid username or password.";
        }
    } catch (error) {
        resultBanner.classList.remove("hidden");
        resultBanner.className = "p-3 rounded-lg text-xs font-medium text-center bg-red-500/10 text-red-400 border border-red-500/20";
        resultBanner.textContent = "Unable to connect to login server.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Log In";
    }
}