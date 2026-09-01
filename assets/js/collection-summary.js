// ============================================================
// TELETHON
// COLLECTION SUMMARY
//
// FEATURES
// 1. Region User Filter
// 2. Region Filter
// 3. State Filter
// 4. City Filter
// 5. Employee Code Filter
// 6. Daily Report Collection Logic
// 7. Latest Entry per Employee + Date
// 8. Target / Collection / Remaining / Percentage
// 9. CSV Download
// 10. Image Download
// ============================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";


// ============================================================
// COLLECTION NAMES
// ============================================================

const EMPLOYEES_COLLECTION = "employees";
const DAILY_ENTRY_COLLECTION = "daily_entry";
const TEACHER_ENTRIES_COLLECTION = "teacher_entries";
const REGION_USERS_COLLECTION = "regionUsers";


// ============================================================
// CONSTANTS
// ============================================================

const UNIT_AMOUNT = 7000;


// ============================================================
// GLOBAL DATA
// ============================================================

let allEmployees = [];
let allRegionUsers = [];
let allCollectionEntries = [];

let latestEntryMap = new Map();


// ============================================================
// DOM
// ============================================================

const regionUserFilter =
    document.getElementById("regionUserFilter");

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

const downloadImage =
    document.getElementById("downloadImage");

const downloadCSV =
    document.getElementById("downloadCSV");

const summaryTableBody =
    document.getElementById("summaryTableBody");

const summaryTableFoot =
    document.getElementById("summaryTableFoot");

const selectedTitle =
    document.getElementById("selectedTitle");

const totalTarget =
    document.getElementById("totalTarget");

const totalCollection =
    document.getElementById("totalCollection");

const remainingTarget =
    document.getElementById("remainingTarget");

const percentage =
    document.getElementById("percentage");


// ============================================================
// BASIC HELPERS
// ============================================================

function normalize(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function numberValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const cleaned =
        String(value)
            .replace(/[₹,\s]/g, "")
            .replace(/[^0-9.-]/g, "");

    const number =
        parseFloat(cleaned);

    return Number.isFinite(number)
        ? number
        : 0;
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatMoney(value) {

    return "₹ " +
        Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );
}


function formatPercent(value) {

    if (!Number.isFinite(value)) {
        return "0%";
    }

    return value.toFixed(2).replace(/\.00$/, "") + "%";
}


// ============================================================
// DATE
// ============================================================

function normalizeDate(value) {

    if (!value) {
        return "";
    }

    try {

        // Firestore Timestamp
        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {

            const date =
                value.toDate();

            return buildDateString(
                date
            );
        }


        // Firestore Timestamp-like object
        if (
            typeof value === "object" &&
            typeof value.seconds === "number"
        ) {

            const date =
                new Date(
                    value.seconds * 1000
                );

            return buildDateString(
                date
            );
        }


        // JS Date
        if (
            value instanceof Date
        ) {

            return buildDateString(
                value
            );
        }


        // String
        const stringValue =
            String(value).trim();

        if (!stringValue) {
            return "";
        }


        // YYYY-MM-DD
        const directMatch =
            stringValue.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (directMatch) {

            return (
                directMatch[1] +
                "-" +
                directMatch[2] +
                "-" +
                directMatch[3]
            );
        }


        const date =
            new Date(stringValue);

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return buildDateString(
                date
            );
        }

    } catch (error) {

        console.warn(
            "Date parsing error:",
            error
        );
    }

    return "";
}


