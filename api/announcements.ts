import { INITIAL_ANNOUNCEMENTS } from '../src/services/mockData';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const limitParam = req.query?.limit;
  const limit = limitParam ? parseInt(limitParam as string, 10) : 10;

  res.status(200).json({
    data: INITIAL_ANNOUNCEMENTS.slice(0, isNaN(limit) ? 10 : limit),
    source: 'vercel_serverless',
  });
}
