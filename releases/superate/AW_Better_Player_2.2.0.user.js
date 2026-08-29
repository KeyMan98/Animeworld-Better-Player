// ==UserScript==
// @name         AnimeWorld Better Player
// @namespace    aw-better-player
// @version      2.2.0
// @match        *://www.animeworld.ac/play/*
// @run-at       document-start
// @description  Il player migliore di sempre — riscritto da zero.
// @description:it Il player migliore di sempre — riscritto da zero.
// @license      MIT
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const HIDE_DELAY_MS=3000,SKIP_SECONDS=85,SAVE_INTERVAL_MS=5000,RESUME_MIN_POS=5,RESUME_END_GAP=10,RESUME_MAX_AGE=30*24*60*60*1000;
    const KEY_VOL='aw-np-vol',KEY_MUTE='aw-np-muted',KEY_GLOBAL='aw-np-global',KEY_RESUME_ENABLE='aw-np-resume-enabled',KEY_RESUME_PFX='aw-np-resume:',KEY_SEEK_SECS='aw-np-seek-secs',KEY_AUTOEP_ENABLE='aw-np-autoep-enabled',KEY_AUTOEP_PFX='aw-np-autoep:',KEY_AUTOPLAY_ENABLE='aw-np-autoplay-enabled',KEY_COLOR='aw-np-color',KEY_COLOR_GLOBAL='aw-np-color-global',KEY_ICON_COLOR='aw-np-icon-color',KEY_TOP_COLOR='aw-np-top-color',KEY_FLASH_ENABLE='aw-np-flash-enabled',KEY_SPEED='aw-np-speed';
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
    const isGlobalOn=()=>lsGet(KEY_GLOBAL)!=='0';
    const pKey=k=>isGlobalOn()?k:k+':'+(window.animeIdentifier||'unknown');
    const isResumeOn=()=>lsGet(pKey(KEY_RESUME_ENABLE))!=='0';
    const isAutoEpOn=()=>lsGet(pKey(KEY_AUTOEP_ENABLE))==='1';
    const isAutoPlayOn=()=>lsGet(pKey(KEY_AUTOPLAY_ENABLE))==='1';
    const isColorGlobalOn=()=>lsGet(KEY_COLOR_GLOBAL)!=='0';
    const isIconColorOn=()=>lsGet(KEY_ICON_COLOR)==='1';
    const isTopColorOn=()=>lsGet(KEY_TOP_COLOR)==='1';
    const isFlashOn=()=>lsGet(KEY_FLASH_ENABLE)!=='0';
    const colorKey=()=>isColorGlobalOn()?KEY_COLOR:KEY_COLOR+':'+(window.animeIdentifier||'unknown');
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
    const animeId=()=>window.animeIdentifier||'';
    const saveLastEpisode=t=>{if(animeId())lsSet(KEY_AUTOEP_PFX+animeId(),t);};
    const loadLastEpisode=()=>animeId()?lsGet(KEY_AUTOEP_PFX+animeId()):null;

    // ── Volume ────────────────────────────────────────────────────────────────
    function loadVol(){const v=parseFloat(lsGet(KEY_VOL)??'1');return{vol:isNaN(v)?1:Math.max(0,Math.min(1,v)),muted:lsGet(KEY_MUTE)==='true'};}
    const saveVol=(vol,muted)=>{lsSet(KEY_VOL,String(vol));lsSet(KEY_MUTE,String(muted));};

    // ── Resume ────────────────────────────────────────────────────────────────
    let _activeToken='',_stopSavingFn=null;
    const resumeKey=()=>KEY_RESUME_PFX+(_activeToken||location.pathname);
    const resumeTs=()=>resumeKey()+':ts';
    function saveResumePos(t){if(!isResumeOn()||!isFinite(t)||t<=RESUME_MIN_POS)return;lsSet(resumeKey(),String(t));lsSet(resumeTs(),String(Date.now()));}
    function clearResumePos(){lsDel(resumeKey());lsDel(resumeTs());}
    function cleanupResumeStorage(){try{const now=Date.now();Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).forEach(k=>{if(!k?.startsWith(KEY_RESUME_PFX)||k.endsWith(':ts'))return;const ts=parseFloat(lsGet(k+':ts')??'');if(isNaN(ts)||now-ts>RESUME_MAX_AGE){lsDel(k);lsDel(k+':ts');}});}catch{}}

    // ── Utilities ─────────────────────────────────────────────────────────────
    function fmt(s){const t=Math.floor(s||0),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),sec=t%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
    function mk(tag,id){const e=document.createElement(tag);if(id)e.id=id;return e;}
    function mkBtn(id,html,tip){const b=mk('button');b.className='np-btn';b.id=id;b.innerHTML=html;b.tabIndex=-1;if(tip){const t=document.createElement('span');t.className='np-tip';t.textContent=tip;b.appendChild(t);}return b;}
    function mkIcon(btn,html){const s=document.createElement('span');s.className='np-icon';s.innerHTML=html;btn.prepend(s);return s;}
    function setIcon(el,html){if(el)el.innerHTML=html;}
    function setTip(btn,text){const t=btn.querySelector('.np-tip');if(t)t.textContent=text;}
    function mkRowTip(text){const t=document.createElement('span');t.className='np-row-tip';t.textContent=text;return t;}
    function mkSwitch(checked){const label=document.createElement('label');label.className='np-switch';const input=document.createElement('input');input.type='checkbox';input.checked=checked;const track=document.createElement('span');track.className='np-switch-track';const thumb=document.createElement('span');thumb.className='np-switch-thumb';label.append(input,track,thumb);return{label,input};}
    function getAdjacentEpisode(dir){const all=Array.from(document.querySelectorAll('.episode a'));const idx=all.findIndex(a=>a.classList.contains('active'));if(idx===-1)return null;return dir==='next'?(all[idx+1]??null):(all[idx-1]??null);}
    function getUrlForToken(token){return fetch(`/api/episode/serverPlayerAnimeWorld?alt=1&id=${token}`,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error();return r.text();}).then(html=>{const m=html.match(/file:\s*["']([^"']+)/);return m?m[1]:null;}).catch(()=>null);}

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
        const titleEl=mk('div','aw-np-title'),epInfoEl=mk('div','aw-np-epinfo'),dotEl=mk('div','aw-np-dot');
        const brandEl=mk('div','aw-np-brand');brandEl.textContent='AW Better Player';
        const allEps=Array.from(document.querySelectorAll('.episode a'));
        const epIdx=allEps.findIndex(a=>a.classList.contains('active'));
        const activeEp=epIdx!==-1?allEps[epIdx]:null;
        const epNum=activeEp?(activeEp.textContent.trim()||String(epIdx+1)):'?';
        const epMaxNum=allEps.reduce((m,a)=>{const n=parseFloat(a.textContent.trim());return isNaN(n)?m:Math.max(m,n);},0);
        titleEl.textContent=window.animeName||document.title.split(' Episodio')[0]||'';
        epInfoEl.textContent=`Episodio ${epNum}/${epMaxNum>0?String(epMaxNum):(allEps.length||'?')}`;
        topLeft.append(titleEl,epInfoEl);
        topRight.append(brandEl,dotEl);
        topBar.append(topLeft,topRight);
        return{topBar,dotEl,titleEl,epInfoEl};
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
        const customLabel=document.createElement('span');customLabel.textContent='Custom';customLabel.style.cssText='font-size:13px;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));flex-shrink:0;';
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
        const{row:flashRow,toggle:flashToggle}=mkSwitchRow('Flash centrali','Rimuove le animazioni centrali.',isFlashOn,v=>{lsSet(KEY_FLASH_ENABLE,v?'1':'0');},'',true);
        const{row:colorGlobalRow,toggle:colorGlobalToggle}=mkSwitchRow('Globale','Applica a tutte le serie.',isColorGlobalOn,v=>{
            lsSet(KEY_COLOR_GLOBAL,v?'1':'0');currentColor=loadColor();applyColor(currentColor,wrap,getDot());
            syncCustomInput(currentColor);updateSwatches(currentColor);
        },SEP,true);
        colorGlobalRow.id='aw-np-color-global';
        colorPanel.append(swatchWrap,customRow,topColorRow,iconColorRow,flashRow,colorGlobalRow);
        if(isIconColorOn())wrap.classList.add('accent-icons');
        if(isTopColorOn())wrap.classList.add('accent-top');
        return{colorPanel,swatchWrap,currentColor:()=>currentColor,setCurrentColor:c=>{currentColor=c;},syncCustomInput,updateSwatches,topColorToggle,iconColorToggle,flashToggle,colorGlobalToggle};
    }

    // ── Shared: buildSettingsPanel ────────────────────────────────────────────
    function buildSettingsPanel(video,SEP,seekTip){
        const settingsPanel=mk('div','aw-np-settings-panel');
        const BTN_CTRL_STYLE='background:var(--np-accent-state-1,rgba(255,255,255,.15));border:none;color:var(--np-accent-bg-fg,#fff);width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;';
        const{row:resumeRow,toggle:resumeToggle}=mkSwitchRow('Ripresa automatica','Riprende dall\'ultima interruzione.',isResumeOn(),v=>lsSet(pKey(KEY_RESUME_ENABLE),v?'1':'0'));
        const{row:autoEpRow,toggle:autoEpToggle}=mkSwitchRow('Episodio automatico','Riapre l\'ultimo episodio visto.',isAutoEpOn(),v=>lsSet(pKey(KEY_AUTOEP_ENABLE),v?'1':'0'));
        const{row:autoPlayRow,toggle:autoPlayToggle}=mkSwitchRow('Autoplay','In fullscreen, parte il video in automatico.',isAutoPlayOn(),v=>lsSet(pKey(KEY_AUTOPLAY_ENABLE),v?'1':'0'));
        let seekSecs=loadSeekSecs();
        const{row:seekRow,update:updateSeekVal}=mkStepRow('Seek',seekTip||'Secondi saltati.',()=>seekSecs,(d)=>{if(seekSecs+d<SEEK_MIN||seekSecs+d>SEEK_MAX)return;seekSecs+=d;lsSet(pKey(KEY_SEEK_SECS),String(seekSecs));},SEEK_STEP,v=>String(v).padStart(2,'0')+' s',BTN_CTRL_STYLE);
        let speedVal=loadSpeed();
        const{row:speedRow,update:updateSpeedVal}=mkStepRow('Velocità','Velocità di riproduzione.',()=>speedVal,(d)=>{const nv=Math.round((speedVal+d)*100)/100;if(nv<SPEED_MIN||nv>SPEED_MAX)return;speedVal=nv;lsSet(pKey(KEY_SPEED),String(speedVal));if(video.readyState>0)video.playbackRate=speedVal;},SPEED_STEP,fmtSpeed,BTN_CTRL_STYLE);
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
        settingsPanel.append(resumeRow,autoEpRow,autoPlayRow,seekRow,speedRow,globalRow);
        return{settingsPanel,resumeToggle,autoEpToggle,autoPlayToggle,globalToggle,seekSecs:()=>seekSecs,speedVal:()=>speedVal,updateSeekVal,updateSpeedVal};
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
        const startSaving=()=>{if(saveTimer)return;saveTimer=setInterval(()=>{if(!isResumeOn()||!isFinite(video.currentTime)||video.currentTime<=RESUME_MIN_POS)return;lsSet(myResumeKey(),String(video.currentTime));lsSet(myResumeTs(),String(Date.now()));},SAVE_INTERVAL_MS);};
        const stopSaving=()=>{clearInterval(saveTimer);saveTimer=null;};
        _stopSavingFn=stopSaving;
        video.addEventListener('play',startSaving);
        video.addEventListener('pause',stopSaving);
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
        });
        video.addEventListener('progress',()=>{if(!video.duration||!video.buffered.length)return;seekBuf.style.width=(video.buffered.end(video.buffered.length-1)/video.duration*100)+'%';});
        return{seekWrap,seekFill,seekThumb,seekBuf,isSeeking:()=>seeking};
    }

    // ── Shared: initVideo ─────────────────────────────────────────────────────
    function initVideo(videoUrl){
        const{vol,muted}=loadVol();
        const video=mk('video','aw-np-video');
        video.autoplay=false;video.preload='metadata';video.src=videoUrl;video.volume=vol;video.muted=muted;video.playbackRate=loadSpeed();
        const _play=()=>video.play().catch(()=>{});
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
    };

    // ── Stili desktop ─────────────────────────────────────────────────────────
    function injectStyleDesktop(){
        if(document.getElementById('aw-np-style'))return;
        const s=document.createElement('style');s.id='aw-np-style';
        s.textContent=`
            #player{background:#000}*,*::before,*::after{box-sizing:border-box}*:focus{outline:none!important}button{-webkit-tap-highlight-color:transparent}
            #aw-np{position:relative;width:100%;height:100%;background:#000;display:flex;flex-direction:column;overflow:hidden;font-family:'Google Sans',Roboto,'Helvetica Neue',sans-serif;user-select:none;touch-action:pan-x pan-y}
            #aw-np-video{flex:1;width:100%;min-height:0;display:block;background:#000;cursor:none}
            #aw-np.ui #aw-np-video{cursor:pointer}
            .np-grad{position:absolute;left:0;right:0;height:160px;pointer-events:none;opacity:0;transition:opacity .35s cubic-bezier(.4,0,.2,1)}
            #aw-np.ui .np-grad{opacity:1}
            #aw-np-gradient{bottom:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            #aw-np-gradient-top{top:0;background:linear-gradient(to bottom,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            .np-ui-layer{opacity:0;transition:opacity .35s cubic-bezier(.4,0,.2,1);pointer-events:none}
            #aw-np.ui .np-ui-layer{opacity:1;pointer-events:all}
            #aw-np-top{position:absolute;top:0;left:0;right:0;height:clamp(64px,8vh,90px);display:flex;align-items:flex-start;justify-content:space-between;padding:clamp(12px,1.8vh,18px) 16px}
            #aw-np-top-left{display:flex;flex-direction:column;gap:2px;overflow:hidden}
            #aw-np-title{font-size:clamp(22px,3.15vh,30px);font-weight:500;letter-spacing:.01em;color:var(--np-accent-bg-fg,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:clamp(120px,35vw,400px);text-shadow:0 1px 3px rgba(0,0,0,.8),0 0 12px rgba(0,0,0,.6)}
            #aw-np-epinfo{font-size:clamp(18px,2.4vh,22px);font-weight:400;letter-spacing:.02em;color:var(--np-accent-bg-fg,rgba(255,255,255,.7));opacity:.8;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-top-right{display:flex;align-items:center;gap:14px;flex-shrink:0}
            #aw-np-brand{font-size:clamp(16px,2.1vh,19px);font-weight:500;letter-spacing:.04em;color:var(--np-accent-bg-fg,rgba(255,255,255,.5));opacity:.6;white-space:nowrap;line-height:1;text-shadow:0 1px 3px rgba(0,0,0,.8);text-transform:uppercase}
            #aw-np-dot{width:10px;height:10px;border-radius:50%;background:var(--np-accent,#fff);cursor:pointer;flex-shrink:0;transition:transform .2s cubic-bezier(.4,0,.2,1),box-shadow .2s;position:relative;top:-1px;box-shadow:0 0 0 0 var(--np-accent-dim,rgba(255,255,255,.3))}
            #aw-np-dot:hover{transform:scale(1.4);box-shadow:0 0 0 4px var(--np-accent-dim,rgba(255,255,255,.15))}
            #aw-np-dot:hover .np-tip{opacity:1;transition-delay:.3s}
            #aw-np-dot .np-tip{bottom:auto;top:calc(100% + 10px);left:auto;right:0;transform:none}
            #aw-np-dot .np-tip::after{top:auto;bottom:100%;left:auto;right:5px;transform:none;border-top-color:transparent;border-bottom-color:rgba(30,30,30,.97)}
            #aw-np-color-panel{position:absolute;top:clamp(64px,8vh,90px);right:12px;background:var(--np-accent-bg,#000);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px;font-size:13px;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:11;opacity:0;transform:scale(.9) translateY(-8px);transform-origin:top right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3)}
            #aw-np-color-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            #aw-np-color-swatches{display:flex;flex-wrap:wrap;gap:8px;width:162px}
            .np-swatch{width:26px;height:26px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .2s cubic-bezier(.4,0,.2,1),border-color .15s,box-shadow .2s;flex-shrink:0}
            .np-swatch:hover{transform:scale(1.25);box-shadow:0 2px 8px rgba(0,0,0,.4)}
            .np-swatch.active{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}
            .np-swatch:hover{transform:scale(1.25);box-shadow:0 2px 8px rgba(0,0,0,.4)}
            #aw-np-controls{position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;padding:0 6px 6px}
            #aw-np-seek-wrap{height:44px;display:flex;align-items:center;cursor:pointer;padding:0 4px;touch-action:none}
            #aw-np-seek-track{position:relative;width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,.2);transition:height .15s cubic-bezier(.4,0,.2,1)}
            #aw-np-seek-wrap:hover #aw-np-seek-track{height:6px}
            #aw-np-seek-buf{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent-dim,rgba(255,255,255,.5));width:0;opacity:.6}
            #aw-np-seek-fill{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent,#fff);width:0;transition:background .2s}
            #aw-np-seek-thumb{position:absolute;top:50%;left:0;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;transform:translate(-50%,-50%) scale(0);transition:transform .15s cubic-bezier(.4,0,.2,1),box-shadow .15s;box-shadow:0 2px 6px rgba(0,0,0,.4)}
            #aw-np-seek-wrap:hover #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1)}
            #aw-np-seek-wrap.seeking #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1.2)}
            #aw-np-seek-tip{position:absolute;bottom:calc(100% + 10px);left:0;transform:translateX(-50%);background:var(--np-accent-bg,#282828);color:var(--np-accent-bg-fg,#fff);font-size:12px;font-weight:500;padding:4px 8px;border-radius:6px;pointer-events:none;white-space:nowrap;visibility:hidden;box-shadow:0 2px 8px rgba(0,0,0,.4);letter-spacing:.02em}
            #aw-np-bar{display:flex;align-items:center;height:clamp(40px,5.5vh,56px);gap:0}
            .np-icon{display:contents}
            .np-btn{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;width:clamp(36px,4.5vh,52px);height:clamp(36px,4.5vh,52px);background:none;border:none;cursor:pointer;color:var(--np-accent-bg-fg,rgba(255,255,255,.75));padding:0;flex-shrink:0;border-radius:50%;transition:color .2s cubic-bezier(.4,0,.2,1),background .2s}
            .np-btn:hover{color:var(--np-accent-bg-fg,#fff);background:var(--np-accent-state-1,rgba(255,255,255,.1))}
            .np-btn:active{background:var(--np-accent-state-2,rgba(255,255,255,.18))}
            .np-btn svg{display:block;fill:currentColor;flex-shrink:0;width:clamp(20px,2.8vh,30px);height:clamp(20px,2.8vh,30px);transition:transform .2s cubic-bezier(.4,0,.2,1)}
            #aw-np:fullscreen .np-btn svg,#aw-np:-webkit-full-screen .np-btn svg{width:clamp(24px,3.36vh,36px);height:clamp(24px,3.36vh,36px)}
            .np-btn:active svg{transform:scale(.88)}
            .np-btn svg line{stroke:currentColor}
            .accent-icons .np-btn{color:var(--np-accent,#fff)}
            .accent-icons .np-btn svg{fill:var(--np-accent,#fff)}
            .accent-icons .np-btn svg line{stroke:var(--np-accent,#fff)}
            .accent-top #aw-np-title{color:var(--np-accent,#fff)}
            .accent-top #aw-np-epinfo{color:var(--np-accent,#fff);opacity:.75}
            .accent-top #aw-np-brand{color:var(--np-accent,#fff);opacity:.5}
            .np-ripple{position:absolute;border-radius:50%;background:var(--np-accent-state-1,rgba(255,255,255,.3));transform:scale(0);animation:np-ripple .4s cubic-bezier(.4,0,.2,1);pointer-events:none}
            @keyframes np-ripple{to{transform:scale(2.5);opacity:0}}
            #aw-np-time{font-size:clamp(11px,1.4vh,14px);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));letter-spacing:.04em;white-space:nowrap;padding:0 6px;font-variant-numeric:tabular-nums;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-spacer{flex:1}
            #aw-np-vol-group{position:relative;display:flex;align-items:center}
            #aw-np-vol-group::after{content:'';position:absolute;bottom:100%;left:-8px;right:-8px;height:calc(44px + 8px + 12px);pointer-events:none}
            #aw-np-vol-group:hover::after{pointer-events:all}
            #aw-np-vol-popup{position:absolute;bottom:calc(clamp(40px,5.5vh,56px) + 44px + 8px);left:50%;transform:translateX(-50%);width:44px;height:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;transition:height .25s cubic-bezier(.4,0,.2,1),padding .25s cubic-bezier(.4,0,.2,1);padding:0}
            #aw-np-vol-group:hover #aw-np-vol-popup,#aw-np-vol-group:focus-within #aw-np-vol-popup{height:148px;padding:10px 0 12px;background:var(--np-accent-bg,#1c1c1c);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.4)}
            #aw-np-vol-pct{font-size:12px;font-weight:500;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));width:32px;text-align:center;font-variant-numeric:tabular-nums;flex-shrink:0;display:block;letter-spacing:.02em;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-vol{-webkit-appearance:none;appearance:none;width:4px;height:108px;border-radius:2px;background:rgba(255,255,255,.2);cursor:pointer;outline:none;writing-mode:vertical-lr;direction:rtl;transition:background .15s}
            #aw-np-vol::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4);transition:transform .15s cubic-bezier(.4,0,.2,1)}
            #aw-np-vol:hover::-webkit-slider-thumb{transform:scale(1.2)}
            #aw-np-vol::-moz-range-thumb{width:14px;height:14px;background:var(--np-accent,#fff);border:none;border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4)}
            #aw-np-settings-panel{position:absolute;bottom:calc(clamp(40px,5.5vh,56px) + 44px + 8px);right:12px;background:var(--np-accent-bg,#000);border-radius:12px;padding:14px 18px;min-width:230px;display:flex;flex-direction:column;gap:10px;font-size:13px;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:10;opacity:0;transform:scale(.9) translateY(8px);transform-origin:bottom right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3)}
            #aw-np-settings-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            .np-switch{position:relative;width:36px;height:20px;flex-shrink:0;cursor:pointer}
            .np-switch input{opacity:0;width:0;height:0;position:absolute}
            .np-switch-track{position:absolute;inset:0;border-radius:10px;background:rgba(255,255,255,.2);transition:background .2s cubic-bezier(.4,0,.2,1)}
            .np-switch input:checked~.np-switch-track{background:var(--np-accent,#fff)}
            .np-switch-thumb{position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 4px rgba(0,0,0,.3)}
            .np-switch input:checked~.np-switch-thumb{transform:translateX(16px)}
            .np-switch input:not(:checked)~.np-switch-thumb{background:rgba(255,255,255,.8)}
            .np-tip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(30,30,30,.97);color:rgba(255,255,255,.92);font-size:12px;font-weight:500;padding:5px 10px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s cubic-bezier(.4,0,.2,1);z-index:20;box-shadow:0 2px 8px rgba(0,0,0,.4)}
            .np-tip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:rgba(30,30,30,.97)}
            .np-btn:hover .np-tip{opacity:1;transition-delay:.4s}
            .np-row-tip{position:absolute;top:50%;right:calc(100% + 14px);transform:translateY(-50%);background:var(--np-accent-bg,#000);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:12px;line-height:1.5;padding:6px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s cubic-bezier(.4,0,.2,1);transition-delay:0s;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4)}
            .np-row-tip::after{content:'';position:absolute;top:50%;left:100%;transform:translateY(-50%);border:5px solid transparent;border-left-color:var(--np-accent-bg,#000)}
            [data-tip]:hover .np-row-tip{opacity:1;transition-delay:.5s}
            #aw-np-toast{position:absolute;bottom:calc(clamp(40px,5.5vh,56px) + 44px + 16px);left:50%;transform:translateX(-50%);background:color-mix(in srgb,var(--np-accent-bg,#282828) 80%,transparent);color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-size:13px;font-weight:500;letter-spacing:.02em;padding:7px 16px;border-radius:24px;pointer-events:none;white-space:nowrap;opacity:1;transition:opacity .4s cubic-bezier(.4,0,.2,1);z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4)}
            #aw-np-spinner{position:absolute;top:50%;left:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border:3px solid rgba(255,255,255,.12);border-top-color:var(--np-accent,#fff);border-radius:50%;animation:np-spin .65s linear infinite;pointer-events:none;display:none}
            #aw-np-spinner.on{display:block}
            @keyframes np-spin{to{transform:rotate(360deg)}}
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

    // ── Build player desktop ──────────────────────────────────────────────────
    let cleanup=null;
    function buildPlayerDesktop(videoUrl){
        const{video,vol,muted,_play}=initVideo(videoUrl);
        const wrap=mk('div','aw-np');
        const grad=mk('div','aw-np-gradient');grad.classList.add('np-grad');
        const gradTop=mk('div','aw-np-gradient-top');gradTop.classList.add('np-grad');
        const spinner=mk('div','aw-np-spinner');
        const center=mk('div','aw-np-center');center.classList.add('np-flash-circle');center.innerHTML=IC.play;
        const ctrls=mk('div','aw-np-controls');ctrls.classList.add('np-ui-layer');
        const SEP='border-top:1px solid var(--np-accent-state-1,rgba(255,255,255,.12));padding-top:10px;';
        const timeEl=mk('div','aw-np-time');timeEl.textContent='00:00 / 00:00';
        const{seekWrap,isSeeking}=buildSeekBar(video,true,()=>{timeEl.textContent=fmt(video.currentTime)+' / '+fmt(video.duration);});
        const{settingsPanel,resumeToggle,autoEpToggle,autoPlayToggle,globalToggle,seekSecs:getSeekSecs,updateSeekVal,updateSpeedVal}=buildSettingsPanel(video,SEP,'Secondi saltati con le freccette.');
        let seekSecs=getSeekSecs(),speedVal=loadSpeed();
        const{colorPanel,syncCustomInput,updateSwatches,topColorToggle,iconColorToggle,flashToggle,colorGlobalToggle}=buildColorPanel(wrap,null,SEP);
        let currentColor=loadColor();
        const{topBar,dotEl}=buildTopBar(wrap,colorPanel);
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
        const volFlash=mk('div','aw-np-vol-flash');volFlash.classList.add('np-flash-circle');
        const volFlashIco=mk('div','aw-np-vol-flash-icon');volFlash.appendChild(volFlashIco);
        let volFlashTimer=null;
        const showVolFlash=dir=>{if(!isFlashOn())return;const m=video.muted||video.volume===0;volFlashIco.innerHTML=m?IC.mute:(dir==='down'?IC.volDown:IC.vol);volFlash.classList.add('on');clearTimeout(volFlashTimer);volFlashTimer=setTimeout(()=>volFlash.classList.remove('on'),400);};
        volEl.addEventListener('input',()=>{const v=Number(volEl.value)/100;video.volume=v;video.muted=v===0;if(v>0)lastNonZeroVol=v;updateMuteState();updateVolUi();saveVol(v===0?lastNonZeroVol:v,video.muted);});
        volEl.addEventListener('pointerup',()=>volEl.blur());
        btnMute.addEventListener('click',()=>{if(video.muted||video.volume===0){video.muted=false;video.volume=lastNonZeroVol;volEl.value=Math.round(video.volume*100);}else{if(video.volume>0)lastNonZeroVol=video.volume;video.muted=true;volEl.value=0;}updateMuteState();updateVolUi();saveVol(video.muted?lastNonZeroVol:video.volume,video.muted);showVolFlash(video.muted?'down':'up');});
        const bar=mk('div','aw-np-bar');
        bar.append(btnPlay,btnRestart,volGroup,timeEl,mk('div','aw-np-spacer'),btnUndo,btnSkip,btnPrev,btnNext,btnSettings,btnPip,btnFs);
        ctrls.append(seekWrap,bar);
        btnSettings.addEventListener('click',e=>{e.stopPropagation();const was=settingsPanel.classList.contains('open');colorPanel.classList.remove('open');settingsPanel.classList.toggle('open',!was);});
        settingsPanel.addEventListener('click',e=>e.stopPropagation());
        dotEl.addEventListener('click',e=>{e.stopPropagation();const was=colorPanel.classList.contains('open');settingsPanel.classList.remove('open');colorPanel.classList.toggle('open',!was);});
        colorPanel.addEventListener('click',e=>e.stopPropagation());
        wrap.addEventListener('click',()=>{settingsPanel.classList.remove('open');colorPanel.classList.remove('open');});
        wrap.append(video,grad,gradTop,topBar,colorPanel,spinner,center,settingsPanel,ctrls,volFlash);
        applyColor(currentColor,wrap,dotEl);
        let hideTimer=null;
        const showUi=()=>{wrap.classList.add('ui');clearTimeout(hideTimer);if(!video.paused)hideTimer=setTimeout(()=>wrap.classList.remove('ui'),HIDE_DELAY_MS);};
        wrap.addEventListener('pointermove',showUi);wrap.addEventListener('pointerleave',()=>{if(!video.paused)wrap.classList.remove('ui');});
        video.addEventListener('pause',()=>{wrap.classList.add('ui');clearTimeout(hideTimer);});video.addEventListener('play',showUi);
        let skipFlash=false,cTimer=null;
        const flash=html=>{if(!isFlashOn())return;center.innerHTML=html;center.classList.add('on');clearTimeout(cTimer);cTimer=setTimeout(()=>center.classList.remove('on'),700);};
        const flashBrief=html=>{if(!isFlashOn())return;center.innerHTML=html;center.classList.add('on');clearTimeout(cTimer);cTimer=setTimeout(()=>center.classList.remove('on'),400);};
        [btnPlay,btnRestart,btnMute,btnUndo,btnSkip,btnPrev,btnNext,btnSettings,btnPip,btnFs].forEach(addRipple);
        const toggle=()=>video.paused?_play():video.pause();
        video.addEventListener('click',toggle);video.addEventListener('dblclick',()=>btnFs.click());btnPlay.addEventListener('click',toggle);
        video.addEventListener('play',()=>{setIcon(icoPlay,IC.pause);setTip(btnPlay,'Pausa');if(!skipFlash)flash(IC.pause);});
        video.addEventListener('pause',()=>{setIcon(icoPlay,IC.play);setTip(btnPlay,'Riproduci');if(!skipFlash)flash(IC.play);});
        video.addEventListener('ended',()=>{setIcon(icoPlay,IC.play);setTip(btnPlay,'Riproduci');});
        btnRestart.addEventListener('click',()=>{video.currentTime=0;_play();flash(IC.restart);});
        btnSkip.addEventListener('click',()=>{video.currentTime=Math.min(video.duration||0,video.currentTime+SKIP_SECONDS);flash(IC.skip);});
        btnUndo.addEventListener('click',()=>{video.currentTime=Math.max(0,video.currentTime-SKIP_SECONDS);flash(IC.undo);});
        btnPrev.addEventListener('click',()=>{const t=getAdjacentEpisode('prev');if(t){flash(IC.prev);loadEpisode(t.dataset.id);}});
        btnNext.addEventListener('click',()=>{const t=getAdjacentEpisode('next');if(t){flash(IC.next);loadEpisode(t.dataset.id);}});
        btnPip.addEventListener('click',()=>pipElement()?pipExit():pipRequest(video));
        video.addEventListener('enterpictureinpicture',()=>{setTip(btnPip,'Chiudi PiP');wrap.style.visibility='hidden';});
        video.addEventListener('leavepictureinpicture',()=>{setTip(btnPip,'Picture in Picture');wrap.style.visibility='';});
        btnFs.addEventListener('click',()=>fsElement()?fsExit():fsRequest(wrap));
        video.addEventListener('waiting',()=>spinner.classList.add('on'));video.addEventListener('playing',()=>spinner.classList.remove('on'));video.addEventListener('canplay',()=>spinner.classList.remove('on'));
        const{showResumeToast,stopSaving,episodeEnded}=buildResumeLogic(video,wrap,()=>speedVal);
        const onFs=()=>{const isFs=!!fsElement();setIcon(icoFs,isFs?IC.fsOff:IC.fsOn);setTip(btnFs,isFs?'Esci (F)':'Fullscreen (F)');if(isFs&&isAutoPlayOn()&&video.paused&&!episodeEnded())_play();};
        const onKey=e=>{if(pipElement())return;const tag=document.activeElement?.tagName??'',editable=document.activeElement?.isContentEditable;if(/INPUT|TEXTAREA/.test(tag)||editable)return;if(e.key===' '){e.preventDefault();toggle();}if(e.key==='ArrowRight'){e.preventDefault();video.currentTime=Math.min(video.duration||0,video.currentTime+seekSecs);flashBrief(IC.seekFwd);}if(e.key==='ArrowLeft'){e.preventDefault();video.currentTime=Math.max(0,video.currentTime-seekSecs);flashBrief(IC.seekBwd);}if(e.key==='ArrowUp'){e.preventDefault();video.volume=Math.min(1,video.volume+.1);video.muted=false;lastNonZeroVol=video.volume;volEl.value=Math.round(video.volume*100);saveVol(video.volume,false);updateMuteState();updateVolUi();showVolFlash('up');}if(e.key==='ArrowDown'){e.preventDefault();video.volume=Math.max(0,video.volume-.1);video.muted=video.volume===0;if(video.volume>0)lastNonZeroVol=video.volume;volEl.value=Math.round(video.volume*100);saveVol(video.muted?lastNonZeroVol:video.volume,video.muted);updateMuteState();updateVolUi();showVolFlash('down');}if(e.key==='f'||e.key==='F')btnFs.click();if(e.key==='m'||e.key==='M')btnMute.click();if(e.key==='r'||e.key==='R')btnRestart.click();if(e.key==='o'||e.key==='O')btnSkip.click();if(e.key==='b'||e.key==='B')btnUndo.click();if(e.key==='p'||e.key==='P')btnPrev.click();if(e.key==='n'||e.key==='N')btnNext.click();};
        const onStorage=e=>{if(!e.key?.startsWith('aw-np-'))return;resumeToggle.checked=isResumeOn();autoEpToggle.checked=isAutoEpOn();autoPlayToggle.checked=isAutoPlayOn();globalToggle.checked=isGlobalOn();seekSecs=getSeekSecs();updateSeekVal();speedVal=loadSpeed();updateSpeedVal();const newColor=loadColor();if(newColor!==currentColor){currentColor=newColor;applyColor(currentColor,wrap,dotEl);syncCustomInput(currentColor);updateSwatches(currentColor);}const iconOn=isIconColorOn();wrap.classList.toggle('accent-icons',iconOn);iconColorToggle.checked=iconOn;const topOn=isTopColorOn();wrap.classList.toggle('accent-top',topOn);topColorToggle.checked=topOn;flashToggle.checked=isFlashOn();colorGlobalToggle.checked=isColorGlobalOn();};
        const onUnload=()=>{if(!episodeEnded())saveResumePos(video.currentTime);};
        const removeFs=fsChange(onFs);
        document.addEventListener('keydown',onKey);window.addEventListener('beforeunload',onUnload);window.addEventListener('storage',onStorage);
        cleanup=()=>{removeFs();document.removeEventListener('keydown',onKey);window.removeEventListener('beforeunload',onUnload);window.removeEventListener('storage',onStorage);stopSaving();_stopSavingFn=null;clearTimeout(hideTimer);clearTimeout(cTimer);clearTimeout(volFlashTimer);skipFlash=true;video.pause();video.src='';cleanup=null;};
        wrap._play=()=>_play();wrap._showResumeTst=s=>showResumeToast(s);wrap._setSkipFlash=v=>{skipFlash=v;};
        return wrap;
    }

    // ── Mount (windowed) ──────────────────────────────────────────────────────
    function mountPlayer(url){
        if(!url)return;const container=document.querySelector('#player');if(!container)return;
        const existing=container.querySelector('#aw-np-video');
        if(existing&&existing.getAttribute('src')===url)return;
        if(cleanup)cleanup();injectStyle();container.innerHTML='';container.appendChild(buildPlayer(url));
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
            #aw-np{position:relative;width:100%;height:100%;background:#000;display:flex;flex-direction:column;font-family:'Google Sans',Roboto,'Helvetica Neue',sans-serif;user-select:none;touch-action:pan-y}
            #aw-np-video{flex:1;width:100%;min-height:0;display:block;background:#000}
            .np-grad{position:absolute;left:0;right:0;height:140px;pointer-events:none;opacity:0;transition:opacity .3s cubic-bezier(.4,0,.2,1)}
            #aw-np.ui .np-grad{opacity:1}
            #aw-np-gradient{bottom:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            #aw-np-gradient-top{top:0;background:linear-gradient(to bottom,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
            .np-ui-layer{opacity:0;transition:opacity .3s cubic-bezier(.4,0,.2,1);pointer-events:none}
            #aw-np.ui .np-ui-layer{opacity:1;pointer-events:all}
            #aw-np-top{position:absolute;top:0;left:0;right:0;height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 14px}
            #aw-np-top-left{display:flex;flex-direction:column;gap:1px;overflow:hidden;flex:1}
            #aw-np-title{font-size:15px;font-weight:500;color:var(--np-accent-bg-fg,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-epinfo{font-size:12px;font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.7));opacity:.8;text-shadow:0 1px 3px rgba(0,0,0,.8)}
            #aw-np-top-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
            #aw-np-dot{width:10px;height:10px;border-radius:50%;background:var(--np-accent,#fff);cursor:pointer;flex-shrink:0;transition:transform .2s cubic-bezier(.4,0,.2,1);position:relative}
            #aw-np-color-panel{position:absolute;top:52px;right:12px;background:var(--np-accent-bg,#000);border-radius:12px;padding:clamp(10px,2vw,14px);display:flex;flex-direction:column;gap:clamp(8px,1.5vw,12px);font-size:clamp(11px,1.8vw,13px);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:25;opacity:0;transform:scale(.9) translateY(-8px);transform-origin:top right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5);max-height:calc(100% - 110px);overflow-y:auto}
            #aw-np-color-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            #aw-np-color-swatches{display:flex;flex-wrap:wrap;gap:clamp(6px,1.2vw,8px);width:clamp(150px,30vw,184px)}
            .np-swatch{width:clamp(24px,4.5vw,30px);height:clamp(24px,4.5vw,30px);border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .2s cubic-bezier(.4,0,.2,1),border-color .15s,box-shadow .2s;flex-shrink:0}
            .np-swatch.active{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25)}
            .np-swatch:hover{transform:scale(1.25);box-shadow:0 2px 8px rgba(0,0,0,.4)}
            #aw-np-controls{position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;padding:0 6px 6px}
            #aw-np-seek-wrap{height:30px;display:flex;align-items:center;cursor:pointer;padding:0 4px;touch-action:none}
            #aw-np-seek-track{position:relative;width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,.2)}
            #aw-np-seek-buf{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent-dim,rgba(255,255,255,.5));width:0;opacity:.6}
            #aw-np-seek-fill{position:absolute;inset:0;border-radius:inherit;background:var(--np-accent,#fff);width:0}
            #aw-np-seek-thumb{position:absolute;top:50%;left:0;width:16px;height:16px;background:var(--np-accent,#fff);border-radius:50%;transform:translate(-50%,-50%) scale(0);transition:transform .15s cubic-bezier(.4,0,.2,1);box-shadow:0 2px 6px rgba(0,0,0,.4)}
            #aw-np-seek-wrap:active #aw-np-seek-thumb,#aw-np-seek-wrap.seeking #aw-np-seek-thumb{transform:translate(-50%,-50%) scale(1.2)}
            #aw-np-bar{display:flex;align-items:center;height:48px;gap:0}
            #aw-np-spacer{flex:1}
            .np-icon{display:contents}
            .np-btn{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;min-width:40px;height:40px;background:none;border:none;cursor:pointer;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));padding:0;flex-shrink:0;border-radius:50%}
            .np-btn:active{background:var(--np-accent-state-2,rgba(255,255,255,.18))}
            .np-btn svg{display:block;fill:currentColor;flex-shrink:0;width:22px;height:22px;transition:transform .2s cubic-bezier(.4,0,.2,1)}
            .np-btn:active svg{transform:scale(.88)}
            .np-btn svg line{stroke:currentColor}
            .accent-icons .np-btn{color:var(--np-accent,#fff)}
            .accent-icons .np-btn svg{fill:var(--np-accent,#fff)}
            .accent-icons .np-btn svg line{stroke:var(--np-accent,#fff)}
            .accent-top #aw-np-title{color:var(--np-accent,#fff)}
            .accent-top #aw-np-epinfo{color:var(--np-accent,#fff);opacity:.75}
            #aw-np-brand{font-size:13px;font-weight:500;letter-spacing:.04em;color:var(--np-accent-bg-fg,rgba(255,255,255,.5));opacity:.6;white-space:nowrap;line-height:1;text-transform:uppercase}
            .accent-top #aw-np-brand{color:var(--np-accent,#fff);opacity:.5}
            @media (orientation:landscape){#aw-np-bar{height:clamp(40px,5.5vh,56px)}.np-btn{width:clamp(36px,4.5vh,52px);height:clamp(36px,4.5vh,52px);min-width:unset}.np-btn svg{width:clamp(20px,2.8vh,30px);height:clamp(20px,2.8vh,30px)}}
            .np-ripple{position:absolute;border-radius:50%;background:var(--np-accent-state-1,rgba(255,255,255,.3));transform:scale(0);animation:np-ripple .4s cubic-bezier(.4,0,.2,1);pointer-events:none}
            @keyframes np-ripple{to{transform:scale(2.5);opacity:0}}
            #aw-np-time{font-size:12px;font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));letter-spacing:.03em;white-space:nowrap;padding:0 4px;font-variant-numeric:tabular-nums}
            #aw-np-menu-panel{position:absolute;bottom:calc(48px + 30px + 8px);right:8px;background:var(--np-accent-bg,#282828);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:2px;z-index:25;opacity:0;transform:scale(.9) translateY(8px);transform-origin:bottom right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5);max-height:calc(100% - 120px);overflow-y:auto}
            #aw-np-menu-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            .np-menu-btn{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px;border:none;background:none;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:14px;cursor:pointer;width:100%;text-align:left}
            .np-menu-btn:active{background:var(--np-accent-state-2,rgba(255,255,255,.18))}
            .np-menu-btn svg{fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));width:22px;height:22px;flex-shrink:0}
            .np-menu-btn span{display:block}
            @media (orientation:portrait){#aw-np-menu-panel{flex-direction:row;padding:4px}.np-menu-btn{padding:8px;width:auto;gap:0}.np-menu-btn span{display:none}}
            #aw-np-settings-panel{position:absolute;bottom:calc(48px + 30px + 8px);right:8px;background:var(--np-accent-bg,#000);border-radius:12px;padding:clamp(10px,2vw,14px) clamp(12px,2.5vw,18px);min-width:clamp(190px,40vw,230px);display:flex;flex-direction:column;gap:clamp(7px,1.5vw,10px);font-size:clamp(11px,1.8vw,13px);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:25;opacity:0;transform:scale(.9) translateY(8px);transform-origin:bottom right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5);max-height:calc(100% - 120px);overflow-y:auto}
            #aw-np-settings-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:all}
            .np-switch{position:relative;width:36px;height:20px;flex-shrink:0;cursor:pointer}
            .np-switch input{opacity:0;width:0;height:0;position:absolute}
            .np-switch-track{position:absolute;inset:0;border-radius:10px;background:rgba(255,255,255,.2);transition:background .2s cubic-bezier(.4,0,.2,1)}
            .np-switch input:checked~.np-switch-track{background:var(--np-accent,#fff)}
            .np-switch-thumb{position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 4px rgba(0,0,0,.3)}
            .np-switch input:checked~.np-switch-thumb{transform:translateX(16px)}
            .np-switch input:not(:checked)~.np-switch-thumb{background:rgba(255,255,255,.8)}
            .np-row-tip{position:absolute;top:50%;right:calc(100% + 14px);transform:translateY(-50%);background:var(--np-accent-bg,#000);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:12px;line-height:1.5;padding:6px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4)}
            .np-row-tip::after{content:'';position:absolute;top:50%;left:100%;transform:translateY(-50%);border:5px solid transparent;border-left-color:var(--np-accent-bg,#000)}
            [data-tip]:hover .np-row-tip{opacity:1;transition-delay:.5s}
            #aw-np-toast{position:absolute;bottom:calc(48px + 30px + 16px);left:50%;transform:translateX(-50%);background:color-mix(in srgb,var(--np-accent-bg,#282828) 80%,transparent);color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-size:13px;font-weight:500;padding:7px 16px;border-radius:24px;pointer-events:none;white-space:nowrap;opacity:1;transition:opacity .4s cubic-bezier(.4,0,.2,1);z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4)}
            #aw-np-spinner{position:absolute;top:50%;left:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border:3px solid rgba(255,255,255,.12);border-top-color:var(--np-accent,#fff);border-radius:50%;animation:np-spin .65s linear infinite;pointer-events:none;display:none}
            #aw-np-spinner.on{display:block}
            @keyframes np-spin{to{transform:rotate(360deg)}}
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
        const wrap=mk('div','aw-np');
        const grad=mk('div','aw-np-gradient');grad.classList.add('np-grad');
        const gradTop=mk('div','aw-np-gradient-top');gradTop.classList.add('np-grad');
        const spinner=mk('div','aw-np-spinner');
        const center=mk('div','aw-np-center');center.classList.add('np-flash-circle');center.innerHTML=IC.play;
        const ctrls=mk('div','aw-np-controls');ctrls.classList.add('np-ui-layer');

        const timeEl=mk('div','aw-np-time');timeEl.textContent='00:00 / 00:00';
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
        bar.append(btnPlay,btnRestart,btnMute,timeEl,spacer,btnUndo,btnSkip,btnPrev,btnNext,btnMenu,btnSettings,btnPip,btnFs);
        ctrls.append(seekWrap,bar);

        const menuPanel=mk('div','aw-np-menu-panel');
        const mkMenuBtn=(html,label,onClick)=>{const b=document.createElement('button');b.className='np-menu-btn';b.innerHTML=html+`<span>${label}</span>`;b.addEventListener('click',()=>{menuPanel.classList.remove('open');onClick();});return b;};
        menuPanel.append(
            mkMenuBtn(IC.restart,'Ricomincia',()=>{video.currentTime=0;_play();flash(IC.restart);}),
            mkMenuBtn(IC.undo,'Annulla skip',()=>{video.currentTime=Math.max(0,video.currentTime-SKIP_SECONDS);flash(IC.undo);}),
            mkMenuBtn(IC.skip,'Skip OP/ED',()=>{video.currentTime=Math.min(video.duration||0,video.currentTime+SKIP_SECONDS);flash(IC.skip);}),
            mkMenuBtn(IC.prev,'Episodio prec.',()=>{const t=getAdjacentEpisode('prev');if(t){flash(IC.prev);loadEpisode(t.dataset.id);}}),
            mkMenuBtn(IC.next,'Episodio succ.',()=>{const t=getAdjacentEpisode('next');if(t){flash(IC.next);loadEpisode(t.dataset.id);}})
        );

        const SEP='border-top:1px solid var(--np-accent-state-1,rgba(255,255,255,.12));padding-top:10px;';
        const{settingsPanel,resumeToggle,autoEpToggle,autoPlayToggle,seekSecs:getSeekSecs,speedVal:getSpeedVal,updateSeekVal,updateSpeedVal}=buildSettingsPanel(video,SEP,'Secondi saltati col doppio tap.');
        let seekSecs=getSeekSecs(),speedVal=getSpeedVal();

        const{colorPanel,syncCustomInput,updateSwatches,topColorToggle,iconColorToggle,flashToggle,colorGlobalToggle}=buildColorPanel(wrap,null,SEP);
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
            const pct=document.createElement('div');pct.style.cssText='font-size:12px;font-weight:500;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));width:32px;text-align:center;font-variant-numeric:tabular-nums;letter-spacing:.02em;';
            const track=document.createElement('div');track.style.cssText='position:relative;width:4px;flex:1;border-radius:2px;background:rgba(255,255,255,.2);flex-shrink:0;';
            const fill=document.createElement('div');fill.style.cssText='position:absolute;bottom:0;left:0;right:0;border-radius:2px;background:var(--np-accent,#fff);';
            track.appendChild(fill);inner.append(pct,track);return{inner,pct,fill};
        };
        const{inner:volInnerL,pct:volPctL,fill:volBarFillL}=mkVolBarInner();
        const{inner:volInnerR,pct:volPctR,fill:volBarFillR}=mkVolBarInner();
        volBarLeft.appendChild(volInnerL);volBarRight.appendChild(volInnerR);

        const volFlash=mk('div','aw-np-vol-flash');volFlash.classList.add('np-flash-circle');
        const volFlashIco=mk('div','aw-np-vol-flash-icon');volFlash.appendChild(volFlashIco);
        let volFlashTimer=null;
        const showVolFlash=dir=>{if(!isFlashOn())return;const m=video.muted||video.volume===0;volFlashIco.innerHTML=m?IC.mute:(dir==='down'?IC.volDown:IC.vol);volFlash.classList.add('on');clearTimeout(volFlashTimer);volFlashTimer=setTimeout(()=>volFlash.classList.remove('on'),400);};

        wrap.append(video,grad,gradTop,topBar,colorPanel,menuPanel,settingsPanel,spinner,center,playCenter,seekFlashLeft,seekFlashRight,volBarLeft,volBarRight,volFlash,ctrls);
        applyColor(currentColor,wrap,dotEl);

        let hideTimer=null;
        const toggle=()=>video.paused?_play():video.pause();
        const closepanels=()=>{settingsPanel.classList.remove('open');colorPanel.classList.remove('open');menuPanel.classList.remove('open');};
        const showUi=()=>{closepanels();wrap.classList.add('ui');clearTimeout(hideTimer);if(!video.paused)hideTimer=setTimeout(()=>wrap.classList.remove('ui'),HIDE_DELAY_MS);};
        const hideUi=()=>{wrap.classList.remove('ui');clearTimeout(hideTimer);};
        video.addEventListener('pause',()=>{wrap.classList.add('ui');clearTimeout(hideTimer);});
        video.addEventListener('play',showUi);

        let skipFlash=false,cTimer=null;
        const flash=html=>{if(!isFlashOn())return;center.innerHTML=html;center.classList.add('on');clearTimeout(cTimer);cTimer=setTimeout(()=>center.classList.remove('on'),700);};
        const flashBrief=html=>{if(!isFlashOn())return;center.innerHTML=html;center.classList.add('on');clearTimeout(cTimer);cTimer=setTimeout(()=>center.classList.remove('on'),400);};

        [btnPlay,btnMute,btnPip,btnSettings,btnMenu,btnFs].forEach(addRipple);
        btnPlay.addEventListener('click',toggle);
        playCenter.addEventListener('click',e=>{e.stopPropagation();toggle();});
        video.addEventListener('play',()=>{btnPlay.innerHTML=IC.pause;playCenter.innerHTML=IC.pause;});
        video.addEventListener('pause',()=>{btnPlay.innerHTML=IC.play;playCenter.innerHTML=IC.play;});
        video.addEventListener('ended',()=>{btnPlay.innerHTML=IC.play;playCenter.innerHTML=IC.play;});
        btnRestart.addEventListener('click',()=>{video.currentTime=0;_play();flash(IC.restart);});
        btnUndo.addEventListener('click',()=>{video.currentTime=Math.max(0,video.currentTime-SKIP_SECONDS);flash(IC.undo);});
        btnSkip.addEventListener('click',()=>{video.currentTime=Math.min(video.duration||0,video.currentTime+SKIP_SECONDS);flash(IC.skip);});
        btnPrev.addEventListener('click',()=>{const t=getAdjacentEpisode('prev');if(t){flash(IC.prev);loadEpisode(t.dataset.id);}});
        btnNext.addEventListener('click',()=>{const t=getAdjacentEpisode('next');if(t){flash(IC.next);loadEpisode(t.dataset.id);}});
        btnMute.addEventListener('click',()=>{if(video.muted||video.volume===0){video.muted=false;video.volume=vol||1;}else{video.muted=true;}btnMute.innerHTML=(video.muted||video.volume===0)?IC.mute:IC.vol;saveVol(video.muted?(vol||1):video.volume,video.muted);showVolFlash(video.muted?'down':'up');});
        btnPip.addEventListener('click',()=>pipElement()?pipExit():pipRequest(video));
        video.addEventListener('enterpictureinpicture',()=>{wrap.style.visibility='hidden';});
        video.addEventListener('leavepictureinpicture',()=>{wrap.style.visibility='';});
        let mobileFs=false;
        const setMobileFs=state=>{mobileFs=state;btnFs.innerHTML=state?IC.fsOff:IC.fsOn;if(state&&isAutoPlayOn()&&video.paused)_play();};
        btnFs.addEventListener('click',()=>{if(mobileFs){document.exitFullscreen?.()?.catch?.(()=>{});}else{wrap.requestFullscreen?.()?.catch?.(()=>{});}});
        const removeFsM=fsChange(()=>setMobileFs(!!document.fullscreenElement));
        btnSettings.addEventListener('click',e=>{e.stopPropagation();menuPanel.classList.remove('open');colorPanel.classList.remove('open');settingsPanel.classList.toggle('open',!settingsPanel.classList.contains('open'));});
        settingsPanel.addEventListener('click',e=>e.stopPropagation());
        btnMenu.addEventListener('click',e=>{e.stopPropagation();settingsPanel.classList.remove('open');colorPanel.classList.remove('open');menuPanel.classList.toggle('open',!menuPanel.classList.contains('open'));});
        menuPanel.addEventListener('click',e=>e.stopPropagation());
        dotEl.addEventListener('click',e=>{e.stopPropagation();settingsPanel.classList.remove('open');menuPanel.classList.remove('open');colorPanel.classList.toggle('open',!colorPanel.classList.contains('open'));});
        colorPanel.addEventListener('click',e=>e.stopPropagation());
        wrap.addEventListener('click',closepanels);
        video.addEventListener('waiting',()=>spinner.classList.add('on'));
        video.addEventListener('playing',()=>spinner.classList.remove('on'));
        video.addEventListener('canplay',()=>spinner.classList.remove('on'));
        let volBarTimer=null;
        const updateVolBars=()=>{const pct=(video.muted?0:video.volume)*100;const ps=Math.round(pct)+'%';volBarFillL.style.height=pct+'%';volBarFillR.style.height=pct+'%';volPctL.textContent=ps;volPctR.textContent=ps;};

        let volSliding=false,volSlideStartY=0,volSlideStartX=0,volSlideStartVol=0,volSlideEndTime=0;
        const isFullscreenLandscape=()=>window.innerWidth>window.innerHeight&&(!!document.fullscreenElement||window.innerHeight===screen.height||window.innerWidth===screen.width);
        video.addEventListener('touchstart',e=>{
            if(!isFullscreenLandscape())return;
            const touch=e.touches[0];
            if(touch.clientX<8||touch.clientX>window.innerWidth-8||touch.clientY<20)return;
            const rect=wrap.getBoundingClientRect(),x=touch.clientX-rect.left,quarter=rect.width/4;
            if(x<quarter||x>rect.width-quarter){volSliding=false;volSlideStartY=touch.clientY;volSlideStartX=touch.clientX;volSlideStartVol=video.muted?0:video.volume;}
        },{passive:true});
        video.addEventListener('touchmove',e=>{
            if(!isFullscreenLandscape())return;
            const touch=e.touches[0],rect=wrap.getBoundingClientRect(),x=touch.clientX-rect.left,quarter=rect.width/4;
            if(x>=quarter&&x<=rect.width-quarter)return;
            const dy=volSlideStartY-touch.clientY,dx=touch.clientX-volSlideStartX;
            if(!volSliding&&Math.abs(dx)>Math.abs(dy))return;
            if(!volSliding&&Math.abs(dy)<10)return;
            volSliding=true;
            const newVol=Math.max(0,Math.min(1,volSlideStartVol+dy/rect.height));
            video.volume=newVol;video.muted=newVol===0;
            btnMute.innerHTML=(video.muted||video.volume===0)?IC.mute:IC.vol;
            saveVol(newVol===0?(vol||1):newVol,newVol===0);
            updateVolBars();
            const slidingLeft=x<quarter;
            if(slidingLeft){volBarRight.style.opacity='1';volBarLeft.style.opacity='0';}
            else{volBarLeft.style.opacity='1';volBarRight.style.opacity='0';}
            clearTimeout(volBarTimer);
            volBarTimer=setTimeout(()=>{volBarLeft.style.opacity='0';volBarRight.style.opacity='0';},1500);
        },{passive:true});
        video.addEventListener('touchend',()=>{if(volSliding)volSlideEndTime=Date.now();volSliding=false;});
        video.addEventListener('touchcancel',()=>{if(volSliding)volSlideEndTime=Date.now();volSliding=false;});

        let tapTimer=null,lastTap=0;
        video.addEventListener('click',e=>{
            if(isSeeking())return;
            if(Date.now()-volSlideEndTime<300)return;
            const now=Date.now(),rect=wrap.getBoundingClientRect(),x=e.clientX-rect.left,quarter=rect.width/4;
            if(now-lastTap<300){
                clearTimeout(tapTimer);
                if(x<quarter){video.currentTime=Math.max(0,video.currentTime-seekSecs);flashBrief(IC.seekBwd);seekFlashLeft.classList.add('on');clearTimeout(seekFlashLeft._t);seekFlashLeft._t=setTimeout(()=>seekFlashLeft.classList.remove('on'),400);}
                else if(x>rect.width-quarter){video.currentTime=Math.min(video.duration||0,video.currentTime+seekSecs);flashBrief(IC.seekFwd);seekFlashRight.classList.add('on');clearTimeout(seekFlashRight._t);seekFlashRight._t=setTimeout(()=>seekFlashRight.classList.remove('on'),400);}
                lastTap=0;
            }else{tapTimer=setTimeout(()=>{if(wrap.classList.contains('ui'))hideUi();else showUi();},200);lastTap=now;}
        });

        const{showResumeToast,stopSaving,episodeEnded}=buildResumeLogic(video,wrap,getSpeedVal);
        const onStorage=e=>{
            if(!e.key?.startsWith('aw-np-'))return;
            resumeToggle.checked=isResumeOn();autoEpToggle.checked=isAutoEpOn();autoPlayToggle.checked=isAutoPlayOn();
            seekSecs=getSeekSecs();updateSeekVal();speedVal=getSpeedVal();updateSpeedVal();
            const newColor=loadColor();
            if(newColor!==currentColor){currentColor=newColor;applyColor(currentColor,wrap,dotEl);syncCustomInput(currentColor);updateSwatches(currentColor);}
            const iconOn=isIconColorOn();wrap.classList.toggle('accent-icons',iconOn);iconColorToggle.checked=iconOn;
            const topOn=isTopColorOn();wrap.classList.toggle('accent-top',topOn);topColorToggle.checked=topOn;
            flashToggle.checked=isFlashOn();colorGlobalToggle.checked=isColorGlobalOn();
        };
        const onUnload=()=>{if(!episodeEnded())saveResumePos(video.currentTime);};
        window.addEventListener('beforeunload',onUnload);
        window.addEventListener('storage',onStorage);
        cleanup=()=>{removeFsM();window.removeEventListener('beforeunload',onUnload);window.removeEventListener('storage',onStorage);stopSaving();_stopSavingFn=null;clearTimeout(hideTimer);clearTimeout(cTimer);clearTimeout(volFlashTimer);skipFlash=true;video.pause();video.src='';cleanup=null;};
        wrap._play=()=>_play();wrap._showResumeTst=s=>showResumeToast(s);wrap._setSkipFlash=v=>{skipFlash=v;};
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
            if(isAutoPlayOn()){wrap?._play();video.addEventListener('playing',()=>wrap?._setSkipFlash(false),{once:true});}else{wrap?._setSkipFlash(false);}
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
        // Aggiorna #player dataset
        const player=document.querySelector('#player');
        if(player){player.dataset.id=token;if(epData.episodeId)player.dataset.episodeId=epData.episodeId;if(epData.num)player.dataset.num=epData.num;}
        // Aggiorna numero episodio nel download link
        document.querySelectorAll('.episodeNum').forEach(el=>el.textContent=epData.num||epData.episodeNum||'');
        // Aggiorna download link tramite API AW
        if(epData.episodeId){
            fetch(`/api/episode/download?id=${epData.episodeId}`,{credentials:'same-origin'})
                .then(r=>r.ok?r.json():null)
                .then(data=>{
                    const dl=document.querySelector('#downloadLink');
                    if(dl&&data?.url)dl.href=data.url;
                })
                .catch(()=>{});
        }
        // Aggiorna commenti
        setTimeout(()=>{
            if(typeof loadEpisodeCommentsOnClick==='function'){
                const ep=document.querySelector('.episode a.active');
                if(ep)loadEpisodeCommentsOnClick(ep.dataset.num||ep.dataset.episodeNum,ep.dataset.episodeId,true);
            }
        },300);
    }

    // ── loadEpisode ───────────────────────────────────────────────────────────
    function loadEpisode(token){
        if(!token)return;
        if(_stopSavingFn){_stopSavingFn();_stopSavingFn=null;}
        const vid=document.querySelector('#aw-np-video');if(vid&&_activeToken)saveResumePos(vid.currentTime);
        _activeToken=token;saveLastEpisode(token);setActiveEpisode(token);
        const wasFullscreen=!!fsElement();
        getUrlForToken(token).then(url=>{if(!url)return;const epLink=document.querySelector(`.episode a[data-id="${token}"]`);if(epLink?.href)history.pushState({},'',epLink.href);if(wasFullscreen&&!!fsElement())swapVideoSrc(url);else mountPlayer(url);});
    }

    // ── Wire navigazione ──────────────────────────────────────────────────────
    function wireControls(){
        document.querySelectorAll('.episode a').forEach(a=>{if(a.dataset.npWired)return;a.dataset.npWired='1';a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();loadEpisode(a.dataset.id);});});
        document.querySelectorAll('.prevnext').forEach(btn=>{if(btn.dataset.npWired)return;btn.dataset.npWired='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const t=getAdjacentEpisode(btn.dataset.value);if(t)loadEpisode(t.dataset.id);});});
    }

    // ── Label "Better Player" ─────────────────────────────────────────────────
    function setupPlayerLabel(){
        const hide=()=>{
            ['.control[data-value="original"]','.control[data-value="alternative"]'].forEach(sel=>document.querySelectorAll(sel).forEach(el=>{if(el.dataset.npBlocked)return;el.dataset.npBlocked='1';el.style.setProperty('display','none','important');el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();},true);}));
            if(!document.getElementById('aw-bp-label')){const ref=document.querySelector('.control[data-value="original"]')||document.querySelector('.control[data-value="alternative"]');if(!ref)return;const label=document.createElement('div');label.id='aw-bp-label';label.className='control active';label.style.pointerEvents='none';label.innerHTML='<i style="color:#ec4f4f;" class="icon icon-random"></i> <span>Better Player</span>';ref.insertAdjacentElement('beforebegin',label);}
        };
        hide();new MutationObserver(hide).observe(document.body,{childList:true,subtree:true});
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
