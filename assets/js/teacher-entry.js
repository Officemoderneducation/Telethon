// ======================================================
// TELETHON
// REGION USER - TEACHER ENTRY
//
// ACCESS LOGIC
//
// Access is loaded directly from Firestore
// for the currently logged-in Region User.
//
// Example:
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
// 1. Bihar State ke Teachers
// 2. Kolkata Region ke saare Teachers
// 3. Delhi ke baaki States ke Teachers nahi
//
// IMPORTANT:
//
// NO ACCESS = NO TEACHER
// EMPTY ACCESS = NO TEACHER
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where,
    doc,
    getDoc
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
// REGION USER COLLECTIONS
// ======================================================

const REGION_USER_COLLECTIONS = [

    "region_users",

    "regionUsers"

];



// ======================================================
// HTML ELEMENTS
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

let accessRules = [];

let currentUserData = null;



// ======================================================
// LOGIN INFORMATION
// ======================================================

const currentUserRole =
    String(
        localStorage.getItem(
            "userRole"
        ) || ""
    )
    .trim()
    .toLowerCase();


const loggedInUser =
    String(
        localStorage.getItem(
            "loggedInEmpCode"
        ) || ""
    )
    .trim();



// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(
        value ?? ""
    )
    .trim()
    .toLowerCase()
    .replace(
        /\s+/g,
        " "
    );

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
// EMPLOYEE CODE
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

        employee.id ||

        ""

    ).trim();

}



// ======================================================
// TEACHER NAME
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
// EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

    if (!employee) {

        return "";

    }


    return normalize(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        employee.assignedRegion ||

        employee.assigned_region ||

        employee.Region ||

        employee.REGION ||

        ""

    );

}



// ======================================================
// EMPLOYEE STATE
// ======================================================

function getEmployeeState(employee) {

    if (!employee) {

        return "";

    }


    return normalize(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        employee.assignedState ||

        employee.assigned_state ||

        employee.State ||

        employee.STATE ||

        ""

    );

}



// ======================================================
// JAMIATUL MADINA
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
// GET LOGGED IN REGION USER NAME
// ======================================================

function getLoggedInRegionUserName() {

    return (

        localStorage.getItem(
            "regionUserName"
        ) ||

        currentUserData?.userName ||

        currentUserData?.username ||

        currentUserData?.name ||

        currentUserData?.fullName ||

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

        loggedInUser ||

        ""

    );

}



// ======================================================
// GET USER FIELD
// ======================================================

function getUserField(
    userData,
    fields
) {

    for (
        const field
        of fields
    ) {

        if (

            userData &&

            userData[field] !==
                undefined &&

            userData[field] !==
                null &&

            String(
                userData[field]
            ).trim() !== ""

        ) {

            return userData[field];

        }

    }

    return "";

}



// ======================================================
// LOAD CURRENT REGION USER
//
// SAME LOGIC AS region-user.js
// ======================================================

async function loadRegionUser() {

    // ==================================================
    // ADMIN
    // ==================================================

    if (
        currentUserRole === "admin"
    ) {

        currentUserData = {

            role:
                "admin",

            name:
                "Administrator"

        };


        accessRules = [];


        console.log(
            "Logged In As Administrator"
        );


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



    // ==================================================
    // LOGIN CODE
    // ==================================================

    if (!loggedInUser) {

        throw new Error(
            "Login session nahi mili. Please dobara login karein."
        );

    }



    console.log(
        "Logged In Region User:",
        loggedInUser
    );



    let userData = null;



    // ==================================================
    // POSSIBLE LOGIN FIELDS
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
    //
    // SAME AS region-user.js
    // ==================================================

    for (
        const collectionName
        of REGION_USER_COLLECTIONS
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


                    console.log(
                        "Region User Found:",
                        collectionName,
                        fieldName,
                        userData
                    );


                    break;

                }

            }

            catch (error) {

                console.warn(

                    `Search error:
                    ${collectionName}.${fieldName}`,

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
            of REGION_USER_COLLECTIONS
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


                    console.log(

                        "Region User Found By Document ID:",

                        collectionName

                    );


                    break;

                }

            }

            catch (error) {

                console.warn(

                    `Document search error:
                    ${collectionName}`,

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

            `Region User record nahi mila.

Login Code: ${loggedInUser}

Firestore collections:
region_users / regionUsers`

        );

    }



    // ==================================================
    // SAVE CURRENT USER
    // ==================================================

    currentUserData =
        userData;



    // ==================================================
    // USER NAME
    // ==================================================

    const userName =

        getUserField(
            userData,
            [

                "userName",

                "username",

                "name",

                "fullName",

                "teacherName",

                "teacher_name"

            ]
        ) ||

        loggedInUser;



    // ==================================================
    // DISPLAY USER
    // ==================================================

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



    // ==================================================
    // ACCESS RULES
    //
    // SAME AS region-user.js
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

    else if (
        Array.isArray(
            userData.permissions
        )
    ) {

        accessRules =
            userData.permissions;

    }

    else {

        accessRules = [];

    }



    // ==================================================
    // DEBUG
    // ==================================================

    console.log(
        "=========================================="
    );


    console.log(
        "CURRENT REGION USER:",
        loggedInUser
    );


    console.log(
        "CURRENT USER DATA:",
        userData
    );


    console.log(
        "CURRENT USER ACCESS RULES:",
        accessRules
    );


    console.log(
        "=========================================="
    );

}



