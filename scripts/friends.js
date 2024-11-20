// Global variable to store the currently logged in user
let currentUser;

// Authentication state observer
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user;
        loadFriendsList(); // Load friends list when user is authenticated
    } else {
        window.location.href = 'login.html'; // Redirect to login if not authenticated
    }
});

// Event listeners for search functionality
// Trigger search when the search button is clicked
document.getElementById('searchButton').addEventListener('click', searchUsers);
// Trigger search when Enter key is pressed in search input
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchUsers();
    }
});

/**
 * Search for users by email in Firebase
 * This function queries the users collection for matching email addresses
 */
function searchUsers() {
    const searchEmail = document.getElementById('searchInput').value.trim();
    if (!searchEmail) return; // Exit if search input is empty

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<p>Searching...</p>';

    // Query Firestore for users with matching email
    firebase.firestore().collection('users')
        .where('email', '==', searchEmail)
        .get()
        .then((querySnapshot) => {
            searchResults.innerHTML = '';
            
            // Display message if no users found
            if (querySnapshot.empty) {
                searchResults.innerHTML = '<p>No users found</p>';
                return;
            }

            // Create and display user cards for each result
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                // Don't show the current user in search results
                if (doc.id !== currentUser.uid) {
                    const userCard = createUserSearchCard(doc.id, userData);
                    searchResults.appendChild(userCard);
                }
            });
        })
        .catch((error) => {
            console.error("Error searching users: ", error);
            searchResults.innerHTML = '<p>Error searching users</p>';
        });
}

/**
 * Create a card element for a user search result
 * @param {string} userId - The user's Firebase UID
 * @param {Object} userData - The user's profile data
 * @returns {HTMLElement} The created card element
 */
function createUserSearchCard(userId, userData) {
    const div = document.createElement('div');
    div.className = 'card mb-3';
    // Create card HTML with user profile information
    div.innerHTML = `
        <div class="card-body d-flex align-items-start">
            <div class="friend-profile-img">
                <img src="${userData.profileImage || '/images/default-avatar.png'}" 
                     alt="Profile" class="rounded-circle">
            </div>
            <div class="friend-info flex-grow-1 ms-3">
                <h5 class="card-title">${userData.name || 'Anonymous User'}</h5>
                <p class="card-text text-muted">${userData.email}</p>
                <p class="card-text profile-bio">${userData.bio || 'No bio available'}</p>
                ${userData.hobbies ? `<p class="card-text hobbies">
                    <small class="text-muted">Hobbies: ${userData.hobbies}</small></p>` : ''}
            </div>
            <button class="btn btn-primary add-friend-btn" data-userid="${userId}">
                Add Friend
            </button>
        </div>
    `;

    // Add click event listener to the Add Friend button
    div.querySelector('.add-friend-btn').addEventListener('click', () => addFriend(userId));
    return div;
}

/**
 * Add a user as a friend and clear search results after successful addition
 * @param {string} friendId - The Firebase UID of the user to add as friend
 */
