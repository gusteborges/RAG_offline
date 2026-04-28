// ============================================================
// LOGIN PAGE
// ============================================================
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, extractErrorMessage } from '../api';
import { useAuthStore, useToastStore } from '../store';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setToken } = useAuthStore();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.includes('@')) e.email = 'Email inválido';
    if (password.length < 6) e.password = 'Senha deve ter ao menos 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setToken(data.access_token);
      addToast('Bem-vindo de volta!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = await extractErrorMessage(err);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card card card-glass fade-up">
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1 className="auth-title">SmartDocs</h1>
          <p className="auth-subtitle">Faça login para continuar</p>
        </div>

        <form id="form-login" className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="input-wrap">
            <label className="input-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className={`input ${errors.email ? 'error' : ''}`}
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="auth-field-err">{errors.email}</span>}
          </div>

          <div className="input-wrap">
            <label className="input-label" htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              className={`input ${errors.password ? 'error' : ''}`}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span className="auth-field-err">{errors.password}</span>}
          </div>

          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? <><div className="spinner" /> Entrando…</> : 'Entrar'}
          </button>
        </form>

        <p className="auth-footer">
          Não tem conta?{' '}
          <Link to="/register" className="auth-link">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
