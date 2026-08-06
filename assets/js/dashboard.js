// ======================================
// Dashboard JS - Firebase Firestore
// ======================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// Check Login
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    loadDashboard();

});



// ======================================
// Load Dashboard Data
// ======================================

async function loadDashboard() {

    try {


        // =================================
        // Employees Data
        // =================================

        const employeeSnapshot = await getDocs(
            collection(db, "employees")
        );


        let totalTarget = 0;


        employeeSnapshot.forEach((doc)=>{


            const data = doc.data();


            // Total Target Calculation

            totalTarget += Number(data.target || 0);


        });



        // Total Users

        document.getElementById("totalUsers").textContent =
            employeeSnapshot.size;



        // Total Target Amount

        document.getElementById("totalTarget").textContent =
            "₹ " + totalTarget.toLocaleString("en-IN");





        // =================================
        // Daily Collection Data
        // =================================


        const entrySnapshot = await getDocs(
            collection(db,"daily_entry")
        );


        let totalCollection = 0;


        const recentTable =
            document.getElementById("recentTable");


        if(recentTable){

            recentTable.innerHTML = "";

        }



        let hasData = false;



        entrySnapshot.forEach((doc)=>{


            const data = doc.data();



            // Total Collection

            totalCollection += Number(data.amount || 0);



            // Recent Table

            if(recentTable){


                recentTable.innerHTML += `

                <tr>

                    <td>${data.date || "-"}</td>

                    <td>${data.teacherName || "-"}</td>

                    <td>${data.region || "-"}</td>

                    <td>
                    ₹ ${Number(data.amount || 0)
                    .toLocaleString("en-IN")}
                    </td>


                    <td>
                    ${data.status || "Success"}
                    </td>


                </tr>

                `;


                hasData = true;


            }


        });





        // Total Collection Amount

        document.getElementById("totalCollection").textContent =
            "₹ " + totalCollection.toLocaleString("en-IN");





        // No Data Message

        if(recentTable && !hasData){


            recentTable.innerHTML = `

            <tr>

            <td colspan="5" style="text-align:center;">
            No Records Found
            </td>

            </tr>

            `;


        }





        // =================================
        // Console Check
        // =================================


        console.log("Total Users:", employeeSnapshot.size);

        console.log("Total Target:", totalTarget);

        console.log("Total Collection:", totalCollection);



    }

    catch(error){


        console.error(
            "Dashboard Error:",
            error
        );


    }


}





// ======================================
// Logout
// ======================================


const logoutBtn =
document.getElementById("logoutBtn");


if(logoutBtn){


logoutBtn.addEventListener(
"click",
async()=>{


    try{


        await signOut(auth);


        window.location.href =
        "index.html";


    }

    catch(error){


        console.error(
            "Logout Error:",
            error
        );


    }


});


}




console.log(
"Dashboard Loaded Successfully"
);
