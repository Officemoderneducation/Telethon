// ======================================
// TELETHON ADMIN DASHBOARD
// User Wise Target + Teacher Collection
// Target / Collection Unit = Amount ÷ 7000
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

// Old Dashboard

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

let regionUserCollectionName =
    "regionUsers";

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

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(
            String(value)
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

    const amount =
        numberValue(value);


    const unit =
        amount / UNIT_VALUE;


    // Integer ho to decimal nahi
    if (
        Number.isInteger(unit)
    ) {

        return `${unit} Unit`;

    }


    return `${unit.toFixed(2)} Unit`;

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

        user.user_name ||

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
// GET DATE VALUE
// ======================================

function getDateValue(value) {

    if (!value) {

        return 0;

    }


    // Firestore Timestamp

    if (
        typeof value === "object" &&
        typeof value.toMillis === "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value === "object" &&
        value.seconds
    ) {

        return (
            Number(value.seconds) * 1000
        );

    }


    const date =
        new Date(value);


    const time =
        date.getTime();


    return Number.isFinite(time)
        ? time
        : 0;

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


            const existing =
                latestMap.get(key);


            // ----------------------------------
            // First Entry
            // ----------------------------------

            if (!existing) {

                latestMap.set(
                    key,
                    entry
                );

                return;

            }


            // ----------------------------------
            // Compare createdAt
            // ----------------------------------

            const existingTime =
                getDateValue(
                    existing.createdAt
                );


            const currentTime =
                getDateValue(
                    entry.createdAt
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


// ======================================
// CONVERT ACCESS VALUE TO ARRAY
// ======================================

function toArray(value) {

    if (
        Array.isArray(value)
    ) {

        return value;

    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return [];

    }


    return [value];

}


// ======================================
// GET ACCESS RULES
// ======================================

function getAccessRules(user) {

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


    // ----------------------------------
    // If direct access fields exist
    // ----------------------------------

    if (
        rules.length === 0
    ) {

        const directRegion =
            user.region ||
            user.assignedRegion ||
            user.regionName ||
            user.region_name;


        const directState =
            user.state ||
            user.assignedState ||
            user.stateName ||
            user.state_name;


        const directCity =
            user.city ||
            user.assignedCity ||
            user.cityName ||
            user.city_name;


        if (
            directRegion ||
            directState ||
            directCity
        ) {

            rules = [

                {

                    region:
                        directRegion || "",

                    state:
                        directState || "",

                    city:
                        directCity || ""

                }

            ];

        }

    }


    return rules;

}


// ======================================
// GET RULE VALUES
// ======================================

function getRuleValues(
    rule,
    type
) {

    if (!rule) {

        return [];

    }


    let values = [];


    if (
        type === "region"
    ) {

        values = [

            ...toArray(
                rule.region
            ),

            ...toArray(
                rule.assignedRegion
            ),

            ...toArray(
                rule.regionName
            ),

            ...toArray(
                rule.region_name
            ),

            ...toArray(
                rule.selectedRegions
            ),

            ...toArray(
                rule.assignedRegions
            )

        ];

    }


    if (
        type === "state"
    ) {

        values = [

            ...toArray(
                rule.state
            ),

            ...toArray(
                rule.assignedState
            ),

            ...toArray(
                rule.stateName
            ),

            ...toArray(
                rule.state_name
            ),

            ...toArray(
                rule.states
            ),

            ...toArray(
                rule.selectedStates
            ),

            ...toArray(
                rule.assignedStates
            )

        ];

    }


    if (
        type === "city"
    ) {

        values = [

            ...toArray(
                rule.city
            ),

            ...toArray(
                rule.assignedCity
            ),

            ...toArray(
                rule.cityName
            ),

            ...toArray(
                rule.city_name
            ),

            ...toArray(
                rule.cities
            ),

            ...toArray(
                rule.selectedCities
            ),

            ...toArray(
                rule.assignedCities
            )

        ];

    }


    return values
        .map(
            value =>
                normalize(value)
        )
        .filter(
            value =>
                value !== ""
        );

}


// ======================================
// CHECK MATCH
// ======================================

function valueMatches(
    allowedValues,
    actualValue
) {

    const actual =
        normalize(
            actualValue
        );


    if (
        allowedValues.length === 0
    ) {

        return true;

    }


    if (
        allowedValues.includes("*") ||
        allowedValues.includes("all") ||
        allowedValues.includes("all regions") ||
        allowedValues.includes("all states") ||
        allowedValues.includes("all cities")
    ) {

        return true;

    }


    return allowedValues.includes(
        actual
    );

}


// ======================================
// GET TEACHERS FOR USER
// ======================================

function getUserEmployees(user) {

    const accessRules =
        getAccessRules(user);


    // ----------------------------------
    // IMPORTANT
    // If no access rule exists,
    // don't return all teachers.
    // ----------------------------------

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


                return accessRules.some(
                    (rule) => {

                        if (!rule) {

                            return false;

                        }


                        // ==================================
                        // REGION
                        // ==================================

                        const regionValues =
                            getRuleValues(
                                rule,
                                "region"
                            );


                        if (
                            regionValues.length > 0 &&
                            !valueMatches(
                                regionValues,
                                employeeRegion
                            )
                        ) {

                            return false;

                        }


                        // ==================================
                        // FULL REGION
                        // ==================================

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


                        // ==================================
                        // STATE
                        // ==================================

                        const stateValues =
                            getRuleValues(
                                rule,
                                "state"
                            );


                        if (
                            stateValues.length > 0 &&
                            !valueMatches(
                                stateValues,
                                employeeState
                            )
                        ) {

                            return false;

                        }


                        // ==================================
                        // CITY
                        // ==================================

                        const cityValues =
                            getRuleValues(
                                rule,
                                "city"
                            );


                        if (
                            cityValues.length > 0 &&
                            !valueMatches(
                                cityValues,
                                employeeCity
                            )
                        ) {

                            return false;

                        }


                        return true;

                    }
                );

            }
        );


    console.log(
        "User:",
        getUserName(user),
        "Teachers:",
        matchedEmployees.length
    );


    return matchedEmployees;

}


// ======================================
// LOAD REGION USERS
// ======================================

async function loadRegionUsers() {

    let snapshot =
        null;


    // ==================================
    // FIRST: regionUsers
    // ==================================

    try {

        snapshot =
            await getDocs(
                collection(
                    db,
                    "regionUsers"
                )
            );


        if (
            !snapshot.empty
        ) {

            regionUserCollectionName =
                "regionUsers";

        }


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
    // SECOND: region_users
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


            if (
                !snapshot.empty
            ) {

                regionUserCollectionName =
                    "region_users";

            }


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
                !entryCode
            ) {

                return;

            }


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


            let percentage =
                0;


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


            userSummaryData.push({

                id:
                    user.id,

                userCode:
                    getUserCode(user),

                userName:
                    getUserName(user),

                target:
                    target,

                targetUnit:
                    target / UNIT_VALUE,

                collection:
                    totalCollection,

                collectionUnit:
                    totalCollection / UNIT_VALUE,

                remaining:
                    remaining,

                remainingUnit:
                    remaining / UNIT_VALUE,

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
        "USER SUMMARY DATA:",
        userSummaryData
    );

}


// ======================================
// ADD UNIT TO TOP SUMMARY CARD
// ======================================

function updateCardUnit(
    element,
    amount
) {

    if (!element) {

        return;

    }


    const parent =
        element.parentElement;


    if (!parent) {

        return;

    }


    let unitElement =
        parent.querySelector(
            ".summary-unit"
        );


    if (!unitElement) {

        unitElement =
            document.createElement(
                "small"
            );

        unitElement.className =
            "summary-unit";


        unitElement.style.display =
            "block";


        unitElement.style.marginTop =
            "4px";


        unitElement.style.fontSize =
            "12px";


        unitElement.style.fontWeight =
            "600";


        unitElement.style.color =
            "#64748b";


        parent.appendChild(
            unitElement
        );

    }


    unitElement.textContent =
        formatUnit(amount);

}


// ======================================
// UPDATE TOP SUMMARY CARDS
// ======================================

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


    // ==================================
    // Total Target
    // ==================================

    if (
        userSummaryTotalTarget
    ) {

        userSummaryTotalTarget.textContent =
            formatCurrency(
                totalTarget
            );


        updateCardUnit(
            userSummaryTotalTarget,
            totalTarget
        );

    }


    // ==================================
    // Total Collection
    // ==================================

    if (
        userSummaryTotalCollection
    ) {

        userSummaryTotalCollection.textContent =
            formatCurrency(
                totalCollection
            );


        updateCardUnit(
            userSummaryTotalCollection,
            totalCollection
        );

    }


    // ==================================
    // Remaining
    // ==================================

    if (
        userSummaryTotalRemaining
    ) {

        userSummaryTotalRemaining.textContent =
            formatCurrency(
                totalRemaining
            );


        updateCardUnit(
            userSummaryTotalRemaining,
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
                user.percentage;


            const progress =
                Math.min(
                    percentage,
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


            const userId =
                escapeHTML(
                    user.id
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
                                data-id="${userId}"
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
                                data-id="${userId}"
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
                                data-id="${userId}"
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

                        <strong
                            style="
                                color:#15803d;
                                white-space:nowrap;
                            "
                        >

                            ${formatUnit(
                                user.target
                            )}

                        </strong>

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

                    <td>

                        <strong
                            style="
                                color:#15803d;
                                white-space:nowrap;
                            "
                        >

                            ${formatUnit(
                                user.collection
                            )}

                        </strong>

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

                    <td>

                        <strong
                            style="
                                color:#334155;
                                white-space:nowrap;
                            "
                        >

                            ${formatUnit(
                                user.remaining
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
                                    regionUserCollectionName,
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


                            // Local update

                            user.target =
                                target;


                            user.targetUnit =
                                target /
                                UNIT_VALUE;


                            user.remaining =
                                Math.max(
                                    target -
                                    user.collection,
                                    0
                                );


                            user.remainingUnit =
                                user.remaining /
                                UNIT_VALUE;


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


                        if (
                            !userName
                        ) {

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


                        try {

                            await setDoc(

                                doc(
                                    db,
                                    regionUserCollectionName,
                                    userId
                                ),

                                {

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
                        a.date || 0
                    );


                const dateB =
                    new Date(
                        b.date || 0
                    );


                return dateB - dateA;

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
        // RECENT COLLECTION
        // ==================================

        await loadRecentCollections();


        console.log(
            "=================================="
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
            "=================================="
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
// START DASHBOARD
// ======================================

loadDashboard();
