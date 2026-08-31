// ======================================
// TELETHON
// ADMIN - REGION USER TEACHER ENTRIES
//
// DATA SOURCE:
// teacher_entries ONLY
//
// IMPORTANT:
// 1. daily_entry is NOT used.
// 2. This page is for Admin.
// 3. All teacher_entries are displayed.
// ======================================


// ======================================
// FIREBASE IMPORTS
// ======================================

import {
    db
} from "./firebase-config.js";


import {

    collection,
    getDocs,
    query,
    orderBy

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================
// COLLECTION
// ======================================

const TEACHER_ENTRIES_COLLECTION =
    "teacher_entries";


// ======================================
// GLOBAL DATA
// ======================================

let teacherEntries = [];

let filteredEntries = [];


// ======================================
// HTML ELEMENTS
// ======================================

const tableBody =
    document.getElementById(
        "teacherEntriesTable"
    );


const totalEntries =
    document.getElementById(
        "totalEntries"
    );


const totalTeachers =
    document.getElementById(
        "totalTeachers"
    );


const totalAmount =
    document.getElementById(
        "totalAmount"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const regionFilter =
    document.getElementById(
        "regionFilter"
    );


const fromDate =
    document.getElementById(
        "fromDate"
    );


const toDate =
    document.getElementById(
        "toDate"
    );


// ======================================
// LOAD TEACHER ENTRIES
// ======================================

async function loadTeacherEntries() {

    try {

        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="loading"
                    >
                        Loading Teacher Entries...
                    </td>

                </tr>

            `;

        }


        let snapshot;


        // ----------------------------------
        // TRY ORDERED QUERY
        // ----------------------------------

        try {

            const q = query(

                collection(
                    db,
                    TEACHER_ENTRIES_COLLECTION
                ),

                orderBy(
                    "createdAt",
                    "desc"
                )

            );


            snapshot =
                await getDocs(q);

        }

        catch (queryError) {

            console.warn(
                "createdAt order query failed. Loading normally:",
                queryError
            );


            // ----------------------------------
            // FALLBACK - LOAD ALL DOCUMENTS
            // ----------------------------------

            snapshot =
                await getDocs(

                    collection(
                        db,
                        TEACHER_ENTRIES_COLLECTION
                    )

                );

        }


        teacherEntries = [];


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data() || {};


                teacherEntries.push({

                    id: docSnap.id,

                    ...data

                });

            }
        );


        // ----------------------------------
        // SORT NEWEST FIRST
        // ----------------------------------

        teacherEntries.sort(

            (a, b) => {

                return (
                    getTimeValue(b)
                    -
                    getTimeValue(a)
                );

            }

        );


        console.log(
            "Teacher Entries Loaded:",
            teacherEntries
        );


        populateRegions();


        applyFilters();

    }

    catch (error) {

        console.error(
            "Teacher Entries Load Error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="no-data"
                    >
                        Unable to load Teacher Entries
                    </td>

                </tr>

            `;

        }

    }

}


// ======================================
// GET TIME VALUE
// ======================================

function getTimeValue(entry) {

    const value =

        entry.createdAt
        ||
        entry.created_at
        ||
        entry.timestamp
        ||
        entry.entryTime
        ||
        0;


    if (!value) {

        return 0;

    }


    // Firestore Timestamp

    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime();

    }


    // Timestamp Object

    if (
        value.seconds
    ) {

        return value.seconds
            * 1000;

    }


    // Date String / Date

    const date =
        new Date(value);


    if (
        !isNaN(
            date.getTime()
        )
    ) {

        return date.getTime();

    }


    return 0;

}


// ======================================
// GET FIELD VALUE
// ======================================

function getValue(
    entry,
    fields
) {

    for (
        const field of fields
    ) {

        if (
            entry[field] !== undefined
            &&
            entry[field] !== null
            &&
            entry[field] !== ""
        ) {

            return entry[field];

        }

    }


    return "";

}


// ======================================
// NORMALIZE
// ======================================

function normalize(value) {

    return String(
        value ?? ""
    )

        .trim()

        .toLowerCase();

}


// ======================================
// GET AMOUNT
// ======================================

function getAmount(entry) {

    const value =
        getValue(
            entry,
            [

                "amount",

                "collection",

                "collectionAmount",

                "totalAmount",

                "amountCollected"

            ]
        );


    const number =
        Number(

            String(
                value ?? 0
            )

                .replace(
                    /[^\d.-]/g,
                    ""
                )

        );


    return isNaN(number)
        ? 0
        : number;

}


// ======================================
// GET ENTRY DATE
// ======================================

