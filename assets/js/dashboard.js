// ============================================================
// TELETHON - ADMIN DASHBOARD
// ============================================================
// FINAL VERSION
//
// Firestore collections used:
// 1. regionUsers   -> Dashboard users
// 2. employees     -> Teacher/Employee data
// 3. daily_entry   -> Daily collection
//
// IMPORTANT:
// region_users collection is NOT USED.
// ============================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// SETTINGS
// ============================================================

const UNIT_VALUE = 7000;

const REGION_USERS_COLLECTION = "regionUsers";
const EMPLOYEES_COLLECTION = "employees";
const DAILY_ENTRY_COLLECTION = "daily_entry";


// ============================================================
// GLOBAL DATA
// ============================================================

let regionUsers = [];
let employees = [];
let dailyEntries = [];


// ============================================================
// DOM
// ============================================================

const tableBody =
    document.getElementById("userSummaryBody") ||
    document.getElementById("userTableBody") ||
    document.querySelector("#userSummaryTable tbody");

const searchInput =
    document.getElementById("searchUser") ||
    document.getElementById("userSearch");

const refreshBtn =
    document.getElementById("refreshData") ||
    document.getElementById("refreshBtn");


// ============================================================
// SAFE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// NUMBER
// ============================================================

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

    const cleaned =
        String(value)
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .replace(/\s/g, "")
            .trim();

    const number =
        Number(cleaned);

    return Number.isFinite(number)
        ? number
        : 0;
}


// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value) {

    const amount =
        Math.round(numberValue(value));

    return (
        "₹ " +
        amount.toLocaleString("en-IN")
    );
}


// ============================================================
// UNITS
// ============================================================

function calculateUnits(amount) {

    return numberValue(amount) / UNIT_VALUE;
}


function formatUnits(amount) {

    const units =
        calculateUnits(amount);

    if (Number.isInteger(units)) {
        return units.toLocaleString("en-IN");
    }

    return units.toFixed(2);
}


// ============================================================
// PERCENTAGE
// ============================================================

function calculatePercentage(
    collectionAmount,
    targetAmount
) {

    const target =
        numberValue(targetAmount);

    const collection =
        numberValue(collectionAmount);

    if (target <= 0) {
        return 0;
    }

    const percentage =
        (collection / target) * 100;

    return Math.min(
        Math.max(percentage, 0),
        100
    );
}


// ============================================================
// GET FIELD
// ============================================================

function getFirstValue(
    object,
    fields
) {

    if (!object) {
        return "";
    }

    for (const field of fields) {

        if (
            object[field] !== undefined &&
            object[field] !== null &&
            object[field] !== ""
        ) {

            return object[field];

        }

    }

    return "";
}


// ============================================================
// GET USER NAME
// ============================================================

function getRegionUserName(user) {

    return (
        getFirstValue(
            user,
            [
                "userName",
                "name",
                "username",
                "displayName"
            ]
        ) ||
        "Unnamed User"
    );
}


// ============================================================
// GET USER CODE
// ============================================================

function getRegionUserCode(user) {

    return String(
        getFirstValue(
            user,
            [
                "userCode",
                "employeeCode",
                "code"
            ]
        ) || user.id || ""
    ).trim();
}


// ============================================================
// GET TARGET
// ============================================================

function getTarget(user) {

    return numberValue(
        getFirstValue(
            user,
            [
                "targetAmount",
                "manualTarget",
                "manual_target",
                "target"
            ]
        )
    );
}


// ============================================================
// GET EMPLOYEE CODE
// ============================================================

function getEmployeeCode(employee) {

    return String(
        getFirstValue(
            employee,
            [
                "employeeCode",
                "employee_code",
                "userCode",
                "code"
            ]
        ) || ""
    ).trim();
}


// ============================================================
// GET EMPLOYEE REGION
// ============================================================

function getEmployeeRegion(employee) {

    return String(
        getFirstValue(
            employee,
            [
                "region",
                "Region"
            ]
        ) || ""
    ).trim();
}


// ============================================================
// GET EMPLOYEE STATE
// ============================================================

function getEmployeeState(employee) {

    return String(
        getFirstValue(
            employee,
            [
                "state",
                "State"
            ]
        ) || ""
    ).trim();
}


// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


