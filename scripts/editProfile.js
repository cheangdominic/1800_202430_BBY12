console.log("editprofile.js loaded");

// Convert image to Base64
function convertImageToBase64(imageFile, callback) {
    const FR = new FileReader(); // https://onlinewebtutorblog.com/convert-image-to-the-base64-string-using-javascript/
    FR.onload = (event) => {
        callback(event.target.result);
    };
    FR.readAsDataURL(imageFile);
}

// Set default profile picture
function setDefaultProfilePicture() {
    document.getElementById("userProfilePicturePreview").src = "./styles/images/defaultprofile.png";
}

// Load profile data from Firestore
function loadProfile(userId) {
    const userRef = db.collection("users").doc(userId);
    userRef.get().then((userDoc) => {
        if (userDoc.exists) {
            const name = userDoc.data().name;
            const profileRef = userRef.collection("userProfile").doc("profile");
            profileRef.get().then((profileDoc) => {
                const profileData = profileDoc.exists ? profileDoc.data() : {};
                populateProfile({ ...profileData, name });
            });
        } else {
            console.log("No user data found.");
            setDefaultProfilePicture();
        }
    }).catch((error) => console.error("Error loading profile:", error));
}

// Populate profile fields. Handles cases where local storage photos exists and are removed.
function populateProfile(data) {
    const profilePicturePreview = document.getElementById("userProfilePicturePreview");
    let profilePicture = data.profilePicture || "./styles/images/defaultprofile.png"; 

    if (!data.profilePicture) {
        localStorage.removeItem("userProfilePicture");
    } else if (localStorage.getItem("userProfilePicture")) {
        profilePicture = localStorage.getItem("userProfilePicture");
    }

    profilePicturePreview.src = profilePicture;

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
    const userRef = db.collection("users").doc(userId);
    const profileRef = userRef.collection("userProfile").doc("profile");

    const name = document.getElementById("username").value;
    const profileData = {
        age: document.getElementById("age").value,
        location: document.getElementById("location").value,
        interests: document.getElementById("interests").value,
        profilePicture: localStorage.getItem("userProfilePicture") || "./styles/images/defaultprofile.png",
    };

    userRef.set({ name }, { merge: true })
        .then(() => profileRef.set(profileData, { merge: true }))
        .then(() => {
            alert("Profile updated successfully!");
            redirectToPage("profile.html");
        })
        .catch((error) => console.error("Error updating profile:", error));
}

function updateButton(userId) {
    document.getElementById("updateProfileBtn").addEventListener("click", (e) => {
        e.preventDefault();
        updateProfile(userId);
    });
}

// Redirect option
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

auth.onAuthStateChanged((user) => {
    if (user) {
        doAll(user.uid);
    } else {
        alert("Please log in to edit your profile.");
        window.location.href = "login.html";
    }
});