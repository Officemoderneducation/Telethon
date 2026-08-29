// ======================================================
// TELETHON
// COMPETITION ENTRY
//
// File:
// assets/js/competition-entry.js
//
// FEATURES:
//
// 1. Create Competition
// 2. Edit Competition
// 3. Competition Name
// 4. Competition Date
// 5. Competition End Time
// 6. Side A
// 7. Side B
// 8. Multiple Region / State per Side
// 9. Region list from employees collection
// 10. State list based on selected Region
// 11. Firebase collection = competitions
// 12. Unique Competition ID
// 13. Separate public link can use document ID
//
// IMPORTANT:
//
// Collection / Amount / Unit is NOT saved here.
//
// Competition Date + End Time will later be used
// as the competition cut-off.
//
// Entries after End Time will NOT count in competition.
//
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// COLLECTIONS
// ======================================================

const COMPETITION_COLLECTION =
    "competitions";

const EMPLOYEES_COLLECTION =
    "employees";


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


const resetCompetitionBtn =
    document.getElementById(
        "resetCompetitionBtn"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


const messageBox =
    document.getElementById(
        "competitionMessage"
    );


const pageLoading =
    document.getElementById(
        "pageLoading"
    );


// ======================================================
// DATA
// ======================================================

let allEmployees = [];


// ======================================================
// EDIT MODE
// ======================================================

let editCompetitionId = null;


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
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

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


    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });


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
// PAGE LOADING
// ======================================================

function setPageLoading(
    show,
    text = "Loading Competition..."
) {

    if (!pageLoading) {
        return;
    }


    const span =
        pageLoading.querySelector(
            "span"
        );


    if (span) {

        span.textContent =
            text;

    }


    pageLoading.classList.toggle(
        "show",
        show
    );

}


// ======================================================
// DATE FORMAT
// ======================================================

function formatDateForInput(
    date
) {

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


    if (
        !competitionDate.value
    ) {

        competitionDate.value =
            formatDateForInput(
                new Date()
            );

    }

}


// ======================================================
// EMPLOYEE REGION
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
// EMPLOYEE STATE
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
// ======================================================

async function loadEmployees() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    EMPLOYEES_COLLECTION
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
            "Competition Employees Loaded:",
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
            "Employees data load nahi ho saka. Firebase employees collection check karein.",
            "error"
        );

    }

}


// ======================================================
// GET UNIQUE REGIONS
// ======================================================

function getRegions() {

    const regionMap =
        new Map();


    allEmployees.forEach(
        (employee) => {

            const region =
                getEmployeeRegion(
                    employee
                );


            if (!region) {
                return;
            }


            const key =
                normalize(
                    region
                );


            if (
                !regionMap.has(key)
            ) {

                regionMap.set(
                    key,
                    region
                );

            }

        }
    );


    return [
        ...regionMap.values()
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

    const stateMap =
        new Map();


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

                region &&

                state &&

                normalize(region) ===
                normalize(
                    selectedRegion
                )

            ) {

                const key =
                    normalize(
                        state
                    );


                if (
                    !stateMap.has(key)
                ) {

                    stateMap.set(
                        key,
                        state
                    );

                }

            }

        }
    );


    return [
        ...stateMap.values()
    ].sort(
        (a, b) =>
            a.localeCompare(
                b
            )
    );

}


// ======================================================
// REGION OPTIONS
// ======================================================

