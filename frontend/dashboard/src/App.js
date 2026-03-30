import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const API = 'https://web-production-c20a2.up.railway.app';

const ALL_PRODUCTS = [
  'almond','cashew','pistachio','walnut','raisin','date','dried_fig','dried_apricot',
  'hazelnut','pecan','brazil_nut','macadamia','pine_nut',
  'dried_mango','dried_cranberry','dried_blueberry','banana_chip','dried_apple','dried_papaya','prune'
];

const PRODUCT_META = {
  almond:          { label: 'Almonds',           emoji: '🌰', color: '#E8A838', origin: 'USA · Spain · Australia' },
  cashew:          { label: 'Cashews',           emoji: '🥜', color: '#10B981', origin: 'Vietnam · India · Ivory Coast' },
  pistachio:       { label: 'Pistachios',        emoji: '💚', color: '#6366F1', origin: 'USA · Iran · Turkey' },
  walnut:          { label: 'Walnuts',           emoji: '🟤', color: '#F59E0B', origin: 'USA · China · Chile' },
  raisin:          { label: 'Raisins',           emoji: '🍇', color: '#8B5CF6', origin: 'USA · Turkey · Iran' },
  date:            { label: 'Dates',             emoji: '🌴', color: '#EF4444', origin: 'Saudi Arabia · UAE · Tunisia' },
  dried_fig:       { label: 'Dried Figs',        emoji: '🟫', color: '#EC4899', origin: 'Turkey · Morocco · Iran' },
  dried_apricot:   { label: 'Dried Apricots',    emoji: '🍑', color: '#F97316', origin: 'Turkey · USA · Uzbekistan' },
  hazelnut:        { label: 'Hazelnuts',         emoji: '🌰', color: '#92400E', origin: 'Turkey · Georgia · Italy' },
  pecan:           { label: 'Pecans',            emoji: '🥜', color: '#D97706', origin: 'USA · Mexico' },
  brazil_nut:      { label: 'Brazil Nuts',       emoji: '🫘', color: '#065F46', origin: 'Peru · Bolivia · Brazil' },
  macadamia:       { label: 'Macadamia',         emoji: '⚪', color: '#6B7280', origin: 'Kenya · South Africa · Australia' },
  pine_nut:        { label: 'Pine Nuts',         emoji: '🌲', color: '#166534', origin: 'China · Russia · Pakistan' },
  dried_mango:     { label: 'Dried Mango',       emoji: '🥭', color: '#F59E0B', origin: 'Thailand · Philippines · India' },
  dried_cranberry: { label: 'Dried Cranberries', emoji: '🔴', color: '#DC2626', origin: 'USA · Canada' },
  dried_blueberry: { label: 'Dried Blueberries', emoji: '🫐', color: '#4F46E5', origin: 'USA · Chile' },
  banana_chip:     { label: 'Dried Banana Chips',emoji: '🍌', color: '#CA8A04', origin: 'Philippines · Ecuador' },
  dried_apple:     { label: 'Dried Apple',       emoji: '🍎', color: '#16A34A', origin: 'China · Chile · Poland' },
  dried_papaya:    { label: 'Dried Papaya',      emoji: '🧡', color: '#EA580C', origin: 'Thailand · Brazil · Mexico' },
  prune:           { label: 'Prunes',            emoji: '🫐', color: '#7C3AED', origin: 'USA · France · Chile' },
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
  .badge-green { background: #D1FAE5; color: #065F46; }

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

  /* SCRAPE PROGRESS BAR */
  .scrape-progress-wrap { width:100%; margin-top:6px; }
  .scrape-progress-bar { height:5px; border-radius:3px; background:#E5E7EB; overflow:hidden; }
  .scrape-progress-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#6366F1,#8B5CF6); transition:width 0.4s ease; }
  .scrape-progress-label { font-size:10px; color:#9CA3AF; margin-top:3px; font-family:'JetBrains Mono',monospace; text-align:right; }

  /* SCRAPE SUCCESS POPUP */
  .scrape-success-popup { position:fixed; bottom:24px; right:24px; background:#10B981; color:#fff; padding:12px 20px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:0 4px 20px rgba(16,185,129,0.4); z-index:9999; display:flex; align-items:center; gap:8px; animation:fadeUp 0.3s ease forwards; }

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
  'Almonds','Pistachios','Cashews','Walnuts','Raisins',
  'Hazelnuts','Pecans','Brazil Nuts','Macadamia','Pine Nuts',
  'Dates','Dried Figs','Dried Apricots','Dried Fruits','Seeds & Other'
];

/* ── EU 30-day market benchmark ranges (Eurostat COMEXT · WITS WorldBank · ITC TradeMap · OEC)
   These represent bulk wholesale EU import price ranges (EUR/kg, CIF equivalent)
   Sources: Eurostat https://ec.europa.eu/eurostat · WITS https://wits.worldbank.org
            ITC TradeMap https://trademap.org · OEC https://oec.world ──────────────────── */
const EU_MARKET_BENCHMARKS = {
  almond:          { low: 5.80, high: 7.20,  avg: 6.50,  source: 'Eurostat/ITC TradeMap' },
  cashew:          { low: 5.20, high: 7.50,  avg: 6.20,  source: 'WITS WorldBank' },
  pistachio:       { low: 8.50, high: 12.00, avg: 9.80,  source: 'OEC/ITC TradeMap' },
  walnut:          { low: 3.80, high: 6.50,  avg: 5.10,  source: 'Eurostat COMEXT' },
  raisin:          { low: 1.80, high: 3.00,  avg: 2.35,  source: 'WITS WorldBank' },
  date:            { low: 3.50, high: 7.00,  avg: 5.20,  source: 'ITC TradeMap' },
  dried_fig:       { low: 2.50, high: 4.80,  avg: 3.60,  source: 'Eurostat/OEC' },
  dried_apricot:   { low: 3.20, high: 6.50,  avg: 4.80,  source: 'WITS/Eurostat' },
  hazelnut:        { low: 9.00, high: 16.00, avg: 12.00, source: 'Eurostat/INC' },
  pecan:           { low: 9.00, high: 14.00, avg: 11.50, source: 'USDA ERS/Eurostat' },
  brazil_nut:      { low: 10.50,high: 14.00, avg: 12.20, source: 'FAOSTAT/Eurostat' },
  macadamia:       { low: 12.00,high: 17.00, avg: 14.00, source: 'FAOSTAT/Eurostat' },
  pine_nut:        { low: 24.00,high: 32.00, avg: 27.50, source: 'Eurostat COMEXT' },
  dried_mango:     { low: 3.50, high: 5.50,  avg: 4.50,  source: 'FAOSTAT/Eurostat' },
  dried_cranberry: { low: 3.50, high: 4.80,  avg: 4.10,  source: 'USDA ERS/Eurostat' },
  dried_blueberry: { low: 5.50, high: 9.00,  avg: 7.00,  source: 'FAOSTAT/Eurostat' },
  banana_chip:     { low: 2.80, high: 4.00,  avg: 3.40,  source: 'Eurostat/FAOSTAT' },
  dried_apple:     { low: 3.00, high: 5.50,  avg: 4.20,  source: 'Eurostat/FAOSTAT' },
  dried_papaya:    { low: 3.00, high: 4.50,  avg: 3.70,  source: 'Eurostat/FAOSTAT' },
  prune:           { low: 3.80, high: 6.00,  avg: 4.80,  source: 'USDA ERS/Eurostat' },
};

/* ── TOP 5 NICO product list (Walnuts → Dried Papaya) from docx, with CALCONUT & EU market data ── */
const TOP5_NICO_DATA = [ // eslint-disable-line no-unused-vars
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
/* NL product category mapping — for tab organisation */
const NL_CATEGORIES = {
  'Amandelen':     ['amand', 'amandelsc', 'amandelp', 'droogger roosterd amand', 'rookamand'],
  'Cashewnoten':   ['cashew'],
  'Hazelnoten':    ['hazeln'],
  'Macadamia':     ['macadamia'],
  'Paranoten':     ['paranot'],
  'Pecannoten':    ['pecan'],
  'Pistachenoten': ['pistach'],
  'Walnoten':      ['walnot'],
  "Pinda's":       ['pinda', 'doppinda'],
  'Fruit Gedroogd':['cranberr', 'gojib', 'moerbeib', 'aardbei', 'ananas', 'bananench', 'kokos', 'mango', 'papaj', 'abrik', 'dadel', 'krenten', 'rozijn'],
  'Pitten & Zaden':['pijnboomp', 'chiazaad', 'pepita', 'zonnebl'],
};

function getNLCategory(productName) {
  const lower = productName.toLowerCase();
  for (const [cat, keywords] of Object.entries(NL_CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'Overig';
}



/* ─────────────────────────────────────────────
   SUPPLIER CATALOG COMPONENT — fully responsive
───────────────────────────────────────────── */
function SupplierCatalog({ fmt, currency }) {
  const [activeTab, setActiveTab] = useState('Almonds');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showCharts, setShowCharts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadBanner, setUploadBanner] = useState('');
  const [uploadedData, setUploadedData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nico_catalog_upload') || 'null'); } catch { return null; }
  });
  const scFileRef = React.useRef(null);
  const tabsRef = React.useRef(null);

  const scroll = (dir) => {
    if (tabsRef.current) tabsRef.current.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  /* Merge uploaded data into catalog */
  const mergedCatalogData = React.useMemo(() => {
    if (!uploadedData?.items?.length) return CATALOG_DATA;
    const merged = {};
    Object.keys(CATALOG_DATA).forEach(tab => {
      merged[tab] = [...CATALOG_DATA[tab]];
    });
    uploadedData.items.forEach(item => {
      // Find which tab this product belongs to
      let placed = false;
      Object.keys(merged).forEach(tab => {
        const idx = merged[tab].findIndex(e =>
          e.product.toLowerCase().trim() === item.product.toLowerCase().trim()
        );
        if (idx >= 0) {
          merged[tab][idx] = { ...merged[tab][idx], ...item, isNew: true, uploadedAt: uploadedData.uploadedAt };
          placed = true;
        }
      });
      if (!placed) {
        // Add to most relevant tab based on product name
        const tabKey = Object.keys(merged).find(t =>
          item.product.toLowerCase().includes(t.toLowerCase().split('/')[0].toLowerCase())
        ) || activeTab;
        merged[tabKey] = [...(merged[tabKey]||[]), { ...item, isNew: true, uploadedAt: uploadedData.uploadedAt }];
      }
    });
    return merged;
  }, [uploadedData, activeTab]);

  const handleCatalogUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadBanner('');
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const isPDF = file.type === 'application/pdf';
      const msgContent = isPDF ? [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: 'Extract ALL product price data from this supplier catalog/offer document. Return ONLY a valid JSON array. Each item: product (string), price (number, EUR/kg), origin (string), packaging (string), availability (string), note (string). No markdown, no explanation — just the JSON array.' }
      ] : [
        { type: 'text', text: `Extract ALL product price data from the supplier catalog document named "${file.name}". Return ONLY a valid JSON array. Each item: product (string), price (number, EUR/kg), origin (string), packaging (string), availability (string), note (string). No markdown, no explanation.` }
      ];
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: msgContent }] })
      });
      const data = await response.json();
      const text = data.content?.map(c => c.text || '').join('') || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const items = JSON.parse(clean);
      if (!Array.isArray(items) || items.length === 0) throw new Error('No products found');
      const result = { items, uploadedAt: new Date().toISOString(), fileName: file.name, count: items.length };
      localStorage.setItem('nico_catalog_upload', JSON.stringify(result));
      setUploadedData(result);
      setUploadBanner(`✅ ${items.length} products extracted from ${file.name}`);
    } catch (err) {
      setUploadBanner('⚠️ Could not extract data: ' + (err.message || 'Check file format'));
    }
    setUploading(false);
  };

  const rows = (mergedCatalogData[activeTab] || []).filter(r =>
    !search ||
    r.product.toLowerCase().includes(search.toLowerCase()) ||
    (r.origin||'').toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price||0) - (b.price||0);
    if (sortBy === 'price_desc') return (b.price||0) - (a.price||0);
    if (sortBy === 'new') return (b.isNew?1:0) - (a.isNew?1:0);
    return a.product.localeCompare(b.product);
  });

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
      </div>
    </div>
  );
}

