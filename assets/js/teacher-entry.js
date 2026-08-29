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
// ADD ACCESS VALUE
// ======================================================

function addAccessValue(
    target,
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return;

    }


    // ==============================================
    // ARRAY
    // ==============================================

    if (
        Array.isArray(value)
    ) {

        value.forEach(
            function (item) {

                addAccessValue(
                    target,
                    item
                );

            }
        );


        return;

    }


    // ==============================================
    // STRING
    // ==============================================

    if (
        typeof value === "string"
    ) {

        const cleanValue =
            normalize(value);


        if (cleanValue) {

            target.push(
                cleanValue
            );

        }


        return;

    }


    // ==============================================
    // NUMBER
    // ==============================================

    if (
        typeof value === "number"
    ) {

        target.push(
            normalize(value)
        );

    }

}



// ======================================================
// GET ACCESS VALUES
//
// Extract Region, State and Employee Code access.
// ======================================================

function getAccessValues(access) {

    const regions = [];


    const states = [];


    const employeeCodes = [];



    // ==================================================
    // PROCESS SINGLE RULE
    // ==================================================

    function processRule(rule) {

        if (!rule) {

            return;

        }


        // ==============================================
        // STRING ACCESS
        //
        // Example:
        // "Kolkata Region"
        // "Bihar"
        // ==============================================

        if (
            typeof rule === "string"
        ) {

            /*
            String access can represent either
            a Region or a State.

            Therefore it is added to both lists.
            Final matching checks employee Region OR State.
            */

            addAccessValue(
                regions,
                rule
            );


            addAccessValue(
                states,
                rule
            );


            return;

        }


        // ==============================================
        // OBJECT ACCESS
        // ==============================================

        if (
            typeof rule !== "object"
        ) {

            return;

        }


        // ==============================================
        // REGIONS
        // ==============================================

        addAccessValue(
            regions,
            rule.region
        );


        addAccessValue(
            regions,
            rule.Region
        );


        addAccessValue(
            regions,
            rule.REGION
        );


        addAccessValue(
            regions,
            rule.regionName
        );


        addAccessValue(
            regions,
            rule.region_name
        );


        addAccessValue(
            regions,
            rule.regions
        );


        addAccessValue(
            regions,
            rule.Regions
        );


        // ==============================================
        // STATES
        // ==============================================

        addAccessValue(
            states,
            rule.state
        );


        addAccessValue(
            states,
            rule.State
        );


        addAccessValue(
            states,
            rule.STATE
        );


        addAccessValue(
            states,
            rule.stateName
        );


        addAccessValue(
            states,
            rule.state_name
        );


        addAccessValue(
            states,
            rule.states
        );


        addAccessValue(
            states,
            rule.States
        );


        // ==============================================
        // EMPLOYEE CODES
        // ==============================================

        addAccessValue(
            employeeCodes,
            rule.employeeCodes
        );


        addAccessValue(
            employeeCodes,
            rule.employee_codes
        );


        addAccessValue(
            employeeCodes,
            rule.empCodes
        );


        addAccessValue(
            employeeCodes,
            rule.emp_codes
        );


        addAccessValue(
            employeeCodes,
            rule.teacherCodes
        );


        addAccessValue(
            employeeCodes,
            rule.teacher_codes
        );

    }



    // ==================================================
    // ACCESS AS ARRAY
    // ==================================================

    if (
        Array.isArray(access)
    ) {

        access.forEach(
            function (rule) {

                processRule(
                    rule
                );

            }
        );

    }


    // ==================================================
    // ACCESS AS OBJECT OR STRING
    // ==================================================

    else {

        processRule(
            access
        );

    }



    return {

        regions:
            [
                ...new Set(
                    regions
                )
            ],


        states:
            [
                ...new Set(
                    states
                )
            ],


        employeeCodes:
            [
                ...new Set(
                    employeeCodes
                )
            ]

    };

}



// ======================================================
// CHECK EMPLOYEE ACCESS
//
// IMPORTANT LOGIC:
//
// Region Access:
// → Show all Teachers of that Region
//
// State Access:
// → Show all Teachers of that State
//
// Multiple access:
// → REGION OR STATE
//
// Example:
//
// Access:
// Kolkata Region
// Bihar State
//
// Show:
// All Kolkata Region Teachers
// +
// All Bihar State Teachers
//
// Do NOT show:
// Other Delhi Teachers
// unless Delhi/Bihar/Kolkata condition matches.
// ======================================================

