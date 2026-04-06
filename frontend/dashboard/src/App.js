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
  pistachio:       { label: 'Pistachios',        emoji: '💚', color: '#1E40AF', origin: 'USA · Iran · Turkey' },
  walnut:          { label: 'Walnuts',           emoji: '🟤', color: '#F59E0B', origin: 'USA · China · Chile' },
  raisin:          { label: 'Raisins',           emoji: '🍇', color: '#2563EB', origin: 'USA · Turkey · Iran' },
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
  dried_blueberry: { label: 'Dried Blueberries', emoji: '🫐', color: '#1D4ED8', origin: 'USA · Chile' },
  banana_chip:     { label: 'Dried Banana Chips',emoji: '🍌', color: '#CA8A04', origin: 'Philippines · Ecuador' },
  dried_apple:     { label: 'Dried Apple',       emoji: '🍎', color: '#16A34A', origin: 'China · Chile · Poland' },
  dried_papaya:    { label: 'Dried Papaya',      emoji: '🧡', color: '#EA580C', origin: 'Thailand · Brazil · Mexico' },
  prune:           { label: 'Prunes',            emoji: '🫐', color: '#1D4ED8', origin: 'USA · France · Chile' },
};

/* ══════════════════════════════════════════════════════════════════════
   VOLLEDIGE VERTALINGEN — 6 talen, NL standaard
   Elke UI-string is hier gedefinieerd.
   ══════════════════════════════════════════════════════════════════════ */
const LANGS = [
  { code:'nl', label:'Nederlands', flag:'🇳🇱' },
  { code:'en', label:'English',    flag:'🇬🇧' },
  { code:'fr', label:'Français',   flag:'🇫🇷' },
  { code:'de', label:'Deutsch',    flag:'🇩🇪' },
  { code:'es', label:'Español',    flag:'🇪🇸' },
  { code:'it', label:'Italiano',   flag:'🇮🇹' },
];

