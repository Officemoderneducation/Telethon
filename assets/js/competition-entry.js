// ======================================================
// TELETHON
// COMPETITION ENTRY
//
// CREATE
// EDIT
// DELETE
// COPY PUBLIC LINK
// WINNER STATUS
// HIDE / SHOW PUBLIC
//
// FIREBASE COLLECTION:
// competitions
//
// EXISTING FUNCTIONALITY:
// Region / State selection
// Team names
// Create
// Edit
// Delete
// Copy Public Link
//
// ADDED:
// 1. Winner Status
// 2. Hide / Show Public
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
// COLLECTIONS
// ======================================================

const COMPETITION_COLLECTION =
    "competitions";


const EMPLOYEES_COLLECTION =
    "employees";


const DAILY_ENTRY_COLLECTION =
    "daily_entry";


const TEACHER_ENTRIES_COLLECTION =
    "teacher_entries";



// ======================================================
// UNIT AMOUNT
// ======================================================

const UNIT_AMOUNT =
    7000;



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


let allEntries = [];


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
// NUMBER
// ======================================================

function numberValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? value
            : 0;

    }


    const cleaned =
        String(value)
            .replace(
                /₹/g,
                ""
            )
            .replace(
                /,/g,
                ""
            )
            .trim();


    const number =
        Number(cleaned);


    return Number.isFinite(number)
        ? number
        : 0;

}



// ======================================================
// FORMAT UNIT
// ======================================================

