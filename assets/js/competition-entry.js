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
// 3. Delete Competition
// 4. Copy Public Link
// 5. Side A / Side B
// 6. Custom Side Names
// 7. Region / State Selection
// 8. Multiple Participants
// 9. Firebase Collection: competitions
//
// ======================================================


// ======================================================
// IMPORT FIREBASE CONFIG
// ======================================================

import {
    db
} from "./firebase-config.js";


// ======================================================
// IMPORT FIRESTORE
// ======================================================

import {

    collection,

    addDoc,

    getDocs,

    getDoc,

    doc,

    updateDoc,

    deleteDoc,

    serverTimestamp,

    query,

    orderBy

} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// COLLECTION
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


const sideAName =
    document.getElementById(
        "sideAName"
    );


const sideBName =
    document.getElementById(
        "sideBName"
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


const cancelEditBtn =
    document.getElementById(
        "cancelEditBtn"
    );


const editingCompetitionId =
    document.getElementById(
        "editingCompetitionId"
    );


const messageBox =
    document.getElementById(
        "competitionMessage"
    );


const savedCompetitionList =
    document.getElementById(
        "savedCompetitionList"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// ======================================================
// DATA
// ======================================================

let allEmployees = [];


// ======================================================
// USER
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
        function () {

            messageBox.style.display =
                "none";

        },
        5000
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
            function (
                employeeDoc
            ) {

                allEmployees.push({

                    id:
                        employeeDoc.id,

                    ...employeeDoc.data()

                });

            }
        );


        initializeRows();


        console.log(
            "Employees Loaded:",
            allEmployees.length
        );

    }

    catch (error) {

        console.error(
            "Employees Load Error:",
            error
        );


        showMessage(
            "Region / State data load nahi ho saka.",
            "error"
        );


        initializeRows();

    }

}


// ======================================================
// GET UNIQUE REGIONS
// ======================================================

