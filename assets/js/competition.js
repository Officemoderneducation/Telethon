// ======================================================
// TELETHON
// PUBLIC ACADEMIC DEPARTMENT COMPETITION
//
// File:
// assets/js/competition.js
//
// PURPOSE:
//
// 1. Public Competition Page
// 2. Academic Department Competition title
// 3. Firebase "competitions" collection
// 4. Competition Date + End Time validation
// 5. End Time ke baad competition hide
// 6. Admin ke saved Team Name show
// 7. Selected Region / State ke Teachers ka total
// 8. Total ko Unit mein show
// 9. Amount / Collection / Data public page par show nahi
// 10. daily_entry + teacher_entries se collection
// 11. Same Teacher + Same Date = latest entry
// 12. Competition Date/End Time ke baad ki entry include nahi
// 13. Individual competition public URL support
//
// URL EXAMPLE:
//
// competition.html?id=COMPETITION_FIREBASE_ID
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

const UNIT_AMOUNT = 7000;


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
        typeof value === "number" &&
        Number.isFinite(value)
    ) {

        return value;

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
                value.seconds * 1000
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
// GET CREATED DATE
// ======================================================

function getEntryDate(
    entry
) {

    const possibleFields = [

        entry.date,

        entry.entryDate,

        entry.collectionDate,

        entry.collection_date,

        entry.selectedDate,

        entry.selected_date,

        entry.dailyDate,

        entry.daily_date

    ];


    for (
        const value
        of possibleFields
    ) {

        if (value) {

            const text =
                String(value)
                    .trim();


            if (
                /^\d{4}-\d{2}-\d{2}$/
                    .test(text)
            ) {

                return text;

            }

        }

    }


    return "";

}


// ======================================================
// GET COMPETITION TEAM NAME
//
// Supports:
//
// teamName
// team_name
// name
// title
//
// ======================================================

function getTeamName(
    side,
    index
) {

    if (!side) {

        return `Team ${index}`;

    }


    if (
        typeof side === "string"
    ) {

        return side.trim();

    }


    return String(

        side.teamName ||

        side.team_name ||

        side.name ||

        side.title ||

        `Team ${index}`

    ).trim();

}


// ======================================================
// GET SIDE ARRAY
//
// Supports existing:
//
// sideA
// sideB
//
// ======================================================

function getSideArray(
    competition,
    side
) {

    const value =
        competition?.[
            side
        ];


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
// GET SIDE TEAM NAME
// ======================================================
//
// Admin ke Team Name ko support karta hai.
//
// Possible Firebase:
//
// sideA: [
//   {
//      teamName: "Kolkata",
//      region: "Kolkata",
//      state: ""
//   }
// ]
//
// OR:
//
// sideA: {
//      teamName: "Kolkata",
//      region: "Kolkata"
// }
//
// OR:
//
// sideATeamName: "Kolkata"
//
// ======================================================

function getSideDisplayName(
    competition,
    side,
    index
) {

    const directName =
        competition?.[
            side + "TeamName"
        ];


    if (
        directName
    ) {

        return String(
            directName
        ).trim();

    }


    const directName2 =
        competition?.[
            side + "_teamName"
        ];


    if (
        directName2
    ) {

        return String(
            directName2
        ).trim();

    }


    const sideData =
        getSideArray(
            competition,
            side
        );


    for (
        const item
        of sideData
    ) {

        const name =
            getTeamName(
                item,
                index
            );


        if (
            name &&
            !/^Team \d+$/.test(
                name
            )
        ) {

            return name;

        }

    }


    return `Team ${index}`;

}


// ======================================================
// GET SIDE PARTICIPANTS
// ======================================================
//
// Region / State matching:
//
// Region selected:
//   Region ke saare teachers
//
// Region + State selected:
//   selected Region + selected State
//
// ======================================================

function getSideParticipants(
    competition,
    side
) {

    const sideData =
        getSideArray(
            competition,
            side
        );


    const selectedRules =
        sideData
            .filter(
                item =>
                    item &&
                    (
                        item.region ||
                        item.state
                    )
            );


    if (
        selectedRules.length === 0
    ) {

        return [];

    }


    const matchingEmployees =
        new Map();


    allEmployees.forEach(
        employee => {

            const employeeCode =
                getEmployeeCode(
                    employee
                );


            if (!employeeCode) {

                return;

            }


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


            let matched =
                false;


            selectedRules.forEach(
                rule => {

                    const ruleRegion =
                        normalize(
                            rule.region
                        );


                    const ruleState =
                        normalize(
                            rule.state
                        );


                    // ==================================
                    // Region + State
                    // ==================================

                    if (
                        ruleRegion &&
                        ruleState
                    ) {

                        if (

                            employeeRegion ===
                            ruleRegion &&

                            employeeState ===
                            ruleState

                        ) {

                            matched =
                                true;

                        }

                    }


                    // ==================================
                    // Region only
                    // ==================================

                    else if (
                        ruleRegion
                    ) {

                        if (
                            employeeRegion ===
                            ruleRegion
                        ) {

                            matched =
                                true;

                        }

                    }


                    // ==================================
                    // State only
                    // ==================================

                    else if (
                        ruleState
                    ) {

                        if (
                            employeeState ===
                            ruleState
                        ) {

                            matched =
                                true;

                        }

                    }

                }
            );


            if (matched) {

                matchingEmployees.set(
                    normalize(
                        employeeCode
                    ),
                    employeeCode
                );

            }

        }
    );


    return [
        ...matchingEmployees.values()
    ];

}


// ======================================================
// COMPETITION END DATETIME
// ======================================================

function getCompetitionEndTimestamp(
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

        return 0;

    }


    const timestamp =
        new Date(
            `${date}T${endTime}:00`
        ).getTime();


    return Number.isFinite(
        timestamp
    )
        ? timestamp
        : 0;

}


// ======================================================
// IS COMPETITION EXPIRED
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
    dateValue
) {

    if (!dateValue) {

        return "";

    }


    const parts =
        String(
            dateValue
        )
            .split("-");


    if (
        parts.length !== 3
    ) {

        return escapeHTML(
            dateValue
        );

    }


    const year =
        Number(
            parts[0]
        );


    const month =
        Number(
            parts[1]
        );


    const day =
        Number(
            parts[2]
        );


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
            dateValue
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
    timeValue
) {

    if (!timeValue) {

        return "";

    }


    const parts =
        String(
            timeValue
        )
            .split(":");


    if (
        parts.length < 2
    ) {

        return escapeHTML(
            timeValue
        );

    }


    const hour =
        Number(
            parts[0]
        );


    const minute =
        Number(
            parts[1]
        );


    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
    ) {

        return escapeHTML(
            timeValue
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
// GET LATEST ENTRIES
//
// Same Teacher + Same Date
// = latest entry only
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


            const currentTime =
                getCreatedTime(
                    entry
                );


            const existingTime =
                getCreatedTime(
                    existing
                );


            if (
                currentTime >=
                existingTime
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
// GET COMPETITION COLLECTION
//
// IMPORTANT:
//
// Only competition date entries.
//
// Entry created AFTER competition end time
// will NOT be counted.
//
// ======================================================

function getCompetitionUnits(
    competition,
    employeeCodes
) {

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


    const employeeSet =
        new Set(
            employeeCodes.map(
                code =>
                    normalize(
                        code
                    )
            )
        );


    const latestEntries =
        getLatestEntries();


    const endTimestamp =
        getCompetitionEndTimestamp(
            competition
        );


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
                !employeeSet.has(
                    employeeCode
                )
            ) {

                return;

            }


            const entryDate =
                getEntryDate(
                    entry
                );


            // ==========================================
            // Competition date only
            // ==========================================

            if (
                entryDate !==
                competitionDate
            ) {

                return;

            }


            // ==========================================
            // Entry created time
            // ==========================================

            const createdTime =
                getCreatedTime(
                    entry
                );


            // ==========================================
            // End Time protection
            //
            // Agar entry End Time ke baad create hui
            // hai to competition mein include nahi hogi.
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
        "Competition Employees:",
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
            "Competition orderBy failed. Loading normally.",
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
        "Competitions:",
        allCompetitions.length
    );

}


// ======================================================
// LOAD DAILY ENTRIES
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
            "Daily entry orderBy failed.",
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
            "Teacher entries orderBy failed.",
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
                "teacher_entries collection unavailable:",
                secondError
            );

        }

    }

}


