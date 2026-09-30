import { ResidencyVerificationResult } from '../types/schema';
import { BarangayDatabase } from './db';

/**
 * Server-side / backend simulation for secure residency verification.
 * 
 * Strict Privacy Principles Enforced:
 * 1. Never exposes full list of residents.
 * 2. Requires exact matching on First Name, Last Name, and Date of Birth OR internal Resident ID.
 * 3. Does not leak sensitive household members, contact details, or other personal attributes.
 */
export async function verifyResidencySecurely(params: {
  resident_id?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
}): Promise<ResidencyVerificationResult> {
  // Small simulated network roundtrip to represent server evaluation
  await new Promise(r => setTimeout(r, 350));

  const residents = BarangayDatabase.getResidents();

  // Mode 1: Verification by Internal Resident ID (e.g. BC-RES-00101)
  if (params.resident_id && params.resident_id.trim()) {
    const queryId = params.resident_id.trim().toUpperCase();
    const match = residents.find(r => r.resident_id.toUpperCase() === queryId);

    if (!match) { 
      return {
        is_verified: false,
        message: 'No resident record found with this Resident System ID.',
      };
    }

    if (match.residency_status === 'verified') {
      return {
        is_verified: true,
        resident_id: match.resident_id,
        residency_status: match.residency_status,
        purok_zone: match.purok_zone,
        message: `Verified Resident of Barangay Camohaguin (${match.purok_zone}).`,
      };
    }

    return {
      is_verified: false,
      resident_id: match.resident_id,
      residency_status: match.residency_status,
      purok_zone: match.purok_zone,
      message: `Resident record located, but residency status is currently "${match.residency_status}". Please submit proof of residence to the Barangay Hall.`,
    };
  }

  // Mode 2: Verification by Name + Birthdate
  if (params.first_name && params.last_name && params.birth_date) {
    const qFirst = params.first_name.trim().toLowerCase();
    const qLast = params.last_name.trim().toLowerCase();
    const qDob = params.birth_date.trim();

    const match = residents.find(r => {
      const matchFirst = r.first_name.trim().toLowerCase() === qFirst;
      const matchLast = r.last_name.trim().toLowerCase() === qLast;
      const matchDob = r.birth_date === qDob;
      return matchFirst && matchLast && matchDob;
    });

    if (!match) {
      return {
        is_verified: false,
        message: 'No matching record found in the Barangay Camohaguin resident registry. You may proceed as an unverified applicant or visit the Barangay Hall to register.',
      };
    }

    if (match.residency_status === 'verified') {
      return {
        is_verified: true,
        resident_id: match.resident_id,
        residency_status: match.residency_status,
        purok_zone: match.purok_zone,
        message: `Identity confirmed. Verified Resident record associated with ${match.purok_zone}.`,
      };
    }

    return {
      is_verified: false,
      resident_id: match.resident_id,
      residency_status: match.residency_status,
      purok_zone: match.purok_zone,
      message: `Record identified, but residency status is "${match.residency_status}". Verification by Barangay Secretary or Purok Leader required.`,
    };
  }

  return {
    is_verified: false,
    message: 'Please provide either your Resident System ID or complete First Name, Last Name, and Date of Birth.',
  };
}
