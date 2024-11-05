

// Function to edit a post
function editPost(postId) {
    const post = document.getElementById(postId);
    const postText = post.querySelector('.post-text');
    const editButton = post.querySelector('.edit-btn');

    if (editButton.textContent === 'Edit') {
        const currentText = postText.querySelector('p').textContent;
        postText.innerHTML = `<textarea rows="3">${currentText}</textarea>`;
        editButton.textContent = 'Save';
    } else {
        const newText = postText.querySelector('textarea').value;
        postText.innerHTML = `<p>${newText}</p>`;
        editButton.textContent = 'Edit';
    }
}

// Function to delete a post
function deletePost(postId) {
    const post = document.getElementById(postId);
    post.remove();
}

// TODO: Functions for Swapping, adding images, pulling from db etc // 

// Retrieve from firebase/firestore and display updated information //

const nameAgeLocationElement = document.querySelector('.profile-info h2');
const hobbiesElement = document.querySelector('.hobbies-section p');

auth.onAuthStateChanged((user) => {
    if (user) {
        loadProfile(user.uid); 
    } else {
        console.log("No user is signed in");
    }
});

function loadProfile(userId) {
    db.collection('profiles').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const name = data.name || "Name";
                const age = data.age ? `, ${data.age}` : "";
                const location = data.location ? `, ${data.location}` : "";
                nameAgeLocationElement.textContent = `${name}${age}${location}`;
                
                hobbiesElement.textContent = data.interests || "No interests specified.";
            } else {
                console.log("No profile data found for this user.");
            }
        })
        .catch((error) => {
            console.error("Error loading profile data: ", error);
        });
}