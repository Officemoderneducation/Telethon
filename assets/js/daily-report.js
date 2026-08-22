// ======================================================
// TELETHON - DAILY COLLECTION REPORT
// ======================================================
// IMPORTANT:
// 1. Only CURRENT logged-in Region User's teachers.
// 2. User ID / User Code matching has highest priority.
// 3. No Region User mixing.
// 4. Same Employee Code + Date = latest entry only.
// 5. Filters work only inside current user's teachers.
// 6. Admin can see all teachers.
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// COLLECTIONS
// ======================================================

const EMPLOYEES_COLLECTION =
    "employees";

const DAILY_ENTRY_COLLECTION =
    "daily_entry";

const REGION_USERS_COLLECTION =
    "regionUsers";


// ======================================================
// LOCAL STORAGE
// ======================================================

const loggedInEmpCode =
    String(
        localStorage.getItem(
            "loggedInEmpCode"
        ) || ""
    ).trim();


const userRole =
    String(
        localStorage.getItem(
            "userRole"
        ) || ""
    )
    .trim()
    .toLowerCase();


const adminLoggedIn =
    localStorage.getItem(
        "adminLoggedIn"
    ) === "true";


const isAdminFlag =
    localStorage.getItem(
        "isAdmin"
    ) === "true";


const isAdmin =
    adminLoggedIn ||
    isAdminFlag ||
    userRole === "admin";


// ======================================================
// DATA
// ======================================================

let employees = [];

let dailyEntries = [];

let regionUsers = [];

let currentRegionUser = null;

let assignedEmployees = [];


// ======================================================
// FILTER STATE
// ======================================================

let currentFilteredEmployees = [];

let currentFilteredEntries = [];


// ======================================================
// DOM
// ======================================================

const regionUserInfo =
    document.getElementById(
        "regionUserInfo"
    );


const regionUserInfoTop =
    document.getElementById(
        "regionUserInfoTop"
    );


const regionFilter =
    document.getElementById(
        "regionFilter"
    );


const stateFilter =
    document.getElementById(
        "stateFilter"
    );


const cityFilter =
    document.getElementById(
        "cityFilter"
    );


const jamiatulFilter =
    document.getElementById(
        "jamiatulFilter"
    );


const fromDate =
    document.getElementById(
        "fromDate"
    );


const toDate =
    document.getElementById(
        "toDate"
    );


const searchFilter =
    document.getElementById(
        "searchFilter"
    );


const applyFilter =
    document.getElementById(
        "applyFilter"
    );


const resetFilter =
    document.getElementById(
        "resetFilter"
    );


const selectedDateRange =
    document.getElementById(
        "selectedDateRange"
    );


const resultCount =
    document.getElementById(
        "resultCount"
    );


const totalTeachers =
    document.getElementById(
        "totalTeachers"
    );


const grandTotal =
    document.getElementById(
        "grandTotal"
    );


const reportTableHead =
    document.getElementById(
        "reportTableHead"
    );


const reportTableBody =
    document.getElementById(
        "reportTableBody"
    );


const reportTableFoot =
    document.getElementById(
        "reportTableFoot"
    );


// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(
        value ?? ""
    )
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


    const cleaned =
        String(value)
            .replace(/,/g, "")
            .replace(/[₹$]/g, "")
            .trim();


    const number =
        Number(cleaned);


    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ======================================================
// CURRENCY
// ======================================================

function formatCurrency(value) {

    return (
        "₹ " +
        Number(value || 0)
            .toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 0
                }
            )
    );

}


// ======================================================
// EMPLOYEE CODE
// ======================================================

function getEmployeeCode(employee) {

    return String(
        employee?.employeeCode ||
        employee?.employee_code ||
        employee?.empCode ||
        employee?.emp_code ||
        employee?.employeeID ||
        employee?.employeeId ||
        employee?.userCode ||
        employee?.user_code ||
        employee?.id ||
        ""
    ).trim();

}


// ======================================================
// ENTRY EMPLOYEE CODE
// ======================================================

function getEntryEmployeeCode(entry) {

    return String(
        entry?.employee_code ||
        entry?.employeeCode ||
        entry?.empCode ||
        entry?.emp_code ||
        entry?.employeeID ||
        entry?.employeeId ||
        entry?.userCode ||
        entry?.user_code ||
        ""
    ).trim();

}


// ======================================================
// ENTRY AMOUNT
// ======================================================

