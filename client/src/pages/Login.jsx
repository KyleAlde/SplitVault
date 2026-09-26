import { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
                <p className="login-subtitle">{isRegistering ? 'Create your account' : 'Sign in to your account'}</p>

                <form onSubmit={handleSubmit}>
                    {isRegistering && (
                        <div className="input-group">
                            <label htmlFor="register-name">Name</label>
                            <input
                                id="register-name"
                                type="text"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            autoComplete={isRegistering ? 'new-password' : 'current-password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={isRegistering ? 8 : undefined}
                            required
                        />
                    </div>

                    {error && (
                        <p className="login-error">{error}</p>
                    )}

                    <button type="submit" className="login-button">
                        {isSubmitting ? 'Please wait...' : isRegistering ? 'Create Account' : 'Login'}
                    </button>

                    <button
                        type="button"
                        className="register-button"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                    >
                        {isRegistering ? 'Back to Login' : 'Register'}
                    </button>

                </form>
            </div>
        </div>
    );
}