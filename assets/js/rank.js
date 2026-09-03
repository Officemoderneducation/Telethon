// ======================================================
// TELETHON
// RANK PAGE
//
// RANK:
// TEACHER WISE
//
// METRICS:
// 1. Highest Amount
// 2. Target Wise
// 3. Highest Target %
//
// RANK LIMIT:
// Top 3 / 5 / 10 / 26 / 50 / 100 / Custom
//
// FILTER:
// Multiple Regions
// Multiple States
// Single City
//
// DATA:
// daily_entry
// teacher_entries
// employees
//
// SAME TEACHER + SAME DATE = SUM
//
// 1 UNIT = ₹7,000
// ======================================================


import {
    db
} from "./firebase-config.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



// ======================================================
// ADMIN ACCESS
// ======================================================

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



// ======================================================
// CONSTANTS
// ======================================================

const UNIT_AMOUNT = 7000;

const EMPLOYEES_COLLECTION =
    "employees";

const DAILY_ENTRY_COLLECTION =
    "daily_entry";

const TEACHER_ENTRIES_COLLECTION =
    "teacher_entries";



// ======================================================
// HTML ELEMENTS
// ======================================================

const rankBy =
    document.getElementById(
        "rankBy"
    );

const rankMetric =
    document.getElementById(
        "rankMetric"
    );

const rankLimit =
    document.getElementById(
        "rankLimit"
    );

const customRank =
    document.getElementById(
        "customRank"
    );

const customRankGroup =
    document.getElementById(
        "customRankGroup"
    );

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

const fromDate =
    document.getElementById(
        "fromDate"
    );

const toDate =
    document.getElementById(
        "toDate"
    );

const applyFilter =
    document.getElementById(
        "applyFilter"
    );

const resetFilter =
    document.getElementById(
        "resetFilter"
    );

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const rankTableBody =
    document.getElementById(
        "rankTableBody"
    );

const totalRanked =
    document.getElementById(
        "totalRanked"
    );

const rankOneName =
    document.getElementById(
        "rankOneName"
    );

const selectionText =
    document.getElementById(
        "selectionText"
    );

const loadingStatus =
    document.getElementById(
        "loadingStatus"
    );

const resultCount =
    document.getElementById(
        "resultCount"
    );

const tableSubtitle =
    document.getElementById(
        "tableSubtitle"
    );



// ======================================================
// DATA
// ======================================================

let employees = [];

let dailyEntries = [];

let teacherEntries = [];

let allEntries = [];

let currentRows = [];



// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}



// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}



// ======================================================
// NUMBER
// ======================================================

