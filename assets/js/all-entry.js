// ======================================
// Telethon - All Collection Entries
//
// Data Source:
// daily_entry
//
// Features:
// Region Filter
// State Filter
// City Filter
// Employee Code Filter
// Date Filter
// Amount Edit
// Entry Delete
// ======================================


import { db } from "./firebase-config.js";


import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const tableBody =
    document.getElementById(
        "allEntriesTableBody"
    );


const totalAmountEl =
    document.getElementById(
        "allTotalAmount"
    );


const todayAmountEl =
    document.getElementById(
        "allTodayAmount"
    );


const totalEntriesEl =
    document.getElementById(
        "allEntriesCount"
    );


const tableStatus =
    document.getElementById(
        "tableStatus"
    );


const filterRegion =
    document.getElementById(
        "filterRegion"
    );


const filterState =
    document.getElementById(
        "filterState"
    );


const filterCity =
    document.getElementById(
        "filterCity"
    );


const filterEmployeeCode =
    document.getElementById(
        "filterEmployeeCode"
    );


const filterDate =
    document.getElementById(
        "filterDate"
    );


const resetFiltersBtn =
    document.getElementById(
        "resetFilters"
    );


// ======================================
// Edit Modal Elements
// ======================================

const editModalOverlay =
    document.getElementById(
        "editModalOverlay"
    );


const closeEditModalBtn =
    document.getElementById(
        "closeEditModal"
    );


const cancelEditModalBtn =
    document.getElementById(
        "cancelEditModal"
    );


const editAmountInput =
    document.getElementById(
        "editAmountInput"
    );


const editEntryInfo =
    document.getElementById(
        "editEntryInfo"
    );


const saveEditAmountBtn =
    document.getElementById(
        "saveEditAmount"
    );


// ======================================
// Data
// ======================================

let allEntries = [];


// Current entry being edited

let editingEntryId = null;


// ======================================
// Load Entries
// ======================================

