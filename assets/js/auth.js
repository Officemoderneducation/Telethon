import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// Login Function

const loginBtn = document.getElementById("loginBtn");


if(loginBtn){

loginBtn.addEventListener("click",()=>{


let email = document.getElementById("email").value;

let password = document.getElementById("password").value;



signInWithEmailAndPassword(
    auth,
    email,
    password
)

.then((userCredential)=>{


alert("Login Successful");


window.location.href="dashboard.html";


})


.catch((error)=>{


alert(error.message);


});


});

}



// Logout Function

const logoutBtn = document.getElementById("logoutBtn");


if(logoutBtn){

logoutBtn.addEventListener("click",()=>{


signOut(auth)

.then(()=>{

window.location.href="index.html";

});


});

}




// Check Login Status

onAuthStateChanged(auth,(user)=>{


if(user){

console.log("User Login:", user.email);


}else{

console.log("No User Login");

}


});