function getEntryAmount(entry) {

    return numberValue(
        entry?.amount ??
        entry?.collection ??
        entry?.collectionAmount ??
        entry?.totalCollection ??
        entry?.total_collection ??
        0
    );

}


// ======================================================
// EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

    return String(
        employee?.region ||
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
        employee?.cityName ||
        employee?.city_name ||
        ""
    ).trim();

}


// ======================================================
// EMPLOYEE JAMIATUL
// ======================================================

function getEmployeeJamiatul(employee) {

    return String(
        employee?.jamiatul_madina ||
        employee?.jamiatulMadina ||
        employee?.jamiatul ||
        employee?.jamiatulName ||
        employee?.jamiatul_name ||
        ""
    ).trim();

}


// ======================================================
// EMPLOYEE NAME
// ======================================================

function getEmployeeName(employee) {

    return String(
        employee?.teacher_name ||
        employee?.teacherName ||
        employee?.name ||
        employee?.fullName ||
        employee?.full_name ||
        employee?.teacher ||
        ""
    ).trim();

}


// ======================================================
// ENTRY TEACHER NAME
// ======================================================

function getEntryTeacherName(entry) {

    return String(
        entry?.teacher_name ||
        entry?.teacherName ||
        entry?.name ||
        ""
    ).trim();

}


// ======================================================
// ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    return String(
        entry?.date || ""
    ).trim();

}


// ======================================================
// USER CODE
// ======================================================

function getUserCode(user) {

    return String(
        user?.userCode ||
        user?.user_code ||
        user?.employeeCode ||
        user?.employee_code ||
        user?.empCode ||
        user?.emp_code ||
        user?.loginId ||
        user?.loginID ||
        user?.username ||
        user?.id ||
        ""
    ).trim();

}


// ======================================================
// USER NAME
// ======================================================

function getUserName(user) {

    return String(
        user?.userName ||
        user?.username ||
        user?.name ||
        user?.fullName ||
        user?.full_name ||
        "Unknown User"
    ).trim();

}


// ======================================================
// USER REGION
// ======================================================

function getUserRegion(user) {

    return String(
        user?.region ||
        user?.assignedRegion ||
        user?.regionName ||
        user?.region_name ||
        ""
    ).trim();

}


// ======================================================
// USER ACCESS RULES
// ======================================================

function getUserAccessRules(user) {

    if (
        Array.isArray(
            user?.access
        )
    ) {

        return user.access;

    }


    if (
        Array.isArray(
            user?.accessRules
        )
    ) {

        return user.accessRules;

    }


    return [];

}


// ======================================================
// RULE REGION
// ======================================================

function getRuleRegion(rule) {

    return normalize(
        rule?.region ||
        rule?.assignedRegion ||
        rule?.regionName ||
        rule?.region_name ||
        ""
    );

}


// ======================================================
// RULE STATES
// ======================================================

function getRuleStates(rule) {

    if (
        Array.isArray(
            rule?.states
        )
    ) {

        return rule.states;

    }


    if (
        typeof rule?.states ===
        "string"
    ) {

        return [
            rule.states
        ];

    }


    if (
        Array.isArray(
            rule?.selectedStates
        )
    ) {

        return rule.selectedStates;

    }


    if (
        Array.isArray(
            rule?.assignedStates
        )
    ) {

        return rule.assignedStates;

    }


    if (
        rule?.state
    ) {

        return [
            rule.state
        ];

    }


    if (
        rule?.stateName
    ) {

        return [
            rule.stateName
        ];

    }


    return [];

}


// ======================================================
// FULL REGION RULE
// ======================================================

function isFullRegionRule(rule) {

    if (!rule) {

        return false;

    }


    return (
        rule.fullRegion === true ||

        normalize(
            rule.fullRegion
        ) === "true" ||

        normalize(
            rule.fullRegion
        ) === "yes" ||

        normalize(
            rule.accessType
        ) === "full" ||

        normalize(
            rule.type
        ) === "full"
    );

}


// ======================================================
// EMPLOYEE ACCESS
// ======================================================

