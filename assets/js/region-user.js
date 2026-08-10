// ======================================
// Telethon - Region User Panel
// Firebase Firestore
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const filterRegion =
    document.getElementById("filterRegion");

const filterState =
    document.getElementById("filterState");

const filterCity =
    document.getElementById("filterCity");

const filterEmployee =
    document.getElementById("filterEmployee");

const applyFilter =
    document.getElementById("applyFilter");

const resetFilter =
    document.getElementById("resetFilter");

const regionUserTable =
    document.getElementById("regionUserTable");

const viewingSummary =
    document.getElementById("viewingSummary");

const totalTarget =
    document.getElementById("totalTarget");

const totalCollection =
    document.getElementById("totalCollection");

const remainingTarget =
    document.getElementById("remainingTarget");

const achievementPercentage =
    document.getElementById("achievementPercentage");


// ======================================
// Global Employees Data
// ======================================

let employees = [];


// ======================================
// Format Currency
// ======================================

function formatCurrency(amount) {

    const number =
        Number(amount) || 0;

    return "₹ " +
        number.toLocaleString("en-IN");
}


// ======================================
// Clean Value
// ======================================

function cleanValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value).trim();
}


// ======================================
// Escape HTML
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
// Get Employee Code
// ======================================

function getEmployeeCode(employee) {

    return cleanValue(
        employee.employeeCode ||
        employee.employee_code ||
        employee.id
    );
}


// ======================================
// Get Teacher Name
// ======================================

function getTeacherName(employee) {

    return cleanValue(
        employee.teacherName ||
        employee.teacher_name
    );
}


// ======================================
// Get Region
// ======================================

function getRegion(employee) {

    return cleanValue(
        employee.region
    );
}


// ======================================
// Get State
// ======================================

function getState(employee) {

    return cleanValue(
        employee.state
    );
}


// ======================================
// Get City
// ======================================

function getCity(employee) {

    return cleanValue(
        employee.city
    );
}


// ======================================
// Get Jamiatul Madina
// ======================================

function getJamiatulMadina(employee) {

    return cleanValue(
        employee.jamiatulMadina ||
        employee.jamiatul_madina
    );
}


// ======================================
// Get Target
// ======================================

function getTarget(employee) {

    return Number(
        employee.target || 0
    );
}


// ======================================
// Get Collection
// ======================================

function getCollection(employee) {

    return Number(
        employee.totalCollection ||
        employee.total_collection ||
        employee.collection ||
        0
    );
}


// ======================================
// Reset State
// ======================================

function resetState() {

    filterState.innerHTML = `
        <option value="">
            All States
        </option>
    `;

}


// ======================================
// Reset City
// ======================================

function resetCity() {

    filterCity.innerHTML = `
        <option value="">
            All Cities
        </option>
    `;

}


// ======================================
// Reset Employee
// ======================================

function resetEmployee() {

    filterEmployee.innerHTML = `
        <option value="">
            All Employees
        </option>
    `;

}


// ======================================
// Load Employees
// ======================================

