export const sanitizeUser = (user) => {
    if (!user) return null;
    return {
        _id: user._id,
        FullName: user.FullName,
        email: user.email,
        profilePic: user.profilePic || '',
        bio: user.bio || '',
        status: user.status || 'Available'
    };
};

export const USER_SELECT_PUBLIC = 'FullName email profilePic';
export const USER_SELECT_EXTENDED = 'FullName email profilePic isPrivate';
export const USER_SELECT_DISCOVERY = '_id FullName email profilePic status bio isPrivate friends';
