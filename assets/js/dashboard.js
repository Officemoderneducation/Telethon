// ======================================
// TELETHON ADMIN DASHBOARD
// USER WISE TARGET + COLLECTION SUMMARY
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

const UNIT_VALUE = 7000;


// ======================================
// HTML ELEMENTS
// ======================================

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");


// User Summary

const userSummaryTableBody =
    document.getElementById("userSummaryTableBody");

const userSummaryTotalTarget =
    document.getElementById("userSummaryTotalTarget");

const userSummaryTotalCollection =
    document.getElementById("userSummaryTotalCollection");

const userSummaryTotalRemaining =
    document.getElementById("userSummaryTotalRemaining");

const userSummarySearch =
    document.getElementById("userSummarySearch");


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

    return String(value ?? "")
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
            .replace(/\s/g, "")
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

function calculateUnit(value) {

    return Math.floor(
        Number(value || 0) / UNIT_VALUE
    );

}


function formatUnit(value) {

    return (
        calculateUnit(value)
        .toLocaleString("en-IN")
        + " Unit"
    );

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(value) {

    return String(value ?? "")
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

        entry.collection_amount ||

        entry.totalCollection ||

        entry.total_collection ||

        entry.dailyCollection ||

        entry.daily_collection ||

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

    }

    catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );

    }


    console.log(
        "Total Employees:",
        employees.length
    );

}


// ======================================
// LOAD DAILY ENTRIES
// ======================================

async function loadDailyEntries() {

    dailyEntries = [];

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


        try {

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

        catch (secondError) {

            console.error(
                "Daily Entry Load Error:",
                secondError
            );

        }

    }


    console.log(
        "Total Daily Entries:",
        dailyEntries.length
    );

}


// ======================================
// LOAD REGION USERS
// ======================================

async function loadRegionUsers() {

    regionUsers = [];


    // ==================================
    // FIRST COLLECTION
    // ==================================

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "regionUsers"
                )
            );


        snapshot.forEach(
            (docSnapshot) => {

                regionUsers.push({

                    id:
                        docSnapshot.id,

                    collectionName:
                        "regionUsers",

                    ...docSnapshot.data()

                });

            }
        );


        console.log(
            "regionUsers:",
            regionUsers.length
        );

    }

    catch (error) {

        console.warn(
            "regionUsers not found:",
            error
        );

    }


    // ==================================
    // SECOND COLLECTION
    // ==================================

    if (
        regionUsers.length === 0
    ) {

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

                    regionUsers.push({

                        id:
                            docSnapshot.id,

                        collectionName:
                            "region_users",

                        ...docSnapshot.data()

                    });

                }
            );


            console.log(
                "region_users:",
                regionUsers.length
            );

        }

        catch (error) {

            console.warn(
                "region_users not found:",
                error
            );

        }

    }


    console.log(
        "Total Region Users:",
        regionUsers.length
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
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
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


            // ----------------------------------
            // Existing Entry
            // ----------------------------------

            if (
                !latestMap.has(key)
            ) {

                latestMap.set(
                    key,
                    entry
                );

                return;

            }


            // ----------------------------------
            // Compare Created At
            // ----------------------------------

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


    return Array.from(
        latestMap.values()
    );

}


// ======================================
// CREATED TIME
// ======================================

function getCreatedTime(entry) {

    if (
        entry.createdAt &&
        typeof entry.createdAt.toMillis ===
        "function"
    ) {

        return entry.createdAt.toMillis();

    }


    if (
        entry.createdAt &&
        entry.createdAt.seconds
    ) {

        return (
            Number(
                entry.createdAt.seconds
            ) * 1000
        );

    }


    if (
        entry.created_at
    ) {

        const time =
            new Date(
                entry.created_at
            ).getTime();


        return Number.isFinite(time)
            ? time
            : 0;

    }


    return 0;

}


// ======================================
// ARRAY HELPER
// ======================================

function toArray(value) {

    if (
        Array.isArray(value)
    ) {

        return value;

    }


    if (
        typeof value === "string" &&
        value.trim()
    ) {

        return value
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }


    return [];

}


// ======================================
// GET USER ACCESS RULES
// ======================================