const T = {
  /* ─── DUTCH (default) ─────────────────────────────────────────── */
  nl: {
    /* Nav */
    nav_home:'Home', nav_prices:'Prijzen / Prognose', nav_products:'Alle Producten',
    nav_offered:'Alle Aanbiedingsprijzen', nav_best:'5 Bestsellers',
    nav_nl:'Aangeboden Prijs NL', nav_weather:'Weer / Prijsprognose',
    nav_alerts:'Meldingen', nav_sources:'Bronnen',
    /* Topbar */
    profile:'Profiel', logout:'Uitloggen', refresh:'↻ Vernieuwen', scrape:'⬇ Data Ophalen',
    loading:'Laden...', scraping:'Bezig...',
    /* Dashboard */
    overview:'Overzicht', sources_line:'Bronnen: VN Comtrade · USDA · FAOSTAT',
    live_scraped:'Live verzamelde data',
    live_desc:'Alle prijzen worden automatisch verzameld door de NICO webscraper. Klik op',
    live_btn:'Data Ophalen', live_end:'voor de nieuwste prijzen.',
    upgrade_title:'💎 Upgrade naar Premium Data',
    upgrade_desc:'Verbind Vesper, Mintec of Expana voor realtime EU-benchmarkprijzen en dagelijkse feeds.',
    view_sources:'Bekijk Bronnen →',
    total_products:'📦 Totaal Producten Gevolgd', avg_price:'💵 Gemiddelde Prijs',
    most_expensive:'👑 Duurste', active_alerts:'🔔 Actieve Meldingen',
    new_this_update:'+3 nieuw in deze update', across_cats:'over alle categorieën',
    price_movements:'prijsbewegingen gedetecteerd', all_stable:'alle prijzen stabiel',
    price_comparison:'Prijsvergelijking', all_products_usd:'Alle producten',
    price_trend:'Prijstrend', last_readings:'Laatste 20 metingen · klik op productkaart om te wijzigen',
    latest_prices:'Laatste Prijzen', eu_range_src:'30d EU Bereik: Eurostat COMEXT · WITS WorldBank',
    filter_all:'Alles', filter_rising:'Stijgend', filter_falling:'Dalend', filter_stable:'Stabiel',
    col_product:'Product', col_price:'Laatste Prijs', col_country:'Land',
    col_source:'Databron', col_eu_range:'30d EU Bereik', col_eu_avg:'EU Gem (30d)',
    col_change:'Wijziging', col_status:'Status',
    no_data:'Geen data — klik op "Data Ophalen" om prijzen te verzamelen',
    status_rising:'▲ Stijgend', status_falling:'▼ Dalend', status_stable:'● Stabiel',
    /* Analytics */
    hist_trends:'Historische trends & 30-dagenprognose',
    analytics_live:'Live verzamelde data — Prijsgeschiedenis en prognoses zijn gebouwd uit automatisch verzamelde data.',
    current_price:'Huidige Prijs', avg_30:'30-Dagen Gemiddelde',
    low_30:'30-Dagen Laag', high_30:'30-Dagen Hoog',
    price_history:'Prijsgeschiedenis', all_data_points:'Alle geregistreerde datapunten',
    forecast_30:'30-Dagenprognose', linear_proj:'Lineaire trendprojectie',
    rising_trend:'▲ Stijgende trend', falling_trend:'▼ Dalende trend',
    no_history:'Geen geschiedenis · Klik eerst op Data Ophalen',
    need_points:'Minimaal 5 datapunten nodig',
    /* Products */
    all_products_title:'Alle Producten',
    cats_tracked:'20 categorieën gevolgd · klik op een kaart voor prijsanalyse',
    products_live:'Live verzamelde data — Alle productprijzen worden automatisch verzameld.',
    /* Alerts */
    price_alerts:'Prijsmeldingen', alert_subtitle:'Geactiveerd bij prijsbeweging ≥3%',
    clear_all:'Alles wissen', no_alerts:'Geen Actieve Meldingen',
    all_normal:'Alle prijzen binnen normaal bereik',
    intel_scores:'📊 Product Intelligentie Scores',
    intel_subtitle:'Betrouwbaarheidsscore · Koop / Houd / Verkoop signaal voor alle 20 categorieën',
    alert_thresholds:'Meldingsdrempels', how_triggered:'Hoe meldingen worden geactiveerd',
    col_alert_type:'Meldingstype', col_trigger:'Activering', col_action:'Actie',
    medium_trigger:'Prijs beweegt 3–9% t.o.v. vorige', high_trigger:'Prijs beweegt 10%+ t.o.v. vorige',
    auto_trigger:'Elke 6 uur', shown_panel:'Weergegeven in meldingspaneel',
    highlighted:'Prominent weergegeven', auto_refresh:'Dashboard vernieuwt automatisch',
    /* Sources */
    data_sources:'Databronnen', sources_subtitle:'136-bronnen database · VN, USDA, FAO & industrieproviders',
    active_scraping:'Actieve Scrapingbronnen', official_trade:'Officiële Handelsbronnen', premium:'Premiumbronnen',
    /* Weather */
    weather_title:'🌡️ Weer & Prijsprognose',
    weather_subtitle:'20 productcategorieën · live Open-Meteo weer · 12-maandenweergave',
    how_to_use:'Gebruiksaanwijzing',
    weather_hint:`Selecteer een productcategorie → de kaart toont alle teeltregio's → selecteer een land voor prijs & weergrafiek naast elkaar.`,
    product_category:'📦 PRODUCTCATEGORIE', growing_region:'🌍 TEELTREGIO / LAND',
    period:'📅 PERIODE',
    period_1m:'1 Maand', period_3m:'3 Maanden', period_6m:'6 Maanden', period_12m:'12 Maanden',
    product_lbl:'Product', region_lbl:'Regio', current_price_lbl:'Huidige Prijs',
    current_temp:'Huidige Temp', data_sources_lbl:'Databronnen',
    map_title:`🗺️ Teeltregio's`, click_marker:'Klik op een markering om dat land te selecteren · Knijp of scroll om in te zoomen',
    loading_weather:'⏳ Weerdata laden...',
    chart_title:'📈 Prijs + Temperatuur',
    legend_hist:'Groen = prijsgeschiedenis', legend_fore:'Groen gestreept = prognose', legend_temp:'Oranje = temperatuur',
    all_regions:`🌐 Alle Teeltregio's voor`, forecast_sources:'📚 Prognosebronnen voor',
    /* Catalog */
    supplier_catalog:'Leverancierscatalogus', catalog_subtitle:'CALCONUT 09/03/2026 · 24u prijzen · MOQ 3.000kg',
    upload_price_list:'📄 Prijslijst Uploaden', reading:'⏳ Lezen...',
    upload_success:'✅ producten geëxtraheerd uit', upload_error:'⚠️ Kon data niet extraheren',
    search_catalog:'Catalogus doorzoeken...', items:'items',
    sort_az:'A→Z', sort_price_asc:'Prijs ↑', sort_price_desc:'Prijs ↓', sort_new:'Nieuw Eerst',
    col_packaging:'Verpakking', col_qty:'Hoeveelheid', col_availability:'Beschikbaarheid',
    col_price_unit:'Prijs/eenheid', col_origin:'Herkomst', col_notes:'Notities', col_category:'Categorie',
    no_products:'Geen producten gevonden',
    /* Top5 */
    top5_title:'⭐ TOP 5 Producten', top5_subtitle:'20 categorieën · NICO productlijst · EU groothandelbenchmarks',
    upload_new:'📄 Nieuwe Prijslijst Uploaden', reset_upload:'Upload {t.reset}ten',
    rank:'Rang', grade:'Klasse', type:'Type', price_range_col:'Prijsbereik', note:'Notitie',
    hm_label:'HM', top5_eu_range:'EU Bereik', top5_volatility:'Volatiliteit',
    /* NL Supply */
    nl_title:'🇳🇱 Aangeboden Prijs NL', nl_subtitle:'Nederlandse groothandelslijst · 01–31/03/2026',
    nl_banner_title:'Aangeboden Prijs NL — Automatisch bijwerken vanuit document',
    nl_banner_desc:'Upload een nieuwe PDF of Word-prijslijst en NICO extraheert automatisch alle producten en werkt prijzen bij.',
    last_upload:'Laatste upload:', nl_items_updated:'bijgewerkte/nieuwe producten uit de laatste upload — hieronder groen gemarkeerd.',
    search_nl:'Producten zoeken...', reset:'{t.reset}ten',
    /* Market Intelligence */
    market_intel:'Marktintelligentie', intel_based:'Gebaseerd op oogstkalender · prijsdrijvers · bronnenstack · betrouwbaarheidsscoring',
    loading_intel:'⏳ Live intelligentiedata laden...',
    supply_risk:'⚠️ Leveringsrisico', forecast_card:'📈 30-Dagenprognose',
    recommended_action:'💡 Aanbevolen Actie', price_range_card:'📊 Prijsbereik',
    today:'t.o.v. vandaag', urgency_lbl:'Urgentie', score_lbl:'Score',
    supply_alert:'Leveringsalert', alt_sourcing:'🔄 Alternatieve Inkoop',
    alt_ranked:'Gerangschikt op beschikbaarheid × prijs × kwaliteitsmatch',
    ai_rec:'💡 AI Aanbeveling',
    crop_calendar:'🌱 Oogstkalender', bloom:'🌸 Bloei / Bestuiving', harvest:'🌿 Oogstvenster',
    export_season:'📦 Exportseizoen', risk_window:'⚠️ Belangrijkste Risicovenster',
    marketing_year:'📅 Marketingjaar',
    price_drivers:'📊 Belangrijkste Prijsdrijvers',
    pricing_formula:'💡 Prijsformule', data_sources_card:'📚 Databronnen',
    confidence_lbl:'BETROUWBAARHEID',
    /* Buy/Sell */
    buy:'KOPEN', hold:'HOUDEN', sell:'VERKOPEN', wait:'WACHTEN', buy_now:'NU KOPEN',
    /* General */
    general:'Algemeen', new_badge:'NIEUW', on_stock:'Op voorraad', on_request:'Op aanvraag',
    per_kg:'per kg', loading_map:'Laden...',
  },

  /* ─── ENGLISH ─────────────────────────────────────────────────────── */
  en: {
    nav_home:'Home', nav_prices:'Prices / Forecast', nav_products:'All Products',
    nav_offered:'All Offered Prices', nav_best:'5 Best Sellers',
    nav_nl:'Offered Price NL', nav_weather:'Weather / Price Forecast',
    nav_alerts:'Alerts', nav_sources:'Sources',
    profile:'Profile', logout:'Log out', refresh:'↻ Refresh', scrape:'⬇ Scrape Data',
    loading:'Loading...', scraping:'Scraping...',
    overview:'Overview', sources_line:'Sources: UN Comtrade · USDA · FAOSTAT',
    live_scraped:'Live scraped data',
    live_desc:'All prices on this page are automatically collected by NICO web scraper. Click',
    live_btn:'Scrape Data', live_end:'to fetch the latest prices.',
    upgrade_title:'💎 Upgrade to Premium Data',
    upgrade_desc:'Connect Vesper, Mintec or Expana for real-time EU benchmark prices & daily feeds.',
    view_sources:'View Sources →',
    total_products:'📦 Total Products Tracked', avg_price:'💵 Average Price',
    most_expensive:'👑 Most Expensive', active_alerts:'🔔 Active Alerts',
    new_this_update:'+3 new this update', across_cats:'across all categories',
    price_movements:'price movements detected', all_stable:'all prices stable',
    price_comparison:'Price Comparison', all_products_usd:'All products',
    price_trend:'Price Trend', last_readings:'Last 20 readings · click product card to change',
    latest_prices:'Latest Prices', eu_range_src:'30d EU Range: Eurostat COMEXT · WITS WorldBank',
    filter_all:'All', filter_rising:'Rising', filter_falling:'Falling', filter_stable:'Stable',
    col_product:'Product', col_price:'Latest Price', col_country:'Country',
    col_source:'Data Source', col_eu_range:'30d EU Range', col_eu_avg:'EU Avg (30d)',
    col_change:'Change', col_status:'Status',
    no_data:'No data yet — click "Scrape Data" to collect prices',
    status_rising:'▲ Rising', status_falling:'▼ Falling', status_stable:'● Stable',
    hist_trends:'Historical trends & 30-day AI forecast',
    analytics_live:'Live scraped data — Price history and forecasts built from automatically collected data.',
    current_price:'Current Price', avg_30:'30-Day Average', low_30:'30-Day Low', high_30:'30-Day High',
    price_history:'Price History', all_data_points:'All recorded data points',
    forecast_30:'30-Day Forecast', linear_proj:'Linear trend projection',
    rising_trend:'▲ Rising trend', falling_trend:'▼ Falling trend',
    no_history:'No history yet · Click Scrape Data first',
    need_points:'Need 5+ data points',
    all_products_title:'All Products', cats_tracked:'20 categories tracked · click any card for price analytics',
    products_live:'Live scraped data — All product prices are automatically collected.',
    price_alerts:'Price Alerts', alert_subtitle:'Triggered when price moves ≥3% between readings',
    clear_all:'Clear all', no_alerts:'No Active Alerts', all_normal:'All prices within normal range',
    intel_scores:'📊 Product Intelligence Scores',
    intel_subtitle:'Confidence score · Buy / Hold / Sell signal for all 20 categories',
    alert_thresholds:'Alert Thresholds', how_triggered:'How alerts are triggered',
    col_alert_type:'Alert Type', col_trigger:'Trigger', col_action:'Action',
    medium_trigger:'Price moves 3–9% vs previous', high_trigger:'Price moves 10%+ vs previous',
    auto_trigger:'Every 6 hours', shown_panel:'Shown in alert panel',
    highlighted:'Highlighted prominently', auto_refresh:'Dashboard auto-refreshes',
    data_sources:'Data Sources', sources_subtitle:'136-source database · UN, USDA, FAO & industry providers',
    active_scraping:'Active Scraping Sources', official_trade:'Official Trade Sources', premium:'Premium Sources',
    weather_title:'🌡️ Weather & Price Forecast',
    weather_subtitle:'20 product categories · live Open-Meteo weather · 12-month view',
    how_to_use:'How to use',
    weather_hint:'Select a product category → the map shows all growing regions → select a country for side-by-side price & weather chart.',
    product_category:'📦 PRODUCT CATEGORY', growing_region:'🌍 GROWING REGION / COUNTRY',
    period:'📅 PERIOD',
    period_1m:'1 Month', period_3m:'3 Months', period_6m:'6 Months', period_12m:'12 Months',
    product_lbl:'Product', region_lbl:'Region', current_price_lbl:'Current Price',
    current_temp:'Current Temp', data_sources_lbl:'Data Sources',
    map_title:'🗺️ Growing Regions', click_marker:'Click a marker to select that country · Pinch or scroll to zoom',
    loading_weather:'⏳ Loading weather data...',
    chart_title:'📈 Price + Temperature',
    legend_hist:'Solid = price history', legend_fore:'Dashed = 30-day forecast', legend_temp:'Orange = temperature',
    all_regions:'🌐 All Growing Regions for', forecast_sources:'📚 Forecast Sources for',
    supplier_catalog:'Supplier Catalog', catalog_subtitle:'CALCONUT 09/03/2026 · 24h prices · MOQ 3,000kg',
    upload_price_list:'📄 Upload Price List', reading:'⏳ Reading...',
    upload_success:'✅ products extracted from', upload_error:'⚠️ Could not extract data',
    search_catalog:'Search catalog...', items:'items',
    sort_az:'A→Z', sort_price_asc:'Price ↑', sort_price_desc:'Price ↓', sort_new:'New First',
    col_packaging:'Packaging', col_qty:'Qty', col_availability:'Availability',
    col_price_unit:'Price/unit', col_origin:'Origin', col_notes:'Notes', col_category:'Category',
    no_products:'No products found',
    top5_title:'⭐ TOP 5 Products', top5_subtitle:'20 categories · NICO product list · EU wholesale benchmarks',
    upload_new:'📄 Upload New Price List', reset_upload:'Reset Upload',
    rank:'Rank', grade:'Grade', type:'Type', price_range_col:'Price Range', note:'Note',
    hm_label:'HM', top5_eu_range:'EU Range', top5_volatility:'Volatility',
    nl_title:'🇳🇱 Offered Price NL', nl_subtitle:'Netherlands wholesale list · 01-31/03/2026',
    nl_banner_title:'Offered Price NL — Auto-update from document',
    nl_banner_desc:'Upload a new PDF or Word price list and NICO will automatically extract all products and update prices.',
    last_upload:'Last upload:', nl_items_updated:'updated/new products from latest upload — highlighted in green below.',
    search_nl:'Search products...', reset:'Reset',
    market_intel:'Market Intelligence', intel_based:'Based on crop calendar · price drivers · source stack · confidence scoring',
    loading_intel:'⏳ Loading live intelligence data...',
    supply_risk:'⚠️ Supply Risk', forecast_card:'📈 30-Day Forecast',
    recommended_action:'💡 Recommended Action', price_range_card:'📊 Price Range',
    today:'vs today', urgency_lbl:'Urgency', score_lbl:'Score',
    supply_alert:'Supply Alert', alt_sourcing:'🔄 Alternative Sourcing',
    alt_ranked:'Ranked by availability x price x quality match',
    ai_rec:'💡 AI Recommendation',
    crop_calendar:'🌱 Crop Calendar', bloom:'🌸 Bloom / Flowering', harvest:'🌿 Harvest Window',
    export_season:'📦 Export Season', risk_window:'⚠️ Key Risk Window', marketing_year:'📅 Marketing Year',
    price_drivers:'📊 Key Price Drivers',
    pricing_formula:'💡 Pricing Formula', data_sources_card:'📚 Data Sources',
    confidence_lbl:'CONFIDENCE',
    buy:'BUY', hold:'HOLD', sell:'SELL', wait:'WAIT', buy_now:'BUY NOW',
    general:'General', new_badge:'NEW', on_stock:'On stock', on_request:'On request',
    per_kg:'per kg', loading_map:'Loading...',
  },

  /* ─── FRENCH ──────────────────────────────────────────────────────── */
  fr: {
    nav_home:'Accueil', nav_prices:'Prix / Prévisions', nav_products:'Tous les Produits',
    nav_offered:'Tous les Prix Proposés', nav_best:'5 Meilleures Ventes',
    nav_nl:'Prix Proposés NL', nav_weather:'Météo / Prévisions Prix',
    nav_alerts:'Alertes', nav_sources:'Sources',
    profile:'Profil', logout:'Se déconnecter', refresh:'↻ Actualiser', scrape:'⬇ Collecter',
    loading:'Chargement...', scraping:'Collecte...',
    overview:'Aperçu', sources_line:'Sources : ONU Comtrade · USDA · FAOSTAT',
    live_scraped:'Données collectées en direct',
    live_desc:'Tous les prix sont collectés automatiquement par le scraper NICO. Cliquez sur',
    live_btn:'Collecter', live_end:'pour obtenir les derniers prix.',
    upgrade_title:'💎 Passer à Premium',
    upgrade_desc:'Connectez Vesper, Mintec ou Expana pour des prix de référence EU en temps réel.',
    view_sources:'Voir les Sources →',
    total_products:'📦 Produits Suivis', avg_price:'💵 Prix Moyen',
    most_expensive:'👑 Le Plus Cher', active_alerts:'🔔 Alertes Actives',
    new_this_update:'+3 nouveaux dans cette mise à jour', across_cats:'toutes catégories',
    price_movements:'mouvements de prix détectés', all_stable:'tous les prix stables',
    price_comparison:'Comparaison des Prix', all_products_usd:'Tous les produits',
    price_trend:'Tendance des Prix', last_readings:'20 dernières mesures',
    latest_prices:'Derniers Prix', eu_range_src:'Plage EU 30j: Eurostat COMEXT · WITS WorldBank',
    filter_all:'Tout', filter_rising:'En Hausse', filter_falling:'En Baisse', filter_stable:'Stable',
    col_product:'Produit', col_price:'Dernier Prix', col_country:'Pays',
    col_source:'Source', col_eu_range:'Plage EU 30j', col_eu_avg:'Moy EU (30j)',
    col_change:'Variation', col_status:'Statut',
    no_data:'Aucune donnée — cliquez sur "Collecter" pour recueillir les prix',
    status_rising:'▲ En Hausse', status_falling:'▼ En Baisse', status_stable:'● Stable',
    hist_trends:'Tendances historiques & prévision IA sur 30 jours',
    analytics_live:'Données en direct — Historique des prix et prévisions collectés automatiquement.',
    current_price:'Prix Actuel', avg_30:'Moyenne 30 Jours', low_30:'Bas 30 Jours', high_30:'Haut 30 Jours',
    price_history:'Historique des Prix', all_data_points:'Tous les points de données enregistrés',
    forecast_30:'Prévision 30 Jours', linear_proj:'Projection tendance linéaire',
    rising_trend:'▲ Tendance haussière', falling_trend:'▼ Tendance baissière',
    no_history:`Aucun historique · Cliquez d'abord sur Collecter`,
    need_points:'5+ points de données nécessaires',
    all_products_title:'Tous les Produits', cats_tracked:`20 catégories · cliquez sur une carte pour l'analyse`,
    products_live:'Données en direct — Prix collectés automatiquement.',
    price_alerts:'Alertes de Prix', alert_subtitle:'Déclenchées quand le prix bouge ≥3%',
    clear_all:'Tout effacer', no_alerts:'Aucune Alerte Active', all_normal:'Tous les prix dans la plage normale',
    intel_scores:'📊 Scores Intelligence Produit',
    intel_subtitle:'Score de confiance · Signal Acheter / Conserver / Vendre',
    alert_thresholds:`Seuils d'Alerte`, how_triggered:'Comment les alertes sont déclenchées',
    col_alert_type:`Type d'Alerte`, col_trigger:'Déclencheur', col_action:'Action',
    medium_trigger:'Prix bouge 3–9% vs précédent', high_trigger:'Prix bouge 10%+ vs précédent',
    auto_trigger:'Toutes les 6 heures', shown_panel:'Affiché dans le panneau',
    highlighted:'Mis en évidence', auto_refresh:'Tableau de bord actualisé auto',
    data_sources:'Sources de Données', sources_subtitle:'Base 136 sources · ONU, USDA, FAO & fournisseurs',
    active_scraping:'Sources de Collecte Actives', official_trade:'Sources Commerciales Officielles', premium:'Sources Premium',
    weather_title:'🌡️ Météo & Prévisions Prix',
    weather_subtitle:'20 catégories · météo Open-Meteo en direct · vue 12 mois',
    how_to_use:`Mode d'emploi`,
    weather_hint:'Sélectionnez une catégorie → la carte affiche les régions productrices → sélectionnez un pays pour le graphique.',
    product_category:'📦 CATÉGORIE PRODUIT', growing_region:'🌍 RÉGION PRODUCTRICE / PAYS',
    period:'📅 PÉRIODE',
    period_1m:'1 Mois', period_3m:'3 Mois', period_6m:'6 Mois', period_12m:'12 Mois',
    product_lbl:'Produit', region_lbl:'Région', current_price_lbl:'Prix Actuel',
    current_temp:'Temp. Actuelle', data_sources_lbl:'Sources',
    map_title:'🗺️ Régions Productrices', click_marker:'Cliquez un marqueur pour sélectionner ce pays',
    loading_weather:'⏳ Chargement météo...',
    chart_title:'📈 Prix + Température',
    legend_hist:'Plein = historique', legend_fore:'Pointillé = prévision', legend_temp:'Orange = température',
    all_regions:'🌐 Toutes les Régions pour', forecast_sources:'📚 Sources de Prévision pour',
    supplier_catalog:'Catalogue Fournisseur', catalog_subtitle:'CALCONUT 09/03/2026 · prix 24h · MOQ 3 000kg',
    upload_price_list:'📄 Télécharger Liste', reading:'⏳ Lecture...',
    upload_success:'✅ produits extraits de', upload_error:`⚠️ Impossible d'extraire les données`,
    search_catalog:'Rechercher...', items:'articles',
    sort_az:'A→Z', sort_price_asc:'Prix ↑', sort_price_desc:'Prix ↓', sort_new:'Nouveau',
    col_packaging:'Emballage', col_qty:'Qté', col_availability:'Disponibilité',
    col_price_unit:'Prix/unité', col_origin:'Origine', col_notes:'Notes', col_category:'Catégorie',
    no_products:'Aucun produit trouvé',
    top5_title:'⭐ TOP 5 Produits', top5_subtitle:'20 catégories · liste NICO · benchmarks EU',
    upload_new:'📄 Télécharger Nouvelle Liste', reset_upload:'Réinitialiser',
    rank:'Rang', grade:'Classe', type:'Type', price_range_col:'Fourchette Prix', note:'Note',
    hm_label:'HM', top5_eu_range:'Plage EU', top5_volatility:'Volatilité',
    nl_title:'🇳🇱 Prix Proposés NL', nl_subtitle:'Liste de gros néerlandaise · 01–31/03/2026',
    nl_banner_title:'Prix Proposés NL — Mise à jour auto depuis document',
    nl_banner_desc:'Téléchargez une liste PDF ou Word et NICO extraira automatiquement tous les produits.',
    last_upload:'Dernier upload :', nl_items_updated:'produits mis à jour depuis le dernier upload.',
    search_nl:'Rechercher...', reset:'Réinitialiser',
    market_intel:'Intelligence Marché', intel_based:'Basé sur calendrier cultural · moteurs prix · sources',
    loading_intel:'⏳ Chargement données intelligence...',
    supply_risk:'⚠️ Risque Approvisionnement', forecast_card:'📈 Prévision 30 Jours',
    recommended_action:'💡 Action Recommandée', price_range_card:'📊 Fourchette de Prix',
    today:`vs aujourd'hui`, urgency_lbl:'Urgence', score_lbl:'Score',
    supply_alert:'Alerte Approvisionnement', alt_sourcing:'🔄 Approvisionnement Alternatif',
    alt_ranked:'Classé par disponibilité × prix × qualité',
    ai_rec:'💡 Recommandation IA',
    crop_calendar:'🌱 Calendrier Cultural', bloom:'🌸 Floraison', harvest:'🌿 Récolte',
    export_season:'📦 Saison Export', risk_window:'⚠️ Fenêtre de Risque', marketing_year:'📅 Année Marketing',
    price_drivers:'📊 Principaux Moteurs de Prix',
    pricing_formula:'💡 Formule de Prix', data_sources_card:'📚 Sources de Données',
    confidence_lbl:'CONFIANCE',
    buy:'ACHETER', hold:'CONSERVER', sell:'VENDRE', wait:'ATTENDRE', buy_now:'ACHETER MAINTENANT',
    general:'Général', new_badge:'NOUVEAU', on_stock:'En stock', on_request:'Sur demande',
    per_kg:'par kg', loading_map:'Chargement...',
  },

  /* ─── GERMAN ──────────────────────────────────────────────────────── */
  de: {
    nav_home:'Startseite', nav_prices:'Preise / Prognose', nav_products:'Alle Produkte',
    nav_offered:'Alle Angebotspreise', nav_best:'5 Bestseller',
    nav_nl:'Angebotspreis NL', nav_weather:'Wetter / Preisprognose',
    nav_alerts:'Benachrichtigungen', nav_sources:'Quellen',
    profile:'Profil', logout:'Abmelden', refresh:'↻ Aktualisieren', scrape:'⬇ Daten Abrufen',
    loading:'Laden...', scraping:'Abrufen...',
    overview:'Übersicht', sources_line:'Quellen: UN Comtrade · USDA · FAOSTAT',
    live_scraped:'Live-Daten',
    live_desc:'Alle Preise werden automatisch vom NICO-Scraper gesammelt. Klicken Sie auf',
    live_btn:'Daten Abrufen', live_end:'für die neuesten Preise.',
    upgrade_title:'💎 Upgrade auf Premium',
    upgrade_desc:'Verbinden Sie Vesper, Mintec oder Expana für Echtzeit-EU-Benchmarkpreise.',
    view_sources:'Quellen Anzeigen →',
    total_products:'📦 Verfolgte Produkte', avg_price:'💵 Durchschnittspreis',
    most_expensive:'👑 Teuerstes', active_alerts:'🔔 Aktive Alarme',
    new_this_update:'+3 neu in diesem Update', across_cats:'über alle Kategorien',
    price_movements:'Preisbewegungen erkannt', all_stable:'alle Preise stabil',
    price_comparison:'Preisvergleich', all_products_usd:'Alle Produkte',
    price_trend:'Preistrend', last_readings:'Letzte 20 Messwerte',
    latest_prices:'Aktuelle Preise', eu_range_src:'30T EU-Bereich: Eurostat COMEXT · WITS WorldBank',
    filter_all:'Alle', filter_rising:'Steigend', filter_falling:'Fallend', filter_stable:'Stabil',
    col_product:'Produkt', col_price:'Letzter Preis', col_country:'Land',
    col_source:'Datenquelle', col_eu_range:'30T EU-Bereich', col_eu_avg:'EU Durchschn. (30T)',
    col_change:'Änderung', col_status:'Status',
    no_data:'Keine Daten — klicken Sie auf "Daten Abrufen"',
    status_rising:'▲ Steigend', status_falling:'▼ Fallend', status_stable:'● Stabil',
    hist_trends:'Historische Trends & 30-Tage KI-Prognose',
    analytics_live:'Live-Daten — Preishistorie und Prognosen aus automatisch gesammelten Daten.',
    current_price:'Aktueller Preis', avg_30:'30-Tage Durchschnitt', low_30:'30-Tage Tief', high_30:'30-Tage Hoch',
    price_history:'Preishistorie', all_data_points:'Alle aufgezeichneten Datenpunkte',
    forecast_30:'30-Tage-Prognose', linear_proj:'Lineare Trendprojektion',
    rising_trend:'▲ Aufwärtstrend', falling_trend:'▼ Abwärtstrend',
    no_history:'Keine Historie · Zuerst Daten abrufen',
    need_points:'Mindestens 5 Datenpunkte benötigt',
    all_products_title:'Alle Produkte', cats_tracked:'20 Kategorien · Karte anklicken für Analyse',
    products_live:'Live-Daten — Alle Produktpreise automatisch gesammelt.',
    price_alerts:'Preisalarme', alert_subtitle:'Ausgelöst bei Preisbewegung ≥3%',
    clear_all:'Alle löschen', no_alerts:'Keine Aktiven Alarme', all_normal:'Alle Preise im Normalbereich',
    intel_scores:'📊 Produkt-Intelligenz-Scores',
    intel_subtitle:'Vertrauenswert · Kaufen / Halten / Verkaufen Signal',
    alert_thresholds:'Alarmschwellen', how_triggered:'Wie Alarme ausgelöst werden',
    col_alert_type:'Alarmtyp', col_trigger:'Auslöser', col_action:'Aktion',
    medium_trigger:'Preis bewegt sich 3–9% vs vorherig', high_trigger:'Preis bewegt sich 10%+ vs vorherig',
    auto_trigger:'Alle 6 Stunden', shown_panel:'Im Alarmbereich angezeigt',
    highlighted:'Prominent hervorgehoben', auto_refresh:'Dashboard aktualisiert automatisch',
    data_sources:'Datenquellen', sources_subtitle:'136-Quellen-Datenbank · UN, USDA, FAO & Branche',
    active_scraping:'Aktive Scraping-Quellen', official_trade:'Offizielle Handelsquellen', premium:'Premium-Quellen',
    weather_title:'🌡️ Wetter & Preisprognose',
    weather_subtitle:'20 Kategorien · Live Open-Meteo Wetter · 12-Monats-Ansicht',
    how_to_use:'Anleitung',
    weather_hint:'Wählen Sie eine Produktkategorie → Karte zeigt Anbauregionen → Land wählen für Preis & Wettergrafik.',
    product_category:'📦 PRODUKTKATEGORIE', growing_region:'🌍 ANBAUREGION / LAND',
    period:'📅 ZEITRAUM',
    period_1m:'1 Monat', period_3m:'3 Monate', period_6m:'6 Monate', period_12m:'12 Monate',
    product_lbl:'Produkt', region_lbl:'Region', current_price_lbl:'Aktueller Preis',
    current_temp:'Aktuelle Temp.', data_sources_lbl:'Datenquellen',
    map_title:'🗺️ Anbauregionen', click_marker:'Marker anklicken um Land auszuwählen',
    loading_weather:'⏳ Wetterdaten laden...',
    chart_title:'📈 Preis + Temperatur',
    legend_hist:'Linie = Preishistorie', legend_fore:'Gestrichelt = Prognose', legend_temp:'Orange = Temperatur',
    all_regions:'🌐 Alle Anbauregionen für', forecast_sources:'📚 Prognosequellen für',
    supplier_catalog:'Lieferantenkatalog', catalog_subtitle:'CALCONUT 09/03/2026 · 24h Preise · MOQ 3.000kg',
    upload_price_list:'📄 Preisliste Hochladen', reading:'⏳ Lesen...',
    upload_success:'✅ Produkte extrahiert aus', upload_error:'⚠️ Daten konnten nicht extrahiert werden',
    search_catalog:'Katalog durchsuchen...', items:'Artikel',
    sort_az:'A→Z', sort_price_asc:'Preis ↑', sort_price_desc:'Preis ↓', sort_new:'Neu Zuerst',
    col_packaging:'Verpackung', col_qty:'Menge', col_availability:'Verfügbarkeit',
    col_price_unit:'Preis/Einheit', col_origin:'Herkunft', col_notes:'Notizen', col_category:'Kategorie',
    no_products:'Keine Produkte gefunden',
    top5_title:'⭐ TOP 5 Produkte', top5_subtitle:'20 Kategorien · NICO Produktliste · EU-Benchmarks',
    upload_new:'📄 Neue Preisliste Hochladen', reset_upload:'Upload Zurücksetzen',
    rank:'Rang', grade:'Klasse', type:'Typ', price_range_col:'Preisspanne', note:'Notiz',
    hm_label:'HM', top5_eu_range:'EU Spanne', top5_volatility:'Volatilität',
    nl_title:'🇳🇱 Angebotspreis NL', nl_subtitle:'Niederländische Großhandelsliste · 01–31/03/2026',
    nl_banner_title:'Angebotspreis NL — Automatische Aktualisierung aus Dokument',
    nl_banner_desc:'Laden Sie eine neue PDF oder Word-Preisliste hoch und NICO extrahiert automatisch alle Produkte.',
    last_upload:'Letzter Upload:', nl_items_updated:'aktualisierte/neue Produkte aus dem letzten Upload.',
    search_nl:'Produkte suchen...', reset:'Zurücksetzen',
    market_intel:'Marktintelligenz', intel_based:'Basierend auf Erntkalender · Preistreiber · Quellen',
    loading_intel:'⏳ Live-Intelligenzdaten laden...',
    supply_risk:'⚠️ Lieferrisiko', forecast_card:'📈 30-Tage-Prognose',
    recommended_action:'💡 Empfohlene Aktion', price_range_card:'📊 Preisspanne',
    today:'vs heute', urgency_lbl:'Dringlichkeit', score_lbl:'Wertung',
    supply_alert:'Lieferalarm', alt_sourcing:'🔄 Alternative Beschaffung',
    alt_ranked:'Gerankt nach Verfügbarkeit × Preis × Qualität',
    ai_rec:'💡 KI-Empfehlung',
    crop_calendar:'🌱 Erntkalender', bloom:'🌸 Blüte', harvest:'🌿 Ernte',
    export_season:'📦 Exportsaison', risk_window:'⚠️ Wichtiges Risikofenster', marketing_year:'📅 Marktjahr',
    price_drivers:'📊 Wichtige Preistreiber',
    pricing_formula:'💡 Preisformel', data_sources_card:'📚 Datenquellen',
    confidence_lbl:'VERTRAUEN',
    buy:'KAUFEN', hold:'HALTEN', sell:'VERKAUFEN', wait:'WARTEN', buy_now:'JETZT KAUFEN',
    general:'Allgemein', new_badge:'NEU', on_stock:'Auf Lager', on_request:'Auf Anfrage',
    per_kg:'pro kg', loading_map:'Laden...',
  },

  /* ─── SPANISH ─────────────────────────────────────────────────────── */
  es: {
    nav_home:'Inicio', nav_prices:'Precios / Pronóstico', nav_products:'Todos los Productos',
    nav_offered:'Todos los Precios Ofrecidos', nav_best:'5 Más Vendidos',
    nav_nl:'Precio Ofrecido NL', nav_weather:'Clima / Pronóstico de Precios',
    nav_alerts:'Alertas', nav_sources:'Fuentes',
    profile:'Perfil', logout:'Cerrar Sesión', refresh:'↻ Actualizar', scrape:'⬇ Obtener Datos',
    loading:'Cargando...', scraping:'Obteniendo...',
    overview:'Resumen', sources_line:'Fuentes: ONU Comtrade · USDA · FAOSTAT',
    live_scraped:'Datos en vivo',
    live_desc:'Todos los precios son recopilados automáticamente por el scraper de NICO. Haga clic en',
    live_btn:'Obtener Datos', live_end:'para obtener los últimos precios.',
    upgrade_title:'💎 Actualizar a Premium',
    upgrade_desc:'Conecte Vesper, Mintec o Expana para precios de referencia EU en tiempo real.',
    view_sources:'Ver Fuentes →',
    total_products:'📦 Productos Rastreados', avg_price:'💵 Precio Promedio',
    most_expensive:'👑 Más Caro', active_alerts:'🔔 Alertas Activas',
    new_this_update:'+3 nuevos en esta actualización', across_cats:'en todas las categorías',
    price_movements:'movimientos de precios detectados', all_stable:'todos los precios estables',
    price_comparison:'Comparación de Precios', all_products_usd:'Todos los productos',
    price_trend:'Tendencia de Precios', last_readings:'Últimas 20 lecturas',
    latest_prices:'Últimos Precios', eu_range_src:'Rango EU 30d: Eurostat COMEXT · WITS WorldBank',
    filter_all:'Todo', filter_rising:'Subiendo', filter_falling:'Bajando', filter_stable:'Estable',
    col_product:'Producto', col_price:'Último Precio', col_country:'País',
    col_source:'Fuente', col_eu_range:'Rango EU 30d', col_eu_avg:'Prom EU (30d)',
    col_change:'Cambio', col_status:'Estado',
    no_data:'Sin datos — haga clic en "Obtener Datos"',
    status_rising:'▲ Subiendo', status_falling:'▼ Bajando', status_stable:'● Estable',
    hist_trends:'Tendencias históricas & pronóstico IA 30 días',
    analytics_live:'Datos en vivo — Historial de precios recopilado automáticamente.',
    current_price:'Precio Actual', avg_30:'Promedio 30 Días', low_30:'Mínimo 30 Días', high_30:'Máximo 30 Días',
    price_history:'Historial de Precios', all_data_points:'Todos los puntos de datos registrados',
    forecast_30:'Pronóstico 30 Días', linear_proj:'Proyección de tendencia lineal',
    rising_trend:'▲ Tendencia alcista', falling_trend:'▼ Tendencia bajista',
    no_history:'Sin historial · Haga clic en Obtener Datos primero',
    need_points:'Se necesitan 5+ puntos de datos',
    all_products_title:'Todos los Productos', cats_tracked:'20 categorías · haga clic para análisis',
    products_live:'Datos en vivo — Precios recopilados automáticamente.',
    price_alerts:'Alertas de Precios', alert_subtitle:'Activadas cuando el precio se mueve ≥3%',
    clear_all:'Borrar todo', no_alerts:'Sin Alertas Activas', all_normal:'Todos los precios en rango normal',
    intel_scores:'📊 Puntuaciones de Inteligencia',
    intel_subtitle:'Puntuación de confianza · Señal Comprar / Mantener / Vender',
    alert_thresholds:'Umbrales de Alerta', how_triggered:'Cómo se activan las alertas',
    col_alert_type:'Tipo de Alerta', col_trigger:'Activación', col_action:'Acción',
    medium_trigger:'Precio se mueve 3–9% vs anterior', high_trigger:'Precio se mueve 10%+ vs anterior',
    auto_trigger:'Cada 6 horas', shown_panel:'Mostrado en panel de alertas',
    highlighted:'Destacado', auto_refresh:'Panel actualiza automáticamente',
    data_sources:'Fuentes de Datos', sources_subtitle:'Base de datos 136 fuentes · ONU, USDA, FAO',
    active_scraping:'Fuentes de Recopilación Activas', official_trade:'Fuentes Comerciales Oficiales', premium:'Fuentes Premium',
    weather_title:'🌡️ Clima & Pronóstico de Precios',
    weather_subtitle:'20 categorías · clima Open-Meteo en vivo · vista 12 meses',
    how_to_use:'Cómo usar',
    weather_hint:'Seleccione una categoría → el mapa muestra regiones productoras → seleccione un país para el gráfico.',
    product_category:'📦 CATEGORÍA DE PRODUCTO', growing_region:'🌍 REGIÓN PRODUCTORA / PAÍS',
    period:'📅 PERÍODO',
    period_1m:'1 Mes', period_3m:'3 Meses', period_6m:'6 Meses', period_12m:'12 Meses',
    product_lbl:'Producto', region_lbl:'Región', current_price_lbl:'Precio Actual',
    current_temp:'Temp. Actual', data_sources_lbl:'Fuentes',
    map_title:'🗺️ Regiones Productoras', click_marker:'Haga clic en un marcador para seleccionar ese país',
    loading_weather:'⏳ Cargando datos meteorológicos...',
    chart_title:'📈 Precio + Temperatura',
    legend_hist:'Sólido = historial', legend_fore:'Discontinuo = pronóstico', legend_temp:'Naranja = temperatura',
    all_regions:'🌐 Todas las Regiones para', forecast_sources:'📚 Fuentes de Pronóstico para',
    supplier_catalog:'Catálogo de Proveedores', catalog_subtitle:'CALCONUT 09/03/2026 · precios 24h · MOQ 3.000kg',
    upload_price_list:'📄 Subir Lista de Precios', reading:'⏳ Leyendo...',
    upload_success:'✅ productos extraídos de', upload_error:'⚠️ No se pudo extraer datos',
    search_catalog:'Buscar catálogo...', items:'artículos',
    sort_az:'A→Z', sort_price_asc:'Precio ↑', sort_price_desc:'Precio ↓', sort_new:'Nuevos Primero',
    col_packaging:'Embalaje', col_qty:'Cant.', col_availability:'Disponibilidad',
    col_price_unit:'Precio/unidad', col_origin:'Origen', col_notes:'Notas', col_category:'Categoría',
    no_products:'No se encontraron productos',
    top5_title:'⭐ TOP 5 Productos', top5_subtitle:'20 categorías · lista NICO · benchmarks EU',
    upload_new:'📄 Subir Nueva Lista', reset_upload:'Restablecer',
    rank:'Rango', grade:'Grado', type:'Tipo', price_range_col:'Rango de Precio', note:'Nota',
    hm_label:'AM', top5_eu_range:'Rango EU', top5_volatility:'Volatilidad',
    nl_title:'🇳🇱 Precio Ofrecido NL', nl_subtitle:'Lista mayorista holandesa · 01–31/03/2026',
    nl_banner_title:'Precio Ofrecido NL — Actualización auto desde documento',
    nl_banner_desc:'Suba una lista PDF o Word y NICO extraerá automáticamente todos los productos.',
    last_upload:'Último carga:', nl_items_updated:'productos actualizados desde la última carga.',
    search_nl:'Buscar productos...', reset:'Restablecer',
    market_intel:'Inteligencia de Mercado', intel_based:'Basado en calendario de cultivos · impulsores de precios',
    loading_intel:'⏳ Cargando datos de inteligencia...',
    supply_risk:'⚠️ Riesgo de Suministro', forecast_card:'📈 Pronóstico 30 Días',
    recommended_action:'💡 Acción Recomendada', price_range_card:'📊 Rango de Precios',
    today:'vs hoy', urgency_lbl:'Urgencia', score_lbl:'Puntuación',
    supply_alert:'Alerta de Suministro', alt_sourcing:'🔄 Suministro Alternativo',
    alt_ranked:'Clasificado por disponibilidad × precio × calidad',
    ai_rec:'💡 Recomendación IA',
    crop_calendar:'🌱 Calendario de Cultivos', bloom:'🌸 Floración', harvest:'🌿 Cosecha',
    export_season:'📦 Temporada de Exportación', risk_window:'⚠️ Ventana de Riesgo', marketing_year:'📅 Año de Mercado',
    price_drivers:'📊 Principales Impulsores de Precio',
    pricing_formula:'💡 Fórmula de Precio', data_sources_card:'📚 Fuentes de Datos',
    confidence_lbl:'CONFIANZA',
    buy:'COMPRAR', hold:'MANTENER', sell:'VENDER', wait:'ESPERAR', buy_now:'COMPRAR AHORA',
    general:'General', new_badge:'NUEVO', on_stock:'En stock', on_request:'Bajo pedido',
    per_kg:'por kg', loading_map:'Cargando...',
  },

  /* ─── ITALIAN ─────────────────────────────────────────────────────── */
  it: {
    nav_home:'Home', nav_prices:'Prezzi / Previsioni', nav_products:'Tutti i Prodotti',
    nav_offered:'Tutti i Prezzi Offerti', nav_best:'5 Più Venduti',
    nav_nl:'Prezzo Offerto NL', nav_weather:'Meteo / Previsioni Prezzi',
    nav_alerts:'Avvisi', nav_sources:'Fonti',
    profile:'Profilo', logout:'Esci', refresh:'↻ Aggiorna', scrape:'⬇ Recupera Dati',
    loading:'Caricamento...', scraping:'Recupero...',
    overview:'Panoramica', sources_line:'Fonti: ONU Comtrade · USDA · FAOSTAT',
    live_scraped:'Dati raccolti in tempo reale',
    live_desc:'Tutti i prezzi vengono raccolti automaticamente dallo scraper NICO. Clicca su',
    live_btn:'Recupera Dati', live_end:'per i prezzi più recenti.',
    upgrade_title:'💎 Passa a Premium',
    upgrade_desc:'Collega Vesper, Mintec o Expana per prezzi di riferimento EU in tempo reale.',
    view_sources:'Vedi Fonti →',
    total_products:'📦 Prodotti Monitorati', avg_price:'💵 Prezzo Medio',
    most_expensive:'👑 Più Costoso', active_alerts:'🔔 Avvisi Attivi',
    new_this_update:'+3 nuovi in questo aggiornamento', across_cats:'in tutte le categorie',
    price_movements:'movimenti di prezzo rilevati', all_stable:'tutti i prezzi stabili',
    price_comparison:'Confronto Prezzi', all_products_usd:'Tutti i prodotti',
    price_trend:'Andamento Prezzi', last_readings:'Ultime 20 letture',
    latest_prices:'Ultimi Prezzi', eu_range_src:'Intervallo EU 30g: Eurostat COMEXT · WITS WorldBank',
    filter_all:'Tutto', filter_rising:'In Rialzo', filter_falling:'In Ribasso', filter_stable:'Stabile',
    col_product:'Prodotto', col_price:'Ultimo Prezzo', col_country:'Paese',
    col_source:'Fonte', col_eu_range:'Intervallo EU 30g', col_eu_avg:'Media EU (30g)',
    col_change:'Variazione', col_status:'Stato',
    no_data:'Nessun dato — clicca su "Recupera Dati"',
    status_rising:'▲ In Rialzo', status_falling:'▼ In Ribasso', status_stable:'● Stabile',
    hist_trends:'Tendenze storiche & previsione IA 30 giorni',
    analytics_live:'Dati in tempo reale — Storico prezzi raccolto automaticamente.',
    current_price:'Prezzo Attuale', avg_30:'Media 30 Giorni', low_30:'Minimo 30 Giorni', high_30:'Massimo 30 Giorni',
    price_history:'Storico Prezzi', all_data_points:'Tutti i punti dati registrati',
    forecast_30:'Previsione 30 Giorni', linear_proj:'Proiezione tendenza lineare',
    rising_trend:'▲ Tendenza rialzista', falling_trend:'▼ Tendenza ribassista',
    no_history:'Nessuno storico · Clicca prima su Recupera Dati',
    need_points:'Servono 5+ punti dati',
    all_products_title:'Tutti i Prodotti', cats_tracked:'20 categorie · clicca su una scheda per analisi',
    products_live:'Dati in tempo reale — Prezzi raccolti automaticamente.',
    price_alerts:'Avvisi Prezzi', alert_subtitle:'Attivati quando il prezzo si muove ≥3%',
    clear_all:'Cancella tutto', no_alerts:'Nessun Avviso Attivo', all_normal:'Tutti i prezzi nel range normale',
    intel_scores:'📊 Punteggi Intelligenza Prodotto',
    intel_subtitle:'Punteggio fiducia · Segnale Acquista / Mantieni / Vendi',
    alert_thresholds:'Soglie di Avviso', how_triggered:'Come vengono attivati gli avvisi',
    col_alert_type:'Tipo Avviso', col_trigger:'Attivazione', col_action:'Azione',
    medium_trigger:'Prezzo si muove 3–9% vs precedente', high_trigger:'Prezzo si muove 10%+ vs precedente',
    auto_trigger:'Ogni 6 ore', shown_panel:'Mostrato nel pannello avvisi',
    highlighted:'Evidenziato', auto_refresh:'Dashboard aggiornato automaticamente',
    data_sources:'Fonti Dati', sources_subtitle:'Database 136 fonti · ONU, USDA, FAO & settore',
    active_scraping:'Fonti di Raccolta Attive', official_trade:'Fonti Commerciali Ufficiali', premium:'Fonti Premium',
    weather_title:'🌡️ Meteo & Previsioni Prezzi',
    weather_subtitle:'20 categorie · meteo Open-Meteo live · vista 12 mesi',
    how_to_use:'Come usare',
    weather_hint:'Seleziona una categoria → la mappa mostra le regioni produttrici → seleziona un paese per il grafico.',
    product_category:'📦 CATEGORIA PRODOTTO', growing_region:'🌍 REGIONE PRODUTTRICE / PAESE',
    period:'📅 PERIODO',
    period_1m:'1 Mese', period_3m:'3 Mesi', period_6m:'6 Mesi', period_12m:'12 Mesi',
    product_lbl:'Prodotto', region_lbl:'Regione', current_price_lbl:'Prezzo Attuale',
    current_temp:'Temp. Attuale', data_sources_lbl:'Fonti',
    map_title:'🗺️ Regioni Produttrici', click_marker:'Clicca un marcatore per selezionare quel paese',
    loading_weather:'⏳ Caricamento dati meteo...',
    chart_title:'📈 Prezzo + Temperatura',
    legend_hist:'Linea = storico prezzi', legend_fore:'Tratteggio = previsione', legend_temp:'Arancione = temperatura',
    all_regions:'🌐 Tutte le Regioni per', forecast_sources:'📚 Fonti Previsione per',
    supplier_catalog:'Catalogo Fornitori', catalog_subtitle:'CALCONUT 09/03/2026 · prezzi 24h · MOQ 3.000kg',
    upload_price_list:'📄 Carica Listino', reading:'⏳ Lettura...',
    upload_success:'✅ prodotti estratti da', upload_error:'⚠️ Impossibile estrarre dati',
    search_catalog:'Cerca catalogo...', items:'articoli',
    sort_az:'A→Z', sort_price_asc:'Prezzo ↑', sort_price_desc:'Prezzo ↓', sort_new:'Nuovi Prima',
    col_packaging:'Imballaggio', col_qty:'Qtà', col_availability:'Disponibilità',
    col_price_unit:'Prezzo/unità', col_origin:'Origine', col_notes:'Note', col_category:'Categoria',
    no_products:'Nessun prodotto trovato',
    top5_title:'⭐ TOP 5 Prodotti', top5_subtitle:'20 categorie · lista NICO · benchmark EU',
    upload_new:'📄 Carica Nuovo Listino', reset_upload:'Reimposta',
    rank:'Posizione', grade:'Classe', type:'Tipo', price_range_col:'Intervallo Prezzi', note:'Nota',
    hm_label:'AM', top5_eu_range:'Intervallo EU', top5_volatility:'Volatilità',
    nl_title:'🇳🇱 Prezzo Offerto NL', nl_subtitle:`Lista all'ingrosso olandese · 01–31/03/2026`,
    nl_banner_title:'Prezzo Offerto NL — Aggiornamento auto da documento',
    nl_banner_desc:'Carica un nuovo PDF o Word e NICO estrarrà automaticamente tutti i prodotti.',
    last_upload:'Ultimo caricamento:', nl_items_updated:`prodotti aggiornati dall'ultimo caricamento.`,
    search_nl:'Cerca prodotti...', reset:'Reimposta',
    market_intel:'Intelligenza di Mercato', intel_based:'Basato su calendario colturale · fattori prezzo',
    loading_intel:'⏳ Caricamento dati intelligenza...',
    supply_risk:'⚠️ Rischio Fornitura', forecast_card:'📈 Previsione 30 Giorni',
    recommended_action:'💡 Azione Raccomandata', price_range_card:'📊 Intervallo Prezzi',
    today:'vs oggi', urgency_lbl:'Urgenza', score_lbl:'Punteggio',
    supply_alert:'Avviso Fornitura', alt_sourcing:'🔄 Approvvigionamento Alternativo',
    alt_ranked:'Classificato per disponibilità × prezzo × qualità',
    ai_rec:'💡 Raccomandazione IA',
    crop_calendar:'🌱 Calendario Colturale', bloom:'🌸 Fioritura', harvest:'🌿 Raccolta',
    export_season:'📦 Stagione Export', risk_window:'⚠️ Finestra di Rischio', marketing_year:'📅 Anno di Mercato',
    price_drivers:'📊 Principali Fattori di Prezzo',
    pricing_formula:'💡 Formula Prezzo', data_sources_card:'📚 Fonti Dati',
    confidence_lbl:'FIDUCIA',
    buy:'COMPRARE', hold:'TENERE', sell:'VENDERE', wait:'ASPETTARE', buy_now:'COMPRA ORA',
    general:'Generale', new_badge:'NUOVO', on_stock:'Disponibile', on_request:'Su richiesta',
    per_kg:'al kg', loading_map:'Caricamento...',
  },
};


