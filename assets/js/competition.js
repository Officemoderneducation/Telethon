// ======================================================
// TELETHON
// PUBLIC COMPETITION PAGE
// File:
//     assets/js/competition.js
//
// IMPORTANT
//
// 1. THIS PAGE IS PUBLIC.
// 2. NO LOGIN REQUIRED.
// 3. COMPETITIONS ARE READ ONLY.
// 4. COMPETITION DATA:
//        competitions
//
// 5. COLLECTION DATA SOURCE:
//        daily_entry
//        teacher_entries
//
// 6. BOTH COLLECTIONS ARE READ ONLY.
//
// 7. SAME TEACHER + SAME DATE:
//        ALL ENTRIES ARE SUMMED.
//
// 8. COMPETITION DATE:
//        ONLY SELECTED DATE IS USED.
//
// 9. AMOUNT IS DISPLAYED AS UNIT.
//
// 10. 1 UNIT = ₹7,000
//
// 11. SIDE CAN CONTAIN:
//        Multiple Regions
//        Multiple States
//
// Example:
//
// Side A:
//     Kolkata Region + Bihar State
//
// Side B:
//     Gujarat State
//
// OR
//
// Side A:
//     Hyderabad Region
//     Bangalore Region
//
// Side B:
//     Madhya Pradesh State
//
// ======================================================


import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// CONFIG
// ======================================================

const COMPETITIONS_COLLECTION =
    "competitions";

const DAILY_ENTRY_COLLECTION =
    "daily_entry";

const TEACHER_ENTRIES_COLLECTION =
    "teacher_entries";

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

let competitions = [];

let employees = [];

let dailyEntries = [];

let teacherEntries = [];

let allCollectionEntries = [];

let employeeMap = new Map();


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

    const number =
        Number(
            String(
                value ?? ""
            )
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

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
// FORMAT DATE FOR INPUT
// ======================================================

function formatDateForInput(date) {

    if (
        !(date instanceof Date) ||
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
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
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
// NORMALIZE DATE
// ======================================================

function normalizeDate(value) {

    if (!value) {

        return "";

    }


    // ----------------------------------------------
    // FIRESTORE TIMESTAMP
    // ----------------------------------------------

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return formatDateForInput(
            value.toDate()
        );

    }


    // ----------------------------------------------
    // FIRESTORE TIMESTAMP OBJECT
    // ----------------------------------------------

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


    // ----------------------------------------------
    // YYYY-MM-DD
    // ----------------------------------------------

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(stringValue)
    ) {

        return stringValue;

    }


    // ----------------------------------------------
    // DD-MM-YYYY
    // ----------------------------------------------

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


    // ----------------------------------------------
    // DD/MM/YYYY
    // ----------------------------------------------

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


    // ----------------------------------------------
    // DATE PARSE
    // ----------------------------------------------

    const parsed =
        new Date(
            stringValue
        );


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

function displayDate(dateString) {

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

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
// FORMAT UNIT
// ======================================================

function formatUnit(value) {

    const units =
        numberValue(value) /
        UNIT_AMOUNT;


    return units.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


// ======================================================
// AMOUNT TO UNIT
// ======================================================

function amountToUnit(amount) {

    return (
        numberValue(amount) /
        UNIT_AMOUNT
    );

}


// ======================================================
// GET CREATED TIME
//
// Only used for sorting competition records.
// ======================================================

function getCreatedTime(data) {

    const possibleTime =

        data.createdAt ||

        data.created_at ||

        data.timestamp ||

        data.updatedAt ||

        data.updated_at ||

        null;


    if (
        possibleTime &&
        typeof possibleTime === "object" &&
        typeof possibleTime.toDate === "function"
    ) {

        return possibleTime
            .toDate()
            .getTime();

    }


    if (
        possibleTime &&
        typeof possibleTime === "object" &&
        possibleTime.seconds !== undefined
    ) {

        return (
            Number(
                possibleTime.seconds
            ) * 1000
        );

    }


    if (
        possibleTime instanceof Date
    ) {

        return possibleTime.getTime();

    }


    if (
        typeof possibleTime === "number"
    ) {

        return possibleTime;

    }


    if (possibleTime) {

        const parsed =
            new Date(
                String(
                    possibleTime
                )
            );


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return parsed.getTime();

        }

    }


    return 0;

}


// ======================================================
// LOAD COLLECTION
// ======================================================

async function loadCollectionData(
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
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "employees"
            )
        );


    employees = [];


    snapshot.forEach(
        (employeeDoc) => {

            const employee = {

                id:
                    employeeDoc.id,

                ...employeeDoc.data()

            };


            employees.push(
                employee
            );

        }
    );


    employeeMap =
        new Map();


    employees.forEach(
        (employee) => {

            const code =
                normalize(
                    getEmployeeCode(
                        employee
                    )
                );


            if (code) {

                employeeMap.set(
                    code,
                    employee
                );

            }

        }
    );


    console.log(
        "Employees:",
        employees.length
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
                COMPETITIONS_COLLECTION
            )
        );


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


    // ----------------------------------------------
    // NEWEST FIRST
    // ----------------------------------------------

    competitions.sort(
        (
            a,
            b
        ) => {

            return (
                getCreatedTime(b) -
                getCreatedTime(a)
            );

        }
    );


    console.log(
        "Competitions:",
        competitions
    );

}


