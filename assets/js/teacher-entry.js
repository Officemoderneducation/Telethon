// ======================================================
// TELETHON
// REGION USER - TEACHER ENTRY
//
// IMPORTANT:
// Existing / Old Entries are NOT changed.
// Every new entry is saved as a NEW document.
// Same Teacher + Same Date multiple entries are allowed.
//
// Example:
//
// T001 | 29 August | ₹500
// T001 | 29 August | ₹1000
// T001 | 29 August | ₹700
//
// Later Daily Report can calculate:
// ₹500 + ₹1000 + ₹700 = ₹2200
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

    return String(value || "")
        .trim()
        .toLowerCase();

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

    ).trim();

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

    ).trim();

}



// ======================================================
// GET REGION
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

        ""

    ).trim();

}



// ======================================================
// GET STATE
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

        ""

    ).trim();

}



// ======================================================
// GET JAMIATUL MADINA
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

    ).trim();

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
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
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
// GET REGION USER ACCESS
// ======================================================

function getRegionUserAccess() {

    const savedAccess =
        localStorage.getItem(
            "regionUserAccess"
        );

    if (!savedAccess) {

        console.warn(
            "regionUserAccess not found in localStorage."
        );

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
// GET REGION USER CODE
// ======================================================

function getLoggedInRegionUserCode() {

    return normalize(
        localStorage.getItem(
            "loggedInEmpCode"
        )
    );

}



// ======================================================
// GET REGION USER NAME
// ======================================================

function getLoggedInRegionUserName() {

    return (
        localStorage.getItem(
            "regionUserName"
        ) ||
        "Region User"
    );

}



// ======================================================
// ARRAY VALUE HELPER
// ======================================================

function valueMatches(
    value,
    employeeValue
) {

    if (
        value === null ||
        value === undefined
    ) {

        return false;

    }

    const normalizedEmployeeValue =
        normalize(
            employeeValue
        );

    if (
        Array.isArray(value)
    ) {

        return value.some(
            function (item) {

                return (
                    normalize(item) ===
                    normalizedEmployeeValue
                );

            }
        );

    }

    return (
        normalize(value) ===
        normalizedEmployeeValue
    );

}



// ======================================================
// CHECK ONE ACCESS RULE
// ======================================================

function checkAccessRule(
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


    // ==================================================
    // STRING RULE
    // ==================================================

    if (
        typeof rule ===
        "string"
    ) {

        const ruleValue =
            normalize(rule);

        return (
            ruleValue ===
            employeeRegion ||

            ruleValue ===
            employeeState
        );

    }


    // ==================================================
    // OBJECT RULE
    // ==================================================

    if (
        typeof rule !==
        "object"
    ) {

        return false;

    }


    // --------------------------------------------------
    // REGION
    // --------------------------------------------------

    const ruleRegion =
        normalize(

            rule.region ||

            rule.Region ||

            rule.regionName ||

            rule.region_name ||

            ""

        );


    // --------------------------------------------------
    // STATE
    // --------------------------------------------------

    let ruleStates =

        rule.states ||

        rule.state ||

        rule.States ||

        rule.State ||

        rule.stateName ||

        rule.state_name ||

        [];


    if (
        !Array.isArray(
            ruleStates
        )
    ) {

        ruleStates =
            [ruleStates];

    }


    ruleStates =
        ruleStates
            .filter(
                function (value) {
                    return (
                        value !==
                        null &&
                        value !==
                        undefined &&
                        String(value)
                            .trim() !== ""
                    );
                }
            )
            .map(
                normalize
            );


    // --------------------------------------------------
    // REGION CHECK
    // --------------------------------------------------

    if (ruleRegion) {

        if (
            employeeRegion &&
            ruleRegion !==
            employeeRegion
        ) {

            return false;

        }

    }


    // --------------------------------------------------
    // STATE CHECK
    // --------------------------------------------------

    if (
        ruleStates.length > 0
    ) {

        if (
            employeeState &&
            !ruleStates.includes(
                employeeState
            )
        ) {

            return false;

        }

    }


    // --------------------------------------------------
    // EMPLOYEE CODE CHECK
    // --------------------------------------------------

    const ruleEmployeeCodes =

        rule.employeeCodes ||

        rule.employee_codes ||

        rule.empCodes ||

        rule.emp_codes ||

        rule.teacherCodes ||

        rule.teacher_codes ||

        [];


    if (
        Array.isArray(
            ruleEmployeeCodes
        ) &&
        ruleEmployeeCodes.length > 0
    ) {

        const employeeCode =
            normalize(
                getEmployeeCode(
                    employee
                )
            );

        return ruleEmployeeCodes
            .map(normalize)
            .includes(
                employeeCode
            );

    }


    // --------------------------------------------------
    // DEFAULT
    // --------------------------------------------------

    return true;

}



// ======================================================
// CHECK EMPLOYEE ACCESS
// ======================================================

function employeeMatchesRegionAccess(
    employee
) {

    const access =
        getRegionUserAccess();


    // ==================================================
    // IMPORTANT
    //
    // If no access information exists,
    // do NOT hide all Teachers.
    //
    // This allows the new Teacher Entry page
    // to still load Teachers.
    // ==================================================

    if (!access) {

        console.warn(
            "No regionUserAccess found. Showing all Teachers."
        );

        return true;

    }


    // ==================================================
    // ACCESS ARRAY
    // ==================================================

    if (
        Array.isArray(
            access
        )
    ) {

        if (
            access.length === 0
        ) {

            return true;

        }

        return access.some(
            function (rule) {

                return checkAccessRule(
                    employee,
                    rule
                );

            }
        );

    }


    // ==================================================
    // ACCESS OBJECT
    // ==================================================

    if (
        typeof access ===
        "object"
    ) {

        // ------------------------------------------------
        // Direct employee list
        // ------------------------------------------------

        const employeeCodes =

            access.employeeCodes ||

            access.employee_codes ||

            access.empCodes ||

            access.emp_codes ||

            access.teacherCodes ||

            access.teacher_codes ||

            [];


        if (
            Array.isArray(
                employeeCodes
            ) &&
            employeeCodes.length > 0
        ) {

            const currentCode =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );

            return employeeCodes
                .map(normalize)
                .includes(
                    currentCode
                );

        }


        // ------------------------------------------------
        // Region
        // ------------------------------------------------

        const accessRegion =
            normalize(

                access.region ||

                access.Region ||

                access.regionName ||

                access.region_name ||

                ""

            );


        // ------------------------------------------------
        // States
        // ------------------------------------------------

        let accessStates =

            access.states ||

            access.state ||

            access.States ||

            access.State ||

            access.stateName ||

            access.state_name ||

            [];


        if (
            !Array.isArray(
                accessStates
            )
        ) {

            accessStates =
                [accessStates];

        }


        accessStates =
            accessStates
                .filter(
                    function (value) {

                        return (
                            value !==
                            null &&
                            value !==
                            undefined &&
                            String(value)
                                .trim() !== ""
                        );

                    }
                )
                .map(
                    normalize
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


        // ------------------------------------------------
        // REGION CHECK
        // ------------------------------------------------

        if (
            accessRegion &&
            employeeRegion &&
            accessRegion !==
            employeeRegion
        ) {

            return false;

        }


        // ------------------------------------------------
        // STATE CHECK
        // ------------------------------------------------

        if (
            accessStates.length > 0
        ) {

            if (
                employeeState &&
                !accessStates.includes(
                    employeeState
                )
            ) {

                return false;

            }

        }


        return true;

    }


    // ==================================================
    // ACCESS STRING
    // ==================================================

    if (
        typeof access ===
        "string"
    ) {

        const accessValue =
            normalize(access);

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

        return (
            accessValue ===
            employeeRegion ||

            accessValue ===
            employeeState
        );

    }


    return true;

}



// ======================================================
// LOAD REGION USER INFO
// ======================================================

function loadRegionUserInfo() {

    const userName =
        getLoggedInRegionUserName();


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


        // ==================================================
        // REMOVE RECORDS WITHOUT EMPLOYEE CODE
        // ==================================================

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


        // ==================================================
        // FILTER BY REGION USER ACCESS
        // ==================================================

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


        // ==================================================
        // DEBUG
        // ==================================================

        console.table(
            allowedEmployees.map(
                function (employee) {

                    return {

                        ID:
                            employee.id,

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
                            ),

                        Jamiatul:
                            getEmployeeJamiatul(
                                employee
                            )

                    };

                }
            )
        );


        // ==================================================
        // SORT
        // ==================================================

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
                        numeric: true,
                        sensitivity: "base"
                    }
                );

            }
        );


        // ==================================================
        // POPULATE
        // ==================================================

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

        console.error(
            "teacherSelect element not found."
        );

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


        console.warn(
            "No Teacher Available."
        );


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
                // NEW ENTRY
                //
                // IMPORTANT:
                // addDoc() creates a NEW document.
                //
                // Existing entries are NOT updated.
                // Existing entries are NOT deleted.
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
    // SET TODAY
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
