import { useState } from "preact/hooks";
import { api } from "../api/client.js";
import { setAuth } from "../stores/auth.js";
import { t, language, setLanguage } from "../i18n/index.js";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      class="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
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
        </div>
      </div>
    </div>
  );
}