function employeeMatchesAccess(
    employee,
    user
) {

    if (!user) {

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


    const accessRules =
        getUserAccessRules(
            user
        );


    const directRegion =
        normalize(
            getUserRegion(
                user
            )
        );


    // ==================================================
    // ACCESS RULES AVAILABLE
    // ==================================================

    if (
        accessRules.length > 0
    ) {

        return accessRules.some(
            function (rule) {

                if (!rule) {

                    return false;

                }


                const assignedRegion =
                    getRuleRegion(
                        rule
                    );


                // Region must match
                if (
                    assignedRegion &&
                    assignedRegion !==
                    employeeRegion
                ) {

                    return false;

                }


                // Full region
                if (
                    isFullRegionRule(
                        rule
                    )
                ) {

                    return true;

                }


                const states =
                    getRuleStates(
                        rule
                    );


                // No state restriction
                if (
                    states.length === 0
                ) {

                    return true;

                }


                return states.some(
                    function (state) {

                        const normalizedState =
                            normalize(
                                state
                            );


                        if (
                            normalizedState === "*" ||
                            normalizedState === "all" ||
                            normalizedState === "all states"
                        ) {

                            return true;

                        }


                        return (
                            normalizedState ===
                            employeeState
                        );

                    }
                );

            }
        );

    }


    // ==================================================
    // OLD DIRECT REGION FORMAT
    // ==================================================

    if (
        directRegion
    ) {

        return (
            directRegion ===
            employeeRegion
        );

    }


    return false;

}


// ======================================================
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    const snapshot =
        await getDocs(
            collection(
                db,
                EMPLOYEES_COLLECTION
            )
        );


    employees = [];


    snapshot.forEach(
        function (docSnapshot) {

            employees.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data()

            });

        }
    );


    console.log(
        "Daily Report Employees:",
        employees.length
    );

}


// ======================================================
// LOAD DAILY ENTRIES
// ======================================================

async function loadDailyEntries() {

    try {

        const entriesQuery =
            query(
                collection(
                    db,
                    DAILY_ENTRY_COLLECTION
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                entriesQuery
            );


        dailyEntries = [];


        snapshot.forEach(
            function (docSnapshot) {

                dailyEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "createdAt orderBy failed. Loading without orderBy.",
            error
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    DAILY_ENTRY_COLLECTION
                )
            );


        dailyEntries = [];


        snapshot.forEach(
            function (docSnapshot) {

                dailyEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );

    }


    console.log(
        "Daily Report Entries:",
        dailyEntries.length
    );

}


// ======================================================
// LOAD REGION USERS
// ======================================================

async function loadRegionUsers() {

    const snapshot =
        await getDocs(
            collection(
                db,
                REGION_USERS_COLLECTION
            )
        );


    regionUsers = [];


    snapshot.forEach(
        function (docSnapshot) {

            regionUsers.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data()

            });

        }
    );


    console.log(
        "Daily Report Region Users:",
        regionUsers.length
    );

}


// ======================================================
// FIND CURRENT REGION USER
// ======================================================
// IMPORTANT:
// Exact ID / code first.
// Name / region is NEVER used to select another user.
// ======================================================

function findCurrentRegionUser() {

    if (isAdmin) {

        return null;

    }


    const loginCode =
        normalize(
            loggedInEmpCode
        );


    if (!loginCode) {

        console.error(
            "loggedInEmpCode missing."
        );

        return null;

    }


    // ==================================================
    // 1. FIRESTORE DOCUMENT ID
    // ==================================================

    let exactUser =
        regionUsers.find(
            function (user) {

                return (
                    normalize(
                        user.id
                    ) ===
                    loginCode
                );

            }
        );


    if (exactUser) {

        console.log(
            "Region User matched by document ID:",
            exactUser
        );

        return exactUser;

    }


    // ==================================================
    // 2. USER CODE
    // ==================================================

    exactUser =
        regionUsers.find(
            function (user) {

                return (
                    normalize(
                        getUserCode(
                            user
                        )
                    ) ===
                    loginCode
                );

            }
        );


    if (exactUser) {

        console.log(
            "Region User matched by User Code:",
            exactUser
        );

        return exactUser;

    }


    // ==================================================
    // 3. EXPLICIT REGION USER FIELDS
    // ==================================================

    exactUser =
        regionUsers.find(
            function (user) {

                const possibleIds = [

                    user.regionUserId,
                    user.region_user_id,
                    user.regionUserCode,
                    user.region_user_code,
                    user.loginId,
                    user.loginID

                ];


                return possibleIds.some(
                    function (value) {

                        return (
                            normalize(
                                value
                            ) ===
                            loginCode
                        );

                    }
                );

            }
        );


    if (exactUser) {

        console.log(
            "Region User matched by explicit ID field:",
            exactUser
        );

        return exactUser;

    }


    // ==================================================
    // IMPORTANT:
    // DO NOT MATCH BY:
    // - region name
    // - user name
    // - saved regionUserName
    // ==================================================

    console.error(
        "Current Region User NOT FOUND for:",
        loggedInEmpCode
    );


    return null;

}


