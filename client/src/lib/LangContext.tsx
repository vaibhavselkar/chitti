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

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const t = (key: keyof typeof translations['en']): string => translations[lang][key] || key as string
  const toggleLang = () => setLang(l => l === 'en' ? 'te' : 'en')
  return <LangContext.Provider value={{ lang, t, toggleLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
