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

document.querySelectorAll("#back-btn").forEach(button => {
    button.addEventListener("click", (event) => {
        redirectToPage("profile.html");
    });
});

// Populate the page with the dogprofile data from Firestore
function populateDogProfile(data, dogID) {
    const dogPicture = document.getElementById("dog-picture");
    const localStorageKey = `dogProfilePicture_${dogID}`;
    let profilePicture = data.profilePicture || "./styles/images/defaultdog.jpg";

    if (!data.profilePicture) {
        localStorage.removeItem(localStorageKey);
    } else if (localStorage.getItem(localStorageKey)) {
        profilePicture = localStorage.getItem(localStorageKey);
    }

    dogPicture.src = profilePicture;

    document.getElementById("dog-name").textContent = data.dogname || "Unknown";
    document.getElementById("dog-age").textContent = data.age || "Unknown";
    document.getElementById("dog-breed").textContent = data.breed || "Unknown";
    document.getElementById("dog-size").textContent = data.size || "Unknown";
    document.getElementById("edit-dog-profile").href = `edit_dog_profile.html?dogID=${dogID}`;
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
        const urlParams = new URLSearchParams(window.location.search);
        const dogID = urlParams.get("dogID");

        db.collection("users").doc(user.uid).collection("dogprofiles").doc(dogID).get()
            .then((doc) => {
                if (doc.exists) {
                    populateDogProfile(doc.data(), dogID);
                } else {
                    console.error("Dog profile not found.");
                }
            })
            .catch((error) => console.error("Error loading dog profile:", error));
    } else {
        alert("Please log in to view your dog profile.");
        window.location.href = "login.html";
    }
});
