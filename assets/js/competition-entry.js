// ======================================================
// TELETHON
// ACADEMIC DEPARTMENT COMPETITION
//
// File:
// assets/js/competition-entry.js
//
// FEATURES:
//
// 1. Create Competition
// 2. Edit Competition
// 3. Update Competition
// 4. Delete Competition
// 5. Manual Participant Name
// 6. Region list from employees
// 7. State list based on Region
// 8. Unique competition URL
// 9. Ended competition status
// 10. Firebase collection = competitions
//
// IMPORTANT:
//
// Collection / Amount / Unit yahan save nahi hoga.
//
// ======================================================


import { db } from "./firebase-config.js";


import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// COLLECTION
// ======================================================

const COMPETITION_COLLECTION =
    "competitions";


// ======================================================
// HTML
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


const participantContainer =
    document.getElementById(
        "participantContainer"
    );


const addParticipantBtn =
    document.getElementById(
        "addParticipantBtn"
    );


const saveCompetitionBtn =
    document.getElementById(
        "saveCompetitionBtn"
    );


const resetCompetitionBtn =
    document.getElementById(
        "resetCompetitionBtn"
    );


const messageBox =
    document.getElementById(
        "competitionMessage"
    );


const competitionTableBody =
    document.getElementById(
        "competitionTableBody"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// ======================================================
// DATA
// ======================================================

let allEmployees = [];

let editingCompetitionId = null;

let allCompetitions = [];


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
// MESSAGE
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


    if (!competitionDate.value) {

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
                    "employees"
                )
            );


        allEmployees = [];


        snapshot.forEach(
            employeeDoc => {

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


    }

    catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );


        showMessage(
            "Region / State list load nahi ho saki.",
            "error"
        );

    }

}


// ======================================================
// UNIQUE REGIONS
// ======================================================

function getRegions() {

    const regionSet =
        new Set();


    allEmployees.forEach(
        employee => {

            const region =
                getEmployeeRegion(
                    employee
                );


            if (region) {

                regionSet.add(
                    region
                );

            }

        }
    );


    return [
        ...regionSet
    ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );

}


// ======================================================
// STATES
// ======================================================

function getStatesForRegion(
    selectedRegion
) {

    const stateSet =
        new Set();


    allEmployees.forEach(
        employee => {

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

                stateSet.add(
                    state
                );

            }

        }
    );


    return [
        ...stateSet
    ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );

}


// ======================================================
// REGION OPTIONS
// ======================================================

