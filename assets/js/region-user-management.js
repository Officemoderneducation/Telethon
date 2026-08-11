// ======================================
// Telethon
// Region User Management
// Multiple Region / State Access
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    getDoc,
    query,
    where,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// FIRESTORE COLLECTIONS
// ======================================

// FINAL / MAIN COLLECTION
const REGION_USERS_COLLECTION = "regionUsers";

// OLD COLLECTION - ONLY FOR ONE-TIME MIGRATION
const OLD_REGION_USERS_COLLECTION = "region_users";


// ======================================
// HTML ELEMENTS
// ======================================

const form =
    document.getElementById("regionUserForm");

const userName =
    document.getElementById("userName");

const userCode =
    document.getElementById("userCode");

const userMobile =
    document.getElementById("userMobile");

const userPassword =
    document.getElementById("userPassword");

const accessContainer =
    document.getElementById("accessContainer");

const addAccessBtn =
    document.getElementById("addAccessBtn");

const message =
    document.getElementById("message");

const table =
    document.getElementById("regionUsersTable");

const formTitle =
    document.getElementById("formTitle");

const saveBtn =
    document.getElementById("saveBtn");

const cancelBtn =
    document.getElementById("cancelBtn");


// ======================================
// DATA
// ======================================

let regions = [];
let states = [];
let editingUserId = null;


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================
// SHOW MESSAGE
// ======================================

function showMessage(text, color = "green") {

    if (!message) return;

    message.textContent = text;
    message.style.color = color;
}


// ======================================
// LOAD REGIONS
// ======================================

async function loadRegions() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "region"
                )
            );

        regions = [];

        snapshot.forEach((item) => {

            const data = item.data();

            if (data.name) {

                regions.push(
                    String(data.name).trim()
                );

            }

        });

        regions = [
            ...new Set(regions)
        ];

        regions.sort();

        console.log(
            "Regions Loaded:",
            regions
        );

    }

    catch (error) {

        console.error(
            "Region Load Error:",
            error
        );

        showMessage(
            "Region load nahi ho sake.",
            "red"
        );

    }
}


// ======================================
// LOAD STATES
// ======================================

async function loadStates() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "state"
                )
            );

        states = [];

        snapshot.forEach((item) => {

            const data = item.data();

            if (
                data.name &&
                data.region
            ) {

                states.push({

                    name:
                        String(
                            data.name
                        ).trim(),

                    region:
                        String(
                            data.region
                        ).trim()

                });

            }

        });

        console.log(
            "States Loaded:",
            states.length
        );

    }

    catch (error) {

        console.error(
            "State Load Error:",
            error
        );

    }
}


// ======================================
// CREATE REGION OPTIONS
// ======================================

function createRegionOptions(
    selectedRegion = ""
) {

    let html =
        '<option value="">Select Region</option>';

    regions.forEach((regionName) => {

        const selected =
            regionName === selectedRegion
                ? "selected"
                : "";

        html += `

            <option
                value="${escapeHTML(regionName)}"
                ${selected}
            >
                ${escapeHTML(regionName)}
            </option>

        `;

    });

    return html;
}


// ======================================
// CREATE STATE OPTIONS
// ======================================

function createStateOptions(
    selectedRegion = "",
    selectedState = ""
) {

    let html =
        '<option value="">Full Region</option>';

    if (!selectedRegion) {

        return html;

    }

    const filteredStates =
        states.filter(
            (item) =>
                item.region ===
                selectedRegion
        );


    filteredStates.forEach((item) => {

        const selected =
            item.name === selectedState
                ? "selected"
                : "";

        html += `

            <option
                value="${escapeHTML(item.name)}"
                ${selected}
            >
                ${escapeHTML(item.name)}
            </option>

        `;

    });

    return html;
}


// ======================================
// ADD ACCESS ROW
// ======================================

