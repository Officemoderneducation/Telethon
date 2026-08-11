// ======================================================
// TELETHON ADMIN DASHBOARD
// User Wise Target + Teacher Collection Summary
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
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ======================================================
// CONSTANT
// ======================================================

// 1 Unit = ₹7,000
const UNIT_VALUE = 7000;

// ======================================================
// HTML ELEMENTS
// ======================================================

// Summary cards

const userSummaryTotalUsers =
    document.getElementById("userSummaryTotalUsers");

const userSummaryTotalTarget =
    document.getElementById("userSummaryTotalTarget");

const userSummaryTotalCollection =
    document.getElementById("userSummaryTotalCollection");

const userSummaryTotalRemaining =
    document.getElementById("userSummaryTotalRemaining");

// Main user summary table

const userSummaryTableBody =
    document.getElementById("userSummaryTableBody");

const userSummarySearch =
    document.getElementById("userSummarySearch");

// Old collection cards

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");

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
        .toLowerCase()
        .replace(/\s+/g, " ");
}

// ======================================================
// NUMBER
// ======================================================

function numberValue(value) {

    const number = Number(
        String(value ?? "")
            .replace(/,/g, "")
            .replace(/₹/g, "")
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

function calculateUnit(amount) {

    return Number(amount || 0) / UNIT_VALUE;
}

// ======================================================
// UNIT DISPLAY
// ======================================================

function formatUnit(amount) {

    const unit = calculateUnit(amount);

    return `${unit.toFixed(2)} Unit`;
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
// GET REGIONS FROM USER NAME
// ======================================================
//
// IMPORTANT:
//
// Region Users collection me abhi access field nahi hai.
// Isliye User Name ke basis par region identify kiya jayega.
//
// Example:
//
// Delhi Region
//      -> Delhi
//
// Kolkata Region & Bihar
//      -> Kolkata + Bihar
//
// Rajasthan State
//      -> Rajasthan
//
// HYD & BLR Region
//      -> Hyderabad + Bangalore
//
// ======================================================

function getUserRegions(user) {

    const userName = normalize(
        getUserName(user)
    );

    const regions = [];

    // ==================================================
    // DELHI
    // ==================================================

    if (
        userName.includes("delhi")
    ) {

        regions.push("delhi");
    }

    // ==================================================
    // RAJASTHAN
    // ==================================================

    if (
        userName.includes("rajasthan")
    ) {

        regions.push("rajasthan");
    }

    // ==================================================
    // KOLKATA
    // ==================================================

    if (
        userName.includes("kolkata")
    ) {

        regions.push("kolkata");
    }

    // ==================================================
    // BIHAR
    // ==================================================

    if (
        userName.includes("bihar")
    ) {

        regions.push("bihar");
    }

    // ==================================================
    // HYDERABAD
    // ==================================================

    if (
        userName.includes("hyd") ||
        userName.includes("hyderabad")
    ) {

        regions.push("hyderabad");
    }

    // ==================================================
    // BANGALORE
    // ==================================================

    if (
        userName.includes("blr") ||
        userName.includes("bangalore") ||
        userName.includes("bengaluru")
    ) {

        regions.push("bangalore");
        regions.push("bengaluru");
    }

    // ==================================================
    // MUMBAI
    // ==================================================

    if (
        userName.includes("mumbai")
    ) {

        regions.push("mumbai");
    }

    // ==================================================
    // AJMER
    // ==================================================

    if (
        userName.includes("ajmer")
    ) {

        regions.push("ajmer");
    }

    // ==================================================
    // GUJARAT
    // ==================================================

    if (
        userName.includes("gujarat")
    ) {

        regions.push("gujarat");
    }

    // ==================================================
    // MADHYA PRADESH
    // ==================================================

    if (
        userName.includes("m.p.") ||
        userName.includes("mp") ||
        userName.includes("madhya pradesh")
    ) {

        regions.push("m.p.");
        regions.push("mp");
        regions.push("madhya pradesh");
    }

    // ==================================================
    // BANGALORE REGION
    // ==================================================

    if (
        userName.includes("bangalore region")
    ) {

        regions.push("bangalore");
        regions.push("bengaluru");
    }

    // ==================================================
    // HYDERABAD REGION
    // ==================================================

    if (
        userName.includes("hyderabad region")
    ) {

        regions.push("hyderabad");
    }

    // ==================================================
    // REMOVE DUPLICATES
    // ==================================================

    return [
        ...new Set(regions)
    ];
}

// ======================================================
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "employees"
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
                    "daily_entry"
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
// LOAD REGION USERS
// ======================================================

async function loadRegionUsers() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "regionUsers"
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
        "Total Region Users:",
        regionUsers.length
    );
}

// ======================================================
// GET ENTRY CREATED TIME
// ======================================================

function getCreatedTime(entry) {

    const createdAt =
        entry.createdAt;

    // Firestore Timestamp

    if (
        createdAt &&
        typeof createdAt.toMillis === "function"
    ) {

        return createdAt.toMillis();
    }

    // JS Date

    if (
        createdAt instanceof Date
    ) {

        return createdAt.getTime();
    }

    // String / Number

    const time =
        new Date(
            createdAt
        ).getTime();

    if (
        Number.isFinite(time)
    ) {

        return time;
    }

    return 0;
}

// ======================================================
// GET LATEST ENTRY PER EMPLOYEE + DATE
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

            // Employee Code required

            if (!employeeCode) {

                return;
            }

            // Date required

            if (!date) {

                return;
            }

            const key =
                `${normalize(employeeCode)}_${date}`;

            const existing =
                latestMap.get(
                    key
                );

            // No previous entry

            if (!existing) {

                latestMap.set(
                    key,
                    entry
                );

                return;
            }

            // Compare createdAt

            const currentTime =
                getCreatedTime(
                    entry
                );

            const existingTime =
                getCreatedTime(
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

    return Array.from(
        latestMap.values()
    );
}

// ======================================================
// GET EMPLOYEES FOR USER
// ======================================================

function getUserEmployees(user) {

    const allowedRegions =
        getUserRegions(
            user
        );

    console.log(
        "User:",
        getUserName(user),
        "Regions:",
        allowedRegions
    );

    // ==================================================
    // NO REGION FOUND
    // ==================================================

    if (
        allowedRegions.length === 0
    ) {

        console.warn(
            "No region identified for user:",
            getUserName(user)
        );

        return [];
    }

    // ==================================================
    // FILTER EMPLOYEES
    // ==================================================

    const matchedEmployees =
        employees.filter(
            (employee) => {

                const employeeRegion =
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    );

                return allowedRegions.some(
                    (region) => {

                        return (
                            employeeRegion ===
                            normalize(region)
                        );

                    }
                );

            }
        );

    console.log(
        getUserName(user),
        "Matched Teachers:",
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

            const target =
                getUserTarget(
                    user
                );

            const collection =
                getUserCollection(
                    userEmployees,
                    latestEntries
                );

            // ==================================================
            // REMAINING
            // ==================================================

            const remaining =
                Math.max(
                    target -
                    collection,
                    0
                );

            // ==================================================
            // PERCENTAGE
            // ==================================================

            const percentage =
                target > 0
                    ? (
                        collection /
                        target
                    ) * 100
                    : 0;

            // ==================================================
            // UNITS
            // ==================================================

            const targetUnit =
                calculateUnit(
                    target
                );

            const collectionUnit =
                calculateUnit(
                    collection
                );

            const remainingUnit =
                calculateUnit(
                    remaining
                );

            // ==================================================
            // SAVE
            // ==================================================

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
                    collection,

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

                regions:
                    getUserRegions(
                        user
                    ),

                originalUser:
                    user

            });

        }
    );

    console.log(
        "USER SUMMARY DATA:",
        userSummaryData
    );
}

