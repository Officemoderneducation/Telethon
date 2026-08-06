// ======================================
// Firebase
// ======================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// Elements
// ======================================

const usersTable = document.getElementById("usersTable");
const searchUser = document.getElementById("searchUser");
const logoutBtn = document.getElementById("logoutBtn");

let employees = [];


// ======================================
// Check Login
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    loadEmployees(user);

});


// ======================================
// Load Employees
// ======================================

async function loadEmployees(currentUser) {

    try {

        usersTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    Loading...
                </td>
            </tr>
        `;

        employees = [];

        const snapshot = await getDocs(
            collection(db, "employees")
        );

        snapshot.forEach((employeeDoc) => {

            employees.push({

                id: employeeDoc.id,

                ...employeeDoc.data()

            });

        });

        displayEmployees(employees, currentUser);

    }

    catch (error) {

        console.error("Load Employees Error:", error);

        usersTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;color:red;">
                    Failed to load employees.
                </td>
            </tr>
        `;

    }

}
// ======================================
// Display Employees
// ======================================

function displayEmployees(data, currentUser) {

    usersTable.innerHTML = "";

    if (data.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No Employees Found
                </td>
            </tr>
        `;

        return;

    }

    data.forEach((employee) => {

        const statusColor =
            employee.status === "Approved"
                ? "#16a34a"
                : "#f59e0b";

        const actionButton =
            employee.status === "Pending"
                ? `
                <button
                    class="btn btn-success"
                    onclick="approveEmployee('${employee.id}')">
                    Approve
                </button>
                `
                : `
                <button
                    class="btn btn-secondary"
                    disabled>
                    Approved
                </button>
                `;

        usersTable.innerHTML += `

        <tr>

            <td>${employee.employeeCode || "-"}</td>

            <td>${employee.teacherName || "-"}</td>

            <td>${employee.mobileNumber || "-"}</td>

            <td>${employee.region || "-"}</td>

            <td>${employee.state || "-"}</td>

            <td>${employee.city || "-"}</td>

            <td>
                <span style="
                    color:white;
                    background:${statusColor};
                    padding:5px 10px;
                    border-radius:20px;
                    font-size:12px;">
                    ${employee.status}
                </span>
            </td>

            <td>

                ${actionButton}

                <button
                    class="btn btn-danger"
                    onclick="deleteEmployee('${employee.id}')">

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

}
// ======================================
// Approve Employee
// ======================================

window.approveEmployee = async function (employeeId) {

    if (!confirm("Approve this employee?")) {
        return;
    }

    try {

        await updateDoc(
            doc(db, "employees", employeeId),
            {
                status: "Approved",
                approvedBy: auth.currentUser.email,
                approvedAt: serverTimestamp()
            }
        );

        alert("Employee Approved Successfully.");

        loadEmployees(auth.currentUser);

    } catch (error) {

        console.error("Approve Error:", error);

        alert("Failed to approve employee.");

    }

};


// ======================================
// Delete Employee
// ======================================

window.deleteEmployee = async function (employeeId) {

    if (!confirm("Delete this employee?")) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, "employees", employeeId)
        );

        alert("Employee Deleted Successfully.");

        loadEmployees(auth.currentUser);

    } catch (error) {

        console.error("Delete Error:", error);

        alert("Failed to delete employee.");

    }

};
// ======================================
// Search Employee
// ======================================

if (searchUser) {

    searchUser.addEventListener("keyup", function () {

        const value = this.value.toLowerCase().trim();

        const filteredEmployees = employees.filter((employee) => {

            return (

                (employee.employeeCode || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (employee.teacherName || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (employee.mobileNumber || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (employee.region || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (employee.state || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (employee.city || "")
                    .toLowerCase()
                    .includes(value)

            );

        });

        displayEmployees(filteredEmployees, auth.currentUser);

    });

}


// ======================================
// Logout
// ======================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await signOut(auth);

            window.location.href = "index.html";

        } catch (error) {

            console.error("Logout Error:", error);

            alert(error.message);

        }

    });

}


// ======================================
// Console
// ======================================

console.log("Users Management Loaded Successfully");
