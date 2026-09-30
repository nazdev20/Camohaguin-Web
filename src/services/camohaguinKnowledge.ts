/**
 * Offline & Static Knowledge Engine for Barangay Camohaguin, Gumaca, Quezon
 * 
 * Used automatically when deployed to static hosts (such as GitHub Pages) where
 * a Node.js/Express server (server.ts) cannot be executed.
 */

export function getOfflineBarangayResponse(query: string, personaId: string = 'general'): string {
  const q = query.toLowerCase();

  // 1. Barangay Clearance
  if (q.includes('clearance') && !q.includes('business')) {
    return `📄 **Barangay Clearance (Camohaguin)**
• **Requirements:**
  1. Valid Government-issued ID (showing photo and address) or Student ID
  2. Community Tax Certificate (Cedula) for the current calendar year
• **Standard Fee:** ₱50.00 (Standard local fee)
• **Processing Time:** 1 working day (or same-day release if scheduled)
• **Validity:** 6 months from date of issuance
• **How to Apply:** You can file directly using the **"Services"** tab on this portal or visit the Barangay Hall frontline desk during office hours.`;
  }

  // 2. Certificate of Indigency
  if (q.includes('indigency') || q.includes('indigent') || q.includes('tulong') || q.includes('financial') || q.includes('medical assistance')) {
    return `🤝 **Certificate of Indigency (Camohaguin)**
• **Requirements:**
  1. Proof of need / Endorsement (Hospital clinical summary, school enrollment form, or MSWDO intake slip)
  2. Valid ID of applicant or parent/guardian
• **Fee:** **₱0.00 (FREE)** - Alinsunod sa batas, libre ito para sa mga maralitang mamamayan.
• **Purpose:** Medical billing assistance, financial aid, hospital discounts, scholarship application, or PAO legal assistance.
• **Processing Time:** Same day / 1 working day.`;
  }

  // 3. Certificate of Residency
  if (q.includes('residency') || q.includes('nakatira') || q.includes('resident')) {
    return `🏡 **Certificate of Residency (Camohaguin)**
• **Requirements:**
  1. Proof of residence (Utility billing receipt, lease contract, or certification from your Purok Leader)
  2. Valid ID
• **Fee:** ₱30.00
• **Processing Time:** 1 working day
• **Purpose:** School enrollment, postal ID application, employment requirements, bank transactions.`;
  }

  // 4. Business Clearance
  if (q.includes('business') || q.includes('negosyo') || q.includes('permit') || q.includes('commercial')) {
    return `💼 **Barangay Business Clearance (Camohaguin)**
• **Requirements:**
  1. DTI Business Name Registration or SEC Certificate
  2. Contract of Lease or Property Title for business location
  3. Previous year's Barangay Business Clearance (if renewal)
• **Fee:** ₱150.00
• **Processing Time:** 2 working days
• **Purpose:** Prerequisite for securing Municipal Mayor's Business Permit in Gumaca, Quezon.`;
  }

  // 5. First-Time Jobseeker
  if (q.includes('first time') || q.includes('jobseeker') || q.includes('unang trabaho') || q.includes('11261')) {
    return `🎓 **First-Time Jobseeker Assistance (Republic Act 11261)**
• **Requirements:**
  1. Duly executed Oath of Undertaking (available at barangay desk)
  2. School Diploma, Transcript of Records, or Form 137
  3. Resident verification showing 6+ months residency in Camohaguin
• **Fee:** **₱0.00 (COMPLETELY FREE)**
• **Benefits:** Free Barangay Clearance, Police Clearance endorsement, Medical Certificate endorsement, and government pre-employment documents.`;
  }

  // 6. Katarungang Pambarangay / Lupon / Blotter
  if (q.includes('lupon') || q.includes('blotter') || q.includes('reklamo') || q.includes('complaint') || q.includes('dispute') || q.includes('katarungan') || personaId === 'legal') {
    return `⚖️ **Katarungang Pambarangay (Barangay Justice System)**
Under RA 7160 (Local Government Code), disputes between residents within the same municipality undergo barangay conciliation before court filing:
• **Step 1 - Mediation by Punong Barangay:** Hearing scheduled within 15 days upon receipt of written complaint.
• **Step 2 - Conciliation by Pangkat Tagapagkasundo:** If mediation fails, 3 Lupon members are constituted to conciliate for another 15 days.
• **Step 3 - Amicable Settlement or CFA:** If resolved, an amicable settlement has the force of final court judgment. If unresolved, a *Certificate to File Action (CFA)* is issued.
• **Filing Fee:** ₱0.00 (Barangay conciliation has no filing fee).
• **To report an incident:** You may submit through the **"Blotter & Complaints"** section in this portal.`;
  }

  // 7. Office Hours & Location
  if (q.includes('hours') || q.includes('oras') || q.includes('bukas') || q.includes('schedule') || q.includes('location') || q.includes('saan')) {
    return `⏰ **Office Hours & Location:**
• **Operating Hours:** Monday to Friday: 8:00 AM – 5:00 PM (No Noon Break for Frontline Services)
• **Location:** Barangay Hall, Barangay Camohaguin, Municipality of Gumaca, Province of Quezon
• **Schedules:** Online submissions via this portal are accepted 24/7; processing occurs during official working hours.`;
  }

  // 8. Emergency Numbers & Hotlines
  if (q.includes('emergency') || q.includes('hotline') || q.includes('pulis') || q.includes('tanod') || q.includes('bumbero') || q.includes('fire') || q.includes('police') || q.includes('hospital')) {
    return `🚨 **Barangay Camohaguin & Gumaca Emergency Contacts:**
• **Barangay Tanod Command Post:** 0917-889-1122
• **Gumaca Municipal Police Station (PNP):** (042) 317-6222 / 0998-598-5804
• **Bureau of Fire Protection (BFP Gumaca):** (042) 317-6111 / 0933-855-3221
• **Rural Health Unit (RHU) / Clinic:** (042) 317-5444
• **Gumaca District Hospital:** (042) 317-6555
• **MDRRMO Rescue Hotline:** (042) 317-6888`;
  }

  // 9. Purok info
  if (q.includes('purok')) {
    return `📍 **Purok Coverage in Barangay Camohaguin:**
Barangay Camohaguin is organized into **7 Puroks**:
• **Purok 1 & Purok 2:** Poblacion border & central residential zone
• **Purok 3 & Purok 4:** Agricultural & riverside community
• **Purok 5:** Coastal / fisheries area
• **Purok 6 & Purok 7:** Highland & interior agrarian communities
Each Purok has an assigned Kagawad and designated Purok Leader to verify residency and assist in dispute conciliation.`;
  }

  // 10. General / Fallback
  return `Kumusta! Bilang digital assistant ng **Barangay Camohaguin, Gumaca, Quezon**, narito ang mga pangunahing serbisyong maipaglilingkod ko sa iyo:

1. **Mga Dokumento at Clearance:**
   • Barangay Clearance (₱50)
   • Certificate of Indigency (Libre / ₱0)
   • Certificate of Residency (₱30)
   • Barangay Business Clearance (₱150)
   • First-Time Jobseeker Assistance (Libre sa ilalim ng RA 11261)
2. **Katarungang Pambarangay:** Conciliation at Lupon mediation guidelines.
3. **Tracking:** Pagsusubaybay sa status ng iyong naipasang aplikasyon gamit ang Tracking Number.
4. **Emergency:** Hotlines ng Tanod, Gumaca PNP, BFP, at Health Unit.

*Maaari kang magtanong halimbawa: "Ano ang requirements sa clearance?", "Magkano ang residency?", o "Ano ang hotline ng Tanod?"*`;
}
