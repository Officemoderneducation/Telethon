// ======================================================
// TELETHON
// REGION USER - TEACHER ENTRY
//
// ACCESS LOGIC
//
// Example Access:
//
// [
//     {
//         region: "Delhi",
//         state: "Bihar"
//     },
//     {
//         region: "Kolkata",
//         state: ""
//     }
// ]
//
// RESULT:
//
// 1. Bihar State ke saare Teachers
// 2. Kolkata Region ke saare Teachers
// 3. Delhi Region ke baaki Teachers automatically nahi
//
// IMPORTANT:
//
// NO ACCESS = NO TEACHER
//
// Empty Access = NO TEACHER
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
            "regionUserAccess not found."
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

        return null;

    }

}



// ======================================================
// GET LOGGED IN REGION USER NAME
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
// GET LOGGED IN REGION USER CODE
// ======================================================

function getLoggedInRegionUserCode() {

    return (
        localStorage.getItem(
            "loggedInEmpCode"
        ) ||
        ""
    );

}



// ======================================================
// CHECK ONE ACCESS RULE
//
// IMPORTANT LOGIC:
//
// If STATE exists:
//      State access only
//
// If STATE does NOT exist but REGION exists:
//      Full Region access
//
// Examples:
//
// { region: "Delhi", state: "Bihar" }
//      -> Bihar State access only
//
// { region: "Kolkata", state: "" }
//      -> Full Kolkata Region access
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
    // STRING ACCESS
    // ==================================================

    if (
        typeof rule ===
        "string"
    ) {

        const ruleValue =
            normalize(
                rule
            );


        return (

            employeeRegion ===
            ruleValue

        );

    }



    // ==================================================
    // OBJECT CHECK
    // ==================================================

    if (
        typeof rule !==
        "object"
    ) {

        return false;

    }



    // ==================================================
    // GET REGION
    // ==================================================

    const ruleRegion =
        normalize(

            rule.region ||

            rule.Region ||

            rule.REGION ||

            rule.regionName ||

            rule.region_name ||

            ""

        );



    // ==================================================
    // GET STATES
    // ==================================================

    let ruleStates =

        rule.states ||

        rule.state ||

        rule.States ||

        rule.State ||

        rule.STATE ||

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
            function (state) {

                return (
                    normalize(state) !== ""
                );

            }
        )
        .map(
            normalize
        );



    // ==================================================
    // GET SPECIFIC TEACHER CODES
    // ==================================================

    let ruleEmployeeCodes =

        rule.employeeCodes ||

        rule.employee_codes ||

        rule.empCodes ||

        rule.emp_codes ||

        rule.teacherCodes ||

        rule.teacher_codes ||

        [];



    if (
        !Array.isArray(
            ruleEmployeeCodes
        )
    ) {

        ruleEmployeeCodes =
            [ruleEmployeeCodes];

    }



    ruleEmployeeCodes =
        ruleEmployeeCodes
        .filter(
            function (code) {

                return (
                    normalize(code) !== ""
                );

            }
        )
        .map(
            normalize
        );



    // ==================================================
    // 1. SPECIFIC TEACHER ACCESS
    // ==================================================

    if (
        ruleEmployeeCodes.length > 0
    ) {

        const employeeCode =
            normalize(
                getEmployeeCode(
                    employee
                )
            );


        return (
            ruleEmployeeCodes.includes(
                employeeCode
            )
        );

    }



    // ==================================================
    // 2. STATE ACCESS
    //
    // IMPORTANT:
    //
    // If State is present,
    // only State is checked.
    //
    // Region is ignored for this rule.
    // ==================================================

    if (
        ruleStates.length > 0
    ) {

        return (
            ruleStates.includes(
                employeeState
            )
        );

    }



    // ==================================================
    // 3. FULL REGION ACCESS
    //
    // Only when State is empty.
    // ==================================================

    if (
        ruleRegion
    ) {

        return (
            ruleRegion ===
            employeeRegion
        );

    }



    // ==================================================
    // EMPTY RULE
    // ==================================================

    return false;

}



