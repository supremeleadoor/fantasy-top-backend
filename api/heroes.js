// api/heroes.js - Direct API calls without SDK

const FANTASY_API_KEY = 'f341037c-8d9a-476a-9a10-9c484e4cb01f';
const API_BASE = 'https://api-v2.fantasy.top';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Fetching from Fantasy.top API...');
    
    // Try multiple possible endpoints with different methods
    const endpoints = [
      { url: `${API_BASE}/card/findAllCards?page=1&limit=200`, method: 'GET' },
      { url: `${API_BASE}/cards?page=1&limit=200`, method: 'GET' },
      { url: `${API_BASE}/api/card/findAllCards`, method: 'GET' },
      { url: `${API_BASE}/api/cards/all`, method: 'GET' },
    ];
    
    let data = null;
    let successEndpoint = null;
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying: ${endpoint.method} ${endpoint.url}`);
        
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': FANTASY_API_KEY,
            'Authorization': `Bearer ${FANTASY_API_KEY}`
          }
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
          data = await response.json();
          successEndpoint = endpoint.url;
          console.log('Success!');
          break;
        } else {
          const errorText = await response.text();
          console.log(`Failed: ${response.status} - ${errorText}`);
          lastError = `${response.status}: ${errorText}`;
        }
      } catch (err) {
        console.log(`Error: ${err.message}`);
        lastError = err.message;
        continue;
      }
    }
    
    if (!data) {
      throw new Error(`All endpoints failed. Last error: ${lastError}. The API might require different authentication or the SDK must be used.`);
    }
    
    console.log('Processing data...');
    
    // Process the response
    const heroMap = new Map();
    const cards = data.data || data.cards || data.results || data || [];
    
    if (!Array.isArray(cards)) {
      return res.status(200).json({
        success: true,
        debug: true,
        message: 'Got response but not in expected array format',
        endpoint: successEndpoint,
        rawData: data
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
      endpoint: successEndpoint,
      heroes: heroes
    });
    
  } catch (error) {
    console.error('Final error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch data from Fantasy.top API',
      suggestion: 'The API might require the SDK to be run client-side, or needs different authentication'
    });
  }
}
