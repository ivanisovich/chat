document.addEventListener('DOMContentLoaded', () => {
  const userSelection = document.getElementById('user-selection');
  const chat = document.getElementById('chat');
  const userList = document.getElementById('user-list');
  const messages = document.getElementById('messages');
  const messageText = document.getElementById('message-text');
  const sendMessageButton = document.getElementById('send-message');
  const chatWithTitle = document.getElementById('chat-with');
  const logoutBtn = document.getElementById('logout-btn');
  const chatWindow = document.querySelector("#chat-window");
  const returnButton = document.querySelector(".back-btn")

  if (!window.name) {
      window.name = Math.random().toString();
      sessionStorage.clear();
  }

  let currentUser = sessionStorage.getItem('currentUser');
  let currentChatUser = sessionStorage.getItem('currentChatUser');

  const users = ['Алиса', 'Василий', 'Сергей'];

  if (currentUser) {
      userSelection.style.display = 'none';
      chat.style.display = 'flex';
      loadUserList();
      if (currentChatUser) {
          chatWithTitle.textContent = `${currentChatUser}`;
          loadMessages();
          markMessagesAsRead(currentUser, currentChatUser);
      }
  } else {
      userSelection.style.display = 'block';
      chat.style.display = 'none';
  }

  document.querySelectorAll('.user-btn').forEach(button => {
      button.addEventListener('click', (e) => {
          currentUser = e.target.dataset.username;
          sessionStorage.setItem('currentUser', currentUser);
          userSelection.style.display = 'none';
          chat.style.display = 'flex';
          loadUserList();
      });
  });

  logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentChatUser');
      currentUser = null;
      currentChatUser = null;
      userSelection.style.display = 'block';
      chat.style.display = 'none';
  });

  function loadUserList() {
      userList.innerHTML = '';
      users.forEach(user => {
          if (user !== currentUser) {
             const avatar = document.createElement("img")
             avatar.src = "./images/icons8-user-50.png"
              const userButton = document.createElement('button');
              const messageWrapper = document.createElement("div")
              const messageInner = document.createElement("div")
              messageInner.className = "message-inner"
              messageWrapper.className = "message-wrapper"
              userButton.textContent = user;
              const userMessage = document.createElement('span');
              userMessage.classList.add('user-message');
              const messageTime = document.createElement('span');
              messageTime.classList.add('message-time');
              const unreadBadge = document.createElement('span');
              unreadBadge.classList.add('unread-badge');
              unreadBadge.style.display = 'none';
              messageInner.appendChild(userButton)
              messageInner.appendChild(userMessage)
              messageWrapper.appendChild(avatar)

              messageWrapper.appendChild(messageInner)
             

              messageWrapper.appendChild(messageTime)

              messageWrapper.appendChild(unreadBadge)

              messageWrapper.addEventListener('click', () => {
                  currentChatUser = user;
                  sessionStorage.setItem('currentChatUser', currentChatUser);
                  chatWithTitle.textContent = ` ${currentChatUser}`;
                  loadMessages();
                  markMessagesAsRead(currentUser, currentChatUser);
                  chatWindow.classList.remove("hidden")
              });
              userList.appendChild(messageWrapper);
          }
      });
      updateUserMessages();
  }

  function loadMessages() {
      messages.innerHTML = '';
      if (currentChatUser) {
          const chatKey = getChatKey(currentUser, currentChatUser);
          const chatMessages = JSON.parse(localStorage.getItem(chatKey)) || [];
          chatMessages.forEach(msg => {
              const msgDiv = document.createElement('div');
              msgDiv.textContent = `${msg.user}: ${msg.text}`;
              msgDiv.classList.add('message');
              if (msg.user === currentUser) {
                  msgDiv.classList.add('current-user');
              }

              const timeSpan = document.createElement('span');
              timeSpan.classList.add('message-time');
              timeSpan.textContent = formatDate(new Date(msg.timestamp));
              
              const statusSpan = document.createElement('span');
              statusSpan.classList.add('message-status');
              statusSpan.classList.add(msg.read ? 'read' : 'unread');
              
              msgDiv.appendChild(timeSpan);
              msgDiv.appendChild(statusSpan);

              messages.appendChild(msgDiv);
          });
      }
  }

  function updateUserMessages() {
      users.forEach(user => {
          if (user !== currentUser) {
              const chatKey = getChatKey(currentUser, user);
              const chatMessages = JSON.parse(localStorage.getItem(chatKey)) || [];
              if (chatMessages.length > 0) {
                  const lastMessage = chatMessages[chatMessages.length - 1];
                  const userButton = [...userList.children].find(btn => btn.textContent.trim().startsWith(user));
                  if (userButton) {
                      const userMessage = userButton.querySelector('.user-message');
                      const messageTime = userButton.querySelector('.message-time');
                      const unreadBadge = userButton.querySelector('.unread-badge');
                      userMessage.textContent = truncateMessage(lastMessage.text);
                      messageTime.textContent = formatDate(new Date(lastMessage.timestamp));
                      const unreadCount = countUnreadMessages(chatMessages, currentUser);
                      if (unreadCount > 0) {
                          unreadBadge.textContent = unreadCount;
                          unreadBadge.style.display = 'block';
                      } else {
                          unreadBadge.style.display = 'none';
                      }
                  }
              }
          }
      });
  }

  function markMessagesAsRead(user, chatUser) {
      const chatKey = getChatKey(user, chatUser);
      let chatMessages = JSON.parse(localStorage.getItem(chatKey)) || [];
      chatMessages = chatMessages.map(msg => {
          if (msg.user !== user && !msg.read) {
              msg.read = true;
              notifyUserReadStatusChange(user, chatUser);
          }
          return msg;
      });
      localStorage.setItem(chatKey, JSON.stringify(chatMessages));
      updateUserMessages();
  }

  function notifyUserReadStatusChange(user, chatUser) {
      const chatKey = getChatKey(user, chatUser);
      const chatMessages = JSON.parse(localStorage.getItem(chatKey)) || [];
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage) {
          lastMessage.read = true;
          localStorage.setItem(chatKey, JSON.stringify(chatMessages));
          window.dispatchEvent(new Event('storage'));
      }
  }

  function truncateMessage(message) {
      return message.length > 20 ? message.substring(0, 20) + '...' : message;
  }

  function formatDate(date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  }

  function countUnreadMessages(messages, user) {
      return messages.filter(msg => !msg.read && msg.user !== user).length;
  }

  sendMessageButton.addEventListener('click', () => {
      const text = messageText.value.trim();
      if (text && currentChatUser) {
          const chatKey = getChatKey(currentUser, currentChatUser);
          const chatMessages = JSON.parse(localStorage.getItem(chatKey)) || [];
          const newMessage = { user: currentUser, text, timestamp: new Date(), read: false };
          chatMessages.push(newMessage);
          localStorage.setItem(chatKey, JSON.stringify(chatMessages));
          messageText.value = '';
          loadMessages();
          updateUserMessages();
      }
  });

  function getChatKey(user1, user2) {
      return [user1, user2].sort().join('-');
  }

  window.addEventListener('storage', () => {
      if (chat.style.display === 'flex') {
          loadMessages();
          updateUserMessages();
      } else {
          updateUserMessages();
      }
  });

  returnButton.addEventListener("click",()=>{
    chatWindow.classList.add("hidden")
  })


  document.addEventListener("click",(e)=>{
    if(e.target.closest.id = "chat-window"){
      markMessagesAsRead(currentUser, currentChatUser);
    }
  })
});