// ======================================================
// BUILD DAILY MAP
//
// SAME TEACHER + SAME DATE
// ALL ENTRIES SUMMED.
//
// Example:
//
// daily_entry
// T001 | 29 Aug | 500
//
// teacher_entries
// T001 | 29 Aug | 300
//
// RESULT
//
// T001 | 29 Aug | 800
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
                            amount,

                        count:
                            1

                    }
                );

            }

            else {

                existing.amount +=
                    amount;

                existing.count +=
                    1;

            }

        }
    );


    return map;

}


// ======================================================
// GET EMPLOYEE REGION
// ======================================================

function getEmployeeRegion(employee) {

    return normalize(

        employee.region ||

        employee.regionName ||

        employee.region_name ||

        ""

    );

}


// ======================================================
// GET EMPLOYEE STATE
// ======================================================

function getEmployeeState(employee) {

    return normalize(

        employee.state ||

        employee.stateName ||

        employee.state_name ||

        ""

    );

}


// ======================================================
// GET EMPLOYEE CITY
// ======================================================

function getEmployeeCity(employee) {

    return normalize(

        employee.city ||

        employee.cityName ||

        employee.city_name ||

        ""

    );

}


// ======================================================
// SIDE ITEM NORMALIZATION
//
// This supports different possible structures
// saved by competition-entry.js.
//
// Supported:
//
// {
//     region: "Kolkata",
//     state: "Bihar"
// }
//
// {
//     type: "region",
//     value: "Kolkata"
// }
//
// {
//     type: "state",
//     value: "Gujarat"
// }
//
// ======================================================

function normalizeSideItem(item) {

    if (!item) {

        return null;

    }


    // ----------------------------------------------
    // STRING
    // ----------------------------------------------

    if (
        typeof item === "string"
    ) {

        return {

            type:
                "region",

            value:
                item,

            region:
                item,

            state:
                ""

        };

    }


    // ----------------------------------------------
    // REGION
    // ----------------------------------------------

    const region =
        String(

            item.region ||

            item.regionName ||

            item.region_name ||

            item.selectedRegion ||

            ""

        ).trim();


    // ----------------------------------------------
    // STATE
    // ----------------------------------------------

    const state =
        String(

            item.state ||

            item.stateName ||

            item.state_name ||

            item.selectedState ||

            ""

        ).trim();


    // ----------------------------------------------
    // TYPE
    // ----------------------------------------------

    let type =
        normalize(

            item.type ||

            item.level ||

            item.category ||

            ""

        );


    if (!type) {

        if (
            region &&
            state
        ) {

            type =
                "region_state";

        }

        else if (region) {

            type =
                "region";

        }

        else if (state) {

            type =
                "state";

        }

    }


    // ----------------------------------------------
    // VALUE
    // ----------------------------------------------

    const value =
        String(

            item.value ||

            item.name ||

            item.title ||

            ""

        ).trim();


    return {

        type:
            type,

        value:
            value,

        region:
            region,

        state:
            state

    };

}


