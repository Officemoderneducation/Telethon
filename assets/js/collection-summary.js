// ==========================================
// Telethon - Collection Summary
// Updated: Same Employee + Same Date
// Only LAST Entry will be counted
// ==========================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ==========================================
// HTML ELEMENTS
// ==========================================

const regionFilter =
    document.getElementById("regionFilter");

const stateFilter =
    document.getElementById("stateFilter");

const cityFilter =
    document.getElementById("cityFilter");

const employeeFilter =
    document.getElementById("employeeFilter");

const applyFilter =
    document.getElementById("applyFilter");

const resetFilter =
    document.getElementById("resetFilter");

const selectedTitle =
    document.getElementById("selectedTitle");

const totalTargetEl =
    document.getElementById("totalTarget");

const totalCollectionEl =
    document.getElementById("totalCollection");

const remainingTargetEl =
    document.getElementById("remainingTarget");

const percentageEl =
    document.getElementById("percentage");

const tableBody =
    document.getElementById("summaryTableBody");

const tableFoot =
    document.getElementById("summaryTableFoot");

const logoutBtn =
    document.getElementById("logoutBtn");

// ==========================================
// DATA
// ==========================================

let employees = [];

let entries = [];

// ==========================================
// LOAD ALL DATA
// ==========================================

async function loadData() {

    try {

        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="loading">
                    Loading data...
                </td>
            </tr>
        `;

        // ==================================
        // LOAD EMPLOYEES
        // ==================================

        const employeeSnapshot =
            await getDocs(
                collection(db, "employees")
            );

        employees = [];

        employeeSnapshot.forEach((docSnap) => {

            const data =
                docSnap.data();

            employees.push({

                id:
                    docSnap.id,

                employeeCode:
                    data.employeeCode ||
                    data.employee_code ||
                    docSnap.id,

                teacherName:
                    data.teacherName ||
                    data.teacher_name ||
                    "-",

                region:
                    data.region ||
                    "-",

                state:
                    data.state ||
                    "-",

                city:
                    data.city ||
                    "-",

                jamiatulMadina:
                    data.jamiatulMadina ||
                    data.jamiatul_madina ||
                    data.jamiatuMadina ||
                    "-",

                target:
                    Number(
                        data.targetAmount ??
                        data.target ??
                        data.target_amount ??
                        data.Target ??
                        0
                    )

            });

        });

        // ==================================
        // LOAD DAILY ENTRIES
        // ==================================

        const entrySnapshot =
            await getDocs(
                collection(db, "daily_entry")
            );

        entries = [];

        entrySnapshot.forEach((docSnap) => {

            const data =
                docSnap.data();

            entries.push({

                id:
                    docSnap.id,

                employeeCode:
                    data.employee_code ||
                    data.employeeCode ||
                    data.emp_code ||
                    "",

                amount:
                    Number(data.amount) || 0,

                date:
                    data.date || "",

                createdAt:
                    data.createdAt || null

            });

        });

        // ==================================
        // IMPORTANT
        // SAME EMPLOYEE + SAME DATE
        // ONLY LAST ENTRY WILL BE COUNTED
        // ==================================

        entries =
            getLatestEntriesByEmployeeAndDate(
                entries
            );

        console.log(
            "Final Entries After Duplicate-Date Check:",
            entries
        );

        // ==================================
        // DROPDOWNS
        // ==================================

        loadRegionDropdown();

        loadEmployeeDropdown();

        updateStateDropdown();

        updateCityDropdown();

        applyCurrentFilter();

    }
    catch (error) {

        console.error(
            "Collection Summary Error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="no-data"
                    style="color:red;"
                >
                    Data load nahi ho paaya.
                    <br><br>
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;

    }

}

// ==========================================
// GET LAST ENTRY
// Same Employee Code + Same Date
// ==========================================

function getLatestEntriesByEmployeeAndDate(allEntries) {

    const latestMap =
        new Map();

    allEntries.forEach((entry) => {

        const employeeCode =
            String(
                entry.employeeCode || ""
            ).trim();

        const date =
            String(
                entry.date || ""
            ).trim();

        // Invalid entry ignore
        if (!employeeCode || !date) {
            return;
        }

        const key =
            `${employeeCode}__${date}`;

        // First entry
        if (!latestMap.has(key)) {

            latestMap.set(
                key,
                entry
            );

            return;
        }

        const existing =
            latestMap.get(key);

        // ==================================
        // Compare createdAt
        // ==================================

        const existingTime =
            getTimestampValue(
                existing.createdAt
            );

        const currentTime =
            getTimestampValue(
                entry.createdAt
            );

        if (currentTime >= existingTime) {

            latestMap.set(
                key,
                entry
            );

        }

    });

    return Array.from(
        latestMap.values()
    );

}

// ==========================================
// TIMESTAMP VALUE
// ==========================================

function getTimestampValue(timestamp) {

    if (!timestamp) {
        return 0;
    }

    // Firebase Timestamp
    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }

    // Date object
    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();

    }

    // Number
    if (
        typeof timestamp === "number"
    ) {

        return timestamp;

    }

    // String date
    const parsed =
        new Date(timestamp).getTime();

    if (!isNaN(parsed)) {

        return parsed;

    }

    return 0;
}

// ==========================================
// LOAD REGION DROPDOWN
// ==========================================

function loadRegionDropdown() {

    const regions =
        uniqueValues(
            employees.map(
                item => item.region
            )
        );

    regionFilter.innerHTML = `
        <option value="">
            All Regions
        </option>
    `;

    regions
        .sort()
        .forEach((region) => {

            regionFilter.innerHTML += `
                <option value="${escapeHtml(region)}">
                    ${escapeHtml(region)}
                </option>
            `;

        });

}

// ==========================================
// LOAD STATE DROPDOWN
// ==========================================

function updateStateDropdown() {

    const selectedRegion =
        regionFilter.value;

    let filtered =
        employees;

    if (selectedRegion) {

        filtered =
            employees.filter(
                item =>
                    item.region ===
                    selectedRegion
            );

    }

    const states =
        uniqueValues(
            filtered.map(
                item => item.state
            )
        );

    stateFilter.innerHTML = `
        <option value="">
            All States
        </option>
    `;

    states
        .sort()
        .forEach((state) => {

            stateFilter.innerHTML += `
                <option value="${escapeHtml(state)}">
                    ${escapeHtml(state)}
                </option>
            `;

        });

    stateFilter.value = "";

    cityFilter.innerHTML = `
        <option value="">
            All Cities
        </option>
    `;

}

// ==========================================
// LOAD CITY DROPDOWN
// ==========================================

function updateCityDropdown() {

    const selectedRegion =
        regionFilter.value;

    const selectedState =
        stateFilter.value;

    let filtered =
        employees;

    if (selectedRegion) {

        filtered =
            filtered.filter(
                item =>
                    item.region ===
                    selectedRegion
            );

    }

    if (selectedState) {

        filtered =
            filtered.filter(
                item =>
                    item.state ===
                    selectedState
            );

    }

    const cities =
        uniqueValues(
            filtered.map(
                item => item.city
            )
        );

    cityFilter.innerHTML = `
        <option value="">
            All Cities
        </option>
    `;

    cities
        .sort()
        .forEach((city) => {

            cityFilter.innerHTML += `
                <option value="${escapeHtml(city)}">
                    ${escapeHtml(city)}
                </option>
            `;

        });

    cityFilter.value = "";

}

// ==========================================
// EMPLOYEE DROPDOWN
// ==========================================

function loadEmployeeDropdown() {

    employeeFilter.innerHTML = `
        <option value="">
            All Employees
        </option>
    `;

    employees
        .slice()
        .sort(
            (a, b) =>
                String(a.employeeCode)
                    .localeCompare(
                        String(b.employeeCode)
                    )
        )
        .forEach((employee) => {

            employeeFilter.innerHTML += `
                <option value="${escapeHtml(employee.employeeCode)}">
                    ${escapeHtml(employee.employeeCode)}
                    - ${escapeHtml(employee.teacherName)}
                </option>
            `;

        });

}

// ==========================================
// REGION CHANGE
// ==========================================

regionFilter.addEventListener(
    "change",
    () => {

        updateStateDropdown();

        updateCityDropdown();

        employeeFilter.value = "";

    }
);

// ==========================================
// STATE CHANGE
// ==========================================

stateFilter.addEventListener(
    "change",
    () => {

        updateCityDropdown();

        employeeFilter.value = "";

    }
);

// ==========================================
// CITY CHANGE
// ==========================================

cityFilter.addEventListener(
    "change",
    () => {

        employeeFilter.value = "";

    }
);

// ==========================================
// APPLY FILTER
// ==========================================

applyFilter.addEventListener(
    "click",
    () => {

        applyCurrentFilter();

    }
);

// ==========================================
// APPLY CURRENT FILTER
// ==========================================

function applyCurrentFilter() {

    let filteredEmployees =
        employees.slice();

    // ==================================
    // REGION
    // ==================================

    if (regionFilter.value) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    employee.region ===
                    regionFilter.value
            );

    }

    // ==================================
    // STATE
    // ==================================

    if (stateFilter.value) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    employee.state ===
                    stateFilter.value
            );

    }

    // ==================================
    // CITY
    // ==================================

    if (cityFilter.value) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    employee.city ===
                    cityFilter.value
            );

    }

    // ==================================
    // EMPLOYEE
    // ==================================

    if (employeeFilter.value) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    String(
                        employee.employeeCode
                    ) ===
                    String(
                        employeeFilter.value
                    )
            );

    }

    // ==================================
    // DISPLAY
    // ==================================

    updateSelectedTitle(
        filteredEmployees
    );

    displaySummary(
        filteredEmployees
    );

}

// ==========================================
// RESET
// ==========================================

resetFilter.addEventListener(
    "click",
    () => {

        regionFilter.value = "";

        stateFilter.value = "";

        cityFilter.value = "";

        employeeFilter.value = "";

        updateStateDropdown();

        updateCityDropdown();

        applyCurrentFilter();

    }
);

// ==========================================
// UPDATE TITLE
// ==========================================

function updateSelectedTitle(list) {

    let title =
        "All Teachers";

    if (employeeFilter.value) {

        const employee =
            employees.find(
                item =>
                    String(
                        item.employeeCode
                    ) ===
                    String(
                        employeeFilter.value
                    )
            );

        if (employee) {

            title =
                `Employee Code: ${employee.employeeCode} - ${employee.teacherName}`;

        }

    }
    else if (cityFilter.value) {

        title =
            `City: ${cityFilter.value}`;

    }
    else if (stateFilter.value) {

        title =
            `State: ${stateFilter.value}`;

    }
    else if (regionFilter.value) {

        title =
            `Region: ${regionFilter.value}`;

    }

    selectedTitle.textContent =
        title;

}

// ==========================================
// DISPLAY SUMMARY
// ==========================================

function displaySummary(list) {

    let totalTarget = 0;

    let totalCollection = 0;

    const rows = [];

    list.forEach((employee) => {

        const employeeCode =
            String(
                employee.employeeCode || ""
            );

        // ==================================
        // GET FINAL COLLECTION
        // FOR EACH DATE
        // ==================================

        const employeeCollection =
            entries
                .filter((entry) => {

                    return String(
                        entry.employeeCode || ""
                    ) === employeeCode;

                })
                .reduce(
                    (sum, entry) =>
                        sum +
                        (
                            Number(
                                entry.amount
                            ) || 0
                        ),
                    0
                );

        const target =
            Number(
                employee.target
            ) || 0;

        const remaining =
            Math.max(
                target -
                employeeCollection,
                0
            );

        let percentage = 0;

        if (target > 0) {

            percentage =
                (
                    employeeCollection /
                    target
                ) * 100;

        }

        totalTarget +=
            target;

        totalCollection +=
            employeeCollection;

        rows.push({

            ...employee,

            collection:
                employeeCollection,

            remaining:
                remaining,

            percentage:
                percentage

        });

    });

    const totalRemaining =
        Math.max(
            totalTarget -
            totalCollection,
            0
        );

    let totalPercentage = 0;

    if (totalTarget > 0) {

        totalPercentage =
            (
                totalCollection /
                totalTarget
            ) * 100;

    }

    // ==================================
    // CARDS
    // ==================================

    totalTargetEl.textContent =
        formatMoney(
            totalTarget
        );

    totalCollectionEl.textContent =
        formatMoney(
            totalCollection
        );

    remainingTargetEl.textContent =
        formatMoney(
            totalRemaining
        );

    percentageEl.textContent =
        `${totalPercentage.toFixed(2)}%`;

    // ==================================
    // TABLE
    // ==================================

    displayTable(
        rows,
        totalTarget,
        totalCollection,
        totalRemaining,
        totalPercentage
    );

}

// ==========================================
// DISPLAY TABLE
// ==========================================

function displayTable(
    rows,
    totalTarget,
    totalCollection,
    totalRemaining,
    totalPercentage
) {

    if (!rows.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="no-data"
                >
                    Is filter ke liye koi Teacher nahi mila.
                </td>
            </tr>
        `;

        tableFoot.innerHTML = "";

        return;

    }

    let html = "";

    rows.forEach(
        (employee, index) => {

            let percentageClass =
                "";

            if (
                employee.percentage >= 70
            ) {

                percentageClass =
                    "";

            }
            else if (
                employee.percentage >= 40
            ) {

                percentageClass =
                    "medium";

            }
            else {

                percentageClass =
                    "low";

            }

            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(
                            employee.region
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            employee.state
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            employee.city
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            employee.jamiatulMadina
                        )}
                    </td>

                    <td class="employee-code">
                        ${escapeHtml(
                            employee.employeeCode
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            employee.teacherName
                        )}
                    </td>

                    <td class="target-amount">
                        ${formatMoney(
                            employee.target
                        )}
                    </td>

                    <td class="collection-amount">
                        ${formatMoney(
                            employee.collection
                        )}
                    </td>

                    <td class="remaining-amount">
                        ${formatMoney(
                            employee.remaining
                        )}
                    </td>

                    <td>

                        <span
                            class="percentage-badge ${percentageClass}"
                        >

                            ${employee.percentage.toFixed(2)}%

                        </span>

                    </td>

                </tr>

            `;

        }
    );

    tableBody.innerHTML =
        html;

    // ==================================
    // TOTAL ROW
    // ==================================

    tableFoot.innerHTML = `

        <tr>

            <td colspan="7">

                Total
                (${rows.length} Employees)

            </td>

            <td>
                ${formatMoney(
                    totalTarget
                )}
            </td>

            <td>
                ${formatMoney(
                    totalCollection
                )}
            </td>

            <td>
                ${formatMoney(
                    totalRemaining
                )}
            </td>

            <td>
                ${totalPercentage.toFixed(2)}%
            </td>

        </tr>

    `;

}

// ==========================================
// MONEY FORMAT
// ==========================================

function formatMoney(amount) {

    return `₹ ${Number(
        amount || 0
    ).toLocaleString("en-IN")}`;

}

// ==========================================
// UNIQUE VALUES
// ==========================================

function uniqueValues(array) {

    return [
        ...new Set(
            array.filter(
                value =>
                    value &&
                    value !== "-"
            )
        )
    ];

}

// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}

// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        (e) => {

            e.preventDefault();

            localStorage.removeItem(
                "loggedInEmpCode"
            );

            localStorage.removeItem(
                "userRole"
            );

            localStorage.removeItem(
                "regionUserName"
            );

            localStorage.removeItem(
                "regionUserAccess"
            );

            window.location.href =
                "index.html";

        }
    );

}

// ==========================================
// START
// ==========================================

loadData();