// ======================================================
// GET ASSIGNED EMPLOYEES
// ======================================================

function getAssignedEmployees() {

    // ==================================================
    // ADMIN
    // ==================================================

    if (isAdmin) {

        return [
            ...employees
        ];

    }


    // ==================================================
    // REGION USER
    // ==================================================

    if (
        !currentRegionUser
    ) {

        return [];

    }


    const result =
        employees.filter(
            function (employee) {

                return employeeMatchesAccess(
                    employee,
                    currentRegionUser
                );

            }
        );


    console.log(
        "CURRENT USER:",
        getUserName(
            currentRegionUser
        )
    );


    console.log(
        "CURRENT USER ID:",
        getUserCode(
            currentRegionUser
        )
    );


    console.log(
        "ASSIGNED TEACHERS:",
        result
    );


    return result;

}


// ======================================================
// GET CREATED TIME
// ======================================================

function getCreatedTime(entry) {

    const createdAt =
        entry?.createdAt;


    if (
        createdAt &&
        typeof createdAt.toMillis ===
        "function"
    ) {

        return createdAt.toMillis();

    }


    if (
        createdAt &&
        typeof createdAt.seconds ===
        "number"
    ) {

        return (
            Number(
                createdAt.seconds
            ) * 1000
        );

    }


    if (
        createdAt instanceof Date
    ) {

        return createdAt.getTime();

    }


    if (
        typeof createdAt ===
        "number"
    ) {

        return createdAt;

    }


    const time =
        new Date(
            createdAt
        ).getTime();


    return Number.isFinite(
        time
    )
        ? time
        : 0;

}


// ======================================================
// GET LATEST ENTRY
// ======================================================
// Same Employee Code + same Date:
// only latest createdAt entry is used.
// ======================================================

function getLatestEntries() {

    const latestMap =
        new Map();


    dailyEntries.forEach(
        function (entry) {

            const employeeCode =
                getEntryEmployeeCode(
                    entry
                );


            const date =
                getEntryDate(
                    entry
                );


            if (
                !employeeCode ||
                !date
            ) {

                return;

            }


            const key =
                normalize(
                    employeeCode
                ) +
                "_" +
                date;


            const existing =
                latestMap.get(
                    key
                );


            if (!existing) {

                latestMap.set(
                    key,
                    entry
                );

                return;

            }


            const currentTime =
                getCreatedTime(
                    entry
                );


            const existingTime =
                getCreatedTime(
                    existing
                );


            if (
                currentTime >=
                existingTime
            ) {

                latestMap.set(
                    key,
                    entry
                );

            }

        }
    );


    return Array.from(
        latestMap.values()
    );

}


// ======================================================
// EMPLOYEE CODE SET
// ======================================================

function getAssignedEmployeeCodeSet(
    employeeList
) {

    const set =
        new Set();


    employeeList.forEach(
        function (employee) {

            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            if (code) {

                set.add(
                    code
                );

            }

        }
    );


    return set;

}


// ======================================================
// DATE RANGE
// ======================================================

function getAllDates(
    startDate,
    endDate
) {

    const dates = [];


    if (
        !startDate ||
        !endDate
    ) {

        return dates;

    }


    let current =
        new Date(
            startDate +
            "T00:00:00"
        );


    const end =
        new Date(
            endDate +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            current.getTime()
        ) ||
        Number.isNaN(
            end.getTime()
        )
    ) {

        return dates;

    }


    while (
        current <= end
    ) {

        const year =
            current.getFullYear();


        const month =
            String(
                current.getMonth() + 1
            )
            .padStart(
                2,
                "0"
            );


        const day =
            String(
                current.getDate()
            )
            .padStart(
                2,
                "0"
            );


        dates.push(
            `${year}-${month}-${day}`
        );


        current.setDate(
            current.getDate() + 1
        );

    }


    return dates;

}


// ======================================================
// DEFAULT DATE RANGE
// ======================================================

function setDefaultDates() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        )
        .padStart(
            2,
            "0"
        );


    const todayString =
        `${year}-${month}-${day}`;


    fromDate.value =
        todayString;


    toDate.value =
        todayString;

}


// ======================================================
// POPULATE FILTER
// ======================================================

function populateSelect(
    select,
    values,
    firstText
) {

    if (!select) {

        return;

    }


    select.innerHTML =
        "";


    const firstOption =
        document.createElement(
            "option"
        );


    firstOption.value =
        "";


    firstOption.textContent =
        firstText;


    select.appendChild(
        firstOption
    );


    values
        .filter(Boolean)
        .sort(
            function (a, b) {

                return String(a)
                    .localeCompare(
                        String(b)
                    );

            }
        )
        .forEach(
            function (value) {

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

            }
        );

}