// ======================================================
// UPDATE SUMMARY CARDS
// ======================================================

function updateUserSummaryCards(
    list
) {

    let totalTarget =
        0;

    let totalCollection =
        0;

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

    // ==================================================
    // TOTAL USERS CARD REMOVED
    // ==================================================
    //
    // If this element exists in old HTML,
    // hide it.
    // ==================================================

    if (
        userSummaryTotalUsers
    ) {

        userSummaryTotalUsers
            .closest(
                ".user-summary-card"
            )
            ?.remove();

    }

    // ==================================================
    // TOTAL TARGET
    // ==================================================

    if (
        userSummaryTotalTarget
    ) {

        userSummaryTotalTarget.textContent =
            formatCurrency(
                totalTarget
            );

    }

    // ==================================================
    // TOTAL COLLECTION
    // ==================================================

    if (
        userSummaryTotalCollection
    ) {

        userSummaryTotalCollection.textContent =
            formatCurrency(
                totalCollection
            );

    }

    // ==================================================
    // TOTAL REMAINING
    // ==================================================

    if (
        userSummaryTotalRemaining
    ) {

        userSummaryTotalRemaining.textContent =
            formatCurrency(
                totalRemaining
            );

    }
}

// ======================================================
// GET PERCENTAGE CLASS
// ======================================================

