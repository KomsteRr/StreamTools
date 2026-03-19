'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'

type Locale = 'en' | 'fr'

const translations = { en, fr } as const

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  locales: { value: Locale; label: string; flag: string }[]
}

const I18nContext = createContext<I18nContextType | null>(null)

const STORAGE_KEY = 'streamtools-locale'
const DEFAULT_LOCALE: Locale = 'en'

const LOCALE_OPTIONS = [
  { value: 'en' as Locale, label: 'English', flag: '🇬🇧' },
  { value: 'fr' as Locale, label: 'Français', flag: '🇫🇷' },
]

function getNestedValue(obj: Record<string, any>, path: string): string {
  const value = path.split('.').reduce((acc: any, part: string) => acc?.[part], obj)
  if (typeof value === 'string') return value
  return path
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && saved in translations) {
      setLocaleState(saved)
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
    return getNestedValue(translations[locale] as unknown as Record<string, any>, key)
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