function buildDateString(date) {

    if (!(date instanceof Date)) {
        return "";
    }

    if (Number.isNaN(date.getTime())) {
        return "";
    }

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

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


// ============================================================
// CREATED TIME
// ============================================================

function getCreatedTime(entry) {

    if (!entry) {
        return 0;
    }

    const values = [
        entry.createdAt,
        entry.created_at,
        entry.timestamp,
        entry.updatedAt,
        entry.updated_at,
        entry.dateTime,
        entry.createdDate
    ];

    for (const value of values) {

        if (!value) {
            continue;
        }

        try {

            if (
                typeof value === "object" &&
                typeof value.toDate === "function"
            ) {

                return value.toDate().getTime();
            }


            if (
                typeof value === "object" &&
                typeof value.seconds === "number"
            ) {

                return value.seconds * 1000;
            }


            if (
                value instanceof Date
            ) {

                return value.getTime();
            }


            const parsed =
                new Date(value).getTime();

            if (
                Number.isFinite(parsed)
            ) {

                return parsed;
            }

        } catch (error) {
            // continue
        }
    }

    return 0;
}


// ============================================================
// EMPLOYEE CODE
// ============================================================

function getEmployeeCode(employee) {

    if (!employee) {
        return "";
    }

    const values = [
        employee.employeeCode,
        employee.employee_code,
        employee.empCode,
        employee.emp_code,
        employee.employeeID,
        employee.employeeId,
        employee.code,
        employee.id
    ];

    for (const value of values) {

        const result =
            normalize(value);

        if (result) {
            return result;
        }
    }

    return "";
}


function getEntryEmployeeCode(entry) {

    if (!entry) {
        return "";
    }

    const values = [
        entry.employeeCode,
        entry.employee_code,
        entry.empCode,
        entry.emp_code,
        entry.employeeID,
        entry.employeeId,
        entry.code,
        entry.teacherCode
    ];

    for (const value of values) {

        const result =
            normalize(value);

        if (result) {
            return result;
        }
    }

    return "";
}


// ============================================================
// EMPLOYEE NAME
// ============================================================

function getEmployeeName(employee) {

    if (!employee) {
        return "";
    }

    const values = [
        employee.teacherName,
        employee.teacher_name,
        employee.employeeName,
        employee.employee_name,
        employee.name,
        employee.fullName,
        employee.full_name
    ];

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim()
        ) {

            return String(value).trim();
        }
    }

    return "";
}


// ============================================================
// REGION
// ============================================================

function getEmployeeRegion(employee) {

    if (!employee) {
        return "";
    }

    const values = [
        employee.region,
        employee.regionName,
        employee.region_name,
        employee.assignedRegion,
        employee.assigned_region
    ];

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim()
        ) {

            return String(value).trim();
        }
    }

    return "";
}


// ============================================================
// STATE
// ============================================================

function getEmployeeState(employee) {

    if (!employee) {
        return "";
    }

    const values = [
        employee.state,
        employee.stateName,
        employee.state_name,
        employee.assignedState,
        employee.assigned_state
    ];

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim()
        ) {

            return String(value).trim();
        }
    }

    return "";
}


// ============================================================
// CITY
// ============================================================

function getEmployeeCity(employee) {

    if (!employee) {
        return "";
    }

    const values = [
        employee.city,
        employee.cityName,
        employee.city_name,
        employee.assignedCity,
        employee.assigned_city
    ];

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim()
        ) {

            return String(value).trim();
        }
    }

    return "";
}


// ============================================================
// JAMIATUL MADINA
// ============================================================

function getJamiatulMadina(employee) {

    if (!employee) {
        return "";
    }

    const values = [
        employee.jamiatulMadina,
        employee.jamiatul_madina,
        employee.jamiat,
        employee.madina,
        employee.jamiatulMadinaName
    ];

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim()
        ) {

            return String(value).trim();
        }
    }

    return "";
}


// ============================================================
// TARGET
// ============================================================

function getEmployeeTarget(employee) {

    if (!employee) {
        return 0;
    }

    const values = [
        employee.target,
        employee.targetAmount,
        employee.target_amount,
        employee.collectionTarget,
        employee.collection_target,
        employee.monthlyTarget,
        employee.monthly_target
    ];

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {

            return numberValue(value);
        }
    }

    return 0;
}


// ============================================================
// ENTRY AMOUNT
// ============================================================

function getEntryAmount(entry) {

    if (!entry) {
        return 0;
    }

    const values = [
        entry.amount,
        entry.collection,
        entry.collectionAmount,
        entry.collection_amount,
        entry.totalAmount,
        entry.total_amount,
        entry.amountCollected,
        entry.amount_collected
    ];

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {

            return numberValue(value);
        }
    }

    // If entry stores units instead of amount
    const unitValues = [
        entry.units,
        entry.unit,
        entry.totalUnits,
        entry.total_units
    ];

    for (const value of unitValues) {

        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {

            return (
                numberValue(value) *
                UNIT_AMOUNT
            );
        }
    }

    return 0;
}


// ============================================================
// GET ENTRY DATE
// ============================================================

