// ======================================================
// TELETHON
// ACADEMIC DEPARTMENT COMPETITION
// PUBLIC DISPLAY
//
// CORRECTED VERSION
//
// 1. DISPLAY = AMOUNT (₹)
// 2. daily_entry + teacher_entries
// 3. Same Teacher + Same Date = SUM
// 4. Multiple participant rules = OR
// 5. Same teacher in multiple rules = COUNT ONCE
// 6. Competition date = normalized date
// 7. publicVisible !== false only
// 8. No Edit / Delete / Hide / Copy
// ======================================================


import {
    db
} from "./firebase-config.js";


import {
    collection,
    getDocs,
    doc,
    getDoc
} from
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
// ELEMENTS
// ======================================================

const loadingBox =
    document.getElementById("loadingBox");

const errorBox =
    document.getElementById("errorBox");

const errorMessage =
    document.getElementById("errorMessage");

const emptyBox =
    document.getElementById("emptyBox");

const competitionList =
    document.getElementById("competitionList");


// ======================================================
// DATA
// ======================================================

let allEmployees = [];

let allEntries = [];


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// NORMALIZE
// ======================================================

function normalize(value) {

    return String(value ?? "")
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
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .trim();


    const number =
        Number(cleaned);


    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================================
// FORMAT AMOUNT
// ======================================================

function formatAmount(value) {

    return numberValue(value)
        .toLocaleString(
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

function getEmployeeCode(employee) {

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

function getEntryEmployeeCode(entry) {

    return String(

        entry.employeeCode ||

        entry.employee_code ||

        entry.empCode ||

        entry.emp_code ||

        entry.employeeID ||

        entry.employeeId ||

        entry.userCode ||

        entry.user_code ||

        entry.emp_id ||

        entry.employee ||

        entry.teacherCode ||

        entry.teacher_code ||

        ""

    ).trim();

}


// ======================================================
// GET ENTRY AMOUNT
// ======================================================

function getEntryAmount(entry) {

    return numberValue(

        entry.amount ??

        entry.collection ??

        entry.collectionAmount ??

        entry.totalCollection ??

        entry.total_collection ??

        entry.collectedAmount ??

        entry.collected_amount ??

        0

    );

}


// ======================================================
// FORMAT DATE OBJECT
// ======================================================

function formatDateForInput(date) {

    if (!date) {
        return "";
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


// ======================================================
// NORMALIZE DATE
//
// IMPORTANT:
// Daily Report ke saath same date handling.
// ======================================================

function normalizeDate(value) {

    if (!value) {
        return "";
    }


    // Firestore Timestamp

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return formatDateForInput(
            value.toDate()
        );

    }


    // Firestore timestamp object

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return formatDateForInput(
            new Date(
                Number(value.seconds) * 1000
            )
        );

    }


    const text =
        String(value).trim();


    // YYYY-MM-DD

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(text)
    ) {

        return text;

    }


    // DD-MM-YYYY

    let match =
        text.match(
            /^(\d{2})-(\d{2})-(\d{4})$/
        );


    if (match) {

        return (
            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]
        );

    }


    // DD/MM/YYYY

    match =
        text.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


    if (match) {

        return (
            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]
        );

    }


    // MM/DD/YYYY

    match =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (match) {

        const first =
            Number(match[1]);

        const second =
            Number(match[2]);

        const year =
            Number(match[3]);


        // If first > 12 => DD/MM/YYYY

        if (first > 12) {

            return (
                year +
                "-" +
                String(second)
                    .padStart(2, "0") +
                "-" +
                String(first)
                    .padStart(2, "0")
            );

        }


        // Otherwise keep MM/DD/YYYY

        return (
            year +
            "-" +
            String(first)
                .padStart(2, "0") +
            "-" +
            String(second)
                .padStart(2, "0")
        );

    }


    // Date fallback

    const parsed =
        new Date(text);


    if (
        !Number.isNaN(
            parsed.getTime()
        )
    ) {

        return formatDateForInput(
            parsed
        );

    }


    return "";

}


// ======================================================
// GET ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    const possibleValues = [

        entry.date,

        entry.entryDate,

        entry.entry_date,

        entry.collectionDate,

        entry.collection_date,

        entry.selectedDate,

        entry.selected_date,

        entry.dailyDate,

        entry.daily_date,

        entry.collection_date_value,

        entry.createdDate,

        entry.created_date

    ];


    for (
        const value
        of possibleValues
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            continue;

        }


        const date =
            normalizeDate(value);


        if (date) {

            return date;

        }

    }


    return "";

}


