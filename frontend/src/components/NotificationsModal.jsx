import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/api';
import { formatTimeAgo } from '../utils/formatters';

export const NotificationsModal = ({ isOpen, onClose, onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const modalRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleMarkAllRead = async () => {
        try {
            const res = await apiFetch('/api/notifications/mark-read', {
                method: 'PUT'
            });
            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error marking notifications read:', err);
        }
    };

    const handleClearAll = async () => {
        try {
            const res = await apiFetch('/api/notifications/clear', {
                method: 'DELETE'
            });
            if (res.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="notifications-dropdown-menu" ref={modalRef}>
            <div className="notif-dropdown-header">
                <div className="notif-title-row">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                        <span className="notif-unread-badge">{unreadCount} new</span>
                    )}
                </div>
                <div className="notif-actions-row">
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="notif-text-btn"
                            onClick={handleMarkAllRead}
                            title="Mark all as read"
                        >
                            Mark all read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            type="button"
                            className="notif-text-btn clear"
                            onClick={handleClearAll}
                            title="Clear all"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="notif-dropdown-body">
                {loading && notifications.length === 0 ? (
                    <div className="notif-empty-state">
                        <span className="notif-spinner"></span>
                        <p>Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notif-empty-state">
                        <span className="notif-empty-icon">🔔</span>
                        <h5>All caught up!</h5>
                        <p>No notifications right now. When someone reacts to your stories or posts, you'll see them here.</p>
                    </div>
                ) : (
                    <div className="notif-list">
                        {notifications.map((notif) => (
                            <div
                                key={notif._id}
                                className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                onClick={() => {
                                    if (onNotificationClick) onNotificationClick(notif);
                                }}
                            >
                                <div className="notif-sender-avatar-wrap">
                                    <div className="notif-sender-avatar">
                                        {notif.sender?.profilePic ? (
                                            <img
                                                src={notif.sender.profilePic}
                                                alt={notif.sender?.FullName || 'User'}
                                            />
                                        ) : (
                                            <span>
                                                {notif.sender?.FullName?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    {notif.reactionEmoji ? (
                                        <span className="notif-reaction-bubble">
                                            {notif.reactionEmoji}
                                        </span>
                                    ) : (
                                        <span className="notif-type-bubble">💬</span>
                                    )}
                                </div>

                                <div className="notif-content">
                                    <p className="notif-message">
                                        <strong>{notif.sender?.FullName || 'Someone'}</strong>{' '}
                                        {notif.reactionEmoji
                                            ? `reacted ${notif.reactionEmoji} to your story`
                                            : notif.message}
                                    </p>
                                    <span className="notif-timestamp">
                                        {formatTimeAgo(notif.createdAt)}
                                    </span>
                                </div>

                                {notif.story?.mediaUrl && (
                                    <div className="notif-story-thumb">
                                        {notif.story.mediaType === 'video' ? (
                                            <video src={notif.story.mediaUrl} muted />
                                        ) : (
                                            <img src={notif.story.mediaUrl} alt="Story preview" />
                                        )}
                                    </div>
                                )}

                                {!notif.isRead && <span className="notif-unread-dot"></span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsModal;
