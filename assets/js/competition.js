// ======================================================
// TELETHON
// COMPETITION PUBLIC PAGE
//
// FILE:
// assets/js/competition.js
//
// IMPORTANT:
//
// 1. PUBLIC PAGE
//    Login required nahi.
//
// 2. COMPETITION DATA
//    Firestore collection:
//    competitions
//
// 3. COLLECTION SOURCE
//    OLD:
//       daily_entry
//
//    NEW:
//       teacher_entries
//
// 4. Both collections are READ ONLY.
//
// 5. Same Teacher + Same Date:
//    ALL ENTRIES ARE SUMMED.
//
// 6. Competition side mein:
//    Multiple Regions
//    Multiple States
//    Region + State combinations
//    possible hain.
//
// 7. Competition selected date ke according
//    collection calculate hoga.
//
// 8. Amount ke badle UNIT show hoga.
//
//    1 Unit = ₹7,000
//
// 9. Competition ka End Date + End Time
//    alag-alag ho sakta hai.
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
// CONSTANTS
// ======================================================

const COMPETITION_COLLECTION =
    "competitions";

const EMPLOYEE_COLLECTION =
    "employees";

const DAILY_ENTRY_COLLECTION =
    "daily_entry";

const TEACHER_ENTRY_COLLECTION =
    "teacher_entries";

const UNIT_AMOUNT =
    7000;


// ======================================================
// HTML ELEMENTS
// ======================================================

const competitionList =
    document.getElementById(
        "competitionList"
    );

const competitionLoading =
    document.getElementById(
        "competitionLoading"
    );

const competitionEmpty =
    document.getElementById(
        "competitionEmpty"
    );


// ======================================================
// DATA
// ======================================================

let competitions = [];

let employees = [];

let dailyEntries = [];

let teacherEntries = [];

let allCollectionEntries = [];


// ======================================================
// UTILITY
// ======================================================


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

    const number =
        Number(
            String(value ?? "")
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================================
// UNIT
// ======================================================

function amountToUnit(amount) {

    return (
        numberValue(amount) /
        UNIT_AMOUNT
    );

}


// ======================================================
// FORMAT UNIT
// ======================================================

function formatUnit(value) {

    const number =
        numberValue(value);

    if (
        Number.isInteger(number)
    ) {

        return number.toLocaleString(
            "en-IN"
        );

    }

    return number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );

}


// ======================================================
// EMPLOYEE CODE
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
// ENTRY EMPLOYEE CODE
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
// ENTRY AMOUNT
// ======================================================

function getEntryAmount(entry) {

    return numberValue(

        entry.amount ||

        entry.collection ||

        entry.collectionAmount ||

        entry.totalCollection ||

        entry.total_collection ||

        entry.collectedAmount ||

        entry.collected_amount ||

        0

    );

}


// ======================================================
// ENTRY DATE
// ======================================================

