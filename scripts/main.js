function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            userDisplayName = user.displayName;
            userId = user.uid;
            document.getElementById("name-goes-here").innerText = user.displayName;    
            document.getElementById("email-goes-here").innerText = user.email; 
        } else {
            console.log("No user is logged in");
            document.querySelector(".btn-secondary").disabled = true;
        }
    });
}

getNameFromAuth();
