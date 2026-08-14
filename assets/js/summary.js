/* ============================================================
   TELETHON
   TEACHER SUMMARY
   assets/js/summary.js

   PURPOSE:
   - Show only logged-in Teacher's own Daily Collection
   - Total Collection
   - Today's Collection
   - This Month Collection
   - Total Entries
   - Date Filter
   - Remarks Search
   ============================================================ */


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


import {
    db
} from "./firebase-config.js";



/* ============================================================
   GLOBAL VARIABLES
   ============================================================ */

let allEntries = [];

let filteredEntries = [];

let loggedInEmpCode = "";



/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeSummary();

    }
);



/* ============================================================
   INITIALIZE
   ============================================================ */

async function initializeSummary() {

    try {

        /* ==========================================
           GET LOGGED-IN EMPLOYEE CODE
        ========================================== */

        loggedInEmpCode =
            localStorage.getItem(
                "loggedInEmpCode"
            );


        if (
            !loggedInEmpCode ||
            loggedInEmpCode.trim() === ""
        ) {

            showPageError(
                "Teacher login session nahi mili. Please login again."
            );

            return;

        }


        loggedInEmpCode =
            loggedInEmpCode.trim();


        /* ==========================================
           LOAD TEACHER INFO
        ========================================== */

        await loadTeacherInfo();


        /* ==========================================
           LOAD DAILY COLLECTION
        ========================================== */

        await loadDailyEntries();


        /* ==========================================
           SET FILTER EVENTS
        ========================================== */

        setupFilterEvents();


        /* ==========================================
           INITIAL REPORT
        ========================================== */

        filteredEntries =
            [...allEntries];


        renderSummary();


        renderTable();


    }
    catch (error) {

        console.error(
            "Summary Initialization Error:",
            error
        );


        showPageError(
            "Summary load nahi ho saki. Please page refresh karein."
        );

    }

}



/* ============================================================
   LOAD TEACHER INFO
   ============================================================ */

async function loadTeacherInfo() {

    try {

        const teacherInfo =
            document.getElementById(
                "teacherInfo"
            );


        const topUserName =
            document.getElementById(
                "topUserName"
            );


        /*
         * Teacher name localStorage se available
         * ho to use karenge.
         */

        const savedTeacherName =
            localStorage.getItem(
                "teacherUserName"
            );


        const savedRegionUserName =
            localStorage.getItem(
                "regionUserName"
            );


        const teacherName =
            savedTeacherName ||
            savedRegionUserName ||
            "";


        if (teacherName) {

            if (topUserName) {

                topUserName.textContent =
                    teacherName;

            }

        }
        else {

            if (topUserName) {

                topUserName.textContent =
                    loggedInEmpCode;

            }

        }


        if (teacherInfo) {

            if (teacherName) {

                teacherInfo.innerHTML = `

                    <i class="fa-solid fa-user"></i>

                    <span>

                        Teacher:
                        <strong>
                            ${escapeHtml(
                                teacherName
                            )}
                        </strong>

                        &nbsp;&nbsp;|&nbsp;&nbsp;

                        Employee Code:
                        <strong>
                            ${escapeHtml(
                                loggedInEmpCode
                            )}
                        </strong>

                    </span>

                `;

            }
            else {

                teacherInfo.innerHTML = `

                    <i class="fa-solid fa-user"></i>

                    <span>

                        Employee Code:
                        <strong>
                            ${escapeHtml(
                                loggedInEmpCode
                            )}
                        </strong>

                    </span>

                `;

            }

        }

    }
    catch (error) {

        console.error(
            "Teacher Info Error:",
            error
        );

    }

}



/* ============================================================
   LOAD DAILY ENTRIES
   ============================================================ */

