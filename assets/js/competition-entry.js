// ======================================================
// TELETHON
// COMPETITION ENTRY
//
// File:
// assets/js/competition-entry.js
//
// FEATURES:
//
// 1. Competition Create
// 2. Competition Edit
// 3. Competition Update
// 4. Competition Delete
// 5. Competition Name
// 6. Competition Date
// 7. Competition End Time
// 8. Side A Participants
// 9. Side B Participants
// 10. Region / State Selection
// 11. Firebase Collection: competitions
//
// ======================================================


import { db } from "./firebase-config.js";


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


const editingCompetitionId =
    document.getElementById(
        "editingCompetitionId"
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


const cancelEditBtn =
    document.getElementById(
        "cancelEditBtn"
    );


const messageBox =
    document.getElementById(
        "competitionMessage"
    );


const competitionList =
    document.getElementById(
        "competitionList"
    );


// ======================================================
// DATA
// ======================================================

let allEmployees =
    [];


let allCompetitions =
    [];


// ======================================================
// LOGIN DATA
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

    if (
        !messageBox
    ) {
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

            if (
                messageBox
            ) {

                messageBox.style.display =
                    "none";

            }

        },
        5000
    );

}


// ======================================================
// DEFAULT DATE
// ======================================================

function setDefaultDate() {

    if (
        !competitionDate
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


    competitionDate.value =
        year +
        "-" +
        month +
        "-" +
        day;

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


        console.log(
            "Employees Loaded:",
            allEmployees.length
        );


        initializeRows();


    }

    catch (
        error
    ) {

        console.error(
            "Employee Load Error:",
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
// GET REGIONS
// ======================================================

function getRegions() {

    const regionMap =
        new Map();


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

                const key =
                    normalize(
                        region
                    );


                if (
                    !regionMap.has(
                        key
                    )
                ) {

                    regionMap.set(
                        key,
                        region
                    );

                }

            }

        }
    );


    return [
        ...regionMap.values()
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

    const stateMap =
        new Map();


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

                const key =
                    normalize(
                        state
                    );


                if (
                    !stateMap.has(
                        key
                    )
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
    selectedValue = ""
) {

    const regions =
        getRegions();


    let html =
        `
        <option value="">
            Select Region
        </option>
        `;


    regions.forEach(
        function (
            region
        ) {

            const selected =
                normalize(
                    region
                ) ===
                normalize(
                    selectedValue
                )
                    ? "selected"
                    : "";


            html +=
                `
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
    region,
    selectedValue = ""
) {

    if (
        !region
    ) {

        return
            `
            <option value="">
                Select State
            </option>
            `;

    }


    const states =
        getStatesForRegion(
            region
        );


    let html =
        `
        <option value="">
            All Region
        </option>
        `;


    states.forEach(
        function (
            state
        ) {

            const selected =
                normalize(
                    state
                ) ===
                normalize(
                    selectedValue
                )
                    ? "selected"
                    : "";


            html +=
                `
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


        <div class="competition-field">

            <label>
                State
            </label>

            <select
                class="competition-state"
                ${!selectedRegion ? "disabled" : ""}
            >

                ${getStateOptionsHTML(
                    selectedRegion,
                    selectedState
                )}

            </select>

        </div>


        <button
            type="button"
            class="remove-side-row"
            title="Remove Participant"
        >

            <i class="fa-solid fa-trash"></i>

        </button>

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
    // REMOVE
    // ==================================================

    removeButton.addEventListener(
        "click",
        function () {

            const container =
                side === "A"
                    ? sideAContainer
                    : sideBContainer;


            if (
                !container
            ) {
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
                    `Side ${side} mein kam se kam 1 participant hona chahiye.`,
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

    if (
        !container
    ) {
        return [];
    }


    const result =
        [];


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

function removeDuplicateEntries(
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
    data,
    sideName
) {

    if (
        !Array.isArray(
            data
        ) ||
        data.length === 0
    ) {

        return {

            valid:
                false,

            message:
                `Side ${sideName} mein kam se kam ek Region select karein.`

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
// LOAD COMPETITIONS
// ======================================================

async function loadCompetitions() {

    if (
        !competitionList
    ) {
        return;
    }


    competitionList.innerHTML =
        `
        <div class="empty-list">
            Loading competitions...
        </div>
        `;


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


        const snapshot =
            await getDocs(
                competitionQuery
            );


        allCompetitions =
            [];


        snapshot.forEach(
            function (
                competitionDoc
            ) {

                allCompetitions.push({

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

                });

            }
        );


        renderCompetitionList();


    }

    catch (
        error
    ) {

        console.warn(
            "Ordered Competition Load Error:",
            error
        );


        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        COMPETITION_COLLECTION
                    )
                );


            allCompetitions =
                [];


            snapshot.forEach(
                function (
                    competitionDoc
                ) {

                    allCompetitions.push({

                        id:
                            competitionDoc.id,

                        ...competitionDoc.data()

                    });

                }
            );


            renderCompetitionList();

        }

        catch (
            secondError
        ) {

            console.error(
                "Competition Load Error:",
                secondError
            );


            competitionList.innerHTML =
                `
                <div class="empty-list">
                    Competition load nahi ho saka.
                </div>
                `;

        }

    }

}


// ======================================================
// PARTICIPANT TEXT
// ======================================================

function participantText(
    participants
) {

    if (
        !Array.isArray(
            participants
        )
    ) {
        return "-";
    }


    return participants
        .map(
            function (
                item
            ) {

                if (
                    item.state
                ) {

                    return (
                        item.region +
                        " / " +
                        item.state
                    );

                }


                return item.region;

            }
        )
        .join(
            ", "
        );

}


// ======================================================
// RENDER COMPETITIONS
// ======================================================

function renderCompetitionList() {

    if (
        !competitionList
    ) {
        return;
    }


    if (
        allCompetitions.length === 0
    ) {

        competitionList.innerHTML =
            `
            <div class="empty-list">

                <i class="fa-solid fa-trophy"></i>

                <br><br>

                Abhi koi competition available nahi hai.

            </div>
            `;

        return;

    }


    let html =
        "";


    allCompetitions.forEach(
        function (
            competition
        ) {

            html +=
                `

                <div
                    class="competition-item"
                >


                    <div>

                        <h3>
                            ${escapeHTML(
                                competition.name ||
                                "Untitled Competition"
                            )}
                        </h3>


                        <div class="competition-meta">

                            <span>

                                <i class="fa-solid fa-calendar"></i>

                                ${escapeHTML(
                                    competition.date ||
                                    "-"
                                )}

                            </span>


                            <span>

                                <i class="fa-solid fa-clock"></i>

                                End:
                                ${escapeHTML(
                                    competition.endTime ||
                                    "-"
                                )}

                            </span>

                        </div>


                        <div
                            class="competition-meta"
                            style="margin-top:8px;"
                        >

                            <span>

                                <strong>
                                    Side A:
                                </strong>

                                ${escapeHTML(
                                    participantText(
                                        competition.sideA
                                    )
                                )}

                            </span>

                        </div>


                        <div
                            class="competition-meta"
                            style="margin-top:5px;"
                        >

                            <span>

                                <strong>
                                    Side B:
                                </strong>

                                ${escapeHTML(
                                    participantText(
                                        competition.sideB
                                    )
                                )}

                            </span>

                        </div>


                    </div>


                    <div
                        class="competition-item-actions"
                    >


                        <button
                            type="button"
                            class="small-btn edit-btn"
                            data-edit-id="${escapeHTML(
                                competition.id
                            )}"
                        >

                            <i class="fa-solid fa-pen"></i>

                            Edit

                        </button>


                        <button
                            type="button"
                            class="small-btn delete-btn"
                            data-delete-id="${escapeHTML(
                                competition.id
                            )}"
                        >

                            <i class="fa-solid fa-trash"></i>

                            Delete

                        </button>


                    </div>


                </div>

                `;

        }
    );


    competitionList.innerHTML =
        html;


    attachCompetitionActions();

}


// ======================================================
// ATTACH EDIT / DELETE
// ======================================================

function attachCompetitionActions() {

    const editButtons =
        document.querySelectorAll(
            "[data-edit-id]"
        );


    editButtons.forEach(
        function (
            button
        ) {

            button.addEventListener(
                "click",
                function () {

                    editCompetition(
                        this.dataset.editId
                    );

                }
            );

        }
    );


    const deleteButtons =
        document.querySelectorAll(
            "[data-delete-id]"
        );


    deleteButtons.forEach(
        function (
            button
        ) {

            button.addEventListener(
                "click",
                function () {

                    deleteCompetition(
                        this.dataset.deleteId
                    );

                }
            );

        }
    );

}


// ======================================================
// EDIT COMPETITION
// ======================================================

function editCompetition(
    competitionId
) {

    const competition =
        allCompetitions.find(
            function (
                item
            ) {

                return (
                    item.id ===
                    competitionId
                );

            }
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


    // ==================================================
    // BASIC DATA
    // ==================================================

    editingCompetitionId.value =
        competition.id;


    competitionName.value =
        competition.name ||
        "";


    competitionDate.value =
        competition.date ||
        "";


    competitionEndTime.value =
        competition.endTime ||
        "";


    // ==================================================
    // CLEAR SIDES
    // ==================================================

    sideAContainer.innerHTML =
        "";


    sideBContainer.innerHTML =
        "";


    // ==================================================
    // SIDE A
    // ==================================================

    const sideA =
        Array.isArray(
            competition.sideA
        )
            ? competition.sideA
            : [];


    if (
        sideA.length > 0
    ) {

        sideA.forEach(
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


    // ==================================================
    // SIDE B
    // ==================================================

    const sideB =
        Array.isArray(
            competition.sideB
        )
            ? competition.sideB
            : [];


    if (
        sideB.length > 0
    ) {

        sideB.forEach(
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


    // ==================================================
    // BUTTON
    // ==================================================

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


        showMessage(
            "Competition successfully delete ho gaya."
        );


        if (
            editingCompetitionId.value ===
            competitionId
        ) {

            resetCompetitionForm();

        }


        loadCompetitions();


    }

    catch (
        error
    ) {

        console.error(
            "Competition Delete Error:",
            error
        );


        showMessage(
            "Competition delete nahi ho saka.",
            "error"
        );

    }

}


// ======================================================
// SAVE / UPDATE
// ======================================================

async function saveCompetition() {

    const isEditing =
        Boolean(
            editingCompetitionId.value
        );


    // ==================================================
    // DISABLE BUTTON
    // ==================================================

    saveCompetitionBtn.disabled =
        true;


    saveCompetitionBtn.innerHTML =
        `
        <i class="fa-solid fa-spinner fa-spin"></i>

        ${isEditing
            ? "Updating..."
            : "Saving..."
        }
        `;


    try {

        // ==============================================
        // BASIC DATA
        // ==============================================

        const name =
            String(
                competitionName.value ||
                ""
            ).trim();


        const date =
            String(
                competitionDate.value ||
                ""
            ).trim();


        const endTime =
            String(
                competitionEndTime.value ||
                ""
            ).trim();


        // ==============================================
        // VALIDATION
        // ==============================================

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


        sideA =
            removeDuplicateEntries(
                sideA
            );


        sideB =
            removeDuplicateEntries(
                sideB
            );


        // ==============================================
        // VALIDATE SIDE A
        // ==============================================

        const validationA =
            validateSide(
                sideA,
                "A"
            );


        if (
            !validationA.valid
        ) {

            throw new Error(
                validationA.message
            );

        }


        // ==============================================
        // VALIDATE SIDE B
        // ==============================================

        const validationB =
            validateSide(
                sideB,
                "B"
            );


        if (
            !validationB.valid
        ) {

            throw new Error(
                validationB.message
            );

        }


        // ==============================================
        // DATA
        // ==============================================

        const competitionData = {

            name:
                name,

            date:
                date,

            endTime:
                endTime,

            sideA:
                sideA,

            sideB:
                sideB,

            status:
                "active"

        };


        // ==============================================
        // UPDATE
        // ==============================================

        if (
            isEditing
        ) {

            competitionData.updatedAt =
                serverTimestamp();


            competitionData.updatedBy =
                loggedInUser ||
                "admin";


            await updateDoc(

                doc(
                    db,
                    COMPETITION_COLLECTION,
                    editingCompetitionId.value
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


        // ==============================================
        // RESET
        // ==============================================

        resetCompetitionForm();


        // ==============================================
        // RELOAD LIST
        // ==============================================

        loadCompetitions();

    }

    catch (
        error
    ) {

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

        saveCompetitionBtn.disabled =
            false;


        saveCompetitionBtn.innerHTML =
            `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Competition
            `;

    }

}


// ======================================================
// RESET FORM
// ======================================================

function resetCompetitionForm() {

    if (
        competitionForm
    ) {

        competitionForm.reset();

    }


    editingCompetitionId.value =
        "";


    setDefaultDate();


    initializeRows();


    saveCompetitionBtn.innerHTML =
        `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Competition
        `;


    cancelEditBtn.style.display =
        "none";

}


// ======================================================
// FORM SUBMIT
// ======================================================

if (
    competitionForm
) {

    competitionForm.addEventListener(
        "submit",
        function (
            event
        ) {

            event.preventDefault();


            saveCompetition();

        }
    );

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

            setTimeout(
                function () {

                    resetCompetitionForm();

                },
                0
            );

        }
    );

}


// ======================================================
// CANCEL EDIT
// ======================================================

if (
    cancelEditBtn
) {

    cancelEditBtn.addEventListener(
        "click",
        function () {

            resetCompetitionForm();


            showMessage(
                "Edit mode cancel ho gaya."
            );

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
        function (
            event
        ) {

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


loadCompetitions();


// ======================================================
// END
// ======================================================
