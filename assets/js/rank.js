// ======================================================
// TELETHON
// RANK PAGE
//
// RANK TYPES:
// 1. User Wise
// 2. Region Wise
// 3. State Wise
// 4. City Wise
//
// METRICS:
// 1. Highest Amount
// 2. Target Wise
// 3. Highest Target %
//
// DATA:
// daily_entry
// teacher_entries
// employees
// regionUsers
//
// SAME TEACHER + SAME DATE = SUM
//
// 1 UNIT = ₹7,000
// ======================================================


import {
    db
} from "./firebase-config.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



// ======================================================
// ADMIN ACCESS
// ======================================================

const userRole =
    String(
        localStorage.getItem("userRole") || ""
    )
        .trim()
        .toLowerCase();


if (userRole !== "admin") {

    localStorage.removeItem(
        "loggedInEmpCode"
    );

    localStorage.removeItem(
        "userRole"
    );

    window.location.href =
        "index.html";
}



// ======================================================
// CONSTANTS
// ======================================================

const UNIT_AMOUNT = 7000;

const EMPLOYEES_COLLECTION =
    "employees";

const DAILY_ENTRY_COLLECTION =
    "daily_entry";

const TEACHER_ENTRIES_COLLECTION =
    "teacher_entries";

const REGION_USERS_COLLECTION =
    "regionUsers";



// ======================================================
// HTML ELEMENTS
// ======================================================

const rankBy =
    document.getElementById(
        "rankBy"
    );

