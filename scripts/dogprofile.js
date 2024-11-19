console.log("dogProfile.js loaded");

// Load the dog's profile data from Firestore
function loadDogProfile(userId, dogID) {
    db.collection("users")
        .doc(userId)
        .collection("dogprofiles")
        .doc(dogID)
        .get()
        .then((doc) => {
            if (doc.exists) {
                populateDogProfile(doc.data(), dogID);
            } else {
                console.error("Dog profile not found.");
            }
        })
        .catch((error) => {
            console.error("Error loading dog profile:", error);
            alert("Failed to load dog profile.");
        });
}

// Populate the page with the dogprofile data from Firestore
function populateDogProfile(data, dogID) {
    document.getElementById("dog-name").textContent = data.dogname || "Unknown";
    document.getElementById("dog-picture").src = data.profilePicture || "./styles/images/defaultdog.jpg";
    document.getElementById("dog-age").textContent = data.age || "Unknown";
    document.getElementById("dog-breed").textContent = data.breed || "Unknown";
    document.getElementById("dog-size").textContent = data.size || "Unknown";

    // Dog profile picture styling
    const dogPicture = document.getElementById("dog-picture");
    dogPicture.style.maxWidth = "500px";
    dogPicture.style.height = "auto";
    dogPicture.style.margin = "0 auto";
    dogPicture.style.borderRadius = "10px";

    // Edit dog profile link
    document.getElementById("edit-dog-profile").href = `edit_dog_profile.html?dogID=${dogID}`;

    console.log("Dog profile loaded successfully:", data);
}

// Does all functions
function doAll(userId) {
    const params = new URLSearchParams(window.location.search);
    const dogID = params.get("dogID");

    if (!dogID) {
        alert("No dog ID provided in the URL.");
        return;
    }

    loadDogProfile(userId, dogID);
}

auth.onAuthStateChanged((user) => {
    if (user) {
        doAll(user.uid);
    } else {
        alert("Log in to view dog's profile.");
    }
});
