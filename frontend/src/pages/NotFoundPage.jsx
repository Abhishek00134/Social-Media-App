import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
    return (
        <div className="auth-container">
            <div className="auth-card text-center">
                <span className="auth-icon">🔍</span>
                <h1>404 - Not Found</h1>
                <p>The page you are looking for does not exist or has been moved.</p>
                <div style={{ marginTop: '24px' }}>
                    <Link to="/" className="btn btn-primary">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};
