// ======================================
// Telethon - Teachers / Employees List
// Firebase Firestore
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const usersTable =
    document.getElementById("usersTable");

const searchUser =
    document.getElementById("searchUser");


let employees = [];


// ======================================
// Load Employees From Firebase
// ======================================

async function loadEmployees() {

    if (!usersTable) {
        return;
    }


    usersTable.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="loading-cell"
            >
                Loading Teachers...
            </td>
        </tr>
    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        employees = [];


        snapshot.forEach(
            (employeeDoc) => {

                employees.push({

                    id:
                        employeeDoc.id,

                    ...employeeDoc.data()

                });

            }
        );


        displayEmployees(
            employees
        );


    } catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );


        usersTable.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="error-cell"
                >
                    Teachers load nahi ho rahe.
                    <br><br>
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

    if (!usersTable) {
        return;
    }


    // ==================================
    // No Data
    // ==================================

    if (list.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-cell"
                >
                    Koi Registered Teacher nahi mila.
                </td>
            </tr>
        `;

        return;
    }


    let html = "";


    // ==================================
    // Loop Employees
    // ==================================

    list.forEach(
        (employee) => {


            // ==================================
            // Employee Code
            // ==================================

            const employeeCode =
                employee.employeeCode ||
                employee.employee_code ||
                employee.id ||
                "-";


            // ==================================
            // Teacher Name
            // ==================================

            const teacherName =
                employee.teacherName ||
                employee.teacher_name ||
                "-";


            // ==================================
            // Mobile
            // ==================================

            const mobile =
                employee.mobileNumber ||
                employee.mobile ||
                "-";


            // ==================================
            // Region
            // ==================================

            const region =
                employee.region ||
                "-";


            // ==================================
            // State
            // ==================================

            const state =
                employee.state ||
                "-";


            // ==================================
            // City
            // ==================================

            const city =
                employee.city ||
                "-";


            // ==================================
            // Status
            // ==================================

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
                    <span
                        class="status-badge approved"
                    >
                        Approved
                    </span>
                `;

            } else {

                statusHTML = `
                    <span
                        class="status-badge pending"
                    >
                        Pending
                    </span>
                `;

            }


            // ==================================
            // Action Buttons
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


                    <button
                        class="delete-btn"
                        onclick="deleteTeacher('${employee.id}')"
                    >
                        Delete
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


                    <button
                        class="delete-btn"
                        onclick="deleteTeacher('${employee.id}')"
                    >
                        Delete
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

        }
    );


    usersTable.innerHTML =
        html;

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


            // ==================================
            // Filter
            // ==================================

            const filtered =
                employees.filter(
                    (employee) => {


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


                        return (

                            employeeCode
                                .includes(search)

                            ||

                            teacherName
                                .includes(search)

                            ||

                            mobile
                                .includes(search)

                            ||

                            region
                                .includes(search)

                            ||

                            state
                                .includes(search)

                            ||

                            city
                                .includes(search)

                        );

                    }
                );


            displayEmployees(
                filtered
            );

        }
    );

}


// ======================================
// Change Teacher Status
// ======================================

window.changeStatus =
    async function (
        employeeId,
        newStatus
    ) {


        const confirmation =
            confirm(
                `Teacher status "${newStatus}" karna hai?`
            );


        if (!confirmation) {
            return;
        }


        try {


            // ==================================
            // Employee Reference
            // ==================================

            const employeeRef =
                doc(
                    db,
                    "employees",
                    employeeId
                );


            // ==================================
            // Update Status
            // ==================================

            await updateDoc(
                employeeRef,
                {
                    status:
                        newStatus
                }
            );


            // ==================================
            // Success
            // ==================================

            alert(
                `Teacher status ${newStatus} ho gaya.`
            );


            // ==================================
            // Reload List
            // ==================================

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
// Delete Teacher
// ======================================

window.deleteTeacher =
    async function (
        employeeId
    ) {


        // ==================================
        // Find Employee
        // ==================================

        const employee =
            employees.find(
                (item) =>
                    item.id ===
                    employeeId
            );


        const teacherName =
            employee?.teacherName ||
            employee?.teacher_name ||
            "this Teacher";


        const employeeCode =
            employee?.employeeCode ||
            employee?.employee_code ||
            employeeId;


        // ==================================
        // Confirmation
        // ==================================

        const confirmation =
            confirm(

                "WARNING!\n\n" +

                `Teacher: ${teacherName}\n` +

                `Employee Code: ${employeeCode}\n\n` +

                "Kya aap is Teacher ko permanently DELETE karna chahte hain?\n\n" +

                "Ye data Firebase se permanently delete ho jayega."

            );


        if (!confirmation) {
            return;
        }


        try {


            // ==================================
            // Employee Reference
            // ==================================

            const employeeRef =
                doc(
                    db,
                    "employees",
                    employeeId
                );


            // ==================================
            // Delete From Firebase
            // ==================================

            await deleteDoc(
                employeeRef
            );


            // ==================================
            // Success
            // ==================================

            alert(
                "Teacher successfully delete ho gaya."
            );


            // ==================================
            // Reload Teachers
            // ==================================

            await loadEmployees();


        } catch (error) {


            console.error(
                "Delete Teacher Error:",
                error
            );


            alert(

                "Teacher delete nahi ho saka.\n\n" +

                error.message

            );

        }

    };


// ======================================
// Start
// ======================================

loadEmployees();
