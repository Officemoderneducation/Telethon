// ======================================================
// TELETHON ADMIN DASHBOARD
// REGION USERS + TEACHER COLLECTION
// 1 UNIT = ₹7,000
//
// DATA SOURCE:
// daily_entry      = OLD ENTRIES
// teacher_entries  = NEW / REGION USER ENTRIES
//
// IMPORTANT:
// Both collections are READ ONLY.
// Both collections are merged.
// Same Teacher + Same Date = SUM
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
).trim().toLowerCase();

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
const TEACHER_ENTRIES_COLLECTION = "teacher_entries";
const REGION_USERS_COLLECTION = "regionUsers";

// ======================================================
// 1 UNIT = ₹7,000
// ======================================================

const UNIT_AMOUNT = 7000;

// ======================================================
// HTML ELEMENTS
// ======================================================

const userSummaryTableBody =
    document.getElementById("userSummaryTableBody");

const userSummaryTotalTarget =
    document.getElementById("userSummaryTotalTarget");

const userSummaryTotalCollection =
    document.getElementById("userSummaryTotalCollection");

const userSummaryTotalRemaining =
    document.getElementById("userSummaryTotalRemaining");

const userSummaryTotalPercentage =
    document.getElementById("userSummaryTotalPercentage");

const todayCollectionTableBody =
    document.getElementById("todayCollectionTableBody");

const todayCollectionDateFilter =
    document.getElementById("todayCollectionDateFilter");

const downloadDashboardImageBtn =
    document.getElementById("downloadDashboardImageBtn");

const downloadTodayCollectionImageBtn =
    document.getElementById("downloadTodayCollectionImageBtn");

// ======================================================
// DATA
// ======================================================

let employees = [];
let dailyEntries = [];
let teacherEntries = [];
let regionUsers = [];
let userSummaryData = [];

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

    if (typeof value === "number") {

        return Number.isFinite(value)
            ? value
            : 0;

    }

    const number = Number(
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
// UNIT FROM AMOUNT
// ======================================================

function getUnitsFromAmount(value) {

    return numberValue(value) / UNIT_AMOUNT;

}

// ======================================================
// FORMAT UNIT
// ======================================================

function formatUnit(value) {

    const units = getUnitsFromAmount(value);

    return (
        units.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }) + " Unit"
    );

}

// ======================================================
// FORMAT UNIT NUMBER
// ======================================================

function formatUnitNumber(value) {

    const units = getUnitsFromAmount(value);

    return units.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

}

// ======================================================
// FORMAT RUPEES
// ======================================================

function formatAmount(value) {

    return (
        "₹" +
        numberValue(value).toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })
    );

}

// ======================================================
// UNIT TO AMOUNT
// ======================================================

function unitToAmount(units) {

    return numberValue(units) * UNIT_AMOUNT;

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

        employee.teacherCode ||

        employee.teacher_code ||

        employee.emp_id ||

        employee.empId ||

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

        entry.teacherCode ||

        entry.teacher_code ||

        entry.emp_id ||

        entry.empId ||

        entry.teacherId ||

        entry.teacher_id ||

        entry.staffCode ||

        entry.staff_code ||

        ""

    ).trim();

}

// ======================================================
// ENTRY AMOUNT
// ======================================================

function getEntryAmount(entry) {

    const possibleValues = [

        entry.amount,
        entry.collection,
        entry.collectionAmount,
        entry.totalCollection,
        entry.total_collection,
        entry.collection_amount,
        entry.amountCollected,
        entry.amount_collected

    ];

    for (const value of possibleValues) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            return numberValue(value);

        }

    }

    return 0;

}

// ======================================================
// DATE NORMALIZATION
// ======================================================

function normalizeDateValue(value) {

    if (!value) {
        return "";
    }

    // Firestore Timestamp
    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        const date = value.toDate();

        return localDateString(date);

    }

    // Firestore timestamp object
    if (
        typeof value === "object" &&
        value.seconds
    ) {

        const date =
            new Date(
                Number(value.seconds) * 1000
            );

        return localDateString(date);

    }

    const raw =
        String(value).trim();

    if (!raw) {
        return "";
    }

    // YYYY-MM-DD
    let match =
        raw.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
        );

    if (match) {

        return (
            match[1] +
            "-" +
            String(match[2]).padStart(2, "0") +
            "-" +
            String(match[3]).padStart(2, "0")
        );

    }

    // DD-MM-YYYY / DD/MM/YYYY
    match =
        raw.match(
            /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
        );

    if (match) {

        return (
            match[3] +
            "-" +
            String(match[2]).padStart(2, "0") +
            "-" +
            String(match[1]).padStart(2, "0")
        );

    }

    const parsed =
        new Date(raw);

    if (
        Number.isFinite(
            parsed.getTime()
        )
    ) {

        return localDateString(parsed);

    }

    return raw;

}

