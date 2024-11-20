// Initialize global variables
let currentUser;

// Monitor authentication state and redirect to login page if not authenticated
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        currentUser = user;
        loadFriendRequests();
        loadFriends();
    } else {
        window.location.href = 'login.html';
    }
});

/**
 * Function to load and display friend requests
 * - Retrieves pending friend requests
 * - Gets profile information for each request sender
 * - Adds request cards to the DOM
 */
function loadFriendRequests() {
    const requestsContainer = document.getElementById('friendRequests');
    
    db.collection('friendRequests')
        .where('to', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .onSnapshot((snapshot) => {
            requestsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                requestsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class='bx bx-user-plus'></i>
                        <p>No pending friend requests</p>
                    </div>
                `;
                return;
            }

            snapshot.forEach((doc) => {
                const request = doc.data();
                db.collection('profiles').doc(request.from).get().then((senderDoc) => {
                    const sender = senderDoc.data();
                    const requestHtml = `
                        <div class="friend-request-card">
                            <div class="request-profile">
                                <img src="${sender.profilePicture || './styles/images/defaultprofile.png'}" 
                                     alt="Profile picture"
                                     onerror="this.src='./styles/images/defaultprofile.png'">
                                <div class="request-info">
                                    <h3>${sender.name || 'Anonymous'}</h3>
                                    <p>Wants to be your friend</p>
                                </div>
                            </div>
                            <div class="request-actions">
                                <button class="accept-btn" onclick="acceptFriendRequest('${doc.id}', '${request.from}')">
                                    Accept
                                </button>
                                <button class="decline-btn" onclick="declineFriendRequest('${doc.id}')">
                                    Decline
                                </button>
                            </div>
                        </div>
                    `;
                    requestsContainer.insertAdjacentHTML('beforeend', requestHtml);
                });
            });
        });
}

/**
 * Function to load and display friends list
 * - Retrieves friend information related to current user
 * - Gets profile information for each friend
 * - Adds friend cards to the DOM
 */
function loadFriends() {
    const friendsContainer = document.getElementById('friendsList');
    
    db.collection('friends')
        .where('users', 'array-contains', currentUser.uid)
        .onSnapshot((snapshot) => {
            friendsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                friendsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class='bx bx-user'></i>
                        <p>No friends yet</p>
                    </div>
                `;
                return;
            }

            snapshot.forEach((doc) => {
                const friendship = doc.data();
                const friendId = friendship.users.find(id => id !== currentUser.uid);
                
                db.collection('profiles').doc(friendId).get().then((friendDoc) => {
                    const friend = friendDoc.data();
                    const friendHtml = `
                        <div class="friend-card" onclick="openChat('${friendId}')">
                            <div class="friend-profile">
                                <img src="${friend.profilePicture || './styles/images/defaultprofile.png'}" 
                                     alt="Profile picture"
                                     onerror="this.src='./styles/images/defaultprofile.png'">
                                <div class="friend-info">
                                    <h3>${friend.name || 'Anonymous'}</h3>
                                    <p class="status ${friend.online ? 'online' : ''}">
                                        ${friend.online ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                    friendsContainer.insertAdjacentHTML('beforeend', friendHtml);
                });
            });
        });
}

/**
 * Function to send friend request
 * - Searches for user by email
 * - Checks for existing friendship or request
 * - Creates new friend request
 */
async function sendFriendRequest() {
    const friendEmail = document.getElementById('friendEmail').value.trim();
    if (!friendEmail) {
        alert('Please enter an email address');
        return;
    }

    try {
        const userQuerySnapshot = await db.collection('users')
            .where('email', '==', friendEmail)
            .get();

        if (userQuerySnapshot.empty) {
            alert('User not found');
            return;
        }

        const friendData = userQuerySnapshot.docs[0];
        const friendId = friendData.id;

        // Prevent self-friend request
        if (friendId === currentUser.uid) {
            alert('You cannot send a friend request to yourself');
            return;
        }

        // Check existing friendship
        const existingFriendship = await db.collection('friends')
            .where('users', 'array-contains', currentUser.uid)
            .get();

        let isAlreadyFriend = false;
        existingFriendship.forEach(doc => {
            if (doc.data().users.includes(friendId)) {
                isAlreadyFriend = true;
            }
        });

        if (isAlreadyFriend) {
            alert('You are already friends with this user');
            return;
        }

        // Check existing request
        const existingRequest = await db.collection('friendRequests')
            .where('from', '==', currentUser.uid)
            .where('to', '==', friendId)
            .where('status', '==', 'pending')
            .get();

        if (!existingRequest.empty) {
            alert('Friend request already sent');
            return;
        }

        // Create friend request
        await db.collection('friendRequests').add({
            from: currentUser.uid,
            to: friendId,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        $('#addFriendModal').modal('hide');
        document.getElementById('friendEmail').value = '';
        alert('Friend request sent successfully!');

    } catch (error) {
        console.error('Error sending friend request:', error);
        alert('Error sending friend request. Please try again.');
    }
}

/**
 * Function to accept friend request
 * - Creates friendship document
 * - Updates request status
 */
async function acceptFriendRequest(requestId, friendId) {
    try {
        await db.collection('friends').add({
            users: [currentUser.uid, friendId],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('friendRequests').doc(requestId).update({
            status: 'accepted'
        });

        console.log('Friend request accepted successfully');
    } catch (error) {
        console.error('Error accepting friend request:', error);
        alert('Error accepting friend request. Please try again.');
    }
}

/**
 * Function to decline friend request
 * - Updates request status to 'declined'
 */
async function declineFriendRequest(requestId) {
    try {
        await db.collection('friendRequests').doc(requestId).update({
            status: 'declined'
        });

        console.log('Friend request declined successfully');
    } catch (error) {
        console.error('Error declining friend request:', error);
        alert('Error declining friend request. Please try again.');
    }
}

/**
 * Function to open chat page
 * - Saves friend ID to local storage
 * - Navigates to chat page
 */
function openChat(friendId) {
    localStorage.setItem('currentChatFriend', friendId);
    window.location.href = 'chat.html';
}

/**
 * Function to search friends
 * - Performs partial match search by name
 * - Hides friend cards that don't match
 */
function searchFriends(searchTerm) {
    const friendCards = document.querySelectorAll('.friend-card');
    friendCards.forEach(card => {
        const name = card.querySelector('.friend-info h3').textContent.toLowerCase();
        if (name.includes(searchTerm.toLowerCase())) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Set up search event listener
document.getElementById('friendSearch')?.addEventListener('input', (e) => {
    searchFriends(e.target.value);
});

/**
 * Function to show add friend modal
 */
function showAddFriendModal() {
    $('#addFriendModal').modal('show');
}

// Expose functions to global scope
window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.openChat = openChat;
window.showAddFriendModal = showAddFriendModal;

/**
 * Function to update online status
 * - Updates user's online status and lastSeen
 */
function updateOnlineStatus(isOnline) {
    if (!currentUser) return;

    db.collection('profiles').doc(currentUser.uid).update({
        online: isOnline,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
}

/**
 * Function to set up presence system
 * - Uses both Firestore and Realtime Database
 * - Automatically tracks online/offline status
 */
let presenceRef;
function setupPresence() {
    const uid = currentUser.uid;
    
    presenceRef = db.collection('status').doc(uid);
    
    const isOfflineForFirestore = {
        state: 'offline',
        lastChanged: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const isOnlineForFirestore = {
        state: 'online',
        lastChanged: firebase.firestore.FieldValue.serverTimestamp(),
    };

    firebase.database().ref('.info/connected').on('value', function(snapshot) {
        if (snapshot.val() == false) {
            presenceRef.set(isOfflineForFirestore);
            return;
        }

        presenceRef.set(isOnlineForFirestore);
    });
}

/**
 * Function to show profile preview
 * - Gets user's profile information
 * - Displays profile information in modal
 */
function showProfilePreview(userId) {
    const previewModal = new bootstrap.Modal(document.getElementById('profilePreviewModal'));
    
    db.collection('profiles').doc(userId).get().then(doc => {
        if (doc.exists) {
            const profile = doc.data();
            document.getElementById('previewName').textContent = profile.name;
            document.getElementById('previewImage').src = profile.profilePicture || './styles/images/defaultprofile.png';
            document.getElementById('previewBio').textContent = profile.bio || 'No bio available';
        }
    });
}

/**
 * Function to remove friend
 * - Shows confirmation dialog
 * - Deletes friendship document
 */
async function removeFriend(friendId) {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
        const friendshipQuery = await db.collection('friends')
            .where('users', 'array-contains', currentUser.uid)
            .get();

        friendshipQuery.forEach(async (doc) => {
            if (doc.data().users.includes(friendId)) {
                await doc.ref.delete();
            }
        });

        bootstrap.Modal.getInstance(document.getElementById('profilePreviewModal')).hide();
        
    } catch (error) {
        console.error('Error removing friend:', error);
        alert('Error removing friend. Please try again.');
    }
}

/**
 * Function to filter friends list
 * - Filters by online status or recent messages
 * - Updates filter button states
 */
function filterFriends(filter) {
    const friendCards = document.querySelectorAll('.friend-card');
    
    friendCards.forEach(card => {
        switch(filter) {
            case 'online':
                card.style.display = card.querySelector('.status.online') ? 'flex' : 'none';
                break;
            case 'recent':
                break;
            default:
                card.style.display = 'flex';
        }
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.onclick.toString().includes(filter));
    });
}

let activityTimeout;

/**
 * Function to update user activity
 * - Updates last active timestamp
 * - Resets inactivity timer
 */
function updateUserActivity() {
    if (!currentUser) return;
    
    clearTimeout(activityTimeout);
    
    db.collection('profiles').doc(currentUser.uid).update({
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    activityTimeout = setTimeout(() => {
        updateOnlineStatus(false);
    }, 300000); // 5 minutes
}

// Set up user activity event listeners