function getPercentageClass(
    percentage
) {

    if (
        percentage >= 100
    ) {

        return "complete";
    }

    if (
        percentage >= 75
    ) {

        return "good";
    }

    if (
        percentage >= 50
    ) {

        return "medium";
    }

    return "low";
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

    // ==================================================
    // NO DATA
    // ==================================================

    if (
        list.length === 0
    ) {

        userSummaryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="no-data"
                >

                    Koi User nahi mila.

                </td>

            </tr>

        `;

        updateUserSummaryCards(
            list
        );

        return;
    }

    let html =
        "";

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

            const percentageClass =
                getPercentageClass(
                    percentage
                );

            // ==================================================
            // USER NAME
            // ==================================================

            const userName =
                escapeHTML(
                    user.userName
                );

            // ==================================================
            // TARGET
            // ==================================================

            const target =
                numberValue(
                    user.target
                );

            // ==================================================
            // COLLECTION
            // ==================================================

            const collectionAmount =
                numberValue(
                    user.collection
                );

            // ==================================================
            // REMAINING
            // ==================================================

            const remaining =
                numberValue(
                    user.remaining
                );

            // ==================================================
            // UNITS
            // ==================================================

            const targetUnit =
                calculateUnit(
                    target
                );

            const collectionUnit =
                calculateUnit(
                    collectionAmount
                );

            const remainingUnit =
                calculateUnit(
                    remaining
                );

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

                            <input
                                type="text"
                                class="user-name-input"
                                data-id="${escapeHTML(user.id)}"
                                value="${userName}"
                                placeholder="Enter User Name"
                            >

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
                                value="${target || ""}"
                                placeholder="Enter Target"
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

                    <td>

                        <strong
                            style="
                                color:#059669;
                                white-space:nowrap;
                            "
                        >
                            ${targetUnit.toFixed(2)}
                            Unit
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
                                color:#111827;
                                white-space:nowrap;
                            "
                        >
                            ${collectionUnit.toFixed(2)}
                            Unit
                        </strong>

                    </td>


                    <!-- REMAINING -->

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
                                color:#111827;
                                white-space:nowrap;
                            "
                        >
                            ${remainingUnit.toFixed(2)}
                            Unit
                        </strong>

                    </td>


                    <!-- PERCENTAGE -->

                    <td>

                        <div
                            class="
                                percentage-wrapper
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

                        this.disabled =
                            true;

                        const oldHTML =
                            this.innerHTML;

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

                            // ==================================================
                            // SAVE TARGET IN regionUsers
                            // ==================================================

                            await setDoc(

                                doc(
                                    db,
                                    "regionUsers",
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
                                    merge:
                                        true
                                }

                            );

                            // ==================================================
                            // LOCAL UPDATE
                            // ==================================================

                            user.target =
                                target;

                            user.targetUnit =
                                calculateUnit(
                                    target
                                );

                            user.remaining =
                                Math.max(
                                    target -
                                    user.collection,
                                    0
                                );

                            user.remainingUnit =
                                calculateUnit(
                                    user.remaining
                                );

                            user.percentage =
                                target > 0

                                    ? (
                                        user.collection /
                                        target
                                    ) * 100

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
                            String(
                                this.value || ""
                            ).trim();

                        if (!newName) {

                            alert(
                                "User Name empty nahi ho sakta."
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

                        const oldName =
                            user.userName;

                        try {

                            // ==================================================
                            // SAVE USER NAME
                            // ==================================================

                            await setDoc(

                                doc(
                                    db,
                                    "regionUsers",
                                    userId
                                ),

                                {

                                    name:
                                        newName,

                                    userName:
                                        newName,

                                    updatedAt:
                                        new Date()

                                },

                                {
                                    merge:
                                        true
                                }

                            );

                            // ==================================================
                            // LOCAL UPDATE
                            // ==================================================

                            user.userName =
                                newName;

                            user.originalUser.name =
                                newName;

                            user.originalUser.userName =
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

                            this.value =
                                oldName;

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
// SEARCH
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
// LOAD RECENT COLLECTIONS
// ======================================================

async function loadRecentCollections() {

    try {

        const latestEntries =
            getLatestEntries();

        // ==================================================
        // SORT DATE
        // ==================================================

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

                return (
                    dateB -
                    dateA
                );

            }
        );

        let totalCollection =
            0;

        let todayCollection =
            0;

        const todayStr =
            new Date()
                .toISOString()
                .split("T")[0];

        let tableRowsHTML =
            "";

        // ==================================================
        // TABLE
        // ==================================================

        latestEntries.forEach(
            (data) => {

                const amount =
                    getEntryAmount(
                        data
                    );

                totalCollection +=
                    amount;

                if (
                    String(data.date) ===
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

        // ==================================================
        // OLD TOTAL COLLECTION
        // ==================================================

        if (
            totalAmountEl
        ) {

            totalAmountEl.textContent =
                formatCurrency(
                    totalCollection
                );

        }

        // ==================================================
        // TODAY COLLECTION
        // ==================================================

        if (
            todayAmountEl
        ) {

            todayAmountEl.textContent =
                formatCurrency(
                    todayCollection
                );

        }

        // ==================================================
        // TOTAL ENTRIES
        // ==================================================

        if (
            totalEntriesCountEl
        ) {

            totalEntriesCountEl.textContent =
                latestEntries.length;

        }

        // ==================================================
        // TABLE
        // ==================================================

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

                        <br>

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

        // ==================================================
        // LOADING
        // ==================================================

        if (
            userSummaryTableBody
        ) {

            userSummaryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
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
        // LOAD FIREBASE DATA
        // ==================================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadRegionUsers()

        ]);

        // ==================================================
        // BUILD SUMMARY
        // ==================================================

        buildUserSummary();

        // ==================================================
        // DISPLAY SUMMARY
        // ==================================================

        displayUserSummary(
            userSummaryData
        );

        // ==================================================
        // RECENT COLLECTION
        // ==================================================

        await loadRecentCollections();

        // ==================================================
        // CONSOLE
        // ==================================================

        console.log(
            "======================================"
        );

        console.log(
            "Dashboard Loaded Successfully"
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
                        colspan="9"
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
// START DASHBOARD
// ======================================================

loadDashboard();
