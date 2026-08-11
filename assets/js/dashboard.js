// ======================================================
// TELETHON ADMIN DASHBOARD
// ======================================================
// User Wise Target + Teacher Collection Summary
//
// IMPORTANT:
// 1 Unit = ₹7,000
//
// Region User Management:
// ONLY "regionUsers" collection is used.
// ======================================================


// ======================================================
// ADMIN ONLY ACCESS
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
// FIREBASE
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
// COLLECTION NAMES
// ======================================================

const EMPLOYEES_COLLECTION = "employees";

const DAILY_ENTRY_COLLECTION = "daily_entry";

// IMPORTANT:
// Region User Management bhi isi collection me save karta hai.
const REGION_USERS_COLLECTION = "regionUsers";


// ======================================================
// UNIT VALUE
// ======================================================

const UNIT_VALUE = 7000;


// ======================================================
// HTML ELEMENTS
// ======================================================

// Old Dashboard Cards

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");


// User Summary

const userSummaryTableBody =
    document.getElementById("userSummaryTableBody");

const userSummaryTotalUsers =
    document.getElementById("userSummaryTotalUsers");

const userSummaryTotalTarget =
    document.getElementById("userSummaryTotalTarget");

const userSummaryTotalCollection =
    document.getElementById("userSummaryTotalCollection");

const userSummaryTotalRemaining =
    document.getElementById("userSummaryTotalRemaining");

const userSummaryTotalPercentage =
    document.getElementById("userSummaryTotalPercentage");

const userSummarySearch =
    document.getElementById("userSummarySearch");


// ======================================================
// DATA
// ======================================================

let employees = [];

let dailyEntries = [];

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
// CURRENCY
// ======================================================

function formatCurrency(value) {

    return (
        "₹ " +
        Number(value || 0)
            .toLocaleString("en-IN")
    );

}


// ======================================================
// UNIT
// ======================================================
// 1 Unit = ₹7,000
// ======================================================

function formatUnit(value) {

    const amount =
        numberValue(value);

    const units =
        amount / UNIT_VALUE;

    return (
        units.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }) +
        " Unit"
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
// EMPLOYEE CITY
// ======================================================

function getEmployeeCity(employee) {

    return String(

        employee.city ||

        employee.cityName ||

        employee.city_name ||

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

            const data =
                docSnapshot.data();

            employees.push({

                id:
                    docSnapshot.id,

                ...data

            });

        }
    );

    console.log(
        "Total Employees:",
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

    console.log(
        "Total Daily Entries:",
        dailyEntries.length
    );

}


// ======================================================
// GET CREATED TIME
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
        entry.createdAt.seconds
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
// GET LATEST ENTRIES
// ======================================================
// ONE EMPLOYEE + ONE DATE = ONE ENTRY
// Last entry for that date will be used.
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

            if (!employeeCode) {
                return;
            }

            if (!date) {
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
// GET ACCESS RULES
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
// GET RULE REGION
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
// GET RULE STATE
// ======================================================

function getRuleState(rule) {

    return normalize(

        rule.state ||

        rule.stateName ||

        rule.assignedState ||

        ""

    );

}


// ======================================================
// CHECK EMPLOYEE ACCESS
// ======================================================
// Region User Management me format:
//
// {
//     region: "Madhya Pradesh",
//     state: "*"
// }
//
// ya
//
// {
//     region: "Madhya Pradesh",
//     state: "Madhya Pradesh State"
// }
//
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

            const assignedState =
                getRuleState(
                    rule
                );

            // ----------------------------------
            // REGION MATCH
            // ----------------------------------

            if (
                assignedRegion &&
                assignedRegion !==
                employeeRegion
            ) {

                return false;

            }

            // ----------------------------------
            // FULL REGION
            // ----------------------------------

            if (

                assignedState === "*" ||

                assignedState === "all" ||

                assignedState === "all states" ||

                assignedState === "full" ||

                !assignedState

            ) {

                return true;

            }

            // ----------------------------------
            // STATE MATCH
            // ----------------------------------

            return (
                assignedState ===
                employeeState
            );

        }
    );

}


// ======================================================
// GET TEACHERS FOR USER
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
// GET USER COLLECTION
// ======================================================