function getRegionOptionsHTML(
    selectedValue = ""
) {

    const regions =
        getRegions();


    let html = `

        <option value="">
            Select Region
        </option>

    `;


    regions.forEach(
        (region) => {

            const selected =
                normalize(region) ===
                normalize(
                    selectedValue
                )
                    ? "selected"
                    : "";


            html += `

                <option
                    value="${escapeHTML(
                        region
                    )}"
                    ${selected}
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
// STATE OPTIONS
// ======================================================

function getStateOptionsHTML(
    region = "",
    selectedState = ""
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
            All States
        </option>

    `;


    states.forEach(
        (state) => {

            const selected =
                normalize(state) ===
                normalize(
                    selectedState
                )
                    ? "selected"
                    : "";


            html += `

                <option
                    value="${escapeHTML(
                        state
                    )}"
                    ${selected}
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
    data = {}
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "competition-side-row";


    row.dataset.side =
        side;


    const selectedRegion =
        String(
            data.region || ""
        ).trim();


    const selectedState =
        String(
            data.state || ""
        ).trim();


    row.innerHTML = `

        <div class="side-row-top">

            <span class="participant-number">

                ${escapeHTML(
                    side
                )}
                Participant

            </span>


            <button
                type="button"
                class="remove-side-row"
                title="Remove Participant"
            >

                <i class="fa-solid fa-trash"></i>

            </button>

        </div>


        <div class="side-field-grid">


            <!-- REGION -->

            <div class="competition-field">

                <label>
                    Region
                </label>

                <select
                    class="competition-region"
                >

                    ${getRegionOptionsHTML(
                        selectedRegion
                    )}

                </select>

            </div>


            <!-- STATE -->

            <div class="competition-field">

                <label>
                    State
                </label>

                <select
                    class="competition-state"
                    ${
                        selectedRegion
                            ? ""
                            : "disabled"
                    }
                >

                    ${
                        getStateOptionsHTML(
                            selectedRegion,
                            selectedState
                        )
                    }

                </select>

            </div>


        </div>

    `;


    // ==================================================
    // ELEMENTS
    // ==================================================

    const regionSelect =
        row.querySelector(
            ".competition-region"
        );


    const stateSelect =
        row.querySelector(
            ".competition-state"
        );


    const removeButton =
        row.querySelector(
            ".remove-side-row"
        );


    // ==================================================
    // REGION CHANGE
    // ==================================================

    regionSelect.addEventListener(
        "change",
        function () {

            const region =
                this.value;


            stateSelect.innerHTML =
                getStateOptionsHTML(
                    region
                );


            stateSelect.disabled =
                !region;

        }
    );


    // ==================================================
    // REMOVE ROW
    // ==================================================

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


            if (
                rows.length <= 1
            ) {

                showMessage(
                    `Side ${side} mein kam se kam 1 Region/State participant hona chahiye.`,
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
            "A"
        )
    );


    sideBContainer.appendChild(
        createSideRow(
            "B"
        )
    );

}


// ======================================================
// ADD SIDE A
// ======================================================

if (addSideARowBtn) {

    addSideARowBtn.addEventListener(
        "click",
        function () {

            if (!sideAContainer) {
                return;
            }


            sideAContainer.appendChild(
                createSideRow(
                    "A"
                )
            );

        }
    );

}


// ======================================================
// ADD SIDE B
// ======================================================

if (addSideBRowBtn) {

    addSideBRowBtn.addEventListener(
        "click",
        function () {

            if (!sideBContainer) {
                return;
            }


            sideBContainer.appendChild(
                createSideRow(
                    "B"
                )
            );

        }
    );

}


// ======================================================
// GET SIDE DATA
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


            result.push({

                region:
                    region,

                state:
                    state

            });

        }
    );


    return result;

}


// ======================================================
// CLEAN SIDE DATA
// ======================================================

function cleanSideData(
    sideData
) {

    return sideData
        .map(
            (item) => ({

                region:
                    String(
                        item?.region ||
                        ""
                    ).trim(),

                state:
                    String(
                        item?.state ||
                        ""
                    ).trim()

            })
        )
        .filter(
            (item) =>
                item.region
        );

}


// ======================================================
// REMOVE DUPLICATES
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

            valid:
                false,

            message:
                `Side ${sideName} mein kam se kam 1 Region select karein.`

        };

    }


    for (
        const item
        of sideData
    ) {

        if (!item.region) {

            return {

                valid:
                    false,

                message:
                    `Side ${sideName} ke har participant mein Region select karein.`

            };

        }

    }


    return {

        valid:
            true,

        message:
            ""

    };

}


// ======================================================
// GET URL EDIT ID
//
// Supported:
//
// competition-entry.html?id=ABC
// competition-entry.html?competitionId=ABC
//
// ======================================================

function getEditCompetitionId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return (
        params.get(
            "competitionId"
        ) ||

        params.get(
            "id"
        ) ||

        ""
    ).trim();

}


// ======================================================
// LOAD COMPETITION FOR EDIT
// ======================================================

async function loadCompetitionForEdit(
    competitionId
) {

    if (!competitionId) {
        return;
    }


    try {

        setPageLoading(
            true,
            "Loading Competition..."
        );


        const competitionRef =
            doc(
                db,
                COMPETITION_COLLECTION,
                competitionId
            );


        const competitionSnapshot =
            await getDoc(
                competitionRef
            );


        if (
            !competitionSnapshot.exists()
        ) {

            throw new Error(
                "Competition nahi mili."
            );

        }


        const data =
            competitionSnapshot.data();


        editCompetitionId =
            competitionId;


        // ==================================================
        // BASIC DATA
        // ==================================================

        if (competitionName) {

            competitionName.value =
                String(
                    data.name || ""
                );

        }


        if (competitionDate) {

            competitionDate.value =
                String(
                    data.date || ""
                );

        }


        if (competitionEndTime) {

            competitionEndTime.value =
                String(
                    data.endTime || ""
                );

        }


        // ==================================================
        // SIDE DATA
        // ==================================================

        const sideA =
            Array.isArray(
                data.sideA
            )
                ? data.sideA
                : [];


        const sideB =
            Array.isArray(
                data.sideB
            )
                ? data.sideB
                : [];


        renderSideData(
            sideAContainer,
            "A",
            sideA
        );


        renderSideData(
            sideBContainer,
            "B",
            sideB
        );


        // ==================================================
        // EDIT UI
        // ==================================================

        document.body.classList.add(
            "edit-mode"
        );


        if (saveCompetitionBtn) {

            saveCompetitionBtn.innerHTML = `

                <i class="fa-solid fa-pen-to-square"></i>

                Update Competition

            `;

        }


        console.log(
            "Competition Edit Loaded:",
            competitionId,
            data
        );

    }

    catch (error) {

        console.error(
            "Competition Edit Load Error:",
            error
        );


        showMessage(
            error.message ||
            "Competition load nahi ho saki.",
            "error"
        );

    }

    finally {

        setPageLoading(
            false
        );

    }

}


// ======================================================
// RENDER SIDE DATA
// ======================================================

function renderSideData(
    container,
    side,
    sideData
) {

    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const data =
        Array.isArray(sideData) &&
        sideData.length
            ? sideData
            : [
                {
                    region: "",
                    state: ""
                }
            ];


    data.forEach(
        (item) => {

            container.appendChild(
                createSideRow(
                    side,
                    item
                )
            );

        }
    );

}


// ======================================================
// BUILD COMPETITION DATA
// ======================================================

function buildCompetitionData() {

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


    let sideA =
        getSideData(
            sideAContainer
        );


    let sideB =
        getSideData(
            sideBContainer
        );


    sideA =
        removeDuplicateSideEntries(
            cleanSideData(
                sideA
            )
        );


    sideB =
        removeDuplicateSideEntries(
            cleanSideData(
                sideB
            )
        );


    return {

        name:
            name,

        date:
            date,

        endTime:
            endTime,

        sideA:
            sideA,

        sideB:
            sideB

    };

}


// ======================================================
// VALIDATE COMPETITION
// ======================================================

function validateCompetition(
    data
) {

    if (!data.name) {

        return {

            valid:
                false,

            message:
                "Competition Name enter karein."

        };

    }


    if (!data.date) {

        return {

            valid:
                false,

            message:
                "Competition Date select karein."

        };

    }


    if (!data.endTime) {

        return {

            valid:
                false,

            message:
                "Competition End Time select karein."

        };

    }


    const sideAValidation =
        validateSide(
            data.sideA,
            "A"
        );


    if (
        !sideAValidation.valid
    ) {

        return sideAValidation;

    }


    const sideBValidation =
        validateSide(
            data.sideB,
            "B"
        );


    if (
        !sideBValidation.valid
    ) {

        return sideBValidation;

    }


    return {

        valid:
            true,

        message:
            ""

    };

}


// ======================================================
// CREATE FIREBASE DATA
// ======================================================

function getFirebaseCompetitionData(
    data
) {

    return {

        // ==================================================
        // BASIC
        // ==================================================

        name:
            data.name,

        date:
            data.date,

        endTime:
            data.endTime,


        // ==================================================
        // PARTICIPANTS
        // ==================================================

        sideA:
            data.sideA,

        sideB:
            data.sideB,


        // ==================================================
        // STATUS
        // ==================================================

        status:
            "active",

        // ==================================================
        // CREATED BY
        // ==================================================

        createdBy:
            loggedInUser ||
            "admin",

        createdRole:
            currentUserRole ||
            "admin"

    };

}


// ======================================================
// SAVE NEW COMPETITION
// ======================================================

async function createCompetition(
    data
) {

    const firebaseData =
        getFirebaseCompetitionData(
            data
        );


    firebaseData.createdAt =
        serverTimestamp();


    firebaseData.updatedAt =
        serverTimestamp();


    console.log(
        "New Competition Data:",
        firebaseData
    );


    const competitionRef =
        await addDoc(
            collection(
                db,
                COMPETITION_COLLECTION
            ),
            firebaseData
        );


    return competitionRef.id;

}


// ======================================================
// UPDATE EXISTING COMPETITION
// ======================================================

async function updateCompetition(
    competitionId,
    data
) {

    if (!competitionId) {

        throw new Error(
            "Competition ID missing hai."
        );

    }


    const competitionRef =
        doc(
            db,
            COMPETITION_COLLECTION,
            competitionId
        );


    const existingSnapshot =
        await getDoc(
            competitionRef
        );


    if (
        !existingSnapshot.exists()
    ) {

        throw new Error(
            "Update ke liye competition nahi mili."
        );

    }


    const firebaseData =
        getFirebaseCompetitionData(
            data
        );


    firebaseData.updatedAt =
        serverTimestamp();


    await updateDoc(
        competitionRef,
        firebaseData
    );


    return competitionId;

}


// ======================================================
// SAVE / UPDATE COMPETITION
// ======================================================

async function saveCompetition() {

    if (saveCompetitionBtn) {

        saveCompetitionBtn.disabled =
            true;


        saveCompetitionBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Saving...

        `;

    }


    try {

        // ==================================================
        // BUILD DATA
        // ==================================================

        const data =
            buildCompetitionData();


        console.log(
            "Competition Form Data:",
            data
        );


        // ==================================================
        // VALIDATE
        // ==================================================

        const validation =
            validateCompetition(
                data
            );


        if (
            !validation.valid
        ) {

            throw new Error(
                validation.message
            );

        }


        // ==================================================
        // EDIT
        // ==================================================

        if (editCompetitionId) {

            const competitionId =
                await updateCompetition(
                    editCompetitionId,
                    data
                );


            console.log(
                "Competition Updated:",
                competitionId
            );


            showMessage(
                "Competition successfully update ho gaya.",
                "success"
            );


            // ==================================================
            // Keep Edit Mode
            // ==================================================

            if (saveCompetitionBtn) {

                saveCompetitionBtn.disabled =
                    false;

            }


            return;

        }


        // ==================================================
        // CREATE
        // ==================================================

        const competitionId =
            await createCompetition(
                data
            );


        console.log(
            "Competition Created:",
            competitionId
        );


        // ==================================================
        // PUBLIC LINK
        // ==================================================

        const publicLink =
            new URL(
                "competition.html",
                window.location.href
            );


        publicLink.searchParams.set(
            "id",
            competitionId
        );


        console.log(
            "Competition Public Link:",
            publicLink.href
        );


        // ==================================================
        // SUCCESS
        // ==================================================

        showMessage(
            "Competition successfully save ho gaya. Competition ID: " +
            competitionId,
            "success"
        );


        // ==================================================
        // RESET
        // ==================================================

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


            if (
                editCompetitionId
            ) {

                saveCompetitionBtn.innerHTML = `

                    <i class="fa-solid fa-pen-to-square"></i>

                    Update Competition

                `;

            }

            else {

                saveCompetitionBtn.innerHTML = `

                    <i class="fa-solid fa-floppy-disk"></i>

                    Save Competition

                `;

            }

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


    // ==================================================
    // If Edit Mode
    // ==================================================

    if (editCompetitionId) {

        return;

    }


    setDefaultDate();


    initializeRows();


    if (messageBox) {

        messageBox.style.display =
            "none";

    }

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
// RESET BUTTON
// ======================================================

if (resetCompetitionBtn) {

    resetCompetitionBtn.addEventListener(
        "click",
        function () {

            // Native form reset pehle hone dein.

            setTimeout(
                function () {

                    if (
                        editCompetitionId
                    ) {

                        // Edit mode mein current
                        // competition ko reload karenge.

                        loadCompetitionForEdit(
                            editCompetitionId
                        );

                        return;

                    }


                    setDefaultDate();

                    initializeRows();

                },
                0
            );

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

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

async function startCompetitionEntry() {

    setDefaultDate();


    await loadEmployees();


    // ==================================================
    // CHECK EDIT MODE
    // ==================================================

    const competitionId =
        getEditCompetitionId();


    if (competitionId) {

        await loadCompetitionForEdit(
            competitionId
        );

    }

}


// ======================================================
// START APP
// ======================================================

startCompetitionEntry();


// ======================================================
// END
// ======================================================
