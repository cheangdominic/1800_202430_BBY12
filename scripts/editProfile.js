console.log("editprofile.js loaded");

// Convert image to Base64
function convertImageToBase64(imageFile, callback) {
    const FR = new FileReader(); // https://onlinewebtutorblog.com/convert-image-to-the-base64-string-using-javascript/
    FR.onload = (event) => {
        callback(event.target.result);
    };
    FR.readAsDataURL(imageFile);
}


document.querySelectorAll("#back-btn").forEach(button => {
    button.addEventListener("click", (event) => {
        redirectToPage("profile.html");
    });
});

// Set default profile picture
function setDefaultProfilePicture() {
    document.getElementById("userProfilePicturePreview").src = "./styles/images/defaultprofile.png";
}

// Load profile data from Firestore
function loadProfile(userId) {
    db.collection("users")
        .doc(userId)
        .collection("userProfile")
        .doc("profile")
        .get()
        .then((doc) => {
            if (doc.exists) {
                populateProfile(doc.data());
            } else {
                console.log("No profile data found. Loading defaults.");
                setDefaultProfilePicture();
            }
        })
        .catch((error) => console.error("Error loading profile:", error));
}

// Populates profile fields and gives profile picture preview
function populateProfile(data) {
    document.getElementById("username").value = data.name || "";
    document.getElementById("age").value = data.age || "";
    document.getElementById("location").value = data.location || "";
    document.getElementById("interests").value = data.interests || "";

    const savedPicture = localStorage.getItem("userProfilePicture");
    const profilePicture = savedPicture || data.profilePicture || "./styles/images/defaultprofile.png";
    document.getElementById("userProfilePicturePreview").src = profilePicture;
}

// Uploads photo and gives preview
function uploadProfilePicture() {
    const fileInput = document.getElementById("userProfilePictureInput");
    const preview = document.getElementById("userProfilePicturePreview");

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            convertImageToBase64(file, (base64Image) => {
                preview.src = base64Image;
                localStorage.setItem("userProfilePicture", base64Image);
                console.log("New profile picture saved to localStorage.");
            });
        } else {
            alert("No file selected.");
        }
    });
}

// Save updated profile to Firestore
function updateProfile(userId) {
    const updatedData = {
        age: document.getElementById("age").value,
        location: document.getElementById("location").value,
        interests: document.getElementById("interests").value,
        profilePicture: localStorage.getItem("userProfilePicture") || "./styles/images/defaultprofile.png",
    };

    db.collection("users")
        .doc(userId)
        .collection("userProfile")
        .doc("profile")
        .set(updatedData, { merge: true })
        .then(() => {
            alert("Profile updated successfully!");
            console.log("Profile updated.");
        })
        .catch((error) => {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        });
}

function updateButton(userId) {
    document.getElementById("updateProfileBtn").addEventListener("click", (e) => {
        e.preventDefault();
        updateProfile(userId);
        redirectToPage('profile.html');
    });
}

function doAll(userId) {
    loadProfile(userId);
    uploadProfilePicture();
    updateButton(userId);
}

auth.onAuthStateChanged((user) => {
    if (user) {
        doAll(user.uid);
    } else {
        alert("Please log in to edit profile.");
        window.location.href = "login.html";
    }
});
