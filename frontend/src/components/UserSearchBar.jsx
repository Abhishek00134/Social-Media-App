import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';

export const UserSearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('pulsechat_recent_searches') || '[]');
        } catch {
            return [];
        }
    });

    const searchRef = useRef(null);
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced query search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await apiFetch(`/api/users/search?query=${encodeURIComponent(query.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.users || []);
                }
            } catch (err) {
                console.error('Error searching users:', err);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelectUser = (user) => {
        // Add to recent searches (deduplicated, max 5)
        const updated = [
            user,
            ...recentSearches.filter((item) => String(item._id) !== String(user._id))
        ].slice(0, 5);

        setRecentSearches(updated);
        try {
            localStorage.setItem('pulsechat_recent_searches', JSON.stringify(updated));
        } catch {
            // Ignore localStorage errors
        }

        setIsOpen(false);
        setQuery('');
        navigate(`/profile/${user._id}`);
    };

    const handleRemoveRecent = (e, userId) => {
        e.stopPropagation();
        const updated = recentSearches.filter((item) => String(item._id) !== String(userId));
        setRecentSearches(updated);
        try {
            localStorage.setItem('pulsechat_recent_searches', JSON.stringify(updated));
        } catch {
            // Ignore localStorage errors
        }
    };

    const handleClearAllRecent = (e) => {
        e.stopPropagation();
        setRecentSearches([]);
        try {
            localStorage.removeItem('pulsechat_recent_searches');
        } catch {
            // Ignore localStorage errors
        }
    };

    return (
        <div className="ig-search-container" ref={searchRef}>
            <div className={`ig-search-bar ${isOpen ? 'focused' : ''}`}>
                <svg
                    className="ig-search-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>

                <input
                    type="text"
                    className="ig-search-input"
                    placeholder="Search people..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />

                {query && (
                    <button
                        type="button"
                        className="ig-search-clear-btn"
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Instagram Style Flyout Results Panel */}
            {isOpen && (
                <div className="ig-search-dropdown animate-fade-in">
                    {/* Mode 1: Typing Query -> Show Live Matches */}
                    {query.trim() ? (
                        <div className="ig-search-results-list">
                            <div className="ig-search-section-header">
                                <span>Results</span>
                                {loading && <span className="ig-search-spinner">Searching...</span>}
                            </div>

                            {!loading && results.length === 0 ? (
                                <div className="ig-search-empty">
                                    <p className="ig-empty-title">No results found</p>
                                    <p className="ig-empty-sub">Check the spelling or try searching another name.</p>
                                </div>
                            ) : (
                                results.map((u) => {
                                    const username = u.email ? `@${u.email.split('@')[0]}` : '';
                                    return (
                                        <div
                                            key={u._id}
                                            className="ig-search-user-row"
                                            onClick={() => handleSelectUser(u)}
                                        >
                                            <div className="ig-search-avatar-wrapper">
                                                <img
                                                    src={
                                                        u.profilePic ||
                                                        `https://api.dicebear.com/7.x/bottts/svg?seed=${u.FullName || 'User'}`
                                                    }
                                                    alt={u.FullName}
                                                    className="ig-search-avatar"
                                                />
                                                {u.isPrivate && (
                                                    <span className="ig-private-dot" title="Private Account">
                                                        🔒
                                                    </span>
                                                )}
                                            </div>

                                            <div className="ig-search-user-info">
                                                <div className="ig-search-name-row">
                                                    <span className="ig-search-fullname">{u.FullName}</span>
                                                    {u.isPrivate ? (
                                                        <span className="ig-badge-private">Private</span>
                                                    ) : (
                                                        <span className="ig-badge-public">Public</span>
                                                    )}
                                                </div>
                                                <span className="ig-search-username">{username}</span>
                                                {u.bio && <span className="ig-search-bio-preview">{u.bio}</span>}
                                            </div>

                                            <div className="ig-search-arrow">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6"></polyline>
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        /* Mode 2: Empty Query -> Show Recent Searches */
                        <div className="ig-search-recents-list">
                            <div className="ig-search-section-header">
                                <span className="header-title">Recent</span>
                                {recentSearches.length > 0 && (
                                    <button
                                        type="button"
                                        className="btn-clear-all-recents"
                                        onClick={handleClearAllRecent}
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {recentSearches.length === 0 ? (
                                <div className="ig-search-empty recents-empty">
                                    <p className="ig-empty-title">No recent searches.</p>
                                </div>
                            ) : (
                                recentSearches.map((u) => {
                                    const username = u.email ? `@${u.email.split('@')[0]}` : '';
                                    return (
                                        <div
                                            key={u._id}
                                            className="ig-search-user-row"
                                            onClick={() => handleSelectUser(u)}
                                        >
                                            <div className="ig-search-avatar-wrapper">
                                                <img
                                                    src={
                                                        u.profilePic ||
                                                        `https://api.dicebear.com/7.x/bottts/svg?seed=${u.FullName || 'User'}`
                                                    }
                                                    alt={u.FullName}
                                                    className="ig-search-avatar"
                                                />
                                            </div>

                                            <div className="ig-search-user-info">
                                                <div className="ig-search-name-row">
                                                    <span className="ig-search-fullname">{u.FullName}</span>
                                                    {u.isPrivate && (
                                                        <span className="ig-badge-private">Private</span>
                                                    )}
                                                </div>
                                                <span className="ig-search-username">{username}</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn-remove-recent-item"
                                                onClick={(e) => handleRemoveRecent(e, u._id)}
                                                title="Remove from recent"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
