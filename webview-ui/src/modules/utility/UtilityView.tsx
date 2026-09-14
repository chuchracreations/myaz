import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Wrench,
  Hash,
  Binary,
  Globe,
  Clock,
  Search,
  Timer,
  CaseSensitive,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { JwtInspector } from './JwtInspector';
import { UuidTool } from './tools/UuidTool';
import { Base64Tool } from './tools/Base64Tool';
import { HashTool } from './tools/HashTool';
import { UrlEncoderTool } from './tools/UrlEncoderTool';
import { DateTimezoneTool } from './tools/DateTimezoneTool';
import { RegexTool } from './tools/RegexTool';
import { CronTool } from './tools/CronTool';
import { CaseConverterTool } from './tools/CaseConverterTool';

type ToolId =
  | 'jwt'
  | 'uuid'
  | 'base64'
  | 'hash'
  | 'url'
  | 'datetime'
  | 'regex'
  | 'cron'
  | 'case';

interface ToolMeta {
  id: ToolId;
  title: string;
  desc: string;
  icon: React.ReactNode;
  accentClass: string;
  tag?: 'live' | 'new';
}

const TOOLS: ToolMeta[] = [
  {
    id: 'jwt',
    title: 'JWT Inspector',
    desc: 'Decode & verify JSON Web Tokens',
    icon: <KeyRound size={16} />,
    accentClass: 'launch-card--jwt',
    tag: 'live',
  },
  {
    id: 'uuid',
    title: 'UUID Generator',
    desc: 'Generate & copy a fresh UUID v4',
    icon: <Hash size={16} />,
    accentClass: 'launch-card--uuid',
  },
  {
    id: 'base64',
    title: 'Base64 Converter',
    desc: 'Encode / decode text strings',
    icon: <Binary size={16} />,
    accentClass: 'launch-card--base64',
  },
  {
    id: 'hash',
    title: 'SHA-256 Hasher',
    desc: 'Cryptographic checksum for text',
    icon: <ShieldCheck size={16} />,
    accentClass: 'launch-card--hash',
  },
  {
    id: 'url',
    title: 'URL Encoder',
    desc: 'Encode / decode URI components',
    icon: <Globe size={16} />,
    accentClass: 'launch-card--url',
  },
  {
    id: 'datetime',
    title: 'Date & Timezone',
    desc: 'Convert dates across timezones',
    icon: <Clock size={16} />,
    accentClass: 'launch-card--datetime',
  },
  {
    id: 'regex',
    title: 'Regex Tester',
    desc: 'Test patterns with live match highlighting',
    icon: <Search size={16} />,
    accentClass: 'launch-card--regex',
    tag: 'new',
  },
  {
    id: 'cron',
    title: 'Cron Builder',
    desc: 'Build & explain cron expressions in plain English',
    icon: <Timer size={16} />,
    accentClass: 'launch-card--cron',
    tag: 'new',
  },
  {
    id: 'case',
    title: 'Case Converter',
    desc: 'camelCase, snake_case, kebab-case & more, at once',
    icon: <CaseSensitive size={16} />,
    accentClass: 'launch-card--case',
    tag: 'new',
  },
];

export const UtilityView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  if (activeTool) {
    const meta = TOOLS.find((t) => t.id === activeTool)!;
    return (
      <div className="utility-tool-view">
        <div className="tool-back-header">
          <button
            type="button"
            className="tool-back-btn"
            onClick={() => setActiveTool(null)}
            aria-label="Back to Utilities"
          >
            <ChevronLeft size={15} />
          </button>
          <div className={`tool-icon-tile ${meta.accentClass}`}>{meta.icon}</div>
          <span className="tool-title">{meta.title}</span>
        </div>

        {activeTool === 'jwt' && <JwtInspector />}
        {activeTool === 'uuid' && <UuidTool />}
        {activeTool === 'base64' && <Base64Tool />}
        {activeTool === 'hash' && <HashTool />}
        {activeTool === 'url' && <UrlEncoderTool />}
        {activeTool === 'datetime' && <DateTimezoneTool />}
        {activeTool === 'regex' && <RegexTool />}
        {activeTool === 'cron' && <CronTool />}
        {activeTool === 'case' && <CaseConverterTool />}
      </div>
    );
  }

  return (
    <div className="utility-landing">
      <div className="utility-header">
        <div className="utility-icon-tile">
          <Wrench size={16} />
        </div>
        <div>
          <div className="utility-title">Utilities</div>
          <div className="utility-subtitle">Handy dev tools, 100% offline</div>
        </div>
      </div>

      <div className="launch-list">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`launch-card ${tool.accentClass}`}
            onClick={() => setActiveTool(tool.id)}
          >
            <div className="launch-icon-tile">{tool.icon}</div>
            <div className="launch-info">
              <div className="launch-title-row">
                <span className="launch-title">{tool.title}</span>
                {tool.tag === 'live' && <span className="live-tag">Live</span>}
                {tool.tag === 'new' && <span className="new-tag">New</span>}
              </div>
              <span className="launch-desc">{tool.desc}</span>
            </div>
            <ChevronRight className="launch-chevron" size={14} />
          </button>
        ))}
      </div>

      <div className="utility-privacy-line">
        <ShieldCheck size={11} />
        <span>Nothing here ever leaves your machine</span>
      </div>
    </div>
  );
};
