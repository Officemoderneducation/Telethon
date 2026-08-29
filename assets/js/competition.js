// ======================================================
// TELETHON
// PUBLIC ACADEMIC DEPARTMENT COMPETITION
//
// File:
// assets/js/competition.js
//
// IMPORTANT:
//
// competition-entry.html
// competition-entry.js
//
// IN FILES KO CHANGE NAHI KIYA GAYA HAI.
//
// Public Page:
//
// 1. Academic Department Competition
// 2. Competition Name
// 3. Competition Date
// 4. Competition End Time
// 5. Side A Team Name
// 6. Side B Team Name
// 7. Competition Participants
// 8. Region / State ke Teachers ka Total Unit
// 9. Amount public page par show nahi hoga
// 10. End Time ke baad competition show nahi hoga
// 11. Individual public URL support
//
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// FIREBASE COLLECTIONS
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
// HTML ELEMENTS
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

let allCompetitions = [];

let allEmployees = [];

let allEntries = [];


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
// GET EMPLOYEE CODE
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
// GET ENTRY EMPLOYEE CODE
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
// GET ENTRY AMOUNT
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
// GET ENTRY DATE
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
        const value of values
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
// GET CREATED TIME
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
// GET COMPETITION END TIMESTAMP
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
// CHECK EXPIRED
// ======================================================

function isCompetitionExpired(
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
// FORMAT DATE
// ======================================================

function formatCompetitionDate(
    value
) {

    if (!value) {

        return "";

    }


    const parts =
        String(value)
            .split("-");


    if (
        parts.length !== 3
    ) {

        return escapeHTML(
            value
        );

    }


    const year =
        Number(parts[0]);


    const month =
        Number(parts[1]);


    const day =
        Number(parts[2]);


    const date =
        new Date(
            year,
            month - 1,
            day
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(
            value
        );

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


// ======================================================
// FORMAT TIME
// ======================================================

function formatEndTime(
    value
) {

    if (!value) {

        return "";

    }


    const parts =
        String(value)
            .split(":");


    if (
        parts.length < 2
    ) {

        return escapeHTML(
            value
        );

    }


    const hour =
        Number(parts[0]);


    const minute =
        Number(parts[1]);


    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
    ) {

        return escapeHTML(
            value
        );

    }


    const date =
        new Date();


    date.setHours(
        hour,
        minute,
        0,
        0
    );


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        }
    );

}


// ======================================================
// GET SIDE DATA
//
// Firebase example:
//
// sideA: [
//
//   {
//      region: "Kolkata",
//      state: "",
//      teamName: "Kolkata"
//   }
//
// ]
//
// ======================================================

function getSideData(
    competition,
    side
) {

    const value =
        competition?.[side];


    if (
        Array.isArray(value)
    ) {

        return value;

    }


    if (
        value &&
        typeof value === "object"
    ) {

        return [
            value
        ];

    }


    return [];

}


// ======================================================
// GET ADMIN ENTERED TEAM NAME
//
// IMPORTANT:
//
// Admin ne jo Name type kiya tha
// wahi yahan show hoga.
//
// Supported:
//
// teamName
// team_name
// name
// title
//
// ======================================================

function getAdminTeamName(
    competition,
    side
) {

    // ==============================================
    // Direct Side Team Name
    // ==============================================

    const directNames = [

        competition?.[
            side + "TeamName"
        ],

        competition?.[
            side + "_teamName"
        ],

        competition?.[
            side + "Name"
        ],

        competition?.[
            side + "_name"
        ]

    ];


    for (
        const value
        of directNames
    ) {

        if (
            value !==
                undefined &&
            value !==
                null &&
            String(value).trim()
        ) {

            return String(
                value
            ).trim();

        }

    }


    // ==============================================
    // Side Array
    // ==============================================

    const sideData =
        getSideData(
            competition,
            side
        );


    for (
        const item
        of sideData
    ) {

        if (
            typeof item ===
            "string"
        ) {

            const value =
                item.trim();


            if (value) {

                return value;

            }

        }


        if (
            item &&
            typeof item ===
                "object"
        ) {

            const value =

                item.teamName ||

                item.team_name ||

                item.name ||

                item.title ||

                "";


            if (
                String(value).trim()
            ) {

                return String(
                    value
                ).trim();

            }

        }

    }


    // ==============================================
    // Fallback
    // ==============================================

    return "";

}


// ======================================================
// GET PARTICIPANT RULES
//
// Region / State data competition-entry se
// liya jayega.
//
// ======================================================

function getParticipantRules(
    competition,
    side
) {

    const sideData =
        getSideData(
            competition,
            side
        );


    return sideData
        .filter(
            item => {

                if (
                    typeof item ===
                    "string"
                ) {

                    return false;

                }


                return (
                    item &&
                    (
                        item.region ||
                        item.state
                    )
                );

            }
        );

}