function getUserAccessRules(user) {

    let rules = [];


    if (
        Array.isArray(
            user.access
        )
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
            user.rules
        )
    ) {

        rules =
            user.rules;

    }


    // ==================================
    // If direct user fields exist
    // ==================================

    if (
        rules.length === 0
    ) {

        const directRule = {

            region:
                user.region ||
                user.assignedRegion ||
                user.regionName ||
                "",

            state:
                user.state ||
                user.assignedState ||
                user.stateName ||
                "",

            city:
                user.city ||
                user.assignedCity ||
                user.cityName ||
                "",

            employeeCodes:
                user.employeeCodes ||
                user.employee_codes ||
                user.assignedEmployees ||
                []

        };


        if (
            directRule.region ||
            directRule.state ||
            directRule.city ||
            directRule.employeeCodes.length
        ) {

            rules = [
                directRule
            ];

        }

    }


    return rules;

}


// ======================================
// CHECK ALL / FULL ACCESS
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
// GET RULE EMPLOYEE CODES
// ======================================

function getRuleEmployeeCodes(rule) {

    let codes = [];


    const fields = [

        rule.employeeCodes,

        rule.employee_codes,

        rule.assignedEmployees,

        rule.assignedEmployeeCodes,

        rule.employeeCode,

        rule.employee_code,

        rule.empCodes,

        rule.emp_codes

    ];


    fields.forEach(
        (field) => {

            codes.push(
                ...toArray(
                    field
                )
            );

        }
    );


    return codes
        .map(
            code =>
                normalize(code)
        )
        .filter(Boolean);

}


// ======================================
// GET RULE REGIONS
// ======================================

function getRuleRegions(rule) {

    return [

        ...toArray(
            rule.region
        ),

        ...toArray(
            rule.regions
        ),

        ...toArray(
            rule.assignedRegion
        ),

        ...toArray(
            rule.assignedRegions
        ),

        ...toArray(
            rule.regionName
        ),

        ...toArray(
            rule.region_name
        )

    ]
    .map(
        value =>
            normalize(value)
    )
    .filter(Boolean);

}


// ======================================
// GET RULE STATES
// ======================================

function getRuleStates(rule) {

    return [

        ...toArray(
            rule.state
        ),

        ...toArray(
            rule.states
        ),

        ...toArray(
            rule.selectedStates
        ),

        ...toArray(
            rule.assignedStates
        ),

        ...toArray(
            rule.stateName
        )

    ]
    .map(
        value =>
            normalize(value)
    )
    .filter(Boolean);

}


// ======================================
// GET RULE CITIES
// ======================================

function getRuleCities(rule) {

    return [

        ...toArray(
            rule.city
        ),

        ...toArray(
            rule.cities
        ),

        ...toArray(
            rule.selectedCities
        ),

        ...toArray(
            rule.assignedCities
        ),

        ...toArray(
            rule.cityName
        )

    ]
    .map(
        value =>
            normalize(value)
    )
    .filter(Boolean);

}


// ======================================
// MATCH VALUE
// ======================================

function matchValue(
    allowedValues,
    actualValue
) {

    if (
        allowedValues.length === 0
    ) {

        return true;

    }


    const actual =
        normalize(
            actualValue
        );


    return allowedValues.some(
        value => (

            value === "*" ||

            value === "all" ||

            value === "all states" ||

            value === "all cities" ||

            value === "all regions" ||

            value === actual

        )
    );

}


// ======================================
// CHECK EMPLOYEE AGAINST RULE
// ======================================

