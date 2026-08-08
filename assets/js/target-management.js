// ======================================
// Telethon - Target Management
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const employeeSelect =
    document.getElementById("employeeSelect");

const targetAmountInput =
    document.getElementById("targetAmount");

const targetForm =
    document.getElementById("targetForm");

const targetMessage =
    document.getElementById("targetMessage");

const targetTableBody =
    document.getElementById("targetTableBody");

const targetSearch =
    document.getElementById("targetSearch");

const saveTargetBtn =
    document.getElementById("saveTargetBtn");


// Preview Elements

const employeePreview =
    document.getElementById("employeePreview");

const previewRegion =
    document.getElementById("previewRegion");

const previewState =
    document.getElementById("previewState");

const previewCity =
    document.getElementById("previewCity");

const previewMadina =
    document.getElementById("previewMadina");

const previewCode =
    document.getElementById("previewCode");

const previewTeacher =
    document.getElementById("previewTeacher");


// Summary Elements

const totalTeachersEl =
    document.getElementById("totalTeachers");

const totalTargetEl =
    document.getElementById("totalTarget");

const totalCollectionEl =
    document.getElementById("totalCollection");

const totalRemainingEl =
    document.getElementById("totalRemaining");


// ======================================
// Data
// ======================================

let employees = [];

let entries = [];


// ======================================
// Load Employees
// ======================================

async function loadEmployees() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "employees")
            );


        employees = [];


        snapshot.forEach((docSnapshot) => {

            const data =
                docSnapshot.data();


            const employeeCode =
                String(
                    data.employee_code ||
                    data.employeeCode ||
                    data.empCode ||
                    docSnapshot.id ||
                    ""
                ).trim();


            employees.push({

                id: docSnapshot.id,

                ...data,

                employeeCode:
                    employeeCode

            });

        });


        // Sort Employee Code

        employees.sort((a, b) =>
            String(a.employeeCode)
                .localeCompare(
                    String(b.employeeCode),
                    undefined,
                    {
                        numeric: true
                    }
                )
        );


        populateEmployeeSelect();


    }

    catch (error) {

        console.error(
            "Employee Load Error:",
            error
        );


        if (employeeSelect) {

            employeeSelect.innerHTML = `

                <option value="">

                    Employees load nahi ho paaye

                </option>

            `;

        }

    }

}


// ======================================
// Employee Dropdown
// ======================================

function populateEmployeeSelect() {

    if (!employeeSelect) {
        return;
    }


    employeeSelect.innerHTML = `

        <option value="">

            Select Teacher

        </option>

    `;


    employees.forEach((employee) => {


        const teacherName =
            employee.teacher_name ||
            employee.teacherName ||
            "-";


        const option =
            document.createElement("option");


        option.value =
            employee.id;


        option.textContent =
            `${employee.employeeCode} - ${teacherName}`;


        employeeSelect.appendChild(option);

    });

}


// ======================================
// Employee Selection
// ======================================

if (employeeSelect) {

    employeeSelect.addEventListener(
        "change",
        async function () {


            const employeeId =
                this.value;


            if (!employeeId) {

                if (employeePreview) {

                    employeePreview.style.display =
                        "none";

                }

                if (targetAmountInput) {

                    targetAmountInput.value =
                        "";

                }

                return;

            }


            const employee =
                employees.find(
                    item =>
                        item.id === employeeId
                );


            if (!employee) {
                return;
            }


            // Show Preview

            if (employeePreview) {

                employeePreview.style.display =
                    "grid";

            }


            previewRegion.textContent =
                employee.region || "-";


            previewState.textContent =
                employee.state || "-";


            previewCity.textContent =
                employee.city || "-";


            previewMadina.textContent =
                employee.jamiatul_madina ||
                employee.jamiatulMadina ||
                "-";


            previewCode.textContent =
                employee.employeeCode || "-";


            previewTeacher.textContent =
                employee.teacher_name ||
                employee.teacherName ||
                "-";


            // Existing Target

            if (targetAmountInput) {

                targetAmountInput.value =
                    employee.targetAmount ||
                    employee.target ||
                    "";

            }

        }
    );

}


// ======================================
// Load Daily Entries
// ======================================

async function loadEntries() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "daily_entry")
            );


        entries = [];


        snapshot.forEach((docSnapshot) => {

            entries.push({

                id: docSnapshot.id,

                ...docSnapshot.data()

            });

        });

    }

    catch (error) {

        console.error(
            "Daily Entry Load Error:",
            error
        );

    }

}


// ======================================
// Get Employee Collection
// ======================================

