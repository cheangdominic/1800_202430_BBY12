console.log("dogProfile.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;
            const params = new URLSearchParams(window.location.search);
            const dogID = params.get("dogID");

            if (!dogID) {
                alert("No dog ID provided in the URL.");
                return;
            }
            loadDogProfile(userId, dogID);
        } else {
            alert("Please log in to view your dog's profile.");
        }
    });
});

function loadDogProfile(userId, dogID) {
    db.collection("users")
        .doc(userId)
        .collection("dogprofiles")
        .doc(dogID)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();

                document.getElementById("dog-name").textContent = data.dogname || "Unknown";
                document.getElementById("dog-picture").src = data.profilePicture || "./styles/images/defaultdog.jpg";
                document.getElementById("dog-age").textContent = data.age || "Unknown";
                document.getElementById("dog-breed").textContent = data.breed || "Unknown";
                document.getElementById("dog-size").textContent = data.size || "Unknown";

                // Dog profile picture styling
                document.getElementById("dog-picture").style.maxWidth = "500px";
                document.getElementById("dog-picture").style.height = "auto";
                document.getElementById("dog-picture").style.margin = "0 auto";
                document.getElementById("dog-picture").style.borderRadius = "10px";

                document.getElementById("edit-dog-profile").href = `edit_dog_profile.html?dogID=${dogID}`;

                console.log("Dog profile loaded successfully:", data);
            } else {
                console.log("Dog profile not found. Please check the database.");
                alert("No dog profile found. Please check the database.");
            }
        });
}
