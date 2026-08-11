// ======================================
// TELETHON ADMIN DASHBOARD
// User Wise Target + Collection Summary
// ======================================


// ======================================
// ADMIN ONLY ACCESS
// ======================================

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
// SETTINGS
// ======================================

// 1 Unit = ₹7000

const UNIT_VALUE = 7000;


// ======================================
// HTML ELEMENTS
// ======================================

// --------------------------------------
// Main Dashboard Cards
// --------------------------------------

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");


// --------------------------------------
// Recent Entries Table
// --------------------------------------

const entriesTableBody =
    document.getElementById("entriesTableBody");


// --------------------------------------
// User Summary
// --------------------------------------

const userSummaryTableBody =
    document.getElementById("userSummaryTableBody");

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


// ======================================
// FORMAT CURRENCY
// ======================================

function formatCurrency(value) {

    return (
        "₹ " +
        Number(value || 0)
            .toLocaleString("en-IN")
    );

}


// ======================================
// FORMAT UNIT
// ======================================

function formatUnit(value) {

    const amount = numberValue(value);

    const units = amount / UNIT_VALUE;

    if (Number.isInteger(units)) {

        return `${units} Unit`;

    }

    return `${units.toFixed(2)} Unit`;

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
// EMPLOYEE NAME
// ======================================

function getEmployeeName(employee) {

    return String(

        employee.teacherName ||

        employee.teacher_name ||

        employee.name ||

        employee.userName ||

        employee.username ||

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

        "Unknown User"

    ).trim();

}


// ======================================
// USER TARGET
// ======================================

function getUserTarget(user) {

    return numberValue(

        user.targetAmount ||

        user.target ||

        user.manualTarget ||

        user.manual_target ||

        0

    );

}


// ======================================
// LOAD EMPLOYEES
// ======================================

async function loadEmployees() {

    const snapshot = await getDocs(
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
        "TOTAL EMPLOYEES:",
        employees.length
    );

}


// ======================================
// LOAD DAILY ENTRIES
// ======================================

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
        "TOTAL DAILY ENTRIES:",
        dailyEntries.length
    );

}


