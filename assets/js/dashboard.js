// ======================================
// TELETHON ADMIN DASHBOARD
// User Wise Target + Collection Summary
// ======================================

// ======================================
// ADMIN ONLY ACCESS
// ======================================

const userRole =
    String(
        localStorage.getItem("userRole") || ""
    )
    .trim()
    .toLowerCase();

if (userRole !== "admin") {

    localStorage.removeItem("loggedInEmpCode");
    localStorage.removeItem("userRole");

    window.location.href = "index.html";
}


// ======================================
// FIREBASE
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML ELEMENTS
// ======================================

// Old Dashboard Cards

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");


// ======================================
// USER SUMMARY
// ======================================

const userSummaryTableBody =
    document.getElementById(
        "userSummaryTableBody"
    );

const userSummaryTotalUsers =
    document.getElementById(
        "userSummaryTotalUsers"
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

const userSummarySearch =
    document.getElementById(
        "userSummarySearch"
    );


// ======================================
// DATA
// ======================================

let employees = [];

let dailyEntries = [];

let regionUsers = [];

let userSummaryData = [];


// ======================================
// NORMALIZE
// ======================================

function normalize(value) {

    return String(
        value ?? ""
    )
    .trim()
    .toLowerCase();

}


// ======================================
// NUMBER VALUE
// ======================================

function numberValue(value) {

    const number =
        Number(
            String(value ?? "")
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================
// CURRENCY
// ======================================

function formatCurrency(value) {

    return (
        "₹ " +
        Number(value || 0)
            .toLocaleString("en-IN")
    );

}


// ======================================
// ESCAPE HTML
// ======================================

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


// ======================================
// EMPLOYEE CODE
// ======================================

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


// ======================================
// ENTRY EMPLOYEE CODE
// ======================================

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


// ======================================
// ENTRY AMOUNT
// ======================================

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


// ======================================
// EMPLOYEE REGION
// ======================================

function getEmployeeRegion(employee) {

    return String(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        ""

    ).trim();

}


// ======================================
// EMPLOYEE STATE
// ======================================

function getEmployeeState(employee) {

    return String(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        ""

    ).trim();

}


// ======================================
// EMPLOYEE CITY
// ======================================

function getEmployeeCity(employee) {

    return String(

        employee.city ||

        employee.cityName ||

        employee.city_name ||

        ""

    ).trim();

}


// ======================================
// USER CODE
// ======================================

function getUserCode(user) {

    return String(

        user.userCode ||

        user.user_code ||

        user.employeeCode ||

        user.employee_code ||

        user.empCode ||

        user.emp_code ||

        user.code ||

        user.id ||

        ""

    ).trim();

}


// ======================================
// USER NAME
// ======================================

function getUserName(user) {

    return String(

        user.userName ||

        user.username ||

        user.name ||

        user.fullName ||

        user.full_name ||

        user.displayName ||

        user.teacherName ||

        user.teacher_name ||

        getUserCode(user) ||

        "Unknown User"

    ).trim();

}


// ======================================
// USER TARGET
// ======================================
//
// IMPORTANT:
//
// Teacher/Employee target ko use nahi karna.
//
// Dashboard ka Target sirf Admin ke manually
// entered Region User target se aayega.
//
// Supported fields:
//
// target
// targetAmount
// manualTarget
// manual_target
//
// ======================================

function getUserTarget(user) {

    return numberValue(

        user.manualTarget ??

        user.manual_target ??

        user.targetAmount ??

        user.target ??

        0

    );

}


// ======================================
// LOAD EMPLOYEES
// ======================================

async function loadEmployees() {

    try {

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

    catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );

        employees = [];

    }

}


// ======================================
// LOAD DAILY ENTRIES
// ======================================

async function loadDailyEntries() {

    try {

        let snapshot;


        // ----------------------------------
        // Try createdAt ordering
        // ----------------------------------

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


            snapshot =
                await getDocs(
                    entriesQuery
                );

        }

        catch (orderError) {

            console.warn(
                "createdAt orderBy failed.",
                orderError
            );


            snapshot =
                await getDocs(
                    collection(
                        db,
                        "daily_entry"
                    )
                );

        }


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


        // ----------------------------------
        // Sort newest first
        // ----------------------------------

        dailyEntries.sort(
            (a, b) => {

                const timeA =
                    getCreatedTime(a);

                const timeB =
                    getCreatedTime(b);

                return timeB - timeA;

            }
        );


        console.log(
            "Total Daily Entries:",
            dailyEntries.length
        );

    }

    catch (error) {

        console.error(
            "Daily Entries Load Error:",
            error
        );

        dailyEntries = [];

    }

}


// ======================================
// GET CREATED TIME
// ======================================

function getCreatedTime(entry) {

    const createdAt =
        entry.createdAt;


    if (!createdAt) {

        return 0;

    }


    // Firestore Timestamp

    if (
        typeof createdAt.toMillis ===
        "function"
    ) {

        return createdAt.toMillis();

    }


    // JavaScript Date

    if (
        createdAt instanceof Date
    ) {

        return createdAt.getTime();

    }


    // String / Number

    const parsed =
        new Date(
            createdAt
        ).getTime();


    if (
        Number.isFinite(parsed)
    ) {

        return parsed;

    }


    return 0;

}


// ======================================
// GET LATEST ENTRIES
// Employee + Date
// ======================================
//
// Ek Employee + ek Date ke liye
// sirf latest entry rakhi jayegi.
//
// ======================================

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


            // Daily entries already newest first

            if (
                !latestMap.has(key)
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


// ======================================
// USER ACCESS RULES
// ======================================

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


    if (
        Array.isArray(
            user.permissions
        )
    ) {

        return user.permissions;

    }


    // ----------------------------------
    // Single access object support
    // ----------------------------------

    if (
        user.access &&
        typeof user.access === "object"
    ) {

        return [
            user.access
        ];

    }


    if (
        user.accessRules &&
        typeof user.accessRules === "object"
    ) {

        return [
            user.accessRules
        ];

    }


    // ----------------------------------
    // Direct Region / State fields
    // ----------------------------------

    if (
        user.region ||
        user.state ||
        user.states ||
        user.fullRegion
    ) {

        return [

            {

                region:
                    user.region || "",

                state:
                    user.state || "",

                states:
                    user.states || [],

                fullRegion:
                    user.fullRegion || false

            }

        ];

    }


    return [];

}


// ======================================
// GET RULE STATES
// ======================================

function getRuleStates(rule) {

    let states = [];


    if (
        Array.isArray(
            rule.states
        )
    ) {

        states =
            rule.states;

    }

    else if (
        typeof rule.states ===
        "string"
    ) {

        states =
            rule.states
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

    }

    else if (
        Array.isArray(
            rule.selectedStates
        )
    ) {

        states =
            rule.selectedStates;

    }

    else if (
        typeof rule.selectedStates ===
        "string"
    ) {

        states =
            rule.selectedStates
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

    }

    else if (
        Array.isArray(
            rule.assignedStates
        )
    ) {

        states =
            rule.assignedStates;

    }

    else if (
        rule.state
    ) {

        states = [
            rule.state
        ];

    }

    else if (
        rule.stateName
    ) {

        states = [
            rule.stateName
        ];

    }


    return states;

}


// ======================================
// IS FULL REGION ACCESS
// ======================================

function isFullRegion(rule) {

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


// ======================================
// GET TEACHERS FOR USER
// ======================================

function getUserEmployees(user) {

    const accessRules =
        getUserAccessRules(
            user
        );


    // ----------------------------------
    // No access rule
    // ----------------------------------

    if (
        accessRules.length === 0
    ) {

        return [];

    }


    return employees.filter(
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


            const employeeCity =
                normalize(
                    getEmployeeCity(
                        employee
                    )
                );


            return accessRules.some(
                (rule) => {

                    if (
                        !rule ||
                        typeof rule !== "object"
                    ) {

                        return false;

                    }


                    // ----------------------------------
                    // Region
                    // ----------------------------------

                    const assignedRegion =
                        normalize(

                            rule.region ||

                            rule.assignedRegion ||

                            rule.regionName ||

                            rule.region_name ||

                            ""

                        );


                    if (

                        assignedRegion &&

                        assignedRegion !==
                        "*" &&

                        assignedRegion !==
                        "all" &&

                        assignedRegion !==
                        employeeRegion

                    ) {

                        return false;

                    }


                    // ----------------------------------
                    // Full Region
                    // ----------------------------------

                    if (
                        isFullRegion(
                            rule
                        )
                    ) {

                        return true;

                    }


                    // ----------------------------------
                    // State
                    // ----------------------------------

                    const states =
                        getRuleStates(
                            rule
                        );


                    if (
                        states.length === 0
                    ) {

                        // Region level access

                        return true;

                    }


                    const stateMatch =
                        states.some(
                            (state) => {

                                const normalizedState =
                                    normalize(
                                        state
                                    );


                                return (

                                    normalizedState ===
                                    "*" ||

                                    normalizedState ===
                                    "all" ||

                                    normalizedState ===
                                    "all states" ||

                                    normalizedState ===
                                    employeeState

                                );

                            }
                        );


                    if (
                        !stateMatch
                    ) {

                        return false;

                    }


                    // ----------------------------------
                    // Optional City restriction
                    // ----------------------------------

                    let cities = [];


                    if (
                        Array.isArray(
                            rule.cities
                        )
                    ) {

                        cities =
                            rule.cities;

                    }

                    else if (
                        typeof rule.cities ===
                        "string"
                    ) {

                        cities =
                            rule.cities
                                .split(",")
                                .map(
                                    item =>
                                        item.trim()
                                )
                                .filter(Boolean);

                    }


                    if (
                        cities.length > 0
                    ) {

                        return cities.some(
                            (city) => {

                                const normalizedCity =
                                    normalize(
                                        city
                                    );


                                return (

                                    normalizedCity ===
                                    "*" ||

                                    normalizedCity ===
                                    "all" ||

                                    normalizedCity ===
                                    employeeCity

                                );

                            }
                        );

                    }


                    return true;

                }
            );

        }
    );

}


// ======================================
// LOAD REGION USERS
// ======================================

async function loadRegionUsers() {

    let snapshot = null;

    let collectionName =
        "regionUsers";


    // ==================================
    // First collection
    // ==================================

    try {

        snapshot =
            await getDocs(
                collection(
                    db,
                    "regionUsers"
                )
            );


        console.log(
            "regionUsers found:",
            snapshot.size
        );

    }

    catch (error) {

        console.warn(
            "regionUsers load failed:",
            error
        );

    }


    // ==================================
    // Second collection
    // ==================================

    if (
        !snapshot ||
        snapshot.empty
    ) {

        try {

            snapshot =
                await getDocs(
                    collection(
                        db,
                        "region_users"
                    )
                );


            collectionName =
                "region_users";


            console.log(
                "region_users found:",
                snapshot.size
            );

        }

        catch (error) {

            console.warn(
                "region_users load failed:",
                error
            );

        }

    }


    regionUsers = [];


    if (
        snapshot &&
        !snapshot.empty
    ) {

        snapshot.forEach(
            (docSnapshot) => {

                regionUsers.push({

                    id:
                        docSnapshot.id,

                    __collectionName:
                        collectionName,

                    ...docSnapshot.data()

                });

            }
        );

    }


    console.log(
        "Total Region Users:",
        regionUsers.length
    );

}


// ======================================
// CALCULATE USER COLLECTION
// ======================================

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


// ======================================
// BUILD USER SUMMARY
// ======================================

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


            // ==================================
            // IMPORTANT
            // Target is ADMIN MANUAL TARGET
            // ==================================

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


            let percentage = 0;


            if (
                target > 0
            ) {

                percentage =
                    (
                        totalCollection /
                        target
                    ) * 100;

            }


            userSummaryData.push({

                id:
                    user.id,

                collectionName:
                    user.__collectionName ||
                    "regionUsers",

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
                    totalCollection,

                remaining:
                    remaining,

                percentage:
                    percentage,

                teacherCount:
                    userEmployees.length,

                originalUser:
                    user

            });

        }
    );


    console.log(
        "User Summary:",
        userSummaryData
    );

}


