const db = firebase.firestore();

function displayMessage() {
    const messageContainer = document.getElementById('messageContainer');
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (messageText) {
        const newMessage = document.createElement('div');
        newMessage.classList.add('message', 'sent');
        newMessage.textContent = messageText;
        messageContainer.prepend(newMessage); 
        messageInput.value = ''; 
    }
}
function sendMessage(senderId, receiverId, messageContent){
    const chatId = `${senderID}_${receiverID}`;
    const newMessage = {
        sender: senderId,
        receiver: receiverId,
        content: messageContent,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
};
}
db.collection("messages").doc(chatId).get().then((doc) => {
    if(doc.exits){
        db.collection("messages").doc(chatId).update({
            messages: firebase.firestore.FieldValue.arrayUnion(newMessage)
        }
    else{
        // If the chat document doesn't exist, create it with initial message
        db.collection("messages").doc(chatId).set({
            user0: senderId,
            user1: receiverId,
            messages: [newMessage]
        });
    } else {
        console.error("Error adding message: ", error);
    };
}.

function getMessages(user0, user1){
    const chatId = `${user0}_${user1}`;
    db.collection("messages").doc(chatId).get().then((doc) => {
        if (doc.exists) {
            const chatData = doc.data();
            console.log("Messages:", chatData.messages);
            // Display messages in the UI as needed
        } else {
            console.log("No messages found between these users.");
        }
    }).catch((error) => {
        console.error("Error retrieving messages: ", error);
    });
}     

