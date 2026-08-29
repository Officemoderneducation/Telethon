// ==========================================
// TELETHON - COLLECTION SUMMARY
//
// DATA SOURCES:
//
// OLD ENTRIES:
// daily_entry
//
// NEW ENTRIES:
// teacher_entries
//
// IMPORTANT:
//
// 1. Both collections are READ ONLY.
// 2. Both collections are merged.
// 3. Same Teacher + Same Date = SUM.
// 4. Collection Summary = All-Time Collection.
// 5. Filters only change visible Teachers.
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
    document.getElementById(
        "regionFilter"
    );

const stateFilter =
    document.getElementById(
        "stateFilter"
    );

const cityFilter =
    document.getElementById(
        "cityFilter"
    );

const employeeFilter =
    document.getElementById(
        "employeeFilter"
    );

const applyFilter =
    document.getElementById(
        "applyFilter"
    );

const resetFilter =
    document.getElementById(
        "resetFilter"
    );

const selectedTitle =
    document.getElementById(
        "selectedTitle"
    );

const totalTargetEl =
    document.getElementById(
        "totalTarget"
    );

const totalCollectionEl =
    document.getElementById(
        "totalCollection"
    );

const remainingTargetEl =
    document.getElementById(
        "remainingTarget"
    );

const percentageEl =
    document.getElementById(
        "percentage"
    );

const tableBody =
    document.getElementById(
        "summaryTableBody"
    );

const tableFoot =
    document.getElementById(
        "summaryTableFoot"
    );


// ==========================================
// DATA
// ==========================================

let employees = [];

let dailyEntries = [];

let teacherEntries = [];

let allEntries = [];


// ==========================================
// NORMALIZE
// ==========================================

function normalize(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


// ==========================================
// NUMBER VALUE
// ==========================================

function numberValue(value) {

    const cleaned =
        String(
            value ?? ""
        )
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .trim();


    const number =
        Number(cleaned);


    return Number.isFinite(number)
        ? number
        : 0;

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// FORMAT MONEY
// ==========================================

function formatMoney(amount) {

    return (
        "₹ " +
        numberValue(amount)
            .toLocaleString(
                "en-IN"
            )
    );

}


// ==========================================
// GET EMPLOYEE CODE
// ==========================================

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


// ==========================================
// GET ENTRY EMPLOYEE CODE
// ==========================================

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

        ""

    ).trim();

}


// ==========================================
// GET ENTRY AMOUNT
// ==========================================

function getEntryAmount(entry) {

    return numberValue(

        entry.amount ||

        entry.collection ||

        entry.collectionAmount ||

        entry.totalCollection ||

        entry.total_collection ||

        entry.collectedAmount ||

        entry.collected_amount ||

        0

    );

}


// ==========================================
// GET ENTRY DATE
// ==========================================

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


// ==========================================
// FORMAT DATE FOR INPUT
// ==========================================

function formatDateForInput(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


// ==========================================
// NORMALIZE DATE
// ==========================================

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


    // Firestore Timestamp Object

    if (

        typeof value === "object" &&

        value.seconds !== undefined

    ) {

        return formatDateForInput(

            new Date(
                Number(
                    value.seconds
                ) * 1000
            )

        );

    }


    const stringValue =
        String(value)
            .trim();


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


    // Fallback

    const parsed =
        new Date(
            stringValue
        );


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


// ==========================================
// LOAD ONE COLLECTION
// ==========================================

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
        (docSnap) => {

            result.push({

                id:
                    docSnap.id,

                ...docSnap.data(),

                _source:
                    collectionName

            });

        }
    );


    return result;

}


