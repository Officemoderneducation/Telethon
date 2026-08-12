// ======================================
// Telethon - Target Management
// Firebase Firestore
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ======================================
// HTML Elements
// ======================================

const employeeSelect =
    document.getElementById("employeeSelect");

const targetAmountInput =
    document.getElementById("targetAmount");

const targetForm =
    document.getElementById("targetForm");

const targetMessage =
    document.getElementById("targetMessage");

const targetTableBody =
    document.getElementById("targetTableBody");

const targetSearch =
    document.getElementById("targetSearch");

const saveTargetBtn =
    document.getElementById("saveTargetBtn");

// ======================================
// FILTER ELEMENTS
// ======================================

const targetRegionFilter =
    document.getElementById("targetRegionFilter");

const targetStateFilter =
    document.getElementById("targetStateFilter");

const targetCityFilter =
    document.getElementById("targetCityFilter");

const applyTargetFilter =
    document.getElementById("applyTargetFilter");

const resetTargetFilter =
    document.getElementById("resetTargetFilter");

const targetResultCount =
    document.getElementById("targetResultCount");

// ======================================
// PREVIEW ELEMENTS
// ======================================

const employeePreview =
    document.getElementById("employeePreview");

const previewRegion =
    document.getElementById("previewRegion");

const previewState =
    document.getElementById("previewState");

const previewCity =
    document.getElementById("previewCity");

const previewMadina =
    document.getElementById("previewMadina");

const previewCode =
    document.getElementById("previewCode");

const previewTeacher =
    document.getElementById("previewTeacher");

// ======================================
// SUMMARY ELEMENTS
// ======================================

const totalTeachersEl =
    document.getElementById("totalTeachers");

const totalTargetEl =
    document.getElementById("totalTarget");

const totalCollectionEl =
    document.getElementById("totalCollection");

const totalRemainingEl =
    document.getElementById("totalRemaining");

// ======================================
// DATA
// ======================================

let employees = [];

let entries = [];

let filteredEmployees = [];

// ======================================
// UTILITY
// ======================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

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
// FORMAT CURRENCY
// ======================================

function formatCurrency(value) {

    return `₹ ${Number(value || 0).toLocaleString("en-IN")}`;

}

// ======================================
// NUMBER VALUE
// ======================================

function numberValue(value) {

    const number =
        Number(
            String(value ?? "")
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

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

        employee.id ||

        ""

    ).trim();

}

// ======================================
// EMPLOYEE NAME
// ======================================

function getTeacherName(employee) {

    return (

        employee.teacher_name ||

        employee.teacherName ||

        employee.name ||

        employee.fullName ||

        "-"

    );

}

// ======================================
// MOBILE
// ======================================

function getMobile(employee) {

    return (

        employee.mobileNumber ||

        employee.mobile ||

        employee.phone ||

        employee.mobile_no ||

        "-"

    );

}

// ======================================
// JAMIATUL MADINA
// ======================================

function getMadina(employee) {

    return (

        employee.jamiatul_madina ||

        employee.jamiatulMadina ||

        employee.jamiatulMadinaName ||

        employee.jamiatuMadina ||

        "-"

    );

}

// ======================================
// EMPLOYEE TARGET
// ======================================

function getEmployeeTarget(employee) {

    const value =

        employee.targetAmount ??

        employee.target ??

        employee.target_amount ??

        employee.monthlyTarget ??

        employee.monthly_target ??

        0;

    return numberValue(value);

}

// ======================================
// ENTRY EMPLOYEE CODE
// ======================================

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

        ""

    ).trim();

}

// ======================================
// ENTRY DATE
// ======================================

function getEntryDate(entry) {

    return String(

        entry.date ||

        entry.entryDate ||

        entry.collectionDate ||

        ""

    ).trim();

}

// ======================================
// ENTRY AMOUNT
// ======================================

function getEntryAmount(entry) {

    const value =

        entry.amount ??

        entry.collection ??

        entry.collectionAmount ??

        entry.totalCollection ??

        entry.total_collection ??

        0;

    return numberValue(value);

}

