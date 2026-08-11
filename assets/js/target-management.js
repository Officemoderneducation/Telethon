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
// ======================================
// Filter Elements
// ======================================

const targetRegionFilter =
    document.getElementById("targetRegionFilter");

const targetStateFilter =
    document.getElementById("targetStateFilter");

const targetCityFilter =
    document.getElementById("targetCityFilter");

const resetTargetFilter =
    document.getElementById("resetTargetFilter");
const saveTargetBtn =
    document.getElementById("saveTargetBtn");


// ======================================
// Filter Elements
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


// ======================================
// Preview Elements
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
// Summary Elements
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
// Data
// ======================================

let employees = [];

let entries = [];


// ======================================
// Helper - Escape HTML
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
// Helper - Normalize
// ======================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


// ======================================
// Employee Code
// ======================================

function getEmployeeCode(employee) {

    return String(

        employee.employee_code ||

        employee.employeeCode ||

        employee.empCode ||

        employee.emp_code ||

        employee.employeeID ||

        employee.employeeId ||

        employee.id ||

        ""

    ).trim();

}


// ======================================
// Teacher Name
// ======================================

function getTeacherName(employee) {

    return (

        employee.teacher_name ||

        employee.teacherName ||

        employee.name ||

        "-"

    );

}


// ======================================
// Jamiatul Madina
// ======================================

function getMadina(employee) {

    return (

        employee.jamiatul_madina ||

        employee.jamiatulMadina ||

        employee.jamiatulMadinaName ||

        "-"

    );

}


// ======================================
// Target
// ======================================

function getEmployeeTarget(employee) {

    const target = Number(

        employee.targetAmount ||

        employee.target ||

        employee.target_amount ||

        employee.monthlyTarget ||

        employee.monthly_target ||

        0

    );

    return Number.isFinite(target)
        ? target
        : 0;

}


// ======================================
// Load Employees
// ======================================

async function loadEmployees() {

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
                        id: docSnapshot.id
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


        // Sort Employee Code

        employees.sort(
            (a, b) =>

                String(a.employeeCode)
                    .localeCompare(
                        String(b.employeeCode),
                        undefined,
                        {
                            numeric: true
                        }
                    )
        );


        populateEmployeeSelect();


        // Load Filter Options

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
// Employee Dropdown
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
                getTeacherName(employee);


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
// Employee Selection
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
                    getMadina(employee);

            }


            if (previewCode) {

                previewCode.textContent =
                    employee.employeeCode || "-";

            }


            if (previewTeacher) {

                previewTeacher.textContent =
                    getTeacherName(employee);

            }


            if (targetAmountInput) {

                targetAmountInput.value =
                    getEmployeeTarget(employee) || "";

            }

        }
    );

}


// ======================================
// Load Daily Entries
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
// Get Entry Employee Code
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

        ""

    ).trim();

}


// ======================================
// Get Entry Amount
// ======================================

function getEntryAmount(entry) {

    const amount = Number(

        String(

            entry.amount ||

            entry.collection ||

            entry.collectionAmount ||

            entry.totalCollection ||

            entry.total_collection ||

            0

        )
            .replace(/,/g, "")
            .replace(/₹/g, "")
            .trim()

    );


    return Number.isFinite(amount)
        ? amount
        : 0;

}


// ======================================
// Get Employee Collection
// ======================================

function getEmployeeCollection(employee) {

    const employeeCode =
        normalize(
            getEmployeeCode(employee)
        );


    if (!employeeCode) {
        return 0;
    }


    let total = 0;


    entries.forEach(
        (entry) => {

            const entryCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            if (
                entryCode ===
                employeeCode
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
// Percentage
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
// Remaining Target
// ======================================

function getRemaining(
    target,
    collectionAmount
) {

    return Math.max(
        target - collectionAmount,
        0
    );

}


// ======================================
// Load Region Filter Options
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

                targetRegionFilter.innerHTML += `

                    <option value="${escapeHTML(region)}">
                        ${escapeHTML(region)}
                    </option>

                `;

            }
        );


    loadStateFilterOptions();

}


// ======================================
// Load State Filter Options
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


            const regionMatch =
                !selectedRegion ||

                normalize(
                    employeeRegion
                ) ===
                normalize(
                    selectedRegion
                );


            if (
                state &&
                regionMatch
            ) {

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

                targetStateFilter.innerHTML += `

                    <option value="${escapeHTML(state)}">
                        ${escapeHTML(state)}
                    </option>

                `;

            }
        );


    loadCityFilterOptions();

}


// ======================================
// Load City Filter Options
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

                normalize(employeeRegion) ===
                normalize(selectedRegion);


            const stateMatch =
                !selectedState ||

                normalize(employeeState) ===
                normalize(selectedState);


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

                targetCityFilter.innerHTML += `

                    <option value="${escapeHTML(city)}">
                        ${escapeHTML(city)}
                    </option>

                `;

            }
        );

}


// ======================================
// Get Filtered Employees
// ======================================

