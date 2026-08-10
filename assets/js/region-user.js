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

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================
// Data
// ======================================

let allEmployees = [];

let visibleEmployees = [];

let dailyEntries = [];

let accessRules = [];


// ======================================
// Login Information
// ======================================

const currentUserRole =
    String(
        localStorage.getItem("userRole") || ""
    )
        .trim()
        .toLowerCase();

const loggedInUser =
    String(
        localStorage.getItem("loggedInEmpCode") || ""
    )
        .trim();


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

        employee.userCode ||

        employee.user_code ||

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

        entry.userCode ||

        entry.user_code ||

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

        employee.monthly_target ||

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

        // Admin ko all employees dikhenge
        accessRules = [];

        return;

    }


    // ==================================
    // REGION USER
    // ==================================

    if (

        currentUserRole !== "regionuser" &&

        currentUserRole !== "region_user" &&

        currentUserRole !== "region-user"

    ) {

        throw new Error(
            "Region User login required."
        );

    }


    // ==================================
    // Login Code
    // ==================================

    if (!loggedInUser) {

        throw new Error(
            "Login session nahi mili. Please dobara login karein."
        );

    }


    console.log(
        "Logged In Region User:",
        loggedInUser
    );


    let userData = null;


    // ==================================
    // COLLECTION 1: regionUsers
    // ==================================

    const collectionNames = [
        "regionUsers",
        "region_users"
    ];


    // ==================================
    // Search User
    // ==================================

    for (
        const collectionName
        of collectionNames
    ) {

        if (userData) {
            break;
        }


        // --------------------------------
        // Try employeeCode
        // --------------------------------

        const fieldsToCheck = [
            "employeeCode",
            "employee_code",
            "userCode",
            "user_code",
            "empCode",
            "emp_code"
        ];


        for (
            const fieldName
            of fieldsToCheck
        ) {

            if (userData) {
                break;
            }


            try {

                const q =
                    query(
                        collection(
                            db,
                            collectionName
                        ),
                        where(
                            fieldName,
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

                    console.log(
                        "Region User Found:",
                        collectionName,
                        fieldName
                    );

                    break;

                }

            }

            catch (error) {

                console.warn(
                    `Search error: ${collectionName}.${fieldName}`,
                    error
                );

            }

        }

    }


    // ==================================
    // Try Document ID
    // ==================================

    if (!userData) {

        for (
            const collectionName
            of collectionNames
        ) {

            if (userData) {
                break;
            }


            try {

                const userRef =
                    doc(
                        db,
                        collectionName,
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

                    console.log(
                        "Region User Found By Document ID:",
                        collectionName
                    );

                    break;

                }

            }

            catch (error) {

                console.warn(
                    `Document search error: ${collectionName}`,
                    error
                );

            }

        }

    }


    // ==================================
    // User Not Found
    // ==================================

    if (!userData) {

        throw new Error(
            `Region User record nahi mila.

Login Code:
${loggedInUser}

Firestore me check karein:
regionUsers / region_users

Aur field:
employeeCode / userCode`
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

        userData.fullName ||

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


    console.log(
        "Region User Data:",
        userData
    );

    console.log(
        "Access Rules:",
        accessRules
    );

}


// ======================================
// Check Employee Access
// ======================================

function hasEmployeeAccess(employee) {

// ======================================
// Check Employee Access
// ======================================

function hasEmployeeAccess(employee) {

    // ==================================
    // ADMIN
    // ==================================

    if (currentUserRole === "admin") {
        return true;
    }


    // ==================================
    // No Access Rules
    // ==================================

    if (
        !Array.isArray(accessRules) ||
        accessRules.length === 0
    ) {
        console.warn(
            "No Access Rules Found"
        );

        return false;
    }


    // ==================================
    // Employee Region
    // ==================================

    const employeeRegion = normalize(
        employee.region ||
        employee.regionName ||
        employee.region_name ||
        ""
    );


    // ==================================
    // Employee State
    // ==================================

    const employeeState = normalize(
        employee.state ||
        employee.stateName ||
        employee.state_name ||
        ""
    );


    console.log(
        "Checking Employee Access:",
        {
            employeeCode: getEmployeeCode(employee),
            employeeRegion: employeeRegion,
            employeeState: employeeState
        }
    );


    // ==================================
    // Check Access Rules
    // ==================================

    return accessRules.some(
        (rule) => {

            if (!rule) {
                return false;
            }


            // ==================================
            // Region
            // ==================================

            const assignedRegion = normalize(
                rule.region ||
                rule.assignedRegion ||
                rule.regionName ||
                rule.region_name ||
                ""
            );


            console.log(
                "Access Rule:",
                rule,
                "Assigned Region:",
                assignedRegion
            );


            // ==================================
            // Region Match
            // ==================================

            if (
                assignedRegion &&
                assignedRegion !== employeeRegion
            ) {

                return false;

            }


            // ==================================
            // Full Region
            // ==================================

            const fullRegion =
                rule.fullRegion === true ||

                normalize(
                    rule.fullRegion
                ) === "true" ||

                normalize(
                    rule.fullRegion
                ) === "yes" ||

                normalize(
                    rule.accessType
                ) === "full" ||

                normalize(
                    rule.type
                ) === "full";


            if (fullRegion) {

                return true;

            }


            // ==================================
            // Get States
            // ==================================

            let states = [];


            // Array
            if (
                Array.isArray(
                    rule.states
                )
            ) {

                states =
                    rule.states;

            }


            // Single State
            else if (
                typeof rule.states ===
                "string"
            ) {

                states = [
                    rule.states
                ];

            }


            // selectedStates
            else if (
                Array.isArray(
                    rule.selectedStates
                )
            ) {

                states =
                    rule.selectedStates;

            }


            // assignedStates
            else if (
                Array.isArray(
                    rule.assignedStates
                )
            ) {

                states =
                    rule.assignedStates;

            }


            // state
            else if (
                rule.state
            ) {

                states = [
                    rule.state
                ];

            }


            // stateName
            else if (
                rule.stateName
            ) {

                states = [
                    rule.stateName
                ];

            }


            // ==================================
            // No State Restriction
            // ==================================

            if (
                states.length === 0
            ) {

                console.log(
                    "Region matched, no state restriction"
                );

                return true;

            }


            // ==================================
            // Check State
            // ==================================

            const stateMatch =
                states.some(
                    (state) => {

                        const normalizedState =
                            normalize(state);


                        // All States
                        if (
                            normalizedState === "*" ||
                            normalizedState === "all" ||
                            normalizedState === "all states"
                        ) {

                            return true;

                        }


                        return (
                            normalizedState ===
                            employeeState
                        );

                    }
                );


            console.log(
                "State Check:",
                {
                    employeeState:
                        employeeState,

                    allowedStates:
                        states,

                    stateMatch:
                        stateMatch
                }
            );


            return stateMatch;

        }
    );

}

    // ==================================
    // No Access Rules
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
    // Check Rules
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


            // Region match
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
                            normalize(state) ===
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

        // ==================================
        // Load Region User
        // ==================================

        await loadRegionUser();


        // ==================================
        // Load Employees
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


        console.log(
            "Total Employees:",
            allEmployees.length
        );


        // ==================================
        // Load Daily Entries
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


        console.log(
            "Total Daily Entries:",
            dailyEntries.length
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


        console.log(
            "Visible Employees:",
            visibleEmployees.length
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

        console.error(
            "LOAD ERROR:",
            error
        );

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


            // Teacher Name
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


            const displayPercentage =
                Math.min(
                    percentage,
                    100
                );


            // ==================================
            // Percentage Class
            // ==================================

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
            // Row
            // ==================================

            html += `

                <tr>

                    <td class="employee-code">
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

                    <td class="target">
                        <strong>
                            ${formatCurrency(
                                target
                            )}
                        </strong>
                    </td>

                    <td class="collection">
                        <strong>
                            ${formatCurrency(
                                collectionAmount
                            )}
                        </strong>
                    </td>

                    <td class="remaining">
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

            applyFilters();

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

            applyFilters();

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
// Apply Filter Button
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
