//----------------------------------------
//  Your web app's Firebase configuration
//----------------------------------------
var firebaseConfig = {
    apiKey: "AIzaSyCesnliQh3zmwEc782jk71-bCdPWVS8h2s",
    authDomain: "updog-d7aa0.firebaseapp.com",
    projectId: "updog-d7aa0",
    storageBucket: "updog-d7aa0.appspot.com",
    messagingSenderId: "509822779265",
    appId: "1:509822779265:web:171948f292612764ad3280"
};

//--------------------------------------------
// initialize the Firebase app
// initialize Firestore database if using it
//--------------------------------------------
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
