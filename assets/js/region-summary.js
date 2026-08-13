// ======================================================
// TELETHON - REGION USER SUMMARY
// ======================================================
// Shows ONLY the logged-in Region User's:
// Target
// Total Collection
// Remaining Target
// Percentage
// Assigned Teachers
//
// 1 UNIT = ₹7,000
// ======================================================


import { db } from "./firebase-config.js";


import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// COLLECTIONS
// ======================================================

const EMPLOYEES_COLLECTION =
    "employees";

const DAILY_ENTRY_COLLECTION =
    "daily_entry";

const REGION_USERS_COLLECTION =
    "regionUsers";


// ======================================================
// UNIT AMOUNT
// ======================================================

const UNIT_AMOUNT =
    7000;


// ======================================================
// LOGIN INFORMATION
// ======================================================

const loggedInEmpCode =
    String(
        localStorage.getItem(
            "loggedInEmpCode"
        ) || ""
    ).trim();


const userRole =
    String(
        localStorage.getItem(
            "userRole"
        ) || ""
    )
        .trim()
        .toLowerCase();


// ======================================================
// PAGE PROTECTION
// ======================================================
//
// Region Summary sirf Region User ke liye.
// Admin ya Teacher ko ye page access nahi milega.
// ======================================================

if (
    !loggedInEmpCode ||
    userRole !== "regionuser"
) {

    localStorage.removeItem(
        "loggedInEmpCode"
    );

    localStorage.removeItem(
        "userRole"
    );

    window.location.replace(
        "index.html"
    );

}


// ======================================================
// HTML ELEMENTS
// ======================================================

const loadingBox =
    document.getElementById(
        "loadingBox"
    );


const summaryContent =
    document.getElementById(
        "summaryContent"
    );


