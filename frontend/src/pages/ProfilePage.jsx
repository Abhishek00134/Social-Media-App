import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../services/api';

const CHARACTER_SETS = {
    robots: {
        label: '🤖 Robots',
        items: [
            { id: 'bot-shadow', name: 'Shadow', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow' },
            { id: 'bot-nova', name: 'Nova', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nova' },
            { id: 'bot-cyber', name: 'Cyber', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber' },
            { id: 'bot-echo', name: 'Echo', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Echo' },
            { id: 'bot-zen', name: 'Zen', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zen' },
            { id: 'bot-blaze', name: 'Blaze', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Blaze' },
            { id: 'bot-spark', name: 'Spark', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Spark' },
            { id: 'bot-bolt', name: 'Bolt', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bolt' },
        ]
    },
    adventurers: {
        label: '⚔️ Adventurers',
        items: [
            { id: 'adv-felix', name: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
            { id: 'adv-aria', name: 'Aria', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
            { id: 'adv-leo', name: 'Leo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo' },
            { id: 'adv-maya', name: 'Maya', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya' },
            { id: 'adv-zack', name: 'Zack', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zack' },
            { id: 'adv-zoe', name: 'Zoe', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe' },
            { id: 'adv-jasper', name: 'Jasper', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper' },
            { id: 'adv-luna', name: 'Luna', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna' },
        ]
    },
    pixel: {
        label: '👾 Pixel Heroes',
        items: [
            { id: 'pix-knight', name: 'Knight', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Knight' },
            { id: 'pix-ninja', name: 'Ninja', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ninja' },
            { id: 'pix-hero', name: 'Hero', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Hero' },
            { id: 'pix-wizard', name: 'Wizard', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Wizard' },
            { id: 'pix-rogue', name: 'Rogue', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Rogue' },
            { id: 'pix-pixel', name: 'Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel' },
            { id: 'pix-archer', name: 'Archer', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Archer' },
            { id: 'pix-cleric', name: 'Cleric', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Cleric' },
        ]
    },
    personas: {
        label: '✨ Personas',
        items: [
            { id: 'per-sam', name: 'Sam', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sam' },
            { id: 'per-alex', name: 'Alex', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Alex' },
            { id: 'per-sasha', name: 'Sasha', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sasha' },
            { id: 'per-jordan', name: 'Jordan', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jordan' },
            { id: 'per-taylor', name: 'Taylor', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Taylor' },
            { id: 'per-morgan', name: 'Morgan', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Morgan' },
            { id: 'per-casey', name: 'Casey', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Casey' },
            { id: 'per-quinn', name: 'Quinn', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Quinn' },
        ]
    }
};

export const ProfilePage = () => {
    const { user, logout, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Profile state synced with user
    const [status, setStatus] = useState(user?.status || 'Available');
    const [bio, setBio] = useState(user?.bio || 'Hey there! I am using PulseChat.');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [tempBio, setTempBio] = useState(bio);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [onlineVisibility, setOnlineVisibility] = useState(true);
    const [isPrivate, setIsPrivate] = useState(Boolean(user?.isPrivate));
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [removingPhoto, setRemovingPhoto] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');

    // Character Studio Modal state
    const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('robots');
    const [selectedCharacterUrl, setSelectedCharacterUrl] = useState(user?.profilePic || '');
    const [customSeed, setCustomSeed] = useState('');
    const [customStyle, setCustomStyle] = useState('bottts');
    const [savingCharacter, setSavingCharacter] = useState(false);

    const showNotification = (msg) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(''), 3000);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Save Bio to Backend
    const handleSaveBio = async () => {
        try {
            const res = await apiFetch('/api/users/profile', {
                method: 'PUT',
                body: { bio: tempBio }
            });

            if (res.ok) {
                setBio(tempBio);
                updateUser({ bio: tempBio });
                setIsEditingBio(false);
                showNotification('Bio updated successfully!');
            }
        } catch (err) {
            console.error('Failed to update bio:', err);
        }
    };

    // Change Status and update backend
    const handleStatusChange = async (newStatus) => {
        setStatus(newStatus);
        try {
            const res = await apiFetch('/api/users/profile', {
                method: 'PUT',
                body: { status: newStatus }
            });

            if (res.ok) {
                updateUser({ status: newStatus });
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // Handle Profile Privacy (Public / Private) Toggle
    const handlePrivacyToggle = async () => {
        const nextState = !isPrivate;
        setIsPrivate(nextState);
        try {
            const res = await apiFetch('/api/users/privacy', {
                method: 'PUT',
                body: { isPrivate: nextState }
            });

            if (res.ok) {
                updateUser({ isPrivate: nextState });
                showNotification(`Account visibility changed to: ${nextState ? 'Private 🔒' : 'Public 🌐'}`);
            } else {
                setIsPrivate(!nextState);
            }
        } catch (err) {
            console.error('Failed to update privacy:', err);
            setIsPrivate(!nextState);
        }
    };

    // Handle Custom Profile Picture Upload
    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setUploadingPhoto(true);

            try {
                const res = await apiFetch('/api/users/profile', {
                    method: 'PUT',
                    body: { profilePic: base64Data }
                });

                if (res.ok) {
                    const data = await res.json();
                    updateUser({ profilePic: data.user.profilePic });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    showNotification('Profile photo updated successfully!');
                } else {
                    alert('Could not update profile photo. Please try again.');
                }
            } catch (err) {
                console.error('Error uploading photo:', err);
                alert('Upload error. Please try again.');
            } finally {
                setUploadingPhoto(false);
            }
        };

        reader.readAsDataURL(file);
    };

    // Remove custom profile picture and open Character Studio or restore initial
    const handleRemovePhoto = async () => {
        if (!user?.profilePic) return;
        setRemovingPhoto(true);

        try {
            const res = await apiFetch('/api/users/profile', {
                method: 'PUT',
                body: { profilePic: '', removeProfilePic: true }
            });

            if (res.ok) {
                updateUser({ profilePic: '' });
                setSelectedCharacterUrl('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                showNotification('Profile photo removed! You can now choose any character or keep your initial.');
                setIsCharacterModalOpen(true);
            } else {
                alert('Could not remove profile photo. Please try again.');
            }
        } catch (err) {
            console.error('Error removing photo:', err);
            alert('Error removing photo. Please try again.');
        } finally {
            setRemovingPhoto(false);
        }
    };

    // Apply selected character avatar
    const handleApplyCharacter = async (characterUrl) => {
        setSavingCharacter(true);

        try {
            const res = await apiFetch('/api/users/profile', {
                method: 'PUT',
                body: { profilePic: characterUrl, removeProfilePic: !characterUrl }
            });

            if (res.ok) {
                const data = await res.json();
                updateUser({ profilePic: data.user.profilePic || '' });
                if (fileInputRef.current) fileInputRef.current.value = '';
                setIsCharacterModalOpen(false);
                showNotification(
                    characterUrl
                        ? '🎉 Character avatar applied to your profile!'
                        : '🔤 Restored name initial character!'
                );
            } else {
                alert('Failed to update character. Please try again.');
            }
        } catch (err) {
            console.error('Error applying character:', err);
            alert('Failed to apply character. Please try again.');
        } finally {
            setSavingCharacter(false);
        }
    };

    // Date formatting: e.g. "October 2026"
    const joinDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric'
          })
        : 'Recently';

    // User handle from email
    const userHandle = user?.email ? `@${user.email.split('@')[0]}` : '@user';

    const statusOptions = [
        { label: 'Available', dotColor: '#10b981' },
        { label: 'Away', dotColor: '#f59e0b' },
        { label: 'Busy', dotColor: '#ef4444' }
    ];

    const currentStatusOption = statusOptions.find((s) => s.label === status) || statusOptions[0];

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">
                {/* Top Notification Toast */}
                {feedbackMsg && <div className="profile-feedback-toast">{feedbackMsg}</div>}

                {/* Top Navigation Bar */}
                <div className="profile-nav-header">
                    <Link to="/" className="back-to-chats-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        <span>Back to Feed</span>
                    </Link>
                    <span className="profile-heading-title">My Profile</span>
                    <button onClick={handleLogout} className="profile-quick-logout">
                        Sign Out
                    </button>
                </div>

                {/* Hidden File Input for Custom Avatar Upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelect}
                />

                {/* Main Profile Card */}
                <div className="profile-card-modern">
                    {/* Cover Banner */}
                    <div className="profile-cover-banner">
                        <div className="banner-pattern"></div>
                    </div>

                    {/* Header: Avatar, Photo Upload Trigger, Name, Handle */}
                    <div className="profile-hero-section">
                        <div className="profile-avatar-wrapper">
                            <div className="profile-avatar-img-box" onClick={() => fileInputRef.current?.click()} title="Click to change profile picture">
                                {user?.profilePic ? (
                                    <img src={user.profilePic} alt={user?.FullName} />
                                ) : (
                                    <span>{user?.FullName?.[0]?.toUpperCase() || 'U'}</span>
                                )}

                                {/* Camera Upload Badge */}
                                <div className="camera-overlay-badge">
                                    {uploadingPhoto ? '⏳' : '📷'}
                                </div>
                            </div>

                            {onlineVisibility && (
                                <span
                                    className="status-dot-indicator"
                                    style={{ backgroundColor: currentStatusOption.dotColor }}
                                    title={`Status: ${status}`}
                                ></span>
                            )}
                        </div>

                        <div className="profile-photo-buttons-group">
                            <button
                                type="button"
                                className="upload-photo-btn-text"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto || removingPhoto}
                                title="Upload your own photo from device"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                            </button>

                            <button
                                type="button"
                                className="choose-char-btn-text"
                                onClick={() => {
                                    setSelectedCharacterUrl(user?.profilePic || '');
                                    setIsCharacterModalOpen(true);
                                }}
                                title="Choose a character avatar from gallery or create custom"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>Choose Character</span>
                            </button>

                            {user?.profilePic && (
                                <button
                                    type="button"
                                    className="remove-photo-btn-text"
                                    onClick={handleRemovePhoto}
                                    disabled={uploadingPhoto || removingPhoto}
                                    title="Remove photo and pick a character"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                    <span>{removingPhoto ? 'Removing...' : 'Remove Photo'}</span>
                                </button>
                            )}
                        </div>

                        <div className="profile-identity">
                            <div className="name-row">
                                <h2>{user?.FullName || 'Chat Member'}</h2>
                                <span className="verified-badge" title="Verified Member">✓</span>
                            </div>
                            <span className="profile-handle">{userHandle}</span>
                        </div>

                        {/* Status Selector */}
                        <div className="profile-status-bar">
                            <span className="status-bar-label">Current Status:</span>
                            <div className="status-pills-row">
                                {statusOptions.map((opt) => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        className={`status-chip ${status === opt.label ? 'active' : ''}`}
                                        onClick={() => handleStatusChange(opt.label)}
                                    >
                                        <span className="chip-dot" style={{ backgroundColor: opt.dotColor }}></span>
                                        <span>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Body Content */}
                    <div className="profile-content-body">
                        {/* About Me / Bio Card with Redesigned Edit Pill */}
                        <div className="profile-section-card">
                            <div className="section-card-header">
                                <span className="section-card-title">About Me</span>
                                {!isEditingBio ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTempBio(bio);
                                            setIsEditingBio(true);
                                        }}
                                        className="edit-pill-btn"
                                        aria-label="Edit About Me Bio"
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            <path d="m15 5 4 4" />
                                        </svg>
                                        <span>Edit Bio</span>
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleSaveBio} className="save-pill-btn">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        <span>Save</span>
                                    </button>
                                )}
                            </div>

                            {!isEditingBio ? (
                                <p className="bio-text">{bio}</p>
                            ) : (
                                <div className="bio-edit-box">
                                    <textarea
                                        value={tempBio}
                                        onChange={(e) => setTempBio(e.target.value)}
                                        rows={2}
                                        placeholder="Write a short note about yourself..."
                                    />
                                    <div className="bio-edit-actions">
                                        <button onClick={() => setIsEditingBio(false)} className="btn-cancel">
                                            Cancel
                                        </button>
                                        <button onClick={handleSaveBio} className="btn-save">
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Account Information */}
                        <div className="profile-section-card">
                            <span className="section-card-title">Account Details</span>

                            <div className="details-list">
                                <div className="detail-item">
                                    <div className="detail-icon">👤</div>
                                    <div className="detail-info">
                                        <span className="detail-label">Full Name</span>
                                        <span className="detail-value">{user?.FullName}</span>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-icon">✉️</div>
                                    <div className="detail-info">
                                        <span className="detail-label">Email Address</span>
                                        <span className="detail-value">{user?.email}</span>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-icon">🗓️</div>
                                    <div className="detail-info">
                                        <span className="detail-label">Member Since</span>
                                        <span className="detail-value">{joinDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account & Privacy Preferences */}
                        <div className="profile-section-card">
                            <span className="section-card-title">Account & Privacy Settings</span>

                            <div className="preferences-list">
                                {/* Profile Public / Private Switch */}
                                <div className="preference-row">
                                    <div className="pref-info">
                                        <span className="pref-title">
                                            {isPrivate ? 'Private Account 🔒' : 'Public Account 🌐'}
                                        </span>
                                        <span className="pref-desc">
                                            {isPrivate
                                                ? 'Only your accepted friends can see your posts and stories'
                                                : 'Anyone on PulseChat can see your posts and stories'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`toggle-switch ${isPrivate ? 'on' : 'off'}`}
                                        onClick={handlePrivacyToggle}
                                        aria-label="Toggle profile privacy"
                                        title={isPrivate ? 'Switch to Public Account' : 'Switch to Private Account'}
                                    >
                                        <span className="toggle-handle"></span>
                                    </button>
                                </div>

                                <div className="preference-row">
                                    <div className="pref-info">
                                        <span className="pref-title">Message Notifications</span>
                                        <span className="pref-desc">Play sounds for incoming chats</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`toggle-switch ${notificationsEnabled ? 'on' : 'off'}`}
                                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                        aria-label="Toggle notifications"
                                    >
                                        <span className="toggle-handle"></span>
                                    </button>
                                </div>

                                <div className="preference-row">
                                    <div className="pref-info">
                                        <span className="pref-title">Online Activity</span>
                                        <span className="pref-desc">Show when you are active to friends</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`toggle-switch ${onlineVisibility ? 'on' : 'off'}`}
                                        onClick={() => setOnlineVisibility(!onlineVisibility)}
                                        aria-label="Toggle online visibility"
                                    >
                                        <span className="toggle-handle"></span>
                                    </button>
                                </div>

                                <div className="preference-row">
                                    <div className="pref-info">
                                        <span className="pref-title">Theme Mode</span>
                                        <span className="pref-desc">Active: <strong>{theme === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'}</strong></span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`toggle-switch ${theme === 'dark' ? 'off' : 'on'}`}
                                        onClick={toggleTheme}
                                        aria-label="Toggle theme mode"
                                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                                    >
                                        <span className="toggle-handle"></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sign Out Section */}
                        <div className="profile-logout-card">
                            <div>
                                <h4>Signing Out</h4>
                                <p>You can sign back in anytime with your email.</p>
                            </div>
                            <button onClick={handleLogout} className="btn-logout-danger">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Character Studio Modal */}
            {isCharacterModalOpen && (
                <div className="char-modal-backdrop" onClick={() => setIsCharacterModalOpen(false)}>
                    <div className="char-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="char-modal-header">
                            <div className="char-modal-title-area">
                                <span className="char-badge">🎭 Character Studio</span>
                                <h3>Choose Your Profile Character</h3>
                                <p>Select an avatar character, generate a custom one, or use your name initial.</p>
                            </div>
                            <button
                                type="button"
                                className="char-modal-close"
                                onClick={() => setIsCharacterModalOpen(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Live Character Preview Bar */}
                        <div className="char-live-preview-box">
                            <div className="char-preview-avatar">
                                {selectedCharacterUrl ? (
                                    <img src={selectedCharacterUrl} alt="Preview character" />
                                ) : (
                                    <span className="char-initial-preview">{user?.FullName?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                            <div className="char-preview-info">
                                <h4>{selectedCharacterUrl ? 'Selected Character Avatar' : 'Name Initial Character'}</h4>
                                <p>{selectedCharacterUrl ? 'Ready to apply to your profile' : 'Default letter avatar based on your name'}</p>
                            </div>
                            <button
                                type="button"
                                className="char-initial-btn"
                                onClick={() => setSelectedCharacterUrl('')}
                                title="Reset to your initial letter"
                            >
                                🔤 Use Initial ({user?.FullName?.[0]?.toUpperCase() || 'U'})
                            </button>
                        </div>

                        {/* Category Tabs */}
                        <div className="char-category-tabs">
                            {Object.entries(CHARACTER_SETS).map(([key, cat]) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`char-cat-tab ${activeCategory === key ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(key)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Character Cards Grid */}
                        <div className="char-grid-container">
                            {CHARACTER_SETS[activeCategory].items.map((char) => {
                                const isSelected = selectedCharacterUrl === char.url;
                                return (
                                    <button
                                        key={char.id}
                                        type="button"
                                        className={`char-card-item ${isSelected ? 'active' : ''}`}
                                        onClick={() => setSelectedCharacterUrl(char.url)}
                                    >
                                        <div className="char-thumb-wrap">
                                            <img src={char.url} alt={char.name} loading="lazy" />
                                        </div>
                                        <span className="char-card-name">{char.name}</span>
                                        {isSelected && <span className="char-check-badge">✓</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Seed Character Generator */}
                        <div className="char-generator-row">
                            <div className="char-generator-label">
                                <span>✨ Create Any Custom Character:</span>
                            </div>
                            <div className="char-generator-controls">
                                <input
                                    type="text"
                                    placeholder="Type any word (e.g. Hero, Phantom, Luna)..."
                                    value={customSeed}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomSeed(val);
                                        if (val.trim()) {
                                            setSelectedCharacterUrl(`https://api.dicebear.com/7.x/${customStyle}/svg?seed=${encodeURIComponent(val.trim())}`);
                                        }
                                    }}
                                />
                                <select
                                    value={customStyle}
                                    onChange={(e) => {
                                        const newStyle = e.target.value;
                                        setCustomStyle(newStyle);
                                        const seed = customSeed.trim() || user?.FullName || 'Hero';
                                        setSelectedCharacterUrl(`https://api.dicebear.com/7.x/${newStyle}/svg?seed=${encodeURIComponent(seed)}`);
                                    }}
                                >
                                    <option value="bottts">Robots</option>
                                    <option value="adventurer">Adventurer</option>
                                    <option value="pixel-art">Pixel Art</option>
                                    <option value="lorelei">Persona</option>
                                </select>
                                <button
                                    type="button"
                                    className="btn-random-seed"
                                    onClick={() => {
                                        const randomWords = ['Viper', 'Echo', 'Falcon', 'Titan', 'Cosmo', 'Spark', 'Blaze', 'Mystic', 'Ninja', 'Galaxy', 'Storm'];
                                        const pick = randomWords[Math.floor(Math.random() * randomWords.length)] + Math.floor(Math.random() * 99);
                                        setCustomSeed(pick);
                                        setSelectedCharacterUrl(`https://api.dicebear.com/7.x/${customStyle}/svg?seed=${encodeURIComponent(pick)}`);
                                    }}
                                    title="Generate random character"
                                >
                                    🎲 Random
                                </button>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="char-modal-actions">
                            <button
                                type="button"
                                className="btn-char-cancel"
                                onClick={() => setIsCharacterModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-char-apply"
                                disabled={savingCharacter}
                                onClick={() => handleApplyCharacter(selectedCharacterUrl)}
                            >
                                {savingCharacter ? 'Applying Character...' : 'Apply Character to Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
