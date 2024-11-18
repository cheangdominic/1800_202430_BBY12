document.addEventListener("DOMContentLoaded", () => {
    console.log("profile.js loaded");

    // DOM Elements
    const nameAgeLocationElement = document.querySelector(".profile-info h2");
    const hobbiesElement = document.querySelector(".hobbies-section p");
    const userProfilePicture = document.getElementById("user-profile-image");
    const dogProfilesContainer = document.getElementById("dog-profiles");

    // Load User Profile Data
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
                    } else if (data.profilePicture) {
                        userProfilePicture.src = data.profilePicture;
                    } else {
                        userProfilePicture.src = "./styles/images/defaultprofile.png";
                    }

                    // Populate name, age, location
                    const name = data.name || "Name";
                    const age = data.age ? `, ${data.age}` : "";
                    const location = data.location ? `, ${data.location}` : "";
                    nameAgeLocationElement.textContent = `${name}${age}${location}`;

                    // Populate hobbies and interests
                    hobbiesElement.textContent = data.interests || "No interests specified.";
                } else {
                    console.log("No profile data found for this user.");
                }
            });
    }

    // Load Dog Profiles Dynamically
    function loadDogProfiles(userId) {
        db.collection("users")
            .doc(userId)
            .collection("dogprofiles")
            .get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    dogProfilesContainer.innerHTML = ""; 

                    snapshot.forEach((doc) => {
                        const dog = doc.data();

                        // Dynamically populate if user has multiple dogs or adds one
                        const dogCardHTML = `
                            <div class="dog-card">
                                <img src="${dog.profilePicture || './styles/images/defaultdog.jpg'}" alt="${dog.dogname}'s Profile">
                                <h5>${dog.dogname || "No Name"}</h5>
                                <p>Age: ${dog.age || "N/A"}</p>
                                <p>Breed: ${dog.breed || "N/A"}</p>
                                <p>Size: ${dog.size || "N/A"}</p>
                                <a href="dog_profile.html?dogID=${doc.id}">View Profile</a>
                            </div>
                        `;

                        dogProfilesContainer.innerHTML += dogCardHTML;
                    });
                } else {
                    dogProfilesContainer.innerHTML = "<p>No dogs added yet. Click 'Add Dog' to create a profile for your dog.</p>";
                }
            });
    }

    // Loads all profiles onto page
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadProfile(user.uid); 
            loadDogProfiles(user.uid); 
        } else {
            console.log("No user is signed in");
        }
    });
});

// Dynamically populates page with current/active playdates
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
                                <img src="./styles/images/dogparkpost1.jpg" class="card-img-top" id="profile-post-img" alt="post placeholder">
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
                        db.collection("playdates").doc(playdate.globalPlaydateId).delete();
                        db.collection("users").doc(userId).collection("userPlaydates").doc(doc.id).delete();
                    }
                });
            });
        } else {
            console.log("No user is signed in");
        }
    });
});