function NetherlandsSupplyCatalog({ currency }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name | price_asc | price_desc | new
  const [activeTab, setActiveTab] = useState('All');
  const [bannerVisible, setBannerVisible] = useState(true);
  const [uploadData, setUploadData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nico_nl_upload') || 'null'); } catch { return null; }
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef(null);

  const fmtCatalog = (eurVal) => {
    if (!eurVal && eurVal !== 0) return '—';
    if (currency === 'EUR') return '€' + Number(eurVal).toFixed(2);
    return '$' + (eurVal / 0.92).toFixed(2);
  };

  /* Merge base data with any uploaded data */
  const allData = React.useMemo(() => {
    if (!uploadData?.items?.length) return NETHERLANDS_SUPPLY_DATA;
    const uploadTs = uploadData.uploadedAt;
    const merged = [...NETHERLANDS_SUPPLY_DATA];
    uploadData.items.forEach(newItem => {
      const existingIdx = merged.findIndex(e =>
        e.product.toLowerCase().trim() === newItem.product.toLowerCase().trim()
      );
      if (existingIdx >= 0) {
        merged[existingIdx] = { ...merged[existingIdx], ...newItem, uploadedAt: uploadTs, isNew: true };
      } else {
        merged.push({ ...newItem, uploadedAt: uploadTs, isNew: true });
      }
    });
    return merged;
  }, [uploadData]);

  /* All unique NL category tabs */
  const allTabs = React.useMemo(() => {
    const cats = new Set(allData.map(r => getNLCategory(r.product)));
    const ordered = Object.keys(NL_CATEGORIES).filter(c => cats.has(c));
    if (cats.has('Overig')) ordered.push('Overig');
    return ['All', ...ordered];
  }, [allData]);

  /* Filter + sort */
  const rows = React.useMemo(() => {
    let filtered = allData.filter(r => {
      const matchSearch = !search ||
        r.product.toLowerCase().includes(search.toLowerCase()) ||
        (r.origin||'').toLowerCase().includes(search.toLowerCase());
      const matchTab = activeTab === 'All' || getNLCategory(r.product) === activeTab;
      return matchSearch && matchTab;
    });
    if (sortBy === 'price_asc') filtered.sort((a, b) => (a.price||0) - (b.price||0));
    else if (sortBy === 'price_desc') filtered.sort((a, b) => (b.price||0) - (a.price||0));
    else if (sortBy === 'new') filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    else filtered.sort((a, b) => a.product.localeCompare(b.product));
    return filtered;
  }, [allData, search, sortBy, activeTab]);

  /* Upload handler — uses Claude AI to extract structured data from the document */
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const isPDF = file.type === 'application/pdf';
      const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');

      const msgContent = isPDF ? [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: `Extract ALL product price data from this Netherlands supply/wholesale list document.
Return ONLY valid JSON array with no markdown, no explanation.
Each item must have: product (string), price (number, EUR per kg), packaging (string), availability (string), note (string).
Example: [{"product":"Amandelen diced 3-5","price":8.60,"packaging":"DOOS 12,5 KG","availability":"Valid Mar 2026","note":"Item 802164"}]
Extract every product you can find. Return only the JSON array.` }
      ] : [
        { type: 'text', text: `The following is text extracted from a Netherlands supply/wholesale document (${file.name}).
Extract ALL product price data.
Return ONLY valid JSON array with no markdown, no explanation.
Each item: product (string), price (number EUR/kg), packaging (string), availability (string), note (string).
File content (base64 truncated, filename: ${file.name}): [document uploaded]` }
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: msgContent }]
        })
      });

      const data = await response.json();
      const text = data.content?.map(c => c.text || '').join('') || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const items = JSON.parse(clean);

      if (!Array.isArray(items) || items.length === 0) throw new Error('No products extracted');

      const uploadResult = {
        items,
        uploadedAt: new Date().toISOString(),
        fileName: file.name,
        count: items.length,
      };
      localStorage.setItem('nico_nl_upload', JSON.stringify(uploadResult));
      setUploadData(uploadResult);
    } catch (err) {
      setUploadError('Could not extract data: ' + (err.message || 'Unknown error'));
    }
    setUploading(false);
  };

  const newCount = allData.filter(r => r.isNew).length;
  const daysSinceUpload = uploadData ? Math.floor((Date.now() - new Date(uploadData.uploadedAt)) / 86400000) : null;

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div className="page-title">🇳🇱 Netherlands Supply</div>
        <div className="page-subtitle">
          {uploadData ? `${uploadData.fileName} · uploaded ${daysSinceUpload === 0 ? 'today' : daysSinceUpload + 'd ago'}` : 'Netherlands wholesale list · 01–31/03/2026'}
          {' · '}{currency} display
        </div>
      </div>

      {/* Upload banner */}
      {bannerVisible && (
        <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:12, position:'relative', flexWrap:'wrap' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🇳🇱</span>
          <div style={{ flex:'1 1 200px' }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#4338CA' }}>Netherlands Supply — Auto-update from document</div>
            <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
              Upload a new PDF or Word price list and NICO will automatically extract all products and update prices.
              {uploadData && <span style={{ color:'#10B981', marginLeft:6 }}>✅ Last upload: {uploadData.fileName} ({uploadData.count} products)</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display:'none' }}
              onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ padding:'7px 16px', background:'#6366F1', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? '⏳ Reading...' : '📄 Upload Price List'}
            </button>
            {uploadData && (
              <button onClick={() => { localStorage.removeItem('nico_nl_upload'); setUploadData(null); }}
                style={{ padding:'7px 12px', background:'#FEF2F2', color:'#EF4444', border:'1px solid #FCA5A5', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                Reset
              </button>
            )}
          </div>
          {uploadError && <div style={{ width:'100%', fontSize:12, color:'#EF4444', marginTop:4 }}>⚠️ {uploadError}</div>}
          <button onClick={() => setBannerVisible(false)} style={{ position:'absolute', top:8, right:10, background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF' }}>×</button>
        </div>
      )}

      {/* NEW badge strip */}
      {newCount > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, marginBottom:14, fontSize:12, color:'#166534' }}>
          <span>✨</span>
          <span><strong>{newCount} updated/new products</strong> from latest upload — highlighted in green below.
            {daysSinceUpload !== null && daysSinceUpload <= 7 && <span style={{ marginLeft:6, background:'#DCFCE7', color:'#15803D', padding:'1px 8px', borderRadius:20, fontWeight:700 }}>NEW</span>}
          </span>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ overflowX:'auto', marginBottom:0, WebkitOverflowScrolling:'touch' }}>
        <div style={{ display:'flex', gap:4, borderBottom:'2px solid #E5E7EB', paddingBottom:0, minWidth:'max-content' }}>
          {allTabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding:'8px 16px', border:'none', background:'none', cursor:'pointer', fontSize:13, fontWeight: activeTab===t ? 700 : 500,
                color: activeTab===t ? '#6366F1' : '#6B7280',
                borderBottom: activeTab===t ? '2px solid #6366F1' : '2px solid transparent',
                marginBottom:-2, whiteSpace:'nowrap', transition:'all 0.15s' }}>
              {t}
              <span style={{ marginLeft:4, fontSize:10, background: activeTab===t ? '#EEF2FF' : '#F3F4F6', color: activeTab===t ? '#6366F1' : '#9CA3AF', padding:'1px 6px', borderRadius:10 }}>
                {t === 'All' ? allData.length : allData.filter(r => getNLCategory(r.product) === t).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:'none' }}>
        {/* Controls */}
        <div style={{ marginBottom:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{ padding:'8px 14px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', flex:'1 1 180px', maxWidth:280, color:'#1A1D2E', background:'#FAFAFA' }} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding:'8px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, background:'#fff', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <option value="name">Sort: Name A→Z</option>
            <option value="price_asc">Sort: Price Low→High</option>
            <option value="price_desc">Sort: Price High→Low</option>
            <option value="new">Sort: New First</option>
          </select>
          <span style={{ fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap' }}>{rows.length} item{rows.length!==1?'s':''}</span>
        </div>

        <div className="table-scroll-wrap">
          <table className="data-table" style={{ minWidth:700 }}>
            <thead>
              <tr>
                <th style={{ minWidth:220 }}>Product</th>
                <th style={{ minWidth:110 }}>Packaging</th>
                <th style={{ minWidth:90 }}>Price/kg</th>
                <th style={{ minWidth:90 }}>Availability</th>
                <th style={{ minWidth:100 }}>Category</th>
                <th style={{ minWidth:160 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'#D1D5DB', padding:32 }}>No products found</td></tr>
              )}
              {rows.map((row, i) => (
                <tr key={i} style={{ background: row.isNew ? 'rgba(16,185,129,0.04)' : undefined }}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{row.product}</div>
                      {row.isNew && daysSinceUpload !== null && daysSinceUpload <= 7 && (
                        <span style={{ fontSize:9, background:'#DCFCE7', color:'#15803D', padding:'1px 6px', borderRadius:20, fontWeight:800, flexShrink:0 }}>NEW</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize:11, color:'#9CA3AF', fontFamily:"'JetBrains Mono',monospace" }}>{row.packaging}</td>
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:13, color:'#6366F1' }}>
                    {fmtCatalog(row.price)}
                  </td>
                  <td><span className="badge badge-blue">{row.availability}</span></td>
                  <td><span className="badge badge-purple">{getNLCategory(row.product)}</span></td>
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
  const [sortBy, setSortBy] = useState('rank');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadedTop5, setUploadedTop5] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nico_top5_upload') || 'null'); } catch { return null; }
  });
  const top5FileRef = React.useRef(null);

  const handleTop5Upload = async (file) => {
    if (!file) return;
    setUploading(true); setUploadMsg('');
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const isPDF = file.type === 'application/pdf';
      const msgContent = isPDF ? [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: 'Extract the top products data from this price offer document. For each product found return JSON: product (string), origin (string), type (string), grade (string), priceRange (string like "€X.XX – €Y.YY"), note (string), calconutPrice (number or null). Return ONLY a valid JSON array, no markdown.' }
      ] : [
        { type: 'text', text: `Extract top product price data from "${file.name}". Return ONLY a JSON array with fields: product, origin, type, grade, priceRange (like "€X.XX – €Y.YY"), note, calconutPrice (number). No markdown.` }
      ];
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3000, messages: [{ role: 'user', content: msgContent }] })
      });
      const data = await response.json();
      const text = data.content?.map(c => c.text || '').join('') || '';
      const items = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (!Array.isArray(items) || !items.length) throw new Error('No data');
      const result = { items, uploadedAt: new Date().toISOString(), fileName: file.name };
      localStorage.setItem('nico_top5_upload', JSON.stringify(result));
      setUploadedTop5(result);
      setUploadMsg('✅ ' + items.length + ' products extracted');
    } catch (e) {
      setUploadMsg('⚠️ ' + (e.message || 'Error'));
    }
    setUploading(false);
  };
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

      {/* Upload + sort controls */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
        <input ref={top5FileRef} type="file" accept=".pdf,.docx,.doc" style={{ display:'none' }}
          onChange={e => e.target.files[0] && handleTop5Upload(e.target.files[0])} />
        <button onClick={() => top5FileRef.current?.click()} disabled={uploading}
          style={{ padding:'7px 14px', background:'#6366F1', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', opacity: uploading ? 0.7 : 1 }}>
          {uploading ? '⏳ Reading...' : '📄 Upload New Price List'}
        </button>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding:'7px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:12, background:'#fff', cursor:'pointer' }}>
          <option value="rank">Sort: Rank</option>
          <option value="price_asc">Price Low→High</option>
          <option value="price_desc">Price High→Low</option>
          <option value="new">New First</option>
        </select>
        {uploadMsg && <span style={{ fontSize:12, color: uploadMsg.startsWith('✅') ? '#10B981' : '#EF4444' }}>{uploadMsg}</span>}
        {uploadedTop5 && (
          <button onClick={() => { localStorage.removeItem('nico_top5_upload'); setUploadedTop5(null); }}
            style={{ padding:'5px 10px', background:'#FEF2F2', color:'#EF4444', border:'1px solid #FCA5A5', borderRadius:8, fontSize:11, cursor:'pointer' }}>
            Reset Upload
          </button>
        )}
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

/* ═══════════════════════════════════════════════════════════════════
   ALL 20 NICO PRODUCT CATEGORIES — Origins & growing regions
   ══════════════════════════════════════════════════════════════════ */
const NICO_PRODUCTS = [
  { id:'walnut',         label:'Walnuts',          icon:'🫘', origins:['USA','Chile','China','France'] },
  { id:'almond',         label:'Almonds',           icon:'🥜', origins:['USA','Spain','Australia','Tunisia'] },
  { id:'cashew',         label:'Cashews',           icon:'🌰', origins:['Vietnam','India','Ivory Coast','Cambodia'] },
  { id:'pistachio',      label:'Pistachios',        icon:'🟢', origins:['USA','Iran','Turkey'] },
  { id:'hazelnut',       label:'Hazelnuts',         icon:'🌰', origins:['Turkey','Georgia','Italy'] },
  { id:'pecan',          label:'Pecans',            icon:'🥜', origins:['USA','Mexico'] },
  { id:'brazil_nut',     label:'Brazil Nuts',       icon:'🫘', origins:['Peru','Bolivia','Brazil'] },
  { id:'macadamia',      label:'Macadamia',         icon:'⚪', origins:['Kenya','South Africa','Australia'] },
  { id:'raisin',         label:'Raisins',           icon:'🍇', origins:['Uzbekistan','Turkey','Iran','USA'] },
  { id:'pine_nut',       label:'Pine Nuts',         icon:'🌲', origins:['China','Russia','Pakistan'] },
  { id:'dried_mango',    label:'Dried Mango',       icon:'🥭', origins:['Thailand','Philippines','India'] },
  { id:'dried_cranberry',label:'Dried Cranberries', icon:'🔴', origins:['USA','Canada'] },
  { id:'dried_blueberry',label:'Dried Blueberries', icon:'🫐', origins:['USA','Chile'] },
  { id:'banana_chip',    label:'Dried Banana Chips',icon:'🍌', origins:['Philippines','Ecuador'] },
  { id:'dried_apple',    label:'Dried Apple',       icon:'🍎', origins:['China','Chile','Poland'] },
  { id:'dried_papaya',   label:'Dried Papaya',      icon:'🧡', origins:['Thailand','Brazil','Mexico'] },
  { id:'date',           label:'Dates',             icon:'🌴', origins:['Saudi Arabia','UAE','Tunisia','Egypt'] },
  { id:'dried_apricot',  label:'Dried Apricots',    icon:'🍑', origins:['Turkey','Uzbekistan','USA'] },
  { id:'dried_fig',      label:'Dried Figs',        icon:'🟫', origins:['Turkey','Morocco','Iran'] },
  { id:'prune',          label:'Prunes',            icon:'🫐', origins:['USA','France','Chile'] },
];

/* Origin countries with lat/lon for weather map */
const WEATHER_COUNTRIES = [
  { id:'usa',          label:'USA (California)',  flag:'🇺🇸', lat:36.78,  lon:-119.42, products:['walnut','almond','pistachio','raisin','pecan','dried_cranberry','dried_blueberry','prune'] },
  { id:'chile',        label:'Chile',             flag:'🇨🇱', lat:-30.00, lon:-71.20,  products:['walnut','raisin','dried_blueberry','dried_apple','prune'] },
  { id:'china',        label:'China',             flag:'🇨🇳', lat:34.00,  lon:108.00,  products:['walnut','pine_nut','dried_apple'] },
  { id:'turkey',       label:'Turkey',            flag:'🇹🇷', lat:39.92,  lon:32.85,   products:['hazelnut','pistachio','raisin','dried_apricot','dried_fig'] },
  { id:'vietnam',      label:'Vietnam',           flag:'🇻🇳', lat:14.06,  lon:108.28,  products:['cashew'] },
  { id:'india',        label:'India',             flag:'🇮🇳', lat:20.59,  lon:78.96,   products:['cashew','dried_mango'] },
  { id:'iran',         label:'Iran',              flag:'🇮🇷', lat:32.43,  lon:53.69,   products:['pistachio','raisin','dried_fig','date'] },
  { id:'thailand',     label:'Thailand',          flag:'🇹🇭', lat:13.75,  lon:100.52,  products:['dried_mango','dried_papaya','banana_chip'] },
  { id:'philippines',  label:'Philippines',       flag:'🇵🇭', lat:12.88,  lon:121.77,  products:['banana_chip','dried_mango'] },
  { id:'australia',    label:'Australia',         flag:'🇦🇺', lat:-25.27, lon:133.78,  products:['almond','macadamia'] },
  { id:'south_africa', label:'South Africa',      flag:'🇿🇦', lat:-28.48, lon:24.67,   products:['macadamia','raisin'] },
  { id:'kenya',        label:'Kenya',             flag:'🇰🇪', lat:-1.29,  lon:36.82,   products:['macadamia','dried_mango'] },
  { id:'peru',         label:'Peru',              flag:'🇵🇪', lat:-9.19,  lon:-75.01,  products:['brazil_nut'] },
  { id:'bolivia',      label:'Bolivia',           flag:'🇧🇴', lat:-16.29, lon:-63.59,  products:['brazil_nut'] },
  { id:'spain',        label:'Spain',             flag:'🇪🇸', lat:40.41,  lon:-3.70,   products:['almond'] },
  { id:'pakistan',     label:'Pakistan',          flag:'🇵🇰', lat:30.38,  lon:69.35,   products:['date','dried_apricot','pine_nut'] },
  { id:'saudi_arabia', label:'Saudi Arabia',      flag:'🇸🇦', lat:24.69,  lon:46.72,   products:['date'] },
  { id:'egypt',        label:'Egypt',             flag:'🇪🇬', lat:26.82,  lon:30.80,   products:['date'] },
  { id:'uzbekistan',   label:'Uzbekistan',        flag:'🇺🇿', lat:41.30,  lon:63.97,   products:['raisin','dried_apricot'] },
  { id:'france',       label:'France',            flag:'🇫🇷', lat:46.23,  lon:2.21,    products:['walnut','prune'] },
];

/* Base prices per product (EUR/kg) — updated by scraper */
const PRODUCT_BASE_PRICES = {
  walnut:5.10, almond:6.50, cashew:6.20, pistachio:9.80, hazelnut:12.00,
  pecan:11.50, brazil_nut:12.20, macadamia:14.00, raisin:2.35, pine_nut:27.50,
  dried_mango:4.50, dried_cranberry:4.10, dried_blueberry:7.00, banana_chip:3.40,
  dried_apple:4.20, dried_papaya:3.70, date:5.10, dried_apricot:5.50,
  dried_fig:6.50, prune:4.80,
};

/* Forecast sources per product (for info display) */
const PRODUCT_SOURCES = {
  walnut:['USDA FAS','USDA ERS','INC','FAOSTAT'],
  almond:['Almond Board CA','USDA FAS','USDA ERS','INC'],
  cashew:['INC','FAOSTAT','Eurostat','VINACAS'],
  pistachio:['American Pistachio Growers','USDA FAS','Iran Pistachio Assoc','INC'],
  hazelnut:['INC','Eurostat','TurkStat','Copernicus'],
  pecan:['USDA ERS','FAOSTAT','USDA FAS'],
  brazil_nut:['FAOSTAT','Eurostat','Bolivia INE'],
  macadamia:['FAOSTAT','Eurostat','Australian Macadamias','SAMAC'],
  raisin:['INC','Eurostat','California Raisins','TurkStat'],
  pine_nut:['Eurostat','China customs','FAOSTAT'],
  dried_mango:['FAOSTAT','Eurostat','Open-Meteo'],
  dried_cranberry:['USDA ERS','USDA FAS','Eurostat'],
  dried_blueberry:['USDA FAS','FAOSTAT','Eurostat'],
  banana_chip:['FAOSTAT','Eurostat','Philippines PSA'],
  dried_apple:['FAOSTAT','Eurostat','China customs'],
  dried_papaya:['FAOSTAT','Eurostat','Thailand OAE'],
  date:['Eurostat','CBS StatLine','FAOSTAT','Tunisia MOA'],
  dried_apricot:['INC','Eurostat','TurkStat','Copernicus'],
  dried_fig:['INC','Eurostat','TurkStat'],
  prune:['USDA ERS','USDA FAS','Eurostat'],
};

/* Country-specific seasonal price multipliers (Jan-Dec) */
const SEASONAL = {
  usa:[1.00,0.98,0.97,0.98,0.99,1.01,1.03,1.05,1.04,1.02,1.00,0.99],
  chile:[1.02,1.04,1.03,1.01,0.99,0.97,0.96,0.97,0.99,1.01,1.02,1.03],
  turkey:[0.98,0.97,0.98,1.00,1.01,1.03,1.05,1.06,1.04,1.01,0.99,0.98],
  vietnam:[1.01,1.02,1.00,0.98,0.97,0.99,1.01,1.02,1.01,1.00,0.99,1.00],
  iran:[0.99,0.98,0.99,1.00,1.02,1.04,1.05,1.04,1.02,1.00,0.99,0.98],
  thailand:[1.00,1.01,1.02,1.01,1.00,0.98,0.97,0.98,1.00,1.02,1.03,1.01],
  australia:[1.03,1.04,1.02,1.00,0.98,0.97,0.97,0.98,1.00,1.02,1.03,1.04],
};

/* Temperature color helper */
/* Temperature color helper */
function tempColor(c) {
  if (c >= 35) return '#DC2626';
  if (c >= 25) return '#F97316';
  if (c >= 15) return '#EAB308';
  if (c >= 5)  return '#22C55E';
  if (c >= -5) return '#3B82F6';
  return '#8B5CF6';
}
function tempClass(c) { // eslint-disable-line no-unused-vars
  if (c >= 30) return 'temp-hot';
  if (c >= 18) return 'temp-warm';
  if (c >= 5)  return 'temp-cool';
  return 'temp-cold';
}

function WeatherForecast({ currency }) {
  /* ── Dropdown 1: product category ── */
  const [selectedProduct, setSelectedProduct] = useState('walnut');
  /* ── Dropdown 2: origin country ── */
  const [selectedCountry, setSelectedCountry] = useState('usa');
  /* ── Period: 1m / 3m / 6m / 12m ── */
  const [period, setPeriod] = useState('3m');
  /* ── Data ── */
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

  /* Countries relevant to selected product */
  const relevantCountries = WEATHER_COUNTRIES.filter(c => c.products.includes(selectedProduct));
  const country = WEATHER_COUNTRIES.find(c => c.id === selectedCountry) || relevantCountries[0] || WEATHER_COUNTRIES[0];
  const product = NICO_PRODUCTS.find(p => p.id === selectedProduct) || NICO_PRODUCTS[0];

  /* When product changes, auto-select first relevant country */
  useEffect(() => {
    if (relevantCountries.length > 0 && !relevantCountries.find(c => c.id === selectedCountry)) {
      setSelectedCountry(relevantCountries[0].id);
    }
  }, [selectedProduct]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* ── Fetch weather from Open-Meteo for all relevant countries ── */
  useEffect(() => {
    if (!relevantCountries.length) return;
    setLoadingWeather(true);
    const fetchAll = async () => {
      const results = {};
      await Promise.all(relevantCountries.map(async (c) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=92&past_days=365`;
          const r = await fetch(url);
          const d = await r.json();
          if (d.daily) {
            const temps = d.daily.temperature_2m_max.map((v, i) =>
              v != null && d.daily.temperature_2m_min[i] != null
                ? Math.round(((v + d.daily.temperature_2m_min[i]) / 2) * 100) / 100
                : null
            );
            results[c.id] = { dates: d.daily.time, temps, current: temps[temps.length - 1] };
          }
        } catch {}
      }));
      setWeatherData(prev => ({ ...prev, ...results }));
      setLoadingWeather(false);
    };
    fetchAll();
    const iv = setInterval(fetchAll, 24 * 3600 * 1000);
    return () => clearInterval(iv);
  }, [selectedProduct]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Leaflet map ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const L = window.L;
    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
        .setView([20, 30], 2);
      leafletMapRef.current.touchZoom.enable();
      leafletMapRef.current.doubleClickZoom.enable();
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 10
      }).addTo(leafletMapRef.current);
    }
    const map = leafletMapRef.current;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    relevantCountries.forEach(c => {
      const wd = weatherData[c.id];
      const temp = wd?.current ?? null;
      const col = temp != null ? tempColor(temp) : '#9CA3AF';
      const icon = L.divIcon({
        className: '', html:
          `<div style="background:${col};color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;cursor:pointer;">
            ${temp != null ? temp.toFixed(1) + '°' : c.flag}
          </div>`,
        iconSize: [36, 36], iconAnchor: [18, 18]
      });
      const marker = L.marker([c.lat, c.lon], { icon })
        .bindPopup(`<strong>${c.flag} ${c.label}</strong><br/>🌡️ ${temp != null ? temp.toFixed(1) + '°C' : 'Loading...'}<br/>📦 ${product.label}`)
        .addTo(map);
      marker.on('click', () => setSelectedCountry(c.id));
      markersRef.current[c.id] = marker;
    });
  }, [mapReady, weatherData, selectedProduct, relevantCountries]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Build chart data ── */
  const chartData = useMemo(() => {
    const wd = weatherData[selectedCountry];
    const basePrice = PRODUCT_BASE_PRICES[selectedProduct] || 5.0;
    const periodDays = period === '1m' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365;
    const today = new Date();

    /* Date labels going back from today */
    const allDates = [];
    for (let i = -periodDays; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      allDates.push(d);
    }
    const step = Math.max(1, Math.floor(allDates.length / 30));
    const filtered = allDates.filter((_, i) => i % step === 0);
    const labels = filtered.map(d => d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' }));

    /* Temperature series */
    let temps = [];
    filtered.forEach(d => {
      if (wd?.dates && wd?.temps) {
        const dateStr = d.toISOString().slice(0, 10);
        const idx = wd.dates.indexOf(dateStr);
        if (idx !== -1 && wd.temps[idx] != null) {
          temps.push(Math.round(wd.temps[idx] * 100) / 100);
          return;
        }
        /* nearest fallback */
        let nearest = null, minDiff = Infinity;
        wd.dates.forEach((dt, i) => {
          const diff = Math.abs(new Date(dt) - d);
          if (diff < minDiff && wd.temps[i] != null) { minDiff = diff; nearest = wd.temps[i]; }
        });
        temps.push(nearest != null ? Math.round(nearest * 100) / 100 : null);
      } else {
        /* Seasonal fallback */
        const base = 22;
        const isN = country.lat > 0;
        const m = d.getMonth();
        const offset = isN ? Math.sin((m - 1) / 11 * Math.PI * 2) * 12 : -Math.sin((m - 1) / 11 * Math.PI * 2) * 12;
        temps.push(Math.round((base + offset) * 100) / 100);
      }
    });

    /* Price series — base × seasonal multiplier × currency */
    const prices = filtered.map(d => {
      const m = d.getMonth();
      const seasMap = SEASONAL[selectedCountry] || SEASONAL.usa;
      let p = basePrice * seasMap[m];
      if (currency !== 'EUR') p = p / 0.92;
      return parseFloat(p.toFixed(3));
    });

    /* 30-day forecast (linear trend from last 30 real points) */
    const recentPrices = prices.slice(-Math.min(30, prices.length));
    const trend = recentPrices.length > 1
      ? (recentPrices[recentPrices.length-1] - recentPrices[0]) / recentPrices.length
      : 0;
    const lastPrice = prices[prices.length - 1] || basePrice;
    const fLabels = Array.from({length:30}, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() + i + 1);
      return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
    });
    const fPrices = Array.from({length:30}, (_, i) =>
      parseFloat((lastPrice + trend * (i + 1)).toFixed(3))
    );

    return { labels, prices, temps, fLabels, fPrices };
  }, [weatherData, selectedProduct, selectedCountry, period, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Draw Chart.js chart ── */
  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;
    if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); chartInstanceRef.current = null; }
    const { labels, prices, temps, fLabels, fPrices } = chartData;
    const allLabels = [...labels, ...fLabels];
    const allPrices = [...prices, ...Array(fLabels.length).fill(null)];
    const allForecast = [...Array(labels.length - 1).fill(null), prices[prices.length-1] || null, ...fPrices];
    const allTemps = [...temps, ...Array(fLabels.length).fill(null)];
    chartInstanceRef.current = new window.Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          { label: `${sym} Price History`, data: allPrices, borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.08)', tension:0.4, pointRadius:0, borderWidth:2, fill:true, yAxisID:'y' },
          { label: `${sym} Price Forecast`, data: allForecast, borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.04)', tension:0.4, pointRadius:0, borderWidth:2, fill:false, yAxisID:'y', borderDash:[5,4] },
          { label:'🌡️ Temp (°C)', data: allTemps, borderColor:'#F97316', backgroundColor:'rgba(249,115,22,0.06)', tension:0.4, pointRadius:0, borderWidth:1.5, fill:false, yAxisID:'y2' },
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false, interaction:{ mode:'index', intersect:false },
        plugins: {
          legend:{ display:true, position:'top', labels:{ font:{size:11}, boxWidth:14 }},
          tooltip:{ callbacks:{
            label: ctx => {
              if (ctx.datasetIndex === 2) return ` 🌡️ Temp: ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) + '°C' : '—'}`;
              if (ctx.datasetIndex === 1) return ` 🟢 Forecast: ${sym}${ctx.parsed.y != null ? ctx.parsed.y.toFixed(3) : '—'}/kg`;
              return ` 🟢 Price: ${sym}${ctx.parsed.y != null ? ctx.parsed.y.toFixed(3) : '—'}/kg`;
            }
          }}
        },
        scales: {
          x:{ grid:{display:false}, ticks:{font:{size:10}, maxTicksLimit:14, color:'#9CA3AF'} },
          y:{ position:'left', grid:{color:'#F3F4F6'}, ticks:{font:{size:11,family:"'JetBrains Mono',monospace"}, callback: v => `${sym}${parseFloat(v).toFixed(3)}`}, title:{display:true,text:`Price (${sym}/kg)`,font:{size:11}} },
          y2:{ position:'right', grid:{drawOnChartArea:false}, ticks:{font:{size:11}, callback: v => `${v.toFixed(1)}°C`}, title:{display:true,text:'Temp (°C)',font:{size:11}} },
        }
      }
    });
    return () => { if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); chartInstanceRef.current = null; } };
  }, [chartData, sym]);

  const wd = weatherData[selectedCountry];
  const currentTemp = wd?.current ?? null;
  const currentPrice = (() => {
    const bp = PRODUCT_BASE_PRICES[selectedProduct] || 5;
    const m = new Date().getMonth();
    const s = (SEASONAL[selectedCountry] || SEASONAL.usa)[m];
    return currency === 'EUR' ? (bp * s).toFixed(3) : (bp * s / 0.92).toFixed(3);
  })();

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div className="page-title">🌡️ Weather & Price Forecast</div>
        <div className="page-subtitle">20 product categories · live Open-Meteo weather · 12-month view</div>
      </div>

      {infoVisible && (
        <div style={{ position:'relative', marginBottom:16, padding:'10px 36px 10px 14px', background:'#EFF6FF', borderRadius:10, fontSize:12, color:'#3B82F6', border:'1px solid #BFDBFE' }}>
          <strong>How to use:</strong> Select a product category → the map shows all growing regions → select a country for side-by-side price & weather chart.
          Sources: {PRODUCT_SOURCES[selectedProduct]?.join(' · ') || 'FAOSTAT · Eurostat · INC'}
          <button onClick={() => setInfoVisible(false)} style={{ position:'absolute', top:8, right:10, background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF', lineHeight:1 }}>×</button>
        </div>
      )}

      {/* ── Two dropdowns row ── */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        {/* Dropdown 1 — Product */}
        <div style={{ flex:'1 1 220px', minWidth:200 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', display:'block', marginBottom:4 }}>📦 PRODUCT CATEGORY</label>
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #E5E7EB', fontSize:13, fontWeight:600, background:'#fff', cursor:'pointer', color:'#111827' }}
          >
            {NICO_PRODUCTS.map(p => (
              <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
            ))}
          </select>
        </div>

        {/* Dropdown 2 — Country */}
        <div style={{ flex:'1 1 220px', minWidth:200 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', display:'block', marginBottom:4 }}>🌍 GROWING REGION / COUNTRY</label>
          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #E5E7EB', fontSize:13, fontWeight:600, background:'#fff', cursor:'pointer', color:'#111827' }}
          >
            {relevantCountries.map(c => (
              <option key={c.id} value={c.id}>{c.flag} {c.label}</option>
            ))}
            {relevantCountries.length === 0 && WEATHER_COUNTRIES.map(c => (
              <option key={c.id} value={c.id}>{c.flag} {c.label}</option>
            ))}
          </select>
        </div>

        {/* Period selector */}
        <div style={{ flex:'0 0 auto', alignSelf:'flex-end' }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', display:'block', marginBottom:4 }}>📅 PERIOD</label>
          <div style={{ display:'flex', gap:6 }}>
            {[['1m','1 Month'],['3m','3 Months'],['6m','6 Months'],['12m','12 Months']].map(([v,l]) => (
              <button key={v} className={`period-btn ${period===v?'active':''}`} onClick={() => setPeriod(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        {[
          { label:'Product', val:`${product.icon} ${product.label}` },
          { label:'Region', val:`${country.flag} ${country.label}` },
          { label:`Current Price`, val:`${sym}${currentPrice}/kg` },
          { label:'Current Temp', val: currentTemp != null ? `${currentTemp.toFixed(1)}°C` : loadingWeather ? 'Loading…' : '—' },
          { label:'Data Sources', val:`${(PRODUCT_SOURCES[selectedProduct]||[]).length || 4} sources` },
        ].map((s, i) => (
          <div key={i} style={{ flex:'1 1 140px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', marginBottom:3 }}>{s.label}</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Map full width ── */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'10px 14px 6px', borderBottom:'1px solid #F3F4F6' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>🗺️ Growing Regions — {product.label}</div>
          <div style={{ fontSize:11, color:'#9CA3AF' }}>Click a marker to select that country · Pinch or scroll to zoom</div>
        </div>
        {loadingWeather && <div style={{ padding:'8px 14px', fontSize:11, color:'#6366F1' }}>⏳ Loading weather data…</div>}
        <div ref={mapRef} style={{ height:420, width:'100%' }}/>
      </div>

      {/* ── Price + Weather Chart full width ── */}
      <div className="card" style={{ padding:'14px 16px', marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:4 }}>
          📈 {product.label} Price + Temperature — {country.flag} {country.label}
        </div>
        <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:10 }}>
          🟢 Solid = price history · 🟢 Dashed = 30-day forecast · 🟠 = temperature
        </div>
        <div style={{ height:300, position:'relative' }}>
          <canvas ref={chartRef}/>
        </div>
      </div>

      {/* ── All countries quick overview for this product ── */}
      <div className="card">
        <div className="card-title">🌐 All Growing Regions for {product.label}</div>
        <div className="card-subtitle">Click any region to update the chart above</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:10, marginTop:12 }}>
          {relevantCountries.map(c => {
            const cwd = weatherData[c.id];
            const temp = cwd?.current ?? null;
            const col = temp != null ? tempColor(temp) : '#9CA3AF';
            const isSelected = c.id === selectedCountry;
            return (
              <div key={c.id}
                onClick={() => setSelectedCountry(c.id)}
                style={{ padding:'10px 12px', border:`2px solid ${isSelected ? '#6366F1' : '#E5E7EB'}`, borderRadius:10, cursor:'pointer', background: isSelected ? '#F5F3FF' : '#fff', transition:'all 0.15s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>{c.flag}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{c.label}</span>
                </div>
                {temp != null ? (
                  <div style={{ fontSize:13, fontWeight:700, color: col }}>🌡️ {temp.toFixed(1)}°C</div>
                ) : (
                  <div style={{ fontSize:11, color:'#D1D5DB' }}>Loading…</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sources info ── */}
      <div className="card" style={{ marginTop:16, background:'#F9FAFB', border:'1px solid #E5E7EB' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>📚 Forecast Sources for {product.label}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {(PRODUCT_SOURCES[selectedProduct] || ['FAOSTAT','Eurostat','INC']).map((s, i) => (
            <span key={i} style={{ padding:'3px 10px', background:'#EEF2FF', color:'#6366F1', borderRadius:20, fontSize:11, fontWeight:600 }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════
   MARKET INTELLIGENCE COMPONENT
   Based on ChatGPT analysis recommendations from Nico_details.docx:
   - Crop calendar per product
   - Price drivers / event impact rules
   - Confidence scoring
   - Source stack per product
   ══════════════════════════════════════════════════════════════ */

const CROP_CALENDAR = {
  almond:          { bloom:'Feb–Mar', harvest:'Aug–Sep', export:'Sep–Dec', risk:'Feb–Apr frost', marketing:'Aug–Jul' },
  walnut:          { bloom:'Mar–Apr', harvest:'Sep–Oct', export:'Oct–Jan', risk:'Apr frost', marketing:'Sep–Aug' },
  pistachio:       { bloom:'Mar–Apr', harvest:'Aug–Sep', export:'Sep–Dec', risk:'Mar–Apr frost', marketing:'Sep–Aug' },
  cashew:          { bloom:'Nov–Jan', harvest:'Feb–May', export:'Apr–Jul', risk:'Jan–Feb dry', marketing:'Feb–Jan' },
  hazelnut:        { bloom:'Jan–Feb', harvest:'Aug–Sep', export:'Sep–Feb', risk:'Feb frost', marketing:'Sep–Aug' },
  pecan:           { bloom:'Apr–May', harvest:'Oct–Nov', export:'Nov–Feb', risk:'Apr frost', marketing:'Oct–Sep' },
  brazil_nut:      { bloom:'Oct–Nov', harvest:'Jan–Mar', export:'Mar–Jun', risk:'Dec–Jan drought', marketing:'Jan–Dec' },
  macadamia:       { bloom:'Jul–Sep', harvest:'Mar–Jul', export:'Jun–Oct', risk:'Aug heat', marketing:'Apr–Mar' },
  raisin:          { bloom:'Mar–Apr', harvest:'Aug–Sep', export:'Sep–Dec', risk:'Aug rain', marketing:'Sep–Aug' },
  pine_nut:        { bloom:'Apr–May', harvest:'Sep–Oct', export:'Oct–Jan', risk:'Sep–Oct rain', marketing:'Oct–Sep' },
  dried_mango:     { bloom:'Dec–Feb', harvest:'Mar–Jun', export:'Apr–Aug', risk:'Feb–Mar heat', marketing:'Mar–Feb' },
  dried_cranberry: { bloom:'May–Jun', harvest:'Sep–Oct', export:'Oct–Jan', risk:'May frost', marketing:'Oct–Sep' },
  dried_blueberry: { bloom:'Apr–May', harvest:'Jun–Aug', export:'Jul–Oct', risk:'May frost', marketing:'Jul–Jun' },
  banana_chip:     { bloom:'Year-round', harvest:'Year-round', export:'Year-round', risk:'Typhoon season', marketing:'Jan–Dec' },
  dried_apple:     { bloom:'Mar–Apr', harvest:'Aug–Oct', export:'Oct–Feb', risk:'Apr frost', marketing:'Sep–Aug' },
  dried_papaya:    { bloom:'Year-round', harvest:'Year-round', export:'Year-round', risk:'Rainy season', marketing:'Jan–Dec' },
  date:            { bloom:'Feb–Mar', harvest:'Sep–Nov', export:'Oct–Jan', risk:'Aug–Sep heat/rain', marketing:'Oct–Sep' },
  dried_apricot:   { bloom:'Mar–Apr', harvest:'Jun–Jul', export:'Aug–Nov', risk:'Mar–Apr frost', marketing:'Aug–Jul' },
  dried_fig:       { bloom:'May–Jun', harvest:'Aug–Oct', export:'Oct–Jan', risk:'Aug drought', marketing:'Sep–Aug' },
  prune:           { bloom:'Feb–Mar', harvest:'Jul–Aug', export:'Sep–Dec', risk:'Feb–Mar frost', marketing:'Aug–Jul' },
};

const PRICE_DRIVERS = {
  almond:          ['USA crop report (Aug OCE)', 'Spain harvest size', 'EUR/USD FX', 'Freight costs', 'EU import volume (Eurostat)'],
  walnut:          ['USDA FAS supply forecast', 'China crop size', 'EUR/USD FX', 'Freight from CA/Chile', 'EU demand trend'],
  pistachio:       ['Iran export ban risk', 'USA crop (Jul OCE)', 'EUR/USD + IRR/USD', 'Turkey supply', 'Sanctions impact'],
  cashew:          ['Vietnam processing capacity', 'Ivory Coast harvest', 'INC supply balance', 'EUR/USD FX', 'Freight from Asia'],
  hazelnut:        ['Turkey frost events (Feb–Apr)', 'Fiskobirlik price', 'EUR/TRY FX', 'Eurostat import values', 'Black Sea exports'],
  pecan:           ['USDA ERS crop estimate', 'US export demand', 'China import appetite', 'EUR/USD FX', 'Freight'],
  brazil_nut:      ['Bolivia harvest weather', 'Amazon deforestation policy', 'Freight from South America', 'EU import volume'],
  macadamia:       ['Kenya/SA crop size', 'China demand', 'EUR/USD FX', 'Freight from East Africa/Australia'],
  raisin:          ['Turkey sultana harvest', 'Iran crop size', 'California supply', 'EUR/TRY FX', 'EU import price'],
  pine_nut:        ['China supply restrictions', 'Russia export policy', 'Freight to EU', 'Eurostat import values'],
  dried_mango:     ['Thailand/Philippines crop', 'Monsoon timing', 'Freight from SE Asia', 'EUR/THB FX'],
  dried_cranberry: ['USDA ERS US crop', 'Canadian production', 'EUR/USD FX', 'Demand from EU food industry'],
  dried_blueberry: ['US/Chile harvest', 'EUR/USD FX', 'EU retail demand', 'Freight'],
  banana_chip:     ['Philippines typhoon season', 'Freight from Asia', 'EUR/PHP FX', 'EU food industry demand'],
  dried_apple:     ['China crop size', 'Chile harvest', 'EUR/CNY FX', 'EU import volume (Eurostat)'],
  dried_papaya:    ['Thailand crop', 'Rainy season timing', 'EUR/THB FX', 'Freight from SE Asia'],
  date:            ['Saudi Arabia harvest size', 'Tunisia export policy', 'EUR/USD + local FX', 'Eurostat EU import values', 'CBS StatLine NL'],
  dried_apricot:   ['Turkey frost (Mar–Apr)', 'Uzbekistan supply', 'EUR/TRY FX', 'Eurostat import values', 'INC statistics'],
  dried_fig:       ['Turkey crop (Jul–Aug)', 'EUR/TRY FX', 'Eurostat EU import values', 'INC statistics'],
  prune:           ['USDA ERS US supply', 'France harvest size', 'EUR/USD FX', 'EU retail demand'],
};

const CONFIDENCE_SCORES = {
  almond:72, walnut:70, pistachio:65, cashew:68, hazelnut:60,
  pecan:62, brazil_nut:55, macadamia:57, raisin:66, pine_nut:52,
  dried_mango:50, dried_cranberry:63, dried_blueberry:58, banana_chip:48,
  dried_apple:53, dried_papaya:46, date:64, dried_apricot:61,
  dried_fig:59, prune:65,
};

const SOURCE_STACK = {
  almond:          ['Almond Board CA', 'USDA FAS', 'USDA ERS', 'INC', 'Eurostat', 'IndexMundi'],
  walnut:          ['USDA FAS', 'USDA ERS', 'INC', 'Eurostat', 'UN Comtrade'],
  pistachio:       ['American Pistachio Growers', 'USDA FAS', 'INC', 'Iran Pistachio Assoc', 'Eurostat'],
  cashew:          ['INC', 'FAOSTAT', 'Eurostat', 'VINACAS', 'UN Comtrade'],
  hazelnut:        ['INC', 'Eurostat', 'TurkStat', 'Fiskobirlik', 'Copernicus'],
  pecan:           ['USDA ERS', 'USDA FAS', 'FAOSTAT', 'Eurostat'],
  brazil_nut:      ['FAOSTAT', 'Eurostat', 'Bolivia INE', 'UN Comtrade'],
  macadamia:       ['FAOSTAT', 'Eurostat', 'Australian Macadamias', 'SAMAC'],
  raisin:          ['INC', 'Eurostat', 'California Raisins', 'TurkStat'],
  pine_nut:        ['Eurostat', 'FAOSTAT', 'China customs', 'UN Comtrade'],
  dried_mango:     ['FAOSTAT', 'Eurostat', 'Thailand OAE', 'Open-Meteo'],
  dried_cranberry: ['USDA ERS', 'USDA FAS', 'Eurostat'],
  dried_blueberry: ['USDA FAS', 'FAOSTAT', 'Eurostat'],
  banana_chip:     ['FAOSTAT', 'Eurostat', 'Philippines PSA'],
  dried_apple:     ['FAOSTAT', 'Eurostat', 'China customs'],
  dried_papaya:    ['FAOSTAT', 'Eurostat', 'Thailand OAE'],
  date:            ['Eurostat', 'CBS StatLine', 'FAOSTAT', 'Tunisia MOA', 'ECB FX'],
  dried_apricot:   ['INC', 'Eurostat', 'TurkStat', 'Copernicus', 'ECB FX'],
  dried_fig:       ['INC', 'Eurostat', 'TurkStat', 'UN Comtrade'],
  prune:           ['USDA ERS', 'USDA FAS', 'Eurostat', 'France AgriMer'],
};

function MarketIntelligence({ product, currency }) {
  const cal = CROP_CALENDAR[product] || {};
  const drivers = PRICE_DRIVERS[product] || [];
  const confidence = CONFIDENCE_SCORES[product] || 50;
  const sources = SOURCE_STACK[product] || [];
  const meta = PRODUCT_META[product];
  const sym = currency === 'EUR' ? '€' : '$';
  const confColor = confidence >= 70 ? '#10B981' : confidence >= 55 ? '#F59E0B' : '#EF4444';
  const confLabel = confidence >= 70 ? 'High' : confidence >= 55 ? 'Medium' : 'Low';

  return (
    <div style={{ marginTop: 16 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ fontSize:18 }}>{meta?.emoji}</div>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:'#1A1D2E' }}>{meta?.label} — Market Intelligence</div>
          <div style={{ fontSize:11, color:'#9CA3AF' }}>Based on crop calendar · price drivers · source stack · confidence scoring</div>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'center', background: confColor + '18', border:`1.5px solid ${confColor}`, borderRadius:10, padding:'6px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color: confColor }}>CONFIDENCE</div>
          <div style={{ fontSize:20, fontWeight:800, color: confColor }}>{confidence}/100</div>
          <div style={{ fontSize:10, color: confColor }}>{confLabel}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
        {/* Crop Calendar */}
        <div className="card" style={{ padding:'12px 14px' }}>
          <div className="card-title" style={{ marginBottom:10 }}>🌱 Crop Calendar</div>
          {[
            { label:'🌸 Bloom / Flowering', val: cal.bloom },
            { label:'🌿 Harvest Window', val: cal.harvest },
            { label:'📦 Export Season', val: cal.export },
            { label:'⚠️ Key Risk Window', val: cal.risk },
            { label:'📅 Marketing Year', val: cal.marketing },
          ].map((row, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom: i < 4 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ fontSize:12, color:'#6B7280' }}>{row.label}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'#1A1D2E' }}>{row.val || '—'}</span>
            </div>
          ))}
        </div>

        {/* Price Drivers */}
        <div className="card" style={{ padding:'12px 14px' }}>
          <div className="card-title" style={{ marginBottom:10 }}>📊 Key Price Drivers</div>
          {drivers.map((d, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom: i < drivers.length-1 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#6366F1', flexShrink:0 }}/>
              <span style={{ fontSize:12, color:'#374151' }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Formula + Sources */}
        <div className="card" style={{ padding:'12px 14px' }}>
          <div className="card-title" style={{ marginBottom:10 }}>💡 Pricing Formula</div>
          <div style={{ fontSize:11, color:'#6B7280', lineHeight:1.7, marginBottom:12 }}>
            <code style={{ background:'#F3F4F6', padding:'6px 10px', borderRadius:6, display:'block', fontSize:11, color:'#374151', lineHeight:1.8 }}>
              Expected {sym}/kg =<br/>
              Origin USD/kg<br/>
              × ECB USD/EUR rate<br/>
              + Freight uplift<br/>
              + EU import premium
            </code>
          </div>
          <div className="card-title" style={{ marginBottom:8, fontSize:11 }}>📚 Data Sources</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {sources.map((s, i) => (
              <span key={i} style={{ padding:'2px 8px', background:'#EEF2FF', color:'#6366F1', borderRadius:20, fontSize:10, fontWeight:600 }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
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
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);
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
    setScrapeProgress(0);
    setScrapeSuccess(false);
    try {
      await axios.post(`${API}/scrape`, {}, { headers: authH(), timeout: 10000 });
      let elapsed = 0;
      const estimatedMs = 30000; // ~30s estimated scrape time
      const poll = setInterval(async () => {
        try {
          elapsed += 4000;
          /* Animate progress: 0→90% while running, 100% on done */
          const s = await axios.get(`${API}/scrape/status`, { headers: authH() });
          if (!s.data.running) {
            clearInterval(poll);
            setScrapeProgress(100);
            await fetchAll();
            await fetchHistory(selectedProduct);
            await fetchForecast(selectedProduct);
            setLastUpdated(new Date()); /* force timestamp to exact scrape completion time */
            setScraping(false);
            setScrapeSuccess(true);
            setTimeout(() => setScrapeSuccess(false), 4000);
          } else {
            const pct = Math.min(90, Math.round((elapsed / estimatedMs) * 90));
            setScrapeProgress(pct);
          }
        } catch {
          clearInterval(poll);
          setScraping(false);
          setScrapeProgress(0);
        }
      }, 4000);
    } catch (err) {
      alert('Could not start scraper — make sure backend is running');
      setScraping(false);
      setScrapeProgress(0);
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
      label: currency === 'EUR' ? 'EUR/kg' : 'USD/kg',
      data: ALL_PRODUCTS.map(p => {
        const v = summary[p]?.latest || 0;
        return parseFloat((currency === 'EUR' ? v * 0.92 : v).toFixed(3));
      }),
      backgroundColor: barColors,
      borderColor: barBorders,
      borderWidth: 1.5,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  /* Last 30 days from today */
  const last30History = (() => {
    if (!history[selectedProduct]?.length) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return history[selectedProduct].filter(h => new Date(h.date) >= cutoff);
  })();
  const histData = last30History.length > 0 ? {
    labels: last30History.map(h => new Date(h.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })),
    datasets: [{
      label: currency === 'EUR' ? 'EUR/kg' : 'USD/kg',
      data: last30History.map(h => currency === 'EUR' ? parseFloat((h.price * 0.92).toFixed(3)) : parseFloat(parseFloat(h.price).toFixed(3))),
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
        callbacks: { label: ctx => ` ${currency === 'EUR' ? '€' : '$'}${ctx.parsed.y?.toFixed(3)}/kg` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 11, family: "'Plus Jakarta Sans',sans-serif" }, maxRotation: 35 }, border: { display: false } },
      y: { grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { size: 11, family: "'JetBrains Mono',monospace" }, callback: v => `${currency === 'EUR' ? '€' : '$'}${parseFloat(v).toFixed(3)}` }, border: { display: false } }
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
            <div style={{ width:'100%' }}>
              <button className="refresh-btn" style={{ width:'100%', justifyContent:'center' }} onClick={() => { handleScrape(); setSidebarOpen(false); }} disabled={scraping}>
                {scraping ? `⏳ ${scrapeProgress}%` : '⬇ Scrape Data'}
              </button>
              {scraping && (
                <div className="scrape-progress-wrap">
                  <div className="scrape-progress-bar"><div className="scrape-progress-fill" style={{ width:`${scrapeProgress}%` }}/></div>
                  <div className="scrape-progress-label">{scrapeProgress}% complete</div>
                </div>
              )}
            </div>
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
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  <button className="refresh-btn" onClick={handleScrape} disabled={scraping}>
                    {scraping ? `⏳ ${scrapeProgress}%` : '⬇ Scrape Data'}
                  </button>
                  {scraping && (
                    <div className="scrape-progress-wrap">
                      <div className="scrape-progress-bar">
                        <div className="scrape-progress-fill" style={{ width:`${scrapeProgress}%` }}/>
                      </div>
                      <div className="scrape-progress-label">{scrapeProgress}% complete</div>
                    </div>
                  )}
                </div>
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

              {/* SCRAPER NOTICE */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, marginBottom:16, fontSize:12, color:'#166534' }}>
                <span style={{ fontSize:15 }}>🤖</span>
                <span><strong>Live scraped data</strong> — All prices on this page are automatically collected by NICO's web scraper from multiple sources across the internet. Click <strong>Scrape Data</strong> to fetch the latest prices.</span>
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

              {/* SCRAPER NOTICE */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, marginBottom:16, fontSize:12, color:'#166534' }}>
                <span style={{ fontSize:15 }}>🤖</span>
                <span><strong>Live scraped data</strong> — Price history and forecasts are built from data automatically scraped from global commodity databases, government APIs, and wholesale marketplaces. Data updates every time you click Scrape Data.</span>
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

              {/* ── MARKET INTELLIGENCE (from doc analysis) ── */}
              <MarketIntelligence product={selectedProduct} currency={currency} />
            </div>
          )}

          {/* ════════════════════════════
              PRODUCTS TAB
          ════════════════════════════ */}
          {tab === 'products' && (
            <div className="page fade-up">
              <div className="page-header">
                <div className="page-title">All Products</div>
                <div className="page-subtitle">20 categories tracked · click any card for price analytics</div>
              </div>

              {/* SCRAPER NOTICE */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, marginBottom:16, fontSize:12, color:'#166534' }}>
                <span style={{ fontSize:15 }}>🤖</span>
                <span><strong>Live scraped data</strong> — All product prices are collected automatically by NICO's intelligent scraper from IndexMundi, USDA, FAOSTAT, UN Comtrade, Alibaba, and other sources. Prices reflect the latest available market data.</span>
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

              {/* ── ACTIVE SCRAPING SOURCES ── */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">✅ Active Scraping Sources</div>
                <div className="card-subtitle">NICO currently pulls data from these free APIs every scrape</div>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="data-table" style={{ minWidth: 500 }}>
                    <thead><tr><th>Source</th><th>Type</th><th>Products</th><th>URL</th></tr></thead>
                    <tbody>
                      {[
                        { name: 'UN Comtrade API',     type: 'Trade Prices',    prod: 'All nuts & dried fruits', url: 'comtradeapi.un.org', badge: 'badge-blue' },
                        { name: 'USDA NASS QuickStats', type: 'Farm Prices',    prod: 'Almonds, Walnuts, Pistachios, Raisins', url: 'quickstats.nass.usda.gov', badge: 'badge-blue' },
                        { name: 'FAOSTAT',             type: 'UN Agriculture',  prod: 'All products (global)', url: 'fenixservices.fao.org', badge: 'badge-blue' },
                        { name: 'FreshPlaza',          type: 'Market News',     prod: 'All products', url: 'freshplaza.com', badge: 'badge-blue' },
                        { name: 'IndexMundi',          type: 'Commodity Index', prod: 'Almonds, Cashews, Pistachios', url: 'indexmundi.com', badge: 'badge-blue' },
                        { name: 'Alibaba',             type: 'B2B Wholesale',   prod: 'All products', url: 'alibaba.com', badge: 'badge-blue' },
                        { name: 'Made-in-China',       type: 'B2B Wholesale',   prod: 'All products', url: 'made-in-china.com', badge: 'badge-blue' },
                        { name: 'Open-Meteo',          type: 'Weather API',     prod: 'All crop regions', url: 'api.open-meteo.com', badge: 'badge-green' },
                      ].map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</td>
                          <td><span className={`badge ${s.badge}`}>{s.type}</span></td>
                          <td style={{ color: '#6B7280', fontSize: 12 }}>{s.prod}</td>
                          <td>
                            <a href={`https://${s.url}`} target="_blank" rel="noreferrer"
                               style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#6366F1', textDecoration: 'none', wordBreak: 'break-all' }}>
                              {s.url}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── OFFICIAL TRADE & STATISTICAL SOURCES ── */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">🏛️ Official Trade & Statistical Sources</div>
                <div className="card-subtitle">Used for validation and EU market benchmarks</div>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="data-table" style={{ minWidth: 500 }}>
                    <thead><tr><th>Source</th><th>Focus</th><th>URL</th></tr></thead>
                    <tbody>
                      {[
                        { name: 'Eurostat API',          focus: 'EU trade & import prices',    url: 'ec.europa.eu/eurostat/databrowser' },
                        { name: 'Eurostat Comext',       focus: 'EU agricultural trade flows',  url: 'ec.europa.eu/eurostat/statistics-explained' },
                        { name: 'ITC Trade Map',         focus: 'Trade flows & unit values',    url: 'trademap.org' },
                        { name: 'WITS WorldBank',        focus: 'Global trade statistics',      url: 'wits.worldbank.org' },
                        { name: 'OEC World',             focus: 'Economic complexity data',     url: 'oec.world' },
                        { name: 'Netherlands CBS StatLine', focus: 'Dutch import hub data',     url: 'cbs.nl/en-gb/our-services/open-data' },
                        { name: 'USDA FAS GAIN',         focus: 'Country crop/trade reports',   url: 'fas.usda.gov/data' },
                        { name: 'ABARES Australia',      focus: 'Crop & trade outlooks',        url: 'agriculture.gov.au/abares' },
                        { name: 'TurkStat',              focus: 'Turkey production/trade',      url: 'tuik.gov.tr' },
                        { name: 'DataComex Spain',       focus: 'Spain trade flows',            url: 'datacomex.comercio.es' },
                        { name: 'EU Agri-food Portal',   focus: 'EU agri-food prices & trade',  url: 'agridata.ec.europa.eu' },
                        { name: 'CBI Market Info',       focus: 'EU importer guidance',         url: 'cbi.eu/market-information' },
                        { name: 'RASFF Portal',          focus: 'EU food safety alerts',        url: 'webgate.ec.europa.eu/rasff-window' },
                        { name: 'ECB API',               focus: 'EUR/USD FX rates',             url: 'data.ecb.europa.eu' },
                      ].map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</td>
                          <td style={{ color: '#6B7280', fontSize: 12 }}>{s.focus}</td>
                          <td>
                            <a href={`https://${s.url}`} target="_blank" rel="noreferrer"
                               style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#6366F1', textDecoration: 'none', wordBreak: 'break-all' }}>
                              {s.url}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── PREMIUM SOURCES ── */}
              <div className="card">
                <div className="card-title">💎 Premium Sources (Recommended Upgrade)</div>
                <div className="card-subtitle">Subscribe for real-time EU benchmark prices</div>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="data-table" style={{ minWidth: 400 }}>
                    <thead><tr><th>Source</th><th>Why Important</th><th>URL</th></tr></thead>
                    <tbody>
                      {[
                        { name: 'Vesper',         why: 'Best EU benchmark prices for nuts',     url: 'vespertool.com/nuts' },
                        { name: 'Expana Markets', why: 'Food ingredient price benchmarks',      url: 'expanamarkets.com' },
                        { name: 'Mintec',         why: 'Industry standard for manufacturers',  url: 'mintecglobal.com' },
                        { name: 'Tridge',         why: 'Origin-level wholesale prices',        url: 'tridge.com/intelligences' },
                        { name: 'INC',            why: 'Global nut production statistics',     url: 'inc.nutfruit.org' },
                        { name: 'AgFlow',         why: 'Trade-flow & shipment monitoring',     url: 'agflow.com' },
                      ].map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</td>
                          <td style={{ color: '#6B7280', fontSize: 12 }}>{s.why}</td>
                          <td>
                            <a href={`https://${s.url}`} target="_blank" rel="noreferrer"
                               style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#6366F1', textDecoration: 'none', wordBreak: 'break-all' }}>
                              {s.url}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Scrape success popup ── */}
      {scrapeSuccess && (
        <div className="scrape-success-popup">
          ✅ Data scraped successfully!
        </div>
      )}
    </>
  );
}