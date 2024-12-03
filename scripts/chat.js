// Initialize Firebase and load skeleton
function loadSkeleton() {
    $('#navbarPlaceholder').load('./text/nav.html');
    $('#footerPlaceholder').load('./text/footer.html');
}
loadSkeleton();

let currentUser;
const MESSAGE_LIMIT = 50;

// Emoji data structure
const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖']
};

// Initialize emoji picker with categories
function initializeEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    if (!emojiPicker) return;
    
    emojiPicker.innerHTML = '';
    
    Object.entries(emojiCategories).forEach(([category, emojis]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'emoji-category';
        
        const title = document.createElement('div');
        title.className = 'emoji-category-title';
        title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        
        const grid = document.createElement('div');
        grid.className = 'emoji-grid';
        
        emojis.forEach(emoji => {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji-item';
            emojiSpan.textContent = emoji;
            emojiSpan.onclick = () => addEmojiToMessage(emoji);
            grid.appendChild(emojiSpan);
        });
        
        categoryDiv.appendChild(title);
        categoryDiv.appendChild(grid);
        emojiPicker.appendChild(categoryDiv);
    });
}

// Add emoji to message input
function addEmojiToMessage(emoji) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;
        messageInput.value = text.substring(0, start) + emoji + text.substring(end);
        messageInput.focus();
        messageInput.setSelectionRange(start + emoji.length, start + emoji.length);
    }
}

/// Function to load messages
function loadMessages() {
    db.collection("messages")
        .orderBy("timestamp")
        .onSnapshot((querySnapshot) => {
            const messageContainer = document.getElementById("messageContainer");
            if (!messageContainer) return;
            
            messageContainer.innerHTML = '';
            let currentDate = null;
            
            querySnapshot.forEach((doc) => {
                const message = doc.data();
                const timestamp = message.timestamp?.toDate();
                
                // Add date divider
                if (timestamp) {
                    const messageDate = timestamp.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    if (messageDate !== currentDate) {
                        const dateDiv = document.createElement('div');
                        dateDiv.className = 'message-date-divider';
                        dateDiv.innerHTML = `<span>${messageDate}</span>`;
                        messageContainer.appendChild(dateDiv);
                        currentDate = messageDate;
                    }
                }

                const messageDiv = document.createElement("div");
                const isOwnMessage = message.userId === firebase.auth().currentUser.uid;
                
                messageDiv.className = `message ${isOwnMessage ? 'message_right' : 'message_left'}`;
                
                // Get profile picture
                let profilePicture = './styles/images/defaultprofile.png';
                if (isOwnMessage) {
                    const savedPicture = localStorage.getItem("userProfilePicture");
                    if (savedPicture) {
                        profilePicture = savedPicture;
                    }
                } else {
                    // Get other user's profile picture
                    db.collection("profiles")
                        .doc(message.userId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                const userData = doc.data();
                                const userImg = document.querySelector(`[data-user-id="${message.userId}"]`);
                                if (userImg) {
                                    if (userData.profilePicture === "localStorage") {
                                        const localImage = localStorage.getItem(`userProfilePicture_${message.userId}`);
                                        if (localImage) {
                                            userImg.src = localImage;
                                        }
                                    } else if (userData.profilePicture) {
                                        userImg.src = userData.profilePicture;
                                    }
                                }
                            }
                        });
                }

                // Handle file attachments
                let attachmentHTML = '';
                if (message.fileUrl) {
                    if (message.fileType && message.fileType.startsWith('image/')) {
                        attachmentHTML = `
                            <div class="image-attachment">
                                <img src="${message.fileUrl}" alt="Uploaded image" style="max-width: 200px; border-radius: 8px; cursor: pointer;" 
                                     onclick="window.open('${message.fileUrl}', '_blank')">
                            </div>
                        `;
                    } else {
                        attachmentHTML = `
                            <div class="file-attachment" onclick="window.open('${message.fileUrl}', '_blank')" style="cursor: pointer;">
                                <i class='bx bx-file'></i>
                                <span>${message.fileName}</span>
                            </div>
                        `;
                    }
                }
                
                // Show message time
                const timeString = timestamp ? timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : '';
                
                messageDiv.innerHTML = `
                    <img src="${profilePicture}" alt="User Icon" class="user_icon" 
                         data-user-id="${message.userId}"
                         onerror="this.src='./styles/images/defaultprofile.png';">
                    <div class="message_box">
                        <div class="message_content">
                            ${message.text ? escapeHtml(message.text) : ''}
                            ${attachmentHTML}
                            <div class="message_time">
                                ${escapeHtml(message.userName)} - ${timeString}
                            </div>
                        </div>
                    </div>
                `;
                
                messageContainer.appendChild(messageDiv);
            });
            
            messageContainer.scrollTop = messageContainer.scrollHeight;
        });
}

