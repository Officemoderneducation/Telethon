// ======================================================
// TELETHON
// ADMIN SIDEBAR
// CENTRAL SIDEBAR LOADER
// ======================================================


/* ======================================================
   FIREBASE
====================================================== */

import {
    auth
} from "./firebase-config.js";


import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";



/* ======================================================
   SIDEBAR FILE
====================================================== */

const SIDEBAR_FILE =
    "components/admin-sidebar.html";



/* ======================================================
   GET CURRENT PAGE
====================================================== */

function getCurrentPage() {

    let currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (!currentPage) {

        currentPage =
            "dashboard.html";

    }


    return currentPage;

}



/* ======================================================
   ACTIVE MENU
====================================================== */

function setActiveMenu() {

    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );


    if (!sidebar) {

        return;

    }


    const currentPage =
        getCurrentPage();


    const menuLinks =
        sidebar.querySelectorAll(
            ".admin-sidebar-menu a[data-page]"
        );


    menuLinks.forEach(
        function (link) {

            const page =
                (
                    link.getAttribute(
                        "data-page"
                    ) || ""
                )
                .toLowerCase();


            link.classList.remove(
                "active"
            );


            if (
                page === currentPage
            ) {

                link.classList.add(
                    "active"
                );

            }

        }
    );

}



/* ======================================================
   LOGOUT
====================================================== */

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "adminLogoutBtn"
        );


    if (!logoutBtn) {

        return;

    }


    if (
        logoutBtn.dataset.logoutReady ===
        "true"
    ) {

        return;

    }


    logoutBtn.dataset.logoutReady =
        "true";


    logoutBtn.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            const confirmLogout =
                confirm(
                    "Kya aap Admin Panel se Logout karna chahte hain?"
                );


            if (!confirmLogout) {

                return;

            }


            try {


                /* ======================================
                   FIREBASE LOGOUT
                ====================================== */

                await signOut(
                    auth
                );


                /* ======================================
                   CLEAR SESSION
                ====================================== */

                localStorage.removeItem(
                    "loggedInEmpCode"
                );


                localStorage.removeItem(
                    "userRole"
                );


                localStorage.removeItem(
                    "adminLoggedIn"
                );


                localStorage.removeItem(
                    "isAdmin"
                );


                localStorage.removeItem(
                    "regionUserId"
                );


                localStorage.removeItem(
                    "regionUserCode"
                );


                localStorage.removeItem(
                    "regionUserName"
                );


                localStorage.removeItem(
                    "savedRegionUserName"
                );


                localStorage.removeItem(
                    "userCode"
                );


                localStorage.removeItem(
                    "username"
                );


                localStorage.removeItem(
                    "userName"
                );


                localStorage.removeItem(
                    "employeeCode"
                );


                localStorage.removeItem(
                    "empCode"
                );


                /* ======================================
                   LOGIN PAGE
                ====================================== */

                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "Admin Logout Error:",
                    error
                );


                alert(
                    "Logout nahi ho saka. Please try again."
                );

            }

        }
    );

}



/* ======================================================
   LOAD ADMIN SIDEBAR
====================================================== */

async function loadAdminSidebar() {

    const container =
        document.getElementById(
            "adminSidebar"
        );


    if (!container) {

        console.warn(
            "Admin Sidebar container not found."
        );

        return;

    }


    try {


        /* ==============================================
           LOAD SIDEBAR
        ============================================== */

        const response =
            await fetch(
                SIDEBAR_FILE,
                {
                    cache: "no-cache"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Admin Sidebar not found: " +
                response.status
            );

        }


        const sidebarHTML =
            await response.text();


        /* ==============================================
           INSERT SIDEBAR
        ============================================== */

        container.innerHTML =
            sidebarHTML;


        /* ==============================================
           ACTIVE PAGE
        ============================================== */

        setActiveMenu();


        /* ==============================================
           LOGOUT
        ============================================== */

        setupLogout();


    }

    catch (error) {

        console.error(
            "Admin Sidebar Load Error:",
            error
        );


        container.innerHTML =

            `
            <div
                style="
                    padding:20px;
                    color:#b91c1c;
                    font-family:Arial,sans-serif;
                "
            >
                Admin Sidebar load nahi ho saki.
            </div>
            `;

    }

}



/* ======================================================
   START SIDEBAR
====================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        loadAdminSidebar
    );

}

else {

    loadAdminSidebar();

}
