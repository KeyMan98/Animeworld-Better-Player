// ==UserScript==
// @name         AnimeWorld Better Player
// @namespace    aw-better-player
// @version      1.2
// @include      *animeworld*/api/episode/serverPlayerAnimeWorld*
// @run-at       document-end
// @description  Il player migliore di sempre: autoresume, autoplay, skip opening, navigazione episodi e fullscreen automatico.
// @description:it Il player migliore di sempre: autoresume, autoplay, skip opening, navigazione episodi e fullscreen automatico.
// @license      MIT
// @grant        none
// @downloadURL none
// ==/UserScript==

(() => {
    'use strict';

    const SKIP_SECONDS      = 85;
    const SAVE_INTERVAL_MS  = 5000;
    const RESUME_THRESHOLD  = 10;
    const STORAGE_PREFIX    = 'aw-resume:';
    const STORAGE_MAX_AGE   = 30 * 24 * 60 * 60 * 1000;
    const BTN_RATIO         = 0.10;
    const BTN_MIN           = 28;
    const BTN_MAX           = 52;
    const STOCK_DELAY_MS    = 800;
    const FS_FLAG_KEY       = 'aw-autofs';
    const AUTOPLAY_FLAG_KEY = 'aw-autoplay-flag';

    const AUTOFS_PREF_KEY     = 'aw-autofs-enabled';
    const AUTOPLAY_PREF_KEY   = 'aw-autoplay-enabled';
    const FLAG_TTL            = 30_000;

    const RETRY_INTERVAL      = 150;
    const RETRY_MAX           = 20;

    const ICONS = {
        restart:  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`,
        skip:     `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/><path d="M13 1v6l4-3z"/><polyline points="13,8 13,13 16,15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
        prev:     `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="2.5" height="14" rx="1"/><polygon points="19,5 9,12 19,19"/></svg>`,
        next:     `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="5,5 15,12 5,19"/><rect x="16.5" y="5" width="2.5" height="14" rx="1"/></svg>`,

        autofs:   `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm2 0v14h14V5H5zm7 1.5 -3.5 5h3L10 18l4.5-6h-3L12 6.5z" fill="currentColor"/></svg>`,

        autoplay: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><polygon points="10,8 17,12 10,16" fill="currentColor"/></svg>`,
    };

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    function injectStyle() {
        if (document.getElementById('aw-skip-style')) return;
        const s = document.createElement('style');
        s.id = 'aw-skip-style';
        s.textContent = `
            .aw-btn{display:inline-flex;align-items:center;justify-content:center;padding:0;margin:0;
                background:transparent;border:none;color:#fff;cursor:pointer;opacity:.8;
                transition:opacity .15s;flex-shrink:0;box-sizing:border-box;
                -webkit-tap-highlight-color:transparent;user-select:none}
            .aw-btn:hover{opacity:1}
            .aw-btn.aw-off{opacity:.25;cursor:default;pointer-events:none}
            .aw-btn svg{fill:currentColor;flex-shrink:0;display:block;
                filter:drop-shadow(0 0 2px rgba(0,0,0,.85)) drop-shadow(0 1px 3px rgba(0,0,0,.6))}
            .aw-btn.aw-active{opacity:1;color:#f5c518}

            #aw-toast{
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                background:rgba(0,0,0,.45);color:rgba(255,255,255,.6);
                font-weight:600;line-height:1.2;font-family:system-ui,sans-serif;
                pointer-events:none;white-space:nowrap;
                opacity:1;transition:opacity .4s ease;z-index:999999}
            #aw-toast.aw-toast-hide{opacity:0}
        `;
        document.head.appendChild(s);
    }

    function makeBtn(icon, title) {
        const el = document.createElement('div');
        el.className = 'aw-btn';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', title);
        el.title = title;
        el.innerHTML = icon;
        return el;
    }

    function applySize(btns) {
        const size = clamp(Math.round(document.documentElement.clientHeight * BTN_RATIO), BTN_MIN, BTN_MAX);
        const icon = Math.round(size * 0.5);
        btns.forEach(b => {
            b.style.width = `${size}px`; b.style.height = `${size}px`;
            const svg = b.querySelector('svg');
            if (svg) { svg.style.width = `${icon}px`; svg.style.height = `${icon}px`; }
        });
    }

    function episodeId() {
        const src = document.referrer || location.href;
        const m = src.match(/\/play\/([^?#]+)/);
        return m ? m[1] : src.replace(/https?:\/\/[^/]+/, '');
    }

    const key    = () => STORAGE_PREFIX + episodeId();
    const keyTs  = () => key() + ':ts';
    const lsGet  = k      => { try { return localStorage.getItem(k); }    catch (_) { return null; } };
    const lsSet  = (k, v) => { try { localStorage.setItem(k, v); }        catch (_) {} };
    const lsDel  = k      => { try { localStorage.removeItem(k); }        catch (_) {} };

    const savePos  = t  => { lsSet(key(), String(t)); lsSet(keyTs(), String(Date.now())); };
    const loadPos  = () => { const v = lsGet(key()); return v !== null ? parseFloat(v) : null; };
    const clearPos = () => { lsDel(key()); lsDel(keyTs()); };

    function cleanupStorage() {
        try {
            const now  = Date.now();
            const dead = [];

            const allKeys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));

            for (const k of allKeys) {
                if (!k?.startsWith(STORAGE_PREFIX)) continue;
                if (k.endsWith(':ts')) continue;

                const tsRaw = lsGet(k + ':ts');
                const ts    = tsRaw !== null ? parseFloat(tsRaw) : NaN;

                if (isNaN(ts) || now - ts > STORAGE_MAX_AGE) {
                    dead.push(k, k + ':ts');
                }
            }

            dead.forEach(lsDel);
        } catch (_) {}
    }

    let _toastTimer = null;

    function formatTime(seconds) {
        const s   = Math.floor(seconds);
        const h   = Math.floor(s / 3600);
        const m   = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        const mm  = String(m).padStart(2, '0');
        const ss  = String(sec).padStart(2, '0');
        return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
    }

    function applyToastSize(el) {
        const wrapper = document.querySelector('.jw-wrapper');
        const h       = wrapper ? wrapper.offsetHeight : window.innerHeight;
        const fs      = Math.round(h * 0.038);
        const pad     = Math.round(fs * 0.53);
        el.style.fontSize   = `${fs}px`;
        el.style.padding    = `${pad}px ${Math.round(pad * 2.1)}px`;
        el.style.borderRadius = `${Math.round(fs * 1.2)}px`;
    }

    function showResumeToast(seconds) {
        document.getElementById('aw-toast')?.remove();
        if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }

        const parent = document.querySelector('.jw-wrapper') ?? document.body;

        const el = document.createElement('div');
        el.id          = 'aw-toast';
        el.textContent = `▶ Ripreso da ${formatTime(seconds)}`;
        parent.appendChild(el);
        applyToastSize(el);

        const onFs = () => { if (document.getElementById('aw-toast')) applyToastSize(el); };
        document.addEventListener('fullscreenchange',       onFs);
        document.addEventListener('webkitfullscreenchange', onFs);

        _toastTimer = setTimeout(() => {
            el.classList.add('aw-toast-hide');
            el.addEventListener('transitionend', () => {
                el.remove();
                document.removeEventListener('fullscreenchange',       onFs);
                document.removeEventListener('webkitfullscreenchange', onFs);
            }, { once: true });
            _toastTimer = null;
        }, 5000);
    }

    function parentBtn(val) {
        try { return window.parent.document.querySelector(`.prevnext[data-value="${val}"]`); }
        catch (_) { return null; }
    }

    function navEpisode(val, video) {
        const el = parentBtn(val);
        if (!el) return;
        if (video?.currentTime > 5) savePos(video.currentTime);

        if (lsGet(AUTOFS_PREF_KEY) === '1') lsSet(FS_FLAG_KEY,       String(Date.now()));
        if (lsGet(AUTOPLAY_PREF_KEY) === '1') lsSet(AUTOPLAY_FLAG_KEY, String(Date.now()));
        el.click();
    }

    function syncNavState(prev, next) {
        [['prev', prev], ['next', next]].forEach(([val, btn]) => {
            const has = !!parentBtn(val);
            btn.classList.toggle('aw-off', !has);
            btn.setAttribute('tabindex', has ? '0' : '-1');
        });
    }

    function tryAltSwitch() {
        const isStock = !!document.querySelector('video#video-player[controls]') &&
                        !document.querySelector('.jw-button-container');
        if (!isStock) return false;
        try {
            const altBtn = window.parent.document.querySelector('#alternative');
            if (altBtn) { altBtn.click(); return true; }
        } catch (_) {}
        return false;
    }

    function requestFsWithRetry() {
        return new Promise(resolve => {
            let attempts = 0;

            function attempt() {
                const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
                if (isFs) { resolve(); return; }

                const jwBtn = document.querySelector('.jw-icon-fullscreen:not(.jw-fullscreen-ima)');
                if (jwBtn) {
                    jwBtn.click();
                    let resolved = false;
                    const onFsChange = () => { if (!resolved) { resolved = true; resolve(); } };
                    document.addEventListener('fullscreenchange', onFsChange, { once: true });
                    document.addEventListener('webkitfullscreenchange', onFsChange, { once: true });
                    setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, 800);
                    return;
                }

                attempts++;
                if (attempts >= RETRY_MAX) {
                    const el = document.documentElement;
                    const fn = el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.mozRequestFullScreen ?? el.msRequestFullscreen;
                    fn?.call(el).catch(() => {}).finally(resolve) ?? resolve();
                    return;
                }

                setTimeout(attempt, RETRY_INTERVAL);
            }

            attempt();
        });
    }

    function requestPlayWithRetry(video) {
        let attempts = 0;

        function attempt() {
            if (!video.paused) return;

            video.play().catch(() => {
                attempts++;
                if (attempts < RETRY_MAX) setTimeout(attempt, RETRY_INTERVAL);
            });
        }

        attempt();
    }

    function insertButtons(video, container) {
        if (container.querySelector('.aw-btn')) return;

        const btnRestart  = makeBtn(ICONS.restart,  "Ricomincia dall'inizio (R)");
        const btnSkip     = makeBtn(ICONS.skip,     'Salta opening/ending (O)');
        const btnPrev     = makeBtn(ICONS.prev,     'Episodio precedente (P)');
        const btnNext     = makeBtn(ICONS.next,     'Episodio successivo (N)');
        const btnAutoFs   = makeBtn(ICONS.autofs,   'Auto fullscreen al cambio episodio (F)');
        const btnAutoPlay = makeBtn(ICONS.autoplay, 'Autoplay al cambio episodio (A)');

        const isAutoFsOn   = () => lsGet(AUTOFS_PREF_KEY)   === '1';
        const isAutoPlayOn = () => lsGet(AUTOPLAY_PREF_KEY) === '1';

        const syncAutoFsBtn = () => {
            const on = isAutoFsOn();
            btnAutoFs.classList.toggle('aw-active', on);
            btnAutoFs.setAttribute('aria-pressed', String(on));
            btnAutoFs.title = `Auto fullscreen al cambio episodio: ${on ? 'ON' : 'OFF'} (F)`;
        };

        const syncAutoPlayBtn = () => {
            const on = isAutoPlayOn();
            btnAutoPlay.classList.toggle('aw-active', on);
            btnAutoPlay.setAttribute('aria-pressed', String(on));
            btnAutoPlay.title = `Autoplay al cambio episodio: ${on ? 'ON' : 'OFF'} (A)`;
        };

        btnAutoFs.addEventListener('click', () => {
            lsSet(AUTOFS_PREF_KEY, isAutoFsOn() ? '0' : '1');
            syncAutoFsBtn();
        });

        btnAutoPlay.addEventListener('click', () => {
            lsSet(AUTOPLAY_PREF_KEY, isAutoPlayOn() ? '0' : '1');
            syncAutoPlayBtn();
        });

        syncAutoFsBtn();
        syncAutoPlayBtn();

        window.addEventListener('storage', e => {
            if (e.key === AUTOFS_PREF_KEY)   syncAutoFsBtn();
            if (e.key === AUTOPLAY_PREF_KEY) syncAutoPlayBtn();
        });

        const fsFlag       = lsGet(FS_FLAG_KEY);
        const autoplayFlag = lsGet(AUTOPLAY_FLAG_KEY);

        const shouldFs       = fsFlag       !== null && (Date.now() - parseFloat(fsFlag))       < FLAG_TTL;
        const shouldAutoPlay = autoplayFlag !== null && (Date.now() - parseFloat(autoplayFlag)) < FLAG_TTL;

        if (fsFlag       !== null) lsDel(FS_FLAG_KEY);
        if (autoplayFlag !== null) lsDel(AUTOPLAY_FLAG_KEY);

        function runAutoActions() {
            if (shouldFs) {
                requestFsWithRetry().then(() => {
                    if (shouldAutoPlay) requestPlayWithRetry(video);
                });
            } else if (shouldAutoPlay) {
                requestPlayWithRetry(video);
            }
        }

        if (shouldFs || shouldAutoPlay) {
            if (isFinite(video.duration)) {
                setTimeout(runAutoActions, 300);
            } else {
                video.addEventListener('loadedmetadata', () => {
                    setTimeout(runAutoActions, 300);
                }, { once: true });
            }
        }

        btnRestart.addEventListener('click', () => { video.currentTime = 0; clearPos(); });

        btnSkip.addEventListener('click', () => {
            if (!isFinite(video.duration)) return;
            const playing = !video.paused && !video.ended;
            video.currentTime = Math.min(video.duration, video.currentTime + SKIP_SECONDS);
            if (playing) video.play().catch(() => {});
        });

        btnPrev.addEventListener('click', () => navEpisode('prev', video));
        btnNext.addEventListener('click', () => navEpisode('next', video));

        [btnPrev, btnNext].forEach(btn =>
            btn.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
            })
        );

        const rewind = container.querySelector('.jw-icon-rewind');
        const spacer = container.querySelector('.jw-spacer');

        (rewind ?? container).insertAdjacentElement(rewind ? 'afterend' : 'afterbegin', btnRestart);

        if (spacer) {

            [btnAutoFs, btnAutoPlay, btnSkip, btnPrev, btnNext].reduce((ref, btn) => {
                ref.insertAdjacentElement('afterend', btn);
                return btn;
            }, spacer);
        } else {
            container.append(btnAutoFs, btnAutoPlay, btnSkip, btnPrev, btnNext);
        }

        const allBtns = [btnRestart, btnSkip, btnPrev, btnNext, btnAutoFs, btnAutoPlay];

        syncNavState(btnPrev, btnNext);
        setInterval(() => syncNavState(btnPrev, btnNext), 2000);

        applySize(allBtns);
        const ro = new ResizeObserver(() => applySize(allBtns));
        ro.observe(document.documentElement);
        ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev =>
            document.addEventListener(ev, () => applySize(allBtns))
        );

        document.addEventListener('keydown', e => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
            const map = { o: btnSkip, r: btnRestart, p: btnPrev, n: btnNext, f: btnAutoFs, a: btnAutoPlay };
            map[e.key.toLowerCase()]?.click();
        });

        function attemptResume() {
            if (!isFinite(video.duration)) return;
            const saved = loadPos();
            if (!saved || saved < 5) return;
            if (video.duration - saved < RESUME_THRESHOLD) { clearPos(); return; }
            video.currentTime = saved;
            showResumeToast(saved);
        }

        if (isFinite(video.duration)) attemptResume();
        else video.addEventListener('loadedmetadata', attemptResume, { once: true });

        let saveTimer = null;
        const startSaving = () => {
            if (saveTimer) return;
            saveTimer = setInterval(() => { if (video.currentTime > 5) savePos(video.currentTime); }, SAVE_INTERVAL_MS);
        };
        const stopSaving = () => { clearInterval(saveTimer); saveTimer = null; };

        video.addEventListener('play',  startSaving);
        video.addEventListener('pause', stopSaving);
        video.addEventListener('ended', () => { stopSaving(); clearPos(); });
        window.addEventListener('beforeunload', () => { if (video.currentTime > 5) savePos(video.currentTime); });
    }

    cleanupStorage();

    const seen = new WeakSet();

    function tryInit() {
        const video     = document.querySelector('video.jw-video, .jwplayer video, video');
        const container = document.querySelector('.jw-button-container');
        if (!video || !container || seen.has(video)) return;
        seen.add(video);
        injectStyle();
        insertButtons(video, container);
    }

    setTimeout(() => {
        if (!tryAltSwitch()) tryInit();
    }, STOCK_DELAY_MS);

    let rafPending = false;
    new MutationObserver(() => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => { rafPending = false; tryInit(); });
    }).observe(document.documentElement, { childList: true, subtree: true });
})();
