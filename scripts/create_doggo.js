console.log("create_doggo.js loaded");

// Convert image to Base64
function convertImageToBase64(imageFile, callback) { // https://onlinewebtutorblog.com/convert-image-to-the-base64-string-using-javascript/
    const FR = new FileReader(); // Creates a FileReader instance to read files
    FR.onload = (event) => { // if the file is read
        callback(event.target.result); // callback function passed as an argument that will be called when the image is converted
    };
    FR.readAsDataURL(imageFile); // reads the image as a URL
}

// Validate form inputs
function validateDogForm(dogName, dogAge, dogBreed, dogSize, dogImage) {
    if (!dogName || !dogAge || !dogBreed || !dogSize || !dogImage) { // checks if there's missing fields
        alert("Please fill out all fields and upload an image."); // prompts users to fill fields in and upload image
        return false;
    }
    return true;
}

// Handle the form submission
function submitForm(userId) {
    const form = document.getElementById("dog-form");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Gets the dog's dog's details 
        const dogName = document.getElementById("dog-name").value.trim();
        const dogAge = document.getElementById("dog-age").value.trim();
        const dogBreed = document.getElementById("dog-breed").value.trim();
        const dogSize = document.getElementById("dog-size").value;
        const dogImage = document.getElementById("dog-image").files[0];

        if (!validateDogForm(dogName, dogAge, dogBreed, dogSize, dogImage)) {
            return;
        }

        convertImageToBase64(dogImage, (base64Image) => {
            const dogData = {
                dogname: dogName,
                age: dogAge,
                breed: dogBreed,
                size: dogSize,
                profilePicture: base64Image,
            };

            saveDogProfile(userId, dogData);
        });
    });
}

// Save dog profile to Firestore
function saveDogProfile(userId, dogData) {
    let profilePicture = dogData.profilePicture || "./styles/images/defaultdog.jpg";

    if (!dogData.profilePicture) {
        localStorage.removeItem("dogProfilePicture");
    } else if (localStorage.getItem("dogProfilePicture")) {
        profilePicture = localStorage.getItem("dogProfilePicture");
    }
    // adds the dog's profile to the user's dogprofile subcollection
    db.collection("users")
        .doc(userId)
        .collection("dogprofiles")
        .add(dogData)
        .then(() => {
            alert("Dog profile created successfully!");
            window.location.href = "profile.html";
        })
        .catch((error) => {
            console.error("Error creating dog profile:", error);
            alert("Failed to create dog profile.");
        });
}

// Event listener for back button
document.querySelectorAll("#back-btn").forEach(button => {
    button.addEventListener("click", () => {
        redirectToPage("profile.html");
    });
});

// Does all functions
function doAll(userId) {
    submitForm(userId);
}

// Authenticates the user before doing any function
auth.onAuthStateChanged((user) => {
    if (user) {
        doAll(user.uid);
    } else {
        alert("Log in to add a dog profile.");
        window.location.href = "login.html";
    }
});
