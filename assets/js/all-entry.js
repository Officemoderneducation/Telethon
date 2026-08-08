// ======================================
// Telethon - All Collection Entries
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const tableBody =
    document.getElementById("allEntriesTableBody");

const totalAmountEl =
    document.getElementById("allTotalAmount");

const todayAmountEl =
    document.getElementById("allTodayAmount");

const totalEntriesEl =
    document.getElementById("allEntriesCount");

const searchInput =
    document.getElementById("searchAllEntry");


// ======================================
// Store All Entries
// ======================================

let allEntries = [];


// ======================================
// Store Employees
// ======================================

let employeesMap = {};


// ======================================
// Load Employees
// ======================================

async function loadEmployees() {

    try {

        const employeesSnapshot =
            await getDocs(
                collection(db, "employees")
            );


        employeesMap = {};


        employeesSnapshot.forEach((docSnapshot) => {

            const data = docSnapshot.data();


            const employeeCode =
                String(
                    data.employee_code ||
                    data.employeeCode ||
                    data.empCode ||
                    docSnapshot.id ||
                    ""
                )
                .trim()
                .toLowerCase();


            if (employeeCode) {

                employeesMap[employeeCode] = {

                    employeeCode:
                        data.employee_code ||
                        data.employeeCode ||
                        data.empCode ||
                        docSnapshot.id,

                    teacherName:
                        data.teacher_name ||
                        data.teacherName ||
                        data.name ||
                        "-",

                    jamiatulMadina:
                        data.jamiatul_madina ||
                        data.jamiatulMadina ||
                        "-",

                    city:
                        data.city ||
                        "-",

                    state:
                        data.state ||
                        "-",

                    region:
                        data.region ||
                        "-"

                };

            }

        });


        console.log(
            "Employees Loaded:",
            Object.keys(employeesMap).length
        );

    }

    catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );

    }

}


// ======================================
// Load All Entries
// ======================================