const rankMetric =
    document.getElementById(
        "rankMetric"
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

const fromDate =
    document.getElementById(
        "fromDate"
    );

const toDate =
    document.getElementById(
        "toDate"
    );

const applyFilter =
    document.getElementById(
        "applyFilter"
    );

const resetFilter =
    document.getElementById(
        "resetFilter"
    );

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const rankTableBody =
    document.getElementById(
        "rankTableBody"
    );

const totalRanked =
    document.getElementById(
        "totalRanked"
    );

const highestAmount =
    document.getElementById(
        "highestAmount"
    );

const totalTarget =
    document.getElementById(
        "totalTarget"
    );

const totalCollection =
    document.getElementById(
        "totalCollection"
    );

const rankOneName =
    document.getElementById(
        "rankOneName"
    );

const selectionText =
    document.getElementById(
        "selectionText"
    );

const loadingStatus =
    document.getElementById(
        "loadingStatus"
    );

const resultCount =
    document.getElementById(
        "resultCount"
    );

const tableSubtitle =
    document.getElementById(
        "tableSubtitle"
    );

const footerTarget =
    document.getElementById(
        "footerTarget"
    );

const footerCollection =
    document.getElementById(
        "footerCollection"
    );

const footerRemaining =
    document.getElementById(
        "footerRemaining"
    );

const footerPercentage =
    document.getElementById(
        "footerPercentage"
    );



// ======================================================
// DATA
// ======================================================

let employees = [];

let regionUsers = [];

let dailyEntries = [];

let teacherEntries = [];

let allEntries = [];

let currentRows = [];



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
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
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



// ======================================================
// NUMBER
// ======================================================

function numberValue(value) {

    const number =
        Number(
            String(
                value ?? ""
            )
                .replace(
                    /,/g,
                    ""
                )
                .replace(
                    /₹/g,
                    ""
                )
                .replace(
                    /\s/g,
                    ""
                )
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

}



// ======================================================
// MONEY
// ======================================================

function formatMoney(value) {

    return (
        "₹ " +
        numberValue(value)
            .toLocaleString(
                "en-IN"
            )
    );

}



// ======================================================
// UNIT
// ======================================================

function formatUnit(value) {

    const units =
        numberValue(value) /
        UNIT_AMOUNT;

    return (
        units.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ) +
        " Unit"
    );

}



// ======================================================
// PERCENTAGE
// ======================================================

function getPercentage(
    collection,
    target
) {

    collection =
        numberValue(
            collection
        );

    target =
        numberValue(
            target
        );

    if (target <= 0) {

        return 0;

    }

    return (
        collection /
        target
    ) * 100;

}



// ======================================================
// EMPLOYEE CODE
// ======================================================

function getEmployeeCode(
    employee
) {

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

function getEntryEmployeeCode(
    entry
) {

    return String(

        entry?.employeeCode ||

        entry?.employee_code ||

        entry?.empCode ||

        entry?.emp_code ||

        entry?.employeeID ||

        entry?.employeeId ||

        entry?.userCode ||

        entry?.user_code ||

        entry?.emp_id ||

        entry?.employee ||

        entry?.teacherCode ||

        entry?.teacher_code ||

        entry?.code ||

        ""

    ).trim();

}



// ======================================================
// ENTRY AMOUNT
// ======================================================

function getEntryAmount(
    entry
) {

    return numberValue(

        entry?.amount ||

        entry?.collection ||

        entry?.collectionAmount ||

        entry?.collection_amount ||

        entry?.totalCollection ||

        entry?.total_collection ||

        entry?.collectedAmount ||

        entry?.collected_amount ||

        entry?.dailyCollection ||

        entry?.daily_collection ||

        0

    );

}



// ======================================================
// ENTRY DATE
// ======================================================

function getEntryDate(
    entry
) {

    return (

        entry?.date ||

        entry?.entryDate ||

        entry?.collectionDate ||

        entry?.collection_date ||

        entry?.createdDate ||

        entry?.created_date ||

        ""

    );

}



// ======================================================
// DATE FORMAT
// ======================================================

function formatDateForInput(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );

    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );

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

function normalizeDate(
    value
) {

    if (!value) {

        return "";

    }


    // FIRESTORE TIMESTAMP

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return formatDateForInput(
            value.toDate()
        );

    }


    // FIRESTORE TIMESTAMP OBJECT

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return formatDateForInput(

            new Date(
                Number(
                    value.seconds
                ) * 1000
            )

        );

    }


    const stringValue =
        String(
            value
        ).trim();


    // YYYY-MM-DD

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(
                stringValue
            )
    ) {

        return stringValue;

    }


    // DD-MM-YYYY

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


    // DD/MM/YYYY

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
        new Date(
            stringValue
        );


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
// EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(
    employee
) {

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

function getEmployeeState(
    employee
) {

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

function getEmployeeCity(
    employee
) {

    return String(

        employee?.city ||

        employee?.cityName ||

        employee?.city_name ||

        ""

    ).trim();

}



// ======================================================
// EMPLOYEE NAME
// ======================================================

function getEmployeeName(
    employee
) {

    return String(

        employee?.name ||

        employee?.fullName ||

        employee?.full_name ||

        employee?.teacherName ||

        employee?.teacher_name ||

        employee?.employeeName ||

        employee?.employee_name ||

        getEmployeeCode(
            employee
        ) ||

        "Unknown"

    ).trim();

}



// ======================================================
// REGION USER CODE
// ======================================================

function getRegionUserCode(
    user
) {

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
// REGION USER NAME
// ======================================================

function getRegionUserName(
    user
) {

    return String(

        user?.userName ||

        user?.username ||

        user?.name ||

        user?.fullName ||

        user?.full_name ||

        user?.regionUserName ||

        user?.region_user_name ||

        getRegionUserCode(
            user
        ) ||

        "Region User"

    ).trim();

}



// ======================================================
// REGION USER TARGET
// ======================================================

function getRegionUserTarget(
    user
) {

    return numberValue(

        user?.targetAmount ||

        user?.target ||

        user?.manualTarget ||

        user?.manual_target ||

        0

    );

}



// ======================================================
// EMPLOYEE TARGET
// ======================================================

function getEmployeeTarget(
    employee
) {

    return numberValue(

        employee?.targetAmount ||

        employee?.target ||

        employee?.manualTarget ||

        employee?.manual_target ||

        0

    );

}



// ======================================================
// LOAD COLLECTION
// ======================================================

async function loadCollection(
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
        docSnapshot => {

            result.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data(),

                _source:
                    collectionName

            });

        }
    );


    return result;

}