// ======================================================
// POPULATE FILTERS
// ======================================================

function populateFilters(
    employeeList
) {

    const regions =
        [
            ...new Set(
                employeeList.map(
                    getEmployeeRegion
                )
            )
        ];


    const states =
        [
            ...new Set(
                employeeList.map(
                    getEmployeeState
                )
            )
        ];


    const cities =
        [
            ...new Set(
                employeeList.map(
                    getEmployeeCity
                )
            )
        ];


    const jamiatuls =
        [
            ...new Set(
                employeeList.map(
                    getEmployeeJamiatul
                )
            )
        ];


    populateSelect(
        regionFilter,
        regions,
        "All Regions"
    );


    populateSelect(
        stateFilter,
        states,
        "All States"
    );


    populateSelect(
        cityFilter,
        cities,
        "All Cities"
    );


    populateSelect(
        jamiatulFilter,
        jamiatuls,
        "All Jamiatul Madina"
    );

}


// ======================================================
// UPDATE REGION INFO
// ======================================================

function displayCurrentUser() {

    if (isAdmin) {

        if (regionUserInfo) {

            regionUserInfo.innerHTML =
                `
                <strong>
                    Admin Report
                </strong>
                <br>
                All Teachers are available for reporting.
                `;

        }


        if (regionUserInfoTop) {

            regionUserInfoTop.textContent =
                localStorage.getItem(
                    "adminUserName"
                ) ||
                "Administrator";

        }


        return;

    }


    if (
        !currentRegionUser
    ) {

        if (regionUserInfo) {

            regionUserInfo.innerHTML =
                `
                <strong>
                    Region User not found
                </strong>
                <br>
                Logged-in User ID:
                ${escapeHTML(
                    loggedInEmpCode
                )}
                `;

        }


        return;

    }


    const name =
        getUserName(
            currentRegionUser
        );


    const code =
        getUserCode(
            currentRegionUser
        );


    const region =
        getUserRegion(
            currentRegionUser
        );


    if (regionUserInfo) {

        regionUserInfo.innerHTML =
            `
            <strong>
                ${escapeHTML(name)}
            </strong>

            <br>

            User ID:
            <strong>
                ${escapeHTML(
                    code || loggedInEmpCode
                )}
            </strong>

            &nbsp; | &nbsp;

            Region:
            <strong>
                ${escapeHTML(
                    region || "Assigned Region"
                )}
            </strong>

            <br>

            Only this user's assigned Teachers
            are shown below.
            `;

    }


    if (regionUserInfoTop) {

        regionUserInfoTop.textContent =
            name;

    }

}


// ======================================================
// FILTER EMPLOYEES
// ======================================================

function filterEmployees() {

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


    const selectedJamiatul =
        normalize(
            jamiatulFilter?.value
        );


    const search =
        normalize(
            searchFilter?.value
        );


    return assignedEmployees.filter(
        function (employee) {

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
                normalize(
                    getEmployeeCity(
                        employee
                    )
                );


            const jamiatul =
                normalize(
                    getEmployeeJamiatul(
                        employee
                    )
                );


            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            const name =
                normalize(
                    getEmployeeName(
                        employee
                    )
                );


            if (
                selectedRegion &&
                region !==
                selectedRegion
            ) {

                return false;

            }


            if (
                selectedState &&
                state !==
                selectedState
            ) {

                return false;

            }


            if (
                selectedCity &&
                city !==
                selectedCity
            ) {

                return false;

            }


            if (
                selectedJamiatul &&
                jamiatul !==
                selectedJamiatul
            ) {

                return false;

            }


            if (
                search &&
                !code.includes(search) &&
                !name.includes(search)
            ) {

                return false;

            }


            return true;

        }
    );

}


// ======================================================
// FILTER ENTRIES
// ======================================================

function filterEntries(
    employeeList
) {

    const latestEntries =
        getLatestEntries();


    const employeeCodes =
        getAssignedEmployeeCodeSet(
            employeeList
        );


    const start =
        String(
            fromDate?.value || ""
        ).trim();


    const end =
        String(
            toDate?.value || ""
        ).trim();


    return latestEntries.filter(
        function (entry) {

            const code =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            const date =
                getEntryDate(
                    entry
                );


            if (
                !employeeCodes.has(
                    code
                )
            ) {

                return false;

            }


            if (
                start &&
                date < start
            ) {

                return false;

            }


            if (
                end &&
                date > end
            ) {

                return false;

            }


            return true;

        }
    );

}


