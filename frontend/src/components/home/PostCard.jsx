import { IconLike, IconDislike, IconComment, IconShare, IconSend } from '../common/Icons';

export const PostCard = ({
    post,
    user,
    isCommentsOpen,
    toggleComments,
    editingPostId,
    setEditingPostId,
    editPostContent,
    setEditPostContent,
    handleSaveEditPost,
    handleDeletePost,
    handleLike,
    handleDislike,
    handleShare,
    commentInput = '',
    onCommentInputChange,
    handleAddComment
}) => {
    const isAuthor = post.author?._id === user?._id;
    const isLikedByMe = post.likes?.includes(user?._id);
    const isDislikedByMe = post.dislikes?.includes(user?._id);

    return (
        <article className="post-card">
            {/* Post Author Header */}
            <div className="post-header">
                <div className="author-info-group">
                    <div className="author-avatar-box">
                        <img
                            src={
                                post.author?.profilePic ||
                                'https://api.dicebear.com/7.x/bottts/svg?seed=Author'
                            }
                            alt={post.author?.FullName || 'User'}
                        />
                    </div>
                    <div className="author-text-meta">
                        <div className="author-name-line">
                            <h4>{post.author?.FullName || 'PulseChat User'}</h4>
                            {post.feeling?.text && (
                                <span className="post-feeling-badge">
                                    is {post.feeling.emoji} feeling <strong>{post.feeling.text}</strong>
                                </span>
                            )}
                        </div>
                        <span className="post-time-meta">
                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}{' '}
                            · 🌐 Public
                        </span>
                    </div>
                </div>

                {/* Author Actions (Edit & Delete) */}
                {isAuthor && (
                    <div className="post-author-actions">
                        <button
                            type="button"
                            className="post-action-btn edit-action-btn"
                            onClick={() => {
                                setEditingPostId(post._id);
                                setEditPostContent(post.content);
                            }}
                            title="Edit post"
                            aria-label="Edit post"
                        >
                            <svg className="post-action-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Edit</span>
                        </button>
                        <button
                            type="button"
                            className="post-action-btn delete-action-btn"
                            onClick={() => handleDeletePost(post._id)}
                            title="Delete post"
                            aria-label="Delete post"
                        >
                            <svg className="post-action-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Post Text Content or Inline Edit Box */}
            {editingPostId === post._id ? (
                <div className="inline-edit-post-box">
                    <textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        rows={3}
                    />
                    <div className="inline-edit-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setEditingPostId(null)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn-save"
                            onClick={() => handleSaveEditPost(post._id)}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            ) : (
                post.content && <p className="post-text-body">{post.content}</p>
            )}

            {/* Post Media (Image/Video) */}
            {post.mediaUrl && (
                <div className="post-media-container">
                    <img src={post.mediaUrl} alt="Post media" />
                </div>
            )}

            {/* Engagement Counters */}
            {(post.likes?.length > 0 || post.dislikes?.length > 0 || post.comments?.length > 0 || post.shares > 0) && (
                <div className="post-stats-row">
                    <div className="stats-left">
                        {post.likes?.length > 0 && (
                            <span className="likes-counter">
                                <span className="reaction-badge like-badge">
                                    <IconLike size={11} filled />
                                </span>
                                <span>{post.likes.length}</span>
                            </span>
                        )}
                        {post.dislikes?.length > 0 && (
                            <span className="dislikes-counter">
                                <span className="reaction-badge dislike-badge">
                                    <IconDislike size={11} filled />
                                </span>
                                <span>{post.dislikes.length}</span>
                            </span>
                        )}
                    </div>
                    <div className="stats-right">
                        {post.comments?.length > 0 && (
                            <span
                                className="comment-count-btn"
                                onClick={() => toggleComments(post._id)}
                                role="button"
                                tabIndex={0}
                                title={isCommentsOpen ? 'Hide comments' : 'Show comments'}
                            >
                                {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                            </span>
                        )}
                        {post.comments?.length > 0 && post.shares > 0 && <span>·</span>}
                        {post.shares > 0 && (
                            <span>
                                {post.shares} {post.shares === 1 ? 'share' : 'shares'}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons: Like, Dislike, Comment, Share */}
            <div className="post-interaction-bar">
                <button
                    type="button"
                    className={`interaction-btn ${isLikedByMe ? 'liked' : ''}`}
                    onClick={() => handleLike(post._id)}
                    aria-pressed={isLikedByMe}
                >
                    <span className="interaction-icon-box">
                        <IconLike size={18} filled={Boolean(isLikedByMe)} className={`interaction-svg ${isLikedByMe ? 'active-pop' : ''}`} />
                    </span>
                    <span>{isLikedByMe ? 'Liked' : 'Like'}</span>
                </button>

                <button
                    type="button"
                    className={`interaction-btn ${isDislikedByMe ? 'disliked' : ''}`}
                    onClick={() => handleDislike(post._id)}
                    aria-pressed={isDislikedByMe}
                >
                    <span className="interaction-icon-box">
                        <IconDislike size={18} filled={Boolean(isDislikedByMe)} className={`interaction-svg ${isDislikedByMe ? 'active-pop' : ''}`} />
                    </span>
                    <span>{isDislikedByMe ? 'Disliked' : 'Dislike'}</span>
                </button>

                <button
                    type="button"
                    className={`interaction-btn ${isCommentsOpen ? 'comment-active' : ''}`}
                    onClick={() => toggleComments(post._id)}
                    title={isCommentsOpen ? 'Hide comments' : 'Show comments'}
                    aria-expanded={isCommentsOpen}
                >
                    <span className="interaction-icon-box">
                        <IconComment size={18} className="interaction-svg" />
                    </span>
                    <span>Comment</span>
                </button>

                <button
                    type="button"
                    className="interaction-btn"
                    onClick={() => handleShare(post._id)}
                >
                    <span className="interaction-icon-box">
                        <IconShare size={18} className="interaction-svg" />
                    </span>
                    <span>Share</span>
                </button>
            </div>

            {/* Comments Section */}
            {isCommentsOpen && (
                <div className="post-comments-wrapper">
                    <div className="comment-create-row">
                        <div className="comment-user-avatar">
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt={user.FullName} />
                            ) : (
                                <span>{user?.FullName?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                        </div>
                        <div className="comment-input-box">
                            <input
                                type="text"
                                placeholder="Write a friendly comment..."
                                value={commentInput}
                                onChange={(e) => onCommentInputChange(post._id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddComment(post._id);
                                }}
                            />
                            <button
                                type="button"
                                className={`btn-send-comment ${commentInput.trim() ? 'has-content' : ''}`}
                                onClick={() => handleAddComment(post._id)}
                                disabled={!commentInput.trim()}
                                title="Post comment"
                                aria-label="Post comment"
                            >
                                <span>Post</span>
                                <IconSend size={13} className="send-comment-icon" />
                            </button>
                        </div>
                    </div>

                    <div className="comments-stream">
                        {post.comments?.map((c) => (
                            <div key={c._id} className="comment-bubble-item">
                                <img
                                    src={
                                        c.author?.profilePic ||
                                        'https://api.dicebear.com/7.x/bottts/svg?seed=Commenter'
                                    }
                                    alt={c.author?.FullName || 'User'}
                                    className="c-avatar"
                                />
                                <div className="c-content">
                                    <span className="c-author">{c.author?.FullName || 'Friend'}</span>
                                    <p className="c-text">{c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
};
