import aboutEs from './about.es.md?raw'
import aboutEn from './about.en.md?raw'
import tutorialEs from './tutorial.es.md?raw'
import tutorialEn from './tutorial.en.md?raw'
import examplesEs from './examples.es.md?raw'
import examplesEn from './examples.en.md?raw'

export const docs = {
  about: { es: aboutEs, en: aboutEn, titleKey: 'docs.aboutTitle' },
  tutorial: { es: tutorialEs, en: tutorialEn, titleKey: 'docs.tutorialTitle' },
  examples: { es: examplesEs, en: examplesEn, titleKey: 'docs.examplesTitle' },
}
