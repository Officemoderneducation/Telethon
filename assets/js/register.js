// ======================================
// Telethon - Employee Registration
// Firebase + Region / State / City
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const region = document.getElementById("region");
const state = document.getElementById("state");
const city = document.getElementById("city");

const jamiatulMadina =
    document.getElementById("jamiatulMadina");

const employeeCode =
    document.getElementById("employeeCode");

const teacherName =
    document.getElementById("teacherName");

const mobileNumber =
    document.getElementById("mobileNumber");

const password =
    document.getElementById("password");

const confirmPassword =
    document.getElementById("confirmPassword");

const registerForm =
    document.getElementById("registerForm");

const message =
    document.getElementById("message");


// ======================================
// Helper - Escape HTML
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
// Reset State
// ======================================

function resetState() {

    state.innerHTML =
        '<option value="">Select State</option>';

}


// ======================================
// Reset City
// ======================================

function resetCity() {

    city.innerHTML =
        '<option value="">Select City</option>';

}


// ======================================
// Load Regions
// ======================================

async function loadRegions() {

    try {

        region.innerHTML =
            '<option value="">Select Region</option>';

        resetState();
        resetCity();

        const snapshot =
            await getDocs(
                collection(db, "region")
            );


        snapshot.forEach((docSnapshot) => {

            const data =
                docSnapshot.data();

            if (!data.name) {
                return;
            }

            region.innerHTML += `
                <option value="${escapeHTML(data.name)}">
                    ${escapeHTML(data.name)}
                </option>
            `;

        });

    }

    catch (error) {

        console.error(
            "Region Error:",
            error
        );

        region.innerHTML =
            '<option value="">Region Load Error</option>';
    }

}


// ======================================
// Load States
// ======================================

region.addEventListener(
    "change",
    async function () {

        resetState();
        resetCity();

        if (!region.value) {
            return;
        }


        state.innerHTML =
            '<option value="">Loading States...</option>';


        try {

            const selectedRegion =
                region.value.trim();


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


            resetState();


            if (snapshot.empty) {

                state.innerHTML =
                    '<option value="">No State Found</option>';

                console.warn(
                    "No states found for region:",
                    selectedRegion
                );

                return;
            }


            snapshot.forEach(
                (docSnapshot) => {

                    const data =
                        docSnapshot.data();

                    if (!data.name) {
                        return;
                    }

                    state.innerHTML += `
                        <option value="${escapeHTML(data.name)}">
                            ${escapeHTML(data.name)}
                        </option>
                    `;

                }
            );

        }

        catch (error) {

            console.error(
                "State Error:",
                error
            );

            resetState();

            state.innerHTML =
                '<option value="">State Load Error</option>';
        }

    }
);


// ======================================
// Load Cities
// ======================================

state.addEventListener(
    "change",
    async function () {

        resetCity();

        if (!region.value || !state.value) {
            return;
        }


        city.innerHTML =
            '<option value="">Loading Cities...</option>';


        try {

            const selectedRegion =
                region.value.trim();

            const selectedState =
                state.value.trim();


            // ==================================
            // IMPORTANT:
            // Region + State dono se City search
            // ==================================

            const q =
                query(
                    collection(db, "cities"),

                    where(
                        "region",
                        "==",
                        selectedRegion
                    ),

                    where(
                        "state",
                        "==",
                        selectedState
                    )
                );


            const snapshot =
                await getDocs(q);


            resetCity();


            // ==================================
            // Agar Region field cities me nahi hai
            // to fallback State-only search
            // ==================================

            if (snapshot.empty) {

                console.warn(
                    "Region + State city search returned 0 results.",
                    selectedRegion,
                    selectedState
                );


                const fallbackQuery =
                    query(
                        collection(db, "cities"),
                        where(
                            "state",
                            "==",
                            selectedState
                        )
                    );


                const fallbackSnapshot =
                    await getDocs(
                        fallbackQuery
                    );


                if (fallbackSnapshot.empty) {

                    city.innerHTML =
                        '<option value="">No City Found</option>';

                    return;
                }


                fallbackSnapshot.forEach(
                    (docSnapshot) => {

                        const data =
                            docSnapshot.data();

                        if (!data.name) {
                            return;
                        }

                        city.innerHTML += `
                            <option value="${escapeHTML(data.name)}">
                                ${escapeHTML(data.name)}
                            </option>
                        `;

                    }
                );


                return;
            }


            // ==================================
            // Display Cities
            // ==================================

            snapshot.forEach(
                (docSnapshot) => {

                    const data =
                        docSnapshot.data();

                    if (!data.name) {
                        return;
                    }

                    city.innerHTML += `
                        <option value="${escapeHTML(data.name)}">
                            ${escapeHTML(data.name)}
                        </option>
                    `;

                }
            );

        }

        catch (error) {

            console.error(
                "City Error:",
                error
            );


            resetCity();


            city.innerHTML =
                '<option value="">City Load Error</option>';
        }

    }
);


