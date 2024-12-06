// Global variable to store the currently logged in user
// This variable is used throughout the application to identify the current user's context
let currentUser;

// Authentication state observer
// Monitors changes in authentication state and redirects to login if not authenticated
// Also initializes friend-related functionality when a user is authenticated
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user;
        loadFriendsList(); // Load friends list when user is authenticated
        loadFriendRequests(); // Load pending friend requests
    } else {
        window.location.href = 'login.html'; // Redirect to login if not authenticated
    }
});

// Event listeners for search functionality
// Handles both button click and Enter key press for user search
document.getElementById('searchButton').addEventListener('click', searchUsers);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchUsers();
    }
});

/**
 * Search for users by email in Firebase
 * Performs a direct email match search in the users collection
 * Displays search results with appropriate friendship status buttons
 * Handles empty results and error cases
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
 * Check if there's an existing friendship or pending request
 * Performs three separate checks:
 * 1. Existing friendship between users
 * 2. Pending friend request sent by current user
 * 3. Pending friend request received from target user
 * Returns relationship status as 'friend', 'pending', 'received', or 'none'
 */
async function checkExistingRelationship(targetUserId, userData) {
    const friendshipsSnapshot = await firebase.firestore().collection('friendships')
        .where('users', 'array-contains', currentUser.uid)
        .get();
    
    const requestsSnapshot = await firebase.firestore().collection('friendRequests')
        .where('senderId', '==', currentUser.uid)
        .where('receiverId', '==', targetUserId)
        .get();

    const receivedRequestSnapshot = await firebase.firestore().collection('friendRequests')
        .where('senderId', '==', targetUserId)
        .where('receiverId', '==', currentUser.uid)
        .get();

    if (!friendshipsSnapshot.empty) {
        const isFriend = friendshipsSnapshot.docs.some(doc => 
            doc.data().users.includes(targetUserId));
        if (isFriend) return 'friend';
    }

    if (!requestsSnapshot.empty) return 'pending';
    if (!receivedRequestSnapshot.empty) return 'received';
    
    return 'none';
}

/**
 * Create a card element for a user search result with appropriate button
 * Generates HTML for user card displaying:
 * - Profile image
 * - User name and email
 * - Bio and hobbies
 * - Dog information if available
 * - Action button based on relationship status
 * Handles different button states: Already Friends, Request Pending, Accept/Decline, Send Request
 */
