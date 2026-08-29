// ==UserScript==
// @name         AnimeWorld Better Player
// @namespace    aw-better-player
// @version      2.4.0
// @match        *://www.animeworld.ac/play/*
// @run-at       document-start
// @description  Il player migliore di sempre — riscritto da zero.
// @description:it Il player migliore di sempre — riscritto da zero.
// @license      MIT
// @grant        unsafeWindow
// @connect      cibernetic-gg.workers.dev
// ==/UserScript==

(() => {
    'use strict';

    const pageWin=(typeof unsafeWindow!=='undefined')?unsafeWindow:window;

    const HIDE_DELAY_MS=3000,SKIP_SECONDS=85,SAVE_INTERVAL_MS=5000,RESUME_MIN_POS=5,RESUME_END_GAP=10,RESUME_MAX_AGE=30*24*60*60*1000,PRELOAD_THRESHOLD=0.75;
    const KEY_VOL='aw-np-vol',KEY_MUTE='aw-np-muted',KEY_GLOBAL='aw-np-global',KEY_RESUME_ENABLE='aw-np-resume-enabled',KEY_RESUME_PFX='aw-np-resume:',KEY_SEEK_SECS='aw-np-seek-secs',KEY_AUTOEP_ENABLE='aw-np-autoep-enabled',KEY_AUTOEP_PFX='aw-np-autoep:',KEY_AUTOPLAY_ENABLE='aw-np-autoplay-enabled',KEY_COLOR='aw-np-color',KEY_COLOR_GLOBAL='aw-np-color-global',KEY_ICON_COLOR='aw-np-icon-color',KEY_TOP_COLOR='aw-np-top-color',KEY_FLASH_ENABLE='aw-np-flash-enabled',KEY_CLOCK='aw-np-clock-enabled',KEY_SPEED_POPUP='aw-np-speed-popup-enabled',KEY_CONN_MONITOR='aw-np-conn-monitor-enabled',KEY_SPEED='aw-np-speed',KEY_HOTKEYS='aw-np-hotkeys',KEY_COLLECT_NOTICE='aw-np-collect-notice';
    const SEEK_DEFAULT=5,SEEK_MIN=5,SEEK_MAX=30,SEEK_STEP=5,SPEED_DEFAULT=1,SPEED_MIN=0.25,SPEED_MAX=3,SPEED_STEP=0.25;
    const PALETTE=[{name:'Bianco',hex:'#ffffff'},{name:'Rosso',hex:'#f44336'},{name:'Arancio',hex:'#ff9800'},{name:'Giallo',hex:'#ffeb3b'},{name:'Verde',hex:'#4caf50'},{name:'Ciano',hex:'#00bcd4'},{name:'Azzurro',hex:'#42a5f5'},{name:'Blu',hex:'#1565c0'},{name:'Viola',hex:'#9c27b0'},{name:'Rosa',hex:'#e91e8c'}];

    // ── Blocca playerServersAndDownloads.js ───────────────────────────────────
    const _srcDesc=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,'src');
    Object.defineProperty(HTMLScriptElement.prototype,'src',{configurable:true,enumerable:true,get(){return _srcDesc.get.call(this);},set(val){if(typeof val==='string'&&val.includes('playerServersAndDownloads'))return;_srcDesc.set.call(this,val);}});

    // ── Storage helpers ───────────────────────────────────────────────────────
    const lsGet=k=>{try{return localStorage.getItem(k);}catch{return null;}};
    const lsSet=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
    const lsDel=k=>{try{localStorage.removeItem(k);}catch{}};

    // ── Impostazioni ──────────────────────────────────────────────────────────
    let _cachedAnimeId='';
    const animeId=()=>{if(!_cachedAnimeId){const el=document.querySelector('#player');if(el)_cachedAnimeId=el.dataset.animeId||'';}return _cachedAnimeId;};
    const isGlobalOn=()=>lsGet(KEY_GLOBAL)!=='0';
    const pKey=k=>isGlobalOn()?k:k+':'+(animeId()||'unknown');
    const isResumeOn=()=>lsGet(pKey(KEY_RESUME_ENABLE))!=='0';
    const isAutoEpOn=()=>lsGet(pKey(KEY_AUTOEP_ENABLE))==='1';
    const isAutoPlayOn=()=>lsGet(pKey(KEY_AUTOPLAY_ENABLE))==='1';
    const isColorGlobalOn=()=>lsGet(KEY_COLOR_GLOBAL)!=='0';
    const isIconColorOn=()=>lsGet(KEY_ICON_COLOR)==='1';
    const isTopColorOn=()=>lsGet(KEY_TOP_COLOR)==='1';
    const isFlashOn=()=>lsGet(KEY_FLASH_ENABLE)!=='0';
    const isConnMonitorOn=()=>lsGet(KEY_CONN_MONITOR)!=='0';
    const isClockOn=()=>lsGet(KEY_CLOCK)!=='0';
    const isSpeedPopupOn=()=>lsGet(KEY_SPEED_POPUP)!=='0';
    // ── Hotkey rimappabili (globali) ───────────────────────────────────────────
    const HOTKEY_ACTIONS=['fullscreen','mute','restart','skipOp','undoSkip','prev','next','reload','legend'];
    const DEFAULT_HOTKEYS={fullscreen:'f',mute:'m',restart:'r',skipOp:'o',undoSkip:'b',prev:'p',next:'n',reload:'s',legend:'a'};
    const loadHotkeys=()=>{
        let raw;try{raw=JSON.parse(lsGet(KEY_HOTKEYS)||'null');}catch{raw=null;}
        const out={},used=new Set();
        if(raw&&typeof raw==='object'){
            for(const a of HOTKEY_ACTIONS){
                const v=raw[a];
                if(typeof v==='string'&&/^[a-z]$/.test(v)&&!used.has(v)){out[a]=v;used.add(v);}
            }
        }
        // completa eventuali azioni mancanti coi default (saltando lettere già occupate)
        for(const a of HOTKEY_ACTIONS){
            if(out[a])continue;
            let v=DEFAULT_HOTKEYS[a];
            if(used.has(v)){v=null;for(let c=97;c<=122;c++){const ch=String.fromCharCode(c);if(!used.has(ch)){v=ch;break;}}}
            if(v){out[a]=v;used.add(v);}
        }
        return out;
    };
    const saveHotkeys=map=>lsSet(KEY_HOTKEYS,JSON.stringify(map));
    // ── Raccolta dati skip (anonima) ───────────────────────────────────────────
    const SKIP_COLLECT_URL='https://awbp-skip-collector.cibernetic-gg.workers.dev/collect';   // endpoint Cloudflare Worker
    const SKIP_ED_THRESHOLD=2/3;               // posizione oltre cui un evento è classificato 'ed'
    const SCRIPT_VERSION='2.4.0';
    const getMalId=()=>{try{const a=document.querySelector('a.watchlist-edit-mal[href*="myanimelist.net/anime/"],a[href*="myanimelist.net/anime/"]');const m=a&&a.getAttribute('href')?.match(/myanimelist\.net\/anime\/(\d+)/);return m?m[1]:null;}catch{return null;}};
    const getEpisodeNum=()=>{try{const a=document.querySelector('.episode a.active[data-episode-num],.episodes a.active[data-episode-num],a.active[data-episode-num]');const n=a&&(a.dataset.episodeNum||a.dataset.num);if(n&&/^\d+$/.test(n))return n;const m=(document.title||'').match(/Episodio\s+(\d+)/i);return m?m[1]:null;}catch{return null;}};
    // dub = audio italiano; qualsiasi altra lingua audio (jp/cn/kr/…) = sub; unknown se non leggibile
    const getAudioType=()=>{
        try{
            const link=document.querySelector('a[href*="filter?language="]');
            if(link){const code=(link.getAttribute('href').match(/language=([a-z-]+)/i)||[])[1];if(code)return /^it/i.test(code)?'dub':'sub';
                const txt=(link.textContent||'').trim().toLowerCase();if(txt)return /^it|ital/.test(txt)?'dub':'sub';}
            // fallback: cerca l'etichetta "Audio:" nella scheda
            const nodes=document.querySelectorAll('dt,dd,span,div,li');
            for(const n of nodes){const t=(n.textContent||'').trim();const m=t.match(/^Audio:?\s*([A-Za-z][A-Za-z ]+)$/i);if(m){return /ital/i.test(m[1])?'dub':'sub';}}
        }catch{}
        return 'unknown';
    };
    // invio anonimo "best effort": nessun identificatore, fallisce in silenzio
    function sendSkipData(payload){
        try{
            if(!SKIP_COLLECT_URL||SKIP_COLLECT_URL.indexOf('__')===0)return; // non configurato → no-op
            const malId=getMalId(),ep=getEpisodeNum();
            if(!malId||!ep)return;
            const body=JSON.stringify(Object.assign({malId,ep,audio:getAudioType(),v:SCRIPT_VERSION,ts:Date.now()},payload));
            fetch(SKIP_COLLECT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
        }catch{}
    }
    // skip manuale (tasto O / bottone): start = posizione attuale, end = start + SKIP_SECONDS
    function collectManualSkip(video){
        try{
            const dur=video.duration,start=video.currentTime;
            if(!isFinite(dur)||dur<=0||!isFinite(start))return;
            const type=(start/dur)>=SKIP_ED_THRESHOLD?'ed':'op';
            sendSkipData({type,start:+start.toFixed(2),end:+Math.min(dur,start+SKIP_SECONDS).toFixed(2),duration:+dur.toFixed(2)});
        }catch{}
    }
    // cambio episodio: registrato solo se avviene nell'ultimo terzo (segnale di fine contenuto)
    function collectNext(video){
        try{
            const dur=video.duration,pos=video.currentTime;
            if(!isFinite(dur)||dur<=0||!isFinite(pos))return;
            if((pos/dur)<SKIP_ED_THRESHOLD)return;
            sendSkipData({type:'next',position:+pos.toFixed(2),duration:+dur.toFixed(2)});
        }catch{}
    }
    const colorKey=()=>isColorGlobalOn()?KEY_COLOR:KEY_COLOR+':'+(animeId()||'unknown');
    const loadColor=()=>lsGet(colorKey())||'#ffffff';
    const loadSeekSecs=()=>{const v=parseInt(lsGet(pKey(KEY_SEEK_SECS))??String(SEEK_DEFAULT),10);return isNaN(v)?SEEK_DEFAULT:Math.max(SEEK_MIN,Math.min(SEEK_MAX,v));};
    const loadSpeed=()=>{const v=parseFloat(lsGet(pKey(KEY_SPEED))??String(SPEED_DEFAULT));return isNaN(v)?SPEED_DEFAULT:Math.max(SPEED_MIN,Math.min(SPEED_MAX,v));};
    const fmtSpeed=v=>v.toFixed(2)+'x';

    // ── Colore ────────────────────────────────────────────────────────────────
    function applyColor(hex,wrap,dotEl){
        if(wrap){
            wrap.style.setProperty('--np-accent',hex);
            wrap.style.setProperty('--np-accent-bg',`color-mix(in srgb, ${hex} 30%, #282828)`);
            wrap.style.setProperty('--np-accent-bg-fg',`color-mix(in srgb, #ffffff 78%, ${hex})`);
            wrap.style.setProperty('--np-accent-state-1',`color-mix(in srgb, ${hex} 20%, transparent)`);
            wrap.style.setProperty('--np-accent-state-2',`color-mix(in srgb, ${hex} 35%, transparent)`);
            wrap.style.setProperty('--np-accent-dim',`color-mix(in srgb, #ffffff 60%, ${hex})`);
        }
        if(dotEl)dotEl.style.background=hex;
    }

    // ── Episodio automatico ───────────────────────────────────────────────────
    const saveLastEpisode=t=>{const a=animeId();if(a)lsSet(KEY_AUTOEP_PFX+a,t);};
    const loadLastEpisode=()=>{const a=animeId();return a?lsGet(KEY_AUTOEP_PFX+a):null;};

    // ── Volume ────────────────────────────────────────────────────────────────
    function loadVol(){const v=parseFloat(lsGet(KEY_VOL)??'1');return{vol:isNaN(v)?1:Math.max(0,Math.min(1,v)),muted:lsGet(KEY_MUTE)==='true'};}
    const saveVol=(vol,muted)=>{lsSet(KEY_VOL,String(vol));lsSet(KEY_MUTE,String(muted));};

    // ── Resume ────────────────────────────────────────────────────────────────
    let _activeToken='',_stopSavingFn=null;
    const resumeKey=()=>KEY_RESUME_PFX+(_activeToken||location.pathname);
    const resumeTs=()=>resumeKey()+':ts';
    function saveResumePos(t){if(!isResumeOn()||!isFinite(t)||t<=RESUME_MIN_POS)return;lsSet(resumeKey(),String(t));lsSet(resumeTs(),String(Date.now()));}
    function cleanupResumeStorage(){try{const now=Date.now();Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).forEach(k=>{if(!k?.startsWith(KEY_RESUME_PFX)||k.endsWith(':ts'))return;const ts=parseFloat(lsGet(k+':ts')??'');if(isNaN(ts)||now-ts>RESUME_MAX_AGE){lsDel(k);lsDel(k+':ts');}});}catch{}}

    // ── Utilities ─────────────────────────────────────────────────────────────
    function fmt(s){const t=Math.floor(s||0),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),sec=t%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
    function mk(tag,id){const e=document.createElement(tag);if(id)e.id=id;return e;}
    // Popup informativo (una tantum) sulla raccolta dati anonima
    function showCollectNotice(wrap,video){
        try{
            if(lsGet(KEY_COLLECT_NOTICE)==='1')return null;
            const host=wrap||document.body;
            if(host.querySelector('#aw-np-collect-notice'))return null;
            const wasPlaying=video&&!video.paused;
            if(wasPlaying){try{video.pause();}catch{}}
            const ov=mk('div','aw-np-collect-notice');
            ov.style.cssText='position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);backdrop-filter:blur(14px) saturate(.85);-webkit-backdrop-filter:blur(14px) saturate(.85);font-family:Arial,"Segoe UI",sans-serif;animation:aw-np-pop .28s cubic-bezier(.34,1.2,.64,1);';
            const box=mk('div');
            box.style.cssText='max-width:410px;width:calc(100% - 56px);background:var(--np-accent-bg,#282828);border:1px solid var(--np-accent-state-2,rgba(255,255,255,.18));border-radius:16px;padding:22px 24px;box-shadow:0 18px 50px rgba(0,0,0,.55);';
            const h=mk('div');h.textContent='Messaggio da AW Better Player';
            h.style.cssText='font-size:15.5px;font-weight:700;margin:0 0 12px;color:var(--np-accent,#ec4f4f);text-shadow:0 0 1px rgba(255,255,255,.5),0 1px 2px rgba(0,0,0,.4);letter-spacing:.01em;';
            const p=mk('div');
            p.style.cssText='font-size:13.5px;line-height:1.6;color:var(--np-accent-bg-fg,#fff);opacity:.92;';
            p.textContent='A partire dalla versione 2.4.0, è stata introdotta una raccolta dati completamente anonima. Vengono inviati unicamente i tempi di skip delle opening/ending, con lo scopo di creare in futuro un database per il salto automatico ed intelligente.';
            const sign=mk('div');
            sign.style.cssText='font-size:12.5px;line-height:1.5;color:var(--np-accent-bg-fg,#fff);opacity:.8;margin-top:12px;';
            sign.innerHTML='Grazie per l\u2019attenzione,<br><span style="font-weight:700;font-size:13.5px;opacity:1;letter-spacing:.02em;color:var(--np-accent,#ec4f4f)">KeyMan98</span>';
            const row=mk('div');row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:20px;';
            const lbl=mk('label');lbl.style.cssText='display:inline-flex;align-items:center;gap:9px;font-size:12.5px;line-height:1;color:var(--np-accent-bg-fg,#fff);opacity:.8;cursor:pointer;user-select:none;transition:opacity .2s;';
            lbl.addEventListener('mouseenter',()=>{lbl.style.opacity='1';});
            lbl.addEventListener('mouseleave',()=>{lbl.style.opacity='.8';});
            const chk=mk('input');chk.type='checkbox';chk.style.cssText='width:15px;height:15px;margin:0;flex-shrink:0;cursor:pointer;accent-color:var(--np-accent,#ec4f4f);position:relative;top:0;';
            const lblTxt=mk('span');lblTxt.textContent='Non mostrare più';lblTxt.style.cssText='line-height:1;position:relative;top:.5px;';
            lbl.append(chk,lblTxt);
            const btn=mk('button');btn.textContent='Chiudi';
            btn.style.cssText='background:color-mix(in srgb, var(--np-accent,#ec4f4f) 24%, #141414);color:var(--np-accent-bg-fg,#fff);border:1px solid var(--np-accent-state-2,rgba(255,255,255,.16));border-radius:9px;padding:9px 24px;font-size:13px;font-weight:700;letter-spacing:.02em;cursor:pointer;font-family:inherit;flex-shrink:0;transition:background-color .25s cubic-bezier(.4,0,.2,1),transform .12s,box-shadow .2s;';
            btn.addEventListener('mouseenter',()=>{btn.style.background='color-mix(in srgb, var(--np-accent,#ec4f4f) 32%, #1a1a1a)';btn.style.boxShadow='0 2px 12px rgba(0,0,0,.3)';});
            btn.addEventListener('mouseleave',()=>{btn.style.background='color-mix(in srgb, var(--np-accent,#ec4f4f) 24%, #141414)';btn.style.boxShadow='none';});
            btn.addEventListener('pointerdown',()=>{btn.style.transform='scale(.96)';});
            btn.addEventListener('pointerup',()=>{btn.style.transform='scale(1)';});
            const close=()=>{if(chk.checked)lsSet(KEY_COLLECT_NOTICE,'1');ov.remove();if(wasPlaying){video.play().catch(()=>{});}};
            btn.addEventListener('click',e=>{e.stopPropagation();close();});
            ov.addEventListener('click',e=>e.stopPropagation());
            row.append(lbl,btn);
            box.append(h,p,sign,row);ov.append(box);
            host.appendChild(ov);
            return ov;
        }catch{return null;}
    }
    function mkBtn(id,html,tip){const b=mk('button');b.className='np-btn';b.id=id;b.innerHTML=html;b.tabIndex=-1;if(tip){const t=document.createElement('span');t.className='np-tip';t.textContent=tip;b.appendChild(t);}return b;}
    function mkIcon(btn,html){const s=document.createElement('span');s.className='np-icon';s.innerHTML=html;btn.prepend(s);return s;}
    function setIcon(el,html){if(el)el.innerHTML=html;}
    function setTip(btn,text){const t=btn.querySelector('.np-tip');if(t)t.textContent=text;}
    function mkRowTip(text){const t=document.createElement('span');t.className='np-row-tip';t.textContent=text;return t;}
    function mkSwitch(checked){const label=document.createElement('label');label.className='np-switch';const input=document.createElement('input');input.type='checkbox';input.checked=checked;const track=document.createElement('span');track.className='np-switch-track';const thumb=document.createElement('span');thumb.className='np-switch-thumb';label.append(input,track,thumb);return{label,input};}
    function getAdjacentEpisode(dir){const all=Array.from(document.querySelectorAll('.episode a'));const idx=all.findIndex(a=>a.classList.contains('active'));if(idx===-1)return null;return dir==='next'?(all[idx+1]??null):(all[idx-1]??null);}
    function getUrlForToken(token){return fetchWithRetry(`/api/episode/serverPlayerAnimeWorld?alt=1&id=${token}`,{credentials:'same-origin'}).then(r=>r.text()).then(html=>{const m=html.match(/["']?file["']?\s*:\s*["']([^"']+)["']/i);return m?m[1].replace(/\\\//g,'/'):null;}).catch(()=>null);}


    // ── Fetch con retry ───────────────────────────────────────────────────────
    function fetchWithRetry(url,opts,retries=3,delay=1000){
        return fetch(url,opts).then(r=>{if(!r.ok)throw new Error(r.status);return r;}).catch(err=>{
            if(retries<=0)throw err;
            return new Promise(res=>setTimeout(res,delay)).then(()=>fetchWithRetry(url,opts,retries-1,delay*2));
        });
    }

    // ── Fullscreen helpers ────────────────────────────────────────────────────
    const fsElement=()=>document.fullscreenElement||document.mozFullScreenElement||document.webkitFullscreenElement||null;
    const fsExit=()=>(document.exitFullscreen||document.mozCancelFullScreen||document.webkitExitFullscreen)?.call(document).catch(()=>{});
    const fsRequest=el=>(el.requestFullscreen||el.mozRequestFullScreen||el.webkitRequestFullscreen)?.call(el).catch(()=>{});
    const fsChange=cb=>{['fullscreenchange','mozfullscreenchange','webkitfullscreenchange'].forEach(e=>document.addEventListener(e,cb));return()=>['fullscreenchange','mozfullscreenchange','webkitfullscreenchange'].forEach(e=>document.removeEventListener(e,cb));};

    // ── PiP helpers ───────────────────────────────────────────────────────────
    const pipElement=()=>document.pictureInPictureElement||null;
    const pipExit=()=>document.exitPictureInPicture?.().catch(()=>{});
    const pipRequest=el=>{if(el.readyState>=1)return el.requestPictureInPicture?.().catch(()=>{});};

    const isMobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    // ── Shared panel builder: mkSwitchRow ─────────────────────────────────────
    function mkSwitchRow(label,tip,isOn,onChange,extraStyle='',stopProp=false){
        const row=document.createElement('div');
        row.style.cssText=`position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;${extraStyle}`;
        row.dataset.tip='1';
        const lbl=document.createElement('span');lbl.textContent=label;
        const{label:sw,input:toggle}=mkSwitch(typeof isOn==='function'?isOn():isOn);
        toggle.addEventListener('change',e=>{if(stopProp)e.stopPropagation();onChange(toggle.checked);});
        row.addEventListener('click',()=>{toggle.checked=!toggle.checked;toggle.dispatchEvent(new Event('change'));});
        sw.addEventListener('click',e=>e.stopPropagation());
        row.append(lbl,sw,mkRowTip(tip));
        return{row,toggle};
    }

    // ── Shared panel builder: mkStepRow ──────────────────────────────────────
    function mkStepRow(label,tipText,val,setVal,step,fmtFn,BTN_CTRL_STYLE){
        const row=document.createElement('div');row.style.cssText='position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;user-select:none;';row.dataset.tip='1';
        const valEl=document.createElement('span');valEl.style.cssText='min-width:40px;text-align:center;font-weight:500;';
        const upd=()=>valEl.textContent=fmtFn(val());
        const bM=document.createElement('button');bM.textContent='−';bM.style.cssText=BTN_CTRL_STYLE;bM.tabIndex=-1;
        const bP=document.createElement('button');bP.textContent='+';bP.style.cssText=BTN_CTRL_STYLE;bP.tabIndex=-1;
        bM.addEventListener('click',e=>{e.stopPropagation();setVal(-step);upd();});
        bP.addEventListener('click',e=>{e.stopPropagation();setVal(+step);upd();});
        const ctrl=document.createElement('div');ctrl.style.cssText='display:flex;align-items:center;gap:6px;';ctrl.append(bM,valEl,bP);
        const lbl=document.createElement('span');lbl.textContent=label;
        row.append(lbl,ctrl,mkRowTip(tipText));
        upd();return{row,update:upd};
    }

    // ── Shared: buildTopBar ───────────────────────────────────────────────────
    function buildTopBar(wrap,colorPanel){
        const topBar=mk('div','aw-np-top');topBar.classList.add('np-ui-layer');
        const topLeft=mk('div','aw-np-top-left'),topRight=mk('div','aw-np-top-right');
        const titleEl=mk('div','aw-np-title'),epInfoEl=mk('div','aw-np-epinfo'),dotEl=mk('div','aw-np-dot'),kbdBtn=mk('div','aw-np-kbd-btn');
        kbdBtn.textContent='A';kbdBtn.setAttribute('aria-label','Mostra hotkey');
        const brandEl=mk('div','aw-np-brand');brandEl.textContent='AW Better Player';
        const allEps=Array.from(document.querySelectorAll('.episode a'));
        const epIdx=allEps.findIndex(a=>a.classList.contains('active'));
        const activeEp=epIdx!==-1?allEps[epIdx]:null;
        const epNum=activeEp?(activeEp.textContent.trim()||String(epIdx+1)):'?';
        const epMaxNum=allEps.reduce((m,a)=>{const n=parseFloat(a.textContent.trim());return isNaN(n)?m:Math.max(m,n);},0);
        titleEl.textContent=document.querySelector('h1.title, .title-1')?.textContent?.trim()||document.title.split(' Episodio')[0]||'';
        epInfoEl.textContent=`Episodio ${epNum}/${epMaxNum>0?String(epMaxNum):(allEps.length||'?')}`;
        topLeft.append(titleEl,epInfoEl);
        topRight.append(brandEl,dotEl,kbdBtn);
        topBar.append(topLeft,topRight);
        return{topBar,dotEl,kbdBtn,titleEl,epInfoEl};
    }

    // ── Shared: connection monitor ───────────────────────────────────────────
    const CONN_SVG_SLOW='<path d="M12 2L1 21h22L12 2zm0 3.5L21 20H3L12 5.5zM11 10v4h2v-4zm0 6v2h2v-2z" fill="#fff"/>';
    const CONN_SVG_GOOD='<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#fff"/>';
    const CONN_MSG_SLOW='<span>Connessione lenta, video</span><span>potenzialmente instabile</span>';
    const CONN_MSG_GOOD='<span>Connessione buona, video</span><span>potenzialmente stabile</span>';
    function _buildConnToast(wrap){
        let toast=wrap.querySelector('#aw-np-conn-toast');
        if(toast)return toast;
        toast=mk('div','aw-np-conn-toast');
        const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
        icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('width','13');icon.setAttribute('height','13');icon.style.flexShrink='0';
        const msg=mk('div');msg.className='conn-msg';
        toast.append(icon,msg);
        wrap.appendChild(toast);
        return toast;
    }
    function _showConnToast(wrap,slow,hideTimerRef){
        const toast=_buildConnToast(wrap);
        const icon=toast.querySelector('svg'),msg=toast.querySelector('.conn-msg');
        icon.innerHTML=slow?CONN_SVG_SLOW:CONN_SVG_GOOD;
        msg.innerHTML=slow?CONN_MSG_SLOW:CONN_MSG_GOOD;
        toast.classList.remove('slow','good');
        toast.classList.add(slow?'slow':'good');
        toast.style.opacity='1';
        clearTimeout(hideTimerRef.id);
        hideTimerRef.id=setTimeout(()=>{toast.style.opacity='0';},3000);
    }
    function buildConnectionMonitor(video,wrap){
        // Soglie con isteresi: zona morta 1.3-1.8 previene flickering
        const SLOW_TH=1.3,GOOD_TH=1.8,WIN=6,SLOW_COUNT=4,GOOD_COUNT=6,MIN_SAMPLE_INTERVAL=950;
        const samples=new Float32Array(WIN);
        let sIdx=0,sCount=0,sSum=0;
        let lastBufEnd=null,lastTs=null,connState=null,slowN=0,goodN=0,initialShown=false;
        const hideRef={id:null};
        const getBufEnd=()=>{const n=video.buffered.length;if(!n)return null;const ct=video.currentTime;for(let i=n-1;i>=0;i--){if(video.buffered.start(i)<=ct+0.5)return video.buffered.end(i);}return null;};
        const pushSample=v=>{
            if(sCount<WIN){samples[sIdx]=v;sSum+=v;sCount++;}
            else{sSum+=v-samples[sIdx];samples[sIdx]=v;}
            sIdx=(sIdx+1)%WIN;
        };
        const onProgress=()=>{
            if(!isConnMonitorOn()){
                const t=wrap.querySelector('#aw-np-conn-toast');
                if(t)t.style.opacity='0';
                return;
            }
            if(video.networkState!==2)return;
            const now=Date.now();
            if(lastTs!==null&&now-lastTs<MIN_SAMPLE_INTERVAL)return;
            const bufEnd=getBufEnd();
            if(bufEnd===null){lastBufEnd=null;lastTs=null;return;}
            if(lastBufEnd!==null&&lastTs!==null){
                const dt=(now-lastTs)/1000,db=bufEnd-lastBufEnd;
                if(dt>0.1&&db>=0){
                    pushSample(db/dt);
                    if(sCount>=WIN){
                        const avg=sSum/WIN;
                        const isSlow=avg<SLOW_TH,isGood=avg>=GOOD_TH;
                        if(isSlow){slowN++;goodN=0;}else if(isGood){goodN++;slowN=0;}
                        if(!initialShown){
                            if(slowN>=SLOW_COUNT||goodN>=GOOD_COUNT){
                                initialShown=true;connState=slowN>=SLOW_COUNT?'slow':'good';
                                _showConnToast(wrap,connState==='slow',hideRef);
                            }
                        }else{
                            if(slowN>=SLOW_COUNT&&connState!=='slow'){connState='slow';_showConnToast(wrap,true,hideRef);}
                            else if(goodN>=GOOD_COUNT&&connState!=='good'){connState='good';_showConnToast(wrap,false,hideRef);}
                        }
                    }
                }
            }
            lastBufEnd=bufEnd;lastTs=now;
        };
        const onSeeking=()=>{lastBufEnd=null;lastTs=null;sCount=0;sIdx=0;sSum=0;slowN=0;goodN=0;};
        video.addEventListener('progress',onProgress);
        video.addEventListener('seeking',onSeeking);
        return{clearMonitor:()=>{video.removeEventListener('progress',onProgress);video.removeEventListener('seeking',onSeeking);clearTimeout(hideRef.id);}};
    }
    // ── Shared: buildHotkeyPanel (tastiera) ───────────────────────────────────
    function buildHotkeyPanel(initMap,onCommit,hooks){
        const mc=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e;};
        // Metadati azioni rimappabili: icona, nome, descrizione
        const ACT={
            mute:{ic:IC.mute,f:'TOGGLE VOLUME',d:'Attiva/disattiva l\'audio'},
            fullscreen:{ic:IC.fsOn,f:'FULL SCREEN',d:'Entra/esce dal full screen'},
            skipOp:{ic:IC.skip,f:'SKIP OP/ED',d:'Salto in avanti di 1:25 min.'},
            undoSkip:{ic:IC.undo,f:'ANNULLA SKIP',d:'Torna indietro di 1:25 min.'},
            prev:{ic:IC.prev,f:'PRECEDENTE',d:'Episodio precedente'},
            next:{ic:IC.next,f:'SUCCESSIVO',d:'Episodio successivo'},
            restart:{ic:IC.restart,f:'RESTART',d:'Riparte da inizio episodio'},
            reload:{ic:IC.unlock,f:'SBLOCCA VIDEO',d:'Forza un refresh del video'},
            legend:{ic:'<span class="aw-np-key-a-badge">A</span>',f:'LEGENDA HOTKEY',d:'Apre/chiude questa legenda'},
        };
        let curMap=Object.assign({},initMap);   // mappa attiva (persistita)
        let editMap=null;                        // anteprima durante l'edit
        let editing=false,listening=null;        // stato edit + lettera in ascolto

        const overlay=mk('div','aw-np-hotkey-overlay');
        const inner=mk('div','aw-np-hotkey-inner');
        // Barra toolbar (in alto, allineata a sinistra col tasto \)
        const bar=mc('div','aw-np-kbd-bar');
        const BAR_IC={
            edit:svg('<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>'),
            ok:svg('<path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'),
            cancel:svg('<path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>'),
            reset:svg('<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>'),
            x:svg('<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'),
        };
        const mkBarBtn=(cls,ic,title)=>{const b=mc('div','aw-np-kbd-bar-btn '+cls);b.innerHTML=ic;const t=mc('span','np-tip');t.textContent=title;b.appendChild(t);return b;};
        const btnEdit=mkBarBtn('is-edit',BAR_IC.edit,'Modifica le scorciatoie');
        const btnReset=mkBarBtn('is-reset',BAR_IC.reset,'Ripristina i tasti predefiniti');
        const btnOk=mkBarBtn('is-ok',BAR_IC.ok,'Salva le modifiche');
        const btnCancel=mkBarBtn('is-cancel',BAR_IC.cancel,'Scarta le modifiche');
        const btnX=mkBarBtn('is-x',BAR_IC.x,'Chiudi');
        const barLeft=mc('div','aw-np-kbd-bar-left'),barRight=mc('div','aw-np-kbd-bar-right');
        barLeft.append(btnEdit,btnOk,btnCancel,btnReset);
        barRight.append(btnX);
        bar.append(barLeft,barRight);

        const kbd=mc('div','aw-np-kbd');
        const fnStrip=mc('div','aw-np-kbd-fn');
        const fnName=mc('span','aw-np-kbd-fn-name'),fnDesc=mc('span','aw-np-kbd-fn-desc');
        fnStrip.append(fnName,fnDesc);
        const showFn=s=>{fnName.textContent=s.f;fnDesc.textContent=s.d;fnStrip.classList.add('show');};
        const clearFn=()=>{if(!editing)fnStrip.classList.remove('show');};
        const showHint=t=>{fnName.textContent='';fnDesc.textContent=t;fnStrip.classList.add('show');};

        // Costruzione tastiera: ogni lettera A-Z è uno slot referenziabile
        const letterSlots=new Map();   // 'a' -> elemento
        const mkLetterSlot=ch=>{
            const key=mc('div','aw-np-key aw-np-key-letter-slot');
            const ico=mc('span','aw-np-key-ico');
            const lt=mc('span','aw-np-key-letter');lt.textContent=ch;
            key.append(ico,lt);
            key.dataset.ch=ch.toLowerCase();
            letterSlots.set(ch.toLowerCase(),key);
            key.addEventListener('mouseenter',()=>{const act=actionAt(ch.toLowerCase());if(editing){key.classList.add('hovered');}else if(act){key.classList.add('hovered');showFn(ACT[act]);}});
            key.addEventListener('mouseleave',()=>{key.classList.remove('hovered');clearFn();});
            key.addEventListener('click',e=>{if(!editing)return;e.stopPropagation();const c=ch.toLowerCase();if(!listening){startListening(c);}else if(listening===c){listening=null;letterSlots.forEach(s=>s.classList.remove('listening'));showHint('Seleziona il tasto da modificare');}else{assignLetter(c);}});
            return key;
        };
        const mkFiller=(label,wide,pad)=>{
            const k=mc('div','aw-np-key off aw-np-key-special');
            if(wide||pad){
                k.classList.add('aw-np-key-fill-wide');
                if(wide)k.style.setProperty('--wmult',wide);
                if(pad)k.style.setProperty('--padmult',pad);
                const g=mc('span','aw-np-glyph');g.textContent=label;k.appendChild(g);
            } else { k.textContent=label; }
            return k;
        };
        const mkSpecial=(spec,extraCls,label)=>{
            const key=mc('div','aw-np-key on aw-np-key-special'+(extraCls?' '+extraCls:''));
            const ico=mc('span','aw-np-key-ico');ico.innerHTML=spec.ic;
            key.appendChild(ico);
            if(label){const lt=mc('span','aw-np-key-letter');lt.textContent=label;key.appendChild(lt);}
            key.addEventListener('mouseenter',()=>{if(editing)return;key.classList.add('hovered');showFn(spec);});
            key.addEventListener('mouseleave',()=>{key.classList.remove('hovered');clearFn();});
            return key;
        };

        // RIGA 1: \ + 0-9 (salto %) + ⌫  (numeri = speciali fissi)
        const r1=mc('div','aw-np-krow');
        const bs=mc('div','aw-np-key off aw-np-key-half aw-np-key-special');bs.textContent='\\';
        r1.appendChild(bs);
        for(let i=0;i<10;i++){
            const ch=String((i+1)%10);
            const pct=((i+1)%10)*10;
            const spec={ic:IC.seekFwd,f:'AVANZAMENTO RAPIDO',d:`${pct}% della durata totale`};
            const key=mc('div','aw-np-key on aw-np-key-num aw-np-key-special');
            const pctEl=mc('span','aw-np-key-ico aw-np-key-pct');pctEl.textContent=`${pct}%`;
            const numEl=mc('span','aw-np-key-letter');numEl.textContent=ch;
            key.append(pctEl,numEl);
            key.addEventListener('mouseenter',()=>{if(editing)return;key.classList.add('hovered');showFn(spec);});
            key.addEventListener('mouseleave',()=>{key.classList.remove('hovered');clearFn();});
            r1.appendChild(key);
        }
        r1.appendChild(mkFiller('🠔',1.5));
        kbd.appendChild(r1);
        // RIGA 2: Tab + QWERTYUIOP + +
        const r2=mc('div','aw-np-krow');
        r2.appendChild(mkFiller('⮀'));
        for(const ch of 'QWERTYUIOP')r2.appendChild(mkLetterSlot(ch));
        r2.appendChild(mkFiller('+'));
        kbd.appendChild(r2);
        // RIGA 3: Caps + ASDFGHJKL + Enter
        const r3=mc('div','aw-np-krow');
        r3.appendChild(mkFiller('⇪',1.5));
        for(const ch of 'ASDFGHJKL')r3.appendChild(mkLetterSlot(ch));
        const enterKey=mc('div','aw-np-key off aw-np-key-enter-flat aw-np-key-special');
        enterKey.innerHTML='<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:60%;height:60%;display:block"><path fill="currentColor" d="M20.94,7 C20.27,7 19.61,7 18.95,7 C18.95,8.33 18.95,9.66 18.95,11 C15.25,11 11.55,11 7.85,11 C7.85,9.66 7.85,8.33 7.85,7 C6.25,8.66 4.66,10.31 3.07,11.97 C4.66,13.65 6.25,15.32 7.85,17 C7.85,15.66 7.85,14.33 7.85,12.99 C12.21,12.99 16.57,12.99 20.94,12.99 C20.94,10.99 20.94,9 20.94,7 Z"/></svg>';
        r3.appendChild(enterKey);
        kbd.appendChild(r3);
        // RIGA 4: Shift + ZXCVBNM + Shift + ▲ + -
        const r4=mc('div','aw-np-krow');
        r4.appendChild(mkFiller('⇧',2,1));
        for(const ch of 'ZXCVBNM')r4.appendChild(mkLetterSlot(ch));
        r4.appendChild(mkFiller('⇧'));
        r4.appendChild(mkSpecial({ic:IC.vol,f:'VOLUME +',d:'Alza il volume'},null,'▲'));
        r4.appendChild(mkFiller('-'));
        kbd.appendChild(r4);
        // RIGA 5: Ctrl AW Alt + Space + AltGr + ◀ ▼ ▶
        const r5=mc('div','aw-np-krow aw-np-krow-bottom');
        const mkMod=(l,wide)=>{const k=mc('div','aw-np-key off aw-np-key-mod aw-np-key-special');if(wide){k.classList.add('aw-np-key-fill-wide');k.style.setProperty('--wmult',wide);}k.textContent=l;return k;};
        const space=mkSpecial({ic:IC.play,f:'PLAY/PAUSA',d:'play/pausa del video'},'aw-np-key-space');
        r5.append(mkMod('CTRL'),mkMod('AW'),mkMod('ALT'),space,mkMod('ALT GR'),
            mkSpecial({ic:IC.seekBwd,f:'SEEK INDIETRO',d:'Breve riavvolgimento di 5-30 s'},null,'◀'),
            mkSpecial({ic:IC.volDown,f:'VOLUME −',d:'Abbassa il volume'},null,'▼'),
            mkSpecial({ic:IC.seekFwd,f:'SEEK AVANTI',d:'Breve avanzamento di 5-30 s'},null,'▶'));
        kbd.appendChild(r5);

        const hint=mc('div','aw-np-hotkey-hint');
        const updateHint=()=>{const L=(curMap.legend||'a').toUpperCase();hint.innerHTML=`PER CHIUDERE CLICK OVUNQUE, <span class="aw-np-hint-badge">${L}</span> OPPURE <span class="aw-np-hint-x">${BAR_IC.x}</span> A DESTRA`;};
        updateHint();
        bar.insertBefore(hint,barRight);
        inner.append(bar,kbd,fnStrip);
        overlay.append(inner);

        // ── Logica binding/render ──────────────────────────────────────────────
        const liveMap=()=>editing?editMap:curMap;
        const actionAt=ch=>{const m=liveMap();for(const a of HOTKEY_ACTIONS)if(m[a]===ch)return a;return null;};
        const renderBindings=()=>{
            const m=liveMap();
            letterSlots.forEach((slot,ch)=>{
                const act=null; // reset
                const ico=slot.querySelector('.aw-np-key-ico');
                const a=(()=>{for(const k of HOTKEY_ACTIONS)if(m[k]===ch)return k;return null;})();
                if(a){slot.classList.add('on');slot.classList.remove('off');ico.innerHTML=a==='legend'?'<span class="aw-np-key-a-badge">'+ch.toUpperCase()+'</span>':ACT[a].ic;slot.dataset.act=a;}
                else{slot.classList.remove('on');slot.classList.add('off');ico.innerHTML='';delete slot.dataset.act;}
            });
        };
        renderBindings();

        // ── Edit mode ────────────────────────────────────────────────────────────
        const refreshBar=()=>{
            bar.classList.toggle('editing',editing);
            overlay.classList.toggle('editing',editing);
        };
        const enterEdit=()=>{
            editing=true;editMap=Object.assign({},curMap);listening=null;
            refreshBar();renderBindings();showHint('Seleziona il tasto da modificare');
        };
        const exitEdit=()=>{
            editing=false;editMap=null;listening=null;
            letterSlots.forEach(s=>s.classList.remove('listening'));
            refreshBar();renderBindings();clearFn();fnStrip.classList.remove('show');
        };
        const startListening=ch=>{
            listening=ch;
            letterSlots.forEach(s=>s.classList.toggle('listening',s.dataset.ch===ch));
            showHint('Premi la nuova lettera');
        };
        const assignLetter=newCh=>{
            if(!listening||newCh===listening){listening=null;letterSlots.forEach(s=>s.classList.remove('listening'));showHint('Seleziona il tasto da modificare');return;}
            const lFirst=listening,lSecond=newCh;
            const aFirst=(()=>{for(const a of HOTKEY_ACTIONS)if(editMap[a]===lFirst)return a;return null;})();
            const aSecond=(()=>{for(const a of HOTKEY_ACTIONS)if(editMap[a]===lSecond)return a;return null;})();
            if(aFirst)editMap[aFirst]=lSecond;   // sposta/scambia in entrambi i versi
            if(aSecond)editMap[aSecond]=lFirst;
            listening=null;
            letterSlots.forEach(s=>s.classList.remove('listening'));
            renderBindings();showHint('Seleziona il tasto da modificare');
        };
        // keydown durante l'edit: cattura lettere valide, ignora il resto
        const onEditKey=e=>{
            if(!editing)return;
            if(e.key==='Escape'){e.preventDefault();e.stopPropagation();doCancel();return;}
            if(!listening)return;
            const k=(e.key||'').toLowerCase();
            if(/^[a-z]$/.test(k)){e.preventDefault();e.stopPropagation();assignLetter(k);}
            // tasti non-lettera: ignorati, resta in ascolto
        };

        // ── Toolbar handlers ──────────────────────────────────────────────────────
        btnEdit.addEventListener('click',e=>{e.stopPropagation();enterEdit();});
        btnReset.addEventListener('click',e=>{e.stopPropagation();if(!editing)return;editMap=Object.assign({},DEFAULT_HOTKEYS);listening=null;letterSlots.forEach(s=>s.classList.remove('listening'));renderBindings();showHint('Seleziona il tasto da modificare');});
        const doOk=()=>{curMap=Object.assign({},editMap);saveHotkeys(curMap);if(onCommit)onCommit(Object.assign({},curMap));exitEdit();updateHint();};
        const doCancel=()=>{exitEdit();};
        btnOk.addEventListener('click',e=>{e.stopPropagation();if(editing)doOk();});
        btnCancel.addEventListener('click',e=>{e.stopPropagation();if(editing)doCancel();});

        const isOpen=()=>overlay.classList.contains('open');
        const open=()=>{overlay.classList.add('open');hooks?.onOpen?.();};
        const closeFn=()=>{if(editing)doCancel();overlay.classList.remove('open');hooks?.onClose?.();};
        btnX.addEventListener('click',e=>{e.stopPropagation();closeFn();});
        // tap sull'overlay chiude solo se non in edit (e non sui pulsanti barra)
        overlay.addEventListener('click',()=>{if(!editing)closeFn();});
        bar.addEventListener('click',e=>e.stopPropagation());
        document.addEventListener('keydown',onEditKey,true);

        const setMap=m=>{curMap=Object.assign({},m);updateHint();if(!editing)renderBindings();};
        const destroy=()=>document.removeEventListener('keydown',onEditKey,true);
        return{overlay,open,close:closeFn,isOpen,setMap,isEditing:()=>editing,destroy};
    }

    // ── Shared: buildColorPanel ───────────────────────────────────────────────
    function buildColorPanel(wrap,dotEl,SEP){
        const colorPanel=mk('div','aw-np-color-panel');
        const swatchWrap=mk('div','aw-np-color-swatches');
        let currentColor=loadColor();
        const getDot=()=>dotEl||wrap.querySelector('#aw-np-dot');
        const customInput=document.createElement('input'),customPreview=document.createElement('div');
        const syncCustomInput=hex=>{customInput.value=hex;customPreview.style.background=hex;};
        const updateSwatches=c=>swatchWrap.querySelectorAll('.np-swatch').forEach(s=>s.classList.toggle('active',s.dataset.hex===c));
        const applyCustomColor=()=>{
            let val=customInput.value.trim();
            if(!val.startsWith('#'))val='#'+val;
            if(!/^#[0-9a-fA-F]{6}$/i.test(val)){syncCustomInput(currentColor);return;}
            val=val.toLowerCase();currentColor=val;lsSet(colorKey(),val);
            applyColor(val,wrap,getDot());syncCustomInput(val);updateSwatches(val);
        };
        syncCustomInput(currentColor);
        PALETTE.forEach(({name,hex})=>{
            const sw=document.createElement('div');
            sw.className='np-swatch'+(hex===currentColor?' active':'');
            sw.style.background=hex;sw.dataset.hex=hex;sw.title=name;
            sw.addEventListener('click',e=>{e.stopPropagation();currentColor=hex;lsSet(colorKey(),hex);applyColor(hex,wrap,getDot());syncCustomInput(hex);updateSwatches(hex);});
            swatchWrap.appendChild(sw);
        });
        const customRow=document.createElement('div');customRow.style.cssText='position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;';customRow.addEventListener('click',e=>e.stopPropagation());
        const customLabel=document.createElement('span');customLabel.textContent='Custom';customLabel.style.cssText='font-size:var(--np-fs-body);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));flex-shrink:0;';
        customPreview.style.cssText='width:14px;height:14px;border-radius:50%;flex-shrink:0;border:1px solid var(--np-accent-state-2,rgba(255,255,255,.3));';
        customInput.type='text';customInput.maxLength=7;customInput.placeholder='#ffffff';customInput.spellcheck=false;
        customInput.style.cssText='background:var(--np-accent-state-1,rgba(255,255,255,.1));border:1px solid var(--np-accent-state-2,rgba(255,255,255,.2));color:var(--np-accent-bg-fg,#fff);font-size:12px;padding:3px 6px;border-radius:4px;width:76px;outline:none;font-family:monospace;user-select:text;';
        customInput.addEventListener('input',()=>{let v=customInput.value.trim();if(!v.startsWith('#'))v='#'+v;if(/^#[0-9a-fA-F]{6}$/i.test(v))customPreview.style.background=v;});
        let _applyingCustom=false;
        customInput.addEventListener('blur',()=>{if(!_applyingCustom)applyCustomColor();});
        customInput.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){_applyingCustom=true;applyCustomColor();customInput.blur();_applyingCustom=false;}if(e.key==='Escape'){syncCustomInput(currentColor);customInput.blur();}});
        customInput.addEventListener('click',e=>e.stopPropagation());
        customInput.addEventListener('focus',()=>customInput.select());
        customRow.append(customLabel,customPreview,customInput);
        const{row:topColorRow,toggle:topColorToggle}=mkSwitchRow('Top bar colorata','Colora la barra superiore.',isTopColorOn,v=>{lsSet(KEY_TOP_COLOR,v?'1':'0');wrap.classList.toggle('accent-top',v);},SEP,true);
        const{row:iconColorRow,toggle:iconColorToggle}=mkSwitchRow('Icone colorate','Colora le icone del player.',isIconColorOn,v=>{lsSet(KEY_ICON_COLOR,v?'1':'0');wrap.classList.toggle('accent-icons',v);},'',true);
        const{row:flashRow,toggle:flashToggle}=mkSwitchRow('Flash centrali','Animazioni al centro del player.',isFlashOn,v=>{lsSet(KEY_FLASH_ENABLE,v?'1':'0');},'',true);
        const{row:clockRow,toggle:clockToggle}=mkSwitchRow('Orologio','Pop-up orologio (in alto a destra).',isClockOn,v=>{lsSet(KEY_CLOCK,v?'1':'0');wrap.classList.toggle('clock-hidden',!v);},'',true);
        const{row:speedPopupRow,toggle:speedPopupToggle}=mkSwitchRow('Popup velocità','Pop-up velocità alterata (in alto a sinistra).',isSpeedPopupOn,v=>{lsSet(KEY_SPEED_POPUP,v?'1':'0');wrap.classList.toggle('speed-popup-hidden',!v);},'',true);
        const{row:colorGlobalRow,toggle:colorGlobalToggle}=mkSwitchRow('Globale','Applica a tutte le serie.',isColorGlobalOn,v=>{
            lsSet(KEY_COLOR_GLOBAL,v?'1':'0');currentColor=loadColor();applyColor(currentColor,wrap,getDot());
            syncCustomInput(currentColor);updateSwatches(currentColor);
        },SEP,true);
        colorGlobalRow.id='aw-np-color-global';
        colorPanel.append(swatchWrap,customRow,topColorRow,iconColorRow,flashRow,clockRow,speedPopupRow,colorGlobalRow);
        if(isIconColorOn())wrap.classList.add('accent-icons');
        if(isTopColorOn())wrap.classList.add('accent-top');
        if(!isClockOn())wrap.classList.add('clock-hidden');
        if(!isSpeedPopupOn())wrap.classList.add('speed-popup-hidden');
        return{colorPanel,swatchWrap,currentColor:()=>currentColor,setCurrentColor:c=>{currentColor=c;},syncCustomInput,updateSwatches,topColorToggle,iconColorToggle,flashToggle,clockToggle,speedPopupToggle,colorGlobalToggle};
    }

    // ── Shared: buildSettingsPanel ────────────────────────────────────────────
    function buildSettingsPanel(video,SEP,seekTip,onSpeedChange=null){
        const settingsPanel=mk('div','aw-np-settings-panel');
        const BTN_CTRL_STYLE='background:var(--np-accent-state-1,rgba(255,255,255,.15));border:none;color:var(--np-accent-bg-fg,#fff);width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;';
        const{row:resumeRow,toggle:resumeToggle}=mkSwitchRow('Ripresa automatica','Riprende dall\'ultima interruzione.',isResumeOn(),v=>lsSet(pKey(KEY_RESUME_ENABLE),v?'1':'0'));
        const{row:autoEpRow,toggle:autoEpToggle}=mkSwitchRow('Episodio automatico','Riapre l\'ultimo episodio visto.',isAutoEpOn(),v=>lsSet(pKey(KEY_AUTOEP_ENABLE),v?'1':'0'));
        const{row:autoPlayRow,toggle:autoPlayToggle}=mkSwitchRow('Autoplay','In fullscreen, parte il video in automatico.',isAutoPlayOn(),v=>lsSet(pKey(KEY_AUTOPLAY_ENABLE),v?'1':'0'));
        const{row:connMonitorRow,toggle:connMonitorToggle}=mkSwitchRow('Monitor connessione','Notifiche sulla qualità di connessione.',isConnMonitorOn(),v=>lsSet(KEY_CONN_MONITOR,v?'1':'0'));
        let seekSecs=loadSeekSecs();
        const{row:seekRow,update:updateSeekVal}=mkStepRow('Seek',seekTip||'Secondi saltati.',()=>seekSecs,(d)=>{if(seekSecs+d<SEEK_MIN||seekSecs+d>SEEK_MAX)return;seekSecs+=d;lsSet(pKey(KEY_SEEK_SECS),String(seekSecs));},SEEK_STEP,v=>String(v).padStart(2,'0')+' s',BTN_CTRL_STYLE);
        let speedVal=loadSpeed();
        const{row:speedRow,update:updateSpeedVal}=mkStepRow('Velocità','Velocità di riproduzione.',()=>speedVal,(d)=>{const nv=Math.round((speedVal+d)*100)/100;if(nv<SPEED_MIN||nv>SPEED_MAX)return;speedVal=nv;lsSet(pKey(KEY_SPEED),String(speedVal));if(video.readyState>0)video.playbackRate=speedVal;if(onSpeedChange)onSpeedChange(speedVal);},SPEED_STEP,fmtSpeed,BTN_CTRL_STYLE);
        const globalRow=document.createElement('div');globalRow.style.cssText=`position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;${SEP}margin-top:2px;`;globalRow.dataset.tip='1';
        const globalLabel=document.createElement('span');globalLabel.textContent='Globale';
        const{label:globalSw,input:globalToggle}=mkSwitch(isGlobalOn());
        globalToggle.addEventListener('change',()=>{
            lsSet(KEY_GLOBAL,globalToggle.checked?'1':'0');
            resumeToggle.checked=isResumeOn();autoEpToggle.checked=isAutoEpOn();autoPlayToggle.checked=isAutoPlayOn();
            seekSecs=loadSeekSecs();updateSeekVal();speedVal=loadSpeed();updateSpeedVal();
        });
        globalRow.addEventListener('click',()=>{globalToggle.checked=!globalToggle.checked;globalToggle.dispatchEvent(new Event('change'));});
        globalSw.addEventListener('click',e=>e.stopPropagation());
        globalRow.append(globalLabel,globalSw,mkRowTip('Applica a tutte le serie.'));
        settingsPanel.append(resumeRow,autoEpRow,autoPlayRow,connMonitorRow,seekRow,speedRow,globalRow);
        return{settingsPanel,resumeToggle,autoEpToggle,autoPlayToggle,connMonitorToggle,globalToggle,seekSecs:()=>seekSecs,speedVal:()=>speedVal,updateSeekVal,updateSpeedVal};
    }

    // ── Shared: buildResumeLogic ──────────────────────────────────────────────
    function buildResumeLogic(video,wrap,speedValFn){
        const expectedToken=_activeToken;
        const myResumeKey=()=>KEY_RESUME_PFX+(expectedToken||location.pathname);
        const myResumeTs=()=>myResumeKey()+':ts';
        function showResumeToast(seconds){wrap.querySelector('#aw-np-toast')?.remove();const toast=mk('div','aw-np-toast');toast.textContent=`▶ Ripreso da ${fmt(seconds)}`;wrap.appendChild(toast);setTimeout(()=>{toast.style.opacity='0';setTimeout(()=>toast.remove(),500);},4000);}
        function attemptResume(){if(!isResumeOn()||!isFinite(video.duration))return;const saved=parseFloat(lsGet(myResumeKey())??'');if(!saved||saved<RESUME_MIN_POS)return;if(video.duration-saved<RESUME_END_GAP){lsDel(myResumeKey());lsDel(myResumeTs());return;}video.currentTime=saved;showResumeToast(saved);}
        video.addEventListener('loadedmetadata',()=>{if(video.playbackRate!==speedValFn())video.playbackRate=speedValFn();attemptResume();},{once:true});
        let saveTimer=null,episodeEnded=false;
        const saveNow=()=>{if(!isResumeOn()||!isFinite(video.currentTime)||video.currentTime<=RESUME_MIN_POS)return;if(isFinite(video.duration)&&video.duration-video.currentTime<RESUME_END_GAP)return;lsSet(myResumeKey(),String(video.currentTime));lsSet(myResumeTs(),String(Date.now()));};
        const startSaving=()=>{if(saveTimer)return;saveTimer=setInterval(saveNow,SAVE_INTERVAL_MS);};
        const stopSaving=()=>{clearInterval(saveTimer);saveTimer=null;};
        _stopSavingFn=stopSaving;
        video.addEventListener('play',startSaving);
        video.addEventListener('pause',()=>{stopSaving();saveNow();});
        video.addEventListener('seeked',()=>{if(isFinite(video.duration)&&video.duration-video.currentTime>=RESUME_END_GAP){episodeEnded=false;saveNow();}});
        video.addEventListener('ended',()=>{stopSaving();lsDel(myResumeKey());lsDel(myResumeTs());episodeEnded=true;});
        return{showResumeToast,stopSaving,episodeEnded:()=>episodeEnded};
    }

    // ── Shared: buildSeekBar ──────────────────────────────────────────────────
    function buildSeekBar(video,withTip=false,onTimeUpdate=null){
        const seekWrap=mk('div','aw-np-seek-wrap'),seekTrack=mk('div','aw-np-seek-track'),seekBuf=mk('div','aw-np-seek-buf'),seekFill=mk('div','aw-np-seek-fill'),seekThumb=mk('div','aw-np-seek-thumb');
        let seekTip=null;
        if(withTip){seekTip=mk('div','aw-np-seek-tip');seekTrack.appendChild(seekTip);}
        seekTrack.append(seekBuf,seekFill,seekThumb);seekWrap.append(seekTrack);
        let seeking=false;
        const applySeek=e=>{const r=seekTrack.getBoundingClientRect();const p=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));if(video.duration)video.currentTime=p*video.duration;const pct=p*100+'%';seekFill.style.width=pct;seekThumb.style.left=pct;};
        seekWrap.addEventListener('pointerdown',e=>{seeking=true;seekWrap.classList.add('seeking');seekWrap.setPointerCapture(e.pointerId);applySeek(e);e.preventDefault();});
        seekWrap.addEventListener('pointermove',e=>{
            if(seeking)applySeek(e);
            if(seekTip){const r=seekTrack.getBoundingClientRect();const p=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));seekTip.textContent=fmt(p*(video.duration||0));seekTip.style.left=(p*100)+'%';seekTip.style.visibility='visible';}
        });
        if(seekTip)seekWrap.addEventListener('pointerleave',()=>{seekTip.style.visibility='hidden';});
        seekWrap.addEventListener('pointerup',()=>{seeking=false;seekWrap.classList.remove('seeking');});
        seekWrap.addEventListener('pointercancel',()=>{seeking=false;seekWrap.classList.remove('seeking');});
        let malSyncTriggered=false;
        video.addEventListener('loadedmetadata',()=>{malSyncTriggered=false;});
        video.addEventListener('timeupdate',()=>{
            if(seeking||!video.duration)return;
            const p=video.currentTime/video.duration*100;
            seekFill.style.width=p+'%';seekThumb.style.left=p+'%';
            if(onTimeUpdate)onTimeUpdate();
            if(!malSyncTriggered&&p>=90){malSyncTriggered=true;history.pushState({},'',location.href);}
            if(!_preloadedToken&&p>=PRELOAD_THRESHOLD*100){const nxt=getAdjacentEpisode('next');if(nxt){_preloadedToken=nxt.dataset.id;const _pTok=_preloadedToken;getUrlForToken(_pTok).then(url=>{if(!url||!cleanup||_preloadedToken!==_pTok)return;document.querySelectorAll('video[data-aw-preload]').forEach(v=>{try{v.pause();v.src='';v.remove();}catch(e){}});_preloadedUrl=url;const pv=document.createElement('video');pv.preload='auto';pv.muted=true;pv.dataset.awPreload='1';pv.style.cssText='position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';pv.src=url;document.body.appendChild(pv);pv.load();_preloadedVideo=pv;});}}
        });
        video.addEventListener('progress',()=>{if(!video.duration||!video.buffered.length)return;seekBuf.style.width=(video.buffered.end(video.buffered.length-1)/video.duration*100)+'%';});
        return{seekWrap,seekFill,seekThumb,seekBuf,isSeeking:()=>seeking};
    }

    // ── Shared: initVideo ─────────────────────────────────────────────────────
    function initVideo(videoUrl){
        const{vol,muted}=loadVol();
        const video=mk('video','aw-np-video');
        video.autoplay=false;video.preload='auto';video.src=videoUrl;video.volume=vol;video.muted=muted;video.playbackRate=loadSpeed();
        let _userInteracted=false;
        const _play=()=>{_userInteracted=true;return video.play().catch(()=>{});};
        const _enforceInitialPause=()=>{try{if(_userInteracted)return;if(video.paused)return;if(isAutoPlayOn()&&fsElement())return;video.pause();}catch(e){}};
        video.addEventListener('play',_enforceInitialPause,{capture:true});
        return{video,vol,muted,_play};
    }

    // ── Shared: addRipple ─────────────────────────────────────────────────────
    function addRipple(btn){btn.addEventListener('pointerdown',e=>{const r=btn.getBoundingClientRect(),size=Math.max(r.width,r.height);const ripple=document.createElement('span');ripple.className='np-ripple';ripple.style.cssText=`width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px;`;btn.appendChild(ripple);ripple.addEventListener('animationend',()=>ripple.remove());});}

    // ── Icone SVG ─────────────────────────────────────────────────────────────
    const svg=p=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${p}</svg>`;
    const IC={
        play:    svg('<path d="M8 5v14l11-7z"/>'),
        pause:   svg('<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'),
        mute:    svg('<path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l1.98 2L21 18.73 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>'),
        vol:     svg('<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>'),
        volDown: svg('<path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>'),
        fsOn:    svg('<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>'),
        fsOff:   svg('<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'),
        pip:     svg('<path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3C1.9 3 1 3.88 1 4.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/>'),
        settings:svg('<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>'),
        restart: svg('<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>'),
        skip:    svg('<path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/><path d="M13 1v6l4-3z"/><line x1="13" y1="8" x2="13" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><line x1="13" y1="14" x2="16" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>'),
        undo:    svg('<g transform="scale(-1,1) translate(-24,0)"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/><path d="M13 1v6l4-3z"/><line x1="13" y1="8" x2="13" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><line x1="13" y1="14" x2="16" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></g>'),
        prev:    svg('<rect x="5" y="5" width="2.5" height="14"/><polygon points="19,5 9,12 19,19"/>'),
        next:    svg('<polygon points="5,5 15,12 5,19"/><rect x="16.5" y="5" width="2.5" height="14"/>'),
        seekFwd: svg('<path d="M6 5l6 7-6 7M13 5l6 7-6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
        seekBwd: svg('<path d="M18 5l-6 7 6 7M11 5l-6 7 6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
        menu:    svg('<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>'),
        unlock:  svg('<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>'),
    };

    // ── Stili desktop ─────────────────────────────────────────────────────────
    function injectStyleDesktop(){
        if(document.getElementById('aw-np-style'))return;
        const s=document.createElement('style');s.id='aw-np-style';
        s.textContent=`
            #player{background:#000}*,*::before,*::after{box-sizing:border-box}*:focus{outline:none!important}button{-webkit-tap-highlight-color:transparent}
            #aw-np,#aw-np *{-webkit-touch-callout:none!important;-webkit-user-drag:none;user-select:none!important;-webkit-user-select:none!important}
            #aw-np{--np-bar-h:clamp(40px,5.2cqh,56px);--np-btn-size:clamp(36px,4.8cqh,52px);--np-svg-size:clamp(20px,2.7cqh,32px);--np-seek-h:44px;--np-top-h:clamp(56px,8.3cqh,90px);--np-fs-title:clamp(14px,2.4cqh,26px);--np-fs-subtitle:clamp(13px,2cqh,22px);--np-fs-body:clamp(13px,1.7cqh,17px);--np-fs-small:clamp(12px,1.5cqh,15px);--np-fs-micro:clamp(10px,1.2cqh,13px);--np-fs-brand:clamp(11px,1.6cqh,17px);--np-spinner-size:clamp(40px,6.5cqh,80px);container-type:size;position:relative;isolation:isolate;width:100%;height:100%;background:#000;display:flex;flex-direction:column;overflow:hidden;font-family:'Google Sans',Roboto,'Helvetica Neue',sans-serif;user-select:none;touch-action:pan-x pan-y}
            #aw-np-video{flex:1;width:100%;min-height:0;display:block;background:#000;cursor:none}
            #aw-np.ui #aw-np-video{cursor:pointer}
            #aw-np-bar,#aw-np-top,#aw-np-toast,#aw-np-error-toast,#aw-np-conn-toast,#aw-np-settings-panel,#aw-np-color-panel,#aw-np-menu-panel,.np-tip,.np-row-tip,.np-btn,.np-swatch,.np-switch-track,.np-switch-thumb,#aw-np-seek-fill,#aw-np-seek-buf,#aw-np-seek-thumb,#aw-np-seek-tip,#aw-np-title,#aw-np-epinfo,#aw-np-brand,#aw-np-clock,#aw-np-clock svg circle,#aw-np-clock .hand-h,#aw-np-clock .hand-m,#aw-np-clock .pin,#aw-np-spinner,#aw-np-vol-popup,#aw-np-time,#aw-np-speed-ind,#aw-np-speed-popup,#aw-np-buf-pct,#aw-np-dot{transition-property:color,background,background-color,fill,stroke,border-color,box-shadow;transition-duration:.4s;transition-timing-function:cubic-bezier(.4,0,.2,1)}
            .np-grad{position:absolute;left:0;right:0;height:160px;pointer-events:none;opacity:0;transition:opacity .35s cubic-bezier(.4,0,.2,1)}
            #aw-np.ui .np-grad{opacity:1}
            #aw-np-gradient{bottom:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            #aw-np-gradient-top{top:0;background:linear-gradient(to bottom,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            .np-ui-layer{opacity:0;transition:opacity .35s cubic-bezier(.4,0,.2,1),transform .35s cubic-bezier(.4,0,.2,1);pointer-events:none}
            #aw-np-top.np-ui-layer{transform:translateY(-12px)}
            #aw-np-controls.np-ui-layer{transform:translateY(8px)}
            #aw-np.ui #aw-np-top.np-ui-layer,#aw-np.ui #aw-np-controls.np-ui-layer{transform:translateY(0)}
            #aw-np.ui .np-ui-layer{opacity:1;pointer-events:all}
            #aw-np-top{position:absolute;top:0;left:0;right:0;height:var(--np-top-h);display:flex;align-items:flex-start;justify-content:space-between;padding:clamp(12px,1.7cqh,18px) 16px}
            #aw-np-top-left{display:flex;flex-direction:column;gap:2px;overflow:hidden}
            #aw-np-title{font-size:var(--np-fs-title);font-weight:500;letter-spacing:.01em;color:var(--np-accent-bg-fg,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:clamp(120px,35vw,400px);text-shadow:0 1px 3px rgba(0,0,0,.8),0 0 12px rgba(0,0,0,.6)}
            #aw-np-epinfo{font-size:var(--np-fs-subtitle);font-weight:400;letter-spacing:.02em;color:var(--np-accent-bg-fg,rgba(255,255,255,.7));opacity:.8;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-top-right{display:flex;align-items:center;gap:14px;flex-shrink:0}
            #aw-np-brand{font-size:var(--np-fs-brand);font-weight:500;letter-spacing:.04em;color:var(--np-accent-bg-fg,rgba(255,255,255,.5));opacity:.6;white-space:nowrap;line-height:1;text-shadow:0 1px 3px rgba(0,0,0,.8);text-transform:uppercase}
            #aw-np-dot{width:10px;height:10px;border-radius:50%;background:var(--np-accent,#fff);cursor:pointer;flex-shrink:0;transition:transform .2s cubic-bezier(.4,0,.2,1),box-shadow .2s;position:relative;top:-1px;box-shadow:0 0 0 0 var(--np-accent-dim,rgba(255,255,255,.3))}
            #aw-np-kbd-btn{width:14px;height:14px;border-radius:3px;background:var(--np-accent-bg,#223A56);color:var(--np-accent-bg-fg,#CCDDF1);font-size:9px;font-weight:400;font-family:Arial,'Segoe UI','Roboto',sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;line-height:1;transition:transform .2s cubic-bezier(.4,0,.2,1),background-color .2s;user-select:none;position:relative;top:-1px}
            #aw-np-kbd-btn:hover{transform:scale(1.15)}
            #aw-np-kbd-btn:active{transform:scale(1.05)}
            #aw-np-hotkey-overlay{position:absolute;inset:0;background:rgba(0,0,0,.82);z-index:30;opacity:0;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1);font-family:Arial,'Segoe UI','Roboto',sans-serif;container-type:size;cursor:pointer}
            #aw-np-hotkey-overlay.open{opacity:1;pointer-events:auto}
            #aw-np-hotkey-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(12px,2.6cqh,24px);padding:4cqh 4cqw;box-sizing:border-box;overflow:hidden;--ku:clamp(34px,7cqh,60px);--kg:clamp(5px,1.2cqh,12px);--kstep:calc((var(--ku) + var(--kg)) / 2)}
            .aw-np-hotkey-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);white-space:nowrap;display:flex;align-items:center;justify-content:center;font-size:clamp(9px,1.5cqh,12px);font-weight:400;letter-spacing:.08em;color:color-mix(in srgb,var(--np-accent-bg-fg,#CCDDF1) 55%,transparent);font-family:Arial,sans-serif;line-height:1}
            .aw-np-hint-badge{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:1.45em;height:1.45em;border-radius:.3em;background:var(--np-accent-bg,#223A56);color:var(--np-accent-bg-fg,#CCDDF1);font-weight:600;font-size:.92em;line-height:1;letter-spacing:0;margin:0 .45em}
            .aw-np-hint-x{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:1.15em;height:1.15em;color:var(--np-accent,#1565C0);margin:0 .3em}
            .aw-np-hint-x svg{width:100%;height:100%;display:block}
            .aw-np-hint-x svg path{fill:currentColor}
            #aw-np-hotkey-overlay.editing .aw-np-hotkey-hint{visibility:hidden}
            .aw-np-kbd{display:flex;flex-direction:column;gap:var(--kg)}
            .aw-np-krow{display:flex;gap:var(--kg);opacity:0;transform:translateY(18px) scale(.98);transition:opacity .3s cubic-bezier(.4,0,.2,1),transform .42s cubic-bezier(.34,1.56,.64,1)}
            #aw-np-hotkey-overlay.open .aw-np-krow{opacity:1;transform:translateY(0) scale(1)}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(1){transition-delay:.05s}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(2){transition-delay:.14s}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(3){transition-delay:.23s}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(4){transition-delay:.32s}
            #aw-np-hotkey-overlay.open .aw-np-krow:nth-child(5){transition-delay:.41s}
            .aw-np-krow-bottom{margin-left:0 !important}
            .aw-np-key-enter-flat{width:calc(var(--ku) * 1.5 + var(--kg)) !important}
            .aw-np-key{width:var(--ku);height:var(--ku);border-radius:6px;background:var(--np-accent-bg,#223A56);display:flex;align-items:center;justify-content:center;color:var(--np-accent-bg-fg,#CCDDF1);font-size:calc(var(--ku) * .48);font-weight:500;flex-shrink:0;position:relative;line-height:1;box-sizing:border-box;transition:background-color .15s,color .15s}
            .aw-np-key-fill-wide{width:calc(var(--ku) * var(--wmult, 1.5) + var(--kg) * var(--padmult, 0)) !important}
            .aw-np-key-fill-wide{justify-content:flex-start}
            .aw-np-key-fill-wide>.aw-np-glyph{display:inline-flex;align-items:center;justify-content:center;width:var(--ku);height:var(--ku)}
            .aw-np-key-half{width:calc(var(--ku) * .5) !important}
            .aw-np-key.off{opacity:.5}
            .aw-np-key.on{cursor:pointer}
            .aw-np-key.on.hovered{background:var(--np-accent-state-1,color-mix(in srgb,var(--np-accent,#1565C0) 22%,var(--np-accent-bg,#223A56)));color:#fff}
            .aw-np-key-ico,.aw-np-key-letter{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .15s}
            .aw-np-key-ico svg{width:56%;height:56%}
            .aw-np-key-ico svg path:not([fill="none"]),.aw-np-key-ico svg polygon,.aw-np-key-ico svg rect{fill:var(--np-accent-bg-fg,#CCDDF1)}
            .aw-np-key-ico svg path[fill="none"]{stroke:var(--np-accent-bg-fg,#CCDDF1)}
            .aw-np-key-ico svg line{stroke:var(--np-accent-bg-fg,#CCDDF1)}
            .aw-np-key.hovered .aw-np-key-ico svg path:not([fill="none"]),.aw-np-key.hovered .aw-np-key-ico svg polygon,.aw-np-key.hovered .aw-np-key-ico svg rect{fill:#fff}
            .aw-np-key.hovered .aw-np-key-ico svg path[fill="none"]{stroke:#fff}
            .aw-np-key-pct{font-size:calc(var(--ku) * .26);font-weight:600}
            .aw-np-key-a-badge{display:flex;align-items:center;justify-content:center;width:calc(var(--ku) * .55);height:calc(var(--ku) * .55);border-radius:3px;background:var(--np-accent-bg-fg,#CCDDF1);color:var(--np-accent-bg,#223A56);font-size:calc(var(--ku) * .32);font-weight:500;font-family:Arial,'Segoe UI','Roboto',sans-serif;line-height:1}
            .aw-np-key-letter{opacity:0;font-size:calc(var(--ku) * .48);font-weight:500}
            .aw-np-key-letter-slot.off .aw-np-key-letter{opacity:1}
            .aw-np-key.hovered .aw-np-key-ico{opacity:0}
            .aw-np-key.hovered .aw-np-key-letter{opacity:1}
            .aw-np-key-mod{font-size:calc(var(--ku) * .19);font-weight:600;opacity:.5;letter-spacing:.04em}
            .aw-np-key-space{width:calc(var(--ku) * 5 + var(--kg) * 4)}
            /* ── Toolbar legenda ── */
            .aw-np-kbd-bar{display:flex;justify-content:space-between;align-items:center;width:100%;max-width:calc(var(--ku) * 12 + var(--kg) * 11);box-sizing:border-box;position:relative}
            .aw-np-kbd-bar-left,.aw-np-kbd-bar-right{display:flex;gap:clamp(6px,1cqw,10px)}
            .aw-np-kbd-bar-btn{display:flex;align-items:center;justify-content:center;width:clamp(28px,4.4cqh,40px);height:clamp(28px,4.4cqh,40px);border-radius:6px;cursor:pointer;user-select:none;background:transparent;color:var(--np-accent,#1565C0);transition:color .15s,transform .15s cubic-bezier(.4,0,.2,1),opacity .2s;position:relative}
            .aw-np-kbd-bar-btn .np-tip{bottom:auto;top:calc(100% + 8px)}
            .aw-np-kbd-bar-btn .np-tip::after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:rgba(30,30,30,.97)}
            .aw-np-kbd-bar-btn:hover .np-tip{opacity:1;transition-delay:.4s}
            .aw-np-kbd-bar-btn svg{width:64%;height:64%;display:block}
            .aw-np-kbd-bar-btn svg path{fill:currentColor}
            .aw-np-kbd-bar-btn:hover{transform:translateY(-1px);opacity:.78}
            .aw-np-kbd-bar-btn:active{transform:translateY(0) scale(.92)}
            /* default: a riposo mostra Modifica + X, nasconde Accetta/Annulla/Reset */
            .aw-np-kbd-bar .is-ok,.aw-np-kbd-bar .is-cancel,.aw-np-kbd-bar .is-reset{display:none}
            .aw-np-kbd-bar.editing .is-edit{display:none}
            .aw-np-kbd-bar.editing .is-ok,.aw-np-kbd-bar.editing .is-cancel,.aw-np-kbd-bar.editing .is-reset{display:block}
            /* in edit: speciali in grigio, lettere cliccabili */
            #aw-np-hotkey-overlay.editing .aw-np-key-special{opacity:.28!important;filter:grayscale(1)}
            #aw-np-hotkey-overlay.editing .aw-np-key-letter-slot{cursor:pointer}
            #aw-np-hotkey-overlay.editing .aw-np-key-letter-slot.on:hover,#aw-np-hotkey-overlay.editing .aw-np-key-letter-slot.off:hover{background:var(--np-accent-state-1,color-mix(in srgb,var(--np-accent,#1565C0) 22%,var(--np-accent-bg,#223A56)))}
            #aw-np-hotkey-overlay.editing .aw-np-key-letter-slot.off:hover .aw-np-key-letter{opacity:1}
            .aw-np-key-letter-slot.listening{box-shadow:0 0 0 2px #fff,0 0 14px 2px rgba(255,255,255,.85);z-index:1}
            .aw-np-kbd-fn{height:clamp(20px,3cqh,30px);display:flex;align-items:center;justify-content:center;gap:clamp(10px,1.6cqw,18px);opacity:0;transform:translateY(4px);transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1)}
            .aw-np-kbd-fn.show{opacity:1;transform:translateY(0)}
            .aw-np-kbd-fn-name{font-size:clamp(10px,1.7cqh,14px);font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--np-accent-dim,#9db8e0);font-family:Arial,sans-serif;line-height:1;padding-right:clamp(10px,1.6cqw,18px);border-right:1px solid color-mix(in srgb,var(--np-accent-bg-fg,#CCDDF1) 22%,transparent)}
            .aw-np-kbd-fn-desc{font-size:clamp(12px,2cqh,18px);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-family:Arial,sans-serif;line-height:1}
            #aw-np-dot:hover{transform:scale(1.4);box-shadow:0 0 0 4px var(--np-accent-dim,rgba(255,255,255,.15))}
            #aw-np-dot:hover .np-tip{opacity:1;transition-delay:.3s}
            #aw-np-dot .np-tip{bottom:auto;top:calc(100% + 10px);left:auto;right:0;transform:none}
            #aw-np-dot .np-tip::after{top:auto;bottom:100%;left:auto;right:5px;transform:none;border-top-color:transparent;border-bottom-color:rgba(30,30,30,.97)}
            #aw-np-color-panel{position:absolute;top:var(--np-top-h);right:12px;background:var(--np-accent-bg,#000);border:1px solid color-mix(in srgb,var(--np-accent,#fff) 20%,transparent);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px;font-size:var(--np-fs-body);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:11;opacity:0;transform:scale(.9) translateY(-8px);transform-origin:top right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3)}
            #aw-np-color-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            #aw-np-color-swatches{display:flex;flex-wrap:wrap;gap:8px;width:162px}
            .np-swatch{width:26px;height:26px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .2s cubic-bezier(.4,0,.2,1),border-color .15s,box-shadow .2s;flex-shrink:0}
            .np-swatch:hover{transform:scale(1.12);box-shadow:0 3px 10px rgba(0,0,0,.45)}
            .np-swatch.active{border-color:var(--np-accent,#fff);box-shadow:0 0 0 3px color-mix(in srgb,var(--np-accent,#fff) 35%,transparent),0 2px 6px rgba(0,0,0,.4);transform:scale(1.08)}
            #aw-np-controls{position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;padding:0 6px 6px}
            #aw-np-seek-wrap{height:var(--np-seek-h);display:flex;align-items:center;cursor:pointer;padding:0 4px;touch-action:none}
            #aw-np-seek-track{position:relative;width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,.2);transition:height .15s cubic-bezier(.4,0,.2,1)}
            #aw-np-seek-wrap:hover #aw-np-seek-track{height:6px}
            #aw-np-seek-buf{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent-dim,rgba(255,255,255,.5));width:0;opacity:.6}
            #aw-np-seek-fill{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent,#fff);width:0;transition:background .2s}
            #aw-np-seek-thumb{position:absolute;top:50%;left:0;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;transform:translate(-50%,-50%) scale(0);transition:transform .15s cubic-bezier(.4,0,.2,1),box-shadow .15s;box-shadow:0 2px 6px rgba(0,0,0,.4)}
            #aw-np-seek-wrap:hover #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1)}
            #aw-np-seek-wrap.seeking #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1.2)}
            #aw-np-seek-tip{position:absolute;bottom:calc(100% + 10px);left:0;transform:translateX(-50%);background:var(--np-accent-bg,#282828);color:var(--np-accent-bg-fg,#fff);font-size:var(--np-fs-small);font-weight:500;padding:4px 8px;border-radius:6px;pointer-events:none;white-space:nowrap;visibility:hidden;box-shadow:0 2px 8px rgba(0,0,0,.4);letter-spacing:.02em}
            #aw-np-bar{display:flex;align-items:center;height:var(--np-bar-h);gap:0}
            .np-icon{display:contents}
            .np-btn{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;width:var(--np-btn-size);height:var(--np-btn-size);background:none;border:none;cursor:pointer;color:var(--np-accent-bg-fg,rgba(255,255,255,.75));padding:0;flex-shrink:0;border-radius:50%;transition:color .2s cubic-bezier(.4,0,.2,1),background .2s}
            .np-btn:hover{color:var(--np-accent-bg-fg,#fff);background:var(--np-accent-state-1,rgba(255,255,255,.1))}
            .np-btn:active{background:var(--np-accent-state-2,rgba(255,255,255,.18))}
            .np-btn svg{display:block;fill:currentColor;flex-shrink:0;width:var(--np-svg-size);height:var(--np-svg-size);transition:transform .2s cubic-bezier(.2,0,0,1)}
            .np-btn:active svg{transition-duration:.1s;transform:scale(.88)}
            .np-btn svg line{stroke:currentColor}
            .accent-icons .np-btn{color:var(--np-accent,#fff)}
            .accent-icons .np-btn svg{fill:var(--np-accent,#fff)}
            .accent-icons .np-btn svg line{stroke:var(--np-accent,#fff)}
            .accent-top #aw-np-title{color:var(--np-accent,#fff)}
            .accent-top #aw-np-epinfo{color:var(--np-accent,#fff);opacity:.75}
            .accent-top #aw-np-brand{color:var(--np-accent,#fff);opacity:.5}
            .np-ripple{position:absolute;border-radius:50%;background:var(--np-accent-state-2,rgba(255,255,255,.35));transform:scale(0);opacity:1;animation:np-ripple .55s cubic-bezier(.2,0,.2,1);pointer-events:none}
            @keyframes np-ripple{0%{transform:scale(0);opacity:1}60%{opacity:.6}100%{transform:scale(2.8);opacity:0}}
            #aw-np-time{font-size:var(--np-fs-small);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));letter-spacing:.04em;white-space:nowrap;padding:0 6px;font-variant-numeric:tabular-nums;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-spacer{flex:1}
            #aw-np-vol-group{position:relative;display:flex;align-items:center}
            #aw-np-vol-group::after{content:'';position:absolute;bottom:100%;left:-8px;right:-8px;height:calc(var(--np-seek-h) + 20px);pointer-events:none}
            #aw-np-vol-group:hover::after{pointer-events:all}
            #aw-np-vol-popup{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 8px);left:50%;transform:translateX(-50%);width:44px;height:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;transition:height .25s cubic-bezier(.4,0,.2,1),padding .25s cubic-bezier(.4,0,.2,1);padding:0}
            #aw-np-vol-group:hover #aw-np-vol-popup,#aw-np-vol-group:focus-within #aw-np-vol-popup{height:148px;padding:10px 0 12px;background:var(--np-accent-bg,#1c1c1c);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.4)}
            #aw-np-vol-pct{font-size:var(--np-fs-small);font-weight:500;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));width:32px;text-align:center;font-variant-numeric:tabular-nums;flex-shrink:0;display:block;letter-spacing:.02em;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-vol{-webkit-appearance:none;appearance:none;width:4px;height:108px;border-radius:2px;background:rgba(255,255,255,.2);cursor:pointer;outline:none;writing-mode:vertical-lr;direction:rtl;transition:background .15s}
            #aw-np-vol::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4);transition:transform .15s cubic-bezier(.4,0,.2,1)}
            #aw-np-vol:hover::-webkit-slider-thumb{transform:scale(1.2)}
            #aw-np-vol::-moz-range-thumb{width:14px;height:14px;background:var(--np-accent,#fff);border:none;border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4)}
            #aw-np-settings-panel{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 8px);right:12px;background:var(--np-accent-bg,#000);border:1px solid color-mix(in srgb,var(--np-accent,#fff) 20%,transparent);border-radius:12px;padding:14px 18px;min-width:230px;display:flex;flex-direction:column;gap:10px;font-size:var(--np-fs-body);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:10;opacity:0;transform:scale(.9) translateY(8px);transform-origin:bottom right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3)}
            #aw-np-settings-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            .np-switch{position:relative;width:36px;height:20px;flex-shrink:0;cursor:pointer}
            .np-switch input{opacity:0;width:0;height:0;position:absolute}
            .np-switch-track{position:absolute;inset:0;border-radius:10px;background:rgba(255,255,255,.2);transition:background .2s cubic-bezier(.4,0,.2,1)}
            .np-switch input:checked~.np-switch-track{background:var(--np-accent,#fff)}
            .np-switch-thumb{position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 4px rgba(0,0,0,.3)}
            .np-switch input:checked~.np-switch-thumb{transform:translateX(16px)}
            .np-switch input:not(:checked)~.np-switch-thumb{background:rgba(255,255,255,.8)}
            .np-tip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(30,30,30,.97);color:rgba(255,255,255,.92);font-size:var(--np-fs-small);font-weight:500;padding:5px 10px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s cubic-bezier(.4,0,.2,1);z-index:20;box-shadow:0 2px 8px rgba(0,0,0,.4)}
            .np-tip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:rgba(30,30,30,.97)}
            .np-btn:hover .np-tip{opacity:1;transition-delay:.4s}
            .np-row-tip{position:absolute;top:50%;right:calc(100% + 14px);transform:translateY(-50%);background:var(--np-accent-bg,#000);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:var(--np-fs-small);line-height:1.5;padding:6px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s cubic-bezier(.4,0,.2,1);transition-delay:0s;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4)}
            .np-row-tip::after{content:'';position:absolute;top:50%;left:100%;transform:translateY(-50%);border:5px solid transparent;border-left-color:var(--np-accent-bg,#000)}
            [data-tip]{margin:0 -8px;padding:6px 8px;border-radius:8px;transition:background .15s cubic-bezier(.4,0,.2,1)}[data-tip]:hover{background:var(--np-accent-state-1,rgba(255,255,255,.06))}[data-tip]:hover .np-row-tip{opacity:1;transition-delay:.5s}
            #aw-np-toast{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px);left:50%;transform:translateX(-50%);background:color-mix(in srgb,var(--np-accent-bg,#282828) 80%,transparent);color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-size:var(--np-fs-body);font-weight:500;letter-spacing:.02em;padding:7px 16px;border-radius:24px;pointer-events:none;white-space:nowrap;opacity:1;transition:opacity .4s cubic-bezier(.4,0,.2,1);z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4)}

            #aw-np-speed-ind{font-size:var(--np-fs-micro);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.55));letter-spacing:.03em;white-space:nowrap;padding:0 0 0 6px;font-variant-numeric:tabular-nums}
            #aw-np-speed-popup{position:absolute;top:10px;left:10px;background:transparent;color:rgba(255,255,255,.6);font-size:var(--np-fs-title);font-weight:500;padding:2px 4px;border-radius:4px;pointer-events:none;opacity:0;transition:opacity .3s cubic-bezier(.4,0,.2,1);z-index:20;letter-spacing:.02em;text-shadow:0 1px 6px rgba(0,0,0,.95)}
            #aw-np-speed-popup.on{opacity:1}
            #aw-np.ui #aw-np-speed-popup{opacity:0!important}
            #aw-np-clock{position:absolute!important;inset:clamp(8px,1.2cqh,16px) clamp(10px,1.4cqh,18px) auto auto!important;display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.6);font-size:clamp(18px,3.1cqh,34px);font-weight:500;padding:2px 4px;pointer-events:none;z-index:20;letter-spacing:.03em;text-shadow:0 1px 6px rgba(0,0,0,.95);font-variant-numeric:tabular-nums;transition:opacity .3s cubic-bezier(.4,0,.2,1);flex:none;transform:none}
            #aw-np-clock svg{width:1em;height:1em;flex-shrink:0;display:block;filter:drop-shadow(0 0 1px rgba(0,0,0,.95)) drop-shadow(0 1px 3px rgba(0,0,0,.7))}
            #aw-np-clock .hand-h{fill:var(--np-accent,#fff);fill-opacity:1;stroke:var(--np-accent,#fff)}#aw-np-clock .pin{fill:var(--np-accent,#fff);fill-opacity:1;stroke:var(--np-accent,#fff)}#aw-np-clock .hand-m{fill:currentColor}
            #aw-np.ui #aw-np-clock{opacity:0!important;visibility:hidden}
            #aw-np.clock-hidden #aw-np-clock{display:none!important}
            #aw-np.speed-popup-hidden #aw-np-speed-popup{display:none!important}
            #aw-np-conn-toast{position:absolute;top:clamp(12px,1.7cqh,18px);left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:12px;font-size:calc(var(--np-fs-body) * .82);font-weight:500;color:rgba(255,255,255,.95);z-index:22;box-shadow:0 4px 14px rgba(0,0,0,.45),0 1px 3px rgba(0,0,0,.3);pointer-events:all;white-space:nowrap;opacity:0;transition:opacity .35s cubic-bezier(.4,0,.2,1);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08)}
            #aw-np-conn-toast.slow{background:rgba(210,100,15,.78)}
            #aw-np-conn-toast.good{background:rgba(30,155,65,.78)}
            #aw-np-conn-toast .conn-msg{display:flex;flex-direction:column;gap:2px;line-height:1.3;text-align:center;letter-spacing:.025em;flex:1}
            #aw-np-buf-pct{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:var(--np-fs-title);font-weight:600;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));pointer-events:none;font-variant-numeric:tabular-nums;text-shadow:0 1px 4px rgba(0,0,0,.9)}
            #aw-np-buf-pct.on{display:flex}
            #aw-np-error-toast{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px);left:50%;transform:translateX(-50%);background:rgba(180,30,30,.92);color:#fff;font-size:var(--np-fs-body);font-weight:500;letter-spacing:.02em;padding:7px 18px;border-radius:24px;pointer-events:all;white-space:nowrap;z-index:21;box-shadow:0 4px 12px rgba(0,0,0,.5);cursor:pointer}
            #aw-np-spinner{position:absolute;inset:0;margin:auto;width:var(--np-spinner-size);height:var(--np-spinner-size);border:3px solid rgba(255,255,255,.12);border-top-color:var(--np-accent,#fff);border-radius:50%;animation:np-spin .65s linear infinite;pointer-events:none;display:none}
            #aw-np-spinner.on{display:block}
            @keyframes np-spin{to{transform:rotate(360deg)}}
            @keyframes aw-np-fade{from{opacity:0}to{opacity:1}}
            @keyframes aw-np-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
            .np-flash-circle{position:absolute;top:50%;left:50%;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;z-index:12;color:var(--np-accent-bg-fg,rgba(255,255,255,.9))}
            .np-flash-circle::before{content:'';position:absolute;inset:0;border-radius:50%;background:var(--np-accent-bg,#1a1a2e);opacity:.8;pointer-events:none}
            .np-flash-circle.on{opacity:1}
            .np-flash-circle svg{fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));opacity:1;width:34px;height:34px;position:relative;z-index:1}
            #aw-np-center{margin:-36px 0 0 -36px;transform:scale(.7);transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.34,1.56,.64,1)}
            #aw-np-center.on{transform:scale(1)}
            #aw-np-vol-flash{transform:translate(-50%,-50%);transition:opacity .2s cubic-bezier(.4,0,.2,1)}
            #aw-np-vol-flash svg{display:block}
        `;
        document.head.appendChild(s);
    }

    // ── Shared: buildClock ───────────────────────────────────────────────────
    function buildClock(wrap){
        const clockEl=mk('div','aw-np-clock');
        const fmt2=n=>String(n).padStart(2,'0');
        const _ico='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="12" cy="12" r="9.1" fill="rgba(255,255,255,.3)"/><circle cx="12" cy="12" r="10" stroke-width="1.2"/><rect class="hand-m" x="10.8" y="4.4" width="2.4" height="8.0" rx="1.2"/><rect class="hand-h" x="10.8" y="6.6" width="2.4" height="5.8" rx="1.2"/><circle class="pin" cx="12" cy="12" r="1.0"/></svg>';
        const timeEl=document.createElement('span');
        clockEl.innerHTML=_ico;
        clockEl.appendChild(timeEl);
        const handH=clockEl.querySelector('.hand-h');
        const handM=clockEl.querySelector('.hand-m');
        const tick=()=>{
            const d=new Date(),h=d.getHours(),m=d.getMinutes();
            timeEl.textContent=fmt2(h)+':'+fmt2(m);
            handH.setAttribute('transform',`rotate(${(h%12)*30+m*0.5} 12 12)`);
            handM.setAttribute('transform',`rotate(${m*6} 12 12)`);
        };
        tick();
        let timer;
        const sync=()=>{tick();timer=setInterval(tick,60000);};
        const initTimer=setTimeout(()=>sync(),(60-new Date().getSeconds())*1000);
        wrap.appendChild(clockEl);
        return{clockEl,clearTimer:()=>{clearTimeout(initTimer);clearInterval(timer);}};
    }

    // ── Shared: buildSpeedIndicator ───────────────────────────────────────────
    function buildSpeedIndicator(initSpeed){
        const speedIndEl=mk('span','aw-np-speed-ind');
        const speedPopup=mk('div','aw-np-speed-popup');
        const updateSpeedInd=v=>{speedIndEl.textContent='('+fmtSpeed(v)+')';};
        const showSpeedPopup=v=>{speedPopup.textContent=fmtSpeed(v);speedPopup.classList.toggle('on',Math.abs(v-1)>0.001);};
        updateSpeedInd(initSpeed);showSpeedPopup(initSpeed);
        return{speedIndEl,speedPopup,updateSpeedInd,showSpeedPopup,clearTimer:()=>{}};
    }

    // ── Shared: buildBufferingIndicator ───────────────────────────────────────
    function buildBufferingIndicator(video,spinner){
        const bufPctEl=mk('div','aw-np-buf-pct');
        const TARGET_AHEAD=1;
        let bufStartCt=null;
        const updateBufPct=()=>{
            if(bufStartCt===null||!video.buffered.length){bufPctEl.textContent='0%';return;}
            for(let i=0;i<video.buffered.length;i++){
                if(video.buffered.start(i)<=bufStartCt+0.1&&bufStartCt<=video.buffered.end(i)+0.1){
                    const ahead=Math.max(0,video.buffered.end(i)-bufStartCt);
                    const pct=Math.min(100,Math.round(ahead/TARGET_AHEAD*100));
                    bufPctEl.textContent=pct+'%';
                    return;
                }
            }
            bufPctEl.textContent='0%';
        };
        let bufTimer=null;
        const startBufTimer=()=>{if(bufTimer)return;updateBufPct();bufTimer=setInterval(updateBufPct,250);};
        const stopBufTimer=()=>{clearInterval(bufTimer);bufTimer=null;bufStartCt=null;};
        video.addEventListener('progress',updateBufPct);
        video.addEventListener('waiting',()=>{bufStartCt=video.currentTime;bufPctEl.classList.add('on');spinner.classList.add('on');startBufTimer();});
        video.addEventListener('playing',()=>{bufPctEl.classList.remove('on');spinner.classList.remove('on');stopBufTimer();});
        video.addEventListener('canplay',()=>{bufPctEl.classList.remove('on');spinner.classList.remove('on');stopBufTimer();});
        return{bufPctEl};
    }



    // ── Shared: buildErrorHandler ─────────────────────────────────────────────
    function buildErrorHandler(video,wrap,_play,errorMsg){
        const hideErrorToast=()=>wrap.querySelector('#aw-np-error-toast')?.remove();
        const reloadVideo=(silent=false)=>{hideErrorToast();const t=video.currentTime;const wasPlaying=!video.paused;const s=video.src;if(silent)video.dataset.silentReload='1';video.src='';video.src=s;video.addEventListener('loadedmetadata',()=>{if(t>0)video.currentTime=t;if(wasPlaying)_play();setTimeout(()=>{delete video.dataset.silentReload;},100);},{once:true});};
        const showErrorToast=msg=>{hideErrorToast();const t=mk('div','aw-np-error-toast');t.id='aw-np-error-toast';t.textContent=msg;t.addEventListener('click',()=>reloadVideo());wrap.appendChild(t);};
        video.addEventListener('error',()=>{if(video.networkState!==0)showErrorToast(errorMsg);});
        let _lastTime=-1,_freezeTimer=null;
        const _checkFreeze=()=>{if(video.paused||video.ended)return;if(video.currentTime===_lastTime&&video.readyState<3)showErrorToast(errorMsg);_lastTime=video.currentTime;};
        video.addEventListener('play',()=>{hideErrorToast();_lastTime=video.currentTime;clearInterval(_freezeTimer);_freezeTimer=setInterval(_checkFreeze,5000);});
        video.addEventListener('playing',()=>{hideErrorToast();_lastTime=video.currentTime;});
        video.addEventListener('canplaythrough',()=>hideErrorToast());
        video.addEventListener('pause',()=>clearInterval(_freezeTimer));
        video.addEventListener('ended',()=>clearInterval(_freezeTimer));
        video.addEventListener('seeking',()=>{_lastTime=-1;});
        return{reloadVideo,clearTimer:()=>clearInterval(_freezeTimer)};
    }

    // ── Shared: buildEpisodeActions ───────────────────────────────────────────
    function buildEpisodeActions({video,_play,flash}){
        return{
            restart:()=>{video.currentTime=0;_play();flash(IC.restart);},
            undo:()=>{video.currentTime=Math.max(0,video.currentTime-SKIP_SECONDS);flash(IC.undo);},
            skip:()=>{collectManualSkip(video);video.currentTime=Math.min(video.duration||0,video.currentTime+SKIP_SECONDS);flash(IC.skip);},
            prev:()=>{const t=getAdjacentEpisode('prev');if(t){flash(IC.prev);loadEpisode(t.dataset.id);}},
            next:()=>{const t=getAdjacentEpisode('next');if(t){collectNext(video);flash(IC.next);loadEpisode(t.dataset.id);}}
        };
    }

    // ── Shared: buildVolFlash ─────────────────────────────────────────────────
    function buildVolFlash(video){
        const volFlash=mk('div','aw-np-vol-flash');volFlash.classList.add('np-flash-circle');
        const volFlashIco=mk('div','aw-np-vol-flash-icon');volFlash.appendChild(volFlashIco);
        let volFlashTimer=null;
        const showVolFlash=dir=>{if(!isFlashOn())return;const m=video.muted||video.volume===0;volFlashIco.innerHTML=m?IC.mute:(dir==='down'?IC.volDown:IC.vol);volFlash.classList.add('on');clearTimeout(volFlashTimer);volFlashTimer=setTimeout(()=>volFlash.classList.remove('on'),400);};
        return{volFlash,showVolFlash,clearTimer:()=>clearTimeout(volFlashTimer)};
    }

    // ── Shared: buildCenterFlash ──────────────────────────────────────────────
    function buildCenterFlash(center){
        let cTimer=null,skipFlash=false;
        const flashAt=(html,dur)=>{if(!isFlashOn())return;center.innerHTML=html;center.classList.add('on');clearTimeout(cTimer);cTimer=setTimeout(()=>center.classList.remove('on'),dur);};
        return{
            flash:html=>flashAt(html,700),
            flashBrief:html=>flashAt(html,400),
            playPauseFlash:html=>{if(!skipFlash)flashAt(html,700);},
            setSkipFlash:v=>{skipFlash=v;},
            clearTimer:()=>clearTimeout(cTimer)
        };
    }

    // ── Shared: buildPipHandler ───────────────────────────────────────────────
    function buildPipHandler({video,btnPip,wrap,onEnter,onLeave}){
        btnPip.addEventListener('click',()=>pipElement()?pipExit():pipRequest(video));
        video.addEventListener('enterpictureinpicture',()=>{wrap.style.visibility='hidden';onEnter?.();});
        video.addEventListener('leavepictureinpicture',()=>{wrap.style.visibility='';onLeave?.();});
    }

    // ── Shared: wirePlayPauseEvents ───────────────────────────────────────────
    function wirePlayPauseEvents({video,onUpdate,playPauseFlash}){
        video.addEventListener('play',()=>{if(video.dataset.silentReload)return;onUpdate(true);playPauseFlash?.(IC.pause);});
        video.addEventListener('pause',()=>{if(video.dataset.silentReload)return;onUpdate(false);playPauseFlash?.(IC.play);});
        video.addEventListener('ended',()=>onUpdate(false));
    }

    // ── Shared: buildShellElements ────────────────────────────────────────────
    function buildShellElements(){
        const wrap=mk('div','aw-np');
        const grad=mk('div','aw-np-gradient');grad.classList.add('np-grad');
        const gradTop=mk('div','aw-np-gradient-top');gradTop.classList.add('np-grad');
        const spinner=mk('div','aw-np-spinner');
        const center=mk('div','aw-np-center');center.classList.add('np-flash-circle');center.innerHTML=IC.play;
        const ctrls=mk('div','aw-np-controls');ctrls.classList.add('np-ui-layer');
        const timeEl=mk('div','aw-np-time');timeEl.textContent='00:00 / 00:00';
        const SEP='border-top:1px solid var(--np-accent-state-1,rgba(255,255,255,.12));padding-top:10px;';
        return{wrap,grad,gradTop,spinner,center,ctrls,timeEl,SEP};
    }

    // ── Shared: bindPanelToggle ───────────────────────────────────────────────
    function bindPanelToggle(trigger,target,others,afterClose){
        trigger.addEventListener('click',e=>{
            e.stopPropagation();
            others.forEach(o=>o.classList.remove('open'));
            const willOpen=!target.classList.contains('open');
            target.classList.toggle('open',willOpen);
            if(!willOpen&&afterClose)afterClose();
        });
        target.addEventListener('click',e=>e.stopPropagation());
    }

    // ── Build player desktop ──────────────────────────────────────────────────
    let cleanup=null,_preloadedToken=null,_preloadedUrl=null,_preloadedVideo=null;
    function buildPlayerDesktop(videoUrl){
        const{video,vol,muted,_play}=initVideo(videoUrl);
        const{wrap,grad,gradTop,spinner,center,ctrls,timeEl,SEP}=buildShellElements();
        const{speedIndEl,speedPopup,updateSpeedInd,showSpeedPopup,clearTimer:clearSpeedTimer}=buildSpeedIndicator(loadSpeed());
        const{bufPctEl}=buildBufferingIndicator(video,spinner);
        const{seekWrap,isSeeking}=buildSeekBar(video,true,()=>{timeEl.textContent=fmt(video.currentTime)+' / '+fmt(video.duration);});
        const{settingsPanel,resumeToggle,autoEpToggle,autoPlayToggle,connMonitorToggle,globalToggle,seekSecs:getSeekSecs,updateSeekVal,updateSpeedVal}=buildSettingsPanel(video,SEP,'Secondi saltati con le freccette.',v=>{updateSpeedInd(v);showSpeedPopup(v);});
        let seekSecs=getSeekSecs(),speedVal=loadSpeed();
        const{colorPanel,syncCustomInput,updateSwatches,topColorToggle,iconColorToggle,flashToggle,clockToggle,speedPopupToggle,colorGlobalToggle}=buildColorPanel(wrap,null,SEP);
        let currentColor=loadColor();
        const{topBar,dotEl,kbdBtn}=buildTopBar(wrap,colorPanel);
        let hotkeyMap=loadHotkeys();
        const updateKbdLetter=()=>{kbdBtn.textContent=(hotkeyMap.legend||'a').toUpperCase();};
        updateKbdLetter();
        let _legendWasPlaying=false;
        const{overlay:hotkeyOverlay,open:openHotkey,close:closeHotkey,isOpen:isHotkeyOpen,isEditing:isEditingHotkey,setMap:setHotkeyMap,destroy:destroyHotkey}=buildHotkeyPanel(hotkeyMap,m=>{hotkeyMap=m;updateKbdLetter();},{onOpen:()=>{_legendWasPlaying=!video.paused;if(_legendWasPlaying)video.pause();},onClose:()=>{if(_legendWasPlaying)video.play().catch(()=>{});}});
        wrap.appendChild(hotkeyOverlay);
        kbdBtn.addEventListener('click',e=>{e.stopPropagation();[settingsPanel,colorPanel].forEach(p=>p.classList.remove('open'));openHotkey();});
        const btnPlay=mkBtn('aw-btn-play','','Riproduci'),btnRestart=mkBtn('aw-btn-restart',IC.restart,'Ricomincia (R)');
        const btnMute=mkBtn('aw-btn-mute','',muted?'Audio (M)':'Muto (M)');
        const btnUndo=mkBtn('aw-btn-undo',IC.undo,'Annulla skip (B)'),btnSkip=mkBtn('aw-btn-skip',IC.skip,'Skip OP/ED (O)');
        const btnPrev=mkBtn('aw-btn-prev',IC.prev,'Precedente (P)'),btnNext=mkBtn('aw-btn-next',IC.next,'Successivo (N)');
        const btnSettings=mkBtn('aw-btn-settings',IC.settings,'Impostazioni'),btnPip=mkBtn('aw-btn-pip',IC.pip,'Picture in Picture');
        const btnFs=mkBtn('aw-btn-fs','','Fullscreen (F)');
        const icoPlay=mkIcon(btnPlay,IC.play),icoMute=mkIcon(btnMute,muted?IC.mute:IC.vol),icoFs=mkIcon(btnFs,IC.fsOn);
        const volGroup=mk('div','aw-np-vol-group'),volPopup=mk('div','aw-np-vol-popup'),volPctEl=mk('div','aw-np-vol-pct'),volEl=mk('input','aw-np-vol');
        volEl.type='range';volEl.min=0;volEl.max=100;volEl.value=muted?0:Math.round(vol*100);volEl.tabIndex=-1;
        volPctEl.textContent=(muted?0:Math.round(vol*100))+'%';
        volPopup.append(volPctEl,volEl);volGroup.append(volPopup,btnMute);
        let lastNonZeroVol=muted?(vol||1):vol;
        const updateMuteState=()=>{const m=video.muted||video.volume===0;setIcon(icoMute,m?IC.mute:IC.vol);setTip(btnMute,m?'Audio (M)':'Muto (M)');};
        const updateVolUi=()=>{const pct=(video.muted||video.volume===0)?0:Math.round(video.volume*100);volPctEl.textContent=pct+'%';volEl.style.background=`linear-gradient(to top, var(--np-accent,#fff) ${pct}%, rgba(255,255,255,.25) ${pct}%)`;};
        updateVolUi();
        const{volFlash,showVolFlash,clearTimer:clearVolFlashTimer}=buildVolFlash(video);
        volEl.addEventListener('input',()=>{const v=Number(volEl.value)/100;video.volume=v;video.muted=v===0;if(v>0)lastNonZeroVol=v;updateMuteState();updateVolUi();saveVol(v===0?lastNonZeroVol:v,video.muted);});
        volEl.addEventListener('pointerup',()=>volEl.blur());
        btnMute.addEventListener('click',()=>{if(video.muted||video.volume===0){video.muted=false;video.volume=lastNonZeroVol;volEl.value=Math.round(video.volume*100);}else{if(video.volume>0)lastNonZeroVol=video.volume;video.muted=true;volEl.value=0;}updateMuteState();updateVolUi();saveVol(video.muted?lastNonZeroVol:video.volume,video.muted);showVolFlash(video.muted?'down':'up');});
        const bar=mk('div','aw-np-bar');
        bar.append(btnPlay,btnRestart,volGroup,timeEl,speedIndEl,mk('div','aw-np-spacer'),btnUndo,btnSkip,btnPrev,btnNext,btnSettings,btnPip,btnFs);
        ctrls.append(seekWrap,bar);
        bindPanelToggle(btnSettings,settingsPanel,[colorPanel]);
        bindPanelToggle(dotEl,colorPanel,[settingsPanel]);
        wrap.addEventListener('click',()=>{settingsPanel.classList.remove('open');colorPanel.classList.remove('open');});
        wrap.append(video,grad,gradTop,topBar,colorPanel,spinner,bufPctEl,speedPopup,center,settingsPanel,ctrls,volFlash);
        const{clearMonitor}=buildConnectionMonitor(video,wrap);
        applyColor(currentColor,wrap,dotEl);
        const{clearTimer:clearClockTimer}=buildClock(wrap);
        const{reloadVideo,clearTimer:clearFreezeTimer}=buildErrorHandler(video,wrap,_play,'Sblocca video (S)');
        let hideTimer=null;
        const showUi=()=>{wrap.classList.add('ui');clearTimeout(hideTimer);if(!video.paused)hideTimer=setTimeout(()=>{if(settingsPanel.classList.contains('open')||colorPanel.classList.contains('open'))return;wrap.classList.remove('ui');},HIDE_DELAY_MS);};
        wrap.addEventListener('pointermove',showUi);wrap.addEventListener('pointerleave',()=>{if(!video.paused)wrap.classList.remove('ui');});
        video.addEventListener('pause',()=>{if(video.dataset.silentReload)return;wrap.classList.add('ui');clearTimeout(hideTimer);});video.addEventListener('play',()=>{if(video.dataset.silentReload)return;showUi();});
        const{flash,flashBrief,playPauseFlash,setSkipFlash,clearTimer:clearCenterTimer}=buildCenterFlash(center);
        [btnPlay,btnRestart,btnMute,btnUndo,btnSkip,btnPrev,btnNext,btnSettings,btnPip,btnFs].forEach(addRipple);
        const toggle=()=>video.paused?_play():video.pause();
        video.addEventListener('click',toggle);video.addEventListener('dblclick',()=>btnFs.click());btnPlay.addEventListener('click',toggle);
        wirePlayPauseEvents({video,onUpdate:p=>{setIcon(icoPlay,p?IC.pause:IC.play);setTip(btnPlay,p?'Pausa':'Riproduci');},playPauseFlash});
        const ep=buildEpisodeActions({video,_play,flash});
        btnRestart.addEventListener('click',ep.restart);
        btnSkip.addEventListener('click',ep.skip);
        btnUndo.addEventListener('click',ep.undo);
        btnPrev.addEventListener('click',ep.prev);
        btnNext.addEventListener('click',ep.next);
        buildPipHandler({video,btnPip,wrap,onEnter:()=>setTip(btnPip,'Chiudi PiP'),onLeave:()=>setTip(btnPip,'Picture in Picture')});
        btnFs.addEventListener('click',()=>fsElement()?fsExit():fsRequest(wrap));
        const{showResumeToast,stopSaving,episodeEnded}=buildResumeLogic(video,wrap,()=>speedVal);
        const onFs=()=>{const isFs=!!fsElement();if(isFs&&isAutoPlayOn()&&video.paused&&!episodeEnded())_play();setTimeout(()=>{setIcon(icoFs,isFs?IC.fsOff:IC.fsOn);setTip(btnFs,isFs?'Esci (F)':'Fullscreen (F)');},0);};
        const hkAction={fullscreen:()=>btnFs.click(),mute:()=>btnMute.click(),restart:()=>btnRestart.click(),skipOp:()=>btnSkip.click(),undoSkip:()=>btnUndo.click(),prev:()=>btnPrev.click(),next:()=>btnNext.click(),reload:()=>reloadVideo(true)};
        const onKey=e=>{if(pipElement())return;if(e.ctrlKey||e.metaKey||e.altKey)return;const tag=document.activeElement?.tagName??'',editable=document.activeElement?.isContentEditable;if(/INPUT|TEXTAREA/.test(tag)||editable)return;const k=(e.key||'').toLowerCase();const legendKey=hotkeyMap.legend||'a';if(isHotkeyOpen()){if(isEditingHotkey())return;if(e.key==='Escape'||k===legendKey){e.preventDefault();closeHotkey();}return;}if(k===legendKey){e.preventDefault();openHotkey();return;}if(e.key===' '){e.preventDefault();toggle();return;}if(e.key==='ArrowRight'){e.preventDefault();video.currentTime=Math.min(video.duration||0,video.currentTime+seekSecs);flashBrief(IC.seekFwd);return;}if(e.key==='ArrowLeft'){e.preventDefault();video.currentTime=Math.max(0,video.currentTime-seekSecs);flashBrief(IC.seekBwd);return;}if(e.key==='ArrowUp'){e.preventDefault();video.volume=Math.min(1,video.volume+.1);video.muted=false;lastNonZeroVol=video.volume;volEl.value=Math.round(video.volume*100);saveVol(video.volume,false);updateMuteState();updateVolUi();showVolFlash('up');return;}if(e.key==='ArrowDown'){e.preventDefault();video.volume=Math.max(0,video.volume-.1);video.muted=video.volume===0;if(video.volume>0)lastNonZeroVol=video.volume;volEl.value=Math.round(video.volume*100);saveVol(video.muted?lastNonZeroVol:video.volume,video.muted);updateMuteState();updateVolUi();showVolFlash('down');return;}if(e.key>='0'&&e.key<='9'&&video.duration){e.preventDefault();const t=video.duration*(parseInt(e.key,10)/10);flashBrief(t>video.currentTime?IC.seekFwd:IC.seekBwd);video.currentTime=t;return;}for(const a in hkAction){if(hotkeyMap[a]===k){e.preventDefault();hkAction[a]();return;}}};
        const onStorage=e=>{if(!e.key?.startsWith('aw-np-'))return;resumeToggle.checked=isResumeOn();autoEpToggle.checked=isAutoEpOn();autoPlayToggle.checked=isAutoPlayOn();connMonitorToggle.checked=isConnMonitorOn();globalToggle.checked=isGlobalOn();seekSecs=getSeekSecs();updateSeekVal();speedVal=loadSpeed();updateSpeedVal();updateSpeedInd(speedVal);showSpeedPopup(speedVal);const newColor=loadColor();if(newColor!==currentColor){currentColor=newColor;applyColor(currentColor,wrap,dotEl);syncCustomInput(currentColor);updateSwatches(currentColor);}const iconOn=isIconColorOn();wrap.classList.toggle('accent-icons',iconOn);iconColorToggle.checked=iconOn;const topOn=isTopColorOn();wrap.classList.toggle('accent-top',topOn);topColorToggle.checked=topOn;flashToggle.checked=isFlashOn();const clockOn=isClockOn();wrap.classList.toggle('clock-hidden',!clockOn);clockToggle.checked=clockOn;const spOn=isSpeedPopupOn();wrap.classList.toggle('speed-popup-hidden',!spOn);speedPopupToggle.checked=spOn;colorGlobalToggle.checked=isColorGlobalOn();if(e.key===KEY_HOTKEYS&&!isEditingHotkey()){hotkeyMap=loadHotkeys();updateKbdLetter();setHotkeyMap?.(hotkeyMap);}};
        const onUnload=()=>{if(!episodeEnded())saveResumePos(video.currentTime);};
        const removeFs=fsChange(onFs);
        document.addEventListener('keydown',onKey);window.addEventListener('beforeunload',onUnload);window.addEventListener('storage',onStorage);
        cleanup=()=>{removeFs();document.removeEventListener('keydown',onKey);destroyHotkey?.();window.removeEventListener('beforeunload',onUnload);window.removeEventListener('storage',onStorage);stopSaving();_stopSavingFn=null;clearTimeout(hideTimer);clearCenterTimer();clearVolFlashTimer();clearSpeedTimer();clearFreezeTimer();clearClockTimer();clearMonitor();setSkipFlash(true);video.pause();video.src='';if(_preloadedVideo){_preloadedVideo.pause();_preloadedVideo.src='';_preloadedVideo.remove();_preloadedVideo=null;}_preloadedToken=null;_preloadedUrl=null;cleanup=null;};
        wrap._play=()=>_play();wrap._showResumeTst=s=>showResumeToast(s);wrap._setSkipFlash=setSkipFlash;
        return wrap;
    }

    // ── Mount (windowed) ──────────────────────────────────────────────────────
    function mountPlayer(url){
        if(!url)return;const container=document.querySelector('#player');if(!container)return;
        const existing=container.querySelector('#aw-np-video');
        if(existing&&existing.getAttribute('src')===url)return;
        if(cleanup)cleanup();injectStyle();container.innerHTML='';
        const wrap=buildPlayer(url);container.appendChild(wrap);
        showCollectNotice(wrap,wrap.querySelector('#aw-np-video'));
    }

    // ── Dispatch desktop/mobile ───────────────────────────────────────────────
    function injectStyle(){isMobile?injectStyleMobile():injectStyleDesktop();}
    function buildPlayer(url){return isMobile?buildPlayerMobile(url):buildPlayerDesktop(url);}

    // ── Stili mobile ──────────────────────────────────────────────────────────
    function injectStyleMobile(){
        if(document.getElementById('aw-np-style'))return;
        const s=document.createElement('style');s.id='aw-np-style';
        s.textContent=`
            #player{background:#000}*,*::before,*::after{box-sizing:border-box}*:focus{outline:none!important}button{-webkit-tap-highlight-color:transparent}
            #aw-np,#aw-np *{-webkit-touch-callout:none!important;-webkit-user-drag:none;user-select:none!important;-webkit-user-select:none!important}
            #aw-np{--np-bar-h:clamp(40px,5.2cqh,56px);--np-btn-size:clamp(36px,4.8cqh,52px);--np-svg-size:clamp(20px,2.7cqh,32px);--np-seek-h:30px;--np-top-h:52px;--np-fs-title:clamp(14px,2.4cqh,26px);--np-fs-subtitle:clamp(13px,2cqh,22px);--np-fs-body:clamp(13px,1.7cqh,17px);--np-fs-small:clamp(12px,1.5cqh,15px);--np-fs-micro:clamp(10px,1.2cqh,13px);--np-fs-brand:clamp(11px,1.6cqh,17px);--np-spinner-size:clamp(40px,6.5cqh,80px);container-type:size;position:relative;isolation:isolate;width:100%;height:100%;background:#000;display:flex;flex-direction:column;overflow:hidden;font-family:'Google Sans',Roboto,'Helvetica Neue',sans-serif;user-select:none;touch-action:pan-y}
            #aw-np-video{flex:1;width:100%;min-height:0;display:block;background:#000}
            #aw-np-bar,#aw-np-top,#aw-np-toast,#aw-np-error-toast,#aw-np-conn-toast,#aw-np-settings-panel,#aw-np-color-panel,#aw-np-menu-panel,.np-row-tip,.np-btn,.np-swatch,.np-switch-track,.np-switch-thumb,#aw-np-seek-fill,#aw-np-seek-buf,#aw-np-seek-thumb,#aw-np-title,#aw-np-epinfo,#aw-np-brand,#aw-np-clock,#aw-np-clock svg circle,#aw-np-clock .hand-h,#aw-np-clock .hand-m,#aw-np-clock .pin,#aw-np-spinner,#aw-np-time,#aw-np-speed-ind,#aw-np-speed-popup,#aw-np-buf-pct,#aw-np-dot,#aw-np-play-center{transition-property:color,background,background-color,fill,stroke,border-color,box-shadow;transition-duration:.4s;transition-timing-function:cubic-bezier(.4,0,.2,1)}
            .np-grad{position:absolute;left:0;right:0;height:140px;pointer-events:none;opacity:0;transition:opacity .3s cubic-bezier(.4,0,.2,1)}
            #aw-np.ui .np-grad{opacity:1}
            #aw-np-gradient{bottom:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            #aw-np-gradient-top{top:0;background:linear-gradient(to bottom,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            .np-ui-layer{opacity:0;transition:opacity .3s cubic-bezier(.4,0,.2,1),transform .3s cubic-bezier(.4,0,.2,1);pointer-events:none}
            #aw-np-top.np-ui-layer{transform:translateY(-12px)}
            #aw-np-controls.np-ui-layer{transform:translateY(8px)}
            #aw-np.ui #aw-np-top.np-ui-layer,#aw-np.ui #aw-np-controls.np-ui-layer{transform:translateY(0)}
            #aw-np.ui .np-ui-layer{opacity:1;pointer-events:all}
            #aw-np-top{position:absolute;top:0;left:0;right:0;height:var(--np-top-h);display:flex;align-items:center;justify-content:space-between;padding:0 14px}
            #aw-np-top-left{display:flex;flex-direction:column;gap:1px;overflow:hidden;flex:1}
            #aw-np-title{font-size:var(--np-fs-title);font-weight:600;color:var(--np-accent-bg-fg,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-epinfo{font-size:var(--np-fs-subtitle);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.7));opacity:.8;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-top-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
            #aw-np-dot{width:10px;height:10px;border-radius:50%;background:var(--np-accent,#fff);cursor:pointer;flex-shrink:0;transition:transform .2s cubic-bezier(.4,0,.2,1);position:relative}
            #aw-np-kbd-btn{display:none!important}
            #aw-np-color-panel{position:absolute;top:var(--np-top-h);right:12px;background:var(--np-accent-bg,#000);border:1px solid color-mix(in srgb,var(--np-accent,#fff) 20%,transparent);border-radius:12px;padding:clamp(10px,2cqw,14px);display:flex;flex-direction:column;gap:clamp(8px,1.5cqw,12px);font-size:var(--np-fs-body);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:25;opacity:0;transform:scale(.9) translateY(-8px);transform-origin:top right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5);max-height:calc(100% - 148px);overflow-y:auto}
            #aw-np-color-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            #aw-np-color-swatches{display:flex;flex-wrap:wrap;gap:clamp(6px,1.2vw,8px);width:clamp(150px,30vw,184px)}
            .np-swatch{width:clamp(24px,4.5vw,30px);height:clamp(24px,4.5vw,30px);border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .2s cubic-bezier(.4,0,.2,1),border-color .15s,box-shadow .2s;flex-shrink:0}
            .np-swatch.active{border-color:var(--np-accent,#fff);box-shadow:0 0 0 3px color-mix(in srgb,var(--np-accent,#fff) 35%,transparent),0 2px 6px rgba(0,0,0,.4);transform:scale(1.08)}
            .np-swatch:hover{transform:scale(1.12);box-shadow:0 3px 10px rgba(0,0,0,.45)}
            #aw-np-controls{position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;padding:0 6px 6px}
            #aw-np-seek-wrap{height:var(--np-seek-h);display:flex;align-items:center;cursor:pointer;padding:0 4px;touch-action:none}
            #aw-np-seek-track{position:relative;width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,.2)}
            #aw-np-seek-buf{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent-dim,rgba(255,255,255,.5));width:0;opacity:.6}
            #aw-np-seek-fill{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent,#fff);width:0}
            #aw-np-seek-thumb{position:absolute;top:50%;left:0;width:16px;height:16px;background:var(--np-accent,#fff);border-radius:50%;transform:translate(-50%,-50%) scale(0);transition:transform .15s cubic-bezier(.4,0,.2,1);box-shadow:0 2px 6px rgba(0,0,0,.4)}
            #aw-np-seek-wrap:active #aw-np-seek-thumb,#aw-np-seek-wrap.seeking #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1.2)}
            #aw-np-bar{display:flex;align-items:center;height:var(--np-bar-h);gap:0}
            #aw-np-spacer{flex:1}
            .np-icon{display:contents}
            .np-btn{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;width:var(--np-btn-size);height:var(--np-btn-size);min-width:unset;background:none;border:none;cursor:pointer;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));padding:0;flex-shrink:0;border-radius:50%}
            .np-btn:active{background:var(--np-accent-state-2,rgba(255,255,255,.18))}
            .np-btn svg{display:block;fill:currentColor;flex-shrink:0;width:var(--np-svg-size);height:var(--np-svg-size);transition:transform .2s cubic-bezier(.2,0,0,1)}
            .np-btn:active svg{transition-duration:.1s;transform:scale(.88)}
            .np-btn svg line{stroke:currentColor}
            .accent-icons .np-btn{color:var(--np-accent,#fff)}
            .accent-icons .np-btn svg{fill:var(--np-accent,#fff)}
            .accent-icons .np-btn svg line{stroke:var(--np-accent,#fff)}
            .accent-top #aw-np-title{color:var(--np-accent,#fff)}
            .accent-top #aw-np-epinfo{color:var(--np-accent,#fff);opacity:.75}
            #aw-np-brand{font-size:var(--np-fs-brand);font-weight:500;letter-spacing:.04em;color:var(--np-accent-bg-fg,rgba(255,255,255,.5));opacity:.6;white-space:nowrap;line-height:1;text-transform:uppercase}
            .accent-top #aw-np-brand{color:var(--np-accent,#fff);opacity:.5}
            .np-ripple{position:absolute;border-radius:50%;background:var(--np-accent-state-2,rgba(255,255,255,.35));transform:scale(0);opacity:1;animation:np-ripple .55s cubic-bezier(.2,0,.2,1);pointer-events:none}
            @keyframes np-ripple{0%{transform:scale(0);opacity:1}60%{opacity:.6}100%{transform:scale(2.8);opacity:0}}
            #aw-np-time{font-size:var(--np-fs-small);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));letter-spacing:.03em;white-space:nowrap;padding:0 4px;font-variant-numeric:tabular-nums}
            #aw-np-menu-panel{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 8px);right:8px;background:var(--np-accent-bg,#282828);border:1px solid color-mix(in srgb,var(--np-accent,#fff) 20%,transparent);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:2px;z-index:25;opacity:0;transform:scale(.9) translateY(8px);transform-origin:bottom right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5);max-height:calc(100% - 120px);overflow-y:auto}
            #aw-np-menu-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            .np-menu-btn{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px;border:none;background:none;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:var(--np-fs-body);cursor:pointer;width:100%;text-align:left}
            .np-menu-btn:active{background:var(--np-accent-state-2,rgba(255,255,255,.18))}
            .np-menu-btn svg{fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));width:22px;height:22px;flex-shrink:0}
            .np-menu-btn span{display:block}
            @media (orientation:portrait){#aw-np-menu-panel{flex-direction:row;padding:4px}.np-menu-btn{padding:8px;width:auto;gap:0}.np-menu-btn span{display:none}}
            #aw-np-settings-panel{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 8px);right:8px;background:var(--np-accent-bg,#000);border:1px solid color-mix(in srgb,var(--np-accent,#fff) 20%,transparent);border-radius:12px;padding:clamp(10px,2cqw,14px) clamp(12px,2.5cqw,18px);min-width:clamp(190px,40cqw,230px);display:flex;flex-direction:column;gap:clamp(7px,1.5cqw,10px);font-size:var(--np-fs-body);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:25;opacity:0;transform:scale(.9) translateY(8px);transform-origin:bottom right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5);max-height:calc(100% - 120px);overflow-y:auto}
            #aw-np-settings-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            .np-switch{position:relative;width:36px;height:20px;flex-shrink:0;cursor:pointer}
            .np-switch input{opacity:0;width:0;height:0;position:absolute}
            .np-switch-track{position:absolute;inset:0;border-radius:10px;background:rgba(255,255,255,.2);transition:background .2s cubic-bezier(.4,0,.2,1)}
            .np-switch input:checked~.np-switch-track{background:var(--np-accent,#fff)}
            .np-switch-thumb{position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 4px rgba(0,0,0,.3)}
            .np-switch input:checked~.np-switch-thumb{transform:translateX(16px)}
            .np-switch input:not(:checked)~.np-switch-thumb{background:rgba(255,255,255,.8)}
            .np-row-tip{position:absolute;top:50%;right:calc(100% + 14px);transform:translateY(-50%);background:var(--np-accent-bg,#000);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:var(--np-fs-small);line-height:1.5;padding:6px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4)}
            .np-row-tip::after{content:'';position:absolute;top:50%;left:100%;transform:translateY(-50%);border:5px solid transparent;border-left-color:var(--np-accent-bg,#000)}
            [data-tip]{margin:0 -8px;padding:6px 8px;border-radius:8px;transition:background .15s cubic-bezier(.4,0,.2,1)}[data-tip]:hover{background:var(--np-accent-state-1,rgba(255,255,255,.06))}[data-tip]:hover .np-row-tip{opacity:1;transition-delay:.5s}
            #aw-np-toast{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px);left:50%;transform:translateX(-50%);background:color-mix(in srgb,var(--np-accent-bg,#282828) 80%,transparent);color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-size:var(--np-fs-body);font-weight:500;padding:7px 16px;border-radius:24px;pointer-events:none;white-space:nowrap;opacity:1;transition:opacity .4s cubic-bezier(.4,0,.2,1);z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4)}

            #aw-np-speed-ind{font-size:var(--np-fs-micro);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.55));letter-spacing:.03em;white-space:nowrap;padding:0 0 0 4px;font-variant-numeric:tabular-nums;display:none}
            @media (orientation:landscape){#aw-np-speed-ind{display:inline}}
            #aw-np-speed-popup{position:absolute;top:10px;left:10px;background:transparent;color:rgba(255,255,255,.6);font-size:var(--np-fs-title);font-weight:500;padding:2px 4px;border-radius:4px;pointer-events:none;opacity:0;transition:opacity .3s cubic-bezier(.4,0,.2,1);z-index:20;letter-spacing:.02em;text-shadow:0 1px 6px rgba(0,0,0,.95)}
            #aw-np-speed-popup.on{opacity:1}
            #aw-np.ui #aw-np-speed-popup{opacity:0!important}
            #aw-np-clock{position:absolute!important;inset:10px 12px auto auto!important;display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.6);font-size:clamp(18px,3.1cqh,34px);font-weight:500;padding:2px 4px;pointer-events:none;z-index:20;letter-spacing:.03em;text-shadow:0 1px 6px rgba(0,0,0,.95);font-variant-numeric:tabular-nums;transition:opacity .3s cubic-bezier(.4,0,.2,1);flex:none;transform:none;margin:0}
            #aw-np-clock svg{width:1em;height:1em;flex-shrink:0;display:block;filter:drop-shadow(0 0 1px rgba(0,0,0,.95)) drop-shadow(0 1px 3px rgba(0,0,0,.7))}
            #aw-np-clock .hand-h{fill:var(--np-accent,#fff);fill-opacity:1;stroke:var(--np-accent,#fff)}#aw-np-clock .pin{fill:var(--np-accent,#fff);fill-opacity:1;stroke:var(--np-accent,#fff)}#aw-np-clock .hand-m{fill:currentColor}
            #aw-np.ui #aw-np-clock{opacity:0!important;visibility:hidden}
            #aw-np.clock-hidden #aw-np-clock{display:none!important}
            #aw-np.speed-popup-hidden #aw-np-speed-popup{display:none!important}
            #aw-np-conn-toast{position:absolute;top:clamp(12px,1.7cqh,18px);left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:12px;font-size:calc(var(--np-fs-body) * .82);font-weight:500;color:rgba(255,255,255,.95);z-index:22;box-shadow:0 4px 14px rgba(0,0,0,.45),0 1px 3px rgba(0,0,0,.3);pointer-events:all;white-space:nowrap;opacity:0;transition:opacity .35s cubic-bezier(.4,0,.2,1);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08)}
            #aw-np-conn-toast.slow{background:rgba(210,100,15,.78)}
            #aw-np-conn-toast.good{background:rgba(30,155,65,.78)}
            #aw-np-conn-toast .conn-msg{display:flex;flex-direction:column;gap:2px;line-height:1.3;text-align:center;letter-spacing:.025em;flex:1}
            #aw-np-buf-pct{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:var(--np-fs-title);font-weight:600;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));pointer-events:none;display:none;font-variant-numeric:tabular-nums;text-shadow:0 1px 4px rgba(0,0,0,.9)}
            #aw-np-buf-pct.on{display:block}
            #aw-np-error-toast{position:absolute;bottom:calc(var(--np-bar-h) + var(--np-seek-h) + 16px);left:50%;transform:translateX(-50%);background:rgba(180,30,30,.92);color:#fff;font-size:var(--np-fs-body);font-weight:500;letter-spacing:.02em;padding:7px 18px;border-radius:24px;pointer-events:all;white-space:nowrap;z-index:21;box-shadow:0 4px 12px rgba(0,0,0,.5);cursor:pointer}
            #aw-np-spinner{position:absolute;inset:0;margin:auto;width:var(--np-spinner-size);height:var(--np-spinner-size);border:3px solid rgba(255,255,255,.12);border-top-color:var(--np-accent,#fff);border-radius:50%;animation:np-spin .65s linear infinite;pointer-events:none;display:none}
            #aw-np-spinner.on{display:block}
            @keyframes np-spin{to{transform:rotate(360deg)}}
            @keyframes aw-np-fade{from{opacity:0}to{opacity:1}}
            @keyframes aw-np-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
            .np-flash-circle{position:absolute;top:50%;left:50%;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;z-index:12;color:var(--np-accent-bg-fg,rgba(255,255,255,.9))}
            .np-flash-circle::before{content:'';position:absolute;inset:0;border-radius:50%;background:var(--np-accent-bg,#1a1a2e);opacity:.8;pointer-events:none}
            .np-flash-circle.on{opacity:1}
            .np-flash-circle svg{fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));opacity:1;width:34px;height:34px;position:relative;z-index:1}
            #aw-np-center{margin:-36px 0 0 -36px;transform:scale(.7);transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.34,1.56,.64,1)}
            #aw-np-center.on{transform:scale(1)}
            #aw-np-vol-flash{transform:translate(-50%,-50%);transition:opacity .2s cubic-bezier(.4,0,.2,1)}
            #aw-np-vol-flash svg{display:block}

            #aw-np-play-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:all;z-index:5;color:var(--np-accent-bg-fg,rgba(255,255,255,.9))}
            #aw-np-play-center::before{content:'';position:absolute;inset:0;border-radius:50%;background:var(--np-accent-bg,#1a1a2e);opacity:.85;pointer-events:none}
            #aw-np-play-center svg{fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));width:30px;height:30px;position:relative;z-index:1}
            .np-seek-flash{position:absolute;top:0;bottom:0;width:25%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .2s}
            .np-seek-flash.on{opacity:1}
            #aw-np-seek-flash-left{left:0}
            #aw-np-seek-flash-right{right:0}
            .np-seek-flash svg{fill:rgba(255,255,255,.7);width:40px;height:40px}
            .np-vol-bar{position:absolute;top:0;bottom:0;width:25%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .3s}
            .np-vol-bar.on{opacity:1}
            #aw-np-vol-bar-left{left:0}
            #aw-np-vol-bar-right{right:0}
            @media (orientation:landscape){.np-portrait-only{display:none!important}}
            @media (orientation:portrait){.np-landscape-only{display:none!important}}
        `;
        document.head.appendChild(s);
    }

    // ── Build player mobile ───────────────────────────────────────────────────
    function buildPlayerMobile(videoUrl){
        const{video,vol,muted,_play}=initVideo(videoUrl);
        const{wrap,grad,gradTop,spinner,center,ctrls,timeEl,SEP}=buildShellElements();

        const{flash,flashBrief,setSkipFlash,clearTimer:clearCenterTimer}=buildCenterFlash(center);
        const ep=buildEpisodeActions({video,_play,flash});

        const{speedIndEl,speedPopup,updateSpeedInd,showSpeedPopup,clearTimer:clearSpeedTimer}=buildSpeedIndicator(loadSpeed());
        const{bufPctEl}=buildBufferingIndicator(video,spinner);
        const{seekWrap,isSeeking}=buildSeekBar(video,false,()=>{timeEl.textContent=fmt(video.currentTime)+' / '+fmt(video.duration);});

        const mkMBtn=(id,html)=>{const b=mk('button');b.className='np-btn';b.id=id;b.innerHTML=html;b.tabIndex=-1;return b;};
        const btnPlay=mkMBtn('aw-btn-play',IC.play),btnMute=mkMBtn('aw-btn-mute',muted?IC.mute:IC.vol);
        const btnPip=mkMBtn('aw-btn-pip',IC.pip),btnSettings=mkMBtn('aw-btn-settings',IC.settings);
        const btnMenu=mkMBtn('aw-btn-menu',IC.menu),btnFs=mkMBtn('aw-btn-fs',IC.fsOn);
        const btnRestart=mkMBtn('aw-btn-restart',IC.restart),btnUndo=mkMBtn('aw-btn-undo',IC.undo);
        const btnSkip=mkMBtn('aw-btn-skip',IC.skip),btnPrev=mkMBtn('aw-btn-prev',IC.prev),btnNext=mkMBtn('aw-btn-next',IC.next);
        const spacer=mk('div','aw-np-spacer');
        const bar=mk('div','aw-np-bar');
        [btnRestart,btnUndo,btnSkip,btnPrev,btnNext].forEach(b=>b.classList.add('np-landscape-only'));
        btnMenu.classList.add('np-portrait-only');
        bar.append(btnPlay,btnRestart,btnMute,timeEl,speedIndEl,spacer,btnUndo,btnSkip,btnPrev,btnNext,btnMenu,btnSettings,btnPip,btnFs);
        ctrls.append(seekWrap,bar);

        const menuPanel=mk('div','aw-np-menu-panel');
        const mkMenuBtn=(html,label,onClick)=>{const b=document.createElement('button');b.className='np-menu-btn';b.innerHTML=html+`<span>${label}</span>`;b.addEventListener('click',()=>{menuPanel.classList.remove('open');onClick();});return b;};
        menuPanel.append(
            mkMenuBtn(IC.restart,'Ricomincia',ep.restart),
            mkMenuBtn(IC.undo,'Annulla skip',ep.undo),
            mkMenuBtn(IC.skip,'Skip OP/ED',ep.skip),
            mkMenuBtn(IC.prev,'Episodio prec.',ep.prev),
            mkMenuBtn(IC.next,'Episodio succ.',ep.next)
        );

        const{settingsPanel,resumeToggle,autoEpToggle,autoPlayToggle,connMonitorToggle,seekSecs:getSeekSecs,speedVal:getSpeedVal,updateSeekVal,updateSpeedVal}=buildSettingsPanel(video,SEP,'Secondi saltati col doppio tap.',v=>{updateSpeedInd(v);showSpeedPopup(v);});
        let seekSecs=getSeekSecs(),speedVal=getSpeedVal();

        const{colorPanel,syncCustomInput,updateSwatches,topColorToggle,iconColorToggle,flashToggle,clockToggle,speedPopupToggle,colorGlobalToggle}=buildColorPanel(wrap,null,SEP);
        let currentColor=loadColor();

        const{topBar,dotEl}=buildTopBar(wrap,colorPanel);

        const playCenter=mk('div','aw-np-play-center');playCenter.classList.add('np-ui-layer');playCenter.innerHTML=IC.play;
        const seekFlashLeft=document.createElement('div');seekFlashLeft.className='np-seek-flash';seekFlashLeft.id='aw-np-seek-flash-left';seekFlashLeft.innerHTML=IC.seekBwd;
        const seekFlashRight=document.createElement('div');seekFlashRight.className='np-seek-flash';seekFlashRight.id='aw-np-seek-flash-right';seekFlashRight.innerHTML=IC.seekFwd;

        const volBarLeft=document.createElement('div');volBarLeft.id='aw-np-vol-bar-left';
        const volBarRight=document.createElement('div');volBarRight.id='aw-np-vol-bar-right';
        const BAR_S='position:absolute;top:0;bottom:0;width:25%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .3s cubic-bezier(.4,0,.2,1);z-index:50;';
        volBarLeft.style.cssText=BAR_S+'left:0;';volBarRight.style.cssText=BAR_S+'right:0;';
        const mkVolBarInner=()=>{
            const inner=document.createElement('div');
            inner.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;background:var(--np-accent-bg,#1c1c1c);border-radius:12px;padding:10px 0 12px;width:44px;height:48%;box-shadow:0 4px 16px rgba(0,0,0,.4);';
            const pct=document.createElement('div');pct.style.cssText='font-size:var(--np-fs-small);font-weight:500;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));width:32px;text-align:center;font-variant-numeric:tabular-nums;letter-spacing:.02em;';
            const track=document.createElement('div');track.style.cssText='position:relative;width:4px;flex:1;border-radius:2px;background:rgba(255,255,255,.2);flex-shrink:0;';
            const fill=document.createElement('div');fill.style.cssText='position:absolute;bottom:0;left:0;right:0;border-radius:2px;background:var(--np-accent,#fff);';
            track.appendChild(fill);inner.append(pct,track);return{inner,pct,fill};
        };
        const{inner:volInnerL,pct:volPctL,fill:volBarFillL}=mkVolBarInner();
        const{inner:volInnerR,pct:volPctR,fill:volBarFillR}=mkVolBarInner();
        volBarLeft.appendChild(volInnerL);volBarRight.appendChild(volInnerR);

        let lastNonZeroVol=muted?(vol||1):vol;
        const{volFlash,showVolFlash,clearTimer:clearVolFlashTimer}=buildVolFlash(video);

        wrap.append(video,grad,gradTop,topBar,colorPanel,menuPanel,settingsPanel,spinner,bufPctEl,speedPopup,center,playCenter,seekFlashLeft,seekFlashRight,volBarLeft,volBarRight,volFlash,ctrls);
        const{clearMonitor}=buildConnectionMonitor(video,wrap);
        applyColor(currentColor,wrap,dotEl);
        const{clearTimer:clearClockTimer}=buildClock(wrap);
        const{reloadVideo,clearTimer:clearFreezeTimer}=buildErrorHandler(video,wrap,_play,'Sblocca video');

        let hideTimer=null;
        const toggle=()=>video.paused?_play():video.pause();
        const closepanels=()=>{settingsPanel.classList.remove('open');colorPanel.classList.remove('open');menuPanel.classList.remove('open');};
        const startHideTimer=()=>{clearTimeout(hideTimer);if(!video.paused)hideTimer=setTimeout(()=>{if(!wrap.querySelector('.open'))wrap.classList.remove('ui');},HIDE_DELAY_MS);};
        const showUi=()=>{closepanels();wrap.classList.add('ui');startHideTimer();};
        const hideUi=()=>{wrap.classList.remove('ui');clearTimeout(hideTimer);};
        const isOnControls=e=>{const t=e.target;return t&&(t.closest('#aw-np-controls')||t.closest('#aw-np-top')||t.closest('#aw-np-settings-panel')||t.closest('#aw-np-color-panel')||t.closest('#aw-np-menu-panel'));};
        video.addEventListener('pause',()=>{if(video.dataset.silentReload)return;wrap.classList.add('ui');clearTimeout(hideTimer);});
        video.addEventListener('play',()=>{if(video.dataset.silentReload)return;showUi();});

        [btnPlay,btnMute,btnPip,btnSettings,btnMenu,btnFs].forEach(addRipple);
        btnPlay.addEventListener('click',toggle);
        playCenter.addEventListener('click',e=>{e.stopPropagation();toggle();});
        wirePlayPauseEvents({video,onUpdate:p=>{const html=p?IC.pause:IC.play;btnPlay.innerHTML=html;playCenter.innerHTML=html;}});
        btnRestart.addEventListener('click',ep.restart);
        btnUndo.addEventListener('click',ep.undo);
        btnSkip.addEventListener('click',ep.skip);
        btnPrev.addEventListener('click',ep.prev);
        btnNext.addEventListener('click',ep.next);
        btnMute.addEventListener('click',()=>{if(video.muted||video.volume===0){video.muted=false;video.volume=lastNonZeroVol;}else{if(video.volume>0)lastNonZeroVol=video.volume;video.muted=true;}const m=(video.muted||video.volume===0);btnMute.innerHTML=m?IC.mute:IC.vol;saveVol(video.muted?lastNonZeroVol:video.volume,video.muted);showVolFlash(video.muted?'down':'up');});
        buildPipHandler({video,btnPip,wrap});
        let mobileFs=false;
        const setMobileFs=state=>{mobileFs=state;btnFs.innerHTML=state?IC.fsOff:IC.fsOn;};
        btnFs.addEventListener('click',()=>{if(mobileFs){document.exitFullscreen?.()?.catch?.(()=>{});}else{wrap.requestFullscreen?.()?.catch?.(()=>{});}});
        const removeFsM=fsChange(()=>{const fs=!!document.fullscreenElement;if(fs&&isAutoPlayOn()&&video.paused&&!episodeEnded())_play();setTimeout(()=>setMobileFs(fs),0);});
        bindPanelToggle(btnSettings,settingsPanel,[menuPanel,colorPanel],startHideTimer);
        bindPanelToggle(btnMenu,menuPanel,[settingsPanel,colorPanel],startHideTimer);
        bindPanelToggle(dotEl,colorPanel,[settingsPanel,menuPanel],startHideTimer);
        wrap.addEventListener('click',e=>{if(isOnControls(e))return;closepanels();startHideTimer();});
        let volBarTimer=null;
        const updateVolBars=()=>{const pct=(video.muted?0:video.volume)*100;const ps=Math.round(pct)+'%';volBarFillL.style.height=pct+'%';volBarFillR.style.height=pct+'%';volPctL.textContent=ps;volPctR.textContent=ps;};

        let volSliding=false,volSlideStartY=0,volSlideStartX=0,volSlideStartVol=0,volSlideEndTime=0;
        const isFullscreenLandscape=()=>window.innerWidth>window.innerHeight&&(!!document.fullscreenElement||window.innerHeight===screen.height||window.innerWidth===screen.width);

        // ── Volume popup posizione bande nere (portrait) ──────────────────────
        const updateVolBarPosition=()=>{
            if(window.innerWidth<window.innerHeight){
                const vRect=video.getBoundingClientRect();
                const wRect=wrap.getBoundingClientRect();
                const bandH=vRect.top-wRect.top;
                const topPct=bandH>20?((bandH/2-30)/wRect.height*100)+'%':'10%';
                volBarLeft.style.alignItems='flex-start';volBarRight.style.alignItems='flex-start';
                volBarLeft.style.paddingTop=topPct;volBarRight.style.paddingTop=topPct;
            } else {
                volBarLeft.style.alignItems='center';volBarRight.style.alignItems='center';
                volBarLeft.style.paddingTop='0';volBarRight.style.paddingTop='0';
            }
        };

        video.addEventListener('contextmenu',e=>e.preventDefault());

        // ── Volume slide (solo fullscreen landscape) ──────────────────────────
        wrap.addEventListener('touchstart',e=>{
            if(isOnControls(e))return;
            if(!isFullscreenLandscape())return;
            const touch=e.touches[0];
            if(touch.clientX<8||touch.clientX>window.innerWidth-8||touch.clientY<20)return;
            const rect=wrap.getBoundingClientRect(),x=touch.clientX-rect.left,quarter=rect.width/5;
            if(x<quarter||x>rect.width-quarter){volSliding=false;volSlideStartY=touch.clientY;volSlideStartX=touch.clientX;volSlideStartVol=video.muted?0:video.volume;}
        },{passive:true});
        wrap.addEventListener('touchmove',e=>{
            if(isOnControls(e))return;
            if(!isFullscreenLandscape())return;
            const touch=e.touches[0],rect=wrap.getBoundingClientRect(),x=touch.clientX-rect.left,quarter=rect.width/5;
            if(x>=quarter&&x<=rect.width-quarter)return;
            const dy=volSlideStartY-touch.clientY,dx=touch.clientX-volSlideStartX;
            if(!volSliding&&Math.abs(dx)>Math.abs(dy))return;
            if(!volSliding&&Math.abs(dy)<10)return;
            volSliding=true;
            const newVol=Math.max(0,Math.min(1,volSlideStartVol+dy/rect.height));
            video.volume=newVol;video.muted=newVol===0;
            const m=(video.muted||video.volume===0);btnMute.innerHTML=m?IC.mute:IC.vol;
            if(newVol>0)lastNonZeroVol=newVol;saveVol(newVol===0?lastNonZeroVol:newVol,newVol===0);
            updateVolBars();updateVolBarPosition();
            const slidingLeft=x<quarter;
            if(slidingLeft){volBarRight.style.opacity='1';volBarLeft.style.opacity='0';}
            else{volBarLeft.style.opacity='1';volBarRight.style.opacity='0';}
            clearTimeout(volBarTimer);
            volBarTimer=setTimeout(()=>{volBarLeft.style.opacity='0';volBarRight.style.opacity='0';},1500);
        },{passive:true});
        wrap.addEventListener('touchend',()=>{if(volSliding)volSlideEndTime=Date.now();volSliding=false;});
        wrap.addEventListener('touchcancel',()=>{if(volSliding)volSlideEndTime=Date.now();volSliding=false;});

        let tapTimer=null,lastTap=0,seekFlashLTimer=null,seekFlashRTimer=null;
        wrap.addEventListener('click',e=>{
            if(isOnControls(e))return;
            if(isSeeking())return;
            if(Date.now()-volSlideEndTime<300)return;
            const now=Date.now(),rect=wrap.getBoundingClientRect(),x=e.clientX-rect.left,quarter=rect.width/5;
            const inCenter=x>=quarter&&x<=rect.width-quarter;
            if(now-lastTap<300){
                clearTimeout(tapTimer);
                if(x<quarter){video.currentTime=Math.max(0,video.currentTime-seekSecs);flashBrief(IC.seekBwd);seekFlashLeft.classList.add('on');clearTimeout(seekFlashLTimer);seekFlashLTimer=setTimeout(()=>seekFlashLeft.classList.remove('on'),400);}
                else if(x>rect.width-quarter){video.currentTime=Math.min(video.duration||0,video.currentTime+seekSecs);flashBrief(IC.seekFwd);seekFlashRight.classList.add('on');clearTimeout(seekFlashRTimer);seekFlashRTimer=setTimeout(()=>seekFlashRight.classList.remove('on'),400);}
                else if(inCenter)toggle();
                lastTap=0;
            }else{tapTimer=setTimeout(()=>{if(wrap.classList.contains('ui'))hideUi();else showUi();},200);lastTap=now;}
        });

        const{showResumeToast,stopSaving,episodeEnded}=buildResumeLogic(video,wrap,getSpeedVal);
        const onStorage=e=>{
            if(!e.key?.startsWith('aw-np-'))return;
            resumeToggle.checked=isResumeOn();autoEpToggle.checked=isAutoEpOn();autoPlayToggle.checked=isAutoPlayOn();connMonitorToggle.checked=isConnMonitorOn();
            seekSecs=getSeekSecs();updateSeekVal();speedVal=getSpeedVal();updateSpeedVal();updateSpeedInd(speedVal);showSpeedPopup(speedVal);
            const newColor=loadColor();
            if(newColor!==currentColor){currentColor=newColor;applyColor(currentColor,wrap,dotEl);syncCustomInput(currentColor);updateSwatches(currentColor);}
            const iconOn=isIconColorOn();wrap.classList.toggle('accent-icons',iconOn);iconColorToggle.checked=iconOn;
            const topOn=isTopColorOn();wrap.classList.toggle('accent-top',topOn);topColorToggle.checked=topOn;
            flashToggle.checked=isFlashOn();const clockOn=isClockOn();wrap.classList.toggle('clock-hidden',!clockOn);clockToggle.checked=clockOn;const spOn=isSpeedPopupOn();wrap.classList.toggle('speed-popup-hidden',!spOn);speedPopupToggle.checked=spOn;colorGlobalToggle.checked=isColorGlobalOn();
        };
        const onUnload=()=>{if(!episodeEnded())saveResumePos(video.currentTime);};
        window.addEventListener('beforeunload',onUnload);
        window.addEventListener('storage',onStorage);
        cleanup=()=>{removeFsM();window.removeEventListener('beforeunload',onUnload);window.removeEventListener('storage',onStorage);stopSaving();_stopSavingFn=null;clearTimeout(hideTimer);clearCenterTimer();clearVolFlashTimer();clearTimeout(volBarTimer);clearTimeout(seekFlashLTimer);clearTimeout(seekFlashRTimer);clearTimeout(tapTimer);clearSpeedTimer();clearFreezeTimer();clearClockTimer();clearMonitor();setSkipFlash(true);video.pause();video.src='';if(_preloadedVideo){_preloadedVideo.pause();_preloadedVideo.src='';_preloadedVideo.remove();_preloadedVideo=null;}_preloadedToken=null;_preloadedUrl=null;cleanup=null;};
        wrap._play=()=>_play();wrap._showResumeTst=s=>showResumeToast(s);wrap._setSkipFlash=setSkipFlash;
        return wrap;
    }

    // ── Swap src (fullscreen) ─────────────────────────────────────────────────
    function swapVideoSrc(url){
        const video=document.querySelector('#aw-np-video');
        if(!video){mountPlayer(url);return;}
        if(video.getAttribute('src')===url)return;
        const wrap=document.querySelector('#aw-np');
        const swapToken=_activeToken;
        const swapKey=KEY_RESUME_PFX+(swapToken||location.pathname);
        wrap?._setSkipFlash(true);video.pause();video.src=url;
        video.addEventListener('loadedmetadata',()=>{
            const spd=loadSpeed();if(video.playbackRate!==spd)video.playbackRate=spd;
            if(isResumeOn()){const saved=parseFloat(lsGet(swapKey)??'');if(saved>=RESUME_MIN_POS&&isFinite(video.duration)&&video.duration-saved>=RESUME_END_GAP){video.currentTime=saved;wrap?._showResumeTst(saved);}}
            if(isAutoPlayOn()&&!!fsElement()){wrap?._play();video.addEventListener('playing',()=>wrap?._setSkipFlash(false),{once:true});}else{wrap?._setSkipFlash(false);}
        },{once:true});
        ['#aw-np-seek-fill','#aw-np-seek-thumb','#aw-np-seek-buf'].forEach((sel,i)=>{const el=document.querySelector(sel);if(el)el.style[i===1?'left':'width']='0%';});
        const timeEl=document.querySelector('#aw-np-time');if(timeEl)timeEl.textContent='00:00 / 00:00';
    }

    // ── Navigazione ───────────────────────────────────────────────────────────
    function setActiveEpisode(token){
        const all=Array.from(document.querySelectorAll('.episode a'));
        const idx=all.findIndex(a=>a.dataset.id===token);
        all.forEach((a,i)=>a.classList.toggle('active',i===idx));
        const prevBtn=document.querySelector('.prevnext.prev');if(prevBtn)prevBtn.style.display=idx>0?'':'none';
        const nextBtn=document.querySelector('.prevnext.next');if(nextBtn)nextBtn.style.display=idx<all.length-1?'':'none';
        const epInfoEl=document.querySelector('#aw-np-epinfo');
        if(epInfoEl&&idx!==-1){const num=all[idx].textContent.trim()||String(idx+1);const maxNum=all.reduce((m,a)=>{const n=parseFloat(a.textContent.trim());return isNaN(n)?m:Math.max(m,n);},0);epInfoEl.textContent=`Episodio ${num}/${maxNum>0?maxNum:all.length}`;}
        if(idx===-1)return;
        const epData=all[idx].dataset;
        const episodeId=epData.episodeId,epNum=epData.num||epData.episodeNum;
        const player=document.querySelector('#player');
        if(player){player.dataset.id=token;if(episodeId)player.dataset.episodeId=episodeId;if(epNum)player.dataset.num=epNum;}
        document.querySelectorAll('.episodeNum').forEach(el=>el.textContent=epNum||'');
        const _animeId=document.querySelector("#player")?.dataset.animeId||"";
        const _csrf=document.querySelector('meta[name="csrf-token"]')?.content||"";
        const _updatePageMeta=(eId,num)=>{
            fetchWithRetry(`/api/episode/download?id=${eId}`,{credentials:"same-origin"})
                .then(r=>r.json()).then(data=>{const dl=document.querySelector("#downloadLink");if(dl&&data?.url)dl.href=data.url;}).catch(()=>{});
            if(!_animeId)return;
            fetchWithRetry(`/api/comments/anime/get/${_animeId}/${eId}`,{
                method:"POST",credentials:"same-origin",
                headers:{"CSRF-Token":_csrf,"Content-Type":"application/x-www-form-urlencoded"}
            }).then(r=>r.text()).then(html=>{
                const el=document.querySelector("#comments-scrollover-wrapper");
                if(el)el.innerHTML=html;
                document.querySelector("#episode-comment")?.classList.add("active");
                const sp=document.querySelector("#episode-comment span");if(sp)sp.textContent=num;
                document.querySelectorAll("#anime-comment,#rules").forEach(e=>e.classList.remove("active"));
                pageWin.loadSideFeatures?.();
            }).catch(()=>{});
        };
        if(episodeId)_updatePageMeta(episodeId,epNum);
    }

    // ── loadEpisode ───────────────────────────────────────────────────────────
    function loadEpisode(token){
        if(!token)return;
        if(_stopSavingFn){_stopSavingFn();_stopSavingFn=null;}
        const vid=document.querySelector('#aw-np-video');if(vid&&_activeToken)saveResumePos(vid.currentTime);
        _activeToken=token;saveLastEpisode(token);setActiveEpisode(token);
        const wasFullscreen=!!fsElement();
        const _preUrl=(token===_preloadedToken&&_preloadedUrl)?_preloadedUrl:null;
        const _preVid=_preloadedVideo;
        const _preVidUsed=token===_preloadedToken&&!!_preVid;
        _preloadedToken=null;_preloadedUrl=null;_preloadedVideo=null;
        if(_preVid&&!_preVidUsed){_preVid.pause();_preVid.src='';_preVid.remove();}
        const _doLoad=url=>{if(!url)return;const epLink=document.querySelector(`.episode a[data-id="${token}"]`);if(epLink?.href)history.pushState({},'',epLink.href);if(wasFullscreen&&!!fsElement())swapVideoSrc(url);else mountPlayer(url);if(_preVid&&_preVidUsed)setTimeout(()=>{_preVid.pause();_preVid.src='';_preVid.remove();},4000);};
        if(_preUrl)_doLoad(_preUrl);else getUrlForToken(token).then(_doLoad);
    }

    // ── Wire navigazione ──────────────────────────────────────────────────────
    function wireControls(){
        document.querySelectorAll('.episode a').forEach(a=>{if(a.dataset.npWired)return;a.dataset.npWired='1';a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();loadEpisode(a.dataset.id);});});
        document.querySelectorAll('.prevnext').forEach(btn=>{if(btn.dataset.npWired)return;btn.dataset.npWired='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const t=getAdjacentEpisode(btn.dataset.value);if(t)loadEpisode(t.dataset.id);});});
    }

    // ── Label "Better Player" ─────────────────────────────────────────────────
    function setupPlayerLabel(){
        let labelDone=false;
        const hide=()=>{
            ['.control[data-value="original"]','.control[data-value="alternative"]'].forEach(sel=>document.querySelectorAll(sel).forEach(el=>{if(el.dataset.npBlocked)return;el.dataset.npBlocked='1';el.style.setProperty('display','none','important');el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();},true);}));
            if(!document.getElementById('aw-bp-label')){const ref=document.querySelector('.control[data-value="original"]')||document.querySelector('.control[data-value="alternative"]');if(!ref)return;const label=document.createElement('div');label.id='aw-bp-label';label.className='control active';label.style.pointerEvents='none';label.innerHTML='<i style="color:#ec4f4f;" class="icon icon-random"></i> <span>Better Player</span>';ref.insertAdjacentElement('beforebegin',label);}
            labelDone=true;
        };
        hide();
        if(labelDone)return;
        const obs=new MutationObserver(()=>{hide();if(labelDone)obs.disconnect();});
        obs.observe(document.body,{childList:true,subtree:true});
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    function init(){
        cleanupResumeStorage();injectStyle();
        const currentToken=document.querySelector('#player')?.dataset?.id;
        if(currentToken)_activeToken=currentToken;
        const lastToken=isAutoEpOn()?loadLastEpisode():null;
        if(lastToken&&lastToken!==currentToken){loadEpisode(lastToken);}
        else if(currentToken){saveLastEpisode(currentToken);getUrlForToken(currentToken).then(url=>{if(url)mountPlayer(url);});}
        else{const link=document.querySelector('#downloadLink');const href=link?.getAttribute('href')||'';const m=href.match(/[?&]id=(.+)/);const url=m?decodeURIComponent(m[1]):(href.startsWith('http')?href:null);if(url)mountPlayer(url);}
        wireControls();setupPlayerLabel();
    }

    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>setTimeout(init,200));}else{setTimeout(init,200);}
})();