// ======================================
// CREATED TIME
// ======================================

function getCreatedTime(entry) {

    if (
        entry.createdAt &&
        typeof entry.createdAt.toMillis === "function"
    ) {

        return entry.createdAt.toMillis();

    }

    if (
        entry.createdAt &&
        typeof entry.createdAt.seconds === "number"
    ) {

        return (
            entry.createdAt.seconds * 1000
        );

    }

    if (
        typeof entry.createdAt === "number"
    ) {

        return entry.createdAt;

    }

    return 0;

}

// ======================================
// IMPORTANT
// SAME EMPLOYEE + SAME DATE
// ONLY LAST ENTRY COUNTS
// ======================================

function getEmployeeCollection(employee) {

    const employeeCode =
        normalize(
            getEmployeeCode(employee)
        );

    if (!employeeCode) {
        return 0;
    }

    // ----------------------------------
    // Latest entry per date
    // ----------------------------------

    const latestEntriesByDate = {};

    entries.forEach((entry) => {

        const entryCode =
            normalize(
                getEntryEmployeeCode(entry)
            );

        if (
            !entryCode ||
            entryCode !== employeeCode
        ) {

            return;

        }

        const entryDate =
            getEntryDate(entry);

        if (!entryDate) {
            return;
        }

        const createdTime =
            getCreatedTime(entry);

        const existing =
            latestEntriesByDate[entryDate];

        // ----------------------------------
        // First entry for this date
        // ----------------------------------

        if (!existing) {

            latestEntriesByDate[entryDate] = {

                amount:
                    getEntryAmount(entry),

                createdTime:
                    createdTime,

                id:
                    entry.id || ""

            };

            return;

        }

        // ----------------------------------
        // Same date
        // Latest createdAt wins
        // ----------------------------------

        if (
            createdTime >=
            existing.createdTime
        ) {

            latestEntriesByDate[entryDate] = {

                amount:
                    getEntryAmount(entry),

                createdTime:
                    createdTime,

                id:
                    entry.id || ""

            };

        }

    });

    // ----------------------------------
    // Add only latest entry of each date
    // ----------------------------------

    let total = 0;

    Object.values(
        latestEntriesByDate
    ).forEach((entry) => {

        total +=
            numberValue(
                entry.amount
            );

    });

    return total;

}

// ======================================
// PERCENTAGE
// ======================================

function getPercentage(
    target,
    collectionAmount
) {

    if (target <= 0) {
        return 0;
    }

    return Math.round(
        (
            collectionAmount /
            target
        ) * 100
    );

}

// ======================================
// REMAINING
// ======================================

function getRemaining(
    target,
    collectionAmount
) {

    return Math.max(
        target -
        collectionAmount,
        0
    );

}

// ======================================
// LOAD EMPLOYEES
// ======================================

async function loadEmployees() {

    if (employeeSelect) {

        employeeSelect.innerHTML = `
            <option value="">
                Loading Employees...
            </option>
        `;

    }

    try {

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

                const data =
                    docSnapshot.data();

                const employeeCode =
                    getEmployeeCode({

                        ...data,

                        id:
                            docSnapshot.id

                    });

                employees.push({

                    id:
                        docSnapshot.id,

                    ...data,

                    employeeCode:
                        employeeCode

                });

            }
        );

        // ----------------------------------
        // Sort Employee Code
        // ----------------------------------

        employees.sort(
            (a, b) =>

                String(
                    a.employeeCode
                ).localeCompare(

                    String(
                        b.employeeCode
                    ),

                    undefined,

                    {
                        numeric: true
                    }

                )
        );

        console.log(
            "Total Employees:",
            employees.length
        );

        populateEmployeeSelect();

        loadRegionFilterOptions();

    }
    catch (error) {

        console.error(
            "Employee Load Error:",
            error
        );

        if (employeeSelect) {

            employeeSelect.innerHTML = `
                <option value="">
                    Employees load nahi ho paaye
                </option>
            `;

        }

    }

}

