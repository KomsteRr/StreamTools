'use client'

import { useTranslation } from '@/lib/i18n'
import { NativeSelect } from '@chakra-ui/react'

export function LanguageSwitcher() {
  const { locale, setLocale, locales, t } = useTranslation()

  return (
    <NativeSelect.Root
      size="sm"
      width="auto"
      variant="outline"
    >
      <NativeSelect.Field
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'en' | 'fr')}
        aria-label={t('language.label')}
        style={{ paddingInlineEnd: '1.5rem' }}
      >
        {locales.map((l) => (
          <option key={l.value} value={l.value}>
            {l.flag}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )
}
