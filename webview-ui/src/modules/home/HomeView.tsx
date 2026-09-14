import React from 'react';
import { Screen } from '../../../../src/common/types';
import {
  Code2,
  RefreshCw,
  Radio,
  Wrench,
  Dices,
  ChevronRight,
  MessageSquareHeart,
} from 'lucide-react';

declare global {
  interface Window {
    __LOGO_URI__?: string;
  }
}

type HomeModule = Exclude<Screen, 'home'>;

interface LaunchCard {
  id: HomeModule;
  title: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  accentClass: string;
}

interface HomeViewProps {
  snippetCount: number;
  onNavigate: (moduleId: HomeModule) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ snippetCount, onNavigate }) => {
  const cards: LaunchCard[] = [
    {
      id: 'snippets',
      title: 'Snippets',
      description: 'Save, search and insert reusable code',
      badge: snippetCount === 1 ? '1 saved' : `${snippetCount} saved`,
      icon: <Code2 size={18} />,
      accentClass: 'launch-card--snippets',
    },
    {
      id: 'converters',
      title: 'Converters',
      description: '100% offline · PDF, WebP, JSON & more',
      badge: 'Offline',
      icon: <RefreshCw size={18} />,
      accentClass: 'launch-card--converters',
    },
    {
      id: 'ports',
      title: 'Ports',
      description: 'Find and kill blocked dev server ports',
      badge: 'On demand',
      icon: <Radio size={18} />,
      accentClass: 'launch-card--ports',
    },
    {
      id: 'utility',
      title: 'Utilities',
      description: 'JWT inspector, UUID, Base64 & hash tools',
      badge: '8 tools',
      icon: <Wrench size={18} />,
      accentClass: 'launch-card--utility',
    },
    {
      id: 'randomdata',
      title: 'Random Data',
      description: 'Generate fake emails, names, addresses & more',
      badge: '14 types',
      icon: <Dices size={18} />,
      accentClass: 'launch-card--randomdata',
    },
  ];

  return (
    <div className="home-view">
      <div className="launch-list">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`launch-card ${card.accentClass}`}
            onClick={() => onNavigate(card.id)}
          >
            <div className="launch-icon-tile">{card.icon}</div>
            <div className="launch-info">
              <span className="launch-title">{card.title}</span>
              <span className="launch-desc">{card.description}</span>
            </div>
            <div className="launch-trailing">
              <span className="launch-stat">{card.badge}</span>
              <ChevronRight className="launch-chevron" size={14} />
            </div>
          </button>
        ))}
      </div>

      <button type="button" className="feedback-cta-btn" onClick={() => onNavigate('feedback')}>
        <MessageSquareHeart size={16} />
        <span>Please provide me Feedback</span>
      </button>

      <div className="home-footer">
        <div className="footer-row">
          <div className="footer-brand">
            {window.__LOGO_URI__ && (
              <img src={window.__LOGO_URI__} alt="" className="footer-logo-mark" />
            )}
            <span className="footer-brand-text">myaz</span>
          </div>
          {process.env.APP_VERSION && (
            <span className="version-tag">v{process.env.APP_VERSION}</span>
          )}
        </div>
      </div>
    </div>
  );
};
