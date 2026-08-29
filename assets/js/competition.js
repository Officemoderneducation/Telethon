// ======================================================
// TELETHON
// PUBLIC ACADEMIC DEPARTMENT COMPETITION
//
// File:
// assets/js/competition.js
//
// PURPOSE:
//
// 1. Public competition load
// 2. Competition ID URL se read
// 3. Existing competitions collection use
// 4. Side A / Side B participants show
// 5. Selected Region / State ke all Teachers ka
//    total collection calculate
// 6. Collection Unit mein show
// 7. ₹ Amount public page par show nahi hoga
// 8. Competition Date + End Time ke according
//    entries calculate hongi
// 9. End Time ke baad competition public page par
//    show nahi hoga
//
// DATA SOURCES:
//
// OLD:
// daily_entry
//
// NEW:
// teacher_entries
//
// IMPORTANT:
//
// Firebase collection:
// competitions
//
// Unit:
// 1 Unit = ₹7000
//
// ======================================================


import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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
// UNIT
// ======================================================

const UNIT_AMOUNT =
    7000;


// ======================================================
// HTML
// ======================================================

const loadingBox =
    document.getElementById(
        "loadingBox"
    );


const errorBox =
    document.getElementById(
        "errorBox"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const emptyBox =
    document.getElementById(
        "emptyBox"
    );


const competitionList =
    document.getElementById(
        "competitionList"
    );


// ======================================================
// DATA
// ======================================================

let employees = [];

let dailyEntries = [];

let teacherEntries = [];


// ======================================================
// URL COMPETITION ID
// ======================================================

function getCompetitionId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return String(
        params.get("id") ||
        ""
    ).trim();

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
// NUMBER VALUE
// ======================================================

function numberValue(value) {

    if (
        typeof value ===
        "number"
    ) {

        return Number.isFinite(
            value
        )
            ? value
            : 0;

    }


    const cleaned =
        String(
            value ?? ""
        )
            .replace(
                /₹/g,
                ""
            )
            .replace(
                /,/g,
                ""
            )
            .replace(
                /\s/g,
                ""
            );


    const number =
        Number(
            cleaned
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


// ======================================================
// GET AMOUNT
// ======================================================

function getEntryAmount(
    entry
) {

    if (!entry) {
        return 0;
    }


    const fields = [

        "amount",

        "collection",

        "collectionAmount",

        "totalCollection",

        "total_collection",

        "collectedAmount",

        "collected_amount"

    ];


    for (
        const field
        of fields
    ) {

        if (
            entry[field] !==
            undefined &&
            entry[field] !==
            null &&
            entry[field] !==
            ""
        ) {

            return numberValue(
                entry[field]
            );

        }

    }


    return 0;

}


// ======================================================
// GET EMPLOYEE CODE
// ======================================================

function getEmployeeCode(
    employee
) {

    if (!employee) {
        return "";
    }


    const fields = [

        "employeeCode",

        "employee_code",

        "empCode",

        "emp_code",

        "employeeID",

        "employeeId",

        "userCode",

        "user_code",

        "code"

    ];


    for (
        const field
        of fields
    ) {

        const value =
            String(
                employee[field] ??
                ""
            ).trim();


        if (value) {

            return value;

        }

    }


    return "";

}


// ======================================================
// GET ENTRY EMPLOYEE CODE
// ======================================================

function getEntryEmployeeCode(
    entry
) {

    if (!entry) {
        return "";
    }


    const fields = [

        "employee_code",

        "employeeCode",

        "empCode",

        "emp_code",

        "employeeID",

        "employeeId",

        "userCode",

        "user_code",

        "teacherCode",

        "teacher_code"

    ];


    for (
        const field
        of fields
    ) {

        const value =
            String(
                entry[field] ??
                ""
            ).trim();


        if (value) {

            return value;

        }

    }


    return "";

}


// ======================================================
// GET REGION
// ======================================================

function getEmployeeRegion(
    employee
) {

    if (!employee) {
        return "";
    }


    return String(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        ""

    ).trim();

}


// ======================================================
// GET STATE
// ======================================================

function getEmployeeState(
    employee
) {

    if (!employee) {
        return "";
    }


    return String(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        ""

    ).trim();

}


// ======================================================
// GET ENTRY DATE
// ======================================================

function getEntryDate(
    entry
) {

    if (!entry) {
        return "";
    }


    const fields = [

        "date",

        "entryDate",

        "entry_date",

        "collectionDate",

        "collection_date",

        "selectedDate",

        "selected_date",

        "dailyDate",

        "daily_date"

    ];


    for (
        const field
        of fields
    ) {

        const value =
            String(
                entry[field] ??
                ""
            ).trim();


        if (value) {

            return normalizeDateString(
                value
            );

        }

    }


    return "";

}


// ======================================================
// NORMALIZE DATE STRING
// ======================================================

function normalizeDateString(
    value
) {

    const raw =
        String(
            value ?? ""
        ).trim();


    if (!raw) {
        return "";
    }


    // YYYY-MM-DD

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            raw
        )
    ) {

        return raw;

    }


    // DD-MM-YYYY

    if (
        /^\d{2}-\d{2}-\d{4}$/.test(
            raw
        )
    ) {

        const parts =
            raw.split("-");


        return (
            parts[2] +
            "-" +
            parts[1] +
            "-" +
            parts[0]
        );

    }


    // DD/MM/YYYY

    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(
            raw
        )
    ) {

        const parts =
            raw.split("/");


        return (
            parts[2] +
            "-" +
            parts[1] +
            "-" +
            parts[0]
        );

    }


    const parsed =
        new Date(
            raw
        );


    if (
        !Number.isNaN(
            parsed.getTime()
        )
    ) {

        return formatDate(
            parsed
        );

    }


    return raw;

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
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
// GET CREATED TIME
// ======================================================

function getCreatedTime(
    entry
) {

    if (!entry) {
        return 0;
    }


    const createdAt =
        entry.createdAt;


    if (!createdAt) {

        return 0;

    }


    try {

        if (
            typeof createdAt.toMillis ===
            "function"
        ) {

            return createdAt.toMillis();

        }


        if (
            typeof createdAt.toDate ===
            "function"
        ) {

            return createdAt
                .toDate()
                .getTime();

        }


        if (
            createdAt.seconds !==
            undefined
        ) {

            return (
                Number(
                    createdAt.seconds
                ) * 1000
            );

        }


        if (
            createdAt instanceof Date
        ) {

            return createdAt.getTime();

        }


        const parsed =
            new Date(
                createdAt
            );


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return parsed.getTime();

        }

    }

    catch (error) {

        console.warn(
            "Created time parse error:",
            error
        );

    }


    return 0;

}