async function loadAllEntries() {

    try {


        // First load employees

        await loadEmployees();


        // ==================================
        // Get Daily Entries
        // ==================================

        const entriesQuery = query(
            collection(db, "daily_entry"),
            orderBy("createdAt", "desc")
        );


        const snapshot =
            await getDocs(entriesQuery);


        allEntries = [];


        snapshot.forEach((docSnapshot) => {

            const data =
                docSnapshot.data();


            allEntries.push({

                id: docSnapshot.id,

                ...data

            });

        });


        // ==================================
        // Update Summary
        // ==================================

        updateSummary();


        // ==================================
        // Display Entries
        // ==================================

        displayEntries(allEntries);

    }


    catch (error) {

        console.error(
            "All Entries Load Error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        class="no-data"
                        style="color:red;"
                    >

                        All entries load nahi ho paayi.

                        <br><br>

                        ${error.message}

                    </td>

                </tr>

            `;

        }

    }

}


// ======================================
// Get Employee Details
// ======================================

function getEmployeeDetails(data) {


    // ==================================
    // Employee Code
    // ==================================

    const employeeCode = String(

        data.employee_code ||
        data.employeeCode ||
        data.empCode ||
        data.employee_code_id ||
        ""

    ).trim();


    // ==================================
    // Search Employee Collection
    // ==================================

    const employeeKey =
        employeeCode.toLowerCase();


    const employee =
        employeesMap[employeeKey];


    // ==================================
    // Return Combined Data
    // ==================================

    return {

        employeeCode:
            employeeCode ||
            employee?.employeeCode ||
            "-",


        teacherName:
            data.teacher_name ||
            data.teacherName ||
            employee?.teacherName ||
            "-",


        jamiatulMadina:
            data.jamiatul_madina ||
            data.jamiatulMadina ||
            employee?.jamiatulMadina ||
            "-",


        city:
            data.city ||
            employee?.city ||
            "-",


        state:
            data.state ||
            employee?.state ||
            "-",


        region:
            data.region ||
            employee?.region ||
            "-"

    };

}


// ======================================
// Update Summary
// ======================================

function updateSummary() {


    let totalAmount = 0;

    let todayAmount = 0;


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    allEntries.forEach((data) => {


        const amount =
            Number(data.amount) || 0;


        totalAmount += amount;


        if (data.date === today) {

            todayAmount += amount;

        }

    });


    if (totalAmountEl) {

        totalAmountEl.textContent =
            `₹ ${totalAmount.toLocaleString("en-IN")}`;

    }


    if (todayAmountEl) {

        todayAmountEl.textContent =
            `₹ ${todayAmount.toLocaleString("en-IN")}`;

    }


    if (totalEntriesEl) {

        totalEntriesEl.textContent =
            allEntries.length;

    }

}


// ======================================
// Display Entries
// ======================================

function displayEntries(entries) {


    if (!tableBody) {
        return;
    }


    if (entries.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="no-data"
                >

                    Koi entry nahi mili.

                </td>

            </tr>

        `;

        return;

    }


    let html = "";


    entries.forEach((data, index) => {


        // ==================================
        // Basic Fields
        // ==================================

        const date =
            data.date || "-";


        const employee =
            getEmployeeDetails(data);


        const amount =
            Number(data.amount) || 0;


        // ==================================
        // Created At
        // ==================================

        let entryTime = "-";


        if (
            data.createdAt &&
            typeof data.createdAt.toDate === "function"
        ) {

            const createdDate =
                data.createdAt.toDate();


            entryTime =
                createdDate.toLocaleString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );

        }


        // ==================================
        // Table Row
        // ==================================

        html += `

            <tr>

                <td>
                    ${index + 1}
                </td>


                <td>
                    ${date}
                </td>


                <td class="emp-code">
                    ${employee.employeeCode}
                </td>


                <td>
                    ${employee.teacherName}
                </td>


                <td>
                    ${employee.jamiatulMadina}
                </td>


                <td>
                    ${employee.city}
                </td>


                <td>
                    ${employee.state}
                </td>


                <td>
                    ${employee.region}
                </td>


                <td class="amount">
                    ₹ ${amount.toLocaleString("en-IN")}
                </td>


                <td>
                    ${entryTime}
                </td>

            </tr>

        `;

    });


    tableBody.innerHTML = html;

}


// ======================================
// Search
// ======================================

if (searchInput) {


    searchInput.addEventListener(
        "input",
        function () {


            const search =
                this.value
                    .trim()
                    .toLowerCase();


            if (!search) {

                displayEntries(allEntries);

                return;

            }


            const filtered =
                allEntries.filter((data) => {


                    const employee =
                        getEmployeeDetails(data);


                    const employeeCode =
                        String(
                            employee.employeeCode || ""
                        ).toLowerCase();


                    const teacherName =
                        String(
                            employee.teacherName || ""
                        ).toLowerCase();


                    const jamiatulMadina =
                        String(
                            employee.jamiatulMadina || ""
                        ).toLowerCase();


                    const city =
                        String(
                            employee.city || ""
                        ).toLowerCase();


                    const state =
                        String(
                            employee.state || ""
                        ).toLowerCase();


                    const region =
                        String(
                            employee.region || ""
                        ).toLowerCase();


                    const date =
                        String(
                            data.date || ""
                        ).toLowerCase();


                    return (

                        employeeCode.includes(search)

                        ||

                        teacherName.includes(search)

                        ||

                        jamiatulMadina.includes(search)

                        ||

                        city.includes(search)

                        ||

                        state.includes(search)

                        ||

                        region.includes(search)

                        ||

                        date.includes(search)

                    );

                });


            displayEntries(filtered);

        }
    );

}


// ======================================
// Logout
// ======================================

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {


    logoutBtn.addEventListener(
        "click",
        function (e) {


            e.preventDefault();


            localStorage.removeItem(
                "loggedInEmpCode"
            );


            localStorage.removeItem(
                "userRole"
            );


            window.location.href =
                "index.html";

        }
    );

}


// ======================================
// Start
// ======================================

loadAllEntries();
