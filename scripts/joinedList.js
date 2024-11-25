let userId = "";

function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            userDisplayName = user.displayName;
            userId = user.uid;
            console.log(userId);
            document.getElementById("name-goes-here").innerText = user.displayName;
        } else {
            console.log("No user is logged in");
            document.querySelector(".btn-secondary").disabled = true;
        }
    });
}

getNameFromAuth();

document.addEventListener("DOMContentLoaded", async function () {
    const mapboxToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';
    const dogSelectionModal = document.getElementById("dogSelectionModal");
    const dogListContainer = document.getElementById("dogList");
    const confirmDogsButton = document.getElementById("confirmDogsButton");
    const closeModalButton = document.querySelector(".close");

    const getDogsInfo = async (playdateId) => {
        dogListContainer.innerHTML = "";
        
        const noDogOption = document.createElement("div");
        noDogOption.classList.add("checkbox-container");
        noDogOption.innerHTML = `
            <input type="checkbox" id="no-dog" value="No dogs" />
            <label for="no-dog">No dogs</label>
        `;
        dogListContainer.appendChild(noDogOption);
    
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
                dogListContainer.appendChild(dogOption);
            });
        } else {
            const noDogsMessage = document.createElement("p");
            noDogsMessage.textContent = "You don't have any dogs in your profile.";
            dogListContainer.appendChild(noDogsMessage);
        }
    
        // Added toggle for no dog
        const noDogCheckbox = document.getElementById("no-dog");
        const dogCheckboxes = document.querySelectorAll(".dog-checkbox");
    
        noDogCheckbox.addEventListener("change", () => {
            if (noDogCheckbox.checked) {
                dogCheckboxes.forEach(checkbox => {
                    checkbox.disabled = true; 
                });
            } else {
                dogCheckboxes.forEach(checkbox => {
                    checkbox.disabled = false; 
                });
            }
        });
    
        dogCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                if (Array.from(dogCheckboxes).some(cb => cb.checked)) {
                    noDogCheckbox.disabled = true; 
                } else {
                    noDogCheckbox.disabled = false; 
                }
            });
        });
        dogSelectionModal.style.display = "block";
    };

    const postContainer = document.querySelector(".postTemplate");
    postContainer.addEventListener("click", async (event) => {
        const joinButton = event.target.closest("#join-btn");
        if (joinButton) {
            playdateId = joinButton.getAttribute("data-id");
    
            if (joinButton.textContent === "Leave") {
                if (confirm("Are you sure you want to leave this playdate?")) {
                    const playdateParticipantsRef = db.collection("playdates").doc(playdateId).collection("participants").doc(userId);
                    const joinedPlaydatesRef = db.collection("users").doc(userId).collection("joinedPlaydates").doc(playdateId);
    
                    try {
                        await playdateParticipantsRef.delete();
                        await joinedPlaydatesRef.delete();
                        alert("You have left the playdate.");

                        joinButton.textContent = "Join";
                        joinButton.classList.remove("btn-leave");
                        joinButton.classList.add("btn-custom");
                    } catch (error) {
                        console.error("Error leaving playdate:", error);
                    }
                }
            } else {
                await getDogsInfo(playdateId);
            }
        }
    });
    

    closeModalButton.addEventListener("click", () => {
        dogSelectionModal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === dogSelectionModal) {
            dogSelectionModal.style.display = "none";
        }
    });

    confirmDogsButton.addEventListener("click", () => {
        if (!playdateId) {
            console.error("Playdate ID is not defined.");
            return;
        }

        const selectedDogs = Array.from(dogListContainer.querySelectorAll("input[type=checkbox]:checked"))
            .map(checkbox => checkbox.value);

        console.log("Selected Dogs:", selectedDogs);

        if (selectedDogs.length === 0) {
            alert("Please select at least one dog or choose 'No Dogs.'");
            return;
        }

        db.collection("playdates").doc(playdateId).collection("participants").doc(userId).set({
            dogs: selectedDogs,
            username: userDisplayName,
            userId: userId
        }).then(async () => {
            alert("You have successfully joined this playdate!");
            console.log("User added to playdate!");

            const joinButton = document.querySelector(`[data-id="${playdateId}"]`);
            if (joinButton) {
                joinButton.textContent = "Leave";
                joinButton.classList.remove("btn-custom");
                joinButton.classList.add("btn-leave");
            }

            dogSelectionModal.style.display = "none";

            try {
                const playdateDoc = await db.collection("playdates").doc(playdateId).get();
                if (playdateDoc.exists) {
                    const playdate = playdateDoc.data();
            
                    let userName = "Unknown Host";
            
                    try {
                        const userDoc = await db.collection("users").doc(playdate.userId).get();
                        if (userDoc.exists) {
                            userName = userDoc.data().name || "Unknown Host";
                        }
                    } catch (error) {
                        console.error("Error fetching host's name:", error);
                    }
        
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
                console.error("Error adding playdate to joinedPlaydates:", error);
            }
            
        }).catch(error => {
            alert("No dogs to be shown.");
        });
    });

    db.collection("users").doc(userId).collection("joinedPlaydates").onSnapshot(async snapshot => { 
        const postContainer = document.querySelector(".postTemplate");
        postContainer.innerHTML = "";
    
        if (snapshot.empty) {
            const noPlaydatesMessage = document.createElement("p");
            noPlaydatesMessage.textContent = "You haven't joined any playdates yet.";
            postContainer.appendChild(noPlaydatesMessage);
            return;
        }
    
        snapshot.forEach(async doc => {
            const playdate = doc.data();
            const currentTime = new Date();
            const playdateTime = new Date(playdate.datetime);
            const post = document.createElement("div");
    
            if (currentTime < playdateTime) {
                let mapImageURL = "";
    
                if (playdate.latitude && playdate.longitude) {
                    mapImageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${playdate.longitude},${playdate.latitude},14,0/500x300?access_token=${mapboxToken}`;
                } else {
                    const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(playdate.address)}.json?access_token=${mapboxToken}`);
                    const data = await response.json();
                    if (data.features.length > 0) {
                        const [longitude, latitude] = data.features[0].center;
                        mapImageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},14,0/500x300?access_token=${mapboxToken}`;
                    }
                }
    
                post.classList.add("card", "mb-3");
                post.innerHTML = `
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
                postContainer.appendChild(post);
            } else {
                try {
                    await db.collection("users").doc(userId).collection("joinedPlaydates").doc(doc.id).delete();
                    console.log("Expired playdate removed from joinedPlaydates.");
                } catch (error) {
                    console.error("Error removing expired playdate: ", error);
                }
            }
        });
    });
});    