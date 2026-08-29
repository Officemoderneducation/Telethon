// ======================================================
// TELETHON
// REGION USER - TEACHER ENTRY
//
// IMPORTANT:
// Existing / Old Entries are NOT changed.
// Every new entry is saved as a NEW document.
// Same Teacher + Same Date multiple entries are allowed.
// ======================================================


import { db } from "./firebase-config.js";


import {

    collection,

    getDocs,

    addDoc,

    serverTimestamp

}
from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



// ======================================================
// COLLECTIONS
// ======================================================

const EMPLOYEES_COLLECTION =
    "employees";


const DAILY_ENTRY_COLLECTION =
    "daily_entry";



// ======================================================
// DOM ELEMENTS
// ======================================================

const teacherEntryForm =
    document.getElementById(
        "teacherEntryForm"
    );


const teacherSelect =
    document.getElementById(
        "teacherSelect"
    );


const employeeCodeInput =
    document.getElementById(
        "employeeCode"
    );


const teacherNameInput =
    document.getElementById(
        "teacherName"
    );


const entryDateInput =
    document.getElementById(
        "entryDate"
    );


const collectionAmountInput =
    document.getElementById(
        "collectionAmount"
    );


const saveEntryBtn =
    document.getElementById(
        "saveEntryBtn"
    );


const resetEntryBtn =
    document.getElementById(
        "resetEntryBtn"
    );


const formMessage =
    document.getElementById(
        "formMessage"
    );


const regionUserInfo =
    document.getElementById(
        "regionUserInfo"
    );



// ======================================================
// DATA
// ======================================================

let allEmployees = [];


let allowedEmployees = [];



// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(
        value || ""
    )
    .trim()
    .toLowerCase();

}



// ======================================================
// UNIQUE NORMALIZED VALUES
// ======================================================

function getNormalizedValues(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return [];

    }


    if (
        Array.isArray(value)
    ) {

        return value
            .flatMap(
                function (item) {

                    return getNormalizedValues(
                        item
                    );

                }
            )
            .filter(Boolean);

    }


    const normalized =
        normalize(value);


    return normalized
        ? [normalized]
        : [];

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

        ""

    )
    .trim();

}



// ======================================================
// GET TEACHER NAME
// ======================================================

function getTeacherName(employee) {

    if (!employee) {

        return "";

    }


    return String(

        employee.name ||

        employee.teacherName ||

        employee.teacher_name ||

        employee.employeeName ||

        employee.fullName ||

        employee.teacher ||

        ""

    )
    .trim();

}



// ======================================================
// GET EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

    if (!employee) {

        return "";

    }


    return String(

        employee.region ||

        employee.Region ||

        employee.REGION ||

        employee.regionName ||

        employee.region_name ||

        ""

    )
    .trim();

}



// ======================================================
// GET EMPLOYEE STATE
// ======================================================

function getEmployeeState(employee) {

    if (!employee) {

        return "";

    }


    return String(

        employee.state ||

        employee.State ||

        employee.STATE ||

        employee.stateName ||

        employee.state_name ||

        ""

    )
    .trim();

}



// ======================================================
// GET JAMIATUL
// ======================================================

function getEmployeeJamiatul(employee) {

    if (!employee) {

        return "";

    }


    return String(

        employee.jamiatulMadina ||

        employee.jamiatul ||

        employee.jamiatul_madina ||

        employee.madrasa ||

        employee.madrasaName ||

        ""

    )
    .trim();

}



// ======================================================
// TODAY DATE
// ======================================================

function getTodayDate() {

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


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}



// ======================================================
// SHOW MESSAGE
// ======================================================

function showMessage(
    message,
    type = "success"
) {

    if (!formMessage) {

        return;

    }


    formMessage.textContent =
        message;


    formMessage.className =
        "message " +
        type;


    setTimeout(
        function () {

            formMessage.className =
                "message";


            formMessage.textContent =
                "";

        },
        5000
    );

}



// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(
        value || ""
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
// GET REGION USER ACCESS
// ======================================================

