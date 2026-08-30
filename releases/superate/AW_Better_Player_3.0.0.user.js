// ==UserScript==
// @name         AnimeWorld Better Player
// @namespace    aw-better-player
// @version      3.0.0
// @match        *://www.animeworld.ac/play/*
// @run-at       document-start
// @description  Il player migliore di sempre — riscritto da zero.
// @description:it Il player migliore di sempre — riscritto da zero.
// @license      MIT
// @grant        unsafeWindow
// @connect      cibernetic-gg.workers.dev
// ==/UserScript==
// Icone UI: Lucide (ISC) — https://lucide.dev · Loghi brand: Simple Icons (CC0) — https://simpleicons.org

"use strict";
(() => {
  // src/core/block-src.js
  function installSrcBlocker() {
    const _srcDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
    Object.defineProperty(HTMLScriptElement.prototype, "src", {
      configurable: true,
      enumerable: true,
      get() {
        return _srcDesc.get.call(this);
      },
      set(val) {
        if (typeof val === "string" && val.includes("playerServersAndDownloads")) return;
        _srcDesc.set.call(this, val);
      }
    });
  }

  // src/lib/env.js
  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  var pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

  // src/styles/css-panels.js
  function reportCss() {
    const sel = "#aw-np-report-panel";
    return `
            ${sel} .aw-np-pn-title-ic{display:flex;align-items:center;justify-content:center;flex-shrink:0}
            ${sel} .aw-np-pn-title-ic svg{width:1em;height:1em;color:var(--pn-accent)}
            ${sel} .aw-np-rp-body{gap:0}
            ${sel} .aw-np-rp-tabs{display:flex;flex-shrink:0;margin-bottom:18px;border-bottom:var(--pn-line)}
            ${sel} .aw-np-rp-tab{flex:1;min-width:0;background:none;color:var(--pn-fg);border:none;border-radius:0;padding:0 4px 11px;margin-bottom:-1px;font-size:var(--pn-fs-small);font-weight:500;font-family:inherit;cursor:pointer;opacity:.5;border-bottom:2px solid transparent;transition:opacity var(--pn-t),border-color var(--pn-t);white-space:nowrap;text-align:center}
            ${sel} .aw-np-rp-tab.sel{opacity:1;font-weight:600;border-bottom-color:var(--pn-accent)}
            @media (hover:hover){${sel} .aw-np-rp-tab:hover:not(.sel){opacity:.78}}

            ${sel} .aw-np-rp-stage{position:relative;flex:none;height:13.5em}
            ${sel} .aw-np-rp-sec{position:absolute;inset:0;display:none;flex-direction:column}
            ${sel} .aw-np-rp-sec.show{display:flex}
            ${sel} .aw-np-rp-sec-skip{justify-content:space-between;gap:6px}

            ${sel} .aw-np-rp-seghead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:1px}
            ${sel} .aw-np-rp-subsel{display:flex;gap:4px}
            ${sel} .aw-np-rp-sub{display:flex;align-items:center;justify-content:center;min-width:5.5em;background:var(--pn-hover);color:inherit;border:1px solid transparent;border-radius:var(--pn-r);padding:5px 14px;font-size:var(--pn-fs-micro);font-weight:600;font-family:inherit;cursor:pointer;transition:background-color var(--pn-t),border-color var(--pn-t)}
            ${sel} .aw-np-rp-sub.sel{background:var(--pn-sel)}
            ${sel} .aw-np-rp-sub.filled{border-color:var(--pn-accent)}
            @media (hover:hover){${sel} .aw-np-rp-sub:hover:not(.sel){background:var(--pn-hover-2)}}

            ${sel} .aw-np-arow{opacity:0;transform:translateY(18px) scale(.98);transition:opacity var(--np-t-slow) var(--np-ease),transform var(--np-t-slower) var(--np-ease-spring)}
            ${sel}.open .aw-np-arow{opacity:1;transform:translateY(0) scale(1)}
            ${sel}.open .aw-np-rp-privacy.aw-np-arow{opacity:.55}
            ${sel}.open .aw-np-rp-group.dim{opacity:.35;transform:translateY(0) scale(1)}

            ${sel} .aw-np-rp-group{display:flex;flex-direction:column;gap:7px;transition:opacity var(--pn-t)}
            ${sel} .aw-np-rp-group.dim{opacity:.35;pointer-events:none}
            ${sel} .aw-np-rp-grouplbl{font-size:var(--pn-fs-body);font-weight:600}
            ${sel} .aw-np-rp-optrow{display:flex;gap:7px}
            ${sel} .aw-np-rp-opt{flex:1;min-width:0;background:var(--pn-hover);color:inherit;border:1px solid transparent;border-radius:var(--pn-r);padding:10px 6px;font-size:var(--pn-fs-small);font-weight:500;font-family:inherit;cursor:pointer;transition:background-color var(--pn-t),border-color var(--pn-t),transform var(--pn-t);white-space:nowrap;text-align:center}
            ${sel} .aw-np-rp-opt.sel{background:var(--pn-sel);border-color:var(--pn-accent)}
            @media (hover:hover){${sel} .aw-np-rp-opt:hover{background:var(--pn-hover-2)}}
            ${sel} .aw-np-rp-opt:active{transform:scale(.97)}
            ${sel} .aw-np-rp-msg{font-size:var(--pn-fs-micro);font-weight:600;line-height:1.3;height:1.3em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.02em;transition:color var(--pn-t)}
            ${sel} .aw-np-rp-msg.empty,${sel} .aw-np-rp-msg.idle{color:transparent}
            ${sel} .aw-np-rp-msg.good{color:var(--np-ok)}
            ${sel} .aw-np-rp-msg.bad{color:var(--np-danger)}
            ${sel} .aw-np-rp-msg.mod{color:var(--np-warn)}

            ${sel} .aw-np-rp-privacy{font-size:var(--pn-fs-micro);font-style:italic;opacity:.55;text-align:center;line-height:1.4;padding-top:2px}

            ${sel} .aw-np-rp-sec-player{align-items:center;justify-content:flex-start;text-align:center;gap:16px;padding-top:8px}
            ${sel} .aw-np-rp-pl-txt{font-size:var(--pn-fs-body);line-height:1.6;opacity:.9;max-width:32em;text-align:justify;text-align-last:justify}
            ${sel} .aw-np-rp-pl-txt2{font-size:var(--pn-fs-body);line-height:1.6;font-weight:600;opacity:.95;max-width:32em;text-align:justify;text-align-last:justify}
            ${sel} .aw-np-rp-pl-btns{display:flex;gap:9px;width:100%;max-width:32em;margin-top:4px}
            ${sel} .aw-np-rp-extlink{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--pn-hover);color:var(--pn-fg);text-decoration:none;border-radius:var(--pn-r);padding:12px 8px;font-size:var(--pn-fs-small);font-weight:600;border:1px solid transparent;transition:background-color var(--pn-t),border-color var(--pn-t),transform var(--pn-t)}
            ${sel} .aw-np-rp-extlink-ic{display:flex;align-items:center;flex-shrink:0;color:var(--pn-accent)}
            ${sel} .aw-np-rp-extlink-ic svg{width:1.2em;height:1.2em;fill:currentColor}
            @media (hover:hover){${sel} .aw-np-rp-extlink:hover{background:var(--pn-hover-2);border-color:color-mix(in srgb,var(--pn-accent) 45%,transparent)}}
            ${sel} .aw-np-rp-extlink:active{transform:scale(.97)}

            ${sel} .aw-np-rp-footer{display:flex;align-items:center;gap:10px;flex-shrink:0;margin-top:14px;padding-top:13px;border-top:var(--pn-line)}
            ${sel} .aw-np-rp-status{flex:1;font-size:var(--pn-fs-micro);opacity:.7;min-height:1em;line-height:1.3}
            ${sel} .aw-np-rp-cancel,${sel} .aw-np-rp-send{border:none;border-radius:var(--pn-r);padding:9px 22px;font-size:var(--pn-fs-small);font-weight:700;font-family:inherit;cursor:pointer;letter-spacing:.02em;transition:background-color var(--pn-t),opacity var(--pn-t),transform var(--pn-t)}
            ${sel} .aw-np-rp-cancel{background:transparent;color:var(--pn-fg);opacity:.65}
            @media (hover:hover){${sel} .aw-np-rp-cancel:hover{opacity:1}}
            ${sel} .aw-np-rp-send{background:var(--pn-accent);color:#fff}
            ${sel} .aw-np-rp-send:active{transform:scale(.97)}
            ${sel} .aw-np-rp-send:disabled{opacity:.35;cursor:default;transform:none}`;
  }
  function mailCss(p) {
    return `
            #aw-np-mail-panel{--mb-fg:var(--np-accent-bg-fg,#fff);--mb-accent:var(--np-accent,#1565C0);--mb-fs-micro:12px;--mb-fs-small:14px;--mb-fs-date:11px;--mb-fs-body:16px;--mb-fs-subj:23px;--mb-badge-sz:18px;--mb-line:var(--np-line-soft);--mb-hover:var(--np-accent-state-1,rgba(255,255,255,.08));--mb-hover-2:var(--np-accent-state-2,rgba(255,255,255,.16));--mb-sel:color-mix(in srgb,var(--np-accent,#1565C0) 26%,var(--np-accent-bg,#223A56));--mb-r:var(--np-r-md);--mb-t:var(--np-t-fast);--mb-w:${p.w};--mb-h:${p.h};--mb-bar-pad:16px 20px;--mb-list-w:${p.listW};--mb-list-min:${p.listMin};--mb-list-max:${p.listMax};--mb-list-pad:5px 6px 6px;--mb-empty-gap:10px;--mb-empty-pad:32px 16px;--mb-empty-ic:30px;--mb-empty-fs:var(--mb-fs-small);--mb-row-gap:8px;--mb-row-pad:12px;--mb-subj-fs:var(--mb-fs-small);--mb-date-fs:var(--mb-fs-micro);--mb-del-sz:24px;--mb-del-ic:13px;--mb-del-op:${p.delOp};--mb-read-empty-gap:10px;--mb-read-empty-pad:20px;--mb-read-empty-ic:38px;--mb-read-pad:28px 32px;position:absolute;inset:0;background:rgba(0,0,0,.62);z-index:30;opacity:0;pointer-events:none;transition:opacity var(--np-t) var(--np-ease);display:flex;align-items:center;justify-content:center;overflow:hidden;container-type:size}
            #aw-np-mail-panel.open{opacity:1;pointer-events:auto}
            .aw-np-mail-inner{width:var(--mb-w);height:var(--mb-h);flex:none;background:var(--np-surf-1);border:var(--np-line);border-radius:var(--np-r-lg);display:flex;flex-direction:column;box-shadow:var(--np-elev-3);overflow:hidden;transform:scale(calc(var(--mb-scale,0.9) * 0.96));transform-origin:center center;opacity:0;transition:transform var(--np-t-slow) var(--np-ease-spring),opacity var(--np-t-slow) var(--np-ease)}
            #aw-np-mail-panel.open .aw-np-mail-inner{transform:scale(var(--mb-scale,0.9));opacity:1}
            .aw-np-mail-iconbtn{display:flex;align-items:center;justify-content:center;background:none;border:none;color:var(--mb-fg);border-radius:var(--np-r-sm);cursor:pointer;flex-shrink:0;opacity:.55;transition:opacity var(--mb-t),background-color var(--mb-t)}
            .aw-np-mail-iconbtn:hover{opacity:1;background:var(--mb-hover)}
            .aw-np-mail-iconbtn svg{fill:currentColor}
            .aw-np-mail-bar{display:flex;align-items:center;justify-content:space-between;padding:var(--mb-bar-pad);border-bottom:var(--mb-line);flex-shrink:0}
            .aw-np-mail-bar-title{display:flex;align-items:center;gap:8px;font-size:25px;font-weight:700;color:var(--mb-fg)}
            .aw-np-mail-bar-title svg{width:1em;height:1em;color:var(--mb-accent)}
            .aw-np-mail-bar-close{width:26px;height:26px}
            .aw-np-mail-bar-close svg{width:13px;height:13px}
            .aw-np-mail-body{flex:1;overflow:hidden;display:flex;min-height:0}
            .aw-np-mail-list-pane{width:var(--mb-list-w);min-width:var(--mb-list-min);max-width:var(--mb-list-max);flex-shrink:0;border-right:var(--mb-line);overflow-y:auto;scrollbar-gutter:stable}
            .aw-np-mail-read-pane{flex:1;min-width:0;display:flex;flex-direction:column;overflow-y:auto;scrollbar-gutter:stable}
            .aw-np-mail-list-pane,.aw-np-mail-read-pane{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--mb-fg) 22%,transparent) transparent}
            .aw-np-mail-list-pane::-webkit-scrollbar,.aw-np-mail-read-pane::-webkit-scrollbar{width:5px}
            .aw-np-mail-list-pane::-webkit-scrollbar-track,.aw-np-mail-read-pane::-webkit-scrollbar-track{background:rgba(255,255,255,.04);border-radius:var(--np-r-md);margin:4px 0}
            .aw-np-mail-list-pane::-webkit-scrollbar-thumb,.aw-np-mail-read-pane::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--mb-fg) 22%,transparent);border-radius:var(--np-r-md)}
            .aw-np-mail-list-pane::-webkit-scrollbar-thumb:hover,.aw-np-mail-read-pane::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb,var(--mb-fg) 38%,transparent)}
            .aw-np-mail-tabs{display:flex;gap:4px;padding:8px 8px 4px}
            .aw-np-mail-tab{flex:1;background:none;border:none;color:var(--mb-fg);opacity:.5;font-size:var(--mb-fs-micro);font-weight:600;font-family:inherit;padding:6px 4px;border-radius:var(--mb-r);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:opacity var(--mb-t),background-color var(--mb-t)}
            .aw-np-mail-tab:hover{opacity:.85}
            .aw-np-mail-tab.active{opacity:1;background:var(--mb-hover)}
            .aw-np-mail-tab-count{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;height:var(--mb-badge-sz);min-width:var(--mb-badge-sz);padding:0 calc(var(--mb-badge-sz) * .28);font-size:var(--mb-fs-date);font-weight:700;line-height:1;background:var(--mb-accent);color:#fff;border-radius:var(--np-r-pill);flex-shrink:0}
            .aw-np-mail-tab-count:empty{display:none}
            .aw-np-mail-list{display:flex;flex-direction:column;padding:var(--mb-list-pad);gap:1px}
            .aw-np-mail-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--mb-empty-gap);opacity:.38;padding:var(--mb-empty-pad);text-align:center}
            .aw-np-mail-empty-ic svg{width:var(--mb-empty-ic);height:var(--mb-empty-ic);fill:currentColor}
            .aw-np-mail-empty div:last-child{font-size:var(--mb-empty-fs)}
            .aw-np-mail-row{display:flex;align-items:flex-start;gap:var(--mb-row-gap);padding:var(--mb-row-pad);border-radius:var(--mb-r);cursor:pointer;position:relative;opacity:0;transform:translateY(18px) scale(.98);transition:background-color var(--mb-t),box-shadow var(--mb-t),opacity var(--np-t-slow) var(--np-ease),transform var(--np-t-slower) var(--np-ease-spring)}
            .aw-np-mail-row.show{opacity:1;transform:translateY(0) scale(1)}
            .aw-np-mail-row.selected{background:var(--mb-sel);box-shadow:inset 2px 0 0 var(--mb-accent)}
            .aw-np-mail-dot{width:6px;height:6px;border-radius:50%;background:var(--mb-accent);flex-shrink:0;margin-top:5px;opacity:0;transition:opacity var(--mb-t)}
            .aw-np-mail-row.unread .aw-np-mail-dot{opacity:1}
            .aw-np-mail-row.selected .aw-np-mail-dot{background:#fff}
            .aw-np-mail-col{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
            .aw-np-mail-subject{font-size:var(--mb-subj-fs);opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:opacity var(--mb-t),color var(--mb-t)}
            .aw-np-mail-row.unread .aw-np-mail-subject{font-weight:700;opacity:1;color:var(--mb-fg)}
            .aw-np-mail-row.selected .aw-np-mail-subject{opacity:1;color:#fff}
            .aw-np-mail-date{font-size:var(--mb-date-fs);opacity:.45}
            .aw-np-mail-row.selected .aw-np-mail-date{opacity:.85;color:#fff}
            .aw-np-mail-del{width:var(--mb-del-sz);height:var(--mb-del-sz);align-self:center;opacity:var(--mb-del-op)}
            .aw-np-mail-del svg{width:var(--mb-del-ic);height:var(--mb-del-ic)}
            .aw-np-mail-read-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--mb-read-empty-gap);opacity:.3;padding:var(--mb-read-empty-pad);text-align:center}
            .aw-np-mail-read-empty .aw-np-mail-empty-ic svg{width:var(--mb-read-empty-ic);height:var(--mb-read-empty-ic)}
            .aw-np-mail-read-content{display:flex;flex-direction:column;flex:1;padding:var(--mb-read-pad)}
            .aw-np-mail-d-head{display:flex;flex-direction:column;gap:5px;margin-bottom:18px;padding-bottom:14px;border-bottom:var(--mb-line)}
            .aw-np-mail-d-date-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
            .aw-np-mail-d-subject{font-size:var(--mb-fs-subj);font-weight:700;line-height:1.35}
            .aw-np-mail-d-date{font-size:var(--mb-fs-date);opacity:.5;text-transform:uppercase;letter-spacing:.05em;font-weight:600;flex-shrink:0;margin-top:2px}
            .aw-np-mail-d-close{width:22px;height:22px}
            .aw-np-mail-d-close svg{width:12px;height:12px}
            .aw-np-mail-d-card{display:flex;flex-direction:column;gap:20px}
            .aw-np-mail-d-body{font-size:var(--mb-fs-body);line-height:1.65;opacity:.9;white-space:pre-wrap}
            .aw-np-mail-d-sign{font-size:var(--mb-fs-small);font-weight:700;color:var(--mb-accent);font-style:italic;opacity:.95}
            .aw-np-mail-d-actions{display:flex;gap:8px;margin-top:auto;padding-top:16px;border-top:var(--mb-line)}
            .aw-np-mail-toggle{display:flex;align-items:center;gap:6px;background:var(--mb-hover);border:none;color:inherit;border-radius:var(--mb-r);padding:8px 14px;font-size:var(--mb-fs-small);font-weight:600;font-family:inherit;cursor:pointer;transition:background-color var(--mb-t),transform var(--mb-t)}
            .aw-np-mail-toggle:active{transform:translateY(1px)}
            .aw-np-mail-toggle svg{width:13px;height:13px;fill:currentColor}
            .aw-np-mail-toggle.is-danger{color:var(--np-danger)}
            @media (hover:hover){
              .aw-np-mail-row:hover{background:var(--mb-hover)}
              .aw-np-mail-row:hover .aw-np-mail-del{opacity:.5}
              .aw-np-mail-row:hover .aw-np-mail-del:hover{opacity:1;background:var(--mb-hover)}
              .aw-np-mail-toggle:hover{background:var(--mb-hover-2);transform:translateY(-1px)}
              .aw-np-mail-toggle:hover:active{transform:translateY(0)}
            }`;
  }
  function panelCss(sel, p) {
    return `
            ${sel}{--pn-fg:var(--np-accent-bg-fg,#fff);--pn-accent:var(--np-accent,#1565C0);--pn-fs-micro:12px;--pn-fs-small:14px;--pn-fs-body:17px;--pn-fs-subj:25px;--pn-line:var(--np-line-soft);--pn-hover:var(--np-accent-state-1,rgba(255,255,255,.08));--pn-hover-2:var(--np-accent-state-2,rgba(255,255,255,.16));--pn-sel:color-mix(in srgb,var(--np-accent,#1565C0) 26%,var(--np-accent-bg,#223A56));--pn-r:var(--np-r-md);--pn-t:var(--np-t-fast);--pn-native-w:${p.nativeW};--pn-bar-pad:12px 20px;--pn-body-pad:16px 20px;--pn-body-gap:16px;--pn-col-gap:20px;--pn-row-gap:12px;--pn-sec-gap:12px;--pn-ctrl-h:29px;--pn-close:33px;--pn-swatch:32px;--pn-slot:21px;position:absolute;inset:0;background:rgba(0,0,0,.62);z-index:25;opacity:0;pointer-events:none;transition:opacity var(--np-t) var(--np-ease);display:flex;align-items:center;justify-content:center;overflow:hidden;container-type:size}
            ${sel}.open{opacity:1;pointer-events:auto}
            ${sel} .aw-np-pn-inner{width:var(--pn-native-w);flex:none;background:var(--np-surf-1);border:var(--np-line);border-radius:var(--np-r-lg);box-shadow:var(--np-elev-3);display:flex;flex-direction:column;overflow:visible;transform:scale(calc(var(--pn-scale,0.7) * 0.96));transform-origin:center center;opacity:0;transition:transform var(--np-t-slow) var(--np-ease-spring),opacity var(--np-t-slow) var(--np-ease)}
            ${sel}.open .aw-np-pn-inner{transform:scale(var(--pn-scale,0.7));opacity:1}
            ${sel} .aw-np-pn-bar{display:flex;align-items:center;justify-content:space-between;padding:var(--pn-bar-pad);border-bottom:var(--pn-line);flex-shrink:0}
            ${sel} .aw-np-pn-title{display:flex;align-items:center;gap:8px;font-size:var(--pn-fs-subj);font-weight:700;color:var(--pn-fg)}
            ${sel} .aw-np-pn-title svg{width:1em;height:1em;color:var(--pn-accent)}
            ${sel} .aw-np-pn-close{display:flex;align-items:center;justify-content:center;width:var(--pn-close);height:var(--pn-close);background:none;border:none;color:var(--pn-fg);border-radius:var(--pn-r);cursor:pointer;flex-shrink:0;opacity:.55;transition:opacity var(--pn-t),background-color var(--pn-t)}
            ${sel} .aw-np-pn-close svg{width:16px;height:16px;fill:currentColor}
            ${sel} .aw-np-pn-body{flex:1;min-height:0;display:flex;flex-direction:column;gap:var(--pn-body-gap);padding:var(--pn-body-pad);font-size:var(--pn-fs-body);color:var(--pn-fg)}
            ${sel} .aw-np-pn-cols{display:grid;grid-template-columns:1fr 1px 1fr;gap:0 var(--pn-col-gap);align-items:stretch}
            ${sel} .aw-np-pn-divider{background:var(--np-hairline-soft);width:1px;align-self:stretch}
            ${sel} .aw-np-pn-col{display:flex;flex-direction:column;gap:var(--pn-row-gap);min-width:0}
            ${sel} .aw-np-pn-col>div{flex:1}
            ${sel} .aw-np-pn-global{padding-bottom:var(--pn-row-gap);border-bottom:var(--pn-line)}
            ${sel} .aw-np-pn-sec{display:flex;flex-direction:column;gap:var(--pn-sec-gap);padding-top:var(--pn-row-gap);border-top:var(--pn-line)}
            ${sel} .aw-np-pn-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--pn-sec-gap) var(--pn-col-gap);transition:opacity var(--pn-t)}
            ${sel} .aw-np-pn-grid.disabled{opacity:.32;pointer-events:none}
            ${sel} .np-row-txt{display:flex;flex-direction:column;gap:3px;min-width:0}
            ${sel} .np-row-label{font-size:var(--pn-fs-body);font-weight:600;line-height:1.2}
            ${sel} .np-row-desc{font-size:var(--pn-fs-micro);opacity:.5;line-height:1.25}
            ${sel} .aw-np-pn-body .np-switch{flex-shrink:0}
            ${sel} .aw-np-pn-title-dot{width:.85em;height:.85em;border-radius:50%;background:var(--pn-accent);box-shadow:0 0 0 .18em color-mix(in srgb,var(--pn-accent) 28%,transparent);flex-shrink:0}
            ${sel} .aw-np-pn-colorsec{display:flex;flex-direction:column;gap:var(--pn-row-gap);padding-bottom:var(--pn-row-gap);border-bottom:var(--pn-line)}
            ${sel} .aw-np-color-custom{display:flex;align-items:center;flex-wrap:nowrap;gap:12px}
            ${sel} .aw-np-color-custom-lbl{font-size:var(--pn-fs-body);font-weight:600;flex-shrink:0}
            ${sel} .aw-np-color-custom-prev{width:var(--pn-slot);height:var(--pn-slot);border-radius:50%;flex-shrink:0;border:1px solid color-mix(in srgb,var(--pn-fg) 30%,transparent);box-sizing:border-box}
            ${sel} .aw-np-color-custom-prev.empty{background:transparent;border-color:color-mix(in srgb,#fff 28%,transparent)}
            ${sel} .aw-np-color-custom-input{flex:0 0 auto;width:136px;height:var(--pn-ctrl-h);box-sizing:border-box;background:var(--pn-hover);border:1px solid color-mix(in srgb,var(--pn-fg) 18%,transparent);color:var(--pn-fg);font-size:var(--pn-fs-small);padding:0 10px;border-radius:var(--pn-r);outline:none;font-family:monospace;user-select:text;transition:border-color var(--pn-t),background-color var(--pn-t)}
            ${sel} .aw-np-color-custom-input::placeholder{color:color-mix(in srgb,var(--pn-fg) 40%,transparent);font-family:inherit;font-size:.92em}
            ${sel} .aw-np-color-custom-input:focus{border-color:var(--pn-accent);background:var(--pn-hover-2)}
            ${sel} .aw-np-color-custom-btns{display:flex;flex-direction:row;gap:6px;flex-shrink:0}
            ${sel} .aw-np-color-custom-btn{display:flex;align-items:center;justify-content:center;width:var(--pn-ctrl-h);height:var(--pn-ctrl-h);box-sizing:border-box;background:var(--pn-hover);border:none;color:var(--pn-fg);border-radius:var(--pn-r);cursor:pointer;font-size:16px;font-weight:700;line-height:1;padding:0;transition:background-color var(--pn-t)}
            ${sel} .aw-np-color-custom-btn svg{width:14px;height:14px;fill:currentColor}
            @media (hover:hover){${sel} .aw-np-color-custom-btn:hover{background:var(--pn-hover-2)}}
            ${sel} .aw-np-color-slots{display:grid;grid-template-columns:repeat(9,1fr);flex:1;min-width:0;gap:5px;align-items:center;justify-items:center;margin-left:12px}
            ${sel} .np-swatch-slot{position:relative}
            ${sel} .np-swatch-empty{width:min(100%,var(--pn-slot));aspect-ratio:1;border-radius:50%;border:1px solid color-mix(in srgb,#fff 28%,transparent);box-sizing:border-box}
            ${sel} .aw-np-pn-body .aw-np-arow{opacity:0;transform:translateY(18px) scale(.98);transition:opacity var(--np-t-slow) var(--np-ease),transform var(--np-t-slower) var(--np-ease-spring),background-color var(--pn-t)}
            ${sel}.open .aw-np-pn-body .aw-np-arow{opacity:1;transform:translateY(0) scale(1)}
            ${sel} .aw-np-pn-col>div,${sel} .aw-np-pn-global>div,${sel} .aw-np-pn-grid>div,${sel} .aw-np-pn-sec>div:not(.aw-np-pn-grid){border-radius:var(--pn-r);padding:5px 8px;margin:-5px -8px}
            @media (hover:hover){${sel} .aw-np-pn-close:hover{opacity:1;background:var(--pn-hover)}
              ${sel} .aw-np-pn-col>div:hover,${sel} .aw-np-pn-global>div:hover,${sel} .aw-np-pn-grid>div:hover,${sel} .aw-np-pn-sec>div:not(.aw-np-pn-grid):hover{background:var(--pn-hover)}}`;
  }
  function bpCss(sel) {
    return `
            ${sel} .aw-np-pn-body{gap:var(--pn-sec-gap)}
            ${sel} .aw-np-bp-link{display:flex;align-items:center;gap:14px;padding:11px 13px;border-radius:var(--pn-r);text-decoration:none;color:var(--pn-fg);background:var(--pn-hover);border:none;font-family:inherit;text-align:left;width:100%;box-sizing:border-box;min-height:calc(var(--pn-fs-body) * 1.2 + var(--pn-fs-micro) * 1.25 + 24px);cursor:pointer;transition:background-color var(--pn-t),transform var(--pn-t)}
            @media (hover:hover){${sel} .aw-np-bp-link:not(.aw-np-bp-soon):hover{background:var(--pn-hover-2)}}
            ${sel} .aw-np-bp-link:not(.aw-np-bp-soon):active{transform:scale(.99)}
            ${sel} .aw-np-bp-soon{cursor:default}
            ${sel} .aw-np-bp-ic{display:flex;align-items:center;justify-content:center;flex-shrink:0}
            ${sel} .aw-np-bp-ic svg{width:1.5em;height:1.5em;color:var(--pn-accent);transform:scale(.917)}
            ${sel} .aw-np-bp-ic-world svg{transform:scale(1.1)}
            ${sel} .aw-np-bp-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
            ${sel} .aw-np-bp-label{font-size:var(--pn-fs-body);font-weight:600;line-height:1.2}
            ${sel} .aw-np-bp-desc{font-size:var(--pn-fs-micro);opacity:.5;line-height:1.25}
            ${sel} .aw-np-bp-arrow{flex-shrink:0;font-size:1.15em;opacity:.4;line-height:1}
            ${sel} .aw-np-bp-soon-lbl{flex-shrink:0;font-size:var(--pn-fs-micro);font-weight:600;opacity:.5;letter-spacing:.02em}`;
  }

  // src/styles/anim.js
  var KEYFRAMES_CSS = `
            @keyframes np-ripple{0%{transform:scale(0);opacity:1}60%{opacity:.6}100%{transform:scale(2.8);opacity:0}}
            @keyframes np-spin{to{transform:rotate(360deg)}}
            @keyframes aw-np-fade{from{opacity:0}to{opacity:1}}
            @keyframes aw-np-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`;
  var TOAST_SHOW_MS = 4e3;
  var TOAST_FADE_MS = 500;
  var CONN_TOAST_MS = 3e3;
  var STAGGER_BASE = 0.05;
  var STAGGER_STEP = 0.09;
  var MAIL_STAGGER_STEP = 0.07;
  var MAIL_REVEAL_STEP = 0.06;
  var MAIL_REVEAL_CAP = 0.5;

  // src/styles/css-base.js
  function rootVars({ seekH, topH, touch }) {
    return `            #aw-np{--ui-scale:1;--np-top-mul:1.2;--np-ctrl-mul:1;--np-bar-h:calc(48px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));--np-btn-size:calc(44px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));--np-svg-size:calc(26px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));--np-seek-h:calc(${seekH} * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));--np-top-h:calc(${topH} * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-top-mul));--np-fs-title:calc(17px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-top-mul));--np-fs-body:calc(16px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));--np-fs-small:calc(14px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));--np-fs-micro:calc(12px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));--np-spinner-size:calc(48px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));--np-ease:cubic-bezier(.4,0,.2,1);--np-ease-spring:cubic-bezier(.34,1.5,.64,1);--np-t-fast:.15s;--np-t:.2s;--np-t-slow:.3s;--np-t-slower:.42s;--np-r-xs:4px;--np-r-sm:6px;--np-r-md:8px;--np-r-lg:12px;--np-r-pill:24px;--np-elev-1:0 1px 2px rgba(0,0,0,.28),0 2px 6px rgba(0,0,0,.26);--np-elev-2:0 2px 6px rgba(0,0,0,.30),0 8px 18px rgba(0,0,0,.34);--np-elev-3:0 6px 16px rgba(0,0,0,.34),0 18px 40px rgba(0,0,0,.42);--np-surf-1:color-mix(in srgb,var(--np-accent,#8ab4f8) 8%,#16171a);--np-surf-2:color-mix(in srgb,var(--np-accent,#8ab4f8) 13%,#202227);--np-surf-3:color-mix(in srgb,var(--np-accent,#8ab4f8) 20%,#292b31);--np-hairline:color-mix(in srgb,var(--np-accent,#8ab4f8) 22%,transparent);--np-hairline-soft:color-mix(in srgb,var(--np-accent,#8ab4f8) 12%,transparent);--np-line:1px solid var(--np-hairline);--np-line-soft:1px solid var(--np-hairline-soft);--np-tip-bg:color-mix(in srgb,var(--np-accent,#8ab4f8) 10%,#1b1c1f);--np-ok:#5fd38a;--np-ok-bg:#1c9a41;--np-warn:#e0c84a;--np-warn-bg:#b8791a;--np-danger:#f06464;--np-danger-bg:#b41e1e;container-type:size;position:relative;isolation:isolate;width:100%;height:100%;background:#000;display:flex;flex-direction:column;overflow:hidden;font-family:'Google Sans',Roboto,'Helvetica Neue',sans-serif;user-select:none;touch-action:${touch}}`;
  }
  var HEADER = `            #player{background:#000}#aw-np,#aw-np *,#aw-np *::before,#aw-np *::after{box-sizing:border-box}#aw-np :focus{outline:none!important}#aw-np button{-webkit-tap-highlight-color:transparent}
            #aw-np,#aw-np *{-webkit-touch-callout:none!important;-webkit-user-drag:none;user-select:none!important;-webkit-user-select:none!important}`;
  var FS = `            #aw-np.fs{--np-top-mul:.9;--np-ctrl-mul:.8}`;
  var UI_LAYER = `            #aw-np.ui .np-grad{opacity:1}
            #aw-np-gradient{bottom:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            #aw-np-gradient-top{top:0;background:linear-gradient(to bottom,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            .np-ui-layer{opacity:0;transition:opacity var(--np-t-slow) var(--np-ease),transform var(--np-t-slow) var(--np-ease);pointer-events:none}
            #aw-np-top.np-ui-layer{transform:translateY(-12px)}
            #aw-np-controls.np-ui-layer{transform:translateY(8px)}
            #aw-np.ui #aw-np-top.np-ui-layer,#aw-np.ui #aw-np-controls.np-ui-layer{transform:translateY(0)}
            #aw-np.ui .np-ui-layer{opacity:1;pointer-events:all}`;
  var DOT = `            #aw-np-dot-btn{width:calc(var(--np-fs-title) * 0.95);height:calc(var(--np-fs-title) * 0.95);border-radius:var(--np-r-sm);background:var(--np-surf-2);border:var(--np-line);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:transform var(--np-t) var(--np-ease),background-color var(--np-t),border-color var(--np-t);position:relative}
            #aw-np-dot{width:calc(var(--np-fs-title) * 0.5);height:calc(var(--np-fs-title) * 0.5);border-radius:50%;background:var(--np-accent,#fff);flex-shrink:0;position:relative}`;
  var ACTION_SVG = `            #aw-np-browser-btn svg,#aw-np-report-btn svg,#aw-np-mail-btn svg{width:calc(var(--np-fs-title) * 0.62);height:calc(var(--np-fs-title) * 0.62);fill:currentColor}`;
  var SWATCH_GRID = `            #aw-np-color-panel #aw-np-color-swatches{display:grid;grid-template-columns:repeat(16,1fr);gap:7px;align-items:center;justify-items:center}
            #aw-np-color-panel .np-swatch{width:min(100%,var(--pn-swatch));aspect-ratio:1;height:auto;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform var(--np-t) var(--np-ease),border-color var(--np-t-fast),box-shadow var(--np-t)}
            #aw-np-color-panel .np-swatch-slot{width:min(100%,var(--pn-slot));aspect-ratio:1;height:auto}`;
  var SWATCH_HOVER = `            .np-swatch:hover{transform:scale(1.12);box-shadow:var(--np-elev-1)}`;
  var SWATCH_ACTIVE = `            .np-swatch.active{border-color:var(--np-accent,#fff);box-shadow:0 0 0 3px color-mix(in srgb,var(--np-accent,#fff) 35%,transparent),0 2px 6px rgba(0,0,0,.4);transform:scale(1.08)}`;
  var CONTROLS_SEEK = `            #aw-np-controls{position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;padding:0 max(6px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left))}
            #aw-np-seek-wrap{height:var(--np-seek-h);display:flex;align-items:center;cursor:pointer;padding:0 4px;touch-action:none;margin-bottom:calc(-8px * var(--np-chrome-scale,1) * var(--ui-scale))}`;
  var SEEK_BUF = `            #aw-np-seek-buf{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent-dim,rgba(255,255,255,.5));width:0;opacity:.6}`;
  var BAR = `            #aw-np-bar{display:flex;align-items:center;height:var(--np-bar-h);gap:0}`;
  var ICON = `            .np-icon{display:contents}`;
  var SPACER = `            #aw-np-spacer{flex:1}`;
  var ACCENT_BTN = `            .np-btn:active{background:var(--np-accent-state-2,rgba(255,255,255,.18))}
            .np-btn svg{display:block;fill:currentColor;flex-shrink:0;width:var(--np-svg-size);height:var(--np-svg-size);transition:transform var(--np-t) var(--np-ease)}
            .np-btn:active svg{transition-duration:.1s;transform:scale(.88)}
            .np-btn svg line{stroke:currentColor}
            .accent-icons .np-btn{color:var(--np-accent,#fff)}
            .accent-icons .np-btn svg{fill:var(--np-accent,#fff)}
            .accent-icons .np-btn svg line{stroke:var(--np-accent,#fff)}
            .accent-top #aw-np-title{color:var(--np-accent,#fff)}
            .accent-top #aw-np-epinfo{color:var(--np-accent,#fff);opacity:.75}`;
  var ACCENT_BRAND_RIPPLE = `            .accent-top #aw-np-brand{color:var(--np-accent,#fff);opacity:.5}
            .np-ripple{position:absolute;border-radius:50%;background:var(--np-accent-state-2,rgba(255,255,255,.35));transform:scale(0);opacity:1;animation:np-ripple .55s var(--np-ease);pointer-events:none}
            .np-ripple-layer{position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none;z-index:0}`;
  var SWITCH = `            .np-switch{position:relative;width:31px;height:18px;flex-shrink:0;cursor:pointer}
            .np-switch input{opacity:0;width:0;height:0;position:absolute}
            .np-switch-track{position:absolute;inset:0;border-radius:10px;background:rgba(255,255,255,.2);transition:background var(--np-t) var(--np-ease)}
            .np-switch input:checked~.np-switch-track{background:var(--np-accent,#fff)}
            .np-switch-thumb{position:absolute;top:3px;left:3px;width:12px;height:12px;background:#fff;border-radius:50%;transition:transform var(--np-t) var(--np-ease);box-shadow:var(--np-elev-1)}
            .np-switch input:checked~.np-switch-thumb{transform:translateX(14px)}
            .np-switch input:not(:checked)~.np-switch-thumb{background:rgba(255,255,255,.8)}`;
  var ROWTIP_AFTER_DATATIP = `            .np-row-tip::after{content:'';position:absolute;top:50%;left:100%;transform:translateY(-50%);border:5px solid transparent;border-left-color:var(--np-tip-bg,#000)}
            [data-tip]{margin:0 -8px;padding:6px 8px;border-radius:var(--np-r-md);transition:background var(--np-t-fast) var(--np-ease)}[data-tip]:hover{background:var(--np-accent-state-1,rgba(255,255,255,.06))}[data-tip]:hover .np-row-tip{opacity:1;transition-delay:.5s}`;
  var SPEED_POPUP = `            #aw-np-speed-popup{position:absolute;top:max(10px,env(safe-area-inset-top));left:max(10px,env(safe-area-inset-left));background:transparent;color:rgba(255,255,255,.6);font-size:var(--np-fs-title);font-weight:500;padding:2px 4px;border-radius:var(--np-r-xs);pointer-events:none;opacity:0;transition:opacity var(--np-t-slow) var(--np-ease);z-index:20;letter-spacing:.02em;text-shadow:0 1px 6px rgba(0,0,0,.95)}
            #aw-np-speed-popup.on{opacity:1}
            #aw-np.ui #aw-np-speed-popup{opacity:0!important}`;
  var CLOCK_CONN = `            #aw-np-clock svg{width:1em;height:1em;flex-shrink:0;display:block;filter:drop-shadow(0 0 1px rgba(0,0,0,.95)) drop-shadow(0 1px 3px rgba(0,0,0,.7))}
            #aw-np-clock .hand-h{stroke:var(--np-accent,#fff)}#aw-np-clock .pin{fill:var(--np-accent,#fff);stroke:none}#aw-np-clock .hand-m{stroke:currentColor}
            #aw-np.ui #aw-np-clock{opacity:0!important;visibility:hidden}
            #aw-np.clock-hidden #aw-np-clock{display:none!important}
            #aw-np.speed-popup-hidden #aw-np-speed-popup{display:none!important}
            #aw-np-conn-toast{position:absolute;top:clamp(12px,1.7cqh,18px);left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:var(--np-r-lg);font-size:calc(var(--np-fs-body) * .82);font-weight:500;color:rgba(255,255,255,.95);z-index:22;box-shadow:var(--np-elev-2);pointer-events:all;white-space:nowrap;opacity:0;transition:opacity var(--np-t-slow) var(--np-ease);border:var(--np-line-soft)}
            #aw-np-conn-toast.slow{background:var(--np-warn-bg)}
            #aw-np-conn-toast.good{background:var(--np-ok-bg)}
            #aw-np-conn-toast .conn-msg{display:flex;flex-direction:column;gap:2px;line-height:1.3;text-align:center;letter-spacing:.025em;flex:1}`;
  var ERROR_SPINNER = `            #aw-np-error-toast,#aw-np-load-error-toast{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px);left:50%;transform:translateX(-50%);background:var(--np-danger-bg);color:#fff;font-size:var(--np-fs-body);font-weight:500;letter-spacing:.02em;padding:7px 18px;border-radius:var(--np-r-pill);border:var(--np-line-soft);pointer-events:all;white-space:nowrap;z-index:21;box-shadow:var(--np-elev-2);cursor:pointer}
            #aw-np-spinner{position:absolute;inset:0;margin:auto;width:var(--np-spinner-size);height:var(--np-spinner-size);border:3px solid rgba(255,255,255,.12);border-top-color:var(--np-accent,#fff);border-radius:50%;animation:np-spin .65s linear infinite;pointer-events:none;display:none}
            #aw-np-spinner.on{display:block}`;
  var FLASH_TAIL = `            .np-flash-circle{position:absolute;top:50%;left:50%;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;z-index:12;color:var(--np-accent-bg-fg,rgba(255,255,255,.9))}
            .np-flash-circle::before{content:'';position:absolute;inset:0;border-radius:50%;background:var(--np-accent-bg,#1a1a2e);opacity:.8;pointer-events:none}
            .np-flash-circle.on{opacity:1}
            .np-flash-circle svg{fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));opacity:1;width:34px;height:34px;position:relative;z-index:1}
            #aw-np-center{margin:-36px 0 0 -36px;transform:scale(.7);transition:opacity var(--np-t) var(--np-ease),transform var(--np-t) var(--np-ease-spring)}
            #aw-np-center.on{transform:scale(1)}
            #aw-np-vol-flash{transform:translate(-50%,-50%);transition:opacity var(--np-t) var(--np-ease)}
            #aw-np-vol-flash svg{display:block}`;
  var SKIP_POPUP = `
            #aw-np-skip-popup{position:absolute;right:max(clamp(16px,3vw,34px),env(safe-area-inset-right));bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 22px);display:flex;align-items:center;gap:9px;background:var(--np-surf-2);color:var(--np-accent-bg-fg,#fff);border:var(--np-line);border-radius:var(--np-r-md);padding:11px 20px;font-size:var(--np-fs-body);font-weight:600;font-family:inherit;letter-spacing:.02em;cursor:pointer;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity var(--np-t) var(--np-ease),transform var(--np-t) var(--np-ease),background-color var(--np-t),border-color var(--np-t);z-index:22;box-shadow:var(--np-elev-2)}
            #aw-np-skip-popup.show{opacity:1;transform:translateY(0);pointer-events:auto}
            #aw-np-skip-popup:hover{background:var(--np-surf-3);border-color:var(--np-accent,#fff)}
            #aw-np-skip-popup:active{transform:scale(.97)}
            #aw-np-skip-popup .aw-np-skip-popup-ic{display:flex;align-items:center;color:var(--np-accent,#fff)}
            #aw-np-skip-popup .aw-np-skip-popup-ic:empty{display:none}
            #aw-np-skip-popup .aw-np-skip-popup-ic svg{width:1.15em;height:1.15em;fill:currentColor}`;
  var AWAKE_GUARD = `            #aw-np-awake-toast{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 18px;border-radius:var(--np-r-lg);background:var(--np-surf-2);border:var(--np-line-soft);color:var(--np-accent-bg-fg,#fff);text-align:center;z-index:22;box-shadow:var(--np-elev-2);pointer-events:none;opacity:0;transition:opacity var(--np-t-slow) var(--np-ease)}
            #aw-np-awake-toast.show{opacity:.58}
            #aw-np-awake-toast .awake-q{font-size:calc(var(--np-fs-body) * .95);font-weight:600;letter-spacing:.02em}
            #aw-np-awake-toast .awake-hint{font-size:calc(var(--np-fs-body) * .74);font-weight:500;opacity:.72;letter-spacing:.02em}
            #aw-np-awake-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62);z-index:32;padding:16px}
            #aw-np-awake-card{position:relative;display:flex;flex-direction:column;gap:3px;max-width:min(88%,332px);padding:15px 20px 14px;border-radius:var(--np-r-lg);background:var(--np-surf-1);border:var(--np-line);box-shadow:var(--np-elev-3);color:var(--np-accent-bg-fg,#fff);text-align:center}
            #aw-np-awake-card .awake-card-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}
            #aw-np-awake-card .awake-card-ic{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:calc(var(--np-fs-body) * 1.15);height:calc(var(--np-fs-body) * 1.15);color:var(--np-accent,#fff)}
            #aw-np-awake-card .awake-card-ic svg{width:100%;height:100%;display:block;transform:translate(3.8%,-6.5%)}
            #aw-np-awake-card .awake-card-title{flex:1;text-align:left;font-size:calc(var(--np-fs-body) * 1.02);font-weight:700;letter-spacing:.01em;white-space:nowrap}
            #aw-np-awake-card .awake-card-body{font-size:calc(var(--np-fs-body) * .78);font-weight:500;opacity:.66;line-height:1.4}
            #aw-np-awake-card .awake-card-mark{display:flex;align-items:baseline;justify-content:center;gap:5px;flex-wrap:wrap;font-size:calc(var(--np-fs-body) * .82);font-weight:500;opacity:.92;margin-top:11px}
            #aw-np-awake-card .awake-card-go{font-family:inherit;font-size:inherit;font-weight:700;letter-spacing:.02em;padding:2px 6px;margin:-2px -2px;border:none;border-radius:var(--np-r-sm);background:none;color:var(--np-accent,#fff);cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;transition:background var(--np-t-fast),opacity var(--np-t-fast)}
            #aw-np-awake-card .awake-card-go:hover{background:var(--np-accent-state-1,rgba(255,255,255,.06))}
            #aw-np-awake-card .awake-card-go:disabled{color:inherit;text-decoration:none;cursor:default;opacity:.6}
            #aw-np-awake-card .awake-card-x{position:relative;flex-shrink:0;margin-right:-4px;display:flex;align-items:center;justify-content:center;width:calc(var(--np-fs-body) * 1.35);height:calc(var(--np-fs-body) * 1.35);padding:0;border:none;border-radius:var(--np-r-sm);background:none;color:var(--np-accent-bg-fg,#fff);opacity:.55;cursor:pointer;transition:opacity var(--np-t-fast),background var(--np-t-fast)}
            #aw-np-awake-card .awake-card-x:hover{opacity:1;background:var(--np-accent-state-1,rgba(255,255,255,.06))}
            #aw-np-awake-card .awake-card-x svg{width:72%;height:72%;display:block}`;
  var PANEL_SUBROW = `            .aw-np-pn-icontog{position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:calc(var(--pn-fs-body) * 1.12);height:calc(var(--pn-fs-body) * 1.12);padding:0;margin:0 -3px 0 auto;background:none;border:none;border-radius:var(--np-r-sm);color:var(--np-accent-bg-fg,#fff);opacity:.35;cursor:pointer;transition:opacity var(--np-t) var(--np-ease),color var(--np-t)}
            .aw-np-pn-icontog svg{width:100%;height:100%;display:block;transform:translate(3.8%,-6.5%)}
            .aw-np-pn-icontog:hover{opacity:.6}
            .aw-np-pn-icontog.on{opacity:1;color:var(--np-accent,#fff)}
            .aw-np-pn-icontog.dep-off{opacity:.2;cursor:default}
            .aw-np-pn-icontog .np-row-tip{right:0;left:auto;top:auto;bottom:calc(100% + 8px);transform:none}
            .aw-np-pn-icontog:hover .np-row-tip{opacity:1;transition-delay:.5s}
            .aw-np-pn-icontog .np-row-tip::after{top:100%;left:auto;right:10px;transform:none;border-top-color:var(--np-tip-bg,#000);border-left-color:transparent}`;

  // src/styles/styles-desktop.js
  var MAIL_CSS_DESKTOP = { w: "720px", h: "480px", listW: "36%", listMin: "180px", listMax: "340px", delOp: "0" };
  var PANEL_CSS_DESKTOP = { nativeW: "650px" };
  function injectStyleDesktop() {
    if (document.getElementById("aw-np-style")) return;
    const s = document.createElement("style");
    s.id = "aw-np-style";
    s.textContent = `
${HEADER}
${rootVars({ seekH: "44px", topH: "64px", touch: "pan-x pan-y" })}
${FS}
            #aw-np-video{flex:1;width:100%;min-height:0;display:block;background:#000;cursor:none}
            #aw-np.ui #aw-np-video{cursor:pointer}
            #aw-np-bar,#aw-np-top,.aw-np-toast,#aw-np-error-toast,#aw-np-conn-toast,#aw-np-settings-panel,#aw-np-color-panel,#aw-np-menu-panel,.np-tip,.np-row-tip,.np-btn,.np-swatch,.np-switch-track,.np-switch-thumb,#aw-np-seek-fill,#aw-np-seek-buf,#aw-np-seek-thumb,#aw-np-seek-tip,#aw-np-title,#aw-np-epinfo,#aw-np-brand,#aw-np-clock,#aw-np-clock svg circle,#aw-np-clock .hand-h,#aw-np-clock .hand-m,#aw-np-clock .pin,#aw-np-spinner,#aw-np-vol-popup,#aw-np-time,#aw-np-speed-ind,#aw-np-speed-popup,#aw-np-buf-pct,#aw-np-dot{transition-property:color,background,background-color,fill,stroke,border-color,box-shadow;transition-duration:.4s;transition-timing-function:var(--np-ease)}
            .np-grad{position:absolute;left:0;right:0;height:160px;pointer-events:none;opacity:0;transition:opacity var(--np-t-slow) var(--np-ease)}
${UI_LAYER}
            #aw-np-top{position:absolute;top:0;left:0;right:0;height:var(--np-top-h);display:flex;align-items:flex-start;justify-content:space-between;padding:calc(13px * var(--np-chrome-scale,1) * var(--ui-scale)) calc(10px * var(--np-chrome-scale,1) * var(--ui-scale))}
            #aw-np-top-left{display:flex;flex-direction:column;gap:2px;overflow:hidden}
            #aw-np-title{font-size:calc(var(--np-fs-title) * 1.2);font-weight:500;letter-spacing:.01em;color:var(--np-accent-bg-fg,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:38cqw;text-shadow:0 1px 3px rgba(0,0,0,.8),0 0 12px rgba(0,0,0,.6)}
            #aw-np-epinfo{font-size:calc(var(--np-fs-title) * 0.8);font-weight:400;letter-spacing:.02em;color:var(--np-accent-bg-fg,rgba(255,255,255,.7));opacity:.8;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-top-right{display:flex;flex-direction:column;align-items:flex-end;gap:clamp(6px,1cqh,10px);flex-shrink:0}
            #aw-np-top-actions{display:flex;align-items:center;justify-content:space-between;align-self:stretch}
            #aw-np-brand{font-size:calc(var(--np-fs-title) * 0.8);font-weight:500;letter-spacing:.04em;color:var(--np-accent-bg-fg,rgba(255,255,255,.5));opacity:.6;white-space:nowrap;line-height:1;text-shadow:0 1px 3px rgba(0,0,0,.8);text-transform:uppercase}
${DOT}
            #aw-np-kbd-btn{width:calc(var(--np-fs-title) * 0.95);height:calc(var(--np-fs-title) * 0.95);border-radius:var(--np-r-sm);background:var(--np-surf-2);border:var(--np-line);color:var(--np-accent-bg-fg,#CCDDF1);font-size:calc(var(--np-fs-title) * 0.58);font-weight:400;font-family:Arial,'Segoe UI','Roboto',sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;line-height:1;transition:transform var(--np-t) var(--np-ease),background-color var(--np-t),border-color var(--np-t);user-select:none;position:relative}
            #aw-np-kbd-btn:hover{transform:scale(1.15)}
            #aw-np-kbd-btn:active{transform:scale(1.05)}
            #aw-np-browser-btn,#aw-np-report-btn,#aw-np-mail-btn{width:calc(var(--np-fs-title) * 0.95);height:calc(var(--np-fs-title) * 0.95);border-radius:var(--np-r-sm);background:var(--np-surf-2);border:var(--np-line);color:var(--np-accent-bg-fg,#CCDDF1);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:transform var(--np-t) var(--np-ease),background-color var(--np-t),border-color var(--np-t);user-select:none;position:relative}
${ACTION_SVG}
            #aw-np-browser-btn:hover,#aw-np-report-btn:hover,#aw-np-mail-btn:hover{transform:scale(1.15)}
            #aw-np-browser-btn:active,#aw-np-report-btn:active,#aw-np-mail-btn:active{transform:scale(1.05)}
            .aw-np-mail-badge{display:none;position:absolute;top:-2px;right:-2px;width:6px;height:6px;border-radius:50%;background:var(--np-accent,#ec4f4f)}
            #aw-np-browser-btn .np-tip,#aw-np-report-btn .np-tip,#aw-np-mail-btn .np-tip,#aw-np-kbd-btn .np-tip{bottom:auto;top:calc(100% + 10px);left:auto;right:0;transform:none}
            #aw-np-browser-btn .np-tip::after,#aw-np-report-btn .np-tip::after,#aw-np-mail-btn .np-tip::after,#aw-np-kbd-btn .np-tip::after{top:auto;bottom:100%;left:auto;right:6px;transform:none;border-top-color:transparent;border-bottom-color:var(--np-tip-bg,#1b1c1f)}
            #aw-np-browser-btn:hover .np-tip,#aw-np-report-btn:hover .np-tip,#aw-np-mail-btn:hover .np-tip,#aw-np-kbd-btn:hover .np-tip{opacity:1;transition-delay:.3s}
            #aw-np-hotkey-overlay{position:absolute;inset:0;background:rgba(0,0,0,.62);z-index:30;opacity:0;pointer-events:none;transition:opacity var(--np-t) var(--np-ease);font-family:Arial,'Segoe UI','Roboto',sans-serif;container-type:size;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));box-sizing:border-box}
            #aw-np-hotkey-overlay.open{opacity:1;pointer-events:auto}
            /* Pannello Hotkey nel linguaggio dei pannelli: la tastiera vive dentro una CARD */
            /* (--np-surf-1 + hairline + raggio + elevazione) con barra-titolo, come gli altri pannelli. */
            #aw-np-hotkey-inner{position:relative;display:flex;flex-direction:column;align-items:center;gap:clamp(12px,2.4cqh,24px);padding:clamp(14px,2.4cqh,22px) clamp(16px,2.6cqw,26px) clamp(12px,2cqh,18px);box-sizing:border-box;overflow:visible;max-width:100%;max-height:100%;background:var(--np-surf-1);border:var(--np-line);border-radius:var(--np-r-lg);box-shadow:var(--np-elev-3);--ku:min(clamp(30px,6.6cqh,82px),5.9cqw);--kg:clamp(5px,1.3cqh,16px)}
            /* Titolo = elemento a sé con la SUA icona: keycap "A" in OUTLINE (stroke, non fill), come il set Lucide. */
            .aw-np-hotkey-bartitle{display:flex;align-items:center;gap:clamp(7px,1.2cqw,11px);flex:1;min-width:0;font-size:clamp(17px,2.7cqw,34px);font-weight:700;color:var(--np-accent-bg-fg,#fff);letter-spacing:.01em;line-height:1}
            .aw-np-hotkey-bartitle>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .aw-np-hotkey-key-a{flex-shrink:0;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:1.28em;height:1.28em;font-size:.78em;border:1.7px solid var(--np-accent,#1565C0);border-radius:var(--np-r-sm);color:var(--np-accent,#1565C0);font-weight:700;font-family:Arial,'Segoe UI','Roboto',sans-serif;line-height:1;padding-top:.06em}
            .aw-np-kbd{display:flex;flex-direction:column;gap:var(--kg)}
            .aw-np-krow{display:flex;gap:var(--kg);opacity:0;transform:translateY(18px) scale(.98);transition:opacity var(--np-t-slow) var(--np-ease),transform var(--np-t-slower) var(--np-ease-spring)}
            #aw-np-hotkey-overlay.open .aw-np-krow{opacity:1;transform:translateY(0) scale(1)}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(1){transition-delay:.05s}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(2){transition-delay:.14s}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(3){transition-delay:.23s}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(4){transition-delay:.32s}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(5){transition-delay:.41s}
            .aw-np-krow-bottom{margin-left:0 !important}
            .aw-np-key-enter-flat{width:calc(var(--ku) * 1.5 + var(--kg)) !important}
            .aw-np-key{width:var(--ku);height:var(--ku);border-radius:var(--np-r-sm);background:var(--np-surf-2);border:var(--np-line);display:flex;align-items:center;justify-content:center;color:var(--np-accent-bg-fg,#CCDDF1);font-size:calc(var(--ku) * .48);font-weight:500;flex-shrink:0;position:relative;line-height:1;box-sizing:border-box;transition:background-color var(--np-t-fast),border-color var(--np-t-fast),color var(--np-t-fast)}
            .aw-np-key-fill-wide{width:calc(var(--ku) * var(--wmult, 1.5) + var(--kg) * var(--padmult, 0)) !important}
            .aw-np-key-fill-wide{justify-content:flex-start}
            .aw-np-key-fill-wide>.aw-np-glyph{display:inline-flex;align-items:center;justify-content:center;width:var(--ku);height:var(--ku)}
            .aw-np-key-half{width:calc(var(--ku) * .5) !important}
            .aw-np-key.off{opacity:.5}
            .aw-np-key.on{cursor:pointer}
            .aw-np-key.on.hovered{background:var(--np-accent-state-1,color-mix(in srgb,var(--np-accent,#1565C0) 22%,var(--np-accent-bg,#223A56)));color:#fff}
            .aw-np-key-ico,.aw-np-key-letter{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity var(--np-t-fast)}
            .aw-np-key-ico svg{width:56%;height:56%;color:var(--np-accent-bg-fg,#CCDDF1)}
            .aw-np-key.hovered .aw-np-key-ico svg{color:#fff}
            .aw-np-key-pct{font-size:calc(var(--ku) * .26);font-weight:600}
            .aw-np-key-a-badge{display:flex;align-items:center;justify-content:center;width:calc(var(--ku) * .55);height:calc(var(--ku) * .55);border-radius:var(--np-r-xs);background:var(--np-accent-bg-fg,#CCDDF1);color:var(--np-accent-bg,#223A56);font-size:calc(var(--ku) * .32);font-weight:500;font-family:Arial,'Segoe UI','Roboto',sans-serif;line-height:1}
            .aw-np-key-letter{opacity:0;font-size:calc(var(--ku) * .48);font-weight:500}
            .aw-np-key-letter-slot.off .aw-np-key-letter{opacity:1}
            .aw-np-key.hovered .aw-np-key-ico{opacity:0}
            .aw-np-key.hovered .aw-np-key-letter{opacity:1}
            .aw-np-key-mod{font-size:calc(var(--ku) * .19);font-weight:600;opacity:.5;letter-spacing:.04em}
            .aw-np-key-space{width:calc(var(--ku) * 5 + var(--kg) * 4)}
            /* ── Header (icona-titolo-X) + footer con toolbar edit ── */
            .aw-np-kbd-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;max-width:calc(var(--ku) * 12 + var(--kg) * 11);box-sizing:border-box;position:relative;border-bottom:var(--np-line);padding-bottom:clamp(8px,1.6cqh,14px)}
            .aw-np-hotkey-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;max-width:calc(var(--ku) * 12 + var(--kg) * 11);box-sizing:border-box}
            .aw-np-hotkey-tools{display:flex;gap:clamp(6px,1cqw,10px);flex-shrink:0}
            .aw-np-kbd-bar-btn{display:flex;align-items:center;justify-content:center;width:clamp(28px,4.4cqh,40px);height:clamp(28px,4.4cqh,40px);border-radius:var(--np-r-sm);cursor:pointer;user-select:none;background:transparent;color:var(--np-accent,#1565C0);transition:color var(--np-t-fast),transform var(--np-t-fast) var(--np-ease),opacity var(--np-t),background-color var(--np-t-fast);position:relative}
            .aw-np-kbd-bar-btn .np-tip{bottom:auto;top:calc(100% + 8px)}
            .aw-np-kbd-bar-btn .np-tip::after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:var(--np-tip-bg,#1b1c1f)}
            /* i tip dei bottoni nel footer (in basso) vanno SOPRA */
            .aw-np-hotkey-tools .np-tip{top:auto;bottom:calc(100% + 8px)}
            .aw-np-hotkey-tools .np-tip::after{bottom:auto;top:100%;border-bottom-color:transparent;border-top-color:var(--np-tip-bg,#1b1c1f)}
            .aw-np-kbd-bar-btn:hover .np-tip{opacity:1;transition-delay:.4s}
            .aw-np-kbd-bar-btn svg{width:64%;height:64%;display:block}
            /* sizing OTTICO per-icona (i glifi Lucide hanno peso/ingombro diverso a parità di box) */
            .aw-np-kbd-bar-btn.is-ok svg{width:74%;height:74%}
            .aw-np-kbd-bar-btn.is-reset svg{width:66%;height:66%}
            .aw-np-kbd-bar-btn.is-x svg,.aw-np-kbd-bar-btn.is-cancel svg{width:60%;height:60%}
            .aw-np-kbd-bar-btn:hover{transform:translateY(-1px);opacity:.78}
            .aw-np-kbd-bar-btn:active{transform:translateY(0) scale(.92)}
            /* header X = muta come .aw-np-pn-close (non accent): icona - titolo - X uniforme */
            .aw-np-kbd-bar>.is-x{color:var(--np-accent-bg-fg,#fff);opacity:.55}
            .aw-np-kbd-bar>.is-x:hover{opacity:1;transform:none;background:var(--np-accent-state-1,rgba(255,255,255,.08))}
            /* toolbar: consultazione = Modifica; editing = Reset/Salva/X-esci */
            .aw-np-hotkey-tools .is-ok,.aw-np-hotkey-tools .is-cancel,.aw-np-hotkey-tools .is-reset{display:none}
            #aw-np-hotkey-overlay.editing .aw-np-hotkey-tools .is-edit{display:none}
            #aw-np-hotkey-overlay.editing .aw-np-hotkey-tools .is-ok,#aw-np-hotkey-overlay.editing .aw-np-hotkey-tools .is-cancel,#aw-np-hotkey-overlay.editing .aw-np-hotkey-tools .is-reset{display:flex}
            /* in edit: speciali in grigio, lettere cliccabili */
            #aw-np-hotkey-overlay.editing .aw-np-key-special{opacity:.28!important;filter:grayscale(1)}
            #aw-np-hotkey-overlay.editing .aw-np-key-letter-slot{cursor:pointer}
            #aw-np-hotkey-overlay.editing .aw-np-key-letter-slot.on:hover,#aw-np-hotkey-overlay.editing .aw-np-key-letter-slot.off:hover{background:var(--np-accent-state-1,color-mix(in srgb,var(--np-accent,#1565C0) 22%,var(--np-accent-bg,#223A56)))}
            #aw-np-hotkey-overlay.editing .aw-np-key-letter-slot.off:hover .aw-np-key-letter{opacity:1}
            .aw-np-key-letter-slot.listening{box-shadow:0 0 0 2px #fff,0 0 14px 2px rgba(255,255,255,.85);z-index:1}
            .aw-np-kbd-fn{height:clamp(20px,3cqh,30px);display:flex;align-items:center;justify-content:flex-start;flex:1;min-width:0;overflow:hidden;gap:clamp(10px,1.6cqw,18px);opacity:0;transform:translateY(4px);transition:opacity var(--np-t) var(--np-ease),transform var(--np-t) var(--np-ease)}
            .aw-np-kbd-fn.show{opacity:1;transform:translateY(0)}
            .aw-np-kbd-fn-name{font-size:clamp(10px,1.7cqh,14px);font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--np-accent-dim,#9db8e0);font-family:Arial,sans-serif;line-height:1;padding-right:clamp(10px,1.6cqw,18px);border-right:1px solid color-mix(in srgb,var(--np-accent-bg-fg,#CCDDF1) 22%,transparent)}
            .aw-np-kbd-fn-desc{font-size:clamp(12px,2cqh,18px);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-family:Arial,sans-serif;line-height:1}
            #aw-np-dot-btn:hover{transform:scale(1.15)}
            #aw-np-dot-btn:hover .np-tip{opacity:1;transition-delay:.3s}
            #aw-np-dot-btn .np-tip{bottom:auto;top:calc(100% + 10px);left:auto;right:0;transform:none}
            #aw-np-dot-btn .np-tip::after{top:auto;bottom:100%;left:auto;right:5px;transform:none;border-top-color:transparent;border-bottom-color:var(--np-tip-bg,#1b1c1f)}
            ${panelCss("#aw-np-color-panel", PANEL_CSS_DESKTOP)}
${SWATCH_GRID}
            #aw-np-color-panel .aw-np-color-custom-prev{width:clamp(16px,2cqh,22px);height:clamp(16px,2cqh,22px)}
${SWATCH_HOVER}
${SWATCH_ACTIVE}
${CONTROLS_SEEK}
            #aw-np-seek-track{position:relative;width:100%;height:4px;border-radius:var(--np-r-xs);background:rgba(255,255,255,.2);transition:height var(--np-t-fast) var(--np-ease)}
            #aw-np-seek-wrap:hover #aw-np-seek-track{height:6px}
${SEEK_BUF}
            #aw-np-seek-fill{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent,#fff);width:0;transition:background var(--np-t)}
            #aw-np-seek-thumb{position:absolute;top:50%;left:0;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;transform:translate(-50%,-50%) scale(0);transition:transform var(--np-t-fast) var(--np-ease),box-shadow var(--np-t-fast);box-shadow:var(--np-elev-1)}
            #aw-np-seek-wrap:hover #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1)}
            #aw-np-seek-wrap.seeking #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1.2)}
            #aw-np-seek-tip{position:absolute;bottom:calc(100% + 10px);left:0;transform:translateX(-50%);background:var(--np-tip-bg,#282828);color:var(--np-accent-bg-fg,#fff);font-size:var(--np-fs-small);font-weight:500;padding:4px 8px;border-radius:var(--np-r-sm);border:var(--np-line-soft);pointer-events:none;white-space:nowrap;visibility:hidden;box-shadow:var(--np-elev-1);letter-spacing:.02em}
${BAR}
${ICON}
            .np-btn{position:relative;display:flex;align-items:center;justify-content:center;width:var(--np-btn-size);height:var(--np-btn-size);background:none;border:none;cursor:pointer;color:var(--np-accent-bg-fg,rgba(255,255,255,.75));padding:0;flex-shrink:0;border-radius:50%;transition:color var(--np-t) var(--np-ease),background var(--np-t)}
            .np-btn:hover{color:var(--np-accent-bg-fg,#fff);background:var(--np-accent-state-1,rgba(255,255,255,.1))}
${ACCENT_BTN}
${ACCENT_BRAND_RIPPLE}
            #aw-np-time{font-size:calc(15px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));letter-spacing:.04em;white-space:nowrap;padding:0 6px;font-variant-numeric:tabular-nums;text-shadow:0 1px 3px rgba(0,0,0,.8)}
${SPACER}
            #aw-np-vol-group{position:relative;display:flex;align-items:center}
            #aw-np-vol-group::after{content:'';position:absolute;bottom:100%;left:-8px;right:-8px;height:calc(var(--np-seek-h) + 20px);pointer-events:none}
            #aw-np-vol-group:hover::after{pointer-events:all}
            #aw-np-vol-popup{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 8px);left:50%;transform:translateX(-50%);width:44px;height:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;transition:height var(--np-t) var(--np-ease),padding var(--np-t) var(--np-ease);padding:0}
            #aw-np-vol-group:hover #aw-np-vol-popup,#aw-np-vol-group:focus-within #aw-np-vol-popup{height:148px;padding:10px 0 12px;background:var(--np-surf-2);border:var(--np-line);border-radius:var(--np-r-lg);box-shadow:var(--np-elev-2)}
            #aw-np-vol-pct{font-size:var(--np-fs-small);font-weight:500;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));width:32px;text-align:center;font-variant-numeric:tabular-nums;flex-shrink:0;display:block;letter-spacing:.02em;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-vol{-webkit-appearance:none;appearance:none;width:4px;height:108px;border-radius:var(--np-r-xs);background:rgba(255,255,255,.2);cursor:pointer;outline:none;writing-mode:vertical-lr;direction:rtl;transition:background var(--np-t-fast)}
            #aw-np-vol::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;cursor:pointer;box-shadow:var(--np-elev-1);transition:transform var(--np-t-fast) var(--np-ease)}
            #aw-np-vol:hover::-webkit-slider-thumb{transform:scale(1.2)}
            #aw-np-vol::-moz-range-thumb{width:14px;height:14px;background:var(--np-accent,#fff);border:none;border-radius:50%;cursor:pointer;box-shadow:var(--np-elev-1)}
            ${panelCss("#aw-np-settings-panel", PANEL_CSS_DESKTOP)}
            ${panelCss("#aw-np-report-panel", PANEL_CSS_DESKTOP)}
            ${reportCss()}
            ${mailCss(MAIL_CSS_DESKTOP)}
            ${panelCss("#aw-np-bp-panel", { nativeW: "560px" })}
            ${bpCss("#aw-np-bp-panel")}
${SWITCH}
            .np-tip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:var(--np-tip-bg,#1b1c1f);color:rgba(255,255,255,.92);font-size:var(--np-fs-small);font-weight:500;padding:5px 10px;border-radius:var(--np-r-sm);border:var(--np-line-soft);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity var(--np-t-fast) var(--np-ease);z-index:20;box-shadow:var(--np-elev-1)}
            .np-tip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--np-tip-bg,#1b1c1f)}
            .np-btn:hover .np-tip{opacity:1;transition-delay:.4s}
            /* Tip dei bottoni d'angolo: ancorati al bordo del bottone per non uscire dal frame (freccia sul centro bottone). */
            #aw-btn-play .np-tip{left:0;right:auto;transform:none}
            #aw-btn-play .np-tip::after{left:calc(var(--np-btn-size) / 2)}
            #aw-btn-fs .np-tip{left:auto;right:0;transform:none}
            #aw-btn-fs .np-tip::after{left:auto;right:calc(var(--np-btn-size) / 2);transform:translateX(50%)}
            .np-row-tip{position:absolute;top:50%;right:calc(100% + 14px);transform:translateY(-50%);background:var(--np-tip-bg,#000);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:var(--np-fs-small);line-height:1.5;padding:6px 10px;border-radius:var(--np-r-md);border:var(--np-line-soft);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity var(--np-t-fast) var(--np-ease);transition-delay:0s;z-index:20;box-shadow:var(--np-elev-2)}
${ROWTIP_AFTER_DATATIP}
            .aw-np-toast{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px);left:50%;transform:translateX(-50%);background:color-mix(in srgb,var(--np-accent-bg,#282828) 80%,transparent);color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-size:var(--np-fs-body);font-weight:500;letter-spacing:.02em;padding:7px 16px;border-radius:var(--np-r-pill);pointer-events:none;white-space:nowrap;opacity:1;transition:opacity var(--np-t-slower) var(--np-ease);z-index:20;box-shadow:var(--np-elev-2)}

            #aw-np-speed-ind{font-size:var(--np-fs-micro);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.55));letter-spacing:.03em;white-space:nowrap;padding:0 0 0 6px;font-variant-numeric:tabular-nums}
${SPEED_POPUP}
            #aw-np-clock{position:absolute!important;inset:clamp(8px,1.2cqh,16px) clamp(10px,1.4cqh,18px) auto auto!important;display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.6);font-size:calc(clamp(18px,3.1cqh,34px) * var(--ui-scale));font-weight:500;padding:2px 4px;pointer-events:none;z-index:20;letter-spacing:.03em;text-shadow:0 1px 6px rgba(0,0,0,.95);font-variant-numeric:tabular-nums;transition:opacity var(--np-t-slow) var(--np-ease);flex:none;transform:none}
${CLOCK_CONN}
            #aw-np-buf-pct{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:var(--np-fs-title);font-weight:600;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));pointer-events:none;font-variant-numeric:tabular-nums;text-shadow:0 1px 4px rgba(0,0,0,.9)}
            #aw-np-buf-pct.on{display:flex}
${ERROR_SPINNER}
            ${KEYFRAMES_CSS}
${FLASH_TAIL}
${SKIP_POPUP}
${AWAKE_GUARD}
${PANEL_SUBROW}
        `;
    document.head.appendChild(s);
  }

  // src/styles/styles-mobile.js
  var MAIL_CSS_MOBILE = { w: "720px", h: "560px", listW: "36%", listMin: "120px", listMax: "240px", delOp: ".45" };
  var PANEL_CSS_MOBILE = { nativeW: "650px" };
  function injectStyleMobile() {
    if (document.getElementById("aw-np-style")) return;
    const s = document.createElement("style");
    s.id = "aw-np-style";
    s.textContent = `
${HEADER}
${rootVars({ seekH: "30px", topH: "58px", touch: "pan-y" })}
${FS}
            #aw-np-video{flex:1;width:100%;min-height:0;display:block;background:#000}
            #aw-np-bar,#aw-np-top,.aw-np-toast,#aw-np-error-toast,#aw-np-conn-toast,#aw-np-settings-panel,#aw-np-color-panel,#aw-np-menu-panel,.np-row-tip,.np-btn,.np-swatch,.np-switch-track,.np-switch-thumb,#aw-np-seek-fill,#aw-np-seek-buf,#aw-np-seek-thumb,#aw-np-title,#aw-np-epinfo,#aw-np-brand,#aw-np-clock,#aw-np-clock svg circle,#aw-np-clock .hand-h,#aw-np-clock .hand-m,#aw-np-clock .pin,#aw-np-spinner,#aw-np-time,#aw-np-speed-ind,#aw-np-speed-popup,#aw-np-buf-pct,#aw-np-dot,#aw-np-play-center{transition-property:color,background,background-color,fill,stroke,border-color,box-shadow;transition-duration:.4s;transition-timing-function:var(--np-ease)}
            .np-grad{position:absolute;left:0;right:0;height:140px;pointer-events:none;opacity:0;transition:opacity var(--np-t-slow) var(--np-ease)}
${UI_LAYER}
            #aw-np-top{position:absolute;top:0;left:0;right:0;height:var(--np-top-h);display:flex;align-items:center;justify-content:space-between;padding:0 max(calc(10px * var(--ui-scale)),env(safe-area-inset-right)) 0 max(calc(10px * var(--ui-scale)),env(safe-area-inset-left))}
            #aw-np-top-left{display:flex;flex-direction:column;gap:1px;overflow:hidden;flex:1}
            #aw-np-title{font-size:calc(var(--np-fs-title) * 1.2);font-weight:600;color:var(--np-accent-bg-fg,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40cqw;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-epinfo{font-size:calc(var(--np-fs-title) * 0.8);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.7));opacity:.8;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-top-right{display:flex;flex-direction:column;align-items:flex-end;gap:clamp(5px,1.4cqw,9px);flex-shrink:0}
            #aw-np-top-actions{display:flex;align-items:center;gap:clamp(10px,2.4cqw,16px)}
${DOT}
            #aw-np-kbd-btn{display:none!important}
            #aw-np-browser-btn,#aw-np-report-btn,#aw-np-mail-btn{width:calc(var(--np-fs-title) * 0.95);height:calc(var(--np-fs-title) * 0.95);border-radius:var(--np-r-sm);background:var(--np-surf-2);border:var(--np-line);color:var(--np-accent-bg-fg,#CCDDF1);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;position:relative;user-select:none}
${ACTION_SVG}
            .aw-np-mail-badge{display:none;position:absolute;top:-2px;right:-2px;width:7px;height:7px;border-radius:50%;background:var(--np-accent,#ec4f4f)}
            ${panelCss("#aw-np-color-panel", PANEL_CSS_MOBILE)}
${SWATCH_GRID}
            #aw-np-color-panel .aw-np-color-custom-prev{width:clamp(16px,2.6cqw,22px);height:clamp(16px,2.6cqw,22px)}
${SWATCH_ACTIVE}
${SWATCH_HOVER}
${CONTROLS_SEEK}
            #aw-np-controls{padding-left:max(calc(10px * var(--ui-scale)),env(safe-area-inset-left));padding-right:max(calc(10px * var(--ui-scale)),env(safe-area-inset-right))}
            #aw-np-seek-track{position:relative;width:100%;height:4px;border-radius:var(--np-r-xs);background:rgba(255,255,255,.2)}
${SEEK_BUF}
            #aw-np-seek-fill{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent,#fff);width:0}
            #aw-np-seek-thumb{position:absolute;top:50%;left:0;width:16px;height:16px;background:var(--np-accent,#fff);border-radius:50%;transform:translate(-50%,-50%) scale(0);transition:transform var(--np-t-fast) var(--np-ease);box-shadow:var(--np-elev-1)}
            #aw-np-seek-wrap:active #aw-np-seek-thumb,#aw-np-seek-wrap.seeking #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1.2)}
${BAR}
${SPACER}
${ICON}
            .np-btn{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;width:var(--np-btn-size);height:var(--np-btn-size);min-width:unset;background:none;border:none;cursor:pointer;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));padding:0;flex-shrink:0;border-radius:50%}
${ACCENT_BTN}
            #aw-np-brand{font-size:calc(var(--np-fs-title) * 0.8);font-weight:500;letter-spacing:.04em;color:var(--np-accent-bg-fg,rgba(255,255,255,.5));opacity:.6;white-space:nowrap;line-height:1;text-transform:uppercase}
${ACCENT_BRAND_RIPPLE}
            #aw-np-time{font-size:calc(15px * var(--np-chrome-scale,1) * var(--ui-scale) * var(--np-ctrl-mul));font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));letter-spacing:.03em;white-space:nowrap;padding:0 4px;font-variant-numeric:tabular-nums}
            #aw-np-menu-panel{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 8px);right:max(8px,env(safe-area-inset-right));background:var(--np-surf-2);border:var(--np-line);border-radius:var(--np-r-lg);padding:8px;display:flex;flex-direction:column;gap:2px;z-index:25;opacity:0;transform:scale(.9) translateY(8px);transform-origin:bottom right;pointer-events:none;transition:opacity var(--np-t) var(--np-ease),transform var(--np-t) var(--np-ease);box-shadow:var(--np-elev-3);max-width:calc(100vw - 16px);max-height:calc(100% - 120px);overflow-y:auto}
            #aw-np-menu-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            .np-menu-btn{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:var(--np-r-md);border:none;background:none;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:var(--np-fs-body);cursor:pointer;width:100%;text-align:left}
            .np-menu-btn:active{background:var(--np-accent-state-2,rgba(255,255,255,.18))}
            .np-menu-btn svg{fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));width:22px;height:22px;flex-shrink:0}
            .np-menu-btn span{display:block}
            @media (orientation:portrait){#aw-np-menu-panel{flex-direction:row;padding:4px}.np-menu-btn{padding:8px;width:auto;gap:0}.np-menu-btn span{display:none}}
            ${panelCss("#aw-np-settings-panel", PANEL_CSS_MOBILE)}
            ${panelCss("#aw-np-report-panel", PANEL_CSS_MOBILE)}
            ${reportCss()}
            ${mailCss(MAIL_CSS_MOBILE)}
            ${panelCss("#aw-np-bp-panel", { nativeW: "650px" })}
            ${bpCss("#aw-np-bp-panel")}
${SWITCH}
            .np-row-tip{position:absolute;top:50%;right:calc(100% + 14px);transform:translateY(-50%);background:var(--np-tip-bg,#000);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:var(--np-fs-small);line-height:1.5;padding:6px 10px;border-radius:var(--np-r-md);border:var(--np-line-soft);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity var(--np-t-fast);z-index:20;box-shadow:var(--np-elev-2)}
${ROWTIP_AFTER_DATATIP}
            .aw-np-toast{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px);left:50%;transform:translateX(-50%);background:color-mix(in srgb,var(--np-accent-bg,#282828) 80%,transparent);color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-size:var(--np-fs-body);font-weight:500;padding:7px 16px;border-radius:var(--np-r-pill);pointer-events:none;white-space:nowrap;opacity:1;transition:opacity var(--np-t-slower) var(--np-ease);z-index:20;box-shadow:var(--np-elev-2)}

            #aw-np-speed-ind{font-size:var(--np-fs-micro);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.55));letter-spacing:.03em;white-space:nowrap;padding:0 0 0 4px;font-variant-numeric:tabular-nums;display:none}
            @media (orientation:landscape){#aw-np-speed-ind{display:inline}}
${SPEED_POPUP}
            #aw-np-speed-popup{font-size:calc(clamp(13px,26px * var(--np-chrome-scale,1),23px) * var(--ui-scale))}
            #aw-np-clock{position:absolute!important;inset:max(10px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) auto auto!important;display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.6);font-size:calc(clamp(13px,26px * var(--np-chrome-scale,1),23px) * var(--ui-scale));font-weight:500;padding:2px 4px;pointer-events:none;z-index:20;letter-spacing:.03em;text-shadow:0 1px 6px rgba(0,0,0,.95);font-variant-numeric:tabular-nums;transition:opacity var(--np-t-slow) var(--np-ease);flex:none;transform:none;margin:0}
${CLOCK_CONN}
            #aw-np-buf-pct{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:var(--np-fs-title);font-weight:600;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));pointer-events:none;display:none;font-variant-numeric:tabular-nums;text-shadow:0 1px 4px rgba(0,0,0,.9)}
            #aw-np-buf-pct.on{display:block}
${ERROR_SPINNER}
            ${KEYFRAMES_CSS}
${FLASH_TAIL}
${SKIP_POPUP}
${AWAKE_GUARD}
${PANEL_SUBROW}

            #aw-np-play-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:all;z-index:5;color:var(--np-accent-bg-fg,rgba(255,255,255,.9))}
            #aw-np-play-center::before{content:'';position:absolute;inset:0;border-radius:50%;background:var(--np-accent-bg,#1a1a2e);opacity:.85;pointer-events:none}
            #aw-np-play-center svg{fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));width:30px;height:30px;position:relative;z-index:1}
            .np-seek-flash{position:absolute;top:0;bottom:0;width:25%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity var(--np-t)}
            .np-seek-flash.on{opacity:1}
            #aw-np-seek-flash-left{left:0}
            #aw-np-seek-flash-right{right:0}
            .np-seek-flash svg{color:rgba(255,255,255,.7);width:40px;height:40px}
            .np-vol-bar{position:absolute;top:0;bottom:0;width:25%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity var(--np-t-slow)}
            .np-vol-bar.on{opacity:1}
            #aw-np-vol-bar-left{left:0}
            #aw-np-vol-bar-right{right:0}
            #aw-np.fs #aw-np-top{top:var(--np-lb-y,0px)}
            #aw-np.fs #aw-np-controls{bottom:var(--np-lb-y,0px)}
            #aw-np.fs #aw-np-gradient{bottom:var(--np-lb-y,0px)}
            #aw-np.fs #aw-np-gradient-top{top:var(--np-lb-y,0px)}
            #aw-np.fs #aw-np-menu-panel{bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 8px + var(--np-lb-y,0px))}
            #aw-np.fs #aw-np-skip-popup{bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 22px + var(--np-lb-y,0px))}
            #aw-np.fs #aw-np-error-toast,#aw-np.fs #aw-np-load-error-toast{bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px + var(--np-lb-y,0px))}
            #aw-np.fs .aw-np-toast{bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px + var(--np-lb-y,0px))}
            #aw-np.fs #aw-np-clock{top:calc(max(10px,env(safe-area-inset-top)) + var(--np-lb-y,0px))!important}
            #aw-np.fs #aw-np-speed-popup{top:calc(max(10px,env(safe-area-inset-top)) + var(--np-lb-y,0px))}
            #aw-np.fs #aw-np-conn-toast{top:calc(clamp(12px,1.7cqh,18px) + var(--np-lb-y,0px))}
            #aw-np.fs{--np-ctrl-mul:1;--np-top-mul:1.2}
            @media (orientation:landscape){.np-portrait-only{display:none!important}}
            @media (orientation:portrait){.np-landscape-only{display:none!important}}
        `;
    document.head.appendChild(s);
  }

  // src/lib/dom.js
  function mk(tag, id) {
    const e = document.createElement(tag);
    if (id) e.id = id;
    return e;
  }
  function mkBtn(id, html, tip) {
    const b = mk("button");
    b.className = "np-btn";
    b.id = id;
    b.innerHTML = html;
    b.tabIndex = -1;
    const rl = document.createElement("span");
    rl.className = "np-ripple-layer";
    b.appendChild(rl);
    if (tip) {
      const t = document.createElement("span");
      t.className = "np-tip";
      t.textContent = tip;
      b.appendChild(t);
    }
    return b;
  }
  function mkIcon(btn, html) {
    const s = document.createElement("span");
    s.className = "np-icon";
    s.innerHTML = html;
    btn.prepend(s);
    return s;
  }
  function setIcon(el2, html) {
    if (el2) el2.innerHTML = html;
  }
  function setTip(btn, text) {
    const t = btn.querySelector(".np-tip");
    if (t) t.textContent = text;
  }
  function mkRowTip(text) {
    const t = document.createElement("span");
    t.className = "np-row-tip";
    t.textContent = text;
    return t;
  }
  function flashToast(wrap, text, pos = "bottom") {
    wrap.querySelector(`.aw-np-toast[data-pos="${pos}"]`)?.remove();
    const toast = mk("div");
    toast.className = "aw-np-toast";
    toast.dataset.pos = pos;
    toast.textContent = text;
    wrap.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), TOAST_FADE_MS);
    }, TOAST_SHOW_MS);
  }
  function mkSwitch(checked) {
    const label = document.createElement("label");
    label.className = "np-switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    const track = document.createElement("span");
    track.className = "np-switch-track";
    const thumb = document.createElement("span");
    thumb.className = "np-switch-thumb";
    label.append(input, track, thumb);
    return { label, input };
  }
  function el(tag, className, opts = {}) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (opts.id) e.id = opts.id;
    if (opts.text != null) e.textContent = opts.text;
    if (opts.html != null) e.innerHTML = opts.html;
    if (opts.attrs) for (const k in opts.attrs) e.setAttribute(k, opts.attrs[k]);
    if (opts.style) Object.assign(e.style, opts.style);
    if (opts.on) for (const evt in opts.on) e.addEventListener(evt, opts.on[evt]);
    if (opts.kids) e.append(...opts.kids);
    return e;
  }

  // src/lib/icons.js
  var svg = (p) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${p}</svg>`;
  var IC = {
    play: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>'),
    pause: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="5" height="18" x="14" y="3" rx="1"/><rect width="5" height="18" x="5" y="3" rx="1"/></g>'),
    mute: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298zM22 9l-6 6m0-6l6 6"/>'),
    vol: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298zM16 9a5 5 0 0 1 0 6m3.364 3.364a9 9 0 0 0 0-12.728"/>'),
    volDown: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298zM16 9a5 5 0 0 1 0 6"/>'),
    fsOn: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/>'),
    fsOff: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m8 0v-3a2 2 0 0 1 2-2h3"/>'),
    pip: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></g>'),
    settings: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0a2.34 2.34 0 0 0 3.319 1.915a2.34 2.34 0 0 1 2.33 4.033a2.34 2.34 0 0 0 0 3.831a2.34 2.34 0 0 1-2.33 4.033a2.34 2.34 0 0 0-3.319 1.915a2.34 2.34 0 0 1-4.659 0a2.34 2.34 0 0 0-3.32-1.915a2.34 2.34 0 0 1-2.33-4.033a2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></g>'),
    restart: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9a9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></g>'),
    skip: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 12 18z"/><path d="M2 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 2 18z"/></g>'),
    undo: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></g>'),
    prev: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432zM3 20V4"/>'),
    next: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 4v16M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z"/>'),
    seekFwd: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 17l5-5l-5-5m7 10l5-5l-5-5"/>'),
    seekBwd: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m11 17l-5-5l5-5m7 10l-5-5l5-5"/>'),
    menu: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></g>'),
    unlock: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></g>'),
    flag: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>'),
    bookmark: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>'),
    warning: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/>'),
    browser: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h6v6m-11 5L21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
    mail: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m22 7l-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect width="20" height="16" x="2" y="4" rx="2"/></g>'),
    trash: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    close: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/>'),
    restore: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h2M20 8v11a2 2 0 0 1-2 2h-2m-7-6l3-3l3 3m-3-3v9"/></g>'),
    edit: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4"/>'),
    check: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/>'),
    world: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20a14.5 14.5 0 0 0 0-20M2 12h20"/></g>'),
    moon: svg('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>'),
    palette: svg('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 22a1 1 0 0 1 0-20a10 9 0 0 1 10 9a5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></g>'),
    github: svg('<path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>'),
    greasyfork: svg('<path fill="currentColor" d="M5.89 2.227a.28.28 0 0 1 .266.076l5.063 5.062c.54.54.509 1.652-.031 2.192l8.771 8.77c1.356 1.355-.36 3.097-1.73 1.728l-8.772-8.77c-.54.54-1.651.571-2.191.031l-5.063-5.06c-.304-.304.304-.911.608-.608l3.714 3.713L7.59 8.297L3.875 4.582c-.304-.304.304-.911.607-.607l3.715 3.714l1.067-1.066L5.549 2.91c-.228-.228.057-.626.342-.683ZM12 0C5.374 0 0 5.375 0 12s5.374 12 12 12c6.625 0 12-5.375 12-12S18.625 0 12 0"/>'),
    telegram: svg('<path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0zm4.962 7.224c.1-.002.321.023.465.14a.5.5 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024q-.159.037-5.061 3.345q-.72.495-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789q.04-.324.893-.663q5.247-2.286 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635"/>'),
    whatsapp: svg('<path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52s.198-.298.298-.497c.099-.198.05-.371-.025-.52s-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074s2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413s.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884c2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413"/>')
  };

  // src/core/constants.js
  var HIDE_DELAY_MS = 3e3;
  var SKIP_SECONDS = 85;
  var SAVE_INTERVAL_MS = 5e3;
  var RESUME_MIN_POS = 5;
  var RESUME_END_GAP = 10;
  var RESUME_MAX_AGE = 30 * 24 * 60 * 60 * 1e3;
  var PRELOAD_THRESHOLD = 0.75;
  var SKIP_POPUP_MS = 1e4;
  var SKIP_UNDO_MS = 1e4;
  var SKIP_END_GAP = 10;
  var AUTONEXT_TAIL = 1;
  var AWAKE_IDLE_MS = 30 * 60 * 1e3;
  var KEY_VOL = "aw-np-vol";
  var KEY_MUTE = "aw-np-muted";
  var KEY_GLOBAL = "aw-np-global";
  var KEY_RESUME_ENABLE = "aw-np-resume-enabled";
  var KEY_RESUME_PFX = "aw-np-resume:";
  var KEY_SEEK_SECS = "aw-np-seek-secs";
  var KEY_AUTOEP_ENABLE = "aw-np-autoep-enabled";
  var KEY_AUTOEP_PFX = "aw-np-autoep:";
  var KEY_AUTOPLAY_ENABLE = "aw-np-autoplay-enabled";
  var KEY_COLOR = "aw-np-color";
  var KEY_COLOR_GLOBAL = "aw-np-color-global";
  var KEY_ICON_COLOR = "aw-np-icon-color";
  var KEY_TOP_COLOR = "aw-np-top-color";
  var KEY_FLASH_ENABLE = "aw-np-flash-enabled";
  var KEY_CLOCK = "aw-np-clock-enabled";
  var KEY_SPEED_POPUP = "aw-np-speed-popup-enabled";
  var KEY_CONN_MONITOR = "aw-np-conn-monitor-enabled";
  var KEY_SPEED = "aw-np-speed";
  var KEY_HOTKEYS = "aw-np-hotkeys";
  var KEY_REPORT_LAST_TS = "aw-np-report-last-ts";
  var KEY_MAIL_STATE = "aw-np-mail-state";
  var KEY_UI_SCALE = "aw-np-ui-scale";
  var KEY_CUSTOM_COLORS = "aw-np-custom-colors";
  var KEY_SKIP_ENABLE = "aw-np-skip-enabled";
  var KEY_SKIP_AUTO = "aw-np-skip-auto";
  var KEY_SKIP_NEXT = "aw-np-skip-autonext";
  var KEY_SKIP_OP = "aw-np-skip-op";
  var KEY_SKIP_ED = "aw-np-skip-ed";
  var KEY_SKIP_AWAKE = "aw-np-skip-awake";
  var WORKER_BASE = "https://awbp-skip-collector.cibernetic-gg.workers.dev";
  var REPORT_HEARTBEAT_MS = 6e4;
  var SCRIPT_VERSION = "3.0.0";
  var SEEK_DEFAULT = 5;
  var SEEK_MIN = 5;
  var SEEK_MAX = 30;
  var SEEK_STEP = 5;
  var SPEED_DEFAULT = 1;
  var SPEED_MIN = 0.25;
  var SPEED_MAX = 3;
  var SPEED_STEP = 0.25;
  var UISCALE_DEFAULT = 1;
  var UISCALE_MIN = 0.5;
  var UISCALE_MAX = 1.5;
  var UISCALE_STEP = 0.1;
  var PALETTE = [
    { name: "Bianco", hex: "#ffffff" },
    { name: "Rosso", hex: "#f44336" },
    { name: "Arancio", hex: "#ff9800" },
    { name: "Ambra", hex: "#ffc107" },
    { name: "Giallo", hex: "#ffeb3b" },
    { name: "Lime", hex: "#cddc39" },
    { name: "Verde", hex: "#4caf50" },
    { name: "Teal", hex: "#009688" },
    { name: "Ciano", hex: "#00bcd4" },
    { name: "Azzurro", hex: "#42a5f5" },
    { name: "Blu", hex: "#1565c0" },
    { name: "Indaco", hex: "#3f51b5" },
    { name: "Viola", hex: "#9c27b0" },
    { name: "Magenta", hex: "#ff4081" },
    { name: "Rosa", hex: "#e91e8c" },
    { name: "Grigio", hex: "#78909c" }
  ];

  // src/core/storage.js
  var lsGet = (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  var lsSet = (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
    }
  };
  var lsDel = (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
    }
  };

  // src/state/volume.js
  function loadVol() {
    const v = parseFloat(lsGet(KEY_VOL) ?? "1");
    return { vol: isNaN(v) ? 1 : Math.max(0, Math.min(1, v)), muted: lsGet(KEY_MUTE) === "true" };
  }
  var saveVol = (vol, muted) => {
    lsSet(KEY_VOL, String(vol));
    lsSet(KEY_MUTE, String(muted));
  };

  // src/core/settings.js
  var _cachedAnimeId = "";
  var animeId = () => {
    if (!_cachedAnimeId) {
      const el2 = document.querySelector("#player");
      if (el2) _cachedAnimeId = el2.dataset.animeId || "";
    }
    return _cachedAnimeId;
  };
  var isGlobalOn = () => lsGet(KEY_GLOBAL) !== "0";
  var pKey = (k) => isGlobalOn() ? k : k + ":" + (animeId() || "unknown");
  var isResumeOn = () => lsGet(pKey(KEY_RESUME_ENABLE)) !== "0";
  var isAutoEpOn = () => lsGet(pKey(KEY_AUTOEP_ENABLE)) === "1";
  var isAutoPlayOn = () => lsGet(pKey(KEY_AUTOPLAY_ENABLE)) === "1";
  var isColorGlobalOn = () => lsGet(KEY_COLOR_GLOBAL) !== "0";
  var isIconColorOn = () => lsGet(KEY_ICON_COLOR) === "1";
  var isTopColorOn = () => lsGet(KEY_TOP_COLOR) === "1";
  var isFlashOn = () => lsGet(KEY_FLASH_ENABLE) !== "0";
  var isConnMonitorOn = () => lsGet(KEY_CONN_MONITOR) !== "0";
  var isClockOn = () => lsGet(KEY_CLOCK) !== "0";
  var isSpeedPopupOn = () => lsGet(KEY_SPEED_POPUP) !== "0";
  var isSkipOn = () => lsGet(KEY_SKIP_ENABLE) === "1";
  var isAutoSkipOn = () => lsGet(KEY_SKIP_AUTO) === "1";
  var isAutoNextOn = () => lsGet(KEY_SKIP_NEXT) === "1";
  var isOpeningOn = () => lsGet(KEY_SKIP_OP) !== "0";
  var isEndingOn = () => lsGet(KEY_SKIP_ED) !== "0";
  var isAwakeGuardOn = () => lsGet(KEY_SKIP_AWAKE) !== "0";

  // src/state/speed.js
  var loadSpeed = () => {
    const v = parseFloat(lsGet(pKey(KEY_SPEED)) ?? String(SPEED_DEFAULT));
    return isNaN(v) ? SPEED_DEFAULT : Math.max(SPEED_MIN, Math.min(SPEED_MAX, v));
  };
  var fmtSpeed = (v) => v.toFixed(2) + "x";

  // src/lib/fullscreen.js
  var fsElement = () => document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || null;
  var fsExit = () => (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen)?.call(document).catch(() => {
  });
  var fsRequest = (el2) => (el2.requestFullscreen || el2.mozRequestFullScreen || el2.webkitRequestFullscreen)?.call(el2).catch(() => {
  });
  var fsChange = (cb) => {
    ["fullscreenchange", "mozfullscreenchange", "webkitfullscreenchange"].forEach((e) => document.addEventListener(e, cb));
    return () => ["fullscreenchange", "mozfullscreenchange", "webkitfullscreenchange"].forEach((e) => document.removeEventListener(e, cb));
  };

  // src/player/init-video.js
  function initVideo(videoUrl) {
    const { vol, muted } = loadVol();
    const video = mk("video", "aw-np-video");
    video.autoplay = false;
    video.preload = "auto";
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.src = videoUrl;
    video.volume = vol;
    video.muted = muted;
    video.playbackRate = loadSpeed();
    let _userInteracted = false;
    const _play = () => {
      _userInteracted = true;
      return video.play().catch(() => {
      });
    };
    const _enforceInitialPause = () => {
      try {
        if (_userInteracted) return;
        if (video.paused) return;
        if (isAutoPlayOn() && fsElement()) return;
        video.pause();
      } catch (e) {
      }
    };
    video.addEventListener("play", _enforceInitialPause, { capture: true });
    return { video, vol, muted, _play };
  }

  // src/widgets/shell.js
  function buildShellElements() {
    const wrap = mk("div", "aw-np");
    const grad = el("div", "np-grad", { id: "aw-np-gradient" });
    const gradTop = el("div", "np-grad", { id: "aw-np-gradient-top" });
    const spinner = mk("div", "aw-np-spinner");
    const center = el("div", "np-flash-circle", { id: "aw-np-center", html: IC.play });
    const ctrls = el("div", "np-ui-layer", { id: "aw-np-controls" });
    const timeEl = el("div", null, { id: "aw-np-time", text: "00:00 / 00:00" });
    return { wrap, grad, gradTop, spinner, center, ctrls, timeEl };
  }

  // src/widgets/indicators.js
  function buildSpeedIndicator(initSpeed) {
    const speedIndEl = mk("span", "aw-np-speed-ind");
    const speedPopup = mk("div", "aw-np-speed-popup");
    const updateSpeedInd = (v) => {
      speedIndEl.textContent = "(" + fmtSpeed(v) + ")";
    };
    const showSpeedPopup = (v) => {
      speedPopup.textContent = fmtSpeed(v);
      speedPopup.classList.toggle("on", Math.abs(v - 1) > 1e-3);
    };
    updateSpeedInd(initSpeed);
    showSpeedPopup(initSpeed);
    return { speedIndEl, speedPopup, updateSpeedInd, showSpeedPopup, clearTimer: () => {
    } };
  }
  function buildBufferingIndicator(video, spinner) {
    const bufPctEl = mk("div", "aw-np-buf-pct");
    const TARGET_AHEAD = 1;
    let bufStartCt = null;
    const updateBufPct = () => {
      if (bufStartCt === null || !video.buffered.length) {
        bufPctEl.textContent = "0%";
        return;
      }
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= bufStartCt + 0.1 && bufStartCt <= video.buffered.end(i) + 0.1) {
          const ahead = Math.max(0, video.buffered.end(i) - bufStartCt);
          const pct = Math.min(100, Math.round(ahead / TARGET_AHEAD * 100));
          bufPctEl.textContent = pct + "%";
          return;
        }
      }
      bufPctEl.textContent = "0%";
    };
    let bufTimer = null;
    const startBufTimer = () => {
      if (bufTimer) return;
      updateBufPct();
      bufTimer = setInterval(updateBufPct, 250);
    };
    const stopBufTimer = () => {
      clearInterval(bufTimer);
      bufTimer = null;
      bufStartCt = null;
    };
    video.addEventListener("progress", updateBufPct);
    video.addEventListener("waiting", () => {
      bufStartCt = video.currentTime;
      bufPctEl.classList.add("on");
      spinner.classList.add("on");
      startBufTimer();
    });
    video.addEventListener("playing", () => {
      bufPctEl.classList.remove("on");
      spinner.classList.remove("on");
      stopBufTimer();
    });
    video.addEventListener("canplay", () => {
      bufPctEl.classList.remove("on");
      spinner.classList.remove("on");
      stopBufTimer();
    });
    return { bufPctEl, clearTimer: stopBufTimer };
  }

  // src/lib/time-fmt.js
  function fmt(s) {
    const t = Math.max(0, Math.floor(isFinite(s) ? s : 0));
    const h = Math.floor(t / 3600);
    const m = Math.floor(t % 3600 / 60);
    const sec = t % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  // src/lib/fetch.js
  function fetchWithRetry(url, opts, retries = 3, delay = 1e3, timeout = 15e3) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const signal = opts?.signal ? void 0 : ctrl.signal;
    return fetch(url, signal ? { ...opts, signal } : opts).then((r) => {
      clearTimeout(timer);
      if (!r.ok) {
        const e = new Error(r.status);
        e.status = r.status;
        throw e;
      }
      return r;
    }).catch((err) => {
      clearTimeout(timer);
      const status = err?.status;
      const retriable = status == null || status >= 500 || status === 429;
      if (retries <= 0 || !retriable) throw err;
      return new Promise((res) => setTimeout(res, delay)).then(() => fetchWithRetry(url, opts, retries - 1, delay * 2, timeout));
    });
  }

  // src/data/episode-nav.js
  function getAdjacentEpisode(dir) {
    const all = Array.from(document.querySelectorAll(".episode a"));
    const idx = all.findIndex((a) => a.classList.contains("active"));
    if (idx === -1) return null;
    return dir === "next" ? all[idx + 1] ?? null : all[idx - 1] ?? null;
  }
  function getUrlForToken(token) {
    return fetchWithRetry(`/api/episode/serverPlayerAnimeWorld?alt=1&id=${token}`, { credentials: "same-origin" }).then((r) => r.text()).then((html) => {
      const m = html.match(/["']?file["']?\s*:\s*["']([^"']+)["']/i);
      return m ? m[1].replace(/\\\//g, "/") : null;
    }).catch(() => null);
  }

  // src/state/preload.js
  var _cleanup = null;
  var _preloadedToken = null;
  var _preloadedUrl = null;
  var _preloadedVideo = null;
  var getCleanup = () => _cleanup;
  var setCleanup = (fn) => {
    _cleanup = fn;
  };
  var getPreloadedToken = () => _preloadedToken;
  var setPreloadedToken = (t) => {
    _preloadedToken = t;
  };
  var getPreloadedUrl = () => _preloadedUrl;
  var setPreloadedUrl = (u) => {
    _preloadedUrl = u;
  };
  var getPreloadedVideo = () => _preloadedVideo;
  var setPreloadedVideo = (v) => {
    _preloadedVideo = v;
  };

  // src/player/seek-bar.js
  function buildSeekBar(video, withTip = false, onTimeUpdate = null) {
    const seekWrap = mk("div", "aw-np-seek-wrap"), seekTrack = mk("div", "aw-np-seek-track"), seekBuf = mk("div", "aw-np-seek-buf"), seekFill = mk("div", "aw-np-seek-fill"), seekThumb = mk("div", "aw-np-seek-thumb");
    let seekTip = null;
    if (withTip) {
      seekTip = mk("div", "aw-np-seek-tip");
      seekTrack.appendChild(seekTip);
    }
    seekTrack.append(seekBuf, seekFill, seekThumb);
    seekWrap.append(seekTrack);
    let seeking = false;
    const applySeek = (e) => {
      const r = seekTrack.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (video.duration) video.currentTime = p * video.duration;
      const pct = p * 100 + "%";
      seekFill.style.width = pct;
      seekThumb.style.left = pct;
    };
    seekWrap.addEventListener("pointerdown", (e) => {
      seeking = true;
      seekWrap.classList.add("seeking");
      seekWrap.setPointerCapture(e.pointerId);
      applySeek(e);
      e.preventDefault();
    });
    seekWrap.addEventListener("pointermove", (e) => {
      if (seeking) applySeek(e);
      if (seekTip) {
        const r = seekTrack.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        seekTip.textContent = fmt(p * (video.duration || 0));
        seekTip.style.left = p * 100 + "%";
        seekTip.style.visibility = "visible";
      }
    });
    if (seekTip) seekWrap.addEventListener("pointerleave", () => {
      seekTip.style.visibility = "hidden";
    });
    seekWrap.addEventListener("pointerup", () => {
      seeking = false;
      seekWrap.classList.remove("seeking");
    });
    seekWrap.addEventListener("pointercancel", () => {
      seeking = false;
      seekWrap.classList.remove("seeking");
    });
    let malSyncTriggered = false;
    video.addEventListener("loadedmetadata", () => {
      malSyncTriggered = false;
    });
    video.addEventListener("timeupdate", () => {
      if (seeking || !video.duration) return;
      const p = video.currentTime / video.duration * 100;
      seekFill.style.width = p + "%";
      seekThumb.style.left = p + "%";
      if (onTimeUpdate) onTimeUpdate();
      if (!malSyncTriggered && p >= 85) {
        malSyncTriggered = true;
        history.pushState({}, "", location.href);
      }
      if (!getPreloadedToken() && p >= PRELOAD_THRESHOLD * 100) {
        const nxt = getAdjacentEpisode("next");
        if (nxt) {
          setPreloadedToken(nxt.dataset.id);
          const _pTok = getPreloadedToken();
          getUrlForToken(_pTok).then((url) => {
            if (!url || !getCleanup() || getPreloadedToken() !== _pTok) return;
            document.querySelectorAll("video[data-aw-preload]").forEach((v) => {
              try {
                v.pause();
                v.src = "";
                v.remove();
              } catch (e) {
              }
            });
            setPreloadedUrl(url);
            const pv = document.createElement("video");
            pv.preload = "auto";
            pv.muted = true;
            pv.dataset.awPreload = "1";
            pv.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none";
            pv.src = url;
            document.body.appendChild(pv);
            pv.load();
            setPreloadedVideo(pv);
          });
        }
      }
    });
    video.addEventListener("progress", () => {
      if (!video.duration || !video.buffered.length) return;
      seekBuf.style.width = video.buffered.end(video.buffered.length - 1) / video.duration * 100 + "%";
    });
    return { seekWrap, seekFill, seekThumb, seekBuf, isSeeking: () => seeking };
  }

  // src/panels/panel-shell.js
  function buildPanelShell({ id, title, icon, iconClass, dot, bodyClass, closeAria, autoClose = true }) {
    const panel = el("div", null, { id });
    const barTitle = el("div", "aw-np-pn-title");
    if (dot) barTitle.append(el("span", "aw-np-pn-title-dot"));
    if (icon) {
      if (iconClass) barTitle.append(el("span", iconClass, { html: icon }));
      else barTitle.innerHTML = icon;
    }
    barTitle.append(el("span", null, { text: title }));
    const closeBtn = el("button", "aw-np-pn-close", {
      html: IC.close,
      attrs: closeAria ? { "aria-label": closeAria } : void 0,
      on: autoClose ? { click: (e) => {
        e.stopPropagation();
        panel.classList.remove("open");
      } } : void 0
    });
    const bar = el("div", "aw-np-pn-bar", { kids: [barTitle, closeBtn] });
    const body = el("div", bodyClass ? "aw-np-pn-body " + bodyClass : "aw-np-pn-body");
    const inner = el("div", "aw-np-pn-inner", { kids: [bar, body] });
    panel.append(inner);
    if (autoClose) panel.addEventListener("click", (e) => {
      if (e.target === panel) panel.classList.remove("open");
    });
    return { panel, inner, bar, body, closeBtn };
  }

  // src/panels/panel-rows.js
  var BTN_CTRL_STYLE = "background:var(--np-accent-state-1,rgba(255,255,255,.15));border:none;color:var(--np-accent-bg-fg,#fff);width:26px;height:26px;border-radius:var(--np-r-md);cursor:pointer;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0;";
  function mkSwitchRow(label, tip, isOn, onChange, extraStyle = "", stopProp = false, desc = "") {
    const row = document.createElement("div");
    row.className = "aw-np-pn-row";
    row.style.cssText = `position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;${extraStyle}`;
    const txt = document.createElement("div");
    txt.className = "np-row-txt";
    const lbl = document.createElement("span");
    lbl.className = "np-row-label";
    lbl.textContent = label;
    txt.append(lbl);
    if (desc) {
      const d = document.createElement("span");
      d.className = "np-row-desc";
      d.textContent = desc;
      txt.append(d);
    }
    const { label: sw, input: toggle } = mkSwitch(typeof isOn === "function" ? isOn() : isOn);
    toggle.addEventListener("change", (e) => {
      if (stopProp) e.stopPropagation();
      onChange(toggle.checked);
    });
    row.addEventListener("click", () => {
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event("change"));
    });
    sw.addEventListener("click", (e) => e.stopPropagation());
    row.append(txt, sw);
    if (!desc) {
      row.dataset.tip = "1";
      row.append(mkRowTip(tip));
    }
    row.classList.add("aw-np-arow");
    return { row, toggle };
  }
  function mkIconToggle(iconHtml, tip, isOn, onChange) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "aw-np-pn-icontog";
    btn.tabIndex = -1;
    btn.innerHTML = iconHtml;
    let on = typeof isOn === "function" ? isOn() : isOn;
    const paint = () => {
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    };
    paint();
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      on = !on;
      paint();
      onChange(on);
    });
    if (tip) {
      btn.dataset.tip = "1";
      btn.append(mkRowTip(tip));
    }
    return { btn, set: (v) => {
      on = v;
      paint();
    }, get: () => on };
  }
  function mkStepRow(label, tipText, val, setVal, step, fmtFn, BTN_CTRL_STYLE2, desc = "") {
    const row = document.createElement("div");
    row.style.cssText = "position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;user-select:none;";
    const valEl = document.createElement("span");
    valEl.style.cssText = "min-width:44px;text-align:center;font-weight:500;";
    const upd = () => valEl.textContent = fmtFn(val());
    const bM = document.createElement("button");
    bM.textContent = "−";
    bM.style.cssText = BTN_CTRL_STYLE2;
    bM.tabIndex = -1;
    const bP = document.createElement("button");
    bP.textContent = "+";
    bP.style.cssText = BTN_CTRL_STYLE2;
    bP.tabIndex = -1;
    bM.addEventListener("click", (e) => {
      e.stopPropagation();
      setVal(-step);
      upd();
    });
    bP.addEventListener("click", (e) => {
      e.stopPropagation();
      setVal(+step);
      upd();
    });
    const ctrl = document.createElement("div");
    ctrl.style.cssText = "display:flex;align-items:center;gap:6px;flex-shrink:0;";
    ctrl.append(bM, valEl, bP);
    const txt = document.createElement("div");
    txt.className = "np-row-txt";
    const lbl = document.createElement("span");
    lbl.className = "np-row-label";
    lbl.textContent = label;
    txt.append(lbl);
    if (desc) {
      const d = document.createElement("span");
      d.className = "np-row-desc";
      d.textContent = desc;
      txt.append(d);
    }
    row.append(txt, ctrl);
    if (!desc) {
      row.dataset.tip = "1";
      row.append(mkRowTip(tipText));
    }
    row.classList.add("aw-np-arow");
    upd();
    return { row, update: upd };
  }

  // src/core/prefs.js
  var loadMailState = () => {
    try {
      return JSON.parse(lsGet(KEY_MAIL_STATE) || "{}");
    } catch {
      return {};
    }
  };
  var saveMailState = (st) => lsSet(KEY_MAIL_STATE, JSON.stringify(st));
  var colorKey = () => isColorGlobalOn() ? KEY_COLOR : KEY_COLOR + ":" + (animeId() || "unknown");
  var loadColor = () => lsGet(colorKey()) || "#ffffff";
  var loadSeekSecs = () => {
    const v = parseInt(lsGet(pKey(KEY_SEEK_SECS)) ?? String(SEEK_DEFAULT), 10);
    return isNaN(v) ? SEEK_DEFAULT : Math.max(SEEK_MIN, Math.min(SEEK_MAX, v));
  };
  var loadUiScale = () => {
    const v = parseFloat(lsGet(KEY_UI_SCALE) ?? String(UISCALE_DEFAULT));
    return isNaN(v) ? UISCALE_DEFAULT : Math.max(UISCALE_MIN, Math.min(UISCALE_MAX, v));
  };

  // src/panels/settings-panel.js
  function buildSettingsPanel(video, seekTip, onSpeedChange = null, onClose = null) {
    const { panel: settingsPanel, body } = buildPanelShell({ id: "aw-np-settings-panel", title: "Impostazioni", icon: IC.settings });
    const { row: resumeRow, toggle: resumeToggle } = mkSwitchRow("Ripresa automatica", "", isResumeOn(), (v) => lsSet(pKey(KEY_RESUME_ENABLE), v ? "1" : "0"), "", false, "Riprende dall'ultima interruzione.");
    const { row: autoEpRow, toggle: autoEpToggle } = mkSwitchRow("Episodio automatico", "", isAutoEpOn(), (v) => lsSet(pKey(KEY_AUTOEP_ENABLE), v ? "1" : "0"), "", false, "Riapre l'ultimo episodio visto.");
    const { row: autoPlayRow, toggle: autoPlayToggle } = mkSwitchRow("Autoplay", "", isAutoPlayOn(), (v) => lsSet(pKey(KEY_AUTOPLAY_ENABLE), v ? "1" : "0"), "", false, "Avvio automatico in fullscreen.");
    const { row: connMonitorRow, toggle: connMonitorToggle } = mkSwitchRow("Monitor connessione", "", isConnMonitorOn(), (v) => lsSet(KEY_CONN_MONITOR, v ? "1" : "0"), "", false, "Avvisi sulla qualità di rete.");
    let seekSecs = loadSeekSecs();
    const { row: seekRow, update: updateSeekVal } = mkStepRow("Salto", "", () => seekSecs, (d) => {
      if (seekSecs + d < SEEK_MIN || seekSecs + d > SEEK_MAX) return;
      seekSecs += d;
      lsSet(pKey(KEY_SEEK_SECS), String(seekSecs));
    }, SEEK_STEP, (v) => String(v).padStart(2, "0") + " s", BTN_CTRL_STYLE, "Secondi saltati avanti/indietro.");
    let speedVal = loadSpeed();
    const { row: speedRow, update: updateSpeedVal } = mkStepRow("Velocità", "", () => speedVal, (d) => {
      const nv = Math.round((speedVal + d) * 100) / 100;
      if (nv < SPEED_MIN || nv > SPEED_MAX) return;
      speedVal = nv;
      lsSet(pKey(KEY_SPEED), String(speedVal));
      if (video.readyState > 0) video.playbackRate = speedVal;
      if (onSpeedChange) onSpeedChange(speedVal);
    }, SPEED_STEP, fmtSpeed, BTN_CTRL_STYLE, "Velocità di riproduzione.");
    const reloadSeek = () => {
      seekSecs = loadSeekSecs();
      updateSeekVal();
    };
    const reloadSpeed = () => {
      speedVal = loadSpeed();
      updateSpeedVal();
      if (video.readyState > 0) video.playbackRate = speedVal;
    };
    const skipSec = el("div", "aw-np-pn-sec");
    const { row: skMasterRow, toggle: skMasterToggle } = mkSwitchRow("Skip Intelligente", "", isSkipOn(), (v) => lsSet(KEY_SKIP_ENABLE, v ? "1" : "0"), "", false, "Sperimentale, database incompleto.");
    const skipGrid = el("div", "aw-np-pn-grid");
    const { row: skSkipRow, toggle: skSkipToggle } = mkSwitchRow("Auto-skip", "", isAutoSkipOn(), (v) => lsSet(KEY_SKIP_AUTO, v ? "1" : "0"), "", false, "Salto segmenti automatico.");
    const { row: skNextRow, toggle: skNextToggle } = mkSwitchRow("Auto-next", "", isAutoNextOn(), (v) => lsSet(KEY_SKIP_NEXT, v ? "1" : "0"), "", false, "Episodio successivo automatico.");
    const { row: skOpRow, toggle: skOpToggle } = mkSwitchRow("Opening", "", isOpeningOn(), (v) => lsSet(KEY_SKIP_OP, v ? "1" : "0"), "", false, "Salta la sigla iniziale.");
    const { row: skEdRow, toggle: skEdToggle } = mkSwitchRow("Ending", "", isEndingOn(), (v) => lsSet(KEY_SKIP_ED, v ? "1" : "0"), "", false, "Salta la sigla finale.");
    const { btn: skAwakeBtn, set: setAwakeBtn } = mkIconToggle(IC.moon, "Identifica i colpi di sonno e sospende auto-next.", isAwakeGuardOn(), (v) => lsSet(KEY_SKIP_AWAKE, v ? "1" : "0"));
    skNextRow.insertBefore(skAwakeBtn, skNextRow.lastElementChild);
    skipGrid.append(skSkipRow, skNextRow, skOpRow, skEdRow);
    const skSubToggles = [skSkipToggle, skNextToggle, skOpToggle, skEdToggle];
    const syncAwakeDep = () => {
      const on = skNextToggle.checked && !skNextToggle.disabled;
      skAwakeBtn.classList.toggle("dep-off", !on);
      skAwakeBtn.disabled = !on;
    };
    const syncSkipEnabled = () => {
      const on = skMasterToggle.checked;
      skipGrid.classList.toggle("disabled", !on);
      skSubToggles.forEach((t) => {
        t.disabled = !on;
      });
      syncAwakeDep();
    };
    skNextToggle.addEventListener("change", syncAwakeDep);
    skMasterToggle.addEventListener("change", syncSkipEnabled);
    syncSkipEnabled();
    skipSec.append(skMasterRow, skipGrid);
    const { row: globalRow, toggle: globalToggle } = mkSwitchRow("Globale", "", isGlobalOn(), (v) => {
      lsSet(KEY_GLOBAL, v ? "1" : "0");
      resumeToggle.checked = isResumeOn();
      autoEpToggle.checked = isAutoEpOn();
      autoPlayToggle.checked = isAutoPlayOn();
      reloadSeek();
      reloadSpeed();
    }, "", false, "Applica a tutte le serie.");
    globalRow.dataset.tip = "1";
    const globalSec = el("div", "aw-np-pn-global", { kids: [globalRow] });
    const cols = el("div", "aw-np-pn-cols");
    const colL = el("div", "aw-np-pn-col", { kids: [resumeRow, autoEpRow, autoPlayRow] });
    const colDiv = el("div", "aw-np-pn-divider");
    const colR = el("div", "aw-np-pn-col", { kids: [seekRow, speedRow, connMonitorRow] });
    cols.append(colL, colDiv, colR);
    body.append(globalSec, cols, skipSec);
    return { settingsPanel, resumeToggle, autoEpToggle, autoPlayToggle, connMonitorToggle, globalToggle, skMasterToggle, skSkipToggle, skNextToggle, skOpToggle, skEdToggle, seekSecs: () => seekSecs, speedVal: () => speedVal, updateSeekVal, updateSpeedVal, reloadSeek, reloadSpeed };
  }

  // src/state/color-apply.js
  function applyColor(hex, wrap, dotEl) {
    if (wrap) {
      wrap.style.setProperty("--np-accent", hex);
      wrap.style.setProperty("--np-accent-bg", `color-mix(in srgb, ${hex} 30%, #282828)`);
      wrap.style.setProperty("--np-accent-bg-fg", `color-mix(in srgb, #ffffff 78%, ${hex})`);
      wrap.style.setProperty("--np-accent-state-1", `color-mix(in srgb, ${hex} 14%, transparent)`);
      wrap.style.setProperty("--np-accent-state-2", `color-mix(in srgb, ${hex} 22%, transparent)`);
      wrap.style.setProperty("--np-accent-dim", `color-mix(in srgb, #ffffff 60%, ${hex})`);
    }
    if (dotEl) dotEl.style.background = hex;
    try {
      if (typeof document !== "undefined" && typeof CustomEvent === "function") {
        document.dispatchEvent(new CustomEvent("aw-np-accent-changed", { detail: { hex } }));
      }
    } catch {
    }
  }

  // src/styles/panel-scale.js
  var applyUiScale = (wrap, s) => {
    if (wrap) wrap.style.setProperty("--ui-scale", String(s));
  };
  var PANEL_NATIVE_W = 650;
  var PANEL_NATIVE_H = 440;
  var PANEL_NATIVE_W_M = 650;
  var PANEL_NATIVE_H_M = 490;
  var MAIL_NATIVE_W = 720;
  var MAIL_NATIVE_H = 480;
  var MAIL_NATIVE_W_M = 720;
  var MAIL_NATIVE_H_M = 560;
  var fitScale = (pw, ph, nw, nh, tW, tH, smin, smax) => {
    let s = Math.min(pw * tW / nw, ph * tH / nh);
    return Math.max(smin, Math.min(s, smax));
  };
  var CHROME_MIN_M = 0.65;
  var CHROME_REF_M = 365;
  var CHROME_MAX_M = 1;
  var FS_CHROME_PORT = 0.91;
  var FS_CHROME_LAND = 0.86;
  var computePanelScale = (pw, ph, isMobile2, uiScale = 1, cw = pw, ch = ph, isFs = false) => {
    const nw = isMobile2 ? PANEL_NATIVE_W_M : PANEL_NATIVE_W, nh = isMobile2 ? PANEL_NATIVE_H_M : PANEL_NATIVE_H;
    const mw = isMobile2 ? MAIL_NATIVE_W_M : MAIL_NATIVE_W, mh = isMobile2 ? MAIL_NATIVE_H_M : MAIL_NATIVE_H;
    const tW = isMobile2 ? 0.92 : 0.7, tH = isMobile2 ? 0.9 : 0.86;
    const smin = isMobile2 ? 0.5 : 0.78, smax = isMobile2 ? 1.35 : 1.42;
    const capW = pw * 0.98, capH = ph * 0.98;
    const scaled = (w, h) => {
      const base = fitScale(pw, ph, w, h, tW, tH, smin, smax);
      const cap = Math.min(capW / w, capH / h);
      return Math.min(Math.max(base * uiScale, smin * 0.5), cap);
    };
    const pn = scaled(nw, nh), mb = scaled(mw, mh);
    const chrome = !isMobile2 ? pn : isFs ? pw > ph ? FS_CHROME_LAND : FS_CHROME_PORT : Math.max(CHROME_MIN_M, Math.min(Math.sqrt(cw * ch) / CHROME_REF_M, CHROME_MAX_M));
    return { pn, mb, chrome };
  };
  var applyPanelScale = (wrap, isMobile2, uiScale = 1) => {
    if (!wrap) return;
    const pw = wrap.clientWidth, ph = wrap.clientHeight;
    const v = wrap.querySelector("#aw-np-video");
    const ar = v && v.videoWidth > 0 && v.videoHeight > 0 ? v.videoWidth / v.videoHeight : 16 / 9;
    let cw = pw, ch = ph;
    if (pw && ph) {
      if (pw / ph > ar) {
        ch = ph;
        cw = ch * ar;
      } else {
        cw = pw;
        ch = cw / ar;
      }
    }
    wrap.style.setProperty("--np-lb-y", Math.max(0, (ph - ch) / 2).toFixed(1) + "px");
    const isFs = document.fullscreenElement === wrap || wrap.classList.contains("fs");
    const s = computePanelScale(pw, ph, isMobile2, uiScale, cw, ch, isFs);
    wrap.style.setProperty("--pn-scale", s.pn.toFixed(3));
    wrap.style.setProperty("--mb-scale", s.mb.toFixed(3));
    wrap.style.setProperty("--np-chrome-scale", s.chrome.toFixed(3));
  };

  // src/state/custom-colors.js
  var CUSTOM_COLORS_MAX = 9;
  var loadCustomColors = () => {
    try {
      const a = JSON.parse(lsGet(KEY_CUSTOM_COLORS) || "[]");
      return Array.isArray(a) ? a.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, CUSTOM_COLORS_MAX) : [];
    } catch (e) {
      return [];
    }
  };
  var saveCustomColors = (arr) => lsSet(KEY_CUSTOM_COLORS, JSON.stringify(arr.slice(0, CUSTOM_COLORS_MAX)));
  var addCustomColor = (hex) => {
    hex = hex.toLowerCase();
    let arr = loadCustomColors().filter((c) => c.toLowerCase() !== hex);
    arr.unshift(hex);
    arr = arr.slice(0, CUSTOM_COLORS_MAX);
    saveCustomColors(arr);
    return arr;
  };

  // src/panels/color-panel.js
  var HEX6 = /^#[0-9a-fA-F]{6}$/i;
  function buildColorPanel(wrap, dotEl) {
    const { panel: colorPanel, body } = buildPanelShell({ id: "aw-np-color-panel", title: "Aspetto", icon: IC.palette });
    const swatchWrap = el("div", "aw-np-arow", { id: "aw-np-color-swatches" });
    let currentColor = loadColor();
    const getDot = () => dotEl || wrap.querySelector("#aw-np-dot");
    const customInput = document.createElement("input"), customPreview = document.createElement("div");
    const isPaletteColor = (hex) => PALETTE.some((p) => p.hex.toLowerCase() === String(hex).toLowerCase());
    const syncCustomInput = (hex) => {
      const custom = !isPaletteColor(hex);
      customInput.value = custom ? hex : "";
      customPreview.style.background = custom ? hex : "transparent";
      customPreview.classList.toggle("empty", !custom);
    };
    let slotStrip = null;
    const updateSwatches = (c) => {
      swatchWrap.querySelectorAll(".np-swatch").forEach((s) => s.classList.toggle("active", s.dataset.hex === c));
      if (slotStrip) slotStrip.querySelectorAll(".np-swatch").forEach((s) => s.classList.toggle("active", s.dataset.hex === c));
    };
    const setColor = (hex) => {
      currentColor = hex;
      lsSet(colorKey(), hex);
      applyColor(hex, wrap, getDot());
      syncCustomInput(hex);
      updateSwatches(hex);
    };
    const applyCustomColor = () => {
      let val = customInput.value.trim();
      if (!val.startsWith("#")) val = "#" + val;
      if (!HEX6.test(val)) {
        syncCustomInput(currentColor);
        return;
      }
      setColor(val.toLowerCase());
    };
    syncCustomInput(currentColor);
    PALETTE.forEach(({ name, hex }) => {
      const sw = el("div", "np-swatch" + (hex === currentColor ? " active" : ""), {
        style: { background: hex },
        on: { click: (e) => {
          e.stopPropagation();
          setColor(hex);
        } }
      });
      sw.dataset.hex = hex;
      sw.title = name;
      swatchWrap.appendChild(sw);
    });
    const customRow = el("div", "aw-np-color-custom aw-np-arow", {
      on: { click: (e) => e.stopPropagation() }
    });
    const customLabel = el("span", "aw-np-color-custom-lbl", { text: "Custom" });
    customPreview.className = "aw-np-color-custom-prev";
    customInput.type = "text";
    customInput.maxLength = 7;
    customInput.placeholder = "es. #1565c0";
    customInput.spellcheck = false;
    customInput.className = "aw-np-color-custom-input";
    customInput.addEventListener("input", () => {
      let v = customInput.value.trim();
      if (!v.startsWith("#")) v = "#" + v;
      if (HEX6.test(v)) customPreview.style.background = v;
    });
    let _applyingCustom = false;
    customInput.addEventListener("blur", () => {
      if (!_applyingCustom) applyCustomColor();
    });
    customInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        _applyingCustom = true;
        applyCustomColor();
        customInput.blur();
        _applyingCustom = false;
      }
      if (e.key === "Escape") {
        syncCustomInput(currentColor);
        customInput.blur();
      }
    });
    customInput.addEventListener("click", (e) => e.stopPropagation());
    customInput.addEventListener("focus", () => customInput.select());
    slotStrip = el("div", "aw-np-color-slots");
    const renderSlots = () => {
      slotStrip.innerHTML = "";
      const saved = loadCustomColors();
      for (let i = 0; i < CUSTOM_COLORS_MAX; i++) {
        const hex = saved[i];
        let sw;
        if (hex) {
          sw = el("div", "np-swatch np-swatch-slot" + (hex === currentColor ? " active" : ""), {
            style: { background: hex },
            on: { click: (e) => {
              e.stopPropagation();
              setColor(hex);
            } }
          });
          sw.dataset.hex = hex;
          sw.title = hex;
        } else {
          sw = el("div", "np-swatch-slot np-swatch-empty");
        }
        slotStrip.appendChild(sw);
      }
    };
    const btnCol = el("div", "aw-np-color-custom-btns");
    const btnSave = el("button", "aw-np-color-custom-btn", { text: "+" });
    btnSave.title = "Salva colore";
    btnSave.tabIndex = -1;
    const btnReset = el("button", "aw-np-color-custom-btn", { html: IC.undo });
    btnReset.title = "Azzera salvati";
    btnReset.tabIndex = -1;
    btnSave.addEventListener("click", (e) => {
      e.stopPropagation();
      let v = customInput.value.trim();
      if (!v.startsWith("#")) v = "#" + v;
      if (!HEX6.test(v)) return;
      addCustomColor(v.toLowerCase());
      renderSlots();
    });
    btnReset.addEventListener("click", (e) => {
      e.stopPropagation();
      saveCustomColors([]);
      renderSlots();
    });
    btnCol.append(btnSave, btnReset);
    customRow.append(customLabel, customInput, customPreview, btnCol, slotStrip);
    const colorSec = el("div", "aw-np-pn-colorsec", { kids: [swatchWrap, customRow] });
    renderSlots();
    const { row: topColorRow, toggle: topColorToggle } = mkSwitchRow("Top bar colorata", "", isTopColorOn, (v) => {
      lsSet(KEY_TOP_COLOR, v ? "1" : "0");
      wrap.classList.toggle("accent-top", v);
    }, "", true, "Colora la barra superiore.");
    const { row: iconColorRow, toggle: iconColorToggle } = mkSwitchRow("Icone colorate", "", isIconColorOn, (v) => {
      lsSet(KEY_ICON_COLOR, v ? "1" : "0");
      wrap.classList.toggle("accent-icons", v);
    }, "", true, "Colora le icone del player.");
    const { row: flashRow, toggle: flashToggle } = mkSwitchRow("Flash centrali", "", isFlashOn, (v) => {
      lsSet(KEY_FLASH_ENABLE, v ? "1" : "0");
    }, "", true, "Icona animata al centro a ogni comando.");
    const { row: clockRow, toggle: clockToggle } = mkSwitchRow("Orologio", "", isClockOn, (v) => {
      lsSet(KEY_CLOCK, v ? "1" : "0");
      wrap.classList.toggle("clock-hidden", !v);
    }, "", true, "Ora corrente, in alto a destra.");
    const { row: speedPopupRow, toggle: speedPopupToggle } = mkSwitchRow("Popup velocità", "", isSpeedPopupOn, (v) => {
      lsSet(KEY_SPEED_POPUP, v ? "1" : "0");
      wrap.classList.toggle("speed-popup-hidden", !v);
    }, "", true, "Velocità attuale, in alto a sinistra.");
    let uiScale = loadUiScale();
    const { row: uiScaleRow, update: updateUiScale } = mkStepRow("Scala UI", "", () => uiScale, (d) => {
      const nv = Math.round((uiScale + d) * 100) / 100;
      if (nv < UISCALE_MIN || nv > UISCALE_MAX) return;
      uiScale = nv;
      lsSet(KEY_UI_SCALE, String(uiScale));
      applyUiScale(wrap, uiScale);
      applyPanelScale(wrap, isMobile, uiScale);
    }, UISCALE_STEP, (v) => Math.round(v * 100) + "%", BTN_CTRL_STYLE, "Dimensione di tutti gli elementi.");
    const { row: colorGlobalRow, toggle: colorGlobalToggle } = mkSwitchRow("Globale", "", isColorGlobalOn, (v) => {
      lsSet(KEY_COLOR_GLOBAL, v ? "1" : "0");
      currentColor = loadColor();
      applyColor(currentColor, wrap, getDot());
      syncCustomInput(currentColor);
      updateSwatches(currentColor);
    }, "", true, "Applica a tutte le serie.");
    colorGlobalRow.id = "aw-np-color-global";
    const globalSec = el("div", "aw-np-pn-global", { kids: [colorGlobalRow] });
    const colL = el("div", "aw-np-pn-col", { kids: [topColorRow, iconColorRow, flashRow] });
    const colDiv = el("div", "aw-np-pn-divider");
    const colR = el("div", "aw-np-pn-col", { kids: [clockRow, speedPopupRow, uiScaleRow] });
    const cols = el("div", "aw-np-pn-cols", { kids: [colL, colDiv, colR] });
    body.append(globalSec, colorSec, cols);
    if (isIconColorOn()) wrap.classList.add("accent-icons");
    if (isTopColorOn()) wrap.classList.add("accent-top");
    if (!isClockOn()) wrap.classList.add("clock-hidden");
    if (!isSpeedPopupOn()) wrap.classList.add("speed-popup-hidden");
    return { colorPanel, swatchWrap, currentColor: () => currentColor, setCurrentColor: (c) => {
      currentColor = c;
    }, syncCustomInput, updateSwatches, topColorToggle, iconColorToggle, flashToggle, clockToggle, speedPopupToggle, colorGlobalToggle };
  }

  // src/data/page-meta.js
  var getMalId = () => {
    try {
      const a = document.querySelector('a.watchlist-edit-mal[href*="myanimelist.net/anime/"],a[href*="myanimelist.net/anime/"]');
      const m = a && a.getAttribute("href")?.match(/myanimelist\.net\/anime\/(\d+)/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  };
  var getEpisodeNum = () => {
    try {
      const a = document.querySelector(".episode a.active[data-episode-num],.episodes a.active[data-episode-num],a.active[data-episode-num]");
      const n = a && (a.dataset.episodeNum || a.dataset.num);
      if (n && /^\d+$/.test(n)) return n;
      const m = (document.title || "").match(/Episodio\s+(\d+)/i);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  };
  var getSeriesName = () => {
    try {
      return document.querySelector("h1.title, .title-1")?.textContent?.trim() || document.title.split(" Episodio")[0] || "";
    } catch {
      return "";
    }
  };
  var getAudioType = () => {
    try {
      const link = document.querySelector('a[href*="filter?language="]');
      if (link) {
        const code = (link.getAttribute("href").match(/language=([a-z-]+)/i) || [])[1];
        if (code) return /^it/i.test(code) ? "dub" : "sub";
        const txt = (link.textContent || "").trim().toLowerCase();
        if (txt) return /^it|ital/.test(txt) ? "dub" : "sub";
      }
      const nodes = document.querySelectorAll("dt,dd,span,div,li");
      for (const n of nodes) {
        const t = (n.textContent || "").trim();
        const m = t.match(/^Audio:?\s*([A-Za-z][A-Za-z ]+)$/i);
        if (m) {
          return /ital/i.test(m[1]) ? "dub" : "sub";
        }
      }
    } catch {
    }
    return "unknown";
  };

  // src/widgets/topbar.js
  function buildTopBar(wrap, colorPanel) {
    const topBar = el("div", "np-ui-layer", { id: "aw-np-top" });
    const topLeft = mk("div", "aw-np-top-left"), topRight = mk("div", "aw-np-top-right");
    const titleEl = mk("div", "aw-np-title"), epInfoEl = mk("div", "aw-np-epinfo"), dotEl = mk("div", "aw-np-dot");
    const kbdBtn = el("div", null, { id: "aw-np-kbd-btn", attrs: { "aria-label": "Hotkey" }, kids: [el("span", "aw-np-kbd-letter", { text: "A" })] });
    const browserBtn = el("div", null, { id: "aw-np-browser-btn", html: IC.browser, attrs: { "aria-label": "Homepage" } });
    const reportBtn = el("div", null, { id: "aw-np-report-btn", html: IC.warning, attrs: { "aria-label": "Segnala problema" } });
    const mailBtn = el("div", null, { id: "aw-np-mail-btn", html: IC.mail + '<span class="aw-np-mail-badge"></span>', attrs: { "aria-label": "Mail" } });
    const brandEl = el("div", null, { id: "aw-np-brand", text: "AW Better Player" });
    const dotBtn = el("div", null, { id: "aw-np-dot-btn", attrs: { "aria-label": "Aspetto" }, kids: [dotEl] });
    const topActions = el("div", null, { id: "aw-np-top-actions", kids: [browserBtn, reportBtn, mailBtn, kbdBtn, dotBtn] });
    if (!isMobile) {
      browserBtn.appendChild(el("span", "np-tip", { text: "Homepage" }));
      reportBtn.appendChild(el("span", "np-tip", { text: "Segnala problema" }));
      mailBtn.appendChild(el("span", "np-tip", { text: "Mail" }));
      kbdBtn.appendChild(el("span", "np-tip", { text: "Hotkey" }));
      dotBtn.appendChild(el("span", "np-tip", { text: "Aspetto" }));
    }
    const allEps = Array.from(document.querySelectorAll(".episode a"));
    const epIdx = allEps.findIndex((a) => a.classList.contains("active"));
    const activeEp = epIdx !== -1 ? allEps[epIdx] : null;
    const epNum = activeEp ? activeEp.textContent.trim() || String(epIdx + 1) : "?";
    const epMaxNum = allEps.reduce((m, a) => {
      const n = parseFloat(a.textContent.trim());
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    titleEl.textContent = getSeriesName();
    epInfoEl.textContent = `Episodio ${epNum}/${epMaxNum > 0 ? String(epMaxNum) : allEps.length || "?"}`;
    topLeft.append(titleEl, epInfoEl);
    topRight.append(brandEl, topActions);
    topBar.append(topLeft, topRight);
    return { topBar, dotEl, dotBtn, kbdBtn, browserBtn, reportBtn, mailBtn, titleEl, epInfoEl };
  }

  // src/data/skip-db.js
  var AUTOSKIP_RAW = "https://raw.githubusercontent.com/KeyMan98/Animeworld-Better-Player/main/autoskip";
  var MIN_PART_S = 1;
  function computeSkipParts(start, end, coverStart, coverEnd) {
    const simple = [{ start, end }];
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return simple;
    const cs = Number(coverStart), ce = Number(coverEnd);
    const inSigla = (v) => Number.isFinite(v) && v >= start && v <= end;
    const csIn = inSigla(cs), ceIn = inSigla(ce);
    let parts;
    if (csIn && ceIn) {
      if (ce <= cs) return simple;
      parts = [{ start, end: cs }, { start: ce, end }];
    } else if (csIn) parts = [{ start, end: cs }];
    else if (ceIn) parts = [{ start: ce, end }];
    else return simple;
    return parts.filter((p) => p.end - p.start >= MIN_PART_S);
  }
  function normSeg(s) {
    if (!s || s.none) return null;
    const start = Number(s.start), end = Number(s.end);
    return {
      start,
      end,
      parts: computeSkipParts(start, end, s.coverStart, s.coverEnd),
      conf: Number(s.conf) || 0,
      manual: !!s.manual
    };
  }
  function fetchSkipDb(malId, audio) {
    const au = audio === "dub" || audio === "sub" ? audio : "sub";
    const url = `${AUTOSKIP_RAW}/${au}/${malId}.json`;
    return fetch(url, { cache: "no-store" }).then((r) => {
      if (!r.ok) return { exists: false, episodes: {} };
      return r.json().then((d) => {
        const episodes = {};
        const e = d && d.episodes || {};
        for (const [k, v] of Object.entries(e)) {
          episodes[k] = { op: normSeg(v && v.op), ed: normSeg(v && v.ed) };
        }
        return { exists: true, episodes };
      }).catch(() => ({ exists: false, episodes: {} }));
    }).catch(() => ({ exists: false, episodes: {} }));
  }

  // src/data/report.js
  var canSendReport = () => {
    const last = parseFloat(lsGet(KEY_REPORT_LAST_TS) ?? "0");
    return !last || Date.now() - last >= REPORT_HEARTBEAT_MS;
  };
  var reportCooldownLeft = () => {
    const last = parseFloat(lsGet(KEY_REPORT_LAST_TS) ?? "0");
    return last ? Math.max(0, REPORT_HEARTBEAT_MS - (Date.now() - last)) : 0;
  };
  function checkAutoskipDb(malId, audio) {
    return fetchSkipDb(malId, audio).then((db) => {
      if (!db.exists) return { exists: false, present: [], ep: {}, manual: {} };
      const present = [], ep = {}, manual = {};
      for (const [k, v] of Object.entries(db.episodes)) {
        const hasOp = !!v.op, hasEd = !!v.ed;
        if (hasOp || hasEd) present.push(parseInt(k, 10));
        ep[k] = { op: hasOp, ed: hasEd };
        manual[k] = { op: !!(v.op && v.op.manual), ed: !!(v.ed && v.ed.manual) };
      }
      present.sort((a, b) => a - b);
      return { exists: true, present, ep, manual };
    });
  }
  function sendReport(segment, issue, scope, deferCooldown) {
    try {
      if (!deferCooldown && !canSendReport()) return false;
      const malId = getMalId(), ep = getEpisodeNum();
      if (!malId || !ep) return false;
      if (!deferCooldown) lsSet(KEY_REPORT_LAST_TS, String(Date.now()));
      const body = JSON.stringify({ malId, ep, seriesName: getSeriesName(), audio: getAudioType(), scope: scope || "episode", segment, issue, v: SCRIPT_VERSION, ts: Date.now() });
      fetch(WORKER_BASE + "/report", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {
      });
      return true;
    } catch {
      return false;
    }
  }
  function fetchMessages() {
    return fetch(WORKER_BASE + "/messages").then((r) => r.ok ? r.json() : null).then((d) => Array.isArray(d?.messages) ? d.messages : null).catch(() => null);
  }

  // src/panels/report-panel.js
  function buildReportPanel(wrap) {
    const REPORT_GH = "https://github.com/KeyMan98/Animeworld-Better-Player/issues/new";
    const REPORT_GF = "https://greasyfork.org/it/scripts/571464-animeworld-better-player/feedback";
    const REPORT_TG = "https://t.me/KeyMan98";
    const { panel: reportPanel, body: bodyWrap, closeBtn } = buildPanelShell({
      id: "aw-np-report-panel",
      title: "Segnala problema",
      icon: IC.warning,
      iconClass: "aw-np-pn-title-ic",
      closeAria: "Chiudi",
      bodyClass: "aw-np-rp-body",
      autoClose: false
    });
    const tabSkip = el("button", "aw-np-rp-tab", { text: "Autoskip" });
    const tabPlayer = el("button", "aw-np-rp-tab", { text: "Player" });
    const tabs = el("div", "aw-np-rp-tabs aw-np-arow", { kids: [tabSkip, tabPlayer] });
    const stage = el("div", "aw-np-rp-stage");
    const ISSUE_OPTS = [["missing", "Mancante"], ["misaligned", "Disallineato"], ["wrong_point", "Punto sbagliato"], ["false_positive", "Falso positivo"]];
    const SERIES_OPTS = [["series_missing", "Serie mancante"], ["incomplete", "Timestamp incompleti"], ["revision", "Revisione timestamp"]];
    const segLbl = el("span", "aw-np-rp-grouplbl", { text: "Episodio" });
    const subOp = el("button", "aw-np-rp-sub", { text: "Opening" });
    const subEd = el("button", "aw-np-rp-sub", { text: "Ending" });
    const segSel = el("div", "aw-np-rp-subsel", { kids: [subOp, subEd] });
    const segHead = el("div", "aw-np-rp-seghead aw-np-arow", { kids: [segLbl, segSel] });
    const segBtns = {};
    const segRow = el("div", "aw-np-rp-optrow aw-np-arow", {
      kids: ISSUE_OPTS.map(([k, t]) => {
        const b = el("button", "aw-np-rp-opt", { text: t });
        segBtns[k] = b;
        return b;
      })
    });
    const segMsgEl = el("div", "aw-np-rp-msg aw-np-arow");
    const gSeg = el("div", "aw-np-rp-group", { kids: [segHead, segRow, segMsgEl] });
    const srBtns = {};
    const srRow = el("div", "aw-np-rp-optrow aw-np-arow", {
      kids: SERIES_OPTS.map(([k, t]) => {
        const b = el("button", "aw-np-rp-opt", { text: t });
        srBtns[k] = b;
        return b;
      })
    });
    const srMsg = el("div", "aw-np-rp-msg aw-np-arow");
    const gSr = {
      group: el("div", "aw-np-rp-group", {
        kids: [el("div", "aw-np-rp-grouplbl aw-np-arow", { text: "Tutta la serie" }), srRow, srMsg]
      }),
      row: srRow,
      btns: srBtns,
      msg: srMsg
    };
    const privacy = el("div", "aw-np-rp-privacy aw-np-arow", { text: "Nessun dato personale o del dispositivo viene registrato." });
    const secSkip = el("div", "aw-np-rp-sec aw-np-rp-sec-skip", { kids: [gSeg, gSr.group, privacy] });
    const plTxt = el("div", "aw-np-rp-pl-txt aw-np-arow", { text: "GreasyFork non permette di offuscare il codice, quindi non è possibile creare una segnalazione crittografata che rispetti la privacy dell'utente." });
    const plTxt2 = el("div", "aw-np-rp-pl-txt2 aw-np-arow", { text: "Per questo tipo di segnalazione ti invito a contattarmi su:" });
    const plBtns = el("div", "aw-np-rp-pl-btns aw-np-arow", {
      kids: [["github", "GitHub", REPORT_GH], ["greasyfork", "GreasyFork", REPORT_GF], ["telegram", "Telegram", REPORT_TG]].map(([ic, txt, href]) => el("a", "aw-np-rp-extlink", { kids: [el("span", "aw-np-rp-extlink-ic", { html: IC[ic] }), el("span", null, { text: txt })], attrs: { href, target: "_blank", rel: "noopener" } }))
    });
    const secPlayer = el("div", "aw-np-rp-sec aw-np-rp-sec-player", { kids: [plTxt, plTxt2, plBtns] });
    stage.append(secSkip, secPlayer);
    const statusEl = el("div", "aw-np-rp-status");
    const bCancel = el("button", "aw-np-rp-cancel", { text: "Annulla" });
    const bSend = el("button", "aw-np-rp-send", { text: "Invia" });
    const footer = el("div", "aw-np-rp-footer aw-np-arow", { kids: [statusEl, bCancel, bSend] });
    bodyWrap.append(tabs, stage, footer);
    let sec = "skip";
    let pick = { op: null, ed: null, series: null };
    let subSeg = "op";
    let dbData = null, dbLoading = false, timer = null;
    const loadDb = () => {
      const malId = getMalId();
      if (!malId) {
        dbData = { exists: false, present: [], ep: {}, manual: {} };
        renderMsgs();
        return;
      }
      dbLoading = true;
      renderMsgs();
      checkAutoskipDb(malId, getAudioType()).then((res) => {
        dbData = res;
        dbLoading = false;
        renderMsgs();
      });
    };
    const segMsg = (segKey, issue) => {
      if (dbLoading) return ["idle", "Verifica nel database…"];
      if (!dbData) return ["idle", ""];
      const epNum = String(getEpisodeNum());
      const e = dbData.ep[epNum];
      const has = !!(e && e[segKey]);
      const isMan = !!(e && dbData.manual && dbData.manual[epNum] && dbData.manual[epNum][segKey]);
      if (isMan) return ["mod", "Segmento convalidato dal moderatore"];
      if (issue === "missing") {
        return has ? ["bad", "Il timestamp risulta presente, possibile contraddizione"] : ["good", "Nessun dato presente, segnalazione coerente"];
      }
      return has ? ["good", "Segnalazione coerente con il database"] : ["bad", "Nessun timestamp presente da correggere"];
    };
    const seriesMsg = (reason) => {
      if (dbLoading) return ["idle", "Verifica nel database…"];
      if (!dbData) return ["idle", ""];
      const present = (dbData.present || []).length > 0;
      if (reason === "series_missing") return present ? ["bad", "La serie risulta già presente nel database"] : ["good", "Nessun dato presente, segnalazione coerente"];
      if (reason === "incomplete") return present ? ["good", "Coerente con i dati parziali presenti"] : ["bad", "Nessun episodio presente nel database"];
      return present ? ["good", "Dati disponibili per la revisione"] : ["bad", "Nessun dato da revisionare"];
    };
    const setMsg = (elem, kind, txt) => {
      elem.className = "aw-np-rp-msg " + kind;
      elem.textContent = txt;
    };
    const renderMsgs = () => {
      if (pick[subSeg]) {
        const [kind, txt] = segMsg(subSeg, pick[subSeg]);
        setMsg(segMsgEl, kind, txt);
      } else setMsg(segMsgEl, "empty", "");
      if (pick.series) {
        const [kind, txt] = seriesMsg(pick.series);
        setMsg(gSr.msg, kind, txt);
      } else setMsg(gSr.msg, "empty", "");
    };
    const syncUi = () => {
      tabSkip.classList.toggle("sel", sec === "skip");
      tabPlayer.classList.toggle("sel", sec === "player");
      secSkip.classList.toggle("show", sec === "skip");
      secPlayer.classList.toggle("show", sec === "player");
      const seriesActive = !!pick.series;
      const segActive = !!(pick.op || pick.ed);
      gSeg.classList.toggle("dim", seriesActive);
      gSr.group.classList.toggle("dim", segActive);
      subOp.classList.toggle("sel", subSeg === "op");
      subEd.classList.toggle("sel", subSeg === "ed");
      subOp.classList.toggle("filled", !!pick.op);
      subEd.classList.toggle("filled", !!pick.ed);
      Object.entries(segBtns).forEach(([ik, b]) => b.classList.toggle("sel", pick[subSeg] === ik));
      Object.entries(gSr.btns).forEach(([ik, b]) => b.classList.toggle("sel", pick.series === ik));
      let ready = false;
      if (sec === "skip") ready = !!(pick.op || pick.ed || pick.series);
      footer.style.visibility = sec === "player" ? "hidden" : "visible";
      const left = reportCooldownLeft();
      if (left > 0) {
        bSend.disabled = true;
        statusEl.textContent = "Riprova tra " + Math.ceil(left / 1e3) + "s";
      } else {
        bSend.disabled = !ready;
        statusEl.textContent = "";
      }
      renderMsgs();
    };
    const tick = () => {
      if (!reportPanel.classList.contains("open")) {
        clearInterval(timer);
        timer = null;
        return;
      }
      syncUi();
    };
    tabSkip.addEventListener("click", () => {
      sec = "skip";
      if (!dbData && !dbLoading) loadDb();
      syncUi();
    });
    tabPlayer.addEventListener("click", () => {
      sec = "player";
      syncUi();
    });
    subOp.addEventListener("click", () => {
      subSeg = "op";
      syncUi();
    });
    subEd.addEventListener("click", () => {
      subSeg = "ed";
      syncUi();
    });
    Object.entries(segBtns).forEach(([ik, b]) => b.addEventListener("click", () => {
      if (gSeg.classList.contains("dim")) return;
      pick[subSeg] = pick[subSeg] === ik ? null : ik;
      if (pick[subSeg]) pick.series = null;
      syncUi();
    }));
    Object.entries(gSr.btns).forEach(([ik, b]) => b.addEventListener("click", () => {
      if (gSr.group.classList.contains("dim")) return;
      pick.series = pick.series === ik ? null : ik;
      if (pick.series) {
        pick.op = null;
        pick.ed = null;
      }
      syncUi();
    }));
    closeBtn.addEventListener("click", () => reportPanel.classList.remove("open"));
    bCancel.addEventListener("click", () => reportPanel.classList.remove("open"));
    bSend.addEventListener("click", () => {
      if (sec === "player") return;
      if (!canSendReport()) return;
      let ok = true, sent = 0;
      if (pick.series) {
        if (!sendReport(null, pick.series, "series", true)) ok = false;
        sent++;
      } else {
        if (pick.op) {
          if (!sendReport("op", pick.op, "episode", true)) ok = false;
          sent++;
        }
        if (pick.ed) {
          if (!sendReport("ed", pick.ed, "episode", true)) ok = false;
          sent++;
        }
      }
      if (!sent) return;
      lsSet(KEY_REPORT_LAST_TS, String(Date.now()));
      reportPanel.classList.remove("open");
      if (ok) flashToast(wrap, "Segnalazione inviata, grazie!");
    });
    const reset = () => {
      sec = "skip";
      pick = { op: null, ed: null, series: null };
      subSeg = "op";
      dbData = null;
      dbLoading = false;
      loadDb();
      syncUi();
      if (!timer) timer = setInterval(tick, 1e3);
    };
    const clearReportTimer = () => {
      clearInterval(timer);
      timer = null;
    };
    return { reportPanel, reset, clearReportTimer };
  }

  // src/panels/mail-panel.js
  function relDate(ts) {
    if (!isFinite(ts)) return "";
    const diff = Date.now() - ts, day = 864e5;
    if (diff < day && new Date(ts).getDate() === (/* @__PURE__ */ new Date()).getDate()) return "Oggi";
    if (diff < 2 * day) return "Ieri";
    if (diff < 7 * day) return Math.floor(diff / day) + " giorni fa";
    return new Date(ts).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: new Date(ts).getFullYear() !== (/* @__PURE__ */ new Date()).getFullYear() ? "numeric" : void 0 });
  }
  function buildMailPanel(hooks) {
    const mailPanel = el("div", null, { id: "aw-np-mail-panel" });
    const inner = el("div", "aw-np-mail-inner");
    const bar = el("div", "aw-np-mail-bar");
    const barTitle = el("div", "aw-np-mail-bar-title", { html: IC.mail + "<span>Mail</span>" });
    const btnClose = el("div", "aw-np-mail-iconbtn aw-np-mail-bar-close", { html: IC.close });
    bar.append(barTitle, btnClose);
    const body = el("div", "aw-np-mail-body");
    const listPane = el("div", "aw-np-mail-list-pane");
    const tabs = el("div", "aw-np-mail-tabs");
    const tabInboxCount = el("span", "aw-np-mail-tab-count");
    const tabInbox = el("button", "aw-np-mail-tab active", { kids: ["In arrivo", tabInboxCount] });
    const tabTrashCount = el("span", "aw-np-mail-tab-count");
    const tabTrash = el("button", "aw-np-mail-tab", { kids: ["Cestino", tabTrashCount] });
    tabs.append(tabInbox, tabTrash);
    const listView = el("div", "aw-np-mail-list");
    listPane.append(tabs, listView);
    const readPane = el("div", "aw-np-mail-read-pane");
    const readEmptyIc = el("div", "aw-np-mail-empty-ic", { html: IC.mail });
    const readEmptyTxt = el("div", null, { text: "Seleziona una comunicazione." });
    const readEmpty = el("div", "aw-np-mail-read-empty", { kids: [readEmptyIc, readEmptyTxt] });
    const readContent = el("div", "aw-np-mail-read-content", { style: { display: "none" } });
    readPane.append(readEmpty, readContent);
    body.append(listPane, readPane);
    inner.append(bar, body);
    mailPanel.appendChild(inner);
    let cached = [], onUnreadChange = null, selectedId = null, activeTab = "inbox", revealTimer = null;
    const computeUnread = () => {
      const st = loadMailState();
      return cached.some((m) => !st[m.id]?.deleted && !st[m.id]?.read);
    };
    const notifyUnread = () => {
      if (onUnreadChange) onUnreadChange(computeUnread());
    };
    function updateTabBadge() {
      const st = loadMailState();
      const trash = cached.filter((m) => st[m.id]?.deleted && !st[m.id]?.read).length;
      const unread = cached.filter((m) => !st[m.id]?.deleted && !st[m.id]?.read).length;
      tabTrashCount.textContent = trash > 0 ? trash : "";
      tabInboxCount.textContent = unread > 0 ? unread : "";
    }
    function switchTab(tab) {
      if (activeTab === tab) return;
      activeTab = tab;
      tabInbox.classList.toggle("active", tab === "inbox");
      tabTrash.classList.toggle("active", tab === "trash");
      selectedId = null;
      readContent.style.display = "none";
      readEmpty.style.display = "flex";
      renderList(true, 120);
    }
    tabInbox.addEventListener("click", () => switchTab("inbox"));
    tabTrash.addEventListener("click", () => switchTab("trash"));
    function renderList(animate, revealDelay = 0) {
      clearTimeout(revealTimer);
      revealTimer = null;
      const st = loadMailState();
      listView.innerHTML = "";
      const visible = cached.filter((m) => activeTab === "trash" ? !!st[m.id]?.deleted : !st[m.id]?.deleted);
      updateTabBadge();
      if (!visible.length) {
        const ic = el("div", "aw-np-mail-empty-ic", { html: activeTab === "trash" ? IC.trash : IC.mail });
        const txt = el("div", null, { text: activeTab === "trash" ? "Cestino vuoto." : "Nessuna comunicazione." });
        const empty = el("div", "aw-np-mail-empty", { kids: [ic, txt] });
        listView.appendChild(empty);
      } else {
        visible.forEach((m, i) => {
          const row = el("div", "aw-np-mail-row" + (st[m.id]?.read ? "" : " unread") + (m.id === selectedId ? " selected" : "") + (animate ? "" : " show"));
          if (animate) row.style.transitionDelay = Math.min(i, 7) * MAIL_STAGGER_STEP + "s";
          const dot = el("span", "aw-np-mail-dot");
          const subj = el("div", "aw-np-mail-subject", { text: m.subject });
          const date = el("div", "aw-np-mail-date", { text: relDate(m.created_at) });
          const col = el("div", "aw-np-mail-col", { kids: [subj, date] });
          const actionBtn = el("button", "aw-np-mail-iconbtn aw-np-mail-del");
          if (activeTab === "trash") {
            actionBtn.innerHTML = IC.restore;
            actionBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              const s = loadMailState();
              s[m.id] = { ...s[m.id], deleted: false };
              saveMailState(s);
              if (selectedId === m.id) clearSelection();
              else renderList();
              notifyUnread();
            });
          } else {
            actionBtn.innerHTML = IC.trash;
            actionBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              const s = loadMailState();
              s[m.id] = { ...s[m.id], deleted: true };
              saveMailState(s);
              if (selectedId === m.id) clearSelection();
              else renderList();
              notifyUnread();
            });
          }
          row.append(dot, col, actionBtn);
          row.addEventListener("click", () => {
            if (selectedId === m.id) clearSelection();
            else selectMessage(m);
          });
          listView.appendChild(row);
        });
        if (animate) {
          const reveal = () => {
            revealTimer = null;
            listView.querySelectorAll(".aw-np-mail-row").forEach((r, idx) => {
              r.style.transitionDelay = Math.min(idx * MAIL_REVEAL_STEP, MAIL_REVEAL_CAP) + "s";
              r.classList.add("show");
            });
          };
          if (revealDelay > 0) revealTimer = setTimeout(() => requestAnimationFrame(reveal), revealDelay);
          else requestAnimationFrame(() => requestAnimationFrame(reveal));
        }
      }
    }
    function clearSelection() {
      selectedId = null;
      readContent.style.display = "none";
      readEmpty.style.display = "flex";
      renderList();
    }
    function selectMessage(m) {
      selectedId = m.id;
      if (activeTab !== "trash") {
        const st = loadMailState();
        st[m.id] = { ...st[m.id], read: true };
        saveMailState(st);
        notifyUnread();
      }
      renderList();
      readContent.innerHTML = "";
      const subj = el("div", "aw-np-mail-d-subject", { text: m.subject });
      const date = el("span", "aw-np-mail-d-date", { text: isFinite(m.created_at) ? new Date(m.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "" });
      const closeMsg = el("button", "aw-np-mail-iconbtn aw-np-mail-d-close", { html: IC.close, on: { click: (e) => {
        e.stopPropagation();
        clearSelection();
      } } });
      const dateClose = el("div", "aw-np-mail-d-date-row", { kids: [date, closeMsg] });
      const head = el("div", "aw-np-mail-d-head", { kids: [subj, dateClose] });
      const text = el("div", "aw-np-mail-d-body", { text: m.body });
      const sign = el("div", "aw-np-mail-d-sign", { text: "— KeyMan98" });
      const card = el("div", "aw-np-mail-d-card", { kids: [text, sign] });
      const actions = el("div", "aw-np-mail-d-actions");
      if (activeTab === "trash") {
        const restoreBtn = el("button", "aw-np-mail-toggle", { html: IC.restore + "<span>Ripristina</span>" });
        restoreBtn.addEventListener("click", () => {
          const s = loadMailState();
          s[m.id] = { ...s[m.id], deleted: false };
          saveMailState(s);
          notifyUnread();
          clearSelection();
        });
        actions.append(restoreBtn);
      } else {
        const toggleRead = el("button", "aw-np-mail-toggle");
        const syncToggle = () => {
          const s = loadMailState();
          toggleRead.textContent = s[m.id]?.read ? "Segna come non letta" : "Segna come letta";
        };
        syncToggle();
        toggleRead.addEventListener("click", () => {
          const s = loadMailState();
          s[m.id] = { ...s[m.id], read: !s[m.id]?.read };
          saveMailState(s);
          syncToggle();
          renderList();
          notifyUnread();
        });
        const delBtn = el("button", "aw-np-mail-toggle is-danger", { html: IC.trash + "<span>Elimina</span>" });
        delBtn.addEventListener("click", () => {
          const s = loadMailState();
          s[m.id] = { ...s[m.id], deleted: true };
          saveMailState(s);
          notifyUnread();
          clearSelection();
        });
        actions.append(toggleRead, delBtn);
      }
      readContent.append(head, card, actions);
      readEmpty.style.display = "none";
      readContent.style.display = "flex";
    }
    function refresh() {
      return fetchMessages().then((list) => {
        if (list == null) {
          renderList(true);
          notifyUnread();
          return;
        }
        cached = list;
        const st = loadMailState(), ids = new Set(list.map((m) => String(m.id)));
        Object.keys(st).forEach((id) => {
          if (!ids.has(id)) delete st[id];
        });
        saveMailState(st);
        if (selectedId != null && !list.some((m) => m.id === selectedId)) selectedId = null;
        readContent.style.display = "none";
        readEmpty.style.display = "flex";
        renderList(true);
        notifyUnread();
      });
    }
    btnClose.addEventListener("click", (e) => {
      e.stopPropagation();
      mailPanel.classList.remove("open");
    });
    inner.addEventListener("click", (e) => e.stopPropagation());
    mailPanel.addEventListener("click", (e) => {
      if (e.target === mailPanel) mailPanel.classList.remove("open");
    });
    let wasOpen = false;
    const mo = new MutationObserver(() => {
      const isOpen = mailPanel.classList.contains("open");
      if (isOpen && !wasOpen) {
        wasOpen = true;
        activeTab = "inbox";
        tabInbox.classList.add("active");
        tabTrash.classList.remove("active");
        selectedId = null;
        readContent.style.display = "none";
        readEmpty.style.display = "flex";
        renderList(true, 500);
        hooks?.onOpen?.();
      } else if (!isOpen && wasOpen) {
        wasOpen = false;
        clearTimeout(revealTimer);
        revealTimer = null;
        hooks?.onClose?.();
      }
    });
    mo.observe(mailPanel, { attributes: true, attributeFilter: ["class"] });
    return { mailPanel, refresh, setOnUnreadChange: (fn) => {
      onUnreadChange = fn;
    }, disconnectMail: () => mo.disconnect() };
  }

  // src/data/hotkeys.js
  var HOTKEY_ACTIONS = ["fullscreen", "mute", "restart", "skipOp", "undoSkip", "prev", "next", "reload", "legend", "homepage", "report", "mailbox"];
  var DEFAULT_HOTKEYS = { fullscreen: "f", mute: "m", restart: "r", skipOp: "o", undoSkip: "b", prev: "p", next: "n", reload: "s", legend: "a", homepage: "i", report: "h", mailbox: "l" };
  var loadHotkeys = () => {
    let raw;
    try {
      raw = JSON.parse(lsGet(KEY_HOTKEYS) || "null");
    } catch {
      raw = null;
    }
    const out = {}, used = /* @__PURE__ */ new Set();
    if (raw && typeof raw === "object") {
      for (const a of HOTKEY_ACTIONS) {
        const v = raw[a];
        if (typeof v === "string" && /^[a-z]$/.test(v) && !used.has(v)) {
          out[a] = v;
          used.add(v);
        }
      }
    }
    for (const a of HOTKEY_ACTIONS) {
      if (out[a]) continue;
      let v = DEFAULT_HOTKEYS[a];
      if (used.has(v)) {
        v = null;
        for (let c = 97; c <= 122; c++) {
          const ch = String.fromCharCode(c);
          if (!used.has(ch)) {
            v = ch;
            break;
          }
        }
      }
      if (v) {
        out[a] = v;
        used.add(v);
      }
    }
    return out;
  };
  var saveHotkeys = (map) => lsSet(KEY_HOTKEYS, JSON.stringify(map));

  // src/panels/hotkey-panel.js
  function buildHotkeyPanel(initMap, onCommit, hooks) {
    const ACT = {
      mute: { ic: IC.mute, f: "TOGGLE VOLUME", d: "Attiva/disattiva l'audio" },
      fullscreen: { ic: IC.fsOn, f: "FULL SCREEN", d: "Entra/esce dal full screen" },
      skipOp: { ic: IC.skip, f: "SKIP OP/ED", d: "Salto in avanti di 1:25 min." },
      undoSkip: { ic: IC.undo, f: "ANNULLA SKIP", d: "Torna indietro di 1:25 min." },
      prev: { ic: IC.prev, f: "PRECEDENTE", d: "Episodio precedente" },
      next: { ic: IC.next, f: "SUCCESSIVO", d: "Episodio successivo" },
      restart: { ic: IC.restart, f: "RESTART", d: "Riparte da inizio episodio" },
      reload: { ic: IC.unlock, f: "SBLOCCA VIDEO", d: "Forza un refresh del video" },
      legend: { ic: '<span class="aw-np-key-a-badge">A</span>', f: "HOTKEY", d: "Apre/chiude il pannello hotkey" },
      homepage: { ic: IC.browser, f: "HOMEPAGE", d: "Apre la Homepage del player" },
      report: { ic: IC.warning, f: "SEGNALA PROBLEMA", d: "Apre il pannello segnalazioni" },
      mailbox: { ic: IC.mail, f: "MAIL", d: "Apre la casella di posta" }
    };
    let curMap = Object.assign({}, initMap);
    let editMap = null;
    let editing = false, listening = null;
    const overlay = mk("div", "aw-np-hotkey-overlay");
    const inner = mk("div", "aw-np-hotkey-inner");
    const bar = el("div", "aw-np-kbd-bar");
    const BAR_IC = {
      edit: IC.edit,
      ok: IC.check,
      cancel: IC.undo,
      reset: IC.restart,
      x: IC.close
    };
    const mkBarBtn = (cls, ic, title) => el("div", "aw-np-kbd-bar-btn " + cls, {
      html: ic,
      kids: [el("span", "np-tip", { text: title })]
    });
    const btnEdit = mkBarBtn("is-edit", BAR_IC.edit, "Modifica le scorciatoie");
    const btnReset = mkBarBtn("is-reset", BAR_IC.reset, "Ripristina i tasti predefiniti");
    const btnOk = mkBarBtn("is-ok", BAR_IC.ok, "Salva le modifiche");
    const btnCancel = mkBarBtn("is-cancel", BAR_IC.x, "Esci dalla modifica");
    const btnX = mkBarBtn("is-x", BAR_IC.x, "Chiudi");
    const keyA = el("span", "aw-np-hotkey-key-a");
    const barTitle = el("div", "aw-np-hotkey-bartitle", { kids: [keyA, el("span", null, { text: "Hotkey" })] });
    bar.append(barTitle, btnX);
    const tools = el("div", "aw-np-hotkey-tools", { kids: [btnEdit, btnReset, btnOk, btnCancel] });
    const kbd = el("div", "aw-np-kbd");
    const fnStrip = el("div", "aw-np-kbd-fn");
    const fnName = el("span", "aw-np-kbd-fn-name"), fnDesc = el("span", "aw-np-kbd-fn-desc");
    fnStrip.append(fnName, fnDesc);
    const showFn = (s) => {
      fnName.textContent = s.f;
      fnDesc.textContent = s.d;
      fnStrip.classList.add("show");
    };
    const clearFn = () => {
      if (!editing) fnStrip.classList.remove("show");
    };
    const showHint = (t) => {
      fnName.textContent = "";
      fnDesc.textContent = t;
      fnStrip.classList.add("show");
    };
    const letterSlots = /* @__PURE__ */ new Map();
    const mkLetterSlot = (ch) => {
      const key = el("div", "aw-np-key aw-np-key-letter-slot", {
        attrs: { "data-ch": ch.toLowerCase() },
        kids: [el("span", "aw-np-key-ico"), el("span", "aw-np-key-letter", { text: ch })],
        on: {
          mouseenter: () => {
            const act = actionAt(ch.toLowerCase());
            if (editing) {
              key.classList.add("hovered");
            } else if (act) {
              key.classList.add("hovered");
              showFn(ACT[act]);
            }
          },
          mouseleave: () => {
            key.classList.remove("hovered");
            clearFn();
          },
          click: (e) => {
            if (!editing) return;
            e.stopPropagation();
            const c = ch.toLowerCase();
            if (!listening) {
              startListening(c);
            } else if (listening === c) {
              listening = null;
              letterSlots.forEach((s) => s.classList.remove("listening"));
              showHint("Seleziona il tasto da modificare");
            } else {
              assignLetter(c);
            }
          }
        }
      });
      letterSlots.set(ch.toLowerCase(), key);
      return key;
    };
    const mkFiller = (label, wide, pad) => {
      const k = el("div", "aw-np-key off aw-np-key-special");
      if (wide || pad) {
        k.classList.add("aw-np-key-fill-wide");
        if (wide) k.style.setProperty("--wmult", wide);
        if (pad) k.style.setProperty("--padmult", pad);
        k.appendChild(el("span", "aw-np-glyph", { text: label }));
      } else {
        k.textContent = label;
      }
      return k;
    };
    const mkSpecial = (spec, extraCls, label) => {
      const kids = [el("span", "aw-np-key-ico", { html: spec.ic })];
      if (label) kids.push(el("span", "aw-np-key-letter", { text: label }));
      const key = el("div", "aw-np-key on aw-np-key-special" + (extraCls ? " " + extraCls : ""), {
        kids,
        on: {
          mouseenter: () => {
            if (editing) return;
            key.classList.add("hovered");
            showFn(spec);
          },
          mouseleave: () => {
            key.classList.remove("hovered");
            clearFn();
          }
        }
      });
      return key;
    };
    const r1 = el("div", "aw-np-krow");
    r1.appendChild(el("div", "aw-np-key off aw-np-key-half aw-np-key-special", { text: "\\" }));
    for (let i = 0; i < 10; i++) {
      const ch = String((i + 1) % 10);
      const pct = (i + 1) % 10 * 10;
      const spec = { ic: IC.seekFwd, f: "AVANZAMENTO RAPIDO", d: `${pct}% della durata totale` };
      const key = el("div", "aw-np-key on aw-np-key-num aw-np-key-special", {
        kids: [el("span", "aw-np-key-ico aw-np-key-pct", { text: `${pct}%` }), el("span", "aw-np-key-letter", { text: ch })],
        on: {
          mouseenter: () => {
            if (editing) return;
            key.classList.add("hovered");
            showFn(spec);
          },
          mouseleave: () => {
            key.classList.remove("hovered");
            clearFn();
          }
        }
      });
      r1.appendChild(key);
    }
    r1.appendChild(mkFiller("🠔", 1.5));
    kbd.appendChild(r1);
    const r2 = el("div", "aw-np-krow");
    r2.appendChild(mkFiller("⮀"));
    for (const ch of "QWERTYUIOP") r2.appendChild(mkLetterSlot(ch));
    r2.appendChild(mkFiller("+"));
    kbd.appendChild(r2);
    const r3 = el("div", "aw-np-krow");
    r3.appendChild(mkFiller("⇪", 1.5));
    for (const ch of "ASDFGHJKL") r3.appendChild(mkLetterSlot(ch));
    const enterKey = el("div", "aw-np-key off aw-np-key-enter-flat aw-np-key-special", {
      html: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:60%;height:60%;display:block"><path fill="currentColor" d="M20.94,7 C20.27,7 19.61,7 18.95,7 C18.95,8.33 18.95,9.66 18.95,11 C15.25,11 11.55,11 7.85,11 C7.85,9.66 7.85,8.33 7.85,7 C6.25,8.66 4.66,10.31 3.07,11.97 C4.66,13.65 6.25,15.32 7.85,17 C7.85,15.66 7.85,14.33 7.85,12.99 C12.21,12.99 16.57,12.99 20.94,12.99 C20.94,10.99 20.94,9 20.94,7 Z"/></svg>'
    });
    r3.appendChild(enterKey);
    kbd.appendChild(r3);
    const r4 = el("div", "aw-np-krow");
    r4.appendChild(mkFiller("⇧", 2, 1));
    for (const ch of "ZXCVBNM") r4.appendChild(mkLetterSlot(ch));
    r4.appendChild(mkFiller("⇧"));
    r4.appendChild(mkSpecial({ ic: IC.vol, f: "VOLUME +", d: "Alza il volume" }, null, "▲"));
    r4.appendChild(mkFiller("-"));
    kbd.appendChild(r4);
    const r5 = el("div", "aw-np-krow aw-np-krow-bottom");
    const mkMod = (l, wide) => {
      const k = el("div", "aw-np-key off aw-np-key-mod aw-np-key-special", { text: l });
      if (wide) {
        k.classList.add("aw-np-key-fill-wide");
        k.style.setProperty("--wmult", wide);
      }
      return k;
    };
    const space = mkSpecial({ ic: IC.play, f: "PLAY/PAUSA", d: "play/pausa del video" }, "aw-np-key-space");
    r5.append(
      mkMod("CTRL"),
      mkMod("AW"),
      mkMod("ALT"),
      space,
      mkMod("ALT GR"),
      mkSpecial({ ic: IC.seekBwd, f: "SEEK INDIETRO", d: "Breve riavvolgimento di 5-30 s" }, null, "◀"),
      mkSpecial({ ic: IC.volDown, f: "VOLUME −", d: "Abbassa il volume" }, null, "▼"),
      mkSpecial({ ic: IC.seekFwd, f: "SEEK AVANTI", d: "Breve avanzamento di 5-30 s" }, null, "▶")
    );
    kbd.appendChild(r5);
    const updateHint = () => {
      keyA.textContent = (curMap.legend || "a").toUpperCase();
    };
    updateHint();
    const footer = el("div", "aw-np-hotkey-footer", { kids: [fnStrip, tools] });
    inner.append(bar, kbd, footer);
    overlay.append(inner);
    const liveMap = () => editing ? editMap : curMap;
    const actionAt = (ch) => {
      const m = liveMap();
      for (const a of HOTKEY_ACTIONS) if (m[a] === ch) return a;
      return null;
    };
    const renderBindings = () => {
      letterSlots.forEach((slot, ch) => {
        const ico = slot.querySelector(".aw-np-key-ico");
        const a = actionAt(ch);
        if (a) {
          slot.classList.add("on");
          slot.classList.remove("off");
          ico.innerHTML = a === "legend" ? '<span class="aw-np-key-a-badge">' + ch.toUpperCase() + "</span>" : ACT[a].ic;
          slot.dataset.act = a;
        } else {
          slot.classList.remove("on");
          slot.classList.add("off");
          ico.innerHTML = "";
          delete slot.dataset.act;
        }
      });
    };
    renderBindings();
    const refreshBar = () => {
      overlay.classList.toggle("editing", editing);
    };
    const enterEdit = () => {
      editing = true;
      editMap = Object.assign({}, curMap);
      listening = null;
      refreshBar();
      renderBindings();
      showHint("Seleziona il tasto da modificare");
    };
    const exitEdit = () => {
      editing = false;
      editMap = null;
      listening = null;
      letterSlots.forEach((s) => s.classList.remove("listening"));
      refreshBar();
      renderBindings();
      clearFn();
      fnStrip.classList.remove("show");
    };
    const startListening = (ch) => {
      listening = ch;
      letterSlots.forEach((s) => s.classList.toggle("listening", s.dataset.ch === ch));
      showHint("Premi la nuova lettera");
    };
    const assignLetter = (newCh) => {
      if (!listening || newCh === listening) {
        listening = null;
        letterSlots.forEach((s) => s.classList.remove("listening"));
        showHint("Seleziona il tasto da modificare");
        return;
      }
      const lFirst = listening, lSecond = newCh;
      const aFirst = actionAt(lFirst);
      const aSecond = actionAt(lSecond);
      if (aFirst) editMap[aFirst] = lSecond;
      if (aSecond) editMap[aSecond] = lFirst;
      listening = null;
      letterSlots.forEach((s) => s.classList.remove("listening"));
      renderBindings();
      showHint("Seleziona il tasto da modificare");
    };
    const onEditKey = (e) => {
      if (!editing) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        doCancel();
        return;
      }
      if (!listening) return;
      const k = (e.key || "").toLowerCase();
      if (/^[a-z]$/.test(k)) {
        e.preventDefault();
        e.stopPropagation();
        assignLetter(k);
      }
    };
    btnEdit.addEventListener("click", (e) => {
      e.stopPropagation();
      enterEdit();
    });
    btnReset.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!editing) return;
      editMap = Object.assign({}, DEFAULT_HOTKEYS);
      listening = null;
      letterSlots.forEach((s) => s.classList.remove("listening"));
      renderBindings();
      showHint("Seleziona il tasto da modificare");
    });
    const doOk = () => {
      curMap = Object.assign({}, editMap);
      saveHotkeys(curMap);
      if (onCommit) onCommit(Object.assign({}, curMap));
      exitEdit();
      updateHint();
    };
    const doCancel = () => {
      exitEdit();
    };
    btnOk.addEventListener("click", (e) => {
      e.stopPropagation();
      if (editing) doOk();
    });
    btnCancel.addEventListener("click", (e) => {
      e.stopPropagation();
      if (editing) doCancel();
    });
    const isOpen = () => overlay.classList.contains("open");
    const open = () => {
      overlay.classList.add("open");
      hooks?.onOpen?.();
    };
    const closeFn = () => {
      if (editing) doCancel();
      overlay.classList.remove("open");
      hooks?.onClose?.();
    };
    btnX.addEventListener("click", (e) => {
      e.stopPropagation();
      closeFn();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay && !editing) closeFn();
    });
    document.addEventListener("keydown", onEditKey, true);
    const setMap = (m) => {
      curMap = Object.assign({}, m);
      updateHint();
      if (!editing) renderBindings();
    };
    const destroy = () => document.removeEventListener("keydown", onEditKey, true);
    return { overlay, open, close: closeFn, isOpen, setMap, isEditing: () => editing, destroy };
  }

  // src/panels/bp-homepage-panel.js
  var LINKS = [
    { ic: "world", label: "Sito web", soon: true },
    { ic: "github", label: "GitHub", desc: "Codice sorgente e DB skip", href: "https://github.com/KeyMan98/Animeworld-Better-Player" },
    { ic: "greasyfork", label: "GreasyFork", desc: "Installa o aggiorna lo script", href: "https://greasyfork.org/it/scripts/571464-animeworld-better-player" },
    { ic: "telegram", label: "Telegram", desc: "Chat diretta, info e assistenza", href: "https://t.me/KeyMan98" },
    { ic: "whatsapp", label: "WhatsApp", soon: true }
  ];
  function buildBpHomepage() {
    const { panel: bpPanel, body } = buildPanelShell({ id: "aw-np-bp-panel", title: "Homepage", icon: IC.browser });
    LINKS.forEach((l) => {
      const txtKids = [el("span", "aw-np-bp-label", { text: l.label })];
      if (l.desc) txtKids.push(el("span", "aw-np-bp-desc", { text: l.desc }));
      const kids = [
        el("span", "aw-np-bp-ic aw-np-bp-ic-" + l.ic, { html: IC[l.ic] }),
        el("span", "aw-np-bp-txt", { kids: txtKids }),
        l.soon ? el("span", "aw-np-bp-soon-lbl", { text: "In arrivo" }) : el("span", "aw-np-bp-arrow", { text: "↗" })
      ];
      const row = l.soon ? el("div", "aw-np-bp-link aw-np-bp-soon aw-np-arow", { kids }) : el("a", "aw-np-bp-link aw-np-arow", { attrs: { href: l.href, target: "_blank", rel: "noopener noreferrer" }, kids });
      body.appendChild(row);
    });
    return { bpPanel };
  }

  // src/widgets/flash.js
  function buildVolFlash(video) {
    const volFlashIco = mk("div", "aw-np-vol-flash-icon");
    const volFlash = el("div", "np-flash-circle", { id: "aw-np-vol-flash", kids: [volFlashIco] });
    let volFlashTimer = null;
    const showVolFlash = (dir) => {
      if (!isFlashOn()) return;
      const m = video.muted || video.volume === 0;
      volFlashIco.innerHTML = m ? IC.mute : dir === "down" ? IC.volDown : IC.vol;
      volFlash.classList.add("on");
      clearTimeout(volFlashTimer);
      volFlashTimer = setTimeout(() => volFlash.classList.remove("on"), 400);
    };
    return { volFlash, showVolFlash, clearTimer: () => clearTimeout(volFlashTimer) };
  }
  function buildCenterFlash(center) {
    let cTimer = null, skipFlash = false;
    const flashAt = (html, dur) => {
      if (!isFlashOn()) return;
      center.innerHTML = html;
      center.classList.add("on");
      clearTimeout(cTimer);
      cTimer = setTimeout(() => center.classList.remove("on"), dur);
    };
    return {
      flash: (html) => flashAt(html, 700),
      flashBrief: (html) => flashAt(html, 400),
      playPauseFlash: (html) => {
        if (!skipFlash) flashAt(html, 700);
      },
      setSkipFlash: (v) => {
        skipFlash = v;
      },
      clearTimer: () => clearTimeout(cTimer)
    };
  }

  // src/lib/pip.js
  var pipElement = () => document.pictureInPictureElement || null;
  var pipExit = () => document.exitPictureInPicture?.().catch(() => {
  });
  var pipRequest = (el2) => {
    if (el2.readyState >= 1) return el2.requestPictureInPicture?.().catch(() => {
    });
  };

  // src/widgets/player-events.js
  function buildErrorHandler(video, wrap, _play, errorMsg) {
    const hideErrorToast = () => wrap.querySelector("#aw-np-error-toast")?.remove();
    let _reloading = false;
    const reloadVideo = (silent = false) => {
      if (_reloading) return;
      _reloading = true;
      hideErrorToast();
      const t = video.currentTime;
      const wasPlaying = !video.paused;
      const s = video.src;
      if (silent) video.dataset.silentReload = "1";
      video.src = "";
      video.src = s;
      const failsafe = setTimeout(() => {
        _reloading = false;
      }, 2e4);
      video.addEventListener("loadedmetadata", () => {
        clearTimeout(failsafe);
        _reloading = false;
        if (t > 0) video.currentTime = t;
        if (wasPlaying) _play();
        setTimeout(() => {
          delete video.dataset.silentReload;
        }, 100);
      }, { once: true });
    };
    const showErrorToast = (msg) => {
      hideErrorToast();
      const t = el("div", null, { id: "aw-np-error-toast", text: msg, on: { click: () => reloadVideo() } });
      wrap.appendChild(t);
    };
    video.addEventListener("error", () => {
      if (video.networkState !== 0) showErrorToast(errorMsg);
    });
    let _lastTime = -1, _freezeTimer = null;
    const _checkFreeze = () => {
      if (video.paused || video.ended) return;
      if (video.currentTime === _lastTime && video.readyState < 3) showErrorToast(errorMsg);
      _lastTime = video.currentTime;
    };
    video.addEventListener("play", () => {
      hideErrorToast();
      _lastTime = video.currentTime;
      clearInterval(_freezeTimer);
      _freezeTimer = setInterval(_checkFreeze, 5e3);
    });
    video.addEventListener("playing", () => {
      hideErrorToast();
      _lastTime = video.currentTime;
    });
    video.addEventListener("canplaythrough", () => hideErrorToast());
    video.addEventListener("pause", () => clearInterval(_freezeTimer));
    video.addEventListener("ended", () => clearInterval(_freezeTimer));
    video.addEventListener("seeking", () => {
      _lastTime = -1;
    });
    return { reloadVideo, clearTimer: () => clearInterval(_freezeTimer) };
  }
  function buildPipHandler({ video, btnPip, wrap, onEnter, onLeave }) {
    btnPip.addEventListener("click", () => pipElement() ? pipExit() : pipRequest(video));
    video.addEventListener("enterpictureinpicture", () => {
      wrap.style.visibility = "hidden";
      onEnter?.();
    });
    video.addEventListener("leavepictureinpicture", () => {
      wrap.style.visibility = "";
      onLeave?.();
    });
  }
  function wirePlayPauseEvents({ video, onUpdate, playPauseFlash }) {
    video.addEventListener("play", () => {
      if (video.dataset.silentReload) return;
      onUpdate(true);
      playPauseFlash?.(IC.pause);
    });
    video.addEventListener("pause", () => {
      if (video.dataset.silentReload) return;
      onUpdate(false);
      playPauseFlash?.(IC.play);
    });
    video.addEventListener("ended", () => onUpdate(false));
  }

  // src/player/episode-actions.js
  function buildEpisodeActions({ video, _play, flash }) {
    return {
      restart: () => {
        video.currentTime = 0;
        _play();
        flash(IC.restart);
      },
      undo: () => {
        video.currentTime = Math.max(0, video.currentTime - SKIP_SECONDS);
        flash(IC.undo);
      },
      skip: () => {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + SKIP_SECONDS);
        flash(IC.skip);
      },
      prev: () => {
        const t = getAdjacentEpisode("prev");
        if (t) {
          flash(IC.prev);
          loadEpisode(t.dataset.id);
        }
      },
      next: () => {
        const t = getAdjacentEpisode("next");
        if (t) {
          flash(IC.next);
          loadEpisode(t.dataset.id);
        }
      },
      // Apre un episodio per token (non adiacente): usato dal «Vai a <ep> - <m:ss>» della
      // Protezione sonno, che deve tornare a dove l'utente si e assopito.
      goTo: (token) => {
        if (token) loadEpisode(token);
      }
    };
  }

  // src/state/resume.js
  var _activeToken = "";
  var _stopSavingFn = null;
  var getActiveToken = () => _activeToken;
  var setActiveToken = (t) => {
    _activeToken = t;
  };
  var getStopSavingFn = () => _stopSavingFn;
  var setStopSavingFn = (fn) => {
    _stopSavingFn = fn;
  };
  var resumeKey = () => KEY_RESUME_PFX + (_activeToken || location.pathname);
  var resumeTs = () => resumeKey() + ":ts";
  function saveResumePos(t) {
    if (!isResumeOn()) return;
    if (!isFinite(t) || t <= RESUME_MIN_POS) {
      lsDel(resumeKey());
      lsDel(resumeTs());
      return;
    }
    lsSet(resumeKey(), String(t));
    lsSet(resumeTs(), String(Date.now()));
  }
  function cleanupResumeStorage() {
    try {
      const now = Date.now();
      Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).forEach((k) => {
        if (!k?.startsWith(KEY_RESUME_PFX) || k.endsWith(":ts")) return;
        const ts = parseFloat(lsGet(k + ":ts") ?? "");
        if (isNaN(ts) || now - ts > RESUME_MAX_AGE) {
          lsDel(k);
          lsDel(k + ":ts");
        }
      });
    } catch {
    }
  }

  // src/state/pending-seek.js
  var pending = null;
  function setPendingSeek(token, time) {
    if (!token || !Number.isFinite(time) || time < 0) return;
    pending = { token: String(token), time };
  }
  function takePendingSeek(token) {
    const p = pending;
    pending = null;
    if (!p) return null;
    return token && String(token) === p.token ? p.time : null;
  }

  // src/player/resume-logic.js
  function buildResumeLogic(video, wrap, speedValFn) {
    let boundToken = getActiveToken();
    const myResumeKey = () => KEY_RESUME_PFX + (boundToken || location.pathname);
    const myResumeTs = () => myResumeKey() + ":ts";
    function showResumeToast(seconds) {
      flashToast(wrap, `▶ Ripreso da ${fmt(seconds)}`);
    }
    function attemptResume() {
      if (!isResumeOn() || !isFinite(video.duration)) return;
      const saved = parseFloat(lsGet(myResumeKey()) ?? "");
      if (!saved || saved < RESUME_MIN_POS) return;
      if (video.duration - saved < RESUME_END_GAP) {
        lsDel(myResumeKey());
        lsDel(myResumeTs());
        return;
      }
      video.currentTime = saved;
      showResumeToast(saved);
    }
    video.addEventListener("loadedmetadata", () => {
      if (video.playbackRate !== speedValFn()) video.playbackRate = speedValFn();
      const marked = takePendingSeek(boundToken);
      if (marked != null && isFinite(video.duration)) {
        video.currentTime = Math.min(marked, video.duration - 0.1);
        showResumeToast(video.currentTime);
        return;
      }
      attemptResume();
    }, { once: true });
    let saveTimer = null, episodeEnded = false;
    const saveNow = () => {
      if (!isResumeOn()) return;
      if (!isFinite(video.currentTime) || video.currentTime <= RESUME_MIN_POS) {
        lsDel(myResumeKey());
        lsDel(myResumeTs());
        return;
      }
      if (isFinite(video.duration) && video.duration - video.currentTime < RESUME_END_GAP) return;
      lsSet(myResumeKey(), String(video.currentTime));
      lsSet(myResumeTs(), String(Date.now()));
    };
    const startSaving = () => {
      if (saveTimer) return;
      saveTimer = setInterval(saveNow, SAVE_INTERVAL_MS);
    };
    const stopSaving = () => {
      clearInterval(saveTimer);
      saveTimer = null;
    };
    setStopSavingFn(stopSaving);
    video.addEventListener("play", startSaving);
    video.addEventListener("pause", () => {
      stopSaving();
      saveNow();
    });
    video.addEventListener("seeked", () => {
      if (isFinite(video.duration) && video.duration - video.currentTime >= RESUME_END_GAP) {
        episodeEnded = false;
        saveNow();
      }
    });
    video.addEventListener("ended", () => {
      stopSaving();
      lsDel(myResumeKey());
      lsDel(myResumeTs());
      episodeEnded = true;
    });
    return { showResumeToast, stopSaving, saveNow, setToken: (t) => {
      boundToken = t;
    }, episodeEnded: () => episodeEnded };
  }

  // src/panels/panel-toggle.js
  function collectPanelRows(container, rows) {
    Array.from(container.children).forEach((child) => {
      if (!child.classList) {
        rows.push([child]);
        return;
      }
      if (child.classList.contains("aw-np-pn-cols")) {
        const colArrs = Array.from(child.querySelectorAll(":scope > .aw-np-pn-col")).map((c) => Array.from(c.children));
        if (colArrs.length) {
          const maxLen = Math.max.apply(null, colArrs.map((a) => a.length));
          for (let i = 0; i < maxLen; i++) {
            const rn = [];
            colArrs.forEach((a) => {
              if (a[i]) rn.push(a[i]);
            });
            if (rn.length) rows.push(rn);
          }
          return;
        }
      }
      if (child.classList.contains("aw-np-pn-grid")) {
        const cells = Array.from(child.children);
        for (let i = 0; i < cells.length; i += 2) {
          const pair = [cells[i]];
          if (cells[i + 1]) pair.push(cells[i + 1]);
          rows.push(pair);
        }
        return;
      }
      if (child.classList.contains("aw-np-pn-colorsec") || child.classList.contains("aw-np-pn-sec") || child.classList.contains("aw-np-pn-global") || child.classList.contains("aw-np-rp-group")) {
        collectPanelRows(child, rows);
        return;
      }
      rows.push([child]);
    });
  }
  function staggerPanelRows(panel) {
    const STEP = STAGGER_STEP, BASE = STAGGER_BASE;
    const rows = [];
    const activeSkip = panel.querySelector(".aw-np-rp-sec.show");
    const body = activeSkip || panel.querySelector(".aw-np-pn-body,.aw-np-rp-body");
    if (!body) return;
    if (activeSkip) {
      const tabs = panel.querySelector(".aw-np-rp-tabs");
      if (tabs) rows.push([tabs]);
      collectPanelRows(activeSkip, rows);
      const footer = panel.querySelector(".aw-np-rp-footer");
      if (footer) rows.push([footer]);
    } else {
      collectPanelRows(body, rows);
    }
    rows.forEach((nodes, idx) => {
      const d = (BASE + idx * STEP).toFixed(3) + "s";
      nodes.forEach((n) => {
        if (n && n.style) {
          n.style.transitionDelay = d;
        }
      });
    });
  }
  function bindPanelToggle(trigger, target, others, afterClose, onToggle) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      others.forEach((o) => o.classList.remove("open"));
      const willOpen = !target.classList.contains("open");
      if (willOpen) {
        if (onToggle) onToggle(true);
        staggerPanelRows(target);
        void target.offsetHeight;
        target.classList.add("open");
      } else {
        target.classList.remove("open");
        if (onToggle) onToggle(false);
        if (afterClose) afterClose();
      }
    });
    target.addEventListener("click", (e) => e.stopPropagation());
  }

  // src/lib/ripple.js
  function addRipple(btn) {
    btn.addEventListener("pointerdown", (e) => {
      const r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height);
      const ripple = document.createElement("span");
      ripple.className = "np-ripple";
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px;`;
      (btn.querySelector(".np-ripple-layer") || btn).appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  }

  // src/player/player-lifecycle.js
  function attachExitSavers(onUnload, onStorage) {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onUnload();
    };
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }
  function teardownVideo(video) {
    try {
      video.pause();
    } catch {
    }
    video.src = "";
    const pv = getPreloadedVideo();
    if (pv) {
      try {
        pv.pause();
      } catch {
      }
      pv.src = "";
      pv.remove();
      setPreloadedVideo(null);
    }
    setPreloadedToken(null);
    setPreloadedUrl(null);
  }

  // src/player/overlay-pause.js
  function buildOverlayPause(video, panels = []) {
    let depth = 0, wasPlaying = false;
    const enter = () => {
      if (depth === 0) wasPlaying = !video.paused;
      depth++;
      if (wasPlaying) video.pause();
    };
    const exit = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && wasPlaying) video.play().catch(() => {
      });
    };
    const observers = panels.map((panel) => {
      let wasOpen = false;
      const obs = new MutationObserver(() => {
        const o = panel.classList.contains("open");
        if (o && !wasOpen) {
          wasOpen = true;
          enter();
        } else if (!o && wasOpen) {
          wasOpen = false;
          exit();
        }
      });
      obs.observe(panel, { attributes: true, attributeFilter: ["class"] });
      return obs;
    });
    const disconnect = () => observers.forEach((o) => o.disconnect());
    return { enter, exit, disconnect };
  }

  // src/widgets/connection-monitor.js
  var CONN_SVG_SLOW = '<path d="M12 2L1 21h22L12 2zm0 3.5L21 20H3L12 5.5zM11 10v4h2v-4zm0 6v2h2v-2z" fill="#fff"/>';
  var CONN_SVG_GOOD = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#fff"/>';
  var CONN_MSG_SLOW = "<span>Connessione lenta, video</span><span>potenzialmente instabile</span>";
  var CONN_MSG_GOOD = "<span>Connessione buona, video</span><span>potenzialmente stabile</span>";
  function _buildConnToast(wrap) {
    let toast = wrap.querySelector("#aw-np-conn-toast");
    if (toast) return toast;
    toast = mk("div", "aw-np-conn-toast");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "13");
    icon.setAttribute("height", "13");
    icon.style.flexShrink = "0";
    const msg = mk("div");
    msg.className = "conn-msg";
    toast.append(icon, msg);
    wrap.appendChild(toast);
    return toast;
  }
  function _showConnToast(wrap, slow, hideTimerRef) {
    const toast = _buildConnToast(wrap);
    const icon = toast.querySelector("svg"), msg = toast.querySelector(".conn-msg");
    icon.innerHTML = slow ? CONN_SVG_SLOW : CONN_SVG_GOOD;
    msg.innerHTML = slow ? CONN_MSG_SLOW : CONN_MSG_GOOD;
    toast.classList.remove("slow", "good");
    toast.classList.add(slow ? "slow" : "good");
    toast.style.opacity = "1";
    clearTimeout(hideTimerRef.id);
    hideTimerRef.id = setTimeout(() => {
      toast.style.opacity = "0";
    }, CONN_TOAST_MS);
  }
  function buildConnectionMonitor(video, wrap) {
    const SLOW_TH = 1.3, GOOD_TH = 1.8, WIN = 6, SLOW_COUNT = 4, GOOD_COUNT = 6, MIN_SAMPLE_INTERVAL = 950;
    const samples = new Float32Array(WIN);
    let sIdx = 0, sCount = 0, sSum = 0;
    let lastBufEnd = null, lastTs2 = null, connState = null, slowN = 0, goodN = 0, initialShown = false;
    const hideRef = { id: null };
    const getBufEnd = () => {
      const n = video.buffered.length;
      if (!n) return null;
      const ct = video.currentTime;
      for (let i = n - 1; i >= 0; i--) {
        if (video.buffered.start(i) <= ct + 0.5) return video.buffered.end(i);
      }
      return null;
    };
    const pushSample = (v) => {
      if (sCount < WIN) {
        samples[sIdx] = v;
        sSum += v;
        sCount++;
      } else {
        sSum += v - samples[sIdx];
        samples[sIdx] = v;
      }
      sIdx = (sIdx + 1) % WIN;
    };
    const onProgress = () => {
      if (!isConnMonitorOn()) {
        const t = wrap.querySelector("#aw-np-conn-toast");
        if (t) t.style.opacity = "0";
        return;
      }
      if (video.networkState !== 2) return;
      const now = Date.now();
      if (lastTs2 !== null && now - lastTs2 < MIN_SAMPLE_INTERVAL) return;
      const bufEnd = getBufEnd();
      if (bufEnd === null) {
        lastBufEnd = null;
        lastTs2 = null;
        return;
      }
      if (bufEnd - video.currentTime > 25) {
        lastBufEnd = bufEnd;
        lastTs2 = now;
        return;
      }
      if (lastBufEnd !== null && lastTs2 !== null) {
        const dt = (now - lastTs2) / 1e3, db = bufEnd - lastBufEnd;
        if (dt > 0.1 && db >= 0) {
          pushSample(db / dt);
          if (sCount >= WIN) {
            const avg = sSum / WIN;
            const isSlow = avg < SLOW_TH, isGood = avg >= GOOD_TH;
            if (isSlow) {
              slowN++;
              goodN = 0;
            } else if (isGood) {
              goodN++;
              slowN = 0;
            }
            if (!initialShown) {
              if (slowN >= SLOW_COUNT || goodN >= GOOD_COUNT) {
                initialShown = true;
                connState = slowN >= SLOW_COUNT ? "slow" : "good";
                _showConnToast(wrap, connState === "slow", hideRef);
              }
            } else {
              if (slowN >= SLOW_COUNT && connState !== "slow") {
                connState = "slow";
                _showConnToast(wrap, true, hideRef);
              } else if (goodN >= GOOD_COUNT && connState !== "good") {
                connState = "good";
                _showConnToast(wrap, false, hideRef);
              }
            }
          }
        }
      }
      lastBufEnd = bufEnd;
      lastTs2 = now;
    };
    const onSeeking = () => {
      lastBufEnd = null;
      lastTs2 = null;
      sCount = 0;
      sIdx = 0;
      sSum = 0;
      slowN = 0;
      goodN = 0;
    };
    video.addEventListener("progress", onProgress);
    video.addEventListener("seeking", onSeeking);
    return { clearMonitor: () => {
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("seeking", onSeeking);
      clearTimeout(hideRef.id);
    } };
  }

  // src/widgets/clock.js
  function buildClock(wrap) {
    const fmt2 = (n) => String(n).padStart(2, "0");
    const _ico = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line class="hand-m" x1="12" y1="12" x2="12" y2="5.8"/><line class="hand-h" x1="12" y1="12" x2="12" y2="8"/><circle class="pin" cx="12" cy="12" r="1.1"/></svg>';
    const timeEl = el("span");
    const clockEl = el("div", null, { id: "aw-np-clock", html: _ico, kids: [timeEl] });
    const handH = clockEl.querySelector(".hand-h");
    const handM = clockEl.querySelector(".hand-m");
    const tick = () => {
      const d = /* @__PURE__ */ new Date(), h = d.getHours(), m = d.getMinutes();
      timeEl.textContent = fmt2(h) + ":" + fmt2(m);
      handH.setAttribute("transform", `rotate(${h % 12 * 30 + m * 0.5} 12 12)`);
      handM.setAttribute("transform", `rotate(${m * 6} 12 12)`);
    };
    tick();
    let timer;
    const sync = () => {
      tick();
      timer = setInterval(tick, 6e4);
    };
    const initTimer = setTimeout(() => sync(), (60 - (/* @__PURE__ */ new Date()).getSeconds()) * 1e3);
    wrap.appendChild(clockEl);
    return { clockEl, clearTimer: () => {
      clearTimeout(initTimer);
      clearInterval(timer);
    } };
  }

  // src/player/common-chrome.js
  function mountCommonChrome(video, wrap, dotEl, currentColor, _play, { mobile, freezeTip }) {
    const { clearMonitor } = buildConnectionMonitor(video, wrap);
    applyColor(currentColor, wrap, dotEl);
    const uiScale = loadUiScale();
    applyUiScale(wrap, uiScale);
    applyPanelScale(wrap, mobile, uiScale);
    const panelScaleRO = new ResizeObserver(() => applyPanelScale(wrap, mobile, loadUiScale()));
    panelScaleRO.observe(wrap);
    const { clearTimer: clearClockTimer } = buildClock(wrap);
    const { reloadVideo, clearTimer: clearFreezeTimer } = buildErrorHandler(video, wrap, _play, freezeTip);
    return { clearMonitor, panelScaleRO, clearClockTimer, reloadVideo, clearFreezeTimer };
  }

  // src/player/prefs-sync.js
  function runPrefsSync(ctx) {
    const {
      resumeToggle,
      autoEpToggle,
      autoPlayToggle,
      connMonitorToggle,
      globalToggle,
      reloadSeek,
      reloadSpeed,
      updateSpeedInd,
      showSpeedPopup,
      getSpeedVal,
      getColor,
      setColor,
      wrap,
      dotEl,
      syncCustomInput,
      updateSwatches,
      iconColorToggle,
      topColorToggle,
      flashToggle,
      clockToggle,
      speedPopupToggle,
      colorGlobalToggle
    } = ctx;
    resumeToggle.checked = isResumeOn();
    autoEpToggle.checked = isAutoEpOn();
    autoPlayToggle.checked = isAutoPlayOn();
    connMonitorToggle.checked = isConnMonitorOn();
    if (globalToggle) globalToggle.checked = isGlobalOn();
    reloadSeek();
    reloadSpeed();
    updateSpeedInd(getSpeedVal());
    showSpeedPopup(getSpeedVal());
    const newColor = loadColor();
    if (newColor !== getColor()) {
      setColor(newColor);
      applyColor(newColor, wrap, dotEl);
      syncCustomInput(newColor);
      updateSwatches(newColor);
    }
    const iconOn = isIconColorOn();
    wrap.classList.toggle("accent-icons", iconOn);
    iconColorToggle.checked = iconOn;
    const topOn = isTopColorOn();
    wrap.classList.toggle("accent-top", topOn);
    topColorToggle.checked = topOn;
    flashToggle.checked = isFlashOn();
    const clockOn = isClockOn();
    wrap.classList.toggle("clock-hidden", !clockOn);
    clockToggle.checked = clockOn;
    const spOn = isSpeedPopupOn();
    wrap.classList.toggle("speed-popup-hidden", !spOn);
    speedPopupToggle.checked = spOn;
    colorGlobalToggle.checked = isColorGlobalOn();
  }

  // src/player/mail-badge.js
  function wireMailBadge(mailBtn, setOnUnreadChange, refreshMail) {
    const mailBadgeEl = mailBtn.querySelector(".aw-np-mail-badge");
    setOnUnreadChange((u) => {
      if (mailBadgeEl) mailBadgeEl.style.display = u ? "block" : "none";
    });
    refreshMail();
  }

  // src/widgets/skip-popup.js
  function buildSkipPopup(wrap) {
    const ic = el("span", "aw-np-skip-popup-ic");
    const txt = el("span", "aw-np-skip-popup-txt");
    const popup = el("button", null, { id: "aw-np-skip-popup", attrs: { type: "button", tabindex: "-1" }, kids: [ic, txt] });
    wrap.appendChild(popup);
    let timer = null, cb = null;
    function hide() {
      popup.classList.remove("show");
      clearTimeout(timer);
      cb = null;
    }
    popup.addEventListener("click", (e) => {
      e.stopPropagation();
      const fn = cb;
      hide();
      if (fn) fn();
    });
    function show(text, iconHtml, onClick) {
      txt.textContent = text;
      ic.innerHTML = iconHtml || "";
      cb = onClick;
      popup.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(hide, SKIP_POPUP_MS);
    }
    return { show, hide };
  }

  // src/widgets/awake-guard.js
  var MARK_MIN_MS = 1e3;
  var lastTs = Date.now();
  var mark = null;
  var markTs = 0;
  var curVideo = null;
  var curWrap = null;
  var wired = false;
  var warnOn = false;
  var warnWrap = null;
  var currentToken = () => {
    try {
      return document.querySelector(".episode a.active")?.dataset.id || null;
    } catch {
      return null;
    }
  };
  var active = () => isSkipOn() && isAutoNextOn() && isAwakeGuardOn();
  var idleMs = () => Date.now() - lastTs;
  function takeMark() {
    if (!curVideo || !Number.isFinite(curVideo.currentTime)) return;
    mark = { token: currentToken(), ep: getEpisodeNum(), time: curVideo.currentTime };
    markTs = Date.now();
  }
  function onActivity() {
    const now = Date.now();
    lastTs = now;
    if (now - markTs >= MARK_MIN_MS) takeMark();
    if (warnOn) hideWarning();
  }
  function wire() {
    if (wired) return;
    wired = true;
    const opts = { passive: true, capture: true };
    for (const evt of ["pointerdown", "pointermove", "wheel", "touchstart", "keydown"]) {
      document.addEventListener(evt, onActivity, opts);
    }
  }
  function warnEl(wrap) {
    let box = wrap.querySelector("#aw-np-awake-toast");
    if (box) return box;
    box = el("div", null, {
      id: "aw-np-awake-toast",
      kids: [
        el("span", "awake-q", { text: "Sei ancora svegliә?" }),
        el("span", "awake-hint", { text: isMobile ? "Tocca lo schermo per confermare" : "Muovi il mouse o clicca per confermare" })
      ]
    });
    wrap.appendChild(box);
    return box;
  }
  function showWarning(wrap) {
    if (warnOn && warnWrap === wrap) return;
    warnEl(wrap).classList.add("show");
    warnOn = true;
    warnWrap = wrap;
  }
  function hideWarning() {
    warnOn = false;
    try {
      warnWrap?.querySelector("#aw-np-awake-toast")?.classList.remove("show");
    } catch {
    }
    warnWrap = null;
  }
  function markLabel() {
    if (!mark) return null;
    const t = fmt(mark.time);
    return mark.ep ? `EP ${mark.ep} - ${t}` : t;
  }
  function showSuspended(wrap, { goTo, rearm } = {}) {
    if (wrap.querySelector("#aw-np-awake-overlay")) return;
    const label = markLabel();
    const target = mark ? { token: mark.token, time: mark.time } : null;
    const close = () => {
      wrap.querySelector("#aw-np-awake-overlay")?.remove();
      rearm?.();
    };
    const mins = Math.max(1, Math.round(idleMs() / 6e4));
    const kids = [
      el("div", "awake-card-head", {
        kids: [
          el("span", "awake-card-ic", { html: IC.moon }),
          el("span", "awake-card-title", { text: "Rilevato colpo di sonno" }),
          el("button", "awake-card-x", {
            html: IC.close,
            attrs: { type: "button", "aria-label": "Chiudi" },
            on: { click: (e) => {
              e.stopPropagation();
              close();
            } }
          })
        ]
      }),
      el("div", "awake-card-body", { text: `Nessuna attività per ${mins} ${mins === 1 ? "minuto" : "minuti"},` }),
      el("div", "awake-card-body", { text: "auto-next sospeso per sicurezza." })
    ];
    if (label) {
      const go = el("button", "awake-card-go", {
        text: label,
        attrs: { type: "button" },
        on: {
          click: (e) => {
            e.stopPropagation();
            if (!target?.token) return;
            close();
            if (curVideo && target.token === currentToken()) {
              curVideo.currentTime = target.time;
              curVideo.play?.().catch?.(() => {
              });
              return;
            }
            setPendingSeek(target.token, target.time);
            goTo?.(target.token);
          }
        }
      });
      if (!target?.token) go.disabled = true;
      kids.push(el("div", "awake-card-mark", { kids: [el("span", null, { text: "Ultima attività: " }), go] }));
    }
    const card = el("div", null, { id: "aw-np-awake-card", kids, on: { click: (e) => e.stopPropagation() } });
    const overlay = el("div", null, { id: "aw-np-awake-overlay", kids: [card], on: { click: close } });
    wrap.appendChild(overlay);
    hideWarning();
  }
  function awakeTick(video, wrap) {
    curVideo = video;
    curWrap = wrap;
    wire();
    if (!mark) takeMark();
    if (!active()) {
      if (warnOn) hideWarning();
      return;
    }
    if (idleMs() >= AWAKE_IDLE_MS) showWarning(wrap);
    else if (warnOn) hideWarning();
  }
  function isAwakeBlocked() {
    return active() && idleMs() >= AWAKE_IDLE_MS;
  }

  // src/player/skip-engine.js
  var validSeg = (s) => !!s && Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start;
  var partAt = (s, t) => {
    if (!validSeg(s)) return null;
    const parts = s.parts || [{ start: s.start, end: s.end }];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (t >= p.start && t < p.end) return { start: p.start, end: p.end, i };
    }
    return null;
  };
  var lastPartStart = (s) => {
    if (!s) return null;
    if (!s.parts) return s.start;
    return s.parts.length ? s.parts[s.parts.length - 1].start : null;
  };
  function buildSkipEngine({ video, wrap, popup, ep, flash }) {
    let db = { exists: false, episodes: {} };
    let segs = { op: null, ed: null };
    let skipped = {};
    let lastSkip = null;
    let curKey = null;
    let autoNextDone = false;
    let hasNextEp = null;
    let pendingSuppress = null;
    let dbFetched = false;
    function ensureDb() {
      if (dbFetched) return;
      const malId = getMalId();
      if (!malId) return;
      dbFetched = true;
      fetchSkipDb(malId, getAudioType()).then((d) => {
        db = d;
        loadSegs();
      });
    }
    if (isSkipOn()) ensureDb();
    function loadSegs() {
      const e = db.episodes[String(getEpisodeNum())] || { op: null, ed: null };
      segs = { op: e.op, ed: e.ed };
    }
    function hasNext() {
      if (hasNextEp === null) hasNextEp = !!getAdjacentEpisode("next");
      return hasNextEp;
    }
    function closeOffer() {
      popup.hide();
      curKey = null;
    }
    function doSkip(seg, p, viaAuto) {
      const key = seg + "#" + p.i;
      lastSkip = { start: p.start, ts: Date.now(), key };
      video.currentTime = Number.isFinite(video.duration) ? Math.min(p.end, video.duration - 0.1) : p.end;
      popup.hide();
      if (viaAuto) {
        skipped[key] = true;
        flashToast(wrap, seg === "op" ? "Saltata OP" : "Saltata ED");
      } else if (flash) flash(IC.skip);
    }
    function loadNext() {
      closeOffer();
      ep.next();
    }
    function evaluate() {
      awakeTick(video, wrap);
      if (!isSkipOn()) {
        closeOffer();
        return;
      }
      ensureDb();
      const t = video.currentTime, dur = video.duration;
      if (!Number.isFinite(t) || !Number.isFinite(dur) || dur <= 0) {
        closeOffer();
        return;
      }
      const op = segs.op, ed = segs.ed;
      const edIsEnd = validSeg(ed) && dur - ed.end <= SKIP_END_GAP;
      const opPart = isOpeningOn() ? partAt(op, t) : null;
      const edPart = isEndingOn() && !edIsEnd ? partAt(ed, t) : null;
      const inEndZone = dur > SKIP_END_GAP && t >= dur - SKIP_END_GAP;
      const edTrig = edIsEnd && isEndingOn() ? lastPartStart(ed) : null;
      const inFinalEd = Number.isFinite(edTrig) && t >= edTrig;
      if (isAutoNextOn() && !autoNextDone && !video.seeking && dur > SKIP_END_GAP && hasNext()) {
        if (inFinalEd && isAutoSkipOn() || t >= dur - AUTONEXT_TAIL) {
          autoNextDone = true;
          if (isAwakeBlocked()) {
            closeOffer();
            showSuspended(wrap, { goTo: ep.goTo, rearm: () => {
              autoNextDone = false;
            } });
            return;
          }
          loadNext();
          return;
        }
      }
      const seg = opPart ? "op" : edPart ? "ed" : null;
      const p = opPart || edPart;
      let key = null;
      if (seg) key = seg + "#" + p.i;
      else if (hasNext() && (isAutoNextOn() ? inFinalEd && !isAutoSkipOn() : inEndZone)) key = "next";
      if (pendingSuppress) {
        const s = pendingSuppress;
        pendingSuppress = null;
        if (key && key === s) {
          popup.hide();
          curKey = key;
          return;
        }
      }
      if (key === curKey) return;
      popup.hide();
      curKey = key;
      if (!key) return;
      if (key === "next") {
        popup.show("Prossimo episodio", IC.next, loadNext);
        return;
      }
      if (isAutoSkipOn() && !skipped[key] && !video.seeking) doSkip(seg, p, true);
      else popup.show(seg === "op" ? "Salta intro" : "Salta sigla", IC.skip, () => doSkip(seg, p, false));
    }
    function onSeeked() {
      popup.hide();
      curKey = null;
      evaluate();
    }
    function enabledSegAt() {
      if (!isSkipOn()) return null;
      ensureDb();
      const t = video.currentTime, op = segs.op, ed = segs.ed;
      const opPart = isOpeningOn() ? partAt(op, t) : null;
      if (opPart) return { seg: "op", p: opPart };
      const edPart = isEndingOn() ? partAt(ed, t) : null;
      if (edPart) return { seg: "ed", p: edPart };
      return null;
    }
    function skip() {
      const e = enabledSegAt();
      if (e) doSkip(e.seg, e.p, false);
      else ep.skip();
    }
    function undo() {
      if (isSkipOn() && lastSkip && Date.now() - lastSkip.ts <= SKIP_UNDO_MS) {
        if (lastSkip.key) {
          skipped[lastSkip.key] = true;
          pendingSuppress = lastSkip.key;
        }
        video.currentTime = lastSkip.start;
        lastSkip = null;
        if (flash) flash(IC.undo);
        return;
      }
      ep.undo();
    }
    function reload() {
      skipped = {};
      lastSkip = null;
      autoNextDone = false;
      hasNextEp = null;
      pendingSuppress = null;
      closeOffer();
      loadSegs();
    }
    video.addEventListener("timeupdate", evaluate);
    video.addEventListener("seeked", onSeeked);
    function clear() {
      video.removeEventListener("timeupdate", evaluate);
      video.removeEventListener("seeked", onSeeked);
      popup.hide();
    }
    return { skip, undo, reload, clear };
  }

  // src/player/player-desktop.js
  function buildPlayerDesktop(videoUrl) {
    const { video, vol, muted, _play } = initVideo(videoUrl);
    const { wrap, grad, gradTop, spinner, center, ctrls, timeEl } = buildShellElements();
    const { speedIndEl, speedPopup, updateSpeedInd, showSpeedPopup, clearTimer: clearSpeedTimer } = buildSpeedIndicator(loadSpeed());
    const { bufPctEl, clearTimer: clearBufTimer } = buildBufferingIndicator(video, spinner);
    const { seekWrap, isSeeking } = buildSeekBar(video, true, () => {
      timeEl.textContent = fmt(video.currentTime) + " / " + fmt(video.duration);
    });
    const { settingsPanel, resumeToggle, autoEpToggle, autoPlayToggle, connMonitorToggle, globalToggle, seekSecs: getSeekSecs, speedVal: getSpeedVal, reloadSeek, reloadSpeed } = buildSettingsPanel(video, "Secondi saltati con le freccette.", (v) => {
      updateSpeedInd(v);
      showSpeedPopup(v);
    });
    const { colorPanel, syncCustomInput, updateSwatches, topColorToggle, iconColorToggle, flashToggle, clockToggle, speedPopupToggle, colorGlobalToggle } = buildColorPanel(wrap, null);
    let currentColor = loadColor();
    const { topBar, dotEl, dotBtn, kbdBtn, browserBtn, reportBtn, mailBtn } = buildTopBar(wrap, colorPanel);
    const { bpPanel } = buildBpHomepage();
    const { reportPanel, reset: resetReport, clearReportTimer } = buildReportPanel(wrap);
    const { enter: overlayPauseEnter, exit: overlayPauseExit, disconnect: disconnectOverlayPause } = buildOverlayPause(video, [settingsPanel, colorPanel, reportPanel, bpPanel]);
    const { mailPanel, refresh: refreshMail, setOnUnreadChange, disconnectMail } = buildMailPanel({ onOpen: overlayPauseEnter, onClose: overlayPauseExit });
    let hotkeyMap = loadHotkeys();
    const hkSuffix = (a) => {
      const k = hotkeyMap[a];
      return k ? ` (${k.toUpperCase()})` : "";
    };
    const updateKbdLetter = () => {
      const kl = kbdBtn.querySelector(".aw-np-kbd-letter");
      if (kl) kl.textContent = (hotkeyMap.legend || "a").toUpperCase();
      setTip(kbdBtn, "Hotkey" + hkSuffix("legend"));
    };
    updateKbdLetter();
    const { overlay: hotkeyOverlay, open: openHotkey, close: closeHotkey, isOpen: isHotkeyOpen, isEditing: isEditingHotkey, setMap: setHotkeyMap, destroy: destroyHotkey } = buildHotkeyPanel(hotkeyMap, (m) => {
      hotkeyMap = m;
      updateKbdLetter();
      applyHotkeyTips();
    }, { onOpen: overlayPauseEnter, onClose: overlayPauseExit });
    wrap.appendChild(hotkeyOverlay);
    kbdBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      [settingsPanel, colorPanel, reportPanel, mailPanel, bpPanel].forEach((p) => p.classList.remove("open"));
      openHotkey();
    });
    const btnPlay = mkBtn("aw-btn-play", "", "Riproduci"), btnRestart = mkBtn("aw-btn-restart", IC.restart, "Ricomincia (R)");
    const btnMute = mkBtn("aw-btn-mute", "", muted ? "Audio (M)" : "Muto (M)");
    const btnUndo = mkBtn("aw-btn-undo", IC.undo, "Annulla skip (B)"), btnSkip = mkBtn("aw-btn-skip", IC.skip, "Skip OP/ED (O)");
    const btnPrev = mkBtn("aw-btn-prev", IC.prev, "Precedente (P)"), btnNext = mkBtn("aw-btn-next", IC.next, "Successivo (N)");
    const btnSettings = mkBtn("aw-btn-settings", IC.settings, "Impostazioni"), btnPip = mkBtn("aw-btn-pip", IC.pip, "Picture in Picture");
    const btnFs = mkBtn("aw-btn-fs", "", "Fullscreen (F)");
    const icoPlay = mkIcon(btnPlay, IC.play), icoMute = mkIcon(btnMute, muted ? IC.mute : IC.vol), icoFs = mkIcon(btnFs, IC.fsOn);
    const volGroup = mk("div", "aw-np-vol-group"), volPopup = mk("div", "aw-np-vol-popup"), volPctEl = mk("div", "aw-np-vol-pct"), volEl = mk("input", "aw-np-vol");
    volEl.type = "range";
    volEl.min = 0;
    volEl.max = 100;
    volEl.value = muted ? 0 : Math.round(vol * 100);
    volEl.tabIndex = -1;
    volPctEl.textContent = (muted ? 0 : Math.round(vol * 100)) + "%";
    volPopup.append(volPctEl, volEl);
    volGroup.append(volPopup, btnMute);
    let lastNonZeroVol = muted ? vol || 1 : vol;
    const updateMuteState = () => {
      const m = video.muted || video.volume === 0;
      setIcon(icoMute, m ? IC.mute : IC.vol);
      setTip(btnMute, (m ? "Audio" : "Muto") + hkSuffix("mute"));
    };
    const updateVolUi = () => {
      const pct = video.muted || video.volume === 0 ? 0 : Math.round(video.volume * 100);
      volPctEl.textContent = pct + "%";
      volEl.style.background = `linear-gradient(to top, var(--np-accent,#fff) ${pct}%, rgba(255,255,255,.25) ${pct}%)`;
    };
    updateVolUi();
    const { volFlash, showVolFlash, clearTimer: clearVolFlashTimer } = buildVolFlash(video);
    volEl.addEventListener("input", () => {
      const v = Number(volEl.value) / 100;
      video.volume = v;
      video.muted = v === 0;
      if (v > 0) lastNonZeroVol = v;
      updateMuteState();
      updateVolUi();
      saveVol(v === 0 ? lastNonZeroVol : v, video.muted);
    });
    volEl.addEventListener("pointerup", () => volEl.blur());
    btnMute.addEventListener("click", () => {
      if (video.muted || video.volume === 0) {
        video.muted = false;
        video.volume = lastNonZeroVol;
        volEl.value = Math.round(video.volume * 100);
      } else {
        if (video.volume > 0) lastNonZeroVol = video.volume;
        video.muted = true;
        volEl.value = 0;
      }
      updateMuteState();
      updateVolUi();
      saveVol(video.muted ? lastNonZeroVol : video.volume, video.muted);
      showVolFlash(video.muted ? "down" : "up");
    });
    const bar = mk("div", "aw-np-bar");
    bar.append(btnPlay, btnRestart, volGroup, timeEl, speedIndEl, mk("div", "aw-np-spacer"), btnUndo, btnSkip, btnPrev, btnNext, btnSettings, btnPip, btnFs);
    ctrls.append(seekWrap, bar);
    bindPanelToggle(btnSettings, settingsPanel, [colorPanel, reportPanel, mailPanel, bpPanel]);
    bindPanelToggle(dotBtn, colorPanel, [settingsPanel, reportPanel, mailPanel, bpPanel]);
    bindPanelToggle(reportBtn, reportPanel, [settingsPanel, colorPanel, mailPanel, bpPanel], null, (o) => {
      if (o) resetReport();
    });
    reportPanel.addEventListener("click", (e) => {
      if (e.target === reportPanel) reportPanel.classList.remove("open");
    });
    bindPanelToggle(mailBtn, mailPanel, [settingsPanel, colorPanel, reportPanel, bpPanel]);
    bindPanelToggle(browserBtn, bpPanel, [settingsPanel, colorPanel, reportPanel, mailPanel]);
    mailBtn.addEventListener("click", () => {
      const wasOpen = mailPanel.classList.contains("open");
      if (wasOpen) refreshMail();
    }, true);
    wrap.addEventListener("click", () => {
      settingsPanel.classList.remove("open");
      colorPanel.classList.remove("open");
      reportPanel.classList.remove("open");
      mailPanel.classList.remove("open");
      bpPanel.classList.remove("open");
    });
    wrap.append(video, grad, gradTop, topBar, colorPanel, reportPanel, mailPanel, bpPanel, spinner, bufPctEl, speedPopup, center, settingsPanel, ctrls, volFlash);
    wireMailBadge(mailBtn, setOnUnreadChange, refreshMail);
    const { clearMonitor, panelScaleRO, clearClockTimer, reloadVideo, clearFreezeTimer } = mountCommonChrome(video, wrap, dotEl, currentColor, _play, { mobile: false, freezeTip: "Sblocca video (S)" });
    let hideTimer = null;
    const showUi = () => {
      wrap.classList.add("ui");
      clearTimeout(hideTimer);
      if (!video.paused) hideTimer = setTimeout(() => {
        if (settingsPanel.classList.contains("open") || colorPanel.classList.contains("open") || reportPanel.classList.contains("open") || mailPanel.classList.contains("open") || bpPanel.classList.contains("open")) return;
        wrap.classList.remove("ui");
      }, HIDE_DELAY_MS);
    };
    wrap.addEventListener("pointermove", showUi);
    wrap.addEventListener("pointerleave", () => {
      if (!video.paused) wrap.classList.remove("ui");
    });
    video.addEventListener("pause", () => {
      if (video.dataset.silentReload) return;
      wrap.classList.add("ui");
      clearTimeout(hideTimer);
    });
    video.addEventListener("play", () => {
      if (video.dataset.silentReload) return;
      showUi();
    });
    const { flash, flashBrief, playPauseFlash, setSkipFlash, clearTimer: clearCenterTimer } = buildCenterFlash(center);
    [btnPlay, btnRestart, btnMute, btnUndo, btnSkip, btnPrev, btnNext, btnSettings, btnPip, btnFs].forEach(addRipple);
    const toggle = () => video.paused ? _play() : video.pause();
    video.addEventListener("click", toggle);
    video.addEventListener("dblclick", () => btnFs.click());
    btnPlay.addEventListener("click", toggle);
    wirePlayPauseEvents({ video, onUpdate: (p) => {
      setIcon(icoPlay, p ? IC.pause : IC.play);
      setTip(btnPlay, p ? "Pausa" : "Riproduci");
    }, playPauseFlash });
    const ep = buildEpisodeActions({ video, _play, flash });
    const skipPopup = buildSkipPopup(wrap);
    const skipEng = buildSkipEngine({ video, wrap, popup: skipPopup, ep, flash });
    btnRestart.addEventListener("click", ep.restart);
    btnSkip.addEventListener("click", skipEng.skip);
    btnUndo.addEventListener("click", skipEng.undo);
    btnPrev.addEventListener("click", ep.prev);
    btnNext.addEventListener("click", ep.next);
    buildPipHandler({ video, btnPip, wrap, onEnter: () => setTip(btnPip, "Chiudi PiP"), onLeave: () => setTip(btnPip, "Picture in Picture") });
    btnFs.addEventListener("click", () => fsElement() ? fsExit() : fsRequest(wrap));
    const { showResumeToast, stopSaving, saveNow: saveResumeNow, setToken: setResumeToken, episodeEnded } = buildResumeLogic(video, wrap, getSpeedVal);
    const onFs = () => {
      const isFs = !!fsElement();
      wrap.classList.toggle("fs", isFs);
      if (isFs && isAutoPlayOn() && video.paused && !episodeEnded()) _play();
      setTimeout(() => {
        setIcon(icoFs, isFs ? IC.fsOff : IC.fsOn);
        setTip(btnFs, (isFs ? "Esci" : "Fullscreen") + hkSuffix("fullscreen"));
      }, 0);
    };
    const hkAction = { fullscreen: () => btnFs.click(), mute: () => btnMute.click(), restart: () => btnRestart.click(), skipOp: () => btnSkip.click(), undoSkip: () => btnUndo.click(), prev: () => btnPrev.click(), next: () => btnNext.click(), reload: () => reloadVideo(true), homepage: () => browserBtn.click(), report: () => reportBtn.click(), mailbox: () => mailBtn.click() };
    const hkName = { restart: ["Ricomincia", btnRestart], skipOp: ["Skip OP/ED", btnSkip], undoSkip: ["Annulla skip", btnUndo], prev: ["Precedente", btnPrev], next: ["Successivo", btnNext], homepage: ["Homepage", browserBtn], report: ["Segnala", reportBtn], mailbox: ["Mail", mailBtn] };
    const applyHotkeyTips = () => {
      for (const a in hkName) {
        const [name, btn] = hkName[a];
        setTip(btn, name + hkSuffix(a));
      }
      updateMuteState();
      setTip(btnFs, (fsElement() ? "Esci" : "Fullscreen") + hkSuffix("fullscreen"));
    };
    applyHotkeyTips();
    const onKey = (e) => {
      if (pipElement()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = document.activeElement?.tagName ?? "", editable = document.activeElement?.isContentEditable;
      if (/INPUT|TEXTAREA/.test(tag) || editable) return;
      const k = (e.key || "").toLowerCase();
      const legendKey = hotkeyMap.legend || "a";
      if (isHotkeyOpen()) {
        if (isEditingHotkey()) return;
        if (e.key === "Escape" || k === legendKey) {
          e.preventDefault();
          closeHotkey();
        }
        return;
      }
      if (mailPanel.classList.contains("open")) {
        if (e.key === "Escape") {
          e.preventDefault();
          mailPanel.classList.remove("open");
        }
        return;
      }
      if (k === legendKey) {
        e.preventDefault();
        openHotkey();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        video.currentTime = Math.min(video.duration || 0, video.currentTime + getSeekSecs());
        flashBrief(IC.seekFwd);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - getSeekSecs());
        flashBrief(IC.seekBwd);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        video.volume = Math.min(1, video.volume + 0.1);
        video.muted = false;
        lastNonZeroVol = video.volume;
        volEl.value = Math.round(video.volume * 100);
        saveVol(video.volume, false);
        updateMuteState();
        updateVolUi();
        showVolFlash("up");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        video.volume = Math.max(0, video.volume - 0.1);
        video.muted = video.volume === 0;
        if (video.volume > 0) lastNonZeroVol = video.volume;
        volEl.value = Math.round(video.volume * 100);
        saveVol(video.muted ? lastNonZeroVol : video.volume, video.muted);
        updateMuteState();
        updateVolUi();
        showVolFlash("down");
        return;
      }
      if (e.key >= "0" && e.key <= "9" && video.duration) {
        e.preventDefault();
        const t = video.duration * (parseInt(e.key, 10) / 10);
        flashBrief(t > video.currentTime ? IC.seekFwd : IC.seekBwd);
        video.currentTime = t;
        return;
      }
      for (const a in hkAction) {
        if (hotkeyMap[a] === k) {
          e.preventDefault();
          hkAction[a]();
          return;
        }
      }
    };
    const prefsCtx = { resumeToggle, autoEpToggle, autoPlayToggle, connMonitorToggle, globalToggle, reloadSeek, reloadSpeed, updateSpeedInd, showSpeedPopup, getSpeedVal, getColor: () => currentColor, setColor: (c) => {
      currentColor = c;
    }, wrap, dotEl, syncCustomInput, updateSwatches, iconColorToggle, topColorToggle, flashToggle, clockToggle, speedPopupToggle, colorGlobalToggle };
    const onStorage = (e) => {
      if (!e.key?.startsWith("aw-np-")) return;
      runPrefsSync(prefsCtx);
      if (e.key === KEY_HOTKEYS && !isEditingHotkey()) {
        hotkeyMap = loadHotkeys();
        updateKbdLetter();
        setHotkeyMap?.(hotkeyMap);
        applyHotkeyTips();
      }
    };
    const onUnload = () => {
      if (!episodeEnded()) saveResumeNow();
    };
    const removeFs = fsChange(onFs);
    const detachExit = attachExitSavers(onUnload, onStorage);
    document.addEventListener("keydown", onKey);
    setCleanup(() => {
      removeFs();
      document.removeEventListener("keydown", onKey);
      destroyHotkey?.();
      detachExit();
      stopSaving();
      setStopSavingFn(null);
      clearTimeout(hideTimer);
      clearCenterTimer();
      clearVolFlashTimer();
      clearSpeedTimer();
      clearFreezeTimer();
      clearClockTimer();
      clearMonitor();
      clearBufTimer();
      clearReportTimer();
      disconnectMail();
      disconnectOverlayPause();
      skipEng.clear();
      panelScaleRO.disconnect();
      setSkipFlash(true);
      teardownVideo(video);
      setCleanup(null);
    });
    wrap._play = () => _play();
    wrap._showResumeTst = (s) => showResumeToast(s);
    wrap._setSkipFlash = setSkipFlash;
    wrap._setResumeToken = (t) => setResumeToken(t);
    wrap._skipReload = () => skipEng.reload();
    return wrap;
  }

  // src/player/player-mobile.js
  function buildPlayerMobile(videoUrl) {
    const { video, vol, muted, _play } = initVideo(videoUrl);
    const { wrap, grad, gradTop, spinner, center, ctrls, timeEl } = buildShellElements();
    const { flash, flashBrief, setSkipFlash, clearTimer: clearCenterTimer } = buildCenterFlash(center);
    const ep = buildEpisodeActions({ video, _play, flash });
    const skipPopup = buildSkipPopup(wrap);
    const skipEng = buildSkipEngine({ video, wrap, popup: skipPopup, ep, flash });
    const { speedIndEl, speedPopup, updateSpeedInd, showSpeedPopup, clearTimer: clearSpeedTimer } = buildSpeedIndicator(loadSpeed());
    const { bufPctEl, clearTimer: clearBufTimer } = buildBufferingIndicator(video, spinner);
    const { seekWrap, isSeeking } = buildSeekBar(video, false, () => {
      timeEl.textContent = fmt(video.currentTime) + " / " + fmt(video.duration);
    });
    const mkMBtn = (id, html) => {
      const b = mk("button");
      b.className = "np-btn";
      b.id = id;
      b.innerHTML = html;
      b.tabIndex = -1;
      return b;
    };
    const btnPlay = mkMBtn("aw-btn-play", IC.play), btnMute = mkMBtn("aw-btn-mute", muted ? IC.mute : IC.vol);
    const btnPip = mkMBtn("aw-btn-pip", IC.pip), btnSettings = mkMBtn("aw-btn-settings", IC.settings);
    const btnMenu = mkMBtn("aw-btn-menu", IC.menu), btnFs = mkMBtn("aw-btn-fs", IC.fsOn);
    const btnRestart = mkMBtn("aw-btn-restart", IC.restart), btnUndo = mkMBtn("aw-btn-undo", IC.undo);
    const btnSkip = mkMBtn("aw-btn-skip", IC.skip), btnPrev = mkMBtn("aw-btn-prev", IC.prev), btnNext = mkMBtn("aw-btn-next", IC.next);
    const spacer = mk("div", "aw-np-spacer");
    const bar = mk("div", "aw-np-bar");
    [btnRestart, btnUndo, btnSkip, btnPrev, btnNext].forEach((b) => b.classList.add("np-landscape-only"));
    btnMenu.classList.add("np-portrait-only");
    bar.append(btnPlay, btnRestart, btnMute, timeEl, speedIndEl, spacer, btnUndo, btnSkip, btnPrev, btnNext, btnMenu, btnSettings, btnPip, btnFs);
    ctrls.append(seekWrap, bar);
    const menuPanel = mk("div", "aw-np-menu-panel");
    const mkMenuBtn = (html, label, onClick) => {
      const b = document.createElement("button");
      b.className = "np-menu-btn";
      b.innerHTML = html + `<span>${label}</span>`;
      b.addEventListener("click", () => {
        menuPanel.classList.remove("open");
        onClick();
      });
      return b;
    };
    menuPanel.append(
      mkMenuBtn(IC.restart, "Ricomincia", ep.restart),
      mkMenuBtn(IC.undo, "Annulla skip", skipEng.undo),
      mkMenuBtn(IC.skip, "Skip OP/ED", skipEng.skip),
      mkMenuBtn(IC.prev, "Episodio prec.", ep.prev),
      mkMenuBtn(IC.next, "Episodio succ.", ep.next)
    );
    const { settingsPanel, resumeToggle, autoEpToggle, autoPlayToggle, connMonitorToggle, seekSecs: getSeekSecs, speedVal: getSpeedVal, reloadSeek, reloadSpeed } = buildSettingsPanel(video, "Secondi saltati col doppio tap.", (v) => {
      updateSpeedInd(v);
      showSpeedPopup(v);
    });
    const { colorPanel, syncCustomInput, updateSwatches, topColorToggle, iconColorToggle, flashToggle, clockToggle, speedPopupToggle, colorGlobalToggle } = buildColorPanel(wrap, null);
    let currentColor = loadColor();
    const { topBar, dotEl, dotBtn, browserBtn, reportBtn, mailBtn } = buildTopBar(wrap, colorPanel);
    const { bpPanel } = buildBpHomepage();
    const { reportPanel, reset: resetReport, clearReportTimer } = buildReportPanel(wrap);
    const { enter: overlayPauseEnter, exit: overlayPauseExit, disconnect: disconnectOverlayPause } = buildOverlayPause(video, [settingsPanel, colorPanel, reportPanel, bpPanel]);
    const { mailPanel, refresh: refreshMail, setOnUnreadChange, disconnectMail } = buildMailPanel({ onOpen: overlayPauseEnter, onClose: overlayPauseExit });
    const playCenter = mk("div", "aw-np-play-center");
    playCenter.classList.add("np-ui-layer");
    playCenter.innerHTML = IC.play;
    const seekFlashLeft = document.createElement("div");
    seekFlashLeft.className = "np-seek-flash";
    seekFlashLeft.id = "aw-np-seek-flash-left";
    seekFlashLeft.innerHTML = IC.seekBwd;
    const seekFlashRight = document.createElement("div");
    seekFlashRight.className = "np-seek-flash";
    seekFlashRight.id = "aw-np-seek-flash-right";
    seekFlashRight.innerHTML = IC.seekFwd;
    const volBarLeft = document.createElement("div");
    volBarLeft.id = "aw-np-vol-bar-left";
    const volBarRight = document.createElement("div");
    volBarRight.id = "aw-np-vol-bar-right";
    const BAR_S = "position:absolute;top:0;bottom:0;width:25%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity var(--np-t-slow) var(--np-ease);z-index:50;";
    volBarLeft.style.cssText = BAR_S + "left:0;";
    volBarRight.style.cssText = BAR_S + "right:0;";
    const mkVolBarInner = () => {
      const inner = document.createElement("div");
      inner.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;background:var(--np-surf-2);border:var(--np-line);border-radius:var(--np-r-lg);padding:10px 0 12px;width:44px;height:48%;box-shadow:var(--np-elev-2);";
      const pct = document.createElement("div");
      pct.style.cssText = "font-size:var(--np-fs-small);font-weight:500;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));width:32px;text-align:center;font-variant-numeric:tabular-nums;letter-spacing:.02em;";
      const track = document.createElement("div");
      track.style.cssText = "position:relative;width:4px;flex:1;border-radius:var(--np-r-xs);background:rgba(255,255,255,.2);flex-shrink:0;";
      const fill = document.createElement("div");
      fill.style.cssText = "position:absolute;bottom:0;left:0;right:0;border-radius:var(--np-r-xs);background:var(--np-accent,#fff);";
      track.appendChild(fill);
      inner.append(pct, track);
      return { inner, pct, fill };
    };
    const { inner: volInnerL, pct: volPctL, fill: volBarFillL } = mkVolBarInner();
    const { inner: volInnerR, pct: volPctR, fill: volBarFillR } = mkVolBarInner();
    volBarLeft.appendChild(volInnerL);
    volBarRight.appendChild(volInnerR);
    let lastNonZeroVol = muted ? vol || 1 : vol;
    const { volFlash, showVolFlash, clearTimer: clearVolFlashTimer } = buildVolFlash(video);
    wrap.append(video, grad, gradTop, topBar, colorPanel, reportPanel, mailPanel, bpPanel, menuPanel, settingsPanel, spinner, bufPctEl, speedPopup, center, playCenter, seekFlashLeft, seekFlashRight, volBarLeft, volBarRight, volFlash, ctrls);
    const { clearMonitor, panelScaleRO, clearClockTimer, reloadVideo, clearFreezeTimer } = mountCommonChrome(video, wrap, dotEl, currentColor, _play, { mobile: true, freezeTip: "Sblocca video" });
    let hideTimer = null;
    const toggle = () => video.paused ? _play() : video.pause();
    const closepanels = () => {
      settingsPanel.classList.remove("open");
      colorPanel.classList.remove("open");
      menuPanel.classList.remove("open");
      reportPanel.classList.remove("open");
      mailPanel.classList.remove("open");
      bpPanel.classList.remove("open");
    };
    const startHideTimer = () => {
      clearTimeout(hideTimer);
      if (!video.paused) hideTimer = setTimeout(() => {
        if (!wrap.querySelector(".open")) wrap.classList.remove("ui");
      }, HIDE_DELAY_MS);
    };
    const showUi = () => {
      closepanels();
      wrap.classList.add("ui");
      startHideTimer();
    };
    const hideUi = () => {
      wrap.classList.remove("ui");
      clearTimeout(hideTimer);
    };
    const isOnControls = (e) => {
      const t = e.target;
      return t && (t.closest("#aw-np-controls") || t.closest("#aw-np-top") || t.closest("#aw-np-settings-panel") || t.closest("#aw-np-color-panel") || t.closest("#aw-np-menu-panel") || t.closest("#aw-np-report-panel") || t.closest("#aw-np-mail-panel") || t.closest("#aw-np-bp-panel"));
    };
    video.addEventListener("pause", () => {
      if (video.dataset.silentReload) return;
      wrap.classList.add("ui");
      clearTimeout(hideTimer);
    });
    video.addEventListener("play", () => {
      if (video.dataset.silentReload) return;
      showUi();
    });
    [btnPlay, btnMute, btnPip, btnSettings, btnMenu, btnFs].forEach(addRipple);
    btnPlay.addEventListener("click", toggle);
    playCenter.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });
    wirePlayPauseEvents({ video, onUpdate: (p) => {
      const html = p ? IC.pause : IC.play;
      btnPlay.innerHTML = html;
      playCenter.innerHTML = html;
    } });
    btnRestart.addEventListener("click", ep.restart);
    btnUndo.addEventListener("click", skipEng.undo);
    btnSkip.addEventListener("click", skipEng.skip);
    btnPrev.addEventListener("click", ep.prev);
    btnNext.addEventListener("click", ep.next);
    btnMute.addEventListener("click", () => {
      if (video.muted || video.volume === 0) {
        video.muted = false;
        video.volume = lastNonZeroVol;
      } else {
        if (video.volume > 0) lastNonZeroVol = video.volume;
        video.muted = true;
      }
      const m = video.muted || video.volume === 0;
      btnMute.innerHTML = m ? IC.mute : IC.vol;
      saveVol(video.muted ? lastNonZeroVol : video.volume, video.muted);
      showVolFlash(video.muted ? "down" : "up");
    });
    buildPipHandler({ video, btnPip, wrap });
    let mobileFs = false;
    const setMobileFs = (state) => {
      mobileFs = state;
      btnFs.innerHTML = state ? IC.fsOff : IC.fsOn;
    };
    btnFs.addEventListener("click", () => {
      if (mobileFs) {
        document.exitFullscreen?.()?.catch?.(() => {
        });
      } else {
        wrap.requestFullscreen?.()?.catch?.(() => {
        });
      }
    });
    const lockLandscape = () => {
      try {
        const p = screen.orientation?.lock?.("landscape");
        if (p && p.catch) p.catch(() => {
        });
      } catch (e) {
      }
    };
    const unlockOrient = () => {
      try {
        screen.orientation?.unlock?.();
      } catch (e) {
      }
    };
    const removeFsM = fsChange(() => {
      const fs = !!document.fullscreenElement;
      wrap.classList.toggle("fs", fs);
      if (fs) lockLandscape();
      else unlockOrient();
      if (fs && isAutoPlayOn() && video.paused && !episodeEnded()) _play();
      setTimeout(() => setMobileFs(fs), 0);
    });
    bindPanelToggle(btnSettings, settingsPanel, [menuPanel, colorPanel, reportPanel, mailPanel, bpPanel], startHideTimer);
    bindPanelToggle(btnMenu, menuPanel, [settingsPanel, colorPanel, reportPanel, mailPanel, bpPanel], startHideTimer);
    bindPanelToggle(dotBtn, colorPanel, [settingsPanel, menuPanel, reportPanel, mailPanel, bpPanel], startHideTimer);
    bindPanelToggle(reportBtn, reportPanel, [settingsPanel, colorPanel, menuPanel, mailPanel, bpPanel], startHideTimer, (o) => {
      if (o) resetReport();
    });
    reportPanel.addEventListener("click", (e) => {
      if (e.target === reportPanel) reportPanel.classList.remove("open");
    });
    bindPanelToggle(mailBtn, mailPanel, [settingsPanel, colorPanel, menuPanel, reportPanel, bpPanel], startHideTimer);
    bindPanelToggle(browserBtn, bpPanel, [settingsPanel, colorPanel, menuPanel, reportPanel, mailPanel], startHideTimer);
    mailBtn.addEventListener("click", () => {
      const wasOpen = mailPanel.classList.contains("open");
      if (wasOpen) refreshMail();
    }, true);
    wireMailBadge(mailBtn, setOnUnreadChange, refreshMail);
    wrap.addEventListener("click", (e) => {
      if (isOnControls(e)) return;
      closepanels();
      startHideTimer();
    });
    let volBarTimer = null;
    const updateVolBars = () => {
      const pct = (video.muted ? 0 : video.volume) * 100;
      const ps = Math.round(pct) + "%";
      volBarFillL.style.height = pct + "%";
      volBarFillR.style.height = pct + "%";
      volPctL.textContent = ps;
      volPctR.textContent = ps;
    };
    let volSliding = false, volSlideStartY = 0, volSlideStartX = 0, volSlideStartVol = 0, volSlideEndTime = 0;
    const isFullscreenLandscape = () => window.innerWidth > window.innerHeight && (!!document.fullscreenElement || window.innerHeight === screen.height || window.innerWidth === screen.width);
    const updateVolBarPosition = () => {
      if (window.innerWidth < window.innerHeight) {
        const vRect = video.getBoundingClientRect();
        const wRect = wrap.getBoundingClientRect();
        const bandH = vRect.top - wRect.top;
        const topPct = bandH > 20 ? (bandH / 2 - 30) / wRect.height * 100 + "%" : "10%";
        volBarLeft.style.alignItems = "flex-start";
        volBarRight.style.alignItems = "flex-start";
        volBarLeft.style.paddingTop = topPct;
        volBarRight.style.paddingTop = topPct;
      } else {
        volBarLeft.style.alignItems = "center";
        volBarRight.style.alignItems = "center";
        volBarLeft.style.paddingTop = "0";
        volBarRight.style.paddingTop = "0";
      }
    };
    video.addEventListener("contextmenu", (e) => e.preventDefault());
    wrap.addEventListener("touchstart", (e) => {
      if (isOnControls(e)) return;
      if (!isFullscreenLandscape()) return;
      const touch = e.touches[0];
      if (touch.clientX < 8 || touch.clientX > window.innerWidth - 8 || touch.clientY < 20) return;
      const rect = wrap.getBoundingClientRect(), x = touch.clientX - rect.left, quarter = rect.width / 5;
      if (x < quarter || x > rect.width - quarter) {
        volSliding = false;
        volSlideStartY = touch.clientY;
        volSlideStartX = touch.clientX;
        volSlideStartVol = video.muted ? 0 : video.volume;
      }
    }, { passive: true });
    wrap.addEventListener("touchmove", (e) => {
      if (isOnControls(e)) return;
      if (!isFullscreenLandscape()) return;
      const touch = e.touches[0], rect = wrap.getBoundingClientRect(), x = touch.clientX - rect.left, quarter = rect.width / 5;
      if (x >= quarter && x <= rect.width - quarter) return;
      const dy = volSlideStartY - touch.clientY, dx = touch.clientX - volSlideStartX;
      if (!volSliding && Math.abs(dx) > Math.abs(dy)) return;
      if (!volSliding && Math.abs(dy) < 10) return;
      volSliding = true;
      const newVol = Math.max(0, Math.min(1, volSlideStartVol + dy / rect.height));
      video.volume = newVol;
      video.muted = newVol === 0;
      const m = video.muted || video.volume === 0;
      btnMute.innerHTML = m ? IC.mute : IC.vol;
      if (newVol > 0) lastNonZeroVol = newVol;
      saveVol(newVol === 0 ? lastNonZeroVol : newVol, newVol === 0);
      updateVolBars();
      updateVolBarPosition();
      const slidingLeft = x < quarter;
      if (slidingLeft) {
        volBarRight.style.opacity = "1";
        volBarLeft.style.opacity = "0";
      } else {
        volBarLeft.style.opacity = "1";
        volBarRight.style.opacity = "0";
      }
      clearTimeout(volBarTimer);
      volBarTimer = setTimeout(() => {
        volBarLeft.style.opacity = "0";
        volBarRight.style.opacity = "0";
      }, 1500);
    }, { passive: true });
    wrap.addEventListener("touchend", () => {
      if (volSliding) volSlideEndTime = Date.now();
      volSliding = false;
    });
    wrap.addEventListener("touchcancel", () => {
      if (volSliding) volSlideEndTime = Date.now();
      volSliding = false;
    });
    let tapTimer = null, lastTap = 0, seekFlashLTimer = null, seekFlashRTimer = null;
    wrap.addEventListener("click", (e) => {
      if (isOnControls(e)) return;
      if (isSeeking()) return;
      if (Date.now() - volSlideEndTime < 300) return;
      const now = Date.now(), rect = wrap.getBoundingClientRect(), x = e.clientX - rect.left, quarter = rect.width / 5;
      const inCenter = x >= quarter && x <= rect.width - quarter;
      if (now - lastTap < 300) {
        clearTimeout(tapTimer);
        if (x < quarter) {
          video.currentTime = Math.max(0, video.currentTime - getSeekSecs());
          flashBrief(IC.seekBwd);
          seekFlashLeft.classList.add("on");
          clearTimeout(seekFlashLTimer);
          seekFlashLTimer = setTimeout(() => seekFlashLeft.classList.remove("on"), 400);
        } else if (x > rect.width - quarter) {
          video.currentTime = Math.min(video.duration || 0, video.currentTime + getSeekSecs());
          flashBrief(IC.seekFwd);
          seekFlashRight.classList.add("on");
          clearTimeout(seekFlashRTimer);
          seekFlashRTimer = setTimeout(() => seekFlashRight.classList.remove("on"), 400);
        } else if (inCenter) toggle();
        lastTap = 0;
      } else {
        tapTimer = setTimeout(() => {
          if (wrap.classList.contains("ui")) hideUi();
          else showUi();
        }, 200);
        lastTap = now;
      }
    });
    const { showResumeToast, stopSaving, saveNow: saveResumeNow, setToken: setResumeToken, episodeEnded } = buildResumeLogic(video, wrap, getSpeedVal);
    const prefsCtx = { resumeToggle, autoEpToggle, autoPlayToggle, connMonitorToggle, reloadSeek, reloadSpeed, updateSpeedInd, showSpeedPopup, getSpeedVal, getColor: () => currentColor, setColor: (c) => {
      currentColor = c;
    }, wrap, dotEl, syncCustomInput, updateSwatches, iconColorToggle, topColorToggle, flashToggle, clockToggle, speedPopupToggle, colorGlobalToggle };
    const onStorage = (e) => {
      if (!e.key?.startsWith("aw-np-")) return;
      runPrefsSync(prefsCtx);
    };
    const onUnload = () => {
      if (!episodeEnded()) saveResumeNow();
    };
    const detachExit = attachExitSavers(onUnload, onStorage);
    setCleanup(() => {
      removeFsM();
      detachExit();
      stopSaving();
      setStopSavingFn(null);
      clearTimeout(hideTimer);
      clearCenterTimer();
      clearVolFlashTimer();
      clearTimeout(volBarTimer);
      clearTimeout(seekFlashLTimer);
      clearTimeout(seekFlashRTimer);
      clearTimeout(tapTimer);
      clearSpeedTimer();
      clearFreezeTimer();
      clearClockTimer();
      clearMonitor();
      clearBufTimer();
      clearReportTimer();
      disconnectMail();
      disconnectOverlayPause();
      skipEng.clear();
      panelScaleRO.disconnect();
      setSkipFlash(true);
      teardownVideo(video);
      setCleanup(null);
    });
    wrap._play = () => _play();
    wrap._showResumeTst = (s) => showResumeToast(s);
    wrap._setSkipFlash = setSkipFlash;
    wrap._setResumeToken = (t) => setResumeToken(t);
    wrap._skipReload = () => skipEng.reload();
    return wrap;
  }

  // src/state/episode-auto.js
  var saveLastEpisode = (t) => {
    const a = animeId();
    if (a) lsSet(KEY_AUTOEP_PFX + a, t);
  };
  var loadLastEpisode = () => {
    const a = animeId();
    return a ? lsGet(KEY_AUTOEP_PFX + a) : null;
  };

  // src/player/player-controls.js
  function mountPlayer(url) {
    if (!url) return;
    const container = document.querySelector("#player");
    if (!container) return;
    const existing = container.querySelector("#aw-np-video");
    if (existing && existing.getAttribute("src") === url) return;
    {
      const _c = getCleanup();
      if (_c) _c();
    }
    injectStyle();
    container.innerHTML = "";
    const wrap = buildPlayer(url);
    container.appendChild(wrap);
  }
  function injectStyle() {
    isMobile ? injectStyleMobile() : injectStyleDesktop();
  }
  function buildPlayer(url) {
    return isMobile ? buildPlayerMobile(url) : buildPlayerDesktop(url);
  }
  function swapVideoSrc(url) {
    const video = document.querySelector("#aw-np-video");
    if (!video) {
      mountPlayer(url);
      return;
    }
    if (video.getAttribute("src") === url) return;
    const wrap = document.querySelector("#aw-np");
    const swapToken = getActiveToken();
    const swapKey = KEY_RESUME_PFX + (swapToken || location.pathname);
    const swapSaved = parseFloat(lsGet(swapKey) ?? "");
    wrap?._setResumeToken(swapToken);
    wrap?._setSkipFlash(true);
    video.pause();
    video.src = url;
    video.addEventListener("loadedmetadata", () => {
      const spd = loadSpeed();
      if (video.playbackRate !== spd) video.playbackRate = spd;
      const marked = takePendingSeek(swapToken);
      if (marked != null && isFinite(video.duration)) {
        video.currentTime = Math.min(marked, video.duration - 0.1);
        wrap?._showResumeTst(video.currentTime);
      } else if (isResumeOn()) {
        if (swapSaved >= RESUME_MIN_POS && isFinite(video.duration) && video.duration - swapSaved >= RESUME_END_GAP) {
          video.currentTime = swapSaved;
          wrap?._showResumeTst(swapSaved);
        }
      }
      wrap?._skipReload?.();
      if (isAutoPlayOn() && !!fsElement()) {
        wrap?._play();
        video.addEventListener("playing", () => wrap?._setSkipFlash(false), { once: true });
      } else {
        wrap?._setSkipFlash(false);
      }
    }, { once: true });
    ["#aw-np-seek-fill", "#aw-np-seek-thumb", "#aw-np-seek-buf"].forEach((sel, i) => {
      const el2 = document.querySelector(sel);
      if (el2) el2.style[i === 1 ? "left" : "width"] = "0%";
    });
    const timeEl = document.querySelector("#aw-np-time");
    if (timeEl) timeEl.textContent = "00:00 / 00:00";
  }
  function setActiveEpisode(token) {
    const all = Array.from(document.querySelectorAll(".episode a"));
    const idx = all.findIndex((a) => a.dataset.id === token);
    all.forEach((a, i) => a.classList.toggle("active", i === idx));
    const prevBtn = document.querySelector(".prevnext.prev");
    if (prevBtn) prevBtn.style.display = idx > 0 ? "" : "none";
    const nextBtn = document.querySelector(".prevnext.next");
    if (nextBtn) nextBtn.style.display = idx < all.length - 1 ? "" : "none";
    const epInfoEl = document.querySelector("#aw-np-epinfo");
    if (epInfoEl && idx !== -1) {
      const num = all[idx].textContent.trim() || String(idx + 1);
      const maxNum = all.reduce((m, a) => {
        const n = parseFloat(a.textContent.trim());
        return isNaN(n) ? m : Math.max(m, n);
      }, 0);
      epInfoEl.textContent = `Episodio ${num}/${maxNum > 0 ? maxNum : all.length}`;
    }
    if (idx === -1) return;
    const epData = all[idx].dataset;
    const episodeId = epData.episodeId, epNum = epData.num || epData.episodeNum;
    const player = document.querySelector("#player");
    if (player) {
      player.dataset.id = token;
      if (episodeId) player.dataset.episodeId = episodeId;
      if (epNum) player.dataset.num = epNum;
    }
    document.querySelectorAll(".episodeNum").forEach((el2) => el2.textContent = epNum || "");
    const _animeId = document.querySelector("#player")?.dataset.animeId || "";
    const _csrf = document.querySelector('meta[name="csrf-token"]')?.content || "";
    const _updatePageMeta = (eId, num) => {
      fetchWithRetry(`/api/episode/download?id=${eId}`, { credentials: "same-origin" }).then((r) => r.json()).then((data) => {
        const dl = document.querySelector("#downloadLink");
        if (dl && data?.url) dl.href = data.url;
      }).catch(() => {
      });
      if (!_animeId) return;
      fetchWithRetry(`/api/comments/anime/get/${_animeId}/${eId}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "CSRF-Token": _csrf, "Content-Type": "application/x-www-form-urlencoded" }
      }).then((r) => r.text()).then((html) => {
        const el2 = document.querySelector("#comments-scrollover-wrapper");
        if (el2) el2.innerHTML = html;
        document.querySelector("#episode-comment")?.classList.add("active");
        const sp = document.querySelector("#episode-comment span");
        if (sp) sp.textContent = num;
        document.querySelectorAll("#anime-comment,#rules").forEach((e) => e.classList.remove("active"));
        pageWin.loadSideFeatures?.();
      }).catch(() => {
      });
    };
    if (episodeId) _updatePageMeta(episodeId, epNum);
  }
  function showLoadError(token) {
    const msg = "Impossibile caricare l'episodio. Tocca per riprovare.";
    const retry = () => {
      document.querySelector("#aw-np #aw-np-load-error-toast")?.remove();
      document.getElementById("aw-np-load-error")?.remove();
      if (token) loadEpisode(token);
      else location.reload();
    };
    const wrap = document.querySelector("#aw-np");
    if (wrap) {
      wrap.querySelector("#aw-np-load-error-toast")?.remove();
      const t = document.createElement("div");
      t.id = "aw-np-load-error-toast";
      t.textContent = msg;
      t.addEventListener("click", retry, { once: true });
      wrap.appendChild(t);
      return;
    }
    const container = document.querySelector("#player");
    if (!container) return;
    let box = document.getElementById("aw-np-load-error");
    if (!box) {
      box = document.createElement("div");
      box.id = "aw-np-load-error";
      box.style.cssText = "display:flex;align-items:center;justify-content:center;min-height:220px;padding:24px;text-align:center;color:#fff;background:#111;border-radius:12px;cursor:pointer;font:500 15px Roboto,sans-serif";
      container.appendChild(box);
    }
    box.textContent = msg;
    box.onclick = retry;
  }
  function loadEpisode(token) {
    if (!token) return;
    {
      const _s = getStopSavingFn();
      if (_s) {
        _s();
        setStopSavingFn(null);
      }
    }
    const vid = document.querySelector("#aw-np-video");
    if (vid && getActiveToken()) saveResumePos(vid.currentTime);
    setActiveToken(token);
    saveLastEpisode(token);
    setActiveEpisode(token);
    const wasFullscreen = !!fsElement();
    const _preUrl = token === getPreloadedToken() && getPreloadedUrl() ? getPreloadedUrl() : null;
    const _preVid = getPreloadedVideo();
    const _preVidUsed = token === getPreloadedToken() && !!_preVid;
    setPreloadedToken(null);
    setPreloadedUrl(null);
    setPreloadedVideo(null);
    if (_preVid && !_preVidUsed) {
      _preVid.pause();
      _preVid.src = "";
      _preVid.remove();
    }
    const _doLoad = (url) => {
      if (!url) {
        showLoadError(token);
        return;
      }
      const epLink = document.querySelector(`.episode a[data-id="${token}"]`);
      if (epLink?.href) history.replaceState({}, "", epLink.href);
      if (wasFullscreen && !!fsElement()) swapVideoSrc(url);
      else mountPlayer(url);
      if (_preVid && _preVidUsed) setTimeout(() => {
        _preVid.pause();
        _preVid.src = "";
        _preVid.remove();
      }, 4e3);
    };
    if (_preUrl) _doLoad(_preUrl);
    else getUrlForToken(token).then(_doLoad);
  }
  function wireControls() {
    document.querySelectorAll(".episode a").forEach((a) => {
      if (a.dataset.npWired) return;
      a.dataset.npWired = "1";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadEpisode(a.dataset.id);
      });
    });
    document.querySelectorAll(".prevnext").forEach((btn) => {
      if (btn.dataset.npWired) return;
      btn.dataset.npWired = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const t = getAdjacentEpisode(btn.dataset.value);
        if (t) loadEpisode(t.dataset.id);
      });
    });
  }
  function setupPlayerLabel() {
    let labelDone = false;
    const hide = () => {
      ['.control[data-value="original"]', '.control[data-value="alternative"]'].forEach((sel) => document.querySelectorAll(sel).forEach((el2) => {
        if (el2.dataset.npBlocked) return;
        el2.dataset.npBlocked = "1";
        el2.style.setProperty("display", "none", "important");
        el2.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      }));
      if (!document.getElementById("aw-bp-label")) {
        const ref = document.querySelector('.control[data-value="original"]') || document.querySelector('.control[data-value="alternative"]');
        if (!ref) return;
        const label = document.createElement("div");
        label.id = "aw-bp-label";
        label.className = "control active";
        label.style.pointerEvents = "none";
        label.innerHTML = '<i style="color:#ec4f4f;" class="icon icon-random"></i> <span>Better Player</span>';
        ref.insertAdjacentElement("beforebegin", label);
      }
      labelDone = true;
    };
    hide();
    if (labelDone) return;
    const obs = new MutationObserver(() => {
      hide();
      if (labelDone) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  function init() {
    cleanupResumeStorage();
    injectStyle();
    const currentToken2 = document.querySelector("#player")?.dataset?.id;
    if (currentToken2) setActiveToken(currentToken2);
    const lastToken = isAutoEpOn() ? loadLastEpisode() : null;
    const lastValid = !!lastToken && !!document.querySelector(`.episode a[data-id="${lastToken}"]`);
    if (lastValid && lastToken !== currentToken2) {
      loadEpisode(lastToken);
    } else if (currentToken2) {
      saveLastEpisode(currentToken2);
      getUrlForToken(currentToken2).then((url) => {
        if (url) mountPlayer(url);
        else showLoadError(currentToken2);
      });
    } else {
      const link = document.querySelector("#downloadLink");
      const href = link?.getAttribute("href") || "";
      const m = href.match(/[?&]id=(.+)/);
      const url = m ? decodeURIComponent(m[1]) : href.startsWith("http") ? href : null;
      if (url) mountPlayer(url);
      else showLoadError(null);
    }
    wireControls();
    setupPlayerLabel();
  }

  // src/watchlist/watchlist-api.js
  var FOLDERS = [
    { num: 1, str: "watching", label: "In corso" },
    { num: 2, str: "watched", label: "Completato" },
    { num: 3, str: "onhold", label: "In pausa" },
    { num: 4, str: "dropped", label: "Droppato" },
    { num: 5, str: "planned", label: "Da guardare" }
  ];
  var FOLDER_STR_TO_NUM = {};
  var FOLDER_NUM_TO_STR = {};
  var FOLDER_NUM_TO_LABEL = {};
  for (const f of FOLDERS) {
    FOLDER_STR_TO_NUM[f.str] = f.num;
    FOLDER_NUM_TO_STR[f.num] = f.str;
    FOLDER_NUM_TO_LABEL[f.num] = f.label;
  }
  var EDIT_FIELDS = ["folder", "episodes", "rewatches", "notes", "vote"];
  var DEFAULT_BASE = "https://www.animeworld.ac";
  var GLOBAL_WIN = typeof window !== "undefined" ? window : void 0;
  function resolveWin(opts) {
    return opts && opts.win || GLOBAL_WIN;
  }
  function resolveFetch(opts, win) {
    if (opts && opts.fetchImpl) return opts.fetchImpl;
    if (win && typeof win.fetch === "function") return win.fetch.bind(win);
    return typeof fetch !== "undefined" ? fetch : null;
  }
  function baseUrl(win) {
    return win && win.baseURL || DEFAULT_BASE;
  }
  function csrfToken(win = GLOBAL_WIN) {
    try {
      if (win && win.csrfToken) return win.csrfToken;
      const doc = win && win.document || (typeof document !== "undefined" ? document : null);
      return doc?.querySelector('meta[name="csrf-token"]')?.content || "";
    } catch {
      return "";
    }
  }
  function encodeEditBody(fields) {
    const f = fields || {};
    return EDIT_FIELDS.map((k) => `${k}=${encodeURIComponent(f[k] == null ? "" : f[k])}`).join("&");
  }
  async function addOrEdit(animeId2, folderString, opts = {}) {
    const win = resolveWin(opts);
    const doFetch = resolveFetch(opts, win);
    try {
      const url = `${baseUrl(win)}/api/watchlist/addOrEdit/${animeId2}?folder=${folderString}`;
      const res = await doFetch(url, {
        method: "POST",
        headers: { "CSRF-Token": csrfToken(win) },
        credentials: "same-origin"
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error === true) {
        return { ok: false, error: data && data.message || `HTTP ${res && res.status}` };
      }
      const d = data.data || {};
      return {
        ok: true,
        entryId: d.id != null ? String(d.id) : null,
        folderNum: d.folder != null ? Number(d.folder) : null,
        did: data.did || null
      };
    } catch (e) {
      return { ok: false, error: e && e.message || String(e) };
    }
  }
  async function editEntry(entryId, fields = {}, opts = {}) {
    const win = resolveWin(opts);
    const doFetch = resolveFetch(opts, win);
    try {
      const url = `${baseUrl(win)}/api/watchlist/edit/${entryId}`;
      const res = await doFetch(url, {
        method: "POST",
        headers: {
          "CSRF-Token": csrfToken(win),
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        credentials: "same-origin",
        body: encodeEditBody(fields)
      });
      const data = await res.json().catch(() => null);
      return { ok: !!(res && res.ok) && !(data && data.error === true) };
    } catch {
      return { ok: false };
    }
  }
  async function deleteEntry(animeId2, opts = {}) {
    const win = resolveWin(opts);
    const doFetch = resolveFetch(opts, win);
    try {
      const url = `${baseUrl(win)}/api/watchlist/delete/${animeId2}?anime=true`;
      const res = await doFetch(url, {
        method: "DELETE",
        headers: { "CSRF-Token": csrfToken(win) },
        credentials: "same-origin"
      });
      const data = await res.json().catch(() => null);
      return { ok: !!(res && res.ok) && !(data && data.error === true) };
    } catch {
      return { ok: false };
    }
  }

  // src/watchlist/watchlist-read.js
  var GLOBAL_DOC = typeof document !== "undefined" ? document : void 0;
  var GLOBAL_WIN2 = typeof window !== "undefined" ? window : void 0;
  function isLoggedIn(win = GLOBAL_WIN2, doc = GLOBAL_DOC) {
    try {
      if (win && win.usersId) return true;
      const d = doc || win && win.document || GLOBAL_DOC;
      if (!d) return true;
      if (d.querySelector('a[href*="/logout"]')) return true;
      return !d.querySelector('a[href*="/login"]');
    } catch {
      return true;
    }
  }
  function toInt(v) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  }
  function valueOf(doc, sel) {
    try {
      const el2 = doc && doc.querySelector(sel);
      return el2 && el2.value != null ? el2.value : "";
    } catch {
      return "";
    }
  }
  function currentFolderFromBookmark(doc = GLOBAL_DOC) {
    try {
      const li = doc && doc.querySelector(".userbookmark ul.dropdown-menu li.active");
      return li && li.getAttribute("data-value") || null;
    } catch {
      return null;
    }
  }
  function readCurrentEntry(doc = GLOBAL_DOC, win = GLOBAL_WIN2) {
    const out = {
      inList: false,
      animeId: null,
      entryId: null,
      folderNum: null,
      folderStr: null,
      episodes: 0,
      vote: 0,
      rewatches: 0,
      notes: ""
    };
    try {
      out.inList = !!(win && win.isInList);
      out.animeId = win && win.animeId != null ? String(win.animeId) : null;
      const folderStr = currentFolderFromBookmark(doc);
      const modal = doc && doc.querySelector(".watchlist-edit-modal");
      const entryId = modal && modal.getAttribute("data-id");
      if (modal && entryId) {
        out.entryId = entryId;
        out.folderNum = toInt(valueOf(doc, "#watchlist-edit-folder")) || null;
        out.vote = toInt(valueOf(doc, "#watchlist-edit-score"));
        out.episodes = toInt(valueOf(doc, "#watchlist-edit-episodes"));
        out.rewatches = toInt(valueOf(doc, "#watchlist-edit-rewatches"));
        out.notes = valueOf(doc, "#watchlist-edit-notes") || "";
      }
      if (folderStr) {
        out.folderStr = folderStr;
        if (out.folderNum == null && FOLDER_STR_TO_NUM[folderStr] != null) {
          out.folderNum = FOLDER_STR_TO_NUM[folderStr];
        }
      }
      if (out.folderNum != null && out.folderStr == null && FOLDER_NUM_TO_STR[out.folderNum] != null) {
        out.folderStr = FOLDER_NUM_TO_STR[out.folderNum];
      }
    } catch {
    }
    return out;
  }
  function availableEpisodeLinks(doc = GLOBAL_DOC) {
    try {
      let links = doc && doc.querySelectorAll(".server.active .episode a") || [];
      if (!links.length) {
        const first = doc && doc.querySelector(".server");
        links = first ? first.querySelectorAll(".episode a") : [];
      }
      return links;
    } catch {
      return [];
    }
  }
  function readAiringInfo(doc = GLOBAL_DOC) {
    const out = { stato: "", available: 0 };
    try {
      const dts = doc && doc.querySelectorAll(".info dt, dl dt") || [];
      for (const dt of dts) {
        if (/stato/i.test((dt.textContent || "").trim())) {
          const dd = dt.nextElementSibling;
          out.stato = dd && (dd.textContent || "").trim() || "";
          break;
        }
      }
      out.available = availableEpisodeLinks(doc).length;
    } catch {
    }
    return out;
  }
  function isLastAvailableEpisode(doc = GLOBAL_DOC) {
    try {
      const links = availableEpisodeLinks(doc);
      if (!links.length) return false;
      const active2 = Array.prototype.find.call(links, (a) => a.classList && a.classList.contains("active"));
      return !!active2 && active2 === links[links.length - 1];
    } catch {
      return false;
    }
  }
  function currentEpisodePosition(doc = GLOBAL_DOC) {
    try {
      const links = availableEpisodeLinks(doc);
      if (!links.length) return null;
      const active2 = Array.prototype.find.call(links, (a) => a.classList && a.classList.contains("active"));
      if (!active2) return null;
      const idx = Array.prototype.indexOf.call(links, active2);
      return idx >= 0 ? idx + 1 : null;
    } catch {
      return null;
    }
  }

  // src/watchlist/watchlist-coherence.js
  var WATCHING = FOLDER_NUM_TO_STR[1];
  var WATCHED = FOLDER_NUM_TO_STR[2];
  var ONHOLD = FOLDER_NUM_TO_STR[3];
  var DROPPED = FOLDER_NUM_TO_STR[4];
  var PLANNED = FOLDER_NUM_TO_STR[5];
  var FOLDERS_BY_CATEGORY = {
    notReleased: [PLANNED],
    airing: [WATCHING, ONHOLD, DROPPED, PLANNED],
    ended: [WATCHING, WATCHED, ONHOLD, DROPPED, PLANNED]
  };
  function toNum(v, def) {
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? n : def;
  }
  function categorize(stato, available) {
    const s = String(stato == null ? "" : stato).toLowerCase();
    const avail = episodeCap(available);
    if (/non rilasciat/i.test(s) || avail === 0) return "notReleased";
    if (/in corso/i.test(s)) return "airing";
    if (/finit|droppat/i.test(s)) return "ended";
    return avail > 0 ? "ended" : "notReleased";
  }
  function episodeCap(available) {
    const n = Math.floor(toNum(available, 0));
    return n < 0 ? 0 : n;
  }
  function allowedFolders(category) {
    const list = FOLDERS_BY_CATEGORY[category];
    return list ? list.slice() : [];
  }
  function fieldsEnabled(state) {
    const s = state || {};
    const released = s.category !== "notReleased";
    const started = !!s.inList && s.folder != null && s.folder !== PLANNED;
    return { episodes: released, vote: released, rewatch: released && started };
  }
  function clampEpisodes(n, available) {
    const cap = episodeCap(available);
    let v = Math.floor(toNum(n, 0));
    if (v < 0) v = 0;
    if (v > cap) v = cap;
    return v;
  }
  function clampVote(n) {
    let v = Math.floor(toNum(n, 0));
    if (v < 0) v = 0;
    if (v > 10) v = 10;
    return v;
  }
  function clampRewatch(n) {
    const v = Math.floor(toNum(n, 0));
    return v < 0 ? 0 : v;
  }
  function resolveWrite(action, state) {
    const a = action || {};
    const st = state || {};
    const category = st.category;
    const available = st.available;
    const inList = !!st.inList;
    const cap = episodeCap(available);
    let folder = st.folder != null ? st.folder : null;
    let episodes = clampEpisodes(st.episodes, available);
    let vote = clampVote(st.vote);
    let rewatches = clampRewatch(st.rewatches);
    if (category === "notReleased") {
      if (a.type === "setFolder" && a.folder === PLANNED) folder = PLANNED;
      return { folder, episodes, vote, rewatches };
    }
    let touched = null;
    switch (a.type) {
      case "setFolder":
        folder = a.folder != null ? a.folder : folder;
        touched = "folder";
        break;
      case "setEpisodes":
        episodes = clampEpisodes(a.value, available);
        touched = "episodes";
        break;
      case "stepEpisodes":
        episodes = clampEpisodes(episodes + toNum(a.delta, 0), available);
        touched = "episodes";
        break;
      case "setVote":
        vote = clampVote(a.value);
        touched = "vote";
        break;
      case "stepVote":
        vote = clampVote(vote + toNum(a.delta, 0));
        touched = "vote";
        break;
      case "setRewatch":
        rewatches = clampRewatch(a.value);
        touched = "rewatch";
        break;
      case "stepRewatch":
        rewatches = clampRewatch(rewatches + toNum(a.delta, 0));
        touched = "rewatch";
        break;
      default:
        touched = null;
    }
    if (touched === "folder") {
      if (folder === WATCHED) episodes = cap;
    } else if (touched === "episodes") {
      if (episodes === cap && category === "ended") {
        folder = WATCHED;
      } else if (episodes > 0 && (!inList || folder === PLANNED || folder == null)) {
        folder = WATCHING;
      } else if (folder === WATCHED && episodes < cap) {
        folder = WATCHING;
      }
    } else if (touched === "vote") {
      if (!inList || folder === PLANNED || folder == null) folder = WATCHING;
    }
    return { folder, episodes, vote, rewatches };
  }

  // src/watchlist/watchlist-write.js
  async function applyAction(action, state, api, ctx) {
    const a = action || {};
    const st = state || {};
    const animeId2 = ctx && ctx.animeId != null ? ctx.animeId : st.animeId;
    const callOpts = { win: ctx && ctx.win };
    if (a.type === "delete") {
      const r = await api.deleteEntry(animeId2, callOpts);
      if (!r || !r.ok) return { ...st, ok: false };
      return {
        ...st,
        ok: true,
        inList: false,
        entryId: null,
        folder: null,
        folderNum: null,
        episodes: 0,
        vote: 0,
        rewatches: 0
      };
    }
    const target = resolveWrite(a, st);
    let inList = !!st.inList;
    let entryId = st.entryId;
    if (!inList || !entryId) {
      if (!target.folder) return { ...st, ok: false };
      const r = await api.addOrEdit(animeId2, target.folder, callOpts);
      if (!r || !r.ok) return { ...st, ok: false };
      entryId = r.entryId;
      inList = true;
    }
    const folderNum = api.FOLDER_STR_TO_NUM[target.folder];
    const er = await api.editEntry(entryId, {
      folder: folderNum,
      episodes: target.episodes,
      rewatches: target.rewatches,
      notes: st.notes || "",
      vote: target.vote
    }, callOpts);
    if (!(er && er.ok)) {
      return { ...st, ok: false, inList, entryId };
    }
    return {
      ...st,
      ok: true,
      inList: true,
      entryId,
      folder: target.folder,
      folderNum: folderNum != null ? folderNum : null,
      episodes: target.episodes,
      vote: target.vote,
      rewatches: target.rewatches
    };
  }

  // src/watchlist/watchlist-session.js
  var sessionEntries = /* @__PURE__ */ new Map();
  var promptsShown = /* @__PURE__ */ new Set();
  function keyOf(animeId2) {
    return animeId2 != null ? String(animeId2) : null;
  }
  function getSessionEntry(animeId2) {
    const k = keyOf(animeId2);
    return k != null ? sessionEntries.get(k) : void 0;
  }
  function setSessionEntry(animeId2, partial) {
    const k = keyOf(animeId2);
    if (k == null || !partial) return;
    const prev = sessionEntries.get(k) || {};
    sessionEntries.set(k, { ...prev, ...partial });
    try {
      if (typeof document !== "undefined" && typeof CustomEvent === "function") {
        document.dispatchEvent(new CustomEvent("aw-wl-changed", { detail: { animeId: k } }));
      }
    } catch {
    }
  }
  function readEntryMerged(doc, win) {
    const entry = readCurrentEntry(doc, win);
    const override = getSessionEntry(entry.animeId);
    if (!override) return entry;
    return { ...entry, ...override };
  }
  function wasPromptShown(animeId2) {
    const k = keyOf(animeId2);
    return k != null && promptsShown.has(k);
  }
  function markPromptShown(animeId2) {
    const k = keyOf(animeId2);
    if (k != null) promptsShown.add(k);
  }
  function clearPromptShown(animeId2) {
    const k = keyOf(animeId2);
    if (k != null) promptsShown.delete(k);
  }
  var removedSeries = /* @__PURE__ */ new Set();
  function markSeriesRemoved(animeId2) {
    const k = keyOf(animeId2);
    if (k != null) removedSeries.add(k);
  }
  function wasSeriesRemoved(animeId2) {
    const k = keyOf(animeId2);
    return k != null && removedSeries.has(k);
  }
  function clearSeriesRemoved(animeId2) {
    const k = keyOf(animeId2);
    if (k != null) removedSeries.delete(k);
  }

  // src/watchlist/watchlist-noask.js
  var KEY_WL_REMEMBER = "aw-wl-remember";
  var NOASK_PREFIX = "aw-wl-noask-";
  var NOASK_WATCHING = "watching";
  var NOASK_REWATCH = "rewatch";
  var NOASK_COMPLETE = "complete";
  function noAskKey(animeId2, kind) {
    return NOASK_PREFIX + animeId2 + "-" + kind;
  }
  function isRememberOn() {
    return lsGet(KEY_WL_REMEMBER) === "1";
  }
  function isNoAsk(animeId2, kind) {
    return isRememberOn() && animeId2 != null && !!kind && lsGet(noAskKey(animeId2, kind)) === "1";
  }
  function rememberDismissal(animeId2, kind) {
    if (animeId2 == null || !kind) return;
    if (isRememberOn()) lsSet(noAskKey(animeId2, kind), "1");
  }
  function clearAllNoAsk() {
    try {
      const toDel = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(NOASK_PREFIX) === 0) toDel.push(k);
      }
      for (const k of toDel) lsDel(k);
    } catch {
    }
  }

  // src/watchlist/watchlist-panel.js
  var WL_ICON = IC.bookmark;
  var FOLDER_ICON = {
    watching: "fa fa-eye",
    watched: "fa fa-check",
    onhold: "fa fa-hand-rock",
    dropped: "fa fa-eye-slash",
    planned: "fa fa-bookmark"
  };
  var KEY_WL_INTEGRATION = "aw-wl-integration";
  var KEY_WL_AUTOPROGRESS = "aw-wl-autoprogress";
  var KEY_WL_REMEMBER2 = "aw-wl-remember";
  var MINUS = "−";
  function _hexToRgb(h) {
    if (typeof h !== "string") return null;
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h.trim());
    if (!m) return null;
    let s = m[1];
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function _lum(r) {
    return (0.299 * r[0] + 0.587 * r[1] + 0.114 * r[2]) / 255;
  }
  function _mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function _toHex(r) {
    return "#" + r.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
  }
  function accentTextTone(rgb, theme) {
    let r = rgb.slice(), g = 0;
    if (theme === "dark") {
      while (_lum(r) < 0.62 && g < 16) {
        r = _mix(r, [255, 255, 255], 0.12);
        g++;
      }
    } else {
      while (_lum(r) > 0.42 && g < 16) {
        r = _mix(r, [18, 40, 26], 0.12);
        g++;
      }
    }
    return _toHex(r);
  }
  function buildWatchlistPanel(ctx = {}) {
    const doc = ctx.doc || (typeof document !== "undefined" ? document : void 0);
    const win = ctx.win || (typeof window !== "undefined" ? window : void 0);
    const api = ctx.api;
    let theme = ctx.theme === "dark" ? "dark" : "light";
    if (!isLoggedIn(win, doc)) {
      const lIcon = el("span", "aw-wl-ic", { html: WL_ICON });
      const lTitle = el("span", "aw-wl-title", { text: "Watchlist AW" });
      const lR1 = el("div", "aw-wl-r1", { kids: [lIcon, lTitle] });
      const lMsg = el("div", "aw-wl-locked-msg", { text: "Accedi ad AnimeWorld per usare questa funzione." });
      const lockedPanel = el("div", "aw-wl-panel aw-wl-locked", { kids: [lR1, lMsg] });
      lockedPanel.classList.add(theme === "dark" ? "aw-wl-on-dark" : "aw-wl-on-light");
      const rawAcc = loadColor() || "#ffffff";
      const accRgb = _hexToRgb(rawAcc) || [255, 255, 255];
      lockedPanel.style.setProperty("--wl-acc", rawAcc);
      lockedPanel.style.setProperty("--wl-acc-on", _lum(accRgb) > 0.6 ? "#16181d" : "#ffffff");
      lockedPanel.style.setProperty("--wl-acc-text", accentTextTone(accRgb, theme));
      return {
        panel: lockedPanel,
        refresh() {
        },
        destroy() {
          lockedPanel.remove();
        },
        setTheme(t) {
          theme = t === "dark" ? "dark" : "light";
          lockedPanel.classList.toggle("aw-wl-on-dark", theme === "dark");
          lockedPanel.classList.toggle("aw-wl-on-light", theme === "light");
          lockedPanel.style.setProperty("--wl-acc-text", accentTextTone(accRgb, theme));
        },
        applySession() {
        }
      };
    }
    const entry = readCurrentEntry(doc, win);
    const airing = readAiringInfo(doc);
    const state = {
      inList: entry.inList,
      animeId: entry.animeId,
      entryId: entry.entryId,
      folder: entry.folderStr,
      // il resto del codice ragiona sulla STRINGA folder
      folderNum: entry.folderNum,
      episodes: entry.episodes,
      vote: entry.vote,
      rewatches: entry.rewatches,
      notes: entry.notes,
      category: categorize(airing.stato, airing.available),
      available: airing.available
    };
    function mkStep(labelText, groupClass) {
      const minus = el("button", "aw-wl-minus", { text: MINUS, attrs: { type: "button" } });
      const valEl = el("span", "aw-wl-val");
      const plus = el("button", "aw-wl-plus", { text: "+", attrs: { type: "button" } });
      const step = el("div", "aw-wl-step", { kids: [minus, valEl, plus] });
      const lbl = el("span", "aw-wl-lbl", { text: labelText });
      const group = el("div", "aw-wl-grp " + groupClass, { kids: [lbl, step] });
      return { group, minus, valEl, plus };
    }
    function mkToggle(labelText, key, tip) {
      const input = el("input", null, { attrs: { type: "checkbox" } });
      input.checked = lsGet(key) === "1";
      const track = el("span", "aw-wl-sw-track");
      const thumb = el("span", "aw-wl-sw-thumb");
      const sw = el("label", "aw-wl-sw", { kids: [input, track, thumb] });
      const lbl = el("span", "aw-wl-tog-lbl", { text: labelText });
      const kids = [lbl, sw];
      if (tip) kids.push(el("span", "aw-wl-tip", { text: tip }));
      const tog = el("div", "aw-wl-tog", { kids });
      input.addEventListener("change", () => {
        lsSet(key, input.checked ? "1" : "0");
        try {
          if (typeof document !== "undefined" && typeof CustomEvent === "function") {
            document.dispatchEvent(new CustomEvent("aw-wl-integration-changed", { detail: { key, on: input.checked } }));
          }
        } catch {
        }
      });
      sw.addEventListener("click", (e) => e.stopPropagation());
      tog.addEventListener("click", () => {
        if (input.disabled) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change"));
      });
      return { tog, input };
    }
    const icon = el("span", "aw-wl-ic", { html: WL_ICON });
    const title = el("span", "aw-wl-title", { text: "Watchlist AW" });
    const badgeDot = el("span", "aw-wl-dot");
    const badgeTxt = el("span", "aw-wl-badge-txt");
    const badge = el("span", "aw-wl-badge", { kids: [badgeDot, badgeTxt] });
    const r1 = el("div", "aw-wl-r1", { kids: [icon, title, badge] });
    const FOLDER_LABEL = {};
    FOLDERS.forEach((f) => {
      FOLDER_LABEL[f.str] = f.label;
    });
    const stTriggerIc = el("i", "aw-wl-status-ic");
    const stTriggerTxt = el("span", "aw-wl-status-txt", { text: "Stato" });
    const stCaret = el("span", "aw-wl-status-caret", { text: "▾" });
    const stTrigger = el("button", "aw-wl-status", { attrs: { type: "button", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-label": "Stato watchlist" }, kids: [stTriggerIc, stTriggerTxt, stCaret] });
    const stMenu = el("div", "aw-wl-status-menu", { attrs: { role: "listbox" } });
    const statusOptions = FOLDERS.map((f) => {
      const ic = el("i", "aw-wl-status-ic " + (FOLDER_ICON[f.str] || ""));
      const opt = el("button", "aw-wl-status-opt", { attrs: { type: "button", role: "option", "data-folder": f.str }, kids: [ic, el("span", null, { text: f.label })] });
      opt.addEventListener("click", () => {
        closeMenu();
        if (!opt.disabled) run({ type: "setFolder", folder: f.str });
      });
      stMenu.append(opt);
      return { opt, str: f.str };
    });
    const stWrap = el("div", "aw-wl-status-wrap", { kids: [stTrigger, stMenu] });
    let stOpen = false;
    function onDocClick(e) {
      if (!stWrap.contains(e.target)) closeMenu();
    }
    function openMenu() {
      if (stOpen || stTrigger.disabled) return;
      stOpen = true;
      stTrigger.setAttribute("aria-expanded", "true");
      stMenu.classList.add("open");
      if (doc) doc.addEventListener("click", onDocClick, true);
    }
    function closeMenu() {
      if (!stOpen) return;
      stOpen = false;
      stTrigger.setAttribute("aria-expanded", "false");
      stMenu.classList.remove("open");
      if (doc) doc.removeEventListener("click", onDocClick, true);
    }
    stTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      stOpen ? closeMenu() : openMenu();
    });
    stTrigger.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    const trash = el("button", "aw-wl-trash", { html: IC.trash, attrs: { type: "button", "aria-label": "Rimuovi dalla lista" } });
    const statusGrp = el("div", "aw-wl-grp aw-wl-status-grp", { kids: [stWrap, trash] });
    const epStep = mkStep("Episodi", "aw-wl-ep");
    const voteStep = mkStep("Voto", "aw-wl-vote");
    const reStep = mkStep("Rewatch", "aw-wl-rewatch");
    const r2 = el("div", "aw-wl-r2", { kids: [statusGrp, el("div", "aw-wl-sep"), epStep.group, el("div", "aw-wl-sep"), voteStep.group, el("div", "aw-wl-sep"), reStep.group] });
    const togIntegration = mkToggle("Integrazione watchlist", KEY_WL_INTEGRATION, "Un popup propone aggiornamenti di stato per la serie");
    const togAutoProgress = mkToggle("Auto-progresso", KEY_WL_AUTOPROGRESS, "Aggiorna l’episodio automaticamente durante la visione");
    const togRemember = mkToggle("Ricorda le scelte", KEY_WL_REMEMBER2, "Il popup rifiutato non viene più riproposto per quella serie");
    togRemember.input.addEventListener("change", () => {
      if (!togRemember.input.checked) clearAllNoAsk();
    });
    const r3 = el("div", "aw-wl-r3", { kids: [togIntegration.tog, togAutoProgress.tog, togRemember.tog] });
    function syncIntegrationDeps() {
      const on = togIntegration.input.checked;
      for (const t of [togAutoProgress, togRemember]) {
        t.tog.classList.toggle("aw-wl-tog-disabled", !on);
        t.input.disabled = !on;
      }
    }
    syncIntegrationDeps();
    togIntegration.input.addEventListener("change", syncIntegrationDeps);
    const panel = el("div", "aw-wl-panel", { kids: [r1, r2, r3] });
    panel.classList.add(theme === "dark" ? "aw-wl-on-dark" : "aw-wl-on-light");
    function refresh() {
      const cat = state.category;
      const fe = fieldsEnabled({ category: cat, folder: state.folder, inList: state.inList });
      curFe = fe;
      const allowed = allowedFolders(cat);
      const cap = episodeCap(state.available);
      const rawAcc = loadColor() || "#ffffff";
      const accRgb = _hexToRgb(rawAcc) || [255, 255, 255];
      panel.style.setProperty("--wl-acc", rawAcc);
      panel.style.setProperty("--wl-acc-on", _lum(accRgb) > 0.6 ? "#16181d" : "#ffffff");
      panel.style.setProperty("--wl-acc-text", accentTextTone(accRgb, theme));
      badgeTxt.textContent = state.inList ? "In lista" : "Non in lista";
      badge.classList.toggle("aw-wl-in", state.inList);
      badge.classList.toggle("aw-wl-out", !state.inList);
      stTrigger.disabled = false;
      for (const { opt, str } of statusOptions) {
        opt.disabled = !allowed.includes(str);
        opt.classList.toggle("aw-wl-sel", state.inList && str === state.folder);
      }
      if (state.inList && state.folder) {
        stTriggerIc.className = "aw-wl-status-ic " + (FOLDER_ICON[state.folder] || "");
        stTriggerTxt.textContent = FOLDER_LABEL[state.folder] || "Stato";
      } else {
        stTriggerIc.className = "aw-wl-status-ic";
        stTriggerTxt.textContent = "Stato";
      }
      trash.disabled = !state.inList;
      trash.classList.toggle("aw-wl-active", state.inList);
      epStep.valEl.textContent = state.episodes + " / " + cap;
      epStep.minus.disabled = !(fe.episodes && state.episodes > 0);
      epStep.plus.disabled = !(fe.episodes && state.episodes < cap);
      voteStep.valEl.textContent = String(state.vote);
      voteStep.minus.disabled = !fe.vote;
      voteStep.plus.disabled = !fe.vote;
      reStep.valEl.textContent = String(state.rewatches);
      reStep.minus.disabled = !fe.rewatch;
      reStep.plus.disabled = !fe.rewatch;
    }
    let busy = false;
    let curFe = { episodes: false, vote: false, rewatch: false };
    function openEditor(valEl, curVal, actionType) {
      if (valEl.querySelector("input")) return;
      const input = el("input", "aw-wl-edit", { attrs: { type: "text", inputmode: "numeric", "aria-label": "Modifica valore" } });
      input.value = String(curVal);
      valEl.textContent = "";
      valEl.appendChild(input);
      input.focus();
      input.select();
      let done = false;
      const finish = (commit) => {
        if (done) return;
        done = true;
        const n = parseInt(input.value, 10);
        if (commit && Number.isFinite(n) && n !== curVal) run({ type: actionType, value: n });
        else refresh();
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        }
      });
      input.addEventListener("blur", () => finish(true));
      input.addEventListener("click", (e) => e.stopPropagation());
    }
    function disableAll(d) {
      for (const c of [stTrigger, trash, epStep.minus, epStep.plus, voteStep.minus, voteStep.plus, reStep.minus, reStep.plus]) c.disabled = d;
    }
    async function run(action) {
      if (busy) return;
      busy = true;
      disableAll(true);
      try {
        const next = await applyAction(action, state, api, { animeId: state.animeId, win });
        if (next && next.ok) {
          const { ok, ...fields } = next;
          Object.assign(state, fields);
          if (action.type === "delete") markSeriesRemoved(state.animeId);
          else clearSeriesRemoved(state.animeId);
          setSessionEntry(state.animeId, {
            inList: state.inList,
            entryId: state.entryId,
            folderStr: state.folder,
            folderNum: state.folderNum,
            episodes: state.episodes,
            vote: state.vote,
            rewatches: state.rewatches,
            notes: state.notes
          });
        }
      } finally {
        busy = false;
        refresh();
      }
    }
    trash.addEventListener("click", () => {
      if (state.inList) run({ type: "delete" });
    });
    epStep.minus.addEventListener("click", () => run({ type: "stepEpisodes", delta: -1 }));
    epStep.plus.addEventListener("click", () => run({ type: "stepEpisodes", delta: 1 }));
    voteStep.minus.addEventListener("click", () => run({ type: "stepVote", delta: -1 }));
    voteStep.plus.addEventListener("click", () => run({ type: "stepVote", delta: 1 }));
    reStep.minus.addEventListener("click", () => run({ type: "stepRewatch", delta: -1 }));
    reStep.plus.addEventListener("click", () => run({ type: "stepRewatch", delta: 1 }));
    epStep.valEl.addEventListener("click", () => {
      if (!busy && curFe.episodes) openEditor(epStep.valEl, state.episodes, "setEpisodes");
    });
    voteStep.valEl.addEventListener("click", () => {
      if (!busy && curFe.vote) openEditor(voteStep.valEl, state.vote, "setVote");
    });
    reStep.valEl.addEventListener("click", () => {
      if (!busy && curFe.rewatch) openEditor(reStep.valEl, state.rewatches, "setRewatch");
    });
    refresh();
    function applySession() {
      try {
        if (busy) return;
        const ov = getSessionEntry(win && win.animeId);
        if (!ov) return;
        if ("inList" in ov) state.inList = ov.inList;
        if ("entryId" in ov) state.entryId = ov.entryId;
        if ("folderStr" in ov) state.folder = ov.folderStr;
        if ("folderNum" in ov) state.folderNum = ov.folderNum;
        if ("episodes" in ov) state.episodes = ov.episodes;
        if ("vote" in ov) state.vote = ov.vote;
        if ("rewatches" in ov) state.rewatches = ov.rewatches;
        if ("notes" in ov) state.notes = ov.notes;
        refresh();
      } catch {
      }
    }
    function setTheme(t) {
      theme = t === "dark" ? "dark" : "light";
      panel.classList.toggle("aw-wl-on-dark", theme === "dark");
      panel.classList.toggle("aw-wl-on-light", theme === "light");
      refresh();
    }
    function destroy() {
      closeMenu();
      panel.remove();
    }
    return { panel, refresh, destroy, setTheme, applySession };
  }

  // src/styles/watchlist-css.js
  var WATCHLIST_CSS = `
.aw-wl-panel{
  --wl-acc:#3aa564;--wl-acc-text:#1f8f3d;--wl-acc-on:#ffffff;
  --wl-surface:#f5f8f6;--wl-bd:#d9e0db;--wl-fg:#273229;--wl-muted:#66756b;--wl-line:#dbe4de;--wl-field:#ffffff;--wl-sw-off:#cdd6d0;--wl-danger:#dc3545;
  box-sizing:border-box;clear:both;width:100%;container-type:inline-size;
  margin:10px 0 6px;padding:9px 13px;
  display:flex;flex-direction:column;gap:8px;
  border-radius:8px;
  background:var(--wl-surface);border:1px solid var(--wl-bd);color:var(--wl-fg);
  font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.2;
  -webkit-font-smoothing:antialiased;
}
.aw-wl-panel,.aw-wl-panel *,.aw-wl-panel *::before,.aw-wl-panel *::after{box-sizing:border-box}
.aw-wl-panel button,.aw-wl-popup button{-webkit-tap-highlight-color:transparent}
.aw-wl-panel.aw-wl-on-light,.aw-wl-popup.aw-wl-on-light{
  --wl-surface:color-mix(in srgb,var(--wl-acc) 6%,#f5f8f6);
  --wl-bd:color-mix(in srgb,var(--wl-acc) 22%,#d9e0db);
  --wl-fg:color-mix(in srgb,var(--wl-acc) 14%,#273229);
  --wl-muted:color-mix(in srgb,var(--wl-acc) 30%,#66756b);
  --wl-line:color-mix(in srgb,var(--wl-acc) 24%,#dbe4de);
  --wl-field:color-mix(in srgb,var(--wl-acc) 4%,#ffffff);
  --wl-sw-off:#cdd6d0;--wl-danger:#dc3545;
  box-shadow:0 1px 4px rgba(0,0,0,.10);
}
.aw-wl-panel.aw-wl-on-dark,.aw-wl-popup.aw-wl-on-dark{
  --wl-surface:color-mix(in srgb,var(--wl-acc) 10%,#202420);
  --wl-bd:color-mix(in srgb,var(--wl-acc) 26%,#39433d);
  --wl-fg:color-mix(in srgb,var(--wl-acc) 12%,#d5ded7);
  --wl-muted:color-mix(in srgb,var(--wl-acc) 22%,#8ba394);
  --wl-line:color-mix(in srgb,var(--wl-acc) 24%,#39433d);
  --wl-field:color-mix(in srgb,var(--wl-acc) 10%,#23281f);
  --wl-sw-off:#3c463f;--wl-danger:#e26670;
  box-shadow:0 2px 8px rgba(0,0,0,.35);
}

.aw-wl-panel .aw-wl-r1{display:flex;align-items:center;gap:8px}
.aw-wl-panel .aw-wl-ic{display:flex;align-items:center;color:var(--wl-acc-text)}
.aw-wl-panel .aw-wl-ic svg{width:16px;height:16px;display:block;color:var(--wl-acc-text)}
.aw-wl-panel .aw-wl-title{font-size:13px;font-weight:600;white-space:nowrap;color:var(--wl-acc-text)}
.aw-wl-panel .aw-wl-badge{font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;margin-left:2px}
.aw-wl-panel .aw-wl-badge.aw-wl-in{color:var(--wl-acc-on);background:var(--wl-acc)}
.aw-wl-panel .aw-wl-badge.aw-wl-out{color:var(--wl-muted);background:transparent;border:1px solid var(--wl-bd)}
.aw-wl-panel .aw-wl-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}

.aw-wl-panel .aw-wl-r2{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:nowrap}
.aw-wl-panel .aw-wl-sep{width:1px;align-self:stretch;background:var(--wl-line);margin:1px 0;flex-shrink:0}
.aw-wl-panel .aw-wl-grp{display:flex;align-items:center;gap:6px;flex-shrink:0}
.aw-wl-panel .aw-wl-lbl{font-size:11.5px;font-weight:600;color:var(--wl-muted);white-space:nowrap}

.aw-wl-panel .aw-wl-status-wrap{position:relative;display:inline-flex}
.aw-wl-panel .aw-wl-status{display:inline-flex;align-items:center;gap:6px;height:24px;width:120px;box-sizing:border-box;padding:0 8px;background:var(--wl-field);color:var(--wl-fg);border:1px solid var(--wl-acc);border-radius:6px;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:border-color .15s}
.aw-wl-panel .aw-wl-status:focus{outline:none;border-color:var(--wl-acc-text)}
.aw-wl-panel .aw-wl-status:disabled{opacity:.5;cursor:not-allowed}
.aw-wl-panel .aw-wl-status-ic{font-size:11px;width:13px;text-align:center;flex-shrink:0;color:var(--wl-acc-text)}
.aw-wl-panel .aw-wl-status-txt{flex:1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aw-wl-panel .aw-wl-status-caret{font-size:9px;line-height:1;opacity:.7;flex-shrink:0}
.aw-wl-panel .aw-wl-status-menu{position:absolute;top:calc(100% + 4px);left:0;min-width:100%;background:var(--wl-surface);border:1px solid var(--wl-bd);border-radius:7px;box-shadow:0 6px 20px rgba(0,0,0,.28);padding:4px;display:none;flex-direction:column;gap:1px;z-index:40}
.aw-wl-panel .aw-wl-status-menu.open{display:flex}
.aw-wl-panel .aw-wl-status-opt{display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;border-radius:5px;padding:6px 9px;font-family:inherit;font-size:12px;font-weight:600;color:var(--wl-fg);cursor:pointer;text-align:left;white-space:nowrap;transition:background-color .12s}
.aw-wl-panel .aw-wl-status-opt:hover:not(:disabled){background:color-mix(in srgb,var(--wl-acc) 16%,transparent)}
.aw-wl-panel .aw-wl-status-opt.aw-wl-sel{background:color-mix(in srgb,var(--wl-acc) 26%,transparent)}
.aw-wl-panel .aw-wl-status-opt:disabled{opacity:.4;cursor:not-allowed}

.aw-wl-panel .aw-wl-trash{display:flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;background:none;border:none;border-radius:5px;color:var(--wl-danger);cursor:pointer;transition:transform .12s}
.aw-wl-panel .aw-wl-trash svg{width:14px;height:14px;display:block;fill:currentColor}
.aw-wl-panel .aw-wl-trash:hover:not(:disabled){transform:scale(1.1)}
.aw-wl-panel .aw-wl-trash:disabled{color:var(--wl-muted);opacity:.45;cursor:not-allowed}

.aw-wl-panel .aw-wl-step{display:flex;align-items:center;gap:5px}
.aw-wl-panel .aw-wl-minus,.aw-wl-panel .aw-wl-plus{display:flex;align-items:center;justify-content:center;width:22px;height:22px;box-sizing:border-box;padding:0;background:var(--wl-acc);color:var(--wl-acc-on);border:none;border-radius:5px;font-family:inherit;font-size:15px;font-weight:700;line-height:1;cursor:pointer;transition:filter .12s,transform .1s}
.aw-wl-panel .aw-wl-minus:hover:not(:disabled),.aw-wl-panel .aw-wl-plus:hover:not(:disabled){filter:brightness(.9)}
.aw-wl-panel .aw-wl-minus:active:not(:disabled),.aw-wl-panel .aw-wl-plus:active:not(:disabled){transform:scale(.9)}
.aw-wl-panel .aw-wl-minus:disabled,.aw-wl-panel .aw-wl-plus:disabled{opacity:.35;cursor:not-allowed}
.aw-wl-panel .aw-wl-val{width:26px;text-align:center;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--wl-acc-text);cursor:pointer}
.aw-wl-panel .aw-wl-ep .aw-wl-val{width:82px}
.aw-wl-panel .aw-wl-edit{width:100%;height:20px;box-sizing:border-box;padding:0 2px;text-align:center;font-family:inherit;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--wl-fg);background:var(--wl-field);border:1px solid var(--wl-acc);border-radius:4px;outline:none}

.aw-wl-panel .aw-wl-r3{display:flex;align-items:center;gap:20px;margin-top:1px;flex-wrap:wrap}
.aw-wl-panel .aw-wl-tog{position:relative;display:flex;align-items:center;gap:8px;cursor:pointer}
.aw-wl-panel .aw-wl-tog.aw-wl-tog-disabled{cursor:not-allowed}
.aw-wl-panel .aw-wl-tog.aw-wl-tog-disabled .aw-wl-tog-lbl{opacity:.45}
.aw-wl-panel .aw-wl-tog.aw-wl-tog-disabled .aw-wl-sw{opacity:.45;cursor:not-allowed}
.aw-wl-panel .aw-wl-tog-lbl{font-size:12px;font-weight:600;color:var(--wl-fg);white-space:nowrap}
.aw-wl-panel .aw-wl-locked-msg{color:var(--wl-danger);font-size:12px;font-weight:600;line-height:1.3}
.aw-wl-panel .aw-wl-tip{position:absolute;bottom:calc(100% + 8px);left:0;width:max-content;max-width:320px;padding:7px 11px;border-radius:6px;background:var(--wl-surface);border:1px solid var(--wl-bd);color:var(--wl-fg);font-size:11px;font-weight:500;line-height:1.4;white-space:normal;box-shadow:0 4px 14px rgba(0,0,0,.28);pointer-events:none;opacity:0;transition:opacity .15s;z-index:60}
.aw-wl-panel .aw-wl-tog:hover .aw-wl-tip{opacity:1;transition-delay:.35s}
.aw-wl-panel .aw-wl-r3 .aw-wl-tog:last-child .aw-wl-tip{left:auto;right:0}
/* Touch (no hover): i tooltip non sono attivabili (inutili) E da opacity:0+absolute+max-width:320px
   restano NEL LAYOUT sbordando il viewport a destra -> overflow orizzontale che rimpicciolisce TUTTA
   la pagina AW ("ristretta e di lato"). Su hover:none li togliamo dal layout (display:none). */
@media (hover:none){.aw-wl-panel .aw-wl-tip{display:none}}
.aw-wl-panel .aw-wl-sw{position:relative;display:inline-block;width:29px;height:17px;margin:0;flex-shrink:0;cursor:pointer}
.aw-wl-panel .aw-wl-sw input{position:absolute;opacity:0;width:0;height:0;margin:0}
.aw-wl-panel .aw-wl-sw-track{position:absolute;inset:0;border-radius:9px;background:var(--wl-sw-off);transition:background .2s}
.aw-wl-panel .aw-wl-sw input:checked~.aw-wl-sw-track{background:var(--wl-acc)}
.aw-wl-panel .aw-wl-sw-thumb{position:absolute;top:2.5px;left:2.5px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .2s;pointer-events:none}
.aw-wl-panel .aw-wl-sw input:checked~.aw-wl-sw-thumb{transform:translateX(12px)}

/* Mobile / contenitore stretto: la riga 2 va a capo su piu' righe invece di sbordare; i separatori
   verticali (che a capo resterebbero orfani) spariscono. Container query sulla larghezza del pannello. */
@container (max-width:600px){
  .aw-wl-panel .aw-wl-r2{flex-wrap:wrap;justify-content:flex-start;gap:8px 12px}
  .aw-wl-panel .aw-wl-sep{display:none}
}

/* Popup "Aggiornare a <Funzione>?" (WP-W2 2/3). Stessa colorazione del pannello (var neutre per tema
   + 3 var accent inline da watchlist-prompt). Banner NON bloccante in BASSO AL CENTRO: il contenitore
   ha pointer-events:none (il player/pannello restano cliccabili), solo la card e' interattiva. Visibile
   SOLO in modalita' finestra: in fullscreen -> .aw-wl-hidden (lo commuta il JS su fsChange). Si monta
   fisso su document.body. Nel linguaggio del player, niente look Skip/Netflix. */
.aw-wl-popup{position:fixed;bottom:56px;left:0;right:0;z-index:2147483000;display:flex;justify-content:center;padding:0 12px;pointer-events:none;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;-webkit-font-smoothing:antialiased;}
.aw-wl-popup.aw-wl-hidden{display:none}
.aw-wl-popup.aw-wl-on-light,.aw-wl-popup.aw-wl-on-dark{box-shadow:none;background:transparent;border:0}
.aw-wl-popup,.aw-wl-popup *,.aw-wl-popup *::before,.aw-wl-popup *::after{box-sizing:border-box}
.aw-wl-popup-card{pointer-events:auto;max-width:min(92vw,420px);padding:10px 16px;display:flex;flex-direction:column;align-items:center;gap:8px;border-radius:9px;background:var(--wl-surface);border:1px solid var(--wl-bd);color:var(--wl-fg);box-shadow:0 6px 22px rgba(0,0,0,.35);animation:aw-wl-pop-drop .18s ease;}
.aw-wl-popup-title{font-size:14px;font-weight:600;line-height:1.3;text-align:center;color:var(--wl-fg)}
.aw-wl-popup-func{font-weight:700;color:var(--wl-acc-text)}
.aw-wl-popup-extra:empty{display:none}
.aw-wl-popup-actions{display:flex;align-items:center;justify-content:center;gap:8px;flex-shrink:0}
.aw-wl-popup-actions button{min-width:74px;height:27px;padding:0 12px;border-radius:7px;font-family:inherit;font-size:11.5px;font-weight:600;cursor:pointer;transition:filter .12s,transform .1s,background-color .12s,border-color .12s}
.aw-wl-popup-actions button:active{transform:scale(.97)}
.aw-wl-popup-cancel{background:transparent;color:var(--wl-fg);border:1px solid var(--wl-bd)}
.aw-wl-popup-cancel:hover{border-color:var(--wl-acc);background:color-mix(in srgb,var(--wl-acc) 8%,transparent)}
.aw-wl-popup-confirm{background:var(--wl-acc);color:var(--wl-acc-on);border:1px solid var(--wl-acc)}
.aw-wl-popup-confirm:hover{filter:brightness(.92)}
@keyframes aw-wl-pop-drop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

/* Toast auto-progresso in ALTO: solo il MODIFICATORE di posizione del toast UNICO del player
   (flashToast di lib/dom.js, elemento .aw-np-toast). La regola base (in basso) vive negli stili
   player; qui ribaltiamo in alto per data-pos="top". Elementi distinti per posizione -> top e bottom
   coesistono. top = altezza barra-titolo (--np-top-h, ereditata da #aw-np) + 6px: cosi' il toast sta
   SOTTO il titolo/pulsanti senza coprirli, adattandosi a desktop/mobile e alla scala UI. */
.aw-np-toast[data-pos="top"]{top:calc(var(--np-top-h) + 6px);bottom:auto}

/* Voto: controllo a 5 STELLE con mezzo passo (WP-W2 3/3, rework tuning). Riusa i neutri per-tema e le
   var accent gia' settate sul .aw-wl-popup (--wl-muted, --wl-acc-text): nessuna nuova dipendenza. Ogni
   stella = una sola <i class="fa fa-star"> con gradiente orizzontale clippato sul TESTO (background-clip)
   accent->muto con hard-stop a var(--wl-fill): il taglio segue i pixel reali del glifo -> mezza stella
   ESATTA (il vecchio overlay clippava il box, piu' largo del glifo, e sforava oltre meta'). Il JS di
   watchlist-complete setta --wl-fill (0/50/100%) per stella. Niente look Skip/Netflix. */
.aw-wl-stars{display:inline-flex;gap:8px;cursor:pointer}
.aw-wl-star{font-size:22px;line-height:1}
.aw-wl-star .fa{background:linear-gradient(90deg,var(--wl-acc-text) var(--wl-fill,0%),var(--wl-muted) var(--wl-fill,0%));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
`;

  // src/watchlist/watchlist-init.js
  function injectStyle2(doc) {
    if (doc.getElementById("aw-wl-style")) return;
    const s = doc.createElement("style");
    s.id = "aw-wl-style";
    s.textContent = WATCHLIST_CSS;
    (doc.head || doc.documentElement).appendChild(s);
  }
  function detectTheme(doc) {
    return doc && doc.body && doc.body.classList.contains("dark") ? "dark" : "light";
  }
  function initWatchlist(opts = {}) {
    try {
      const doc = opts.doc || (typeof document !== "undefined" ? document : null);
      const win = opts.win || pageWin;
      if (!doc) return;
      const controls = doc.getElementById("controls");
      if (!controls) return;
      if (doc.querySelector(".aw-wl-panel")) return;
      injectStyle2(doc);
      const { panel, setTheme, applySession } = buildWatchlistPanel({
        doc,
        win,
        api: { addOrEdit, editEntry, deleteEntry, FOLDER_STR_TO_NUM },
        theme: detectTheme(doc)
        // il pannello aggiunge da se' la classe aw-wl-on-light/dark
      });
      const ub = controls.querySelector(".userbookmark");
      if (ub) ub.style.display = "none";
      if (controls.parentNode) controls.parentNode.insertBefore(panel, controls.nextSibling);
      else controls.appendChild(panel);
      if (doc.body && typeof MutationObserver === "function") {
        const mo = new MutationObserver(() => setTheme(detectTheme(doc)));
        mo.observe(doc.body, { attributes: true, attributeFilter: ["class"] });
      }
      doc.addEventListener("aw-np-accent-changed", () => {
        try {
          setTheme(detectTheme(doc));
        } catch {
        }
      });
      if (typeof applySession === "function") {
        doc.addEventListener("aw-wl-changed", (e) => {
          try {
            const id = e && e.detail && e.detail.animeId;
            if (String(id) === String(win && win.animeId)) applySession();
          } catch {
          }
        });
      }
    } catch {
    }
  }

  // src/watchlist/watchlist-autoprogress.js
  var KEY_WL_INTEGRATION2 = "aw-wl-integration";
  var KEY_WL_AUTOPROGRESS2 = "aw-wl-autoprogress";
  var PROGRESS_THRESHOLD = 85;
  var WATCHING2 = "watching";
  function initAutoProgress(opts = {}) {
    try {
      let evalProgress = function() {
        const video = curVideo2;
        if (done || busy || Date.now() < retryAfter || !video || !video.duration || !isFinite(video.duration)) return;
        const p = video.currentTime / video.duration * 100;
        if (p < PROGRESS_THRESHOLD) return;
        busy = true;
        pushProgress().then((acted) => {
          if (acted) done = true;
        }).catch(() => {
        }).finally(() => {
          busy = false;
        });
      }, attach = function(video) {
        if (!video || video.dataset.awApWired) return;
        video.dataset.awApWired = "1";
        curVideo2 = video;
        video.addEventListener("loadedmetadata", () => {
          curVideo2 = video;
          done = false;
          busy = false;
          retryAfter = 0;
          failNotified = false;
        });
        video.addEventListener("timeupdate", evalProgress);
      }, tryAttach = function() {
        const v = doc.querySelector("#aw-np-video");
        if (v) attach(v);
      };
      const doc = opts.doc || (typeof document !== "undefined" ? document : null);
      const win = opts.win || pageWin;
      if (!doc) return;
      const api = { addOrEdit, editEntry, deleteEntry, FOLDER_STR_TO_NUM };
      async function pushProgress() {
        try {
          if (lsGet(KEY_WL_INTEGRATION2) !== "1") return false;
          if (lsGet(KEY_WL_AUTOPROGRESS2) !== "1") return false;
          if (!isLoggedIn(win)) return false;
          const entry = readEntryMerged(doc, win);
          if (!entry.inList) return false;
          if (!entry.entryId) return false;
          if (entry.folderStr !== WATCHING2) return false;
          const airing = readAiringInfo(doc);
          const cap = episodeCap(airing.available);
          if (cap <= 0) return false;
          const category = categorize(airing.stato, airing.available);
          if (category === "notReleased") return false;
          const currentPos = currentEpisodePosition(doc);
          if (currentPos == null || currentPos <= entry.episodes) return false;
          if (category === "ended" && isLastAvailableEpisode(doc)) return false;
          const state = {
            inList: true,
            animeId: entry.animeId,
            entryId: entry.entryId,
            folder: entry.folderStr,
            // il resto del codice ragiona sulla STRINGA folder
            folderNum: entry.folderNum,
            episodes: entry.episodes,
            vote: entry.vote,
            rewatches: entry.rewatches,
            notes: entry.notes,
            category,
            available: airing.available
          };
          const prevEps = entry.episodes;
          const next = await applyAction({ type: "setEpisodes", value: currentPos }, state, api, { animeId: entry.animeId, win });
          if (next && next.ok) {
            if (next.episodes > prevEps) {
              setSessionEntry(entry.animeId, { episodes: next.episodes });
              const wrap = doc.querySelector("#aw-np");
              if (wrap) flashToast(wrap, `Lista aggiornata: episodio ${next.episodes}`, "top");
            }
            return true;
          }
          retryAfter = Date.now() + 15e3;
          if (!failNotified) {
            failNotified = true;
            const wrap = doc.querySelector("#aw-np");
            if (wrap) flashToast(wrap, "Lista non aggiornata (errore di rete)", "top");
          }
          return false;
        } catch {
          return false;
        }
      }
      let curVideo2 = null;
      let done = false;
      let busy = false;
      let retryAfter = 0;
      let failNotified = false;
      tryAttach();
      const root = doc.getElementById("player") || doc.body;
      if (root && typeof MutationObserver === "function") {
        const mo = new MutationObserver(() => tryAttach());
        mo.observe(root, { childList: true, subtree: true });
      }
      if (typeof document !== "undefined") {
        doc.addEventListener("aw-wl-integration-changed", (e) => {
          try {
            const d = e && e.detail;
            if (!d || !d.on) return;
            if (d.key === KEY_WL_INTEGRATION2 || d.key === KEY_WL_AUTOPROGRESS2) {
              retryAfter = 0;
              failNotified = false;
              evalProgress();
            }
          } catch {
          }
        });
      }
    } catch {
    }
  }

  // src/watchlist/watchlist-prompt.js
  var KEY_WL_INTEGRATION3 = "aw-wl-integration";
  var WATCHING3 = "watching";
  var WATCHED2 = "watched";
  function _hexToRgb2(h) {
    if (typeof h !== "string") return null;
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h.trim());
    if (!m) return null;
    let s = m[1];
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function _lum2(r) {
    return (0.299 * r[0] + 0.587 * r[1] + 0.114 * r[2]) / 255;
  }
  function _mix2(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function _toHex2(r) {
    return "#" + r.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
  }
  function accentTextTone2(rgb, theme) {
    let r = rgb.slice(), g = 0;
    if (theme === "dark") {
      while (_lum2(r) < 0.62 && g < 16) {
        r = _mix2(r, [255, 255, 255], 0.12);
        g++;
      }
    } else {
      while (_lum2(r) > 0.42 && g < 16) {
        r = _mix2(r, [18, 40, 26], 0.12);
        g++;
      }
    }
    return _toHex2(r);
  }
  function detectTheme2(doc) {
    return doc && doc.body && doc.body.classList.contains("dark") ? "dark" : "light";
  }
  function buildWatchlistPrompt(opts = {}) {
    const doc = opts.doc || (typeof document !== "undefined" ? document : null);
    let theme = opts.theme === "dark" ? "dark" : "light";
    const { title, funcLabel, confirmText, onConfirm, onCancel, extraSlot } = opts;
    if (!doc) return { overlay: null, close() {
    } };
    const funcStrong = el("b", "aw-wl-popup-func", { text: funcLabel || "" });
    const titleKids = title != null && title !== "" ? [String(title)] : ["Aggiornare a ", funcStrong, "?"];
    const titleEl = el("div", "aw-wl-popup-title", { kids: titleKids });
    const extra = extraSlot || el("div", "aw-wl-popup-extra");
    const cancelBtn = el("button", "aw-wl-popup-cancel", { text: "Annulla", attrs: { type: "button" } });
    const confirmBtn = el("button", "aw-wl-popup-confirm", { text: confirmText || "Conferma", attrs: { type: "button" } });
    const actions = el("div", "aw-wl-popup-actions", { kids: [cancelBtn, confirmBtn] });
    const card = el("div", "aw-wl-popup-card", { attrs: { role: "dialog", "aria-modal": "false" }, kids: [titleEl, extra, actions] });
    const overlay = el("div", "aw-wl-popup", { kids: [card] });
    overlay.classList.add(theme === "dark" ? "aw-wl-on-dark" : "aw-wl-on-light");
    function applyAccent() {
      const rawAcc = loadColor() || "#ffffff";
      const accRgb = _hexToRgb2(rawAcc) || [255, 255, 255];
      overlay.style.setProperty("--wl-acc", rawAcc);
      overlay.style.setProperty("--wl-acc-on", _lum2(accRgb) > 0.6 ? "#16181d" : "#ffffff");
      overlay.style.setProperty("--wl-acc-text", accentTextTone2(accRgb, theme));
    }
    applyAccent();
    let closed = false;
    let stopFs = null;
    let themeMo = null;
    let onAccent = null;
    function close() {
      if (closed) return;
      closed = true;
      try {
        if (stopFs) stopFs();
      } catch {
      }
      try {
        if (themeMo) themeMo.disconnect();
      } catch {
      }
      try {
        if (onAccent) doc.removeEventListener("aw-np-accent-changed", onAccent);
      } catch {
      }
      overlay.remove();
    }
    function cancel() {
      close();
      if (typeof onCancel === "function") onCancel();
    }
    function confirm() {
      close();
      if (typeof onConfirm === "function") onConfirm();
    }
    cancelBtn.addEventListener("click", cancel);
    confirmBtn.addEventListener("click", confirm);
    function setTheme(t) {
      theme = t === "dark" ? "dark" : "light";
      overlay.classList.toggle("aw-wl-on-dark", theme === "dark");
      overlay.classList.toggle("aw-wl-on-light", theme === "light");
      applyAccent();
    }
    if (doc.body && typeof MutationObserver === "function") {
      themeMo = new MutationObserver(() => setTheme(detectTheme2(doc)));
      themeMo.observe(doc.body, { attributes: true, attributeFilter: ["class"] });
    }
    onAccent = () => {
      try {
        applyAccent();
      } catch {
      }
    };
    doc.addEventListener("aw-np-accent-changed", onAccent);
    function hide() {
      overlay.classList.add("aw-wl-hidden");
    }
    function show() {
      overlay.classList.remove("aw-wl-hidden");
    }
    doc.body.appendChild(overlay);
    if (fsElement()) hide();
    stopFs = fsChange(() => {
      if (closed) return;
      if (fsElement()) hide();
      else show();
    });
    return { overlay, close, hide, show };
  }
  function initWatchlistPrompt(opts = {}) {
    try {
      let dismissCurrent = function() {
        if (!current) return;
        try {
          current.close();
        } catch {
        }
        current = null;
      }, maybePrompt = function() {
        try {
          if (current) return;
          if (lsGet(KEY_WL_INTEGRATION3) !== "1") return;
          if (!isLoggedIn(win)) return;
          const entry = readEntryMerged(doc, win);
          const animeId2 = entry.animeId;
          if (animeId2 == null) return;
          if (entry.inList && !entry.entryId) return;
          if (wasSeriesRemoved(animeId2)) return;
          const noAskKind = entry.folderStr === WATCHED2 ? NOASK_REWATCH : NOASK_WATCHING;
          if (isNoAsk(animeId2, noAskKind)) return;
          if (wasPromptShown(animeId2)) return;
          if (entry.folderStr === WATCHING3) return;
          const airing = readAiringInfo(doc);
          const category = categorize(airing.stato, airing.available);
          if (category === "notReleased") return;
          if (entry.folderStr !== WATCHED2 && category === "ended" && isLastAvailableEpisode(doc)) return;
          showPrompt(entry, airing, category);
        } catch {
        }
      }, showPrompt = function(entry, airing, category) {
        const animeId2 = entry.animeId;
        markPromptShown(animeId2);
        const isRewatch = entry.folderStr === WATCHED2;
        const funcLabel = isRewatch ? "Rewatch" : "In Corso";
        const state = {
          inList: entry.inList,
          animeId: entry.animeId,
          entryId: entry.entryId,
          folder: entry.folderStr,
          // il resto del codice ragiona sulla STRINGA folder
          folderNum: entry.folderNum,
          episodes: entry.episodes,
          vote: entry.vote,
          rewatches: entry.rewatches,
          notes: entry.notes,
          category,
          available: airing.available
        };
        const ctx = { animeId: animeId2, win };
        async function doWrite() {
          try {
            let next;
            if (isRewatch) {
              const s2 = await applyAction({ type: "setRewatch", value: (entry.rewatches || 0) + 1 }, state, api, ctx);
              next = s2 && s2.ok ? await applyAction({ type: "setEpisodes", value: 0 }, s2, api, ctx) : s2;
            } else {
              next = await applyAction({ type: "setFolder", folder: WATCHING3 }, state, api, ctx);
            }
            if (next && next.ok && next.inList && next.folder) {
              setSessionEntry(animeId2, {
                inList: true,
                entryId: next.entryId,
                folderStr: next.folder,
                folderNum: next.folder != null ? FOLDER_STR_TO_NUM[next.folder] : null,
                episodes: next.episodes,
                vote: next.vote,
                rewatches: next.rewatches
              });
            } else {
              clearPromptShown(animeId2);
              const wrap = doc.querySelector("#aw-np");
              if (wrap) flashToast(wrap, "Lista non aggiornata (errore di rete)", "top");
            }
          } catch {
          }
        }
        dismissCurrent();
        current = buildWatchlistPrompt({
          doc,
          win,
          theme: detectTheme2(doc),
          funcLabel,
          onConfirm() {
            dismissCurrent();
            return doWrite();
          },
          onCancel() {
            dismissCurrent();
            rememberDismissal(animeId2, isRewatch ? NOASK_REWATCH : NOASK_WATCHING);
          }
        });
      }, attach = function(video) {
        if (!video || video.dataset.awWpWired) return;
        video.dataset.awWpWired = "1";
        const onEpisode = () => {
          dismissCurrent();
          maybePrompt();
        };
        if (video.readyState >= 1) maybePrompt();
        video.addEventListener("loadedmetadata", onEpisode);
      }, tryAttach = function() {
        const v = doc.querySelector("#aw-np-video");
        if (v) attach(v);
      };
      const doc = opts.doc || (typeof document !== "undefined" ? document : null);
      const win = opts.win || pageWin;
      if (!doc) return;
      const api = { addOrEdit, editEntry, deleteEntry, FOLDER_STR_TO_NUM };
      let current = null;
      tryAttach();
      const root = doc.getElementById("player") || doc.body;
      if (root && typeof MutationObserver === "function") {
        const mo = new MutationObserver(() => tryAttach());
        mo.observe(root, { childList: true, subtree: true });
      }
      if (typeof document !== "undefined") {
        doc.addEventListener("aw-wl-integration-changed", (e) => {
          try {
            const d = e && e.detail;
            if (!d || d.key !== KEY_WL_INTEGRATION3) return;
            if (d.on) maybePrompt();
            else dismissCurrent();
          } catch {
          }
        });
      }
    } catch {
    }
  }

  // src/watchlist/watchlist-complete.js
  var KEY_WL_INTEGRATION4 = "aw-wl-integration";
  var WATCHED3 = "watched";
  var WATCHED_THRESHOLD = 85;
  function detectTheme3(doc) {
    return doc && doc.body && doc.body.classList.contains("dark") ? "dark" : "light";
  }
  function buildVoteSlot(doc) {
    let value = 0;
    const block = el("div", "aw-wl-stars", { attrs: { role: "slider", "aria-label": "Voto", "aria-valuemin": "0", "aria-valuemax": "10", "aria-valuenow": "0" } });
    const stars = [];
    function render(v) {
      for (let i = 1; i <= 5; i++) {
        const frac = Math.max(0, Math.min(2, v - 2 * (i - 1))) / 2;
        stars[i - 1].style.setProperty("--wl-fill", frac * 100 + "%");
      }
    }
    for (let i = 1; i <= 5; i++) {
      let valueAt = function(e) {
        const rect = star.getBoundingClientRect();
        return e.clientX - rect.left < rect.width / 2 ? half : full;
      };
      const half = 2 * i - 1;
      const full = 2 * i;
      const star = el("span", "aw-wl-star", { kids: [el("i", "fa fa-star")] });
      star.addEventListener("click", (e) => {
        const chosen = valueAt(e);
        value = value === chosen ? 0 : chosen;
        block.setAttribute("aria-valuenow", String(value));
        render(value);
      });
      stars.push(star);
      block.append(star);
    }
    render(0);
    return { block, getVote: () => value };
  }
  function initWatchlistComplete(opts = {}) {
    try {
      let dismissCurrent = function() {
        if (!current) return;
        try {
          current.close();
        } catch {
        }
        current = null;
      }, maybePromptComplete = function() {
        try {
          if (current) return false;
          if (lsGet(KEY_WL_INTEGRATION4) !== "1") return false;
          if (!isLoggedIn(win)) return false;
          const video = doc.querySelector("#aw-np-video");
          if (!video) return false;
          const dur = video.duration;
          if (!dur || !isFinite(dur)) return false;
          if (video.currentTime / dur * 100 < WATCHED_THRESHOLD) return false;
          const entry = readEntryMerged(doc, win);
          const animeId2 = entry.animeId;
          if (animeId2 == null) return false;
          if (entry.inList && !entry.entryId) return false;
          if (wasSeriesRemoved(animeId2)) return false;
          if (isNoAsk(animeId2, NOASK_COMPLETE)) return false;
          if (shownComplete.has(animeId2)) return false;
          if (entry.folderStr === WATCHED3) return false;
          const airing = readAiringInfo(doc);
          const category = categorize(airing.stato, airing.available);
          if (category !== "ended") return false;
          const cap = episodeCap(airing.available);
          if (cap <= 0) return false;
          if (!isLastAvailableEpisode(doc)) return false;
          showPrompt(entry, airing, category);
          return true;
        } catch {
          return false;
        }
      }, showPrompt = function(entry, airing, category) {
        const animeId2 = entry.animeId;
        shownComplete.add(animeId2);
        const state = {
          inList: entry.inList,
          animeId: entry.animeId,
          entryId: entry.entryId,
          folder: entry.folderStr,
          // il resto del codice ragiona sulla STRINGA folder
          folderNum: entry.folderNum,
          episodes: entry.episodes,
          vote: entry.vote,
          rewatches: entry.rewatches,
          notes: entry.notes,
          category,
          available: airing.available
        };
        const ctx = { animeId: animeId2, win };
        const vote = buildVoteSlot(doc);
        async function doWrite() {
          try {
            let next = await applyAction({ type: "setFolder", folder: WATCHED3 }, state, api, ctx);
            const v = vote.getVote();
            if (v > 0 && next && next.ok && next.inList) {
              next = await applyAction({ type: "setVote", value: v }, next, api, ctx);
            }
            if (next && next.ok && next.inList && next.folder) {
              setSessionEntry(animeId2, {
                inList: true,
                entryId: next.entryId,
                folderStr: next.folder,
                folderNum: next.folder != null ? FOLDER_STR_TO_NUM[next.folder] : null,
                episodes: next.episodes,
                vote: next.vote,
                rewatches: next.rewatches
              });
            } else {
              shownComplete.delete(animeId2);
              const wrap = doc.querySelector("#aw-np");
              if (wrap) flashToast(wrap, "Lista non aggiornata (errore di rete)", "top");
            }
          } catch {
          }
        }
        dismissCurrent();
        current = buildWatchlistPrompt({
          doc,
          win,
          theme: detectTheme3(doc),
          funcLabel: "Completo",
          confirmText: "Salva",
          extraSlot: vote.block,
          onConfirm() {
            dismissCurrent();
            return doWrite();
          },
          onCancel() {
            dismissCurrent();
            rememberDismissal(animeId2, NOASK_COMPLETE);
          }
        });
      }, attach = function(video) {
        if (!video || video.dataset.awWcWired) return;
        video.dataset.awWcWired = "1";
        let fired = false;
        video.addEventListener("loadedmetadata", () => {
          fired = false;
          if (current) {
            if (!isLastAvailableEpisode(doc)) dismissCurrent();
          }
        });
        video.addEventListener("timeupdate", () => {
          if (fired || !video.duration || !isFinite(video.duration)) return;
          const p = video.currentTime / video.duration * 100;
          if (p < WATCHED_THRESHOLD) return;
          if (maybePromptComplete()) fired = true;
        });
      }, tryAttach = function() {
        const v = doc.querySelector("#aw-np-video");
        if (v) attach(v);
      };
      const doc = opts.doc || (typeof document !== "undefined" ? document : null);
      const win = opts.win || pageWin;
      if (!doc) return;
      const api = { addOrEdit, editEntry, deleteEntry, FOLDER_STR_TO_NUM };
      const shownComplete = /* @__PURE__ */ new Set();
      let current = null;
      tryAttach();
      const root = doc.getElementById("player") || doc.body;
      if (root && typeof MutationObserver === "function") {
        const mo = new MutationObserver(() => tryAttach());
        mo.observe(root, { childList: true, subtree: true });
      }
      if (typeof document !== "undefined") {
        doc.addEventListener("aw-wl-integration-changed", (e) => {
          try {
            const d = e && e.detail;
            if (!d || d.key !== KEY_WL_INTEGRATION4) return;
            if (!d.on) dismissCurrent();
          } catch {
          }
        });
      }
    } catch {
    }
  }

  // src/main.js
  installSrcBlocker();
  function bootstrap() {
    setTimeout(init, 200);
    setTimeout(initWatchlist, 200);
    setTimeout(initAutoProgress, 200);
    setTimeout(initWatchlistPrompt, 200);
    setTimeout(initWatchlistComplete, 200);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
