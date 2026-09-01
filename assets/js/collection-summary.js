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
// - daily_entry + teacher_entries merged
// - Same Teacher + Same Date = SUM
// - Collection Summary = ALL TIME
// - Region User filter supported
// - Region / State / City / Employee filters
// - CSV Download
// - Image Download
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
        .toLowerCase()
        .replace(/\s+/g, " ");

}


// ======================================================
// NUMBER
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
// MONEY
// ======================================================

function formatMoney(amount) {

    return "₹ " +
        numberValue(amount)
            .toLocaleString("en-IN");

}


// ======================================================
// EMPLOYEE CODE
// ======================================================

function getEmployeeCode(employee) {

    if (!employee) {
        return "";
    }

    return String(

        employee.employeeCode ??

        employee.employee_code ??

        employee.empCode ??

        employee.emp_code ??

        employee.employeeID ??

        employee.employeeId ??

        employee.userCode ??

        employee.user_code ??

        employee.teacherCode ??

        employee.teacher_code ??

        employee.code ??

        ""

    ).trim();

}


// ======================================================
// ENTRY EMPLOYEE CODE
// ======================================================

function getEntryEmployeeCode(entry) {

    if (!entry) {
        return "";
    }

    return String(

        entry.employeeCode ??

        entry.employee_code ??

        entry.empCode ??

        entry.emp_code ??

        entry.employeeID ??

        entry.employeeId ??

        entry.userCode ??

        entry.user_code ??

        entry.emp_id ??

        entry.employee ??

        entry.teacherCode ??

        entry.teacher_code ??

        entry.code ??

        ""

    ).trim();

}


// ======================================================
// ENTRY AMOUNT
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
// ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    if (!entry) {
        return "";
    }

    return (

        entry.date ??

        entry.entryDate ??

        entry.collectionDate ??

        entry.collection_date ??

        entry.createdDate ??

        entry.created_date ??

        ""

    );

}


// ======================================================
// DATE FORMAT
// ======================================================

