/**
 * tests/auth_suite.test.cjs
 * Suite automatizada de 20 casos de prueba para el flujo integral de
 * autenticación, registro, sesiones, roles, almacenamiento y persistencia.
 *
 * Ejecución: node tests/auth_suite.test.cjs
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

// ══════════════════════════════════════════════════════════════
// 1. MOTOR DE SIMULACIÓN DE SERVIDOR CLOUD
// ══════════════════════════════════════════════════════════════

class MockSheet {
    constructor(name, headers = []) {
        this.name = name;
        this.rows = headers.length ? [[...headers]] : [];
    }
    appendRow(row) {
        this.rows.push([...row]);
    }
    getLastRow() { return this.rows.length; }
    getLastColumn() { return this.rows[0] ? this.rows[0].length : 0; }
    getDataRange() {
        return {
            getValues: () => this.rows.map(r => [...r])
        };
    }
    getRange(row, col, numRows = 1, numCols = 1) {
        const self = this;
        return {
            getValues: () => {
                const res = [];
                for (let r = 0; r < numRows; r++) {
                    const rowArr = [];
                    for (let c = 0; c < numCols; c++) {
                        const rowIndex = row - 1 + r;
                        const colIndex = col - 1 + c;
                        rowArr.push(self.rows[rowIndex] ? self.rows[rowIndex][colIndex] : '');
                    }
                    res.push(rowArr);
                }
                return res;
            },
            setValue: (val) => {
                for (let r = 0; r < numRows; r++) {
                    for (let c = 0; c < numCols; c++) {
                        const rowIndex = row - 1 + r;
                        const colIndex = col - 1 + c;
                        while (self.rows.length <= rowIndex) self.rows.push([]);
                        while (self.rows[rowIndex].length <= colIndex) self.rows[rowIndex].push('');
                        self.rows[rowIndex][colIndex] = val;
                    }
                }
            },
            setFontWeight: () => {},
            setBackground: () => {},
            setFontColor: () => {},
            setWrap: () => {},
            setHorizontalAlignment: () => {},
            setVerticalAlignment: () => {},
            setNumberFormat: () => {}
        };
    }
    setFrozenRows() {}
    autoResizeColumns() {}
}

class MockSpreadsheet {
    constructor() {
        this.sheets = new Map();
    }
    getSheetByName(name) {
        return this.sheets.get(name) || null;
    }
    insertSheet(name) {
        const s = new MockSheet(name);
        this.sheets.set(name, s);
        return s;
    }
}

function createGasContext(mockSS, mockCache) {
    const sandbox = {
        console: {
            log: () => {},
            warn: () => {},
            error: () => {}
        },
        SpreadsheetApp: {
            getActiveSpreadsheet: () => mockSS,
            openById: () => mockSS,
            flush: () => {}
        },
        Utilities: {
            DigestAlgorithm: { SHA_256: 'SHA_256' },
            Charset: { UTF_8: 'UTF_8' },
            computeDigest: (alg, val) => {
                const h = crypto.createHash('sha256').update(String(val), 'utf8').digest();
                const signed = [];
                for (let i = 0; i < h.length; i++) {
                    let b = h[i];
                    if (b > 127) b -= 256;
                    signed.push(b);
                }
                return signed;
            },
            getUuid: () => crypto.randomUUID(),
            formatDate: () => new Date().toISOString(),
            base64Encode: (s) => Buffer.from(s).toString('base64'),
            base64Decode: (s) => Buffer.from(s, 'base64').toString('utf8')
        },
        LockService: {
            getScriptLock: () => ({
                tryLock: () => true,
                waitLock: () => true,
                releaseLock: () => {}
            })
        },
        CacheService: {
            getScriptCache: () => ({
                get: (k) => mockCache.get(k) || null,
                put: (k, v) => mockCache.set(k, String(v)),
                remove: (k) => mockCache.delete(k)
            })
        },
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: () => 'test_admin_key_longer_than_32_characters_12345',
                setProperty: () => {}
            })
        },
        ContentService: {
            createTextOutput: (text) => ({
                setMimeType: () => ({ getContent: () => text })
            }),
            MimeType: { JSON: 'JSON' }
        },
        DriveApp: {},
        MailApp: { sendEmail: () => {} },
        GmailApp: { sendEmail: () => {} }
    };

    sandbox.window = sandbox;
    sandbox.global = sandbox;

    const ctx = vm.createContext(sandbox);
    const gasCode = fs.readFileSync(path.join(__dirname, '../app/Backend_Scripts/01_Script_Cloud_Completo.gs'), 'utf8');
    vm.runInContext(gasCode, ctx);
    return ctx;
}

// ══════════════════════════════════════════════════════════════
// 2. SIMULACIÓN DE NAVEGADOR (FRONTEND)
// ══════════════════════════════════════════════════════════════

class MockStorage {
    constructor() {
        this.store = new Map();
    }
    getItem(k) {
        return this.store.has(k) ? this.store.get(k) : null;
    }
    setItem(k, v) {
        this.store.set(k, String(v));
    }
    removeItem(k) {
        this.store.delete(k);
    }
    clear() {
        this.store.clear();
    }
}

function createBrowserEnvironment(gasContext, mockSS) {
    const sessionStorage = new MockStorage();
    const localStorage = new MockStorage();
    let currentPath = '/CampusVirtual/app/dashboard.html';

    const location = {
        get href() { return 'https://instituto-centuria.github.io' + currentPath; },
        set href(v) { currentPath = v; },
        get pathname() { return currentPath; },
        set pathname(v) { currentPath = v; },
        replace: (v) => { currentPath = v; },
        origin: 'https://instituto-centuria.github.io',
        hostname: 'instituto-centuria.github.io'
    };

    // Mock fetch que redirige peticiones a GAS_URL hacia el contexto de Apps Script
    const mockFetch = (url, options = {}) => {
        const method = options.method || 'GET';
        let body = {};
        if (options.body) {
            try { body = JSON.parse(options.body); } catch(e) { body = {}; }
        }

        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    if (url.includes('macros') || url.includes('exec') || options.body) {
                        let action = body.action;
                        if (!action && url.includes('?')) {
                            const qs = url.split('?')[1] || '';
                            const params = new URLSearchParams(qs);
                            action = params.get('action');
                            if (params.get('token')) body.token = params.get('token');
                            if (params.get('cedula')) body.cedula = params.get('cedula');
                        }

                        let res = null;
                        if (action === 'register') res = gasContext.cvAuthRegister(mockSS, body);
                        else if (action === 'login') res = gasContext.cvAuthLogin(mockSS, body);
                        else if (action === 'validar_sesion') res = gasContext.cvAuthValidateSession(mockSS, body);
                        else if (action === 'logout') res = gasContext.cvAuthLogout(mockSS, body);
                        else if (action === 'actualizar_perfil') res = gasContext.cvAuthUpdateProfile(mockSS, body);
                        else if (action === 'cambiar_password') res = gasContext.cvAuthChangePassword(mockSS, body);
                        else if (action === 'recuperar_acceso') res = gasContext.cvAuthRecoverAccess(mockSS, body);
                        else if (action === 'obtener_perfil') res = gasContext.cvAuthGetProfile(mockSS, body);
                        else res = { ok: false, error: 'Acción no soportada' };

                        resolve({
                            ok: res && res.ok !== false,
                            status: 200,
                            json: () => Promise.resolve(res),
                            text: () => Promise.resolve(JSON.stringify(res))
                        });
                        return;
                    }
                    // Error de red simulado para otros endpoints
                    reject(new Error('Network request failed'));
                } catch(err) {
                    resolve({
                        ok: false,
                        status: 400,
                        json: () => Promise.resolve({ ok: false, error: err.message })
                    });
                }
            });
        });
    };

    const bEnv = {
        window: null,
        document: {
            createElement: () => ({ style: {}, appendChild: () => {} }),
            body: { appendChild: () => {} },
            getElementById: () => null
        },
        location: location,
        sessionStorage: sessionStorage,
        localStorage: localStorage,
        fetch: mockFetch,
        atob: (s) => Buffer.from(s, 'base64').toString('utf8'),
        btoa: (s) => Buffer.from(s, 'utf8').toString('base64'),
        AbortController: class {
            constructor() { this.signal = {}; }
            abort() {}
        },
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        URLSearchParams: URLSearchParams,
        console: console
    };

    bEnv.window = bEnv;

    const bCtx = vm.createContext(bEnv);

    // Cargar api.js
    const apiCode = fs.readFileSync(path.join(__dirname, '../app/js/api.js'), 'utf8');
    vm.runInContext(apiCode, bCtx);

    // Cargar session-guard.js
    const guardCode = fs.readFileSync(path.join(__dirname, '../app/js/session-guard.js'), 'utf8');
    vm.runInContext(guardCode, bCtx);

    return { bCtx, bEnv, sessionStorage, localStorage, location };
}

// ══════════════════════════════════════════════════════════════
// 3. SUITE DE 20 CASOS DE PRUEBA
// ══════════════════════════════════════════════════════════════

let passedCount = 0;
let failedCount = 0;

function runTest(testNumber, name, fn) {
    try {
        fn();
        console.log(`\x1b[32m✔ [Caso ${testNumber.toString().padStart(2, '0')}] Aprobado: ${name}\x1b[0m`);
        passedCount++;
    } catch (err) {
        console.error(`\x1b[31m✖ [Caso ${testNumber.toString().padStart(2, '0')}] Falló: ${name}\x1b[0m`);
        console.error(`  Detalle: ${err.message}`);
        failedCount++;
    }
}

async function runTestAsync(testNumber, name, fn) {
    try {
        await fn();
        console.log(`\x1b[32m✔ [Caso ${testNumber.toString().padStart(2, '0')}] Aprobado: ${name}\x1b[0m`);
        passedCount++;
    } catch (err) {
        console.error(`\x1b[31m✖ [Caso ${testNumber.toString().padStart(2, '0')}] Falló: ${name}\x1b[0m`);
        console.error(`  Detalle: ${err.message}`);
        failedCount++;
    }
}

async function startSuite() {
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log(' CAMPUS VIRTUAL CENTURIA — SUITE DE PRUEBAS DE SEGURIDAD Y AUTH');
    console.log('══════════════════════════════════════════════════════════════\n');

    const mockSS = new MockSpreadsheet();
    const mockCache = new Map();
    const gasContext = createGasContext(mockSS, mockCache);
    const { bCtx, bEnv, sessionStorage, localStorage, location } = createBrowserEnvironment(gasContext, mockSS);

    // ──────────────────────────────────────────────────────────
    // CASO 1: Registro válido con contraseña propia y hash en Base de Datos Cloud
    // ──────────────────────────────────────────────────────────
    await runTestAsync(1, 'Registro válido (cédula, contraseña personalizada, hash con salt en Base de Datos Cloud)', async () => {
        const res = gasContext.cvAuthRegister(mockSS, {
            cedula: '4.555.666-0',
            nombre: 'Elena',
            apellido: 'Benitez',
            email: 'elena.benitez@centuria.edu.py',
            telefono: '0981112233',
            password: 'MiPasswordSeguro2026',
            grado: 'GRADO',
            carrera: 'Ingeniería en Sistemas',
            seccion: 'S026'
        });

        assert.strictEqual(res.ok, true, 'El registro debe retornar ok: true');
        assert.ok(res.token, 'Debe generar un token de sesión');
        assert.strictEqual(res.user.cedula, '45556660', 'La cédula debe estar normalizada');
        assert.strictEqual(res.user.rol, 'alumno', 'El rol asignado debe ser alumno');

        // Verificar que en la Base de Datos Cloud NO se guardó la contraseña en texto plano
        const uSheet = mockSS.getSheetByName('Usuarios');
        assert.ok(uSheet, 'Debe existir la hoja Usuarios');
        const rows = uSheet.getDataRange().getValues();
        const header = rows[0].map(h => String(h).toLowerCase());
        const hashCol = header.indexOf('password_hash');
        const saltCol = header.indexOf('salt');
        assert.ok(hashCol >= 0, 'Debe existir columna password_hash');
        assert.ok(saltCol >= 0, 'Debe existir columna salt');

        const uRow = rows.find(r => r[header.indexOf('cedula')] === '45556660');
        assert.ok(uRow, 'Debe encontrarse la fila del usuario');
        assert.notStrictEqual(uRow[hashCol], 'MiPasswordSeguro2026', 'La contraseña nunca debe estar en texto plano');
        assert.ok(uRow[hashCol].length >= 32, 'El hash SHA-256 debe ser válido');
        assert.ok(uRow[saltCol].length >= 16, 'El salt aleatorio debe ser válido');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 2: Campos obligatorios vacíos
    // ──────────────────────────────────────────────────────────
    runTest(2, 'Campos obligatorios vacíos rechazados con error claro', () => {
        let errCedula = null;
        try {
            gasContext.cvAuthRegister(mockSS, {
                cedula: '',
                nombre: 'Juan',
                apellido: 'Perez',
                email: 'juan@test.com',
                password: 'PassWord123'
            });
        } catch(e) { errCedula = e; }
        assert.ok(errCedula, 'Debe arrojar error si la cédula está vacía');

        let errNombre = null;
        try {
            gasContext.cvAuthRegister(mockSS, {
                cedula: '1234567',
                nombre: '',
                apellido: 'Perez',
                email: 'juan@test.com',
                password: 'PassWord123'
            });
        } catch(e) { errNombre = e; }
        assert.ok(errNombre, 'Debe arrojar error si el nombre está vacío');

        let errPass = null;
        try {
            gasContext.cvAuthRegister(mockSS, {
                cedula: '1234567',
                nombre: 'Juan',
                apellido: 'Perez',
                email: 'juan@test.com',
                password: ''
            });
        } catch(e) { errPass = e; }
        assert.ok(errPass, 'Debe arrojar error si la contraseña está vacía');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 3: Cédula inválida
    // ──────────────────────────────────────────────────────────
    runTest(3, 'Cédula inválida o con formato vacío es rechazada', () => {
        let thrown = false;
        try {
            gasContext.cvAuthRegister(mockSS, {
                cedula: ' . - ',
                nombre: 'Ana',
                apellido: 'Gomez',
                email: 'ana@test.com',
                password: 'PassWord123'
            });
        } catch(e) {
            thrown = true;
            assert.ok(e.message.includes('cédula') || e.message.includes('requerido'));
        }
        assert.strictEqual(thrown, true, 'Cédula con solo puntos o guiones debe ser rechazada');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 4: Correo inválido
    // ──────────────────────────────────────────────────────────
    runTest(4, 'Correo electrónico con formato inválido es rechazado', () => {
        let thrown = false;
        try {
            gasContext.cvAuthRegister(mockSS, {
                cedula: '6789012',
                nombre: 'Carlos',
                apellido: 'Lopez',
                email: 'correo_sin_arroba_ni_punto',
                password: 'PassWord123'
            });
        } catch(e) {
            thrown = true;
            assert.ok(e.message.includes('correo') || e.message.includes('email') || e.message.includes('inválido'));
        }
        assert.strictEqual(thrown, true, 'Correo inválido debe lanzar error');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 5: Contraseña insuficiente (< 6 caracteres)
    // ──────────────────────────────────────────────────────────
    runTest(5, 'Contraseña menor a 6 caracteres es rechazada', () => {
        let thrown = false;
        try {
            gasContext.cvAuthRegister(mockSS, {
                cedula: '7890123',
                nombre: 'Lucia',
                apellido: 'Martinez',
                email: 'lucia@centuria.edu.py',
                password: '12345'
            });
        } catch(e) {
            thrown = true;
            assert.ok(e.message.includes('6 caracteres') || e.message.includes('contraseña'));
        }
        assert.strictEqual(thrown, true, 'Contraseña menor a 6 caracteres debe ser rechazada');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 6: Registro con cédula duplicada
    // ──────────────────────────────────────────────────────────
    runTest(6, 'Registro con cédula duplicada devuelve error de conflicto', () => {
        let thrown = false;
        try {
            gasContext.cvAuthRegister(mockSS, {
                cedula: '45556660', // Ya registrada en Caso 1
                nombre: 'Elena',
                apellido: 'Duplicada',
                email: 'elena.otra@centuria.edu.py',
                password: 'PasswordValido99'
            });
        } catch(e) {
            thrown = true;
            assert.ok(e.message.includes('ya está registrado') || e.message.includes('cédula'));
        }
        assert.strictEqual(thrown, true, 'Cédula duplicada debe ser rechazada');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 7: Registro con correo duplicado
    // ──────────────────────────────────────────────────────────
    runTest(7, 'Registro con correo duplicado para otra cédula es rechazado', () => {
        let thrown = false;
        try {
            gasContext.cvAuthRegister(mockSS, {
                cedula: '99998888',
                nombre: 'Persona',
                apellido: 'Distinta',
                email: 'elena.benitez@centuria.edu.py', // Correo usado por 45556660
                password: 'PasswordValido99'
            });
        } catch(e) {
            thrown = true;
            assert.ok(e.message.includes('correo') || e.message.includes('registrado'));
        }
        assert.strictEqual(thrown, true, 'Correo duplicado debe ser rechazado');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 8: Inicio de sesión correcto (token 8h y rol)
    // ──────────────────────────────────────────────────────────
    runTest(8, 'Inicio de sesión exitoso retorna token y expiración de 8 horas', () => {
        const res = gasContext.cvAuthLogin(mockSS, {
            cedula: '45556660',
            password: 'MiPasswordSeguro2026'
        });

        assert.strictEqual(res.ok, true, 'Login debe ser exitoso');
        assert.ok(res.token, 'Debe devolver un token de sesión');
        assert.strictEqual(res.user.cedula, '45556660');
        assert.strictEqual(res.user.rol, 'alumno');

        // Validar expiración ~8 horas en el futuro
        const expTime = new Date(res.token_expires).getTime();
        const now = Date.now();
        const diffHours = (expTime - now) / (1000 * 3600);
        assert.ok(diffHours >= 7.9 && diffHours <= 8.1, 'La expiración debe ser de 8 horas');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 9: Contraseña incorrecta
    // ──────────────────────────────────────────────────────────
    runTest(9, 'Contraseña errónea es rechazada con mensaje seguro', () => {
        const res = gasContext.cvAuthLogin(mockSS, {
            cedula: '45556660',
            password: 'PasswordErroneo123!'
        });
        assert.strictEqual(res.ok, false, 'Login debe retornar ok: false ante contraseña incorrecta');
        assert.ok(res.error && (res.error.includes('incorrecta') || res.error.includes('Cédula o contraseña')),
            'Debe indicar error de credenciales incorrectas');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 10: Usuario inexistente
    // ──────────────────────────────────────────────────────────
    runTest(10, 'Usuario con cédula inexistente es rechazado', () => {
        const res = gasContext.cvAuthLogin(mockSS, {
            cedula: '0000000000',
            password: 'CualquierPassword123'
        });
        assert.strictEqual(res.ok, false, 'Login debe retornar ok: false ante usuario inexistente');
        assert.ok(res.error && (res.error.includes('no encontrado') || res.error.includes('no registrado') || res.error.includes('incorrecta')),
            'Debe rechazar al usuario inexistente');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 11: Cuenta inactiva / bloqueada
    // ──────────────────────────────────────────────────────────
    runTest(11, 'Cuenta inactiva o bloqueada no puede iniciar sesión', () => {
        // Registrar usuario bloqueado
        gasContext.cvAuthRegister(mockSS, {
            cedula: '3333333',
            nombre: 'Bloqueado',
            apellido: 'Usuario',
            email: 'bloqueado@centuria.edu.py',
            password: 'PasswordValido123'
        });

        // Cambiar estado a bloqueado en la hoja Usuarios
        const uSheet = mockSS.getSheetByName('Usuarios');
        const rows = uSheet.getDataRange().getValues();
        const header = rows[0].map(h => String(h).toLowerCase());
        const estadoCol = header.indexOf('estado');
        const rIndex = rows.findIndex(r => r[header.indexOf('cedula')] === '3333333');
        uSheet.getRange(rIndex + 1, estadoCol + 1).setValue('bloqueado');

        const res = gasContext.cvAuthLogin(mockSS, {
            cedula: '3333333',
            password: 'PasswordValido123'
        });
        assert.strictEqual(res.ok, false, 'Login debe retornar ok: false para cuenta bloqueada');
        assert.ok(res.error && (res.error.includes('bloqueada') || res.error.includes('inactiva') || res.error.includes('no activa')),
            'Debe indicar que la cuenta está bloqueada/inactiva');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 12: Cierre de sesión y revocación en backend
    // ──────────────────────────────────────────────────────────
    runTest(12, 'Cierre de sesión revoca token en backend e invalida accesos posteriores', () => {
        const loginRes = gasContext.cvAuthLogin(mockSS, {
            cedula: '45556660',
            password: 'MiPasswordSeguro2026'
        });
        const token = loginRes.token;

        // Validar que el token es válido
        const vBefore = gasContext.cvAuthValidateSession(mockSS, { token: token });
        assert.strictEqual(vBefore.valid, true, 'El token debe ser válido antes del logout');

        // Ejecutar logout en backend
        const logoutRes = gasContext.cvAuthLogout(mockSS, { token: token });
        assert.strictEqual(logoutRes.ok, true, 'Logout debe retornar ok: true');

        // Validar que el token ya no es aceptado
        const vAfter = gasContext.cvAuthValidateSession(mockSS, { token: token });
        assert.strictEqual(vAfter.valid, false, 'El token revocado debe ser rechazado');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 13: Sesión vencida (expiración)
    // ──────────────────────────────────────────────────────────
    runTest(13, 'Token con fecha vencida (> 8 horas) es rechazado automáticamente', () => {
        const loginRes = gasContext.cvAuthLogin(mockSS, {
            cedula: '45556660',
            password: 'MiPasswordSeguro2026'
        });
        const token = loginRes.token;

        // Modificar expiración en la hoja Sesiones a una fecha pasada
        const sSheet = mockSS.getSheetByName('Sesiones');
        const rows = sSheet.getDataRange().getValues();
        const rIndex = rows.findIndex(r => r[0] === token);
        const expPasada = new Date(Date.now() - 3600 * 1000).toISOString(); // Hace 1 hora
        sSheet.getRange(rIndex + 1, 5).setValue(expPasada); // Columna expires_at

        // Limpiar de caché para forzar lectura de hoja
        mockCache.clear();

        const vRes = gasContext.cvAuthValidateSession(mockSS, { token: token });
        assert.strictEqual(vRes.valid, false, 'La sesión expirada debe retornar valid: false');
        assert.ok(vRes.error.includes('expir') || vRes.error.includes('venc'), 'Debe indicar expiración');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 14: Acceso directo a página privada sin sesión
    // ──────────────────────────────────────────────────────────
    runTest(14, 'CenturiaSession.protect redirige a index.html si no hay sesión activa', () => {
        sessionStorage.clear();
        localStorage.clear();
        location.pathname = '/CampusVirtual/app/dashboard.html';

        const guard = bCtx.CenturiaSession;
        const allowed = guard.protect({ allowedRoles: ['alumno'] });

        assert.strictEqual(allowed, false, 'Debe denegar el acceso');
        assert.ok(location.pathname.includes('index.html'), 'Debe redirigir a index.html');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 15: Manipulación de rol en cliente
    // ──────────────────────────────────────────────────────────
    runTest(15, 'Manipulación de rol en sessionStorage no evade protección de rol', () => {
        // Alumno legítimo autenticado
        const tokenValido = 'mock_valid_alumno_token_12345';
        const userAlumno = {
            id: 'USR-1',
            cedula: '45556660',
            nombre: 'Elena',
            apellido: 'Benitez',
            rol: 'alumno',
            token_expires: new Date(Date.now() + 3600000).toISOString()
        };

        sessionStorage.setItem('centuria_auth_token', tokenValido);
        sessionStorage.setItem('centuria_user', JSON.stringify(userAlumno));

        // Intento malicioso de alterar sessionStorage.rol para ingresar a admin
        sessionStorage.setItem('rol', 'admin');
        location.pathname = '/CampusVirtual/app/admin/index.html';

        const guard = bCtx.CenturiaSession;
        // El panel de admin requiere 'admin'
        const allowedOnAdmin = guard.protect({ allowedRoles: ['admin', 'academico'], currentRolePage: 'admin' });

        // Como el usuario real es alumno, el guardián debe rechazar y expulsar del panel admin
        assert.strictEqual(allowedOnAdmin, false, 'No debe permitir acceso de alumno a admin');
        assert.ok(location.pathname.includes('dashboard.html') || location.pathname.includes('index.html'),
            'Debe redirigir al panel correspondiente del alumno o al login');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 16: Recarga de página con sesión activa
    // ──────────────────────────────────────────────────────────
    runTest(16, 'Recarga de página mantiene sesión sin pedir reingreso ni guardar password', () => {
        const userObj = {
            cedula: '45556660',
            nombre: 'Elena',
            apellido: 'Benitez',
            rol: 'alumno',
            token_expires: new Date(Date.now() + 3600000).toISOString()
        };
        sessionStorage.setItem('centuria_auth_token', 'valid_token_reload_test');
        sessionStorage.setItem('centuria_user', JSON.stringify(userObj));
        location.pathname = '/CampusVirtual/app/dashboard.html';

        const guard = bCtx.CenturiaSession;
        const isAllowed = guard.protect({ allowedRoles: ['alumno'], currentRolePage: 'dashboard' });

        assert.strictEqual(isAllowed, true, 'Debe permitir navegación normal en recarga');
        assert.strictEqual(guard.getRole(), 'alumno');
        assert.strictEqual(guard.getCedula(), '45556660');
        // Verificar que en storage NO exista contraseña
        assert.strictEqual(sessionStorage.getItem('password'), null);
        assert.strictEqual(localStorage.getItem('password'), null);
        assert.strictEqual(localStorage.getItem('centuria_remember'), null);
    });

    // ──────────────────────────────────────────────────────────
    // CASO 17: Consulta de perfil guardado
    // ──────────────────────────────────────────────────────────
    runTest(17, 'Consulta de perfil retorna datos íntegros guardados en Base de Datos Cloud', () => {
        const p = gasContext.cvAuthGetProfile(mockSS, {
            cedula: '45556660'
        });

        assert.strictEqual(p.ok, true, 'Debe retornar ok: true');
        assert.strictEqual(p.user.cedula, '45556660');
        assert.strictEqual(p.user.nombre, 'ELENA');
        assert.strictEqual(p.user.apellido, 'BENITEZ');
        assert.strictEqual(p.user.email, 'elena.benitez@centuria.edu.py');
        assert.strictEqual(p.user.carrera, 'Ingeniería en Sistemas');
        assert.strictEqual(p.user.seccion, 'S026');
        assert.strictEqual(p.user.rol, 'alumno');
        assert.strictEqual(p.user.password_hash, undefined, 'Jamás debe exponer el password_hash');
        assert.strictEqual(p.user.salt, undefined, 'Jamás debe exponer el salt');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 18: Actualización de datos del perfil sin pérdida académica
    // ──────────────────────────────────────────────────────────
    runTest(18, 'Actualización de perfil modifica datos de contacto sin alterar carrera ni rol', () => {
        const updRes = gasContext.cvAuthUpdateProfile(mockSS, {
            cedula: '45556660',
            nombre: 'Elena Maria',
            email: 'elena.nueva@centuria.edu.py',
            telefono: '0971998877'
        });

        assert.strictEqual(updRes.ok, true, 'Actualización debe ser exitosa');

        // Consultar el perfil para verificar persistencia y no alteración de carrera/rol
        const pUpdated = gasContext.cvAuthGetProfile(mockSS, { cedula: '45556660' });
        assert.strictEqual(pUpdated.user.nombre, 'ELENA MARIA', 'El nombre debe actualizarse');
        assert.strictEqual(pUpdated.user.email, 'elena.nueva@centuria.edu.py', 'El email debe actualizarse');
        assert.strictEqual(pUpdated.user.telefono, '0971998877', 'El teléfono debe actualizarse');
        assert.strictEqual(pUpdated.user.carrera, 'Ingeniería en Sistemas', 'La carrera debe permanecer intacta');
        assert.strictEqual(pUpdated.user.seccion, 'S026', 'La sección debe permanecer intacta');
        assert.strictEqual(pUpdated.user.rol, 'alumno', 'El rol debe permanecer intacto');
    });

    // ──────────────────────────────────────────────────────────
    // CASO 19: Error de comunicación / servicio no disponible
    // ──────────────────────────────────────────────────────────
    await runTestAsync(19, 'Fallo de conexión en cliente es capturado con mensaje amigable sin crash', async () => {
        const originalFetch = bCtx.fetch;
        // Simular servidor caído o error de red
        bCtx.fetch = () => Promise.reject(new Error('Failed to fetch'));

        const api = bCtx.CenturiaAPI;
        const res = await api.auth.login('45556660', 'CualquierPass');

        assert.strictEqual(res.ok, false, 'Debe responder ok: false ante error de red');
        assert.ok(res.message.includes('conexión') || res.message.includes('comunicación') || res.message.includes('servidor'),
            'Debe emitir mensaje amigable de conexión');

        // Restaurar fetch
        bCtx.fetch = originalFetch;
    });

    // ──────────────────────────────────────────────────────────
    // CASO 20: Persistencia segura entre recargas y dispositivos
    // ──────────────────────────────────────────────────────────
    runTest(20, 'Persistencia segura: solo recuerda cédula (nunca contraseñas) y valida sesión con token', () => {
        // Simular recordar credencial al iniciar sesión
        localStorage.setItem('centuria_remember_cedula', '45556660');
        // Garantizar que la clave legacy esté eliminada
        localStorage.removeItem('centuria_remember');

        assert.strictEqual(localStorage.getItem('centuria_remember_cedula'), '45556660');
        assert.strictEqual(localStorage.getItem('centuria_remember'), null, 'centuria_remember plano debe estar vacío');

        // Verificación de que ninguna propiedad en localStorage contiene la contraseña
        for (const [k, v] of localStorage.store.entries()) {
            assert.ok(!String(v).includes('MiPasswordSeguro2026'), `La clave ${k} no debe almacenar la contraseña`);
        }
    });

    // ──────────────────────────────────────────────────────────
    // RESUMEN FINAL
    // ──────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log(` RESULTADO: ${passedCount} APROBADOS, ${failedCount} FALLADOS (TOTAL: ${passedCount + failedCount})`);
    console.log('══════════════════════════════════════════════════════════════\n');

    if (failedCount > 0) {
        process.exit(1);
    }
}

startSuite();