function getEntryDate(entry) {

    if (!entry) {
        return "";
    }

    const values = [
        entry.date,
        entry.entryDate,
        entry.entry_date,
        entry.collectionDate,
        entry.collection_date,
        entry.selectedDate,
        entry.selected_date
    ];

    for (const value of values) {

        const date =
            normalizeDate(value);

        if (date) {
            return date;
        }
    }

    return "";
}


// ============================================================
// LOAD EMPLOYEES
// ============================================================

async function loadEmployees() {

    const snapshot =
        await getDocs(
            collection(
                db,
                EMPLOYEES_COLLECTION
            )
        );

    allEmployees = [];

    snapshot.forEach(doc => {

        allEmployees.push({
            ...doc.data(),
            _docId: doc.id
        });

    });
}


// ============================================================
// LOAD REGION USERS
// ============================================================

async function loadRegionUsers() {

    const snapshot =
        await getDocs(
            collection(
                db,
                REGION_USERS_COLLECTION
            )
        );

    allRegionUsers = [];

    snapshot.forEach(doc => {

        allRegionUsers.push({
            ...doc.data(),
            _docId: doc.id
        });

    });
}


// ============================================================
// LOAD COLLECTION ENTRIES
//
// Daily Report source:
//
// daily_entry
// teacher_entries
//
// Both are READ ONLY.
// ============================================================

async function loadCollectionEntries() {

    const oldSnapshot =
        await getDocs(
            collection(
                db,
                DAILY_ENTRY_COLLECTION
            )
        );


    const newSnapshot =
        await getDocs(
            collection(
                db,
                TEACHER_ENTRIES_COLLECTION
            )
        );


    allCollectionEntries = [];


    oldSnapshot.forEach(doc => {

        allCollectionEntries.push({
            ...doc.data(),
            _docId: doc.id,
            _source: "daily_entry"
        });

    });


    newSnapshot.forEach(doc => {

        allCollectionEntries.push({
            ...doc.data(),
            _docId: doc.id,
            _source: "teacher_entries"
        });

    });


    buildLatestEntryMap();
}


// ============================================================
// BUILD LATEST ENTRY MAP
//
// Same Employee + Same Date
// = latest entry only
// ============================================================

function buildLatestEntryMap() {

    latestEntryMap = new Map();


    allCollectionEntries.forEach(entry => {

        const code =
            getEntryEmployeeCode(entry);

        const date =
            getEntryDate(entry);

        if (!code || !date) {
            return;
        }


        const key =
            code + "|" + date;


        const existing =
            latestEntryMap.get(key);


        if (!existing) {

            latestEntryMap.set(
                key,
                entry
            );

            return;
        }


        const existingTime =
            getCreatedTime(existing);

        const currentTime =
            getCreatedTime(entry);


        if (currentTime >= existingTime) {

            latestEntryMap.set(
                key,
                entry
            );
        }

    });
}


// ============================================================
// GET LATEST ENTRIES
// ============================================================

function getLatestEntries() {

    return Array.from(
        latestEntryMap.values()
    );
}


// ============================================================
// REGION USER FIELD HELPERS
// ============================================================

function getRegionUserValues(user, fieldNames) {

    const result = [];

    if (!user) {
        return result;
    }


    fieldNames.forEach(field => {

        const value =
            user[field];

        if (
            Array.isArray(value)
        ) {

            value.forEach(item => {

                if (
                    item !== null &&
                    item !== undefined &&
                    String(item).trim()
                ) {

                    result.push(
                        String(item).trim()
                    );

                }

            });

        } else if (
            value !== null &&
            value !== undefined &&
            String(value).trim()
        ) {

            result.push(
                String(value).trim()
            );

        }

    });


    return [
        ...new Set(
            result.map(normalize)
        )
    ];
}


// ============================================================
// REGION USER DIRECT ASSIGNMENT
// ============================================================

function getRegionUserDirectEmployees(user) {

    if (!user) {
        return [];
    }

    const values = [
        user.employeeCodes,
        user.employee_codes,
        user.empCodes,
        user.emp_codes,
        user.employeeCode,
        user.employee_code,
        user.empCode,
        user.emp_code,
        user.assignedEmployees,
        user.assignedEmployeeCodes,
        user.teacherCodes,
        user.teachers
    ];


    const result = [];


    values.forEach(value => {

        if (Array.isArray(value)) {

            value.forEach(item => {

                const code =
                    normalize(
                        typeof item === "object"
                            ? (
                                item.employeeCode ||
                                item.employee_code ||
                                item.empCode ||
                                item.emp_code ||
                                item.code ||
                                item.id
                            )
                            : item
                    );

                if (code) {
                    result.push(code);
                }

            });

        } else {

            const code =
                normalize(value);

            if (code) {
                result.push(code);
            }

        }

    });


    return [
        ...new Set(result)
    ];
}


