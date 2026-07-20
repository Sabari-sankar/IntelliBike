'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/petrol',    icon: '⛽', label: 'Petrol' },
  { href: '/calendar',  icon: '📅', label: 'Calendar' },
  { href: '/graph',     icon: '📊', label: 'Graph' },
  { href: '/service',   icon: '🔧', label: 'Service' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: var(--nav-height);
          background: var(--nav-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          z-index: 50;
          transition: background 0.25s ease, border-color 0.25s ease;
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 8px 12px;
          text-decoration: none;
          transition: all 0.2s;
          border-radius: 12px;
          min-width: 60px;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-icon {
          font-size: 22px;
          line-height: 1;
          transition: transform 0.2s;
          filter: grayscale(1) opacity(0.5);
        }
        .nav-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-faint);
          letter-spacing: 0.03em;
          transition: color 0.2s;
        }
        .nav-item.active .nav-icon {
          filter: none;
          transform: scale(1.1);
        }
        .nav-item.active .nav-label {
          color: var(--primary);
        }
        .nav-item:active { transform: scale(0.9); }
        .nav-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--primary);
          margin-top: 2px;
        }
      `}</style>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item${active ? ' active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
              {active && <span className="nav-dot" />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
