// ======================================
// Telethon - Teacher Summary JS
// ======================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML ELEMENTS
// ======================================

const teacherInfo =
    document.getElementById("teacherInfo");

const topUserName =
    document.getElementById("topUserName");

const targetAmountElement =
    document.getElementById("targetAmount");

const totalCollectionElement =
    document.getElementById("totalCollection");

const remainingTargetElement =
    document.getElementById("remainingTarget");

const collectionPercentageElement =
    document.getElementById("collectionPercentage");

const collectionUnitsElement =
    document.getElementById("collectionUnits");

const progressPercentageElement =
    document.getElementById("progressPercentage");

const progressBar =
    document.getElementById("progressBar");

const progressCollectionElement =
    document.getElementById("progressCollection");

const progressTargetElement =
    document.getElementById("progressTarget");

const summaryTableBody =
    document.getElementById("summaryTableBody");

const entryCountElement =
    document.getElementById("entryCount");

const errorBox =
    document.getElementById("errorBox");


// ======================================
// CURRENT EMPLOYEE
// ======================================

let currentEmployee = null;


// ======================================
// PAGE START
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        checkTeacherLogin();

    }
);


// ======================================
// CHECK TEACHER LOGIN
// ======================================

async function checkTeacherLogin() {

    try {

        const empCode =
            localStorage.getItem(
                "loggedInEmpCode"
            );


        if (!empCode) {

            window.location.href =
                "login.html";

            return;

        }


        /*
         * Firebase auth state ka wait
         * karenge, lekin existing
         * Teacher Login system ko change
         * nahi karenge.
         */

        onAuthStateChanged(
            auth,
            async function () {

                try {

                    await loadTeacherSummary(
                        empCode
                    );

                }
                catch (error) {

                    console.error(
                        "Summary Load Error:",
                        error
                    );

                    showError(
                        "Summary load nahi ho saki. " +
                        error.message
                    );

                }

            }
        );


    }
    catch (error) {

        console.error(
            "Teacher Login Check Error:",
            error
        );

        showError(
            "Teacher login check failed."
        );

    }

}


// ======================================
// LOAD TEACHER SUMMARY
// ======================================

