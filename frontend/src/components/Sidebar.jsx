import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/helpers';

const RESEARCHER_NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/grants', icon: '📋', label: 'My Grants' },
  { to: '/grants/new', icon: '✚', label: 'New Application' },
  { to: '/milestones', icon: '🎯', label: 'Milestones' },
  { to: '/outputs', icon: '📄', label: 'Research Outputs' },
  { to: '/documents', icon: '🗂️', label: 'Document Vault' },
];

const ADMIN_NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/grants', icon: '📋', label: 'All Grants' },
  { to: '/outputs', icon: '📄', label: 'Research Outputs' },
  { to: '/documents', icon: '🗂️', label: 'Document Vault' },
  { to: '/users', icon: '👥', label: 'Users' },
];

const REVIEWER_NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/grants', icon: '📋', label: 'Review Queue' },
  { to: '/outputs', icon: '📄', label: 'Research Outputs' },
];

function getNav(role) {
  if (role === 'admin') return ADMIN_NAV;
  if (role === 'reviewer') return REVIEWER_NAV;
  return RESEARCHER_NAV;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const navItems = getNav(user.role);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">R</div>
        <div className="sidebar-logo-text">
          <h1>RMC System</h1>
          <p>UUM Research Centre</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials(user.name)}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role} · {user.department}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">⎋</button>
        </div>
      </div>
    </aside>
  );
}