// ======================================================
// LOAD ALL DATA
// ======================================================

async function loadData() {

    setLoading(
        true,
        "Loading Firebase Data..."
    );


    try {

        const [
            employeeData,
            regionUserData,
            oldEntries,
            newEntries
        ] = await Promise.all([

            loadCollection(
                EMPLOYEES_COLLECTION
            ),

            loadCollection(
                REGION_USERS_COLLECTION
            ),

            loadCollection(
                DAILY_ENTRY_COLLECTION
            ),

            loadCollection(
                TEACHER_ENTRIES_COLLECTION
            )

        ]);


        employees =
            employeeData;

        regionUsers =
            regionUserData;

        dailyEntries =
            oldEntries;

        teacherEntries =
            newEntries;


        allEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        loadRegionDropdown();


        updateStateDropdown();


        updateCityDropdown();


        applyCurrentFilters();

    }
    catch (error) {

        console.error(
            "Rank Data Error:",
            error
        );


        rankTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="error-cell"
                >

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    Data load nahi ho paaya.

                    <br>

                    ${escapeHTML(
                        error.message
                    )}

                </td>

            </tr>

        `;

    }
    finally {

        setLoading(
            false
        );

    }

}



// ======================================================
// REGION DROPDOWN
// ======================================================

function loadRegionDropdown() {

    const regions =
        new Map();


    employees.forEach(
        employee => {

            const region =
                getEmployeeRegion(
                    employee
                );


            if (region) {

                regions.set(
                    normalize(region),
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


    Array.from(
        regions.values()
    )
        .sort(
            (a, b) =>
                a.localeCompare(
                    b
                )
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
// STATE DROPDOWN
// ======================================================

function updateStateDropdown() {

    const selectedRegion =
        normalize(
            regionFilter.value
        );


    const states =
        new Map();


    employees.forEach(
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

                states.set(
                    normalize(state),
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


    Array.from(
        states.values()
    )
        .sort(
            (a, b) =>
                a.localeCompare(
                    b
                )
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

    const selectedRegion =
        normalize(
            regionFilter.value
        );

    const selectedState =
        normalize(
            stateFilter.value
        );


    const cities =
        new Map();


    employees.forEach(
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
                selectedRegion
            ) {

                return;

            }


            if (
                selectedState &&
                normalize(state) !==
                selectedState
            ) {

                return;

            }


            if (city) {

                cities.set(
                    normalize(city),
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


    Array.from(
        cities.values()
    )
        .sort(
            (a, b) =>
                a.localeCompare(
                    b
                )
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
// ENTRY DATE RANGE
// ======================================================

function entryInDateRange(
    entry
) {

    const entryDate =
        normalizeDate(
            getEntryDate(
                entry
            )
        );


    if (!entryDate) {

        return false;

    }


    const from =
        fromDate.value;

    const to =
        toDate.value;


    if (
        from &&
        entryDate < from
    ) {

        return false;

    }


    if (
        to &&
        entryDate > to
    ) {

        return false;

    }


    return true;

}



// ======================================================
// GET EMPLOYEE MAP
// ======================================================

function buildEmployeeMap() {

    const map =
        new Map();


    employees.forEach(
        employee => {

            const code =
                getEmployeeCode(
                    employee
                );


            if (code) {

                map.set(
                    normalize(code),
                    employee
                );

            }

        }
    );


    return map;

}



// ======================================================
// BUILD TEACHER COLLECTION
//
// SAME TEACHER + SAME DATE = SUM
// ======================================================

function buildTeacherCollections() {

    const employeeMap =
        buildEmployeeMap();


    const teacherDateMap =
        new Map();


    allEntries.forEach(
        entry => {

            if (
                !entryInDateRange(
                    entry
                )
            ) {

                return;

            }


            const code =
                getEntryEmployeeCode(
                    entry
                );


            if (!code) {

                return;

            }


            const employee =
                employeeMap.get(
                    normalize(code)
                );


            if (!employee) {

                return;

            }


            const date =
                normalizeDate(
                    getEntryDate(
                        entry
                    )
                );


            if (!date) {

                return;

            }


            const key =
                normalize(code) +
                "_" +
                date;


            const amount =
                getEntryAmount(
                    entry
                );


            if (
                !teacherDateMap.has(
                    key
                )
            ) {

                teacherDateMap.set(
                    key,
                    {

                        code: code,

                        employee:
                            employee,

                        date: date,

                        amount: 0

                    }
                );

            }


            teacherDateMap.get(
                key
            ).amount += amount;

        }
    );


    return Array.from(
        teacherDateMap.values()
    );

}



// ======================================================
// FILTER EMPLOYEES
// ======================================================

function employeeMatchesFilters(
    employee
) {

    const selectedRegion =
        normalize(
            regionFilter.value
        );

    const selectedState =
        normalize(
            stateFilter.value
        );

    const selectedCity =
        normalize(
            cityFilter.value
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


    if (
        selectedRegion &&
        employeeRegion !==
        selectedRegion
    ) {

        return false;

    }


    if (
        selectedState &&
        employeeState !==
        selectedState
    ) {

        return false;

    }


    if (
        selectedCity &&
        employeeCity !==
        selectedCity
    ) {

        return false;

    }


    return true;

}



// ======================================================
// USER WISE RANKING
//
// User = Region User
//
// Collection is calculated from assigned teachers.
// ======================================================

function buildUserRows(
    teacherCollections
) {

    const employeeCollectionMap =
        new Map();


    teacherCollections.forEach(
        item => {

            const code =
                normalize(
                    item.code
                );


            if (
                !employeeCollectionMap.has(
                    code
                )
            ) {

                employeeCollectionMap.set(
                    code,
                    0
                );

            }


            employeeCollectionMap.set(
                code,

                employeeCollectionMap.get(
                    code
                ) +
                item.amount

            );

        }
    );


    const rows = [];


    regionUsers.forEach(
        user => {

            const assignedCodes =
                new Set();


            const lists = [

                user.employeeCodes,

                user.employee_codes,

                user.assignedEmployees,

                user.assignedEmployeeCodes,

                user.assigned_employee_codes,

                user.teachers,

                user.teacherCodes,

                user.teacher_codes

            ];


            lists.forEach(
                list => {

                    if (
                        !Array.isArray(
                            list
                        )
                    ) {

                        return;

                    }


                    list.forEach(
                        item => {

                            if (
                                typeof item ===
                                "object" &&
                                item !== null
                            ) {

                                const code =
                                    getEmployeeCode(
                                        item
                                    );


                                if (code) {

                                    assignedCodes.add(
                                        normalize(
                                            code
                                        )
                                    );

                                }

                            }
                            else {

                                const code =
                                    String(
                                        item || ""
                                    ).trim();


                                if (code) {

                                    assignedCodes.add(
                                        normalize(
                                            code
                                        )
                                    );

                                }

                            }

                        }
                    );

                }
            );


            // If no direct assignment,
            // use region/state/city.

            let assignedEmployees =
                [];


            if (
                assignedCodes.size > 0
            ) {

                assignedEmployees =
                    employees.filter(
                        employee =>

                            assignedCodes.has(
                                normalize(
                                    getEmployeeCode(
                                        employee
                                    )
                                )
                            )

                    );

            }
            else {

                const userRegion =
                    String(
                        user.region ||
                        user.assignedRegion ||
                        user.assigned_region ||
                        ""
                    ).trim();


                const userState =
                    String(
                        user.state ||
                        user.assignedState ||
                        user.assigned_state ||
                        ""
                    ).trim();


                const userCity =
                    String(
                        user.city ||
                        user.assignedCity ||
                        user.assigned_city ||
                        ""
                    ).trim();


                assignedEmployees =
                    employees.filter(
                        employee => {

                            if (
                                userRegion &&
                                normalize(
                                    getEmployeeRegion(
                                        employee
                                    )
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
                                    getEmployeeState(
                                        employee
                                    )
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
                                    getEmployeeCity(
                                        employee
                                    )
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


            assignedEmployees =
                assignedEmployees.filter(
                    employee =>
                        employeeMatchesFilters(
                            employee
                        )
                );


            let collection =
                0;


            assignedEmployees.forEach(
                employee => {

                    const code =
                        normalize(
                            getEmployeeCode(
                                employee
                            )
                        );


                    collection +=
                        employeeCollectionMap.get(
                            code
                        ) || 0;

                }
            );


            const target =
                getRegionUserTarget(
                    user
                );


            const percentage =
                getPercentage(
                    collection,
                    target
                );


            const firstEmployee =
                assignedEmployees[0];


            rows.push({

                id:
                    user.id,

                name:
                    getRegionUserName(
                        user
                    ),

                region:
                    firstEmployee
                        ? getEmployeeRegion(
                            firstEmployee
                        )
                        : (
                            user.region ||
                            ""
                        ),

                state:
                    firstEmployee
                        ? getEmployeeState(
                            firstEmployee
                        )
                        : (
                            user.state ||
                            ""
                        ),

                city:
                    firstEmployee
                        ? getEmployeeCity(
                            firstEmployee
                        )
                        : (
                            user.city ||
                            ""
                        ),

                target:
                    target,

                collection:
                    collection,

                remaining:
                    Math.max(
                        target -
                        collection,
                        0
                    ),

                percentage:
                    percentage

            });

        }
    );


    return rows;

}



// ======================================================
// LOCATION RANKING
//
// Target = Sum of targets of employees
// Collection = Sum of teacher collections
// ======================================================

function buildLocationRows(
    teacherCollections,
    type
) {

    const employeeMap =
        buildEmployeeMap();


    const locationMap =
        new Map();


    teacherCollections.forEach(
        item => {

            const employee =
                employeeMap.get(
                    normalize(
                        item.code
                    )
                );


            if (!employee) {

                return;

            }


            if (
                !employeeMatchesFilters(
                    employee
                )
            ) {

                return;

            }


            let key = "";

            let name = "";


            if (
                type === "region"
            ) {

                name =
                    getEmployeeRegion(
                        employee
                    );

                key =
                    normalize(
                        name
                    );

            }


            if (
                type === "state"
            ) {

                name =
                    getEmployeeState(
                        employee
                    );

                key =
                    normalize(
                        name
                    );

            }


            if (
                type === "city"
            ) {

                name =
                    getEmployeeCity(
                        employee
                    );

                key =
                    normalize(
                        name
                    );

            }


            if (!key) {

                return;

            }


            if (
                !locationMap.has(
                    key
                )
            ) {

                locationMap.set(
                    key,
                    {

                        name:
                            name,

                        target:
                            0,

                        collection:
                            0,

                        region:
                            getEmployeeRegion(
                                employee
                            ),

                        state:
                            getEmployeeState(
                                employee
                            ),

                        city:
                            getEmployeeCity(
                                employee
                            )

                    }
                );

            }


            const row =
                locationMap.get(
                    key
                );


            row.collection +=
                item.amount;

        }
    );


    // Add target from employees.

    employees.forEach(
        employee => {

            if (
                !employeeMatchesFilters(
                    employee
                )
            ) {

                return;

            }


            let name = "";


            if (
                type === "region"
            ) {

                name =
                    getEmployeeRegion(
                        employee
                    );

            }


            if (
                type === "state"
            ) {

                name =
                    getEmployeeState(
                        employee
                    );

            }


            if (
                type === "city"
            ) {

                name =
                    getEmployeeCity(
                        employee
                    );

            }


            const key =
                normalize(
                    name
                );


            if (!key) {

                return;

            }


            if (
                !locationMap.has(
                    key
                )
            ) {

                locationMap.set(
                    key,
                    {

                        name:
                            name,

                        target:
                            0,

                        collection:
                            0,

                        region:
                            getEmployeeRegion(
                                employee
                            ),

                        state:
                            getEmployeeState(
                                employee
                            ),

                        city:
                            getEmployeeCity(
                                employee
                            )

                    }
                );

            }


            locationMap.get(
                key
            ).target +=
                getEmployeeTarget(
                    employee
                );

        }
    );


    return Array.from(
        locationMap.values()
    )
        .map(
            row => ({

                ...row,

                remaining:
                    Math.max(
                        row.target -
                        row.collection,
                        0
                    ),

                percentage:
                    getPercentage(
                        row.collection,
                        row.target
                    )

            })
        );

}



// ======================================================
// SORT RANK
// ======================================================

function sortRows(
    rows
) {

    const metric =
        rankMetric.value;


    if (
        metric === "target"
    ) {

        rows.sort(
            (a, b) =>

                b.target -
                a.target

        );

    }
    else if (
        metric === "percentage"
    ) {

        rows.sort(
            (a, b) =>

                b.percentage -
                a.percentage

        );

    }
    else {

        rows.sort(
            (a, b) =>

                b.collection -
                a.collection

        );

    }


    return rows;

}



// ======================================================
// RANK BADGE
// ======================================================

function rankBadge(
    rank
) {

    if (rank === 1) {

        return `
            <div class="rank-badge rank-one">
                <i class="fa-solid fa-trophy"></i>
                1
            </div>
        `;

    }


    if (rank === 2) {

        return `
            <div class="rank-badge rank-two">
                2
            </div>
        `;

    }


    if (rank === 3) {

        return `
            <div class="rank-badge rank-three">
                3
            </div>
        `;

    }


    return `
        <div class="rank-badge">
            ${rank}
        </div>
    `;

}



// ======================================================
// DISPLAY TABLE
// ======================================================

function displayRows(
    rows
) {

    currentRows =
        rows;


    totalRanked.textContent =
        rows.length;


    resultCount.textContent =
        rows.length;


    if (!rows.length) {

        rankTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="no-data-cell"
                >

                    <i class="fa-solid fa-inbox"></i>

                    <div>
                        No ranking data found.
                    </div>

                </td>

            </tr>

        `;


        updateCards(
            []
        );

        return;

    }


    let html = "";


    rows.forEach(
        (row, index) => {

            const rank =
                index + 1;


            const percentage =
                row.percentage;


            let percentageClass =
                "normal";


            if (
                percentage >= 100
            ) {

                percentageClass =
                    "excellent";

            }
            else if (
                percentage >= 75
            ) {

                percentageClass =
                    "good";

            }
            else if (
                percentage >= 50
            ) {

                percentageClass =
                    "average";

            }
            else {

                percentageClass =
                    "low";

            }


            html += `

                <tr
                    class="${
                        rank <= 3
                            ? "top-rank-row"
                            : ""
                    }"
                >

                    <td class="rank-cell">

                        ${rankBadge(
                            rank
                        )}

                    </td>


                    <td>

                        <div class="name-cell">

                            <strong>
                                ${escapeHTML(
                                    row.name
                                )}
                            </strong>

                            ${
                                row.id
                                    ? `
                                        <small>
                                            ${escapeHTML(
                                                row.id
                                            )}
                                        </small>
                                      `
                                    : ""
                            }

                        </div>

                    </td>


                    <td>
                        ${
                            escapeHTML(
                                row.region ||
                                "-"
                            )
                        }
                    </td>


                    <td>
                        ${
                            escapeHTML(
                                row.state ||
                                "-"
                            )
                        }
                    </td>


                    <td>
                        ${
                            escapeHTML(
                                row.city ||
                                "-"
                            )
                        }
                    </td>


                    <td>

                        <div class="money-cell">

                            ${formatMoney(
                                row.target
                            )}

                            <small>
                                ${formatUnit(
                                    row.target
                                )}
                            </small>

                        </div>

                    </td>


                    <td>

                        <div class="money-cell collection-value">

                            ${formatMoney(
                                row.collection
                            )}

                            <small>
                                ${formatUnit(
                                    row.collection
                                )}
                            </small>

                        </div>

                    </td>


                    <td>

                        <div class="money-cell">

                            ${formatMoney(
                                row.remaining
                            )}

                        </div>

                    </td>


                    <td>

                        <div class="percentage-wrapper">

                            <strong
                                class="${
                                    percentageClass
                                }"
                            >
                                ${
                                    percentage.toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2
                                        }
                                    )
                                }%
                            </strong>


                            <div class="progress">

                                <div
                                    class="progress-bar ${
                                        percentageClass
                                    }"
                                    style="
                                        width:${Math.min(
                                            percentage,
                                            100
                                        )}%;
                                    "
                                ></div>

                            </div>

                        </div>

                    </td>

                </tr>

            `;

        }
    );


    rankTableBody.innerHTML =
        html;


    updateCards(
        rows
    );

}



