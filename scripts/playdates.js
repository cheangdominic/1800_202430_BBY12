function savePlaydate() {
    let playdateTitle = document.querySelector('.form-control[placeholder="Playdate Title"]').value;
    const playdateDescription = document.querySelector('.form-control[aria-label="With textarea"]').value;
    const playdateDatetime = document.getElementById("playdate-datetime").value;

    if (userId) {
        if (selectedAddress.trim() !== "" && playdateDatetime.trim() !== "") { 
            if (playdateTitle.trim() === "") {
                playdateTitle = userDisplayName + "'s Playdate";
            }
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
            console.error("Playdate address, and/or date and time cannot be empty.");
            alert("Please enter an address, and/or date for the playdate.");
        }
    } else {
        console.error("User ID is not defined. Please log in.");
    }
}