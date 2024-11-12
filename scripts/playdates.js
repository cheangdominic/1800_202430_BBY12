function capitalizeEachWord(str) {
    return str
        .split(' ')
        .map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function savePlaydate() {
    let playdateTitle = document.querySelector('.form-control[placeholder="Playdate Title"]').value;
    const playdateDescription = document.querySelector('.form-control[aria-label="With textarea"]').value;
    const playdateDatetime = document.getElementById("playdate-datetime").value;

    if (userId) {
        if (selectedAddress.trim() !== "" && playdateDatetime.trim() !== "") {
            if (playdateTitle.trim() === "") {
                playdateTitle = userDisplayName + "'s Playdate";
            }

            playdateTitle = capitalizeEachWord(playdateTitle.trim());

            db.collection("playdates").add({
                title: playdateTitle,
                description: playdateDescription || "",
                address: selectedAddress,
                datetime: playdateDatetime,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: userId
            })
                .then(() => {
                    console.log("Playdate saved globally!");
                    alert("Playdate saved successfully!");
                    document.querySelector('.form-control[placeholder="Playdate Title"]').value = "";
                    document.querySelector('.form-control[aria-label="With textarea"]').value = "";
                    selectedAddress = "";
                    geocoder.clear();
                })
                .catch(error => {
                    console.error("Error saving playdate: ", error);
                });
        } else {
            if (selectedAddress.trim() == "" && playdateDatetime.trim() == "") {
                console.error("Playdate address, and date cannot be empty.")
                alert("A place, date and time must be submitted.")
            }
            else if (playdateDatetime.trim() == "") {
                console.error("The date cannot be empty.")
                alert("A date and time must be submitted.")
            }
            else {
                console.error("The address cannot be empty.")
                alert("An address must be submitted.")
            }
        }
    } else {
        console.error("User ID is not defined. Please log in.");
    }
}
