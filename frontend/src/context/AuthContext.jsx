import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verify authentication status on initial app load
    const checkAuth = async () => {
        try {
            const res = await apiFetch('/api/users/profile', { skipAuthRefresh: true });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Connection error verifying session:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await apiFetch('/api/users/login', {
            method: 'POST',
            body: { email, password }
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Login failed. Please check your credentials.');
        }

        setUser(data.user);
        return data;
    };

    const signup = async (FullName, email, password, profilePic = '') => {
        const res = await apiFetch('/api/users/signup', {
            method: 'POST',
            body: { FullName, email, password, profilePic }
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Registration failed. Please try again.');
        }

        setUser(data.user);
        return data;
    };

    const logout = async () => {
        try {
            await apiFetch('/api/users/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            setUser(null);
        }
    };

    const updateUser = (updatedData) => {
        setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
