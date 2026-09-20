/**
 * session-guard.js — Protección y control estricto de sesiones y roles en Campus Virtual Centuria
 * Verifica tokens, tiempo de expiración (8h), correspondencia de roles y realiza validación en segundo plano.
 */
(function (global) {
    'use strict';

    function parseJwt(token) {
        try {
            if (!token || typeof token !== 'string') return null;
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    // Raíz de la app deducida del propio <script src=".../js/session-guard.js">.
    // Este script se carga ANTES que api.js, así que no se puede depender de CENTURIA_CONFIG/appUrl:
    // desde academic/ o admin/ el src es "../js/session-guard.js" y la raíz resulta "../".
    const SCRIPT_ROOT = (function () {
        try {
            let src = document.currentScript && document.currentScript.getAttribute('src');
            if (!src) {
                const list = document.getElementsByTagName('script');
                for (let i = 0; i < list.length; i++) {
                    const s = list[i].getAttribute('src') || '';
                    if (/(^|\/)js\/session-guard\.js/.test(s)) { src = s; break; }
                }
            }
            const m = src && src.match(/^(.*?)js\/session-guard\.js/);
            if (m) return new URL(m[1] || './', document.baseURI).href;
        } catch (e) {}
        return null;
    })();

    function getAppRoot() {
        try {
            if (SCRIPT_ROOT) return SCRIPT_ROOT;
            if (typeof appUrl === 'function') return appUrl('');
            if (window.CENTURIA_CONFIG && window.CENTURIA_CONFIG.appBasePath) {
                return window.CENTURIA_CONFIG.appBasePath;
            }
            const i = location.pathname.indexOf('/app/');
            return i >= 0 ? location.pathname.slice(0, i) + '/app/' : './';
        } catch (e) {
            return './';
        }
    }

    // Une la raíz de la app con una ruta relativa, siempre como URL absoluta resuelta.
    function rootUrl(rel) {
        try { return new URL(rel, new URL(getAppRoot(), document.baseURI)).href; }
        catch (e) { return getAppRoot() + rel; }
    }

    // ¿La URL destino es la página actual (ignorando query/hash)? Evita bucles de redirección.
    function isCurrentPage(url) {
        try {
            const u = new URL(url, document.baseURI);
            return u.origin === location.origin && u.pathname === location.pathname;
        } catch (e) { return false; }
    }

    function getLoginUrl(reason) {
        const dest = rootUrl('index.html');
        return reason ? (dest + (dest.includes('?') ? '&' : '?') + 'reason=' + encodeURIComponent(reason)) : dest;
    }

    function getRolePanelUrl(role) {
        switch (role) {
            case 'docente':   return rootUrl('docente.html');
            case 'academico': return rootUrl('academic/index.html');
            case 'admin':     return rootUrl('admin/index.html');
            case 'alumno':
            default:          return rootUrl('dashboard.html');
        }
    }

    const CenturiaSession = {
        getToken: function () {
            try {
                return sessionStorage.getItem('centuria_auth_token') ||
                       localStorage.getItem('centuria_auth_token') ||
                       sessionStorage.getItem('token') ||
                       null;
            } catch (e) { return null; }
        },

        getUser: function () {
            try {
                const s = sessionStorage.getItem('centuria_user') || localStorage.getItem('centuria_user');
                return s ? JSON.parse(s) : null;
            } catch (e) { return null; }
        },

        getCedula: function () {
            const u = this.getUser();
            return (u && (u.cedula || u.username)) ||
                   sessionStorage.getItem('current_cedula') ||
                   localStorage.getItem('centuria_cedula') || '';
        },

        getRole: function () {
            const token = this.getToken();
            const payload = parseJwt(token);
            if (payload && payload.rol) return String(payload.rol).toLowerCase();
            const u = this.getUser();
            if (u && (u.rol || u.role)) return String(u.rol || u.role).toLowerCase();
            const stRol = sessionStorage.getItem('rol') || localStorage.getItem('centuria_rol');
            return stRol ? String(stRol).toLowerCase() : '';
        },

        isExpired: function (token) {
            token = token || this.getToken();
            const payload = parseJwt(token);
            if (payload && payload.exp) {
                return (Date.now() / 1000) > payload.exp;
            }
            try {
                const u = this.getUser();
                const expStr = (u && (u.token_expires || u.expires_at)) ||
                               sessionStorage.getItem('centuria_token_expires') ||
                               localStorage.getItem('centuria_token_expires');
                if (expStr) {
                    const expMs = new Date(expStr).getTime();
                    if (!isNaN(expMs)) return Date.now() > expMs;
                }
            } catch (e) {}
            return false;
        },

        hasRole: function (roleOrRoles) {
            const curRole = this.getRole();
            if (!curRole) return false;
            if (Array.isArray(roleOrRoles)) {
                return roleOrRoles.some(r => String(r).toLowerCase() === curRole);
            }
            return curRole === String(roleOrRoles).toLowerCase();
        },

        logout: function (reason) {
            if (typeof centuriaLogout === 'function' && !isCurrentPage(rootUrl('index.html'))) {
                centuriaLogout(false);
                return;
            }
            try { sessionStorage.clear(); } catch (e) {}
            try {
                localStorage.removeItem('centuria_auth_token');
                localStorage.removeItem('centuria_token');
                localStorage.removeItem('centuria_user');
            } catch (e) {}
            const loginUrl = getLoginUrl(reason);
            if (isCurrentPage(loginUrl)) return; // ya estamos en el login: no recargar en bucle
            window.location.replace(loginUrl);
        },

        protect: function (options) {
            options = options || {};
            const allowedRoles = options.allowedRoles ? (Array.isArray(options.allowedRoles) ? options.allowedRoles : [options.allowedRoles]) : null;

            const token = this.getToken();
            const user = this.getUser();

            // 1. Verificar existencia de credenciales
            if (!token || !user) {
                this.logout('no_session');
                return false;
            }

            // 2. Verificar tiempo de expiración (8 horas)
            if (this.isExpired(token)) {
                this.logout('expired');
                return false;
            }

            // 3. Verificar correspondencia de rol
            const userRole = this.getRole();
            if (allowedRoles && allowedRoles.length > 0) {
                const isAllowed = allowedRoles.some(r => String(r).toLowerCase() === userRole);
                if (!isAllowed) {
                    const target = getRolePanelUrl(userRole);
                    const targetFile = target.split('/').pop().split('?')[0];
                    if (targetFile && !location.pathname.endsWith(targetFile)) {
                        window.location.replace(target);
                        return false;
                    }
                    this.logout('unauthorized');
                    return false;
                }
            }

            // 4. Validación asíncrona con el backend (GAS / PHP) en segundo plano
            if (window.CenturiaAPI && typeof CenturiaAPI.validateSession === 'function') {
                CenturiaAPI.validateSession().then(res => {
                    if (res && res.valid === false) {
                        CenturiaSession.logout('session_invalidated');
                    }
                }).catch(() => {
                    // Continuar si hay falla de red temporal
                });
            }

            return true;
        }
    };

    // Exportar CenturiaSession
    global.CenturiaSession = CenturiaSession;

    // Compatibilidad retroactiva con CenturiaAccess
    global.CenturiaAccess = Object.freeze({
        isAuthenticated: () => Boolean(CenturiaSession.getToken()),
        isGeneralAdmin: () => CenturiaSession.getRole() === 'admin',
        canAccess: (role) => role ? CenturiaSession.hasRole(role) : Boolean(CenturiaSession.getToken()),
        getRol: () => CenturiaSession.getRole(),
        getCedula: () => CenturiaSession.getCedula(),
        getUser: () => CenturiaSession.getUser()
    });

})(typeof window !== 'undefined' ? window : this);
