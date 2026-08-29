// ======================================================
// TELETHON
// COMPETITION ENTRY
//
// File:
// assets/js/competition-entry.js
//
// PURPOSE:
//
// 1. Competition create karna
// 2. Competition Name save karna
// 3. Competition Date save karna
// 4. Competition End Time save karna
// 5. Side A mein multiple Region / State
// 6. Side B mein multiple Region / State
// 7. Competition configuration Firebase mein save karna
//
// IMPORTANT:
//
// Collection / Amount / Unit yahan SAVE nahi hoga.
//
// Actual collection baad mein:
// daily_entry + teacher_entries
//
// selected competition date ke according calculate hoga.
//
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// FIREBASE COLLECTION
// ======================================================

const COMPETITION_COLLECTION =
    "competitions";


// ======================================================
// HTML ELEMENTS
// ======================================================

const competitionForm =
    document.getElementById(
        "competitionForm"
    );


const competitionName =
    document.getElementById(
        "competitionName"
    );


const competitionDate =
    document.getElementById(
        "competitionDate"
    );


const competitionEndTime =
    document.getElementById(
        "competitionEndTime"
    );


const sideAContainer =
    document.getElementById(
        "sideAContainer"
    );


const sideBContainer =
    document.getElementById(
        "sideBContainer"
    );


const addSideARowBtn =
    document.getElementById(
        "addSideARow"
    );


const addSideBRowBtn =
    document.getElementById(
        "addSideBRow"
    );


const saveCompetitionBtn =
    document.getElementById(
        "saveCompetitionBtn"
    );


const messageBox =
    document.getElementById(
        "competitionMessage"
    );


// ======================================================
// DATA
// ======================================================

let allEmployees = [];


// ======================================================
// LOGIN
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
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
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
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


// ======================================================
// SHOW MESSAGE
// ======================================================

function showMessage(
    message,
    type = "success"
) {

    if (!messageBox) {
        return;
    }


    messageBox.textContent =
        message;


    messageBox.className =
        "competition-message " +
        type;


    messageBox.style.display =
        "block";


    setTimeout(
        () => {

            if (messageBox) {

                messageBox.style.display =
                    "none";

            }

        },
        5000
    );

}


// ======================================================
// DATE
// ======================================================

function formatDateForInput(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            date.getDate()
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
// DEFAULT DATE
// ======================================================

function setDefaultDate() {

    if (!competitionDate) {
        return;
    }


    const today =
        new Date();


    competitionDate.value =
        formatDateForInput(
            today
        );

}


// ======================================================
// GET EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(
    employee
) {

    return String(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        ""

    ).trim();

}


// ======================================================
// GET EMPLOYEE STATE
// ======================================================

function getEmployeeState(
    employee
) {

    return String(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        ""

    ).trim();

}


// ======================================================
// LOAD EMPLOYEES
//
// Employees collection se Region / State
// options banenge.
// ======================================================

async function loadEmployees() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        allEmployees = [];


        snapshot.forEach(
            (employeeDoc) => {

                allEmployees.push({

                    id:
                        employeeDoc.id,

                    ...employeeDoc.data()

                });

            }
        );


        console.log(
            "Competition Employees:",
            allEmployees.length
        );


        initializeRows();

    }

    catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );


        showMessage(
            "Employees data load nahi ho saka.",
            "error"
        );

    }

}


// ======================================================
// GET UNIQUE REGIONS
// ======================================================

function getRegions() {

    const regions =
        new Set();


    allEmployees.forEach(
        (employee) => {

            const region =
                getEmployeeRegion(
                    employee
                );


            if (region) {

                regions.add(
                    region
                );

            }

        }
    );


    return [
        ...regions
    ].sort(
        (a, b) =>
            a.localeCompare(
                b
            )
    );

}


// ======================================================
// GET STATES FOR REGION
// ======================================================