// ======================================================
// GET RULE REGION
//
// SAME AS region-user.js
// ======================================================

function getRuleRegion(rule) {

    return normalize(

        rule.region ||

        rule.assignedRegion ||

        rule.assigned_region ||

        rule.regionName ||

        rule.region_name ||

        rule.Region ||

        rule.REGION ||

        ""

    );

}



// ======================================================
// GET RULE STATES
//
// SAME AS region-user.js
// ======================================================

function getRuleStates(rule) {

    let states = [];



    // ==================================================
    // ARRAY: states
    // ==================================================

    if (
        Array.isArray(
            rule.states
        )
    ) {

        states =
            rule.states;

    }



    // ==================================================
    // ARRAY: selectedStates
    // ==================================================

    else if (
        Array.isArray(
            rule.selectedStates
        )
    ) {

        states =
            rule.selectedStates;

    }



    // ==================================================
    // ARRAY: assignedStates
    // ==================================================

    else if (
        Array.isArray(
            rule.assignedStates
        )
    ) {

        states =
            rule.assignedStates;

    }



    // ==================================================
    // SINGLE STATE
    // ==================================================

    else if (
        rule.state
    ) {

        states = [

            rule.state

        ];

    }



    // ==================================================
    // STATE NAME
    // ==================================================

    else if (
        rule.stateName
    ) {

        states = [

            rule.stateName

        ];

    }



    // ==================================================
    // STRING STATES
    // ==================================================

    else if (
        typeof rule.states ===
        "string"
    ) {

        states =
            rule.states
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

    }



    return states

        .map(
            state =>
                normalize(state)
        )

        .filter(Boolean);

}



// ======================================================
// IS FULL REGION RULE
//
// SAME AS region-user.js
// ======================================================

