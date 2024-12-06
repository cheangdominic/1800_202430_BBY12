//---------------------------------
// Your own functions here
//---------------------------------


function sayHello() {
  //do something
}
//sayHello();    //invoke function

//------------------------------------------------
// Call this function when the "logout" button is clicked
//-------------------------------------------------
function logout() {
  firebase.auth().signOut().then(() => {
    // Sign-out successful.
    console.log("logging out user");
  }).catch((error) => {
    // An error happened.
  });
}

//Function to easily redirect to a page
function redirectToPage(page) {
  window.location.href = page;
}

function logoutRedirect() {
  firebase.auth().signOut().then(() => {
    // Sign-out successful.
    console.log("logging out user");
    redirectToPage('index.html');
  }).catch((error) => {
    // An error happened.
  });
}