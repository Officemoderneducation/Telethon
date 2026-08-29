// ======================================================
// TELETHON
// ACADEMIC DEPARTMENT COMPETITION
// COMPETITION ENTRY
//
// File:
// assets/js/competition-entry.js
//
// FEATURES:
//
// 1. Competition create
// 2. Competition edit
// 3. Existing competition list
// 4. Competition name
// 5. Competition date
// 6. Competition end time
// 7. Admin manually Region / State type karega
// 8. Multiple Region / State add kar sakta hai
// 9. Firebase existing document update
// 10. Duplicate competition document create nahi hoga
//
// IMPORTANT:
//
// Collection / Amount / Unit yahan SAVE nahi hoga.
//
// Actual collection baad mein:
// Daily Report / daily_entry / teacher_entries
//
// selected competition date ke according calculate hoga.
//
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
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


const participantsContainer =
    document.getElementById(
        "participantsContainer"
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


const cancelEditBtn =
    document.getElementById(
        "cancelEditBtn"
    );


const competitionList =
    document.getElementById(
        "competitionList"
    );


const competitionCount =
    document.getElementById(
        "competitionCount"
    );


const editingBanner =
    document.getElementById(
        "editingBanner"
    );


const messageBox =
    document.getElementById(
        "competitionMessage"
    );


// ======================================================
// DATA
// ======================================================

let competitions = [];


// ======================================================
// EDIT MODE
// ======================================================

let editingCompetitionId =
    null;


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

function escapeHTML(
    value
) {

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
// NORMALIZE
// ======================================================

function normalize(
    value
) {

    return String(
        value ?? ""
    )
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


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
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
// FORMAT DATE
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
// SET DEFAULT DATE
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
// FORMAT DISPLAY DATE
// ======================================================

function formatDisplayDate(
    dateString
) {

    if (!dateString) {
        return "-";
    }


    const parts =
        String(
            dateString
        ).split(
            "-"
        );


    if (
        parts.length !== 3
    ) {

        return dateString;

    }


    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );

}


// ======================================================
// FORMAT TIME
// ======================================================

function formatDisplayTime(
    timeString
) {

    if (!timeString) {
        return "-";
    }


    const parts =
        String(
            timeString
        ).split(
            ":"
        );


    if (
        parts.length < 2
    ) {

        return timeString;

    }


    let hour =
        parseInt(
            parts[0],
            10
        );


    const minute =
        parts[1];


    if (
        Number.isNaN(
            hour
        )
    ) {

        return timeString;

    }


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12;


    if (
        hour === 0
    ) {

        hour = 12;

    }


    return (
        hour +
        ":" +
        minute +
        " " +
        suffix
    );

}


// ======================================================
// GET PARTICIPANTS
//
// Result:
//
// [
//     {
//         region: "Kolkata",
//         state: "Bihar"
//     }
// ]
//
// ======================================================

function getParticipants() {

    if (
        !participantsContainer
    ) {

        return [];

    }


    const rows =
        participantsContainer.querySelectorAll(
            ".participant-row"
        );


    const result = [];


    rows.forEach(
        (row) => {

            const regionInput =
                row.querySelector(
                    ".participant-region"
                );


            const stateInput =
                row.querySelector(
                    ".participant-state"
                );


            const region =
                String(
                    regionInput?.value ||
                    ""
                ).trim();


            const state =
                String(
                    stateInput?.value ||
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
// REMOVE DUPLICATE PARTICIPANTS
// ======================================================

function removeDuplicateParticipants(
    participants
) {

    const map =
        new Map();


    participants.forEach(
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
                !map.has(
                    key
                )
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
// CREATE PARTICIPANT ROW
// ======================================================

function createParticipantRow(
    participant = {}
) {

    if (
        !participantsContainer
    ) {

        return null;

    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "participant-row";


    row.innerHTML = `

        <div
            class="participant-field"
        >

            <label>
                Region
            </label>

            <input
                type="text"
                class="participant-region"
                placeholder="Enter Region"
                value="${escapeHTML(
                    participant.region ||
                    ""
                )}"
            >

        </div>


        <div
            class="participant-field"
        >

            <label>
                State
            </label>

            <input
                type="text"
                class="participant-state"
                placeholder="Enter State"
                value="${escapeHTML(
                    participant.state ||
                    ""
                )}"
            >

        </div>


        <button
            type="button"
            class="remove-participant-btn"
            title="Remove"
        >

            <i class="fa-solid fa-trash"></i>

        </button>

    `;


    const removeButton =
        row.querySelector(
            ".remove-participant-btn"
        );


    removeButton?.addEventListener(
        "click",
        function () {

            const rows =
                participantsContainer.querySelectorAll(
                    ".participant-row"
                );


            if (
                rows.length <= 1
            ) {

                showMessage(
                    "Kam se kam 1 Region / State row hona chahiye.",
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
// INITIALIZE PARTICIPANT ROW
// ======================================================

function initializeParticipants() {

    if (
        !participantsContainer
    ) {

        return;

    }


    participantsContainer.innerHTML =
        "";


    const row =
        createParticipantRow();


    if (row) {

        participantsContainer.appendChild(
            row
        );

    }

}


// ======================================================
// ADD PARTICIPANT
// ======================================================

if (
    addParticipantBtn
) {

    addParticipantBtn.addEventListener(
        "click",
        function () {

            const row =
                createParticipantRow();


            if (row) {

                participantsContainer.appendChild(
                    row
                );

            }

        }
    );

}


// ======================================================
// VALIDATE PARTICIPANTS
// ======================================================

function validateParticipants(
    participants
) {

    if (
        !Array.isArray(
            participants
        ) ||
        participants.length === 0
    ) {

        return {

            valid:
                false,

            message:
                "Kam se kam 1 Region / State enter karein."

        };

    }


    for (
        const item
        of participants
    ) {

        if (
            !item.region &&
            !item.state
        ) {

            return {

                valid:
                    false,

                message:
                    "Region ya State enter karein."

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
// LOAD EXISTING COMPETITIONS
// ======================================================

async function loadCompetitions() {

    if (
        !competitionList
    ) {

        return;

    }


    competitionList.innerHTML = `

        <div
            class="competition-list-loading"
        >

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            &nbsp;

            Loading competitions...

        </div>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    COMPETITION_COLLECTION
                )
            );


        competitions = [];


        snapshot.forEach(
            (competitionDoc) => {

                competitions.push({

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

                });

            }
        );


        // ==================================================
        // NEWEST FIRST
        // ==================================================

        competitions.sort(
            (a, b) => {

                const aTime =
                    a.createdAt?.seconds ||
                    0;


                const bTime =
                    b.createdAt?.seconds ||
                    0;


                return (
                    bTime -
                    aTime
                );

            }
        );


        renderCompetitionList();

    }

    catch (error) {

        console.error(
            "Competition Load Error:",
            error
        );


        competitionList.innerHTML = `

            <div
                class="competition-list-empty"
                style="color:#991b1b;"
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

                Competition list load nahi ho saki.

            </div>

        `;

    }

}


// ======================================================
// RENDER COMPETITION LIST
// ======================================================

function renderCompetitionList() {

    if (
        !competitionList
    ) {

        return;

    }


    if (
        competitionCount
    ) {

        competitionCount.textContent =
            competitions.length;

    }


    if (
        competitions.length === 0
    ) {

        competitionList.innerHTML = `

            <div
                class="competition-list-empty"
            >

                <i
                    class="fa-solid fa-trophy"
                ></i>

                <div>
                    Abhi koi competition available nahi hai.
                </div>

            </div>

        `;

        return;

    }


    let html =
        "";


    competitions.forEach(
        (competition) => {

            const name =
                escapeHTML(
                    competition.name ||
                    "Untitled Competition"
                );


            const date =
                formatDisplayDate(
                    competition.date
                );


            const endTime =
                formatDisplayTime(
                    competition.endTime
                );


            const status =
                escapeHTML(
                    competition.status ||
                    "active"
                );


            html += `

                <div
                    class="competition-item"
                >

                    <div
                        class="competition-item-info"
                    >

                        <div
                            class="competition-item-name"
                        >

                            ${name}

                        </div>


                        <div
                            class="competition-item-meta"
                        >

                            <span>

                                <i
                                    class="fa-regular fa-calendar"
                                ></i>

                                ${escapeHTML(
                                    date
                                )}

                            </span>


                            <span>

                                <i
                                    class="fa-regular fa-clock"
                                ></i>

                                End:
                                ${escapeHTML(
                                    endTime
                                )}

                            </span>


                            <span>

                                <i
                                    class="fa-solid fa-circle"
                                ></i>

                                ${status}

                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="edit-competition-btn"
                        data-id="${escapeHTML(
                            competition.id
                        )}"
                    >

                        <i
                            class="fa-solid fa-pen-to-square"
                        ></i>

                        Edit

                    </button>

                </div>

            `;

        }
    );


    competitionList.innerHTML =
        html;


    // ==================================================
    // EDIT BUTTON EVENTS
    // ==================================================

    competitionList
        .querySelectorAll(
            ".edit-competition-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.id;


                        startEditCompetition(
                            id
                        );

                    }
                );

            }
        );

}


// ======================================================
// START EDIT COMPETITION
// ======================================================

function startEditCompetition(
    competitionId
) {

    const competition =
        competitions.find(
            (item) =>
                item.id ===
                competitionId
        );


    if (
        !competition
    ) {

        showMessage(
            "Competition nahi mila.",
            "error"
        );

        return;

    }


    editingCompetitionId =
        competitionId;


    // ==================================================
    // BASIC DETAILS
    // ==================================================

    if (
        competitionName
    ) {

        competitionName.value =
            competition.name ||
            "";

    }


    if (
        competitionDate
    ) {

        competitionDate.value =
            competition.date ||
            "";

    }


    if (
        competitionEndTime
    ) {

        competitionEndTime.value =
            competition.endTime ||
            "";

    }


    // ==================================================
    // PARTICIPANTS
    // ==================================================

    loadParticipantsForEdit(
        competition.participants ||
        []
    );


    // ==================================================
    // EDIT UI
    // ==================================================

    if (
        saveCompetitionBtn
    ) {

        saveCompetitionBtn.innerHTML = `

            <i
                class="fa-solid fa-pen-to-square"
            ></i>

            Update Competition

        `;

    }


    if (
        cancelEditBtn
    ) {

        cancelEditBtn.style.display =
            "inline-flex";

    }


    if (
        editingBanner
    ) {

        editingBanner.style.display =
            "flex";

    }


    // ==================================================
    // SCROLL TO FORM
    // ==================================================

    competitionForm?.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });


    showMessage(
        "Competition edit mode mein open ho gaya.",
        "success"
    );

}


// ======================================================
// LOAD PARTICIPANTS FOR EDIT
// ======================================================

function loadParticipantsForEdit(
    participants
) {

    if (
        !participantsContainer
    ) {

        return;

    }


    participantsContainer.innerHTML =
        "";


    if (
        !Array.isArray(
            participants
        ) ||
        participants.length === 0
    ) {

        initializeParticipants();

        return;

    }


    participants.forEach(
        (participant) => {

            const row =
                createParticipantRow(
                    participant
                );


            if (row) {

                participantsContainer.appendChild(
                    row
                );

            }

        }
    );

}


// ======================================================
// CANCEL EDIT
// ======================================================

function cancelEditCompetition() {

    editingCompetitionId =
        null;


    if (
        competitionForm
    ) {

        competitionForm.reset();

    }


    setDefaultDate();

    initializeParticipants();


    if (
        saveCompetitionBtn
    ) {

        saveCompetitionBtn.innerHTML = `

            <i
                class="fa-solid fa-floppy-disk"
            ></i>

            Save Competition

        `;

    }


    if (
        cancelEditBtn
    ) {

        cancelEditBtn.style.display =
            "none";

    }


    if (
        editingBanner
    ) {

        editingBanner.style.display =
            "none";

    }


    showMessage(
        "Edit mode cancel kar diya gaya.",
        "success"
    );

}


// ======================================================
// CANCEL EDIT BUTTON
// ======================================================

if (
    cancelEditBtn
) {

    cancelEditBtn.addEventListener(
        "click",
        function () {

            cancelEditCompetition();

        }
    );

}


// ======================================================
// UPDATE COMPETITION
// ======================================================

async function updateCompetition(
    competitionId,
    competitionData
) {

    const competitionRef =
        doc(
            db,
            COMPETITION_COLLECTION,
            competitionId
        );


    await updateDoc(
        competitionRef,
        {

            name:
                competitionData.name,

            date:
                competitionData.date,

            endTime:
                competitionData.endTime,

            participants:
                competitionData.participants,

            updatedAt:
                serverTimestamp(),

            updatedBy:
                loggedInUser ||
                "admin"

        }
    );

}


// ======================================================
// SAVE COMPETITION
// ======================================================

async function saveCompetition() {

    if (
        saveCompetitionBtn
    ) {

        saveCompetitionBtn.disabled =
            true;


        saveCompetitionBtn.innerHTML = `

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            Saving...

        `;

    }


    try {

        // ==================================================
        // BASIC DATA
        // ==================================================

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


        // ==================================================
        // VALIDATION
        // ==================================================

        if (
            !name
        ) {

            throw new Error(
                "Competition Name enter karein."
            );

        }


        if (
            !date
        ) {

            throw new Error(
                "Competition Date select karein."
            );

        }


        if (
            !endTime
        ) {

            throw new Error(
                "Competition End Time select karein."
            );

        }


        // ==================================================
        // PARTICIPANTS
        // ==================================================

        let participants =
            getParticipants();


        participants =
            removeDuplicateParticipants(
                participants
            );


        const participantValidation =
            validateParticipants(
                participants
            );


        if (
            !participantValidation.valid
        ) {

            throw new Error(
                participantValidation.message
            );

        }


        // ==================================================
        // COMPETITION DATA
        // ==================================================

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

            createdBy:
                loggedInUser ||
                "admin",

            createdRole:
                currentUserRole ||
                "admin"

        };


        console.log(
            "Competition Data:",
            competitionData
        );


        // ==================================================
        // EDIT MODE
        // ==================================================

        if (
            editingCompetitionId
        ) {

            await updateCompetition(
                editingCompetitionId,
                competitionData
            );


            showMessage(
                "Competition successfully update ho gaya.",
                "success"
            );

        }


        // ==================================================
        // CREATE MODE
        // ==================================================

        else {

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
                "Competition Saved:",
                competitionRef.id
            );


            showMessage(
                "Competition successfully save ho gaya.",
                "success"
            );

        }


        // ==================================================
        // REFRESH LIST
        // ==================================================

        await loadCompetitions();


        // ==================================================
        // RESET FORM
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

        if (
            saveCompetitionBtn
        ) {

            saveCompetitionBtn.disabled =
                false;


            if (
                editingCompetitionId
            ) {

                saveCompetitionBtn.innerHTML = `

                    <i
                        class="fa-solid fa-pen-to-square"
                    ></i>

                    Update Competition

                `;

            }

            else {

                saveCompetitionBtn.innerHTML = `

                    <i
                        class="fa-solid fa-floppy-disk"
                    ></i>

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

    editingCompetitionId =
        null;


    if (
        competitionForm
    ) {

        competitionForm.reset();

    }


    setDefaultDate();

    initializeParticipants();


    if (
        saveCompetitionBtn
    ) {

        saveCompetitionBtn.innerHTML = `

            <i
                class="fa-solid fa-floppy-disk"
            ></i>

            Save Competition

        `;

    }


    if (
        cancelEditBtn
    ) {

        cancelEditBtn.style.display =
            "none";

    }


    if (
        editingBanner
    ) {

        editingBanner.style.display =
            "none";

    }

}


// ======================================================
// RESET BUTTON
// ======================================================

if (
    resetCompetitionBtn
) {

    resetCompetitionBtn.addEventListener(
        "click",
        function () {

            resetCompetitionForm();

        }
    );

}


// ======================================================
// FORM SUBMIT
// ======================================================

if (
    competitionForm
) {

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


if (
    logoutBtn
) {

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

initializeParticipants();

loadCompetitions();


// ======================================================
// END
// ======================================================