function employeeMatchesRule(
    employee,
    rule
) {

    if (!rule) {
        return false;
    }


    // ==================================
    // Full Access
    // ==================================

    if (
        isFullAccess(rule)
    ) {

        return true;

    }


    const employeeCode =
        normalize(
            getEmployeeCode(
                employee
            )
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


    // ==================================
    // Employee Code Match
    // ==================================

    const ruleCodes =
        getRuleEmployeeCodes(
            rule
        );


    if (
        ruleCodes.length > 0
    ) {

        if (
            ruleCodes.includes(
                employeeCode
            )
        ) {

            return true;

        }

    }


    // ==================================
    // Region
    // ==================================

    const ruleRegions =
        getRuleRegions(
            rule
        );


    if (
        !matchValue(
            ruleRegions,
            employeeRegion
        )
    ) {

        return false;

    }


    // ==================================
    // State
    // ==================================

    const ruleStates =
        getRuleStates(
            rule
        );


    if (
        !matchValue(
            ruleStates,
            employeeState
        )
    ) {

        return false;

    }


    // ==================================
    // City
    // ==================================

    const ruleCities =
        getRuleCities(
            rule
        );


    if (
        !matchValue(
            ruleCities,
            employeeCity
        )
    ) {

        return false;

    }


    // ==================================
    // At Least One Restriction
    // ==================================

    if (

        ruleRegions.length === 0 &&

        ruleStates.length === 0 &&

        ruleCities.length === 0

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
        getUserAccessRules(
            user
        );


    if (
        accessRules.length === 0
    ) {

        console.warn(
            "No access rules for user:",
            getUserName(user)
        );

        return [];

    }


    const matched =
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
        "User:",
        getUserName(user),
        "Matched Teachers:",
        matched.length
    );


    return matched;

}


// ======================================
// GET COLLECTION FOR USER
// ======================================

function getUserCollection(
    userEmployees,
    latestEntries
) {

    // ==================================
    // Employee Codes
    // ==================================

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


    console.log(
        "User Employee Codes:",
        Array.from(
            employeeCodes
        )
    );


    // ==================================
    // Calculate Collection
    // ==================================

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

                const amount =
                    getEntryAmount(
                        entry
                    );


                total += amount;

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


            const collectionAmount =
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
                    collectionAmount,
                    0
                );


            let percentage = 0;


            if (
                target > 0
            ) {

                percentage =
                    (
                        collectionAmount /
                        target
                    ) * 100;

            }


            userSummaryData.push({

                id:
                    user.id,

                collectionName:
                    user.collectionName,

                userCode:
                    getUserCode(user),

                userName:
                    getUserName(user),

                target:
                    target,

                collection:
                    collectionAmount,

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


            const collectionAmount =
                numberValue(
                    user.collection
                );


            const remaining =
                numberValue(
                    user.remaining
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
                                    class="fa-solid fa-save"
                                ></i>

                            </button>

                        </div>

                    </td>


                    <!-- TARGET UNIT -->

                    <td>

                        <strong>
                            ${formatUnit(target)}
                        </strong>

                    </td>


                    <!-- COLLECTION -->

                    <td
                        class="collection-cell"
                    >

                        <strong>
                            ${formatCurrency(
                                collectionAmount
                            )}
                        </strong>

                    </td>


                    <!-- COLLECTION UNIT -->

                    <td>

                        <strong>
                            ${formatUnit(
                                collectionAmount
                            )}
                        </strong>

                    </td>


                    <!-- REMAINING -->

                    <td
                        class="remaining-cell"
                    >

                        ${formatCurrency(
                            remaining
                        )}

                    </td>


                    <!-- REMAINING UNIT -->

                    <td>

                        <strong>
                            ${formatUnit(
                                remaining
                            )}
                        </strong>

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


    attachUserEvents();

}


// ======================================
// USER EVENTS
// ======================================

function attachUserEvents() {


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

                            await setDoc(

                                doc(
                                    db,
                                    user.collectionName,
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
                    async function () {

                        const userId =
                            this.dataset.id;


                        const userName =
                            String(
                                this.value || ""
                            ).trim();


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
                                    user.collectionName,
                                    userId
                                ),

                                {

                                    userName:
                                        userName,

                                    name:
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

                        }

                    }
                );

            }
        );

}


// ======================================
// SEARCH
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
// LOAD RECENT COLLECTIONS
// ======================================

async function loadRecentCollections() {

    try {

        const latestEntries =
            getLatestEntries();


        latestEntries.sort(
            (a, b) => {

                return (
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
                );

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
                    String(
                        data.date || ""
                    ) === todayStr
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


        console.log(
            "Dashboard Total Collection:",
            totalCollection
        );

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
        // LOAD FIREBASE DATA
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
            "================================"
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
