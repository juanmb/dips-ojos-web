import { t } from '../../i18n/index.js'

const CURVES_URL = 'https://drive.google.com/file/d/14PJKFxJel66_ah0CK0dhh3VupjQvK4q9/view'

export function DownloadsView() {
  return (
    <div class="prose prose-invert max-w-none">
      <h2>{t('downloads.curvesTitle')}</h2>
      <p>{t('downloads.curvesDescription')}</p>

      <a
        href={CURVES_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-primary not-prose"
      >
        {t('downloads.curvesButton')}
      </a>
    </div>
  )
}
