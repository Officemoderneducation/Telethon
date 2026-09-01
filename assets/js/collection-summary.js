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
// - Region / State / City / Employee Filter
// - Filtered Data Image Download
// - Filtered Data CSV Download
// - Old Daily Entry functionality is NOT changed
//
// FILTER FIX:
// - Region User can have MULTIPLE States
// - Region User can have MULTIPLE Cities
// - Multiple access rules are combined
// - Direct assignment + access rules + region/state/city
//   are handled together
// - One incomplete assignment source will NOT hide valid data
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

        ""

    ).trim();

}


// ======================================================
// GENERIC VALUE TO ARRAY
//
// IMPORTANT:
// Handles:
// - string
// - number
// - array
// - object
// - comma separated values
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


        // Support comma separated values
        if (
            text.includes(",")
        ) {

            return text
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

        }


        return [text];

    }


    return [value];

}


// ======================================================
// EXTRACT TEXT FROM ASSIGNMENT OBJECT
// ======================================================

function extractTextValues(
    value,
    fields
) {

    const result = [];


    function walk(
        current,
        depth = 0
    ) {

        if (
            current === null ||
            current === undefined ||
            depth > 8
        ) {

            return;

        }


        if (
            typeof current === "string" ||
            typeof current === "number"
        ) {

            const text =
                String(current).trim();


            if (text) {

                result.push(text);

            }


            return;

        }


        if (
            Array.isArray(current)
        ) {

            current.forEach(
                item => {

                    walk(
                        item,
                        depth + 1
                    );

                }
            );


            return;

        }


        if (
            typeof current !== "object"
        ) {

            return;

        }


        fields.forEach(
            field => {

                if (
                    current[field] !==
                    undefined
                ) {

                    valueToArray(
                        current[field]
                    ).forEach(
                        item => {

                            if (
                                typeof item ===
                                "object"
                            ) {

                                walk(
                                    item,
                                    depth + 1
                                );

                            }
                            else {

                                const text =
                                    String(item)
                                        .trim();


                                if (text) {

                                    result.push(
                                        text
                                    );

                                }

                            }

                        }
                    );

                }

            }
        );

    }


    walk(value);


    return [
        ...new Set(
            result
                .map(
                    item =>
                        String(item).trim()
                )
                .filter(Boolean)
        )
    ];

}


// ======================================================
// GET EMPLOYEE REGION
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
// GET EMPLOYEE STATE
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
// GET EMPLOYEE CITY
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
// GET REGION USER REGION
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
// GET REGION USER STATES
//
// FIXED:
// Reads ALL possible state fields.
// Supports:
// - state
// - states
// - selectedStates
// - assignedStates
// - nested objects
// - arrays
// - comma separated values
// ======================================================

function getRegionUserStates(regionUser) {

    if (!regionUser) {

        return [];

    }


    const stateFields = [

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

        "assigned_state_names",

        "locations",

        "location",

        "assignments",

        "assignment"

    ];


    const result = [];


    function collect(
        value,
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

                // Support comma separated states
                text
                    .split(",")
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean)
                    .forEach(
                        item =>
                            result.push(item)
                    );

            }


            return;

        }


        if (
            Array.isArray(value)
        ) {

            value.forEach(
                item => {

                    collect(
                        item,
                        depth + 1
                    );

                }
            );


            return;

        }


        if (
            typeof value === "object"
        ) {

            stateFields.forEach(
                field => {

                    if (
                        value[field] !==
                        undefined
                    ) {

                        collect(
                            value[field],
                            depth + 1
                        );

                    }

                }
            );

        }

    }


    collect(regionUser);


    return [
        ...new Set(
            result
                .map(
                    state =>
                        normalize(state)
                )
                .filter(Boolean)
        )
    ];

}


// ======================================================
// GET REGION USER CITIES
// ======================================================

