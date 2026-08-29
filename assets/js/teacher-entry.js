// ======================================================
// TELETHON
// TEACHER ENTRY
//
// IMPORTANT
//
// OLD daily_entry COLLECTION:
// --------------------------------------
// Existing old entries ko touch nahi karta.
//
// NEW teacher-entry.html ENTRIES:
// --------------------------------------
// Nayi entries "teacher_entries" collection
// mein save hoti hain.
//
// SAME TEACHER + SAME DATE:
// --------------------------------------
// Multiple entries allowed.
// Har Save = NEW Firestore document.
//
// REGION USER:
// --------------------------------------
// Sirf assigned Teachers.
//
// ADMIN:
// --------------------------------------
// Sabhi Teachers.
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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

let currentUserData = null;


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
// JAMIATUL MADINA
// ======================================================

function getEmployeeJamiatul(employee) {

    return String(

        employee.jamiatulMadina ||

        employee.jamiatul_madina ||

        employee.jamiatul ||

        employee.madina ||

        ""

    ).trim();

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
// GET FULL REGION FLAG
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
// GET RULE REGION
// ======================================================

function getRuleRegion(rule) {

    if (!rule) {
        return "";
    }


    return normalize(

        rule.region ||

        rule.assignedRegion ||

        rule.regionName ||

        rule.region_name ||

        ""

    );

}


// ======================================================
// GET RULE STATES
// ======================================================

function getRuleStates(rule) {

    if (!rule) {
        return [];
    }


    if (rule.state) {

        return [
            String(rule.state)
        ];

    }


    if (
        Array.isArray(
            rule.states
        )
    ) {

        return rule.states;

    }


    if (
        typeof rule.states ===
        "string"
    ) {

        return [
            rule.states
        ];

    }


    if (
        Array.isArray(
            rule.selectedStates
        )
    ) {

        return rule.selectedStates;

    }


    if (
        Array.isArray(
            rule.assignedStates
        )
    ) {

        return rule.assignedStates;

    }


    if (rule.stateName) {

        return [
            rule.stateName
        ];

    }


    return [];

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
    // NO ACCESS RULE
    // ==================================================

    if (
        !Array.isArray(accessRules) ||
        accessRules.length === 0
    ) {

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
    // CHECK ALL ACCESS RULES
    // ==================================================

    return accessRules.some(
        (rule) => {

            if (!rule) {
                return false;
            }


            const assignedRegion =
                getRuleRegion(
                    rule
                );


            // ==================================================
            // REGION MATCH
            // ==================================================

            if (
                assignedRegion &&
                assignedRegion !==
                employeeRegion
            ) {

                return false;

            }


            // ==================================================
            // FULL REGION
            // ==================================================

            if (
                isFullRegionRule(
                    rule
                )
            ) {

                return true;

            }


            // ==================================================
            // STATE ACCESS
            // ==================================================

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


            // ==================================================
            // CHECK STATE
            // ==================================================

            return states.some(
                (state) => {

                    const allowedState =
                        normalize(
                            state
                        );


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

        currentUserData = {
            role: "admin",
            name: "Administrator"
        };


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
    // REGION USER
    // ==================================================

    const validRegionRoles = [

        "regionuser",
        "region_user",
        "region-user"

    ];


    if (
        !validRegionRoles.includes(
            currentUserRole
        )
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
    // COLLECTIONS
    //
    // Current screenshot ke according:
    // regionUsers
    //
    // Backup:
    // region_users
    // ==================================================

    const collectionNames = [

        "regionUsers",

        "region_users"

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
    // SEARCH BY FIELD
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
    // SEARCH BY DOCUMENT ID
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

                const userRef =
                    doc(
                        db,
                        collectionName,
                        loggedInUser
                    );


                const userSnap =
                    await getDoc(
                        userRef
                    );


                if (
                    userSnap.exists()
                ) {

                    userData =
                        userSnap.data();

                    break;

                }

            }

            catch (error) {

                console.warn(
                    "Document Search Error:",
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


    currentUserData =
        userData;


    // ==================================================
    // USER NAME
    // ==================================================

    const userName =

        userData.userName ||

        userData.username ||

        userData.name ||

        userData.fullName ||

        userData.full_name ||

        loggedInUser;


    // ==================================================
    // DISPLAY USER
    // ==================================================

    if (regionUserInfo) {

        regionUserInfo.innerHTML = `
            Region User:
            <strong>
                ${escapeHTML(
                    userName
                )}
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


    console.log(
        "Current Region User:",
        userData
    );


    console.log(
        "Access Rules:",
        accessRules
    );

}


// ======================================================
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    const employeeSnapshot =
        await getDocs(
            collection(
                db,
                "employees"
            )
        );


    allEmployees = [];


    employeeSnapshot.forEach(
        (employeeDoc) => {

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
            (employee) =>
                hasEmployeeAccess(
                    employee
                )
        );


    console.log(
        "All Teachers:",
        allEmployees.length
    );


    console.log(
        "Visible Teachers:",
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


    if (
        visibleEmployees.length === 0
    ) {

        teacherSelect.innerHTML = `

            <option value="">
                No Assigned Teacher Found
            </option>

        `;

        return;

    }


    // ==================================================
    // SORT TEACHERS
    // ==================================================

    const sortedEmployees =
        [...visibleEmployees].sort(
            (a, b) => {

                const nameA =
                    normalize(
                        getTeacherName(a)
                    );

                const nameB =
                    normalize(
                        getTeacherName(b)
                    );

                return nameA.localeCompare(
                    nameB
                );

            }
        );


    // ==================================================
    // OPTIONS
    // ==================================================

    sortedEmployees.forEach(
        (employee) => {

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


            option.value =
                code;


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
// TEACHER SELECT CHANGE
// ======================================================

if (teacherSelect) {

    teacherSelect.addEventListener(
        "change",
        function () {

            clearMessage();


            const selectedCode =
                normalize(
                    this.value
                );


            if (!selectedCode) {

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


            // ==================================================
            // FIND SELECTED TEACHER
            // ==================================================

            const employee =
                visibleEmployees.find(
                    (item) =>
                        normalize(
                            getEmployeeCode(
                                item
                            )
                        ) ===
                        selectedCode
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


            // ==================================================
            // FILL EMPLOYEE CODE
            // ==================================================

            if (employeeCodeInput) {

                employeeCodeInput.value =
                    getEmployeeCode(
                        employee
                    );

            }


            // ==================================================
            // FILL TEACHER NAME
            // ==================================================

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
// DEFAULT DATE
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


    entryDateInput.value =
        year +
        "-" +
        month +
        "-" +
        day;

}


// ======================================================
// RESET FORM
// ======================================================

function resetEntryForm() {

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

            resetEntryForm();

        }
    );

}


// ======================================================
// SAVE ENTRY
//
// IMPORTANT
//
// NEW COLLECTION:
// teacher_entries
//
// Every save creates NEW document.
//
// Same Teacher + Same Date
// multiple entries allowed.
// ======================================================

if (teacherEntryForm) {

    teacherEntryForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            clearMessage();


            // ==================================================
            // BUTTON DISABLE
            // ==================================================

            if (saveEntryBtn) {

                saveEntryBtn.disabled =
                    true;

                saveEntryBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Saving...
                `;

            }


            try {

                // ==================================================
                // VALUES
                // ==================================================

                const selectedCode =
                    String(
                        teacherSelect?.value || ""
                    ).trim();


                const employeeCode =
                    String(
                        employeeCodeInput?.value || ""
                    ).trim();


                const teacherName =
                    String(
                        teacherNameInput?.value || ""
                    ).trim();


                const entryDate =
                    String(
                        entryDateInput?.value || ""
                    ).trim();


                const amount =
                    Number(
                        String(
                            collectionAmountInput?.value || ""
                        )
                        .replace(/,/g, "")
                        .trim()
                    );


                // ==================================================
                // VALIDATION
                // ==================================================

                if (!selectedCode) {

                    throw new Error(
                        "Please Teacher select karein."
                    );

                }


                if (!employeeCode) {

                    throw new Error(
                        "Employee Code nahi mila."
                    );

                }


                if (!teacherName) {

                    throw new Error(
                        "Teacher Name nahi mila."
                    );

                }


                if (!entryDate) {

                    throw new Error(
                        "Please Entry Date select karein."
                    );

                }


                if (
                    !Number.isFinite(amount) ||
                    amount <= 0
                ) {

                    throw new Error(
                        "Please valid Collection Amount enter karein."
                    );

                }


                // ==================================================
                // VERIFY TEACHER ACCESS
                //
                // Security / accidental wrong selection protection
                // ==================================================

                const selectedEmployee =
                    visibleEmployees.find(
                        (employee) =>
                            normalize(
                                getEmployeeCode(
                                    employee
                                )
                            ) ===
                            normalize(
                                employeeCode
                            )
                    );


                if (!selectedEmployee) {

                    throw new Error(
                        "Aapko is Teacher ki entry karne ki permission nahi hai."
                    );

                }


                // ==================================================
                // TEACHER DETAILS
                // ==================================================

                const finalTeacherName =
                    getTeacherName(
                        selectedEmployee
                    );


                const finalRegion =
                    getEmployeeRegion(
                        selectedEmployee
                    );


                const finalState =
                    getEmployeeState(
                        selectedEmployee
                    );


                const finalCity =
                    getEmployeeCity(
                        selectedEmployee
                    );


                const finalJamiatul =
                    getEmployeeJamiatul(
                        selectedEmployee
                    );


                // ==================================================
                // SAVE TO NEW COLLECTION
                //
                // IMPORTANT:
                // addDoc = NEW DOCUMENT
                //
                // Existing daily_entry is NOT modified.
                // ==================================================

                const newEntry = {

                    // ==========================================
                    // Teacher
                    // ==========================================

                    employeeCode:
                        employeeCode,

                    employee_code:
                        employeeCode,

                    teacherName:
                        finalTeacherName ||
                        teacherName,

                    teacher_name:
                        finalTeacherName ||
                        teacherName,


                    // ==========================================
                    // Collection
                    // ==========================================

                    amount:
                        amount,

                    collection:
                        amount,

                    collectionAmount:
                        amount,


                    // ==========================================
                    // Date
                    // ==========================================

                    date:
                        entryDate,

                    entryDate:
                        entryDate,


                    // ==========================================
                    // Teacher Location
                    // ==========================================

                    region:
                        finalRegion,

                    state:
                        finalState,

                    city:
                        finalCity,

                    jamiatulMadina:
                        finalJamiatul,


                    // ==========================================
                    // Entry Source
                    // ==========================================

                    source:
                        "teacher-entry",

                    entrySource:
                        "teacher-entry",


                    // ==========================================
                    // Entered By
                    // ==========================================

                    enteredBy:
                        loggedInUser,

                    enteredByRole:
                        currentUserRole,


                    // ==========================================
                    // Created Time
                    //
                    // Daily Report latest code ke liye
                    // bhi useful rahega.
                    // ==========================================

                    createdAt:
                        serverTimestamp(),

                    entryTime:
                        serverTimestamp(),

                    submittedAt:
                        serverTimestamp()

                };


                // ==================================================
                // FIRESTORE
                // NEW COLLECTION
                // ==================================================

                const docRef =
                    await addDoc(

                        collection(
                            db,
                            "teacher_entries"
                        ),

                        newEntry

                    );


                console.log(
                    "New Teacher Entry Saved:",
                    docRef.id
                );


                console.log(
                    "Saved Data:",
                    newEntry
                );


                // ==================================================
                // SUCCESS
                // ==================================================

                showMessage(
                    "Collection Entry successfully save ho gayi.",
                    "success"
                );


                // ==================================================
                // CLEAR ONLY ENTRY VALUES
                // ==================================================

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


                // Date ko current date par rakhen
                setDefaultDate();


            }

            catch (error) {

                console.error(
                    "Teacher Entry Save Error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Entry save nahi ho saki.",
                    "error"
                );

            }

            finally {

                // ==================================================
                // ENABLE BUTTON
                // ==================================================

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
// LOAD DATA
// ======================================================

async function loadData() {

    try {

        // ==================================================
        // USER
        // ==================================================

        await loadRegionUser();


        // ==================================================
        // EMPLOYEES
        // ==================================================

        await loadEmployees();


        // ==================================================
        // TEACHER SELECT
        // ==================================================

        loadTeacherOptions();


        // ==================================================
        // DEFAULT DATE
        // ==================================================

        setDefaultDate();


        console.log(
            "Teacher Entry Ready."
        );


    }

    catch (error) {

        console.error(
            "Teacher Entry Load Error:",
            error
        );


        showMessage(
            error.message ||
            "Page load nahi ho saki.",
            "error"
        );


        if (teacherSelect) {

            teacherSelect.innerHTML = `

                <option value="">
                    ${escapeHTML(
                        error.message ||
                        "Unable to load Teachers"
                    )}
                </option>

            `;

        }

    }

}


// ======================================================
// START
// ======================================================

loadData();