// ======================================
// GET LATEST ENTRY PER EMPLOYEE + DATE
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

            if (!latestMap.has(key)) {

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
// GET ACCESS RULES
// ======================================

function getAccessRules(user) {

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


// ======================================
// USER NAME SEARCH TERMS
// ======================================

function getUserSearchTerms(user) {

    const name =
        getUserName(user);

    const region =
        String(
            user.region ||
            user.regionName ||
            user.region_name ||
            ""
        ).trim();

    const state =
        String(
            user.state ||
            user.stateName ||
            user.state_name ||
            ""
        ).trim();

    const city =
        String(
            user.city ||
            user.cityName ||
            user.city_name ||
            ""
        ).trim();


    const text =
        `${name} ${region} ${state} ${city}`;


    return normalize(text)
        .replace(/&/g, " ")
        .replace(/,/g, " ")
        .split(/\s+/)
        .filter(
            word =>
                word.length >= 3
        );

}


// ======================================
// FALLBACK EMPLOYEE MATCH
// ======================================
//
// Agar regionUsers me access/accessRules
// nahi hain to User Name se teachers
// identify karne ki koshish hogi.
//
// Example:
//
// Delhi Region
// -> Delhi employees
//
// Rajasthan State
// -> Rajasthan employees
//
// ======================================

function fallbackMatchEmployee(
    user,
    employee
) {

    const userName =
        normalize(
            getUserName(user)
        );

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


    if (!userName) {

        return false;

    }


    // ----------------------------------
    // Direct region/state/city fields
    // ----------------------------------

    const userRegion =
        normalize(
            user.region ||
            user.regionName ||
            user.region_name ||
            ""
        );

    const userState =
        normalize(
            user.state ||
            user.stateName ||
            user.state_name ||
            ""
        );

    const userCity =
        normalize(
            user.city ||
            user.cityName ||
            user.city_name ||
            ""
        );


    if (
        userRegion &&
        employeeRegion === userRegion
    ) {

        return true;

    }


    if (
        userState &&
        employeeState === userState
    ) {

        return true;

    }


    if (
        userCity &&
        employeeCity === userCity
    ) {

        return true;

    }


    // ----------------------------------
    // User name matching
    // ----------------------------------

    let cleanedName =
        userName
            .replace(/\bregion\b/g, "")
            .replace(/\bstate\b/g, "")
            .replace(/\band\b/g, " ")
            .replace(/&/g, " ")
            .trim();


    const nameParts =
        cleanedName
            .split(/\s+/)
            .filter(
                word =>
                    word.length >= 3
            );


    if (
        employeeRegion &&
        nameParts.some(
            part =>
                employeeRegion.includes(
                    part
                ) ||
                part.includes(
                    employeeRegion
                )
        )
    ) {

        return true;

    }


    if (
        employeeState &&
        nameParts.some(
            part =>
                employeeState.includes(
                    part
                ) ||
                part.includes(
                    employeeState
                )
        )
    ) {

        return true;

    }


    if (
        employeeCity &&
        nameParts.some(
            part =>
                employeeCity.includes(
                    part
                ) ||
                part.includes(
                    employeeCity
                )
        )
    ) {

        return true;

    }


    return false;

}


// ======================================
// GET TEACHERS FOR USER
// ======================================

function getUserEmployees(user) {

    const accessRules =
        getAccessRules(
            user
        );


    // ==================================
    // ACCESS RULES AVAILABLE
    // ==================================

    if (
        accessRules.length > 0
    ) {

        const matched =
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


                    return accessRules.some(
                        (rule) => {

                            if (!rule) {
                                return false;
                            }


                            const assignedRegion =
                                normalize(

                                    rule.region ||

                                    rule.assignedRegion ||

                                    rule.regionName ||

                                    rule.region_name ||

                                    ""

                                );


                            // Region mismatch

                            if (

                                assignedRegion &&

                                assignedRegion !==
                                employeeRegion

                            ) {

                                return false;

                            }


                            // Full region

                            const fullRegion =

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


                            if (
                                fullRegion
                            ) {

                                return true;

                            }


                            // States

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

                                states = [
                                    rule.states
                                ];

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

                                        normalizedState ===
                                        "*" ||

                                        normalizedState ===
                                        "all" ||

                                        normalizedState ===
                                        "all states"

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
            );


        console.log(
            "USER:",
            getUserName(user),
            "ACCESS:",
            accessRules,
            "TEACHERS:",
            matched.length
        );


        return matched;

    }


    // ==================================
    // NO ACCESS RULES
    // ==================================
    //
    // Fallback matching
    //

    const fallbackEmployees =
        employees.filter(
            employee =>
                fallbackMatchEmployee(
                    user,
                    employee
                )
        );


    console.log(
        "USER:",
        getUserName(user),
        "NO ACCESS RULES - FALLBACK TEACHERS:",
        fallbackEmployees.length
    );


    return fallbackEmployees;

}


// ======================================
// GET USER COLLECTION
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
// LOAD REGION USERS
// ======================================

async function loadRegionUsers() {

    let snapshot = null;

    let collectionName =
        "regionUsers";


    // ==================================
    // First regionUsers
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
            "regionUsers:",
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
    // Try region_users
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
                "region_users:",
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
        "TOTAL REGION USERS:",
        regionUsers.length
    );

}


// ======================================
// BUILD USER SUMMARY
// ======================================

function buildUserSummary() {

    const latestEntries =
        getLatestEntries();


    console.log(
        "LATEST ENTRIES:",
        latestEntries
    );


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


// ======================================
// UPDATE SUMMARY CARDS
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


    // ----------------------------------
    // Total Target
    // ----------------------------------

    if (
        userSummaryTotalTarget
    ) {

        userSummaryTotalTarget.textContent =
            formatCurrency(
                totalTarget
            );

    }


    // ----------------------------------
    // Total Collection
    // ----------------------------------

    if (
        userSummaryTotalCollection
    ) {

        userSummaryTotalCollection.textContent =
            formatCurrency(
                totalCollection
            );

    }


    // ----------------------------------
    // Remaining
    // ----------------------------------

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
// SAVE USER NAME
// ======================================

async function saveUserName(
    userId,
    newName,
    button
) {

    const user =
        userSummaryData.find(
            item =>
                item.id ===
                userId
        );


    if (!user) {

        alert(
            "User nahi mila."
        );

        return;

    }


    const cleanName =
        String(
            newName || ""
        ).trim();


    if (!cleanName) {

        alert(
            "Please User Name enter karein."
        );

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

        const collectionName =
            user.collectionName ||
            "regionUsers";


        await setDoc(

            doc(
                db,
                collectionName,
                userId
            ),

            {

                name:
                    cleanName,

                userName:
                    cleanName,

                updatedAt:
                    new Date()

            },

            {
                merge: true
            }

        );


        // ----------------------------------
        // Update local data
        // ----------------------------------

        user.userName =
            cleanName;


        if (
            user.originalUser
        ) {

            user.originalUser.name =
                cleanName;

            user.originalUser.userName =
                cleanName;

        }


        displayUserSummary(
            userSummaryData
        );


        console.log(
            "USER NAME SAVED:",
            cleanName
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


// ======================================
// SAVE USER TARGET
// ======================================

async function saveUserTarget(
    userId,
    target,
    button
) {

    const user =
        userSummaryData.find(
            item =>
                item.id ===
                userId
        );


    if (!user) {

        alert(
            "User nahi mila."
        );

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

        const collectionName =
            user.collectionName ||
            "regionUsers";


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


        // ----------------------------------
        // Update Local Data
        // ----------------------------------

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
            userSummaryData
        );


        console.log(
            "TARGET SAVED:",
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


    // ==================================
    // No Users
    // ==================================

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


    let html = "";


    list.forEach(
        (user, index) => {

            const percentage =
                numberValue(
                    user.percentage
                );


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


            const target =
                numberValue(
                    user.target
                );


            const collection =
                numberValue(
                    user.collection
                );


            const remaining =
                numberValue(
                    user.remaining
                );


            // ==================================
            // USER NAME
            // ==================================

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
                            style="
                                min-width:190px;
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
                                    placeholder="Enter User Name"
                                    style="
                                        flex:1;
                                    "
                                >


                                <button
                                    type="button"
                                    class="save-user-name-btn"
                                    data-id="${escapeHTML(user.id)}"
                                    title="Save User Name"
                                    style="
                                        width:38px;
                                        height:38px;
                                        border:none;
                                        border-radius:8px;
                                        background:#2563eb;
                                        color:white;
                                        cursor:pointer;
                                    "
                                >

                                    <i
                                        class="fa-solid fa-save"
                                    ></i>

                                </button>

                            </div>


                            <!-- SAVED USER NAME -->

                            <div
                                class="saved-user-name"
                                style="
                                    margin-top:6px;
                                    font-size:12px;
                                    color:#64748b;
                                    font-weight:500;
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-user
                                    "
                                    style="
                                        margin-right:4px;
                                        color:#2563eb;
                                    "
                                ></i>

                                User:

                                <strong>

                                    ${userName}

                                </strong>

                            </div>

                        </div>

                    </td>


                    <!-- TARGET -->

                    <td>

                        <div
                            class="target-edit-box"
                            style="
                                display:flex;
                                gap:6px;
                                align-items:center;
                            "
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
                                    class="
                                        fa-solid
                                        fa-save
                                    "
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

                        ${formatUnit(target)}

                    </td>


                    <!-- TOTAL COLLECTION -->

                    <td
                        class="collection-cell"
                        style="
                            color:#dc2626;
                            white-space:nowrap;
                        "
                    >

                        ${formatCurrency(
                            collection
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
                            collection
                        )}

                    </td>


                    <!-- REMAINING -->

                    <td
                        class="remaining-cell"
                        style="
                            color:#dc2626;
                            white-space:nowrap;
                        "
                    >

                        ${formatCurrency(
                            remaining
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
                            remaining
                        )}

                    </td>


                    <!-- PERCENTAGE -->

                    <td>

                        <div
                            class="percentage-wrapper"
                            style="
                                min-width:150px;
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


    // ==================================
    // UPDATE CARDS
    // ==================================

    updateUserSummaryCards(
        list
    );


    // ==================================
    // SAVE USER NAME BUTTON
    // ==================================

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


                        await saveUserName(

                            userId,

                            input.value,

                            this

                        );

                    }
                );

            }
        );


    // ==================================
    // SAVE TARGET BUTTON
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


                        await saveUserTarget(

                            userId,

                            target,

                            this

                        );

                    }
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


// ======================================
// LOAD RECENT COLLECTIONS
// ======================================

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


        // ==================================
        // OLD TOTAL COLLECTION CARD
        // ==================================

        if (
            totalAmountEl
        ) {

            totalAmountEl.textContent =
                formatCurrency(
                    totalCollection
                );

        }


        // ==================================
        // TODAY COLLECTION
        // ==================================

        if (
            todayAmountEl
        ) {

            todayAmountEl.textContent =
                formatCurrency(
                    todayCollection
                );

        }


        // ==================================
        // TOTAL ENTRIES
        // ==================================

        if (
            totalEntriesCountEl
        ) {

            totalEntriesCountEl.textContent =
                latestEntries.length;

        }


        // ==================================
        // TABLE
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
                        style="
                            color:red;
                        "
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
// MAIN DASHBOARD LOAD
// ======================================

async function loadDashboard() {

    try {

        // ==================================
        // Loading Message
        // ==================================

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


        // ==================================
        // LOAD ALL FIREBASE DATA
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


        // ==================================
        // CONSOLE
        // ==================================

        console.log(
            "================================"
        );

        console.log(
            "DASHBOARD LOADED SUCCESSFULLY"
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
            "User Summary:",
            userSummaryData
        );

        console.log(
            "================================"
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
                        style="
                            color:red;
                        "
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
