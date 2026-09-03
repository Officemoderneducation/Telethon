/* =====================================================
   TELETHON RANK PAGE
   TEACHER WISE RANKING
===================================================== */

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* =====================================================
   GLOBAL DATA
===================================================== */

let employees = [];
let dailyEntries = [];
let teacherEntries = [];

let currentRows = [];



/* =====================================================
   DOM ELEMENTS
===================================================== */

const rankingMetric =
    document.getElementById("rankingMetric");

const rankBy =
    document.getElementById("rankBy");

const rankLimit =
    document.getElementById("rankLimit");

const customLimit =
    document.getElementById("customLimit");

const customLimitGroup =
    document.getElementById("customLimitGroup");

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

const applyFilterBtn =
    document.getElementById("applyFilterBtn");

const resetFilterBtn =
    document.getElementById("resetFilterBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const rankTableBody =
    document.getElementById("rankTableBody");

const resultCount =
    document.getElementById("resultCount");

const totalRanked =
    document.getElementById("totalRanked");

const rankOneName =
    document.getElementById("rankOneName");

const selectionText =
    document.getElementById("selectionText");

const loadingStatus =
    document.getElementById("loadingStatus");

const captureFilterText =
    document.getElementById("captureFilterText");

const downloadImageBtn =
    document.getElementById("downloadImageBtn");

const downloadCsvBtn =
    document.getElementById("downloadCsvBtn");



/* =====================================================
   ADMIN CHECK
===================================================== */

const userRole =
    localStorage.getItem("userRole");

if (userRole !== "admin") {

    window.location.href = "index.html";

}



/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    if (rankBy) {
        rankBy.value = "teacher";
    }

    setupEvents();

    await loadAllData();

});



/* =====================================================
   SETUP EVENTS
===================================================== */

function setupEvents() {


    /* -----------------------------------------------
       APPLY FILTER
    ------------------------------------------------ */

    if (applyFilterBtn) {

        applyFilterBtn.addEventListener(
            "click",
            () => {
                applyCurrentFilters();
            }
        );

    }



    /* -----------------------------------------------
       RESET FILTER
    ------------------------------------------------ */

    if (resetFilterBtn) {

        resetFilterBtn.addEventListener(
            "click",
            resetFilters
        );

    }



    /* -----------------------------------------------
       REFRESH
    ------------------------------------------------ */

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async () => {

                refreshBtn.disabled = true;

                await loadAllData();

                refreshBtn.disabled = false;

            }
        );

    }



    /* -----------------------------------------------
       LOGOUT
    ------------------------------------------------ */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            () => {

                localStorage.removeItem("userRole");

                window.location.href =
                    "index.html";

            }
        );

    }



    /* -----------------------------------------------
       RANK LIMIT
    ------------------------------------------------ */

    if (rankLimit) {

        rankLimit.addEventListener(
            "change",
            () => {

                if (
                    rankLimit.value === "custom"
                ) {

                    customLimitGroup.style.display =
                        "block";

                } else {

                    customLimitGroup.style.display =
                        "none";

                }

            }
        );

    }



    /* -----------------------------------------------
       REGION
    ------------------------------------------------ */

    if (regionFilter) {

        regionFilter.addEventListener(
            "change",
            () => {

                updateStateDropdown();

                updateCityDropdown();

            }
        );

    }



    /* -----------------------------------------------
       STATE
    ------------------------------------------------ */

    if (stateFilter) {

        stateFilter.addEventListener(
            "change",
            () => {

                updateCityDropdown();

            }
        );

    }



    /* -----------------------------------------------
       QUICK DATE BUTTONS
    ------------------------------------------------ */

    document
        .querySelectorAll(".quick-date-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const type =
                        button.dataset.range;

                    const today =
                        new Date();

                    let from = "";
                    let to = "";


                    /* TODAY */

                    if (type === "today") {

                        from =
                            formatDateForInput(today);

                        to =
                            formatDateForInput(today);

                    }


                    /* THIS WEEK */

                    else if (type === "week") {

                        const start =
                            new Date(today);

                        const day =
                            start.getDay();

                        const diff =
                            day === 0
                                ? 6
                                : day - 1;

                        start.setDate(
                            start.getDate() - diff
                        );

                        from =
                            formatDateForInput(start);

                        to =
                            formatDateForInput(today);

                    }


                    /* THIS MONTH */

                    else if (type === "month") {

                        const start =
                            new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                1
                            );

                        from =
                            formatDateForInput(start);

                        to =
                            formatDateForInput(today);

                    }


                    /* ALL TIME */

                    else if (type === "all") {

                        from = "";
                        to = "";

                    }


                    fromDate.value = from;
                    toDate.value = to;

                    applyCurrentFilters();

                }
            );

        });



    /* -----------------------------------------------
       RANK BY
    ------------------------------------------------ */

    if (rankBy) {

        rankBy.addEventListener(
            "change",
            () => {

                rankBy.value = "teacher";

                applyCurrentFilters();

            }
        );

    }



    /* -----------------------------------------------
       DOWNLOAD IMAGE
    ------------------------------------------------ */

    if (downloadImageBtn) {

        downloadImageBtn.addEventListener(
            "click",
            downloadRankingImage
        );

    }



    /* -----------------------------------------------
       DOWNLOAD CSV
    ------------------------------------------------ */

    if (downloadCsvBtn) {

        downloadCsvBtn.addEventListener(
            "click",
            downloadRankingCSV
        );

    }

}



