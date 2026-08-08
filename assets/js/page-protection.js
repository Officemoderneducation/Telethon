// ======================================
// Telethon - Page Protection
// ======================================

// Login information
const userRole =
    localStorage.getItem("userRole");

const loggedInEmpCode =
    localStorage.getItem("loggedInEmpCode");


// ======================================
// LOGIN CHECK
// ======================================

if (!loggedInEmpCode || !userRole) {

    window.location.href = "index.html";

}


// ======================================
// CURRENT PAGE
// ======================================

const currentPage =
    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();


// ======================================
// TEACHER PROTECTION
// ======================================

if (userRole === "teacher") {

    // Teacher ko sirf Daily Collection page
    // access karne ki permission hai.

    const allowedTeacherPage =
        "daily-entry.html";


    // Agar Teacher kisi bhi doosre page
    // ko open kare to Daily Collection par bhej do.

    if (
        currentPage !== allowedTeacherPage &&
        currentPage !== "index.html" &&
        currentPage !== ""
    ) {

        window.location.replace(
            "daily-entry.html"
        );

    }

}


// ======================================
// ADMIN PROTECTION
// ======================================

if (userRole === "admin") {

    // Admin ko Admin pages access karne ki permission hai.

}
