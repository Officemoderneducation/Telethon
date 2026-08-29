// ======================================================
// TELETHON
// TEACHER ENTRY
//
// NEW ENTRIES:
// Firebase Collection = teacher_entries
//
// IMPORTANT:
// Existing daily_entry collection is NOT modified.
//
// Same Teacher + Same Date:
// Multiple entries are allowed.
// Every new entry is saved as a NEW document.
// ======================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// COLLECTIONS
// ======================================================

const EMPLOYEES_COLLECTION = "employees";


// IMPORTANT:
// New Teacher Entry data will ONLY be saved here.
const TEACHER_ENTRIES_COLLECTION = "teacher_entries";


// ======================================================
// HTML ELEMENTS
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

const regionUserInfoTop =
    document.getElementById("regionUserInfoTop");


// ======================================================
// LOGIN
// ======================================================

const currentUserRole =
    String(
        localStorage.getItem("userRole") || ""
    )
    .trim()
    .toLowerCase();


const loggedInUser =
    String(
        localStorage.getItem("loggedInEmpCode") || ""
    )
    .trim();


// ======================================================
// DATA
// ======================================================

let allEmployees = [];

let visibleEmployees = [];

let accessRules = [];


// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


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
// EMPLOYEE CODE
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

        employee.id ||

        ""

    ).trim();

}


// ======================================================
// TEACHER NAME
// ======================================================

function getTeacherName(employee) {

    return String(

        employee.teacherName ||

        employee.teacher_name ||

        employee.name ||

        employee.fullName ||

        employee.full_name ||

        ""

    ).trim();

}


// ======================================================
// JAMIATUL MADINA
// ======================================================

function getJamiatul(employee) {

    return String(

        employee.jamiatulMadina ||

        employee.jamiatul_madina ||

        employee.jamiatul ||

        employee.madina ||

        ""

    ).trim();

}


// ======================================================
// REGION
// ======================================================

function getEmployeeRegion(employee) {

    return String(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        ""

    ).trim();

}


// ======================================================
// STATE
// ======================================================

function getEmployeeState(employee) {

    return String(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        ""

    ).trim();

}


// ======================================================
// CITY
// ======================================================

function getEmployeeCity(employee) {

    return String(

        employee.city ||

        employee.cityName ||

        employee.city_name ||

        ""

    ).trim();

}


// ======================================================
// FULL REGION CHECK
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

function hasEmployeeAccess(employee) {

    // ==================================================
    // ADMIN
    // ==================================================

    if (
        currentUserRole === "admin"
    ) {

        return true;

    }


    // ==================================================
    // REGION USER
    // ==================================================

    if (
        !Array.isArray(accessRules) ||
        accessRules.length === 0
    ) {

        return false;

    }


    const employeeRegion =
        normalize(
            getEmployeeRegion(employee)
        );


    const employeeState =
        normalize(
            getEmployeeState(employee)
        );


    return accessRules.some(
        function (rule) {

            if (!rule) {

                return false;

            }


            const assignedRegion =
                normalize(

                    rule.region ||

                    rule.assignedRegion ||

                    rule.regionName ||

                    rule.region_name ||

                    ""

                );


            // ==========================================
            // REGION CHECK
            // ==========================================

            if (
                assignedRegion &&
                assignedRegion !== employeeRegion
            ) {

                return false;

            }


            // ==========================================
            // FULL REGION
            // ==========================================

            if (
                isFullRegionRule(rule)
            ) {

                return true;

            }


            // ==========================================
            // STATES
            // ==========================================

            let states = [];


            if (rule.state) {

                states = [
                    rule.state
                ];

            }

            else if (
                Array.isArray(rule.states)
            ) {

                states =
                    rule.states;

            }

            else if (
                typeof rule.states === "string"
            ) {

                states = [
                    rule.states
                ];

            }

            else if (
                Array.isArray(rule.selectedStates)
            ) {

                states =
                    rule.selectedStates;

            }

            else if (
                Array.isArray(rule.assignedStates)
            ) {

                states =
                    rule.assignedStates;

            }

            else if (
                rule.stateName
            ) {

                states = [
                    rule.stateName
                ];

            }


            // ==========================================
            // NO STATE RESTRICTION
            // ==========================================

            if (
                states.length === 0
            ) {

                return true;

            }


            // ==========================================
            // STATE MATCH
            // ==========================================

            return states.some(
                function (state) {

                    const allowedState =
                        normalize(state);


                    if (

                        allowedState === "*" ||

                        allowedState === "all" ||

                        allowedState === "all states"

                    ) {

                        return true;

                    }


                    return (
                        allowedState ===
                        employeeState
                    );

                }
            );

        }
    );

}


