import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { getUserId, formatMessageTime } from '../utils/formatters';

export const ChatMessenger = ({ contact: userContact, activeUser, onClose }) => {
    const contact = userContact || activeUser || {};
    const { user } = useAuth();
    const { socket, isUserOnline, setActiveChatUserId, clearUnreadForUser } = useSocket();

    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isContactTyping, setIsContactTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Media attachment state
    const [selectedMedia, setSelectedMedia] = useState(null); // { file, previewUrl, type }
    const [isSending, setIsSending] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    const messagesEndRef = useRef(null);
    const chatInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const contactId = contact?._id || contact?.id;
    const isOnline = isUserOnline(contactId);

    // Auto-scroll to bottom of messages container
    const scrollToBottom = (behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    };

    // 1. Fetch real conversation messages from backend on open
    useEffect(() => {
        if (!contactId) return;

        setActiveChatUserId(String(contactId));
        clearUnreadForUser(String(contactId));

        let isMounted = true;
        setLoadingMessages(true);

        const fetchConversation = async () => {
            try {
                const res = await apiFetch(`/api/messages/${contactId}`);
                if (res.ok && isMounted) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                    setTimeout(() => scrollToBottom('auto'), 100);
                }
            } catch (err) {
                console.error('Failed to load chat history:', err);
            } finally {
                if (isMounted) setLoadingMessages(false);
            }
        };

        fetchConversation();

        return () => {
            isMounted = false;
            setActiveChatUserId(null);
        };
    }, [contactId]);

    const myIdStr = getUserId(user?._id || user?.id);
    const targetContactId = getUserId(contactId);

    // 2. Real-time Socket Event Listeners for Chat
    useEffect(() => {
        if (!socket || !targetContactId) return;

        // Incoming message event
        const handleNewMessage = (newMsg) => {
            const senderId = getUserId(newMsg.senderId);
            const receiverId = getUserId(newMsg.receiverId);

            const isConversationMatch =
                (senderId === targetContactId && receiverId === myIdStr) ||
                (senderId === myIdStr && receiverId === targetContactId);

            if (isConversationMatch) {
                setMessages((prev) => {
                    // Prevent duplicate if already added
                    if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
                    return [...prev, newMsg];
                });

                // If message received from contact, mark it as read immediately
                if (senderId === targetContactId) {
                    socket.emit('markAsRead', { senderId: targetContactId });
                    clearUnreadForUser(targetContactId);
                }

                setTimeout(() => scrollToBottom('smooth'), 80);
            }
        };

        // Incoming typing event
        const handleUserTyping = ({ senderId }) => {
            if (String(senderId) === String(contactId)) {
                setIsContactTyping(true);
                setTimeout(() => scrollToBottom('smooth'), 50);

                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                    setIsContactTyping(false);
                }, 3500);
            }
        };

        // Incoming stop typing event
        const handleUserStopTyping = ({ senderId }) => {
            if (String(senderId) === String(contactId)) {
                setIsContactTyping(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
        };

        // Incoming read receipt event (contact opened our messages)
        const handleMessagesRead = ({ readerId }) => {
            if (String(readerId) === String(contactId)) {
                setMessages((prev) =>
                    prev.map((m) =>
                        String(m.senderId) === String(user?._id)
                            ? { ...m, isRead: true, readAt: m.readAt || new Date().toISOString() }
                            : m
                    )
                );
            }
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('userTyping', handleUserTyping);
        socket.on('userStopTyping', handleUserStopTyping);
        socket.on('messagesRead', handleMessagesRead);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('userTyping', handleUserTyping);
            socket.off('userStopTyping', handleUserStopTyping);
            socket.off('messagesRead', handleMessagesRead);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [socket, contactId, user?._id]);

    // Handle typing in input bar
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);

        if (socket && contactId) {
            if (val.trim()) {
                socket.emit('typing', { receiverId: contactId });
            } else {
                socket.emit('stopTyping', { receiverId: contactId });
            }
        }
    };

    // Handle File Selection (image/photo attachment)
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedMedia({
                file,
                previewUrl: reader.result,
                type: file.type.startsWith('image') ? 'image' : 'file'
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // 3. Send message handler
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        const textToSend = inputText.trim();
        const mediaToSend = selectedMedia?.previewUrl || '';
        const mediaType = selectedMedia?.type || 'text';

        if (!textToSend && !mediaToSend) return;
        if (isSending) return;

        setIsSending(true);

        // Tell socket we stopped typing immediately
        if (socket && contactId) {
            socket.emit('stopTyping', { receiverId: contactId });
        }

        try {
            const res = await apiFetch(`/api/messages/${contactId}`, {
                method: 'POST',
                body: {
                    text: textToSend,
                    mediaUrl: mediaToSend,
                    mediaType: mediaType
                }
            });

            if (res.ok) {
                const data = await res.json();
                const newMsg = data.message;

                // Append sent message
                setMessages((prev) => {
                    if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
                    return [...prev, newMsg];
                });

                setInputText('');
                setSelectedMedia(null);
                setTimeout(() => scrollToBottom('smooth'), 80);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
            chatInputRef.current?.focus();
        }
    };

    // Quick emoji insertion
    const handleQuickEmoji = (emoji) => {
        setInputText((prev) => prev + emoji);
        chatInputRef.current?.focus();
    };

    return (
        <div className={`floating-chat-popup ${isMinimized ? 'minimized' : ''}`}>
            {/* Chat Popup Header */}
            <div className="popup-chat-header" onClick={() => isMinimized && setIsMinimized(false)}>
                <Link
                    to={`/profile/${contactId}`}
                    className="popup-user-meta-link"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onClose) onClose();
                    }}
                    title={`View ${contact?.FullName || 'User'}'s profile`}
                >
                    <div className="popup-avatar-ring">
                        <img
                            src={
                                contact?.profilePic ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${contact?.FullName || 'User'}`
                            }
                            alt={contact?.FullName || 'User'}
                        />
                        <span className={`popup-online-pip ${isOnline ? 'online' : 'offline'}`} />
                    </div>
                    <div className="popup-user-titles">
                        <h5>{contact?.FullName || 'Chat'}</h5>
                        <span className="popup-presence-status">
                            {isContactTyping ? (
                                <strong className="typing-text">typing...</strong>
                            ) : isOnline ? (
                                'Active now'
                            ) : (
                                'Offline'
                            )}
                        </span>
                    </div>
                </Link>

                <div className="popup-header-controls" onClick={(e) => e.stopPropagation()}>
                    {/* Minimize / Expand Toggle */}
                    <button
                        type="button"
                        className="popup-ctrl-btn"
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? 'Maximize' : 'Minimize'}
                    >
                        {isMinimized ? '▢' : '—'}
                    </button>
                    {/* Close Button */}
                    <button
                        type="button"
                        className="popup-ctrl-btn close"
                        onClick={onClose}
                        title="Close chat"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* When not minimized, show full chat content */}
            {!isMinimized && (
                <>
                    {/* Messages Body */}
                    <div className="popup-chat-messages">
                        {loadingMessages ? (
                            <div className="chat-loading-indicator">
                                <span className="spinner-dots"></span>
                                <p>Loading conversation...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="chat-empty-slate">
                                <div className="chat-empty-avatar">
                                    <img
                                        src={
                                            contact.profilePic ||
                                            `https://api.dicebear.com/7.x/bottts/svg?seed=${contact.FullName || 'User'}`
                                        }
                                        alt={contact.FullName}
                                    />
                                </div>
                                <h4>{contact.FullName}</h4>
                                <p>Start your conversation! Say hi or share a photo 👋</p>
                                <div className="chat-quick-starters">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInputText('Hey! How are you doing? 👋');
                                            chatInputRef.current?.focus();
                                        }}
                                    >
                                        Hey! How are you doing? 👋
                                    </button>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const senderId = getUserId(msg.senderId || msg.sender);
                                const isMe = Boolean(senderId && myIdStr && senderId === myIdStr);
                                return (
                                    <div
                                        key={msg._id || msg.id || `msg-${idx}`}
                                        className={`popup-msg-bubble-row ${isMe ? 'outgoing' : 'incoming'}`}
                                    >
                                        {!isMe && (
                                            <img
                                                src={
                                                    contact.profilePic ||
                                                    `https://api.dicebear.com/7.x/bottts/svg?seed=${contact.FullName || 'User'}`
                                                }
                                                alt="User"
                                                className="msg-peer-avatar"
                                            />
                                        )}

                                        <div className={`popup-msg-bubble ${isMe ? 'me' : 'them'}`}>
                                            {/* Media image if present */}
                                            {msg.mediaUrl && (
                                                <div
                                                    className="msg-media-wrapper"
                                                    onClick={() => setLightboxImage(msg.mediaUrl)}
                                                >
                                                    <img src={msg.mediaUrl} alt="Chat attachment" />
                                                </div>
                                            )}

                                            {/* Text message */}
                                            {msg.text && <p className="msg-bubble-text">{msg.text}</p>}

                                            {/* Meta footer: Timestamp & Read Status */}
                                            <div className="msg-meta-footer">
                                                <span className="msg-timestamp">
                                                    {formatMessageTime(msg.createdAt)}
                                                </span>
                                                {isMe && (
                                                    <span
                                                        className={`msg-read-tick ${msg.isRead ? 'read' : 'delivered'}`}
                                                        title={msg.isRead ? 'Seen' : 'Delivered'}
                                                    >
                                                        {msg.isRead ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Real-time Typing Bubble */}
                        {isContactTyping && (
                            <div className="popup-msg-bubble-row incoming typing-bubble-row">
                                <img
                                    src={
                                        contact.profilePic ||
                                        `https://api.dicebear.com/7.x/bottts/svg?seed=${contact.FullName || 'User'}`
                                    }
                                    alt="User"
                                    className="msg-peer-avatar"
                                />
                                <div className="typing-dots-bubble">
                                    <span className="dot dot-1" />
                                    <span className="dot dot-2" />
                                    <span className="dot dot-3" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Media Attachment Preview Bar */}
                    {selectedMedia && (
                        <div className="chat-media-preview-strip">
                            <div className="media-preview-thumb">
                                <img src={selectedMedia.previewUrl} alt="Upload preview" />
                                <button
                                    type="button"
                                    className="btn-remove-media-preview"
                                    onClick={() => setSelectedMedia(null)}
                                    title="Remove attachment"
                                >
                                    ✕
                                </button>
                            </div>
                            <span className="media-preview-note">Image ready to send</span>
                        </div>
                    )}

                    {/* Quick Emojis Bar */}
                    <div className="chat-quick-emojis">
                        {['👍', '❤️', '🔥', '😂', '✨', '👏'].map((em) => (
                            <button
                                key={em}
                                type="button"
                                className="quick-emoji-chip"
                                onClick={() => handleQuickEmoji(em)}
                            >
                                {em}
                            </button>
                        ))}
                    </div>

                    {/* Chat Input Bar */}
                    <form onSubmit={handleSendMessage} className="popup-chat-input-bar">
                        {/* Hidden file input for photos */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        {/* Attachment button */}
                        <button
                            type="button"
                            className="popup-input-action-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach photo"
                        >
                            📷
                        </button>

                        <input
                            ref={chatInputRef}
                            type="text"
                            placeholder="Type a message..."
                            value={inputText}
                            onChange={handleInputChange}
                            disabled={isSending}
                        />

                        <button
                            type="submit"
                            className="popup-send-btn"
                            disabled={isSending || (!inputText.trim() && !selectedMedia)}
                            title="Send message"
                        >
                            {isSending ? '…' : '➤'}
                        </button>
                    </form>
                </>
            )}

            {/* Lightbox for full image preview */}
            {lightboxImage && (
                <div className="chat-lightbox-overlay" onClick={() => setLightboxImage(null)}>
                    <div className="chat-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="chat-lightbox-close"
                            onClick={() => setLightboxImage(null)}
                        >
                            ✕
                        </button>
                        <img src={lightboxImage} alt="Full view" />
                    </div>
                </div>
            )}
        </div>
    );
};
