console.log("create_doggo.js loaded");

// Convert image to Base64
function convertImageToBase64(imageFile, callback) {
    const FR = new FileReader(); // https://onlinewebtutorblog.com/convert-image-to-the-base64-string-using-javascript/
    FR.onload = (event) => {
        callback(event.target.result);
    };
    FR.readAsDataURL(imageFile);
}

// Validate form inputs
function validateDogForm(dogName, dogAge, dogBreed, dogSize, dogImage) {
    if (!dogName || !dogAge || !dogBreed || !dogSize || !dogImage) {
        alert("Please fill out all fields and upload an image.");
        return false;
    }
    return true;
}

// Handle the form submission
function submitForm(userId) {
    const form = document.getElementById("dog-form");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

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

// Does all functions
function doAll(userId) {
    submitForm(userId);
}

auth.onAuthStateChanged((user) => {
    if (user) {
        doAll(user.uid);
    } else {
        alert("Log in to add a dog profile.");
        window.location.href = "login.html";
    }
});
