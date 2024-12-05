/**
 * Global Variables and Authentication Setup
 * - Maintains current user state
 * - Handles authentication flow
 */
let currentUser;

// Authentication state observer
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user;
        loadFriendsList(); // Initialize friends list
        loadFriendRequests(); // Initialize friend requests
    } else {
        window.location.href = 'login.html'; // Redirect if not authenticated
    }
});

/**
 * Event Listeners Setup
 * - Handles search functionality
 * - Manages user interactions
 */
document.getElementById('searchButton').addEventListener('click', searchUsers);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchUsers();
    }
});

/**
 * Search Users Function
 * Searches for users by email in Firebase
 * - Queries Firestore users collection
 * - Excludes current user from results
 * - Checks existing relationships
 */
function searchUsers() {
    const searchEmail = document.getElementById('searchInput').value.trim();
    if (!searchEmail) return;

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<p>Searching...</p>';

    firebase.firestore().collection('users')
        .where('email', '==', searchEmail)
        .get()
        .then((querySnapshot) => {
            searchResults.innerHTML = '';
            
            if (querySnapshot.empty) {
                searchResults.innerHTML = '<p>No users found</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                if (doc.id !== currentUser.uid) {
                    checkExistingRelationship(doc.id, userData)
                        .then(relationshipStatus => {
                            const userCard = createUserSearchCard(doc.id, userData, relationshipStatus);
                            searchResults.appendChild(userCard);
                        });
                }
            });
        })
        .catch((error) => {
            console.error("Error searching users: ", error);
            searchResults.innerHTML = '<p>Error searching users</p>';
        });
}

/**
 * Relationship Check Function
 * Checks existing relationship status between users
 * @param {string} targetUserId - ID of the target user
 * @param {Object} userData - User data object
 * @returns {Promise<string>} - Returns 'friend', 'pending', 'received', or 'none'
 */
async function checkExistingRelationship(targetUserId, userData) {
    try {
        // Check friendships first
        const friendshipsSnapshot = await firebase.firestore().collection('friendships')
            .where('users', 'array-contains', currentUser.uid)
            .get();
        
        if (!friendshipsSnapshot.empty) {
            const isFriend = friendshipsSnapshot.docs.some(doc => 
                doc.data().users.includes(targetUserId));
            if (isFriend) return 'friend';
        }

        // Check sent friend requests
        const requestsSnapshot = await firebase.firestore().collection('friendRequests')
            .where('senderId', '==', currentUser.uid)
            .where('receiverId', '==', targetUserId)
            .get();

        // Check received friend requests
        const receivedRequestSnapshot = await firebase.firestore().collection('friendRequests')
            .where('senderId', '==', targetUserId)
            .where('receiverId', '==', currentUser.uid)
            .get();

        if (!requestsSnapshot.empty) return 'pending';
        if (!receivedRequestSnapshot.empty) return 'received';
        
        return 'none';
    } catch (error) {
        console.error("Error checking relationship:", error);
        throw error;
    }
}

/**
 * User Search Card Creation
 * Creates a card element for displaying user search results
 * @param {string} userId - User ID
 * @param {Object} userData - User profile data
 * @param {string} relationshipStatus - Current relationship status
 * @returns {HTMLElement} - Returns card element
 */
function createUserSearchCard(userId, userData, relationshipStatus) {
    const div = document.createElement('div');
    div.className = 'card mb-3';
    
    // Determine appropriate button based on relationship status
    let buttonHTML = '';
    switch (relationshipStatus) {
        case 'friend':
            buttonHTML = `<button class="btn btn-secondary" disabled>Already Friends</button>`;
            break;
        case 'pending':
            buttonHTML = `<button class="btn btn-secondary" disabled>Request Pending</button>`;
            break;
        case 'received':
            buttonHTML = `
                <div class="btn-group">
                    <button class="btn btn-success" onclick="acceptFriendRequest('${userId}')">Accept</button>
                    <button class="btn btn-danger" onclick="declineFriendRequest('${userId}')">Decline</button>
                </div>`;
            break;
        default:
            buttonHTML = `<button class="btn btn-primary send-request-btn" data-userid="${userId}">Send Friend Request</button>`;
    }

    // Create card content with user information
    div.innerHTML = `/* HTML content */`;

    if (relationshipStatus === 'none') {
        div.querySelector('.send-request-btn').addEventListener('click', () => sendFriendRequest(userId));
    }

    return div;
}

/**
 * Send Friend Request Function
 * Handles the friend request sending process with transaction safety
 * @param {string} receiverId - ID of the request recipient
 */