function getEmployeeCollection(employee) {

    const employeeCode =
        String(
            employee.employeeCode || ""
        ).trim();


    if (!employeeCode) {
        return 0;
    }


    let total = 0;


    entries.forEach((entry) => {


        const entryCode =
            String(

                entry.employee_code ||
                entry.employeeCode ||
                entry.empCode ||
                ""

            ).trim();


        if (
            entryCode === employeeCode
        ) {

            total +=
                Number(entry.amount) || 0;

        }

    });


    return total;

}


// ======================================
// Get Target
// ======================================

function getEmployeeTarget(employee) {

    return Number(

        employee.targetAmount ||
        employee.target ||
        0

    );

}


// ======================================
// Calculate Percentage
// ======================================

function getPercentage(
    target,
    collectionAmount
) {

    if (
        target <= 0
    ) {

        return 0;

    }


    return Math.round(
        (collectionAmount / target) * 100
    );

}


// ======================================
// Remaining Target
// ======================================

function getRemaining(
    target,
    collectionAmount
) {

    const remaining =
        target - collectionAmount;


    return Math.max(
        remaining,
        0
    );

}


// ======================================
// Save Target
// ======================================

if (targetForm) {

    targetForm.addEventListener(
        "submit",
        async function (e) {


            e.preventDefault();


            const employeeId =
                employeeSelect.value;


            const target =
                Number(
                    targetAmountInput.value
                );


            if (!employeeId) {

                showMessage(
                    "Please select a Teacher.",
                    "error"
                );

                return;

            }


            if (
                isNaN(target) ||
                target < 0
            ) {

                showMessage(
                    "Please enter a valid Target.",
                    "error"
                );

                return;

            }


            const employee =
                employees.find(
                    item =>
                        item.id === employeeId
                );


            if (!employee) {

                showMessage(
                    "Teacher not found.",
                    "error"
                );

                return;

            }


            try {


                if (saveTargetBtn) {

                    saveTargetBtn.disabled =
                        true;

                    saveTargetBtn.innerHTML = `

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Saving...

                    `;

                }


                // ==================================
                // Save Target in Employee Document
                // ==================================

                await setDoc(

    doc(
        db,
        "employees",
        employee.id
    ),

    {

        target: target,
        targetAmount: target

    },

    {

        merge: true

    }

);

                // Update Local Data

                employee.targetAmount =
                    target;


                showMessage(
                    "Target successfully saved.",
                    "success"
                );


                // Refresh Table

                await loadTargetTable();


            }

            catch (error) {

                console.error(
                    "Target Save Error:",
                    error
                );


                showMessage(
                    "Target save nahi hua: " +
                    error.message,
                    "error"
                );

            }


            finally {

                if (saveTargetBtn) {

                    saveTargetBtn.disabled =
                        false;

                    saveTargetBtn.innerHTML = `

                        <i class="fa-solid fa-save"></i>

                        Save Target

                    `;

                }

            }

        }
    );

}


// ======================================
// Message
// ======================================

function showMessage(
    message,
    type
) {

    if (!targetMessage) {
        return;
    }


    targetMessage.textContent =
        message;


    if (type === "success") {

        targetMessage.style.color =
            "#16a34a";

    }
    else {

        targetMessage.style.color =
            "#dc2626";

    }


    setTimeout(() => {

        targetMessage.textContent =
            "";

    }, 4000);

}


// ======================================
// Load Target Table
// ======================================

async function loadTargetTable() {


    if (!targetTableBody) {
        return;
    }


    targetTableBody.innerHTML = `

        <tr>

            <td colspan="12"
                class="loading">

                Loading Target Data...

            </td>

        </tr>

    `;


    await loadEntries();


    let totalTarget = 0;

    let totalCollection = 0;


    employees.forEach((employee) => {


        const target =
            getEmployeeTarget(employee);


        const collectionAmount =
            getEmployeeCollection(employee);


        totalTarget +=
            target;


        totalCollection +=
            collectionAmount;

    });


    const totalRemaining =
        Math.max(
            totalTarget - totalCollection,
            0
        );


    // ==================================
    // Summary
    // ==================================

    if (totalTeachersEl) {

        totalTeachersEl.textContent =
            employees.length;

    }


    if (totalTargetEl) {

        totalTargetEl.textContent =
            `₹ ${totalTarget.toLocaleString("en-IN")}`;

    }


    if (totalCollectionEl) {

        totalCollectionEl.textContent =
            `₹ ${totalCollection.toLocaleString("en-IN")}`;

    }


    if (totalRemainingEl) {

        totalRemainingEl.textContent =
            `₹ ${totalRemaining.toLocaleString("en-IN")}`;

    }


    // ==================================
    // Table
    // ==================================

    if (employees.length === 0) {

        targetTableBody.innerHTML = `

            <tr>

                <td colspan="12"
                    class="no-data">

                    No Teachers Found.

                </td>

            </tr>

        `;

        return;

    }


    displayTargetTable(
        employees
    );

}


