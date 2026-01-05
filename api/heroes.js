// api/heroes.js - Vercel Serverless Function
// Save this file as: api/heroes.js

const FANTASY_API_KEY = 'f341037c-8d9a-476a-9a10-9c484e4cb01f';
const FANTASY_API_BASE = 'https://api-v2.fantasy.top';

export default async function handler(req, res) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Fetching data from Fantasy.top API...');
    
    // Fetch cards from Fantasy.top
    const response = await fetch(`${FANTASY_API_BASE}/cards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': FANTASY_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Fantasy.top API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully fetched data');

    // Process the data - group by hero
    const heroMap = new Map();
    const cards = data.cards || data.data || [];

    cards.forEach(card => {
      const heroId = card.playerId || card.hero_id || card.id;
      const heroName = card.playerName || card.hero_name || card.name;
      
      if (!heroId || !heroName) return;
      
      if (!heroMap.has(heroId)) {
        heroMap.set(heroId, {
          id: heroId,
          name: heroName,
          handle: card.playerHandle || card.handle || card.twitter,
          stars: card.stars || card.rating,
          rank: card.rank || card.position,
          followers: card.followers || card.followerCount,
          score7d: card.score7d || card.weeklyScore || card.score,
          prices: {}
        });
      }
      
      const hero = heroMap.get(heroId);
      const rarity = (card.rarity || card.tier || '').toLowerCase();
      const price = parseFloat(card.price || card.floorPrice || 0);
      
      if (rarity && price > 0) {
        hero.prices[rarity] = price;
      }
    });

    // Convert to array and filter
    const heroes = Array.from(heroMap.values())
      .filter(hero => hero.prices.common && hero.prices.common > 0)
      .map(hero => ({
        ...hero,
        commonPrice: hero.prices.common
      }));

    // Return the processed data
    res.status(200).json({
      success: true,
      count: heroes.length,
      heroes: heroes
    });

  } catch (error) {
    console.error('Error fetching from Fantasy.top:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch data from Fantasy.top API'
    });
  }
}