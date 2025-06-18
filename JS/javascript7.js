// Global variables
let currentUser = null;
let currentChatId = null;
let chats = {};
let contacts = {};
let messagesListeners = {};
el.scrollTo({top: el.scrollHeight, behavior: 'smooth'});

// DOM elements
const welcomeScreen = document.getElementById('welcome-screen');
const mainApp = document.getElementById('main-app');
const usernameInput = document.getElementById('username-input');
const startChatBtn = document.getElementById('start-chat-btn');
const userNameSpan = document.getElementById('user-name');
const userIdSpan = document.getElementById('user-id');
const userProfilePic = document.getElementById('user-profile-pic');
const chatList = document.getElementById('chat-list');
const defaultChat = document.getElementById('default-chat');
const activeChat = document.getElementById('active-chat');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const contactName = document.getElementById('contact-name');
const contactProfilePic = document.getElementById('contact-profile-pic');
const contactStatus = document.getElementById('contact-status');
const searchInput = document.getElementById('search-input');

// Modal elements
const newChatModal = document.getElementById('new-chat-modal');
const newGroupModal = document.getElementById('new-group-modal');
const newChatBtn = document.getElementById('new-chat-btn');
const newGroupBtn = document.getElementById('new-group-btn');
const profilePicInput = document.getElementById('profile-pic-input');
const profilePicContainer = document.querySelector('.profile-pic-container');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkExistingUser();
    setupEventListeners();
});

// Check if user already exists
function checkExistingUser() {
    const savedUser = localStorage.getItem('whatsapp-user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
        loadUserData();
    } else {
        showWelcomeScreen();
    }
}

// Show welcome screen
function showWelcomeScreen() {
    welcomeScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

// Show main app
function showMainApp() {
    welcomeScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    if (currentUser) {
        userNameSpan.textContent = currentUser.name;
        userIdSpan.textContent = `ID: #${currentUser.id}`;
        if (currentUser.profilePic) {
            userProfilePic.src = currentUser.profilePic;
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Welcome screen
    startChatBtn.addEventListener('click', handleUserRegistration);
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserRegistration();
        }
    });

    // Profile picture
    profilePicContainer.addEventListener('click', function() {
        profilePicInput.click();
    });
    
    profilePicInput.addEventListener('change', handleProfilePicChange);

    // Message input
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    sendBtn.addEventListener('click', sendMessage);

    // Navigation buttons
    newChatBtn.addEventListener('click', showNewChatModal);
    newGroupBtn.addEventListener('click', showNewGroupModal);
    document.getElementById('back-btn').addEventListener('click', closeChatView);
    document.getElementById('settings-btn').addEventListener('click', showSettings);

    // Modal handling
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    document.getElementById('start-new-chat-btn').addEventListener('click', startNewChat);
    document.getElementById('create-group-btn').addEventListener('click', createGroup);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('delete-account-btn').addEventListener('click', deleteAccount);

    // Search functionality
    searchInput.addEventListener('input', handleSearch);

    // Click outside modal to close
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

// Handle user registration
function handleUserRegistration() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Masukkan nama Anda terlebih dahulu');
        return;
    }

    // Validate username length
    if (username.length > 15) {
        alert('Nama tidak boleh lebih dari 15 karakter');
        return;
    }

    if (username.length < 2) {
        alert('Nama minimal 2 karakter');
        return;
    }

    // Check for XSS attempts and malicious content
    if (containsXSS(username)) {
        alert('Nama mengandung karakter yang tidak diizinkan');
        return;
    }

    // Generate unique 6-digit ID
    const userId = generateUniqueId();
    
    currentUser = {
        id: userId,
        name: username,
        profilePic: null,
        createdAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true
    };

    // Save user to localStorage and Firebase
    localStorage.setItem('whatsapp-user', JSON.stringify(currentUser));
    saveUserToFirebase();
    
    showMainApp();
    loadUserData();
    
    // Auto-join public group
    joinPublicGroup();
}

