'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'

export type Locale = 'en' | 'fr'

const translations: Record<Locale, Record<string, unknown>> = { en, fr }

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  locales: { value: Locale; label: string; flag: string; code: string }[]
}

const I18nContext = createContext<I18nContextType | null>(null)

const STORAGE_KEY = 'streamtools-locale'
const DEFAULT_LOCALE: Locale = 'fr'

export const LOCALE_OPTIONS: { value: Locale; label: string; flag: string; code: string }[] = [
  { value: 'fr', label: 'Français', flag: '🇫🇷', code: 'FR' },
  { value: 'en', label: 'English', flag: '🇬🇧', code: 'EN' },
]

function getNestedValue(obj: Record<string, unknown>, fallbackObj: Record<string, unknown>, path: string): string {
  const parts = path.split('.')
  
  let current: unknown = obj
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      current = undefined
      break
    }
  }
  if (typeof current === 'string') return current

  // Fallback to primary locale object
  let fallbackCurrent: unknown = fallbackObj
  for (const part of parts) {
    if (fallbackCurrent && typeof fallbackCurrent === 'object') {
      fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[part]
    } else {
      fallbackCurrent = undefined
      break
    }
  }
  if (typeof fallbackCurrent === 'string') return fallbackCurrent

  return path
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && saved in translations) {
      setLocaleState(saved)
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en'
      setLocaleState(browserLang)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
    document.documentElement.lang = newLocale
  }, [])

  const t = useCallback((key: string): string => {
    const activeObj = translations[locale] || translations[DEFAULT_LOCALE]
    const fallbackObj = translations[DEFAULT_LOCALE]
    return getNestedValue(activeObj, fallbackObj, key)
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, locales: LOCALE_OPTIONS }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useTranslation must be used within I18nProvider')
  return context
}
