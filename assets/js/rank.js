// ======================================================
// TELETHON
// RANK PAGE
//
// RANKING = TEACHER WISE
//
// TABLE:
// Rank | Region | State | City | Teachers Name | Collection
//
// DATA SOURCE:
// employees
// daily_entry
// teacher_entries
//
// SAME TEACHER + SAME DATE = SUM
//
// 1 UNIT = ₹7,000
// ======================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// CONSTANTS
// ======================================================

const UNIT_AMOUNT = 7000;

const EMPLOYEES_COLLECTION = "employees";
const DAILY_ENTRY_COLLECTION = "daily_entry";
const TEACHER_ENTRIES_COLLECTION = "teacher_entries";


// ======================================================
// ADMIN CHECK
// ======================================================

const userRole =
    localStorage.getItem("userRole") || "";

if (userRole !== "admin") {
    window.location.href = "index.html";
}


// ======================================================
// DOM
// ======================================================

const rankBy =
    document.getElementById("rankBy");

const rankMetric =
    document.getElementById("rankMetric");

const rankLimit =
    document.getElementById("rankLimit");

const customRank =
    document.getElementById("customRank");

const customRankGroup =
    document.getElementById("customRankGroup");

const regionFilter =
    document.getElementById("regionFilter");

const stateFilter =
    document.getElementById("stateFilter");

const cityFilter =
    document.getElementById("cityFilter");

const fromDate =
    document.getElementById("fromDate");

const toDate =
    document.getElementById("toDate");

const applyFilter =
    document.getElementById("applyFilter");

const resetFilter =
    document.getElementById("resetFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const rankTableBody =
    document.getElementById("rankTableBody");

const totalRanked =
    document.getElementById("totalRanked");

const rankOneName =
    document.getElementById("rankOneName");

const selectionText =
    document.getElementById("selectionText");

const loadingStatus =
    document.getElementById("loadingStatus");

const resultCount =
    document.getElementById("resultCount");

const tableSubtitle =
    document.getElementById("tableSubtitle");


// ======================================================
// DATA
// ======================================================

let employees = [];
let dailyEntries = [];
let teacherEntries = [];
let allEntries = [];


// ======================================================
// UTILITY
// ======================================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function numberValue(value) {

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {

        const cleaned =
            value
                .replace(/₹/g, "")
                .replace(/,/g, "")
                .replace(/units?/gi, "")
                .trim();

        const num = Number(cleaned);

        return Number.isFinite(num) ? num : 0;
    }

    return 0;
}


function formatMoney(value) {

    return "₹ " +
        numberValue(value).toLocaleString("en-IN", {
            maximumFractionDigits: 0
        });

}


function formatUnit(value) {

    const units =
        numberValue(value) / UNIT_AMOUNT;

    return units.toLocaleString("en-IN", {
        maximumFractionDigits: 2
    }) + " Unit";
}


function getPercentage(collectionAmount, target) {

    const c = numberValue(collectionAmount);
    const t = numberValue(target);

    if (t <= 0) {
        return 0;
    }

    return (c / t) * 100;
}


// ======================================================
// EMPLOYEE HELPERS
// ======================================================

function getEmployeeCode(employee) {

    return String(
        employee?.employeeCode ??
        employee?.employee_code ??
        employee?.empCode ??
        employee?.emp_code ??
        employee?.code ??
        employee?.id ??
        ""
    ).trim();

}


function getEmployeeName(employee) {

    const directName =
        employee?.name ??
        employee?.teacherName ??
        employee?.teacher_name ??
        employee?.fullName ??
        employee?.full_name ??
        employee?.displayName ??
        employee?.display_name ??
        employee?.employeeName ??
        employee?.employee_name;

    if (directName) {
        return String(directName).trim();
    }

    const first =
        employee?.firstName ??
        employee?.first_name ??
        "";

    const last =
        employee?.lastName ??
        employee?.last_name ??
        "";

    const combined =
        `${first} ${last}`.trim();

    return combined || "Unknown Teacher";
}


function getEmployeeRegion(employee) {

    return String(
        employee?.region ??
        employee?.regionName ??
        employee?.region_name ??
        employee?.assignedRegion ??
        employee?.assigned_region ??
        ""
    ).trim();

}


function getEmployeeState(employee) {

    return String(
        employee?.state ??
        employee?.stateName ??
        employee?.state_name ??
        ""
    ).trim();

}


