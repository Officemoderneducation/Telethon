// ======================================================
// TELETHON
// COLLECTION SUMMARY
//
// DATA SOURCE:
// employees
// daily_entry
//
// IMPORTANT:
// Collection Summary uses the SAME collection logic
// as Daily Report.
//
// SAME EMPLOYEE + SAME DATE
// ONLY THE LATEST ENTRY WILL COUNT
// ======================================================


import { db } from "./firebase-config.js";


import {

    collection,
    getDocs

}
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";




// ======================================================
// COLLECTION NAMES
// ======================================================

const EMPLOYEES_COLLECTION =
    "employees";


const DAILY_ENTRY_COLLECTION =
    "daily_entry";




// ======================================================
// HTML ELEMENTS
// ======================================================

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




// ======================================================
// DATA
// ======================================================

let employees = [];


let dailyEntries = [];




// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(
        value ?? ""
    )
    .trim()
    .toLowerCase();

}




// ======================================================
// NUMBER VALUE
// ======================================================

function numberValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? value
            : 0;

    }


    let cleanedValue =
        String(value)
        .replace(/[₹,\s]/g, "")
        .trim();


    const number =
        Number(cleanedValue);


    return Number.isFinite(number)
        ? number
        : 0;

}




// ======================================================
// GET EMPLOYEE CODE
//
// Supports different Firebase field names
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

    )
    .trim();

}




// ======================================================
// GET ENTRY EMPLOYEE CODE
//
// IMPORTANT:
// Daily Report and Collection Summary use
// the same Employee Code matching logic.
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

        entry.emp_code ||

        ""

    )
    .trim();

}




// ======================================================
// GET TEACHER NAME
// ======================================================

function getTeacherName(employee) {

    return String(

        employee.teacherName ||

        employee.teacher_name ||

        employee.name ||

        employee.employeeName ||

        employee.fullName ||

        "-"

    )
    .trim();

}




// ======================================================
// GET REGION
// ======================================================

function getEmployeeRegion(employee) {

    return String(

        employee.region ||

        employee.Region ||

        "-"

    )
    .trim();

}




// ======================================================
// GET STATE
// ======================================================

function getEmployeeState(employee) {

    return String(

        employee.state ||

        employee.State ||

        "-"

    )
    .trim();

}




// ======================================================
// GET CITY
// ======================================================

function getEmployeeCity(employee) {

    return String(

        employee.city ||

        employee.City ||

        "-"

    )
    .trim();

}




// ======================================================
// GET JAMIATUL MADINA
// ======================================================

function getEmployeeJamiatulMadina(
    employee
) {

    return String(

        employee.jamiatulMadina ||

        employee.jamiatul_madina ||

        employee.jamiatuMadina ||

        employee.jamiatulMadinah ||

        employee.jamiatul ||

        "-"

    )
    .trim();

}




// ======================================================
// GET EMPLOYEE TARGET
// ======================================================

function getEmployeeTarget(employee) {

    return numberValue(

        employee.targetAmount ??

        employee.target ??

        employee.target_amount ??

        employee.Target ??

        0

    );

}




// ======================================================
// GET ENTRY AMOUNT
//
// Supports Daily Report style field names
// ======================================================

function getEntryAmount(entry) {

    return numberValue(

        entry.amount ??

        entry.collection ??

        entry.collectionAmount ??

        entry.totalCollection ??

        entry.total_collection ??

        entry.collection_amount ??

        0

    );

}




// ======================================================
// GET ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    return String(

        entry.date ||

        entry.entryDate ||

        entry.entry_date ||

        entry.collectionDate ||

        entry.collection_date ||

        ""

    )
    .trim();

}




// ======================================================
// GET CREATED TIME
//
// Used to identify latest entry.
// ======================================================

function getCreatedTime(entry) {

    if (!entry.createdAt) {

        return 0;

    }


    if (

        typeof entry.createdAt.toMillis ===
        "function"

    ) {

        return entry.createdAt.toMillis();

    }


    if (

        entry.createdAt.seconds !==
        undefined

    ) {

        return (

            Number(
                entry.createdAt.seconds
            ) * 1000

        );

    }


    const date =
        new Date(
            entry.createdAt
        );


    const time =
        date.getTime();


    return Number.isFinite(time)
        ? time
        : 0;

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
                    EMPLOYEES_COLLECTION
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
                        getTeacherName(
                            data
                        ),


                    region:
                        getEmployeeRegion(
                            data
                        ),


                    state:
                        getEmployeeState(
                            data
                        ),


                    city:
                        getEmployeeCity(
                            data
                        ),


                    jamiatulMadina:
                        getEmployeeJamiatulMadina(
                            data
                        ),


                    target:
                        getEmployeeTarget(
                            data
                        )

                });

            }
        );


        // ==============================================
        // LOAD DAILY ENTRIES
        //
        // SAME SOURCE AS DAILY REPORT
        // ==============================================

        const entrySnapshot =
            await getDocs(

                collection(
                    db,
                    DAILY_ENTRY_COLLECTION
                )

            );


        dailyEntries = [];


        entrySnapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                dailyEntries.push({

                    id:
                        docSnap.id,


                    employeeCode:
                        getEntryEmployeeCode(
                            data
                        ),


                    date:
                        getEntryDate(
                            data
                        ),


                    amount:
                        getEntryAmount(
                            data
                        ),


                    createdAt:
                        data.createdAt ||

                        data.updatedAt ||

                        data.timestamp ||

                        null,


                    rawData:
                        data

                });

            }
        );


        console.log(
            "Employees:",
            employees
        );


        console.log(
            "All Daily Entries:",
            dailyEntries
        );


        // ==============================================
        // IMPORTANT
        //
        // SAME EMPLOYEE + SAME DATE
        // ONLY LATEST ENTRY WILL COUNT
        // ==============================================

        dailyEntries =
            getLatestEntries(
                dailyEntries
            );


        console.log(
            "Latest Daily Entries:",
            dailyEntries
        );


        // ==============================================
        // LOAD FILTERS
        // ==============================================

        loadRegionDropdown();


        loadEmployeeDropdown();


        updateStateDropdown(
            false
        );


        updateCityDropdown(
            false
        );


        // ==============================================
        // INITIAL SUMMARY
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




