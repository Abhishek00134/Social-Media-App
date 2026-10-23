import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { ChatMessenger } from '../components/ChatMessenger';

export const UserProfileView = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const { isUserOnline } = useSocket();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isPrivateRestricted, setIsPrivateRestricted] = useState(false);
    const [relationship, setRelationship] = useState('none'); // 'self', 'friends', 'requested', 'incoming', 'none'
    const [friendsCount, setFriendsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [selectedPostMedia, setSelectedPostMedia] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3500);
    };

    // Fetch Target User Profile and Posts
    const loadProfileData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            // 1. Fetch User Summary & Relationship
            const userRes = await apiFetch(`/api/users/${userId}`);
            if (userRes.ok) {
                const userData = await userRes.json();
                const u = userData.user;
                setProfileUser(u);
                setRelationship(u.relationship || 'none');
                setFriendsCount(u.friendsCount || 0);
            } else {
                setProfileUser(null);
                setLoading(false);
                return;
            }

            // 2. Fetch User's Posts (Gated by privacy on backend)
            const postsRes = await apiFetch(`/api/posts/user/${userId}`);
            if (postsRes.ok) {
                const postsData = await postsRes.json();
                setPosts(postsData.posts || []);
                setIsPrivateRestricted(Boolean(postsData.isPrivateRestricted));
            }
        } catch (err) {
            console.error('Error loading user profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, [userId]);

    // Handle Friend Request Actions
    const handleSendRequest = async () => {
        setActionLoading(true);
        try {
            const res = await apiFetch(`/api/users/friend-request/${userId}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                if (data.status === 'friends') {
                    setRelationship('friends');
                    setFriendsCount((prev) => prev + 1);
                    showToast(`🎉 You and ${profileUser?.FullName} are now friends!`);
                    loadProfileData();
                } else {
                    setRelationship('requested');
                    showToast('👋 Friend request sent!');
                }
            } else {
                showToast(data.message || 'Error sending request');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptRequest = async () => {
        setActionLoading(true);
        try {
            const res = await apiFetch(`/api/users/friend-request/${userId}/accept`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setRelationship('friends');
                setFriendsCount((prev) => prev + 1);
                showToast('🎉 Friend request accepted!');
                loadProfileData();
            } else {
                showToast(data.message || 'Error accepting request');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async () => {
        setActionLoading(true);
        try {
            const res = await apiFetch(`/api/users/friend-request/${userId}/reject`, { method: 'POST' });
            if (res.ok) {
                setRelationship('none');
                showToast('Friend request declined');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        setActionLoading(true);
        try {
            const res = await apiFetch(`/api/users/friend-request/${userId}/cancel`, { method: 'POST' });
            if (res.ok) {
                setRelationship('none');
                showToast('Friend request cancelled');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnfriend = async () => {
        if (!window.confirm(`Are you sure you want to remove ${profileUser?.FullName} from your friends?`)) {
            return;
        }
        setActionLoading(true);
        try {
            const res = await apiFetch(`/api/users/unfriend/${userId}`, { method: 'POST' });
            if (res.ok) {
                setRelationship('none');
                setFriendsCount((prev) => Math.max(0, prev - 1));
                showToast('Friend removed');
                loadProfileData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="ig-profile-loading-screen">
                <div className="pulse-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="ig-profile-not-found">
                <h2>User not found</h2>
                <p>The link you followed may be broken, or the user may have been removed.</p>
                <Link to="/" className="btn btn-primary">Go to Feed</Link>
            </div>
        );
    }

    const isMe = String(currentUser?._id) === String(profileUser._id);
    const isOnline = isUserOnline(profileUser._id);
    const username = profileUser.email ? profileUser.email.split('@')[0] : 'user';

    return (
        <div className="ig-profile-container">
            {toastMsg && <div className="profile-feedback-toast">{toastMsg}</div>}

            {/* Back Navigation Bar */}
            <div className="ig-profile-back-bar">
                <button type="button" onClick={() => navigate(-1)} className="ig-back-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    <span>Back</span>
                </button>
                <span className="ig-back-username">@{username}</span>
            </div>

            {/* Instagram Style Header Card */}
            <header className="ig-profile-header">
                <div className="ig-avatar-column">
                    <div className={`ig-avatar-large-wrapper ${isOnline ? 'online-ring' : ''}`}>
                        <img
                            src={
                                profileUser.profilePic ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.FullName}`
                            }
                            alt={profileUser.FullName}
                            className="ig-avatar-large"
                        />
                        {isOnline && <span className="ig-avatar-online-pip" title="Active now"></span>}
                    </div>
                </div>

                <div className="ig-profile-details-column">
                    {/* Row 1: Username & Primary Action Buttons */}
                    <div className="ig-title-actions-row">
                        <h2 className="ig-profile-username">@{username}</h2>

                        <div className="ig-action-buttons">
                            {isMe ? (
                                <Link to="/profile" className="ig-btn-edit-profile">
                                    Edit profile
                                </Link>
                            ) : relationship === 'friends' ? (
                                <>
                                    <button
                                        type="button"
                                        className="ig-btn-chat"
                                        onClick={() => setActiveChatUser(profileUser)}
                                    >
                                        Message
                                    </button>
                                    <button
                                        type="button"
                                        className="ig-btn-friends"
                                        onClick={handleUnfriend}
                                        disabled={actionLoading}
                                        title="Click to remove friend"
                                    >
                                        Friends ✓
                                    </button>
                                </>
                            ) : relationship === 'incoming' ? (
                                <div className="ig-incoming-actions">
                                    <button
                                        type="button"
                                        className="ig-btn-confirm"
                                        onClick={handleAcceptRequest}
                                        disabled={actionLoading}
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        type="button"
                                        className="ig-btn-delete"
                                        onClick={handleRejectRequest}
                                        disabled={actionLoading}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ) : relationship === 'requested' ? (
                                <button
                                    type="button"
                                    className="ig-btn-requested"
                                    onClick={handleCancelRequest}
                                    disabled={actionLoading}
                                    title="Click to cancel request"
                                >
                                    Requested ⏳
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="ig-btn-add-friend"
                                    onClick={handleSendRequest}
                                    disabled={actionLoading}
                                >
                                    Add Friend
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Statistics (Posts count, Friends count, Status) */}
                    <div className="ig-stats-row">
                        <div className="ig-stat-item">
                            <strong>{posts.length}</strong> posts
                        </div>
                        <div className="ig-stat-item">
                            <strong>{friendsCount}</strong> friends
                        </div>
                        <div className="ig-stat-item">
                            <span className="ig-status-pill">{profileUser.status || 'Active'}</span>
                        </div>
                    </div>

                    {/* Row 3: Full Name, Privacy Badge & Bio */}
                    <div className="ig-bio-section">
                        <div className="ig-bio-name-line">
                            <span className="ig-fullname-text">{profileUser.FullName}</span>
                            {profileUser.isPrivate ? (
                                <span className="ig-privacy-chip private">🔒 Private Account</span>
                            ) : (
                                <span className="ig-privacy-chip public">🌐 Public Account</span>
                            )}
                        </div>
                        {profileUser.bio && <p className="ig-bio-text">{profileUser.bio}</p>}
                    </div>
                </div>
            </header>

            {/* Profile Content Divider */}
            <div className="ig-profile-tabs">
                <div className="ig-tab-active">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <span>POSTS</span>
                </div>
            </div>

            {/* Content Area: Private Gate vs Posts Grid */}
            {isPrivateRestricted ? (
                <div className="ig-private-lock-box">
                    <div className="ig-lock-icon-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <h3>This Account is Private</h3>
                    <p>Send a friend request to see their photos, videos, and posts.</p>
                    {relationship === 'none' && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSendRequest}
                            disabled={actionLoading}
                        >
                            Send Friend Request
                        </button>
                    )}
                </div>
            ) : posts.length === 0 ? (
                <div className="ig-no-posts-box">
                    <div className="ig-camera-icon-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                    </div>
                    <h3>No Posts Yet</h3>
                    <p>When {profileUser.FullName.split(' ')[0]} shares photos or thoughts, you will see them here.</p>
                </div>
            ) : (
                <div className="ig-posts-grid">
                    {posts.map((post) => (
                        <div
                            key={post._id}
                            className="ig-post-tile"
                            onClick={() => setSelectedPostMedia(post)}
                        >
                            {post.mediaUrl ? (
                                <img src={post.mediaUrl} alt="Post media" className="ig-tile-media" />
                            ) : (
                                <div className="ig-text-post-tile">
                                    <p>{post.content}</p>
                                </div>
                            )}

                            {/* Hover Overlay with Likes & Comments Count */}
                            <div className="ig-tile-hover-overlay">
                                <span className="ig-tile-stat">
                                    ❤️ {post.likes ? post.likes.length : 0}
                                </span>
                                <span className="ig-tile-stat">
                                    💬 {post.comments ? post.comments.length : 0}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Post Lightbox Modal */}
            {selectedPostMedia && (
                <div className="ig-modal-backdrop" onClick={() => setSelectedPostMedia(null)}>
                    <div className="ig-post-lightbox" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="ig-lightbox-close"
                            onClick={() => setSelectedPostMedia(null)}
                        >
                            ✕
                        </button>

                        <div className="ig-lightbox-content">
                            {selectedPostMedia.mediaUrl ? (
                                <div className="ig-lightbox-media-wrapper">
                                    <img src={selectedPostMedia.mediaUrl} alt="Post detail" />
                                </div>
                            ) : null}

                            <div className="ig-lightbox-sidebar">
                                <div className="ig-lightbox-author-row">
                                    <img
                                        src={
                                            profileUser.profilePic ||
                                            `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.FullName}`
                                        }
                                        alt={profileUser.FullName}
                                        className="ig-lightbox-avatar"
                                    />
                                    <div>
                                        <strong>{profileUser.FullName}</strong>
                                        <span className="ig-lightbox-handle">@{username}</span>
                                    </div>
                                </div>

                                {selectedPostMedia.content && (
                                    <div className="ig-lightbox-caption">
                                        <p>{selectedPostMedia.content}</p>
                                    </div>
                                )}

                                <div className="ig-lightbox-meta">
                                    <span>❤️ {selectedPostMedia.likes?.length || 0} likes</span>
                                    <span>💬 {selectedPostMedia.comments?.length || 0} comments</span>
                                    <span>
                                        {new Date(selectedPostMedia.createdAt).toLocaleDateString([], {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Instant Chat Messenger Modal */}
            {activeChatUser && (
                <ChatMessenger
                    contact={activeChatUser}
                    onClose={() => setActiveChatUser(null)}
                />
            )}
        </div>
    );
};
