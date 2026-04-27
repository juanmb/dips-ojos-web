import { useState } from "preact/hooks";
import { api } from "../api/client.js";
import { setAuth } from "../stores/auth.js";
import { t, language, setLanguage } from "../i18n/index.js";
import { AboutDialog } from "./layout/AboutDialog.jsx";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login(username, password);
      setAuth(data.token, data.user);
    } catch (err) {
      setError(err.message || t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      class="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat py-8"
      style="background-image: url('/login-bg.png');"
    >
      <div class="card w-96 bg-base-100/80 backdrop-blur-sm shadow-xl">
        <div class="card-body">
          <div class="flex justify-center mb-2">
            <a
              href="https://www.observatoriomontedeva.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/logo.jpg"
                alt="Dips OjOs"
                title="Jose Ramón Vidal (1947-2025)"
                class="w-24 h-24 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
          <h2 class="card-title justify-center text-2xl">{t('login.title')}</h2>
          <p class="text-center text-sm opacity-70 mb-4">{t('login.subtitle')}</p>

          {/* Language selector */}
          <div class="flex justify-center gap-2 mb-4">
            <button
              type="button"
              class={`btn btn-xs ${language.value === 'en' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button
              type="button"
              class={`btn btn-xs ${language.value === 'es' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setLanguage('es')}
            >
              ES
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div class="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">{t('login.username')}</span>
              </label>
              <input
                type="text"
                placeholder={t('login.usernamePlaceholder')}
                class="input input-bordered"
                value={username}
                onInput={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div class="form-control mb-6">
              <label class="label">
                <span class="label-text">{t('login.password')}</span>
              </label>
              <input
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                class="input input-bordered"
                value={password}
                onInput={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div class="form-control">
              <button
                type="submit"
                class={`btn btn-primary ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? t('login.submitting') : t('login.submit')}
              </button>
            </div>
          </form>

          <div class="text-center mt-4">
            <button
              type="button"
              class="btn btn-sm btn-outline btn-primary gap-2"
              onClick={() => setShowAbout(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('login.aboutLink')}
            </button>
          </div>
        </div>
      </div>

      <AboutDialog show={showAbout} onClose={() => setShowAbout(false)} />

      <div class="mt-8 flex items-center justify-center gap-10">
        <a href="https://www.uniovi.es/" target="_blank" rel="noopener noreferrer">
          <img src="/logo_uniovi.png" alt="Universidad de Oviedo" class="w-[160px] h-auto opacity-90 hover:opacity-100 transition-opacity" />
        </a>
        <a href="https://ictea.uniovi.es/" target="_blank" rel="noopener noreferrer">
          <img src="/logo_ictea.png" alt="ICTEA" class="w-[160px] h-auto opacity-90 hover:opacity-100 transition-opacity" />
        </a>
        <a href="https://saaomega.es/" target="_blank" rel="noopener noreferrer">
          <img src="/logo_omega.png" alt="SAA Omega" class="w-[240px] h-auto opacity-90 hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>
  );
}
