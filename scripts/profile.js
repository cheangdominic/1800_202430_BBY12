console.log("userProfile.js loaded");

// DOM Elements: User info, Profile Pictures
const nameAgeLocationElement = document.querySelector(".profile-info h2");
const hobbiesElement = document.querySelector(".hobbies-section p");
const userProfilePicture = document.getElementById("user-profile-image");
const dogIcon = document.getElementById("dog-icon");

// Load Profile Contents

function loadProfile(userId) {
    db.collection("profiles")
        .doc(userId)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();

                // Load user profile picture
                const savedPicture = localStorage.getItem("userProfilePicture");
                if (savedPicture) {
                    userProfilePicture.src = savedPicture;
                    console.log("Using user profile picture from localStorage.");
                } else if (data.profilePicture === "localStorage") {
                    const localImage = localStorage.getItem("userProfilePicture");
                    userProfilePicture.src = localImage || "./styles/images/defaultprofile.png";
                    console.log("Using local image reference for user profile picture.");
                } else if (data.profilePicture) {
                    // Reference from Firestore
                    userProfilePicture.src = data.profilePicture;
                    console.log("Using Firestore reference for user profile picture.");
                } else {
                    // Default Image
                    userProfilePicture.src = "./styles/images/defaultprofile.png";
                    console.log("Using default user profile picture.");
                }

                // Populate name, age, location
                const name = data.name || "Name";
                const age = data.age ? `, ${data.age}` : "";
                const location = data.location ? `, ${data.location}` : "";
                nameAgeLocationElement.textContent = `${name}${age}${location}`;

                // Populate hobbies and interests
                hobbiesElement.textContent = data.interests || "No interests specified.";

                console.log("Profile data loaded:", data);
            } else {
                console.log("No profile data found for this user.");
            }
        })
        .catch((error) => {
            console.error("Error loading profile data:", error);
        });
}


// Load Dog Icon
function loadDogIcon() {
    const savedPicture = localStorage.getItem("dogProfilePicture");
    if (savedPicture) {
        dogIcon.src = savedPicture;
        console.log("Dog icon updated from localStorage:", savedPicture);
    } else {
        dogIcon.src = "./styles/images/defaultdog.jpg";
        console.log("Using default dog profile picture.");
    }
}

// Load profile and dog icon when page loads
window.onload = function () {
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadProfile(user.uid);
            loadDogIcon();
        } else {
            console.log("No user is signed in");
        }
    });
};


document.addEventListener("DOMContentLoaded", function () {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;
            db.collection("users").doc(userId).collection("userPlaydates").orderBy("createdAt", "desc").onSnapshot(snapshot => {
                const postContainer = document.querySelector(".post-gallery");
                postContainer.innerHTML = "";

                snapshot.forEach(doc => {
                    const playdate = doc.data();
                    const currentTime = new Date();
                    const playdateTime = new Date(playdate.datetime);
                    const post = document.createElement("div");
                    if (currentTime < playdateTime) {
                        post.classList.add("post");
                        post.innerHTML = `
                        <div class="post">
                            <div class="post-image">
                                <img src="./styles/images/dogparkpost1.jpg" class="card-img-top" alt="post placeholder">
                            </div>
                            <div class="post-text">
                                <h3>${playdate.title}</h3>
                                <p>${playdate.description}</p>
                                <p>${playdate.address}</p>
                                <p>${new Date(playdate.datetime).toLocaleString()}</p>
                            </div>
                        </div>`;
                        postContainer.appendChild(post);
                    } else {
                        db.collection("playdates").doc(doc.id).delete()
                            .catch((error) => {
                                console.error("Error removing expired playdate: ", error);
                            });
                    }
                });
            });
        } else {
            console.log("No user is signed in");
        }
    });
});
