// api/heroes.js - Using Fantasy.top SDK
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
    
    // Use SDK to fetch all cards
    const result = await api.card.findAllCards({ page: 1, limit: 200 });
    
    console.log('Processing data...');
    
    // Process the response
    const heroMap = new Map();
    const cards = result.data || result.results || [];
    
    if (!Array.isArray(cards)) {
      return res.status(200).json({
        success: true,
        debug: true,
        message: 'Got response but not in expected array format',
        rawData: result
      });
    }
    
    cards.forEach(card => {
      const heroId = card.playerId || card.player_id || card.id;
      const heroName = card.playerName || card.player_name || card.name;
      
      if (!heroId || !heroName) return;
      
      if (!heroMap.has(heroId)) {
        heroMap.set(heroId, {
          id: heroId,
          name: heroName,
          handle: card.playerHandle || card.twitter_handle || card.handle,
          stars: card.stars || card.rating,
          rank: card.rank || card.position,
          followers: card.followers || card.follower_count,
          score7d: card.score7d || card.weekly_score || card.score,
          prices: {}
        });
      }
      
      const hero = heroMap.get(heroId);
      const rarity = (card.rarity || card.tier || '').toLowerCase();
      const price = parseFloat(card.price || card.floor_price || 0);
      
      if (rarity && price > 0) {
        hero.prices[rarity] = price;
      }
    });
    
    const heroes = Array.from(heroMap.values())
      .filter(hero => Object.keys(hero.prices).length > 0)
      .map(hero => ({
        ...hero,
        commonPrice: hero.prices.common || Math.min(...Object.values(hero.prices))
      }));
    
    res.status(200).json({
      success: true,
      count: heroes.length,
      heroes: heroes
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch data from Fantasy.top API',
      details: 'Make sure the SDK is properly installed and configured'
    });
  }
}