// Generate unique 6-digit ID
function generateUniqueId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Save user to Firebase
function saveUserToFirebase() {
    if (!currentUser) return;
    
    // Sanitize user name before saving
    const sanitizedName = sanitizeInput(currentUser.name);
    
    database.ref(`users/${currentUser.id}`).set({
        name: sanitizedName,
        profilePic: currentUser.profilePic,
        lastSeen: currentUser.lastSeen,
        isOnline: currentUser.isOnline,
        createdAt: currentUser.createdAt
    }).catch(error => {
        console.error('Error saving user:', error);
    });
}

// Load user data and setup listeners
function loadUserData() {
    if (!currentUser) return;
    
    // Update user's online status
    updateUserStatus(true);
    
    // Listen for user's chats
    loadChats();
    
    // Setup presence system
    setupPresenceSystem();
}

// Setup presence system
function setupPresenceSystem() {
    if (!currentUser) return;
    
    const userStatusRef = database.ref(`users/${currentUser.id}/isOnline`);
    const connectedRef = database.ref('.info/connected');
    
    connectedRef.on('value', function(snapshot) {
        if (snapshot.val() === true) {
            userStatusRef.onDisconnect().set(false);
            userStatusRef.set(true);
        }
    });
    
    // Update last seen on window unload
    window.addEventListener('beforeunload', function() {
        updateUserStatus(false);
    });
}

// Update user status
function updateUserStatus(isOnline) {
    if (!currentUser) return;
    
    database.ref(`users/${currentUser.id}`).update({
        isOnline: isOnline,
        lastSeen: Date.now()
    });
}

// Load chats
function loadChats() {
    if (!currentUser) return;
    
    database.ref(`userChats/${currentUser.id}`).on('value', function(snapshot) {
        const userChats = snapshot.val() || {};
        
        // Clear existing chat list
        chatList.innerHTML = '';
        chats = {};
        
        // Load each chat
        Object.keys(userChats).forEach(chatId => {
            loadChatData(chatId);
        });
        
        if (Object.keys(userChats).length === 0) {
            chatList.innerHTML = '<div class="loading">Belum ada chat. Mulai percakapan baru!</div>';
        }
    });
}

// Load chat data
function loadChatData(chatId) {
    database.ref(`chats/${chatId}`).once('value', function(snapshot) {
        const chatData = snapshot.val();
        if (!chatData) return;
        
        chats[chatId] = chatData;
        
        // Load participants info
        const participants = chatData.participants || {};
        const otherParticipants = Object.keys(participants).filter(id => id !== currentUser.id);
        
        if (chatData.isGroup) {
            const isPublic = chatData.isPublic || false;
            renderChatItem(chatId, chatData.name, chatData.profilePic, chatData.lastMessage, chatData.lastMessageTime, true, isPublic);
        } else if (otherParticipants.length > 0) {
            const otherUserId = otherParticipants[0];
            loadUserInfo(otherUserId, function(userInfo) {
                renderChatItem(chatId, userInfo.name, userInfo.profilePic, chatData.lastMessage, chatData.lastMessageTime, false, false);
            });
        }
        
        // Listen for new messages in this chat
        listenForMessages(chatId);
    });
}

// Load user info
function loadUserInfo(userId, callback) {
    if (contacts[userId]) {
        callback(contacts[userId]);
        return;
    }
    
    database.ref(`users/${userId}`).once('value', function(snapshot) {
        const userInfo = snapshot.val();
        if (userInfo) {
            contacts[userId] = userInfo;
            callback(userInfo);
        }
    });
}

