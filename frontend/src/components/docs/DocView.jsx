import { language } from '../../i18n/index.js'
import { docs } from '../../docs/registry.js'
import { MarkdownContent } from './MarkdownContent.jsx'

export function DocView({ slug, class: className = '' }) {
  const entry = docs[slug]

  if (!entry) {
    return <div class="alert alert-error">Unknown doc: {slug}</div>
  }

  const source = entry[language.value] || entry.en

  return <MarkdownContent source={source} class={className} />
}