function addFriend(friendId) {
    const friendsRef = firebase.firestore().collection('friendships');
    
    // Check if friendship already exists
    friendsRef.where('users', 'array-contains', currentUser.uid)
        .get()
        .then((querySnapshot) => {
            let friendshipExists = false;
            querySnapshot.forEach((doc) => {
                if (doc.data().users.includes(friendId)) {
                    friendshipExists = true;
                }
            });

            if (friendshipExists) {
                alert('This user is already your friend!');
                return;
            }

            // Create new friendship document
            return friendsRef.add({
                users: [currentUser.uid, friendId],
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then((docRef) => {
            if (docRef) {  // Only execute if friend was actually added
                alert('Friend added successfully!');
                loadFriendsList(); // Reload friends list to show new friend
                
                // Clear search results and search input
                const searchResults = document.getElementById('searchResults');
                const searchInput = document.getElementById('searchInput');
                searchResults.innerHTML = ''; // Clear search results
                searchInput.value = ''; // Clear search input field
            }
        })
        .catch((error) => {
            console.error("Error adding friend: ", error);
            alert('Error adding friend');
        });
}

/**
 * Load and display the current user's friends list
 * This function queries the friendships collection and displays friend cards
 */
function loadFriendsList() {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '<p>Loading friends...</p>';

    // Query Firestore for current user's friendships
    firebase.firestore().collection('friendships')
        .where('users', 'array-contains', currentUser.uid)
        .get()
        .then((querySnapshot) => {
            friendsList.innerHTML = '';
            
            if (querySnapshot.empty) {
                friendsList.innerHTML = '<p>No friends yet</p>';
                return;
            }

            // Create array of promises to fetch friend data
            const friendPromises = [];
            querySnapshot.forEach((doc) => {
                const friendshipData = doc.data();
                const friendId = friendshipData.users.find(id => id !== currentUser.uid);
                
                // Create a promise for each friend's data
                const friendPromise = firebase.firestore().collection('users').doc(friendId).get()
                    .then((friendDoc) => {
                        if (friendDoc.exists) {
                            return {
                                friendId: friendId,
                                friendData: friendDoc.data(),
                                friendshipId: doc.id
                            };
                        }
                    });
                friendPromises.push(friendPromise);
            });

            // Wait for all friend data to be fetched
            return Promise.all(friendPromises);
        })
        .then((friends) => {
            // Create and display friend cards
            friends.forEach((friend) => {
                if (friend) {
                    const friendCard = createFriendCard(friend.friendId, friend.friendData, friend.friendshipId);
                    friendsList.appendChild(friendCard);
                }
            });
        })
        .catch((error) => {
            console.error("Error loading friends: ", error);
            friendsList.innerHTML = '<p>Error loading friends</p>';
        });
}

/**
 * Create a card element for a friend
 * @param {string} friendId - The friend's Firebase UID
 * @param {Object} friendData - The friend's profile data
 * @param {string} friendshipId - The Firebase document ID of the friendship
 * @returns {HTMLElement} The created card element
 */
function createFriendCard(friendId, friendData, friendshipId) {
    console.log("Creating friend card for:", friendshipId);
    
    const div = document.createElement('div');
    div.className = 'col-md-6 mb-3';
    // Create card HTML with friend's profile information
    div.innerHTML = `
        <div class="card friend-card">
            <div class="card-body">
                <div class="d-flex align-items-start">
                    <div class="friend-profile-img">
                        <img src="${friendData.profileImage || '/images/default-avatar.png'}" 
                             alt="Profile" class="rounded-circle">
                    </div>
                    <div class="friend-info flex-grow-1 ms-3">
                        <h5 class="card-title">${friendData.name || 'Anonymous User'}</h5>
                        <p class="card-text text-muted">${friendData.email}</p>
                        
                        <div class="profile-details mt-3">
                            <p class="card-text profile-bio">${friendData.bio || 'No bio available'}</p>
                            
                            ${friendData.hobbies ? `
                            <div class="hobbies-section">
                                <h6 class="text-muted">Hobbies</h6>
                                <p class="card-text hobbies">${friendData.hobbies}</p>
                            </div>` : ''}
                            
                            ${friendData.location ? `
                            <div class="location-section">
                                <h6 class="text-muted">Location</h6>
                                <p class="card-text location">${friendData.location}</p>
                            </div>` : ''}
                            
                            ${friendData.interests ? `
                            <div class="interests-section">
                                <h6 class="text-muted">Interests</h6>
                                <div class="interests-tags">
                                    ${friendData.interests.map(interest => 
                                        `<span class="badge bg-light text-dark">${interest}</span>`
                                    ).join(' ')}
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="card-actions mt-3">
                    <button onclick="removeFriend('${friendshipId}')" class="btn btn-danger remove-friend-btn">
                        Remove Friend
                    </button>
                </div>
            </div>
        </div>
    `;
    return div;
}

/**
 * Remove a friend (delete friendship)
 * This function is attached to the global window object to be accessible from HTML onclick
 * @param {string} friendshipId - The Firebase document ID of the friendship to delete
 */
window.removeFriend = function(friendshipId) {
    console.log("Attempting to remove friendship:", friendshipId);
    
    if (confirm('Are you sure you want to remove this friend?')) {
        // Delete friendship document from Firestore
        firebase.firestore().collection('friendships').doc(friendshipId).delete()
            .then(() => {
                console.log("Friendship successfully deleted");
                alert('Friend removed successfully!');
                loadFriendsList(); // Reload friends list to reflect removal
            })
            .catch((error) => {
                console.error("Error removing friend:", error);
                alert('Error removing friend: ' + error.message);
            });
    }
}