// ============================================================
// REGION USER MATCH
// ============================================================

function getRegionUserEmployees(user) {

    if (!user) {
        return allEmployees;
    }


    const directEmployeeCodes =
        getRegionUserDirectEmployees(user);


    const regions =
        getRegionUserValues(
            user,
            [
                "region",
                "regions",
                "regionName",
                "regionNames",
                "assignedRegion",
                "assignedRegions"
            ]
        );


    const states =
        getRegionUserValues(
            user,
            [
                "state",
                "states",
                "stateName",
                "stateNames",
                "assignedState",
                "assignedStates"
            ]
        );


    const cities =
        getRegionUserValues(
            user,
            [
                "city",
                "cities",
                "cityName",
                "cityNames",
                "assignedCity",
                "assignedCities"
            ]
        );


    const hasDirectEmployees =
        directEmployeeCodes.length > 0;

    const hasRegions =
        regions.length > 0;

    const hasStates =
        states.length > 0;

    const hasCities =
        cities.length > 0;


    // --------------------------------------------------------
    // If user has no assignment information,
    // do NOT accidentally return all employees.
    // --------------------------------------------------------

    if (
        !hasDirectEmployees &&
        !hasRegions &&
        !hasStates &&
        !hasCities
    ) {

        return [];
    }


    return allEmployees.filter(
        employee => {

            const code =
                getEmployeeCode(
                    employee
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


            // ------------------------------------------------
            // DIRECT EMPLOYEE ASSIGNMENT
            // ------------------------------------------------

            if (
                hasDirectEmployees &&
                directEmployeeCodes.includes(code)
            ) {

                return true;
            }


            // ------------------------------------------------
            // LOCATION MATCH
            //
            // Region + State + City are treated as
            // hierarchical filters.
            //
            // If a user has multiple assignment fields,
            // employee must satisfy all specified levels.
            // ------------------------------------------------

            if (
                hasRegions &&
                !regions.includes(
                    employeeRegion
                )
            ) {

                return false;
            }


            if (
                hasStates &&
                !states.includes(
                    employeeState
                )
            ) {

                return false;
            }


            if (
                hasCities &&
                !cities.includes(
                    employeeCity
                )
            ) {

                return false;
            }


            return true;

        }
    );
}


// ============================================================
// REGION USER IDENTIFICATION
// ============================================================

function getRegionUserIdCandidates(user) {

    if (!user) {
        return [];
    }

    const values = [
        user._docId,
        user.id,
        user.docId,
        user.userId,
        user.user_id,
        user.regionUserId,
        user.region_user_id,
        user.userCode,
        user.user_code,
        user.regionUserCode,
        user.region_user_code,
        user.employeeCode,
        user.employee_code,
        user.empCode,
        user.emp_code,
        user.username,
        user.userName,
        user.name
    ];


    return [
        ...new Set(
            values
                .filter(
                    value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).trim()
                )
                .map(normalize)
        )
    ];
}


function getSelectedRegionUser() {

    const selected =
        normalize(
            regionUserFilter?.value
        );


    if (!selected) {
        return null;
    }


    return (
        allRegionUsers.find(
            user => {

                const candidates =
                    getRegionUserIdCandidates(
                        user
                    );

                return candidates.includes(
                    selected
                );

            }
        ) || null
    );
}


// ============================================================
// REGION USER DISPLAY NAME
// ============================================================

function getRegionUserName(user) {

    if (!user) {
        return "All Teachers";
    }

    const values = [
        user.name,
        user.userName,
        user.username,
        user.regionUserName,
        user.region_user_name,
        user.displayName,
        user.userCode,
        user.user_code,
        user.employeeCode
    ];


    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim()
        ) {

            return String(value).trim();
        }

    }


    return "Selected Region User";
}


// ============================================================
// POPULATE REGION USER DROPDOWN
// ============================================================