// ======================================
// Registration Submit
// ======================================

registerForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        message.innerHTML = "";

        message.style.color = "red";


        // ==================================
        // Basic Validation
        // ==================================

        if (!region.value) {

            message.innerHTML =
                "Please select Region.";

            return;
        }


        if (!state.value) {

            message.innerHTML =
                "Please select State.";

            return;
        }


        if (!city.value) {

            message.innerHTML =
                "Please select City.";

            return;
        }


        // ==================================
        // Password Validation
        // ==================================

        if (!/^\d{4}$/.test(password.value)) {

            message.innerHTML =
                "Password must be exactly 4 digits.";

            return;
        }


        if (
            password.value !==
            confirmPassword.value
        ) {

            message.innerHTML =
                "Passwords do not match.";

            return;
        }


        // ==================================
        // Mobile Validation
        // ==================================

        if (
            !/^\d{10}$/.test(
                mobileNumber.value.trim()
            )
        ) {

            message.innerHTML =
                "Enter a valid 10 digit mobile number.";

            return;
        }


        // ==================================
        // Employee Code Validation
        // ==================================

        const empCode =
            employeeCode.value.trim();


        if (!empCode) {

            message.innerHTML =
                "Enter Employee Code.";

            return;
        }


        try {

            // ==================================
            // Duplicate Employee Code
            // ==================================

            const employeeQuery =
                query(
                    collection(db, "employees"),
                    where(
                        "employeeCode",
                        "==",
                        empCode
                    )
                );


            const employeeSnapshot =
                await getDocs(
                    employeeQuery
                );


            if (!employeeSnapshot.empty) {

                message.innerHTML =
                    "Employee Code already exists.";

                return;
            }


            // ==================================
            // Duplicate Mobile
            // ==================================

            const mobile =
                mobileNumber.value.trim();


            const mobileQuery =
                query(
                    collection(db, "employees"),
                    where(
                        "mobileNumber",
                        "==",
                        mobile
                    )
                );


            const mobileSnapshot =
                await getDocs(
                    mobileQuery
                );


            if (!mobileSnapshot.empty) {

                message.innerHTML =
                    "Mobile Number already registered.";

                return;
            }


            // ==================================
            // Employee Data
            // ==================================

            const employeeData = {

                employeeCode:
                    empCode,

                teacherName:
                    teacherName.value.trim(),

                mobileNumber:
                    mobile,

                region:
                    region.value.trim(),

                state:
                    state.value.trim(),

                city:
                    city.value.trim(),

                jamiatulMadina:
                    jamiatulMadina.value.trim(),

                password:
                    password.value,

                status:
                    "Pending",

                target:
                    0,

                totalCollection:
                    0,

                approvedBy:
                    "",

                approvedAt:
                    null,

                createdAt:
                    serverTimestamp()

            };


            // ==================================
            // Save Employee
            // ==================================

            await setDoc(

                doc(
                    db,
                    "employees",
                    empCode
                ),

                employeeData

            );


            // ==================================
            // Success
            // ==================================

            message.style.color =
                "green";

            message.innerHTML =
                "Registration Successful. Waiting for Admin Approval.";


            registerForm.reset();


            region.selectedIndex =
                0;


            resetState();
            resetCity();

        }

        catch (error) {

            console.error(
                "Registration Error:",
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
// Start
// ======================================

loadRegions();