// ======================================================
// CHECK EMPLOYEE MATCH
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


    // ==============================================
    // Region + State
    // ==============================================

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


    // ==============================================
    // Region only
    // ==============================================

    if (
        ruleRegion
    ) {

        return (
            employeeRegion ===
            ruleRegion
        );

    }


    // ==============================================
    // State only
    // ==============================================

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
// = latest entry
//
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
            competition.date ||
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


            // ==========================================
            // End Time ke baad ki entry include nahi
            // ==========================================

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
// CREATE SIDE HTML
// ======================================================

function createSideHTML(
    competition,
    side
) {

    const teamName =
        getAdminTeamName(
            competition,
            side
        );


    const totalUnit =
        calculateSideUnit(
            competition,
            side
        );


    return `

        <div class="competition-side">

            <div class="team-name">

                ${escapeHTML(
                    teamName
                )}

            </div>


            <div class="team-total">

                <div class="team-total-label">

                    Total Unit

                </div>


                <div class="team-total-unit">

                    ${formatUnit(
                        totalUnit
                    )}

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// CREATE PARTICIPANTS HTML
//
// IMPORTANT:
//
// "Enter Name" mein Admin ka typed Team Name
// automatically show hoga.
//
// ======================================================

function createParticipantsHTML(
    competition,
    side,
    sideLabel
) {

    const teamName =
        getAdminTeamName(
            competition,
            side
        );


    return `

        <div class="participants-box">

            <div class="participants-title">

                Competition Participants

            </div>


            <div class="participant-row">

                <span class="participant-side">

                    ${escapeHTML(
                        sideLabel
                    )}

                </span>


                <span class="participant-name">

                    ${escapeHTML(
                        teamName
                    )}

                </span>

            </div>

        </div>

    `;

}


// ======================================================
// CREATE COMPETITION CARD
// ======================================================

function createCompetitionCard(
    competition
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "competition-card";


    card.dataset.id =
        competition.id;


    const competitionName =
        String(
            competition.name ||
            ""
        ).trim();


    const date =
        formatCompetitionDate(
            competition.date
        );


    const endTime =
        formatEndTime(
            competition.endTime
        );


    const sideA =
        createSideHTML(
            competition,
            "sideA"
        );


    const sideB =
        createSideHTML(
            competition,
            "sideB"
        );


    const participantsA =
        createParticipantsHTML(
            competition,
            "sideA",
            "Side A"
        );


    const participantsB =
        createParticipantsHTML(
            competition,
            "sideB",
            "Side B"
        );


    card.innerHTML = `

        <!-- ==========================================
             TITLE
        =========================================== -->

        <div class="competition-title">

            Academic Department Competition

        </div>


        <!-- ==========================================
             COMPETITION NAME
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

            ${escapeHTML(
                date
            )}

        </div>


        <!-- ==========================================
             END TIME
        =========================================== -->

        <div class="competition-end">

            Competition End

            <strong>

                ${escapeHTML(
                    endTime
                )}

            </strong>

        </div>


        <!-- ==========================================
             COMPETITION MATCH
        =========================================== -->

        <div class="competition-match">

            ${sideA}


            <div class="vs-area">

                <div class="vs-circle">

                    VS

                </div>

            </div>


            ${sideB}

        </div>


        <!-- ==========================================
             PARTICIPANTS
        =========================================== -->

        <div class="participants-wrapper">

            ${participantsA}

            ${participantsB}

        </div>

    `;


    return card;

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


    competitionList.innerHTML =
        "";


    if (
        competitions.length === 0
    ) {

        showEmpty();

        return;

    }


    hideLoading();


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    competitions.forEach(
        competition => {

            const card =
                createCompetitionCard(
                    competition
                );


            competitionList.appendChild(
                card
            );

        }
    );

}


// ======================================================
// SHOW LOADING
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

        competitionList.innerHTML =
            "";

    }

}


// ======================================================
// HIDE LOADING
// ======================================================

function hideLoading() {

    if (loadingBox) {

        loadingBox.style.display =
            "none";

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


    if (emptyBox) {

        emptyBox.style.display =
            "block";

    }


    if (competitionList) {

        competitionList.innerHTML =
            "";

    }

}


// ======================================================
// SHOW ERROR
// ======================================================

function showError(
    message
) {

    hideLoading();


    if (errorBox) {

        errorBox.style.display =
            "block";

    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

}


// ======================================================
// GET URL ID
// ======================================================

function getCompetitionIdFromURL() {

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
// FIND COMPETITION
// ======================================================

function findCompetitionById(
    id
) {

    return allCompetitions.find(
        competition =>
            String(
                competition.id
            ) === String(id)
    );

}


// ======================================================
// GET ACTIVE COMPETITIONS
// ======================================================

function getActiveCompetitions() {

    return allCompetitions.filter(
        competition => {

            if (
                !competition.date
            ) {

                return false;

            }


            if (
                !competition.endTime
            ) {

                return false;

            }


            if (
                isCompetitionExpired(
                    competition
                )
            ) {

                return false;

            }


            const status =
                normalize(
                    competition.status
                );


            if (
                status ===
                    "deleted" ||
                status ===
                    "inactive"
            ) {

                return false;

            }


            return true;

        }
    );

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


    allEmployees = [];


    snapshot.forEach(
        doc => {

            allEmployees.push({

                id:
                    doc.id,

                ...doc.data()

            });

        }
    );


    console.log(
        "Employees Loaded:",
        allEmployees.length
    );

}


// ======================================================
// LOAD COMPETITIONS
// ======================================================

async function loadCompetitions() {

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


        allCompetitions = [];


        snapshot.forEach(
            doc => {

                allCompetitions.push({

                    id:
                        doc.id,

                    ...doc.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "Competition orderBy failed:",
            error
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    COMPETITION_COLLECTION
                )
            );


        allCompetitions = [];


        snapshot.forEach(
            doc => {

                allCompetitions.push({

                    id:
                        doc.id,

                    ...doc.data()

                });

            }
        );

    }


    console.log(
        "Competitions Loaded:",
        allCompetitions.length
    );

}


// ======================================================
// LOAD DAILY ENTRY
// ======================================================

async function loadDailyEntries() {

    try {

        const entryQuery =
            query(
                collection(
                    db,
                    DAILY_ENTRY_COLLECTION
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                entryQuery
            );


        snapshot.forEach(
            doc => {

                allEntries.push({

                    id:
                        doc.id,

                    source:
                        "daily_entry",

                    ...doc.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "Daily entry orderBy failed:",
            error
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    DAILY_ENTRY_COLLECTION
                )
            );


        snapshot.forEach(
            doc => {

                allEntries.push({

                    id:
                        doc.id,

                    source:
                        "daily_entry",

                    ...doc.data()

                });

            }
        );

    }

}


// ======================================================
// LOAD TEACHER ENTRIES
// ======================================================

async function loadTeacherEntries() {

    try {

        const entryQuery =
            query(
                collection(
                    db,
                    TEACHER_ENTRIES_COLLECTION
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                entryQuery
            );


        snapshot.forEach(
            doc => {

                allEntries.push({

                    id:
                        doc.id,

                    source:
                        "teacher_entries",

                    ...doc.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "Teacher entries orderBy failed:",
            error
        );


        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        TEACHER_ENTRIES_COLLECTION
                    )
                );


            snapshot.forEach(
                doc => {

                    allEntries.push({

                        id:
                            doc.id,

                        source:
                            "teacher_entries",

                        ...doc.data()

                    });

                }
            );

        }

        catch (secondError) {

            console.warn(
                "teacher_entries not available:",
                secondError
            );

        }

    }

}


// ======================================================
// SCHEDULE EXPIRY
// ======================================================

function scheduleCompetitionExpiry() {

    const active =
        getActiveCompetitions();


    if (
        active.length === 0
    ) {

        return;

    }


    let nearest =
        Infinity;


    active.forEach(
        competition => {

            const timestamp =
                getCompetitionEndTimestamp(
                    competition
                );


            if (
                timestamp &&
                timestamp < nearest
            ) {

                nearest =
                    timestamp;

            }

        }
    );


    if (
        nearest === Infinity
    ) {

        return;

    }


    const delay =
        Math.max(
            1000,
            nearest -
                Date.now() +
                1000
        );


    setTimeout(
        function () {

            const competitionId =
                getCompetitionIdFromURL();


            if (
                competitionId
            ) {

                const competition =
                    findCompetitionById(
                        competitionId
                    );


                if (
                    !competition ||
                    isCompetitionExpired(
                        competition
                    )
                ) {

                    showEmpty();

                    return;

                }

            }


            displayCompetitions(
                getActiveCompetitions()
            );


            scheduleCompetitionExpiry();

        },
        delay
    );

}


// ======================================================
// MAIN
// ======================================================

async function loadCompetitionPage() {

    try {

        showLoading();


        // ==============================================
        // LOAD DATA
        // ==============================================

        await loadEmployees();

        await loadCompetitions();


        allEntries = [];


        await loadDailyEntries();

        await loadTeacherEntries();


        // ==============================================
        // GET URL ID
        // ==============================================

        const competitionId =
            getCompetitionIdFromURL();


        // ==============================================
        // SINGLE COMPETITION
        // ==============================================

        if (
            competitionId
        ) {

            const competition =
                findCompetitionById(
                    competitionId
                );


            if (
                !competition
            ) {

                showError(
                    "Competition nahi mila."
                );

                return;

            }


            if (
                isCompetitionExpired(
                    competition
                )
            ) {

                showEmpty();

                return;

            }


            displayCompetitions([
                competition
            ]);


            scheduleCompetitionExpiry();

            return;

        }


        // ==============================================
        // ALL ACTIVE COMPETITIONS
        // ==============================================

        const active =
            getActiveCompetitions();


        displayCompetitions(
            active
        );


        scheduleCompetitionExpiry();

    }

    catch (error) {

        console.error(
            "Competition Page Error:",
            error
        );


        showError(
            error?.message ||
            "Competition data load nahi ho saka."
        );

    }

}


// ======================================================
// START
// ======================================================

loadCompetitionPage();


// ======================================================
// END
// ======================================================