// ======================================
// EMPLOYEE DROPDOWN
// ======================================

function populateEmployeeSelect() {

    if (!employeeSelect) {
        return;
    }

    employeeSelect.innerHTML = `

        <option value="">
            Select Teacher
        </option>

    `;

    employees.forEach(
        (employee) => {

            const teacherName =
                getTeacherName(
                    employee
                );

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                employee.id;

            option.textContent =
                `${employee.employeeCode} - ${teacherName}`;

            employeeSelect.appendChild(
                option
            );

        }
    );

}

// ======================================
// REGION FILTER OPTIONS
// ======================================

function loadRegionFilterOptions() {

    if (!targetRegionFilter) {
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

    targetRegionFilter.innerHTML = `

        <option value="">
            All Regions
        </option>

    `;

    [...regions]
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

                targetRegionFilter.appendChild(
                    option
                );

            }
        );

    loadStateFilterOptions();

}

// ======================================
// STATE FILTER OPTIONS
// ======================================

function loadStateFilterOptions() {

    if (!targetStateFilter) {
        return;
    }

    const selectedRegion =
        String(
            targetRegionFilter?.value || ""
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

            if (!state) {
                return;
            }

            const regionMatch =

                !selectedRegion ||

                normalize(
                    employeeRegion
                ) ===
                normalize(
                    selectedRegion
                );

            if (regionMatch) {

                states.add(
                    state
                );

            }

        }
    );

    targetStateFilter.innerHTML = `

        <option value="">
            All States
        </option>

    `;

    [...states]
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

                targetStateFilter.appendChild(
                    option
                );

            }
        );

    loadCityFilterOptions();

}

// ======================================
// CITY FILTER OPTIONS
// ======================================

function loadCityFilterOptions() {

    if (!targetCityFilter) {
        return;
    }

    const selectedRegion =
        String(
            targetRegionFilter?.value || ""
        ).trim();

    const selectedState =
        String(
            targetStateFilter?.value || ""
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

            if (!city) {
                return;
            }

            const regionMatch =

                !selectedRegion ||

                normalize(
                    employeeRegion
                ) ===
                normalize(
                    selectedRegion
                );

            const stateMatch =

                !selectedState ||

                normalize(
                    employeeState
                ) ===
                normalize(
                    selectedState
                );

            if (
                regionMatch &&
                stateMatch
            ) {

                cities.add(
                    city
                );

            }

        }
    );

    targetCityFilter.innerHTML = `

        <option value="">
            All Cities
        </option>

    `;

    [...cities]
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

                targetCityFilter.appendChild(
                    option
                );

            }
        );

}

// ======================================
// EMPLOYEE SELECTION
// ======================================

if (employeeSelect) {

    employeeSelect.addEventListener(
        "change",
        function () {

            const employeeId =
                this.value;

            if (!employeeId) {

                if (employeePreview) {

                    employeePreview.style.display =
                        "none";

                }

                if (targetAmountInput) {

                    targetAmountInput.value =
                        "";

                }

                return;

            }

            const employee =
                employees.find(
                    item =>
                        item.id ===
                        employeeId
                );

            if (!employee) {
                return;
            }

            // ----------------------------------
            // Show Preview
            // ----------------------------------

            if (employeePreview) {

                employeePreview.style.display =
                    "grid";

            }

            if (previewRegion) {

                previewRegion.textContent =
                    employee.region || "-";

            }

            if (previewState) {

                previewState.textContent =
                    employee.state || "-";

            }

            if (previewCity) {

                previewCity.textContent =
                    employee.city || "-";

            }

            if (previewMadina) {

                previewMadina.textContent =
                    getMadina(
                        employee
                    );

            }

            if (previewCode) {

                previewCode.textContent =
                    getEmployeeCode(
                        employee
                    );

            }

            if (previewTeacher) {

                previewTeacher.textContent =
                    getTeacherName(
                        employee
                    );

            }

            // ----------------------------------
            // Existing Target
            // ----------------------------------

            if (targetAmountInput) {

                targetAmountInput.value =
                    getEmployeeTarget(
                        employee
                    ) || "";

            }

        }
    );

}

