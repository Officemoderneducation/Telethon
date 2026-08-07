// ======================================
// Auth JS - Admin & User Login Handler
// ======================================
import { db } from "./firebase-config.js"; 
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const empCodeEl = document.getElementById("empCode");
        const passwordEl = document.getElementById("password");

        if (!empCodeEl || !passwordEl) {
            if (errorMsg) errorMsg.textContent = "HTML input fields missing!";
            return;
        }

        const empCode = empCodeEl.value.trim();
        const password = passwordEl.value.trim();

        if (errorMsg) errorMsg.textContent = "Verifying Credentials...";

        try {
            // 1. Default Admin Login Check (Employee Code = admin, Password = admin123)
            if (empCode === "admin" && password === "admin123") {
                localStorage.setItem("loggedInEmpCode", "admin");
                localStorage.setItem("userRole", "admin");
                window.location.href = "dashboard.html";
                return;
            }

            // 2. Firestore Lookup in 'employees' Collection
            const empDocRef = doc(db, "employees", empCode);
            const empDocSnap = await getDoc(empDocRef);

            if (empDocSnap.exists()) {
                const data = empDocSnap.data();

                // String comparison to handle both string and number passwords
                if (String(data.password).trim() === password) {
                    localStorage.setItem("loggedInEmpCode", empCode);

                    // Check Approval Status and Role
                    if (data.role === "admin") {
                        localStorage.setItem("userRole", "admin");
                        window.location.href = "dashboard.html";
                    } else if (data.status === "Pending") {
                        if (errorMsg) errorMsg.textContent = "Aapka account Admin Approval ke liye pending hai!";
                    } else {
                        localStorage.setItem("userRole", "teacher");
                        window.location.href = "daily-entry.html";
                    }
                } else {
                    if (errorMsg) errorMsg.textContent = "Galat Password!";
                }
            } else {
                if (errorMsg) errorMsg.textContent = "User/Admin Code nahi mila!";
            }
        } catch (error) {
            console.error("Login Error:", error);
            if (errorMsg) errorMsg.textContent = "Login Fail: " + error.message;
        }
    });
}