// ======================================================
// SHOW / HIDE UI
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


    if (errorBox) {

        errorBox.style.display =
            "block";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

}


// ======================================================
// SHOW EMPTY
// ======================================================

function showEmpty() {

    hideLoading();


    if (emptyBox) {

        emptyBox.style.display =
            "block";

    }

}


// ======================================================
// CREATE SIDE HTML
// ======================================================

function createCompetitionSideHTML(
    competition,
    side,
    sideNumber
) {

    const teamName =
        getSideDisplayName(
            competition,
            side,
            sideNumber
        );


    const participants =
        getSideParticipants(
            competition,
            side
        );


    const units =
        getCompetitionUnits(
            competition,
            participants
        );


    return `

        <div class="competition-side">

            <div class="team-name">

                ${escapeHTML(
                    teamName
                )}

            </div>


            <div class="team-total-label">

                Total Unit

            </div>


            <div class="team-total-unit">

                ${formatUnit(
                    units
                )}

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

    const sideAHTML =
        createCompetitionSideHTML(
            competition,
            "sideA",
            1
        );


    const sideBHTML =
        createCompetitionSideHTML(
            competition,
            "sideB",
            2
        );


    const formattedDate =
        formatCompetitionDate(
            competition.date
        );


    const formattedTime =
        formatEndTime(
            competition.endTime
        );


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "competition-card";


    card.dataset.id =
        competition.id;


    card.innerHTML = `

        <div class="competition-title">

            Academic Department Competition

        </div>


        <div class="competition-name">

            ${escapeHTML(
                competition.name ||
                ""
            )}

        </div>


        <div class="competition-date">

            ${escapeHTML(
                formattedDate
            )}

        </div>


        <div class="competition-end">

            Competition End
            <strong>
                ${escapeHTML(
                    formattedTime
                )}
            </strong>

        </div>


        <div class="competition-match">

            ${sideAHTML}


            <div class="vs-area">

                <div class="vs-circle">

                    VS

                </div>

            </div>


            ${sideBHTML}

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
// GET URL COMPETITION ID
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
// GET ACTIVE COMPETITIONS
// ======================================================
//
// End time cross hone ke baad competition
// public list se remove.
// ======================================================

function getActiveCompetitions() {

    return allCompetitions
        .filter(
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


                // Deleted / inactive competition
                // public page par show nahi hoga.

                if (
                    normalize(
                        competition.status
                    ) === "deleted"
                ) {

                    return false;

                }


                if (
                    normalize(
                        competition.status
                    ) === "inactive"
                ) {

                    return false;

                }


                return true;

            }
        );

}


