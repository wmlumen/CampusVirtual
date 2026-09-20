/**
 * devmode.js - Modo Programador / Developer Mode
 * Campus Virtual Centuria
 *
 * Muestra etiquetas visuales sobre cada sección de la página
 * para identificar la estructura HTML (header, nav, main, section, footer, etc.)
 * Solo los administradores pueden activarlo.
 *
 * Uso: incluir <script src="js/devmode.js"></script> en cada página.
 * El admin puede activar/desactivar con el botón o la tecla Ctrl+Shift+D.
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════
    // COLORES POR TIPO DE ELEMENTO (inspirado en LucusHost)
    // ═══════════════════════════════════════════════════
    const SECTION_COLORS = {
        header:    { bg: 'rgba(22,129,61,0.08)',  border: '#16813D', label: '#16813D', text: '#fff' },
        nav:       { bg: 'rgba(37,99,235,0.08)',   border: '#2563EB', label: '#2563EB', text: '#fff' },
        main:      { bg: 'rgba(217,65,114,0.06)',   border: '#D94172', label: '#D94172', text: '#fff' },
        section:   { bg: 'rgba(184,148,31,0.07)',   border: '#B8941F', label: '#B8941F', text: '#fff' },
        article:   { bg: 'rgba(217,119,6,0.07)',    border: '#D97706', label: '#D97706', text: '#fff' },
        aside:     { bg: 'rgba(99,102,241,0.07)',   border: '#6366F1', label: '#6366F1', text: '#fff' },
        footer:    { bg: 'rgba(107,114,128,0.08)',  border: '#6B7280', label: '#6B7280', text: '#fff' },
        div:       { bg: 'rgba(148,163,184,0.06)',  border: '#94A3B8', label: '#94A3B8', text: '#fff' },
        form:      { bg: 'rgba(16,185,129,0.07)',   border: '#10B981', label: '#10B981', text: '#fff' },
        table:     { bg: 'rgba(244,63,94,0.06)',    border: '#F43F5E', label: '#F43F5E', text: '#fff' },
        card:      { bg: 'rgba(99,102,241,0.06)',   border: '#818CF8', label: '#818CF8', text: '#fff' },
        sidebar:   { bg: 'rgba(139,92,246,0.07)',   border: '#8B5CF6', label: '#8B5CF6', text: '#fff' },
        default:   { bg: 'rgba(148,163,184,0.05)',  border: '#CBD5E1', label: '#64748B', text: '#fff' }
    };

    // Mapa de selectores → tipo de sección
    const SELECTOR_MAP = [
        { sel: 'header', type: 'header' },
        { sel: 'nav', type: 'nav' },
        { sel: 'main', type: 'main' },
        { sel: 'footer', type: 'footer' },
        { sel: 'aside', type: 'aside' },
        { sel: 'section', type: 'section' },
        { sel: 'article', type: 'article' },
        { sel: 'form', type: 'form' },
        { sel: 'table', type: 'table' },
        // Clases comunes del proyecto
        { sel: '.hdr, .header, [class*="header"]', type: 'header' },
        { sel: '.sidebar, .side, [class*="sidebar"]', type: 'sidebar' },
        { sel: '.card, .login-card, [class*="card"]', type: 'card' },
        { sel: '.stats, [class*="stat"]', type: 'section' },
        { sel: '.wrap, .container, [class*="container"]', type: 'main' },
        { sel: '.footer, [class*="footer"]', type: 'footer' },
        { sel: '.nav, .menu, [class*="nav"]', type: 'nav' },
    ];

    let active = false;
    let overlayStyle = null;
    let labelElements = [];
    let highlightHandler = null;

    // ═══════════════════════════════════════════════════
    // DETECCIÓN DE ROL
    // ═══════════════════════════════════════════════════
    function getUserRole() {
        try {
            const raw = sessionStorage.getItem('centuria_user') || localStorage.getItem('centuria_user');
            if (!raw) return null;
            const user = JSON.parse(raw);
            return user.role || user.rol || null;
        } catch (e) { return null; }
    }

    function isAdmin() {
        if (sessionStorage.getItem('current_cedula') === '1340130') return true;
        const sessionRole = sessionStorage.getItem('rol');
        if (sessionRole === 'admin' || sessionRole === 'Administrador General') return true;
        const role = getUserRole();
        return role === 'admin' || role === 'Administrador General';
    }

    // ═══════════════════════════════════════════════════
    // DETECCIÓN DE SECCIONES
    // ═══════════════════════════════════════════════════
    function classifyElement(el) {
        const tag = el.tagName.toLowerCase();
        // Primero intentar por tag semántico
        if (['header', 'nav', 'main', 'footer', 'aside', 'section', 'article', 'form', 'table'].includes(tag)) {
            return tag;
        }
        // Luego por selectores del proyecto
        for (const map of SELECTOR_MAP) {
            try {
                if (el.matches(map.sel)) return map.type;
            } catch (e) { /* skip invalid selectors */ }
        }
        return 'default';
    }

    function getElementLabel(el, type) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? '#' + el.id : '';
        const cls = el.className && typeof el.className === 'string'
            ? '.' + el.className.split(/\s+/).filter(c => c && !c.startsWith('devmode-')).slice(0, 2).join('.')
            : '';
        const role = el.getAttribute('role') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';

        // Etiquetas legibles
        const friendlyNames = {
            header: 'Cabecera / Header',
            nav: 'Navegación / Nav',
            main: 'Contenido Principal / Main',
            footer: 'Pie de Página / Footer',
            aside: 'Barra Lateral / Aside',
            section: 'Sección / Section',
            article: 'Artículo / Article',
            form: 'Formulario / Form',
            table: 'Tabla / Table',
            card: 'Tarjeta / Card',
            sidebar: 'Sidebar',
            default: 'Contenedor / Div'
        };

        let label = friendlyNames[type] || 'Elemento';
        if (id) label += ' ' + id;
        else if (cls) label += ' ' + cls;
        else if (ariaLabel) label += ' "' + ariaLabel + '"';

        return label;
    }

    // ═══════════════════════════════════════════════════
    // INYECTAR ESTILOS
    // ═══════════════════════════════════════════════════
    function injectStyles() {
        if (overlayStyle) return;
        overlayStyle = document.createElement('style');
        overlayStyle.id = 'devmode-styles';
        overlayStyle.textContent = `
            /* Modo Programador — Overlay */
            .devmode-overlay {
                position: absolute;
                pointer-events: none;
                z-index: 99998;
                transition: opacity 0.2s ease;
            }
            .devmode-label {
                position: absolute;
                top: -1px;
                left: 8px;
                z-index: 99999;
                font-family: 'Courier New', monospace;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.3px;
                padding: 2px 8px 3px;
                border-radius: 0 0 6px 6px;
                pointer-events: none;
                white-space: nowrap;
                text-shadow: 0 1px 2px rgba(0,0,0,0.15);
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                line-height: 1.4;
                transform: translateY(-100%);
            }
            .devmode-label .devmode-tag {
                opacity: 0.7;
                font-size: 9px;
                margin-left: 4px;
            }

            /* Botón flotante del Modo Programador */
            .devmode-toggle {
                position: fixed;
                bottom: 16px;
                right: 16px;
                z-index: 999999;
                width: 44px;
                height: 44px;
                border-radius: 12px;
                border: 2px solid #CBD5E1;
                background: #fff;
                color: #64748B;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                font-family: 'Montserrat', sans-serif;
            }
            .devmode-toggle:hover {
                transform: scale(1.08);
                box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            }
            .devmode-toggle.active {
                background: linear-gradient(135deg, #2563EB, #1D4ED8);
                color: #fff;
                border-color: #2563EB;
            }

            /* Panel de info del Modo Programador */
            .devmode-panel {
                position: fixed;
                bottom: 70px;
                right: 16px;
                z-index: 999998;
                background: #fff;
                border: 1px solid #E2E8F0;
                border-radius: 14px;
                padding: 16px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                width: 260px;
                font-family: 'Montserrat', sans-serif;
                display: none;
            }
            .devmode-panel.visible { display: block; }
            .devmode-panel h3 {
                font-size: 11px;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .devmode-panel .devmode-legend {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .devmode-panel .devmode-legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 10px;
                color: #475569;
            }
            .devmode-panel .devmode-legend-color {
                width: 14px;
                height: 14px;
                border-radius: 4px;
                border: 2px solid;
                flex-shrink: 0;
            }
            .devmode-panel .devmode-shortcut {
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px solid #E2E8F0;
                font-size: 9px;
                color: #94A3B8;
                text-align: center;
            }
            .devmode-panel .devmode-shortcut kbd {
                background: #F1F5F9;
                border: 1px solid #CBD5E1;
                border-radius: 3px;
                padding: 1px 4px;
                font-family: 'Courier New', monospace;
                font-size: 9px;
                color: #475569;
            }

            /* Hover highlight */
            .devmode-highlight {
                outline: 2px dashed rgba(37,99,235,0.5) !important;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(overlayStyle);
    }

    // ═══════════════════════════════════════════════════
    // CREAR OVERLAYS Y ETIQUETAS
    // ═══════════════════════════════════════════════════
    function createOverlays() {
        removeOverlays();

        // Buscar todos los elementos semánticos + elementos del proyecto
        const selectors = [
            'header', 'nav', 'main', 'footer', 'aside',
            'section', 'article', 'form', 'table',
            '.hdr', '.header', '.sidebar', '.side',
            '.card', '.login-card', '.stats', '.stat-card',
            '.wrap', '.container', '.footer',
            '.brand', '.split', '.sec-wrap', '.curso-btn',
            '[role="banner"]', '[role="navigation"]', '[role="main"]', '[role="contentinfo"]'
        ];

        const found = new Set();
        const elements = [];

        // Recorrer selectores y deduplicar
        for (const sel of selectors) {
            try {
                document.querySelectorAll(sel).forEach(el => {
                    if (!found.has(el) && el.offsetParent !== null) {
                        found.add(el);
                        elements.push(el);
                    }
                });
            } catch (e) { /* skip */ }
        }

        // Si no encontramos suficientes, buscar divs importantes
        if (elements.length < 3) {
            document.querySelectorAll('div[class]').forEach(el => {
                if (!found.has(el) && el.offsetParent !== null && el.offsetHeight > 40) {
                    const cls = el.className || '';
                    if (typeof cls === 'string' && (
                        cls.match(/header|nav|footer|sidebar|main|content|wrap|container|card|stat|brand|split|section/i)
                    )) {
                        found.add(el);
                        elements.push(el);
                    }
                }
            });
        }

        elements.forEach(el => {
            const type = classifyElement(el);
            const colors = SECTION_COLORS[type] || SECTION_COLORS.default;
            const labelText = getElementLabel(el, type);

            // Crear overlay (borde)
            const overlay = document.createElement('div');
            overlay.className = 'devmode-overlay';
            overlay.style.cssText = `
                border: 2.5px solid ${colors.border};
                background: ${colors.bg};
                border-radius: 6px;
                top: ${el.offsetTop}px;
                left: ${el.offsetLeft}px;
                width: ${el.offsetWidth}px;
                height: ${el.offsetHeight}px;
            `;
            el.style.position = el.style.position || 'relative';
            el.appendChild(overlay);

            // Crear etiqueta
            const label = document.createElement('div');
            label.className = 'devmode-label';
            label.style.cssText = `
                background: ${colors.border};
                color: ${colors.text};
            `;
            label.innerHTML = `${labelText}`;
            el.appendChild(label);

            labelElements.push({ overlay, label, target: el });

            // Hover effect
            el.addEventListener('mouseenter', () => el.classList.add('devmode-highlight'));
            el.addEventListener('mouseleave', () => el.classList.remove('devmode-highlight'));
        });
    }

    function removeOverlays() {
        labelElements.forEach(({ overlay, label, target }) => {
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (label && label.parentNode) label.parentNode.removeChild(label);
            if (target) target.classList.remove('devmode-highlight');
        });
        labelElements = [];
    }

    // ═══════════════════════════════════════════════════
    // BOTÓN FLOTANTE Y PANEL
    // ═══════════════════════════════════════════════════
    function createToggleButton() {
        if (document.getElementById('devmode-toggle')) return;

        const btn = document.createElement('button');
        btn.id = 'devmode-toggle';
        btn.className = 'devmode-toggle' + (active ? ' active' : '');
        btn.innerHTML = '<i class="bi bi-code-slash"></i>';
        btn.title = 'Modo Programador (Ctrl+Shift+D)';
        btn.onclick = () => toggleDevMode();
        document.body.appendChild(btn);

        // Panel de leyenda
        const panel = document.createElement('div');
        panel.id = 'devmode-panel';
        panel.className = 'devmode-panel' + (active ? ' visible' : '');

        const legendItems = Object.entries(SECTION_COLORS)
            .filter(([k]) => k !== 'default')
            .map(([key, c]) => {
                const names = {
                    header: 'Header / Cabecera',
                    nav: 'Nav / Navegación',
                    main: 'Main / Contenido',
                    section: 'Section / Sección',
                    article: 'Article / Artículo',
                    aside: 'Aside / Barra lateral',
                    footer: 'Footer / Pie de página',
                    form: 'Form / Formulario',
                    table: 'Table / Tabla',
                    card: 'Card / Tarjeta',
                    sidebar: 'Sidebar',
                    div: 'Div / Contenedor'
                };
                return `<div class="devmode-legend-item">
                    <div class="devmode-legend-color" style="background:${c.bg};border-color:${c.border}"></div>
                    <span>${names[key] || key}</span>
                </div>`;
            }).join('');

        panel.innerHTML = `
            <h3><i class="bi bi-code-slash"></i> Modo Programador</h3>
            <div class="devmode-legend">
                ${legendItems}
            </div>
            <div class="devmode-shortcut">
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> para activar/desactivar
            </div>
        `;
        document.body.appendChild(panel);

        // Cerrar panel al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#devmode-toggle') && !e.target.closest('#devmode-panel')) {
                panel.classList.remove('visible');
            }
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('visible');
        });
    }

    // ═══════════════════════════════════════════════════
    // TOGGLE PRINCIPAL
    // ═══════════════════════════════════════════════════
    function toggleDevMode() {
        if (!isAdmin()) {
            console.warn('[Modo Programador] Solo los administradores pueden activar este modo.');
            return;
        }
        active = !active;
        localStorage.setItem('centuria_devmode', active);

        const btn = document.getElementById('devmode-toggle');
        const panel = document.getElementById('devmode-panel');

        if (active) {
            injectStyles();
            createOverlays();
            if (btn) btn.classList.add('active');
            if (panel) panel.classList.add('visible');
            console.log('[Modo Programador] ACTIVADO — Secciones visibles.');
        } else {
            removeOverlays();
            if (btn) btn.classList.remove('active');
            if (panel) panel.classList.remove('visible');
            console.log('[Modo Programador] DESACTIVADO.');
        }
    }

    // ═══════════════════════════════════════════════════
    // RECÁLCULO AL REDIMENSIONAR
    // ═══════════════════════════════════════════════════
    let resizeTimer;
    window.addEventListener('resize', () => {
        if (!active) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => createOverlays(), 200);
    });

    // ═══════════════════════════════════════════════════
    // ATAJOS DE TECLADO
    // ═══════════════════════════════════════════════════
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            toggleDevMode();
        }
    });

    // ═══════════════════════════════════════════════════
    // INICIALIZACIÓN
    // ═══════════════════════════════════════════════════
    function init() {
        if (!isAdmin()) return;

        createToggleButton();

        // Restaurar estado guardado
        const saved = localStorage.getItem('centuria_devmode');
        if (saved === 'true') {
            active = true;
            injectStyles();
            createOverlays();
            const btn = document.getElementById('devmode-toggle');
            const panel = document.getElementById('devmode-panel');
            if (btn) btn.classList.add('active');
            if (panel) panel.classList.add('visible');
        }
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API pública
    window.CenturiaDevMode = {
        toggle: toggleDevMode,
        isActive: () => active,
        refresh: () => { if (active) createOverlays(); }
    };

})();