const errorBox =
    document.getElementById(
        "errorBox"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const regionUserName =
    document.getElementById(
        "regionUserName"
    );


const regionName =
    document.getElementById(
        "regionName"
    );


const targetAmount =
    document.getElementById(
        "targetAmount"
    );


const targetUnits =
    document.getElementById(
        "targetUnits"
    );


const collectionAmount =
    document.getElementById(
        "collectionAmount"
    );


const collectionUnits =
    document.getElementById(
        "collectionUnits"
    );


const remainingAmount =
    document.getElementById(
        "remainingAmount"
    );


const remainingUnits =
    document.getElementById(
        "remainingUnits"
    );


const percentage =
    document.getElementById(
        "percentage"
    );


const progressPercentage =
    document.getElementById(
        "progressPercentage"
    );


const progressBar =
    document.getElementById(
        "progressBar"
    );


const progressCollection =
    document.getElementById(
        "progressCollection"
    );


const progressTarget =
    document.getElementById(
        "progressTarget"
    );


const teacherCount =
    document.getElementById(
        "teacherCount"
    );


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

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


// ======================================================
// NUMBER
// ======================================================

function numberValue(value) {

    const number =
        Number(
            String(
                value ?? ""
            )
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
// CURRENCY
// ======================================================

function formatCurrency(value) {

    return (
        "₹ " +
        numberValue(value)
            .toLocaleString(
                "en-IN"
            )
    );

}


// ======================================================
// UNIT
// ======================================================

function formatUnit(value) {

    const amount =
        numberValue(value);


    const units =
        amount /
        UNIT_AMOUNT;


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
// EMPLOYEE CODE
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
// ENTRY EMPLOYEE CODE
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
// ENTRY AMOUNT
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
// EMPLOYEE REGION
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
// EMPLOYEE STATE
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
// USER CODE
// ======================================================

function getUserCode(user) {

    return String(

        user.userCode ||

        user.user_code ||

        user.employeeCode ||

        user.employee_code ||

        user.empCode ||

        user.emp_code ||

        user.loginId ||

        user.loginID ||

        user.username ||

        user.id ||

        ""

    ).trim();

}


// ======================================================
// USER NAME
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
// USER TARGET
// ======================================================
//
// Admin Dashboard me target save karte waqt:
// target
// targetAmount
// manualTarget
//
// tino fields save ho rahe hain.
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
        (docSnapshot) => {

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
//
// Login ID / Employee Code ke through
// sirf current user ko find karega.
// ======================================================

function findCurrentRegionUser(
    users
) {

    const loginCode =
        normalize(
            loggedInEmpCode
        );


    if (!loginCode) {
        return null;
    }


    return (
        users.find(
            (user) => {

                const code =
                    normalize(
                        getUserCode(
                            user
                        )
                    );


                return (
                    code ===
                    loginCode
                );

            }
        ) || null
    );

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
        (docSnapshot) => {

            employees.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data()

            });

        }
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
            (docSnapshot) => {

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
            "createdAt orderBy failed. Loading without orderBy.",
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
            (docSnapshot) => {

                dailyEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );

    }

}


// ======================================================
// CREATED TIME
// ======================================================

function getCreatedTime(entry) {

    if (!entry.createdAt) {

        return 0;

    }


    if (
        typeof entry.createdAt.toMillis ===
        "function"
    ) {

        return entry.createdAt.toMillis();

    }


    if (entry.createdAt.seconds) {

        return (
            Number(
                entry.createdAt.seconds
            ) * 1000
        );

    }


    const date =
        new Date(
            entry.createdAt
        );


    const time =
        date.getTime();


    return Number.isFinite(time)
        ? time
        : 0;

}


// ======================================================
// LATEST ENTRY PER EMPLOYEE + DATE
// ======================================================
//
// Agar ek Employee Code ne same date par
// multiple entries ki hain,
// sirf LAST entry count hogi.
// ======================================================

function getLatestEntries() {

    const latestMap =
        new Map();


    dailyEntries.forEach(
        (entry) => {

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
                latestMap.get(
                    key
                );


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
// ACCESS RULES
// ======================================================

function getUserAccessRules(user) {

    if (
        Array.isArray(
            user.access
        )
    ) {

        return user.access;

    }


    if (
        Array.isArray(
            user.accessRules
        )
    ) {

        return user.accessRules;

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
// RULE REGION
// ======================================================

function getRuleRegion(rule) {

    return normalize(

        rule.region ||

        rule.assignedRegion ||

        rule.regionName ||

        rule.region_name ||

        ""

    );

}


// ======================================================
// RULE STATES
// ======================================================

function getRuleStates(rule) {

    if (
        Array.isArray(
            rule.states
        )
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
// EMPLOYEE ACCESS CHECK
// ======================================================

function employeeMatchesAccess(
    employee,
    user
) {

    const accessRules =
        getUserAccessRules(
            user
        );


    /* ==========================================
       OLD / SIMPLE REGION USER DATA
       ========================================== */

    const directRegion =
        normalize(
            user.region ||
            user.assignedRegion ||
            user.regionName ||
            ""
        );


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


    /*
     * Agar regionUsers document me
     * direct region saved hai aur access array
     * nahi hai, to direct region se match karega.
     */

    if (
        accessRules.length === 0 &&
        directRegion
    ) {

        if (
            directRegion ===
            employeeRegion
        ) {

            return true;

        }


        return false;

    }


    if (
        accessRules.length === 0
    ) {

        return false;

    }


    return accessRules.some(
        (rule) => {

            if (!rule) {

                return false;

            }


            const assignedRegion =
                getRuleRegion(
                    rule
                );


            if (
                assignedRegion &&
                assignedRegion !==
                employeeRegion
            ) {

                return false;

            }


            if (
                isFullRegionRule(
                    rule
                )
            ) {

                return true;

            }


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
                (state) => {

                    const normalizedState =
                        normalize(
                            state
                        );


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

        }
    );

}


// ======================================================
// GET ASSIGNED EMPLOYEES
// ======================================================

function getAssignedEmployees() {

    if (
        !currentRegionUser
    ) {

        return [];

    }


    return employees.filter(
        (employee) => {

            return employeeMatchesAccess(
                employee,
                currentRegionUser
            );

        }
    );

}


// ======================================================
// CALCULATE COLLECTION
// ======================================================

function calculateCollection(
    assignedTeacherList
) {

    const latestEntries =
        getLatestEntries();


    const employeeCodes =
        new Set();


    assignedTeacherList.forEach(
        (employee) => {

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


    let total =
        0;


    latestEntries.forEach(
        (entry) => {

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

                total +=
                    getEntryAmount(
                        entry
                    );

            }

        }
    );


    return total;

}


// ======================================================
// DISPLAY USER INFORMATION
// ======================================================

function displayUserInfo() {

    if (
        !currentRegionUser
    ) {

        return;

    }


    const userName =
        getUserName(
            currentRegionUser
        );


    const region =
        currentRegionUser.region ||

        currentRegionUser.assignedRegion ||

        currentRegionUser.regionName ||

        "Assigned Region";


    if (regionUserName) {

        regionUserName.textContent =
            userName;

    }


    if (regionName) {

        regionName.textContent =
            region;

    }

}


// ======================================================
// DISPLAY SUMMARY
// ======================================================

function displaySummary() {

    if (
        !currentRegionUser
    ) {

        throw new Error(
            "Region User account nahi mila."
        );

    }


    assignedEmployees =
        getAssignedEmployees();


    const target =
        getUserTarget(
            currentRegionUser
        );


    const collection =
        calculateCollection(
            assignedEmployees
        );


    const remaining =
        Math.max(
            target -
            collection,
            0
        );


    const percent =
        target > 0
            ? (
                collection /
                target
            ) * 100
            : 0;


    const progress =
        Math.min(
            Math.max(
                percent,
                0
            ),
            100
        );


    // ==========================================
    // USER INFO
    // ==========================================

    displayUserInfo();


    // ==========================================
    // TARGET
    // ==========================================

    if (targetAmount) {

        targetAmount.textContent =
            formatCurrency(
                target
            );

    }


    if (targetUnits) {

        targetUnits.textContent =
            formatUnit(
                target
            );

    }


    // ==========================================
    // COLLECTION
    // ==========================================

    if (collectionAmount) {

        collectionAmount.textContent =
            formatCurrency(
                collection
            );

    }


    if (collectionUnits) {

        collectionUnits.textContent =
            formatUnit(
                collection
            );

    }


    // ==========================================
    // REMAINING
    // ==========================================

    if (remainingAmount) {

        remainingAmount.textContent =
            formatCurrency(
                remaining
            );

    }


    if (remainingUnits) {

        remainingUnits.textContent =
            formatUnit(
                remaining
            );

    }


    // ==========================================
    // PERCENTAGE
    // ==========================================

    if (percentage) {

        percentage.textContent =
            percent.toFixed(2) +
            "%";

    }


    if (progressPercentage) {

        progressPercentage.textContent =
            percent.toFixed(2) +
            "%";

    }


    // ==========================================
    // PROGRESS BAR
    // ==========================================

    if (progressBar) {

        progressBar.style.width =
            progress +
            "%";

    }


    // ==========================================
    // PROGRESS INFO
    // ==========================================

    if (progressCollection) {

        progressCollection.textContent =
            formatCurrency(
                collection
            );

    }


    if (progressTarget) {

        progressTarget.textContent =
            formatCurrency(
                target
            );

    }


    // ==========================================
    // TEACHER COUNT
    // ==========================================

    if (teacherCount) {

        teacherCount.textContent =
            assignedEmployees.length +
            (
                assignedEmployees.length === 1
                    ? " Teacher"
                    : " Teachers"
            );

    }


    console.log(
        "Region User:",
        currentRegionUser
    );


    console.log(
        "Assigned Teachers:",
        assignedEmployees
    );


    console.log(
        "Target:",
        target
    );


    console.log(
        "Collection:",
        collection
    );


    console.log(
        "Remaining:",
        remaining
    );


    console.log(
        "Percentage:",
        percent
    );

}


// ======================================================
// SHOW ERROR
// ======================================================

function showError(error) {

    console.error(
        "Region Summary Error:",
        error
    );


    if (loadingBox) {

        loadingBox.style.display =
            "none";

    }


    if (summaryContent) {

        summaryContent.style.display =
            "none";

    }


    if (errorBox) {

        errorBox.style.display =
            "block";

    }


    if (errorMessage) {

        errorMessage.innerHTML =

            "Region Summary load nahi ho saki." +

            "<br><br>" +

            String(
                error.message ||
                error
            );

    }

}


// ======================================================
// LOAD SUMMARY
// ======================================================

async function loadRegionSummary() {

    try {

        // ==========================================
        // LOGIN CHECK
        // ==========================================

        if (
            !loggedInEmpCode ||
            userRole !== "regionuser"
        ) {

            throw new Error(
                "Region User login required."
            );

        }


        // ==========================================
        // LOAD ALL REQUIRED DATA
        // ==========================================

        const [
            regionUsers
        ] =
            await Promise.all([

                loadRegionUsers()

            ]);


        // ==========================================
        // FIND CURRENT USER
        // ==========================================

        currentRegionUser =
            findCurrentRegionUser(
                regionUsers
            );


        if (
            !currentRegionUser
        ) {

            throw new Error(
                "Aapka Region User account Firebase me nahi mila."
            );

        }


        // ==========================================
        // LOAD TEACHERS + ENTRIES
        // ==========================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries()

        ]);


        // ==========================================
        // DISPLAY
        // ==========================================

        displaySummary();


        // ==========================================
        // HIDE LOADING
        // ==========================================

        if (loadingBox) {

            loadingBox.style.display =
                "none";

        }


        if (summaryContent) {

            summaryContent.style.display =
                "block";

        }


    }

    catch (error) {

        showError(
            error
        );

    }

}


// ======================================================
// LOGOUT
// ======================================================

document.addEventListener(
    "click",
    function (event) {

        const logoutBtn =
            event.target.closest(
                "#regionLogoutBtn, #logoutBtn"
            );


        if (!logoutBtn) {

            return;

        }


        event.preventDefault();


        localStorage.removeItem(
            "loggedInEmpCode"
        );


        localStorage.removeItem(
            "userRole"
        );


        window.location.replace(
            "index.html"
        );

    }
);


// ======================================================
// START
// ======================================================

loadRegionSummary();
