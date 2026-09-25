import { STATUS_LABELS, ROLE_LABELS } from '../utils/helpers';
import {
  X,
  CaretDown,
  FileText,
  Spinner as SpinnerIcon,
  Warning,
  CheckCircle,
  Info,
} from '@phosphor-icons/react';

export function Badge({ status, role, children, className = '' }) {
  const cls = status
    ? `badge badge-${status}`
    : role
    ? `badge badge-${role}`
    : 'badge';
  return (
    <span className={`${cls} ${className}`}>
      {children || STATUS_LABELS[status] || ROLE_LABELS[role] || status || role}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, color, bgColor, change, children, className = '' }) {
  return (
    <div className={`stat-card ${className}`} style={{ '--stat-color': color }}>
      <div className="stat-icon" style={{ background: bgColor, color: color }}>
        {Icon ? <Icon weight="bold" size={22} /> : children}
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && <div className="stat-change text-accent-green">{change}</div>}
      </div>
    </div>
  );
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }} className={className}>
      <SpinnerIcon className="spinner" style={{ width: size, height: size }} weight="bold" />
    </div>
  );
}

export function Alert({ type = 'error', children, className = '' }) {
  const types = {
    error: 'alert-error',
    success: 'alert-success',
    info: 'alert-info',
    warning: 'alert-warning',
  };
  const icons = {
    error: <Warning weight="bold" size={16} />,
    success: <CheckCircle weight="bold" size={16} />,
    info: <Info weight="bold" size={16} />,
    warning: <Warning weight="bold" size={16} />,
  };
  return (
    <div className={`alert ${types[type]} ${className}`}>
      {icons[type]}
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, className = '', size = 'md' }) {
  if (!open) return null;
  const sizes = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
    full: 'modal-full',
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${sizes[size]} ${className}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close modal">
            <X weight="bold" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, className = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`progress-bar-outer ${className}`}>
      <div className="progress-bar-inner" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon = FileText, title = 'Nothing here yet', description, action, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        <Icon weight="bold" size={48} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action}
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Confirm', message, loading, confirmLabel = 'Confirm', variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className={`btn btn-${variant}`} onClick={onConfirm} disabled={loading}>
            {loading ? <SpinnerIcon weight="bold" size={16} className="animate-spin" /> : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-secondary">{message}</p>
    </Modal>
  );
}

export function Button({ children, variant = 'primary', size = 'md', disabled, loading, className = '', type = 'button', onClick, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
  };
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };
  return (
    <button
      type={type}
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? <SpinnerIcon weight="bold" size={16} className="animate-spin" /> : children}
    </button>
  );
}

