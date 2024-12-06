console.log("profile.js loaded"); // console log to ensure the script loads properly

// Load profile data
function loadProfile(userId) {
    const userRef = db.collection("users").doc(userId); // Reference to the user document within the db
    userRef.get().then((userDoc) => { // gets the user document
        if (userDoc.exists) { // checks if the document exists. If it does, then..
            const name = userDoc.data().name; // Gets the user's name
            const profileRef = userRef.collection("userProfile").doc("profile"); // References to the user's profile document within the db
            profileRef.get().then((profileDoc) => { // Gets the profile's document
                const profileData = profileDoc.exists ? profileDoc.data() : {}; // If the profile exists, 
                updateProfileUI({ ...profileData, name }); // Users the retreived data to update the page with the information
            });
        } else {
            console.log("No user profile found."); // Console log if no such profile exists
        }
    }).catch((error) => console.error("Error loading profile:", error));
}

// Update profile UI
function updateProfileUI(data) {
    const userProfilePicture = document.getElementById("user-profile-image"); // selects the profile picture element on the page

    // Sets to default profile picture if new user
    let profilePicture = data.profilePicture || "./styles/images/defaultprofile.png";

    // Removes local storage (should only be issue if using same device)
    if (!data.profilePicture) {
        localStorage.removeItem("userProfilePicture");
    } else if (localStorage.getItem("userProfilePicture")) {
        profilePicture = localStorage.getItem("userProfilePicture"); // uses cached profile image if it exists on local storage
    }
    userProfilePicture.src = profilePicture;

    // Updates the user's profile details onto the UI
    const name = data.name || "";
    const age = data.age ? `, ${data.age}` : "";
    const location = data.location ? `, ${data.location}` : "";
    document.querySelector("#profile-name-age-location").textContent = `${name}${age}${location}`;
    document.querySelector("#profile-interests").textContent = data.interests || "No interests specified.";
}

// Adds a dog profile card to the page
function addDogProfileToPage(dogId, dog) {
    const dogProfilesContainer = document.getElementById("dog-profiles"); // selects the dog profile element on the page to populate
    // All the dog information with default values if none provided by user
    const dogCardHTML = `
        <div class="dog-card" onclick="redirectToDogProfile('${dogId}')">
            <img src="${dog.profilePicture || './styles/images/defaultdog.jpg'}" alt="${dog.dogname || "Dog"}'s Profile">
            <h5>${dog.dogname || "No Name"}</h5>
            <p>Age: ${dog.age || "N/A"}</p>
            <p>Breed: ${dog.breed || "N/A"}</p>
            <p>Size: ${dog.size || "N/A"}</p>
        </div>
    `;
    // Adds a dog profile card to the container
    dogProfilesContainer.innerHTML += dogCardHTML;
}

// Redirects to a dog profile when the container is clicked
function redirectToDogProfile(dogId) {
    window.location.href = `dog_profile.html?dogID=${dogId}`;
}


// Load dog profiles
function loadDogProfiles(userId) {
    const dogProfilesContainer = document.getElementById("dog-profiles"); // selects the dog container
    // Fetches all the dog profiles for the user and extracts all the information from the db to populate the fields
    db.collection("users").doc(userId).collection("dogprofiles").get()
        .then((snapshot) => { 
            if (!snapshot.empty) { // checks if dog profiles exists for the user
                dogProfilesContainer.innerHTML = "";
                snapshot.forEach((doc) => { // loops through each dog's profile
                    const dog = doc.data();
                    addDogProfileToPage(doc.id, dog); // calls the function to add the dog profile to the UI
                });
            } else {
                dogProfilesContainer.innerHTML = "<p>No dogs added yet. Click 'Add Dog' to create a profile for your dog.</p>"; // Text for user if they have no dogs in their profile
            }
        })
        .catch((error) => console.error("Error loading dog profiles:", error));
}