function getRegionUserAccess() {

    const savedAccess =
        localStorage.getItem(
            "regionUserAccess"
        );


    if (!savedAccess) {

        return null;

    }


    try {

        return JSON.parse(
            savedAccess
        );

    }
    catch (error) {

        console.error(
            "Region access parse error:",
            error
        );


        return savedAccess;

    }

}



// ======================================================
// GET ALL ACCESS RULES
// ======================================================

function getAccessRules(access) {

    if (!access) {

        return [];

    }


    if (
        Array.isArray(access)
    ) {

        return access;

    }


    if (
        typeof access ===
        "object"
    ) {

        /*
        Support possible nested
        access structures.
        */

        if (
            Array.isArray(
                access.access
            )
        ) {

            return access.access;

        }


        if (
            Array.isArray(
                access.accessRules
            )
        ) {

            return access.accessRules;

        }


        if (
            Array.isArray(
                access.rules
            )
        ) {

            return access.rules;

        }


        return [
            access
        ];

    }


    return [
        access
    ];

}



// ======================================================
// EXTRACT ACCESS DATA
//
// IMPORTANT:
//
// Region and State are collected separately.
//
// Example:
//
// {
//     region: "Kolkata Region",
//     states: ["Bihar"]
// }
//
// Means:
//
// Kolkata Region
// OR
// Bihar
// ======================================================

function extractAccessData(access) {

    const rules =
        getAccessRules(
            access
        );


    const regions =
        new Set();


    const states =
        new Set();


    const employeeCodes =
        new Set();


    let hasAnyValidAccess =
        false;


    rules.forEach(
        function (rule) {

            // ==========================================
            // STRING ACCESS
            // ==========================================

            if (
                typeof rule ===
                "string"
            ) {

                const value =
                    normalize(
                        rule
                    );


                if (value) {

                    /*
                    String access can represent
                    a Region or State.

                    It will be checked against
                    both employee Region and State.
                    */

                    regions.add(
                        value
                    );


                    states.add(
                        value
                    );


                    hasAnyValidAccess =
                        true;

                }


                return;

            }


            // ==========================================
            // OBJECT ACCESS
            // ==========================================

            if (
                !rule ||
                typeof rule !==
                "object"
            ) {

                return;

            }


            // ==========================================
            // REGION VALUES
            // ==========================================

            const regionValues =

                getNormalizedValues(
                    rule.regions
                )
                .concat(
                    getNormalizedValues(
                        rule.region
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.Region
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.regionName
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.region_name
                    )
                );


            regionValues.forEach(
                function (value) {

                    if (value) {

                        regions.add(
                            value
                        );


                        hasAnyValidAccess =
                            true;

                    }

                }
            );


            // ==========================================
            // STATE VALUES
            // ==========================================

            const stateValues =

                getNormalizedValues(
                    rule.states
                )
                .concat(
                    getNormalizedValues(
                        rule.state
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.State
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.States
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.stateName
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.state_name
                    )
                );


            stateValues.forEach(
                function (value) {

                    if (value) {

                        states.add(
                            value
                        );


                        hasAnyValidAccess =
                            true;

                    }

                }
            );


            // ==========================================
            // EMPLOYEE CODE VALUES
            // ==========================================

            const employeeCodeValues =

                getNormalizedValues(
                    rule.employeeCodes
                )
                .concat(
                    getNormalizedValues(
                        rule.employee_codes
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.empCodes
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.emp_codes
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.teacherCodes
                    )
                )
                .concat(
                    getNormalizedValues(
                        rule.teacher_codes
                    )
                );


            employeeCodeValues.forEach(
                function (value) {

                    if (value) {

                        employeeCodes.add(
                            value
                        );


                        hasAnyValidAccess =
                            true;

                    }

                }
            );

        }
    );


    return {

        regions,

        states,

        employeeCodes,

        hasAnyValidAccess

    };

}



// ======================================================
// CHECK EMPLOYEE ACCESS
//
// IMPORTANT:
//
// REGION OR STATE OR EMPLOYEE CODE
//
// If ANY assigned access matches,
// Teacher is allowed.
// ======================================================

