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

const regionUserInfoTop =
    document.getElementById("regionUserInfoTop");


// ======================================
// Data
// ======================================

let allEmployees = [];

let visibleEmployees = [];

let dailyEntries = [];

let accessRules = [];


// ======================================
// Login
// ======================================

const currentUserRole =
    String(
        localStorage.getItem("userRole") || ""
    ).trim().toLowerCase();


const loggedInUser =
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
// Number Value
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
        Number(value || 0)
            .toLocaleString("en-IN");

}


// ======================================
// Employee Code
// ======================================

function getEmployeeCode(employee) {

    return String(

        employee.employeeCode ||

        employee.employee_code ||

        employee.empCode ||

        employee.emp_code ||

        employee.employeeID ||

        employee.employeeId ||

        employee.id ||

        ""

    ).trim();

}


// ======================================
// Entry Employee Code
// ======================================

function getEntryEmployeeCode(entry) {

    return String(

        entry.employeeCode ||

        entry.employee_code ||

        entry.empCode ||

        entry.emp_code ||

        entry.employeeID ||

        entry.employeeId ||

        ""

    ).trim();

}


// ======================================
// Collection Amount
// ======================================

function getEntryAmount(entry) {

    return numberValue(

        entry.amount ||

        entry.collection ||

        entry.collectionAmount ||

        entry.totalCollection ||

        entry.total_collection ||

        0

    );

}


// ======================================
// Employee Target
// ======================================

function getEmployeeTarget(employee) {

    return numberValue(

        employee.targetAmount ||

        employee.target ||

        employee.target_amount ||

        employee.monthlyTarget ||

        0

    );

}


// ======================================
// Employee Collection
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
// Error
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
// Find Region User
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


        if (regionUserInfoTop) {

            regionUserInfoTop.textContent =
                "Administrator";

        }


        return;

    }


    // ==================================
    // REGION USER
    // ==================================

    if (

        currentUserRole !==
        "regionuser" &&

        currentUserRole !==
        "region_user" &&

        currentUserRole !==
        "region-user"

    ) {

        throw new Error(
            "Region User login required."
        );

    }


    if (!loggedInUser) {

        throw new Error(
            "Login session nahi mili."
        );

    }


    let userData = null;


    // ==================================
    // Search by Employee Code
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


        if (
            !snapshot.empty
        ) {

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
    // Search by Document ID
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
            "Region User record nahi mila. Firestore ke regionUsers collection me employeeCode check karein."
        );

    }


    // ==================================
    // User Name
    // ==================================

    const userName =

        userData.userName ||

        userData.username ||

        userData.name ||

        userData.teacherName ||

        userData.teacher_name ||

        loggedInUser;


    // ==================================
    // Show User Name
    // ==================================

    if (regionUserInfo) {

        regionUserInfo.innerHTML = `
            Region User:
            <strong>
                ${escapeHTML(userName)}
            </strong>
        `;

    }


    if (regionUserInfoTop) {

        regionUserInfoTop.textContent =
            userName;

    }


    // ==================================
    // Access Rules
    // ==================================

    if (
        Array.isArray(
            userData.access
        )
    ) {

        accessRules =
            userData.access;

    }

    else if (
        Array.isArray(
            userData.accessRules
        )
    ) {

        accessRules =
            userData.accessRules;

    }

    else {

        accessRules = [];

    }

}


// ======================================
// Check Employee Access
// ======================================

function hasEmployeeAccess(employee) {


    // ==================================
    // ADMIN
    // ==================================

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


    // ==================================
    // Check Every Rule
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


            // Region must match
            if (
                !assignedRegion ||
                assignedRegion !==
                employeeRegion
            ) {

                return false;

            }


            // ==================================
            // Full Region
            // ==================================

            if (
                rule.fullRegion === true
            ) {

                return true;

            }


            // ==================================
            // Full Region String
            // ==================================

            if (
                normalize(
                    rule.fullRegion
                ) === "true"
            ) {

                return true;

            }


            // ==================================
            // All States
            // ==================================

            if (
                rule.states === "*"
            ) {

                return true;

            }


            // ==================================
            // Selected States
            // ==================================

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


                        return (
                            normalize(
                                state
                            ) ===
                            employeeState
                        );

                    }
                );

            }


            // ==================================
            // Single State
            // ==================================

            if (
                typeof rule.states ===
                "string"
            ) {

                return (
                    normalize(
                        rule.states
                    ) ===
                    employeeState
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

        // User permission
        await loadRegionUser();


        // ==================================
        // Employees
        // ==================================

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


        // ==================================
        // Daily Collection
        // ==================================

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


        // ==================================
        // Permission Filter
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


            const regionMatch =

                !selectedRegion ||

                employeeRegion ===
                selectedRegion;


            if (
                state &&
                regionMatch
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


    // ==================================
    // Empty
    // ==================================

    if (
        !list.length
    ) {

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


    // ==================================
    // Rows
    // ==================================

    list.forEach(
        (employee) => {


            // Employee Code
            const employeeCode =
                getEmployeeCode(
                    employee
                );


            // Teacher
            const teacherName =

                employee.teacherName ||

                employee.teacher_name ||

                employee.name ||

                "-";


            // Mobile
            const mobile =

                employee.mobileNumber ||

                employee.mobile ||

                employee.phone ||

                "-";


            // Region
            const region =
                employee.region ||
                "-";


            // State
            const state =
                employee.state ||
                "-";


            // City
            const city =
                employee.city ||
                "-";


            // Status
            const status =

                employee.status ||

                "Pending";


            // Target
            const target =
                getEmployeeTarget(
                    employee
                );


            // Collection
            const collectionAmount =
                getEmployeeCollection(
                    employeeCode
                );


            // Remaining
            const remaining =
                Math.max(
                    target -
                    collectionAmount,
                    0
                );


            // Percentage
            let percentage = 0;


            if (
                target > 0
            ) {

                percentage =
                    (
                        collectionAmount /
                        target
                    ) * 100;

            }


            // ==================================
            // Percentage Display
            // ==================================

            const displayPercentage =
                Math.min(
                    percentage,
                    100
                );


            let percentageClass =
                "percentage-low";


            if (
                displayPercentage >=
                100
            ) {

                percentageClass =
                    "percentage-complete";

            }

            else if (
                displayPercentage >=
                75
            ) {

                percentageClass =
                    "percentage-good";

            }

            else if (
                displayPercentage >=
                50
            ) {

                percentageClass =
                    "percentage-medium";

            }


            // ==================================
            // Status
            // ==================================

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


            // ==================================
            // Table Row
            // ==================================

            html += `

                <tr>

                    <td
                        class="employee-code"
                    >
                        ${escapeHTML(
                            employeeCode
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            teacherName
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            mobile
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            region
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            state
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            city
                        )}
                    </td>


                    <td
                        class="target"
                    >
                        ${formatCurrency(
                            target
                        )}
                    </td>


                    <td
                        class="collection"
                    >
                        ${formatCurrency(
                            collectionAmount
                        )}
                    </td>


                    <td
                        class="remaining"
                    >
                        ${formatCurrency(
                            remaining
                        )}
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

                        employee.name ||

                        ""

                    );


                const mobile =
                    normalize(

                        employee.mobileNumber ||

                        employee.mobile ||

                        employee.phone ||

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
