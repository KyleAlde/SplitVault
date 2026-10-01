import { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const revealPassword = () => setIsPasswordVisible(true);
    const hidePassword = () => setIsPasswordVisible(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (isRegistering && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsSubmitting(true);
        try {
            await onLogin({ ...(isRegistering ? { name } : {}), email, password }, isRegistering);
        } catch (requestError) {
            setError(requestError.message || 'Unable to sign in.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>SPLITVAULT</h1>
                <p className="login-subtitle">
                    {isRegistering ? 'Create your account' : 'Sign in to your account'}
                </p>

                <form onSubmit={handleSubmit}>
                    {isRegistering && (
                        <div className="input-group">
                            <label htmlFor="register-name">Name</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <input
                                    id="register-name"
                                    type="text"
                                    autoComplete="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="login-email">Email</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="login-password">Password</label>
                        <div className="input-wrapper password-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input
                                id="login-password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={isRegistering ? 8 : undefined}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                                onMouseDown={revealPassword}
                                onMouseUp={hidePassword}
                                onMouseLeave={hidePassword}
                                onTouchStart={revealPassword}
                                onTouchEnd={hidePassword}
                                onTouchCancel={hidePassword}
                            >
                                {isPasswordVisible ? (
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                                        <path d="M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {isRegistering && (
                        <div className="input-group">
                            <label htmlFor="confirm-password">Confirm Password</label>
                            <div className="input-wrapper password-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <input
                                    id="confirm-password"
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={8}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="login-error">{error}</p>
                    )}

                    <button type="submit" className="login-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Please wait...' : isRegistering ? 'Create Account' : 'Login'}
                    </button>

                    <a
                        href="#"
                        className="register-link"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsRegistering(!isRegistering);
                            setConfirmPassword('');
                            setError('');
                        }}
                    >
                        {isRegistering ? 'Back to Login' : 'Register'}
                    </a>
                </form>
            </div>
        </div>
    );
}