// ======================================================
// UPDATE CARDS
// ======================================================

function updateCards(
    rows
) {

    if (!rows.length) {

        highestAmount.textContent =
            "₹ 0";

        totalTarget.textContent =
            "₹ 0";

        totalCollection.textContent =
            "₹ 0";

        rankOneName.textContent =
            "-";

        footerTarget.textContent =
            "₹ 0";

        footerCollection.textContent =
            "₹ 0";

        footerRemaining.textContent =
            "₹ 0";

        footerPercentage.textContent =
            "0%";

        return;

    }


    const maxAmount =
        Math.max(
            ...rows.map(
                row =>
                    numberValue(
                        row.collection
                    )
            )
        );


    const sumTarget =
        rows.reduce(
            (
                total,
                row
            ) =>
                total +
                numberValue(
                    row.target
                ),
            0
        );


    const sumCollection =
        rows.reduce(
            (
                total,
                row
            ) =>
                total +
                numberValue(
                    row.collection
                ),
            0
        );


    const sumRemaining =
        rows.reduce(
            (
                total,
                row
            ) =>
                total +
                numberValue(
                    row.remaining
                ),
            0
        );


    const overallPercentage =
        getPercentage(
            sumCollection,
            sumTarget
        );


    highestAmount.textContent =
        formatMoney(
            maxAmount
        );


    totalTarget.textContent =
        formatMoney(
            sumTarget
        );


    totalCollection.textContent =
        formatMoney(
            sumCollection
        );


    rankOneName.textContent =
        rows[0]?.name ||
        "-";


    footerTarget.textContent =
        formatMoney(
            sumTarget
        );


    footerCollection.textContent =
        formatMoney(
            sumCollection
        );


    footerRemaining.textContent =
        formatMoney(
            sumRemaining
        );


    footerPercentage.textContent =
        overallPercentage.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ) +
        "%";

}



