// ======================================
// Telethon - Region / State Users
// Region User Assigned Teachers
// Firebase Firestore
//
// DATA SOURCES:
//
// OLD ENTRIES:
//     daily_entry
//
// NEW ENTRIES:
//     teacher_entries
//
// IMPORTANT:
//
// 1. Old daily_entry data is READ ONLY.
// 2. teacher_entries data is READ ONLY.
// 3. Both collections are merged.
// 4. Same Teacher + Same Date = SUM.
// 5. Region User = Assigned Teachers only.
// 6. Admin = All Teachers.
// 7. Target / Collection / Remaining / Percentage.
// 8. Calculation follows Daily Report logic.
//
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
// HTML ELEMENTS
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

let teacherEntries = [];

let allCollectionEntries = [];

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

        entry.teacherCode ||

        entry.teacher_code ||

        ""

    ).trim();

}


// ======================================
// ENTRY AMOUNT
// ======================================

function getEntryAmount(entry) {

    return numberValue(

        entry.amount ||

        entry.collection ||

        entry.collectionAmount ||

        entry.totalCollection ||

        entry.total_collection ||

        entry.collectedAmount ||

        entry.collected_amount ||

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
// ENTRY DATE
//
// Same date fields supported as Daily Report
// ======================================

function getEntryDate(entry) {

    return (

        entry.date ||

        entry.entryDate ||

        entry.collectionDate ||

        entry.collection_date ||

        entry.createdDate ||

        entry.created_date ||

        ""

    );

}


// ======================================
// NORMALIZE DATE
//
// Same logic as Daily Report
// ======================================

function normalizeDate(value) {

    if (!value) {

        return "";

    }


    // ==================================
    // FIRESTORE TIMESTAMP
    // ==================================

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return formatDateForInput(
            value.toDate()
        );

    }


    // ==================================
    // FIRESTORE TIMESTAMP OBJECT
    // ==================================

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return formatDateForInput(
            new Date(
                Number(value.seconds) * 1000
            )
        );

    }


    const stringValue =
        String(value).trim();


    // ==================================
    // YYYY-MM-DD
    // ==================================

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(stringValue)
    ) {

        return stringValue;

    }


    // ==================================
    // DD-MM-YYYY
    // ==================================

    let match =
        stringValue.match(
            /^(\d{2})-(\d{2})-(\d{4})$/
        );


    if (match) {

        return (

            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]

        );

    }


    // ==================================
    // DD/MM/YYYY
    // ==================================

    match =
        stringValue.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


    if (match) {

        return (

            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]

        );

    }


    // ==================================
    // Date.parse FALLBACK
    // ==================================

    const parsed =
        new Date(stringValue);


    if (
        !Number.isNaN(
            parsed.getTime()
        )
    ) {

        return formatDateForInput(
            parsed
        );

    }


    return "";

}


// ======================================
// FORMAT JS DATE
// ======================================

function formatDateForInput(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return (

        year +
        "-" +
        month +
        "-" +
        day

    );

}


// ======================================
// ENTRY TIME
//
// Used only for debug/metadata.
// It does NOT decide the amount.
//
// IMPORTANT:
// Same Teacher + Same Date:
// ALL entries are SUMMED.
// ======================================

function getEntryTime(entry) {

    const possibleTime =

        entry.entryTime ||

        entry.entry_time ||

        entry.createdAt ||

        entry.created_at ||

        entry.timestamp ||

        entry.time ||

        entry.entryTimestamp ||

        entry.entry_timestamp ||

        entry.submittedAt ||

        entry.submitted_at ||

        null;


    // ==================================
    // FIRESTORE TIMESTAMP
    // ==================================

    if (
        possibleTime &&
        typeof possibleTime === "object" &&
        typeof possibleTime.toDate === "function"
    ) {

        return possibleTime
            .toDate()
            .getTime();

    }


    // ==================================
    // FIRESTORE TIMESTAMP OBJECT
    // ==================================

    if (
        possibleTime &&
        typeof possibleTime === "object" &&
        possibleTime.seconds !== undefined
    ) {

        return (
            Number(
                possibleTime.seconds
            ) * 1000
        );

    }


    // ==================================
    // JS DATE
    // ==================================

    if (
        possibleTime instanceof Date
    ) {

        return possibleTime.getTime();

    }


    // ==================================
    // NUMBER
    // ==================================

    if (
        typeof possibleTime === "number"
    ) {

        return possibleTime;

    }


    // ==================================
    // STRING
    // ==================================

    if (possibleTime) {

        const parsed =
            new Date(
                String(possibleTime)
            );


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return parsed.getTime();

        }

    }


    return 0;

}


