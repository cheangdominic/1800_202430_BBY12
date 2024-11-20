function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            userDisplayName = user.displayName;
            userId = user.uid;
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

                if (playdate.latitude && playdate.longitude) {
                    mapImageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${playdate.longitude},${playdate.latitude},12,0/500x300?access_token=${mapboxToken}`;
                } else {
                    const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(playdate.address)}.json?access_token=${mapboxToken}`);
                    const data = await response.json();
                    if (data.features.length > 0) {
                        const [longitude, latitude] = data.features[0].center;
                        mapImageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},12,0/500x300?access_token=${mapboxToken}`;
                    }
                }

                post.classList.add("card", "mb-3");
                post.innerHTML = `
                <img src="${mapImageURL || './styles/images/default-location.jpg'}" class="card-img-top" alt="location image">
                <div class="card-body">
                    <h5 class="card-title">${playdate.title}</h5>
                    <p class="card-text">${playdate.description}</p>
                    <p class="card-text">${playdate.address}</p>
                    <p class="card-text"><small class="text-body-secondary">Scheduled for ${new Date(playdate.datetime).toLocaleString()}</small></p>
                    <button type="button" class="btn btn-warning">Join</button>
                </div>`;
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