function employeeMatchesRegionAccess(
    employee
) {

    const access =
        getRegionUserAccess();


    // ==============================================
    // NO ACCESS DATA
    // ==============================================

    if (!access) {

        console.warn(
            "regionUserAccess not found."
        );


        /*
        Existing behavior:
        if access information is unavailable,
        do not hide all Teachers.
        */

        return true;

    }


    const accessData =
        extractAccessData(
            access
        );


    // ==============================================
    // NO VALID ACCESS FOUND
    // ==============================================

    if (
        !accessData.hasAnyValidAccess
    ) {

        console.warn(
            "No valid access rule found."
        );


        return true;

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


    const employeeCode =
        normalize(
            getEmployeeCode(
                employee
            )
        );


    // ==============================================
    // REGION MATCH
    // ==============================================

    if (
        employeeRegion &&
        accessData.regions.has(
            employeeRegion
        )
    ) {

        return true;

    }


    // ==============================================
    // STATE MATCH
    // ==============================================

    if (
        employeeState &&
        accessData.states.has(
            employeeState
        )
    ) {

        return true;

    }


    // ==============================================
    // EMPLOYEE CODE MATCH
    // ==============================================

    if (
        employeeCode &&
        accessData.employeeCodes.has(
            employeeCode
        )
    ) {

        return true;

    }


    // ==============================================
    // NO MATCH
    // ==============================================

    return false;

}



// ======================================================
// LOAD REGION USER INFO
// ======================================================

function loadRegionUserInfo() {

    const userName =
        localStorage.getItem(
            "regionUserName"
        ) ||
        "Region User";


    if (regionUserInfo) {

        regionUserInfo.innerHTML = `

            <strong>

                <i class="fa-solid fa-circle-user"></i>

                ${escapeHTML(userName)}

            </strong>

            <br>

            Aap sirf apne assigned Teachers
            ki Collection Entry kar sakte hain.

        `;

    }

}



// ======================================================
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    try {

        if (teacherSelect) {

            teacherSelect.innerHTML = `

                <option value="">
                    Loading Teachers...
                </option>

            `;

        }


        console.log(
            "Loading employees collection..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    EMPLOYEES_COLLECTION
                )
            );


        console.log(
            "Employees found:",
            snapshot.size
        );


        allEmployees =
            snapshot.docs.map(
                function (document) {

                    return {

                        id:
                            document.id,

                        ...document.data()

                    };

                }
            );


        // ==============================================
        // VALID EMPLOYEES
        // ==============================================

        const employeesWithCode =
            allEmployees.filter(
                function (employee) {

                    return (
                        getEmployeeCode(
                            employee
                        ) !== ""
                    );

                }
            );


        console.log(
            "Employees with code:",
            employeesWithCode.length
        );


        // ==============================================
        // SHOW CURRENT ACCESS
        // ==============================================

        const access =
            getRegionUserAccess();


        const accessData =
            extractAccessData(
                access
            );


        console.log(
            "Allowed Regions:",
            Array.from(
                accessData.regions
            )
        );


        console.log(
            "Allowed States:",
            Array.from(
                accessData.states
            )
        );


        console.log(
            "Allowed Employee Codes:",
            Array.from(
                accessData.employeeCodes
            )
        );


        // ==============================================
        // FILTER TEACHERS
        //
        // REGION OR STATE OR EMPLOYEE CODE
        // ==============================================

        allowedEmployees =
            employeesWithCode.filter(
                function (employee) {

                    return employeeMatchesRegionAccess(
                        employee
                    );

                }
            );


        console.log(
            "Allowed Teachers:",
            allowedEmployees.length
        );


        // ==============================================
        // DEBUG TABLE
        // ==============================================

        console.table(
            allowedEmployees.map(
                function (employee) {

                    return {

                        Code:
                            getEmployeeCode(
                                employee
                            ),

                        Name:
                            getTeacherName(
                                employee
                            ),

                        Region:
                            getEmployeeRegion(
                                employee
                            ),

                        State:
                            getEmployeeState(
                                employee
                            )

                    };

                }
            )
        );


        // ==============================================
        // SORT BY EMPLOYEE CODE
        // ==============================================

        allowedEmployees.sort(
            function (a, b) {

                return getEmployeeCode(
                    a
                )
                .localeCompare(
                    getEmployeeCode(
                        b
                    ),
                    undefined,
                    {

                        numeric:
                            true,

                        sensitivity:
                            "base"

                    }
                );

            }
        );


        // ==============================================
        // POPULATE SELECT
        // ==============================================

        populateTeacherSelect();


    }
    catch (error) {

        console.error(
            "Teacher Load Error:",
            error
        );


        if (teacherSelect) {

            teacherSelect.innerHTML = `

                <option value="">
                    Teachers load nahi ho sake
                </option>

            `;

        }


        showMessage(
            "Teachers load nahi ho sake. Console check karein.",
            "error"
        );

    }

}



