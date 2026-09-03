import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "./firebase-config.js";


const firebaseConfig = {
    apiKey: "AIzaSyCj3BBjywNWl4ScDJUyrmslg4bHrlMiu_Q",
    authDomain: "telethoon.firebaseapp.com",
    projectId: "telethoon",
    storageBucket: "telethoon.firebasestorage.app",
    messagingSenderId: "853450341855",
    appId: "1:853450341855:web:356f9ec0e9a6f88c75d86a",
    measurementId: "G-EWP905EGQ1"
};

const app = initializeApp(
    firebaseConfig,
    "competitionLoginApp"
);

const auth = getAuth(app);

const loginId =
    document.getElementById("loginId");

const password =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const message =
    document.getElementById("message");


function makeEmail(id) {

    return (
        id.trim().toLowerCase()
        + "@telethoncompetition.local"
    );

}


loginBtn.addEventListener("click", async () => {

    const id = loginId.value.trim();
    const pass = password.value;

    if (!id || !pass) {

        message.textContent =
            "Team ID and Password required.";

        return;
    }

    message.textContent = "Logging in...";

    try {

        const email = makeEmail(id);

        const result =
            await signInWithEmailAndPassword(
                auth,
                email,
                pass
            );

        const uid = result.user.uid;

        const teamDoc =
            await getDoc(
                doc(db, "competitionTeams", uid)
            );

        if (!teamDoc.exists()) {

            await auth.signOut();

            message.textContent =
                "Competition team account not configured.";

            return;
        }

        const data = teamDoc.data();

        if (
            data.role !== "competition_team" ||
            data.active === false
        ) {

            await auth.signOut();

            message.textContent =
                "This team account is inactive.";

            return;
        }

        window.location.href =
            "competition-team.html";

    } catch (error) {

        console.error(error);

        message.textContent =
            "Invalid Team ID or Password.";

    }

});


onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    try {

        const snap =
            await getDoc(
                doc(db, "competitionTeams", user.uid)
            );

        if (snap.exists()) {

            window.location.href =
                "competition-team.html";

        }

    } catch (error) {

        console.error(error);

    }

});
