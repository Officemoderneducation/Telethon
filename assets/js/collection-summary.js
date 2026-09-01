// ======================================================
// TELETHON - COLLECTION SUMMARY
//
// DATA SOURCE:
// 1. employees
// 2. daily_entry
// 3. teacher_entries
// 4. regionUsers
//
// FEATURES:
// - Same Teacher + Same Date = SUM
// - All-Time Collection
// - Region User Filter
// - Region / State / City / Employee Filter
// - CSV Download
// - Full Width Image Download
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
        .toLowerCase()
        .replace(/\s+/g, " ");

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
// FORMAT DATE
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
// LOAD COLLECTION
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
        doc => {

            result.push({

                id:
                    doc.id,

                ...doc.data(),

                _source:
                    collectionName

            });

        }
    );

    return result;

}


// ======================================================
// REGION USER NAME
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
// REGION USER CODE
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

        ""

    ).trim();

}


// ======================================================
// VALUE TO ARRAY
// ======================================================

function valueToArray(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return [];

    }

    if (Array.isArray(value)) {

        return value;

    }

    if (
        typeof value === "string"
    ) {

        const text =
            value.trim();

        if (!text) {

            return [];

        }

        return text
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }

    return [value];

}


// ======================================================
// EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

    return String(

        employee?.region ||

        employee?.Region ||

        employee?.assignedRegion ||

        employee?.assigned_region ||

        employee?.regionName ||

        employee?.region_name ||

        ""

    ).trim();

}


// ======================================================
// EMPLOYEE STATE
// ======================================================

function getEmployeeState(employee) {

    return String(

        employee?.state ||

        employee?.State ||

        employee?.assignedState ||

        employee?.assigned_state ||

        employee?.stateName ||

        employee?.state_name ||

        ""

    ).trim();

}


// ======================================================
// EMPLOYEE CITY
// ======================================================

function getEmployeeCity(employee) {

    return String(

        employee?.city ||

        employee?.City ||

        employee?.assignedCity ||

        employee?.assigned_city ||

        employee?.cityName ||

        employee?.city_name ||

        ""

    ).trim();

}


// ======================================================
// REGION USER REGION
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


// ======================================================
// GENERIC LOCATION EXTRACTION
// ======================================================