function addAccessRow(
    selectedRegion = "",
    selectedState = ""
) {

    if (!accessContainer) return;

    const row =
        document.createElement("div");

    row.className =
        "access-row";


    row.innerHTML = `

        <div>

            <label>
                Region
            </label>

            <select
                class="access-region"
            >

                ${createRegionOptions(
                    selectedRegion
                )}

            </select>

        </div>


        <div>

            <label>
                State
            </label>

            <select
                class="access-state"
            >

                ${createStateOptions(
                    selectedRegion,
                    selectedState
                )}

            </select>

        </div>


        <button
            type="button"
            class="remove-access"
            title="Remove Access"
        >

            <i class="fa-solid fa-trash"></i>

        </button>

    `;


    const regionSelect =
        row.querySelector(
            ".access-region"
        );

    const stateSelect =
        row.querySelector(
            ".access-state"
        );

    const removeBtn =
        row.querySelector(
            ".remove-access"
        );


    // ==================================
    // REGION CHANGE
    // ==================================

    regionSelect.addEventListener(
        "change",
        function () {

            stateSelect.innerHTML =
                createStateOptions(
                    this.value,
                    ""
                );

        }
    );


    // ==================================
    // REMOVE ACCESS
    // ==================================

    removeBtn.addEventListener(
        "click",
        function () {

            row.remove();

        }
    );


    accessContainer.appendChild(row);
}


// ======================================
// COLLECT ACCESS
// ======================================

function collectAccess() {

    if (!accessContainer) {

        return [];

    }

    const rows =
        accessContainer.querySelectorAll(
            ".access-row"
        );

    const access = [];


    rows.forEach((row) => {

        const regionSelect =
            row.querySelector(
                ".access-region"
            );

        const stateSelect =
            row.querySelector(
                ".access-state"
            );


        if (
            !regionSelect ||
            !stateSelect
        ) {

            return;

        }


        const regionValue =
            regionSelect.value.trim();

        const stateValue =
            stateSelect.value.trim();


        if (!regionValue) {

            return;

        }


        access.push({

            region:
                regionValue,

            state:
                stateValue || "*"

        });

    });


    return access;
}


// ======================================
// MIGRATE OLD USERS
// ======================================
//
// Old:
// region_users
//
// New:
// regionUsers
//
// Existing new records are NOT overwritten.
//
// ======================================

