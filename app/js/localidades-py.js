/**
 * localidades-py.js — Cliente de la API estática de localidades de Paraguay
 * Departamentos → Ciudades (distritos) → Barrios/Localidades, con códigos DGEEC.
 *
 * Navegador:
 *   <script src="localidades-py.js"></script>
 *   LocalidadesPY.configurar({ base: 'https://mi-sitio/datos/' });   // opcional: por defecto <carpeta del script>/datos/
 *   const deps = await LocalidadesPY.departamentos();                // [{c:0,n:'CAPITAL'}, ...]
 *   const ciu  = await LocalidadesPY.ciudades(11);                   // ciudades de CENTRAL  → [{c:1101,d:11,n:'AREGUA'}, ...]
 *   const bar  = await LocalidadesPY.barrios(1111);                  // barrios de la ciudad → [{c:1111xxx,n:'...',a:1}, ...]
 *
 * Node (>=18):
 *   const L = require('./localidades-py.js');
 *   L.configurar({ base: __dirname + '/datos/' });                   // lee los .json del disco
 *
 * Códigos: departamento 0..17 (0=Capital) · ciudad = dep*100 + nro (Asunción=0) · barrio = "código concatenado" DGEEC.
 * Área (a): 1 urbana · 3 suburbana · 6 rural.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(root);
    else root.LocalidadesPY = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
    'use strict';

    var AREAS = { 1: 'URBANA', 3: 'SUBURBANA', 6: 'RURAL' };
    var cfg = { base: null };
    var memo = {};

    // Carpeta del script (para el valor por defecto de base en navegador)
    var scriptDir = null;
    try {
        var cs = root.document && root.document.currentScript;
        if (cs && cs.src) scriptDir = cs.src.replace(/[^\/]*$/, '');
    } catch (e) {}

    function base() {
        if (cfg.base) return cfg.base;
        if (scriptDir) return scriptDir + 'datos/';
        return 'datos/';
    }

    function leer(rel) {
        var b = base();
        if (typeof fetch === 'function' && (root.document || /^https?:/i.test(b))) {
            return fetch(b + rel).then(function (r) {
                if (!r.ok) throw new Error('LocalidadesPY: no se pudo leer ' + rel + ' (' + r.status + ')');
                return r.json();
            });
        }
        // Node: lectura desde disco
        return new Promise(function (ok, fail) {
            try { ok(JSON.parse(require('fs').readFileSync(b + rel, 'utf8'))); } catch (e) { fail(e); }
        });
    }

    function cargar(rel) {
        if (!memo[rel]) {
            memo[rel] = leer(rel).catch(function (e) { delete memo[rel]; throw e; });
        }
        return memo[rel];
    }

    function norm(t) {
        return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
    }

    var API = {
        version: '1.0.0',
        AREAS: AREAS,

        /** Cambia la ubicación de los .json: configurar({ base: 'https://.../datos/' }) */
        configurar: function (opciones) {
            if (opciones && opciones.base) { cfg.base = opciones.base.replace(/([^\/\\])$/, '$1/'); memo = {}; }
            return API;
        },

        /** [{c, n}] — 18 registros (0 = CAPITAL) */
        departamentos: function () { return cargar('departamentos.json'); },

        /** [{c, d, n}] — todas las ciudades, o solo las del departamento indicado */
        ciudades: function (departamento) {
            return cargar('distritos.json').then(function (lista) {
                if (departamento === undefined || departamento === null || departamento === '') return lista;
                var d = Number(departamento);
                return lista.filter(function (x) { return x.d === d; });
            });
        },

        /** [{c, n, a}] — barrios/localidades de una ciudad (por código de ciudad) */
        barrios: function (ciudad) {
            if (ciudad === undefined || ciudad === null || ciudad === '') return Promise.resolve([]);
            return cargar('barrios/' + Number(ciudad) + '.json');
        },

        /** Metadatos y conteos */
        info: function () { return cargar('index.json'); },

        /** Busca un departamento/ciudad/barrio por nombre (sin distinguir tildes ni mayúsculas) dentro de una lista */
        buscarPorNombre: function (lista, nombre) {
            var k = norm(nombre);
            for (var i = 0; i < lista.length; i++) if (norm(lista[i].n) === k) return lista[i];
            return null;
        }
    };
    API.distritos = API.ciudades;   // alias
    return API;
});
