import axios from 'axios';

const CACHE_TTL = 60 * 1000; // 1 minute
let lastFetch = 0;
let cachedRates: Record<string, number> = {};

const COIN_MAP: Record<string, string> = {
  'usdt': 'tether',
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'bnb': 'binancecoin'
};

export async function fetchCryptoRates() {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL && Object.keys(cachedRates).length > 0) {
    return cachedRates;
  }

  try {
    const ids = Object.values(COIN_MAP).join(',');
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const data = response.data;
    
    const rates: Record<string, number> = {};
    for (const [key, id] of Object.entries(COIN_MAP)) {
      if (data[id]) {
        rates[key] = data[id].usd;
      }
    }
    
    cachedRates = rates;
    lastFetch = now;
    return rates;
  } catch (error) {
    console.error('[Exchange] Failed to fetch rates:', error);
    // If catch fails, return cached or empty
    return cachedRates;
  }
}

export function calculateCryptoAmount(amountUsd: number, rate: number) {
  if (!rate || rate === 0) return 0;
  return amountUsd / rate;
}
