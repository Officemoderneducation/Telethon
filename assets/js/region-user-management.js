// ======================================
// Telethon
// Region User Management
// Multi Region / Multi State Access
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

const regionUserForm =
    document.getElementById("regionUserForm");

const accessList =
    document.getElementById("accessList");

const addAccessBtn =
    document.getElementById("addAccessBtn");

const message =
    document.getElementById("message");

const regionUsersTable =
    document.getElementById("regionUsersTable");


// ======================================
// Data
// ======================================

let regions = [];

let states = [];

let accessCounter = 0;


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

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

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

        alert(
            "Region load nahi ho rahe.\n\n" +
            error.message
        );

    }

}


// ======================================
// Load All States
// ======================================

async function loadStates() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "state")
            );

        states = [];

        snapshot.forEach((docSnap) => {

            const data =
                docSnap.data();

            if (!data.name) {
                return;
            }

            states.push({

                name:
                    String(data.name).trim(),

                region:
                    String(
                        data.region || ""
                    ).trim()

            });

        });

    }

    catch (error) {

        console.error(
            "State Load Error:",
            error
        );

        alert(
            "State load nahi ho rahe.\n\n" +
            error.message
        );

    }

}


// ======================================
// Escape HTML
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
// Create Access Row
// ======================================

function createAccessRow() {

    accessCounter++;

    const rowId =
        `access-${accessCounter}`;


    const row =
        document.createElement("div");

    row.className =
        "access-row";

    row.dataset.id =
        rowId;


    row.innerHTML = `

        <div class="access-row-header">


            <!-- Region -->

            <div>

                <label>
                    Region
                </label>

                <select
                    class="access-region"
                >

                    <option value="">
                        Select Region
                    </option>

                    ${regions.map(
                        regionName => `
                            <option
                                value="${escapeHTML(regionName)}"
                            >
                                ${escapeHTML(regionName)}
                            </option>
                        `
                    ).join("")}

                </select>

            </div>


            <!-- Access Type -->

            <div>

                <label>
                    Access Type
                </label>

                <select
                    class="access-type"
                >

                    <option value="full">
                        Full Region
                    </option>

                    <option value="states">
                        Selected States
                    </option>

                </select>

            </div>


            <!-- Remove -->

            <div>

                <button
                    type="button"
                    class="remove-access"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>


        </div>


        <!-- States -->

        <div class="state-box">

            <label>
                Select States
            </label>

            <select
                class="access-states"
                multiple
            >

            </select>

            <small>
                Ctrl press karke multiple States select kar sakte hain.
            </small>

        </div>

    `;


    accessList.appendChild(row);


    const regionSelect =
        row.querySelector(
            ".access-region"
        );

    const accessType =
        row.querySelector(
            ".access-type"
        );

    const stateBox =
        row.querySelector(
            ".state-box"
        );

    const stateSelect =
        row.querySelector(
            ".access-states"
        );

    const removeButton =
        row.querySelector(
            ".remove-access"
        );


    // ==================================
    // Region Change
    // ==================================

    regionSelect.addEventListener(
        "change",
        function () {

            loadStatesForRegion(
                this.value,
                stateSelect
            );

        }
    );


    // ==================================
    // Access Type Change
    // ==================================

    accessType.addEventListener(
        "change",
        function () {

            if (
                this.value ===
                "states"
            ) {

                stateBox.classList.add(
                    "show"
                );

                loadStatesForRegion(
                    regionSelect.value,
                    stateSelect
                );

            }

            else {

                stateBox.classList.remove(
                    "show"
                );

                stateSelect.innerHTML =
                    "";

            }

        }
    );


    // ==================================
    // Remove Row
    // ==================================

    removeButton.addEventListener(
        "click",
        function () {

            const rows =
                accessList.querySelectorAll(
                    ".access-row"
                );


            if (rows.length === 1) {

                alert(
                    "Kam se kam ek Access Assignment zaroor hona chahiye."
                );

                return;

            }


            row.remove();

        }
    );


    return row;

}