function populateRegionUserFilter() {

    if (!regionUserFilter) {
        return;
    }


    const previous =
        regionUserFilter.value;


    regionUserFilter.innerHTML = `
        <option value="">
            All Region Users
        </option>
    `;


    allRegionUsers.forEach(user => {

        const candidates =
            getRegionUserIdCandidates(
                user
            );

        const value =
            candidates[0] || user._docId;


        const name =
            getRegionUserName(
                user
            );


        const option =
            document.createElement(
                "option"
            );

        option.value =
            value;

        option.textContent =
            name;


        regionUserFilter.appendChild(
            option
        );

    });


    if (
        previous &&
        Array.from(
            regionUserFilter.options
        ).some(
            option =>
                option.value === previous
        )
    ) {

        regionUserFilter.value =
            previous;
    }
}


// ============================================================
// UNIQUE SORTED VALUES
// ============================================================

function uniqueSorted(values) {

    const map = new Map();


    values.forEach(value => {

        const text =
            String(value ?? "").trim();

        if (!text) {
            return;
        }


        const key =
            normalize(text);


        if (!map.has(key)) {

            map.set(
                key,
                text
            );
        }

    });


    return Array.from(
        map.values()
    ).sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            )
    );
}


// ============================================================
// POPULATE SELECT
// ============================================================

function populateSelect(
    select,
    values,
    firstText
) {

    if (!select) {
        return;
    }


    const previous =
        select.value;


    select.innerHTML = "";


    const first =
        document.createElement(
            "option"
        );

    first.value = "";
    first.textContent = firstText;

    select.appendChild(
        first
    );


    uniqueSorted(values)
        .forEach(value => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                value;

            option.textContent =
                value;

            select.appendChild(
                option
            );

        });


    if (
        previous &&
        Array.from(
            select.options
        ).some(
            option =>
                normalize(
                    option.value
                ) === normalize(
                    previous
                )
        )
    ) {

        const matched =
            Array.from(
                select.options
            ).find(
                option =>
                    normalize(
                        option.value
                    ) === normalize(
                        previous
                    )
            );

        select.value =
            matched.value;

    }
}


// ============================================================
// GET BASE EMPLOYEES FOR CURRENT REGION USER
// ============================================================

function getBaseEmployees() {

    const selectedUser =
        getSelectedRegionUser();


    if (!selectedUser) {

        return [
            ...allEmployees
        ];
    }


    return getRegionUserEmployees(
        selectedUser
    );
}


// ============================================================
// UPDATE REGION FILTER
// ============================================================

function updateRegionFilter() {

    const employees =
        getBaseEmployees();


    populateSelect(
        regionFilter,
        employees.map(
            employee =>
                getEmployeeRegion(
                    employee
                )
        ),
        "All Regions"
    );
}


// ============================================================
// UPDATE STATE FILTER
// ============================================================

function updateStateFilter() {

    let employees =
        getBaseEmployees();


    const selectedRegion =
        normalize(
            regionFilter?.value
        );


    if (selectedRegion) {

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) === selectedRegion
            );
    }


    populateSelect(
        stateFilter,
        employees.map(
            employee =>
                getEmployeeState(
                    employee
                )
        ),
        "All States"
    );
}


// ============================================================
// UPDATE CITY FILTER
// ============================================================

function updateCityFilter() {

    let employees =
        getBaseEmployees();


    const selectedRegion =
        normalize(
            regionFilter?.value
        );

    const selectedState =
        normalize(
            stateFilter?.value
        );


    if (selectedRegion) {

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) === selectedRegion
            );
    }


    if (selectedState) {

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) === selectedState
            );
    }


    populateSelect(
        cityFilter,
        employees.map(
            employee =>
                getEmployeeCity(
                    employee
                )
        ),
        "All Cities"
    );
}


// ============================================================
// UPDATE EMPLOYEE FILTER
// ============================================================

function updateEmployeeFilter() {

    let employees =
        getBaseEmployees();


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

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) === selectedRegion
            );
    }


    if (selectedState) {

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) === selectedState
            );
    }


    if (selectedCity) {

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeCity(
                            employee
                        )
                    ) === selectedCity
            );
    }


    populateSelect(
        employeeFilter,
        employees.map(
            employee =>
                getEmployeeCode(
                    employee
                )
        ),
        "All Employees"
    );
}


// ============================================================
// UPDATE ALL FILTER DROPDOWNS
// ============================================================

function updateDependentFilters() {

    updateRegionFilter();

    updateStateFilter();

    updateCityFilter();

    updateEmployeeFilter();
}


// ============================================================
// FILTER EMPLOYEES
// ============================================================