// ============================================================
// ACCESS MATCH
// ============================================================

function employeeMatchesAccess(
    employee,
    access
) {

    if (!Array.isArray(access)) {
        return false;
    }

    const employeeRegion =
        normalizeText(
            getEmployeeRegion(employee)
        );

    const employeeState =
        normalizeText(
            getEmployeeState(employee)
        );


    if (
        !employeeRegion &&
        !employeeState
    ) {
        return false;
    }


    return access.some(
        rule => {

            if (!rule) {
                return false;
            }

            const ruleRegion =
                normalizeText(
                    rule.region
                );

            const ruleState =
                normalizeText(
                    rule.state
                );


            if (!ruleRegion) {
                return false;
            }


            // Region must match
            if (
                employeeRegion !==
                ruleRegion
            ) {
                return false;
            }


            // "*" means complete region
            if (
                ruleState === "*" ||
                ruleState === "" ||
                ruleState === "full region"
            ) {

                return true;

            }


            // Otherwise state must match
            return (
                employeeState ===
                ruleState
            );

        }
    );
}


// ============================================================
// GET EMPLOYEE COLLECTION
// ============================================================

function getEmployeeCollectionAmount(
    employee
) {

    return numberValue(
        getFirstValue(
            employee,
            [
                "totalCollection",
                "total_collection",
                "collection",
                "collectionAmount",
                "amount"
            ]
        )
    );
}


// ============================================================
// GET DAILY ENTRY AMOUNT
// ============================================================

function getDailyEntryAmount(entry) {

    return numberValue(
        getFirstValue(
            entry,
            [
                "amount",
                "collection",
                "collectionAmount",
                "totalCollection",
                "total_collection"
            ]
        )
    );
}


// ============================================================
// DAILY ENTRY EMPLOYEE CODE
// ============================================================

function getDailyEntryEmployeeCode(entry) {

    return String(
        getFirstValue(
            entry,
            [
                "employeeCode",
                "employee_code",
                "empCode",
                "emp_code",
                "userCode",
                "employeeId"
            ]
        ) || ""
    ).trim();

}


// ============================================================
// EMPLOYEE NAME
// ============================================================

function getEmployeeName(employee) {

    return String(
        getFirstValue(
            employee,
            [
                "teacherName",
                "userName",
                "name",
                "employeeName"
            ]
        ) || ""
    ).trim();

}


// ============================================================
// CALCULATE USER COLLECTION
// ============================================================
//
// Logic:
//
// 1. User ke access rules dekhenge.
// 2. Matching employees identify honge.
// 3. Daily entries agar employee code ke saath hain,
//    to daily collection use hogi.
// 4. Agar daily entry nahi hai,
//    to employee.totalCollection use hoga.
//
// ============================================================

function calculateUserCollection(
    user
) {

    const access =
        Array.isArray(user.access)
            ? user.access
            : [];


    if (access.length === 0) {

        return {
            amount: 0,
            teacherCount: 0
        };

    }


    // --------------------------------------------------------
    // Matching employees
    // --------------------------------------------------------

    const matchedEmployees =
        employees.filter(
            employee =>
                employeeMatchesAccess(
                    employee,
                    access
                )
        );


    const matchedCodes =
        new Set();


    matchedEmployees.forEach(
        employee => {

            const code =
                getEmployeeCode(employee);

            if (code) {
                matchedCodes.add(code);
            }

        }
    );


    // --------------------------------------------------------
    // If no employee matches
    // --------------------------------------------------------

    if (
        matchedEmployees.length === 0
    ) {

        return {
            amount: 0,
            teacherCount: 0
        };

    }


    // --------------------------------------------------------
    // DAILY COLLECTION
    // --------------------------------------------------------

    let dailyAmount = 0;

    let dailyEntriesFound = false;


    dailyEntries.forEach(
        entry => {

            const code =
                getDailyEntryEmployeeCode(
                    entry
                );


            if (!code) {
                return;
            }


            if (
                matchedCodes.has(code)
            ) {

                dailyAmount +=
                    getDailyEntryAmount(
                        entry
                    );

                dailyEntriesFound = true;

            }

        }
    );


    // --------------------------------------------------------
    // If daily entries found,
    // use them.
    // --------------------------------------------------------

    if (dailyEntriesFound) {

        return {
            amount: dailyAmount,
            teacherCount:
                matchedEmployees.length
        };

    }


    // --------------------------------------------------------
    // Otherwise use employee totalCollection
    // --------------------------------------------------------

    let employeeTotal = 0;


    matchedEmployees.forEach(
        employee => {

            employeeTotal +=
                getEmployeeCollectionAmount(
                    employee
                );

        }
    );


    return {

        amount:
            employeeTotal,

        teacherCount:
            matchedEmployees.length

    };

}


