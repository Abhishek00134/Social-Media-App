import { IconClose } from '../common/Icons';

export const CreateStoryModal = ({
    isOpen,
    onClose,
    isSubmittingStory,
    storyMediaData,
    storyMediaType,
    storyCaption,
    setStoryCaption,
    setStoryMediaData,
    storyFileInputRef,
    handlePublishStory
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="story-modal-backdrop"
            onClick={() => !isSubmittingStory && onClose()}
        >
            <div className="story-create-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="story-dialog-header">
                    <h3>Create a Story</h3>
                    <button
                        type="button"
                        className="story-close-btn"
                        onClick={onClose}
                        disabled={isSubmittingStory}
                        title="Close"
                        aria-label="Close dialog"
                    >
                        <IconClose size={18} />
                    </button>
                </div>

                <div className="story-preview-viewport">
                    {storyMediaData ? (
                        <div className="story-media-preview-box">
                            {storyMediaType === 'video' ? (
                                <video src={storyMediaData} controls autoPlay muted loop />
                            ) : (
                                <img src={storyMediaData} alt="Story preview" />
                            )}
                            {storyCaption && (
                                <div className="story-overlay-caption">
                                    <p>{storyCaption}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className="story-upload-dropzone"
                            onClick={() => storyFileInputRef.current?.click()}
                        >
                            <span className="dropzone-icon">📸</span>
                            <h4>Select a Photo or Video</h4>
                            <p>Stories disappear after 24 hours</p>
                            <button type="button" className="btn-browse-media">
                                Choose File
                            </button>
                        </div>
                    )}
                </div>

                <div className="story-controls-box">
                    <div className="story-caption-field">
                        <input
                            type="text"
                            placeholder="Add a caption to your story..."
                            value={storyCaption}
                            onChange={(e) => setStoryCaption(e.target.value)}
                            maxLength={120}
                        />
                    </div>

                    <div className="story-dialog-actions">
                        {storyMediaData && (
                            <button
                                type="button"
                                className="btn-change-story-media"
                                onClick={() => storyFileInputRef.current?.click()}
                                disabled={isSubmittingStory}
                            >
                                Change Photo
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn-cancel-story"
                            onClick={() => {
                                onClose();
                                setStoryMediaData('');
                                setStoryCaption('');
                            }}
                            disabled={isSubmittingStory}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn-publish-story"
                            onClick={handlePublishStory}
                            disabled={!storyMediaData || isSubmittingStory}
                        >
                            {isSubmittingStory ? 'Publishing...' : 'Share to Story'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
