// ======================================
// Login JS - Match Document ID (63148)
// ======================================
import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const empCode = document.getElementById("empCode").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            // Document ID = Employee Code (e.g. 63148)
            const empDocRef = doc(db, "employees", empCode);
            const empDocSnap = await getDoc(empDocRef);

            if (empDocSnap.exists()) {
                const data = empDocSnap.data();

                // Check Password
                if (data.password === password) {
                    // Store Logged In Employee Code locally
                    localStorage.setItem("loggedInEmpCode", empCode);

                    // Redirect to Daily Entry Page
                    window.location.href = "daily-entry.html";
                } else {
                    if (errorMsg) errorMsg.textContent = "Galat Password!";
                }
            } else {
                if (errorMsg) errorMsg.textContent = "Employee Code nahi mila!";
            }
        } catch (error) {
            console.error("Login Error:", error);
            if (errorMsg) errorMsg.textContent = "Login me error aaya. Dubara koshish karein.";
        }
    });
}
