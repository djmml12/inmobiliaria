import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLogin, useRecuperarPassword } from '../../hooks/useAuth';

const SLATE = '#283341';
const SLATE_DARK = '#1E2732';
const AMBER = '#C77B12';

export function Login() {
  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();
  const recuperar = useRecuperarPassword();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [vistaRecuperar, setVistaRecuperar] = useState(false);
  const [usernameRecuperar, setUsernameRecuperar] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form, { onSuccess: () => navigate('/') });
  };

  const mensajeError =
    error && (error as unknown as { response?: { data?: { message?: string } } }).response?.data?.message
      ? (error as unknown as { response: { data: { message: string } } }).response.data.message
      : 'Credenciales incorrectas';

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: '#F7F5F2',
        border: '1px solid #ECE8E2',
        borderRadius: '20px',
        padding: '44px 44px 40px',
        boxShadow: '0 12px 40px rgba(100,85,60,.22), 0 2px 8px rgba(100,85,60,.12)',
        fontFamily: 'Manrope, system-ui, sans-serif',
      }}
    >
      {/* Cabecera: logo + nombre */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
        <div style={{
          width: '200px', height: '200px', borderRadius: '32px', overflow: 'hidden',
          boxShadow: '0 18px 42px -16px rgba(40,51,65,.5)', border: '1px solid #fff', flexShrink: 0,
        }}>
          <img
            src="/logo.jpeg"
            alt="IDB Inversiones y Desarrollos"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.04)' }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '.04em', color: SLATE }}>
            FRACCIONAMIENTO MONTE ALEGRE
          </div>
          <div style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '.12em', color: '#9A968F', marginTop: '5px' }}>
            AYUTLA · SAN MARCOS
          </div>
        </div>
      </div>

      {/* Divisor */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, #E6E1D9, transparent)',
        margin: '30px 0 28px',
      }} />

      <h1 style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 600,
        fontSize: '28px',
        color: SLATE,
        letterSpacing: '.01em',
        marginBottom: '24px',
        lineHeight: 1.2,
      }}>
        Iniciar sesión
      </h1>

      {/* Campo usuario */}
      <div style={{ marginBottom: '20px' }}>
        <label
          htmlFor="usuario"
          style={{ display: 'block', fontWeight: 600, fontSize: '12px', letterSpacing: '.05em', color: '#6B6760', marginBottom: '8px' }}
        >
          USUARIO
        </label>
        <input
          id="usuario"
          type="text"
          autoComplete="username"
          required
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          style={{
            width: '100%', padding: '13px 15px', border: '1px solid #E2DDD5', borderRadius: '11px',
            background: '#fff', font: '500 15px Manrope, sans-serif', color: '#2A2A2C',
            outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s, box-shadow .18s',
          }}
          onFocus={(e) => { e.target.style.borderColor = SLATE; e.target.style.boxShadow = '0 0 0 3px rgba(40,51,65,.08)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#E2DDD5'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Campo contraseña */}
      <div>
        <label
          htmlFor="password"
          style={{ display: 'block', fontWeight: 600, fontSize: '12px', letterSpacing: '.05em', color: '#6B6760', marginBottom: '8px' }}
        >
          CONTRASEÑA
        </label>
        <div style={{ position: 'relative', marginBottom: '28px' }}>
          <input
            id="password"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            style={{
              width: '100%', padding: '13px 44px 13px 15px', border: '1px solid #E2DDD5', borderRadius: '11px',
              background: '#fff', font: '500 15px Manrope, sans-serif', color: '#2A2A2C',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s, box-shadow .18s',
            }}
            onFocus={(e) => { e.target.style.borderColor = SLATE; e.target.style.boxShadow = '0 0 0 3px rgba(40,51,65,.08)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E2DDD5'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            type="button"
            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setShowPass((v) => !v)}
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: '#9A968F', padding: 0,
            }}
          >
            {showPass ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#c0392b', marginBottom: '16px', marginTop: '-12px' }}>
          {mensajeError}
        </p>
      )}

      <motion.button
        type="submit"
        disabled={isPending}
        whileHover={{ translateY: -1, boxShadow: '0 16px 30px -14px rgba(40,51,65,.8)' }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', padding: '15px', border: 'none', borderRadius: '11px',
          background: isPending ? '#4a5a6a' : SLATE, color: '#fff',
          font: `600 15px Manrope, sans-serif`, letterSpacing: '.02em',
          cursor: isPending ? 'not-allowed' : 'pointer',
          boxShadow: '0 12px 26px -14px rgba(40,51,65,.7)',
          transition: 'background .2s',
        }}
        onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = SLATE_DARK; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = isPending ? '#4a5a6a' : SLATE; }}
      >
        {isPending ? 'Verificando...' : 'Entrar'}
      </motion.button>

      <div style={{ textAlign: 'center', marginTop: '18px' }}>
        <button
          type="button"
          onClick={() => { setVistaRecuperar(true); recuperar.reset(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px', color: AMBER, borderBottom: `1px solid rgba(199,123,18,.3)`, paddingBottom: '1px', padding: '0 0 1px' }}
        >
          ¿Olvidó su contraseña?
        </button>
      </div>

      {vistaRecuperar && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={(e) => { if (e.target === e.currentTarget) setVistaRecuperar(false); }}
        >
          <div style={{ background: '#F7F5F2', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 50px rgba(0,0,0,.3)', fontFamily: 'Manrope, system-ui, sans-serif' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: SLATE, marginBottom: '6px' }}>Recuperar contraseña</h2>
            <p style={{ fontSize: '13px', color: '#6B6760', marginBottom: '20px', lineHeight: 1.5 }}>
              Ingresa tu usuario y te enviaremos una contraseña temporal a tu correo electrónico registrado.
            </p>

            {recuperar.isSuccess ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: '#166534', marginBottom: '16px' }}>
                {recuperar.data?.mensaje}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Tu nombre de usuario"
                  value={usernameRecuperar}
                  onChange={(e) => setUsernameRecuperar(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2DDD5', borderRadius: '10px', font: '500 14px Manrope, sans-serif', color: '#2A2A2C', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && usernameRecuperar.trim()) recuperar.mutate(usernameRecuperar.trim()); }}
                />

                {recuperar.isError && (
                  <p style={{ fontSize: '12px', color: '#c0392b', marginBottom: '10px' }}>
                    {(recuperar.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al enviar el correo'}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setVistaRecuperar(false)}
                    style={{ flex: 1, padding: '11px', border: '1px solid #E2DDD5', borderRadius: '10px', background: '#fff', font: '500 13px Manrope, sans-serif', color: '#6B6760', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={recuperar.isPending || !usernameRecuperar.trim()}
                    onClick={() => recuperar.mutate(usernameRecuperar.trim())}
                    style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: recuperar.isPending ? '#4a5a6a' : SLATE, color: '#fff', font: '600 13px Manrope, sans-serif', cursor: recuperar.isPending ? 'not-allowed' : 'pointer' }}
                  >
                    {recuperar.isPending ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              </>
            )}

            {recuperar.isSuccess && (
              <button
                type="button"
                onClick={() => setVistaRecuperar(false)}
                style={{ width: '100%', marginTop: '12px', padding: '11px', border: 'none', borderRadius: '10px', background: SLATE, color: '#fff', font: '600 13px Manrope, sans-serif', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.form>
  );
}