// ======================================================
// CHECK EMPLOYEE ACCESS
//
// IMPORTANT:
//
// NO ACCESS = NO TEACHER
//
// Empty Access Array = NO TEACHER
//
// Invalid Access = NO TEACHER
// ======================================================

function employeeMatchesRegionAccess(
    employee
) {

    const access =
        getRegionUserAccess();



    // ==================================================
    // NO ACCESS FOUND
    //
    // IMPORTANT:
    //
    // NEVER return true here.
    //
    // Previously "return true" caused
    // ALL Teachers to appear.
    // ==================================================

    if (!access) {

        console.warn(
            "No regionUserAccess found. Teacher access denied."
        );

        return false;

    }



    // ==================================================
    // ACCESS ARRAY
    // ==================================================

    if (
        Array.isArray(
            access
        )
    ) {

        // ==============================================
        // EMPTY ACCESS
        //
        // Empty means NO ACCESS.
        // ==============================================

        if (
            access.length === 0
        ) {

            console.warn(
                "regionUserAccess is empty. Teacher access denied."
            );

            return false;

        }



        // ==============================================
        // ANY ONE RULE MATCH
        // ==============================================

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
    // SINGLE OBJECT
    // ==================================================

    if (
        typeof access ===
        "object"
    ) {

        return checkAccessRule(
            employee,
            access
        );

    }



    // ==================================================
    // STRING
    // ==================================================

    if (
        typeof access ===
        "string"
    ) {

        return checkAccessRule(
            employee,
            access
        );

    }



    // ==================================================
    // INVALID ACCESS
    //
    // NEVER ALLOW BY DEFAULT
    // ==================================================

    return false;

}



// ======================================================
// LOAD REGION USER INFO
// ======================================================

function loadRegionUserInfo() {

    const userName =
        getLoggedInRegionUserName();


    if (!regionUserInfo) {

        return;

    }


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
            "=========================================="
        );

        console.log(
            "Loading employees collection..."
        );

        console.log(
            "=========================================="
        );



        // ==================================================
        // GET EMPLOYEES
        // ==================================================

        const snapshot =
            await getDocs(
                collection(
                    db,
                    EMPLOYEES_COLLECTION
                )
            );



        console.log(
            "Total Employees:",
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
        // ONLY EMPLOYEES WITH CODE
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
            "Employees with Code:",
            employeesWithCode.length
        );



        // ==================================================
        // GET USER ACCESS
        // ==================================================

        const currentAccess =
            getRegionUserAccess();


        console.log(
            "Current Region User Access:",
            currentAccess
        );



        // ==================================================
        // REGION / STATE ACCESS FILTER
        //
        // ONLY ALLOWED TEACHERS
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
        // DEBUG ALL TEACHERS
        // ==================================================

        console.table(

            employeesWithCode.map(
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
                            ),

                        Access:
                            employeeMatchesRegionAccess(
                                employee
                            )

                    };

                }
            )

        );



        // ==================================================
        // DEBUG ALLOWED TEACHERS
        // ==================================================

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
        // POPULATE SELECT
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

        return;

    }



    teacherSelect.innerHTML = `

        <option value="">
            Select Teacher
        </option>

    `;



    // ==================================================
    // NO ALLOWED TEACHER
    // ==================================================

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



    // ==================================================
    // ONLY ALLOWED TEACHERS
    // ==================================================

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



            // ==========================================
            // GET SELECTED TEACHER
            // ==========================================

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

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Saving...

                    `;

                }



                // ======================================
                // REGION USER
                // ======================================

                const regionUserName =
                    getLoggedInRegionUserName();


                const regionUserCode =
                    getLoggedInRegionUserCode();



                // ======================================
                // SAVE NEW ENTRY
                //
                // addDoc always creates a NEW document.
                //
                // Same Teacher + Same Date
                // multiple entries are allowed.
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
    // LOAD USER INFO
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