function getStatesForRegion(
    selectedRegion
) {

    const states =
        new Set();


    allEmployees.forEach(
        (employee) => {

            const region =
                getEmployeeRegion(
                    employee
                );


            const state =
                getEmployeeState(
                    employee
                );


            if (

                state &&

                normalize(region) ===
                normalize(
                    selectedRegion
                )

            ) {

                states.add(
                    state
                );

            }

        }
    );


    return [
        ...states
    ].sort(
        (a, b) =>
            a.localeCompare(
                b
            )
    );

}


// ======================================================
// CREATE REGION OPTIONS
// ======================================================

function getRegionOptionsHTML() {

    const regions =
        getRegions();


    let html = `
        <option value="">
            Select Region
        </option>
    `;


    regions.forEach(
        (region) => {

            html += `
                <option
                    value="${escapeHTML(
                        region
                    )}"
                >
                    ${escapeHTML(
                        region
                    )}
                </option>
            `;

        }
    );


    return html;

}


// ======================================================
// CREATE STATE OPTIONS
// ======================================================

function getStateOptionsHTML(
    region = ""
) {

    if (!region) {

        return `
            <option value="">
                Select State
            </option>
        `;

    }


    const states =
        getStatesForRegion(
            region
        );


    let html = `
        <option value="">
            Select State
        </option>
    `;


    states.forEach(
        (state) => {

            html += `
                <option
                    value="${escapeHTML(
                        state
                    )}"
                >
                    ${escapeHTML(
                        state
                    )}
                </option>
            `;

        }
    );


    return html;

}


// ======================================================
// CREATE SIDE ROW
// ======================================================

function createSideRow(
    side,
    rowNumber
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "competition-side-row";


    row.dataset.side =
        side;


    row.innerHTML = `

        <div class="competition-field">

            <label>
                Region
            </label>

            <select
                class="competition-region"
                data-side="${escapeHTML(
                    side
                )}"
            >

                ${getRegionOptionsHTML()}

            </select>

        </div>


        <div class="competition-field">

            <label>
                State
            </label>

            <select
                class="competition-state"
                data-side="${escapeHTML(
                    side
                )}"
                disabled
            >

                <option value="">
                    Select State
                </option>

            </select>

        </div>


        <button
            type="button"
            class="remove-side-row"
            title="Remove"
        >

            <i class="fa-solid fa-trash"></i>

        </button>

    `;


    // ==================================================
    // REGION CHANGE
    // ==================================================

    const regionSelect =
        row.querySelector(
            ".competition-region"
        );


    const stateSelect =
        row.querySelector(
            ".competition-state"
        );


    regionSelect.addEventListener(
        "change",
        function () {

            const selectedRegion =
                this.value;


            stateSelect.innerHTML =
                getStateOptionsHTML(
                    selectedRegion
                );


            stateSelect.disabled =
                !selectedRegion;

        }
    );


    // ==================================================
    // REMOVE ROW
    // ==================================================

    const removeButton =
        row.querySelector(
            ".remove-side-row"
        );


    removeButton.addEventListener(
        "click",
        function () {

            const container =
                side === "A"
                    ? sideAContainer
                    : sideBContainer;


            if (!container) {
                return;
            }


            const rows =
                container.querySelectorAll(
                    ".competition-side-row"
                );


            // At least one row should remain.

            if (
                rows.length <= 1
            ) {

                showMessage(
                    `Side ${side} mein kam se kam 1 Region/State hona chahiye.`,
                    "error"
                );

                return;

            }


            row.remove();

        }
    );


    return row;

}


// ======================================================
// INITIALIZE ROWS
// ======================================================

function initializeRows() {

    if (
        !sideAContainer ||
        !sideBContainer
    ) {

        return;

    }


    sideAContainer.innerHTML =
        "";


    sideBContainer.innerHTML =
        "";


    sideAContainer.appendChild(
        createSideRow(
            "A",
            1
        )
    );


    sideBContainer.appendChild(
        createSideRow(
            "B",
            1
        )
    );

}