// ======================================================
// GET SIDE ITEMS
//
// Supports:
//
// sideA
// sideB
//
// OR
//
// sideAItems
// sideBItems
//
// OR
//
// sideAData
// sideBData
// ======================================================

function getSideItems(
    competition,
    side
) {

    let items = [];


    if (
        side === "A"
    ) {

        items =

            competition.sideA ||

            competition.sideAItems ||

            competition.sideAData ||

            competition.teamA ||

            competition.teamAItems ||

            [];

    }

    else {

        items =

            competition.sideB ||

            competition.sideBItems ||

            competition.sideBData ||

            competition.teamB ||

            competition.teamBItems ||

            [];

    }


    // ----------------------------------------------
    // ARRAY
    // ----------------------------------------------

    if (
        Array.isArray(items)
    ) {

        return items
            .map(
                normalizeSideItem
            )
            .filter(
                Boolean
            );

    }


    // ----------------------------------------------
    // SINGLE OBJECT
    // ----------------------------------------------

    if (
        typeof items === "object" &&
        items !== null
    ) {

        return [

            normalizeSideItem(
                items
            )

        ].filter(
            Boolean
        );

    }


    return [];

}


// ======================================================
// EMPLOYEE MATCHES SIDE ITEM
// ======================================================

function employeeMatchesSideItem(
    employee,
    item
) {

    if (
        !employee ||
        !item
    ) {

        return false;

    }


    const employeeRegion =
        getEmployeeRegion(
            employee
        );


    const employeeState =
        getEmployeeState(
            employee
        );


    const itemRegion =
        normalize(
            item.region
        );


    const itemState =
        normalize(
            item.state
        );


    const itemType =
        normalize(
            item.type
        );


    // ==================================================
    // REGION + STATE
    // ==================================================

    if (

        itemRegion &&
        itemState

    ) {

        return (

            employeeRegion ===
            itemRegion &&

            employeeState ===
            itemState

        );

    }


    // ==================================================
    // REGION ONLY
    // ==================================================

    if (
        itemRegion
    ) {

        return (
            employeeRegion ===
            itemRegion
        );

    }


    // ==================================================
    // STATE ONLY
    // ==================================================

    if (
        itemState
    ) {

        return (
            employeeState ===
            itemState
        );

    }


    // ==================================================
    // TYPE + VALUE FALLBACK
    // ==================================================

    const value =
        normalize(
            item.value
        );


    if (
        !value
    ) {

        return false;

    }


    if (
        itemType === "state"
    ) {

        return (
            employeeState ===
            value
        );

    }


    if (
        itemType === "region"
    ) {

        return (
            employeeRegion ===
            value
        );

    }


    // ==================================================
    // LAST FALLBACK
    // ==================================================

    return (

        employeeRegion ===
        value ||

        employeeState ===
        value

    );

}


// ======================================================
// GET SIDE EMPLOYEES
//
// IMPORTANT:
//
// A teacher should be counted only once even if
// multiple competition rules match the same teacher.
//
// ======================================================

function getSideEmployees(
    sideItems
) {

    const matchedCodes =
        new Set();


    sideItems.forEach(
        (item) => {

            employees.forEach(
                (employee) => {

                    if (
                        employeeMatchesSideItem(
                            employee,
                            item
                        )
                    ) {

                        const code =
                            normalize(
                                getEmployeeCode(
                                    employee
                                )
                            );


                        if (code) {

                            matchedCodes.add(
                                code
                            );

                        }

                    }

                }
            );

        }
    );


    return [

        ...matchedCodes

    ];

}


// ======================================================
// CALCULATE SIDE COLLECTION
//
// ONLY COMPETITION DATE
// ======================================================

