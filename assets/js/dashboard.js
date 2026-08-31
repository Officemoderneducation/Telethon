// ======================================================
// DOWNLOAD DASHBOARD IMAGE
// MOBILE FULL WIDTH FIX
// ======================================================

if (
downloadDashboardImageBtn
) {

downloadDashboardImageBtn.addEventListener(
"click",
async function () {

const dashboard =
document.getElementById(
"dashboardCaptureArea"
);

if (!dashboard) {

alert(
"Dashboard data area nahi mila."
);

return;

}

if (
typeof html2canvas ===
"undefined"
) {

alert(
"Image download library load nahi hui. Page refresh karke dobara try karein."
);

return;

}

const oldHTML =
this.innerHTML;

this.disabled =
true;

this.innerHTML = `

<i
class="
fa-solid
fa-spinner
fa-spin
"
></i>

Preparing Image...

`;

let originalBodyOverflow = "";
let originalHtmlOverflow = "";

try {

await new Promise(
function (resolve) {

requestAnimationFrame(
function () {

requestAnimationFrame(
resolve
);

}
);

}
);

originalBodyOverflow =
document.body.style.overflow;

originalHtmlOverflow =
document.documentElement.style.overflow;


// ==================================================
// CURRENT PAGE SCROLL
// ==================================================

const currentScrollX =
window.scrollX;

const currentScrollY =
window.scrollY;


// ==================================================
// FULL DASHBOARD WIDTH
// ==================================================

const captureWidth =
Math.max(
dashboard.scrollWidth,
dashboard.offsetWidth,
dashboard.getBoundingClientRect().width
);

const captureHeight =
Math.max(
dashboard.scrollHeight,
dashboard.offsetHeight
);


// ==================================================
// TEMPORARY PAGE WIDTH FIX
// ==================================================

document.body.style.overflow =
"visible";

document.documentElement.style.overflow =
"visible";


// ==================================================
// CAPTURE
// ==================================================

const canvas =
await html2canvas(
dashboard,
{

scale: 2,

useCORS: true,

allowTaint: false,

backgroundColor:
"#f4f7fb",

logging: false,

imageTimeout:
15000,

scrollX: 0,

scrollY: 0,

width:
captureWidth,

height:
captureHeight,

windowWidth:
captureWidth,

windowHeight:
Math.max(
captureHeight,
window.innerHeight
),

onclone:
function (
clonedDocument
) {

// ==============================================
// CLONED BODY
// ==============================================

const clonedBody =
clonedDocument.body;

if (
clonedBody
) {

clonedBody.style.margin =
"0";

clonedBody.style.padding =
"0";

clonedBody.style.overflow =
"visible";

}


// ==============================================
// CLONED HTML
// ==============================================

const clonedHtml =
clonedDocument.documentElement;

if (
clonedHtml
) {

clonedHtml.style.margin =
"0";

clonedHtml.style.padding =
"0";

clonedHtml.style.overflow =
"visible";

}


// ==============================================
// HIDE DOWNLOAD BUTTON
// ==============================================

const clonedButton =
clonedDocument
.getElementById(
"downloadDashboardImageBtn"
);

if (
clonedButton
) {

clonedButton.style.display =
"none";

}


// ==============================================
// DASHBOARD CAPTURE AREA
// ==============================================

const clonedDashboard =
clonedDocument
.getElementById(
"dashboardCaptureArea"
);

if (
clonedDashboard
) {

clonedDashboard.style.width =
captureWidth + "px";

clonedDashboard.style.minWidth =
captureWidth + "px";

clonedDashboard.style.maxWidth =
"none";

clonedDashboard.style.margin =
"0";

clonedDashboard.style.padding =
"0";

clonedDashboard.style.overflow =
"visible";

}


// ==============================================
// SUMMARY CARDS
// ==============================================

const summaryCards =
clonedDocument
.querySelector(
".user-summary-cards"
);

if (
summaryCards
) {

summaryCards.style.width =
"100%";

summaryCards.style.minWidth =
"0";

}


// ==============================================
// ACADEMIC DEPARTMENT BOX
// ==============================================

const summaryContainer =
clonedDocument
.querySelector(
".user-summary-container"
);

if (
summaryContainer
) {

summaryContainer.style.width =
"100%";

summaryContainer.style.maxWidth =
"none";

summaryContainer.style.overflow =
"visible";

}


// ==============================================
// SECTION HEADER
// ==============================================

const sectionHeader =
clonedDocument
.querySelector(
".section-header"
);

if (
sectionHeader
) {

sectionHeader.style.width =
"100%";

sectionHeader.style.maxWidth =
"none";

}


// ==============================================
// TABLE WRAPPER
// ==============================================

const wrappers =
clonedDocument
.querySelectorAll(
".user-summary-table-wrapper"
);

wrappers.forEach(
function (
wrapper
) {

wrapper.style.width =
"100%";

wrapper.style.minWidth =
"0";

wrapper.style.maxWidth =
"none";

wrapper.style.overflow =
"visible";

wrapper.style.paddingLeft =
"18px";

wrapper.style.paddingRight =
"18px";

}
);


// ==============================================
// TABLE
// ==============================================

const tables =
clonedDocument
.querySelectorAll(
".user-summary-table"
);

tables.forEach(
function (
table
) {

// IMPORTANT:
// Original table ki minimum width
// mobile par bhi preserve rahegi.

table.style.width =
"100%";

table.style.minWidth =
"800px";

table.style.maxWidth =
"none";

table.style.tableLayout =
"auto";

}
);


// ==============================================
// PREVENT CELL TEXT CUT
// ==============================================

const cells =
clonedDocument.querySelectorAll(
".user-summary-table th, .user-summary-table td"
);

cells.forEach(
function (
cell
) {

cell.style.whiteSpace =
"nowrap";

}
);

}

}
);


// ==================================================
// RESTORE PAGE
// ==================================================

document.body.style.overflow =
originalBodyOverflow;

document.documentElement.style.overflow =
originalHtmlOverflow;


// ==================================================
// RESTORE SCROLL POSITION
// ==================================================

window.scrollTo(
currentScrollX,
currentScrollY
);


// ==================================================
// CREATE IMAGE
// ==================================================

const image =
canvas.toDataURL(
"image/png",
1.0
);


// ==================================================
// DATE
// ==================================================

const today =
new Date();

const year =
today.getFullYear();

const month =
String(
today.getMonth() + 1
).padStart(
2,
"0"
);

const day =
String(
today.getDate()
).padStart(
2,
"0"
);


// ==================================================
// DOWNLOAD
// ==================================================

const link =
document.createElement(
"a"
);

link.download =
`Telethon-Dashboard-${year}-${month}-${day}.png`;

link.href =
image;

document.body.appendChild(
link
);

link.click();

document.body.removeChild(
link
);

}

catch (error) {

console.error(
"Dashboard Image Download Error:",
error
);

document.body.style.overflow =
originalBodyOverflow;

document.documentElement.style.overflow =
originalHtmlOverflow;

alert(
"Dashboard image download nahi hui.\n\n" +
error.message
);

}

finally {

this.disabled =
false;

this.innerHTML =
oldHTML;

}

}
);

}
