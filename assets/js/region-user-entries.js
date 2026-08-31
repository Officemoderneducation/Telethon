// ======================================================
// TELETHON
// ADMIN - REGION USER TEACHER ENTRIES
//
// DATA SOURCE:
// teacher_entries ONLY
//
// ADMIN FUNCTIONS:
// 1. View entries
// 2. Search
// 3. Region filter
// 4. Date filter
// 5. Edit entry
// 6. Delete entry
//
// IMPORTANT:
// daily_entry is NEVER touched.
// ======================================================


import {
    db
} from "./firebase-config.js";


import {
    collection,
    getDocs,
    query,
    orderBy,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// COLLECTION
// ======================================================

const TEACHER_ENTRIES_COLLECTION =
    "teacher_entries";


// ======================================================
// DATA
// ======================================================

let teacherEntries = [];

let filteredEntries = [];


// ======================================================
// HTML ELEMENTS
// ======================================================

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


// ======================================================
// LOAD ENTRIES
// ======================================================

async function loadTeacherEntries() {

    try {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="loading"
                >

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Loading Teacher Entries...

                </td>

            </tr>

        `;


        let snapshot;


        // ==================================================
        // FIRST TRY createdAt ORDER
        // ==================================================

        try {

            const entriesQuery =
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


            snapshot =
                await getDocs(
                    entriesQuery
                );

        }

        catch (orderError) {

            console.warn(
                "OrderBy failed. Loading without orderBy.",
                orderError
            );


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
            (docSnapshot) => {

                teacherEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        // ==================================================
        // SORT
        // ==================================================

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
            "================================="
        );

        console.log(
            "TOTAL TEACHER ENTRIES:",
            teacherEntries.length
        );

        console.log(
            "TEACHER ENTRIES:",
            teacherEntries
        );

        console.log(
            "================================="
        );


        populateRegions();

        applyFilters();

    }

    catch (error) {

        console.error(
            "Teacher Entries Load Error:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="no-data"
                >

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    Unable to load Teacher Entries.

                    <br><br>

                    ${escapeHTML(
                        error.message || ""
                    )}

                </td>

            </tr>

        `;

    }

}


// ======================================================
// GET FIELD
// ======================================================

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
// GET TIME
// ======================================================

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


    // Timestamp object

    if (
        value.seconds !== undefined
    ) {

        return (
            Number(
                value.seconds
            )
            * 1000
        );

    }


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


// ======================================================
// GET AMOUNT
// ======================================================

function getAmount(entry) {

    const value =
        getValue(
            entry,
            [

                "amount",

                "collection",

                "collectionAmount",

                "totalAmount"

            ]
        );


    if (
        typeof value === "number"
    ) {

        return value;

    }


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


// ======================================================
// GET DATE
// ======================================================

function getEntryDate(entry) {

    const value =
        getValue(
            entry,
            [

                "date",

                "entryDate",

                "collectionDate"

            ]
        );


    if (!value) {

        const time =
            getTimeValue(entry);


        if (time) {

            return formatDisplayDate(
                new Date(time)
            );

        }


        return "";

    }


    // Firestore Timestamp

    if (
        typeof value.toDate ===
        "function"
    ) {

        return formatDisplayDate(
            value.toDate()
        );

    }


    // Timestamp object

    if (
        value.seconds !== undefined
    ) {

        return formatDisplayDate(

            new Date(
                Number(
                    value.seconds
                )
                * 1000
            )

        );

    }


    return String(value);

}


// ======================================================
// DATE FOR FILTER
// ======================================================

function getFilterDate(entry) {

    const value =
        getValue(
            entry,
            [

                "date",

                "entryDate",

                "collectionDate"

            ]
        );


    if (
        typeof value === "string"
        &&
        value
    ) {

        // YYYY-MM-DD

        if (
            /^\d{4}-\d{2}-\d{2}$/
            .test(value)
        ) {

            return value;

        }


        // DD/MM/YYYY

        if (
            /^\d{2}\/\d{2}\/\d{4}$/
            .test(value)
        ) {

            const parts =
                value.split("/");


            return (
                parts[2]
                +
                "-"
                +
                parts[1]
                +
                "-"
                +
                parts[0]
            );

        }


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


    if (
        value
        &&
        value.seconds !== undefined
    ) {

        return getDateInputFormat(

            new Date(
                Number(
                    value.seconds
                )
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


// ======================================================
// DATE INPUT FORMAT
// ======================================================

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


    return (
        year
        +
        "-"
        +
        month
        +
        "-"
        +
        day
    );

}


// ======================================================
// DISPLAY DATE
// ======================================================

function formatDisplayDate(date) {

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


// ======================================================
// ENTRY TIME
// ======================================================

function getEntryTime(entry) {

    const time =
        getTimeValue(entry);


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


// ======================================================
// REGIONS
// ======================================================

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

                        "regionName"

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
            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );


    regionFilter.innerHTML = `

        <option value="">
            All Regions
        </option>

    `;


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


    regionFilter.value =
        currentValue;

}


// ======================================================
// FILTER
// ======================================================

function applyFilters() {

    const search =
        normalize(
            searchInput?.value
            ||
            ""
        );


    const selectedRegion =
        normalize(
            regionFilter?.value
            ||
            ""
        );


    const from =
        fromDate?.value
        ||
        "";


    const to =
        toDate?.value
        ||
        "";


    filteredEntries =
        teacherEntries.filter(
            (entry) => {

                const teacherName =
                    normalize(
                        getValue(
                            entry,
                            [

                                "teacherName",

                                "teacher_name",

                                "employeeName",

                                "name"

                            ]
                        )
                    );


                const employeeCode =
                    normalize(
                        getValue(
                            entry,
                            [

                                "employeeCode",

                                "employee_code",

                                "empCode",

                                "teacherCode"

                            ]
                        )
                    );


                const region =
                    normalize(
                        getValue(
                            entry,
                            [

                                "region",

                                "regionName"

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


// ======================================================
// RENDER TABLE
// ======================================================

function renderTable() {

    if (!tableBody) {

        return;

    }


    if (
        filteredEntries.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
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

                            "teacher_name",

                            "employeeName",

                            "name"

                        ]
                    )
                    || "-";


                const employeeCode =
                    getValue(
                        entry,
                        [

                            "employeeCode",

                            "employee_code",

                            "empCode",

                            "teacherCode"

                        ]
                    )
                    || "-";


                const region =
                    getValue(
                        entry,
                        [

                            "region",

                            "regionName"

                        ]
                    )
                    || "-";


                const state =
                    getValue(
                        entry,
                        [

                            "state",

                            "stateName"

                        ]
                    )
                    || "-";


                const city =
                    getValue(
                        entry,
                        [

                            "city",

                            "cityName"

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


                        <td>

                            <div
                                class="action-buttons"
                            >

                                <button
                                    type="button"
                                    class="edit-btn"
                                    onclick="editTeacherEntry('${escapeAttribute(entry.id)}')"
                                >

                                    <i class="fa-solid fa-pen"></i>

                                    Edit

                                </button>


                                <button
                                    type="button"
                                    class="delete-btn"
                                    onclick="deleteTeacherEntry('${escapeAttribute(entry.id)}')"
                                >

                                    <i class="fa-solid fa-trash"></i>

                                    Delete

                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }

        ).join("");

}


// ======================================================
// SUMMARY
// ======================================================

function updateSummary() {

    if (totalEntries) {

        totalEntries.textContent =
            filteredEntries.length;

    }


    let total =
        0;


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

                        "employee_code",

                        "empCode",

                        "teacherCode"

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


// ======================================================
// EDIT ENTRY
// ======================================================

async function editTeacherEntry(
    entryId
) {

    const entry =
        teacherEntries.find(
            (item) =>
                item.id === entryId
        );


    if (!entry) {

        alert(
            "Entry nahi mili."
        );

        return;

    }


    const currentTeacherName =
        getValue(
            entry,
            [
                "teacherName",
                "teacher_name",
                "employeeName",
                "name"
            ]
        );


    const currentEmployeeCode =
        getValue(
            entry,
            [
                "employeeCode",
                "employee_code",
                "empCode",
                "teacherCode"
            ]
        );


    const currentRegion =
        getValue(
            entry,
            [
                "region",
                "regionName"
            ]
        );


    const currentState =
        getValue(
            entry,
            [
                "state",
                "stateName"
            ]
        );


    const currentCity =
        getValue(
            entry,
            [
                "city",
                "cityName"
            ]
        );


    const currentDate =
        getFilterDate(
            entry
        );


    const currentAmount =
        getAmount(
            entry
        );


    // ==================================================
    // TEACHER NAME
    // ==================================================

    const teacherName =
        prompt(
            "Teacher Name:",
            currentTeacherName
        );


    if (
        teacherName === null
    ) {

        return;

    }


    // ==================================================
    // EMPLOYEE CODE
    // ==================================================

    const employeeCode =
        prompt(
            "Employee Code:",
            currentEmployeeCode
        );


    if (
        employeeCode === null
    ) {

        return;

    }


    // ==================================================
    // REGION
    // ==================================================

    const region =
        prompt(
            "Region:",
            currentRegion
        );


    if (
        region === null
    ) {

        return;

    }


    // ==================================================
    // STATE
    // ==================================================

    const state =
        prompt(
            "State:",
            currentState
        );


    if (
        state === null
    ) {

        return;

    }


    // ==================================================
    // CITY
    // ==================================================

    const city =
        prompt(
            "City:",
            currentCity
        );


    if (
        city === null
    ) {

        return;

    }


    // ==================================================
    // DATE
    // ==================================================

    const date =
        prompt(
            "Entry Date (YYYY-MM-DD):",
            currentDate
        );


    if (
        date === null
    ) {

        return;

    }


    // ==================================================
    // AMOUNT
    // ==================================================

    const amountText =
        prompt(
            "Amount:",
            currentAmount
        );


    if (
        amountText === null
    ) {

        return;

    }


    const amount =
        Number(
            String(
                amountText
            ).replace(
                /[^\d.-]/g,
                ""
            )
        );


    if (
        !amount
        ||
        amount <= 0
    ) {

        alert(
            "Please enter a valid amount."
        );

        return;

    }


    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(
                date
            )
    ) {

        alert(
            "Date format YYYY-MM-DD hona chahiye."
        );

        return;

    }


    const confirmEdit =
        confirm(
            "Kya aap is Teacher Entry ko update karna chahte hain?"
        );


    if (!confirmEdit) {

        return;

    }


    try {

        // ==================================================
        // UPDATE FIRESTORE DOCUMENT
        // ==================================================

        const entryRef =
            doc(
                db,
                TEACHER_ENTRIES_COLLECTION,
                entryId
            );


        await updateDoc(
            entryRef,
            {

                employeeCode:
                    employeeCode.trim(),

                employee_code:
                    employeeCode.trim(),

                teacherName:
                    teacherName.trim(),

                teacher_name:
                    teacherName.trim(),

                region:
                    region.trim(),

                state:
                    state.trim(),

                city:
                    city.trim(),

                date:
                    date,

                entryDate:
                    date,

                amount:
                    amount,

                collection:
                    amount,

                updatedAt:
                    serverTimestamp()

            }
        );


        alert(
            "Teacher Entry successfully updated."
        );


        await loadTeacherEntries();

    }

    catch (error) {

        console.error(
            "Edit Entry Error:",
            error
        );


        alert(
            "Entry update nahi ho saki.\n\n"
            +
            error.message
        );

    }

}


// ======================================================
// DELETE ENTRY
// ======================================================

async function deleteTeacherEntry(
    entryId
) {

    const entry =
        teacherEntries.find(
            (item) =>
                item.id === entryId
        );


    if (!entry) {

        alert(
            "Entry nahi mili."
        );

        return;

    }


    const teacherName =
        getValue(
            entry,
            [
                "teacherName",
                "teacher_name",
                "employeeName",
                "name"
            ]
        )
        ||
        "Unknown Teacher";


    const amount =
        getAmount(
            entry
        );


    const date =
        getEntryDate(
            entry
        )
        ||
        "-";


    const confirmed =
        confirm(

            "DELETE ENTRY\n\n"
            +
            "Teacher: "
            +
            teacherName
            +
            "\n"
            +
            "Date: "
            +
            date
            +
            "\n"
            +
            "Amount: ₹"
            +
            amount.toLocaleString(
                "en-IN"
            )
            +
            "\n\n"
            +
            "Kya aap is entry ko permanently delete karna chahte hain?"

        );


    if (!confirmed) {

        return;

    }


    try {

        // ==================================================
        // DELETE ONLY teacher_entries DOCUMENT
        // ==================================================

        const entryRef =
            doc(
                db,
                TEACHER_ENTRIES_COLLECTION,
                entryId
            );


        await deleteDoc(
            entryRef
        );


        alert(
            "Teacher Entry successfully deleted."
        );


        await loadTeacherEntries();

    }

    catch (error) {

        console.error(
            "Delete Entry Error:",
            error
        );


        alert(
            "Entry delete nahi ho saki.\n\n"
            +
            error.message
        );

    }

}


// ======================================================
// CLEAR FILTERS
// ======================================================

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
// ESCAPE ATTRIBUTE
// ======================================================

function escapeAttribute(value) {

    return String(
        value ?? ""
    )

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        );

}


// ======================================================
// FILTER EVENTS
// ======================================================

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


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.loadTeacherEntries =
    loadTeacherEntries;


window.clearFilters =
    clearFilters;


window.editTeacherEntry =
    editTeacherEntry;


window.deleteTeacherEntry =
    deleteTeacherEntry;


// ======================================================
// INITIAL LOAD
// ======================================================

loadTeacherEntries();
