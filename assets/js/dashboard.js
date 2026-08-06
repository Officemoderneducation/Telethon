// ======================================
// Dashboard JS - Fetch & Show Live Data
// ======================================
import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// DOM Elements
const totalAmountEl = document.getElementById("totalAmount");
const todayAmountEl = document.getElementById("todayAmount");
const totalEntriesCountEl = document.getElementById("totalEntriesCount");
const entriesTableBody = document.getElementById("entriesTableBody");

// Fetch and Render Dashboard Data
async function loadDashboardData() {
    try {
        // Query to get all entries ordered by creation time (newest first)
        const entriesQuery = query(collection(db, "daily_entry"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(entriesQuery);

        let totalCollection = 0;
        let todayCollection = 0;
        let totalCount = 0;

        // Today's Date String (YYYY-MM-DD)
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

            // Check if entry date is Today
            if (data.date === todayStr) {
                todayCollection += amount;
            }

            // Create Row
            tableRowsHTML += `
                <tr>
                    <td>${data.date || "-"}</td>
                    <td><b>${data.empCode || "-"}</b></td>
                    <td>${data.teacherName || "-"}</td>
                    <td>${data.jamiatulMadina || "-"}</td>
                    <td>${data.city || "-"}, ${data.state || "-"}</td>
                    <td>${data.region || "-"}</td>
                    <td style="color: #28a745; font-weight: bold;">₹ ${amount.toLocaleString("en-IN")}</td>
                </tr>
            `;
        });

        // Update Summary Cards
        if (totalAmountEl) totalAmountEl.textContent = `₹ ${totalCollection.toLocaleString("en-IN")}`;
        if (todayAmountEl) todayAmountEl.textContent = `₹ ${todayCollection.toLocaleString("en-IN")}`;
        if (totalEntriesCountEl) totalEntriesCountEl.textContent = totalCount;

        // Render Table Rows
        if (entriesTableBody) entriesTableBody.innerHTML = tableRowsHTML;

    } catch (error) {
        console.error("Dashboard Load Error:", error);
        if (entriesTableBody) {
            entriesTableBody.innerHTML = `<tr><td colspan="7" class="no-data" style="color:red;">Data load karne me error aaya. Console check karein.</td></tr>`;
        }
    }
}

// Initial Load
loadDashboardData();