function collectLocationValues(
    value,
    fields,
    result,
    depth = 0
) {

    if (
        value === null ||
        value === undefined ||
        depth > 8
    ) {

        return;

    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {

        String(value)
            .split(",")
            .map(
                item =>
                    normalize(item)
            )
            .filter(Boolean)
            .forEach(
                item =>
                    result.add(item)
            );

        return;

    }

    if (Array.isArray(value)) {

        value.forEach(
            item => {

                collectLocationValues(
                    item,
                    fields,
                    result,
                    depth + 1
                );

            }
        );

        return;

    }

    if (
        typeof value === "object"
    ) {

        fields.forEach(
            field => {

                if (
                    value[field] !==
                    undefined
                ) {

                    collectLocationValues(
                        value[field],
                        fields,
                        result,
                        depth + 1
                    );

                }

            }
        );

    }

}


// ======================================================
// GET REGION USER STATES
// ======================================================

function getRegionUserStates(regionUser) {

    const result =
        new Set();

    const fields = [

        "states",
        "selectedStates",
        "selected_states",
        "assignedStates",
        "assigned_states",
        "state",
        "State",
        "assignedState",
        "assigned_state",
        "stateName",
        "state_name",
        "selectedState",
        "selected_state",
        "stateNames",
        "state_names",
        "assignedStateNames",
        "assigned_state_names"

    ];

    collectLocationValues(
        regionUser,
        fields,
        result
    );

    return [...result];

}


// ======================================================
// GET REGION USER CITIES
// ======================================================

function getRegionUserCities(regionUser) {

    const result =
        new Set();

    const fields = [

        "cities",
        "selectedCities",
        "selected_cities",
        "assignedCities",
        "assigned_cities",
        "city",
        "City",
        "assignedCity",
        "assigned_city",
        "cityName",
        "city_name",
        "selectedCity",
        "selected_city",
        "cityNames",
        "city_names",
        "assignedCityNames",
        "assigned_city_names"

    ];

    collectLocationValues(
        regionUser,
        fields,
        result
    );

    return [...result];

}


// ======================================================
// ACCESS RULES
// ======================================================

function getRegionUserAccessRules(regionUser) {

    if (!regionUser) {

        return [];

    }

    const rules = [];

    const fields = [

        "access",
        "accessRules",
        "access_rules",
        "permissions",
        "rules",
        "assignedAccess",
        "assigned_access"

    ];

    fields.forEach(
        field => {

            const value =
                regionUser[field];

            if (Array.isArray(value)) {

                value.forEach(
                    item => {

                        if (
                            item &&
                            typeof item === "object"
                        ) {

                            rules.push(item);

                        }

                    }
                );

            }
            else if (
                value &&
                typeof value === "object"
            ) {

                rules.push(value);

            }

        }
    );

    return rules;

}


// ======================================================
// RULE REGION
// ======================================================

function getRuleRegion(rule) {

    return String(

        rule?.region ||

        rule?.Region ||

        rule?.assignedRegion ||

        rule?.assigned_region ||

        rule?.regionName ||

        rule?.region_name ||

        ""

    ).trim();

}


// ======================================================
// RULE STATES
// ======================================================

function getRuleStates(rule) {

    const result =
        new Set();

    const fields = [

        "states",
        "selectedStates",
        "selected_states",
        "assignedStates",
        "assigned_states",
        "state",
        "State",
        "assignedState",
        "assigned_state",
        "stateName",
        "state_name",
        "selectedState",
        "selected_state",
        "stateNames",
        "state_names",
        "assignedStateNames",
        "assigned_state_names"

    ];

    fields.forEach(
        field => {

            if (
                rule?.[field] ===
                undefined
            ) {

                return;

            }

            valueToArray(
                rule[field]
            ).forEach(
                value => {

                    if (
                        value &&
                        typeof value === "object"
                    ) {

                        fields.forEach(
                            nested => {

                                if (
                                    value[nested] !==
                                    undefined
                                ) {

                                    valueToArray(
                                        value[nested]
                                    ).forEach(
                                        item => {

                                            normalize(item)
                                                .split(",")
                                                .filter(Boolean)
                                                .forEach(
                                                    x =>
                                                        result.add(x)
                                                );

                                        }
                                    );

                                }

                            }
                        );

                    }
                    else {

                        normalize(value)
                            .split(",")
                            .filter(Boolean)
                            .forEach(
                                x =>
                                    result.add(x)
                            );

                    }

                }
            );

        }
    );

    return [...result];

}


// ======================================================
// RULE CITIES
// ======================================================

function getRuleCities(rule) {

    const result =
        new Set();

    const fields = [

        "cities",
        "selectedCities",
        "selected_cities",
        "assignedCities",
        "assigned_cities",
        "city",
        "City",
        "assignedCity",
        "assigned_city",
        "cityName",
        "city_name",
        "selectedCity",
        "selected_city",
        "cityNames",
        "city_names"

    ];

    fields.forEach(
        field => {

            if (
                rule?.[field] ===
                undefined
            ) {

                return;

            }

            valueToArray(
                rule[field]
            ).forEach(
                value => {

                    normalize(value)
                        .split(",")
                        .filter(Boolean)
                        .forEach(
                            x =>
                                result.add(x)
                        );

                }
            );

        }
    );

    return [...result];

}


// ======================================================
// FULL REGION RULE
// ======================================================

function isFullRegionRule(rule) {

    if (!rule) {

        return false;

    }

    const type =
        normalize(

            rule.accessType ||

            rule.access_type ||

            rule.type ||

            rule.scope ||

            rule.level ||

            ""

        );

    if (

        type === "fullregion" ||
        type === "full_region" ||
        type === "full region" ||
        type === "region" ||
        type === "full"

    ) {

        return true;

    }

    if (
        rule.fullRegion === true ||
        rule.full_region === true ||
        rule.allStates === true ||
        rule.all_states === true
    ) {

        return true;

    }

    return false;

}


// ======================================================
// COLLECT EMPLOYEE CODES
// ======================================================

function collectEmployeeCodes(
    value,
    result,
    depth = 0
) {

    if (
        value === null ||
        value === undefined ||
        depth > 8
    ) {

        return;

    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {

        const code =
            normalize(value);

        if (code) {

            result.add(code);

        }

        return;

    }

    if (Array.isArray(value)) {

        value.forEach(
            item => {

                collectEmployeeCodes(
                    item,
                    result,
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

            value.employeeCode ||

            value.employee_code ||

            value.empCode ||

            value.emp_code ||

            value.employeeID ||

            value.employeeId ||

            value.userCode ||

            value.user_code ||

            value.teacherCode ||

            value.teacher_code ||

            value.code;

        if (directCode) {

            result.add(
                normalize(directCode)
            );

        }

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
            field => {

                if (
                    value[field] !==
                    undefined
                ) {

                    collectEmployeeCodes(
                        value[field],
                        result,
                        depth + 1
                    );

                }

            }
        );

    }

}


// ======================================================
// REGION USER ASSIGNED CODES
// ======================================================

function getRegionUserAssignedCodes(regionUser) {

    const result =
        new Set();

    if (!regionUser) {

        return result;

    }

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
        field => {

            if (
                regionUser[field] !==
                undefined
            ) {

                collectEmployeeCodes(
                    regionUser[field],
                    result
                );

            }

        }
    );

    return result;

}


// ======================================================
// EMPLOYEE MATCH RULE
// ======================================================

function employeeMatchesAccessRule(
    employee,
    rule
) {

    if (!rule) {

        return false;

    }

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

    const ruleRegion =
        normalize(
            getRuleRegion(
                rule
            )
        );

    const states =
        getRuleStates(rule);

    const cities =
        getRuleCities(rule);


    if (
        ruleRegion &&
        employeeRegion !==
        ruleRegion
    ) {

        return false;

    }


    if (
        isFullRegionRule(rule)
    ) {

        return true;

    }


    if (
        states.length > 0 &&
        !states.includes(
            employeeState
        )
    ) {

        return false;

    }


    if (
        cities.length > 0 &&
        !cities.includes(
            employeeCity
        )
    ) {

        return false;

    }


    return true;

}


// ======================================================
// GET REGION USER EMPLOYEES
// ======================================================

function getRegionUserEmployees(regionUser) {

    if (!regionUser) {

        return employees.slice();

    }

    const matchedCodes =
        new Set();


    // --------------------------------------------------
    // DIRECT EMPLOYEE ASSIGNMENT
    // --------------------------------------------------

    const directCodes =
        getRegionUserAssignedCodes(
            regionUser
        );

    directCodes.forEach(
        code => {

            matchedCodes.add(code);

        }
    );


    // --------------------------------------------------
    // ACCESS RULES
    // --------------------------------------------------

    const rules =
        getRegionUserAccessRules(
            regionUser
        );

    if (
        rules.length > 0
    ) {

        employees.forEach(
            employee => {

                if (
                    rules.some(
                        rule =>
                            employeeMatchesAccessRule(
                                employee,
                                rule
                            )
                    )
                ) {

                    const code =
                        normalize(
                            getEmployeeCode(
                                employee
                            )
                        );

                    if (code) {

                        matchedCodes.add(
                            code
                        );

                    }

                }

            }
        );

    }


    // --------------------------------------------------
    // DIRECT REGION / STATE / CITY
    // --------------------------------------------------

    const userRegion =
        normalize(
            getRegionUserRegion(
                regionUser
            )
        );

    const userStates =
        getRegionUserStates(
            regionUser
        );

    const userCities =
        getRegionUserCities(
            regionUser
        );


    if (
        userRegion ||
        userStates.length > 0 ||
        userCities.length > 0
    ) {

        employees.forEach(
            employee => {

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
                    userRegion &&
                    employeeRegion !==
                    userRegion
                ) {

                    return;

                }


                if (
                    userStates.length > 0 &&
                    !userStates.includes(
                        employeeState
                    )
                ) {

                    return;

                }


                if (
                    userCities.length > 0 &&
                    !userCities.includes(
                        employeeCity
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

                if (code) {

                    matchedCodes.add(
                        code
                    );

                }

            }
        );

    }


    if (
        matchedCodes.size === 0
    ) {

        return [];

    }


    return employees.filter(
        employee => {

            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );

            return (
                code &&
                matchedCodes.has(code)
            );

        }
    );

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
            (a, b) => {

                const nameA =
                    getRegionUserName(a) ||
                    getRegionUserCode(a);

                const nameB =
                    getRegionUserName(b) ||
                    getRegionUserCode(b);

                return nameA.localeCompare(
                    nameB
                );

            }
        )
        .forEach(
            regionUser => {

                const name =
                    getRegionUserName(
                        regionUser
                    );

                const code =
                    getRegionUserCode(
                        regionUser
                    );

                if (
                    !name &&
                    !code
                ) {

                    return;

                }

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    regionUser.id;

                option.textContent =
                    name && code
                        ? name + " - " + code
                        : name || code;

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

    const sourceEmployees =
        getCurrentRegionUserEmployees();

    const regions =
        new Map();

    sourceEmployees.forEach(
        employee => {

            const region =
                getEmployeeRegion(
                    employee
                );

            if (region) {

                const key =
                    normalize(region);

                if (
                    !regions.has(key)
                ) {

                    regions.set(
                        key,
                        region
                    );

                }

            }

        }
    );

    regionFilter.innerHTML = `

        <option value="">
            All Regions
        </option>

    `;

    [...regions.values()]
        .sort(
            (a, b) =>
                a.localeCompare(b)
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

                regionFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// CURRENT REGION USER EMPLOYEES
// ======================================================

function getCurrentRegionUserEmployees() {

    if (
        !regionUserFilter?.value
    ) {

        return employees.slice();

    }

    const regionUser =
        regionUsers.find(
            user =>
                String(user.id) ===
                String(
                    regionUserFilter.value
                )
        );

    if (!regionUser) {

        return [];

    }

    return getRegionUserEmployees(
        regionUser
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

    const baseEmployees =
        getCurrentRegionUserEmployees();

    const states =
        new Map();

    baseEmployees.forEach(
        employee => {

            const region =
                getEmployeeRegion(
                    employee
                );

            const state =
                getEmployeeState(
                    employee
                );

            if (
                selectedRegion &&
                normalize(region) !==
                normalize(selectedRegion)
            ) {

                return;

            }

            if (state) {

                const key =
                    normalize(state);

                if (
                    !states.has(key)
                ) {

                    states.set(
                        key,
                        state
                    );

                }

            }

        }
    );

    stateFilter.innerHTML = `

        <option value="">
            All States
        </option>

    `;

    [...states.values()]
        .sort(
            (a, b) =>
                a.localeCompare(b)
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

    const baseEmployees =
        getCurrentRegionUserEmployees();

    const cities =
        new Map();

    baseEmployees.forEach(
        employee => {

            const region =
                getEmployeeRegion(
                    employee
                );

            const state =
                getEmployeeState(
                    employee
                );

            const city =
                getEmployeeCity(
                    employee
                );

            if (
                selectedRegion &&
                normalize(region) !==
                normalize(selectedRegion)
            ) {

                return;

            }

            if (
                selectedState &&
                normalize(state) !==
                normalize(selectedState)
            ) {

                return;

            }

            if (city) {

                const key =
                    normalize(city);

                if (
                    !cities.has(key)
                ) {

                    cities.set(
                        key,
                        city
                    );

                }

            }

        }
    );

    cityFilter.innerHTML = `

        <option value="">
            All Cities
        </option>

    `;

    [...cities.values()]
        .sort(
            (a, b) =>
                a.localeCompare(b)
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

}


// ======================================================
// EMPLOYEE DROPDOWN
// ======================================================

function loadEmployeeDropdown() {

    if (!employeeFilter) {

        return;

    }

    let list =
        getCurrentRegionUserEmployees();

    const region =
        String(
            regionFilter?.value || ""
        ).trim();

    const state =
        String(
            stateFilter?.value || ""
        ).trim();

    const city =
        String(
            cityFilter?.value || ""
        ).trim();


    if (region) {

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) ===
                    normalize(region)
            );

    }


    if (state) {

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) ===
                    normalize(state)
            );

    }


    if (city) {

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeCity(
                            employee
                        )
                    ) ===
                    normalize(city)
            );

    }


    employeeFilter.innerHTML = `

        <option value="">
            All Employees
        </option>

    `;

    list
        .slice()
        .sort(
            (a, b) =>
                getEmployeeCode(a)
                    .localeCompare(
                        getEmployeeCode(b)
                    )
        )
        .forEach(
            employee => {

                const code =
                    getEmployeeCode(
                        employee
                    );

                const teacherName =

                    employee.teacherName ||

                    employee.teacher_name ||

                    employee.name ||

                    "-";

                if (!code) {

                    return;

                }

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    code;

                option.textContent =
                    code +
                    " - " +
                    teacherName;

                employeeFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// FILTERED EMPLOYEES
// ======================================================

function getFilteredEmployees() {

    let list =
        getCurrentRegionUserEmployees();


    if (
        regionFilter?.value
    ) {

        list =
            list.filter(
                employee =>
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


    if (
        stateFilter?.value
    ) {

        list =
            list.filter(
                employee =>
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


    if (
        cityFilter?.value
    ) {

        list =
            list.filter(
                employee =>
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


    if (
        employeeFilter?.value
    ) {

        list =
            list.filter(
                employee =>
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


    return list;

}


// ======================================================
// SELECTED TITLE
// ======================================================

function updateSelectedTitle() {

    if (!selectedTitle) {

        return;

    }

    let title =
        "All Teachers";


    if (
        employeeFilter?.value
    ) {

        const employee =
            employees.find(
                item =>
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
                getEmployeeCode(employee) +
                " - " +
                teacherName;

        }

    }
    else if (
        cityFilter?.value
    ) {

        title =
            "City: " +
            cityFilter.value;

    }
    else if (
        stateFilter?.value
    ) {

        title =
            "State: " +
            stateFilter.value;

    }
    else if (
        regionFilter?.value
    ) {

        title =
            "Region: " +
            regionFilter.value;

    }
    else if (
        regionUserFilter?.value
    ) {

        const user =
            regionUsers.find(
                item =>
                    String(item.id) ===
                    String(
                        regionUserFilter.value
                    )
            );

        if (user) {

            title =
                "Region User: " +
                (
                    getRegionUserName(user) ||
                    getRegionUserCode(user)
                );

        }

    }


    selectedTitle.textContent =
        title;

}


// ======================================================
// EMPLOYEE TARGET
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
// BUILD ALL-TIME COLLECTION MAP
//
// SAME TEACHER + SAME DATE = SUM
//
// Then all dates are added together.
// ======================================================

function buildTeacherCollectionMap() {

    const teacherDateMap =
        new Map();


    allCollectionEntries.forEach(
        entry => {

            const code =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );

            if (!code) {

                return;

            }

            const date =
                normalizeDate(
                    getEntryDate(
                        entry
                    )
                );


            /*
             * Important:
             * Entries without a date should NOT be merged
             * together because they may be separate records.
             */

            const dateKey =
                date ||
                "no-date-" +
                String(
                    entry.id || ""
                );


            const key =
                code +
                "|" +
                dateKey;


            const oldAmount =
                teacherDateMap.get(
                    key
                ) || 0;


            teacherDateMap.set(
                key,
                oldAmount +
                getEntryAmount(entry)
            );

        }
    );


    const teacherTotalMap =
        new Map();


    teacherDateMap.forEach(
        (amount, key) => {

            const separator =
                key.indexOf("|");

            if (
                separator === -1
            ) {

                return;

            }

            const code =
                key.substring(
                    0,
                    separator
                );


            const oldTotal =
                teacherTotalMap.get(
                    code
                ) || 0;


            teacherTotalMap.set(
                code,
                oldTotal +
                numberValue(amount)
            );

        }
    );


    return teacherTotalMap;

}


// ======================================================
// DISPLAY SUMMARY
// ======================================================

function displaySummary(list) {

    const collectionMap =
        buildTeacherCollectionMap();

    let totalTarget = 0;

    let totalCollection = 0;

    const rows = [];


    list.forEach(
        employee => {

            const employeeCode =
                getEmployeeCode(
                    employee
                );

            const code =
                normalize(
                    employeeCode
                );

            const collectionAmount =
                collectionMap.get(
                    code
                ) || 0;

            const target =
                getEmployeeTarget(
                    employee
                );

            const remaining =
                Math.max(
                    target -
                    collectionAmount,
                    0
                );

            let percentage = 0;


            if (
                target > 0
            ) {

                percentage =
                    (
                        collectionAmount /
                        target
                    ) * 100;

            }


            totalTarget +=
                target;

            totalCollection +=
                collectionAmount;


            rows.push({

                ...employee,

                employeeCode:
                    employeeCode,

                collection:
                    collectionAmount,

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


    const totalPercentage =
        totalTarget > 0
            ? (
                totalCollection /
                totalTarget
            ) * 100
            : 0;


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

                    Is filter ke liye koi Teacher nahi mila.

                </td>

            </tr>

        `;

        if (tableFoot) {

            tableFoot.innerHTML =
                "";

        }

        return;

    }


    let html = "";


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

                getEmployeeRegion(employee),

                getEmployeeState(employee),

                getEmployeeCity(employee),

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
                    value =>
                        `"${String(value)
                            .replace(/"/g, '""')}"`
                ).join(",")

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
        csvRows.join("\n");


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


    setTimeout(
        () =>
            URL.revokeObjectURL(url),
        100
    );

}


// ======================================================
// DOWNLOAD IMAGE
//
// IMPORTANT FIX:
// Clone is created outside viewport.
// Width is calculated from complete table.
// Horizontal overflow is removed.
// Table is forced to full content width.
// Therefore right-side columns should not be cut.
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


    let clone = null;


    try {

        const originalTable =
            downloadArea.querySelector(
                "table"
            );


        if (!originalTable) {

            alert(
                "Summary table nahi mila."
            );

            return;

        }


        /*
         * Calculate complete table width.
         */

        const tableWidth =
            Math.max(
                originalTable.scrollWidth,
                originalTable.offsetWidth,
                originalTable.getBoundingClientRect().width
            );


        /*
         * Minimum width keeps all 11 columns readable.
         */

        const captureWidth =
            Math.max(
                tableWidth,
                1250
            );


        /*
         * Clone complete download area.
         */

        clone =
            downloadArea.cloneNode(
                true
            );


        clone.id =
            "collectionSummaryImageClone";


        /*
         * Put clone far outside viewport.
         */

        clone.style.position =
            "absolute";

        clone.style.left =
            "0";

        clone.style.top =
            "0";

        clone.style.width =
            captureWidth + "px";

        clone.style.minWidth =
            captureWidth + "px";

        clone.style.maxWidth =
            "none";

        clone.style.height =
            "auto";

        clone.style.minHeight =
            "0";

        clone.style.maxHeight =
            "none";

        clone.style.overflow =
            "visible";

        clone.style.overflowX =
            "visible";

        clone.style.backgroundColor =
            "#ffffff";

        clone.style.zIndex =
            "-99999";


        /*
         * Force every parent inside clone
         * to allow full width.
         */

        const allElements =
            clone.querySelectorAll("*");


        allElements.forEach(
            element => {

                const style =
                    element.style;

                style.maxWidth =
                    "none";

                if (
                    element.classList.contains(
                        "table-wrapper"
                    )
                ) {

                    style.width =
                        captureWidth + "px";

                    style.minWidth =
                        captureWidth + "px";

                    style.maxWidth =
                        "none";

                    style.overflow =
                        "visible";

                    style.overflowX =
                        "visible";

                    style.height =
                        "auto";

                }

            }
        );


        /*
         * Force table width.
         */

        const cloneTable =
            clone.querySelector(
                "table"
            );


        if (cloneTable) {

            cloneTable.style.width =
                captureWidth + "px";

            cloneTable.style.minWidth =
                captureWidth + "px";

            cloneTable.style.maxWidth =
                "none";

            cloneTable.style.tableLayout =
                "auto";

            cloneTable.style.margin =
                "0";

        }


        /*
         * Make all table cells visible.
         */

        clone
            .querySelectorAll(
                "th, td"
            )
            .forEach(
                cell => {

                    cell.style.whiteSpace =
                        "nowrap";

                    cell.style.overflow =
                        "visible";

                    cell.style.textOverflow =
                        "clip";

                }
            );


        /*
         * Add clone to body.
         */

        document.body.appendChild(
            clone
        );


        /*
         * Wait for browser layout.
         */

        await new Promise(
            resolve => {

                requestAnimationFrame(
                    () => {

                        requestAnimationFrame(
                            resolve
                        );

                    }
                );

            }
        );


        const finalWidth =
            Math.max(
                captureWidth,
                clone.scrollWidth,
                clone.offsetWidth,
                cloneTable
                    ? cloneTable.scrollWidth
                    : 0
            );


        const finalHeight =
            Math.max(
                clone.scrollHeight,
                clone.offsetHeight
            );


        /*
         * Capture complete content.
         */

        const canvas =
            await html2canvas(
                clone,
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


        /*
         * Remove clone.
         */

        if (
            clone &&
            clone.parentNode
        ) {

            clone.parentNode.removeChild(
                clone
            );

            clone = null;

        }


        /*
         * Download PNG.
         */

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
            "Collection Summary Image Error:",
            error
        );


        if (
            clone &&
            clone.parentNode
        ) {

            clone.parentNode.removeChild(
                clone
            );

        }


        const oldClone =
            document.getElementById(
                "collectionSummaryImageClone"
            );


        if (
            oldClone &&
            oldClone.parentNode
        ) {

            oldClone.parentNode.removeChild(
                oldClone
            );

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


            /*
             * Region dropdown is also rebuilt
             * according to selected Region User.
             */

            loadRegionDropdown();

            updateStateDropdown();

            updateCityDropdown();

            loadEmployeeDropdown();

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
// RESET
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
// CSV BUTTON
// ======================================================

if (downloadCSV) {

    downloadCSV.addEventListener(
        "click",
        downloadFilteredCSV
    );

}


// ======================================================
// IMAGE BUTTON
// ======================================================

if (downloadImage) {

    downloadImage.addEventListener(
        "click",
        downloadFilteredImage
    );

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
// LOAD DATA
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


        // ==================================================
        // EMPLOYEES
        // ==================================================

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        employees = [];


        employeeSnapshot.forEach(
            doc => {

                employees.push({

                    id:
                        doc.id,

                    ...doc.data()

                });

            }
        );


        // ==================================================
        // REGION USERS
        // ==================================================

        const regionUserSnapshot =
            await getDocs(
                collection(
                    db,
                    "regionUsers"
                )
            );


        regionUsers = [];


        regionUserSnapshot.forEach(
            doc => {

                regionUsers.push({

                    id:
                        doc.id,

                    ...doc.data()

                });

            }
        );


        // ==================================================
        // OLD DAILY ENTRY
        // ==================================================

        dailyEntries =
            await loadCollectionData(
                "daily_entry"
            );


        // ==================================================
        // NEW TEACHER ENTRIES
        // ==================================================

        teacherEntries =
            await loadCollectionData(
                "teacher_entries"
            );


        // ==================================================
        // MERGE BOTH SOURCES
        // ==================================================

        allCollectionEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        console.log(
            "Collection Summary Loaded:",
            {

                employees:
                    employees.length,

                regionUsers:
                    regionUsers.length,

                dailyEntries:
                    dailyEntries.length,

                teacherEntries:
                    teacherEntries.length,

                totalEntries:
                    allCollectionEntries.length

            }
        );


        // ==================================================
        // LOAD FILTERS
        // ==================================================

        loadRegionUserDropdown();

        loadRegionDropdown();

        updateStateDropdown();

        updateCityDropdown();

        loadEmployeeDropdown();


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
// START
// ======================================================

loadData();
