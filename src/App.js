import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import emojione from 'emojione';

function App() {
  const [chats, setChats] = useState({});
  const [currentChat, setCurrentChat] = useState(null);
  const [contacts, setContacts] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationAction, setConfirmationAction] = useState(null);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [showMedia, setShowMedia] = useState(null);

  // Функция для отправки сообщения
  const sendMessage = (text) => {
    if (chats[currentChat]) {
      const newMessage = {
        text: emojione.toImage(text),
        sender: 'Вы',
        time: new Date().toLocaleTimeString(),
        id: Date.now(),
        pinned: false
      };

      const updatedChats = { ...chats };
      updatedChats[currentChat].messages.push(newMessage);
      setChats(updatedChats);

      // Отправка уведомления (в случае включенных уведомлений)
      if (notificationsEnabled) {
        sendNotification(`Новое сообщение в ${currentChat}`, text);
      }
    } else {
      console.error(`Группа "${currentChat}" не найдена.`);
      alert('Группа не найдена.');
    }
  };

  // Функция для отправки сообщения с файлом
  const sendFileMessage = (fileData, fileName, type) => {
    if (chats[currentChat]) {
      const newMessage = {
        text: fileName,
        sender: 'Вы',
        time: new Date().toLocaleTimeString(),
        id: Date.now(),
        file: fileData,
        fileType: type,
        pinned: false
      };

      const updatedChats = { ...chats };
      updatedChats[currentChat].messages.push(newMessage);
      setChats(updatedChats);
    } else {
      console.error(`Группа "${currentChat}" не найдена.`);
      alert('Группа не найдена.');
    }
  };

  // Компонент для отображения сообщений
  const DisplayMessages = (chat) => {
    if (!chat) {
      return <div>Нет сообщений</div>;
    }

    const pinnedMessages = chat.messages.filter((message) => message.pinned);
    const unpinnedMessages = chat.messages.filter((message) => !message.pinned);

    // Разбиваем поисковую строку на ключевые слова
    const searchTerms = searchTerm.trim().toLowerCase().split(/\s+/);

    // Фильтруем сообщения, чтобы они соответствовали поисковому запросу
    const filteredMessages = unpinnedMessages.filter((message) => {
      // Проверяем, есть ли свойство 'text' у message
      if (message.text) {
        return searchTerms.some(term => 
          message.text.toLowerCase().includes(term) 
        );
      } else {
        // Возвращаем false, если у message нет свойства 'text'
        return false; 
      }
    });

    return (
      <div className="message-list">
        {/* Отображение закрепленных сообщений */}
        {pinnedMessages.length > 0 && (
          <div className="pinned-messages">
            <h3>Закрепленные сообщения</h3>
            {pinnedMessages.map((message, messageIndex) => {
              if (typeof message.question === 'string') {
                // Отображение опроса (неактуальный код, так как опросы удалены)
                // return displayPoll(message, messageIndex);
                return null; // Возвращаем null, чтобы не отображать опрос
              } else {
                return (
                  <div key={message.id} className="message" data-message-id={message.id}>
                    <div className="message-content">
                      {message.fileType === 'image' && (
                        <div className={`message-file message-image ${showMedia === message.id ? 'expanded' : ''}`} 
                          onClick={() => setShowMedia(showMedia === message.id ? null : message.id)}>
                          <img 
                            src={message.file} 
                            alt={message.text} 
                            data-message-id={message.id}
                          />
                        </div>
                      )}
                      {message.fileType === 'video' && (
                        <div className={`message-file message-video ${showMedia === message.id ? 'expanded' : ''}`}
                          onClick={() => setShowMedia(showMedia === message.id ? null : message.id)}>
                          <video 
                            src={message.file} 
                            controls 
                            data-message-id={message.id}
                          />
                        </div>
                      )}
                      {message.fileType === 'audio' && (
                        <audio src={message.file} controls />
                      )}
                      {!message.fileType && (
                        <>
                          <span className="message-sender">{message.sender}:</span>
                          <span className="message-text">{message.text}</span>
                        </>
                      )}
                      <span className="message-time">{message.time}</span>
                    </div>
                    <div className="message-actions">
                      <button 
                        className="edit-button" 
                        data-message-id={message.id} 
                        onClick={() => editMessage(message.id)}
                      >✏️ 
 
                      </button>
                      <button 
                        className="delete-button" 
                        data-message-id={message.id} 
                        onClick={() => deleteMessage(message.id)}
                      >🗑️ 
 
                      </button>
                      <button 
                        className="pin-button" 
                        data-message-id={message.id} 
                        aria-pressed={message.pinned}
                        onClick={() => togglePinMessage(message.id)}
                      >📍 
 
                      </button>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Отображение незакрепленных сообщений */}
        {filteredMessages.map((message, messageIndex) => {
          if (typeof message.question === 'string') {
            // Отображение опроса (неактуальный код, так как опросы удалены)
            // return displayPoll(message, messageIndex);
            return null; // Возвращаем null, чтобы не отображать опрос
          } else {
            return (
              <div key={message.id} className="message" data-message-id={message.id}>
                <div className="message-content">
                  {message.fileType === 'image' && (
                    <div className={`message-file message-image ${showMedia === message.id ? 'expanded' : ''}`} 
                      onClick={() => setShowMedia(showMedia === message.id ? null : message.id)}>
                      <img 
                        src={message.file} 
                        alt={message.text} 
                        data-message-id={message.id}
                      />
                    </div>
                  )}
                  {message.fileType === 'video' && (
                    <div className={`message-file message-video ${showMedia === message.id ? 'expanded' : ''}`}
                      onClick={() => setShowMedia(showMedia === message.id ? null : message.id)}>
                      <video 
                        src={message.file} 
                        controls 
                        data-message-id={message.id}
                      />
                    </div>
                  )}
                  {message.fileType === 'audio' && (
                    <audio src={message.file} controls />
                  )}
                  {!message.fileType && (
                    <>
                      <span className="message-sender">{message.sender}:</span>
                      <span className="message-text">{message.text}</span>
                    </>
                  )}
                  <span className="message-time">{message.time}</span>
                </div>
                <div className="message-actions">
                  <button 
                    className="edit-button" 
                    data-message-id={message.id} 
                    onClick={() => editMessage(message.id)}
                  >✏️ 
 
                  </button>
                  <button 
                    className="delete-button" 
                    data-message-id={message.id} 
                    onClick={() => deleteMessage(message.id)}
                  >🗑️ 
 
                  </button>
                  <button 
                    className="pin-button" 
                    data-message-id={message.id} 
                    aria-pressed={message.pinned}
                    onClick={() => togglePinMessage(message.id)}
                  >📌 
 
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Функция для редактирования сообщения
  const editMessage = (messageId) => {
    const updatedChats = { ...chats };
    const chat = updatedChats[currentChat];
    const messageIndex = chat.messages.findIndex(message => message.id === messageId);
    if (messageIndex !== -1) {
      const newText = prompt('Введите новый текст:', chat.messages[messageIndex].text);
      if (newText) {
        chat.messages[messageIndex].text = emojione.toImage(newText);
        setChats(updatedChats);
      }
    }
  };

  // Функция для удаления сообщения
  const deleteMessage = (messageId) => {
    setConfirmationMessage(`Вы уверены, что хотите удалить это сообщение?`);
    setConfirmationAction(() => {
      const updatedChats = { ...chats };
      const chat = updatedChats[currentChat];
      const messageIndex = chat.messages.findIndex(message => message.id === messageId);
      if (messageIndex !== -1) {
        chat.messages.splice(messageIndex, 1);
        setChats(updatedChats);
      }
      setShowConfirmationModal(false);
    });
    setShowConfirmationModal(true);
  };

  // Функция для переключения закрепления сообщения
  const togglePinMessage = (messageId) => {
    const updatedChats = { ...chats };
    const chat = updatedChats[currentChat];
    const messageIndex = chat.messages.findIndex(message => message.id === messageId);

    if (messageIndex !== -1) {
      chat.messages[messageIndex].pinned = !chat.messages[messageIndex].pinned;
      setChats(updatedChats);
    }
  };

  // Функция для отображения списка групп
  const displayGroups = () => {
    return (
      <>
        <div className="group-category">Группы</div>
        {Object.keys(chats).map((groupName) => {
          return (
            <div 
              key={groupName} 
              className={`group ${currentChat === groupName ? 'active' : ''}`} 
              onClick={() => setCurrentChat(groupName)}
            >
              <span className="group-name">{groupName}</span>
              <span 
                className="edit-group-icon"
                data-group-name={groupName}
                onClick={() => editGroupName(groupName)}
              >✏️ 
 
              </span>
              <span 
                className="delete-group-icon"
                data-group-name={groupName}
                onClick={() => deleteGroup(groupName)}
              >🗑️ 
 
              </span>
            </div>
          );
        })}
      </>
    );
  };

  // Функция для добавления новой группы
  const addGroup = () => {
    const groupName = prompt('Введите название новой группы:');
    if (groupName) {
      if (!chats[groupName]) {
        const updatedChats = { ...chats };
        updatedChats[groupName] = { messages: [] }; 
        setChats(updatedChats);
        setCurrentChat(groupName); 
      } else {
        alert('Группа с таким названием уже существует!');
      }
    }
  };

  // Функция для редактирования названия группы
  const editGroupName = (groupName) => {
    const newGroupName = prompt('Введите новое название группы:', groupName);
    if (newGroupName) {
      if (!chats[newGroupName] && newGroupName !== groupName) { 
        const updatedChats = { ...chats };
        updatedChats[newGroupName] = updatedChats[groupName]; 
        delete updatedChats[groupName];
        setChats(updatedChats);
        setCurrentChat(newGroupName); 
      } else {
        alert('Группа с таким названием уже существует!');
      }
    }
  };

  // Функция для удаления группы
  const deleteGroup = (groupName) => {
    setConfirmationMessage(`Вы уверены, что хотите удалить группу "${groupName}"?`);
    setConfirmationAction(() => {
      const updatedChats = { ...chats };
      delete updatedChats[groupName];
      setChats(updatedChats);
      setCurrentChat(null); 
      setShowConfirmationModal(false);
    });
    setShowConfirmationModal(true);
  };

  // Функция для отправки сообщения с файлом
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = e.target.result;
        sendFileMessage(fileData, file.name, file.type.split('/')[0]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Функция для записи голоса 
  const recordVoice = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            setAudioBlob(event.data);
          };

          setIsRecording(true);
          mediaRecorderRef.current.start();
        })
        .catch(error => {
          console.error('Ошибка при получении доступа к микрофону:', error);
        });
    } else {
      alert('Ваш браузер не поддерживает запись голоса.');
    }
  };

  // Функция для остановки записи голоса
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Функция для получения геопозиции 
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const locationMessage = `Геопозиция: ${latitude}, ${longitude}`;
          sendMessage(locationMessage);
        },
        (error) => {
          console.error('Ошибка при получении геопозиции:', error);
          alert('Доступ к геолокации запрещен.');
        }
      );
    } else {
      alert('Ваш браузер не поддерживает геолокацию.');
    }
  };

  // Функция для выбора контакта 
  const chooseContact = () => {
    const contactName = prompt('Введите имя контакта:', '');
    if (contactName) {
      if (!contacts[contactName]) { 
        const updatedContacts = { ...contacts };
        updatedContacts[contactName] = true; 
        setContacts(updatedContacts);
        sendMessage(`Контакт: ${contactName}`);
      } else {
        alert('Этот контакт уже существует!');
      }
    }
  };

  // Функция для открытия диалогового окна выбора файла
  const openFileInput = (acceptType) => {
    fileInputRef.current.setAttribute('accept', acceptType);
    fileInputRef.current.click();
  };

  // Функция для запроса разрешения на уведомления
  const requestNotificationPermission = () => {
    return new Promise((resolve, reject) => {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            resolve(true);
          } else {
            reject('Разрешение на уведомления не получено');
          }
        });
      } else {
        reject('Браузер не поддерживает Web Push Notifications');
      }
    });
  };

  // Функция для создания подписки
  const subscribeUser = async () => {
    try {
      await requestNotificationPermission();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_PUBLIC_KEY' // Замените на ваш публичный ключ
      });
      setSubscription(subscription);

      // Отправьте данные подписки на ваш сервер
      // ...
    } catch (error) {
      console.error('Ошибка при подписке на уведомления:', error);
    }
  };

  // Функция для отправки уведомления
  const sendNotification = (title, body) => {
    if (subscription) {
      fetch('YOUR_SERVER_URL/send_notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription,
          title: title,
          body: body
        })
      })
        .then(response => {
          // Обработка ответа сервера
          // ...
        })
        .catch(error => {
          // Обработка ошибки
          // ...
        });
    }
  };

  // Обработчик события для изменения поля поиска
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Модальное окно подтверждения
  const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
      <div className="modal">
        <div className="modal-content">
          <p>{message}</p>
          <button onClick={onConfirm}>Да</button>
          <button onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h2>Чат</h2>
        <div className="group-list">
          {displayGroups()}
        </div>
        <div className="add-group-button" onClick={addGroup}>+</div>
      </div>
      <div className="chat-content">
        <div className="chat-header">
          {currentChat && (
            <>
              <h3 id="currentChatName">{currentChat}</h3>
              {/* isTyping && <span>Печатает...</span>}  Удален индикатор */}
            </>
          )}
        </div>

        {currentChat && (
          <>
            <div className="message-content-container">
              {DisplayMessages(chats[currentChat])} 
            </div>
            <form id="messageForm" onSubmit={(event) => {
              event.preventDefault();
              sendMessage(event.target.messageInput.value);
            }}>
              <textarea id="messageInput" placeholder="Введите сообщение..." rows="3"></textarea>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden />
              <button type="button" id="fileButton" onClick={() => openFileInput('*/*')}>Файл</button>
              <button type="submit">Отправить</button>
            </form>
            <div className="chat-tools">
              <button id="photoButton" onClick={() => openFileInput('image/*')}>Фото</button>
              <button id="videoButton" onClick={() => openFileInput('video/*')}>Видео</button>
              <button 
                id="voiceButton" 
                onClick={isRecording ? stopRecording : recordVoice} 
                disabled={isRecording && audioBlob !== null} 
              >
                {isRecording ? 'Остановить запись' : 'Запись голоса'}
              </button>
              {audioBlob !== null && (
                <button 
                  id="sendAudioButton" 
                  onClick={() => {
                    sendFileMessage(URL.createObjectURL(audioBlob), 'voice.wav', 'audio');
                    setAudioBlob(null); 
                  }}
                >
                  Отправить запись
                </button>
              )}
              <button id="galleryButton" onClick={() => openFileInput('image/*')}>Галерея</button>
              <button id="locationButton" onClick={getLocation}>Геопозиция</button>
              <button id="contactsButton" onClick={chooseContact}>Контакты</button>
              <button 
                id="notificationsButton"
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  if (notificationsEnabled) {
                    subscribeUser();
                  } else {
                    // Отменить подписку
                    // ...
                  }
                }}
              >
                {notificationsEnabled ? 'Уведомления Вкл' : 'Уведомления Выкл'}
              </button>
            </div>
            <input 
              type="text" 
              id="searchInput" 
              placeholder="Поиск..." 
              value={searchTerm} 
              onChange={handleSearchChange}
            />
          </>
        )}
        {showConfirmationModal && (
          <ConfirmationModal
            message={confirmationMessage}
            onConfirm={confirmationAction}
            onCancel={() => setShowConfirmationModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;