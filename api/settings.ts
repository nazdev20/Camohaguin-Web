export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const settings = {
    barangay_name: 'Barangay Camohaguin',
    municipality: 'Gumaca',
    province: 'Quezon',
    emergency_phone: '(042) 317-8890',
    office_hours: 'Monday to Friday: 8:00 AM - 5:00 PM',
    tanod_hotline: '0917-889-1122',
    police_hotline: '(042) 317-6222',
    bfp_hotline: '(042) 317-6111',
    rhu_hotline: '(042) 317-5444',
  };

  res.status(200).json({
    data: settings,
    source: 'vercel_serverless',
  });
}
