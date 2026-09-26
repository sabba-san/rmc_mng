import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../utils/api';
import { Spinner, Badge, EmptyState, CardHeader, StatCard, Alert } from '../components/UI';
import { formatCurrency, formatDate, timeAgo, STATUS_LABELS } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  FolderOpen, CheckCircle, FileText, Target, CurrencyDollar, Users,
  Clock, Trophy, Shield, PlusCircle
} from '@phosphor-icons/react';
import { ScrollReveal, StaggeredReveal } from '../components/ScrollReveal';

const CHART_COLORS = ['#104E90', '#5B3D8F', '#346538', '#956400', '#9F2F2D', '#06B6D4'];

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

  if (loading) return <Spinner size={32} className="page-loading" />;
  if (error) return <div className="page-error"><Alert type="error">{error}</Alert></div>;
  if (!stats) return null;

  const researcherStats = [
    { icon: FolderOpen, label: 'Total Grants', value: stats.total_grants, color: '#104E90', bgColor: '#E3EDF7', change: `${stats.grant_status_breakdown?.approved || 0} approved` },
    { icon: CheckCircle, label: 'Approved', value: stats.grant_status_breakdown?.approved || 0, color: '#346538', bgColor: '#EDF3EC' },
    { icon: FileText, label: 'Research Outputs', value: stats.total_research_outputs, color: '#5B3D8F', bgColor: '#EDE8F5' },
    { icon: Target, label: 'Pending Milestones', value: stats.pending_milestones, color: '#956400', bgColor: '#FBF3DB' },
    { icon: CurrencyDollar, label: 'Total Approved', value: formatCurrency(stats.total_approved_funding), color: '#06B6D4', bgColor: '#E0F7FA' },
  ];

  const adminStats = [
    { icon: FolderOpen, label: 'Total Grants', value: stats.total_grants, color: '#104E90', bgColor: '#E3EDF7' },
    { icon: Clock, label: 'Pending Review', value: stats.pending_review, color: '#956400', bgColor: '#FBF3DB' },
    { icon: Shield, label: 'Under Review', value: stats.under_review, color: '#5B3D8F', bgColor: '#EDE8F5' },
    { icon: CheckCircle, label: 'Approved', value: stats.approved, color: '#346538', bgColor: '#EDF3EC' },
    { icon: Users, label: 'Researchers', value: stats.total_researchers, color: '#06B6D4', bgColor: '#E0F7FA' },
    { icon: FileText, label: 'Research Outputs', value: stats.total_research_outputs, color: '#9F2F2D', bgColor: '#FDEBEC' },
    { icon: CurrencyDollar, label: 'Total Approved Funding', value: formatCurrency(stats.total_approved_funding), color: '#346538', bgColor: '#EDF3EC' },
  ];

  const reviewerStats = [
    { icon: Shield, label: 'Awaiting Review', value: stats.grants_awaiting_review, color: '#5B3D8F', bgColor: '#EDE8F5' },
  ];

  const getStats = () => {
    if (user.role === 'admin') return adminStats;
    if (user.role === 'reviewer') return reviewerStats;
    return researcherStats;
  };

  const getTitle = () => {
    if (user.role === 'admin') return 'RMC Admin Dashboard';
    if (user.role === 'reviewer') return 'Reviewer Dashboard';
    return `Welcome, ${user.name.split(' ')[0]}`;
  };

  const getSubtitle = () => {
    if (user.role === 'admin') return 'System-wide overview of all grants and research activities';
    if (user.role === 'reviewer') return 'Grants pending your review and approval';
    return 'Your research portfolio and active grants';
  };

  const currentStats = getStats();

  return (
    <div className="page-body">
      <div className="page-header-content">
        <div>
          <ScrollReveal as="h1" className="page-title">{getTitle()}</ScrollReveal>
          <ScrollReveal delay={100} as="p" className="page-subtitle">{getSubtitle()}</ScrollReveal>
        </div>
        {user.role === 'researcher' && (
          <ScrollReveal delay={200} as="div">
            <Link to="/grants/new" className="btn btn-primary">
              <PlusCircle weight="bold" size={18} className="mr-2" />
              New Application
            </Link>
          </ScrollReveal>
        )}
      </div>

      {/* Stats Grid */}
      <StaggeredReveal baseDelay={80} as="div" className="stats-grid" role="list" aria-label="Key metrics">
        {currentStats.map((stat, index) => (
          <ScrollReveal key={stat.label} delay={index * 80} as="article" role="listitem">
            <StatCard
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              bgColor={stat.bgColor}
              change={stat.change}
            />
          </ScrollReveal>
        ))}
      </StaggeredReveal>

      {user.role === 'researcher' && <ResearcherDash stats={stats} />}
      {user.role === 'admin' && <AdminDash stats={stats} />}
      {user.role === 'reviewer' && <ReviewerDash stats={stats} />}
    </div>
  );
}

