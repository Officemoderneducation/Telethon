// ======================================================
// SEPARATE COMPETITION TEAM LOGIN
// ======================================================

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";


const loginId =
    document.getElementById("loginId");

const password =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const message =
    document.getElementById("message");


// ======================================================
// SAME EMAIL FORMAT USED BY ADMIN
// ======================================================

function makeEmail(id) {

    return (
        id
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9._-]/g, "")
        + "@telethoncompetition.com"
    );

}


// ======================================================
// LOGIN
// ======================================================

loginBtn.addEventListener(
    "click",
    async () => {

        const id =
            loginId.value.trim();

        const pass =
            password.value;


        if (!id || !pass) {

            message.textContent =
                "Team ID and Password required.";

            return;

        }


        loginBtn.disabled = true;

        message.textContent =
            "Logging in...";


        try {

            const email =
                makeEmail(id);


            const result =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    pass
                );


            const uid =
                result.user.uid;


            const teamRef =
                doc(
                    db,
                    "competitionTeams",
                    uid
                );


            const teamSnap =
                await getDoc(teamRef);


            if (!teamSnap.exists()) {

                await auth.signOut();

                throw new Error(
                    "Team account is not configured."
                );

            }


            const team =
                teamSnap.data();


            if (
                team.role !==
                    "competition_team"
            ) {

                await auth.signOut();

                throw new Error(
                    "Invalid competition account."
                );

            }


            if (
                team.active === false
            ) {

                await auth.signOut();

                throw new Error(
                    "This team account is inactive."
                );

            }


            window.location.href =
                "competition-team.html";


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                message.textContent =
                    "Invalid Team ID or Password.";

            } else {

                message.textContent =
                    error.message ||
                    "Invalid Team ID or Password.";

            }

        }


        loginBtn.disabled = false;

    }
);


// ======================================================
// ALREADY LOGGED IN
// ======================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) return;


        try {

            const snap =
                await getDoc(
                    doc(
                        db,
                        "competitionTeams",
                        user.uid
                    )
                );


            if (snap.exists()) {

                window.location.href =
                    "competition-team.html";

            }

        } catch (error) {

            console.error(error);

        }

    }
);
