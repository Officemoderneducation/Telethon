// ======================================================
// TELETHON ADMIN DASHBOARD
// REGION USERS + TEACHER COLLECTION
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
// HTML ELEMENTS
// ======================================================

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");


const userSummaryTableBody =
    document.getElementById(
        "userSummaryTableBody"
    );

const userSummaryTotalTarget =
    document.getElementById(
        "userSummaryTotalTarget"
    );

const userSummaryTargetUnits =
    document.getElementById(
        "userSummaryTargetUnits"
    );

const userSummaryTotalCollection =
    document.getElementById(
        "userSummaryTotalCollection"
    );

const userSummaryCollectionUnits =
    document.getElementById(
        "userSummaryCollectionUnits"
    );

const userSummaryTotalRemaining =
    document.getElementById(
        "userSummaryTotalRemaining"
    );

const userSummaryRemainingUnits =
    document.getElementById(
        "userSummaryRemainingUnits"
    );

const userSummaryTotalPercentage =
    document.getElementById(
        "userSummaryTotalPercentage"
    );

const userSummarySearch =
    document.getElementById(
        "userSummarySearch"
    );


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

    const number = Number(
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
// 1 UNIT = ₹7,000
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
        ) + " Unit"
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

    console.log(
        "Employees:",
        employees
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
            "createdAt orderBy failed.",
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
        "Daily Entries:",
        dailyEntries
    );

}


// ======================================================
// LOAD REGION USERS
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

            regionUsers.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data()

            });

        }
    );

    console.log(
        "regionUsers:",
        regionUsers
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

            if (!employeeCode || !date) {
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

            const collectionAmount =
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

    console.log(
        "FINAL USER SUMMARY:",
        userSummaryData
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


    if (userSummaryTotalTarget) {

        userSummaryTotalTarget.textContent =
            formatCurrency(
                totalTarget
            );

    }

    if (userSummaryTargetUnits) {

        userSummaryTargetUnits.textContent =
            formatUnit(
                totalTarget
            );

    }


    if (userSummaryTotalCollection) {

        userSummaryTotalCollection.textContent =
            formatCurrency(
                totalCollection
            );

    }

    if (userSummaryCollectionUnits) {

        userSummaryCollectionUnits.textContent =
            formatUnit(
                totalCollection
            );

    }


    if (userSummaryTotalRemaining) {

        userSummaryTotalRemaining.textContent =
            formatCurrency(
                totalRemaining
            );

    }

    if (userSummaryRemainingUnits) {

        userSummaryRemainingUnits.textContent =
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
                    style="
                        text-align:center;
                        padding:30px;
                        color:#64748b;
                    "
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

                    <!-- NUMBER -->

                    <td>
                        <strong>
                            ${index + 1}
                        </strong>
                    </td>


                    <!-- USER NAME -->

                    <td>

                        <input
                            type="text"
                            class="user-name-input"
                            data-id="${safeId}"
                            value="${safeUserName}"
                            placeholder="User Name"
                        >

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
                                data-id="${safeId}"
                                value="${user.target || ""}"
                                placeholder="Enter Target"
                            >

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

                        <span
                            class="
                                amount-unit
                                target-main
                            "
                        >
                            ${formatUnit(
                                user.target
                            )}
                        </span>

                    </td>


                    <!-- TOTAL COLLECTION -->

                    <td>

                        <span
                            class="
                                amount-main
                                collection-main
                            "
                        >
                            ${formatCurrency(
                                user.collection
                            )}
                        </span>

                        <span
                            class="amount-unit"
                        >
                            ${formatUnit(
                                user.collection
                            )}
                        </span>

                    </td>


                    <!-- REMAINING TARGET -->

                    <td>

                        <span
                            class="
                                amount-main
                                remaining-main
                            "
                        >
                            ${formatCurrency(
                                user.remaining
                            )}
                        </span>

                        <span
                            class="
                                amount-unit
                                remaining-main
                            "
                        >
                            ${formatUnit(
                                user.remaining
                            )}
                        </span>

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


                            displayUserSummary(
                                getFilteredUsers()
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
// FILTER USERS
// ======================================================

function getFilteredUsers() {

    const search =
        normalize(
            userSummarySearch
                ? userSummarySearch.value
                : ""
        );

    if (!search) {

        return userSummaryData;

    }

    return userSummaryData.filter(
        (user) => {

            return (

                normalize(
                    user.userName
                ).includes(search)

                ||

                normalize(
                    user.userCode
                ).includes(search)

            );

        }
    );

}


// ======================================================
// SEARCH
// ======================================================

if (userSummarySearch) {

    userSummarySearch.addEventListener(
        "input",
        function () {

            displayUserSummary(
                getFilteredUsers()
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
                            )}

                            ,

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


        if (totalAmountEl) {

            totalAmountEl.textContent =
                formatCurrency(
                    totalCollection
                );

        }


        if (todayAmountEl) {

            todayAmountEl.textContent =
                formatCurrency(
                    todayCollection
                );

        }


        if (totalEntriesCountEl) {

            totalEntriesCountEl.textContent =
                latestEntries.length;

        }


        if (entriesTableBody) {

            if (
                latestEntries.length === 0
            ) {

                entriesTableBody.innerHTML = `

                    <tr>

                        <td
                            colspan="7"
                            style="
                                text-align:center;
                                padding:30px;
                                color:#64748b;
                            "
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

    }

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

        if (userSummaryTableBody) {

            userSummaryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            padding:30px;
                            color:#64748b;
                        "
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


        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadRegionUsers()

        ]);


        buildUserSummary();


        displayUserSummary(
            userSummaryData
        );


        await loadRecentCollections();


        console.log(
            "Dashboard Loaded Successfully"
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