function formatUnit(value) {

    const units =
        numberValue(value);


    if (
        Number.isInteger(units)
    ) {

        return units.toLocaleString(
            "en-IN"
        );

    }


    return units.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
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
// EMPLOYEE CODE
// ======================================================

function getEmployeeCode(
    employee
) {

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
// ENTRY EMPLOYEE CODE
// ======================================================

function getEntryEmployeeCode(
    entry
) {

    return String(

        entry.employee_code ||

        entry.employeeCode ||

        entry.empCode ||

        entry.emp_code ||

        entry.employeeID ||

        entry.employeeId ||

        entry.userCode ||

        entry.user_code ||

        ""

    ).trim();

}



// ======================================================
// ENTRY AMOUNT
// ======================================================

function getEntryAmount(
    entry
) {

    return numberValue(

        entry.amount ??

        entry.collection ??

        entry.collectionAmount ??

        entry.totalCollection ??

        entry.total_collection ??

        0

    );

}



// ======================================================
// ENTRY DATE
// ======================================================

function getEntryDate(
    entry
) {

    const values = [

        entry.date,

        entry.entryDate,

        entry.entry_date,

        entry.collectionDate,

        entry.collection_date,

        entry.selectedDate,

        entry.selected_date,

        entry.dailyDate,

        entry.daily_date

    ];


    for (
        const value
        of values
    ) {

        if (!value) {
            continue;
        }


        const text =
            String(value).trim();


        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(text)
        ) {

            return text;

        }

    }


    return "";

}



// ======================================================
// CREATED TIME
// ======================================================

function getCreatedTime(
    entry
) {

    const value =
        entry?.createdAt;


    if (!value) {

        return 0;

    }


    try {

        if (
            typeof value.toMillis ===
            "function"
        ) {

            return value.toMillis();

        }


        if (
            typeof value.seconds ===
            "number"
        ) {

            return (
                value.seconds *
                1000
            );

        }


        if (
            value instanceof Date
        ) {

            return value.getTime();

        }


        const date =
            new Date(value);


        const time =
            date.getTime();


        return Number.isFinite(time)
            ? time
            : 0;

    }

    catch {

        return 0;

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
// COMPETITION END TIMESTAMP
// ======================================================

function getCompetitionEndTimestamp(
    competition
) {

    const date =
        String(
            competition?.date ||
            ""
        ).trim();


    const time =
        String(
            competition?.endTime ||
            ""
        ).trim();


    if (
        !date ||
        !time
    ) {

        return 0;

    }


    const timestamp =
        new Date(
            `${date}T${time}:00`
        ).getTime();


    return Number.isFinite(
        timestamp
    )
        ? timestamp
        : 0;

}



// ======================================================
// CHECK COMPETITION ENDED
// ======================================================

function isCompetitionEnded(
    competition
) {

    const endTimestamp =
        getCompetitionEndTimestamp(
            competition
        );


    if (!endTimestamp) {

        return false;

    }


    return Date.now() >
        endTimestamp;

}



// ======================================================
// GET PARTICIPANT RULES
// ======================================================

function getParticipantRules(
    competition,
    side
) {

    const sideData =
        Array.isArray(
            competition?.[side]
        )
            ? competition[side]
            : [];


    return sideData.filter(
        item => {

            if (
                !item ||
                typeof item !== "object"
            ) {

                return false;

            }


            return (

                String(
                    item.region || ""
                ).trim() ||

                String(
                    item.state || ""
                ).trim()

            );

        }
    );

}



// ======================================================
// EMPLOYEE MATCH RULE
// ======================================================

function employeeMatchesRule(
    employee,
    rule
) {

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


    const ruleRegion =
        normalize(
            rule.region
        );


    const ruleState =
        normalize(
            rule.state
        );


    if (
        ruleRegion &&
        ruleState
    ) {

        return (

            employeeRegion ===
                ruleRegion &&

            employeeState ===
                ruleState

        );

    }


    if (
        ruleRegion
    ) {

        return (
            employeeRegion ===
            ruleRegion
        );

    }


    if (
        ruleState
    ) {

        return (
            employeeState ===
            ruleState
        );

    }


    return false;

}



// ======================================================
// GET SIDE PARTICIPANT TEACHERS
// ======================================================

function getSideParticipants(
    competition,
    side
) {

    const rules =
        getParticipantRules(
            competition,
            side
        );


    if (
        rules.length === 0
    ) {

        return [];

    }


    const teacherMap =
        new Map();


    allEmployees.forEach(
        employee => {

            const code =
                getEmployeeCode(
                    employee
                );


            if (!code) {

                return;

            }


            const matched =
                rules.some(
                    rule =>
                        employeeMatchesRule(
                            employee,
                            rule
                        )
                );


            if (matched) {

                teacherMap.set(
                    normalize(code),
                    code
                );

            }

        }
    );


    return [
        ...teacherMap.values()
    ];

}



// ======================================================
// GET LATEST ENTRIES
//
// Same Teacher + Same Date
// = Latest Entry
// ======================================================

function getLatestEntries() {

    const latestMap =
        new Map();


    allEntries.forEach(
        entry => {

            const employeeCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            const date =
                getEntryDate(
                    entry
                );


            if (
                !employeeCode ||
                !date
            ) {

                return;

            }


            const key =
                employeeCode +
                "|" +
                date;


            const existing =
                latestMap.get(
                    key
                );


            if (!existing) {

                latestMap.set(
                    key,
                    entry
                );

                return;

            }


            const currentCreated =
                getCreatedTime(
                    entry
                );


            const oldCreated =
                getCreatedTime(
                    existing
                );


            if (
                currentCreated >=
                oldCreated
            ) {

                latestMap.set(
                    key,
                    entry
                );

            }

        }
    );


    return [
        ...latestMap.values()
    ];

}



// ======================================================
// CALCULATE SIDE UNIT
//
// Competition date ke teachers ki
// latest collection calculate hogi.
//
// End Time ke baad ki entry
// result mein include nahi hogi.
//
// ======================================================

function calculateSideUnit(
    competition,
    side
) {

    const participantCodes =
        getSideParticipants(
            competition,
            side
        );


    if (
        participantCodes.length === 0
    ) {

        return 0;

    }


    const teacherSet =
        new Set(
            participantCodes.map(
                code =>
                    normalize(
                        code
                    )
            )
        );


    const competitionDate =
        String(
            competition?.date ||
            ""
        ).trim();


    if (!competitionDate) {

        return 0;

    }


    const endTimestamp =
        getCompetitionEndTimestamp(
            competition
        );


    const latestEntries =
        getLatestEntries();


    let totalAmount =
        0;


    latestEntries.forEach(
        entry => {

            const employeeCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            if (
                !teacherSet.has(
                    employeeCode
                )
            ) {

                return;

            }


            const entryDate =
                getEntryDate(
                    entry
                );


            if (
                entryDate !==
                competitionDate
            ) {

                return;

            }


            const createdTime =
                getCreatedTime(
                    entry
                );


            if (
                endTimestamp &&
                createdTime &&
                createdTime >
                    endTimestamp
            ) {

                return;

            }


            totalAmount +=
                getEntryAmount(
                    entry
                );

        }
    );


    return (
        totalAmount /
        UNIT_AMOUNT
    );

}



// ======================================================
// GET WINNER
//
// Returns:
//
// sideA
// sideB
// draw
// pending
// ======================================================

function getWinnerData(
    competition
) {

    if (
        !isCompetitionEnded(
            competition
        )
    ) {

        return {

            status:
                "pending",

            winner:
                "",

            sideAUnit:
                calculateSideUnit(
                    competition,
                    "sideA"
                ),

            sideBUnit:
                calculateSideUnit(
                    competition,
                    "sideB"
                )

        };

    }


    const sideAUnit =
        calculateSideUnit(
            competition,
            "sideA"
        );


    const sideBUnit =
        calculateSideUnit(
            competition,
            "sideB"
        );


    if (
        sideAUnit >
        sideBUnit
    ) {

        return {

            status:
                "completed",

            winner:
                "sideA",

            sideAUnit:
                sideAUnit,

            sideBUnit:
                sideBUnit

        };

    }


    if (
        sideBUnit >
        sideAUnit
    ) {

        return {

            status:
                "completed",

            winner:
                "sideB",

            sideAUnit:
                sideAUnit,

            sideBUnit:
                sideBUnit

        };

    }


    return {

        status:
            "completed",

        winner:
            "draw",

        sideAUnit:
            sideAUnit,

        sideBUnit:
            sideBUnit

    };

}



// ======================================================
// WINNER HTML
// ======================================================

function createWinnerHTML(
    competition
) {

    const result =
        getWinnerData(
            competition
        );


    if (
        result.status ===
        "pending"
    ) {

        return `

            <div class="competition-result pending">

                <i class="fa-solid fa-hourglass-half"></i>

                Competition Result
                Pending

            </div>

        `;

    }


    if (
        result.winner ===
        "draw"
    ) {

        return `

            <div class="competition-result draw">

                <i class="fa-solid fa-handshake"></i>

                Result:
                <strong>
                    Draw
                </strong>

            </div>

        `;

    }


    const winnerName =
        result.winner === "sideA"

            ? (
                competition.sideAName ||
                "Side A"
            )

            : (
                competition.sideBName ||
                "Side B"
            );


    return `

        <div class="competition-result winner">

            <i class="fa-solid fa-trophy"></i>

            Winner:

            <strong>
                ${escapeHTML(
                    winnerName
                )}
            </strong>

        </div>

    `;

}



// ======================================================
// PUBLIC VISIBILITY
//
// Existing competition ke liye agar
// publicVisible field nahi hai,
// to public maana jayega.
//
// ======================================================

function isPublicVisible(
    competition
) {

    return (
        competition.publicVisible !==
        false
    );

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


        // ==================================================
        // PUBLIC VISIBILITY
        //
        // New competition default:
        // Public par visible
        // ==================================================

        publicVisible:
            true,


        updatedAt:
            serverTimestamp()

    };


    try {

        saveCompetitionBtn.disabled =
            true;


        if (
            editingCompetitionId
        ) {

            // ==================================================
            // EXISTING COMPETITION
            //
            // IMPORTANT:
            // Edit karte waqt publicVisible ko reset nahi
            // karna hai.
            // ==================================================

            const existingCompetition =
                window.currentCompetitions?.find(
                    item =>
                        item.id ===
                        editingCompetitionId
                );


            if (
                existingCompetition &&
                existingCompetition.publicVisible ===
                false
            ) {

                competitionData.publicVisible =
                    false;

            }


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
// LOAD DAILY ENTRY
// ======================================================

async function loadDailyEntries() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    DAILY_ENTRY_COLLECTION
                )
            );


        snapshot.forEach(
            entryDoc => {

                allEntries.push({

                    id:
                        entryDoc.id,

                    source:
                        "daily_entry",

                    ...entryDoc.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "daily_entry load failed:",
            error
        );

    }

}



// ======================================================
// LOAD TEACHER ENTRIES
// ======================================================

async function loadTeacherEntries() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    TEACHER_ENTRIES_COLLECTION
                )
            );


        snapshot.forEach(
            entryDoc => {

                allEntries.push({

                    id:
                        entryDoc.id,

                    source:
                        "teacher_entries",

                    ...entryDoc.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "teacher_entries load failed:",
            error
        );

    }

}



// ======================================================
// LOAD ALL ENTRIES
// ======================================================

async function loadAllEntries() {

    allEntries =
        [];


    await loadDailyEntries();


    await loadTeacherEntries();


    console.log(
        "Competition Entries Loaded:",
        allEntries.length
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


        window.currentCompetitions =
            competitions;


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
// PUBLIC BUTTON HTML
// ======================================================

function createPublicButtonHTML(
    competition
) {

    if (
        isPublicVisible(
            competition
        )
    ) {

        return `

            <button
                class="small-btn public-btn"
                onclick="togglePublicVisibility('${competition.id}')"
            >

                <i class="fa-solid fa-eye-slash"></i>

                Hide Public

            </button>

        `;

    }


    return `

        <button
            class="small-btn public-btn"
            onclick="togglePublicVisibility('${competition.id}')"
        >

            <i class="fa-solid fa-eye"></i>

            Show Public

        </button>

    `;

}



// ======================================================
// STATUS HTML
// ======================================================

function createStatusHTML(
    competition
) {

    if (
        !isPublicVisible(
            competition
        )
    ) {

        return `

            <span class="competition-status hidden">

                <i class="fa-solid fa-eye-slash"></i>

                Hidden from Public

            </span>

        `;

    }


    if (
        isCompetitionEnded(
            competition
        )
    ) {

        return `

            <span class="competition-status completed">

                <i class="fa-solid fa-circle-check"></i>

                Completed

            </span>

        `;

    }


    return `

        <span class="competition-status active">

            <i class="fa-solid fa-circle-play"></i>

            Active

        </span>

    `;

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

                const resultHTML =
                    createWinnerHTML(
                        competition
                    );


                const statusHTML =
                    createStatusHTML(
                        competition
                    );


                const publicButtonHTML =
                    createPublicButtonHTML(
                        competition
                    );


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


                            <div
                                style="
                                    margin-top:10px;
                                    display:flex;
                                    gap:10px;
                                    flex-wrap:wrap;
                                    align-items:center;
                                "
                            >

                                ${statusHTML}

                                ${resultHTML}

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


                            ${publicButtonHTML}


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
// HIDE / SHOW PUBLIC
// ======================================================

window.togglePublicVisibility =
    async function (
        competitionId
    ) {

        const competition =
            window.currentCompetitions?.find(
                item =>
                    item.id ===
                    competitionId
            );


        if (!competition) {

            showMessage(
                "Competition nahi mila.",
                "error"
            );

            return;

        }


        const currentlyVisible =
            isPublicVisible(
                competition
            );


        const newValue =
            !currentlyVisible;


        try {

            await updateDoc(

                doc(
                    db,
                    COMPETITION_COLLECTION,
                    competitionId
                ),

                {

                    publicVisible:
                        newValue,

                    updatedAt:
                        serverTimestamp()

                }

            );


            showMessage(

                newValue

                    ? "Competition public par show ho raha hai."

                    : "Competition public se hide ho gaya."

            );


            await loadCompetitions();

        }

        catch (error) {

            console.error(
                error
            );


            showMessage(
                "Public visibility update nahi ho saki.",
                "error"
            );

        }

    };



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


async function initializeCompetitionPage() {

    await loadEmployees();

    await loadAllEntries();

    await loadCompetitions();

}


initializeCompetitionPage();



// ======================================================
// END
// ======================================================
