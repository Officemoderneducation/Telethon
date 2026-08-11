// ======================================================
// TELETHON ADMIN DASHBOARD
// REGION USERS + TARGET + COLLECTION + UNIT SUMMARY
// ======================================================


// ======================================================
// ADMIN ONLY ACCESS
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
// FIREBASE
// ======================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// SETTINGS
// ======================================================

const UNIT_VALUE = 7000;


// ======================================================
// HTML ELEMENTS
// ======================================================

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

const userSummarySearch =
    document.getElementById("userSummarySearch");


// Old Dashboard Cards

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");


// Logout

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// DATA
// ======================================================

let regionUsers = [];

let employees = [];

let dailyEntries = [];

let userSummaryData = [];


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


    const number = Number(
        String(value)
            .replace(/,/g, "")
            .replace(/₹/g, "")
            .trim()
    );


    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================================
// FORMAT CURRENCY
// ======================================================

function formatCurrency(value) {

    return (
        "₹ " +
        Number(value || 0)
            .toLocaleString("en-IN")
    );

}


// ======================================================
// FORMAT UNIT
// ======================================================

function formatUnit(value) {

    const number =
        Number(value || 0);


    if (
        Number.isInteger(number)
    ) {

        return (
            number.toLocaleString("en-IN") +
            " Unit"
        );

    }


    return (
        number.toLocaleString(
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
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ======================================================
// GET UNIT
// ======================================================

function getUnit(amount) {

    return (
        numberValue(amount) /
        UNIT_VALUE
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

        user.user_name ||

        user.name ||

        user.fullName ||

        user.full_name ||

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
// GET FIRESTORE DATE VALUE
// ======================================================

function getTimeValue(value) {

    if (!value) {
        return 0;
    }


    // Firestore Timestamp

    if (
        typeof value.toMillis === "function"
    ) {

        return value.toMillis();

    }


    // JS Date

    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    // Timestamp object

    if (
        value.seconds !== undefined
    ) {

        return (
            Number(value.seconds) * 1000 +
            Number(value.nanoseconds || 0) / 1000000
        );

    }


    // String / Number

    const time =
        new Date(value).getTime();


    return Number.isFinite(time)
        ? time
        : 0;

}


// ======================================================
// ENTRY CREATED TIME
// ======================================================

function getEntryTime(entry) {

    return Math.max(

        getTimeValue(
            entry.createdAt
        ),

        getTimeValue(
            entry.updatedAt
        ),

        getTimeValue(
            entry.submittedAt
        ),

        getTimeValue(
            entry.timestamp
        ),

        getTimeValue(
            entry.entryDate
        )

    );

}


// ======================================================
// LOAD REGION USERS
// ======================================================
//
// IMPORTANT:
// Region User Management me User
// "region_users" collection me save ho raha hai.
// Isliye Dashboard ka main source bhi wahi hai.
// ======================================================

async function loadRegionUsers() {

    regionUsers = [];


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "region_users"
                )
            );


        snapshot.forEach(
            (docSnapshot) => {

                const data =
                    docSnapshot.data();


                regionUsers.push({

                    id:
                        docSnapshot.id,

                    __collectionName:
                        "region_users",

                    ...data

                });

            }
        );


        console.log(
            "TOTAL REGION USERS:",
            regionUsers.length
        );


        console.log(
            "REGION USERS:",
            regionUsers
        );

    }

    catch (error) {

        console.error(
            "Region Users Load Error:",
            error
        );

        throw error;

    }

}


// ======================================================
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    employees = [];


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


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
            "TOTAL EMPLOYEES:",
            employees.length
        );


        console.log(
            "EMPLOYEES:",
            employees
        );

    }

    catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );

        throw error;

    }

}


// ======================================================
// LOAD DAILY ENTRIES
// ======================================================

