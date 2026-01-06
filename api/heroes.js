// api/heroes.js - Debug version to see SDK response
import { Client, Configuration } from '@fantasy-top/sdk-pro';

const config = new Configuration({
  basePath: 'https://api-v2.fantasy.top',
  apiKey: 'f341037c-8d9a-476a-9a10-9c484e4cb01f'
});

const api = Client.getInstance(config);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching from Fantasy.top API using SDK...');
    
    // Call the SDK
    const result = await api.card.findAllCards({ page: 1, limit: 200 });
    
    console.log('Raw result type:', typeof result);
    console.log('Result keys:', result ? Object.keys(result) : 'null');
    
    // Return the raw response structure for debugging
    return res.status(200).json({
      success: true,
      debug: true,
      message: 'Showing raw SDK response',
      resultType: typeof result,
      resultKeys: result ? Object.keys(result) : null,
      isArray: Array.isArray(result),
      // Try to safely show sample of the data
      sampleResult: result ? {
        hasData: 'data' in result,
        hasResults: 'results' in result,
        hasCards: 'cards' in result,
        dataType: result.data ? typeof result.data : 'no data property',
        dataIsArray: result.data ? Array.isArray(result.data) : false,
        dataLength: result.data?.length || 0
      } : null
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name
    });
  }
}
