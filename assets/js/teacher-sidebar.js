// ==========================================
// TELETHON - TEACHER SIDEBAR JS
// Reusable Teacher Sidebar
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadTeacherSidebar();
    }
);


// ==========================================
// LOAD TEACHER SIDEBAR
// ==========================================

async function loadTeacherSidebar() {

    try {

        const container =
            document.getElementById("teacherSidebar");

        if (!container) {

            console.warn(
                "Teacher sidebar container not found."
            );

            return;
        }


        // ==================================
        // LOAD SIDEBAR HTML
        // ==================================

        const response =
            await fetch(
                "components/teacher-sidebar.html"
            );

        if (!response.ok) {

            throw new Error(
                "teacher-sidebar.html load nahi hua."
            );

        }

        const sidebarHTML =
            await response.text();

        container.innerHTML =
            sidebarHTML;


        // ==================================
        // LOAD SIDEBAR CSS
        // ==================================

        loadTeacherSidebarCSS();


        // ==================================
        // ACTIVE PAGE
        // ==================================

        setTeacherActivePage();


        // ==================================
        // TEACHER NAME
        // ==================================

        setTeacherSidebarUserName();


        // ==================================
        // MOBILE MENU
        // ==================================

        setupTeacherMobileMenu();


        // ==================================
        // LOGOUT
        // ==================================

        setupTeacherLogout();


    } catch (error) {

        console.error(
            "Teacher Sidebar Error:",
            error
        );


        const container =
            document.getElementById(
                "teacherSidebar"
            );

        if (container) {

            container.innerHTML = `

                <div
                    style="
                        padding:20px;
                        color:#dc2626;
                        background:#fee2e2;
                        font-family:Arial,sans-serif;
                        font-size:13px;
                    "
                >

                    Teacher Sidebar load nahi hua.

                    <br><br>

                    ${error.message}

                </div>

            `;

        }

    }

}


// ==========================================
// LOAD SIDEBAR CSS
// ==========================================

function loadTeacherSidebarCSS() {

    const existingCSS =
        document.querySelector(
            'link[data-teacher-sidebar-css="true"]'
        );


    if (existingCSS) {

        return;

    }


    const cssLink =
        document.createElement("link");


    cssLink.rel =
        "stylesheet";


    cssLink.href =
        "components/teacher-sidebar.css";


    cssLink.setAttribute(
        "data-teacher-sidebar-css",
        "true"
    );


    document.head.appendChild(
        cssLink
    );

}


// ==========================================
// ACTIVE PAGE
// ==========================================

function setTeacherActivePage() {

    const container =
        document.getElementById(
            "teacherSidebar"
        );


    if (!container) {

        return;

    }


    let currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (!currentPage) {

        currentPage =
            "summary.html";

    }


    const menuLinks =
        container.querySelectorAll(
            ".teacher-menu-link[data-page]"
        );


    menuLinks.forEach(
        function (link) {

            const page =
                (
                    link.getAttribute(
                        "data-page"
                    ) || ""
                )
                .trim()
                .toLowerCase();


            if (
                page ===
                currentPage
            ) {

                link.classList.add(
                    "active"
                );

            } else {

                link.classList.remove(
                    "active"
                );

            }

        }
    );

}


// ==========================================
// TEACHER NAME
// ==========================================

function setTeacherSidebarUserName() {

    const container =
        document.getElementById(
            "teacherSidebar"
        );


    if (!container) {

        return;

    }


    const userNameElement =
        container.querySelector(
            "#teacherSidebarUserName"
        );


    if (!userNameElement) {

        return;

    }


    // ==================================
    // GET SAVED TEACHER NAME
    // ==================================

    const teacherName =
        localStorage.getItem(
            "teacherUserName"
        );


    const regionUserName =
        localStorage.getItem(
            "regionUserName"
        );


    const employeeCode =
        localStorage.getItem(
            "loggedInEmpCode"
        );


    // ==================================
    // DISPLAY NAME
    // ==================================

    if (teacherName) {

        userNameElement.textContent =
            teacherName;

        return;

    }


    if (regionUserName) {

        userNameElement.textContent =
            regionUserName;

        return;

    }


    if (employeeCode) {

        userNameElement.textContent =
            employeeCode;

        return;

    }


    userNameElement.textContent =
        "Teacher";

}


// ==========================================
// MOBILE MENU
// ==========================================

function setupTeacherMobileMenu() {

    const container =
        document.getElementById(
            "teacherSidebar"
        );


    if (!container) {

        return;

    }


    const sidebar =
        container.querySelector(
            ".teacher-sidebar"
        );


    if (!sidebar) {

        return;

    }


    // ==================================
    // MOBILE BUTTON
    // ==================================

    let mobileButton =
        document.getElementById(
            "teacherMobileMenuBtn"
        );


    if (!mobileButton) {

        mobileButton =
            document.createElement(
                "button"
            );


        mobileButton.type =
            "button";


        mobileButton.id =
            "teacherMobileMenuBtn";


        mobileButton.className =
            "teacher-mobile-menu-btn";


        mobileButton.setAttribute(
            "aria-label",
            "Open Teacher Menu"
        );


        mobileButton.innerHTML = `

            <i class="fa-solid fa-bars"></i>

        `;


        document.body.appendChild(
            mobileButton
        );

    }


    // ==================================
    // OVERLAY
    // ==================================

    let overlay =
        document.getElementById(
            "teacherSidebarOverlay"
        );


    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "teacherSidebarOverlay";


        overlay.className =
            "teacher-sidebar-overlay";


        document.body.appendChild(
            overlay
        );

    }


    // ==================================
    // OPEN SIDEBAR
    // ==================================

    mobileButton.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );

            overlay.classList.toggle(
                "show"
            );

        }
    );


    // ==================================
    // CLOSE SIDEBAR
    // ==================================

    overlay.addEventListener(
        "click",
        function () {

            sidebar.classList.remove(
                "open"
            );

            overlay.classList.remove(
                "show"
            );

        }
    );


    // ==================================
    // CLOSE AFTER MENU CLICK
    // ==================================

    const menuLinks =
        sidebar.querySelectorAll(
            ".teacher-menu-link"
        );


    menuLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    if (
                        window.innerWidth <=
                        800
                    ) {

                        sidebar.classList.remove(
                            "open"
                        );

                        overlay.classList.remove(
                            "show"
                        );

                    }

                }
            );

        }
    );

}


// ==========================================
// LOGOUT
// ==========================================

function setupTeacherLogout() {

    const container =
        document.getElementById(
            "teacherSidebar"
        );


    if (!container) {

        return;

    }


    const logoutButton =
        container.querySelector(
            "#teacherSidebarLogout"
        );


    if (!logoutButton) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            logoutTeacher();

        }
    );

}


// ==========================================
// LOGOUT FUNCTION
// ==========================================

function logoutTeacher() {

    // ==================================
    // REMOVE TEACHER LOGIN DATA
    // ==================================

    localStorage.removeItem(
        "loggedInEmpCode"
    );


    localStorage.removeItem(
        "userRole"
    );


    localStorage.removeItem(
        "teacherUserName"
    );


    localStorage.removeItem(
        "regionUserName"
    );


    localStorage.removeItem(
        "regionUserAccess"
    );


    // ==================================
    // GO TO HOME / LOGIN
    // ==================================

    window.location.href =
        "index.html";

}
