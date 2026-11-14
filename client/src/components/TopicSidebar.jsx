import React from 'react';
import {
  Layers,
  LayoutDashboard,
  Landmark,
  Globe,
  BookmarkCheck,
  Briefcase,
  User,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoldBarIcon } from './GoldSilverMarketDesk';
import { BrandLogo } from './BrandLogo';

export const WORKSPACE_TOPICS = [
  {
    id: 'all-markets',
    label: 'All Companies Market',
    shortLabel: 'All Markets',
    group: 'markets',
    icon: Layers,
    requiresAuth: false
  },
  {
    id: 'dashboard',
    label: 'Workstation',
    shortLabel: 'Workstation',
    group: 'markets',
    icon: LayoutDashboard,
    requiresAuth: false
  },
  {
    id: 'nse-india',
    label: 'NSE Indian Market',
    shortLabel: 'NSE India',
    group: 'markets',
    icon: Landmark,
    requiresAuth: false
  },
  {
    id: 'global-indices',
    label: 'Global Major Indices',
    shortLabel: 'Global Indices',
    group: 'markets',
    icon: Globe,
    requiresAuth: false
  },
  {
    id: 'gold-silver',
    label: 'Gold & Silver Market',
    shortLabel: 'Gold & Silver',
    group: 'markets',
    icon: GoldBarIcon,
    requiresAuth: false
  },
  {
    id: 'watchlist-alerts',
    label: 'Watchlist & Price Alerts',
    shortLabel: 'Watchlist & Alerts',
    group: 'account',
    icon: BookmarkCheck,
    requiresAuth: true
  },
  {
    id: 'portfolio',
    label: 'Paper Trading ($1,000)',
    shortLabel: 'Paper Trading',
    group: 'account',
    icon: Briefcase,
    requiresAuth: true
  },
  {
    id: 'profile',
    label: 'Trader Profile',
    shortLabel: 'Trader Profile',
    group: 'account',
    icon: User,
    requiresAuth: true
  }
];

export function isTopicActive(activeTab, topicId) {
  if (topicId === 'watchlist-alerts') {
    return activeTab === 'watchlist-alerts' || activeTab === 'watchlist' || activeTab === 'alerts';
  }
  return activeTab === topicId;
}

export function TopicSidebar({
  activeTab,
  onSelectTopic,
  isMobileOpen,
  onCloseMobile,
  onOpenAuthModal,
  onOpenProfile,
  watchlistCount = 0
}) {
  const { user, logout } = useAuth();
  const marketTopics = WORKSPACE_TOPICS.filter((t) => t.group === 'markets');
  const accountTopics = WORKSPACE_TOPICS.filter((t) => t.group === 'account');

  const renderTopicButton = (topic) => {
    const IconComp = topic.icon;
    const active = isTopicActive(activeTab, topic.id);

    return (
      <button
        key={topic.id}
        type="button"
        className={`sidebar-topic-btn ${active ? 'active' : ''}`}
        onClick={() => onSelectTopic(topic.id, topic.requiresAuth)}
        title={topic.label}
        aria-current={active ? 'page' : undefined}
      >
        <span className="sidebar-topic-icon">
          <IconComp size={17} />
        </span>
        <span className="sidebar-topic-label">{topic.label}</span>
        {topic.id === 'watchlist-alerts' && watchlistCount > 0 && (
          <span className="sidebar-topic-badge font-mono">{watchlistCount}</span>
        )}
      </button>
    );
  };

  return (
    <div className="desk-sidebar-slot">
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`desk-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Market Navigation Sidebar"
      >
        {/* Mobile & Drawer Header */}
        <div className="sidebar-drawer-header">
          <BrandLogo size="normal" />
          <button
            type="button"
            className="sidebar-drawer-close-btn record-close-btn"
            onClick={onCloseMobile}
            aria-label="Close Sidebar Navigation"
            title="Close Menu"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className="sidebar-scroll-body">
          <div className="sidebar-nav-section">
            <div className="sidebar-section-label">Markets &amp; Desks</div>
            <div className="sidebar-nav-list">
              {marketTopics.map(renderTopicButton)}
            </div>
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-nav-section">
            <div className="sidebar-section-label">Portfolio &amp; Tools</div>
            <div className="sidebar-nav-list">
              {accountTopics.map(renderTopicButton)}
            </div>
          </div>
        </div>

        {/* Bottom Account Auth Controls */}
        <div className="sidebar-footer-actions">
          {user ? (
            <div className="sidebar-auth-group">
              <button
                type="button"
                className="sidebar-profile-trigger"
                onClick={() => {
                  onCloseMobile();
                  if (onOpenProfile) onOpenProfile();
                }}
                title={`Logged in as ${user.name || user.email}`}
              >
                <span className="sidebar-utility-icon sidebar-profile-avatar-wrap">
                  <span className="sidebar-profile-avatar">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </span>
                </span>
                <span className="sidebar-utility-label sidebar-profile-name">
                  {user.name || user.email.split('@')[0]}
                </span>
              </button>

              <button
                type="button"
                className="sidebar-utility-btn sidebar-signout-btn"
                onClick={() => {
                  onCloseMobile();
                  logout();
                }}
                title="Sign out from workstation"
                aria-label="Sign out"
              >
                <span className="sidebar-utility-icon">
                  <LogOut size={15} />
                </span>
                <span className="sidebar-utility-label">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary sidebar-signin-btn"
              onClick={() => {
                onCloseMobile();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              title="Sign in to workstation"
              aria-label="Sign in"
            >
              <span className="sidebar-utility-icon">
                <User size={15} />
              </span>
              <span className="sidebar-utility-label">Sign In</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
