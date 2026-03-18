'use client'

import { useTranslation } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale, locales } = useTranslation()

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as 'en' | 'fr')}
      style={{
        background: 'transparent',
        border: '1px solid var(--chakra-colors-border)',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '14px',
        cursor: 'pointer',
      }}
      aria-label="Select language"
    >
      {locales.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  )
}