function createUserSearchCard(userId, userData, relationshipStatus) {
    const div = document.createElement('div');
    div.className = 'card mb-3';
    
    // Define button HTML based on relationship status
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
                <div class="dog-info mt-2">
                    ${userData.dogName ? `
                    <p class="card-text">
                        <small class="text-muted">🐕 Dog: ${userData.dogName}</small>
                    </p>` : ''}
                </div>
            </div>
            ${buttonHTML}
        </div>
    `;

    if (relationshipStatus === 'none') {
        div.querySelector('.send-request-btn').addEventListener('click', () => sendFriendRequest(userId));
    }

    return div;
}

/**
 * Send a friend request with fixed queries
 * Implements a complex transaction that:
 * 1. Checks for existing friendship
 * 2. Verifies no pending requests exist in either direction
 * 3. Cleans up old requests
 * 4. Creates new friend request
 * 5. Creates notification for receiver
 * Includes error handling and UI feedback
 */
async function sendFriendRequest(receiverId) {
    try {
        await firebase.firestore().runTransaction(async (transaction) => {
            // Check existing friendships
            const friendshipsQuery = await firebase.firestore()
                .collection('friendships')
                .where('users', 'array-contains', currentUser.uid)
                .get();
            
            let activeFriendship = false;
            friendshipsQuery.forEach(doc => {
                if (doc.data().users.includes(receiverId)) {
                    activeFriendship = true;
                }
            });

            if (activeFriendship) {
                throw new Error('Already friends with this user');
            }

            // Check sent requests
            const sentRequestQuery = await firebase.firestore()
                .collection('friendRequests')
                .where('senderId', '==', currentUser.uid)
                .where('receiverId', '==', receiverId)
                .where('status', '==', 'pending')
                .get();

            if (!sentRequestQuery.empty) {
                throw new Error('Friend request already sent');
            }

            // Check received requests
            const receivedRequestQuery = await firebase.firestore()
                .collection('friendRequests')
                .where('senderId', '==', receiverId)
                .where('receiverId', '==', currentUser.uid)
                .where('status', '==', 'pending')
                .get();

            if (!receivedRequestQuery.empty) {
                throw new Error('This user has already sent you a friend request');
            }

            // Clean up old requests - split into two queries
            const oldSentRequestsQuery = await firebase.firestore()
                .collection('friendRequests')
                .where('senderId', '==', currentUser.uid)
                .where('receiverId', '==', receiverId)
                .get();

            const oldReceivedRequestsQuery = await firebase.firestore()
                .collection('friendRequests')
                .where('senderId', '==', receiverId)
                .where('receiverId', '==', currentUser.uid)
                .get();

            oldSentRequestsQuery.forEach(doc => {
                if (doc.data().status !== 'pending') {
                    transaction.delete(doc.ref);
                }
            });

            oldReceivedRequestsQuery.forEach(doc => {
                if (doc.data().status !== 'pending') {
                    transaction.delete(doc.ref);
                }
            });

            // Create new friend request
            const requestRef = firebase.firestore().collection('friendRequests').doc();
            const requestData = {
                senderId: currentUser.uid,
                receiverId: receiverId,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            transaction.set(requestRef, requestData);

            // Create notification
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
 * Load and display pending friend requests
 * Sets up real-time listener for friend requests
 * Creates request section if it doesn't exist
 * Updates UI dynamically when new requests arrive
 * Handles error cases and empty states
 */
function loadFriendRequests() {
    const requestsContainer = document.getElementById('friendRequests');
    if (!requestsContainer) {
        // Create friend requests section if it doesn't exist
        const friendRequestsSection = document.createElement('div');
        friendRequestsSection.id = 'friendRequestsSection';
        friendRequestsSection.className = 'mb-4';
        friendRequestsSection.innerHTML = `
            <h4>Friend Requests</h4>
            <div id="friendRequests" class="friend-requests-container"></div>
        `;
        // Insert at the beginning of main content
        const mainContent = document.querySelector('.main-content') || document.body;
        mainContent.insertBefore(friendRequestsSection, mainContent.firstChild);
    }

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

            // Fetch and display each request's data
            snapshot.forEach(async (doc) => {
                const requestData = doc.data();
                try {
                    const senderDoc = await firebase.firestore().collection('users')
                        .doc(requestData.senderId).get();
                    
                    if (senderDoc.exists) {
                        const senderData = senderDoc.data();
                        const requestCard = createRequestCard(requestData.senderId, senderData, doc.id);
                        requestsContainer.appendChild(requestCard);
                    }
                } catch (error) {
                    console.error("Error loading friend request:", error);
                }
            });
        }, (error) => {
            console.error("Error loading friend requests:", error);
            requestsContainer.innerHTML = '<p>Error loading friend requests</p>';
        });
}

/**
 * Create a card element for a friend request
 * Generates HTML for request card showing:
 * - Sender's profile image
 * - Sender's name and email
 * - Dog information if available
 * - Accept/Decline buttons
 * Sets up event listeners for accept/decline actions
 */
function createRequestCard(senderId, senderData, requestId) {
    const div = document.createElement('div');
    div.className = 'card mb-3 friend-request-card';
    div.innerHTML = `
        <div class="card-body">
            <div class="d-flex align-items-center">
                <div class="friend-profile-img">
                    <img src="${senderData.profileImage || '/images/default-avatar.png'}" 
                         alt="Profile" class="rounded-circle">
                </div>
                <div class="friend-info flex-grow-1 ms-3">
                    <h5 class="card-title">${senderData.name || 'Anonymous User'}</h5>
                    <p class="card-text text-muted">${senderData.email}</p>
                    ${senderData.dogName ? `
                    <p class="card-text">
                        <small class="text-muted">🐕 Dog: ${senderData.dogName}</small>
                    </p>` : ''}
                </div>
                <div class="btn-group">
                    <button class="btn btn-success accept-request-btn">Accept</button>
                    <button class="btn btn-danger decline-request-btn">Decline</button>
                </div>
            </div>
        </div>
    `;

    // Add button event listeners
    div.querySelector('.accept-request-btn').addEventListener('click', () => 
        acceptFriendRequest(requestId, senderId));
    div.querySelector('.decline-request-btn').addEventListener('click', () => 
        declineFriendRequest(requestId));

    return div;
}

/**
 * Accept a friend request with fixed queries
 * Implements a transaction that:
 * 1. Verifies request exists
 * 2. Cleans up other requests between the users
 * 3. Creates new friendship
 * 4. Updates request status
 * 5. Creates notification for sender
 * Includes error handling and UI feedback
 */
async function acceptFriendRequest(requestId, senderId) {
    try {
        await firebase.firestore().runTransaction(async (transaction) => {
            // Get the request document
            const requestRef = firebase.firestore().collection('friendRequests').doc(requestId);
            const requestDoc = await transaction.get(requestRef);

            if (!requestDoc.exists) {
                throw new Error('Friend request not found');
            }

            // Clean up other requests - split into two queries
            // Check sent requests
            const sentRequestsQuery = await firebase.firestore()
                .collection('friendRequests')
                .where('senderId', '==', currentUser.uid)
                .where('receiverId', '==', senderId)
                .get();

            // Check received requests
            const receivedRequestsQuery = await firebase.firestore()
                .collection('friendRequests')
                .where('senderId', '==', senderId)
                .where('receiverId', '==', currentUser.uid)
                .get();

            // Delete other requests except the current one being accepted
            sentRequestsQuery.forEach(doc => {
                if (doc.id !== requestId) {
                    transaction.delete(doc.ref);
                }
            });

            receivedRequestsQuery.forEach(doc => {
                if (doc.id !== requestId) {
                    transaction.delete(doc.ref);
                }
            });

            // Create new friendship
            const friendshipRef = firebase.firestore().collection('friendships').doc();
            transaction.set(friendshipRef, {
                users: [currentUser.uid, senderId],
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update request status
            transaction.update(requestRef, { 
                status: 'accepted',
                acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Create notification
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
 * Decline a friend request
 * Updates request status to 'declined'
 * Implements simple transaction to ensure data consistency
 * Includes error handling and UI feedback
 */
async function declineFriendRequest(requestId) {
    try {
        await firebase.firestore().runTransaction(async (transaction) => {
            const requestRef = firebase.firestore().collection('friendRequests').doc(requestId);
            const requestDoc = await transaction.get(requestRef);

            if (!requestDoc.exists) {
                throw new Error('Friend request not found');
            }

            // Update request status
            transaction.update(requestRef, {
                status: 'declined',
                declinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        showToast('Friend request declined');
        loadFriendRequests();
    } catch (error) {
        console.error("Error declining friend request:", error);
        showToast('Error declining friend request: ' + error.message, 'error');
    }
}

/**
 * Load and display the current user's friends list
 * Sets up real-time listener for friendships collection
 * Fetches additional user data for each friend
 * Handles empty states and error cases
 * Creates friend cards with detailed user information
 */

function loadFriendsList() {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '<p>Loading friends...</p>';

    firebase.firestore().collection('friendships')
        .where('users', 'array-contains', currentUser.uid)
        .onSnapshot((querySnapshot) => {
            friendsList.innerHTML = '';
            
            if (querySnapshot.empty) {
                friendsList.innerHTML = '<p>No friends yet</p>';
                return;
            }

            const friendPromises = [];
            querySnapshot.forEach((doc) => {
                const friendshipData = doc.data();
                const friendId = friendshipData.users.find(id => id !== currentUser.uid);
                
                const friendPromise = firebase.firestore().collection('users').doc(friendId).get()
                    .then((friendDoc) => {
                        if (friendDoc.exists) {
                            return {
                                friendId: friendId,
                                friendData: friendDoc.data(),
                                friendshipId: doc.id,
                                friendshipDate: friendshipData.timestamp
                            };
                        }
                    });
                friendPromises.push(friendPromise);
            });

            Promise.all(friendPromises).then((friends) => {
                friends.forEach((friend) => {
                    if (friend) {
                        const friendCard = createFriendCard(friend.friendId, friend.friendData, 
                            friend.friendshipId, friend.friendshipDate);
                        friendsList.appendChild(friendCard);
                    }
                });
            });
        });
}

/**
 * Create a card element for a friend
 * Generates comprehensive friend card showing:
 * - Profile image and basic info
 * - Friendship duration
 * - Detailed profile information (bio, dog info, hobbies, location, interests)
 * - Action buttons (Message, Schedule Park Meetup, Remove Friend)
 * Uses Bootstrap classes for responsive layout
 */
function createFriendCard(friendId, friendData, friendshipId, friendshipDate) {
    const div = document.createElement('div');
    div.className = 'col-md-6 mb-3';
    
    const friendshipDateStr = friendshipDate ? 
        `Friends since ${friendshipDate.toDate().toLocaleDateString()}` : '';
    
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
                        <p class="card-text"><small class="text-muted">${friendshipDateStr}</small></p>
                        
                        <div class="profile-details mt-3">
                            <p class="card-text profile-bio">${friendData.bio || 'No bio available'}</p>
                            
                            ${friendData.dogName ? `
                            <div class="dog-section">
                                <h6 class="text-muted">Dog</h6>
                                <p class="card-text">🐕 ${friendData.dogName}</p>
                            </div>` : ''}
                            
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
                    <button onclick="showMessageModal('${friendId}')" 
                            class="btn btn-primary friend-action-btn">
                        <i class='bx bx-message-rounded'></i> Message
                    </button>
                    <button onclick="showParkMeetupModal('${friendId}')" 
                            class="btn btn-success friend-action-btn">
                        <i class='bx bx-calendar'></i> Schedule Park Meetup
                    </button>
                    <button onclick="removeFriend('${friendshipId}')" 
                            class="btn btn-danger friend-action-btn">
                        <i class='bx bx-user-x'></i> Remove Friend
                    </button>
                </div>
            </div>
        </div>
    `;
    return div;
}