// NAV_ITEMS is now a function so it picks up live translations
const getNavItems = (t) => [
  { id: 'dashboard',           label: t.nav_home,    icon: '⊞' },
  { id: 'analytics',           label: t.nav_prices,  icon: '📊' },
  { id: 'products',            label: t.nav_products,icon: '🌰' },
  { id: 'catalog',             label: t.nav_offered, icon: '📋' },
  { id: 'top5',                label: t.nav_best,    icon: '⭐', indent: true },
  { id: 'catalog_netherlands', label: t.nav_nl,      icon: '🇳🇱', indent: true },
  { id: 'weather',             label: t.nav_weather, icon: '🌡️' },
  { id: 'alerts',              label: t.nav_alerts,  icon: '🔔' },
  { id: 'sources',             label: t.nav_sources, icon: '🗄️' },
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
  .logo-icon { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #1E40AF, #2563EB); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(30,64,175,0.3); }
  .logo-text { font-size: 17px; font-weight: 800; letter-spacing: 1.5px; color: #1A1D2E; }
  .sidebar-section { padding: 16px 12px 4px; font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; margin: 2px 8px; border-radius: 9px; cursor: pointer; font-size: 13.5px; font-weight: 500; color: #6B7280; transition: all 0.18s; text-decoration: none; border: none; background: none; width: calc(100% - 16px); position: relative; }
  .nav-item:hover { background: #F5F6FD; color: #1A1D2E; }
  .nav-item.active { background: #EFF6FF; color: #1E40AF; font-weight: 600; }
  .nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: #1E40AF; border-radius: 0 3px 3px 0; }
  .nav-badge { margin-left: auto; background: #EF4444; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
  .sidebar-bottom { margin-top: auto; padding: 16px 12px; border-top: 1px solid #EAECF5; flex-shrink: 0; }
  .user-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px; }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1E40AF, #2563EB); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0; }
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
  .refresh-btn { background: #1E40AF; color: #fff; border: none; border-radius: 9px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .refresh-btn:hover { background: #1D4ED8; }
  .refresh-btn:disabled { background: #A5B4FC; cursor: not-allowed; }

  /* PAGE */
  .page { padding: 28px; min-width: 0; }
  .page-header { margin-bottom: 24px; }
  .page-title { font-size: 22px; font-weight: 800; color: #1A1D2E; margin-bottom: 2px; }
  .page-subtitle { font-size: 12px; color: #9CA3AF; font-family: 'JetBrains Mono', monospace; }

  /* BANNER */
  .upgrade-banner { background: linear-gradient(135deg, #1E40AF 0%, #2563EB 100%); border-radius: 14px; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; color: #fff; }
  .upgrade-banner-text { font-size: 13px; opacity: 0.9; margin-top: 2px; }
  .upgrade-banner-btn { background: #fff; color: #1E40AF; border: none; border-radius: 8px; padding: 8px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; transition: opacity 0.18s; flex-shrink: 0; }
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
  .carousel-btn:hover { background: #1E40AF; color: #fff; border-color: #1E40AF; }
  .carousel-btn.left { left: -14px; }
  .carousel-btn.right { right: -14px; }
  .table-tab { padding: 10px 16px; font-size: 13px; font-weight: 500; color: #9CA3AF; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.18s; background: none; border-top: none; border-left: none; border-right: none; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; flex-shrink: 0; }
  .table-tab.active { color: #1E40AF; border-bottom-color: #1E40AF; font-weight: 700; }

  /* BADGE */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .badge-green { background: #DCFCE7; color: #16A34A; }
  .badge-yellow { background: #FEF9C3; color: #CA8A04; }
  .badge-red { background: #FEE2E2; color: #DC2626; }
  .badge-blue { background: #DBEAFE; color: #2563EB; }
  .badge-purple { background: #DBEAFE; color: #1D4ED8; }
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
  .login-card { background: #fff; border-radius: 20px; padding: 44px 40px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(30,64,175,0.12); }
  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .login-input { width: 100%; padding: 12px 16px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif; color: #1A1D2E; outline: none; transition: border-color 0.18s; background: #FAFAFA; }
  .login-input:focus { border-color: #1E40AF; background: #fff; }
  .login-input::placeholder { color: #D1D5DB; }
  .login-btn { width: 100%; padding: 13px; background: #1E40AF; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; margin-top: 8px; }
  .login-btn:hover { background: #1D4ED8; }
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
  .scrape-progress-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#1E40AF,#2563EB); transition:width 0.4s ease; }
  .scrape-progress-label { font-size:10px; color:#9CA3AF; margin-top:3px; font-family:'JetBrains Mono',monospace; text-align:right; }

  /* SCRAPE SUCCESS POPUP */
  .scrape-success-popup { position:fixed; bottom:24px; right:24px; background:#10B981; color:#fff; padding:12px 20px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:0 4px 20px rgba(16,185,129,0.4); z-index:9999; display:flex; align-items:center; gap:8px; animation:fadeUp 0.3s ease forwards; }

  /* ── WEATHER TAB ── */
  .weather-map-container { width:100%; height:480px; border-radius:14px; overflow:hidden; border:1px solid #EAECF5; background:#1a3a5c; position:relative; }
  .weather-map-container iframe { width:100%; height:100%; border:none; }
  .weather-controls { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
  .weather-select { padding:8px 14px; border:1.5px solid #E5E7EB; border-radius:9px; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; color:#1A1D2E; background:#fff; outline:none; cursor:pointer; min-width:180px; }
  .weather-select:focus { border-color:#1E40AF; }
  .period-btn { padding:7px 16px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:1.5px solid #E5E7EB; background:#fff; color:#6B7280; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s; }
  .period-btn.active { background:#1E40AF; color:#fff; border-color:#1E40AF; }
  .period-btn:hover:not(.active) { background:#F5F6FD; border-color:#1E40AF; color:#1E40AF; }
  .weather-chart-card { background:#fff; border-radius:14px; border:1px solid #EAECF5; padding:22px 24px; margin-top:18px; }
  .weather-legend { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:14px; }
  .legend-item { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:600; color:#374151; }
  .legend-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
  .country-flag { font-size:18px; margin-right:4px; }
  .temp-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .temp-hot { background:#FEE2E2; color:#DC2626; }
  .temp-warm { background:#FEF9C3; color:#CA8A04; }
  .temp-cool { background:#DBEAFE; color:#2563EB; }
  .temp-cold { background:#DBEAFE; color:#1D4ED8; }
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
function SupplierCatalog({ fmt, currency, t = T.nl }) {
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
      if (!Array.isArray(items) || items.length === 0) throw new Error(t.no_products);
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
      borderColor: '#1E40AF',
      backgroundColor: '#1E40AF15',
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
            <div className="page-title">{t.nav_offered}</div>
            <div className="page-subtitle">CALCONUT 09/03/2026 · 24u prijzen · MOQ 3.000kg · {currency}</div>
          </div>

          {/* ── UPLOAD BANNER for All Offered Prices ── */}
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', position:'relative' }}>
            <span style={{ fontSize:18 }}>📋</span>
            <div style={{ flex:'1 1 200px' }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#1E3A8A' }}>{t.nav_offered} — {t.nl_banner_title.split('—')[1] || 'Auto-update'}</div>
              <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{t.nl_banner_desc}
                {uploadedData && <span style={{ color:'#10B981', marginLeft:6 }}>✅ {uploadedData.fileName} ({uploadedData.count} {t.items})</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
              <input ref={scFileRef} type="file" accept=".pdf,.docx,.doc" style={{ display:'none' }}
                onChange={e => e.target.files[0] && handleCatalogUpload(e.target.files[0])} />
              <button onClick={() => scFileRef.current?.click()} disabled={uploading}
                style={{ padding:'8px 16px', background:'#1E40AF', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? t.reading : t.upload_price_list}
              </button>
              {uploadedData && (
                <button onClick={() => { localStorage.removeItem('nico_catalog_upload'); setUploadedData(null); }}
                  style={{ padding:'7px 12px', background:'#FEF2F2', color:'#EF4444', border:'1px solid #FCA5A5', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  {t.reset}
                </button>
              )}
            </div>
            {uploadBanner && <div style={{ width:'100%', fontSize:12, color: uploadBanner.startsWith('✅') ? '#10B981' : '#EF4444', marginTop:2 }}>{uploadBanner}</div>}
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
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12 }}>
        <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>📋</span>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:'#1E3A8A' }}>Fixed Supplier Data — CALCONUT Only</div>
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
                <span style={{ marginLeft:4, background: activeTab===t ? '#EFF6FF' : '#F3F4F6', color: activeTab===t ? '#1E40AF' : '#9CA3AF', padding:'1px 5px', borderRadius:8, fontSize:10, fontWeight:700 }}>
                  {CATALOG_DATA[t]?.length || 0}
                </span>
              )}
            </button>
          ))}
        </div>
        <button className="carousel-btn right" onClick={() => scroll(1)} title="Scroll right">›</button>
      </div>

      <div className="card" style={{ borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:'none' }}>


            {/* Search + sort + legend row */}
            <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                style={{ padding:'8px 14px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', width:200, minWidth:120, color:'#1A1D2E', background:'#FAFAFA', flex:'1 1 140px' }}
              />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding:'7px 10px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:12, background:'#fff', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <option value="name">{t.sort_az}</option>
                <option value="price_asc">{t.sort_price_asc}</option>
                <option value="price_desc">{t.sort_price_desc}</option>
                <option value="new">{t.sort_new}</option>
              </select>
              <span style={{ fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap' }}>{rows.length} {t.items}</span>
              <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:'#1D4ED8', background:'#DBEAFE', padding:'3px 9px', borderRadius:6, fontWeight:600 }}>🟣 CALCONUT = live offer</span>
              </div>
            </div>

            {/* Scrollable table */}
            <div className="table-scroll-wrap">
              <table className="data-table" style={{ minWidth:780 }}>
                <thead>
                  <tr>
                    <th style={{ minWidth:180 }}>{t.col_product}</th>
                    <th style={{ minWidth:90 }}>{t.col_origin}</th>
                    <th style={{ minWidth:110 }}>{t.col_packaging}</th>
                    <th style={{ minWidth:90 }}>{t.col_availability}</th>
                    <th style={{ minWidth:80 }}>{t.col_price_unit}</th>
                    <th style={{ minWidth:80 }}>Truck Load</th>
                    <th style={{ minWidth:80 }}>{t.col_qty}</th>
                    <th style={{ minWidth:80 }}>{t.col_source}</th>
                    <th style={{ minWidth:160 }}>{t.col_notes}</th>
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
                          color: isDiscount ? '#EF4444' : isCalconut ? '#1E40AF' : '#E8A838', whiteSpace:'nowrap' }}>
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

function NetherlandsSupplyCatalog({ currency, t = T.nl }) {
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
      const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc'); // eslint-disable-line no-unused-vars

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
        <div className="page-title">{t.nl_title}</div>
        <div className="page-subtitle">
          {uploadData ? `${uploadData.fileName} · uploaded ${daysSinceUpload === 0 ? 'today' : daysSinceUpload + 'd ago'}` : 'Netherlands wholesale list · 01-31/03/2026'}
          {' · '}{currency} display
        </div>
      </div>

      {/* Upload banner */}
      {bannerVisible && (
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:12, position:'relative', flexWrap:'wrap' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🇳🇱</span>
          <div style={{ flex:'1 1 200px' }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#1E3A8A' }}>{t.nl_banner_title}</div>
            <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
              {t.nl_banner_desc}
              {uploadData && <span style={{ color:'#10B981', marginLeft:6 }}>✅ Last upload: {uploadData.fileName} ({uploadData.count} products)</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display:'none' }}
              onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ padding:'7px 16px', background:'#1E40AF', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? t.reading : t.upload_price_list}
            </button>
            {uploadData && (
              <button onClick={() => { localStorage.removeItem('nico_nl_upload'); setUploadData(null); }}
                style={{ padding:'7px 12px', background:'#FEF2F2', color:'#EF4444', border:'1px solid #FCA5A5', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {t.reset}
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
                color: activeTab===t ? '#1E40AF' : '#6B7280',
                borderBottom: activeTab===t ? '2px solid #1E40AF' : '2px solid transparent',
                marginBottom:-2, whiteSpace:'nowrap', transition:'all 0.15s' }}>
              {t}
              <span style={{ marginLeft:4, fontSize:10, background: activeTab===t ? '#EFF6FF' : '#F3F4F6', color: activeTab===t ? '#1E40AF' : '#9CA3AF', padding:'1px 6px', borderRadius:10 }}>
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
            placeholder={t.search_nl}
            style={{ padding:'8px 14px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', flex:'1 1 180px', maxWidth:280, color:'#1A1D2E', background:'#FAFAFA' }} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding:'8px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, background:'#fff', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <option value="name">{t.sort_az}</option>
            <option value="price_asc">{t.sort_price_asc}</option>
            <option value="price_desc">{t.sort_price_desc}</option>
            <option value="new">{t.sort_new}</option>
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
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:13, color:'#1E40AF' }}>
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

function Top5Catalog({ currency, t = T.nl }) {
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
        <div className="page-title">{t.top5_title}</div>
        <div className="page-subtitle">{t.top5_subtitle} · {currency}</div>
      </div>

      {/* Upload + sort controls */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
        <input ref={top5FileRef} type="file" accept=".pdf,.docx,.doc" style={{ display:'none' }}
          onChange={e => e.target.files[0] && handleTop5Upload(e.target.files[0])} />
        <button onClick={() => top5FileRef.current?.click()} disabled={uploading}
          style={{ padding:'7px 14px', background:'#1E40AF', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', opacity: uploading ? 0.7 : 1 }}>
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
            {t.reset_upload}
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
              <span style={{ marginLeft:4, background: activeTab===t ? '#EFF6FF' : '#F3F4F6', color: activeTab===t ? '#1E40AF' : '#9CA3AF', padding:'1px 5px', borderRadius:8, fontSize:10, fontWeight:700 }}>5</span>
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
              EU wholesale range: <strong style={{ color:'#1E40AF' }}>{fmtRange(catData.priceRange)}</strong>
              {' '}·{' '}
              <span className={`badge ${volatilityBadge(catData.volatility)}`} style={{ fontSize:10 }}>
                {catData.volatility} volatility
              </span>
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.search_nl}
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
                const rankColors = ['#F59E0B','#9CA3AF','#B45309','#1E40AF','#1E40AF'];
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
                        <div style={{ fontSize:10, color:'#1D4ED8', marginTop:2, fontWeight:600 }}>⬆ High Margin</div>
                      )}
                    </td>
                    <td style={{ fontSize:12, color:'#6B7280' }}>{row.origin}</td>
                    <td style={{ fontSize:12, color:'#6B7280' }}>{row.type}</td>
                    <td>
                      <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", background:'#F3F4F6', padding:'2px 7px', borderRadius:5, fontWeight:600 }}>
                        {row.grade}
                      </span>
                    </td>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#1E40AF', fontSize:12 }}>
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
  return '#2563EB';
}
function tempClass(c) { // eslint-disable-line no-unused-vars
  if (c >= 30) return 'temp-hot';
  if (c >= 18) return 'temp-warm';
  if (c >= 5)  return 'temp-cool';
  return 'temp-cold';
}

function WeatherForecast({ currency, t = T.nl }) {
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
              if (ctx.datasetIndex === 1) return ` 🟢 Forecast: $${sym}${ctx.parsed.y != null ? ctx.parsed.y.toFixed(3) : '—'}/kg`;
              return ` 🟢 Price: $${sym}${ctx.parsed.y != null ? ctx.parsed.y.toFixed(3) : '—'}/kg`;
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
        <div className="page-title">{t.weather_title}</div>
        <div className="page-subtitle">{t.weather_subtitle}</div>
      </div>

      {infoVisible && (
        <div style={{ position:'relative', marginBottom:16, padding:'10px 36px 10px 14px', background:'#EFF6FF', borderRadius:10, fontSize:12, color:'#3B82F6', border:'1px solid #BFDBFE' }}>
          <strong>{t.how_to_use}:</strong> Select a product category → the map shows all growing regions → select a country for side-by-side price & weather chart.
          Sources: {PRODUCT_SOURCES[selectedProduct]?.join(' · ') || 'FAOSTAT · Eurostat · INC'}
          <button onClick={() => setInfoVisible(false)} style={{ position:'absolute', top:8, right:10, background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF', lineHeight:1 }}>×</button>
        </div>
      )}

      {/* ── Two dropdowns row ── */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        {/* Dropdown 1 — Product */}
        <div style={{ flex:'1 1 220px', minWidth:200 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', display:'block', marginBottom:4 }}>{t.product_category}</label>
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
          <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', display:'block', marginBottom:4 }}>{t.growing_region}</label>
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
            {[['1m','{t.period_1m}'],['3m','{t.period_3m}'],['6m','{t.period_6m}'],['12m','{t.period_12m}']].map(([v,l]) => (
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
          <div style={{ fontSize:11, color:'#9CA3AF' }}>{t.click_marker}</div>
        </div>
        {loadingWeather && <div style={{ padding:'8px 14px', fontSize:11, color:'#1E40AF' }}>{t.loading_weather}</div>}
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
        <div className="card-title">{t.all_regions} {product.label}</div>
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
                style={{ padding:'10px 12px', border:`2px solid ${isSelected ? '#1E40AF' : '#E5E7EB'}`, borderRadius:10, cursor:'pointer', background: isSelected ? '#F5F3FF' : '#fff', transition:'all 0.15s' }}>
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
        <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>{t.forecast_sources} {product.label}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {(PRODUCT_SOURCES[selectedProduct] || ['FAOSTAT','Eurostat','INC']).map((s, i) => (
            <span key={i} style={{ padding:'3px 10px', background:'#EFF6FF', color:'#1E40AF', borderRadius:20, fontSize:11, fontWeight:600 }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════
   BUY / HOLD / SELL label helper
   Used across Alerts page and Analytics page
   ══════════════════════════════════════════════════════ */
function getBuySellLabel(score, trend, riskScore, t = T.nl) {
  const s = score || 50;
  const r = riskScore || 0;
  if (trend === 'UP' && r >= 60) return { label: t.buy_now, color: '#10B981', bg: '#D1FAE5', emoji: '🟢' };
  if (trend === 'UP' && s >= 60)  return { label: t.buy,    color: '#16A34A', bg: '#DCFCE7', emoji: '🟢' };
  if (trend === 'DOWN' && s >= 55)return { label: t.sell,   color: '#EF4444', bg: '#FEE2E2', emoji: '🔴' };
  if (r >= 60)                    return { label: t.hold,   color: '#F59E0B', bg: '#FEF3C7', emoji: '🟡' };
  if (trend === 'DOWN')           return { label: t.wait,   color: '#3B82F6', bg: '#DBEAFE', emoji: '🔵' };
  return                                 { label: t.hold,   color: '#F59E0B', bg: '#FEF3C7', emoji: '🟡' };
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

function MarketIntelligence({ product, currency, liveIntel, loadingIntel, t = T.nl }) {
  /* liveIntel structure from /intelligence/{product_id}:
     { risk: {risk_score, availability, triggered_events, explanation},
       forecast: {adjusted_forecast, confidence_score, trend, change_pct, forecast_low, forecast_high, explanation},
       opportunity: {recommended_action, action_label, urgency, opportunity_score, narrative},
       substitutes: [{substitute_label, origin, price_diff_pct, availability_score, quality_match, reason}] }
  */
  const liveRisk       = liveIntel?.risk;
  const liveForecast   = liveIntel?.forecast;
  const liveOpportunity= liveIntel?.opportunity;
  const liveSubstitutes= liveIntel?.substitutes || [];
  const cal = CROP_CALENDAR[product] || {};
  const drivers = PRICE_DRIVERS[product] || [];
  const confidence = CONFIDENCE_SCORES[product] || 50;
  const sources = SOURCE_STACK[product] || [];
  const meta = PRODUCT_META[product];
  const sym = currency === 'EUR' ? '€' : '$';
  const confColor = confidence >= 70 ? '#10B981' : confidence >= 55 ? '#F59E0B' : '#EF4444';
  const confLabel = confidence >= 70 ? 'High' : confidence >= 55 ? 'Medium' : 'Low';

  const riskScore    = liveRisk?.risk_score ?? confidence;
  const availability = liveRisk?.availability ?? 'NORMAL';
  const riskColor    = riskScore >= 65 ? '#EF4444' : riskScore >= 35 ? '#F59E0B' : '#10B981';
  const riskLabel    = riskScore >= 65 ? 'HIGH RISK' : riskScore >= 35 ? 'MEDIUM RISK' : 'LOW RISK';
  const actionColors = {BUY_EARLY:'#10B981', WAIT:'#3B82F6', SWITCH_ORIGIN:'#F59E0B', HOLD_STOCK:'#F97316'};
  const action       = liveOpportunity?.recommended_action;
  const actionColor  = actionColors[action] || '#6B7280';

  return (
    <div style={{ marginTop: 16 }}>

      {/* ── LIVE INTELLIGENCE BANNER ── */}
      {loadingIntel && (
        <div style={{ padding:'8px 14px', background:'#EFF6FF', borderRadius:10, fontSize:12, color:'#1E40AF', marginBottom:12 }}>
          {t.loading_intel}
        </div>
      )}

      {liveIntel && !loadingIntel && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12, marginBottom:16 }}>

          {/* Risk Score Badge */}
          <div style={{ padding:'12px 16px', background: riskColor + '12', border:`2px solid ${riskColor}`, borderRadius:12 }}>
            <div style={{ fontSize:10, fontWeight:800, color:riskColor, textTransform:'uppercase', marginBottom:4 }}>{t.supply_risk}</div>
            <div style={{ fontSize:26, fontWeight:900, color:riskColor }}>{riskScore.toFixed(0)}<span style={{ fontSize:14 }}>/100</span></div>
            <div style={{ fontSize:11, fontWeight:700, color:riskColor }}>{riskLabel}</div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:4 }}>Availability: <strong>{availability}</strong></div>
          </div>

          {/* Forecast Card */}
          {liveForecast && (
            <div style={{ padding:'12px 16px', background:'#F0FDF4', border:'2px solid #BBF7D0', borderRadius:12 }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#166534', textTransform:'uppercase', marginBottom:4 }}>{t.forecast_card}</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#166534' }}>
                {currency === 'EUR' ? '€' : '$'}{liveForecast.adjusted_forecast?.toFixed(3) ?? '—'}/kg
              </div>
              <div style={{ fontSize:11, color: liveForecast.change_pct > 0 ? '#EF4444' : '#10B981', fontWeight:700 }}>
                {liveForecast.change_pct >= 0 ? '▲' : '▼'} {Math.abs(liveForecast.change_pct || 0).toFixed(1)}% vs today
              </div>
              <div style={{ fontSize:10, color:'#9CA3AF', marginTop:3 }}>
                Confidence: {liveForecast.confidence_score?.toFixed(0)}% · {liveForecast.trend}
              </div>
            </div>
          )}

          {/* Action Panel */}
          {liveOpportunity && (
            <div style={{ padding:'12px 16px', background: actionColor + '12', border:`2px solid ${actionColor}`, borderRadius:12 }}>
              <div style={{ fontSize:10, fontWeight:800, color:actionColor, textTransform:'uppercase', marginBottom:4 }}>{t.recommended_action}</div>
              <div style={{ fontSize:13, fontWeight:800, color:actionColor }}>{action?.replace('_',' ')}</div>
              <div style={{ fontSize:10, color:'#6B7280', marginTop:4, lineHeight:1.5 }}>
                {t.urgency_lbl}: <strong style={{ color:actionColor }}>{liveOpportunity.urgency}</strong>
              </div>
              <div style={{ fontSize:10, color:'#374151', marginTop:4, lineHeight:1.5 }}>
                {t.score_lbl}: {liveOpportunity.opportunity_score?.toFixed(0)}/100
              </div>
            </div>
          )}

          {/* Forecast Range */}
          {liveForecast?.forecast_low && (
            <div style={{ padding:'12px 16px', background:'#FAFAFA', border:'1.5px solid #E5E7EB', borderRadius:12 }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#374151', textTransform:'uppercase', marginBottom:4 }}>{t.price_range_card}</div>
              <div style={{ fontSize:11, color:'#6B7280', marginBottom:6 }}>30-day scenario range</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700 }}>
                <span style={{ color:'#10B981' }}>Low: {currency==='EUR'?'€':'$'}{liveForecast.forecast_low?.toFixed(3)}</span>
                <span style={{ color:'#EF4444' }}>High: {currency==='EUR'?'€':'$'}{liveForecast.forecast_high?.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUPPLY ALERT BANNER ── */}
      {liveRisk?.triggered_events?.length > 0 && (
        <div style={{ padding:'10px 16px', background:'#FEF2F2', border:'2px solid #FCA5A5', borderRadius:12, marginBottom:16, display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🚨</span>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'#DC2626' }}>{t.supply_alert}</div>
            <div style={{ fontSize:12, color:'#7F1D1D', marginTop:2 }}>{liveRisk.explanation}</div>
            <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
              {liveRisk.triggered_events.map((e, i) => (
                <span key={i} style={{ padding:'2px 8px', background:'#FEE2E2', color:'#DC2626', borderRadius:20, fontSize:10, fontWeight:700 }}>
                  {e.replace(/_/g,' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALTERNATIVE SOURCING PANEL ── */}
      {liveSubstitutes.length > 0 && (
        <div className="card" style={{ marginBottom:16, padding:'12px 16px' }}>
          <div className="card-title" style={{ marginBottom:8 }}>{t.alt_sourcing}</div>
          <div className="card-subtitle" style={{ marginBottom:10 }}>{t.alt_ranked}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:10 }}>
            {liveSubstitutes.slice(0, 3).map((s, i) => (
              <div key={i} style={{ padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, background:'#FAFAFA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1A1D2E' }}>{s.substitute_label}</span>
                  <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, fontWeight:700,
                    background: s.quality_match==='EXACT'?'#D1FAE5':s.quality_match==='CLOSE'?'#FEF3C7':'#F3F4F6',
                    color:      s.quality_match==='EXACT'?'#065F46':s.quality_match==='CLOSE'?'#92400E':'#374151' }}>
                    {s.quality_match}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'#6B7280' }}>🌍 {s.origin}</div>
                <div style={{ fontSize:11, color: s.price_diff_pct <= 0 ? '#10B981' : '#EF4444', fontWeight:700, marginTop:2 }}>
                  {s.price_diff_pct <= 0 ? '↓' : '↑'} {Math.abs(s.price_diff_pct)}% price · Avail: {s.availability_score}/100
                </div>
                <div style={{ fontSize:10, color:'#9CA3AF', marginTop:4, lineHeight:1.5 }}>{s.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── OPPORTUNITY NARRATIVE ── */}
      {liveOpportunity?.narrative && (
        <div style={{ padding:'10px 16px', background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:12, marginBottom:16, fontSize:12, color:'#92400E' }}>
          <strong>{t.ai_rec}:</strong> {liveOpportunity.narrative}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ fontSize:18 }}>{meta?.emoji}</div>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:'#1A1D2E' }}>{meta?.label} — Market Intelligence</div>
          <div style={{ fontSize:11, color:'#9CA3AF' }}>Based on crop calendar · price drivers · source stack · confidence scoring</div>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'center', background: confColor + '18', border:`1.5px solid ${confColor}`, borderRadius:10, padding:'6px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color: confColor }}>{t.confidence_lbl}</div>
          <div style={{ fontSize:20, fontWeight:800, color: confColor }}>{confidence}/100</div>
          <div style={{ fontSize:10, color: confColor }}>{confLabel}</div>
          {(() => { const bsl = getBuySellLabel(confidence, liveForecast?.trend || (confidence>=65?'UP':confidence<=40?'DOWN':'STABLE'), liveRisk?.risk_score, t); return (
            <div style={{ marginTop:6, padding:'3px 10px', borderRadius:20, background:bsl.bg, color:bsl.color, fontSize:11, fontWeight:800 }}>{bsl.emoji} {bsl.label}</div>
          ); })()}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
        {/* Crop Calendar */}
        <div className="card" style={{ padding:'12px 14px' }}>
          <div className="card-title" style={{ marginBottom:10 }}>{t.crop_calendar}</div>
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
          <div className="card-title" style={{ marginBottom:10 }}>{t.price_drivers}</div>
          {drivers.map((d, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom: i < drivers.length-1 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#1E40AF', flexShrink:0 }}/>
              <span style={{ fontSize:12, color:'#374151' }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Formula + Sources */}
        <div className="card" style={{ padding:'12px 14px' }}>
          <div className="card-title" style={{ marginBottom:10 }}>{t.pricing_formula}</div>
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
              <span key={i} style={{ padding:'2px 8px', background:'#EFF6FF', color:'#1E40AF', borderRadius:20, fontSize:10, fontWeight:600 }}>{s}</span>
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
  const [intelligence, setIntelligence] = useState({});
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [currency, setCurrency] = useState('EUR'); // USD or EUR
  const [lang, setLang] = useState(() => localStorage.getItem('nico_lang') || 'nl');
  const t = T[lang] || T.nl;
  const changeLang = (code) => { setLang(code); localStorage.setItem('nico_lang', code); };
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

  const fetchIntelligence = useCallback(async (product) => {
    setLoadingIntel(true);
    try {
      const r = await axios.get(`${API}/intelligence/${product}`, { headers: authH() });
      if (r.data?.available !== false) {
        setIntelligence(prev => ({ ...prev, [product]: r.data }));
      }
    } catch {}
    setLoadingIntel(false);
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
      fetchIntelligence(selectedProduct);
    }
  }, [loggedIn, selectedProduct, fetchHistory, fetchForecast, fetchIntelligence]);

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
      borderColor: '#1E40AF',
      backgroundColor: '#1E40AF18',
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
            <div className="logo-icon">
              <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAQABAADASIAAhEBAxEB/8QAHQABAAEEAwEAAAAAAAAAAAAAAAYDBAUHAQIICf/EAGMQAAICAQICBgUHBgoGBgYEDwABAgMEBREGIQcSMUFRYRMicYGRFDJCUnKhsQgVI2LB0SQzNFNzgpKy4fA1Q2OiwtIWJURUldMXGFWTtPE2N0WDhbPjJ1dkZXR1w2aEo+Lk/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAQFAgMGAQf/xABCEQACAQMBBAcHAgUDAwMFAQAAAQIDBBEFEiExQRNRYXGRodEGIjKBscHwFOEjMzRC8RVDUiRTchZikiU1Y4LSRP/aAAwDAQACEQMRAD8A8ZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//Z" alt="NICO" style={{ width:'38px', height:'38px', objectFit:'cover', borderRadius:10 }} />
            </div>
            <div>
              <div className="logo-text" style={{ background:'linear-gradient(135deg, #1E40AF, #2563EB)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>NICO</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            <div className="sidebar-section">General</div>
            {getNavItems(t).map(item => (
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

            <div className="sidebar-section" style={{ marginTop: 12 }}>{t.profile}</div>
            <button className="nav-item" onClick={() => { localStorage.removeItem('token'); setLoggedIn(false); }}>
              <span style={{ fontSize: 15 }}>🚪</span> {t.logout}
            </button>
          </div>

          {/* Mobile-only controls in sidebar */}
          <div className="sidebar-mobile-controls">
            {/* Language selector mobile */}
            <select
              value={lang}
              onChange={e => changeLang(e.target.value)}
              style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, fontWeight:600, background:'#fff', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", color:'#374151' }}
            >
              {LANGS.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
            <div style={{ display:'flex', background:'#F3F4F6', borderRadius:8, padding:2, gap:2, width:'100%' }}>
              <button onClick={() => setCurrency('USD')} style={{ flex:1, padding:'7px 0', borderRadius:6, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, background: currency==='USD' ? '#fff' : 'transparent', color: currency==='USD' ? '#1E40AF' : '#9CA3AF', boxShadow: currency==='USD' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.18s' }}>$ USD</button>
              <button onClick={() => setCurrency('EUR')} style={{ flex:1, padding:'7px 0', borderRadius:6, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, background: currency==='EUR' ? '#fff' : 'transparent', color: currency==='EUR' ? '#1E40AF' : '#9CA3AF', boxShadow: currency==='EUR' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.18s' }}>€ EUR</button>
            </div>
            <button className="topbar-btn" style={{ width:'100%', justifyContent:'center' }} onClick={() => { fetchAll(); setSidebarOpen(false); }}>↻ Refresh Data</button>
            <div style={{ width:'100%' }}>
              <button className="refresh-btn" style={{ width:'100%', justifyContent:'center' }} onClick={() => { handleScrape(); setSidebarOpen(false); }} disabled={scraping}>
                {scraping ? `⏳ ${scrapeProgress}%` : t.scrape}
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
                Pages / <strong>{getNavItems(t).find(n => n.id === tab)?.label || 'Dashboard'}</strong>
              </div>
            </div>
            <div className="topbar-right">
              {lastUpdated && (
                <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <div className="topbar-controls">
                {/* Language selector — desktop topbar */}
                <select
                  value={lang}
                  onChange={e => changeLang(e.target.value)}
                  style={{ padding:'5px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:12, fontWeight:600, background:'#fff', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", color:'#374151', minWidth:120 }}
                >
                  {LANGS.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
                <div style={{ display:'flex', background:'#F3F4F6', borderRadius:8, padding:2, gap:2 }}>
                  <button onClick={() => setCurrency('USD')} style={{ padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, background: currency==='USD' ? '#fff' : 'transparent', color: currency==='USD' ? '#1E40AF' : '#9CA3AF', boxShadow: currency==='USD' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.18s' }}>$ USD</button>
                  <button onClick={() => setCurrency('EUR')} style={{ padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, background: currency==='EUR' ? '#fff' : 'transparent', color: currency==='EUR' ? '#1E40AF' : '#9CA3AF', boxShadow: currency==='EUR' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.18s' }}>€ EUR</button>
                </div>
                <button className="topbar-btn" onClick={fetchAll}>{t.refresh}</button>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  <button className="refresh-btn" onClick={handleScrape} disabled={scraping}>
                    {scraping ? `⏳ ${scrapeProgress}%` : t.scrape}
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
                <div className="page-title">{t.home}</div>
                <div className="page-subtitle">
                  {lastUpdated ? lastUpdated.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : 'Loading...'}
                  {' · '}{t.sources_line}
                </div>
              </div>

              {/* SCRAPER NOTICE */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, marginBottom:16, fontSize:12, color:'#166534' }}>
                <span style={{ fontSize:15 }}>🤖</span>
                <span><strong>Live scraped data</strong> — All prices on this page are automatically collected by NICO web scraper from multiple sources across the internet. Click <strong>Scrape Data</strong> to fetch the latest prices.</span>
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
                      color: '#EFF6FF',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.upgrade_title}
                    </div>
                    <div className="upgrade-banner-text">
                      {t.upgrade_desc}
                    </div>
                  </div>
                  <button className="upgrade-banner-btn" onClick={() => setTab('sources')}>
                    {t.view_sources}
                  </button>
                </div>
              )}

              {/* STATS */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">{t.total_products}</div>
                  <div className="stat-value">{totalProducts}</div>
                  <div className="stat-change up">{t.new_this_update}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">{t.avg_price}</div>
                  <div className="stat-value">{fmt(avgPrice)}</div>
                  <div className={`stat-change ${Number(avgPrice) > 7 ? 'up' : 'down'}`}>
                    {t.across_cats}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">{t.most_expensive}</div>
                  <div className="stat-value" style={{ fontSize: 20, paddingTop: 4 }}>
                    {PRODUCT_META[mostExpensive].emoji} {PRODUCT_META[mostExpensive].label}
                  </div>
                  <div className="stat-change up">
                    {fmt(summary[mostExpensive]?.latest)}/kg
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">{t.active_alerts}</div>
                  <div className="stat-value" style={{ color: totalAlerts > 0 ? '#EF4444' : '#10B981' }}>
                    {totalAlerts}
                  </div>
                  <div className={`stat-change ${totalAlerts > 0 ? 'down' : 'up'}`}>
                    {totalAlerts > 0 ? t.price_movements : t.all_stable}
                  </div>
                </div>
              </div>

              {/* CHARTS */}
              <div className="charts-row">
                <div className="card">
                  <div className="card-title">{t.price_comparison}</div>
                  <div className="card-subtitle">{t.all_products_usd}</div>
                  <div style={{ height: 240 }}>
                    {!loading && <Bar data={barData} options={chartOpts()} />}
                    {loading && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 13 }}>{t.loading}</div>}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">{PRODUCT_META[selectedProduct].label} · {t.price_trend}</div>
                  <div className="card-subtitle">{t.last_readings}</div>
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
                    <div className="card-title">{t.latest_prices}</div>
                    <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{t.eu_range_src}</div>
                  </div>
                </div>
                <div style={{ overflowX:'auto', scrollbarWidth:'none' }}>
                  <div className="carousel-tabs-scroll" style={{ borderBottom:'1px solid #F3F4F6' }}>
                    {[['all',t.filter_all],['rising',t.filter_rising],['falling',t.filter_falling],['stable',t.filter_stable]].map(([f,label]) => (
                      <button key={f} className={`table-tab ${tableFilter === f ? 'active' : ''}`} onClick={() => setTableFilter(f)}>
                        {label}
                        {f === 'all' && <span style={{ marginLeft: 6, background: '#E5E7EB', padding: '1px 7px', borderRadius: 10, fontSize: 11 }}>{tableRows.length}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="table-scroll-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t.col_product}</th>
                        <th>{t.col_price}</th>
                        <th>{t.col_country}</th>
                        <th>{t.col_source}</th>
                        <th>{t.col_eu_range}</th>
                        <th>{t.col_eu_avg}</th>
                        <th>{t.col_change}</th>
                        <th>{t.col_status}</th>
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
                                    <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${pct}%`, borderRadius:3, background:`linear-gradient(90deg, #1E40AF, #2563EB)` }} />
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
                                {row.status === 'rising' ? t.status_rising : row.status === 'falling' ? t.status_falling : t.status_stable}
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
                <div className="page-title">{t.prices_forecast}</div>
                <div className="page-subtitle">{t.hist_trends}</div>
              </div>

              {/* SCRAPER NOTICE */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, marginBottom:16, fontSize:12, color:'#166534' }}>
                <span style={{ fontSize:15 }}>🤖</span>
                <span><strong>{t.live_scraped}</strong> — {t.analytics_live}</span>
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
                    { label: t.current_price, value: fmt(summary[selectedProduct].latest) },
                    { label: t.avg_30, value: fmt(summary[selectedProduct].avg) },
                    { label: t.low_30, value: fmt(summary[selectedProduct].min) },
                    { label: t.high_30, value: fmt(summary[selectedProduct].max) },
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
                  <div className="card-title">{PRODUCT_META[selectedProduct].label} · {t.price_history}</div>
                  <div className="card-subtitle">{t.all_data_points}</div>
                  <div style={{ height: 260 }}>
                    {histData ? <Line data={histData} options={chartOpts()} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 13 }}>{t.no_history}</div>}
                  </div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div className="card-title">{t.forecast_30}</div>
                    {forecast && (
                      <span className={`badge ${forecast.trend === 'UP' ? 'badge-red' : 'badge-green'}`}>
                        {forecast.trend === 'UP' ? t.rising_trend : t.falling_trend}
                      </span>
                    )}
                  </div>
                  <div className="card-subtitle">{t.linear_proj}</div>
                  <div style={{ height: 260 }}>
                    {forecastData ? <Line data={forecastData} options={chartOpts()} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 13 }}>{t.need_points}</div>}
                  </div>
                </div>
              </div>

              {/* ── MARKET INTELLIGENCE (live + static) ── */}
              <MarketIntelligence
                product={selectedProduct}
                currency={currency}
                liveIntel={intelligence[selectedProduct] || null}
                loadingIntel={loadingIntel}
                t={t}
              />
            </div>
          )}

          {/* ════════════════════════════
              PRODUCTS TAB
          ════════════════════════════ */}
          {tab === 'products' && (
            <div className="page fade-up">
              <div className="page-header">
                <div className="page-title">All Products</div>
                <div className="page-subtitle">{t.cats_tracked}</div>
              </div>

              {/* SCRAPER NOTICE */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, marginBottom:16, fontSize:12, color:'#166534' }}>
                <span style={{ fontSize:15 }}>🤖</span>
                <span><strong>{t.live_scraped}</strong> — {t.products_live}</span>
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
                    <div className="page-title">{t.price_alerts}</div>
                    <div className="page-subtitle">{t.alert_subtitle}</div>
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
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t.no_alerts}</div>
                  <div style={{ color: '#9CA3AF', fontSize: 13 }}>{t.all_normal}</div>
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

              {/* ── PRODUCT INTELLIGENCE SCORES ── */}
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-title">{t.intel_scores}</div>
                <div className="card-subtitle">{t.intel_subtitle}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10, marginTop:14 }}>
                  {ALL_PRODUCTS.map(p => {
                    const m = PRODUCT_META[p];
                    const conf = CONFIDENCE_SCORES[p] || 50;
                    const drivers = PRICE_DRIVERS[p] || [];
                    const trend = conf >= 65 ? 'UP' : conf <= 40 ? 'DOWN' : 'STABLE';
                    const bsl = getBuySellLabel(conf, trend, 0, t);
                    const barColor = conf >= 70 ? '#10B981' : conf >= 50 ? '#F59E0B' : '#EF4444';
                    return (
                      <div key={p} onClick={() => { setSelectedProduct(p); setTab('analytics'); }}
                        style={{ padding:'12px 14px', border:'1.5px solid #E5E7EB', borderRadius:12, cursor:'pointer', background:'#fff', transition:'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor='#1E40AF'}
                        onMouseLeave={e => e.currentTarget.style.borderColor='#E5E7EB'}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                          <span style={{ fontSize:18 }}>{m?.emoji}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:'#374151' }}>{m?.label}</span>
                        </div>
                        {/* Score bar */}
                        <div style={{ height:5, borderRadius:3, background:'#F3F4F6', marginBottom:6 }}>
                          <div style={{ height:'100%', width:`${conf}%`, borderRadius:3, background:barColor, transition:'width 0.4s' }}/>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:12, fontWeight:800, color:barColor }}>{conf}/100</span>
                          <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20,
                            background: bsl.bg, color: bsl.color }}>
                            {bsl.emoji} {bsl.label}
                          </span>
                        </div>
                        <div style={{ fontSize:9, color:'#9CA3AF', marginTop:4 }}>{drivers[0] || ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-title">{t.alert_thresholds}</div>
                <div className="card-subtitle">{t.how_triggered}</div>
                <table className="data-table">
                  <thead><tr><th>{t.col_alert_type}</th><th>{t.col_trigger}</th><th>{t.col_action}</th></tr></thead>
                  <tbody>
                    <tr><td><span className="badge badge-yellow">MEDIUM</span></td><td>{t.medium_trigger}</td><td>{t.shown_panel}</td></tr>
                    <tr><td><span className="badge badge-red">HIGH</span></td><td>{t.high_trigger}</td><td>{t.highlighted}</td></tr>
                    <tr><td><span className="badge badge-blue">AUTO</span></td><td>{t.auto_trigger}</td><td>{t.auto_refresh}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════════════
              SUPPLIER CATALOG TAB
          ════════════════════════════ */}
          {tab === 'catalog' && <SupplierCatalog fmt={fmt} currency={currency} t={t} />}

          {/* ════════════════════════════
              NETHERLANDS SUPPLY TAB
          ════════════════════════════ */}
          {tab === 'catalog_netherlands' && <NetherlandsSupplyCatalog currency={currency} t={t} />}

          {/* ════════════════════════════
              TOP 5 TAB
          ════════════════════════════ */}
          {tab === 'top5' && <Top5Catalog currency={currency} t={t} />}

          {/* ════════════════════════════
              WEATHER FORECAST TAB
          ════════════════════════════ */}
          {tab === 'weather' && <WeatherForecast currency={currency} t={t} />}

          {/* ════════════════════════════
              SOURCES TAB
          ════════════════════════════ */}
          {tab === 'sources' && (
            <div className="page fade-up">
              <div className="page-header">
                <div className="page-title">{t.data_sources}</div>
                <div className="page-subtitle">{t.sources_subtitle}</div>
              </div>

              {/* ── ACTIVE SCRAPING SOURCES ── */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">✅ {t.active_scraping}</div>
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
                               style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#1E40AF', textDecoration: 'none', wordBreak: 'break-all' }}>
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
                               style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#1E40AF', textDecoration: 'none', wordBreak: 'break-all' }}>
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
                <div className="card-title">💎 {t.premium} (Recommended Upgrade)</div>
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
                               style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#1E40AF', textDecoration: 'none', wordBreak: 'break-all' }}>
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