// ============================================================
// REGISTER PAGE
// ============================================================
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, extractErrorMessage } from '../api';
import { useToastStore } from '../store';
import './Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (username.trim().length < 2) e.username = 'Nome de usuário deve ter ao menos 2 caracteres';
    if (!email.includes('@')) e.email = 'Email inválido';
    if (password.length < 6) e.password = 'Senha deve ter ao menos 6 caracteres';
    if (password !== confirm) e.confirm = 'As senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.register(username, email, password);
      addToast('Conta criada! Faça login para continuar.', 'success');
      navigate('/login');
    } catch (err) {
      const msg = await extractErrorMessage(err);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card card card-glass fade-up">
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1 className="auth-title">Criar Conta</h1>
          <p className="auth-subtitle">Acesse seus documentos de qualquer lugar</p>
        </div>

        <form id="form-register" className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="input-wrap">
            <label className="input-label" htmlFor="reg-name">Usuário</label>
            <input
              id="reg-name"
              className={`input ${errors.username ? 'error' : ''}`}
              type="text"
              autoComplete="name"
              placeholder="Seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && <span className="auth-field-err">{errors.username}</span>}
          </div>

          <div className="input-wrap">
            <label className="input-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
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
            <label className="input-label" htmlFor="reg-password">Senha</label>
            <input
              id="reg-password"
              className={`input ${errors.password ? 'error' : ''}`}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span className="auth-field-err">{errors.password}</span>}
          </div>

          <div className="input-wrap">
            <label className="input-label" htmlFor="reg-confirm">Confirmar Senha</label>
            <input
              id="reg-confirm"
              className={`input ${errors.confirm ? 'error' : ''}`}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {errors.confirm && <span className="auth-field-err">{errors.confirm}</span>}
          </div>

          <button
            id="btn-register"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? <><div className="spinner" /> Criando…</> : 'Criar Conta'}
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta?{' '}
          <Link to="/login" className="auth-link">Faça login</Link>
        </p>
      </div>
    </div>
  );
}
