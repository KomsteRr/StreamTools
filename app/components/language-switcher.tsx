'use client'

import { useTranslation, Locale } from '@/lib/i18n'
import { NativeSelect } from '@chakra-ui/react'

export function LanguageSwitcher() {
  const { locale, setLocale, locales, t } = useTranslation()

  return (
    <NativeSelect.Root
      size="sm"
      width="auto"
      variant="subtle"
    >
      <NativeSelect.Field
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t('language.label')}
        style={{
          paddingInlineStart: '0.6rem',
          paddingInlineEnd: '1.8rem',
          fontWeight: 600,
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {locales.map((l) => (
          <option key={l.value} value={l.value}>
            {l.flag} {l.code}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )
}
