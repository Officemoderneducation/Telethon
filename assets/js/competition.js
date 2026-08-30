// ======================================================
// TELETHON
// ACADEMIC DEPARTMENT COMPETITION
// PUBLIC DISPLAY
//
// IMPORTANT:
//
// 1. DISPLAY = AMOUNT (₹), NOT UNIT
//
// 2. Competition Date ke ALL Teachers ka total
//
// 3. daily_entry + teacher_entries dono use honge
//
// 4. Same Teacher + Same Date ki MULTIPLE entries
//    = SUM
//
// 5. Multiple rules:
//       Kolkata Region
//       Bihar State
//
//    = Kolkata Region ke ALL teachers
//      +
//      Bihar State ke ALL teachers
//
// 6. Same teacher agar dono rules me aa raha ho
//    to DOUBLE COUNT nahi hoga.
//
// 7. Sirf publicVisible !== false competitions show hongi.
//
// 8. Public page par Edit / Delete / Hide / Copy buttons
//    nahi honge.
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

let allEmployees = [];

let allEntries = [];



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
// NUMBER VALUE
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
// FORMAT AMOUNT
// ======================================================

function formatAmount(value) {

    const amount =
        numberValue(value);


    return amount.toLocaleString(
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
// SHOW ERROR
// ======================================================

function showError(
    message
) {

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

    allEntries = [];


    await loadDailyEntries();


    await loadTeacherEntries();


    console.log(
        "Competition entries:",
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

    const data =
        Array.isArray(
            competition?.[side]
        )
            ? competition[side]
            : [];


    return data.filter(
        item => {

            if (
                !item ||
                typeof item !== "object"
            ) {

                return false;

            }


            const region =
                String(
                    item.region || ""
                ).trim();


            const state =
                String(
                    item.state || ""
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
//
// IMPORTANT:
//
// Region + State selection is treated as a
// SEPARATE LOCATION RULE.
//
// Example:
//
// Kolkata Region
// Bihar State
//
// Means:
//
// employee.region == Kolkata
// OR
// employee.state == Bihar
//
// NOT:
// employee.region == Kolkata AND
// employee.state == Bihar
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


    // --------------------------------------------------
    // REGION + STATE entered in one rule
    //
    // For Competition selection, either selected
    // location should count.
    // --------------------------------------------------

    if (
        ruleRegion &&
        ruleState
    ) {

        return (

            employeeRegion ===
                ruleRegion ||

            employeeState ===
                ruleState

        );

    }


    // --------------------------------------------------
    // REGION ONLY
    // --------------------------------------------------

    if (
        ruleRegion
    ) {

        return (
            employeeRegion ===
            ruleRegion
        );

    }


    // --------------------------------------------------
    // STATE ONLY
    // --------------------------------------------------

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
// GET SIDE TEACHERS
//
// Multiple rules = OR
//
// Duplicate teacher = only once
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


    if (
        rules.length === 0
    ) {

        return new Set();

    }


    const teacherSet =
        new Set();


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
// CALCULATE SIDE AMOUNT
//
// VERY IMPORTANT:
//
// Competition date ke selected ALL teachers ki
// entries SUM hongi.
//
// Same Teacher + Same Date:
//    Entry 1 ₹500
//    Entry 2 ₹1000
//    Entry 3 ₹1500
//
// Total:
//    ₹3000
//
// Latest entry nahi li jayegi.
// ======================================================

function calculateSideAmount(
    competition,
    side
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
        String(
            competition?.date ||
            ""
        ).trim();


    if (!competitionDate) {

        return 0;

    }


    let totalAmount =
        0;


    allEntries.forEach(
        entry => {

            const employeeCode =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            if (!employeeCode) {

                return;

            }


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


            totalAmount +=
                getEntryAmount(
                    entry
                );

        }
    );


    return totalAmount;

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

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "";

    }


    const parts =
        String(
            dateValue
        ).split("-");


    if (
        parts.length !== 3
    ) {

        return dateValue;

    }


    const year =
        parts[0];


    const month =
        parts[1];


    const day =
        parts[2];


    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

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

function formatTime(
    timeValue
) {

    if (!timeValue) {

        return "";

    }


    const parts =
        String(
            timeValue
        ).split(":");


    if (
        parts.length < 2
    ) {

        return timeValue;

    }


    let hour =
        Number(parts[0]);


    const minute =
        parts[1];


    if (
        !Number.isFinite(hour)
    ) {

        return timeValue;

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
// GET COMPETITION BY URL ID
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
// LOAD ALL PUBLIC COMPETITIONS
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


            // ----------------------------------------------
            // Only public competitions
            // ----------------------------------------------

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
// CREATE TEAM SIDE HTML
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
// CREATE WINNER HTML
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


    const winnerAmount =

        winner === "sideA"

            ? sideAAmount

            : sideBAmount;


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
// CREATE COMPETITION CARD
// ======================================================

function createCompetitionCard(
    competition
) {

    const sideAAmount =
        calculateSideAmount(
            competition,
            "sideA"
        );


    const sideBAmount =
        calculateSideAmount(
            competition,
            "sideB"
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
// DISPLAY COMPETITIONS
// ======================================================

function displayCompetitions(
    competitions
) {

    hideLoading();


    if (
        errorBox
    ) {

        errorBox.style.display =
            "none";

    }


    if (
        !competitionList
    ) {

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
                        competition
                    )
            )
            .join("");

}



// ======================================================
// SORT COMPETITIONS
// ======================================================

function sortCompetitions(
    competitions
) {

    return [
        ...competitions
    ].sort(
        (
            a,
            b
        ) => {

            const dateA =
                String(
                    a.date || ""
                );


            const dateB =
                String(
                    b.date || ""
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


        // --------------------------------------------------
        // Load master data
        // --------------------------------------------------

        await loadEmployees();


        await loadAllEntries();


        // --------------------------------------------------
        // URL ID
        //
        // Example:
        //
        // competition.html?id=XXXXXXXX
        // --------------------------------------------------

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const competitionId =
            urlParams.get(
                "id"
            );


        // --------------------------------------------------
        // Specific competition
        // --------------------------------------------------

        if (
            competitionId
        ) {

            const competition =
                await loadCompetitionById(
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
                competition.publicVisible ===
                false
            ) {

                showError(
                    "Ye Competition public ke liye available nahi hai."
                );

                return;

            }


            displayCompetitions([
                competition
            ]);


            return;

        }


        // --------------------------------------------------
        // All public competitions
        // --------------------------------------------------

        const competitions =
            await loadPublicCompetitions();


        const sortedCompetitions =
            sortCompetitions(
                competitions
            );


        displayCompetitions(
            sortedCompetitions
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
