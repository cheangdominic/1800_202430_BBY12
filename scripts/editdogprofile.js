console.log("editDogProfile.js loaded");

// Convert image to Base64
function convertImageToBase64(imageFile, callback) {
    const FR = new FileReader(); // https://onlinewebtutorblog.com/convert-image-to-the-base64-string-using-javascript/
    FR.onload = (event) => {
        callback(event.target.result);
    };
    FR.readAsDataURL(imageFile);
}

// Redirect if dogID is not found
function validateDogID(dogID) {
    if (!dogID) {
        alert("No dog ID provided in the URL.");
        window.location.href = "profile.html";
    }
}

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
                console.error("No dog profile found in Firestore.");
                alert("Dog profile not found.");
            }
        })
        .catch((error) => {
            console.error("Error loading dog profile:", error);
            alert("Failed to load dog profile.");
        });
}

document.querySelectorAll("#back-btn").forEach(button => {
    button.addEventListener("click", (event) => {
        redirectToPage("dog_profile.html");
    });
});

// Populate the UI with dog profile data
function populateDogProfile(data, dogID) {
    document.getElementById("dogNameInput").value = data.dogname || "";
    document.getElementById("dogAgeInput").value = data.age || "";
    document.getElementById("dogSizeInput").value = data.size || "";
    document.getElementById("dogBreedInput").value = data.breed || "";

    const savedPicture = localStorage.getItem("dogProfilePicture");
    const profilePicture = savedPicture || data.profilePicture || "./styles/images/defaultdog.jpg";
    document.getElementById("dogProfilePicturePreview").src = profilePicture;

    document.getElementById("returnDogProfileBtn").href = `dog_profile.html?dogID=${dogID}`;

    console.log("Dog profile data loaded:", data);
}

// Upload profile picture and previews
function uploadProfilePicture() {
    const fileInput = document.getElementById("dogProfilePictureInput");
    const preview = document.getElementById("dogProfilePicturePreview");

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            convertImageToBase64(file, (base64Image) => {
                preview.src = base64Image;
                localStorage.setItem("dogProfilePicture", base64Image);
                console.log("New profile picture saved to localStorage.");
            });
        } else {
            alert("No file selected.");
        }
    });
}

// Save updated dog profile to Firestore
function updateDogProfile(userId, dogID) {
    const updatedData = {
        dogname: document.getElementById("dogNameInput").value,
        age: document.getElementById("dogAgeInput").value,
        size: document.getElementById("dogSizeInput").value,
        breed: document.getElementById("dogBreedInput").value,
        profilePicture: localStorage.getItem("dogProfilePicture") || "./styles/images/defaultdog.jpg",
    };

    db.collection("users")
        .doc(userId)
        .collection("dogprofiles")
        .doc(dogID)
        .set(updatedData, { merge: true })
        .then(() => {
            alert("Dog profile updated successfully!");
            console.log("Dog profile updated.");
            window.location.href = `dog_profile.html?dogID=${dogID}`;
        })
        .catch((error) => {
            console.error("Error updating dog profile:", error);
            alert("Failed to update dog profile.");
        });
}

// Set up a click update button event listener
function updateButton(userId, dogID) {
    document.getElementById("updateDogProfileBtn").addEventListener("click", (e) => {
        e.preventDefault();
        updateDogProfile(userId, dogID);
    });
}

// Does all functions
function doAll(userId, dogID) {
    validateDogID(dogID);
    loadDogProfile(userId, dogID);
    uploadProfilePicture();
    updateButton(userId, dogID);
}

auth.onAuthStateChanged((user) => {
    const params = new URLSearchParams(window.location.search);
    const dogID = params.get("dogID");

    if (user) {
        doAll(user.uid, dogID);
    } else {
        alert("Log in to edit your dog's profile.");
        window.location.href = "login.html";
    }
});
