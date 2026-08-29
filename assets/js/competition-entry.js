// ======================================================
// TELETHON
// COMPETITION ENTRY
//
// CREATE
// EDIT
// DELETE
// COPY PUBLIC LINK
//
// FIREBASE COLLECTION:
// competitions
// ======================================================


import {
    db
}
from "./firebase-config.js";


import {

    collection,

    addDoc,

    getDocs,

    doc,

    updateDoc,

    deleteDoc,

    serverTimestamp

}
from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



// ======================================================
// COLLECTION
// ======================================================

const COMPETITION_COLLECTION =
    "competitions";



// ======================================================
// ELEMENTS
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


const participantAName =
    document.getElementById(
        "participantAName"
    );


const participantBName =
    document.getElementById(
        "participantBName"
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


const resetCompetitionBtn =
    document.getElementById(
        "resetCompetitionBtn"
    );


const saveCompetitionBtn =
    document.getElementById(
        "saveCompetitionBtn"
    );


const competitionList =
    document.getElementById(
        "competitionList"
    );


const messageBox =
    document.getElementById(
        "competitionMessage"
    );



// ======================================================
// DATA
// ======================================================

let allEmployees = [];


let editingCompetitionId =
    null;



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


    setTimeout(
        () => {

            messageBox.className =
                "competition-message";

        },
        5000
    );

}



// ======================================================
// DEFAULT DATE
// ======================================================

function setDefaultDate() {

    if (
        !competitionDate ||
        competitionDate.value
    ) {

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


    competitionDate.value =
        `${year}-${month}-${day}`;

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


        allEmployees =
            [];


        snapshot.forEach(
            employeeDoc => {

                allEmployees.push({

                    id:
                        employeeDoc.id,

                    ...employeeDoc.data()

                });

            }
        );


        initializeRows();

    }

    catch (error) {

        console.error(
            error
        );


        showMessage(
            "Region / State data load nahi ho saka.",
            "error"
        );

    }

}



// ======================================================
// GET REGIONS
// ======================================================

function getRegions() {

    const regions =
        new Set();


    allEmployees.forEach(
        employee => {

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
    ].sort();

}



// ======================================================
// GET STATES
// ======================================================

function getStatesForRegion(
    selectedRegion
) {

    const states =
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

                normalize(
                    region
                ) ===
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
    ].sort();

}



// ======================================================
// REGION OPTIONS
// ======================================================