// ======================================================
// DISPLAY SINGLE COMPETITION
// ======================================================

function displaySingleCompetition(
    competition
) {

    if (
        !competition
    ) {

        showEmpty();

        return;

    }


    displayCompetitions([
        competition
    ]);

}


// ======================================================
// FIND COMPETITION BY ID
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
// REFRESH ACTIVE COMPETITION
// ======================================================
//
// Competition end time par page automatically
// hide ho jayega.
//
// ======================================================

function scheduleCompetitionExpiry() {

    const activeCompetitions =
        getActiveCompetitions();


    if (
        activeCompetitions.length === 0
    ) {

        return;

    }


    let nearestEnd =
        Infinity;


    activeCompetitions.forEach(
        competition => {

            const end =
                getCompetitionEndTimestamp(
                    competition
                );


            if (
                end &&
                end < nearestEnd
            ) {

                nearestEnd =
                    end;

            }

        }
    );


    if (
        nearestEnd === Infinity
    ) {

        return;

    }


    const delay =
        Math.max(
            1000,
            nearestEnd -
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
// MAIN LOAD
// ======================================================

async function loadCompetitionPage() {

    try {

        showLoading();


        // ==============================================
        // LOAD ALL DATA
        // ==============================================

        await loadEmployees();

        await loadCompetitions();

        allEntries = [];

        await loadDailyEntries();

        await loadTeacherEntries();


        // ==============================================
        // URL ID
        // ==============================================

        const competitionId =
            getCompetitionIdFromURL();


        // ==============================================
        // INDIVIDUAL PUBLIC COMPETITION
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


            // ==========================================
            // End Time check
            // ==========================================

            if (
                isCompetitionExpired(
                    competition
                )
            ) {

                showEmpty();

                return;

            }


            displaySingleCompetition(
                competition
            );


            scheduleCompetitionExpiry();

            return;

        }


        // ==============================================
        // ALL ACTIVE COMPETITIONS
        // ==============================================

        const activeCompetitions =
            getActiveCompetitions();


        displayCompetitions(
            activeCompetitions
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
