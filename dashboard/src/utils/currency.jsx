import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/**
 * Money formatting with live exchange rates.
 *
 * Amounts are stored in TZS (Tanzanian shillings) across the system. Showing
 * them in dollars used to rely on a hardcoded 2500 rate, which drifted from the
 * real market rate. Rates are now fetched from open, key-less FX APIs and
 * cached, so displayed money tracks the actual rate.
 *
 * Frankfurter (https://frankfurter.app) is the primary source, but it only
 * covers 30 currencies and does NOT include TZS, so the shilling rate comes
 * from open.er-api.com. Both are free and need no API key.
 */

const RATE_CACHE_KEY = 'helix_fx_rates'
const DISPLAY_KEY = 'helix_display_currency'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // rates move slowly; a day-old rate is fine

export const STORED_CURRENCY = 'TZS'
export const SUPPORTED_DISPLAY = ['USD', 'TZS', 'EUR', 'GBP', 'KES', 'ZAR', 'INR']
export const DEFAULT_DISPLAY = 'USD'

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=USD'
const ER_API_URL = 'https://open.er-api.com/v6/latest/USD'
const CURRENCY_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'

/**
 * The backend prices payments with this same rate, so asking it first keeps the
 * displayed shilling amount identical to the amount actually charged.
 */
const SERVER_RATE_URL = '/api/exchange-rate'

function readCache() {
  try {
    const raw = window.localStorage.getItem(RATE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.rates || typeof parsed.rates !== 'object') return null
    if (Date.now() - (parsed.fetchedAt ?? 0) > CACHE_TTL_MS) return parsed // stale but usable
    return parsed
  } catch {
    return null
  }
}

function writeCache(rates, date = null) {
  try {
    const previous = readCache()
    window.localStorage.setItem(
      RATE_CACHE_KEY,
      JSON.stringify({ rates, date: date ?? previous?.date ?? null, fetchedAt: Date.now() })
    )
  } catch {
    // ignore storage failures (private mode)
  }
}

/**
 * Merges the open sources. Frankfurter covers the major currencies; TZS is not
 * in Frankfurter, so the shilling rate comes from @fawazahmed0/currency-api
 * (open source, no key) with open.er-api.com as backup.
 */
async function fetchRates() {
  const [frankfurter, currencyApi, erApi] = await Promise.allSettled([
    fetch(FRANKFURTER_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error('frankfurter ' + r.status)))),
    fetch(CURRENCY_API_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error('currency-api ' + r.status)))),
    fetch(ER_API_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error('er-api ' + r.status)))),
  ])

  const rates = { USD: 1 }

  if (frankfurter.status === 'fulfilled' && frankfurter.value?.rates) {
    for (const [code, value] of Object.entries(frankfurter.value.rates)) {
      const n = Number(value)
      if (Number.isFinite(n) && n > 0) rates[code] = n
    }
  }

  // Frankfurter has no TZS; take it from the open-source fallback sources.
  const fromCurrencyApi = currencyApi.status === 'fulfilled' ? Number(currencyApi.value?.usd?.tzs) : NaN
  if (Number.isFinite(fromCurrencyApi) && fromCurrencyApi > 0) {
    rates.TZS = fromCurrencyApi
  } else {
    const tzsFromEr = erApi.status === 'fulfilled' ? Number(erApi.value?.rates?.TZS) : NaN
    if (Number.isFinite(tzsFromEr) && tzsFromEr > 0) rates.TZS = tzsFromEr
  }

  if (rates.TZS == null) throw new Error('No TZS rate available from any source')
  if (Object.keys(rates).length < 2) throw new Error('No rates resolved')
  return rates
}

/**
 * Asks our own backend for the rate it will charge with. Falls back to the
 * public open-source APIs when the endpoint is unavailable (e.g. static host).
 */
export async function fetchRateFromServer() {
  try {
    const res = await fetch(SERVER_RATE_URL, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('rate endpoint ' + res.status)
    const data = await res.json()
    const rate = Number(data?.rate)
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('bad rate in response')
    return { rate, date: data.date ?? null }
  } catch {
    return null
  }
}

function getDisplayCurrency() {
  try {
    const saved = window.localStorage.getItem(DISPLAY_KEY)
    if (saved && SUPPORTED_DISPLAY.includes(saved)) return saved
  } catch {
    // ignore
  }
  return DEFAULT_DISPLAY
}

/**
 * Converts an amount from the stored currency into `currency`.
 * Returns null when no live rate is available yet, so callers can avoid
 * printing a made-up number.
 */
export function convert(amount, currency = getDisplayCurrency(), rates = readCache()?.rates) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return null
  const target = currency || STORED_CURRENCY
  if (target === STORED_CURRENCY) return value
  if (!rates) return null

  if (target === 'USD') {
    const tzs = Number(rates.TZS)
    return Number.isFinite(tzs) && tzs > 0 ? value / tzs : null
  }

  const tzs = Number(rates.TZS)
  const targetRate = Number(rates[target])
  if (!Number.isFinite(tzs) || tzs <= 0 || !Number.isFinite(targetRate)) return null
  return (value / tzs) * targetRate
}

/**
 * Formats a stored (TZS) amount in the user's display currency.
 *
 * Falls back to plain TZS formatting when the live rate has not loaded yet —
 * deliberately better than inventing a rate.
 */
export function formatMoney(amount, options = {}) {
  const { decimals = 2, currency = getDisplayCurrency(), abs = false } = options
  const value = Number(amount)
  if (!Number.isFinite(value)) return formatAs(value || 0, STORED_CURRENCY, decimals, abs)

  const converted = convert(value, currency)
  if (converted == null) return formatAs(value, STORED_CURRENCY, decimals, abs)
  return formatAs(converted, currency, decimals, abs)
}

function formatAs(value, currency, decimals, abs) {
  const v = abs ? Math.abs(value) : value
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(v)
  } catch {
    return `${currency} ${Number(v).toLocaleString('en-US')}`
  }
}

/** The live TZS-per-USD rate, or null until it loads. */
export function usdRate(rates = readCache()?.rates) {
  const n = Number(rates?.TZS)
  return Number.isFinite(n) && n > 0 ? n : null
}

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [rates, setRates] = useState(() => readCache()?.rates ?? null)
  const [rateDate, setRateDate] = useState(() => readCache()?.date ?? null)
  const [currency, setCurrencyState] = useState(getDisplayCurrency)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    // The backend decides what customers are charged, so prefer its rate and
    // only fall back to the public APIs if it is unreachable.
    const fromServer = await fetchRateFromServer()
    if (fromServer) {
      const cached = readCache()?.rates ?? { USD: 1 }
      const merged = { ...cached, USD: 1, TZS: fromServer.rate }
      writeCache(merged, fromServer.date)
      setRates(merged)
      setRateDate(fromServer.date)
      setError('')
      return
    }

    try {
      const fresh = await fetchRates()
      writeCache(fresh)
      setRates(fresh)
      setError('')
    } catch (e) {
      setError(e?.message || 'Could not load exchange rates')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setCurrency = useCallback((next) => {
    if (!SUPPORTED_DISPLAY.includes(next)) return
    setCurrencyState(next)
    try {
      window.localStorage.setItem(DISPLAY_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  return (
    <CurrencyContext.Provider value={{ rates, rateDate, currency, setCurrency, refresh, error }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return (
    useContext(CurrencyContext) || {
      rates: null,
      rateDate: null,
      currency: DEFAULT_DISPLAY,
      setCurrency: () => {},
      refresh: () => {},
      error: '',
    }
  )
}