function getFilteredEmployees() {

    let employees =
        getBaseEmployees();


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

    const selectedEmployee =
        normalize(
            employeeFilter?.value
        );


    if (selectedRegion) {

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) === selectedRegion
            );
    }


    if (selectedState) {

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) === selectedState
            );
    }


    if (selectedCity) {

        employees =
            employees.filter(
                employee =>
                    normalize(
                        getEmployeeCity(
                            employee
                        )
                    ) === selectedCity
            );
    }


    if (selectedEmployee) {

        employees =
            employees.filter(
                employee =>
                    getEmployeeCode(
                        employee
                    ) === selectedEmployee
            );
    }


    return employees;
}


// ============================================================
// BUILD COLLECTION MAP
//
// Latest entry for each Employee + Date only.
//
// Then sum latest daily values per employee.
// ============================================================

function buildTeacherCollectionMap() {

    const teacherTotalMap =
        new Map();


    getLatestEntries()
        .forEach(entry => {

            const code =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            if (!code) {
                return;
            }


            const amount =
                getEntryAmount(
                    entry
                );


            teacherTotalMap.set(
                code,
                (
                    teacherTotalMap.get(
                        code
                    ) || 0
                ) + amount
            );

        });


    return teacherTotalMap;
}


// ============================================================
// RENDER
// ============================================================

function renderSummary() {

    const employees =
        getFilteredEmployees();


    const collectionMap =
        buildTeacherCollectionMap();


    let targetTotal = 0;
    let collectionTotal = 0;


    summaryTableBody.innerHTML = "";


    if (!employees.length) {

        summaryTableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    style="text-align:center;padding:30px;"
                >
                    No data found
                </td>
            </tr>
        `;


        if (summaryTableFoot) {
            summaryTableFoot.innerHTML = "";
        }


        updateSummaryCards(
            0,
            0
        );

        return;
    }


    employees.forEach(
        (employee, index) => {

            const code =
                getEmployeeCode(
                    employee
                );


            const teacherTarget =
                getEmployeeTarget(
                    employee
                );


            const teacherCollection =
                collectionMap.get(
                    code
                ) || 0;


            const remaining =
                Math.max(
                    teacherTarget -
                    teacherCollection,
                    0
                );


            const teacherPercentage =
                teacherTarget > 0
                    ? (
                        teacherCollection /
                        teacherTarget
                    ) * 100
                    : (
                        teacherCollection > 0
                            ? 100
                            : 0
                    );


            targetTotal +=
                teacherTarget;


            collectionTotal +=
                teacherCollection;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(
                        getEmployeeRegion(
                            employee
                        )
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        getEmployeeState(
                            employee
                        )
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        getEmployeeCity(
                            employee
                        )
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        getJamiatulMadina(
                            employee
                        )
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        code
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        getEmployeeName(
                            employee
                        )
                    )}
                </td>

                <td>
                    ${formatMoney(
                        teacherTarget
                    )}
                </td>

                <td>
                    ${formatMoney(
                        teacherCollection
                    )}
                </td>

                <td>
                    ${formatMoney(
                        remaining
                    )}
                </td>

                <td>
                    ${formatPercent(
                        teacherPercentage
                    )}
                </td>

            `;


            summaryTableBody.appendChild(
                row
            );

        }
    );


    updateSummaryCards(
        targetTotal,
        collectionTotal
    );


    renderFooter(
        targetTotal,
        collectionTotal
    );


    updateSelectedTitle();
}


// ============================================================
// SUMMARY CARDS
// ============================================================

function updateSummaryCards(
    target,
    collection
) {

    const remaining =
        Math.max(
            target - collection,
            0
        );


    const percent =
        target > 0
            ? (
                collection /
                target
            ) * 100
            : (
                collection > 0
                    ? 100
                    : 0
            );


    if (totalTarget) {

        totalTarget.textContent =
            formatMoney(
                target
            );
    }


    if (totalCollection) {

        totalCollection.textContent =
            formatMoney(
                collection
            );
    }


    if (remainingTarget) {

        remainingTarget.textContent =
            formatMoney(
                remaining
            );
    }


    if (percentage) {

        percentage.textContent =
            formatPercent(
                percent
            );
    }
}


// ============================================================
// FOOTER
// ============================================================

