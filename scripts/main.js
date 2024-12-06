let playdateId = null;
let userId = null;
let userDisplayName = null;

// Function to get the authenticated user's name and ID
function getNameFromAuth() {
    // Listener for changes in the authentication state
    firebase.auth().onAuthStateChanged(user => {
        // If a user is logged in
        if (user) {
            userDisplayName = user.displayName;  // Store the user's display name
            userId = user.uid;  // Store the user's unique ID
            document.getElementById("name-goes-here").innerText = user.displayName;  // Display the user's name in the specified element
        } else {
            // If no user is logged in
            console.log("No user is logged in");  // Log to console
            document.querySelector(".btn-secondary").disabled = true;  // Disable the secondary button
        }
    });
}

// Function to initialize the user authentication data and display the user's name
getNameFromAuth();

// Event listener that runs once the document content is fully loaded
document.addEventListener("DOMContentLoaded", async function () {
    const mapboxToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';

    // Variables for the modal and button elements in the DOM
    const dogSelectionModal = document.getElementById("dogSelectionModal");
    const dogListContainer = document.getElementById("dogList");
    const confirmDogsButton = document.getElementById("confirmDogsButton");
    const closeModalButton = document.querySelector(".close");

    // Async function to retrieve and display the dogs information in the modal
    const getDogsInfo = async (playdateId) => {
        dogListContainer.innerHTML = "";  // Clear any existing dog list content

        // Create and add an option for "No dogs"
        const noDogOption = document.createElement("div");
        noDogOption.classList.add("checkbox-container");
        noDogOption.innerHTML = `
            <input type="checkbox" id="no-dog" value="No dogs" />
            <label for="no-dog">No dogs</label>
        `;
        dogListContainer.appendChild(noDogOption);

        // Retrieve the dog's information from the current user's profile in Firestore
        const dogSnapshot = await db.collection("users").doc(userId).collection("dogprofiles").get();
        if (!dogSnapshot.empty) {
            // If there are dogs, create checkbox options for each dog
            dogSnapshot.forEach(doc => {
                const dog = doc.data();
                const dogOption = document.createElement("div");
                dogOption.classList.add("checkbox-container");
                dogOption.innerHTML = `
                    <input type="checkbox" id="${dog.dogname}" value="${dog.dogname}" class="dog-checkbox" />
                    <label for="${dog.dogname}">${dog.dogname}</label>
                `;
                dogListContainer.appendChild(dogOption);
            });
        } else {
            // If no dogs are found, display a message
            const noDogsMessage = document.createElement("p");
            noDogsMessage.textContent = "You don't have any dogs in your profile.";
            dogListContainer.appendChild(noDogsMessage);
        }

        // Add event listener to toggle the "No dogs" checkbox based on the selected dogs
        const noDogCheckbox = document.getElementById("no-dog");
        const dogCheckboxes = document.querySelectorAll(".dog-checkbox");

        // If "No dogs" is selected, disable the other checkboxes
        noDogCheckbox.addEventListener("change", () => {
            if (noDogCheckbox.checked) {
                dogCheckboxes.forEach(checkbox => {
                    checkbox.disabled = true;  // Disable dog checkboxes
                });
            } else {
                dogCheckboxes.forEach(checkbox => {
                    checkbox.disabled = false;  // Enable dog checkboxes
                });
            }
        });

        // Disable "No dogs" if any dog checkbox is selected, enable it if none are selected
        dogCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                if (Array.from(dogCheckboxes).some(cb => cb.checked)) {
                    noDogCheckbox.disabled = true;  // Disable "No dogs" checkbox if a dog is selected
                } else {
                    noDogCheckbox.disabled = false;  // Enable "No dogs" if no dog is selected
                }
            });
        });

        // Show the dog selection modal
        dogSelectionModal.style.display = "block";
    };

    // Select the container for the post template and add an event listener for click events
    const postContainer = document.querySelector(".postTemplate");
    postContainer.addEventListener("click", async (event) => {
        // Check if the clicked element is the "Join" button
        const joinButton = event.target.closest("#join-btn");
        if (joinButton) {
            playdateId = joinButton.getAttribute("data-id"); // Retrieve the playdate ID from the button's data-id attribute

            // If the button text is "Leave", prompt the user to confirm if they want to leave
            if (joinButton.textContent === "Leave") {
                if (confirm("Are you sure you want to leave this playdate?")) {
                    // Remove the user from the participants collection of the playdate
                    db.collection("playdates").doc(playdateId).collection("participants").doc(userId).delete()
                        .then(async () => {
                            // Also remove the playdate from the user's "joinedPlaydates" collection
                            const joinedPlaydatesRef = db.collection("users").doc(userId).collection("joinedPlaydates").doc(playdateId);
                            await joinedPlaydatesRef.delete();
                            alert("You have left the playdate.");
                            // Change the button text and classes to show the "Join" option
                            joinButton.textContent = "Join";
                            joinButton.classList.remove("btn-leave");
                            joinButton.classList.add("btn-custom");
                        })
                        .catch(error => {
                            console.error("Error leaving playdate:", error); // Log any errors that occur while leaving
                        });
                }
            } else {
                // If the button text is "Join", open the dog selection modal to choose dogs for the playdate
                await getDogsInfo(playdateId);
            }
        }
    });

    // Add an event listener to close the modal when the close button is clicked
    closeModalButton.addEventListener("click", () => {
        dogSelectionModal.style.display = "none"; // Hide the modal when the close button is clicked
    });

    // Add an event listener to close the modal when clicking outside the modal
    window.addEventListener("click", (event) => {
        if (event.target === dogSelectionModal) {
            dogSelectionModal.style.display = "none"; // Hide the modal if the user clicks outside it
        }
    });

    // Add an event listener to the confirm button in the modal when the user selects dogs
    confirmDogsButton.addEventListener("click", () => {
        // Ensure the playdate ID is defined before proceeding
        if (!playdateId) {
            console.error("Playdate ID is not defined.");
            return;
        }

        // Retrieve the selected dogs from the checkboxes
        const selectedDogs = Array.from(dogListContainer.querySelectorAll("input[type=checkbox]:checked"))
            .map(checkbox => checkbox.value);

        console.log("Selected Dogs:", selectedDogs);

        // Ensure at least one dog is selected, otherwise show an alert
        if (selectedDogs.length === 0) {
            alert("Please select at least one dog or choose 'No Dogs.'");
            return;
        }

        // Add the user to the playdate participants collection with the selected dogs
        db.collection("playdates").doc(playdateId).collection("participants").doc(userId).set({
            dogs: selectedDogs,
            username: userDisplayName,
            userId: userId
        }).then(async () => {
            alert("You have successfully joined this playdate!");
            console.log("User added to playdate!");

            // Change the "Join" button to "Leave" and update its styling
            const joinButton = document.querySelector(`[data-id="${playdateId}"]`);
            if (joinButton) {
                joinButton.textContent = "Leave";
                joinButton.classList.remove("btn-custom");
                joinButton.classList.add("btn-leave");
            }

            dogSelectionModal.style.display = "none"; // Close the modal once the user has joined

            try {
                // Retrieve the playdate document to add it to the user's joined playdates
                const playdateDoc = await db.collection("playdates").doc(playdateId).get();
                if (playdateDoc.exists) {
                    const playdate = playdateDoc.data();

                    let userName = "Unknown Host";

                    try {
                        // Retrieve the host's name from the users collection
                        const userDoc = await db.collection("users").doc(playdate.userId).get();
                        if (userDoc.exists) {
                            userName = userDoc.data().name || "Unknown Host"; // Use "Unknown Host" if the name is not found
                        }
                    } catch (error) {
                        console.error("Error fetching host's name:", error); // Log any errors that occur while fetching the host's name
                    }

                    // Add the playdate details to the user's "joinedPlaydates" collection
                    const joinedPlaydatesRef = db.collection("users").doc(userId).collection("joinedPlaydates");
                    await joinedPlaydatesRef.doc(playdateId).set({
                        title: playdate.title,
                        description: playdate.description || "",
                        address: playdate.address,
                        datetime: playdate.datetime,
                        host: userName,
                        UserID: playdate.userId
                    });

                    console.log("Playdate added to joinedPlaydates.");
                } else {
                    console.error("Playdate document does not exist.");
                }
            } catch (error) {
                console.error("Error adding playdate to joinedPlaydates:", error); // Log any errors that occur while adding the playdate
            }
        }).catch(error => {
            alert("No dogs to be shown."); // If an error occurs during the process, show an alert
        });
    });

    // Listen to real-time updates for the playdates collection, ordered by the 'createdAt' field in descending order
