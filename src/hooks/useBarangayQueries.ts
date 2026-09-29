/**
 * TanStack Query Hooks for Barangay Camohaguin Service Portal
 * 
 * Stale Time Strategy:
 * - Public Services: 10 minutes (stable, public)
 * - Public Announcements: 5 minutes (shared, moderate changes)
 * - Public Officials: 10 minutes (stable)
 * - Site Settings: 10 minutes (stable)
 * - Resident My Requests: 30 seconds (frequently checked by active applicant)
 * - Request Tracking: 0 seconds (always fresh for accurate live tracking)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { BarangayDatabase } from '../services/db';
import {
  BarangayService,
  Announcement,
  ServiceRequest,
} from '../types/schema';

// Helper: safely fetch from API with fallback to local database
async function fetchWithFallback<T>(url: string, fallbackFetcher: () => T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    // Fallback gracefully to local database
    return fallbackFetcher();
  }
}

/**
 * 1. Public Services List Query
 * Cache layer: TanStack Query (10 min staleTime) + Server-side LRU (10 min TTL)
 */
export function usePublicServices() {
  return useQuery({
    queryKey: queryKeys.services.public(),
    queryFn: () => fetchWithFallback<BarangayService[]>('/api/services', () => BarangayDatabase.getServices()),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * 2. Public Announcements Query
 * Cache layer: TanStack Query (5 min staleTime) + Server-side LRU (10 min TTL)
 */
export function usePublicAnnouncements(limit = 10) {
  return useQuery({
    queryKey: queryKeys.announcements.public(limit),
    queryFn: () =>
      fetchWithFallback<Announcement[]>(`/api/announcements?limit=${limit}`, () =>
        BarangayDatabase.getAnnouncements().slice(0, limit)
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 3. Public Officials Directory Query
 * Cache layer: TanStack Query (10 min staleTime) + Server-side LRU (10 min TTL)
 */
export function usePublicOfficials() {
  return useQuery({
    queryKey: queryKeys.officials.public(),
    queryFn: () =>
      fetchWithFallback('/api/officials', () => [
        { name: 'Hon. Nelson T. De Chavez', position: 'Punong Barangay', term: '2023-Present' },
        { name: 'Hon. Maria L. Santos', position: 'Barangay Kagawad - Peace & Order', term: '2023-Present' },
        { name: 'Hon. Roberto C. Tan', position: 'Barangay Kagawad - Health & Sanitation', term: '2023-Present' },
        { name: 'Hon. Elena S. Ramos', position: 'Barangay Secretary', term: '2023-Present' },
        { name: 'Hon. Juan P. Mercado', position: 'Barangay Treasurer', term: '2023-Present' },
      ]),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * 4. Site Settings Query (Emergency hotlines, office hours, barangay details)
 * Cache layer: TanStack Query (10 min staleTime) + Server-side LRU (10 min TTL)
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.siteSettings.public(),
    queryFn: () =>
      fetchWithFallback<Record<string, string>>('/api/settings', () => ({
        barangay_name: 'Barangay Camohaguin',
        municipality: 'Gumaca',
        province: 'Quezon',
        emergency_phone: '(042) 317-8890',
        office_hours: 'Monday to Friday: 8:00 AM - 5:00 PM',
      })),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * 5. Resident's "My Requests" Query
 * Cache layer: TanStack Query (30 seconds staleTime)
 * Note: NEVER LRU-cached on server (user-specific sensitive data)
 */
export function useResidentMyRequests(trackingNumbers: string[]) {
  return useQuery({
    queryKey: queryKeys.resident.myRequests(trackingNumbers),
    queryFn: () => {
      const allRequests = BarangayDatabase.getRequests();
      return allRequests.filter(r => trackingNumbers.includes(r.tracking_number));
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true, // Auto check when user tabs back
    enabled: trackingNumbers.length > 0,
  });
}

/**
 * 6. Live Track Single Request Query
 * Cache layer: TanStack Query (staleTime 0 = always fresh)
 * Note: NEVER LRU-cached (freshness is critical for tracking accuracy)
 */
export function useTrackRequest(trackingNumber: string) {
  const cleanNumber = trackingNumber.trim().toUpperCase();
  return useQuery({
    queryKey: queryKeys.requests.track(cleanNumber),
    queryFn: () => {
      const allRequests = BarangayDatabase.getRequests();
      return allRequests.find(r => r.tracking_number.toUpperCase() === cleanNumber) || null;
    },
    staleTime: 0, // Always fresh
    enabled: cleanNumber.length >= 4,
  });
}

// ----------------------------------------------------
// Mutations with Invalidation Rules
// ----------------------------------------------------

/**
 * Mutation: Create or Update Service (Admin)
 * Invalidates: services queries on client + server LRU cache via API
 */
export function useServiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: BarangayService) => {
      // 1. Mutate in DB
      BarangayDatabase.saveService(service);

      // 2. Notify server to invalidate server-side LRU cache
      try {
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix: 'services:' }),
        });
      } catch (e) {
        // Non-blocking
      }

      return service;
    },
    onSuccess: () => {
      // 3. Invalidate TanStack Query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
}

/**
 * Mutation: Create or Update Announcement (Admin)
 * Invalidates: announcements queries on client + server LRU cache via API
 */
export function useAnnouncementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcement: Announcement) => {
      // 1. Mutate in DB
      BarangayDatabase.saveAnnouncement(announcement);

      // 2. Invalidate server-side LRU cache
      try {
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix: 'announcements:' }),
        });
      } catch (e) {
        // Non-blocking
      }

      return announcement;
    },
    onSuccess: () => {
      // 3. Invalidate TanStack Query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
  });
}

/**
 * Mutation: Submit Service Request (Citizen)
 * Invalidates: resident my-requests and requests queries
 */
export function useSubmitRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newReq: Omit<ServiceRequest, 'tracking_number' | 'created_at' | 'updated_at'>) => {
      const created = BarangayDatabase.createRequest(newReq);
      return created;
    },
    onSuccess: (data) => {
      // Invalidate relevant user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.resident.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.track(data.tracking_number) });
    },
  });
}