async function loadAllEntries() {

    try {

        if (tableStatus) {

            tableStatus.textContent =
                "Loading...";

        }


        const entriesQuery =
            query(
                collection(
                    db,
                    "daily_entry"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                entriesQuery
            );


        allEntries = [];


        snapshot.forEach(
            (docSnapshot) => {

                allEntries.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        loadRegions();

        loadStates();

        applyFilters();

    }

    catch (error) {

        console.error(
            "All Entries Load Error:",
            error
        );


        if (tableStatus) {

            tableStatus.textContent =
                "Load Error";

        }


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="12"
                        class="no-data"
                        style="color:red;"
                    >

                        Entries load nahi ho paayi.

                        <br><br>

                        ${escapeHTML(
                            error.message
                        )}

                    </td>

                </tr>

            `;

        }

    }

}


// ======================================
// Load Regions
// ======================================

function loadRegions() {

    if (!filterRegion) {
        return;
    }


    const regions =
        [
            ...new Set(

                allEntries

                    .map(
                        entry =>
                            String(
                                entry.region ||
                                ""
                            ).trim()
                    )

                    .filter(Boolean)

            )
        ];


    regions.sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    sensitivity:
                        "base"
                }
            )
    );


    filterRegion.innerHTML = `

        <option value="">
            All Regions
        </option>

    `;


    regions.forEach(
        regionName => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                regionName;


            option.textContent =
                regionName;


            filterRegion.appendChild(
                option
            );

        }
    );

}


// ======================================
// Load States
// ======================================

function loadStates() {

    if (!filterState) {
        return;
    }


    const selectedRegion =
        filterRegion
            ? filterRegion.value.trim()
            : "";


    let states =
        allEntries.map(
            entry =>
                String(
                    entry.state ||
                    ""
                ).trim()
        );


    if (selectedRegion) {

        states =
            allEntries

                .filter(
                    entry =>
                        String(
                            entry.region ||
                            ""
                        ).trim()
                        === selectedRegion
                )

                .map(
                    entry =>
                        String(
                            entry.state ||
                            ""
                        ).trim()
                );

    }


    states =
        [
            ...new Set(
                states.filter(Boolean)
            )
        ];


    states.sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    sensitivity:
                        "base"
                }
            )
    );


    const previousValue =
        filterState.value;


    filterState.innerHTML = `

        <option value="">
            All States
        </option>

    `;


    states.forEach(
        stateName => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                stateName;


            option.textContent =
                stateName;


            filterState.appendChild(
                option
            );

        }
    );


    if (
        states.includes(
            previousValue
        )
    ) {

        filterState.value =
            previousValue;

    }
    else {

        filterState.value =
            "";

    }


    filterState.disabled =
        states.length === 0;


    loadCities();

}


// ======================================
// Load Cities
// ======================================

function loadCities() {

    if (!filterCity) {
        return;
    }


    const selectedRegion =
        filterRegion
            ? filterRegion.value.trim()
            : "";


    const selectedState =
        filterState
            ? filterState.value.trim()
            : "";


    let entries =
        allEntries;


    if (selectedRegion) {

        entries =
            entries.filter(
                entry =>
                    String(
                        entry.region ||
                        ""
                    ).trim()
                    === selectedRegion
            );

    }


    if (selectedState) {

        entries =
            entries.filter(
                entry =>
                    String(
                        entry.state ||
                        ""
                    ).trim()
                    === selectedState
            );

    }


    const cities =
        [
            ...new Set(

                entries

                    .map(
                        entry =>
                            String(
                                entry.city ||
                                ""
                            ).trim()
                    )

                    .filter(Boolean)

            )
        ];


    cities.sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    sensitivity:
                        "base"
                }
            )
    );


    const previousValue =
        filterCity.value;


    filterCity.innerHTML = `

        <option value="">
            All Cities
        </option>

    `;


    cities.forEach(
        cityName => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                cityName;


            option.textContent =
                cityName;


            filterCity.appendChild(
                option
            );

        }
    );


    if (
        cities.includes(
            previousValue
        )
    ) {

        filterCity.value =
            previousValue;

    }
    else {

        filterCity.value =
            "";

    }


    filterCity.disabled =
        cities.length === 0;

}


// ======================================
// Apply Filters
// ======================================

function applyFilters() {

    const selectedRegion =
        filterRegion
            ? filterRegion.value.trim()
            : "";


    const selectedState =
        filterState
            ? filterState.value.trim()
            : "";


    const selectedCity =
        filterCity
            ? filterCity.value.trim()
            : "";


    const selectedEmployeeCode =
        filterEmployeeCode
            ? filterEmployeeCode.value
                .trim()
                .toLowerCase()
            : "";


    const selectedDate =
        filterDate
            ? filterDate.value
            : "";


    const filtered =
        allEntries.filter(
            entry => {

                const entryRegion =
                    String(
                        entry.region ||
                        ""
                    ).trim();


                const entryState =
                    String(
                        entry.state ||
                        ""
                    ).trim();


                const entryCity =
                    String(
                        entry.city ||
                        ""
                    ).trim();


                const entryEmployeeCode =
                    String(
                        entry.employee_code ||
                        entry.employeeCode ||
                        entry.empCode ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                const entryDate =
                    String(
                        entry.date ||
                        ""
                    ).trim();


                if (
                    selectedRegion &&
                    entryRegion !==
                        selectedRegion
                ) {

                    return false;

                }


                if (
                    selectedState &&
                    entryState !==
                        selectedState
                ) {

                    return false;

                }


                if (
                    selectedCity &&
                    entryCity !==
                        selectedCity
                ) {

                    return false;

                }


                if (
                    selectedEmployeeCode &&
                    !entryEmployeeCode.includes(
                        selectedEmployeeCode
                    )
                ) {

                    return false;

                }


                if (
                    selectedDate &&
                    entryDate !==
                        selectedDate
                ) {

                    return false;

                }


                return true;

            }
        );


    updateSummary(
        filtered
    );


    displayEntries(
        filtered
    );

}


// ======================================
// Summary
// ======================================

function updateSummary(entries) {

    let totalAmount = 0;

    let todayAmount = 0;


    const today =
        getLocalDateString(
            new Date()
        );


    entries.forEach(
        entry => {

            const amount =
                getEntryAmount(
                    entry
                );


            totalAmount +=
                amount;


            if (
                String(
                    entry.date ||
                    ""
                ) === today
            ) {

                todayAmount +=
                    amount;

            }

        }
    );


    if (totalEntriesEl) {

        totalEntriesEl.textContent =
            entries.length;

    }


    if (totalAmountEl) {

        totalAmountEl.textContent =
            `₹ ${totalAmount.toLocaleString(
                "en-IN"
            )}`;

    }


    if (todayAmountEl) {

        todayAmountEl.textContent =
            `₹ ${todayAmount.toLocaleString(
                "en-IN"
            )}`;

    }

}


// ======================================
// Get Entry Amount
// ======================================

function getEntryAmount(entry) {

    const amount =
        Number(
            entry.amount
        );


    return Number.isFinite(
        amount
    )
        ? amount
        : 0;

}


// ======================================
// Display Entries
// ======================================

function displayEntries(entries) {

    if (!tableBody) {
        return;
    }


    if (tableStatus) {

        tableStatus.textContent =
            `${entries.length} entr${
                entries.length === 1
                    ? "y"
                    : "ies"
            }`;

    }


    if (entries.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="12"
                    class="no-data"
                >

                    Koi entry nahi mili.

                </td>

            </tr>

        `;

        return;

    }


    let html = "";


    entries.forEach(
        (data, index) => {


            const date =
                data.date ||
                "-";


            const employeeCode =
                data.employee_code ||
                data.employeeCode ||
                data.empCode ||
                "-";


            const teacherName =
                data.teacher_name ||
                data.teacherName ||
                "-";


            const jamiatulMadina =
                data.jamiatul_madina ||
                data.jamiatulMadina ||
                "-";


            const city =
                data.city ||
                "-";


            const state =
                data.state ||
                "-";


            const region =
                data.region ||
                "-";


            const amount =
                getEntryAmount(
                    data
                );


            const source =
                getEntrySource(
                    data
                );


            const sourceClass =
                source === "Region User"
                    ? "source-region"
                    : "source-daily";


            const entryTime =
                formatEntryTime(
                    data.createdAt
                );


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            date
                        )}
                    </td>

                    <td class="emp-code">
                        ${escapeHTML(
                            employeeCode
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            teacherName
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            jamiatulMadina
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            city
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            state
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            region
                        )}
                    </td>

                    <td class="amount">
                        ₹ ${amount.toLocaleString(
                            "en-IN"
                        )}
                    </td>

                    <td>

                        <span
                            class="entry-source ${sourceClass}"
                        >

                            ${escapeHTML(
                                source
                            )}

                        </span>

                    </td>

                    <td>
                        ${escapeHTML(
                            entryTime
                        )}
                    </td>

                    <td>

                        <div
                            class="action-buttons"
                        >

                            <button
                                type="button"
                                class="edit-btn"
                                title="Edit Amount"
                                data-action="edit"
                                data-id="${escapeHTML(
                                    data.id
                                )}"
                            >

                                <i
                                    class="fa-solid fa-pen"
                                ></i>

                            </button>


                            <button
                                type="button"
                                class="delete-btn"
                                title="Delete Entry"
                                data-action="delete"
                                data-id="${escapeHTML(
                                    data.id
                                )}"
                            >

                                <i
                                    class="fa-solid fa-trash"
                                ></i>

                            </button>

                        </div>

                    </td>

                </tr>

            `;

        }
    );


    tableBody.innerHTML =
        html;

}


// ======================================
// Entry Source
// ======================================

function getEntrySource(entry) {

    const source =
        String(
            entry.entrySource ||
            entry.entry_source ||
            entry.source ||
            ""
        )
        .trim()
        .toLowerCase();


    if (
        source.includes(
            "region"
        )
    ) {

        return "Region User";

    }


    if (
        source.includes(
            "daily"
        )
    ) {

        return "Daily Entry";

    }


    return "Daily Entry";

}


// ======================================
// Format Entry Time
// ======================================

function formatEntryTime(
    createdAt
) {

    if (
        createdAt &&
        typeof createdAt.toDate ===
        "function"
    ) {

        return createdAt
            .toDate()
            .toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );

    }


    if (
        createdAt instanceof Date
    ) {

        return createdAt
            .toLocaleString(
                "en-IN"
            );

    }


    return "-";

}


// ======================================
// Edit Button
// ======================================

function openEditModal(
    entryId
) {

    const entry =
        allEntries.find(
            item =>
                item.id ===
                entryId
        );


    if (!entry) {

        alert(
            "Entry nahi mili."
        );

        return;

    }


    editingEntryId =
        entryId;


    const employeeCode =
        entry.employee_code ||
        entry.employeeCode ||
        entry.empCode ||
        "-";


    const teacherName =
        entry.teacher_name ||
        entry.teacherName ||
        "-";


    const date =
        entry.date ||
        "-";


    const currentAmount =
        getEntryAmount(
            entry
        );


    if (editEntryInfo) {

        editEntryInfo.innerHTML = `

            <div>
                <strong>Employee Code:</strong>
                ${escapeHTML(
                    employeeCode
                )}
            </div>

            <div>
                <strong>Teacher:</strong>
                ${escapeHTML(
                    teacherName
                )}
            </div>

            <div>
                <strong>Date:</strong>
                ${escapeHTML(
                    date
                )}
            </div>

            <div>
                <strong>Current Amount:</strong>
                ₹ ${currentAmount.toLocaleString(
                    "en-IN"
                )}
            </div>

        `;

    }


    if (editAmountInput) {

        editAmountInput.value =
            currentAmount;

    }


    if (editModalOverlay) {

        editModalOverlay.classList.add(
            "show"
        );

    }


    setTimeout(
        function () {

            if (editAmountInput) {

                editAmountInput.focus();

                editAmountInput.select();

            }

        },
        100
    );

}


// ======================================
// Close Edit Modal
// ======================================

function closeEditModal() {

    editingEntryId =
        null;


    if (editAmountInput) {

        editAmountInput.value =
            "";

    }


    if (editModalOverlay) {

        editModalOverlay.classList.remove(
            "show"
        );

    }

}


// ======================================
// Save Edited Amount
// ======================================

async function saveEditedAmount() {

    if (!editingEntryId) {

        return;

    }


    const amountValue =
        Number(
            editAmountInput
                ? editAmountInput.value
                : NaN
        );


    if (
        !Number.isFinite(
            amountValue
        ) ||
        amountValue < 0
    ) {

        alert(
            "Please valid amount enter karein."
        );

        return;

    }


    const entry =
        allEntries.find(
            item =>
                item.id ===
                editingEntryId
        );


    if (!entry) {

        alert(
            "Entry nahi mili."
        );

        closeEditModal();

        return;

    }


    const confirmed =
        confirm(
            `Amount ko ₹ ${amountValue.toLocaleString(
                "en-IN"
            )} par update karna hai?`
        );


    if (!confirmed) {

        return;

    }


    try {

        if (saveEditAmountBtn) {

            saveEditAmountBtn.disabled =
                true;

            saveEditAmountBtn.innerHTML = `

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

                Saving...

            `;

        }


        const entryRef =
            doc(
                db,
                "daily_entry",
                editingEntryId
            );


        await updateDoc(
            entryRef,
            {
                amount:
                    amountValue
            }
        );


        const entryIndex =
            allEntries.findIndex(
                item =>
                    item.id ===
                    editingEntryId
            );


        if (
            entryIndex !== -1
        ) {

            allEntries[
                entryIndex
            ].amount =
                amountValue;

        }


        closeEditModal();

        loadRegions();

        loadStates();

        applyFilters();


        alert(
            "Amount successfully update ho gaya."
        );

    }

    catch (error) {

        console.error(
            "Amount Update Error:",
            error
        );


        alert(
            "Amount update nahi ho paaya.\n\n" +
            error.message
        );

    }

    finally {

        if (saveEditAmountBtn) {

            saveEditAmountBtn.disabled =
                false;

            saveEditAmountBtn.innerHTML = `

                <i class="fa-solid fa-check"></i>

                Save Amount

            `;

        }

    }

}


// ======================================
// Delete Entry
// ======================================

async function deleteEntry(
    entryId
) {

    const entry =
        allEntries.find(
            item =>
                item.id ===
                entryId
        );


    if (!entry) {

        alert(
            "Entry nahi mili."
        );

        return;

    }


    const employeeCode =
        entry.employee_code ||
        entry.employeeCode ||
        entry.empCode ||
        "-";


    const teacherName =
        entry.teacher_name ||
        entry.teacherName ||
        "-";


    const amount =
        getEntryAmount(
            entry
        );


    const confirmed =
        confirm(
            "Kya aap is entry ko DELETE karna chahte hain?\n\n" +
            `Employee Code: ${employeeCode}\n` +
            `Teacher: ${teacherName}\n` +
            `Amount: ₹ ${amount.toLocaleString(
                "en-IN"
            )}\n\n` +
            "Delete hone ke baad entry wapas nahi aayegi."
        );


    if (!confirmed) {

        return;

    }


    try {

        const buttons =
            tableBody.querySelectorAll(
                `button[data-id="${CSS.escape(
                    entryId
                )}"]`
            );


        buttons.forEach(
            button => {

                button.disabled =
                    true;

            }
        );


        const entryRef =
            doc(
                db,
                "daily_entry",
                entryId
            );


        await deleteDoc(
            entryRef
        );


        allEntries =
            allEntries.filter(
                item =>
                    item.id !==
                    entryId
            );


        loadRegions();

        loadStates();

        applyFilters();


        alert(
            "Entry successfully delete ho gayi."
        );

    }

    catch (error) {

        console.error(
            "Delete Entry Error:",
            error
        );


        alert(
            "Entry delete nahi ho paayi.\n\n" +
            error.message
        );


        applyFilters();

    }

}


