// ======================================================
// TELETHON ADMIN DASHBOARD
// REGION USERS + TEACHER COLLECTION
// 1 UNIT = ₹7,000
//
// IMPORTANT:
// ALL USERS = regionUsers
// Teachers are NOT treated as Users.
//
// Users with 0 collection will ALWAYS be displayed.
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

const EMPLOYEES_COLLECTION =
    "employees";

const DAILY_ENTRY_COLLECTION =
    "daily_entry";

const REGION_USERS_COLLECTION =
    "regionUsers";


// ======================================================
// 1 UNIT = ₹7,000
// ======================================================

const UNIT_AMOUNT = 7000;


// ======================================================
// HTML ELEMENTS
// ======================================================

// ------------------------------------------------------
// EXISTING DASHBOARD
// ------------------------------------------------------

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


// ------------------------------------------------------
// EXISTING DASHBOARD IMAGE
// ------------------------------------------------------

const downloadDashboardImageBtn =
    document.getElementById(
        "downloadDashboardImageBtn"
    );


// ------------------------------------------------------
// TODAY COLLECTION
// ------------------------------------------------------

const todayCollectionDateFilter =
    document.getElementById(
        "todayCollectionDateFilter"
    );

const todayCollectionTableBody =
    document.getElementById(
        "todayCollectionTableBody"
    );

const todayCollectionTotalAmount =
    document.getElementById(
        "todayCollectionTotalAmount"
    );

