interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: '#E4DDD2', fontFamily: 'Manrope, system-ui, sans-serif' }}
    >
      <div className="w-full" style={{ maxWidth: '480px' }}>
        {children}
      </div>
    </div>
  );
}
