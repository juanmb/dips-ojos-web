import { t } from '../i18n/index.js'

export function TransitParameters({ curve, transit }) {
  if (!transit) return null

  return (
    <div class="card bg-base-200 mx-2 mt-2">
      <div class="card-body p-2">
        <h3 class="card-title text-sm mb-1">{t('transit.parameters')}</h3>

        {/* Rp/R* */}
        <div class="mb-1">
          <div class="text-xs opacity-70">{t('transit.radius')}</div>
          <div class="grid grid-cols-2 gap-1 text-xs">
            <div>
              <span class="opacity-60">{t('transit.theo')}</span>
              <span class="font-mono ml-1">{curve?.planet_radius?.toFixed(6) || '-'}</span>
            </div>
            <div>
              <span class="opacity-60">{t('transit.fitted')}</span>
              <span class="font-mono ml-1">{transit.rp_fitted?.toFixed(6) || '-'}</span>
            </div>
          </div>
        </div>

        {/* a/R* */}
        <div>
          <div class="text-xs opacity-70">{t('transit.semiAxis')}</div>
          <div class="grid grid-cols-2 gap-1 text-xs">
            <div>
              <span class="opacity-60">{t('transit.theo')}</span>
              <span class="font-mono ml-1">{curve?.semi_major_axis?.toFixed(4) || '-'}</span>
            </div>
            <div>
              <span class="opacity-60">{t('transit.fitted')}</span>
              <span class="font-mono ml-1">{transit.a_fitted?.toFixed(4) || '-'}</span>
            </div>
          </div>
        </div>

        {/* Collapsible other parameters */}
        <div class="collapse mt-2 -mx-2">
          <input type="checkbox" class="min-h-0 p-0" />
          <div class="collapse-title min-h-0 p-0 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50 transition-transform [[data-open]_&]:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div class="collapse-content px-2">
            <div class="grid grid-cols-2 gap-1 text-xs pt-1">
              <div>
                <div class="opacity-70">{t('transit.t0Expected')}</div>
                <div class="font-mono">{transit.t0_expected?.toFixed(5) || '-'}</div>
              </div>
              <div>
                <div class="opacity-70">{t('transit.t0Fitted')}</div>
                <div class="font-mono">{transit.t0_fitted?.toFixed(5) || '-'}</div>
              </div>
              <div>
                <div class="opacity-70">{t('transit.ttvMin')}</div>
                <div class={`font-mono ${Math.abs(transit.ttv_minutes || 0) > 5 ? 'text-warning' : ''}`}>
                  {transit.ttv_minutes?.toFixed(2) || '-'}
                </div>
              </div>
              <div>
                <div class="opacity-70">{t('transit.rms')}</div>
                <div class="font-mono">{transit.rms_residuals?.toFixed(6) || '-'}</div>
              </div>
              <div>
                <div class="opacity-70">{t('transit.period')}</div>
                <div class="font-mono">{transit.period?.toFixed(6) || '-'}</div>
              </div>
              <div>
                <div class="opacity-70">{t('transit.inc')}</div>
                <div class="font-mono">{transit.inc?.toFixed(2) || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
