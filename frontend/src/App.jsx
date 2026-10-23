import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserProfileView } from './pages/UserProfileView';
import { MessagesPage } from './pages/MessagesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import './App.css';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SocketProvider>
                    <Router>
                        <div className="app-shell">
                            <Navbar />
                            <div className="main-content">
                                <Routes>
                                    {/* Public Only Routes (Redirect to Home if logged in) */}
                                    <Route element={<PublicRoute />}>
                                        <Route path="/login" element={<LoginPage />} />
                                        <Route path="/signup" element={<SignupPage />} />
                                    </Route>

                                    {/* Protected Routes (Redirect to /login if not logged in) */}
                                    <Route element={<ProtectedRoute />}>
                                        <Route path="/" element={<HomePage />} />
                                        <Route path="/messages" element={<MessagesPage />} />
                                        <Route path="/profile" element={<ProfilePage />} />
                                        <Route path="/profile/:userId" element={<UserProfileView />} />
                                    </Route>

                                    {/* 404 Route */}
                                    <Route path="*" element={<NotFoundPage />} />
                                </Routes>
                            </div>
                        </div>
                    </Router>
                </SocketProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
