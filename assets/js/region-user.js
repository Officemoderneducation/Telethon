// ======================================
// Telethon - Region / State Users
// Region User Assigned Teachers
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
// DATA
// ======================================

let allEmployees = [];

let visibleEmployees = [];

let dailyEntries = [];

let accessRules = [];


// ======================================
// LOGIN INFORMATION
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
// ESCAPE HTML
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
// NORMALIZE
// ======================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


// ======================================
// NUMBER VALUE
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
// CURRENCY
// ======================================

function formatCurrency(value) {

    return "₹ " +
        Number(value || 0)
            .toLocaleString("en-IN");
}


// ======================================
// EMPLOYEE CODE
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
// ENTRY EMPLOYEE CODE
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

        entry.emp_id ||

        entry.employee ||

        ""

    ).trim();
}


// ======================================
// COLLECTION AMOUNT
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
// EMPLOYEE TARGET
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
// CREATED TIME
// ======================================

function getCreatedTime(entry) {

    if (
        entry.createdAt &&
        typeof entry.createdAt.toMillis === "function"
    ) {

        return entry.createdAt.toMillis();

    }

    if (
        entry.createdAt &&
        typeof entry.createdAt.seconds === "number"
    ) {

        return (
            entry.createdAt.seconds * 1000
        ) +
        Math.floor(
            (entry.createdAt.nanoseconds || 0) /
            1000000
        );

    }

    if (
        entry.createdAt instanceof Date
    ) {

        return entry.createdAt.getTime();

    }

    if (
        typeof entry.createdAt === "string"
    ) {

        const parsed =
            new Date(
                entry.createdAt
            ).getTime();

        if (
            Number.isFinite(parsed)
        ) {

            return parsed;

        }

    }

    return 0;
}


// ======================================
// LATEST ENTRY PER EMPLOYEE + DATE
// ======================================

function getLatestEntriesPerEmployeeDate() {

    const latestEntries = {};

    dailyEntries.forEach(
        (entry) => {

            const employeeCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );

            const entryDate =
                String(
                    entry.date || ""
                ).trim();

            if (
                !employeeCode ||
                !entryDate
            ) {

                return;

            }

            const key =
                employeeCode +
                "___" +
                entryDate;

            const createdTime =
                getCreatedTime(
                    entry
                );

            if (
                !latestEntries[key]
            ) {

                latestEntries[key] = {

                    ...entry,

                    _createdTime:
                        createdTime

                };

                return;

            }

            const existing =
                latestEntries[key];

            const existingTime =
                Number(
                    existing._createdTime || 0
                );

            if (
                createdTime >=
                existingTime
            ) {

                latestEntries[key] = {

                    ...entry,

                    _createdTime:
                        createdTime

                };

            }

        }
    );

    return Object.values(
        latestEntries
    );
}


// ======================================
// EMPLOYEE COLLECTION
// ======================================

