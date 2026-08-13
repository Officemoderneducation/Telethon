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

const regionFilter =
    document.getElementById("regionFilter");

const stateFilter =
    document.getElementById("stateFilter");

const cityFilter =
    document.getElementById("cityFilter");

const statusFilter =
    document.getElementById("statusFilter");

const resetFilters =
    document.getElementById("resetFilters");


let employees = [];


// ======================================
// Helper - Get Employee Fields
// ======================================

function getEmployeeCode(employee) {

    return String(
        employee.employeeCode ||
        employee.employee_code ||
        employee.id ||
        ""
    ).trim();

}


function getTeacherName(employee) {

    return String(
        employee.teacherName ||
        employee.teacher_name ||
        ""
    ).trim();

}


function getMobile(employee) {

    return String(
        employee.mobileNumber ||
        employee.mobile ||
        ""
    ).trim();

}


function getRegion(employee) {

    return String(
        employee.region ||
        ""
    ).trim();

}


function getState(employee) {

    return String(
        employee.state ||
        ""
    ).trim();

}


function getCity(employee) {

    return String(
        employee.city ||
        ""
    ).trim();

}


function getStatus(employee) {

    return String(
        employee.status ||
        "Pending"
    ).trim();

}


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


        // ==================================
        // Create Filter Options
        // ==================================

        populateRegionFilter();


        populateStateFilter();


        populateCityFilter();


        // ==================================
        // Display
        // ==================================

        applyFilters();


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
// Get Unique Values
// ======================================

function getUniqueValues(
    list,
    getter
) {

    return [
        ...new Set(

            list

                .map(getter)

                .filter(
                    value =>
                        value !== ""
                )

        )
    ].sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    sensitivity: "base"
                }
            )
    );

}


// ======================================
// Populate Region Filter
// ======================================

function populateRegionFilter() {

    if (!regionFilter) {
        return;
    }


    const currentValue =
        regionFilter.value;


    const regions =
        getUniqueValues(
            employees,
            getRegion
        );


    regionFilter.innerHTML = `

        <option value="">
            All Regions
        </option>

    `;


    regions.forEach(
        (region) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                region;


            option.textContent =
                region;


            regionFilter.appendChild(
                option
            );

        }
    );


    if (
        regions.includes(
            currentValue
        )
    ) {

        regionFilter.value =
            currentValue;

    }

}


// ======================================
// Populate State Filter
// ======================================

function populateStateFilter() {

    if (!stateFilter) {
        return;
    }


    const selectedRegion =
        regionFilter
            ? regionFilter.value
            : "";


    const currentValue =
        stateFilter.value;


    let source =
        employees;


    if (selectedRegion) {

        source =
            employees.filter(
                employee =>
                    getRegion(employee)
                        .toLowerCase() ===
                    selectedRegion
                        .toLowerCase()
            );

    }


    const states =
        getUniqueValues(
            source,
            getState
        );


    stateFilter.innerHTML = `

        <option value="">
            All States
        </option>

    `;


    states.forEach(
        (state) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                state;


            option.textContent =
                state;


            stateFilter.appendChild(
                option
            );

        }
    );


    if (
        states.includes(
            currentValue
        )
    ) {

        stateFilter.value =
            currentValue;

    } else {

        stateFilter.value = "";

    }

}


// ======================================
// Populate City Filter
// ======================================

function populateCityFilter() {

    if (!cityFilter) {
        return;
    }


    const selectedRegion =
        regionFilter
            ? regionFilter.value
            : "";


    const selectedState =
        stateFilter
            ? stateFilter.value
            : "";


    let source =
        employees;


    // ==================================
    // Region Filter
    // ==================================

    if (selectedRegion) {

        source =
            source.filter(
                employee =>
                    getRegion(employee)
                        .toLowerCase() ===
                    selectedRegion
                        .toLowerCase()
            );

    }


    // ==================================
    // State Filter
    // ==================================

    if (selectedState) {

        source =
            source.filter(
                employee =>
                    getState(employee)
                        .toLowerCase() ===
                    selectedState
                        .toLowerCase()
            );

    }


    const currentValue =
        cityFilter.value;


    const cities =
        getUniqueValues(
            source,
            getCity
        );


    cityFilter.innerHTML = `

        <option value="">
            All Cities
        </option>

    `;


    cities.forEach(
        (city) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                city;


            option.textContent =
                city;


            cityFilter.appendChild(
                option
            );

        }
    );


    if (
        cities.includes(
            currentValue
        )
    ) {

        cityFilter.value =
            currentValue;

    } else {

        cityFilter.value = "";

    }

}


// ======================================
// Apply All Filters
// ======================================