const downloadTodayCollectionImageBtn =
    document.getElementById(
        "downloadTodayCollectionImageBtn"
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
// UNIT
// 1 UNIT = ₹7,000
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
// Used for editable Target field
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
// FORMAT RUPEE
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
// EXISTING DASHBOARD LOGIC
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
// EXISTING DASHBOARD
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
//
// IMPORTANT:
// ALL regionUsers ARE ALWAYS ADDED.
// COLLECTION = 0 IS ALSO VALID.
//
// NO USER IS REMOVED BECAUSE OF COLLECTION.
// ======================================================

function buildUserSummary() {

    const latestEntries =
        getLatestEntries();


    userSummaryData = [];


    regionUsers.forEach(
        (user) => {

            // ------------------------------------------
            // Find teachers assigned to this user
            // ------------------------------------------

            const userEmployees =
                getUserEmployees(
                    user
                );


            // ------------------------------------------
            // Collection
            // ------------------------------------------

            const collectionAmount =
                getUserCollection(
                    userEmployees,
                    latestEntries
                );


            // ------------------------------------------
            // Target
            // ------------------------------------------

            const target =
                getUserTarget(
                    user
                );


            // ------------------------------------------
            // Remaining
            // ------------------------------------------

            const remaining =
                Math.max(
                    target -
                    collectionAmount,
                    0
                );


            // ------------------------------------------
            // Percentage
            // ------------------------------------------

            const percentage =
                target > 0
                    ? (
                        collectionAmount /
                        target
                    ) * 100
                    : 0;


            // ------------------------------------------
            // IMPORTANT:
            // ALWAYS PUSH USER
            // ------------------------------------------

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
                    collectionAmount || 0,

                remaining:
                    remaining || 0,

                percentage:
                    percentage || 0,

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
// ONLY UNITS
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


    // --------------------------------------------------
    // IMPORTANT:
    // Only if there are genuinely NO regionUsers
    // --------------------------------------------------

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
    // SAVE TARGET UNIT
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


                            // Today Collection remains
                            // unchanged.

                            renderTodayCollection();


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


                            // Update Today Collection
                            renderTodayCollection();

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

function getTodayDateString() {

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


    return (
        `${year}-${month}-${day}`
    );

}


// ======================================================
// ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    return String(
        entry.date ||
        entry.entryDate ||
        entry.collectionDate ||
        entry.collection_date ||
        ""
    ).trim();

}


// ======================================================
// TODAY COLLECTION
//
// IMPORTANT:
// This is separate from existing dashboard.
//
// For selected date:
// ALL regionUsers are shown.
//
// If user has no collection:
// Total Amount = ₹0
//
// Multiple entries for the same user/date
// are ADDED.
// ======================================================

function getTodayCollectionData(
    selectedDate
) {

    const result = [];


    // --------------------------------------------------
    // ALL regionUsers
    // --------------------------------------------------

    regionUsers.forEach(
        (user) => {

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


            let totalAmount = 0;


            // ------------------------------------------------
            // ALL ENTRIES OF SELECTED DATE ARE ADDED
            // ------------------------------------------------

            dailyEntries.forEach(
                (entry) => {

                    const entryDate =
                        getEntryDate(
                            entry
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
                        entryCode &&
                        employeeCodes.has(
                            entryCode
                        )
                    ) {

                        totalAmount +=
                            getEntryAmount(
                                entry
                            );

                    }

                }
            );


            // ------------------------------------------------
            // ALWAYS ADD USER
            // ------------------------------------------------

            result.push({

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

                totalAmount:
                    totalAmount || 0

            });

        }
    );


    return result;

}


// ======================================================
// DISPLAY TODAY COLLECTION
// ======================================================

function renderTodayCollection() {

    if (!todayCollectionTableBody) {
        return;
    }


    let selectedDate =
        todayCollectionDateFilter
            ? todayCollectionDateFilter.value
            : getTodayDateString();


    if (!selectedDate) {

        selectedDate =
            getTodayDateString();

    }


    const data =
        getTodayCollectionData(
            selectedDate
        );


    // --------------------------------------------------
    // TOTAL
    // --------------------------------------------------

    let grandTotal = 0;


    data.forEach(
        (user) => {

            grandTotal +=
                user.totalAmount;

        }
    );


    if (todayCollectionTotalAmount) {

        todayCollectionTotalAmount.textContent =
            formatAmount(
                grandTotal
            );

    }


    // --------------------------------------------------
    // NO USERS
    // --------------------------------------------------

    if (data.length === 0) {

        todayCollectionTableBody.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="no-data"
                >

                    Koi Region User nahi mila.

                </td>

            </tr>

        `;

        return;

    }


    // --------------------------------------------------
    // TABLE
    // --------------------------------------------------

    let html = "";


    data.forEach(
        (user, index) => {

            html += `

                <tr>

                    <td>

                        <strong>
                            ${index + 1}
                        </strong>

                    </td>


                    <td>

                        ${escapeHTML(
                            user.userName
                        )}

                    </td>


                    <td>

                        <strong>

                            ${formatAmount(
                                user.totalAmount
                            )}

                        </strong>

                    </td>

                </tr>

            `;

        }
    );


    todayCollectionTableBody.innerHTML =
        html;

}


// ======================================================
// TODAY COLLECTION DATE FILTER
// ======================================================

if (todayCollectionDateFilter) {

    if (!todayCollectionDateFilter.value) {

        todayCollectionDateFilter.value =
            getTodayDateString();

    }


    todayCollectionDateFilter.addEventListener(
        "change",
        function () {

            renderTodayCollection();

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
                    "Today Collection data area nahi mila."
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
                            300
                        );

                    }
                );


                const canvas =
                    await html2canvas(
                        captureArea,
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

                                }

                        }
                    );


                const image =
                    canvas.toDataURL(
                        "image/png",
                        1.0
                    );


                const selectedDate =
                    todayCollectionDateFilter
                        ? todayCollectionDateFilter.value
                        : getTodayDateString();


                const link =
                    document.createElement(
                        "a"
                    );


                link.download =
                    `Telethon-Today-Collection-${selectedDate}.png`;


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
// DOWNLOAD COMPLETE DASHBOARD IMAGE
// ======================================================

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
                                    document
                                        .documentElement
                                        .scrollWidth,

                                    dashboard
                                        .scrollWidth
                                ),

                            windowHeight:
                                Math.max(
                                    document
                                        .documentElement
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


                                    const clonedTodayButton =
                                        clonedDocument
                                            .getElementById(
                                                "downloadTodayCollectionImageBtn"
                                            );


                                    if (
                                        clonedTodayButton
                                    ) {

                                        clonedTodayButton.style.display =
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


        if (todayCollectionTableBody) {

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

            loadRegionUsers()

        ]);


        // ==============================================
        // EXISTING DASHBOARD
        // ==============================================

        buildUserSummary();


        displayUserSummary(
            userSummaryData
        );


        // ==============================================
        // TODAY COLLECTION
        // ==============================================

        renderTodayCollection();


        console.log(
            "Dashboard Loaded Successfully"
        );


        console.log(
            "Total regionUsers:",
            regionUsers.length
        );


        console.log(
            "Total employees:",
            employees.length
        );


        console.log(
            "Total daily entries:",
            dailyEntries.length
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


        if (todayCollectionTableBody) {

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