db.collection("playdates").orderBy("createdAt", "desc").onSnapshot(async snapshot => {
    const postContainer = document.querySelector(".postTemplate");
    postContainer.innerHTML = ""; // Clear existing posts

    // Iterate through each document in the snapshot
    snapshot.forEach(async doc => {
        const playdate = doc.data(); // Get the playdate data
        const currentTime = new Date(); // Get the current time
        const playdateTime = new Date(playdate.datetime); // Get the playdate time
        const post = document.createElement("div"); // Create a new post element

        // Check if the playdate is in the future
        if (currentTime < playdateTime) {
            let mapImageURL = ""; // Initialize the map image URL variable
            let userName = "Unknown Host"; // Default host name

            try {
                // Try to get the host's name from the users collection
                const userDoc = await db.collection("users").doc(playdate.userId).get();
                if (userDoc.exists) {
                    userName = userDoc.data().name || "Unknown Host"; // Use the host's name or default to "Unknown Host"
                }
            } catch (error) {
                console.error("Error fetching host's name:", error); // Log any errors while fetching the host's name
            }

            // Check if the playdate has latitude and longitude for Mapbox static map
            if (playdate.latitude && playdate.longitude) {
                mapImageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${playdate.longitude},${playdate.latitude},14,0/500x300?access_token=${mapboxToken}`;
            } else {
                // If no latitude/longitude, fetch the coordinates from Mapbox geocoding API using the address
                const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(playdate.address)}.json?access_token=${mapboxToken}`);
                const data = await response.json();
                if (data.features.length > 0) {
                    const [longitude, latitude] = data.features[0].center; // Get the longitude and latitude
                    mapImageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},14,0/500x300?access_token=${mapboxToken}`; // Construct the Mapbox image URL
                }
            }

            // Add necessary classes and structure to the post
            post.classList.add("card", "mb-3");
            post.innerHTML = `
                <img src="${mapImageURL || './styles/images/default-location.jpg'}" class="card-img-top" alt="location image">
                <div class="card-body">
                    <h5 class="card-title">${playdate.title}</h5>
                    <p class="card-text">Hosted by: @${userName}</p>
                    <p class="card-text">${playdate.description}</p>
                    <p class="card-text">${playdate.address}</p>
                    <p class="card-text"><small class="text-body-secondary">Scheduled for ${new Date(playdate.datetime).toLocaleString()}</small></p>
                    <button type="button" data-id="${doc.id}" id="join-btn" class="btn btn-custom">Join</button>
                    <div class="participants">
                        <i id="userCount-btn" class='bx bxs-group'></i>
                        <p id="participants">View Participants</p>
                    </div>
                </div>`;
            postContainer.appendChild(post); // Append the post to the container

            // Check if the user is already joined in the participants collection
            const usersGoingRef = db.collection("playdates").doc(doc.id).collection("participants");
            const userJoined = await usersGoingRef.doc(userId).get();

            // If the user has joined, update the "Join" button to "Leave"
            if (userJoined.exists) {
                const joinButton = post.querySelector("#join-btn");
                joinButton.textContent = "Leave";
                joinButton.classList.remove("btn-custom");
                joinButton.classList.add("btn-leave");
            }
        } else {
            // If the playdate has passed, delete the expired playdate from the database
            db.collection("playdates").doc(doc.id).delete()
                .catch((error) => {
                    console.error("Error removing expired playdate: ", error); // Log any errors while deleting the expired playdate
                });
            }
        });
    });
});