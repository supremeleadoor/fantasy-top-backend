// api/heroes.js - Check card structure
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
    const cards = result.data.data || [];
    
    // Show the structure of the first 3 cards
    return res.status(200).json({
      success: true,
      debug: true,
      message: 'Showing first 3 cards to understand structure',
      totalCards: cards.length,
      firstCard: cards[0] || null,
      secondCard: cards[1] || null,
      thirdCard: cards[2] || null,
      firstCardKeys: cards[0] ? Object.keys(cards[0]) : null
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