function getRegionOptionsHTML() {

    let html =
        `
        <option value="">
            Select Region
        </option>
        `;


    getRegions().forEach(
        region => {

            html +=
                `
                <option
                    value="${escapeHTML(region)}"
                >
                    ${escapeHTML(region)}
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
    region
) {

    let html =
        `
        <option value="">
            Select State
        </option>
        `;


    if (!region) {

        return html;

    }


    getStatesForRegion(
        region
    ).forEach(
        state => {

            html +=
                `
                <option
                    value="${escapeHTML(state)}"
                >
                    ${escapeHTML(state)}
                </option>
                `;

        }
    );


    return html;

}



// ======================================================
// CREATE ROW
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


    row.innerHTML =
        `

        <div class="competition-field">

            <label>
                Region
            </label>

            <select
                class="competition-region"
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
            >

                <option value="">
                    Select State
                </option>

            </select>

        </div>


        <button
            type="button"
            class="remove-side-row"
        >

            <i class="fa-solid fa-trash"></i>

        </button>

        `;


    const regionSelect =
        row.querySelector(
            ".competition-region"
        );


    const stateSelect =
        row.querySelector(
            ".competition-state"
        );


    if (data.region) {

        regionSelect.value =
            data.region;


        stateSelect.innerHTML =
            getStateOptionsHTML(
                data.region
            );


        stateSelect.value =
            data.state || "";

    }


    regionSelect.addEventListener(
        "change",
        function () {

            stateSelect.innerHTML =
                getStateOptionsHTML(
                    this.value
                );

        }
    );


    const removeButton =
        row.querySelector(
            ".remove-side-row"
        );


    removeButton.addEventListener(
        "click",
        function () {

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
// ADD ROWS
// ======================================================

addSideARowBtn?.addEventListener(
    "click",
    function () {

        sideAContainer.appendChild(
            createSideRow(
                "A"
            )
        );

    }
);


addSideBRowBtn?.addEventListener(
    "click",
    function () {

        sideBContainer.appendChild(
            createSideRow(
                "B"
            )
        );

    }
);



// ======================================================
// GET SIDE DATA
// ======================================================

function getSideData(
    container
) {

    const result =
        [];


    container
        .querySelectorAll(
            ".competition-side-row"
        )
        .forEach(
            row => {

                const region =
                    row
                        .querySelector(
                            ".competition-region"
                        )
                        ?.value
                        .trim() || "";


                const state =
                    row
                        .querySelector(
                            ".competition-state"
                        )
                        ?.value
                        .trim() || "";


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
// SAVE COMPETITION
// ======================================================

async function saveCompetition() {

    const name =
        competitionName.value.trim();


    const date =
        competitionDate.value;


    const endTime =
        competitionEndTime.value;


    const participantA =
        participantAName.value.trim();


    const participantB =
        participantBName.value.trim();


    const sideA =
        getSideData(
            sideAContainer
        );


    const sideB =
        getSideData(
            sideBContainer
        );


    if (!name) {

        showMessage(
            "Competition Name enter karein.",
            "error"
        );

        return;

    }


    if (!date) {

        showMessage(
            "Competition Date select karein.",
            "error"
        );

        return;

    }


    if (!endTime) {

        showMessage(
            "Competition End Time select karein.",
            "error"
        );

        return;

    }


    if (!participantA) {

        showMessage(
            "First participant ka naam enter karein.",
            "error"
        );

        return;

    }


    if (!participantB) {

        showMessage(
            "Second participant ka naam enter karein.",
            "error"
        );

        return;

    }


    if (
        sideA.length === 0
    ) {

        showMessage(
            "First participant ke Region / State select karein.",
            "error"
        );

        return;

    }


    if (
        sideB.length === 0
    ) {

        showMessage(
            "Second participant ke Region / State select karein.",
            "error"
        );

        return;

    }


    const competitionData = {

        name:
            name,


        date:
            date,


        endTime:
            endTime,


        sideAName:
            participantA,


        sideBName:
            participantB,


        sideA:
            sideA,


        sideB:
            sideB,


        status:
            "active",

        updatedAt:
            serverTimestamp()

    };


    try {

        saveCompetitionBtn.disabled =
            true;


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
                "Competition successfully update ho gaya."
            );

        }

        else {

            competitionData.createdAt =
                serverTimestamp();


            await addDoc(

                collection(
                    db,
                    COMPETITION_COLLECTION
                ),

                competitionData

            );


            showMessage(
                "Competition successfully save ho gaya."
            );

        }


        resetCompetitionForm();


        await loadCompetitions();

    }

    catch (error) {

        console.error(
            error
        );


        showMessage(
            "Competition save nahi ho saka.",
            "error"
        );

    }

    finally {

        saveCompetitionBtn.disabled =
            false;

    }

}



// ======================================================
// FORM SUBMIT
// ======================================================

competitionForm?.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        saveCompetition();

    }
);



// ======================================================
// RESET FORM
// ======================================================

function resetCompetitionForm() {

    competitionForm.reset();


    editingCompetitionId =
        null;


    saveCompetitionBtn.innerHTML =
        `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Competition
        `;


    setDefaultDate();


    initializeRows();

}



// ======================================================
// RESET BUTTON
// ======================================================

resetCompetitionBtn?.addEventListener(
    "click",
    function () {

        resetCompetitionForm();

    }
);



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


        const competitions =
            [];


        snapshot.forEach(
            competitionDoc => {

                competitions.push({

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

                });

            }
        );


        displayCompetitions(
            competitions
        );

    }

    catch (error) {

        console.error(
            error
        );

    }

}



// ======================================================
// DISPLAY COMPETITIONS
// ======================================================

function displayCompetitions(
    competitions
) {

    if (!competitionList) {

        return;

    }


    if (
        competitions.length === 0
    ) {

        competitionList.innerHTML =
            `
            <div class="saved-competition">
                No Competition Found
            </div>
            `;

        return;

    }


    competitionList.innerHTML =
        competitions.map(
            competition => {

                return `

                <div class="saved-competition">

                    <div class="saved-top">

                        <div>

                            <div class="saved-name">

                                ${escapeHTML(
                                    competition.name
                                )}

                            </div>


                            <div class="saved-meta">

                                ${escapeHTML(
                                    competition.sideAName ||
                                    ""
                                )}

                                VS

                                ${escapeHTML(
                                    competition.sideBName ||
                                    ""
                                )}

                                •
                                ${escapeHTML(
                                    competition.date ||
                                    ""
                                )}

                                •
                                ${escapeHTML(
                                    competition.endTime ||
                                    ""
                                )}

                            </div>

                        </div>


                        <div class="saved-actions">


                            <button
                                class="small-btn edit-btn"
                                onclick="editCompetition('${competition.id}')"
                            >

                                <i class="fa-solid fa-pen"></i>

                                Edit

                            </button>


                            <button
                                class="small-btn copy-btn"
                                onclick="copyCompetitionLink('${competition.id}')"
                            >

                                <i class="fa-solid fa-link"></i>

                                Copy Link

                            </button>


                            <button
                                class="small-btn delete-btn"
                                onclick="deleteCompetition('${competition.id}')"
                            >

                                <i class="fa-solid fa-trash"></i>

                                Delete

                            </button>


                        </div>

                    </div>

                </div>

                `;

            }
        ).join(
            ""
        );



    window.currentCompetitions =
        competitions;

}



// ======================================================
// EDIT COMPETITION
// ======================================================

window.editCompetition =
    function (
        competitionId
    ) {

        const competition =
            window.currentCompetitions.find(
                item =>
                    item.id ===
                    competitionId
            );


        if (!competition) {

            return;

        }


        editingCompetitionId =
            competitionId;


        competitionName.value =
            competition.name || "";


        competitionDate.value =
            competition.date || "";


        competitionEndTime.value =
            competition.endTime || "";


        participantAName.value =
            competition.sideAName || "";


        participantBName.value =
            competition.sideBName || "";


        sideAContainer.innerHTML =
            "";


        sideBContainer.innerHTML =
            "";


        (
            competition.sideA || []
        ).forEach(
            item => {

                sideAContainer.appendChild(
                    createSideRow(
                        "A",
                        item
                    )
                );

            }
        );


        (
            competition.sideB || []
        ).forEach(
            item => {

                sideBContainer.appendChild(
                    createSideRow(
                        "B",
                        item
                    )
                );

            }
        );


        if (
            sideAContainer.children.length === 0
        ) {

            sideAContainer.appendChild(
                createSideRow(
                    "A"
                )
            );

        }


        if (
            sideBContainer.children.length === 0
        ) {

            sideBContainer.appendChild(
                createSideRow(
                    "B"
                )
            );

        }


        saveCompetitionBtn.innerHTML =
            `
            <i class="fa-solid fa-floppy-disk"></i>
            Update Competition
            `;


        window.scrollTo({

            top:
                0,

            behavior:
                "smooth"

        });

    };



// ======================================================
// DELETE COMPETITION
// ======================================================

window.deleteCompetition =
    async function (
        competitionId
    ) {

        const confirmDelete =
            confirm(
                "Kya aap is Competition ko delete karna chahte hain?"
            );


        if (
            !confirmDelete
        ) {

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
                "Competition delete ho gaya."
            );


            await loadCompetitions();

        }

        catch (error) {

            console.error(
                error
            );


            showMessage(
                "Competition delete nahi ho saka.",
                "error"
            );

        }

    };



// ======================================================
// COPY PUBLIC LINK
// ======================================================

window.copyCompetitionLink =
    async function (
        competitionId
    ) {

        const publicURL =
            new URL(
                "competition.html",
                window.location.href
            );


        publicURL.searchParams.set(
            "id",
            competitionId
        );


        try {

            await navigator.clipboard.writeText(
                publicURL.href
            );


            showMessage(
                "Public Competition Link copied."
            );

        }

        catch (error) {

            prompt(
                "Copy this Public Link:",
                publicURL.href
            );

        }

    };



// ======================================================
// LOGOUT
// ======================================================

document
    .getElementById(
        "logoutBtn"
    )
    ?.addEventListener(
        "click",
        function () {

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



// ======================================================
// START
// ======================================================

setDefaultDate();


loadEmployees();


loadCompetitions();


// ======================================================
// END
// ======================================================
