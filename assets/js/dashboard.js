// ======================================================
// TELETHON ADMIN DASHBOARD
// USER WISE TARGET + COLLECTION SUMMARY
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
// HTML ELEMENTS
// ======================================================

// Old dashboard cards

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");


// User summary

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
// CONSTANT
// ======================================================

// 1 Unit = ₹7,000

const UNIT_VALUE = 7000;


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
// FORMAT UNIT
// ======================================================

function formatUnit(amount) {

    const unit =
        calculateUnit(amount);

    return (
        unit.toLocaleString(
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
        "================================"
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
            "createdAt orderBy failed.",
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


// ======================================================
// LOAD REGION USERS
// ======================================================

async function loadRegionUsers() {

    let snapshot = null;

    let collectionName = "";


    // --------------------------------------------------
    // regionUsers
    // --------------------------------------------------

    try {

        snapshot =
            await getDocs(
                collection(
                    db,
                    "regionUsers"
                )
            );


        if (
            snapshot &&
            !snapshot.empty
        ) {

            collectionName =
                "regionUsers";

        }

    }

    catch (error) {

        console.warn(
            "regionUsers not found.",
            error
        );

    }


    // --------------------------------------------------
    // region_users
    // --------------------------------------------------

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


            if (
                snapshot &&
                !snapshot.empty
            ) {

                collectionName =
                    "region_users";

            }

        }

        catch (error) {

            console.warn(
                "region_users not found.",
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
        "regionUsers:",
        regionUsers.length
    );

    console.log(
        "REGION USERS DATA:",
        regionUsers
    );

}


// ======================================================
// GET LATEST ENTRY PER EMPLOYEE + DATE
// ======================================================

function getLatestEntries() {

    const latestMap =
        new Map();


    // --------------------------------------------------
    // Important:
    // dailyEntries normally createdAt DESC me loaded
    // hote hain.
    //
    // Lekin agar ordering available nahi hui to hum
    // createdAt ko compare bhi karenge.
    // --------------------------------------------------

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


            if (
                !latestMap.has(key)
            ) {

                latestMap.set(
                    key,
                    entry
                );

                return;

            }


            // ------------------------------------------------
            // Agar duplicate Employee + Date hai
            // to latest createdAt rakhen
            // ------------------------------------------------

            const oldEntry =
                latestMap.get(key);


            const oldTime =
                getCreatedTime(
                    oldEntry
                );


            const newTime =
                getCreatedTime(
                    entry
                );


            if (
                newTime >= oldTime
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


    console.log(
        "LATEST ENTRIES:",
        result
    );


    return result;

}


// ======================================================
// CREATED TIME
// ======================================================

function getCreatedTime(entry) {

    const value =
        entry.createdAt;


    if (!value) {
        return 0;
    }


    // Firebase Timestamp

    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    // JS Date

    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    // String / Number

    const time =
        new Date(
            value
        ).getTime();


    return Number.isFinite(time)
        ? time
        : 0;

}


// ======================================================
// GET ACCESS RULES
// ======================================================

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


// ======================================================
// CHECK ACCESS RULE
// ======================================================

function employeeMatchesAccessRule(
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


    const employeeCity =
        normalize(
            getEmployeeCity(
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


    const assignedState =
        normalize(

            rule.state ||

            rule.assignedState ||

            rule.stateName ||

            rule.state_name ||

            ""

        );


    const assignedCity =
        normalize(

            rule.city ||

            rule.assignedCity ||

            rule.cityName ||

            rule.city_name ||

            ""

        );


    // --------------------------------------------------
    // Region
    // --------------------------------------------------

    if (
        assignedRegion &&
        assignedRegion !== "*" &&
        assignedRegion !== "all" &&
        assignedRegion !== employeeRegion
    ) {

        return false;

    }


    // --------------------------------------------------
    // State
    // --------------------------------------------------

    if (
        assignedState &&
        assignedState !== "*" &&
        assignedState !== "all" &&
        assignedState !== employeeState
    ) {

        return false;

    }


    // --------------------------------------------------
    // City
    // --------------------------------------------------

    if (
        assignedCity &&
        assignedCity !== "*" &&
        assignedCity !== "all" &&
        assignedCity !== employeeCity
    ) {

        return false;

    }


    // --------------------------------------------------
    // States Array
    // --------------------------------------------------

    let states = [];


    if (
        Array.isArray(
            rule.states
        )
    ) {

        states =
            rule.states;

    }


    if (
        states.length > 0
    ) {

        const stateMatch =
            states.some(
                (state) => {

                    const s =
                        normalize(
                            state
                        );

                    return (
                        s === "*" ||
                        s === "all" ||
                        s === "all states" ||
                        s === employeeState
                    );

                }
            );


        if (!stateMatch) {

            return false;

        }

    }


    return true;

}


// ======================================================
// USER NAME BASED MATCHING
// ======================================================
//
// regionUsers me agar access field nahi hai,
// to User Name ke basis par employee assign honge.
//
// Example:
//
// Delhi Region
// -> region = Delhi
//
// Gujarat State
// -> state = Gujarat
//
// Madhya Pradesh
// -> state = Madhya Pradesh
//
// Kolkata Region & Bihar
// -> region Kolkata OR state Bihar
//
// HYD & BLR Region
// -> Hyderabad OR Bangalore
// ======================================================

function getEmployeesByUserName(
    userName
) {

    const name =
        normalize(
            userName
        );


    if (!name) {

        return [];

    }


    // --------------------------------------------------
    // DIRECT STATE MATCH
    // --------------------------------------------------

    const stateMatches =
        employees.filter(
            (employee) => {

                return (
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) === name
                );

            }
        );


    if (
        stateMatches.length > 0
    ) {

        console.log(
            `User "${userName}" matched STATE:`,
            stateMatches
        );

        return stateMatches;

    }


    // --------------------------------------------------
    // DIRECT REGION MATCH
    // --------------------------------------------------

    const regionMatches =
        employees.filter(
            (employee) => {

                return (
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) === name
                );

            }
        );


    if (
        regionMatches.length > 0
    ) {

        console.log(
            `User "${userName}" matched REGION:`,
            regionMatches
        );

        return regionMatches;

    }


    // --------------------------------------------------
    // SPECIAL COMBINATIONS
    // --------------------------------------------------

    let specialEmployees = [];


    // Kolkata Region & Bihar

    if (
        name.includes("kolkata") &&
        name.includes("bihar")
    ) {

        specialEmployees =
            employees.filter(
                (employee) => {

                    const region =
                        normalize(
                            getEmployeeRegion(
                                employee
                            )
                        );

                    const state =
                        normalize(
                            getEmployeeState(
                                employee
                            )
                        );


                    return (

                        region.includes(
                            "kolkata"
                        )

                        ||

                        state ===
                        "bihar"

                    );

                }
            );

    }


    // HYD & BLR Region

    else if (
        name.includes("hyd") ||
        name.includes("blr") ||
        name.includes("hyderabad") ||
        name.includes("bangalore")
    ) {

        specialEmployees =
            employees.filter(
                (employee) => {

                    const region =
                        normalize(
                            getEmployeeRegion(
                                employee
                            )
                        );


                    return (

                        region.includes(
                            "hyderabad"
                        )

                        ||

                        region.includes(
                            "bangalore"
                        )

                        ||

                        region.includes(
                            "hyd"
                        )

                        ||

                        region.includes(
                            "blr"
                        )

                    );

                }
            );

    }


    // Delhi Region

    else if (
        name.includes("delhi")
    ) {

        specialEmployees =
            employees.filter(
                (employee) => {

                    const region =
                        normalize(
                            getEmployeeRegion(
                                employee
                            )
                        );


                    return (
                        region ===
                        "delhi"
                    );

                }
            );

    }


    if (
        specialEmployees.length > 0
    ) {

        console.log(
            `User "${userName}" special match:`,
            specialEmployees
        );

    }


    return specialEmployees;

}


// ======================================================
// GET TEACHERS FOR USER
// ======================================================

function getUserEmployees(user) {

    const userName =
        getUserName(
            user
        );


    const accessRules =
        getAccessRules(
            user
        );


    // --------------------------------------------------
    // FIRST PRIORITY:
    // Explicit access rules
    // --------------------------------------------------

    if (
        accessRules.length > 0
    ) {

        const matched =
            employees.filter(
                (employee) => {

                    return accessRules.some(
                        (rule) => {

                            return employeeMatchesAccessRule(
                                employee,
                                rule
                            );

                        }
                    );

                }
            );


        console.log(
            "USER:",
            userName,
            "ACCESS:",
            accessRules
        );


        console.log(
            "USER:",
            userName,
            "ACCESS MATCHED TEACHERS:",
            matched.length
        );


        return matched;

    }


    // --------------------------------------------------
    // SECOND PRIORITY:
    // User Name matching
    // --------------------------------------------------

    const matchedByName =
        getEmployeesByUserName(
            userName
        );


    console.log(
        "USER:",
        userName,
        "NAME MATCHED TEACHERS:",
        matchedByName.length
    );


    return matchedByName;

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
                    calculateUnit(
                        target
                    ),

                collection:
                    totalCollection,

                collectionUnit:
                    calculateUnit(
                        totalCollection
                    ),

                remaining:
                    remaining,

                remainingUnit:
                    calculateUnit(
                        remaining
                    ),

                percentage:
                    percentage,

                teacherCount:
                    userEmployees.length,

                teacherCodes:
                    userEmployees.map(
                        getEmployeeCode
                    ),

                originalUser:
                    user

            });


        }
    );


    console.log(
        "================================"
    );

    console.log(
        "FINAL USER SUMMARY:",
        userSummaryData
    );

}


