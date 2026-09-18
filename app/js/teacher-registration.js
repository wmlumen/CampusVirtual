/* Solicitudes docentes: La Base de Datos Cloud es la fuente de verdad, también desde localhost. */
(function (root) {
    'use strict';
    const unavailable = 'El registro docente todavía no está habilitado en el servidor. Contacta a administración.';
    async function request(action, data = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        try {
            const apiUrl = (root.CENTURIA_CONFIG && root.CENTURIA_CONFIG.cloudApiUrl) || '';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                body: JSON.stringify({ ...data, action }),
                signal: controller.signal,
                redirect: 'follow'
            });
            if (!response.ok) throw new Error('Servidor no disponible. Intenta nuevamente.');
            let result;
            try { result = await response.json(); }
            catch (_) { throw new Error(unavailable); }
            if (result.contract !== 'docentes-v1') throw new Error(unavailable);
            if (result.ok !== true) {
                const error = new Error(result.error || 'No se pudo completar la operación.');
                error.code = result.code;
                throw error;
            }
            return result;
        } catch (error) {
            if (error.name === 'AbortError' || error instanceof TypeError) {
                throw new Error('No se pudo confirmar la operación con el servidor en la nube. Conserva tus datos y reintenta; no se iniciará sesión sin confirmación.');
            }
            throw error;
        } finally { clearTimeout(timeout); }
    }
    async function digest(value) {
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
        return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
    }
    root.DocenteRegistro = Object.freeze({
        request,
        // 192 bits aleatorios: no deriva de nombres, cédula ni datos públicos.
        generateAccessCode() {
            return Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
        },
        async submit(data, accessCode) {
            if (!/^[a-f0-9]{48}$/.test(accessCode)) throw new Error('Genera una contraseña docente válida.');
            return request('docente_solicitar', { ...data, credential_hash: await digest(accessCode) });
        },
        status: cedula => request('docente_estado', { cedula }),
        login: (cedula, password) => request('docente_ingresar', { cedula, password }),
        list: adminKey => request('docente_pendientes', { admin_key: adminKey }),
        review: (id, decision, adminKey) => request('docente_revisar', { id, decision, admin_key: adminKey }),
        logout: token => request('docente_salir', { token })
    });
})(window);