// ======================================
// LOAD DAILY ENTRIES
// ======================================

async function loadEntries() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "daily_entry"
                )
            );

        entries = [];

        snapshot.forEach(
            (docSnapshot) => {

                entries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );

        console.log(
            "Total Daily Entries:",
            entries.length
        );

    }
    catch (error) {

        console.error(
            "Daily Entry Load Error:",
            error
        );

        entries = [];

    }

}

// ======================================
// SAVE TARGET
// ======================================

if (targetForm) {

    targetForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const employeeId =
                employeeSelect?.value;

            const target =
                Number(
                    targetAmountInput?.value
                );

            if (!employeeId) {

                showMessage(
                    "Please select a Teacher.",
                    "error"
                );

                return;

            }

            if (
                !Number.isFinite(target) ||
                target < 0
            ) {

                showMessage(
                    "Please enter a valid Target.",
                    "error"
                );

                return;

            }

            const employee =
                employees.find(
                    item =>
                        item.id ===
                        employeeId
                );

            if (!employee) {

                showMessage(
                    "Teacher not found.",
                    "error"
                );

                return;

            }

            try {

                if (saveTargetBtn) {

                    saveTargetBtn.disabled =
                        true;

                    saveTargetBtn.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Saving...
                    `;

                }

                // ----------------------------------
                // Save Target
                // ----------------------------------

                await setDoc(

                    doc(
                        db,
                        "employees",
                        employee.id
                    ),

                    {

                        target:
                            target,

                        targetAmount:
                            target

                    },

                    {

                        merge:
                            true

                    }

                );

                // ----------------------------------
                // Local Update
                // ----------------------------------

                employee.target =
                    target;

                employee.targetAmount =
                    target;

                showMessage(
                    "Target successfully saved.",
                    "success"
                );

                await loadTargetTable();

            }
            catch (error) {

                console.error(
                    "Target Save Error:",
                    error
                );

                showMessage(
                    "Target save nahi hua: " +
                    error.message,
                    "error"
                );

            }
            finally {

                if (saveTargetBtn) {

                    saveTargetBtn.disabled =
                        false;

                    saveTargetBtn.innerHTML = `
                        <i class="fa-solid fa-save"></i>
                        Save Target
                    `;

                }

            }

        }
    );

}

// ======================================
// MESSAGE
// ======================================

function showMessage(
    text,
    type
) {

    if (!targetMessage) {
        return;
    }

    targetMessage.textContent =
        text;

    if (type === "success") {

        targetMessage.style.color =
            "#16a34a";

    }
    else {

        targetMessage.style.color =
            "#dc2626";

    }

    setTimeout(
        () => {

            targetMessage.textContent =
                "";

        },
        4000
    );

}

// ======================================
// SUMMARY
// ======================================

function updateSummary(list) {

    let totalTarget = 0;

    let totalCollection = 0;

    list.forEach(
        (employee) => {

            totalTarget +=
                getEmployeeTarget(
                    employee
                );

            // IMPORTANT:
            // Same Employee + Same Date
            // only LAST entry count hogi

            totalCollection +=
                getEmployeeCollection(
                    employee
                );

        }
    );

    const totalRemaining =
        Math.max(
            totalTarget -
            totalCollection,
            0
        );

    if (totalTeachersEl) {

        totalTeachersEl.textContent =
            list.length;

    }

    if (totalTargetEl) {

        totalTargetEl.textContent =
            formatCurrency(
                totalTarget
            );

    }

    if (totalCollectionEl) {

        totalCollectionEl.textContent =
            formatCurrency(
                totalCollection
            );

    }

    if (totalRemainingEl) {

        totalRemainingEl.textContent =
            formatCurrency(
                totalRemaining
            );

    }

    if (targetResultCount) {

        targetResultCount.textContent =
            `${list.length} Teacher(s)`;

    }

}

// ======================================
// LOAD TARGET TABLE
// ======================================

async function loadTargetTable() {

    if (!targetTableBody) {
        return;
    }

    targetTableBody.innerHTML = `

        <tr>

            <td
                colspan="13"
                class="loading">

                Loading Target Data...

            </td>

        </tr>

    `;

    // Entries reload
    await loadEntries();

    filteredEmployees =
        [...employees];

    updateSummary(
        filteredEmployees
    );

    displayTargetTable(
        filteredEmployees
    );

}

// ======================================
// DISPLAY TARGET TABLE
// ======================================

function displayTargetTable(list) {

    if (!targetTableBody) {
        return;
    }

    if (!list.length) {

        targetTableBody.innerHTML = `

            <tr>

                <td
                    colspan="13"
                    class="no-data">

                    No Teacher Found.

                </td>

            </tr>

        `;

        if (targetResultCount) {

            targetResultCount.textContent =
                "0 Teachers";

        }

        return;

    }

    let html = "";

    list.forEach(
        (employee, index) => {

            const region =
                employee.region || "-";

            const state =
                employee.state || "-";

            const city =
                employee.city || "-";

            const madina =
                getMadina(
                    employee
                );

            const employeeCode =
                getEmployeeCode(
                    employee
                ) || "-";

            const teacherName =
                getTeacherName(
                    employee
                );

            const mobile =
                getMobile(
                    employee
                );

            const target =
                getEmployeeTarget(
                    employee
                );

            // ==================================
            // IMPORTANT COLLECTION
            // Same Employee + Same Date
            // ONLY LAST ENTRY
            // ==================================

            const collectionAmount =
                getEmployeeCollection(
                    employee
                );

            const remaining =
                getRemaining(
                    target,
                    collectionAmount
                );

            const percentage =
                getPercentage(
                    target,
                    collectionAmount
                );

            const progress =
                Math.min(
                    percentage,
                    100
                );

            const remainingClass =
                remaining === 0
                    ? "remaining-zero"
                    : "remaining-amount";

            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(region)}
                    </td>

                    <td>
                        ${escapeHTML(state)}
                    </td>

                    <td>
                        ${escapeHTML(city)}
                    </td>

                    <td>
                        ${escapeHTML(madina)}
                    </td>

                    <td>

                        <strong>
                            ${escapeHTML(employeeCode)}
                        </strong>

                    </td>

                    <td>
                        ${escapeHTML(teacherName)}
                    </td>

                    <td>
                        ${escapeHTML(mobile)}
                    </td>

                    <td class="target-amount">

                        ${formatCurrency(
                            target
                        )}

                    </td>

                    <td class="collection-amount">

                        ${formatCurrency(
                            collectionAmount
                        )}

                    </td>

                    <td class="${remainingClass}">

                        ${formatCurrency(
                            remaining
                        )}

                    </td>

                    <td>

                        <div class="percentage-box">

                            ${percentage}%

                        </div>

                        <div class="progress-container">

                            <div
                                class="progress-bar"
                                style="width:${progress}%;">
                            </div>

                        </div>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${escapeHTML(
                                employee.id
                            )}">

                            <i class="fa-solid fa-pen"></i>

                            Edit

                        </button>

                    </td>

                </tr>

            `;

        }
    );

    targetTableBody.innerHTML =
        html;

    // ======================================
    // EDIT BUTTONS
    // ======================================

    document
        .querySelectorAll(
            ".edit-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    function () {

                        const employeeId =
                            this.dataset.id;

                        if (employeeSelect) {

                            employeeSelect.value =
                                employeeId;

                            employeeSelect.dispatchEvent(
                                new Event(
                                    "change"
                                )
                            );

                        }

                        if (targetAmountInput) {

                            targetAmountInput.focus();

                        }

                        window.scrollTo({

                            top:
                                0,

                            behavior:
                                "smooth"

                        });

                    }
                );

            }
        );

}