// Load user profile picture
async function loadUserProfilePicture(userId, messageDiv) {
    try {
        const doc = await db.collection("profiles").doc(userId).get();
        if (doc.exists) {
            const userData = doc.data();
            const userImg = messageDiv.querySelector(`[data-user-id="${userId}"]`);
            if (userImg) {
                if (userData.profilePicture === "localStorage") {
                    const localImage = localStorage.getItem(`userProfilePicture_${userId}`);
                    if (localImage) {
                        userImg.src = localImage;
                    }
                } else if (userData.profilePicture) {
                    userImg.src = userData.profilePicture;
                }
            }
        }
    } catch (error) {
        console.error("Error loading profile picture:", error);
    }
}

// Create HTML for image attachments
function createImageAttachment(url) {
    return `
        <div class="image-attachment">
            <img src="${url}" alt="Uploaded image" style="max-width: 200px; border-radius: 8px; cursor: pointer;" 
                 onclick="window.open('${url}', '_blank')">
        </div>
    `;
}

// Create HTML for file attachments
function createFileAttachment(url, fileName) {
    return `
        <div class="file-attachment" onclick="window.open('${url}', '_blank')" style="cursor: pointer;">
            <i class='bx bx-file'></i>
            <span>${fileName}</span>
        </div>
    `;
}

// Modify the sendMessage function
async function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    if (!currentUser) {
        alert("Please log in to send messages");
        return;
    }
    
    try {
        // Disable input and button while sending
        messageInput.disabled = true;
        const sendButton = document.getElementById("sendButton");
        if (sendButton) sendButton.disabled = true;
        
        // Add message to Firestore
        await db.collection("messages").add({
            text: message,
            userId: currentUser.uid,
            userName: currentUser.displayName || 'Anonymous',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        messageInput.value = '';

        // Scroll to bottom
        const messageContainer = document.getElementById("messageContainer");
        messageContainer.scrollTop = messageContainer.scrollHeight;

    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
    } finally {
        // Re-enable input and button
        messageInput.disabled = false;
        const sendButton = document.getElementById("sendButton");
        if (sendButton) sendButton.disabled = false;
        messageInput.focus();
    }
}

// Handle file uploads
async function handleFileUpload(event) {
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;

    if (!currentUser) {
        alert("Please log in to upload files");
        return;
    }

    try {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-message';
        loadingDiv.textContent = 'Uploading...';
        document.getElementById('messageContainer').appendChild(loadingDiv);

        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`uploads/${currentUser.uid}/${Date.now()}_${file.name}`);
        
        await fileRef.put(file);
        const downloadURL = await fileRef.getDownloadURL();

        await db.collection("messages").add({
            userId: currentUser.uid,
            userName: currentUser.displayName || 'Anonymous',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            fileUrl: downloadURL,
            fileName: file.name,
            fileType: file.type,
            text: ''
        });

        loadingDiv.remove();
    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file. Please try again.");
    }
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeEmojiPicker();
    
    // Add message input event listeners
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    // Remove the old event listeners first
    if (messageInput) {
        const oldKeyHandler = messageInput.onkeypress;
        if (oldKeyHandler) {
            messageInput.removeEventListener('keypress', oldKeyHandler);
        }
        
        // Add new event listener
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Remove old click handler
    if (sendButton) {
        const oldClickHandler = sendButton.onclick;
        if (oldClickHandler) {
            sendButton.removeEventListener('click', oldClickHandler);
        }
        
        // Add new click handler
        sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // Remove onclick attribute from send button in HTML
    sendButton?.removeAttribute('onclick');

    // Rest of the event listeners...
});

// Make functions globally available
window.sendMessage = sendMessage;
window.handleFileUpload = handleFileUpload;

// Authentication state observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log("Logged in user:", user.displayName);
        loadMessages();
    } else {
        const messageContainer = document.getElementById("messageContainer");
        messageContainer.innerHTML = '<div class="message">Please log in to use the chat</div>';
        console.log("No user logged in");
    }
});