// ============================================================
// LOAD REGION USERS
// ============================================================

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
        item => {

            const data =
                item.data();


            // Only Active users
            // If status does not exist,
            // user will still be shown.

            const status =
                String(
                    data.status ||
                    "Active"
                ).toLowerCase();


            if (
                status === "active" ||
                status === "approved" ||
                status === ""
            ) {

                regionUsers.push({

                    id:
                        item.id,

                    ...data

                });

            }

        }
    );


    // Sort by user code

    regionUsers.sort(
        (a, b) => {

            const codeA =
                getRegionUserCode(a);

            const codeB =
                getRegionUserCode(b);


            return codeA.localeCompare(
                codeB,
                undefined,
                {
                    numeric: true
                }
            );

        }
    );


    console.log(
        "REGION USERS:",
        regionUsers
    );

}


// ============================================================
// LOAD EMPLOYEES
// ============================================================

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
        item => {

            employees.push({

                id:
                    item.id,

                ...item.data()

            });

        }
    );


    console.log(
        "TOTAL EMPLOYEES:",
        employees.length
    );

}


// ============================================================
// LOAD DAILY ENTRIES
// ============================================================

async function loadDailyEntries() {

    const snapshot =
        await getDocs(
            collection(
                db,
                DAILY_ENTRY_COLLECTION
            )
        );


    dailyEntries = [];


    snapshot.forEach(
        item => {

            dailyEntries.push({

                id:
                    item.id,

                ...item.data()

            });

        }
    );


    console.log(
        "TOTAL DAILY ENTRIES:",
        dailyEntries.length
    );

}


// ============================================================
// UPDATE DASHBOARD CARDS
// ============================================================

function updateDashboardCards(
    totalTarget,
    totalCollection
) {

    const remainingTarget =
        Math.max(
            totalTarget -
            totalCollection,
            0
        );


    const overallPercentage =
        totalTarget > 0
            ? (
                totalCollection /
                totalTarget
            ) * 100
            : 0;


    // --------------------------------------------------------
    // TOTAL TARGET
    // --------------------------------------------------------

    const totalTargetElement =
        document.getElementById(
            "totalTarget"
        );

    if (totalTargetElement) {

        totalTargetElement.innerHTML = `

            ${formatCurrency(
                totalTarget
            )}

            <small>
                ${formatUnits(
                    totalTarget
                )} Unit
            </small>

        `;

    }


    // --------------------------------------------------------
    // TOTAL COLLECTION
    // --------------------------------------------------------

    const totalCollectionElement =
        document.getElementById(
            "totalCollection"
        );

    if (totalCollectionElement) {

        totalCollectionElement.innerHTML = `

            ${formatCurrency(
                totalCollection
            )}

            <small>
                ${formatUnits(
                    totalCollection
                )} Unit
            </small>

        `;

    }


    // --------------------------------------------------------
    // REMAINING TARGET
    // --------------------------------------------------------

    const remainingTargetElement =
        document.getElementById(
            "remainingTarget"
        );

    if (remainingTargetElement) {

        remainingTargetElement.innerHTML = `

            ${formatCurrency(
                remainingTarget
            )}

            <small>
                ${formatUnits(
                    remainingTarget
                )} Unit
            </small>

        `;

    }


    // --------------------------------------------------------
    // OVERALL PERCENTAGE
    // --------------------------------------------------------

    const overallPercentageElement =
        document.getElementById(
            "overallPercentage"
        );

    if (overallPercentageElement) {

        overallPercentageElement.textContent =
            overallPercentage.toFixed(2) + "%";

    }


    // --------------------------------------------------------
    // OLD TOTAL USERS
    // --------------------------------------------------------

    const totalUsersElement =
        document.getElementById(
            "totalUsers"
        );

    if (totalUsersElement) {

        totalUsersElement.textContent =
            regionUsers.length;

    }

}


