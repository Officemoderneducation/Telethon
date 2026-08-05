// assets/js/auth.js

import {
  auth
} from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// ======================
// LOGIN
// ======================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        const password = document.getElementById("password").value;

        const errorBox = document.getElementById("errorMessage");

        errorBox.style.display = "none";

        try {

            await signInWithEmailAndPassword(auth, email, password);

            window.location.href = "dashboard.html";

        } catch (error) {

            errorBox.style.display = "block";
            errorBox.innerText = error.message;

        }

    });

}

// ======================
// SESSION CHECK
// ======================

onAuthStateChanged(auth, (user) => {

    if (!user && window.location.pathname.includes("dashboard.html")) {

        window.location.href = "index.html";

    }

});

// ======================
// LOGOUT
// ======================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "index.html";

    });

}

// ======================
// PASSWORD SHOW / HIDE
// ======================

const togglePassword = document.getElementById("togglePassword");

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const password = document.getElementById("password");

        if (password.type === "password") {

            password.type = "text";

            togglePassword.classList.remove("fa-eye");

            togglePassword.classList.add("fa-eye-slash");

        } else {

            password.type = "password";

            togglePassword.classList.remove("fa-eye-slash");

            togglePassword.classList.add("fa-eye");

        }

    });

}