function numberValue(value) {

    const number =
        Number(
            String(
                value ?? ""
            )
                .replace(
                    /,/g,
                    ""
                )
                .replace(
                    /₹/g,
                    ""
                )
                .replace(
                    /\s/g,
                    ""
                )
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

}



// ======================================================
// MONEY
// ======================================================

function formatMoney(value) {

    return (
        "₹ " +
        numberValue(value)
            .toLocaleString(
                "en-IN"
            )
    );

}



// ======================================================
// UNIT
// ======================================================

function formatUnit(value) {

    const units =
        numberValue(value) /
        UNIT_AMOUNT;

    return (
        units.toLocaleString(
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
// PERCENTAGE
// ======================================================

function getPercentage(
    collection,
    target
) {

    collection =
        numberValue(
            collection
        );

    target =
        numberValue(
            target
        );

    if (target <= 0) {

        return 0;

    }

    return (
        collection /
        target
    ) * 100;

}



// ======================================================
// EMPLOYEE CODE
// ======================================================

function getEmployeeCode(
    employee
) {

    return String(

        employee?.employeeCode ||

        employee?.employee_code ||

        employee?.empCode ||

        employee?.emp_code ||

        employee?.employeeID ||

        employee?.employeeId ||

        employee?.userCode ||

        employee?.user_code ||

        employee?.id ||

        ""

    ).trim();

}



// ======================================================
// ENTRY EMPLOYEE CODE
// ======================================================

function getEntryEmployeeCode(
    entry
) {

    return String(

        entry?.employeeCode ||

        entry?.employee_code ||

        entry?.empCode ||

        entry?.emp_code ||

        entry?.employeeID ||

        entry?.employeeId ||

        entry?.userCode ||

        entry?.user_code ||

        entry?.emp_id ||

        entry?.employee ||

        entry?.teacherCode ||

        entry?.teacher_code ||

        entry?.code ||

        ""

    ).trim();

}



// ======================================================
// ENTRY AMOUNT
// ======================================================

function getEntryAmount(
    entry
) {

    return numberValue(

        entry?.amount ||

        entry?.collection ||

        entry?.collectionAmount ||

        entry?.collection_amount ||

        entry?.totalCollection ||

        entry?.total_collection ||

        entry?.collectedAmount ||

        entry?.collected_amount ||

        entry?.dailyCollection ||

        entry?.daily_collection ||

        0

    );

}



// ======================================================
// ENTRY DATE
// ======================================================

function getEntryDate(
    entry
) {

    return (

        entry?.date ||

        entry?.entryDate ||

        entry?.collectionDate ||

        entry?.collection_date ||

        entry?.createdDate ||

        entry?.created_date ||

        ""

    );

}



// ======================================================
// DATE FORMAT
// ======================================================

function formatDateForInput(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );

    const day =
        String(
            date.getDate()
        )
            .padStart(
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



// ======================================================
// NORMALIZE DATE
// ======================================================

function normalizeDate(
    value
) {

    if (!value) {

        return "";

    }


    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return formatDateForInput(
            value.toDate()
        );

    }


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
        String(
            value
        ).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(
                stringValue
            )
    ) {

        return stringValue;

    }


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



// ======================================================
// EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(
    employee
) {

    return String(

        employee?.region ||

        employee?.regionName ||

        employee?.region_name ||

        ""

    ).trim();

}



// ======================================================
// EMPLOYEE STATE
// ======================================================

function getEmployeeState(
    employee
) {

    return String(

        employee?.state ||

        employee?.stateName ||

        employee?.state_name ||

        ""

    ).trim();

}



// ======================================================
// EMPLOYEE CITY
// ======================================================

function getEmployeeCity(
    employee
) {

    return String(

        employee?.city ||

        employee?.cityName ||

        employee?.city_name ||

        ""

    ).trim();

}



// ======================================================
// EMPLOYEE NAME
// ======================================================

function getEmployeeName(
    employee
) {

    return String(

        employee?.name ||

        employee?.teacherName ||

        employee?.teacher_name ||

        employee?.employeeName ||

        employee?.employee_name ||

        employee?.fullName ||

        employee?.full_name ||

        employee?.displayName ||

        employee?.display_name ||

        employee?.userName ||

        employee?.username ||

        ""

    ).trim();

}



// ======================================================
// EMPLOYEE TARGET
// ======================================================

function getEmployeeTarget(
    employee
) {

    return numberValue(

        employee?.targetAmount ||

        employee?.target ||

        employee?.manualTarget ||

        employee?.manual_target ||

        0

    );

}



// ======================================================
// LOAD COLLECTION
// ======================================================

async function loadCollection(
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
        docSnapshot => {

            result.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data(),

                _source:
                    collectionName

            });

        }
    );


    return result;

}



// ======================================================
// MULTI SELECT VALUES
// ======================================================

function getSelectedValues(
    selectElement
) {

    if (!selectElement) {

        return [];

    }


    return Array.from(
        selectElement.selectedOptions
    )
        .map(
            option =>
                normalize(
                    option.value
                )
        )
        .filter(
            value =>
                value
        );

}



// ======================================================
// LOAD DATA
// ======================================================

