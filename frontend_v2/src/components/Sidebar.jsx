import { useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/helpers';
import {
  House,
  FolderOpen,
  PlusCircle,
  Target,
  FileText,
  Archive,
  Users,
  SignOut,
  Layout,
  ClipboardText,
  BookOpen,
} from '@phosphor-icons/react';

const NAV_CONFIG = {
  researcher: [
    { to: '/dashboard', icon: House, label: 'Dashboard' },
    { to: '/grants', icon: FolderOpen, label: 'My Grants' },
    { to: '/grants/new', icon: PlusCircle, label: 'New Application' },
    { to: '/milestones', icon: Target, label: 'Milestones' },
    { to: '/outputs', icon: FileText, label: 'Research Outputs' },
    { to: '/documents', icon: Archive, label: 'Document Vault' },
  ],
  admin: [
    { to: '/dashboard', icon: Layout, label: 'Dashboard' },
    { to: '/grants', icon: ClipboardText, label: 'All Grants' },
    { to: '/milestones', icon: Target, label: 'Milestones' },
    { to: '/outputs', icon: FileText, label: 'Research Outputs' },
    { to: '/documents', icon: Archive, label: 'Document Vault' },
    { to: '/users', icon: Users, label: 'Users' },
  ],
  reviewer: [
    { to: '/dashboard', icon: BookOpen, label: 'Dashboard' },
    { to: '/grants', icon: ClipboardText, label: 'Review Queue' },
    { to: '/milestones', icon: Target, label: 'Milestones' },
    { to: '/outputs', icon: FileText, label: 'Research Outputs' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const navItems = NAV_CONFIG[user.role] || NAV_CONFIG.researcher;

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div className="sidebar-logo-text">
            <h1>RMC System</h1>
            <p>UUM Research Centre</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navigation">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon weight="bold" size={20} />
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials(user.name)}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">
              <span className={`badge badge-${user.role}`}>{user.role}</span>
              {user.department && <span className="ml-2 text-caption">· {user.department}</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout" aria-label="Sign out">
            <SignOut weight="bold" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}