// ======================================================
// GET EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

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

function getEmployeeState(employee) {

    return String(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        ""

    ).trim();

}


// ======================================================
// SHOW ERROR
// ======================================================

function showError(message) {

    if (loadingBox) {

        loadingBox.style.display =
            "none";

    }


    if (competitionList) {

        competitionList.innerHTML =
            "";

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
// HIDE LOADING
// ======================================================

function hideLoading() {

    if (loadingBox) {

        loadingBox.style.display =
            "none";

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


    console.log(
        "daily_entry:",
        snapshot.size
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


        console.log(
            "teacher_entries:",
            snapshot.size
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

    allEntries = [];


    await loadDailyEntries();


    await loadTeacherEntries();


    console.log(
        "Combined Competition Entries:",
        allEntries.length
    );

}


// ======================================================
// GET PARTICIPANT RULES
// ======================================================

function getParticipantRules(
    competition,
    side
) {

    const rules =
        Array.isArray(
            competition?.[side]
        )
            ? competition[side]
            : [];


    return rules.filter(
        rule => {

            if (
                !rule ||
                typeof rule !== "object"
            ) {

                return false;

            }


            const region =
                String(
                    rule.region || ""
                ).trim();


            const state =
                String(
                    rule.state || ""
                ).trim();


            return (
                region ||
                state
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
            rule?.region
        );


    const ruleState =
        normalize(
            rule?.state
        );


    // Region + State

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


    // Region only

    if (ruleRegion) {

        return (
            employeeRegion ===
            ruleRegion
        );

    }


    // State only

    if (ruleState) {

        return (
            employeeState ===
            ruleState
        );

    }


    return false;

}


// ======================================================
// GET SIDE TEACHER CODES
//
// IMPORTANT:
//
// Multiple rules = OR
//
// Same teacher in multiple rules = ONE teacher
// ======================================================

function getSideTeacherCodes(
    competition,
    side
) {

    const rules =
        getParticipantRules(
            competition,
            side
        );


    const teacherSet =
        new Set();


    if (
        rules.length === 0
    ) {

        return teacherSet;

    }


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

                teacherSet.add(
                    normalize(code)
                );

            }

        }
    );


    return teacherSet;

}


// ======================================================
// BUILD TEACHER + DATE TOTAL MAP
//
// IMPORTANT FIX:
//
// Pehle har entry direct competition total me add
// ho rahi thi.
//
// Ab pehle:
//
// Teacher + Date
//
// ka total banega.
//
// Example:
//
// T001 | 30 Aug | ₹5000
// T001 | 30 Aug | ₹7000
//
// T001 + 30 Aug = ₹12000
//
// Phir competition side total me add hoga.
//
// Isse calculation Daily Report ke same structure
// par rahega.
// ======================================================

function buildTeacherDateMap() {

    const map =
        new Map();


    allEntries.forEach(
        entry => {

            const code =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            if (!code) {
                return;
            }


            const date =
                getEntryDate(
                    entry
                );


            if (!date) {
                return;
            }


            const key =
                code +
                "|" +
                date;


            const amount =
                getEntryAmount(
                    entry
                );


            const existing =
                map.get(key) || 0;


            map.set(
                key,
                existing + amount
            );

        }
    );


    console.log(
        "Teacher + Date Total Map:",
        map
    );


    return map;

}


// ======================================================
// CALCULATE SIDE AMOUNT
//
// Competition date ke teachers ki
// Teacher + Date SUM li jayegi.
//
// ======================================================

function calculateSideAmount(
    competition,
    side,
    teacherDateMap
) {

    const teacherSet =
        getSideTeacherCodes(
            competition,
            side
        );


    if (
        teacherSet.size === 0
    ) {

        return 0;

    }


    const competitionDate =
        normalizeDate(
            competition?.date
        );


    if (!competitionDate) {

        return 0;

    }


    let total =
        0;


    teacherSet.forEach(
        employeeCode => {

            const key =
                employeeCode +
                "|" +
                competitionDate;


            const amount =
                teacherDateMap.get(
                    key
                ) || 0;


            total +=
                numberValue(
                    amount
                );

        }
    );


    return total;

}


// ======================================================
// GET WINNER
// ======================================================

function getWinnerData(
    competition,
    sideAAmount,
    sideBAmount
) {

    const sideA =
        numberValue(
            sideAAmount
        );


    const sideB =
        numberValue(
            sideBAmount
        );


    if (
        sideA === sideB
    ) {

        return "draw";

    }


    if (
        sideA > sideB
    ) {

        return "sideA";

    }


    return "sideB";

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(dateValue) {

    const normalized =
        normalizeDate(
            dateValue
        );


    if (!normalized) {

        return "";

    }


    const parts =
        normalized.split("-");


    if (
        parts.length !== 3
    ) {

        return normalized;

    }


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return normalized;

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

function formatTime(timeValue) {

    if (!timeValue) {

        return "";

    }


    const text =
        String(timeValue)
            .trim();


    const parts =
        text.split(":");


    if (
        parts.length < 2
    ) {

        return text;

    }


    let hour =
        Number(parts[0]);


    const minute =
        String(parts[1])
            .padStart(2, "0");


    if (
        !Number.isFinite(hour)
    ) {

        return text;

    }


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return (
        String(hour)
            .padStart(2, "0") +
        ":" +
        minute +
        " " +
        suffix
    );

}


// ======================================================
// END TIMESTAMP
// ======================================================

function getCompetitionEndTimestamp(
    competition
) {

    const date =
        normalizeDate(
            competition?.date
        );


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
// IS ENDED
// ======================================================

function isCompetitionEnded(
    competition
) {

    const timestamp =
        getCompetitionEndTimestamp(
            competition
        );


    if (!timestamp) {

        return false;

    }


    return Date.now() >
        timestamp;

}


// ======================================================
// LOAD COMPETITION BY ID
// ======================================================

async function loadCompetitionById(
    competitionId
) {

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


    if (
        !snapshot.exists()
    ) {

        return null;

    }


    return {

        id:
            snapshot.id,

        ...snapshot.data()

    };

}


// ======================================================
// LOAD PUBLIC COMPETITIONS
// ======================================================

async function loadPublicCompetitions() {

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

            const competition = {

                id:
                    competitionDoc.id,

                ...competitionDoc.data()

            };


            if (
                competition.publicVisible ===
                false
            ) {

                return;

            }


            competitions.push(
                competition
            );

        }
    );


    return competitions;

}


// ======================================================
// CREATE TEAM HTML
// ======================================================

function createTeamHTML(
    competition,
    side,
    amount
) {

    const teamName =

        side === "sideA"

            ? (
                competition.sideAName ||
                "Participant A"
            )

            : (
                competition.sideBName ||
                "Participant B"
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

                    Total Amount

                </div>


                <div class="team-total-unit">

                    ₹${formatAmount(
                        amount
                    )}

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// WINNER HTML
// ======================================================

function createWinnerHTML(
    competition,
    sideAAmount,
    sideBAmount
) {

    if (
        !isCompetitionEnded(
            competition
        )
    ) {

        return "";

    }


    const winner =
        getWinnerData(
            competition,
            sideAAmount,
            sideBAmount
        );


    if (
        winner === "draw"
    ) {

        return `

            <div class="winner-appreciation">

                <div class="winner-appreciation-title">

                    Competition Result

                </div>


                <div class="winner-teacher-name">

                    Draw

                </div>


                <div class="winner-appreciation-text">

                    Dono participants ka total amount barabar raha.

                </div>


                <div class="winner-appreciation-blessing">

                    Allah Ta'ala sabhi participants ki
                    mehnat ko qubool farmaye.

                </div>

            </div>

        `;

    }


    const winnerName =

        winner === "sideA"

            ? (
                competition.sideAName ||
                "Participant A"
            )

            : (
                competition.sideBName ||
                "Participant B"
            );


    return `

        <div class="winner-appreciation">

            <div class="winner-appreciation-title">

                🏆 Congratulations to the Winning Team! 🎉

            </div>


            <div class="winner-teacher-name">

                ${escapeHTML(
                    winnerName
                )}

            </div>


            <div class="winner-appreciation-text">

                Excellent teamwork and outstanding effort!

            </div>


            <div class="winner-appreciation-blessing">

                May Allah bless your efforts and give you
                even greater success.

            </div>

        </div>

    `;

}


// ======================================================
// CREATE CARD
// ======================================================

function createCompetitionCard(
    competition,
    teacherDateMap
) {

    const sideAAmount =
        calculateSideAmount(
            competition,
            "sideA",
            teacherDateMap
        );


    const sideBAmount =
        calculateSideAmount(
            competition,
            "sideB",
            teacherDateMap
        );


    console.log(
        "Competition:",
        competition.name,
        "Date:",
        normalizeDate(
            competition.date
        ),
        "Side A:",
        sideAAmount,
        "Side B:",
        sideBAmount
    );


    const winnerHTML =
        createWinnerHTML(
            competition,
            sideAAmount,
            sideBAmount
        );


    return `

        <article class="competition-card">

            <div class="competition-name">

                ${escapeHTML(
                    competition.name ||
                    "Academic Department Competition"
                )}

            </div>


            <div class="competition-date">

                ${escapeHTML(
                    formatDate(
                        competition.date
                    )
                )}

            </div>


            <div class="competition-end">

                Competition End:

                <strong>

                    ${escapeHTML(
                        formatTime(
                            competition.endTime
                        )
                    )}

                </strong>

            </div>


            <div class="competition-match">


                ${createTeamHTML(
                    competition,
                    "sideA",
                    sideAAmount
                )}


                <div class="vs-area">

                    <div class="vs-circle">

                        VS

                    </div>

                </div>


                ${createTeamHTML(
                    competition,
                    "sideB",
                    sideBAmount
                )}


            </div>


            ${winnerHTML}

        </article>

    `;

}


// ======================================================
// DISPLAY
// ======================================================

function displayCompetitions(
    competitions,
    teacherDateMap
) {

    hideLoading();


    if (errorBox) {

        errorBox.style.display =
            "none";

    }


    if (!competitionList) {

        return;

    }


    if (
        !competitions ||
        competitions.length === 0
    ) {

        competitionList.innerHTML =
            "";


        if (emptyBox) {

            emptyBox.style.display =
                "block";

        }


        return;

    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    competitionList.innerHTML =

        competitions
            .map(
                competition =>
                    createCompetitionCard(
                        competition,
                        teacherDateMap
                    )
            )
            .join("");

}


// ======================================================
// SORT
// ======================================================

function sortCompetitions(
    competitions
) {

    return [
        ...competitions
    ].sort(
        (a, b) => {

            const dateA =
                normalizeDate(
                    a.date
                );


            const dateB =
                normalizeDate(
                    b.date
                );


            if (
                dateA !== dateB
            ) {

                return dateB.localeCompare(
                    dateA
                );

            }


            const timeA =
                String(
                    a.endTime || ""
                );


            const timeB =
                String(
                    b.endTime || ""
                );


            return timeA.localeCompare(
                timeB
            );

        }
    );

}


// ======================================================
// INITIALIZE
// ======================================================

async function initializeCompetitionPage() {

    try {

        if (loadingBox) {

            loadingBox.style.display =
                "block";

        }


        if (emptyBox) {

            emptyBox.style.display =
                "none";

        }


        if (errorBox) {

            errorBox.style.display =
                "none";

        }


        // ==============================================
        // LOAD EMPLOYEES
        // ==============================================

        await loadEmployees();


        // ==============================================
        // LOAD ENTRIES
        // ==============================================

        await loadAllEntries();


        // ==============================================
        // BUILD COMMON MAP
        //
        // IMPORTANT:
        // Ye ek baar banega aur sab competitions
        // isi map se calculate honge.
        // ==============================================

        const teacherDateMap =
            buildTeacherDateMap();


        // ==============================================
        // URL ID
        // ==============================================

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const competitionId =
            urlParams.get("id");


        // ==============================================
        // SPECIFIC COMPETITION
        // ==============================================

        if (
            competitionId
        ) {

            const competition =
                await loadCompetitionById(
                    competitionId
                );


            if (!competition) {

                showError(
                    "Competition nahi mila."
                );

                return;

            }


            if (
                competition.publicVisible ===
                false
            ) {

                showError(
                    "Ye Competition public ke liye available nahi hai."
                );

                return;

            }


            displayCompetitions(
                [competition],
                teacherDateMap
            );


            return;

        }


        // ==============================================
        // ALL PUBLIC COMPETITIONS
        // ==============================================

        const competitions =
            await loadPublicCompetitions();


        const sortedCompetitions =
            sortCompetitions(
                competitions
            );


        displayCompetitions(
            sortedCompetitions,
            teacherDateMap
        );

    }

    catch (error) {

        console.error(
            "Competition page error:",
            error
        );


        showError(
            "Competition data load nahi ho saka."
        );

    }

}


// ======================================================
// START
// ======================================================

initializeCompetitionPage();


// ======================================================
// END
// ======================================================
