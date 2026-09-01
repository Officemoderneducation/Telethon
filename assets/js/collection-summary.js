// ======================================================
// TELETHON - COLLECTION SUMMARY
//
// DATA SOURCE:
// 1. employees
// 2. daily_entry
// 3. teacher_entries
// 4. regionUsers
//
// IMPORTANT:
// - Same data source logic as Daily Report
// - daily_entry + teacher_entries merged
// - Same Teacher + Same Date = SUM
// - Collection Summary shows All-Time Collection
// - Region User Filter
// - Filtered Data Image Download
// - Filtered Data CSV Download
// - Old Daily Entry functionality is NOT changed
// ======================================================


// ======================================================
// FIREBASE
// ======================================================

import {
    db
} from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// HTML ELEMENTS
// ======================================================

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

const downloadArea =
    document.getElementById("downloadArea");

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

let regionUsers = [];

let dailyEntries = [];

let teacherEntries = [];

let allCollectionEntries = [];

let currentRows = [];

let currentTotalTarget = 0;

let currentTotalCollection = 0;

let currentTotalRemaining = 0;

let currentTotalPercentage = 0;


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(value ?? "")
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

    const number =
        Number(
            String(value)
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================================
// FORMAT MONEY
// ======================================================

function formatMoney(amount) {

    return "₹ " +
        numberValue(amount)
            .toLocaleString("en-IN");

}


// ======================================================
// GET EMPLOYEE CODE
// ======================================================

function getEmployeeCode(employee) {

    if (!employee) {
        return "";
    }

    return String(

        employee.employeeCode ||

        employee.employee_code ||

        employee.empCode ||

        employee.emp_code ||

        employee.employeeID ||

        employee.employeeId ||

        employee.userCode ||

        employee.user_code ||

        employee.teacherCode ||

        employee.teacher_code ||

        employee.code ||

        employee.id ||

        ""

    ).trim();

}


// ======================================================
// GET ENTRY EMPLOYEE CODE
// ======================================================

function getEntryEmployeeCode(entry) {

    if (!entry) {
        return "";
    }

    return String(

        entry.employeeCode ||

        entry.employee_code ||

        entry.empCode ||

        entry.emp_code ||

        entry.employeeID ||

        entry.employeeId ||

        entry.userCode ||

        entry.user_code ||

        entry.emp_id ||

        entry.employee ||

        entry.teacherCode ||

        entry.teacher_code ||

        entry.code ||

        ""

    ).trim();

}


// ======================================================
// GET ENTRY AMOUNT
// ======================================================

function getEntryAmount(entry) {

    if (!entry) {
        return 0;
    }

    return numberValue(

        entry.amount ??

        entry.collection ??

        entry.collectionAmount ??

        entry.collection_amount ??

        entry.totalCollection ??

        entry.total_collection ??

        entry.collectedAmount ??

        entry.collected_amount ??

        entry.dailyCollection ??

        entry.daily_collection ??

        0

    );

}


// ======================================================
// GET ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    if (!entry) {
        return "";
    }

    return (

        entry.date ||

        entry.entryDate ||

        entry.collectionDate ||

        entry.collection_date ||

        entry.createdDate ||

        entry.created_date ||

        ""

    );

}


// ======================================================
// FORMAT DATE FOR INPUT
// ======================================================

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

function normalizeDate(value) {

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
                Number(value.seconds) * 1000
            )
        );

    }

    const stringValue =
        String(value).trim();

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(stringValue)
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
        new Date(stringValue);

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
// LOAD COLLECTION DATA
// ======================================================

async function loadCollectionData(
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
        (entryDoc) => {

            result.push({

                id:
                    entryDoc.id,

                ...entryDoc.data(),

                _source:
                    collectionName

            });

        }
    );

    return result;

}


// ======================================================
// GET REGION USER NAME
// ======================================================

function getRegionUserName(regionUser) {

    if (!regionUser) {
        return "";
    }

    return String(

        regionUser.name ||

        regionUser.userName ||

        regionUser.username ||

        regionUser.regionUserName ||

        regionUser.region_user_name ||

        regionUser.displayName ||

        regionUser.fullName ||

        regionUser.employeeName ||

        regionUser.employee_name ||

        ""

    ).trim();

}


// ======================================================
// GET REGION USER CODE
// ======================================================

