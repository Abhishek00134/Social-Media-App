import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { useLocation, Link } from 'react-router-dom';
import { getUserId, formatMessageTime } from '../utils/formatters';

export const MessagesPage = () => {
    const { user } = useAuth();
    const { socket, isUserOnline, setActiveChatUserId, clearUnreadForUser, unreadCounts } = useSocket();
    const location = useLocation();

    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [inputText, setInputText] = useState('');
    const [searchFilter, setSearchFilter] = useState('');
    const [isContactTyping, setIsContactTyping] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    const messagesEndRef = useRef(null);
    const chatInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const myIdStr = getUserId(user?._id || user?.id);
    const activeContactId = getUserId(activeContact?._id || activeContact?.id);

    const scrollToBottom = (behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    };

    // 1. Fetch only accepted friends
    const fetchFriends = async () => {
        setLoadingFriends(true);
        try {
            const res = await apiFetch('/api/users/friends');
            if (res.ok) {
                const data = await res.json();
                const list = data.friends || [];
                setFriends(list);

                // If navigation passed a contact state, select it
                if (location.state?.contact) {
                    setActiveContact(location.state.contact);
                } else if (list.length > 0 && !activeContact) {
                    setActiveContact(list[0]);
                }
            }
        } catch (err) {
            console.error('Error fetching friends for messages:', err);
        } finally {
            setLoadingFriends(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    // 2. Fetch conversation messages when activeContact changes
    useEffect(() => {
        if (!activeContactId) {
            setMessages([]);
            return;
        }

        setActiveChatUserId(activeContactId);
        clearUnreadForUser(activeContactId);

        let isMounted = true;
        setLoadingMessages(true);

        const fetchConversation = async () => {
            try {
                const res = await apiFetch(`/api/messages/${activeContactId}`);
                if (res.ok && isMounted) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                    setTimeout(() => scrollToBottom('auto'), 80);
                }
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                if (isMounted) setLoadingMessages(false);
            }
        };

        fetchConversation();

        return () => {
            isMounted = false;
            setActiveChatUserId(null);
        };
    }, [activeContactId]);

    // 3. Socket Event Listeners for Messages Page
    useEffect(() => {
        if (!socket || !activeContactId) return;

        const handleNewMessage = (newMsg) => {
            const senderId = getUserId(newMsg.senderId);
            const receiverId = getUserId(newMsg.receiverId);

            const isConversationMatch =
                (senderId === activeContactId && receiverId === myIdStr) ||
                (senderId === myIdStr && receiverId === activeContactId);

            if (isConversationMatch) {
                setMessages((prev) => {
                    if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
                    return [...prev, newMsg];
                });

                if (senderId === activeContactId) {
                    socket.emit('markAsRead', { senderId: activeContactId });
                    clearUnreadForUser(activeContactId);
                }

                setTimeout(() => scrollToBottom('smooth'), 60);
            }
        };

        const handleUserTyping = ({ senderId }) => {
            if (getUserId(senderId) === activeContactId) {
                setIsContactTyping(true);
                setTimeout(() => scrollToBottom('smooth'), 40);

                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                    setIsContactTyping(false);
                }, 3500);
            }
        };

        const handleUserStopTyping = ({ senderId }) => {
            if (getUserId(senderId) === activeContactId) {
                setIsContactTyping(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
        };

        const handleMessagesRead = ({ readerId }) => {
            if (getUserId(readerId) === activeContactId) {
                setMessages((prev) =>
                    prev.map((m) =>
                        getUserId(m.senderId) === myIdStr
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
    }, [socket, activeContactId, myIdStr]);

    // Handle Input Change & Typing
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);

        if (socket && activeContactId) {
            if (val.trim()) {
                socket.emit('typing', { receiverId: activeContactId });
            } else {
                socket.emit('stopTyping', { receiverId: activeContactId });
            }
        }
    };

    // Handle File Attachment
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

    // Send Message
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        const textToSend = inputText.trim();
        const mediaToSend = selectedMedia?.previewUrl || '';
        const mediaType = selectedMedia?.type || 'text';

        if (!textToSend && !mediaToSend) return;
        if (isSending || !activeContactId) return;

        setIsSending(true);

        if (socket && activeContactId) {
            socket.emit('stopTyping', { receiverId: activeContactId });
        }

        try {
            const res = await apiFetch(`/api/messages/${activeContactId}`, {
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

                setMessages((prev) => {
                    if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
                    return [...prev, newMsg];
                });

                setInputText('');
                setSelectedMedia(null);
                setTimeout(() => scrollToBottom('smooth'), 60);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
            chatInputRef.current?.focus();
        }
    };

    const handleQuickEmoji = (emoji) => {
        setInputText((prev) => prev + emoji);
        chatInputRef.current?.focus();
    };

    const filteredFriends = friends.filter((f) =>
        f.FullName?.toLowerCase().includes(searchFilter.toLowerCase().trim())
    );

    return (
        <div className="instagram-messages-page">
            <div className="direct-messenger-container">
                {/* Left Pane: Conversations / Friends List */}
                <aside className="direct-sidebar-pane">
                    <div className="direct-sidebar-header">
                        <div className="direct-user-badge">
                            <h3>{user?.FullName || 'Messages'}</h3>
                            <span className="direct-sub-badge">Direct Messages</span>
                        </div>
                    </div>

                    {/* Search Friends */}
                    <div className="direct-search-box">
                        <span className="search-ico">🔍</span>
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                        />
                    </div>

                    {/* Friends / Chats List */}
                    <div className="direct-contacts-stream">
                        {loadingFriends ? (
                            <div className="direct-loading-state">
                                <span>Loading friends...</span>
                            </div>
                        ) : filteredFriends.length === 0 ? (
                            <div className="direct-empty-friends">
                                <span className="empty-icon">👥</span>
                                <p>No friends found.</p>
                                <Link to="/" className="btn-find-friends-link">
                                    Find People on Feed
                                </Link>
                            </div>
                        ) : (
                            filteredFriends.map((f) => {
                                const fId = getUserId(f._id || f.id);
                                const isOnline = isUserOnline(fId);
                                const isSelected = fId === activeContactId;
                                const unread = unreadCounts[fId] || 0;

                                return (
                                    <div
                                        key={fId}
                                        className={`direct-chat-item ${isSelected ? 'active' : ''}`}
                                        onClick={() => setActiveContact(f)}
                                    >
                                        <div className="direct-contact-avatar">
                                            <img
                                                src={
                                                    f.profilePic ||
                                                    `https://api.dicebear.com/7.x/bottts/svg?seed=${f.FullName || 'User'}`
                                                }
                                                alt={f.FullName}
                                            />
                                            <span
                                                className={`direct-status-pip ${isOnline ? 'online' : 'offline'}`}
                                            />
                                        </div>

                                        <div className="direct-contact-meta">
                                            <h5>{f.FullName}</h5>
                                            <span className="direct-last-preview">
                                                {isOnline ? 'Active now' : f.status || 'Offline'}
                                            </span>
                                        </div>

                                        {unread > 0 && (
                                            <span className="direct-unread-counter">
                                                {unread > 9 ? '9+' : unread}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Right Pane: Active Chat Thread or Empty Placeholder */}
                <main className="direct-chat-main">
                    {!activeContact ? (
                        <div className="direct-placeholder-viewport">
                            <div className="direct-placeholder-icon">💬</div>
                            <h2>Your Messages</h2>
                            <p>Send private messages, photos, and live reactions to your friends.</p>
                            {friends.length > 0 && (
                                <button
                                    type="button"
                                    className="btn-direct-primary"
                                    onClick={() => setActiveContact(friends[0])}
                                >
                                    Start Chatting
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="direct-thread-box">
                            {/* Thread Header */}
                            <header className="direct-thread-header">
                                <Link
                                    to={`/profile/${activeContactId}`}
                                    className="thread-contact-info-link"
                                    title={`View ${activeContact.FullName}'s profile`}
                                >
                                    <div className="thread-avatar-wrap">
                                        <img
                                            src={
                                                activeContact.profilePic ||
                                                `https://api.dicebear.com/7.x/bottts/svg?seed=${activeContact.FullName || 'User'}`
                                            }
                                            alt={activeContact.FullName}
                                        />
                                        <span
                                            className={`direct-status-pip ${isUserOnline(activeContactId) ? 'online' : 'offline'}`}
                                        />
                                    </div>
                                    <div className="thread-contact-text">
                                        <h4>{activeContact.FullName}</h4>
                                        <span className="thread-presence">
                                            {isContactTyping ? (
                                                <strong className="typing-text">typing...</strong>
                                            ) : isUserOnline(activeContactId) ? (
                                                'Active now'
                                            ) : (
                                                'Offline'
                                            )}
                                        </span>
                                    </div>
                                </Link>

                                <div className="thread-header-actions">
                                    <Link
                                        to={`/profile/${activeContactId}`}
                                        className="btn-thread-action"
                                        title={`View ${activeContact.FullName}'s Profile`}
                                    >
                                        👤 View Profile
                                    </Link>
                                </div>
                            </header>

                            {/* Message Feed Container */}
                            <div className="direct-messages-stream">
                                {loadingMessages ? (
                                    <div className="direct-loading-state">
                                        <p>Loading messages...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="direct-thread-empty">
                                        <div className="thread-empty-avatar">
                                            <img
                                                src={
                                                    activeContact.profilePic ||
                                                    `https://api.dicebear.com/7.x/bottts/svg?seed=${activeContact.FullName || 'User'}`
                                                }
                                                alt={activeContact.FullName}
                                            />
                                        </div>
                                        <h3>{activeContact.FullName}</h3>
                                        <p>You are connected on PulseChat! Send a message or photo to start.</p>
                                        <button
                                            type="button"
                                            className="btn-starter-bubble"
                                            onClick={() => {
                                                setInputText('Hello! Hope you are doing great 👋');
                                                chatInputRef.current?.focus();
                                            }}
                                        >
                                            Hello! Hope you are doing great 👋
                                        </button>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const senderId = getUserId(msg.senderId || msg.sender);
                                        const isMe = Boolean(senderId && myIdStr && senderId === myIdStr);

                                        return (
                                            <div
                                                key={msg._id || msg.id || `direct-msg-${idx}`}
                                                className={`direct-bubble-row ${isMe ? 'outgoing' : 'incoming'}`}
                                            >
                                                {!isMe && (
                                                    <img
                                                        src={
                                                            activeContact.profilePic ||
                                                            `https://api.dicebear.com/7.x/bottts/svg?seed=${activeContact.FullName || 'User'}`
                                                        }
                                                        alt="User"
                                                        className="direct-peer-avatar"
                                                    />
                                                )}

                                                <div className={`direct-msg-bubble ${isMe ? 'me' : 'them'}`}>
                                                    {msg.mediaUrl && (
                                                        <div
                                                            className="direct-media-wrap"
                                                            onClick={() => setLightboxImage(msg.mediaUrl)}
                                                        >
                                                            <img src={msg.mediaUrl} alt="Attachment" />
                                                        </div>
                                                    )}

                                                    {msg.text && (
                                                        <p className="direct-bubble-text">{msg.text}</p>
                                                    )}

                                                    <div className="direct-msg-meta">
                                                        <span className="msg-time">{formatMessageTime(msg.createdAt)}</span>
                                                        {isMe && (
                                                            <span
                                                                className={`msg-tick ${msg.isRead ? 'read' : 'delivered'}`}
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

                                {/* Typing Bubble */}
                                {isContactTyping && (
                                    <div className="direct-bubble-row incoming">
                                        <img
                                            src={
                                                activeContact.profilePic ||
                                                `https://api.dicebear.com/7.x/bottts/svg?seed=${activeContact.FullName || 'User'}`
                                            }
                                            alt="User"
                                            className="direct-peer-avatar"
                                        />
                                        <div className="direct-typing-bubble">
                                            <span className="dot dot-1" />
                                            <span className="dot dot-2" />
                                            <span className="dot dot-3" />
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Media Attachment Staged Strip */}
                            {selectedMedia && (
                                <div className="direct-media-preview-strip">
                                    <div className="media-preview-box">
                                        <img src={selectedMedia.previewUrl} alt="Preview" />
                                        <button
                                            type="button"
                                            className="btn-cancel-media-preview"
                                            onClick={() => setSelectedMedia(null)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <span>Photo ready to send</span>
                                </div>
                            )}

                            {/* Quick Emoji Bar */}
                            <div className="direct-emoji-bar">
                                {['👍', '❤️', '🔥', '😂', '✨', '👏', '😍', '🎉'].map((em) => (
                                    <button
                                        key={em}
                                        type="button"
                                        className="btn-quick-emoji"
                                        onClick={() => handleQuickEmoji(em)}
                                    >
                                        {em}
                                    </button>
                                ))}
                            </div>

                            {/* Bottom Input Field */}
                            <form onSubmit={handleSendMessage} className="direct-input-form">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />

                                <button
                                    type="button"
                                    className="btn-direct-attach"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Attach photo"
                                >
                                    📷
                                </button>

                                <input
                                    ref={chatInputRef}
                                    type="text"
                                    placeholder="Message..."
                                    value={inputText}
                                    onChange={handleInputChange}
                                    disabled={isSending}
                                />

                                <button
                                    type="submit"
                                    className="btn-direct-send"
                                    disabled={isSending || (!inputText.trim() && !selectedMedia)}
                                >
                                    {isSending ? '…' : 'Send'}
                                </button>
                            </form>
                        </div>
                    )}
                </main>
            </div>

            {/* Lightbox Modal */}
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