/* =====================================================
   LOAD ALL DATA
===================================================== */

async function loadAllData() {

    try {

        loadingStatus.textContent =
            "Loading data...";

        rankTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Loading Ranking...
                </td>
            </tr>
        `;


        /* EMPLOYEES */

        const employeeSnapshot =
            await getDocs(
                collection(db, "employees")
            );

        employees =
            employeeSnapshot.docs.map(
                doc => ({
                    id: doc.id,
                    ...doc.data()
                })
            );


        /* DAILY ENTRIES */

        const dailySnapshot =
            await getDocs(
                collection(db, "daily_entry")
            );

        dailyEntries =
            dailySnapshot.docs.map(
                doc => ({
                    id: doc.id,
                    ...doc.data()
                })
            );


        /* TEACHER ENTRIES */

        const teacherSnapshot =
            await getDocs(
                collection(db, "teacher_entries")
            );

        teacherEntries =
            teacherSnapshot.docs.map(
                doc => ({
                    id: doc.id,
                    ...doc.data()
                })
            );


        loadRegionDropdown();

        updateStateDropdown();

        updateCityDropdown();

        applyCurrentFilters();


        loadingStatus.textContent =
            "Data loaded successfully";


    } catch (error) {

        console.error(
            "Rank data loading error:",
            error
        );

        loadingStatus.textContent =
            "Error loading data";

        rankTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-cell">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    Unable to load ranking data.
                </td>
            </tr>
        `;

    }

}



/* =====================================================
   REGION DROPDOWN
===================================================== */

function loadRegionDropdown() {

    if (!regionFilter) return;

    const regions =
        [...new Set(
            employees
                .map(emp => emp.region)
                .filter(Boolean)
        )]
        .sort();

    regionFilter.innerHTML = "";

    regions.forEach(region => {

        const option =
            document.createElement("option");

        option.value = region;

        option.textContent = region;

        regionFilter.appendChild(option);

    });

}



/* =====================================================
   GET SELECTED VALUES
===================================================== */

function getSelectedValues(select) {

    if (!select) return [];

    return [...select.selectedOptions]
        .map(option => option.value)
        .filter(Boolean);

}



/* =====================================================
   UPDATE STATE DROPDOWN
===================================================== */

function updateStateDropdown() {

    if (!stateFilter) return;

    const selectedRegions =
        getSelectedValues(regionFilter);

    let filteredEmployees =
        employees;

    if (selectedRegions.length > 0) {

        filteredEmployees =
            employees.filter(
                employee =>
                    selectedRegions.includes(
                        employee.region
                    )
            );

    }


    const states =
        [...new Set(
            filteredEmployees
                .map(emp => emp.state)
                .filter(Boolean)
        )]
        .sort();


    stateFilter.innerHTML = "";

    states.forEach(state => {

        const option =
            document.createElement("option");

        option.value = state;

        option.textContent = state;

        stateFilter.appendChild(option);

    });

}



/* =====================================================
   UPDATE CITY DROPDOWN
===================================================== */

function updateCityDropdown() {

    if (!cityFilter) return;

    const selectedRegions =
        getSelectedValues(regionFilter);

    const selectedStates =
        getSelectedValues(stateFilter);

    let filteredEmployees =
        employees;


    if (selectedRegions.length > 0) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    selectedRegions.includes(
                        employee.region
                    )
            );

    }


    if (selectedStates.length > 0) {

        filteredEmployees =
            filteredEmployees.filter(
                employee =>
                    selectedStates.includes(
                        employee.state
                    )
            );

    }


    const cities =
        [...new Set(
            filteredEmployees
                .map(emp => emp.city)
                .filter(Boolean)
        )]
        .sort();


    cityFilter.innerHTML = `
        <option value="">
            All Cities
        </option>
    `;


    cities.forEach(city => {

        const option =
            document.createElement("option");

        option.value = city;

        option.textContent = city;

        cityFilter.appendChild(option);

    });

}