// ======================================
// UPDATE USER SUMMARY CARDS
// ======================================

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

        userSummaryTotalUsers.textContent =
            list.length;

    }


    if (
        userSummaryTotalTarget
    ) {

        userSummaryTotalTarget.textContent =
            formatCurrency(
                totalTarget
            );

    }


    if (
        userSummaryTotalCollection
    ) {

        userSummaryTotalCollection.textContent =
            formatCurrency(
                totalCollection
            );

    }


    if (
        userSummaryTotalRemaining
    ) {

        userSummaryTotalRemaining.textContent =
            formatCurrency(
                totalRemaining
            );

    }

}


// ======================================
// GET PERCENTAGE CLASS
// ======================================

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


// ======================================
// DISPLAY USER SUMMARY
// ======================================

function displayUserSummary(
    list
) {

    if (
        !userSummaryTableBody
    ) {

        return;

    }


    updateUserSummaryCards(
        list
    );


    if (
        list.length === 0
    ) {

        userSummaryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="no-data"
                >

                    Koi User nahi mila.

                </td>

            </tr>

        `;


        return;

    }


    let html = "";


    list.forEach(
        (user, index) => {

            const percentage =
                Number(
                    user.percentage
                ) || 0;


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
                    user.teacherCount
                ) || 0;


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


                    <td>

                        <div
                            class="user-name-cell"
                        >

                            <strong>
                                ${userName}
                            </strong>

                            <small>
                                ${userCode}
                            </small>

                            <small>
                                ${teacherCount}
                                Teachers
                            </small>

                        </div>

                    </td>


                    <td>

                        <div
                            class="target-edit-box"
                        >

                            <input
                                type="number"
                                min="0"
                                step="1"
                                class="user-target-input"
                                data-id="${escapeHTML(user.id)}"
                                value="${
                                    user.target > 0
                                        ? user.target
                                        : ""
                                }"
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

                    </td>


                    <td
                        class="collection-cell"
                    >

                        <strong>
                            ${formatCurrency(
                                user.collection
                            )}
                        </strong>

                    </td>


                    <td
                        class="remaining-cell"
                    >

                        ${formatCurrency(
                            user.remaining
                        )}

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


    // ==================================
    // SAVE TARGET BUTTONS
    // ==================================

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


                        const rawValue =
                            input.value.trim();


                        if (
                            rawValue === ""
                        ) {

                            alert(
                                "Please enter Target."
                            );

                            input.focus();

                            return;

                        }


                        const target =
                            numberValue(
                                rawValue
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


                        const originalUser =
                            user.originalUser;


                        const collectionName =
                            user.collectionName ||
                            originalUser.__collectionName ||
                            "regionUsers";


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

                            // ==================================
                            // SAVE ADMIN MANUAL TARGET
                            // ==================================

                            await setDoc(

                                doc(
                                    db,
                                    collectionName,
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


                            // ==================================
                            // UPDATE LOCAL DATA
                            // ==================================

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
                                getFilteredUserSummary()
                            );


                            console.log(
                                "Admin Target Saved:",
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

}


// ======================================
// FILTERED USER SUMMARY
// ======================================

function getFilteredUserSummary() {

    if (
        !userSummarySearch
    ) {

        return userSummaryData;

    }


    const search =
        normalize(
            userSummarySearch.value
        );


    if (!search) {

        return userSummaryData;

    }


    return userSummaryData.filter(
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

}


// ======================================
// SEARCH USER
// ======================================

if (
    userSummarySearch
) {

    userSummarySearch.addEventListener(
        "input",
        function () {

            displayUserSummary(
                getFilteredUserSummary()
            );

        }
    );

}


// ======================================
// LOAD RECENT COLLECTIONS
// ======================================

async function loadRecentCollections() {

    try {

        const latestEntries =
            getLatestEntries();


        // ==================================
        // Sort By Date
        // ==================================

        latestEntries.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.date || ""
                    );


                const dateB =
                    new Date(
                        b.date || ""
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
            (entry) => {

                const amount =
                    getEntryAmount(
                        entry
                    );


                totalCollection +=
                    amount;


                if (
                    String(
                        entry.date || ""
                    ) ===
                    todayStr
                ) {

                    todayCollection +=
                        amount;

                }


                const employeeCode =
                    entry.employee_code ||

                    entry.employeeCode ||

                    entry.empCode ||

                    "-";


                const teacherName =
                    entry.teacher_name ||

                    entry.teacherName ||

                    "-";


                const jamiatulMadina =
                    entry.jamiatul_madina ||

                    entry.jamiatulMadina ||

                    "-";


                const city =
                    entry.city ||

                    "-";


                const state =
                    entry.state ||

                    "-";


                const region =
                    entry.region ||

                    "-";


                const date =
                    entry.date ||

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


        // ==================================
        // OLD CARDS
        // ==================================

        if (
            totalAmountEl
        ) {

            totalAmountEl.textContent =
                formatCurrency(
                    totalCollection
                );

        }


        if (
            todayAmountEl
        ) {

            todayAmountEl.textContent =
                formatCurrency(
                    todayCollection
                );

        }


        if (
            totalEntriesCountEl
        ) {

            totalEntriesCountEl.textContent =
                latestEntries.length;

        }


        // ==================================
        // RECENT TABLE
        // ==================================

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


// ======================================
// LOGOUT
// ======================================

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


// ======================================
// MAIN LOAD
// ======================================

async function loadDashboard() {

    try {

        // ==================================
        // Loading
        // ==================================

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


        // ==================================
        // LOAD ALL DATA
        // ==================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadRegionUsers()

        ]);


        // ==================================
        // BUILD SUMMARY
        // ==================================

        buildUserSummary();


        // ==================================
        // DISPLAY SUMMARY
        // ==================================

        displayUserSummary(
            userSummaryData
        );


        // ==================================
        // RECENT COLLECTION
        // ==================================

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


        if (
            userSummaryTableBody
        ) {

            userSummaryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="no-data"
                        style="color:red;"
                    >

                        Dashboard data load nahi hua.

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


// ======================================
// START DASHBOARD
// ======================================

loadDashboard();
