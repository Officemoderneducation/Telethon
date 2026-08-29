// ======================================================
// TELETHON
// PUBLIC ACADEMIC DEPARTMENT COMPETITION
//
// File:
// assets/js/competition.js
//
// PUBLIC LOGIC:
//
// 1. Academic Department Competition
// 2. Competition Name
// 3. Competition Date
// 4. Competition End Time
// 5. Side A Team Name
// 6. Side B Team Name
// 7. Side A Total Unit
// 8. Side B Total Unit
//
// IMPORTANT:
//
// 9. Amount public page par show nahi hoga.
// 10. Competition Date back date ho sakti hai.
// 11. Back-date competition public page par show hogi.
// 12. End Time sirf collection calculation ke liye use hoga.
// 13. End Time cross hone se competition automatically hide NAHI hoga.
// 14. Admin ka Hide/Show Public control final visibility decide karega.
// 15. Individual public URL support.
//
// FIREBASE COLLECTIONS:
//
// competitions
// employees
// daily_entry
// teacher_entries
//
// ======================================================


import { db } from "./firebase-config.js";


import {
    collection,
    getDocs,
    query,
    orderBy
}
from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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
//
// IMPORTANT:
//
// Ye sirf collection cutoff ke liye hai.
//
// Public visibility ke liye
// iska use nahi hota.
//
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
// GET ADMIN TEAM NAME
// ======================================================

function getAdminTeamName(
    competition,
    side
) {

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
            value !== undefined &&
            value !== null &&
            String(value).trim()
        ) {

            return String(
                value
            ).trim();

        }

    }


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


    return "";

}


// ======================================================
// GET PARTICIPANT RULES
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


    return sideData.filter(
        item => {

            if (
                !item ||
                typeof item !==
                    "object"
            ) {

                return false;

            }


            return (

                String(
                    item.region ||
                    ""
                ).trim() ||

                String(
                    item.state ||
                    ""
                ).trim()

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
// IMPORTANT:
//
// End Time sirf cutoff hai.
// Public visibility ka isse koi relation nahi.
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


            // ==================================================
            // END TIME CUTOFF
            //
            // End Time ke baad ki entry
            // total mein include nahi hogi.
            //
            // IMPORTANT:
            //
            // Ye competition ko hide nahi karta.
            //
            // ==================================================

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


    card.innerHTML = `

        <div class="competition-name">

            ${escapeHTML(
                competitionName
            )}

        </div>


        <div class="competition-date">

            ${escapeHTML(
                date
            )}

        </div>


        <div class="competition-end">

            Competition End

            <strong>

                ${escapeHTML(
                    endTime
                )}

            </strong>

        </div>


        <div class="competition-match">

            ${sideA}


            <div class="vs-area">

                <div class="vs-circle">

                    VS

                </div>

            </div>


            ${sideB}

        </div>

    `;


    return card;

}


// ======================================================
// PUBLIC VISIBILITY
//
// ONLY ADMIN HIDE/SHOW DECIDES PUBLIC VISIBILITY.
//
// Supported:
//
// hidePublic === true
// publicVisible === false
// isPublic === false
// publicStatus === hidden/hide
//
// ======================================================

function isCompetitionHiddenFromPublic(
    competition
) {

    if (
        competition?.hidePublic === true
    ) {

        return true;

    }


    if (
        normalize(
            competition?.hidePublic
        ) === "true"
    ) {

        return true;

    }


    if (
        competition?.publicVisible === false
    ) {

        return true;

    }


    if (
        normalize(
            competition?.publicVisible
        ) === "false"
    ) {

        return true;

    }


    if (
        competition?.isPublic === false
    ) {

        return true;

    }


    if (
        normalize(
            competition?.isPublic
        ) === "false"
    ) {

        return true;

    }


    const publicStatus =
        normalize(
            competition?.publicStatus
        );


    if (
        publicStatus === "hidden" ||
        publicStatus === "hide"
    ) {

        return true;

    }


    return false;

}


// ======================================================
// CHECK PUBLIC COMPETITION
//
// IMPORTANT:
//
// NO EXPIRY CHECK.
//
// Back date = SHOW
// Current date = SHOW
// End time crossed = SHOW
//
// Only Admin Hide Public = HIDE
//
// ======================================================

function isPublicCompetition(
    competition
) {

    if (!competition) {

        return false;

    }


    // ==================================================
    // DATE REQUIRED
    // ==================================================

    if (
        !competition.date
    ) {

        return false;

    }


    // ==================================================
    // END TIME REQUIRED
    // ==================================================

    if (
        !competition.endTime
    ) {

        return false;

    }


    // ==================================================
    // STATUS
    // ==================================================

    const status =
        normalize(
            competition.status
        );


    if (
        status === "deleted" ||
        status === "inactive"
    ) {

        return false;

    }


    // ==================================================
    // ADMIN HIDE PUBLIC
    // ==================================================

    if (
        isCompetitionHiddenFromPublic(
            competition
        )
    ) {

        return false;

    }


    // ==================================================
    // IMPORTANT
    //
    // YAHAN KOI DATE CHECK NAHI HAI.
    //
    // YAHAN KOI END TIME CHECK NAHI HAI.
    //
    // Isliye competition automatically
    // expire/hide nahi hogi.
    //
    // ==================================================

    return true;

}


// ======================================================
// GET PUBLIC COMPETITIONS
// ======================================================

function getPublicCompetitions() {

    return allCompetitions.filter(
        competition =>
            isPublicCompetition(
                competition
            )
    );

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


    hideLoading();


    if (
        competitions.length === 0
    ) {

        showEmpty();

        return;

    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    if (errorBox) {

        errorBox.style.display =
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


    if (competitionList) {

        competitionList.innerHTML =
            "";

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
            ) ===
            String(id)
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
        employeeDoc => {

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
            competitionDoc => {

                allCompetitions.push({

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

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
            competitionDoc => {

                allCompetitions.push({

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

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

        catch (secondError) {

            console.warn(
                "teacher_entries not available:",
                secondError
            );

        }

    }

}


// ======================================================
// MAIN
// ======================================================

async function loadCompetitionPage() {

    try {

        showLoading();


        // ==================================================
        // LOAD EMPLOYEES
        // ==================================================

        await loadEmployees();


        // ==================================================
        // LOAD COMPETITIONS
        // ==================================================

        await loadCompetitions();


        // ==================================================
        // CLEAR ENTRIES
        // ==================================================

        allEntries = [];


        // ==================================================
        // LOAD OLD ENTRIES
        // ==================================================

        await loadDailyEntries();


        // ==================================================
        // LOAD NEW ENTRIES
        // ==================================================

        await loadTeacherEntries();


        // ==================================================
        // URL ID
        // ==================================================

        const competitionId =
            getCompetitionIdFromURL();


        // ==================================================
        // SINGLE COMPETITION
        //
        // competition.html?id=XXXX
        // ==================================================

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


            // ==================================================
            // ONLY ADMIN HIDE CHECK
            //
            // NO EXPIRY CHECK
            // ==================================================

            if (
                !isPublicCompetition(
                    competition
                )
            ) {

                showEmpty();

                return;

            }


            displayCompetitions([
                competition
            ]);


            return;

        }


        // ==================================================
        // ALL PUBLIC COMPETITIONS
        //
        // Back date SHOW
        // End time cross SHOW
        // Admin Hide = HIDE
        // ==================================================

        const publicCompetitions =
            getPublicCompetitions();


        displayCompetitions(
            publicCompetitions
        );

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
