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

// NEW REGION USER / TEACHER ENTRIES
let teacherEntries = [];

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
// GET USER ACCESS FROM regionUsers
// ======================================================
//
// Dashboard sirf "regionUsers" collection use karta hai.
//
// Example:
// access: [
//   { region: "Ajmer", state: "Punjab" },
//   { region: "Ajmer", state: "Rajasthan" }
// ]
//
// state "*" ya blank = Full Region
// ======================================================

function getUserAccess(user) {

    if (
        Array.isArray(user?.access) &&
        user.access.length > 0
    ) {
        return user.access
            .map((item) => ({
                region: String(
                    item?.region || ""
                ).trim(),

                state: String(
                    item?.state || "*"
                ).trim()
            }))
            .filter(
                (item) =>
                    normalize(item.region) !== ""
            );
    }

    return [];
}

// ======================================================
// GET USER REGIONS
// ======================================================

function getUserRegions(user) {

    return [
        ...new Set(
            getUserAccess(user)
                .map(
                    (item) =>
                        normalize(item.region)
                )
                .filter(Boolean)
        )
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

                    source:
                        "daily_entry",

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

                    source:
                        "daily_entry",

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
// LOAD TEACHER ENTRIES
//
// Region Users ki new entries "teacher_entries" collection
// mein save hoti hain.
// ======================================================

async function loadTeacherEntries() {

    try {

        const entriesQuery =
            query(
                collection(
                    db,
                    "teacher_entries"
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

                    source:
                        "teacher_entries",

                    ...docSnapshot.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "teacher_entries orderBy failed. Loading without orderBy.",
            error
        );

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "teacher_entries"
                    )
                );

            teacherEntries = [];

            snapshot.forEach(
                (docSnapshot) => {

                    teacherEntries.push({

                        id:
                            docSnapshot.id,

                        source:
                            "teacher_entries",

                        ...docSnapshot.data()

                    });

                }
            );

        }

        catch (secondError) {

            console.warn(
                "teacher_entries collection load failed:",
                secondError
            );

            teacherEntries = [];

        }

    }

    console.log(
        "Total Teacher Entries:",
        teacherEntries.length
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
// ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    const values = [

        entry.date,

        entry.entryDate,

        entry.entry_date,

        entry.collectionDate,

        entry.collection_date,

        entry.selectedDate,

        entry.selected_date,

        entry.dailyDate,

        entry.daily_date

    ];

    for (
        const value
        of values
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            continue;

        }

        const text =
            String(value)
                .trim();

        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(text)
        ) {

            return text;

        }

        const parsed =
            new Date(
                text
            );

        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            const year =
                parsed.getFullYear();

            const month =
                String(
                    parsed.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );

            const day =
                String(
                    parsed.getDate()
                ).padStart(
                    2,
                    "0"
                );

            return (
                `${year}-${month}-${day}`
            );

        }

    }

    return "";
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

    // ==================================================
    // OLD daily_entry
    //
    // Same Teacher + Same Date = latest entry
    // ==================================================

    const latestOldMap =
        new Map();

    dailyEntries.forEach(
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

            const key =
                `${normalize(employeeCode)}_${date}`;

            const existing =
                latestOldMap.get(
                    key
                );

            if (!existing) {

                latestOldMap.set(
                    key,
                    entry
                );

                return;

            }

            if (
                getCreatedTime(entry) >=
                getCreatedTime(existing)
            ) {

                latestOldMap.set(
                    key,
                    entry
                );

            }

        }
    );

    // ==================================================
    // NEW teacher_entries
    //
    // Every new entry is a separate valid entry.
    // ==================================================

    const mergedEntries = [

        ...latestOldMap.values(),

        ...teacherEntries

    ].filter(
        (entry) => {

            const employeeCode =
                getEntryEmployeeCode(
                    entry
                );

            const date =
                getEntryDate(
                    entry
                );

            return Boolean(
                employeeCode &&
                date
            );

        }
    );

    return mergedEntries;
}

// ======================================================
// GET EMPLOYEES FOR USER
// ======================================================
//
// User ke regionUsers.access ke according teachers
// filter honge.
//
// Region + State:
//   Ajmer + Punjab
//   Ajmer + Rajasthan
//
// Full Region:
//   state = "*" ya blank
// ======================================================