function getFilteredEmployees() {

    const selectedRegion =
        String(
            targetRegionFilter?.value || ""
        ).trim();


    const selectedState =
        String(
            targetStateFilter?.value || ""
        ).trim();


    const selectedCity =
        String(
            targetCityFilter?.value || ""
        ).trim();


    const search =
        normalize(
            targetSearch?.value || ""
        );


    return employees.filter(
        (employee) => {

            const employeeRegion =
                String(
                    employee.region || ""
                ).trim();


            const employeeState =
                String(
                    employee.state || ""
                ).trim();


            const employeeCity =
                String(
                    employee.city || ""
                ).trim();


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

                    employee.mobile ||

                    employee.mobileNumber ||

                    employee.phone ||

                    ""

                );


            const madina =
                normalize(
                    getMadina(employee)
                );


            // Region

            const regionMatch =
                !selectedRegion ||

                normalize(employeeRegion) ===
                normalize(selectedRegion);


            // State

            const stateMatch =
                !selectedState ||

                normalize(employeeState) ===
                normalize(selectedState);


            // City

            const cityMatch =
                !selectedCity ||

                normalize(employeeCity) ===
                normalize(selectedCity);


            // Search

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
                );


            return (

                regionMatch &&

                stateMatch &&

                cityMatch &&

                searchMatch

            );

        }
    );

}


// ======================================
// Apply Filters
// ======================================

function applyTargetFilters() {

    const filtered =
        getFilteredEmployees();


    displayTargetTable(
        filtered
    );

}


// ======================================
// Region Change
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


            applyTargetFilters();

        }
    );

}


// ======================================
// State Change
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


            applyTargetFilters();

        }
    );

}


// ======================================
// City Change
// ======================================

if (targetCityFilter) {

    targetCityFilter.addEventListener(
        "change",
        function () {

            applyTargetFilters();

        }
    );

}


// ======================================
// Apply Button
// ======================================

if (applyTargetFilter) {

    applyTargetFilter.addEventListener(
        "click",
        function () {

            applyTargetFilters();

        }
    );

}


// ======================================
// Search
// ======================================

if (targetSearch) {

    targetSearch.addEventListener(
        "input",
        function () {

            applyTargetFilters();

        }
    );

}


// ======================================
// Reset Filter
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


            displayTargetTable(
                employees
            );

        }
    );

}


// ======================================
// Save Target
// ======================================

if (targetForm) {

    targetForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const employeeId =
                employeeSelect.value;


            const target =
                Number(
                    targetAmountInput.value
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
                        merge: true
                    }

                );


                // Local Data Update

                employee.target =
                    target;

                employee.targetAmount =
                    target;


                showMessage(
                    "Target successfully saved.",
                    "success"
                );


                // Refresh

                await loadTargetTable();


                // Re-apply current filter

                applyTargetFilters();

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
// Message
// ======================================

function showMessage(
    message,
    type
) {

    if (!targetMessage) {
        return;
    }


    targetMessage.textContent =
        message;


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
// Load Target Table
// ======================================

async function loadTargetTable() {

    if (!targetTableBody) {
        return;
    }


    targetTableBody.innerHTML = `

        <tr>

            <td colspan="12"
                class="loading">

                Loading Target Data...

            </td>

        </tr>

    `;


    await loadEntries();


    let totalTarget =
        0;


    let totalCollection =
        0;


    employees.forEach(
        (employee) => {

            const target =
                getEmployeeTarget(
                    employee
                );


            const collectionAmount =
                getEmployeeCollection(
                    employee
                );


            totalTarget +=
                target;


            totalCollection +=
                collectionAmount;

        }
    );


    const totalRemaining =
        Math.max(
            totalTarget -
            totalCollection,
            0
        );


    // ==================================
    // Summary
    // ==================================

    if (totalTeachersEl) {

        totalTeachersEl.textContent =
            employees.length;

    }


    if (totalTargetEl) {

        totalTargetEl.textContent =
            `₹ ${totalTarget.toLocaleString("en-IN")}`;

    }


    if (totalCollectionEl) {

        totalCollectionEl.textContent =
            `₹ ${totalCollection.toLocaleString("en-IN")}`;

    }


    if (totalRemainingEl) {

        totalRemainingEl.textContent =
            `₹ ${totalRemaining.toLocaleString("en-IN")}`;

    }


    // ==================================
    // Table
    // ==================================

    displayTargetTable(
        employees
    );

}


// ======================================
// Display Target Table
// ======================================

function displayTargetTable(list) {

    if (!targetTableBody) {
        return;
    }


    if (!list.length) {

        targetTableBody.innerHTML = `

            <tr>

                <td colspan="12"
                    class="no-data">

                    No Teacher Found.

                </td>

            </tr>

        `;

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
                getMadina(employee);


            const employeeCode =
                getEmployeeCode(
                    employee
                ) || "-";


            const teacherName =
                getTeacherName(
                    employee
                );


            const target =
                getEmployeeTarget(
                    employee
                );


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


                    <td class="target-amount">

                        ₹ ${target.toLocaleString("en-IN")}

                    </td>


                    <td class="collection-amount">

                        ₹ ${collectionAmount.toLocaleString("en-IN")}

                    </td>


                    <td class="${remainingClass}">

                        ₹ ${remaining.toLocaleString("en-IN")}

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
                            data-id="${escapeHTML(employee.id)}">

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


    // ==================================
    // Edit Buttons
    // ==================================

    document
        .querySelectorAll(".edit-btn")
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

                            top: 0,

                            behavior: "smooth"

                        });

                    }
                );

            }
        );

}


// ======================================
// Logout
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

    await loadEmployees();

    await loadTargetTable();

}


start();
