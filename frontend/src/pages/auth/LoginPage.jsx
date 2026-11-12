import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const { loading, error, run } = useAsync();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname ?? '/';

  const [form, setForm] = useState({ email: '', password: '' });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await run(() => login(form.email, form.password));
    navigate(from, { replace: true });
  }

  return (
    <div className="flex-1 flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Dumbbell className="text-brand-accent" size={28} />
          <span className="text-2xl font-bold text-text-primary tracking-tight">
            Sport<span className="text-brand-accent">Market</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary mb-1">Welcome back</h1>
          <p className="text-sm text-text-muted mb-6">Log in to your account to continue.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Log in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-accent hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
