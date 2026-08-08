// ======================================
// Telethon - Page Protection
// ======================================

const userRole =
    localStorage.getItem("userRole");

const loggedInEmpCode =
    localStorage.getItem("loggedInEmpCode");


// ======================================
// Login Check
// ======================================

if (!loggedInEmpCode || !userRole) {

    window.location.href = "index.html";

}


// ======================================
// Teacher Protection
// ======================================

if (userRole === "teacher") {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    // Teacher ko sirf Daily Collection page
    // access karne ki permission hai

    const allowedTeacherPage =
        "daily-entry.html";


    if (
        currentPage !== allowedTeacherPage &&
        currentPage !== "index.html" &&
        currentPage !== ""
    ) {

        window.location.href =
            "daily-entry.html";

    }

}


// ======================================
// Admin Protection
// ======================================

if (userRole === "admin") {

    // Admin ko pages access karne ki permission hai.

    // Koi extra restriction nahi.
}
