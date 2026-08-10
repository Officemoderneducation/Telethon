// ======================================
// Telethon - Region / State Users
// Firebase Firestore
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
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
// Global Data
// ======================================

let allEmployees = [];

let visibleEmployees = [];

let accessRules = [];

let currentUserRole =
    String(
        localStorage.getItem("userRole") || ""
    ).toLowerCase();

let loggedInUser =
    String(
        localStorage.getItem("loggedInEmpCode") || ""
    ).trim();


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
// Normalize Text
// ======================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


// ======================================
// Show Error
// ======================================

function showError(message) {

    console.error(
        "Region Users Error:",
        message
    );


    if (usersTable) {

        usersTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="error-cell"
                >
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;

    }


    if (resultCount) {

        resultCount.textContent =
            "Error";

    }

}


// ======================================
// Loading Message
// ======================================

function showLoading() {

    if (!usersTable) {
        return;
    }


    usersTable.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="loading-cell"
            >
                Loading Teachers...
            </td>
        </tr>
    `;


    if (resultCount) {

        resultCount.textContent =
            "Loading...";

    }

}


// ======================================
// Get Region User Assignment
// ======================================

async function loadAccessRules() {

    accessRules = [];


    // ==================================
    // ADMIN
    // ==================================

    if (
        currentUserRole === "admin"
    ) {

        return true;

    }


    // ==================================
    // REGION USER
    // ==================================

    if (
        currentUserRole !== "regionuser" &&
        currentUserRole !== "region_user"
    ) {

        return false;

    }


    if (!loggedInUser) {

        throw new Error(
            "Login session nahi mili. Please dobara login karein."
        );

    }


    // ==================================
    // First: Search by employeeCode
    // ==================================

    try {

        const q =
            query(
                collection(
                    db,
                    "regionUsers"
                ),
                where(
                    "employeeCode",
                    "==",
                    loggedInUser
                )
            );


        const snapshot =
            await getDocs(q);


        if (!snapshot.empty) {

            const userData =
                snapshot.docs[0].data();


            accessRules =
                Array.isArray(
                    userData.access
                )
                    ? userData.access
                    : [];


            return true;

        }

    }

    catch (error) {

        console.warn(
            "employeeCode search:",
            error
        );

    }


    // ==================================
    // Second: Try document ID
    // ==================================

    try {

        const userRef =
            doc(
                db,
                "regionUsers",
                loggedInUser
            );


        const userSnap =
            await getDoc(userRef);


        if (userSnap.exists()) {

            const userData =
                userSnap.data();


            accessRules =
                Array.isArray(
                    userData.access
                )
                    ? userData.access
                    : [];


            return true;

        }

    }

    catch (error) {

        console.warn(
            "Document ID search:",
            error
        );

    }


    return false;

}


// ======================================
// Check Employee Access
// ======================================

function hasEmployeeAccess(employee) {

    // ==================================
    // ADMIN → FULL ACCESS
    // ==================================

    if (
        currentUserRole === "admin"
    ) {

        return true;

    }


    // ==================================
    // No Assignment
    // ==================================

    if (
        !Array.isArray(accessRules) ||
        accessRules.length === 0
    ) {

        return false;

    }


    const employeeRegion =
        normalize(
            employee.region
        );


    const employeeState =
        normalize(
            employee.state
        );


    // ==================================
    // Check Every Assignment
    // ==================================

    return accessRules.some(
        (rule) => {

            if (!rule) {
                return false;
            }


            const assignedRegion =
                normalize(
                    rule.region
                );


            // ==============================
            // Region Match
            // ==============================

            if (
                !assignedRegion ||
                assignedRegion !==
                employeeRegion
            ) {

                return false;

            }


            // ==============================
            // Complete Region Access
            // ==============================

            if (
                rule.fullRegion === true
            ) {

                return true;

            }


            // ==============================
            // State Access
            // ==============================

            if (
                Array.isArray(
                    rule.states
                )
            ) {

                return rule.states.some(
                    (assignedState) => {

                        // "*" = all states

                        if (
                            assignedState === "*"
                        ) {

                            return true;

                        }


                        return normalize(
                            assignedState
                        ) ===
                        employeeState;

                    }
                );

            }


            return false;

        }
    );

}


// ======================================
// Load Employees
// ======================================

async function loadEmployees() {

    showLoading();


    try {

        // ==================================
        // Check User Access
        // ==================================

        const accessFound =
            await loadAccessRules();


        // ==================================
        // Unauthorized User
        // ==================================

        if (
            currentUserRole !== "admin" &&
            !accessFound
        ) {

            showError(
                "Aapko Region Users panel ka access nahi diya gaya."
            );

            return;

        }


        // ==================================
        // Get Employees
        // ==================================

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        allEmployees = [];


        snapshot.forEach(
            (employeeDoc) => {

                allEmployees.push({

                    id:
                        employeeDoc.id,

                    ...employeeDoc.data()

                });

            }
        );


        // ==================================
        // Apply Access Permission
        // ==================================

        visibleEmployees =
            allEmployees.filter(
                (employee) =>
                    hasEmployeeAccess(
                        employee
                    )
            );


        // ==================================
        // Load Filters
        // ==================================

        loadRegionOptions();


        // ==================================
        // Display
        // ==================================

        displayEmployees(
            visibleEmployees
        );


    }

    catch (error) {

        showError(
            "Teachers load nahi ho rahe.\n\n" +
            error.message
        );

    }

}


// ======================================
// Load Region Options
// ======================================

function loadRegionOptions() {

    if (!regionFilter) {
        return;
    }


    const regions =
        new Set();


    visibleEmployees.forEach(
        (employee) => {

            const region =
                String(
                    employee.region || ""
                ).trim();


            if (region) {

                regions.add(
                    region
                );

            }

        }
    );


    regionFilter.innerHTML = `
        <option value="">
            All Regions
        </option>
    `;


    [...regions]
        .sort()
        .forEach(
            (regionName) => {

                regionFilter.innerHTML += `
                    <option
                        value="${escapeHTML(regionName)}"
                    >
                        ${escapeHTML(regionName)}
                    </option>
                `;

            }
        );


    loadStateOptions();

}


// ======================================
// Load State Options
// ======================================

function loadStateOptions() {

    if (!stateFilter) {
        return;
    }


    const selectedRegion =
        String(
            regionFilter?.value || ""
        ).trim();


    const states =
        new Set();


    visibleEmployees.forEach(
        (employee) => {

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
                    employeeRegion ===
                    selectedRegion
                )
            ) {

                states.add(
                    employeeState
                );

            }

        }
    );


    stateFilter.innerHTML = `
        <option value="">
            All States
        </option>
    `;


    [...states]
        .sort()
        .forEach(
            (stateName) => {

                stateFilter.innerHTML += `
                    <option
                        value="${escapeHTML(stateName)}"
                    >
                        ${escapeHTML(stateName)}
                    </option>
                `;

            }
        );


    loadCityOptions();

}


// ======================================
// Load City Options
// ======================================

function loadCityOptions() {

    if (!cityFilter) {
        return;
    }


    const selectedRegion =
        String(
            regionFilter?.value || ""
        ).trim();


    const selectedState =
        String(
            stateFilter?.value || ""
        ).trim();


    const cities =
        new Set();


    visibleEmployees.forEach(
        (employee) => {

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
                employeeRegion ===
                selectedRegion;


            const stateMatch =
                !selectedState ||
                employeeState ===
                selectedState;


            if (
                regionMatch &&
                stateMatch
            ) {

                cities.add(
                    employeeCity
                );

            }

        }
    );


    cityFilter.innerHTML = `
        <option value="">
            All Cities
        </option>
    `;


    [...cities]
        .sort()
        .forEach(
            (cityName) => {

                cityFilter.innerHTML += `
                    <option
                        value="${escapeHTML(cityName)}"
                    >
                        ${escapeHTML(cityName)}
                    </option>
                `;

            }
        );

}


// ======================================
// Display Employees
// ======================================

function displayEmployees(list) {

    if (!usersTable) {
        return;
    }


    if (!list.length) {

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


    list.forEach(
        (employee) => {

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
                normalize(status) ===
                "approved"
            ) {

                statusHTML = `
                    <span
                        class="status-badge approved"
                    >
                        Approved
                    </span>
                `;

            }

            else {

                statusHTML = `
                    <span
                        class="status-badge pending"
                    >
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

        }
    );


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
        String(
            regionFilter?.value || ""
        ).trim();


    const selectedState =
        String(
            stateFilter?.value || ""
        ).trim();


    const selectedCity =
        String(
            cityFilter?.value || ""
        ).trim();


    const selectedStatus =
        String(
            statusFilter?.value || ""
        ).trim();


    const search =
        normalize(
            searchFilter?.value || ""
        );


    const filtered =
        visibleEmployees.filter(
            (employee) => {

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
                        employee.status ||
                        "Pending"
                    ).trim();


                const employeeCode =
                    normalize(
                        employee.employeeCode ||
                        employee.employee_code ||
                        employee.id ||
                        ""
                    );


                const teacherName =
                    normalize(
                        employee.teacherName ||
                        employee.teacher_name ||
                        ""
                    );


                const mobile =
                    normalize(
                        employee.mobileNumber ||
                        employee.mobile ||
                        ""
                    );


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
                    normalize(
                        employeeStatus
                    ) ===
                    normalize(
                        selectedStatus
                    );


                const searchMatch =
                    !search ||
                    employeeCode.includes(
                        search
                    ) ||
                    teacherName.includes(
                        search
                    ) ||
                    mobile.includes(
                        search
                    ) ||
                    normalize(
                        employeeRegion
                    ).includes(
                        search
                    ) ||
                    normalize(
                        employeeState
                    ).includes(
                        search
                    ) ||
                    normalize(
                        employeeCity
                    ).includes(
                        search
                    );


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
// Region Change
// ======================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        function () {

            // State reset
            if (stateFilter) {
                stateFilter.value = "";
            }


            // City reset
            if (cityFilter) {
                cityFilter.value = "";
            }


            loadStateOptions();

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

            if (cityFilter) {
                cityFilter.value = "";
            }


            loadCityOptions();

        }
    );

}


// ======================================
// City Change
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
// Status Change
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

            if (regionFilter) {
                regionFilter.value = "";
            }


            if (stateFilter) {
                stateFilter.value = "";
            }


            if (cityFilter) {
                cityFilter.value = "";
            }


            if (statusFilter) {
                statusFilter.value = "";
            }


            if (searchFilter) {
                searchFilter.value = "";
            }


            loadStateOptions();


            displayEmployees(
                visibleEmployees
            );

        }
    );

}


// ======================================
// Logout
// ======================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


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
