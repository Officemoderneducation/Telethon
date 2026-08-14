// ======================================================
// TELETHON
// REGION SUMMARY
// ======================================================
// Purpose:
// Region User dashboard summary
//
// Collections:
// 1. regionUsers
// 2. employees
// 3. daily_entry
//
// 1 UNIT = ₹7,000
//
// IMPORTANT:
// Teacher Registration
// Teacher Login
// Daily Collection Entry
// are NOT modified by this file.
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// CONFIGURATION
// ======================================================

const REGION_USERS_COLLECTION = "regionUsers";

const EMPLOYEES_COLLECTION = "employees";

const DAILY_ENTRY_COLLECTION = "daily_entry";

const UNIT_AMOUNT = 7000;


// ======================================================
// HTML ELEMENTS
// ======================================================

const regionUserNameEl =
    document.getElementById("regionUserName");

const regionNameEl =
    document.getElementById("regionName");

const targetAmountEl =
    document.getElementById("targetAmount");

const targetUnitsEl =
    document.getElementById("targetUnits");

const collectionAmountEl =
    document.getElementById("collectionAmount");

const collectionUnitsEl =
    document.getElementById("collectionUnits");

const remainingAmountEl =
    document.getElementById("remainingAmount");

const remainingUnitsEl =
    document.getElementById("remainingUnits");

const percentageEl =
    document.getElementById("percentage");

const progressPercentageEl =
    document.getElementById("progressPercentage");

const progressBarEl =
    document.getElementById("progressBar");

const progressCollectionEl =
    document.getElementById("progressCollection");

const progressTargetEl =
    document.getElementById("progressTarget");

const teacherCountEl =
    document.getElementById("teacherCount");

const loadingBoxEl =
    document.getElementById("loadingBox");

const summaryContentEl =
    document.getElementById("summaryContent");

const errorBoxEl =
    document.getElementById("errorBox");

const errorMessageEl =
    document.getElementById("errorMessage");


// ======================================================
// DATA
// ======================================================

let employees = [];

let dailyEntries = [];

let currentRegionUser = null;

let assignedEmployees = [];


// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


// ======================================================
// NUMBER VALUE
// ======================================================

function numberValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(
            String(value)
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .replace(/\s/g, "")
                .trim()
        );


    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================================
// CURRENCY FORMAT
// ======================================================

function formatCurrency(value) {

    return (
        "₹ " +
        numberValue(value).toLocaleString(
            "en-IN"
        )
    );

}


// ======================================================
// UNIT FORMAT
// ======================================================

function formatUnit(value) {

    const amount =
        numberValue(value);


    const units =
        amount / UNIT_AMOUNT;


    return (
        units.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ) +
        " Unit"
    );

}


// ======================================================
// GET CURRENT REGION USER IDENTIFIER
// ======================================================

function getCurrentUserIdentifiers() {

    const identifiers = [];


    const keys = [

        "loggedInEmpCode",

        "regionUserId",

        "regionUserCode",

        "userCode",

        "employeeCode",

        "empCode",

        "username",

        "userName"

    ];


    keys.forEach(
        function (key) {

            const value =
                localStorage.getItem(key);


            if (
                value !== null &&
                String(value).trim() !== ""
            ) {

                identifiers.push(
                    String(value).trim()
                );

            }

        }
    );


    return identifiers;

}


// ======================================================
// GET USER CODE
// ======================================================

function getUserCode(user) {

    return String(

        user.userCode ||

        user.user_code ||

        user.regionUserCode ||

        user.region_user_code ||

        user.employeeCode ||

        user.employee_code ||

        user.empCode ||

        user.emp_code ||

        user.username ||

        user.userName ||

        user.id ||

        ""

    ).trim();

}


// ======================================================
// GET USER NAME
// ======================================================

function getUserName(user) {

    return String(

        user.userName ||

        user.username ||

        user.name ||

        user.fullName ||

        user.full_name ||

        user.regionUserName ||

        user.region_user_name ||

        getUserCode(user) ||

        "Region User"

    ).trim();

}


// ======================================================
// GET USER TARGET
// ======================================================

function getUserTarget(user) {

    return numberValue(

        user.targetAmount ||

        user.target ||

        user.manualTarget ||

        user.manual_target ||

        0

    );

}


// ======================================================
// GET EMPLOYEE CODE
// ======================================================

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


// ======================================================
// GET EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

    return String(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        ""

    ).trim();

}