function getEntryDate(entry) {

    const value =
        getValue(
            entry,
            [

                "date",

                "entryDate",

                "collectionDate",

                "selectedDate"

            ]
        );


    if (value) {

        // Firestore Timestamp

        if (
            typeof value.toDate ===
            "function"
        ) {

            return formatDate(
                value.toDate()
            );

        }


        // Timestamp Object

        if (
            value.seconds
        ) {

            return formatDate(

                new Date(
                    value.seconds
                    * 1000
                )

            );

        }


        return String(value);

    }


    const time =
        getTimeValue(entry);


    if (time) {

        return formatDate(
            new Date(time)
        );

    }


    return "";

}


// ======================================
// FORMAT DATE
// ======================================

function formatDate(date) {

    if (
        !date
        ||
        isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date
        .toLocaleDateString(
            "en-GB"
        );

}


// ======================================
// DATE FOR FILTER
// ======================================

function getFilterDate(entry) {

    const value =
        getValue(
            entry,
            [

                "date",

                "entryDate",

                "collectionDate",

                "selectedDate"

            ]
        );


    if (
        typeof value === "string"
    ) {

        // YYYY-MM-DD

        if (
            /^\d{4}-\d{2}-\d{2}$/
            .test(value)
        ) {

            return value;

        }


        // Try normal date conversion

        const parsed =
            new Date(value);


        if (
            !isNaN(
                parsed.getTime()
            )
        ) {

            return getDateInputFormat(
                parsed
            );

        }

    }


    // Firestore Timestamp

    if (
        value
        &&
        typeof value.toDate ===
        "function"
    ) {

        return getDateInputFormat(
            value.toDate()
        );

    }


    // Timestamp object

    if (
        value
        &&
        value.seconds
    ) {

        return getDateInputFormat(

            new Date(
                value.seconds
                * 1000
            )

        );

    }


    const time =
        getTimeValue(entry);


    if (time) {

        return getDateInputFormat(
            new Date(time)
        );

    }


    return "";

}


// ======================================
// DATE INPUT FORMAT
// YYYY-MM-DD
// ======================================

function getDateInputFormat(date) {

    if (
        !date
        ||
        isNaN(
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


    return `${year}-${month}-${day}`;

}


// ======================================
// POPULATE REGIONS
// ======================================

function populateRegions() {

    if (!regionFilter) {

        return;

    }


    const currentValue =
        regionFilter.value;


    const regions =
        new Set();


    teacherEntries.forEach(
        (entry) => {

            const region =
                getValue(
                    entry,
                    [

                        "region",

                        "regionName",

                        "teacherRegion"

                    ]
                );


            if (region) {

                regions.add(
                    String(region).trim()
                );

            }

        }
    );


    const sortedRegions =
        [...regions]

            .filter(Boolean)

            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );


    regionFilter.innerHTML =
        `<option value="">
            All Regions
        </option>`;


    sortedRegions.forEach(
        (region) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                region;


            option.textContent =
                region;


            regionFilter.appendChild(
                option
            );

        }
    );


    // Restore previous selection

    const optionExists =
        [...regionFilter.options]
            .some(
                option =>
                    option.value ===
                    currentValue
            );


    if (optionExists) {

        regionFilter.value =
            currentValue;

    }

}


// ======================================
// APPLY FILTERS
// ======================================

function applyFilters() {

    const search =
        normalize(
            searchInput
                ? searchInput.value
                : ""
        );


    const selectedRegion =
        normalize(
            regionFilter
                ? regionFilter.value
                : ""
        );


    const from =
        fromDate
            ? fromDate.value
            : "";


    const to =
        toDate
            ? toDate.value
            : "";


    filteredEntries =
        teacherEntries.filter(
            (entry) => {

                const teacherName =
                    normalize(

                        getValue(
                            entry,
                            [

                                "teacherName",

                                "employeeName",

                                "name",

                                "teacher_name",

                                "fullName"

                            ]
                        )

                    );


                const employeeCode =
                    normalize(

                        getValue(
                            entry,
                            [

                                "employeeCode",

                                "empCode",

                                "employee_code",

                                "teacherCode",

                                "emp_code"

                            ]
                        )

                    );


                const region =
                    normalize(

                        getValue(
                            entry,
                            [

                                "region",

                                "regionName",

                                "teacherRegion"

                            ]
                        )

                    );


                const entryDate =
                    getFilterDate(
                        entry
                    );


                // SEARCH

                if (
                    search
                    &&
                    !teacherName.includes(
                        search
                    )
                    &&
                    !employeeCode.includes(
                        search
                    )
                ) {

                    return false;

                }


                // REGION

                if (
                    selectedRegion
                    &&
                    region !==
                    selectedRegion
                ) {

                    return false;

                }


                // FROM DATE

                if (
                    from
                    &&
                    entryDate
                    &&
                    entryDate < from
                ) {

                    return false;

                }


                // TO DATE

                if (
                    to
                    &&
                    entryDate
                    &&
                    entryDate > to
                ) {

                    return false;

                }


                return true;

            }
        );


    renderTable();


    updateSummary();

}


// ======================================
// RENDER TABLE
// ======================================

function renderTable() {

    if (!tableBody) {

        console.error(
            "teacherEntriesTable not found"
        );

        return;

    }


    if (
        filteredEntries.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="no-data"
                >
                    No Teacher Entries Found
                </td>

            </tr>

        `;


        return;

    }


    tableBody.innerHTML =
        filteredEntries.map(

            (entry, index) => {

                const teacherName =
                    getValue(
                        entry,
                        [

                            "teacherName",

                            "employeeName",

                            "name",

                            "teacher_name",

                            "fullName"

                        ]
                    )
                    || "-";


                const employeeCode =
                    getValue(
                        entry,
                        [

                            "employeeCode",

                            "empCode",

                            "employee_code",

                            "teacherCode",

                            "emp_code"

                        ]
                    )
                    || "-";


                const region =
                    getValue(
                        entry,
                        [

                            "region",

                            "regionName",

                            "teacherRegion"

                        ]
                    )
                    || "-";


                const state =
                    getValue(
                        entry,
                        [

                            "state",

                            "stateName",

                            "teacherState"

                        ]
                    )
                    || "-";


                const city =
                    getValue(
                        entry,
                        [

                            "city",

                            "cityName",

                            "teacherCity"

                        ]
                    )
                    || "-";


                const date =
                    getEntryDate(
                        entry
                    )
                    || "-";


                const amount =
                    getAmount(
                        entry
                    );


                const time =
                    getEntryTime(
                        entry
                    );


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHTML(
                                teacherName
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                employeeCode
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                region
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                state
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                city
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                date
                            )}
                        </td>

                        <td class="amount">

                            ₹${amount.toLocaleString(
                                "en-IN"
                            )}

                        </td>

                        <td>

                            ${escapeHTML(
                                time
                            )}

                        </td>

                    </tr>

                `;

            }

        )

        .join("");

}


