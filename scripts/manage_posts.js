document.addEventListener("DOMContentLoaded", function () {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;
            db.collection("users").doc(userId).collection("userPlaydates").orderBy("createdAt", "desc").onSnapshot(snapshot => {
                const postContainer = document.querySelector(".post-gallery");
                postContainer.innerHTML = "";

                snapshot.forEach(doc => {
                    const playdate = doc.data();
                    const currentTime = new Date();
                    const playdateTime = new Date(playdate.datetime);
                    const post = document.createElement("div");

                    if (currentTime < playdateTime) {
                        post.classList.add("post");
                        post.innerHTML = `
                        <div class="post">
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
                                <button class="edit-btn" data-id="${doc.id}" data-global-id="${playdate.globalPlaydateId}" data-title="${playdate.title}" data-description="${playdate.description}" data-address="${playdate.address}" data-start="${new Date(playdate.datetime).toLocaleString()}">Edit</button>
                                <button class="delete-btn" data-id="${doc.id}" data-global-id="${playdate.globalPlaydateId}">Delete</button>
                            </div>
                        </div>`;
                        postContainer.appendChild(post);
                    } else {
                        db.collection("playdates").doc(playdate.globalPlaydateId).delete()
                            .catch((error) => {
                                console.error("Error removing expired playdate from global collection: ", error);
                            });
                        db.collection("users").doc(userId).collection("userPlaydates").doc(doc.id).delete()
                            .catch((error) => {
                                console.error("Error removing expired playdate from user collection: ", error);
                            });
                    }
                });

                document.querySelectorAll(".delete-btn").forEach(button => {
                    button.addEventListener("click", (event) => {
                        const userPlaydateId = event.target.getAttribute("data-id");
                        const globalPlaydateId = event.target.getAttribute("data-global-id");

                        const confirmDelete = confirm("Are you sure you want to delete this playdate?");
                        if (confirmDelete) {
                            db.collection("users").doc(userId).collection("userPlaydates").doc(userPlaydateId).delete()
                                .then(() => console.log("Playdate deleted from user collection"))
                                .catch(error => console.error("Error deleting playdate from user collection:", error));

                            db.collection("playdates").doc(globalPlaydateId).delete()
                                .then(() => console.log("Playdate deleted from global collection"))
                                .catch(error => console.error("Error deleting playdate from global collection:", error));
                        }
                    });
                });

                document.querySelectorAll(".edit-btn").forEach(button => {
                    button.addEventListener("click", (event) => {
                        const userPlaydateId = event.target.getAttribute("data-id");
                        const globalPlaydateId = event.target.getAttribute("data-global-id");
                        const playdateTitle = event.target.getAttribute("data-title");
                        const playdateAddress = event.target.getAttribute("data-address");
                        const playdateDescription = event.target.getAttribute("data-description");
                        const playdateStart = event.target.getAttribute("data-start");

                        localStorage.setItem("editPlaydateId", userPlaydateId);
                        localStorage.setItem("editGlobalId", globalPlaydateId);
                        localStorage.setItem("savedTitle", playdateTitle);
                        localStorage.setItem("savedAddress", playdateAddress);
                        localStorage.setItem("savedDescription", playdateDescription);
                        localStorage.setItem("savedStart", playdateStart);
                        redirectToPage("edit_post.html");
                    });
                });
            });
        } else {
            console.log("No user is signed in");
        }
    });
});