// ======================================================
// GET TEACHER DATE AMOUNT
// ======================================================

function getTeacherDateAmount(
    employee,
    date,
    entryMap
) {

    const code =
        normalize(
            getEmployeeCode(
                employee
            )
        );


    const key =
        code +
        "_" +
        date;


    const entry =
        entryMap.get(
            key
        );


    if (!entry) {

        return 0;

    }


    return getEntryAmount(
        entry
    );

}


// ======================================================
// DISPLAY TABLE
// ======================================================

function renderReport() {

    const filteredEmployees =
        filterEmployees();


    const filteredEntries =
        filterEntries(
            filteredEmployees
        );


    currentFilteredEmployees =
        filteredEmployees;


    currentFilteredEntries =
        filteredEntries;


    // ==================================================
    // DATES
    // ==================================================

    let start =
        String(
            fromDate?.value || ""
        ).trim();


    let end =
        String(
            toDate?.value || ""
        ).trim();


    if (!start && !end) {

        setDefaultDates();

        start =
            fromDate.value;

        end =
            toDate.value;

    }


    if (
        start &&
        end &&
        start > end
    ) {

        if (selectedDateRange) {

            selectedDateRange.textContent =
                "Invalid date range";

        }


        if (reportTableBody) {

            reportTableBody.innerHTML =
                `
                <tr>
                    <td
                        colspan="30"
                        class="error-cell"
                    >
                        From Date cannot be greater
                        than To Date.
                    </td>
                </tr>
                `;

        }


        if (reportTableFoot) {

            reportTableFoot.innerHTML =
                "";

        }


        return;

    }


    const dates =
        getAllDates(
            start,
            end
        );


    // ==================================================
    // DATE RANGE TEXT
    // ==================================================

    if (selectedDateRange) {

        if (
            start &&
            end &&
            start === end
        ) {

            selectedDateRange.textContent =
                "Date: " +
                start;

        }
        else {

            selectedDateRange.textContent =
                "Date Range: " +
                (
                    start || "-"
                ) +
                " to " +
                (
                    end || "-"
                );

        }

    }


    // ==================================================
    // RESULT COUNT
    // ==================================================

    if (resultCount) {

        resultCount.textContent =
            filteredEmployees.length +
            (
                filteredEmployees.length === 1
                    ? " Teacher"
                    : " Teachers"
            );

    }


    // ==================================================
    // TOTAL TEACHERS
    // ==================================================

    if (totalTeachers) {

        totalTeachers.textContent =
            filteredEmployees.length;

    }


    // ==================================================
    // ENTRY MAP
    // ==================================================

    const entryMap =
        new Map();


    filteredEntries.forEach(
        function (entry) {

            const code =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            const date =
                getEntryDate(
                    entry
                );


            if (
                !code ||
                !date
            ) {

                return;

            }


            entryMap.set(
                code +
                "_" +
                date,
                entry
            );

        }
    );


    // ==================================================
    // GRAND TOTAL
    // ==================================================

    let grandTotalAmount =
        0;


    filteredEntries.forEach(
        function (entry) {

            grandTotalAmount +=
                getEntryAmount(
                    entry
                );

        }
    );


    if (grandTotal) {

        grandTotal.textContent =
            formatCurrency(
                grandTotalAmount
            );

    }


    // ==================================================
    // TABLE HEADER
    // ==================================================

    if (reportTableHead) {

        let headerHTML =
            `
            <tr>

                <th>
                    Jamiatul Madina
                </th>

                <th>
                    Teacher Name
                </th>
            `;


        dates.forEach(
            function (date) {

                headerHTML +=
                    `
                    <th>
                        ${escapeHTML(date)}
                    </th>
                    `;

            }
        );


        headerHTML +=
            `
                <th>
                    Total Collection
                </th>

            </tr>
            `;


        reportTableHead.innerHTML =
            headerHTML;

    }


    // ==================================================
    // EMPTY
    // ==================================================

    if (
        filteredEmployees.length === 0
    ) {

        if (reportTableBody) {

            reportTableBody.innerHTML =
                `
                <tr>

                    <td
                        colspan="${Math.max(
                            dates.length + 3,
                            3
                        )}"
                        class="empty-cell"
                    >

                        <i
                            class="fa-solid fa-users-slash"
                        ></i>

                        <br><br>

                        Is Region User ke liye
                        koi assigned Teacher nahi mila.

                    </td>

                </tr>
                `;

        }


        if (reportTableFoot) {

            reportTableFoot.innerHTML =
                "";

        }


        return;

    }


    // ==================================================
    // TABLE BODY
    // ==================================================

    let bodyHTML =
        "";


    const dateTotals =
        {};


    dates.forEach(
        function (date) {

            dateTotals[date] =
                0;

        }
    );


    let visibleGrandTotal =
        0;


    filteredEmployees
        .slice()
        .sort(
            function (a, b) {

                const nameA =
                    normalize(
                        getEmployeeName(
                            a
                        )
                    );


                const nameB =
                    normalize(
                        getEmployeeName(
                            b
                        )
                    );


                return nameA.localeCompare(
                    nameB
                );

            }
        )
        .forEach(
            function (employee) {

                const jamiatul =
                    getEmployeeJamiatul(
                        employee
                    ) ||
                    "-";


                const teacherName =
                    getEmployeeName(
                        employee
                    ) ||
                    "-";


                let teacherTotal =
                    0;


                let rowHTML =
                    `
                    <tr>

                        <td class="jamiatul">
                            ${escapeHTML(
                                jamiatul
                            )}
                        </td>

                        <td>

                            <div
                                class="teacher-name"
                            >
                                ${escapeHTML(
                                    teacherName
                                )}
                            </div>

                        </td>
                    `;


                dates.forEach(
                    function (date) {

                        const amount =
                            getTeacherDateAmount(
                                employee,
                                date,
                                entryMap
                            );


                        teacherTotal +=
                            amount;


                        dateTotals[date] +=
                            amount;


                        if (amount > 0) {

                            rowHTML +=
                                `
                                <td
                                    class="date-amount"
                                >
                                    ${formatCurrency(
                                        amount
                                    )}
                                </td>
                                `;

                        }
                        else {

                            rowHTML +=
                                `
                                <td
                                    class="no-entry"
                                >
                                    -
                                </td>
                                `;

                        }

                    }
                );


                visibleGrandTotal +=
                    teacherTotal;


                rowHTML +=
                    `
                        <td
                            class="total-collection"
                        >
                            ${formatCurrency(
                                teacherTotal
                            )}
                        </td>

                    </tr>
                    `;


                bodyHTML +=
                    rowHTML;

            }
        );


    if (reportTableBody) {

        reportTableBody.innerHTML =
            bodyHTML;

    }


    // ==================================================
    // TABLE FOOTER
    // ==================================================

    if (reportTableFoot) {

        let footerHTML =
            `
            <tr>

                <td
                    colspan="2"
                >
                    Date Total
                </td>
            `;


        dates.forEach(
            function (date) {

                footerHTML +=
                    `
                    <td
                        class="date-total"
                    >
                        ${formatCurrency(
                            dateTotals[date]
                        )}
                    </td>
                    `;

            }
        );


        footerHTML +=
            `
                <td
                    class="grand-total"
                >
                    ${formatCurrency(
                        visibleGrandTotal
                    )}
                </td>

            </tr>
            `;


        reportTableFoot.innerHTML =
            footerHTML;

    }


    // ==================================================
    // LOGGING
    // ==================================================

    console.log(
        "===================================="
    );


    console.log(
        "DAILY REPORT CURRENT USER:",
        currentRegionUser
    );


    console.log(
        "DAILY REPORT ASSIGNED TEACHERS:",
        filteredEmployees
    );


    console.log(
        "DAILY REPORT ENTRIES:",
        filteredEntries
    );


    console.log(
        "DAILY REPORT TOTAL:",
        visibleGrandTotal
    );


    console.log(
        "===================================="
    );

}


