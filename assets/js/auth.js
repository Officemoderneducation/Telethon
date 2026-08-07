import { db } from "./firebase-config.js"; 
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const empCodeInput = document.getElementById("empCode");
        const passwordInput = document.getElementById("password");

        if (!empCodeInput || !passwordInput) {
            console.error("Input fields not found in HTML!");
            return;
        }

        const empCode = empCodeInput.value.trim();
        const password = passwordInput.value.trim();

        if (errorMsg) errorMsg.textContent = "Authenticating...";

        try {
            // Firestore Collection: 'employees', Document ID: Employee Code (e.g., 63148)
            const empDocRef = doc(db, "employees", empCode);
            const empDocSnap = await getDoc(empDocRef);

            if (empDocSnap.exists()) {
                const data = empDocSnap.data();

                // String comparison to prevent Number/String mismatch issue
                if (String(data.password).trim() === password) {
                    localStorage.setItem("loggedInEmpCode", empCode);
                    window.location.href = "daily-entry.html";
                } else {
                    if (errorMsg) errorMsg.textContent = "Galat Password!";
                }
            } else {
                if (errorMsg) errorMsg.textContent = "Employee Code nahi mila!";
            }
        } catch (error) {
            console.error("Login Error Details:", error);
            if (errorMsg) errorMsg.textContent = "Login Fail: " + error.message;
        }
    });
}
