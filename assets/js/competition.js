// ======================================================
// TELETHON
// ACADEMIC DEPARTMENT COMPETITION
// PUBLIC COMPETITION PAGE
//
// DATA SOURCE:
// daily_entry
// teacher_entries
//
// CALCULATION:
// Selected Competition Date
// Region = All Teachers of that Region
// State  = All Teachers of that State
//
// Example:
//
// Kolkata Region
//      +
// Bihar State
//      =
// Kolkata ke All Teachers Total
//      +
// Bihar State ke All Teachers Total
//
// IMPORTANT:
// Same Teacher + Same Date
// = ALL ENTRIES SUM
//
// ======================================================


import {
    db
} from "./firebase-config.js";


import {
    collection,
    getDocs
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
// UNIT AMOUNT
// ======================================================

const UNIT_AMOUNT =
    7000;



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

let allCompetitions = [];



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
// NUMBER VALUE
// ======================================================

function numberValue(
    value
) {

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

        return Number.isFinite(
            value
        )
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
// FORMAT UNIT
// ======================================================

function formatUnit(
    value
) {

    const units =
        numberValue(
            value
        );


    if (
        Number.isInteger(
            units
        )
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
// SHOW ERROR
// ======================================================

function showError(
    message
) {

    if (
        errorMessage
    ) {

        errorMessage.textContent =
            message;

    }


    if (
        errorBox
    ) {

        errorBox.style.display =
            "block";

    }

}



// ======================================================
// HIDE LOADING
// ======================================================

function hideLoading() {

    if (
        loadingBox
    ) {

        loadingBox.style.display =
            "none";

    }

}



// ======================================================
// EMPLOYEE CODE
// ======================================================

function getEmployeeCode(
    employee
) {

    return String(

        employee?.employeeCode ||

        employee?.employee_code ||

        employee?.empCode ||

        employee?.emp_code ||

        employee?.employeeID ||

        employee?.employeeId ||

        employee?.userCode ||

        employee?.user_code ||

        employee?.id ||

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

        entry?.employee_code ||

        entry?.employeeCode ||

        entry?.empCode ||

        entry?.emp_code ||

        entry?.employeeID ||

        entry?.employeeId ||

        entry?.userCode ||

        entry?.user_code ||

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

        entry?.amount ??

        entry?.collection ??

        entry?.collectionAmount ??

        entry?.totalCollection ??

        entry?.total_collection ??

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

        entry?.date,

        entry?.entryDate,

        entry?.entry_date,

        entry?.collectionDate,

        entry?.collection_date,

        entry?.selectedDate,

        entry?.selected_date,

        entry?.dailyDate,

        entry?.daily_date

    ];


    for (
        const value
        of values
    ) {

        if (
            !value
        ) {

            continue;

        }


        const text =
            String(
                value
            ).trim();


        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(
                    text
                )
        ) {

            return text;

        }


        // ------------------------------------------
        // Handle Timestamp / Date string
        // ------------------------------------------

        const parsed =
            new Date(
                text
            );


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            const year =
                parsed.getFullYear();


            const month =
                String(
                    parsed.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            const day =
                String(
                    parsed.getDate()
                ).padStart(
                    2,
                    "0"
                );


            return (
                `${year}-${month}-${day}`
            );

        }

    }


    return "";

}



// ======================================================
// EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(
    employee
) {

    return String(

        employee?.region ||

        employee?.regionName ||

        employee?.region_name ||

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

        employee?.state ||

        employee?.stateName ||

        employee?.state_name ||

        ""

    ).trim();

}



// ======================================================
// CREATED TIME
// ======================================================

function getCreatedTime(
    entry
) {

    const value =
        entry?.createdAt;


    if (
        !value
    ) {

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


        const parsed =
            new Date(
                value
            );


        const time =
            parsed.getTime();


        return Number.isFinite(
            time
        )
            ? time
            : 0;

    }

    catch {

        return 0;

    }

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

    const endTimestamp =
        getCompetitionEndTimestamp(
            competition
        );


    if (
        !endTimestamp
    ) {

        return false;

    }


    return Date.now() >=
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


            const region =
                String(
                    item.region ||
                    ""
                ).trim();


            const state =
                String(
                    item.state ||
                    ""
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
// REGION + STATE:
// Same Region AND Same State
//
// ONLY REGION:
// All Teachers of Region
//
// ONLY STATE:
// All Teachers of State
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


    // ------------------------------------------
    // Region + State
    // ------------------------------------------

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


    // ------------------------------------------
    // Region ONLY
    //
    // ALL teachers of that Region
    // ------------------------------------------

    if (
        ruleRegion
    ) {

        return (
            employeeRegion ===
            ruleRegion
        );

    }


    // ------------------------------------------
    // State ONLY
    //
    // ALL teachers of that State
    // ------------------------------------------

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
// IMPORTANT:
//
// Multiple rows are treated as OR.
//
// Example:
//
// Kolkata Region
// Bihar State
//
// Result:
//
// Kolkata ke ALL teachers
// +
// Bihar State ke ALL teachers
//
// Duplicate teacher only counted ONCE.
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


            if (
                !code
            ) {

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


            if (
                matched
            ) {

                teacherMap.set(

                    normalize(
                        code
                    ),

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
// CALCULATE SIDE AMOUNT
//
// THIS IS THE IMPORTANT FIX.
//
// Daily Report style:
//
// Same Teacher + Same Date
// = ALL entries SUM
//
// NOT latest entry.
//
// Example:
//
// Kolkata Teacher T001
// 5000 + 2000 = 7000
//
// Bihar Teacher T002
// 3000 + 4000 = 7000
//
// Total = 14000
// Units = 2
// ======================================================

function calculateSideAmount(
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


    if (
        !competitionDate
    ) {

        return 0;

    }


    let totalAmount =
        0;


    // --------------------------------------------------
    // ALL ENTRIES
    // Selected date only
    // --------------------------------------------------

    allEntries.forEach(
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


            totalAmount +=
                getEntryAmount(
                    entry
                );

        }
    );


    return totalAmount;

}



// ======================================================
// CALCULATE SIDE UNIT
// ======================================================

function calculateSideUnit(
    competition,
    side
) {

    const amount =
        calculateSideAmount(
            competition,
            side
        );


    return (
        amount /
        UNIT_AMOUNT
    );

}



// ======================================================
// WINNER DATA
// ======================================================

function getWinnerData(
    competition
) {

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


    // ------------------------------------------
    // Competition still running
    // ------------------------------------------

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
                sideAUnit,

            sideBUnit:
                sideBUnit

        };

    }


    // ------------------------------------------
    // Side A winner
    // ------------------------------------------

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


    // ------------------------------------------
    // Side B winner
    // ------------------------------------------

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


    // ------------------------------------------
    // Draw
    // ------------------------------------------

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


    // ------------------------------------------
    // PENDING
    // ------------------------------------------

    if (
        result.status ===
        "pending"
    ) {

        return `

            <div class="winner-appreciation">

                <div class="winner-appreciation-title">

                    <i class="fa-solid fa-hourglass-half"></i>

                    Competition Result Pending

                </div>

                <div class="winner-appreciation-text">

                    Competition end hone ke baad
                    winner announce hoga.

                </div>

            </div>

        `;

    }


    // ------------------------------------------
    // DRAW
    // ------------------------------------------

    if (
        result.winner ===
        "draw"
    ) {

        return `

            <div class="winner-appreciation">

                <div class="winner-appreciation-title">

                    <i class="fa-solid fa-handshake"></i>

                    Competition Result

                </div>

                <div class="winner-teacher-name">

                    Draw

                </div>

                <div class="winner-appreciation-text">

                    Dono participants ka score equal hai.

                </div>

                <div class="winner-appreciation-blessing">

                    Allah Ta'ala sabhi participants ko
                    mazeed kamyabi ata farmaye.

                </div>

            </div>

        `;

    }


    // ------------------------------------------
    // WINNER
    // ------------------------------------------

    const winnerName =
        result.winner ===
        "sideA"

            ? (
                competition.sideAName ||
                "Side A"
            )

            : (
                competition.sideBName ||
                "Side B"
            );


    return `

        <div class="winner-appreciation">

            <div class="winner-appreciation-title">

                <i class="fa-solid fa-trophy"></i>

                Competition Winner

            </div>


            <div class="winner-teacher-name">

                ${escapeHTML(
                    winnerName
                )}

            </div>


            <div class="winner-appreciation-text">

                Mubarak ho!

            </div>


            <div class="winner-appreciation-blessing">

                Allah Ta'ala is kamyabi ko
                qabool farmaye aur mazeed
                taraqqi ata farmaye.

            </div>

        </div>

    `;

}



// ======================================================
// FORMAT DATE
// ======================================================

function formatCompetitionDate(
    date
) {

    if (
        !date
    ) {

        return "";

    }


    const parts =
        String(
            date
        ).split(
            "-"
        );


    if (
        parts.length !== 3
    ) {

        return date;

    }


    const year =
        parts[0];


    const month =
        parts[1];


    const day =
        parts[2];


    const dateObject =
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );


    if (
        Number.isNaN(
            dateObject.getTime()
        )
    ) {

        return date;

    }


    return dateObject.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}



// ======================================================
// SIDE CARD HTML
// ======================================================

function createSideHTML(
    competition,
    side
) {

    const isSideA =
        side === "sideA";


    const teamName =
        isSideA

            ? (
                competition.sideAName ||
                "Participant A"
            )

            : (
                competition.sideBName ||
                "Participant B"
            );


    const units =
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

                    Total Collection

                </div>


                <div class="team-total-unit">

                    ${formatUnit(
                        units
                    )}

                    Unit

                </div>

            </div>

        </div>

    `;

}



// ======================================================
// COMPETITION CARD
//
// IMPORTANT:
// These classes EXACTLY match
// competition.html CSS.
// ======================================================

function createCompetitionCard(
    competition
) {

    const sideAHTML =
        createSideHTML(
            competition,
            "sideA"
        );


    const sideBHTML =
        createSideHTML(
            competition,
            "sideB"
        );


    const winnerHTML =
        createWinnerHTML(
            competition
        );


    return `

        <article class="competition-card">


            <!-- ==========================================
                 COMPETITION NAME
            =========================================== -->

            <div class="competition-name">

                ${escapeHTML(
                    competition.name ||
                    "Academic Department Competition"
                )}

            </div>


            <!-- ==========================================
                 DATE
            =========================================== -->

            <div class="competition-date">

                ${escapeHTML(
                    formatCompetitionDate(
                        competition.date
                    )
                )}

            </div>


            <!-- ==========================================
                 END TIME
            =========================================== -->

            <div class="competition-end">

                Competition End:

                <strong>

                    ${escapeHTML(
                        competition.endTime ||
                        ""
                    )}

                </strong>

            </div>


            <!-- ==========================================
                 MATCH
            =========================================== -->

            <div class="competition-match">


                <!-- SIDE A -->

                ${sideAHTML}


                <!-- VS -->

                <div class="vs-area">

                    <div class="vs-circle">

                        VS

                    </div>

                </div>


                <!-- SIDE B -->

                ${sideBHTML}


            </div>


            <!-- ==========================================
                 WINNER
            =========================================== -->

            ${winnerHTML}


        </article>

    `;

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


    console.log(
        "Competition Employees:",
        allEmployees.length
    );

}



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

    catch (
        error
    ) {

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

    catch (
        error
    ) {

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


    await Promise.all([

        loadDailyEntries(),

        loadTeacherEntries()

    ]);


    console.log(
        "Competition Entries:",
        allEntries.length
    );

}



// ======================================================
// LOAD COMPETITIONS
// ======================================================

async function loadCompetitions() {

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
        competitionDoc => {

            const competition =
                {

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

                };


            // ------------------------------------------
            // Hidden competitions are NOT public
            // ------------------------------------------

            if (
                competition.publicVisible ===
                false
            ) {

                return;

            }


            allCompetitions.push(
                competition
            );

        }
    );


    // ------------------------------------------
    // Newest competition first
    // ------------------------------------------

    allCompetitions.sort(
        (
            a,
            b
        ) => {

            const aCreated =
                getCreatedTime(
                    a
                );


            const bCreated =
                getCreatedTime(
                    b
                );


            return (
                bCreated -
                aCreated
            );

        }
    );


    console.log(
        "Public Competitions:",
        allCompetitions.length
    );

}



// ======================================================
// GET URL COMPETITION ID
// ======================================================

function getCompetitionIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return (
        params.get(
            "id"
        ) ||
        ""
    ).trim();

}



// ======================================================
// DISPLAY COMPETITIONS
// ======================================================

function displayCompetitions() {

    if (
        !competitionList
    ) {

        return;

    }


    let competitionsToShow =
        allCompetitions;


    // ------------------------------------------
    // If public link has ?id=
    // show only that competition
    // ------------------------------------------

    const requestedId =
        getCompetitionIdFromURL();


    if (
        requestedId
    ) {

        competitionsToShow =
            allCompetitions.filter(
                competition =>
                    competition.id ===
                    requestedId
            );

    }


    // ------------------------------------------
    // No competition
    // ------------------------------------------

    if (
        competitionsToShow.length ===
        0
    ) {

        competitionList.innerHTML =
            "";


        if (
            emptyBox
        ) {

            emptyBox.style.display =
                "block";

        }


        return;

    }


    if (
        emptyBox
    ) {

        emptyBox.style.display =
            "none";

    }


    // ------------------------------------------
    // Render
    // ------------------------------------------

    competitionList.innerHTML =
        competitionsToShow
            .map(
                competition =>
                    createCompetitionCard(
                        competition
                    )
            )
            .join(
                ""
            );

}



// ======================================================
// INITIALIZE
// ======================================================

async function initializeCompetitionPage() {

    try {

        // ------------------------------------------
        // Loading visible
        // ------------------------------------------

        if (
            loadingBox
        ) {

            loadingBox.style.display =
                "block";

        }


        if (
            errorBox
        ) {

            errorBox.style.display =
                "none";

        }


        if (
            emptyBox
        ) {

            emptyBox.style.display =
                "none";

        }


        // ------------------------------------------
        // Load required data
        // ------------------------------------------

        await loadEmployees();


        await loadAllEntries();


        await loadCompetitions();


        // ------------------------------------------
        // Display
        // ------------------------------------------

        displayCompetitions();

    }

    catch (
        error
    ) {

        console.error(
            "Competition page error:",
            error
        );


        showError(
            "Competition data load nahi ho saka."
        );

    }

    finally {

        hideLoading();

    }

}



// ======================================================
// START
// ======================================================

initializeCompetitionPage();



// ======================================================
// END
// ======================================================
