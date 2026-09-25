import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkle, Shield, Database, ChartLine, FolderOpen, FileText } from '@phosphor-icons/react';
import { ScrollReveal, StaggeredReveal } from '../components/ScrollReveal';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-background" aria-hidden="true">
          <div className="hero-gradient-blob" />
          <div className="hero-gradient-blob hero-gradient-blob-2" />
        </div>
        <div className="container hero-content">
          <StaggeredReveal baseDelay={100} as="div" className="hero-text">
            <ScrollReveal delay={0} as="span" className="hero-badge">
              <Sparkle weight="bold" size={14} className="mr-2" />
              Research Management Centre · Universiti Utara Malaysia
            </ScrollReveal>
            <ScrollReveal delay={100} as="h1" id="hero-heading" className="display-heading hero-title">
              Catalysing Research Excellence Through Streamlined Grant Management
            </ScrollReveal>
            <ScrollReveal delay={200} as="p" className="lead hero-description">
              A purpose-built platform for researchers, reviewers, and administrators to manage the full lifecycle of research grants — from application to output tracking.
            </ScrollReveal>
            <ScrollReveal delay={300} as="div" className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-lg">
                Access Portal
                <ArrowRight weight="bold" size={18} className="ml-2" />
              </Link>
              <button type="button" className="btn btn-secondary btn-lg">
                View Grant Guidelines
              </button>
            </ScrollReveal>
          </StaggeredReveal>
        </div>
      </section>

      {/* Active Grant Alert */}
      <section className="alert-banner" aria-label="Active grant opportunity">
        <div className="container">
          <div className="alert alert-info alert-banner-inner">
            <span className="alert-icon" aria-hidden="true">
              <Sparkle weight="bold" size={18} />
            </span>
            <div className="alert-content">
              <strong>Active Opportunity:</strong> The Digital Society Research Grant (DSRG) 2026 application window is now open. Submit your proposals via the portal before 31 October 2026.
            </div>
            <Link to="/login" className="btn btn-sm btn-primary">Apply Now</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" aria-labelledby="features-heading">
        <div className="container">
          <div className="section-header">
            <ScrollReveal as="h2" id="features-heading" className="section-title">
              Platform Capabilities
            </ScrollReveal>
            <ScrollReveal delay={100} as="p" className="lead section-description">
              Designed for the research workflow — not generic project management.
            </ScrollReveal>
          </div>

          <StaggeredReveal baseDelay={120} as="div" className="bento-grid-auto features-grid" style={{ minWidth: '320px' }}>
            <ScrollReveal delay={0} as="article" className="card feature-card p-6">
              <div className="feature-icon">
                <FolderOpen weight="bold" size={28} />
              </div>
              <h3 className="feature-title">Grant Applications</h3>
              <p className="feature-description">Submit FRGS, PRGS, TRGS, and internal grants through a guided, validation-aware workflow. Auto-save drafts, attach documents, track status.</p>
            </ScrollReveal>

            <ScrollReveal delay={120} as="article" className="card feature-card p-6">
              <div className="feature-icon">
                <ChartLine weight="bold" size={28} />
              </div>
              <h3 className="feature-title">Milestone Tracking</h3>
              <p className="feature-description">Define milestones with dates and deliverables. Automated reminders, progress reporting, and variance analysis against approved plans.</p>
            </ScrollReveal>

            <ScrollReveal delay={240} as="article" className="card feature-card p-6">
              <div className="feature-icon">
                <FileText weight="bold" size={28} />
              </div>
              <h3 className="feature-title">Research Outputs</h3>
              <p className="feature-description">Log publications, conferences, patents, and creative works. Link to grants, track indexing (Scopus/WoS), impact factors, and KPIs.</p>
            </ScrollReveal>

            <ScrollReveal delay={360} as="article" className="card feature-card p-6">
              <div className="feature-icon">
                <Database weight="bold" size={28} />
              </div>
              <h3 className="feature-title">Document Vault</h3>
              <p className="feature-description">Secure, versioned storage for proposals, ethics approvals, financial receipts, and manuscript proofs. Role-based access control.</p>
            </ScrollReveal>

            <ScrollReveal delay={480} as="article" className="card feature-card p-6">
              <div className="feature-icon">
                <Shield weight="bold" size={28} />
              </div>
              <h3 className="feature-title">Review Workflow</h3>
              <p className="feature-description">Transparent routing for Deans, RMC admins, and external reviewers. Comment threads, scoring rubrics, and audit trails.</p>
            </ScrollReveal>

            <ScrollReveal delay={600} as="article" className="card feature-card p-6">
              <div className="feature-icon">
                <Sparkle weight="bold" size={28} />
              </div>
              <h3 className="feature-title">Analytics & Reporting</h3>
              <p className="feature-description">Real-time dashboards for researchers, Deans, and RMC. Export compliance reports, funding utilisation, and output summaries.</p>
            </ScrollReveal>
          </StaggeredReveal>
        </div>
      </section>

      {/* Stats / Credibility */}
      <section className="stats-section" aria-labelledby="stats-heading">
        <div className="container">
          <StaggeredReveal baseDelay={100} as="div" className="stats-grid">
            <ScrollReveal delay={0} as="div" className="stat-item">
              <div className="stat-value">1,240+</div>
              <div className="stat-label">Active Grants Managed</div>
            </ScrollReveal>
            <ScrollReveal delay={100} as="div" className="stat-item">
              <div className="stat-value">MYR 84.7M</div>
              <div className="stat-label">Total Funding Tracked</div>
            </ScrollReveal>
            <ScrollReveal delay={200} as="div" className="stat-item">
              <div className="stat-value">3,180</div>
              <div className="stat-label">Research Outputs Logged</div>
            </ScrollReveal>
            <ScrollReveal delay={300} as="div" className="stat-item">
              <div className="stat-value">94%</div>
              <div className="stat-label">On-time Milestone Rate</div>
            </ScrollReveal>
          </StaggeredReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <ScrollReveal as="h2" id="cta-heading" className="heading-2 cta-title">
                Ready to streamline your research administration?
              </ScrollReveal>
              <ScrollReveal delay={100} as="p" className="lead cta-description">
                Join researchers across UUM who have moved from spreadsheets to a system built for research.
              </ScrollReveal>
            </div>
            <ScrollReveal delay={200} as="div" className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Researcher Account
                <ArrowRight weight="bold" size={18} className="ml-2" />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer" role="contentinfo">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="footer-logo-icon">R</span>
                <span>RMC System</span>
              </div>
              <p className="footer-tagline">Research Management Centre, Universiti Utara Malaysia</p>
            </div>
            <nav className="footer-nav" aria-label="Footer navigation">
              <h4 className="footer-nav-title">Resources</h4>
              <ul>
                <li><a href="#">Grant Guidelines</a></li>
                <li><a href="#">Policy Documents</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Contact RMC</a></li>
              </ul>
            </nav>
            <nav className="footer-nav" aria-label="Footer navigation">
              <h4 className="footer-nav-title">Links</h4>
              <ul>
                <li><a href="https://www.uum.edu.my" target="_blank" rel="noopener noreferrer">UUM Official Website</a></li>
                <li><a href="https://www.mohe.gov.my" target="_blank" rel="noopener noreferrer">Ministry of Higher Education</a></li>
                <li><a href="https://www.mosti.gov.my" target="_blank" rel="noopener noreferrer">MOSTI</a></li>
              </ul>
            </nav>
          </div>
          <div className="footer-bottom">
            <p className="copyright">© 2026 Research Management Centre (RMC), Universiti Utara Malaysia, Sintok, Kedah.</p>
            <p className="footer-note">This is a demonstration system. Data is simulated.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;