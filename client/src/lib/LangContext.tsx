import { createContext, useContext, useState, ReactNode } from 'react'
import { Lang, translations } from './translations'

interface LangContextType {
  lang: Lang
  t: (key: keyof typeof translations['en']) => string
  toggleLang: () => void
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  t: (key) => key as string,
  toggleLang: () => {}
})

function getInitialLang(): Lang {
  const saved = localStorage.getItem('chitti_lang')
  if (saved === 'te' || saved === 'en') return saved
  if (navigator.language?.startsWith('te')) return 'te'
  return 'en'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang)
  const t = (key: keyof typeof translations['en']): string => translations[lang][key] || key as string
  const toggleLang = () => setLang(l => {
    const next = l === 'en' ? 'te' : 'en'
    localStorage.setItem('chitti_lang', next)
    return next
  })
  return <LangContext.Provider value={{ lang, t, toggleLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