async function loadData() {

    setLoading(
        true,
        "Loading Firebase Data..."
    );


    try {

        const [
            employeeData,
            oldEntries,
            newEntries
        ] = await Promise.all([

            loadCollection(
                EMPLOYEES_COLLECTION
            ),

            loadCollection(
                DAILY_ENTRY_COLLECTION
            ),

            loadCollection(
                TEACHER_ENTRIES_COLLECTION
            )

        ]);


        employees =
            employeeData;

        dailyEntries =
            oldEntries;

        teacherEntries =
            newEntries;


        allEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        loadRegionDropdown();

        updateStateDropdown();

        updateCityDropdown();

        applyCurrentFilters();

    }
    catch (error) {

        console.error(
            "Rank Data Error:",
            error
        );


        rankTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="error-cell"
                >

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    Data load nahi ho paaya.

                    <br>

                    ${escapeHTML(
                        error.message
                    )}

                </td>

            </tr>

        `;

    }
    finally {

        setLoading(
            false
        );

    }

}



// ======================================================
// REGION DROPDOWN
// ======================================================

function loadRegionDropdown() {

    const previous =
        getSelectedValues(
            regionFilter
        );


    const regions =
        new Map();


    employees.forEach(
        employee => {

            const region =
                getEmployeeRegion(
                    employee
                );


            if (region) {

                regions.set(
                    normalize(region),
                    region
                );

            }

        }
    );


    regionFilter.innerHTML = "";


    Array.from(
        regions.values()
    )
        .sort(
            (a, b) =>
                a.localeCompare(
                    b
                )
        )
        .forEach(
            region => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    region;

                option.textContent =
                    region;

                option.selected =
                    previous.includes(
                        normalize(region)
                    );

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

    const selectedRegions =
        getSelectedValues(
            regionFilter
        );


    const previousStates =
        getSelectedValues(
            stateFilter
        );


    const states =
        new Map();


    employees.forEach(
        employee => {

            const region =
                normalize(
                    getEmployeeRegion(
                        employee
                    )
                );

            const state =
                getEmployeeState(
                    employee
                );


            if (
                selectedRegions.length > 0 &&
                !selectedRegions.includes(
                    region
                )
            ) {

                return;

            }


            if (state) {

                states.set(
                    normalize(state),
                    state
                );

            }

        }
    );


    stateFilter.innerHTML = "";


    Array.from(
        states.values()
    )
        .sort(
            (a, b) =>
                a.localeCompare(
                    b
                )
        )
        .forEach(
            state => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    state;

                option.textContent =
                    state;

                option.selected =
                    previousStates.includes(
                        normalize(state)
                    );

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

    const selectedRegions =
        getSelectedValues(
            regionFilter
        );


    const selectedStates =
        getSelectedValues(
            stateFilter
        );


    const previousCity =
        normalize(
            cityFilter.value
        );


    const cities =
        new Map();


    employees.forEach(
        employee => {

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

            const city =
                getEmployeeCity(
                    employee
                );


            if (
                selectedRegions.length > 0 &&
                !selectedRegions.includes(
                    region
                )
            ) {

                return;

            }


            if (
                selectedStates.length > 0 &&
                !selectedStates.includes(
                    state
                )
            ) {

                return;

            }


            if (city) {

                cities.set(
                    normalize(city),
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


    Array.from(
        cities.values()
    )
        .sort(
            (a, b) =>
                a.localeCompare(
                    b
                )
        )
        .forEach(
            city => {

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
        previousCity &&
        Array.from(
            cityFilter.options
        )
            .some(
                option =>
                    normalize(
                        option.value
                    ) === previousCity
            )
    ) {

        cityFilter.value =
            previousCity;

    }

}



// ======================================================
// DATE RANGE
// ======================================================

function entryInDateRange(
    entry
) {

    const entryDate =
        normalizeDate(
            getEntryDate(
                entry
            )
        );


    if (!entryDate) {

        return false;

    }


    const from =
        fromDate.value;

    const to =
        toDate.value;


    if (
        from &&
        entryDate < from
    ) {

        return false;

    }


    if (
        to &&
        entryDate > to
    ) {

        return false;

    }


    return true;

}



// ======================================================
// EMPLOYEE MAP
// ======================================================

function buildEmployeeMap() {

    const map =
        new Map();


    employees.forEach(
        employee => {

            const code =
                getEmployeeCode(
                    employee
                );


            if (code) {

                map.set(
                    normalize(code),
                    employee
                );

            }

        }
    );


    return map;

}



// ======================================================
// TEACHER COLLECTION
//
// SAME TEACHER + SAME DATE = SUM
// ======================================================

function buildTeacherCollections() {

    const teacherDateMap =
        new Map();


    allEntries.forEach(
        entry => {

            if (
                !entryInDateRange(
                    entry
                )
            ) {

                return;

            }


            const code =
                getEntryEmployeeCode(
                    entry
                );


            if (!code) {

                return;

            }


            const employee =
                employees.find(
                    item =>
                        normalize(
                            getEmployeeCode(
                                item
                            )
                        ) ===
                        normalize(code)
                );


            if (!employee) {

                return;

            }


            const date =
                normalizeDate(
                    getEntryDate(
                        entry
                    )
                );


            if (!date) {

                return;

            }


            const key =
                normalize(code) +
                "_" +
                date;


            const amount =
                getEntryAmount(
                    entry
                );


            if (
                !teacherDateMap.has(
                    key
                )
            ) {

                teacherDateMap.set(
                    key,
                    {

                        code:
                            code,

                        employee:
                            employee,

                        date:
                            date,

                        amount:
                            0

                    }
                );

            }


            teacherDateMap.get(
                key
            ).amount +=
                amount;

        }
    );


    return Array.from(
        teacherDateMap.values()
    );

}



// ======================================================
// FILTER EMPLOYEES
// ======================================================

function employeeMatchesFilters(
    employee
) {

    const selectedRegions =
        getSelectedValues(
            regionFilter
        );


    const selectedStates =
        getSelectedValues(
            stateFilter
        );


    const selectedCity =
        normalize(
            cityFilter.value
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


    if (
        selectedRegions.length > 0 &&
        !selectedRegions.includes(
            employeeRegion
        )
    ) {

        return false;

    }


    if (
        selectedStates.length > 0 &&
        !selectedStates.includes(
            employeeState
        )
    ) {

        return false;

    }


    if (
        selectedCity &&
        employeeCity !==
        selectedCity
    ) {

        return false;

    }


    return true;

}



// ======================================================
// TEACHER WISE RANKING
// ======================================================

function buildTeacherRows(
    teacherCollections
) {

    const teacherMap =
        new Map();


    // ==============================================
    // COLLECTION
    // ==============================================

    teacherCollections.forEach(
        item => {

            const employee =
                item.employee;


            if (!employee) {

                return;

            }


            if (
                !employeeMatchesFilters(
                    employee
                )
            ) {

                return;

            }


            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            if (!code) {

                return;

            }


            if (
                !teacherMap.has(
                    code
                )
            ) {

                teacherMap.set(
                    code,
                    {

                        code:
                            getEmployeeCode(
                                employee
                            ),

                        name:
                            getEmployeeName(
                                employee
                            ) ||
                            getEmployeeCode(
                                employee
                            ),

                        region:
                            getEmployeeRegion(
                                employee
                            ),

                        state:
                            getEmployeeState(
                                employee
                            ),

                        city:
                            getEmployeeCity(
                                employee
                            ),

                        target:
                            getEmployeeTarget(
                                employee
                            ),

                        collection:
                            0

                    }
                );

            }


            teacherMap.get(
                code
            ).collection +=
                numberValue(
                    item.amount
                );

        }
    );


    // ==============================================
    // ADD TEACHERS WITH ZERO COLLECTION
    // ==============================================

    employees.forEach(
        employee => {

            if (
                !employeeMatchesFilters(
                    employee
                )
            ) {

                return;

            }


            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            if (!code) {

                return;

            }


            if (
                !teacherMap.has(
                    code
                )
            ) {

                teacherMap.set(
                    code,
                    {

                        code:
                            getEmployeeCode(
                                employee
                            ),

                        name:
                            getEmployeeName(
                                employee
                            ) ||
                            getEmployeeCode(
                                employee
                            ),

                        region:
                            getEmployeeRegion(
                                employee
                            ),

                        state:
                            getEmployeeState(
                                employee
                            ),

                        city:
                            getEmployeeCity(
                                employee
                            ),

                        target:
                            getEmployeeTarget(
                                employee
                            ),

                        collection:
                            0

                    }
                );

            }

        }
    );


    return Array.from(
        teacherMap.values()
    )
        .map(
            row => ({

                ...row,

                remaining:
                    Math.max(
                        row.target -
                        row.collection,
                        0
                    ),

                percentage:
                    getPercentage(
                        row.collection,
                        row.target
                    )

            })
        );

}



// ======================================================
// SORT
// ======================================================

function sortRows(
    rows
) {

    const metric =
        rankMetric.value;


    if (
        metric === "target"
    ) {

        rows.sort(
            (a, b) => {

                if (
                    b.target !==
                    a.target
                ) {

                    return (
                        b.target -
                        a.target
                    );

                }


                return (
                    b.collection -
                    a.collection
                );

            }
        );

    }
    else if (
        metric === "percentage"
    ) {

        rows.sort(
            (a, b) => {

                if (
                    b.percentage !==
                    a.percentage
                ) {

                    return (
                        b.percentage -
                        a.percentage
                    );

                }


                return (
                    b.collection -
                    a.collection
                );

            }
        );

    }
    else {

        rows.sort(
            (a, b) => {

                if (
                    b.collection !==
                    a.collection
                ) {

                    return (
                        b.collection -
                        a.collection
                    );

                }


                return (
                    b.percentage -
                    a.percentage
                );

            }
        );

    }


    return rows;

}



// ======================================================
// RANK LIMIT
// ======================================================

function getRankLimit() {

    if (
        rankLimit.value ===
        "custom"
    ) {

        const value =
            parseInt(
                customRank.value,
                10
            );


        if (
            Number.isFinite(value) &&
            value > 0
        ) {

            return value;

        }


        return 3;

    }


    const value =
        parseInt(
            rankLimit.value,
            10
        );


    if (
        Number.isFinite(value) &&
        value > 0
    ) {

        return value;

    }


    return 3;

}



// ======================================================
// RANK BADGE
// ======================================================

function rankBadge(
    rank
) {

    if (rank === 1) {

        return `

            <div class="rank-badge rank-one">

                <i class="fa-solid fa-trophy"></i>

                1

            </div>

        `;

    }


    if (rank === 2) {

        return `

            <div class="rank-badge rank-two">

                2

            </div>

        `;

    }


    if (rank === 3) {

        return `

            <div class="rank-badge rank-three">

                3

            </div>

        `;

    }


    return `

        <div class="rank-badge">

            ${rank}

        </div>

    `;

}



// ======================================================
// DISPLAY
//
// COLUMNS:
// Rank
// Region
// State
// City
// Teachers Name
// Collection
// ======================================================

function displayRows(
    rows
) {

    currentRows =
        rows;


    totalRanked.textContent =
        rows.length;


    resultCount.textContent =
        rows.length;


    if (!rows.length) {

        rankTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="no-data-cell"
                >

                    <i class="fa-solid fa-inbox"></i>

                    <div>
                        No ranking data found.
                    </div>

                </td>

            </tr>

        `;


        rankOneName.textContent =
            "-";

        return;

    }


    let html = "";


    rows.forEach(
        (row, index) => {

            const rank =
                index + 1;


            html += `

                <tr
                    class="${
                        rank <= 3
                            ? "top-rank-row"
                            : ""
                    }"
                >

                    <!-- RANK -->

                    <td class="rank-cell">

                        ${rankBadge(
                            rank
                        )}

                    </td>


                    <!-- REGION -->

                    <td>

                        ${escapeHTML(
                            row.region ||
                            "-"
                        )}

                    </td>


                    <!-- STATE -->

                    <td>

                        ${escapeHTML(
                            row.state ||
                            "-"
                        )}

                    </td>


                    <!-- CITY -->

                    <td>

                        ${escapeHTML(
                            row.city ||
                            "-"
                        )}

                    </td>


                    <!-- TEACHER NAME -->

                    <td>

                        <div class="name-cell">

                            <strong>

                                ${escapeHTML(
                                    row.name
                                )}

                            </strong>

                        </div>

                    </td>


                    <!-- COLLECTION -->

                    <td>

                        <div class="money-cell collection-value">

                            ${formatMoney(
                                row.collection
                            )}

                            <small>

                                ${formatUnit(
                                    row.collection
                                )}

                            </small>

                        </div>

                    </td>

                </tr>

            `;

        }
    );


    rankTableBody.innerHTML =
        html;


    rankOneName.textContent =
        rows[0]?.name ||
        "-";

}



