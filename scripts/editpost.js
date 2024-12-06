function formatDateTime(dateString) {  // Function to format a date string into a specific datetime format
    const date = new Date(dateString);  // Convert the string into a Date object
    const year = date.getFullYear();  // Extract the year
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Extract and format the month
    const day = String(date.getDate()).padStart(2, '0');  // Extract and format the day
    const hours = String(date.getHours()).padStart(2, '0');  // Extract and format the hour
    const minutes = String(date.getMinutes()).padStart(2, '0');  // Extract and format the minutes
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;  // Return the formatted datetime string
}

document.querySelectorAll("#back-btn").forEach(button => {  // Add event listener to all elements with ID 'back-btn'
    button.addEventListener("click", (event) => {  // When a button is clicked
        redirectToPage("profile.html");  // Redirect to the 'profile.html' page
    });
});

document.addEventListener("DOMContentLoaded", function () {  // Wait for the document to load before running this function
    const savedTitle = localStorage.getItem("savedTitle");  // Get the saved title from localStorage
    const savedAddress = localStorage.getItem("savedAddress");  // Get the saved address from localStorage
    const savedDescription = localStorage.getItem("savedDescription");  // Get the saved description from localStorage
    const savedStart = localStorage.getItem("savedStart");  // Get the saved start datetime from localStorage
    
    if (savedTitle) {  // If there's a saved title
        document.querySelector('.form-control[placeholder="Playdate Title"]').value = savedTitle;  // Set the saved title in the title input field
    }
    if (savedDescription) {  // If there's a saved description
        document.querySelector('.form-control[aria-label="With textarea"]').value = savedDescription;  // Set the saved description in the description input field
    }
    if (savedAddress) {  // If there's a saved address
        selectedAddress = savedAddress;  // Store the saved address
        geocoder.setInput(savedAddress);  // Set the geocoder input to the saved address
    }
    if (savedStart) {  // If there's a saved start time
        document.getElementById("playdate-datetime").value = formatDateTime(savedStart);  // Set the saved start time in the datetime input field
    }
});

function capitalizeEachWord(str) {  // Function to capitalize the first letter of each word in a string
    return str
        .split(' ')  // Split the string by spaces into an array of words
        .map(word => {  // Iterate over each word in the array
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();  // Capitalize the first letter of each word and make the rest lowercase
        })
        .join(' ');  // Join the words back into a single string
}

function saveEditedPlaydate() {  // Function to save the edited playdate details
    let playdateTitle = document.querySelector('.form-control[placeholder="Playdate Title"]').value;  // Get the title input value
    const playdateDescription = document.querySelector('.form-control[aria-label="With textarea"]').value;  // Get the description input value
    const playdateDatetime = document.getElementById("playdate-datetime").value;  // Get the datetime input value

    const editPlaydateId = localStorage.getItem("editPlaydateId");  // Get the playdate ID to be edited from localStorage
    if (!editPlaydateId) {  // If the playdate ID is not found
        console.error("Playdate ID not found. Cannot update.");  // Log an error message
        return;  // Exit the function
    }

    const editGlobalId = localStorage.getItem("editGlobalId");  // Get the global playdate ID from localStorage
    if (!editGlobalId) {  // If the global playdate ID is not found
        console.error("Global playdate ID not found. Cannot update.");  // Log an error message
        return;  // Exit the function
    }

    if (userId) {  // If the user is logged in
        if (selectedAddress.trim() !== "" && playdateDatetime.trim() !== "") {  // If the address and datetime are not empty
            if (playdateTitle.trim() === "") {  // If the title is empty
                playdateTitle = userDisplayName + "'s Playdate";  // Set the default title to the user's display name followed by "'s Playdate"
            }

            playdateTitle = capitalizeEachWord(playdateTitle.trim());  // Capitalize the title

            db.collection("playdates").doc(editGlobalId).update({  // Update the global playdate document in Firestore
                title: playdateTitle,
                description: playdateDescription || "",
                address: selectedAddress,
                datetime: playdateDatetime,
                userId: userId
            }).then(() => {  // Once the global playdate is updated, update the user's playdate
                return db.collection("users").doc(userId).collection("userPlaydates").doc(editPlaydateId).update({
                    title: playdateTitle,
                    description: playdateDescription || "",
                    address: selectedAddress,
                    datetime: playdateDatetime
                });
            }).then(() => {  // Once the user's playdate is updated
                console.log("Playdate updated successfully!");  // Log a success message
                alert("Playdate updated successfully!");  // Show an alert to the user
                document.querySelector('.form-control[placeholder="Playdate Title"]').value = "";  // Clear the title input field
                document.querySelector('.form-control[aria-label="With textarea"]').value = "";  // Clear the description input field
                selectedAddress = "";  // Clear the selected address
                geocoder.clear();  // Clear the geocoder input
                redirectToPage('profile.html');  // Redirect the user to their profile page
            }).catch(error => {  // If an error occurs while updating the playdate
                console.error("Error updating playdate: ", error);  // Log the error
            });
        } else {  // If the address or datetime is empty
            alert("A place, date, and time must be submitted.");  // Show an alert to the user
        }
    } else {  // If the user is not logged in
        console.error("User ID is not defined. Please log in.");  // Log an error message
    }
}