// ======================================================
// LOAD REGION USER
// ======================================================

async function loadRegionUser() {

    // ==================================================
    // ADMIN
    // ==================================================

    if (
        currentUserRole === "admin"
    ) {

        accessRules = [];


        if (regionUserInfo) {

            regionUserInfo.innerHTML = `
                Region User:
                <strong>
                    Administrator
                </strong>
            `;

        }


        if (regionUserInfoTop) {

            regionUserInfoTop.textContent =
                "Administrator";

        }


        return;

    }


    // ==================================================
    // REGION USER ROLE CHECK
    // ==================================================

    if (

        currentUserRole !== "regionuser" &&

        currentUserRole !== "region_user" &&

        currentUserRole !== "region-user"

    ) {

        throw new Error(
            "Region User login required."
        );

    }


    if (!loggedInUser) {

        throw new Error(
            "Login session nahi mili. Please dobara login karein."
        );

    }


    let userData = null;


    // ==================================================
    // POSSIBLE COLLECTIONS
    // ==================================================

    const collectionNames = [

        "region_users",

        "regionUsers"

    ];


    // ==================================================
    // POSSIBLE USER CODE FIELDS
    // ==================================================

    const fieldsToCheck = [

        "userCode",

        "employeeCode",

        "employee_code",

        "user_code",

        "empCode",

        "emp_code"

    ];


    // ==================================================
    // SEARCH REGION USER
    // ==================================================

    for (
        const collectionName
        of collectionNames
    ) {

        if (userData) {

            break;

        }


        for (
            const fieldName
            of fieldsToCheck
        ) {

            if (userData) {

                break;

            }


            try {

                const q =
                    query(

                        collection(
                            db,
                            collectionName
                        ),

                        where(
                            fieldName,
                            "==",
                            loggedInUser
                        )

                    );


                const snapshot =
                    await getDocs(q);


                if (
                    !snapshot.empty
                ) {

                    userData =
                        snapshot.docs[0].data();

                    break;

                }

            }

            catch (error) {

                console.warn(
                    "Region User Search Error:",
                    error
                );

            }

        }

    }


    // ==================================================
    // DOCUMENT ID SEARCH
    // ==================================================

    if (!userData) {

        for (
            const collectionName
            of collectionNames
        ) {

            if (userData) {

                break;

            }


            try {

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            collectionName
                        )
                    );


                const found =
                    snapshot.docs.find(
                        function (doc) {

                            return (
                                doc.id ===
                                loggedInUser
                            );

                        }
                    );


                if (found) {

                    userData =
                        found.data();

                    break;

                }

            }

            catch (error) {

                console.warn(
                    "Region User Document Search Error:",
                    error
                );

            }

        }

    }


    // ==================================================
    // USER NOT FOUND
    // ==================================================

    if (!userData) {

        throw new Error(
            "Region User record nahi mila."
        );

    }


    // ==================================================
    // USER NAME
    // ==================================================

    const userName =

        userData.userName ||

        userData.username ||

        userData.name ||

        userData.fullName ||

        loggedInUser;


    if (regionUserInfo) {

        regionUserInfo.innerHTML = `
            Region User:
            <strong>
                ${escapeHTML(userName)}
            </strong>
        `;

    }


    if (regionUserInfoTop) {

        regionUserInfoTop.textContent =
            userName;

    }


    // ==================================================
    // ACCESS RULES
    // ==================================================

    if (
        Array.isArray(
            userData.access
        )
    ) {

        accessRules =
            userData.access;

    }

    else if (
        Array.isArray(
            userData.accessRules
        )
    ) {

        accessRules =
            userData.accessRules;

    }

    else {

        accessRules = [];

    }

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


    allEmployees = [];


    snapshot.forEach(
        function (employeeDoc) {

            allEmployees.push({

                id:
                    employeeDoc.id,

                ...employeeDoc.data()

            });

        }
    );


    // ==================================================
    // APPLY ACCESS
    // ==================================================

    visibleEmployees =
        allEmployees.filter(
            function (employee) {

                return hasEmployeeAccess(
                    employee
                );

            }
        );


    console.log(
        "All Employees:",
        allEmployees.length
    );


    console.log(
        "Visible Employees:",
        visibleEmployees.length
    );

}