// ============================================================
// RENDER USER TABLE
// ============================================================

function renderUserTable(
    users = regionUsers
) {

    if (!tableBody) {

        console.error(
            "Dashboard table body not found."
        );

        return;

    }


    if (users.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding:45px;
                    "
                >

                    <div
                        style="
                            font-size:30px;
                            margin-bottom:10px;
                        "
                    >
                        👥
                    </div>

                    <div
                        style="
                            font-size:15px;
                            color:#555;
                        "
                    >
                        Koi Region User nahi mila.
                    </div>

                    <div
                        style="
                            font-size:12px;
                            color:#999;
                            margin-top:5px;
                        "
                    >
                        Firestore: regionUsers
                    </div>

                </td>

            </tr>

        `;

        updateDashboardCards(0, 0);

        return;

    }


    let totalTarget = 0;
    let totalCollection = 0;


    let html = "";


    users.forEach(
        (user, index) => {

            const userName =
                getRegionUserName(
                    user
                );


            const userCode =
                getRegionUserCode(
                    user
                );


            const target =
                getTarget(user);


            const result =
                calculateUserCollection(
                    user
                );


            const collectionAmount =
                result.amount;


            const remaining =
                Math.max(
                    target -
                    collectionAmount,
                    0
                );


            const targetUnits =
                calculateUnits(
                    target
                );


            const collectionUnits =
                calculateUnits(
                    collectionAmount
                );


            const remainingUnits =
                calculateUnits(
                    remaining
                );


            const percentage =
                calculatePercentage(
                    collectionAmount,
                    target
                );


            totalTarget +=
                target;


            totalCollection +=
                collectionAmount;


            // ------------------------------------------------
            // ACCESS TEXT
            // ------------------------------------------------

            const access =
                Array.isArray(
                    user.access
                )
                    ? user.access
                    : [];


            let accessText =
                "";


            if (
                access.length > 0
            ) {

                accessText =
                    access
                        .map(
                            item => {

                                const region =
                                    item.region ||
                                    "";

                                const state =
                                    item.state ||
                                    "*";


                                if (
                                    state === "*" ||
                                    state === "" ||
                                    state === "Full Region"
                                ) {

                                    return escapeHTML(
                                        region
                                    );

                                }


                                return (
                                    escapeHTML(
                                        region
                                    ) +
                                    " → " +
                                    escapeHTML(
                                        state
                                    )
                                );

                            }
                        )
                        .join(
                            ", "
                        );

            }


            html += `

                <tr>

                    <!-- NUMBER -->

                    <td>

                        ${index + 1}

                    </td>


                    <!-- USER NAME -->

                    <td>

                        <div
                            class="user-name-cell"
                        >

                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:7px;
                                "
                            >

                                <input
                                    type="text"
                                    class="user-name-input"
                                    data-id="${escapeHTML(user.id)}"
                                    value="${escapeHTML(userName)}"
                                    placeholder="Enter User Name"
                                >

                                <button
                                    type="button"
                                    class="save-user-name"
                                    data-id="${escapeHTML(user.id)}"
                                    title="Save User Name"
                                    style="
                                        width:38px;
                                        height:38px;
                                        border:0;
                                        border-radius:8px;
                                        background:#2563eb;
                                        color:#fff;
                                        cursor:pointer;
                                    "
                                >
                                    <i class="fa-solid fa-floppy-disk"></i>
                                </button>

                            </div>


                            <div
                                style="
                                    margin-top:6px;
                                    font-size:13px;
                                    color:#475569;
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
                                    ${escapeHTML(
                                        userName
                                    )}
                                </strong>

                            </div>


                            ${
                                userCode
                                    ? `
                                        <div
                                            style="
                                                margin-top:3px;
                                                font-size:11px;
                                                color:#94a3b8;
                                            "
                                        >
                                            Code:
                                            ${escapeHTML(
                                                userCode
                                            )}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    </td>


                    <!-- TARGET -->

                    <td>

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:7px;
                            "
                        >

                            <input
                                type="number"
                                min="0"
                                step="1"
                                class="target-input"
                                data-id="${escapeHTML(user.id)}"
                                value="${target || ""}"
                                placeholder="Enter Target"
                                style="
                                    width:125px;
                                "
                            >

                            <button
                                type="button"
                                class="save-target"
                                data-id="${escapeHTML(user.id)}"
                                title="Save Target"
                                style="
                                    width:38px;
                                    height:38px;
                                    border:0;
                                    border-radius:8px;
                                    background:#16a34a;
                                    color:#fff;
                                    cursor:pointer;
                                "
                            >

                                <i
                                    class="fa-solid fa-floppy-disk"
                                ></i>

                            </button>

                        </div>

                    </td>


                    <!-- TARGET UNIT -->

                    <td>

                        <strong
                            style="
                                color:#059669;
                                white-space:nowrap;
                            "
                        >

                            ${formatUnits(
                                target
                            )} Unit

                        </strong>

                    </td>


                    <!-- TOTAL COLLECTION -->

                    <td>

                        <strong
                            style="
                                color:#ef4444;
                                white-space:nowrap;
                            "
                        >

                            ${formatCurrency(
                                collectionAmount
                            )}

                        </strong>

                    </td>


                    <!-- COLLECTION UNIT -->

                    <td>

                        <strong
                            style="
                                color:#059669;
                                white-space:nowrap;
                            "
                        >

                            ${formatUnits(
                                collectionAmount
                            )} Unit

                        </strong>

                    </td>


                    <!-- REMAINING TARGET -->

                    <td>

                        <strong
                            style="
                                color:#ef4444;
                                white-space:nowrap;
                            "
                        >

                            ${formatCurrency(
                                remaining
                            )}

                        </strong>

                    </td>


                    <!-- REMAINING UNIT -->

                    <td>

                        <strong
                            style="
                                color:#334155;
                                white-space:nowrap;
                            "
                        >

                            ${formatUnits(
                                remaining
                            )} Unit

                        </strong>

                    </td>


                    <!-- PERCENTAGE -->

                    <td>

                        <div
                            style="
                                min-width:120px;
                            "
                        >

                            <span
                                style="
                                    display:inline-block;
                                    padding:5px 10px;
                                    border-radius:20px;
                                    background:#fee2e2;
                                    color:#ef4444;
                                    font-size:11px;
                                    font-weight:600;
                                "
                            >

                                ${percentage.toFixed(2)}%

                            </span>


                            <div
                                style="
                                    width:100%;
                                    height:7px;
                                    background:#e5e7eb;
                                    border-radius:10px;
                                    margin-top:7px;
                                    overflow:hidden;
                                "
                            >

                                <div
                                    style="
                                        width:${percentage}%;
                                        height:100%;
                                        background:#2563eb;
                                        border-radius:10px;
                                    "
                                ></div>

                            </div>

                        </div>

                    </td>

                </tr>

            `;

        }
    );


    tableBody.innerHTML =
        html;


    // ========================================================
    // UPDATE CARDS
    // ========================================================

    updateDashboardCards(
        totalTarget,
        totalCollection
    );


    // ========================================================
    // TARGET SAVE BUTTONS
    // ========================================================

    document
        .querySelectorAll(
            ".save-target"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function () {

                        const id =
                            this.dataset.id;


                        const input =
                            document.querySelector(
                                `.target-input[data-id="${CSS.escape(id)}"]`
                            );


                        if (!input) {
                            return;
                        }


                        const target =
                            numberValue(
                                input.value
                            );


                        try {

                            this.disabled =
                                true;


                            await updateDoc(

                                doc(
                                    db,
                                    REGION_USERS_COLLECTION,
                                    id
                                ),

                                {
                                    target:
                                        target,

                                    targetAmount:
                                        target,

                                    manualTarget:
                                        target,

                                    manual_target:
                                        target
                                }

                            );


                            const user =
                                regionUsers.find(
                                    item =>
                                        item.id === id
                                );


                            if (user) {

                                user.target =
                                    target;

                                user.targetAmount =
                                    target;

                                user.manualTarget =
                                    target;

                                user.manual_target =
                                    target;

                            }


                            renderUserTable(
                                getFilteredUsers()
                            );


                        }

                        catch (error) {

                            console.error(
                                "Target Save Error:",
                                error
                            );


                            alert(
                                "Target save nahi hua.\n\n" +
                                error.message
                            );

                        }

                        finally {

                            this.disabled =
                                false;

                        }

                    }
                );

            }
        );


    // ========================================================
    // USER NAME SAVE BUTTONS
    // ========================================================

    document
        .querySelectorAll(
            ".save-user-name"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function () {

                        const id =
                            this.dataset.id;


                        const input =
                            document.querySelector(
                                `.user-name-input[data-id="${CSS.escape(id)}"]`
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

                            input.focus();

                            return;

                        }


                        try {

                            this.disabled =
                                true;


                            await updateDoc(

                                doc(
                                    db,
                                    REGION_USERS_COLLECTION,
                                    id
                                ),

                                {
                                    userName:
                                        newName,

                                    name:
                                        newName
                                }

                            );


                            const user =
                                regionUsers.find(
                                    item =>
                                        item.id === id
                                );


                            if (user) {

                                user.userName =
                                    newName;

                                user.name =
                                    newName;

                            }


                            renderUserTable(
                                getFilteredUsers()
                            );

                        }

                        catch (error) {

                            console.error(
                                "User Name Save Error:",
                                error
                            );


                            alert(
                                "User Name save nahi hua.\n\n" +
                                error.message
                            );

                        }

                        finally {

                            this.disabled =
                                false;

                        }

                    }
                );

            }
        );

}


