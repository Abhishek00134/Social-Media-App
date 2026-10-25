import { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { apiFetch } from '../services/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [activeChatUserId, setActiveChatUserId] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({}); // { [senderId]: number }
    const activeChatUserIdRef = useRef(activeChatUserId);
    const audioContextRef = useRef(null);

    // Keep activeChatUserIdRef synchronized with state
    useEffect(() => {
        activeChatUserIdRef.current = activeChatUserId;
    }, [activeChatUserId]);

    // Subtle audio chime on new message
    const playNotificationSound = () => {
        try {
            const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = ctx;

            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch {
            // Audio policy might suppress before user gesture
        }
    };

    // Initial fetch of unread counts from recent conversations
    const fetchInitialUnreadCounts = async () => {
        if (!user?._id) return;
        try {
            const res = await apiFetch('/api/messages/conversations/recent');
            if (res.ok) {
                const data = await res.json();
                const counts = {};
                (data.conversations || []).forEach((conv) => {
                    const uId = String(conv.user?._id || '');
                    if (uId && conv.unreadCount > 0) {
                        counts[uId] = conv.unreadCount;
                    }
                });
                setUnreadCounts(counts);
            }
        } catch (err) {
            console.error('Error fetching unread counts:', err);
        }
    };

    useEffect(() => {
        if (!user?._id) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setOnlineUsers([]);
            setUnreadCounts({});
            return;
        }

        // Fetch initial unread counts on login/load
        fetchInitialUnreadCounts();

        // Connect to Socket.IO backend
        const socketUrl =
            import.meta.env.VITE_BACKEND_URL;
        const newSocket = io(socketUrl, {
            query: {
                userId: user._id
            },
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('[Socket] Connected to real-time server with id:', newSocket.id);
        });

        newSocket.on('getOnlineUsers', (users) => {
            setOnlineUsers(users || []);
        });

        newSocket.on('newMessage', (message) => {
            const senderId = String(message.senderId?._id || message.senderId);
            // If the user isn't currently in an active chat with this sender, increase unread & chime
            if (String(activeChatUserIdRef.current) !== senderId) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }));
                playNotificationSound();
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user?._id]);

    const isUserOnline = (userId) => {
        if (!userId) return false;
        return onlineUsers.includes(String(userId));
    };

    const clearUnreadForUser = (userId) => {
        if (!userId) return;
        const uIdStr = String(userId);
        setUnreadCounts((prev) => {
            if (!prev[uIdStr]) return prev;
            const updated = { ...prev };
            delete updated[uIdStr];
            return updated;
        });
    };

    return (
        <SocketContext.Provider
            value={{
                socket,
                onlineUsers,
                isUserOnline,
                activeChatUserId,
                setActiveChatUserId,
                unreadCounts,
                clearUnreadForUser,
                playNotificationSound
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
