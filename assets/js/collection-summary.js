// ======================================================
// TELETHON
// COLLECTION SUMMARY
//
// DATA SOURCE:
// employees
// daily_entry
//
// COLLECTION LOGIC:
// Same Employee + Same Date
// = Latest Entry Only
//
// Collection Summary uses the same daily collection
// data source as Daily Report.
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


    const cleanedValue =
        String(value)
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .trim();


    const number =
        Number(cleanedValue);


    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================================
// GET EMPLOYEE CODE
// EMPLOYEES COLLECTION
// ======================================================

function getEmployeeCode(employee) {

    return String(

        employee.employeeCode ??
        employee.employee_code ??
        employee.empCode ??
        employee.emp_code ??
        employee.employeeID ??
        employee.employeeId ??
        employee.userCode ??
        employee.user_code ??
        employee.id ??
        ""

    ).trim();

}


// ======================================================
// GET TEACHER NAME
// ======================================================

function getTeacherName(employee) {

    return String(

        employee.teacherName ??
        employee.teacher_name ??
        employee.name ??
        employee.employeeName ??
        employee.employee_name ??
        ""

    ).trim();

}


// ======================================================
// GET ENTRY EMPLOYEE CODE
//
// IMPORTANT:
// Daily Report entries can use different field names.
// ======================================================

function getEntryEmployeeCode(entry) {

    return String(

        entry.employeeCode ??
        entry.employee_code ??
        entry.empCode ??
        entry.emp_code ??
        entry.employeeID ??
        entry.employeeId ??
        entry.userCode ??
        entry.user_code ??
        entry.teacherCode ??
        entry.teacher_code ??
        entry.code ??
        ""

    ).trim();

}


// ======================================================
// GET ENTRY AMOUNT
//
// IMPORTANT:
// Supports multiple Daily Report field names.
// ======================================================

function getEntryAmount(entry) {

    return numberValue(

        entry.amount ??
        entry.collection ??
        entry.collectionAmount ??
        entry.collection_amount ??
        entry.totalCollection ??
        entry.total_collection ??
        entry.dailyCollection ??
        entry.daily_collection ??
        entry.total ??
        0

    );

}


// ======================================================
// GET ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    const value =

        entry.date ??
        entry.entryDate ??
        entry.entry_date ??
        entry.collectionDate ??
        entry.collection_date ??
        "";


    return String(value).trim();

}


// ======================================================
// GET CREATED TIME
//
// Used to find latest entry.
// ======================================================

function getCreatedTime(entry) {

    if (!entry) {

        return 0;

    }


    const value =
        entry.createdAt ??
        entry.created_at ??
        entry.updatedAt ??
        entry.updated_at ??
        null;


    if (!value) {

        return 0;

    }


    // Firestore Timestamp

    if (
        typeof value.toMillis === "function"
    ) {

        return value.toMillis();

    }


    // Timestamp object

    if (
        typeof value.seconds === "number"
    ) {

        return (
            value.seconds * 1000
        ) +
        Math.floor(
            (value.nanoseconds || 0) / 1000000
        );

    }


    // JavaScript Date

    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    // String Date

    const parsed =
        new Date(value).getTime();


    return Number.isFinite(parsed)
        ? parsed
        : 0;

}


// ======================================================
// LOAD DATA
// ======================================================