// ======================================================
// GET LATEST ENTRY
//
// SAME EMPLOYEE + SAME DATE
//
// Daily Report logic:
// only latest entry counts.
// ======================================================

function getLatestEntries(entries) {

    const latestMap =
        new Map();


    entries.forEach(
        (entry) => {

            const employeeCode =
                normalize(
                    entry.employeeCode
                );


            const date =
                String(
                    entry.date || ""
                ).trim();


            // Invalid entry ignore

            if (

                !employeeCode ||

                !date

            ) {

                return;

            }


            // ==========================================
            // UNIQUE KEY
            // ==========================================

            const key =
                employeeCode +
                "_" +
                date;


            const existing =
                latestMap.get(
                    key
                );


            // ==========================================
            // FIRST ENTRY
            // ==========================================

            if (!existing) {

                latestMap.set(
                    key,
                    entry
                );


                return;

            }


            // ==========================================
            // COMPARE CREATED TIME
            // ==========================================

            const currentTime =
                getCreatedTime(
                    entry
                );


            const existingTime =
                getCreatedTime(
                    existing
                );


            // Latest entry replace

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




// ======================================================
// LOAD REGION DROPDOWN
// ======================================================

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
        .sort(
            (a, b) =>
                a.localeCompare(b)
        )
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


    if (

        regions.includes(
            currentValue
        )

    ) {

        regionFilter.value =
            currentValue;

    }

}




// ======================================================
// UPDATE STATE DROPDOWN
// ======================================================

function updateStateDropdown(
    resetValue = true
) {

    if (!stateFilter) {

        return;

    }


    const currentValue =
        stateFilter.value;


    const selectedRegion =
        regionFilter
            ? regionFilter.value
            : "";


    let filteredEmployees =
        employees.slice();


    if (selectedRegion) {

        filteredEmployees =
            filteredEmployees.filter(

                employee =>

                    employee.region ===
                    selectedRegion

            );

    }


    const states =
        uniqueValues(

            filteredEmployees.map(
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
        .sort(
            (a, b) =>
                a.localeCompare(b)
        )
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


    if (

        !resetValue &&

        states.includes(
            currentValue
        )

    ) {

        stateFilter.value =
            currentValue;

    }


    if (resetValue) {

        stateFilter.value =
            "";

    }

}




// ======================================================
// UPDATE CITY DROPDOWN
// ======================================================

function updateCityDropdown(
    resetValue = true
) {

    if (!cityFilter) {

        return;

    }


    const currentValue =
        cityFilter.value;


    const selectedRegion =
        regionFilter
            ? regionFilter.value
            : "";


    const selectedState =
        stateFilter
            ? stateFilter.value
            : "";


    let filteredEmployees =
        employees.slice();


    if (selectedRegion) {

        filteredEmployees =
            filteredEmployees.filter(

                employee =>

                    employee.region ===
                    selectedRegion

            );

    }


    if (selectedState) {

        filteredEmployees =
            filteredEmployees.filter(

                employee =>

                    employee.state ===
                    selectedState

            );

    }


    const cities =
        uniqueValues(

            filteredEmployees.map(
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
        .sort(
            (a, b) =>
                a.localeCompare(b)
        )
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


    if (

        !resetValue &&

        cities.includes(
            currentValue
        )

    ) {

        cityFilter.value =
            currentValue;

    }


    if (resetValue) {

        cityFilter.value =
            "";

    }

}




// ======================================================
// LOAD EMPLOYEE DROPDOWN
// ======================================================

function loadEmployeeDropdown() {

    if (!employeeFilter) {

        return;

    }


    employeeFilter.innerHTML = `

        <option value="">
            All Employees
        </option>

    `;


    employees
        .slice()
        .sort(
            (a, b) =>

                String(
                    a.employeeCode
                ).localeCompare(

                    String(
                        b.employeeCode
                    )

                )

        )
        .forEach(
            (employee) => {

                if (
                    !employee.employeeCode
                ) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    employee.employeeCode;


                option.textContent =
                    employee.employeeCode +
                    " - " +
                    employee.teacherName;


                employeeFilter.appendChild(
                    option
                );

            }
        );

}




// ======================================================
// REGION CHANGE
// ======================================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        () => {

            updateStateDropdown(
                true
            );


            updateCityDropdown(
                true
            );


            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }

        }
    );

}




// ======================================================
// STATE CHANGE
// ======================================================

if (stateFilter) {

    stateFilter.addEventListener(
        "change",
        () => {

            updateCityDropdown(
                true
            );


            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }

        }
    );

}




// ======================================================
// CITY CHANGE
// ======================================================

if (cityFilter) {

    cityFilter.addEventListener(
        "change",
        () => {

            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }

        }
    );

}