/* =====================================================
   APPLY CURRENT FILTERS
===================================================== */

function applyCurrentFilters() {

    let rows =
        buildTeacherRows();


    rows =
        sortRows(rows);


    const limit =
        getRankLimit();


    rows =
        rows.slice(0, limit);


    currentRows =
        rows;


    displayRows(rows);


    updateSummary(rows);


    updateSelectionText();

}



/* =====================================================
   BUILD TEACHER COLLECTIONS
===================================================== */

function buildTeacherCollections() {

    const map =
        new Map();


    /* -----------------------------------------------
       DAILY ENTRY
    ------------------------------------------------ */

    dailyEntries.forEach(entry => {

        const employeeCode =
            getEmployeeCode(entry);

        if (!employeeCode) return;


        const date =
            getEntryDate(entry);

        if (!date) return;


        const amount =
            getAmount(entry);


        const key =
            `${employeeCode}__${date}`;


        if (!map.has(key)) {

            map.set(key, {
                employeeCode,
                date,
                amount: 0
            });

        }


        map.get(key).amount += amount;

    });



    /* -----------------------------------------------
       TEACHER ENTRY
    ------------------------------------------------ */

    teacherEntries.forEach(entry => {

        const employeeCode =
            getEmployeeCode(entry);

        if (!employeeCode) return;


        const date =
            getEntryDate(entry);

        if (!date) return;


        const amount =
            getAmount(entry);


        const key =
            `${employeeCode}__${date}`;


        if (!map.has(key)) {

            map.set(key, {
                employeeCode,
                date,
                amount: 0
            });

        }


        map.get(key).amount += amount;

    });


    return [...map.values()];

}



/* =====================================================
   BUILD TEACHER ROWS
===================================================== */

function buildTeacherRows() {

    const collections =
        buildTeacherCollections();


    const selectedRegions =
        getSelectedValues(regionFilter);

    const selectedStates =
        getSelectedValues(stateFilter);

    const selectedCity =
        cityFilter
            ? cityFilter.value
            : "";


    const from =
        fromDate
            ? fromDate.value
            : "";

    const to =
        toDate
            ? toDate.value
            : "";


    const map =
        new Map();


    /* -----------------------------------------------
       EMPLOYEES
    ------------------------------------------------ */

    employees.forEach(employee => {

        if (
            !employeeMatchesFilters(
                employee,
                selectedRegions,
                selectedStates,
                selectedCity
            )
        ) {
            return;
        }


        const employeeCode =
            getEmployeeCode(employee);

        if (!employeeCode) return;


        map.set(
            employeeCode,
            {
                employee,
                amount: 0,
                target:
                    Number(employee.target) || 0
            }
        );

    });



    /* -----------------------------------------------
       COLLECTIONS
    ------------------------------------------------ */

    collections.forEach(item => {

        if (from && item.date < from) {
            return;
        }

        if (to && item.date > to) {
            return;
        }


        const existing =
            map.get(item.employeeCode);

        if (!existing) return;


        existing.amount +=
            Number(item.amount) || 0;

    });



    /* -----------------------------------------------
       CREATE ROWS
    ------------------------------------------------ */

    const rows = [];


    map.forEach(data => {

        const employee =
            data.employee;

        const amount =
            data.amount;

        const target =
            data.target;


        const percentage =
            target > 0
                ? (amount / target) * 100
                : 0;


        rows.push({

            employeeCode:
                getEmployeeCode(employee),

            region:
                employee.region || "-",

            state:
                employee.state || "-",

            city:
                employee.city || "-",

            teacherName:
                employee.teacherName ||
                employee.name ||
                employee.teacher_name ||
                "-",

            amount,

            target,

            percentage

        });

    });


    return rows;

}



/* =====================================================
   EMPLOYEE FILTER
===================================================== */

function employeeMatchesFilters(
    employee,
    selectedRegions,
    selectedStates,
    selectedCity
) {

    if (
        selectedRegions.length > 0 &&
        !selectedRegions.includes(
            employee.region
        )
    ) {
        return false;
    }


    if (
        selectedStates.length > 0 &&
        !selectedStates.includes(
            employee.state
        )
    ) {
        return false;
    }


    if (
        selectedCity &&
        employee.city !== selectedCity
    ) {
        return false;
    }


    return true;

}



