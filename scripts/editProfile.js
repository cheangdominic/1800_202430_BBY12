console.log("editProfile.js loaded");


// Profile Editing //
const nameInput = document.getElementById('username');
const ageInput = document.getElementById('age');
const locationInput = document.getElementById('location');
const interestsInput = document.getElementById('interests');
const updateButton = document.getElementById('updateProfileBtn');

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User logged in:", user.uid);
        loadProfile(user.uid);
    } else {
        alert("Please log in to edit.");
    }
});

function loadProfile(userId) {
    db.collection('profiles').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();

                nameInput.value = data.name || '';
                ageInput.value = data.age || '';
                locationInput.value = data.location || '';
                interestsInput.value = data.interests || '';
                console.log("Profile data loaded:", data);
            } else {
                console.log("No profile data found for this user.");
            }
        })
        .catch((error) => {
            console.error("Error loading profile data:", error);
        });
}

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