// ======================================================
// APPLY FILTERS
// ======================================================

function applyCurrentFilters() {

    const teacherCollections =
        buildTeacherCollections();


    let rows =
        buildTeacherRows(
            teacherCollections
        );


    rows =
        sortRows(
            rows
        );


    const limit =
        getRankLimit();


    rows =
        rows.slice(
            0,
            limit
        );


    displayRows(
        rows
    );


    updateSelectionText();

}



// ======================================================
// SELECTION TEXT
// ======================================================

function updateSelectionText() {

    const metricText = {

        amount:
            "Highest Amount",

        target:
            "Target Wise",

        percentage:
            "Highest Target %"

    };


    let dateText =
        "All Time";


    if (
        fromDate.value &&
        toDate.value
    ) {

        dateText =
            fromDate.value +
            " → " +
            toDate.value;

    }
    else if (
        fromDate.value
    ) {

        dateText =
            "From " +
            fromDate.value;

    }
    else if (
        toDate.value
    ) {

        dateText =
            "Up To " +
            toDate.value;

    }


    const limit =
        getRankLimit();


    const selectedRegions =
        getSelectedValues(
            regionFilter
        );


    const selectedStates =
        getSelectedValues(
            stateFilter
        );


    let locationText =
        "";


    if (
        selectedRegions.length
    ) {

        locationText +=
            " • " +
            selectedRegions.length +
            (
                selectedRegions.length === 1
                    ? " Region Selected"
                    : " Regions Selected"
            );

    }


    if (
        selectedStates.length
    ) {

        locationText +=
            " • " +
            selectedStates.length +
            (
                selectedStates.length === 1
                    ? " State Selected"
                    : " States Selected"
            );

    }


    if (
        cityFilter.value
    ) {

        locationText +=
            " • City: " +
            cityFilter.value;

    }


    selectionText.textContent =

        "Teacher Wise" +

        " • " +

        metricText[
            rankMetric.value
        ] +

        " • Top " +

        limit +

        locationText +

        " • " +

        dateText;


    tableSubtitle.textContent =

        "Top " +

        limit +

        " • Teacher Wise • " +

        metricText[
            rankMetric.value
        ];

}



