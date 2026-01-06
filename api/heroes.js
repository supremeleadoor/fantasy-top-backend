// api/heroes.js - Check what's inside result.data
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
    
    const result = await api.card.findAllCards({ page: 1, limit: 200 });
    
    // Check what's inside result.data
    const dataObj = result.data;
    
    return res.status(200).json({
      success: true,
      debug: true,
      message: 'Showing result.data contents',
      dataKeys: dataObj ? Object.keys(dataObj) : null,
      dataType: typeof dataObj,
      // Show the actual structure
      dataStructure: {
        hasItems: 'items' in dataObj,
        hasCards: 'cards' in dataObj,
        hasData: 'data' in dataObj,
        hasResults: 'results' in dataObj,
        hasRows: 'rows' in dataObj,
        itemsLength: dataObj.items?.length || 0,
        cardsLength: dataObj.cards?.length || 0,
        dataLength: dataObj.data?.length || 0,
        resultsLength: dataObj.results?.length || 0
      },
      // Show first few keys of dataObj for inspection
      fullDataKeys: dataObj ? Object.keys(dataObj).slice(0, 20) : null
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