function calculateSideAmount(
    sideItems,
    competitionDate,
    dailyMap
) {

    if (
        !sideItems.length
    ) {

        return 0;

    }


    const sideEmployeeCodes =
        getSideEmployees(
            sideItems
        );


    let total =
        0;


    sideEmployeeCodes.forEach(
        (employeeCode) => {

            const key =
                employeeCode +
                "|" +
                competitionDate;


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
// GET COMPETITION DATE
// ======================================================

function getCompetitionDate(
    competition
) {

    return normalizeDate(

        competition.date ||

        competition.competitionDate ||

        competition.competition_date ||

        competition.startDate ||

        competition.start_date ||

        ""

    );

}


// ======================================================
// GET COMPETITION NAME
// ======================================================

function getCompetitionName(
    competition
) {

    return String(

        competition.name ||

        competition.competitionName ||

        competition.competition_name ||

        competition.title ||

        "Competition"

    ).trim();

}


// ======================================================
// GET END TIME
// ======================================================

function getCompetitionEndTime(
    competition
) {

    return String(

        competition.endTime ||

        competition.end_time ||

        competition.competitionEndTime ||

        competition.competition_end_time ||

        ""

    ).trim();

}


// ======================================================
// FORMAT TIME
// ======================================================

function formatTime(
    time
) {

    if (!time) {

        return "—";

    }


    const parts =
        time.split(":");


    if (
        parts.length < 2
    ) {

        return time;

    }


    let hour =
        Number(
            parts[0]
        );

    const minute =
        parts[1];


    if (
        !Number.isFinite(hour)
    ) {

        return time;

    }


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return (
        hour +
        ":" +
        minute +
        " " +
        suffix
    );

}


// ======================================================
// COMPETITION STATUS
//
// Status is based on:
//
// Competition Date + End Time
//
// ======================================================

function getCompetitionStatus(
    competitionDate,
    endTime
) {

    if (
        !competitionDate ||
        !endTime
    ) {

        return {

            ended:
                false,

            text:
                "Competition"

        };

    }


    const endDate =
        new Date(
            competitionDate +
            "T" +
            endTime
        );


    if (
        Number.isNaN(
            endDate.getTime()
        )
    ) {

        return {

            ended:
                false,

            text:
                "Competition"

        };

    }


    const now =
        new Date();


    if (
        now.getTime() >=
        endDate.getTime()
    ) {

        return {

            ended:
                true,

            text:
                "Ended"

        };

    }


    return {

        ended:
            false,

        text:
            "Live"

    };

}


// ======================================================
// SIDE DISPLAY LABEL
// ======================================================

function getSideItemLabel(
    item
) {

    const region =
        String(
            item.region || ""
        ).trim();


    const state =
        String(
            item.state || ""
        ).trim();


    if (
        region &&
        state
    ) {

        return {

            main:
                region,

            sub:
                state,

            type:
                "Region + State"

        };

    }


    if (
        region
    ) {

        return {

            main:
                region,

            sub:
                "",

            type:
                "Region"

        };

    }


    if (
        state
    ) {

        return {

            main:
                state,

            sub:
                "",

            type:
                "State"

        };

    }


    if (
        item.value
    ) {

        return {

            main:
                item.value,

            sub:
                "",

            type:
                item.type || "Area"

        };

    }


    return {

        main:
            "Unknown",

        sub:
            "",

        type:
            "Area"

    };

}


// ======================================================
// RENDER SIDE ITEMS
// ======================================================

function renderSideItems(
    items
) {

    if (
        !items.length
    ) {

        return `

            <div class="no-side-data">

                No area selected

            </div>

        `;

    }


    let html = "";


    items.forEach(
        (item) => {

            const label =
                getSideItemLabel(
                    item
                );


            html += `

                <div class="side-item">

                    <div class="side-item-region">

                        ${escapeHTML(
                            label.main
                        )}

                    </div>

                    ${
                        label.sub
                            ? `
                                <div class="side-item-state">

                                    ${escapeHTML(
                                        label.sub
                                    )}

                                </div>
                            `
                            : ""
                    }

                    <span class="side-item-type">

                        ${escapeHTML(
                            label.type
                        )}

                    </span>

                </div>

            `;

        }
    );


    return html;

}


// ======================================================
// GET WINNER TEXT
// ======================================================

function getWinnerText(
    sideAUnit,
    sideBUnit
) {

    if (
        sideAUnit ===
        sideBUnit
    ) {

        return `

            <i class="fa-solid fa-handshake"></i>

            Competition is tied

        `;

    }


    if (
        sideAUnit >
        sideBUnit
    ) {

        return `

            <i class="fa-solid fa-trophy"></i>

            Side A is ahead

        `;

    }


    return `

        <i class="fa-solid fa-trophy"></i>

        Side B is ahead

    `;

}


// ======================================================
// RENDER COMPETITION
// ======================================================

function renderCompetition(
    competition,
    dailyMap
) {

    const competitionDate =
        getCompetitionDate(
            competition
        );


    const competitionName =
        getCompetitionName(
            competition
        );


    const endTime =
        getCompetitionEndTime(
            competition
        );


    const sideAItems =
        getSideItems(
            competition,
            "A"
        );


    const sideBItems =
        getSideItems(
            competition,
            "B"
        );


    // ==================================================
    // CALCULATION
    // ==================================================

    const sideAAmount =
        calculateSideAmount(
            sideAItems,
            competitionDate,
            dailyMap
        );


    const sideBAmount =
        calculateSideAmount(
            sideBItems,
            competitionDate,
            dailyMap
        );


    const sideAUnit =
        amountToUnit(
            sideAAmount
        );


    const sideBUnit =
        amountToUnit(
            sideBAmount
        );


    // ==================================================
    // STATUS
    // ==================================================

    const status =
        getCompetitionStatus(
            competitionDate,
            endTime
        );


    const statusClass =
        status.ended
            ? "status-ended"
            : "status-live";


    // ==================================================
    // CARD
    // ==================================================

    return `

        <article class="competition-card">


            <!-- ==========================================
                 HEADER
            =========================================== -->

            <div class="competition-card-header">

                <div class="competition-title-area">

                    <div class="competition-title">

                        ${escapeHTML(
                            competitionName
                        )}

                    </div>


                    <div class="competition-meta">

                        ${
                            competitionDate
                                ? `

                                    <span class="meta-item">

                                        <i class="fa-regular fa-calendar"></i>

                                        ${escapeHTML(
                                            displayDate(
                                                competitionDate
                                            )
                                        )}

                                    </span>

                                `
                                : ""
                        }


                        ${
                            endTime
                                ? `

                                    <span class="meta-item">

                                        <i class="fa-regular fa-clock"></i>

                                        End:
                                        ${escapeHTML(
                                            formatTime(
                                                endTime
                                            )
                                        )}

                                    </span>

                                `
                                : ""
                        }

                    </div>

                </div>


                <div
                    class="competition-status ${statusClass}"
                >

                    <i
                        class="fa-solid ${
                            status.ended
                                ? "fa-circle-check"
                                : "fa-circle"
                        }"
                    ></i>

                    ${escapeHTML(
                        status.text
                    )}

                </div>

            </div>



            <!-- ==========================================
                 CONTENT
            =========================================== -->

            <div class="competition-content">


                <div class="vs-wrapper">


                    <!-- ======================================
                         SIDE A
                    ======================================= -->

                    <div class="competition-side">

                        <div
                            class="
                                side-heading
                                side-a-heading
                            "
                        >

                            <span>

                                <i class="fa-solid fa-flag"></i>

                                Side A

                            </span>


                            <span>

                                ${sideAItems.length}

                                ${
                                    sideAItems.length === 1
                                        ? "Area"
                                        : "Areas"
                                }

                            </span>

                        </div>


                        <div class="side-items">

                            ${renderSideItems(
                                sideAItems
                            )}

                        </div>

                    </div>



                    <!-- ======================================
                         VS
                    ======================================= -->

                    <div class="vs-area">

                        <div class="vs-circle">

                            VS

                        </div>

                    </div>



                    <!-- ======================================
                         SIDE B
                    ======================================= -->

                    <div class="competition-side">

                        <div
                            class="
                                side-heading
                                side-b-heading
                            "
                        >

                            <span>

                                <i class="fa-solid fa-flag"></i>

                                Side B

                            </span>


                            <span>

                                ${sideBItems.length}

                                ${
                                    sideBItems.length === 1
                                        ? "Area"
                                        : "Areas"
                                }

                            </span>

                        </div>


                        <div class="side-items">

                            ${renderSideItems(
                                sideBItems
                            )}

                        </div>

                    </div>


                </div>



                <!-- ==========================================
                     RESULT
                =========================================== -->

                <div class="result-area">


                    <div class="result-label">

                        Collection Result
                        •
                        ${escapeHTML(
                            displayDate(
                                competitionDate
                            )
                        )}

                    </div>


                    <div class="result-grid">


                        <!-- ==================================
                             SIDE A RESULT
                        =================================== -->

                        <div
                            class="
                                result-side
                                result-side-a
                            "
                        >

                            <div class="result-side-name">

                                SIDE A

                            </div>


                            <div class="unit-value">

                                ${formatUnit(
                                    sideAAmount
                                )}

                            </div>


                            <div class="unit-label">

                                UNIT

                            </div>

                        </div>



                        <!-- ==================================
                             VS
                        =================================== -->

                        <div class="result-vs">

                            VS

                        </div>



                        <!-- ==================================
                             SIDE B RESULT
                        =================================== -->

                        <div
                            class="
                                result-side
                                result-side-b
                            "
                        >

                            <div class="result-side-name">

                                SIDE B

                            </div>


                            <div class="unit-value">

                                ${formatUnit(
                                    sideBAmount
                                )}

                            </div>


                            <div class="unit-label">

                                UNIT

                            </div>

                        </div>


                    </div>



                    <!-- ======================================
                         WINNER
                    ======================================= -->

                    <div class="winner-box">

                        ${getWinnerText(
                            sideAUnit,
                            sideBUnit
                        )}

                    </div>


                </div>


            </div>



            <!-- ==========================================
                 FOOTER
            =========================================== -->

            <div class="competition-card-footer">

                Collection calculated from
                Daily Report data for the selected
                competition date.

            </div>


        </article>

    `;

}


// ======================================================
// RENDER ALL COMPETITIONS
// ======================================================

function renderCompetitions() {

    if (
        !competitionList
    ) {

        return;

    }


    const dailyMap =
        buildDailyMap();


    if (
        !competitions.length
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


    let html = "";


    competitions.forEach(
        (competition) => {

            html +=
                renderCompetition(
                    competition,
                    dailyMap
                );

        }
    );


    competitionList.innerHTML =
        html;

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


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


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
// LOAD ALL DATA
// ======================================================

async function loadData() {

    try {

        // ==============================================
        // LOADING ON
        // ==============================================

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


        // ==============================================
        // LOAD
        // ==============================================

        await loadEmployees();


        await Promise.all([

            loadCompetitions(),

            loadCollectionData(
                DAILY_ENTRY_COLLECTION
            )
                .then(
                    (data) => {

                        dailyEntries =
                            data;

                    }
                ),

            loadCollectionData(
                TEACHER_ENTRIES_COLLECTION
            )
                .then(
                    (data) => {

                        teacherEntries =
                            data;

                    }
                )

        ]);


        // ==============================================
        // MERGE COLLECTION DATA
        // ==============================================

        allCollectionEntries = [

            ...dailyEntries,

            ...teacherEntries

        ];


        // ==============================================
        // DEBUG
        // ==============================================

        console.log(
            "Daily Entry:",
            dailyEntries.length
        );


        console.log(
            "Teacher Entries:",
            teacherEntries.length
        );


        console.log(
            "Combined Collection Entries:",
            allCollectionEntries.length
        );


        console.log(
            "Competitions:",
            competitions.length
        );


        // ==============================================
        // RENDER
        // ==============================================

        renderCompetitions();


        // ==============================================
        // LOADING OFF
        // ==============================================

        if (loadingBox) {

            loadingBox.style.display =
                "none";

        }

    }

    catch (error) {

        console.error(
            "Competition Load Error:",
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

loadData();