// ======================================================
// LOADING
// ======================================================

function setLoading(
    loading,
    message = "Loading..."
) {

    if (loading) {

        loadingStatus.innerHTML = `

            <i class="
                fa-solid
                fa-spinner
                fa-spin
            "></i>

            ${escapeHTML(
                message
            )}

        `;

    }
    else {

        loadingStatus.innerHTML = `

            <i class="
                fa-solid
                fa-circle-check
            "></i>

            Data Ready

        `;

    }

}



// ======================================================
// RANK LIMIT CHANGE
// ======================================================

rankLimit.addEventListener(
    "change",
    () => {

        if (
            rankLimit.value ===
            "custom"
        ) {

            customRankGroup.style.display =
                "block";

            customRank.focus();

        }
        else {

            customRankGroup.style.display =
                "none";

        }


        applyCurrentFilters();

    }
);



// ======================================================
// CUSTOM RANK CHANGE
// ======================================================

customRank.addEventListener(
    "input",
    () => {

        if (
            rankLimit.value ===
            "custom"
        ) {

            applyCurrentFilters();

        }

    }
);



// ======================================================
// APPLY
// ======================================================

applyFilter.addEventListener(
    "click",
    () => {

        if (
            fromDate.value &&
            toDate.value &&
            fromDate.value >
            toDate.value
        ) {

            alert(
                "From Date To Date se pehle honi chahiye."
            );

            return;

        }


        if (
            rankLimit.value ===
            "custom"
        ) {

            const limit =
                parseInt(
                    customRank.value,
                    10
                );


            if (
                !Number.isFinite(limit) ||
                limit < 1
            ) {

                alert(
                    "Custom Rank mein 1 ya usse zyada number enter karein."
                );

                customRank.focus();

                return;

            }

        }


        applyCurrentFilters();

    }
);



