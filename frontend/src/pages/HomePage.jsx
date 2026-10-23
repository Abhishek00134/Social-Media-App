import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { ChatMessenger } from '../components/ChatMessenger';
import { LeftSidebar } from '../components/home/LeftSidebar';
import { RightSidebar } from '../components/home/RightSidebar';
import { StoriesBar } from '../components/home/StoriesBar';
import { CreatePostCard } from '../components/home/CreatePostCard';
import { PostCard } from '../components/home/PostCard';
import { CreateStoryModal } from '../components/home/CreateStoryModal';
import { StoryViewerModal } from '../components/home/StoryViewerModal';

export const HomePage = () => {
    const { user } = useAuth();
    const { isUserOnline, unreadCounts, socket } = useSocket();
    const postFileInputRef = useRef(null);
    const storyFileInputRef = useRef(null);

    // Dynamic Posts state from MongoDB
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // Real-time Stories state
    const [stories, setStories] = useState([]);
    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
    const [storyMediaData, setStoryMediaData] = useState('');
    const [storyMediaType, setStoryMediaType] = useState('image');
    const [storyCaption, setStoryCaption] = useState('');
    const [isSubmittingStory, setIsSubmittingStory] = useState(false);

    // Fullscreen Story Viewer State
    const [activeStoryViewer, setActiveStoryViewer] = useState(null); // { author, stories: [], currentIndex: 0 }
    const [storyProgress, setStoryProgress] = useState(0);
    const [isStoryPaused, setIsStoryPaused] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [isStoryInsightsOpen, setIsStoryInsightsOpen] = useState(false);
    const [insightsTab, setInsightsTab] = useState('reactions'); // 'reactions' | 'viewers'

    // Create Post Form state
    const [newPostText, setNewPostText] = useState('');
    const [newMediaData, setNewMediaData] = useState('');
    const [mediaFileName, setMediaFileName] = useState('');
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);

    // Post Edit state
    const [editingPostId, setEditingPostId] = useState(null);
    const [editPostContent, setEditPostContent] = useState('');

    // Feeling / Activity State
    const [selectedFeeling, setSelectedFeeling] = useState(null); // { emoji: '😊', text: 'happy' }
    const [isFeelingPickerOpen, setIsFeelingPickerOpen] = useState(false);

    // Comments & Search state (Comments shown only when user explicitly toggles/clicks comments button)
    const [openCommentsPosts, setOpenCommentsPosts] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const toggleComments = (postId) => {
        setOpenCommentsPosts((prev) => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Accepted Friends & Friend Requests state
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] });
    const [toastMsg, setToastMsg] = useState('');

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    // Floating Real-time Messenger State
    const [activeChatUser, setActiveChatUser] = useState(null);

    // 1. Fetch Posts from Backend (Privacy filtered)
    const fetchPosts = async (showLoader = false) => {
        if (showLoader) setLoadingPosts(true);
        try {
            const res = await apiFetch('/api/posts');
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            if (showLoader) setLoadingPosts(false);
        }
    };

    // 2. Fetch Stories from Backend (Privacy filtered)
    const fetchStories = async () => {
        try {
            const res = await apiFetch('/api/stories');
            if (res.ok) {
                const data = await res.json();
                setStories(data.stories || []);
            }
        } catch (err) {
            console.error('Error fetching stories:', err);
        }
    };

    // 3. Fetch Friends & Requests
    const fetchFriendsAndRequests = async () => {
        try {
            const [friendsRes, reqRes] = await Promise.all([
                apiFetch('/api/users/friends'),
                apiFetch('/api/users/friend-requests')
            ]);
            if (friendsRes.ok) {
                const data = await friendsRes.json();
                setFriends(data.friends || []);
            }
            if (reqRes.ok) {
                const data = await reqRes.json();
                setFriendRequests({
                    incoming: data.incoming || [],
                    outgoing: data.outgoing || []
                });
            }
        } catch (err) {
            console.error('Error fetching friends and requests:', err);
        }
    };

    // Friend Request Actions
    const handleSendFriendRequest = async (targetUserId) => {
        try {
            const res = await apiFetch(`/api/users/friend-request/${targetUserId}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Friend request sent!');
                fetchFriendsAndRequests();
            } else {
                showToast(data.message || 'Could not send friend request');
            }
        } catch (err) {
            console.error('Error sending friend request:', err);
        }
    };

    const handleAcceptFriendRequest = async (senderUserId) => {
        try {
            const res = await apiFetch(`/api/users/friend-request/${senderUserId}/accept`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Friend request accepted!');
                fetchFriendsAndRequests();
                fetchPosts(false);
                fetchStories();
            }
        } catch (err) {
            console.error('Error accepting friend request:', err);
        }
    };

    const handleRejectFriendRequest = async (senderUserId) => {
        try {
            const res = await apiFetch(`/api/users/friend-request/${senderUserId}/reject`, { method: 'POST' });
            if (res.ok) {
                showToast('Friend request declined');
                fetchFriendsAndRequests();
            }
        } catch (err) {
            console.error('Error rejecting friend request:', err);
        }
    };

    const handleCancelFriendRequest = async (targetUserId) => {
        try {
            const res = await apiFetch(`/api/users/friend-request/${targetUserId}/cancel`, { method: 'POST' });
            if (res.ok) {
                showToast('Friend request cancelled');
                fetchFriendsAndRequests();
            }
        } catch (err) {
            console.error('Error cancelling friend request:', err);
        }
    };

    useEffect(() => {
        // Initial load
        fetchPosts(true);
        fetchStories();
        fetchFriendsAndRequests();

        // Real-time polling every 6 seconds for dynamic live updates
        const intervalId = setInterval(() => {
            fetchPosts(false);
            fetchStories();
            fetchFriendsAndRequests();
        }, 6000);

        // Instant refresh on window focus
        const handleFocus = () => {
            fetchPosts(false);
            fetchStories();
            fetchFriendsAndRequests();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Real-time friend request socket notifications
    useEffect(() => {
        if (!socket) return;
        const onIncomingReq = ({ from }) => {
            showToast(`👋 ${from?.FullName || 'Someone'} sent you a friend request!`);
            fetchFriendsAndRequests();
        };
        const onReqAccepted = ({ friend }) => {
            showToast(`🎉 ${friend?.FullName || 'Friend'} accepted your friend request!`);
            fetchFriendsAndRequests();
            fetchPosts(false);
            fetchStories();
        };
        socket.on('incomingFriendRequest', onIncomingReq);
        socket.on('friendRequestAccepted', onReqAccepted);
        return () => {
            socket.off('incomingFriendRequest', onIncomingReq);
            socket.off('friendRequestAccepted', onReqAccepted);
        };
    }, [socket]);

    // Story viewer automatic 5-second timer
    useEffect(() => {
        if (!activeStoryViewer || isStoryPaused || isStoryInsightsOpen) return;

        const intervalTime = 50;
        const totalDuration = 5000;
        const step = (intervalTime / totalDuration) * 100;

        const timer = setInterval(() => {
            setStoryProgress((prev) => {
                if (prev + step >= 100) {
                    if (activeStoryViewer.currentIndex < activeStoryViewer.stories.length - 1) {
                        setActiveStoryViewer((prevViewer) => ({
                            ...prevViewer,
                            currentIndex: prevViewer.currentIndex + 1
                        }));
                        return 0;
                    } else {
                        setActiveStoryViewer(null);
                        return 0;
                    }
                }
                return prev + step;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [activeStoryViewer?.currentIndex, activeStoryViewer?.stories?.length, isStoryPaused, isStoryInsightsOpen]);

    // Track story view on backend when viewing a story
    useEffect(() => {
        if (!activeStoryViewer) return;
        const curStory = activeStoryViewer.stories[activeStoryViewer.currentIndex];
        if (curStory?._id) {
            apiFetch(`/api/stories/${curStory._id}/view`, { method: 'POST' }).catch(() => {});
        }
    }, [activeStoryViewer?.currentIndex, activeStoryViewer?.stories]);

    // Handle Story File Selection
    const handleStoryFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video');
        setStoryMediaType(isVideo ? 'video' : 'image');

        const reader = new FileReader();
        reader.onloadend = () => {
            setStoryMediaData(reader.result);
            setIsCreateStoryOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Handle Publish Story
    const handlePublishStory = async () => {
        if (!storyMediaData) return;
        setIsSubmittingStory(true);
        try {
            const res = await apiFetch('/api/stories', {
                method: 'POST',
                body: {
                    mediaUrl: storyMediaData,
                    mediaType: storyMediaType,
                    caption: storyCaption
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStories([data.story, ...stories]);
                setIsCreateStoryOpen(false);
                setStoryMediaData('');
                setStoryCaption('');
                showToast('✨ Story published! Visible for 24 hours.');
            } else {
                showToast('Failed to publish story');
            }
        } catch (err) {
            console.error('Error publishing story:', err);
            showToast('Failed to publish story');
        } finally {
            setIsSubmittingStory(false);
        }
    };

    // Handle Delete Story
    const handleDeleteStory = async (storyId) => {
        if (!window.confirm('Are you sure you want to delete this story?')) return;
        try {
            const res = await apiFetch(`/api/stories/${storyId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setStories(stories.filter((s) => s._id !== storyId));
                if (activeStoryViewer) {
                    const remaining = activeStoryViewer.stories.filter((s) => s._id !== storyId);
                    if (remaining.length > 0) {
                        setActiveStoryViewer({
                            ...activeStoryViewer,
                            stories: remaining,
                            currentIndex: Math.min(activeStoryViewer.currentIndex, remaining.length - 1)
                        });
                        setStoryProgress(0);
                    } else {
                        setActiveStoryViewer(null);
                    }
                }
                showToast('🗑️ Story deleted');
            }
        } catch (err) {
            console.error('Error deleting story:', err);
        }
    };

    // Send Emoji Reaction to Story with particle animations & backend persistence
    const handleSendReaction = async (storyId, emoji) => {
        if (!storyId || !emoji) return;

        // Trigger floating emoji particle burst
        const burstCount = 7;
        const newParticles = Array.from({ length: burstCount }).map((_, i) => ({
            id: Date.now() + Math.random() + i,
            emoji,
            left: 20 + Math.random() * 60,
            animDelay: (i * 0.08).toFixed(2),
            size: 22 + Math.random() * 14
        }));
        setFloatingReactions((prev) => [...prev, ...newParticles]);
        setTimeout(() => {
            setFloatingReactions((prev) =>
                prev.filter((p) => !newParticles.find((np) => np.id === p.id))
            );
        }, 2000);

        try {
            const res = await apiFetch(`/api/stories/${storyId}/react`, {
                method: 'POST',
                body: { emoji }
            });

            if (res.ok) {
                const data = await res.json();
                const updatedStory = data.story;

                // Update main stories list
                setStories((prev) => prev.map((s) => (s._id === storyId ? updatedStory : s)));

                // Update active story viewer
                if (activeStoryViewer) {
                    const updatedList = activeStoryViewer.stories.map((s) =>
                        s._id === storyId ? updatedStory : s
                    );
                    setActiveStoryViewer({
                        ...activeStoryViewer,
                        stories: updatedList
                    });
                }

                showToast(`Reacted ${emoji} to ${activeStoryViewer?.author?.FullName || 'story'}!`);
            }
        } catch (err) {
            console.error('Error sending story reaction:', err);
        }
    };

    // 3. Search Other People on the Platform
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const res = await apiFetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.users || []);
                }
            } catch (err) {
                console.error('Error searching users:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle File Selection for Post Image/Video
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMediaFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewMediaData(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Handle Create Post
    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostText.trim() && !newMediaData && !selectedFeeling) return;

        setIsSubmittingPost(true);
        try {
            const res = await apiFetch('/api/posts', {
                method: 'POST',
                body: {
                    content: newPostText,
                    mediaUrl: newMediaData,
                    mediaType: newMediaData ? 'image' : null,
                    feeling: selectedFeeling || undefined
                }
            });

            if (res.ok) {
                const data = await res.json();
                setPosts([data.post, ...posts]);
                setNewPostText('');
                setNewMediaData('');
                setMediaFileName('');
                setSelectedFeeling(null);
                setIsFeelingPickerOpen(false);
                showToast('🎉 Your post has been published!');
            }
        } catch (err) {
            console.error('Error creating post:', err);
        } finally {
            setIsSubmittingPost(false);
        }
    };

    // Handle Edit Post
    const handleSaveEditPost = async (postId) => {
        try {
            const res = await apiFetch(`/api/posts/${postId}`, {
                method: 'PUT',
                body: { content: editPostContent }
            });

            if (res.ok) {
                const data = await res.json();
                setPosts(posts.map((p) => (p._id === postId ? data.post : p)));
                setEditingPostId(null);
                showToast('✏️ Post updated successfully!');
            }
        } catch (err) {
            console.error('Error updating post:', err);
        }
    };

    // Handle Delete Post
    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const res = await apiFetch(`/api/posts/${postId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setPosts(posts.filter((p) => p._id !== postId));
                showToast('🗑️ Post deleted successfully.');
            }
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    // Handle Like
    const handleLike = async (postId) => {
        try {
            const res = await apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setPosts(posts.map((p) => (p._id === postId ? data.post : p)));
            }
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    // Handle Dislike
    const handleDislike = async (postId) => {
        try {
            const res = await apiFetch(`/api/posts/${postId}/dislike`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setPosts(posts.map((p) => (p._id === postId ? data.post : p)));
            }
        } catch (err) {
            console.error('Error disliking post:', err);
        }
    };

    // Handle Share
    const handleShare = async (postId) => {
        try {
            const res = await apiFetch(`/api/posts/${postId}/share`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setPosts(posts.map((p) => (p._id === postId ? data.post : p)));
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                }
                showToast('🔗 Post shared! Link copied to clipboard.');
            }
        } catch (err) {
            console.error('Error sharing post:', err);
        }
    };

    // Handle Comment
    const handleAddComment = async (postId) => {
        const text = commentInputs[postId];
        if (!text || !text.trim()) return;

        try {
            const res = await apiFetch(`/api/posts/${postId}/comment`, {
                method: 'POST',
                body: { text: text.trim() }
            });

            if (res.ok) {
                const data = await res.json();
                setPosts(posts.map((p) => (p._id === postId ? data.post : p)));
                setCommentInputs({ ...commentInputs, [postId]: '' });
                setOpenCommentsPosts((prev) => ({ ...prev, [postId]: true }));
                showToast('💬 Comment added!');
            }
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    // Open Real-time Chat Messenger with contact
    const openChat = (contact) => {
        setActiveChatUser(contact);
    };

    // Group stories for stories carousel
    const myStories = stories.filter((s) => s.author?._id === user?._id);

    const otherStoriesMap = {};
    stories.forEach((s) => {
        if (s.author?._id && s.author._id !== user?._id) {
            if (!otherStoriesMap[s.author._id]) {
                otherStoriesMap[s.author._id] = {
                    author: s.author,
                    stories: []
                };
            }
            otherStoriesMap[s.author._id].stories.push(s);
        }
    });
    const otherUsersWithStories = Object.values(otherStoriesMap);

    const friendsWithoutStories = friends.filter(
        (c) => c._id !== user?._id && !otherStoriesMap[c._id]
    );

    const totalUnreadMessages = Object.values(unreadCounts || {}).reduce((sum, n) => sum + (n || 0), 0);

    return (
        <div className="social-home-page">
            {/* Real-time Feedback Toast */}
            {toastMsg && <div className="profile-feedback-toast">{toastMsg}</div>}

            <div className="social-layout-container">
                {/* Left Sidebar (Navigation, Discover & Friend Requests) */}
                <LeftSidebar
                    user={user}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    isSearching={isSearching}
                    friends={friends}
                    friendRequests={friendRequests}
                    openChat={openChat}
                    handleAcceptFriendRequest={handleAcceptFriendRequest}
                    handleRejectFriendRequest={handleRejectFriendRequest}
                    handleCancelFriendRequest={handleCancelFriendRequest}
                    handleSendFriendRequest={handleSendFriendRequest}
                    fetchPosts={fetchPosts}
                    totalUnreadMessages={totalUnreadMessages}
                />

                {/* Center Feed Column */}
                <main className="social-center-feed">
                    {/* Stories Carousel */}
                    <StoriesBar
                        user={user}
                        myStories={myStories}
                        otherUsersWithStories={otherUsersWithStories}
                        friendsWithoutStories={friendsWithoutStories}
                        setActiveStoryViewer={setActiveStoryViewer}
                        setStoryProgress={setStoryProgress}
                        storyFileInputRef={storyFileInputRef}
                        openChat={openChat}
                    />

                    {/* Dedicated Separate File Picker for Stories */}
                    <input
                        type="file"
                        ref={storyFileInputRef}
                        accept="image/*,video/*"
                        style={{ display: 'none' }}
                        onChange={handleStoryFileSelect}
                    />

                    {/* Hidden File Picker for Post Image / Video Upload */}
                    <input
                        type="file"
                        ref={postFileInputRef}
                        accept="image/*,video/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />

                    {/* Create Post Box */}
                    <CreatePostCard
                        user={user}
                        newPostText={newPostText}
                        setNewPostText={setNewPostText}
                        newMediaData={newMediaData}
                        setNewMediaData={setNewMediaData}
                        mediaFileName={mediaFileName}
                        setMediaFileName={setMediaFileName}
                        selectedFeeling={selectedFeeling}
                        setSelectedFeeling={setSelectedFeeling}
                        isFeelingPickerOpen={isFeelingPickerOpen}
                        setIsFeelingPickerOpen={setIsFeelingPickerOpen}
                        isSubmittingPost={isSubmittingPost}
                        postFileInputRef={postFileInputRef}
                        handleCreatePost={handleCreatePost}
                    />

                    {/* Posts Feed Stream */}
                    <div className="posts-feed-stream">
                        {loadingPosts ? (
                            <div className="feed-loader">
                                <div className="spinner"></div>
                                <p>Loading your feed...</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="empty-feed-card">
                                <h3>No posts yet!</h3>
                                <p>Be the first to share an update, photo, or thought with everyone above.</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    user={user}
                                    isCommentsOpen={!!openCommentsPosts[post._id]}
                                    toggleComments={toggleComments}
                                    editingPostId={editingPostId}
                                    setEditingPostId={setEditingPostId}
                                    editPostContent={editPostContent}
                                    setEditPostContent={setEditPostContent}
                                    handleSaveEditPost={handleSaveEditPost}
                                    handleDeletePost={handleDeletePost}
                                    handleLike={handleLike}
                                    handleDislike={handleDislike}
                                    handleShare={handleShare}
                                    commentInput={commentInputs[post._id] || ''}
                                    onCommentInputChange={(id, val) =>
                                        setCommentInputs((prev) => ({
                                            ...prev,
                                            [id]: val
                                        }))
                                    }
                                    handleAddComment={handleAddComment}
                                />
                            ))
                        )}
                    </div>
                </main>

                {/* Right Sidebar (Only Accepted Friends & Live Presence) */}
                <RightSidebar
                    friends={friends}
                    isUserOnline={isUserOnline}
                    unreadCounts={unreadCounts}
                    activeChatUser={activeChatUser}
                    openChat={openChat}
                />
            </div>

            {/* Create Story Modal Dialog */}
            <CreateStoryModal
                isOpen={isCreateStoryOpen}
                onClose={() => setIsCreateStoryOpen(false)}
                isSubmittingStory={isSubmittingStory}
                storyMediaData={storyMediaData}
                storyMediaType={storyMediaType}
                storyCaption={storyCaption}
                setStoryCaption={setStoryCaption}
                setStoryMediaData={setStoryMediaData}
                storyFileInputRef={storyFileInputRef}
                handlePublishStory={handlePublishStory}
            />

            {/* Fullscreen Story Viewer Modal */}
            <StoryViewerModal
                activeStoryViewer={activeStoryViewer}
                setActiveStoryViewer={setActiveStoryViewer}
                storyProgress={storyProgress}
                setStoryProgress={setStoryProgress}
                setIsStoryPaused={setIsStoryPaused}
                floatingReactions={floatingReactions}
                isStoryInsightsOpen={isStoryInsightsOpen}
                setIsStoryInsightsOpen={setIsStoryInsightsOpen}
                insightsTab={insightsTab}
                setInsightsTab={setInsightsTab}
                user={user}
                handleDeleteStory={handleDeleteStory}
                handleSendReaction={handleSendReaction}
            />

            {/* Real-time Floating Messenger */}
            {activeChatUser && (
                <ChatMessenger
                    contact={activeChatUser}
                    onClose={() => setActiveChatUser(null)}
                />
            )}
        </div>
    );
};