function getEmployeeCollection(
    employeeCode
) {

    const code =
        normalize(
            employeeCode
        );

    const latestEntries =
        getLatestEntriesPerEmployeeDate();

    let total = 0;

    latestEntries.forEach(
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
// LOADING
// ======================================

function showLoading() {

    if (usersTable) {

        usersTable.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="loading-cell"
                >
                    <i class="fa-solid fa-spinner fa-spin"></i>
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
// ERROR
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
// GET USER FIELD
// ======================================

function getUserField(
    userData,
    fields
) {

    for (
        const field
        of fields
    ) {

        if (
            userData &&
            userData[field] !== undefined &&
            userData[field] !== null &&
            String(userData[field]).trim() !== ""
        ) {

            return userData[field];

        }

    }

    return "";
}


// ======================================
// LOAD REGION USER
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
                `Region User:
                <strong>Administrator</strong>`;

        }

        if (regionUserInfoTop) {

            regionUserInfoTop.textContent =
                "Administrator";

        }

        accessRules = [];

        console.log(
            "Logged In As Administrator"
        );

        return;

    }


    // ==================================
    // REGION USER ROLE CHECK
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
    // LOGIN CODE
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
    // COLLECTIONS
    // ==================================

    const collectionNames = [

        "region_users",

        "regionUsers"

    ];


    // ==================================
    // POSSIBLE LOGIN FIELDS
    // ==================================

    const fieldsToCheck = [

        "userCode",

        "employeeCode",

        "employee_code",

        "user_code",

        "empCode",

        "emp_code"

    ];


    // ==================================
    // SEARCH USER
    // ==================================

    for (
        const collectionName
        of collectionNames
    ) {

        if (userData) {
            break;
        }

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

                    /*
                     * IMPORTANT:
                     * Exact matching document.
                     */

                    userData =
                        snapshot.docs[0].data();

                    console.log(
                        "Region User Found:",
                        collectionName,
                        fieldName,
                        userData
                    );

                    break;

                }

            }

            catch (error) {

                console.warn(
                    `Search error:
                    ${collectionName}.${fieldName}`,
                    error
                );

            }

        }

    }


    // ==================================
    // SEARCH BY DOCUMENT ID
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
                    `Document search error:
                    ${collectionName}`,
                    error
                );

            }

        }

    }


    // ==================================
    // USER NOT FOUND
    // ==================================

    if (!userData) {

        throw new Error(
            `Region User record nahi mila.
Login Code: ${loggedInUser}

Firestore collections:
region_users / regionUsers`
        );

    }


    // ==================================
    // USER NAME
    // ==================================

    const userName =

        getUserField(
            userData,
            [
                "userName",
                "username",
                "name",
                "fullName",
                "teacherName",
                "teacher_name"
            ]
        ) ||

        loggedInUser;


    // ==================================
    // DISPLAY USER
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
    // ACCESS RULES
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

    else if (
        Array.isArray(
            userData.permissions
        )
    ) {

        accessRules =
            userData.permissions;

    }

    else {

        accessRules = [];

    }


    console.log(
        "================================"
    );

    console.log(
        "CURRENT REGION USER:",
        loggedInUser
    );

    console.log(
        "CURRENT USER DATA:",
        userData
    );

    console.log(
        "CURRENT USER ACCESS RULES:",
        accessRules
    );

    console.log(
        "================================"
    );

}


// ======================================
// GET EMPLOYEE REGION
// ======================================

function getEmployeeRegion(employee) {

    return normalize(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        employee.assignedRegion ||

        employee.assigned_region ||

        ""

    );

}


// ======================================
// GET EMPLOYEE STATE
// ======================================

function getEmployeeState(employee) {

    return normalize(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        employee.assignedState ||

        employee.assigned_state ||

        ""

    );

}


// ======================================
// GET EMPLOYEE CITY
// ======================================

function getEmployeeCity(employee) {

    return normalize(

        employee.city ||

        employee.cityName ||

        employee.city_name ||

        ""

    );

}


// ======================================
// GET RULE REGION
// ======================================

function getRuleRegion(rule) {

    return normalize(

        rule.region ||

        rule.assignedRegion ||

        rule.assigned_region ||

        rule.regionName ||

        rule.region_name ||

        ""

    );

}


// ======================================
// GET RULE STATES
// ======================================

function getRuleStates(rule) {

    let states = [];


    if (
        Array.isArray(
            rule.states
        )
    ) {

        states =
            rule.states;

    }

    else if (
        Array.isArray(
            rule.selectedStates
        )
    ) {

        states =
            rule.selectedStates;

    }

    else if (
        Array.isArray(
            rule.assignedStates
        )
    ) {

        states =
            rule.assignedStates;

    }

    else if (
        rule.state
    ) {

        states = [
            rule.state
        ];

    }

    else if (
        rule.stateName
    ) {

        states = [
            rule.stateName
        ];

    }

    else if (
        typeof rule.states === "string"
    ) {

        states =
            rule.states
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

    }


    return states
        .map(
            state =>
                normalize(state)
        )
        .filter(Boolean);

}


// ======================================
// IS FULL REGION RULE
// ======================================

function isFullRegionRule(rule) {

    return (

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
        ) === "full"

    );

}


