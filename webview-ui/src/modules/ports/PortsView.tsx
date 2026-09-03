import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Zap,
  RefreshCw,
  Search,
  Terminal,
  Folder,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { vscode } from '../../vscodeApi';
import { HostToWebviewMessage, PortProcessInfo } from '../../../../src/common/types';

export const PortsView: React.FC = () => {
  const [ports, setPorts] = useState<PortProcessInfo[]>([]);
  const [detectedProjectPorts, setDetectedProjectPorts] = useState<number[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [customPortInput, setCustomPortInput] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Initial Scan on Mount & Message Listener
  useEffect(() => {
    setIsScanning(true);
    vscode.postMessage({ type: 'SCAN_PORTS' });

    const unsub = vscode.onMessage((msg: HostToWebviewMessage) => {
      if (msg.type === 'PORT_SCAN_RESULTS') {
        setPorts(msg.payload.ports || []);
        setDetectedProjectPorts(msg.payload.detectedProjectPorts || []);
        setIsScanning(false);
      } else if (msg.type === 'PORT_KILLED_RESULT') {
        setKillingPid(null);
        if (msg.payload.success) {
          setStatusMessage({
            text: `Port ${msg.payload.port} (PID ${msg.payload.pid}) terminated and freed!`,
            type: 'success',
          });
        } else {
          setStatusMessage({
            text: `Failed to kill PID ${msg.payload.pid}: ${msg.payload.error || 'Permission denied'}`,
            type: 'error',
          });
        }

        // Clear status alert after 4 seconds
        setTimeout(() => setStatusMessage(null), 4000);
      }
    });

    return () => unsub();
  }, []);

  const handleRefresh = (customPort?: number) => {
    setIsScanning(true);
    setStatusMessage(null);
    vscode.postMessage({
      type: 'SCAN_PORTS',
      payload: customPort ? { customPort } : undefined,
    });
  };

  const handleCustomPortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(customPortInput.trim(), 10);
    if (!isNaN(p) && p > 0 && p <= 65535) {
      handleRefresh(p);
    } else {
      handleRefresh();
    }
  };

  const handleKill = (pid: number, port: number) => {
    setKillingPid(pid);
    vscode.postMessage({
      type: 'KILL_PORT_PROCESS',
      payload: { pid, port },
    });
  };

  // Split into Workspace vs Other Dev Ports
  const filteredPorts = useMemo(() => {
    if (!filterQuery.trim()) return ports;
    const q = filterQuery.toLowerCase();
    return ports.filter(
      p =>
        p.port.toString().includes(q) ||
        p.command.toLowerCase().includes(q) ||
        p.fullCommand.toLowerCase().includes(q) ||
        (p.cwd && p.cwd.toLowerCase().includes(q))
    );
  }, [ports, filterQuery]);

  const workspacePorts = useMemo(() => {
    return filteredPorts.filter(p => p.isCurrentProject);
  }, [filteredPorts]);

  // If user searched for a specific port number, show that custom inspected port
  const customInspectedPort = useMemo(() => {
    const pNum = parseInt(customPortInput.trim(), 10);
    if (isNaN(pNum)) return null;
    return filteredPorts.find(p => p.port === pNum && !p.isCurrentProject) || null;
  }, [filteredPorts, customPortInput]);

  return (
    <div className="ports-container">
      {/* Header Banner */}
      <div className="ports-header">
        <div className="ports-header-info">
          <div className="ports-title-row">
            <Radio size={18} className="ports-header-icon" />
            <h2 className="ports-title">Project Port Janitor</h2>
          </div>
          <p className="ports-subtitle">
            Monitors dev servers and ghost processes launched from this workspace.
          </p>
        </div>

        <button
          className={`ports-refresh-btn ${isScanning ? 'is-spinning' : ''}`}
          onClick={() => handleRefresh()}
          disabled={isScanning}
          title="Refresh Workspace Ports"
        >
          <RefreshCw size={14} />
          <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
        </button>
      </div>

      {/* Status Feedback Alert */}
      {statusMessage && (
        <div className={`ports-alert ports-alert-${statusMessage.type}`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Project Config Detected Bar */}
      {detectedProjectPorts.length > 0 && (
        <div className="ports-detected-bar">
          <span className="ports-detected-label">
            <Layers size={13} />
            Project Configured Ports:
          </span>
          <div className="ports-detected-pills">
            {detectedProjectPorts.map(p => (
              <button
                key={p}
                className="ports-detected-pill"
                onClick={() => {
                  setCustomPortInput(p.toString());
                  handleRefresh(p);
                }}
                title={`Inspect port :${p}`}
              >
                :{p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Custom Port Input Bar */}
      <div className="ports-search-row">
        <form onSubmit={handleCustomPortSubmit} className="ports-search-form">
          <Search size={14} className="ports-search-icon" />
          <input
            type="text"
            className="ports-search-input"
            placeholder="Inspect any port (e.g. 3000, 5173, 8080)..."
            value={filterQuery || customPortInput}
            onChange={e => {
              setFilterQuery(e.target.value);
              setCustomPortInput(e.target.value);
            }}
          />
          {customPortInput && (
            <button
              type="button"
              className="ports-search-clear"
              onClick={() => {
                setFilterQuery('');
                setCustomPortInput('');
                handleRefresh();
              }}
            >
              ×
            </button>
          )}
        </form>
      </div>

      {/* Custom Port Quick Inspection Result */}
      {customInspectedPort && (
        <div className="ports-section">
          <div className="ports-section-header">
            <div className="ports-section-title-wrap">
              <span className="ports-indicator-dot system-dot" />
              <h3 className="ports-section-title">Inspected Port :{customInspectedPort.port}</h3>
            </div>
            <span className="ports-badge system-badge">Active</span>
          </div>

          <div className="port-card other-card">
            <div className="port-card-top">
              <div className="port-identity">
                <span className="port-number-tag other-tag">:{customInspectedPort.port}</span>
                <span className="port-command-tag">{customInspectedPort.command}</span>
                <span className="port-pid-tag">PID {customInspectedPort.pid}</span>
                {customInspectedPort.user && <span className="port-user-tag">{customInspectedPort.user}</span>}
              </div>

              <button
                className="port-kill-btn primary-kill"
                onClick={() => handleKill(customInspectedPort.pid, customInspectedPort.port)}
                disabled={killingPid === customInspectedPort.pid}
              >
                <Zap size={13} />
                <span>{killingPid === customInspectedPort.pid ? 'Killing...' : 'Kill Process'}</span>
              </button>
            </div>

            {customInspectedPort.fullCommand && customInspectedPort.fullCommand !== customInspectedPort.command && (
              <div className="port-command-preview" title={customInspectedPort.fullCommand}>
                <Terminal size={12} className="port-cmd-icon" />
                <code>{customInspectedPort.fullCommand}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 1: This Workspace Running Processes */}
      <div className="ports-section">
        <div className="ports-section-header">
          <div className="ports-section-title-wrap">
            <span className="ports-indicator-dot project-dot" />
            <h3 className="ports-section-title">This Workspace's Processes</h3>
          </div>
          <span className="ports-badge project-badge">
            {workspacePorts.length} Active
          </span>
        </div>

        {workspacePorts.length > 0 ? (
          <div className="ports-list">
            {workspacePorts.map(item => (
              <div key={`${item.port}-${item.pid}`} className="port-card workspace-card">
                <div className="port-card-top">
                  <div className="port-identity">
                    <span className="port-number-tag">:{item.port}</span>
                    <span className="port-command-tag">{item.command}</span>
                    {item.relativeCwd && item.relativeCwd !== '.' && (
                      <span className="port-service-tag" title={`Microservice folder: ${item.relativeCwd}`}>
                        <Folder size={11} />
                        {item.relativeCwd}
                      </span>
                    )}
                    <span className="port-pid-tag">PID {item.pid}</span>
                  </div>

                  <button
                    className="port-kill-btn primary-kill"
                    onClick={() => handleKill(item.pid, item.port)}
                    disabled={killingPid === item.pid}
                  >
                    <Zap size={13} />
                    <span>{killingPid === item.pid ? 'Killing...' : 'Kill Process'}</span>
                  </button>
                </div>

                {item.fullCommand && item.fullCommand !== item.command && (
                  <div className="port-command-preview" title={item.fullCommand}>
                    <Terminal size={12} className="port-cmd-icon" />
                    <code>{item.fullCommand}</code>
                  </div>
                )}

                {item.cwd && (
                  <div className="port-cwd-preview" title={item.cwd}>
                    <Folder size={12} className="port-cwd-icon" />
                    <span>{item.cwd}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="ports-empty-inline">
            <ShieldCheck size={16} className="text-emerald" />
            <span>No ghost processes running from this workspace. Ports are clean!</span>
          </div>
        )}
      </div>
    </div>
  );
};