async function loadData() {

    try {

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


        // ==================================================
        // LOAD EMPLOYEES
        // ==================================================

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        employees = [];


        employeeSnapshot.forEach((docSnap) => {

            const data =
                docSnap.data();


            employees.push({

                id:
                    docSnap.id,


                employeeCode:
                    getEmployeeCode({

                        ...data,

                        id: docSnap.id

                    }),


                teacherName:
                    getTeacherName(
                        data
                    ) || "-",


                region:
                    String(
                        data.region ?? "-"
                    ).trim() || "-",


                state:
                    String(
                        data.state ?? "-"
                    ).trim() || "-",


                city:
                    String(
                        data.city ?? "-"
                    ).trim() || "-",


                jamiatulMadina:
                    String(

                        data.jamiatulMadina ??
                        data.jamiatul_madina ??
                        data.jamiatuMadina ??
                        data.jamiatulMadinah ??
                        "-"

                    ).trim() || "-",


                target:
                    numberValue(

                        data.targetAmount ??
                        data.target ??
                        data.target_amount ??
                        data.Target ??
                        0

                    )

            });

        });


        // ==================================================
        // LOAD DAILY REPORT DATA
        //
        // Collection Summary only reads:
        // daily_entry
        // ==================================================

        const dailyEntrySnapshot =
            await getDocs(
                collection(
                    db,
                    "daily_entry"
                )
            );


        dailyEntries = [];


        dailyEntrySnapshot.forEach((docSnap) => {

            const data =
                docSnap.data();


            const employeeCode =
                getEntryEmployeeCode(
                    data
                );


            const amount =
                getEntryAmount(
                    data
                );


            const date =
                getEntryDate(
                    data
                );


            dailyEntries.push({

                id:
                    docSnap.id,

                employeeCode:
                    employeeCode,

                amount:
                    amount,

                date:
                    date,

                createdAt:
                    data.createdAt ??
                    data.created_at ??
                    null,


                raw:
                    data

            });

        });


        console.log(
            "Employees:",
            employees
        );


        console.log(
            "Daily Report Entries:",
            dailyEntries
        );


        // ==================================================
        // IMPORTANT
        //
        // SAME EMPLOYEE + SAME DATE
        // ONLY LATEST ENTRY WILL COUNT
        // ==================================================

        dailyEntries =
            getLatestEntriesPerEmployeePerDate(
                dailyEntries
            );


        console.log(
            "Final Daily Report Entries:",
            dailyEntries
        );


        // ==================================================
        // LOAD FILTERS
        // ==================================================

        loadRegionDropdown();

        loadEmployeeDropdown();

        updateStateDropdown(
            false
        );

        updateCityDropdown(
            false
        );


        // ==================================================
        // INITIAL DISPLAY
        // ==================================================

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

                    ${escapeHtml(
                        error.message
                    )}

                </td>

            </tr>

        `;

    }

}


// ======================================================
// GET LATEST ENTRY
//
// SAME EMPLOYEE + SAME DATE
// ======================================================

function getLatestEntriesPerEmployeePerDate(
    allEntries
) {

    const latestMap =
        new Map();


    allEntries.forEach((entry) => {

        const employeeCode =
            normalize(
                entry.employeeCode
            );


        const date =
            normalize(
                entry.date
            );


        // Invalid Employee Code ignore

        if (!employeeCode) {

            return;

        }


        // If date is missing,
        // use document ID as separate entry

        const uniqueKey =
            date
                ? `${employeeCode}__${date}`
                : `${employeeCode}__${entry.id}`;


        const createdTime =
            getCreatedTime(
                entry
            );


        const existing =
            latestMap.get(
                uniqueKey
            );


        if (!existing) {

            latestMap.set(
                uniqueKey,
                {

                    ...entry,

                    _createdTime:
                        createdTime

                }
            );


            return;

        }


        // Keep latest entry

        if (
            createdTime >=
            existing._createdTime
        ) {

            latestMap.set(
                uniqueKey,
                {

                    ...entry,

                    _createdTime:
                        createdTime

                }
            );

        }

    });


    return Array.from(
        latestMap.values()
    ).map((entry) => {

        const {
            _createdTime,
            ...cleanEntry
        } = entry;


        return cleanEntry;

    });

}


// ======================================================
// REGION DROPDOWN
// ======================================================

function loadRegionDropdown() {

    if (!regionFilter) {

        return;

    }


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
                String(a).localeCompare(
                    String(b)
                )
        )
        .forEach((region) => {

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

        });

}


// ======================================================
// STATE DROPDOWN
// ======================================================

function updateStateDropdown(
    resetValue = true
) {

    if (!stateFilter) {

        return;

    }


    const currentState =
        stateFilter.value;


    const selectedRegion =
        regionFilter.value;


    let filtered =
        employees.slice();


    if (selectedRegion) {

        filtered =
            filtered.filter(
                employee =>
                    employee.region ===
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
        .sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b)
                )
        )
        .forEach((state) => {

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

        });


    if (
        !resetValue &&
        currentState
    ) {

        stateFilter.value =
            currentState;

    }

}


// ======================================================
// CITY DROPDOWN
// ======================================================

function updateCityDropdown(
    resetValue = true
) {

    if (!cityFilter) {

        return;

    }


    const currentCity =
        cityFilter.value;


    const selectedRegion =
        regionFilter.value;


    const selectedState =
        stateFilter.value;


    let filtered =
        employees.slice();


    if (selectedRegion) {

        filtered =
            filtered.filter(
                employee =>
                    employee.region ===
                    selectedRegion
            );

    }


    if (selectedState) {

        filtered =
            filtered.filter(
                employee =>
                    employee.state ===
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
        .sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b)
                )
        )
        .forEach((city) => {

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

        });


    if (
        !resetValue &&
        currentCity
    ) {

        cityFilter.value =
            currentCity;

    }

}


// ======================================================
// EMPLOYEE DROPDOWN
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
        .forEach((employee) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                employee.employeeCode;


            option.textContent =
                `${employee.employeeCode} - ${employee.teacherName}`;


            employeeFilter.appendChild(
                option
            );

        });

}


// ======================================================
// REGION CHANGE
// ======================================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        () => {

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

            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }


            updateCityDropdown();

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
// RESET FILTER
// ======================================================

if (resetFilter) {

    resetFilter.addEventListener(
        "click",
        () => {

            regionFilter.value =
                "";

            stateFilter.value =
                "";

            cityFilter.value =
                "";

            employeeFilter.value =
                "";


            updateStateDropdown();

            updateCityDropdown();

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


    // REGION

    if (regionFilter.value) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    employee.region ===
                    regionFilter.value
            );

    }


    // STATE

    if (stateFilter.value) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    employee.state ===
                    stateFilter.value
            );

    }


    // CITY

    if (cityFilter.value) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    employee.city ===
                    cityFilter.value
            );

    }


    // EMPLOYEE

    if (employeeFilter.value) {

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


    updateSelectedTitle();

    displaySummary(
        filteredEmployees
    );

}


// ======================================================
// UPDATE SELECTED TITLE
// ======================================================

function updateSelectedTitle() {

    let title =
        "All Teachers";


    if (employeeFilter.value) {

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


    if (selectedTitle) {

        selectedTitle.textContent =
            title;

    }

}


// ======================================================
// DISPLAY SUMMARY
// ======================================================

function displaySummary(
    employeeList
) {

    let totalTarget = 0;

    let totalCollection = 0;


    const rows = [];


    employeeList.forEach((employee) => {

        const employeeCode =
            normalize(
                employee.employeeCode
            );


        // ==================================================
        // GET DAILY REPORT COLLECTION
        // ==================================================

        const employeeCollection =
            dailyEntries
                .filter((entry) => {

                    return (
                        normalize(
                            entry.employeeCode
                        ) ===
                        employeeCode
                    );

                })
                .reduce(
                    (sum, entry) => {

                        return (
                            sum +
                            numberValue(
                                entry.amount
                            )
                        );

                    },
                    0
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


    // ==================================================
    // TOTAL REMAINING
    // ==================================================

    const totalRemaining =
        Math.max(
            totalTarget -
            totalCollection,
            0
        );


    // ==================================================
    // TOTAL PERCENTAGE
    // ==================================================

    let totalPercentage = 0;


    if (totalTarget > 0) {

        totalPercentage =
            (
                totalCollection /
                totalTarget
            ) * 100;

    }


    // ==================================================
    // SUMMARY CARDS
    // ==================================================

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


    // ==================================================
    // DISPLAY TABLE
    // ==================================================

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


        tableFoot.innerHTML =
            "";


        return;

    }


    let html =
        "";


    rows.forEach(
        (employee, index) => {


            let percentageClass =
                "";


            if (
                employee.percentage < 40
            ) {

                percentageClass =
                    "low";

            }
            else if (
                employee.percentage < 70
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


    // ==================================================
    // TOTAL ROW
    // ==================================================

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


// ======================================================
// FORMAT MONEY
// ======================================================

function formatMoney(
    amount
) {

    return `₹ ${numberValue(
        amount
    ).toLocaleString(
        "en-IN"
    )}`;

}


// ======================================================
// UNIQUE VALUES
// ======================================================

function uniqueValues(
    array
) {

    return [

        ...new Set(

            array.filter(
                value => {

                    return (
                        value &&
                        value !== "-"
                    );

                }
            )

        )

    ];

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(
    value
) {

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
