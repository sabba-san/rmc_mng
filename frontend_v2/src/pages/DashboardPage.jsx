import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, grantsAPI } from '../utils/api';
import { Spinner, Badge, EmptyState } from '../components/UI';
import { formatCurrency, formatDate, timeAgo, STATUS_COLORS } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#1a56db', '#7c3aed', '#0e9f6e', '#d97706', '#e02424', '#06b6d4'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.stats()
      .then(res => setStats(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return null;

  return (
    <div className="page-body">
      <div className="mb-4">
        <h1 className="page-title">
          {user.role === 'admin' ? '🏛 RMC Admin Dashboard' :
           user.role === 'reviewer' ? '🔍 Reviewer Dashboard' :
           `👋 Welcome, ${user.name.split(' ')[0]}`}
        </h1>
        <p className="page-subtitle">
          {user.role === 'admin' ? 'System-wide overview of all grants and research activities' :
           user.role === 'reviewer' ? 'Grants pending your review and approval' :
           'Your research portfolio and active grants'}
        </p>
      </div>

      {user.role === 'researcher' && <ResearcherDash stats={stats} />}
      {user.role === 'admin' && <AdminDash stats={stats} />}
      {user.role === 'reviewer' && <ReviewerDash stats={stats} />}
    </div>
  );
}

function StatCard({ icon, label, value, color, change }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon" style={{ background: color }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && <div className="stat-change">{change}</div>}
      </div>
    </div>
  );
}

function ResearcherDash({ stats }) {
  const breakdown = Object.entries(stats.grant_status_breakdown || {}).map(([name, value]) => ({ name, value }));
  return (
    <>
      <div className="stats-grid">
        <StatCard icon="📋" label="Total Grants" value={stats.total_grants} color="#1a56db" />
        <StatCard icon="✅" label="Approved" value={stats.grant_status_breakdown?.approved || 0} color="#0e9f6e" />
        <StatCard icon="📄" label="Research Outputs" value={stats.total_research_outputs} color="#7c3aed" />
        <StatCard icon="🎯" label="Pending Milestones" value={stats.pending_milestones} color="#d97706" />
        <StatCard icon="💰" label="Total Approved" value={formatCurrency(stats.total_approved_funding)} color="#06b6d4" />
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header"><span className="card-title">Grant Status Breakdown</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Grants</span></div>
          {stats.recent_grants?.length === 0 ? <EmptyState icon="📭" title="No grants yet" /> :
            stats.recent_grants?.map(g => (
              <div key={g.id} className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold truncate" style={{ maxWidth: 200 }}>{g.title}</div>
                  <div className="text-xs text-muted">{timeAgo(g.created_at)}</div>
                </div>
                <Badge status={g.status} />
              </div>
            ))
          }
        </div>
      </div>
    </>
  );
}

function AdminDash({ stats }) {
  const outputData = Object.entries(stats.output_by_type || {}).map(([name, value]) => ({ name, value }));
  const grantTypeData = Object.entries(stats.grants_by_type || {}).map(([name, value]) => ({ name, value }));

  return (
    <>
      <div className="stats-grid">
        <StatCard icon="📋" label="Total Grants" value={stats.total_grants} color="#1a56db" />
        <StatCard icon="⏳" label="Pending Review" value={stats.pending_review} color="#d97706" />
        <StatCard icon="🔍" label="Under Review" value={stats.under_review} color="#7c3aed" />
        <StatCard icon="✅" label="Approved" value={stats.approved} color="#0e9f6e" />
        <StatCard icon="👥" label="Researchers" value={stats.total_researchers} color="#06b6d4" />
        <StatCard icon="📄" label="Research Outputs" value={stats.total_research_outputs} color="#8b5cf6" />
        <StatCard icon="💰" label="Total Approved Funding" value={formatCurrency(stats.total_approved_funding)} color="#0e9f6e" />
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header"><span className="card-title">Research Outputs by Type</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={outputData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#1a56db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Grants by Type</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={grantTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                {grantTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Recent Grant Applications</span></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Title</th><th>Applicant</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {stats.recent_grants?.map(g => (
                <tr key={g.id}>
                  <td><span className="font-semibold">{g.title}</span></td>
                  <td className="text-secondary">{g.applicant?.name}</td>
                  <td><span className="badge badge-draft">{g.grant_type}</span></td>
                  <td className="font-semibold">{formatCurrency(g.amount_requested)}</td>
                  <td><Badge status={g.status} /></td>
                  <td className="text-muted text-xs">{formatDate(g.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ReviewerDash({ stats }) {
  return (
    <>
      <div className="stats-grid">
        <StatCard icon="🔍" label="Awaiting Review" value={stats.grants_awaiting_review} color="#7c3aed" />
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Grants Awaiting Review</span></div>
        {stats.recent_submissions?.length === 0 ? <EmptyState icon="✅" title="All clear!" description="No grants pending your review." /> :
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Title</th><th>Applicant</th><th>Amount</th><th>Submitted</th><th>Status</th></tr></thead>
              <tbody>
                {stats.recent_submissions?.map(g => (
                  <tr key={g.id}>
                    <td className="font-semibold">{g.title}</td>
                    <td className="text-secondary">{g.applicant?.name}</td>
                    <td>{formatCurrency(g.amount_requested)}</td>
                    <td className="text-muted text-xs">{formatDate(g.created_at)}</td>
                    <td><Badge status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </>
  );
}
