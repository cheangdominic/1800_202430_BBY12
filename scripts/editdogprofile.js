console.log("editDogProfile.js loaded");

// Convert image to Base64
function convertImageToBase64(imageFile, callback) {
    const FR = new FileReader();
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
                window.location.href = "profile.html";
            }
        })
        .catch((error) => {
            console.error("Error loading dog profile:", error);
            alert("Failed to load dog profile.");
        });
}

// Populate the UI with dog profile data
function populateDogProfile(data, dogID) {
    const dogPicturePreview = document.getElementById("dogProfilePicturePreview");
    const localStorageKey = `dogProfilePicture_${dogID}`;
    let profilePicture = data.profilePicture || "./styles/images/defaultdog.jpg";

    if (!data.profilePicture) {
        localStorage.removeItem(localStorageKey);
    } else if (localStorage.getItem(localStorageKey)) {
        profilePicture = localStorage.getItem(localStorageKey);
    }

    dogPicturePreview.src = profilePicture;

    document.getElementById("dogNameInput").value = data.dogname || "";
    document.getElementById("dogAgeInput").value = data.age || "";
    document.getElementById("dogSizeInput").value = data.size || "";
    document.getElementById("dogBreedInput").value = data.breed || "";
    document.getElementById("returnDogProfileBtn").href = `dog_profile.html?dogID=${dogID}`;
}

// Upload profile picture and previews
function uploadProfilePicture(dogID) {
    const fileInput = document.getElementById("dogProfilePictureInput");
    const localStorageKey = `dogProfilePicture_${dogID}`;
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const FR = new FileReader();
            FR.onload = (e) => {
                const base64Image = e.target.result;
                document.getElementById("dogProfilePicturePreview").src = base64Image;
                localStorage.setItem(localStorageKey, base64Image);
            };
            FR.readAsDataURL(file);
        }
    });
}

// Save updated dog profile to Firestore
function updateDogProfile(userId, dogID) {
    const localStorageKey = `dogProfilePicture_${dogID}`;
    const updatedData = {
        dogname: document.getElementById("dogNameInput").value,
        age: document.getElementById("dogAgeInput").value,
        size: document.getElementById("dogSizeInput").value,
        breed: document.getElementById("dogBreedInput").value,
        profilePicture: localStorage.getItem(localStorageKey) || "./styles/images/defaultdog.jpg",
    };

    db.collection("users")
        .doc(userId)
        .collection("dogprofiles")
        .doc(dogID)
        .set(updatedData, { merge: true })
        .then(() => {
            alert("Dog profile updated successfully!");
            window.location.href = `dog_profile.html?dogID=${dogID}`;
        })
        .catch((error) => {
            console.error("Error updating dog profile:", error);
            alert("Failed to update dog profile.");
        });
}

// Update button
function updateButton(userId, dogID) {
    const updateBtn = document.getElementById("updateDogProfileBtn"); 
    if (updateBtn) {
        updateBtn.addEventListener("click", (event) => {
            event.preventDefault();
            updateDogProfile(userId, dogID);
        });
    } else {
        console.error("Update button not working.");
    }
}

// Back button returns to dog profile by ID
function backButton(dogID) {
    document.querySelectorAll("#back-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            if (dogID) {
                redirectToPage(`dog_profile.html?dogID=${dogID}`);
            } else {
                console.error("Dog ID not found in URL.");
                alert("Unable to determine the dog profile. Returning to main profile page.");
                redirectToPage("profile.html");
            }
        });
    });
}

// Does all functions
function doAll(userId, dogID) {
    validateDogID(dogID);
    loadDogProfile(userId, dogID);
    uploadProfilePicture(dogID);
    updateButton(userId, dogID); 
    backButton(dogID); 
}

auth.onAuthStateChanged((user) => {
    if (user) {
        const urlParams = new URLSearchParams(window.location.search);
        const dogID = urlParams.get("dogID");
        doAll(user.uid, dogID); 
    } else {
        alert("Please log in to edit your dog profile.");
        window.location.href = "login.html";
    }
});
