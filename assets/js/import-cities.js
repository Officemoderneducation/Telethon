import { db } from "./firebase-config.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const fileInput = document.getElementById("fileInput");
const importBtn = document.getElementById("importBtn");
const status = document.getElementById("status");

importBtn.addEventListener("click", () => {

    const file = fileInput.files[0];

    if (!file) {

        alert("Please Select CSV File");

        return;

    }

    const reader = new FileReader();

    reader.onload = function (e) {

        const csv = e.target.result;

        const rows = csv.split(/\r?\n/);

        uploadCities(rows);

    };

    reader.readAsText(file);

});
async function uploadCities(rows) {

    status.innerHTML = "Uploading... Please Wait";

    let total = 0;

    for (let i = 1; i < rows.length; i++) {

        if (rows[i].trim() === "") continue;

        const data = rows[i].split(",");

        const region = data[0]?.trim();

        const state = data[1]?.trim();

        const city = data[2]?.trim();

        if (!region || !state || !city) continue;

        try {

            await setDoc(

                doc(db, "cities", city),

                {

                    name: city,

                    state: state,

                    region: region

                }

            );

            total++;

            status.innerHTML = `Uploading... ${total} Cities`;

        } catch (error) {

            console.error(error);

        }

    }

    status.innerHTML = `✅ ${total} Cities Imported Successfully`;

}
const documentId = `${region}_${state}_${city}`
    .replace(/\s+/g, "_")
    .replace(/[&/]/g, "_");

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

status.innerHTML = `Uploading... ${total} Cities`;
