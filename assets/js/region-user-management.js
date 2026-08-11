// ======================================
// Telethon
// Region User Management
// FINAL CLEAN VERSION
// Uses ONLY: regionUsers
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// FIRESTORE COLLECTION
// ======================================

const REGION_USERS_COLLECTION = "regionUsers";


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
// VARIABLES
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
                    String(
                        data.name
                    ).trim()
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

    }

    catch (error) {

        console.error(
            "State Load Error:",
            error
        );

    }

}


// ======================================
// REGION OPTIONS
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
// STATE OPTIONS
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
// REMOVE DUPLICATE ACCESS
// ======================================

function cleanAccess(access) {

    const unique = [];

    const seen = new Set();


    access.forEach((item) => {

        if (!item) return;


        const region =
            String(
                item.region || ""
            ).trim();


        const state =
            String(
                item.state || "*"
            ).trim();


        if (!region) return;


        const key =
            `${region}|||${state}`;


        if (!seen.has(key)) {

            seen.add(key);


            unique.push({

                region:
                    region,

                state:
                    state || "*"

            });

        }

    });


    return unique;
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
                cleanAccess(
                    collectAccess()
                );


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
                // DUPLICATE USER CODE
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
                // CREATED AT
                // ==================================

                if (!editingUserId) {

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
        // LOAD ONLY regionUsers
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


        const users = [];


        snapshot.forEach((item) => {

            users.push({

                id:
                    item.id,

                ...item.data()

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
        // CREATE TABLE
        // ==================================

        let html = "";


        users.forEach(
            (user) => {

                const access =
                    cleanAccess(
                        Array.isArray(
                            user.access
                        )
                            ? user.access
                            : []
                    );


                let accessHTML = "";


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
                            style="
                                color:#999;
                            "
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


            // ==================================
            // USER NAME
            // ==================================

            userName.value =
                selectedUser.userName ||
                selectedUser.name ||
                "";


            // ==================================
            // USER CODE
            // ==================================

            userCode.value =
                selectedUser.userCode ||
                selectedUser.id ||
                "";


            // ==================================
            // MOBILE
            // ==================================

            userMobile.value =
                selectedUser.mobile ||
                "";


            // ==================================
            // PASSWORD
            // ==================================

            userPassword.value =
                selectedUser.password ||
                "";


            // ==================================
            // ACCESS
            // ==================================

            accessContainer.innerHTML =
                "";


            const access =
                cleanAccess(

                    Array.isArray(
                        selectedUser.access
                    )
                        ? selectedUser.access
                        : []

                );


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
            // EDIT MODE
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
            "Collection: regionUsers"
        );

        console.log(
            "======================================"
        );


        // Load regions

        await loadRegions();


        // Load states

        await loadStates();


        // Add first access row

        if (
            accessContainer &&
            accessContainer.children.length === 0
        ) {

            addAccessRow();

        }


        // Load users

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
