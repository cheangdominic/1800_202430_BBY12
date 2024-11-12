console.log("dogProfile.js loaded");

auth.onAuthStateChanged((user) => {
    if (user) {
        loadDogProfile(user.uid); 
    } else {
        alert("Please log in to view your dog's profile.");
    }
});

window.onload = function () {
    const savedPicture = localStorage.getItem("dogProfilePicture");

    console.log("Saved Picture in LocalStorage:", savedPicture);
    if (savedPicture) {
        document.getElementById("dog-profile-picture").src = savedPicture;
    } else {
        document.getElementById("dog-profile-picture").src = "./styles/images/defaultdog.jpg";
        console.log("No saved profile picture found. Using default image.");
    }
};

function loadDogProfile(userId) {
    db.collection('users')
        .doc(userId)
        .collection('dogprofiles')
        .doc('dog') 
        .get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();

                // Determine which picture to use
                const savedPicture = localStorage.getItem("dogProfilePicture");
                const profilePicture = savedPicture || data.profilePicture || "./styles/images/defaultdog.jpg";

                // Assign the determined picture
                document.getElementById("dog-profile-picture").src = profilePicture;

                // Populate text fields
                document.getElementById("dog-name").textContent = data.dogname || "Unknown";
                document.getElementById("dog-age").textContent = data.age || "Unknown";
                document.getElementById("dog-size").textContent = data.size || "Unknown";
                document.getElementById("dog-breed").textContent = data.breed || "Unknown";

                console.log("Dog profile loaded:", data);
            } else {
                console.log("No dog profile found in Firestore. Using defaults.");
                document.getElementById("dog-profile-picture").src = "./styles/images/defaultdog.jpg";
            }
        })
}