async function loadTeacherSummary(
    empCode
) {

    try {

        console.log(
            "Loading Summary for Employee:",
            empCode
        );


        // ==================================
        // LOAD EMPLOYEE
        // ==================================

        const employeeRef =
            doc(
                db,
                "employees",
                empCode
            );


        const employeeSnap =
            await getDoc(
                employeeRef
            );


        if (!employeeSnap.exists()) {

            showError(
                "Employee record nahi mila."
            );

            return;

        }


        const employeeData =
            employeeSnap.data();


        currentEmployee = {

            employeeCode:
                empCode,

            ...employeeData

        };


        // ==================================
        // TEACHER NAME
        // ==================================

        const teacherName =
            employeeData.teacherName ||
            employeeData.teacher_name ||
            employeeData.name ||
            empCode;


        if (topUserName) {

            topUserName.textContent =
                teacherName;

        }


        // ==================================
        // TEACHER INFO
        // ==================================

        const madinaName =
            employeeData.jamiatuMadina ||
            employeeData.jamiatulMadina ||
            employeeData.jamiatul_madina ||
            employeeData.jamiatulMadinah ||
            "-";


        const city =
            employeeData.city ||
            "-";


        const state =
            employeeData.state ||
            "-";


        const region =
            employeeData.region ||
            "-";


        if (teacherInfo) {

            teacherInfo.innerHTML = `

                <strong>
                    ${escapeHtml(teacherName)}
                </strong>

                &nbsp; | &nbsp;

                Employee Code:
                <strong>
                    ${escapeHtml(empCode)}
                </strong>

                &nbsp; | &nbsp;

                Jamiatul Madina:
                <strong>
                    ${escapeHtml(madinaName)}
                </strong>

                &nbsp; | &nbsp;

                Location:
                <strong>
                    ${escapeHtml(city)}
                </strong>,
                ${escapeHtml(state)},
                ${escapeHtml(region)}

            `;

        }


        // ==================================
        // TARGET
        // ==================================

        const target =
            Number(
                employeeData.targetAmount ??
                employeeData.target ??
                employeeData.target_amount ??
                employeeData.Target ??
                0
            );


        console.log(
            "Teacher Target:",
            target
        );


        // ==================================
        // LOAD DAILY ENTRIES
        // ==================================

        const dailyEntryQuery =
            query(
                collection(
                    db,
                    "daily_entry"
                ),
                where(
                    "employeeCode",
                    "==",
                    empCode
                )
            );


        const dailyEntrySnapshot =
            await getDocs(
                dailyEntryQuery
            );


        // ==================================
        // SAME DATE = LATEST ENTRY
        // ==================================

        const latestEntriesByDate = {};


        dailyEntrySnapshot.forEach(
            function (entryDoc) {

                const data =
                    entryDoc.data();


                const date =
                    data.date;


                if (!date) {

                    return;

                }


                // ==================================
                // CREATED AT
                // ==================================

                let createdTime = 0;


                if (
                    data.createdAt &&
                    typeof data.createdAt.toMillis ===
                        "function"
                ) {

                    createdTime =
                        data.createdAt.toMillis();

                }


                // ==================================
                // AMOUNT
                // ==================================

                const entryAmount =
                    Number(
                        data.amount || 0
                    );


                // ==================================
                // FIRST ENTRY FOR DATE
                // ==================================

                if (
                    !latestEntriesByDate[date]
                ) {

                    latestEntriesByDate[date] = {

                        amount:
                            entryAmount,

                        createdTime:
                            createdTime

                    };

                }


                // ==================================
                // LATEST ENTRY
                // ==================================

                else {

                    const existing =
                        latestEntriesByDate[
                            date
                        ];


                    if (
                        createdTime >=
                        existing.createdTime
                    ) {

                        latestEntriesByDate[
                            date
                        ] = {

                            amount:
                                entryAmount,

                            createdTime:
                                createdTime

                        };

                    }

                }

            }
        );


        // ==================================
        // CONVERT TO ARRAY
        // ==================================

        const entries =
            Object.keys(
                latestEntriesByDate
            )
            .map(
                function (date) {

                    return {

                        date:
                            date,

                        amount:
                            Number(
                                latestEntriesByDate[
                                    date
                                ].amount || 0
                            ),

                        createdTime:
                            latestEntriesByDate[
                                date
                            ].createdTime || 0

                    };

                }
            );


        // ==================================
        // SORT NEWEST DATE FIRST
        // ==================================

        entries.sort(
            function (a, b) {

                return b.date.localeCompare(
                    a.date
                );

            }
        );


        // ==================================
        // TOTAL COLLECTION
        // ==================================

        let totalCollection = 0;


        entries.forEach(
            function (entry) {

                totalCollection +=
                    Number(
                        entry.amount || 0
                    );

            }
        );


        // ==================================
        // REMAINING TARGET
        // ==================================

        let remainingTarget =
            target -
            totalCollection;


        if (remainingTarget < 0) {

            remainingTarget = 0;

        }


        // ==================================
        // COLLECTION PERCENTAGE
        // ==================================

        let percentage = 0;


        if (target > 0) {

            percentage =
                (
                    totalCollection /
                    target
                ) *
                100;

        }


        /*
         * Progress bar maximum 100%.
         */

        const progressPercentage =
            Math.min(
                percentage,
                100
            );


        // ==================================
        // SHOW SUMMARY
        // ==================================

        if (targetAmountElement) {

            targetAmountElement.textContent =
                "₹ " +
                formatNumber(
                    target
                );

        }


        if (totalCollectionElement) {

            totalCollectionElement.textContent =
                "₹ " +
                formatNumber(
                    totalCollection
                );

        }


        if (remainingTargetElement) {

            remainingTargetElement.textContent =
                "₹ " +
                formatNumber(
                    remainingTarget
                );

        }


        if (
            collectionPercentageElement
        ) {

            collectionPercentageElement.textContent =
                percentage.toFixed(2) +
                "%";

        }


        if (
            progressPercentageElement
        ) {

            progressPercentageElement.textContent =
                percentage.toFixed(2) +
                "%";

        }


        if (progressBar) {

            progressBar.style.width =
                progressPercentage.toFixed(2) +
                "%";

        }


        if (
            progressCollectionElement
        ) {

            progressCollectionElement.textContent =
                "₹ " +
                formatNumber(
                    totalCollection
                );

        }


        if (progressTargetElement) {

            progressTargetElement.textContent =
                "₹ " +
                formatNumber(
                    target
                );

        }


        if (collectionUnitsElement) {

            collectionUnitsElement.textContent =
                entries.length +
                (
                    entries.length === 1
                        ? " Daily Entry"
                        : " Daily Entries"
                );

        }


        if (entryCountElement) {

            entryCountElement.textContent =
                entries.length +
                (
                    entries.length === 1
                        ? " Entry"
                        : " Entries"
                );

        }


        // ==================================
        // SHOW HISTORY
        // ==================================

        renderHistory(
            entries
        );


        console.log(
            "Summary Loaded:",
            {
                target,
                totalCollection,
                remainingTarget,
                percentage,
                entries
            }
        );

    }
    catch (error) {

        console.error(
            "Load Teacher Summary Error:",
            error
        );

        showError(
            "Summary load nahi ho saki: " +
            error.message
        );

    }

}


// ======================================
// RENDER DAILY HISTORY
// ======================================

function renderHistory(
    entries
) {

    if (!summaryTableBody) {

        return;

    }


    if (!entries.length) {

        summaryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >

                    <i
                        class="fa-solid fa-inbox"
                    ></i>

                    Abhi koi Daily Collection
                    entry available nahi hai.

                </td>

            </tr>

        `;

        return;

    }


    let html = "";


    entries.forEach(
        function (entry, index) {

            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${formatDate(
                            entry.date
                        )}
                    </td>

                    <td
                        class="amount-cell"
                    >
                        ₹ ${formatNumber(
                            entry.amount
                        )}
                    </td>

                    <td>

                        <span
                            class="latest-badge"
                        >
                            Latest Entry
                        </span>

                    </td>

                </tr>

            `;

        }
    );


    summaryTableBody.innerHTML =
        html;

}


// ======================================
// FORMAT DATE
// ======================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "-";

    }


    const parts =
        String(dateString).split("-");


    if (
        parts.length !== 3
    ) {

        return dateString;

    }


    return (
        parts[2] +
        "-" +
        parts[1] +
        "-" +
        parts[0]
    );

}


// ======================================
// NUMBER FORMAT
// ======================================

function formatNumber(
    number
) {

    return Number(
        number || 0
    ).toLocaleString(
        "en-IN"
    );

}


// ======================================
// ESCAPE HTML
// ======================================

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


// ======================================
// ERROR
// ======================================

function showError(
    message
) {

    if (!errorBox) {

        return;

    }


    errorBox.textContent =
        message;


    errorBox.style.display =
        "block";

}