// ======================================================
// APPLY CURRENT FILTERS
// ======================================================

function applyCurrentFilters() {

    const teacherCollections =
        buildTeacherCollections();


    let rows = [];


    const type =
        rankBy.value;


    if (
        type === "user"
    ) {

        rows =
            buildUserRows(
                teacherCollections
            );

    }
    else {

        rows =
            buildLocationRows(
                teacherCollections,
                type
            );

    }


    rows =
        sortRows(
            rows
        );


    displayRows(
        rows
    );


    updateSelectionText(
        rows
    );

}



// ======================================================
// SELECTION TEXT
// ======================================================

function updateSelectionText() {

    const typeText = {

        user:
            "User Wise",

        region:
            "Region Wise",

        state:
            "State Wise",

        city:
            "City Wise"

    };


    const metricText = {

        amount:
            "Highest Amount",

        target:
            "Target Wise",

        percentage:
            "Highest Target %"

    };


    let dateText =
        "All Time";


    if (
        fromDate.value &&
        toDate.value
    ) {

        dateText =
            fromDate.value +
            " → " +
            toDate.value;

    }
    else if (
        fromDate.value
    ) {

        dateText =
            "From " +
            fromDate.value;

    }
    else if (
        toDate.value
    ) {

        dateText =
            "Up To " +
            toDate.value;

    }


    selectionText.textContent =

        typeText[
            rankBy.value
        ] +

        " • " +

        metricText[
            rankMetric.value
        ] +

        " • " +

        dateText;


    tableSubtitle.textContent =

        metricText[
            rankMetric.value
        ] +

        " ranking";

}