async function loadDailyEntries() {

    dailyEntries = [];


    try {

        // ------------------------------------------
        // First try createdAt order
        // ------------------------------------------

        const entriesQuery =
            query(
                collection(
                    db,
                    "daily_entry"
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
            "createdAt order failed. Loading all entries.",
            error
        );


        // ------------------------------------------
        // Fallback
        // ------------------------------------------

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "daily_entry"
                )
            );


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
        "TOTAL DAILY ENTRIES:",
        dailyEntries.length
    );

}


// ======================================================
// GET LATEST ENTRY
// ONE EMPLOYEE + ONE DATE
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
                    entry.date ||
                    entry.entryDate ||
                    ""
                )
                .trim();


            if (!employeeCode) {
                return;
            }


            if (!date) {
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
                getEntryTime(
                    entry
                );


            const existingTime =
                getEntryTime(
                    existing
                );


            if (
                currentTime >=
                existingTime
            ) {

                latestMap.set(
                    key,
                    entry
                );

            }

        }
    );


    const result =
        Array.from(
            latestMap.values()
        );


    // Newest first

    result.sort(
        (a, b) => {

            const timeA =
                getEntryTime(a);

            const timeB =
                getEntryTime(b);


            if (
                timeA !== timeB
            ) {

                return timeB - timeA;

            }


            const dateA =
                String(
                    a.date ||
                    a.entryDate ||
                    ""
                );

            const dateB =
                String(
                    b.date ||
                    b.entryDate ||
                    ""
                );


            return dateB.localeCompare(
                dateA
            );

        }
    );


    console.log(
        "LATEST ENTRIES:",
        result
    );


    return result;

}


// ======================================================
// CHECK ACCESS RULE
// ======================================================

