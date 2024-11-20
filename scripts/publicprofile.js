console.log("profileDisplay.js loaded");
// TODO: Link to all "other" profiles
// Gets the userID from URL parameters
function getUserID() {
    const params = new URLSearchParams(window.location.search);
    const userID = params.get("userID");

    if (!userID) {
        alert("No userID found in the URL.");
        throw new Error("Missing userID in URL.");
    }

    console.log("Extracted userID:", userID);
    return userID;
}

// Loads and populates page with user profile data
function loadUserProfile(userID) {
    db.collection("users")
        .doc(userID)
        .collection("userProfile")
        .doc("profile")
        .get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                console.log("Fetched user profile data:", data);

                populateUserProfile(data);
            } else {
                console.error("No such user profile document found!");
            }
        })
        .catch((error) => {
            console.error("Error fetching user profile:", error);
        });
}

// Populate the page with user profile data
function populateUserProfile(data) {
    document.getElementById("profile-name").innerText = data.name || "No Name";
    document.getElementById("profile-age").innerText = data.age || "No Age";
    document.getElementById("profile-location").innerText = data.location || "No Location";
    document.getElementById("profile-interests").innerText = data.interests || "No Interests";
}

//Loads dog profile data and populates the page
function loadDogProfile(userID) {
    db.collection("users")
        .doc(userID)
        .collection("dogprofiles")
        .doc("dog")
        .get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                console.log("Fetched dog profile data:", data);

                populateDogProfile(data);
            } else {
                console.error("No such dog profile document found!");
            }
        })
        .catch((error) => {
            console.error("Error fetching dog profile:", error);
        });
}

// Populate the page from database
function populateDogProfile(data) {
    document.getElementById("dog-name").innerText = data.dogname || "No Dog Name";
    document.getElementById("dog-age").innerText = data.age || "No Age";
    document.getElementById("dog-breed").innerText = data.breed || "No Breed";
    document.getElementById("dog-size").innerText = data.size || "No Size";
    document.getElementById("dog-image").src = data.profilePicture || "placeholder.jpg";
}

// Does all the functions
function doAll() {
    try {
        const userID = getUserID(); 
        loadUserProfile(userID);       
        loadDogProfile(userID);       
    } catch (error) {
        console.error("Error initializing script:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    doAll();
});
