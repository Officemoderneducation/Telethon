// ======================================================
// TELETHON ADMIN DASHBOARD
// ALL REGION USERS + TODAY / DATE COLLECTION
// 1 UNIT = ₹7,000
// ======================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// ADMIN ACCESS
// ======================================================

const userRole = String(
    localStorage.getItem("userRole") || ""
)
    .trim()
    .toLowerCase();

if (userRole !== "admin") {

    localStorage.removeItem("loggedInEmpCode");
    localStorage.removeItem("userRole");

    window.location.href = "index.html";
}


// ======================================================
// COLLECTIONS
// ======================================================

const EMPLOYEES_COLLECTION = "employees";
const DAILY_ENTRY_COLLECTION = "daily_entry";
const REGION_USERS_COLLECTION = "regionUsers";


// ======================================================
// 1 UNIT = ₹7,000
// ======================================================

const UNIT_AMOUNT = 7000;


// ======================================================
// HTML ELEMENTS - EXISTING DASHBOARD
// ======================================================

const userSummaryTableBody =
    document.getElementById(
        "userSummaryTableBody"
    );

const userSummaryTotalTarget =
    document.getElementById(
        "userSummaryTotalTarget"
    );

const userSummaryTotalCollection =
    document.getElementById(
        "userSummaryTotalCollection"
    );

const userSummaryTotalRemaining =
    document.getElementById(
        "userSummaryTotalRemaining"
    );

const userSummaryTotalPercentage =
    document.getElementById(
        "userSummaryTotalPercentage"
    );


// ======================================================
// DATA
// ======================================================

let employees = [];

let dailyEntries = [];

let regionUsers = [];

let userSummaryData = [];


// ======================================================
// TODAY COLLECTION ELEMENTS
// ======================================================

let todayCollectionDateFilter = null;
let todayCollectionTableBody = null;
let todayCollectionTotalAmount = null;
let todayCollectionTotalUnit = null;


// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


// ======================================================
// NUMBER
// ======================================================

function numberValue(value) {

    const number =
        Number(
            String(value ?? "")
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
// AMOUNT FORMAT
// ======================================================

function formatAmount(value) {

    return (
        "₹" +
        numberValue(value).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );

}


// ======================================================
// UNIT FROM AMOUNT
// ======================================================

function getUnitsFromAmount(value) {

    const amount =
        numberValue(value);

    return amount / UNIT_AMOUNT;

}


// ======================================================
// FORMAT UNIT
// ======================================================

function formatUnit(value) {

    const units =
        getUnitsFromAmount(value);

    return (
        units.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ) + " Unit"
    );

}


// ======================================================
// FORMAT UNIT NUMBER
// ======================================================

function formatUnitNumber(value) {

    const units =
        getUnitsFromAmount(value);

    return units.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );

}


// ======================================================
// UNIT TO AMOUNT
// ======================================================

function unitToAmount(units) {

    return (
        numberValue(units) *
        UNIT_AMOUNT
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// DATE - TODAY
// ======================================================

function getTodayDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// ======================================================
// NORMALIZE ENTRY DATE
// ======================================================

function normalizeEntryDate(value) {

    if (!value) {
        return "";
    }


    // Firestore Timestamp

    if (
        typeof value.toDate ===
        "function"
    ) {

        const date =
            value.toDate();

        return formatDateObject(
            date
        );

    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        const date =
            new Date(
                value.toMillis()
            );

        return formatDateObject(
            date
        );

    }


    const stringValue =
        String(value)
            .trim();


    // YYYY-MM-DD

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(stringValue)
    ) {

        return stringValue;

    }


    // DD-MM-YYYY

    const dmy =
        stringValue.match(
            /^(\d{2})-(\d{2})-(\d{4})$/
        );


    if (dmy) {

        return (
            `${dmy[3]}-${dmy[2]}-${dmy[1]}`
        );

    }


    // DD/MM/YYYY

    const slash =
        stringValue.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


    if (slash) {

        return (
            `${slash[3]}-${slash[2]}-${slash[1]}`
        );

    }


    const parsed =
        new Date(
            stringValue
        );


    if (
        !Number.isNaN(
            parsed.getTime()
        )
    ) {

        return formatDateObject(
            parsed
        );

    }


    return stringValue;

}


// ======================================================
// DATE OBJECT FORMAT
// ======================================================

function formatDateObject(date) {

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

    return `${year}-${month}-${day}`;

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

        user.teacherName ||

        user.teacher_name ||

        getUserCode(user) ||

        "Unknown User"

    ).trim();

}


