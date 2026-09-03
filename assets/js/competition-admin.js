// ======================================================
// TELETHON - SEPARATE COMPETITION ADMIN
// ======================================================

import {
    initializeApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    signOut,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp,
    deleteField
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {
    apiKey: "AIzaSyCj3BBjywNWl4ScDJUyrmslg4bHrlMiu_Q",
    authDomain: "telethoon.firebaseapp.com",
    projectId: "telethoon",
    storageBucket: "telethoon.firebasestorage.app",
    messagingSenderId: "853450341855",
    appId: "1:853450341855:web:356f9ec0e9a6f88c75d86a",
    measurementId: "G-EWP905EGQ1"
};


// ======================================================
// DOM
// ======================================================

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

const statusBox =
    document.getElementById("status");


// ======================================================
// FIRESTORE
// ======================================================

const competitionRef =
    doc(db, "competitionAdmin", "main");


// ======================================================
// SECONDARY AUTH
// ======================================================

const secondaryAppName =
    "TelethonCompetitionAuth";

let secondaryApp;

const existingApps = getApps();

const foundApp =
    existingApps.find(
        app => app.name === secondaryAppName
    );

if (foundApp) {

    secondaryApp = foundApp;

} else {

    secondaryApp =
        initializeApp(
            firebaseConfig,
            secondaryAppName
        );

}

const secondaryAuth =
    getAuth(secondaryApp);


// ======================================================
// INTERNAL EMAIL
// ======================================================

function makeEmail(loginId) {

    return (
        loginId
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9._-]/g, "")
        + "@telethoncompetition.com"
    );

}


// ======================================================
// MONEY
// ======================================================

function money(value) {

    return "₹" +
        Number(value || 0)
            .toLocaleString("en-IN");

}


// ======================================================
// LOAD FORM
// ======================================================

function loadForm(data) {

    competitionName.value =
        data.name || "";

    competitionDate.value =
        data.date || "";

    competitionEndTime.value =
        data.endTime || "";


    teamAName.value =
        data.teamA?.name || "";

    teamAId.value =
        data.teamA?.loginId || "";


    teamBName.value =
        data.teamB?.name || "";

    teamBId.value =
        data.teamB?.loginId || "";


    teamCName.value =
        data.teamC?.name || "";

    teamCId.value =
        data.teamC?.loginId || "";


    updateLive(data);

}


// ======================================================
// LIVE DISPLAY
// ======================================================

function updateLive(data) {

    const A = data.teamA || {};
    const B = data.teamB || {};
    const C = data.teamC || {};


    document.getElementById("liveAName")
        .textContent =
        A.name || "Team A";

    document.getElementById("liveBName")
        .textContent =
        B.name || "Team B";

    document.getElementById("liveCName")
        .textContent =
        C.name || "Team C";


    document.getElementById("liveAAmount")
        .textContent =
        money(A.amount);

    document.getElementById("liveBAmount")
        .textContent =
        money(B.amount);

    document.getElementById("liveCAmount")
        .textContent =
        money(C.amount);


    const a =
        Number(A.amount || 0);

    const b =
        Number(B.amount || 0);

    const c =
        Number(C.amount || 0);


    const max =
        Math.max(a, b, c);


    const winner =
        document.getElementById("winner");


    if (max === 0) {

        winner.textContent =
            "Winner: -";

        return;
    }


    const winners = [];


    if (a === max)
        winners.push(A.name || "Team A");

    if (b === max)
        winners.push(B.name || "Team B");

    if (c === max)
        winners.push(C.name || "Team C");


    if (winners.length > 1) {

        winner.textContent =
            "Result: DRAW";

    } else {

        winner.textContent =
            "Winner: " + winners[0];

    }

}


// ======================================================
// CREATE FIREBASE AUTH USER
// ======================================================

