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

function savePlaydate() {
    let playdateTitle = document.querySelector('.form-control[placeholder="Playdate Title"]').value;
    const playdateDescription = document.querySelector('.form-control[aria-label="With textarea"]').value;
    const playdateAddress = document.querySelector('.form-control[aria-label="Park Address"]').value;
    const playdateDatetime = document.getElementById("playdate-datetime").value;

    if (userId) {
        if (playdateAddress.trim() !== "" && playdateDatetime.trim() !== "") {
            if(playdateTitle.trim() === "") {
                playdateTitle = userDisplayName + "'s Playdate"
            }
            db.collection("users").doc(userId).collection("playdates").add({
                title: playdateTitle,
                description: playdateDescription || "",
                address: playdateAddress,
                datetime: playdateDatetime,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("Playdate saved successfully!");
                alert("Playdate saved successfully!");
                document.querySelector('.form-control[placeholder="Playdate Title"]').value = "";
                document.querySelector('.form-control[aria-label="With textarea"]').value = "";
                document.querySelector('.form-control[aria-label="Park Address"]').value = "";
            })
            .catch(error => {
                console.error("Error saving playdate: ", error);
            });
        } else {
            console.error("Playdate address, and/or date and time cannot be empty.");
            if (playdateAddress.trim() === "" || playdateDatetime.trim() === "") {
                alert("Please enter an address, and/or date for the playdate.");
            }
        }
    } else {
        console.error("User ID is not defined. Please log in.");
    }
}

getNameFromAuth();
