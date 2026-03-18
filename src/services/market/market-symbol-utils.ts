const SEARCH_ALIAS_SUFFIX_PATTERN = /(?:\.PR|\.P|\.X|\.LV|\.PERP|PERP)$/i;
const STABLE_QUOTE_SUFFIX_PATTERN = /(USDT|USDC|BUSD)$/i;

export function normalizeMarketSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function getMarketSymbolAliasBase(symbol: string): string {
  let normalized = normalizeMarketSymbol(symbol).split(":").pop() ?? "";
  if (!normalized) return "";

  let previous = "";
  while (normalized && normalized !== previous) {
    previous = normalized;
    normalized = normalized.replace(SEARCH_ALIAS_SUFFIX_PATTERN, "");
  }

  return normalized.replace(STABLE_QUOTE_SUFFIX_PATTERN, "USD");
}

export function getMarketSearchDedupeKey(item: { symbol?: string | null }): string {
  return getMarketSymbolAliasBase(String(item.symbol ?? ""));
}
