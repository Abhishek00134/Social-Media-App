import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PRESET_AVATARS = [
    { id: 'avatar1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow' },
    { id: 'avatar2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nova' },
    { id: 'avatar3', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber' },
    { id: 'avatar4', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Echo' },
    { id: 'avatar5', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zen' }
];

export const SignupPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    // Password strength calculation
    const getPasswordStrength = () => {
        if (!password) return { score: 0, label: '', color: '' };
        let score = 0;
        if (password.length >= 6) score += 1;
        if (password.length >= 10) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
        if (score <= 3) return { score: 2, label: 'Medium', color: '#f59e0b' };
        return { score: 3, label: 'Strong', color: '#10b981' };
    };

    const strength = getPasswordStrength();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setSubmitting(true);
        try {
            await signup(fullName, email, password, selectedAvatar);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-wrapper">
                {/* Form Side */}
                <div className="auth-form-card">
                    <div className="auth-brand-badge">
                        <span className="brand-dot"></span>
                        <span>Get Started with PulseChat</span>
                    </div>

                    <div className="auth-title-section">
                        <h1>Create Your Account</h1>
                        <p>Join thousands of users having real-time conversations every day.</p>
                    </div>

                    {error && (
                        <div className="auth-alert">
                            <span className="alert-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-fields-form">
                        {/* Avatar Picker */}
                        <div className="avatar-picker-section">
                            <label className="avatar-picker-label">Choose Your Chat Avatar</label>
                            <div className="avatar-options-row">
                                {PRESET_AVATARS.map((avatar) => (
                                    <button
                                        type="button"
                                        key={avatar.id}
                                        className={`avatar-option-btn ${selectedAvatar === avatar.url ? 'active' : ''}`}
                                        onClick={() => setSelectedAvatar(avatar.url)}
                                    >
                                        <img src={avatar.url} alt="preset avatar" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="input-field-wrapper">
                            <label htmlFor="signup-name">Full Name</label>
                            <div className="input-control">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <input
                                    id="signup-name"
                                    type="text"
                                    placeholder="e.g. Alex Morgan"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div className="input-field-wrapper">
                            <label htmlFor="signup-email">Email Address</label>
                            <div className="input-control">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </span>
                                <input
                                    id="signup-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="input-field-wrapper">
                            <label htmlFor="signup-password">Password</label>
                            <div className="input-control">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
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

                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="password-strength-container">
                                    <div className="strength-bars">
                                        <div className={`bar ${strength.score >= 1 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 1 ? strength.color : '' }}></div>
                                        <div className={`bar ${strength.score >= 2 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 2 ? strength.color : '' }}></div>
                                        <div className={`bar ${strength.score >= 3 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 3 ? strength.color : '' }}></div>
                                    </div>
                                    <span className="strength-label" style={{ color: strength.color }}>
                                        {strength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <span>Create Free Account</span>
                            )}
                        </button>
                    </form>

                    <p className="auth-switch-text">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-highlight-link">
                            Sign in here
                        </Link>
                    </p>
                </div>

                {/* Hero Showcase Side */}
                <div className="auth-hero-showcase">
                    <div className="hero-glow-blob blob-1"></div>
                    <div className="hero-glow-blob blob-2"></div>

                    <div className="signup-feature-showcase">
                        <div className="showcase-badge">
                            <span>✨ Easy & Modern</span>
                        </div>
                        <h2>A simple, fun way to stay connected.</h2>
                        <p className="showcase-lead">
                            Send messages, share moments, and chat with your favorite people anytime, anywhere.
                        </p>

                        <div className="feature-cards-grid">
                            <div className="feature-card">
                                <div className="feature-card-icon">⚡</div>
                                <div>
                                    <h4>Lightning Fast</h4>
                                    <p>Your messages are delivered right away with no waiting.</p>
                                </div>
                            </div>

                            <div className="feature-card">
                                <div className="feature-card-icon">🔒</div>
                                <div>
                                    <h4>Private & Safe</h4>
                                    <p>Your conversations and account details are always protected.</p>
                                </div>
                            </div>

                            <div className="feature-card">
                                <div className="feature-card-icon">🎨</div>
                                <div>
                                    <h4>Fun Avatars</h4>
                                    <p>Choose an avatar that fits your personality and style.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