function getEmployeeCity(employee) {

    return String(
        employee?.city ??
        employee?.cityName ??
        employee?.city_name ??
        ""
    ).trim();

}


function getEmployeeTarget(employee) {

    return numberValue(
        employee?.target ??
        employee?.targetAmount ??
        employee?.target_amount ??
        employee?.monthlyTarget ??
        employee?.monthly_target ??
        0
    );

}


// ======================================================
// ENTRY HELPERS
// ======================================================

function getEntryEmployeeCode(entry) {

    return String(
        entry?.employeeCode ??
        entry?.employee_code ??
        entry?.empCode ??
        entry?.emp_code ??
        entry?.employeeId ??
        entry?.employee_id ??
        entry?.code ??
        ""
    ).trim();

}


function getEntryAmount(entry) {

    return numberValue(
        entry?.amount ??
        entry?.collection ??
        entry?.collectionAmount ??
        entry?.collection_amount ??
        entry?.totalAmount ??
        entry?.total_amount ??
        0
    );

}


function getEntryDate(entry) {

    const value =
        entry?.date ??
        entry?.entryDate ??
        entry?.entry_date ??
        entry?.collectionDate ??
        entry?.collection_date ??
        "";

    if (!value) {
        return "";
    }

    if (
        typeof value === "object" &&
        value?.toDate
    ) {
        return formatDateForInput(
            value.toDate()
        );
    }

    if (
        typeof value === "object" &&
        value?.seconds
    ) {
        return formatDateForInput(
            new Date(value.seconds * 1000)
        );
    }

    return normalizeDate(value);
}


