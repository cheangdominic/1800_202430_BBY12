console.log("dogProfile.js loaded"); // console log to ensure dog profile script is properly loaded

// Load the dog's profile data from Firestore
function loadDogProfile(userId, dogID) {
    db.collection("users") // references the collection and subcollections for the user's dog profile
        .doc(userId) 
        .collection("dogprofiles")
        .doc(dogID)
        .get()
        .then((doc) => {
            if (doc.exists) { // if a dog profile exists, populates the page
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

// Adds an event listener for the back button
document.querySelectorAll("#back-btn").forEach(button => {
    button.addEventListener("click", (event) => {
        redirectToPage("profile.html"); // redirects to user's page 
    });
});

// Populate the page with the dogprofile data from Firestore
function populateDogProfile(data, dogID) {
    const dogPicture = document.getElementById("dog-picture"); // Selects the element for the dog's profile picture
    const localStorageKey = `dogProfilePicture_${dogID}`; // Gives the picture a unique key to cache the picture
    let profilePicture = data.profilePicture || "./styles/images/defaultdog.jpg"; // users the dog's profile picture or uses the default image

    if (!data.profilePicture) {
        localStorage.removeItem(localStorageKey); // Removes local storage image if no profile exists
    } else if (localStorage.getItem(localStorageKey)) {
        profilePicture = localStorage.getItem(localStorageKey); // use the local storage image if exists
    }

    dogPicture.src = profilePicture; // sets the profile picture 

    // Populates the dog profile's details from the db or uses default values
    document.getElementById("dog-name").textContent = data.dogname || "Unknown";
    document.getElementById("dog-age").textContent = data.age || "Unknown";
    document.getElementById("dog-breed").textContent = data.breed || "Unknown";
    document.getElementById("dog-size").textContent = data.size || "Unknown";
    document.getElementById("edit-dog-profile").href = `edit_dog_profile.html?dogID=${dogID}`;
}

// Does all functions
function doAll(userId) {
    const params = new URLSearchParams(window.location.search); // queries the URL for the individual dog's profiles
    const dogID = params.get("dogID"); // Gets the dog ID from the query

    if (!dogID) { // Stops function if no dogID exists
        alert("No dog ID provided in the URL.");
        return;
    }

    loadDogProfile(userId, dogID); // loads the dog profile
}

// Authenticates the user
auth.onAuthStateChanged((user) => {
    if (user) { // checks to see if user is logged in
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
