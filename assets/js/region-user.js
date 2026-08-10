// ======================================
// Telethon - Region / State Users
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

const regionFilter =
    document.getElementById("regionFilter");

const stateFilter =
    document.getElementById("stateFilter");

const cityFilter =
    document.getElementById("cityFilter");

const statusFilter =
    document.getElementById("statusFilter");

const searchFilter =
    document.getElementById("searchFilter");

const applyFilter =
    document.getElementById("applyFilter");

const resetFilter =
    document.getElementById("resetFilter");

const usersTable =
    document.getElementById("regionUsersTable");

const resultCount =
    document.getElementById("resultCount");


// ======================================
// Data
// ======================================

let employees = [];


// ======================================
// Escape HTML
// ======================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================
// Load Employees
// ======================================

async function loadEmployees() {

    if (!usersTable) {
        return;
    }

    usersTable.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">
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


        snapshot.forEach((employeeDoc) => {

            employees.push({
                id: employeeDoc.id,
                ...employeeDoc.data()
            });

        });


        loadFilterOptions();

        displayEmployees(employees);

    }

    catch (error) {

        console.error(
            "Region Users Load Error:",
            error
        );


        usersTable.innerHTML = `
            <tr>
                <td colspan="7" class="error-cell">
                    Teachers load nahi ho rahe.
                    <br><br>
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;


        if (resultCount) {
            resultCount.textContent =
                "Error";
        }

    }

}


// ======================================
// Load Filter Options
// ======================================

function loadFilterOptions() {

    if (!regionFilter) {
        return;
    }


    const regions = new Set();


    employees.forEach((employee) => {

        if (employee.region) {
            regions.add(
                String(employee.region).trim()
            );
        }

    });


    regionFilter.innerHTML = `
        <option value="">
            All Regions
        </option>
    `;


    [...regions]
        .sort()
        .forEach((regionName) => {

            regionFilter.innerHTML += `
                <option value="${escapeHTML(regionName)}">
                    ${escapeHTML(regionName)}
                </option>
            `;

        });


    loadStates();

}


// ======================================
// Load States According To Region
// ======================================

function loadStates() {

    if (!stateFilter) {
        return;
    }


    const selectedRegion =
        regionFilter.value.trim();


    const states = new Set();


    employees.forEach((employee) => {

        const employeeRegion =
            String(
                employee.region || ""
            ).trim();


        const employeeState =
            String(
                employee.state || ""
            ).trim();


        if (
            employeeState &&
            (
                !selectedRegion ||
                employeeRegion === selectedRegion
            )
        ) {

            states.add(employeeState);

        }

    });


    stateFilter.innerHTML = `
        <option value="">
            All States
        </option>
    `;


    [...states]
        .sort()
        .forEach((stateName) => {

            stateFilter.innerHTML += `
                <option value="${escapeHTML(stateName)}">
                    ${escapeHTML(stateName)}
                </option>
            `;

        });


    loadCities();

}


// ======================================
// Load Cities According To Region + State
// ======================================

function loadCities() {

    if (!cityFilter) {
        return;
    }


    const selectedRegion =
        regionFilter.value.trim();


    const selectedState =
        stateFilter.value.trim();


    const cities = new Set();


    employees.forEach((employee) => {

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


        if (!employeeCity) {
            return;
        }


        const regionMatch =
            !selectedRegion ||
            employeeRegion === selectedRegion;


        const stateMatch =
            !selectedState ||
            employeeState === selectedState;


        if (
            regionMatch &&
            stateMatch
        ) {

            cities.add(employeeCity);

        }

    });


    cityFilter.innerHTML = `
        <option value="">
            All Cities
        </option>
    `;


    [...cities]
        .sort()
        .forEach((cityName) => {

            cityFilter.innerHTML += `
                <option value="${escapeHTML(cityName)}">
                    ${escapeHTML(cityName)}
                </option>
            `;

        });

}


// ======================================
// Display Employees
// ======================================

function displayEmployees(list) {

    if (!usersTable) {
        return;
    }


    if (list.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-cell"
                >
                    Koi Teacher nahi mila.
                </td>
            </tr>
        `;


        if (resultCount) {

            resultCount.textContent =
                "0 Teachers";

        }


        return;
    }


    let html = "";


    list.forEach((employee) => {


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

        }

        else {

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

            </tr>

        `;

    });


    usersTable.innerHTML =
        html;


    if (resultCount) {

        resultCount.textContent =
            `${list.length} Teacher(s)`;

    }

}


// ======================================
// Apply Filters
// ======================================

function applyFilters() {

    const selectedRegion =
        regionFilter.value.trim();


    const selectedState =
        stateFilter.value.trim();


    const selectedCity =
        cityFilter.value.trim();


    const selectedStatus =
        statusFilter.value.trim();


    const search =
        searchFilter.value
            .trim()
            .toLowerCase();


    const filtered =
        employees.filter((employee) => {


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
                employeeRegion === selectedRegion;


            const stateMatch =
                !selectedState ||
                employeeState === selectedState;


            const cityMatch =
                !selectedCity ||
                employeeCity === selectedCity;


            const statusMatch =
                !selectedStatus ||
                employeeStatus.toLowerCase() ===
                selectedStatus.toLowerCase();


            const searchMatch =
                !search ||
                employeeCode.includes(search) ||
                teacherName.includes(search) ||
                mobile.includes(search) ||
                employeeRegion.toLowerCase().includes(search) ||
                employeeState.toLowerCase().includes(search) ||
                employeeCity.toLowerCase().includes(search);


            return (
                regionMatch &&
                stateMatch &&
                cityMatch &&
                statusMatch &&
                searchMatch
            );

        });


    displayEmployees(filtered);

}


// ======================================
// Region Change
// ======================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        function () {

            loadStates();

        }
    );

}


// ======================================
// State Change
// ======================================

if (stateFilter) {

    stateFilter.addEventListener(
        "change",
        function () {

            loadCities();

        }
    );

}


// ======================================
// Apply Button
// ======================================

if (applyFilter) {

    applyFilter.addEventListener(
        "click",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Search
// ======================================

if (searchFilter) {

    searchFilter.addEventListener(
        "input",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Reset
// ======================================

if (resetFilter) {

    resetFilter.addEventListener(
        "click",
        function () {

            regionFilter.value = "";

            stateFilter.value = "";

            cityFilter.value = "";

            statusFilter.value = "";

            searchFilter.value = "";

            loadStates();

            displayEmployees(employees);

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
// START
// ======================================

loadEmployees();