// ======================================================
// REGION CHANGE
// ======================================================

regionFilter.addEventListener(
    "change",
    () => {

        updateStateDropdown();

        updateCityDropdown();

        applyCurrentFilters();

    }
);



// ======================================================
// STATE CHANGE
// ======================================================

stateFilter.addEventListener(
    "change",
    () => {

        updateCityDropdown();

        applyCurrentFilters();

    }
);



// ======================================================
// CITY CHANGE
// ======================================================

cityFilter.addEventListener(
    "change",
    () => {

        applyCurrentFilters();

    }
);



// ======================================================
// RANK TYPE CHANGE
//
// Rank is always Teacher Wise.
// This listener is kept only for compatibility
// if the HTML still contains rankBy.
// ======================================================

if (rankBy) {

    rankBy.value =
        "teacher";


    rankBy.addEventListener(
        "change",
        () => {

            applyCurrentFilters();

        }
    );

}



// ======================================================
// METRIC CHANGE
// ======================================================

rankMetric.addEventListener(
    "change",
    () => {

        applyCurrentFilters();

    }
);



// ======================================================
// RESET
// ======================================================

resetFilter.addEventListener(
    "click",
    () => {

        // Teacher Wise ranking

        if (rankBy) {

            rankBy.value =
                "teacher";

        }


        rankMetric.value =
            "amount";


        rankLimit.value =
            "3";


        customRank.value =
            "";


        customRankGroup.style.display =
            "none";


        Array.from(
            regionFilter.options
        )
            .forEach(
                option => {

                    option.selected =
                        false;

                }
            );


        Array.from(
            stateFilter.options
        )
            .forEach(
                option => {

                    option.selected =
                        false;

                }
            );


        cityFilter.value =
            "";


        fromDate.value =
            "";

        toDate.value =
            "";


        updateStateDropdown();

        updateCityDropdown();

        applyCurrentFilters();

    }
);