function getUserEmployees(user) {

    const access =
        getUserAccess(user);

    console.log(
        "USER:",
        getUserName(user),
        "ACCESS:",
        access
    );

    // Access na ho to user Dashboard me
    // show hoga, lekin teachers/collection 0 rahegi.

    if (
        access.length === 0
    ) {

        console.warn(
            "No access found for user:",
            getUserName(user)
        );

        return [];
    }

    const matchedEmployees =
        employees.filter(
            (employee) => {

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

                return access.some(
                    (item) => {

                        const allowedRegion =
                            normalize(
                                item.region
                            );

                        const allowedState =
                            normalize(
                                item.state
                            );

                        // Region must match

                        if (
                            allowedRegion &&
                            employeeRegion !==
                                allowedRegion
                        ) {

                            return false;
                        }

                        // Full Region

                        if (
                            allowedState === "*" ||
                            allowedState === ""
                        ) {

                            return true;
                        }

                        // Specific State

                        return (
                            employeeState ===
                            allowedState
                        );

                    }
                );

            }
        );

    console.log(
        "USER:",
        getUserName(user),
        "MATCHED TEACHERS:",
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
                    colspan="9"
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

                        const name =
                            normalize(
                                user.userName
                            );

                        const code =
                            normalize(
                                user.userCode
                            );

                        const regions =
                            (
                                user.regions || []
                            )
                                .map(
                                    region =>
                                        normalize(
                                            region
                                        )
                                )
                                .join(" ");

                        return (
                            name.includes(search) ||
                            code.includes(search) ||
                            regions.includes(search)
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
//
// Dashboard Recent Collection table
// daily_entry + teacher_entries dono se data lega.
// ======================================================

async function loadRecentCollections() {

    if (
        !entriesTableBody
    ) {

        return;
    }

    const allEntries =
        getLatestEntries();

    // ==================================================
    // SORT NEWEST FIRST
    // ==================================================

    allEntries.sort(
        (a, b) => {

            return (
                getCreatedTime(b) -
                getCreatedTime(a)
            );

        }
    );

    // ==================================================
    // TOTAL ENTRIES
    // ==================================================

    if (
        totalEntriesCountEl
    ) {

        totalEntriesCountEl.textContent =
            allEntries.length
                .toLocaleString("en-IN");

    }

    // ==================================================
    // TOTAL COLLECTION
    // ==================================================

    let totalAmount =
        0;

    allEntries.forEach(
        (entry) => {

            totalAmount +=
                getEntryAmount(
                    entry
                );

        }
    );

    if (
        totalAmountEl
    ) {

        totalAmountEl.textContent =
            formatCurrency(
                totalAmount
            );

    }

    // ==================================================
    // TODAY COLLECTION
    // ==================================================

    const today =
        new Date();

    const todayYear =
        today.getFullYear();

    const todayMonth =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const todayDay =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );

    const todayString =
        `${todayYear}-${todayMonth}-${todayDay}`;

    let todayAmount =
        0;

    allEntries.forEach(
        (entry) => {

            const entryDate =
                getEntryDate(
                    entry
                );

            if (
                entryDate ===
                todayString
            ) {

                todayAmount +=
                    getEntryAmount(
                        entry
                    );

            }

        }
    );

    if (
        todayAmountEl
    ) {

        todayAmountEl.textContent =
            formatCurrency(
                todayAmount
            );

    }

    // ==================================================
    // NO ENTRIES
    // ==================================================

    if (
        allEntries.length === 0
    ) {

        entriesTableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="no-data"
                >

                    No collection entries found.

                </td>

            </tr>

        `;

        return;
    }

    // ==================================================
    // RECENT ENTRIES
    // ==================================================

    const recentEntries =
        allEntries.slice(
            0,
            20
        );

    let html =
        "";

    recentEntries.forEach(
        (entry, index) => {

            const employeeCode =
                getEntryEmployeeCode(
                    entry
                );

            const employee =
                employees.find(
                    (item) => {

                        return (
                            normalize(
                                getEmployeeCode(
                                    item
                                )
                            ) ===
                            normalize(
                                employeeCode
                            )
                        );

                    }
                );

            const employeeName =
                employee

                    ? (
                        employee.name ||
                        employee.fullName ||
                        employee.full_name ||
                        employee.teacherName ||
                        employee.teacher_name ||
                        ""
                    )

                    : (
                        entry.teacherName ||
                        entry.teacher_name ||
                        entry.name ||
                        entry.fullName ||
                        entry.full_name ||
                        ""
                    );

            const region =
                employee

                    ? getEmployeeRegion(
                        employee
                    )

                    : (
                        entry.region ||
                        entry.regionName ||
                        entry.region_name ||
                        ""
                    );

            const state =
                employee

                    ? getEmployeeState(
                        employee
                    )

                    : (
                        entry.state ||
                        entry.stateName ||
                        entry.state_name ||
                        ""
                    );

            const city =
                employee

                    ? getEmployeeCity(
                        employee
                    )

                    : (
                        entry.city ||
                        entry.cityName ||
                        entry.city_name ||
                        ""
                    );

            const date =
                getEntryDate(
                    entry
                );

            const amount =
                getEntryAmount(
                    entry
                );

            const source =
                entry.source ===
                "teacher_entries"

                    ? "Region User"

                    : "Daily Collection";

            html += `

                <tr>

                    <!-- NUMBER -->

                    <td>
                        ${index + 1}
                    </td>

                    <!-- EMPLOYEE CODE -->

                    <td>

                        <strong>

                            ${escapeHTML(
                                employeeCode
                            )}

                        </strong>

                    </td>

                    <!-- TEACHER -->

                    <td>

                        ${escapeHTML(
                            employeeName ||
                            "-"
                        )}

                    </td>

                    <!-- REGION -->

                    <td>

                        ${escapeHTML(
                            region ||
                            "-"
                        )}

                    </td>

                    <!-- STATE -->

                    <td>

                        ${escapeHTML(
                            state ||
                            "-"
                        )}

                    </td>

                    <!-- CITY -->

                    <td>

                        ${escapeHTML(
                            city ||
                            "-"
                        )}

                    </td>

                    <!-- DATE -->

                    <td>

                        ${escapeHTML(
                            date ||
                            "-"
                        )}

                    </td>

                    <!-- AMOUNT -->

                    <td>

                        <strong
                            style="
                                color:#059669;
                                white-space:nowrap;
                            "
                        >

                            ${formatCurrency(
                                amount
                            )}

                        </strong>

                    </td>

                    <!-- SOURCE -->

                    <td>

                        <span
                            class="
                                entry-source-badge
                            "
                        >

                            ${escapeHTML(
                                source
                            )}

                        </span>

                    </td>

                </tr>

            `;

        }
    );

    entriesTableBody.innerHTML =
        html;
}


// ======================================================
// SAVE / UPDATE REGION USER DATA
// ======================================================
//
// Existing helper kept intact.
// ======================================================

async function refreshDashboardData() {

    try {

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadTeacherEntries(),

            loadRegionUsers()

        ]);

        buildUserSummary();

        displayUserSummary(
            userSummaryData
        );

        await loadRecentCollections();

    }

    catch (error) {

        console.error(
            "Dashboard Refresh Error:",
            error
        );

    }
}


// ======================================================
// LOGOUT
// ======================================================

const logoutButtons =
    document.querySelectorAll(
        "#logoutBtn, .logout-btn, [data-action='logout']"
    );

logoutButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                localStorage.removeItem(
                    "loggedInEmpCode"
                );

                localStorage.removeItem(
                    "userRole"
                );

                localStorage.removeItem(
                    "regionUserId"
                );

                localStorage.removeItem(
                    "regionUserCode"
                );

                localStorage.removeItem(
                    "userCode"
                );

                localStorage.removeItem(
                    "employeeCode"
                );

                localStorage.removeItem(
                    "empCode"
                );

                localStorage.removeItem(
                    "username"
                );

                localStorage.removeItem(
                    "userName"
                );

                window.location.href =
                    "index.html";

            }
        );

    }
);


// ======================================================
// MAIN DASHBOARD LOAD
// ======================================================

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

        // ==================================================
        // LOAD ALL DATA
        // ==================================================
        //
        // IMPORTANT:
        //
        // employees
        // daily_entry
        // teacher_entries
        // regionUsers
        //
        // All are loaded before calculation.
        // ==================================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadTeacherEntries(),

            loadRegionUsers()

        ]);

        console.log(
            "======================================"
        );

        console.log(
            "DATA LOADED"
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
            "Region Users:",
            regionUsers.length
        );

        console.log(
            "======================================"
        );

        // ==================================================
        // BUILD USER SUMMARY
        // ==================================================

        buildUserSummary();

        // ==================================================
        // DISPLAY USER SUMMARY
        // ==================================================

        displayUserSummary(
            userSummaryData
        );

        // ==================================================
        // LOAD RECENT COLLECTION
        // ==================================================

        await loadRecentCollections();

        console.log(
            "======================================"
        );

        console.log(
            "TELETHON DASHBOARD READY"
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

        // ==================================================
        // SHOW ERROR IN TABLE
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

                        Dashboard data load nahi hua.

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

        if (
            entriesTableBody
        ) {

            entriesTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="no-data"
                    >

                        Collection data load nahi hua.

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


// ======================================================
// START DASHBOARD
// ======================================================

loadDashboard();
// ======================================================
// AUTO REFRESH
// ======================================================
//
// Dashboard ko manually refresh karne ki zarurat na ho,
// isliye data ko periodically reload kiya ja sakta hai.
//
// Existing functionality ko disturb nahi karta.
// ======================================================

let dashboardRefreshTimer = null;


// ======================================================
// START AUTO REFRESH
// ======================================================

function startDashboardAutoRefresh() {

    // Existing timer clear

    if (
        dashboardRefreshTimer
    ) {

        clearInterval(
            dashboardRefreshTimer
        );

    }

    // ==================================================
    // Refresh every 60 seconds
    // ==================================================

    dashboardRefreshTimer =
        setInterval(
            async function () {

                console.log(
                    "Refreshing Dashboard Data..."
                );

                await refreshDashboardData();

            },
            60000
        );

}


// ======================================================
// VISIBILITY CHANGE
// ======================================================
//
// Agar browser tab background mein tha aur user wapas
// Dashboard par aata hai to latest data reload hoga.
// ======================================================

document.addEventListener(
    "visibilitychange",
    async function () {

        if (
            document.visibilityState ===
            "visible"
        ) {

            console.log(
                "Dashboard visible - refreshing data..."
            );

            await refreshDashboardData();

        }

    }
);


// ======================================================
// WINDOW FOCUS
// ======================================================

window.addEventListener(
    "focus",
    async function () {

        console.log(
            "Dashboard focused - refreshing data..."
        );

        await refreshDashboardData();

    }
);


// ======================================================
// START AUTO REFRESH
// ======================================================

startDashboardAutoRefresh();


// ======================================================
// DEBUG HELPER
// ======================================================
//
// Browser Console mein:
// debugDashboardData()
//
// run karne par collections aur totals check kar
// sakte hain.
// ======================================================

window.debugDashboardData =
    function () {

        const allEntries =
            getLatestEntries();

        let total =
            0;

        let todayTotal =
            0;

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

        const todayDate =
            `${year}-${month}-${day}`;

        allEntries.forEach(
            (entry) => {

                const amount =
                    getEntryAmount(
                        entry
                    );

                total +=
                    amount;

                if (
                    getEntryDate(
                        entry
                    ) ===
                    todayDate
                ) {

                    todayTotal +=
                        amount;

                }

            }
        );

        console.log(
            "======================================"
        );

        console.log(
            "TELETHON DASHBOARD DEBUG"
        );

        console.log(
            "======================================"
        );

        console.log(
            "Employees:",
            employees.length
        );

        console.log(
            "daily_entry:",
            dailyEntries.length
        );

        console.log(
            "teacher_entries:",
            teacherEntries.length
        );

        console.log(
            "Region Users:",
            regionUsers.length
        );

        console.log(
            "Calculated Entries:",
            allEntries.length
        );

        console.log(
            "Total Collection:",
            total
        );

        console.log(
            "Today Collection:",
            todayTotal
        );

        console.log(
            "User Summary:",
            userSummaryData
        );

        console.log(
            "All Entries:",
            allEntries
        );

        console.log(
            "======================================"
        );

        return {

            employees:
                employees,

            dailyEntries:
                dailyEntries,

            teacherEntries:
                teacherEntries,

            regionUsers:
                regionUsers,

            allEntries:
                allEntries,

            total:
                total,

            todayTotal:
                todayTotal,

            userSummaryData:
                userSummaryData

        };

    };


// ======================================================
// END OF DASHBOARD.JS
// ======================================================
