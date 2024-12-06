console.log("participants.js loaded");

// Gets user information from firebase
async function getUserProfile(userId) {
    const userProfile = {
        name: "Unknown User", // default value if none provided
        email: "No email provided", // default value if none provided
        profilePicture: "./styles/images/defaultprofile.png", // default profile image if none provided
    };

    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) { // gets the user's document if it exists
        const userData = userDoc.data();
        userProfile.name = userData.name || userProfile.name; // uses the name from db
        userProfile.email = userData.email || userProfile.email; // uses the email from db
    }

    const profileDoc = await db.collection("users").doc(userId).collection("userProfile").doc("profile").get(); 
    if (profileDoc.exists) { // gets the user's document profile from subcollection if it exists
        const profileData = profileDoc.data();
        userProfile.profilePicture = profileData.profilePicture || userProfile.profilePicture; // uses the user's profile picture if it exists, otherwise use default image
    }

    return userProfile;
}

// Gets dog info from firebase
async function getUserDogs(userId, dogNames) {
    const dogs = [];
    for (const dogName of dogNames) { // loops through the list of dog names in the db
        const snapshot = await db.collection("users").doc(userId).collection("dogprofiles")
            .where("dogname", "==", dogName).get(); // where if the dog name matches the document, adds each dog to the list
        if (!snapshot.empty) {
            snapshot.forEach((doc) => dogs.push(doc.data()));
        }
    }
    return dogs;
}

// Adds new participants to container
function addParticipant(userProfile, userDogs) {
    const participantDiv = document.createElement("div");
    participantDiv.classList.add("participant-entry"); // creates a container for each new participant

    // creates a container for the user
    const profileContainer = document.createElement("div");
    profileContainer.classList.add("profile-container");

    // Adds the user's profile picture
    const profileImage = document.createElement("img");
    profileImage.src = userProfile.profilePicture;
    profileImage.alt = `${userProfile.name}'s Profile Picture`;
    profileImage.classList.add("profile-image");

    // Adds the user's name and email 
    // TODO: Decide if we want to show emails or not
    const userDetails = document.createElement("div");
    userDetails.innerHTML = `
        <p><strong>${userProfile.name}</strong></p>
        <p>${userProfile.email}</p>
    `;

    // Appends the details to the card
    profileContainer.appendChild(profileImage);
    profileContainer.appendChild(userDetails);
    participantDiv.appendChild(profileContainer);

    // Creates a container for the dog
    const dogContainer = document.createElement("div");
    dogContainer.classList.add("dog-container");

    if (userDogs.length === 0) {
        dogContainer.innerHTML = "<p>Just me! :)</p>"; // Let's users choose a no dog option
    } else { // otherwise, loops through the user's dogs and enables them to pick and choose which dogs to bring
        userDogs.forEach((dog) => {
            const dogCard = document.createElement("div");
            dogCard.classList.add("dog-card");
            // Added dogs show details (name, age, breed, size)
            dogCard.innerHTML = `
                <img src="${dog.profilePicture || './styles/images/defaultdog.jpg'}" alt="${dog.dogname}" class="dog-image">
                <p><strong>${dog.dogname}</strong></p>
                <p>Age: ${dog.age || "Unknown"}</p>
                <p>Breed: ${dog.breed || "Unknown"}</p>
                <p>Size: ${dog.size || "Unknown"}</p>
            `;
            dogContainer.appendChild(dogCard);
        });
    }

    participantDiv.appendChild(dogContainer);
    // returns the full participant card 
    return participantDiv;
}

// Populate participants modal
async function populateParticipants(docId) {
    const participantsList = document.getElementById("participantsList"); // selects the particpant list container
    participantsList.innerHTML = "<p>Loading...</p>"; // placeholder text

    const snapshot = await db.collection("playdates").doc(docId).collection("participants").get(); // gets the particpants for the playdates
    participantsList.innerHTML = ""; // Clears the placeholder text

    if (snapshot.empty) { // checks if there are no participants and displays message
        participantsList.innerHTML = "<p>No participants yet</p>";
        return;
    }

    for (const userDoc of snapshot.docs) { // loops through each particpant
        const user = userDoc.data();
        const dogNames = user.dogs || ["No dogs"]; // defaults to no dogs if none are listed

        
        const userProfile = await getUserProfile(user.userId); // gets the participants' user profiles
        const userDogs = dogNames.includes("No dogs") ? [] : await getUserDogs(user.userId, dogNames); // gets the particpants' dog profiles

        
        const participantEntry = addParticipant(userProfile, userDogs); // creates a participant entry
        participantsList.appendChild(participantEntry); // adds the entry to the card
    }
}

// Open participants modal
function openModal(docId) {
    const participantsModal = document.getElementById("participantsModal"); // Selects the modal
    participantsModal.style.display = "block"; // Shows the modal
    populateParticipants(docId); // Populates the modal with participants
}

// Close participants modal
function closeModal() {
    const participantsModal = document.getElementById("participantsModal"); // Selects the modal
    participantsModal.style.display = "none"; // Hides the modal
}

// Click event listener
document.addEventListener("DOMContentLoaded", function () {
    const closeModalButton = document.querySelector(".close"); // Selects the close button for the modal

    closeModalButton.addEventListener("click", closeModal); // Adds a click event to close the modal

    window.addEventListener("click", (event) => { // Additionally adds an event listener for clicks outside the modal
        const participantsModal = document.getElementById("participantsModal");
        if (event.target === participantsModal) {
            closeModal(); 
        }
    });

    // Event listener for clicks on the "View Participants" button on a playdate
    document.querySelector(".postTemplate").addEventListener("click", function (event) {
        const participantsButton = event.target.closest(".participants");
        if (participantsButton) { // Check if the click was on a participants button
            const docId = participantsButton.closest(".card").querySelector("#join-btn").getAttribute("data-id"); // Gets the playdate ID
            openModal(docId); // Opens the modal with the playdate information
        }
    });
});