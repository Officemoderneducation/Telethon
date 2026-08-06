// ======================================
// Firebase
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
// Get Elements
// ======================================

const region = document.getElementById("region");
const state = document.getElementById("state");
const city = document.getElementById("city");

const jamiatulMadina = document.getElementById("jamiatulMadina");
const employeeCode = document.getElementById("employeeCode");
const teacherName = document.getElementById("teacherName");
const mobileNumber = document.getElementById("mobileNumber");

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");


// ======================================
// Load Regions
// ======================================

async function loadRegions() {

    region.innerHTML =
        '<option value="">Select Region</option>';

    const snapshot = await getDocs(
        collection(db, "region")
    );

    snapshot.forEach((doc) => {

        const data = doc.data();

        region.innerHTML += `
            <option value="${data.name}">
                ${data.name}
            </option>
        `;

    });

}

loadRegions();


// ======================================
// Load States
// ======================================

region.addEventListener("change", async () => {

    state.innerHTML =
        '<option value="">Select State</option>';

    city.innerHTML =
        '<option value="">Select City</option>';


    const q = query(
        collection(db, "state"),
        where("region", "==", region.value)
    );


    const snapshot = await getDocs(q);


    snapshot.forEach((doc) => {

        const data = doc.data();

        state.innerHTML += `
            <option value="${data.name}">
                ${data.name}
            </option>
        `;

    });

});


// ======================================
// Load Cities
// ======================================

state.addEventListener("change", async () => {


    city.innerHTML =
        '<option value="">Select City</option>';


    const q = query(
        collection(db, "cities"),
        where("state", "==", state.value)
    );


    const snapshot = await getDocs(q);


    snapshot.forEach((doc) => {

        const data = doc.data();


        city.innerHTML += `
            <option value="${data.name}">
                ${data.name}
            </option>
        `;

    });


});


// ======================================
// Register Employee
// ======================================

registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();


    message.innerHTML = "";


    // Password Check

    if (!/^\d{4}$/.test(password.value)) {

        message.style.color = "red";

        message.innerHTML =
        "Password must be exactly 4 digits.";

        return;

    }


    if (password.value !== confirmPassword.value) {


        message.style.color = "red";

        message.innerHTML =
        "Passwords do not match.";

        return;

    }



    // Mobile Check

    if (!/^\d{10}$/.test(mobileNumber.value)) {


        message.style.color = "red";

        message.innerHTML =
        "Enter valid 10 digit mobile number.";

        return;

    }



    // Employee Code Duplicate Check

    const employeeQuery = query(

        collection(db, "employees"),

        where(
            "employeeCode",
            "==",
            employeeCode.value.trim()
        )

    );


    const employeeSnapshot = await getDocs(employeeQuery);



    if (!employeeSnapshot.empty) {


        message.style.color = "red";

        message.innerHTML =
        "Employee Code already exists.";

        return;

    }



    // Save Data

    const employeeData = {


        employeeCode:
        employeeCode.value.trim(),


        teacherName:
        teacherName.value.trim(),


        mobileNumber:
        mobileNumber.value.trim(),


        region:
        region.value,


        state:
        state.value,


        city:
        city.value,


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


        createdAt:
        serverTimestamp()

    };



    try {


        await setDoc(

            doc(
                db,
                "employees",
                employeeCode.value.trim()
            ),

            employeeData

        );



        message.style.color = "green";


        message.innerHTML =
        "Registration Successful. Waiting for Admin Approval.";



        registerForm.reset();



    }

    catch(error) {


        console.error(error);


        message.style.color = "red";


        message.innerHTML =
        error.message;


    }


});