// ======================================================
// LOADING
// ======================================================

function setLoading(
    loading,
    message = "Loading..."
) {

    if (loading) {

        loadingStatus.innerHTML = `

            <i class="
                fa-solid
                fa-spinner
                fa-spin
            "></i>

            ${escapeHTML(
                message
            )}

        `;

    }
    else {

        loadingStatus.innerHTML = `

            <i class="
                fa-solid
                fa-circle-check
            "></i>

            Data Ready

        `;

    }

}



// ======================================================
// APPLY BUTTON
// ======================================================

applyFilter.addEventListener(
    "click",
    () => {

        if (
            fromDate.value &&
            toDate.value &&
            fromDate.value >
            toDate.value
        ) {

            alert(
                "From Date To Date se pehle honi chahiye."
            );

            return;

        }


        applyCurrentFilters();

    }
);



// ======================================================
// REGION CHANGE
// ======================================================

regionFilter.addEventListener(
    "change",
    () => {

        updateStateDropdown();

        updateCityDropdown();

    }
);



// ======================================================
// STATE CHANGE
// ======================================================

stateFilter.addEventListener(
    "change",
    () => {

        updateCityDropdown();

    }
);



// ======================================================
// RANK TYPE CHANGE
// ======================================================

rankBy.addEventListener(
    "change",
    () => {

        applyCurrentFilters();

    }
);



