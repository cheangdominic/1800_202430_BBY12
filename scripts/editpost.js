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
                redirectToPage('manage_posts.html');
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