function applyFilters() {

    const search =
        searchUser
            ? searchUser.value
                .trim()
                .toLowerCase()
            : "";


    const selectedRegion =
        regionFilter
            ? regionFilter.value
                .trim()
                .toLowerCase()
            : "";


    const selectedState =
        stateFilter
            ? stateFilter.value
                .trim()
                .toLowerCase()
            : "";


    const selectedCity =
        cityFilter
            ? cityFilter.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toLowerCase()
            : "";


    const filtered =
        employees.filter(
            (employee) => {


                const employeeCode =
                    getEmployeeCode(
                        employee
                    ).toLowerCase();


                const teacherName =
                    getTeacherName(
                        employee
                    ).toLowerCase();


                const mobile =
                    getMobile(
                        employee
                    ).toLowerCase();


                const region =
                    getRegion(
                        employee
                    ).toLowerCase();


                const state =
                    getState(
                        employee
                    ).toLowerCase();


                const city =
                    getCity(
                        employee
                    ).toLowerCase();


                const status =
                    getStatus(
                        employee
                    ).toLowerCase();


                // ==================================
                // Search
                // ==================================

                const matchesSearch =

                    !search ||

                    employeeCode
                        .includes(search) ||

                    teacherName
                        .includes(search) ||

                    mobile
                        .includes(search) ||

                    region
                        .includes(search) ||

                    state
                        .includes(search) ||

                    city
                        .includes(search);


                // ==================================
                // Region
                // ==================================

                const matchesRegion =

                    !selectedRegion ||

                    region ===
                    selectedRegion;


                // ==================================
                // State
                // ==================================

                const matchesState =

                    !selectedState ||

                    state ===
                    selectedState;


                // ==================================
                // City
                // ==================================

                const matchesCity =

                    !selectedCity ||

                    city ===
                    selectedCity;


                // ==================================
                // Status
                // ==================================

                const matchesStatus =

                    !selectedStatus ||

                    status ===
                    selectedStatus;


                return (

                    matchesSearch &&

                    matchesRegion &&

                    matchesState &&

                    matchesCity &&

                    matchesStatus

                );

            }
        );


    displayEmployees(
        filtered
    );

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
                getEmployeeCode(
                    employee
                ) || "-";


            // ==================================
            // Teacher Name
            // ==================================

            const teacherName =
                getTeacherName(
                    employee
                ) || "-";


            // ==================================
            // Mobile
            // ==================================

            const mobile =
                getMobile(
                    employee
                ) || "-";


            // ==================================
            // Region
            // ==================================

            const region =
                getRegion(
                    employee
                ) || "-";


            // ==================================
            // State
            // ==================================

            const state =
                getState(
                    employee
                ) || "-";


            // ==================================
            // City
            // ==================================

            const city =
                getCity(
                    employee
                ) || "-";


            // ==================================
            // Status
            // ==================================

            const status =
                getStatus(
                    employee
                ) || "Pending";


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
// Live Search
// ======================================

if (searchUser) {

    searchUser.addEventListener(
        "input",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Region Filter
// ======================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        function () {

            // Region change par
            // State aur City options update

            populateStateFilter();

            populateCityFilter();

            applyFilters();

        }
    );

}


// ======================================
// State Filter
// ======================================

if (stateFilter) {

    stateFilter.addEventListener(
        "change",
        function () {

            // State change par
            // City options update

            populateCityFilter();

            applyFilters();

        }
    );

}


// ======================================
// City Filter
// ======================================

if (cityFilter) {

    cityFilter.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Status Filter
// ======================================

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Reset Filters
// ======================================

if (resetFilters) {

    resetFilters.addEventListener(
        "click",
        function () {

            // Search clear

            if (searchUser) {

                searchUser.value = "";

            }


            // Region reset

            if (regionFilter) {

                regionFilter.value = "";

            }


            // State reset

            if (stateFilter) {

                stateFilter.innerHTML = `

                    <option value="">
                        All States
                    </option>

                `;

                stateFilter.value = "";

            }


            // City reset

            if (cityFilter) {

                cityFilter.innerHTML = `

                    <option value="">
                        All Cities
                    </option>

                `;

                cityFilter.value = "";

            }


            // Status reset

            if (statusFilter) {

                statusFilter.value = "";

            }


            // Rebuild filters

            populateRegionFilter();

            populateStateFilter();

            populateCityFilter();


            // Show all employees

            displayEmployees(
                employees
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
            employee
                ? (
                    employee.teacherName ||
                    employee.teacher_name ||
                    "this Teacher"
                )
                : "this Teacher";


        const employeeCode =
            employee
                ? (
                    employee.employeeCode ||
                    employee.employee_code ||
                    employeeId
                )
                : employeeId;


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
