document.addEventListener("DOMContentLoaded", function () {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;
            db.collection("users").doc(userId).collection("userPlaydates").orderBy("createdAt", "desc").onSnapshot(snapshot => {
                let i = 0;
                const postContainer = document.querySelector(".post-gallery");
                postContainer.innerHTML = "";

                snapshot.forEach(doc => {
                    const playdate = doc.data();
                    const currentTime = new Date();
                    const playdateTime = new Date(playdate.datetime);
                    const post = document.createElement("div");
                    if (currentTime < playdateTime) {
                        i++;
                        post.innerHTML = `
                <div class="post" id="post-${i}">
                    <div class="post-image">
                        <img src="./styles/images/dogparkpost1.jpg" class="card-img-top" alt="post placeholder">
                    </div>
                    <div class="post-text">
                        <h3>${playdate.title}</h3>
                        <p>${playdate.description}</p>
                        <p>${playdate.address}</p>
                        <p>${new Date(playdate.datetime).toLocaleString()}</p>
                    </div>
                    <div class="post-actions">
                        <button class="edit-btn" onclick="editPost('post-${i}')">Edit</button>
                        <button class="delete-btn" onclick="deletePost('post-${i}')">Delete</button>
                    </div>
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
        } else {
            console.log("No user is signed in");
        }
    });
});