// ======================================================
// POPULATE TEACHER SELECT
// ======================================================

function populateTeacherSelect() {

    if (!teacherSelect) {

        return;

    }


    teacherSelect.innerHTML = `

        <option value="">
            Select Teacher
        </option>

    `;


    if (
        allowedEmployees.length === 0
    ) {

        teacherSelect.innerHTML += `

            <option value="">
                No Teacher Available
            </option>

        `;


        return;

    }


    allowedEmployees.forEach(
        function (employee) {

            const code =
                getEmployeeCode(
                    employee
                );


            const name =
                getTeacherName(
                    employee
                );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                employee.id;


            option.textContent =
                code +
                " - " +
                (
                    name ||
                    "Teacher"
                );


            teacherSelect.appendChild(
                option
            );

        }
    );

}



// ======================================================
// TEACHER CHANGE
// ======================================================

if (teacherSelect) {

    teacherSelect.addEventListener(
        "change",
        function () {

            const selectedId =
                teacherSelect.value;


            const employee =
                allowedEmployees.find(
                    function (item) {

                        return (
                            item.id ===
                            selectedId
                        );

                    }
                );


            if (!employee) {

                if (employeeCodeInput) {

                    employeeCodeInput.value =
                        "";

                }


                if (teacherNameInput) {

                    teacherNameInput.value =
                        "";

                }


                return;

            }


            if (employeeCodeInput) {

                employeeCodeInput.value =
                    getEmployeeCode(
                        employee
                    );

            }


            if (teacherNameInput) {

                teacherNameInput.value =
                    getTeacherName(
                        employee
                    );

            }

        }
    );

}



// ======================================================
// SAVE ENTRY
// ======================================================