// ======================================================
// APPLY FILTER
// ======================================================

if (applyFilter) {

    applyFilter.addEventListener(
        "click",
        function () {

            // Remove quick button active
            document
                .querySelectorAll(
                    ".quick-date-btn"
                )
                .forEach(
                    function (button) {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


            renderReport();

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


            if (jamiatulFilter) {

                jamiatulFilter.value =
                    "";

            }


            if (searchFilter) {

                searchFilter.value =
                    "";

            }


            setDefaultDates();


            document
                .querySelectorAll(
                    ".quick-date-btn"
                )
                .forEach(
                    function (button) {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


            renderReport();

        }
    );

}


// ======================================================
// SEARCH ENTER
// ======================================================

if (searchFilter) {

    searchFilter.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                renderReport();

            }

        }
    );

}


// ======================================================
// QUICK DATE BUTTONS
// ======================================================

document
    .querySelectorAll(
        ".quick-date-btn"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            ".quick-date-btn"
                        )
                        .forEach(
                            function (btn) {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    const days =
                        Number(
                            button.dataset.days
                        );


                    if (
                        !Number.isFinite(
                            days
                        ) ||
                        days < 1
                    ) {

                        return;

                    }


                    const today =
                        new Date();


                    const endYear =
                        today.getFullYear();


                    const endMonth =
                        String(
                            today.getMonth() + 1
                        )
                        .padStart(
                            2,
                            "0"
                        );


                    const endDay =
                        String(
                            today.getDate()
                        )
                        .padStart(
                            2,
                            "0"
                        );


                    const startDate =
                        new Date(
                            today
                        );


                    startDate.setDate(
                        today.getDate() -
                        (
                            days - 1
                        )
                    );


                    const startYear =
                        startDate.getFullYear();


                    const startMonth =
                        String(
                            startDate.getMonth() + 1
                        )
                        .padStart(
                            2,
                            "0"
                        );


                    const startDay =
                        String(
                            startDate.getDate()
                        )
                        .padStart(
                            2,
                            "0"
                        );


                    fromDate.value =
                        `${startYear}-${startMonth}-${startDay}`;


                    toDate.value =
                        `${endYear}-${endMonth}-${endDay}`;


                    renderReport();

                }
            );

        }
    );


