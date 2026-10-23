import { IconClose } from '../common/Icons';
import { formatTimeAgo } from '../../utils/formatters';

export const StoryViewerModal = ({
    activeStoryViewer,
    setActiveStoryViewer,
    storyProgress,
    setStoryProgress,
    setIsStoryPaused,
    floatingReactions,
    isStoryInsightsOpen,
    setIsStoryInsightsOpen,
    insightsTab,
    setInsightsTab,
    user,
    handleDeleteStory,
    handleSendReaction
}) => {
    if (!activeStoryViewer || !activeStoryViewer.stories?.length) return null;

    const currentStory = activeStoryViewer.stories[activeStoryViewer.currentIndex] || {};
    const isOwner = activeStoryViewer.author?._id === user?._id;

    return (
        <div
            className="story-viewer-overlay"
            onClick={() => setActiveStoryViewer(null)}
            onMouseDown={() => setIsStoryPaused(true)}
            onMouseUp={() => setIsStoryPaused(false)}
            onTouchStart={() => setIsStoryPaused(true)}
            onTouchEnd={() => setIsStoryPaused(false)}
        >
            <div className="story-viewer-wrapper" onClick={(e) => e.stopPropagation()}>
                {/* Top Multi-Story Progress Bars */}
                <div className="story-progress-bars">
                    {activeStoryViewer.stories.map((st, idx) => {
                        let fillWidth = '0%';
                        if (idx < activeStoryViewer.currentIndex) fillWidth = '100%';
                        else if (idx === activeStoryViewer.currentIndex) fillWidth = `${storyProgress}%`;

                        return (
                            <div key={st._id || idx} className="story-progress-track">
                                <div
                                    className="story-progress-fill"
                                    style={{ width: fillWidth }}
                                ></div>
                            </div>
                        );
                    })}
                </div>

                {/* Viewer Header */}
                <div className="story-viewer-header">
                    <div className="story-author-info">
                        <img
                            src={
                                activeStoryViewer.author?.profilePic ||
                                'https://api.dicebear.com/7.x/bottts/svg?seed=' +
                                    (activeStoryViewer.author?.FullName || 'User')
                            }
                            alt="Author"
                        />
                        <div>
                            <h5>{activeStoryViewer.author?.FullName || 'Story'}</h5>
                            <span>
                                {currentStory.createdAt
                                    ? new Date(currentStory.createdAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                      })
                                    : 'Just now'}
                            </span>
                        </div>
                    </div>

                    <div className="story-viewer-top-actions">
                        {isOwner && (
                            <>
                                <button
                                    type="button"
                                    className="btn-story-insights-header"
                                    title="View reactions & activity"
                                    onClick={() => {
                                        setIsStoryInsightsOpen(true);
                                        setIsStoryPaused(true);
                                    }}
                                >
                                    📊 Activity ({currentStory.reactions?.length || 0})
                                </button>
                                <button
                                    type="button"
                                    className="btn-story-delete"
                                    title="Delete this story"
                                    aria-label="Delete this story"
                                    onClick={() => handleDeleteStory(currentStory._id)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            className="btn-story-close"
                            onClick={() => {
                                setActiveStoryViewer(null);
                                setIsStoryInsightsOpen(false);
                            }}
                            title="Close story"
                            aria-label="Close story"
                        >
                            <IconClose size={18} />
                        </button>
                    </div>
                </div>

                {/* Story Content Viewport */}
                <div className="story-viewport-content">
                    {currentStory.mediaType === 'video' ? (
                        <video
                            src={currentStory.mediaUrl}
                            autoPlay
                            muted
                            playsInline
                            className="story-full-media"
                        />
                    ) : (
                        <img
                            src={currentStory.mediaUrl}
                            alt="Story content"
                            className="story-full-media"
                        />
                    )}

                    {currentStory.caption && (
                        <div className="story-caption-overlay">
                            <span className="story-caption-icon">💬</span>
                            <p>{currentStory.caption}</p>
                        </div>
                    )}

                    {/* Floating Reaction Burst Particles */}
                    {floatingReactions.map((p) => (
                        <span
                            key={p.id}
                            className="story-floating-emoji"
                            style={{
                                left: `${p.left}%`,
                                animationDelay: `${p.animDelay}s`,
                                fontSize: `${p.size}px`
                            }}
                        >
                            {p.emoji}
                        </span>
                    ))}

                    {/* Left / Right Click Nav Targets */}
                    <div
                        className="story-nav-tap left"
                        title="Previous story"
                        onClick={() => {
                            if (activeStoryViewer.currentIndex > 0) {
                                setActiveStoryViewer({
                                    ...activeStoryViewer,
                                    currentIndex: activeStoryViewer.currentIndex - 1
                                });
                                setStoryProgress(0);
                            }
                        }}
                    ></div>
                    <div
                        className="story-nav-tap right"
                        title="Next story"
                        onClick={() => {
                            if (activeStoryViewer.currentIndex < activeStoryViewer.stories.length - 1) {
                                setActiveStoryViewer({
                                    ...activeStoryViewer,
                                    currentIndex: activeStoryViewer.currentIndex + 1
                                });
                                setStoryProgress(0);
                            } else {
                                setActiveStoryViewer(null);
                            }
                        }}
                    ></div>
                </div>

                {/* Footer Reactions / Owner Insights */}
                {isOwner ? (
                    <div className="story-owner-footer">
                        <button
                            type="button"
                            className="btn-story-insights"
                            onClick={() => {
                                setIsStoryInsightsOpen(true);
                                setIsStoryPaused(true);
                            }}
                        >
                            <div className="insights-preview-avatars">
                                {(currentStory.reactions || []).slice(-3).map((r, i) => (
                                    <span key={i} className="insights-emoji-icon">
                                        {r.emoji}
                                    </span>
                                ))}
                            </div>
                            <div className="insights-text">
                                <span className="insights-main-label">
                                    🔥 {currentStory.reactions?.length || 0} Reactions • 👁️ {currentStory.viewers?.length || 0} Views
                                </span>
                                <span className="insights-sub-label">Tap to view who reacted & at what time</span>
                            </div>
                            <span className="insights-chevron">▲</span>
                        </button>
                    </div>
                ) : (
                    <div className="story-reaction-footer">
                        {['❤️', '🔥', '👏', '😂', '😍', '🎉'].map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                className="story-reaction-btn"
                                title={`React with ${emoji}`}
                                onClick={() => handleSendReaction(currentStory._id, emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                {/* Story Activity & Reactions Bottom Sheet */}
                {isStoryInsightsOpen && (
                    <div
                        className="story-insights-overlay"
                        onClick={() => {
                            setIsStoryInsightsOpen(false);
                            setIsStoryPaused(false);
                        }}
                    >
                        <div className="story-insights-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="insights-sheet-header">
                                <div>
                                    <h4>Story Activity</h4>
                                    <p>
                                        {currentStory.reactions?.length || 0} Reactions • {currentStory.viewers?.length || 0} Views
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="insights-sheet-close"
                                    onClick={() => {
                                        setIsStoryInsightsOpen(false);
                                        setIsStoryPaused(false);
                                    }}
                                    title="Close activity"
                                    aria-label="Close activity"
                                >
                                    <IconClose size={16} />
                                </button>
                            </div>

                            <div className="insights-tabs">
                                <button
                                    type="button"
                                    className={`insights-tab-btn ${insightsTab === 'reactions' ? 'active' : ''}`}
                                    onClick={() => setInsightsTab('reactions')}
                                >
                                    Reactions ({currentStory.reactions?.length || 0})
                                </button>
                                <button
                                    type="button"
                                    className={`insights-tab-btn ${insightsTab === 'viewers' ? 'active' : ''}`}
                                    onClick={() => setInsightsTab('viewers')}
                                >
                                    Viewers ({currentStory.viewers?.length || 0})
                                </button>
                            </div>

                            <div className="insights-sheet-body">
                                {insightsTab === 'reactions' ? (
                                    (currentStory.reactions || []).length === 0 ? (
                                        <div className="insights-empty">
                                            <span className="insights-empty-icon">💭</span>
                                            <h5>No reactions yet</h5>
                                            <p>When friends react to your story, you'll see who sent what reaction and at what time right here.</p>
                                        </div>
                                    ) : (
                                        <div className="insights-list">
                                            {[...(currentStory.reactions || [])].reverse().map((reaction, idx) => (
                                                <div key={idx} className="insights-user-row">
                                                    <div className="insights-user-avatar">
                                                        {reaction.user?.profilePic ? (
                                                            <img src={reaction.user.profilePic} alt={reaction.user?.FullName || 'User'} />
                                                        ) : (
                                                            <span>{reaction.user?.FullName?.[0]?.toUpperCase() || 'U'}</span>
                                                        )}
                                                    </div>
                                                    <div className="insights-user-info">
                                                        <h6>{reaction.user?.FullName || 'User'}</h6>
                                                        <span className="insights-time">
                                                            Sent {formatTimeAgo(reaction.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="insights-reaction-display">
                                                        <span className="insights-emoji-badge">{reaction.emoji}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    (currentStory.viewers || []).length === 0 ? (
                                        <div className="insights-empty">
                                            <span className="insights-empty-icon">👁️</span>
                                            <h5>No views yet</h5>
                                            <p>People who view this story will be listed here.</p>
                                        </div>
                                    ) : (
                                        <div className="insights-list">
                                            {(currentStory.viewers || []).map((viewer, idx) => (
                                                <div key={idx} className="insights-user-row">
                                                    <div className="insights-user-avatar">
                                                        {viewer.profilePic ? (
                                                            <img src={viewer.profilePic} alt={viewer.FullName || 'Viewer'} />
                                                        ) : (
                                                            <span>{viewer?.FullName?.[0]?.toUpperCase() || 'U'}</span>
                                                        )}
                                                    </div>
                                                    <div className="insights-user-info">
                                                        <h6>{viewer.FullName || 'User'}</h6>
                                                        <span className="insights-time">Viewed story</span>
                                                    </div>
                                                    <span className="insights-view-check">👁️</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