// ======================================
// Display Target Table
// ======================================

function displayTargetTable(
    list
) {


    if (!targetTableBody) {
        return;
    }


    if (list.length === 0) {

        targetTableBody.innerHTML = `

            <tr>

                <td colspan="12"
                    class="no-data">

                    No Teacher Found.

                </td>

            </tr>

        `;

        return;

    }


    let html = "";


    list.forEach(
        (employee, index) => {


            const region =
                employee.region || "-";


            const state =
                employee.state || "-";


            const city =
                employee.city || "-";


            const madina =
                employee.jamiatul_madina ||
                employee.jamiatulMadina ||
                "-";


            const employeeCode =
                employee.employeeCode ||
                "-";


            const teacherName =
                employee.teacher_name ||
                employee.teacherName ||
                "-";


            const target =
                getEmployeeTarget(employee);


            const collectionAmount =
                getEmployeeCollection(
                    employee
                );


            const remaining =
                getRemaining(
                    target,
                    collectionAmount
                );


            const percentage =
                getPercentage(
                    target,
                    collectionAmount
                );


            const progress =
                Math.min(
                    percentage,
                    100
                );


            const remainingClass =
                remaining === 0
                    ? "remaining-zero"
                    : "remaining-amount";


            html += `

                <tr>


                    <td>

                        ${index + 1}

                    </td>


                    <td>

                        ${region}

                    </td>


                    <td>

                        ${state}

                    </td>


                    <td>

                        ${city}

                    </td>


                    <td>

                        ${madina}

                    </td>


                    <td>

                        <strong>

                            ${employeeCode}

                        </strong>

                    </td>


                    <td>

                        ${teacherName}

                    </td>


                    <td class="target-amount">

                        ₹ ${target.toLocaleString("en-IN")}

                    </td>


                    <td class="collection-amount">

                        ₹ ${collectionAmount.toLocaleString("en-IN")}

                    </td>


                    <td class="${remainingClass}">

                        ₹ ${remaining.toLocaleString("en-IN")}

                    </td>


                    <td>

                        <div class="percentage-box">

                            ${percentage}%

                        </div>


                        <div class="progress-container">

                            <div
                                class="progress-bar"
                                style="width:${progress}%;">
                            </div>

                        </div>

                    </td>


                    <td>

                        <button
                            class="edit-btn"
                            data-id="${employee.id}">

                            <i class="fa-solid fa-pen"></i>

                            Edit

                        </button>

                    </td>


                </tr>

            `;

        }
    );


    targetTableBody.innerHTML =
        html;


    // ==================================
    // Edit Buttons
    // ==================================

    document
        .querySelectorAll(".edit-btn")
        .forEach((button) => {


            button.addEventListener(
                "click",
                function () {


                    const employeeId =
                        this.dataset.id;


                    employeeSelect.value =
                        employeeId;


                    employeeSelect.dispatchEvent(
                        new Event("change")
                    );


                    document
                        .getElementById(
                            "targetAmount"
                        )
                        .focus();


                    window.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });

                }
            );

        });

}


// ======================================
// Search
// ======================================

if (targetSearch) {

    targetSearch.addEventListener(
        "input",
        function () {


            const search =
                this.value
                    .trim()
                    .toLowerCase();


            if (!search) {

                displayTargetTable(
                    employees
                );

                return;

            }


            const filtered =
                employees.filter(
                    (employee) => {


                        const employeeCode =
                            String(
                                employee.employeeCode ||
                                ""
                            ).toLowerCase();


                        const teacherName =
                            String(
                                employee.teacher_name ||
                                employee.teacherName ||
                                ""
                            ).toLowerCase();


                        const city =
                            String(
                                employee.city ||
                                ""
                            ).toLowerCase();


                        const state =
                            String(
                                employee.state ||
                                ""
                            ).toLowerCase();


                        const region =
                            String(
                                employee.region ||
                                ""
                            ).toLowerCase();


                        const madina =
                            String(
                                employee.jamiatul_madina ||
                                employee.jamiatulMadina ||
                                ""
                            ).toLowerCase();


                        return (

                            employeeCode.includes(
                                search
                            )

                            ||

                            teacherName.includes(
                                search
                            )

                            ||

                            city.includes(
                                search
                            )

                            ||

                            state.includes(
                                search
                            )

                            ||

                            region.includes(
                                search
                            )

                            ||

                            madina.includes(
                                search
                            )

                        );

                    }
                );


            displayTargetTable(
                filtered
            );

        }
    );

}


// ======================================
// Logout
// ======================================

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (e) {

            e.preventDefault();


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

}


// ======================================
// START
// ======================================

async function start() {

    await loadEmployees();

    await loadTargetTable();

}


start();