/**
 * Remove a friend with fixed cleanup
 * Implements a transaction that:
 * 1. Verifies friendship exists
 * 2. Deletes the friendship document
 * 3. Cleans up all friend requests between users
 * 4. Creates removal notification
 * Includes confirmation dialog and error handling
 */
async function removeFriend(friendshipId) {
    if (!confirm('Are you sure you want to remove this friend?')) {
        return;
    }

    try {
        await firebase.firestore().runTransaction(async (transaction) => {
            // Get the friendship document
            const friendshipRef = firebase.firestore().collection('friendships').doc(friendshipId);
            const friendshipDoc = await transaction.get(friendshipRef);
            
            if (!friendshipDoc.exists) {
                throw new Error('Friendship not found');
            }

            const friendshipData = friendshipDoc.data();
            const removedFriendId = friendshipData.users.find(id => id !== currentUser.uid);

            // Delete the friendship
            transaction.delete(friendshipRef);

            // Clean up friend requests - split into two queries
            const sentRequestsQuery = await firebase.firestore()
                .collection('friendRequests')
                .where('senderId', '==', currentUser.uid)
                .where('receiverId', '==', removedFriendId)
                .get();

            const receivedRequestsQuery = await firebase.firestore()
                .collection('friendRequests')
                .where('senderId', '==', removedFriendId)
                .where('receiverId', '==', currentUser.uid)
                .get();

            // Delete all found requests
            sentRequestsQuery.forEach(doc => {
                transaction.delete(doc.ref);
            });

            receivedRequestsQuery.forEach(doc => {
                transaction.delete(doc.ref);
            });

            // Add removal notification
            const notificationRef = firebase.firestore().collection('notifications').doc();
            transaction.set(notificationRef, {
                userId: removedFriendId,
                type: 'friendRemoved',
                removerId: currentUser.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });
        });

        showToast('Friend removed successfully');
        loadFriendsList();
    } catch (error) {
        console.error("Error removing friend:", error);
        showToast('Error removing friend: ' + error.message, 'error');
    }
}

