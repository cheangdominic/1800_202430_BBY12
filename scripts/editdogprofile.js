console.log("editDogProfile.js loaded"); // console log to ensure script has loaded

// Convert image to Base64
function convertImageToBase64(imageFile, callback) { // https://onlinewebtutorblog.com/convert-image-to-the-base64-string-using-javascript/
    const FR = new FileReader(); // Creates a FileReader instance to read files
    FR.onload = (event) => { // if the file is read
        callback(event.target.result); // callback function passed as an argument that will be called when the image is converted
    };
    FR.readAsDataURL(imageFile); // reads the image as a URL
}

// Redirect if dogID is not found
function validateDogID(dogID) {
    if (!dogID) { //checks if dog ID is missing
        alert("No dog ID provided in the URL."); // alerts user 
        window.location.href = "profile.html"; // redirects to main profile page if no dog found
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
            if (doc.exists) { // checks if dog profile document exists
                populateDogProfile(doc.data(), dogID);
            } else { // gives appropriate warnings and redirects
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
    const dogPicturePreview = document.getElementById("dogProfilePicturePreview"); // Selects the image preview element
    const localStorageKey = `dogProfilePicture_${dogID}`; // Gives a unique localStorage key for the profile picture
    let profilePicture = data.profilePicture || "./styles/images/defaultdog.jpg"; // Uses the uploaded picture or a default image

    if (!data.profilePicture) {
        localStorage.removeItem(localStorageKey);
    } else if (localStorage.getItem(localStorageKey)) {
        profilePicture = localStorage.getItem(localStorageKey);
    }

    dogPicturePreview.src = profilePicture; // updates the preview image 

    // Populates the input fields with dog profile data. Or blank if none given
    document.getElementById("dogNameInput").value = data.dogname || "";
    document.getElementById("dogAgeInput").value = data.age || "";
    document.getElementById("dogSizeInput").value = data.size || "";
    document.getElementById("dogBreedInput").value = data.breed || "";
    document.getElementById("returnDogProfileBtn").href = `dog_profile.html?dogID=${dogID}`; // returns to the appropriate dog profile by ID/URL
}

// Upload profile picture and previews
function uploadProfilePicture(dogID) {
    const fileInput = document.getElementById("dogProfilePictureInput"); // Selects the file input element
    const localStorageKey = `dogProfilePicture_${dogID}`; // Gives a unique key for caching the profile picture
    fileInput.addEventListener("change", (event) => { // Event listener for user file input
        const file = event.target.files[0]; // Get the selected file
        if (file) {
            const FR = new FileReader(); // Create a FileReader instance
            FR.onload = (e) => { // When the file is read..
                const base64Image = e.target.result; // Gets the Base64 string
                document.getElementById("dogProfilePicturePreview").src = base64Image; // Update the preview image on page
                localStorage.setItem(localStorageKey, base64Image); // Stores the Base64 string in localStorage
            };
            FR.readAsDataURL(file); // Reads the file as a Base64 string URL
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
        .set(updatedData, { merge: true }) // Updates the database with the new information
        .then(() => {
            alert("Dog profile updated successfully!");
            window.location.href = `dog_profile.html?dogID=${dogID}`;
        })
        .catch((error) => {
            console.error("Error updating dog profile:", error);
            alert("Failed to update dog profile.");
        });
}

// Update button event listener
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
    validateDogID(dogID); // validates dog ID
    loadDogProfile(userId, dogID); // loads dog's profile data from db
    uploadProfilePicture(dogID); // function for uploading profiles
    updateButton(userId, dogID); // enables the update button function
    backButton(dogID); // enables the back button function
}

// Authenticates users
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