async function loadDailyEntries() {

    const tableBody =
        document.getElementById(
            "summaryTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="loading-cell"
                >

                    <i
                        class="fa-solid fa-spinner fa-spin"
                    ></i>

                    Loading Collection...

                </td>

            </tr>

        `;

    }


    try {

        /*
         * Existing Firestore collection:
         *
         * daily_entry
         *
         * Hum complete collection read kar rahe hain
         * aur Employee Code ke basis par
         * logged-in Teacher ki entries filter karenge.
         */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "daily_entry"
                )
            );


        allEntries = [];


        snapshot.forEach(
            function (docSnap) {

                const data =
                    docSnap.data();


                /*
                 * Possible Employee Code fields
                 */

                const employeeCode =
                    String(
                        data.employeeCode ??
                        data.employee_code ??
                        data.empCode ??
                        data.emp_code ??
                        data.employee ??
                        ""
                    )
                    .trim();


                /*
                 * Employee Code match
                 */

                if (
                    employeeCode.toLowerCase() !==
                    loggedInEmpCode.toLowerCase()
                ) {

                    return;

                }


                /*
                 * DATE
                 */

                const entryDate =
                    getEntryDate(
                        data
                    );


                /*
                 * AMOUNT
                 */

                const amount =
                    getEntryAmount(
                        data
                    );


                /*
                 * REMARKS
                 */

                const remarks =
                    String(
                        data.remarks ??
                        data.remark ??
                        data.description ??
                        ""
                    )
                    .trim();


                allEntries.push({

                    id:
                        docSnap.id,

                    employeeCode:
                        employeeCode,

                    date:
                        entryDate,

                    amount:
                        amount,

                    remarks:
                        remarks,

                    raw:
                        data

                });

            }
        );


        /*
         * Latest date first
         */

        allEntries.sort(
            function (a, b) {

                return (
                    getDateTimeValue(b.date) -
                    getDateTimeValue(a.date)
                );

            }
        );


        console.log(
            "Teacher Summary Entries:",
            allEntries
        );


    }
    catch (error) {

        console.error(
            "Daily Entry Load Error:",
            error
        );


        allEntries = [];


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="3"
                        class="error-cell"
                    >

                        <i
                            class="fa-solid fa-triangle-exclamation"
                        ></i>

                        Collection load nahi ho saki.

                    </td>

                </tr>

            `;

        }


        throw error;

    }

}



/* ============================================================
   GET ENTRY DATE
   ============================================================ */

function getEntryDate(data) {

    /*
     * Different possible date field names
     */

    const possibleDate =
        data.date ??
        data.entryDate ??
        data.collectionDate ??
        data.dailyDate ??
        data.createdAt ??
        "";


    /*
     * Firestore Timestamp
     */

    if (
        possibleDate &&
        typeof possibleDate.toDate ===
        "function"
    ) {

        const date =
            possibleDate.toDate();


        return formatDateForStorage(
            date
        );

    }


    /*
     * JavaScript Date
     */

    if (
        possibleDate instanceof Date
    ) {

        return formatDateForStorage(
            possibleDate
        );

    }


    /*
     * String date
     */

    if (
        typeof possibleDate ===
        "string"
    ) {

        const value =
            possibleDate.trim();


        /*
         * YYYY-MM-DD
         */

        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(value)
        ) {

            return value;

        }


        /*
         * Try normal Date parsing
         */

        const parsed =
            new Date(value);


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return formatDateForStorage(
                parsed
            );

        }

    }


    return "";

}



/* ============================================================
   GET ENTRY AMOUNT
   ============================================================ */

function getEntryAmount(data) {

    const possibleAmount =
        data.amount ??
        data.collectionAmount ??
        data.dailyAmount ??
        data.totalAmount ??
        data.collection ??
        0;


    if (
        typeof possibleAmount ===
        "number"
    ) {

        return Number.isFinite(
            possibleAmount
        )
            ? possibleAmount
            : 0;

    }


    /*
     * String amount
     */

    const cleaned =
        String(
            possibleAmount
        )
        .replace(
            /₹/g,
            ""
        )
        .replace(
            /,/g,
            ""
        )
        .trim();


    const amount =
        parseFloat(
            cleaned
        );


    return Number.isFinite(
        amount
    )
        ? amount
        : 0;

}



/* ============================================================
   FILTER EVENTS
   ============================================================ */

function setupFilterEvents() {

    const applyFilter =
        document.getElementById(
            "applyFilter"
        );


    const resetFilter =
        document.getElementById(
            "resetFilter"
        );


    const searchFilter =
        document.getElementById(
            "searchFilter"
        );


    if (applyFilter) {

        applyFilter.addEventListener(
            "click",
            function () {

                applyFilters();

            }
        );

    }


    if (resetFilter) {

        resetFilter.addEventListener(
            "click",
            function () {

                resetFilters();

            }
        );

    }


    /*
     * Enter key on search
     */

    if (searchFilter) {

        searchFilter.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    applyFilters();

                }

            }
        );

    }

}