// ======================================================
// UPDATE USER SUMMARY CARDS
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


    const totalPercentage =
        totalTarget > 0

            ? (
                totalCollection /
                totalTarget
            ) * 100

            : 0;


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


    if (
        userSummaryTotalPercentage
    ) {

        userSummaryTotalPercentage.textContent =
            totalPercentage.toFixed(
                2
            ) +
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


            const teacherCount =
                user.teacherCount;


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
                                    gap:6px;
                                    align-items:center;
                                "
                            >

                                <input
                                    type="text"
                                    class="user-name-input"
                                    data-id="${escapeHTML(
                                        user.id
                                    )}"
                                    value="${userName}"
                                    placeholder="Enter User Name"
                                >

                                <button
                                    type="button"
                                    class="save-user-name-btn"
                                    data-id="${escapeHTML(
                                        user.id
                                    )}"
                                    title="Save User Name"
                                >

                                    <i
                                        class="
                                            fa-solid
                                            fa-floppy-disk
                                        "
                                    ></i>

                                </button>

                            </div>


                            <small
                                style="
                                    display:block;
                                    margin-top:6px;
                                    color:#2563eb;
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-user
                                    "
                                ></i>

                                User:

                                <strong>
                                    ${userName}
                                </strong>

                            </small>


                            <small
                                style="
                                    display:block;
                                    margin-top:3px;
                                    color:#64748b;
                                "
                            >

                                ${teacherCount}
                                Teacher${teacherCount === 1 ? "" : "s"}

                            </small>

                        </div>

                    </td>


                    <!-- TARGET -->

                    <td>

                        <div
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
                                data-id="${escapeHTML(
                                    user.id
                                )}"
                                value="${user.target || ""}"
                                placeholder="Enter Target"
                            >


                            <button
                                type="button"
                                class="save-user-target-btn"
                                data-id="${escapeHTML(
                                    user.id
                                )}"
                                title="Save Target"
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-floppy-disk
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

                        ${formatUnit(
                            user.target
                        )}

                    </td>


                    <!-- COLLECTION -->

                    <td
                        style="
                            color:#ef4444;
                            font-weight:600;
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
                            user.collection
                        )}

                    </td>


                    <!-- REMAINING -->

                    <td
                        style="
                            color:#ef4444;
                            font-weight:600;
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
                            user.remaining
                        )}

                    </td>


                    <!-- PERCENTAGE -->

                    <td>

                        <div
                            class="
                                percentage-wrapper
                                ${percentageClass}
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
                                `.user-name-input[data-id="${CSS.escape(
                                    userId
                                )}"]`
                            );


                        if (!input) {

                            return;

                        }


                        const userName =
                            String(
                                input.value || ""
                            ).trim();


                        if (!userName) {

                            alert(
                                "Please enter User Name."
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


                        const collectionName =
                            user.collectionName ||
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

                            await setDoc(

                                doc(
                                    db,
                                    collectionName,
                                    userId
                                ),

                                {

                                    name:
                                        userName,

                                    userName:
                                        userName,

                                    updatedAt:
                                        new Date()

                                },

                                {
                                    merge: true
                                }

                            );


                            user.userName =
                                userName;


                            user.originalUser.name =
                                userName;

                            user.originalUser.userName =
                                userName;


                            // --------------------------------
                            // Rebuild because User Name can
                            // determine employee assignment.
                            // --------------------------------

                            buildUserSummary();


                            displayUserSummary(
                                userSummaryData
                            );


                            console.log(
                                "User Name Saved:",
                                userName
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
                                `.user-target-input[data-id="${CSS.escape(
                                    userId
                                )}"]`
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
                                "Please enter valid Target."
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


                        const collectionName =
                            user.collectionName ||
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
// OLD RECENT COLLECTION
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

        // ----------------------------------------------
        // Loading
        // ----------------------------------------------

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


        // ----------------------------------------------
        // Load All Data
        // ----------------------------------------------

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadRegionUsers()

        ]);


        console.log(
            "================================"
        );

        console.log(
            "TOTAL EMPLOYEES:",
            employees.length
        );

        console.log(
            "TOTAL DAILY ENTRIES:",
            dailyEntries.length
        );

        console.log(
            "TOTAL REGION USERS:",
            regionUsers.length
        );


        // ----------------------------------------------
        // Build Summary
        // ----------------------------------------------

        buildUserSummary();


        // ----------------------------------------------
        // Display
        // ----------------------------------------------

        displayUserSummary(
            userSummaryData
        );


        // ----------------------------------------------
        // Recent Collections
        // ----------------------------------------------

        await loadRecentCollections();


        console.log(
            "================================"
        );

        console.log(
            "DASHBOARD LOADED SUCCESSFULLY"
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


// ======================================================
// START DASHBOARD
// ======================================================

loadDashboard();
