// ======================================
// Telethon - Region / State Users
// Collection Summary
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

const regionUserInfo =
    document.getElementById("regionUserInfo");


// ======================================
// Data
// ======================================

let allEmployees = [];

let visibleEmployees = [];

let dailyEntries = [];

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
// Normalize
// ======================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


// ======================================
// Number
// ======================================

function numberValue(value) {

    const number =
        Number(
            String(value ?? "")
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================
// Currency
// ======================================

function formatCurrency(value) {

    return "₹ " +
        Number(value || 0).toLocaleString(
            "en-IN"
        );

}


// ======================================
// Get Employee Code
// ======================================

function getEmployeeCode(employee) {

    return String(
        employee.employeeCode ||
        employee.employee_code ||
        employee.empCode ||
        employee.emp_code ||
        employee.id ||
        ""
    ).trim();

}


// ======================================
// Get Collection Employee Code
// ======================================

function getEntryEmployeeCode(entry) {

    return String(
        entry.employeeCode ||
        entry.employee_code ||
        entry.empCode ||
        entry.emp_code ||
        ""
    ).trim();

}


// ======================================
// Get Collection Amount
// ======================================

function getEntryAmount(entry) {

    return numberValue(
        entry.amount ||
        entry.collection ||
        entry.collectionAmount ||
        entry.totalCollection ||
        0
    );

}


// ======================================
// Get Target
// ======================================

function getEmployeeTarget(employee) {

    return numberValue(
        employee.targetAmount ||
        employee.target ||
        0
    );

}


// ======================================
// Calculate Collection
// ======================================

function getEmployeeCollection(employeeCode) {

    const code =
        normalize(employeeCode);

    let total = 0;

    dailyEntries.forEach(
        (entry) => {

            const entryCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            if (
                entryCode === code
            ) {

                total +=
                    getEntryAmount(
                        entry
                    );

            }

        }
    );

    return total;

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
                    colspan="11"
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
// Loading
// ======================================

function showLoading() {

    if (usersTable) {

        usersTable.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="loading-cell"
                >
                    Loading Teachers...
                </td>
            </tr>
        `;

    }


    if (resultCount) {

        resultCount.textContent =
            "Loading...";

    }

}


// ======================================
// Load Region User
// ======================================

async function loadRegionUser() {

    // ==================================
    // ADMIN
    // ==================================

    if (
        currentUserRole === "admin"
    ) {

        if (regionUserInfo) {

            regionUserInfo.innerHTML =
                `Region User: <strong>Administrator</strong>`;

        }

        return;

    }


    // ==================================
    // Region User
    // ==================================

    if (
        currentUserRole !== "regionuser" &&
        currentUserRole !== "region_user"
    ) {

        return;

    }


    if (!loggedInUser) {

        throw new Error(
            "Login session nahi mili."
        );

    }


    // ==================================
    // Find User
    // ==================================

    let userData = null;


    // Search employeeCode
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

            userData =
                snapshot.docs[0].data();

        }

    }

    catch (error) {

        console.warn(
            "Region User Query:",
            error
        );

    }


    // ==================================
    // Try Document ID
    // ==================================

    if (!userData) {

        try {

            const userRef =
                doc(
                    db,
                    "regionUsers",
                    loggedInUser
                );


            const userSnap =
                await getDoc(
                    userRef
                );


            if (
                userSnap.exists()
            ) {

                userData =
                    userSnap.data();

            }

        }

        catch (error) {

            console.warn(
                "Region User Document:",
                error
            );

        }

    }


    // ==================================
    // User Not Found
    // ==================================

    if (!userData) {

        throw new Error(
            "Region User record nahi mila."
        );

    }


    // ==================================
    // User Name
    // ==================================

    const userName =
        userData.userName ||
        userData.name ||
        loggedInUser;


    if (regionUserInfo) {

        regionUserInfo.innerHTML =
            `Region User: <strong>${escapeHTML(userName)}</strong>`;

    }


    // ==================================
    // Access Rules
    // ==================================

    accessRules =
        Array.isArray(
            userData.access
        )
            ? userData.access
            : [];

}


// ======================================
// Employee Access
// ======================================

function hasEmployeeAccess(employee) {

    // Admin
    if (
        currentUserRole === "admin"
    ) {

        return true;

    }


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


    return accessRules.some(
        (rule) => {

            if (!rule) {
                return false;
            }


            const assignedRegion =
                normalize(
                    rule.region
                );


            if (
                !assignedRegion ||
                assignedRegion !==
                employeeRegion
            ) {

                return false;

            }


            // Full Region
            if (
                rule.fullRegion === true
            ) {

                return true;

            }


            // Selected States
            if (
                Array.isArray(
                    rule.states
                )
            ) {

                return rule.states.some(
                    (state) => {

                        if (
                            state === "*"
                        ) {

                            return true;

                        }


                        return normalize(
                            state
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

        // User info + permission
        await loadRegionUser();


        // Employees
        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        allEmployees = [];


        employeeSnapshot.forEach(
            (employeeDoc) => {

                allEmployees.push({

                    id:
                        employeeDoc.id,

                    ...employeeDoc.data()

                });

            }
        );


        // Daily Collection
        const entrySnapshot =
            await getDocs(
                collection(
                    db,
                    "daily_entry"
                )
            );


        dailyEntries = [];


        entrySnapshot.forEach(
            (entryDoc) => {

                dailyEntries.push({

                    id:
                        entryDoc.id,

                    ...entryDoc.data()

                });

            }
        );


        // Permission
        visibleEmployees =
            allEmployees.filter(
                (employee) =>
                    hasEmployeeAccess(
                        employee
                    )
            );


        // Filters
        loadRegionOptions();


        // Display
        displayEmployees(
            visibleEmployees
        );


    }

    catch (error) {

        showError(
            error.message
        );

    }

}


// ======================================
// Region Options
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
            (region) => {

                regionFilter.innerHTML += `
                    <option value="${escapeHTML(region)}">
                        ${escapeHTML(region)}
                    </option>
                `;

            }
        );


    loadStateOptions();

}


// ======================================
// State Options
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


            const state =
                String(
                    employee.state || ""
                ).trim();


            if (
                state &&
                (
                    !selectedRegion ||
                    employeeRegion ===
                    selectedRegion
                )
            ) {

                states.add(
                    state
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
            (state) => {

                stateFilter.innerHTML += `
                    <option value="${escapeHTML(state)}">
                        ${escapeHTML(state)}
                    </option>
                `;

            }
        );


    loadCityOptions();

}


// ======================================
// City Options
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


            const city =
                String(
                    employee.city || ""
                ).trim();


            if (!city) {
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
                    city
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
            (city) => {

                cityFilter.innerHTML += `
                    <option value="${escapeHTML(city)}">
                        ${escapeHTML(city)}
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
                    colspan="11"
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

            // ==========================
            // Basic Data
            // ==========================

            const employeeCode =
                getEmployeeCode(
                    employee
                );


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


            // ==========================
            // Target
            // ==========================

            const target =
                getEmployeeTarget(
                    employee
                );


            // ==========================
            // Collection
            // ==========================

            const collectionAmount =
                getEmployeeCollection(
                    employeeCode
                );


            // ==========================
            // Remaining
            // ==========================

            const remaining =
                Math.max(
                    target -
                    collectionAmount,
                    0
                );


            // ==========================
            // Percentage
            // ==========================

            let percentage = 0;


            if (target > 0) {

                percentage =
                    (
                        collectionAmount /
                        target
                    ) * 100;

            }


            // Maximum 100 for display
            const displayPercentage =
                Math.min(
                    percentage,
                    100
                );


            // ==========================
            // Status
            // ==========================

            let statusHTML = "";


            if (
                normalize(status) ===
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


            // ==========================
            // Percentage HTML
            // ==========================

            let percentageClass =
                "percentage-low";


            if (
                displayPercentage >= 100
            ) {

                percentageClass =
                    "percentage-complete";

            }

            else if (
                displayPercentage >= 75
            ) {

                percentageClass =
                    "percentage-good";

            }

            else if (
                displayPercentage >= 50
            ) {

                percentageClass =
                    "percentage-medium";

            }


            // ==========================
            // Row
            // ==========================

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
                        <strong>
                            ${formatCurrency(target)}
                        </strong>
                    </td>

                    <td class="collection-amount">
                        <strong>
                            ${formatCurrency(collectionAmount)}
                        </strong>
                    </td>

                    <td class="remaining-amount">
                        ${formatCurrency(remaining)}
                    </td>

                    <td>
                        <span
                            class="
                                percentage-badge
                                ${percentageClass}
                            "
                        >
                            ${displayPercentage.toFixed(2)}%
                        </span>
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
                        getEmployeeCode(
                            employee
                        )
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

            if (stateFilter) {
                stateFilter.value = "";
            }


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
// Apply Filter
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