// ======================================================
// SHOW / HIDE
// ======================================================

function showLoading() {

    if (loadingBox) {

        loadingBox.style.display =
            "block";

    }


    if (errorBox) {

        errorBox.style.display =
            "none";

    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    if (competitionList) {

        competitionList.style.display =
            "none";

    }

}


function hideLoading() {

    if (loadingBox) {

        loadingBox.style.display =
            "none";

    }

}


// ======================================================
// SHOW ERROR
// ======================================================

function showError(
    message
) {

    hideLoading();


    if (competitionList) {

        competitionList.style.display =
            "none";

    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    if (errorBox) {

        errorBox.style.display =
            "block";

    }

}


// ======================================================
// SHOW EMPTY
// ======================================================

function showEmpty() {

    hideLoading();


    if (errorBox) {

        errorBox.style.display =
            "none";

    }


    if (competitionList) {

        competitionList.style.display =
            "none";

    }


    if (emptyBox) {

        emptyBox.style.display =
            "block";

    }

}


// ======================================================
// GET COMPETITION
// ======================================================

async function loadCompetition() {

    const competitionId =
        getCompetitionId();


    if (!competitionId) {

        showError(
            "Competition link mein Competition ID nahi mili."
        );

        return null;

    }


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

            showEmpty();

            return null;

        }


        return {

            id:
                competitionSnapshot.id,

            ...competitionSnapshot.data()

        };

    }

    catch (error) {

        console.error(
            "Competition Load Error:",
            error
        );


        showError(
            "Competition load nahi ho saka."
        );


        return null;

    }

}


// ======================================================
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    const snapshot =
        await getDocs(
            collection(
                db,
                EMPLOYEES_COLLECTION
            )
        );


    employees = [];


    snapshot.forEach(
        employeeDoc => {

            employees.push({

                id:
                    employeeDoc.id,

                ...employeeDoc.data()

            });

        }
    );


    console.log(
        "Competition Employees:",
        employees.length
    );

}


