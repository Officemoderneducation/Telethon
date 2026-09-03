import {
    getAuth,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";


/*
====================================================
COMPETITION ADMIN
====================================================
*/


const competitionRef =
    doc(db, "competitionAdmin", "main");


const competitionName =
    document.getElementById("competitionName");

const competitionDate =
    document.getElementById("competitionDate");

const competitionEndTime =
    document.getElementById("competitionEndTime");


const teamAName =
    document.getElementById("teamAName");

const teamAId =
    document.getElementById("teamAId");

const teamAPassword =
    document.getElementById("teamAPassword");


const teamBName =
    document.getElementById("teamBName");

const teamBId =
    document.getElementById("teamBId");

const teamBPassword =
    document.getElementById("teamBPassword");


const teamCName =
    document.getElementById("teamCName");

const teamCId =
    document.getElementById("teamCId");

const teamCPassword =
    document.getElementById("teamCPassword");


const saveBtn =
    document.getElementById("saveBtn");

const status =
    document.getElementById("status");


function makeEmail(id) {

    return (
        id.trim().toLowerCase()
        + "@telethoncompetition.local"
    );

}


function money(value) {

    return "₹" +
        Number(value || 0)
        .toLocaleString("en-IN");

}


function setValue(element, value) {

    if (element) {

        element.value =
            value || "";

    }

}


function loadCompetition(data) {

    setValue(
        competitionName,
        data.name
    );

    setValue(
        competitionDate,
        data.date
    );

    setValue(
        competitionEndTime,
        data.endTime
    );


    setValue(
        teamAName,
        data.teamA?.name
    );

    setValue(
        teamAId,
        data.teamA?.loginId
    );


    setValue(
        teamBName,
        data.teamB?.name
    );

    setValue(
        teamBId,
        data.teamB?.loginId
    );


    setValue(
        teamCName,
        data.teamC?.name
    );

    setValue(
        teamCId,
        data.teamC?.loginId
    );


    updateLive(data);

}


function updateLive(data) {

    const a =
        data.teamA || {};

    const b =
        data.teamB || {};

    const c =
        data.teamC || {};


    document.getElementById("liveAName")
        .textContent =
        a.name || "Team A";

    document.getElementById("liveBName")
        .textContent =
        b.name || "Team B";

    document.getElementById("liveCName")
        .textContent =
        c.name || "Team C";


    document.getElementById("liveAAmount")
        .textContent =
        money(a.amount);

    document.getElementById("liveBAmount")
        .textContent =
        money(b.amount);

    document.getElementById("liveCAmount")
        .textContent =
        money(c.amount);


    const amounts = [

        Number(a.amount || 0),
        Number(b.amount || 0),
        Number(c.amount || 0)

    ];


    const max =
        Math.max(...amounts);


    const winnerElement =
        document.getElementById("winner");


    if (max === 0) {

        winnerElement.textContent =
            "Winner: -";

        return;
    }


    const winners = [];


    if (amounts[0] === max) {

        winners.push(
            a.name || "Team A"
        );

    }


    if (amounts[1] === max) {

        winners.push(
            b.name || "Team B"
        );

    }


    if (amounts[2] === max) {

        winners.push(
            c.name || "Team C"
        );

    }


    if (winners.length > 1) {

        winnerElement.textContent =
            "Result: DRAW";

    } else {

        winnerElement.textContent =
            "Winner: " + winners[0];

    }

}


/*
====================================================
CREATE TEAM AUTH ACCOUNT
====================================================
*/

async function createTeamAccount(
    id,
    password,
    team,
    teamName
) {

    if (!id || !password) {

        return null;

    }


    const email =
        makeEmail(id);


    /*
    Secondary Firebase app prevents
    signing out the Admin account.
    */

    const { initializeApp } =
        await import(
            "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js"
        );


    const { getAuth: getSecondaryAuth } =
        await import(
            "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js"
        );


    const firebaseConfig = {

        apiKey:
            "AIzaSyCj3BBjywNWl4ScDJUyrmslg4bHrlMiu_Q",

        authDomain:
            "telethoon.firebaseapp.com",

        projectId:
            "telethoon",

        storageBucket:
            "telethoon.firebasestorage.app",

        messagingSenderId:
            "853450341855",

        appId:
            "1:853450341855:web:356f9ec0e9a6f88c75d86a",

        measurementId:
            "G-EWP905EGQ1"

    };


    const secondaryApp =
        initializeApp(
            firebaseConfig,
            "competitionTeam_" + team
        );


    const secondaryAuth =
        getSecondaryAuth(
            secondaryApp
        );


    const credential =
        await createUserWithEmailAndPassword(
            secondaryAuth,
            email,
            password
        );


    await setDoc(
        doc(
            db,
            "competitionTeams",
            credential.user.uid
        ),
        {
            team: team,
            teamName: teamName,
            loginId: id,
            role: "competition_team",
            active: true,
            createdAt: serverTimestamp()
        }
    );


    return credential.user.uid;

}


/*
====================================================
SAVE
====================================================
*/

saveBtn.addEventListener(
    "click",
    async () => {

        saveBtn.disabled = true;

        status.textContent =
            "Saving...";


        try {

            const existing =
                await getDoc(
                    competitionRef
                );


            let existingData =
                existing.exists()
                    ? existing.data()
                    : {};


            /*
            ========================================
            TEAM A ACCOUNT
            ========================================
            */

            let teamAUid =
                existingData.teamA?.uid || null;


            if (
                !teamAUid &&
                teamAId.value.trim() &&
                teamAPassword.value
            ) {

                teamAUid =
                    await createTeamAccount(
                        teamAId.value,
                        teamAPassword.value,
                        "A",
                        teamAName.value
                    );

            }


            /*
            ========================================
            TEAM B ACCOUNT
            ========================================
            */

            let teamBUid =
                existingData.teamB?.uid || null;


            if (
                !teamBUid &&
                teamBId.value.trim() &&
                teamBPassword.value
            ) {

                teamBUid =
                    await createTeamAccount(
                        teamBId.value,
                        teamBPassword.value,
                        "B",
                        teamBName.value
                    );

            }


            /*
            ========================================
            TEAM C ACCOUNT
            ========================================
            */

            let teamCUid =
                existingData.teamC?.uid || null;


            if (
                !teamCUid &&
                teamCId.value.trim() &&
                teamCPassword.value
            ) {

                teamCUid =
                    await createTeamAccount(
                        teamCId.value,
                        teamCPassword.value,
                        "C",
                        teamCName.value
                    );

            }


            const competitionData = {

                name:
                    competitionName.value.trim(),

                date:
                    competitionDate.value,

                endTime:
                    competitionEndTime.value,

                teamA: {

                    name:
                        teamAName.value.trim(),

                    loginId:
                        teamAId.value.trim(),

                    uid:
                        teamAUid,

                    amount:
                        Number(
                            existingData.teamA?.amount || 0
                        )

                },

                teamB: {

                    name:
                        teamBName.value.trim(),

                    loginId:
                        teamBId.value.trim(),

                    uid:
                        teamBUid,

                    amount:
                        Number(
                            existingData.teamB?.amount || 0
                        )

                },

                teamC: {

                    name:
                        teamCName.value.trim(),

                    loginId:
                        teamCId.value.trim(),

                    uid:
                        teamCUid,

                    amount:
                        Number(
                            existingData.teamC?.amount || 0
                        )

                },

                updatedAt:
                    serverTimestamp()

            };


            await setDoc(
                competitionRef,
                competitionData,
                { merge: true }
            );


            teamAPassword.value = "";
            teamBPassword.value = "";
            teamCPassword.value = "";


            status.textContent =
                "Competition saved successfully.";


        } catch (error) {

            console.error(error);

            status.textContent =
                error.message ||
                "Save failed.";

        }


        saveBtn.disabled = false;

    }
);


/*
====================================================
LIVE DATA
====================================================
*/

onSnapshot(
    competitionRef,
    snapshot => {

        if (
            snapshot.exists()
        ) {

            loadCompetition(
                snapshot.data()
            );

        }

    }
);


/*
====================================================
ADMIN CHECK
====================================================

This page expects the existing Admin login
to already be authenticated.
*/

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            /*
            If your existing admin authentication
            is required, redirect here.
            */

            console.log(
                "Competition Admin: no Firebase user."
            );

        }

    }
);


/*
====================================================
LOGOUT
====================================================
*/

document.getElementById("logoutBtn")
    .addEventListener(
        "click",
        async () => {

            await signOut(auth);

            window.location.href =
                "index.html";

        }
    );