// ======================================
// APPLY FILTERS
// ======================================

function applyFilters() {

    const selectedRegion =
        normalize(
            targetRegionFilter?.value
        );

    const selectedState =
        normalize(
            targetStateFilter?.value
        );

    const selectedCity =
        normalize(
            targetCityFilter?.value
        );

    const search =
        normalize(
            targetSearch?.value
        );

    filteredEmployees =
        employees.filter(
            (employee) => {

                const employeeRegion =
                    normalize(
                        employee.region
                    );

                const employeeState =
                    normalize(
                        employee.state
                    );

                const employeeCity =
                    normalize(
                        employee.city
                    );

                const employeeCode =
                    normalize(
                        getEmployeeCode(
                            employee
                        )
                    );

                const teacherName =
                    normalize(
                        getTeacherName(
                            employee
                        )
                    );

                const mobile =
                    normalize(
                        getMobile(
                            employee
                        )
                    );

                const madina =
                    normalize(
                        getMadina(
                            employee
                        )
                    );

                const regionMatch =

                    !selectedRegion ||

                    employeeRegion ===
                    selectedRegion;

                const stateMatch =

                    !selectedState ||

                    employeeState ===
                    selectedState;

                const cityMatch =

                    !selectedCity ||

                    employeeCity ===
                    selectedCity;

                const searchMatch =

                    !search ||

                    employeeCode.includes(
                        search
                    ) ||

                    teacherName.includes(
                        search
                    ) ||

                    mobile.includes(
                        search
                    ) ||

                    madina.includes(
                        search
                    ) ||

                    employeeRegion.includes(
                        search
                    ) ||

                    employeeState.includes(
                        search
                    ) ||

                    employeeCity.includes(
                        search
                    );

                return (

                    regionMatch &&

                    stateMatch &&

                    cityMatch &&

                    searchMatch

                );

            }
        );

    updateSummary(
        filteredEmployees
    );

    displayTargetTable(
        filteredEmployees
    );

}