// ======================================================
// LOAD DAILY ENTRY
// ======================================================

async function loadDailyEntries() {

    const snapshot =
        await getDocs(
            collection(
                db,
                DAILY_ENTRY_COLLECTION
            )
        );


    dailyEntries = [];


    snapshot.forEach(
        entryDoc => {

            dailyEntries.push({

                id:
                    entryDoc.id,

                ...entryDoc.data()

            });

        }
    );


    console.log(
        "Daily Entries:",
        dailyEntries.length
    );

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


        teacherEntries = [];


        snapshot.forEach(
            entryDoc => {

                teacherEntries.push({

                    id:
                        entryDoc.id,

                    ...entryDoc.data()

                });

            }
        );


        console.log(
            "Teacher Entries:",
            teacherEntries.length
        );

    }

    catch (error) {

        console.warn(
            "teacher_entries load failed:",
            error
        );


        teacherEntries = [];

    }

}


// ======================================================
// LOAD ALL DATA
// ======================================================

async function loadAllData() {

    await Promise.all([

        loadEmployees(),

        loadDailyEntries(),

        loadTeacherEntries()

    ]);

}


// ======================================================
// PARTICIPANT LABEL
//
// Region only:
// Kolkata Region
//
// Region + State:
// Kolkata Region / Bihar
//
// State only:
// Bihar
// ======================================================

function participantLabel(
    item
) {

    const region =
        String(
            item?.region ||
            ""
        ).trim();


    const state =
        String(
            item?.state ||
            ""
        ).trim();


    if (
        region &&
        state
    ) {

        return (
            region +
            " Region / " +
            state
        );

    }


    if (region) {

        return (
            region +
            " Region"
        );

    }


    if (state) {

        return state;

    }


    return "Participant";

}


// ======================================================
// GET PARTICIPANT EMPLOYEES
// ======================================================

function getParticipantEmployees(
    participant
) {

    const selectedRegion =
        normalize(
            participant?.region
        );


    const selectedState =
        normalize(
            participant?.state
        );


    return employees.filter(
        employee => {

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


            // ==========================================
            // Region + State
            // ==========================================

            if (
                selectedRegion &&
                selectedState
            ) {

                return (

                    employeeRegion ===
                    selectedRegion &&

                    employeeState ===
                    selectedState

                );

            }


            // ==========================================
            // Region only
            //
            // Region ke all teachers
            // ==========================================

            if (
                selectedRegion
            ) {

                return (
                    employeeRegion ===
                    selectedRegion
                );

            }


            // ==========================================
            // State only
            // ==========================================

            if (
                selectedState
            ) {

                return (
                    employeeState ===
                    selectedState
                );

            }


            return false;

        }
    );

}


// ======================================================
// COMPETITION DEADLINE
//
// Competition date + end time
// ======================================================

function getCompetitionDeadline(
    competition
) {

    const date =
        String(
            competition?.date ||
            ""
        ).trim();


    const endTime =
        String(
            competition?.endTime ||
            ""
        ).trim();


    if (
        !date ||
        !endTime
    ) {

        return null;

    }


    const parts =
        endTime.split(":");


    const hours =
        Number(
            parts[0] || 0
        );


    const minutes =
        Number(
            parts[1] || 0
        );


    const deadline =
        new Date(
            date +
            "T" +
            String(
                hours
            ).padStart(
                2,
                "0"
            ) +
            ":" +
            String(
                minutes
            ).padStart(
                2,
                "0"
            ) +
            ":59"
        );


    if (
        Number.isNaN(
            deadline.getTime()
        )
    ) {

        return null;

    }


    return deadline;

}


// ======================================================
// IS COMPETITION EXPIRED
// ======================================================

function isCompetitionExpired(
    competition
) {

    const deadline =
        getCompetitionDeadline(
            competition
        );


    if (!deadline) {

        return false;

    }


    return (
        new Date().getTime() >
        deadline.getTime()
    );

}


// ======================================================
// GET VALID ENTRIES
//
// IMPORTANT:
//
// Only competition date entries.
//
// Only entries created before/equal to
// Competition End Time.
//
// ======================================================

