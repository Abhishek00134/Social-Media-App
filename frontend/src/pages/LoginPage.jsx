import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setSubmitting(false);
        }
    };

    const fillDemoUser = () => {
        setEmail('demo@pulsechat.com');
        setPassword('password123');
        setError('');
    };

    return (
        <div className="auth-page">
            <div className="auth-wrapper">
                {/* Form Side */}
                <div className="auth-form-card">
                    <div className="auth-brand-badge">
                        <span className="brand-dot"></span>
                        <span>PulseChat Messenger</span>
                    </div>

                    <div className="auth-title-section">
                        <h1>Welcome Back</h1>
                        <p>Sign in to catch up with your friends and family.</p>
                    </div>

                    {error && (
                        <div className="auth-alert">
                            <span className="alert-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-fields-form">
                        <div className="input-field-wrapper">
                            <label htmlFor="login-email">Email Address</label>
                            <div className="input-control">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </span>
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="input-field-wrapper">
                            <div className="input-label-row">
                                <label htmlFor="login-password">Password</label>
                                <span className="helper-link">Forgot password?</span>
                            </div>
                            <div className="input-control">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className={`password-toggle-btn ${showPassword ? 'is-active' : ''}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or try easily</span>
                    </div>

                    <button
                        type="button"
                        onClick={fillDemoUser}
                        className="demo-fill-btn"
                    >
                        ⚡ Try with Demo Account
                    </button>

                    <p className="auth-switch-text">
                        Don&apos;t have an account?{' '}
                        <Link to="/signup" className="auth-highlight-link">
                            Create account
                        </Link>
                    </p>
                </div>

                {/* Hero Showcase Side */}
                <div className="auth-hero-showcase">
                    <div className="hero-glow-blob blob-1"></div>
                    <div className="hero-glow-blob blob-2"></div>

                    <div className="mock-chat-preview">
                        <div className="mock-header">
                            <div className="mock-room-info">
                                <div className="room-avatar">💬</div>
                                <div>
                                    <h4>Weekend Plans</h4>
                                    <span className="room-status">● 3 online</span>
                                </div>
                            </div>
                            <span className="security-tag">🔒 Private</span>
                        </div>

                        <div className="mock-messages-body">
                            <div className="mock-msg incoming">
                                <div className="mock-sender">
                                    <span className="sender-avatar">👩</span>
                                    <span className="sender-name">Sarah</span>
                                </div>
                                <div className="msg-bubble">
                                    Hey! Are we still catching a movie this evening? 🍿
                                </div>
                                <span className="msg-time">Just now</span>
                            </div>

                            <div className="mock-msg outgoing">
                                <div className="msg-bubble">
                                    Yes, absolutely! Grabbing popcorn now, see you there! 😊
                                </div>
                                <span className="msg-time">Delivered ✓✓</span>
                            </div>

                            <div className="typing-indicator-card">
                                <span className="typing-text">Alex is typing</span>
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>

                        <div className="mock-floating-badge top-badge">
                            <span className="badge-icon">⚡</span>
                            <span>Instant message delivery</span>
                        </div>

                        <div className="mock-floating-badge bottom-badge">
                            <span className="badge-icon">🛡️</span>
                            <span>Safe, private & secure</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