// ======================================================
// DOWNLOAD EVENTS
// ======================================================
// HTML already has its own download handlers.
// We intentionally do not add duplicate handlers here.
// ======================================================


// ======================================================
// INITIAL LOAD
// ======================================================

async function initializeDailyReport() {

    try {

        if (
            !isAdmin &&
            userRole !== "regionuser"
        ) {

            throw new Error(
                "Region User login required."
            );

        }


        if (reportTableBody) {

            reportTableBody.innerHTML =
                `
                <tr>

                    <td
                        colspan="20"
                        class="loading-cell"
                    >

                        <i
                            class="fa-solid fa-spinner fa-spin"
                        ></i>

                        Loading Daily Report...

                    </td>

                </tr>
                `;

        }


        // ==================================================
        // LOAD DATA
        // ==================================================

        await Promise.all([

            loadEmployees(),

            loadDailyEntries(),

            loadRegionUsers()

        ]);


        // ==================================================
        // FIND EXACT USER
        // ==================================================

        if (!isAdmin) {

            currentRegionUser =
                findCurrentRegionUser();


            if (
                !currentRegionUser
            ) {

                throw new Error(
                    "Current Region User Firebase me nahi mila. Logged-in User ID: " +
                    loggedInEmpCode
                );

            }

        }


        // ==================================================
        // ASSIGNED TEACHERS
        // ==================================================

        assignedEmployees =
            getAssignedEmployees();


        currentFilteredEmployees =
            [
                ...assignedEmployees
            ];


        // ==================================================
        // USER INFO
        // ==================================================

        displayCurrentUser();


        // ==================================================
        // FILTER OPTIONS
        // ==================================================

        populateFilters(
            assignedEmployees
        );


        // ==================================================
        // DEFAULT DATE
        // ==================================================

        setDefaultDates();


        // ==================================================
        // INITIAL REPORT
        // ==================================================

        renderReport();


        console.log(
            "Daily Report initialized successfully."
        );


    }

    catch (error) {

        console.error(
            "Daily Report Error:",
            error
        );


        if (regionUserInfo) {

            regionUserInfo.innerHTML =
                `
                <strong>
                    Daily Report Error
                </strong>

                <br><br>

                ${escapeHTML(
                    error.message ||
                    error
                )}
                `;

        }


        if (resultCount) {

            resultCount.textContent =
                "Error";

        }


        if (reportTableBody) {

            reportTableBody.innerHTML =
                `
                <tr>

                    <td
                        colspan="20"
                        class="error-cell"
                    >

                        <i
                            class="fa-solid fa-triangle-exclamation"
                        ></i>

                        <br><br>

                        Daily Report load nahi ho saki.

                        <br><br>

                        ${escapeHTML(
                            error.message ||
                            error
                        )}

                    </td>

                </tr>
                `;

        }


        if (reportTableFoot) {

            reportTableFoot.innerHTML =
                "";

        }

    }

}


// ======================================================
// START
// ======================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDailyReport
    );

}
else {

    initializeDailyReport();

}