async function createTeamUser(
    loginId,
    password,
    team,
    teamName
) {

    const email =
        makeEmail(loginId);


    if (!loginId || !password) {

        throw new Error(
            `Team ${team} ID and Password required.`
        );

    }


    if (password.length < 6) {

        throw new Error(
            `Team ${team} password must be at least 6 characters.`
        );

    }


    console.log(
        `Creating Team ${team}:`,
        email
    );


    const result =
        await createUserWithEmailAndPassword(
            secondaryAuth,
            email,
            password
        );


    const uid =
        result.user.uid;


    await setDoc(
        doc(
            db,
            "competitionTeams",
            uid
        ),
        {
            team: team,
            teamName: teamName || `Team ${team}`,
            loginId: loginId,
            role: "competition_team",
            active: true,
            createdAt: serverTimestamp()
        }
    );


    return uid;

}


// ======================================================
// SAVE COMPETITION
// ======================================================

saveBtn.addEventListener(
    "click",
    async () => {

        saveBtn.disabled = true;

        statusBox.textContent =
            "Saving...";


        try {

            const oldSnap =
                await getDoc(
                    competitionRef
                );


            const oldData =
                oldSnap.exists()
                    ? oldSnap.data()
                    : {};


            let teamAUid =
                oldData.teamA?.uid || null;

            let teamBUid =
                oldData.teamB?.uid || null;

            let teamCUid =
                oldData.teamC?.uid || null;


            // ==================================================
            // CREATE TEAM A ACCOUNT
            // ==================================================

            if (!teamAUid) {

                teamAUid =
                    await createTeamUser(
                        teamAId.value,
                        teamAPassword.value,
                        "A",
                        teamAName.value
                    );

            }


            // ==================================================
            // CREATE TEAM B ACCOUNT
            // ==================================================

            if (!teamBUid) {

                teamBUid =
                    await createTeamUser(
                        teamBId.value,
                        teamBPassword.value,
                        "B",
                        teamBName.value
                    );

            }


            // ==================================================
            // CREATE TEAM C ACCOUNT
            // ==================================================

            if (!teamCUid) {

                teamCUid =
                    await createTeamUser(
                        teamCId.value,
                        teamCPassword.value,
                        "C",
                        teamCName.value
                    );

            }


            // ==================================================
            // SAVE COMPETITION
            // ==================================================

            await setDoc(
                competitionRef,
                {

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
                                oldData.teamA?.amount || 0
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
                                oldData.teamB?.amount || 0
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
                                oldData.teamC?.amount || 0
                            )

                    },


                    updatedAt:
                        serverTimestamp(),

                    // Remove old plaintext passwords
                    password: deleteField(),
                    "teamA.password": deleteField(),
                    "teamB.password": deleteField(),
                    "teamC.password": deleteField()

                },
                {
                    merge: true
                }
            );


            teamAPassword.value = "";
            teamBPassword.value = "";
            teamCPassword.value = "";


            statusBox.textContent =
                "Competition saved successfully.";

            statusBox.style.color =
                "green";


        } catch (error) {

            console.error(
                "COMPETITION ERROR:",
                error
            );


            let msg =
                error.message ||
                "Something went wrong.";


            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                msg =
                    "This Team ID already exists in Firebase Authentication.";

            }


            if (
                error.code ===
                "auth/operation-not-allowed"
            ) {

                msg =
                    "Firebase Console me Email/Password Authentication Enable karo.";

            }


            statusBox.textContent =
                msg;

            statusBox.style.color =
                "red";

        }


        saveBtn.disabled = false;

    }
);


// ======================================================
// REAL-TIME LISTENER
// ======================================================

onSnapshot(
    competitionRef,
    snapshot => {

        if (snapshot.exists()) {

            loadForm(
                snapshot.data()
            );

        }

    },
    error => {

        console.error(error);

        statusBox.textContent =
            "Unable to load competition.";

    }
);


// ======================================================
// LOGOUT
// ======================================================

document.getElementById("logoutBtn")
    .addEventListener(
        "click",
        async () => {

            await signOut(auth);

            window.location.href =
                "index.html";

        }
    );