function formatDateForInput(date) {

    if (!(date instanceof Date)) {
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

        return formatDateForInput(parsed);

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

function getRegionUserName(user) {

    if (!user) {
        return "";
    }

    return String(

        user.name ??

        user.userName ??

        user.username ??

        user.regionUserName ??

        user.region_user_name ??

        user.displayName ??

        user.fullName ??

        user.employeeName ??

        user.employee_name ??

        ""

    ).trim();

}


// ======================================================
// REGION USER CODE
// ======================================================

function getRegionUserCode(user) {

    if (!user) {
        return "";
    }

    return String(

        user.userCode ??

        user.user_code ??

        user.regionUserCode ??

        user.region_user_code ??

        user.employeeCode ??

        user.employee_code ??

        user.empCode ??

        user.emp_code ??

        user.code ??

        ""

    ).trim();

}


// ======================================================
// REGION USER IDENTIFIERS
//
// IMPORTANT:
// Region User dropdown matching can use:
// id
// docId
// userCode
// employeeCode
// regionUserCode
// ======================================================

function getRegionUserIdentifiers(user) {

    if (!user) {
        return [];
    }

    const values = [

        user.id,

        user.docId,

        user.docID,

        user.documentId,

        user.userId,

        user.userID,

        user.uid,

        user.userCode,

        user.user_code,

        user.regionUserCode,

        user.region_user_code,

        user.employeeCode,

        user.employee_code,

        user.empCode,

        user.emp_code,

        user.code

    ];

    return [

        ...new Set(

            values

                .filter(
                    value =>
                        value !==
                        null &&
                        value !==
                        undefined &&
                        String(value).trim() !== ""
                )

                .map(
                    value =>
                        normalize(value)
                )

        )

    ];

}


// ======================================================
// GET SELECTED REGION USER
//
// IMPORTANT FIX
// ======================================================

function getSelectedRegionUser() {

    if (
        !regionUserFilter ||
        !regionUserFilter.value
    ) {

        return null;

    }

    const selected =
        normalize(
            regionUserFilter.value
        );

    return (

        regionUsers.find(
            user => {

                const identifiers =
                    getRegionUserIdentifiers(
                        user
                    );

                return identifiers.includes(
                    selected
                );

            }
        ) || null

    );

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

    if (typeof value === "string") {

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

        employee?.region ??

        employee?.Region ??

        employee?.assignedRegion ??

        employee?.assigned_region ??

        employee?.regionName ??

        employee?.region_name ??

        ""

    ).trim();

}


// ======================================================
// EMPLOYEE STATE
// ======================================================

function getEmployeeState(employee) {

    return String(

        employee?.state ??

        employee?.State ??

        employee?.assignedState ??

        employee?.assigned_state ??

        employee?.stateName ??

        employee?.state_name ??

        ""

    ).trim();

}


// ======================================================
// EMPLOYEE CITY
// ======================================================

function getEmployeeCity(employee) {

    return String(

        employee?.city ??

        employee?.City ??

        employee?.assignedCity ??

        employee?.assigned_city ??

        employee?.cityName ??

        employee?.city_name ??

        ""

    ).trim();

}


// ======================================================
// REGION USER DIRECT REGION
// ======================================================

function getRegionUserRegion(user) {

    return String(

        user?.region ??

        user?.Region ??

        user?.assignedRegion ??

        user?.assigned_region ??

        user?.regionName ??

        user?.region_name ??

        ""

    ).trim();

}


// ======================================================
// COLLECT TEXT VALUES
// ======================================================

function collectTextValues(
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

        const text =
            String(value).trim();

        if (text) {
            result.add(
                normalize(text)
            );
        }

        return;

    }

    if (Array.isArray(value)) {

        value.forEach(
            item => {

                collectTextValues(
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

        Object.values(value)
            .forEach(
                item => {

                    collectTextValues(
                        item,
                        result,
                        depth + 1
                    );

                }
            );

    }

}


// ======================================================
// GET REGION USER STATES
// ======================================================

function getRegionUserStates(user) {

    const result =
        new Set();

    if (!user) {
        return [];
    }

    const fields = [

        "state",
        "State",
        "states",
        "selectedState",
        "selected_state",
        "selectedStates",
        "selected_states",
        "assignedState",
        "assigned_state",
        "assignedStates",
        "assigned_states",
        "stateName",
        "state_name",
        "stateNames",
        "state_names",
        "assignedStateNames",
        "assigned_state_names"

    ];

    fields.forEach(
        field => {

            if (
                user[field] !==
                undefined
            ) {

                collectTextValues(
                    user[field],
                    result
                );

            }

        }
    );

    return [
        ...result
    ];

}


// ======================================================
// GET REGION USER CITIES
// ======================================================

function getRegionUserCities(user) {

    const result =
        new Set();

    if (!user) {
        return [];
    }

    const fields = [

        "city",
        "City",
        "cities",
        "selectedCity",
        "selected_city",
        "selectedCities",
        "selected_cities",
        "assignedCity",
        "assigned_city",
        "assignedCities",
        "assigned_cities",
        "cityName",
        "city_name",
        "cityNames",
        "city_names",
        "assignedCityNames",
        "assigned_city_names"

    ];

    fields.forEach(
        field => {

            if (
                user[field] !==
                undefined
            ) {

                collectTextValues(
                    user[field],
                    result
                );

            }

        }
    );

    return [
        ...result
    ];

}


// ======================================================
// ACCESS RULES
// ======================================================

function getRegionUserAccessRules(user) {

    if (!user) {
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
        "assigned_access",
        "assignments",
        "assignment",
        "locations",
        "location"

    ];

    fields.forEach(
        field => {

            const value =
                user[field];

            if (
                Array.isArray(value)
            ) {

                value.forEach(
                    item => {

                        if (
                            item &&
                            typeof item ===
                            "object"
                        ) {

                            rules.push(
                                item
                            );

                        }

                    }
                );

            }
            else if (
                value &&
                typeof value ===
                "object"
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

        rule?.region ??

        rule?.Region ??

        rule?.assignedRegion ??

        rule?.assigned_region ??

        rule?.regionName ??

        rule?.region_name ??

        ""

    ).trim();

}


// ======================================================
// RULE STATES
// ======================================================

function getRuleStates(rule) {

    const result =
        new Set();

    if (!rule) {
        return [];
    }

    const fields = [

        "state",
        "State",
        "states",
        "selectedState",
        "selected_state",
        "selectedStates",
        "selected_states",
        "assignedState",
        "assigned_state",
        "assignedStates",
        "assigned_states",
        "stateName",
        "state_name",
        "stateNames",
        "state_names"

    ];

    fields.forEach(
        field => {

            if (
                rule[field] ===
                undefined
            ) {
                return;
            }

            collectTextValues(
                rule[field],
                result
            );

        }
    );

    return [
        ...result
    ];

}


// ======================================================
// RULE CITIES
// ======================================================

function getRuleCities(rule) {

    const result =
        new Set();

    if (!rule) {
        return [];
    }

    const fields = [

        "city",
        "City",
        "cities",
        "selectedCity",
        "selected_city",
        "selectedCities",
        "selected_cities",
        "assignedCity",
        "assigned_city",
        "assignedCities",
        "assigned_cities",
        "cityName",
        "city_name",
        "cityNames",
        "city_names"

    ];

    fields.forEach(
        field => {

            if (
                rule[field] ===
                undefined
            ) {
                return;
            }

            collectTextValues(
                rule[field],
                result
            );

        }
    );

    return [
        ...result
    ];

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

            rule.accessType ??

            rule.access_type ??

            rule.type ??

            rule.scope ??

            rule.level ??

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
// ASSIGNED EMPLOYEE CODES
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

        const text =
            String(value).trim();

        if (text) {

            result.add(
                normalize(text)
            );

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

        const code =

            value.employeeCode ??

            value.employee_code ??

            value.empCode ??

            value.emp_code ??

            value.employeeID ??

            value.employeeId ??

            value.userCode ??

            value.user_code ??

            value.teacherCode ??

            value.teacher_code ??

            value.code;

        if (code) {

            result.add(
                normalize(code)
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

function getRegionUserAssignedCodes(user) {

    const result =
        new Set();

    if (!user) {
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
                user[field] !==
                undefined
            ) {

                collectEmployeeCodes(
                    user[field],
                    result
                );

            }

        }
    );

    return result;

}


// ======================================================
// MATCH ACCESS RULE
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


    // Region must match if rule has region
    if (
        ruleRegion &&
        employeeRegion !==
        ruleRegion
    ) {

        return false;

    }


    // Full region
    if (
        isFullRegionRule(rule)
    ) {

        return true;

    }


    // State restriction
    if (
        states.length > 0 &&
        !states.includes(
            employeeState
        )
    ) {

        return false;

    }


    // City restriction
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
//
// IMPORTANT FIX:
//
// DIRECT ASSIGNMENT
// OR
// ACCESS RULE
// OR
// DIRECT REGION/STATE/CITY
//
// All valid matches are combined.
//
// No source can cancel another valid source.
// ======================================================

function getRegionUserEmployees(user) {

    if (!user) {

        return employees.slice();

    }


    const matchedCodes =
        new Set();


    // ==================================================
    // 1. DIRECT EMPLOYEE ASSIGNMENT
    // ==================================================

    const directCodes =
        getRegionUserAssignedCodes(
            user
        );

    employees.forEach(
        employee => {

            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );

            if (
                code &&
                directCodes.has(code)
            ) {

                matchedCodes.add(code);

            }

        }
    );


    // ==================================================
    // 2. ACCESS RULES
    // ==================================================

    const rules =
        getRegionUserAccessRules(
            user
        );

    if (
        rules.length > 0
    ) {

        employees.forEach(
            employee => {

                const matched =
                    rules.some(
                        rule =>
                            employeeMatchesAccessRule(
                                employee,
                                rule
                            )
                    );

                if (matched) {

                    const code =
                        normalize(
                            getEmployeeCode(
                                employee
                            )
                        );

                    if (code) {

                        matchedCodes.add(code);

                    }

                }

            }
        );

    }


    // ==================================================
    // 3. DIRECT REGION / STATE / CITY
    // ==================================================

    const userRegion =
        normalize(
            getRegionUserRegion(
                user
            )
        );

    const userStates =
        getRegionUserStates(
            user
        );

    const userCities =
        getRegionUserCities(
            user
        );


    // IMPORTANT:
    // Region/state/city source is only used when
    // the corresponding field actually exists.

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


                // Region
                if (
                    userRegion &&
                    employeeRegion !==
                    userRegion
                ) {

                    return;

                }


                // States
                if (
                    userStates.length > 0 &&
                    !userStates.includes(
                        employeeState
                    )
                ) {

                    return;

                }


                // Cities
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

                    matchedCodes.add(code);

                }

            }
        );

    }


    // ==================================================
    // FINAL RESULT
    // ==================================================

    const result =
        employees.filter(
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


    // DEBUG
    console.log(
        "===================================="
    );

    console.log(
        "REGION USER FILTER"
    );

    console.log(
        "User:",
        getRegionUserName(user)
    );

    console.log(
        "User Code:",
        getRegionUserCode(user)
    );

    console.log(
        "Direct Codes:",
        [...directCodes]
    );

    console.log(
        "Region:",
        userRegion
    );

    console.log(
        "States:",
        userStates
    );

    console.log(
        "Cities:",
        userCities
    );

    console.log(
        "Access Rules:",
        rules
    );

    console.log(
        "Matched Employees:",
        result.length
    );

    console.log(
        "===================================="
    );


    return result;

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
            user => {

                const name =
                    getRegionUserName(user);

                const code =
                    getRegionUserCode(user);

                const identifiers =
                    getRegionUserIdentifiers(
                        user
                    );

                if (
                    identifiers.length === 0
                ) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                // Prefer Firebase document ID
                // because it is guaranteed unique.
                option.value =
                    user.id ||
                    user.docId ||
                    identifiers[0];


                option.textContent =

                    name && code

                        ? name +
                          " - " +
                          code

                        : name ||
                          code ||
                          option.value;


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

    const map =
        new Map();

    employees.forEach(
        employee => {

            const region =
                getEmployeeRegion(
                    employee
                );

            if (region) {

                const key =
                    normalize(region);

                if (
                    !map.has(key)
                ) {

                    map.set(
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


    [...map.values()]
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

    const user =
        getSelectedRegionUser();

    if (!user) {

        return employees.slice();

    }

    return getRegionUserEmployees(
        user
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
        normalize(
            regionFilter?.value || ""
        );

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
                selectedRegion
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
        normalize(
            regionFilter?.value || ""
        );

    const selectedState =
        normalize(
            stateFilter?.value || ""
        );

    const baseEmployees =
        getCurrentRegionUserEmployees();

    const cities =
        new Map();


    baseEmployees.forEach(
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
                selectedRegion &&
                region !==
                selectedRegion
            ) {

                return;

            }

            if (
                selectedState &&
                state !==
                selectedState
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


    const selectedRegion =
        normalize(
            regionFilter?.value || ""
        );

    const selectedState =
        normalize(
            stateFilter?.value || ""
        );

    const selectedCity =
        normalize(
            cityFilter?.value || ""
        );


    if (selectedRegion) {

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) ===
                    selectedRegion
            );

    }


    if (selectedState) {

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) ===
                    selectedState
            );

    }


    if (selectedCity) {

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeCity(
                            employee
                        )
                    ) ===
                    selectedCity
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

                if (!code) {
                    return;
                }

                const name =

                    employee.teacherName ??

                    employee.teacher_name ??

                    employee.name ??

                    "-";


                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    code;

                option.textContent =
                    code +
                    " - " +
                    name;

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


    if (regionFilter?.value) {

        const region =
            normalize(
                regionFilter.value
            );

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeRegion(
                            employee
                        )
                    ) === region
            );

    }


    if (stateFilter?.value) {

        const state =
            normalize(
                stateFilter.value
            );

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeState(
                            employee
                        )
                    ) === state
            );

    }


    if (cityFilter?.value) {

        const city =
            normalize(
                cityFilter.value
            );

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeCity(
                            employee
                        )
                    ) === city
            );

    }


    if (employeeFilter?.value) {

        const code =
            normalize(
                employeeFilter.value
            );

        list =
            list.filter(
                employee =>
                    normalize(
                        getEmployeeCode(
                            employee
                        )
                    ) === code
            );

    }


    return list;

}


// ======================================================
// TITLE
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

            const name =

                employee.teacherName ??

                employee.teacher_name ??

                employee.name ??

                "-";


            title =
                "Employee Code: " +
                getEmployeeCode(employee) +
                " - " +
                name;

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
            getSelectedRegionUser();

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
// TARGET
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
// COLLECTION MAP
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


            const uniqueDate =
                date ||
                "no-date-" +
                String(
                    entry.id || ""
                );


            const key =
                code +
                "|" +
                uniqueDate;


            const amount =
                getEntryAmount(
                    entry
                );


            teacherDateMap.set(

                key,

                (
                    teacherDateMap.get(key) ||
                    0
                ) + amount

            );

        }
    );


    const teacherTotalMap =
        new Map();


    teacherDateMap.forEach(
        (amount, key) => {

            const index =
                key.indexOf("|");

            if (
                index === -1
            ) {
                return;
            }

            const code =
                key.substring(
                    0,
                    index
                );


            teacherTotalMap.set(

                code,

                (
                    teacherTotalMap.get(code) ||
                    0
                ) + numberValue(amount)

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

            const code =
                getEmployeeCode(
                    employee
                );

            const normalizedCode =
                normalize(code);


            const collection =
                collectionMap.get(
                    normalizedCode
                ) || 0;


            const target =
                getEmployeeTarget(
                    employee
                );


            const remaining =
                Math.max(
                    target -
                    collection,
                    0
                );


            const percentage =
                target > 0
                    ? (
                        collection /
                        target
                    ) * 100
                    : 0;


            totalTarget +=
                target;

            totalCollection +=
                collection;


            rows.push({

                ...employee,

                employeeCode:
                    code,

                collection:
                    collection,

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

                    Is filter ke liye koi
                    Teacher nahi mila.

                </td>

            </tr>

        `;


        if (tableFoot) {
            tableFoot.innerHTML = "";
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

                employee.teacherName ??

                employee.teacher_name ??

                employee.name ??

                "-";


            const jamiatulMadina =

                employee.jamiatulMadina ??

                employee.jamiatul_madina ??

                employee.jamiatuMadina ??

                employee.jamiatulMadinah ??

                employee.jamiatul ??

                "-";


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            getEmployeeRegion(employee) || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            getEmployeeState(employee) || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            getEmployeeCity(employee) || "-"
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
// CSV DOWNLOAD
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

                employee.teacherName ??

                employee.teacher_name ??

                employee.name ??

                "";


            const jamiatulMadina =

                employee.jamiatulMadina ??

                employee.jamiatul_madina ??

                employee.jamiatuMadina ??

                employee.jamiatulMadinah ??

                employee.jamiatul ??

                "";


            const row = [

                index + 1,

                getEmployeeRegion(employee),

                getEmployeeState(employee),

                getEmployeeCity(employee),

                jamiatulMadina,

                getEmployeeCode(employee),

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
                            .replace(
                                /"/g,
                                '""'
                            )}"`
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
        document.createElement("a");


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
// IMAGE DOWNLOAD
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

        const table =
            downloadArea.querySelector(
                "table"
            );


        const wrapper =
            downloadArea.querySelector(
                ".table-wrapper"
            );


        let fullWidth =
            downloadArea.scrollWidth;


        if (table) {

            fullWidth =
                Math.max(
                    fullWidth,
                    table.scrollWidth,
                    table.offsetWidth
                );

        }


        if (wrapper) {

            fullWidth =
                Math.max(
                    fullWidth,
                    wrapper.scrollWidth,
                    wrapper.offsetWidth
                );

        }


        fullWidth =
            Math.max(
                fullWidth,
                1250
            );


        clone =
            downloadArea.cloneNode(
                true
            );


        clone.id =
            "collectionSummaryImageClone";


        clone.style.position =
            "absolute";

        clone.style.left =
            "-100000px";

        clone.style.top =
            "0";

        clone.style.width =
            fullWidth + "px";

        clone.style.minWidth =
            fullWidth + "px";

        clone.style.maxWidth =
            "none";

        clone.style.height =
            "auto";

        clone.style.maxHeight =
            "none";

        clone.style.overflow =
            "visible";

        clone.style.background =
            "#ffffff";


        const cloneWrapper =
            clone.querySelector(
                ".table-wrapper"
            );


        if (cloneWrapper) {

            cloneWrapper.style.width =
                fullWidth + "px";

            cloneWrapper.style.maxWidth =
                "none";

            cloneWrapper.style.overflow =
                "visible";

            cloneWrapper.style.height =
                "auto";

        }


        const cloneTable =
            clone.querySelector(
                "table"
            );


        if (cloneTable) {

            cloneTable.style.width =
                "max-content";

            cloneTable.style.minWidth =
                "1250px";

            cloneTable.style.maxWidth =
                "none";

        }


        document.body.appendChild(
            clone
        );


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


        const captureWidth =
            Math.max(

                fullWidth,

                clone.scrollWidth,

                clone.offsetWidth,

                cloneTable
                    ? cloneTable.scrollWidth
                    : 0

            );


        const captureHeight =
            Math.max(

                clone.scrollHeight,

                clone.offsetHeight

            );


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
                        captureWidth,

                    height:
                        captureHeight,

                    windowWidth:
                        captureWidth,

                    windowHeight:
                        captureHeight,

                    scrollX: 0,

                    scrollY: 0

                }
            );


        if (
            clone &&
            clone.parentNode
        ) {

            clone.parentNode.removeChild(
                clone
            );

            clone = null;

        }


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


            // Region User ke employees ke according
            // dependent filters rebuild honge.

            updateStateDropdown();

            updateCityDropdown();

            loadEmployeeDropdown();


            // Region User select karte hi
            // result automatically update.

            applyCurrentFilter();

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
                stateFilter.value = "";
            }

            if (cityFilter) {
                cityFilter.value = "";
            }

            if (employeeFilter) {
                employeeFilter.value = "";
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
                cityFilter.value = "";
            }

            if (employeeFilter) {
                employeeFilter.value = "";
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
                employeeFilter.value = "";
            }

            loadEmployeeDropdown();

        }
    );

}


// ======================================================
// APPLY
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
// CSV
// ======================================================

if (downloadCSV) {

    downloadCSV.addEventListener(
        "click",
        downloadFilteredCSV
    );

}


// ======================================================
// IMAGE
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

                    docId:
                        doc.id,

                    ...doc.data()

                });

            }
        );


        // ==================================================
        // DAILY ENTRY
        // ==================================================

        dailyEntries =
            await loadCollectionData(
                "daily_entry"
            );


        // ==================================================
        // TEACHER ENTRIES
        // ==================================================

        teacherEntries =
            await loadCollectionData(
                "teacher_entries"
            );


        // ==================================================
        // MERGE
        // ==================================================

        allCollectionEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        // ==================================================
        // FILTER DROPDOWNS
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