export function Input({ label, error, helperText, className = '', id, ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input
        id={id}
        className={`form-control ${error ? 'form-error-input' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        {...props}
      />
      {error && <p id={`${id}-error`} className="form-error" role="alert">{error}</p>}
      {helperText && !error && <p id={`${id}-helper`} className="form-helper">{helperText}</p>}
    </div>
  );
}

export function Textarea({ label, error, helperText, className = '', id, ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <textarea
        id={id}
        className={`form-control ${error ? 'form-error-input' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        {...props}
      />
      {error && <p id={`${id}-error`} className="form-error" role="alert">{error}</p>}
      {helperText && !error && <p id={`${id}-helper`} className="form-helper">{helperText}</p>}
    </div>
  );
}

export function Select({ label, error, helperText, options, className = '', id, ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <select
        id={id}
        className={`form-control ${error ? 'form-error-input' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p id={`${id}-error`} className="form-error" role="alert">{error}</p>}
      {helperText && !error && <p id={`${id}-helper`} className="form-helper">{helperText}</p>}
    </div>
  );
}

export function Card({ children, className = '', hover = false, padding = 'md', ...props }) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  return (
    <div
      className={`card ${paddings[padding]} ${hover ? 'card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      <div>
        {title && <h4 className="card-title">{title}</h4>}
        {subtitle && <p className="text-sm text-secondary mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Table({ children, className = '', ...props }) {
  return (
    <div className={`table-wrapper ${className}`} {...props}>
      <table>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return <thead className={className} {...props}>{children}</thead>;
}

export function TableBody({ children, className = '', ...props }) {
  return <tbody className={className} {...props}>{children}</tbody>;
}

export function TableRow({ children, className = '', ...props }) {
  return <tr className={className} {...props}>{children}</tr>;
}

export function TableCell({ children, className = '', ...props }) {
  return <td className={className} {...props}>{children}</td>;
}

export function TableHeaderCell({ children, className = '', ...props }) {
  return <th className={className} {...props}>{children}</th>;
}

export function FilterChips({ options, value, onChange, className = '' }) {
  return (
    <div className={`filter-bar ${className}`} role="group" aria-label="Filter options">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`filter-chip ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
          role="radio"
          aria-checked={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Dropdown({ trigger, items, align = 'right', className = '' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`dropdown ${className}`} ref={ref}>
      <button className="btn btn-secondary btn-sm" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="true">
        {trigger}
        <CaretDown weight="bold" size={14} className="ml-1" />
      </button>
      {open && (
        <div className={`dropdown-menu ${align === 'right' ? 'dropdown-menu-right' : ''}`} role="menu">
          {items.map((item, i) => (
            <button
              key={i}
              className="dropdown-item"
              role="menuitem"
              onClick={() => { item.onClick?.(); setOpen(false); }}
              disabled={item.disabled}
            >
              {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
              {item.label}
              {item.shortcut && <span className="dropdown-item-shortcut">{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Tooltip({ content, children, position = 'top' }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <span className="tooltip-wrapper" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className={`tooltip tooltip-${position}`} role="tooltip">
          {content}
        </div>
      )}
    </span>
  );
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`tabs ${className}`} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={`tab ${value === tab.value ? 'active' : ''}`}
          role="tab"
          aria-selected={value === tab.value}
          aria-controls={`panel-${tab.value}`}
          id={`tab-${tab.value}`}
          onClick={() => onChange(tab.value)}
          disabled={tab.disabled}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanels({ tabs, value, children, className = '' }) {
  return (
    <div className={`tab-panels ${className}`}>
      {tabs.map(tab => (
        <div
          key={tab.value}
          role="tabpanel"
          id={`panel-${tab.value}`}
          aria-labelledby={`tab-${tab.value}`}
          hidden={value !== tab.value}
          className="tab-panel"
        >
          {children(tab.value)}
        </div>
      ))}
    </div>
  );
}

export function Keystroke({ children, className = '' }) {
  return (
    <kbd className={`keystroke ${className}`}>
      {children}
    </kbd>
  );
}

export function Divider({ className = '', orientation = 'horizontal' }) {
  return <hr className={`divider ${orientation === 'vertical' ? 'divider-vertical' : ''} ${className}`} />;
}

export function Avatar({ src, alt, name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className={`avatar ${sizes[size]} ${className}`} aria-label={alt || name}>
      {src ? <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" /> : <span>{initials}</span>}
    </div>
  );
}

export function Chip({ children, removable, onRemove, variant = 'default', className = '' }) {
  const variants = {
    default: '',
    primary: 'chip-primary',
    success: 'chip-success',
    warning: 'chip-warning',
    danger: 'chip-danger',
  };
  return (
    <span className={`chip ${variants[variant]} ${className}`}>
      <span>{children}</span>
      {removable && (
        <button className="chip-remove" onClick={onRemove} aria-label="Remove">
          <X weight="bold" size={12} />
        </button>
      )}
    </span>
  );
}

export function Breadcrumb({ items, className = '', separator = '/' }) {
  return (
    <nav className={`breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, i) => (
          <li key={i} className="breadcrumb-item">
            {i > 0 && <span className="breadcrumb-separator" aria-hidden="true">{separator}</span>}
            {item.href ? (
              <a href={item.href} className="breadcrumb-link">{item.label}</a>
            ) : (
              <span className="breadcrumb-current" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Skeleton({ className = '', variant = 'text', width, height }) {
  const variants = {
    text: 'skeleton-text',
    circular: 'skeleton-circular',
    rectangular: 'skeleton-rectangular',
  };
  return (
    <div
      className={`skeleton ${variants[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function VisuallyHidden({ children }) {
  return <span className="sr-only">{children}</span>;
}

import React from 'react';