function getEntryDate(entry) {

    return (

        entry.date ||

        entry.entryDate ||

        entry.collectionDate ||

        entry.collection_date ||

        entry.createdDate ||

        entry.created_date ||

        ""

    );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDateForInput(date) {

    if (!(date instanceof Date)) {

        date =
            new Date(date);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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
                Number(
                    value.seconds
                ) * 1000
            )

        );

    }


    const stringValue =
        String(value).trim();


    // YYYY-MM-DD

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(stringValue)
    ) {

        return stringValue;

    }


    // DD-MM-YYYY

    let match =
        stringValue.match(
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
        stringValue.match(
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


    const parsed =
        new Date(stringValue);


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
// DISPLAY DATE
// ======================================================

function displayDate(value) {

    const normalized =
        normalizeDate(value);


    if (!normalized) {

        return "-";

    }


    const date =
        new Date(
            normalized +
            "T00:00:00"
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
            month: "short",
            year: "numeric"
        }
    );

}


// ======================================================
// DISPLAY TIME
// ======================================================

function displayTime(value) {

    if (!value) {

        return "-";

    }


    const stringValue =
        String(value).trim();


    // HH:MM

    if (
        /^\d{1,2}:\d{2}$/
            .test(stringValue)
    ) {

        const parts =
            stringValue.split(":");

        const hour =
            Number(parts[0]);

        const minute =
            Number(parts[1]);


        if (
            hour >= 0 &&
            hour <= 23 &&
            minute >= 0 &&
            minute <= 59
        ) {

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
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        }

    }


    return stringValue;

}


// ======================================================
// GET COMPETITION NAME
// ======================================================

function getCompetitionName(
    competition
) {

    return (

        competition.name ||

        competition.competitionName ||

        competition.title ||

        competition.competition_title ||

        "Competition"

    );

}


// ======================================================
// GET COMPETITION DATE
// ======================================================

function getCompetitionDate(
    competition
) {

    return (

        competition.date ||

        competition.competitionDate ||

        competition.selectedDate ||

        competition.collectionDate ||

        competition.competition_date ||

        ""

    );

}


// ======================================================
// GET END DATE
// ======================================================

function getEndDate(
    competition
) {

    return (

        competition.endDate ||

        competition.end_date ||

        competition.competitionEndDate ||

        getCompetitionDate(
            competition
        )

    );

}


// ======================================================
// GET END TIME
// ======================================================

function getEndTime(
    competition
) {

    return (

        competition.endTime ||

        competition.end_time ||

        competition.competitionEndTime ||

        "23:59"

    );

}


// ======================================================
// GET SIDE
//
// Supports:
//
// side1
// side2
//
// sideA
// sideB
//
// leftSide
// rightSide
//
// team1
// team2
// ======================================================

function getSide(
    competition,
    sideNumber
) {

    if (
        sideNumber === 1
    ) {

        return (

            competition.side1 ||

            competition.sideA ||

            competition.leftSide ||

            competition.team1 ||

            competition.side_1 ||

            []

        );

    }


    return (

        competition.side2 ||

        competition.sideB ||

        competition.rightSide ||

        competition.team2 ||

        competition.side_2 ||

        []

    );

}


// ======================================================
// CONVERT SIDE TO ARRAY
//
// Side data different format mein aa sakta hai.
//
// Example:
//
// [
//   {
//      region: "Kolkata",
//      state: "Bihar"
//   }
// ]
//
// ya:
//
// [
//   {
//      type: "region",
//      name: "Kolkata"
//   },
//   {
//      type: "state",
//      name: "Bihar"
//   }
// ]
// ======================================================

function normalizeSide(
    side
) {

    if (!side) {

        return [];

    }


    // Already array

    if (
        Array.isArray(side)
    ) {

        return side;

    }


    // Object

    if (
        typeof side === "object"
    ) {

        return [side];

    }


    // String

    if (
        typeof side === "string"
    ) {

        return [

            {
                name:
                    side
            }

        ];

    }


    return [];

}


// ======================================================
// GET RULE TYPE
// ======================================================

function getRuleType(rule) {

    const type =
        normalize(

            rule.type ||

            rule.accessType ||

            rule.category ||

            rule.locationType ||

            ""

        );


    if (
        type === "region"
    ) {

        return "region";

    }


    if (
        type === "state"
    ) {

        return "state";

    }


    // If region field exists

    if (
        rule.region ||
        rule.regionName ||
        rule.region_name
    ) {

        return "region";

    }


    // If state field exists

    if (
        rule.state ||
        rule.stateName ||
        rule.state_name
    ) {

        return "state";

    }


    return "";

}


// ======================================================
// GET RULE NAME
// ======================================================

function getRuleName(rule) {

    return String(

        rule.name ||

        rule.value ||

        rule.region ||

        rule.regionName ||

        rule.region_name ||

        rule.state ||

        rule.stateName ||

        rule.state_name ||

        ""

    ).trim();

}


// ======================================================
// CHECK EMPLOYEE AGAINST RULE
// ======================================================

function employeeMatchesRule(
    employee,
    rule
) {

    if (!rule) {

        return false;

    }


    const employeeRegion =
        normalize(

            employee.region ||

            employee.regionName ||

            employee.region_name ||

            ""

        );


    const employeeState =
        normalize(

            employee.state ||

            employee.stateName ||

            employee.state_name ||

            ""

        );


    const ruleType =
        getRuleType(rule);


    const ruleName =
        normalize(
            getRuleName(rule)
        );


    // ==========================================
    // REGION
    // ==========================================

    if (
        ruleType === "region"
    ) {

        return (
            employeeRegion ===
            ruleName
        );

    }


    // ==========================================
    // STATE
    // ==========================================

    if (
        ruleType === "state"
    ) {

        return (
            employeeState ===
            ruleName
        );

    }


    // ==========================================
    // REGION + STATE
    // ==========================================

    const assignedRegion =
        normalize(

            rule.region ||

            rule.regionName ||

            rule.region_name ||

            ""

        );


    const assignedState =
        normalize(

            rule.state ||

            rule.stateName ||

            rule.state_name ||

            ""

        );


    if (
        assignedRegion &&
        assignedState
    ) {

        return (

            employeeRegion ===
            assignedRegion &&

            employeeState ===
            assignedState

        );

    }


    return false;

}


// ======================================================
// SIDE COLLECTION
// ======================================================

function calculateSideCollection(
    side,
    selectedDate,
    dailyMap
) {

    const rules =
        normalizeSide(
            side
        );


    if (!rules.length) {

        return 0;

    }


    let total =
        0;


    // ==========================================
    // IMPORTANT
    //
    // Ek teacher multiple rules mein match
    // ho sakta hai.
    //
    // Isliye teacher code ko Set mein rakhenge.
    // Teacher ka collection sirf ONE TIME count hoga.
    // ==========================================

    const matchedTeachers =
        new Set();


    employees.forEach(
        (employee) => {

            const matched =
                rules.some(
                    (rule) =>

                        employeeMatchesRule(
                            employee,
                            rule
                        )
                );


            if (!matched) {

                return;

            }


            const employeeCode =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            if (!employeeCode) {

                return;

            }


            matchedTeachers.add(
                employeeCode
            );

        }
    );


    // ==========================================
    // DATE-WISE COLLECTION
    // ==========================================

    matchedTeachers.forEach(
        (employeeCode) => {

            const key =
                employeeCode +
                "|" +
                selectedDate;


            const record =
                dailyMap.get(
                    key
                );


            if (record) {

                total +=
                    numberValue(
                        record.amount
                    );

            }

        }
    );


    return total;

}


// ======================================================
// BUILD DAILY MAP
//
// Same Teacher + Same Date
// ALL ENTRIES SUMMED.
//
// Example:
//
// T001 | 29 Aug | ₹500
// T001 | 29 Aug | ₹300
//
// Result:
//
// T001 | 29 Aug | ₹800
// ======================================================

function buildDailyMap() {

    const map =
        new Map();


    allCollectionEntries.forEach(
        (entry) => {

            const code =
                normalize(
                    getEntryEmployeeCode(
                        entry
                    )
                );


            const date =
                normalizeDate(
                    getEntryDate(
                        entry
                    )
                );


            if (
                !code ||
                !date
            ) {

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
                map.get(
                    key
                );


            if (!existing) {

                map.set(
                    key,
                    {
                        amount:
                            amount
                    }
                );

            }

            else {

                existing.amount +=
                    amount;

            }

        }
    );


    console.log(
        "Competition Daily Map:",
        map
    );


    return map;

}


// ======================================================
// LOAD COMPETITIONS
// ======================================================

async function loadCompetitions() {

    try {

        let snapshot;


        // ==========================================
        // FIRST TRY ORDER BY
        // ==========================================

        try {

            const q =
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
                await getDocs(q);

        }

        catch (error) {

            console.warn(
                "Competition orderBy failed. Using normal query.",
                error
            );


            snapshot =
                await getDocs(

                    collection(
                        db,
                        COMPETITION_COLLECTION
                    )

                );

        }


        competitions = [];


        snapshot.forEach(
            (competitionDoc) => {

                competitions.push({

                    id:
                        competitionDoc.id,

                    ...competitionDoc.data()

                });

            }
        );


        console.log(
            "Competitions:",
            competitions
        );


    }

    catch (error) {

        console.error(
            "Competition Load Error:",
            error
        );


        showError(
            "Competition data load nahi ho saka."
        );

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
                EMPLOYEE_COLLECTION
            )

        );


    employees = [];


    snapshot.forEach(
        (employeeDoc) => {

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
// LOAD COLLECTION
// ======================================================

async function loadCollection(
    collectionName
) {

    const snapshot =
        await getDocs(

            collection(
                db,
                collectionName
            )

        );


    const result = [];


    snapshot.forEach(
        (entryDoc) => {

            result.push({

                id:
                    entryDoc.id,

                ...entryDoc.data(),

                _source:
                    collectionName

            });

        }
    );


    return result;

}


// ======================================================
// LOAD ALL COLLECTION DATA
// ======================================================

async function loadCollectionData() {

    dailyEntries =
        await loadCollection(
            DAILY_ENTRY_COLLECTION
        );


    teacherEntries =
        await loadCollection(
            TEACHER_ENTRY_COLLECTION
        );


    allCollectionEntries = [

        ...dailyEntries,

        ...teacherEntries

    ];


    console.log(
        "daily_entry:",
        dailyEntries.length
    );


    console.log(
        "teacher_entries:",
        teacherEntries.length
    );


    console.log(
        "Combined:",
        allCollectionEntries.length
    );

}


// ======================================================
// RENDER SIDE RULE
// ======================================================

function renderSideRules(
    side
) {

    const rules =
        normalizeSide(
            side
        );


    if (!rules.length) {

        return `
            <div class="no-side-data">
                No Data
            </div>
        `;

    }


    let html = "";


    rules.forEach(
        (rule) => {

            const type =
                getRuleType(rule);


            const name =
                getRuleName(rule);


            let label =
                name;


            if (
                type === "region"
            ) {

                label =
                    `${name} Region`;

            }

            else if (
                type === "state"
            ) {

                label =
                    `${name} State`;

            }


            // Region + State

            const region =
                rule.region ||
                rule.regionName ||
                rule.region_name ||
                "";


            const state =
                rule.state ||
                rule.stateName ||
                rule.state_name ||
                "";


            if (
                region &&
                state
            ) {

                label =
                    `${region} Region + ${state} State`;

            }


            html += `

                <div class="competition-rule">

                    ${escapeHTML(
                        label
                    )}

                </div>

            `;

        }
    );


    return html;

}


// ======================================================
// GET COMPETITION STATUS
// ======================================================

function getCompetitionStatus(
    competition
) {

    const endDate =
        normalizeDate(
            getEndDate(
                competition
            )
        );


    const endTime =
        getEndTime(
            competition
        );


    if (!endDate) {

        return "active";

    }


    const endDateTime =
        new Date(

            endDate +
            "T" +
            (
                endTime ||
                "23:59"
            ) +
            ":59"

        );


    if (
        Number.isNaN(
            endDateTime.getTime()
        )
    ) {

        return "active";

    }


    return (
        new Date() >
        endDateTime
    )
        ? "ended"
        : "active";

}


// ======================================================
// RENDER COMPETITIONS
// ======================================================

function renderCompetitions() {

    if (!competitionList) {

        return;

    }


    if (!competitions.length) {

        if (competitionLoading) {

            competitionLoading.style.display =
                "none";

        }


        if (competitionEmpty) {

            competitionEmpty.style.display =
                "block";

        }


        competitionList.innerHTML =
            "";


        return;

    }


    const dailyMap =
        buildDailyMap();


    let html = "";


    competitions.forEach(
        (competition) => {

            const competitionName =
                getCompetitionName(
                    competition
                );


            const competitionDate =
                getCompetitionDate(
                    competition
                );


            const endDate =
                getEndDate(
                    competition
                );


            const endTime =
                getEndTime(
                    competition
                );


            const side1 =
                getSide(
                    competition,
                    1
                );


            const side2 =
                getSide(
                    competition,
                    2
                );


            // ======================================
            // SIDE COLLECTION
            // ======================================

            const side1Amount =
                calculateSideCollection(

                    side1,

                    normalizeDate(
                        competitionDate
                    ),

                    dailyMap

                );


            const side2Amount =
                calculateSideCollection(

                    side2,

                    normalizeDate(
                        competitionDate
                    ),

                    dailyMap

                );


            // ======================================
            // UNITS
            // ======================================

            const side1Unit =
                amountToUnit(
                    side1Amount
                );


            const side2Unit =
                amountToUnit(
                    side2Amount
                );


            // ======================================
            // STATUS
            // ======================================

            const status =
                getCompetitionStatus(
                    competition
                );


            const statusText =
                status === "ended"
                    ? "Competition Ended"
                    : "Competition Active";


            // ======================================
            // WINNER
            //
            // Equal = Draw
            // ======================================

            let winnerText =
                "";


            if (
                status === "ended"
            ) {

                if (
                    side1Unit >
                    side2Unit
                ) {

                    winnerText =
                        "Side 1 Winner";

                }

                else if (
                    side2Unit >
                    side1Unit
                ) {

                    winnerText =
                        "Side 2 Winner";

                }

                else {

                    winnerText =
                        "Competition Draw";

                }

            }


            // ======================================
            // CARD
            // ======================================

            html += `

                <div
                    class="
                        competition-card
                        ${status}
                    "
                    data-id="${escapeHTML(
                        competition.id
                    )}"
                >

                    <!-- =========================
                         HEADER
                    ========================== -->

                    <div
                        class="competition-header"
                    >

                        <div>

                            <h2>
                                ${escapeHTML(
                                    competitionName
                                )}
                            </h2>

                            <div
                                class="competition-date"
                            >
                                Date:
                                ${escapeHTML(
                                    displayDate(
                                        competitionDate
                                    )
                                )}
                            </div>

                        </div>


                        <div
                            class="
                                competition-status
                                ${status}
                            "
                        >

                            ${escapeHTML(
                                statusText
                            )}

                        </div>

                    </div>


                    <!-- =========================
                         END TIME
                    ========================== -->

                    <div
                        class="competition-end-time"
                    >

                        Competition End:

                        <strong>
                            ${escapeHTML(
                                displayDate(
                                    endDate
                                )
                            )}
                        </strong>

                        |

                        <strong>
                            ${escapeHTML(
                                displayTime(
                                    endTime
                                )
                            )}
                        </strong>

                    </div>


                    <!-- =========================
                         SIDES
                    ========================== -->

                    <div
                        class="competition-sides"
                    >


                        <!-- SIDE 1 -->

                        <div
                            class="
                                competition-side
                                side-one
                            "
                        >

                            <div
                                class="side-title"
                            >
                                Side 1
                            </div>


                            <div
                                class="
                                    side-rules
                                "
                            >

                                ${renderSideRules(
                                    side1
                                )}

                            </div>


                            <div
                                class="
                                    side-collection
                                "
                            >

                                <span>
                                    Total Collection
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        formatUnit(
                                            side1Unit
                                        )
                                    )}
                                    Unit
                                </strong>

                            </div>

                        </div>


                        <!-- VS -->

                        <div
                            class="competition-vs"
                        >
                            VS
                        </div>


                        <!-- SIDE 2 -->

                        <div
                            class="
                                competition-side
                                side-two
                            "
                        >

                            <div
                                class="side-title"
                            >
                                Side 2
                            </div>


                            <div
                                class="
                                    side-rules
                                "
                            >

                                ${renderSideRules(
                                    side2
                                )}

                            </div>


                            <div
                                class="
                                    side-collection
                                "
                            >

                                <span>
                                    Total Collection
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        formatUnit(
                                            side2Unit
                                        )
                                    )}
                                    Unit
                                </strong>

                            </div>

                        </div>


                    </div>


                    <!-- =========================
                         RESULT
                    ========================== -->

                    ${
                        winnerText
                            ? `
                                <div
                                    class="
                                        competition-result
                                    "
                                >
                                    ${escapeHTML(
                                        winnerText
                                    )}
                                </div>
                              `
                            : ""
                    }

                </div>

            `;

        }
    );


    competitionList.innerHTML =
        html;


    if (competitionLoading) {

        competitionLoading.style.display =
            "none";

    }


    if (competitionEmpty) {

        competitionEmpty.style.display =
            "none";

    }

}


// ======================================================
// ERROR
// ======================================================

function showError(message) {

    if (competitionLoading) {

        competitionLoading.style.display =
            "none";

    }


    if (competitionEmpty) {

        competitionEmpty.style.display =
            "block";


        competitionEmpty.innerHTML = `

            <div
                class="competition-error"
            >

                ${escapeHTML(
                    message
                )}

            </div>

        `;

    }

}


// ======================================================
// INITIAL LOAD
// ======================================================

async function initCompetition() {

    try {

        if (competitionLoading) {

            competitionLoading.style.display =
                "block";

        }


        if (competitionEmpty) {

            competitionEmpty.style.display =
                "none";

        }


        // ======================================
        // LOAD ALL DATA
        // ======================================

        await Promise.all([

            loadCompetitions(),

            loadEmployees(),

            loadCollectionData()

        ]);


        // ======================================
        // RENDER
        // ======================================

        renderCompetitions();

    }

    catch (error) {

        console.error(
            "Competition Initialization Error:",
            error
        );


        showError(
            error.message ||
            "Competition page load nahi ho saka."
        );

    }

}


// ======================================================
// START
// ======================================================

initCompetition();
