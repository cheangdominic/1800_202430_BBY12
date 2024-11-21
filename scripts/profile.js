console.log("profile.js loaded");

// Load profile data
function loadProfile(userId) {
    const userRef = db.collection("users").doc(userId);
    userRef.get().then((userDoc) => {
        if (userDoc.exists) {
            const name = userDoc.data().name;
            const profileRef = userRef.collection("userProfile").doc("profile");
            profileRef.get().then((profileDoc) => {
                const profileData = profileDoc.exists ? profileDoc.data() : {};
                updateProfileUI({ ...profileData, name });
            });
        } else {
            console.log("No user profile found.");
        }
    }).catch((error) => console.error("Error loading profile:", error));
}

// Update profile UI
function updateProfileUI(data) {
    const userProfilePicture = document.getElementById("user-profile-image");

    // Sets to default profile picture if new user
    let profilePicture = data.profilePicture || "./styles/images/defaultprofile.png";

    // Removes local storage (should only be issue if using same device)
    if (!data.profilePicture) {
        localStorage.removeItem("userProfilePicture");
    } else if (localStorage.getItem("userProfilePicture")) {
        profilePicture = localStorage.getItem("userProfilePicture");
    }
    userProfilePicture.src = profilePicture;

    const name = data.name || "";
    const age = data.age ? `, ${data.age}` : "";
    const location = data.location ? `, ${data.location}` : "";
    document.querySelector("#profile-name-age-location").textContent = `${name}${age}${location}`;
    document.querySelector("#profile-interests").textContent = data.interests || "No interests specified.";
}

function addDogProfileToPage(dogId, dog) {
    const dogProfilesContainer = document.getElementById("dog-profiles");
    const dogCardHTML = `
        <div class="dog-card" onclick="redirectToDogProfile('${dogId}')">
            <img src="${dog.profilePicture || './styles/images/defaultdog.jpg'}" alt="${dog.dogname || "Dog"}'s Profile">
            <h5>${dog.dogname || "No Name"}</h5>
            <p>Age: ${dog.age || "N/A"}</p>
            <p>Breed: ${dog.breed || "N/A"}</p>
            <p>Size: ${dog.size || "N/A"}</p>
        </div>
    `;
    dogProfilesContainer.innerHTML += dogCardHTML;
}

function redirectToDogProfile(dogId) {
    window.location.href = `dog_profile.html?dogID=${dogId}`;
}


// Load dog profiles
function loadDogProfiles(userId) {
    const dogProfilesContainer = document.getElementById("dog-profiles");
    db.collection("users").doc(userId).collection("dogprofiles").get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                dogProfilesContainer.innerHTML = ""; 
                snapshot.forEach((doc) => {
                    const dog = doc.data();
                    addDogProfileToPage(doc.id, dog); 
                });
            } else {
                dogProfilesContainer.innerHTML = "<p>No dogs added yet. Click 'Add Dog' to create a profile for your dog.</p>";
            }
        })
        .catch((error) => console.error("Error loading dog profiles:", error));
}


// Load playdates
function loadPlaydates(userId) {
    const postContainer = document.querySelector(".post-gallery");
    db.collection("users").doc(userId).collection("userPlaydates").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        postContainer.innerHTML = "";
        snapshot.forEach((doc) => {
            const playdate = doc.data();
            const currentTime = new Date();
            const playdateTime = new Date(playdate.datetime);

            if (currentTime < playdateTime) {
                const post = `
                    <div class="post">
                        <div class="post-image">
                            <img src="./styles/images/dogparkpost1.jpg" class="card-img-top" alt="Placeholder">
                        </div>
                        <div class="post-text">
                            <h3>${playdate.title}</h3>
                            <p>${playdate.description}</p>
                            <p>${playdate.address}</p>
                            <p>${new Date(playdate.datetime).toLocaleString()}</p>
                        </div>
                    </div>`;
                postContainer.innerHTML += post;
            } else {
                deleteExpiredPlaydate(userId, doc.id, playdate.globalPlaydateId);
            }
        });
    });
}

// Delete expired playdates
function deleteExpiredPlaydate(userId, playdateId, globalPlaydateId) {
    if (globalPlaydateId) {
        db.collection("playdates").doc(globalPlaydateId).delete().catch((error) =>
            console.error("Error deleting global playdate:", error)
        );
    }
    db.collection("users").doc(userId).collection("userPlaydates").doc(playdateId).delete().catch((error) =>
        console.error("Error deleting user playdate:", error)
    );
}

// Does all functions
function doAll(userId) {
    loadProfile(userId);
    loadDogProfiles(userId);
    loadPlaydates(userId);
}

auth.onAuthStateChanged((user) => {
    if (user) {
        const userId = user.uid;
        loadProfile(userId);
        loadDogProfiles(userId);
        loadPlaydates(userId);
    } else {
        console.log("No user signed in.");
    }
});
