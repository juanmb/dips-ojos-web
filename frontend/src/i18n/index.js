import { signal, computed } from '@preact/signals'
import en from './en.json'
import es from './es.json'

const translations = { en, es }
const supportedLanguages = ['en', 'es']

function getInitialLanguage() {
  const stored = localStorage.getItem('language')
  if (stored && supportedLanguages.includes(stored)) {
    return stored
  }
  const browserLang = navigator.language?.split('-')[0]
  if (supportedLanguages.includes(browserLang)) {
    return browserLang
  }
  return 'en'
}

export const language = signal(getInitialLanguage())

export const currentTranslations = computed(() => translations[language.value] || translations.en)

export function setLanguage(lang) {
  if (supportedLanguages.includes(lang)) {
    language.value = lang
    localStorage.setItem('language', lang)
  }
}

export function t(key, fields = {}) {
  const keys = key.split('.')
  let value = currentTranslations.value

  for (const k of keys) {
    value = value?.[k]
  }

  if (typeof value !== 'string') {
    console.warn(`Translation missing: ${key}`)
    return key
  }

  return value.replace(/\{\{(\w+)\}\}/g, (_, field) => fields[field] ?? `{{${field}}}`)
}
