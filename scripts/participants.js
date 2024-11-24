document.addEventListener("DOMContentLoaded", function () {
    const participantsModal = document.getElementById("participantsModal");
    const closeModalButton = document.querySelector(".close");
    const participantsList = document.getElementById("participantsList");

    const openModal = async (docId) => {
        participantsList.innerHTML = "<p>Loading...</p>";
        participantsModal.style.display = "block";

        try {
            const usersCollection = await db.collection("playdates").doc(docId).collection("usersGoing").get();
            participantsList.innerHTML = "";

            if (usersCollection.empty) {
                participantsList.innerHTML = "<p>No participants yet</p>";
            } else {
                usersCollection.forEach(userDoc => {
                    const user = userDoc.data();
                    const listItem = document.createElement("li");
                    listItem.textContent = `${user.Username} (${user.Email})`;
                    participantsList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error("Error fetching participants:", error);
            participantsList.innerHTML = "<p>Error loading participants.</p>";
        }
    };

    closeModalButton.addEventListener("click", () => {
        participantsModal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === participantsModal) {
            participantsModal.style.display = "none";
        }
    });

    document.querySelector(".postTemplate").addEventListener("click", function (event) {
        const participantsButton = event.target.closest(".participants");
        if (participantsButton) {
            const docId = participantsButton.closest(".card").querySelector("#join-btn").getAttribute("data-id");
            openModal(docId);

            const welcomeAlertClose = document.getElementById("welcomeAlertClose");
            if (welcomeAlertClose) {
                sessionStorage.setItem("welcomeAlertDismissed", "true");
                welcomeAlertClose.click();
            }
        }
    });
});