// ======================================
// SHOW LOADING
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
// SHOW ERROR
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

            String(
                userData[field]
            ).trim() !== ""

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
                `
                Region User:
                <strong>
                    Administrator
                </strong>
                `;

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
    // LOGIN FIELDS
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
// EMPLOYEE REGION
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
// EMPLOYEE STATE
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
// EMPLOYEE CITY
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
// RULE REGION
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
// RULE STATES
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
// FULL REGION RULE
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
    // NO ACCESS RULE
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

                employeeRegion !==
                ruleRegion

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
// LOAD COLLECTION DATA
//
// READ ONLY
// ======================================

async function loadCollectionData(
    collectionName
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                collectionName
            )
        );


    const result = [];


    snapshot.forEach(
        (entryDoc) => {

            result.push({

                id:
                    entryDoc.id,

                ...entryDoc.data(),

                _source:
                    collectionName,

                _index:
                    result.length

            });

        }
    );


    return result;

}


// ======================================
// BUILD DAILY MAP
//
// SAME LOGIC AS DAILY REPORT
//
// daily_entry + teacher_entries
//
// Same Teacher + Same Date:
// ALL AMOUNTS ARE SUMMED.
//
// Example:
//
// daily_entry:
// T001 | 29 Aug | ₹500
//
// teacher_entries:
// T001 | 29 Aug | ₹300
//
// Result:
//
// T001 | 29 Aug | ₹800
//
// ======================================

function buildDailyMap() {

    const map =
        new Map();


    allCollectionEntries.forEach(
        (entry, index) => {

            // ==================================
            // EMPLOYEE CODE
            // ==================================

            const code =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            // ==================================
            // DATE
            // ==================================

            const date =
                normalizeDate(
                    getEntryDate(
                        entry
                    )
                );


            // ==================================
            // INVALID ENTRY
            // ==================================

            if (
                !code ||
                !date
            ) {

                return;

            }


            // ==================================
            // KEY
            //
            // Teacher + Date
            // ==================================

            const key =
                code +
                "|" +
                date;


            // ==================================
            // AMOUNT
            // ==================================

            const amount =
                getEntryAmount(
                    entry
                );


            // ==================================
            // ENTRY TIME
            //
            // Metadata only
            // ==================================

            const entryTime =
                getEntryTime(
                    entry
                );


            // ==================================
            // EXISTING RECORD
            // ==================================

            const existing =
                map.get(
                    key
                );


            // ==================================
            // FIRST ENTRY
            // ==================================

            if (!existing) {

                map.set(
                    key,
                    {

                        amount:
                            amount,

                        count:
                            1,

                        entries:
                            [
                                entry
                            ],

                        lastEntryTime:
                            entryTime,

                        lastIndex:
                            index

                    }
                );


                return;

            }


            // ==================================
            // SUM AMOUNT
            //
            // IMPORTANT:
            //
            // NO REPLACEMENT.
            //
            // EVERY ENTRY IS ADDED.
            // ==================================

            existing.amount +=
                amount;


            existing.count +=
                1;


            existing.entries.push(
                entry
            );


            // ==================================
            // LATEST METADATA
            // ==================================

            if (
                entryTime >
                existing.lastEntryTime
            ) {

                existing.lastEntryTime =
                    entryTime;


                existing.lastIndex =
                    index;

            }

            else if (
                entryTime ===
                existing.lastEntryTime
            ) {

                if (
                    index >
                    existing.lastIndex
                ) {

                    existing.lastIndex =
                        index;

                }

            }

        }
    );


    console.log(
        "Region User Teacher + Date SUM Map:",
        map
    );


    return map;

}


// ======================================
// TEACHER TOTAL MAP
//
// ALL DATES
//
// Same Teacher + Same Date:
// Already SUMMED.
//
// Then all dates are added.
//
// This follows Daily Report
// All-Time Total logic.
// ======================================

function buildTeacherTotalMap() {

    const totalMap =
        new Map();


    const dailyMap =
        buildDailyMap();


    dailyMap.forEach(
        (record, key) => {

            if (!record) {

                return;

            }


            const separatorIndex =
                key.indexOf("|");


            if (
                separatorIndex === -1
            ) {

                return;

            }


            const employeeCode =
                key.substring(
                    0,
                    separatorIndex
                );


            if (!employeeCode) {

                return;

            }


            const currentTotal =
                totalMap.get(
                    employeeCode
                ) || 0;


            totalMap.set(

                employeeCode,

                currentTotal +

                numberValue(
                    record.amount
                )

            );

        }
    );


    console.log(
        "Region User Teacher All-Time Total:",
        totalMap
    );


    return totalMap;

}


// ======================================
// LOAD EMPLOYEES + COLLECTIONS
// ======================================