function getValidEntries(
    competition
) {

    const competitionDate =
        normalizeDateString(
            competition?.date
        );


    const deadline =
        getCompetitionDeadline(
            competition
        );


    if (
        !competitionDate ||
        !deadline
    ) {

        return [];

    }


    const deadlineTime =
        deadline.getTime();


    const allEntries = [

        ...dailyEntries,

        ...teacherEntries

    ];


    return allEntries.filter(
        entry => {

            // ==========================================
            // DATE CHECK
            // ==========================================

            const entryDate =
                getEntryDate(
                    entry
                );


            if (
                entryDate &&
                entryDate !==
                competitionDate
            ) {

                return false;

            }


            // ==========================================
            // CREATED TIME CHECK
            //
            // Entry ka exact save time available ho
            // to deadline ke baad ki entry reject hogi.
            // ==========================================

            const createdTime =
                getCreatedTime(
                    entry
                );


            if (
                createdTime &&
                createdTime >
                deadlineTime
            ) {

                return false;

            }


            return true;

        }
    );

}


// ======================================================
// GET COLLECTION FOR EMPLOYEE SET
// ======================================================

function getCollectionForEmployees(
    participantEmployees,
    validEntries
) {

    const employeeCodes =
        new Set();


    participantEmployees.forEach(
        employee => {

            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            if (code) {

                employeeCodes.add(
                    code
                );

            }

        }
    );


    if (
        employeeCodes.size === 0
    ) {

        return 0;

    }


    let total =
        0;


    validEntries.forEach(
        entry => {

            const entryCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            if (
                !entryCode ||
                !employeeCodes.has(
                    entryCode
                )
            ) {

                return;

            }


            total +=
                getEntryAmount(
                    entry
                );

        }
    );


    return total;

}


// ======================================================
// AMOUNT TO UNIT
// ======================================================

function amountToUnits(
    amount
) {

    return (
        numberValue(
            amount
        ) /
        UNIT_AMOUNT
    );

}


// ======================================================
// FORMAT UNIT
// ======================================================

function formatUnit(
    amount
) {

    const units =
        amountToUnits(
            amount
        );


    if (
        Number.isInteger(
            units
        )
    ) {

        return String(
            units
        );

    }


    return units.toFixed(
        2
    )
        .replace(
            /\.00$/,
            ""
        )
        .replace(
            /(\.\d)0$/,
            "$1"
        );

}


// ======================================================
// FORMAT DATE DISPLAY
// ======================================================

function formatDisplayDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const normalized =
        normalizeDateString(
            dateString
        );


    const parts =
        normalized.split("-");


    if (
        parts.length !== 3
    ) {

        return dateString;

    }


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    );

}


// ======================================================
// FORMAT END TIME
// ======================================================

function formatEndTime(
    value
) {

    const raw =
        String(
            value ||
            ""
        ).trim();


    if (!raw) {
        return "";
    }


    const parts =
        raw.split(":");


    if (
        parts.length < 2
    ) {

        return raw;

    }


    let hour =
        Number(
            parts[0]
        );


    const minute =
        String(
            parts[1]
        ).padStart(
            2,
            "0"
        );


    if (
        Number.isNaN(
            hour
        )
    ) {

        return raw;

    }


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return (
        hour +
        ":" +
        minute +
        " " +
        suffix
    );

}


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
// RENDER PARTICIPANT
// ======================================================

function renderParticipant(
    participant
) {

    const label =
        participantLabel(
            participant
        );


    return `

        <div class="participant-item">

            <div class="participant-name">

                ${escapeHTML(
                    label
                )}

            </div>

            <div class="participant-type">

                ${participant?.state
                    ? "STATE"
                    : "REGION"}

            </div>

        </div>

    `;

}


// ======================================================
// RENDER SIDE
// ======================================================