function getRegionUserCode(regionUser) {

    if (!regionUser) {
        return "";
    }

    return String(

        regionUser.employeeCode ||

        regionUser.employee_code ||

        regionUser.empCode ||

        regionUser.emp_code ||

        regionUser.userCode ||

        regionUser.user_code ||

        regionUser.regionUserCode ||

        regionUser.region_user_code ||

        regionUser.regionUserId ||

        ""

    ).trim();

}


// ======================================================
// ADD EMPLOYEE CODE FROM ANY VALUE
// ======================================================

function addAssignedCode(
    assignedCodes,
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return;

    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {

        const code =
            String(value).trim();

        if (code) {

            assignedCodes.add(
                normalize(code)
            );

        }

        return;

    }

    if (
        typeof value === "object"
    ) {

        const code =
            getEmployeeCode(value);

        if (code) {

            assignedCodes.add(
                normalize(code)
            );

        }

    }

}


// ======================================================
// RECURSIVELY EXTRACT ASSIGNED EMPLOYEE CODES
// ======================================================
//
// This handles:
// - employeeCodes: ["T001", "T002"]
// - assignedEmployees: [{employeeCode:"T001"}]
// - teachers: [{empCode:"T001"}]
// - assignedTeachers
// - teacherCodes
// - employees
// - nested objects/arrays
// ======================================================