async function sendFriendRequest(receiverId) {
    try {
        await firebase.firestore().runTransaction(async (transaction) => {
            // Verify no existing friendship
            const friendshipsQuery = await firebase.firestore()
                .collection('friendships')
                .where('users', 'array-contains', currentUser.uid)
                .get();
            
            // Various validation checks
            let activeFriendship = false;
            friendshipsQuery.forEach(doc => {
                if (doc.data().users.includes(receiverId)) {
                    activeFriendship = true;
                }
            });

            if (activeFriendship) {
                throw new Error('Already friends with this user');
            }

            // Create new friend request document
            const requestRef = firebase.firestore().collection('friendRequests').doc();
            const requestData = {
                senderId: currentUser.uid,
                receiverId: receiverId,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            transaction.set(requestRef, requestData);

            // Create notification for recipient
            const notificationRef = firebase.firestore().collection('notifications').doc();
            transaction.set(notificationRef, {
                userId: receiverId,
                type: 'friendRequest',
                senderId: currentUser.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });
        });

        showToast('Friend request sent successfully!');
        searchUsers(); // Refresh search results
    } catch (error) {
        console.error("Error sending friend request:", error);
        showToast(error.message, 'error');
    }
}

/**
 * Load Friend Requests Function
 * Fetches and displays pending friend requests in real-time
 */
function loadFriendRequests() {
    const requestsContainer = document.getElementById('friendRequests');
    
    // Real-time listener for friend requests
    firebase.firestore().collection('friendRequests')
        .where('receiverId', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .onSnapshot((snapshot) => {
            const requestsContainer = document.getElementById('friendRequests');
            requestsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                requestsContainer.innerHTML = '<p>No pending friend requests</p>';
                return;
            }

            // Process each request
            snapshot.forEach(async (doc) => {
                const requestData = doc.data();
                try {
                    const senderDoc = await firebase.firestore().collection('users')
                        .doc(requestData.senderId).get();
                    
                    if (senderDoc.exists) {
                        const requestCard = createRequestCard(requestData.senderId, senderDoc.data(), doc.id);
                        requestsContainer.appendChild(requestCard);
                    }
                } catch (error) {
                    console.error("Error loading friend request:", error);
                }
            });
        });
}

/**
 * Create Request Card Function
 * Creates a card element for displaying friend requests
 * @param {string} senderId - ID of request sender
 * @param {Object} senderData - Sender's profile data
 * @param {string} requestId - Friend request document ID
 * @returns {HTMLElement} - Returns request card element
 */
function createRequestCard(senderId, senderData, requestId) {
    const div = document.createElement('div');
    div.className = 'card mb-3 friend-request-card';
    
    // Create card content with sender information and action buttons
    div.innerHTML = `/* HTML content */`;

    // Add event listeners for accept/decline buttons
    div.querySelector('.accept-request-btn').addEventListener('click', () => 
        acceptFriendRequest(requestId, senderId));
    div.querySelector('.decline-request-btn').addEventListener('click', () => 
        declineFriendRequest(requestId));

    return div;
}

/**
 * Accept Friend Request Function
 * Processes the acceptance of a friend request with transaction safety
 * @param {string} requestId - Friend request document ID
 * @param {string} senderId - ID of request sender
 */
async function acceptFriendRequest(requestId, senderId) {
    try {
        await firebase.firestore().runTransaction(async (transaction) => {
            // Various database operations in a single transaction
            const requestRef = firebase.firestore().collection('friendRequests').doc(requestId);
            const requestDoc = await transaction.get(requestRef);

            if (!requestDoc.exists) {
                throw new Error('Friend request not found');
            }

            // Create new friendship document
            const friendshipRef = firebase.firestore().collection('friendships').doc();
            transaction.set(friendshipRef, {
                users: [currentUser.uid, senderId],
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update request status and create notification
            transaction.update(requestRef, { 
                status: 'accepted',
                acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const notificationRef = firebase.firestore().collection('notifications').doc();
            transaction.set(notificationRef, {
                userId: senderId,
                type: 'friendRequestAccepted',
                accepterId: currentUser.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });
        });

        showToast('Friend request accepted!');
        loadFriendsList();
        loadFriendRequests();
    } catch (error) {
        console.error("Error accepting friend request:", error);
        showToast('Error accepting friend request: ' + error.message, 'error');
    }
}

/**
 * Additional utility functions and event handlers...
 * Including:
 * - showMessageModal()
 * - showParkMeetupModal()
 * - scheduleMeetup()
 * - sendMessage()
 * - showToast()
 * All follow similar patterns of documentation and error handling
 */