// ======================================
// REGION CHANGE
// ======================================

if (targetRegionFilter) {

    targetRegionFilter.addEventListener(
        "change",
        function () {

            if (targetStateFilter) {

                targetStateFilter.value =
                    "";

            }

            if (targetCityFilter) {

                targetCityFilter.value =
                    "";

            }

            loadStateFilterOptions();

            applyFilters();

        }
    );

}

// ======================================
// STATE CHANGE
// ======================================

if (targetStateFilter) {

    targetStateFilter.addEventListener(
        "change",
        function () {

            if (targetCityFilter) {

                targetCityFilter.value =
                    "";

            }

            loadCityFilterOptions();

            applyFilters();

        }
    );

}

// ======================================
// CITY CHANGE
// ======================================

if (targetCityFilter) {

    targetCityFilter.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}

// ======================================
// APPLY FILTER
// ======================================

if (applyTargetFilter) {

    applyTargetFilter.addEventListener(
        "click",
        function () {

            applyFilters();

        }
    );

}

// ======================================
// SEARCH
// ======================================

if (targetSearch) {

    targetSearch.addEventListener(
        "input",
        function () {

            applyFilters();

        }
    );

}

// ======================================
// RESET FILTER
// ======================================

if (resetTargetFilter) {

    resetTargetFilter.addEventListener(
        "click",
        function () {

            if (targetRegionFilter) {

                targetRegionFilter.value =
                    "";

            }

            if (targetStateFilter) {

                targetStateFilter.value =
                    "";

            }

            if (targetCityFilter) {

                targetCityFilter.value =
                    "";

            }

            if (targetSearch) {

                targetSearch.value =
                    "";

            }

            loadRegionFilterOptions();

            filteredEmployees =
                [...employees];

            updateSummary(
                filteredEmployees
            );

            displayTargetTable(
                filteredEmployees
            );

        }
    );

}

// ======================================
// LOGOUT
// ======================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (logoutBtn) {

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
// START
// ======================================

async function start() {

    console.log(
        "Target Management Started"
    );

    await loadEmployees();

    await loadTargetTable();

    console.log(
        "Target Management Loaded"
    );

}

start();
