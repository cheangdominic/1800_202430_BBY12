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
    const playdateAddress = document.querySelector('.form-control[aria-label="Park Address"]').value;

    if (userId) {
        if (playdateTitle.trim() !== "" && playdateAddress.trim() !== "") {
            db.collection("users").doc(userId).collection("playdates").add({
                title: playdateTitle,
                description: playdateDescription || "",
                address: playdateAddress,
                month: playdateMonth,
                day: playdateDay,
                hour: playdateHours,
                minute: playdateMinutes,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("Playdate saved successfully!");
                alert("Playdate saved successfully!");
                document.querySelector('.form-control[placeholder="Playdate Title"]').value = "";
                document.querySelector('.form-control[aria-label="With textarea"]').value = "";
                document.querySelector('.form-control[aria-label="Park Address"]').value = "";
                document.querySelector('.form-control[aria-label="Month"]').value = "";
                document.querySelector('.form-control[aria-label="Day"]').value = "";
                document.querySelector('.form-control[aria-label="Hours"]').value = "";
                document.querySelector('.form-control[aria-label="Minutes"]').value = "";
            })
            .catch(error => {
                console.error("Error saving playdate: ", error);
            });
        } else {
            console.error("Playdate title cannot be empty.");
            if (playdateTitle.trim() === "") {
                alert("Please enter a playdate title.");
            }
            if (playdateAddress.trim() === "") {
                alert("Please enter a park address.");
            }
        }
    } else {
        console.error("User ID is not defined. Please log in.");
    }
}

getNameFromAuth();
