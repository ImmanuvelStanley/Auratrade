import React from 'react';
import {
  Layers,
  LayoutDashboard,
  Landmark,
  Globe,
  BookmarkCheck,
  Briefcase,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
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
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  isFullscreen,
  onToggleFullscreen,
  watchlistCount = 0
}) {
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
    <>
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`desk-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
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

        {/* Bottom Utility Actions */}
        <div className="sidebar-footer-actions">
          <button
            type="button"
            className={`sidebar-utility-btn ${isFullscreen ? 'active' : ''}`}
            onClick={() => {
              onCloseMobile();
              onToggleFullscreen();
            }}
            title={isFullscreen ? 'Exit Full Screen Mode (Esc)' : 'View Selected Topic in Full Screen'}
          >
            <span className="sidebar-utility-icon">
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </span>
            <span className="sidebar-utility-label">
              {isFullscreen ? 'Exit Full Screen' : 'Full Screen View'}
            </span>
          </button>

          <button
            type="button"
            className="sidebar-utility-btn sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="sidebar-utility-icon">
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </span>
            <span className="sidebar-utility-label">
              {isCollapsed ? 'Expand' : 'Collapse Sidebar'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
