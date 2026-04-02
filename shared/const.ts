export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
export const CRYPTO_CONFIG = {
  BTC: {
    name: "Bitcoin",
    symbol: "BTC",
    networks: ["Bitcoin"],
  },
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    networks: ["Ethereum (ERC20)"],
  },
  USDT: {
    name: "Tether",
    symbol: "USDT",
    networks: ["Tron (TRC20)", "Ethereum (ERC20)", "BNB Smart Chain (BEP20)", "Polygon", "Solana", "Arbitrum One", "Base"],
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    networks: ["Ethereum (ERC20)", "Solana", "BNB Smart Chain (BEP20)", "Polygon", "Base", "Arbitrum One"],
  },
  BNB: {
    name: "BNB",
    symbol: "BNB",
    networks: ["BNB Smart Chain (BEP20)"],
  },
  SOL: {
    name: "Solana",
    symbol: "SOL",
    networks: ["Solana"],
  },
} as const;

export type CryptoCoin = keyof typeof CRYPTO_CONFIG;
