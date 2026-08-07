// ======================================
// Telethon - Teachers / Employees List
// Firebase Firestore
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


const usersTable = document.getElementById("usersTable");
const searchUser = document.getElementById("searchUser");

let employees = [];


// ======================================
// Load Employees From Firebase
// ======================================

async function loadEmployees() {

    if (!usersTable) return;

    usersTable.innerHTML = `
        <tr>
            <td colspan="9" class="loading-cell">
                Loading Teachers...
            </td>
        </tr>
    `;

    try {

        const snapshot = await getDocs(
            collection(db, "employees")
        );

        employees = [];

        snapshot.forEach((employeeDoc) => {

            employees.push({
                id: employeeDoc.id,
                ...employeeDoc.data()
            });

        });

        displayEmployees(employees);

    } catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );

        usersTable.innerHTML = `
            <tr>
                <td colspan="9" class="error-cell">
                    Teachers load nahi ho rahe.
                    <br>
                    ${error.message}
                </td>
            </tr>
        `;
    }
}


// ======================================
// Display Employees
// ======================================

function displayEmployees(list) {

    if (!usersTable) return;


    if (list.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="9" class="empty-cell">
                    Koi Registered Teacher nahi mila.
                </td>
            </tr>
        `;

        return;
    }


    let html = "";


    list.forEach((employee) => {

        // ==================================
        // Firebase Fields
        // ==================================

        const employeeCode =
            employee.employeeCode ||
            employee.employee_code ||
            employee.id ||
            "-";


        const teacherName =
            employee.teacherName ||
            employee.teacher_name ||
            "-";


        const mobile =
            employee.mobileNumber ||
            employee.mobile ||
            "-";


        const region =
            employee.region ||
            "-";


        const state =
            employee.state ||
            "-";


        const city =
            employee.city ||
            "-";


        const jamiatulMadina =
            employee.jamiatulMadina ||
            employee.jamiatul_madina ||
            "-";


        const status =
            employee.status ||
            "Pending";


        // ==================================
        // Status Badge
        // ==================================

        let statusHTML = "";


        if (
            String(status).toLowerCase() ===
            "approved"
        ) {

            statusHTML = `
                <span class="status-badge approved">
                    Approved
                </span>
            `;

        } else {

            statusHTML = `
                <span class="status-badge pending">
                    Pending
                </span>
            `;
        }


        // ==================================
        // Action Button
        // ==================================

        let actionHTML = "";


        if (
            String(status).toLowerCase() ===
            "approved"
        ) {

            actionHTML = `
                <button
                    class="action-btn pending-btn"
                    onclick="changeStatus('${employee.id}', 'Pending')"
                >
                    Pending
                </button>
            `;

        } else {

            actionHTML = `
                <button
                    class="action-btn approve-btn"
                    onclick="changeStatus('${employee.id}', 'Approved')"
                >
                    Approve
                </button>
            `;
        }


        // ==================================
        // Table Row
        // ==================================

        html += `
            <tr>

                <td class="employee-code">
                    ${employeeCode}
                </td>

                <td>
                    ${teacherName}
                </td>

                <td>
                    ${mobile}
                </td>

                <td>
                    ${region}
                </td>

                <td>
                    ${state}
                </td>

                <td>
                    ${city}
                </td>

                <td>
                    ${statusHTML}
                </td>

                <td>
                    ${actionHTML}
                </td>

            </tr>
        `;
    });


    usersTable.innerHTML = html;
}


// ======================================
// Search Teachers
// ======================================

if (searchUser) {

    searchUser.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            const filtered =
                employees.filter((employee) => {

                    const employeeCode =
                        String(
                            employee.employeeCode ||
                            employee.employee_code ||
                            employee.id ||
                            ""
                        ).toLowerCase();


                    const teacherName =
                        String(
                            employee.teacherName ||
                            employee.teacher_name ||
                            ""
                        ).toLowerCase();


                    const mobile =
                        String(
                            employee.mobileNumber ||
                            employee.mobile ||
                            ""
                        ).toLowerCase();


                    const region =
                        String(
                            employee.region ||
                            ""
                        ).toLowerCase();


                    const state =
                        String(
                            employee.state ||
                            ""
                        ).toLowerCase();


                    const city =
                        String(
                            employee.city ||
                            ""
                        ).toLowerCase();


                    const jamiatulMadina =
                        String(
                            employee.jamiatulMadina ||
                            employee.jamiatul_madina ||
                            ""
                        ).toLowerCase();


                    return (
                        employeeCode.includes(search) ||
                        teacherName.includes(search) ||
                        mobile.includes(search) ||
                        region.includes(search) ||
                        state.includes(search) ||
                        city.includes(search) ||
                        jamiatulMadina.includes(search)
                    );
                });


            displayEmployees(filtered);
        }
    );
}


// ======================================
// Change Teacher Status
// ======================================

window.changeStatus = async function (
    employeeId,
    newStatus
) {

    const confirmation = confirm(
        `Teacher status "${newStatus}" karna hai?`
    );

    if (!confirmation) {
        return;
    }


    try {

        const employeeRef =
            doc(
                db,
                "employees",
                employeeId
            );


        await updateDoc(
            employeeRef,
            {
                status: newStatus
            }
        );


        alert(
            `Teacher status ${newStatus} ho gaya.`
        );


        await loadEmployees();

    } catch (error) {

        console.error(
            "Status Update Error:",
            error
        );

        alert(
            "Status update nahi ho saka.\n\n" +
            error.message
        );
    }
};


// ======================================
// Start
// ======================================

loadEmployees();
