// グローバル変数の初期化
let currentUser;

// ユーザーの認証状態を監視し、認証されていない場合はログインページにリダイレクト
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
 * フレンドリクエストを読み込んで表示する関数
 * - 保留中のフレンドリクエストを取得
 * - 各リクエストの送信者のプロフィール情報を取得
 * - リクエストカードをDOMに追加
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
 * フレンドリストを読み込んで表示する関数
 * - 現在のユーザーに関連するフレンド情報を取得
 * - 各フレンドのプロフィール情報を取得
 * - フレンドカードをDOMに追加
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
 * フレンドリクエストを送信する関数
 * - メールアドレスからユーザーを検索
 * - 既存の友達関係やリクエストをチェック
 * - 新しいフレンドリクエストを作成
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

        // 自分自身へのリクエスト防止
        if (friendId === currentUser.uid) {
            alert('You cannot send a friend request to yourself');
            return;
        }

        // 既存の友達関係チェック
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

        // 既存のリクエストチェック
        const existingRequest = await db.collection('friendRequests')
            .where('from', '==', currentUser.uid)
            .where('to', '==', friendId)
            .where('status', '==', 'pending')
            .get();

        if (!existingRequest.empty) {
            alert('Friend request already sent');
            return;
        }

        // フレンドリクエスト作成
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
 * フレンドリクエストを承認する関数
 * - 友達関係のドキュメントを作成
 * - リクエストのステータスを更新
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
 * フレンドリクエストを拒否する関数
 * - リクエストのステータスを「declined」に更新
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
 * チャットページを開く関数
 * - フレンドIDをローカルストレージに保存
 * - チャットページへ遷移
 */
function openChat(friendId) {
    localStorage.setItem('currentChatFriend', friendId);
    window.location.href = 'chat.html';
}

/**
 * フレンドを検索する関数
 * - 名前で部分一致検索を実行
 * - マッチしないフレンドカードを非表示
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

// 検索イベントリスナーの設定
document.getElementById('friendSearch')?.addEventListener('input', (e) => {
    searchFriends(e.target.value);
});

/**
 * フレンド追加モーダルを表示する関数
 */
function showAddFriendModal() {
    $('#addFriendModal').modal('show');
}

// グローバルスコープに関数を公開
window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.openChat = openChat;
window.showAddFriendModal = showAddFriendModal;

/**
 * オンライン状態を更新する関数
 * - ユーザーのオンライン状態とlastSeenを更新
 */
function updateOnlineStatus(isOnline) {
    if (!currentUser) return;

    db.collection('profiles').doc(currentUser.uid).update({
        online: isOnline,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
}

/**
 * プレゼンス（オンライン状態）システムのセットアップ関数
 * - Firestoreとリアルタイムデータベースの両方を使用
 * - オンライン/オフライン状態を自動的に追跡
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
 * プロフィールプレビューを表示する関数
 * - ユーザーのプロフィール情報を取得
 * - モーダルでプロフィール情報を表示
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
 * フレンドを削除する関数
 * - 確認ダイアログを表示
 * - フレンドシップドキュメントを削除
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
 * フレンドリストをフィルタリングする関数
 * - オンライン状態や最近のメッセージでフィルタリング
 * - フィルターボタンの状態を更新
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
 * ユーザーのアクティビティを更新する関数
 * - 最後のアクティブタイムスタンプを更新
 * - 非アクティブタイマーをリセット
 */
function updateUserActivity() {
    if (!currentUser) return;
    
    clearTimeout(activityTimeout);
    
    db.collection('profiles').doc(currentUser.uid).update({
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    activityTimeout = setTimeout(() => {
        updateOnlineStatus(false);
    }, 300000); // 5分
}

// ユーザーアクティビティのイベントリスナーを