/* ============================================================
   APPLY FILTERS
   ============================================================ */

function applyFilters() {

    const fromDateInput =
        document.getElementById(
            "fromDate"
        );


    const toDateInput =
        document.getElementById(
            "toDate"
        );


    const searchInput =
        document.getElementById(
            "searchFilter"
        );


    const fromDate =
        fromDateInput
            ? fromDateInput.value
            : "";


    const toDate =
        toDateInput
            ? toDateInput.value
            : "";


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    filteredEntries =
        allEntries.filter(
            function (entry) {

                /* ==============================
                   FROM DATE
                ============================== */

                if (
                    fromDate &&
                    entry.date &&
                    entry.date < fromDate
                ) {

                    return false;

                }


                /* ==============================
                   TO DATE
                ============================== */

                if (
                    toDate &&
                    entry.date &&
                    entry.date > toDate
                ) {

                    return false;

                }


                /* ==============================
                   SEARCH REMARKS
                ============================== */

                if (search) {

                    const remarks =
                        String(
                            entry.remarks ||
                            ""
                        )
                        .toLowerCase();


                    const amount =
                        String(
                            entry.amount
                        )
                        .toLowerCase();


                    if (
                        !remarks.includes(
                            search
                        ) &&
                        !amount.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderTable();

    updateSelectedDateRange(
        fromDate,
        toDate
    );

}



/* ============================================================
   RESET FILTER
   ============================================================ */

function resetFilters() {

    const fromDate =
        document.getElementById(
            "fromDate"
        );


    const toDate =
        document.getElementById(
            "toDate"
        );


    const search =
        document.getElementById(
            "searchFilter"
        );


    if (fromDate) {

        fromDate.value = "";

    }


    if (toDate) {

        toDate.value = "";

    }


    if (search) {

        search.value = "";

    }


    filteredEntries =
        [...allEntries];


    renderTable();


    updateSelectedDateRange(
        "",
        ""
    );

}



/* ============================================================
   RENDER SUMMARY CARDS
   ============================================================ */

function renderSummary() {

    /*
     * TOTAL COLLECTION
     */

    const totalCollection =
        allEntries.reduce(
            function (total, entry) {

                return (
                    total +
                    Number(entry.amount || 0)
                );

            },
            0
        );


    /*
     * TODAY
     */

    const today =
        getTodayString();


    const todayCollection =
        allEntries.reduce(
            function (total, entry) {

                if (
                    entry.date ===
                    today
                ) {

                    return (
                        total +
                        Number(
                            entry.amount || 0
                        )
                    );

                }


                return total;

            },
            0
        );


    /*
     * CURRENT MONTH
     */

    const currentMonth =
        today.substring(
            0,
            7
        );


    const monthCollection =
        allEntries.reduce(
            function (total, entry) {

                if (
                    entry.date &&
                    entry.date.substring(
                        0,
                        7
                    ) === currentMonth
                ) {

                    return (
                        total +
                        Number(
                            entry.amount || 0
                        )
                    );

                }


                return total;

            },
            0
        );


    /*
     * TOTAL ENTRIES
     */

    const totalEntries =
        allEntries.length;


    /*
     * UPDATE DOM
     */

    setText(
        "totalCollection",
        formatCurrency(
            totalCollection
        )
    );


    setText(
        "todayCollection",
        formatCurrency(
            todayCollection
        )
    );


    setText(
        "monthCollection",
        formatCurrency(
            monthCollection
        )
    );


    setText(
        "totalEntries",
        String(
            totalEntries
        )
    );

}



/* ============================================================
   RENDER TABLE
   ============================================================ */

function renderTable() {

    const tableBody =
        document.getElementById(
            "summaryTableBody"
        );


    const resultCount =
        document.getElementById(
            "resultCount"
        );


    const tableGrandTotal =
        document.getElementById(
            "tableGrandTotal"
        );


    if (!tableBody) {
        return;
    }


    /*
     * RESULT COUNT
     */

    if (resultCount) {

        resultCount.textContent =
            filteredEntries.length +
            (
                filteredEntries.length === 1
                    ? " Entry"
                    : " Entries"
            );

    }


    /*
     * EMPTY
     */

    if (
        filteredEntries.length ===
        0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="empty-cell"
                >

                    <i
                        class="fa-solid fa-inbox"
                    ></i>

                    No collection entries found.

                </td>

            </tr>

        `;


        if (tableGrandTotal) {

            tableGrandTotal.textContent =
                formatCurrency(0);

        }


        return;

    }


    /*
     * FILTERED GRAND TOTAL
     */

    const filteredTotal =
        filteredEntries.reduce(
            function (total, entry) {

                return (
                    total +
                    Number(entry.amount || 0)
                );

            },
            0
        );


    if (tableGrandTotal) {

        tableGrandTotal.textContent =
            formatCurrency(
                filteredTotal
            );

    }


    /*
     * TABLE ROWS
     */

    tableBody.innerHTML =
        filteredEntries
            .map(
                function (entry) {

                    return `

                        <tr>

                            <td>
                                ${formatDisplayDate(
                                    entry.date
                                )}
                            </td>

                            <td
                                class="amount-cell"
                            >
                                ${formatCurrency(
                                    entry.amount
                                )}
                            </td>

                            <td
                                class="remarks-cell"
                            >
                                ${
                                    entry.remarks
                                        ? escapeHtml(
                                            entry.remarks
                                        )
                                        : "-"
                                }
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}



/* ============================================================
   UPDATE DATE RANGE TEXT
   ============================================================ */

function updateSelectedDateRange(
    fromDate,
    toDate
) {

    const element =
        document.getElementById(
            "selectedDateRange"
        );


    if (!element) {
        return;
    }


    if (
        !fromDate &&
        !toDate
    ) {

        element.textContent =
            "All entries";

        return;

    }


    if (
        fromDate &&
        toDate
    ) {

        element.textContent =
            formatDisplayDate(
                fromDate
            ) +
            " to " +
            formatDisplayDate(
                toDate
            );

        return;

    }


    if (fromDate) {

        element.textContent =
            "From " +
            formatDisplayDate(
                fromDate
            );

        return;

    }


    if (toDate) {

        element.textContent =
            "Up to " +
            formatDisplayDate(
                toDate
            );

    }

}



/* ============================================================
   PAGE ERROR
   ============================================================ */

function showPageError(
    message
) {

    const tableBody =
        document.getElementById(
            "summaryTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="error-cell"
                >

                    <i
                        class="fa-solid fa-triangle-exclamation"
                    ></i>

                    ${escapeHtml(
                        message
                    )}

                </td>

            </tr>

        `;

    }


    const teacherInfo =
        document.getElementById(
            "teacherInfo"
        );


    if (teacherInfo) {

        teacherInfo.innerHTML = `

            <i
                class="fa-solid fa-triangle-exclamation"
            ></i>

            <span>
                ${escapeHtml(
                    message
                )}
            </span>

        `;

    }


    setText(
        "totalCollection",
        "₹ 0"
    );


    setText(
        "todayCollection",
        "₹ 0"
    );


    setText(
        "monthCollection",
        "₹ 0"
    );


    setText(
        "totalEntries",
        "0"
    );


    setText(
        "tableGrandTotal",
        "₹ 0"
    );


    setText(
        "resultCount",
        "0 Entries"
    );

}



/* ============================================================
   FORMAT CURRENCY
   ============================================================ */

function formatCurrency(
    amount
) {

    const value =
        Number(amount) || 0;


    return (
        "₹ " +
        value.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );

}



/* ============================================================
   FORMAT DISPLAY DATE
   ============================================================ */

function formatDisplayDate(
    dateString
) {

    if (!dateString) {

        return "-";

    }


    /*
     * YYYY-MM-DD
     */

    const match =
        /^(\d{4})-(\d{2})-(\d{2})$/
            .exec(
                dateString
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


    return dateString;

}



/* ============================================================
   FORMAT DATE FOR STORAGE
   ============================================================ */

function formatDateForStorage(
    date
) {

    if (
        !date ||
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
        year +
        "-" +
        month +
        "-" +
        day
    );

}



/* ============================================================
   TODAY STRING
   ============================================================ */

function getTodayString() {

    return formatDateForStorage(
        new Date()
    );

}



/* ============================================================
   DATE TIME VALUE
   ============================================================ */

function getDateTimeValue(
    dateString
) {

    if (!dateString) {

        return 0;

    }


    const parts =
        dateString.split(
            "-"
        );


    if (
        parts.length !==
        3
    ) {

        return 0;

    }


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    return date.getTime();

}



/* ============================================================
   SET TEXT
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}



/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(
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
