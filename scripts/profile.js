console.log("profile.js loaded");

// Load user profile data from Firestore
function loadProfile(userId) {
    db.collection("users")
        .doc(userId)
        .collection("userProfile")
        .doc("profile")
        .get()
        .then((doc) => {
            if (doc.exists) {
                updateProfile(doc.data());
            } else {
                console.log("No profile data found for this user.");
            }
        })
        .catch((error) => {
            console.error("Error loading profile:", error);
        });
}

// Update the profile UI with loaded data
function updateProfile(data) {
    const nameAgeLocationElement = document.querySelector(".profile-info h2");
    const hobbiesElement = document.querySelector(".hobbies-section p");
    const userProfilePicture = document.getElementById("user-profile-image");

    const savedPicture = localStorage.getItem("userProfilePicture");
    userProfilePicture.src =
        savedPicture || data.profilePicture || "./styles/images/defaultprofile.png";

    const name = data.name || "Name";
    const age = data.age ? `, ${data.age}` : "";
    const location = data.location ? `, ${data.location}` : "";
    nameAgeLocationElement.textContent = `${name}${age}${location}`;

    hobbiesElement.textContent = data.interests || "No interests specified.";
}

// Load dog profiles dynamically
function loadDogProfiles(userId) {
    const dogProfilesContainer = document.getElementById("dog-profiles");
    db.collection("users")
        .doc(userId)
        .collection("dogprofiles")
        .get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                dogProfilesContainer.innerHTML = "";
                snapshot.forEach((doc) => {
                    const dog = doc.data();
                    addDogProfileToPage(doc.id, dog);
                });
            } else {
                dogProfilesContainer.innerHTML =
                    "<p>No dogs added yet. Click 'Add Dog' to create a profile for your dog.</p>";
            }
        })
        .catch((error) => {
            console.error("Error loading dog profiles:", error);
        });
}

// Adds dog profile to page
function addDogProfileToPage(dogId, dog) {
    const dogProfilesContainer = document.getElementById("dog-profiles");
    const dogCardHTML = `
        <div class="dog-card">
            <img src="${dog.profilePicture || './styles/images/defaultdog.jpg'}" alt="${dog.dogname}'s Profile">
            <h5>${dog.dogname || "No Name"}</h5>
            <p>Age: ${dog.age || "N/A"}</p>
            <p>Breed: ${dog.breed || "N/A"}</p>
            <p>Size: ${dog.size || "N/A"}</p>
            <a href="dog_profile.html?dogID=${dogId}">View Profile</a>
        </div>
    `;
    dogProfilesContainer.innerHTML += dogCardHTML;
}

// Load playdate posts dynamically
function loadPlaydates(userId) {
    const postContainer = document.querySelector(".post-gallery");
    db.collection("users")
        .doc(userId)
        .collection("userPlaydates")
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {
            postContainer.innerHTML = ""; // Clears the container
            snapshot.forEach((doc) => {
                const playdate = doc.data();
                const currentTime = new Date();
                const playdateTime = new Date(playdate.datetime);

                if (currentTime < playdateTime) {
                    const post = createPlaydatePost(playdate);
                    postContainer.appendChild(post);
                } else {
                    // Remove expired playdates from collection
                    db.collection("playdates").doc(playdate.globalPlaydateId).delete();
                    db.collection("users")
                        .doc(userId)
                        .collection("userPlaydates")
                        .doc(doc.id)
                        .delete();
                }
            });
        });
}

// Create a playdate post element
function createPlaydatePost(playdate) {
    const post = document.createElement("div");
    post.classList.add("post");
    post.innerHTML = `
        <div class="post">
            <div class="post-image">
                <img src="./styles/images/dogparkpost1.jpg" class="card-img-top" id="profile-post-img" alt="post placeholder">
            </div>
            <div class="post-text">
                <h3>${playdate.title}</h3>
                <p>${playdate.description}</p>
                <p>${playdate.address}</p>
                <p>${new Date(playdate.datetime).toLocaleString()}</p>
            </div>
        </div>`;
    return post;
}

// Does all functions
function doAll(userId) {
    loadProfile(userId);
    loadDogProfiles(userId);
    loadPlaydates(userId);
}

auth.onAuthStateChanged((user) => {
    if (user) {
        doAll(user.uid);
    } else {
        console.log("No user is signed in.");
    }
});
