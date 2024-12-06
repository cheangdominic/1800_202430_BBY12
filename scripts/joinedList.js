let userId = "";

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


document.addEventListener("DOMContentLoaded", async function () {
    const mapboxToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';  // Mapbox token for geolocation services
    const dogSelectionModal = document.getElementById("dogSelectionModal");  // Modal for dog selection
    const dogListContainer = document.getElementById("dogList");  // Container to hold dog options
    const confirmDogsButton = document.getElementById("confirmDogsButton");  // Button to confirm dog selection
    const closeModalButton = document.querySelector(".close");  // Button to close modal

    // Function to get and display dogs in the modal
    const getDogsInfo = async (playdateId) => {
        dogListContainer.innerHTML = ""; // Clear previous dog options
        
        // Add option for "No dogs"
        const noDogOption = document.createElement("div");
        noDogOption.classList.add("checkbox-container");
        noDogOption.innerHTML = `
            <input type="checkbox" id="no-dog" value="No dogs" />
            <label for="no-dog">No dogs</label>
        `;
        dogListContainer.appendChild(noDogOption);

        try {
            // Fetch the dog's profiles from the user's collection
            const dogSnapshot = await db.collection("users").doc(userId).collection("dogprofiles").get();
            if (!dogSnapshot.empty) {
                dogSnapshot.forEach(doc => {
                    const dog = doc.data();
                    const dogOption = document.createElement("div");
                    dogOption.classList.add("checkbox-container");
                    dogOption.innerHTML = `
                        <input type="checkbox" id="${dog.dogname}" value="${dog.dogname}" class="dog-checkbox" />
                        <label for="${dog.dogname}">${dog.dogname}</label>
                    `;
                    dogListContainer.appendChild(dogOption); // Add each dog as a checkbox option
                });
            } else {
                // Message when user has no dogs in their profile
                const noDogsMessage = document.createElement("p");
                noDogsMessage.textContent = "You don't have any dogs in your profile.";
                dogListContainer.appendChild(noDogsMessage);
            }
        } catch (error) {
            console.error("Error fetching dog profiles:", error);  // Log error if dog profiles can't be fetched
        }

        // Toggle for enabling/disabling dog checkboxes based on "No dogs" option
        const noDogCheckbox = document.getElementById("no-dog");
        const dogCheckboxes = document.querySelectorAll(".dog-checkbox");

        // Disable dog checkboxes if "No dogs" is selected
        noDogCheckbox.addEventListener("change", () => {
            if (noDogCheckbox.checked) {
                dogCheckboxes.forEach(checkbox => {
                    checkbox.disabled = true; // Disable dog checkboxes when "No dogs" is selected
                });
            } else {
                dogCheckboxes.forEach(checkbox => {
                    checkbox.disabled = false; // Enable dog checkboxes if "No dogs" is not selected
                });
            }
        });

        // Ensure "No dogs" is disabled if any dog checkbox is checked
        dogCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                if (Array.from(dogCheckboxes).some(cb => cb.checked)) {
                    noDogCheckbox.disabled = true; // Disable "No dogs" checkbox if any dog is selected
                } else {
                    noDogCheckbox.disabled = false; // Enable "No dogs" checkbox if no dogs are selected
                }
            });
        });

        // Display the dog selection modal
        dogSelectionModal.style.display = "block";
    };

    const postContainer = document.querySelector(".postTemplate");  // Container for each playdate post
    postContainer.addEventListener("click", async (event) => {
        const joinButton = event.target.closest("#join-btn");  // Get the join button within the post
        if (joinButton) {
            playdateId = joinButton.getAttribute("data-id");  // Get playdate ID from the button's data attribute
    
            // Handle leaving a playdate
            if (joinButton.textContent === "Leave") {
                if (confirm("Are you sure you want to leave this playdate?")) {
                    const playdateParticipantsRef = db.collection("playdates").doc(playdateId).collection("participants").doc(userId);
                    const joinedPlaydatesRef = db.collection("users").doc(userId).collection("joinedPlaydates").doc(playdateId);
    
                    try {
                        // Delete user from the playdate's participants and from the joined playdates collection
                        await playdateParticipantsRef.delete();
                        await joinedPlaydatesRef.delete();
                        alert("You have left the playdate.");  // Notify user they left the playdate

                        // Update join button UI
                        joinButton.textContent = "Join";
                        joinButton.classList.remove("btn-leave");
                        joinButton.classList.add("btn-custom");
                    } catch (error) {
                        console.error("Error leaving playdate:", error);  // Log error if something goes wrong
                    }
                }
            } else {
                // Fetch dogs if user wants to join the playdate
                await getDogsInfo(playdateId);
            }
        }
    });

    // Close the dog selection modal
    closeModalButton.addEventListener("click", () => {
        dogSelectionModal.style.display = "none";  // Hide the modal
    });

    // Close modal if the user clicks outside of it
    window.addEventListener("click", (event) => {
        if (event.target === dogSelectionModal) {
            dogSelectionModal.style.display = "none";  // Hide the modal when clicking outside
        }
    });

    // Confirm the selected dogs and join the playdate
    confirmDogsButton.addEventListener("click", () => {
        if (!playdateId) {
            console.error("Playdate ID is not defined.");  // Log error if playdate ID is not defined
            return;
        }

        // Get selected dogs from the checkboxes
        const selectedDogs = Array.from(dogListContainer.querySelectorAll("input[type=checkbox]:checked"))
            .map(checkbox => checkbox.value);  // Map selected dogs' values

        console.log("Selected Dogs:", selectedDogs);  // Log selected dogs for debugging

        // Check if at least one dog is selected
        if (selectedDogs.length === 0) {
            alert("Please select at least one dog or choose 'No Dogs.'");  // Prompt user to select dogs
            return;
        }

        // Add user as a participant in the playdate
        db.collection("playdates").doc(playdateId).collection("participants").doc(userId).set({
            dogs: selectedDogs,
            username: userDisplayName,
            userId: userId
        }).then(async () => {
            alert("You have successfully joined this playdate!");  // Notify user they've joined the playdate
            console.log("User added to playdate!");  // Log success

            // Update join button UI to show "Leave" option
            const joinButton = document.querySelector(`[data-id="${playdateId}"]`);
            if (joinButton) {
                joinButton.textContent = "Leave";
                joinButton.classList.remove("btn-custom");
                joinButton.classList.add("btn-leave");
            }

            // Hide the dog selection modal
            dogSelectionModal.style.display = "none";

            try {
                // Fetch the playdate document to add it to the user's joined playdates
                const playdateDoc = await db.collection("playdates").doc(playdateId).get();
                if (playdateDoc.exists) {
                    const playdate = playdateDoc.data();
            
                    let userName = "Unknown Host";
            
                    try {
                        // Fetch the host's name
                        const userDoc = await db.collection("users").doc(playdate.userId).get();
                        if (userDoc.exists) {
                            userName = userDoc.data().name || "Unknown Host";  // Get host's name
                        }
                    } catch (error) {
                        console.error("Error fetching host's name:", error);  // Log error if host's name can't be fetched
                    }
        
                    // Add the playdate to the user's joined playdates collection
                    const joinedPlaydatesRef = db.collection("users").doc(userId).collection("joinedPlaydates");
                    await joinedPlaydatesRef.doc(playdateId).set({
                        title: playdate.title,
                        description: playdate.description || "",
                        address: playdate.address,
                        datetime: playdate.datetime,
                        host: userName,
                        UserID: playdate.userId
                    });
            
                    console.log("Playdate added to joinedPlaydates.");  // Log success
                } else {
                    console.error("Playdate document does not exist.");  // Log error if playdate document doesn't exist
                }
            } catch (error) {
                console.error("Error adding playdate to joinedPlaydates:", error);  // Log error if something goes wrong
            }
            
        }).catch(error => {
            alert("No dogs to be shown.");  // Alert if no dogs are selected
        });
    });


    firebase.auth().onAuthStateChanged(async (user) => {  // Listen for authentication state changes
        db.collection("users").doc(userId).collection("joinedPlaydates").orderBy("datetime", "asc").onSnapshot(async snapshot => { 
            const postContainer = document.querySelector(".postTemplate");  // Get the container for playdate posts
            postContainer.innerHTML = "";  // Clear previous posts
    
            if (snapshot.empty) {  // If no playdates are found
                const noPlaydatesMessage = document.createElement("p");
                noPlaydatesMessage.textContent = "You haven't joined any playdates yet.";  // Display message if no playdates
                noPlaydatesMessage.style.marginTop = "5%";
                postContainer.appendChild(noPlaydatesMessage);  // Add the message to the container
                return;
            }
    
            snapshot.forEach(async doc => {  // Iterate through the documents in the snapshot
                const playdate = doc.data();  // Get the playdate data
                const currentTime = new Date();  // Get the current time
                const playdateTime = new Date(playdate.datetime);  // Convert playdate datetime to Date object
                const post = document.createElement("div");  // Create a new post element
    
                if (currentTime < playdateTime) {  // If the playdate is in the future
                    let mapImageURL = "";  // Default map image URL variable
    
                    if (playdate.latitude && playdate.longitude) {  // If playdate has latitude and longitude
                        mapImageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${playdate.longitude},${playdate.latitude},14,0/500x300?access_token=${mapboxToken}`;  // Generate Mapbox image URL
                    } else {  // If no latitude and longitude, try to get coordinates from the address
                        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(playdate.address)}.json?access_token=${mapboxToken}`);
                        const data = await response.json();  // Fetch and parse the geocoding response
                        if (data.features.length > 0) {  // If geocoding returns results
                            const [longitude, latitude] = data.features[0].center;  // Get the coordinates from the response
                            mapImageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},14,0/500x300?access_token=${mapboxToken}`;  // Generate Mapbox image URL
                        }
                    }
    
                    post.classList.add("card", "mb-3");  // Add classes to the post for styling
                    post.innerHTML = `  <!-- Populate the post with playdate details -->  
                        <img src="${mapImageURL || './styles/images/default-location.jpg'}" class="card-img-top" alt="location image">
                        <div class="card-body">
                            <h5 class="card-title">${playdate.title}</h5>
                            <p class="card-text">Hosted by: @${playdate.host}</p>
                            <p class="card-text">${playdate.description}</p>
                            <p class="card-text">${playdate.address}</p>
                            <p class="card-text"><small class="text-body-secondary">Scheduled for ${new Date(playdate.datetime).toLocaleString()}</small></p>
                            <button type="button" data-id="${doc.id}" id="join-btn" class="btn btn-leave">Leave</button>
                            <div class="participants">
                                <i id="userCount-btn" class='bx bxs-group'></i>
                                <p id="participants">View Participants</p>
                            </div>
                        </div>`;
                    postContainer.appendChild(post);  // Add the post to the container
                } else {  // If the playdate has expired
                    try {
                        await db.collection("users").doc(userId).collection("joinedPlaydates").doc(doc.id).delete();  // Remove expired playdate from the user's joined playdates
                        console.log("Expired playdate removed from joinedPlaydates.");  // Log success
                    } catch (error) {
                        console.error("Error removing expired playdate: ", error);  // Log error if something goes wrong
                    }
                }
            });
        });
    });
});    