function employeeMatchesRule(
    employee,
    rule
) {

    if (!rule) {
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


    const assignedRegion =
        normalize(

            rule.region ||

            rule.assignedRegion ||

            rule.regionName ||

            rule.region_name ||

            ""

        );


    // ------------------------------------------
    // Region must match
    // ------------------------------------------

    if (
        assignedRegion &&
        assignedRegion !==
        employeeRegion
    ) {

        return false;

    }


    // ------------------------------------------
    // State
    // ------------------------------------------

    const assignedState =
        normalize(

            rule.state ||

            rule.stateName ||

            rule.assignedState ||

            ""

        );


    // ------------------------------------------
    // Full Region
    // ------------------------------------------

    const fullRegion =

        assignedState === "" ||

        assignedState === "*" ||

        assignedState === "all" ||

        assignedState === "all states" ||

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


    // ------------------------------------------
    // Specific State
    // ------------------------------------------

    return (
        assignedState ===
        employeeState
    );

}


// ======================================================
// GET USER ACCESS
// ======================================================

function getUserAccess(user) {

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
// GET USER EMPLOYEES
// ======================================================

function getUserEmployees(user) {

    const accessRules =
        getUserAccess(
            user
        );


    console.log(
        "USER:",
        getUserName(user),
        "ACCESS:",
        accessRules
    );


    // ------------------------------------------------
    // No access
    // ------------------------------------------------

    if (
        accessRules.length === 0
    ) {

        console.warn(
            "No access rules found for user:",
            getUserName(user)
        );


        return [];

    }


    const matchedEmployees =
        employees.filter(
            (employee) => {

                return accessRules.some(
                    (rule) => {

                        return employeeMatchesRule(
                            employee,
                            rule
                        );

                    }
                );

            }
        );


    console.log(
        "USER:",
        getUserName(user),
        "TEACHERS:",
        matchedEmployees.length
    );


    return matchedEmployees;

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
// BUILD USER SUMMARY
// ======================================================

function buildUserSummary() {

    const latestEntries =
        getLatestEntries();


    userSummaryData = [];


    // ------------------------------------------------
    // IMPORTANT:
    // Every region_users document is added.
    // Access rules only decide collection.
    // ------------------------------------------------

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


            const targetUnit =
                getUnit(
                    target
                );


            const collectionUnit =
                getUnit(
                    totalCollection
                );


            const remaining =
                Math.max(
                    target -
                    totalCollection,
                    0
                );


            const remainingUnit =
                getUnit(
                    remaining
                );


            let percentage = 0;


            if (
                target > 0
            ) {

                percentage =
                    (
                        totalCollection /
                        target
                    ) *
                    100;

            }


            // ------------------------------------------------
            // IMPORTANT:
            // Percentage 100 se upar ho sakta hai,
            // lekin progress bar 100 par stop hogi.
            // ------------------------------------------------

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

                targetUnit:
                    targetUnit,

                collection:
                    totalCollection,

                collectionUnit:
                    collectionUnit,

                remaining:
                    remaining,

                remainingUnit:
                    remainingUnit,

                percentage:
                    percentage,

                teacherCount:
                    userEmployees.length,

                originalUser:
                    user

            });


            console.log(
                "USER SUMMARY:",
                getUserName(user),
                "Teachers:",
                userEmployees.length,
                "Collection:",
                totalCollection
            );

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


    if (
        userSummaryTotalUsers
    ) {

        // Agar HTML me Total Users card nahi hai
        // to safely ignore hoga.

        userSummaryTotalUsers.textContent =
            list.length;

    }


    if (
        userSummaryTotalTarget
    ) {

        userSummaryTotalTarget.innerHTML =

            formatCurrency(
                totalTarget
            ) +

            `<small style="
                display:block;
                margin-top:3px;
                font-size:12px;
                color:#555;
            ">
                ${formatUnit(
                    getUnit(totalTarget)
                )}
            </small>`;

    }


    if (
        userSummaryTotalCollection
    ) {

        userSummaryTotalCollection.innerHTML =

            formatCurrency(
                totalCollection
            ) +

            `<small style="
                display:block;
                margin-top:3px;
                font-size:12px;
                color:#555;
            ">
                ${formatUnit(
                    getUnit(totalCollection)
                )}
            </small>`;

    }


    if (
        userSummaryTotalRemaining
    ) {

        userSummaryTotalRemaining.innerHTML =

            formatCurrency(
                totalRemaining
            ) +

            `<small style="
                display:block;
                margin-top:3px;
                font-size:12px;
                color:#555;
            ">
                ${formatUnit(
                    getUnit(totalRemaining)
                )}
            </small>`;

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


    // ------------------------------------------------
    // No users
    // ------------------------------------------------

    if (
        list.length === 0
    ) {

        userSummaryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="no-data"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    <i class="fa-solid fa-users"></i>

                    <br><br>

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
                Number(
                    user.percentage || 0
                );


            const progress =
                Math.min(
                    Math.max(
                        percentage,
                        0
                    ),
                    100
                );


            // ------------------------------------------------
            // Percentage Class
            // ------------------------------------------------

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


            const teacherCount =
                Number(
                    user.teacherCount || 0
                );


            html += `

                <tr>

                    <!-- # -->

                    <td>
                        ${index + 1}
                    </td>


                    <!-- USER NAME -->

                    <td>

                        <div
                            class="user-name-cell"
                            style="
                                min-width:170px;
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    gap:6px;
                                    align-items:center;
                                "
                            >

                                <input
                                    type="text"
                                    class="user-name-input"
                                    data-id="${escapeHTML(user.id)}"
                                    value="${userName}"
                                    placeholder="User Name"
                                    style="
                                        width:160px;
                                    "
                                >

                                <button
                                    type="button"
                                    class="save-user-name-btn"
                                    data-id="${escapeHTML(user.id)}"
                                    title="Save User Name"
                                >

                                    <i
                                        class="fa-solid fa-floppy-disk"
                                    ></i>

                                </button>

                            </div>


                            <small
                                style="
                                    display:block;
                                    margin-top:6px;
                                    color:#334155;
                                "
                            >

                                <i
                                    class="fa-solid fa-user"
                                    style="
                                        color:#2563eb;
                                    "
                                ></i>

                                User:

                                <strong>
                                    ${userName}
                                </strong>

                            </small>


                            ${
                                userCode
                                    ? `
                                        <small
                                            style="
                                                display:block;
                                                color:#64748b;
                                                margin-top:2px;
                                            "
                                        >
                                            Code:
                                            ${userCode}
                                        </small>
                                    `
                                    : ""
                            }


                            <small
                                style="
                                    display:block;
                                    color:#64748b;
                                    margin-top:2px;
                                "
                            >

                                ${teacherCount}

                                Teacher

                            </small>

                        </div>

                    </td>


                    <!-- TARGET -->

                    <td>

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:6px;
                            "
                        >

                            <input
                                type="number"
                                min="0"
                                class="user-target-input"
                                data-id="${escapeHTML(user.id)}"
                                value="${user.target || ""}"
                                placeholder="Enter Target"
                                style="
                                    width:125px;
                                "
                            >


                            <button
                                type="button"
                                class="save-user-target-btn"
                                data-id="${escapeHTML(user.id)}"
                                title="Save Target"
                            >

                                <i
                                    class="fa-solid fa-floppy-disk"
                                ></i>

                            </button>

                        </div>

                    </td>


                    <!-- TARGET UNIT -->

                    <td
                        style="
                            color:#059669;
                            font-weight:600;
                            white-space:nowrap;
                        "
                    >

                        ${formatUnit(
                            user.targetUnit
                        )}

                    </td>


                    <!-- TOTAL COLLECTION -->

                    <td
                        style="
                            color:#ef0000;
                            font-weight:500;
                            white-space:nowrap;
                        "
                    >

                        ${formatCurrency(
                            user.collection
                        )}

                    </td>


                    <!-- COLLECTION UNIT -->

                    <td
                        style="
                            color:#059669;
                            font-weight:600;
                            white-space:nowrap;
                        "
                    >

                        ${formatUnit(
                            user.collectionUnit
                        )}

                    </td>


                    <!-- REMAINING -->

                    <td
                        style="
                            color:#ef0000;
                            font-weight:500;
                            white-space:nowrap;
                        "
                    >

                        ${formatCurrency(
                            user.remaining
                        )}

                    </td>


                    <!-- REMAINING UNIT -->

                    <td
                        style="
                            color:#334155;
                            font-weight:600;
                            white-space:nowrap;
                        "
                    >

                        ${formatUnit(
                            user.remainingUnit
                        )}

                    </td>


                    <!-- PERCENTAGE -->

                    <td>

                        <div
                            class="percentage-wrapper"
                            style="
                                min-width:120px;
                            "
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
                                style="
                                    width:100%;
                                    margin-top:7px;
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
    // SAVE USER TARGET
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


                        if (
                            target < 0
                        ) {

                            alert(
                                "Please enter a valid Target."
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


                        const oldHTML =
                            button.innerHTML;


                        button.disabled =
                            true;


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
                                    "region_users",
                                    userId
                                ),

                                {

                                    target:
                                        target,

                                    targetAmount:
                                        target,

                                    manualTarget:
                                        target,

                                    manual_target:
                                        target,

                                    updatedAt:
                                        new Date()

                                },

                                {
                                    merge: true
                                }

                            );


                            // Update local data

                            user.target =
                                target;


                            user.targetUnit =
                                getUnit(
                                    target
                                );


                            user.remaining =
                                Math.max(
                                    target -
                                    user.collection,
                                    0
                                );


                            user.remainingUnit =
                                getUnit(
                                    user.remaining
                                );


                            user.percentage =
                                target > 0

                                    ? (
                                        user.collection /
                                        target
                                    ) *
                                    100

                                    : 0;


                            displayUserSummary(
                                userSummaryData
                            );


                            console.log(
                                "Target Saved:",
                                user.userName,
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
            ".save-user-name-btn"
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
                                `.user-name-input[data-id="${CSS.escape(userId)}"]`
                            );


                        if (!input) {
                            return;
                        }


                        const newName =
                            input.value.trim();


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


                        const oldHTML =
                            button.innerHTML;


                        button.disabled =
                            true;


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
                                    "region_users",
                                    userId
                                ),

                                {

                                    userName:
                                        newName,

                                    name:
                                        newName,

                                    updatedAt:
                                        new Date()

                                },

                                {
                                    merge: true
                                }

                            );


                            user.userName =
                                newName;


                            displayUserSummary(
                                userSummaryData
                            );


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


                            button.disabled =
                                false;


                            button.innerHTML =
                                oldHTML;

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
                            .includes(
                                search
                            )

                            ||

                            normalize(
                                user.userCode
                            )
                            .includes(
                                search
                            )

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
// OLD COLLECTION SUMMARY
// ======================================================

async function loadRecentCollections() {

    try {

        const latestEntries =
            getLatestEntries();


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


                const entryDate =
                    String(
                        data.date ||
                        data.entryDate ||
                        ""
                    );


                if (
                    entryDate ===
                    todayStr
                ) {

                    todayCollection +=
                        amount;

                }


                const employeeCode =
                    getEntryEmployeeCode(
                        data
                    ) || "-";


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
                    entryDate ||
                    "-";


                tableRowsHTML += `

                    <tr>

                        <td>
                            ${escapeHTML(
                                date
                            )}
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


        // ------------------------------------------
        // Total Collection
        // ------------------------------------------

        if (
            totalAmountEl
        ) {

            totalAmountEl.innerHTML =

                formatCurrency(
                    totalCollection
                ) +

                `<small style="
                    display:block;
                    margin-top:3px;
                    font-size:12px;
                    color:#555;
                ">
                    ${formatUnit(
                        getUnit(
                            totalCollection
                        )
                    )}
                </small>`;

        }


        // ------------------------------------------
        // Today's Collection
        // ------------------------------------------

        if (
            todayAmountEl
        ) {

            todayAmountEl.innerHTML =

                formatCurrency(
                    todayCollection
                ) +

                `<small style="
                    display:block;
                    margin-top:3px;
                    font-size:12px;
                    color:#555;
                ">
                    ${formatUnit(
                        getUnit(
                            todayCollection
                        )
                    )}
                </small>`;

        }


        // ------------------------------------------
        // Entries Count
        // ------------------------------------------

        if (
            totalEntriesCountEl
        ) {

            totalEntriesCountEl.textContent =
                latestEntries.length;

        }


        // ------------------------------------------
        // Table
        // ------------------------------------------

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
// MAIN LOAD
// ======================================================

async function loadDashboard() {

    try {

        // ------------------------------------------
        // Loading
        // ------------------------------------------

        if (
            userSummaryTableBody
        ) {

            userSummaryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="no-data"
                        style="
                            text-align:center;
                            padding:30px;
                        "
                    >

                        <i
                            class="
                                fa-solid
                                fa-spinner
                                fa-spin
                            "
                        ></i>

                        Loading Users & Collection...

                    </td>

                </tr>

            `;

        }


        // ------------------------------------------
        // Load all data
        // ------------------------------------------

        await Promise.all([

            loadRegionUsers(),

            loadEmployees(),

            loadDailyEntries()

        ]);


        console.log(
            "================================"
        );

        console.log(
            "DASHBOARD DATA LOADED"
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
            "Daily Entries:",
            dailyEntries.length
        );

        console.log(
            "================================"
        );


        // ------------------------------------------
        // Build Summary
        // ------------------------------------------

        buildUserSummary();


        // ------------------------------------------
        // Display Summary
        // ------------------------------------------

        displayUserSummary(
            userSummaryData
        );


        // ------------------------------------------
        // Old Collection
        // ------------------------------------------

        await loadRecentCollections();


        console.log(
            "DASHBOARD LOADED SUCCESSFULLY"
        );

    }

    catch (error) {

        console.error(
            "DASHBOARD LOAD ERROR:",
            error
        );


        if (
            userSummaryTableBody
        ) {

            userSummaryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="no-data"
                        style="
                            color:red;
                            text-align:center;
                            padding:30px;
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
// START DASHBOARD
// ======================================================

loadDashboard();
