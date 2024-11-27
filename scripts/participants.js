console.log("participants.js loaded");

// Gets user information from firebase
async function getUserProfile(userId) {
    const userProfile = {
        name: "Unknown User", 
        email: "No email provided", 
        profilePicture: "./styles/images/defaultprofile.png", 
    };

    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
        const userData = userDoc.data();
        userProfile.name = userData.name || userProfile.name;
        userProfile.email = userData.email || userProfile.email;
    }

    const profileDoc = await db.collection("users").doc(userId).collection("userProfile").doc("profile").get();
    if (profileDoc.exists) {
        const profileData = profileDoc.data();
        userProfile.profilePicture = profileData.profilePicture || userProfile.profilePicture;
    }

    return userProfile;
}

// Gets dog info from firebase
async function getUserDogs(userId, dogNames) {
    const dogs = [];
    for (const dogName of dogNames) {
        const snapshot = await db.collection("users").doc(userId).collection("dogprofiles")
            .where("dogname", "==", dogName).get();
        if (!snapshot.empty) {
            snapshot.forEach((doc) => dogs.push(doc.data()));
        }
    }
    return dogs;
}

// Adds new participants to container
function addParticipant(userProfile, userDogs) {
    const participantDiv = document.createElement("div");
    participantDiv.classList.add("participant-entry");

    const profileContainer = document.createElement("div");
    profileContainer.classList.add("profile-container");

    const profileImage = document.createElement("img");
    profileImage.src = userProfile.profilePicture;
    profileImage.alt = `${userProfile.name}'s Profile Picture`;
    profileImage.classList.add("profile-image");

    // TODO: Decide if we want to show emails or not
    const userDetails = document.createElement("div");
    userDetails.innerHTML = `
        <p><strong>${userProfile.name}</strong></p>
        <p>${userProfile.email}</p>
    `;

    profileContainer.appendChild(profileImage);
    profileContainer.appendChild(userDetails);
    participantDiv.appendChild(profileContainer);

    // Dogs section
    const dogContainer = document.createElement("div");
    dogContainer.classList.add("dog-container");

    if (userDogs.length === 0) {
        dogContainer.innerHTML = "<p>Just me! :)</p>";
    } else {
        userDogs.forEach((dog) => {
            const dogCard = document.createElement("div");
            dogCard.classList.add("dog-card");
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
    return participantDiv;
}

// Populate participants modal
async function populateParticipants(docId) {
    const participantsList = document.getElementById("participantsList");
    participantsList.innerHTML = "<p>Loading...</p>";

    const snapshot = await db.collection("playdates").doc(docId).collection("participants").get();
    participantsList.innerHTML = ""; // Clear previous entries

    if (snapshot.empty) {
        participantsList.innerHTML = "<p>No participants yet</p>";
        return;
    }

    for (const userDoc of snapshot.docs) {
        const user = userDoc.data();
        const dogNames = user.dogs || ["No dogs"];

        
        const userProfile = await getUserProfile(user.userId);
        const userDogs = dogNames.includes("No dogs") ? [] : await getUserDogs(user.userId, dogNames);

        
        const participantEntry = addParticipant(userProfile, userDogs);
        participantsList.appendChild(participantEntry);
    }
}

// Open participants modal
function openModal(docId) {
    const participantsModal = document.getElementById("participantsModal");
    participantsModal.style.display = "block";
    populateParticipants(docId);
}

// Close participants modal
function closeModal() {
    const participantsModal = document.getElementById("participantsModal");
    participantsModal.style.display = "none";
}

// Click event listener
document.addEventListener("DOMContentLoaded", function () {
    const closeModalButton = document.querySelector(".close");

    closeModalButton.addEventListener("click", closeModal);

    window.addEventListener("click", (event) => {
        const participantsModal = document.getElementById("participantsModal");
        if (event.target === participantsModal) {
            closeModal();
        }
    });

    document.querySelector(".postTemplate").addEventListener("click", function (event) {
        const participantsButton = event.target.closest(".participants");
        if (participantsButton) {
            const docId = participantsButton.closest(".card").querySelector("#join-btn").getAttribute("data-id");
            openModal(docId);
        }
    });
});
