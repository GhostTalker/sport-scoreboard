/**
 * Health Check API Service
 *
 * Fetches system health status from backend /api/health endpoint
 */

import { API_ENDPOINTS } from '../constants/api';

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  circuitBreaker?: CircuitBreakerState;
  activeRequests?: number;
}

export interface CacheMetrics {
  size: string;
  sizeBytes: number;
  entries: number;
  hitRate: number;
  hits: number;
  misses: number;
  maxSize: string;
}

export interface MemoryInfo {
  used: string;
  total: string;
  rss: string;
  usedBytes: number;
  totalBytes: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  uptimeFormatted: string;
  memory: MemoryInfo;
  services: {
    espn: ServiceHealth;
    openligadb: ServiceHealth;
  };
  cache: {
    espn: CacheMetrics;
    openligadb: CacheMetrics;
  };
  lastUpdate: string;
}

/**
 * Fetch health check data from backend
 */
export async function fetchHealthCheck(): Promise<HealthCheckResponse> {
  try {
    const response = await fetch(`${API_ENDPOINTS.health}`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching health check:', error);
    throw error;
  }
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: 'healthy' | 'unhealthy' | 'degraded'): string {
  switch (status) {
    case 'healthy':
      return 'text-green-500';
    case 'degraded':
      return 'text-yellow-500';
    case 'unhealthy':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get status icon for UI display
 */
export function getStatusIcon(status: 'healthy' | 'unhealthy' | 'degraded'): string {
  switch (status) {
    case 'healthy':
      return '✅';
    case 'degraded':
      return '⚠️';
    case 'unhealthy':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Get circuit breaker color for UI display
 */
export function getCircuitBreakerColor(state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): string {
  switch (state) {
    case 'CLOSED':
      return 'text-green-500';
    case 'HALF_OPEN':
      return 'text-yellow-500';
    case 'OPEN':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Format cache hit rate as percentage
 */
export function formatHitRate(hitRate: number): string {
  return `${(hitRate * 100).toFixed(1)}%`;
}
