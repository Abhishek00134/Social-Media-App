export const RightSidebar = ({
    friends,
    isUserOnline,
    unreadCounts,
    activeChatUser,
    openChat
}) => {
    return (
        <aside className="social-right-sidebar">
            <div className="contacts-header">
                <h4>Friends ({friends.length})</h4>
                <span className="online-count">
                    ● {friends.filter((f) => isUserOnline(f._id)).length} Online
                </span>
            </div>

            <div className="contacts-list">
                {friends.length === 0 ? (
                    <div className="no-friends-card">
                        <span className="no-friends-icon">👥</span>
                        <h5>No friends yet</h5>
                        <p>Search for people on the left to send friend requests and chat!</p>
                    </div>
                ) : (
                    friends.map((contact) => {
                        const isOnline = isUserOnline(contact._id);
                        const unread = unreadCounts[String(contact._id)] || 0;
                        return (
                            <div
                                key={contact._id}
                                className={`contact-chat-item ${activeChatUser?._id === contact._id ? 'active' : ''}`}
                                onClick={() => openChat(contact)}
                            >
                                <div className="contact-avatar-box">
                                    <img
                                        src={
                                            contact.profilePic ||
                                            `https://api.dicebear.com/7.x/bottts/svg?seed=${contact.FullName || 'Member'}`
                                        }
                                        alt={contact.FullName}
                                    />
                                    <span
                                        className={`status-dot ${isOnline ? 'online-pulse' : 'offline'}`}
                                        title={isOnline ? 'Online' : 'Offline'}
                                    />
                                </div>
                                <div className="contact-info">
                                    <h5>{contact.FullName}</h5>
                                    <span className="contact-sub">
                                        {isOnline ? '🟢 Active now' : contact.status || 'Offline'}
                                    </span>
                                </div>
                                {unread > 0 && (
                                    <span className="contact-unread-badge">
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
};
