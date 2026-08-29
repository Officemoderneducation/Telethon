// ======================================
// Telethon
// Daily Collection Report
// Region User / Admin
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
// 2. teacher_entries is also READ ONLY.
// 3. Both collections are merged.
// 4. Same Teacher + Same Date = SUM.
// 5. Region User = Assigned Teachers only.
// 6. Admin = All Teachers.
// 7. Date-wise columns.
// 8. Teacher-wise All-Time Total.
// 9. Footer Last TOTAL = All-Time Total.
// 10. Top Grand Total = Selected Date Range.
// 11. Region -> State -> City dependent filters.
// 12. Quick Date buttons.
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
// DATA
// ======================================

let allEmployees = [];

let visibleEmployees = [];

let dailyEntries = [];

let teacherEntries = [];

let allCollectionEntries = [];

let accessRules = [];


// ======================================
// LOGIN
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
        .toLowerCase();

}


// ======================================
// NUMBER
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
// ENTRY DATE
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
// DISPLAY DATE
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
// DATE LIST
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
// ENTRY TIME
//
// Only used for debug/order information.
// Amount is NOT selected as latest anymore.
//
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


    // Firestore Timestamp

    if (
        possibleTime &&
        typeof possibleTime === "object" &&
        typeof possibleTime.toDate === "function"
    ) {

        return possibleTime
            .toDate()
            .getTime();

    }


    // Firestore timestamp object

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


    // JS Date

    if (
        possibleTime instanceof Date
    ) {

        return possibleTime.getTime();

    }


    // Number

    if (
        typeof possibleTime === "number"
    ) {

        return possibleTime;

    }


    // String

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
    // COLLECTIONS
    // ==================================

    const collectionNames = [

        "region_users",

        "regionUsers"

    ];


    // ==================================
    // FIELDS
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
    // DOCUMENT ID
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
    // USER NOT FOUND
    // ==================================

    if (!userData) {

        throw new Error(
            "Region User record nahi mila."
        );

    }


    // ==================================
    // USER NAME
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

    else {

        accessRules = [];

    }

}


// ======================================
// EMPLOYEE ACCESS
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


            // No State Restriction

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
// LOAD COLLECTION
//
// Helper function.
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
// LOAD ALL DATA
// ======================================

async function loadData() {

    try {

        // ==================================
        // REGION USER
        // ==================================

        await loadRegionUser();


        // ==================================
        // EMPLOYEES
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
        // OLD ENTRIES
        //
        // READ ONLY
        // ==================================

        dailyEntries =
            await loadCollectionData(
                "daily_entry"
            );


        // ==================================
        // NEW TEACHER ENTRIES
        //
        // READ ONLY
        // ==================================

        teacherEntries =
            await loadCollectionData(
                "teacher_entries"
            );


        // ==================================
        // MERGE BOTH SOURCES
        // ==================================

        allCollectionEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        // ==================================
        // PERMISSION
        // ==================================

        visibleEmployees =
            allEmployees.filter(
                (employee) =>
                    hasEmployeeAccess(
                        employee
                    )
            );


        // ==================================
        // DEBUG
        // ==================================

        console.log(
            "All Employees:",
            allEmployees.length
        );


        console.log(
            "Visible Employees:",
            visibleEmployees.length
        );


        console.log(
            "Old daily_entry Entries:",
            dailyEntries.length
        );


        console.log(
            "New teacher_entries:",
            teacherEntries.length
        );


        console.log(
            "Combined Entries:",
            allCollectionEntries.length
        );


        // ==================================
        // FILTERS
        // ==================================

        loadRegionOptions();

        loadStateOptions();

        loadCityOptions();

        loadJamiatulOptions();


        // ==================================
        // DEFAULT DATE
        // ==================================

        setDefaultDates();


        // ==================================
        // INITIAL REPORT
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
// JAMIATUL OPTIONS
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
// DEFAULT DATES
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
// FILTERED EMPLOYEES
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
// BUILD DAILY MAP
//
// IMPORTANT:
//
// OLD:
// daily_entry
//
// NEW:
// teacher_entries
//
// BOTH are merged.
//
// Same Teacher + Same Date:
// ALL AMOUNTS ARE SUMMED.
//
// Example:
//
// daily_entry:
// T001 | 29 Aug | 500
//
// teacher_entries:
// T001 | 29 Aug | 300
//
// RESULT:
// T001 | 29 Aug | 800
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
            // UNIQUE KEY
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
            // ==================================

            const entryTime =
                getEntryTime(
                    entry
                );


            // ==================================
            // EXISTING
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
            // SUM
            //
            // IMPORTANT:
            // No latest-entry replacement.
            // Every entry is added.
            // ==================================

            existing.amount +=
                amount;


            existing.count +=
                1;


            existing.entries.push(
                entry
            );


            // ==================================
            // Keep latest metadata
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
        "Combined Teacher + Date SUM Map:",
        map
    );


    return map;

}


// ======================================
// TEACHER ALL-TIME TOTAL
//
// Date filter does NOT apply here.
//
// Same Teacher + Same Date:
// Already SUMMED in dailyMap.
//
// Then all dates are added.
//
// Example:
//
// T001
//
// 28 Aug = 500 + 300 = 800
// 29 Aug = 1000
//
// All-Time Total = 1800
//
// ======================================