// ======================================================
// QUICK DATE
// ======================================================

document
    .querySelectorAll(
        ".quick-date-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    setQuickDate(
                        button.dataset.range
                    );

                }
            );

        }
    );



// ======================================================
// QUICK DATE FUNCTION
// ======================================================

function setQuickDate(
    range
) {

    const today =
        new Date();


    const todayString =
        formatDateForInput(
            today
        );


    if (
        range === "today"
    ) {

        fromDate.value =
            todayString;

        toDate.value =
            todayString;

    }


    if (
        range === "week"
    ) {

        const date =
            new Date(
                today
            );


        const day =
            date.getDay();


        const difference =
            day === 0
                ? 6
                : day - 1;


        date.setDate(
            date.getDate() -
            difference
        );


        fromDate.value =
            formatDateForInput(
                date
            );

        toDate.value =
            todayString;

    }


    if (
        range === "month"
    ) {

        const date =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );


        fromDate.value =
            formatDateForInput(
                date
            );

        toDate.value =
            todayString;

    }


    if (
        range === "all"
    ) {

        fromDate.value =
            "";

        toDate.value =
            "";

    }


    applyCurrentFilters();

}



// ======================================================
// REFRESH
// ======================================================

refreshBtn.addEventListener(
    "click",
    async () => {

        await loadData();

    }
);



// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener(
    "click",
    event => {

        event.preventDefault();


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



// ======================================================
// INITIAL LOAD
// ======================================================

if (rankBy) {

    rankBy.value =
        "teacher";

}


rankLimit.value =
    "3";


loadData();
