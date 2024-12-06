console.log("editprofile.js loaded");

// Convert image to Base64
function convertImageToBase64(imageFile, callback) { // https://onlinewebtutorblog.com/convert-image-to-the-base64-string-using-javascript/
    const FR = new FileReader(); // Creates a FileReader instance to read files
    FR.onload = (event) => { // if the file is read
        callback(event.target.result); // callback function passed as an argument that will be called when the image is converted
    };
    FR.readAsDataURL(imageFile); // reads the image as a URL
}

// Set default profile picture
function setDefaultProfilePicture() {
    document.getElementById("userProfilePicturePreview").src = "./styles/images/defaultprofile.png"; // sets the user profile picture to a default image
}

// Load profile data from Firestore
function loadProfile(userId) {
    const userRef = db.collection("users").doc(userId); // Reference to the user's document
    userRef.get()
        .then((userDoc) => {
            if (userDoc.exists) { // Check if the user's document exists
                const name = userDoc.data().name; // Get the user's name
                const profileRef = userRef.collection("userProfile").doc("profile"); // References the user's profile subdocument
                profileRef.get()
                    .then((profileDoc) => {
                        const profileData = profileDoc.exists ? profileDoc.data() : {}; // Gets profile data if it exists
                        populateProfile({ ...profileData, name }); // Populates the profile page with the profile data
                    });
            } else {
                console.log("No user data found."); 
                setDefaultProfilePicture(); // Calls function to set the default profile picture
            }
        })
        .catch((error) => console.error("Error loading profile:", error)); // Log any errors encountered
}

// Populate profile fields. Handles cases where local storage photos exists and are removed.
function populateProfile(data) {
    const profilePicturePreview = document.getElementById("userProfilePicturePreview"); // Selects the profile picture preview element
    let profilePicture = data.profilePicture || "./styles/images/defaultprofile.png"; // Uses the user uploaded image or uses the default image

    // Manage localStorage for the profile picture
    if (!data.profilePicture) {
        localStorage.removeItem("userProfilePicture"); // Remove cached picture if exists
    } else if (localStorage.getItem("userProfilePicture")) {
        profilePicture = localStorage.getItem("userProfilePicture"); // Use the cached picture if exists
    }

    profilePicturePreview.src = profilePicture; // updates the preview image in the UI

    // Populates the user's information from the db or uses the default
    document.getElementById("username").value = data.name || "Test User";
    document.getElementById("age").value = data.age || "";
    document.getElementById("location").value = data.location || "";
    document.getElementById("interests").value = data.interests || "";
}

// Upload photo and preview
function uploadProfilePicture() {
    const fileInput = document.getElementById("userProfilePictureInput");
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Image = e.target.result;
                document.getElementById("userProfilePicturePreview").src = base64Image;
                localStorage.setItem("userProfilePicture", base64Image);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Update profile data in Firestore
function updateProfile(userId) {
    const userRef = db.collection("users").doc(userId); // References the user document
    const profileRef = userRef.collection("userProfile").doc("profile"); // References the user's subdocument for profiles

    const name = document.getElementById("username").value; // Gets the updated name
    const profileData = {
        age: document.getElementById("age").value, // Gets the updated age
        location: document.getElementById("location").value, // Gets the updated location
        interests: document.getElementById("interests").value, // Gets the updated interests
        profilePicture: localStorage.getItem("userProfilePicture") || "./styles/images/defaultprofile.png", // Use the local storage imagee or the default image
    };

    userRef.set({ name }, { merge: true }) // Updates the user's document with the new name
        .then(() => profileRef.set(profileData, { merge: true })) // Updates the profile subdocument 
        .then(() => {
            alert("Profile updated successfully!"); 
            redirectToPage("profile.html"); // Redirects to the main profile page
        })
        .catch((error) => console.error("Error updating profile:", error)); 
}

// Event listener for the update button
function updateButton(userId) {
    document.getElementById("updateProfileBtn").addEventListener("click", (e) => {
        e.preventDefault();
        updateProfile(userId);
    });
}

// Event listener for the back button
document.querySelectorAll("#back-btn").forEach(button => {
    button.addEventListener("click", () => {
        redirectToPage("profile.html");
    });
});

// Does all functions
function doAll(userId) {
    loadProfile(userId);
    uploadProfilePicture();
    updateButton(userId);
}

// Authenticates the user before performing all functions
auth.onAuthStateChanged((user) => {
    if (user) {
        doAll(user.uid);
    } else {
        alert("Please log in to edit your profile.");
        window.location.href = "login.html";
    }
});