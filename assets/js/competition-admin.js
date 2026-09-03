// ======================================
// TELETHON - COMPETITION ADMIN
// ======================================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// FIRESTORE DOCUMENT
// ======================================

const competitionRef = doc(
    db,
    "competitionAdmin",
    "main"
);


// ======================================
// HTML ELEMENTS
// ======================================

const competitionName =
    document.getElementById("competitionName");

const competitionDate =
    document.getElementById("competitionDate");

const competitionEndTime =
    document.getElementById("competitionEndTime");

const competitionStatus =
    document.getElementById("competitionStatus");


// Team A

const teamAName =
    document.getElementById("teamAName");

const teamAId =
    document.getElementById("teamAId");

const teamAPassword =
    document.getElementById("teamAPassword");

const teamAAmount =
    document.getElementById("teamAAmount");


// Team B

const teamBName =
    document.getElementById("teamBName");

const teamBId =
    document.getElementById("teamBId");

const teamBPassword =
    document.getElementById("teamBPassword");

const teamBAmount =
    document.getElementById("teamBAmount");


// Team C

const teamCName =
    document.getElementById("teamCName");

const teamCId =
    document.getElementById("teamCId");

const teamCPassword =
    document.getElementById("teamCPassword");

const teamCAmount =
    document.getElementById("teamCAmount");


// ======================================
// MESSAGE
// ======================================

function showMessage(text, type) {

    const message =
        document.getElementById("message");

    message.textContent = text;

    message.className = type;

    setTimeout(() => {

        message.className = "";

    }, 3000);

}


// ======================================
// NUMBER VALUE
// ======================================

function numberValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================
// FORMAT AMOUNT
// ======================================

function formatAmount(amount) {

    return "₹" +
        numberValue(amount)
            .toLocaleString("en-IN");

}


// ======================================
// UNIT
// 1 UNIT = ₹7,000
// ======================================

function getUnits(amount) {

    return numberValue(amount) / 7000;

}


// ======================================
// UPDATE LIVE COMPARISON
// ======================================

function updateComparison() {

    const a =
        numberValue(teamAAmount.value);

    const b =
        numberValue(teamBAmount.value);

    const c =
        numberValue(teamCAmount.value);


    // ----------------------------------
    // TEAM NAMES
    // ----------------------------------

    document.getElementById(
        "displayTeamA"
    ).textContent =
        teamAName.value.trim() ||
        "Team A";


    document.getElementById(
        "displayTeamB"
    ).textContent =
        teamBName.value.trim() ||
        "Team B";


    document.getElementById(
        "displayTeamC"
    ).textContent =
        teamCName.value.trim() ||
        "Team C";


    // ----------------------------------
    // AMOUNTS
    // ----------------------------------

    document.getElementById(
        "displayAmountA"
    ).textContent =
        formatAmount(a);


    document.getElementById(
        "displayAmountB"
    ).textContent =
        formatAmount(b);


    document.getElementById(
        "displayAmountC"
    ).textContent =
        formatAmount(c);


    // ----------------------------------
    // UNITS
    // ----------------------------------

    document.getElementById(
        "displayUnitA"
    ).textContent =
        getUnits(a).toFixed(2) +
        " Units";


    document.getElementById(
        "displayUnitB"
    ).textContent =
        getUnits(b).toFixed(2) +
        " Units";


    document.getElementById(
        "displayUnitC"
    ).textContent =
        getUnits(c).toFixed(2) +
        " Units";


    // ----------------------------------
    // REMOVE OLD WINNER
    // ----------------------------------

    document
        .getElementById("comparisonA")
        .classList
        .remove("winner");

    document
        .getElementById("comparisonB")
        .classList
        .remove("winner");

    document
        .getElementById("comparisonC")
        .classList
        .remove("winner");


    const winnerText =
        document.getElementById(
            "winnerText"
        );

    const winnerAmount =
        document.getElementById(
            "winnerAmount"
        );


    // ----------------------------------
    // NO AMOUNT
    // ----------------------------------

    if (a === 0 && b === 0 && c === 0) {

        winnerText.textContent =
            "No Winner Yet";

        winnerAmount.textContent =
            "Update team amounts to calculate the winner.";

        return;
    }


    // ----------------------------------
    // FIND HIGHEST
    // ----------------------------------

    const max =
        Math.max(a, b, c);

    const winners = [];


    if (a === max) {
        winners.push("A");
    }

    if (b === max) {
        winners.push("B");
    }

    if (c === max) {
        winners.push("C");
    }


    // ----------------------------------
    // DRAW
    // ----------------------------------

    if (winners.length > 1) {

        winnerText.textContent =
            "DRAW";

        winnerAmount.textContent =
            "Two or more teams have the same highest amount.";

        return;
    }


    // ----------------------------------
    // WINNER
    // ----------------------------------

    const winner =
        winners[0];

    let winnerName = "";


    if (winner === "A") {

        winnerName =
            teamAName.value.trim() ||
            "Team A";

        document
            .getElementById("comparisonA")
            .classList
            .add("winner");

    }


    if (winner === "B") {

        winnerName =
            teamBName.value.trim() ||
            "Team B";

        document
            .getElementById("comparisonB")
            .classList
            .add("winner");

    }


    if (winner === "C") {

        winnerName =
            teamCName.value.trim() ||
            "Team C";

        document
            .getElementById("comparisonC")
            .classList
            .add("winner");

    }


    winnerText.textContent =
        winnerName + " WINNER";


    winnerAmount.textContent =
        "Winning Amount: " +
        formatAmount(max);

}


