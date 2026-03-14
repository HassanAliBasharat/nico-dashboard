import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const API = 'https://web-production-c20a2.up.railway.app';

const ALL_PRODUCTS = ['almond','cashew','pistachio','walnut','raisin','date','dried_fig','dried_apricot'];

const PRODUCT_META = {
  almond:        { label: 'Almonds',        emoji: '🌰', color: '#E8A838', origin: 'USA · Spain · Australia' },
  cashew:        { label: 'Cashews',        emoji: '🥜', color: '#10B981', origin: 'Vietnam · India · Ivory Coast' },
  pistachio:     { label: 'Pistachios',     emoji: '💚', color: '#6366F1', origin: 'USA · Iran · Turkey' },
  walnut:        { label: 'Walnuts',        emoji: '🟤', color: '#F59E0B', origin: 'USA · China · Chile' },
  raisin:        { label: 'Raisins',        emoji: '🍇', color: '#8B5CF6', origin: 'USA · Turkey · Iran' },
  date:          { label: 'Dates',          emoji: '🌴', color: '#EF4444', origin: 'Saudi Arabia · UAE · Tunisia' },
  dried_fig:     { label: 'Dried Figs',     emoji: '🫐', color: '#EC4899', origin: 'Turkey · Morocco · Greece' },
  dried_apricot: { label: 'Dried Apricots', emoji: '🍑', color: '#F97316', origin: 'Turkey · USA · Uzbekistan' },
};

