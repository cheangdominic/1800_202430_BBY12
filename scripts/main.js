let userId;

function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            userId = user.uid;
            document.getElementById("name-goes-here").innerText = user.displayName;    
            document.getElementById("email-goes-here").innerText = user.email; 

            document.querySelector(".btn-secondary").onclick = () => savePlaydate(userId);
        } else {
            console.log("No user is logged in");
            document.querySelector(".btn-secondary").disabled = true;
        }
    });
}

function savePlaydate() {
    const playdateTitle = document.querySelector('.form-control[placeholder="Playdate Title"]').value;
    const playdateDescription = document.querySelector('.form-control[aria-label="With textarea"]').value;

    if (userId) {
        if (playdateTitle.trim() !== "") {
            db.collection("users").doc(userId).collection("playdates").add({
                title: playdateTitle,
                description: playdateDescription || "",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("Playdate saved successfully!");
                document.querySelector('.form-control[placeholder="Playdate Title"]').value = "";
                document.querySelector('.form-control[aria-label="With textarea"]').value = "";
            })
            .catch(error => {
                console.error("Error saving playdate: ", error);
            });
        } else {
            console.error("Playdate title cannot be empty.");
        }
    } else {
        console.error("User ID is not defined. Please log in.");
    }
}

getNameFromAuth();
