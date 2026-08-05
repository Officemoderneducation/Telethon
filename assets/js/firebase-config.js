<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCj3BBjywNWl4ScDJUyrmslg4bHrlMiu_Q",
    authDomain: "telethoon.firebaseapp.com",
    projectId: "telethoon",
    storageBucket: "telethoon.firebasestorage.app",
    messagingSenderId: "853450341855",
    appId: "1:853450341855:web:356f9ec0e9a6f88c75d86a",
    measurementId: "G-EWP905EGQ1"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