if (teacherEntryForm) {

    teacherEntryForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const selectedTeacherId =
                teacherSelect
                    ? teacherSelect.value
                    : "";


            const entryDate =
                entryDateInput
                    ? entryDateInput.value
                    : "";


            const amount =
                collectionAmountInput
                    ? Number(
                        collectionAmountInput.value
                    )
                    : 0;


            // ==========================================
            // VALIDATION
            // ==========================================

            if (!selectedTeacherId) {

                showMessage(
                    "Please select a Teacher.",
                    "error"
                );


                return;

            }


            if (!entryDate) {

                showMessage(
                    "Please select Entry Date.",
                    "error"
                );


                return;

            }


            if (
                !amount ||
                amount <= 0
            ) {

                showMessage(
                    "Please enter a valid Collection Amount.",
                    "error"
                );


                return;

            }


            const employee =
                allowedEmployees.find(
                    function (item) {

                        return (
                            item.id ===
                            selectedTeacherId
                        );

                    }
                );


            if (!employee) {

                showMessage(
                    "Selected Teacher nahi mila.",
                    "error"
                );


                return;

            }


            const originalButtonHTML =
                saveEntryBtn
                    ? saveEntryBtn.innerHTML
                    : "";


            try {

                // ======================================
                // BUTTON LOADING
                // ======================================

                if (saveEntryBtn) {

                    saveEntryBtn.disabled =
                        true;


                    saveEntryBtn.innerHTML = `

                        <i
                            class="fa-solid fa-spinner fa-spin"
                        ></i>

                        Saving...

                    `;

                }


                // ======================================
                // REGION USER INFO
                // ======================================

                const regionUserName =
                    localStorage.getItem(
                        "regionUserName"
                    ) ||
                    "";


                const regionUserCode =
                    localStorage.getItem(
                        "loggedInEmpCode"
                    ) ||
                    "";


                // ======================================
                // SAVE NEW ENTRY
                //
                // Every save creates NEW document.
                // Old entries are NOT changed.
                // ======================================

                await addDoc(
                    collection(
                        db,
                        DAILY_ENTRY_COLLECTION
                    ),
                    {

                        // ==================================
                        // TEACHER DATA
                        // ==================================

                        employeeId:
                            employee.id,


                        employeeCode:
                            getEmployeeCode(
                                employee
                            ),


                        employee_code:
                            getEmployeeCode(
                                employee
                            ),


                        teacherName:
                            getTeacherName(
                                employee
                            ),


                        teacher_name:
                            getTeacherName(
                                employee
                            ),


                        // ==================================
                        // LOCATION DATA
                        // ==================================

                        region:
                            getEmployeeRegion(
                                employee
                            ),


                        state:
                            getEmployeeState(
                                employee
                            ),


                        jamiatulMadina:
                            getEmployeeJamiatul(
                                employee
                            ),


                        // ==================================
                        // ENTRY DATA
                        // ==================================

                        date:
                            entryDate,


                        entryDate:
                            entryDate,


                        amount:
                            amount,


                        collection:
                            amount,


                        // ==================================
                        // SOURCE
                        // ==================================

                        entrySource:
                            "region_user",


                        entrySystem:
                            "teacher_entry_panel",


                        // ==================================
                        // REGION USER
                        // ==================================

                        enteredBy:
                            regionUserName,


                        enteredByCode:
                            regionUserCode,


                        // ==================================
                        // TIME
                        // ==================================

                        createdAt:
                            serverTimestamp()

                    }
                );


                // ======================================
                // SUCCESS
                // ======================================

                showMessage(
                    "Entry successfully saved.",
                    "success"
                );


                if (collectionAmountInput) {

                    collectionAmountInput.value =
                        "";


                    collectionAmountInput.focus();

                }

            }
            catch (error) {

                console.error(
                    "Save Entry Error:",
                    error
                );


                showMessage(
                    "Entry save nahi ho saki. Please try again.",
                    "error"
                );

            }
            finally {

                if (saveEntryBtn) {

                    saveEntryBtn.disabled =
                        false;


                    saveEntryBtn.innerHTML =
                        originalButtonHTML;

                }

            }

        }
    );

}



// ======================================================
// RESET FORM
// ======================================================

if (resetEntryBtn) {

    resetEntryBtn.addEventListener(
        "click",
        function () {

            if (teacherEntryForm) {

                teacherEntryForm.reset();

            }


            if (employeeCodeInput) {

                employeeCodeInput.value =
                    "";

            }


            if (teacherNameInput) {

                teacherNameInput.value =
                    "";

            }


            if (entryDateInput) {

                entryDateInput.value =
                    getTodayDate();

            }


            if (formMessage) {

                formMessage.className =
                    "message";


                formMessage.textContent =
                    "";

            }

        }
    );

}



// ======================================================
// INITIALIZE
// ======================================================

async function initializeTeacherEntry() {

    console.log(
        "=========================================="
    );


    console.log(
        "TELETHON - TEACHER ENTRY INITIALIZED"
    );


    console.log(
        "=========================================="
    );


    // ==============================================
    // SET TODAY DATE
    // ==============================================

    if (entryDateInput) {

        entryDateInput.value =
            getTodayDate();

    }


    // ==============================================
    // REGION USER INFO
    // ==============================================

    loadRegionUserInfo();


    // ==============================================
    // LOAD TEACHERS
    // ==============================================

    await loadEmployees();

}



// ======================================================
// DOM READY
// ======================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeTeacherEntry
    );

}
else {

    initializeTeacherEntry();

}
