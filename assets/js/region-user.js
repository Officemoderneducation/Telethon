// ======================================
// Telethon - Region / State Users Panel
// Firebase Firestore
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const filterRegion =
    document.getElementById("filterRegion");

const filterState =
    document.getElementById("filterState");

const filterCity =
    document.getElementById("filterCity");

const filterStatus =
    document.getElementById("filterStatus");

const applyFilter =
    document.getElementById("applyFilter");

const resetFilter =
    document.getElementById("resetFilter");

const searchUser =
    document.getElementById("searchUser");

const usersTable =
    document.getElementById("usersTable");

const totalTeachers =
    document.getElementById("totalTeachers");

const approvedTeachers =
    document.getElementById("approvedTeachers");

const pendingTeachers =
    document.getElementById("pendingTeachers");

const totalCollection =
    document.getElementById("totalCollection");


// ======================================
// Global Employees
// ======================================

let employees = [];


// ======================================
// Load Employees
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

        const snapshot =
            await getDocs(
                collection(db, "employees")
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


        loadRegions();


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
                <td colspan="9" class="error-cell">
                    Teachers load nahi ho rahe.
                    <br><br>
                    ${error.message}
                </td>
            </tr>
        `;

    }

}


// ======================================
// Load Regions
// ======================================

function loadRegions() {

    if (!filterRegion) return;


    const regions =
        [
            ...new Set(

                employees

                    .map(
                        employee =>
                            employee.region
                    )

                    .filter(Boolean)

            )
        ]

        .sort();


    filterRegion.innerHTML = `
        <option value="">
            All Regions
        </option>
    `;


    regions.forEach(
        region => {

            filterRegion.innerHTML += `
                <option value="${escapeHTML(region)}">
                    ${escapeHTML(region)}
                </option>
            `;

        }
    );

}


// ======================================
// Load States
// ======================================

function loadStates(
    selectedRegion = ""
) {

    if (!filterState) return;


    let filteredEmployees =
        employees;


    if (selectedRegion) {

        filteredEmployees =
            employees.filter(
                employee =>
                    String(
                        employee.region || ""
                    ).trim()
                    === selectedRegion
            );

    }


    const states =
        [
            ...new Set(

                filteredEmployees

                    .map(
                        employee =>
                            employee.state
                    )

                    .filter(Boolean)

            )
        ]

        .sort();


    filterState.innerHTML = `
        <option value="">
            All States
        </option>
    `;


    states.forEach(
        state => {

            filterState.innerHTML += `
                <option value="${escapeHTML(state)}">
                    ${escapeHTML(state)}
                </option>
            `;

        }
    );


    loadCities(
        selectedRegion,
        ""
    );

}


// ======================================
// Load Cities
// ======================================

function loadCities(
    selectedRegion = "",
    selectedState = ""
) {

    if (!filterCity) return;


    let filteredEmployees =
        employees;


    if (selectedRegion) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    String(
                        employee.region || ""
                    ).trim()
                    === selectedRegion
            );

    }


    if (selectedState) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    String(
                        employee.state || ""
                    ).trim()
                    === selectedState
            );

    }


    const cities =
        [
            ...new Set(

                filteredEmployees

                    .map(
                        employee =>
                            employee.city
                    )

                    .filter(Boolean)

            )
        ]

        .sort();


    filterCity.innerHTML = `
        <option value="">
            All Cities
        </option>
    `;


    cities.forEach(
        city => {

            filterCity.innerHTML += `
                <option value="${escapeHTML(city)}">
                    ${escapeHTML(city)}
                </option>
            `;

        }
    );

}


// ======================================
// Region Change
// ======================================

if (filterRegion) {

    filterRegion.addEventListener(
        "change",
        function() {

            const selectedRegion =
                this.value;


            loadStates(
                selectedRegion
            );

        }
    );

}


// ======================================
// State Change
// ======================================

if (filterState) {

    filterState.addEventListener(
        "change",
        function() {

            const selectedRegion =
                filterRegion
                    ? filterRegion.value
                    : "";


            const selectedState =
                this.value;


            loadCities(
                selectedRegion,
                selectedState
            );

        }
    );

}


// ======================================
// Apply Filter
// ======================================

if (applyFilter) {

    applyFilter.addEventListener(
        "click",
        function() {

            applyFilters();

        }
    );

}


// ======================================
// Search
// ======================================

if (searchUser) {

    searchUser.addEventListener(
        "input",
        function() {

            applyFilters();

        }
    );

}


// ======================================
// Reset Filter
// ======================================

if (resetFilter) {

    resetFilter.addEventListener(
        "click",
        function() {

            if (filterRegion) {

                filterRegion.value =
                    "";

            }


            if (filterState) {

                filterState.innerHTML = `
                    <option value="">
                        All States
                    </option>
                `;

            }


            if (filterCity) {

                filterCity.innerHTML = `
                    <option value="">
                        All Cities
                    </option>
                `;

            }


            if (filterStatus) {

                filterStatus.value =
                    "";

            }


            if (searchUser) {

                searchUser.value =
                    "";

            }


            loadStates("");


            displayEmployees(
                employees
            );

        }
    );

}


// ======================================
// Apply All Filters
// ======================================

function applyFilters() {

    const selectedRegion =
        filterRegion
            ? filterRegion.value
            : "";


    const selectedState =
        filterState
            ? filterState.value
            : "";


    const selectedCity =
        filterCity
            ? filterCity.value
            : "";


    const selectedStatus =
        filterStatus
            ? filterStatus.value
            : "";


    const search =
        searchUser
            ? searchUser.value
                .trim()
                .toLowerCase()
            : "";


    const filtered =
        employees.filter(
            employee => {


                const employeeRegion =
                    String(
                        employee.region || ""
                    ).trim();


                const employeeState =
                    String(
                        employee.state || ""
                    ).trim();


                const employeeCity =
                    String(
                        employee.city || ""
                    ).trim();


                const employeeStatus =
                    String(
                        employee.status || "Pending"
                    ).trim();


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


                const regionMatch =
                    !selectedRegion ||
                    employeeRegion ===
                    selectedRegion;


                const stateMatch =
                    !selectedState ||
                    employeeState ===
                    selectedState;


                const cityMatch =
                    !selectedCity ||
                    employeeCity ===
                    selectedCity;


                const statusMatch =
                    !selectedStatus ||
                    employeeStatus.toLowerCase()
                    ===
                    selectedStatus.toLowerCase();


                const searchMatch =
                    !search ||

                    employeeCode.includes(search) ||

                    teacherName.includes(search) ||

                    mobile.includes(search) ||

                    employeeRegion
                        .toLowerCase()
                        .includes(search) ||

                    employeeState
                        .toLowerCase()
                        .includes(search) ||

                    employeeCity
                        .toLowerCase()
                        .includes(search);


                return (

                    regionMatch &&

                    stateMatch &&

                    cityMatch &&

                    statusMatch &&

                    searchMatch

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

    if (!usersTable) return;


    updateSummary(
        list
    );


    if (list.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="9" class="empty-cell">
                    Koi Teacher nahi mila.
                </td>
            </tr>
        `;

        return;

    }


    let html = "";


    list.forEach(
        employee => {


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


            const status =
                employee.status ||
                "Pending";


            const target =
                Number(
                    employee.target || 0
                );


            const collection =
                Number(
                    employee.totalCollection || 0
                );


            let statusHTML = "";


            if (
                String(status)
                    .toLowerCase()
                    ===
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


            html += `

                <tr>

                    <td class="employee-code">
                        ${escapeHTML(employeeCode)}
                    </td>

                    <td>
                        ${escapeHTML(teacherName)}
                    </td>

                    <td>
                        ${escapeHTML(mobile)}
                    </td>

                    <td>
                        ${escapeHTML(region)}
                    </td>

                    <td>
                        ${escapeHTML(state)}
                    </td>

                    <td>
                        ${escapeHTML(city)}
                    </td>

                    <td>
                        ${statusHTML}
                    </td>

                    <td>
                        ₹ ${formatNumber(target)}
                    </td>

                    <td>
                        ₹ ${formatNumber(collection)}
                    </td>

                </tr>

            `;

        }
    );


    usersTable.innerHTML =
        html;

}


// ======================================
// Summary
// ======================================

function updateSummary(list) {

    const total =
        list.length;


    const approved =
        list.filter(
            employee =>
                String(
                    employee.status || ""
                ).toLowerCase()
                ===
                "approved"
        ).length;


    const pending =
        list.filter(
            employee =>
                String(
                    employee.status || "Pending"
                ).toLowerCase()
                !==
                "approved"
        ).length;


    const collection =
        list.reduce(
            (
                total,
                employee
            ) => {

                return (
                    total +
                    Number(
                        employee.totalCollection ||
                        0
                    )
                );

            },
            0
        );


    if (totalTeachers) {

        totalTeachers.textContent =
            total;

    }


    if (approvedTeachers) {

        approvedTeachers.textContent =
            approved;

    }


    if (pendingTeachers) {

        pendingTeachers.textContent =
            pending;

    }


    if (totalCollection) {

        totalCollection.textContent =
            "₹ " +
            formatNumber(collection);

    }

}


// ======================================
// Format Number
// ======================================

function formatNumber(number) {

    return Number(
        number || 0
    ).toLocaleString(
        "en-IN"
    );

}


// ======================================
// Escape HTML
// ======================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}


// ======================================
// START
// ======================================

loadEmployees();
