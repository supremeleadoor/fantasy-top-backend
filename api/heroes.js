// api/heroes.js - Using Fantasy.top SDK with proper response handling
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
    
    // Use SDK to fetch all cards with proper parameters
    const result = await api.card.findAllCards({ page: 1, limit: 200 });
    
    console.log('SDK call successful, processing data...');
    
    // Extract the actual data from SDK response
    // SDK returns an object with data property containing the array
    let cards = [];
    
    if (result && typeof result === 'object') {
      // Try different possible response structures
      cards = result.data?.data || result.data || result.results || result.cards || [];
      
      // If result itself is an array
      if (Array.isArray(result)) {
        cards = result;
      }
    }
    
    console.log(`Found ${Array.isArray(cards) ? cards.length : 0} cards`);
    
    if (!Array.isArray(cards)) {
      // Return debug info to help us understand the response structure
      return res.status(200).json({
        success: false,
        debug: true,
        message: 'Response not in expected format',
        responseType: typeof result,
        responseKeys: result ? Object.keys(result) : [],
        sampleData: result ? JSON.stringify(result).substring(0, 500) : null
      });
    }
    
    if (cards.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: 'No cards found',
        heroes: []
      });
    }
    
    // Process the cards into hero data
    const heroMap = new Map();
    
    cards.forEach(card => {
      try {
        const heroId = card.playerId || card.player_id || card.id;
        const heroName = card.playerName || card.player_name || card.name;
        
        if (!heroId || !heroName) return;
        
        if (!heroMap.has(heroId)) {
          heroMap.set(heroId, {
            id: heroId,
            name: heroName,
            handle: card.playerHandle || card.twitter_handle || card.handle || null,
            stars: card.stars || card.rating || null,
            rank: card.rank || card.position || null,
            followers: card.followers || card.follower_count || null,
            score7d: card.score7d || card.weekly_score || card.score || null,
            prices: {}
          });
        }
        
        const hero = heroMap.get(heroId);
        const rarity = (card.rarity || card.tier || '').toLowerCase();
        const price = parseFloat(card.price || card.floor_price || 0);
        
        if (rarity && price > 0) {
          hero.prices[rarity] = price;
        }
      } catch (err) {
        console.error('Error processing card:', err.message);
      }
    });
    
    const heroes = Array.from(heroMap.values())
      .filter(hero => Object.keys(hero.prices).length > 0)
      .map(hero => ({
        ...hero,
        commonPrice: hero.prices.common || Math.min(...Object.values(hero.prices))
      }));
    
    console.log(`Processed ${heroes.length} heroes`);
    
    res.status(200).json({
      success: true,
      count: heroes.length,
      heroes: heroes
    });
    
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 200)
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      errorType: error.name || 'Error',
      message: 'Failed to fetch data from Fantasy.top API',
      hint: 'Check if API key is valid and SDK is properly configured'
    });
  }
}
