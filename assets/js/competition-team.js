import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    onSnapshot,
    updateDoc
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";


const competitionRef =
    doc(db, "competitionAdmin", "main");


let currentTeam = null;


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


document.getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await signOut(auth);

        window.location.href =
            "competition-login.html";

    });


function money(value) {

    return "₹" +
        Number(value || 0)
        .toLocaleString("en-IN");

}


function calculateWinner(data) {

    const a =
        Number(data.teamA?.amount || 0);

    const b =
        Number(data.teamB?.amount || 0);

    const c =
        Number(data.teamC?.amount || 0);

    const max =
        Math.max(a, b, c);

    if (max === 0) {

        winner.textContent =
            "Winner: -";

        return;
    }

    const winners = [];

    if (a === max) winners.push(
        data.teamA?.name || "Team A"
    );

    if (b === max) winners.push(
        data.teamB?.name || "Team B"
    );

    if (c === max) winners.push(
        data.teamC?.name || "Team C"
    );

    if (winners.length > 1) {

        winner.textContent =
            "Result: DRAW";

    } else {

        winner.textContent =
            "Winner: " + winners[0];

    }

}


function showCompetition(data) {

    competitionName.textContent =
        data.name || "Competition";

    competitionDate.textContent =
        data.date || "-";


    const a =
        data.teamA || {};

    const b =
        data.teamB || {};

    const c =
        data.teamC || {};


    document.getElementById("teamAName")
        .textContent = a.name || "Team A";

    document.getElementById("teamBName")
        .textContent = b.name || "Team B";

    document.getElementById("teamCName")
        .textContent = c.name || "Team C";


    document.getElementById("teamAAmount")
        .textContent = money(a.amount);

    document.getElementById("teamBAmount")
        .textContent = money(b.amount);

    document.getElementById("teamCAmount")
        .textContent = money(c.amount);


    let amount = 0;

    if (currentTeam === "A") {
        amount = a.amount || 0;
    }

    if (currentTeam === "B") {
        amount = b.amount || 0;
    }

    if (currentTeam === "C") {
        amount = c.amount || 0;
    }

    myAmount.textContent =
        money(amount);

    calculateWinner(data);

}


async function updateAmount() {

    if (!currentTeam) return;

    const value =
        Number(amountInput.value);

    if (
        Number.isNaN(value) ||
        value < 0
    ) {

        alert("Please enter a valid amount.");

        return;
    }


    updateBtn.disabled = true;

    try {

        if (currentTeam === "A") {

            await updateDoc(
                competitionRef,
                {
                    "teamA.amount": value
                }
            );

        }

        if (currentTeam === "B") {

            await updateDoc(
                competitionRef,
                {
                    "teamB.amount": value
                }
            );

        }

        if (currentTeam === "C") {

            await updateDoc(
                competitionRef,
                {
                    "teamC.amount": value
                }
            );


        }

        amountInput.value = "";

    } catch (error) {

        console.error(error);

        alert(
            "Amount update failed."
        );

    }

    updateBtn.disabled = false;

}


updateBtn.addEventListener(
    "click",
    updateAmount
);


onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "competition-login.html";

            return;
        }


        const teamSnap =
            await import(
                "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"
            ).then(m =>
                m.getDoc(
                    doc(
                        db,
                        "competitionTeams",
                        user.uid
                    )
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

        currentTeam =
            teamData.team;


        teamTitle.textContent =
            teamData.teamName ||
            ("Team " + currentTeam);


        loginInfo.textContent =
            "Team " + currentTeam;


        onSnapshot(
            competitionRef,
            snapshot => {

                if (snapshot.exists()) {

                    showCompetition(
                        snapshot.data()
                    );

                }

            }
        );

    }
);