/**
 * Show toast notification
 * Creates toast container if it doesn't exist
 * Supports success and error message types
 * Auto-hides after 3 seconds
 * Removes toast element after hiding
 */
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Create toast container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`;
    toast.innerHTML = `
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

/**
 * Show message modal for direct messaging
 * Creates modal if it doesn't exist
 * Provides interface for sending direct messages to friends
 * Uses Bootstrap modal component
 */
function showMessageModal(friendId) {
    // Create modal if it doesn't exist
    let messageModal = document.getElementById('messageModal');
    if (!messageModal) {
        const modalHTML = `
            <div class="modal fade" id="messageModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Send Message</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <textarea id="messageText" class="form-control" 
                                    rows="4" placeholder="Write your message..."></textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" 
                                    data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" 
                                    onclick="sendMessage('${friendId}')">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        messageModal = document.getElementById('messageModal');
    }

    const modal = new bootstrap.Modal(messageModal);
    modal.show();
}

/**
 * Show park meetup scheduling modal
 * Creates modal if it doesn't exist
 * Provides interface for scheduling park meetups
 * Loads nearby parks list
 * Uses Bootstrap modal component
 */
function showParkMeetupModal(friendId) {
    // Create modal if it doesn't exist
    let meetupModal = document.getElementById('meetupModal');
    if (!meetupModal) {
        const modalHTML = `
            <div class="modal fade" id="meetupModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Schedule Park Meetup</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Date and Time</label>
                                <input type="datetime-local" id="meetupDateTime" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Park Location</label>
                                <select id="parkLocation" class="form-select">
                                    <option value="">Select a park...</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Notes</label>
                                <textarea id="meetupNotes" class="form-control" 
                                        rows="3" placeholder="Any additional notes..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" 
                                    data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-success" 
                                    onclick="scheduleMeetup('${friendId}')">Schedule</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        meetupModal = document.getElementById('meetupModal');
        
        // Load nearby parks (example implementation)
        loadNearbyParks();
    }

    const modal = new bootstrap.Modal(meetupModal);
    modal.show();
}