function isFullRegionRule(rule) {

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
// GET SPECIFIC TEACHER CODES
//
// Additional support
// ======================================================

function getRuleEmployeeCodes(rule) {

    let codes =

        rule.employeeCodes ||

        rule.employee_codes ||

        rule.empCodes ||

        rule.emp_codes ||

        rule.teacherCodes ||

        rule.teacher_codes ||

        [];



    if (
        !Array.isArray(
            codes
        )
    ) {

        codes = [

            codes

        ];

    }



    return codes

        .map(
            code =>
                normalize(code)
        )

        .filter(Boolean);

}



// ======================================================
// CHECK EMPLOYEE ACCESS
//
// EXACT WORKING LOGIC FROM region-user.js
//
// PLUS SPECIFIC TEACHER CODE SUPPORT
// ======================================================

function hasEmployeeAccess(
    employee
) {

    // ==================================================
    // ADMIN
    // ==================================================

    if (
        currentUserRole === "admin"
    ) {

        return true;

    }



    // ==================================================
    // NO ACCESS RULES
    // ==================================================

    if (

        !Array.isArray(
            accessRules
        ) ||

        accessRules.length === 0

    ) {

        console.warn(
            "Region User has NO access rules."
        );


        return false;

    }



    const employeeRegion =
        getEmployeeRegion(
            employee
        );


    const employeeState =
        getEmployeeState(
            employee
        );


    const employeeCode =
        normalize(
            getEmployeeCode(
                employee
            )
        );



    // ==================================================
    // RULE CHECK
    // ==================================================

    return accessRules.some(
        (rule) => {

            if (!rule) {

                return false;

            }



            // ==================================================
            // RULE REGION
            // ==================================================

            const ruleRegion =
                getRuleRegion(
                    rule
                );



            // ==================================================
            // REGION MUST MATCH
            //
            // IMPORTANT:
            //
            // This prevents:
            //
            // Kolkata Region rule
            // from showing
            // Delhi/Bihar teacher.
            // ==================================================

            if (

                ruleRegion &&

                employeeRegion !==
                    ruleRegion

            ) {

                return false;

            }



            // ==================================================
            // SPECIFIC TEACHER ACCESS
            // ==================================================

            const allowedEmployeeCodes =
                getRuleEmployeeCodes(
                    rule
                );


            if (
                allowedEmployeeCodes.length > 0
            ) {

                return (
                    allowedEmployeeCodes.includes(
                        employeeCode
                    )
                );

            }



            // ==================================================
            // FULL REGION
            //
            // Example:
            //
            // {
            //     region: "Kolkata",
            //     state: ""
            // }
            //
            // => ALL KOLKATA TEACHERS
            // ==================================================

            if (
                isFullRegionRule(
                    rule
                )
            ) {

                return true;

            }



            // ==================================================
            // STATES
            // ==================================================

            const allowedStates =
                getRuleStates(
                    rule
                );



            // ==================================================
            // NO STATE RESTRICTION
            //
            // Example:
            //
            // {
            //     region: "Kolkata",
            //     state: ""
            // }
            //
            // If no explicit state restriction
            // exists, whole region is allowed.
            // ==================================================

            if (
                allowedStates.length === 0
            ) {

                return true;

            }



            // ==================================================
            // STATE MATCH
            // ==================================================

            return allowedStates.some(
                (allowedState) => {

                    if (

                        allowedState === "*" ||

                        allowedState === "all" ||

                        allowedState ===
                            "all states"

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
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    try {

        // ==================================================
        // LOADING MESSAGE
        // ==================================================

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
            "TELETHON - LOADING TEACHERS"
        );


        console.log(
            "=========================================="
        );



        // ==================================================
        // LOAD CURRENT REGION USER FIRST
        //
        // VERY IMPORTANT
        //
        // Access must be loaded before employees
        // are filtered.
        // ==================================================

        await loadRegionUser();



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
            "Employees With Code:",
            employeesWithCode.length
        );



        // ==================================================
        // ACCESS FILTER
        //
        // ONLY AUTHORIZED TEACHERS
        // ==================================================

        allowedEmployees =
            employeesWithCode.filter(
                function (employee) {

                    return hasEmployeeAccess(
                        employee
                    );

                }
            );



        // ==================================================
        // DEBUG
        // ==================================================

        console.log(
            "Allowed Teachers:",
            allowedEmployees.length
        );


        console.log(
            "Current Access Rules:",
            accessRules
        );



        // ==================================================
        // COMPLETE ACCESS TABLE
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
                            hasEmployeeAccess(
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

                        numeric:
                            true,

                        sensitivity:
                            "base"

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


        if (regionUserInfo) {

            regionUserInfo.innerHTML = `

                <span class="error">

                    ${escapeHTML(
                        error.message
                    )}

                </span>

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
    // NO ACCESS
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



            // ==================================================
            // EXTRA SECURITY CHECK
            //
            // Even if DOM/select is manipulated,
            // unauthorized teacher cannot be saved.
            // ==================================================

            if (
                !hasEmployeeAccess(
                    employee
                )
            ) {

                showMessage(
                    "Is Teacher ki Collection Entry ka access nahi hai.",
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
                // Existing entries are NOT changed.
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
    // TODAY DATE
    // ==============================================

    if (entryDateInput) {

        entryDateInput.value =
            getTodayDate();

    }



    // ==============================================
    // LOAD USER + TEACHERS
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
