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
"https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";



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
// HELPER - NORMALIZE
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

    return String(

        employee.name ||

        employee.teacherName ||

        employee.teacher_name ||

        employee.employeeName ||

        employee.fullName ||

        ""

    )
    .trim();

}



// ======================================================
// GET REGION
// ======================================================

function getEmployeeRegion(employee) {

    return String(

        employee.region ||

        employee.Region ||

        ""

    )
    .trim();

}



// ======================================================
// GET STATE
// ======================================================

function getEmployeeState(employee) {

    return String(

        employee.state ||

        employee.State ||

        ""

    )
    .trim();

}



// ======================================================
// GET JAMIATUL
// ======================================================

function getEmployeeJamiatul(employee) {

    return String(

        employee.jamiatulMadina ||

        employee.jamiatul ||

        employee.jamiatul_madina ||

        employee.madrasa ||

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
// CHECK EMPLOYEE ACCESS
// ======================================================

function employeeMatchesRegionAccess(
    employee
) {

    const access =
        getRegionUserAccess();


    /*
    If access information is unavailable,
    we do not block the page here.
    Existing Region User access data structures
    can be connected later if required.
    */

    if (!access) {

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


    // ==============================================
    // ACCESS AS ARRAY
    // ==============================================

    if (
        Array.isArray(
            access
        )
    ) {

        return access.some(
            function (rule) {

                if (
                    typeof rule ===
                    "string"
                ) {

                    return (
                        employeeRegion ===
                        normalize(rule)
                    );

                }


                if (
                    typeof rule ===
                    "object"
                ) {

                    const ruleRegion =
                        normalize(
                            rule.region ||
                            rule.Region ||
                            ""
                        );


                    const ruleState =
                        normalize(
                            rule.state ||
                            rule.State ||
                            ""
                        );


                    if (
                        ruleRegion &&
                        ruleRegion !==
                        employeeRegion
                    ) {

                        return false;

                    }


                    if (
                        ruleState &&
                        ruleState !==
                        employeeState
                    ) {

                        return false;

                    }


                    return true;

                }


                return false;

            }
        );

    }


    // ==============================================
    // ACCESS AS OBJECT
    // ==============================================

    if (
        typeof access ===
        "object"
    ) {

        const accessRegion =
            normalize(
                access.region ||
                access.Region ||
                ""
            );


        let accessStates =
            access.states ||
            access.state ||
            access.States ||
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
            accessStates.map(
                normalize
            );


        // REGION CHECK

        if (
            accessRegion &&
            employeeRegion &&
            accessRegion !==
            employeeRegion
        ) {

            return false;

        }


        // STATE CHECK

        if (
            accessStates.length > 0 &&
            employeeState
        ) {

            if (
                !accessStates.includes(
                    employeeState
                )
            ) {

                return false;

            }

        }


        return true;

    }


    // ==============================================
    // ACCESS AS STRING
    // ==============================================

    if (
        typeof access ===
        "string"
    ) {

        return (
            employeeRegion ===
            normalize(access)
        );

    }


    return true;

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
                ${userName}
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


        const snapshot =
            await getDocs(
                collection(
                    db,
                    EMPLOYEES_COLLECTION
                )
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
        // FILTER EMPLOYEES
        // ==============================================

        allowedEmployees =
            allEmployees.filter(
                function (employee) {

                    const code =
                        getEmployeeCode(
                            employee
                        );


                    if (!code) {

                        return false;

                    }


                    return employeeMatchesRegionAccess(
                        employee
                    );

                }
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
                    )
                );

            }
        );


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
            "Teachers load nahi ho sake.",
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
                name;


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

                employeeCodeInput.value =
                    "";


                teacherNameInput.value =
                    "";


                return;

            }


            employeeCodeInput.value =
                getEmployeeCode(
                    employee
                );


            teacherNameInput.value =
                getTeacherName(
                    employee
                );

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
                teacherSelect.value;


            const entryDate =
                entryDateInput.value;


            const amount =
                Number(
                    collectionAmountInput.value
                );


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
                saveEntryBtn.innerHTML;


            try {

                // ======================================
                // LOADING
                // ======================================

                saveEntryBtn.disabled =
                    true;


                saveEntryBtn.innerHTML = `

                    <i
                        class="fa-solid fa-spinner fa-spin"
                    ></i>

                    Saving...

                `;


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
                // addDoc creates NEW document every time.
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
                        // NEW SYSTEM MARKER
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


                collectionAmountInput.value =
                    "";


                collectionAmountInput.focus();


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

                saveEntryBtn.disabled =
                    false;


                saveEntryBtn.innerHTML =
                    originalButtonHTML;

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

            teacherEntryForm.reset();


            employeeCodeInput.value =
                "";


            teacherNameInput.value =
                "";


            entryDateInput.value =
                getTodayDate();


            formMessage.className =
                "message";


            formMessage.textContent =
                "";

        }
    );

}



// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

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
);
