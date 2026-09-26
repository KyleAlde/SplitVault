import { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();

        if (username === 'admin' && password === '1234') {
            onLogin();
        } else {
            setError('Invalid username or password.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>SPLITVAULT</h1>
                <p className="login-subtitle">Sign in to your account</p>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <p className="login-error">{error}</p>
                    )}

                    <button type="submit" className="login-button">
                        Login
                    </button>

                    <button
                        type="button"
                        className="register-button"
                        onClick={() => {}}
                    >
                        Register
                    </button>

                </form>
            </div>
        </div>
    );
}