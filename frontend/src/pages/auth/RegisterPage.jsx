import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const { loading, error, run } = useAsync();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldError, setFieldError] = useState('');

  function handleChange(e) {
    setFieldError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setFieldError('Passwords do not match.');
      return;
    }

    const names = form.name.trim().split(/\s+/);
    const firstName = names[0] || 'User';
    const lastName = names.slice(1).join(' ') || firstName;

    await run(() =>
      register({
        email: form.email.trim(),
        password: form.password,
        firstName,
        lastName,
      }),
    );
    navigate('/', { replace: true });
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
          <h1 className="text-xl font-bold text-text-primary mb-1">Create an account</h1>
          {(error || fieldError) && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {fieldError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="name"
              name="name"
              type="text"
              label="Full name"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
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
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-accent hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