// ======================================================
// LOCAL DATE STRING
// ======================================================

function localDateString(date) {

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

// ======================================================
// ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    const possibleDates = [

        entry.date,
        entry.entryDate,
        entry.entry_date,
        entry.collectionDate,
        entry.collection_date,
        entry.dateValue,
        entry.collection_date_value

    ];

    for (const value of possibleDates) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return normalizeDateValue(value);

        }

    }

    return "";

}

// ======================================================
// EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

    return String(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        employee.assignedRegion ||

        employee.assigned_region ||

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
// OLD COLLECTION
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

                    ...docSnapshot.data(),

                    source:
                        "daily_entry"

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "daily_entry orderBy failed:",
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

                    ...docSnapshot.data(),

                    source:
                        "daily_entry"

                });

            }
        );

    }

}

// ======================================================
// LOAD TEACHER ENTRIES
// NEW COLLECTION
// ======================================================

async function loadTeacherEntries() {

    try {

        const entriesQuery =
            query(
                collection(
                    db,
                    TEACHER_ENTRIES_COLLECTION
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

        teacherEntries = [];

        snapshot.forEach(
            (docSnapshot) => {

                teacherEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data(),

                    source:
                        "teacher_entries"

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "teacher_entries orderBy failed:",
            error
        );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    TEACHER_ENTRIES_COLLECTION
                )
            );

        teacherEntries = [];

        snapshot.forEach(
            (docSnapshot) => {

                teacherEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data(),

                    source:
                        "teacher_entries"

                });

            }
        );

    }

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

    if (
        entry.createdAt.seconds !== undefined
    ) {

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
// MERGE ENTRIES
//
// IMPORTANT:
// daily_entry + teacher_entries
//
// Same Teacher + Same Date = SUM
// ======================================================

function getLatestEntries() {

    const mergedMap =
        new Map();

    const allEntries = [

        ...dailyEntries,

        ...teacherEntries

    ];

    allEntries.forEach(
        (entry) => {

            const employeeCode =
                getEntryEmployeeCode(
                    entry
                );

            const date =
                getEntryDate(
                    entry
                );

            if (
                !employeeCode ||
                !date
            ) {

                return;

            }

            const normalizedCode =
                normalize(
                    employeeCode
                );

            const normalizedDate =
                normalizeDateValue(
                    date
                );

            const key =
                `${normalizedCode}_${normalizedDate}`;

            const amount =
                getEntryAmount(
                    entry
                );

            if (
                !mergedMap.has(key)
            ) {

                mergedMap.set(
                    key,
                    {

                        ...entry,

                        employeeCode:
                            employeeCode,

                        date:
                            normalizedDate,

                        amount:
                            amount,

                        collection:
                            amount,

                        sources:
                            entry.source
                                ? [entry.source]
                                : [],

                        entryIds:
                            entry.id
                                ? [entry.id]
                                : []

                    }
                );

                return;

            }

            const existing =
                mergedMap.get(key);

            // =========================================
            // SUM BOTH COLLECTIONS
            // =========================================

            existing.amount =
                numberValue(
                    existing.amount
                ) +
                amount;

            existing.collection =
                existing.amount;

            // =========================================
            // SOURCE TRACK
            // =========================================

            if (
                entry.source &&
                !existing.sources.includes(
                    entry.source
                )
            ) {

                existing.sources.push(
                    entry.source
                );

            }

            // =========================================
            // DOCUMENT ID TRACK
            // =========================================

            if (
                entry.id &&
                !existing.entryIds.includes(
                    entry.id
                )
            ) {

                existing.entryIds.push(
                    entry.id
                );

            }

            // =========================================
            // KEEP LATEST NON-DATA INFORMATION
            // =========================================

            const existingTime =
                getCreatedTime(
                    existing
                );

            const currentTime =
                getCreatedTime(
                    entry
                );

            if (
                currentTime >
                existingTime
            ) {

                existing.createdAt =
                    entry.createdAt;

                if (
                    entry.teacherName
                ) {

                    existing.teacherName =
                        entry.teacherName;

                }

                if (
                    entry.teacher_name
                ) {

                    existing.teacher_name =
                        entry.teacher_name;

                }

                if (
                    entry.region
                ) {

                    existing.region =
                        entry.region;

                }

                if (
                    entry.state
                ) {

                    existing.state =
                        entry.state;

                }

                if (
                    entry.city
                ) {

                    existing.city =
                        entry.city;

                }

            }

        }
    );

    return Array.from(
        mergedMap.values()
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

    // Support single access object
    if (
        user.access &&
        typeof user.access === "object"
    ) {

        return [user.access];

    }

    if (
        user.accessRules &&
        typeof user.accessRules === "object"
    ) {

        return [user.accessRules];

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

        return rule.states
            .split(",")
            .map(
                state =>
                    state.trim()
            )
            .filter(Boolean);

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

    if (
        rule.state
    ) {

        return [rule.state];

    }

    if (
        rule.stateName
    ) {

        return [rule.stateName];

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
// USER COLLECTION
// ======================================================

function getUserCollection(
    userEmployees,
    mergedEntries
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

    mergedEntries.forEach(
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
// BUILD USER SUMMARY
// ======================================================

function buildUserSummary() {

    const mergedEntries =
        getLatestEntries();

    userSummaryData = [];

    regionUsers.forEach(
        (user) => {

            const userEmployees =
                getUserEmployees(
                    user
                );

            const collectionAmount =
                getUserCollection(
                    userEmployees,
                    mergedEntries
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
// ======================================================

function updateUserSummaryCards(list) {

    let totalTarget = 0;
    let totalCollection = 0;

    list.forEach(
        (user) => {

            totalTarget +=
                user.target;

            totalCollection +=
                user.collection;

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

    if (
        userSummaryTotalTarget
    ) {

        userSummaryTotalTarget.textContent =
            formatUnit(
                totalTarget
            );

    }

    if (
        userSummaryTotalCollection
    ) {

        userSummaryTotalCollection.textContent =
            formatUnit(
                totalCollection
            );

    }

    if (
        userSummaryTotalRemaining
    ) {

        userSummaryTotalRemaining.textContent =
            formatUnit(
                totalRemaining
            );

    }

    if (
        userSummaryTotalPercentage
    ) {

        userSummaryTotalPercentage.textContent =
            percentage.toFixed(2) +
            "%";

    }

}

// ======================================================
// DISPLAY USER SUMMARY
// ======================================================

function displayUserSummary(list) {

    if (
        !userSummaryTableBody
    ) {

        return;

    }

    if (
        list.length === 0
    ) {

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
// TODAY DATE
// ======================================================

function getTodayDate() {

    return localDateString(
        new Date()
    );

}

// ======================================================
// FORMAT DATE
// ======================================================

function formatDisplayDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const normalized =
        normalizeDateValue(
            dateValue
        );

    const parts =
        normalized.split("-");

    if (
        parts.length !== 3
    ) {

        return normalized;

    }

    return (
        `${parts[2]}-${parts[1]}-${parts[0]}`
    );

}

// ======================================================
// USER COLLECTION FOR DATE
// ======================================================

function getUserCollectionForDate(
    user,
    selectedDate,
    mergedEntries
) {

    const userEmployees =
        getUserEmployees(
            user
        );

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

    const wantedDate =
        normalizeDateValue(
            selectedDate
        );

    let total = 0;

    mergedEntries.forEach(
        (entry) => {

            const entryDate =
                normalizeDateValue(
                    getEntryDate(
                        entry
                    )
                );

            if (
                entryDate !==
                wantedDate
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
// DISPLAY TODAY COLLECTION
// ======================================================

function displayTodayCollection(
    selectedDate
) {

    if (
        !todayCollectionTableBody
    ) {

        return;

    }

    if (!selectedDate) {

        selectedDate =
            getTodayDate();

    }

    const mergedEntries =
        getLatestEntries();

    let grandTotal = 0;

    let html = "";

    regionUsers.forEach(
        (user, index) => {

            const amount =
                getUserCollectionForDate(
                    user,
                    selectedDate,
                    mergedEntries
                );

            grandTotal +=
                amount;

            const userName =
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

                        <span
                            class="today-user-name"
                        >

                            ${userName}

                        </span>

                    </td>

                    <td>

                        <span
                            class="today-total-amount"
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

    html += `

        <tr
            class="today-grand-total"
        >

            <td
                colspan="2"
                class="today-total-label"
            >

                Total Amount

            </td>

            <td
                class="today-total-value"
            >

                ${formatAmount(
                    grandTotal
                )}

            </td>

        </tr>

    `;

    todayCollectionTableBody.innerHTML =
        html;

    console.log(
        "Selected Date:",
        selectedDate
    );

    console.log(
        "Today Collection Total:",
        grandTotal
    );

}

// ======================================================
// DATE FILTER
// ======================================================

if (
    todayCollectionDateFilter
) {

    todayCollectionDateFilter.value =
        getTodayDate();

    todayCollectionDateFilter.addEventListener(
        "change",
        function () {

            displayTodayCollection(
                this.value
            );

        }
    );

}

// ======================================================
// DOWNLOAD DASHBOARD IMAGE
// ======================================================

if (
    downloadDashboardImageBtn
) {

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

            let originalBodyOverflow = "";
            let originalHtmlOverflow = "";

            try {

                await new Promise(
                    function (resolve) {

                        requestAnimationFrame(
                            function () {

                                requestAnimationFrame(
                                    resolve
                                );

                            }
                        );

                    }
                );

                originalBodyOverflow =
                    document.body.style.overflow;

                originalHtmlOverflow =
                    document.documentElement.style.overflow;

                document.body.style.overflow =
                    "visible";

                document.documentElement.style.overflow =
                    "visible";

                const captureWidth =
                    dashboard.scrollWidth;

                const captureHeight =
                    dashboard.scrollHeight;

                const canvas =
                    await html2canvas(
                        dashboard,
                        {

                            scale: 2,

                            useCORS: true,

                            allowTaint: false,

                            backgroundColor:
                                "#f4f7fb",

                            logging: false,

                            imageTimeout:
                                15000,

                            scrollX: 0,

                            scrollY: 0,

                            width:
                                captureWidth,

                            height:
                                captureHeight,

                            windowWidth:
                                captureWidth,

                            windowHeight:
                                captureHeight,

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

                                    const clonedDashboard =
                                        clonedDocument
                                            .getElementById(
                                                "dashboardCaptureArea"
                                            );

                                    if (
                                        clonedDashboard
                                    ) {

                                        clonedDashboard.style.width =
                                            captureWidth + "px";

                                        clonedDashboard.style.maxWidth =
                                            "none";

                                        clonedDashboard.style.margin =
                                            "0";

                                        clonedDashboard.style.padding =
                                            "0";

                                        clonedDashboard.style.overflow =
                                            "visible";

                                    }

                                    const wrappers =
                                        clonedDocument
                                            .querySelectorAll(
                                                ".user-summary-table-wrapper"
                                            );

                                    wrappers.forEach(
                                        function (
                                            wrapper
                                        ) {

                                            wrapper.style.width =
                                                "100%";

                                            wrapper.style.maxWidth =
                                                "none";

                                            wrapper.style.overflow =
                                                "visible";

                                        }
                                    );

                                    const tables =
                                        clonedDocument
                                            .querySelectorAll(
                                                ".user-summary-table"
                                            );

                                    tables.forEach(
                                        function (
                                            table
                                        ) {

                                            table.style.width =
                                                "100%";

                                            table.style.maxWidth =
                                                "none";

                                        }
                                    );

                                }

                        }
                    );

                document.body.style.overflow =
                    originalBodyOverflow;

                document.documentElement.style.overflow =
                    originalHtmlOverflow;

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

            }

            catch (error) {

                console.error(
                    "Dashboard Image Download Error:",
                    error
                );

                document.body.style.overflow =
                    originalBodyOverflow;

                document.documentElement.style.overflow =
                    originalHtmlOverflow;

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
// DOWNLOAD TODAY COLLECTION IMAGE
// ======================================================

if (
    downloadTodayCollectionImageBtn
) {

    downloadTodayCollectionImageBtn.addEventListener(
        "click",
        async function () {

            const captureArea =
                document.getElementById(
                    "todayCollectionCaptureArea"
                );

            if (!captureArea) {

                alert(
                    "Today Collection area nahi mila."
                );

                return;

            }

            if (
                typeof html2canvas ===
                "undefined"
            ) {

                alert(
                    "Image download library load nahi hui."
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

            let originalBodyOverflow = "";
            let originalHtmlOverflow = "";

            try {

                await new Promise(
                    function (resolve) {

                        requestAnimationFrame(
                            function () {

                                requestAnimationFrame(
                                    resolve
                                );

                            }
                        );

                    }
                );

                originalBodyOverflow =
                    document.body.style.overflow;

                originalHtmlOverflow =
                    document.documentElement.style.overflow;

                document.body.style.overflow =
                    "visible";

                document.documentElement.style.overflow =
                    "visible";

                const captureWidth =
                    captureArea.scrollWidth;

                const captureHeight =
                    captureArea.scrollHeight;

                const canvas =
                    await html2canvas(
                        captureArea,
                        {

                            scale: 2,

                            useCORS: true,

                            allowTaint: false,

                            backgroundColor:
                                "#ffffff",

                            logging: false,

                            imageTimeout:
                                15000,

                            scrollX: 0,

                            scrollY: 0,

                            width:
                                captureWidth,

                            height:
                                captureHeight,

                            windowWidth:
                                captureWidth,

                            windowHeight:
                                captureHeight,

                            onclone:
                                function (
                                    clonedDocument
                                ) {

                                    const clonedButton =
                                        clonedDocument
                                            .getElementById(
                                                "downloadTodayCollectionImageBtn"
                                            );

                                    if (
                                        clonedButton
                                    ) {

                                        clonedButton.style.display =
                                            "none";

                                    }

                                    const clonedControls =
                                        clonedDocument
                                            .querySelector(
                                                ".today-collection-controls"
                                            );

                                    if (
                                        clonedControls
                                    ) {

                                        clonedControls.style.display =
                                            "none";

                                    }

                                    const clonedArea =
                                        clonedDocument
                                            .getElementById(
                                                "todayCollectionCaptureArea"
                                            );

                                    if (
                                        clonedArea
                                    ) {

                                        clonedArea.style.width =
                                            captureWidth + "px";

                                        clonedArea.style.maxWidth =
                                            "none";

                                        clonedArea.style.margin =
                                            "0";

                                        clonedArea.style.overflow =
                                            "visible";

                                    }

                                }

                        }
                    );

                document.body.style.overflow =
                    originalBodyOverflow;

                document.documentElement.style.overflow =
                    originalHtmlOverflow;

                const image =
                    canvas.toDataURL(
                        "image/png",
                        1.0
                    );

                const selectedDate =
                    todayCollectionDateFilter
                        ? todayCollectionDateFilter.value
                        : getTodayDate();

                const safeDate =
                    selectedDate ||
                    getTodayDate();

                const link =
                    document.createElement(
                        "a"
                    );

                link.download =
                    `Telethon-Today-Collection-${safeDate}.png`;

                link.href =
                    image;

                document.body.appendChild(
                    link
                );

                link.click();

                document.body.removeChild(
                    link
                );

            }

            catch (error) {

                console.error(
                    "Today Collection Image Download Error:",
                    error
                );

                document.body.style.overflow =
                    originalBodyOverflow;

                document.documentElement.style.overflow =
                    originalHtmlOverflow;

                alert(
                    "Today Collection image download nahi hui.\n\n" +
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
// MAIN DASHBOARD
// ======================================================

async function loadDashboard() {

    try {

        // ==============================================
        // LOADING USER SUMMARY
        // ==============================================

        if (
            userSummaryTableBody
        ) {

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

        // ==============================================
        // LOADING TODAY COLLECTION
        // ==============================================

        if (
            todayCollectionTableBody
        ) {

            todayCollectionTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="3"
                        class="no-data"
                    >

                        <i
                            class="
                                fa-solid
                                fa-spinner
                                fa-spin
                            "
                        ></i>

                        Loading Today Collection...

                    </td>

                </tr>

            `;

        }

        // ==============================================
        // LOAD ALL DATA
        // ==============================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadTeacherEntries(),

            loadRegionUsers()

        ]);

        // ==============================================
        // USER SUMMARY
        // ==============================================

        buildUserSummary();

        displayUserSummary(
            userSummaryData
        );

        // ==============================================
        // TODAY COLLECTION
        // ==============================================

        const selectedDate =
            todayCollectionDateFilter &&
            todayCollectionDateFilter.value
                ? todayCollectionDateFilter.value
                : getTodayDate();

        displayTodayCollection(
            selectedDate
        );

        // ==============================================
        // DEBUG
        // ==============================================

        console.log(
            "======================================"
        );

        console.log(
            "Dashboard Loaded Successfully"
        );

        console.log(
            "======================================"
        );

        console.log(
            "Region Users:",
            regionUsers.length
        );

        console.log(
            "Employees:",
            employees.length
        );

        console.log(
            "Old daily_entry:",
            dailyEntries.length
        );

        console.log(
            "New teacher_entries:",
            teacherEntries.length
        );

        console.log(
            "Merged Teacher + Date Entries:",
            getLatestEntries().length
        );

        console.log(
            "======================================"
        );

    }

    catch (error) {

        console.error(
            "Dashboard Load Error:",
            error
        );

        if (
            userSummaryTableBody
        ) {

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

        if (
            todayCollectionTableBody
        ) {

            todayCollectionTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="3"
                        style="
                            text-align:center;
                            padding:30px;
                            color:#dc2626;
                        "
                    >

                        Today Collection data
                        load nahi hua.

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
