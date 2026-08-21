// ======================================
// Telethon
// Daily Collection Report
// Region User / Admin
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

const jamiatulFilter =
    document.getElementById("jamiatulFilter");

const fromDate =
    document.getElementById("fromDate");

const toDate =
    document.getElementById("toDate");

const searchFilter =
    document.getElementById("searchFilter");

const applyFilter =
    document.getElementById("applyFilter");

const resetFilter =
    document.getElementById("resetFilter");

const reportTableHead =
    document.getElementById("reportTableHead");

const reportTableBody =
    document.getElementById("reportTableBody");

const reportTableFoot =
    document.getElementById("reportTableFoot");

const resultCount =
    document.getElementById("resultCount");

const selectedDateRange =
    document.getElementById("selectedDateRange");

const totalTeachers =
    document.getElementById("totalTeachers");

const grandTotal =
    document.getElementById("grandTotal");

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
// Login
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

        entry.emp_id ||

        entry.employee ||

        ""

    ).trim();

}


// ======================================
// Entry Amount
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
// Date Value
// ======================================

function getEntryDate(entry) {

    const possibleDate =

        entry.date ||

        entry.entryDate ||

        entry.collectionDate ||

        entry.collection_date ||

        entry.createdDate ||

        entry.created_date ||

        "";

    return possibleDate;

}


// ======================================
// Convert Date To YYYY-MM-DD
// ======================================

function normalizeDate(value) {

    if (!value) {
        return "";
    }


    // ==================================
    // Firestore Timestamp
    // ==================================

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        const date =
            value.toDate();

        return formatDateForInput(
            date
        );

    }


    // ==================================
    // Firestore Timestamp Object
    // ==================================

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        const date =
            new Date(
                Number(value.seconds) * 1000
            );

        return formatDateForInput(
            date
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
    // Date.parse fallback
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
// Format JS Date
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
// Display Date
// ======================================

function displayDate(dateString) {

    const date =
        new Date(
            dateString + "T00:00:00"
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short"
        }
    );

}


// ======================================
// Date List
// ======================================

function getDateList(
    startDate,
    endDate
) {

    const dates = [];

    let current =
        new Date(
            startDate + "T00:00:00"
        );

    const last =
        new Date(
            endDate + "T00:00:00"
        );


    while (
        current <= last
    ) {

        dates.push(
            formatDateForInput(
                current
            )
        );

        current.setDate(
            current.getDate() + 1
        );

    }


    return dates;

}


