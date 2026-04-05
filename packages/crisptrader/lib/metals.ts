const BASE_URL = "https://api.metals.dev/v1";

export type MetalCode = "gold" | "silver" | "platinum" | "palladium";

export type CurrencyCode = "XAU" | "XAG" | "XPT" | "XPD" | "USD" | "EUR" | "GBP";

export interface MetalsResponse {
  metals: Record<MetalCode, number>;
  currencies: Record<CurrencyCode, number>;
  timestamp: number;
  unit: string;
  currency: string;
}

export interface SingleMetalResponse {
  metal: MetalCode;
  spot_price: number;
  currency: CurrencyCode;
  timestamp: number;
  unit: string;
}

export class MetalsDevError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "MetalsDevError";
  }
}

function getApiKey(): string {
  const apiKey = process.env.METALS_DEV_API_KEY;
  if (!apiKey) {
    throw new MetalsDevError(
      "METALS_DEV_API_KEY environment variable is not set. " +
      "Add it to your .env.local file. Get your key at https://metals.dev"
    );
  }
  return apiKey;
}

async function request<T>(url: string): Promise<T> {
  const apiKey = getApiKey();
  const fullUrl = `${url}?api_key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new MetalsDevError(
      `Metals.dev API error: ${response.status} ${response.statusText}. ${text}`,
      response.status
    );
  }

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new MetalsDevError(
      data.error?.message || `API returned error: ${response.status}`,
      response.status
    );
  }

  return data as T;
}

export async function fetchAllSpotPrices(
  currency: string = "USD"
): Promise<MetalsResponse> {
  const url = `${BASE_URL}/latest?currency=${encodeURIComponent(currency)}`;
  return request<MetalsResponse>(url);
}

export async function fetchSpotPrice(
  metal: MetalCode,
  currency: string = "USD"
): Promise<SingleMetalResponse> {
  const url = `${BASE_URL}/metal/spot?metal=${encodeURIComponent(metal)}&currency=${encodeURIComponent(currency)}`;
  return request<SingleMetalResponse>(url);
}

export async function fetchMultipleMetals(
  metals: MetalCode[],
  currency: string = "USD"
): Promise<MetalsResponse> {
  const metalsParam = metals.join(",");
  const url = `${BASE_URL}/latest?metals=${encodeURIComponent(metalsParam)}&currency=${encodeURIComponent(currency)}`;
  return request<MetalsResponse>(url);
}
