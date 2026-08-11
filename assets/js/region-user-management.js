// ======================================
// Telethon
// Region User Management
// Multiple Region / State Access
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// FIRESTORE COLLECTION
// ======================================

// IMPORTANT:
// Dashboard bhi isi collection ko read karta hai.
const REGION_USERS_COLLECTION = "regionUsers";

// Old collection name.
// Isse existing old users automatically migrate honge.
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

function showMessage(
    text,
    color = "green"
) {

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

            const data =
                item.data();

            if (data.name) {

                regions.push(
                    String(data.name).trim()
                );

            }

        });

        regions.sort();

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

            const data =
                item.data();

            if (
                data.name &&
                data.region
            ) {

                states.push({

                    name:
                        String(data.name).trim(),

                    region:
                        String(data.region).trim()

                });

            }

        });

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
    // REMOVE ACCESS ROW
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


        if (!regionSelect || !stateSelect) {
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
// MIGRATE OLD REGION USERS
// ======================================
//
// Old collection:
// region_users
//
// New collection:
// regionUsers
//
// Existing users jo old collection me hain
// unko new collection me automatically copy karega.
//
// Existing new records ko overwrite nahi karega.
// ======================================

async function migrateOldRegionUsers() {

    try {

        const oldSnapshot =
            await getDocs(
                collection(
                    db,
                    OLD_REGION_USERS_COLLECTION
                )
            );


        if (oldSnapshot.empty) {

            console.log(
                "No old region_users data found."
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


        newSnapshot.forEach((item) => {

            existingIds.add(
                item.id
            );

        });


        let migratedCount = 0;


        for (
            const oldDoc of oldSnapshot.docs
        ) {

            const oldId =
                oldDoc.id;


            // Already exists
            // in new collection
            if (
                existingIds.has(oldId)
            ) {

                continue;

            }


            const oldData =
                oldDoc.data();


            // Copy old user
            // into new collection

            await setDoc(

                doc(
                    db,
                    REGION_USERS_COLLECTION,
                    oldId
                ),

                {
                    ...oldData,

                    migratedFrom:
                        OLD_REGION_USERS_COLLECTION,

                    migratedAt:
                        serverTimestamp()

                },

                {
                    merge: true
                }

            );


            migratedCount++;

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


        if (access.length === 0) {

            showMessage(
                "Kam se kam 1 Region / State access assign karein.",
                "red"
            );

            return;

        }


        try {

            // ==================================
            // DUPLICATE CODE CHECK
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


            let duplicateFound = false;


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
            // CREATE TIME
            // ==================================

            if (!editingUserId) {

                userData.createdAt =
                    serverTimestamp();

            }


            // ==================================
            // SAVE TO CORRECT COLLECTION
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
        // FIRST MIGRATE OLD USERS
        // ==================================

        await migrateOldRegionUsers();


        // ==================================
        // LOAD CORRECT COLLECTION
        // ==================================

        const snapshot =
            await getDocs(

                collection(
                    db,
                    REGION_USERS_COLLECTION
                )

            );


        if (snapshot.empty) {

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
        // SORT USERS BY USER CODE
        // ==================================

        const users = [];


        snapshot.forEach((item) => {

            users.push({

                id:
                    item.id,

                ...item.data()

            });

        });


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
        // CREATE TABLE
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

                    accessHTML =
                        `<span
                            style="color:#999;"
                        >
                            No Access
                        </span>`;

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
                                onclick="editRegionUser('${escapeHTML(user.id)}')"
                            >

                                <i
                                    class="fa-solid fa-pen"
                                ></i>

                                Edit

                            </button>


                            <button
                                class="delete-btn"
                                onclick="deleteRegionUser('${escapeHTML(user.id)}')"
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

window.editRegionUser =
    async function (userId) {

        try {

            const userDoc =
                await getDocs(
                    collection(
                        db,
                        REGION_USERS_COLLECTION
                    )
                );


            let selectedUser =
                null;


            userDoc.forEach(
                (item) => {

                    if (
                        item.id ===
                        userId
                    ) {

                        selectedUser = {

                            id:
                                item.id,

                            ...item.data()

                        };

                    }

                }
            );


            if (!selectedUser) {

                alert(
                    "User nahi mila."
                );

                return;

            }


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


            formTitle.textContent =
                "Edit Region User";


            saveBtn.innerHTML = `

                <i
                    class="fa-solid fa-save"
                ></i>

                Update Region User

            `;


            cancelBtn.style.display =
                "block";


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

    };


// ======================================
// DELETE USER
// ======================================

window.deleteRegionUser =
    async function (userId) {

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

    };


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


        // Load + migrate users
        await loadUsers();


        console.log(
            "Region User Management Loaded Successfully."
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
