// ======================================
// Telethon - Teachers / Employees List
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
// Load Employees
// ======================================

async function loadEmployees() {

    if (!usersTable) return;

    usersTable.innerHTML = `
        <tr>
            <td colspan="8" style="text-align:center;padding:20px;">
                Loading Employees...
            </td>
        </tr>
    `;

    try {

        const snapshot =
            await getDocs(
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
                <td colspan="8"
                    style="text-align:center;padding:20px;color:red;">
                    Employees load nahi ho rahe.
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
                <td colspan="8"
                    style="text-align:center;padding:20px;">
                    Koi Registered Teacher nahi mila.
                </td>
            </tr>
        `;

        return;
    }


    let html = "";


    list.forEach((employee) => {

        const employeeCode =
            employee.employee_code ||
            employee.employeeCode ||
            employee.id ||
            "-";

        const teacherName =
            employee.teacher_name ||
            employee.teacherName ||
            "-";

        const mobile =
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

        const status =
            employee.status ||
            "Pending";


        let statusHTML = "";


        if (
            String(status).toLowerCase() ===
            "approved"
        ) {

            statusHTML = `
                <span style="
                    background:#d1e7dd;
                    color:#0f5132;
                    padding:5px 10px;
                    border-radius:20px;
                    font-size:12px;
                    font-weight:bold;
                ">
                    Approved
                </span>
            `;

        } else {

            statusHTML = `
                <span style="
                    background:#fff3cd;
                    color:#664d03;
                    padding:5px 10px;
                    border-radius:20px;
                    font-size:12px;
                    font-weight:bold;
                ">
                    Pending
                </span>
            `;
        }


        let actionHTML = "";


        if (
            String(status).toLowerCase() ===
            "approved"
        ) {

            actionHTML = `
                <button
                    onclick="changeStatus('${employee.id}', 'Pending')"
                    style="
                        background:#ffc107;
                        color:#000;
                        border:none;
                        padding:6px 10px;
                        border-radius:5px;
                        cursor:pointer;
                    "
                >
                    Pending
                </button>
            `;

        } else {

            actionHTML = `
                <button
                    onclick="changeStatus('${employee.id}', 'Approved')"
                    style="
                        background:#198754;
                        color:white;
                        border:none;
                        padding:6px 10px;
                        border-radius:5px;
                        cursor:pointer;
                    "
                >
                    Approve
                </button>
            `;
        }


        html += `
            <tr>

                <td>
                    <b>${employeeCode}</b>
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
// Search Employees
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

                    return (

                        String(
                            employee.employee_code ||
                            employee.employeeCode ||
                            employee.id ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            employee.teacher_name ||
                            employee.teacherName ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            employee.mobile ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            employee.region ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            employee.state ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            employee.city ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)
                    );
                });


            displayEmployees(filtered);
        }
    );
}


// ======================================
// Change Employee Status
// ======================================

window.changeStatus = async function (
    employeeId,
    newStatus
) {

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
            "Employee status updated successfully!"
        );


        loadEmployees();

    } catch (error) {

        console.error(
            "Status Update Error:",
            error
        );

        alert(
            "Status update nahi ho saka: " +
            error.message
        );
    }
};


// ======================================
// Start
// ======================================

loadEmployees();
