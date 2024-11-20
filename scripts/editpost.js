function formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

document.querySelectorAll("#back-btn").forEach(button => {
    button.addEventListener("click", (event) => {
        redirectToPage("profile.html");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const savedTitle = localStorage.getItem("savedTitle");
    const savedAddress = localStorage.getItem("savedAddress");
    const savedDescription = localStorage.getItem("savedDescription");
    const savedStart = localStorage.getItem("savedStart");
    
    if (savedTitle) {
        document.querySelector('.form-control[placeholder="Playdate Title"]').value = savedTitle;
    }
    if (savedDescription) {
        document.querySelector('.form-control[aria-label="With textarea"]').value = savedDescription;
    }
    if (savedAddress) {
        selectedAddress = savedAddress;
        geocoder.setInput(savedAddress);
    }
    if (savedStart) {
        document.getElementById("playdate-datetime").value = formatDateTime(savedStart);
    }
});

function capitalizeEachWord(str) {
    return str
        .split(' ')
        .map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function saveEditedPlaydate() {
    let playdateTitle = document.querySelector('.form-control[placeholder="Playdate Title"]').value;
    const playdateDescription = document.querySelector('.form-control[aria-label="With textarea"]').value;
    const playdateDatetime = document.getElementById("playdate-datetime").value;

    const editPlaydateId = localStorage.getItem("editPlaydateId");
    if (!editPlaydateId) {
        console.error("Playdate ID not found. Cannot update.");
        return;
    }

    const editGlobalId = localStorage.getItem("editGlobalId");
    if (!editGlobalId) {
        console.error("Global playdate ID not found. Cannot update.");
        return;
    }

    if (userId) {
        if (selectedAddress.trim() !== "" && playdateDatetime.trim() !== "") {
            if (playdateTitle.trim() === "") {
                playdateTitle = userDisplayName + "'s Playdate";
            }

            playdateTitle = capitalizeEachWord(playdateTitle.trim());

            db.collection("playdates").doc(editGlobalId).update({
                title: playdateTitle,
                description: playdateDescription || "",
                address: selectedAddress,
                datetime: playdateDatetime,
                userId: userId
            }).then(() => {
                return db.collection("users").doc(userId).collection("userPlaydates").doc(editPlaydateId).update({
                    title: playdateTitle,
                    description: playdateDescription || "",
                    address: selectedAddress,
                    datetime: playdateDatetime
                });
            }).then(() => {
                console.log("Playdate updated successfully!");
                alert("Playdate updated successfully!");
                document.querySelector('.form-control[placeholder="Playdate Title"]').value = "";
                document.querySelector('.form-control[aria-label="With textarea"]').value = "";
                selectedAddress = "";
                geocoder.clear();
                redirectToPage('profile.html');
            }).catch(error => {
                console.error("Error updating playdate: ", error);
            });
        } else {
            alert("A place, date, and time must be submitted.");
        }
    } else {
        console.error("User ID is not defined. Please log in.");
    }
}
