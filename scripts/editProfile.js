console.log("editProfile.js loaded");


// DOM Elements for User Details, Update Details, Profile Picture(s)
const nameInput = document.getElementById('username');
const ageInput = document.getElementById('age');
const locationInput = document.getElementById('location');
const interestsInput = document.getElementById('interests');
const updateButton = document.getElementById('updateProfileBtn');
const profilePictureInput = document.getElementById('userProfilePictureInput');
const profilePicturePreview = document.getElementById('userProfilePicturePreview');

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User logged in:", user.uid);
        loadProfile(user.uid);
    } else {
        alert("Please log in to edit.");
    }
});

// Load profile details from Firestore and local storage (for images)
function loadProfile(userId) {
    db.collection('profiles').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                // Populates data from firebase
                nameInput.value = data.name || '';
                ageInput.value = data.age || '';
                locationInput.value = data.location || '';
                interestsInput.value = data.interests || '';
                // Loads picture from local storage or defaults
                const savedPicture = localStorage.getItem("userProfilePicture");
                profilePicturePreview.src = savedPicture || data.profilePicture || "./styles/images/defaultprofile.png";


                console.log("Profile data loaded:", data);
            } else {
                console.log("No profile data found for this user.");
            }
        })
}

// Event listener for file input from user
profilePictureInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        // Reader object created to parse the image as base64 string
        const reader = new FileReader();
        reader.onload = function (e) {
            profilePicturePreview.src = e.target.result;
            localStorage.setItem("userProfilePicture", e.target.result);
            console.log("Profile picture saved to localStorage.");
        };
        reader.readAsDataURL(file);
    }
});

// Function to update user information to firestore
async function updateProfile() {
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    if (!userId) {
        console.error("User not authenticated.");
        return;
    }

    const updatedData = {
        name: nameInput.value,
        age: ageInput.value,
        location: locationInput.value,
        interests: interestsInput.value
    };

    console.log("Data to be updated:", updatedData);

    try {

        await db.collection('profiles').doc(userId).set(updatedData, { merge: true });
        console.log("Profile updated!");
        alert("Profile updated!");
    } catch (error) {
        console.error("Error updating profile:", error);
    }
}

updateButton.addEventListener('click', (e) => {
    e.preventDefault();
    console.log("Update button clicked");
    if (auth.currentUser) {
        updateProfile();
    } else {
        alert("You must be logged in.");
    }
});