function employeeMatchesRegionAccess(
    employee
) {

    const access =
        getRegionUserAccess();



    // ==================================================
    // NO ACCESS DATA
    //
    // Existing login data missing hone par
    // Teachers hide nahi honge.
    // ==================================================

    if (!access) {

        console.warn(
            "No regionUserAccess found. Showing all Teachers."
        );


        return true;

    }



    // ==================================================
    // GET NORMALIZED ACCESS VALUES
    // ==================================================

    const accessValues =
        getAccessValues(
            access
        );


    const allowedRegions =
        accessValues.regions;


    const allowedStates =
        accessValues.states;


    const allowedEmployeeCodes =
        accessValues.employeeCodes;



    // ==================================================
    // EMPLOYEE VALUES
    // ==================================================

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



    // ==================================================
    // IF ACCESS HAS NO VALID RULE
    //
    // Do not automatically show all Teachers.
    // ==================================================

    if (
        allowedRegions.length === 0 &&
        allowedStates.length === 0 &&
        allowedEmployeeCodes.length === 0
    ) {

        console.warn(
            "No valid access rule found."
        );


        return false;

    }



    // ==================================================
    // 1. SPECIFIC EMPLOYEE ACCESS
    // ==================================================

    if (
        allowedEmployeeCodes.length > 0 &&
        allowedEmployeeCodes.includes(
            employeeCode
        )
    ) {

        return true;

    }



    // ==================================================
    // 2. REGION MATCH
    //
    // Example:
    // Access = Kolkata Region
    //
    // All Kolkata Teachers = TRUE
    // ==================================================

    const regionMatched =

        employeeRegion !== "" &&

        allowedRegions.includes(
            employeeRegion
        );



    // ==================================================
    // 3. STATE MATCH
    //
    // Example:
    // Access = Bihar
    //
    // All Bihar Teachers = TRUE
    // ==================================================

    const stateMatched =

        employeeState !== "" &&

        allowedStates.includes(
            employeeState
        );



    // ==================================================
    // FINAL ACCESS
    //
    // REGION OR STATE
    // ==================================================

    return (
        regionMatched ||
        stateMatched
    );

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

            <i
                class="fa-solid fa-circle-user"
            ></i>

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

        // ==============================================
        // LOADING MESSAGE
        // ==============================================

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


        // ==============================================
        // FIRESTORE
        // ==============================================

        const snapshot =
            await getDocs(
                collection(
                    db,
                    EMPLOYEES_COLLECTION
                )
            );


        console.log(
            "Total Employees found:",
            snapshot.size
        );


        // ==============================================
        // CREATE EMPLOYEE ARRAY
        // ==============================================

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
        // ONLY EMPLOYEES WITH CODE
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
            "Employees with Employee Code:",
            employeesWithCode.length
        );


        // ==============================================
        // FILTER BY ACCESS
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
        // SHOW ACCESS DEBUG
        // ==============================================

        const access =
            getRegionUserAccess();


        console.log(
            "Region User Access:",
            access
        );


        if (access) {

            console.log(
                "Normalized Access:",
                getAccessValues(
                    access
                )
            );

        }


        // ==============================================
        // DEBUG TABLE
        // ==============================================

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



    // ==================================================
    // NO TEACHER
    // ==================================================

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



    // ==================================================
    // ADD TEACHERS
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



            // ==========================================
            // NOT FOUND
            // ==========================================

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



            // ==========================================
            // EMPLOYEE CODE
            // ==========================================

            if (employeeCodeInput) {

                employeeCodeInput.value =
                    getEmployeeCode(
                        employee
                    );

            }



            // ==========================================
            // TEACHER NAME
            // ==========================================

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



            // ==========================================
            // FORM VALUES
            // ==========================================

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
            // FIND TEACHER
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



            // ==========================================
            // BUTTON ORIGINAL TEXT
            // ==========================================

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
                // addDoc always creates NEW document.
                // Old entries are not modified.
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
    // LOAD REGION USER INFO
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