// ======================================================
// ADD SIDE A ROW
// ======================================================

if (addSideARowBtn) {

    addSideARowBtn.addEventListener(
        "click",
        function () {

            if (!sideAContainer) {
                return;
            }


            const rowCount =
                sideAContainer.querySelectorAll(
                    ".competition-side-row"
                ).length;


            sideAContainer.appendChild(
                createSideRow(
                    "A",
                    rowCount + 1
                )
            );

        }
    );

}


// ======================================================
// ADD SIDE B ROW
// ======================================================

if (addSideBRowBtn) {

    addSideBRowBtn.addEventListener(
        "click",
        function () {

            if (!sideBContainer) {
                return;
            }


            const rowCount =
                sideBContainer.querySelectorAll(
                    ".competition-side-row"
                ).length;


            sideBContainer.appendChild(
                createSideRow(
                    "B",
                    rowCount + 1
                )
            );

        }
    );

}


// ======================================================
// GET SIDE DATA
//
// Example:
//
// Side A:
//
// [
//     {
//         region: "Kolkata",
//         state: "Bihar"
//     },
//     {
//         region: "Delhi",
//         state: "Jharkhand"
//     }
// ]
//
// ======================================================

function getSideData(
    container
) {

    if (!container) {
        return [];
    }


    const rows =
        container.querySelectorAll(
            ".competition-side-row"
        );


    const result = [];


    rows.forEach(
        (row) => {

            const regionSelect =
                row.querySelector(
                    ".competition-region"
                );


            const stateSelect =
                row.querySelector(
                    ".competition-state"
                );


            const region =
                String(
                    regionSelect?.value ||
                    ""
                ).trim();


            const state =
                String(
                    stateSelect?.value ||
                    ""
                ).trim();


            if (
                region ||
                state
            ) {

                result.push({

                    region:
                        region,

                    state:
                        state

                });

            }

        }
    );


    return result;

}


// ======================================================
// VALIDATE SIDE
// ======================================================

function validateSide(
    sideData,
    sideName
) {

    if (
        !Array.isArray(sideData) ||
        sideData.length === 0
    ) {

        return {
            valid: false,
            message:
                `Side ${sideName} mein kam se kam 1 Region/State select karein.`
        };

    }


    for (
        const item
        of sideData
    ) {

        if (
            !item.region &&
            !item.state
        ) {

            return {
                valid: false,
                message:
                    `Side ${sideName} mein Region ya State select karein.`
            };

        }


        // Region selected hai to State optional ho sakta hai.
        //
        // Example:
        //
        // Kolkata Region
        //
        // Iska matlab Kolkata Region ke sabhi
        // States.
        //
        // Isliye state ko mandatory nahi kiya gaya.

    }


    return {
        valid: true,
        message: ""
    };

}


// ======================================================
// CHECK DUPLICATE SIDE RULE
//
// Same Region + State ko same side mein
// duplicate nahi hone denge.
// ======================================================

function removeDuplicateSideEntries(
    sideData
) {

    const map =
        new Map();


    sideData.forEach(
        (item) => {

            const key =
                normalize(
                    item.region
                ) +
                "|" +
                normalize(
                    item.state
                );


            if (
                !map.has(key)
            ) {

                map.set(
                    key,
                    item
                );

            }

        }
    );


    return [
        ...map.values()
    ];

}


// ======================================================
// SAVE COMPETITION
// ======================================================