function getRegions() {

    const regions =
        new Set();


    allEmployees.forEach(
        function (
            employee
        ) {

            const region =
                getEmployeeRegion(
                    employee
                );


            if (
                region
            ) {

                regions.add(
                    region
                );

            }

        }
    );


    return [
        ...regions
    ]
        .sort(
            function (
                a,
                b
            ) {

                return a.localeCompare(
                    b
                );

            }
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
        function (
            employee
        ) {

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
    ]
        .sort(
            function (
                a,
                b
            ) {

                return a.localeCompare(
                    b
                );

            }
        );

}


// ======================================================
// REGION OPTIONS
// ======================================================

function getRegionOptionsHTML(
    selectedRegion = ""
) {

    let html =
        `
        <option value="">
            Select Region
        </option>
        `;


    getRegions().forEach(
        function (
            region
        ) {

            const selected =
                normalize(
                    region
                ) ===
                normalize(
                    selectedRegion
                )
                    ? "selected"
                    : "";


            html +=
                `
                <option
                    value="${escapeHTML(region)}"
                    ${selected}
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
    region,
    selectedState = ""
) {

    let html =
        `
        <option value="">
            All Region
        </option>
        `;


    if (
        !region
    ) {

        return html;

    }


    getStatesForRegion(
        region
    )
        .forEach(
            function (
                state
            ) {

                const selected =
                    normalize(
                        state
                    ) ===
                    normalize(
                        selectedState
                    )
                        ? "selected"
                        : "";


                html +=
                    `
                    <option
                        value="${escapeHTML(state)}"
                        ${selected}
                    >
                        ${escapeHTML(state)}
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


    const selectedRegion =
        String(
            data.region || ""
        );


    const selectedState =
        String(
            data.state || ""
        );


    row.innerHTML =
        `

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
            >

                ${getStateOptionsHTML(
                    selectedRegion,
                    selectedState
                )}

            </select>

        </div>


        <!-- REMOVE -->

        <button
            type="button"
            class="remove-side-row"
            title="Remove"
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

            const selectedRegion =
                this.value;


            stateSelect.innerHTML =
                getStateOptionsHTML(
                    selectedRegion
                );

        }
    );


    // ==================================================
    // REMOVE
    // ==================================================

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
// ADD SIDE A
// ======================================================

if (
    addSideARowBtn
) {

    addSideARowBtn.addEventListener(
        "click",
        function () {

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

if (
    addSideBRowBtn
) {

    addSideBRowBtn.addEventListener(
        "click",
        function () {

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

    const result =
        [];


    if (
        !container
    ) {

        return result;

    }


    const rows =
        container.querySelectorAll(
            ".competition-side-row"
        );


    rows.forEach(
        function (
            row
        ) {

            const region =
                String(
                    row
                        .querySelector(
                            ".competition-region"
                        )
                        ?.value || ""
                )
                    .trim();


            const state =
                String(
                    row
                        .querySelector(
                            ".competition-state"
                        )
                        ?.value || ""
                )
                    .trim();


            if (
                region
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
// REMOVE DUPLICATES
// ======================================================

function removeDuplicates(
    data
) {

    const map =
        new Map();


    data.forEach(
        function (
            item
        ) {

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
// VALIDATE SIDE
// ======================================================

function validateSide(
    sideData,
    sideName
) {

    if (
        !sideData.length
    ) {

        return {

            valid:
                false,

            message:
                `${sideName} mein kam se kam ek Region select karein.`

        };

    }


    return {

        valid:
            true,

        message:
            ""

    };

}


// ======================================================
// RESET FORM
// ======================================================

function resetCompetitionForm() {

    competitionForm.reset();


    editingCompetitionId.value =
        "";


    sideAName.value =
        "Side A";


    sideBName.value =
        "Side B";


    setDefaultDate();


    initializeRows();


    saveCompetitionBtn.innerHTML =
        `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Competition
        `;


    if (
        cancelEditBtn
    ) {

        cancelEditBtn.style.display =
            "none";

    }

}


// ======================================================
// SAVE / UPDATE
// ======================================================

async function saveCompetition() {

    const name =
        String(
            competitionName.value || ""
        ).trim();


    const date =
        String(
            competitionDate.value || ""
        ).trim();


    const endTime =
        String(
            competitionEndTime.value || ""
        ).trim();


    const customSideAName =
        String(
            sideAName.value || ""
        ).trim();


    const customSideBName =
        String(
            sideBName.value || ""
        ).trim();


    let sideA =
        removeDuplicates(
            getSideData(
                sideAContainer
            )
        );


    let sideB =
        removeDuplicates(
            getSideData(
                sideBContainer
            )
        );


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


    if (
        !customSideAName
    ) {

        throw new Error(
            "Side A ka naam enter karein."
        );

    }


    if (
        !customSideBName
    ) {

        throw new Error(
            "Side B ka naam enter karein."
        );

    }


    const validationA =
        validateSide(
            sideA,
            customSideAName
        );


    if (
        !validationA.valid
    ) {

        throw new Error(
            validationA.message
        );

    }


    const validationB =
        validateSide(
            sideB,
            customSideBName
        );


    if (
        !validationB.valid
    ) {

        throw new Error(
            validationB.message
        );

    }


    // ==================================================
    // DISABLE BUTTON
    // ==================================================

    saveCompetitionBtn.disabled =
        true;


    const oldButtonHTML =
        saveCompetitionBtn.innerHTML;


    saveCompetitionBtn.innerHTML =
        `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Saving...
        `;


    try {

        const competitionId =
            String(
                editingCompetitionId.value ||
                ""
            ).trim();


        const competitionData = {

            name:
                name,

            date:
                date,

            endTime:
                endTime,


            sideAName:
                customSideAName,

            sideBName:
                customSideBName,


            sideA:
                sideA,

            sideB:
                sideB,


            status:
                "active",


            updatedAt:
                serverTimestamp()

        };


        // ==============================================
        // UPDATE
        // ==============================================

        if (
            competitionId
        ) {

            await updateDoc(

                doc(
                    db,
                    COMPETITION_COLLECTION,
                    competitionId
                ),

                competitionData

            );


            showMessage(
                "Competition successfully update ho gaya."
            );

        }


        // ==============================================
        // CREATE
        // ==============================================

        else {

            competitionData.createdAt =
                serverTimestamp();


            competitionData.createdBy =
                loggedInUser ||
                "admin";


            competitionData.createdRole =
                currentUserRole ||
                "admin";


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

    finally {

        saveCompetitionBtn.disabled =
            false;


        saveCompetitionBtn.innerHTML =
            oldButtonHTML;

    }

}


// ======================================================
// FORM SUBMIT
// ======================================================

competitionForm.addEventListener(
    "submit",
    async function (
        event
    ) {

        event.preventDefault();


        try {

            await saveCompetition();

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            showMessage(
                error.message ||
                "Competition save nahi ho saka.",
                "error"
            );

        }

    }
);


// ======================================================
// RESET
// ======================================================

resetCompetitionBtn.addEventListener(
    "click",
    function () {

        resetCompetitionForm();

    }
);


// ======================================================
// CANCEL EDIT
// ======================================================

cancelEditBtn.addEventListener(
    "click",
    function () {

        resetCompetitionForm();


        window.scrollTo({

            top:
                0,

            behavior:
                "smooth"

        });

    }
);


// ======================================================
// FORMAT PARTICIPANTS
// ======================================================

function formatParticipants(
    data
) {

    if (
        !Array.isArray(
            data
        ) ||
        !data.length
    ) {

        return "-";

    }


    return data
        .map(
            function (
                item
            ) {

                if (
                    item.state
                ) {

                    return (
                        item.region +
                        " - " +
                        item.state
                    );

                }


                return (
                    item.region
                );

            }
        )
        .join(
            ", "
        );

}


// ======================================================
// LOAD COMPETITIONS
// ======================================================

async function loadCompetitions() {

    if (
        !savedCompetitionList
    ) {

        return;

    }


    savedCompetitionList.innerHTML =
        `
        <div class="empty-list">
            Loading Competitions...
        </div>
        `;


    try {

        let snapshot;


        try {

            const competitionQuery =
                query(

                    collection(
                        db,
                        COMPETITION_COLLECTION
                    ),

                    orderBy(
                        "createdAt",
                        "desc"
                    )

                );


            snapshot =
                await getDocs(
                    competitionQuery
                );

        }

        catch (
            queryError
        ) {

            snapshot =
                await getDocs(

                    collection(
                        db,
                        COMPETITION_COLLECTION
                    )

                );

        }


        const competitions =
            [];


        snapshot.forEach(
            function (
                competitionDoc
            ) {

                competitions.push({

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

                });

            }
        );


        if (
            !competitions.length
        ) {

            savedCompetitionList.innerHTML =
                `
                <div class="empty-list">

                    <i class="fa-solid fa-trophy"></i>

                    <br><br>

                    No Competition Found

                </div>
                `;


            return;

        }


        savedCompetitionList.innerHTML =
            "";


        competitions.forEach(
            function (
                competition
            ) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "saved-competition";


                card.innerHTML =
                    `

                    <div
                        class="saved-competition-top"
                    >

                        <div>

                            <h3>

                                ${escapeHTML(
                                    competition.name
                                )}

                            </h3>


                            <div
                                class="competition-meta"
                            >

                                <span
                                    class="meta-badge"
                                >

                                    <i class="fa-solid fa-calendar"></i>

                                    ${escapeHTML(
                                        competition.date || ""
                                    )}

                                </span>


                                <span
                                    class="meta-badge"
                                >

                                    <i class="fa-solid fa-clock"></i>

                                    End:
                                    ${escapeHTML(
                                        competition.endTime || ""
                                    )}

                                </span>

                            </div>

                        </div>

                    </div>


                    <div
                        class="competition-participants"
                    >

                        <strong>

                            ${escapeHTML(
                                competition.sideAName ||
                                "Side A"
                            )}

                        </strong>

                        <br>

                        ${escapeHTML(
                            formatParticipants(
                                competition.sideA
                            )
                        )}

                        <br><br>

                        <strong>

                            VS

                        </strong>

                        <br><br>

                        <strong>

                            ${escapeHTML(
                                competition.sideBName ||
                                "Side B"
                            )}

                        </strong>

                        <br>

                        ${escapeHTML(
                            formatParticipants(
                                competition.sideB
                            )
                        )}

                    </div>


                    <div
                        class="competition-actions"
                    >


                        <button
                            type="button"
                            class="small-btn copy"
                            data-action="copy"
                            data-id="${competition.id}"
                        >

                            <i class="fa-solid fa-link"></i>

                            Copy Public Link

                        </button>


                        <button
                            type="button"
                            class="small-btn edit"
                            data-action="edit"
                            data-id="${competition.id}"
                        >

                            <i class="fa-solid fa-pen"></i>

                            Edit

                        </button>


                        <button
                            type="button"
                            class="small-btn delete"
                            data-action="delete"
                            data-id="${competition.id}"
                        >

                            <i class="fa-solid fa-trash"></i>

                            Delete

                        </button>


                    </div>

                    `;


                savedCompetitionList.appendChild(
                    card
                );

            }
        );

    }

    catch (
        error
    ) {

        console.error(
            "Competition Load Error:",
            error
        );


        savedCompetitionList.innerHTML =
            `
            <div class="empty-list">
                Competition load nahi ho saka.
            </div>
            `;

    }

}


// ======================================================
// COMPETITION LIST ACTIONS
// ======================================================

savedCompetitionList.addEventListener(
    "click",
    async function (
        event
    ) {

        const button =
            event.target.closest(
                "button[data-action]"
            );


        if (
            !button
        ) {

            return;

        }


        const action =
            button.dataset.action;


        const competitionId =
            button.dataset.id;


        // ==============================================
        // COPY LINK
        // ==============================================

        if (
            action === "copy"
        ) {

            copyPublicLink(
                competitionId
            );

        }


        // ==============================================
        // EDIT
        // ==============================================

        if (
            action === "edit"
        ) {

            await editCompetition(
                competitionId
            );

        }


        // ==============================================
        // DELETE
        // ==============================================

        if (
            action === "delete"
        ) {

            await deleteCompetition(
                competitionId
            );

        }

    }
);


// ======================================================
// COPY PUBLIC LINK
// ======================================================

async function copyPublicLink(
    competitionId
) {

    const publicLink =
        new URL(
            "competition.html",
            window.location.href
        );


    publicLink.searchParams.set(
        "id",
        competitionId
    );


    try {

        await navigator.clipboard.writeText(
            publicLink.href
        );


        showMessage(
            "Public Competition Link copied successfully."
        );

    }

    catch (
        error
    ) {

        const textArea =
            document.createElement(
                "textarea"
            );


        textArea.value =
            publicLink.href;


        document.body.appendChild(
            textArea
        );


        textArea.select();


        document.execCommand(
            "copy"
        );


        textArea.remove();


        showMessage(
            "Public Competition Link copied successfully."
        );

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


        const competitionSnapshot =
            await getDoc(
                competitionRef
            );


        if (
            !competitionSnapshot.exists()
        ) {

            throw new Error(
                "Competition nahi mila."
            );

        }


        const competition =
            competitionSnapshot.data();


        // ==============================================
        // BASIC DATA
        // ==============================================

        editingCompetitionId.value =
            competitionId;


        competitionName.value =
            competition.name ||
            "";


        competitionDate.value =
            competition.date ||
            "";


        competitionEndTime.value =
            competition.endTime ||
            "";


        sideAName.value =
            competition.sideAName ||
            "Side A";


        sideBName.value =
            competition.sideBName ||
            "Side B";


        // ==============================================
        // CLEAR SIDES
        // ==============================================

        sideAContainer.innerHTML =
            "";


        sideBContainer.innerHTML =
            "";


        // ==============================================
        // SIDE A
        // ==============================================

        if (
            Array.isArray(
                competition.sideA
            ) &&
            competition.sideA.length
        ) {

            competition.sideA.forEach(
                function (
                    item
                ) {

                    sideAContainer.appendChild(

                        createSideRow(
                            "A",
                            item
                        )

                    );

                }
            );

        }

        else {

            sideAContainer.appendChild(
                createSideRow(
                    "A"
                )
            );

        }


        // ==============================================
        // SIDE B
        // ==============================================

        if (
            Array.isArray(
                competition.sideB
            ) &&
            competition.sideB.length
        ) {

            competition.sideB.forEach(
                function (
                    item
                ) {

                    sideBContainer.appendChild(

                        createSideRow(
                            "B",
                            item
                        )

                    );

                }
            );

        }

        else {

            sideBContainer.appendChild(
                createSideRow(
                    "B"
                )
            );

        }


        // ==============================================
        // BUTTON
        // ==============================================

        saveCompetitionBtn.innerHTML =
            `
            <i class="fa-solid fa-floppy-disk"></i>
            Update Competition
            `;


        cancelEditBtn.style.display =
            "inline-flex";


        window.scrollTo({

            top:
                0,

            behavior:
                "smooth"

        });


        showMessage(
            "Competition Edit Mode mein load ho gaya."
        );

    }

    catch (
        error
    ) {

        console.error(
            "Edit Error:",
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
// DELETE COMPETITION
// ======================================================

async function deleteCompetition(
    competitionId
) {

    const confirmed =
        window.confirm(
            "Kya aap is Competition ko delete karna chahte hain?"
        );


    if (
        !confirmed
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


        // If currently editing same competition

        if (
            editingCompetitionId.value ===
            competitionId
        ) {

            resetCompetitionForm();

        }


        showMessage(
            "Competition successfully delete ho gaya."
        );


        await loadCompetitions();

    }

    catch (
        error
    ) {

        console.error(
            "Delete Error:",
            error
        );


        showMessage(
            "Competition delete nahi ho saka.",
            "error"
        );

    }

}


// ======================================================
// LOGOUT
// ======================================================

if (
    logoutBtn
) {

    logoutBtn.addEventListener(
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

}


// ======================================================
// START
// ======================================================

setDefaultDate();

loadEmployees();

loadCompetitions();


// ======================================================
// END
// ======================================================
