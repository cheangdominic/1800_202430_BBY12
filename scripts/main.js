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

document.addEventListener("DOMContentLoaded", function () {
    db.collection("playdates").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        const postContainer = document.querySelector(".postTemplate");
        postContainer.innerHTML = "";

        snapshot.forEach(doc => {
            const playdate = doc.data();
            const currentTime = new Date();
            const playdateTime = new Date(playdate.datetime);
            const post = document.createElement("div");
            if (currentTime < playdateTime) {
                post.classList.add("card", "mb-3");
                post.innerHTML = `
                <img src="./styles/images/dogparkpost1.jpg" class="card-img-top" alt="post placeholder">
                <div class="card-body">
                    <h5 class="card-title">${playdate.title}</h5>
                    <p class="card-text">${playdate.address}</p>
                    <p class="card-text">${playdate.description}</p>
                    <p class="card-text"><small class="text-body-secondary">Scheduled for ${new Date(playdate.datetime).toLocaleString()}</small></p>
                    <button type="button" class="btn btn-warning">Join</button>
                </div>`;
                postContainer.appendChild(post);
            }
            else {
                db.collection("playdates").doc(doc.id).delete()
                    .catch((error) => {
                        console.error("Error removing expired playdate: ", error);
                    });
            }
        });
    });
});

