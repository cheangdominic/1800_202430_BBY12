// Function to capitalize each word in a string
function capitalizeEachWord(str) {
    return str
        .split(' ') // Split the string into words
        .map(word => {
            // For each word, capitalize the first letter and make the rest lowercase
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' '); // Join the words back together with spaces
}

// Function to save a new playdate to the Firestore database
function savePlaydate() {
    // Get the playdate title, description, and datetime from the form
    let playdateTitle = document.querySelector('.form-control[placeholder="Playdate Title"]').value;
    const playdateDescription = document.querySelector('.form-control[aria-label="With textarea"]').value;
    const playdateDatetime = document.getElementById("playdate-datetime").value;

    // Check if the user is logged in
    if (userId) {
        // Validate that the address and datetime are not empty
        if (selectedAddress.trim() !== "" && playdateDatetime.trim() !== "") {
            // If the title is empty, use the user's display name as the default title
            if (playdateTitle.trim() === "") {
                playdateTitle = userDisplayName + "'s Playdate";
            }

            // Capitalize each word in the playdate title
            playdateTitle = capitalizeEachWord(playdateTitle.trim());

            // Save the playdate in the 'playdates' collection
            db.collection("playdates").add({
                title: playdateTitle,
                description: playdateDescription || "",
                address: selectedAddress,
                datetime: playdateDatetime,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: userId
            }).then((playdate) => {
                const globalPlaydateId = playdate.id; // Get the ID of the newly added playdate

                // Add the playdate to the user's personal collection
                return Promise.all([
                    db.collection("users").doc(userId).collection("userPlaydates").add({
                        title: playdateTitle,
                        description: playdateDescription || "",
                        address: selectedAddress,
                        datetime: playdateDatetime,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        userId: userId,
                        globalPlaydateId: globalPlaydateId // Link the playdate with its global ID
                    })
                ]);
            }).then(() => {
                // If everything was successful, log and alert the user
                console.log("Playdate saved globally and in user collection!");
                alert("Playdate saved successfully!");
                
                // Clear the form fields
                document.querySelector('.form-control[placeholder="Playdate Title"]').value = "";
                document.querySelector('.form-control[aria-label="With textarea"]').value = "";
                selectedAddress = ""; // Reset the selected address
                geocoder.clear(); // Clear the geocoder (if used for address selection)

                // Redirect the user to the main page
                redirectToPage('main.html');
            }).catch(error => {
                // Handle any errors that occur during the save process
                console.error("Error saving playdate: ", error);
            });
        } else {
            // Handle cases where address or datetime is empty
            if (selectedAddress.trim() == "" && playdateDatetime.trim() == "") {
                console.error("Playdate address, and date cannot be empty.");
                alert("A place, date, and time must be submitted.");
            } else if (playdateDatetime.trim() == "") {
                console.error("The date cannot be empty.");
                alert("A date and time must be submitted.");
            } else {
                console.error("The address cannot be empty.");
                alert("An address must be submitted.");
            }
        }
    } else {
        // Handle case where the user is not logged in
        console.error("User ID is not defined. Please log in.");
    }
}
