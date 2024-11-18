console.log("editDogProfile.js loaded");

const params = new URLSearchParams(window.location.search);
const dogID = params.get("dogID");

if (!dogID) {
    alert("No dog ID provided in the URL.");
    window.location.href = "profile.html"; 
}

// Function to load dog profile information from firebase
function loadDogProfileData() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            db.collection("users")
                .doc(user.uid)
                .collection("dogprofiles")
                .doc(dogID)
                .get()
                .then((doc) => {
                    if (doc.exists) {
                        const data = doc.data();

                        // Populate fields with current data in the collections
                        document.getElementById("dogNameInput").value = data.dogname || "";
                        document.getElementById("dogAgeInput").value = data.age || "";
                        document.getElementById("dogSizeInput").value = data.size || "";
                        document.getElementById("dogBreedInput").value = data.breed || "";

                        const savedPicture = localStorage.getItem("dogProfilePicture");
                        const profilePicture = savedPicture || data.profilePicture || "./styles/images/defaultdog.jpg";
                        document.getElementById("dogProfilePicturePreview").src = profilePicture;

                        const returnButton = document.getElementById("returnDogProfileBtn");
                        returnButton.href = `dog_profile.html?dogID=${dogID}`;

                        console.log("Dog profile data loaded:", data);
                    } else {
                        console.log("No dog profile found in Firestore.");
                    }
                });
        } else {
            alert("Please log in to edit your dog's profile.");
        }
    });
}

// Event listener for checking if image has been uploaded properly and previews
document.getElementById("dogProfilePictureInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("dogProfilePicturePreview").src = e.target.result;
            localStorage.setItem("dogProfilePicture", e.target.result);
            console.log("New profile picture saved to localStorage:", e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        alert("No file selected.");
    }
});

// Event listener (click) for updating dog profile
document.getElementById("updateDogProfileBtn").addEventListener("click", async (e) => {
    e.preventDefault();

    const dogName = document.getElementById("dogNameInput").value;
    const dogAge = document.getElementById("dogAgeInput").value;
    const dogSize = document.getElementById("dogSizeInput").value;
    const dogBreed = document.getElementById("dogBreedInput").value;

    const profilePictureReference = localStorage.getItem("dogProfilePicture") || "./styles/images/defaultdog.jpg";

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            await db.collection("users")
                .doc(user.uid)
                .collection("dogprofiles")
                .doc(dogID)
                .set({
                    dogname: dogName,
                    age: dogAge,
                    size: dogSize,
                    breed: dogBreed,
                    profilePicture: profilePictureReference,
                }, { merge: true });

            console.log("Dog profile updated successfully!");
            alert("Dog profile updated successfully!");

            window.location.href = `dog_profile.html?dogID=${dogID}`;
        } else {
            alert("User not authenticated.");
        }
    });
});

// Load DogProfile on page load
window.onload = loadDogProfileData;