// Render chat item
function renderChatItem(chatId, name, profilePic, lastMessage, lastMessageTime, isGroup, isPublic = false) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.dataset.chatId = chatId;
    
    const time = lastMessageTime ? formatTime(lastMessageTime) : '';
    const defaultPic = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNEREQiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5OSIvPgo8cGF0aCBkPSJNMTAgMzJjMC00LjQgNC40LTggMTAtOHM1MCAzLjYgMTAgOCIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K';
    
    chatItem.innerHTML = `
        <img src="${profilePic || defaultPic}" alt="${name}" onerror="this.src='${defaultPic}'">
        <div class="chat-info">
            <div class="chat-name">
                ${isGroup ? '<i class="fas fa-users group-indicator"></i>' : ''}
                ${name}
                ${isPublic ? '<span class="public-group-indicator">PUBLIK</span>' : ''}
            </div>
            <div class="chat-last-message">${lastMessage || 'Belum ada pesan'}</div>
        </div>
        <div class="chat-meta">
            <div class="chat-time">${time}</div>
        </div>
    `;
    
    chatItem.addEventListener('click', function() {
        openChat(chatId);
    });
    
    // Add public group to the top
    if (isPublic) {
        chatList.insertBefore(chatItem, chatList.firstChild);
    } else {
        chatList.appendChild(chatItem);
    }
}

