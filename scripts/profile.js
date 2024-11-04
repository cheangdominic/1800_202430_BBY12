

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