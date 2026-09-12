import React, { useMemo } from 'react';
import { Screen } from '../../../../src/common/types';
import { Code2, RefreshCw, Radio, Wrench, Dices, ChevronRight, ShieldCheck } from 'lucide-react';

const FUN_TITLES = [
  'Developer',
  'Bug Finder',
  'Vibe Coder',
  'Code Wizard',
  'Terminal Ninja',
  'Semicolon Hunter',
  'Merge Conflict Survivor',
  'Stack Overflow Regular',
  'Pixel Perfectionist',
  'Snippet Collector',
  'Port Killer',
  'Late Night Committer',
  'Console.log Detective',
  'Rubber Duck Whisperer',
  'Dark Mode Loyalist',
  'Ctrl+S Enthusiast',
];

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const HomeView: React.FC<HomeViewProps> = ({ snippetCount, onNavigate }) => {
  const funTitle = useMemo(() => FUN_TITLES[Math.floor(Math.random() * FUN_TITLES.length)], []);

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
      badge: '7 tools',
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
      <div className="welcome-greeting">
        {getGreeting()}, {funTitle}
        <span className="accent-dot" />
      </div>

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

      <div className="home-footer">
        <div className="privacy-row">
          <span className="privacy-badge" title="No network requests. Zero telemetry. 100% local.">
            <ShieldCheck size={11} />
            <span>100% Offline</span>
          </span>
          {process.env.APP_VERSION && (
            <span className="version-tag">v{process.env.APP_VERSION}</span>
          )}
        </div>
      </div>
    </div>
  );
};