// ======================================================
// APPLY FILTER
// ======================================================

if (applyFilter) {

    applyFilter.addEventListener(
        "click",
        () => {

            applyCurrentFilter();

        }
    );

}




// ======================================================
// APPLY CURRENT FILTER
// ======================================================

function applyCurrentFilter() {

    let filteredEmployees =
        employees.slice();


    // ==============================================
    // REGION
    // ==============================================

    if (

        regionFilter &&
        regionFilter.value

    ) {

        filteredEmployees =
            filteredEmployees.filter(

                employee =>

                    employee.region ===
                    regionFilter.value

            );

    }


    // ==============================================
    // STATE
    // ==============================================

    if (

        stateFilter &&
        stateFilter.value

    ) {

        filteredEmployees =
            filteredEmployees.filter(

                employee =>

                    employee.state ===
                    stateFilter.value

            );

    }


    // ==============================================
    // CITY
    // ==============================================

    if (

        cityFilter &&
        cityFilter.value

    ) {

        filteredEmployees =
            filteredEmployees.filter(

                employee =>

                    employee.city ===
                    cityFilter.value

            );

    }


    // ==============================================
    // EMPLOYEE
    // ==============================================

    if (

        employeeFilter &&
        employeeFilter.value

    ) {

        filteredEmployees =
            filteredEmployees.filter(

                employee =>

                    normalize(
                        employee.employeeCode
                    ) ===

                    normalize(
                        employeeFilter.value
                    )

            );

    }


    // ==============================================
    // UPDATE TITLE
    // ==============================================

    updateSelectedTitle();


    // ==============================================
    // DISPLAY SUMMARY
    // ==============================================

    displaySummary(
        filteredEmployees
    );

}




// ======================================================
// RESET FILTER
// ======================================================

if (resetFilter) {

    resetFilter.addEventListener(
        "click",
        () => {

            if (regionFilter) {

                regionFilter.value =
                    "";

            }


            updateStateDropdown(
                true
            );


            updateCityDropdown(
                true
            );


            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }


            applyCurrentFilter();

        }
    );

}




// ======================================================
// UPDATE SELECTED TITLE
// ======================================================

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




// ======================================================
// GET EMPLOYEE COLLECTION
//
// Uses latest Daily Report entries.
// ======================================================

function getEmployeeCollection(
    employeeCode
) {

    const normalizedCode =
        normalize(
            employeeCode
        );


    if (!normalizedCode) {

        return 0;

    }


    return dailyEntries
        .filter(

            entry =>

                normalize(
                    entry.employeeCode
                ) ===
                normalizedCode

        )
        .reduce(

            (total, entry) =>

                total +
                numberValue(
                    entry.amount
                ),

            0

        );

}




// ======================================================
// DISPLAY SUMMARY
// ======================================================

function displaySummary(list) {

    let totalTarget = 0;


    let totalCollection = 0;


    const rows = [];


    list.forEach(
        (employee) => {

            const target =
                numberValue(
                    employee.target
                );


            // ==========================================
            // COLLECTION
            //
            // IMPORTANT:
            // Uses same latest entry logic
            // as Daily Report.
            // ==========================================

            const employeeCollection =
                getEmployeeCollection(
                    employee.employeeCode
                );


            const remaining =
                Math.max(

                    target -
                    employeeCollection,

                    0

                );


            let percentage =
                0;


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
            `${totalPercentage.toFixed(2)}%`;

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

                    Is filter ke liye
                    koi Teacher nahi mila.

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

            let percentageClass =
                "";


            if (

                employee.percentage <
                40

            ) {

                percentageClass =
                    "low";

            }

            else if (

                employee.percentage <
                70

            ) {

                percentageClass =
                    "medium";

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


    // ==============================================
    // TOTAL ROW
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
// MONEY FORMAT
// ======================================================

function formatMoney(amount) {

    return `₹ ${numberValue(
        amount
    ).toLocaleString(
        "en-IN"
    )}`;

}




// ======================================================
// UNIQUE VALUES
// ======================================================

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




// ======================================================
// HTML ESCAPE
// ======================================================

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




// ======================================================
// START
// ======================================================

loadData();