function formatDateForInput(date) {

    if (!(date instanceof Date) ||
        Number.isNaN(date.getTime())) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function normalizeDate(value) {

    if (!value) {
        return "";
    }

    const text =
        String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    const date =
        new Date(text);

    if (!Number.isNaN(date.getTime())) {
        return formatDateForInput(date);
    }

    return text;
}


// ======================================================
// LOAD COLLECTION
// ======================================================

async function loadCollection(name) {

    const snapshot =
        await getDocs(
            collection(db, name)
        );

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

}


// ======================================================
// LOAD ALL DATA
// ======================================================

async function loadData() {

    try {

        loadingStatus.textContent =
            "Loading data...";

        rankTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    Loading ranking...
                </td>
            </tr>
        `;

        const [
            employeeData,
            dailyData,
            teacherData
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

        employees = employeeData;
        dailyEntries = dailyData;
        teacherEntries = teacherData;

        allEntries = [
            ...dailyEntries,
            ...teacherEntries
        ];

        loadRegionDropdown();

        updateStateDropdown();

        updateCityDropdown();

        applyCurrentFilters();

        loadingStatus.textContent =
            "Data loaded";

    } catch (error) {

        console.error(
            "Rank loading error:",
            error
        );

        loadingStatus.textContent =
            "Error loading data";

        rankTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-cell">
                    Unable to load ranking data.
                </td>
            </tr>
        `;
    }

}


// ======================================================
// REGION DROPDOWN
// ======================================================

function loadRegionDropdown() {

    if (!regionFilter) {
        return;
    }

    const regions =
        new Map();

    employees.forEach(employee => {

        const region =
            getEmployeeRegion(employee);

        if (!region) {
            return;
        }

        const key =
            normalize(region);

        if (!regions.has(key)) {
            regions.set(key, region);
        }

    });

    const selected =
        getSelectedValues(regionFilter);

    regionFilter.innerHTML = "";

    Array.from(regions.values())
        .sort((a, b) =>
            a.localeCompare(b)
        )
        .forEach(region => {

            const option =
                document.createElement("option");

            option.value = region;
            option.textContent = region;

            if (
                selected.some(
                    value =>
                        normalize(value) ===
                        normalize(region)
                )
            ) {
                option.selected = true;
            }

            regionFilter.appendChild(option);
        });

}


// ======================================================
// STATE DROPDOWN
// ======================================================

function updateStateDropdown() {

    if (!stateFilter) {
        return;
    }

    const selectedRegions =
        getSelectedValues(regionFilter);

    const oldSelected =
        getSelectedValues(stateFilter);

    const states =
        new Map();

    employees.forEach(employee => {

        const region =
            getEmployeeRegion(employee);

        if (
            selectedRegions.length &&
            !selectedRegions.some(
                value =>
                    normalize(value) ===
                    normalize(region)
            )
        ) {
            return;
        }

        const state =
            getEmployeeState(employee);

        if (!state) {
            return;
        }

        const key =
            normalize(state);

        if (!states.has(key)) {
            states.set(key, state);
        }

    });

    stateFilter.innerHTML = "";

    Array.from(states.values())
        .sort((a, b) =>
            a.localeCompare(b)
        )
        .forEach(state => {

            const option =
                document.createElement("option");

            option.value = state;
            option.textContent = state;

            if (
                oldSelected.some(
                    value =>
                        normalize(value) ===
                        normalize(state)
                )
            ) {
                option.selected = true;
            }

            stateFilter.appendChild(option);

        });

}


// ======================================================
// CITY DROPDOWN
// ======================================================

function updateCityDropdown() {

    if (!cityFilter) {
        return;
    }

    const selectedRegions =
        getSelectedValues(regionFilter);

    const selectedStates =
        getSelectedValues(stateFilter);

    const oldCity =
        cityFilter.value;

    const cities =
        new Map();

    employees.forEach(employee => {

        const region =
            getEmployeeRegion(employee);

        const state =
            getEmployeeState(employee);

        if (
            selectedRegions.length &&
            !selectedRegions.some(
                value =>
                    normalize(value) ===
                    normalize(region)
            )
        ) {
            return;
        }

        if (
            selectedStates.length &&
            !selectedStates.some(
                value =>
                    normalize(value) ===
                    normalize(state)
            )
        ) {
            return;
        }

        const city =
            getEmployeeCity(employee);

        if (!city) {
            return;
        }

        const key =
            normalize(city);

        if (!cities.has(key)) {
            cities.set(key, city);
        }

    });

    cityFilter.innerHTML =
        `<option value="">All Cities</option>`;

    Array.from(cities.values())
        .sort((a, b) =>
            a.localeCompare(b)
        )
        .forEach(city => {

            const option =
                document.createElement("option");

            option.value = city;
            option.textContent = city;

            if (
                normalize(oldCity) ===
                normalize(city)
            ) {
                option.selected = true;
            }

            cityFilter.appendChild(option);

        });

}


// ======================================================
// GET SELECTED MULTI VALUES
// ======================================================

function getSelectedValues(select) {

    if (!select) {
        return [];
    }

    return Array.from(
        select.selectedOptions || []
    )
        .map(option =>
            String(option.value).trim()
        )
        .filter(Boolean);

}


// ======================================================
// DATE FILTER
// ======================================================

function entryInDateRange(entry) {

    const date =
        getEntryDate(entry);

    if (!date) {
        return false;
    }

    const from =
        fromDate?.value || "";

    const to =
        toDate?.value || "";

    if (from && date < from) {
        return false;
    }

    if (to && date > to) {
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

    employees.forEach(employee => {

        const code =
            getEmployeeCode(employee);

        if (!code) {
            return;
        }

        map.set(
            normalize(code),
            employee
        );

    });

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

    allEntries.forEach(entry => {

        if (!entryInDateRange(entry)) {
            return;
        }

        const code =
            getEntryEmployeeCode(entry);

        if (!code) {
            return;
        }

        const date =
            getEntryDate(entry);

        if (!date) {
            return;
        }

        const amount =
            getEntryAmount(entry);

        if (amount <= 0) {
            return;
        }

        const key =
            normalize(code) +
            "_" +
            date;

        if (!teacherDateMap.has(key)) {

            teacherDateMap.set(key, {
                code: code,
                date: date,
                amount: 0
            });

        }

        teacherDateMap.get(key).amount +=
            amount;

    });

    return Array.from(
        teacherDateMap.values()
    );
}


// ======================================================
// EMPLOYEE FILTER
// ======================================================

function employeeMatchesFilters(employee) {

    const selectedRegions =
        getSelectedValues(regionFilter);

    const selectedStates =
        getSelectedValues(stateFilter);

    const selectedCity =
        cityFilter?.value || "";

    const region =
        getEmployeeRegion(employee);

    const state =
        getEmployeeState(employee);

    const city =
        getEmployeeCity(employee);


    if (
        selectedRegions.length &&
        !selectedRegions.some(
            value =>
                normalize(value) ===
                normalize(region)
        )
    ) {
        return false;
    }


    if (
        selectedStates.length &&
        !selectedStates.some(
            value =>
                normalize(value) ===
                normalize(state)
        )
    ) {
        return false;
    }


    if (
        selectedCity &&
        normalize(selectedCity) !==
        normalize(city)
    ) {
        return false;
    }


    return true;
}


// ======================================================
// BUILD TEACHER ROWS
//
// IMPORTANT:
// EVERY ROW = ONE TEACHER
//
// NO REGION/STATE/CITY GROUPING
// ======================================================

function buildTeacherRows(
    teacherCollections
) {

    const employeeMap =
        buildEmployeeMap();

    const teacherMap =
        new Map();


    // --------------------------------------------------
    // FIRST ADD ALL FILTERED TEACHERS
    // --------------------------------------------------

    employees.forEach(employee => {

        if (
            !employeeMatchesFilters(
                employee
            )
        ) {
            return;
        }

        const code =
            getEmployeeCode(employee);

        if (!code) {
            return;
        }

        const key =
            normalize(code);

        if (!teacherMap.has(key)) {

            teacherMap.set(key, {

                code: code,

                name:
                    getEmployeeName(
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

                collection: 0

            });

        }

    });


    // --------------------------------------------------
    // ADD COLLECTION TO EACH TEACHER
    // --------------------------------------------------

    teacherCollections.forEach(item => {

        const key =
            normalize(item.code);

        const employee =
            employeeMap.get(key);

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

        if (!teacherMap.has(key)) {

            teacherMap.set(key, {

                code:
                    getEmployeeCode(
                        employee
                    ),

                name:
                    getEmployeeName(
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

                collection: 0

            });

        }

        teacherMap.get(key).collection +=
            numberValue(item.amount);

    });


    // --------------------------------------------------
    // FINAL ROWS
    // --------------------------------------------------

    return Array.from(
        teacherMap.values()
    ).map(row => ({

        ...row,

        remaining:
            Math.max(
                numberValue(row.target) -
                numberValue(row.collection),
                0
            ),

        percentage:
            getPercentage(
                row.collection,
                row.target
            )

    }));

}


// ======================================================
// SORT
//
// Highest Amount
// Target Wise
// Highest Target %
//
// These are only sorting metrics.
// They are NOT displayed as columns.
// ======================================================

function sortRows(rows) {

    const metric =
        rankMetric?.value ||
        "amount";

    return rows.sort(
        (a, b) => {

            if (metric === "target") {

                return (
                    numberValue(b.target) -
                    numberValue(a.target)
                );

            }

            if (
                metric === "percentage"
            ) {

                return (
                    numberValue(b.percentage) -
                    numberValue(a.percentage)
                );

            }

            return (
                numberValue(b.collection) -
                numberValue(a.collection)
            );

        }
    );

}


// ======================================================
// RANK LIMIT
// ======================================================

function getRankLimit() {

    const value =
        rankLimit?.value || "3";

    if (value === "custom") {

        const custom =
            parseInt(
                customRank?.value || "3",
                10
            );

        return Math.max(
            1,
            custom || 3
        );
    }

    return Math.max(
        1,
        parseInt(value, 10) || 3
    );

}


// ======================================================
// RANK BADGE
// ======================================================

function rankBadge(rank) {

    let className =
        "rank-badge";

    let icon =
        rank;

    if (rank === 1) {

        className +=
            " rank-one";

        icon = "🏆";

    } else if (rank === 2) {

        className +=
            " rank-two";

    } else if (rank === 3) {

        className +=
            " rank-three";

    }

    return `
        <span class="${className}">
            ${icon}
        </span>
    `;

}


// ======================================================
// DISPLAY ROWS
//
// FINAL COLUMNS:
//
// 1. Rank
// 2. Region
// 3. State
// 4. City
// 5. Teachers Name
// 6. Collection
//
// ======================================================

function displayRows(rows) {

    if (!rankTableBody) {
        return;
    }


    if (!rows.length) {

        rankTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="no-data-cell"
                >
                    <i class="fa-solid fa-ranking-star"></i>

                    <div>
                        No teacher ranking data found.
                    </div>
                </td>
            </tr>
        `;

        if (totalRanked) {
            totalRanked.textContent = "0";
        }

        if (rankOneName) {
            rankOneName.textContent = "—";
        }

        if (resultCount) {
            resultCount.textContent =
                "0 Results";
        }

        return;
    }


    rankTableBody.innerHTML =
        rows.map((row, index) => {

            const rank =
                index + 1;

            return `
                <tr
                    class="${rank <= 3
                        ? "top-rank-row"
                        : ""}"
                >

                    <!-- RANK -->
                    <td class="rank-cell">
                        ${rankBadge(rank)}
                    </td>


                    <!-- REGION -->
                    <td class="region-column">
                        ${escapeHTML(
                            row.region || "—"
                        )}
                    </td>


                    <!-- STATE -->
                    <td class="state-column">
                        ${escapeHTML(
                            row.state || "—"
                        )}
                    </td>


                    <!-- CITY -->
                    <td class="city-column">
                        ${escapeHTML(
                            row.city || "—"
                        )}
                    </td>


                    <!-- TEACHER NAME -->
                    <td class="teacher-column">

                        <div class="name-cell">

                            <strong>
                                ${escapeHTML(
                                    row.name ||
                                    "Unknown Teacher"
                                )}
                            </strong>

                            ${
                                row.code
                                    ? `
                                    <small>
                                        ${escapeHTML(
                                            row.code
                                        )}
                                    </small>
                                    `
                                    : ""
                            }

                        </div>

                    </td>


                    <!-- COLLECTION -->
                    <td class="collection-column">

                        <div class="money-cell">

                            <span class="collection-value">
                                ${formatMoney(
                                    row.collection
                                )}
                            </span>

                            <small>
                                ${formatUnit(
                                    row.collection
                                )}
                            </small>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");


    if (totalRanked) {

        totalRanked.textContent =
            rows.length;

    }


    if (rankOneName) {

        rankOneName.textContent =
            rows[0]?.name ||
            "—";

    }


    if (resultCount) {

        resultCount.textContent =
            `${rows.length} Results`;

    }

}


// ======================================================
// SELECTION TEXT
// ======================================================

function updateSelectionText() {

    const limit =
        getRankLimit();

    const metric =
        rankMetric?.value ||
        "amount";


    let metricText =
        "Highest Amount";

    if (metric === "target") {
        metricText =
            "Highest Target";
    }

    if (metric === "percentage") {
        metricText =
            "Highest Target %";
    }


    let locationText =
        "All Locations";


    const selectedRegions =
        getSelectedValues(
            regionFilter
        );

    const selectedStates =
        getSelectedValues(
            stateFilter
        );

    const selectedCity =
        cityFilter?.value || "";


    if (selectedCity) {

        locationText =
            selectedCity;

    } else if (
        selectedStates.length
    ) {

        locationText =
            `${selectedStates.length} State${
                selectedStates.length > 1
                    ? "s"
                    : ""
            }`;

    } else if (
        selectedRegions.length
    ) {

        locationText =
            `${selectedRegions.length} Region${
                selectedRegions.length > 1
                    ? "s"
                    : ""
            }`;

    }


    let dateText =
        "All Time";


    if (
        fromDate?.value &&
        toDate?.value
    ) {

        dateText =
            `${fromDate.value} to ${toDate.value}`;

    } else if (
        fromDate?.value
    ) {

        dateText =
            `From ${fromDate.value}`;

    } else if (
        toDate?.value
    ) {

        dateText =
            `Up to ${toDate.value}`;

    }


    if (selectionText) {

        selectionText.textContent =
            `Teacher Wise • ${metricText} • Top ${limit} • ${locationText} • ${dateText}`;

    }


    if (tableSubtitle) {

        tableSubtitle.textContent =
            `Top ${limit} • Teacher Wise • ${metricText}`;

    }

}


// ======================================================
// APPLY FILTERS
// ======================================================

function applyCurrentFilters() {

    try {

        const teacherCollections =
            buildTeacherCollections();


        let rows =
            buildTeacherRows(
                teacherCollections
            );


        rows =
            sortRows(rows);


        const limit =
            getRankLimit();


        rows =
            rows.slice(
                0,
                limit
            );


        displayRows(rows);

        updateSelectionText();


    } catch (error) {

        console.error(
            "Ranking error:",
            error
        );

        rankTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="error-cell"
                >
                    Error creating ranking.
                </td>
            </tr>
        `;

    }

}


// ======================================================
// RANK LIMIT CHANGE
// ======================================================

if (rankLimit) {

    rankLimit.addEventListener(
        "change",
        () => {

            if (
                customRankGroup
            ) {

                customRankGroup.style.display =
                    rankLimit.value ===
                    "custom"
                        ? "flex"
                        : "none";

            }

            applyCurrentFilters();

        }
    );

}


// ======================================================
// RANK BY
// ======================================================
//
// Teacher Wise ONLY
//
// If old HTML contains Rank By,
// it will automatically stay Teacher Wise.
// ======================================================

if (rankBy) {

    rankBy.value = "teacher";

    rankBy.addEventListener(
        "change",
        () => {

            rankBy.value = "teacher";

            applyCurrentFilters();

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

            updateStateDropdown();

            updateCityDropdown();

            applyCurrentFilters();

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

            updateCityDropdown();

            applyCurrentFilters();

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

            applyCurrentFilters();

        }
    );

}


// ======================================================
// RANK METRIC CHANGE
// ======================================================

if (rankMetric) {

    rankMetric.addEventListener(
        "change",
        () => {

            applyCurrentFilters();

        }
    );

}


// ======================================================
// APPLY BUTTON
// ======================================================

if (applyFilter) {

    applyFilter.addEventListener(
        "click",
        () => {

            applyCurrentFilters();

        }
    );

}


// ======================================================
// RESET
// ======================================================

if (resetFilter) {

    resetFilter.addEventListener(
        "click",
        () => {

            if (rankBy) {
                rankBy.value =
                    "teacher";
            }

            if (rankMetric) {
                rankMetric.value =
                    "amount";
            }

            if (rankLimit) {
                rankLimit.value =
                    "3";
            }

            if (customRank) {
                customRank.value =
                    "3";
            }

            if (customRankGroup) {
                customRankGroup.style.display =
                    "none";
            }

            if (regionFilter) {

                Array.from(
                    regionFilter.options
                ).forEach(
                    option =>
                        option.selected =
                            false
                );

            }

            if (stateFilter) {

                Array.from(
                    stateFilter.options
                ).forEach(
                    option =>
                        option.selected =
                            false
                );

            }

            if (cityFilter) {

                cityFilter.value =
                    "";

            }

            if (fromDate) {
                fromDate.value =
                    "";
            }

            if (toDate) {
                toDate.value =
                    "";
            }


            updateStateDropdown();

            updateCityDropdown();

            applyCurrentFilters();

        }
    );

}


// ======================================================
// REFRESH
// ======================================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled =
                true;

            try {

                await loadData();

            } finally {

                refreshBtn.disabled =
                    false;

            }

        }
    );

}


// ======================================================
// QUICK DATE BUTTONS
// ======================================================

document
    .querySelectorAll(
        ".quick-date-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const type =
                    button.dataset.range;

                const today =
                    new Date();

                let from =
                    new Date(today);

                let to =
                    new Date(today);


                if (type === "today") {

                    from =
                        new Date(today);

                    to =
                        new Date(today);

                }


                else if (
                    type === "yesterday"
                ) {

                    from.setDate(
                        today.getDate() - 1
                    );

                    to =
                        new Date(from);

                }


                else if (
                    type === "7days"
                ) {

                    from.setDate(
                        today.getDate() - 6
                    );

                }


                else if (
                    type === "30days"
                ) {

                    from.setDate(
                        today.getDate() - 29
                    );

                }


                else if (
                    type === "thismonth"
                ) {

                    from =
                        new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            1
                        );

                }


                else if (
                    type === "lastmonth"
                ) {

                    from =
                        new Date(
                            today.getFullYear(),
                            today.getMonth() - 1,
                            1
                        );

                    to =
                        new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            0
                        );

                }


                if (fromDate) {

                    fromDate.value =
                        formatDateForInput(
                            from
                        );

                }


                if (toDate) {

                    toDate.value =
                        formatDateForInput(
                            to
                        );

                }


                applyCurrentFilters();

            }
        );

    });


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.clear();

            window.location.href =
                "index.html";

        }
    );

}


// ======================================================
// INITIAL LOAD
// ======================================================

if (rankBy) {
    rankBy.value = "teacher";
}

if (rankMetric) {
    rankMetric.value = "amount";
}

if (rankLimit) {
    rankLimit.value = "3";
}

if (customRank) {
    customRank.value = "3";
}

if (customRankGroup) {
    customRankGroup.style.display =
        "none";
}

loadData();