function getUserCollection(
    userEmployees,
    latestEntries
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
// LOAD REGION USERS
// ======================================================
// ONLY regionUsers
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

            const data =
                docSnapshot.data();

            // --------------------------------------
            // Only active users
            // --------------------------------------

            const status =
                normalize(
                    data.status || "active"
                );

            if (
                status === "inactive" ||
                status === "disabled" ||
                status === "deleted"
            ) {

                return;

            }

            regionUsers.push({

                id:
                    docSnapshot.id,

                ...data

            });

        }
    );

    console.log(
        "======================================"
    );

    console.log(
        "REGION USERS:",
        regionUsers.length
    );

    console.log(
        regionUsers
    );

    console.log(
        "======================================"
    );

}


// ======================================================
// BUILD USER SUMMARY
// ======================================================

function buildUserSummary() {

    const latestEntries =
        getLatestEntries();

    userSummaryData = [];

    regionUsers.forEach(
        (user) => {

            const userEmployees =
                getUserEmployees(
                    user
                );

            const totalCollection =
                getUserCollection(
                    userEmployees,
                    latestEntries
                );

            const target =
                getUserTarget(
                    user
                );

            const remaining =
                Math.max(
                    target -
                    totalCollection,
                    0
                );

            const percentage =
                target > 0

                    ? (
                        totalCollection /
                        target
                    ) * 100

                    : 0;

            userSummaryData.push({

                id:
                    user.id,

                userCode:
                    getUserCode(user),

                userName:
                    getUserName(user),

                target:
                    target,

                collection:
                    totalCollection,

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

    console.log(
        "FINAL USER SUMMARY:",
        userSummaryData
    );

}


// ======================================================
// UPDATE SUMMARY CARDS
// ======================================================

function updateUserSummaryCards(
    list
) {

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


    // ----------------------------------
    // Total Users
    // ----------------------------------

    if (
        userSummaryTotalUsers
    ) {

        userSummaryTotalUsers.textContent =
            list.length;

    }


    // ----------------------------------
    // Total Target
    // ----------------------------------

    if (
        userSummaryTotalTarget
    ) {

        userSummaryTotalTarget.innerHTML =

            formatCurrency(
                totalTarget
            ) +

            `<small style="
                margin-left:8px;
                color:#2563eb;
                font-weight:600;
            ">
                (${formatUnit(totalTarget)})
            </small>`;

    }


    // ----------------------------------
    // Total Collection
    // ----------------------------------

    if (
        userSummaryTotalCollection
    ) {

        userSummaryTotalCollection.innerHTML =

            formatCurrency(
                totalCollection
            ) +

            `<small style="
                margin-left:8px;
                color:#10b981;
                font-weight:600;
            ">
                (${formatUnit(totalCollection)})
            </small>`;

    }


    // ----------------------------------
    // Remaining
    // ----------------------------------

    if (
        userSummaryTotalRemaining
    ) {

        userSummaryTotalRemaining.innerHTML =

            formatCurrency(
                totalRemaining
            ) +

            `<small style="
                margin-left:8px;
                color:#f59e0b;
                font-weight:600;
            ">
                (${formatUnit(totalRemaining)})
            </small>`;

    }


    // ----------------------------------
    // Percentage
    // ----------------------------------

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

function displayUserSummary(
    list
) {

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
                    colspan="7"
                    class="no-data"
                >

                    Koi Region User nahi mila.

                    <br>

                    <small>
                        Firebase → regionUsers check karein.
                    </small>

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


            const userName =
                escapeHTML(
                    user.userName
                );

            const userCode =
                escapeHTML(
                    user.userCode
                );


            // ==================================
            // USER ROW
            // ==================================

            html += `

                <tr>

                    <!-- Number -->

                    <td>
                        ${index + 1}
                    </td>


                    <!-- USER NAME -->

                    <td>

                        <div
                            class="user-name-cell"
                        >

                            <input
                                type="text"
                                class="user-name-input"
                                data-id="${escapeHTML(user.id)}"
                                value="${userName}"
                                placeholder="Enter User Name"
                            >

                            <small
                                style="
                                    display:block;
                                    margin-top:5px;
                                    color:#64748b;
                                    font-size:11px;
                                "
                            >
                                Code:
                                ${userCode || "No Code"}
                            </small>

                        </div>

                    </td>


                    <!-- TARGET -->

                    <td>

                        <div
                            class="target-edit-box"
                        >

                            <input
                                type="number"
                                min="0"
                                class="user-target-input"
                                data-id="${escapeHTML(user.id)}"
                                value="${user.target || ""}"
                                placeholder="Enter Target"
                            >

                            <button
                                type="button"
                                class="save-user-target-btn"
                                data-id="${escapeHTML(user.id)}"
                                title="Save Target"
                            >

                                <i
                                    class="fa-solid fa-save"
                                ></i>

                            </button>

                        </div>


                        <div
                            style="
                                margin-top:6px;
                                font-size:12px;
                                color:#2563eb;
                                font-weight:600;
                            "
                        >

                            ${formatUnit(user.target)}

                        </div>

                    </td>


                    <!-- COLLECTION -->

                    <td
                        class="collection-cell"
                    >

                        <strong>
                            ${formatCurrency(
                                user.collection
                            )}
                        </strong>

                        <div
                            style="
                                margin-top:5px;
                                color:#10b981;
                                font-size:12px;
                                font-weight:600;
                            "
                        >

                            ${formatUnit(
                                user.collection
                            )}

                        </div>

                    </td>


                    <!-- REMAINING -->

                    <td
                        class="remaining-cell"
                    >

                        ${formatCurrency(
                            user.remaining
                        )}

                        <div
                            style="
                                margin-top:5px;
                                color:#f59e0b;
                                font-size:12px;
                                font-weight:600;
                            "
                        >

                            ${formatUnit(
                                user.remaining
                            )}

                        </div>

                    </td>


                    <!-- PERCENTAGE -->

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
                                class="user-progress-container"
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


                    <!-- TEACHERS -->

                    <td>

                        <strong>
                            ${user.teacherCount}
                        </strong>

                        <span
                            style="
                                color:#64748b;
                                font-size:12px;
                            "
                        >
                            Teachers
                        </span>

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

                        const target =
                            numberValue(
                                input.value
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


                        button.disabled =
                            true;


                        const oldHTML =
                            button.innerHTML;


                        button.innerHTML = `

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
                                        target,

                                    targetAmount:
                                        target,

                                    manualTarget:
                                        target,

                                    updatedAt:
                                        serverTimestamp()

                                },

                                {
                                    merge: true
                                }

                            );


                            user.target =
                                target;

                            user.remaining =
                                Math.max(
                                    target -
                                    user.collection,
                                    0
                                );

                            user.percentage =
                                target > 0

                                    ? (
                                        user.collection /
                                        target
                                    ) * 100

                                    : 0;


                            const search =
                                userSummarySearch
                                    ? normalize(
                                        userSummarySearch.value
                                    )
                                    : "";


                            if (search) {

                                const filtered =
                                    userSummaryData.filter(
                                        item =>

                                            normalize(
                                                item.userName
                                            ).includes(search)

                                            ||

                                            normalize(
                                                item.userCode
                                            ).includes(search)
                                    );

                                displayUserSummary(
                                    filtered
                                );

                            }

                            else {

                                displayUserSummary(
                                    userSummaryData
                                );

                            }


                            console.log(
                                "Target Saved:",
                                user.userCode,
                                target
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

                            button.disabled =
                                false;

                            button.innerHTML =
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


                            console.log(
                                "User Name Saved:",
                                newName
                            );

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
// SEARCH USER
// ======================================================

if (
    userSummarySearch
) {

    userSummarySearch.addEventListener(
        "input",
        function () {

            const search =
                normalize(
                    this.value
                );

            if (!search) {

                displayUserSummary(
                    userSummaryData
                );

                return;

            }


            const filtered =
                userSummaryData.filter(
                    (user) => {

                        return (

                            normalize(
                                user.userName
                            )
                            .includes(search)

                            ||

                            normalize(
                                user.userCode
                            )
                            .includes(search)

                        );

                    }
                );


            displayUserSummary(
                filtered
            );

        }
    );

}


// ======================================================
// RECENT COLLECTION
// ======================================================

async function loadRecentCollections() {

    try {

        const latestEntries =
            getLatestEntries();


        latestEntries.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.date
                    );

                const dateB =
                    new Date(
                        b.date
                    );

                return dateB - dateA;

            }
        );


        let totalCollection = 0;

        let todayCollection = 0;


        const todayStr =
            new Date()
                .toISOString()
                .split("T")[0];


        let tableRowsHTML = "";


        latestEntries.forEach(
            (data) => {

                const amount =
                    getEntryAmount(
                        data
                    );


                totalCollection +=
                    amount;


                if (
                    data.date ===
                    todayStr
                ) {

                    todayCollection +=
                        amount;

                }


                const employeeCode =
                    data.employee_code ||

                    data.employeeCode ||

                    data.empCode ||

                    "-";


                const teacherName =
                    data.teacher_name ||

                    data.teacherName ||

                    "-";


                const jamiatulMadina =
                    data.jamiatul_madina ||

                    data.jamiatulMadina ||

                    "-";


                const city =
                    data.city ||

                    "-";


                const state =
                    data.state ||

                    "-";


                const region =
                    data.region ||

                    "-";


                const date =
                    data.date ||

                    "-";


                tableRowsHTML += `

                    <tr>

                        <td>
                            ${escapeHTML(date)}
                        </td>

                        <td>

                            <b>
                                ${escapeHTML(
                                    employeeCode
                                )}
                            </b>

                        </td>

                        <td>
                            ${escapeHTML(
                                teacherName
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                jamiatulMadina
                            )}
                        </td>

                        <td>

                            ${escapeHTML(
                                city
                            )},

                            ${escapeHTML(
                                state
                            )}

                        </td>

                        <td>
                            ${escapeHTML(
                                region
                            )}
                        </td>

                        <td
                            style="
                                color:#10b981;
                                font-weight:bold;
                            "
                        >

                            ${formatCurrency(
                                amount
                            )}

                        </td>

                    </tr>

                `;

            }
        );


        // ======================================
        // OLD TOTAL COLLECTION CARD
        // ======================================

        if (
            totalAmountEl
        ) {

            totalAmountEl.innerHTML =

                formatCurrency(
                    totalCollection
                ) +

                `<small style="
                    display:block;
                    margin-top:5px;
                    color:#10b981;
                    font-weight:600;
                    font-size:12px;
                ">
                    ${formatUnit(totalCollection)}
                </small>`;

        }


        // ======================================
        // TODAY COLLECTION
        // ======================================

        if (
            todayAmountEl
        ) {

            todayAmountEl.innerHTML =

                formatCurrency(
                    todayCollection
                ) +

                `<small style="
                    display:block;
                    margin-top:5px;
                    color:#10b981;
                    font-weight:600;
                    font-size:12px;
                ">
                    ${formatUnit(todayCollection)}
                </small>`;

        }


        // ======================================
        // TOTAL ENTRIES
        // ======================================

        if (
            totalEntriesCountEl
        ) {

            totalEntriesCountEl.textContent =
                latestEntries.length;

        }


        // ======================================
        // TABLE
        // ======================================

        if (
            entriesTableBody
        ) {

            if (
                latestEntries.length === 0
            ) {

                entriesTableBody.innerHTML = `

                    <tr>

                        <td
                            colspan="7"
                            class="no-data"
                        >

                            Koi collection entry nahi mili.

                        </td>

                    </tr>

                `;

            }

            else {

                entriesTableBody.innerHTML =
                    tableRowsHTML;

            }

        }

    }

    catch (error) {

        console.error(
            "Recent Collection Error:",
            error
        );


        if (
            entriesTableBody
        ) {

            entriesTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="no-data"
                        style="color:red;"
                    >

                        Data load karne me error aaya.

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
// LOGOUT
// ======================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (
    logoutBtn
) {

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


// ======================================================
// MAIN DASHBOARD LOAD
// ======================================================

async function loadDashboard() {

    try {

        // ==========================================
        // LOADING MESSAGE
        // ==========================================

        if (
            userSummaryTableBody
        ) {

            userSummaryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="no-data"
                    >

                        <i
                            class="
                                fa-solid
                                fa-spinner
                                fa-spin
                            "
                        ></i>

                        Loading Region Users...

                    </td>

                </tr>

            `;

        }


        // ==========================================
        // LOAD ALL FIREBASE DATA
        // ==========================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadRegionUsers()

        ]);


        // ==========================================
        // DEBUG
        // ==========================================

        console.log(
            "======================================"
        );

        console.log(
            "Dashboard Data"
        );

        console.log(
            "Employees:",
            employees.length
        );

        console.log(
            "Daily Entries:",
            dailyEntries.length
        );

        console.log(
            "Region Users:",
            regionUsers.length
        );

        console.log(
            "======================================"
        );


        // ==========================================
        // BUILD USER SUMMARY
        // ==========================================

        buildUserSummary();


        // ==========================================
        // SHOW REGION USERS
        // ==========================================

        displayUserSummary(
            userSummaryData
        );


        // ==========================================
        // RECENT COLLECTION
        // ==========================================

        await loadRecentCollections();


        console.log(
            "Dashboard Loaded Successfully."
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
                        colspan="7"
                        class="no-data"
                        style="color:red;"
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
