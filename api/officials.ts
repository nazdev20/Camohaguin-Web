export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const officials = [
    { name: 'Hon. Nelson T. De Chavez', position: 'Punong Barangay', term: '2023-Present' },
    { name: 'Hon. Maria L. Santos', position: 'Barangay Kagawad - Peace & Order', term: '2023-Present' },
    { name: 'Hon. Roberto C. Tan', position: 'Barangay Kagawad - Health & Sanitation', term: '2023-Present' },
    { name: 'Hon. Elena S. Ramos', position: 'Barangay Secretary', term: '2023-Present' },
    { name: 'Hon. Juan P. Mercado', position: 'Barangay Treasurer', term: '2023-Present' },
  ];

  res.status(200).json({
    data: officials,
    source: 'vercel_serverless',
  });
}