// ======================================
// Load States For Selected Region
// ======================================

function loadStatesForRegion(
    selectedRegion,
    stateSelect
) {

    stateSelect.innerHTML = "";


    if (!selectedRegion) {
        return;
    }


    const regionStates =
        states.filter(
            item =>
                item.region ===
                selectedRegion
        );


    if (
        regionStates.length ===
        0
    ) {

        stateSelect.innerHTML = `

            <option value="">
                No State Found
            </option>

        `;

        return;
    }


    regionStates
        .sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        )
        .forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item.name;

                option.textContent =
                    item.name;

                stateSelect.appendChild(
                    option
                );

            }
        );

}


// ======================================
// Get Access Data From Form
// ======================================

function getAccessData() {

    const rows =
        accessList.querySelectorAll(
            ".access-row"
        );


    const access = [];


    for (
        const row of rows
    ) {

        const regionSelect =
            row.querySelector(
                ".access-region"
            );

        const typeSelect =
            row.querySelector(
                ".access-type"
            );

        const stateSelect =
            row.querySelector(
                ".access-states"
            );


        const selectedRegion =
            regionSelect.value.trim();


        const accessType =
            typeSelect.value;


        if (!selectedRegion) {

            throw new Error(
                "Har Access Assignment me Region select karein."
            );

        }


        // ==================================
        // Full Region
        // ==================================

        if (
            accessType ===
            "full"
        ) {

            access.push({

                region:
                    selectedRegion,

                fullRegion:
                    true,

                states: []

            });

        }


        // ==================================
        // Selected States
        // ==================================

        else {

            const selectedStates =
                Array.from(
                    stateSelect.selectedOptions
                )
                .map(
                    option =>
                        option.value.trim()
                )
                .filter(Boolean);


            if (
                selectedStates.length ===
                0
            ) {

                throw new Error(
                    `Region "${selectedRegion}" ke liye kam se kam ek State select karein.`
                );

            }


            access.push({

                region:
                    selectedRegion,

                fullRegion:
                    false,

                states:
                    selectedStates

            });

        }

    }


    return access;

}


// ======================================
// Save User
// ======================================

regionUserForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        message.innerHTML = "";

        message.style.color =
            "red";


        const userName =
            document.getElementById(
                "userName"
            )
            .value
            .trim();


        const employeeCode =
            document.getElementById(
                "employeeCode"
            )
            .value
            .trim();


        const password =
            document.getElementById(
                "password"
            )
            .value;


        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            )
            .value;


        // ==================================
        // Validation
        // ==================================

        if (!userName) {

            message.innerHTML =
                "User Name enter karein.";

            return;

        }


        if (!employeeCode) {

            message.innerHTML =
                "Employee Code enter karein.";

            return;

        }


        if (!password) {

            message.innerHTML =
                "Password enter karein.";

            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            message.innerHTML =
                "Passwords do not match.";

            return;

        }


        let access;


        try {

            access =
                getAccessData();

        }

        catch (error) {

            message.innerHTML =
                error.message;

            return;

        }


        try {

            // ==================================
            // Duplicate Employee Code
            // ==================================

            const duplicateQuery =
                query(

                    collection(
                        db,
                        "regionUsers"
                    ),

                    where(
                        "employeeCode",
                        "==",
                        employeeCode
                    )

                );


            const duplicateSnapshot =
                await getDocs(
                    duplicateQuery
                );


            if (
                !duplicateSnapshot.empty
            ) {

                message.innerHTML =
                    "Employee Code already exists.";

                return;

            }


            // ==================================
            // Save
            // ==================================

            await setDoc(

                doc(
                    db,
                    "regionUsers",
                    employeeCode
                ),

                {

                    userName:
                        userName,

                    employeeCode:
                        employeeCode,

                    password:
                        password,

                    access:
                        access,

                    status:
                        "Active",

                    createdAt:
                        serverTimestamp()

                }

            );


            message.style.color =
                "green";


            message.innerHTML =
                "Region User successfully created.";


            regionUserForm.reset();


            accessList.innerHTML =
                "";

            accessCounter =
                0;


            createAccessRow();


            await loadRegionUsers();

        }

        catch (error) {

            console.error(
                "Save User Error:",
                error
            );


            message.style.color =
                "red";


            message.innerHTML =
                error.message;

        }

    }
);


