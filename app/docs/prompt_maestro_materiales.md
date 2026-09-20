# Prompt Maestro para Materiales de Clase — v3.0

> **Este archivo contiene las reglas de generación de materiales de clase.**
> **La documentación técnica completa del sistema se encuentra en `PROMPT_MAESTRO.md`.**

---

## Referencia al prompt maestro

Para información sobre:
- Arquitectura del sistema
- Base de datos y esquemas
- APIs y endpoints
- Sistema de sincronización
- Usuarios y roles
- Seguridad y permisos
- Roadmap de desarrollo

Consultar: **`PROMPT_MAESTRO.md`**

---

## Reglas de generación de materiales

### Estructura de archivos
```
Materiales_Clases/
├── index.html
├── programa.html
├── planilla.html
├── glosario.html
├── Unidad_01.html ... Unidad_10.html
```

### Reglas obligatorias

1. **Una sola `<h2>` por archivo** = título de la unidad
2. **`<h3>` solo para temas**, `<h4>` para subtemas
3. **Conceptos resaltados:** `<strong>Término:</strong> Definición`
4. **Listas alfabéticas:** `<h4><strong>A. Título</strong></h4>` seguido de `<ul><li>`
5. **Tablas Bootstrap:** `<table class="table table-bordered table-striped">`
6. **Cards verticales:** `<div class="card shadow-sm border-start border-4 mb-3 col-12">`
7. **Bibliografía obligatoria:** Básica + Complementaria al final
8. **Siglas con tooltip:** `<span class="sigla" data-bs-toggle="tooltip" title="...">SIGLA</span>`
9. **Anclas internas:** `id="def-termino"` y `href="#def-termino"`
10. **Sidebar con 10 unidades** + programa + planilla + glosario
11. **Botón "Marcar como Leído"** por card
12. **Botón "Confirmar Lección"** al final
13. **Navegación lineal:** Unidad Anterior / Siguiente Unidad
14. **Session guard:** Redirigir a login si no hay sesión
15. **Plantilla base:** Copiar `Unidad_05.html` como estructura

### Validación

Antes de entregar, verificar:
- `count(<h2>) == 1`
- `count(<strong>...:</strong>) >= 8`
- `count(<table>) >= 1`
- `count(card shadow-sm border-start border-4) >= 2`
- `Bibliografía Básica` y `Bibliografía Complementaria` presentes
- `count(data-bs-toggle="tooltip") >= 5`
- `count(id="def-") >= 5` y `count(href="#def-") >= 3`
- `count(menu-clase) == 10`
- `Unidad Anterior` presente
- `count(Marcar como Leído) >= 8` y `Confirmar Lección` presente

### Fuentes de verdad
1. `prompt_unificado.css` — Único CSS válido
2. `Unidad_05.html` — GOLD STANDARD estructural
3. `Plan_de_Estudio_TIC.md` — Contenido oficial
4. Este prompt

---

## Variables para personalizar

```yaml
ASIGNATURA: "TIC"
ASIGNATURA_COMPLETA: "Tecnología de la Información y Comunicación"
CODIGO: "ADE18"
CARRERA: "Administración de Empresas"
NUM_UNIDADES: 10
```

---

## Base de Datos Cloud (_SSOT__)

- URL: `https://script.google.com/macros/s/AKfycbwRHS9q7fDrXio1o4BxtQVtXqJwkyT7wq0shvIaVksL8Rp-0J2NguBe2cDu6iO0fBm4EQ/exec`
- Hoja: `1TRxrgXIojONTrszwF9cmgJn75qx-zUbacjRzwrT8xeo`
- Prohibido usar URLs o IDs diferentes

---

## Sesión y seguridad

- `sessionStorage` para sesión (nunca `localStorage`)
- Guard en cada página: `if(!sessionStorage.getItem('current_cedula')){location.replace('../index.html');}`
- Logout: `sessionStorage.clear(); localStorage.removeItem('centuria_remember');`
- Cédula sin puntos ni guiones

---

Fecha de actualización: 2026-09-15
Última versión: v3.0
Referencia técnica: `PROMPT_MAESTRO.md`