// ======================================
// CHECK EMPLOYEE ACCESS
// ======================================
//
// IMPORTANT:
//
// Region User:
//
// Rule Region = Rajasthan
// Rule States = Rajasthan / Gujarat
//
// Employee:
// Region = Rajasthan
// State = Rajasthan
//
// => ALLOW
//
// Employee:
// Region = North
// State = Rajasthan
//
// => DENY
//
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


    // ==================================
    // REGION USER WITHOUT RULE
    // ==================================

    if (
        !Array.isArray(accessRules) ||
        accessRules.length === 0
    ) {

        console.warn(
            "Region User has NO access rules."
        );

        return false;

    }


    const employeeRegion =
        getEmployeeRegion(
            employee
        );

    const employeeState =
        getEmployeeState(
            employee
        );


    // ==================================
    // RULE CHECK
    // ==================================

    return accessRules.some(
        (rule) => {

            if (!rule) {
                return false;
            }


            const ruleRegion =
                getRuleRegion(
                    rule
                );


            // ==================================
            // REGION MUST MATCH
            // ==================================

            if (
                ruleRegion &&
                employeeRegion !== ruleRegion
            ) {

                return false;

            }


            // ==================================
            // FULL REGION
            // ==================================

            if (
                isFullRegionRule(
                    rule
                )
            ) {

                return true;

            }


            // ==================================
            // STATES
            // ==================================

            const allowedStates =
                getRuleStates(
                    rule
                );


            // ==================================
            // NO STATE RESTRICTION
            // ==================================

            if (
                allowedStates.length === 0
            ) {

                return true;

            }


            // ==================================
            // STATE MATCH
            // ==================================

            return allowedStates.some(
                (allowedState) => {

                    if (

                        allowedState === "*" ||

                        allowedState === "all" ||

                        allowedState ===
                        "all states"

                    ) {

                        return true;

                    }

                    return (
                        allowedState ===
                        employeeState
                    );

                }
            );

        }
    );

}


// ======================================
// LOAD EMPLOYEES
// ======================================

async function loadEmployees() {

    showLoading();

    try {

        // ==================================
        // LOAD CURRENT REGION USER FIRST
        // ==================================

        await loadRegionUser();


        // ==================================
        // LOAD EMPLOYEES
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
        // LOAD DAILY ENTRIES
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
        // PERMISSION FILTER
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
        // DEBUG ACCESS
        // ==================================

        console.table(
            visibleEmployees.map(
                employee => ({

                    employeeCode:
                        getEmployeeCode(
                            employee
                        ),

                    teacher:
                        employee.teacherName ||
                        employee.name ||
                        "",

                    region:
                        employee.region ||
                        "",

                    state:
                        employee.state ||
                        ""

                })
            )
        );


        // ==================================
        // LOAD FILTER OPTIONS
        // ==================================

        loadRegionOptions();


        // ==================================
        // DISPLAY
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
// REGION OPTIONS
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
// STATE OPTIONS
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

                normalize(
                    employeeRegion
                ) ===
                normalize(
                    selectedRegion
                );


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
// CITY OPTIONS
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

                normalize(
                    employeeRegion
                ) ===
                normalize(
                    selectedRegion
                );


            const stateMatch =

                !selectedState ||

                normalize(
                    employeeState
                ) ===
                normalize(
                    selectedState
                );


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
// DISPLAY EMPLOYEES
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

            const employeeCode =
                getEmployeeCode(
                    employee
                );


            const teacherName =

                employee.teacherName ||

                employee.teacher_name ||

                employee.name ||

                "-";


            const mobile =

                employee.mobileNumber ||

                employee.mobile ||

                employee.phone ||

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
                getEmployeeTarget(
                    employee
                );


            const collectionAmount =
                getEmployeeCollection(
                    employeeCode
                );


            const remaining =
                Math.max(
                    target -
                    collectionAmount,
                    0
                );


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
                        ${escapeHTML(status)}
                    </span>
                `;

            }


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
// APPLY FILTERS
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

                    normalize(
                        employeeRegion
                    ) ===
                    normalize(
                        selectedRegion
                    );


                const stateMatch =

                    !selectedState ||

                    normalize(
                        employeeState
                    ) ===
                    normalize(
                        selectedState
                    );


                const cityMatch =

                    !selectedCity ||

                    normalize(
                        employeeCity
                    ) ===
                    normalize(
                        selectedCity
                    );


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
// REGION CHANGE
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
// STATE CHANGE
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
// CITY CHANGE
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
// STATUS CHANGE
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
// APPLY BUTTON
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
// SEARCH
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
// RESET
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


            loadRegionOptions();

            displayEmployees(
                visibleEmployees
            );

        }
    );

}


// ======================================
// START
// ======================================

loadEmployees();
