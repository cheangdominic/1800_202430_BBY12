// Initialize Firebase with your config
function loadSkeleton() {
    $('#navbarPlaceholder').load('./text/nav.html');
    $('#footerPlaceholder').load('./text/footer.html');
}
loadSkeleton();

let currentUser;

// Global variables for new features
let typingTimeout;
let isTyping = false;
const TYPING_TIMER = 3000; // 3 seconds

// Emoji data
const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖']
};

// Initialize emoji picker
function initializeEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    if (!emojiPicker) return;
    
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

// Add emoji to message
function addEmojiToMessage(emoji) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value += emoji;
        messageInput.focus();
    }
}

// Update typing status
async function updateTypingStatus(isTyping) {
    if (!currentUser) return;
    
    try {
        await db.collection('typing').doc(currentUser.uid).set({
            userId: currentUser.uid,
            userName: currentUser.displayName || 'Anonymous',
            isTyping: isTyping,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating typing status:', error);
    }
}

// Listen for typing status
function listenToTypingStatus() {
    db.collection('typing').onSnapshot((snapshot) => {
        const typingUsers = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isTyping && data.userId !== currentUser?.uid) {
                typingUsers.push(data.userName);
            }
        });
        
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            if (typingUsers.length > 0) {
                const typingText = typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...`
                    : `${typingUsers.length} people are typing...`;
                typingIndicator.textContent = typingText;
                typingIndicator.style.display = 'block';
            } else {
                typingIndicator.style.display = 'none';
            }
        }
    });
}

// Function to load messages
function loadMessages() {
    db.collection("messages")
        .orderBy("timestamp")
        .onSnapshot((querySnapshot) => {
            const messageContainer = document.getElementById("messageContainer");
            messageContainer.innerHTML = '';
            
            let currentDate = null;
            
            querySnapshot.forEach((doc) => {
                const message = doc.data();
                const timestamp = message.timestamp?.toDate();
                
                // add line when the date change
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
                
                // show message time
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeEmojiPicker();
    
    // Emoji button click handler
    const emojiButton = document.getElementById('emojiButton');
    if (emojiButton) {
        emojiButton.addEventListener('click', function() {
            const picker = document.getElementById('emojiPicker');
            if (picker) {
                picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        const picker = document.getElementById('emojiPicker');
        const emojiButton = document.getElementById('emojiButton');
        if (picker && emojiButton && !picker.contains(e.target) && !emojiButton.contains(e.target)) {
            picker.style.display = 'none';
        }
    });

    // Add typing indicator handler
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            if (!isTyping) {
                isTyping = true;
                updateTypingStatus(true);
            }
            
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                isTyping = false;
                updateTypingStatus(false);
            }, TYPING_TIMER);
        });
    }
});

// Function to escape HTML
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to send message
function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    const user = firebase.auth().currentUser;
    
    if (!user) {
        alert("Please log in to send messages");
        return;
    }
    
    // Add message to Firestore
    db.collection("messages").add({
        text: message,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        timestamp: firebase.firestore.Timestamp.now()
    })
    .then(() => {
        messageInput.value = '';
        console.log("Message sent successfully");
    })
    .catch((error) => {
        console.error("Error sending message: ", error);
        alert("Failed to send message. Please try again.");
    });
}

// File upload handler
async function handleFileUpload(event) {
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;

    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to upload files");
        return;
    }

    try {
        // Loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-message';
        loadingDiv.textContent = 'Uploading...';
        document.getElementById('messageContainer').appendChild(loadingDiv);

        // Create storage reference
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`uploads/${user.uid}/${Date.now()}_${file.name}`);
        
        // Upload file
        await fileRef.put(file);
        const downloadURL = await fileRef.getDownloadURL();

        // Add message to Firestore
        await db.collection("messages").add({
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            fileUrl: downloadURL,
            fileName: file.name,
            fileType: file.type,
            text: ''
        });

        // Remove loading indicator
        loadingDiv.remove();
        console.log("File uploaded successfully");
    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file. Please try again.");
    }
}

// Make functions globally available
window.sendMessage = sendMessage;
window.handleFileUpload = handleFileUpload;

// Event listeners for message input and file upload
document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const documentUpload = document.getElementById('documentUpload');
    
    if (imageUpload) {
        imageUpload.addEventListener('change', handleFileUpload);
    }
    if (documentUpload) {
        documentUpload.addEventListener('change', handleFileUpload);
    }
});

document.getElementById("imageUpload")?.addEventListener("change", handleFileUpload);
document.getElementById("documentUpload")?.addEventListener("change", handleFileUpload);

// Authentication state observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log("Logged in user:", user.displayName);
        loadMessages();
        listenToTypingStatus();
    } else {
        const messageContainer = document.getElementById("messageContainer");
        messageContainer.innerHTML = '<div class="message">Please log in to use the chat</div>';
        console.log("No user logged in");
    }
});