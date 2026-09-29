/**
 * TanStack Query Client Configuration
 * 
 * Rules:
 * - Public/shared relatively stable data: staleTime 5-10 minutes
 * - Resident personal requests: staleTime 30 seconds
 * - Specific request tracking: staleTime 0 (always fresh)
 * - Disable aggressive refetchOnWindowFocus for stable public queries
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 15 * 60 * 1000,    // 15 minutes garbage collection (replaces cacheTime in v5)
      refetchOnWindowFocus: false, // Don't trigger refetches while user is typing in forms
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

/**
 * Standard Query Key Definitions
 */
export const queryKeys = {
  services: {
    all: ['services'] as const,
    public: () => [...queryKeys.services.all, 'public'] as const,
    detail: (id: string) => [...queryKeys.services.all, 'detail', id] as const,
    admin: () => [...queryKeys.services.all, 'admin'] as const,
  },
  announcements: {
    all: ['announcements'] as const,
    public: (limit?: number) => [...queryKeys.announcements.all, 'public', { limit }] as const,
    admin: () => [...queryKeys.announcements.all, 'admin'] as const,
  },
  events: {
    all: ['events'] as const,
    public: (limit?: number) => [...queryKeys.events.all, 'public', { limit }] as const,
  },
  officials: {
    all: ['officials'] as const,
    public: () => [...queryKeys.officials.all, 'public'] as const,
  },
  siteSettings: {
    all: ['site-settings'] as const,
    public: () => [...queryKeys.siteSettings.all, 'public'] as const,
  },
  resident: {
    all: ['resident'] as const,
    myRequests: (trackingNumbers: string[]) => [...queryKeys.resident.all, 'my-requests', trackingNumbers] as const,
  },
  requests: {
    all: ['requests'] as const,
    track: (trackingNumber: string) => [...queryKeys.requests.all, 'track', trackingNumber] as const,
    admin: () => [...queryKeys.requests.all, 'admin'] as const,
  },
};