// Open chat
function openChat(chatId) {
    currentChatId = chatId;
    const chatData = chats[chatId];
    
    if (!chatData) return;
    
    // Update UI
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[data-chat-id="${chatId}"]`).classList.add('active');
    
    // Show chat area
    defaultChat.classList.add('hidden');
    activeChat.classList.remove('hidden');
    
    // Update chat header
    if (chatData.isGroup) {
        contactName.textContent = chatData.name;
        contactProfilePic.src = chatData.profilePic || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNEREQiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5OSIvPgo8cGF0aCBkPSJNMTAgMzJjMC00LjQgNC40LTggMTAtOHM1MCAzLjYgMTAgOCIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K';
        contactStatus.textContent = `${Object.keys(chatData.participants || {}).length} members`;
    } else {
        const participants = chatData.participants || {};
        const otherParticipants = Object.keys(participants).filter(id => id !== currentUser.id);
        
        if (otherParticipants.length > 0) {
            const otherUserId = otherParticipants[0];
            loadUserInfo(otherUserId, function(userInfo) {
                contactName.textContent = userInfo.name;
                contactProfilePic.src = userInfo.profilePic || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNEREQiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5OSIvPgo8cGF0aCBkPSJNMTAgMzJjMC00LjQgNC40LTggMTAtOHM1MCAzLjYgMTAgOCIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K';
                
                // Check online status
                database.ref(`users/${otherUserId}/isOnline`).on('value', function(snapshot) {
                    const isOnline = snapshot.val();
                    if (isOnline) {
                        contactStatus.textContent = 'Online';
                        contactStatus.style.color = '#25d366';
                    } else {
                        database.ref(`users/${otherUserId}/lastSeen`).once('value', function(lastSeenSnapshot) {
                            const lastSeen = lastSeenSnapshot.val();
                            if (lastSeen) {
                                contactStatus.textContent = `Last seen ${formatTime(lastSeen)}`;
                                contactStatus.style.color = '#666';
                            }
                        });
                    }
                });
            });
        }
    }
    
    // Load messages
    loadMessages(chatId);
    
    // Mobile responsive
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.add('mobile-hidden');
    }
}

// Listen for messages
function listenForMessages(chatId) {
    if (messagesListeners[chatId]) {
        messagesListeners[chatId].off();
    }
    
    messagesListeners[chatId] = database.ref(`messages/${chatId}`).orderByChild('timestamp');
    
    messagesListeners[chatId].on('child_added', function(snapshot) {
        const message = snapshot.val();
        if (message && currentChatId === chatId) {
            renderMessage(message);
            scrollToBottom();
        }
        
        // Update chat item with last message
        updateChatLastMessage(chatId, message);
    });
}

// Load messages
function loadMessages(chatId) {
    messagesContainer.innerHTML = '';
    
    database.ref(`messages/${chatId}`).orderByChild('timestamp').once('value', function(snapshot) {
        const messages = snapshot.val() || {};
        
        Object.values(messages).forEach(message => {
            renderMessage(message);
        });
        
        scrollToBottom();
    });
}

// Render message
function renderMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.id ? 'sent' : 'received'}`;
    
    const isGroup = chats[currentChatId] && chats[currentChatId].isGroup;
    const senderName = message.senderId === currentUser.id ? 'You' : (contacts[message.senderId] ? contacts[message.senderId].name : 'Unknown');
    
    messageDiv.innerHTML = `
        <div class="message-bubble ${isGroup && message.senderId !== currentUser.id ? 'group-message' : ''}">
            ${isGroup && message.senderId !== currentUser.id ? `<div class="message-sender">${senderName}</div>` : ''}
            <div class="message-text">${escapeHtml(message.text)}</div>
            <div class="message-meta">
                <span class="message-time">${formatTime(message.timestamp)}</span>
                ${message.senderId === currentUser.id ? '<i class="fas fa-check message-status"></i>' : ''}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
}

// Send message
function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text || !currentChatId) return;
    
    // Validate message length
    if (text.length > 1000) {
        alert('Pesan terlalu panjang (maksimal 1000 karakter)');
        return;
    }
    
    // Check for XSS attempts in message
    if (containsXSS(text)) {
        alert('Pesan mengandung karakter yang tidak diizinkan');
        return;
    }
    
    // Sanitize message text
    const sanitizedText = sanitizeInput(text);
    
    const message = {
        id: Date.now().toString(),
        text: sanitizedText,
        senderId: currentUser.id,
        timestamp: Date.now(),
        type: 'text'
    };
    
    // Add message to Firebase
    database.ref(`messages/${currentChatId}`).push(message);
    
    // Update chat's last message
    database.ref(`chats/${currentChatId}`).update({
        lastMessage: sanitizedText,
        lastMessageTime: message.timestamp
    });
    
    // Clear input
    messageInput.value = '';
}

// Update chat last message
function updateChatLastMessage(chatId, message) {
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatItem) {
        const lastMessageDiv = chatItem.querySelector('.chat-last-message');
        const timeDiv = chatItem.querySelector('.chat-time');
        
        if (lastMessageDiv) {
            const senderName = message.senderId === currentUser.id ? 'You' : (contacts[message.senderId] ? contacts[message.senderId].name : 'Unknown');
            lastMessageDiv.textContent = `${message.senderId === currentUser.id ? 'You: ' : (chats[chatId] && chats[chatId].isGroup ? senderName + ': ' : '')}${message.text}`;
        }
        
        if (timeDiv) {
            timeDiv.textContent = formatTime(message.timestamp);
        }
    }
}

// Close chat view (mobile)
function closeChatView() {
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('mobile-hidden');
        defaultChat.classList.remove('hidden');
        activeChat.classList.add('hidden');
        currentChatId = null;
    }
}

// Show new chat modal
function showNewChatModal() {
    newChatModal.classList.remove('hidden');
}

// Show new group modal
function showNewGroupModal() {
    newGroupModal.classList.remove('hidden');
}

// Close modals
function closeModals() {
    newChatModal.classList.add('hidden');
    newGroupModal.classList.add('hidden');
    
    // Clear inputs
    document.getElementById('contact-id-input').value = '';
    document.getElementById('group-name-input').value = '';
    document.getElementById('group-members-input').value = '';
}

// Start new chat
function startNewChat() {
    const contactId = document.getElementById('contact-id-input').value.trim();
    
    if (!contactId) {
        alert('Masukkan ID kontak terlebih dahulu');
        return;
    }
    
    // Validate contact ID format (6 digits)
    if (!/^\d{6}$/.test(contactId)) {
        alert('ID kontak harus 6 digit angka');
        return;
    }
    
    if (contactId === currentUser.id) {
        alert('Anda tidak bisa chat dengan diri sendiri');
        return;
    }
    
    // Check if user exists
    database.ref(`users/${contactId}`).once('value', function(snapshot) {
        if (!snapshot.exists()) {
            alert('Pengguna tidak ditemukan');
            return;
        }
        
        // Check if chat already exists
        const chatId = [currentUser.id, contactId].sort().join('_');
        
        database.ref(`chats/${chatId}`).once('value', function(chatSnapshot) {
            if (chatSnapshot.exists()) {
                // Chat already exists, open it
                openChat(chatId);
                closeModals();
                return;
            }
            
            // Create new chat
            const chatData = {
                id: chatId,
                participants: {
                    [currentUser.id]: true,
                    [contactId]: true
                },
                createdAt: Date.now(),
                isGroup: false
            };
            
            // Save chat
            database.ref(`chats/${chatId}`).set(chatData);
            
            // Add to user chats
            database.ref(`userChats/${currentUser.id}/${chatId}`).set(true);
            database.ref(`userChats/${contactId}/${chatId}`).set(true);
            
            closeModals();
        });
    });
}

// Create group
function createGroup() {
    const groupName = document.getElementById('group-name-input').value.trim();
    const membersInput = document.getElementById('group-members-input').value.trim();
    
    if (!groupName) {
        alert('Masukkan nama grup terlebih dahulu');
        return;
    }
    
    // Validate group name length
    if (groupName.length > 25) {
        alert('Nama grup tidak boleh lebih dari 25 karakter');
        return;
    }
    
    if (groupName.length < 2) {
        alert('Nama grup minimal 2 karakter');
        return;
    }
    
    // Check for XSS in group name
    if (containsXSS(groupName)) {
        alert('Nama grup mengandung karakter yang tidak diizinkan');
        return;
    }
    
    if (!membersInput) {
        alert('Tambahkan minimal satu anggota');
        return;
    }
    
    const memberIds = membersInput.split(',').map(id => id.trim()).filter(id => id);
    
    if (memberIds.length === 0) {
        alert('Masukkan ID anggota yang valid');
        return;
    }
    
    // Validate member IDs format
    const invalidFormat = memberIds.filter(id => !/^\d{6}$/.test(id));
    if (invalidFormat.length > 0) {
        alert(`ID anggota harus 6 digit angka: ${invalidFormat.join(', ')}`);
        return;
    }
    
    // Validate all member IDs
    const promises = memberIds.map(id => {
        return database.ref(`users/${id}`).once('value');
    });
    
    Promise.all(promises).then(snapshots => {
        const invalidIds = [];
        snapshots.forEach((snapshot, index) => {
            if (!snapshot.exists()) {
                invalidIds.push(memberIds[index]);
            }
        });
        
        if (invalidIds.length > 0) {
            alert(`Pengguna tidak ditemukan: ${invalidIds.join(', ')}`);
            return;
        }
        
        // Create group
        const groupId = 'group_' + Date.now();
        const participants = { [currentUser.id]: true };
        
        memberIds.forEach(id => {
            participants[id] = true;
        });
        
        const sanitizedGroupName = sanitizeInput(groupName);
        
        const groupData = {
            id: groupId,
            name: sanitizedGroupName,
            participants: participants,
            createdAt: Date.now(),
            createdBy: currentUser.id,
            isGroup: true
        };
        
        // Save group
        database.ref(`chats/${groupId}`).set(groupData);
        
        // Add to all participants' chats
        Object.keys(participants).forEach(userId => {
            database.ref(`userChats/${userId}/${groupId}`).set(true);
        });
        
        // Send system message
        const systemMessage = {
            id: Date.now().toString(),
            text: `${currentUser.name} created this group`,
            senderId: 'system',
            timestamp: Date.now(),
            type: 'system'
        };
        
        database.ref(`messages/${groupId}`).push(systemMessage);
        
        closeModals();
    });
}

// Handle profile picture change
function handleProfilePicChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
    }
    
    // Upload to Firebase Storage
    const storageRef = storage.ref(`profile-pics/${currentUser.id}`);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
        function(snapshot) {
            // Progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
        },
        function(error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        },
        function() {
            // Success
            uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
                // Update user profile
                currentUser.profilePic = downloadURL;
                userProfilePic.src = downloadURL;
                
                // Save to localStorage and Firebase
                localStorage.setItem('whatsapp-user', JSON.stringify(currentUser));
                database.ref(`users/${currentUser.id}/profilePic`).set(downloadURL);
            });
        }
    );
}

// Handle search
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const name = item.querySelector('.chat-name').textContent.toLowerCase();
        const lastMessage = item.querySelector('.chat-last-message').textContent.toLowerCase();
        
        if (name.includes(query) || lastMessage.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Utility functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
}

// Security functions for XSS protection
function containsXSS(input) {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<\s*\w+[^>]*\s+on\w+\s*=/gi,
        /alert\s*\(/gi,
        /eval\s*\(/gi,
        /document\./gi,
        /window\./gi,
        /<\s*img[^>]*src\s*=\s*["\']?javascript:/gi,
        /<\s*object/gi,
        /<\s*embed/gi,
        /<\s*applet/gi,
        /<\s*meta/gi,
        /<\s*link/gi,
        /<\s*style/gi,
        /expression\s*\(/gi,
        /vbscript:/gi,
        /data:text\/html/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
}

function sanitizeInput(input) {
    // Remove dangerous characters and scripts
    let sanitized = input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/&/g, '&amp;');
    
    return sanitized;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Join public group automatically
function joinPublicGroup() {
    const publicGroupId = 'public_group_global';
    
    // Check if public group exists, if not create it
    database.ref(`chats/${publicGroupId}`).once('value', function(snapshot) {
        if (!snapshot.exists()) {
            // Create public group
            const publicGroupData = {
                id: publicGroupId,
                name: 'Chat Publik Global',
                participants: {
                    [currentUser.id]: true
                },
                createdAt: Date.now(),
                isGroup: true,
                isPublic: true,
                description: 'Grup chat publik untuk semua pengguna'
            };
            
            database.ref(`chats/${publicGroupId}`).set(publicGroupData);
        } else {
            // Add user to existing public group
            database.ref(`chats/${publicGroupId}/participants/${currentUser.id}`).set(true);
        }
        
        // Add public group to user's chat list
        database.ref(`userChats/${currentUser.id}/${publicGroupId}`).set(true);
    });
}

// Settings functions
function showSettings() {
    const settingsModal = document.getElementById('settings-modal');
    settingsModal.classList.remove('hidden');
    
    // Load current settings
    document.getElementById('settings-username').value = currentUser.name;
    document.getElementById('settings-status').value = currentUser.status || 'Hey there! I am using WhatsApp Clone';
    document.getElementById('settings-user-id').textContent = `#${currentUser.id}`;
}