async function loadEmployees() {

    showLoading();


    try {

        // ==================================
        // LOAD CURRENT USER
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
        // OLD ENTRIES
        //
        // READ ONLY
        // ==================================

        dailyEntries =
            await loadCollectionData(
                "daily_entry"
            );


        // ==================================
        // NEW ENTRIES
        //
        // READ ONLY
        // ==================================

        teacherEntries =
            await loadCollectionData(
                "teacher_entries"
            );


        // ==================================
        // MERGE
        // ==================================

        allCollectionEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        console.log(
            "Old daily_entry Entries:",
            dailyEntries.length
        );


        console.log(
            "New teacher_entries:",
            teacherEntries.length
        );


        console.log(
            "Combined Collection Entries:",
            allCollectionEntries.length
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
                        "",

                    city:
                        employee.city ||
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
                    employee.region ||
                    employee.regionName ||
                    employee.region_name ||
                    ""
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

                    <option
                        value="${escapeHTML(region)}"
                    >

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
                getEmployeeRegion(
                    employee
                );


            const state =
                String(
                    employee.state ||
                    employee.stateName ||
                    employee.state_name ||
                    employee.assignedState ||
                    employee.assigned_state ||
                    ""
                ).trim();


            const regionMatch =

                !selectedRegion ||

                employeeRegion ===
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

                    <option
                        value="${escapeHTML(state)}"
                    >

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
                getEmployeeRegion(
                    employee
                );


            const employeeState =
                getEmployeeState(
                    employee
                );


            const city =
                String(
                    employee.city ||
                    employee.cityName ||
                    employee.city_name ||
                    ""
                ).trim();


            if (!city) {

                return;

            }


            const regionMatch =

                !selectedRegion ||

                employeeRegion ===
                normalize(
                    selectedRegion
                );


            const stateMatch =

                !selectedState ||

                employeeState ===
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

                    <option
                        value="${escapeHTML(city)}"
                    >

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


    // ==================================
    // BUILD COLLECTION MAP ONCE
    //
    // IMPORTANT:
    // Do NOT rebuild map for every teacher.
    // ==================================

    const teacherTotalMap =
        buildTeacherTotalMap();


    let html = "";


    list.forEach(
        (employee) => {

            const employeeCode =
                getEmployeeCode(
                    employee
                );


            const normalizedCode =
                normalize(
                    employeeCode
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

                employee.regionName ||

                employee.region_name ||

                "-";


            const state =

                employee.state ||

                employee.stateName ||

                employee.state_name ||

                "-";


            const city =

                employee.city ||

                employee.cityName ||

                employee.city_name ||

                "-";


            const status =

                employee.status ||

                "Pending";


            // ==================================
            // TARGET
            // ==================================

            const target =
                getEmployeeTarget(
                    employee
                );


            // ==================================
            // COLLECTION
            //
            // Daily Report logic:
            //
            // daily_entry + teacher_entries
            // Same Teacher + Same Date = SUM
            // All dates = Teacher Total
            // ==================================

            const collectionAmount =
                numberValue(
                    teacherTotalMap.get(
                        normalizedCode
                    ) || 0
                );


            // ==================================
            // REMAINING
            // ==================================

            const remaining =
                Math.max(

                    target -
                    collectionAmount,

                    0

                );


            // ==================================
            // PERCENTAGE
            // ==================================

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
            // PERCENTAGE CLASS
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
            // STATUS
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

                        ${escapeHTML(status)}

                    </span>

                `;

            }


            // ==================================
            // ROW
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
                    getEmployeeRegion(
                        employee
                    );


                const employeeState =
                    getEmployeeState(
                        employee
                    );


                const employeeCity =
                    getEmployeeCity(
                        employee
                    );


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


                // ==================================
                // REGION
                // ==================================

                const regionMatch =

                    !selectedRegion ||

                    employeeRegion ===
                    normalize(
                        selectedRegion
                    );


                // ==================================
                // STATE
                // ==================================

                const stateMatch =

                    !selectedState ||

                    employeeState ===
                    normalize(
                        selectedState
                    );


                // ==================================
                // CITY
                // ==================================

                const cityMatch =

                    !selectedCity ||

                    employeeCity ===
                    normalize(
                        selectedCity
                    );


                // ==================================
                // STATUS
                // ==================================

                const statusMatch =

                    !selectedStatus ||

                    normalize(
                        employeeStatus
                    ) ===
                    normalize(
                        selectedStatus
                    );


                // ==================================
                // SEARCH
                // ==================================

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

                    employeeRegion.includes(
                        search
                    ) ||

                    employeeState.includes(
                        search
                    ) ||

                    employeeCity.includes(
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