function getRegionOptions(
    selectedValue = ""
) {

    let html = `

        <option value="">
            Select Region
        </option>

    `;


    getRegions()
        .forEach(
            region => {

                const selected =
                    normalize(
                        region
                    ) ===
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

function getStateOptions(
    region,
    selectedState = ""
) {

    if (!region) {

        return `

            <option value="">
                Select State
            </option>

        `;

    }


    let html = `

        <option value="">
            All States
        </option>

    `;


    getStatesForRegion(
        region
    )
        .forEach(
            state => {

                const selected =
                    normalize(
                        state
                    ) ===
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
// CREATE PARTICIPANT ROW
// ======================================================

function createParticipantRow(
    participant = {}
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "participant-row";


    const participantName =
        participant.name || "";


    const selectedRegion =
        participant.region || "";


    const selectedState =
        participant.state || "";


    row.innerHTML = `

        <div class="participant-field">

            <label>
                Participant / Team Name
            </label>

            <input
                type="text"
                class="participant-name"
                placeholder="Example: Kolkata Team"
                value="${escapeHTML(
                    participantName
                )}"
            >

        </div>


        <div class="participant-field">

            <label>
                Region
            </label>

            <select
                class="participant-region"
            >

                ${getRegionOptions(
                    selectedRegion
                )}

            </select>

        </div>


        <div class="participant-field">

            <label>
                State
            </label>

            <select
                class="participant-state"
                ${selectedRegion
                    ? ""
                    : "disabled"}
            >

                ${getStateOptions(
                    selectedRegion,
                    selectedState
                )}

            </select>

        </div>


        <button
            type="button"
            class="remove-participant"
            title="Remove Participant"
        >

            <i class="fa-solid fa-trash"></i>

        </button>

    `;


    // ==================================================
    // REGION CHANGE
    // ==================================================

    const regionSelect =
        row.querySelector(
            ".participant-region"
        );


    const stateSelect =
        row.querySelector(
            ".participant-state"
        );


    regionSelect.addEventListener(
        "change",
        function () {

            const region =
                this.value;


            stateSelect.innerHTML =
                getStateOptions(
                    region
                );


            stateSelect.disabled =
                !region;

        }
    );


    // ==================================================
    // REMOVE
    // ==================================================

    const removeBtn =
        row.querySelector(
            ".remove-participant"
        );


    removeBtn.addEventListener(
        "click",
        function () {

            const rows =
                participantContainer.querySelectorAll(
                    ".participant-row"
                );


            if (
                rows.length <= 1
            ) {

                showMessage(
                    "Kam se kam 1 participant hona chahiye.",
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
// ADD PARTICIPANT
// ======================================================

function addParticipant(
    participant = {}
) {

    if (!participantContainer) {
        return;
    }


    const row =
        createParticipantRow(
            participant
        );


    participantContainer.appendChild(
        row
    );

}


// ======================================================
// INITIALIZE PARTICIPANTS
// ======================================================

function initializeParticipants() {

    if (!participantContainer) {
        return;
    }


    participantContainer.innerHTML =
        "";


    addParticipant();

}


// ======================================================
// GET PARTICIPANTS
// ======================================================

function getParticipants() {

    if (!participantContainer) {
        return [];
    }


    const rows =
        participantContainer.querySelectorAll(
            ".participant-row"
        );


    const result = [];


    rows.forEach(
        row => {

            const name =
                String(
                    row.querySelector(
                        ".participant-name"
                    )?.value ||
                    ""
                )
                    .trim();


            const region =
                String(
                    row.querySelector(
                        ".participant-region"
                    )?.value ||
                    ""
                )
                    .trim();


            const state =
                String(
                    row.querySelector(
                        ".participant-state"
                    )?.value ||
                    ""
                )
                    .trim();


            if (
                name ||
                region ||
                state
            ) {

                result.push({

                    name:
                        name,

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
// VALIDATE PARTICIPANTS
// ======================================================

function validateParticipants(
    participants
) {

    if (
        !participants.length
    ) {

        return {

            valid:
                false,

            message:
                "Kam se kam 1 participant add karein."

        };

    }


    for (
        let i = 0;
        i < participants.length;
        i++
    ) {

        const item =
            participants[i];


        if (!item.name) {

            return {

                valid:
                    false,

                message:
                    `Participant ${i + 1} ka Name enter karein.`

            };

        }


        if (!item.region) {

            return {

                valid:
                    false,

                message:
                    `Participant ${i + 1} ke liye Region select karein.`

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
// COMPETITION END DATE/TIME
// ======================================================

function getCompetitionEndDate(
    competition
) {

    if (
        !competition?.date ||
        !competition?.endTime
    ) {

        return null;

    }


    const dateTime =
        new Date(
            `${competition.date}T${competition.endTime}:00`
        );


    if (
        Number.isNaN(
            dateTime.getTime()
        )
    ) {

        return null;

    }


    return dateTime;

}


// ======================================================
// CHECK ENDED
// ======================================================

function isCompetitionEnded(
    competition
) {

    const endDate =
        getCompetitionEndDate(
            competition
        );


    if (!endDate) {

        return false;

    }


    return (
        new Date().getTime() >=
        endDate.getTime()
    );

}


// ======================================================
// LOAD COMPETITIONS
// ======================================================

async function loadCompetitions() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    COMPETITION_COLLECTION
                )
            );


        allCompetitions = [];


        snapshot.forEach(
            competitionDoc => {

                allCompetitions.push({

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

                });

            }
        );


        allCompetitions.sort(
            (a, b) => {

                const aTime =
                    getCompetitionEndDate(
                        a
                    )?.getTime() || 0;


                const bTime =
                    getCompetitionEndDate(
                        b
                    )?.getTime() || 0;


                return bTime - aTime;

            }
        );


        displayCompetitionList();

    }

    catch (error) {

        console.error(
            "Competition Load Error:",
            error
        );


        showMessage(
            "Competition list load nahi ho saki.",
            "error"
        );

    }

}


// ======================================================
// DISPLAY COMPETITIONS
// ======================================================

function displayCompetitionList() {

    if (!competitionTableBody) {
        return;
    }


    if (!allCompetitions.length) {

        competitionTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#6b7280;
                    "
                >

                    <i class="fa-solid fa-trophy"></i>

                    &nbsp;

                    Abhi koi competition nahi hai.

                </td>

            </tr>

        `;

        return;

    }


    competitionTableBody.innerHTML =
        allCompetitions
            .map(
                competition => {

                    const participants =
                        Array.isArray(
                            competition.participants
                        )
                            ? competition.participants
                            : [];


                    const ended =
                        isCompetitionEnded(
                            competition
                        );


                    const statusHTML =
                        ended

                            ? `

                                <span class="status-badge status-ended">

                                    Ended

                                </span>

                              `

                            : `

                                <span class="status-badge status-active">

                                    Active

                                </span>

                              `;


                    return `

                        <tr>

                            <td>

                                <strong>
                                    ${escapeHTML(
                                        competition.name
                                    )}
                                </strong>

                            </td>


                            <td>

                                ${escapeHTML(
                                    competition.date || "-"
                                )}

                            </td>


                            <td>

                                ${escapeHTML(
                                    formatTime(
                                        competition.endTime
                                    )
                                )}

                            </td>


                            <td>

                                ${participants.length}

                            </td>


                            <td>

                                ${statusHTML}

                            </td>


                            <td>

                                <div class="table-actions">


                                    <a
                                        href="competition.html?id=${encodeURIComponent(
                                            competition.id
                                        )}"
                                        target="_blank"
                                        class="table-btn open"
                                        title="Open Competition"
                                    >

                                        <i class="fa-solid fa-arrow-up-right-from-square"></i>

                                    </a>


                                    <button
                                        type="button"
                                        class="table-btn edit"
                                        title="Edit"
                                        data-edit-id="${escapeHTML(
                                            competition.id
                                        )}"
                                    >

                                        <i class="fa-solid fa-pen"></i>

                                    </button>


                                    <button
                                        type="button"
                                        class="table-btn delete"
                                        title="Delete"
                                        data-delete-id="${escapeHTML(
                                            competition.id
                                        )}"
                                    >

                                        <i class="fa-solid fa-trash"></i>

                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    // ==================================================
    // EDIT EVENTS
    // ==================================================

    competitionTableBody
        .querySelectorAll(
            "[data-edit-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editCompetition(
                            button.dataset.editId
                        );

                    }
                );

            }
        );


    // ==================================================
    // DELETE EVENTS
    // ==================================================

    competitionTableBody
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteCompetition(
                            button.dataset.deleteId
                        );

                    }
                );

            }
        );

}


// ======================================================
// FORMAT TIME
// ======================================================

function formatTime(
    time
) {

    if (!time) {
        return "-";
    }


    const parts =
        String(time)
            .split(":");


    if (
        parts.length < 2
    ) {

        return time;

    }


    let hour =
        parseInt(
            parts[0],
            10
        );


    const minute =
        parts[1];


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return `${hour}:${minute} ${suffix}`;

}


// ======================================================
// SAVE / UPDATE
// ======================================================

async function saveCompetition() {

    if (
        saveCompetitionBtn
    ) {

        saveCompetitionBtn.disabled =
            true;


        saveCompetitionBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Saving...

        `;

    }


    try {

        const name =
            String(
                competitionName?.value ||
                ""
            )
                .trim();


        const date =
            String(
                competitionDate?.value ||
                ""
            )
                .trim();


        const endTime =
            String(
                competitionEndTime?.value ||
                ""
            )
                .trim();


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


        const participants =
            getParticipants();


        const validation =
            validateParticipants(
                participants
            );


        if (!validation.valid) {

            throw new Error(
                validation.message
            );

        }


        const competitionData = {

            name:
                name,

            date:
                date,

            endTime:
                endTime,

            participants:
                participants,

            status:
                "active",

            updatedAt:
                serverTimestamp()

        };


        // ==================================================
        // UPDATE
        // ==================================================

        if (
            editingCompetitionId
        ) {

            await updateDoc(

                doc(
                    db,
                    COMPETITION_COLLECTION,
                    editingCompetitionId
                ),

                competitionData

            );


            showMessage(
                "Competition successfully update ho gaya.",
                "success"
            );

        }

        // ==================================================
        // CREATE
        // ==================================================

        else {

            competitionData.createdBy =
                loggedInUser ||
                "admin";


            competitionData.createdRole =
                currentUserRole ||
                "admin";


            competitionData.createdAt =
                serverTimestamp();


            const competitionRef =
                await addDoc(

                    collection(
                        db,
                        COMPETITION_COLLECTION
                    ),

                    competitionData

                );


            console.log(
                "Competition ID:",
                competitionRef.id
            );


            showMessage(
                "Competition successfully save ho gaya.",
                "success"
            );

        }


        resetCompetitionForm();

        await loadCompetitions();

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

        if (
            saveCompetitionBtn
        ) {

            saveCompetitionBtn.disabled =
                false;


            updateSaveButton();

        }

    }

}


// ======================================================
// EDIT COMPETITION
// ======================================================

async function editCompetition(
    competitionId
) {

    try {

        const competitionRef =
            doc(
                db,
                COMPETITION_COLLECTION,
                competitionId
            );


        const snapshot =
            await getDoc(
                competitionRef
            );


        if (!snapshot.exists()) {

            throw new Error(
                "Competition nahi mila."
            );

        }


        const data =
            snapshot.data();


        editingCompetitionId =
            competitionId;


        document.body.classList.add(
            "edit-mode"
        );


        competitionName.value =
            data.name || "";


        competitionDate.value =
            data.date || "";


        competitionEndTime.value =
            data.endTime || "";


        participantContainer.innerHTML =
            "";


        const participants =
            Array.isArray(
                data.participants
            )
                ? data.participants
                : [];


        if (
            participants.length
        ) {

            participants.forEach(
                participant => {

                    addParticipant(
                        participant
                    );

                }
            );

        }

        else {

            addParticipant();

        }


        updateSaveButton();


        window.scrollTo({

            top:
                0,

            behavior:
                "smooth"

        });


    }

    catch (error) {

        console.error(
            "Edit Competition Error:",
            error
        );


        showMessage(
            error.message ||
            "Competition edit nahi ho saka.",
            "error"
        );

    }

}


// ======================================================
// UPDATE BUTTON
// ======================================================

function updateSaveButton() {

    if (!saveCompetitionBtn) {
        return;
    }


    if (
        editingCompetitionId
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


// ======================================================
// DELETE
// ======================================================

async function deleteCompetition(
    competitionId
) {

    const competition =
        allCompetitions.find(
            item =>
                item.id ===
                competitionId
        );


    if (!competition) {

        return;

    }


    const confirmed =
        window.confirm(

            `Kya aap "${competition.name}" competition delete karna chahte hain?`

        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                COMPETITION_COLLECTION,
                competitionId
            )

        );


        showMessage(
            "Competition delete ho gaya.",
            "success"
        );


        if (
            editingCompetitionId ===
            competitionId
        ) {

            resetCompetitionForm();

        }


        await loadCompetitions();

    }

    catch (error) {

        console.error(
            "Delete Competition Error:",
            error
        );


        showMessage(
            "Competition delete nahi ho saka.",
            "error"
        );

    }

}


// ======================================================
// RESET
// ======================================================

function resetCompetitionForm() {

    if (competitionForm) {

        competitionForm.reset();

    }


    editingCompetitionId =
        null;


    document.body.classList.remove(
        "edit-mode"
    );


    setDefaultDate();


    initializeParticipants();


    updateSaveButton();

}


// ======================================================
// FORM SUBMIT
// ======================================================

if (
    competitionForm
) {

    competitionForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            saveCompetition();

        }
    );

}


// ======================================================
// ADD PARTICIPANT
// ======================================================

if (
    addParticipantBtn
) {

    addParticipantBtn.addEventListener(
        "click",
        () => {

            addParticipant();

        }
    );

}


// ======================================================
// RESET
// ======================================================

if (
    resetCompetitionBtn
) {

    resetCompetitionBtn.addEventListener(
        "click",
        () => {

            resetCompetitionForm();

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (
    logoutBtn
) {

    logoutBtn.addEventListener(
        "click",
        event => {

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

async function initialize() {

    setDefaultDate();

    initializeParticipants();

    await loadEmployees();

    await loadCompetitions();

}


initialize();


// ======================================================
// END
// ======================================================
