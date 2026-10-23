import { Link } from 'react-router-dom';
import { IconFeed, IconMessages, IconProfileShield } from '../common/Icons';

export const LeftSidebar = ({
    user,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    friends,
    friendRequests,
    openChat,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleCancelFriendRequest,
    handleSendFriendRequest,
    fetchPosts,
    totalUnreadMessages
}) => {
    return (
        <aside className="social-left-sidebar">
            <Link to="/profile" className="sidebar-user-card">
                <div className="sidebar-avatar-box">
                    {user?.profilePic ? (
                        <img src={user.profilePic} alt={user.FullName} />
                    ) : (
                        <span>{user?.FullName?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                </div>
                <div className="sidebar-user-info">
                    <h4>{user?.FullName || 'User Name'}</h4>
                    <span className="user-privacy-tag">
                        {user?.isPrivate ? '🔒 Private Account' : '🌐 Public Account'}
                    </span>
                </div>
            </Link>

            {/* Find People Search Box */}
            <div className="people-search-box">
                <span className="search-box-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Find people on PulseChat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Search Results Dropdown List with Friend Actions */}
            {searchQuery && (
                <div className="search-results-dropdown">
                    <span className="dropdown-title">People Found ({searchResults.length})</span>
                    {searchResults.length === 0 && !isSearching ? (
                        <p className="no-results">No people found matching &quot;{searchQuery}&quot;</p>
                    ) : (
                        searchResults.map((u) => {
                            const uId = String(u._id);
                            const isFriend = friends.some((f) => String(f._id) === uId);
                            const isIncoming = friendRequests.incoming.some(
                                (r) => String(r.from?._id || r.from) === uId
                            );
                            const isOutgoing = friendRequests.outgoing.some(
                                (r) => String(r.to?._id || r.to) === uId
                            );

                            return (
                                <div key={u._id} className="search-user-item">
                                    <Link
                                        to={`/profile/${u._id}`}
                                        className="search-user-link-wrap"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <div className="search-avatar">
                                            {u.profilePic ? (
                                                <img src={u.profilePic} alt={u.FullName} />
                                            ) : (
                                                <span>{u.FullName?.[0]?.toUpperCase() || 'U'}</span>
                                            )}
                                        </div>
                                        <div className="search-meta">
                                            <h5>{u.FullName}</h5>
                                            <span className="search-sub-tag">
                                                {u.isPrivate ? '🔒 Private' : '🌐 Public'}
                                            </span>
                                        </div>
                                    </Link>
                                    <div className="search-actions-group">
                                        {isFriend ? (
                                            <button
                                                type="button"
                                                className="btn-friend-chat"
                                                onClick={() => openChat(u)}
                                            >
                                                💬 Chat
                                            </button>
                                        ) : isIncoming ? (
                                            <button
                                                type="button"
                                                className="btn-friend-accept"
                                                onClick={() => handleAcceptFriendRequest(u._id)}
                                            >
                                                Accept
                                            </button>
                                        ) : isOutgoing ? (
                                            <button
                                                type="button"
                                                className="btn-friend-requested"
                                                onClick={() => handleCancelFriendRequest(u._id)}
                                                title="Click to cancel"
                                            >
                                                Requested ⏳
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn-friend-add"
                                                onClick={() => handleSendFriendRequest(u._id)}
                                            >
                                                + Add Friend
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Pending Friend Requests Card */}
            {friendRequests.incoming.length > 0 && (
                <div className="sidebar-friend-requests-widget">
                    <div className="widget-header">
                        <h5>Friend Requests</h5>
                        <span className="req-count-badge">{friendRequests.incoming.length}</span>
                    </div>
                    <div className="widget-requests-list">
                        {friendRequests.incoming.map((req) => {
                            const sender = req.from || {};
                            return (
                                <div key={req._id || sender._id} className="widget-req-item">
                                    <div className="widget-req-avatar">
                                        <img
                                            src={
                                                sender.profilePic ||
                                                `https://api.dicebear.com/7.x/bottts/svg?seed=${sender.FullName || 'User'}`
                                            }
                                            alt={sender.FullName}
                                        />
                                    </div>
                                    <div className="widget-req-info">
                                        <h6>{sender.FullName}</h6>
                                        <span>{sender.isPrivate ? '🔒 Private' : '🌐 Public'}</span>
                                    </div>
                                    <div className="widget-req-btns">
                                        <button
                                            type="button"
                                            className="btn-confirm-req"
                                            onClick={() => handleAcceptFriendRequest(sender._id)}
                                            title="Accept friend request"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-delete-req"
                                            onClick={() => handleRejectFriendRequest(sender._id)}
                                            title="Decline request"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation Links */}
            <nav className="sidebar-nav-menu">
                <button
                    type="button"
                    className="nav-menu-item active"
                    onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        fetchPosts();
                    }}
                    title="Feed (Scroll to top & refresh)"
                >
                    <span className="menu-icon-wrapper">
                        <IconFeed />
                    </span>
                    <span>Feed</span>
                </button>
                <Link to="/messages" className="nav-menu-item nav-messages-menu-item" title="Messages">
                    <span className="menu-icon-wrapper">
                        <IconMessages />
                    </span>
                    <span>Messages</span>
                    {totalUnreadMessages > 0 && (
                        <span className="badge-pill unread-active" title={`${totalUnreadMessages} unread messages`}>
                            {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                        </span>
                    )}
                </Link>
                <Link to="/profile" className="nav-menu-item" title="Profile & Privacy">
                    <span className="menu-icon-wrapper">
                        <IconProfileShield />
                    </span>
                    <span>Profile & Privacy</span>
                </Link>
            </nav>
        </aside>
    );
};