async function saveCompetition() {

    // ==================================================
    // DISABLE BUTTON
    // ==================================================

    if (saveCompetitionBtn) {

        saveCompetitionBtn.disabled =
            true;

        saveCompetitionBtn.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Saving...
            `;

    }


    try {

        // ==============================================
        // BASIC DATA
        // ==============================================

        const name =
            String(
                competitionName?.value ||
                ""
            ).trim();


        const date =
            String(
                competitionDate?.value ||
                ""
            ).trim();


        const endTime =
            String(
                competitionEndTime?.value ||
                ""
            ).trim();


        // ==============================================
        // BASIC VALIDATION
        // ==============================================

        if (!name) {

            throw new Error(
                "Competition Name enter karein."
            );

        }


        if (!date) {

            throw new Error(
                "Competition Date select karein."
            );

        }


        if (!endTime) {

            throw new Error(
                "Competition End Time select karein."
            );

        }


        // ==============================================
        // SIDE DATA
        // ==============================================

        let sideA =
            getSideData(
                sideAContainer
            );


        let sideB =
            getSideData(
                sideBContainer
            );


        // ==============================================
        // DUPLICATES REMOVE
        // ==============================================

        sideA =
            removeDuplicateSideEntries(
                sideA
            );


        sideB =
            removeDuplicateSideEntries(
                sideB
            );


        // ==============================================
        // VALIDATE SIDE A
        // ==============================================

        const sideAValidation =
            validateSide(
                sideA,
                "A"
            );


        if (
            !sideAValidation.valid
        ) {

            throw new Error(
                sideAValidation.message
            );

        }


        // ==============================================
        // VALIDATE SIDE B
        // ==============================================

        const sideBValidation =
            validateSide(
                sideB,
                "B"
            );


        if (
            !sideBValidation.valid
        ) {

            throw new Error(
                sideBValidation.message
            );

        }


        // ==============================================
        // COMPETITION DATA
        // ==============================================

        const competitionData = {

            // ==========================================
            // BASIC
            // ==========================================

            name:
                name,

            date:
                date,

            endTime:
                endTime,


            // ==========================================
            // SIDES
            // ==========================================

            sideA:
                sideA,

            sideB:
                sideB,


            // ==========================================
            // STATUS
            // ==========================================

            status:
                "active",


            // ==========================================
            // CREATED BY
            // ==========================================

            createdBy:
                loggedInUser || "admin",

            createdRole:
                currentUserRole || "admin",


            // ==========================================
            // CREATED TIME
            // ==========================================

            createdAt:
                serverTimestamp()

        };


        console.log(
            "Competition Data:",
            competitionData
        );


        // ==============================================
        // FIREBASE SAVE
        // ==============================================

        const competitionRef =
            await addDoc(
                collection(
                    db,
                    COMPETITION_COLLECTION
                ),
                competitionData
            );


        console.log(
            "Competition Saved:",
            competitionRef.id
        );


        // ==============================================
        // SUCCESS
        // ==============================================

        showMessage(
            "Competition successfully save ho gaya.",
            "success"
        );


        // ==============================================
        // RESET FORM
        // ==============================================

        resetCompetitionForm();


    }

    catch (error) {

        console.error(
            "Competition Save Error:",
            error
        );


        showMessage(
            error.message ||
            "Competition save nahi ho saka.",
            "error"
        );

    }

    finally {

        if (saveCompetitionBtn) {

            saveCompetitionBtn.disabled =
                false;


            saveCompetitionBtn.innerHTML =
                `
                <i class="fa-solid fa-floppy-disk"></i>
                Save Competition
                `;

        }

    }

}


// ======================================================
// RESET FORM
// ======================================================

function resetCompetitionForm() {

    if (competitionForm) {

        competitionForm.reset();

    }


    setDefaultDate();


    initializeRows();

}


// ======================================================
// FORM SUBMIT
// ======================================================

if (competitionForm) {

    competitionForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            saveCompetition();

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            localStorage.removeItem(
                "loggedInEmpCode"
            );


            localStorage.removeItem(
                "userRole"
            );


            localStorage.removeItem(
                "userName"
            );


            window.location.href =
                "index.html";

        }
    );

}


// ======================================================
// START
// ======================================================

setDefaultDate();

loadEmployees();


// ======================================================
// END
// ======================================================