async function migrateOldRegionUsers() {

    try {

        console.log(
            "Checking old region_users collection..."
        );


        const oldSnapshot =
            await getDocs(
                collection(
                    db,
                    OLD_REGION_USERS_COLLECTION
                )
            );


        if (oldSnapshot.empty) {

            console.log(
                "No old region_users users found."
            );

            return;

        }


        const newSnapshot =
            await getDocs(
                collection(
                    db,
                    REGION_USERS_COLLECTION
                )
            );


        const existingIds =
            new Set();


        const existingCodes =
            new Set();


        newSnapshot.forEach((item) => {

            const data =
                item.data();


            existingIds.add(
                item.id
            );


            if (data.userCode) {

                existingCodes.add(
                    String(
                        data.userCode
                    ).trim()
                );

            }

        });


        let migratedCount = 0;


        for (
            const oldDoc of oldSnapshot.docs
        ) {

            const oldData =
                oldDoc.data();


            const oldId =
                oldDoc.id;


            const oldCode =
                String(
                    oldData.userCode ||
                    oldData.employeeCode ||
                    oldId ||
                    ""
                ).trim();


            // ------------------------------
            // Already exists by document ID
            // ------------------------------

            if (
                existingIds.has(oldId)
            ) {

                continue;

            }


            // ------------------------------
            // Already exists by User Code
            // ------------------------------

            if (
                oldCode &&
                existingCodes.has(oldCode)
            ) {

                continue;

            }


            // ------------------------------
            // Normalize old data
            // ------------------------------

            const migratedData = {

                userName:
                    oldData.userName ||
                    oldData.name ||
                    oldData.teacherName ||
                    "",

                name:
                    oldData.name ||
                    oldData.userName ||
                    oldData.teacherName ||
                    "",

                userCode:
                    oldData.userCode ||
                    oldData.employeeCode ||
                    oldId,

                mobile:
                    oldData.mobile ||
                    "",

                password:
                    oldData.password ||
                    "",

                access:
                    Array.isArray(
                        oldData.access
                    )
                        ? oldData.access
                        : [],

                status:
                    oldData.status ||
                    "Active",

                migratedFrom:
                    OLD_REGION_USERS_COLLECTION,

                migratedAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            await setDoc(

                doc(
                    db,
                    REGION_USERS_COLLECTION,
                    oldId
                ),

                migratedData,

                {
                    merge: true
                }

            );


            migratedCount++;

            existingIds.add(
                oldId
            );


            if (oldCode) {

                existingCodes.add(
                    oldCode
                );

            }

        }


        console.log(
            "Old Region Users Migrated:",
            migratedCount
        );

    }

    catch (error) {

        console.error(
            "Migration Error:",
            error
        );

    }
}


// ======================================
// SAVE USER
// ======================================

if (form) {

    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            showMessage(
                "Saving...",
                "#2563eb"
            );


            const name =
                userName.value.trim();

            const code =
                userCode.value.trim();

            const mobile =
                userMobile.value.trim();

            const password =
                userPassword.value.trim();

            const access =
                collectAccess();


            // ==================================
            // VALIDATION
            // ==================================

            if (!name) {

                showMessage(
                    "User Name enter karein.",
                    "red"
                );

                userName.focus();

                return;

            }


            if (!code) {

                showMessage(
                    "User Code enter karein.",
                    "red"
                );

                userCode.focus();

                return;

            }


            if (!password) {

                showMessage(
                    "Password enter karein.",
                    "red"
                );

                userPassword.focus();

                return;

            }


            if (
                access.length === 0
            ) {

                showMessage(
                    "Kam se kam 1 Region / State access assign karein.",
                    "red"
                );

                return;

            }


            try {

                // ==================================
                // DUPLICATE USER CODE CHECK
                // ==================================

                const duplicateQuery =
                    query(

                        collection(
                            db,
                            REGION_USERS_COLLECTION
                        ),

                        where(
                            "userCode",
                            "==",
                            code
                        )

                    );


                const duplicateSnapshot =
                    await getDocs(
                        duplicateQuery
                    );


                let duplicateFound =
                    false;


                duplicateSnapshot.forEach(
                    (item) => {

                        if (
                            item.id !==
                            editingUserId
                        ) {

                            duplicateFound =
                                true;

                        }

                    }
                );


                if (duplicateFound) {

                    showMessage(
                        "User Code already exists.",
                        "red"
                    );

                    return;

                }


                // ==================================
                // DOCUMENT ID
                // ==================================

                const documentId =
                    editingUserId ||
                    code;


                // ==================================
                // USER DATA
                // ==================================

                const userData = {

                    userName:
                        name,

                    name:
                        name,

                    userCode:
                        code,

                    mobile:
                        mobile,

                    password:
                        password,

                    access:
                        access,

                    status:
                        "Active",

                    updatedAt:
                        serverTimestamp()

                };


                // ==================================
                // CREATE DATE
                // ==================================

                if (
                    !editingUserId
                ) {

                    userData.createdAt =
                        serverTimestamp();

                }


                // ==================================
                // SAVE ONLY TO regionUsers
                // ==================================

                await setDoc(

                    doc(
                        db,
                        REGION_USERS_COLLECTION,
                        documentId
                    ),

                    userData,

                    {
                        merge: true
                    }

                );


                // ==================================
                // SUCCESS
                // ==================================

                showMessage(

                    editingUserId
                        ? "Region User updated successfully."
                        : "Region User created successfully.",

                    "green"

                );


                resetForm();


                await loadUsers();

            }

            catch (error) {

                console.error(
                    "Save Region User Error:",
                    error
                );


                showMessage(
                    error.message,
                    "red"
                );

            }

        }
    );

}


// ======================================
// LOAD USERS
// ======================================