// ======================================================
// USER TARGET
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
// LOAD REGION USERS
// IMPORTANT:
// ALL USERS = regionUsers
// ======================================================

async function loadRegionUsers() {

    const snapshot =
        await getDocs(
            collection(
                db,
                REGION_USERS_COLLECTION
            )
        );

    regionUsers = [];

    snapshot.forEach(
        (docSnapshot) => {

            regionUsers.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data()

            });

        }
    );

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
//
// Same employee + same date:
// only latest entry will count.
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
                normalizeEntryDate(
                    entry.date
                );


            if (
                !employeeCode ||
                !date
            ) {

                return;

            }


            const key =
                `${normalize(employeeCode)}_${date}`;


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
// CHECK EMPLOYEE ACCESS
// ======================================================

function employeeMatchesAccess(
    employee,
    user
) {

    const accessRules =
        getUserAccessRules(
            user
        );


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
// USER TEACHERS
// Used only to calculate collection belonging to user
// ======================================================

function getUserEmployees(user) {

    return employees.filter(
        (employee) => {

            return employeeMatchesAccess(
                employee,
                user
            );

        }
    );

}


// ======================================================
// USER COLLECTION FOR SELECTED DATE
// ======================================================

function getUserCollectionForDate(
    userEmployees,
    latestEntries,
    selectedDate
) {

    const employeeCodes =
        new Set();


    userEmployees.forEach(
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


    let total = 0;


    latestEntries.forEach(
        (entry) => {

            const entryDate =
                normalizeEntryDate(
                    entry.date
                );


            if (
                entryDate !==
                selectedDate
            ) {

                return;

            }


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
// BUILD USER SUMMARY
// Existing dashboard
// ======================================================

function buildUserSummary() {

    const latestEntries =
        getLatestEntries();


    userSummaryData = [];


    // IMPORTANT:
    // regionUsers ke ALL users ko add karna hai.

    regionUsers.forEach(
        (user) => {

            const userEmployees =
                getUserEmployees(
                    user
                );


            const collectionAmount =
                getUserCollectionForDate(
                    userEmployees,
                    latestEntries,
                    getTodayDate()
                );


            const target =
                getUserTarget(
                    user
                );


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


            userSummaryData.push({

                id:
                    user.id,

                userCode:
                    getUserCode(
                        user
                    ),

                userName:
                    getUserName(
                        user
                    ),

                target:
                    target,

                collection:
                    collectionAmount,

                remaining:
                    remaining,

                percentage:
                    percentage,

                teacherCount:
                    userEmployees.length,

                teachers:
                    userEmployees,

                originalUser:
                    user

            });

        }
    );

}


// ======================================================
// UPDATE SUMMARY CARDS
// Existing Dashboard
// ======================================================

function updateUserSummaryCards(list) {

    let totalTarget = 0;

    let totalCollection = 0;


    list.forEach(
        (user) => {

            totalTarget +=
                numberValue(
                    user.target
                );

            totalCollection +=
                numberValue(
                    user.collection
                );

        }
    );


    const totalRemaining =
        Math.max(
            totalTarget -
            totalCollection,
            0
        );


    const percentage =
        totalTarget > 0
            ? (
                totalCollection /
                totalTarget
            ) * 100
            : 0;


    if (userSummaryTotalTarget) {

        userSummaryTotalTarget.textContent =
            formatUnit(
                totalTarget
            );

    }


    if (userSummaryTotalCollection) {

        userSummaryTotalCollection.textContent =
            formatUnit(
                totalCollection
            );

    }


    if (userSummaryTotalRemaining) {

        userSummaryTotalRemaining.textContent =
            formatUnit(
                totalRemaining
            );

    }


    if (userSummaryTotalPercentage) {

        userSummaryTotalPercentage.textContent =
            percentage.toFixed(2) +
            "%";

    }

}


// ======================================================
// DISPLAY USER SUMMARY
// ======================================================

function displayUserSummary(list) {

    if (!userSummaryTableBody) {
        return;
    }


    if (list.length === 0) {

        userSummaryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="no-data"
                >

                    Koi Region User nahi mila.

                </td>

            </tr>

        `;


        updateUserSummaryCards(
            list
        );


        return;

    }


    let html = "";


    list.forEach(
        (user, index) => {

            const percentage =
                user.percentage;


            const progress =
                Math.min(
                    Math.max(
                        percentage,
                        0
                    ),
                    100
                );


            let percentageClass =
                "low";


            if (
                percentage >= 100
            ) {

                percentageClass =
                    "complete";

            }

            else if (
                percentage >= 75
            ) {

                percentageClass =
                    "good";

            }

            else if (
                percentage >= 50
            ) {

                percentageClass =
                    "medium";

            }


            const safeUserName =
                escapeHTML(
                    user.userName
                );


            const safeId =
                escapeHTML(
                    user.id
                );


            html += `

                <tr>

                    <td>
                        <strong>
                            ${index + 1}
                        </strong>
                    </td>


                    <td>

                        <input
                            type="text"
                            class="user-name-input"
                            data-id="${safeId}"
                            value="${safeUserName}"
                            placeholder="User Name"
                        >

                    </td>


                    <td>

                        <div
                            class="target-edit-box"
                        >

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                class="user-target-input"
                                data-id="${safeId}"
                                value="${formatUnitNumber(
                                    user.target
                                )}"
                                placeholder="Unit"
                            >

                            <span
                                class="unit-input-label"
                            >
                                Unit
                            </span>


                            <button
                                type="button"
                                class="save-user-target-btn"
                                data-id="${safeId}"
                                title="Save Target"
                            >

                                <i
                                    class="fa-solid fa-save"
                                ></i>

                            </button>

                        </div>

                    </td>


                    <td>

                        <span
                            class="
                                unit-main
                                collection-main
                            "
                        >

                            ${formatUnit(
                                user.collection
                            )}

                        </span>

                    </td>


                    <td>

                        <span
                            class="
                                unit-main
                                remaining-main
                            "
                        >

                            ${formatUnit(
                                user.remaining
                            )}

                        </span>

                    </td>


                    <td>

                        <div
                            class="percentage-wrapper"
                        >

                            <div
                                class="
                                    percentage-badge
                                    ${percentageClass}
                                "
                            >

                                ${percentage.toFixed(2)}%

                            </div>


                            <div
                                class="
                                    user-progress-container
                                "
                            >

                                <div
                                    class="
                                        user-progress-bar
                                        ${percentageClass}
                                    "
                                    style="
                                        width:${progress}%;
                                    "
                                ></div>

                            </div>

                        </div>

                    </td>

                </tr>

            `;

        }
    );


    userSummaryTableBody.innerHTML =
        html;


    updateUserSummaryCards(
        list
    );


    // ==================================================
    // SAVE TARGET
    // ==================================================

    document
        .querySelectorAll(
            ".save-user-target-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async function () {

                        const userId =
                            this.dataset.id;


                        const input =
                            document.querySelector(
                                `.user-target-input[data-id="${CSS.escape(userId)}"]`
                            );


                        if (!input) {
                            return;
                        }


                        const targetUnits =
                            numberValue(
                                input.value
                            );


                        if (
                            targetUnits < 0
                        ) {

                            alert(
                                "Target Unit 0 se kam nahi ho sakta."
                            );

                            return;

                        }


                        const targetAmount =
                            unitToAmount(
                                targetUnits
                            );


                        const user =
                            userSummaryData.find(
                                item =>
                                    item.id ===
                                    userId
                            );


                        if (!user) {
                            return;
                        }


                        const oldHTML =
                            this.innerHTML;


                        this.disabled =
                            true;


                        this.innerHTML = `

                            <i
                                class="
                                    fa-solid
                                    fa-spinner
                                    fa-spin
                                "
                            ></i>

                        `;


                        try {

                            await setDoc(

                                doc(
                                    db,
                                    REGION_USERS_COLLECTION,
                                    userId
                                ),

                                {

                                    target:
                                        targetAmount,

                                    targetAmount:
                                        targetAmount,

                                    manualTarget:
                                        targetAmount,

                                    updatedAt:
                                        serverTimestamp()

                                },

                                {
                                    merge: true
                                }

                            );


                            user.target =
                                targetAmount;


                            user.remaining =
                                Math.max(
                                    targetAmount -
                                    user.collection,
                                    0
                                );


                            user.percentage =
                                targetAmount > 0
                                    ? (
                                        user.collection /
                                        targetAmount
                                    ) * 100
                                    : 0;


                            displayUserSummary(
                                userSummaryData
                            );

                        }

                        catch (error) {

                            console.error(
                                "Target Save Error:",
                                error
                            );


                            alert(
                                "Target save nahi hua:\n" +
                                error.message
                            );

                        }

                        finally {

                            this.disabled =
                                false;

                            this.innerHTML =
                                oldHTML;

                        }

                    }
                );

            }
        );


    // ==================================================
    // SAVE USER NAME
    // ==================================================

    document
        .querySelectorAll(
            ".user-name-input"
        )
        .forEach(
            (input) => {

                input.addEventListener(
                    "change",
                    async function () {

                        const userId =
                            this.dataset.id;


                        const newName =
                            this.value.trim();


                        if (!newName) {

                            alert(
                                "User Name enter karein."
                            );

                            return;

                        }


                        const user =
                            userSummaryData.find(
                                item =>
                                    item.id ===
                                    userId
                            );


                        if (!user) {
                            return;
                        }


                        try {

                            await setDoc(

                                doc(
                                    db,
                                    REGION_USERS_COLLECTION,
                                    userId
                                ),

                                {

                                    userName:
                                        newName,

                                    name:
                                        newName,

                                    updatedAt:
                                        serverTimestamp()

                                },

                                {
                                    merge: true
                                }

                            );


                            user.userName =
                                newName;

                        }

                        catch (error) {

                            console.error(
                                "User Name Save Error:",
                                error
                            );


                            alert(
                                "User Name save nahi hua:\n" +
                                error.message
                            );

                        }

                    }
                );

            }
        );

}


// ======================================================
// CREATE TODAY COLLECTION SECTION
//
// Agar HTML mein already section hai,
// to usi ko use karega.
//
// Agar IDs nahi hain,
// to section automatically create karega.
// ======================================================

function setupTodayCollectionSection() {

    todayCollectionDateFilter =
        document.getElementById(
            "todayCollectionDateFilter"
        );


    todayCollectionTableBody =
        document.getElementById(
            "todayCollectionTableBody"
        );


    todayCollectionTotalAmount =
        document.getElementById(
            "todayCollectionTotalAmount"
        );


    todayCollectionTotalUnit =
        document.getElementById(
            "todayCollectionTotalUnit"
        );


    // ==================================================
    // EXISTING HTML SECTION
    // ==================================================

    if (
        todayCollectionDateFilter &&
        todayCollectionTableBody
    ) {

        if (
            !todayCollectionDateFilter.value
        ) {

            todayCollectionDateFilter.value =
                getTodayDate();

        }


        todayCollectionDateFilter.addEventListener(
            "change",
            function () {

                displayTodayCollection(
                    this.value
                );

            }
        );


        return;

    }


    // ==================================================
    // AUTO CREATE SECTION
    // ==================================================

    const captureArea =
        document.getElementById(
            "dashboardCaptureArea"
        );


    if (!captureArea) {
        return;
    }


    const containers =
        captureArea.querySelectorAll(
            ".user-summary-container"
        );


    const insertAfter =
        containers.length
            ? containers[
                containers.length - 1
            ]
            : null;


    const section =
        document.createElement(
            "div"
        );


    section.className =
        "user-summary-container today-collection-container";


    section.innerHTML = `

        <div
            class="section-header"
        >

            <div>

                <h3>

                    <i
                        class="
                            fa-solid
                            fa-calendar-day
                        "
                    ></i>

                    Today Collection

                </h3>

                <p>
                    Date-wise collection of all users
                </p>

            </div>


            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                    flex-wrap:wrap;
                "
            >

                <label
                    style="
                        font-size:13px;
                        font-weight:700;
                        color:#5d687b;
                    "
                >
                    Date
                </label>


                <input
                    type="date"
                    id="todayCollectionDateFilter"
                    value="${getTodayDate()}"
                    style="
                        height:42px;
                        border:1px solid #d6deea;
                        border-radius:9px;
                        padding:0 10px;
                        outline:none;
                        font-size:13px;
                        font-weight:600;
                    "
                >

            </div>

        </div>


        <div
            style="
                padding:18px 22px 5px;
            "
        >

            <div
                style="
                    display:flex;
                    gap:15px;
                    flex-wrap:wrap;
                "
            >

                <div
                    style="
                        background:#dcfce7;
                        border:1px solid #bbf7d0;
                        border-radius:12px;
                        padding:14px 18px;
                        min-width:220px;
                    "
                >

                    <div
                        style="
                            color:#166534;
                            font-size:12px;
                            font-weight:700;
                            margin-bottom:5px;
                        "
                    >
                        Total Amount
                    </div>


                    <strong
                        id="todayCollectionTotalAmount"
                        style="
                            color:#15803d;
                            font-size:22px;
                        "
                    >
                        ₹0
                    </strong>

                </div>


                <div
                    style="
                        background:#e0e7ff;
                        border:1px solid #c7d2fe;
                        border-radius:12px;
                        padding:14px 18px;
                        min-width:180px;
                    "
                >

                    <div
                        style="
                            color:#3730a3;
                            font-size:12px;
                            font-weight:700;
                            margin-bottom:5px;
                        "
                    >
                        Total Unit
                    </div>


                    <strong
                        id="todayCollectionTotalUnit"
                        style="
                            color:#4338ca;
                            font-size:22px;
                        "
                    >
                        0 Unit
                    </strong>

                </div>

            </div>

        </div>


        <div
            class="user-summary-table-wrapper"
        >

            <table
                class="user-summary-table"
            >

                <thead>

                    <tr>

                        <th>#</th>

                        <th>User</th>

                        <th>
                            Collection
                        </th>

                    </tr>

                </thead>


                <tbody
                    id="todayCollectionTableBody"
                >

                    <tr>

                        <td
                            colspan="3"
                            class="no-data"
                        >
                            Loading...
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    `;


    if (insertAfter) {

        insertAfter.after(
            section
        );

    }

    else {

        captureArea.appendChild(
            section
        );

    }


    todayCollectionDateFilter =
        document.getElementById(
            "todayCollectionDateFilter"
        );


    todayCollectionTableBody =
        document.getElementById(
            "todayCollectionTableBody"
        );


    todayCollectionTotalAmount =
        document.getElementById(
            "todayCollectionTotalAmount"
        );


    todayCollectionTotalUnit =
        document.getElementById(
            "todayCollectionTotalUnit"
        );


    if (
        todayCollectionDateFilter
    ) {

        todayCollectionDateFilter.addEventListener(
            "change",
            function () {

                displayTodayCollection(
                    this.value
                );

            }
        );

    }

}


// ======================================================
// DISPLAY TODAY / SELECTED DATE COLLECTION
//
// IMPORTANT:
// ALL USERS = regionUsers
//
// No collection = ₹0
// ======================================================

function displayTodayCollection(
    selectedDate
) {

    if (
        !todayCollectionTableBody
    ) {

        return;

    }


    const date =
        selectedDate ||
        getTodayDate();


    const latestEntries =
        getLatestEntries();


    let totalAmount = 0;


    let html = "";


    // ==================================================
    // ALL regionUsers
    // ==================================================

    regionUsers.forEach(
        (user, index) => {

            const userEmployees =
                getUserEmployees(
                    user
                );


            const amount =
                getUserCollectionForDate(
                    userEmployees,
                    latestEntries,
                    date
                );


            totalAmount +=
                amount;


            const safeName =
                escapeHTML(
                    getUserName(
                        user
                    )
                );


            html += `

                <tr>

                    <td>

                        <strong>
                            ${index + 1}
                        </strong>

                    </td>


                    <td>

                        <strong
                            style="
                                color:#172033;
                            "
                        >
                            ${safeName}
                        </strong>

                    </td>


                    <td>

                        <span
                            style="
                                display:inline-block;
                                font-size:14px;
                                font-weight:700;
                                color:${
                                    amount > 0
                                        ? "#16a34a"
                                        : "#64748b"
                                };
                            "
                        >

                            ${formatAmount(
                                amount
                            )}

                        </span>

                    </td>

                </tr>

            `;

        }
    );


    // ==================================================
    // NO USERS
    // ==================================================

    if (
        regionUsers.length === 0
    ) {

        html = `

            <tr>

                <td
                    colspan="3"
                    class="no-data"
                >

                    Koi User nahi mila.

                </td>

            </tr>

        `;

    }


    todayCollectionTableBody.innerHTML =
        html;


    // ==================================================
    // TOTAL AMOUNT
    //
    // Yehi selected date ke ALL USERS
    // ke displayed amount ka total hai.
    // ==================================================

    if (
        todayCollectionTotalAmount
    ) {

        todayCollectionTotalAmount.textContent =
            formatAmount(
                totalAmount
            );

    }


    // ==================================================
    // TOTAL UNIT
    // ==================================================

    if (
        todayCollectionTotalUnit
    ) {

        todayCollectionTotalUnit.textContent =
            getUnitsFromAmount(
                totalAmount
            ).toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            ) + " Unit";

    }


    console.log(
        "Today Collection:",
        date,
        "Total:",
        totalAmount
    );

}


// ======================================================
// LOGOUT
// ======================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


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


// ======================================================
// DOWNLOAD DASHBOARD DATA AS IMAGE
// ======================================================

const downloadDashboardImageBtn =
    document.getElementById(
        "downloadDashboardImageBtn"
    );


if (downloadDashboardImageBtn) {

    downloadDashboardImageBtn.addEventListener(
        "click",
        async function () {

            const dashboard =
                document.getElementById(
                    "dashboardCaptureArea"
                );


            if (!dashboard) {

                alert(
                    "Dashboard data area nahi mila."
                );

                return;

            }


            if (
                typeof html2canvas ===
                "undefined"
            ) {

                alert(
                    "Image download library load nahi hui. Page refresh karke dobara try karein."
                );

                return;

            }


            const oldHTML =
                this.innerHTML;


            this.disabled =
                true;


            this.innerHTML = `

                <i
                    class="
                        fa-solid
                        fa-spinner
                        fa-spin
                    "
                ></i>

                Preparing Image...

            `;


            try {

                await new Promise(
                    function (resolve) {

                        setTimeout(
                            resolve,
                            500
                        );

                    }
                );


                const canvas =
                    await html2canvas(
                        dashboard,
                        {

                            scale: 2,

                            useCORS: true,

                            allowTaint: true,

                            backgroundColor:
                                "#f4f7fb",

                            logging: false,

                            imageTimeout:
                                15000,

                            scrollX: 0,

                            scrollY: 0,

                            windowWidth:
                                Math.max(
                                    document.documentElement
                                        .scrollWidth,
                                    dashboard
                                        .scrollWidth
                                ),

                            windowHeight:
                                Math.max(
                                    document.documentElement
                                        .scrollHeight,
                                    dashboard
                                        .scrollHeight
                                ),

                            onclone:
                                function (
                                    clonedDocument
                                ) {

                                    const clonedButton =
                                        clonedDocument
                                            .getElementById(
                                                "downloadDashboardImageBtn"
                                            );


                                    if (
                                        clonedButton
                                    ) {

                                        clonedButton.style.display =
                                            "none";

                                    }

                                }

                        }
                    );


                const image =
                    canvas.toDataURL(
                        "image/png",
                        1.0
                    );


                const today =
                    new Date();


                const year =
                    today.getFullYear();


                const month =
                    String(
                        today.getMonth() + 1
                    ).padStart(
                        2,
                        "0"
                    );


                const day =
                    String(
                        today.getDate()
                    ).padStart(
                        2,
                        "0"
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                link.download =
                    `Telethon-Dashboard-${year}-${month}-${day}.png`;


                link.href =
                    image;


                document.body.appendChild(
                    link
                );


                link.click();


                document.body.removeChild(
                    link
                );


                console.log(
                    "Dashboard image downloaded successfully."
                );

            }

            catch (error) {

                console.error(
                    "Dashboard Image Download Error:",
                    error
                );


                alert(
                    "Dashboard image download nahi hui.\n\n" +
                    error.message
                );

            }

            finally {

                this.disabled =
                    false;


                this.innerHTML =
                    oldHTML;

            }

        }
    );

}


// ======================================================
// MAIN DASHBOARD
// ======================================================

async function loadDashboard() {

    try {

        if (userSummaryTableBody) {

            userSummaryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="no-data"
                    >

                        <i
                            class="
                                fa-solid
                                fa-spinner
                                fa-spin
                            "
                        ></i>

                        Loading User Summary...

                    </td>

                </tr>

            `;

        }


        // ==================================================
        // LOAD ALL DATA
        // ==================================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadRegionUsers()

        ]);


        // ==================================================
        // EXISTING DASHBOARD
        // ==================================================

        buildUserSummary();


        displayUserSummary(
            userSummaryData
        );


        // ==================================================
        // TODAY COLLECTION
        // ==================================================

        setupTodayCollectionSection();


        displayTodayCollection(
            getTodayDate()
        );


        console.log(
            "Dashboard Loaded Successfully"
        );


        console.log(
            "Total Region Users:",
            regionUsers.length
        );

    }

    catch (error) {

        console.error(
            "Dashboard Load Error:",
            error
        );


        if (userSummaryTableBody) {

            userSummaryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            padding:30px;
                            color:#dc2626;
                        "
                    >

                        Dashboard data load nahi hua.

                        <br><br>

                        ${escapeHTML(
                            error.message
                        )}

                    </td>

                </tr>

            `;

        }

    }

}


// ======================================================
// START
// ======================================================

loadDashboard();