const NAV_ITEMS = [
  { id: 'dashboard',           label: 'Dashboard',         icon: '⊞' },
  { id: 'analytics',           label: 'Analytics',         icon: '📊' },
  { id: 'products',            label: 'Products',          icon: '🌰' },
  { id: 'catalog',             label: 'Supplier Catalog',  icon: '📋' },
  { id: 'top5',                label: 'TOP 5',             icon: '⭐', indent: true },
  { id: 'catalog_netherlands', label: 'Netherlands Supply',icon: '🇳🇱', indent: true },
  { id: 'weather',             label: 'Weather Forecast',  icon: '🌡️' },
  { id: 'alerts',              label: 'Alerts',            icon: '🔔' },
  { id: 'sources',             label: 'Sources',           icon: '🗄️' },
];

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ─────────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F0F2F8; color: #1A1D2E; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D1D5E8; border-radius: 10px; }

  /* LAYOUT */
  .nico-layout { display: flex; min-height: 100vh; max-width: 100vw; overflow-x: hidden; }

  /* SIDEBAR */
  .sidebar { width: 230px; min-width: 230px; background: #fff; border-right: 1px solid #EAECF5; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 200; transition: transform 0.3s ease; overflow-y: auto; }
  .sidebar-logo { padding: 22px 20px 16px; border-bottom: 1px solid #EAECF5; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .logo-icon { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
  .logo-text { font-size: 17px; font-weight: 800; letter-spacing: 1.5px; color: #1A1D2E; }
  .sidebar-section { padding: 16px 12px 4px; font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; margin: 2px 8px; border-radius: 9px; cursor: pointer; font-size: 13.5px; font-weight: 500; color: #6B7280; transition: all 0.18s; text-decoration: none; border: none; background: none; width: calc(100% - 16px); position: relative; }
  .nav-item:hover { background: #F5F6FD; color: #1A1D2E; }
  .nav-item.active { background: #EEF2FF; color: #6366F1; font-weight: 600; }
  .nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: #6366F1; border-radius: 0 3px 3px 0; }
  .nav-badge { margin-left: auto; background: #EF4444; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
  .sidebar-bottom { margin-top: auto; padding: 16px 12px; border-top: 1px solid #EAECF5; flex-shrink: 0; }
  .user-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px; }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .user-name { font-size: 13px; font-weight: 600; color: #1A1D2E; }
  .user-role { font-size: 11px; color: #9CA3AF; }
  /* Mobile controls in sidebar */
  .sidebar-mobile-controls { display: none; padding: 12px; border-top: 1px solid #EAECF5; gap: 8px; flex-direction: column; }
  .sidebar-mobile-controls .refresh-btn { width: 100%; justify-content: center; }
  .sidebar-mobile-controls .topbar-btn { width: 100%; justify-content: center; }

  /* MAIN */
  .main-content { margin-left: 230px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; min-width: 0; overflow-x: hidden; }

  /* TOPBAR */
  .topbar { background: #fff; border-bottom: 1px solid #EAECF5; padding: 0 28px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .breadcrumb { font-size: 13px; color: #9CA3AF; white-space: nowrap; }
  .breadcrumb strong { color: #1A1D2E; font-weight: 600; }
  .topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .topbar-controls { display: flex; align-items: center; gap: 10px; }
  .topbar-btn { background: none; border: 1px solid #E5E7EB; border-radius: 9px; padding: 7px 14px; font-size: 13px; font-weight: 500; cursor: pointer; color: #374151; display: flex; align-items: center; gap: 6px; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; white-space: nowrap; }
  .topbar-btn:hover { background: #F9FAFB; border-color: #D1D5DB; }
  .refresh-btn { background: #6366F1; color: #fff; border: none; border-radius: 9px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .refresh-btn:hover { background: #4F46E5; }
  .refresh-btn:disabled { background: #A5B4FC; cursor: not-allowed; }

  /* PAGE */
  .page { padding: 28px; min-width: 0; }
  .page-header { margin-bottom: 24px; }
  .page-title { font-size: 22px; font-weight: 800; color: #1A1D2E; margin-bottom: 2px; }
  .page-subtitle { font-size: 12px; color: #9CA3AF; font-family: 'JetBrains Mono', monospace; }

  /* BANNER */
  .upgrade-banner { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); border-radius: 14px; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; color: #fff; }
  .upgrade-banner-text { font-size: 13px; opacity: 0.9; margin-top: 2px; }
  .upgrade-banner-btn { background: #fff; color: #6366F1; border: none; border-radius: 8px; padding: 8px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; transition: opacity 0.18s; flex-shrink: 0; }
  .upgrade-banner-btn:hover { opacity: 0.9; }

  /* STATS ROW */
  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: #fff; border-radius: 14px; padding: 20px 22px; border: 1px solid #EAECF5; min-width: 0; }
  .stat-label { font-size: 12px; color: #6B7280; font-weight: 500; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
  .stat-value { font-size: 26px; font-weight: 800; color: #1A1D2E; font-variant-numeric: tabular-nums; letter-spacing: -0.5px; word-break: break-all; }
  .stat-change { font-size: 12px; margin-top: 6px; font-weight: 600; }
  .stat-change.up { color: #10B981; }
  .stat-change.down { color: #EF4444; }
  .stat-change.neutral { color: #9CA3AF; }

  /* CARD */
  .card { background: #fff; border-radius: 14px; border: 1px solid #EAECF5; padding: 22px 24px; min-width: 0; }
  .card-title { font-size: 15px; font-weight: 700; color: #1A1D2E; margin-bottom: 4px; }
  .card-subtitle { font-size: 12px; color: #9CA3AF; margin-bottom: 20px; }

  /* CHARTS ROW */
  .charts-row { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-bottom: 24px; }

  /* PRODUCT PILLS */
  .product-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .pill { padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all 0.18s; }

  /* TABLE */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { padding: 11px 16px; text-align: left; font-size: 11.5px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #F3F4F6; white-space: nowrap; }
  .data-table td { padding: 11px 16px; font-size: 13px; border-bottom: 1px solid #F9FAFB; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: #FAFBFF; }
  .table-scroll-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  /* CAROUSEL TABS */
  .carousel-tabs-wrap { position: relative; margin-bottom: 0; }
  .carousel-tabs-scroll { display: flex; overflow-x: auto; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; gap: 0; border-bottom: 1px solid #F3F4F6; scrollbar-width: none; padding-bottom: 0; }
  .carousel-tabs-scroll::-webkit-scrollbar { display: none; }
  .carousel-btn { position: absolute; top: 50%; transform: translateY(-60%); background: #fff; border: 1px solid #E5E7EB; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.1); color: #6B7280; transition: all 0.18s; flex-shrink: 0; }
  .carousel-btn:hover { background: #6366F1; color: #fff; border-color: #6366F1; }
  .carousel-btn.left { left: -14px; }
  .carousel-btn.right { right: -14px; }
  .table-tab { padding: 10px 16px; font-size: 13px; font-weight: 500; color: #9CA3AF; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.18s; background: none; border-top: none; border-left: none; border-right: none; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; flex-shrink: 0; }
  .table-tab.active { color: #6366F1; border-bottom-color: #6366F1; font-weight: 700; }

  /* BADGE */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .badge-green { background: #DCFCE7; color: #16A34A; }
  .badge-yellow { background: #FEF9C3; color: #CA8A04; }
  .badge-red { background: #FEE2E2; color: #DC2626; }
  .badge-blue { background: #DBEAFE; color: #2563EB; }
  .badge-purple { background: #EDE9FE; color: #7C3AED; }

  /* PRODUCT GRID */
  .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .product-tile { background: #fff; border: 1px solid #EAECF5; border-radius: 14px; padding: 18px 20px; cursor: pointer; transition: all 0.2s; min-width: 0; }
  .product-tile:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-2px); }
  .product-tile-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .product-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .product-price { font-size: 22px; font-weight: 800; color: #1A1D2E; margin-bottom: 2px; }
  .product-origin { font-size: 11px; color: #9CA3AF; }

  /* LOGIN */
  .login-wrap { min-height: 100vh; background: linear-gradient(135deg, #F0F2F8 0%, #E8EBF5 100%); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .login-card { background: #fff; border-radius: 20px; padding: 44px 40px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(99,102,241,0.12); }
  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .login-input { width: 100%; padding: 12px 16px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif; color: #1A1D2E; outline: none; transition: border-color 0.18s; background: #FAFAFA; }
  .login-input:focus { border-color: #6366F1; background: #fff; }
  .login-input::placeholder { color: #D1D5DB; }
  .login-btn { width: 100%; padding: 13px; background: #6366F1; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; margin-top: 8px; }
  .login-btn:hover { background: #4F46E5; }
  .login-btn:disabled { background: #A5B4FC; cursor: not-allowed; }
  .login-error { background: #FEE2E2; color: #DC2626; padding: 10px 14px; border-radius: 8px; font-size: 13px; }

  /* ALERT ITEMS */
  .alert-item { padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden; touch-action: pan-y; }
  .alert-up { background: #FEF2F2; border: 1px solid #FCA5A5; }
  .alert-down { background: #F0FDF4; border: 1px solid #6EE7B7; }
  .alert-close-btn { position: absolute; top: 8px; right: 10px; background: none; border: none; cursor: pointer; font-size: 14px; color: #9CA3AF; padding: 2px; line-height: 1; border-radius: 999px; }
  .alert-close-btn:hover { background: rgba(15,23,42,0.04); color: #6B7280; }

  /* MOBILE MENU BTN */
  .mobile-menu-btn { display: none; background: none; border: none; cursor: pointer; padding: 6px; flex-shrink: 0; }
  .sidebar-overlay { display: none; }

  /* ── RESPONSIVE BREAKPOINTS ── */
  @media (max-width: 1100px) {
    .stats-row { grid-template-columns: repeat(2, 1fr); }
    .product-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 900px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); box-shadow: 0 0 40px rgba(0,0,0,0.15); }
    .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 199; }
    .main-content { margin-left: 0; }
    .mobile-menu-btn { display: flex; }
    .stats-row { grid-template-columns: repeat(2, 1fr); }
    .charts-row { grid-template-columns: 1fr; }
    .product-grid { grid-template-columns: repeat(2, 1fr); }
    .upgrade-banner { flex-direction: column; gap: 12px; align-items: flex-start; }
    .topbar { padding: 0 14px; }
    .page { padding: 14px; }
    /* Hide topbar controls on mobile — shown in sidebar instead */
    .topbar-controls { display: none; }
    .sidebar-mobile-controls { display: flex; }
    /* Catalog charts go single column on mobile */
    .catalog-charts-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 640px) {
    .stats-row { grid-template-columns: 1fr 1fr; gap: 10px; }
    .product-grid { grid-template-columns: 1fr 1fr; }
    .stat-value { font-size: 20px; }
    .charts-row { gap: 12px; }
    .page { padding: 10px; }
    .card { padding: 16px; }
    .page-title { font-size: 18px; }
    .login-card { padding: 28px 20px; }
  }
  @media (max-width: 400px) {
    .stats-row { grid-template-columns: 1fr; }
    .product-grid { grid-template-columns: 1fr 1fr; }
  }

  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp 0.35s ease forwards; }

  /* ── WEATHER TAB ── */
  .weather-map-container { width:100%; height:480px; border-radius:14px; overflow:hidden; border:1px solid #EAECF5; background:#1a3a5c; position:relative; }
  .weather-map-container iframe { width:100%; height:100%; border:none; }
  .weather-controls { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
  .weather-select { padding:8px 14px; border:1.5px solid #E5E7EB; border-radius:9px; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; color:#1A1D2E; background:#fff; outline:none; cursor:pointer; min-width:180px; }
  .weather-select:focus { border-color:#6366F1; }
  .period-btn { padding:7px 16px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:1.5px solid #E5E7EB; background:#fff; color:#6B7280; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s; }
  .period-btn.active { background:#6366F1; color:#fff; border-color:#6366F1; }
  .period-btn:hover:not(.active) { background:#F5F6FD; border-color:#6366F1; color:#6366F1; }
  .weather-chart-card { background:#fff; border-radius:14px; border:1px solid #EAECF5; padding:22px 24px; margin-top:18px; }
  .weather-legend { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:14px; }
  .legend-item { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:600; color:#374151; }
  .legend-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
  .country-flag { font-size:18px; margin-right:4px; }
  .temp-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .temp-hot { background:#FEE2E2; color:#DC2626; }
  .temp-warm { background:#FEF9C3; color:#CA8A04; }
  .temp-cool { background:#DBEAFE; color:#2563EB; }
  .temp-cold { background:#EDE9FE; color:#7C3AED; }
  .map-overlay-info { position:absolute; bottom:16px; left:16px; background:rgba(15,23,42,0.82); color:#fff; padding:10px 14px; border-radius:10px; font-size:12px; backdrop-filter:blur(4px); z-index:500; pointer-events:none; line-height:1.6; }
  .map-temp-marker { display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; font-size:11px; font-weight:800; color:#fff; border:2px solid rgba(255,255,255,0.6); cursor:pointer; transition:transform 0.15s; box-shadow:0 2px 8px rgba(0,0,0,0.3); }
  .map-temp-marker:hover { transform:scale(1.15); }
  @media (max-width:900px) {
    .weather-map-container { height:300px; }
    .weather-controls { gap:8px; flex-direction:column; align-items:stretch; }
    .weather-select { min-width:0; width:100%; }
    .weather-desktop-country-pills { display:none !important; }
    .weather-mobile-country-select { display:block !important; }
    .weather-chart-card { padding:14px; }
    .weather-legend { gap:10px; }
    .legend-item { font-size:11px; }
  }
  @media (max-width:640px) {
    .weather-map-container { height:240px; }
    .period-btn { padding:5px 10px; font-size:11px; }
  }
  /* Leaflet custom tooltip */
  .leaflet-weather-tooltip { background:#1A1D2E !important; color:#fff !important; border:none !important; border-radius:8px !important; padding:8px 12px !important; font-family:'Plus Jakarta Sans',sans-serif !important; font-size:12px !important; box-shadow:0 4px 16px rgba(0,0,0,0.3) !important; }
  .leaflet-weather-tooltip::before { display:none !important; }
  @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
`;

/* ─────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────── */
function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('username', user); fd.append('password', pass);
      const res = await axios.post(`${API}/login`, fd);
      localStorage.setItem('token', res.data.access_token);
      onLogin();
    } catch { setError('Invalid username or password'); }
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">🌰</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>NICO</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>Price Intelligence</div>
          </div>
        </div>
        <div style={{ marginBottom: 8, fontSize: 22, fontWeight: 800 }}>Welcome back</div>
        <div style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 28 }}>Sign in to your dashboard</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="login-input" placeholder="Username" value={user} onChange={e => setUser(e.target.value)} />
          <input className="login-input" type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" onClick={submit} disabled={loading}>{loading ? 'Signing in...' : 'Sign In →'}</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#D1D5DB', fontFamily: "'JetBrains Mono',monospace" }}>
          UN Comtrade · USDA · FAOSTAT · Market Data
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */

function AlertItem({ alert, onRemove }) {
  const [offsetX, setOffsetX] = useState(0);
  const [startX, setStartX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      setStartX(e.touches[0].clientX);
      setIsSwiping(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || startX == null) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    setOffsetX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    const threshold = 80;
    if (Math.abs(offsetX) > threshold) {
      onRemove();
    } else {
      setOffsetX(0);
    }
    setIsSwiping(false);
    setStartX(null);
  };

  return (
    <div
      className={`alert-item ${alert.direction === 'UP' ? 'alert-up' : 'alert-down'}`}
      style={{ transform: `translateX(${offsetX}px)`, transition: isSwiping ? 'none' : 'transform 0.18s ease-out' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div style={{ fontSize: 28, flexShrink: 0 }}>
        {PRODUCT_META[alert.product]?.emoji || '📦'}
      </div>
      <div style={{ flex: 1, paddingRight: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{alert.message}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
          ${alert.previous?.toFixed(2)} → ${alert.current?.toFixed(2)} · {alert.change_pct > 0 ? '+' : ''}{alert.change_pct}%
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span className={`badge ${alert.direction === 'UP' ? 'badge-red' : 'badge-green'}`}>{alert.direction}</span>
        <span className={`badge ${alert.severity === 'HIGH' ? 'badge-red' : 'badge-yellow'}`}>{alert.severity}</span>
      </div>
      <button
        className="alert-close-btn"
        type="button"
        aria-label="Dismiss alert"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUPPLIER CATALOG DATA
   Source 1: CALCONUT OFFERS (PDF) — 09/03/2026, prices valid 24h
   Source 2: NICO Product List (DOCX) — wholesale range reference
───────────────────────────────────────────── */

const CATALOG_TABS = [
  'TOP 5',
  'Almonds','Pistachios','Cashews','Walnuts','Raisins',
  'Hazelnuts','Pecans','Brazil Nuts','Macadamia','Pine Nuts',
  'Dates','Dried Figs','Dried Apricots','Dried Fruits','Seeds & Other'
];

/* ── EU 30-day market benchmark ranges (Eurostat COMEXT · WITS WorldBank · ITC TradeMap · OEC)
   These represent bulk wholesale EU import price ranges (EUR/kg, CIF equivalent)
   Sources: Eurostat https://ec.europa.eu/eurostat · WITS https://wits.worldbank.org
            ITC TradeMap https://trademap.org · OEC https://oec.world ──────────────────── */
const EU_MARKET_BENCHMARKS = {
  almond:        { low: 5.80, high: 7.20, avg: 6.50, source: 'Eurostat/ITC TradeMap' },
  cashew:        { low: 5.20, high: 7.50, avg: 6.20, source: 'WITS WorldBank' },
  pistachio:     { low: 8.50, high: 12.00, avg: 9.80, source: 'OEC/ITC TradeMap' },
  walnut:        { low: 3.80, high: 6.50, avg: 5.10, source: 'Eurostat COMEXT' },
  raisin:        { low: 1.80, high: 3.00, avg: 2.35, source: 'WITS WorldBank' },
  date:          { low: 3.50, high: 7.00, avg: 5.20, source: 'ITC TradeMap' },
  dried_fig:     { low: 2.50, high: 4.80, avg: 3.60, source: 'Eurostat/OEC' },
  dried_apricot: { low: 3.20, high: 6.50, avg: 4.80, source: 'WITS/Eurostat' },
};

/* ── TOP 5 NICO product list (Walnuts → Dried Papaya) from docx, with CALCONUT & EU market data ── */
const TOP5_NICO_DATA = [
  { rank:1,  product:'Walnuts',           origin:'USA · Chile · China',      calconutPrice:4.54,  nicoRangeLow:4.50, nicoRangeHigh:6.50, marketAvg:5.10, trend:'↗', note:'Core product, 60-70% of turnover' },
  { rank:2,  product:'Almonds',           origin:'USA · Spain · Australia',  calconutPrice:6.29,  nicoRangeLow:6.10, nicoRangeHigh:7.20, marketAvg:6.50, trend:'→', note:'Highest EU import volume' },
  { rank:3,  product:'Cashews',           origin:'Vietnam · India',          calconutPrice:6.18,  nicoRangeLow:5.20, nicoRangeHigh:7.50, marketAvg:6.20, trend:'↗', note:'WW240–WW450 grade spread' },
  { rank:4,  product:'Pistachios',        origin:'USA · Iran · Turkey',      calconutPrice:9.49,  nicoRangeLow:8.50, nicoRangeHigh:12.00,marketAvg:9.80, trend:'↑', note:'High margin product' },
  { rank:5,  product:'Hazelnuts',         origin:'Turkey · Georgia',         calconutPrice:11.11, nicoRangeLow:10.50,nicoRangeHigh:16.00,marketAvg:12.00,trend:'↑', note:'Turkey dominates supply' },
  { rank:6,  product:'Pecans',            origin:'USA',                      calconutPrice:10.66, nicoRangeLow:9.66, nicoRangeHigh:13.66,marketAvg:11.50,trend:'→', note:'High margin specialty' },
  { rank:7,  product:'Brazil Nuts',       origin:'Peru · Bolivia',           calconutPrice:12.09, nicoRangeLow:11.50,nicoRangeHigh:13.00,marketAvg:12.20,trend:'↗', note:'Crop 2026 available' },
  { rank:8,  product:'Macadamia',         origin:'Kenya',                    calconutPrice:13.20, nicoRangeLow:13.00,nicoRangeHigh:15.50,marketAvg:14.00,trend:'→', note:'Kenya Crop 2025' },
  { rank:9,  product:'Raisins',           origin:'Uzbekistan · Turkey',      calconutPrice:2.17,  nicoRangeLow:2.00, nicoRangeHigh:2.60, marketAvg:2.35, trend:'→', note:'Sultana grade 1 best value' },
  { rank:10, product:'Pine Nuts',         origin:'China',                    calconutPrice:27.85, nicoRangeLow:26.00,nicoRangeHigh:29.00,marketAvg:27.50,trend:'→', note:'Premium cedar/siberica' },
  { rank:11, product:'Dried Mango',       origin:'Thailand',                 calconutPrice:4.45,  nicoRangeLow:4.00, nicoRangeHigh:5.00, marketAvg:4.50, trend:'→', note:'Dices & slices available' },
  { rank:12, product:'Dried Cranberries', origin:'USA',                      calconutPrice:4.17,  nicoRangeLow:3.80, nicoRangeHigh:4.50, marketAvg:4.10, trend:'→', note:'Sugar infused slices' },
  { rank:13, product:'Dried Blueberries', origin:'USA · Chile',              calconutPrice:null,  nicoRangeLow:6.00, nicoRangeHigh:9.00, marketAvg:7.00, trend:'→', note:'Not in current CALCONUT offer' },
  { rank:14, product:'Dried Banana Chips',origin:'Philippines',              calconutPrice:3.24,  nicoRangeLow:3.00, nicoRangeHigh:3.80, marketAvg:3.40, trend:'→', note:'Whole sweetened' },
  { rank:15, product:'Dried Apple',       origin:'China · Chile',            calconutPrice:null,  nicoRangeLow:3.50, nicoRangeHigh:5.00, marketAvg:4.20, trend:'→', note:'Not in current CALCONUT offer' },
  { rank:16, product:'Dried Papaya',      origin:'Thailand',                 calconutPrice:3.60,  nicoRangeLow:3.40, nicoRangeHigh:4.00, marketAvg:3.70, trend:'→', note:'Slices & dices 8-10mm' },
];

/* ── Catalog price history (6-month trend, EUR/kg avg per category) ── */
const CATALOG_HISTORY = {
  'Almonds':        { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[6.10,6.18,6.25,6.30,6.22,6.29] },
  'Pistachios':     { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[9.20,9.35,9.40,9.55,9.49,9.65] },
  'Cashews':        { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[5.90,6.10,6.20,6.35,6.30,6.48] },
  'Walnuts':        { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[4.20,4.35,4.50,4.60,4.54,4.70] },
  'Raisins':        { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[2.00,2.05,2.10,2.15,2.17,2.20] },
  'Hazelnuts':      { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[10.50,10.80,11.00,11.11,11.20,11.30] },
  'Pecans':         { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[10.20,10.50,10.66,10.80,10.90,11.00] },
  'Brazil Nuts':    { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[11.50,11.70,11.90,12.00,12.09,12.20] },
  'Macadamia':      { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[12.80,13.00,13.10,13.20,13.30,13.50] },
  'Pine Nuts':      { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[26.50,26.80,27.00,27.30,27.50,27.85] },
  'Dates':          { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[4.80,4.90,5.00,5.10,5.15,5.20] },
  'Dried Figs':     { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[3.30,3.40,3.45,3.55,3.58,3.60] },
  'Dried Apricots': { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[4.50,4.60,4.70,4.75,4.80,4.82] },
  'Dried Fruits':   { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[3.10,3.20,3.30,3.35,3.42,3.50] },
  'Seeds & Other':  { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[1.50,1.55,1.60,1.65,1.70,1.75] },
  'TOP 5':          { months:['Oct','Nov','Dec','Jan','Feb','Mar'], prices:[5.20,5.35,5.50,5.60,5.65,5.72] },
};

// All prices in EUR as sourced from documents. fmt() converts to USD if needed.
const CATALOG_DATA = {
  'Almonds': [
    // CALCONUT PDF — 09/03/2026 (nico.pdf)
    { product:'Caramelized Almond Dices', origin:'Spain', packaging:'2x5kg bags', qty:'2,090 kg', availability:'On stock', price:2.49, normalPrice:3.99, source:'CALCONUT', note:'Stock clearance — discount price' },
    { product:'Natural Almond Meal', origin:'Spain (Alicante)', packaging:'10kg cartons', qty:'10,080 kg', availability:'Week 13', price:5.65, fullTruckPrice:5.55, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Almond Meal Premium Std', origin:'Spain (Alicante)', packaging:'10kg cartons', qty:'10,080 kg', availability:'Week 16', price:6.64, fullTruckPrice:6.54, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Almond Meal Economy', origin:'Spain (Alicante)', packaging:'10kg cartons', qty:'720 kg', availability:'On stock', price:6.29, fullTruckPrice:6.19, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Almond Meal Premium Extrafine', origin:'Spain (Alicante)', packaging:'10kg cartons', qty:'2,880 kg', availability:'On stock', price:6.89, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Almond Dices 2–4mm', origin:'Spain (Alicante)', packaging:'10kg cartons', qty:'8,640 kg', availability:'On stock', price:6.68, fullTruckPrice:6.58, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Almond Slices 0.7–0.9mm', origin:'Spain (Alicante)', packaging:'10kg cartons', qty:'16,380 kg', availability:'On stock', price:6.85, fullTruckPrice:6.75, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Almond Slices 1.0–1.2mm', origin:'Spain (Alicante)', packaging:'10kg cartons', qty:'15,750 kg', availability:'On stock', price:6.85, fullTruckPrice:6.75, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Almond Slivers', origin:'Spain (Alicante)', packaging:'10kg cartons', qty:'10,080 kg', availability:'Week 13', price:6.85, fullTruckPrice:6.75, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Whole Almonds SSR 23/25', origin:'Spain (Alicante)', packaging:'1,000kg big bags', qty:'20,000 kg', availability:'Mid April', price:7.02, fullTruckPrice:6.92, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Whole Almonds SSR 27/30', origin:'Spain (Alicante)', packaging:'1,000kg big bags', qty:'20,000 kg', availability:'Mid April', price:6.96, fullTruckPrice:6.86, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Standard Unsized', origin:'Spain (Alicante)', packaging:'1,000kg big bags', qty:'20,000 kg', availability:'Mid April', price:6.69, fullTruckPrice:6.59, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Blanched Whole & Broken 70/30', origin:'Spain (Alicante)', packaging:'1,000kg big bags', qty:'20,000 kg', availability:'Mid April', price:6.54, fullTruckPrice:6.44, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Natural Almond Paste Dark Roast', origin:'USA', packaging:'13kg bucket', qty:'On request', availability:'On request', price:6.50, source:'CALCONUT', note:'Specialty — FCA Alicante' },
    { product:'Blanched Almond Paste Medium Roast', origin:'USA', packaging:'13kg bucket', qty:'On request', availability:'On request', price:6.60, source:'CALCONUT', note:'Specialty — FCA Alicante' },
    { product:'Roasted Almond Dices 2–4mm', origin:'USA', packaging:'9kg vacuum', qty:'On request', availability:'On request', price:7.38, source:'CALCONUT', note:'Specialty — FCA Alicante' },
    { product:'Roasted Almond Slivers', origin:'USA', packaging:'9kg vacuum', qty:'On request', availability:'On request', price:7.56, source:'CALCONUT', note:'Specialty — FCA Alicante' },
    { product:'Carmel Type Sup 27/30', origin:'USA', packaging:'50lb carton', qty:'5,000 kg', availability:'On stock', price:6.33, fullTruckPrice:6.23, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Carmel Type Sup 20/22', origin:'USA', packaging:'50lb carton', qty:'20,000 kg', availability:'Beg May', price:6.44, fullTruckPrice:6.34, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Independence SSR 23/25', origin:'USA', packaging:'50lb carton', qty:'7,700 kg', availability:'On stock', price:6.29, fullTruckPrice:6.19, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Independence Extra Nº1 30/32', origin:'USA', packaging:'Supersacks 2,200lb', qty:'20,000 kg', availability:'On stock', price:6.28, fullTruckPrice:6.18, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Independence Extra Nº1 23/25', origin:'USA', packaging:'50lb carton', qty:'20,000 kg', availability:'Mid April', price:6.39, fullTruckPrice:6.29, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'NP Extra Nº1 23/25', origin:'USA', packaging:'50lb carton', qty:'20,000 kg', availability:'End April/Beg May', price:6.68, fullTruckPrice:6.58, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'NP Inshell', origin:'USA', packaging:'50lb bags', qty:'10,000 kg', availability:'End April', price:4.94, fullTruckPrice:4.84, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Guara 12/14mm Selected', origin:'Spain', packaging:'Big bags 1,000kg', qty:'20,000 kg', availability:'On stock', price:6.17, fullTruckPrice:6.12, source:'CALCONUT', note:'FCA Alicante duty unpaid' },
    { product:'Guara +14mm Selected', origin:'Spain', packaging:'Big bags 1,000kg', qty:'20,000 kg', availability:'On stock', price:6.18, fullTruckPrice:6.13, source:'CALCONUT', note:'FCA Alicante duty unpaid' },
    { product:'Lauranne +14mm Selected', origin:'Spain', packaging:'Big bags 1,000kg', qty:'3,000 kg', availability:'On stock', price:6.18, source:'CALCONUT', note:'FCA Alicante duty unpaid' },
  ],
  'Pistachios': [
    { product:'Pistachio Paste', origin:'USA', packaging:'12.5kg bucket', qty:'3,620 kg', availability:'On stock', price:16.99, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Pistachio Paste (1kg)', origin:'USA', packaging:'1kg bucket', qty:'266 kg', availability:'On stock', price:17.49, source:'CALCONUT', note:'FCA Alicante duty paid' },
    { product:'Pistachio Inshell Extra N1 21/25', origin:'USA', packaging:'25lb cartons', qty:'7,700 kg', availability:'On stock', price:9.49, fullTruckPrice:9.39, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Pistachio Inshell Extra N1 18/22', origin:'USA', packaging:'Supersacks 2,200lb', qty:'19,000 kg', availability:'On stock', price:9.89, fullTruckPrice:9.79, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Pistachio Inshell Extra N1 21/26', origin:'USA', packaging:'Supersacks 2,200lb', qty:'20,000 kg', availability:'On stock', price:9.49, fullTruckPrice:9.39, source:'CALCONUT', note:'FCA Valencia duty paid' },
  ],
  'Cashews': [
    { product:'Cashew WW240', origin:'Vietnam', packaging:'50lb vacuum', qty:'10,400 kg', availability:'Week 12', price:6.94, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Cashew WW320', origin:'Vietnam', packaging:'50lb vacuum', qty:'1,043 kg', availability:'On stock', price:6.48, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Cashew WW320 (bulk)', origin:'Vietnam', packaging:'50lb vacuum', qty:'26,000 kg', availability:'Week 13/14', price:6.48, fullTruckPrice:6.38, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Cashew WW450', origin:'Vietnam', packaging:'50lb vacuum', qty:'26,000 kg', availability:'On stock', price:6.18, fullTruckPrice:6.08, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Cashew White Splits', origin:'Vietnam', packaging:'50lb vacuum', qty:'4,170 kg', availability:'Week 12', price:5.45, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Cashew Large Pieces (LP)', origin:'Vietnam', packaging:'50lb vacuum', qty:'1,560 kg', availability:'Week 12', price:4.30, source:'CALCONUT', note:'FCA Valencia duty paid' },
  ],
  'Walnuts': [
    { product:'Walnut Shelled Chandler Light 80% Halves', origin:'USA', packaging:'22lb cartons', qty:'12,600 kg', availability:'On stock', price:6.25, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Walnut Shelled Light Pieces', origin:'China', packaging:'10kg vacuum', qty:'6,800 kg', availability:'On stock', price:4.54, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Walnut Shelled 185 X-light 90%', origin:'China', packaging:'10kg vacuum', qty:'7,000 kg', availability:'Week 13/14', price:5.64, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Walnut Inshell Chandler Jumbo/Large', origin:'USA', packaging:'25kg bags', qty:'20,000 kg', availability:'End April', price:2.38, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Walnut Shelled Chandler Light 80% Halves', origin:'Argentina', packaging:'2x5kg vacuum', qty:'18,000 kg', availability:'On stock', price:5.99, source:'CALCONUT', note:'FCA Valencia duty paid' },
  ],
  'Raisins': [
    { product:'Raisin Sultana Grade 1 STD', origin:'Uzbekistan', packaging:'10kg cartons', qty:'20,000 kg', availability:'On stock', price:2.17, fullTruckPrice:2.07, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Raisin Sultana 9 Grade A', origin:'Turkey', packaging:'12.5kg cartons', qty:'9,350 kg', availability:'On stock', price:2.59, source:'CALCONUT', note:'FCA Valencia duty paid' },
  ],
  'Hazelnuts': [
    { product:'Hazelnut Natural 13–15mm', origin:'Georgia', packaging:'25kg bags', qty:'11,000 kg', availability:'On stock', price:11.11, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Hazelnut Blanched & Roasted 13–15mm', origin:'Turkey', packaging:'10kg vacuum', qty:'6,130 kg', availability:'On stock', price:16.00, source:'CALCONUT', note:'FCA Valencia duty paid' },
  ],
  'Pecans': [
    { product:'Pecan Fancy Junior Mammoth Halves (stock clearance)', origin:'USA', packaging:'30lb vacuum', qty:'1,265 kg', availability:'On stock', price:9.66, normalPrice:13.66, source:'CALCONUT', note:'Stock clearance — FCA Valencia' },
    { product:'Pecan Fancy Junior Mammoth Halves', origin:'USA', packaging:'30lb vacuum', qty:'1,265 kg', availability:'On stock', price:13.66, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Pecan Fancy Junior Mammoth Halves 70%–30%', origin:'USA', packaging:'30lb vacuum', qty:'12,600 kg', availability:'On stock', price:13.21, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Pecan Fancy Large Pieces', origin:'USA', packaging:'30lb vacuum', qty:'5,000 kg', availability:'On stock', price:10.66, source:'CALCONUT', note:'FCA Valencia duty paid' },
  ],
  'Brazil Nuts': [
    { product:'Brazil Nut Medium Vacuum', origin:'Peru', packaging:'20kg cartons vacuum', qty:'6,000 kg', availability:'End June', price:12.09, source:'CALCONUT', note:'Crop 2026 — FCA Valencia duty paid' },
  ],
  'Macadamia': [
    { product:'Macadamia Style 1L', origin:'Kenya', packaging:'11.34kg vacuum', qty:'2,700 kg', availability:'On stock', price:14.19, source:'CALCONUT', note:'Crop 2025 — FCA Valencia duty unpaid' },
    { product:'Macadamia Style 1S', origin:'Kenya', packaging:'11.34kg vacuum', qty:'3,600 kg', availability:'Week 14/15', price:13.20, source:'CALCONUT', note:'Crop 2025 — FCA Valencia duty unpaid' },
    { product:'Macadamia Style 0', origin:'Kenya', packaging:'11.34kg vacuum', qty:'907 kg', availability:'Week 14/15', price:15.41, source:'CALCONUT', note:'Crop 2025 — FCA Valencia duty unpaid' },
  ],
  'Pine Nuts': [
    { product:'Pine Nut Cedar/Siberica 950–1000 count', origin:'China', packaging:'2x12.5kg vacuum', qty:'7,800 kg', availability:'On stock', price:27.85, source:'CALCONUT', note:'FCA Valencia duty paid' },
  ],
  'Dates': [],
  'Dried Figs': [],
  'Dried Apricots': [],
  'Dried Fruits': [
    { product:'Cranberry Slices Sugar Infused', origin:'USA', packaging:'25lb cartons', qty:'18,100 kg', availability:'Week 13/14', price:4.17, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Pineapple Dices 8–10mm', origin:'Thailand', packaging:'4x5kg bags', qty:'3,840 kg', availability:'1st half April', price:3.81, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Mango Dices 8–10mm', origin:'Thailand', packaging:'4x5kg bags', qty:'1,920 kg', availability:'On stock', price:4.45, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Mango Slices', origin:'Thailand', packaging:'4x5kg bags', qty:'1,920 kg', availability:'On stock', price:4.40, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Papaya Slices', origin:'Thailand', packaging:'4x5kg bags', qty:'1,920 kg', availability:'On stock', price:3.60, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Papaya Dices 8–10mm', origin:'Thailand', packaging:'4x5kg bags', qty:'3,840 kg', availability:'On stock', price:3.60, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Banana Chips Sweetened', origin:'Philippines', packaging:'6.8kg cartons', qty:'13,000 kg', availability:'2nd half April', price:3.24, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Ginger Dices 8–10mm', origin:'Thailand', packaging:'4x5kg bags', qty:'1,920 kg', availability:'On stock', price:3.42, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Ginger Slices', origin:'Thailand', packaging:'4x5kg bags', qty:'1,920 kg', availability:'2nd half April', price:3.42, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Freeze-dried Strawberry Dices 10x10x10mm', origin:'—', packaging:'10kg vacuum', qty:'540 kg', availability:'On stock', price:26.26, source:'CALCONUT', note:'NEW — FCA Valencia duty paid' },
  ],
  'Seeds & Other': [
    { product:'Peanut Blanched Runner 38/42', origin:'Argentina', packaging:'1,250kg big bags', qty:'22,500 kg', availability:'On stock', price:1.43, fullTruckPrice:1.33, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Pumpkin Seed Kernels GWS Grade AA', origin:'China', packaging:'25kg bags', qty:'17,000 kg', availability:'End April', price:3.50, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Sunflower Seeds Inshell 363 (190–200)', origin:'China', packaging:'25kg bags', qty:'17,225 kg', availability:'On stock', price:1.83, fullTruckPrice:1.73, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Sesame Seeds Roasted', origin:'India', packaging:'25kg bags', qty:'4,800 kg', availability:'End April', price:1.83, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Sesame Seeds Hulled White', origin:'India', packaging:'25kg bags', qty:'14,800 kg', availability:'Mid April', price:1.75, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Coconut Fine Grade High Fat So2 Free', origin:'Indonesia', packaging:'25kg bags', qty:'20,000 kg', availability:'On stock', price:2.41, fullTruckPrice:2.31, source:'CALCONUT', note:'FCA Valencia duty paid' },
    { product:'Coconut Fine Grade High Fat So2 Free', origin:'Sri Lanka', packaging:'25kg bags', qty:'1,200 kg', availability:'On stock', price:2.75, source:'CALCONUT', note:'FCA Valencia duty paid' },
  ],
};

// Netherlands wholesale supply list (Maart 2026.pdf)
const NETHERLANDS_SUPPLY_DATA = [
  // Amandelen (bulk)
  { product:'Amandelen diced 3-5', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:8.60, source:'NL List', note:'Item 802164 · €107,50 per box' },
  { product:'Amandelschaafsel regular (0,9–1,2mm)', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:8.45, source:'NL List', note:'Item 381432 · €105,63 per box' },
  { product:'Amandelen bruin 20/22 AOL Valencia', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:8.00, source:'NL List', note:'Item 371422 · €80,00 per box' },
  { product:'Amandelen bruin 23/25 car. sup. USA', origin:'Netherlands supply', packaging:'DOOS 22,68 KG', qty:'22.68 kg', availability:'Valid Mar 2026', price:7.55, source:'NL List', note:'Item 371409 · €171,23 per box' },
  { product:'Amandelen wit 23/25 USA', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:8.60, source:'NL List', note:'Item 381415 · €107,50 per box' },
  { product:'Amandelen wit 27/30 USA', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:8.55, source:'NL List', note:'Item 381416 · €106,88 per box' },
  { product:'Amandelen wit Valencia 18/20', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:9.80, source:'NL List', note:'Item 371424 · €98,00 per box' },
  { product:'Amandelpoeder', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:8.20, source:'NL List', note:'Item 381420 · €82,00 per box' },
  { product:'Amandelschaafsel extra thin', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:8.45, source:'NL List', note:'Item 381421 · €105,63 per box' },
  { product:'Drooggeroosterde amandelen bruin', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:8.75, source:'NL List', note:'Item 381511 · €87,50 per box' },
  { product:'Drooggeroosterde amandelen wit', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:9.75, source:'NL List', note:'Item 381512 · €97,50 per box' },
  { product:'Rookamandelen origineel USA', origin:'Netherlands supply', packaging:'DOOS 11,34 KG', qty:'11.34 kg', availability:'Valid Mar 2026', price:12.30, source:'NL List', note:'Item 391140 · €139,48 per box' },

  // Cashewnoten (bulk)
  { product:'Cashewnoten gebrand/gezouten', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:8.55, source:'NL List', note:'Item 187789 · €85,50 per box' },
  { product:'Cashewnoten gebrand/ongezouten', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:8.55, source:'NL List', note:'Item 187788 · €85,50 per box' },
  { product:'Cashewnoten LWP', origin:'Netherlands supply', packaging:'DOOS 22,68 KG', qty:'22.68 kg', availability:'Valid Mar 2026', price:7.10, source:'NL List', note:'Item 171509 · €161,03 per box' },
  { product:'Cashewnoten W240 Tanzania', origin:'Netherlands supply', packaging:'DOOS 22,68 KG', qty:'22.68 kg', availability:'Valid Mar 2026', price:8.90, source:'NL List', note:'Item 181515 · €201,85 per box' },
  { product:'Cashewnoten W240 Tanzania Premium', origin:'Netherlands supply', packaging:'DOOS 22,68 KG', qty:'22.68 kg', availability:'Valid Mar 2026', price:9.80, source:'NL List', note:'Item 181516 · €222,26 per box' },
  { product:'Cashewnoten W240 Vietnam', origin:'Netherlands supply', packaging:'DOOS 22,68 KG', qty:'22.68 kg', availability:'Valid Mar 2026', price:7.90, source:'NL List', note:'Item 181477 · €179,17 per box' },
  { product:'Cashewnoten W320 India', origin:'Netherlands supply', packaging:'DOOS 22,68 KG', qty:'22.68 kg', availability:'Valid Mar 2026', price:8.95, source:'NL List', note:'Item 181475 · €202,99 per box' },
  { product:'Cashewnoten W320 Vietnam', origin:'Netherlands supply', packaging:'DOOS 22,68 KG', qty:'22.68 kg', availability:'Valid Mar 2026', price:7.45, source:'NL List', note:'Item 181473 · €168,97 per box' },
  { product:'Cashewnoten W450 Vietnam/India', origin:'Netherlands supply', packaging:'DOOS 22,68 KG', qty:'22.68 kg', availability:'Valid Mar 2026', price:7.25, source:'NL List', note:'Item 181482 · €164,43 per box' },
  { product:'Drooggeroosterde cashew', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:8.65, source:'NL List', note:'Item 381513 · €86,50 per box' },

  // Hazelnoten (bulk)
  { product:'Hazelnoten bruin 13/15 Turkije', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:16.30, source:'NL List', note:'Item 211575 · €163,00 per box' },
  { product:'Hazelnoten stukjes roast 2–4mm', origin:'Netherlands supply', packaging:'ZAK 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:12.10, source:'NL List', note:'Item 227774 · €60,50 per bag' },
  { product:'Hazelnoten wit 12/14 Turkije', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:18.80, source:'NL List', note:'Item 221578 · €188,00 per box' },
  { product:'Hazelnoten wit geroosterd 12/14 Italië', origin:'Netherlands supply', packaging:'ZAK 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:19.25, source:'NL List', note:'Item 221579 · €96,25 per bag' },

  // Macadamia (bulk)
  { product:'Macadamia No 1 ZA', origin:'Netherlands supply', packaging:'DOOS 11,34 KG', qty:'11.34 kg', availability:'Valid Mar 2026', price:16.30, source:'NL List', note:'Item 161600 · €184,84 per box' },
  { product:'Macadamia size 1 Australië', origin:'Netherlands supply', packaging:'DOOS 11,34 KG', qty:'11.34 kg', availability:'Valid Mar 2026', price:20.85, source:'NL List', note:'Item 161585 · €236,44 per box' },
  { product:'Macadamia size 1 Suncoast Australië', origin:'Netherlands supply', packaging:'DOOS 11,34 KG', qty:'11.34 kg', availability:'Valid Mar 2026', price:21.00, source:'NL List', note:'Item 161594 · €238,14 per box' },
  { product:'Macadamia size 2 ZA', origin:'Netherlands supply', packaging:'DOOS 11,34 KG', qty:'11.34 kg', availability:'Valid Mar 2026', price:14.75, source:'NL List', note:'Item 161590 · €167,27 per box' },
  { product:'Macadamia size 4 Afrika', origin:'Netherlands supply', packaging:'DOOS 11,34 KG', qty:'11.34 kg', availability:'Valid Mar 2026', price:12.65, source:'NL List', note:'Item 161595 · €143,45 per box' },

  // Paranoten (Brazil nuts)
  { product:'Paranoten gepeld midget', origin:'Netherlands supply', packaging:'DOOS 20 KG', qty:'20 kg', availability:'Valid Mar 2026', price:19.80, source:'Netherlands supply', note:'Item 251619 · €396,00 per box' },

  // Pecannoten (bulk)
  { product:'Drooggeroosterde pecan', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:16.10, source:'NL List', note:'Item 381515 · €161,00 per box' },
  { product:'Pecannoten F.J.M. halves USA', origin:'Netherlands supply', packaging:'DOOS 13,6 KG', qty:'13.6 kg', availability:'Valid Mar 2026', price:15.20, source:'NL List', note:'Item 411623 · €206,72 per box' },

  // Pistachenoten (bulk)
  { product:'Pistache gepeld Iran', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:23.80, source:'NL List', note:'Item 301650 · €238,00 per box' },
  { product:'Pistache gepeld USA', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:24.90, source:'NL List', note:'Item 301642 · €249,00 per box' },
  { product:'Pistache in dop 22/24 Iran', origin:'Netherlands supply', packaging:'BAAL 50 KG', qty:'50 kg', availability:'Valid Mar 2026', price:11.15, source:'NL List', note:'Item 281447 · €557,50 per bale' },
  { product:'Pistache in dop 28/30 Iran (doos)', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:11.60, source:'NL List', note:'Item 281445 · €116,00 per box' },
  { product:'Pistache in dop 28/30 Iran (baal)', origin:'Netherlands supply', packaging:'BAAL 50 KG', qty:'50 kg', availability:'Valid Mar 2026', price:10.70, source:'NL List', note:'Item 281440 · €535,00 per bale' },
  { product:'Pistache in dop geroosterd/gezouten', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:11.85, source:'NL List', note:'Item 291170 · €118,50 per box' },

  // Walnoten (bulk)
  { product:'Walnoten Extra Light Halves 80% MC Chili', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:9.20, source:'NL List', note:'Item 331550 · €92,00 per box' },
  { product:'Walnoten gepeld E.L.H. Chili h.c.', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:12.10, source:'NL List', note:'Item 331506 · €121,00 per box' },
  { product:'Walnoten gepeld Frankrijk premium 2x5kg', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:12.80, source:'NL List', note:'Item 337838 · €128,00 per box' },
  { product:'Walnoten gepeld L.H. 40% USA', origin:'Netherlands supply', packaging:'DOOS 10,89 KG', qty:'10.89 kg', availability:'Valid Mar 2026', price:5.95, source:'NL List', note:'Item 331549 · €64,80 per box' },
  { product:'Walnoten gepeld L.H. China 80%', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:5.05, source:'NL List', note:'Item 331539 · €50,50 per box' },
  { product:'Walnoten gepeld quarters light Chili', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:7.25, source:'NL List', note:'Item 331492 · €72,50 per box' },

  // Pinda's (selection of bulk)
  { product:'Doppinda gebrand 7/10 Egypte', origin:'Netherlands supply', packaging:'BAAL 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:4.15, source:'NL List', note:'Item 101555 · €51,88 per bale' },
  { product:'Drooggeroosterde pinda', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:3.05, source:'NL List', note:'Item 381514 · €30,50 per box' },
  { product:'Pinda 38/42 gebrand/gezouten', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:3.00, source:'NL List', note:'Item 127654 · €30,00 per box' },
  { product:'Pinda blank 25/29 rauw China', origin:'Netherlands supply', packaging:'DOOS 25 KG', qty:'25 kg', availability:'Valid Mar 2026', price:2.10, source:'NL List', note:'Item 121558 · €52,50 per box' },

  // Fruit gedroogd – bessen (bulk)
  { product:'Cranberries half gezoet/gedroogd', origin:'Netherlands supply', packaging:'DOOS 11,34 KG', qty:'11.34 kg', availability:'Valid Mar 2026', price:5.05, source:'NL List', note:'Item 831460 · €57,27 per box' },
  { product:'Cranberries halven', origin:'Netherlands supply', packaging:'DOOS 11,34 KG', qty:'11.34 kg', availability:'Valid Mar 2026', price:4.35, source:'NL List', note:'Item 831497 · €49,33 per box' },
  { product:'Gojibessen 280 count', origin:'Netherlands supply', packaging:'DOOS 20 KG', qty:'20 kg', availability:'Valid Mar 2026', price:10.80, source:'NL List', note:'Item 101019 · €216,00 per box' },
  { product:'Moerbeibessen gedroogd wit', origin:'Netherlands supply', packaging:'DOOS 8 KG', qty:'8 kg', availability:'Valid Mar 2026', price:11.90, source:'NL List', note:'Item 831487 · €95,20 per box' },

  // Fruit gesuikerd (bulk – selection)
  { product:'Aardbeien gedroogd (non azo)', origin:'Netherlands supply', packaging:'ZAK 1 KG', qty:'1 kg', availability:'Valid Mar 2026', price:12.30, source:'Netherlands supply', note:'Item 810875' },
  { product:'Ananas core sliced', origin:'Netherlands supply', packaging:'ZAK 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:5.60, source:'NL List', note:'Item 591425 · €28,00 per bag' },
  { product:'Ananasblokjes 8/10mm', origin:'Netherlands supply', packaging:'ZAK 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:5.45, source:'NL List', note:'Item 591430 · €27,25 per bag' },
  { product:'Bananenchips gezoet Filipijnen', origin:'Netherlands supply', packaging:'DOOS 6,8 KG', qty:'6.8 kg', availability:'Valid Mar 2026', price:3.55, source:'NL List', note:'Item 521450 · €24,14 per box' },
  { product:'Kokosblokjes soft', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:5.00, source:'NL List', note:'Item 581504 · €62,50 per box' },
  { product:'Mango sliced', origin:'Netherlands supply', packaging:'ZAK 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:5.65, source:'NL List', note:'Item 591390 · €28,25 per bag' },
  { product:'Mango slices Filipijnen style', origin:'Netherlands supply', packaging:'ZAK 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:8.95, source:'NL List', note:'Item 591386 · €44,75 per bag' },
  { product:'Mangoblokjes 8–10mm', origin:'Netherlands supply', packaging:'ZAK 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:5.60, source:'NL List', note:'Item 591388 · €28,00 per bag' },
  { product:'Papaja rood chunks 20/30mm', origin:'Netherlands supply', packaging:'ZAK 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:4.60, source:'NL List', note:'Item 601614 · €23,00 per bag' },

  // Zuidvruchten – key items
  { product:'Abrikozen zoet gehakt 8–10mm Turkije', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:6.55, source:'NL List', note:'Item 511402 · €81,88 per box' },
  { product:'Abrikozen zoet no 2 Turkije', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:10.65, source:'NL List', note:'Item 511427 · €133,13 per box' },
  { product:'Dadel Medjoul large choice', origin:'Netherlands supply', packaging:'DOOS 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:9.20, source:'NL List', note:'Item 541506 · €46,00 per box' },
  { product:'Dadels Deglet Nour', origin:'Netherlands supply', packaging:'DOOS 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:2.45, source:'NL List', note:'Item 541520 · €12,25 per box' },
  { product:'Dadels Deglet Nour pitloos', origin:'Netherlands supply', packaging:'DOOS 5 KG', qty:'5 kg', availability:'Valid Mar 2026', price:3.30, source:'NL List', note:'Item 541525 · €16,50 per box' },
  { product:'Krenten 12,5kg', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:5.25, source:'NL List', note:'Item 611590 · €65,63 per box' },
  { product:'Rozijnen sultana nr 9 Turkije', origin:'Netherlands supply', packaging:'DOOS 12,5 KG', qty:'12.5 kg', availability:'Valid Mar 2026', price:3.95, source:'NL List', note:'Item 501745 · €49,38 per box' },

  // Pitten / zaden en granen – selection
  { product:'Pijnboompitten grade A Koraiensis', origin:'Netherlands supply', packaging:'DOOS 25 KG', qty:'25 kg', availability:'Valid Mar 2026', price:29.05, source:'NL List', note:'Item 827747 · €726,25 per box' },
  { product:'Chiazaad', origin:'Netherlands supply', packaging:'BAAL 25 KG', qty:'25 kg', availability:'Valid Mar 2026', price:4.20, source:'NL List', note:'Item 821789 · €105,00 per bale' },
  { product:'Pepita’s droog geroosterd', origin:'Netherlands supply', packaging:'DOOS 10 KG', qty:'10 kg', availability:'Valid Mar 2026', price:5.50, source:'NL List', note:'Item 828502 · €55,00 per box' },
  { product:'Zonnebloempitten A-kwaliteit', origin:'Netherlands supply', packaging:'BAAL 25 KG', qty:'25 kg', availability:'Valid Mar 2026', price:1.75, source:'NL List', note:'Item 821792 · €43,75 per bale' },
];

/* ─────────────────────────────────────────────
   SUPPLIER CATALOG COMPONENT — fully responsive
───────────────────────────────────────────── */
function SupplierCatalog({ fmt, currency }) {
  const [activeTab, setActiveTab] = useState('TOP 5');
  const [search, setSearch] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const tabsRef = React.useRef(null);

  const scroll = (dir) => {
    if (tabsRef.current) tabsRef.current.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  const rows = (CATALOG_DATA[activeTab] || []).filter(r =>
    !search ||
    r.product.toLowerCase().includes(search.toLowerCase()) ||
    (r.origin||'').toLowerCase().includes(search.toLowerCase())
  );

  const fmtCatalog = (eurVal) => {
    if (!eurVal && eurVal !== 0) return '—';
    if (currency === 'EUR') return '€' + Number(eurVal).toFixed(2);
    return '$' + (eurVal / 0.92).toFixed(2);
  };

  /* ── Catalog chart data for active tab ── */
  const catHistory = CATALOG_HISTORY[activeTab] || { months: [], prices: [] };
  const histChartData = {
    labels: catHistory.months,
    datasets: [{
      label: `${activeTab} avg (EUR/kg)`,
      data: catHistory.prices,
      borderColor: '#6366F1',
      backgroundColor: '#6366F115',
      borderWidth: 2.5,
      pointRadius: 4,
      fill: true,
      tension: 0.4,
    }],
  };

  /* Linear forecast — 3 months ahead */
  const forecastPoints = () => {
    const p = catHistory.prices;
    if (p.length < 2) return [];
    const slope = (p[p.length-1] - p[p.length-2]);
    const last = p[p.length-1];
    return [last, last + slope, last + slope*2, last + slope*3];
  };
  const forecastChartData = {
    labels: ['Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Forecast (EUR/kg)',
      data: forecastPoints(),
      borderColor: '#10B981',
      backgroundColor: '#10B98115',
      borderWidth: 2,
      borderDash: [5, 4],
      pointRadius: 4,
      fill: false,
      tension: 0.3,
    }],
  };

  const miniChartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `€${Number(c.parsed.y).toFixed(2)}/kg` } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 10 } }, border: { display: false } },
      y: { grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { size: 10 }, callback: v => `€${v}` }, border: { display: false } },
    },
  };

  const isTop5 = activeTab === 'TOP 5';

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div className="page-title">Supplier Catalog</div>
            <div className="page-subtitle">CALCONUT 09/03/2026 · 24h prices · MOQ 3,000kg · {currency} display</div>
          </div>
          <button
            className="topbar-btn"
            onClick={() => setShowCharts(s => !s)}
            style={{ fontSize: 12, gap: 6 }}
          >
            {showCharts ? '🔼 Hide Charts' : '📈 Price History & Forecast'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12 }}>
        <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>📋</span>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:'#4338CA' }}>Fixed Supplier Data — CALCONUT Only</div>
          <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
            Live offer sheet from <strong>CALCONUT</strong> (09/03/2026). Prices valid 24h · MOQ 3,000 kg · FCA Alicante / Valencia.
          </div>
        </div>
      </div>

      {/* Price History & Forecast Charts panel */}
      {showCharts && (
        <div className="catalog-charts-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div className="card" style={{ padding:'18px 20px' }}>
            <div className="card-title" style={{ fontSize:13 }}>📊 {activeTab} — 6-Month Price History</div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:12 }}>CALCONUT offer price trend (EUR/kg)</div>
            <div style={{ height:180 }}>
              <Line data={histChartData} options={miniChartOpts} />
            </div>
            <div style={{ fontSize:10, color:'#9CA3AF', marginTop:8, fontStyle:'italic' }}>Based on CALCONUT historical offer data. Subject to market conditions.</div>
          </div>
          <div className="card" style={{ padding:'18px 20px' }}>
            <div className="card-title" style={{ fontSize:13 }}>🔮 {activeTab} — 3-Month Forecast</div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:12 }}>Linear trend projection (EUR/kg)</div>
            <div style={{ height:180 }}>
              <Line data={forecastChartData} options={miniChartOpts} />
            </div>
            <div style={{ fontSize:10, color:'#9CA3AF', marginTop:8, fontStyle:'italic' }}>Linear projection only. Not financial advice.</div>
          </div>
        </div>
      )}

      {/* CAROUSEL TABS */}
      <div className="carousel-tabs-wrap" style={{ margin:'0 14px', position:'relative' }}>
        <button className="carousel-btn left" onClick={() => scroll(-1)} title="Scroll left">‹</button>
        <div className="carousel-tabs-scroll" ref={tabsRef}>
          {CATALOG_TABS.map(t => (
            <button key={t} className={`table-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => { setActiveTab(t); setSearch(''); }}>
              {t === 'TOP 5' ? '⭐ TOP 5' : t}
              {t !== 'TOP 5' && (
                <span style={{ marginLeft:4, background: activeTab===t ? '#EEF2FF' : '#F3F4F6', color: activeTab===t ? '#6366F1' : '#9CA3AF', padding:'1px 5px', borderRadius:8, fontSize:10, fontWeight:700 }}>
                  {CATALOG_DATA[t]?.length || 0}
                </span>
              )}
            </button>
          ))}
        </div>
        <button className="carousel-btn right" onClick={() => scroll(1)} title="Scroll right">›</button>
      </div>

      <div className="card" style={{ borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:'none' }}>

        {/* ── TOP 5 special table view (Walnuts → Dried Papaya) ── */}
        {isTop5 ? (
          <>
            <div style={{ marginBottom:14, padding:'10px 14px', background:'#F0F2F8', borderRadius:10, fontSize:12, color:'#6B7280' }}>
              <strong>NICO Product List</strong> — Walnuts to Dried Papaya · CALCONUT 09/03/2026 prices vs EU market averages (Eurostat · WITS · ITC TradeMap · OEC)
            </div>
            <div className="table-scroll-wrap">
              <table className="data-table" style={{ minWidth:820 }}>
                <thead>
                  <tr>
                    <th style={{ minWidth:40 }}>#</th>
                    <th style={{ minWidth:160 }}>Product</th>
                    <th style={{ minWidth:160 }}>Origin</th>
                    <th style={{ minWidth:110 }}>CALCONUT Price</th>
                    <th style={{ minWidth:140 }}>EU Market Range (30d)</th>
                    <th style={{ minWidth:110 }}>EU Avg (30d)</th>
                    <th style={{ minWidth:60 }}>Trend</th>
                    <th style={{ minWidth:180 }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP5_NICO_DATA.map(r => {
                    const rankStyle = r.rank === 1
                      ? { background:'linear-gradient(135deg,#F59E0B,#EF4444)', color:'#fff' }
                      : r.rank === 2
                      ? { background:'linear-gradient(135deg,#6B7280,#9CA3AF)', color:'#fff' }
                      : r.rank === 3
                      ? { background:'linear-gradient(135deg,#92400E,#B45309)', color:'#fff' }
                      : { background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff' };
                    const lo = currency==='EUR' ? r.nicoRangeLow : r.nicoRangeLow/0.92;
                    const hi = currency==='EUR' ? r.nicoRangeHigh : r.nicoRangeHigh/0.92;
                    const avg = currency==='EUR' ? r.marketAvg : r.marketAvg/0.92;
                    const cp = r.calconutPrice ? (currency==='EUR' ? r.calconutPrice : r.calconutPrice/0.92) : null;
                    const sym = currency==='EUR' ? '€' : '$';
                    return (
                      <tr key={r.rank}>
                        <td>
                          <div style={{ width:28, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, flexShrink:0, ...rankStyle }}>
                            {r.rank}
                          </div>
                        </td>
                        <td><strong style={{ fontSize:13 }}>{r.product}</strong></td>
                        <td style={{ fontSize:12, color:'#6B7280' }}>{r.origin}</td>
                        <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#6366F1' }}>
                          {cp ? `${sym}${cp.toFixed(2)}` : <span style={{ color:'#D1D5DB' }}>—</span>}
                        </td>
                        <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
                          {sym}{lo.toFixed(2)} – {sym}{hi.toFixed(2)}
                        </td>
                        <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:'#10B981' }}>
                          {sym}{avg.toFixed(2)}
                        </td>
                        <td style={{ fontSize:18, textAlign:'center' }}>{r.trend}</td>
                        <td style={{ fontSize:11, color:'#9CA3AF' }}>{r.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #F3F4F6', display:'flex', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>📊 EU market ranges sourced from: Eurostat COMEXT · WITS WorldBank · ITC TradeMap · OEC</span>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>💱 Rate: 1 EUR = {(1/0.92).toFixed(4)} USD</span>
            </div>
          </>
        ) : (
          <>
            {/* Search + legend row */}
            <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                style={{ padding:'8px 14px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', width:220, minWidth:140, color:'#1A1D2E', background:'#FAFAFA', flex:'1 1 160px' }}
              />
              <span style={{ fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap' }}>{rows.length} item{rows.length!==1?'s':''}</span>
              <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:'#7C3AED', background:'#EDE9FE', padding:'3px 9px', borderRadius:6, fontWeight:600 }}>🟣 CALCONUT = live offer</span>
              </div>
            </div>

            {/* Scrollable table */}
            <div className="table-scroll-wrap">
              <table className="data-table" style={{ minWidth:780 }}>
                <thead>
                  <tr>
                    <th style={{ minWidth:180 }}>Product</th>
                    <th style={{ minWidth:90 }}>Origin</th>
                    <th style={{ minWidth:110 }}>Packaging</th>
                    <th style={{ minWidth:90 }}>Availability</th>
                    <th style={{ minWidth:80 }}>Price/kg</th>
                    <th style={{ minWidth:80 }}>Truck Load</th>
                    <th style={{ minWidth:80 }}>Stock Qty</th>
                    <th style={{ minWidth:80 }}>Source</th>
                    <th style={{ minWidth:160 }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign:'center', color:'#D1D5DB', padding:32 }}>No products found</td></tr>
                  )}
                  {rows.map((row, i) => {
                    const isCalconut = row.source === 'CALCONUT';
                    const isDiscount = !!row.normalPrice;
                    return (
                      <tr key={i} style={isDiscount ? { background:'#FFFBEB' } : {}}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{row.product}</div>
                          {isDiscount && (
                            <div style={{ fontSize:11, color:'#9CA3AF', textDecoration:'line-through' }}>
                              Was {fmtCatalog(row.normalPrice)}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize:12, color:'#6B7280', whiteSpace:'nowrap' }}>{row.origin}</td>
                        <td style={{ fontSize:11, color:'#9CA3AF', fontFamily:"'JetBrains Mono',monospace" }}>{row.packaging}</td>
                        <td>
                          <span className={`badge ${
                            row.availability === 'On stock' ? 'badge-green' :
                            row.availability === 'On request' || row.availability === 'Reference' ? 'badge-blue' :
                            'badge-yellow'}`}>
                            {row.availability}
                          </span>
                        </td>
                        <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:13,
                          color: isDiscount ? '#EF4444' : isCalconut ? '#6366F1' : '#E8A838', whiteSpace:'nowrap' }}>
                          {fmtCatalog(row.price)}
                        </td>
                        <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap' }}>
                          {row.fullTruckPrice ? fmtCatalog(row.fullTruckPrice) : '—'}
                        </td>
                        <td style={{ fontSize:12, color:'#6B7280', whiteSpace:'nowrap' }}>{row.qty}</td>
                        <td>
                          <span className={`badge ${isCalconut ? 'badge-purple' : 'badge-blue'}`}>
                            {row.source}
                          </span>
                        </td>
                        <td style={{ fontSize:11, color:'#9CA3AF' }}>{row.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer info */}
            <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #F3F4F6', display:'flex', gap:16, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>📌 <strong>MOQ:</strong> 3,000 kg · full pallets</span>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>🚚 <strong>Basis:</strong> FCA Alicante or FCA Valencia</span>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>⏰ <strong>CALCONUT prices valid 24h</strong> from 09/03/2026</span>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>💱 <strong>Rate:</strong> 1 EUR = {(1/0.92).toFixed(4)} USD</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NetherlandsSupplyCatalog({ currency }) {
  const [search, setSearch] = useState('');
  const [bannerVisible, setBannerVisible] = useState(true);

  const fmtCatalog = (eurVal) => {
    if (!eurVal && eurVal !== 0) return '—';
    if (currency === 'EUR') return '€' + Number(eurVal).toFixed(2);
    return '$' + (eurVal / 0.92).toFixed(2);
  };

  const rows = NETHERLANDS_SUPPLY_DATA.filter(r =>
    !search ||
    r.product.toLowerCase().includes(search.toLowerCase()) ||
    r.origin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div className="page-title">Netherlands Supply</div>
        <div className="page-subtitle">Netherlands wholesale list · 01–31/03/2026 · prices in EUR · {currency} display</div>
      </div>

      {bannerVisible && (
        <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12, position:'relative' }}>
          <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🇳🇱</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#4338CA' }}>Netherlands Supply — Fixed List</div>
            <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
              Wholesale list valid from <strong>01/03/2026</strong> to <strong>31/03/2026</strong>. Prices per kg / unit in EUR, converted to USD when USD is selected.
            </div>
          </div>
          <button onClick={() => setBannerVisible(false)} style={{ position:'absolute', top:8, right:10, background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF', lineHeight:1, padding:'2px 6px', borderRadius:4 }} title="Dismiss">×</button>
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search Netherlands supply..."
            style={{ padding:'8px 14px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', width:260, minWidth:160, color:'#1A1D2E', background:'#FAFAFA', flex:'1 1 180px' }}
          />
          <span style={{ fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap' }}>{rows.length} item{rows.length!==1?'s':''}</span>
        </div>

        <div className="table-scroll-wrap">
          <table className="data-table" style={{ minWidth:780 }}>
            <thead>
              <tr>
                <th style={{ minWidth:220 }}>Product</th>
                <th style={{ minWidth:110 }}>Packaging</th>
                <th style={{ minWidth:80 }}>Qty</th>
                <th style={{ minWidth:90 }}>Availability</th>
                <th style={{ minWidth:80 }}>Price/unit</th>
                <th style={{ minWidth:80 }}>Origin</th>
                <th style={{ minWidth:120 }}>Source</th>
                <th style={{ minWidth:200 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'#D1D5DB', padding:32 }}>No products found</td></tr>
              )}
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight:600, fontSize:13 }}>{row.product}</div>
                  </td>
                  <td style={{ fontSize:11, color:'#9CA3AF', fontFamily:"'JetBrains Mono',monospace" }}>{row.packaging}</td>
                  <td style={{ fontSize:12, color:'#6B7280', whiteSpace:'nowrap' }}>{row.qty}</td>
                  <td>
                    <span className="badge badge-blue">{row.availability}</span>
                  </td>
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:13, color:'#6366F1' }}>
                    {fmtCatalog(row.price)}
                  </td>
                  <td style={{ fontSize:12, color:'#6B7280' }}>{row.origin}</td>
                  <td>
                    <span className="badge badge-purple">{row.source}</span>
                  </td>
                  <td style={{ fontSize:11, color:'#9CA3AF' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   TOP 5 CATALOG COMPONENT
   20 categories from NICO product list docx
   Top 5 products per category with EU wholesale price ranges
══════════════════════════════════════════════════════════════════ */

const TOP5_CATEGORIES = [
  'Walnuts','Almonds','Pistachios','Pecans','Brazil Nuts',
  'Hazelnuts','Cashews','Figs','Apricots','Prunes',
  'Medjool Dates','Raisins','Macadamia Nuts','Pine Nuts','Dried Mango',
  'Dried Cranberries','Dried Blueberries','Dried Banana Chips','Dried Apple','Dried Papaya'
];

const TOP5_DATA = {
  'Walnuts': {
    priceRange: '€6.00 – €9.00', volatility: 'Low-medium',
    items: [
      { rank:1, product:'Walnuts Halves Extra Light', origin:'Chile', type:'Kernel', grade:'Halves',         priceRange:'€7.50 – €9.00', note:'Premium retail grade' },
      { rank:2, product:'Walnuts Halves & Pieces Light', origin:'USA', type:'Kernel', grade:'H/P mix',      priceRange:'€6.50 – €8.50', note:'Bakery & industrial' },
      { rank:3, product:'Walnuts Amber Halves', origin:'Chile', type:'Kernel', grade:'Halves',              priceRange:'€6.00 – €8.00', note:'Standard commodity' },
      { rank:4, product:'Walnuts Pieces 4–8mm', origin:'Chile', type:'Pieces', grade:'Industrial',         priceRange:'€5.00 – €6.50', note:'Food processing use' },
      { rank:5, product:'Walnuts Organic Halves – HM', origin:'USA', type:'Kernel', grade:'Premium',       priceRange:'€9.00 – €12.00', note:'High-margin specialty' },
    ]
  },
  'Almonds': {
    priceRange: '€6.00 – €12.00', volatility: 'Low-medium',
    items: [
      { rank:1, product:'Almonds Nonpareil Natural', origin:'USA', type:'Raw', grade:'23/25',               priceRange:'€6.00 – €8.00', note:'#1 EU import volume' },
      { rank:2, product:'Almonds Blanched Whole', origin:'USA', type:'Blanched', grade:'25/27',             priceRange:'€7.50 – €10.00', note:'Processing premium' },
      { rank:3, product:'Almonds Natural Supreme', origin:'USA', type:'Raw', grade:'27/30',                 priceRange:'€6.50 – €8.50', note:'Retail snack grade' },
      { rank:4, product:'Almonds Slivered', origin:'USA', type:'Cut', grade:'n/a',                         priceRange:'€8.00 – €11.00', note:'Bakery ingredient' },
      { rank:5, product:'Almonds Diced 4–6mm', origin:'USA', type:'Pieces', grade:'Industrial',            priceRange:'€7.00 – €9.00', note:'Confectionery use' },
    ]
  },
  'Pistachios': {
    priceRange: '€8.00 – €30.00', volatility: 'Medium',
    items: [
      { rank:1, product:'Pistachios Roasted & Salted', origin:'USA', type:'In shell', grade:'21/25',        priceRange:'€8.00 – €12.00', note:'Retail snack driver' },
      { rank:2, product:'Pistachios Raw In Shell', origin:'USA', type:'Natural', grade:'25/27',             priceRange:'€8.00 – €11.00', note:'High EU demand' },
      { rank:3, product:'Pistachios Roasted Unsalted', origin:'USA', type:'In shell', grade:'23/25',        priceRange:'€8.50 – €12.00', note:'Health snack segment' },
      { rank:4, product:'Pistachio Green Kernels – HM', origin:'Iran', type:'Kernel', grade:'S',            priceRange:'€18.00 – €28.00', note:'High-margin specialty' },
      { rank:5, product:'Pistachio Blanched Kernels – HM', origin:'Iran', type:'Kernel', grade:'S',         priceRange:'€20.00 – €30.00', note:'Confectionery premium' },
    ]
  },
  'Pecans': {
    priceRange: '€12.00 – €18.00', volatility: 'Medium',
    items: [
      { rank:1, product:'Pecan Halves Fancy – HM', origin:'USA', type:'Halves', grade:'Large',             priceRange:'€14.00 – €18.00', note:'Premium retail' },
      { rank:2, product:'Pecan Mammoth Halves – HM', origin:'USA', type:'Halves', grade:'Premium',         priceRange:'€15.00 – €18.00', note:'Top HM segment' },
      { rank:3, product:'Pecan Halves & Pieces', origin:'USA', type:'Mix', grade:'Bakery',                 priceRange:'€12.00 – €15.00', note:'Bakery use' },
      { rank:4, product:'Pecan Medium Pieces', origin:'Mexico', type:'Pieces', grade:'Standard',           priceRange:'€10.00 – €13.00', note:'Industrial grade' },
      { rank:5, product:'Pecan Granules', origin:'Mexico', type:'Pieces', grade:'Industrial',              priceRange:'€8.00 – €11.00', note:'Food processing' },
    ]
  },
  'Brazil Nuts': {
    priceRange: '€8.00 – €13.00', volatility: 'High',
    items: [
      { rank:1, product:'Brazil Nuts In Shell', origin:'Bolivia', type:'Whole', grade:'Large',             priceRange:'€4.00 – €6.00', note:'Seasonal demand' },
      { rank:2, product:'Brazil Nuts Kernels Medium – HM', origin:'Bolivia', type:'Kernel', grade:'Medium',priceRange:'€9.00 – €13.00', note:'Premium retail grade' },
      { rank:3, product:'Brazil Nuts Broken Kernels', origin:'Bolivia', type:'Pieces', grade:'Industrial', priceRange:'€7.00 – €9.00', note:'Industrial use' },
      { rank:4, product:'Brazil Nuts Vacuum Packed – HM', origin:'Peru', type:'Kernel', grade:'Premium',   priceRange:'€10.00 – €14.00', note:'Extended shelf life' },
      { rank:5, product:'Brazil Nuts Organic Kernels – HM', origin:'Bolivia', type:'Kernel', grade:'Premium',priceRange:'€12.00 – €17.00', note:'High-margin organic' },
    ]
  },
  'Hazelnuts': {
    priceRange: '€7.00 – €14.00', volatility: 'Medium',
    items: [
      { rank:1, product:'Hazelnuts Natural', origin:'Turkey', type:'Kernel', grade:'11–13mm',              priceRange:'€7.00 – €11.00', note:'Chocolate industry core' },
      { rank:2, product:'Hazelnuts Blanched – HM', origin:'Turkey', type:'Kernel', grade:'11–13mm',        priceRange:'€9.00 – €14.00', note:'Processing margin' },
      { rank:3, product:'Hazelnuts Roasted', origin:'Turkey', type:'Kernel', grade:'9–11mm',               priceRange:'€8.00 – €12.00', note:'Snack segment' },
      { rank:4, product:'Hazelnuts Diced 2–4mm', origin:'Turkey', type:'Pieces', grade:'Industrial',       priceRange:'€7.50 – €10.00', note:'Confectionery use' },
      { rank:5, product:'Hazelnut Meal / Flour – HM', origin:'Turkey', type:'Powder', grade:'Industrial',  priceRange:'€8.00 – €11.00', note:'Pastry & bakery' },
    ]
  },
  'Cashews': {
    priceRange: '€7.00 – €13.00', volatility: 'Medium',
    items: [
      { rank:1, product:'Cashew WW320', origin:'Vietnam', type:'Whole White', grade:'320',                 priceRange:'€7.00 – €10.00', note:'Most traded grade' },
      { rank:2, product:'Cashew WW240 – HM', origin:'Vietnam', type:'Premium', grade:'240',               priceRange:'€9.00 – €13.00', note:'Premium grade' },
      { rank:3, product:'Cashew WW450', origin:'India', type:'Economy', grade:'450',                      priceRange:'€6.00 – €8.50', note:'Economy volume' },
      { rank:4, product:'Cashew SW320', origin:'Vietnam', type:'Scorched', grade:'320',                   priceRange:'€6.50 – €9.00', note:'Industrial use' },
      { rank:5, product:'Cashew LP (Large Pieces)', origin:'Vietnam', type:'Pieces', grade:'LP',          priceRange:'€5.50 – €7.50', note:'Bakery ingredient' },
    ]
  },
  'Figs': {
    priceRange: '€5.00 – €8.00', volatility: 'Low',
    items: [
      { rank:1, product:'Figs Lerida – HM', origin:'Turkey', type:'Whole', grade:'200–220',               priceRange:'€6.00 – €8.00', note:'Mediterranean demand' },
      { rank:2, product:'Figs Protoben Pressed', origin:'Turkey', type:'Pressed', grade:'250',             priceRange:'€5.00 – €7.00', note:'Retail format' },
      { rank:3, product:'Figs Natural Whole', origin:'Iran', type:'Whole', grade:'180',                   priceRange:'€5.00 – €7.00', note:'Standard grade' },
      { rank:4, product:'Figs Industrial Pieces', origin:'Turkey', type:'Pieces', grade:'Industrial',     priceRange:'€4.00 – €5.50', note:'Food processing' },
      { rank:5, product:'Figs Organic Whole – HM', origin:'Turkey', type:'Whole', grade:'Premium',        priceRange:'€8.00 – €12.00', note:'High-margin organic' },
    ]
  },
  'Apricots': {
    priceRange: '€4.00 – €7.00', volatility: 'Low',
    items: [
      { rank:1, product:'Apricots Natural No.2 – HM', origin:'Turkey', type:'Natural', grade:'Medium',    priceRange:'€4.50 – €6.50', note:'Core bakery ingredient' },
      { rank:2, product:'Apricots Sulphured No.4', origin:'Turkey', type:'Standard', grade:'Medium',      priceRange:'€4.00 – €6.00', note:'Standard commodity' },
      { rank:3, product:'Apricots Jumbo Natural – HM', origin:'Turkey', type:'Premium', grade:'Large',    priceRange:'€5.50 – €7.50', note:'Premium retail' },
      { rank:4, product:'Apricots Diced 5–8mm', origin:'Turkey', type:'Pieces', grade:'Industrial',      priceRange:'€4.00 – €5.50', note:'Confectionery use' },
      { rank:5, product:'Apricots Organic Natural – HM', origin:'Turkey', type:'Premium', grade:'Large',  priceRange:'€7.00 – €10.00', note:'High-margin organic' },
    ]
  },
  'Prunes': {
    priceRange: '€3.50 – €6.00', volatility: 'Low',
    items: [
      { rank:1, product:'Prunes Pitted 30/40', origin:'USA', type:'Whole', grade:'30/40',                 priceRange:'€4.50 – €6.00', note:'Retail snack grade' },
      { rank:2, product:'Prunes Pitted 40/50', origin:'USA', type:'Whole', grade:'40/50',                 priceRange:'€4.00 – €5.50', note:'Standard retail' },
      { rank:3, product:'Prunes Pitted 50/60', origin:'Chile', type:'Whole', grade:'50/60',               priceRange:'€3.50 – €4.50', note:'Economy grade' },
      { rank:4, product:'Prunes Diced', origin:'Chile', type:'Pieces', grade:'Industrial',                priceRange:'€3.00 – €4.00', note:'Bakery use' },
      { rank:5, product:'Prunes Organic Whole – HM', origin:'France', type:'Premium', grade:'Large',      priceRange:'€7.00 – €10.00', note:'Premium organic HM' },
    ]
  },
  'Medjool Dates': {
    priceRange: '€7.00 – €12.00', volatility: 'Low',
    items: [
      { rank:1, product:'Medjool Jumbo – HM', origin:'Israel', type:'Premium', grade:'16–18',             priceRange:'€10.00 – €14.00', note:'Premium retail' },
      { rank:2, product:'Medjool Large – HM', origin:'Israel', type:'Premium', grade:'18–22',             priceRange:'€8.00 – €12.00', note:'Horeca & retail' },
      { rank:3, product:'Medjool Medium', origin:'Israel', type:'Standard', grade:'22–24',                priceRange:'€7.00 – €10.00', note:'Standard commodity' },
      { rank:4, product:'Medjool Industrial Pieces', origin:'Jordan', type:'Pieces', grade:'Industrial',  priceRange:'€5.00 – €7.00', note:'Food processing' },
      { rank:5, product:'Medjool Organic – HM', origin:'Israel', type:'Premium', grade:'Large',           priceRange:'€12.00 – €18.00', note:'High-margin organic' },
    ]
  },
  'Raisins': {
    priceRange: '€2.50 – €4.50', volatility: 'Low',
    items: [
      { rank:1, product:'Sultanas Golden Jumbo', origin:'Turkey', type:'Premium', grade:'Jumbo',          priceRange:'€3.00 – €4.50', note:'Premium retail grade' },
      { rank:2, product:'Sultanas Standard Brown', origin:'Turkey', type:'Natural', grade:'Medium',       priceRange:'€2.50 – €3.50', note:'High-volume commodity' },
      { rank:3, product:'Raisins Thompson Seedless', origin:'USA', type:'Natural', grade:'Medium',        priceRange:'€3.00 – €4.00', note:'Bakery ingredient' },
      { rank:4, product:'Raisins Jumbo Premium – HM', origin:'Chile', type:'Premium', grade:'Large',      priceRange:'€3.50 – €5.00', note:'Premium segment' },
      { rank:5, product:'Raisins Industrial Bakery', origin:'Turkey', type:'Small', grade:'Industrial',   priceRange:'€2.00 – €3.00', note:'Low-cost bakery' },
    ]
  },
  'Macadamia Nuts': {
    priceRange: '€14.00 – €22.00', volatility: 'High',
    items: [
      { rank:1, product:'Macadamia Style 1 Whole – HM', origin:'South Africa', type:'Kernel', grade:'Premium',priceRange:'€16.00 – €20.00', note:'Premium retail' },
      { rank:2, product:'Macadamia Style 2 Whole – HM', origin:'Australia', type:'Kernel', grade:'Premium', priceRange:'€17.00 – €22.00', note:'Top export grade' },
      { rank:3, product:'Macadamia Style 4 Halves – HM', origin:'South Africa', type:'Kernel', grade:'Halves',priceRange:'€14.00 – €18.00', note:'Snack & bakery' },
      { rank:4, product:'Macadamia Pieces', origin:'Kenya', type:'Pieces', grade:'Industrial',             priceRange:'€12.00 – €15.00', note:'Industrial use' },
      { rank:5, product:'Macadamia Roasted Salted – HM', origin:'Australia', type:'Snack', grade:'Whole',  priceRange:'€18.00 – €24.00', note:'High-margin snack' },
    ]
  },
  'Pine Nuts': {
    priceRange: '€25.00 – €45.00', volatility: 'Very high',
    items: [
      { rank:1, product:'Pine Nuts Chinese Grade A – HM', origin:'China', type:'Kernel', grade:'Premium',  priceRange:'€25.00 – €35.00', note:'#1 volume grade' },
      { rank:2, product:'Pine Nuts Siberian – HM', origin:'Russia', type:'Kernel', grade:'Premium',        priceRange:'€30.00 – €45.00', note:'Premium flavor' },
      { rank:3, product:'Pine Nuts Pakistani – HM', origin:'Pakistan', type:'Kernel', grade:'Premium',     priceRange:'€28.00 – €40.00', note:'Pesto & gourmet' },
      { rank:4, product:'Pine Nuts Industrial Pieces', origin:'China', type:'Pieces', grade:'Industrial',  priceRange:'€20.00 – €28.00', note:'Food processing' },
      { rank:5, product:'Pine Nuts Organic – HM', origin:'China', type:'Kernel', grade:'Premium',          priceRange:'€35.00 – €50.00', note:'Organic premium' },
    ]
  },
  'Dried Mango': {
    priceRange: '€6.00 – €11.00', volatility: 'Low',
    items: [
      { rank:1, product:'Mango Natural Strips – HM', origin:'Burkina Faso', type:'Natural', grade:'Large', priceRange:'€7.00 – €11.00', note:'Natural premium' },
      { rank:2, product:'Mango Sweetened', origin:'Thailand', type:'Processed', grade:'Standard',          priceRange:'€5.00 – €7.00', note:'Standard retail' },
      { rank:3, product:'Mango Chunks', origin:'Vietnam', type:'Pieces', grade:'Medium',                   priceRange:'€5.50 – €7.50', note:'Bakery & snack' },
      { rank:4, product:'Mango Organic – HM', origin:'Peru', type:'Natural', grade:'Premium',              priceRange:'€9.00 – €13.00', note:'Organic HM' },
      { rank:5, product:'Mango Industrial Pieces', origin:'Thailand', type:'Pieces', grade:'Industrial',   priceRange:'€4.00 – €6.00', note:'Processing use' },
    ]
  },
  'Dried Cranberries': {
    priceRange: '€5.00 – €8.00', volatility: 'Low',
    items: [
      { rank:1, product:'Cranberries Sweetened Sliced', origin:'USA', type:'Standard', grade:'Medium',     priceRange:'€5.00 – €7.00', note:'Bakery industry core' },
      { rank:2, product:'Cranberries Whole Sweetened', origin:'USA', type:'Premium', grade:'Large',        priceRange:'€6.00 – €8.00', note:'Retail premium' },
      { rank:3, product:'Cranberries Apple Juice – HM', origin:'Canada', type:'Premium', grade:'Medium',   priceRange:'€7.00 – €10.00', note:'Reduced sugar trend' },
      { rank:4, product:'Cranberries Reduced Sugar – HM', origin:'USA', type:'Premium', grade:'Medium',    priceRange:'€7.00 – €9.50', note:'Health segment' },
      { rank:5, product:'Cranberries Industrial', origin:'USA', type:'Bakery', grade:'Small',              priceRange:'€4.00 – €5.50', note:'Low-cost bakery' },
    ]
  },
  'Dried Blueberries': {
    priceRange: '€8.00 – €16.00', volatility: 'Low',
    items: [
      { rank:1, product:'Blueberries Sweetened – HM', origin:'USA', type:'Premium', grade:'Whole',         priceRange:'€8.00 – €12.00', note:'Retail premium' },
      { rank:2, product:'Blueberries Infused – HM', origin:'Canada', type:'Premium', grade:'Whole',        priceRange:'€9.00 – €13.00', note:'Juice-infused format' },
      { rank:3, product:'Blueberries Organic – HM', origin:'USA', type:'Premium', grade:'Whole',           priceRange:'€12.00 – €18.00', note:'High-margin organic' },
      { rank:4, product:'Blueberries Industrial', origin:'USA', type:'Pieces', grade:'Small',              priceRange:'€6.00 – €9.00', note:'Bakery use' },
      { rank:5, product:'Blueberries Bakery Grade', origin:'USA', type:'Pieces', grade:'Small',            priceRange:'€5.50 – €8.00', note:'Confectionery' },
    ]
  },
  'Dried Banana Chips': {
    priceRange: '€3.00 – €5.00', volatility: 'Low',
    items: [
      { rank:1, product:'Banana Chips Sweetened', origin:'Philippines', type:'Chips', grade:'Standard',    priceRange:'€3.00 – €4.50', note:'High-volume snack' },
      { rank:2, product:'Banana Chips Unsweetened – HM', origin:'Philippines', type:'Chips', grade:'Premium',priceRange:'€3.50 – €5.00', note:'Health segment' },
      { rank:3, product:'Banana Chips Organic – HM', origin:'Philippines', type:'Chips', grade:'Premium',  priceRange:'€4.50 – €6.50', note:'Organic premium' },
      { rank:4, product:'Banana Chips Industrial', origin:'Vietnam', type:'Pieces', grade:'Small',         priceRange:'€2.50 – €3.50', note:'Cereal/bakery use' },
      { rank:5, product:'Banana Chips Roasted Coconut Oil', origin:'Philippines', type:'Chips', grade:'Premium',priceRange:'€4.00 – €6.00', note:'Premium snack' },
    ]
  },
  'Dried Apple': {
    priceRange: '€4.00 – €8.00', volatility: 'Low',
    items: [
      { rank:1, product:'Apple Rings', origin:'Turkey', type:'Whole', grade:'Large',                       priceRange:'€5.00 – €8.00', note:'Retail snack format' },
      { rank:2, product:'Apple Diced', origin:'Poland', type:'Pieces', grade:'10mm',                       priceRange:'€4.00 – €6.00', note:'Bakery ingredient' },
      { rank:3, product:'Apple Organic – HM', origin:'Turkey', type:'Premium', grade:'Whole',              priceRange:'€7.00 – €11.00', note:'Organic premium' },
      { rank:4, product:'Apple Slices', origin:'China', type:'Standard', grade:'Medium',                   priceRange:'€3.50 – €5.50', note:'Standard grade' },
      { rank:5, product:'Apple Industrial', origin:'China', type:'Pieces', grade:'Small',                  priceRange:'€3.00 – €4.50', note:'Industrial use' },
    ]
  },
  'Dried Papaya': {
    priceRange: '€3.50 – €6.00', volatility: 'Low',
    items: [
      { rank:1, product:'Papaya Sweetened Cubes', origin:'Thailand', type:'Pieces', grade:'Standard',      priceRange:'€3.50 – €5.00', note:'High-volume snack mix' },
      { rank:2, product:'Papaya Natural – HM', origin:'Sri Lanka', type:'Natural', grade:'Premium',        priceRange:'€5.00 – €7.00', note:'Natural premium' },
      { rank:3, product:'Papaya Organic – HM', origin:'Sri Lanka', type:'Premium', grade:'Medium',         priceRange:'€6.00 – €9.00', note:'Organic HM' },
      { rank:4, product:'Papaya Chunks', origin:'Thailand', type:'Pieces', grade:'Large',                  priceRange:'€4.00 – €5.50', note:'Tropical mix use' },
      { rank:5, product:'Papaya Industrial', origin:'Thailand', type:'Pieces', grade:'Small',              priceRange:'€3.00 – €4.00', note:'Food processing' },
    ]
  },
};

/* Volatility badge color */
function volatilityBadge(v) {
  if (!v) return 'badge-blue';
  if (v.includes('Very')) return 'badge-red';
  if (v.includes('High')) return 'badge-yellow';
  if (v.includes('Medium')) return 'badge-blue';
  return 'badge-green';
}

function Top5Catalog({ currency }) {
  const [activeTab, setActiveTab] = useState('Walnuts');
  const [search, setSearch] = useState('');
  const [bannerVisible, setBannerVisible] = useState(true);
  const tabsRef = React.useRef(null);

  const scroll = (dir) => {
    if (tabsRef.current) tabsRef.current.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  const fmtRange = (rangeStr) => {
    if (!rangeStr) return '—';
    if (currency === 'USD') {
      return rangeStr.replace(/€([\d.]+)/g, (_, v) => '$' + (parseFloat(v) / 0.92).toFixed(2));
    }
    return rangeStr;
  };

  const catData = TOP5_DATA[activeTab] || { items: [], priceRange: '—', volatility: '—' };
  const rows = catData.items.filter(r =>
    !search ||
    r.product.toLowerCase().includes(search.toLowerCase()) ||
    r.origin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div className="page-title">⭐ TOP 5 Products</div>
        <div className="page-subtitle">20 categories · NICO product list · EU wholesale benchmarks · {currency} display</div>
      </div>

      {/* Info banner — dismissible */}
      {bannerVisible && (
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12, position:'relative' }}>
          <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>⭐</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#92400E' }}>NICO Product List — Top 5 per Category</div>
            <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
              20 categories · Walnuts to Dried Papaya · EU wholesale price ranges (Benelux/Germany/France) · HM = High Margin product
            </div>
          </div>
          <button onClick={() => setBannerVisible(false)} style={{ position:'absolute', top:8, right:10, background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF', lineHeight:1, padding:'2px 6px', borderRadius:4 }} title="Dismiss">×</button>
        </div>
      )}

      {/* CAROUSEL TABS */}
      <div className="carousel-tabs-wrap" style={{ margin:'0 14px', position:'relative' }}>
        <button className="carousel-btn left" onClick={() => scroll(-1)}>‹</button>
        <div className="carousel-tabs-scroll" ref={tabsRef}>
          {TOP5_CATEGORIES.map(t => (
            <button key={t} className={`table-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => { setActiveTab(t); setSearch(''); }}>
              {t}
              <span style={{ marginLeft:4, background: activeTab===t ? '#EEF2FF' : '#F3F4F6', color: activeTab===t ? '#6366F1' : '#9CA3AF', padding:'1px 5px', borderRadius:8, fontSize:10, fontWeight:700 }}>5</span>
            </button>
          ))}
        </div>
        <button className="carousel-btn right" onClick={() => scroll(1)}>›</button>
      </div>

      <div className="card" style={{ borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:'none' }}>

        {/* Category header row */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:14 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'#1A1D2E' }}>{activeTab}</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>
              EU wholesale range: <strong style={{ color:'#6366F1' }}>{fmtRange(catData.priceRange)}</strong>
              {' '}·{' '}
              <span className={`badge ${volatilityBadge(catData.volatility)}`} style={{ fontSize:10 }}>
                {catData.volatility} volatility
              </span>
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              style={{ padding:'7px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', minWidth:160, color:'#1A1D2E', background:'#FAFAFA' }}
            />
            <span style={{ fontSize:11, color:'#9CA3AF', whiteSpace:'nowrap' }}>{rows.length} items</span>
          </div>
        </div>

        <div className="table-scroll-wrap">
          <table className="data-table" style={{ minWidth:700 }}>
            <thead>
              <tr>
                <th style={{ minWidth:40, textAlign:'center' }}>Rank</th>
                <th style={{ minWidth:220 }}>Product</th>
                <th style={{ minWidth:100 }}>Origin</th>
                <th style={{ minWidth:90 }}>Type / Process</th>
                <th style={{ minWidth:90 }}>Grade / Size</th>
                <th style={{ minWidth:130 }}>EU Wholesale Range</th>
                <th style={{ minWidth:160 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#D1D5DB', padding:32 }}>No products found</td></tr>
              )}
              {rows.map((row) => {
                const rankColors = ['#F59E0B','#9CA3AF','#B45309','#6366F1','#6366F1'];
                return (
                  <tr key={row.rank}>
                    <td style={{ textAlign:'center' }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:rankColors[row.rank-1], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, margin:'0 auto' }}>
                        {row.rank}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{row.product}</div>
                      {row.product.includes('– HM') && (
                        <div style={{ fontSize:10, color:'#7C3AED', marginTop:2, fontWeight:600 }}>⬆ High Margin</div>
                      )}
                    </td>
                    <td style={{ fontSize:12, color:'#6B7280' }}>{row.origin}</td>
                    <td style={{ fontSize:12, color:'#6B7280' }}>{row.type}</td>
                    <td>
                      <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", background:'#F3F4F6', padding:'2px 7px', borderRadius:5, fontWeight:600 }}>
                        {row.grade}
                      </span>
                    </td>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#6366F1', fontSize:12 }}>
                      {fmtRange(row.priceRange)}
                    </td>
                    <td style={{ fontSize:11, color:'#9CA3AF' }}>{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #F3F4F6', display:'flex', gap:16, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'#9CA3AF' }}>📊 Price ranges: EU bulk wholesale (10–25kg cartons/pallets) · Benelux/Germany/France</span>
          <span style={{ fontSize:11, color:'#9CA3AF' }}>⬆ HM = High Margin specialty product</span>
          <span style={{ fontSize:11, color:'#9CA3AF' }}>💱 Rate: 1 EUR = {(1/0.92).toFixed(4)} USD</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   WEATHER FORECAST COMPONENT
   - Leaflet world map with live temperature markers (Open-Meteo API)
   - Comparison chart: 🟠 temperature forecast vs 🟢 dry fruit prices
   - Countries: USA, Chile, Pakistan, India, South Africa, Cambodia,
     Vietnam, Australia, Argentina, Iran, Jordan, Egypt
══════════════════════════════════════════════════════════════════ */

const WEATHER_COUNTRIES = [
  { id:'usa',          label:'USA (California)',  flag:'🇺🇸', lat:36.78,  lon:-119.42, products:['almond','walnut','pistachio','raisin'] },
  { id:'chile',        label:'Chile',             flag:'🇨🇱', lat:-30.00, lon:-71.20,  products:['walnut','raisin'] },
  { id:'pakistan',     label:'Pakistan',          flag:'🇵🇰', lat:30.38,  lon:69.35,   products:['date','dried_apricot'] },
  { id:'india',        label:'India',             flag:'🇮🇳', lat:20.59,  lon:78.96,   products:['cashew','dried_fig'] },
  { id:'south_africa', label:'South Africa',      flag:'🇿🇦', lat:-28.48, lon:24.67,   products:['raisin','dried_apricot'] },
  { id:'cambodia',     label:'Cambodia',          flag:'🇰🇭', lat:12.57,  lon:104.99,  products:['cashew'] },
  { id:'vietnam',      label:'Vietnam',           flag:'🇻🇳', lat:14.06,  lon:108.28,  products:['cashew'] },
  { id:'australia',    label:'Australia',         flag:'🇦🇺', lat:-25.27, lon:133.78,  products:['almond','walnut'] },
  { id:'argentina',    label:'Argentina',         flag:'🇦🇷', lat:-34.00, lon:-64.00,  products:['walnut','raisin'] },
  { id:'iran',         label:'Iran',              flag:'🇮🇷', lat:32.43,  lon:53.69,   products:['pistachio','dried_fig','date'] },
  { id:'jordan',       label:'Jordan',            flag:'🇯🇴', lat:30.59,  lon:36.24,   products:['date','dried_fig'] },
  { id:'egypt',        label:'Egypt',             flag:'🇪🇬', lat:26.82,  lon:30.80,   products:['date','dried_apricot'] },
];

/* Realistic seasonal dry-fruit price data per country (EUR/kg, last 6 months) */
const COUNTRY_PRICE_DATA = {
  usa:          { product:'Almonds',    base:6.50, seasonal:[6.20,6.30,6.45,6.50,6.55,6.60], forecast:[6.62,6.68,6.72,6.75,6.70,6.65] },
  chile:        { product:'Walnuts',    base:5.10, seasonal:[4.90,4.95,5.00,5.10,5.15,5.20], forecast:[5.22,5.25,5.28,5.30,5.27,5.24] },
  pakistan:     { product:'Dates',      base:5.20, seasonal:[5.00,5.05,5.10,5.20,5.25,5.30], forecast:[5.32,5.35,5.38,5.40,5.38,5.35] },
  india:        { product:'Cashews',    base:6.20, seasonal:[5.90,6.00,6.10,6.20,6.25,6.30], forecast:[6.32,6.38,6.42,6.45,6.40,6.35] },
  south_africa: { product:'Raisins',    base:2.35, seasonal:[2.10,2.15,2.20,2.25,2.30,2.35], forecast:[2.38,2.40,2.42,2.45,2.43,2.40] },
  cambodia:     { product:'Cashews',    base:5.80, seasonal:[5.60,5.65,5.70,5.78,5.82,5.85], forecast:[5.87,5.90,5.92,5.95,5.92,5.88] },
  vietnam:      { product:'Cashews',    base:6.40, seasonal:[6.10,6.20,6.28,6.35,6.40,6.48], forecast:[6.50,6.55,6.58,6.60,6.55,6.50] },
  australia:    { product:'Almonds',    base:6.30, seasonal:[6.00,6.05,6.15,6.22,6.28,6.35], forecast:[6.38,6.42,6.45,6.48,6.44,6.40] },
  argentina:    { product:'Walnuts',    base:5.00, seasonal:[4.80,4.85,4.90,4.95,5.00,5.05], forecast:[5.08,5.12,5.15,5.18,5.15,5.10] },
  iran:         { product:'Pistachios', base:9.80, seasonal:[9.40,9.50,9.60,9.70,9.80,9.90], forecast:[9.92,9.95,9.98,10.02,9.98,9.94] },
  jordan:       { product:'Dates',      base:5.10, seasonal:[4.90,4.95,5.00,5.05,5.10,5.15], forecast:[5.18,5.20,5.22,5.25,5.22,5.18] },
  egypt:        { product:'Dates',      base:5.00, seasonal:[4.80,4.85,4.90,4.95,5.00,5.05], forecast:[5.08,5.10,5.12,5.15,5.12,5.08] },
};

/* Temperature color helper */
function tempColor(c) {
  if (c >= 35) return '#DC2626';
  if (c >= 25) return '#F97316';
  if (c >= 15) return '#EAB308';
  if (c >= 5)  return '#22C55E';
  if (c >= -5) return '#3B82F6';
  return '#8B5CF6';
}
function tempClass(c) {
  if (c >= 30) return 'temp-hot';
  if (c >= 18) return 'temp-warm';
  if (c >= 5)  return 'temp-cool';
  return 'temp-cold';
}

function WeatherForecast({ currency }) {
  const [selectedCountry, setSelectedCountry] = useState('usa');
  const [period, setPeriod] = useState('3m');
  const [weatherData, setWeatherData] = useState({});
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [infoVisible, setInfoVisible] = useState(true);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const sym = currency === 'EUR' ? '€' : '$';
  const country = WEATHER_COUNTRIES.find(c => c.id === selectedCountry) || WEATHER_COUNTRIES[0];

  /* ── Load Leaflet ── */
  useEffect(() => {
    if (window.L) { setMapReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  /* ── Fetch temperature from Open-Meteo (free, no key, updates daily) ── */
  const fetchWeather = useCallback(async (countries) => {
    setLoadingWeather(true);
    const results = {};
    await Promise.all(countries.map(async (c) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=92&past_days=180`;
        const res = await fetch(url);
        const d = await res.json();
        if (d.daily) {
          const dates = d.daily.time;
          const maxT = d.daily.temperature_2m_max;
          const minT = d.daily.temperature_2m_min;
          const avgT = maxT.map((v, i) => (v != null && minT[i] != null) ? Math.round((v + minT[i]) / 2 * 100) / 100 : null);
          const todayStr = new Date().toISOString().slice(0, 10);
          const todayIdx = dates.findIndex(dt => dt >= todayStr);
          const current = todayIdx >= 0 ? (avgT[todayIdx] ?? avgT[todayIdx - 1] ?? 20) : (avgT[avgT.length - 1] ?? 20);
          results[c.id] = { dates, temps: avgT, current, todayIdx: todayIdx >= 0 ? todayIdx : Math.floor(dates.length * 0.66) };
        }
      } catch(e) {}
    }));
    setWeatherData(results);
    setLoadingWeather(false);
  }, []);

  /* Fetch on mount and every 24 hours */
  useEffect(() => {
    fetchWeather(WEATHER_COUNTRIES);
    const interval = setInterval(() => fetchWeather(WEATHER_COUNTRIES), 24 * 3600 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  /* ── Init Leaflet map ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || leafletMapRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [20, 15], zoom: 2, minZoom: 1, maxZoom: 5, scrollWheelZoom: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20,
    }).addTo(map);
    leafletMapRef.current = map;
    WEATHER_COUNTRIES.forEach(c => {
      const div = document.createElement('div');
      div.className = 'map-temp-marker';
      div.style.background = '#6366F1';
      div.innerHTML = '...';
      const icon = L.divIcon({ html: div, className: '', iconSize: [44, 44], iconAnchor: [22, 22] });
      const marker = L.marker([c.lat, c.lon], { icon }).addTo(map)
        .bindTooltip(`<strong>${c.flag} ${c.label}</strong><br/>Loading...`, { permanent: false, direction: 'top', className: 'leaflet-weather-tooltip' });
      marker.on('click', () => setSelectedCountry(c.id));
      markersRef.current[c.id] = { marker, div };
    });
    return () => { if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; } };
  }, [mapReady]);

  /* ── Update markers when weather loads ── */
  useEffect(() => {
    WEATHER_COUNTRIES.forEach(c => {
      const ref = markersRef.current[c.id];
      if (!ref) return;
      const wd = weatherData[c.id];
      const temp = wd ? wd.current : null;
      const col = temp != null ? tempColor(temp) : '#6366F1';
      ref.div.style.background = col;
      ref.div.innerHTML = temp != null ? `${temp.toFixed(1)}°` : '?';
      ref.marker.setTooltipContent(
        `<strong>${c.flag} ${c.label}</strong><br/>🌡️ ${temp != null ? temp.toFixed(1) + '°C' : 'Loading...'}<br/>📦 ${COUNTRY_PRICE_DATA[c.id]?.product || ''}`
      );
      ref.div.style.transform = c.id === selectedCountry ? 'scale(1.25)' : 'scale(1)';
      ref.div.style.boxShadow = c.id === selectedCountry ? `0 0 0 3px #fff, 0 0 0 5px ${col}` : '0 2px 8px rgba(0,0,0,0.3)';
    });
  }, [weatherData, selectedCountry]);

  /* ── Build comparison chart with proper date-based range ── */
  useEffect(() => {
    if (!chartRef.current) return;
    if (!window.Chart) return;
    if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); chartInstanceRef.current = null; }

    const wd = weatherData[selectedCountry];
    const pd = COUNTRY_PRICE_DATA[selectedCountry];
    if (!pd) return;

    const periodDays = period === '1m' ? 30 : period === '3m' ? 90 : 180;
    const today = new Date();

    /* Build date range: past periodDays → today → future periodDays */
    const allDates = [];
    for (let i = -periodDays; i <= periodDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      allDates.push(d);
    }
    const totalPts = allDates.length;
    const pastPts = periodDays; /* index where today is */

    /* Reduce to ~26 visible tick labels */
    const step = Math.max(1, Math.floor(totalPts / 26));
    const labels = allDates.filter((_, i) => i % step === 0)
      .map(d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
    const labelCount = labels.length;
    const splitIdx = Math.floor(pastPts / step);

    /* Temperature: real API data or seasonal fallback */
    let tempValues = [];
    if (wd && wd.dates && wd.temps) {
      allDates.filter((_, i) => i % step === 0).forEach(d => {
        const dateStr = d.toISOString().slice(0, 10);
        const idx = wd.dates.indexOf(dateStr);
        if (idx !== -1 && wd.temps[idx] != null) {
          tempValues.push(Math.round(wd.temps[idx] * 100) / 100);
        } else {
          /* Nearest date fallback */
          let nearest = null, minDiff = Infinity;
          wd.dates.forEach((dt, i) => {
            const diff = Math.abs(new Date(dt) - d);
            if (diff < minDiff && wd.temps[i] != null) { minDiff = diff; nearest = wd.temps[i]; }
          });
          tempValues.push(nearest != null ? Math.round(nearest * 100) / 100 : null);
        }
      });
    } else {
      const baseTempMap = { usa:18, chile:16, pakistan:28, india:30, south_africa:22, cambodia:32, vietnam:30, australia:24, argentina:18, iran:26, jordan:28, egypt:30 };
      const base = baseTempMap[selectedCountry] || 22;
      const isNorthern = country.lat > 0;
      tempValues = allDates.filter((_, i) => i % step === 0).map((d) => {
        const month = d.getMonth(); /* 0-11 */
        /* Northern: warm Jun(5)-Aug(7), cold Dec(11)-Feb(1). Southern: inverted */
        const seasonalOffset = isNorthern
          ? Math.sin(((month - 3) / 12) * Math.PI * 2) * 10
          : Math.sin(((month + 3) / 12) * Math.PI * 2) * 10;
        return Math.round((base + seasonalOffset + (Math.random() - 0.5) * 1.5) * 100) / 100;
      });
    }

    /* Price data: history then forecast */
    const allPrices = [...pd.seasonal, ...pd.forecast];
    const priceValues = allDates.filter((_, i) => i % step === 0).map((_, i) => {
      const pIdx = Math.min(Math.floor(i / labelCount * allPrices.length), allPrices.length - 1);
      const noise = (Math.random() - 0.5) * 0.03;
      return Math.round((allPrices[pIdx] + noise) * 1000) / 1000;
    });
    const priceHistory  = priceValues.map((v, i) => i <= splitIdx ? v : null);
    const priceForecast = priceValues.map((v, i) => i >= splitIdx ? v : null);

    const ctx = chartRef.current.getContext('2d');
    chartInstanceRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${pd.product} Historic Price (${currency}/kg)`,
            data: priceHistory,
            borderColor: '#10B981', backgroundColor: '#10B98112',
            borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff', pointBorderWidth: 1.5,
            fill: false, tension: 0.4, yAxisID: 'yPrice', spanGaps: false,
          },
          {
            label: `${pd.product} Price Forecast (${currency}/kg)`,
            data: priceForecast,
            borderColor: '#10B981', backgroundColor: 'transparent',
            borderWidth: 2, borderDash: [6, 4], pointRadius: 3,
            pointBackgroundColor: '#10B981', pointBorderColor: '#fff', pointBorderWidth: 1.5,
            fill: false, tension: 0.4, yAxisID: 'yPrice', spanGaps: false,
          },
          {
            label: 'Temperature (°C)',
            data: tempValues,
            borderColor: '#F97316', backgroundColor: '#F9731612',
            borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#F97316',
            pointBorderColor: '#fff', pointBorderWidth: 1.5,
            fill: false, tension: 0.4, yAxisID: 'yTemp',
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1A1D2E', cornerRadius: 10,
            titleFont: { family: "'Plus Jakarta Sans',sans-serif", size: 12 },
            bodyFont: { family: "'JetBrains Mono',monospace", size: 11 },
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y;
                if (ctx.datasetIndex === 2) return ` 🌡️ Temp: ${v != null ? v.toFixed(2) + '°C' : '—'}`;
                if (ctx.datasetIndex === 1) return ` 🟢 Forecast: ${currency==='EUR'?'€':'$'}${v != null ? v.toFixed(3) : '—'}/kg`;
                return ` 🟢 Price: ${currency==='EUR'?'€':'$'}${v != null ? v.toFixed(3) : '—'}/kg`;
              },
            },
          },
          annotation: {},
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9CA3AF', font: { size: 10, family: "'Plus Jakarta Sans',sans-serif" }, maxRotation: 45, maxTicksLimit: 14 },
            border: { display: false },
          },
          yPrice: {
            type: 'linear', position: 'left',
            grid: { color: '#F3F4F6' },
            ticks: { color: '#10B981', font: { size: 11 }, callback: v => `${currency==='EUR'?'€':'$'}${v.toFixed(3)}` },
            border: { display: false },
            title: { display: true, text: `Price (${currency}/kg)`, color: '#10B981', font: { size: 11 } },
          },
          yTemp: {
            type: 'linear', position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#F97316', font: { size: 11 }, callback: v => `${v.toFixed(1)}°C` },
            border: { display: false },
            title: { display: true, text: 'Temperature (°C)', color: '#F97316', font: { size: 11 } },
          },
        },
      },
    });
  }, [weatherData, selectedCountry, period, currency, country.lat]); // eslint-disable-line react-hooks/exhaustive-deps

  const wd = weatherData[selectedCountry];
  const pd = COUNTRY_PRICE_DATA[selectedCountry];

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div className="page-title">🌡️ Weather Forecast</div>
        <div className="page-subtitle">
          Live temperature data · Open-Meteo API · Auto-updates daily · {WEATHER_COUNTRIES.length} producing countries
        </div>
      </div>

      {/* ── CONTROLS — mobile responsive ── */}
      <div className="weather-controls">
        {/* Country dropdown */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:'1 1 200px', minWidth:0 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#6B7280', whiteSpace:'nowrap' }}>🌍 Country:</label>
          <select className="weather-select" value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} style={{ flex:1 }}>
            {WEATHER_COUNTRIES.map(c => {
              const cwd = weatherData[c.id];
              const temp = cwd ? cwd.current.toFixed(1) : '—';
              return <option key={c.id} value={c.id}>{c.flag} {c.label} {temp !== '—' ? `· ${temp}°C` : ''}</option>;
            })}
          </select>
        </div>
        {/* Period selector */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#6B7280', whiteSpace:'nowrap' }}>📅 Period:</label>
          <div style={{ display:'flex', gap:5 }}>
            {[['1m','1M'],['3m','3M'],['6m','6M']].map(([v,l]) => (
              <button key={v} className={`period-btn ${period===v?'active':''}`} onClick={() => setPeriod(v)}>{l}</button>
            ))}
          </div>
        </div>
        {loadingWeather && (
          <span style={{ fontSize:11, color:'#9CA3AF', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            <span style={{ animation:'spin 1s linear infinite', display:'inline-block', fontSize:14 }}>⟳</span> Loading...
          </span>
        )}
        {wd && (
          <span className={`temp-badge ${tempClass(wd.current)} `} style={{ flexShrink:0 }}>
            🌡️ {country.flag} {country.label.split('(')[0].trim()}: {wd.current.toFixed(1)}°C
          </span>
        )}
      </div>

      {/* WORLD MAP */}
      <div style={{ position:'relative', marginBottom:18 }}>
        <div ref={mapRef} className="weather-map-container" />
        {!mapReady && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#1a3a5c', borderRadius:14, color:'#fff', fontSize:14 }}>
            🗺️ Loading interactive map...
          </div>
        )}
        <div style={{ position:'absolute', bottom:16, right:16, background:'rgba(15,23,42,0.85)', color:'#fff', padding:'10px 14px', borderRadius:10, fontSize:11, backdropFilter:'blur(4px)', zIndex:500, lineHeight:1.8 }}>
          <div style={{ fontWeight:700, marginBottom:4, fontSize:12 }}>🌡️ Temperature Scale</div>
          {[['≥35°C','#DC2626','Extreme'],['25–35°C','#F97316','Hot'],['15–25°C','#EAB308','Warm'],['5–15°C','#22C55E','Cool'],['<5°C','#3B82F6','Cold']].map(([r,c,l]) => (
            <div key={r} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:c, flexShrink:0 }}/>
              <span style={{ color:'#CBD5E1', fontSize:10 }}>{r} · {l}</span>
            </div>
          ))}
          <div style={{ marginTop:5, borderTop:'1px solid rgba(255,255,255,0.15)', paddingTop:5, fontSize:9, color:'#94A3B8' }}>Click marker → select country</div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18 }}>
        {[
          ['📍 Country',     `${country.flag} ${country.label.split('(')[0].trim()}`],
          ['🌡️ Current Temp', wd ? `${wd.current.toFixed(2)}°C` : '—'],
          ['📦 Key Product',  pd?.product || '—'],
          ['💰 Current Price', pd ? `${sym}${(currency==='EUR' ? pd.base : pd.base/0.92).toFixed(3)}/kg` : '—'],
        ].map(([k,v]) => (
          <div key={k} className="stat-card">
            <div className="stat-label">{k}</div>
            <div className="stat-value" style={{ fontSize:17, paddingTop:2 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* COMPARISON CHART */}
      <div className="weather-chart-card">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'#1A1D2E' }}>
              {country.flag} {country.label} — Price vs Temperature
              <span style={{ fontSize:12, fontWeight:400, color:'#9CA3AF', marginLeft:8 }}>
                ({period==='1m'?'±30 days':period==='3m'?'±3 months':'±6 months'} from today)
              </span>
            </div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>
              Today = split point · Left of today = historical · Right = forecast · Updates daily via Open-Meteo API
            </div>
          </div>
          <div style={{ display:'flex', gap:5, flexShrink:0 }}>
            {[['1m','1M'],['3m','3M'],['6m','6M']].map(([v,l]) => (
              <button key={v} className={`period-btn ${period===v?'active':''}`} onClick={() => setPeriod(v)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="weather-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background:'#10B981' }}/><span>🟢 Historic price (solid)</span></div>
          <div className="legend-item"><div className="legend-dot" style={{ background:'transparent', border:'2px dashed #10B981' }}/><span style={{ color:'#6B7280' }}>🟢 - - Price forecast (dashed)</span></div>
          <div className="legend-item"><div className="legend-dot" style={{ background:'#F97316' }}/><span>🟠 Temperature °C</span></div>
          <div style={{ marginLeft:'auto', fontSize:11, color:'#9CA3AF' }}>💡 Hover for exact values</div>
        </div>

        <div style={{ height:320, position:'relative' }}>
          <canvas ref={chartRef} />
        </div>

        {/* QUICK SELECT COUNTRY — mobile dropdown on small screens */}
        <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #F3F4F6' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', marginBottom:8 }}>QUICK SELECT COUNTRY</div>
          {/* Mobile: dropdown */}
          <div style={{ display:'none' }} className="weather-mobile-country-select">
            <select
              className="weather-select"
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              style={{ width:'100%' }}
            >
              {WEATHER_COUNTRIES.map(c => {
                const cwd = weatherData[c.id];
                const temp = cwd ? cwd.current.toFixed(1) : '—';
                return <option key={c.id} value={c.id}>{c.flag} {c.label} {temp !== '—' ? `· ${temp}°C` : ''}</option>;
              })}
            </select>
          </div>
          {/* Desktop: pill buttons */}
          <div className="weather-desktop-country-pills" style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {WEATHER_COUNTRIES.map(c => {
              const cwd = weatherData[c.id];
              const temp = cwd ? cwd.current : null;
              const col = temp != null ? tempColor(temp) : '#9CA3AF';
              return (
                <button key={c.id} onClick={() => setSelectedCountry(c.id)}
                  style={{ padding:'5px 10px', borderRadius:8, border:`1.5px solid ${c.id===selectedCountry?col:'#E5E7EB'}`,
                    background: c.id===selectedCountry ? col+'18' : '#fff', cursor:'pointer', fontSize:11, fontWeight:600,
                    color: c.id===selectedCountry ? col : '#6B7280', display:'flex', alignItems:'center', gap:4,
                    transition:'all 0.18s', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {c.flag} {c.label.split('(')[0].trim()}
                  {temp != null && <span style={{ fontSize:10, color:col }}>· {temp.toFixed(1)}°</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {infoVisible && (
        <div style={{ marginTop:14, padding:'12px 16px', background:'#F0F2F8', borderRadius:10, fontSize:12, color:'#6B7280', display:'flex', gap:8, alignItems:'flex-start', position:'relative' }}>
          <span style={{ flexShrink:0 }}>ℹ️</span>
          <span>
            <strong>Temperature:</strong> Live Open-Meteo API · auto-refreshes daily ·
            <strong> Prices:</strong> CALCONUT + Eurostat COMEXT + WITS WorldBank + ITC TradeMap + OEC ·
            Green = {pd?.product || 'product'} price · Orange = temperature °C · All values to 2–3 decimals.
          </span>
          <button onClick={() => setInfoVisible(false)} style={{ position:'absolute', top:8, right:10, background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF', lineHeight:1, padding:'2px 6px', borderRadius:4 }} title="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState({});
  const [, setLatest] = useState({});
  const [history, setHistory] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('almond');
  const [tableFilter, setTableFilter] = useState('all');
  const [scraping, setScraping] = useState(false);
  const [currency, setCurrency] = useState('USD'); // USD or EUR
  const EUR_RATE = 0.92; // 1 USD = 0.92 EUR (update periodically)
  const fmt = (usdVal) => {
    if (!usdVal) return '—';
    if (currency === 'EUR') return '€' + (usdVal * EUR_RATE).toFixed(2);
    return '$' + Number(usdVal).toFixed(2);
  };
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    setLoading(true);
    try {
      const [sumRes, latRes, alertRes] = await Promise.all([
        axios.get(`${API}/market-summary`, { headers: authH() }).catch(() => ({ data: {} })),
        axios.get(`${API}/prices/latest`,  { headers: authH() }).catch(() => ({ data: {} })),
        axios.get(`${API}/alerts`,         { headers: authH() }).catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data);
      setLatest(latRes.data);
      setAlerts(alertRes.data);
      setLastUpdated(new Date());
    } catch {}
    setLoading(false);
  }, []);

  const fetchHistory = useCallback(async (product) => {
    try {
      const r = await axios.get(`${API}/history/${product}`, { headers: authH() });
      setHistory(p => ({ ...p, [product]: r.data }));
    } catch {}
  }, []);

  const fetchForecast = useCallback(async (product) => {
    try {
      const r = await axios.get(`${API}/predict/${product}`, { headers: authH() });
      setForecast(r.data);
    } catch { setForecast(null); }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchAll();
      const iv = setInterval(fetchAll, 6 * 3600 * 1000);
      return () => clearInterval(iv);
    }
  }, [loggedIn, fetchAll]);

  /* Load Chart.js globally for WeatherForecast component */
  useEffect(() => {
    if (window.Chart) return;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (loggedIn && selectedProduct) {
      fetchHistory(selectedProduct);
      fetchForecast(selectedProduct);
    }
  }, [loggedIn, selectedProduct, fetchHistory, fetchForecast]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      // Fire the scrape — backend starts it in a background thread immediately
      await axios.post(`${API}/scrape`, {}, { headers: authH(), timeout: 10000 });

      // Poll /scrape/status every 4 seconds until scraper finishes
      const poll = setInterval(async () => {
        try {
          const s = await axios.get(`${API}/scrape/status`, { headers: authH() });
          if (!s.data.running) {
            clearInterval(poll);
            // Refresh dashboard with fresh data
            await fetchAll();
            await fetchHistory(selectedProduct);
            await fetchForecast(selectedProduct);
            setScraping(false);
          }
        } catch {
          clearInterval(poll);
          setScraping(false);
        }
      }, 4000);

    } catch (err) {
      alert('Could not start scraper — make sure backend is running');
      setScraping(false);
    }
  };

  if (!loggedIn) return (<><style>{CSS}</style><Login onLogin={() => setLoggedIn(true)} /></>);

  /* ── Derived stats ── */
  const totalProducts = ALL_PRODUCTS.filter(p => summary[p]).length;
  const avgPrice = totalProducts
    ? (ALL_PRODUCTS.reduce((s, p) => s + (summary[p]?.latest || 0), 0) / totalProducts)
    : 0;
  const mostExpensive = ALL_PRODUCTS.reduce((best, p) =>
    (summary[p]?.latest || 0) > (summary[best]?.latest || 0) ? p : best, 'pistachio');
  const totalAlerts = alerts.length;

  /* ── Chart colors ── */
  const barColors = ALL_PRODUCTS.map(p => PRODUCT_META[p].color + 'CC');
  const barBorders = ALL_PRODUCTS.map(p => PRODUCT_META[p].color);

  const barData = {
    labels: ALL_PRODUCTS.map(p => PRODUCT_META[p].label),
    datasets: [{
      label: 'USD/kg',
      data: ALL_PRODUCTS.map(p => summary[p]?.latest || 0),
      backgroundColor: barColors,
      borderColor: barBorders,
      borderWidth: 1.5,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const histData = history[selectedProduct]?.length > 0 ? {
    labels: history[selectedProduct].slice(-20).map(h => h.date.slice(5, 10)),
    datasets: [{
      label: 'USD/kg',
      data: history[selectedProduct].slice(-20).map(h => h.price),
      borderColor: PRODUCT_META[selectedProduct].color,
      backgroundColor: PRODUCT_META[selectedProduct].color + '18',
      fill: true, tension: 0.45, pointRadius: 3,
      pointBackgroundColor: PRODUCT_META[selectedProduct].color,
      borderWidth: 2.5,
    }]
  } : null;

  const forecastData = forecast?.forecast ? {
    labels: forecast.forecast.slice(0, 14).map(f => f.date.slice(5)),
    datasets: [{
      label: 'Forecast',
      data: forecast.forecast.slice(0, 14).map(f => f.price),
      borderColor: '#6366F1',
      backgroundColor: '#6366F118',
      fill: true, tension: 0.45,
      borderDash: [5, 4], pointRadius: 2,
    }]
  } : null;

  const chartOpts = (yLabel = '$') => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A1D2E', cornerRadius: 10,
        titleFont: { family: "'Plus Jakarta Sans',sans-serif", size: 12 },
        bodyFont: { family: "'JetBrains Mono',monospace", size: 12 },
        callbacks: { label: ctx => ` ${currency === 'EUR' ? '€' : '$'}${ctx.parsed.y?.toFixed(2)}/kg` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 11, family: "'Plus Jakarta Sans',sans-serif" }, maxRotation: 35 }, border: { display: false } },
      y: { grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { size: 11, family: "'JetBrains Mono',monospace" }, callback: v => `${currency === 'EUR' ? '€' : '$'}${v}` }, border: { display: false } }
    }
  });

  /* ── Table rows filtered ── */
  const tableRows = ALL_PRODUCTS.map(p => {
    const d = summary[p];
    if (!d) return null;
    const change = d.change_pct;
    const status = Math.abs(change) < 1 ? 'stable' : change > 0 ? 'rising' : 'falling';
    return { product: p, ...d, status };
  }).filter(Boolean);

  const filteredRows = tableFilter === 'all' ? tableRows
    : tableFilter === 'rising'  ? tableRows.filter(r => r.status === 'rising')
    : tableFilter === 'falling' ? tableRows.filter(r => r.status === 'falling')
    : tableRows.filter(r => r.status === 'stable');

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <>
      <style>{CSS}</style>
      <div className="nico-layout">

        {/* SIDEBAR OVERLAY (mobile) */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <div className="logo-icon">🌰</div>
            <div>
              <div className="logo-text">NICO</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            <div className="sidebar-section">General</div>
            {NAV_ITEMS.map(item => (
              <button key={item.id}
                className={`nav-item ${tab === item.id ? 'active' : ''}`}
                style={item.indent ? { paddingLeft: 28, fontSize: 13, opacity: 0.92 } : {}}
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}>
                {item.indent && <span style={{ color:'#9CA3AF', fontSize:10, marginRight:2 }}>└</span>}
                <span style={{ fontSize: item.indent ? 13 : 15 }}>{item.icon}</span>
                {item.label}
                {item.id === 'alerts' && totalAlerts > 0 && <span className="nav-badge">{totalAlerts}</span>}
              </button>
            ))}

            <div className="sidebar-section" style={{ marginTop: 12 }}>Profil</div>
            <button className="nav-item" onClick={() => { localStorage.removeItem('token'); setLoggedIn(false); }}>
              <span style={{ fontSize: 15 }}>🚪</span> Log out
            </button>
          </div>

          {/* Mobile-only controls in sidebar */}
          <div className="sidebar-mobile-controls">
            <div style={{ display:'flex', background:'#F3F4F6', borderRadius:8, padding:2, gap:2, width:'100%' }}>
              <button onClick={() => setCurrency('USD')} style={{ flex:1, padding:'7px 0', borderRadius:6, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, background: currency==='USD' ? '#fff' : 'transparent', color: currency==='USD' ? '#6366F1' : '#9CA3AF', boxShadow: currency==='USD' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.18s' }}>$ USD</button>
              <button onClick={() => setCurrency('EUR')} style={{ flex:1, padding:'7px 0', borderRadius:6, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, background: currency==='EUR' ? '#fff' : 'transparent', color: currency==='EUR' ? '#6366F1' : '#9CA3AF', boxShadow: currency==='EUR' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.18s' }}>€ EUR</button>
            </div>
            <button className="topbar-btn" style={{ width:'100%', justifyContent:'center' }} onClick={() => { fetchAll(); setSidebarOpen(false); }}>↻ Refresh Data</button>
            <button className="refresh-btn" style={{ width:'100%', justifyContent:'center' }} onClick={() => { handleScrape(); setSidebarOpen(false); }} disabled={scraping}>
              {scraping ? '⏳ Scraping...' : '⬇ Scrape Data'}
            </button>
          </div>

          <div className="sidebar-bottom">
            <div className="user-row">
              <div className="user-avatar">A</div>
              <div>
                <div className="user-name">Admin</div>
                <div className="user-role">admin@nico.io</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-content">

          {/* TOPBAR */}
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <span style={{ fontSize: 20 }}>☰</span>
              </button>
              <div className="breadcrumb">
                Pages / <strong>{NAV_ITEMS.find(n => n.id === tab)?.label || 'Dashboard'}</strong>
              </div>
            </div>
            <div className="topbar-right">
              {lastUpdated && (
                <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <div className="topbar-controls">
                <div style={{ display:'flex', background:'#F3F4F6', borderRadius:8, padding:2, gap:2 }}>
                  <button onClick={() => setCurrency('USD')} style={{ padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, background: currency==='USD' ? '#fff' : 'transparent', color: currency==='USD' ? '#6366F1' : '#9CA3AF', boxShadow: currency==='USD' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.18s' }}>$ USD</button>
                  <button onClick={() => setCurrency('EUR')} style={{ padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, background: currency==='EUR' ? '#fff' : 'transparent', color: currency==='EUR' ? '#6366F1' : '#9CA3AF', boxShadow: currency==='EUR' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.18s' }}>€ EUR</button>
                </div>
                <button className="topbar-btn" onClick={fetchAll}>↻ Refresh</button>
                <button className="refresh-btn" onClick={handleScrape} disabled={scraping}>
                  {scraping ? '⏳ Scraping...' : '⬇ Scrape Data'}
                </button>
              </div>
            </div>
          </header>

          {/* ════════════════════════════
              DASHBOARD TAB
          ════════════════════════════ */}
          {tab === 'dashboard' && (
            <div className="page fade-up">
              <div className="page-header">
                <div className="page-title">Overview</div>
                <div className="page-subtitle">
                  {lastUpdated ? lastUpdated.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : 'Loading...'}
                  {' · '}Sources: UN Comtrade · USDA · FAOSTAT
                </div>
              </div>

              {/* UPGRADE BANNER */}
              {showUpgradeBanner && (
                <div className="upgrade-banner" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    aria-label="Close suggestion"
                    onClick={() => setShowUpgradeBanner(false)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(15,23,42,0.08)',
                      border: 'none',
                      borderRadius: 999,
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EEF2FF',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      💎 Upgrade to Premium Data
                    </div>
                    <div className="upgrade-banner-text">
                      Connect Vesper, Mintec or Expana for real-time EU benchmark prices & daily feeds.
                    </div>
                  </div>
                  <button className="upgrade-banner-btn" onClick={() => setTab('sources')}>
                    View Sources →
                  </button>
                </div>
              )}

              {/* STATS */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">📦 Total Products Tracked</div>
                  <div className="stat-value">{totalProducts}</div>
                  <div className="stat-change up">+3 new this update</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">💵 Average Price (USD/kg)</div>
                  <div className="stat-value">{fmt(avgPrice)}</div>
                  <div className={`stat-change ${Number(avgPrice) > 7 ? 'up' : 'down'}`}>
                    across all categories
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">👑 Most Expensive</div>
                  <div className="stat-value" style={{ fontSize: 20, paddingTop: 4 }}>
                    {PRODUCT_META[mostExpensive].emoji} {PRODUCT_META[mostExpensive].label}
                  </div>
                  <div className="stat-change up">
                    {fmt(summary[mostExpensive]?.latest)}/kg
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">🔔 Active Alerts</div>
                  <div className="stat-value" style={{ color: totalAlerts > 0 ? '#EF4444' : '#10B981' }}>
                    {totalAlerts}
                  </div>
                  <div className={`stat-change ${totalAlerts > 0 ? 'down' : 'up'}`}>
                    {totalAlerts > 0 ? 'price movements detected' : 'all prices stable'}
                  </div>
                </div>
              </div>

              {/* CHARTS */}
              <div className="charts-row">
                <div className="card">
                  <div className="card-title">Price Comparison</div>
                  <div className="card-subtitle">All products · USD per kg</div>
                  <div style={{ height: 240 }}>
                    {!loading && <Bar data={barData} options={chartOpts()} />}
                    {loading && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 13 }}>Loading...</div>}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">{PRODUCT_META[selectedProduct].label} · Price Trend</div>
                  <div className="card-subtitle">Last 20 readings · click product card to change</div>
                  <div style={{ height: 240 }}>
                    {histData
                      ? <Line data={histData} options={chartOpts()} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 13, textAlign: 'center' }}>No history yet<br/>Click "Scrape Data"</div>
                    }
                  </div>
                </div>
              </div>

              {/* LATEST PRICES TABLE */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <div className="card-title">Latest Prices</div>
                    <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>30d EU Range: Eurostat COMEXT · WITS WorldBank · ITC TradeMap · OEC</div>
                  </div>
                </div>
                <div style={{ overflowX:'auto', scrollbarWidth:'none' }}>
                  <div className="carousel-tabs-scroll" style={{ borderBottom:'1px solid #F3F4F6' }}>
                    {['all','rising','falling','stable'].map(f => (
                      <button key={f} className={`table-tab ${tableFilter === f ? 'active' : ''}`} onClick={() => setTableFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'all' && <span style={{ marginLeft: 6, background: '#E5E7EB', padding: '1px 7px', borderRadius: 10, fontSize: 11 }}>{tableRows.length}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="table-scroll-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Latest Price</th>
                        <th>Country</th>
                        <th>Data Source</th>
                        <th>30d EU Range</th>
                        <th>EU Avg (30d)</th>
                        <th>Change</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', color: '#D1D5DB', padding: 32 }}>
                          No data yet — click "Scrape Data" to collect prices
                        </td></tr>
                      )}
                      {filteredRows.map(row => {
                        const m = PRODUCT_META[row.product];
                        const bm = EU_MARKET_BENCHMARKS[row.product];
                        const sym = currency === 'EUR' ? '€' : '$';
                        const bmLo = bm ? (currency === 'EUR' ? bm.low : bm.low / 0.92) : null;
                        const bmHi = bm ? (currency === 'EUR' ? bm.high : bm.high / 0.92) : null;
                        const bmAvg = bm ? (currency === 'EUR' ? bm.avg : bm.avg / 0.92) : null;
                        const curPrice = currency === 'EUR' ? (row.latest * 0.92) : row.latest;
                        const pct = bmLo && bmHi ? Math.min(100, Math.max(0, ((curPrice - bmLo) / (bmHi - bmLo)) * 100)) : 50;
                        return (
                          <tr key={row.product} onClick={() => { setSelectedProduct(row.product); }} style={{ cursor: 'pointer' }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{m.emoji}</div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.label}</div>
                                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{m.origin.split('·')[0].trim()}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: m.color }}>{fmt(row.latest)}</td>
                            <td style={{ color: '#6B7280', fontSize: 13 }}>{row.country}</td>
                            <td><span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>{row.source?.slice(0, 20)}</span></td>
                            <td style={{ minWidth: 110 }}>
                              {bm ? (
                                <div>
                                  <div style={{ height:6, borderRadius:3, background:'#E5E7EB', position:'relative', width:80 }}>
                                    <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${pct}%`, borderRadius:3, background:`linear-gradient(90deg, #6366F1, #8B5CF6)` }} />
                                  </div>
                                  <div style={{ fontSize:10, color:'#9CA3AF', marginTop:3, fontFamily:"'JetBrains Mono',monospace" }}>{sym}{bmLo.toFixed(2)}–{sym}{bmHi.toFixed(2)}</div>
                                </div>
                              ) : <span style={{ color:'#D1D5DB', fontSize:12 }}>—</span>}
                            </td>
                            <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:'#10B981' }}>
                              {bmAvg ? `${sym}${bmAvg.toFixed(2)}` : '—'}
                            </td>
                            <td>
                              <span style={{ fontSize: 12, fontWeight: 700, color: row.change_pct > 0 ? '#10B981' : row.change_pct < 0 ? '#EF4444' : '#9CA3AF' }}>
                                {row.change_pct > 0 ? '+' : ''}{row.change_pct}%
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${row.status === 'rising' ? 'badge-red' : row.status === 'falling' ? 'badge-green' : 'badge-blue'}`}>
                                {row.status === 'rising' ? '▲ Rising' : row.status === 'falling' ? '▼ Falling' : '● Stable'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════
              ANALYTICS TAB
          ════════════════════════════ */}
          {tab === 'analytics' && (
            <div className="page fade-up">
              <div className="page-header">
                <div className="page-title">Price Analytics</div>
                <div className="page-subtitle">Historical trends & 30-day AI forecast</div>
              </div>

              {/* Product selector */}
              <div className="product-pills" style={{ marginBottom: 20 }}>
                {ALL_PRODUCTS.map(p => (
                  <button key={p} className="pill"
                    style={{ background: selectedProduct === p ? PRODUCT_META[p].color : '#fff', color: selectedProduct === p ? '#fff' : '#6B7280', borderColor: selectedProduct === p ? PRODUCT_META[p].color : '#E5E7EB' }}
                    onClick={() => setSelectedProduct(p)}>
                    {PRODUCT_META[p].emoji} {PRODUCT_META[p].label}
                  </button>
                ))}
              </div>

              {/* Stats strip */}
              {summary[selectedProduct] && (
                <div className="stats-row" style={{ marginBottom: 20 }}>
                  {[
                    { label: 'Current Price', value: fmt(summary[selectedProduct].latest) },
                    { label: '30-Day Average', value: fmt(summary[selectedProduct].avg) },
                    { label: '30-Day Low', value: fmt(summary[selectedProduct].min) },
                    { label: '30-Day High', value: fmt(summary[selectedProduct].max) },
                  ].map((s, i) => (
                    <div key={i} className="stat-card">
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value" style={{ fontSize: 22, color: PRODUCT_META[selectedProduct].color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="charts-row">
                <div className="card">
                  <div className="card-title">{PRODUCT_META[selectedProduct].label} · Price History</div>
                  <div className="card-subtitle">All recorded data points</div>
                  <div style={{ height: 260 }}>
                    {histData ? <Line data={histData} options={chartOpts()} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 13 }}>No data · Click Scrape Data first</div>}
                  </div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div className="card-title">30-Day Forecast</div>
                    {forecast && (
                      <span className={`badge ${forecast.trend === 'UP' ? 'badge-red' : 'badge-green'}`}>
                        {forecast.trend === 'UP' ? '▲ Rising trend' : '▼ Falling trend'}
                      </span>
                    )}
                  </div>
                  <div className="card-subtitle">Linear trend projection</div>
                  <div style={{ height: 260 }}>
                    {forecastData ? <Line data={forecastData} options={chartOpts()} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 13 }}>Need 5+ data points</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════
              PRODUCTS TAB
          ════════════════════════════ */}
          {tab === 'products' && (
            <div className="page fade-up">
              <div className="page-header">
                <div className="page-title">All Products</div>
                <div className="page-subtitle">8 dry fruits tracked · click any card for details</div>
              </div>
              <div className="product-grid">
                {ALL_PRODUCTS.map(p => {
                  const m = PRODUCT_META[p];
                  const d = summary[p];
                  return (
                    <div key={p} className="product-tile" onClick={() => { setSelectedProduct(p); setTab('analytics'); }}>
                      <div className="product-tile-top">
                        <div className="product-icon" style={{ background: m.color + '18' }}>{m.emoji}</div>
                        <span className={`badge ${d?.change_pct > 0 ? 'badge-red' : d?.change_pct < 0 ? 'badge-green' : 'badge-blue'}`}>
                          {d?.change_pct !== undefined ? `${d.change_pct > 0 ? '+' : ''}${d.change_pct}%` : '—'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{m.label}</div>
                      <div className="product-price" style={{ color: m.color }}>
                        {d ? fmt(d.latest) : loading ? '...' : '—'}
                      </div>
                      <div className="product-origin">{m.origin}</div>
                      {d && (
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>
                          <span>Low {fmt(d.min)}</span>
                          <span>Avg {fmt(d.avg)}</span>
                          <span>High {fmt(d.max)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════
              ALERTS TAB
          ════════════════════════════ */}
          {tab === 'alerts' && (
            <div className="page fade-up">
              <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div className="page-title">Price Alerts</div>
                    <div className="page-subtitle">Triggered when price moves ≥3% between readings</div>
                  </div>
                  {alerts.length > 0 && (
                    <button
                      type="button"
                      className="topbar-btn"
                      style={{ fontSize: 12, padding: '6px 10px' }}
                      onClick={() => setAlerts([])}
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 56 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No Active Alerts</div>
                  <div style={{ color: '#9CA3AF', fontSize: 13 }}>All prices are within normal range</div>
                </div>
              ) : (
                <div>
                  {alerts.map((a, i) => (
                    <AlertItem
                      key={i}
                      alert={a}
                      onRemove={() => setAlerts(prev => prev.filter((_, idx) => idx !== i))}
                    />
                  ))}
                </div>
              )}

              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-title">Alert Thresholds</div>
                <div className="card-subtitle">How alerts are triggered</div>
                <table className="data-table">
                  <thead><tr><th>Alert Type</th><th>Trigger</th><th>Action</th></tr></thead>
                  <tbody>
                    <tr><td><span className="badge badge-yellow">MEDIUM</span></td><td>Price moves 3–9% vs previous</td><td>Shown in alert panel</td></tr>
                    <tr><td><span className="badge badge-red">HIGH</span></td><td>Price moves 10%+ vs previous</td><td>Highlighted prominently</td></tr>
                    <tr><td><span className="badge badge-blue">AUTO</span></td><td>Every 6 hours</td><td>Dashboard auto-refreshes</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════════════
              SUPPLIER CATALOG TAB
          ════════════════════════════ */}
          {tab === 'catalog' && <SupplierCatalog fmt={fmt} currency={currency} />}

          {/* ════════════════════════════
              NETHERLANDS SUPPLY TAB
          ════════════════════════════ */}
          {tab === 'catalog_netherlands' && <NetherlandsSupplyCatalog currency={currency} />}

          {/* ════════════════════════════
              TOP 5 TAB
          ════════════════════════════ */}
          {tab === 'top5' && <Top5Catalog currency={currency} />}

          {/* ════════════════════════════
              WEATHER FORECAST TAB
          ════════════════════════════ */}
          {tab === 'weather' && <WeatherForecast currency={currency} />}

          {/* ════════════════════════════
              SOURCES TAB
          ════════════════════════════ */}
          {tab === 'sources' && (
            <div className="page fade-up">
              <div className="page-header">
                <div className="page-title">Data Sources</div>
                <div className="page-subtitle">136-source database · UN, USDA, FAO & industry providers</div>
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">✅ Active Free Sources</div>
                <div className="card-subtitle">Currently integrated and pulling data</div>
                <table className="data-table">
                  <thead><tr><th>Source</th><th>Type</th><th>Coverage</th><th>Reliability</th><th>URL</th></tr></thead>
                  <tbody>
                    {[
                      { name: 'UN Comtrade',    type: 'Trade Data',     cov: 'EU Imports',   rel: 5, url: 'comtradeapi.un.org' },
                      { name: 'USDA NASS',      type: 'Production',     cov: 'USA',          rel: 5, url: 'quickstats.nass.usda.gov' },
                      { name: 'FAOSTAT',        type: 'UN Agriculture', cov: 'Global',       rel: 5, url: 'fenixservices.fao.org' },
                      { name: 'Market Baseline',type: 'Estimates',      cov: 'All origins',  rel: 3, url: 'Internal' },
                    ].map((s, i) => (
                      <tr key={i}>
                        <td><strong>{s.name}</strong></td>
                        <td><span className="badge badge-blue">{s.type}</span></td>
                        <td style={{ color: '#6B7280', fontSize: 13 }}>{s.cov}</td>
                        <td>{'★'.repeat(s.rel)}{'☆'.repeat(5 - s.rel)}</td>
                        <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6366F1' }}>{s.url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <div className="card-title">💎 Premium Sources (Recommended)</div>
                <div className="card-subtitle">Upgrade for real-time EU benchmark prices</div>
                <table className="data-table">
                  <thead><tr><th>Source</th><th>Why Important</th><th>Products</th><th>Link</th></tr></thead>
                  <tbody>
                    {[
                      { name: 'Vesper',        why: 'Best EU benchmark prices for nuts',      prod: 'All nuts',       url: 'vespertool.com/nuts' },
                      { name: 'Expana Markets',why: 'Food ingredient price benchmarks',       prod: 'All products',   url: 'expanamarkets.com' },
                      { name: 'Mintec',        why: 'Industry standard for manufacturers',   prod: 'All products',   url: 'mintecglobal.com' },
                      { name: 'Tridge',        why: 'Origin-level wholesale prices',         prod: 'All nuts',       url: 'tridge.com/intelligences' },
                      { name: 'INC',           why: 'Global nut production statistics',      prod: 'All nuts',       url: 'inc.nutfruit.org' },
                      { name: 'AgFlow',        why: 'Trade-flow & shipment monitoring',      prod: 'All products',   url: 'agflow.com' },
                    ].map((s, i) => (
                      <tr key={i}>
                        <td><strong>{s.name}</strong></td>
                        <td style={{ color: '#6B7280', fontSize: 13 }}>{s.why}</td>
                        <td><span className="badge badge-purple">{s.prod}</span></td>
                        <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6366F1' }}>{s.url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
} 