// ======================================
// Entry Time
// IMPORTANT
// This decides which same-day entry
// is considered the latest.
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
    // Firestore Timestamp
    // ==================================

    if (
        possibleTime &&
        typeof possibleTime === "object" &&
        typeof possibleTime.toDate === "function"
    ) {

        const date =
            possibleTime.toDate();

        return date.getTime();

    }


    // ==================================
    // Firestore Timestamp Object
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
    // JS Date
    // ==================================

    if (
        possibleTime instanceof Date
    ) {

        return possibleTime.getTime();

    }


    // ==================================
    // Number Timestamp
    // ==================================

    if (
        typeof possibleTime === "number"
    ) {

        return possibleTime;

    }


    // ==================================
    // String Date / Time
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


    // ==================================
    // If no time found
    // ==================================

    return 0;

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

        return;

    }


    // ==================================
    // REGION USER CHECK
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


    if (!loggedInUser) {

        throw new Error(
            "Login session nahi mili. Please dobara login karein."
        );

    }


    let userData = null;


    // ==================================
    // Collections
    // ==================================

    const collectionNames = [

        "region_users",

        "regionUsers"

    ];


    // ==================================
    // Fields
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
    // Search User
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

                    break;

                }

            }

            catch (error) {

                console.warn(
                    "Region User Search Error:",
                    error
                );

            }

        }

    }


    // ==================================
    // Document ID
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

                    break;

                }

            }

            catch (error) {

                console.warn(
                    "Document Search Error:",
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
            "Region User record nahi mila."
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
// Employee Access
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

            employee.region ||

            employee.regionName ||

            employee.region_name ||

            ""

        );


    const employeeState =
        normalize(

            employee.state ||

            employee.stateName ||

            employee.state_name ||

            ""

        );


    return accessRules.some(
        (rule) => {

            if (!rule) {
                return false;
            }


            const assignedRegion =
                normalize(

                    rule.region ||

                    rule.assignedRegion ||

                    rule.regionName ||

                    rule.region_name ||

                    ""

                );


            if (
                assignedRegion &&
                assignedRegion !==
                employeeRegion
            ) {

                return false;

            }


            // ==================================
            // FULL REGION
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
            // STATES
            // ==================================

            let states = [];


            if (rule.state) {

                states = [
                    rule.state
                ];

            }

            else if (
                Array.isArray(
                    rule.states
                )
            ) {

                states =
                    rule.states;

            }

            else if (
                typeof rule.states ===
                "string"
            ) {

                states = [
                    rule.states
                ];

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
                rule.stateName
            ) {

                states = [
                    rule.stateName
                ];

            }


            // No state restriction
            if (
                states.length === 0
            ) {

                return true;

            }


            return states.some(
                (state) => {

                    const allowedState =
                        normalize(state);


                    if (

                        allowedState === "*" ||

                        allowedState === "all" ||

                        allowedState === "all states"

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
// Load All Data
// ======================================

async function loadData() {

    try {

        // ==================================
        // Region User
        // ==================================

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
        // Daily Entries
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

                    ...entryDoc.data(),

                    _index:
                        dailyEntries.length

                });

            }
        );


        // ==================================
        // Permission
        // ==================================

        visibleEmployees =
            allEmployees.filter(
                (employee) =>
                    hasEmployeeAccess(
                        employee
                    )
            );


        console.log(
            "All Employees:",
            allEmployees.length
        );


        console.log(
            "Visible Employees:",
            visibleEmployees.length
        );


        console.log(
            "Daily Entries:",
            dailyEntries.length
        );


        // ==================================
        // Filters
        // ==================================

        loadRegionOptions();

        loadStateOptions();

        loadCityOptions();

        loadJamiatulOptions();


        // ==================================
        // Default Date
        // ==================================

        setDefaultDates();


        // ==================================
        // Initial Report
        // ==================================

        generateReport();

    }

    catch (error) {

        console.error(
            "Daily Report Load Error:",
            error
        );


        if (reportTableBody) {

            reportTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="20"
                        class="error-cell"
                    >
                        ${escapeHTML(
                            error.message
                        )}
                    </td>
                </tr>
            `;

        }

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
                city &&
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
// Jamiatul Options
// ======================================

function loadJamiatulOptions() {

    if (!jamiatulFilter) {
        return;
    }


    const jamiatuls =
        new Set();


    visibleEmployees.forEach(
        (employee) => {

            const jamiatul =

                employee.jamiatulMadina ||

                employee.jamiatul_madina ||

                employee.jamiatul ||

                employee.madina ||

                "";


            if (
                String(jamiatul).trim()
            ) {

                jamiatuls.add(
                    String(jamiatul).trim()
                );

            }

        }
    );


    jamiatulFilter.innerHTML = `
        <option value="">
            All Jamiatul Madina
        </option>
    `;


    [...jamiatuls]
        .sort()
        .forEach(
            (jamiatul) => {

                jamiatulFilter.innerHTML += `
                    <option value="${escapeHTML(jamiatul)}">
                        ${escapeHTML(jamiatul)}
                    </option>
                `;

            }
        );

}


// ======================================
// Set Default Dates
// ======================================

function setDefaultDates() {

    const today =
        new Date();


    const todayString =
        formatDateForInput(
            today
        );


    if (fromDate) {

        fromDate.value =
            todayString;

    }


    if (toDate) {

        toDate.value =
            todayString;

    }

}


// ======================================
// Get Selected Employees
// ======================================

function getFilteredEmployees() {

    const selectedRegion =
        normalize(
            regionFilter?.value || ""
        );


    const selectedState =
        normalize(
            stateFilter?.value || ""
        );


    const selectedCity =
        normalize(
            cityFilter?.value || ""
        );


    const selectedJamiatul =
        normalize(
            jamiatulFilter?.value || ""
        );


    const search =
        normalize(
            searchFilter?.value || ""
        );


    return visibleEmployees.filter(
        (employee) => {

            const employeeRegion =
                normalize(
                    employee.region || ""
                );


            const employeeState =
                normalize(
                    employee.state || ""
                );


            const employeeCity =
                normalize(
                    employee.city || ""
                );


            const employeeJamiatul =

                normalize(

                    employee.jamiatulMadina ||

                    employee.jamiatul_madina ||

                    employee.jamiatul ||

                    employee.madina ||

                    ""

                );


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


            const jamiatulMatch =
                !selectedJamiatul ||
                employeeJamiatul ===
                selectedJamiatul;


            const searchMatch =

                !search ||

                employeeCode.includes(
                    search
                ) ||

                teacherName.includes(
                    search
                );


            return (

                regionMatch &&

                stateMatch &&

                cityMatch &&

                jamiatulMatch &&

                searchMatch

            );

        }
    );

}


// ======================================
// Get Latest Entry For Employee + Date
//
// IMPORTANT:
// Same Employee + Same Date
// = ONLY latest Entry Time counted.
//
// Example:
//
// 10:19 AM  ₹500
// 10:57 AM  ₹100
// 10:57 AM  ₹600
// 12:11 PM  ₹800
//
// Result = ₹800
// ======================================

function buildDailyMap() {

    const map = new Map();


    dailyEntries.forEach(
        (entry, index) => {

            // ==================================
            // Employee Code
            // ==================================

            const code =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            // ==================================
            // Date
            // ==================================

            const date =
                normalizeDate(
                    getEntryDate(
                        entry
                    )
                );


            // ==================================
            // Invalid Entry
            // ==================================

            if (
                !code ||
                !date
            ) {

                return;

            }


            // ==================================
            // Unique Key
            // ==================================

            const key =
                code +
                "|" +
                date;


            // ==================================
            // Actual Entry Time
            // ==================================

            const entryTime =
                getEntryTime(
                    entry
                );


            // ==================================
            // Existing Record
            // ==================================

            const existing =
                map.get(
                    key
                );


            // ==================================
            // First Entry
            // ==================================

            if (!existing) {

                map.set(
                    key,
                    {

                        amount:
                            getEntryAmount(
                                entry
                            ),

                        index:
                            index,

                        entryTime:
                            entryTime,

                        entry:
                            entry

                    }
                );

                return;

            }


            // ==================================
            // LATEST ENTRY WINS
            // ==================================

            if (
                entryTime >
                existing.entryTime
            ) {

                map.set(
                    key,
                    {

                        amount:
                            getEntryAmount(
                                entry
                            ),

                        index:
                            index,

                        entryTime:
                            entryTime,

                        entry:
                            entry

                    }
                );

                return;

            }


            // ==================================
            // SAME TIME
            // Use latest Firestore array record
            // ==================================

            if (
                entryTime ===
                existing.entryTime
            ) {

                if (
                    index >
                    existing.index
                ) {

                    map.set(
                        key,
                        {

                            amount:
                                getEntryAmount(
                                    entry
                                ),

                            index:
                                index,

                            entryTime:
                                entryTime,

                            entry:
                                entry

                        }
                    );

                }

            }

        }
    );


    // ==================================
    // DEBUG
    // ==================================

    console.log(
        "Daily Latest Entry Map:",
        map
    );


    return map;

}


// ======================================
// Generate Report
// ======================================

function generateReport() {

    const startDate =
        fromDate?.value || "";


    const endDate =
        toDate?.value || "";


    if (
        !startDate ||
        !endDate
    ) {

        showTableMessage(
            "Please select From Date and To Date."
        );

        return;

    }


    if (
        startDate > endDate
    ) {

        showTableMessage(
            "From Date, To Date se chhoti honi chahiye."
        );

        return;

    }


    const dates =
        getDateList(
            startDate,
            endDate
        );


    const employees =
        getFilteredEmployees();


    const dailyMap =
        buildDailyMap();


    renderHeader(
        dates
    );


    renderBody(
        employees,
        dates,
        dailyMap
    );


    renderFooter(
        employees,
        dates,
        dailyMap
    );


    updateReportInfo(
        employees,
        dates,
        dailyMap
    );

}


// ======================================
// Render Table Header
// ======================================

function renderHeader(dates) {

    if (!reportTableHead) {
        return;
    }


    let html = `

        <tr>

            <th>
                Jamiatul Madina
            </th>

            <th>
                Teacher Name
            </th>

    `;


    dates.forEach(
        (date) => {

            html += `

                <th>
                    ${escapeHTML(
                        displayDate(date)
                    )}
                </th>

            `;

        }
    );


    html += `

            <th>
                Ab Tak Ka Total Collection
            </th>

        </tr>

    `;


    reportTableHead.innerHTML =
        html;

}


// ======================================
// Render Body
// ======================================

function renderBody(
    employees,
    dates,
    dailyMap
) {

    if (!reportTableBody) {
        return;
    }


    if (!employees.length) {

        showTableMessage(
            "Selected filter ke according koi Teacher nahi mila."
        );

        return;

    }


    let html = "";


    employees.forEach(
        (employee) => {

            const employeeCode =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            const jamiatul =

                employee.jamiatulMadina ||

                employee.jamiatul_madina ||

                employee.jamiatul ||

                "-";


            const teacherName =

                employee.teacherName ||

                employee.teacher_name ||

                employee.name ||

                "-";


            let teacherTotal = 0;


            html += `

                <tr>

                    <td class="jamiatul">
                        ${escapeHTML(
                            jamiatul
                        )}
                    </td>

                    <td class="teacher-name">
                        ${escapeHTML(
                            teacherName
                        )}
                    </td>

            `;


            dates.forEach(
                (date) => {

                    const key =
                        employeeCode +
                        "|" +
                        date;


                    const record =
                        dailyMap.get(
                            key
                        );


                    const amount =
                        record
                            ? record.amount
                            : 0;


                    teacherTotal +=
                        amount;


                    if (
                        amount > 0
                    ) {

                        html += `

                            <td
                                class="date-amount"
                            >
                                ${formatCurrency(
                                    amount
                                )}
                            </td>

                        `;

                    }

                    else {

                        html += `

                            <td
                                class="no-entry"
                            >
                                —
                            </td>

                        `;

                    }

                }
            );


            html += `

                    <td
                        class="total-collection"
                    >
                        ${formatCurrency(
                            teacherTotal
                        )}
                    </td>

                </tr>

            `;

        }
    );


    reportTableBody.innerHTML =
        html;

}


// ======================================
// Render Footer
// ======================================

function renderFooter(
    employees,
    dates,
    dailyMap
) {

    if (!reportTableFoot) {
        return;
    }


    let html = `

        <tr class="total-row">

            <td colspan="2">
                TOTAL
            </td>

    `;


    let grandTotalValue = 0;


    dates.forEach(
        (date) => {

            let dateTotal = 0;


            employees.forEach(
                (employee) => {

                    const employeeCode =
                        normalize(
                            getEmployeeCode(
                                employee
                            )
                        );


                    const key =
                        employeeCode +
                        "|" +
                        date;


                    const record =
                        dailyMap.get(
                            key
                        );


                    if (record) {

                        dateTotal +=
                            record.amount;

                    }

                }
            );


            grandTotalValue +=
                dateTotal;


            html += `

                <td class="date-total">

                    ${formatCurrency(
                        dateTotal
                    )}

                </td>

            `;

        }
    );


    html += `

            <td class="grand-total">

                ${formatCurrency(
                    grandTotalValue
                )}

            </td>

        </tr>

    `;


    reportTableFoot.innerHTML =
        html;

}


// ======================================
// Report Information
// ======================================

function updateReportInfo(
    employees,
    dates,
    dailyMap
) {

    let total = 0;


    employees.forEach(
        (employee) => {

            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            dates.forEach(
                (date) => {

                    const key =
                        code +
                        "|" +
                        date;


                    const record =
                        dailyMap.get(
                            key
                        );


                    if (record) {

                        total +=
                            record.amount;

                    }

                }
            );

        }
    );


    if (selectedDateRange) {

        selectedDateRange.textContent =
            `${displayDate(
                dates[0]
            )} - ${displayDate(
                dates[dates.length - 1]
            )}`;

    }


    if (totalTeachers) {

        totalTeachers.textContent =
            employees.length;

    }


    if (grandTotal) {

        grandTotal.textContent =
            formatCurrency(
                total
            );

    }


    if (resultCount) {

        resultCount.textContent =
            `${employees.length} Teacher(s) • ${dates.length} Day(s)`;

    }

}


// ======================================
// Show Message
// ======================================

function showTableMessage(message) {

    if (!reportTableBody) {
        return;
    }


    reportTableBody.innerHTML = `

        <tr>

            <td
                colspan="20"
                class="empty-cell"
            >

                ${escapeHTML(message)}

            </td>

        </tr>

    `;


    if (reportTableFoot) {

        reportTableFoot.innerHTML =
            "";

    }

}


// ======================================
// Quick Date Buttons
// ======================================

const quickButtons =
    document.querySelectorAll(
        ".quick-date-btn"
    );


quickButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            function () {

                quickButtons.forEach(
                    (btn) => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                const days =
                    Number(
                        this.dataset.days
                    );


                const today =
                    new Date();


                const start =
                    new Date(
                        today
                    );


                start.setDate(
                    today.getDate() -
                    days +
                    1
                );


                if (fromDate) {

                    fromDate.value =
                        formatDateForInput(
                            start
                        );

                }


                if (toDate) {

                    toDate.value =
                        formatDateForInput(
                            today
                        );

                }


                generateReport();

            }
        );

    }
);


// ======================================
// Region Change
// ======================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        function () {

            if (stateFilter) {

                stateFilter.value =
                    "";

            }


            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            loadStateOptions();

            loadCityOptions();

            generateReport();

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

                cityFilter.value =
                    "";

            }


            loadCityOptions();

            generateReport();

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

            generateReport();

        }
    );

}


// ======================================
// Jamiatul Change
// ======================================

if (jamiatulFilter) {

    jamiatulFilter.addEventListener(
        "change",
        function () {

            generateReport();

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

            generateReport();

        }
    );

}


// ======================================
// Date Change
// ======================================

if (fromDate) {

    fromDate.addEventListener(
        "change",
        function () {

            quickButtons.forEach(
                (btn) => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            generateReport();

        }
    );

}


if (toDate) {

    toDate.addEventListener(
        "change",
        function () {

            quickButtons.forEach(
                (btn) => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            generateReport();

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

            generateReport();

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

                regionFilter.value =
                    "";

            }


            if (stateFilter) {

                stateFilter.value =
                    "";

            }


            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            if (jamiatulFilter) {

                jamiatulFilter.value =
                    "";

            }


            if (searchFilter) {

                searchFilter.value =
                    "";

            }


            quickButtons.forEach(
                (btn) => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            setDefaultDates();

            loadStateOptions();

            loadCityOptions();

            loadJamiatulOptions();

            generateReport();

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


            localStorage.removeItem(
                "userName"
            );


            window.location.href =
                "index.html";

        }
    );

}


// ======================================
// START
// ======================================

loadData();
