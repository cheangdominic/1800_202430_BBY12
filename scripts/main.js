let playdateId = null; 
let userId = null; 
let userDisplayName = null; 

function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            userDisplayName = user.displayName;
            userId = user.uid;
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
            <label for="no-dog">No Dogs</label>
        `;
        dogListContainer.appendChild(noDogOption);

        db.collection("users").doc(userId).collection("dogprofiles").get().then(snapshot => {
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const dog = doc.data();
                    const dogOption = document.createElement("div");
                    dogOption.classList.add("checkbox-container");
                    dogOption.innerHTML = `
                        <input type="checkbox" id="${dog.dogname}" value="${dog.dogname}" />
                        <label for="${dog.dogname}">${dog.dogname}</label>
                    `;
                    dogListContainer.appendChild(dogOption);
                });
            } else {
                const noDogsMessage = document.createElement("p");
                noDogsMessage.textContent = "You don't have any dogs in your profile.";
                dogListContainer.appendChild(noDogsMessage);
            }

            dogSelectionModal.style.display = "block";
        }).catch(error => {
            console.error("Error fetching dogs:", error);
        });
    };

    const postContainer = document.querySelector(".postTemplate");
    postContainer.addEventListener("click", async (event) => {
        const joinButton = event.target.closest("#join-btn");
        if (joinButton) {
            playdateId = joinButton.getAttribute("data-id"); 

            if (joinButton.textContent === "Leave") {
                if (confirm("Are you sure you want to leave this playdate?")) {
                    db.collection("playdates").doc(playdateId).collection("participants").doc(userId).delete()
                        .then(() => {
                            alert("You have left the playdate.");
                            joinButton.textContent = "Join";
                            joinButton.classList.remove("btn-leave");
                            joinButton.classList.add("btn-custom");
                        })
                        .catch(error => {
                            console.error("Error leaving playdate:", error);;
                        });
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
        }).then(() => {
            alert("You have successfully joined this playdate!");
            console.log("User added to playdate!");

            const joinButton = document.querySelector(`[data-id="${playdateId}"]`);
            if (joinButton) {
                joinButton.textContent = "Leave";
                joinButton.classList.remove("btn-custom");
                joinButton.classList.add("btn-leave");
            }

            dogSelectionModal.style.display = "none";
        }).catch(error => {
            alert("No dogs to be shown.");
        });
    });

    db.collection("playdates").orderBy("createdAt", "desc").onSnapshot(async snapshot => {
        const postContainer = document.querySelector(".postTemplate");
        postContainer.innerHTML = "";

        snapshot.forEach(async doc => {
            const playdate = doc.data();
            const currentTime = new Date();
            const playdateTime = new Date(playdate.datetime);
            const post = document.createElement("div");

            if (currentTime < playdateTime) {
                let mapImageURL = "";
                let userName = "Unknown Host";

                try {
                    const userDoc = await db.collection("users").doc(playdate.userId).get();
                    if (userDoc.exists) {
                        userName = userDoc.data().name || "Unknown Host";
                    }
                } catch (error) {
                    console.error("Error fetching host's name:", error);
                }

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
                postContainer.appendChild(post);

                const usersGoingRef = db.collection("playdates").doc(doc.id).collection("participants");
                const userJoined = await usersGoingRef.doc(userId).get();

                if (userJoined.exists) {
                    const joinButton = post.querySelector("#join-btn");
                    joinButton.textContent = "Leave";
                    joinButton.classList.remove("btn-custom");
                    joinButton.classList.add("btn-leave");
                }
            } else {
                db.collection("playdates").doc(doc.id).delete()
                    .catch((error) => {
                        console.error("Error removing expired playdate: ", error);
                    });
            }
        });
    });
});