function ResearcherDash({ stats }) {
  const breakdown = Object.entries(stats.grant_status_breakdown || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="dashboard-sections">
      <StaggeredReveal baseDelay={100} as="div" className="bento-grid-auto dashboard-grid" style={{ minWidth: '400px' }}>
        <ScrollReveal delay={0} as="section" className="card p-6" style={{ gridColumn: 'span 2' }}>
          <CardHeader title="Grant Status Breakdown" />
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  label={({ name, value }) => value > 0 ? `${STATUS_LABELS[name] || name}: ${value}` : ''}
                  labelLine={false}
                >
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  formatter={(value, name) => [value, STATUS_LABELS[name] || name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120} as="section" className="card p-6">
          <CardHeader title="Recent Grants" />
          {stats.recent_grants?.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No grants yet"
              description="Submit your first grant application to get started."
              action={<Link to="/grants/new" className="btn btn-primary mt-4"><PlusCircle weight="bold" size={16} className="mr-2" />New Application</Link>}
            />
          ) : (
            <div className="recent-grants-list">
              {stats.recent_grants?.map(g => (
                <div key={g.id} className="recent-grant-item">
                  <div className="recent-grant-info">
                    <div className="recent-grant-title truncate" style={{ maxWidth: 240 }}>{g.title}</div>
                    <div className="recent-grant-meta">
                      <span className="text-caption">{timeAgo(g.created_at)}</span>
                      <Badge status={g.status} className="ml-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>

        <ScrollReveal delay={240} as="section" className="card p-6">
          <CardHeader title="Quick Actions" />
          <div className="quick-actions">
            <Link to="/grants/new" className="quick-action-btn">
              <PlusCircle weight="bold" size={20} />
              <span>New Application</span>
            </Link>
            <Link to="/milestones" className="quick-action-btn">
              <Target weight="bold" size={20} />
              <span>View Milestones</span>
            </Link>
            <Link to="/outputs" className="quick-action-btn">
              <FileText weight="bold" size={20} />
              <span>Add Output</span>
            </Link>
            <Link to="/documents" className="quick-action-btn">
              <Trophy weight="bold" size={20} />
              <span>Upload Document</span>
            </Link>
          </div>
        </ScrollReveal>
      </StaggeredReveal>
    </div>
  );
}

function AdminDash({ stats }) {
  const outputData = Object.entries(stats.output_by_type || {}).map(([name, value]) => ({ name, value }));
  const grantTypeData = Object.entries(stats.grants_by_type || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="dashboard-sections">
      <StaggeredReveal baseDelay={100} as="div" className="bento-grid-auto dashboard-grid" style={{ minWidth: '400px' }}>
        <ScrollReveal delay={0} as="section" className="card p-6" style={{ gridColumn: 'span 2' }}>
          <CardHeader title="Research Outputs by Type" />
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outputData} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#104E90"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120} as="section" className="card p-6">
          <CardHeader title="Grants by Type" />
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={grantTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {grantTypeData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={240} as="section" className="card p-6" style={{ gridColumn: '1 / -1' }}>
          <CardHeader title="Recent Grant Applications" />
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Applicant</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_grants?.map(g => (
                  <tr key={g.id}>
                    <td><span className="font-semibold">{g.title}</span></td>
                    <td className="text-secondary">{g.applicant?.name}</td>
                    <td><Badge className="badge-draft">{g.grant_type}</Badge></td>
                    <td className="font-semibold">{formatCurrency(g.amount_requested)}</td>
                    <td><Badge status={g.status} /></td>
                    <td className="text-muted text-sm">{formatDate(g.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </StaggeredReveal>
    </div>
  );
}

function ReviewerDash({ stats }) {
  return (
    <div className="dashboard-sections">
      <StaggeredReveal baseDelay={100} as="div" className="bento-grid-auto dashboard-grid" style={{ minWidth: '400px' }}>
        <ScrollReveal delay={0} as="section" className="card p-6">
          <CardHeader title="Grants Awaiting Review" />
          {stats.recent_submissions?.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="All clear!"
              description="No grants pending your review at the moment."
            />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Applicant</th>
                    <th>Amount</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_submissions?.map(g => (
                    <tr key={g.id}>
                      <td className="font-semibold">{g.title}</td>
                      <td className="text-secondary">{g.applicant?.name}</td>
                      <td>{formatCurrency(g.amount_requested)}</td>
                      <td className="text-muted text-sm">{formatDate(g.created_at)}</td>
                      <td><Badge status={g.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ScrollReveal>

        <ScrollReveal delay={120} as="section" className="card p-6">
          <CardHeader title="Review Guidelines" />
          <div className="review-guidelines">
            <p className="text-secondary mb-4">When reviewing grants, consider:</p>
            <ul className="guideline-list">
              <li>Alignment with UUM research priorities</li>
              <li>Feasibility of methodology and timeline</li>
              <li>Budget justification and value for money</li>
              <li>Track record of the research team</li>
              <li>Potential for high-impact outputs</li>
            </ul>
          </div>
        </ScrollReveal>
      </StaggeredReveal>
    </div>
  );
}