// ==========================================
// LOAD ALL DATA
// ==========================================

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


        // ==================================
        // LOAD EMPLOYEES
        // ==================================

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        employees = [];


        employeeSnapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                employees.push({

                    id:
                        docSnap.id,

                    employeeCode:
                        getEmployeeCode({
                            ...data,
                            id:
                                docSnap.id
                        }),

                    teacherName:

                        data.teacherName ||

                        data.teacher_name ||

                        data.name ||

                        data.fullName ||

                        "-",

                    region:

                        data.region ||

                        data.regionName ||

                        data.region_name ||

                        "-",

                    state:

                        data.state ||

                        data.stateName ||

                        data.state_name ||

                        "-",

                    city:

                        data.city ||

                        data.cityName ||

                        data.city_name ||

                        "-",

                    jamiatulMadina:

                        data.jamiatulMadina ||

                        data.jamiatul_madina ||

                        data.jamiatuMadina ||

                        data.jamiatulMadinah ||

                        data.jamiatul ||

                        data.madina ||

                        "-",

                    target:
                        numberValue(

                            data.targetAmount ??

                            data.target ??

                            data.target_amount ??

                            data.Target ??

                            0

                        )

                });

            }
        );


        // ==================================
        // LOAD OLD ENTRIES
        //
        // daily_entry
        // ==================================

        dailyEntries =
            await loadCollectionData(
                "daily_entry"
            );


        // ==================================
        // LOAD NEW ENTRIES
        //
        // teacher_entries
        // ==================================

        teacherEntries =
            await loadCollectionData(
                "teacher_entries"
            );


        // ==================================
        // MERGE BOTH COLLECTIONS
        // ==================================

        allEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


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
            "Combined Entries:",
            allEntries.length
        );


        // ==================================
        // LOAD DROPDOWNS
        // ==================================

        loadRegionDropdown();

        updateStateDropdown();

        updateCityDropdown();

        updateEmployeeDropdown();


        // ==================================
        // INITIAL SUMMARY
        // ==================================

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

                        <br>
                        <br>

                        ${escapeHtml(
                            error.message
                        )}

                    </td>

                </tr>

            `;

        }

    }

}


// ==========================================
// LOAD REGION DROPDOWN
// ==========================================

function loadRegionDropdown() {

    if (!regionFilter) {

        return;

    }


    const currentValue =
        regionFilter.value;


    const regions =
        uniqueValues(

            employees.map(
                employee =>
                    employee.region
            )

        );


    regionFilter.innerHTML = `

        <option value="">
            All Regions
        </option>

    `;


    regions
        .sort()
        .forEach(
            (region) => {

                regionFilter.innerHTML += `

                    <option
                        value="${escapeHtml(
                            region
                        )}"
                    >

                        ${escapeHtml(
                            region
                        )}

                    </option>

                `;

            }
        );


    regionFilter.value =
        currentValue;

}


// ==========================================
// GET EMPLOYEES FOR LOCATION FILTERS
// ==========================================

function getLocationFilteredEmployees() {

    let filtered =
        employees.slice();


    const selectedRegion =
        normalize(
            regionFilter?.value
        );


    const selectedState =
        normalize(
            stateFilter?.value
        );


    const selectedCity =
        normalize(
            cityFilter?.value
        );


    if (selectedRegion) {

        filtered =
            filtered.filter(
                employee =>

                    normalize(
                        employee.region
                    ) ===
                    selectedRegion
            );

    }


    if (selectedState) {

        filtered =
            filtered.filter(
                employee =>

                    normalize(
                        employee.state
                    ) ===
                    selectedState
            );

    }


    if (selectedCity) {

        filtered =
            filtered.filter(
                employee =>

                    normalize(
                        employee.city
                    ) ===
                    selectedCity
            );

    }


    return filtered;

}


// ==========================================
// UPDATE STATE DROPDOWN
// ==========================================

function updateStateDropdown() {

    if (!stateFilter) {

        return;

    }


    const previousValue =
        stateFilter.value;


    const selectedRegion =
        normalize(
            regionFilter?.value
        );


    let filtered =
        employees.slice();


    if (selectedRegion) {

        filtered =
            filtered.filter(
                employee =>

                    normalize(
                        employee.region
                    ) ===
                    selectedRegion
            );

    }


    const states =
        uniqueValues(

            filtered.map(
                employee =>
                    employee.state
            )

        );


    stateFilter.innerHTML = `

        <option value="">
            All States
        </option>

    `;


    states
        .sort()
        .forEach(
            (state) => {

                stateFilter.innerHTML += `

                    <option
                        value="${escapeHtml(
                            state
                        )}"
                    >

                        ${escapeHtml(
                            state
                        )}

                    </option>

                `;

            }
        );


    const stateExists =
        states.some(
            state =>

                normalize(state) ===
                normalize(previousValue)
        );


    stateFilter.value =
        stateExists
            ? previousValue
            : "";

}


// ==========================================
// UPDATE CITY DROPDOWN
// ==========================================

function updateCityDropdown() {

    if (!cityFilter) {

        return;

    }


    const previousValue =
        cityFilter.value;


    const selectedRegion =
        normalize(
            regionFilter?.value
        );


    const selectedState =
        normalize(
            stateFilter?.value
        );


    let filtered =
        employees.slice();


    if (selectedRegion) {

        filtered =
            filtered.filter(
                employee =>

                    normalize(
                        employee.region
                    ) ===
                    selectedRegion
            );

    }


    if (selectedState) {

        filtered =
            filtered.filter(
                employee =>

                    normalize(
                        employee.state
                    ) ===
                    selectedState
            );

    }


    const cities =
        uniqueValues(

            filtered.map(
                employee =>
                    employee.city
            )

        );


    cityFilter.innerHTML = `

        <option value="">
            All Cities
        </option>

    `;


    cities
        .sort()
        .forEach(
            (city) => {

                cityFilter.innerHTML += `

                    <option
                        value="${escapeHtml(
                            city
                        )}"
                    >

                        ${escapeHtml(
                            city
                        )}

                    </option>

                `;

            }
        );


    const cityExists =
        cities.some(
            city =>

                normalize(city) ===
                normalize(previousValue)
        );


    cityFilter.value =
        cityExists
            ? previousValue
            : "";

}


// ==========================================
// UPDATE EMPLOYEE DROPDOWN
// ==========================================

function updateEmployeeDropdown() {

    if (!employeeFilter) {

        return;

    }


    const previousValue =
        employeeFilter.value;


    const filteredEmployees =
        getLocationFilteredEmployees();


    employeeFilter.innerHTML = `

        <option value="">
            All Employees
        </option>

    `;


    filteredEmployees
        .slice()
        .sort(
            (a, b) =>

                String(
                    a.employeeCode
                )
                    .localeCompare(
                        String(
                            b.employeeCode
                        )
                    )
        )
        .forEach(
            (employee) => {

                employeeFilter.innerHTML += `

                    <option
                        value="${escapeHtml(
                            employee.employeeCode
                        )}"
                    >

                        ${escapeHtml(
                            employee.employeeCode
                        )}

                        -

                        ${escapeHtml(
                            employee.teacherName
                        )}

                    </option>

                `;

            }
        );


    const employeeExists =
        filteredEmployees.some(
            employee =>

                normalize(
                    employee.employeeCode
                ) ===
                normalize(
                    previousValue
                )
        );


    employeeFilter.value =
        employeeExists
            ? previousValue
            : "";

}


// ==========================================
// BUILD DAILY COLLECTION MAP
//
// SAME TEACHER + SAME DATE = SUM
//
// daily_entry +
// teacher_entries
// ==========================================

function buildDailyCollectionMap() {

    const map =
        new Map();


    allEntries.forEach(
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


            // Invalid entries ignore

            if (
                !employeeCode ||
                !date
            ) {

                return;

            }


            const key =
                employeeCode +
                "|" +
                date;


            const amount =
                getEntryAmount(
                    entry
                );


            const currentAmount =
                map.get(
                    key
                ) || 0;


            map.set(
                key,

                currentAmount +
                amount
            );

        }
    );


    return map;

}


// ==========================================
// BUILD TEACHER COLLECTION MAP
//
// All dates combined
// ==========================================

function buildTeacherCollectionMap() {

    const teacherMap =
        new Map();


    const dailyMap =
        buildDailyCollectionMap();


    dailyMap.forEach(
        (amount, key) => {

            const separatorIndex =
                key.indexOf(
                    "|"
                );


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


            const currentAmount =
                teacherMap.get(
                    employeeCode
                ) || 0;


            teacherMap.set(

                employeeCode,

                currentAmount +
                numberValue(amount)

            );

        }
    );


    console.log(
        "Teacher Collection Map:",
        teacherMap
    );


    return teacherMap;

}


// ==========================================
// APPLY CURRENT FILTER
// ==========================================

function applyCurrentFilter() {

    let filteredEmployees =
        getLocationFilteredEmployees();


    const selectedEmployee =
        normalize(
            employeeFilter?.value
        );


    if (selectedEmployee) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>

                    normalize(
                        employee.employeeCode
                    ) ===
                    selectedEmployee
            );

    }


    updateSelectedTitle();

    displaySummary(
        filteredEmployees
    );

}


// ==========================================
// UPDATE SELECTED TITLE
// ==========================================

function updateSelectedTitle() {

    let title =
        "All Teachers";


    if (
        employeeFilter &&
        employeeFilter.value
    ) {

        const employee =
            employees.find(
                item =>

                    normalize(
                        item.employeeCode
                    ) ===

                    normalize(
                        employeeFilter.value
                    )
            );


        if (employee) {

            title =
                `Employee Code: ${employee.employeeCode} - ${employee.teacherName}`;

        }

    }

    else if (
        cityFilter &&
        cityFilter.value
    ) {

        title =
            `City: ${cityFilter.value}`;

    }

    else if (
        stateFilter &&
        stateFilter.value
    ) {

        title =
            `State: ${stateFilter.value}`;

    }

    else if (
        regionFilter &&
        regionFilter.value
    ) {

        title =
            `Region: ${regionFilter.value}`;

    }


    if (selectedTitle) {

        selectedTitle.textContent =
            title;

    }

}


// ==========================================
// DISPLAY SUMMARY
// ==========================================

function displaySummary(list) {

    let totalTarget =
        0;

    let totalCollection =
        0;


    // ==================================
    // COLLECTION MAP
    // ==================================

    const teacherCollectionMap =
        buildTeacherCollectionMap();


    const rows =
        [];


    list.forEach(
        (employee) => {

            const employeeCode =
                normalize(
                    employee.employeeCode
                );


            // ==================================
            // GET ALL-TIME COLLECTION
            // ==================================

            const employeeCollection =
                numberValue(

                    teacherCollectionMap.get(
                        employeeCode
                    ) || 0

                );


            const target =
                numberValue(
                    employee.target
                );


            const remaining =
                Math.max(

                    target -
                    employeeCollection,

                    0

                );


            let percentage =
                0;


            if (
                target > 0
            ) {

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

        }
    );


    // ==================================
    // TOTAL REMAINING
    // ==================================

    const totalRemaining =
        Math.max(

            totalTarget -
            totalCollection,

            0

        );


    // ==================================
    // TOTAL PERCENTAGE
    // ==================================

    let totalPercentage =
        0;


    if (
        totalTarget > 0
    ) {

        totalPercentage =

            (
                totalCollection /
                totalTarget
            ) * 100;

    }


    // ==================================
    // SUMMARY CARDS
    // ==================================

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
            `${totalPercentage.toFixed(2)}%`;

    }


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

    if (
        !tableBody
    ) {

        return;

    }


    if (
        !rows.length
    ) {

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


// ==========================================
// UNIQUE VALUES
// ==========================================

function uniqueValues(array) {

    return [

        ...new Set(

            array.filter(
                value =>

                    value &&

                    String(
                        value
                    ).trim() !==
                    "-"

            )

        )

    ];

}


// ==========================================
// REGION CHANGE
// ==========================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        function () {

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


            updateStateDropdown();

            updateCityDropdown();

            updateEmployeeDropdown();

        }
    );

}


// ==========================================
// STATE CHANGE
// ==========================================

if (stateFilter) {

    stateFilter.addEventListener(
        "change",
        function () {

            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }


            updateCityDropdown();

            updateEmployeeDropdown();

        }
    );

}


// ==========================================
// CITY CHANGE
// ==========================================

if (cityFilter) {

    cityFilter.addEventListener(
        "change",
        function () {

            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }


            updateEmployeeDropdown();

        }
    );

}


// ==========================================
// APPLY FILTER
// ==========================================

if (applyFilter) {

    applyFilter.addEventListener(
        "click",
        function () {

            applyCurrentFilter();

        }
    );

}


// ==========================================
// RESET FILTER
// ==========================================

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


            updateStateDropdown();

            updateCityDropdown();

            updateEmployeeDropdown();

            applyCurrentFilter();

        }
    );

}


// ==========================================
// START
// ==========================================

loadData();
