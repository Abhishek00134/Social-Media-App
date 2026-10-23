const FEELING_OPTIONS = [
    { emoji: '😊', text: 'happy' },
    { emoji: '🎉', text: 'excited' },
    { emoji: '❤️', text: 'loved' },
    { emoji: '😎', text: 'cool' },
    { emoji: '✨', text: 'blessed' },
    { emoji: '🔥', text: 'motivated' },
    { emoji: '☕', text: 'relaxed' },
    { emoji: '😴', text: 'sleepy' },
    { emoji: '💡', text: 'creative' },
    { emoji: '🥳', text: 'celebrating' },
    { emoji: '💪', text: 'strong' },
    { emoji: '🤔', text: 'thoughtful' },
    { emoji: '🚀', text: 'productive' },
    { emoji: '🍕', text: 'hungry' },
    { emoji: '🏖️', text: 'peaceful' }
];

export const CreatePostCard = ({
    user,
    newPostText,
    setNewPostText,
    newMediaData,
    setNewMediaData,
    mediaFileName,
    setMediaFileName,
    selectedFeeling,
    setSelectedFeeling,
    isFeelingPickerOpen,
    setIsFeelingPickerOpen,
    isSubmittingPost,
    postFileInputRef,
    handleCreatePost
}) => {
    return (
        <div className="create-post-card">
            <div className="create-post-top">
                <div className="post-creator-avatar">
                    {user?.profilePic ? (
                        <img src={user.profilePic} alt={user.FullName} />
                    ) : (
                        <span>{user?.FullName?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                </div>
                <input
                    type="text"
                    className="create-post-input"
                    placeholder={`What's on your mind, ${user?.FullName ? user.FullName.split(' ')[0] : 'friend'}?`}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                />
            </div>

            {/* Media Selected Preview */}
            {newMediaData && (
                <div className="media-upload-preview-box">
                    <img src={newMediaData} alt="Upload preview" />
                    <div className="preview-info">
                        <span>{mediaFileName || 'Selected Media'}</span>
                        <button
                            type="button"
                            className="btn-remove-media"
                            onClick={() => {
                                setNewMediaData('');
                                setMediaFileName('');
                            }}
                        >
                            Remove ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Feeling Selected Tag Preview */}
            {selectedFeeling && (
                <div className="feeling-selected-preview-tag">
                    <span className="feeling-tag-icon">{selectedFeeling.emoji}</span>
                    <span className="feeling-tag-text">
                        feeling <strong>{selectedFeeling.text}</strong>
                    </span>
                    <button
                        type="button"
                        className="btn-remove-feeling"
                        onClick={() => setSelectedFeeling(null)}
                        title="Remove feeling"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="create-post-actions-bar">
                <div className="media-buttons-group">
                    <button
                        type="button"
                        className={`action-pill-btn ${newMediaData ? 'active' : ''}`}
                        onClick={() => postFileInputRef.current?.click()}
                    >
                        <span className="btn-icon">📸</span>
                        <span>{newMediaData ? 'Change Photo' : 'Photo / Video'}</span>
                    </button>

                    <div className="feeling-btn-container">
                        <button
                            type="button"
                            className={`action-pill-btn ${selectedFeeling ? 'active' : ''}`}
                            onClick={() => setIsFeelingPickerOpen(!isFeelingPickerOpen)}
                        >
                            <span className="btn-icon">{selectedFeeling ? selectedFeeling.emoji : '😊'}</span>
                            <span>{selectedFeeling ? selectedFeeling.text : 'Feeling'}</span>
                        </button>

                        {/* Feeling Picker Dropdown */}
                        {isFeelingPickerOpen && (
                            <div className="feeling-picker-flyout animate-fade-in">
                                <div className="feeling-picker-header">
                                    <span>How are you feeling?</span>
                                    <button
                                        type="button"
                                        className="btn-close-feeling-flyout"
                                        onClick={() => setIsFeelingPickerOpen(false)}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="feeling-picker-grid">
                                    {FEELING_OPTIONS.map((item) => (
                                        <button
                                            key={item.text}
                                            type="button"
                                            className={`feeling-choice-btn ${selectedFeeling?.text === item.text ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedFeeling(item);
                                                setIsFeelingPickerOpen(false);
                                            }}
                                        >
                                            <span className="choice-emoji">{item.emoji}</span>
                                            <span className="choice-text">{item.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    className="btn-publish-post"
                    onClick={handleCreatePost}
                    disabled={(!newPostText.trim() && !newMediaData && !selectedFeeling) || isSubmittingPost}
                >
                    {isSubmittingPost ? 'Posting...' : 'Post'}
                </button>
            </div>
        </div>
    );
};