// ======================================================
// GET EMPLOYEE STATE
// ======================================================

function getEmployeeState(employee) {

    return String(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        ""

    ).trim();

}


// ======================================================
// GET EMPLOYEE NAME
// ======================================================

function getEmployeeName(employee) {

    return String(

        employee.teacherName ||

        employee.teacher_name ||

        employee.name ||

        employee.fullName ||

        employee.full_name ||

        "Unknown Teacher"

    ).trim();

}


// ======================================================
// GET ENTRY EMPLOYEE CODE
// ======================================================

function getEntryEmployeeCode(entry) {

    return String(

        entry.employee_code ||

        entry.employeeCode ||

        entry.empCode ||

        entry.emp_code ||

        entry.employeeID ||

        entry.employeeId ||

        entry.userCode ||

        entry.user_code ||

        ""

    ).trim();

}


// ======================================================
// GET ENTRY AMOUNT
// ======================================================

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


// ======================================================
// GET CREATED TIME
// ======================================================

function getCreatedTime(entry) {

    if (!entry || !entry.createdAt) {

        return 0;

    }


    if (
        typeof entry.createdAt.toMillis ===
        "function"
    ) {

        return entry.createdAt.toMillis();

    }


    if (
        entry.createdAt.seconds !==
        undefined
    ) {

        return (
            Number(
                entry.createdAt.seconds
            ) * 1000
        );

    }


    const time =
        new Date(
            entry.createdAt
        ).getTime();


    return Number.isFinite(time)
        ? time
        : 0;

}


// ======================================================
// GET USER ACCESS RULES
// ======================================================

function getUserAccessRules(user) {

    if (!user) {

        return [];

    }


    if (
        Array.isArray(user.access)
    ) {

        return user.access;

    }


    if (
        Array.isArray(user.accessRules)
    ) {

        return user.accessRules;

    }


    if (
        Array.isArray(user.permissions)
    ) {

        return user.permissions;

    }


    return [];

}


// ======================================================
// FULL REGION RULE
// ======================================================

function isFullRegionRule(rule) {

    if (!rule) {

        return false;

    }


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


// ======================================================
// GET RULE REGION
// ======================================================

function getRuleRegion(rule) {

    if (!rule) {

        return "";

    }


    return normalize(

        rule.region ||

        rule.assignedRegion ||

        rule.regionName ||

        rule.region_name ||

        ""

    );

}


// ======================================================
// GET RULE STATES
// ======================================================

function getRuleStates(rule) {

    if (!rule) {

        return [];

    }


    if (
        Array.isArray(rule.states)
    ) {

        return rule.states;

    }


    if (
        typeof rule.states ===
        "string"
    ) {

        return [
            rule.states
        ];

    }


    if (
        Array.isArray(
            rule.selectedStates
        )
    ) {

        return rule.selectedStates;

    }


    if (
        Array.isArray(
            rule.assignedStates
        )
    ) {

        return rule.assignedStates;

    }


    if (rule.state) {

        return [
            rule.state
        ];

    }


    if (rule.stateName) {

        return [
            rule.stateName
        ];

    }


    return [];

}


// ======================================================
// EMPLOYEE MATCHES ACCESS
// ======================================================

function employeeMatchesAccess(
    employee,
    user
) {

    const accessRules =
        getUserAccessRules(user);


    if (
        accessRules.length === 0
    ) {

        return false;

    }


    const employeeRegion =
        normalize(
            getEmployeeRegion(
                employee
            )
        );


    const employeeState =
        normalize(
            getEmployeeState(
                employee
            )
        );


    return accessRules.some(
        function (rule) {

            if (!rule) {

                return false;

            }


            const assignedRegion =
                getRuleRegion(
                    rule
                );


            // ------------------------------------------
            // REGION CHECK
            // ------------------------------------------

            if (

                assignedRegion &&

                assignedRegion !==
                employeeRegion

            ) {

                return false;

            }


            // ------------------------------------------
            // FULL REGION
            // ------------------------------------------

            if (
                isFullRegionRule(
                    rule
                )
            ) {

                return true;

            }


            // ------------------------------------------
            // STATE CHECK
            // ------------------------------------------

            const states =
                getRuleStates(
                    rule
                );


            if (
                states.length === 0
            ) {

                return true;

            }


            return states.some(
                function (state) {

                    const normalizedState =
                        normalize(
                            state
                        );


                    if (

                        normalizedState === "*" ||

                        normalizedState === "all" ||

                        normalizedState ===
                        "all states"

                    ) {

                        return true;

                    }


                    return (
                        normalizedState ===
                        employeeState
                    );

                }
            );

        }
    );

}


// ======================================================
// GET ASSIGNED EMPLOYEES
// ======================================================

function getAssignedEmployees(user) {

    return employees.filter(
        function (employee) {

            return employeeMatchesAccess(
                employee,
                user
            );

        }
    );

}


// ======================================================
// LOAD REGION USERS
// ======================================================

async function loadRegionUsers() {

    const snapshot =
        await getDocs(
            collection(
                db,
                REGION_USERS_COLLECTION
            )
        );


    const users = [];


    snapshot.forEach(
        function (docSnapshot) {

            users.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data()

            });

        }
    );


    return users;

}