function renderFooter(
    target,
    collection
) {

    if (!summaryTableFoot) {
        return;
    }


    const remaining =
        Math.max(
            target - collection,
            0
        );


    const percent =
        target > 0
            ? (
                collection /
                target
            ) * 100
            : (
                collection > 0
                    ? 100
                    : 0
            );


    summaryTableFoot.innerHTML = `

        <tr>

            <th
                colspan="7"
                style="text-align:right;"
            >
                TOTAL
            </th>

            <th>
                ${formatMoney(
                    target
                )}
            </th>

            <th>
                ${formatMoney(
                    collection
                )}
            </th>

            <th>
                ${formatMoney(
                    remaining
                )}
            </th>

            <th>
                ${formatPercent(
                    percent
                )}
            </th>

        </tr>

    `;
}


// ============================================================
// SELECTED TITLE
// ============================================================

function updateSelectedTitle() {

    if (!selectedTitle) {
        return;
    }


    const selectedUser =
        getSelectedRegionUser();


    const parts = [];


    if (selectedUser) {

        parts.push(
            getRegionUserName(
                selectedUser
            )
        );

    }


    if (regionFilter?.value) {

        parts.push(
            "Region: " +
            regionFilter.value
        );

    }


    if (stateFilter?.value) {

        parts.push(
            "State: " +
            stateFilter.value
        );

    }


    if (cityFilter?.value) {

        parts.push(
            "City: " +
            cityFilter.value
        );

    }


    if (employeeFilter?.value) {

        parts.push(
            "Employee: " +
            employeeFilter.value
        );

    }


    selectedTitle.textContent =
        parts.length
            ? parts.join(" | ")
            : "All Teachers";
}


// ============================================================
// APPLY CURRENT FILTER
// ============================================================

function applyCurrentFilter() {

    renderSummary();
}


// ============================================================
// REGION USER CHANGE
// ============================================================

regionUserFilter?.addEventListener(
    "change",
    () => {

        // Clear dependent filters first
        if (regionFilter) {
            regionFilter.value = "";
        }

        if (stateFilter) {
            stateFilter.value = "";
        }

        if (cityFilter) {
            cityFilter.value = "";
        }

        if (employeeFilter) {
            employeeFilter.value = "";
        }


        updateDependentFilters();

        applyCurrentFilter();

    }
);


// ============================================================
// REGION CHANGE
// ============================================================

regionFilter?.addEventListener(
    "change",
    () => {

        if (stateFilter) {
            stateFilter.value = "";
        }

        if (cityFilter) {
            cityFilter.value = "";
        }

        if (employeeFilter) {
            employeeFilter.value = "";
        }


        updateStateFilter();

        updateCityFilter();

        updateEmployeeFilter();


        // IMPORTANT
        applyCurrentFilter();

    }
);


// ============================================================
// STATE CHANGE
// ============================================================

stateFilter?.addEventListener(
    "change",
    () => {

        if (cityFilter) {
            cityFilter.value = "";
        }

        if (employeeFilter) {
            employeeFilter.value = "";
        }


        updateCityFilter();

        updateEmployeeFilter();


        // IMPORTANT
        applyCurrentFilter();

    }
);


// ============================================================
// CITY CHANGE
// ============================================================

cityFilter?.addEventListener(
    "change",
    () => {

        if (employeeFilter) {
            employeeFilter.value = "";
        }


        updateEmployeeFilter();


        // IMPORTANT
        applyCurrentFilter();

    }
);


// ============================================================
// EMPLOYEE CHANGE
// ============================================================

employeeFilter?.addEventListener(
    "change",
    () => {

        applyCurrentFilter();

    }
);


// ============================================================
// APPLY BUTTON
// ============================================================

applyFilter?.addEventListener(
    "click",
    () => {

        applyCurrentFilter();

    }
);


// ============================================================
// RESET
// ============================================================

resetFilter?.addEventListener(
    "click",
    () => {

        if (regionUserFilter) {
            regionUserFilter.value = "";
        }

        if (regionFilter) {
            regionFilter.value = "";
        }

        if (stateFilter) {
            stateFilter.value = "";
        }

        if (cityFilter) {
            cityFilter.value = "";
        }

        if (employeeFilter) {
            employeeFilter.value = "";
        }


        updateDependentFilters();

        applyCurrentFilter();

    }
);


// ============================================================
// CSV HELPERS
// ============================================================