function buildTeacherAllTimeTotalMap() {

    const totalMap =
        new Map();


    const dailyMap =
        buildDailyMap();


    dailyMap.forEach(
        (record, key) => {

            if (
                !record
            ) {

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
        "Teacher All-Time Total:",
        totalMap
    );


    return totalMap;

}


// ======================================
// GENERATE REPORT
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


    // ==================================
    // HEADER
    // ==================================

    renderHeader(
        dates
    );


    // ==================================
    // BODY
    // ==================================

    renderBody(
        employees,
        dates,
        dailyMap
    );


    // ==================================
    // FOOTER
    // ==================================

    renderFooter(
        employees,
        dates,
        dailyMap
    );


    // ==================================
    // TOP INFO
    // ==================================

    updateReportInfo(
        employees,
        dates,
        dailyMap
    );

}


// ======================================
// RENDER HEADER
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
// RENDER BODY
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


    // ==================================
    // ALL-TIME TOTAL
    // ==================================

    const teacherAllTimeTotalMap =
        buildTeacherAllTimeTotalMap();


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


            // ==================================
            // DATE COLUMNS
            // ==================================

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
                            ? numberValue(
                                record.amount
                            )
                            : 0;


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


            // ==================================
            // ALL-TIME TEACHER TOTAL
            // ==================================

            const allTimeTotal =
                teacherAllTimeTotalMap.get(
                    employeeCode
                ) || 0;


            html += `

                    <td
                        class="total-collection"
                    >
                        ${formatCurrency(
                            allTimeTotal
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
// RENDER FOOTER
//
// DATE COLUMNS:
// Selected Date Range total.
//
// LAST TOTAL COLUMN:
// Complete All-Time Total.
//
// ======================================

function renderFooter(
    employees,
    dates,
    dailyMap
) {

    if (!reportTableFoot) {
        return;
    }


    const teacherAllTimeTotalMap =
        buildTeacherAllTimeTotalMap();


    let html = `

        <tr class="total-row">

            <td colspan="2">
                TOTAL
            </td>

    `;


    // ==================================
    // SELECTED DATE RANGE TOTAL
    // ==================================

    let selectedDateGrandTotal =
        0;


    dates.forEach(
        (date) => {

            let dateTotal =
                0;


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
                            numberValue(
                                record.amount
                            );

                    }

                }
            );


            selectedDateGrandTotal +=
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


    // ==================================
    // ALL-TIME GRAND TOTAL
    // ==================================

    let allTimeGrandTotal =
        0;


    employees.forEach(
        (employee) => {

            const employeeCode =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            const teacherTotal =
                teacherAllTimeTotalMap.get(
                    employeeCode
                ) || 0;


            allTimeGrandTotal +=
                numberValue(
                    teacherTotal
                );

        }
    );


    // ==================================
    // LAST TOTAL COLUMN
    // ==================================

    html += `

            <td class="grand-total">

                ${formatCurrency(
                    allTimeGrandTotal
                )}

            </td>

        </tr>

    `;


    reportTableFoot.innerHTML =
        html;


    // ==================================
    // DEBUG
    // ==================================

    console.log(
        "Selected Date Range Grand Total:",
        selectedDateGrandTotal
    );


    console.log(
        "All-Time Grand Total:",
        allTimeGrandTotal
    );

}


// ======================================
// TOP REPORT INFORMATION
//
// TOP GRAND TOTAL:
// Selected Date Range ONLY.
//
// It does NOT use All-Time Total.
//
// ======================================

function updateReportInfo(
    employees,
    dates,
    dailyMap
) {

    let total =
        0;


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
                            numberValue(
                                record.amount
                            );

                    }

                }
            );

        }
    );


    // ==================================
    // DATE RANGE
    // ==================================

    if (selectedDateRange) {

        selectedDateRange.textContent =
            `${displayDate(
                dates[0]
            )} - ${displayDate(
                dates[dates.length - 1]
            )}`;

    }


    // ==================================
    // TEACHERS
    // ==================================

    if (totalTeachers) {

        totalTeachers.textContent =
            employees.length;

    }


    // ==================================
    // TOP GRAND TOTAL
    //
    // Selected Date Range
    // ==================================

    if (grandTotal) {

        grandTotal.textContent =
            formatCurrency(
                total
            );

    }


    // ==================================
    // RESULT COUNT
    // ==================================

    if (resultCount) {

        resultCount.textContent =
            `${employees.length} Teacher(s) • ${dates.length} Day(s)`;

    }

}


// ======================================
// SHOW TABLE MESSAGE
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
// QUICK DATE BUTTONS
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
// REGION CHANGE
// ======================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        function () {

            // Reset State

            if (stateFilter) {

                stateFilter.value =
                    "";

            }


            // Reset City

            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            // Reload dependent filters

            loadStateOptions();

            loadCityOptions();


            // Report

            generateReport();

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

            // Reset City

            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            // Reload Cities

            loadCityOptions();


            // Report

            generateReport();

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

            generateReport();

        }
    );

}


// ======================================
// JAMIATUL CHANGE
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
// SEARCH
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
// FROM DATE CHANGE
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


// ======================================
// TO DATE CHANGE
// ======================================

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
// APPLY FILTER
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
// RESET FILTER
// ======================================

if (resetFilter) {

    resetFilter.addEventListener(
        "click",
        function () {

            // Region

            if (regionFilter) {

                regionFilter.value =
                    "";

            }


            // State

            if (stateFilter) {

                stateFilter.value =
                    "";

            }


            // City

            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            // Jamiatul

            if (jamiatulFilter) {

                jamiatulFilter.value =
                    "";

            }


            // Search

            if (searchFilter) {

                searchFilter.value =
                    "";

            }


            // Quick buttons

            quickButtons.forEach(
                (btn) => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            // Default dates

            setDefaultDates();


            // Reload filters

            loadStateOptions();

            loadCityOptions();

            loadJamiatulOptions();


            // Generate

            generateReport();

        }
    );

}


// ======================================
// LOGOUT
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
