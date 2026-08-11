// ======================================
// TELETHON ADMIN DASHBOARD
// USER WISE TARGET + COLLECTION SUMMARY
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
// CONSTANT
// ======================================

const UNIT_VALUE = 7000;


// ======================================
// HTML ELEMENTS
// ======================================

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

const userSummarySearch =
    document.getElementById(
        "userSummarySearch"
    );


// Old Dashboard

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
    .toLowerCase()
    .replace(/\s+/g, " ");
}


// ======================================
// NORMALIZE LOCATION
// ======================================

function normalizeLocation(value) {

    let text =
        normalize(value);

    text = text
        .replace(/\bregion\b/g, "")
        .replace(/\bstate\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

    return text;
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
// UNIT
// ======================================

function getUnits(amount) {

    return (
        Number(amount || 0) /
        UNIT_VALUE
    );
}


// ======================================
// FORMAT UNIT
// ======================================

function formatUnit(amount) {

    const units =
        getUnits(amount);

    if (
        Number.isInteger(units)
    ) {

        return (
            units.toLocaleString("en-IN") +
            " Unit"
        );

    }

    return (
        units.toFixed(2) +
        " Unit"
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

        employee.code ||

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

        entry.code ||

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

        user.teacherName ||

        user.teacher_name ||

        ""

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

                employees.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

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

        console.log(
            "================================"
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


// ======================================
// LOAD DAILY ENTRIES
// ======================================

async function loadDailyEntries() {

    try {

        let snapshot;

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

        catch (error) {

            console.warn(
                "createdAt orderBy failed."
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


        console.log(
            "TOTAL DAILY ENTRIES:",
            dailyEntries.length
        );

    }

    catch (error) {

        console.error(
            "Daily Entries Load Error:",
            error
        );

        throw error;
    }
}


// ======================================
// LOAD REGION USERS
// ======================================

async function loadRegionUsers() {

    let snapshot = null;


    // ==================================
    // regionUsers
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
            "regionUsers not found:",
            error
        );

    }


    // ==================================
    // region_users
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
                "region_users:",
                snapshot.size
            );

        }

        catch (error) {

            console.warn(
                "region_users not found:",
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
                        "regionUsers",

                    ...docSnapshot.data()

                });

            }
        );

    }


    console.log(
        "TOTAL REGION USERS:",
        regionUsers.length
    );

    console.log(
        "REGION USERS DATA:",
        regionUsers
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
                `${normalize(employeeCode)}_${date}`;


            // ------------------------------
            // Existing Entry
            // ------------------------------

            if (
                latestMap.has(key)
            ) {

                const oldEntry =
                    latestMap.get(key);


                const oldTime =
                    getEntryTime(
                        oldEntry
                    );


                const newTime =
                    getEntryTime(
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

            else {

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
// ENTRY TIME
// ======================================

function getEntryTime(entry) {

    const createdAt =
        entry.createdAt;


    if (
        createdAt &&
        typeof createdAt.toMillis ===
        "function"
    ) {

        return createdAt.toMillis();

    }


    if (
        createdAt &&
        typeof createdAt.seconds ===
        "number"
    ) {

        return (
            createdAt.seconds *
            1000
        );

    }


    if (
        createdAt instanceof Date
    ) {

        return createdAt.getTime();

    }


    const dateTime =
        Date.parse(
            String(
                entry.createdAt ||
                entry.updatedAt ||
                entry.timestamp ||
                ""
            )
        );


    if (
        Number.isFinite(dateTime)
    ) {

        return dateTime;

    }


    return 0;
}


// ======================================
// GET ACCESS RULES
// ======================================

function getAccessRules(user) {

    let rules = [];


    if (
        Array.isArray(user.access)
    ) {

        rules =
            user.access;

    }

    else if (
        Array.isArray(
            user.accessRules
        )
    ) {

        rules =
            user.accessRules;

    }

    else if (
        Array.isArray(
            user.permissions
        )
    ) {

        rules =
            user.permissions;

    }


    // ==================================
    // Direct User Fields
    // ==================================

    if (
        rules.length === 0
    ) {

        const hasDirectAccess =
            user.region ||
            user.state ||
            user.city ||
            user.selectedRegion ||
            user.selectedState ||
            user.selectedCity ||
            user.assignedRegion ||
            user.assignedState ||
            user.assignedCity;


        if (
            hasDirectAccess
        ) {

            rules = [
                user
            ];

        }

    }


    return rules;
}


// ======================================
// GET RULE VALUES
// ======================================

function getRuleRegions(rule) {

    let values = [];


    if (
        Array.isArray(
            rule.regions
        )
    ) {

        values =
            values.concat(
                rule.regions
            );

    }


    if (
        Array.isArray(
            rule.selectedRegions
        )
    ) {

        values =
            values.concat(
                rule.selectedRegions
            );

    }


    if (
        Array.isArray(
            rule.assignedRegions
        )
    ) {

        values =
            values.concat(
                rule.assignedRegions
            );

    }


    const singleValues = [

        rule.region,

        rule.regionName,

        rule.region_name,

        rule.assignedRegion,

        rule.selectedRegion

    ];


    singleValues.forEach(
        (value) => {

            if (
                value
            ) {

                values.push(
                    value
                );

            }

        }
    );


    return values
        .filter(Boolean);
}


// ======================================
// GET RULE STATES
// ======================================

function getRuleStates(rule) {

    let values = [];


    if (
        Array.isArray(
            rule.states
        )
    ) {

        values =
            values.concat(
                rule.states
            );

    }


    if (
        Array.isArray(
            rule.selectedStates
        )
    ) {

        values =
            values.concat(
                rule.selectedStates
            );

    }


    if (
        Array.isArray(
            rule.assignedStates
        )
    ) {

        values =
            values.concat(
                rule.assignedStates
            );

    }


    const singleValues = [

        rule.state,

        rule.stateName,

        rule.state_name,

        rule.assignedState,

        rule.selectedState

    ];


    singleValues.forEach(
        (value) => {

            if (
                value
            ) {

                values.push(
                    value
                );

            }

        }
    );


    return values
        .filter(Boolean);
}


// ======================================
// GET RULE CITIES
// ======================================

function getRuleCities(rule) {

    let values = [];


    if (
        Array.isArray(
            rule.cities
        )
    ) {

        values =
            values.concat(
                rule.cities
            );

    }


    if (
        Array.isArray(
            rule.selectedCities
        )
    ) {

        values =
            values.concat(
                rule.selectedCities
            );

    }


    if (
        Array.isArray(
            rule.assignedCities
        )
    ) {

        values =
            values.concat(
                rule.assignedCities
            );

    }


    const singleValues = [

        rule.city,

        rule.cityName,

        rule.city_name,

        rule.assignedCity,

        rule.selectedCity

    ];


    singleValues.forEach(
        (value) => {

            if (
                value
            ) {

                values.push(
                    value
                );

            }

        }
    );


    return values
        .filter(Boolean);
}


// ======================================
// LOCATION MATCH
// ======================================

function locationMatches(
    employeeValue,
    assignedValues
) {

    if (
        assignedValues.length === 0
    ) {

        return true;

    }


    const employee =
        normalizeLocation(
            employeeValue
        );


    if (!employee) {
        return false;
    }


    return assignedValues.some(
        (value) => {

            const assigned =
                normalizeLocation(
                    value
                );


            if (!assigned) {
                return false;
            }


            if (
                assigned === "*" ||
                assigned === "all" ||
                assigned === "all states" ||
                assigned === "all cities" ||
                assigned === "all regions"
            ) {

                return true;

            }


            if (
                assigned === employee
            ) {

                return true;

            }


            // Flexible match
            if (
                employee.includes(
                    assigned
                ) ||
                assigned.includes(
                    employee
                )
            ) {

                return true;

            }


            return false;

        }
    );
}


// ======================================
// CHECK FULL REGION ACCESS
// ======================================

function isFullAccess(rule) {

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
        ) === "full" ||

        normalize(
            rule.access
        ) === "full"

    );
}


// ======================================
// CHECK EMPLOYEE ACCESS
// ======================================

function employeeMatchesRule(
    employee,
    rule
) {

    if (!rule) {
        return false;
    }


    const employeeRegion =
        getEmployeeRegion(
            employee
        );


    const employeeState =
        getEmployeeState(
            employee
        );


    const employeeCity =
        getEmployeeCity(
            employee
        );


    const assignedRegions =
        getRuleRegions(
            rule
        );


    const assignedStates =
        getRuleStates(
            rule
        );


    const assignedCities =
        getRuleCities(
            rule
        );


    // ==================================
    // REGION
    // ==================================

    if (
        assignedRegions.length > 0 &&
        !locationMatches(
            employeeRegion,
            assignedRegions
        )
    ) {

        return false;

    }


    // ==================================
    // FULL ACCESS
    // ==================================

    if (
        isFullAccess(rule)
    ) {

        return true;

    }


    // ==================================
    // STATE
    // ==================================

    if (
        assignedStates.length > 0
    ) {

        if (
            !locationMatches(
                employeeState,
                assignedStates
            )
        ) {

            return false;

        }

    }


    // ==================================
    // CITY
    // ==================================

    if (
        assignedCities.length > 0
    ) {

        if (
            !locationMatches(
                employeeCity,
                assignedCities
            )
        ) {

            return false;

        }

    }


    // ==================================
    // If rule has no location
    // ==================================

    if (
        assignedRegions.length === 0 &&
        assignedStates.length === 0 &&
        assignedCities.length === 0
    ) {

        return false;

    }


    return true;
}


// ======================================
// GET TEACHERS FOR USER
// ======================================

function getUserEmployees(user) {

    const accessRules =
        getAccessRules(
            user
        );


    console.log(
        "USER:",
        getUserName(user),
        "ACCESS:",
        accessRules
    );


    // ==================================
    // First try access rules
    // ==================================

    if (
        accessRules.length > 0
    ) {

        const matched =
            employees.filter(
                (employee) => {

                    return accessRules.some(
                        (rule) =>
                            employeeMatchesRule(
                                employee,
                                rule
                            )
                    );

                }
            );


        if (
            matched.length > 0
        ) {

            return matched;

        }

    }


    // ==================================
    // Direct User Region / State / City
    // ==================================

    const directRegion =
        user.region ||
        user.regionName ||
        user.assignedRegion ||
        user.selectedRegion ||
        "";


    const directState =
        user.state ||
        user.stateName ||
        user.assignedState ||
        user.selectedState ||
        "";


    const directCity =
        user.city ||
        user.cityName ||
        user.assignedCity ||
        user.selectedCity ||
        "";


    if (
        directRegion ||
        directState ||
        directCity
    ) {

        const matched =
            employees.filter(
                (employee) => {

                    if (
                        directRegion &&
                        !locationMatches(
                            getEmployeeRegion(
                                employee
                            ),
                            [directRegion]
                        )
                    ) {

                        return false;

                    }


                    if (
                        directState &&
                        !locationMatches(
                            getEmployeeState(
                                employee
                            ),
                            [directState]
                        )
                    ) {

                        return false;

                    }


                    if (
                        directCity &&
                        !locationMatches(
                            getEmployeeCity(
                                employee
                            ),
                            [directCity]
                        )
                    ) {

                        return false;

                    }


                    return true;

                }
            );


        return matched;

    }


    return [];
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


            if (
                code
            ) {

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


            const percentage =
                target > 0

                    ? (
                        totalCollection /
                        target
                    ) * 100

                    : 0;


            const summaryUser = {

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

                targetUnit:
                    getUnits(target),

                collectionUnit:
                    getUnits(
                        totalCollection
                    ),

                remainingUnit:
                    getUnits(
                        remaining
                    ),

                teacherCount:
                    userEmployees.length,

                originalUser:
                    user

            };


            userSummaryData.push(
                summaryUser
            );


            console.log(
                "USER SUMMARY:",
                summaryUser.userName,
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


    updateUserSummaryCards(
        list
    );


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
                                value="${user.target || ""}"
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


                    <!-- TARGET UNIT -->

                    <td
                        style="
                            color:#059669;
                            font-weight:700;
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
                            color:#dc2626;
                            font-weight:700;
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
                            color:#111827;
                            font-weight:700;
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
                            color:#dc2626;
                            font-weight:700;
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
                            color:#111827;
                            font-weight:700;
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


    // ==================================
    // SAVE TARGET
    // ==================================

    document
        .querySelectorAll(
            ".save-user-target-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    saveUserData
                );

            }
        );


    // ==================================
    // SAVE USER NAME
    // ==================================

    document
        .querySelectorAll(
            ".user-name-input"
        )
        .forEach(
            (input) => {

                input.addEventListener(
                    "change",
                    saveUserData
                );

                input.addEventListener(
                    "blur",
                    saveUserData
                );

            }
        );

}


// ======================================
// SAVE USER NAME + TARGET
// ======================================

async function saveUserData(event) {

    const element =
        event.currentTarget;


    const userId =
        element.dataset.id;


    if (!userId) {
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


    const nameInput =
        document.querySelector(
            `.user-name-input[data-id="${CSS.escape(userId)}"]`
        );


    const targetInput =
        document.querySelector(
            `.user-target-input[data-id="${CSS.escape(userId)}"]`
        );


    const userName =
        nameInput
            ? nameInput.value.trim()
            : user.userName;


    const target =
        targetInput
            ? numberValue(
                targetInput.value
            )
            : user.target;


    try {

        if (
            element.classList.contains(
                "save-user-target-btn"
            )
        ) {

            element.disabled =
                true;


            element.innerHTML = `

                <i
                    class="
                        fa-solid
                        fa-spinner
                        fa-spin
                    "
                ></i>

            `;

        }


        const originalUser =
            user.originalUser;


        const collectionName =
            originalUser.__collectionName ||
            "regionUsers";


        // ==================================
        // SAVE FIRESTORE
        // ==================================

        await setDoc(

            doc(
                db,
                collectionName,
                userId
            ),

            {

                userName:
                    userName,

                name:
                    userName,

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
        // UPDATE LOCAL
        // ==================================

        user.userName =
            userName;

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

        user.targetUnit =
            getUnits(
                target
            );

        user.remainingUnit =
            getUnits(
                user.remaining
            );


        // ==================================
        // Refresh Table
        // ==================================

        const search =
            userSummarySearch
                ? normalize(
                    userSummarySearch.value
                )
                : "";


        let displayList =
            userSummaryData;


        if (search) {

            displayList =
                userSummaryData.filter(
                    (item) => {

                        return (

                            normalize(
                                item.userName
                            )
                            .includes(
                                search
                            )

                            ||

                            normalize(
                                item.userCode
                            )
                            .includes(
                                search
                            )

                        );

                    }
                );

        }


        displayUserSummary(
            displayList
        );


        console.log(
            "User Saved:",
            userName,
            target
        );

    }

    catch (error) {

        console.error(
            "User Save Error:",
            error
        );


        alert(
            "Data save nahi hua:\n" +
            error.message
        );

    }

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
// OLD COLLECTION SUMMARY
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
                            ${escapeHTML(city)},
                            ${escapeHTML(state)}
                        </td>

                        <td>
                            ${escapeHTML(region)}
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
        // OLD COLLECTION
        // ==================================

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


// ======================================
// START DASHBOARD
// ======================================

loadDashboard();
