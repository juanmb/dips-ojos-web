import { useState } from "preact/hooks";
import { api } from "../api/client.js";
import { setAuth } from "../stores/auth.js";

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
      setError(err.message || "Login failed");
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
          <h2 class="card-title justify-center text-2xl mb-4">Dips OjOs</h2>
          <form onSubmit={handleSubmit}>
            {error && (
              <div class="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Username</span>
              </label>
              <input
                type="text"
                placeholder="Enter username"
                class="input input-bordered"
                value={username}
                onInput={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div class="form-control mb-6">
              <label class="label">
                <span class="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter password"
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
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
