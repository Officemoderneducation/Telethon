// ======================================================
// SEPARATE COMPETITION TEAM
// ======================================================

import {
    onAuthStateChanged,
    signOut
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc,
    onSnapshot,
    updateDoc
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";


const competitionRef =
    doc(
        db,
        "competitionAdmin",
        "main"
    );


let currentTeam = null;


// ======================================================
// DOM
// ======================================================

const teamTitle =
    document.getElementById("teamTitle");

const loginInfo =
    document.getElementById("loginInfo");

const competitionName =
    document.getElementById("competitionName");

const competitionDate =
    document.getElementById("competitionDate");

const myAmount =
    document.getElementById("myAmount");

const amountInput =
    document.getElementById("amountInput");

const updateBtn =
    document.getElementById("updateBtn");

const winner =
    document.getElementById("winner");


// ======================================================
// MONEY
// ======================================================

function money(value) {

    return "₹" +
        Number(value || 0)
            .toLocaleString("en-IN");

}


// ======================================================
// WINNER
// ======================================================

function calculateWinner(data) {

    const A =
        Number(
            data.teamA?.amount || 0
        );

    const B =
        Number(
            data.teamB?.amount || 0
        );

    const C =
        Number(
            data.teamC?.amount || 0
        );


    const max =
        Math.max(A, B, C);


    if (max === 0) {

        winner.textContent =
            "Winner: -";

        return;

    }


    const winners = [];


    if (A === max) {

        winners.push(
            data.teamA?.name ||
            "Team A"
        );

    }


    if (B === max) {

        winners.push(
            data.teamB?.name ||
            "Team B"
        );

    }


    if (C === max) {

        winners.push(
            data.teamC?.name ||
            "Team C"
        );

    }


    if (winners.length > 1) {

        winner.textContent =
            "Result: DRAW";

    } else {

        winner.textContent =
            "Winner: " +
            winners[0];

    }

}


// ======================================================
// DISPLAY COMPETITION
// ======================================================

function showCompetition(data) {

    competitionName.textContent =
        data.name ||
        "Competition";


    competitionDate.textContent =
        data.date ||
        "-";


    const A =
        data.teamA || {};

    const B =
        data.teamB || {};

    const C =
        data.teamC || {};


    document.getElementById(
        "teamAName"
    ).textContent =
        A.name ||
        "Team A";


    document.getElementById(
        "teamBName"
    ).textContent =
        B.name ||
        "Team B";


    document.getElementById(
        "teamCName"
    ).textContent =
        C.name ||
        "Team C";


    document.getElementById(
        "teamAAmount"
    ).textContent =
        money(A.amount);


    document.getElementById(
        "teamBAmount"
    ).textContent =
        money(B.amount);


    document.getElementById(
        "teamCAmount"
    ).textContent =
        money(C.amount);


    let amount = 0;


    if (currentTeam === "A") {

        amount =
            A.amount || 0;

    }


    if (currentTeam === "B") {

        amount =
            B.amount || 0;

    }


    if (currentTeam === "C") {

        amount =
            C.amount || 0;

    }


    myAmount.textContent =
        money(amount);


    calculateWinner(data);

}


// ======================================================
// UPDATE OWN TEAM AMOUNT
// ======================================================

async function updateAmount() {

    if (!currentTeam) {

        alert(
            "Team information not loaded."
        );

        return;

    }


    const value =
        Number(
            amountInput.value
        );


    if (
        !Number.isFinite(value) ||
        value < 0
    ) {

        alert(
            "Please enter a valid amount."
        );

        return;

    }


    updateBtn.disabled = true;

    updateBtn.textContent =
        "Updating...";


    try {

        if (currentTeam === "A") {

            await updateDoc(
                competitionRef,
                {
                    "teamA.amount":
                        value
                }
            );

        }


        if (currentTeam === "B") {

            await updateDoc(
                competitionRef,
                {
                    "teamB.amount":
                        value
                }
            );

        }


        if (currentTeam === "C") {

            await updateDoc(
                competitionRef,
                {
                    "teamC.amount":
                        value
                }
            );

        }


        amountInput.value = "";


    } catch (error) {

        console.error(
            "AMOUNT UPDATE ERROR:",
            error
        );


        alert(
            "Amount update failed."
        );

    }


    updateBtn.disabled = false;

    updateBtn.textContent =
        "Update My Amount";

}


// ======================================================
// UPDATE BUTTON
// ======================================================

updateBtn.addEventListener(
    "click",
    updateAmount
);


// ======================================================
// LOGOUT
// ======================================================

document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    async () => {

        await signOut(auth);

        window.location.href =
            "competition-login.html";

    }
);


// ======================================================
// AUTH CHECK
// ======================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "competition-login.html";

            return;

        }


        try {

            const teamSnap =
                await getDoc(
                    doc(
                        db,
                        "competitionTeams",
                        user.uid
                    )
                );


            if (!teamSnap.exists()) {

                await signOut(auth);

                window.location.href =
                    "competition-login.html";

                return;

            }


            const teamData =
                teamSnap.data();


            if (
                teamData.role !==
                "competition_team"
            ) {

                await signOut(auth);

                window.location.href =
                    "competition-login.html";

                return;

            }


            currentTeam =
                teamData.team;


            teamTitle.textContent =
                teamData.teamName ||
                "Team " + currentTeam;


            loginInfo.textContent =
                "Team " +
                currentTeam;


            // ==========================================
            // LIVE FIRESTORE
            // ==========================================

            onSnapshot(
                competitionRef,
                snapshot => {

                    if (
                        snapshot.exists()
                    ) {

                        showCompetition(
                            snapshot.data()
                        );

                    }

                },
                error => {

                    console.error(
                        error
                    );

                }
            );


        } catch (error) {

            console.error(
                error
            );

            await signOut(auth);

            window.location.href =
                "competition-login.html";

        }

    }
);