function collectEmployeeCodesFromValue(
    value,
    assignedCodes,
    depth = 0
) {

    if (
        value === null ||
        value === undefined ||
        depth > 5
    ) {

        return;

    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {

        addAssignedCode(
            assignedCodes,
            value
        );

        return;

    }

    if (Array.isArray(value)) {

        value.forEach(
            (item) => {

                collectEmployeeCodesFromValue(
                    item,
                    assignedCodes,
                    depth + 1
                );

            }
        );

        return;

    }

    if (
        typeof value === "object"
    ) {

        const directCode =
            getEmployeeCode(value);

        if (directCode) {

            assignedCodes.add(
                normalize(directCode)
            );

        }


        const knownCodeFields = [

            "employeeCode",
            "employee_code",
            "empCode",
            "emp_code",
            "employeeID",
            "employeeId",
            "userCode",
            "user_code",
            "teacherCode",
            "teacher_code",
            "code"

        ];


        knownCodeFields.forEach(
            (field) => {

                if (
                    value[field] !==
                    undefined
                ) {

                    addAssignedCode(
                        assignedCodes,
                        value[field]
                    );

                }

            }
        );


        const nestedFields = [

            "employeeCodes",
            "employee_codes",

            "assignedEmployees",
            "assignedEmployeeCodes",
            "assigned_employee_codes",

            "assignedTeachers",
            "assignedTeacherCodes",
            "assigned_teacher_codes",

            "teachers",
            "teacherCodes",
            "teacher_codes",

            "employees",
            "employeeList",
            "teacherList",

            "users",
            "assignedUsers",

            "members",
            "assignedMembers"

        ];


        nestedFields.forEach(
            (field) => {

                if (
                    value[field] !==
                    undefined
                ) {

                    collectEmployeeCodesFromValue(
                        value[field],
                        assignedCodes,
                        depth + 1
                    );

                }

            }
        );

    }

}


// ======================================================
// GET REGION USER EMPLOYEE CODES
// ======================================================

function getRegionUserAssignedCodes(
    regionUser
) {

    const assignedCodes =
        new Set();


    if (!regionUser) {

        return assignedCodes;

    }


    // ==============================================
    // DIRECT / COMMON FIELDS
    // ==============================================

    const fields = [

        "employeeCodes",
        "employee_codes",

        "assignedEmployees",
        "assignedEmployeeCodes",
        "assigned_employee_codes",

        "assignedTeachers",
        "assignedTeacherCodes",
        "assigned_teacher_codes",

        "teachers",
        "teacherCodes",
        "teacher_codes",

        "employees",
        "employeeList",
        "teacherList",

        "users",
        "assignedUsers",

        "members",
        "assignedMembers"

    ];


    fields.forEach(
        (field) => {

            if (
                regionUser[field] !==
                undefined
            ) {

                collectEmployeeCodesFromValue(
                    regionUser[field],
                    assignedCodes
                );

            }

        }
    );


    // ==============================================
    // POSSIBLE ACCESS / RULE STRUCTURES
    // ==============================================

    const ruleFields = [

        "accessRules",
        "access_rules",

        "rules",

        "assigned",
        "assignment",

        "permissions"

    ];


    ruleFields.forEach(
        (field) => {

            if (
                regionUser[field] !==
                undefined
            ) {

                collectEmployeeCodesFromValue(
                    regionUser[field],
                    assignedCodes
                );

            }

        }
    );


    // ==============================================
    // REGION USER ITSELF MAY HAVE TEACHER CODE
    // ==============================================

    const ownCode =
        getRegionUserCode(
            regionUser
        );


    // Do NOT automatically use region-user code
    // as teacher code. This avoids wrong matching.


    return assignedCodes;

}


// ======================================================
// GET EMPLOYEE REGION / STATE / CITY
// ======================================================

function getEmployeeRegion(employee) {

    return String(

        employee?.region ||

        employee?.Region ||

        employee?.assignedRegion ||

        employee?.assigned_region ||

        ""

    ).trim();

}


function getEmployeeState(employee) {

    return String(

        employee?.state ||

        employee?.State ||

        employee?.assignedState ||

        employee?.assigned_state ||

        ""

    ).trim();

}


function getEmployeeCity(employee) {

    return String(

        employee?.city ||

        employee?.City ||

        employee?.assignedCity ||

        employee?.assigned_city ||

        ""

    ).trim();

}


// ======================================================
// GET REGION USER REGION / STATE / CITY
// ======================================================

function getRegionUserRegion(regionUser) {

    return String(

        regionUser?.region ||

        regionUser?.Region ||

        regionUser?.assignedRegion ||

        regionUser?.assigned_region ||

        regionUser?.regionName ||

        regionUser?.region_name ||

        ""

    ).trim();

}


function getRegionUserState(regionUser) {

    return String(

        regionUser?.state ||

        regionUser?.State ||

        regionUser?.assignedState ||

        regionUser?.assigned_state ||

        regionUser?.stateName ||

        regionUser?.state_name ||

        ""

    ).trim();

}


function getRegionUserCity(regionUser) {

    return String(

        regionUser?.city ||

        regionUser?.City ||

        regionUser?.assignedCity ||

        regionUser?.assigned_city ||

        regionUser?.cityName ||

        regionUser?.city_name ||

        ""

    ).trim();

}


// ======================================================
// GET REGION USER EMPLOYEES
// ======================================================

function getRegionUserEmployees(
    regionUser
) {

    if (!regionUser) {

        return employees.slice();

    }


    const assignedCodes =
        getRegionUserAssignedCodes(
            regionUser
        );


    // ==================================================
    // FIX 1:
    // ASSIGNED EMPLOYEE CODES FOUND
    // ==================================================

    if (
        assignedCodes.size > 0
    ) {

        const matchedEmployees =
            employees.filter(
                (employee) => {

                    const employeeCode =
                        normalize(
                            getEmployeeCode(
                                employee
                            )
                        );

                    return (
                        employeeCode &&
                        assignedCodes.has(
                            employeeCode
                        )
                    );

                }
            );


        return matchedEmployees;

    }


    // ==================================================
    // FALLBACK:
    // REGION / STATE / CITY ACCESS
    // ==================================================

    const userRegion =
        getRegionUserRegion(
            regionUser
        );

    const userState =
        getRegionUserState(
            regionUser
        );

    const userCity =
        getRegionUserCity(
            regionUser
        );


    return employees.filter(
        (employee) => {

            const employeeRegion =
                getEmployeeRegion(
                    employee
                );

            const employeeState =
                getEmployeeState(
                    employee
                );

            const employeeCity =
                getEmployeeCity(
                    employee
                );


            if (
                userRegion &&
                normalize(
                    employeeRegion
                ) !==
                normalize(
                    userRegion
                )
            ) {

                return false;

            }


            if (
                userState &&
                normalize(
                    employeeState
                ) !==
                normalize(
                    userState
                )
            ) {

                return false;

            }


            if (
                userCity &&
                normalize(
                    employeeCity
                ) !==
                normalize(
                    userCity
                )
            ) {

                return false;

            }


            return true;

        }
    );

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
        // EMPLOYEES
        // ==============================================

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        employees = [];


        employeeSnapshot.forEach(
            (employeeDoc) => {

                employees.push({

                    id:
                        employeeDoc.id,

                    ...employeeDoc.data()

                });

            }
        );


        // ==============================================
        // REGION USERS
        // ==============================================

        const regionUserSnapshot =
            await getDocs(
                collection(
                    db,
                    "regionUsers"
                )
            );


        regionUsers = [];


        regionUserSnapshot.forEach(
            (regionUserDoc) => {

                regionUsers.push({

                    id:
                        regionUserDoc.id,

                    ...regionUserDoc.data()

                });

            }
        );


        // ==============================================
        // DAILY ENTRY
        // ==============================================

        dailyEntries =
            await loadCollectionData(
                "daily_entry"
            );


        // ==============================================
        // TEACHER ENTRIES
        // ==============================================

        teacherEntries =
            await loadCollectionData(
                "teacher_entries"
            );


        // ==============================================
        // MERGE
        // ==============================================

        allCollectionEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        // ==============================================
        // LOAD FILTERS
        // ==============================================

        loadRegionUserDropdown();

        loadRegionDropdown();

        updateStateDropdown();

        updateCityDropdown();

        loadEmployeeDropdown();


        // ==============================================
        // INITIAL DISPLAY
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
                        <br><br>
                        ${escapeHTML(
                            error.message
                        )}
                    </td>
                </tr>
            `;

        }

    }

}


// ======================================================
// REGION USER DROPDOWN
// ======================================================

function loadRegionUserDropdown() {

    if (!regionUserFilter) {

        return;

    }


    regionUserFilter.innerHTML = `
        <option value="">
            All Region Users
        </option>
    `;


    regionUsers
        .slice()
        .sort(
            (a, b) =>
                getRegionUserName(a)
                    .localeCompare(
                        getRegionUserName(b)
                    )
        )
        .forEach(
            (regionUser) => {

                const name =
                    getRegionUserName(
                        regionUser
                    );


                const code =
                    getRegionUserCode(
                        regionUser
                    );


                if (!name && !code) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    regionUser.id;


                option.textContent =
                    name +
                    (
                        code
                            ? " - " + code
                            : ""
                    );


                regionUserFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// REGION DROPDOWN
// ======================================================

function loadRegionDropdown() {

    if (!regionFilter) {

        return;

    }


    const regions =
        new Set();


    employees.forEach(
        (employee) => {

            const region =
                getEmployeeRegion(
                    employee
                );


            if (region) {

                regions.add(
                    region
                );

            }

        }
    );


    regionFilter.innerHTML = `
        <option value="">
            All Regions
        </option>
    `;


    [...regions]
        .sort()
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

}


// ======================================================
// STATE DROPDOWN
// ======================================================

function updateStateDropdown() {

    if (!stateFilter) {

        return;

    }


    const selectedRegion =
        String(
            regionFilter?.value || ""
        ).trim();


    const states =
        new Set();


    employees.forEach(
        (employee) => {

            const employeeRegion =
                getEmployeeRegion(
                    employee
                );


            const state =
                getEmployeeState(
                    employee
                );


            if (
                selectedRegion &&
                normalize(
                    employeeRegion
                ) !==
                normalize(
                    selectedRegion
                )
            ) {

                return;

            }


            if (state) {

                states.add(
                    state
                );

            }

        }
    );


    stateFilter.innerHTML = `
        <option value="">
            All States
        </option>
    `;


    [...states]
        .sort()
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

}


// ======================================================
// CITY DROPDOWN
// ======================================================

function updateCityDropdown() {

    if (!cityFilter) {

        return;

    }


    const selectedRegion =
        String(
            regionFilter?.value || ""
        ).trim();


    const selectedState =
        String(
            stateFilter?.value || ""
        ).trim();


    const cities =
        new Set();


    employees.forEach(
        (employee) => {

            const employeeRegion =
                getEmployeeRegion(
                    employee
                );


            const employeeState =
                getEmployeeState(
                    employee
                );


            const city =
                getEmployeeCity(
                    employee
                );


            if (
                selectedRegion &&
                normalize(
                    employeeRegion
                ) !==
                normalize(
                    selectedRegion
                )
            ) {

                return;

            }


            if (
                selectedState &&
                normalize(
                    employeeState
                ) !==
                normalize(
                    selectedState
                )
            ) {

                return;

            }


            if (city) {

                cities.add(
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


    [...cities]
        .sort()
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

}


// ======================================================
// EMPLOYEE DROPDOWN
// ======================================================

function loadEmployeeDropdown() {

    if (!employeeFilter) {

        return;

    }


    let filteredEmployees =
        employees.slice();


    // ==============================================
    // REGION USER
    // ==============================================

    if (regionUserFilter?.value) {

        const regionUser =
            regionUsers.find(
                (user) =>
                    String(user.id) ===
                    String(
                        regionUserFilter.value
                    )
            );


        if (regionUser) {

            filteredEmployees =
                getRegionUserEmployees(
                    regionUser
                );

        }

    }


    const selectedRegion =
        String(
            regionFilter?.value || ""
        ).trim();


    const selectedState =
        String(
            stateFilter?.value || ""
        ).trim();


    const selectedCity =
        String(
            cityFilter?.value || ""
        ).trim();


    if (selectedRegion) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) ===
                    normalize(
                        selectedRegion
                    )
            );

    }


    if (selectedState) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) ===
                    normalize(
                        selectedState
                    )
            );

    }


    if (selectedCity) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>
                    normalize(
                        getEmployeeCity(
                            employee
                        )
                    ) ===
                    normalize(
                        selectedCity
                    )
            );

    }


    employeeFilter.innerHTML = `
        <option value="">
            All Employees
        </option>
    `;


    filteredEmployees
        .slice()
        .sort(
            (a, b) =>
                getEmployeeCode(a)
                    .localeCompare(
                        getEmployeeCode(b)
                    )
        )
        .forEach(
            (employee) => {

                const employeeCode =
                    getEmployeeCode(
                        employee
                    );


                const teacherName =

                    employee.teacherName ||

                    employee.teacher_name ||

                    employee.name ||

                    "-";


                if (!employeeCode) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    employeeCode;


                option.textContent =
                    employeeCode +
                    " - " +
                    teacherName;


                employeeFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// GET FILTERED EMPLOYEES
// ======================================================

function getFilteredEmployees() {

    let filteredEmployees =
        employees.slice();


    // ==============================================
    // REGION USER
    // ==============================================

    if (regionUserFilter?.value) {

        const selectedRegionUser =
            regionUsers.find(
                (user) =>
                    String(user.id) ===
                    String(
                        regionUserFilter.value
                    )
            );


        if (selectedRegionUser) {

            filteredEmployees =
                getRegionUserEmployees(
                    selectedRegionUser
                );

        }

    }


    // ==============================================
    // REGION
    // ==============================================

    if (regionFilter?.value) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) ===
                    normalize(
                        regionFilter.value
                    )
            );

    }


    // ==============================================
    // STATE
    // ==============================================

    if (stateFilter?.value) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) ===
                    normalize(
                        stateFilter.value
                    )
            );

    }


    // ==============================================
    // CITY
    // ==============================================

    if (cityFilter?.value) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>
                    normalize(
                        getEmployeeCity(
                            employee
                        )
                    ) ===
                    normalize(
                        cityFilter.value
                    )
            );

    }


    // ==============================================
    // EMPLOYEE
    // ==============================================

    if (employeeFilter?.value) {

        filteredEmployees =
            filteredEmployees.filter(
                (employee) =>
                    normalize(
                        getEmployeeCode(
                            employee
                        )
                    ) ===
                    normalize(
                        employeeFilter.value
                    )
            );

    }


    return filteredEmployees;

}


// ======================================================
// APPLY CURRENT FILTER
// ======================================================

function applyCurrentFilter() {

    const filteredEmployees =
        getFilteredEmployees();


    updateSelectedTitle();


    displaySummary(
        filteredEmployees
    );

}


// ======================================================
// UPDATE SELECTED TITLE
// ======================================================

function updateSelectedTitle() {

    if (!selectedTitle) {

        return;

    }


    let title =
        "All Teachers";


    if (employeeFilter?.value) {

        const employee =
            employees.find(
                (item) =>
                    normalize(
                        getEmployeeCode(
                            item
                        )
                    ) ===
                    normalize(
                        employeeFilter.value
                    )
            );


        if (employee) {

            const teacherName =

                employee.teacherName ||

                employee.teacher_name ||

                employee.name ||

                "-";


            title =
                "Employee Code: " +
                getEmployeeCode(
                    employee
                ) +
                " - " +
                teacherName;

        }

    }
    else if (cityFilter?.value) {

        title =
            "City: " +
            cityFilter.value;

    }
    else if (stateFilter?.value) {

        title =
            "State: " +
            stateFilter.value;

    }
    else if (regionFilter?.value) {

        title =
            "Region: " +
            regionFilter.value;

    }
    else if (regionUserFilter?.value) {

        const regionUser =
            regionUsers.find(
                (user) =>
                    String(user.id) ===
                    String(
                        regionUserFilter.value
                    )
            );


        if (regionUser) {

            title =
                "Region User: " +
                (
                    getRegionUserName(
                        regionUser
                    ) ||
                    getRegionUserCode(
                        regionUser
                    )
                );

        }

    }


    selectedTitle.textContent =
        title;

}


// ======================================================
// GET TARGET
// ======================================================

function getEmployeeTarget(employee) {

    return numberValue(

        employee.targetAmount ??

        employee.target ??

        employee.target_amount ??

        employee.Target ??

        employee.totalTarget ??

        employee.total_target ??

        0

    );

}


// ======================================================
// BUILD TEACHER COLLECTION MAP
// ======================================================

function buildTeacherCollectionMap() {

    const teacherDateMap =
        new Map();


    // ==============================================
    // SAME TEACHER + SAME DATE = SUM
    // ==============================================

    allCollectionEntries.forEach(
        (entry) => {

            const employeeCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            const date =
                normalizeDate(
                    getEntryDate(
                        entry
                    )
                );


            const amount =
                getEntryAmount(
                    entry
                );


            if (!employeeCode) {

                return;

            }


            const uniqueDate =
                date ||
                "no-date-" +
                String(
                    entry.id || ""
                );


            const key =
                employeeCode +
                "|" +
                uniqueDate;


            const existingAmount =
                teacherDateMap.get(
                    key
                ) || 0;


            teacherDateMap.set(
                key,
                existingAmount +
                amount
            );

        }
    );


    // ==============================================
    // ALL TIME TOTAL
    // ==============================================

    const teacherTotalMap =
        new Map();


    teacherDateMap.forEach(
        (amount, key) => {

            const separatorIndex =
                key.indexOf("|");


            if (
                separatorIndex === -1
            ) {

                return;

            }


            const employeeCode =
                key.substring(
                    0,
                    separatorIndex
                );


            const existingTotal =
                teacherTotalMap.get(
                    employeeCode
                ) || 0;


            teacherTotalMap.set(
                employeeCode,
                existingTotal +
                numberValue(
                    amount
                )
            );

        }
    );


    return teacherTotalMap;

}


// ======================================================
// DISPLAY SUMMARY
// ======================================================

function displaySummary(list) {

    const teacherCollectionMap =
        buildTeacherCollectionMap();


    let totalTarget = 0;

    let totalCollection = 0;

    const rows = [];


    list.forEach(
        (employee) => {

            const employeeCode =
                getEmployeeCode(
                    employee
                );


            const normalizedCode =
                normalize(
                    employeeCode
                );


            const employeeCollection =
                teacherCollectionMap.get(
                    normalizedCode
                ) || 0;


            const target =
                getEmployeeTarget(
                    employee
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

                employeeCode:
                    employeeCode,

                collection:
                    employeeCollection,

                target:
                    target,

                remaining:
                    remaining,

                percentage:
                    percentage

            });

        }
    );


    const totalRemaining =
        Math.max(
            totalTarget -
            totalCollection,
            0
        );


    let totalPercentage = 0;


    if (totalTarget > 0) {

        totalPercentage =
            (
                totalCollection /
                totalTarget
            ) * 100;

    }


    // ==============================================
    // SAVE FILTERED DATA
    // ==============================================

    currentRows =
        rows;


    currentTotalTarget =
        totalTarget;


    currentTotalCollection =
        totalCollection;


    currentTotalRemaining =
        totalRemaining;


    currentTotalPercentage =
        totalPercentage;


    // ==============================================
    // CARDS
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
            totalPercentage.toFixed(2) +
            "%";

    }


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


    if (!rows.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="no-data"
                >
                    Is filter ke liye koi
                    Teacher nahi mila.
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

            const percentageClass =

                employee.percentage >= 70

                    ? ""

                    : employee.percentage >= 40

                        ? "medium"

                        : "low";


            const teacherName =

                employee.teacherName ||

                employee.teacher_name ||

                employee.name ||

                "-";


            const jamiatulMadina =

                employee.jamiatulMadina ||

                employee.jamiatul_madina ||

                employee.jamiatuMadina ||

                employee.jamiatulMadinah ||

                employee.jamiatul ||

                "-";


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            getEmployeeRegion(
                                employee
                            ) || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            getEmployeeState(
                                employee
                            ) || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            getEmployeeCity(
                                employee
                            ) || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            jamiatulMadina
                        )}
                    </td>

                    <td class="employee-code">
                        ${escapeHTML(
                            employee.employeeCode
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            teacherName
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
// DOWNLOAD CSV
// ======================================================

function downloadFilteredCSV() {

    if (!currentRows.length) {

        alert(
            "Download karne ke liye koi data nahi hai."
        );

        return;

    }


    const headers = [

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

    ];


    const csvRows = [];


    csvRows.push(
        headers.join(",")
    );


    currentRows.forEach(
        (employee, index) => {

            const teacherName =

                employee.teacherName ||

                employee.teacher_name ||

                employee.name ||

                "";


            const jamiatulMadina =

                employee.jamiatulMadina ||

                employee.jamiatul_madina ||

                employee.jamiatuMadina ||

                employee.jamiatulMadinah ||

                employee.jamiatul ||

                "";


            const row = [

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

                jamiatulMadina,

                employee.employeeCode || "",

                teacherName,

                employee.target || 0,

                employee.collection || 0,

                employee.remaining || 0,

                employee.percentage.toFixed(2) + "%"

            ];


            csvRows.push(

                row.map(
                    (value) =>

                        `"${String(value)
                            .replace(/"/g, '""')}"`
                )
                .join(",")

            );

        }
    );


    csvRows.push("");


    csvRows.push(
        `"Total Employees","${currentRows.length}"`
    );


    csvRows.push(
        `"Total Target","${currentTotalTarget}"`
    );


    csvRows.push(
        `"Total Collection","${currentTotalCollection}"`
    );


    csvRows.push(
        `"Remaining Target","${currentTotalRemaining}"`
    );


    csvRows.push(
        `"Achievement","${currentTotalPercentage.toFixed(2)}%"`
    );


    const csvContent =

        "\uFEFF" +

        csvRows.join(
            "\n"
        );


    const blob =
        new Blob(

            [csvContent],

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


    link.href =
        url;


    link.download =

        "Collection-Summary-" +

        new Date()
            .toISOString()
            .slice(0, 10) +

        ".csv";


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


// ======================================================
// DOWNLOAD IMAGE
// ======================================================
//
// FIX 2:
// Full width capture.
// Side se table/data cut nahi hogi.
// ======================================================

async function downloadFilteredImage() {

    if (!downloadArea) {

        alert(
            "Summary area nahi mila."
        );

        return;

    }


    if (
        typeof html2canvas ===
        "undefined"
    ) {

        alert(
            "Image download library load nahi hui."
        );

        return;

    }


    try {

        // ==============================================
        // ORIGINAL STYLES SAVE
        // ==============================================

        const original = {

            width:
                downloadArea.style.width,

            maxWidth:
                downloadArea.style.maxWidth,

            overflow:
                downloadArea.style.overflow,

            overflowX:
                downloadArea.style.overflowX,

            height:
                downloadArea.style.height,

            maxHeight:
                downloadArea.style.maxHeight,

            position:
                downloadArea.style.position

        };


        // ==============================================
        // FULL CONTENT WIDTH
        // ==============================================

        const fullWidth =
            Math.max(

                downloadArea.scrollWidth,

                downloadArea.clientWidth,

                downloadArea.offsetWidth

            );


        const fullHeight =
            Math.max(

                downloadArea.scrollHeight,

                downloadArea.clientHeight,

                downloadArea.offsetHeight

            );


        // ==============================================
        // TEMPORARILY EXPAND AREA
        // ==============================================

        downloadArea.style.width =
            fullWidth + "px";

        downloadArea.style.maxWidth =
            "none";

        downloadArea.style.overflow =
            "visible";

        downloadArea.style.overflowX =
            "visible";

        downloadArea.style.height =
            "auto";

        downloadArea.style.maxHeight =
            "none";


        // ==============================================
        // SMALL DELAY
        // Allows browser to recalculate layout
        // ==============================================

        await new Promise(
            (resolve) =>
                requestAnimationFrame(
                    () =>
                        requestAnimationFrame(
                            resolve
                        )
                )
        );


        const finalWidth =
            Math.max(

                downloadArea.scrollWidth,

                fullWidth

            );


        const finalHeight =
            Math.max(

                downloadArea.scrollHeight,

                fullHeight

            );


        // ==============================================
        // CAPTURE
        // ==============================================

        const canvas =
            await html2canvas(

                downloadArea,

                {

                    scale: 2,

                    useCORS: true,

                    allowTaint: false,

                    backgroundColor:
                        "#ffffff",

                    width:
                        finalWidth,

                    height:
                        finalHeight,

                    windowWidth:
                        finalWidth,

                    windowHeight:
                        finalHeight,

                    scrollX: 0,

                    scrollY: 0,

                    x: 0,

                    y: 0

                }

            );


        // ==============================================
        // RESTORE ORIGINAL STYLE
        // ==============================================

        downloadArea.style.width =
            original.width;

        downloadArea.style.maxWidth =
            original.maxWidth;

        downloadArea.style.overflow =
            original.overflow;

        downloadArea.style.overflowX =
            original.overflowX;

        downloadArea.style.height =
            original.height;

        downloadArea.style.maxHeight =
            original.maxHeight;

        downloadArea.style.position =
            original.position;


        // ==============================================
        // DOWNLOAD
        // ==============================================

        const imageLink =
            document.createElement(
                "a"
            );


        imageLink.download =

            "Collection-Summary-" +

            new Date()
                .toISOString()
                .slice(0, 10) +

            ".png";


        imageLink.href =
            canvas.toDataURL(
                "image/png"
            );


        document.body.appendChild(
            imageLink
        );


        imageLink.click();


        document.body.removeChild(
            imageLink
        );

    }
    catch (error) {

        console.error(
            "Image Download Error:",
            error
        );


        // ==============================================
        // TRY TO RESTORE LAYOUT
        // ==============================================

        if (downloadArea) {

            downloadArea.style.width = "";

            downloadArea.style.maxWidth = "";

            downloadArea.style.overflow = "";

            downloadArea.style.overflowX = "";

            downloadArea.style.height = "";

            downloadArea.style.maxHeight = "";

            downloadArea.style.position = "";

        }


        alert(
            "Image download nahi ho paayi."
        );

    }

}


// ======================================================
// REGION USER CHANGE
// ======================================================

if (regionUserFilter) {

    regionUserFilter.addEventListener(
        "change",
        function () {

            // ==========================================
            // RESET LOWER FILTERS
            // ==========================================

            if (regionFilter) {

                regionFilter.value =
                    "";

            }


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


            // ==========================================
            // REBUILD FILTER DROPDOWNS
            // ==========================================

            loadRegionDropdown();

            updateStateDropdown();

            updateCityDropdown();

            loadEmployeeDropdown();


            // ==========================================
            // IMPORTANT:
            // DO NOT DISPLAY UNTIL APPLY FILTER
            // ==========================================

        }
    );

}


// ======================================================
// REGION CHANGE
// ======================================================

if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        function () {

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

            loadEmployeeDropdown();

        }
    );

}


// ======================================================
// STATE CHANGE
// ======================================================

if (stateFilter) {

    stateFilter.addEventListener(
        "change",
        function () {

            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }


            updateCityDropdown();

            loadEmployeeDropdown();

        }
    );

}


// ======================================================
// CITY CHANGE
// ======================================================

if (cityFilter) {

    cityFilter.addEventListener(
        "change",
        function () {

            if (employeeFilter) {

                employeeFilter.value =
                    "";

            }


            loadEmployeeDropdown();

        }
    );

}


// ======================================================
// APPLY FILTER
// ======================================================

if (applyFilter) {

    applyFilter.addEventListener(
        "click",
        function () {

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
        function () {

            if (regionUserFilter) {

                regionUserFilter.value =
                    "";

            }


            if (regionFilter) {

                regionFilter.value =
                    "";

            }


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


            loadRegionUserDropdown();

            loadRegionDropdown();

            updateStateDropdown();

            updateCityDropdown();

            loadEmployeeDropdown();

            applyCurrentFilter();

        }
    );

}


// ======================================================
// DOWNLOAD CSV BUTTON
// ======================================================

if (downloadCSV) {

    downloadCSV.addEventListener(
        "click",
        downloadFilteredCSV
    );

}


// ======================================================
// DOWNLOAD IMAGE BUTTON
// ======================================================

if (downloadImage) {

    downloadImage.addEventListener(
        "click",
        downloadFilteredImage
    );

}


// ======================================================
// START
// ======================================================

loadData();