function saveSettings() {
    const newName = document.getElementById('settings-username').value.trim();
    const newStatus = document.getElementById('settings-status').value.trim();
    
    if (!newName) {
        alert('Nama tidak boleh kosong');
        return;
    }
    
    if (newName.length > 15) {
        alert('Nama tidak boleh lebih dari 15 karakter');
        return;
    }
    
    if (containsXSS(newName) || containsXSS(newStatus)) {
        alert('Input mengandung karakter yang tidak diizinkan');
        return;
    }
    
    // Update user data
    currentUser.name = newName;
    currentUser.status = newStatus;
    
    // Save to localStorage
    localStorage.setItem('whatsapp-user', JSON.stringify(currentUser));
    
    // Update Firebase
    database.ref(`users/${currentUser.id}`).update({
        name: sanitizeInput(newName),
        status: sanitizeInput(newStatus)
    });
    
    // Update UI
    userNameSpan.textContent = newName;
    
    closeModals();
    alert('Pengaturan berhasil disimpan');
}

function deleteAccount() {
    if (confirm('Apakah Anda yakin ingin menghapus akun? Semua data akan hilang.')) {
        // Remove user from Firebase
        database.ref(`users/${currentUser.id}`).remove();
        database.ref(`userChats/${currentUser.id}`).remove();
        
        // Clear localStorage
        localStorage.removeItem('whatsapp-user');
        
        // Reset app
        currentUser = null;
        currentChatId = null;
        chats = {};
        contacts = {};
        
        closeModals();
        showWelcomeScreen();
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        document.querySelector('.sidebar').classList.remove('mobile-hidden');
    }
});

// Handle online/offline status
window.addEventListener('online', function() {
    updateUserStatus(true);
});

window.addEventListener('offline', function() {
    updateUserStatus(false);
});