/* =====================================================
   SORT ROWS
===================================================== */

function sortRows(rows) {

    const metric =
        rankingMetric
            ? rankingMetric.value
            : "amount";


    return rows.sort(
        (a, b) => {

            if (metric === "target") {

                return b.target - a.target;

            }


            if (metric === "percentage") {

                return b.percentage -
                       a.percentage;

            }


            return b.amount -
                   a.amount;

        }
    );

}



/* =====================================================
   GET RANK LIMIT
===================================================== */

function getRankLimit() {

    if (!rankLimit) {
        return 26;
    }


    if (
        rankLimit.value === "custom"
    ) {

        const custom =
            Number(
                customLimit.value
            );


        if (
            !custom ||
            custom < 1
        ) {

            return 26;

        }


        return custom;

    }


    return Number(
        rankLimit.value
    ) || 26;

}



/* =====================================================
   DISPLAY ROWS
===================================================== */

function displayRows(rows) {

    if (!rankTableBody) return;


    if (!rows.length) {

        rankTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="no-data-cell"
                >
                    <i class="fa-solid fa-inbox"></i>
                    No ranking data found.
                </td>
            </tr>
        `;

        return;

    }


    rankTableBody.innerHTML = "";


    rows.forEach(
        (row, index) => {

            const rank =
                index + 1;


            const tr =
                document.createElement("tr");


            tr.innerHTML = `

                <td class="rank-cell">

                    ${getRankBadge(rank)}

                </td>


                <td>
                    ${escapeHtml(row.region)}
                </td>


                <td>
                    ${escapeHtml(row.state)}
                </td>


                <td>
                    ${escapeHtml(row.city)}
                </td>


                <td class="teacher-cell">

                    <strong>
                        ${escapeHtml(row.teacherName)}
                    </strong>

                    <small>
                        Code:
                        ${escapeHtml(row.employeeCode)}
                    </small>

                </td>


                <td class="collection-cell">

                    <strong>
                        ₹${formatNumber(row.amount)}
                    </strong>

                    <small>
                        ${formatUnits(row.amount)} Units
                    </small>

                </td>

            `;


            rankTableBody.appendChild(tr);

        }
    );

}



/* =====================================================
   RANK BADGE
===================================================== */

function getRankBadge(rank) {

    if (rank === 1) {

        return `
            <span class="rank-badge rank-1">
                <i class="fa-solid fa-trophy"></i>
                1
            </span>
        `;

    }


    if (rank === 2) {

        return `
            <span class="rank-badge rank-2">
                2
            </span>
        `;

    }


    if (rank === 3) {

        return `
            <span class="rank-badge rank-3">
                3
            </span>
        `;

    }


    return `
        <span class="rank-badge">
            ${rank}
        </span>
    `;

}



/* =====================================================
   UPDATE SUMMARY
===================================================== */

function updateSummary(rows) {

    if (totalRanked) {

        totalRanked.textContent =
            rows.length;

    }


    if (rankOneName) {

        rankOneName.textContent =
            rows.length
                ? rows[0].teacherName
                : "-";

    }


    if (resultCount) {

        resultCount.textContent =
            rows.length;

    }

}



/* =====================================================
   UPDATE SELECTION TEXT
===================================================== */

function updateSelectionText() {

    const regions =
        getSelectedValues(regionFilter);

    const states =
        getSelectedValues(stateFilter);

    const city =
        cityFilter
            ? cityFilter.value
            : "";


    let text =
        "Teacher Wise Ranking";


    if (regions.length) {

        text +=
            " | Region: " +
            regions.join(", ");

    }


    if (states.length) {

        text +=
            " | State: " +
            states.join(", ");

    }


    if (city) {

        text +=
            " | City: " +
            city;

    }


    if (
        fromDate.value ||
        toDate.value
    ) {

        text +=
            " | Date: " +
            (fromDate.value || "Start") +
            " to " +
            (toDate.value || "Today");

    }


    if (selectionText) {

        selectionText.textContent =
            text;

    }


    if (captureFilterText) {

        captureFilterText.textContent =
            text;

    }

}



/* =====================================================
   RESET FILTERS
===================================================== */

function resetFilters() {

    rankingMetric.value =
        "amount";


    rankBy.value =
        "teacher";


    rankLimit.value =
        "26";


    customLimit.value =
        "";


    customLimitGroup.style.display =
        "none";


    [...regionFilter.options]
        .forEach(
            option =>
                option.selected = false
        );


    [...stateFilter.options]
        .forEach(
            option =>
                option.selected = false
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



/* =====================================================
   FORMAT DATE
===================================================== */

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


    return `${year}-${month}-${day}`;

}



/* =====================================================
   GET ENTRY DATE
===================================================== */

function getEntryDate(entry) {

    const value =
        entry.date ||
        entry.entryDate ||
        entry.collectionDate ||
        entry.createdDate;


    if (!value) return "";


    if (
        value &&
        typeof value.toDate === "function"
    ) {

        return formatDateForInput(
            value.toDate()
        );

    }


    if (
        value &&
        typeof value === "object" &&
        value.seconds
    ) {

        return formatDateForInput(
            new Date(
                value.seconds * 1000
            )
        );

    }


    if (typeof value === "string") {

        return value.substring(0, 10);

    }


    return "";

}



/* =====================================================
   GET EMPLOYEE CODE
===================================================== */

function getEmployeeCode(data) {

    return String(
        data.employeeCode ||
        data.employCode ||
        data.employee_code ||
        data.code ||
        ""
    ).trim();

}



/* =====================================================
   GET AMOUNT
===================================================== */

function getAmount(data) {

    return Number(
        data.amount ||
        data.collection ||
        data.totalAmount ||
        0
    ) || 0;

}



/* =====================================================
   FORMAT NUMBER
===================================================== */

function formatNumber(number) {

    return Number(number || 0)
        .toLocaleString("en-IN");

}



/* =====================================================
   FORMAT UNITS
   1 UNIT = ₹7,000
===================================================== */

function formatUnits(amount) {

    return (
        Number(amount || 0) / 7000
    ).toFixed(2);

}



/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



/* =====================================================
   DOWNLOAD CSV
===================================================== */

function downloadRankingCSV() {

    if (!currentRows.length) {

        alert(
            "Download karne ke liye ranking data available nahi hai."
        );

        return;

    }


    const headers = [
        "Rank",
        "Region",
        "State",
        "City",
        "Teacher Name",
        "Employee Code",
        "Collection",
        "Units",
        "Target",
        "Target %"
    ];


    const csvRows = [];


    csvRows.push(
        headers.map(csvEscape).join(",")
    );


    currentRows.forEach(
        (row, index) => {

            const values = [

                index + 1,

                row.region,

                row.state,

                row.city,

                row.teacherName,

                row.employeeCode,

                row.amount,

                formatUnits(row.amount),

                row.target,

                row.percentage.toFixed(2) + "%"

            ];


            csvRows.push(
                values
                    .map(csvEscape)
                    .join(",")
            );

        }
    );


    const csvContent =
        "\uFEFF" +
        csvRows.join("\r\n");


    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        `Telethon-Ranking-${formatDateForInput(new Date())}.csv`;


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);


    URL.revokeObjectURL(url);

}



/* =====================================================
   CSV ESCAPE
===================================================== */

function csvEscape(value) {

    const text =
        String(value ?? "");


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

    }


    return text;

}



/* =====================================================
   DOWNLOAD IMAGE
===================================================== */

async function downloadRankingImage() {

    if (!currentRows.length) {

        alert(
            "Download karne ke liye ranking data available nahi hai."
        );

        return;

    }


    if (
        typeof html2canvas ===
        "undefined"
    ) {

        alert(
            "Image download library load nahi hui. Page refresh karke dobara try karein."
        );

        return;

    }


    const target =
        document.getElementById(
            "rankingTableCapture"
        );


    if (!target) {

        alert(
            "Ranking table nahi mili."
        );

        return;

    }


    try {

        downloadImageBtn.disabled =
            true;


        const oldText =
            downloadImageBtn.innerHTML;


        downloadImageBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creating Image...
        `;


        const canvas =
            await html2canvas(
                target,
                {
                    scale: 2,

                    useCORS: true,

                    backgroundColor:
                        "#ffffff",

                    logging: false

                }
            );


        const image =
            canvas.toDataURL(
                "image/png"
            );


        const link =
            document.createElement("a");


        link.href =
            image;


        link.download =
            `Telethon-Ranking-${formatDateForInput(new Date())}.png`;


        document.body.appendChild(link);


        link.click();


        document.body.removeChild(link);


        downloadImageBtn.innerHTML =
            oldText;


        downloadImageBtn.disabled =
            false;


    } catch (error) {

        console.error(
            "Image download error:",
            error
        );


        alert(
            "Image download nahi ho saki."
        );


        downloadImageBtn.disabled =
            false;


        downloadImageBtn.innerHTML = `
            <i class="fa-solid fa-image"></i>
            Download Image
        `;

    }

}
