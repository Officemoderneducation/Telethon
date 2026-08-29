// ======================================================
// TELETHON - COLLECTION SUMMARY
//
// DATA SOURCE:
// 1. employees
// 2. daily_entry
// 3. teacher_entries
//
// IMPORTANT:
// - Same data source logic as Daily Report
// - daily_entry + teacher_entries merged
// - Same Teacher + Same Date = SUM
// - Collection Summary shows All-Time Collection
// - Old Daily Entry functionality is NOT changed
// ======================================================


// ======================================================
// FIREBASE
// ======================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// HTML ELEMENTS
// ======================================================

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


// ======================================================
// DATA
// ======================================================

let employees = [];

let dailyEntries = [];

let teacherEntries = [];

let allCollectionEntries = [];


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
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


// ======================================================
// NUMBER VALUE
//
// Handles:
// 1000
// "1000"
// "1,000"
// "₹ 1,000"
// ======================================================

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


// ======================================================
// FORMAT MONEY
// ======================================================

function formatMoney(amount) {

    return "₹ " +
        numberValue(amount)
            .toLocaleString("en-IN");

}


// ======================================================
// GET EMPLOYEE CODE
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
// GET ENTRY EMPLOYEE CODE
//
// Same flexible logic as Daily Report
// ======================================================

function getEntryEmployeeCode(entry) {

    return String(

        entry.employeeCode ||

        entry.employee_code ||

        entry.empCode ||

        entry.emp_code ||

        entry.employeeID ||

        entry.employeeId ||

        entry.userCode ||

        entry.user_code ||

        entry.emp_id ||

        entry.employee ||

        entry.teacherCode ||

        entry.teacher_code ||

        entry.code ||

        ""

    ).trim();

}


// ======================================================
// GET ENTRY AMOUNT
//
// Handles different field names
// ======================================================

function getEntryAmount(entry) {

    return numberValue(

        entry.amount ||

        entry.collection ||

        entry.collectionAmount ||

        entry.collection_amount ||

        entry.totalCollection ||

        entry.total_collection ||

        entry.collectedAmount ||

        entry.collected_amount ||

        entry.dailyCollection ||

        entry.daily_collection ||

        0

    );

}


// ======================================================
// GET ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    return (

        entry.date ||

        entry.entryDate ||

        entry.collectionDate ||

        entry.collection_date ||

        entry.createdDate ||

        entry.created_date ||

        ""

    );

}


// ======================================================
// NORMALIZE DATE
//
// YYYY-MM-DD
// DD-MM-YYYY
// DD/MM/YYYY
// Firestore Timestamp
// ======================================================

function normalizeDate(value) {

    if (!value) {

        return "";

    }


    // Firestore Timestamp

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return formatDateForInput(
            value.toDate()
        );

    }


    // Firestore Timestamp object

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return formatDateForInput(
            new Date(
                Number(value.seconds) * 1000
            )
        );

    }


    const stringValue =
        String(value).trim();


    // YYYY-MM-DD

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(stringValue)
    ) {

        return stringValue;

    }


    // DD-MM-YYYY

    let match =
        stringValue.match(
            /^(\d{2})-(\d{2})-(\d{4})$/
        );


    if (match) {

        return (
            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]
        );

    }


    // DD/MM/YYYY

    match =
        stringValue.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


    if (match) {

        return (
            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]
        );

    }


    // Date fallback

    const parsed =
        new Date(stringValue);


    if (
        !Number.isNaN(
            parsed.getTime()
        )
    ) {

        return formatDateForInput(
            parsed
        );

    }


    return "";

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDateForInput(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


// ======================================================
// LOAD COLLECTION DATA
// ======================================================

async function loadCollectionData(
    collectionName
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                collectionName
            )
        );


    const result = [];


    snapshot.forEach(
        (entryDoc) => {

            result.push({

                id:
                    entryDoc.id,

                ...entryDoc.data(),

                _source:
                    collectionName

            });

        }
    );


    return result;

}


// ======================================================
// LOAD ALL DATA
// ======================================================