// ======================================================
// METRIC CHANGE
// ======================================================

rankMetric.addEventListener(
    "change",
    () => {

        applyCurrentFilters();

    }
);



// ======================================================
// RESET
// ======================================================

resetFilter.addEventListener(
    "click",
    () => {

        rankBy.value =
            "user";

        rankMetric.value =
            "amount";

        regionFilter.value =
            "";

        updateStateDropdown();

        stateFilter.value =
            "";

        updateCityDropdown();

        cityFilter.value =
            "";

        fromDate.value =
            "";

        toDate.value =
            "";


        applyCurrentFilters();

    }
);



// ======================================================
// QUICK DATE
// ======================================================

document
    .querySelectorAll(
        ".quick-date-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    setQuickDate(
                        button.dataset.range
                    );

                }
            );

        }
    );



// ======================================================
// QUICK DATE FUNCTION
// ======================================================

function setQuickDate(
    range
) {

    const today =
        new Date();


    const todayString =
        formatDateForInput(
            today
        );


    if (
        range === "today"
    ) {

        fromDate.value =
            todayString;

        toDate.value =
            todayString;

    }


    if (
        range === "week"
    ) {

        const date =
            new Date(
                today
            );


        const day =
            date.getDay();


        const difference =
            day === 0
                ? 6
                : day - 1;


        date.setDate(
            date.getDate() -
            difference
        );


        fromDate.value =
            formatDateForInput(
                date
            );

        toDate.value =
            todayString;

    }


    if (
        range === "month"
    ) {

        const date =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );


        fromDate.value =
            formatDateForInput(
                date
            );

        toDate.value =
            todayString;

    }


    if (
        range === "all"
    ) {

        fromDate.value =
            "";

        toDate.value =
            "";

    }


    applyCurrentFilters();

}



// ======================================================
// REFRESH
// ======================================================

refreshBtn.addEventListener(
    "click",
    async () => {

        await loadData();

    }
);



// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener(
    "click",
    event => {

        event.preventDefault();


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



// ======================================================
// INITIAL LOAD
// ======================================================

loadData();
