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
      localStorage.setItem('nico_role', res.data.role || 'visitor');
      onLogin(res.data.role || 'visitor');
    } catch { setError('Invalid username or password'); }
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ width:56, height:56, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <img src="data:image/png;base64,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" alt="NICO" style={{ width:"56px", height:"49px", objectFit:"contain" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 2, background:"linear-gradient(135deg, #1E40AF, #2563EB)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>NICO</div>
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
        <p style={{ textAlign:'center', fontSize:12, color:'#6B7280', marginTop:16, padding:'0 20px' }}>
          Visitor? Register at{' '}
          <a href="https://caspiannuts.nl" target="_blank" rel="noreferrer"
            style={{ color:'#2563EB', fontWeight:700 }}>caspiannuts.nl</a>
          {' '}to receive your NICO login credentials by email.
        </p>
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
function SupplierCatalog({ fmt, currency, t = T.nl, isVisitor = false }) {
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
          {!isVisitor && (
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
          )}
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
                    {!isVisitor && <th style={{ minWidth:90 }}>{t.col_availability}</th>}
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

function NetherlandsSupplyCatalog({ currency, t = T.nl, isVisitor = false }) {
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

function Top5Catalog({ currency, t = T.nl, isVisitor = false }) {
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

function WeatherForecast({ currency, t = T.nl, isVisitor = false }) {
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

function MarketIntelligence({ product, currency, liveIntel, loadingIntel, t = T.nl, isVisitor = false }) {
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
  const [userRole, setUserRole] = useState(() => localStorage.getItem('nico_role') || 'visitor');
  const isVisitor = userRole === 'visitor';
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

  if (!loggedIn) return (<><style>{CSS}</style><Login onLogin={(role) => { setLoggedIn(true); setUserRole(role || localStorage.getItem("nico_role") || "visitor"); }} /></>);

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
              <img src="data:image/png;base64,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" alt="NICO" style={{ width:'40px', height:'35px', objectFit:'contain' }} />
            </div>
            <div>
              <div className="logo-text" style={{ background:'linear-gradient(135deg, #1E40AF, #2563EB)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>NICO</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            <div className="sidebar-section">General</div>
            {getNavItems(t).filter(item => isVisitor ? ['dashboard','products','catalog','top5','catalog_netherlands','weather'].includes(item.id) : true).map(item => (
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
            <button className="nav-item" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('nico_role'); setUserRole('visitor'); setLoggedIn(false); }}>
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
                        {!isVisitor && <th>{t.col_price}</th>}
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
                isVisitor={isVisitor}
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
          {tab === 'catalog' && <SupplierCatalog fmt={fmt} currency={currency} t={t} isVisitor={isVisitor} />}

          {/* ════════════════════════════
              NETHERLANDS SUPPLY TAB
          ════════════════════════════ */}
          {tab === 'catalog_netherlands' && <NetherlandsSupplyCatalog currency={currency} t={t} isVisitor={isVisitor} />}

          {/* ════════════════════════════
              TOP 5 TAB
          ════════════════════════════ */}
          {tab === 'top5' && <Top5Catalog currency={currency} t={t} isVisitor={isVisitor} />}

          {/* ════════════════════════════
              WEATHER FORECAST TAB
          ════════════════════════════ */}
          {tab === 'weather' && <WeatherForecast currency={currency} t={t} isVisitor={isVisitor} />}

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
                          {!isVisitor && <td><span className={`badge ${s.badge}`}>{s.type}</span></td>}
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