// ======================================
// Dashboard JS - Live Data & Sidebar
// ======================================
import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const totalAmountEl = document.getElementById("totalAmount");
const todayAmountEl = document.getElementById("todayAmount");
const totalEntriesCountEl = document.getElementById("totalEntriesCount");
const entriesTableBody = document.getElementById("entriesTableBody");

async function loadDashboardData() {
    try {
        const entriesQuery = query(collection(db, "daily_entry"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(entriesQuery);

        let totalCollection = 0;
        let todayCollection = 0;
        let totalCount = 0;

        const todayStr = new Date().toISOString().split('T')[0];
        let tableRowsHTML = "";

        if (querySnapshot.empty) {
            entriesTableBody.innerHTML = `<tr><td colspan="7" class="no-data">Koi collection entry nahi mili.</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const amount = Number(data.amount) || 0;
            totalCollection += amount;
            totalCount++;

            if (data.date === todayStr) {
                todayCollection += amount;
            }

            tableRowsHTML += `
                <tr>
                    <td>${data.date || "-"}</td>
                    <td><b>${data.empCode || "-"}</b></td>
                    <td>${data.teacherName || "-"}</td>
                    <td>${data.jamiatulMadina || "-"}</td>
                    <td>${data.city || "-"}, ${data.state || "-"}</td>
                    <td>${data.region || "-"}</td>
                    <td style="color: #10b981; font-weight: bold;">₹ ${amount.toLocaleString("en-IN")}</td>
                </tr>
            `;
        });

        if (totalAmountEl) totalAmountEl.textContent = `₹ ${totalCollection.toLocaleString("en-IN")}`;
        if (todayAmountEl) todayAmountEl.textContent = `₹ ${todayCollection.toLocaleString("en-IN")}`;
        if (totalEntriesCountEl) totalEntriesCountEl.textContent = totalCount;
        if (entriesTableBody) entriesTableBody.innerHTML = tableRowsHTML;

    } catch (error) {
        console.error("Dashboard Load Error:", error);
        if (entriesTableBody) {
            entriesTableBody.innerHTML = `<tr><td colspan="7" class="no-data" style="color:red;">Data load karne me error aaya.</td></tr>`;
        }
    }
}

// Admin Logout Handler
const logoutBtn = document.getElementById("adminLogoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("loggedInEmpCode");
        window.location.href = "index.html";
    });
}

loadDashboardData();