// ======================================
// Table Action Click
// ======================================

if (tableBody) {

    tableBody.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.getAttribute(
                    "data-action"
                );


            const entryId =
                button.getAttribute(
                    "data-id"
                );


            if (!entryId) {

                return;

            }


            if (
                action ===
                "edit"
            ) {

                openEditModal(
                    entryId
                );

            }


            if (
                action ===
                "delete"
            ) {

                deleteEntry(
                    entryId
                );

            }

        }
    );

}


// ======================================
// Region Change
// ======================================

if (filterRegion) {

    filterRegion.addEventListener(
        "change",
        function () {

            loadStates();

            applyFilters();

        }
    );

}


// ======================================
// State Change
// ======================================

if (filterState) {

    filterState.addEventListener(
        "change",
        function () {

            loadCities();

            applyFilters();

        }
    );

}


// ======================================
// City Change
// ======================================

if (filterCity) {

    filterCity.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Employee Code Search
// ======================================

if (filterEmployeeCode) {

    filterEmployeeCode.addEventListener(
        "input",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Date Filter
// ======================================

if (filterDate) {

    filterDate.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// ======================================
// Reset Filters
// ======================================

if (resetFiltersBtn) {

    resetFiltersBtn.addEventListener(
        "click",
        function () {

            if (filterRegion) {

                filterRegion.value =
                    "";

            }


            if (filterState) {

                filterState.innerHTML = `

                    <option value="">
                        All States
                    </option>

                `;

                filterState.disabled =
                    true;

            }


            if (filterCity) {

                filterCity.innerHTML = `

                    <option value="">
                        All Cities
                    </option>

                `;

                filterCity.disabled =
                    true;

            }


            if (filterEmployeeCode) {

                filterEmployeeCode.value =
                    "";

            }


            if (filterDate) {

                filterDate.value =
                    "";

            }


            loadStates();

            applyFilters();

        }
    );

}


// ======================================
// Modal Close Buttons
// ======================================

if (closeEditModalBtn) {

    closeEditModalBtn.addEventListener(
        "click",
        function () {

            closeEditModal();

        }
    );

}


if (cancelEditModalBtn) {

    cancelEditModalBtn.addEventListener(
        "click",
        function () {

            closeEditModal();

        }
    );

}


// ======================================
// Modal Background Click
// ======================================

if (editModalOverlay) {

    editModalOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                editModalOverlay
            ) {

                closeEditModal();

            }

        }
    );

}


// ======================================
// Escape Key
// ======================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeEditModal();

        }

    }
);


// ======================================
// Save Amount Button
// ======================================

if (saveEditAmountBtn) {

    saveEditAmountBtn.addEventListener(
        "click",
        function () {

            saveEditedAmount();

        }
    );

}


// ======================================
// Enter Key in Amount
// ======================================

if (editAmountInput) {

    editAmountInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                saveEditedAmount();

            }

        }
    );

}


// ======================================
// Escape HTML
// ======================================

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


// ======================================
// Local Date
// ======================================

function getLocalDateString(
    date
) {

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
// Logout
// ======================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (e) {

            e.preventDefault();


            localStorage.removeItem(
                "loggedInEmpCode"
            );


            localStorage.removeItem(
                "userRole"
            );


            window.location.href =
                "index.html";

        }
    );

}


// ======================================
// START
// ======================================

loadAllEntries();