// ======================================
// Load Region Users
// ======================================

async function loadRegionUsers() {

    if (!regionUsersTable) {
        return;
    }


    regionUsersTable.innerHTML = `

        <tr>

            <td colspan="4">
                Loading Users...
            </td>

        </tr>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "regionUsers"
                )
            );


        if (
            snapshot.empty
        ) {

            regionUsersTable.innerHTML = `

                <tr>

                    <td colspan="4">
                        No Region Users Found.
                    </td>

                </tr>

            `;

            return;

        }


        let html = "";


        snapshot.forEach(
            userDoc => {

                const user =
                    userDoc.data();


                let accessHTML =
                    "";


                const access =
                    Array.isArray(
                        user.access
                    )
                    ?
                    user.access
                    :
                    [];


                access.forEach(
                    item => {

                        if (
                            item.fullRegion
                        ) {

                            accessHTML += `

                                <span
                                    class="access-badge"
                                >
                                    ${escapeHTML(
                                        item.region
                                    )}
                                    — Full Region
                                </span>

                            `;

                        }

                        else {

                            const statesText =
                                Array.isArray(
                                    item.states
                                )
                                ?
                                item.states.join(
                                    ", "
                                )
                                :
                                "";


                            accessHTML += `

                                <span
                                    class="access-badge"
                                >
                                    ${escapeHTML(
                                        item.region
                                    )}
                                    →
                                    ${escapeHTML(
                                        statesText
                                    )}
                                </span>

                            `;

                        }

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
                                user.employeeCode ||
                                userDoc.id
                            )}
                        </td>

                        <td>
                            ${
                                accessHTML ||
                                "-"
                            }
                        </td>

                        <td>

                            <button
                                class="delete-user"
                                data-id="${escapeHTML(
                                    userDoc.id
                                )}"
                            >
                                <i class="fa-solid fa-trash"></i>
                                Delete
                            </button>

                        </td>

                    </tr>

                `;

            }
        );


        regionUsersTable.innerHTML =
            html;


        // ==================================
        // Delete Buttons
        // ==================================

        document
            .querySelectorAll(
                ".delete-user"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async function () {

                            const id =
                                this.dataset.id;


                            const confirmDelete =
                                confirm(
                                    "Is Region User ko delete karna hai?"
                                );


                            if (
                                !confirmDelete
                            ) {
                                return;
                            }


                            try {

                                await deleteDoc(

                                    doc(
                                        db,
                                        "regionUsers",
                                        id
                                    )

                                );


                                alert(
                                    "Region User delete ho gaya."
                                );


                                await loadRegionUsers();

                            }

                            catch (error) {

                                console.error(
                                    "Delete Error:",
                                    error
                                );


                                alert(
                                    "User delete nahi ho saka.\n\n" +
                                    error.message
                                );

                            }

                        }
                    );

                }
            );

    }

    catch (error) {

        console.error(
            "Users Load Error:",
            error
        );


        regionUsersTable.innerHTML = `

            <tr>

                <td colspan="4">

                    Users load nahi ho rahe.

                    <br>

                    ${escapeHTML(
                        error.message
                    )}

                </td>

            </tr>

        `;

    }

}


// ======================================
// Add Access Button
// ======================================

addAccessBtn.addEventListener(
    "click",
    function () {

        createAccessRow();

    }
);


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

async function start() {

    await loadRegions();

    await loadStates();

    createAccessRow();

    await loadRegionUsers();

}


start();
