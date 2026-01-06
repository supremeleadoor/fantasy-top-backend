// api/index.js - Root endpoint
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.status(200).json({
    success: true,
    message: "Fantasy.top Backend API",
    version: "1.0.0",
    endpoints: {
      heroes: "/api/heroes"
    },
    status: "running"
  });
}