async function loadUsers() {

    if (!table) return;


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                style="
                    text-align:center;
                    padding:25px;
                "
            >

                Loading Region Users...

            </td>

        </tr>

    `;


    try {

        // ==================================
        // MIGRATE OLD USERS FIRST
        // ==================================

        await migrateOldRegionUsers();


        // ==================================
        // READ ONLY regionUsers
        // ==================================

        const snapshot =
            await getDocs(

                collection(
                    db,
                    REGION_USERS_COLLECTION
                )

            );


        console.log(
            "regionUsers Firebase Count:",
            snapshot.size
        );


        if (
            snapshot.empty
        ) {

            table.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="
                            text-align:center;
                            padding:25px;
                        "
                    >

                        No Region Users Found.

                    </td>

                </tr>

            `;

            return;

        }


        // ==================================
        // CREATE USERS ARRAY
        // ==================================

        const users = [];


        snapshot.forEach((item) => {

            const data =
                item.data();


            users.push({

                id:
                    item.id,

                ...data

            });

        });


        // ==================================
        // SORT BY USER CODE
        // ==================================

        users.sort(
            (a, b) => {

                return String(

                    a.userCode ||
                    a.id ||
                    ""

                ).localeCompare(

                    String(

                        b.userCode ||
                        b.id ||
                        ""

                    ),

                    undefined,

                    {
                        numeric: true
                    }

                );

            }
        );


        // ==================================
        // TABLE HTML
        // ==================================

        let html = "";


        users.forEach(
            (user) => {

                const access =
                    Array.isArray(
                        user.access
                    )
                        ? user.access
                        : [];


                let accessHTML =
                    "";


                access.forEach(
                    (item) => {

                        const regionName =
                            item.region ||
                            "-";


                        const stateName =
                            item.state === "*"

                                ? "Full Region"

                                : (
                                    item.state ||
                                    "-"
                                );


                        accessHTML += `

                            <span
                                class="access-badge"
                            >

                                ${escapeHTML(
                                    regionName
                                )}

                                →

                                ${escapeHTML(
                                    stateName
                                )}

                            </span>

                        `;

                    }
                );


                if (!accessHTML) {

                    accessHTML = `

                        <span
                            style="color:#999;"
                        >
                            No Access
                        </span>

                    `;

                }


                html += `

                    <tr>

                        <td>

                            ${escapeHTML(
                                user.userName ||
                                user.name ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                user.userCode ||
                                user.id ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                user.mobile ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${accessHTML}

                        </td>


                        <td>

                            <button
                                class="edit-btn"
                                data-edit-id="${escapeHTML(
                                    user.id
                                )}"
                            >

                                <i
                                    class="fa-solid fa-pen"
                                ></i>

                                Edit

                            </button>


                            <button
                                class="delete-btn"
                                data-delete-id="${escapeHTML(
                                    user.id
                                )}"
                            >

                                <i
                                    class="fa-solid fa-trash"
                                ></i>

                                Delete

                            </button>

                        </td>

                    </tr>

                `;

            }
        );


        table.innerHTML =
            html;


        // ==================================
        // EDIT BUTTONS
        // ==================================

        table
            .querySelectorAll(
                "[data-edit-id]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    function () {

                        editRegionUser(
                            this.dataset.editId
                        );

                    }
                );

            });


        // ==================================
        // DELETE BUTTONS
        // ==================================

        table
            .querySelectorAll(
                "[data-delete-id]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    function () {

                        deleteRegionUser(
                            this.dataset.deleteId
                        );

                    }
                );

            });


        console.log(
            "Region Users Loaded:",
            users.length
        );

    }

    catch (error) {

        console.error(
            "Load Users Error:",
            error
        );


        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        color:red;
                        padding:25px;
                    "
                >

                    ${escapeHTML(
                        error.message
                    )}

                </td>

            </tr>

        `;

    }
}


// ======================================
// EDIT USER
// ======================================

async function editRegionUser(userId) {

    try {

        const userRef =
            doc(
                db,
                REGION_USERS_COLLECTION,
                userId
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (
            !userSnapshot.exists()
        ) {

            alert(
                "User nahi mila."
            );

            return;

        }


        const selectedUser = {

            id:
                userSnapshot.id,

            ...userSnapshot.data()

        };


        editingUserId =
            selectedUser.id;


        userName.value =
            selectedUser.userName ||
            selectedUser.name ||
            "";


        userCode.value =
            selectedUser.userCode ||
            selectedUser.id ||
            "";


        userMobile.value =
            selectedUser.mobile ||
            "";


        userPassword.value =
            selectedUser.password ||
            "";


        // ==================================
        // ACCESS
        // ==================================

        accessContainer.innerHTML =
            "";


        const access =
            Array.isArray(
                selectedUser.access
            )
                ? selectedUser.access
                : [];


        access.forEach(
            (item) => {

                addAccessRow(

                    item.region ||
                    "",

                    item.state === "*"

                        ? ""

                        : (
                            item.state ||
                            ""
                        )

                );

            }
        );


        if (
            access.length === 0
        ) {

            addAccessRow();

        }


        // ==================================
        // FORM UI
        // ==================================

        if (formTitle) {

            formTitle.textContent =
                "Edit Region User";

        }


        if (saveBtn) {

            saveBtn.innerHTML = `

                <i
                    class="fa-solid fa-save"
                ></i>

                Update Region User

            `;

        }


        if (cancelBtn) {

            cancelBtn.style.display =
                "block";

        }


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }

    catch (error) {

        console.error(
            "Edit User Error:",
            error
        );

        alert(
            error.message
        );

    }
}


// ======================================
// MAKE EDIT AVAILABLE
// ======================================

window.editRegionUser =
    editRegionUser;


// ======================================
// DELETE USER
// ======================================

async function deleteRegionUser(userId) {

    const confirmation =
        confirm(
            "Kya aap is Region User ko delete karna chahte hain?"
        );


    if (!confirmation) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                REGION_USERS_COLLECTION,
                userId
            )

        );


        alert(
            "Region User delete ho gaya."
        );


        await loadUsers();

    }

    catch (error) {

        console.error(
            "Delete User Error:",
            error
        );


        alert(

            "User delete nahi ho saka.\n\n" +
            error.message

        );

    }
}


// ======================================
// MAKE DELETE AVAILABLE
// ======================================

window.deleteRegionUser =
    deleteRegionUser;


// ======================================
// CANCEL EDIT
// ======================================

if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        function () {

            resetForm();

        }
    );

}


// ======================================
// ADD ACCESS
// ======================================

if (addAccessBtn) {

    addAccessBtn.addEventListener(
        "click",
        function () {

            addAccessRow();

        }
    );

}


// ======================================
// RESET FORM
// ======================================

function resetForm() {

    editingUserId =
        null;


    if (form) {

        form.reset();

    }


    if (accessContainer) {

        accessContainer.innerHTML =
            "";

        addAccessRow();

    }


    if (formTitle) {

        formTitle.textContent =
            "Create Region User";

    }


    if (saveBtn) {

        saveBtn.innerHTML = `

            <i
                class="fa-solid fa-save"
            ></i>

            Save Region User

        `;

    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "none";

    }


    if (message) {

        message.textContent =
            "";

    }
}


// ======================================
// START
// ======================================

async function start() {

    try {

        console.log(
            "======================================"
        );

        console.log(
            "Region User Management Starting..."
        );

        console.log(
            "======================================"
        );


        // Load regions
        await loadRegions();


        // Load states
        await loadStates();


        // Default access row
        addAccessRow();


        // Migrate old users + load users
        await loadUsers();


        console.log(
            "======================================"
        );

        console.log(
            "Region User Management Loaded Successfully."
        );

        console.log(
            "Main Collection: regionUsers"
        );

        console.log(
            "======================================"
        );

    }

    catch (error) {

        console.error(
            "Region User Management Start Error:",
            error
        );

    }
}


// ======================================
// RUN
// ======================================

start();
