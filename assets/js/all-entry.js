// ======================================
// Telethon - All Collection Entries
// Filters:
// Region
// State
// City
// Employee Code
// Date
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const tableBody =
    document.getElementById("allEntriesTableBody");

const totalAmountEl =
    document.getElementById("allTotalAmount");

const todayAmountEl =
    document.getElementById("allTodayAmount");

const totalEntriesEl =
    document.getElementById("allEntriesCount");


const filterRegion =
    document.getElementById("filterRegion");

const filterState =
    document.getElementById("filterState");

const filterCity =
    document.getElementById("filterCity");

const filterEmployeeCode =
    document.getElementById("filterEmployeeCode");

const filterDate =
    document.getElementById("filterDate");

const resetFiltersBtn =
    document.getElementById("resetFilters");


// ======================================
// Data
// ======================================

let allEntries = [];


// ======================================
// Load Entries
// ======================================

async function loadAllEntries() {

    try {

        const entriesQuery =
            query(
                collection(db, "daily_entry"),
                orderBy("createdAt", "desc")
            );


        const snapshot =
            await getDocs(entriesQuery);


        allEntries = [];


        snapshot.forEach(
            (docSnapshot) => {

                allEntries.push({

                    id: docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        // Load Region dropdown
        loadRegions();


        // Display
        applyFilters();

    }

    catch (error) {

        console.error(
            "All Entries Load Error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td colspan="10"
                        class="no-data"
                        style="color:red;">

                        Entries load nahi ho paayi.

                        <br><br>

                        ${error.message}

                    </td>

                </tr>

            `;

        }

    }

}


// ======================================
// Load Regions
// ======================================

function loadRegions() {

    if (!filterRegion) {
        return;
    }


    const regions =
        [
            ...new Set(

                allEntries

                    .map(
                        entry =>
                            String(
                                entry.region || ""
                            ).trim()
                    )

                    .filter(Boolean)

            )
        ];


    regions.sort();


    filterRegion.innerHTML = `

        <option value="">
            All Regions
        </option>

    `;


    regions.forEach(
        regionName => {

            filterRegion.innerHTML += `

                <option value="${escapeHTML(regionName)}">

                    ${escapeHTML(regionName)}

                </option>

            `;

        }
    );

}


// ======================================
// Load States
// ======================================

function loadStates() {

    if (!filterState) {
        return;
    }


    const selectedRegion =
        filterRegion.value;


    let states =
        allEntries.map(
            entry =>
                String(
                    entry.state || ""
                ).trim()
        );


    if (selectedRegion) {

        states =
            allEntries

                .filter(
                    entry =>
                        String(
                            entry.region || ""
                        ).trim()
                        === selectedRegion
                )

                .map(
                    entry =>
                        String(
                            entry.state || ""
                        ).trim()
                );

    }


    states =
        [
            ...new Set(
                states.filter(Boolean)
            )
        ];


    states.sort();


    filterState.innerHTML = `

        <option value="">
            All States
        </option>

    `;


    states.forEach(
        stateName => {

            filterState.innerHTML += `

                <option value="${escapeHTML(stateName)}">

                    ${escapeHTML(stateName)}

                </option>

            `;

        }
    );


    filterState.disabled =
        states.length === 0;


    loadCities();

}


// ======================================
// Load Cities
// ======================================

function loadCities() {

    if (!filterCity) {
        return;
    }


    const selectedRegion =
        filterRegion.value;

    const selectedState =
        filterState.value;


    let entries =
        allEntries;


    if (selectedRegion) {

        entries =
            entries.filter(
                entry =>
                    String(
                        entry.region || ""
                    ).trim()
                    === selectedRegion
            );

    }


    if (selectedState) {

        entries =
            entries.filter(
                entry =>
                    String(
                        entry.state || ""
                    ).trim()
                    === selectedState
            );

    }


    const cities =
        [
            ...new Set(

                entries

                    .map(
                        entry =>
                            String(
                                entry.city || ""
                            ).trim()
                    )

                    .filter(Boolean)

            )
        ];


    cities.sort();


    filterCity.innerHTML = `

        <option value="">
            All Cities
        </option>

    `;


    cities.forEach(
        cityName => {

            filterCity.innerHTML += `

                <option value="${escapeHTML(cityName)}">

                    ${escapeHTML(cityName)}

                </option>

            `;

        }
    );


    filterCity.disabled =
        cities.length === 0;

}


// ======================================
// Apply Filters
// ======================================

function applyFilters() {

    const selectedRegion =
        filterRegion
            ? filterRegion.value.trim()
            : "";


    const selectedState =
        filterState
            ? filterState.value.trim()
            : "";


    const selectedCity =
        filterCity
            ? filterCity.value.trim()
            : "";


    const selectedEmployeeCode =
        filterEmployeeCode
            ? filterEmployeeCode.value
                .trim()
                .toLowerCase()
            : "";


    const selectedDate =
        filterDate
            ? filterDate.value
            : "";


    const filtered =
        allEntries.filter(
            entry => {


                const entryRegion =
                    String(
                        entry.region || ""
                    ).trim();


                const entryState =
                    String(
                        entry.state || ""
                    ).trim();


                const entryCity =
                    String(
                        entry.city || ""
                    ).trim();


                const entryEmployeeCode =
                    String(
                        entry.employee_code ||
                        entry.employeeCode ||
                        entry.empCode ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                const entryDate =
                    String(
                        entry.date || ""
                    ).trim();


                // Region
                if (
                    selectedRegion &&
                    entryRegion !== selectedRegion
                ) {

                    return false;

                }


                // State
                if (
                    selectedState &&
                    entryState !== selectedState
                ) {

                    return false;

                }


                // City
                if (
                    selectedCity &&
                    entryCity !== selectedCity
                ) {

                    return false;

                }


                // Employee Code
                if (
                    selectedEmployeeCode &&
                    !entryEmployeeCode.includes(
                        selectedEmployeeCode
                    )
                ) {

                    return false;

                }


                // Date
                if (
                    selectedDate &&
                    entryDate !== selectedDate
                ) {

                    return false;

                }


                return true;

            }
        );


    updateSummary(filtered);

    displayEntries(filtered);

}


// ======================================
// Summary
// ======================================

function updateSummary(entries) {

    let totalAmount = 0;

    let todayAmount = 0;


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    entries.forEach(
        entry => {

            const amount =
                Number(
                    entry.amount
                ) || 0;


            totalAmount += amount;


            if (
                String(
                    entry.date || ""
                ) === today
            ) {

                todayAmount += amount;

            }

        }
    );


    if (totalEntriesEl) {

        totalEntriesEl.textContent =
            entries.length;

    }


    if (totalAmountEl) {

        totalAmountEl.textContent =
            `₹ ${totalAmount.toLocaleString("en-IN")}`;

    }


    if (todayAmountEl) {

        todayAmountEl.textContent =
            `₹ ${todayAmount.toLocaleString("en-IN")}`;

    }

}


// ======================================
// Display Entries
// ======================================

function displayEntries(entries) {

    if (!tableBody) {
        return;
    }


    if (entries.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="10"
                    class="no-data">

                    Koi entry nahi mili.

                </td>

            </tr>

        `;

        return;

    }


    let html = "";


    entries.forEach(
        (data, index) => {


            const date =
                data.date || "-";


            const employeeCode =
                data.employee_code ||
                data.employeeCode ||
                data.empCode ||
                "-";


            const teacherName =
                data.teacher_name ||
                data.teacherName ||
                "-";


            const jamiatulMadina =
                data.jamiatul_madina ||
                data.jamiatulMadina ||
                "-";


            const city =
                data.city || "-";


            const state =
                data.state || "-";


            const region =
                data.region || "-";


            const amount =
                Number(
                    data.amount
                ) || 0;


            // ==================================
            // Entry Time
            // ==================================

            let entryTime = "-";


            if (
                data.createdAt &&
                typeof data.createdAt.toDate ===
                "function"
            ) {

                entryTime =
                    data.createdAt
                        .toDate()
                        .toLocaleString(
                            "en-IN",
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                            }
                        );

            }


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(date)}
                    </td>

                    <td class="emp-code">
                        ${escapeHTML(employeeCode)}
                    </td>

                    <td>
                        ${escapeHTML(teacherName)}
                    </td>

                    <td>
                        ${escapeHTML(jamiatulMadina)}
                    </td>

                    <td>
                        ${escapeHTML(city)}
                    </td>

                    <td>
                        ${escapeHTML(state)}
                    </td>

                    <td>
                        ${escapeHTML(region)}
                    </td>

                    <td class="amount">
                        ₹ ${amount.toLocaleString("en-IN")}
                    </td>

                    <td>
                        ${escapeHTML(entryTime)}
                    </td>

                </tr>

            `;

        }
    );


    tableBody.innerHTML =
        html;

}


// ======================================
// Region Change
// ======================================

if (filterRegion) {

    filterRegion.addEventListener(
        "change",
        function () {

            // State refresh
            loadStates();

            // Filter apply
            applyFilters();

        }
    );

}


// ======================================
// State Change
// ======================================

if (filterState) {

    filterState.addEventListener(
        "change",
        function () {

            // City refresh
            loadCities();

            // Filter apply
            applyFilters();

        }
    );

}


// ======================================
// City Change
// ======================================

if (filterCity) {

    filterCity.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Employee Code Search
// ======================================

if (filterEmployeeCode) {

    filterEmployeeCode.addEventListener(
        "input",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Date Filter
// ======================================

if (filterDate) {

    filterDate.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Reset Filters
// ======================================

if (resetFiltersBtn) {

    resetFiltersBtn.addEventListener(
        "click",
        function () {

            if (filterRegion) {
                filterRegion.value = "";
            }

            if (filterState) {

                filterState.innerHTML = `

                    <option value="">
                        All States
                    </option>

                `;

                filterState.disabled =
                    true;

            }

            if (filterCity) {

                filterCity.innerHTML = `

                    <option value="">
                        All Cities
                    </option>

                `;

                filterCity.disabled =
                    true;

            }

            if (filterEmployeeCode) {
                filterEmployeeCode.value = "";
            }

            if (filterDate) {
                filterDate.value = "";
            }


            applyFilters();

        }
    );

}


// ======================================
// Escape HTML
// ======================================

function escapeHTML(value) {

    return String(value ?? "")
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


// ======================================
// Logout
// ======================================

const logoutBtn =
    document.getElementById("logoutBtn");


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

loadAllEntries();
