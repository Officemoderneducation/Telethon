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
// HTML Elements
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
// Data
// ======================================

let regions = [];

let states = [];

let editingUserId = null;


// ======================================
// Load Regions
// ======================================

async function loadRegions() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "region")
            );

        regions = [];

        snapshot.forEach((item) => {

            const data =
                item.data();

            if (data.name) {

                regions.push(
                    data.name.trim()
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
// Load States
// ======================================

async function loadStates() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "state")
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
                        data.name.trim(),

                    region:
                        data.region.trim()

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
// Show Message
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
// Create Region Select
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
// Create State Options
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
// Add Access Row
// ======================================

function addAccessRow(
    selectedRegion = "",
    selectedState = ""
) {

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
    // Region Change
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
    // Remove Row
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
// Collect Access
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
// Save User
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
        // Validation
        // ==================================

        if (!name) {

            showMessage(
                "User Name enter karein.",
                "red"
            );

            return;

        }


        if (!code) {

            showMessage(
                "User Code enter karein.",
                "red"
            );

            return;

        }


        if (!password) {

            showMessage(
                "Password enter karein.",
                "red"
            );

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
            // Duplicate Code
            // ==================================

            if (!editingUserId) {

                const q =
                    query(
                        collection(
                            db,
                            "region_users"
                        ),

                        where(
                            "userCode",
                            "==",
                            code
                        )
                    );


                const snapshot =
                    await getDocs(q);


                if (!snapshot.empty) {

                    showMessage(
                        "User Code already exists.",
                        "red"
                    );

                    return;

                }

            }


            // ==================================
            // Document ID
            // ==================================

            const documentId =
                editingUserId ||
                code;


            // ==================================
            // User Data
            // ==================================

            const userData = {

                userName:
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


            if (!editingUserId) {

                userData.createdAt =
                    serverTimestamp();

            }


            // ==================================
            // Save
            // ==================================

            await setDoc(

                doc(
                    db,
                    "region_users",
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


// ======================================
// Load Users
// ======================================

async function loadUsers() {

    if (!table) return;


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                style="text-align:center;padding:25px;"
            >

                Loading Region Users...

            </td>

        </tr>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "region_users"
                )
            );


        if (snapshot.empty) {

            table.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="text-align:center;padding:25px;"
                    >

                        No Region Users Found.

                    </td>

                </tr>

            `;

            return;

        }


        let html = "";


        snapshot.forEach((item) => {

            const user =
                item.data();


            const access =
                Array.isArray(
                    user.access
                )
                    ? user.access
                    : [];


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

                        <span class="access-badge">

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


            html += `

                <tr>

                    <td>
                        ${escapeHTML(
                            user.userName ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            user.userCode ||
                            item.id
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
                            onclick="editRegionUser('${item.id}')"
                        >

                            <i class="fa-solid fa-pen"></i>
                            Edit

                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteRegionUser('${item.id}')"
                        >

                            <i class="fa-solid fa-trash"></i>
                            Delete

                        </button>

                    </td>

                </tr>

            `;

        });


        table.innerHTML =
            html;

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
                    style="text-align:center;color:red;padding:25px;"
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
// Edit User
// ======================================

window.editRegionUser =
    async function (userId) {

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "region_users"
                    )
                );


            let selectedUser =
                null;


            snapshot.forEach(
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
                "";

            userCode.value =
                selectedUser.userCode ||
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


            if (access.length === 0) {

                addAccessRow();

            }


            formTitle.textContent =
                "Edit Region User";


            saveBtn.innerHTML = `

                <i class="fa-solid fa-save"></i>

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
// Delete User
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
                    "region_users",
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
// Cancel Edit
// ======================================

cancelBtn.addEventListener(
    "click",
    function () {

        resetForm();

    }
);


// ======================================
// Add Access
// ======================================

addAccessBtn.addEventListener(
    "click",
    function () {

        addAccessRow();

    }
);


// ======================================
// Reset Form
// ======================================

function resetForm() {

    editingUserId =
        null;


    form.reset();


    accessContainer.innerHTML =
        "";


    addAccessRow();


    formTitle.textContent =
        "Create Region User";


    saveBtn.innerHTML = `

        <i class="fa-solid fa-save"></i>

        Save Region User

    `;


    cancelBtn.style.display =
        "none";


    if (message) {

        message.textContent =
            "";

    }

}


// ======================================
// Escape HTML
// ======================================

function escapeHTML(value) {

    return String(value ?? "")

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
// START
// ======================================

async function start() {

    await loadRegions();

    await loadStates();

    addAccessRow();

    await loadUsers();

}


start();
