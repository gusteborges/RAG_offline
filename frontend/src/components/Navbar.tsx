// ============================================================
// NAVBAR COMPONENT
// ============================================================
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import './Navbar.css';

export default function Navbar() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="navbar-logo">⬡</span>
          <span className="navbar-title">Smart<span className="text-gradient">Docs</span></span>
        </Link>

        <nav className="navbar-nav">
          <Link
            to="/dashboard"
            className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
        </nav>

        <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="btn-logout">
          Sair
        </button>
      </div>
    </header>
  );
}
