console.log("editDogProfile.js loaded");

// Function to load dog profile information from firestore
function loadDogProfileData() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            db.collection("users")
                .doc(user.uid)
                .collection("dogprofiles")
                .doc("dog") 
                .get()
                .then((doc) => {
                    if (doc.exists) {
                        const data = doc.data();

                        //Populates the fields with current data in firestore
                        document.getElementById("dogNameInput").value = data.dogname || "";
                        document.getElementById("dogAgeInput").value = data.age || "";
                        document.getElementById("dogSizeInput").value = data.size || "";
                        document.getElementById("dogBreedInput").value = data.breed || "";

                        const savedPicture = localStorage.getItem("dogProfilePicture");
                        const profilePicture = savedPicture || `images/${data.profilePicture}` || "images/default-dog.png";
                        document.getElementById("dogProfilePicturePreview").src = profilePicture;

                        console.log("Dog profile data loaded:", data);
                    } else {
                        console.log("No dog profile found in Firestore.");
                    }
                })
        } else {
            alert("Please log in to edit your dog's profile.");
        }
    });
}

//Event Listener for user input for image upload
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

// Populates the fields with updated information
document.getElementById("updateDogProfileBtn").addEventListener("click", async (e) => {
    e.preventDefault();

    const dogName = document.getElementById("dogNameInput").value;
    const dogAge = document.getElementById("dogAgeInput").value;
    const dogSize = document.getElementById("dogSizeInput").value;
    const dogBreed = document.getElementById("dogBreedInput").value;
    
    const profilePictureReference = localStorage.getItem("dogProfilePicture") ? "localStorage" : "defaultdog.jpg";


    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                await db.collection("users")
                    .doc(user.uid)
                    .collection("dogprofiles")
                    .doc("dog")
                    .set({
                        dogname: dogName,
                        age: dogAge,
                        size: dogSize,
                        breed: dogBreed,
                        profilePicture: profilePictureReference,
                    }, { merge: true });

                alert("Dog profile updated successfully!");
                window.location.href = "dog_profile.html"; 
            } catch (error) {
                console.error("Error updating dog profile:", error);
            }
        } else {
            alert("User not authenticated.");
        }
    });
});

// Load DogProfile on page load
window.onload = loadDogProfileData;