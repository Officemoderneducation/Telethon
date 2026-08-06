// ======================================
// Import Firebase
// ======================================

import { db } from "./firebase-config.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// Get Elements
// ======================================

const fileInput = document.getElementById("fileInput");
const importBtn = document.getElementById("importBtn");
const status = document.getElementById("status");


// ======================================
// Import Button Click
// ======================================

importBtn.addEventListener("click", () => {

    const file = fileInput.files[0];

    if (!file) {
        alert("Please Select CSV File");
        return;
    }

    status.innerHTML = "Reading File...";

    const reader = new FileReader();

    reader.onload = async function (event) {

        const csv = event.target.result;

        const rows = csv.split(/\r?\n/);

        await uploadCities(rows);

    };

    reader.onerror = function () {

        status.innerHTML = "❌ File Read Failed";

    };

    reader.readAsText(file);

});


// ======================================
// Upload Cities
// ======================================

async function uploadCities(rows) {

    let total = 0;
    let skipped = 0;

    status.innerHTML = "Uploading...";

    for (let i = 1; i < rows.length; i++) {

        if (rows[i].trim() === "") {
            continue;
        }

        const data = rows[i].split(",");

        if (data.length < 3) {
            skipped++;
            continue;
        }

        const region = data[0].trim();
        const state = data[1].trim();
        const city = data[2].trim();

        if (!region || !state || !city) {
            skipped++;
            continue;
        }

        // Create Unique Document ID

        const documentId = `${region}_${state}_${city}`
            .replace(/\s+/g, "_")
            .replace(/[&/]/g, "_")
            .toUpperCase();

        try {

            await setDoc(

                doc(db, "cities", documentId),

                {

                    name: city,
                    state: state,
                    region: region,
                    createdAt: new Date()

                }

            );

            total++;

            status.innerHTML =
                `Uploading... ${total} Cities Imported`;

        }

        catch (error) {

            console.error(error);

            skipped++;

        }

    }

    status.innerHTML =

        `✅ Import Completed <br><br>
        Total Imported : ${total}<br>
        Skipped : ${skipped}`;

    alert("Cities Imported Successfully");

}
