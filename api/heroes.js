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
    
    // Try different possible endpoints
    const endpoints = [
      '/v1/cards',
      '/cards/all',
      '/card',
      '/heroes',
      '/players'
    ];
    
    let data = null;
    let successfulEndpoint = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(`${FANTASY_API_BASE}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': FANTASY_API_KEY
          }
        });

        if (response.ok) {
          data = await response.json();
          successfulEndpoint = endpoint;
          console.log(`Success with endpoint: ${endpoint}`);
          break;
        } else {
          console.log(`${endpoint} returned ${response.status}`);
        }
      } catch (err) {
        console.log(`${endpoint} failed:`, err.message);
        continue;
      }
    }

    if (!data) {
      throw new Error('All API endpoints returned 404. The API structure may have changed or the API key is invalid.');
    }

    console.log('Successfully fetched data from:', successfulEndpoint);

    // Process the data - group by hero
    const heroMap = new Map();
    const cards = data.cards || data.data || data.results || data || [];

    if (!Array.isArray(cards)) {
      throw new Error('API response is not in expected format');
    }

    cards.forEach(card => {
      const heroId = card.playerId || card.hero_id || card.player_id || card.id;
      const heroName = card.playerName || card.hero_name || card.player_name || card.name;
      
      if (!heroId || !heroName) return;
      
      if (!heroMap.has(heroId)) {
        heroMap.set(heroId, {
          id: heroId,
          name: heroName,
          handle: card.playerHandle || card.handle || card.twitter || card.twitterHandle,
          stars: card.stars || card.rating || card.star_rating,
          rank: card.rank || card.position || card.leaderboard_position,
          followers: card.followers || card.followerCount || card.follower_count,
          score7d: card.score7d || card.weeklyScore || card.weekly_score || card.score,
          prices: {}
        });
      }
      
      const hero = heroMap.get(heroId);
      const rarity = (card.rarity || card.tier || card.card_type || '').toLowerCase();
      const price = parseFloat(card.price || card.floorPrice || card.floor_price || card.lowestPrice || 0);
      
      if (rarity && price > 0) {
        hero.prices[rarity] = price;
      }
    });

    // Convert to array and filter
    const heroes = Array.from(heroMap.values())
      .filter(hero => Object.keys(hero.prices).length > 0)
      .map(hero => ({
        ...hero,
        commonPrice: hero.prices.common || hero.prices.Common || Math.min(...Object.values(hero.prices))
      }));

    // Return the processed data
    res.status(200).json({
      success: true,
      count: heroes.length,
      endpoint: successfulEndpoint,
      heroes: heroes,
      debug: {
        message: 'If heroes array is empty, the API response format may have changed',
        sample_card: cards[0] || 'No cards found'
      }
    });

  } catch (error) {
    console.error('Error fetching from Fantasy.top:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch data from Fantasy.top API. Check Vercel logs for details.'
    });
  }
}
