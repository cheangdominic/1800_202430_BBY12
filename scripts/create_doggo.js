document.addEventListener("DOMContentLoaded", () => {
    console.log("create_doggo.js loaded");
  
    const form = document.getElementById("dog-form");
  
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        const dogName = document.getElementById("dog-name").value.trim();
        const dogAge = document.getElementById("dog-age").value.trim();
        const dogBreed = document.getElementById("dog-breed").value.trim();
        const dogSize = document.getElementById("dog-size").value;
        const dogImage = document.getElementById("dog-image").files[0];
  
        if (!dogName || !dogAge || !dogBreed || !dogSize || !dogImage) {
            alert("Please fill out all fields and upload an image.");
            return;
        }
  
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                const userID = user.uid;
  
                const reader = new FileReader();
                reader.onload = async function (event) {
                    const base64Image = event.target.result;
                    const dogData = {
                        dogname: dogName,
                        age: dogAge,
                        breed: dogBreed,
                        size: dogSize,
                        profilePicture: base64Image,
                    };
  
                    // Add the dog profile to firebase collections
                    await firebase.firestore()
                        .collection("users")
                        .doc(userID)
                        .collection("dogprofiles")
                        .add(dogData);
  
                    alert("Dog profile created successfully!");
                    window.location.href = "profile.html";
                };
  
                reader.readAsDataURL(dogImage);
            } else {
                alert("You need to be logged in to add a dog profile.");
            }
        });
    });
  });
  