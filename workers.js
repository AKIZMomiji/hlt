/**
 * Halo – YouTube Proxy Worker
 * Routes: / (home + search + watch) — URL never changes
 * Uses YouTube Data API v3 for search, yt-dlp via external backend for streaming
 * 
 * コードでは'使えるコマンド一覧:'\n +等のコードがあります
 * IDE的には'使えるコマンド一覧:\n' +の方が正しいのかもしれませんが、ブラウザではシンタックスエラーを吐きます
 * ご理解お願いします。
 */

const HTML_PAGE = `<!DOCTYPE html>
<html lang="ja">
<head>
  <script>window.__FORCE_ALT_SRC__ = (__ALT_SRC_FLAG__);</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halo</title>
  <link rel="icon" id="favicon" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js"></script>
  <meta property="og:title" content="HaloTube">
  <meta property="og:description" content="alternative front-end to YouTube.">
  <meta property="og:image" content="https://raw.githubusercontent.com/AKIZMomiji/get/refs/heads/main/halotube_thumbnail.png">
  <meta property="og:url" content="https://white-hall-4040.nikubanana809.workers.dev/">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="description" content="HaloTube - Alternative front-end to YouTube">
  <style>
    :root {
      --bg: #080a0f;
      --surface: #0e1117;
      --surface2: #161b26;
      --border: rgba(255,255,255,0.07);
      --accent: #5b8af5;
      --accent2: #a78bfa;
      --text: #e8eaf0;
      --muted: #6b7280;
      --danger: #ef4444;
      --radius: 12px;
      --font: 'Outfit', sans-serif;
      --mono: 'Space Mono', monospace;
      --cyan: #38bdf8;
      --cyan2: #7dd3fc;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
    }

    /* ─── Noise texture overlay ─── */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 0;
    }

    /* ─── Layout ─── */
    #app {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ─── Header ─── */
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(8,10,15,0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      height: 60px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .logo {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      text-decoration: none;
    }

    .logo.halo-image-mode {
      background: none;
      -webkit-text-fill-color: initial;
    }

    .header-logo-img {
      display: block;
      width: 34px;
      height: 34px;
      object-fit: contain;
      filter: drop-shadow(0 6px 12px rgba(91,138,245,0.28));
    }

    /* ─── Search Bar ─── */
    .search-wrap {
      flex: 1;
      max-width: 560px;
      position: relative;
    }

    .search-wrap input {
      width: 100%;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 9px 44px 9px 18px;
      font-family: var(--font);
      font-size: 14px;
      color: var(--text);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-wrap input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(91,138,245,0.15);
    }

    .search-wrap input::placeholder { color: var(--muted); }

    .search-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted);
      display: flex;
      align-items: center;
      padding: 4px;
      transition: color 0.2s;
    }
    .search-btn:hover { color: var(--accent); }

    .header-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .header-action {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 7px 12px;
      font-family: var(--font);
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      cursor: default;
      white-space: nowrap;
    }

    .donate-action {
      color: var(--muted);
      text-decoration: none;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
    }

    .donate-action:hover {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.14);
      color: var(--text);
    }

    .settings-action {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .settings-action svg {
      width: 15px;
      height: 15px;
    }

    .server-status {
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      white-space: nowrap;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
    }

    .server-status.rainbow {
      background: linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: rainbow-anim 2s linear infinite;
    }
    @keyframes rainbow-anim {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }

    .server-status.checking { color: var(--muted); }
    .server-status.alive { color: #22c55e; }
    .server-status.down { color: var(--danger); }

    .log-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #7dd3fc;
      background: rgba(125,211,252,0.08);
      border: 1px solid rgba(125,211,252,0.3);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .log-toggle-btn:hover {
      background: rgba(125,211,252,0.16);
      border-color: rgba(125,211,252,0.5);
    }

    /* ─── Hero (home only) ─── */
    #hero {
      padding: 80px 24px 60px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    #hero h1 {
      font-size: clamp(48px, 8vw, 96px);
      font-weight: 900;
      letter-spacing: -3px;
      line-height: 1;
      background: linear-gradient(135deg, #fff 0%, var(--accent) 50%, var(--accent2) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .is-hidden {
      display: none !important;
    }

    #hero p {
      font-size: 16px;
      color: var(--muted);
      max-width: 360px;
      line-height: 1.6;
    }

    .hero-search {
      width: 100%;
      max-width: 560px;
      position: relative;
    }

    .hero-search input {
      width: 100%;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 16px 56px 16px 24px;
      font-family: var(--font);
      font-size: 16px;
      color: var(--text);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .hero-search input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(91,138,245,0.2);
    }

    .hero-search input::placeholder { color: var(--muted); }

    .hero-search-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s, transform 0.2s;
    }
    .hero-search-btn:hover { opacity: 0.85; transform: translateY(-50%) scale(1.05); }
    .hero-search-btn svg { color: white; }

    /* ─── Main content ─── */
    main {
      flex: 1;
      padding: 0 24px 60px;
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
    }

    /* ─── Results grid ─── */
    #results-section { display: none; }
    #results-section.active { display: block; }

    .results-header {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 28px;
      padding-top: 32px;
    }

    .results-header h2 {
      font-size: 20px;
      font-weight: 600;
    }

    .results-count {
      font-size: 13px;
      color: var(--muted);
      font-family: var(--mono);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }

    .results-more {
      display: none;
      margin: 28px auto 0;
      padding: 10px 18px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface2);
      color: var(--text);
      font-family: var(--font);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, transform 0.2s;
    }

    .results-more:hover:not(:disabled) {
      border-color: rgba(91,138,245,0.45);
      color: var(--cyan2);
      transform: translateY(-1px);
    }

    .results-more:disabled {
      cursor: default;
      opacity: 0.6;
    }

    /* ─── Video Card ─── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      animation: cardIn 0.4s ease both;
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card:hover {
      transform: translateY(-3px);
      border-color: rgba(91,138,245,0.4);
      box-shadow: 0 8px 32px rgba(91,138,245,0.15);
    }

    .card-thumb {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
      display: block;
      background: var(--surface2);
    }

    .card-body {
      padding: 12px 14px 14px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--muted);
    }

    .card-channel {
      font-weight: 500;
      color: rgba(232,234,240,0.7);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }

    /* ─── Channel card (search results) ─── */
    .card.channel-card .card-thumb-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(91,138,245,0.12), rgba(167,139,250,0.08));
    }
    .card.channel-card .channel-card-avatar {
      width: 45%;
      aspect-ratio: 1/1;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255,255,255,0.12);
      background: var(--surface2);
    }
    .channel-card-badge {
      display: inline-block;
      background: rgba(91,138,245,0.16);
      color: var(--accent);
      padding: 1px 7px;
      border-radius: 4px;
      font-size: 10px;
      font-family: var(--mono);
      font-weight: 700;
      flex-shrink: 0;
    }

    /* ─── Watch view ─── */
    #watch-section { display: none; }
    #watch-section.active { display: block; padding-top: 24px; }

    .watch-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .watch-layout { grid-template-columns: 1fr; }
      .related-videos { display: none; }
      .live-chat { margin-top: 4px; }
      .chat-list { height: min(58vh, 420px); }
    }

    /* ─── Player wrap ─── */
    .player-wrap {
      background: #000;
      border-radius: var(--radius);
      overflow: hidden;
      aspect-ratio: 16/9;
      position: relative;
      user-select: none;
    }

    #video-player {
      width: 100%;
      height: 100%;
      display: block;
      background: #000;
    }

    .player-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: #000;
      z-index: 5;
    }

    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(56,189,248,0.2);
      border-top-color: var(--cyan);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .player-loading p {
      font-size: 13px;
      color: var(--muted);
    }

    /* ─── Custom Controls ─── */
    .custom-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 48px 14px 12px;
      background: linear-gradient(transparent, rgba(0,0,0,0.85));
      display: flex;
      flex-direction: column;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.25s ease;
      z-index: 10;
      border-radius: 0 0 var(--radius) var(--radius);
    }

    .player-wrap:hover .custom-controls,
    .player-wrap.paused .custom-controls {
      opacity: 1;
    }

    /* フルスクリーン時は hover での常時表示をやめ、JS 制御に任せる */
    #player-wrap:fullscreen:hover .custom-controls,
    #player-wrap:-webkit-full-screen:hover .custom-controls {
      opacity: 0;
    }
    /* JS が「表示」と判断したときだけ出す */
    #player-wrap:fullscreen.fs-controls-visible .custom-controls,
    #player-wrap:-webkit-full-screen.fs-controls-visible .custom-controls {
      opacity: 1;
    }
    /* フルスクリーン中は角丸解除 */
    #player-wrap:fullscreen,
    #player-wrap:-webkit-full-screen { border-radius: 0; }
    #player-wrap:fullscreen .custom-controls,
    #player-wrap:-webkit-full-screen .custom-controls { border-radius: 0; }

    /* ─── Progress bar ─── */
    .progress-wrap {
      position: relative;
      width: 100%;
      height: 4px;
      cursor: pointer;
      border-radius: 999px;
      background: rgba(255,255,255,0.15);
      transition: height 0.15s ease;
    }

    .progress-wrap:hover,
    .progress-wrap.dragging {
      height: 6px;
    }

    /* バッファ済み（薄い水色） */
    .progress-buffer {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      border-radius: 999px;
      background: rgba(56,189,248,0.28);
      pointer-events: none;
      transition: width 0.4s ease;
    }

    /* 再生済み（水色グラデ） */
    .progress-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--cyan), var(--cyan2));
      pointer-events: none;
    }

    /* つまみ */
    .progress-thumb {
      position: absolute;
      top: 50%;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 8px rgba(56,189,248,0.9), 0 0 0 2px rgba(56,189,248,0.3);
      transform: translate(-50%, -50%) scale(0);
      transition: transform 0.15s ease;
      pointer-events: none;
    }

    .progress-wrap:hover .progress-thumb,
    .progress-wrap.dragging .progress-thumb {
      transform: translate(-50%, -50%) scale(1);
    }

    .player-wrap.live .progress-wrap {
      cursor: default;
    }

    .player-wrap.live .progress-fill {
      width: 100%;
      background: linear-gradient(90deg, var(--danger), #fb7185);
    }

    .player-wrap.live .progress-buffer,
    .player-wrap.live .progress-thumb,
    .player-wrap.live .preview-wrap {
      display: none !important;
    }

    /* ─── Preview Thumbnail (NEW) ─── */
    .preview-wrap {
      position: absolute;
      bottom: 40px; /* プログレスバーからの距離 */
      left: 0;
      transform: translateX(-50%); /* left はプレビューの中心座標 */
      pointer-events: none;
      display: none;
      flex-direction: column;
      align-items: center;
      z-index: 30;
    }

    .preview-wrap.loading .preview-img {
      opacity: 0.25;
      filter: blur(3px);
    }

    .preview-img {
      width: 160px;
      aspect-ratio: 16/9;
      background: #000;
      border: 2px solid rgba(255,255,255,0.8);
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      object-fit: cover;
      transition: opacity 0.12s ease, filter 0.12s ease;
    }

    .preview-img:not([src]) {
      visibility: hidden;
    }

    .preview-time {
      margin-top: 6px;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-family: var(--mono);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.1);
    }

    /* ─── Controls row ─── */
    .controls-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .play-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1.5px solid rgba(56,189,248,0.45);
      background: rgba(56,189,248,0.12);
      backdrop-filter: blur(6px);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      transition: background 0.15s, border-color 0.15s, transform 0.12s;
      flex-shrink: 0;
    }

    .play-btn:hover {
      background: rgba(56,189,248,0.28);
      border-color: rgba(56,189,248,0.8);
      transform: scale(1.08);
    }

    .play-btn:active { transform: scale(0.93); }

    .time-display {
      font-family: var(--mono);
      font-size: 10px;
      color: rgba(255,255,255,0.72);
      white-space: nowrap;
      letter-spacing: 0.03em;
    }

    /* ─── Quality menu ─── */
    .quality-btn.active {
      background: rgba(56,189,248,0.32);
      border-color: rgba(56,189,248,0.9);
      color: var(--cyan);
    }

    .quality-menu {
      position: absolute;
      bottom: 42px;
      right: 0;
      background: rgba(15,17,21,0.96);
      border: 1px solid rgba(56,189,248,0.35);
      border-radius: 8px;
      overflow: hidden;
      min-width: 108px;
      backdrop-filter: blur(8px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.45);
      z-index: 20;
    }

    .quality-menu-item {
      display: block;
      width: 100%;
      padding: 9px 12px;
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.85);
      font-size: 12px;
      font-family: var(--mono);
      text-align: left;
      cursor: pointer;
      white-space: nowrap;
    }

    .quality-menu-item:hover {
      background: rgba(56,189,248,0.14);
    }

    .quality-menu-item.active {
      color: var(--cyan);
      font-weight: 700;
    }

    .quality-menu-item:disabled {
      color: rgba(255,255,255,0.32);
      cursor: not-allowed;
      background: transparent !important;
    }

    .quality-menu-item .quality-item-note {
      display: block;
      font-size: 10px;
      color: rgba(255,255,255,0.5);
      font-weight: 400;
      margin-top: 1px;
    }

    .fullscreen-btn svg { display:block; }
    /* フルスクリーン時はコントロールを常時表示 & 角丸解除 */
    #player-wrap:fullscreen { border-radius:0; }
    #player-wrap:fullscreen .custom-controls { opacity:1; border-radius:0; }
    #player-wrap:-webkit-full-screen .custom-controls { opacity:1; border-radius:0; }

    /* ─── Ripple ─── */
    @keyframes ripple {
      from { opacity: 0.55; transform: translate(-50%, -50%) scale(0); }
      to   { opacity: 0;    transform: translate(-50%, -50%) scale(4); }
    }

    .play-ripple {
      position: absolute;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(56,189,248,0.35);
      pointer-events: none;
      animation: ripple 0.5s ease-out forwards;
      z-index: 20;
    }

    /* ─── Video info ─── */
    .video-info { margin-top: 16px; }

    .video-info h2 {
      font-size: 18px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 10px;
    }

    .video-info-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--muted);
      flex-wrap: wrap;
    }

    .video-info-meta .dot {
      color: rgba(107,114,128,0.7);
    }

    .video-description {
      margin-top: 12px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
      color: rgba(232,234,240,0.82);
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      max-height: 180px;
      overflow: auto;
    }

    .video-description:empty {
      display: none;
    }

    /* ─── Quality badge ─── */
    .quality-badge {
      display: none;
      background: rgba(56,189,248,0.15);
      color: var(--cyan);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-family: var(--mono);
    }

    .live-badge {
      display: none;
      align-items: center;
      gap: 5px;
      background: rgba(239,68,68,0.16);
      color: #fecdd3;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-family: var(--mono);
      font-weight: 700;
    }

    .live-badge.active { display: inline-flex; }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--danger);
      box-shadow: 0 0 10px rgba(239,68,68,0.9);
    }

    .card-thumb-wrap {
      position: relative;
      aspect-ratio: 16/9;
      background: var(--surface2);
    }

    .card-thumb-wrap .card-thumb {
      height: 100%;
    }

    .card-live-badge {
      position: absolute;
      left: 8px;
      bottom: 8px;
      padding: 3px 7px;
      border-radius: 4px;
      background: rgba(239,68,68,0.92);
      color: white;
      font-size: 10px;
      font-family: var(--mono);
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .card-duration-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      position: absolute;
      right: 6px;
      bottom: 6px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0,0,0,0.78);
      color: #fff;
      font-size: 11px;
      font-family: var(--mono);
      font-weight: 700;
      letter-spacing: 0.02em;
      pointer-events: none;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--muted);
      cursor: pointer;
      margin-bottom: 16px;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--surface);
      transition: color 0.2s, border-color 0.2s;
      font-family: var(--font);
    }
    .back-btn:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }

    /* ─── Related ─── */
    #related h3 {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 14px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .related-item {
      display: flex;
      gap: 10px;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s;
      margin-bottom: 6px;
    }
    .related-item:hover { background: var(--surface2); }

    .related-thumb {
      width: 100px;
      flex-shrink: 0;
      aspect-ratio: 16/9;
      object-fit: cover;
      border-radius: 6px;
      background: var(--surface2);
    }

    .related-info { flex: 1; min-width: 0; }

    .related-title {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .related-channel { font-size: 12px; color: var(--muted); }

    /* ─── Channel page ─── */
    #channel-section { display: none; }
    #channel-section.active { display: block; padding-top: 0; }

    /* バナー */
    .channel-banner-wrap {
      width: 100%;
      aspect-ratio: 6.2 / 1;
      background: linear-gradient(135deg, #0d1526 0%, #111827 100%);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 16px;
    }
    .channel-banner-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .channel-banner-wrap.no-banner {
      background: linear-gradient(135deg, rgba(91,138,245,0.12) 0%, rgba(167,139,250,0.08) 100%);
      min-height: 80px;
    }

    .channel-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 14px 16px 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 28px;
      margin-top: 0;
      position: relative;
      background: linear-gradient(180deg, rgba(14,17,23,0.92), rgba(8,10,15,0));
      border-radius: var(--radius) var(--radius) 0 0;
    }

    .channel-avatar-wrap {
      flex-shrink: 0;
      position: relative;
    }

    .channel-avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: var(--surface2);
      object-fit: cover;
      display: block;
      border: 3px solid var(--bg);
      box-shadow: 0 0 0 1px var(--border);
    }

    .channel-avatar-placeholder {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 900;
      color: #fff;
      flex-shrink: 0;
      border: 3px solid var(--bg);
      box-shadow: 0 0 0 1px var(--border);
    }

    /* チャンネルバッジ（右下に重ねる） */
    .channel-avatar-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 900;
      line-height: 1;
    }
    .channel-avatar-badge.verified {
      background: #60a5fa;
      color: #fff;
    }
    .channel-avatar-badge.artist {
      background: linear-gradient(135deg, #d946ef, #a855f7);
      color: #fff;
    }

    .channel-info {
      min-width: 0;
      flex: 1;
      padding-bottom: 2px;
    }

    .channel-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 5px;
    }

    .channel-name {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }

    /* インライン認証バッジ */
    .channel-verified-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 900;
      color: #fff;
      flex-shrink: 0;
    }
    .channel-verified-badge.verified { background: #60a5fa; }
    .channel-verified-badge.artist   { background: linear-gradient(135deg,#d946ef,#a855f7); }

    .channel-stats {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--muted);
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .channel-stats .dot { color: rgba(107,114,128,0.5); }

    .channel-stat-highlight {
      color: rgba(232,234,240,0.7);
      font-weight: 600;
    }

    .channel-desc {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.5;
      max-height: 3.2em;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 8px;
    }

    .channel-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--accent);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      padding: 6px 12px;
      border: 1px solid rgba(91,138,245,0.35);
      border-radius: 999px;
      transition: background 0.15s, border-color 0.15s;
    }

    .channel-link:hover {
      background: rgba(91,138,245,0.1);
      border-color: rgba(91,138,245,0.6);
    }

    /* スケルトン用（チャンネルヘッダー） */
    .channel-header-skel {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 14px 16px 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 28px;
      margin-top: 0;
    }
    .skel-avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 3px solid var(--bg);
    }
    .skel-channel-info { flex: 1; padding-bottom: 4px; }
    .skel-name { height: 22px; width: 200px; margin-bottom: 10px; border-radius: 6px; }
    .skel-sub  { height: 13px; width: 140px; margin-bottom: 8px; border-radius: 4px; }
    .skel-link { height: 32px; width: 120px; border-radius: 999px; }

    .channel-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin: 0 0 22px;
      flex-wrap: wrap;
    }

    .channel-tabs {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: thin;
    }

    .channel-tab {
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      border-radius: 999px;
      padding: 8px 14px;
      font: 700 13px var(--font);
      white-space: nowrap;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .channel-tab:hover {
      color: var(--text);
      border-color: rgba(255,255,255,0.16);
    }

    .channel-tab.active {
      color: #fff;
      border-color: rgba(91,138,245,0.55);
      background: rgba(91,138,245,0.16);
    }

    .channel-card-kind {
      color: var(--cyan2);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0;
    }

    /* clickable channel name in video info */
    .channel-clickable {
      cursor: pointer;
      transition: color 0.15s;
      text-decoration: underline;
      text-decoration-color: transparent;
      text-underline-offset: 3px;
    }
    .channel-clickable:hover {
      color: var(--accent);
      text-decoration-color: var(--accent);
    }

    /* ─── Discord error button ─── */
    .discord-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
      padding: 9px 18px;
      border-radius: 999px;
      background: #5865F2;
      color: #fff;
      font: 600 13px var(--font);
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.12s;
    }
    .discord-btn:hover { opacity: 0.88; transform: translateY(-1px); }
    .discord-btn svg { flex-shrink: 0; }

    .side-panel {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .live-chat {
      display: none;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      overflow: hidden;
    }

    .live-chat.active { display: block; }

    .live-chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .chat-status {
      font-size: 11px;
      color: var(--muted);
      text-transform: none;
      letter-spacing: 0;
      font-weight: 500;
    }

    .chat-list {
      height: 420px;
      overflow: auto;
      padding: 10px 12px;
    }

    .chat-msg {
      display: grid;
      grid-template-columns: 24px 1fr;
      gap: 8px;
      padding: 7px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 13px;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    .chat-msg:last-child { border-bottom: 0; }

    .chat-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--surface2);
      object-fit: cover;
      margin-top: 1px;
    }

    .chat-body { min-width: 0; }

    .chat-author {
      color: var(--cyan2);
      font-weight: 600;
      margin-right: 6px;
    }

    .chat-author.verified,
    .comment-author.verified {
      color: #93c5fd;
    }

    .chat-author.artist,
    .comment-author.owner {
      color: #f0abfc;
    }

    .author-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      margin-right: 5px;
      border-radius: 50%;
      vertical-align: -2px;
      color: #fff;
      background: rgba(96,165,250,0.9);
      font-size: 10px;
      font-weight: 900;
      line-height: 1;
    }

    .author-badge.artist,
    .author-badge.owner {
      background: rgba(217,70,239,0.9);
    }

    .author-badge img {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      object-fit: cover;
    }

    .chat-text {
      color: rgba(232,234,240,0.88);
    }

    .chat-empty {
      padding: 28px 12px;
      color: var(--muted);
      font-size: 13px;
      text-align: center;
    }

    .comments-panel {
      margin-top: 18px;
      border-top: 1px solid var(--border);
      padding-top: 16px;
    }

    .comments-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .comments-title {
      font-size: 15px;
      font-weight: 700;
    }

    .comment-sort {
      display: inline-grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      background: var(--surface);
    }

    .comment-sort button {
      border: 0;
      background: transparent;
      color: var(--muted);
      font: 600 12px var(--font);
      padding: 7px 11px;
      cursor: pointer;
      min-width: 70px;
    }

    .comment-sort button.active {
      background: rgba(91,138,245,0.16);
      color: var(--text);
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .comment-item {
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .comment-item:last-child { border-bottom: 0; }

    .comment-main,
    .reply-item {
      display: grid;
      grid-template-columns: 34px 1fr;
      gap: 10px;
    }

    .reply-item {
      grid-template-columns: 26px 1fr;
      margin-top: 10px;
    }

    .comment-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--surface2);
      object-fit: cover;
    }

    .reply-item .comment-avatar {
      width: 26px;
      height: 26px;
    }

    .comment-body { min-width: 0; }

    .comment-meta {
      display: flex;
      align-items: baseline;
      gap: 7px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }

    .comment-author {
      font-size: 13px;
      font-weight: 700;
      color: rgba(232,234,240,0.92);
    }

    .comment-date {
      font-size: 11px;
      color: var(--muted);
    }

    .comment-text {
      font-size: 13px;
      line-height: 1.55;
      color: rgba(232,234,240,0.86);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .comment-stats {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 7px;
      color: var(--muted);
      font-size: 12px;
    }

    .comment-replies {
      margin-left: 44px;
      margin-top: 8px;
    }

    .reply-item + .reply-item { margin-top: 12px; }

    .reply-toggle, .reply-more {
      margin-left: 44px;
      margin-top: 8px;
      border: none;
      background: none;
      color: var(--accent, #5b8af5);
      font: 600 12.5px var(--font);
      cursor: pointer;
      padding: 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .reply-toggle:hover, .reply-more:hover { text-decoration: underline; }

    .reply-toggle:disabled, .reply-more:disabled { cursor: default; opacity: 0.6; text-decoration: none; }

    .reply-toggle .reply-toggle-icon {
      display: inline-block;
      transition: transform 0.15s;
    }

    .reply-toggle.open .reply-toggle-icon { transform: rotate(180deg); }

    .comments-more {
      margin-top: 14px;
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font: 600 13px var(--font);
      padding: 10px 12px;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }

    .comments-more:hover {
      border-color: rgba(91,138,245,0.45);
      background: var(--surface2);
    }

    .comments-more:disabled {
      cursor: default;
      opacity: 0.6;
    }

    /* ─── Skeleton ─── */
    .skeleton {
      background: linear-gradient(90deg, var(--surface) 0%, var(--surface2) 50%, var(--surface) 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }

    .skel-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .skel-thumb { width: 100%; aspect-ratio: 16/9; }
    .skel-body { padding: 12px 14px; }
    .skel-line { height: 13px; margin-bottom: 8px; }
    .skel-line.short { width: 60%; }

    /* ─── Error ─── */
    .error-msg {
      text-align: center;
      padding: 60px 20px;
      color: var(--muted);
    }
    .error-msg .err-icon { font-size: 40px; margin-bottom: 12px; }

    /* ─── Hamburger menu (mobile home) ─── */
    .hamburger-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface2);
      cursor: pointer;
      color: var(--muted);
      flex-shrink: 0;
      transition: color 0.2s, border-color 0.2s;
    }
    .hamburger-btn:hover { color: var(--text); border-color: rgba(255,255,255,0.14); }
    .hamburger-btn svg { display: block; }

    .account-close-button, .account-avatar-file::file-selector-button {
      appearance: none; font: inherit; font-size: 14px; color: var(--text); background: var(--surface2);
      border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; cursor: pointer;
    }
    #auth-modal section { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
    .account-close-button { display: block; width: 100%; margin-top: 14px; min-height: 44px; }
    .account-close-button:hover, .account-avatar-file::file-selector-button:hover { border-color: var(--accent); }
    .account-close-button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    .account-avatar-file::file-selector-button { margin-right: 8px; }

    /* ─── Mobile login icon button ─── */
    .login-icon-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1.5px solid var(--border);
      background: var(--surface2);
      cursor: pointer;
      overflow: hidden;
      flex-shrink: 0;
      margin-left: auto;
      transition: border-color 0.2s;
    }
    .login-icon-btn:hover { border-color: rgba(91,138,245,0.5); }
    .login-icon-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .login-icon-btn svg {
      width: 18px;
      height: 18px;
      color: var(--muted);
    }

    /* ─── Mobile dropdown menu ─── */
    .mobile-menu-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 199;
    }
    .mobile-menu-overlay.open { display: block; }

    .mobile-menu {
      position: fixed;
      z-index: 200;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      min-width: 200px;
      padding: 6px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      animation: menuFadeIn 0.15s ease;
      display: none;
    }
    .mobile-menu.open { display: block; }

    @keyframes menuFadeIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .mobile-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-family: var(--font);
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
      text-decoration: none;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      transition: background 0.15s, color 0.15s;
    }
    .mobile-menu-item:hover { background: var(--surface2); }
    .mobile-menu-item svg { color: var(--muted); flex-shrink: 0; }

    .mobile-menu-divider {
      height: 1px;
      background: var(--border);
      margin: 4px 0;
    }

    .mobile-menu-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      font-size: 11px;
      font-family: var(--mono);
      font-weight: 700;
      border-radius: 8px;
    }
    .mobile-menu-status.checking { color: var(--muted); }
    .mobile-menu-status.alive { color: #22c55e; }
    .mobile-menu-status.down { color: var(--danger); }

    /* ─── Responsive ─── */
    @media (max-width: 600px) {
      header { padding: 0 16px; gap: 10px; }
      .logo { font-size: 18px; }
      .search-wrap { min-width: 0; flex: 1; }
      /* PC header actions hidden on mobile */
      .header-actions { display: none !important; }
      /* Mobile-only elements shown */
      .hamburger-btn { display: flex; }
      .login-icon-btn { display: flex; }
      main { padding: 0 16px 40px; }
      #hero { padding: 48px 16px 40px; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
      .card-title { font-size: 13px; }
      .results-header { padding-top: 20px; }
      .channel-banner-wrap { aspect-ratio: 3.2 / 1; margin-bottom: 12px; }
      .channel-header,
      .channel-header-skel { align-items: flex-start; padding: 12px 0 22px; }
      .channel-avatar,
      .channel-avatar-placeholder,
      .skel-avatar { width: 72px; height: 72px; }
      .channel-name { font-size: 19px; }
      .channel-toolbar { gap: 12px; }
      .channel-limit-wrap { width: 100%; justify-content: flex-end; }
    }
    .player-menu {position:absolute;right:8px;bottom:58px;width:280px;max-width:calc(100% - 16px);padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;z-index:30;color:var(--text);box-sizing:border-box;}
    .player-menu label {display:block;margin-bottom:6px;}
    .player-menu select, .player-menu input {width:100%;box-sizing:border-box;}
    .player-menu p {font-size:12px;margin:8px 0;line-height:1.5;}
    .player-menu button {margin-top:6px;}
    #mute-btn svg [hidden] {display:none;}
    .custom-controls:focus-within, .custom-controls:has(.player-menu:not([hidden])) {opacity:1;}
    .player-menu select, .player-menu input, #default-audio-select {background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:6px;}
    .player-menu button {background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:6px;cursor:pointer;}
    .mini-player-actions {display:none;}
    #watch-section.mini-player-host {display:contents;}
    #watch-section.mini-player-host > :not(.watch-layout),
    .mini-player-host .watch-layout > :not(:first-child),
    .mini-player-host .watch-layout > :first-child > :not(#player-wrap) {display:none!important;}
    .mini-player-host .watch-layout, .mini-player-host .watch-layout > :first-child {display:contents;}
    .mini-player-host #player-wrap {position:fixed;right:16px;bottom:max(16px, env(safe-area-inset-bottom));width:min(360px, calc(100vw - 24px));z-index:100;box-shadow:0 8px 32px #0009;border:1px solid var(--border);}
    .mini-player-host .mini-player-actions {display:flex;position:absolute;top:8px;left:8px;right:8px;gap:8px;z-index:31;}
    .mini-player-actions button {color:#fff;background:#111d;border:1px solid #ffffff55;border-radius:8px;min-height:36px;padding:6px 10px;cursor:pointer;}
    #mini-player-return {flex:1;text-align:left;}
    .mini-player-host .custom-controls {opacity:1;padding:32px 12px 10px;}
    .mini-player-host .controls-row {flex-wrap:nowrap;gap:8px;}
    .mini-player-host .controls-row > :not(#play-btn):not(#time-display) {display:none!important;}
    @media(max-width:600px) {.mini-player-host #player-wrap {width:min(280px, calc(100vw - 24px));right:12px;}}
    #more-btn {display:none;}
    .player-menu-close {display:block;margin-left:auto;min-height:36px;}
    #more-actions {display:grid;gap:8px;}
    #more-actions .play-btn {width:100%;min-height:40px;height:auto;border-radius:8px;justify-content:flex-start;gap:12px;padding:8px 12px;}
    #more-actions .play-btn::after {content:attr(aria-label);font-size:14px;}
    #more-actions #volume-slider {width:100%!important;min-height:32px;margin:0;}
    @media(max-width:600px) {
      .player-menu {position:fixed!important;top:50%;left:50%;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%);width:320px;max-height:75vh;max-height:75dvh;overflow:auto;}
      .controls-row {gap:8px;flex-wrap:nowrap;}
      #more-btn {display:flex;}
      .quality-menu {position:fixed;top:50%;left:50%;right:auto;bottom:auto;transform:translate(-50%,-50%);width:220px;max-height:75vh;overflow:auto;}
      .controls-row > #mute-btn, .controls-row > #volume-slider, .controls-row > #subtitle-btn, .controls-row > #audio-track-btn, .controls-row > #share-btn {display:none;}
      .time-display {font-size:10px;min-width:0;}
    }
  </style>
</head>
<body>
<div id="app">

  <header id="header" style="display:none">
    <!-- Mobile: hamburger (home only) / halo logo acts as menu trigger (non-home) -->
    <button class="hamburger-btn" id="hamburger-btn" aria-label="メニュー" type="button">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <a class="logo" id="header-logo" href="#">Halo</a>
    <div class="search-wrap">
      <input type="text" id="header-search" placeholder="動画を検索...">
      <button class="search-btn" id="header-search-btn" aria-label="検索">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
    </div>
    <div class="header-actions" aria-label="ヘッダー操作">
      <span class="server-status checking" id="server-status">●SERVER CHECKING</span>
      <button class="header-action" type="button" data-open-archives>アーカイブ</button>
      <button class="header-action log-toggle-btn" id="log-toggle-btn" type="button" aria-label="ログを表示" title="ログを表示" style="display:none">📜 LOG</button>
      <a class="header-action donate-action" href="https://ko-fi.com/halotube" target="_blank" rel="noopener noreferrer" aria-label="Ko-fiで寄付">寄付</a>
      <button class="header-action settings-action" id="settings-btn" type="button" aria-label="設定" title="設定">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/>
          <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2.1 2.1 0 0 1-2.97 2.97l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21a2.1 2.1 0 0 1-4.2 0v-.09a1.8 1.8 0 0 0-1.17-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06a2.1 2.1 0 0 1-2.97-2.97l.06-.06a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.65-1.1H3a2.1 2.1 0 0 1 0-4.2h.09a1.8 1.8 0 0 0 1.65-1.17 1.8 1.8 0 0 0-.36-1.98l-.06-.06A2.1 2.1 0 0 1 7.29 3.2l.06.06a1.8 1.8 0 0 0 1.98.36H9.4A1.8 1.8 0 0 0 10.5 2h.1a2.1 2.1 0 0 1 4.2 0v.09a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.06-.06a2.1 2.1 0 0 1 2.97 2.97l-.06.06a1.8 1.8 0 0 0-.36 1.98v.07A1.8 1.8 0 0 0 22 9.5h.09a2.1 2.1 0 0 1 0 4.2H22a1.8 1.8 0 0 0-1.65 1.1Z"/>
        </svg>
      </button>
      <div id="auth-btn-area" style="display:flex;align-items:center;gap:8px;"></div>
    </div>
    <!-- Mobile: login icon (always visible on mobile) -->
    <button class="login-icon-btn" id="login-icon-btn" type="button" aria-label="ログイン">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    </button>
  </header>

  <!-- Mobile overlay (closes menu on outside tap) -->
  <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>

  <!-- Mobile hamburger menu (home page) -->
  <div class="mobile-menu" id="mobile-hamburger-menu">
    <div class="mobile-menu-status checking" id="mobile-server-status-home">●SERVER CHECKING</div>
    <div class="mobile-menu-divider"></div>
    <a class="mobile-menu-item" href="https://ko-fi.com/halotube" target="_blank" rel="noopener noreferrer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      寄付する
    </a>
    <button class="mobile-menu-item" id="mobile-settings-btn-home" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2.1 2.1 0 0 1-2.97 2.97l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21a2.1 2.1 0 0 1-4.2 0v-.09a1.8 1.8 0 0 0-1.17-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06a2.1 2.1 0 0 1-2.97-2.97l.06-.06a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.65-1.1H3a2.1 2.1 0 0 1 0-4.2h.09a1.8 1.8 0 0 0 1.65-1.17 1.8 1.8 0 0 0-.36-1.98l-.06-.06A2.1 2.1 0 0 1 7.29 3.2l.06.06a1.8 1.8 0 0 0 1.98.36H9.4A1.8 1.8 0 0 0 10.5 2h.1a2.1 2.1 0 0 1 4.2 0v.09a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.06-.06a2.1 2.1 0 0 1 2.97 2.97l-.06.06a1.8 1.8 0 0 0-.36 1.98v.07A1.8 1.8 0 0 0 22 9.5h.09a2.1 2.1 0 0 1 0 4.2H22a1.8 1.8 0 0 0-1.65 1.1Z"/></svg>
      設定
    </button>
  </div>

  <!-- Mobile halo logo menu (non-home pages) -->
  <div class="mobile-menu" id="mobile-logo-menu">
    <button class="mobile-menu-item" id="mobile-home-btn" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      ホーム
    </button>
    <a class="mobile-menu-item" href="https://ko-fi.com/halotube" target="_blank" rel="noopener noreferrer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      寄付する
    </a>
    <button class="mobile-menu-item" id="mobile-settings-btn-nohome" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2.1 2.1 0 0 1-2.97 2.97l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21a2.1 2.1 0 0 1-4.2 0v-.09a1.8 1.8 0 0 0-1.17-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06a2.1 2.1 0 0 1-2.97-2.97l.06-.06a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.65-1.1H3a2.1 2.1 0 0 1 0-4.2h.09a1.8 1.8 0 0 0 1.65-1.17 1.8 1.8 0 0 0-.36-1.98l-.06-.06A2.1 2.1 0 0 1 7.29 3.2l.06.06a1.8 1.8 0 0 0 1.98.36H9.4A1.8 1.8 0 0 0 10.5 2h.1a2.1 2.1 0 0 1 4.2 0v.09a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.06-.06a2.1 2.1 0 0 1 2.97 2.97l-.06.06a1.8 1.8 0 0 0-.36 1.98v.07A1.8 1.8 0 0 0 22 9.5h.09a2.1 2.1 0 0 1 0 4.2H22a1.8 1.8 0 0 0-1.65 1.1Z"/></svg>
      設定
    </button>
    <div class="mobile-menu-divider"></div>
    <div class="mobile-menu-status checking" id="mobile-server-status-nohome">●SERVER CHECKING</div>
  </div>

  <section id="hero">
    <h1 id="hero-logo" title="Halo">Halo</h1>
    <p>AIのハルシネーションに悪戦苦闘中</p>
    <div class="hero-search">
      <input type="text" id="hero-search" placeholder="動画を検索...">
      <button class="hero-search-btn" id="hero-search-btn" aria-label="検索">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
    </div>
  </section>

  <main>
    <section id="results-section">
      <div class="results-header">
        <h2 id="results-title"></h2>
        <span class="results-count" id="results-count"></span>
      </div>
      <div class="grid" id="results-grid"></div>
      <button type="button" class="results-more" id="results-more">さらに読み込む</button>
    </section>

    <section id="channel-section">
      <button class="back-btn" id="channel-back-btn" style="margin: 16px 0 12px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        戻る
      </button>

      <!-- バナー -->
      <div class="channel-banner-wrap no-banner" id="channel-banner-wrap">
        <img id="channel-banner" alt="" style="display:none">
      </div>

      <!-- ヘッダースケルトン（ローディング中） -->
      <div class="channel-header-skel" id="channel-header-skel" style="display:none">
        <div class="skeleton skel-avatar"></div>
        <div class="skel-channel-info">
          <div class="skeleton skel-name"></div>
          <div class="skeleton skel-sub"></div>
          <div class="skeleton skel-link"></div>
        </div>
      </div>

      <!-- チャンネルヘッダー本体 -->
      <div class="channel-header" id="channel-header" style="display:none">
        <div class="channel-avatar-wrap">
          <div class="channel-avatar-placeholder" id="channel-avatar-placeholder"></div>
          <img class="channel-avatar" id="channel-avatar" alt="" style="display:none">
          <span class="channel-avatar-badge" id="channel-avatar-badge" style="display:none"></span>
        </div>
        <div class="channel-info">
          <div class="channel-name-row">
            <span class="channel-name" id="channel-name"></span>
            <span class="channel-verified-badge" id="channel-verified-badge" style="display:none"></span>
          </div>
          <div class="channel-stats" id="channel-stats"></div>
          <div class="channel-desc" id="channel-desc" style="display:none"></div>
          <a class="channel-link" id="channel-yt-link" href="#" target="_blank" rel="noopener noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C16.3 5 12 5 12 5s-4.3 0-6.9.1c-.4.1-1.3.1-2.1.9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c .8.8 1.8.8 2.3.8C6.8 19 12 19 12 19s4.3 0 6.9-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.7 14.5V9l5.6 2.8-5.6 2.7z"/></svg>
            YouTubeで見る
          </a>
        </div>
      </div>

      <div class="channel-toolbar">
        <div class="channel-tabs" id="channel-tabs" aria-label="チャンネルコンテンツ">
          <button type="button" class="channel-tab active" data-tab="videos">動画</button>
          <button type="button" class="channel-tab" data-tab="shorts">ショート</button>
          <button type="button" class="channel-tab" data-tab="releases">リリース</button>
          <button type="button" class="channel-tab" data-tab="playlists">再生リスト</button>
          <button type="button" class="channel-tab" data-tab="posts">投稿</button>
        </div>

      </div>

      <div class="results-header">
        <h2 id="channel-videos-title">動画</h2>
        <span class="results-count" id="channel-videos-count"></span>
      </div>
      <div class="grid" id="channel-grid"></div>
      <button type="button" class="results-more" id="channel-more">さらに読み込む</button>
    </section>

    <section id="watch-section">
      <button class="back-btn" id="back-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        戻る
      </button>
      <div class="watch-layout">
        <div>
          <div class="player-wrap" id="player-wrap">
            <video id="video-player" autoplay playsinline></video>
            <div class="mini-player-actions">
              <button type="button" id="mini-player-return" aria-label="動画ページに戻る">↗ 動画に戻る</button>
              <button type="button" id="mini-player-close" aria-label="ミニプレーヤーを閉じて再生を停止">✕</button>
            </div>

            <div class="player-loading" id="player-loading">
              <div class="spinner"></div>
              <p id="loading-msg">動画を準備中...</p>
            </div>

            <div class="custom-controls" id="custom-controls">
              <div class="progress-wrap" id="progress-wrap">
                <div class="preview-wrap" id="preview-wrap">
                  <img class="preview-img" id="preview-img" alt="" decoding="async">
                  <div class="preview-time" id="preview-time">0:00</div>
                </div>

                <div class="progress-buffer" id="progress-buffer"></div>
                <div class="progress-fill" id="progress-fill"></div>
                <div class="progress-thumb" id="progress-thumb"></div>
              </div>
              <div class="controls-row">
                <button class="play-btn" id="play-btn" aria-label="再生/停止">
                  <svg id="icon-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  <svg id="icon-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:none">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                </button>
                <button class="play-btn" id="mute-btn" type="button" aria-label="ミュート" title="ミュート"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path id="volume-waves" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path id="volume-cross" hidden d="m16 9 6 6m0-6-6 6"/></svg></button>
                <input id="volume-slider" type="range" min="0" max="1" step="0.01" value="1" aria-label="音量" style="width:64px;min-width:36px;accent-color:var(--accent)">
                <span class="time-display" id="time-display">0:00 / 0:00</span>
                <button class="play-btn" id="subtitle-btn" type="button" aria-label="字幕" title="字幕" aria-expanded="false" aria-controls="subtitle-panel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M5 12h5m3 0h6M5 16h8m3 0h3"/></svg></button>
                <button class="play-btn" id="audio-track-btn" type="button" aria-label="音声トラック" title="音声トラック" aria-expanded="false" aria-controls="audio-track-panel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="12" width="5" height="9" rx="2"/><rect x="16" y="12" width="5" height="9" rx="2"/></svg></button>
                <button class="play-btn" id="share-btn" type="button" aria-label="共有" title="共有" aria-expanded="false" aria-controls="share-panel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-3M9 14l6 3"/></svg></button>
                <button class="play-btn" id="more-btn" type="button" aria-label="その他の操作" title="その他の操作" aria-expanded="false" aria-controls="more-panel"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="12" r="2"/></svg></button>
                <div id="more-panel" class="player-menu" hidden aria-label="その他の操作">
                  <button type="button" class="player-menu-close">閉じる</button>
                  <div id="more-actions"></div>
                </div>
                <div id="subtitle-panel" class="player-menu" hidden>
                  <button type="button" class="player-menu-close">閉じる</button>
                  <label for="subtitle-select">字幕</label>
                  <select id="subtitle-select" disabled><option value="off">オフ</option></select>
                  <p id="subtitle-status" role="status"></p>
                  <button id="subtitle-reload" type="button">一覧を再取得</button>
                </div>
                <div id="audio-track-panel" class="player-menu" hidden>
                  <button type="button" class="player-menu-close">閉じる</button>
                  <label for="audio-track-select">音声トラック</label>
                  <select id="audio-track-select" disabled><option value="auto">動画の既定</option></select>
                  <p id="audio-track-status" role="status"></p>
                  <button id="audio-track-reload" type="button">一覧を再取得</button>
                </div>
                <div id="share-panel" class="player-menu" hidden>
                  <button type="button" class="player-menu-close">閉じる</button>
                  <label for="share-url">動画を共有</label>
                  <input id="share-url" type="text" readonly aria-label="共有URL">
                  <button id="share-copy" type="button">リンクをコピー</button>
                  <button id="archive-save" type="button">アーカイブに保存</button>
                  <button type="button" data-open-archives>アーカイブ動画一覧</button>
                  <p id="share-status" role="status"></p>
                </div>
                <div class="quality-menu-wrap" id="quality-menu-wrap" style="margin-left:auto;position:relative">
                  <button class="play-btn quality-btn" id="quality-btn" aria-label="画質" title="画質">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </button>
                  <div class="quality-menu" id="quality-menu" style="display:none">
                    <button type="button" class="quality-menu-item active" id="quality-opt-auto" data-quality="auto">安定画質</button>
                    <button type="button" class="quality-menu-item" data-quality="240p">240p</button>
                    <button type="button" class="quality-menu-item" data-quality="360p">360p</button>
                    <button type="button" class="quality-menu-item" data-quality="480p">480p</button>
                    <button type="button" class="quality-menu-item" data-quality="720p">720p</button>
                    <button type="button" class="quality-menu-item" id="quality-opt-1080p" data-quality="1080p">1080p</button>
                  </div>
                </div>
                <button class="play-btn fullscreen-btn" id="fullscreen-btn" type="button" aria-label="全画面" title="全画面">
                  <svg id="icon-fs-enter" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M16 21h3a2 2 0 0 0 2-2v-3M8 21H5a2 2 0 0 1-2-2v-3"/>
                  </svg>
                  <svg id="icon-fs-exit" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M16 21v-3a2 2 0 0 1 2-2h3M8 21v-3a2 2 0 0 0-2-2H3"/>
                  </svg>
                </button>
                <button class="play-btn pip-btn" id="pip-btn" aria-label="ピクチャー・イン・ピクチャー" title="PiP"
                  <!-- PiP off icon -->
                  <svg id="icon-pip-off" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <rect x="12" y="11" width="8" height="6" rx="1" fill="currentColor" stroke="none"/>
                  </svg>
                  <!-- PiP on icon (active) -->
                  <svg id="icon-pip-on" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;color:var(--cyan)">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <rect x="12" y="11" width="8" height="6" rx="1" fill="var(--cyan)" stroke="none"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="video-info">
            <h2 id="watch-title"></h2>
            <div class="video-info-meta">
              <span id="watch-channel" class="channel-clickable"></span>
              <span class="dot" id="watch-like-dot" style="display:none">•</span>
              <span id="watch-likes"></span>
              <span class="dot" id="watch-date-dot" style="display:none">•</span>
              <span id="watch-date"></span>
              <span id="quality-badge" class="quality-badge"></span>
            </div>
            <div id="watch-description" class="video-description"></div>
          </div>

          <section class="comments-panel" id="comments-panel">
            <div class="comments-head">
              <div class="comments-title" id="comments-title">コメント</div>
              <div class="comment-sort" aria-label="コメントの並び順">
                <button type="button" id="comments-sort-relevance" class="active" data-order="relevance">関連順</button>
                <button type="button" id="comments-sort-time" data-order="time">時系列</button>
              </div>
            </div>
            <div class="comments-list" id="comments-list">
              <div class="chat-empty">コメントを取得中...</div>
            </div>
            <button type="button" class="comments-more" id="comments-more" style="display:none">さらに読み込む</button>
          </section>
        </div>
        <aside id="related" class="side-panel">
          <div class="live-chat" id="live-chat">
            <div class="live-chat-header">
              <span>ライブチャット</span>
              <span class="chat-status" id="chat-status">接続中...</span>
            </div>
            <div class="chat-list" id="chat-list">
              <div class="chat-empty">チャットを取得中...</div>
            </div>
          </div>
          <div class="related-videos">
            <h3>関連動画</h3>
            <div id="related-list"></div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</div>

<script>
(() => {
  // ─── Halo Settings (実験的ストリーミング / コンソール) ───
  const EXPERIMENTAL_STREAM_KEY = 'halo_experimental_streaming';
  const YOUTUBEJS_KEY           = 'halo_youtubejs'; // '1' のとき youtube.js(youtubei.js) で動画情報を取得する
  const CONSOLE_ENABLED_KEY     = 'halo_console_enabled';
  function getDefaultAudioPreference() {
    try { return localStorage.getItem('halo_default_audio') || 'auto'; } catch (_) { return 'auto'; }
  }
  function audioPreferenceQuery() { return '&audio=' + encodeURIComponent(currentAudioPreference); }
  function languageLabel(language) {
    try { return new Intl.DisplayNames(['ja'], {type:'language'}).of(language) || language; } catch (_) { return language; }
  }

  const QUALITY_STEPS = ['240p','360p','480p','720p','1080p'];
  const PREFERRED_QUALITY_KEY = 'halo_preferred_quality';

  function getPreferredQuality() {
    try {
      const saved = localStorage.getItem(PREFERRED_QUALITY_KEY);
      return QUALITY_STEPS.includes(saved) ? saved : 'auto';
    } catch (e) { return 'auto'; }
  }
  function setPreferredQuality(q) {
    try { localStorage.setItem(PREFERRED_QUALITY_KEY, QUALITY_STEPS.includes(q) ? q : 'auto'); } catch (e) {}
  }

  function isExperimentalStreamingEnabled() {
    try { return localStorage.getItem(EXPERIMENTAL_STREAM_KEY) === '1'; } catch (e) { return false; }
  }
  function setExperimentalStreamingEnabled(v) {
    try { localStorage.setItem(EXPERIMENTAL_STREAM_KEY, v ? '1' : '0'); } catch (e) {}
  }
  function isYoutubeJsEnabled() {
    try { return localStorage.getItem(YOUTUBEJS_KEY) === '1'; } catch (e) { return false; }
  }
  function setYoutubeJsEnabled(v) {
    try { localStorage.setItem(YOUTUBEJS_KEY, v ? '1' : '0'); } catch (e) {}
  }
  function isConsoleEnabled() {
    try { return localStorage.getItem(CONSOLE_ENABLED_KEY) === '1'; } catch (e) { return false; }
  }
  function setConsoleEnabled(v) {
    try { localStorage.setItem(CONSOLE_ENABLED_KEY, v ? '1' : '0'); } catch (e) {}
  }

  // ─── コンソールログ捕捉（log-screen機能用のバッファ。トグルOFFでも裏で貯め続け、表示だけを止める） ───
  const HALO_LOG_BUFFER = [];
  const HALO_LOG_MAX     = 500;

  function haloEscHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function haloPushLog(level, text) {
    HALO_LOG_BUFFER.push({ level: level, text: text, time: new Date() });
    if (HALO_LOG_BUFFER.length > HALO_LOG_MAX) HALO_LOG_BUFFER.shift();
    if (typeof renderHaloLogPanel === 'function') renderHaloLogPanel();
  }

  (function initHaloConsoleCapture() {
    ['log', 'info', 'warn', 'error', 'debug'].forEach(function(level) {
      const original = console[level] ? console[level].bind(console) : function() {};
      console[level] = function() {
        try {
          const args = Array.prototype.slice.call(arguments);
          const text = args.map(function(a) {
            if (typeof a === 'string') return a;
            try { return JSON.stringify(a); } catch (e) { return String(a); }
          }).join(' ');
          haloPushLog(level, text);
        } catch (e) {}
        original.apply(console, arguments);
      };
    });
    window.addEventListener('error', function(e) {
      haloPushLog('error', '[window.onerror] ' + (e.message || '') + ' @ ' + (e.filename || '') + ':' + (e.lineno || ''));
    });
  })();

  // ─── State ───
  let currentVideoId = null;
  let searchQuery    = '';
  let lastResults    = [];
  let knownDuration  = 0;   // /api/stream から取得した秒数（yt-dlp のメタ情報）
  let currentPreviewImage = '';
  let lastResolvedPreviewImage = '';
  let previewRequestKey = '';
  let previewPendingKey = '';
  let previewRequestTimer = null;
  let pendingPreviewSecond = null;
  let dragging       = false;
  let rafId          = null;
  let hlsInstance    = null; // hls.js インスタンス
  let currentStreamUrl = '';
  let currentStreamOffset = 0;
  let currentAudioPreference = getDefaultAudioPreference();
  let mediaTracksVideoId = "";
  let mediaTracks = {audio: [], subtitles: []};
  let subtitleData = [];
  let subtitleRequestId = 0;
  let mediaOptionsRequestId = 0;
  let lastAudioFallback = false;
  let forceCompatiblePlayback = false;
  let hlsRetryCount = 0;
  let hlsRetryTimer = null;
  let recommendationsRequestId = 0;
  let currentIsLive = false;
  let qualityMode = getPreferredQuality();
  let autoQualityController = null;
  let currentQuality = 'auto';        // 現在再生中の画質。ユーザーが選んだモードは qualityMode で保持
  let currentAvailableQualities = [];
  let currentAvailable1080p = false;  // この動画で1080pが選択可能か
  let currentVideoChannelId = '';
  let currentVideoCommentCount = null; // videos.list の statistics.commentCount（commentThreadsのtotalResultsは常にmaxResults値になるため使わない）
  let liveChatTimer = null;
  let liveChatContinuation = '';
  let liveChatRequestId = 0;
  let commentsOrder = 'relevance';
  let commentsNextPageToken = '';
  let commentsLoading = false;
  let commentsRequestId = 0;
  let playVideoRequestId = 0; // 動画読み込みリクエストの競合防止用
  let streamHeartbeatTimer = null; // タブが開いている/再生中である合図を定期送信するタイマー
  let searchNextPageToken = '';
  let searchLoadingMore = false;
  let headerLogoShuffleVersion = 0;
  const seenChatMessageIds = new Set();

  // Channel page state
  let currentChannelId = '';
  let currentChannelName = '';
  let channelNextPageToken = '';
  let channelLoadingMore = false;
  let channelVideos = [];
  let currentChannelTab = 'videos';
  let channelDisplayLimit = 20;
  let channelCanLoadMore = false;
  const CHANNEL_TABS = {
    videos: '動画',
    shorts: 'ショート',
    releases: 'リリース',
    playlists: '再生リスト',
    posts: '投稿',
  };

  const WATCH_HISTORY_KEY = 'halo.watchHistory.v1';
  const MAX_WATCH_HISTORY = 24;
  const DEFAULT_RECOMMENDATION_QUERY = 'trand';
  const MIN_RECOMMENDATION_ITEMS = 8;
  const MAX_RECOMMENDATION_QUERIES = 5;
  const HALO_MIN = 2;
  const HALO_MAX = 188;

  // ─── Elements ───
  const hero            = document.getElementById('hero');
  const header          = document.getElementById('header');
  const headerLogo      = document.getElementById('header-logo');
  const heroSearch      = document.getElementById('hero-search');
  const heroSearchBtn   = document.getElementById('hero-search-btn');
  const headerSearch    = document.getElementById('header-search');
  const headerSearchBtn = document.getElementById('header-search-btn');
  const headerSearchWrap = headerSearch ? headerSearch.closest('.search-wrap') : null;
  const serverStatus    = document.getElementById('server-status');
  const resultsSection  = document.getElementById('results-section');
  const resultsGrid     = document.getElementById('results-grid');
  const resultsMore     = document.getElementById('results-more');
  const resultsTitle    = document.getElementById('results-title');
  const resultsCount    = document.getElementById('results-count');
  const watchSection    = document.getElementById('watch-section');
  const videoPlayer     = document.getElementById('video-player');
  const playerLoading   = document.getElementById('player-loading');
  const loadingMsg      = document.getElementById('loading-msg');
  const watchTitle      = document.getElementById('watch-title');
  const watchChannel    = document.getElementById('watch-channel');
  const watchLikes      = document.getElementById('watch-likes');
  const watchLikeDot    = document.getElementById('watch-like-dot');
  const watchDate       = document.getElementById('watch-date');
  const watchDateDot    = document.getElementById('watch-date-dot');
  const watchDescription = document.getElementById('watch-description');
  const qualityBadge    = document.getElementById('quality-badge');
  const qualityMenuWrap = document.getElementById('quality-menu-wrap');
  const qualityBtn      = document.getElementById('quality-btn');
  const qualityMenu     = document.getElementById('quality-menu');
  const qualityOptAuto  = document.getElementById('quality-opt-auto');
  const qualityOpt1080p = document.getElementById('quality-opt-1080p');
  const relatedList     = document.getElementById('related-list');
  const liveChat        = document.getElementById('live-chat');
  const chatList        = document.getElementById('chat-list');
  const chatStatus      = document.getElementById('chat-status');
  const commentsPanel   = document.getElementById('comments-panel');
  const commentsTitle   = document.getElementById('comments-title');
  const commentsList    = document.getElementById('comments-list');
  const commentsMore    = document.getElementById('comments-more');
  const commentsSortRelevance = document.getElementById('comments-sort-relevance');
  const commentsSortTime = document.getElementById('comments-sort-time');
  const backBtn         = document.getElementById('back-btn');

  // Mobile menu elements
  const hamburgerBtn         = document.getElementById('hamburger-btn');
  const loginIconBtn         = document.getElementById('login-icon-btn');
  const mobileMenuOverlay    = document.getElementById('mobile-menu-overlay');
  const mobileHamburgerMenu  = document.getElementById('mobile-hamburger-menu');
  const mobileLogoMenu       = document.getElementById('mobile-logo-menu');
  const mobileServerStatusHome   = document.getElementById('mobile-server-status-home');
  const mobileServerStatusNohome = document.getElementById('mobile-server-status-nohome');
  const mobileHomBtn         = document.getElementById('mobile-home-btn');

  const channelSection       = document.getElementById('channel-section');
  const channelBackBtn       = document.getElementById('channel-back-btn');
  const channelBannerWrap    = document.getElementById('channel-banner-wrap');
  const channelBannerImg     = document.getElementById('channel-banner');
  const channelHeaderSkel    = document.getElementById('channel-header-skel');
  const channelHeaderEl      = document.getElementById('channel-header');
  const channelAvatarEl      = document.getElementById('channel-avatar');
  const channelAvatarPh      = document.getElementById('channel-avatar-placeholder');
  const channelAvatarBadge   = document.getElementById('channel-avatar-badge');
  const channelNameEl        = document.getElementById('channel-name');
  const channelVerifiedBadge = document.getElementById('channel-verified-badge');
  const channelStatsEl       = document.getElementById('channel-stats');
  const channelDescEl        = document.getElementById('channel-desc');
  const channelYtLink        = document.getElementById('channel-yt-link');
  const channelGrid          = document.getElementById('channel-grid');
  const channelMore          = document.getElementById('channel-more');
  const channelVideosTitle   = document.getElementById('channel-videos-title');
  const channelVideosCount   = document.getElementById('channel-videos-count');
  const channelTabs          = document.getElementById('channel-tabs');

  const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

  // player
  const playerWrap     = document.getElementById('player-wrap');
  const playBtn        = document.getElementById('play-btn');
  const iconPlay       = document.getElementById('icon-play');
  const iconPause      = document.getElementById('icon-pause');
  const progressWrap   = document.getElementById('progress-wrap');
  const progressBuffer = document.getElementById('progress-buffer');
  const progressFill   = document.getElementById('progress-fill');
  const progressThumb  = document.getElementById('progress-thumb');
  const timeDisplay    = document.getElementById('time-display');

  const volumeSlider = document.getElementById('volume-slider');
  const muteBtn = document.getElementById('mute-btn');
  const subtitleBtn = document.getElementById('subtitle-btn');
  const audioTrackBtn = document.getElementById('audio-track-btn');
  const playerMenus = ['subtitle','audio-track','share','more'].map(name => ({button:document.getElementById(name+'-btn'), panel:document.getElementById(name+'-panel')}));
  const shareBaseUrl = getShareBaseUrl(window.location.href);
  const compactPlayerQuery = window.matchMedia('(max-width:600px)');
  const compactControls = ['mute-btn','volume-slider','subtitle-btn','audio-track-btn','share-btn'].map(id => {
    const node = document.getElementById(id);
    const placeholder = document.createComment(id);
    node.before(placeholder);
    return {node, placeholder};
  });
  function updateCompactControls() {
    closePlayerMenus();
    for (const {node, placeholder} of compactControls) {
      if (compactPlayerQuery.matches) document.getElementById('more-actions').appendChild(node);
      else placeholder.after(node);
    }
  }
  compactPlayerQuery.addEventListener('change', updateCompactControls);
  updateCompactControls();
  const subtitleSelect = document.getElementById('subtitle-select');
  const audioTrackSelect = document.getElementById('audio-track-select');
  const subtitleStatus = document.getElementById('subtitle-status');
  const audioTrackStatus = document.getElementById('audio-track-status');
  let mediaOptionsLoadingId = '';
  const subtitleTrack = videoPlayer.addTextTrack('subtitles', 'Halo 字幕');
  subtitleTrack.mode = 'disabled';
  try {
    const saved = localStorage.getItem('halo_volume');
    const volume = saved === null ? 1 : Number(saved);
    videoPlayer.volume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1;
    videoPlayer.muted = localStorage.getItem('halo_muted') === '1';
  } catch (_) {}
  function syncVolume() {
    volumeSlider.value = videoPlayer.muted ? 0 : videoPlayer.volume;
    const silent = videoPlayer.muted || videoPlayer.volume === 0;
    document.getElementById('volume-waves').toggleAttribute('hidden', silent);
    document.getElementById('volume-cross').toggleAttribute('hidden', !silent);
    muteBtn.setAttribute('aria-label', videoPlayer.muted ? 'ミュート解除' : 'ミュート');
    muteBtn.setAttribute('aria-pressed', String(videoPlayer.muted));
    muteBtn.title = videoPlayer.muted ? 'ミュート解除' : 'ミュート';
    try {
      localStorage.setItem('halo_volume', String(videoPlayer.volume));
      localStorage.setItem('halo_muted', videoPlayer.muted ? '1' : '0');
    } catch (_) {}
  }
  videoPlayer.addEventListener('volumechange', syncVolume);
  volumeSlider.addEventListener('input', () => { videoPlayer.volume = Number(volumeSlider.value); videoPlayer.muted = false; });
  muteBtn.addEventListener('click', () => { videoPlayer.muted = !videoPlayer.muted; if (!videoPlayer.muted && videoPlayer.volume === 0) videoPlayer.volume = 0.5; });
  syncVolume();

  function rebuildSubtitleCues() {
    subtitleTrack.mode = 'hidden';
    while (subtitleTrack.cues && subtitleTrack.cues.length) subtitleTrack.removeCue(subtitleTrack.cues[0]);
    for (const cue of subtitleData) {
      const start = Math.max(0, cue.start - currentStreamOffset);
      const end = cue.end - currentStreamOffset;
      if (end > start) subtitleTrack.addCue(new VTTCue(start, end, cue.text));
    }
    subtitleTrack.mode = subtitleSelect.value === 'off' ? 'disabled' : 'showing';
  }
  function resetMediaOptions() {
    subtitleRequestId++;
    mediaOptionsRequestId++;
    subtitleData = [];
    subtitleSelect.replaceChildren(new Option('オフ', 'off'));
    audioTrackSelect.replaceChildren(new Option('動画の既定', 'auto'));
    subtitleSelect.disabled = audioTrackSelect.disabled = true;
    mediaTracksVideoId = '';
    mediaTracks = {audio:[], subtitles:[]};
    closePlayerMenus();
    mediaOptionsLoadingId = '';
    subtitleStatus.textContent = audioTrackStatus.textContent = '';
    document.getElementById('share-url').value = '';
    rebuildSubtitleCues();
  }
  async function loadMediaOptions() {
    const token = ++mediaOptionsRequestId;
    const id = currentVideoId;
    if (!id) return;
    mediaOptionsLoadingId = id;
    subtitleStatus.textContent = audioTrackStatus.textContent = '一覧を取得中…';
    try {
      const res = await fetch('/api/media/tracks?id=' + encodeURIComponent(id));
      const data = await res.json();
      if (id !== currentVideoId || token !== mediaOptionsRequestId) return;
      if (!res.ok) throw new Error(data.error || '取得に失敗しました');
      mediaTracks = data;
      mediaTracksVideoId = id;
      const selectedSubtitle = subtitleSelect.value;
      subtitleSelect.replaceChildren(new Option('オフ','off'));
      for (const track of data.subtitles) subtitleSelect.add(new Option(languageLabel(track.language) + (track.auto ? '（自動字幕）' : ''), track.id));
      subtitleSelect.value = [...subtitleSelect.options].some(o => o.value === selectedSubtitle) ? selectedSubtitle : 'off';
      audioTrackSelect.replaceChildren(new Option('動画の既定','auto'),new Option('オリジナル優先','original'));
      for (const track of data.audio) audioTrackSelect.add(new Option(languageLabel(track.language) + (track.original ? '（オリジナル）' : ''), 'track:' + track.id));
      if (![...audioTrackSelect.options].some(o => o.value === currentAudioPreference)) audioTrackSelect.add(new Option('設定の優先言語',currentAudioPreference));
      audioTrackSelect.value = currentAudioPreference;
      rebuildSubtitleCues();
      subtitleSelect.disabled = !data.subtitles.length;
      audioTrackSelect.disabled = !data.audio.length;
      subtitleStatus.textContent = !data.subtitles.length ? 'この動画には利用できる字幕がありません。' : '';
      audioTrackStatus.textContent = '音声の切り替え時は一時的に読み込みが発生します。';
    } catch (e) { if (id === currentVideoId && token === mediaOptionsRequestId) subtitleStatus.textContent = audioTrackStatus.textContent = e.message; }
    finally { if (token === mediaOptionsRequestId) mediaOptionsLoadingId = ''; }
  }
  function getShareBaseUrl(href) {
    const url = new URL(href);
    const path = url.pathname.replace(/[/]+$/, '').replace(/[/](watch|index[.]html)$/, '');
    return url.origin + path;
  }
  function buildShareUrl(base, videoId) {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return '';
    const url = new URL(base + '/watch');
    url.searchParams.set('v', videoId);
    return url.href;
  }
  function closePlayerMenus() {
    for (const menu of playerMenus) {
      menu.panel.hidden = true;
      menu.button.setAttribute('aria-expanded', 'false');
    }
  }
  for (const menu of playerMenus) {
    menu.button.addEventListener('click', () => {
      const opening = menu.panel.hidden;
      closePlayerMenus();
      if (!opening) return;
      menu.panel.hidden = false;
      menu.button.setAttribute('aria-expanded', 'true');
      if (menu.button.id === 'share-btn') {
        const url = buildShareUrl(shareBaseUrl, currentVideoId);
        document.getElementById('share-url').value = url;
        document.getElementById('share-copy').disabled = !url;
        document.getElementById('share-status').textContent = url ? '' : '共有する動画を開いてください。';
      } else if (menu.button.id !== 'more-btn' && mediaTracksVideoId !== currentVideoId && mediaOptionsLoadingId !== currentVideoId) loadMediaOptions();
      const focusTarget = menu.panel.querySelector('select:not(:disabled), input, button');
      if (focusTarget) focusTarget.focus();
    });
    const dismiss = () => {
      closePlayerMenus();
      (compactPlayerQuery.matches ? document.getElementById('more-btn') : menu.button).focus();
    };
    menu.panel.querySelector('.player-menu-close').addEventListener('click', dismiss);
    menu.panel.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); dismiss(); }
    });
  }
  for (const name of ['subtitle', 'audio-track']) document.getElementById(name+'-reload').addEventListener('click', loadMediaOptions);
  document.addEventListener('click', e => {
    if (!playerMenus.some(menu => menu.panel.contains(e.target) || menu.button.contains(e.target))) closePlayerMenus();
  });
  document.getElementById('share-copy').addEventListener('click', async () => {
    const input = document.getElementById('share-url');
    const status = document.getElementById('share-status');
    if (!input.value) return;
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = 'リンクをコピーしました。';
    } catch (_) {
      input.focus(); input.select();
      status.textContent = 'URLを選択しました。長押し、または Ctrl+C / ⌘C でコピーしてください。';
    }
  });
  subtitleSelect.addEventListener('change', async () => {
    const token = ++subtitleRequestId;
    const id = currentVideoId;
    subtitleData = []; rebuildSubtitleCues();
    if (subtitleSelect.value === 'off') { subtitleStatus.textContent = '字幕オフ'; return; }
    subtitleStatus.textContent = '字幕を読み込み中…';
    try {
      const res = await fetch('/api/media/subtitle?id=' + encodeURIComponent(id) + '&track=' + encodeURIComponent(subtitleSelect.value));
      const data = await res.json();
      if (token !== subtitleRequestId || id !== currentVideoId) return;
      if (!res.ok) throw new Error(data.error || '字幕の取得に失敗しました');
      subtitleData = data.cues; rebuildSubtitleCues();
      subtitleStatus.textContent = subtitleData.length ? '字幕を表示しています。' : '表示できる字幕がありません。';
    } catch(e) { if (token === subtitleRequestId) subtitleStatus.textContent = e.message; }
  });
  audioTrackSelect.addEventListener('change', async () => {
    const id = currentVideoId;
    const previous = currentAudioPreference;
    const oldUrl = currentStreamUrl;
    const oldOffset = currentStreamOffset;
    const position = videoPlayer.currentTime + oldOffset;
    const paused = videoPlayer.paused;
    currentAudioPreference = audioTrackSelect.value;
    audioTrackSelect.disabled = true;
    const switchRequestId = playVideoRequestId + 1;
    audioTrackStatus.textContent = '音声を切り替え中…';
    try {
      await refreshPlayback(position, paused, false);
      if (id === currentVideoId && switchRequestId === playVideoRequestId) audioTrackStatus.textContent = lastAudioFallback ? '希望する音声がないため、動画の既定音声で再生しています。' : '音声を切り替えました。';
    } catch(e) {
      if (id !== currentVideoId || switchRequestId !== playVideoRequestId) return;
      currentAudioPreference = previous; audioTrackSelect.value = previous;
      currentStreamOffset = oldOffset;
      attachHlsSrc(oldUrl, Math.max(0,position-oldOffset),paused);
      audioTrackStatus.textContent = '音声を切り替えられなかったため、元の音声に戻しました。';
    } finally { if (id === currentVideoId) audioTrackSelect.disabled = false; }
  });

  // preview
  const previewWrap    = document.getElementById('preview-wrap');
  const previewImg     = document.getElementById('preview-img');
  const previewTime    = document.getElementById('preview-time');

  // PiP
  const pipBtn         = document.getElementById('pip-btn');
  const iconPipOff     = document.getElementById('icon-pip-off');
  const iconPipOn      = document.getElementById('icon-pip-on');

  // ─── サーバーのステータス10回連打で虹色にするギミック ───
  let statusClickCount = 0;
  let statusClickTimer = null;

  document.querySelectorAll('.server-status').forEach(el => {
    el.addEventListener('click', () => {
      statusClickCount++;
      
      // 10回連打したら、全てのステータス表示に虹色クラスを付与
      if (statusClickCount >= 10) {
        document.querySelectorAll('.server-status').forEach(statusEl => {
          statusEl.classList.add('rainbow');
        });
      }

      // 1秒間クリックが途切れたらカウントを0にリセット（連打判定）
      clearTimeout(statusClickTimer);
      statusClickTimer = setTimeout(() => {
        statusClickCount = 0;
      }, 1000);
    });
  });

  // ─── Helpers ───
  function fmtTime(sec) {
    if (!isFinite(sec) || isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function fmtDurationBadge(sec) {
    if (!sec || !isFinite(sec) || sec <= 0) return '';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return m + ':' + String(s).padStart(2, '0');
  }

  function safeTrim(value) {
    return String(value ?? '').trim();
  }

  function getWatchHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(WATCH_HISTORY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => item && item.id) : [];
    } catch (_) {
      return [];
    }
  }

  function saveWatchHistory(history) {
    try {
      localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_WATCH_HISTORY)));
    } catch (_) {}
  }

  function normalizeHistoryVideo(video) {
    return {
      id: safeTrim(video?.id),
      title: safeTrim(video?.title),
      channel: safeTrim(video?.channel),
      channelId: safeTrim(video?.channelId),
      categoryId: safeTrim(video?.categoryId),
      tags: Array.isArray(video?.tags) ? video.tags.map(safeTrim).filter(Boolean).slice(0, 15) : [],
      thumb: buildPreviewImage(video),
      description: safeTrim(video?.description),
      watchedAt: Date.now(),
    };
  }

  function rememberWatchedVideo(video) {
    const normalized = normalizeHistoryVideo(video);
    if (!normalized.id) return;

    const prev = getWatchHistory().find(item => item.id === normalized.id);
    if (prev) {
      // 再視聴時、すでに解析済みのジャンル情報を失わない
      if (!normalized.channelId) normalized.channelId = safeTrim(prev.channelId);
      if (!normalized.categoryId) normalized.categoryId = safeTrim(prev.categoryId);
      if (!normalized.tags.length && Array.isArray(prev.tags)) normalized.tags = prev.tags;
    }
    const history = getWatchHistory().filter(item => item.id !== normalized.id);
    history.unshift(normalized);
    saveWatchHistory(history);
  }

  // /api/video で取得できた詳細情報(チャンネルID・カテゴリ・タグ)を履歴に反映する
  function updateWatchedVideoMeta(data) {
    const id = safeTrim(data?.id);
    if (!id) return;
    const history = getWatchHistory();
    const entry = history.find(item => item.id === id);
    if (!entry) return;
    if (data.channelId) entry.channelId = safeTrim(data.channelId);
    if (data.channel) entry.channel = safeTrim(data.channel);
    if (data.categoryId) entry.categoryId = safeTrim(data.categoryId);
    if (Array.isArray(data.tags) && data.tags.length) {
      entry.tags = data.tags.map(safeTrim).filter(Boolean).slice(0, 15);
    }
    saveWatchHistory(history);
  }

  function compactRecommendationText(value) {
    return safeTrim(value)
      .replace(/[｜|【】「」『』（）()[\\]{}<>]/g, ' ')
      .replace(/\\s+/g, ' ')
      .slice(0, 90);
  }

  function addRecommendationQuery(queries, value) {
    const query = compactRecommendationText(value);
    if (query && !queries.includes(query)) queries.push(query);
  }

  const CATEGORY_KEYWORDS = {
    '1': 'アニメ 映画', '2': '車', '10': '音楽', '15': 'ペット', '17': 'スポーツ',
    '19': '旅行', '20': 'ゲーム実況', '22': 'vlog', '23': 'コメディ', '24': 'エンタメ',
    '25': 'ニュース', '26': 'ハウツー', '27': '解説', '28': '科学 テクノロジー'
  };
  const RECOMMEND_CHANNEL_COUNT = 4;      // 見たチャンネルのうち上位何件から取るか
  const RECOMMEND_PER_CHANNEL = 8;        // 1チャンネルあたりの最大件数
  const RECOMMEND_GENRE_QUERIES = 3;      // ジャンル関連の検索クエリ数
  const RECOMMEND_TOTAL = 32;

  // 視聴履歴から「よく見るチャンネル」を新しさで重み付けして抽出
  function rankWatchedChannels(history) {
    const map = new Map();
    history.forEach((item, index) => {
      const key = safeTrim(item.channelId) || safeTrim(item.channel);
      if (!key) return;
      const weight = 1 / (1 + index * 0.2);
      const entry = map.get(key) || { key: key, channelId: '', channel: '', score: 0 };
      entry.score += weight;
      if (item.channelId) entry.channelId = safeTrim(item.channelId);
      if (item.channel) entry.channel = safeTrim(item.channel);
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, RECOMMEND_CHANNEL_COUNT);
  }

  // 視聴履歴のタグ・カテゴリ・タイトルからジャンル検索クエリを作る
  function buildGenreQueries(history) {
    const recent = history.slice(0, 10);
    const tagScore = new Map();
    const catScore = new Map();
    recent.forEach((item, index) => {
      const weight = 1 / (1 + index * 0.2);
      (Array.isArray(item.tags) ? item.tags : []).slice(0, 8).forEach(tag => {
        const t = compactRecommendationText(tag);
        if (!t || t.length < 2) return;
        const key = t.toLowerCase();
        const cur = tagScore.get(key) || { text: t, score: 0 };
        cur.score += weight;
        tagScore.set(key, cur);
      });
      if (item.categoryId) catScore.set(item.categoryId, (catScore.get(item.categoryId) || 0) + weight);
    });

    const topTags = Array.from(tagScore.values()).sort((a, b) => b.score - a.score).map(t => t.text);
    const topCat = Array.from(catScore.entries()).sort((a, b) => b[1] - a[1])[0];
    const catWord = topCat ? (CATEGORY_KEYWORDS[topCat[0]] || '') : '';

    const queries = [];
    if (topTags[0] && topTags[1]) addRecommendationQuery(queries, topTags[0] + ' ' + topTags[1]);
    if (topTags[0]) addRecommendationQuery(queries, topTags[0]);
    if (topTags[2]) addRecommendationQuery(queries, topTags[2] + (catWord ? ' ' + catWord : ''));
    if (topTags[0] && catWord) addRecommendationQuery(queries, topTags[0] + ' ' + catWord);

    // タグが取れていない場合は最新動画のタイトルで代用
    if (queries.length < RECOMMEND_GENRE_QUERIES) {
      history.slice(0, 3).forEach(item => addRecommendationQuery(queries, item.title));
    }
    return queries.slice(0, RECOMMEND_GENRE_QUERIES);
  }

  function uniqueVideos(items, excludeId) {
    const seen = new Set();
    return (items || []).filter(item => {
      const id = safeTrim(item?.id);
      if (!id || id === excludeId || seen.has(id) || item?.kind === 'channel') return false;
      seen.add(id);
      return true;
    });
  }

  async function fetchJsonItems(url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return Array.isArray(data.items) ? data.items : [];
  }

  // 見たチャンネルの最新動画を取得（channelIdが無ければチャンネル名で検索して絞り込む）
  async function fetchChannelVideosForRecommendation(ch) {
    if (ch.channelId) {
      const items = await fetchJsonItems(
        '/api/channel-tab?id=' + encodeURIComponent(ch.channelId) + '&tab=videos&limit=20'
      );
      return items.filter(v => v && v.kind !== 'playlist' && v.kind !== 'post');
    }
    const items = await fetchJsonItems('/api/search?q=' + encodeURIComponent(ch.channel));
    return items.filter(v => safeTrim(v.channel) === ch.channel);
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // おすすめ = 見たチャンネルの動画(約75%) + 視聴ジャンルに関連する動画(約25%)
  async function fetchRecommendedVideos(options = {}) {
    const excludeId = safeTrim(options.excludeId);
    const history = getWatchHistory();

    const fetchDefault = async () => {
      const items = await fetchJsonItems('/api/search?q=' + encodeURIComponent(DEFAULT_RECOMMENDATION_QUERY));
      return uniqueVideos(items, excludeId);
    };
    if (options.forceDefault || !history.length) return fetchDefault();

    const watchedIds = new Set(history.map(h => h.id));
    const isFresh = v => v && v.id && v.id !== excludeId && !watchedIds.has(v.id);

    const channels = rankWatchedChannels(history);
    const genreQueries = buildGenreQueries(history);

    const [channelResults, genreResults] = await Promise.all([
      Promise.all(channels.map(ch => fetchChannelVideosForRecommendation(ch).catch(() => []))),
      Promise.all(genreQueries.map(q =>
        fetchJsonItems('/api/search?q=' + encodeURIComponent(q)).catch(() => [])
      )),
    ]);

    // チャンネルごとに新しい順のまま上位だけ取り、チャンネル間でラウンドロビン
    const channelQueues = channelResults.map(list => list.filter(isFresh).slice(0, RECOMMEND_PER_CHANNEL));
    const channelPool = [];
    for (let i = 0; i < RECOMMEND_PER_CHANNEL; i++) {
      channelQueues.forEach(q => { if (q[i]) channelPool.push(q[i]); });
    }
    const genrePool = shuffleArray(genreResults.flat().filter(isFresh));

    // 3:1 の割合で混ぜる（チャンネル 3 件ごとにジャンル関連 1 件）
    const merged = [];
    let ci = 0, gi = 0;
    while (merged.length < RECOMMEND_TOTAL && (ci < channelPool.length || gi < genrePool.length)) {
      for (let k = 0; k < 3 && ci < channelPool.length; k++) merged.push(channelPool[ci++]);
      if (gi < genrePool.length) merged.push(genrePool[gi++]);
    }

    const items = uniqueVideos(merged, excludeId);
    if (items.length) return items;
    return fetchDefault();
  }

  const YTIMG_FALLBACK_HOST = 'https://jikanwari.rec877.com';
  function thumbFallbackUrl(originalSrc) {
    const src = safeTrim(originalSrc);
    const marker = '://i.ytimg.com/vi/';
    const idx = src.indexOf(marker);
    if (idx === -1) return '';
    return YTIMG_FALLBACK_HOST + '/vi/' + src.slice(idx + marker.length);
  }
  // <img>のonerror属性から呼ぶ。一度だけ切り替え、無限ループを防ぐ。
  window.handleThumbError = function (imgEl) {
    if (!imgEl || imgEl.dataset.thumbFallbackApplied) return;
    const fallback = thumbFallbackUrl(imgEl.src);
    imgEl.dataset.thumbFallbackApplied = '1';
    if (fallback) {
      imgEl.src = fallback;
    } else {
      imgEl.onerror = null;
    }
  };

  function buildPreviewImage(video) {
    const thumb = safeTrim(video?.thumb);
    const base = thumb || (video?.id ? ('https://i.ytimg.com/vi/' + encodeURIComponent(video.id) + '/hqdefault.jpg') : '');
    return resolveThumb(base);
  }

  // カードのsrc=""に直接渡す用。APIが返した生のthumb URLに対してaltSrc強制を適用する。
  function resolveThumb(rawUrl) {
    const base = safeTrim(rawUrl);
    if (!base) return '';
    if (window.__FORCE_ALT_SRC__) {
      const forced = thumbFallbackUrl(base);
      if (forced) return forced;
    }
    return base;
  }

  function formatCompactNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return '';
    if (n >= 100000000) return (n / 100000000).toFixed(n >= 1000000000 ? 1 : 2).replace(/\\.?0+$/, '') + '億';
    if (n >= 10000) return (n / 10000).toFixed(n >= 100000 ? 1 : 2).replace(/\\.?0+$/, '') + '万';
    return n.toLocaleString('ja-JP');
  }

  function formatPublishedText(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const now = Date.now();
    const diffMs = Math.max(0, now - date.getTime());
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diffMs < hour) return Math.max(1, Math.floor(diffMs / minute)) + '分前';
    if (diffMs < day) return Math.floor(diffMs / hour) + '時間前';
    if (diffMs < 30 * day) return Math.floor(diffMs / day) + '日前';
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function setWatchLikes(likeCount) {
    const formatted = formatCompactNumber(likeCount);
    watchLikes.textContent = formatted ? '高評価 ' + formatted : '';
    watchLikeDot.style.display = formatted ? '' : 'none';
  }

  function setWatchDate(publishedAt) {
    const text = formatPublishedText(publishedAt);
    watchDate.textContent = text || '';
    watchDateDot.style.display = text ? '' : 'none';
  }

  function setWatchDescription(text) {
    const desc = safeTrim(text);
    watchDescription.textContent = desc || '概要欄は取得できませんでした';
  }

  function isLiveStatus(value) {
    const status = safeTrim(value).toLowerCase();
    return status === 'live' || status === 'is_live';
  }

  function isLiveVideo(video) {
    return Boolean(
      video?.isLive ||
      isLiveStatus(video?.liveStatus) ||
      isLiveStatus(video?.live_status) ||
      isLiveStatus(video?.liveBroadcastContent)
    );
  }

  function setLiveMode(isLive) {
    currentIsLive = Boolean(isLive);
    playerWrap.classList.toggle('live', currentIsLive);
    progressWrap.setAttribute('aria-disabled', currentIsLive ? 'true' : 'false');
    if (currentIsLive) {
      progressFill.style.width = '100%';
      progressBuffer.style.width = '100%';
      progressThumb.style.left = '100%';
      timeDisplay.textContent = 'LIVE';
      clearPreviewRequestState();
      previewWrap.style.display = 'none';
    }
  }

  function appendChatMessages(messages) {
    if (!messages.length) return;
    if (chatList.querySelector('.chat-empty')) chatList.innerHTML = '';

    const shouldStick = chatList.scrollTop + chatList.clientHeight >= chatList.scrollHeight - 48;
    for (const msg of messages) {
      const id = safeTrim(msg.id) || String(Date.now() + Math.random());
      if (seenChatMessageIds.has(id)) continue;
      seenChatMessageIds.add(id);

      const row = document.createElement('div');
      row.className = 'chat-msg';
      const avatar = document.createElement('img');
      avatar.className = 'chat-avatar';
      avatar.src = safeTrim(msg.authorPhotoUrl) || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      avatar.alt = '';
      avatar.loading = 'lazy';
      const body = document.createElement('div');
      body.className = 'chat-body';
      const author = document.createElement('span');
      author.className = 'chat-author' + (msg.isArtist ? ' artist' : (msg.isVerified ? ' verified' : ''));
      author.textContent = safeTrim(msg.author) || '匿名';
      const badges = Array.isArray(msg.badges) ? msg.badges : [];
      for (const badge of badges.slice(0, 2)) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'author-badge ' + (badge.type === 'artist' ? 'artist' : 'verified');
        badgeEl.title = safeTrim(badge.label) || (badge.type === 'artist' ? '公式アーティスト' : '確認済み');
        if (badge.iconUrl) {
          const badgeImg = document.createElement('img');
          badgeImg.src = badge.iconUrl;
          badgeImg.alt = '';
          badgeEl.appendChild(badgeImg);
        } else {
          badgeEl.textContent = badge.type === 'artist' ? '♪' : '✓';
        }
        author.appendChild(badgeEl);
      }
      const text = document.createElement('span');
      text.className = 'chat-text';
      text.textContent = safeTrim(msg.message);
      body.append(author, text);
      row.append(avatar, body);
      chatList.appendChild(row);
    }

    while (chatList.children.length > 220) {
      chatList.removeChild(chatList.firstElementChild);
    }
    if (shouldStick) chatList.scrollTop = chatList.scrollHeight;
  }

  function stopLiveChat() {
    liveChatRequestId += 1;
    if (liveChatTimer) {
      clearTimeout(liveChatTimer);
      liveChatTimer = null;
    }
    liveChatContinuation = '';
    seenChatMessageIds.clear();
    liveChat.classList.remove('active');
    chatStatus.textContent = '停止中';
    chatList.innerHTML = '<div class="chat-empty">ライブチャットはありません</div>';
  }

  async function pollLiveChat(videoId, requestId) {
    if (!currentIsLive || currentVideoId !== videoId || requestId !== liveChatRequestId) return;
    try {
      const url = '/api/live_chat?id=' + encodeURIComponent(videoId) +
        (liveChatContinuation ? '&continuation=' + encodeURIComponent(liveChatContinuation) : '');
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!currentIsLive || currentVideoId !== videoId || requestId !== liveChatRequestId) return;

      liveChatContinuation = data.continuation || liveChatContinuation;
      appendChatMessages(data.messages || []);
      chatStatus.textContent = liveChatContinuation ? '接続中' : '待機中';

      const delay = Math.max(1200, Math.min(Number(data.timeoutMs) || 2500, 8000));
      liveChatTimer = setTimeout(() => pollLiveChat(videoId, requestId), delay);
    } catch (e) {
      if (!currentIsLive || currentVideoId !== videoId || requestId !== liveChatRequestId) return;
      chatStatus.textContent = '再接続中';
      liveChatTimer = setTimeout(() => pollLiveChat(videoId, requestId), 5000);
    }
  }

  function startLiveChat(videoId) {
    stopLiveChat();
    liveChatRequestId += 1;
    liveChat.classList.add('active');
    chatStatus.textContent = '接続中...';
    chatList.innerHTML = '<div class="chat-empty">チャットを取得中...</div>';
    pollLiveChat(videoId, liveChatRequestId);
  }

  function setCommentsSortButtons() {
    commentsSortRelevance.classList.toggle('active', commentsOrder === 'relevance');
    commentsSortTime.classList.toggle('active', commentsOrder === 'time');
  }

  function resetComments(message) {
    commentsRequestId += 1;
    commentsNextPageToken = '';
    commentsLoading = false;
    replyState.clear();
    // currentVideoCommentCount はクリアしない（並び替え時も正しいコメント総数を維持するため）
    commentsTitle.textContent = currentVideoCommentCount != null
      ? 'コメント ' + formatCompactNumber(currentVideoCommentCount)
      : 'コメント';
    commentsMore.style.display = 'none';
    commentsMore.disabled = false;
    commentsList.innerHTML = '<div class="chat-empty">' + esc(message || 'コメントを取得中...') + '</div>';
    setCommentsSortButtons();
  }

  function renderCommentStats(comment) {
    const bits = [];
    const likes = formatCompactNumber(comment?.likeCount);
    if (likes) bits.push('いいね ' + likes);
    return bits.length ? '<div class="comment-stats">' + bits.map(esc).join('<span>•</span>') + '</div>' : '';
  }

  function renderAuthorBadges(comment) {
    const badges = [];
    const isOwner = Boolean(comment?.isChannelOwner) ||
      (currentVideoChannelId && safeTrim(comment?.authorChannelId) === currentVideoChannelId);
    if (isOwner) {
      badges.push('<span class="author-badge owner" title="チャンネル本人">✓</span>');
    }
    if (comment?.isVerified) {
      badges.push('<span class="author-badge verified" title="確認済み">✓</span>');
    }
    return badges.join('');
  }

  function renderCommentBlock(comment, isReply) {
    const avatar = safeTrim(comment?.authorProfileImageUrl);
    const isOwner = Boolean(comment?.isChannelOwner) ||
      (currentVideoChannelId && safeTrim(comment?.authorChannelId) === currentVideoChannelId);
    const isVerified = Boolean(comment?.isVerified);
    return '<div class="' + (isReply ? 'reply-item' : 'comment-main') + '">' +
      '<img class="comment-avatar" src="' + esc(avatar) + '" alt="" loading="lazy">' +
      '<div class="comment-body">' +
      '<div class="comment-meta">' +
      '<span class="comment-author' + (isOwner ? ' owner' : (isVerified ? ' verified' : '')) + '">' +
      esc(comment?.author || '匿名') + renderAuthorBadges(comment) + '</span>' +
      '<span class="comment-date">' + esc(comment?.publishedText || '') + '</span>' +
      '</div>' +
      '<div class="comment-text">' + esc(comment?.text || '') + '</div>' +
      renderCommentStats(comment) +
      '</div></div>';
  }

  // commentId -> { loadedIds: Set, pageToken: '', totalCount, loading }
  const replyState = new Map();

  function renderReplySection(comment) {
    const replies = Array.isArray(comment.replies) ? comment.replies : [];
    const commentId = safeTrim(comment?.id);
    const totalCount = Number(comment?.replyCount) || replies.length;
    if (!replies.length && !totalCount) return '';

    if (!commentId) {
      // idが取れない場合はトグルできないので常時表示にフォールバック
      return replies.length
        ? '<div class="comment-replies">' + replies.map(reply => renderCommentBlock(reply, true)).join('') + '</div>'
        : '';
    }

    if (!replyState.has(commentId)) {
      replyState.set(commentId, {
        loadedIds: new Set(replies.map(r => r.id).filter(Boolean)),
        pageToken: '',
        totalCount,
        loading: false,
      });
    }

    const label = totalCount ? ('返信を表示 (' + formatCompactNumber(totalCount) + ')') : '返信を表示';
    const repliesHtml = replies.map(reply => renderCommentBlock(reply, true)).join('');
    const hasMore = totalCount > replies.length;

    return (
      '<button type="button" class="reply-toggle" data-comment-id="' + esc(commentId) + '">' +
        '<span class="reply-toggle-icon">▾</span><span class="reply-toggle-label">' + esc(label) + '</span>' +
      '</button>' +
      '<div class="comment-replies" id="replies-' + esc(commentId) + '" style="display:none">' +
        repliesHtml +
        (hasMore
          ? '<button type="button" class="reply-more" data-comment-id="' + esc(commentId) + '">さらに返信を読み込む</button>'
          : '') +
      '</div>'
    );
  }

  function renderComments(comments, append) {
    if (!append) commentsList.innerHTML = '';

    if (!comments.length && !append) {
      commentsList.innerHTML = '<div class="chat-empty">コメントはありません</div>';
      return;
    }

    const html = comments.map(comment => {
      return '<article class="comment-item">' +
        renderCommentBlock(comment, false) +
        renderReplySection(comment) +
        '</article>';
    }).join('');

    if (append) commentsList.insertAdjacentHTML('beforeend', html);
    else commentsList.innerHTML = html;
  }

  // 返信の表示トグル・さらに読み込むボタンをイベント委任で処理
  commentsList.addEventListener('click', async (e) => {
    const toggleBtn = e.target.closest('.reply-toggle');
    if (toggleBtn) {
      const commentId = toggleBtn.dataset.commentId;
      const container = document.getElementById('replies-' + commentId);
      if (!container) return;
      const isOpen = container.style.display !== 'none';
      container.style.display = isOpen ? 'none' : '';
      toggleBtn.classList.toggle('open', !isOpen);
      return;
    }

    const moreBtn = e.target.closest('.reply-more');
    if (moreBtn) {
      const commentId = moreBtn.dataset.commentId;
      const state = replyState.get(commentId);
      if (!state || state.loading) return;
      state.loading = true;
      moreBtn.disabled = true;
      moreBtn.textContent = '読み込み中...';
      try {
        const url = '/api/comment_replies?parentId=' + encodeURIComponent(commentId) +
          (state.pageToken ? '&pageToken=' + encodeURIComponent(state.pageToken) : '');
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const container = document.getElementById('replies-' + commentId);
        const newItems = (data.items || []).filter(r => r.id && !state.loadedIds.has(r.id));
        newItems.forEach(r => state.loadedIds.add(r.id));
        const newHtml = newItems.map(r => renderCommentBlock(r, true)).join('');
        if (container && newHtml) moreBtn.insertAdjacentHTML('beforebegin', newHtml);

        state.pageToken = safeTrim(data.nextPageToken);
        if (!state.pageToken || state.loadedIds.size >= state.totalCount) {
          moreBtn.remove();
        } else {
          moreBtn.disabled = false;
          moreBtn.textContent = 'さらに返信を読み込む';
        }
      } catch (err) {
        moreBtn.disabled = false;
        moreBtn.textContent = 'さらに返信を読み込む';
      } finally {
        state.loading = false;
      }
    }
  });

  function isDisabledCommentsError(message) {
    const text = safeTrim(message).toLowerCase();
    return text.includes('disabled comments') || text.includes('comments disabled');
  }

  async function loadComments(options = {}) {
    const id = safeTrim(currentVideoId);
    if (!id || commentsLoading) return;
    if (currentIsLive && !options.append) {
      commentsRequestId += 1;
      commentsNextPageToken = '';
      commentsLoading = false;
      commentsTitle.textContent = 'コメント';
      commentsMore.style.display = 'none';
      commentsList.innerHTML = '<div class="chat-empty">LIVE配信中は通常コメントを表示できません。ライブチャットをご利用ください。</div>';
      return;
    }

    const append = Boolean(options.append);
    const requestId = append ? commentsRequestId : ++commentsRequestId;
    commentsLoading = true;
    commentsMore.disabled = true;
    commentsMore.textContent = '読み込み中...';
    if (!append) {
      commentsList.innerHTML = '<div class="chat-empty">コメントを取得中...</div>';
      commentsMore.style.display = 'none';
    }

    try {
      const url = '/api/comments?id=' + encodeURIComponent(id) +
        '&order=' + encodeURIComponent(commentsOrder) +
        (append && commentsNextPageToken ? '&pageToken=' + encodeURIComponent(commentsNextPageToken) : '');
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (requestId !== commentsRequestId || currentVideoId !== id) return;

      commentsTitle.textContent = currentVideoCommentCount != null
        ? 'コメント ' + formatCompactNumber(currentVideoCommentCount)
        : (data.totalResults != null ? 'コメント ' + formatCompactNumber(data.totalResults) : 'コメント');
      commentsNextPageToken = safeTrim(data.nextPageToken);
      renderComments(data.items || [], append);
      commentsMore.style.display = commentsNextPageToken ? '' : 'none';
      commentsMore.textContent = 'さらに読み込む';
      commentsMore.disabled = false;
    } catch (e) {
      if (requestId !== commentsRequestId || currentVideoId !== id) return;
      if (!append) {
        const message = currentIsLive || isDisabledCommentsError(e.message)
          ? 'LIVE配信中は通常コメントを表示できません。ライブチャットをご利用ください。'
          : (e.message || 'コメントの取得に失敗しました');
        commentsList.innerHTML = '<div class="chat-empty">' + esc(message) + '</div>';
      }
      commentsMore.textContent = 'さらに読み込む';
      commentsMore.disabled = false;
    } finally {
      if (requestId === commentsRequestId) commentsLoading = false;
    }
  }

  async function loadVideoDetails(video) {
    const id = safeTrim(video?.id);
    if (!id) return;
    const requestVideoId = id;

    setWatchLikes(video?.likeCount);
    setWatchDate(video?.publishedAt);
    setWatchDescription(video?.description);

    try {
      const res = await fetch('/api/video?id=' + encodeURIComponent(id));
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (currentVideoId !== requestVideoId) return;

      updateWatchedVideoMeta(data);
      if (data.title) watchTitle.textContent = data.title;
      if (data.channel) watchChannel.textContent = data.channel;
      if (data.channelId) {
        currentVideoChannelId = safeTrim(data.channelId);
        watchChannel.dataset.channelId = currentVideoChannelId;
      }
      setWatchLikes(data.likeCount);
      setWatchDate(data.publishedAt);
      setWatchDescription(data.description);
      if (data.commentCount != null) {
        currentVideoCommentCount = data.commentCount;
        commentsTitle.textContent = 'コメント ' + formatCompactNumber(currentVideoCommentCount);
      }
      // duration が取れたら knownDuration を更新（ストリームより先に来る場合もある）
      if (typeof data.duration === 'number' && data.duration > 0 && !currentIsLive) {
        knownDuration = data.duration;
      }
      if (isLiveVideo(data) && !currentIsLive) {
        setLiveMode(true);
        startLiveChat(id);
      }
    } catch (_) {
      if (currentVideoId !== requestVideoId) return;
      setWatchLikes(video?.likeCount);
      setWatchDate(video?.publishedAt);
      setWatchDescription(video?.description);
    }
  }

  function isGeneratedPreviewSrc(src) {
    return String(src || '').indexOf('/api/preview?') === 0;
  }

  function setVideoPoster(src) {
    const nextSrc = safeTrim(src);
    if (!nextSrc) {
      videoPlayer.removeAttribute('poster');
      return;
    }
    if (videoPlayer.getAttribute('poster') !== nextSrc) {
      videoPlayer.poster = nextSrc;
    }
  }

  function setPreviewImage(src) {
    const nextSrc = safeTrim(src);
    const prevSrc = currentPreviewImage;
    currentPreviewImage = nextSrc;

    if (!nextSrc) {
      previewImg.removeAttribute('src');
      lastResolvedPreviewImage = '';
      setVideoPoster('');
      return;
    }

    const currentSrc = previewImg.getAttribute('src') || '';
    if (!currentSrc || currentSrc === prevSrc || !isGeneratedPreviewSrc(currentSrc)) {
      previewImg.src = nextSrc;
    }
    setVideoPoster(nextSrc);
  }

  function clearPreviewRequestState() {
    previewRequestKey = '';
    previewPendingKey = '';
    pendingPreviewSecond = null;
    previewWrap.classList.remove('loading');
    if (previewRequestTimer) {
      clearTimeout(previewRequestTimer);
      previewRequestTimer = null;
    }
  }

  function positionPreviewAtPct(pct) {
    const rect = progressWrap.getBoundingClientRect();
    const previewWidth = previewImg.getBoundingClientRect().width || 160;
    const halfWidth = previewWidth / 2;
    const minX = halfWidth;
    const maxX = Math.max(halfWidth, rect.width - halfWidth);
    const rawX = pct * rect.width;
    const clampedX = Math.max(minX, Math.min(maxX, rawX));
    previewWrap.style.left = clampedX + 'px';
  }

  function requestGeneratedPreview(second) {
    if (!currentVideoId) return;

    const roundedSecond = Math.max(0, Math.floor(second));
    const nextKey = currentVideoId + ':' + roundedSecond;
    if (previewRequestKey === nextKey) return;

    previewRequestKey = nextKey;
    previewPendingKey = nextKey;
    previewWrap.classList.add('loading');

    if (currentPreviewImage && previewImg.getAttribute('src') !== currentPreviewImage) {
      previewImg.src = currentPreviewImage;
    }

    const nextSrc = '/api/preview?id=' + encodeURIComponent(currentVideoId) +
      '&t=' + roundedSecond;
    const loader = new Image();
    loader.decoding = 'async';
    loader.onload = () => {
      if (previewPendingKey !== nextKey) return;
      previewPendingKey = '';
      previewWrap.classList.remove('loading');
      previewImg.src = nextSrc;
      lastResolvedPreviewImage = nextSrc;
    };
    loader.onerror = () => {
      if (previewPendingKey !== nextKey) return;
      previewPendingKey = '';
      previewWrap.classList.remove('loading');
      if (lastResolvedPreviewImage) {
        previewImg.src = lastResolvedPreviewImage;
      } else if (currentPreviewImage) {
        previewImg.src = currentPreviewImage;
      }
    };
    loader.src = nextSrc;
  }

  function queueGeneratedPreview(second) {
    pendingPreviewSecond = second;
    if (previewRequestTimer) return;

    previewRequestTimer = setTimeout(() => {
      previewRequestTimer = null;
      if (pendingPreviewSecond == null) return;
      requestGeneratedPreview(pendingPreviewSecond);
      pendingPreviewSecond = null;
    }, 70);
  }

  // VODは event playlist の性質上 videoPlayer.duration が「今読み込めている長さ」しか
  // 反映しないため、yt-dlp から取得済みの本当の長さ(knownDuration)を最優先にする。
  // ライブの場合のみ videoPlayer / hls.js 側の値(伸び続ける長さ)を使う。
  function getDuration() {
    if (!currentIsLive && knownDuration > 0.5) return knownDuration;
    const d = videoPlayer.duration;
    if (isFinite(d) && d > 0.5) return d;
    if (hlsInstance && hlsInstance.media) {
      const hd = hlsInstance.media.duration;
      if (isFinite(hd) && hd > 0.5) return hd;
    }
    return knownDuration;
  }

  // バッファ済みの最大終端（秒）
  function getBufferedEnd() {
    let end = 0;
    if (videoPlayer.buffered && videoPlayer.buffered.length) {
      for (let i = 0; i < videoPlayer.buffered.length; i++) {
        if (videoPlayer.buffered.end(i) > end) end = videoPlayer.buffered.end(i);
      }
    }
    return end + currentStreamOffset;
  }

  // ─── rAF ループ（再生中のみ走る） ───
  function startRaf() {
    if (rafId) return;
    function loop() {
      updateProgress();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }
  function stopRaf() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // ─── Progress UI 更新 ───
  function updateProgress() {
    if (currentIsLive) {
      progressFill.style.width = '100%';
      progressBuffer.style.width = '100%';
      progressThumb.style.left = '100%';
      timeDisplay.textContent = 'LIVE';
      return;
    }

    const dur = getDuration();
    if (!dur) return;

    const cur    = videoPlayer.currentTime + currentStreamOffset;
    const playPct = Math.min(1, cur / dur) * 100;
    progressFill.style.width  = playPct + '%';
    progressThumb.style.left  = playPct + '%';

    const bufEnd = getBufferedEnd();
    const bufPct = Math.min(1, bufEnd / dur) * 100;
    progressBuffer.style.width = bufPct + '%';

    timeDisplay.textContent = fmtTime(cur) + ' / ' + fmtTime(dur);
  }

  // ─── Play/Pause 同期 ───
  function syncPlayState() {
    const paused = videoPlayer.paused;
    iconPlay.style.display  = paused ? '' : 'none';
    iconPause.style.display = paused ? 'none' : '';
    playerWrap.classList.toggle('paused', paused);
    if (paused) stopRaf(); else startRaf();
  }

  // ─── PiP (Picture-in-Picture) ───
  let pipAutoTriggered = false; // visibilitychange による自動起動フラグ

  function isPipSupported() {
    return !!(document.pictureInPictureEnabled && videoPlayer.requestPictureInPicture);
  }

  function syncPipIcon() {
    const inPip = !!document.pictureInPictureElement;
    iconPipOff.style.display = inPip ? 'none' : '';
    iconPipOn.style.display  = inPip ? ''     : 'none';
  }

  async function enterPip() {
    if (!isPipSupported()) return;
    // 既にPiP中なら何もしない
    if (document.pictureInPictureElement) return;
    // 動画がまだ読み込まれていない場合は無視
    if (!currentVideoId || videoPlayer.readyState < 1) return;
    try {
      await videoPlayer.requestPictureInPicture();
    } catch (_) { /* ユーザー操作なしでは一部ブラウザで拒否される */ }
  }

  async function exitPip() {
    if (!document.pictureInPictureElement) return;
    try {
      await document.exitPictureInPicture();
    } catch (_) {}
  }

  async function togglePip() {
    if (!isPipSupported()) return;
    if (document.pictureInPictureElement) {
      await exitPip();
    } else {
      await enterPip();
    }
  }

  // ボタンクリック
  if (pipBtn) {
    pipBtn.addEventListener('click', () => {
      togglePip();
    });
  }

  // PiP状態変化でアイコン同期
  videoPlayer.addEventListener('enterpictureinpicture', () => {
    syncPipIcon();
  });
  videoPlayer.addEventListener('leavepictureinpicture', () => {
    syncPipIcon();
    pipAutoTriggered = false;
  });

  // PiPボタン表示/非表示の初期化
  function updatePipBtnVisibility() {
    if (pipBtn) {
      pipBtn.style.display = isPipSupported() ? '' : 'none';
    }
  }
  updatePipBtnVisibility();

  // ─── 自動PiP: タブ切り替え・スマホのホーム画面移動 ───
  // visibilitychange: PC でタブ切り替え / スマホでホーム/別アプリに移動
  document.addEventListener('visibilitychange', async () => {
    if (!isPipSupported()) return;
    if (!currentVideoId) return;

    if (document.hidden) {
      // 動画が再生中で、PiP未使用なら自動でPiPに入る
      if (!videoPlayer.paused && !document.pictureInPictureElement && videoPlayer.readyState >= 1) {
        pipAutoTriggered = true;
        await enterPip();
      }
    } else {
      // タブに戻ったとき: 自動PiPで入った場合のみ自動終了
      if (pipAutoTriggered && document.pictureInPictureElement) {
        pipAutoTriggered = false;
        await exitPip();
      }
    }
  });

    // ─── Fullscreen ───
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const iconFsEnter   = document.getElementById('icon-fs-enter');
  const iconFsExit    = document.getElementById('icon-fs-exit');
    // ─── Fullscreen 中のコントロール自動非表示 ───
  let fsControlsTimer = null;
  let fsCursorTimer   = null;

  function showFsControls() {
    if (!isFullscreen()) return;
    playerWrap.classList.add('fs-controls-visible');
    document.body.style.cursor = '';
    clearTimeout(fsControlsTimer);
    clearTimeout(fsCursorTimer);
    // 再生中なら3秒で隠す。一時停止中は出したまま。
    if (!videoPlayer.paused) {
      fsControlsTimer = setTimeout(hideFsControls, 3000);
    }
  }

  function hideFsControls() {
    if (!isFullscreen()) {
      playerWrap.classList.remove('fs-controls-visible');
      return;
    }
    // ポーズ中・メニュー/シーク操作中は隠さない
    if (videoPlayer.paused) return;
    if (progressWrap.classList.contains('dragging')) return;
    if (document.querySelector('#player-wrap .player-menu:not([hidden])')) return;
    if (qualityMenu.style.display !== 'none') return;
    playerWrap.classList.remove('fs-controls-visible');
    document.body.style.cursor = 'none';
    clearTimeout(fsControlsTimer);
    // カーソルも2秒後に隠す（コントロールと同期でよいならこの行は不要）
    fsCursorTimer = setTimeout(() => {
      if (isFullscreen() && !videoPlayer.paused) document.body.style.cursor = 'none';
    }, 2000);
  }

  function onFsMouseMove() {
    if (!isFullscreen()) return;
    showFsControls();
  }

  function onFsMouseLeave() {
    if (!isFullscreen()) return;
    hideFsControls();
  }

  function exitFsControlsState() {
    clearTimeout(fsControlsTimer);
    clearTimeout(fsCursorTimer);
    playerWrap.classList.remove('fs-controls-visible');
    document.body.style.cursor = '';
  }

  document.addEventListener('fullscreenchange', () => {
    syncFullscreenIcon();
    if (isFullscreen()) {
      // 入った直後は少し見せてから隠す
      showFsControls();
    } else {
      exitFsControlsState();
    }
  });
  document.addEventListener('webkitfullscreenchange', () => {
    syncFullscreenIcon();
    if (isFullscreen()) showFsControls();
    else exitFsControlsState();
  });

  playerWrap.addEventListener('mousemove', onFsMouseMove);
  playerWrap.addEventListener('mouseleave', onFsMouseLeave);
  // タッチ端末: 画面タップでトグル
  playerWrap.addEventListener('touchstart', (e) => {
    if (!isFullscreen()) return;
    // コントロール上のタップは無視
    if (e.target.closest('.custom-controls')) return;
    if (playerWrap.classList.contains('fs-controls-visible')) hideFsControls();
    else showFsControls();
  }, { passive: true });

  // 再生/一時停止で挙動を変える
  videoPlayer.addEventListener('play', () => { if (isFullscreen()) showFsControls(); });
  videoPlayer.addEventListener('pause', () => {
    if (!isFullscreen()) return;
    clearTimeout(fsControlsTimer);
    playerWrap.classList.add('fs-controls-visible');
    document.body.style.cursor = '';
  });

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function syncFullscreenIcon() {
    const on = isFullscreen();
    iconFsEnter.style.display = on ? 'none' : '';
    iconFsExit.style.display  = on ? ''     : 'none';
  }

  async function toggleFullscreen() {
    if (!currentVideoId) return;
    try {
      if (isFullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        // iOS iPhone は要素の requestFullscreen 非対応。video 要素の webkitEnterFullscreen を使う
        if (playerWrap.requestFullscreen) {
          await playerWrap.requestFullscreen();
        } else if (playerWrap.webkitRequestFullscreen) {
          playerWrap.webkitRequestFullscreen();
        } else if (videoPlayer.webkitEnterFullscreen) {
          videoPlayer.webkitEnterFullscreen();
        }
      }
    } catch (_) {}
  }

  fullscreenBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', syncFullscreenIcon);
  document.addEventListener('webkitfullscreenchange', syncFullscreenIcon);
  syncFullscreenIcon();

  // ─── 再生ボタン ───
  playBtn.addEventListener('click', () => {
    if (videoPlayer.paused) videoPlayer.play().catch(() => {});
    else videoPlayer.pause();

    const r = document.createElement('div');
    r.className = 'play-ripple';
    r.style.left = '50%';
    r.style.top  = '50%';
    playerWrap.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });

  videoPlayer.addEventListener('play',           () => { syncPlayState(); sendStreamHeartbeat(currentVideoId); });
  videoPlayer.addEventListener('pause',          () => { syncPlayState(); sendStreamHeartbeat(currentVideoId); });
  videoPlayer.addEventListener('ended',          () => { syncPlayState(); exitPip(); });
  videoPlayer.addEventListener('loadedmetadata', updateProgress);
  videoPlayer.addEventListener('loadeddata',     () => setVideoPoster(''));
  videoPlayer.addEventListener('playing',        () => setVideoPoster(''));
  videoPlayer.addEventListener('seeked',         () => setVideoPoster(''));

  // ─── Seek ───
  function getPct(clientX) {
    const rect = progressWrap.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function seekToPct(pct) {
    if (currentIsLive) return;
    const dur = getDuration();
    if (!dur) return;

    const target = pct * dur;
    if (target < currentStreamOffset || target > getBufferedEnd()) {
      const requestId = playVideoRequestId + 1;
      refreshPlayback(target, videoPlayer.paused, false).catch(() => { if (requestId === playVideoRequestId) showHlsRetryFailedUI(); });
      return;
    }
    videoPlayer.currentTime = target - currentStreamOffset;

    const safePct = Math.min(1, target / dur);
    progressFill.style.width  = (safePct * 100) + '%';
    progressThumb.style.left  = (safePct * 100) + '%';
    timeDisplay.textContent   = fmtTime(target) + ' / ' + fmtTime(dur);
  }

  // Mouse
  progressWrap.addEventListener('mousedown', e => {
    if (currentIsLive) return;
    dragging = true;
    progressWrap.classList.add('dragging');
    seekToPct(getPct(e.clientX));
  });
  document.addEventListener('mousemove', e => {
    if (dragging) seekToPct(getPct(e.clientX));
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    progressWrap.classList.remove('dragging');
  });

  // ─── Preview Logic (NEW) ───
  progressWrap.addEventListener('mousemove', e => {
    if (currentIsLive) return;
    const dur = getDuration();
    if (!dur) return;

    const rect = progressWrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSec = pct * dur;

    previewWrap.style.display = 'flex';
    positionPreviewAtPct(pct);
    previewTime.textContent = fmtTime(targetSec);
    queueGeneratedPreview(targetSec);
  });

  progressWrap.addEventListener('mouseleave', () => {
    clearPreviewRequestState();
    previewWrap.style.display = 'none';
  });

  // Touch
  progressWrap.addEventListener('touchstart', e => {
    if (currentIsLive) return;
    dragging = true;
    progressWrap.classList.add('dragging');
    seekToPct(getPct(e.touches[0].clientX));
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (dragging) seekToPct(getPct(e.touches[0].clientX));
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    progressWrap.classList.remove('dragging');
    clearPreviewRequestState();
    previewWrap.style.display = 'none';
  });

  // ─── Player リセット ───
  function resetPlayer() {
    stopRaf();
    exitPip();
    clearPreviewRequestState();
    progressFill.style.width   = '0%';
    progressBuffer.style.width = '0%';
    progressThumb.style.left   = '0%';
    timeDisplay.textContent    = '0:00 / 0:00';
    previewWrap.style.display  = 'none';
    knownDuration = 0;
    setLiveMode(false);
    syncPlayState();
    closeQualityMenu();
    updateQualityUi('auto', false);
  }

  // ─── Views ───
  function setHeaderHomeMode(isHome) {
    if (isMobileLayout()) {
      // Mobile home: show hamburger, hide logo
      // Mobile non-home: hide hamburger, show logo (acts as menu trigger)
      if (hamburgerBtn) hamburgerBtn.style.display = isHome ? '' : 'none';
      if (headerLogo) headerLogo.style.display = isHome ? 'none' : '';
    } else {
      // Desktop: always hide hamburger, always show logo
      if (hamburgerBtn) hamburgerBtn.style.display = 'none';
      if (headerLogo) headerLogo.style.display = isHome ? 'none' : '';
    }
    if (headerSearchWrap) headerSearchWrap.classList.toggle('is-hidden', isHome);
  }

  function updateResultsMoreButton() {
    if (!resultsMore) return;
    resultsMore.style.display = searchNextPageToken ? 'block' : 'none';
    resultsMore.disabled = searchLoadingMore;
    resultsMore.textContent = searchLoadingMore ? '読み込み中...' : 'さらに読み込む';
  }

  function leaveWatchPage() {
    closePlayerMenus();
    qualityMenu.style.display = 'none';
    if (currentVideoId && !videoPlayer.ended) {
      watchSection.classList.add('mini-player-host');
    } else if (currentVideoId) {
      stopVideo();
    }
  }
  function restoreMiniPlayer() {
    if (!currentVideoId) return;
    watchSection.classList.remove('mini-player-host');
    hero.style.display = 'none';
    header.style.display = '';
    setHeaderHomeMode(false);
    resultsSection.classList.remove('active');
    channelSection.classList.remove('active');
    watchSection.classList.add('active');
    playerWrap.scrollIntoView({block:'start', behavior:'smooth'});
  }
  document.getElementById('mini-player-return').addEventListener('click', restoreMiniPlayer);
  document.getElementById('mini-player-close').addEventListener('click', stopVideo);

  function showHome() {
    hero.style.display = '';
    header.style.display = '';
    setHeaderHomeMode(true);
    resultsSection.classList.remove('active');
    leaveWatchPage();
    watchSection.classList.remove('active');
    channelSection.classList.remove('active');
    searchNextPageToken = '';
    updateResultsMoreButton();
    heroSearch.value = '';
    loadHomeRecommendations();
  }

  function showResults(query, items) {
    hero.style.display = 'none';
    header.style.display = '';
    setHeaderHomeMode(false);
    leaveWatchPage();
    watchSection.classList.remove('active');
    channelSection.classList.remove('active');
    resultsSection.classList.add('active');
    headerSearch.value = query;
    resultsTitle.textContent = '「' + query + '」の検索結果';
    resultsCount.textContent = items.length + ' 件';
    renderGrid(items);
    updateResultsMoreButton();
  }

  const preparedVideoIds = new Map();
  let prepareBusy = false;
  function bindPlaybackPrepare(element) {
    let timer;
    const prepare = async () => {
      const id = element.dataset.id;
      if (prepareBusy || ['channel', 'playlist', 'post'].includes(element.dataset.kind) || !/^[A-Za-z0-9_-]{11}$/.test(id || '') ||
          navigator.connection?.saveData || Date.now() - (preparedVideoIds.get(id) || 0) < 240000) return;
      prepareBusy = true;
      try {
        const res = await fetch('/api/stream/prepare?id=' + encodeURIComponent(id));
        if (res.ok) {
          if (preparedVideoIds.size >= 24) preparedVideoIds.delete(preparedVideoIds.keys().next().value);
          preparedVideoIds.set(id, Date.now());
        }
      } catch (_) {} finally { prepareBusy = false; }
    };
    element.addEventListener('pointerenter', () => { timer = setTimeout(prepare, 250); });
    element.addEventListener('pointerleave', () => clearTimeout(timer));
    element.addEventListener('focusin', prepare);
    element.addEventListener('pointerdown', prepare, { passive: true });
  }

  function showWatch(video) {
    watchSection.classList.remove('mini-player-host');
    closePlayerMenus();
    hero.style.display = 'none';
    header.style.display = '';
    setHeaderHomeMode(false);
    resultsSection.classList.remove('active');
    channelSection.classList.remove('active');
    updateResultsMoreButton();
    watchSection.classList.add('active');
    playVideo(video);
  }

  function getInitialVideoId() {
    const params = new URLSearchParams(window.location.search);
    const id = safeTrim(params.get('v') || params.get('id'));
    if (id && YOUTUBE_VIDEO_ID_RE.test(id)) return id;

    const match = window.location.pathname.match(/^[/]watch[/]?$/);

    if (!match) return '';

    const watchId = safeTrim(params.get('v'));
    return YOUTUBE_VIDEO_ID_RE.test(watchId) ? watchId : '';
  }

  function cleanInitialWatchUrl() {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', new URL(shareBaseUrl).pathname.replace(/[/]+$/, '') + '/');
    }
  }

  async function openInitialVideo(videoId) {
    cleanInitialWatchUrl();
    try {
      const res = await fetch('/api/video?id=' + encodeURIComponent(videoId));
      const video = await res.json();
      if (!res.ok || video.error) throw new Error(video.error || '動画情報の取得に失敗しました');
      showWatch(video);
    } catch (e) {
      showHome();
      resultsGrid.innerHTML = '<div class="error-msg"><div class="err-icon">⚠️</div><p>' + esc(e.message || '動画を開けませんでした') + '</p></div>';
    }
  }

  // ─── Search ───
  async function doSearch(query) {
    const normalizedQuery = safeTrim(query);
    if (!normalizedQuery) return;
    recommendationsRequestId += 1;
    searchQuery = normalizedQuery;
    updateHeaderLogoForSearch();

    hero.style.display = 'none';
    header.style.display = '';
    setHeaderHomeMode(false);
    resultsSection.classList.add('active');
    leaveWatchPage();
    watchSection.classList.remove('active');
    channelSection.classList.remove('active');
    headerSearch.value = normalizedQuery;
    resultsTitle.textContent = '「' + normalizedQuery + '」を検索中...';
    resultsCount.textContent = '';
    searchNextPageToken = '';
    updateResultsMoreButton();
    renderSkeletons();

    try {
      const channelPromise = fetch('/api/search?q=' + encodeURIComponent(normalizedQuery) + '&type=channel&limit=3')
        .then(r => r.json())
        .then(d => (d && !d.error && Array.isArray(d.items)) ? d.items.filter(c => c && c.id && c.kind === 'channel') : [])
        .catch(() => []);
      const res  = await fetch('/api/search?q=' + encodeURIComponent(normalizedQuery));
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const channelItems = await channelPromise;
      lastResults = channelItems.concat((data.items || []).filter(v => v && v.kind !== 'channel'));
      searchNextPageToken = safeTrim(data.nextPageToken);
      showResults(normalizedQuery, lastResults);
    } catch (e) {
      resultsGrid.innerHTML = '<div class="error-msg"><div class="err-icon">⚠️</div><p>' + (e.message || '検索に失敗しました') + '</p>' + discordBtnHtml() + '</div>';
      resultsTitle.textContent = 'エラー';
      searchNextPageToken = '';
      updateResultsMoreButton();
    }
  }

  async function loadMoreSearchResults() {
    if (!searchQuery || !searchNextPageToken || searchLoadingMore) return;
    searchLoadingMore = true;
    updateResultsMoreButton();

    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(searchQuery) + '&pageToken=' + encodeURIComponent(searchNextPageToken));
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const existingIds = new Set(lastResults.map(item => item.id));
      const newItems = (data.items || []).filter(item => item && item.id && !existingIds.has(item.id));
      lastResults = lastResults.concat(newItems);
      searchNextPageToken = safeTrim(data.nextPageToken);
      showResults(searchQuery, lastResults);
    } catch (e) {
      resultsMore.textContent = '読み込みに失敗しました';
      setTimeout(updateResultsMoreButton, 1400);
    } finally {
      searchLoadingMore = false;
      updateResultsMoreButton();
    }
  }

  function renderSkeletons() {
    let html = '';
    for (let i = 0; i < 8; i++) {
      html += '<div class="skel-card" style="animation-delay:' + (i * 0.05) + 's">' +
        '<div class="skeleton skel-thumb"></div>' +
        '<div class="skel-body">' +
        '<div class="skeleton skel-line" style="width:95%"></div>' +
        '<div class="skeleton skel-line" style="width:75%"></div>' +
        '<div class="skeleton skel-line short"></div>' +
        '</div></div>';
    }
    resultsGrid.innerHTML = html;
  }

  function renderChannelCardHtml(v, i) {
    const subs = formatCompactNumber(v.subscriberCount);
    const initial = esc((safeTrim(v.title) || '?').charAt(0).toUpperCase());
    const avatar = safeTrim(v.thumb)
      ? '<img class="channel-card-avatar" src="' + esc(v.thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
      : '<div class="channel-avatar-placeholder" style="width:45%;height:auto;aspect-ratio:1/1;font-size:28px">' + initial + '</div>';
    return '<div class="card channel-card" style="animation-delay:' + (i * 0.04) + 's"' +
      ' data-kind="channel" data-id="' + esc(v.id) + '" data-title="' + esc(v.title) + '">' +
      '<div class="card-thumb-wrap">' + avatar + '</div>' +
      '<div class="card-body">' +
      '<div class="card-title">' + esc(v.title) + '</div>' +
      '<div class="card-meta"><span class="channel-card-badge">チャンネル</span>' +
      (subs ? '<span>登録者 ' + esc(subs) + '</span>' : '') + '</div>' +
      '</div></div>';
  }

  function renderGrid(items) {
    if (!items.length) {
      resultsGrid.innerHTML = '<div class="error-msg"><div class="err-icon">🔍</div><p>結果が見つかりませんでした</p></div>';
      return;
    }
    resultsGrid.innerHTML = items.map((v, i) => {
      if (v.kind === 'channel') return renderChannelCardHtml(v, i);
      const durSec = Number(v.duration) || 0;
      const durBadge = !isLiveVideo(v) && durSec > 0
        ? '<span class="card-duration-badge">' + (v.isMusic || String(v.categoryId) === '10'
          ? '<span role="img" aria-label="音楽" title="音楽">♫</span>' : '') + fmtDurationBadge(durSec) + '</span>' : '';
      return '<div class="card" style="animation-delay:' + (i * 0.04) + 's"' +
        ' data-id="' + esc(v.id) + '" data-title="' + esc(v.title) + '"' +
        ' data-channel="' + esc(v.channel) + '" data-thumb="' + esc(v.thumb) + '"' +
        ' data-channel-id="' + esc(v.channelId || '') + '"' +
        ' data-description="' + esc(v.description) + '"' +
        ' data-duration="' + durSec + '"' +
        ' data-live-status="' + esc(v.liveStatus || '') + '" data-is-live="' + (isLiveVideo(v) ? '1' : '') + '">' +
        '<div class="card-thumb-wrap"><img class="card-thumb" src="' + esc(resolveThumb(v.thumb)) + '" alt="" loading="lazy" onerror="handleThumbError(this)">' +
        (isLiveVideo(v) ? '<span class="card-live-badge">LIVE</span>' : '') +
        durBadge + '</div>' +
        '<div class="card-body">' +
        '<div class="card-title">' + esc(v.title) + '</div>' +
        '<div class="card-meta"><span class="card-channel">' + esc(v.channel) + '</span>' +
        (isLiveVideo(v) ? '<span class="live-badge active"><span class="live-dot"></span>LIVE</span>' : '') + '</div>' +
        '</div></div>';
    }).join('');

    resultsGrid.querySelectorAll('.card').forEach(card => {
      bindPlaybackPrepare(card);
      card.addEventListener('click', () => card.dataset.kind === 'channel' ? showChannel(card.dataset.id, card.dataset.title) : showWatch({
        id: card.dataset.id, title: card.dataset.title,
        channel: card.dataset.channel, thumb: card.dataset.thumb,
        channelId: card.dataset.channelId,
        description: card.dataset.description,
        duration: Number(card.dataset.duration) || 0,
        liveStatus: card.dataset.liveStatus,
        isLive: card.dataset.isLive === '1',
      }));
    });
  }

  function renderRelatedItems(items) {
    items = (items || []).filter(v => v && v.kind !== 'channel');
    if (!items.length) {
      relatedList.innerHTML = '<div class="related-channel">おすすめを取得できませんでした</div>';
      return;
    }

    relatedList.innerHTML = items.slice(0, 8).map(v =>
      '<div class="related-item"' +
      ' data-id="' + esc(v.id) + '" data-title="' + esc(v.title) + '"' +
      ' data-channel="' + esc(v.channel) + '" data-thumb="' + esc(v.thumb) + '"' +
      ' data-channel-id="' + esc(v.channelId || '') + '"' +
      ' data-description="' + esc(v.description) + '"' +
      ' data-live-status="' + esc(v.liveStatus || '') + '" data-is-live="' + (isLiveVideo(v) ? '1' : '') + '">' +
      '<img class="related-thumb" src="' + esc(resolveThumb(v.thumb)) + '" loading="lazy" onerror="handleThumbError(this)">' +
      '<div class="related-info">' +
      '<div class="related-title">' + esc(v.title) + '</div>' +
      '<div class="related-channel">' + esc(v.channel) + (isLiveVideo(v) ? ' ・ LIVE' : '') + '</div>' +
      '</div></div>'
    ).join('');

    relatedList.querySelectorAll('.related-item').forEach(item => {
      bindPlaybackPrepare(item);
      item.addEventListener('click', () => showWatch({
        id: item.dataset.id, title: item.dataset.title,
        channel: item.dataset.channel, thumb: item.dataset.thumb,
        channelId: item.dataset.channelId,
        description: item.dataset.description,
        liveStatus: item.dataset.liveStatus,
        isLive: item.dataset.isLive === '1',
      }));
    });
  }

  function renderRelatedSkeletons() {
    relatedList.innerHTML = Array.from({ length: 6 }, (_, i) =>
      '<div class="related-item" style="animation-delay:' + (i * 0.04) + 's">' +
      '<div class="skeleton related-thumb"></div>' +
      '<div class="related-info">' +
      '<div class="skeleton skel-line" style="width:95%"></div>' +
      '<div class="skeleton skel-line short"></div>' +
      '</div></div>'
    ).join('');
  }

  async function loadRelatedRecommendations(video, forceDefault) {
    const requestId = ++recommendationsRequestId;
    renderRelatedSkeletons();

    try {
      const items = await fetchRecommendedVideos({
        excludeId: video?.id,
        forceDefault,
      });
      if (requestId !== recommendationsRequestId || currentVideoId !== video?.id) return;

      const searchRelated = lastResults.filter(v => v.id !== video?.id);
      renderRelatedItems(uniqueVideos(items.concat(searchRelated), video?.id));
    } catch (_) {
      if (requestId !== recommendationsRequestId || currentVideoId !== video?.id) return;
      renderRelatedItems(lastResults.filter(v => v.id !== video?.id));
    }
  }

  async function loadHomeRecommendations() {
    const requestId = ++recommendationsRequestId;
    const hasHistory = getWatchHistory().length > 0;

    resultsSection.classList.add('active');
    resultsTitle.textContent = hasHistory ? 'おすすめ' : 'おすすめ（default）';
    resultsCount.textContent = '';
    renderSkeletons();

    try {
      const items = await fetchRecommendedVideos({ forceDefault: !hasHistory });
      if (requestId !== recommendationsRequestId || watchSection.classList.contains('active')) return;
      lastResults = items;
      searchQuery = resultsTitle.textContent;
      resultsCount.textContent = items.length + ' 件';
      renderGrid(items);
    } catch (e) {
      if (requestId !== recommendationsRequestId || watchSection.classList.contains('active')) return;
      resultsGrid.innerHTML = '<div class="error-msg"><div class="err-icon">⚠️</div><p>' + (e.message || 'おすすめの取得に失敗しました') + '</p>' + discordBtnHtml() + '</div>';
      resultsTitle.textContent = 'おすすめ';
    }
  }

  // ─── Video ───
  // ─── ストリームのハートビート ───
  // タブが開いている間、定期的にバックエンドへ合図を送る。
  // これが一定時間(15分)途絶えると、バックエンド側でストリームが自動削除される。
  // 実際に再生中かどうかも一緒に報告し、再生されないまま1時間放置されたストリームも
  // 別途自動削除される。
  function stopStreamHeartbeat() {
    if (streamHeartbeatTimer) {
      clearInterval(streamHeartbeatTimer);
      streamHeartbeatTimer = null;
    }
  }

  function sendStreamHeartbeat(videoId) {
    if (!videoId) return;
    const playing = (!videoPlayer.paused && !videoPlayer.ended) ? '1' : '0';
    fetch('/api/stream/heartbeat?id=' + encodeURIComponent(videoId) + '&playing=' + playing)
      .catch(() => {});
  }

  function startStreamHeartbeat(videoId) {
    stopStreamHeartbeat();
    if (!videoId) return;
    sendStreamHeartbeat(videoId);
    streamHeartbeatTimer = setInterval(() => sendStreamHeartbeat(videoId), 30000);
  }

  function destroyHls() {
    if (hlsRetryTimer) {
      clearTimeout(hlsRetryTimer);
      hlsRetryTimer = null;
    }
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  }

  const HLS_MAX_RETRY = 3;

  async function refreshPlayback(resumeAt, wasPaused = videoPlayer.paused, refresh = true) {
    destroyHls();
    const requestId = ++playVideoRequestId;
    cancelAutoQuality();
    const quality = QUALITY_STEPS.includes(currentQuality) ? currentQuality : '240p';
    const res = await fetchAccountStream('/api/stream?id=' + encodeURIComponent(currentVideoId) +
      '&quality=' + quality + playbackCodecQuery() + audioPreferenceQuery() + (refresh ? '&refresh=1' : '') + '&seek=' + Math.max(0, Math.floor(resumeAt)));
    const data = await res.json();
    if (requestId !== playVideoRequestId) return;
    if (!res.ok || data.error || !data.url) throw new Error(data.error || '再生情報の取得に失敗しました');
    currentStreamOffset = data.startOffset || 0;
    lastAudioFallback = Boolean(data.audioFallback);
    updateQualityUi(data.quality, data.available1080p, data.availableQualities);
    qualityBadge.textContent = (data.isLive ? 'LIVE ・ ' : '') + data.height + 'p';
    attachHlsSrc(data.url, Math.max(0, resumeAt - currentStreamOffset), wasPaused);
    startAutoQuality(data);
  }

  function scheduleHlsRetry() {
    if (!currentStreamUrl || hlsRetryTimer) return;
    if (hlsRetryCount >= HLS_MAX_RETRY) { showHlsRetryFailedUI(); return; }
    const resumeAt = (videoPlayer.currentTime || 0) + currentStreamOffset;
    const wasPaused = videoPlayer.paused;
    const requestId = playVideoRequestId;
    hlsRetryCount += 1;
    loadingMsg.textContent = '接続を再試行中... (' + hlsRetryCount + '/' + HLS_MAX_RETRY + ')';
    playerLoading.style.display = 'flex';
    videoPlayer.style.display = 'none';
    hlsRetryTimer = setTimeout(async () => {
      hlsRetryTimer = null;
      if (requestId !== playVideoRequestId) return;
      try { await refreshPlayback(resumeAt, wasPaused); }
      catch (e) { if (requestId + 1 === playVideoRequestId) scheduleHlsRetry(); }
    }, 450 * hlsRetryCount);
  }

  function showHlsRetryFailedUI() {
    destroyHls();
    playerLoading.style.display = 'flex';
    videoPlayer.style.display   = 'none';
    loadingMsg.innerHTML =
      '<div style="text-align:center">' +
      '<div style="font-size:15px;margin-bottom:8px">⚠️ 接続が不安定で再生を再開できませんでした</div>' +
      '<button type="button" id="hlsManualRetryBtn" style="margin-bottom:10px;padding:8px 16px;border-radius:999px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-family:var(--font);font-size:13px;cursor:pointer">再読み込み</button>' +
      discordBtnHtml() +
      '</div>';
    const retryBtn = document.getElementById('hlsManualRetryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (!currentStreamUrl) return;

        hlsRetryCount = 0;
        scheduleHlsRetry();
      }, { once: true });
    }
  }

  function playbackCodecQuery() {
    const mse = window.MediaSource;
    if (forceCompatiblePlayback || !mse || !Hls.isSupported()) return '&codecs=';
    const codecs = [];
    if (mse.isTypeSupported('video/mp4; codecs="av01.0.08M.08"')) codecs.push('av1');
    if (mse.isTypeSupported('video/mp4; codecs="vp09.00.41.08"')) codecs.push('vp9');
    return '&codecs=' + encodeURIComponent(codecs.join(','));
  }

  function attachHlsSrc(url, resumeAt = 0, wasPaused = false) {
    rebuildSubtitleCues();
    currentStreamUrl = url;
    destroyHls();

    if (Hls.isSupported()) {
      // hls.js 経由 (Chrome / Firefox など)
      hlsInstance = new Hls({
        maxBufferLength: currentIsLive ? 18 : 120,
        maxMaxBufferLength: currentIsLive ? 36 : 600,
        enableWorker: true,
        lowLatencyMode: currentIsLive,
        liveSyncDurationCount: currentIsLive ? 2 : undefined,
        liveMaxLatencyDurationCount: currentIsLive ? 5 : undefined,
        backBufferLength: currentIsLive ? 12 : 90,
        startLevel: -1,
        autoLevelEnabled: true,
        // event playlist は #EXT-X-ENDLIST が付くまで hls.js に「ライブ」と判定され、
        // 既定だと live edge (読み込めている一番先) から再生されてしまうため明示的に 0 を指定
        startPosition: currentIsLive ? -1 : resumeAt,
      });
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(videoPlayer);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        // HLS manifest から duration が取れるようになったら更新
        // (event playlist は生成途中だと「読み込めている分」の長さしか返らないため、
        //  VODで knownDuration が既にある場合は上書きしない)
        if (hlsInstance.media && (currentIsLive || !(knownDuration > 0.5))) {
          const d = hlsInstance.media.duration;
          if (isFinite(d) && d > 0.5) knownDuration = d;
        }
        playerLoading.style.display = 'none';
        videoPlayer.style.display = 'block';

        if (currentIsLive && hlsInstance.liveSyncPosition) {
          videoPlayer.currentTime = hlsInstance.liveSyncPosition;
        } else if (!currentIsLive) {
          // VODは新規再生または復帰位置から開始する
          videoPlayer.currentTime = resumeAt;
        }
        if (wasPaused) return;
        videoPlayer.play().catch(err => {
          // ブラウザの自動再生ポリシーで拒否された場合、
          // コントロールを表示して手動再生できるようにする
          if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
            syncPlayState(); // 一時停止状態としてUIを更新（再生ボタンを表示）
          }
        });
      });

      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('[hls.js] fatal error', data);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR || data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) forceCompatiblePlayback = true;
            scheduleHlsRetry();
            return;
          }
        }
      });
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari ネイティブ HLS
      videoPlayer.src = url;
      videoPlayer.addEventListener('loadedmetadata', () => {
        if (!currentIsLive) videoPlayer.currentTime = resumeAt;
        if (wasPaused) return;
        videoPlayer.play().catch(err => {
          if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
            syncPlayState();
          }
        });
      }, { once: true });
    } else {
      // フォールバック: 直接セット
      videoPlayer.src = url;
      videoPlayer.addEventListener('loadedmetadata', () => {
        if (!currentIsLive) videoPlayer.currentTime = resumeAt;
        if (wasPaused) return;
        videoPlayer.play().catch(err => {
          if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
            syncPlayState();
          }
        });
      }, { once: true });
    }
  }

  // ─── 画質メニュー ───────────────────────────────────────────────────────
  function closeQualityMenu() {
    qualityMenu.style.display = 'none';
    qualityBtn.classList.remove('active');
  }

  function toggleQualityMenu() {
    const opening = qualityMenu.style.display === 'none';
    if (opening) {
      qualityMenu.style.display = 'block';
      qualityBtn.classList.add('active');
    } else {
      closeQualityMenu();
    }
  }

  qualityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleQualityMenu();
  });
  document.addEventListener('click', (e) => {
    if (!qualityMenuWrap.contains(e.target)) closeQualityMenu();
  });

  // サーバーが返した情報(実際に選ばれた画質・1080pが選択可能か)をUIへ反映する
  function updateQualityUi(quality, available1080p, availableQualities) {
    currentQuality = QUALITY_STEPS.includes(quality) ? quality : 'auto';
    currentAvailable1080p = Boolean(available1080p);
    if (Array.isArray(availableQualities)) currentAvailableQualities = availableQualities;
    if (quality === 'auto') currentAvailableQualities = [];
    availableQualities = currentAvailableQualities;
    for (const button of qualityMenu.querySelectorAll('[data-quality]')) {
      const value = button.dataset.quality;
      button.classList.toggle('active', value === qualityMode);
      button.disabled = value !== 'auto' && Array.isArray(availableQualities) && availableQualities.length > 0 && !availableQualities.includes(value);
    }
    qualityOptAuto.textContent = '安定画質' + (qualityMode === 'auto' && currentQuality !== 'auto' ? '（' + currentQuality + '）' : '');
  }

  function cancelAutoQuality() {
    if (autoQualityController) autoQualityController.abort();
    autoQualityController = null;
  }
  function qualityDelay(ms, signal) {
    return new Promise((resolve,reject) => {
      if (signal.aborted) { reject(new Error('cancelled')); return; }
      const abort = () => { clearTimeout(timer); reject(new Error('cancelled')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort',abort); resolve(); }, ms);
      signal.addEventListener('abort',abort,{once:true});
    });
  }
  async function waitForQualityCoverage(data, signal) {
    // A ready playlist may cover only the beginning. Keep the old video playing
    // until the new playlist covers the current position plus a small buffer.
    for (let count=0; count<120; count++) {
      const response = await fetch(data.url, {signal,cache:'no-store'});
      if (!response.ok) throw new Error('画質の準備に失敗しました');
      const playlist = await response.text();
      let duration = 0;
      for (const line of playlist.split(String.fromCharCode(10))) {
        if (line.startsWith('#EXTINF:')) duration += parseFloat(line.slice(8)) || 0;
      }
      const position = videoPlayer.currentTime + currentStreamOffset - (data.startOffset || 0);
      if (position >= 0 && (duration >= position + 5 || (playlist.includes('#EXT-X-ENDLIST') && duration > position))) return;
      await qualityDelay(1000,signal);
    }
    throw new Error('次の画質の準備が時間内に終わりませんでした');
  }
  function startAutoQuality(initialData) {
    cancelAutoQuality();
    if (qualityMode !== 'auto' || initialData.isLive || initialData.experimental || !currentVideoId) return;
    const controller = new AbortController();
    autoQualityController = controller;
    const signal = controller.signal;
    const id = currentVideoId;
    const requestId = playVideoRequestId;
    const valid = () => !signal.aborted && id === currentVideoId && requestId === playVideoRequestId && qualityMode === 'auto';
    const choices = Array.isArray(initialData.availableQualities) ? initialData.availableQualities : currentAvailableQualities;
    (async () => {
      for (const quality of QUALITY_STEPS.slice(QUALITY_STEPS.indexOf(currentQuality)+1)) {
        if (!choices.includes(quality) || !valid()) continue;
        // Let the current source begin rendering before preparing the next rung.
        for (let i=0; videoPlayer.readyState < 2 && i<30; i++) await qualityDelay(1000,signal);
        if (!valid() || videoPlayer.readyState < 2 || videoPlayer.ended) return;
        await qualityDelay(2000,signal);
        const response = await fetchAccountStream('/api/stream?id=' + encodeURIComponent(id) + '&quality=' + quality + playbackCodecQuery() + audioPreferenceQuery(), {signal});
        const data = await response.json();
        if (!response.ok || !data.url || data.error) throw new Error(data.detail || data.error || '画質の準備に失敗しました');
        if (!valid()) return;
        await waitForQualityCoverage(data,signal);
        if (!valid() || videoPlayer.ended) return;
        const position = videoPlayer.currentTime + currentStreamOffset;
        const paused = videoPlayer.paused;
        currentStreamOffset = data.startOffset || 0;
        updateQualityUi(data.quality,data.available1080p,data.availableQualities);
        qualityBadge.textContent = data.height + 'p';
        attachHlsSrc(data.url,Math.max(0,position-currentStreamOffset),paused);
      }
    })().catch(error => {
      if (valid()) console.warn('[Halo] 自動画質の準備に失敗したため、現在の画質を維持します:',error.message);
    });
  }

  async function switchQuality(quality) {
    if (!currentVideoId) return;
    closeQualityMenu();
    cancelAutoQuality();
    qualityMode = quality;
    setPreferredQuality(quality);
    const target = quality;
    const videoId = currentVideoId;
    const myRequestId = ++playVideoRequestId;
    try {
      const response = await fetchAccountStream('/api/stream?id=' + encodeURIComponent(videoId) + '&quality=' + target + playbackCodecQuery() + audioPreferenceQuery());
      const data = await response.json();
      if (myRequestId !== playVideoRequestId) return;
      if (!response.ok || !data.url || data.error) throw new Error(data.detail || data.error || '画質の取得に失敗しました');
      const controller = new AbortController();
      autoQualityController = controller;
      if (!data.isLive) await waitForQualityCoverage(data,controller.signal);
      if (myRequestId !== playVideoRequestId) return;
      const position = videoPlayer.currentTime + currentStreamOffset;
      const paused = videoPlayer.paused;
      currentStreamOffset = data.startOffset || 0;
      updateQualityUi(data.quality,data.available1080p,data.availableQualities);
      qualityBadge.textContent = data.height + 'p';
      attachHlsSrc(data.url,Math.max(0,position-currentStreamOffset),paused);
      startAutoQuality(data);
    } catch (error) {
      if (myRequestId !== playVideoRequestId) return;
      qualityMode = currentQuality;
      setPreferredQuality(qualityMode);
      updateQualityUi(currentQuality,currentAvailable1080p);
      console.warn('[quality switch] 現在の画質を維持します:',error.message);
    }
  }
  for (const button of qualityMenu.querySelectorAll('[data-quality]')) button.addEventListener('click', () => switchQuality(button.dataset.quality));

  async function playVideo(video) {
    cancelAutoQuality();
    qualityMode = getPreferredQuality();
    const playbackStartedAt = performance.now();
    // 別動画が読み込み中の場合でも、新しい動画に即切り替えられるようリクエストIDで管理
    playVideoRequestId += 1;
    const myRequestId = playVideoRequestId;

    if (currentVideoId && currentVideoId !== video.id) {
      videoPlayer.pause();
      videoPlayer.src = '';
      destroyHls();
      stopLiveChat();
      stopStreamHeartbeat();
      resetPlayer();
    }

    if (currentVideoId === video.id && (hlsInstance || videoPlayer.src) && !videoPlayer.error) {
      watchTitle.textContent      = video.title;
      watchChannel.textContent    = video.channel;
      loadVideoDetails(video);
      resetComments();
      loadComments();
      clearPreviewRequestState();
      setPreviewImage(buildPreviewImage(video));
      playerLoading.style.display = 'none';
      startAutoQuality({isLive:currentIsLive,availableQualities:currentAvailableQualities});
      return;
    }

    currentVideoId              = video.id;
    currentVideoChannelId       = safeTrim(video.channelId);
    currentVideoCommentCount    = null;
    watchChannel.dataset.channelId = currentVideoChannelId;
    currentStreamUrl            = '';
    currentStreamOffset = 0;
    currentAudioPreference = getDefaultAudioPreference();
    resetMediaOptions();
    forceCompatiblePlayback = false;
    hlsRetryCount               = 0;
    setLiveMode(isLiveVideo(video));
    watchTitle.textContent      = video.title;
    watchChannel.textContent    = video.channel;
    setWatchLikes(video.likeCount);
    setWatchDescription(video.description);
    playerLoading.style.display = 'flex';
    videoPlayer.style.display   = 'none';
    videoPlayer.src             = '';
    // 再生位置を先頭にリセット（途中再生防止）
    videoPlayer.currentTime     = 0;
    destroyHls();
    loadingMsg.textContent      = '動画URLを取得中...';
    qualityBadge.style.display  = 'none';
    qualityBadge.textContent    = '';
    resetPlayer();
    // video オブジェクトに duration があれば knownDuration に事前設定（シーク可能にするため）
    if (typeof video.duration === 'number' && video.duration > 0) {
      knownDuration = video.duration;
    }
    setLiveMode(isLiveVideo(video));
    setPreviewImage(buildPreviewImage(video));

    const isFirstWatch = getWatchHistory().length === 0;
    rememberWatchedVideo(video);
    loadVideoDetails(video);
    resetComments();
    loadComments();
    renderRelatedSkeletons();

    // 関連動画は yt-dlp を大量に起動するので、再生が始まってから取得する
    let relatedStarted = false;
    const startRelated = () => {
      if (relatedStarted || myRequestId !== playVideoRequestId) return;
      relatedStarted = true;
      loadRelatedRecommendations(video, isFirstWatch);
    };
    videoPlayer.addEventListener('playing', startRelated, { once: true });
    setTimeout(startRelated, 15000); // 再生に失敗した場合の保険

    try {
      const useExperimentalStream = isExperimentalStreamingEnabled();
      const desiredQuality = getPreferredQuality();
      const streamUrl = '/api/stream?id=' + encodeURIComponent(video.id) +
        playbackCodecQuery() + audioPreferenceQuery() + (useExperimentalStream ? '&experimental=1' : '') +
        (isYoutubeJsEnabled() ? '&engine=youtubejs' : '') +
        (!useExperimentalStream ? '&quality=' + desiredQuality : '');
      const res  = await fetchAccountStream(streamUrl);
      const data = await res.json();

      // 非同期待機中に別の動画へ切り替えられていたら処理を中断
      if (myRequestId !== playVideoRequestId) return;

      if (data.error) throw new Error(data.error);

      console.info('[Halo] startup API', { elapsedMs: Math.round(performance.now() - playbackStartedAt), server: data.startupTiming });
      videoPlayer.addEventListener('playing', function startupPlayed() {
        if (myRequestId === playVideoRequestId) console.info('[Halo] first playback', { elapsedMs: Math.round(performance.now() - playbackStartedAt), server: data.startupTiming });
      }, { once: true });

      if (data.engineFallbackReason) {
        console.warn('[youtube.js] 使用できなかったためyt-dlpで再生します: ' + data.engineFallbackReason);
      }

      // yt-dlp メタ情報から duration を保存（m3u8 パース前の初期値）
      knownDuration = (typeof data.duration === 'number' && data.duration > 0)
        ? data.duration : 0;
      setLiveMode(Boolean(data.isLive || isLiveVideo(video) || !knownDuration));
      if (currentIsLive) startLiveChat(video.id);

      loadingMsg.textContent      = '動画を読み込み中...';
      videoPlayer.style.display   = 'none';
      playerLoading.style.display = 'flex';

      // experimental(googlevideo直接URL)モードは通常のHLS画質切り替えと組み合わせられないため、
      // その場合は画質メニュー自体を隠す
      qualityMenuWrap.style.display = data.experimental ? 'none' : '';
      subtitleBtn.disabled = audioTrackBtn.disabled = Boolean(data.experimental);
      if (!data.experimental) { lastAudioFallback = Boolean(data.audioFallback); updateQualityUi(data.quality, data.available1080p, data.availableQualities); }

      if (data.height) {
        qualityBadge.textContent   = (currentIsLive ? 'LIVE ・ ' : '') + data.height + 'p' + (data.experimental ? ' ・ EXPERIMENTAL' : '') + (data.engine === 'youtubejs' ? ' ・ youtube.js' : '');
        qualityBadge.style.display = '';
      } else if (currentIsLive) {
        qualityBadge.textContent   = 'LIVE';
        qualityBadge.style.display = '';
      }

      if (data.experimental) {
        // 実験的モード: yt-dlp が返した googlevideo 直接URLをそのままセット（HLS/ffmpeg中継を経由しない）
        console.warn('[experimental streaming] googlevideo直接URLで再生します: ' + video.id);
        destroyHls();
        currentStreamUrl = data.url;
        videoPlayer.src  = data.url;
        videoPlayer.addEventListener('loadedmetadata', function onLoaded() {
          videoPlayer.removeEventListener('loadedmetadata', onLoaded);
          if (myRequestId !== playVideoRequestId) return;
          playerLoading.style.display = 'none';
          videoPlayer.style.display   = 'block';
          videoPlayer.play().catch(function(err) {
            if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
              syncPlayState();
            }
          });
        }, { once: true });
        videoPlayer.addEventListener('error', function onErr() {
          videoPlayer.removeEventListener('error', onErr);
          console.error('[experimental streaming] 再生に失敗しました: ' + video.id);
        }, { once: true });
      } else {
        // 通常モード: HLS ストリームをアタッチ
        attachHlsSrc(data.url);
        startAutoQuality(data);
      }
      startStreamHeartbeat(video.id);

    } catch (e) {
      // 処理が古いリクエストならエラー表示しない
      if (myRequestId !== playVideoRequestId) return;
      playerLoading.style.display = 'flex';
      videoPlayer.style.display   = 'none';
      loadingMsg.innerHTML =
        '<div style="text-align:center">' +
        '<div style="font-size:15px;margin-bottom:8px">⚠️ ' + esc(e.message || '動画の読み込みに失敗しました') + '</div>' +
        discordBtnHtml() +
        '</div>';
    }
  }

  function stopVideo() {
    cancelAutoQuality();
    playVideoRequestId++;
    watchSection.classList.remove('mini-player-host');
    videoPlayer.pause();
    videoPlayer.src        = '';
    destroyHls();
    stopStreamHeartbeat();
    currentVideoId         = null;
    currentVideoChannelId  = '';
    currentVideoCommentCount = null;
    resetMediaOptions();
    currentStreamUrl       = '';
    hlsRetryCount          = 0;
    stopLiveChat();
    clearPreviewRequestState();
    setPreviewImage('');
    qualityBadge.style.display = 'none';
    qualityBadge.textContent   = '';
    watchLikes.textContent     = '';
    watchLikeDot.style.display = 'none';
    watchDescription.textContent = '';
    resetComments('動画を選択するとコメントが表示されます');
    resetPlayer();
  }

  previewImg.addEventListener('error', () => {
    const currentSrc = previewImg.getAttribute('src') || '';
    if (isGeneratedPreviewSrc(currentSrc) && lastResolvedPreviewImage && lastResolvedPreviewImage !== currentSrc) {
      previewImg.src = lastResolvedPreviewImage;
      return;
    }
    if (isGeneratedPreviewSrc(currentSrc) && currentPreviewImage) {
      previewImg.src = currentPreviewImage;
    }
  });

  previewImg.addEventListener('load', () => {
    const currentSrc = previewImg.getAttribute('src') || '';
    if (isGeneratedPreviewSrc(currentSrc)) {
      lastResolvedPreviewImage = currentSrc;
    }
  });

  // ─── Search events ───
  function onSearch(input) {
    const q = safeTrim(input && input.value);
    if (q) doSearch(q);
  }

  // ─── Sudoku Easter Egg ───
  let _searchBtnLastClick = 0;
  function _onSearchBtnClick(input) {
    const now = Date.now();
    if (now - _searchBtnLastClick < 500) {
      // Double-click within 500ms → launch sudoku
      _searchBtnLastClick = 0;
      launchSudoku();
      return;
    }
    _searchBtnLastClick = now;
    onSearch(input);
  }
  function _onSearchKeydown(e, input) {
    if (e.key === 'Enter') {
      const q = safeTrim(input && input.value);
      if (!q) {
        // Empty Enter → launch sudoku
        launchSudoku();
        return;
      }
      onSearch(input);
    }
  }

  heroSearch.addEventListener('keydown',    e => _onSearchKeydown(e, heroSearch));
  heroSearchBtn.addEventListener('click',   () => _onSearchBtnClick(heroSearch));
  headerSearch.addEventListener('keydown',  e => _onSearchKeydown(e, headerSearch));
  headerSearchBtn.addEventListener('click', () => _onSearchBtnClick(headerSearch));
  headerLogo.addEventListener('pointerenter', shuffleHeaderLogo);
  headerLogo.addEventListener('pointerdown', shuffleHeaderLogo);
  resultsMore.addEventListener('click', loadMoreSearchResults);
  commentsSortRelevance.addEventListener('click', () => {
    if (commentsOrder === 'relevance') return;
    commentsOrder = 'relevance';
    resetComments();
    loadComments();
  });
  commentsSortTime.addEventListener('click', () => {
    if (commentsOrder === 'time') return;
    commentsOrder = 'time';
    resetComments();
    loadComments();
  });
  commentsMore.addEventListener('click', () => loadComments({ append: true }));

  backBtn.addEventListener('click', () => {
    if (lastResults.length) showResults(searchQuery, lastResults);
    else showHome();
  });

  channelBackBtn.addEventListener('click', () => {
    channelSection.classList.remove('active');
    if (lastResults.length) showResults(searchQuery, lastResults);
    else showHome();
  });

  channelMore.addEventListener('click', () => {
    loadChannelVideos(true);
  });

  channelTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.channel-tab');
    if (!btn || !btn.dataset.tab || btn.dataset.tab === currentChannelTab) return;
    currentChannelTab = btn.dataset.tab;
    channelTabs.querySelectorAll('.channel-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === currentChannelTab);
    });
    channelVideos = [];
    channelNextPageToken = '';
    channelCanLoadMore = false;
    channelVideosTitle.textContent = CHANNEL_TABS[currentChannelTab] || '動画';
    channelVideosCount.textContent = '';
    channelGrid.innerHTML = buildChannelSkeletons();
    channelMore.style.display = 'none';
    loadChannelVideos(false);
  });

  watchChannel.addEventListener('click', () => {
    const cid = currentVideoChannelId || safeTrim(watchChannel.dataset.channelId);
    if (cid) showChannel(cid, safeTrim(watchChannel.textContent));
  });

  function setServerStatus(isAlive) {
    const cls = isAlive ? 'alive' : 'down';
    const txt = isAlive ? '●SERVER ALLIVE' : '●SERVER DOWN';
    if (serverStatus) {
      serverStatus.classList.remove('checking', 'alive', 'down');
      serverStatus.classList.add(cls);
      serverStatus.textContent = txt;
    }
    // Sync mobile status badges
    [mobileServerStatusHome, mobileServerStatusNohome].forEach(el => {
      if (!el) return;
      el.classList.remove('checking', 'alive', 'down');
      el.classList.add(cls);
      el.textContent = txt;
    });
  }

  // ─── Mobile menu ───
  let activeMobileMenu = null;

  function openMobileMenu(menu, anchorEl) {
    closeMobileMenu();
    const rect = anchorEl.getBoundingClientRect();
    menu.style.top  = (rect.bottom + 6) + 'px';
    menu.style.left = Math.min(rect.left, window.innerWidth - 210) + 'px';
    menu.classList.add('open');
    mobileMenuOverlay.classList.add('open');
    activeMobileMenu = menu;
  }

  function closeMobileMenu() {
    if (activeMobileMenu) {
      activeMobileMenu.classList.remove('open');
      activeMobileMenu = null;
    }
    mobileMenuOverlay.classList.remove('open');
  }

  mobileMenuOverlay.addEventListener('click', closeMobileMenu);

  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mobileHamburgerMenu.classList.contains('open')) { closeMobileMenu(); return; }
    openMobileMenu(mobileHamburgerMenu, hamburgerBtn);
  });

  headerLogo.addEventListener('click', e => {
    e.preventDefault();
    if (!isMobileLayout()) {
      showHome();
      return;
    }
    // Mobile: on non-home page show logo dropdown
    if (headerLogo.style.display === 'none') return; // home mode, logo hidden
    if (mobileLogoMenu.classList.contains('open')) { closeMobileMenu(); return; }
    openMobileMenu(mobileLogoMenu, headerLogo);
  });

  document.getElementById('mobile-home-btn').addEventListener('click', () => {
    closeMobileMenu();
    showHome();
  });

  // Settings buttons (mobile menu) — settings-btn への click をそのまま転送
  ['mobile-settings-btn-home', 'mobile-settings-btn-nohome'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      closeMobileMenu();
      document.getElementById('settings-btn') && document.getElementById('settings-btn').click();
    });
  });

  // ─── 設定ボタン ───
  (function() {
    const settingsBtnEl = document.getElementById('settings-btn');
    if (settingsBtnEl) settingsBtnEl.addEventListener('click', function() { showSettingsModal(); });

    const logToggleBtnEl = document.getElementById('log-toggle-btn');
    if (logToggleBtnEl) logToggleBtnEl.addEventListener('click', function() { showHaloLogPanel(); });

    updateLogToggleBtnVisibility();
  })();

  function updateLogToggleBtnVisibility() {
    const btn = document.getElementById('log-toggle-btn');
    if (btn) btn.style.display = isConsoleEnabled() ? 'inline-flex' : 'none';
  }

  function haloToggleTrackStyle(on) {
    return 'position:relative;width:42px;height:23px;border-radius:999px;border:none;cursor:pointer;flex-shrink:0;padding:0;transition:background 0.2s;background:' +
      (on ? 'var(--accent)' : 'rgba(255,255,255,0.15)') + ';';
  }
  function haloToggleKnobStyle(on) {
    return 'position:absolute;top:3px;left:' + (on ? '22px' : '3px') +
      ';width:17px;height:17px;border-radius:50%;background:#fff;transition:left 0.2s;display:block;pointer-events:none;';
  }

  function normalizeLogCommand(raw) {
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s*:\s*/, ':')
      .replace(/\s+/g, ' ');
  }

  window.closeSettingsModal = function() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
  };

  window.showSettingsModal = function() {
    let modal = document.getElementById('settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'settings-modal';
      Object.assign(modal.style, {
        position: 'fixed', inset: '0', zIndex: '9999',
        background: 'rgba(0,0,0,0.65)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)', padding: '20px',
      });
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) closeSettingsModal(); });
    }

    const expOn     = isExperimentalStreamingEnabled();
    const ytjsOn    = isYoutubeJsEnabled();
    const consoleOn = isConsoleEnabled();

    modal.innerHTML =
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;width:440px;max-width:94vw;max-height:86vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.5)">' +

        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
          '<h2 style="font-size:18px;font-weight:700;">設定</h2>' +
          '<a href="#" id="settings-close-link" style="color:var(--muted);text-decoration:none;font-size:13px;">閉じる</a>' +
        '</div>' +

        '<div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)">' +
          '<label for="default-audio-select" style="display:block;font-weight:600;margin-bottom:8px">既定の音声トラック</label>' +
          '<select id="default-audio-select" style="width:100%;padding:8px"></select>' +
          '<p style="font-size:12px;color:var(--muted);margin-top:8px">次に開く動画から適用します。希望する音声がない場合は、利用できる音声で再生します。</p>' +
        '</div>' +

        // ── 実験的なストリーミング ──
        '<div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:600;">実験的なストリーミング</div>' +
              '<div style="font-size:12px;color:var(--muted);margin-top:2px;">yt-dlpが取得した動画URL(googlevideo)で直接再生します</div>' +
            '</div>' +
            '<button id="exp-stream-toggle" type="button" role="switch" aria-checked="' + expOn + '" style="' + haloToggleTrackStyle(expOn) + '"><span style="' + haloToggleKnobStyle(expOn) + '"></span></button>' +
          '</div>' +
          '<div style="margin-top:12px;font-size:12px;line-height:1.7;color:#fca5a5;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:10px 12px;">' +
            '⚠️ この機能は試験的な機能であり、正しく正常する保証はありません。また、通常の用途でこのオプションが使用されることは想定されていないため、バグが発生したり再生ができなかった場合、99%この機能が原因です。問題が発生した場合はすぐさま機能を無効にしてください。' +
          '</div>' +
        '</div>' +

        // ── youtube.js ──
        '<div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:600;">youtube.jsを使用</div>' +
              '<div style="font-size:12px;color:var(--muted);margin-top:2px;">yt-dlpの代わりにyoutube.js(youtubei.js)で動画情報を取得します</div>' +
            '</div>' +
            '<button id="ytjs-toggle" type="button" role="switch" aria-checked="' + ytjsOn + '" style="' + haloToggleTrackStyle(ytjsOn) + '"><span style="' + haloToggleKnobStyle(ytjsOn) + '"></span></button>' +
          '</div>' +
          '<div style="margin-top:12px;font-size:12px;line-height:1.7;color:#fca5a5;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:10px 12px;">' +
            '⚠️ 試験的な機能です。正常に動作する保証はありません。再生できない場合はオフに戻してください。取得に失敗した動画やライブ配信は自動的にyt-dlpで再生されます。設定は次に開く動画から反映されます。' +
          '</div>' +
        '</div>' +

        // ── コンソール ──
        '<div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">' +
            '<div style="font-size:14px;font-weight:600;">コンソール <span style="font-size:11px;font-weight:400;color:var(--muted);">(上級者向け)</span></div>' +
            '<button id="console-toggle" type="button" role="switch" aria-checked="' + consoleOn + '" style="' + haloToggleTrackStyle(consoleOn) + '"><span style="' + haloToggleKnobStyle(consoleOn) + '"></span></button>' +
          '</div>' +
          '<div style="font-size:12px;line-height:1.7;color:#fca5a5;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:10px 12px;margin-bottom:12px;">' +
            '⚠この機能は(すごい)人しか扱いこなせません、たぶん<br>' +
            'この機能の操作により一時的または永久的に一部の機能が不全になる可能性を秘めています。<br>' +
            'あなたが仮にもアインシュタインでもない限り、この機能を有効化するのはお勧めしません。' +
          '</div>' +
          (consoleOn ?
            '<div style="display:flex;gap:8px;">' +
              '<input id="log-screen-cmd" type="text" placeholder="" autocomplete="off" spellcheck="false" style="flex:1;min-width:0;background:#05070a;border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:#7dd3fc;font-family:var(--mono);font-size:13px;outline:none;box-sizing:border-box;" />' +
              '<button id="log-screen-run" type="button" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:0 16px;color:var(--text);font-family:var(--mono);font-size:13px;cursor:pointer;flex-shrink:0;">実行</button>' +
            '</div>' +
            '<div id="log-screen-feedback" style="margin-top:8px;font-size:12px;font-family:var(--mono);color:var(--muted);min-height:16px;white-space:pre-line;"></div>'
          : '') +
        '</div>' +

      '</div>';

    modal.style.display = 'flex';

    const defaultAudioSelect = document.getElementById('default-audio-select');
    defaultAudioSelect.add(new Option('動画の既定','auto'));
    defaultAudioSelect.add(new Option('オリジナル優先','original'));
    const audioLanguages = new Set(['ja','en','ko','zh','es','fr','de','pt','it','hi','ru','ar']);
    for (const track of mediaTracks.audio) if (track.language !== 'und') audioLanguages.add(track.language);
    const savedAudio = getDefaultAudioPreference();
    if (savedAudio.startsWith('lang:')) audioLanguages.add(savedAudio.slice(5));
    for (const lang of audioLanguages) defaultAudioSelect.add(new Option(languageLabel(lang) + 'を優先','lang:' + lang));
    defaultAudioSelect.value = savedAudio;
    defaultAudioSelect.addEventListener('change', () => { try {localStorage.setItem('halo_default_audio',defaultAudioSelect.value);} catch (_) {} });

    document.getElementById('settings-close-link').addEventListener('click', function(e) { e.preventDefault(); closeSettingsModal(); });

    document.getElementById('exp-stream-toggle').addEventListener('click', function() {
      setExperimentalStreamingEnabled(!isExperimentalStreamingEnabled());
      showSettingsModal(); // トグル状態を反映して再描画
    });

    document.getElementById('ytjs-toggle').addEventListener('click', function() {
      setYoutubeJsEnabled(!isYoutubeJsEnabled());
      showSettingsModal(); // トグル状態を反映して再描画
    });

    document.getElementById('console-toggle').addEventListener('click', function() {
      const next = !isConsoleEnabled();
      setConsoleEnabled(next);
      updateLogToggleBtnVisibility();
      if (!next) closeHaloLogPanel();
      showSettingsModal(); // トグル状態を反映して再描画(入力欄の表示/非表示もここで切り替わる)
    });

    const LOG_SCREEN_HELP_TEXT =
      '使えるコマンド一覧:'\n +
      '  help              このコマンド一覧を表示'\n +
      '  log-screen:disable  コンソールを無効化(上のトグルをオフにするのと同じ)';

    function runLogScreenCommand() {
      const input    = document.getElementById('log-screen-cmd');
      const feedback = document.getElementById('log-screen-feedback');
      if (!input || !feedback) return;
      const cmd = normalizeLogCommand(input.value);

      if (cmd === 'help') {
        feedback.style.color = 'var(--muted)';
        feedback.textContent = LOG_SCREEN_HELP_TEXT;
        input.value = '';
        // ヘルプ表示は状態を変更しないので再描画しない(フィードバックが消えてしまうため)
      } else if (cmd === 'log-screen:disable') {
        setConsoleEnabled(false);
        updateLogToggleBtnVisibility();
        closeHaloLogPanel();
        input.value = '';
        showSettingsModal(); // 無効化時は入力欄自体を隠すため再描画が必要
      } else if (cmd) {
        feedback.style.color = 'var(--danger)';
        feedback.textContent = '不明なコマンドです: ' + input.value + '（help で一覧を表示）';
      }
    }

    const logScreenRunBtn = document.getElementById('log-screen-run');
    const logScreenCmdInput = document.getElementById('log-screen-cmd');
    if (logScreenRunBtn) logScreenRunBtn.addEventListener('click', runLogScreenCommand);
    if (logScreenCmdInput) {
      logScreenCmdInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') runLogScreenCommand();
      });
    }
  };

  // ─── ログパネル（コンソール機能が有効な時だけヘッダーにボタンが出る） ───
  window.closeHaloLogPanel = function() {
    const modal = document.getElementById('halo-log-modal');
    if (modal) modal.style.display = 'none';
  };

  window.renderHaloLogPanel = function() {
    const body = document.getElementById('halo-log-body');
    if (!body) return; // パネルが開いていない場合は何もしない
    const colors = { log: '#e8eaf0', info: '#7dd3fc', warn: '#facc15', error: '#f87171', debug: '#a78bfa' };
    body.innerHTML = HALO_LOG_BUFFER.map(function(entry) {
      const t     = entry.time.toTimeString().slice(0, 8);
      const color = colors[entry.level] || '#e8eaf0';
      return '<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);">' +
        '<span style="color:var(--muted);">' + t + '</span> ' +
        '<span style="color:' + color + ';font-weight:700;">[' + entry.level.toUpperCase() + ']</span> ' +
        '<span style="color:' + color + ';white-space:pre-wrap;word-break:break-all;">' + haloEscHtml(entry.text) + '</span>' +
      '</div>';
    }).join('') || '<div style="color:var(--muted);">ログはまだありません</div>';
    body.scrollTop = body.scrollHeight;
  };

  window.showHaloLogPanel = function() {
    let modal = document.getElementById('halo-log-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'halo-log-modal';
      Object.assign(modal.style, {
        position: 'fixed', inset: '0', zIndex: '10000',
        background: 'rgba(0,0,0,0.65)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)', padding: '20px',
      });
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) closeHaloLogPanel(); });
      modal.innerHTML =
        '<div style="background:#05070a;border:1px solid var(--border);border-radius:16px;padding:20px;width:720px;max-width:96vw;height:70vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.5)">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-shrink:0;">' +
            '<h2 style="font-size:15px;font-weight:700;font-family:var(--mono);color:#7dd3fc;">CONSOLE LOG</h2>' +
            '<div style="display:flex;gap:14px;align-items:center;">' +
              '<a href="#" id="halo-log-clear" style="color:var(--muted);text-decoration:none;font-size:12px;">クリア</a>' +
              '<a href="#" id="halo-log-close" style="color:var(--muted);text-decoration:none;font-size:12px;">閉じる</a>' +
            '</div>' +
          '</div>' +
          '<div id="halo-log-body" style="flex:1;overflow-y:auto;font-family:var(--mono);font-size:12px;line-height:1.5;"></div>' +
        '</div>';
      document.getElementById('halo-log-close').addEventListener('click', function(e) { e.preventDefault(); closeHaloLogPanel(); });
      document.getElementById('halo-log-clear').addEventListener('click', function(e) {
        e.preventDefault();
        HALO_LOG_BUFFER.length = 0;
        renderHaloLogPanel();
      });
    }
    modal.style.display = 'flex';
    renderHaloLogPanel();
  };

  async function updateServerStatus() {
    if (!serverStatus) return;
    try {
      const res = await fetch('/api/server-status', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      setServerStatus(Boolean(res.ok && data.alive));
    } catch (_) {
      setServerStatus(false);
    }
  }

  // ─── Discord button ───
  function discordBtnHtml() {
    return '<a class="discord-btn" href="https://discord.gg/Rtrq8tfwfX" target="_blank" rel="noopener noreferrer">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.2 19.2 0 0 0 15.4 3c-.2.4-.5 1-.7 1.4a17.8 17.8 0 0 0-5.4 0C9.1 4 8.8 3.4 8.6 3A19.3 19.3 0 0 0 3.7 4.4C.5 9.3-.3 14 .1 18.6a19.4 19.4 0 0 0 5.9 3c.5-.7.9-1.4 1.3-2.2-.7-.3-1.4-.6-2-1l.5-.4a13.8 13.8 0 0 0 11.8 0l.5.4c-.7.4-1.3.7-2 1 .4.8.8 1.5 1.3 2.2a19.3 19.3 0 0 0 5.9-3c.5-5.2-.9-9.8-3.9-14.2zM8 15.5c-1.2 0-2.1-1.1-2.1-2.4S6.8 10.7 8 10.7s2.1 1.1 2.1 2.4S9.2 15.5 8 15.5zm8 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4z"/></svg>' +
      'Discordサポート' +
      '</a>';
  }

  // ─── Channel page ───
  function showChannel(channelId, channelName) {
    if (!channelId) return;
    currentChannelId    = channelId;
    currentChannelName  = channelName || 'チャンネル';
    channelVideos       = [];
    channelNextPageToken = '';
    channelLoadingMore  = false;
    channelCanLoadMore  = false;
    currentChannelTab   = 'videos';
    channelDisplayLimit = 20;
    channelTabs.querySelectorAll('.channel-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === currentChannelTab);
    });

    hero.style.display = 'none';
    header.style.display = '';
    setHeaderHomeMode(false);
    resultsSection.classList.remove('active');
    leaveWatchPage();
    watchSection.classList.remove('active');
    channelSection.classList.add('active');

    // バナーリセット
    channelBannerWrap.classList.add('no-banner');
    channelBannerImg.style.display = 'none';
    channelBannerImg.src = '';

    // スケルトン表示
    channelHeaderSkel.style.display = 'flex';
    channelHeaderEl.style.display = 'none';
    channelAvatarEl.style.display = 'none';
    channelAvatarPh.style.display = 'flex';
    channelAvatarPh.textContent = (currentChannelName || '?').charAt(0).toUpperCase();
    channelAvatarBadge.style.display = 'none';
    channelNameEl.textContent = currentChannelName;
    channelVerifiedBadge.style.display = 'none';
    channelStatsEl.innerHTML = '';
    channelDescEl.style.display = 'none';
    channelDescEl.textContent = '';
    channelYtLink.href = 'https://www.youtube.com/channel/' + encodeURIComponent(channelId);

    channelVideosTitle.textContent = CHANNEL_TABS[currentChannelTab];
    channelVideosCount.textContent = '';
    channelGrid.innerHTML = buildChannelSkeletons();
    channelMore.style.display = 'none';

    // 並行で詳細取得 + 動画取得
    loadChannelDetails(channelId);
    loadChannelVideos();
  }

  async function loadChannelDetails(channelId) {
    try {
      const res  = await fetch('/api/channel?id=' + encodeURIComponent(channelId));
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (currentChannelId !== channelId) return;

      // バナー
      if (data.bannerUrl) {
        channelBannerImg.src = data.bannerUrl;
        channelBannerImg.style.display = 'block';
        channelBannerWrap.classList.remove('no-banner');
      }

      // アバター
      if (data.avatarUrl) {
        channelAvatarEl.src = data.avatarUrl;
        channelAvatarEl.style.display = 'block';
        channelAvatarPh.style.display = 'none';
      }

      // バッジ（アバター右下）
      const badgeType = data.isArtist ? 'artist' : (data.isVerified ? 'verified' : '');
      if (badgeType) {
        channelAvatarBadge.className = 'channel-avatar-badge ' + badgeType;
        channelAvatarBadge.textContent = badgeType === 'artist' ? '♪' : '✓';
        channelAvatarBadge.title = badgeType === 'artist' ? '公式アーティスト' : '認証済みチャンネル';
        channelAvatarBadge.style.display = 'flex';
      }

      // チャンネル名
      if (data.title) {
        channelNameEl.textContent = data.title;
        currentChannelName = data.title;
      }

      // インラインバッジ
      if (badgeType) {
        channelVerifiedBadge.className = 'channel-verified-badge ' + badgeType;
        channelVerifiedBadge.textContent = badgeType === 'artist' ? '♪' : '✓';
        channelVerifiedBadge.title = badgeType === 'artist' ? '公式アーティスト' : '認証済みチャンネル';
        channelVerifiedBadge.style.display = 'inline-flex';
      }

      // 統計（登録者数・動画数）
      const stats = [];
      if (data.subscriberCountText) {
        stats.push('<span class="channel-stat-highlight">' + esc(data.subscriberCountText) + '</span> 登録者');
      }
      if (data.videoCount != null) {
        stats.push('<span class="dot">•</span><span class="channel-stat-highlight">' + formatCompactNumber(data.videoCount) + '</span> 本の動画');
      }
      channelStatsEl.innerHTML = stats.join(' ');

      // 概要
      if (data.description) {
        channelDescEl.textContent = data.description;
        channelDescEl.style.display = '-webkit-box';
        channelDescEl.style.display = 'block';
      }

      // ヘッダー表示切替
      channelHeaderSkel.style.display = 'none';
      channelHeaderEl.style.display = 'flex';
    } catch (_) {
      // APIエラーでも最低限の表示は維持
      channelHeaderSkel.style.display = 'none';
      channelHeaderEl.style.display = 'flex';
    }
  }

  function buildChannelSkeletons() {
    let html = '';
    for (let i = 0; i < 8; i++) {
      html += '<div class="skel-card" style="animation-delay:' + (i * 0.05) + 's">' +
        '<div class="skeleton skel-thumb"></div>' +
        '<div class="skel-body">' +
        '<div class="skeleton skel-line" style="width:95%"></div>' +
        '<div class="skeleton skel-line" style="width:75%"></div>' +
        '<div class="skeleton skel-line short"></div>' +
        '</div></div>';
    }
    return html;
  }

  async function loadChannelVideos(append) {
    if (channelLoadingMore) return;
    channelLoadingMore = true;
    if (append) {
      channelMore.disabled = true;
      channelMore.textContent = '読み込み中...';
    }

    try {
      const url = '/api/channel-tab?id=' + encodeURIComponent(currentChannelId) +
        '&tab=' + encodeURIComponent(currentChannelTab) +
        '&limit=' + encodeURIComponent(channelDisplayLimit) +
        (append && channelNextPageToken ? '&pageToken=' + encodeURIComponent(channelNextPageToken) : '');
      const res  = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const items = (data.items || []).filter(v => v && v.id);
      const newItems = [];
      if (append) {
        const existingIds = new Set(channelVideos.map(v => v.id));
        items.forEach(v => {
          if (!existingIds.has(v.id)) {
            channelVideos.push(v);
            newItems.push(v);
          }
        });
      } else {
        channelVideos = items;
        newItems.push(...items);
      }

      channelNextPageToken = safeTrim(data.nextPageToken);
      channelCanLoadMore = Boolean(data.hasMore);
      channelVideosCount.textContent = channelVideos.length + ' 件';

      renderChannelGrid(newItems, append);
      channelMore.style.display = (channelNextPageToken || channelCanLoadMore) ? '' : 'none';
      channelMore.disabled = false;
      channelMore.textContent = channelNextPageToken ? 'さらに読み込む' : '表示件数を増やす';
    } catch (e) {
      if (!append) {
        channelGrid.innerHTML = '<div class="error-msg"><div class="err-icon">⚠️</div><p>' +
          esc(e.message || 'チャンネルコンテンツの取得に失敗しました') + '</p>' + discordBtnHtml() + '</div>';
      }
      channelMore.disabled = false;
      channelMore.textContent = 'さらに読み込む';
    } finally {
      channelLoadingMore = false;
    }
  }

  function renderChannelGrid(items, append) {
    if (!append) channelGrid.innerHTML = '';
    if (!items.length && !append) {
      channelGrid.innerHTML = '<div class="error-msg"><div class="err-icon">📺</div><p>' +
        esc((CHANNEL_TABS[currentChannelTab] || 'コンテンツ') + 'が見つかりませんでした') + '</p></div>';
      return;
    }
    const startIdx = append ? Math.max(0, channelVideos.length - items.length) : 0;
    const html = items.map((v, i) =>
      '<div class="card" style="animation-delay:' + ((startIdx + i) * 0.04) + 's"' +
      ' data-id="' + esc(v.id) + '" data-title="' + esc(v.title) + '"' +
      ' data-channel="' + esc(v.channel) + '" data-thumb="' + esc(v.thumb) + '"' +
      ' data-channel-id="' + esc(v.channelId || '') + '"' +
      ' data-url="' + esc(v.url || '') + '" data-kind="' + esc(v.kind || currentChannelTab) + '"' +
      ' data-description="' + esc(v.description) + '"' +
      ' data-live-status="' + esc(v.liveStatus || '') + '" data-is-live="' + (isLiveVideo(v) ? '1' : '') + '">' +
      '<div class="card-thumb-wrap"><img class="card-thumb" src="' + esc(resolveThumb(v.thumb)) + '" alt="" loading="lazy" onerror="handleThumbError(this)">' +
      (isLiveVideo(v) ? '<span class="card-live-badge">LIVE</span>' : '') + '</div>' +
      '<div class="card-body">' +
      '<div class="card-title">' + esc(v.title) + '</div>' +
      '<div class="card-meta"><span class="card-channel">' + esc(v.channel || currentChannelName) + '</span>' +
      (v.kind && v.kind !== 'video' ? '<span class="channel-card-kind">' + esc(v.kindLabel || CHANNEL_TABS[v.kind] || v.kind) + '</span>' : '') +
      (isLiveVideo(v) ? '<span class="live-badge active"><span class="live-dot"></span>LIVE</span>' : '') + '</div>' +
      '</div></div>'
    ).join('');

    if (append) channelGrid.insertAdjacentHTML('beforeend', html);
    else channelGrid.innerHTML = html;

    channelGrid.querySelectorAll('.card').forEach(card => {
      bindPlaybackPrepare(card);
      card.addEventListener('click', () => {
        const kind = card.dataset.kind || 'video';
        if (kind === 'playlist' || kind === 'post' || !/^[A-Za-z0-9_-]{11}$/.test(card.dataset.id || '')) {
          const externalUrl = card.dataset.url;
          if (externalUrl) window.open(externalUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        showWatch({
          id: card.dataset.id, title: card.dataset.title,
          channel: card.dataset.channel, thumb: card.dataset.thumb,
          channelId: card.dataset.channelId,
          description: card.dataset.description,
          liveStatus: card.dataset.liveStatus,
          isLive: card.dataset.isLive === '1',
        });
      });
    });
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function randomHaloUrl() {
    const n = HALO_MIN + Math.floor(Math.random() * (HALO_MAX - HALO_MIN + 1));
    return 'https://get.rec877.com/get/bluearchive/halo/halo' + n + '.png';
  }

  function setRandomFavicon() {
    const fav = document.getElementById('favicon');
    if (fav) fav.href = randomHaloUrl();
  }

  function setHeaderLogoHalo() {
    if (!headerLogo) return;
    headerLogo.classList.add('halo-image-mode');
    headerLogo.innerHTML = '<img class="header-logo-img" src="' + randomHaloUrl() + '" alt="Halo">';
  }

  function resetHeaderLogoText() {
    if (!headerLogo) return;
    headerLogoShuffleVersion += 1;
    headerLogo.dataset.shuffling = '';
    headerLogo.classList.remove('halo-image-mode');
    headerLogo.textContent = 'Halo';
  }

  function isMobileLayout() {
    return window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
  }

  function updateHeaderLogoForSearch() {
    headerLogoShuffleVersion += 1;
    if (isMobileLayout()) {
      if (headerLogo) headerLogo.dataset.shuffling = '';
      setHeaderLogoHalo();
    } else {
      resetHeaderLogoText();
    }
  }

  function shuffleHeaderLogo() {
    if (isMobileLayout()) return;
    if (!headerLogo || headerLogo.dataset.shuffling === '1') return;
    const shuffleVersion = headerLogoShuffleVersion + 1;
    headerLogoShuffleVersion = shuffleVersion;
    headerLogo.dataset.shuffling = '1';

    setHeaderLogoHalo();
    for (let i = 1; i <= 10; i++) {
      setTimeout(() => {
        if (headerLogoShuffleVersion === shuffleVersion) setHeaderLogoHalo();
      }, i * 60);
    }
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        if (headerLogoShuffleVersion === shuffleVersion) setHeaderLogoHalo();
      }, 600 + i * 300);
    }
    setTimeout(() => {
      if (headerLogoShuffleVersion !== shuffleVersion) return;
      setHeaderLogoHalo();
      headerLogo.dataset.shuffling = '';
    }, 2500);
  }

  const initialVideoId = getInitialVideoId();
  if (initialVideoId) {
    openInitialVideo(initialVideoId);
  } else {
    showHome();
  }

  updateServerStatus();
  setInterval(updateServerStatus, 60000);

  // Re-apply header mode on resize (handles orientation change)
  window.addEventListener('resize', () => {
    closeMobileMenu();
    // Re-evaluate header state based on current view
    const isHome = hero.style.display !== 'none';
    setHeaderHomeMode(isHome);
  });

  setRandomFavicon();

  // Account credentials stay in HttpOnly cookies, never in localStorage.
  let accountUser = null;
  const loginDefaultMarkup=loginIconBtn ? loginIconBtn.innerHTML : "";
  try { localStorage.removeItem('halo_auth'); } catch (_) {}
  let accountRefresh = null;
  async function accountApi(path, body, retry = true) {
    const response = await fetch(path, body === undefined ? {credentials:'same-origin'} : {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data = await response.json();
    if (response.status === 401 && retry && path !== '/api/auth/signin' && path !== '/api/account/refresh') {
      if (!accountRefresh) accountRefresh=accountApi('/api/account/refresh',{},false).finally(function(){accountRefresh=null;});
      try { await accountRefresh; return accountApi(path,body,false); } catch (_) {}
    }
    if (!response.ok) throw new Error(data.error || '処理に失敗しました');
    if (data.user) { accountUser=data.user; renderAuthButton(); }
    return data;
  }
  async function fetchAccountStream(url, options) {
    let response=await fetch(url,options);
    if(response.status===401){
      try { if(!accountRefresh)accountRefresh=accountApi('/api/account/refresh',{},false).finally(function(){accountRefresh=null;}); await accountRefresh; response=await fetch(url,options); } catch (_) {}
    }
    return response;
  }
  function accountBadge() {
    const badge=document.createElement('span');badge.className='account-verified-badge';badge.title='認証済み';badge.setAttribute('aria-label','認証済み');
    badge.style.cssText='display:inline-grid;place-items:center;width:18px;height:18px;flex-shrink:0;vertical-align:middle;line-height:1';
    const image=document.createElement('img');image.src='https://get.rec877.com/get/halotube/cdn/verify.svg';image.alt='';image.style.cssText='display:block;width:100%;height:100%;object-fit:contain';
    image.onerror=function(){badge.replaceChildren(document.createTextNode('✓'));badge.style.background='var(--accent)';badge.style.color='#fff';badge.style.borderRadius='50%';badge.style.fontSize='12px';badge.style.fontWeight='bold';};badge.appendChild(image);return badge;
  }
  function accountIdentity(user) {
    const wrap=document.createElement('span');wrap.dataset.accountIdentity='true';
    Object.assign(wrap.style,{display:'inline-flex',alignItems:'center',gap:'6px',minWidth:'0',maxWidth:'100%'});
    if (user.avatarUrl) {
      const avatar=document.createElement('img');avatar.src=user.avatarUrl;avatar.alt='';avatar.referrerPolicy='no-referrer';
      Object.assign(avatar.style,{width:'28px',height:'28px',borderRadius:'50%',objectFit:'cover',flexShrink:'0'});avatar.onerror=function(){avatar.remove();};wrap.appendChild(avatar);
    }
    const label=document.createElement('span');label.textContent=user.username || user.email;
    Object.assign(label.style,{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});wrap.appendChild(label);
    if(user.verifiedBadge)wrap.appendChild(accountBadge());return wrap;
  }
  function renderAuthButton() {
    if(loginIconBtn){
      loginIconBtn.innerHTML=loginDefaultMarkup;
      loginIconBtn.setAttribute('aria-label',accountUser?'アカウント設定':'ログイン');
      loginIconBtn.style.position='relative';loginIconBtn.style.overflow='visible';
      if(accountUser?.avatarUrl){
        const avatar=document.createElement('img');avatar.src=accountUser.avatarUrl;avatar.alt='';avatar.referrerPolicy='no-referrer';avatar.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%';
        avatar.onerror=function(){avatar.remove();const fallback=document.createElement('span');fallback.textContent=(accountUser?.username||accountUser?.email||'?').slice(0,1);loginIconBtn.prepend(fallback);};loginIconBtn.replaceChildren(avatar);
      }
      if(accountUser?.verifiedBadge){const badge=accountBadge();Object.assign(badge.style,{position:'absolute',right:'-5px',bottom:'-4px',width:'16px',height:'16px'});loginIconBtn.appendChild(badge);}
    }
    const area=document.getElementById('auth-btn-area');
    if(area){
      area.replaceChildren();const button=document.createElement('button');button.className='header-action donate-action';button.style.maxWidth='220px';
      if(accountUser){button.appendChild(accountIdentity(accountUser));button.onclick=function(){showAccountModal();};}
      else{button.textContent='ログイン / 登録';button.onclick=function(){showAuthModal('login');};}area.appendChild(button);
    }
    if(accountUser){
      document.querySelectorAll('#auth-modal [data-account-identity]').forEach(function(el){el.replaceWith(accountIdentity(accountUser));});
      const status=document.querySelector('#auth-modal [data-badge-status]');
      if(status)status.textContent=accountUser.verifiedBadge?'認証バッジ: 取得済み':'認証バッジ: 未取得（管理者権限とは別です）';
    }
  }
  let turnstileLoadPromise=null;
  async function loadAvatarTurnstile() {
    if(window.turnstile)return window.turnstile;
    if(!turnstileLoadPromise)turnstileLoadPromise=new Promise(function(resolve,reject){
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
      const timer=setTimeout(function(){script.remove();turnstileLoadPromise=null;reject(new Error('確認チェックを読み込めません。通信・拡張機能を確認してください'));},15000);
      script.onload=function(){clearTimeout(timer);if(window.turnstile)resolve(window.turnstile);else{turnstileLoadPromise=null;reject(new Error('確認チェックを読み込めません'));}};
      script.onerror=function(){clearTimeout(timer);script.remove();turnstileLoadPromise=null;reject(new Error('確認チェックを読み込めません'));};document.head.appendChild(script);
    });
    return turnstileLoadPromise;
  }
  function accountDialog(title) {
    const old=document.getElementById('auth-modal'); if(old){if(old.accountCleanup)old.accountCleanup();old.remove();}
    const cleanups=[];let busy=false;
    const overlay=document.createElement('div'); overlay.id='auth-modal';overlay.accountCleanup=function(){cleanups.splice(0).forEach(function(fn){fn();});};
    function dismiss(){if(busy){notice.textContent='保存中です。完了までお待ちください';return;}overlay.accountCleanup();overlay.remove();}
    Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'9999',background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'});
    const panel=document.createElement('section'); panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-label',title); panel.tabIndex=-1;
    Object.assign(panel.style,{background:'var(--surface)',color:'var(--text)',border:'1px solid var(--border)',borderRadius:'16px',padding:'24px',width:'440px',maxWidth:'100%',maxHeight:'85dvh',overflowY:'auto',boxSizing:'border-box'});
    const heading=document.createElement('h2'); heading.textContent=title; heading.style.marginBottom='16px'; panel.appendChild(heading);
    const notice=document.createElement('p'); notice.setAttribute('role','status'); notice.style.cssText='font-size:13px;overflow-wrap:anywhere;margin:12px 0;color:var(--accent)';
    const close=document.createElement('button'); close.type='button';close.className='account-close-button';close.textContent='閉じる';close.onclick=dismiss;
    overlay.appendChild(panel); document.body.appendChild(overlay);
    overlay.onclick=function(e){if(e.target===overlay)dismiss();};
    panel.addEventListener('keydown',function(e){
      if(e.key==='Escape')dismiss();
      if(e.key==='Tab'){const els=Array.from(panel.querySelectorAll('input,button,select,[tabindex="0"]')).filter(el=>!el.disabled);const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
    function input(label,type,value) {
      const wrap=document.createElement('label'); wrap.style.cssText='display:block;margin:12px 0;font-size:13px'; wrap.appendChild(document.createTextNode(label));
      const el=document.createElement('input'); el.type=type||'text'; el.value=value||'';
      el.style.cssText='display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text)';
      if(type==='password')el.autocomplete='current-password';
      wrap.appendChild(el); panel.appendChild(wrap); return el;
    }
    function action(label,fn) {
      const btn=document.createElement('button'); btn.type='button'; btn.textContent=label;
      btn.style.cssText='padding:10px 14px;margin:6px 6px 6px 0;max-width:100%;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);cursor:pointer';
      btn.onclick=async function(){if(busy)return;busy=true;const controls=Array.from(panel.querySelectorAll('input,button'));const previous=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);notice.textContent='処理中…';try{await fn();}catch(e){notice.textContent=e.message;}finally{busy=false;controls.forEach((el,i)=>el.disabled=previous[i]);if(btn.afterAction)btn.afterAction();}};
      panel.appendChild(btn); return btn;
    }
    function text(value){const p=document.createElement('p');p.textContent=value;p.style.cssText='font-size:13px;line-height:1.6;overflow-wrap:anywhere';panel.appendChild(p);return p;}
    function finish(){panel.appendChild(notice);panel.appendChild(close);const first=Array.from(panel.querySelectorAll('input:not([type="file"])')).find(el=>el.getClientRects().length);(first||panel).focus();}
    function avatar(value) {
      const defaultAvatar='https://get.rec877.com/get/halotube/cdn/def-icon.png';
      let current=value || '',selected='',token='',widgetId=null,disposed=false,selectionVersion=0;
      const preview=document.createElement('img');preview.alt='アイコンのプレビュー';preview.style.cssText='display:block;width:88px;height:88px;object-fit:cover;border-radius:50%;margin:16px auto';
      function showPreview(src){preview.style.display='block';preview.src=src || defaultAvatar;}
      preview.onerror=function(){if(preview.src!==defaultAvatar)showPreview(defaultAvatar);else preview.style.display='none';};
      showPreview(current);panel.appendChild(preview);
      if(!accountUser?.emailVerified){text('アイコンの変更には、ログインとメール確認が必要です。');action('初期アイコンに戻す',function(){current='';showPreview('');});return {get value(){return current;}};}
      text('画像を選ぶと自動で保存します。確認チェックが表示された場合は完了してください。');
      const file=input('画像を選択','file');file.accept='image/png,image/jpeg,image/webp';file.className='account-avatar-file';
      const challenge=document.createElement('div');challenge.style.cssText='margin:12px 0;max-width:100%';panel.appendChild(challenge);
      const upload=action('保存を再試行',async function(){
        if(!selected||!token)return;
        file.disabled=true;
        try{
          const result=await accountApi('/api/account/avatar',{image:selected,turnstileToken:token});
          if(disposed)return;
          current=result.user.avatarUrl;showPreview(current);selected='';file.value='';notice.textContent='アイコンを保存しました';upload.hidden=true;
        }catch(e){showPreview(current);upload.hidden=false;throw e;}
        finally{token='';file.disabled=false;if(widgetId!==null&&window.turnstile&&!disposed)window.turnstile.reset(widgetId);}
      });upload.hidden=true;upload.disabled=true;
      // Only a fresh challenge callback starts an automatic attempt; failures never loop.
      upload.afterAction=function(){file.disabled=false;upload.disabled=!selected||!token;};
      file.onchange=async function(){
        const version=++selectionVersion;selected='';upload.hidden=true;upload.disabled=true;const f=file.files[0];if(!f)return;
        file.disabled=true;notice.textContent='画像を準備しています…';
        try{
          if(f.size>5*1024*1024)throw new Error('元の画像は5MB以下にしてください');
          if(!['image/png','image/jpeg','image/webp'].includes(f.type))throw new Error('PNG/JPEG/WebPを選択してください');
          const bitmap=await createImageBitmap(f);
          try{if(bitmap.width*bitmap.height>16000000)throw new Error('画像は1600万画素以下にしてください');const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const side=Math.min(bitmap.width,bitmap.height);canvas.getContext('2d').drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,128,128);selected=canvas.toDataURL('image/png');if(selected.length>88000)throw new Error('画像を小さくして選び直してください');}finally{bitmap.close();}
          if(disposed||version!==selectionVersion){selected='';return;}showPreview(selected);notice.textContent='確認チェックが済むと自動保存します';
          if(widgetId===null){
            const config=await accountApi('/api/account/avatar-config');
            if(!config.enabled)throw new Error('画像アップロードは準備中です。画像URLも利用できます');
            const turnstile=await loadAvatarTurnstile();if(disposed||version!==selectionVersion)return;
            widgetId=turnstile.render(challenge,{sitekey:config.siteKey,action:'avatar_upload',size:'flexible',theme:'auto',callback:function(result){if(disposed||!selected)return;token=result;upload.disabled=false;if(upload.hidden)upload.click();},'expired-callback':function(){token='';upload.disabled=true;},'error-callback':function(){token='';upload.disabled=true;file.disabled=false;notice.textContent='確認チェックを再試行してください';}});
          }else{token='';window.turnstile.reset(widgetId);}
        }catch(e){selected='';showPreview(current);notice.textContent=e.message;}
        finally{if(!busy)file.disabled=false;}
      };
      const reset=action('初期アイコンに戻す',async function(){
        selectionVersion++;selected='';token='';file.value='';upload.hidden=true;if(widgetId!==null)window.turnstile.reset(widgetId);
        await accountApi('/api/account/profile',{username:accountUser.username,avatarUrl:''});current='';showPreview('');notice.textContent='初期アイコンに戻しました';
      });
      text('PNG・JPEG・WebP、5MBまで。画像の保存は1日3回、1分間隔です。');
      const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='画像URLから設定する';details.appendChild(summary);panel.appendChild(details);
      const url=input('HTTPSの画像URL','url',current.startsWith('data:')?'':current);details.appendChild(url.parentElement);
      const apply=action('このURLの画像に変更',async function(){
        if(!url.reportValidity())return;
        await accountApi('/api/account/profile',{username:accountUser.username,avatarUrl:url.value.trim()});
        selectionVersion++;selected='';token='';upload.hidden=true;file.value='';if(widgetId!==null)window.turnstile.reset(widgetId);current=url.value.trim();showPreview(current);notice.textContent='アイコンを保存しました';
      });details.appendChild(apply);
      cleanups.push(function(){disposed=true;if(widgetId!==null&&window.turnstile)window.turnstile.remove(widgetId);});
      return {get value(){return current;}};
    }
    return {panel,notice,input,action,text,finish,avatar,isBusy:function(){return busy;},cleanup:function(fn){cleanups.push(fn);}};
  }
  window.closeAuthModal=function(){const el=document.getElementById('auth-modal');if(el){if(el.accountCleanup)el.accountCleanup();el.remove();}};
  function accountPrimary(ui,label,fn){
    const button=ui.action(label,fn);button.style.cssText+=';display:block;width:100%;box-sizing:border-box;margin-right:0;background:var(--accent);color:#fff;font-weight:700;margin-top:18px';
    ui.panel.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.type!=='file'){e.preventDefault();if(!button.disabled)button.click();}});
    return button;
  }
  function accountCodeScreen(options,issued){
    const ui=accountDialog(options.title);ui.text(options.email+' に確認コードを送りました。メールに届いた8桁の数字を入力してください。');
    const code=ui.input('確認コード（8桁）');code.inputMode='numeric';code.autocomplete='one-time-code';code.maxLength=8;
    accountPrimary(ui,'確認して次へ',async function(){
      const value=code.value.trim();if(!/^[0-9]{8}$/.test(value))throw new Error('メールに届いた8桁の数字を入力してください');
      await options.verify({challengeId:issued.challengeId,code:value});
    });
    let remaining=60;
    const resend=ui.action('再送まで60秒',async function(){issued=await options.send();remaining=60;code.value='';ui.notice.textContent='新しいコードを送りました。最新のメールをご確認ください';});
    function refresh(){resend.disabled=remaining>0;resend.textContent=remaining>0?'再送まで'+remaining+'秒':'確認メールを再送';}resend.afterAction=refresh;refresh();
    const timer=setInterval(function(){if(remaining>0){remaining--;if(!ui.isBusy())refresh();}},1000);ui.cleanup(function(){clearInterval(timer);});
    ui.text('有効期限は10分です。届かない場合は迷惑メールもご確認ください。');
    ui.action('入力画面に戻る',options.back);ui.finish();
  }
  window.showAuthModal=function(mode,initialEmail) {
    if(mode==='signup'){
      const ui=accountDialog('アカウント作成');ui.text('1 / 3　メールアドレス');ui.text('最初にメールアドレスを確認します。');
      const email=ui.input('メールアドレス','email',initialEmail);email.autocomplete='email';
      accountPrimary(ui,'確認コードを送る',async function(){
        const address=email.value.trim();
        const send=function(){return accountApi('/api/account/register-code',{email:address},false);};
        const issued=await send();
        accountCodeScreen({title:'2 / 3　メールを確認',email:address,send,back:function(){showAuthModal('signup',address);},verify:async function(proof){
          const result=await accountApi('/api/account/register-verify',{email:address,...proof},false);
          showRegistrationProfile(address,result.registrationToken);
        }},issued);
      });
      ui.action('アカウントをお持ちの方はログイン',function(){showAuthModal('login',email.value);});ui.finish();return;
    }
    const ui=accountDialog('ログイン');
    const email=ui.input('メールアドレス','email',initialEmail);email.autocomplete='email';
    const password=ui.input('パスワード','password');password.autocomplete='current-password';
    accountPrimary(ui,'ログイン',async function(){await accountApi('/api/auth/signin',{email:email.value,password:password.value},false);closeAuthModal();});
    ui.action('新しくアカウントを作る',function(){showAuthModal('signup',email.value);});ui.finish();
  };
  function accountPasswordHelp(ui,password,confirm){
    const help=ui.text('必須：12〜128文字。\\n推奨：半角の英大文字・英小文字・数字・記号（! @ # など）を組み合わせてください。\\n認証サーバーの設定により、追加の文字種条件や流出済みパスワードの拒否が適用されます。');
    help.style.whiteSpace='pre-line';help.id='account-password-help';password.parentElement.after(help);password.setAttribute('aria-describedby',help.id);
    const status=ui.text('');status.id='account-password-check';status.setAttribute('aria-live','polite');confirm.parentElement.after(status);confirm.setAttribute('aria-describedby',status.id);
    password.minLength=12;password.maxLength=128;confirm.maxLength=128;
    function update(){
      const length=password.value.length;
      status.textContent=(length ? '文字数：'+length+' / 128（'+(length>=12&&length<=128?'文字数条件を満たしています':'12文字以上必要です')+'）' : '')+(confirm.value ? '　'+(password.value===confirm.value?'確認用と一致しています':'確認用と一致していません') : '');
    }
    password.addEventListener('input',update);confirm.addEventListener('input',update);update();
  }
  function showRegistrationProfile(email,registrationToken){
    const ui=accountDialog('3 / 3　アカウントを仕上げる');ui.text('メール確認済み：'+email);
    const username=ui.input('表示名（任意）');username.maxLength=40;username.autocomplete='nickname';ui.text('空欄の場合はメールアドレスを表示します。アイコンは登録後に設定できます。');
    const password=ui.input('パスワード（12〜128文字）','password');password.autocomplete='new-password';
    const confirm=ui.input('パスワードをもう一度','password');confirm.autocomplete='new-password';
    accountPasswordHelp(ui,password,confirm);
    accountPrimary(ui,'アカウントを作成',async function(){
      if(password.value.length<12||password.value.length>128)throw new Error('パスワードは12〜128文字で入力してください');
      if(password.value!==confirm.value)throw new Error('パスワードが一致していません');
      await accountApi('/api/auth/signup',{email,password:password.value,username:username.value,registrationToken},false);
      try{await accountApi('/api/auth/signin',{email,password:password.value},false);}
      catch(e){showAuthModal('login',email);document.querySelector('#auth-modal [role="status"]').textContent='アカウントは作成されました。ログインしてください。';return;}
      const done=accountDialog('登録が完了しました');done.panel.appendChild(accountIdentity(accountUser));done.text('ログイン済みです。このまま利用できます。');
      accountPrimary(done,'アイコンを設定する',showAccountAvatar);done.action('このまま使う',closeAuthModal);done.finish();
    });
    ui.action('メール確認からやり直す',function(){showAuthModal('signup',email);});ui.action('ログインへ',function(){showAuthModal('login',email);});ui.finish();
  }
  function showAccountAvatar(){const ui=accountDialog('プロフィールアイコン');ui.avatar(accountUser.avatarUrl);ui.action('アカウント設定に戻る',showAccountModal);ui.finish();}
  window.handleLogout=async function(){await accountApi('/api/account/logout',{});accountUser=null;renderAuthButton();closeAuthModal();};
  window.showAccountModal=function() {
    if(!accountUser)return showAuthModal('login');const user=accountUser,ui=accountDialog('アカウント設定');
    ui.panel.appendChild(accountIdentity(user));const badgeStatus=ui.text(user.verifiedBadge?'認証バッジ：取得済み':'認証バッジ：未取得');badgeStatus.dataset.badgeStatus='true';
    ui.action('アーカイブ動画一覧',showArchiveLibrary);
    accountApi('/api/account/session').catch(function(){});ui.text('ユーザーID：'+user.accountNumber);ui.text(user.email);
    if(!user.emailVerified){
      ui.text('メール確認が完了していません。');
      accountPrimary(ui,'メールアドレスを確認する',async function(){const send=()=>accountApi('/api/account/email-code',{});accountCodeScreen({title:'メールアドレスの確認',email:user.email,send,back:showAccountModal,verify:async function(proof){await accountApi('/api/account/verify-email',proof);showAccountModal();}},await send());});
    }
    ui.action('表示名を変更',function(){const view=accountDialog('表示名を変更');const name=view.input('表示名（空欄ならメールアドレス）','text',accountUser.username);name.maxLength=40;accountPrimary(view,'変更を保存',async function(){await accountApi('/api/account/profile',{username:name.value,avatarUrl:accountUser.avatarUrl});showAccountModal();});view.action('戻る',showAccountModal);view.finish();});
    ui.action('プロフィールアイコンを変更',showAccountAvatar);
    ui.action('メールアドレスを変更',function(){
      const view=accountDialog('メールアドレスを変更');view.text('1 / 2　新しいアドレスを入力');view.text('変更すると全端末で再ログインが必要です。');
      const email=view.input('新しいメールアドレス','email'),old=view.input('現在のパスワード','password');
      accountPrimary(view,'新しいアドレスにコードを送る',async function(){
        const values={email:email.value.trim(),currentPassword:old.value};const send=()=>accountApi('/api/account/email-change-code',values);
        accountCodeScreen({title:'2 / 2　新しいメールを確認',email:values.email,send,back:showAccountModal,verify:async function(proof){const r=await accountApi('/api/account/email',{...values,...proof});accountUser=null;renderAuthButton();showAuthModal('login',values.email);document.querySelector('#auth-modal [role="status"]').textContent=r.message;}},await send());
      });view.action('戻る',showAccountModal);view.finish();
    });
    ui.action('パスワードを変更',function(){
      const view=accountDialog('パスワードを変更');view.text('変更すると全端末で再ログインが必要です。');const old=view.input('現在のパスワード','password'),next=view.input('新しいパスワード（12〜128文字）','password'),confirm=view.input('新しいパスワードをもう一度','password');next.autocomplete=confirm.autocomplete='new-password';
      accountPasswordHelp(view,next,confirm);
      accountPrimary(view,'パスワードを変更',async function(){if(next.value!==confirm.value)throw new Error('新しいパスワードが一致していません');const r=await accountApi('/api/account/password',{currentPassword:old.value,newPassword:next.value});accountUser=null;renderAuthButton();showAuthModal('login',user.email);document.querySelector('#auth-modal [role="status"]').textContent=r.message;});view.action('戻る',showAccountModal);view.finish();
    });
    if(user.isAdmin){ui.action('認証バッジの管理',function(){const view=accountDialog('認証バッジの管理'),target=view.input('対象のユーザーID または メールアドレス');view.action('バッジを付与',async function(){const r=await accountApi('/api/account/admin/badge',{identifier:target.value,granted:true});view.notice.textContent=r.message;});view.action('バッジを解除・再取得を停止',async function(){const r=await accountApi('/api/account/admin/badge',{identifier:target.value,granted:false});view.notice.textContent=r.message;});view.action('戻る',showAccountModal);view.finish();});}
    ui.text('4時間を超える動画の再生には認証バッジが必要です。');ui.action('ログアウト',handleLogout);ui.finish();
  };
  if(loginIconBtn)loginIconBtn.addEventListener('click',function(){accountUser?showAccountModal():showAuthModal('login');});
  window.addEventListener('focus',function(){if(accountUser)accountApi('/api/account/session').catch(function(){});});
  renderAuthButton();
  accountApi('/api/account/session').catch(function(){});
  // Keep the access cookie fresh during native HLS and long-running playback.
  setInterval(function(){if(accountUser)accountApi('/api/account/refresh',{},false).catch(function(){accountUser=null;renderAuthButton();});}, 15*60*1000);

  function archivePageUrl(id, embed) {
    return shareBaseUrl.replace(/[/]+$/, '') + '/archive/' + (embed ? 'embed/' : '') + id;
  }
  function showArchiveSave(videoId, retryId) {
    closePlayerMenus();
    const ui=accountDialog('動画をアーカイブに保存');
    if(!accountUser?.verifiedBadge){
      ui.text('保存にはログインと認証バッジが必要です。保存済みの公開動画は一覧から見られます。');
      ui.action(accountUser?'アカウント設定':'ログイン',()=>accountUser?showAccountModal():showAuthModal('login'));
      ui.action('アーカイブ動画一覧',showArchiveLibrary);ui.finish();return;
    }
    if(!/^[A-Za-z0-9_-]{11}$/.test(videoId || '')){ui.text('保存する動画を開いてください。');ui.finish();return;}
    ui.text('Internet Archiveへ公開保存します。保存後は誰でも視聴・ダウンロードできます。非公開のバックアップには使えません。');
    ui.text('最大1080p・1GB・4時間以内。24時間で1人3回まで。画面を閉じても処理は続きます。');
    const label=document.createElement('label');label.style.cssText='display:flex;gap:10px;align-items:flex-start;margin:20px 0;line-height:1.7';
    const consent=document.createElement('input');consent.type='checkbox';consent.style.marginTop='6px';
    label.append(consent,document.createTextNode('公開保存できる権利または許可を持ち、Internet Archiveでの公開に同意します'));ui.panel.appendChild(label);
    const button=accountPrimary(ui,retryId?'保存を再試行':'公開アーカイブを作成',async()=>{
      if(!consent.checked)throw new Error('公開保存への同意を確認してください');
      await accountApi('/api/archives',{videoId,retryId,confirmPublic:true,confirmRights:true});showArchiveLibrary();
    });
    button.disabled=true;consent.onchange=()=>{button.disabled=!consent.checked;};
    ui.action('一覧に戻る',showArchiveLibrary);ui.finish();
  }
  function showArchiveLibrary() {
    closePlayerMenus();
    const ui=accountDialog('アーカイブ動画一覧');ui.panel.style.width='960px';
    ui.text('Internet Archiveに保存した動画を再生・共有できます。');
    const summary=ui.text('一覧を読み込み中…');summary.setAttribute('aria-live','polite');
    const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px;margin:16px 0';ui.panel.appendChild(grid);
    let limit=24,disposed=false,loading=false,lastItems='';
    const labels={queued:'保存待ち',downloading:'動画取得中',uploading:'アップロード中',processing:'公開準備中',ready:'保存完了',failed:'保存できませんでした'};
    function link(parent,label,url){const a=document.createElement('a');a.href=url;a.textContent=label;a.style.cssText='display:inline-block;color:var(--accent);margin:8px 12px 8px 0';parent.appendChild(a);return a;}
    function action(parent,label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.className='account-close-button';b.style.margin='6px 0';b.onclick=fn;parent.appendChild(b);}
    function sharing(item){
      const view=accountDialog('アーカイブを共有');view.text(item.title);
      const url=archivePageUrl(item.id,false),embed=archivePageUrl(item.id,true);
      const code='<iframe src="'+embed+'" title="アーカイブ動画" width="640" height="360" style="max-width:100%;border:0" allow="fullscreen" allowfullscreen loading="lazy"></iframe>';
      for(const [label,value] of [['サイトのURL',url],['埋め込みコード',code],['Internet ArchiveのURL',item.archiveUrl]]){
        const input=view.input(label,'text',value);input.readOnly=true;
        view.action(label+'をコピー',async()=>{try{await navigator.clipboard.writeText(value);view.notice.textContent='コピーしました';}catch{input.focus();input.select();view.notice.textContent='選択した内容をコピーしてください';}});
      }
      view.action('一覧に戻る',showArchiveLibrary);view.finish();
    }
    async function refresh(){
      if(disposed || loading)return;loading=true;
      try{
        let items=[],hasMore=false,configured=true;
        for(let offset=0;offset<limit;offset+=24){const data=await accountApi('/api/archives?offset='+offset);items=items.concat(data.items || []);hasMore=data.hasMore;configured=data.configured;if(!hasMore)break;}
        if(disposed)return;
        summary.textContent=!configured?'管理者によるInternet Archiveの設定が必要です。':items.length?'保存状況は自動で更新されます。':'まだアーカイブはありません。動画の共有メニューから保存できます。';
        more.disabled=!hasMore;more.hidden=!hasMore;
        const signature=JSON.stringify(items);
        if(signature===lastItems || grid.contains(document.activeElement))return;
        lastItems=signature;grid.replaceChildren();
        for(const item of items){
          const card=document.createElement('article');card.style.cssText='border:1px solid var(--border);border-radius:14px;overflow:hidden;background:var(--surface2);min-width:0';
          const img=document.createElement('img');img.src=item.state==='ready'?'https://archive.org/services/img/'+item.id:'https://i.ytimg.com/vi/'+item.videoId+'/mqdefault.jpg';img.alt='';img.loading='lazy';img.style.cssText='width:100%;aspect-ratio:16/9;object-fit:cover;background:#000';card.appendChild(img);
          const body=document.createElement('div');body.style.padding='16px';card.appendChild(body);
          const title=document.createElement('h3');title.textContent=item.title;title.style.cssText='font-size:16px;overflow-wrap:anywhere;margin-bottom:8px';body.appendChild(title);
          const state=document.createElement('p');state.textContent=labels[item.state] || item.state;state.style.color=item.state==='failed'?'#fb7185':'var(--accent)';body.appendChild(state);
          if(item.state!=='ready' && item.state!=='failed'){const progress=document.createElement('progress');progress.max=4;progress.value=['queued','downloading','uploading','processing'].indexOf(item.state);progress.setAttribute('aria-label',state.textContent);progress.style.cssText='width:100%;margin:12px 0;accent-color:var(--accent)';body.appendChild(progress);}
          if(item.error){const error=document.createElement('p');error.textContent=item.error;error.style.cssText='font-size:13px;line-height:1.6;margin:8px 0';body.appendChild(error);}
          if(item.state==='ready'){link(body,'再生する',archivePageUrl(item.id,false));action(body,'共有・埋め込み',()=>sharing(item));}
          if(item.canRetry)action(body,'再試行',()=>showArchiveSave(item.videoId,item.id));
          const original=link(body,'元の動画',item.sourceUrl);original.target='_blank';original.rel='noopener noreferrer';grid.appendChild(card);
        }
      }catch(e){if(!disposed)summary.textContent=e.message;}finally{loading=false;}
    }
    const more=ui.action('さらに読み込む',async()=>{limit+=24;await refresh();});more.hidden=true;
    ui.action('最新の状態に更新',refresh);ui.finish();
    const timer=setInterval(()=>{if(!document.hidden)void refresh();},10000);
    ui.cleanup(()=>{disposed=true;clearInterval(timer);});void refresh();
  }
  document.querySelectorAll('[data-open-archives]').forEach(el=>el.addEventListener('click',showArchiveLibrary));
  document.getElementById('archive-save').addEventListener('click',()=>showArchiveSave(currentVideoId));
  for(const id of ['mobile-hamburger-menu','mobile-logo-menu']){
    const menu=document.getElementById(id);if(menu){const b=document.createElement('button');b.type='button';b.className='mobile-menu-item';b.textContent='アーカイブ動画一覧';b.onclick=()=>{menu.classList.remove('open');showArchiveLibrary();};menu.appendChild(b);}
  }
  if(new URLSearchParams(location.search).has('archives'))showArchiveLibrary();

  // ─── Onboarding連携用フック ───────────────────────────────────────────
  window.__haloDoSearch = function(q) { try { doSearch(q); } catch (e) {} };
  window.__haloShowHome = function() { try { showHome(); } catch (e) {} };
})();

// ─── Access Guard (Email / License Key / QR-Discord) ───────────────────────────
(function() {
  'use strict';

  var TOKEN_KEY = 'halo_email_token';
  var LICENSE_KEY = 'halo_license_key';
  var APPROVAL_TOKEN_KEY = 'halo_approval_token';
  var DISCORD_URL = 'https://discord.gg/Rtrq8tfwfX';

  // ── ストレージヘルパー ────────────────────────────────────────────────
  function getStoredToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch(e) { return null; }
  }
  function saveToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch(e) {}
  }
  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch(e) {}
  }
  function getStoredLicenseKey() {
    try { return localStorage.getItem(LICENSE_KEY); } catch(e) { return null; }
  }
  function clearLicenseKey() {
    try { localStorage.removeItem(LICENSE_KEY); } catch(e) {}
  }
  function getStoredApprovalToken() {
    try { return localStorage.getItem(APPROVAL_TOKEN_KEY); } catch(e) { return null; }
  }
  function clearApprovalToken() {
    try { localStorage.removeItem(APPROVAL_TOKEN_KEY); } catch(e) {}
  }

  // ── 認証成功時フック（オンボーディングフローとの連携用）──────────────────
  function fireGateSuccess() {
    if (typeof window.__haloOnGateSuccess === 'function') {
      var cb = window.__haloOnGateSuccess;
      window.__haloOnGateSuccess = null;
      cb();
    }
  }

  // ── ライセンスキー検証（worker経由でSupabaseを叩く）───────────────────────
  function verifyLicenseKey(key, callback) {
    fetch('/api/license/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) { callback(null, data); })
    .catch(function(e) { callback(e, null); });
  }

  // ── 保存済み認証情報が有効か確認（メール→ライセンスキー→QR承諾の順）────────
  function checkStoredAuth(callback) {
    var token = getStoredToken();
    if (token) {
      fetch('/api/email/check?token=' + encodeURIComponent(token))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.valid) { callback(true); return; }
          clearToken();
          checkStoredLicenseKey(callback);
        })
        .catch(function() { checkStoredLicenseKey(callback); });
      return;
    }
    checkStoredLicenseKey(callback);
  }

  function checkStoredLicenseKey(callback) {
    var stored = getStoredLicenseKey();
    if (!stored) return checkApprovalToken(callback);
    verifyLicenseKey(stored, function(err, data) {
      if (!err && data && data.valid_stored === true) { callback(true); return; }
      checkApprovalToken(callback);
    });
  }

  function checkApprovalToken(callback) {
    var approvalToken = getStoredApprovalToken();
    if (!approvalToken) return callback(false);
    fetch('/api/approval/check?s=' + encodeURIComponent(approvalToken))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.approved) { callback(true); return; }
        clearApprovalToken();
        callback(false);
      })
      .catch(function() { callback(false); });
  }

  // ── 認証画面 HTML ────────────────────────────────────────────────────────
  function buildGateScreen() {
    var overlay = document.createElement('div');
    overlay.id = 'license-gate';
    overlay.innerHTML = [
      '<div style="',
        'position:fixed;inset:0;z-index:99999;',
        'background:#080a0f;',
        'display:flex;align-items:center;justify-content:center;padding:20px;',
        'font-family:Outfit,sans-serif;',
      '">',
        '<div style="',
          'background:#0e1117;border:1px solid rgba(255,255,255,0.08);',
          'border-radius:16px;padding:36px 32px;width:100%;max-width:520px;',
          'box-shadow:0 24px 64px rgba(0,0,0,0.6);',
          'display:flex;flex-direction:column;gap:20px;',
        '">',
          '<div style="text-align:center;">',
            '<div style="',
              'font-size:32px;font-weight:900;letter-spacing:-1px;',
              'background:linear-gradient(135deg,#5b8af5,#a78bfa);',
              '-webkit-background-clip:text;-webkit-text-fill-color:transparent;',
              'background-clip:text;margin-bottom:8px;',
            '">Halo</div>',
            '<p style="color:#6b7280;font-size:14px;line-height:1.6;">',
              'HaloTubeを利用するには認証が必要です。',
            '</p>',
          '</div>',
          // Discord join button
          '<a href="' + DISCORD_URL + '" target="_blank" rel="noopener noreferrer" style="',
            'display:flex;align-items:center;justify-content:center;gap:10px;',
            'background:#5865F2;border:none;border-radius:10px;padding:13px 20px;',
            'font-family:Outfit,sans-serif;font-size:14px;font-weight:700;',
            'color:#fff;text-decoration:none;transition:opacity 0.2s;',
          '" onmouseover="this.style.opacity=\\'0.85\\'" onmouseout="this.style.opacity=\\'1\\'">',
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">',
              '<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>',
            '</svg>',
            'Discordサーバーに参加する',
          '</a>',
          // Tabs
          '<div style="display:flex;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">',
            '<button id="ag-tab-email" onclick="agSwitchTab(\\'email\\')" style="',
              'flex:1;padding:10px;background:#161b26;border:none;',
              'font-family:Outfit,sans-serif;font-size:12px;font-weight:600;',
              'color:#e8eaf0;cursor:pointer;transition:background 0.2s;border-right:1px solid rgba(255,255,255,0.08);',
            '">📧 メール</button>',
            '<button id="ag-tab-key" onclick="agSwitchTab(\\'key\\')" style="',
              'flex:1;padding:10px;background:#0e1117;border:none;',
              'font-family:Outfit,sans-serif;font-size:12px;font-weight:600;',
              'color:#6b7280;cursor:pointer;transition:background 0.2s;border-right:1px solid rgba(255,255,255,0.08);',
            '">🔑 ライセンスキー</button>',
            '<button id="ag-tab-qr" onclick="agSwitchTab(\\'qr\\')" style="',
              'flex:1;padding:10px;background:#0e1117;border:none;',
              'font-family:Outfit,sans-serif;font-size:12px;font-weight:600;',
              'color:#6b7280;cursor:pointer;transition:background 0.2s;',
            '">📱 QR承諾</button>',
          '</div>',
          // ── Email panel ──
          '<div id="ag-panel-email" style="display:flex;flex-direction:column;gap:16px;">',
            '<div id="eg-panel-email" style="display:flex;flex-direction:column;gap:10px;">',
              '<label style="font-size:13px;color:#9ca3af;font-weight:500;">メールアドレス</label>',
              '<input id="eg-email-input" type="email" autocomplete="email" placeholder="you@example.com" style="',
                'background:#161b26;border:1px solid rgba(255,255,255,0.08);',
                'border-radius:10px;padding:12px 14px;',
                'font-family:Outfit,sans-serif;font-size:14px;',
                'color:#e8eaf0;outline:none;transition:border-color 0.2s,box-shadow 0.2s;',
                'width:100%;box-sizing:border-box;',
              '" />',
              '<div id="eg-email-error" style="',
                'color:#ef4444;font-size:13px;display:none;',
                'background:rgba(239,68,68,0.08);border-radius:8px;padding:10px 14px;',
              '"></div>',
              '<button id="eg-email-submit" style="',
                'background:linear-gradient(135deg,#5b8af5,#a78bfa);',
                'border:none;border-radius:10px;padding:14px;',
                'font-family:Outfit,sans-serif;font-size:15px;font-weight:700;',
                'color:#fff;cursor:pointer;transition:opacity 0.2s;',
              '">コードを送信</button>',
            '</div>',
            '<div id="eg-panel-code" style="display:none;flex-direction:column;gap:10px;">',
              '<p id="eg-code-sent-to" style="color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;"></p>',
              '<label style="font-size:13px;color:#9ca3af;font-weight:500;">認証コード（6桁）</label>',
              '<input id="eg-code-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" style="',
                'background:#161b26;border:1px solid rgba(255,255,255,0.08);',
                'border-radius:10px;padding:12px 14px;',
                'font-family:Space Mono,monospace;font-size:20px;letter-spacing:6px;text-align:center;',
                'color:#e8eaf0;outline:none;transition:border-color 0.2s,box-shadow 0.2s;',
                'width:100%;box-sizing:border-box;',
              '" />',
              '<div id="eg-code-error" style="',
                'color:#ef4444;font-size:13px;display:none;',
                'background:rgba(239,68,68,0.08);border-radius:8px;padding:10px 14px;',
              '"></div>',
              '<button id="eg-code-submit" style="',
                'background:linear-gradient(135deg,#5b8af5,#a78bfa);',
                'border:none;border-radius:10px;padding:14px;',
                'font-family:Outfit,sans-serif;font-size:15px;font-weight:700;',
                'color:#fff;cursor:pointer;transition:opacity 0.2s;',
              '">認証する</button>',
              '<div style="display:flex;justify-content:space-between;font-size:12px;">',
                '<a href="#" id="eg-back-link" style="color:#6b7280;text-decoration:none;">メールアドレスを変更</a>',
                '<a href="#" id="eg-resend-link" style="color:#5b8af5;text-decoration:none;font-weight:600;">コードを再送信</a>',
              '</div>',
            '</div>',
          '</div>',
          // ── License key panel ──
          '<div id="ag-panel-key" style="display:none;flex-direction:column;gap:10px;">',
            '<p style="color:#9ca3af;font-size:13px;line-height:1.6;">',
              'Discordサーバーで <code style="',
                'background:#161b26;padding:2px 6px;border-radius:4px;',
                'font-family:Space Mono,monospace;font-size:12px;color:#a78bfa;',
              '">/license</code> コマンドを実行して取得したキーを貼り付けてください。',
            '</p>',
            '<label style="font-size:13px;color:#9ca3af;font-weight:500;">',
              'ライセンスキー',
            '</label>',
            '<textarea id="lg-key-input" placeholder="256桁のライセンスキーを貼り付けてください" style="',
              'background:#161b26;border:1px solid rgba(255,255,255,0.08);',
              'border-radius:10px;padding:12px 14px;',
              'font-family:Space Mono,monospace;font-size:11px;',
              'color:#e8eaf0;resize:vertical;min-height:80px;',
              'outline:none;transition:border-color 0.2s,box-shadow 0.2s;width:100%;',
              'line-break:anywhere;word-break:break-all;box-sizing:border-box;',
            '"></textarea>',
            '<div id="lg-error" style="',
              'color:#ef4444;font-size:13px;display:none;',
              'background:rgba(239,68,68,0.08);border-radius:8px;padding:10px 14px;',
            '"></div>',
            '<button id="lg-submit" style="',
              'background:linear-gradient(135deg,#5b8af5,#a78bfa);',
              'border:none;border-radius:10px;padding:14px;',
              'font-family:Outfit,sans-serif;font-size:15px;font-weight:700;',
              'color:#fff;cursor:pointer;transition:opacity 0.2s;',
            '">認証する</button>',
          '</div>',
          // ── QR panel ──
          '<div id="ag-panel-qr" style="display:none;flex-direction:column;gap:14px;align-items:center;">',
            '<p style="color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">',
              'Discordで承諾権限を持つ人にこのQRコードを読み取ってもらい、<br>承諾ボタンを押してもらうとアクセスできます。',
            '</p>',
            '<div id="lg-qr-container" style="',
              'background:#fff;padding:16px;border-radius:12px;',
              'display:flex;align-items:center;justify-content:center;',
              'min-height:200px;min-width:200px;',
            '">',
              '<div style="color:#6b7280;font-size:13px;">QRコード生成中…</div>',
            '</div>',
            '<div id="lg-qr-timer" style="',
              'font-family:Space Mono,monospace;font-size:13px;color:#6b7280;',
            '"></div>',
            '<div id="lg-qr-status" style="',
              'font-size:13px;color:#22c55e;display:none;text-align:center;',
              'background:rgba(34,197,94,0.08);border-radius:8px;padding:10px 14px;width:100%;box-sizing:border-box;',
            '"></div>',
            '<div id="lg-qr-error" style="',
              'color:#ef4444;font-size:13px;display:none;',
              'background:rgba(239,68,68,0.08);border-radius:8px;padding:10px 14px;width:100%;box-sizing:border-box;',
            '"></div>',
            '<button id="lg-qr-refresh" onclick="lgQrRefresh()" style="',
              'background:#161b26;border:1px solid rgba(255,255,255,0.08);border-radius:8px;',
              'padding:9px 18px;font-family:Outfit,sans-serif;font-size:13px;font-weight:600;',
              'color:#9ca3af;cursor:pointer;display:none;',
            '">🔄 新しいQRコードを生成</button>',
          '</div>',
        '</div>',
      '</div>',
    ].join('');
    return overlay;
  }

  // ── タブ切り替え ────────────────────────────────────────────────────────
  window.agSwitchTab = function(tab) {
    var panelEmail = document.getElementById('ag-panel-email');
    var panelKey   = document.getElementById('ag-panel-key');
    var panelQr    = document.getElementById('ag-panel-qr');
    var tabEmail   = document.getElementById('ag-tab-email');
    var tabKey     = document.getElementById('ag-tab-key');
    var tabQr      = document.getElementById('ag-tab-qr');

    var panels = { email: panelEmail, key: panelKey, qr: panelQr };
    var tabs   = { email: tabEmail, key: tabKey, qr: tabQr };

    Object.keys(panels).forEach(function(name) {
      var isActive = name === tab;
      panels[name].style.display = isActive ? 'flex' : 'none';
      tabs[name].style.background = isActive ? '#161b26' : '#0e1117';
      tabs[name].style.color      = isActive ? '#e8eaf0' : '#6b7280';
    });

    if (tab === 'qr' && !window._lgQrSessionId) lgQrInit();
  };

  function showFieldError(id, msg) {
    var el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }
  function clearFieldError(id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  }

  // ── メール認証フロー ───────────────────────────────────────────────────
  var EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  var currentEmail = '';

  function showEmailStep() {
    var panelEmail = document.getElementById('eg-panel-email');
    var panelCode  = document.getElementById('eg-panel-code');
    if (panelEmail) panelEmail.style.display = 'flex';
    if (panelCode)  panelCode.style.display  = 'none';
    clearFieldError('eg-code-error');
  }

  function showCodeStep(email) {
    var panelEmail = document.getElementById('eg-panel-email');
    var panelCode  = document.getElementById('eg-panel-code');
    var sentTo     = document.getElementById('eg-code-sent-to');
    if (panelEmail) panelEmail.style.display = 'none';
    if (panelCode)  panelCode.style.display  = 'flex';
    if (sentTo) sentTo.textContent = email + ' に認証コードを送信しました。';
    clearFieldError('eg-email-error');
    var codeInput = document.getElementById('eg-code-input');
    if (codeInput) { codeInput.value = ''; codeInput.focus(); }
  }

  function requestCode(email, btn) {
    clearFieldError('eg-email-error');
    if (!EMAIL_RE.test(email)) {
      showFieldError('eg-email-error', 'メールアドレスの形式が正しくありません。');
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = '送信中…'; btn.style.opacity = '0.7'; }
    fetch('/api/email/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    })
      .then(function(r) { return r.json().then(function(data) { return { ok: r.ok, data: data }; }); })
      .then(function(res) {
        if (btn) { btn.disabled = false; btn.textContent = 'コードを送信'; btn.style.opacity = '1'; }
        if (!res.ok || res.data.error) {
          showFieldError('eg-email-error', (res.data && res.data.error) || '送信に失敗しました。しばらくしてから再度お試しください。');
          return;
        }
        currentEmail = email;
        showCodeStep(email);
      })
      .catch(function() {
        if (btn) { btn.disabled = false; btn.textContent = 'コードを送信'; btn.style.opacity = '1'; }
        showFieldError('eg-email-error', '通信エラーが発生しました。しばらくしてから再度お試しください。');
      });
  }

  function verifyCode(code, btn) {
    clearFieldError('eg-code-error');
    if (!/^[0-9]{6}$/.test(code)) {
      showFieldError('eg-code-error', '6桁のコードを入力してください。');
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = '認証中…'; btn.style.opacity = '0.7'; }
    fetch('/api/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, code: code }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (btn) { btn.disabled = false; btn.textContent = '認証する'; btn.style.opacity = '1'; }
        if (data && data.valid && data.token) {
          saveToken(data.token);
          var gate = document.getElementById('license-gate');
          if (gate) gate.remove();
          fireGateSuccess();
          return;
        }
        showFieldError('eg-code-error', (data && data.message) || 'コードが正しくありません。');
      })
      .catch(function() {
        if (btn) { btn.disabled = false; btn.textContent = '認証する'; btn.style.opacity = '1'; }
        showFieldError('eg-code-error', '通信エラーが発生しました。しばらくしてから再度お試しください。');
      });
  }

  // ── QR承諾フロー ───────────────────────────────────────────────────────
  var _lgQrTimer = null;
  var _lgQrPollTimer = null;

  window.lgQrRefresh = function() { lgQrInit(); };

  function lgQrInit() {
    clearInterval(_lgQrTimer);
    clearInterval(_lgQrPollTimer);
    window._lgQrSessionId = null;

    var container = document.getElementById('lg-qr-container');
    var statusEl  = document.getElementById('lg-qr-status');
    var errorEl   = document.getElementById('lg-qr-error');
    var timerEl   = document.getElementById('lg-qr-timer');
    var refreshBtn= document.getElementById('lg-qr-refresh');
    if (container) container.innerHTML = '<div style="color:#6b7280;font-size:13px;">QRコード生成中…</div>';
    if (statusEl)  { statusEl.style.display  = 'none'; statusEl.textContent  = ''; }
    if (errorEl)   { errorEl.style.display   = 'none'; errorEl.textContent   = ''; }
    if (timerEl)   timerEl.textContent = '';
    if (refreshBtn) refreshBtn.style.display = 'none';

    fetch('/api/approval/request', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.session_id) throw new Error('セッションIDの取得に失敗しました');
        window._lgQrSessionId = data.session_id;

        var approveUrl = location.origin + '/approve?s=' + encodeURIComponent(data.session_id);
        lgRenderQR(container, approveUrl);

        var EXPIRE_MS = 5 * 60 * 1000;
        var startTime = Date.now();
        function updateTimer() {
          var remaining = EXPIRE_MS - (Date.now() - startTime);
          if (remaining <= 0) {
            clearInterval(_lgQrTimer);
            clearInterval(_lgQrPollTimer);
            if (timerEl) timerEl.textContent = '期限切れ';
            if (container) container.innerHTML = '<div style="color:#6b7280;font-size:13px;text-align:center;">QRコードの有効期限が切れました</div>';
            if (refreshBtn) refreshBtn.style.display = 'block';
            return;
          }
          var m = Math.floor(remaining / 60000);
          var s = Math.floor((remaining % 60000) / 1000);
          if (timerEl) timerEl.textContent = '有効期限: ' + m + ':' + (s < 10 ? '0' : '') + s;
        }
        updateTimer();
        _lgQrTimer = setInterval(updateTimer, 1000);

        _lgQrPollTimer = setInterval(function() {
          fetch('/api/approval/check?s=' + encodeURIComponent(data.session_id))
            .then(function(r) { return r.json(); })
            .then(function(res) {
              if (res.approved) {
                clearInterval(_lgQrTimer);
                clearInterval(_lgQrPollTimer);
                if (timerEl) timerEl.textContent = '';
                if (statusEl) { statusEl.textContent = '✅ 承諾されました！アクセスを許可します…'; statusEl.style.display = 'block'; }
                setTimeout(function() {
                  try { localStorage.setItem(APPROVAL_TOKEN_KEY, res.token || data.session_id); } catch(e) {}
                  var gate = document.getElementById('license-gate');
                  if (gate) gate.remove();
                  fireGateSuccess();
                }, 1200);
              }
            })
            .catch(function() {});
        }, 3000);
      })
      .catch(function(e) {
        if (container) container.innerHTML = '<div style="color:#ef4444;font-size:13px;text-align:center;">エラー: ' + (e.message || 'QRコードの生成に失敗しました') + '</div>';
        if (refreshBtn) refreshBtn.style.display = 'block';
      });
  }

  function lgRenderQR(container, text) {
    var size = 200;
    var img = document.createElement('img');
    img.alt = 'QRコード';
    img.style.cssText = 'width:' + size + 'px;height:' + size + 'px;display:block;';
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text) + '&color=000000&bgcolor=ffffff&qzone=1';
    img.onerror = function() {
      container.innerHTML = '<div style="color:#ef4444;font-size:12px;text-align:center;padding:10px;">QR画像の読み込みに失敗しました<br><a href="' + text + '" style="color:#5b8af5;word-break:break-all;">' + text + '</a></div>';
    };
    if (container) {
      container.innerHTML = '';
      container.appendChild(img);
    }
  }

  // ── ゲート表示 ────────────────────────────────────────────────────────
  function showGate() {
    var screen = buildGateScreen();
    document.body.appendChild(screen);

    // Email tab wiring
    var emailInput  = document.getElementById('eg-email-input');
    var emailBtn    = document.getElementById('eg-email-submit');
    var codeInput   = document.getElementById('eg-code-input');
    var codeBtn     = document.getElementById('eg-code-submit');
    var backLink    = document.getElementById('eg-back-link');
    var resendLink  = document.getElementById('eg-resend-link');

    [emailInput, codeInput].forEach(function(input) {
      if (!input) return;
      input.addEventListener('focus', function() {
        input.style.borderColor = '#5b8af5';
        input.style.boxShadow   = '0 0 0 3px rgba(91,138,245,0.15)';
      });
      input.addEventListener('blur', function() {
        input.style.borderColor = 'rgba(255,255,255,0.08)';
        input.style.boxShadow   = 'none';
      });
    });

    if (emailBtn) emailBtn.addEventListener('click', function() {
      requestCode((emailInput.value || '').trim(), emailBtn);
    });
    if (emailInput) emailInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') requestCode((emailInput.value || '').trim(), emailBtn);
    });

    if (codeBtn) codeBtn.addEventListener('click', function() {
      verifyCode((codeInput.value || '').trim(), codeBtn);
    });
    if (codeInput) codeInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') verifyCode((codeInput.value || '').trim(), codeBtn);
    });

    if (backLink) backLink.addEventListener('click', function(e) {
      e.preventDefault();
      showEmailStep();
    });
    if (resendLink) resendLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentEmail) requestCode(currentEmail, null);
    });

    // License key tab wiring
    var keyBtn   = document.getElementById('lg-submit');
    var keyInput = document.getElementById('lg-key-input');

    keyInput.addEventListener('focus', function() {
      keyInput.style.borderColor = '#5b8af5';
      keyInput.style.boxShadow   = '0 0 0 3px rgba(91,138,245,0.15)';
    });
    keyInput.addEventListener('blur', function() {
      keyInput.style.borderColor = 'rgba(255,255,255,0.08)';
      keyInput.style.boxShadow   = 'none';
    });

    keyBtn.addEventListener('click', function() {
      var key = (keyInput.value || '').trim();
      clearFieldError('lg-error');

      if (!key) {
        showFieldError('lg-error', 'ライセンスキーを入力してください。');
        return;
      }
      if (key.length !== 256) {
        showFieldError('lg-error', 'ライセンスキーは256文字である必要があります（現在: ' + key.length + '文字）。');
        return;
      }

      keyBtn.disabled = true;
      keyBtn.textContent = '認証中…';
      keyBtn.style.opacity = '0.7';

      verifyLicenseKey(key, function(err, data) {
        keyBtn.disabled = false;
        keyBtn.textContent = '認証する';
        keyBtn.style.opacity = '1';

        if (err || !data) {
          showFieldError('lg-error', '通信エラーが発生しました。しばらくしてから再度お試しください。');
          return;
        }
        if (data.error) {
          showFieldError('lg-error', data.error);
          return;
        }
        if (data.valid) {
          try { localStorage.setItem(LICENSE_KEY, key); } catch(e) {}
          var gate = document.getElementById('license-gate');
          if (gate) gate.remove();
          fireGateSuccess();
        } else {
          showFieldError('lg-error', data.message || 'ライセンスキーが無効または期限切れです。');
        }
      });
    });

    keyInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) keyBtn.click();
    });
  }

  window.__haloShowGate = showGate;

  // ── 起動時チェック ─────────────────────────────────────────────────────
  function init() {
    checkStoredAuth(function(isValid) {
      if (isValid) return;
      if (typeof window.__haloStartOnboarding === 'function') {
        window.__haloStartOnboarding(showGate);
      } else {
        showGate();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ─── 初回利用者オンボーディング（BGM → ようこそ → 認証 → 興味選択 → 完了）──────
(function() {
  'use strict';

  var ONBOARD_KEY = 'halo_onboarding_done';
  var INTERESTS_KEY = 'halo_interests';
  var BGM_URL = 'https://get.rec877.com/get/halotube/cdn/Calm_Waters.mp3';

  var GAMES = [
    { name: 'Minecraft',      img: 'https://get.rec877.com/get/halotube/cdn/games/minecraft.webp' },
    { name: 'Fortnite',       img: 'https://get.rec877.com/get/halotube/cdn/games/fortnite.webp' },
    { name: 'Geometry Dash',  img: 'https://get.rec877.com/get/halotube/cdn/games/geometry_dash.webp' },
    { name: 'VALORANT',       img: 'https://get.rec877.com/get/halotube/cdn/games/valorant.webp' },
    { name: 'Brawl Stars',    img: 'https://get.rec877.com/get/halotube/cdn/games/brawl_stars.webp' },
    { name: 'ブルーアーカイブ', img: 'https://get.rec877.com/get/halotube/cdn/games/bluearchive.webp' }
  ];
  var SPORTS = [
    { name: 'サッカー', icon: '⚽' },
    { name: '野球',     icon: '⚾' }
  ];

  var bgmAudio = null;
  var selectedInterests = [];

  function isOnboardingDone() {
    try { return localStorage.getItem(ONBOARD_KEY) === '1'; } catch (e) { return false; }
  }
  function setOnboardingDone() {
    try { localStorage.setItem(ONBOARD_KEY, '1'); } catch (e) {}
  }

  function playBgm() {
    try {
      bgmAudio = new Audio(BGM_URL);
      bgmAudio.loop = true;
      bgmAudio.volume = 0.5;
      var p = bgmAudio.play();
      if (p && typeof p.catch === 'function') p.catch(function() {});
    } catch (e) {}
  }
  function stopBgm() {
    if (bgmAudio) {
      try { bgmAudio.pause(); bgmAudio.currentTime = 0; } catch (e) {}
      bgmAudio = null;
    }
  }

  function removeOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  function baseOverlay(id) {
    var overlay = document.createElement('div');
    overlay.id = id;
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '100000',
      background: '#080a0f', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', fontFamily: 'Outfit, sans-serif',
      textAlign: 'center', overflowY: 'auto', boxSizing: 'border-box',
    });
    return overlay;
  }

  // ── Step 1: BGM再生の案内 ──────────────────────────────────────────────
  function showBgmPrompt(next) {
    var overlay = baseOverlay('ob-bgm-prompt');
    overlay.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:18px;align-items:center;max-width:420px;">' +
        '<div style="font-size:40px;">🎵</div>' +
        '<p style="color:#e8eaf0;font-size:17px;font-weight:700;line-height:1.6;">この質問ではBGMが流れます</p>' +
        '<p style="color:#9ca3af;font-size:13px;line-height:1.7;">スペースキーを押すか、画面をタップするとBGMが再生されます。</p>' +
        '<div id="ob-bgm-hint" style="color:#5b8af5;font-size:13px;font-weight:700;">▶ タップ / スペースキーで開始</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var started = false;
    function start() {
      if (started) return;
      started = true;
      playBgm();
      document.removeEventListener('keydown', onKey);
      overlay.removeEventListener('click', start);
      removeOverlay('ob-bgm-prompt');
      next();
    }
    function onKey(e) {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); start(); }
    }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', start);
  }

  // ── Step 2: ようこそ画面（認証への案内）───────────────────────────────
  function showWelcome(next) {
    var overlay = baseOverlay('ob-welcome');
    overlay.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:16px;align-items:center;max-width:440px;">' +
        '<div style="font-size:44px;">👋</div>' +
        '<div style="font-size:26px;font-weight:900;letter-spacing:-0.5px;' +
          'background:linear-gradient(135deg,#5b8af5,#a78bfa);-webkit-background-clip:text;' +
          '-webkit-text-fill-color:transparent;background-clip:text;">HaloTubeへようこそ</div>' +
        '<p style="color:#9ca3af;font-size:14px;line-height:1.7;">まずは認証を完了してください。</p>' +
        '<button id="ob-welcome-next" style="' +
          'background:linear-gradient(135deg,#5b8af5,#a78bfa);border:none;border-radius:10px;' +
          'padding:13px 32px;font-family:Outfit,sans-serif;font-size:15px;font-weight:700;' +
          'color:#fff;cursor:pointer;">認証へ進む</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('ob-welcome-next').addEventListener('click', function() {
      removeOverlay('ob-welcome');
      next();
    });
  }

  // ── 興味トグル（選択と同時に自動検索）─────────────────────────────────
  function toggleInterest(name) {
    var idx = selectedInterests.indexOf(name);
    if (idx === -1) {
      selectedInterests.push(name);
      if (typeof window.__haloDoSearch === 'function') window.__haloDoSearch(name);
      return true;
    }
    selectedInterests.splice(idx, 1);
    return false;
  }

  // ── Step 3: 興味のあるコンテンツ選択画面 ──────────────────────────────
  function showInterestSelect(next) {
    var overlay = baseOverlay('ob-interests');

    var gamesHtml = GAMES.map(function(g) {
      return '<div class="ob-game-card" data-name="' + g.name.replace(/"/g, '&quot;') + '" style="' +
        'position:relative;border-radius:14px;overflow:hidden;cursor:pointer;aspect-ratio:1/1;' +
        'border:2px solid rgba(255,255,255,0.08);transition:border-color .15s;">' +
        '<img src="' + g.img + '" alt="' + g.name + '" style="width:100%;height:100%;object-fit:cover;display:block;" />' +
        '<div style="position:absolute;left:0;right:0;bottom:0;padding:8px 10px;' +
          'background:linear-gradient(transparent,rgba(0,0,0,0.85));font-size:12px;font-weight:700;color:#fff;">' +
          g.name +
        '</div>' +
        '<div class="ob-game-check" style="position:absolute;top:8px;right:8px;width:24px;height:24px;' +
          'border-radius:50%;background:rgba(91,138,245,0.9);border:2px solid #fff;display:flex;' +
          'align-items:center;justify-content:center;font-size:13px;color:#fff;opacity:0;transition:opacity .15s;">✓</div>' +
      '</div>';
    }).join('');

    var sportsHtml = SPORTS.map(function(s) {
      return '<button class="ob-sport-chip" data-name="' + s.name + '" style="' +
        'display:flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;' +
        'border:2px solid rgba(255,255,255,0.08);background:#161b26;color:#e8eaf0;' +
        'font-family:Outfit,sans-serif;font-size:14px;font-weight:600;cursor:pointer;' +
        'transition:border-color .15s,background .15s;">' +
        '<span style="font-size:18px;">' + s.icon + '</span>' + s.name +
      '</button>';
    }).join('');

    overlay.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:28px;align-items:center;max-width:640px;width:100%;">' +
        '<div>' +
          '<div style="font-size:21px;font-weight:800;color:#e8eaf0;margin-bottom:6px;">' +
            '🎯 あなたの興味があるコンテンツを教えてください' +
          '</div>' +
          '<p style="color:#6b7280;font-size:13px;">気になるものをタップして選んでください（複数選択可）</p>' +
        '</div>' +
        '<div style="width:100%;text-align:left;">' +
          '<div style="color:#9ca3af;font-size:13px;font-weight:700;margin-bottom:10px;">🎮 ゲーム</div>' +
          '<div id="ob-games-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' + gamesHtml + '</div>' +
        '</div>' +
        '<div style="width:100%;text-align:left;">' +
          '<div style="color:#9ca3af;font-size:13px;font-weight:700;margin-bottom:10px;">⚽ スポーツ</div>' +
          '<div id="ob-sports-row" style="display:flex;gap:12px;flex-wrap:wrap;">' + sportsHtml + '</div>' +
        '</div>' +
        '<button id="ob-interests-next" style="' +
          'background:linear-gradient(135deg,#5b8af5,#a78bfa);border:none;border-radius:10px;' +
          'padding:14px 40px;font-family:Outfit,sans-serif;font-size:15px;font-weight:700;color:#fff;cursor:pointer;">' +
          '次へ' +
        '</button>' +
      '</div>';

    document.body.appendChild(overlay);

    var cards = overlay.querySelectorAll('.ob-game-card');
    for (var i = 0; i < cards.length; i++) {
      (function(card) {
        card.addEventListener('click', function() {
          var name = card.getAttribute('data-name');
          var selected = toggleInterest(name);
          card.style.borderColor = selected ? '#5b8af5' : 'rgba(255,255,255,0.08)';
          var check = card.querySelector('.ob-game-check');
          if (check) check.style.opacity = selected ? '1' : '0';
        });
      })(cards[i]);
    }

    var chips = overlay.querySelectorAll('.ob-sport-chip');
    for (var j = 0; j < chips.length; j++) {
      (function(chip) {
        chip.addEventListener('click', function() {
          var name = chip.getAttribute('data-name');
          var selected = toggleInterest(name);
          chip.style.borderColor = selected ? '#5b8af5' : 'rgba(255,255,255,0.08)';
          chip.style.background = selected ? 'rgba(91,138,245,0.15)' : '#161b26';
        });
      })(chips[j]);
    }

    document.getElementById('ob-interests-next').addEventListener('click', function() {
      try { localStorage.setItem(INTERESTS_KEY, JSON.stringify(selectedInterests)); } catch (e) {}
      removeOverlay('ob-interests');
      next();
    });
  }

  // ── Step 4: 完了画面 → トップへ ────────────────────────────────────────
  function showComplete() {
    var overlay = baseOverlay('ob-complete');
    overlay.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:14px;align-items:center;">' +
        '<div style="font-size:44px;">✅</div>' +
        '<div style="font-size:20px;font-weight:800;color:#e8eaf0;">準備が完了しました！</div>' +
      '</div>';
    document.body.appendChild(overlay);
    setTimeout(function() {
      removeOverlay('ob-complete');
      stopBgm();
      setOnboardingDone();
      if (typeof window.__haloShowHome === 'function') window.__haloShowHome();
    }, 1400);
  }

  // ── エントリーポイント（アクセスガードのinit()から呼ばれる）───────────
  window.__haloStartOnboarding = function(showGateFn) {
    if (isOnboardingDone() || typeof showGateFn !== 'function') {
      if (typeof showGateFn === 'function') showGateFn();
      return;
    }
    showBgmPrompt(function() {
      showWelcome(function() {
        window.__haloOnGateSuccess = function() {
          showInterestSelect(function() {
            showComplete();
          });
        };
        showGateFn();
      });
    });
  };
})();
// ─── Sudoku Easter Egg ───────────────────────────────────────────────────────
function launchSudoku() {
  if (document.getElementById('sudoku-overlay')) return;

  // ── Puzzle generator (backtracking) ──────────────────────────────────────
  function makeFull() {
    const b = Array.from({length:9}, () => Array(9).fill(0));
    function ok(b, r, c, n) {
      for (let i=0;i<9;i++) if (b[r][i]===n || b[i][c]===n) return false;
      const br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3;
      for (let i=0;i<3;i++) for (let j=0;j<3;j++) if (b[br+i][bc+j]===n) return false;
      return true;
    }
    function fill(pos) {
      if (pos===81) return true;
      const r=Math.floor(pos/9), c=pos%9;
      const nums=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);
      for (const n of nums) {
        if (ok(b,r,c,n)) { b[r][c]=n; if (fill(pos+1)) return true; b[r][c]=0; }
      }
      return false;
    }
    fill(0);
    return b;
  }

  function makePuzzle(full, clues=35) {
    const p = full.map(r=>[...r]);
    let removed = 0;
    const cells = [...Array(81).keys()].sort(()=>Math.random()-0.5);
    for (const idx of cells) {
      if (removed >= 81-clues) break;
      const r=Math.floor(idx/9), c=idx%9, v=p[r][c];
      p[r][c]=0; removed++;
      // quick uniqueness check (skip for speed, puzzle is still solvable)
    }
    return p;
  }

  const full = makeFull();
  const puzzle = makePuzzle(full, 35);
  const given = puzzle.map(r=>r.map(v=>v!==0));
  const board = puzzle.map(r=>[...r]);
  let selected = null;
  let mistakes = 0;
  let won = false;
  const MAX_MISTAKES = 3;

  // ── DOM ──────────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'sudoku-overlay';
  Object.assign(overlay.style, {
    position:'fixed', inset:'0', zIndex:'99998',
    background:'rgba(8,10,15,0.92)', backdropFilter:'blur(12px)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:"'Outfit',sans-serif",
  });

  const box = document.createElement('div');
  Object.assign(box.style, {
    background:'var(--surface,#0e1117)', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:'20px', padding:'28px 28px 24px', boxShadow:'0 32px 80px rgba(0,0,0,0.7)',
    display:'flex', flexDirection:'column', alignItems:'center', gap:'16px',
    maxWidth:'420px', width:'calc(100vw - 32px)',
  });

  // Header
  const hdr = document.createElement('div');
  Object.assign(hdr.style, { display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' });
  const title = document.createElement('div');
  Object.assign(title.style, {
    fontSize:'18px', fontWeight:'700',
    background:'linear-gradient(135deg,#5b8af5,#a78bfa)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
  });
  title.textContent = '数独';
  const closeBtn = document.createElement('button');
  Object.assign(closeBtn.style, {
    background:'none', border:'none', color:'#6b7280', cursor:'pointer',
    fontSize:'20px', lineHeight:'1', padding:'4px 8px', borderRadius:'6px',
  });
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => overlay.remove());

  const mistakeEl = document.createElement('div');
  Object.assign(mistakeEl.style, { fontSize:'13px', color:'#6b7280', letterSpacing:'0.05em' });

  hdr.appendChild(title);
  hdr.appendChild(mistakeEl);
  hdr.appendChild(closeBtn);
  box.appendChild(hdr);

  function updateMistakes() {
    const hearts = '❤️'.repeat(MAX_MISTAKES - mistakes) + '🖤'.repeat(mistakes);
    mistakeEl.textContent = hearts;
  }
  updateMistakes();

  // Grid
  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display:'grid', gridTemplateColumns:'repeat(9,1fr)',
    gap:'1px', background:'rgba(255,255,255,0.12)',
    border:'2px solid rgba(91,138,245,0.4)', borderRadius:'10px', overflow:'hidden',
    width:'100%',
  });

  const cells = [];
  for (let r=0;r<9;r++) {
    cells[r]=[];
    for (let c=0;c<9;c++) {
      const cell = document.createElement('div');
      const isGiven = given[r][c];
      Object.assign(cell.style, {
        aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'clamp(13px,3.5vw,18px)', fontWeight: isGiven ? '700' : '500',
        cursor: 'pointer',
        background: (Math.floor(r/3)+Math.floor(c/3))%2===0 ? '#0e1117' : '#111620',
        color: isGiven ? '#e8eaf0' : '#5b8af5',
        userSelect:'none', WebkitUserSelect:'none',
        borderRight: (c+1)%3===0 && c!==8 ? '2px solid rgba(91,138,245,0.35)' : '',
        borderBottom: (r+1)%3===0 && r!==8 ? '2px solid rgba(91,138,245,0.35)' : '',
        transition:'background 0.1s',
      });
      if (board[r][c]) cell.textContent = board[r][c];
      cell.addEventListener('click', () => {
        if (won) return;
        selectCell(r,c);
      });
      cells[r][c] = cell;
      grid.appendChild(cell);
    }
  }
  box.appendChild(grid);

  // Number pad
  const pad = document.createElement('div');
  Object.assign(pad.style, {
    display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:'6px', width:'100%',
  });
  for (let n=1;n<=9;n++) {
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:'8px', padding:'10px 0', fontSize:'15px', fontWeight:'600',
      color:'#e8eaf0', cursor:'pointer', transition:'background 0.15s, border-color 0.15s',
      fontFamily:"'Outfit',sans-serif",
    });
    btn.textContent = n;
    btn.addEventListener('mouseenter', () => { btn.style.background='rgba(91,138,245,0.15)'; btn.style.borderColor='rgba(91,138,245,0.4)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background='rgba(255,255,255,0.05)'; btn.style.borderColor='rgba(255,255,255,0.08)'; });
    btn.addEventListener('click', () => enterNumber(n));
    pad.appendChild(btn);
  }
  box.appendChild(pad);

  // Erase button
  const eraseBtn = document.createElement('button');
  Object.assign(eraseBtn.style, {
    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:'10px', padding:'8px 20px', fontSize:'13px', fontWeight:'600',
    color:'#6b7280', cursor:'pointer', alignSelf:'flex-start',
    fontFamily:"'Outfit',sans-serif",
  });
  eraseBtn.textContent = '🗑 消去';
  eraseBtn.addEventListener('click', () => enterNumber(0));
  box.appendChild(eraseBtn);

  // Message area
  const msg = document.createElement('div');
  Object.assign(msg.style, { fontSize:'14px', color:'#22c55e', fontWeight:'600', minHeight:'20px', textAlign:'center' });
  box.appendChild(msg);

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // ── Keyboard support ─────────────────────────────────────────────────────
  function onKey(e) {
    if (!document.getElementById('sudoku-overlay')) { document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); return; }
    if (!selected || won) return;
    const [r,c] = selected;
    if (e.key === 'Backspace' || e.key === 'Delete') { enterNumber(0); return; }
    const n = parseInt(e.key);
    if (n >= 1 && n <= 9) enterNumber(n);
    // Arrow key navigation
    const dirs = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
    if (dirs[e.key]) {
      const [dr,dc] = dirs[e.key];
      let nr=r+dr, nc=c+dc;
      if (nr>=0&&nr<9&&nc>=0&&nc<9) { selectCell(nr,nc); }
    }
  }
  document.addEventListener('keydown', onKey);

  function cellBaseBg(r,c) {
    return (Math.floor(r/3)+Math.floor(c/3))%2===0 ? '#0e1117' : '#111620';
  }

  function applyHighlight() {
    // まず全セルをベース色にリセット
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) cells[r][c].style.background = cellBaseBg(r,c);
    if (!selected) return;
    const [sr,sc] = selected;
    const selVal = board[sr][sc];
    for (let r=0;r<9;r++) {
      for (let c=0;c<9;c++) {
        const inRow   = r === sr;
        const inCol   = c === sc;
        const inBox   = Math.floor(r/3)===Math.floor(sr/3) && Math.floor(c/3)===Math.floor(sc/3);
        const sameNum = selVal !== 0 && board[r][c] === selVal;
        if (r===sr && c===sc) {
          // 選択中マス
          cells[r][c].style.background = 'rgba(91,138,245,0.35)';
        } else if (sameNum) {
          // 同じ数字
          cells[r][c].style.background = 'rgba(167,139,250,0.28)';
        } else if (inRow || inCol || inBox) {
          // 同じ行・列・ブロック
          cells[r][c].style.background = 'rgba(91,138,245,0.10)';
        }
      }
    }
  }

  function selectCell(r,c) {
    selected=[r,c];
    applyHighlight();
  }

  function enterNumber(n) {
    if (!selected || won) return;
    const [r,c] = selected;
    if (given[r][c]) return;
    if (n === 0) {
      board[r][c] = 0;
      cells[r][c].textContent = '';
      cells[r][c].style.color = '#5b8af5';
      applyHighlight();
      return;
    }
    if (n === full[r][c]) {
      board[r][c] = n;
      cells[r][c].textContent = n;
      cells[r][c].style.color = '#5b8af5';
      // highlight flash
      cells[r][c].style.background = 'rgba(34,197,94,0.25)';
      setTimeout(() => { applyHighlight(); }, 350);
      // Check win
      if (board.every((row,ri)=>row.every((v,ci)=>v===full[ri][ci]))) {
        won = true;
        msg.textContent = '🎉 クリア！おめでとう！';
        selected = null;
        setTimeout(() => overlay.remove(), 2800);
      }
    } else {
      mistakes++;
      updateMistakes();
      cells[r][c].textContent = n;
      cells[r][c].style.color = '#ef4444';
      board[r][c] = 0;
      setTimeout(() => { cells[r][c].textContent = board[r][c] || ''; cells[r][c].style.color = '#5b8af5'; applyHighlight(); }, 700);
      if (mistakes >= MAX_MISTAKES) {
        won = true;
        msg.textContent = 'GAME OVER';
        msg.style.color = '#ef4444';
        setTimeout(() => overlay.remove(), 2000);
      }
    }
  }
}
</script>
</body>
</html>`;

// ─── HTML テンプレートに env 変数を注入 ───
function injectEnv(html, env, forceAltSrc) {
  return html
    .replace('__SUPABASE_ANON_KEY__', env.SUPABASE_ANON_KEY || '')
    .replace('__ALT_SRC_FLAG__', forceAltSrc ? 'true' : 'false');
}

// ─── YouTube API Key Rotation ───
// env.YOUTUBE_API_KEY が枯渇したとき env.YOUTUBE_API_KEY_2 〜 _10 へ自動フォールバック
function getApiKeyList(env) {
  const keys = [];
  if (env.YOUTUBE_API_KEY) keys.push(env.YOUTUBE_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const k = env[`YOUTUBE_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  return keys;
}

function isQuotaError(errData) {
  const reason = errData?.error?.errors?.[0]?.reason || '';
  const msg = errData?.error?.message || '';
  return (
    reason === 'quotaExceeded' ||
    reason === 'dailyLimitExceeded' ||
    msg.includes('quota') ||
    msg.includes('dailyLimit')
  );
}

// fn(apiKey) を実行し、クォータ超過なら次のキーで再試行する
async function withKeyRotation(env, fn) {
  const keys = getApiKeyList(env);
  if (keys.length === 0) throw new Error('YOUTUBE_API_KEY が設定されていません');
  let lastError;
  for (const key of keys) {
    try {
      return await fn(key);
    } catch (e) {
      // クォータエラーかどうか判定して次のキーへ
      if (e.__isQuota) {
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error('すべての YouTube API キーのクォータが上限に達しました');
}

// fetch して quota エラーなら専用フラグ付きで throw するラッパー
async function ytApiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (isQuotaError(err)) {
      const e = new Error(err?.error?.message || 'quota exceeded');
      e.__isQuota = true;
      throw e;
    }
    throw new Error(err?.error?.message || `YouTube API error ${res.status}`);
  }
  return res.json();
}

// ISO 8601 duration (PT#H#M#S) → 秒数
function parseIso8601Duration(str) {
  if (!str) return 0;
  const m = String(str).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

// ─── YouTube Search via Data API v3 ───
async function enrichSearchVideos(items, apiKey) {
  const videos = items.filter(v => v.kind !== 'channel' && /^[A-Za-z0-9_-]{11}$/.test(v.id || '')).slice(0, 50);
  if (!videos.length) return;
  const params = new URLSearchParams({part:'snippet,contentDetails', id:videos.map(v => v.id).join(','), key:apiKey});
  const data = await ytApiFetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
  const details = new Map((data.items || []).map(v => [v.id, v]));
  for (const video of videos) {
    const detail = details.get(video.id);
    if (!detail) continue;
    video.categoryId = safeString(detail.snippet?.categoryId);
    video.isMusic = video.isMusic === true || video.categoryId === '10';
    if (!video.isLive) video.duration = parseIso8601Duration(detail.contentDetails?.duration) || video.duration;
  }
}

async function searchYouTube(query, options, apiKey) {
  if (options.type === 'channel') {
    const cp = new URLSearchParams({
      part: 'snippet',
      type: 'channel',
      maxResults: String(options.maxResults || 3),
      q: query,
      key: apiKey,
    });
    const cdata = await ytApiFetch(`https://www.googleapis.com/youtube/v3/search?${cp.toString()}`);
    const chItems = (cdata.items || [])
      .filter(item => item.id && item.id.channelId)
      .map(item => ({
        id: item.id.channelId,
        kind: 'channel',
        title: item.snippet.channelTitle || item.snippet.title || '',
        channel: item.snippet.channelTitle || item.snippet.title || '',
        channelId: item.id.channelId,
        thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        description: item.snippet.description || '',
        url: `https://www.youtube.com/channel/${item.id.channelId}`,
      }));
    return { items: chItems, nextPageToken: '' };
  }
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(options.maxResults || 20),
    q: query,
    key: apiKey,
  });
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.channelId) params.set('channelId', options.channelId);

  const data = await ytApiFetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  const items = (data.items || []).map(item => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    channelId: item.snippet.channelId || '',
    thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    description: item.snippet.description,
    liveStatus: item.snippet.liveBroadcastContent || '',
    isLive: item.snippet.liveBroadcastContent === 'live',
    duration: 0,
  }));

  try { await enrichSearchVideos(items, apiKey); }
  catch (_) { /* 補完に失敗しても検索結果は表示する */ }

  return {
    items,
    nextPageToken: data.nextPageToken || '',
  };
}

async function getYouTubeChannelVideos(channelId, options, apiKey) {
  const tab = safeString(options.tab) || 'videos';
  const maxResults = Math.max(1, Math.min(Number(options.maxResults || 20), 50));
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    channelId,
    order: 'date',
    maxResults: String(maxResults),
    key: apiKey,
  });
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (tab === 'shorts') params.set('q', '#shorts');
  if (tab === 'releases') params.set('q', 'release');

  const data = await ytApiFetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  const items = (data.items || []).map(item => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    channelId: item.snippet.channelId || channelId,
    thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    description: item.snippet.description,
    url: item.id.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : '',
    kind: 'video',
    kindLabel: tab === 'shorts' ? 'ショート' : (tab === 'releases' ? 'リリース' : '動画'),
    liveStatus: item.snippet.liveBroadcastContent || '',
    isLive: item.snippet.liveBroadcastContent === 'live',
    duration: 0,
  }));

  try { await enrichSearchVideos(items, apiKey); }
  catch (_) { /* 補完に失敗しても一覧は表示する */ }

  return {
    tab,
    limit: maxResults,
    items,
    nextPageToken: data.nextPageToken || '',
    hasMore: Boolean(data.nextPageToken),
  };
}

async function getYouTubeChannelPlaylists(channelId, options, apiKey) {
  const maxResults = Math.max(1, Math.min(Number(options.maxResults || 20), 50));
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    channelId,
    maxResults: String(maxResults),
    key: apiKey,
  });
  if (options.pageToken) params.set('pageToken', options.pageToken);

  const data = await ytApiFetch(`https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`);
  return {
    tab: 'playlists',
    limit: maxResults,
    items: (data.items || []).map(item => ({
      id: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      channelId,
      thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      description: item.snippet.description,
      url: `https://www.youtube.com/playlist?list=${encodeURIComponent(item.id)}`,
      kind: 'playlist',
      kindLabel: '再生リスト',
    })),
    nextPageToken: data.nextPageToken || '',
    hasMore: Boolean(data.nextPageToken),
  };
}

async function getYouTubeChannelTabFallback(channelId, options, apiKey) {
  const tab = safeString(options.tab) || 'videos';
  if (tab === 'playlists') {
    return getYouTubeChannelPlaylists(channelId, options, apiKey);
  }
  if (tab === 'posts') {
    return {
      tab,
      limit: Number(options.maxResults || 20),
      items: [],
      nextPageToken: '',
      hasMore: false,
      warning: '投稿は yt-dlp バックエンド更新後に表示できます',
    };
  }
  return getYouTubeChannelVideos(channelId, options, apiKey);
}

async function getYouTubeVideoDetails(id, apiKey) {
  const data = await ytApiFetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,liveStreamingDetails,contentDetails&id=${encodeURIComponent(id)}&key=${apiKey}`);
  const item = (data.items || [])[0];
  if (!item) throw new Error('動画情報が見つかりませんでした');

  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const liveDetails = item.liveStreamingDetails || {};
  const liveBroadcastContent = snippet.liveBroadcastContent || '';
  const isLive = liveBroadcastContent === 'live' ||
    Boolean(liveDetails.actualStartTime && !liveDetails.actualEndTime) ||
    liveDetails.concurrentViewers != null;
  return {
    id,
    title: snippet.title || '',
    channel: snippet.channelTitle || '',
    channelId: snippet.channelId || '',
    thumb: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    description: snippet.description || '',
    categoryId: snippet.categoryId || '',
    tags: Array.isArray(snippet.tags) ? snippet.tags.slice(0, 15) : [],
    likeCount: stats.likeCount != null ? Number(stats.likeCount) : null,
    viewCount: stats.viewCount != null ? Number(stats.viewCount) : null,
    commentCount: stats.commentCount != null ? Number(stats.commentCount) : null,
    publishedAt: snippet.publishedAt || '',
    liveStatus: liveBroadcastContent || (isLive ? 'live' : (liveDetails.actualEndTime ? 'ended' : '')),
    liveBroadcastContent,
    isLive,
    concurrentViewers: liveDetails.concurrentViewers != null ? Number(liveDetails.concurrentViewers) : null,
    duration: isLive ? 0 : parseIso8601Duration(item.contentDetails?.duration),
  };
}

async function getYouTubeChannelDetails(id, apiKey) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,brandingSettings',
    id,
    key: apiKey,
  });
  const data = await ytApiFetch(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`);
  const item = (data.items || [])[0];
  if (!item) throw new Error('チャンネル情報が見つかりませんでした');

  const snippet  = item.snippet  || {};
  const stats    = item.statistics || {};
  const branding = item.brandingSettings || {};
  const image    = branding.image || {};

  // 登録者数を人が読みやすい形式に（APIはhiddenSubscriberCount=trueのとき非公開）
  const subCount = stats.hiddenSubscriberCount ? null
    : (stats.subscriberCount != null ? Number(stats.subscriberCount) : null);

  function fmtSubs(n) {
    if (n == null) return null;
    if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '億';
    if (n >= 10000000)  return (n / 10000000 ).toFixed(1).replace(/\.0$/, '') + '千万';
    if (n >= 10000)     return (n / 10000    ).toFixed(1).replace(/\.0$/, '') + '万';
    if (n >= 1000)      return (n / 1000     ).toFixed(1).replace(/\.0$/, '') + '千';
    return String(n);
  }

  // バナー: bannerExternalUrl → 最大2560px幅、なければnull
  const bannerUrl = safeString(image.bannerExternalUrl || '');

  // アバター: 最大解像度を選択
  const thumbs = snippet.thumbnails || {};
  const avatarUrl =
    safeString(thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url);

  // 認証バッジ: snippet.localized にはないが、topicDetails や tags で推定可能。
  // YouTube Data API v3 では公式の isVerified フィールドは存在しないため、
  // 登録者数 100 万以上を verified、Artist チャンネルは topicCategories で判定する。
  const topicCategories = (item.topicDetails?.topicCategories || []);
  const isArtist = topicCategories.some(t =>
    t.includes('music') || t.includes('Music') || t.toLowerCase().includes('/music')
  );
  // 10万登録以上 or カスタムURLを持つ場合を verified と見なす（近似）
  const isVerified = !isArtist && (
    (subCount != null && subCount >= 100000) ||
    Boolean(snippet.customUrl)
  );

  return {
    id,
    title:               safeString(snippet.title),
    description:         safeString(snippet.description),
    customUrl:           safeString(snippet.customUrl),
    publishedAt:         safeString(snippet.publishedAt),
    avatarUrl,
    bannerUrl,
    subscriberCount:     subCount,
    subscriberCountText: fmtSubs(subCount),
    videoCount:          stats.videoCount != null ? Number(stats.videoCount) : null,
    viewCount:           stats.viewCount  != null ? Number(stats.viewCount)  : null,
    isVerified,
    isArtist,
    country:             safeString(snippet.country),
  };
}

function formatPublishedText(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}分前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}時間前`;
  if (diffMs < 30 * day) return `${Math.floor(diffMs / day)}日前`;
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

function normalizeYouTubeComment(comment, replyCount = 0) {
  const snippet = comment?.snippet || {};
  return {
    id: comment?.id || '',
    author: snippet.authorDisplayName || '',
    authorChannelId: snippet.authorChannelId?.value || snippet.authorChannelId || '',
    authorProfileImageUrl: snippet.authorProfileImageUrl || '',
    text: snippet.textOriginal || snippet.textDisplay || '',
    likeCount: snippet.likeCount != null ? Number(snippet.likeCount) : 0,
    replyCount,
    publishedAt: snippet.publishedAt || '',
    publishedText: formatPublishedText(snippet.publishedAt),
  };
}

async function getYouTubeComments(id, options, apiKey) {
  const order = options.order === 'time' ? 'time' : 'relevance';
  const params = new URLSearchParams({
    part: 'snippet,replies',
    videoId: id,
    maxResults: '20',
    order,
    textFormat: 'plainText',
    key: apiKey,
  });
  if (options.pageToken) params.set('pageToken', options.pageToken);

  const data = await ytApiFetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`);
  const items = (data.items || []).map(thread => {
    const threadSnippet = thread.snippet || {};
    const top = normalizeYouTubeComment(
      threadSnippet.topLevelComment,
      threadSnippet.totalReplyCount != null ? Number(threadSnippet.totalReplyCount) : 0
    );
    const replies = (thread.replies?.comments || []).map(reply => normalizeYouTubeComment(reply, 0));
    return { ...top, replies };
  });

  return {
    items,
    nextPageToken: data.nextPageToken || '',
    totalResults: data.pageInfo?.totalResults != null ? Number(data.pageInfo.totalResults) : null,
  };
}

// 「さらに返信を読み込む」用: 特定コメントの返信を追加取得
async function getYouTubeCommentReplies(parentId, pageToken, apiKey) {
  const params = new URLSearchParams({
    part: 'snippet',
    parentId,
    maxResults: '20',
    textFormat: 'plainText',
    key: apiKey,
  });
  if (pageToken) params.set('pageToken', pageToken);

  const data = await ytApiFetch(`https://www.googleapis.com/youtube/v3/comments?${params.toString()}`);
  const items = (data.items || []).map(reply => normalizeYouTubeComment(reply, 0));

  return {
    items,
    nextPageToken: data.nextPageToken || '',
  };
}

// ─── /approve 承諾ページ HTML ─────────────────────────────────────────────
function buildApprovalPage(discordClientId, appBaseUrl) {
  // Discord OAuth2: identify スコープのみ（ユーザーID取得に十分）
  const redirectUri = encodeURIComponent(appBaseUrl + '/api/discord-callback');
  const discordOAuthUrl = 'https://discord.com/oauth2/authorize?client_id=' + discordClientId +
    '&redirect_uri=' + redirectUri +
    '&response_type=code&scope=identify&prompt=none';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halo – アクセス承諾</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Space+Mono&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#080a0f;color:#e8eaf0;font-family:Outfit,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#0e1117;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 32px;width:100%;max-width:440px;box-shadow:0 24px 64px rgba(0,0,0,0.6);display:flex;flex-direction:column;gap:20px}
    .logo{font-size:28px;font-weight:900;letter-spacing:-1px;background:linear-gradient(135deg,#5b8af5,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-align:center}
    .title{font-size:18px;font-weight:700;text-align:center}
    .desc{color:#9ca3af;font-size:14px;line-height:1.6;text-align:center}
    .device-box{background:#161b26;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;text-align:center}
    .device-label{font-size:12px;color:#6b7280;margin-bottom:6px}
    .device-name{font-size:20px;font-weight:700;color:#e8eaf0}
    .device-icon{font-size:32px;margin-bottom:8px}
    .btn-approve{background:linear-gradient(135deg,#5b8af5,#a78bfa);border:none;border-radius:10px;padding:16px;font-family:Outfit,sans-serif;font-size:16px;font-weight:700;color:#fff;cursor:pointer;transition:opacity 0.2s;width:100%}
    .btn-approve:hover{opacity:0.85}
    .btn-approve:disabled{opacity:0.5;cursor:default}
    .status{font-size:14px;text-align:center;padding:12px;border-radius:8px;display:none}
    .status.ok{background:rgba(34,197,94,0.12);color:#22c55e;display:block}
    .status.err{background:rgba(239,68,68,0.1);color:#ef4444;display:block}
    .status.loading{background:rgba(91,138,245,0.1);color:#5b8af5;display:block}
    .spinner{display:inline-block;width:18px;height:18px;border:2px solid rgba(91,138,245,0.3);border-top-color:#5b8af5;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:6px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .discord-login-btn{display:flex;align-items:center;justify-content:center;gap:10px;background:#5865F2;border:none;border-radius:10px;padding:14px 20px;color:#fff;font-family:Outfit,sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:opacity 0.2s;width:100%;text-decoration:none}
    .discord-login-btn:hover{opacity:0.85}
    .discord-link{display:flex;align-items:center;justify-content:center;gap:8px;background:#5865F2;border-radius:10px;padding:12px 20px;color:#fff;text-decoration:none;font-weight:700;font-size:14px;transition:opacity 0.2s}
    .discord-link:hover{opacity:0.85}
    .user-box{background:#161b26;border:1px solid rgba(88,101,242,0.3);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px}
    .user-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover}
    .user-name{font-size:14px;font-weight:600;color:#e8eaf0}
    .user-tag{font-size:12px;color:#6b7280}
  </style>
</head>
<body>
<div class="card" id="card">
  <div class="logo">Halo</div>
  <div id="state-loading" style="display:flex;flex-direction:column;gap:16px;">
    <div class="status loading"><span class="spinner"></span>セッション確認中…</div>
  </div>
  <div id="state-discord-login" style="display:none;flex-direction:column;gap:16px;">
    <div class="title">承諾にはDiscordログインが必要です</div>
    <div class="desc">承諾権限を確認するために、Discordアカウントでログインしてください。</div>
    <a id="discord-oauth-link" href="${discordOAuthUrl}" class="discord-login-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
      Discordでログイン
    </a>
  </div>
  <div id="state-main" style="display:none;flex-direction:column;gap:16px;">
    <div class="title">アクセス承諾リクエスト</div>
    <div class="desc">以下のデバイスからHaloへのアクセスリクエストが届いています。<br>承認する場合は「承諾する」を押してください。</div>
    <div class="device-box">
      <div class="device-icon" id="device-icon">💻</div>
      <div class="device-label">デバイス</div>
      <div class="device-name" id="device-name">確認中…</div>
    </div>
    <div class="user-box" id="user-box" style="display:none;">
      <img class="user-avatar" id="user-avatar" src="" alt="avatar">
      <div>
        <div class="user-name" id="user-name"></div>
        <div class="user-tag">承諾権限あり ✓</div>
      </div>
    </div>
    <button class="btn-approve" id="btn-approve" onclick="doApprove()">✅ 承諾する</button>
    <div id="approve-status" class="status"></div>
  </div>
  <div id="state-forbidden" style="display:none;flex-direction:column;gap:14px;">
    <div class="title">🚫 権限がありません</div>
    <div class="desc" id="forbidden-msg">このDiscordアカウントには承諾権限がありません。</div>
  </div>
  <div id="state-error" style="display:none;flex-direction:column;gap:14px;">
    <div class="title">❌ セッションエラー</div>
    <div class="desc" id="error-msg">このリンクは無効か期限切れです。</div>
    <a href="https://discord.gg/Rtrq8tfwfX" class="discord-link" target="_blank" rel="noopener">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
      Discordサーバー
    </a>
  </div>
  <div id="state-done" style="display:none;text-align:center;flex-direction:column;gap:16px;">
    <div style="font-size:48px">✅</div>
    <div class="title">承諾完了！</div>
    <div class="desc">アクセスが許可されました。<br>元のページに戻ってください。</div>
  </div>
</div>
<script>
  var SESSION_ID = new URLSearchParams(location.search).get('s') || '';
  // Discord OAuthコールバック後にsessionIdをstateとして渡す用にURLを動的生成
  var oauthBase = '${discordOAuthUrl}';
  document.getElementById('discord-oauth-link').href = oauthBase + '&state=' + encodeURIComponent(SESSION_ID);

  function detectDevice() {
    var ua = navigator.userAgent || '';
    if (/CrOS/.test(ua)) return { name: 'Chromebook', icon: '💻' };
    if (/iPhone/.test(ua)) return { name: 'iPhone', icon: '📱' };
    if (/iPad/.test(ua)) return { name: 'iPad', icon: '📱' };
    if (/Android/.test(ua)) return { name: 'Android', icon: '📱' };
    if (/Mac/.test(ua)) return { name: 'Mac', icon: '🖥️' };
    if (/Windows/.test(ua)) return { name: 'Windows PC', icon: '💻' };
    if (/Linux/.test(ua)) return { name: 'Linux', icon: '🐧' };
    return { name: 'デバイス', icon: '💻' };
  }

  function setState(name) {
    ['loading','discord-login','main','forbidden','error','done'].forEach(function(s) {
      var el = document.getElementById('state-' + s);
      if (el) el.style.display = (s === name) ? 'flex' : 'none';
    });
  }

  function doApprove() {
    var btn = document.getElementById('btn-approve');
    var statusEl = document.getElementById('approve-status');
    var discordToken = sessionStorage.getItem('halo_discord_token') || '';
    btn.disabled = true;
    statusEl.className = 'status loading';
    statusEl.innerHTML = '<span class="spinner"></span>承諾処理中…';
    statusEl.style.display = 'block';

    fetch('/api/approval/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: SESSION_ID, discord_token: discordToken })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        setState('done');
      } else {
        statusEl.className = 'status err';
        statusEl.textContent = data.error || '承諾に失敗しました';
        btn.disabled = false;
      }
    })
    .catch(function() {
      statusEl.className = 'status err';
      statusEl.textContent = '通信エラーが発生しました';
      btn.disabled = false;
    });
  }

  // Discord OAuthコールバック後: discord_token クエリパラメータを受け取る
  var params = new URLSearchParams(location.search);
  var discordToken = params.get('discord_token') || '';
  if (discordToken) {
    sessionStorage.setItem('halo_discord_token', discordToken);
    // URLからトークンを除去（リロード対策）
    var cleanUrl = location.pathname + '?s=' + encodeURIComponent(SESSION_ID);
    history.replaceState(null, '', cleanUrl);
  } else {
    discordToken = sessionStorage.getItem('halo_discord_token') || '';
  }

  // Init
  if (!SESSION_ID) {
    setState('error');
    document.getElementById('error-msg').textContent = 'セッションIDが指定されていません。QRコードから再度アクセスしてください。';
  } else {
    fetch('/api/approval/check?s=' + encodeURIComponent(SESSION_ID))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.expired || (data.error && !data.approved)) {
          setState('error');
          document.getElementById('error-msg').textContent = 'このQRコードは期限切れです。新しいQRコードを生成してください。';
          return;
        }
        if (data.approved) { setState('done'); return; }

        // Discordトークンがなければログインを促す
        if (!discordToken) { setState('discord-login'); return; }

        // トークンあり → サーバーで権限確認
        fetch('/api/approval/verify-discord?t=' + encodeURIComponent(discordToken))
          .then(function(r) { return r.json(); })
          .then(function(vd) {
            if (!vd.ok) {
              sessionStorage.removeItem('halo_discord_token');
              setState('discord-login');
              return;
            }
            if (!vd.allowed) {
              setState('forbidden');
              document.getElementById('forbidden-msg').textContent =
                'Discordアカウント（' + (vd.username || '') + '）には承諾権限がありません。';
              return;
            }
            // 権限あり → 承諾画面を表示
            var device = detectDevice();
            document.getElementById('device-name').textContent = device.name;
            document.getElementById('device-icon').textContent = device.icon;
            if (vd.username) {
              document.getElementById('user-name').textContent = vd.username;
              if (vd.avatar) document.getElementById('user-avatar').src = vd.avatar;
              document.getElementById('user-box').style.display = 'flex';
            }
            setState('main');
          })
          .catch(function() { setState('discord-login'); });
      })
      .catch(function() {
        setState('error');
        document.getElementById('error-msg').textContent = '通信エラーが発生しました。';
      });
  }
</script>
</body>
</html>`;
}


// ─── CORS headers ───
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function safeString(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function getBackendBaseUrl(env) {
  return safeString(env?.YTDLP_BACKEND_URL).replace(/\/+$/, '');
}

function renderArchivePage(item, pageUrl, embedded, basePath) {
  const esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const id=item.id,title=esc(item.title),media='https://archive.org/download/'+id+'/video.mp4';
  const poster='https://archive.org/services/img/'+id;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Halo Archive</title>
    <meta property="og:title" content="${title}"><meta property="og:site_name" content="HaloTube Archive"><meta property="og:type" content="video.other"><meta property="og:url" content="${esc(pageUrl)}"><meta property="og:image" content="${poster}"><meta property="og:video" content="${media}"><meta property="og:video:type" content="video/mp4"><meta name="twitter:card" content="player">
    <style>*{box-sizing:border-box}body{margin:0;background:#090c12;color:#edf0fa;font:16px system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:${embedded?'0':'24px'}}a{color:#9ba9ff}video{display:block;width:100%;${embedded?'height:100dvh;':'aspect-ratio:16/9;'}background:#000;border-radius:${embedded?'0':'16px'}}h1{font-size:clamp(20px,4vw,30px);overflow-wrap:anywhere}p{color:#a6afc1;line-height:1.7}.links{display:flex;gap:20px;flex-wrap:wrap;padding:16px 0}</style></head><body><main>
    ${embedded?'':`<a href="${esc(basePath)}?archives=1">← アーカイブ動画一覧</a><h1>${title}</h1>`}
    <video controls playsinline preload="metadata" poster="${poster}" src="${media}"></video>
    ${embedded?'':`<p>Internet Archiveに保存された動画です。元動画の配信とは別のアーカイブを再生しています。</p><div class="links"><a href="https://archive.org/details/${id}" target="_blank" rel="noopener noreferrer">Internet Archiveで開く</a><a href="https://www.youtube.com/watch?v=${esc(item.videoId)}" target="_blank" rel="noopener noreferrer">元の動画</a></div>`}
    </main></body></html>`;
}

// Public metadata only: no media extraction or playback session is needed for link previews.
async function getWatchPreview(videoId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const endpoint = new URL('https://www.youtube.com/oembed');
    endpoint.searchParams.set('url', 'https://www.youtube.com/watch?v=' + videoId);
    endpoint.searchParams.set('format', 'json');
    const response = await fetch(endpoint.href, {signal: controller.signal});
    if (!response.ok) throw new Error('Preview metadata unavailable');
    const data = await response.json();
    if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('Preview title missing');
    let thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    let width = 480, height = 360;
    try {
      const image = new URL(data.thumbnail_url);
      if (image.protocol === 'https:' && (image.hostname === 'i.ytimg.com' || image.hostname.endsWith('.ytimg.com'))) {
        thumb = image.href;
        width = Number(data.thumbnail_width) || 480;
        height = Number(data.thumbnail_height) || 360;
      }
    } catch (_) {}
    return {title:data.title, channel:typeof data.author_name === 'string' ? data.author_name : '', thumb, width, height};
  } finally {
    clearTimeout(timeout);
  }
}

function renderWatchPreview(html, video, pageUrl, mediaUrl = '') {
  const escape = value => String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const description = video.channel ? video.channel + ' — HaloTube' : 'HaloTubeで動画を見る';
  const metadata = [
    ['property','og:type','video.other'], ['property','og:site_name','HaloTube'],
    ['property','og:title',video.title], ['property','og:description',description],
    ['property','og:url',pageUrl], ['property','og:image',video.thumb],
    ['property','og:image:width',video.width], ['property','og:image:height',video.height],
    ['property','og:image:alt',video.title],
    ...(mediaUrl ? [['property','og:video',mediaUrl], ['property','og:video:type','video/mp4'],
      ['name','twitter:player:stream',mediaUrl], ['name','twitter:player:stream:content_type','video/mp4']] : []),
    ['name','twitter:card',mediaUrl ? 'player' : 'summary_large_image'], ['name','twitter:title',video.title],
    ['name','twitter:description',description], ['name','twitter:image',video.thumb],
    ['name','description',description], ['name','author',video.channel || 'HaloTube']
  ].map(([attr, name, value]) => `<meta ${attr}="${name}" content="${escape(value)}">`).join('\n  ');
  return html.replace(/<head>([\s\S]*?)<\/head>/, (_, head) => '<head>' + head
    .replace(/<meta (?:property|name)="(?:og:[^"]*|twitter:[^"]*|description|author)"[^>]*>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escape(video.title)} — HaloTube</title>`)
    + metadata + `\n  <link rel="canonical" href="${escape(pageUrl)}">\n</head>`);
}

function getPublicAppUrl(env) {
  return safeString(env?.PUBLIC_APP_URL || env?.APP_BASE_URL || 'https://white-hall-4040.nikubanana809.workers.dev').replace(/\/+$/, '');
}

function isValidYouTubeVideoId(id) {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

async function checkHaloApiStatus() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('https://haloapi.rec877.com/', {
      method: 'GET',
      signal: controller.signal,
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    return res.status < 500;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── AWS SES (SigV4) helpers ───────────────────────────────────────────────
async function hmacSha256(key, msg) {
  const enc = new TextEncoder();
  const keyData = typeof key === 'string' ? enc.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg));
  return new Uint8Array(sig);
}

async function sha256Hex(msg) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(msg));
  return toHex(new Uint8Array(hash));
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getSesSigningKey(secretKey, dateStamp, regionName) {
  const kDate = await hmacSha256('AWS4' + secretKey, dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, 'ses');
  return hmacSha256(kService, 'aws4_request');
}

async function sesSendEmail(env, { to, subject, text, html }) {
  const accessKey = safeString(env.AWS_ACCESS_KEY_ID);
  const secretKey = safeString(env.AWS_SECRET_ACCESS_KEY);
  const region = safeString(env.AWS_REGION) || 'us-east-1';
  const fromEmail = safeString(env.SES_FROM_EMAIL);
  if (!accessKey || !secretKey || !fromEmail) {
    throw new Error('AWS SES 環境変数が未設定です (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / SES_FROM_EMAIL)');
  }

  const host = `email.${region}.amazonaws.com`;
  const canonicalUri = '/v2/email/outbound-emails';
  const endpoint = `https://${host}${canonicalUri}`;
  const method = 'POST';

  const payload = JSON.stringify({
    FromEmailAddress: fromEmail,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: text, Charset: 'UTF-8' },
          ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}),
        },
      },
    },
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(payload);
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const credentialScope = `${dateStamp}/${region}/ses/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

  const signingKey = await getSesSigningKey(secretKey, dateStamp, region);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Date': amzDate,
      'X-Amz-Content-Sha256': payloadHash,
      Authorization: authorizationHeader,
    },
    body: payload,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SES送信エラー (${res.status}): ${errText}`);
  }
  return res.json();
}

function generateEmailCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, '0');
}

// ─── Main handler ───
// Account APIs: authorization is derived only from server-owned rows.
function accountError(message, status = 400) { return Object.assign(new Error(message), {status}); }
function accountCookie(request, name) {
  const part = (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return part ? part.slice(name.length + 1) : '';
}
function accountCookies(headers, tokens) {
  for (const [name, value, age] of [['halo_access', tokens?.access_token || '', tokens ? 3600 : 0], ['halo_refresh', tokens?.refresh_token || '', tokens ? 2592000 : 0]]) {
    headers.append('Set-Cookie', name + '=' + value + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + age);
  }
}
function accountEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw accountError('メールアドレスを確認してください');
  return email;
}
function accountPassword(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw accountError('パスワードは12〜128文字で指定してください');
  return value;
}
function accountProfileInput(body) {
  const username = String(body.username || '').trim();
  const avatar_url = String(body.avatarUrl || '').trim();
  if (username.length > 40 || /[\u0000-\u001f\u007f]/.test(username)) throw accountError('ユーザー名は40文字以内で指定してください');
  if (avatar_url.length > 100000 || (avatar_url && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(avatar_url) && !/^https:\/\/[^\s]+$/i.test(avatar_url))) throw accountError('アイコンはHTTPSの画像URLまたはPNG/JPEG/WebPを指定してください');
  return {username, avatar_url};
}
async function accountSupabase(env, path, {method = 'GET', body, token, admin = false, prefer} = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || (admin && !env.SUPABASE_SERVICE_ROLE_KEY)) throw accountError('アカウント用のサーバー設定が未完了です', 503);
  const key = admin ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  const headers = {'apikey': key, 'Authorization': 'Bearer ' + (token || key), 'Content-Type': 'application/json'};
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(env.SUPABASE_URL.replace(/\/$/, '') + path, {method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(12000)});
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (data?.message?.includes('RATE_LIMIT')) throw accountError('送信が多すぎます。時間を空けて再試行してください', 429);
    if (path.startsWith('/auth/v1/token') || path === '/auth/v1/user') throw accountError('ログイン情報を確認してください', 401);
    // Do not expose provider messages: they may contain SQL, email addresses or credentials.
    const errors = {
      PGRST202: 'アカウント用SQL関数が見つかりません。管理者はSQLの適用状態を確認してください',
      PGRST205: 'アカウント用テーブルが見つかりません。管理者はSQLの適用状態を確認してください',
      '42P01': 'アカウント用テーブルが見つかりません。管理者はSQLの適用状態を確認してください',
      '42501': 'データベースの権限が不足しています。管理者はSQLの権限設定を確認してください',
      '23502': 'アカウント情報の保存に必要な項目が不足しています。管理者はDB定義を確認してください',
      '23503': 'アカウント情報の関連付けに失敗しました。管理者はDB定義を確認してください',
      '23505': '登録済み情報と重複しています。ログインをお試しください',
      email_exists: 'このメールアドレスは登録済みです。ログインをお試しください',
      user_already_exists: 'このアカウントは登録済みです。ログインをお試しください',
      weak_password: 'パスワードが認証サーバーの条件を満たしていません。別の強いパスワードを指定してください',
      email_address_invalid: 'メールアドレスを確認してください',
      validation_failed: '登録情報が認証サーバーの条件を満たしていません。メールアドレスとパスワードの設定を確認してください',
      email_address_not_authorized: 'このメールアドレスへの登録が認証サーバーで許可されていません。管理者はAuthの設定を確認してください',
      not_admin: '認証サーバーの管理権限が不足しています。管理者はサービス用キーを確認してください',
      unexpected_failure: '認証サーバー内でエラーが発生しました。管理者はSupabaseのAuthログを確認してください'
    };
    // Auth may return both a numeric `code` (422) and a symbolic `error_code`.
    // PostgREST instead uses a symbolic `code`. Never let the numeric field mask it.
    const code = [data?.error_code, data?.code].find(value => typeof value === 'string' && Object.hasOwn(errors, value)) || 'HTTP_' + res.status;
    if(code==='weak_password'){
      const explanations={length:'認証サーバーが要求する最低文字数を満たしていません。さらに長いパスワードにしてください',characters:'必要な文字種が不足しています。半角の英大文字・英小文字・数字・記号を組み合わせてください',pwned:'流出済みのパスワードと一致したため使用できません。他で使っていない新しいパスワードを指定してください'};
      const reasons=Array.isArray(data?.weak_password?.reasons)?data.weak_password.reasons:[];
      const details=[...new Set(reasons.filter(reason=>typeof reason==='string'&&Object.hasOwn(explanations,reason)))].map(reason=>explanations[reason]);
      if(details.length)errors.weak_password=details.join('。');
    }
    const message = errors[code] || ((res.status === 401 || res.status === 403)
      ? '認証サーバーへの接続権限がありません。管理者はSupabaseのURLとサービス用キーを確認してください'
      : 'アカウント処理に失敗しました。管理者に表示されたエラー番号を伝えてください');
    const stage = path === '/auth/v1/admin/users' ? 'create_user' : path.includes('/rpc/') ? 'database_function' : 'profile';
    throw accountError(message + ' [' + stage + ':' + code + ']', ['email_exists','user_already_exists','weak_password','email_address_invalid','23505'].includes(code) ? 400 : 503);
  }
  return data;
}
async function accountRow(env, user) {
  const path = '/rest/v1/halo_accounts?user_id=eq.' + encodeURIComponent(user.id);
  let rows = await accountSupabase(env, path, {admin:true});
  if (!rows?.length) {
    await accountSupabase(env, '/rest/v1/halo_accounts?on_conflict=user_id', {admin:true, method:'POST', prefer:'resolution=ignore-duplicates', body:{user_id:user.id,email:accountEmail(user.email)}});
    rows = await accountSupabase(env, path, {admin:true});
  }
  if (!rows?.[0]) throw accountError('アカウント設定を取得できません', 503);
  return rows[0];
}
function accountPublic(user, row) {
  const emailVerified = !!user.email_confirmed_at && row.verified_email === user.email?.toLowerCase();
  return {id:user.id, accountNumber:String(row.account_number), email:user.email, username:row.username, avatarUrl:row.avatar_url || 'https://get.rec877.com/get/halotube/cdn/def-icon.png', emailVerified, verifiedBadge:emailVerified && row.verified_badge === true, isAdmin:emailVerified && row.is_admin === true};
}
async function accountSession(request, env, token = accountCookie(request, 'halo_access')) {
  if (!token) throw accountError('ログインしてください', 401);
  const user = await accountSupabase(env, '/auth/v1/user', {token});
  const row = await accountRow(env, user);
  if (await accountSupabase(env,'/rest/v1/rpc/halo_session_active',{method:'POST',body:{},token}) !== true) throw accountError('ログインし直してください',401);
  return {user,row,token,publicUser:accountPublic(user,row)};
}
async function accountHash(env, text) {
  if (String(env.ACCOUNT_CHALLENGE_SECRET || '').length < 32) throw accountError('認証コード用のサーバー設定が未完了です', 503);
  return sha256Hex(env.ACCOUNT_CHALLENGE_SECRET + ':' + text);
}
async function accountIssue(request, env, email, purpose, actor, payload = {}) {
  const id = crypto.randomUUID();
  // Rejection sampling avoids modulo bias.
  const words = new Uint32Array(1);
  do { crypto.getRandomValues(words); } while (words[0] >= 4200000000);
  const code = String(words[0] % 100000000).padStart(8,'0');
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  await accountSupabase(env, '/rest/v1/rpc/halo_begin_challenge', {admin:true, method:'POST',body:{p_id:id,p_email:email,p_purpose:purpose,p_actor:actor,p_payload:payload,p_hash:await accountHash(env,id+':'+code),p_ip:await accountHash(env,ip+ (purpose === 'badge' ? ':'+actor : ''))}});
  const labels = {register:'アカウント登録',verify:'メールアドレス確認',change:'メールアドレス変更',badge:'Discord認証バッジの付与'};
  await sesSendEmail(env,{to:email,subject:'HaloTube '+labels[purpose]+'の確認コード',text:labels[purpose]+'の確認コード: '+code+'\n有効期限は10分、入力は5回までです。\n'+(purpose==='badge'?'DiscordユーザーID: '+actor+'\nこのコードを入力するとそのDiscordユーザーとアカウントが連携されます。\n':'')+'他の人にコードを教えないでください。心当たりがなければ無視してください。'});
  return {challengeId:id,message:'確認コードを送信しました（有効期限10分）'};
}
async function accountConsume(env, body, purpose, actor) {
  if (!/^[a-f0-9-]{36}$/i.test(String(body.challengeId)) || !/^\d{8}$/.test(String(body.code))) throw accountError('8桁の確認コードを入力してください');
  const data = await accountSupabase(env,'/rest/v1/rpc/halo_consume_challenge',{admin:true,method:'POST',body:{p_id:body.challengeId,p_purpose:purpose,p_actor:actor,p_hash:await accountHash(env,body.challengeId+':'+body.code)}});
  if (!data) throw accountError('確認コードが違うか、有効期限が切れています');
  return data;
}
// Short-lived registration-only proof. It grants no login or profile-edit access.
// Auth's unique email constraint prevents reusing it to replace an existing user.
async function accountRegistrationProof(env, value, verify = false) {
  const secret=String(env.ACCOUNT_CHALLENGE_SECRET || '');
  if(secret.length<32)throw accountError('認証コード用のサーバー設定が未完了です',503);
  const bytes=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',bytes.encode(secret+':registration-v1'),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
  if(!verify){
    const payload=encodeURIComponent(JSON.stringify({email:value,expires:Date.now()+10*60*1000,purpose:'registration'}));
    const signature=await crypto.subtle.sign('HMAC',key,bytes.encode(payload));
    return payload+'.'+Array.from(new Uint8Array(signature),n=>n.toString(16).padStart(2,'0')).join('');
  }
  const invalid=()=>accountError('メール確認の有効期限が切れたか、確認情報が無効です。「メール確認からやり直す」を選んでください');
  if(typeof value!=='string'||value.length>2048)throw invalid();
  const split=value.lastIndexOf('.'),payload=value.slice(0,split),signature=value.slice(split+1);
  if(!/^[a-f0-9]{64}$/.test(signature))throw invalid();
  const signatureBytes=new Uint8Array(signature.match(/../g).map(n=>parseInt(n,16)));
  if(!await crypto.subtle.verify('HMAC',key,signatureBytes,bytes.encode(payload)))throw invalid();
  let proof;try{proof=JSON.parse(decodeURIComponent(payload));}catch{throw invalid();}
  if(proof.purpose!=='registration'||!Number.isFinite(proof.expires)||proof.expires<=Date.now()||proof.expires>Date.now()+10*60*1000)throw invalid();
  return {email:accountEmail(proof.email)};
}
async function accountFind(env, identifier) {
  const input = String(identifier || '').trim();
  const filter = /^\d{1,15}$/.test(input) ? 'account_number=eq.'+input : 'email=eq.'+encodeURIComponent(accountEmail(input));
  return (await accountSupabase(env,'/rest/v1/halo_accounts?'+filter+'&limit=1',{admin:true}))?.[0];
}
async function accountPatch(env, userId, body) {
  return accountSupabase(env,'/rest/v1/halo_accounts?user_id=eq.'+encodeURIComponent(userId),{admin:true,method:'PATCH',body});
}
async function accountReauth(env, session, password) {
  if (typeof password !== 'string' || password.length > 128) throw accountError('現在のパスワードを入力してください');
  const result = await accountSupabase(env,'/auth/v1/token?grant_type=password',{method:'POST',body:{email:session.user.email,password}});
  if (result.user?.id !== session.user.id) throw accountError('本人確認に失敗しました',403);
  // Close the temporary reauthentication session without revoking the current one.
  await accountSupabase(env,'/auth/v1/logout?scope=local',{method:'POST',token:result.access_token});
}
async function accountSecretMatches(provided, expected) {
  const bytes=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',bytes.encode(expected),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
  const signature=await crypto.subtle.sign('HMAC',key,bytes.encode(provided));
  return crypto.subtle.verify('HMAC',key,signature,bytes.encode(expected));
}
// Uploads use a Worker R2 binding, never browser-visible S3 credentials.
function accountAvatarConfig(env) {
  const hostnames=String(env.TURNSTILE_HOSTNAMES || '').split(',').map(s=>s.trim()).filter(Boolean);
  return {siteKey:String(env.TURNSTILE_SITE_KEY || ''),enabled:env.AVATAR_UPLOADS_ENABLED === 'true' && !!env.AVATARS && !!env.TURNSTILE_SITE_KEY && !!env.TURNSTILE_SECRET && hostnames.length>0};
}
async function accountVerifyUploadChallenge(request,env,token) {
  const allowed=new Set(String(env.TURNSTILE_HOSTNAMES || '').split(',').map(s=>s.trim()).filter(Boolean));
  const hostname=new URL(request.url).hostname;
  if (!env.TURNSTILE_SECRET || !allowed.has(hostname)) throw accountError('画像アップロードの認証設定が未完了です',503);
  if(typeof token!=='string' || !token.length || token.length>2048) throw accountError('画像保存前に確認チェックを完了してください',403);
  let result;
  try {
    const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
    const ip=request.headers.get('CF-Connecting-IP');if(ip)body.set('remoteip',ip);
    const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('siteverify');result=await response.json();
  } catch { throw accountError('確認サービスに接続できません。再試行してください',503); }
  if(result.success!==true || result.action!=='avatar_upload' || result.hostname!==hostname || !allowed.has(result.hostname)) throw accountError('確認の期限切れ、または認証に失敗しました。再度確認してください',403);
}
function accountDecodeAvatar(value) {
  if(typeof value!=='string' || value.length>88000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw accountError('アイコンはPNG形式で送信してください');
  let bytes;
  try {bytes=Uint8Array.from(atob(value.slice(value.indexOf(',')+1)),c=>c.charCodeAt(0));}catch{throw accountError('画像の形式が不正です');}
  if(bytes.length>65536 || bytes.length<45 || [137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v)) throw accountError('画像は64KB以下のPNGにしてください');
  const view=new DataView(bytes.buffer);let offset=8,header=false,data=false,end=false;
  while(offset+12<=bytes.length){
    const size=view.getUint32(offset),type=String.fromCharCode(...bytes.slice(offset+4,offset+8));
    if(size>bytes.length-offset-12 || end)throw accountError('PNG画像の構造が不正です');
    if(!header && type!=='IHDR')throw accountError('PNG画像のヘッダーが不正です');
    if(type==='IHDR'){
      if(header || size!==13)throw accountError('PNG画像のヘッダーが不正です');
      const width=view.getUint32(offset+8),height=view.getUint32(offset+12);
      if(!width||!height||width>256||height>256||bytes[offset+16]!==8||![2,6].includes(bytes[offset+17])||bytes[offset+18]!==0||bytes[offset+19]!==0||bytes[offset+20]!==0)throw accountError('画像は256×256以内の静止画にしてください');
      header=true;
    }else if(type==='IDAT')data=true;
    else if(type==='IEND'){if(size!==0||!data)throw accountError('PNG画像が不正です');end=true;}
    else if(!['sRGB','gAMA','cHRM','pHYs'].includes(type))throw accountError('対応していないPNG形式です。画像を選び直してください');
    // Reject damaged chunks and trailing payloads, not just MIME spoofing.
    let crc=0xffffffff;for(let i=offset+4;i<offset+8+size;i++){crc^=bytes[i];for(let b=0;b<8;b++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    if(((crc^0xffffffff)>>>0)!==view.getUint32(offset+8+size))throw accountError('PNG画像が破損しています');
    offset+=size+12;
  }
  if(!end || offset!==bytes.length)throw accountError('PNG画像が不完全です');
  return bytes;
}
async function accountUploadAvatar(request,env,session,body) {
  if(!session.publicUser.emailVerified)throw accountError('先にメールアドレスを確認してください',403);
  if(!accountAvatarConfig(env).enabled)throw accountError('画像アップロードは準備中です',503);
  const bytes=accountDecodeAvatar(body.image);
  const base=new URL(env.AVATAR_PUBLIC_BASE_URL || 'https://cdn.rec877.com');
  if(base.protocol!=='https:' || base.username || base.password || base.search || base.hash)throw accountError('画像配信先の設定が不正です',503);
  await accountVerifyUploadChallenge(request,env,body.turnstileToken);
  const reserved=await accountSupabase(env,'/rest/v1/rpc/halo_reserve_avatar_upload',{admin:true,method:'POST',body:{p_user:session.user.id}});
  if(reserved!==true)throw accountError('画像保存の利用上限に達しています。時間を空けても解消しない場合は管理者に連絡してください',429);
  if(!/^[a-f0-9-]{36}$/i.test(session.user.id))throw accountError('アカウントIDが不正です',403);
  const key='avatars/'+session.user.id+'.png';
  await env.AVATARS.put(key,bytes,{httpMetadata:{contentType:'image/png',cacheControl:'public, max-age=300'},customMetadata:{owner:session.user.id}});
  const url=base.href.replace(/\/$/,'')+'/'+key+'?v='+crypto.randomUUID();
  await accountPatch(env,session.user.id,{avatar_url:url});
  return {user:accountPublic(session.user,await accountRow(env,session.user)),message:'アイコンを保存しました'};
}

async function handleAccountRequest(request, env) {
  const headers = new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Cookie'});
  const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers});
  try {
    const path = new URL(request.url).pathname;
    const bot = path.startsWith('/api/account/discord/');
    if(path === '/api/account/avatar-config' && request.method === 'GET')return reply(accountAvatarConfig(env));
    if (path === '/api/account/session' && request.method === 'GET') return reply({user:(await accountSession(request,env)).publicUser});
    if (request.method !== 'POST') throw accountError('POST only',405);
    if (!bot && request.headers.get('Origin') !== new URL(request.url).origin) throw accountError('送信元を確認できません',403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw accountError('JSONが必要です',415);
    const reader=request.body?.getReader();
    const chunks=[]; let length=0;
    if(reader) { while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>120000){await reader.cancel();throw accountError('入力が大きすぎます',413);}chunks.push(value);} }
    const bytes=new Uint8Array(length); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    const raw = new TextDecoder().decode(bytes);

    let body; try { body=JSON.parse(raw); } catch { throw accountError('入力形式が不正です'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw accountError('入力形式が不正です');
    if (bot) {
      const secret = String(env.DISCORD_BADGE_SECRET || '');
      const provided = request.headers.get('Authorization') || '';
      if (secret.length < 32 || !await accountSecretMatches(provided,'Bearer '+secret)) throw accountError('Unauthorized',401);
      if (body.guildId !== (env.DISCORD_BADGE_GUILD_ID || '1563119636952776806') || !/^\d{17,20}$/.test(body.discordUserId || '')) throw accountError('対象サーバーが違います',403);
      if (path.endsWith('/request')) {
        const row=await accountFind(env,body.identifier);
        if (!row || !row.verified_email || row.verified_email !== row.email || row.badge_blocked) return reply({challengeId:crypto.randomUUID(),message:'登録・確認済みのメールアドレスの場合、コードを送信します'});
        return reply(await accountIssue(request,env,row.email,'badge',body.discordUserId,{userId:row.user_id}));
      }
      if (path.endsWith('/confirm')) {
        const proof=await accountConsume(env,body,'badge',body.discordUserId);
        const target=await accountSupabase(env,'/auth/v1/admin/users/'+encodeURIComponent(proof.payload.userId),{admin:true});
        const row=await accountRow(env,target);
        if (!accountPublic(target,row).emailVerified || target.email.toLowerCase() !== proof.email) throw accountError('メール確認をやり直してください',403);
        await accountSupabase(env,'/rest/v1/rpc/halo_set_badge',{admin:true,method:'POST',body:{p_user:target.id,p_actor:'discord:'+body.discordUserId,p_granted:true,p_discord:body.discordUserId,p_admin:false}});
        return reply({message:'認証バッジを付与しました'});
      }
      throw accountError('Not found',404);
    }
    if (path === '/api/account/register-code') return reply(await accountIssue(request,env,accountEmail(body.email),'register','registration'));
    if (path === '/api/account/register-verify') {
      const email=accountEmail(body.email);
      const proof=await accountConsume(env,body,'register','registration');
      if(proof.email!==email)throw accountError('確認したメールアドレスと一致しません');
      return reply({registrationToken:await accountRegistrationProof(env,email)});
    }
    if (path === '/api/auth/signup') {
      const email=accountEmail(body.email), password=accountPassword(body.password), profile=accountProfileInput(body);
      if(profile.avatar_url.startsWith('data:'))throw accountError('画像ファイルは登録・ログイン後に設定してください');
      // Check the profile schema before consuming the single-use email proof.
      await accountSupabase(env,'/rest/v1/halo_accounts?select=user_id,email,verified_email,username,avatar_url,is_admin&limit=0',{admin:true});
      const proof=body.registrationToken
        ? await accountRegistrationProof(env,body.registrationToken,true)
        : await accountConsume(env,body,'register','registration');
      if (proof.email !== email) throw accountError('確認したメールアドレスと一致しません');
      let user;
      try {
        const result=await accountSupabase(env,'/auth/v1/admin/users',{admin:true,method:'POST',body:{email,password,email_confirm:true}});
        user=result?.user || result;
        if(!user?.id)throw accountError('認証サーバーの応答を確認できませんでした [create_user:INVALID_RESPONSE]',503);
      } catch(error) {
        throw accountError((error.status ? error.message : '認証サーバーと通信できませんでした [create_user:NETWORK]')+(body.registrationToken?'。登録済みならログインしてください。入力内容を直して再試行できます':'。登録済みならログインしてください。新規登録をやり直す場合は、確認メールを再送してください'),error.status || 503);
      }
      try {
        await accountSupabase(env,'/rest/v1/halo_accounts?on_conflict=user_id',{admin:true,method:'POST',prefer:'resolution=merge-duplicates',body:{user_id:user.id,email,verified_email:email,...profile,is_admin:email===(env.HALO_ADMIN_EMAIL || 'nikubanana809@gmail.com').toLowerCase()}});
      } catch(error) {
        throw accountError((error.status ? error.message : 'プロフィールの保存を確認できませんでした [profile:NETWORK]')+'。ログイン用アカウントは作成済みです。管理者による設定確認後、ログインし、アカウント設定からメールを再確認してください',error.status || 503);
      }
      return reply({message:'登録しました。ログインしてください'});
    }
    if (path === '/api/auth/signin' || path === '/api/account/refresh') {
      const refresh=path.endsWith('/refresh');
      const token=accountCookie(request,'halo_refresh');
      if (refresh && !token) throw accountError('ログインしてください',401);
      const credentials=refresh ? {refresh_token:token} : {email:accountEmail(body.email),password:String(body.password || '').slice(0,129)};
      const result=await accountSupabase(env,'/auth/v1/token?grant_type='+(refresh?'refresh_token':'password'),{method:'POST',body:credentials});
      const session=await accountSession(request,env,result.access_token);
      accountCookies(headers,result);
      return reply({user:session.publicUser});
    }
    if (path === '/api/account/logout') {
      const token=accountCookie(request,'halo_access');
      if (token) await accountSupabase(env,'/auth/v1/logout?scope=local',{method:'POST',token}).catch(()=>{});
      accountCookies(headers,null); return reply({ok:true});
    }
    const session=await accountSession(request,env);
    const {user,row,publicUser}=session;
    if(path === '/api/account/avatar')return reply(await accountUploadAvatar(request,env,session,body));
    if (path === '/api/account/profile') {
      const profile=accountProfileInput(body);
      if(profile.avatar_url.startsWith('data:') && profile.avatar_url!==row.avatar_url)throw accountError('ファイル画像は画像アップロードから保存してください');
      await accountPatch(env,user.id,profile);
      return reply({user:accountPublic(user,await accountRow(env,user))});
    }
    if (path === '/api/account/email-code') return reply(await accountIssue(request,env,accountEmail(user.email),'verify',user.id));
    if (path === '/api/account/verify-email') {
      const proof=await accountConsume(env,body,'verify',user.id);
      if (proof.email !== user.email.toLowerCase()) throw accountError('メールアドレスが変更されています');
      await accountSupabase(env,'/auth/v1/admin/users/'+user.id,{admin:true,method:'PUT',body:{email_confirm:true}});
      await accountPatch(env,user.id,{email:proof.email,verified_email:proof.email});
      return reply({user:accountPublic({...user,email_confirmed_at:new Date().toISOString()},await accountRow(env,user))});
    }
    if (path === '/api/account/password') {
      const password=accountPassword(body.newPassword);
      await accountReauth(env,session,body.currentPassword);
      await accountPatch(env,user.id,{sessions_revoked_before:Date.now()});
      await accountSupabase(env,'/auth/v1/admin/users/'+user.id,{admin:true,method:'PUT',body:{password}});
      await accountSupabase(env,'/auth/v1/logout?scope=global',{method:'POST',token:session.token});
      accountCookies(headers,null); return reply({message:'パスワードを変更しました。再ログインしてください'});
    }
    if (path === '/api/account/email-change-code' || path === '/api/account/email') {
      const email=accountEmail(body.email);
      if (email === user.email.toLowerCase()) throw accountError('新しいメールアドレスを入力してください');
      await accountReauth(env,session,body.currentPassword);
      if (path.endsWith('-code')) return reply(await accountIssue(request,env,email,'change',user.id));
      const proof=await accountConsume(env,body,'change',user.id);
      if (proof.email !== email) throw accountError('確認したメールアドレスと一致しません');
      await accountPatch(env,user.id,{sessions_revoked_before:Date.now()});
      await accountSupabase(env,'/auth/v1/admin/users/'+user.id,{admin:true,method:'PUT',body:{email,email_confirm:true}});
      await accountPatch(env,user.id,{email,verified_email:email,sessions_revoked_before:Date.now()});
      await accountSupabase(env,'/auth/v1/logout?scope=global',{method:'POST',token:session.token});
      accountCookies(headers,null); return reply({message:'メールアドレスを変更しました。再ログインしてください'});
    }
    if (path === '/api/account/admin/badge') {
      if (!publicUser.isAdmin) throw accountError('管理者権限が必要です',403);
      if (typeof body.granted !== 'boolean') throw accountError('付与・解除を指定してください');
      const target=await accountFind(env,body.identifier);
      if (!target) throw accountError('アカウントが見つかりません',404);
      const targetUser=await accountSupabase(env,'/auth/v1/admin/users/'+target.user_id,{admin:true});
      if (body.granted && !accountPublic(targetUser,target).emailVerified) throw accountError('対象ユーザーのメール確認が必要です');
      await accountSupabase(env,'/rest/v1/rpc/halo_set_badge',{admin:true,method:'POST',body:{p_user:target.user_id,p_actor:'admin:'+user.id,p_granted:body.granted,p_admin:true}});
      return reply({user:accountPublic(user,await accountRow(env,user)),message:body.granted?'バッジを付与しました':'バッジを解除しました（Discordからの再取得も停止）'});
    }
    throw accountError('Not found',404);
  } catch (error) {
    return reply({error:error.status ? error.message : '処理に失敗しました。時間を空けて再試行してください'},error.status || 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/account/') || ['/api/auth/signup','/api/auth/signin'].includes(url.pathname)) return handleAccountRequest(request, env);

    // ── 隠しコマンド: ?altSrc=1 で代替URL(tt.rec877.com / jikanwari.rec877.com)に強制切り替え ──
    // ?altSrc=1 → 有効化してCookieに保存 / ?altSrc=0 → 解除 / 指定なし → 既存Cookieを踏襲
    const altSrcParam = url.searchParams.get('altSrc');
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookieHasAlt = /(?:^|;\s*)alt_src=1(?:;|$)/.test(cookieHeader);
    const forceAltSrc = altSrcParam === '1' ? true : (altSrcParam === '0' ? false : cookieHasAlt);

    const primaryBackendUrl = getBackendBaseUrl(env);
    const altBackendUrl = (safeString(env?.YTDLP_BACKEND_FALLBACK_URL).replace(/\/+$/, '')) || 'https://tt.rec877.com';
    const backendBaseUrl = forceAltSrc ? altBackendUrl : primaryBackendUrl;

    if (url.pathname === '/api/archives' || /^\/api\/archives\/halotube-[a-f0-9-]{36}$/.test(url.pathname)) {
      const reply=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
      if(!['GET','POST'].includes(request.method) || (request.method==='POST' && url.pathname!=='/api/archives'))return reply('許可されていない操作です',405);
      if(!primaryBackendUrl)return reply('保存サーバーが設定されていません',503);
      if(request.method==='POST' && request.headers.get('Origin')!==url.origin)return reply('送信元を確認できません',403);
      const headers=new Headers();const token=accountCookie(request,'halo_access');if(token)headers.set('Authorization','Bearer '+token);
      let body;
      if(request.method==='POST'){
        if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply('JSONが必要です',415);
        const reader=request.body?.getReader();let size=0;const chunks=[];
        if(reader)while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2048){await reader.cancel();return reply('入力が大きすぎます',413);}chunks.push(part.value);}
        body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
        headers.set('Content-Type','application/json');
      }
      const offset=Math.max(0,Math.min(parseInt(url.searchParams.get('offset'),10)||0,2000));
      try{
        const response=await fetch(primaryBackendUrl+url.pathname+'?offset='+offset,{method:request.method,headers,body,redirect:'error',signal:AbortSignal.timeout(30000)});
        return new Response(response.body,{status:response.status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Cookie'}});
      }catch{return reply('アーカイブサーバーに接続できません',503);}
    }
    const archivePage=url.pathname.match(/^(.*?)\/archive\/(embed\/)?(halotube-[a-f0-9-]{36})\/?$/);
    if(archivePage){
      if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
      try{
        if(!primaryBackendUrl)throw new Error('Unavailable');
        const response=await fetch(primaryBackendUrl+'/api/archives/'+archivePage[3],{signal:AbortSignal.timeout(10000)});
        if(!response.ok)return new Response('アーカイブは準備中か、見つかりません。',{status:response.status,headers:{'Content-Type':'text/plain;charset=UTF-8'}});
        const {item}=await response.json();
        if(item?.id!==archivePage[3] || item.state!=='ready')throw new Error('Unavailable');
        const html=renderArchivePage(item,url.origin+url.pathname,!!archivePage[2],archivePage[1] || '/');
        return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html;charset=UTF-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
      }catch{return new Response('アーカイブを読み込めませんでした。しばらくしてから再試行してください。',{status:503,headers:{'Content-Type':'text/plain;charset=UTF-8'}});}
    }

    if (url.pathname.startsWith('/api/embed/video/')) {
      if (!['GET','HEAD'].includes(request.method) || !/^\/api\/embed\/video\/[A-Za-z0-9_-]{11}\.mp4$/.test(url.pathname)) return new Response('Not found',{status:404});
      if (!primaryBackendUrl) return new Response('Backend unavailable',{status:503});
      const headers = new Headers();
      if (request.headers.has('Range')) headers.set('Range',request.headers.get('Range'));
      try {
        const upstream = await fetch(primaryBackendUrl + url.pathname,{method:request.method,headers,redirect:'error',signal:request.signal});
        const output = new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
        for (const name of ['Content-Type','Content-Length','Content-Range','Accept-Ranges','Content-Disposition','Retry-After']) {
          if (upstream.headers.has(name)) output.set(name,upstream.headers.get(name));
        }
        return new Response(upstream.body,{status:upstream.status,headers:output});
      } catch { return new Response('Video unavailable',{status:502}); }
    }

    if (url.pathname.startsWith('/api/hls/')) {
      if (!['GET','HEAD'].includes(request.method) || !/^\/api\/hls\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(url.pathname)) return new Response('Not found',{status:404});
      if (!backendBaseUrl) return new Response('Backend unavailable',{status:503});
      const headers = new Headers();
      const access = accountCookie(request,'halo_access');
      if (access) headers.set('Authorization','Bearer '+access);
      if (request.headers.has('Range')) headers.set('Range',request.headers.get('Range'));
      try {
        const upstream=await fetch(backendBaseUrl+url.pathname,{method:request.method,headers,redirect:'error'});
        const output=new Headers({'Cache-Control':'private, no-store','Vary':'Cookie'});
        for(const name of ['Content-Type','Content-Length','Content-Range','Accept-Ranges']) if(upstream.headers.has(name)) output.set(name,upstream.headers.get(name));
        return new Response(upstream.body,{status:upstream.status,headers:output});
      } catch { return new Response('Backend unavailable',{status:503}); }
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // www.rec877.com → rec877.com リダイレクト
    if (url.hostname === 'www.rec877.com') {
      const redirectUrl = new URL(request.url);
      redirectUrl.hostname = 'rec877.com';
      return Response.redirect(redirectUrl.toString(), 301);
    }

    if (url.hostname === 's-ht.f5.si' && url.pathname === '/watch') {
      const id = safeString(url.searchParams.get('v') || url.searchParams.get('id'));
      if (isValidYouTubeVideoId(id)) {
        const redirectUrl = new URL(getPublicAppUrl(env));
        redirectUrl.pathname = '/watch';
        redirectUrl.search = `?v=${encodeURIComponent(id)}`;
        return Response.redirect(redirectUrl.toString(), 302);
      }
    }

    // ── API: QR Approval - Request session ──────────────────────────────────
    // POST /api/approval/request  → { session_id }
    if (url.pathname === '/api/approval/request') {
      if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);
      if (!env.APPROVAL_KV) return jsonResponse({ error: 'APPROVAL_KV バインディングが未設定です' }, 500);
      const sessionId = crypto.randomUUID();
      const EXPIRE_SECONDS = 5 * 60; // 5分
      await env.APPROVAL_KV.put(
        'approval:' + sessionId,
        JSON.stringify({ approved: false, token: null, created: Date.now() }),
        { expirationTtl: EXPIRE_SECONDS }
      );
      return jsonResponse({ session_id: sessionId });
    }

    // ── API: QR Approval - Check session ────────────────────────────────────
    // GET /api/approval/check?s=SESSION_ID  → { approved, token? }
    if (url.pathname === '/api/approval/check') {
      const sid = safeString(url.searchParams.get('s'));
      if (!sid) return jsonResponse({ approved: false, error: 'セッションIDがありません' }, 400);
      if (!env.APPROVAL_KV) return jsonResponse({ approved: false, error: 'APPROVAL_KV 未設定' }, 500);
      const raw = await env.APPROVAL_KV.get('approval:' + sid);
      if (!raw) return jsonResponse({ approved: false, expired: true });
      const data = JSON.parse(raw);
      if (data.approved) {
        return jsonResponse({ approved: true, token: sid });
      }
      return jsonResponse({ approved: false });
    }

    // ── API: QR Approval - Confirm (承諾者が押す) ────────────────────────────
    // POST /api/approval/confirm  body: { session_id, discord_token }
    if (url.pathname === '/api/approval/confirm') {
      const ALLOWED_DISCORD_ID = '1047797479665578014';
      if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);
      if (!env.APPROVAL_KV) return jsonResponse({ error: 'APPROVAL_KV 未設定' }, 500);
      let body;
      try { body = await request.json(); } catch(e) { return jsonResponse({ error: '不正なリクエスト' }, 400); }
      const sid = typeof body.session_id === 'string' ? body.session_id.trim() : '';
      const discordToken = typeof body.discord_token === 'string' ? body.discord_token.trim() : '';
      if (!sid) return jsonResponse({ error: 'セッションIDがありません' }, 400);
      if (!discordToken) return jsonResponse({ error: 'Discordログインが必要です', need_discord: true }, 403);

      // Discordトークンを検証
      const tokenRaw = await env.APPROVAL_KV.get('discord_token:' + discordToken);
      if (!tokenRaw) return jsonResponse({ error: 'Discordトークンが無効または期限切れです', need_discord: true }, 403);
      let accessToken;
      try { accessToken = JSON.parse(tokenRaw).access_token; } catch { return jsonResponse({ error: 'トークン解析エラー' }, 500); }

      const meRes = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: 'Bearer ' + accessToken },
      });
      const me = await meRes.json();
      if (!me.id) return jsonResponse({ error: 'Discordユーザー確認失敗' }, 500);
      if (me.id !== ALLOWED_DISCORD_ID) return jsonResponse({ error: 'このDiscordアカウントには承諾権限がありません' }, 403);

      const raw = await env.APPROVAL_KV.get('approval:' + sid);
      if (!raw) return jsonResponse({ error: 'セッションが見つからないか期限切れです', expired: true }, 404);
      const data = JSON.parse(raw);
      if (data.approved) return jsonResponse({ ok: true, already: true });
      data.approved = true;
      data.approvedAt = Date.now();
      data.approvedBy = me.id;
      await env.APPROVAL_KV.put('approval:' + sid, JSON.stringify(data), { expirationTtl: 30 * 24 * 60 * 60 });
      return jsonResponse({ ok: true });
    }

    // ── /approve  承諾用ページ ────────────────────────────────────────────
    if (url.pathname === '/approve') {
      const clientId = safeString(env.DISCORD_CLIENT_ID);
      const appUrl = getPublicAppUrl(env);
      if (!clientId) {
        return new Response('DISCORD_CLIENT_ID が未設定です', { status: 500 });
      }
      return new Response(buildApprovalPage(clientId, appUrl), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'no-store' },
      });
    }

    // ── API: Discord OAuthコールバック ────────────────────────────────────
    // GET /api/discord-callback?code=...&state=SESSION_ID
    if (url.pathname === '/api/discord-callback') {
      const code = safeString(url.searchParams.get('code'));
      const state = safeString(url.searchParams.get('state')); // session_id
      const clientId = safeString(env.DISCORD_CLIENT_ID);
      const clientSecret = safeString(env.DISCORD_CLIENT_SECRET);
      const appUrl = getPublicAppUrl(env);
      const redirectUri = appUrl + '/api/discord-callback';

      if (!code) return new Response('codeがありません', { status: 400 });
      if (!clientId || !clientSecret) return new Response('Discord OAuth設定が不完全です', { status: 500 });
      if (!env.APPROVAL_KV) return new Response('APPROVAL_KV 未設定', { status: 500 });

      try {
        // アクセストークン取得
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
          return new Response('Discordトークン取得失敗: ' + JSON.stringify(tokenData), { status: 500 });
        }

        // 一時トークンをKVに保存（10分）
        const tempToken = crypto.randomUUID();
        await env.APPROVAL_KV.put(
          'discord_token:' + tempToken,
          JSON.stringify({ access_token: tokenData.access_token }),
          { expirationTtl: 10 * 60 }
        );

        // /approve?s=SESSION_ID&discord_token=TEMP_TOKEN にリダイレクト
        const returnUrl = appUrl + '/approve?s=' + encodeURIComponent(state) + '&discord_token=' + encodeURIComponent(tempToken);
        return Response.redirect(returnUrl, 302);
      } catch (e) {
        return new Response('OAuthエラー: ' + e.message, { status: 500 });
      }
    }

    // ── API: Discord権限確認 ──────────────────────────────────────────────
    // GET /api/approval/verify-discord?t=TEMP_TOKEN
    // 許可ユーザーID: 1047797479665578014
    if (url.pathname === '/api/approval/verify-discord') {
      const ALLOWED_DISCORD_ID = '1047797479665578014';
      const tempToken = safeString(url.searchParams.get('t'));
      if (!tempToken) return jsonResponse({ ok: false, error: 'トークンがありません' }, 400);
      if (!env.APPROVAL_KV) return jsonResponse({ ok: false, error: 'APPROVAL_KV 未設定' }, 500);

      const raw = await env.APPROVAL_KV.get('discord_token:' + tempToken);
      if (!raw) return jsonResponse({ ok: false, error: 'トークンが無効または期限切れです' }, 401);

      let accessToken;
      try { accessToken = JSON.parse(raw).access_token; } catch { return jsonResponse({ ok: false }, 500); }

      try {
        const meRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: 'Bearer ' + accessToken },
        });
        const me = await meRes.json();
        if (!me.id) return jsonResponse({ ok: false, error: 'ユーザー情報取得失敗' }, 500);

        const allowed = me.id === ALLOWED_DISCORD_ID;
        const avatarUrl = me.avatar
          ? 'https://cdn.discordapp.com/avatars/' + me.id + '/' + me.avatar + '.png?size=64'
          : null;
        return jsonResponse({
          ok: true,
          allowed,
          username: (me.global_name || me.username || '') + (me.discriminator && me.discriminator !== '0' ? '#' + me.discriminator : ''),
          avatar: avatarUrl,
          discord_id: me.id,
        });
      } catch (e) {
        return jsonResponse({ ok: false, error: e.message }, 500);
      }
    }

    // ── API: Email Code - Request send ──────────────────────────────────────
    // POST /api/email/request  body: { email }
    if (url.pathname === '/api/email/request') {
      if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);
      if (!env.APPROVAL_KV) return jsonResponse({ error: 'APPROVAL_KV バインディングが未設定です' }, 500);
      let body;
      try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'リクエストボディが不正です' }, 400); }
      const email = safeString(body.email).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ error: 'メールアドレスの形式が不正です' }, 400);
      }
      const kvKey = 'email_code:' + email;
      const existingRaw = await env.APPROVAL_KV.get(kvKey);
      if (existingRaw) {
        let existing;
        try { existing = JSON.parse(existingRaw); } catch (e) { existing = null; }
        if (existing && Date.now() - existing.created < 60 * 1000) {
          return jsonResponse({ error: '再送信は60秒後にお試しください' }, 429);
        }
      }
      const code = generateEmailCode();
      await env.APPROVAL_KV.put(
        kvKey,
        JSON.stringify({ code, attempts: 0, created: Date.now() }),
        { expirationTtl: 10 * 60 }
      );
      try {
        await sesSendEmail(env, {
          to: email,
          subject: '【HaloTube】認証コード',
          text: `HaloTubeの認証コードは ${code} です。\n10分以内に入力してください。\nこのメールに心当たりがない場合は無視してください。`,
          html:
            `<p>HaloTubeの認証コードは <b style="font-size:20px;letter-spacing:2px;">${code}</b> です。</p>` +
            `<p>10分以内に入力してください。</p>` +
            `<p>このメールに心当たりがない場合は無視してください。</p>`,
        });
      } catch (e) {
        const sesErrMsg = (e && e.message) ? String(e.message) : String(e);
        console.error('[email/request] SES error: ' + sesErrMsg);
        await env.APPROVAL_KV.delete(kvKey);
        return jsonResponse({ error: 'メール送信に失敗しました。しばらくしてから再度お試しください。' }, 500);
      }
      return jsonResponse({ ok: true });
    }

    // ── API: Email Code - Verify ────────────────────────────────────────────
    // POST /api/email/verify  body: { email, code }
    if (url.pathname === '/api/email/verify') {
      if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);
      if (!env.APPROVAL_KV) return jsonResponse({ error: 'APPROVAL_KV バインディングが未設定です' }, 500);
      let body;
      try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'リクエストボディが不正です' }, 400); }
      const email = safeString(body.email).toLowerCase();
      const code = safeString(body.code);
      if (!email || !code) return jsonResponse({ valid: false, message: 'メールアドレスとコードが必要です' }, 400);
      const kvKey = 'email_code:' + email;
      const raw = await env.APPROVAL_KV.get(kvKey);
      if (!raw) return jsonResponse({ valid: false, message: 'コードの有効期限が切れています。再送信してください。' });
      let data;
      try { data = JSON.parse(raw); } catch (e) { return jsonResponse({ valid: false, message: 'サーバーエラーが発生しました。' }, 500); }
      if (data.attempts >= 5) {
        await env.APPROVAL_KV.delete(kvKey);
        return jsonResponse({ valid: false, message: '試行回数の上限に達しました。コードを再送信してください。' });
      }
      if (data.code !== code) {
        data.attempts += 1;
        await env.APPROVAL_KV.put(kvKey, JSON.stringify(data), { expirationTtl: 10 * 60 });
        return jsonResponse({ valid: false, message: 'コードが正しくありません。' });
      }
      await env.APPROVAL_KV.delete(kvKey);
      const token = crypto.randomUUID();
      await env.APPROVAL_KV.put(
        'email_session:' + token,
        JSON.stringify({ email, created: Date.now() }),
        { expirationTtl: 30 * 24 * 60 * 60 }
      );
      return jsonResponse({ valid: true, token, email });
    }

    // ── API: Email Session Check ────────────────────────────────────────────
    // GET /api/email/check?token=...
    if (url.pathname === '/api/email/check') {
      const token = safeString(url.searchParams.get('token'));
      if (!token) return jsonResponse({ valid: false });
      if (!env.APPROVAL_KV) return jsonResponse({ valid: false, error: 'APPROVAL_KV 未設定' }, 500);
      const raw = await env.APPROVAL_KV.get('email_session:' + token);
      if (!raw) return jsonResponse({ valid: false });
      let data;
      try { data = JSON.parse(raw); } catch (e) { return jsonResponse({ valid: false }); }
      return jsonResponse({ valid: true, email: data.email });
    }

    // ── API: License Key Verification ────────────────────────────────────────
    // POST /api/license/verify  body: { key: string }
    if (url.pathname === '/api/license/verify') {
      if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return jsonResponse({ error: 'Supabase環境変数が未設定です (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' }, 500);
      }
      let licBody;
      try { licBody = await request.json(); } catch (e) {
        return jsonResponse({ error: 'リクエストボディが不正です' }, 400);
      }
      const licenseKey = typeof licBody.key === 'string' ? licBody.key.trim() : '';
      if (!licenseKey || licenseKey.length !== 256) {
        return jsonResponse({ valid: false, error: 'ライセンスキーの形式が不正です（256文字必要）' });
      }
      const sbUrl  = env.SUPABASE_URL.replace(/\/$/, '');
      const sbKey  = env.SUPABASE_SERVICE_ROLE_KEY;
      const sbHeaders = {
        'Content-Type':  'application/json',
        'apikey':        sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Prefer':        'return=representation',
      };
      try {
        // ① キーを取得
        const selectRes = await fetch(
          `${sbUrl}/rest/v1/license_keys?key=eq.${encodeURIComponent(licenseKey)}&select=id,used,expires_at&limit=1`,
          { headers: sbHeaders }
        );
        const rows = await selectRes.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          return jsonResponse({ valid: false, message: 'ライセンスキーが見つかりません。' });
        }
        const row = rows[0];
        const now = Date.now();
        const expiresAt = new Date(row.expires_at).getTime();
        if (expiresAt < now) {
          return jsonResponse({ valid: false, message: 'ライセンスキーの有効期限が切れています。' });
        }
        // ② 使用済みキー → LocalStorage 保存済み確認用に valid_stored を返す
        if (row.used) {
          return jsonResponse({ valid: false, valid_stored: true });
        }
        // ③ 初回使用: 即座に使用済みにマーク
        const updateRes = await fetch(
          `${sbUrl}/rest/v1/license_keys?id=eq.${row.id}`,
          {
            method: 'PATCH',
            headers: sbHeaders,
            body: JSON.stringify({ used: true, used_at: new Date().toISOString() }),
          }
        );
        if (!updateRes.ok) {
          const errText = await updateRes.text();
          console.error('[license/verify] update error:', errText);
          return jsonResponse({ valid: false, message: 'キーの処理中にエラーが発生しました。' });
        }
        return jsonResponse({ valid: true });
      } catch (e) {
        console.error('[license/verify] error:', e);
        return jsonResponse({ valid: false, message: 'サーバーエラーが発生しました。' }, 500);
      }
    }

    // API: Halo API server status
    if (url.pathname === '/api/server-status') {
      const alive = await checkHaloApiStatus();
      return jsonResponse({ alive });
    }

    // API: Search
    if (url.pathname === '/api/search') {
      const q = safeString(url.searchParams.get('q'));
      const pageToken = safeString(url.searchParams.get('pageToken'));
      const channelId = safeString(url.searchParams.get('channelId'));
      const searchType = safeString(url.searchParams.get('type')) === 'channel' ? 'channel' : 'video';
      const searchLimit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit'), 10) || (searchType === 'channel' ? 3 : 20), 50));
      if (!q) return jsonResponse({ error: '検索クエリがありません' }, 400);

      // yt-dlp の続きを別の検索プロバイダーへ送らない。
      const backendPage = pageToken.startsWith('ytdlp:');
      if (backendPage && !backendBaseUrl) return jsonResponse({ error: '検索サーバーに接続できません。再試行してください' }, 503);
      if (backendBaseUrl && (!pageToken || backendPage) && !channelId) {
        try {
          const res = await fetch(`${backendBaseUrl}/api/search?q=${encodeURIComponent(q)}&limit=${searchLimit}&type=${searchType}&pageToken=${encodeURIComponent(pageToken)}`);
          const text = await res.text();
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = JSON.parse(text);
            if (res.ok && !data.error && Array.isArray(data.items) && (data.items.length || backendPage)) {
              if (searchType === 'video') {
                try { await withKeyRotation(env, key => enrichSearchVideos(data.items, key)); }
                catch (_) { /* カテゴリの補完失敗でも検索結果は表示する */ }
              }
              return jsonResponse(data);
            }
          }
        } catch (e) {
          console.warn('[search] yt-dlp backend fallback:', e.message);
        }
        if (backendPage) return jsonResponse({ error: '続きを取得できませんでした。再試行してください' }, 502);
      }

      try {
        const search = await withKeyRotation(env, key => searchYouTube(q, { pageToken, channelId, type: searchType, maxResults: searchLimit }, key));
        return jsonResponse(search);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: Channel details
    if (url.pathname === '/api/channel') {
      const id = safeString(url.searchParams.get('id'));
      if (!id) return jsonResponse({ error: 'チャンネルIDがありません' }, 400);
      try {
        const channel = await withKeyRotation(env, key => getYouTubeChannelDetails(id, key));
        return jsonResponse(channel);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: Channel tabs via yt-dlp backend
    if (url.pathname === '/api/channel-tab') {
      const id = safeString(url.searchParams.get('id'));
      const tab = safeString(url.searchParams.get('tab')) || 'videos';
      const limit = safeString(url.searchParams.get('limit')) || '20';
      const pageToken = safeString(url.searchParams.get('pageToken'));
      if (!id) return jsonResponse({ error: 'チャンネルIDがありません' }, 400);
      if (backendBaseUrl) {
        try {
          const tabUrl = `${backendBaseUrl}/api/channel_tab?id=${encodeURIComponent(id)}` +
            `&tab=${encodeURIComponent(tab)}&limit=${encodeURIComponent(limit)}` +
            (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
          const res = await fetch(tabUrl);
          const text = await res.text();
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            throw new Error('バックエンドがJSONではなくHTMLを返しました');
          }
          const data = JSON.parse(text);
          if (data.detail && !data.error) data.error = data.detail;
          if (!res.ok || data.error) throw new Error(data.error || `Backend error ${res.status}`);
          return jsonResponse(data, res.status);
        } catch (e) {
          console.warn('[channel-tab] yt-dlp backend fallback:', e.message);
        }
      }
      try {
        const fallback = await withKeyRotation(env, key => getYouTubeChannelTabFallback(id, { tab, maxResults: limit, pageToken }, key));
        return jsonResponse(fallback);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: Video details
    if (url.pathname === '/api/video') {
      const id = safeString(url.searchParams.get('id'));
      if (!id) return jsonResponse({ error: '動画IDがありません' }, 400);
      try {
        const video = await withKeyRotation(env, key => getYouTubeVideoDetails(id, key));
        return jsonResponse(video);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: Comments
    if (url.pathname === '/api/comments') {
      const id = safeString(url.searchParams.get('id'));
      const order = safeString(url.searchParams.get('order')) === 'time' ? 'time' : 'relevance';
      const pageToken = safeString(url.searchParams.get('pageToken'));
      if (!id) return jsonResponse({ error: '動画IDがありません' }, 400);
      try {
        const comments = await withKeyRotation(env, key => getYouTubeComments(id, { order, pageToken }, key));
        return jsonResponse(comments);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: Comment replies（「さらに返信を読み込む」用）
    if (url.pathname === '/api/comment_replies') {
      const parentId = safeString(url.searchParams.get('parentId'));
      const pageToken = safeString(url.searchParams.get('pageToken'));
      if (!parentId) return jsonResponse({ error: 'parentIdがありません' }, 400);
      try {
        const result = await withKeyRotation(env, key => getYouTubeCommentReplies(parentId, pageToken, key));
        return jsonResponse(result);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: Stream URL
// /api/stream の部分を書き換え
    if (url.pathname === '/api/media/tracks' || url.pathname === '/api/media/subtitle') {
      const id = safeString(url.searchParams.get('id'));
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return jsonResponse({error:'動画IDが不正です'},400);
      if (!backendBaseUrl) return jsonResponse({error:'再生サーバーが未設定です'},503);
      const params = new URLSearchParams({id});
      if (url.pathname.endsWith('/subtitle')) params.set('track', (url.searchParams.get('track') || '').slice(0,120));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      try {
        const res = await fetch(backendBaseUrl + url.pathname + '?' + params, {signal:controller.signal});
        return new Response(res.body, {status:res.status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
      } catch (_) { return jsonResponse({error:'字幕・音声情報を取得できませんでした'},502); }
      finally {clearTimeout(timer);}
    }

    if (url.pathname === '/api/stream/prepare') {
      const id = safeString(url.searchParams.get('id'));
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return jsonResponse({ error: '動画IDが不正です' }, 400);
      if (!backendBaseUrl) return jsonResponse({ prepared: false }, 503);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 22000);
      try {
        const res = await fetch(backendBaseUrl + '/api/stream/prepare?id=' + encodeURIComponent(id), { signal: controller.signal });
        return new Response(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      } catch (_) {
        return jsonResponse({ prepared: false }, 503);
      } finally { clearTimeout(timer); }
    }

    if (url.pathname === '/api/stream') {
      const id = safeString(url.searchParams.get('id'));
      const experimental = safeString(url.searchParams.get('experimental'));
      const playbackParams = new URLSearchParams();
      playbackParams.set('audio', (url.searchParams.get('audio') || 'auto').slice(0,80));
      if (url.searchParams.get('refresh') === '1') playbackParams.set('refresh', '1');
      playbackParams.set('quality', ['240p','360p','480p','720p','1080p'].includes(url.searchParams.get('quality')) ? url.searchParams.get('quality') : 'auto');
      const seek = Number(url.searchParams.get('seek'));
      if (Number.isFinite(seek) && seek > 0) playbackParams.set('seek', String(seek));
      playbackParams.set('codecs', ['av1', 'vp9'].filter(c => (url.searchParams.get('codecs') || '').split(',').includes(c)).join(','));
      const engineParam = safeString(url.searchParams.get('engine')) === 'youtubejs' ? '&engine=youtubejs' : '';
      if (!id) return jsonResponse({ error: '動画IDがありません' }, 400);
      if (!backendBaseUrl) return jsonResponse({ error: 'YTDLP_BACKEND_URL が未設定です' }, 500);

      // バックエンドで候補を最大3回試すため、中継側では同じ長時間処理を繰り返さない。
      const STREAM_FETCH_TIMEOUT_MS = 100000;
      const MAX_STREAM_ATTEMPTS = 1;
      let lastError;
      for (let attempt = 0; attempt < MAX_STREAM_ATTEMPTS; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), STREAM_FETCH_TIMEOUT_MS);
          
          let res;
          try {
            res = await fetch(`${backendBaseUrl}/api/stream?id=${encodeURIComponent(id)}${experimental ? '&experimental=' + encodeURIComponent(experimental) : ''}${engineParam}&${playbackParams.toString()}`, {
              signal: controller.signal,
              headers: accountCookie(request,'halo_access') ? {Authorization:'Bearer '+accountCookie(request,'halo_access')} : {},
            });
          } finally {
            clearTimeout(timeoutId);
          }
          
          const data = await res.json();
          
          // バックエンドが「ストリーム状態が失われました」を返した場合 → リトライ
          if (data.detail === 'ストリーム状態が失われました' && attempt < MAX_STREAM_ATTEMPTS - 1) {
            console.warn(`[stream] リトライ ${attempt + 1}/${MAX_STREAM_ATTEMPTS}: ${data.detail}`);
            await new Promise(r => setTimeout(r, 500 * (attempt + 1))); // 待機
            continue;
          }
          
          if (data.detail && !data.error) data.error = data.detail;
          if (data.url && !data.url.startsWith('http') && !data.restricted && !data.isLive) {
            data.url = `${backendBaseUrl}${data.url}`;
          }
          return new Response(JSON.stringify(data),{status:res.status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie'}});
          
        } catch (e) {
          lastError = e;
          if (attempt < MAX_STREAM_ATTEMPTS - 1) {
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            continue;
          }
        }
      }
      
      return jsonResponse({ 
        error: lastError?.message || 'バックエンドが応答しませんでした',
        detail: '複数回リトライしましたが失敗しました'
      }, 500);
    }

    // API: Live chat
    if (url.pathname === '/api/live_chat') {
      const id = safeString(url.searchParams.get('id'));
      const continuation = safeString(url.searchParams.get('continuation'));
      if (!id) return jsonResponse({ error: '動画IDがありません' }, 400);
      if (!backendBaseUrl) return jsonResponse({ error: 'YTDLP_BACKEND_URL が未設定です' }, 500);
      const chatUrl = `${backendBaseUrl}/api/live_chat?id=${encodeURIComponent(id)}` +
        (continuation ? `&continuation=${encodeURIComponent(continuation)}` : '');
      const res = await fetch(chatUrl);
      const data = await res.json();
      if (data.detail && !data.error) data.error = data.detail;
      return jsonResponse(data, res.status);
    }

    // API: Stream heartbeat（タブが開いている/再生中である合図）
    if (url.pathname === '/api/stream/heartbeat') {
      const id = safeString(url.searchParams.get('id'));
      const playing = safeString(url.searchParams.get('playing'));
      if (!id) return jsonResponse({ ok: false, error: '動画IDがありません' }, 400);
      if (!backendBaseUrl) return jsonResponse({ ok: false, error: 'YTDLP_BACKEND_URL が未設定です' }, 500);
      try {
        const res = await fetch(
          `${backendBaseUrl}/api/stream/heartbeat?id=${encodeURIComponent(id)}` +
          (playing ? `&playing=${encodeURIComponent(playing)}` : '')
        );
        const data = await res.json().catch(() => ({ ok: false }));
        return jsonResponse(data, res.status);
      } catch (e) {
        return jsonResponse({ ok: false, error: e.message }, 500);
      }
    }

    // API: Preview frame
    if (url.pathname === '/api/preview') {
      const id = safeString(url.searchParams.get('id'));
      const t = safeString(url.searchParams.get('t')) || '0';
      if (!id) return jsonResponse({ error: '動画IDがありません' }, 400);
      if (!backendBaseUrl) return jsonResponse({ error: 'YTDLP_BACKEND_URL が未設定です' }, 500);
      const res = await fetch(`${backendBaseUrl}/api/preview?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`, {headers: accountCookie(request,'halo_access') ? {Authorization:'Bearer '+accountCookie(request,'halo_access')} : {}});

      return new Response(res.body, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'private, no-store',
          'Vary': 'Cookie',
        },
      });
    }

    // API: Video data
    if (url.pathname === '/api/video_data') return jsonResponse({error:'この旧配信経路は廃止しました。動画ページから再生してください'},410);

    // Include deployment prefixes such as /momijichan/watch and trailing slashes.
    if (/[/]watch[/]?$/.test(url.pathname)) {
      const videoId = safeString(url.searchParams.get('v') || url.searchParams.get('id'));
      if (isValidYouTubeVideoId(videoId)) {
        try {
          const video = await getWatchPreview(videoId);
          const pageUrl = new URL(url.origin + url.pathname.replace(/[/]+$/, ''));
          pageUrl.searchParams.set('v', videoId);
          const mediaUrl = primaryBackendUrl ? new URL('/api/embed/video/' + videoId + '.mp4', url.origin).href : '';
          const dynamicHtml = renderWatchPreview(HTML_PAGE, video, pageUrl.href, mediaUrl);
          const headers = {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'no-store',
          };
          if (altSrcParam === '1' || altSrcParam === '0') {
            headers['Set-Cookie'] = `alt_src=${altSrcParam === '1' ? '1' : '0'}; Path=/; Max-Age=2592000; SameSite=Lax`;
          }
          return new Response(injectEnv(dynamicHtml, env, forceAltSrc), { headers });
        } catch (_) {
          // Deleted/private videos and upstream failures must not prevent the SPA from opening.
        }
      }
    }

    // All other paths → serve SPA
    {
      const headers = {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-store',
      };
      if (altSrcParam === '1' || altSrcParam === '0') {
        headers['Set-Cookie'] = `alt_src=${altSrcParam === '1' ? '1' : '0'}; Path=/; Max-Age=2592000; SameSite=Lax`;
      }
      return new Response(injectEnv(HTML_PAGE, env, forceAltSrc), { headers });
    }
  },
};
