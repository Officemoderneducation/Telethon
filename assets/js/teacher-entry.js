// ======================================================
// TELETHON
// REGION USER - TEACHER ENTRY
//
// IMPORTANT:
// Existing / Old Entries are NOT changed.
// Every new entry is saved as a NEW document.
// Same Teacher + Same Date multiple entries are allowed.
// ======================================================


// ======================================================
// FIREBASE
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

const EMPLOYEES_COLLECTION = "employees";

const DAILY_ENTRY_COLLECTION = "daily_entry";


// ======================================================
// DOM ELEMENTS
// ======================================================

const teacherEntryForm =
    document.getElementById("teacherEntryForm");

const teacherSelect =
    document.getElementById("teacherSelect");

const employeeCodeInput =
    document.getElementById("employeeCode");

const teacherNameInput =
    document.getElementById("teacherName");

const entryDateInput =
    document.getElementById("entryDate");

const collectionAmountInput =
    document.getElementById("collectionAmount");

const saveEntryBtn =
    document.getElementById("saveEntryBtn");

const resetEntryBtn =
    document.getElementById("resetEntryBtn");

const formMessage =
    document.getElementById("formMessage");

const regionUserInfo =
    document.getElementById("regionUserInfo");


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
// ARRAY HELPER
// ======================================================

function makeArray(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return [];

    }


    if (Array.isArray(value)) {

        return value
            .map(function (item) {

                return String(item || "").trim();

            })
            .filter(Boolean);

    }


    return String(value)
        .split(",")
        .map(function (item) {

            return item.trim();

        })
        .filter(Boolean);

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

    ).trim();

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

    ).trim();

}


// ======================================================
// GET EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

    return String(

        employee.region ||

        employee.Region ||

        employee.regionName ||

        employee.region_name ||

        ""

    ).trim();

}


// ======================================================
// GET EMPLOYEE STATE
// ======================================================

function getEmployeeState(employee) {

    return String(

        employee.state ||

        employee.State ||

        employee.stateName ||

        employee.state_name ||

        ""

    ).trim();

}


// ======================================================
// GET JAMIATUL
// ======================================================

function getEmployeeJamiatul(employee) {

    return String(

        employee.jamiatulMadina ||

        employee.jamiatul_madina ||

        employee.jamiatul ||

        employee.madrasa ||

        ""

    ).trim();

}


// ======================================================
// TODAY DATE
// ======================================================

function getTodayDate() {

    const today = new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
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
        "message " + type;


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

        console.warn(
            "regionUserAccess is not JSON:",
            savedAccess
        );

        return savedAccess;

    }

}


// ======================================================
// GET ACCESS RULES
//
// Supports:
// Array
// Object
// String
// ======================================================

function getAccessRules(access) {

    if (!access) {

        return [];

    }


    if (Array.isArray(access)) {

        return access;

    }


    if (
        typeof access === "object"
    ) {

        // Existing system may store rules
        // inside accessRules / access

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


        if (
            Array.isArray(
                access.access
            )
        ) {

            return access.access;

        }


        return [access];

    }


    return [access];

}


// ======================================================
// CHECK SINGLE ACCESS RULE
// ======================================================

function employeeMatchesSingleRule(
    employee,
    rule
) {

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
    // STRING RULE
    // ==============================================

    if (
        typeof rule === "string"
    ) {

        const ruleValue =
            normalize(rule);


        // Region match

        if (
            ruleValue ===
            employeeRegion
        ) {

            return true;

        }


        // State match

        if (
            ruleValue ===
            employeeState
        ) {

            return true;

        }


        return false;

    }


    // ==============================================
    // INVALID RULE
    // ==============================================

    if (
        !rule ||
        typeof rule !== "object"
    ) {

        return false;

    }


    // ==============================================
    // GET RULE REGION
    // ==============================================

    const ruleRegion =
        normalize(

            rule.region ||

            rule.Region ||

            rule.regionName ||

            rule.region_name ||

            ""

        );


    // ==============================================
    // GET RULE STATES
    // ==============================================

    let ruleStates =

        rule.states ||

        rule.States ||

        rule.state ||

        rule.State ||

        rule.stateName ||

        rule.state_name ||

        [];


    ruleStates =
        makeArray(ruleStates)
            .map(normalize)
            .filter(Boolean);


    // ==============================================
    // FULL ACCESS
    // No region + no state restriction
    // ==============================================

    if (
        !ruleRegion &&
        ruleStates.length === 0
    ) {

        return true;

    }


    // ==============================================
    // REGION CHECK
    // ==============================================

    if (
        ruleRegion
    ) {

        if (
            !employeeRegion
        ) {

            return false;

        }


        if (
            ruleRegion !==
            employeeRegion
        ) {

            return false;

        }

    }


    // ==============================================
    // STATE CHECK
    // ==============================================

    if (
        ruleStates.length > 0
    ) {

        if (
            !employeeState
        ) {

            return false;

        }


        if (
            !ruleStates.includes(
                employeeState
            )
        ) {

            return false;

        }

    }


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


    // ==============================================
    // NO ACCESS DATA
    //
    // For safety we allow all teachers here.
    // This prevents an empty dropdown because of
    // missing localStorage data.
    // ==============================================

    if (!access) {

        return true;

    }


    const rules =
        getAccessRules(
            access
        );


    if (
        rules.length === 0
    ) {

        return true;

    }


    // ==============================================
    // ANY RULE MATCH
    // ==============================================

    return rules.some(
        function (rule) {

            return employeeMatchesSingleRule(
                employee,
                rule
            );

        }
    );

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


        // ==============================================
        // LOAD EMPLOYEES
        // ==============================================

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


        console.log(
            "Total Employees:",
            allEmployees.length
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


                    // Employee code required

                    if (!code) {

                        return false;

                    }


                    return employeeMatchesRegionAccess(
                        employee
                    );

                }
            );


        console.log(
            "Allowed Teachers:",
            allowedEmployees.length
        );


        console.log(
            "Region User Access:",
            getRegionUserAccess()
        );


        // ==============================================
        // SORT
        // ==============================================

        allowedEmployees.sort(
            function (a, b) {

                return getEmployeeCode(a)
                    .localeCompare(
                        getEmployeeCode(b)
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


    // ==============================================
    // NO TEACHER
    // ==============================================

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


    // ==============================================
    // ADD TEACHERS
    // ==============================================

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
                name
                    ? code + " - " + name
                    : code;


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
            // CLEAR
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
            // SET TEACHER DATA
            // ==========================================

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
                Number(
                    collectionAmountInput
                        ? collectionAmountInput.value
                        : 0
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


            const originalButtonHTML =
                saveEntryBtn
                    ? saveEntryBtn.innerHTML
                    : "";


            try {

                // ======================================
                // LOADING
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
                // Every submit creates a NEW document.
                //
                // Old entries remain unchanged.
                // ======================================

                await addDoc(
                    collection(
                        db,
                        DAILY_ENTRY_COLLECTION
                    ),

                    {

                        // ==================================
                        // TEACHER
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
                        // LOCATION
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
                        // ENTRY
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
                        // NEW SYSTEM
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

document.addEventListener(
    "DOMContentLoaded",
    async function () {

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
);
