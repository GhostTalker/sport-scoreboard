import { useState, useEffect } from 'react';
import {
  fetchHealthCheck,
  getStatusColor,
  getStatusIcon,
  getCircuitBreakerColor,
  formatHitRate,
  type HealthCheckResponse,
} from '../../services/healthApi';

export function SystemHealth() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHealthCheck();
      setHealth(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadHealth, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">❌</span>
          <div>
            <h3 className="text-lg font-semibold text-red-400">Backend Offline</h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
        <button
          onClick={loadHealth}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getStatusIcon(health.status)}</span>
          <div>
            <h3 className={`text-xl font-bold ${getStatusColor(health.status)}`}>
              System {health.status.toUpperCase()}
            </h3>
            <p className="text-sm text-white/50">
              Last updated: {lastRefresh.toLocaleTimeString('de-DE')}
            </p>
          </div>
        </div>
        <button
          onClick={loadHealth}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Uptime & Memory */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-white/70">Uptime</span>
          </div>
          <div className="text-2xl font-bold text-white">{health.uptimeFormatted}</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="text-sm font-medium text-white/70">Memory</span>
          </div>
          <div className="text-2xl font-bold text-white">{health.memory.used}</div>
          <div className="text-xs text-white/50">of {health.memory.total}</div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          API Services
        </h4>

        <div className="space-y-3">
          {/* ESPN Service */}
          <div className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getStatusIcon(health.services.espn.status)}</span>
              <div>
                <div className="font-medium text-white">ESPN API</div>
                <div className="text-sm text-white/50">NFL Game Data</div>
              </div>
            </div>
            <div className="text-right">
              {health.services.espn.circuitBreaker && (
                <div className={`text-sm font-medium ${getCircuitBreakerColor(health.services.espn.circuitBreaker.state)}`}>
                  Circuit: {health.services.espn.circuitBreaker.state}
                </div>
              )}
              <div className="text-xs text-white/50">
                Active Requests: {health.services.espn.activeRequests || 0}
              </div>
            </div>
          </div>

          {/* OpenLigaDB Service */}
          <div className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getStatusIcon(health.services.openligadb.status)}</span>
              <div>
                <div className="font-medium text-white">OpenLigaDB API</div>
                <div className="text-sm text-white/50">Soccer Data</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-green-500">
                Status: {health.services.openligadb.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Metrics */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Cache Performance
        </h4>

        <div className="space-y-4">
          {/* ESPN Cache */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">ESPN Cache</span>
              <span className="text-sm text-white/70">{health.cache.espn.size} / {health.cache.espn.maxSize}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-600/30 rounded p-2">
                <div className="text-lg font-bold text-green-400">{formatHitRate(health.cache.espn.hitRate)}</div>
                <div className="text-xs text-white/50">Hit Rate</div>
              </div>
              <div className="bg-slate-600/30 rounded p-2">
                <div className="text-lg font-bold text-blue-400">{health.cache.espn.hits}</div>
                <div className="text-xs text-white/50">Hits</div>
              </div>
              <div className="bg-slate-600/30 rounded p-2">
                <div className="text-lg font-bold text-red-400">{health.cache.espn.misses}</div>
                <div className="text-xs text-white/50">Misses</div>
              </div>
            </div>
            <div className="text-xs text-white/50 text-center">
              {health.cache.espn.entries} entries cached
            </div>
          </div>

          {/* OpenLigaDB Cache */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">OpenLigaDB Cache</span>
              <span className="text-sm text-white/70">{health.cache.openligadb.size} / {health.cache.openligadb.maxSize}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-600/30 rounded p-2">
                <div className="text-lg font-bold text-green-400">{formatHitRate(health.cache.openligadb.hitRate)}</div>
                <div className="text-xs text-white/50">Hit Rate</div>
              </div>
              <div className="bg-slate-600/30 rounded p-2">
                <div className="text-lg font-bold text-blue-400">{health.cache.openligadb.hits}</div>
                <div className="text-xs text-white/50">Hits</div>
              </div>
              <div className="bg-slate-600/30 rounded p-2">
                <div className="text-lg font-bold text-red-400">{health.cache.openligadb.misses}</div>
                <div className="text-xs text-white/50">Misses</div>
              </div>
            </div>
            <div className="text-xs text-white/50 text-center">
              {health.cache.openligadb.entries} entries cached
            </div>
          </div>
        </div>
      </div>

      {/* Last Update Timestamp */}
      <div className="text-center text-xs text-white/30">
        Backend last updated: {new Date(health.lastUpdate).toLocaleString('de-DE')}
      </div>
    </div>
  );
}