// Load playdates
function loadPlaydates(userId) {
    const postContainer = document.querySelector(".post-gallery");
    db.collection("users").doc(userId).collection("userPlaydates").orderBy("createdAt", "desc").onSnapshot((snapshot) => { // referenes to the user's playdate collection and orders by creation date with most recent first
        postContainer.innerHTML = "";
        snapshot.forEach((doc) => { // loops through each playdate to get playdate date, current time, and the scheduled time
            const playdate = doc.data();
            const currentTime = new Date();
            const playdateTime = new Date(playdate.datetime);

            if (currentTime < playdateTime) { // checks if playdate is still available
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
                            <div class="post-actions">
                                <button class="edit-btn" data-id="${doc.id}" data-global-id="${playdate.globalPlaydateId}" data-title="${playdate.title}" data-description="${playdate.description}" data-address="${playdate.address}" data-start="${new Date(playdate.datetime).toLocaleString()}">Edit</button>
                                <button class="delete-btn" data-id="${doc.id}" data-global-id="${playdate.globalPlaydateId}">Delete</button>
                            </div>
                    </div>`;
                postContainer.innerHTML += post; // Adds a playdate card to the profile
            } else {
                deleteExpiredPlaydate(userId, doc.id, playdate.globalPlaydateId); // automatically deletes the card if the playdate time expires
            }
        });

        // Adds event listeners for the delete button
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const userPlaydateId = event.target.getAttribute("data-id"); // Gets the playdate ID from the button
                const globalPlaydateId = event.target.getAttribute("data-global-id"); // Gets the global playdate ID
                const confirmDelete = confirm("Are you sure you want to delete this playdate?"); // Prompts the user to confirm deletion
                if (confirmDelete) { // if user confirms, console logs the confirmation and logs errors
                    db.collection("users").doc(userId).collection("userPlaydates").doc(userPlaydateId).delete()
                        .then(() => console.log("Playdate deleted from user collection"))
                        .catch(error => console.error("Error deleting playdate from user collection:", error));
                    db.collection("playdates").doc(globalPlaydateId).delete()
                        .then(() => console.log("Playdate deleted from global collection"))
                        .catch(error => console.error("Error deleting playdate from global collection:", error));
                }
            });
        });
        // Adds event listener for the edit button
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const userPlaydateId = event.target.getAttribute("data-id"); // Gets the playdate ID from the button
                const globalPlaydateId = event.target.getAttribute("data-global-id"); // Gets the global playdate ID
                const playdateTitle = event.target.getAttribute("data-title"); // Gets the playdate title
                const playdateAddress = event.target.getAttribute("data-address"); // Gets the playdate address
                const playdateDescription = event.target.getAttribute("data-description"); // Gets the playdate description
                const playdateStart = event.target.getAttribute("data-start"); // Gets the playdate start time
                // stores the playdate details into local storage to prefill text fields
                localStorage.setItem("editPlaydateId", userPlaydateId);
                localStorage.setItem("editGlobalId", globalPlaydateId);
                localStorage.setItem("savedTitle", playdateTitle);
                localStorage.setItem("savedAddress", playdateAddress);
                localStorage.setItem("savedDescription", playdateDescription);
                localStorage.setItem("savedStart", playdateStart);
                redirectToPage("edit_post.html"); // redirects to edit playdate page
            });
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
    loadProfile(userId); // loads the user's profile and updates the UI
    loadDogProfiles(userId); // loads the user's dog profiles and updates the UI
    loadPlaydates(userId); // loads the user's playdates and updates the UI
}

// Authenticates the user
auth.onAuthStateChanged((user) => {
    if (user) { // checks if user is signed in
        const userId = user.uid; // gets the user's unique ID
        loadProfile(userId); // loads the profile
        loadDogProfiles(userId); // loads the dog profile
        loadPlaydates(userId); // loads the playdates
    } else {
        console.log("No user signed in."); // console log for errors
    }
});