function getRegionUserCities(regionUser) {

    if (!regionUser) {

        return [];

    }


    const cityFields = [

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

        "assigned_city_names",

        "locations",

        "location",

        "assignments",

        "assignment"

    ];


    const result = [];


    function collect(
        value,
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

                text
                    .split(",")
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean)
                    .forEach(
                        item =>
                            result.push(item)
                    );

            }


            return;

        }


        if (
            Array.isArray(value)
        ) {

            value.forEach(
                item => {

                    collect(
                        item,
                        depth + 1
                    );

                }
            );


            return;

        }


        if (
            typeof value === "object"
        ) {

            cityFields.forEach(
                field => {

                    if (
                        value[field] !==
                        undefined
                    ) {

                        collect(
                            value[field],
                            depth + 1
                        );

                    }

                }
            );

        }

    }


    collect(regionUser);


    return [
        ...new Set(
            result
                .map(
                    city =>
                        normalize(city)
                )
                .filter(Boolean)
        )
    ];

}


// ======================================================
// GET REGION USER ACCESS RULES
// ======================================================

function getRegionUserAccessRules(
    regionUser
) {

    if (!regionUser) {

        return [];

    }


    const rules = [];


    const possibleFields = [

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


    possibleFields.forEach(
        field => {

            const value =
                regionUser[field];


            if (
                Array.isArray(value)
            ) {

                value.forEach(
                    item => {

                        if (
                            item &&
                            typeof item === "object"
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
                typeof value === "object"
            ) {

                rules.push(
                    value
                );

            }

        }
    );


    return rules;

}


// ======================================================
// GET RULE REGION
// ======================================================

function getRuleRegion(rule) {

    if (!rule) {

        return "";

    }


    return String(

        rule.region ||

        rule.Region ||

        rule.assignedRegion ||

        rule.assigned_region ||

        rule.regionName ||

        rule.region_name ||

        ""

    ).trim();

}


// ======================================================
// GET RULE STATES
//
// FIXED:
// ALL states from a rule are returned.
// ======================================================

function getRuleStates(rule) {

    if (!rule) {

        return [];

    }


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


    const result = [];


    fields.forEach(
        field => {

            if (
                rule[field] ===
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
                        typeof value ===
                        "object"
                    ) {

                        fields.forEach(
                            nestedField => {

                                if (
                                    value[
                                        nestedField
                                    ] !==
                                    undefined
                                ) {

                                    valueToArray(
                                        value[
                                            nestedField
                                        ]
                                    ).forEach(
                                        item => {

                                            const text =
                                                String(
                                                    item
                                                ).trim();


                                            if (
                                                text
                                            ) {

                                                result.push(
                                                    normalize(
                                                        text
                                                    )
                                                );

                                            }

                                        }
                                    );

                                }

                            }
                        );

                    }
                    else {

                        const text =
                            String(value)
                                .trim();


                        if (text) {

                            text
                                .split(",")
                                .map(
                                    item =>
                                        item.trim()
                                )
                                .filter(Boolean)
                                .forEach(
                                    item => {

                                        result.push(
                                            normalize(
                                                item
                                            )
                                        );

                                    }
                                );

                        }

                    }

                }
            );

        }
    );


    return [
        ...new Set(
            result.filter(Boolean)
        )
    ];

}


// ======================================================
// GET RULE CITIES
// ======================================================

function getRuleCities(rule) {

    if (!rule) {

        return [];

    }


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


    const result = [];


    fields.forEach(
        field => {

            if (
                rule[field] ===
                undefined
            ) {

                return;

            }


            valueToArray(
                rule[field]
            ).forEach(
                value => {

                    const text =
                        String(value).trim();


                    if (text) {

                        text
                            .split(",")
                            .map(
                                item =>
                                    item.trim()
                            )
                            .filter(Boolean)
                            .forEach(
                                item =>
                                    result.push(
                                        normalize(item)
                                    )
                            );

                    }

                }
            );

        }
    );


    return [
        ...new Set(
            result.filter(Boolean)
        )
    ];

}


// ======================================================
// CHECK FULL REGION RULE
// ======================================================

function isFullRegionRule(rule) {

    if (!rule) {

        return false;

    }


    const accessType =
        normalize(

            rule.accessType ||

            rule.access_type ||

            rule.type ||

            rule.scope ||

            rule.level ||

            ""

        );


    if (

        accessType === "fullregion" ||

        accessType === "full_region" ||

        accessType === "full region" ||

        accessType === "region" ||

        accessType === "full"

    ) {

        return true;

    }


    if (
        rule.fullRegion === true ||
        rule.full_region === true
    ) {

        return true;

    }


    if (
        rule.allStates === true ||
        rule.all_states === true
    ) {

        return true;

    }


    return false;

}


// ======================================================
// EMPLOYEE CODE ASSIGNMENT EXTRACTION
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
            String(value).trim();


        if (code) {

            result.add(
                normalize(code)
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
                normalize(
                    directCode
                )
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
// GET REGION USER ASSIGNED CODES
// ======================================================

function getRegionUserAssignedCodes(
    regionUser
) {

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
// EMPLOYEE MATCH ACCESS RULE
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


    const ruleStates =
        getRuleStates(
            rule
        );


    const ruleCities =
        getRuleCities(
            rule
        );


    // ==============================================
    // REGION
    // ==============================================

    if (
        ruleRegion &&
        employeeRegion !==
        ruleRegion
    ) {

        return false;

    }


    // ==============================================
    // FULL REGION
    // ==============================================

    if (
        isFullRegionRule(rule)
    ) {

        return true;

    }


    // ==============================================
    // STATE
    // ==============================================

    if (
        ruleStates.length > 0
    ) {

        if (
            !ruleStates.includes(
                employeeState
            )
        ) {

            return false;

        }

    }


    // ==============================================
    // CITY
    // ==============================================

    if (
        ruleCities.length > 0
    ) {

        if (
            !ruleCities.includes(
                employeeCity
            )
        ) {

            return false;

        }

    }


    return true;

}


// ======================================================
// GET REGION USER EMPLOYEES
//
// IMPORTANT FIX
//
// OLD PROBLEM:
// If direct employee assignment existed, function returned
// only direct employees and completely ignored valid
// State/Region assignments.
//
// NEW LOGIC:
// 1. Direct employee codes
// 2. Access rules
// 3. Direct region/state/city
//
// ALL VALID SOURCES ARE COMBINED.
//
// This prevents:
// Kolkata + Bihar
// Kolkata + Bihar + another state
// Multiple access rules
// from losing teachers.
// ======================================================

function getRegionUserEmployees(
    regionUser
) {

    if (!regionUser) {

        return employees.slice();

    }


    const matchedCodes =
        new Set();


    // ==================================================
    // 1. DIRECT EMPLOYEE ASSIGNMENTS
    // ==================================================

    const assignedCodes =
        getRegionUserAssignedCodes(
            regionUser
        );


    if (
        assignedCodes.size > 0
    ) {

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
                    assignedCodes.has(code)
                ) {

                    matchedCodes.add(
                        code
                    );

                }

            }
        );

    }


    // ==================================================
    // 2. ACCESS RULES
    // ==================================================

    const rules =
        getRegionUserAccessRules(
            regionUser
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

                        matchedCodes.add(
                            code
                        );

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


    // ==================================================
    // DEBUG INFORMATION
    // ==================================================
    //
    // This makes it easier to verify a Region User
    // with multiple states.
    //

    console.log(
        "Region User:",
        getRegionUserName(regionUser),
        {
            region:
                userRegion,

            states:
                userStates,

            cities:
                userCities,

            directEmployeeCodes:
                [...assignedCodes],

            accessRules:
                rules
        }
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


                // ------------------------------------------
                // REGION CHECK
                // ------------------------------------------

                if (
                    userRegion &&
                    employeeRegion !==
                    userRegion
                ) {

                    return;

                }


                // ------------------------------------------
                // STATE CHECK
                //
                // IMPORTANT:
                // includes() allows MULTIPLE STATES.
                // ------------------------------------------

                if (
                    userStates.length > 0 &&
                    !userStates.includes(
                        employeeState
                    )
                ) {

                    return;

                }


                // ------------------------------------------
                // CITY CHECK
                // ------------------------------------------

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


    // ==================================================
    // RETURN FINAL EMPLOYEE LIST
    // ==================================================

    if (
        matchedCodes.size > 0
    ) {

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


    // ==================================================
    // NOTHING MATCHED
    // ==================================================

    return [];

}


// ======================================================
// LOAD REGION USER DROPDOWN
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

                        ? name +
                          " - " +
                          code

                        : name ||
                          code;


                regionUserFilter.appendChild(
                    option
                );

            }
        );

}


// ======================================================
// LOAD REGION DROPDOWN
// ======================================================

function loadRegionDropdown() {

    if (!regionFilter) {

        return;

    }


    const regions =
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
// GET CURRENT REGION USER EMPLOYEES
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
// UPDATE STATE DROPDOWN
//
// IMPORTANT:
// It is rebuilt from the CURRENT Region User employee list.
// Therefore if user has Kolkata + Bihar,
// both states will be shown.
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


    let filteredEmployees =
        getCurrentRegionUserEmployees();


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
                employee =>
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
                employee =>
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
                employee =>
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
            employee => {

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
        getCurrentRegionUserEmployees();


    // ==============================================
    // REGION
    // ==============================================

    if (
        regionFilter?.value
    ) {

        filteredEmployees =
            filteredEmployees.filter(
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


    // ==============================================
    // STATE
    // ==============================================

    if (
        stateFilter?.value
    ) {

        filteredEmployees =
            filteredEmployees.filter(
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


    // ==============================================
    // CITY
    // ==============================================

    if (
        cityFilter?.value
    ) {

        filteredEmployees =
            filteredEmployees.filter(
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


    // ==============================================
    // EMPLOYEE
    // ==============================================

    if (
        employeeFilter?.value
    ) {

        filteredEmployees =
            filteredEmployees.filter(
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


    return filteredEmployees;

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
                getEmployeeCode(
                    employee
                ) +
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

        const regionUser =
            regionUsers.find(
                user =>
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
        entry => {

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
        employee => {

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


            if (
                target > 0
            ) {

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


    if (
        totalTarget > 0
    ) {

        totalPercentage =
            (
                totalCollection /
                totalTarget
            ) * 100;

    }


    // ==============================================
    // SAVE CURRENT DATA
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
                    value =>

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

        const table =
            downloadArea.querySelector(
                "table"
            );


        const tableWrapper =
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


        if (tableWrapper) {

            fullWidth =
                Math.max(
                    fullWidth,
                    tableWrapper.scrollWidth,
                    tableWrapper.offsetWidth
                );

        }


        fullWidth =
            Math.max(
                fullWidth,
                1250
            );


        const clone =
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

        clone.style.maxWidth =
            "none";

        clone.style.minWidth =
            fullWidth + "px";

        clone.style.height =
            "auto";

        clone.style.maxHeight =
            "none";

        clone.style.overflow =
            "visible";

        clone.style.overflowX =
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

            cloneWrapper.style.overflowX =
                "visible";

            cloneWrapper.style.height =
                "auto";

            cloneWrapper.style.maxHeight =
                "none";

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

                    scrollY: 0,

                    x: 0,

                    y: 0

                }

            );


        if (
            clone &&
            clone.parentNode
        ) {

            clone.parentNode.removeChild(
                clone
            );

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


            // ==========================================
            // IMPORTANT:
            // Region User select hote hi uski complete
            // employee list se State/City/Employee dropdown
            // rebuild honge.
            // ==========================================

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
// DOWNLOAD CSV
// ======================================================

if (downloadCSV) {

    downloadCSV.addEventListener(
        "click",
        downloadFilteredCSV
    );

}


// ======================================================
// DOWNLOAD IMAGE
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
// START
// ======================================================

loadData();


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
            employeeDoc => {

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
            regionUserDoc => {

                regionUsers.push({

                    id:
                        regionUserDoc.id,

                    ...regionUserDoc.data()

                });

            }
        );


        // ==============================================
        // OLD DAILY ENTRY
        // ==============================================

        dailyEntries =
            await loadCollectionData(
                "daily_entry"
            );


        // ==============================================
        // NEW TEACHER ENTRIES
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