// ======================================
// GET ENTRY TIME
// ======================================

function getEntryTime(entry) {

    const time =
        getTimeValue(
            entry
        );


    if (!time) {

        return "-";

    }


    return new Date(time)
        .toLocaleTimeString(
            "en-IN",
            {

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    true

            }
        );

}


// ======================================
// UPDATE SUMMARY
// ======================================

function updateSummary() {

    if (totalEntries) {

        totalEntries.textContent =
            filteredEntries.length;

    }


    let total = 0;


    const teachers =
        new Set();


    filteredEntries.forEach(
        (entry) => {

            total +=
                getAmount(
                    entry
                );


            const code =
                getValue(
                    entry,
                    [

                        "employeeCode",

                        "empCode",

                        "employee_code",

                        "teacherCode",

                        "emp_code"

                    ]
                );


            if (code) {

                teachers.add(
                    normalize(code)
                );

            }

        }
    );


    if (totalTeachers) {

        totalTeachers.textContent =
            teachers.size;

    }


    if (totalAmount) {

        totalAmount.textContent =
            "₹"
            +
            total.toLocaleString(
                "en-IN"
            );

    }

}


// ======================================
// ESCAPE HTML
// ======================================

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


// ======================================
// CLEAR FILTERS
// ======================================

function clearFilters() {

    if (searchInput) {

        searchInput.value =
            "";

    }


    if (regionFilter) {

        regionFilter.value =
            "";

    }


    if (fromDate) {

        fromDate.value =
            "";

    }


    if (toDate) {

        toDate.value =
            "";

    }


    applyFilters();

}


// ======================================
// GLOBAL FUNCTIONS
// ======================================

window.loadTeacherEntries =
    loadTeacherEntries;


window.clearFilters =
    clearFilters;


// ======================================
// FILTER EVENTS
// ======================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


if (regionFilter) {

    regionFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (fromDate) {

    fromDate.addEventListener(
        "change",
        applyFilters
    );

}


if (toDate) {

    toDate.addEventListener(
        "change",
        applyFilters
    );

}


// ======================================
// INITIAL LOAD
// ======================================

loadTeacherEntries();