async function loadEmployees() {

    if (!regionUserTable) {
        return;
    }


    regionUserTable.innerHTML = `
        <tr>
            <td
                colspan="11"
                class="loading-cell"
            >
                Loading Data...
            </td>
        </tr>
    `;


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
            (employeeDoc) => {

                employees.push({

                    id:
                        employeeDoc.id,

                    ...employeeDoc.data()

                });

            }
        );


        // ==================================
        // Sort By Employee Code
        // ==================================

        employees.sort(
            (a, b) => {

                return getEmployeeCode(a)
                    .localeCompare(
                        getEmployeeCode(b),
                        undefined,
                        {
                            numeric: true
                        }
                    );

            }
        );


        loadRegionFilter();

        updateAllFilters();

        displayEmployees(
            employees
        );


    }

    catch (error) {

        console.error(
            "Region User Load Error:",
            error
        );


        regionUserTable.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="empty-cell"
                >
                    Data load nahi ho raha.
                    <br><br>
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// ======================================
// Load Region Filter
// ======================================

function loadRegionFilter() {

    const regions =
        [...new Set(

            employees
                .map(
                    employee =>
                        getRegion(employee)
                )
                .filter(Boolean)

        )]
        .sort();


    filterRegion.innerHTML = `
        <option value="">
            All Regions
        </option>
    `;


    regions.forEach(
        (regionName) => {

            filterRegion.innerHTML += `
                <option
                    value="${escapeHTML(regionName)}"
                >
                    ${escapeHTML(regionName)}
                </option>
            `;

        }
    );

}


// ======================================
// Load State Filter
// ======================================

function loadStateFilter() {

    const selectedRegion =
        filterRegion.value;


    let filtered =
        employees;


    if (selectedRegion) {

        filtered =
            employees.filter(
                employee =>
                    getRegion(employee) ===
                    selectedRegion
            );

    }


    const states =
        [...new Set(

            filtered
                .map(
                    employee =>
                        getState(employee)
                )
                .filter(Boolean)

        )]
        .sort();


    resetState();


    states.forEach(
        (stateName) => {

            filterState.innerHTML += `
                <option
                    value="${escapeHTML(stateName)}"
                >
                    ${escapeHTML(stateName)}
                </option>
            `;

        }
    );

}


// ======================================
// Load City Filter
// ======================================

function loadCityFilter() {

    const selectedRegion =
        filterRegion.value;

    const selectedState =
        filterState.value;


    let filtered =
        employees;


    if (selectedRegion) {

        filtered =
            filtered.filter(
                employee =>
                    getRegion(employee) ===
                    selectedRegion
            );

    }


    if (selectedState) {

        filtered =
            filtered.filter(
                employee =>
                    getState(employee) ===
                    selectedState
            );

    }


    const cities =
        [...new Set(

            filtered
                .map(
                    employee =>
                        getCity(employee)
                )
                .filter(Boolean)

        )]
        .sort();


    resetCity();


    cities.forEach(
        (cityName) => {

            filterCity.innerHTML += `
                <option
                    value="${escapeHTML(cityName)}"
                >
                    ${escapeHTML(cityName)}
                </option>
            `;

        }
    );

}


// ======================================
// Load Employee Filter
// ======================================

function loadEmployeeFilter() {

    const selectedRegion =
        filterRegion.value;

    const selectedState =
        filterState.value;

    const selectedCity =
        filterCity.value;


    let filtered =
        employees;


    if (selectedRegion) {

        filtered =
            filtered.filter(
                employee =>
                    getRegion(employee) ===
                    selectedRegion
            );

    }


    if (selectedState) {

        filtered =
            filtered.filter(
                employee =>
                    getState(employee) ===
                    selectedState
            );

    }


    if (selectedCity) {

        filtered =
            filtered.filter(
                employee =>
                    getCity(employee) ===
                    selectedCity
            );

    }


    const employeeList =
        filtered
            .map(
                employee => ({

                    code:
                        getEmployeeCode(employee),

                    name:
                        getTeacherName(employee)

                })
            )
            .filter(
                employee =>
                    employee.code
            );


    resetEmployee();


    employeeList.sort(
        (a, b) => {

            return a.code.localeCompare(
                b.code,
                undefined,
                {
                    numeric: true
                }
            );

        }
    );


    employeeList.forEach(
        (employee) => {

            filterEmployee.innerHTML += `
                <option
                    value="${escapeHTML(employee.code)}"
                >
                    ${escapeHTML(employee.code)}
                    - 
                    ${escapeHTML(employee.name)}
                </option>
            `;

        }
    );

}


// ======================================
// Update All Filters
// ======================================

function updateAllFilters() {

    loadStateFilter();

    loadCityFilter();

    loadEmployeeFilter();

}


// ======================================
// Region Change
// ======================================

filterRegion.addEventListener(
    "change",
    function () {

        resetState();

        resetCity();

        resetEmployee();


        loadStateFilter();

        loadCityFilter();

        loadEmployeeFilter();

    }
);


// ======================================
// State Change
// ======================================

filterState.addEventListener(
    "change",
    function () {

        resetCity();

        resetEmployee();


        loadCityFilter();

        loadEmployeeFilter();

    }
);


// ======================================
// City Change
// ======================================

filterCity.addEventListener(
    "change",
    function () {

        resetEmployee();

        loadEmployeeFilter();

    }
);


// ======================================
// Apply Filter
// ======================================

applyFilter.addEventListener(
    "click",
    function () {

        applyCurrentFilters();

    }
);


// ======================================
// Apply Current Filters
// ======================================

function applyCurrentFilters() {

    const selectedRegion =
        filterRegion.value;

    const selectedState =
        filterState.value;

    const selectedCity =
        filterCity.value;

    const selectedEmployee =
        filterEmployee.value;


    let filtered =
        employees;


    // ==================================
    // Region
    // ==================================

    if (selectedRegion) {

        filtered =
            filtered.filter(
                employee =>
                    getRegion(employee) ===
                    selectedRegion
            );

    }


    // ==================================
    // State
    // ==================================

    if (selectedState) {

        filtered =
            filtered.filter(
                employee =>
                    getState(employee) ===
                    selectedState
            );

    }


    // ==================================
    // City
    // ==================================

    if (selectedCity) {

        filtered =
            filtered.filter(
                employee =>
                    getCity(employee) ===
                    selectedCity
            );

    }


    // ==================================
    // Employee
    // ==================================

    if (selectedEmployee) {

        filtered =
            filtered.filter(
                employee =>
                    getEmployeeCode(employee) ===
                    selectedEmployee
            );

    }


    displayEmployees(
        filtered
    );


    updateViewingText(
        selectedRegion,
        selectedState,
        selectedCity,
        selectedEmployee
    );

}


// ======================================
// Viewing Summary Text
// ======================================

function updateViewingText(
    selectedRegion,
    selectedState,
    selectedCity,
    selectedEmployee
) {

    let text =
        "All Teachers";


    if (selectedEmployee) {

        const employee =
            employees.find(
                item =>
                    getEmployeeCode(item) ===
                    selectedEmployee
            );


        if (employee) {

            text =
                getEmployeeCode(employee) +
                " - " +
                getTeacherName(employee);

        }

    }

    else if (selectedCity) {

        text =
            selectedCity;

    }

    else if (selectedState) {

        text =
            selectedState;

    }

    else if (selectedRegion) {

        text =
            selectedRegion;

    }


    viewingSummary.textContent =
        text;

}


// ======================================
// Reset Filter
// ======================================

resetFilter.addEventListener(
    "click",
    function () {

        filterRegion.value = "";

        resetState();

        resetCity();

        resetEmployee();


        loadStateFilter();

        loadCityFilter();

        loadEmployeeFilter();


        displayEmployees(
            employees
        );


        viewingSummary.textContent =
            "All Teachers";

    }
);


// ======================================
// Display Employees
// ======================================

function displayEmployees(list) {

    if (!regionUserTable) {
        return;
    }


    // ==================================
    // Empty
    // ==================================

    if (list.length === 0) {

        regionUserTable.innerHTML = `
            <tr>

                <td
                    colspan="11"
                    class="empty-cell"
                >

                    No Teacher Found.

                </td>

            </tr>
        `;


        updateSummaryCards(
            []
        );

        return;

    }


    let html = "";


    // ==================================
    // Summary Variables
    // ==================================

    let totalTargetValue = 0;

    let totalCollectionValue = 0;


    // ==================================
    // Rows
    // ==================================

    list.forEach(
        (employee, index) => {

            const target =
                getTarget(employee);


            const collection =
                getCollection(employee);


            const remaining =
                Math.max(
                    target - collection,
                    0
                );


            let percentage = 0;


            if (target > 0) {

                percentage =
                    (
                        collection /
                        target
                    ) * 100;

            }


            totalTargetValue +=
                target;


            totalCollectionValue +=
                collection;


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


                    <td>
                        ${escapeHTML(
                            getRegion(employee)
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            getState(employee)
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            getCity(employee)
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            getJamiatulMadina(employee)
                        )}
                    </td>


                    <td>

                        <strong>
                            ${escapeHTML(
                                getEmployeeCode(employee)
                            )}
                        </strong>

                    </td>


                    <td>
                        ${escapeHTML(
                            getTeacherName(employee)
                        )}
                    </td>


                    <td class="amount target-amount">

                        ${formatCurrency(
                            target
                        )}

                    </td>


                    <td class="amount collection-amount">

                        ${formatCurrency(
                            collection
                        )}

                    </td>


                    <td class="amount remaining-amount">

                        ${formatCurrency(
                            remaining
                        )}

                    </td>


                    <td>

                        <span class="percentage">

                            ${percentage.toFixed(2)}%

                        </span>

                    </td>

                </tr>

            `;

        }
    );


    regionUserTable.innerHTML =
        html;


    // ==================================
    // Update Summary
    // ==================================

    updateSummaryCards(
        list
    );

}


// ======================================
// Update Summary Cards
// ======================================

function updateSummaryCards(list) {

    let target = 0;

    let collection = 0;


    list.forEach(
        (employee) => {

            target +=
                getTarget(employee);

            collection +=
                getCollection(employee);

        }
    );


    const remaining =
        Math.max(
            target - collection,
            0
        );


    let percentage = 0;


    if (target > 0) {

        percentage =
            (
                collection /
                target
            ) * 100;

    }


    totalTarget.textContent =
        formatCurrency(
            target
        );


    totalCollection.textContent =
        formatCurrency(
            collection
        );


    remainingTarget.textContent =
        formatCurrency(
            remaining
        );


    achievementPercentage.textContent =
        percentage.toFixed(2) +
        "%";

}


// ======================================
// Start
// ======================================

loadEmployees();
