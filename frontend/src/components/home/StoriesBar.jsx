import { IconPlus } from '../common/Icons';

export const StoriesBar = ({
    user,
    myStories,
    otherUsersWithStories,
    friendsWithoutStories,
    setActiveStoryViewer,
    setStoryProgress,
    storyFileInputRef,
    openChat
}) => {
    return (
        <div className="stories-bar">
            {/* 1. Add Story / Your Story Card */}
            <div
                className={`story-card ${myStories.length > 0 ? 'has-active-story' : 'add-story-card'}`}
                onClick={() => {
                    if (myStories.length > 0) {
                        setActiveStoryViewer({
                            author: user,
                            stories: myStories,
                            currentIndex: 0
                        });
                        setStoryProgress(0);
                    } else {
                        storyFileInputRef.current?.click();
                    }
                }}
            >
                {myStories.length > 0 ? (
                    <>
                        <img
                            src={myStories[0].mediaUrl}
                            alt="Your Story"
                            className="story-bg-thumb"
                        />
                        <div className="story-card-overlay"></div>
                        <div className="story-header-row">
                            <div className="story-avatar-ring active-story-ring">
                                {user?.profilePic ? (
                                    <img src={user.profilePic} alt={user.FullName} />
                                ) : (
                                    <span>{user?.FullName?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                            <button
                                type="button"
                                className="add-more-story-btn"
                                title="Add another story"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    storyFileInputRef.current?.click();
                                }}
                            >
                                <IconPlus size={12} />
                            </button>
                        </div>
                        <span className="story-name">Your Story ({myStories.length})</span>
                    </>
                ) : (
                    <>
                        <div className="add-story-avatar-wrapper">
                            <div className="add-story-avatar">
                                {user?.profilePic ? (
                                    <img src={user.profilePic} alt="Your Avatar" />
                                ) : (
                                    <span>{user?.FullName?.[0]?.toUpperCase() || '+'}</span>
                                )}
                            </div>
                            <span className="add-story-badge" aria-hidden="true">
                                <IconPlus size={11} />
                            </span>
                        </div>
                        <span className="story-name">Add Story</span>
                    </>
                )}
            </div>

            {/* 2. Real Stories from Other Users */}
            {otherUsersWithStories.map(({ author, stories: userSts }) => (
                <div
                    key={author._id}
                    className="story-card user-active-story"
                    onClick={() => {
                        setActiveStoryViewer({
                            author,
                            stories: userSts,
                            currentIndex: 0
                        });
                        setStoryProgress(0);
                    }}
                >
                    <img
                        src={userSts[0].mediaUrl}
                        alt={`${author.FullName}'s story`}
                        className="story-bg-thumb"
                    />
                    <div className="story-card-overlay"></div>
                    <div className="story-avatar-ring unviewed-story-ring">
                        <img
                            src={
                                author.profilePic ||
                                'https://api.dicebear.com/7.x/bottts/svg?seed=' + author.FullName
                            }
                            alt={author.FullName}
                        />
                    </div>
                    <span className="story-name">{author.FullName.split(' ')[0]}</span>
                </div>
            ))}

            {/* 3. Other Friends without stories */}
            {friendsWithoutStories.slice(0, 5).map((c) => (
                <div
                    key={c._id}
                    className="story-card friend-story"
                    onClick={() => openChat(c)}
                    title={`Chat with ${c.FullName}`}
                >
                    <div className="story-avatar-ring">
                        <img
                            src={
                                c.profilePic ||
                                'https://api.dicebear.com/7.x/bottts/svg?seed=' + c.FullName
                            }
                            alt={c.FullName}
                        />
                    </div>
                    <span className="story-name">{c.FullName.split(' ')[0]}</span>
                </div>
            ))}
        </div>
    );
};
