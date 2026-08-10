// ======================================
// Telethon - Region User Management
// Firebase Firestore
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ======================================
// HTML Elements
// ======================================

const regionUserForm =
    document.getElementById("regionUserForm");

const regionUserId =
    document.getElementById("regionUserId");

const regionUserName =
    document.getElementById("regionUserName");

const regionEmployeeCode =
    document.getElementById("regionEmployeeCode");

const regionUserPassword =
    document.getElementById("regionUserPassword");

const regionSelect =
    document.getElementById("region");

const stateSelect =
    document.getElementById("state");

const message =
    document.getElementById("message");

const regionUsersTable =
    document.getElementById("regionUsersTable");

const cancelBtn =
    document.getElementById("cancelBtn");

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
// Message
// ======================================

function showMessage(text, color = "red") {

    if (!message) return;

    message.style.color = color;
    message.textContent = text;
}


// ======================================
// Reset Form
// ======================================

function resetForm() {

    if (regionUserForm) {
        regionUserForm.reset();
    }

    if (regionUserId) {
        regionUserId.value = "";
    }

    if (stateSelect) {

        stateSelect.innerHTML =
            '<option value="">Select State</option>';
    }

    if (cancelBtn) {
        cancelBtn.style.display = "none";
    }

    showMessage("");
}


// ======================================
// Load Regions
// ======================================

async function loadRegions() {

    if (!regionSelect) return;

    regionSelect.innerHTML =
        '<option value="">Loading Regions...</option>';

    try {

        const snapshot =
            await getDocs(
                collection(db, "region")
            );

        regionSelect.innerHTML =
            '<option value="">Select Region</option>';

        snapshot.forEach((regionDoc) => {

            const data =
                regionDoc.data();

            if (!data.name) return;

            regionSelect.innerHTML += `
                <option value="${escapeHTML(data.name)}">
                    ${escapeHTML(data.name)}
                </option>
            `;

        });

    } catch (error) {

        console.error(
            "Region Load Error:",
            error
        );

        regionSelect.innerHTML =
            '<option value="">Region Load Error</option>';
    }
}


// ======================================
// Load States According To Region
// ======================================

async function loadStates(selectedRegion) {

    if (!stateSelect) return;

    stateSelect.innerHTML =
        '<option value="">Loading States...</option>';

    if (!selectedRegion) {

        stateSelect.innerHTML =
            '<option value="">Select State</option>';

        return;
    }

    try {

        const q =
            query(
                collection(db, "state"),
                where(
                    "region",
                    "==",
                    selectedRegion
                )
            );

        const snapshot =
            await getDocs(q);

        stateSelect.innerHTML =
            '<option value="">Select State</option>';

        if (snapshot.empty) {

            stateSelect.innerHTML =
                '<option value="">No State Found</option>';

            return;
        }

        snapshot.forEach((stateDoc) => {

            const data =
                stateDoc.data();

            if (!data.name) return;

            stateSelect.innerHTML += `
                <option value="${escapeHTML(data.name)}">
                    ${escapeHTML(data.name)}
                </option>
            `;

        });

    } catch (error) {

        console.error(
            "State Load Error:",
            error
        );

        stateSelect.innerHTML =
            '<option value="">State Load Error</option>';
    }
}


// ======================================
// Region Change
// ======================================

if (regionSelect) {

    regionSelect.addEventListener(
        "change",
        function () {

            const selectedRegion =
                this.value.trim();

            loadStates(selectedRegion);
        }
    );
}


// ======================================
// Load Region Users
// ======================================