// ======================================
// SAVE COMPETITION
// ======================================

async function saveCompetition() {

    try {

        const data = {

            name:
                competitionName.value.trim(),

            date:
                competitionDate.value,

            endTime:
                competitionEndTime.value,

            status:
                competitionStatus.value,


            teamA: {

                name:
                    teamAName.value.trim(),

                loginId:
                    teamAId.value.trim(),

                password:
                    teamAPassword.value,

                amount:
                    numberValue(
                        teamAAmount.value
                    )

            },


            teamB: {

                name:
                    teamBName.value.trim(),

                loginId:
                    teamBId.value.trim(),

                password:
                    teamBPassword.value,

                amount:
                    numberValue(
                        teamBAmount.value
                    )

            },


            teamC: {

                name:
                    teamCName.value.trim(),

                loginId:
                    teamCId.value.trim(),

                password:
                    teamCPassword.value,

                amount:
                    numberValue(
                        teamCAmount.value
                    )

            },


            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            competitionRef,
            data,
            {
                merge: true
            }
        );


        showMessage(
            "Competition saved successfully.",
            "success"
        );


        updateComparison();


    } catch (error) {

        console.error(
            "Competition Save Error:",
            error
        );

        showMessage(
            "Competition save nahi ho saki.",
            "error"
        );

    }

}


// ======================================
// LOAD COMPETITION
// ======================================

async function loadCompetition() {

    try {

        const snapshot =
            await getDoc(
                competitionRef
            );


        if (!snapshot.exists()) {

            // Default names

            teamAName.value =
                "Team A";

            teamBName.value =
                "Team B";

            teamCName.value =
                "Team C";


            teamAAmount.value = 0;
            teamBAmount.value = 0;
            teamCAmount.value = 0;


            updateComparison();

            updateStatus();

            return;
        }


        const data =
            snapshot.data();


        // ----------------------------------
        // COMPETITION
        // ----------------------------------

        competitionName.value =
            data.name || "";

        competitionDate.value =
            data.date || "";

        competitionEndTime.value =
            data.endTime || "";

        competitionStatus.value =
            data.status || "active";


        // ----------------------------------
        // TEAM A
        // ----------------------------------

        const a =
            data.teamA || {};

        teamAName.value =
            a.name || "Team A";

        teamAId.value =
            a.loginId || "";

        teamAPassword.value =
            a.password || "";

        teamAAmount.value =
            numberValue(a.amount);


        // ----------------------------------
        // TEAM B
        // ----------------------------------

        const b =
            data.teamB || {};

        teamBName.value =
            b.name || "Team B";

        teamBId.value =
            b.loginId || "";

        teamBPassword.value =
            b.password || "";

        teamBAmount.value =
            numberValue(b.amount);


        // ----------------------------------
        // TEAM C
        // ----------------------------------

        const c =
            data.teamC || {};

        teamCName.value =
            c.name || "Team C";

        teamCId.value =
            c.loginId || "";

        teamCPassword.value =
            c.password || "";

        teamCAmount.value =
            numberValue(c.amount);


        updateComparison();

        updateStatus();


    } catch (error) {

        console.error(
            "Competition Load Error:",
            error
        );

        showMessage(
            "Competition data load nahi hua.",
            "error"
        );

    }

}


// ======================================
// STATUS
// ======================================

function updateStatus() {

    const badge =
        document.getElementById(
            "statusBadge"
        );


    if (
        competitionStatus.value ===
        "active"
    ) {

        badge.innerHTML = `
            <span class="status status-active">
                <i class="fa-solid fa-circle"></i>
                Active
            </span>
        `;

    } else {

        badge.innerHTML = `
            <span class="status status-ended">
                <i class="fa-solid fa-circle"></i>
                Ended
            </span>
        `;

    }

}


// ======================================
// RESET FORM
// ======================================

function resetForm() {

    competitionName.value = "";

    competitionDate.value = "";

    competitionEndTime.value = "";

    competitionStatus.value =
        "active";


    teamAName.value =
        "Team A";

    teamAId.value = "";

    teamAPassword.value = "";

    teamAAmount.value = 0;


    teamBName.value =
        "Team B";

    teamBId.value = "";

    teamBPassword.value = "";

    teamBAmount.value = 0;


    teamCName.value =
        "Team C";

    teamCId.value = "";

    teamCPassword.value = "";

    teamCAmount.value = 0;


    updateComparison();

    updateStatus();

}


// ======================================
// SAVE BUTTON
// ======================================

document
    .getElementById("saveBtn")
    .addEventListener(
        "click",
        saveCompetition
    );


// ======================================
// RESET BUTTON
// ======================================

document
    .getElementById("resetBtn")
    .addEventListener(
        "click",
        resetForm
    );


// ======================================
// STATUS CHANGE
// ======================================

competitionStatus
    .addEventListener(
        "change",
        updateStatus
    );


// ======================================
// LIVE UPDATE
// ======================================

[
    teamAName,
    teamAAmount,
    teamBName,
    teamBAmount,
    teamCName,
    teamCAmount
].forEach(element => {

    element.addEventListener(
        "input",
        updateComparison
    );

});


// ======================================
// START
// ======================================

loadCompetition();