async function loadData() {

    try {

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="11"
                        class="loading"
                    >
                        Loading data...
                    </td>
                </tr>
            `;

        }


        // ==============================================
        // LOAD EMPLOYEES
        // ==============================================

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        employees = [];


        employeeSnapshot.forEach(
            (employeeDoc) => {

                const data =
                    employeeDoc.data();


                employees.push({

                    id:
                        employeeDoc.id,

                    ...data

                });

            }
        );


        // ==============================================
        // LOAD OLD DAILY ENTRIES
        // READ ONLY
        // ==============================================

        dailyEntries =
            await loadCollectionData(
                "daily_entry"
            );


        // ==============================================
        // LOAD NEW TEACHER ENTRIES
        // READ ONLY
        // ==============================================

        teacherEntries =
            await loadCollectionData(
                "teacher_entries"
            );


        // ==============================================
        // MERGE BOTH
        //
        // SAME AS DAILY REPORT
        // ==============================================

        allCollectionEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        console.log(
            "Collection Summary Employees:",
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
            "Total Combined Entries:",
            allCollectionEntries.length
        );


        // ==============================================
        // LOAD FILTERS
        // ==============================================

        loadRegionDropdown();

        updateStateDropdown();

        updateCityDropdown();

        loadEmployeeDropdown();


        // ==============================================
        // INITIAL DISPLAY
        // ==============================================

        applyCurrentFilter();


    }
    catch (error) {

        console.error(
            "Collection Summary Error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="11"
                        class="no-data"
                        style="color:red;"
                    >
                        Data load nahi ho paaya.
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
// BUILD TEACHER TOTAL COLLECTION MAP
//
// IMPORTANT:
//
// Same Teacher + Same Date = SUM
//
// Example:
//
// T001 + 29 Aug
// ₹500
// ₹300
//
// Total = ₹800
//
// All-Time Total is then calculated
// ======================================================

function buildTeacherCollectionMap() {

    const teacherDateMap =
        new Map();


    // ==============================================
    // FIRST:
    // SAME TEACHER + SAME DATE = SUM
    // ==============================================

    allCollectionEntries.forEach(
        (entry) => {

            const employeeCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            const date =
                normalizeDate(
                    getEntryDate(
                        entry
                    )
                );


            const amount =
                getEntryAmount(
                    entry
                );


            // Invalid employee code ignore

            if (!employeeCode) {

                return;

            }


            // Date missing ho to bhi amount
            // employee ke total me count hoga,
            // lekin separate unique key use hoga

            const uniqueDate =
                date ||
                "no-date-" +
                String(
                    entry.id || ""
                );


            const key =
                employeeCode +
                "|" +
                uniqueDate;


            const existingAmount =
                teacherDateMap.get(
                    key
                ) || 0;


            teacherDateMap.set(

                key,

                existingAmount +
                amount

            );

        }
    );


    // ==============================================
    // SECOND:
    // TEACHER ALL-TIME TOTAL
    // ==============================================

    const teacherTotalMap =
        new Map();


    teacherDateMap.forEach(
        (amount, key) => {

            const separatorIndex =
                key.indexOf("|");


            if (
                separatorIndex === -1
            ) {

                return;

            }


            const employeeCode =
                key.substring(
                    0,
                    separatorIndex
                );


            const existingTotal =
                teacherTotalMap.get(
                    employeeCode
                ) || 0;


            teacherTotalMap.set(

                employeeCode,

                existingTotal +
                numberValue(
                    amount
                )

            );

        }
    );


    console.log(
        "Teacher Collection Map:",
        teacherTotalMap
    );


    return teacherTotalMap;

}


// ======================================================
// REGION DROPDOWN
// ======================================================

function loadRegionDropdown() {

    if (!regionFilter) {

        return;

    }


    const regions =
        new Set();


    employees.forEach(
        (employee) => {

            const region =
                String(
                    employee.region || ""
                ).trim();


            if (region) {

                regions.add(
                    region
                );

            }

        }
    );


    regionFilter.innerHTML = `
        <option value="">
            All Regions
        </option>
    `;


    [...regions]
        .sort()
        .forEach(
            (region) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    region;


                option.textContent =
                    region;


                regionFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// STATE DROPDOWN
// ======================================================

function updateStateDropdown() {

    if (!stateFilter) {

        return;

    }


    const selectedRegion =
        String(
            regionFilter?.value || ""
        ).trim();


    const states =
        new Set();


    employees.forEach(
        (employee) => {

            const employeeRegion =
                String(
                    employee.region || ""
                ).trim();


            const state =
                String(
                    employee.state || ""
                ).trim();


            if (
                selectedRegion &&
                normalize(employeeRegion) !==
                normalize(selectedRegion)
            ) {

                return;

            }


            if (state) {

                states.add(
                    state
                );

            }

        }
    );


    stateFilter.innerHTML = `
        <option value="">
            All States
        </option>
    `;


    [...states]
        .sort()
        .forEach(
            (state) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    state;


                option.textContent =
                    state;


                stateFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// CITY DROPDOWN
// ======================================================

function updateCityDropdown() {

    if (!cityFilter) {

        return;

    }


    const selectedRegion =
        String(
            regionFilter?.value || ""
        ).trim();


    const selectedState =
        String(
            stateFilter?.value || ""
        ).trim();


    const cities =
        new Set();


    employees.forEach(
        (employee) => {

            const employeeRegion =
                String(
                    employee.region || ""
                ).trim();


            const employeeState =
                String(
                    employee.state || ""
                ).trim();


            const city =
                String(
                    employee.city || ""
                ).trim();


            if (
                selectedRegion &&
                normalize(employeeRegion) !==
                normalize(selectedRegion)
            ) {

                return;

            }


            if (
                selectedState &&
                normalize(employeeState) !==
                normalize(selectedState)
            ) {

                return;

            }


            if (city) {

                cities.add(
                    city
                );

            }

        }
    );


    cityFilter.innerHTML = `
        <option value="">
            All Cities
        </option>
    `;


    [...cities]
        .sort()
        .forEach(
            (city) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    city;


                option.textContent =
                    city;


                cityFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// EMPLOYEE DROPDOWN
//
// Based on current Region / State / City
// ======================================================

function loadEmployeeDropdown() {

    if (!employeeFilter) {

        return;

    }


    const selectedRegion =
        String(
            regionFilter?.value || ""
        ).trim();


    const selectedState =
        String(
            stateFilter?.value || ""
        ).trim();


    const selectedCity =
        String(
            cityFilter?.value || ""
        ).trim();


    let filteredEmployees =
        employees.slice();


    if (selectedRegion) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>

                    normalize(
                        employee.region
                    ) ===
                    normalize(
                        selectedRegion
                    )
            );

    }


    if (selectedState) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>

                    normalize(
                        employee.state
                    ) ===
                    normalize(
                        selectedState
                    )
            );

    }


    if (selectedCity) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>

                    normalize(
                        employee.city
                    ) ===
                    normalize(
                        selectedCity
                    )
            );

    }


    employeeFilter.innerHTML = `
        <option value="">
            All Employees
        </option>
    `;


    filteredEmployees
        .slice()
        .sort(
            (a, b) =>

                getEmployeeCode(a)
                    .localeCompare(
                        getEmployeeCode(b)
                    )
        )
        .forEach(
            (employee) => {

                const employeeCode =
                    getEmployeeCode(
                        employee
                    );


                const teacherName =

                    employee.teacherName ||

                    employee.teacher_name ||

                    employee.name ||

                    "-";


                if (!employeeCode) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    employeeCode;


                option.textContent =
                    employeeCode +
                    " - " +
                    teacherName;


                employeeFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// GET FILTERED EMPLOYEES
// ======================================================

function getFilteredEmployees() {

    let filteredEmployees =
        employees.slice();


    // Region

    if (regionFilter?.value) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>

                    normalize(
                        employee.region
                    ) ===
                    normalize(
                        regionFilter.value
                    )
            );

    }


    // State

    if (stateFilter?.value) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>

                    normalize(
                        employee.state
                    ) ===
                    normalize(
                        stateFilter.value
                    )
            );

    }


    // City

    if (cityFilter?.value) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>

                    normalize(
                        employee.city
                    ) ===
                    normalize(
                        cityFilter.value
                    )
            );

    }


    // Employee

    if (employeeFilter?.value) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>

                    normalize(
                        getEmployeeCode(
                            employee
                        )
                    ) ===
                    normalize(
                        employeeFilter.value
                    )
            );

    }


    return filteredEmployees;

}


// ======================================================
// APPLY CURRENT FILTER
// ======================================================

function applyCurrentFilter() {

    const filteredEmployees =
        getFilteredEmployees();


    updateSelectedTitle();


    displaySummary(
        filteredEmployees
    );

}


// ======================================================
// UPDATE SELECTED TITLE
// ======================================================

function updateSelectedTitle() {

    if (!selectedTitle) {

        return;

    }


    let title =
        "All Teachers";


    if (employeeFilter?.value) {

        const employee =
            employees.find(
                (item) =>

                    normalize(
                        getEmployeeCode(item)
                    ) ===
                    normalize(
                        employeeFilter.value
                    )
            );


        if (employee) {

            const teacherName =

                employee.teacherName ||

                employee.teacher_name ||

                employee.name ||

                "-";


            title =
                "Employee Code: " +
                getEmployeeCode(
                    employee
                ) +
                " - " +
                teacherName;

        }

    }
    else if (cityFilter?.value) {

        title =
            "City: " +
            cityFilter.value;

    }
    else if (stateFilter?.value) {

        title =
            "State: " +
            stateFilter.value;

    }
    else if (regionFilter?.value) {

        title =
            "Region: " +
            regionFilter.value;

    }


    selectedTitle.textContent =
        title;

}


// ======================================================
// GET TARGET
// ======================================================

function getEmployeeTarget(employee) {

    return numberValue(

        employee.targetAmount ??

        employee.target ??

        employee.target_amount ??

        employee.Target ??

        employee.totalTarget ??

        employee.total_target ??

        0

    );

}


// ======================================================
// DISPLAY SUMMARY
// ======================================================

function displaySummary(list) {

    // ==============================================
    // DAILY REPORT SAME LOGIC
    //
    // Build All-Time Teacher Collection Map
    // ==============================================

    const teacherCollectionMap =
        buildTeacherCollectionMap();


    let totalTarget =
        0;


    let totalCollection =
        0;


    const rows = [];


    list.forEach(
        (employee) => {

            const employeeCode =
                getEmployeeCode(
                    employee
                );


            const normalizedCode =
                normalize(
                    employeeCode
                );


            // ==========================================
            // TEACHER COLLECTION
            //
            // Read from Daily Report source:
            // daily_entry + teacher_entries
            // ==========================================

            const employeeCollection =
                teacherCollectionMap.get(
                    normalizedCode
                ) || 0;


            // ==========================================
            // TARGET
            // ==========================================

            const target =
                getEmployeeTarget(
                    employee
                );


            // ==========================================
            // REMAINING
            // ==========================================

            const remaining =
                Math.max(
                    target -
                    employeeCollection,
                    0
                );


            // ==========================================
            // PERCENTAGE
            // ==========================================

            let percentage =
                0;


            if (target > 0) {

                percentage =
                    (
                        employeeCollection /
                        target
                    ) * 100;

            }


            // ==========================================
            // TOTALS
            // ==========================================

            totalTarget +=
                target;


            totalCollection +=
                employeeCollection;


            // ==========================================
            // ROW
            // ==========================================

            rows.push({

                ...employee,

                employeeCode:

                    employeeCode,

                collection:

                    employeeCollection,

                target:

                    target,

                remaining:

                    remaining,

                percentage:

                    percentage

            });

        }
    );


    // ==============================================
    // TOTAL REMAINING
    // ==============================================

    const totalRemaining =
        Math.max(
            totalTarget -
            totalCollection,
            0
        );


    // ==============================================
    // TOTAL PERCENTAGE
    // ==============================================

    let totalPercentage =
        0;


    if (totalTarget > 0) {

        totalPercentage =
            (
                totalCollection /
                totalTarget
            ) * 100;

    }


    // ==============================================
    // UPDATE CARDS
    // ==============================================

    if (totalTargetEl) {

        totalTargetEl.textContent =
            formatMoney(
                totalTarget
            );

    }


    if (totalCollectionEl) {

        totalCollectionEl.textContent =
            formatMoney(
                totalCollection
            );

    }


    if (remainingTargetEl) {

        remainingTargetEl.textContent =
            formatMoney(
                totalRemaining
            );

    }


    if (percentageEl) {

        percentageEl.textContent =
            totalPercentage.toFixed(2) +
            "%";

    }


    // ==============================================
    // DISPLAY TABLE
    // ==============================================

    displayTable(

        rows,

        totalTarget,

        totalCollection,

        totalRemaining,

        totalPercentage

    );

}


// ======================================================
// DISPLAY TABLE
// ======================================================

function displayTable(

    rows,

    totalTarget,

    totalCollection,

    totalRemaining,

    totalPercentage

) {

    if (!tableBody) {

        return;

    }


    // ==============================================
    // NO DATA
    // ==============================================

    if (!rows.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="no-data"
                >
                    Is filter ke liye koi
                    Teacher nahi mila.
                </td>
            </tr>
        `;


        if (tableFoot) {

            tableFoot.innerHTML =
                "";

        }


        return;

    }


    let html =
        "";


    rows.forEach(
        (employee, index) => {

            const percentageClass =

                employee.percentage >= 70

                    ? ""

                    : employee.percentage >= 40

                        ? "medium"

                        : "low";


            const teacherName =

                employee.teacherName ||

                employee.teacher_name ||

                employee.name ||

                "-";


            const jamiatulMadina =

                employee.jamiatulMadina ||

                employee.jamiatul_madina ||

                employee.jamiatuMadina ||

                employee.jamiatulMadinah ||

                employee.jamiatul ||

                "-";


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            employee.region || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            employee.state || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            employee.city || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            jamiatulMadina
                        )}
                    </td>

                    <td class="employee-code">
                        ${escapeHTML(
                            employee.employeeCode
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            teacherName
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


    // ==============================================
    // TABLE FOOTER
    // ==============================================

    if (tableFoot) {

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

}


// ======================================================
// REGION CHANGE
// ======================================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        function () {

            const oldState =
                stateFilter.value;


            updateStateDropdown();


            // State reset

            if (oldState) {

                stateFilter.value =
                    "";

            }


            updateCityDropdown();

            loadEmployeeDropdown();

        }
    );

}


// ======================================================
// STATE CHANGE
// ======================================================

if (stateFilter) {

    stateFilter.addEventListener(
        "change",
        function () {

            updateCityDropdown();

            loadEmployeeDropdown();

        }
    );

}


// ======================================================
// CITY CHANGE
// ======================================================

if (cityFilter) {

    cityFilter.addEventListener(
        "change",
        function () {

            loadEmployeeDropdown();

        }
    );

}


// ======================================================
// APPLY FILTER
// ======================================================

if (applyFilter) {

    applyFilter.addEventListener(
        "click",
        function () {

            applyCurrentFilter();

        }
    );

}


// ======================================================
// RESET FILTER
// ======================================================

if (resetFilter) {

    resetFilter.addEventListener(
        "click",
        function () {

            if (regionFilter) {

                regionFilter.value =
                    "";

            }


            if (stateFilter) {

                stateFilter.value =
                    "";

            }


            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }


            loadRegionDropdown();

            updateStateDropdown();

            updateCityDropdown();

            loadEmployeeDropdown();

            applyCurrentFilter();

        }
    );

}


// ======================================================
// START
// ======================================================

loadData();