// ======================================================
// FIND CURRENT REGION USER
// ======================================================

function findCurrentRegionUser(
    users
) {

    const identifiers =
        getCurrentUserIdentifiers()
            .map(normalize)
            .filter(Boolean);


    console.log(
        "Region User Identifiers:",
        identifiers
    );


    // --------------------------------------------------
    // FIRST: MATCH BY ID / USER CODE
    // --------------------------------------------------

    let found =
        users.find(
            function (user) {

                const possibleValues = [

                    user.id,

                    user.userCode,

                    user.user_code,

                    user.regionUserCode,

                    user.region_user_code,

                    user.employeeCode,

                    user.employee_code,

                    user.empCode,

                    user.emp_code,

                    user.username,

                    user.userName

                ];


                return possibleValues.some(
                    function (value) {

                        return (
                            value &&
                            identifiers.includes(
                                normalize(value)
                            )
                        );

                    }
                );

            }
        );


    if (found) {

        return found;

    }


    // --------------------------------------------------
    // FALLBACK:
    // SAVED REGION USER NAME
    // --------------------------------------------------

    const savedName =
        normalize(
            localStorage.getItem(
                "regionUserName"
            )
        );


    if (savedName) {

        found =
            users.find(
                function (user) {

                    return (
                        normalize(
                            getUserName(user)
                        ) === savedName
                    );

                }
            );

    }


    return found || null;

}


// ======================================================
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    const snapshot =
        await getDocs(
            collection(
                db,
                EMPLOYEES_COLLECTION
            )
        );


    employees = [];


    snapshot.forEach(
        function (docSnapshot) {

            employees.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data()

            });

        }
    );


    console.log(
        "Employees Loaded:",
        employees.length
    );

}


// ======================================================
// LOAD DAILY ENTRIES
// ======================================================