/**
 * Load nearby parks for meetup scheduling
 * Currently uses dummy data for demonstration
 * In production, this would integrate with a maps API
 * Populates the park selection dropdown
 */
function loadNearbyParks() {
    // This would typically use a maps API to get nearby parks
    // For now, we'll use dummy data
    const dummyParks = [
        { id: 1, name: "Central Dog Park" },
        { id: 2, name: "Riverside Dog Run" },
        { id: 3, name: "Paw Park" },
        { id: 4, name: "Happy Tails Park" }
    ];

    const parkSelect = document.getElementById('parkLocation');
    dummyParks.forEach(park => {
        const option = document.createElement('option');
        option.value = park.id;
        option.textContent = park.name;
        parkSelect.appendChild(option);
    });
}

/**
 * Schedule a park meetup with a friend
 * Validates required fields (datetime and park)
 * Creates meetup document in Firestore
 * Sends notification to friend
 * Includes error handling and UI feedback
 */
function scheduleMeetup(friendId) {
    const dateTime = document.getElementById('meetupDateTime').value;
    const parkId = document.getElementById('parkLocation').value;
    const notes = document.getElementById('meetupNotes').value;

    if (!dateTime || !parkId) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const meetupData = {
        creatorId: currentUser.uid,
        friendId: friendId,
        dateTime: new Date(dateTime),
        parkId: parkId,
        notes: notes,
        status: 'pending',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    firebase.firestore().collection('meetups').add(meetupData)
        .then(() => {
            // Send notification to friend
            return firebase.firestore().collection('notifications').add({
                userId: friendId,
                type: 'meetupInvite',
                meetupDetails: meetupData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });
        })
        .then(() => {
            showToast('Meetup invitation sent!');
            bootstrap.Modal.getInstance(document.getElementById('meetupModal')).hide();
        })
        .catch((error) => {
            console.error("Error scheduling meetup:", error);
            showToast('Error scheduling meetup', 'error');
        });
}

/**
 * Send a direct message to a friend
 * Validates message content
 * Creates message document in Firestore
 * Includes error handling and UI feedback
 * Automatically closes modal on successful send
 */
function sendMessage(friendId) {
    const messageText = document.getElementById('messageText').value.trim();
    if (!messageText) {
        showToast('Please enter a message', 'error');
        return;
    }

    const messageData = {
        senderId: currentUser.uid,
        receiverId: friendId,
        text: messageText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    };

    firebase.firestore().collection('messages').add(messageData)
        .then(() => {
            showToast('Message sent!');
            bootstrap.Modal.getInstance(document.getElementById('messageModal')).hide();
        })
        .catch((error) => {
            console.error("Error sending message:", error);
            showToast('Error sending message', 'error');
        });
}

/**
 * Check existing relationship between users
 * Comprehensive check for:
 * - Existing friendship
 * - Pending sent request
 * - Pending received request
 * Returns relationship status: 'friend', 'pending', 'received', or 'none'
 * Includes error handling
 */
async function checkExistingRelationship(targetUserId) {
    try {
        // Check friendships
        const friendshipsSnapshot = await firebase.firestore().collection('friendships')
            .where('users', 'array-contains', currentUser.uid)
            .get();
        
        if (!friendshipsSnapshot.empty) {
            const isFriend = friendshipsSnapshot.docs.some(doc => 
                doc.data().users.includes(targetUserId));
            if (isFriend) return 'friend';
        }

        // Check sent requests
        const sentRequestSnapshot = await firebase.firestore().collection('friendRequests')
            .where('senderId', '==', currentUser.uid)
            .where('receiverId', '==', targetUserId)
            .where('status', '==', 'pending')
            .get();

        if (!sentRequestSnapshot.empty) return 'pending';

        // Check received requests
        const receivedRequestSnapshot = await firebase.firestore().collection('friendRequests')
            .where('senderId', '==', targetUserId)
            .where('receiverId', '==', currentUser.uid)
            .where('status', '==', 'pending')
            .get();

        if (!receivedRequestSnapshot.empty) return 'received';
        
        return 'none';
    } catch (error) {
        console.error("Error checking relationship:", error);
        throw error;
    }
}