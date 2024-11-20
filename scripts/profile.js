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
                            <div class="post-actions">
                                <button class="edit-btn" data-id="${doc.id}" data-global-id="${playdate.globalPlaydateId}" data-title="${playdate.title}" data-description="${playdate.description}" data-address="${playdate.address}" data-start="${new Date(playdate.datetime).toLocaleString()}">Edit</button>
                                <button class="delete-btn" data-id="${doc.id}" data-global-id="${playdate.globalPlaydateId}">Delete</button>
                            </div>
                        </div>`;
                        postContainer.appendChild(post);
                    } else {
                        db.collection("playdates").doc(playdate.globalPlaydateId).delete()
                            .catch((error) => {
                                console.error("Error removing expired playdate from global collection: ", error);
                            });
                        db.collection("users").doc(userId).collection("userPlaydates").doc(doc.id).delete()
                            .catch((error) => {
                                console.error("Error removing expired playdate from user collection: ", error);
                            });
                    }
                });

                document.querySelectorAll(".delete-btn").forEach(button => {
                    button.addEventListener("click", (event) => {
                        const userPlaydateId = event.target.getAttribute("data-id");
                        const globalPlaydateId = event.target.getAttribute("data-global-id");

                        const confirmDelete = confirm("Are you sure you want to delete this playdate?");
                        if (confirmDelete) {
                            db.collection("users").doc(userId).collection("userPlaydates").doc(userPlaydateId).delete()
                                .then(() => console.log("Playdate deleted from user collection"))
                                .catch(error => console.error("Error deleting playdate from user collection:", error));

                            db.collection("playdates").doc(globalPlaydateId).delete()
                                .then(() => console.log("Playdate deleted from global collection"))
                                .catch(error => console.error("Error deleting playdate from global collection:", error));
                        }
                    });
                });

                document.querySelectorAll(".edit-btn").forEach(button => {
                    button.addEventListener("click", (event) => {
                        const userPlaydateId = event.target.getAttribute("data-id");
                        const globalPlaydateId = event.target.getAttribute("data-global-id");
                        const playdateTitle = event.target.getAttribute("data-title");
                        const playdateAddress = event.target.getAttribute("data-address");
                        const playdateDescription = event.target.getAttribute("data-description");
                        const playdateStart = event.target.getAttribute("data-start");

                        localStorage.setItem("editPlaydateId", userPlaydateId);
                        localStorage.setItem("editGlobalId", globalPlaydateId);
                        localStorage.setItem("savedTitle", playdateTitle);
                        localStorage.setItem("savedAddress", playdateAddress);
                        localStorage.setItem("savedDescription", playdateDescription);
                        localStorage.setItem("savedStart", playdateStart);
                        redirectToPage("edit_post.html");
                    });
                });

                document.querySelectorAll("#back-btn").forEach(button => {
                    button.addEventListener("click", (event) => {
                        redirectToPage("profile.html");
                    });
                });
                
            });
        } else {
            console.log("No user is signed in");
        }
    });

});


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
