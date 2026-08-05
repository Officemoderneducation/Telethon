// assets/js/dashboard.js

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Authentication Check
onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    loadDashboard();

});

// Load Dashboard Data
async function loadDashboard() {

    try {

        // Users Count
        const usersSnapshot = await getDocs(collection(db, "users"));
        document.getElementById("totalUsers").textContent = usersSnapshot.size;

        // Students Count
        const studentsSnapshot = await getDocs(collection(db, "students"));
        document.getElementById("totalStudents").textContent = studentsSnapshot.size;

        // Daily Entry Count
        const entrySnapshot = await getDocs(collection(db, "daily_entry"));
        document.getElementById("totalBranches").textContent = entrySnapshot.size;

        // Total Collection
        let total = 0;

        entrySnapshot.forEach(doc => {

            const data = doc.data();

            total += Number(data.amount || 0);

        });

        document.getElementById("totalCollection").textContent =
            "₹ " + total.toLocaleString("en-IN");

    } catch (error) {

        console.error(error);

    }

}