// ============================================================
// FILTER USERS
// ============================================================

function getFilteredUsers() {

    if (!searchInput) {

        return regionUsers;

    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!search) {

        return regionUsers;

    }


    return regionUsers.filter(
        user => {

            const name =
                getRegionUserName(
                    user
                ).toLowerCase();


            const code =
                getRegionUserCode(
                    user
                ).toLowerCase();


            return (
                name.includes(search) ||
                code.includes(search)
            );

        }
    );

}


// ============================================================
// SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            renderUserTable(
                getFilteredUsers()
            );

        }
    );

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        console.log(
            "======================================"
        );

        console.log(
            "TELETHON DASHBOARD LOADING..."
        );

        console.log(
            "======================================"
        );


        // ----------------------------------------------------
        // LOAD ALL REQUIRED DATA
        // ----------------------------------------------------

        await Promise.all([

            loadRegionUsers(),

            loadEmployees(),

            loadDailyEntries()

        ]);


        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        renderUserTable(
            regionUsers
        );


        console.log(
            "======================================"
        );

        console.log(
            "DASHBOARD LOADED SUCCESSFULLY"
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
            "======================================"
        );

    }

    catch (error) {

        console.error(
            "Dashboard Load Error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        style="
                            text-align:center;
                            padding:40px;
                            color:#dc2626;
                        "
                    >

                        <strong>
                            Dashboard data load nahi hua.
                        </strong>

                        <br>

                        <small>
                            ${escapeHTML(
                                error.message
                            )}
                        </small>

                    </td>

                </tr>

            `;

        }

    }

}


// ============================================================
// REFRESH
// ============================================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async function () {

            const originalHTML =
                this.innerHTML;


            this.disabled =
                true;


            this.innerHTML = `

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

                Loading...

            `;


            try {

                await loadDashboard();

            }

            finally {

                this.disabled =
                    false;

                this.innerHTML =
                    originalHTML;

            }

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

const logoutButtons =
    document.querySelectorAll(
        "#logoutBtn, .logout-btn, [data-action='logout']"
    );


logoutButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                try {

                    await signOut(auth);

                    window.location.href =
                        "index.html";

                }

                catch (error) {

                    console.error(
                        "Logout Error:",
                        error
                    );

                    alert(
                        "Logout nahi hua."
                    );

                }

            }
        );

    }
);


// ============================================================
// AUTH CHECK
// ============================================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            console.log(
                "No logged-in user."
            );

            // Agar aapka existing auth system
            // dashboard ko direct allow karta hai,
            // to yahan redirect nahi karenge.

            return;

        }


        console.log(
            "Logged-in Admin:",
            user.email || user.uid
        );


        await loadDashboard();

    }
);


// ============================================================
// FALLBACK
// ============================================================
//
// Agar Firebase auth state late aaye,
// dashboard ko phir bhi load kar denge.
// ============================================================

setTimeout(
    function () {

        if (
            regionUsers.length === 0
        ) {

            loadDashboard();

        }

    },
    1200
);