async function loadDailyEntries() {

    try {

        const entriesQuery =
            query(
                collection(
                    db,
                    DAILY_ENTRY_COLLECTION
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                entriesQuery
            );


        dailyEntries = [];


        snapshot.forEach(
            function (docSnapshot) {

                dailyEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


    }
    catch (error) {

        console.warn(
            "createdAt orderBy failed. Loading without order.",
            error
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    DAILY_ENTRY_COLLECTION
                )
            );


        dailyEntries = [];


        snapshot.forEach(
            function (docSnapshot) {

                dailyEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );

    }


    console.log(
        "Daily Entries Loaded:",
        dailyEntries.length
    );

}


// ======================================================
// LATEST ENTRY PER EMPLOYEE + DATE
// ======================================================

function getLatestEntries() {

    const latestMap =
        new Map();


    dailyEntries.forEach(
        function (entry) {

            const employeeCode =
                getEntryEmployeeCode(
                    entry
                );


            const date =
                String(
                    entry.date || ""
                ).trim();


            if (
                !employeeCode ||
                !date
            ) {

                return;

            }


            const key =
                normalize(
                    employeeCode
                ) +
                "_" +
                date;


            const existing =
                latestMap.get(key);


            if (!existing) {

                latestMap.set(
                    key,
                    entry
                );

                return;

            }


            const currentTime =
                getCreatedTime(
                    entry
                );


            const existingTime =
                getCreatedTime(
                    existing
                );


            if (
                currentTime >
                existingTime
            ) {

                latestMap.set(
                    key,
                    entry
                );

            }

        }
    );


    return Array.from(
        latestMap.values()
    );

}


// ======================================================
// GET USER COLLECTION
// ======================================================

function getUserCollection() {

    const employeeCodes =
        new Set();


    assignedEmployees.forEach(
        function (employee) {

            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            if (code) {

                employeeCodes.add(
                    code
                );

            }

        }
    );


    const latestEntries =
        getLatestEntries();


    let totalCollection = 0;


    latestEntries.forEach(
        function (entry) {

            const entryCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            if (
                employeeCodes.has(
                    entryCode
                )
            ) {

                totalCollection +=
                    getEntryAmount(
                        entry
                    );

            }

        }
    );


    return totalCollection;

}


// ======================================================
// GET REGION NAME
// ======================================================

function getRegionName(user) {

    if (!user) {

        return "";

    }


    const accessRules =
        getUserAccessRules(user);


    // ------------------------------------------
    // DIRECT REGION FIELD
    // ------------------------------------------

    const directRegion =
        user.region ||
        user.regionName ||
        user.region_name ||
        user.assignedRegion ||
        user.assigned_region;


    if (
        directRegion &&
        String(directRegion).trim()
    ) {

        return String(
            directRegion
        ).trim();

    }


    // ------------------------------------------
    // ACCESS RULE REGION
    // ------------------------------------------

    const regions = [];


    accessRules.forEach(
        function (rule) {

            const region =
                rule &&
                (
                    rule.region ||
                    rule.assignedRegion ||
                    rule.regionName ||
                    rule.region_name
                );


            if (
                region &&
                String(region).trim()
            ) {

                regions.push(
                    String(region).trim()
                );

            }

        }
    );


    const uniqueRegions =
        [
            ...new Set(
                regions
            )
        ];


    if (
        uniqueRegions.length === 1
    ) {

        return uniqueRegions[0];

    }


    if (
        uniqueRegions.length > 1
    ) {

        return uniqueRegions.join(
            ", "
        );

    }


    return "Assigned Region";

}


// ======================================================
// SHOW SUMMARY
// ======================================================

function showSummary(
    target,
    collectionAmount,
    teacherCount
) {

    const remaining =
        Math.max(
            target -
            collectionAmount,
            0
        );


    const percentage =
        target > 0

            ? (
                collectionAmount /
                target
            ) * 100

            : 0;


    const progress =
        Math.min(
            Math.max(
                percentage,
                0
            ),
            100
        );


    // ------------------------------------------
    // TARGET
    // ------------------------------------------

    if (targetAmountEl) {

        targetAmountEl.textContent =
            formatCurrency(
                target
            );

    }


    if (targetUnitsEl) {

        targetUnitsEl.textContent =
            formatUnit(
                target
            );

    }


    // ------------------------------------------
    // COLLECTION
    // ------------------------------------------

    if (collectionAmountEl) {

        collectionAmountEl.textContent =
            formatCurrency(
                collectionAmount
            );

    }


    if (collectionUnitsEl) {

        collectionUnitsEl.textContent =
            formatUnit(
                collectionAmount
            );

    }


    // ------------------------------------------
    // REMAINING
    // ------------------------------------------

    if (remainingAmountEl) {

        remainingAmountEl.textContent =
            formatCurrency(
                remaining
            );

    }


    if (remainingUnitsEl) {

        remainingUnitsEl.textContent =
            formatUnit(
                remaining
            );

    }


    // ------------------------------------------
    // PERCENTAGE
    // ------------------------------------------

    const percentageText =
        percentage.toFixed(2) +
        "%";


    if (percentageEl) {

        percentageEl.textContent =
            percentageText;

    }


    if (progressPercentageEl) {

        progressPercentageEl.textContent =
            percentageText;

    }


    // ------------------------------------------
    // PROGRESS BAR
    // ------------------------------------------

    if (progressBarEl) {

        progressBarEl.style.width =
            progress +
            "%";

    }


    // ------------------------------------------
    // PROGRESS INFO
    // ------------------------------------------

    if (progressCollectionEl) {

        progressCollectionEl.textContent =
            formatCurrency(
                collectionAmount
            );

    }


    if (progressTargetEl) {

        progressTargetEl.textContent =
            formatCurrency(
                target
            );

    }


    // ------------------------------------------
    // TEACHER COUNT
    // ------------------------------------------

    if (teacherCountEl) {

        teacherCountEl.textContent =
            teacherCount +
            (
                teacherCount === 1
                    ? " Teacher"
                    : " Teachers"
            );

    }

}


// ======================================================
// SHOW ERROR
// ======================================================

function showError(
    message
) {

    console.error(
        "Region Summary Error:",
        message
    );


    if (loadingBoxEl) {

        loadingBoxEl.style.display =
            "none";

    }


    if (summaryContentEl) {

        summaryContentEl.style.display =
            "none";

    }


    if (errorBoxEl) {

        errorBoxEl.style.display =
            "block";

    }


    if (errorMessageEl) {

        errorMessageEl.textContent =
            message ||
            "Summary load nahi ho saki.";

    }

}


// ======================================================
// SHOW CONTENT
// ======================================================

function showContent() {

    if (loadingBoxEl) {

        loadingBoxEl.style.display =
            "none";

    }


    if (errorBoxEl) {

        errorBoxEl.style.display =
            "none";

    }


    if (summaryContentEl) {

        summaryContentEl.style.display =
            "block";

    }

}


// ======================================================
// SAVE REGION USER INFO
// ======================================================

function saveRegionUserInfo(
    user
) {

    if (!user) {

        return;

    }


    const name =
        getUserName(
            user
        );


    const code =
        getUserCode(
            user
        );


    const region =
        getRegionName(
            user
        );


    if (name) {

        localStorage.setItem(
            "regionUserName",
            name
        );

    }


    if (code) {

        localStorage.setItem(
            "regionUserCode",
            code
        );

    }


    if (region) {

        localStorage.setItem(
            "regionName",
            region
        );

    }

}


// ======================================================
// DISPLAY USER INFORMATION
// ======================================================

function displayUserInformation(
    user
) {

    const name =
        getUserName(
            user
        );


    const region =
        getRegionName(
            user
        );


    if (regionUserNameEl) {

        regionUserNameEl.textContent =
            name;

    }


    if (regionNameEl) {

        regionNameEl.textContent =
            region;

    }


    saveRegionUserInfo(
        user
    );

}


// ======================================================
// MAIN LOAD
// ======================================================

async function loadRegionSummary() {

    try {

        console.log(
            "Loading Region Summary..."
        );


        // ------------------------------------------
        // BASIC ROLE CHECK
        // ------------------------------------------

        const role =
            normalize(
                localStorage.getItem(
                    "userRole"
                )
            );


        if (
            role &&
            role !== "regionuser" &&
            role !== "region_user" &&
            role !== "region user"
        ) {

            // Do not redirect if role is empty.
            // This allows existing region-user login
            // implementations to work.

            console.warn(
                "Unexpected userRole:",
                role
            );

        }


        // ------------------------------------------
        // LOAD DATA
        // ------------------------------------------

        const [
            regionUsers
        ] = await Promise.all([

            loadRegionUsers(),

            loadEmployees(),

            loadDailyEntries()

        ]);


        // ------------------------------------------
        // FIND CURRENT USER
        // ------------------------------------------

        currentRegionUser =
            findCurrentRegionUser(
                regionUsers
            );


        if (!currentRegionUser) {

            throw new Error(
                "Current Region User nahi mila. Login dobara karein."
            );

        }


        console.log(
            "Current Region User:",
            currentRegionUser
        );


        // ------------------------------------------
        // USER INFORMATION
        // ------------------------------------------

        displayUserInformation(
            currentRegionUser
        );


        // ------------------------------------------
        // ASSIGNED TEACHERS
        // ------------------------------------------

        assignedEmployees =
            getAssignedEmployees(
                currentRegionUser
            );


        console.log(
            "Assigned Teachers:",
            assignedEmployees
        );


        // ------------------------------------------
        // TARGET
        // ------------------------------------------

        const target =
            getUserTarget(
                currentRegionUser
            );


        // ------------------------------------------
        // COLLECTION
        // ------------------------------------------

        const collectionAmount =
            getUserCollection();


        // ------------------------------------------
        // DISPLAY
        // ------------------------------------------

        showSummary(

            target,

            collectionAmount,

            assignedEmployees.length

        );


        // ------------------------------------------
        // SHOW PAGE
        // ------------------------------------------

        showContent();


        console.log(
            "Region Summary Loaded Successfully"
        );


    }
    catch (error) {

        console.error(
            "Region Summary Load Error:",
            error
        );


        showError(
            error.message ||
            "Region Summary load nahi ho saki."
        );

    }

}


// ======================================================
// START
// ======================================================

loadRegionSummary();