async function loadRegionUsers() {

    if (!regionUsersTable) return;

    regionUsersTable.innerHTML = `
        <tr>
            <td colspan="6" class="loading-cell">
                Loading Region Users...
            </td>
        </tr>
    `;

    try {

        const snapshot =
            await getDocs(
                collection(db, "regionUsers")
            );

        if (snapshot.empty) {

            regionUsersTable.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-cell">
                        No Region Users Found.
                    </td>
                </tr>
            `;

            return;
        }

        let html = "";

        snapshot.forEach((userDoc) => {

            const data =
                userDoc.data();

            const userId =
                userDoc.id;

            const name =
                data.name || "-";

            const employeeCode =
                data.employeeCode || "-";

            const region =
                data.region || "-";

            const state =
                data.state || "-";

            const status =
                data.status || "Active";

            html += `

                <tr>

                    <td>
                        ${escapeHTML(name)}
                    </td>

                    <td>
                        ${escapeHTML(employeeCode)}
                    </td>

                    <td>
                        ${escapeHTML(region)}
                    </td>

                    <td>
                        ${escapeHTML(state)}
                    </td>

                    <td>

                        <span
                            class="status-badge
                            ${String(status).toLowerCase() === "active"
                                ? "approved"
                                : "pending"}"
                        >
                            ${escapeHTML(status)}
                        </span>

                    </td>

                    <td>

                        <button
                            class="action-btn approve-btn"
                            onclick="editRegionUser('${escapeHTML(userId)}')"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteRegionUser('${escapeHTML(userId)}')"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;
        });

        regionUsersTable.innerHTML = html;

    } catch (error) {

        console.error(
            "Region Users Load Error:",
            error
        );

        regionUsersTable.innerHTML = `
            <tr>
                <td colspan="6" class="error-cell">
                    Region Users load nahi ho rahe.
                    <br>
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
}


// ======================================
// Get Single Region User
// ======================================

async function getRegionUser(userId) {

    try {

        const snapshot =
            await getDocs(
                collection(db, "regionUsers")
            );

        let foundUser = null;

        snapshot.forEach((userDoc) => {

            if (userDoc.id === userId) {

                foundUser = {
                    id: userDoc.id,
                    ...userDoc.data()
                };
            }

        });

        return foundUser;

    } catch (error) {

        console.error(
            "Get User Error:",
            error
        );

        return null;
    }
}


// ======================================
// Edit Region User
// ======================================

window.editRegionUser =
    async function (userId) {

        const user =
            await getRegionUser(userId);

        if (!user) {

            alert(
                "Region User nahi mila."
            );

            return;
        }

        if (regionUserId) {
            regionUserId.value = userId;
        }

        if (regionUserName) {
            regionUserName.value =
                user.name || "";
        }

        if (regionEmployeeCode) {
            regionEmployeeCode.value =
                user.employeeCode || "";
        }

        if (regionUserPassword) {
            regionUserPassword.value =
                user.password || "";
        }

        if (regionSelect) {
            regionSelect.value =
                user.region || "";
        }

        await loadStates(
            user.region || ""
        );

        if (stateSelect) {
            stateSelect.value =
                user.state || "";
        }

        if (cancelBtn) {
            cancelBtn.style.display =
                "inline-block";
        }

        showMessage(
            "Edit mode active.",
            "#0d6efd"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


// ======================================
// Delete Region User
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
                    "regionUsers",
                    userId
                )
            );

            alert(
                "Region User successfully delete ho gaya."
            );

            await loadRegionUsers();

        } catch (error) {

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
// Submit Form
// ======================================

if (regionUserForm) {

    regionUserForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            showMessage("");

            const editId =
                regionUserId
                    ? regionUserId.value.trim()
                    : "";

            const name =
                regionUserName
                    ? regionUserName.value.trim()
                    : "";

            const employeeCode =
                regionEmployeeCode
                    ? regionEmployeeCode.value.trim()
                    : "";

            const userPassword =
                regionUserPassword
                    ? regionUserPassword.value.trim()
                    : "";

            const selectedRegion =
                regionSelect
                    ? regionSelect.value.trim()
                    : "";

            const selectedState =
                stateSelect
                    ? stateSelect.value.trim()
                    : "";


            // ==================================
            // Validation
            // ==================================

            if (!name) {

                showMessage(
                    "User Name enter karein."
                );

                return;
            }

            if (!employeeCode) {

                showMessage(
                    "Employee Code enter karein."
                );

                return;
            }

            if (!userPassword) {

                showMessage(
                    "Password enter karein."
                );

                return;
            }

            if (!selectedRegion) {

                showMessage(
                    "Region select karein."
                );

                return;
            }

            if (!selectedState) {

                showMessage(
                    "State select karein."
                );

                return;
            }


            try {

                // ==================================
                // Duplicate Employee Code
                // ==================================

                const q =
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

                const snapshot =
                    await getDocs(q);


                let duplicate = false;

                snapshot.forEach(
                    (userDoc) => {

                        if (
                            userDoc.id !== editId
                        ) {

                            duplicate = true;
                        }
                    }
                );


                if (duplicate) {

                    showMessage(
                        "Employee Code already exists."
                    );

                    return;
                }


                // ==================================
                // User Data
                // ==================================

                const userData = {

                    name:
                        name,

                    employeeCode:
                        employeeCode,

                    password:
                        userPassword,

                    region:
                        selectedRegion,

                    state:
                        selectedState,

                    status:
                        "Active",

                    updatedAt:
                        serverTimestamp()
                };


                // ==================================
                // Create User
                // ==================================

                if (!editId) {

                    const newUserRef =
                        doc(
                            collection(
                                db,
                                "regionUsers"
                            )
                        );

                    await setDoc(
                        newUserRef,
                        {
                            ...userData,
                            createdAt:
                                serverTimestamp()
                        }
                    );


                    showMessage(
                        "Region User successfully create ho gaya.",
                        "green"
                    );

                }

                // ==================================
                // Update User
                // ==================================

                else {

                    await updateDoc(
                        doc(
                            db,
                            "regionUsers",
                            editId
                        ),
                        userData
                    );


                    showMessage(
                        "Region User successfully update ho gaya.",
                        "green"
                    );
                }


                // ==================================
                // Reset
                // ==================================

                setTimeout(
                    () => {

                        resetForm();

                        loadRegionUsers();

                    },
                    800
                );

            } catch (error) {

                console.error(
                    "Save Region User Error:",
                    error
                );

                showMessage(
                    error.message
                );
            }

        }
    );
}


// ======================================
// Cancel Edit
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
// Start
// ======================================

loadRegions();

loadRegionUsers();
