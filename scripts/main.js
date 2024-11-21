function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            userDisplayName = user.displayName;
            userId = user.uid;
            userEmail = user.email;
            document.getElementById("name-goes-here").innerText = user.displayName;
            document.getElementById("email-goes-here").innerText = user.email;
        } else {
            console.log("No user is logged in");
            document.querySelector(".btn-secondary").disabled = true;
        }
    });
}

getNameFromAuth();

document.addEventListener("DOMContentLoaded", async function () {
    const mapboxToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';

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
                    <button type="button" data-id="${doc.id}" id="join-btn" class="btn btn-warning">Join</button>
                    <div class="participants">
                        <i id="userCount-btn" class='bx bxs-group'></i>
                        <p id="participants">View Participants</p>
                    </div>
                </div>`;

                const joinButton = post.querySelector("#join-btn");

                const usersGoingRef = db.collection("playdates").doc(doc.id).collection("usersGoing");
                const userAlreadyJoined = await usersGoingRef.where("UserID", "==", userId).get();

                if (!userAlreadyJoined.empty) {
                    joinButton.textContent = "Joined";
                    joinButton.disabled = true;
                }

                joinButton.addEventListener("click", async (event) => {
                    const userAlreadyJoined = await usersGoingRef.where("UserID", "==", userId).get();
                    
                    if (!userAlreadyJoined.empty) {
                        alert("You have already joined this playdate!");
                        joinButton.disabled = true;
                        return;
                    }
                    usersGoingRef.add({
                        Username: userDisplayName,
                        UserID: userId,
                        Email: userEmail
                    })
                        .then(() => {
                            console.log("User added to playdate!");
                            alert("You have successfully joined this playdate!");
                            joinButton.textContent = "Joined";
                            joinButton.disabled = true;
                        })
                        .catch((error) => {
                            console.error("Error adding user to playdate:", error);
                        });
                });

                const userCountButton = post.querySelector("#userCount-btn");
                userCountButton.addEventListener("click", (event) => {
                });

                postContainer.appendChild(post);
            } else {
                db.collection("playdates").doc(doc.id).delete()
                    .catch((error) => {
                        console.error("Error removing expired playdate: ", error);
                    });
                db.collection("users").doc(userId).collection("userPlaydates").doc(doc.id).delete()
                    .catch((error) => {
                        console.error("Error removing expired playdate: ", error);
                    });
            }
        });
    });
});
