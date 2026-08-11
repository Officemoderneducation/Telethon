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

    localStorage.removeItem(
        "loggedInEmpCode"
    );

    localStorage.removeItem(
        "userRole"
    );

    window.location.href =
        "index.html";

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
    document.getElementById(
        "totalAmount"
    );


const todayAmountEl =
    document.getElementById(
        "todayAmount"
    );


const totalEntriesCountEl =
    document.getElementById(
        "totalEntriesCount"
    );


const entriesTableBody =
    document.getElementById(
        "entriesTableBody"
    );


// User Summary

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
// NUMBER
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

        user.teacherName ||

        user.teacher_name ||

        getUserCode(user) ||

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
        "Total Daily Entries:",
        dailyEntries.length
    );

}


// ======================================
// GET LATEST ENTRIES
// Employee + Date
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
                `${employeeCode}_${date}`;


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
// GET TEACHERS FOR USER
// ======================================
//
// User ke access rules ke according
// employees filter honge.
// ======================================

function getUserEmployees(user) {

    const accessRules =

        Array.isArray(
            user.access
        )

            ? user.access

            : Array.isArray(
                user.accessRules
            )

                ? user.accessRules

                : [];


    // ----------------------------------
    // Agar access nahi hai
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


            return accessRules.some(
                (rule) => {

                    if (!rule) {
                        return false;
                    }


                    // ------------------------------
                    // Assigned Region
                    // ------------------------------

                    const assignedRegion =
                        normalize(

                            rule.region ||

                            rule.assignedRegion ||

                            rule.regionName ||

                            rule.region_name ||

                            ""

                        );


                    // ------------------------------
                    // Region Match
                    // ------------------------------

                    if (

                        assignedRegion &&

                        assignedRegion !==
                        employeeRegion

                    ) {

                        return false;

                    }


                    // ------------------------------
                    // Full Region
                    // ------------------------------

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


                    if (fullRegion) {

                        return true;

                    }


                    // ------------------------------
                    // States
                    // ------------------------------

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


                    // ------------------------------
                    // No State Restriction
                    // ------------------------------

                    if (
                        states.length === 0
                    ) {

                        return true;

                    }


                    // ------------------------------
                    // State Match
                    // ------------------------------

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
// LOAD REGION USERS
// ======================================

async function loadRegionUsers() {

    let snapshot = null;


    // ==================================
    // First: regionUsers
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
    // Second: region_users
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
                    percentage,
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


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


                    <td>

                        <div class="user-name-cell">

                            <strong>
                                ${userName}
                            </strong>

                            <small>
                                ${userCode}
                            </small>

                        </div>

                    </td>


                    <td>

                        <div class="target-edit-box">

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

                                <i class="fa-solid fa-save"></i>

                            </button>

                        </div>

                    </td>


                    <td class="collection-cell">

                        <strong>
                            ${formatCurrency(
                                user.collection
                            )}
                        </strong>

                    </td>


                    <td class="remaining-cell">

                        ${formatCurrency(
                            user.remaining
                        )}

                    </td>


                    <td>

                        <div class="percentage-wrapper">

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

                </tr>

            `;

        }
    );


    userSummaryTableBody.innerHTML =
        html;


    updateUserSummaryCards(
        list
    );


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


                        const originalUser =
                            user.originalUser;


                        // ==================================
                        // Disable Button
                        // ==================================

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
                            // Save User Target
                            // ==================================

                            await setDoc(

                                doc(
                                    db,
                                    originalUser.__collectionName ||
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

                                    updatedAt:
                                        new Date()

                                },

                                {
                                    merge: true
                                }

                            );


                            // ==================================
                            // Update Local Data
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
                                userSummaryData
                            );


                            console.log(
                                "User Target Saved:",
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


// ======================================
// OLD DASHBOARD COLLECTION
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


if (logoutBtn) {

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
        // Load All Data
        // ==================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadRegionUsers()

        ]);


        // ==================================
        // Build User Summary
        // ==================================

        buildUserSummary();


        // ==================================
        // Display User Summary
        // ==================================

        displayUserSummary(
            userSummaryData
        );


        // ==================================
        // Recent Collections
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
// START
// ======================================

loadDashboard();