function csvEscape(value) {

    const text =
        String(value ?? "");


    return '"' +
        text.replace(
            /"/g,
            '""'
        ) +
        '"';
}


// ============================================================
// DOWNLOAD CSV
// ============================================================

downloadCSV?.addEventListener(
    "click",
    () => {

        const employees =
            getFilteredEmployees();


        const collectionMap =
            buildTeacherCollectionMap();


        const rows = [];


        rows.push([
            "#",
            "Region",
            "State",
            "City",
            "Jamiatul Madina",
            "Employee Code",
            "Teacher Name",
            "Target",
            "Total Collection",
            "Remaining Target",
            "Percentage"
        ]);


        let targetTotal = 0;
        let collectionTotal = 0;


        employees.forEach(
            (employee, index) => {

                const code =
                    getEmployeeCode(
                        employee
                    );


                const target =
                    getEmployeeTarget(
                        employee
                    );


                const collection =
                    collectionMap.get(
                        code
                    ) || 0;


                const remaining =
                    Math.max(
                        target -
                        collection,
                        0
                    );


                const percent =
                    target > 0
                        ? (
                            collection /
                            target
                        ) * 100
                        : (
                            collection > 0
                                ? 100
                                : 0
                        );


                targetTotal +=
                    target;


                collectionTotal +=
                    collection;


                rows.push([
                    index + 1,
                    getEmployeeRegion(
                        employee
                    ),
                    getEmployeeState(
                        employee
                    ),
                    getEmployeeCity(
                        employee
                    ),
                    getJamiatulMadina(
                        employee
                    ),
                    code,
                    getEmployeeName(
                        employee
                    ),
                    target,
                    collection,
                    remaining,
                    formatPercent(
                        percent
                    )
                ]);

            }
        );


        const remainingTotal =
            Math.max(
                targetTotal -
                collectionTotal,
                0
            );


        const totalPercent =
            targetTotal > 0
                ? (
                    collectionTotal /
                    targetTotal
                ) * 100
                : (
                    collectionTotal > 0
                        ? 100
                        : 0
                );


        rows.push([
            "",
            "",
            "",
            "",
            "",
            "",
            "TOTAL",
            targetTotal,
            collectionTotal,
            remainingTotal,
            formatPercent(
                totalPercent
            )
        ]);


        const csv =
            rows
                .map(
                    row =>
                        row
                            .map(
                                csvEscape
                            )
                            .join(",")
                )
                .join("\n");


        const blob =
            new Blob(
                [
                    "\uFEFF" +
                    csv
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;

        link.download =
            "collection-summary.csv";


        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );


        URL.revokeObjectURL(
            url
        );

    }
);


// ============================================================
// DOWNLOAD IMAGE
// ============================================================

downloadImage?.addEventListener(
    "click",
    async () => {

        const area =
            document.getElementById(
                "downloadArea"
            );


        if (!area) {
            return;
        }


        if (
            typeof html2canvas !==
            "function"
        ) {

            alert(
                "Image download library is not loaded."
            );

            return;
        }


        try {

            const canvas =
                await html2canvas(
                    area,
                    {
                        scale: 2,
                        useCORS: true,
                        backgroundColor:
                            "#ffffff",
                        scrollX: 0,
                        scrollY: -window.scrollY,
                        windowWidth:
                            area.scrollWidth,
                        windowHeight:
                            area.scrollHeight
                    }
                );


            const link =
                document.createElement(
                    "a"
                );


            link.download =
                "collection-summary.png";


            link.href =
                canvas.toDataURL(
                    "image/png"
                );


            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

        } catch (error) {

            console.error(
                "Image download error:",
                error
            );


            alert(
                "Image download failed."
            );

        }

    }
);


// ============================================================
// INITIAL LOAD
// ============================================================

async function initialize() {

    try {

        summaryTableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="loading"
                >
                    Loading data...
                </td>
            </tr>
        `;


        await Promise.all([
            loadEmployees(),
            loadRegionUsers(),
            loadCollectionEntries()
        ]);


        populateRegionUserFilter();

        updateDependentFilters();

        applyCurrentFilter();


    } catch (error) {

        console.error(
            "Collection Summary Error:",
            error
        );


        summaryTableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#c62828;
                    "
                >
                    Failed to load data.
                    Please check Firebase configuration
                    and Firestore permissions.
                </td>
            </tr>
        `;

    }

}


// ============================================================
// START
// ============================================================

initialize();