// ======================================================
// LOAD TEACHERS INTO SELECT
// ======================================================

function loadTeacherOptions() {

    if (!teacherSelect) {

        return;

    }


    teacherSelect.innerHTML = `
        <option value="">
            Select Teacher
        </option>
    `;


    visibleEmployees
        .sort(
            function (a, b) {

                return getTeacherName(a)
                    .localeCompare(
                        getTeacherName(b)
                    );

            }
        )
        .forEach(
            function (employee) {

                const code =
                    getEmployeeCode(
                        employee
                    );


                const name =
                    getTeacherName(
                        employee
                    );


                if (!code) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                /*
                 * Store Firestore employee ID
                 * as option value.
                 *
                 * This keeps selection reliable.
                 */

                option.value =
                    employee.id;


                option.textContent =
                    `${code} - ${name}`;


                teacherSelect.appendChild(
                    option
                );

            }
        );


    if (
        visibleEmployees.length === 0
    ) {

        teacherSelect.innerHTML = `
            <option value="">
                No Teachers Available
            </option>
        `;

    }

}


// ======================================================
// SELECT TEACHER
// ======================================================

if (teacherSelect) {

    teacherSelect.addEventListener(
        "change",
        function () {

            const employeeId =
                this.value;


            const employee =
                visibleEmployees.find(
                    function (item) {

                        return (
                            item.id ===
                            employeeId
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
// TODAY DATE
// ======================================================

function setDefaultDate() {

    if (!entryDateInput) {

        return;

    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        )
        .padStart(2, "0");


    const day =
        String(
            today.getDate()
        )
        .padStart(2, "0");


    entryDateInput.value =
        `${year}-${month}-${day}`;

}


// ======================================================
// MESSAGE
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
        `message ${type}`;

}


// ======================================================
// CLEAR MESSAGE
// ======================================================

function clearMessage() {

    if (!formMessage) {

        return;

    }


    formMessage.textContent =
        "";

    formMessage.className =
        "message";

}


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {

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


    setDefaultDate();

    clearMessage();

}


// ======================================================
// RESET BUTTON
// ======================================================

if (resetEntryBtn) {

    resetEntryBtn.addEventListener(
        "click",
        function () {

            resetForm();

        }
    );

}


// ======================================================
// SAVE NEW TEACHER ENTRY
// ======================================================

if (teacherEntryForm) {

    teacherEntryForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            clearMessage();


            // ==========================================
            // SELECTED TEACHER
            // ==========================================

            const employeeId =
                teacherSelect?.value || "";


            const employee =
                visibleEmployees.find(
                    function (item) {

                        return (
                            item.id ===
                            employeeId
                        );

                    }
                );


            if (!employee) {

                showMessage(
                    "Please Select Teacher.",
                    "error"
                );

                return;

            }


            // ==========================================
            // EMPLOYEE CODE
            // ==========================================

            const employeeCode =
                getEmployeeCode(
                    employee
                );


            if (!employeeCode) {

                showMessage(
                    "Selected Teacher ka Employee Code nahi mila.",
                    "error"
                );

                return;

            }


            // ==========================================
            // TEACHER NAME
            // ==========================================

            const teacherName =
                getTeacherName(
                    employee
                );


            // ==========================================
            // DATE
            // ==========================================

            const entryDate =
                String(
                    entryDateInput?.value || ""
                ).trim();


            if (!entryDate) {

                showMessage(
                    "Please Entry Date select karein.",
                    "error"
                );

                return;

            }


            // ==========================================
            // AMOUNT
            // ==========================================

            const amount =
                Number(
                    collectionAmountInput?.value || 0
                );


            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                showMessage(
                    "Please valid Collection Amount enter karein.",
                    "error"
                );

                return;

            }


            // ==========================================
            // DISABLE SAVE BUTTON
            // ==========================================

            if (saveEntryBtn) {

                saveEntryBtn.disabled =
                    true;


                saveEntryBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Saving...
                `;

            }


            try {

                // ======================================
                // IMPORTANT
                //
                // NEW DOCUMENT
                // NEW COLLECTION
                //
                // teacher_entries
                //
                // Existing daily_entry is NOT touched.
                // ======================================

                const entryData = {

                    // ==================================
                    // Teacher Information
                    // ==================================

                    employeeCode:
                        employeeCode,

                    teacherName:
                        teacherName,

                    employeeId:
                        employee.id,


                    // ==================================
                    // Teacher Location
                    // ==================================

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
                        ),

                    jamiatulMadina:
                        getJamiatul(
                            employee
                        ),


                    // ==================================
                    // Collection
                    // ==================================

                    amount:
                        amount,


                    // ==================================
                    // Date
                    // ==================================

                    date:
                        entryDate,


                    // ==================================
                    // Entry Source
                    // ==================================

                    source:
                        "teacher-entry",


                    entrySource:
                        "teacher-entry.html",


                    // ==================================
                    // Who Created Entry
                    // ==================================

                    createdBy:
                        loggedInUser || "admin",


                    createdByRole:
                        currentUserRole || "unknown",


                    // ==================================
                    // Firestore Server Time
                    // ==================================

                    createdAt:
                        serverTimestamp()

                };


                // ======================================
                // SAVE
                //
                // addDoc = NEW DOCUMENT EVERY TIME
                //
                // Same Teacher + Same Date
                // multiple entries are allowed.
                // ======================================

                const newDoc =
                    await addDoc(
                        collection(
                            db,
                            TEACHER_ENTRIES_COLLECTION
                        ),
                        entryData
                    );


                console.log(
                    "New Teacher Entry Saved:",
                    newDoc.id,
                    entryData
                );


                // ======================================
                // SUCCESS
                // ======================================

                showMessage(
                    `Collection Entry successfully save ho gayi. Employee: ${employeeCode} | Amount: ₹ ${amount.toLocaleString("en-IN")}`,
                    "success"
                );


                // ======================================
                // RESET ONLY FORM INPUTS
                // ======================================

                if (teacherSelect) {

                    teacherSelect.value =
                        "";

                }


                if (employeeCodeInput) {

                    employeeCodeInput.value =
                        "";

                }


                if (teacherNameInput) {

                    teacherNameInput.value =
                        "";

                }


                if (collectionAmountInput) {

                    collectionAmountInput.value =
                        "";

                }


                // Date remains selected.


            }

            catch (error) {

                console.error(
                    "Teacher Entry Save Error:",
                    error
                );


                showMessage(
                    error?.message ||
                    "Entry save nahi ho saki. Please dobara try karein.",
                    "error"
                );

            }

            finally {

                // ======================================
                // ENABLE BUTTON
                // ======================================

                if (saveEntryBtn) {

                    saveEntryBtn.disabled =
                        false;


                    saveEntryBtn.innerHTML = `
                        <i class="fa-solid fa-floppy-disk"></i>
                        Save Entry
                    `;

                }

            }

        }
    );

}


// ======================================================
// INITIAL LOAD
// ======================================================

async function init() {

    try {

        showMessage(
            "Loading...",
            "success"
        );


        // ==========================================
        // LOGIN / ACCESS
        // ==========================================

        await loadRegionUser();


        // ==========================================
        // EMPLOYEES
        // ==========================================

        await loadEmployees();


        // ==========================================
        // TEACHERS
        // ==========================================

        loadTeacherOptions();


        // ==========================================
        // DEFAULT DATE
        // ==========================================

        setDefaultDate();


        clearMessage();


        console.log(
            "Teacher Entry Ready."
        );


        console.log(
            "New collection:",
            TEACHER_ENTRIES_COLLECTION
        );

    }

    catch (error) {

        console.error(
            "Teacher Entry Initialization Error:",
            error
        );


        showMessage(
            error?.message ||
            "Page load nahi ho saka.",
            "error"
        );


        if (teacherSelect) {

            teacherSelect.innerHTML = `
                <option value="">
                    Unable to Load Teachers
                </option>
            `;

        }

    }

}


// ======================================================
// START
// ======================================================

init();