function renderSide(
    sideName,
    participants,
    totalAmount
) {

    const safeParticipants =
        Array.isArray(
            participants
        )
            ? participants
            : [];


    let participantsHTML =
        "";


    if (
        safeParticipants.length === 0
    ) {

        participantsHTML = `

            <div class="no-data">

                No participant selected

            </div>

        `;

    }

    else {

        participantsHTML =
            safeParticipants
                .map(
                    renderParticipant
                )
                .join("");

    }


    return `

        <div class="competition-side">

            <div class="side-header">

                <div class="side-title">

                    ${escapeHTML(
                        sideName
                    )}

                </div>

            </div>


            <div class="side-body">

                ${participantsHTML}


                <div class="side-total">

                    <span class="side-total-label">

                        Total Collection

                    </span>

                    <span class="side-total-value">

                        ${escapeHTML(
                            formatUnit(
                                totalAmount
                            )
                        )}

                        <span class="side-total-unit">

                            Unit

                        </span>

                    </span>

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// RENDER COMPETITION
// ======================================================

function renderCompetition(
    competition
) {

    const sideA =
        Array.isArray(
            competition?.sideA
        )
            ? competition.sideA
            : [];


    const sideB =
        Array.isArray(
            competition?.sideB
        )
            ? competition.sideB
            : [];


    const validEntries =
        getValidEntries(
            competition
        );


    // ==============================================
    // SIDE A TOTAL
    // ==============================================

    let sideATotal =
        0;


    sideA.forEach(
        participant => {

            const participantEmployees =
                getParticipantEmployees(
                    participant
                );


            sideATotal +=
                getCollectionForEmployees(
                    participantEmployees,
                    validEntries
                );

        }
    );


    // ==============================================
    // SIDE B TOTAL
    // ==============================================

    let sideBTotal =
        0;


    sideB.forEach(
        participant => {

            const participantEmployees =
                getParticipantEmployees(
                    participant
                );


            sideBTotal +=
                getCollectionForEmployees(
                    participantEmployees,
                    validEntries
                );

        }
    );


    const competitionName =
        String(
            competition?.name ||
            "Academic Department Competition"
        ).trim();


    const competitionDate =
        formatDisplayDate(
            competition?.date
        );


    const endTime =
        formatEndTime(
            competition?.endTime
        );


    competitionList.innerHTML = `

        <div class="competition-card">


            <!-- ==========================================
                 NAME
            =========================================== -->

            <div class="competition-name">

                ${escapeHTML(
                    competitionName
                )}

            </div>


            <!-- ==========================================
                 DATE
            =========================================== -->

            <div class="competition-date">

                <i class="fa-solid fa-calendar-days"></i>

                ${escapeHTML(
                    competitionDate
                )}

            </div>


            <!-- ==========================================
                 END TIME
            =========================================== -->

            <div class="competition-end">

                <span class="competition-end-label">

                    Competition End

                </span>

                <span class="competition-end-time">

                    ${escapeHTML(
                        endTime
                    )}

                </span>

            </div>


            <!-- ==========================================
                 MATCH
            =========================================== -->

            <div class="competition-match">


                <!-- ======================================
                     SIDE A
                ======================================= -->

                ${renderSide(
                    "Side A",
                    sideA,
                    sideATotal
                )}


                <!-- ======================================
                     VS
                ======================================= -->

                <div class="vs-container">

                    <div class="vs-circle">

                        VS

                    </div>

                </div>


                <!-- ======================================
                     SIDE B
                ======================================= -->

                ${renderSide(
                    "Side B",
                    sideB,
                    sideBTotal
                )}

            </div>


            <!-- ==========================================
                 FOOTER
            =========================================== -->

            <div class="competition-footer">

                Collection is calculated from entries
                received up to the competition end time.

            </div>


        </div>

    `;


    competitionList.style.display =
        "block";


    hideLoading();

}


// ======================================================
// START
// ======================================================

async function startCompetitionPage() {

    showLoading();


    try {

        // ==============================================
        // FIRST GET COMPETITION
        // ==============================================

        const competition =
            await loadCompetition();


        if (!competition) {

            return;

        }


        // ==============================================
        // CHECK END TIME
        //
        // End time ke baad public page par
        // competition show nahi hoga.
        // ==============================================

        if (
            isCompetitionExpired(
                competition
            )
        ) {

            console.log(
                "Competition expired."
            );


            showEmpty();

            return;

        }


        // ==============================================
        // LOAD DATA
        // ==============================================

        await loadAllData();


        // ==============================================
        // RENDER
        // ==============================================

        renderCompetition(
            competition
        );

    }

    catch (error) {

        console.error(
            "Competition Page Error:",
            error
        );


        showError(
            error.message ||
            "Competition page load nahi ho saka."
        );

    }

}


// ======================================================
// RUN
// ======================================================

startCompetitionPage();


// ======================================================
// END
// ======================================================
