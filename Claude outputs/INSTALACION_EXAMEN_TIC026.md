# 📦 INSTALACIÓN: Examen Parcial TIC026

## ✅ CHECKLIST FINAL

Sigue estos pasos en orden:

---

## **PASO 1: Copiar archivos HTML a GitHub**

### Archivo: `examen_parcial_tic026.html`

**Ubicación local:**
```
C:\Users\HP 250 G10\Documents\GITHUT\Centuria\CampusVirtual\app\academic\examen_parcial_tic026.html
```

**Pasos:**
1. Copia el contenido de `examen_parcial_tic026.html`
2. Pégalo en tu carpeta local
3. Commit a Git:
   ```bash
   git add app/academic/examen_parcial_tic026.html
   git commit -m "agregar examen parcial TIC026 v08.5"
   git push origin main
   ```

**Verificación:**
- ✅ Archivo en GitHub: https://github.com/wmlumen/CampusVirtual/blob/main/app/academic/examen_parcial_tic026.html

---

## **PASO 2: Agregar funciones a Apps Script**

### Archivo: `examenes_tic026.gs`

**En tu proyecto de Apps Script:**
1. Abre: https://script.google.com/u/0/home/projects/1YhGBS2FNoooT16E0CuWJhT70gQBXSt5rJX8jLB-pT0JtCtZfJ5RZ5HTH/edit
2. Click en "+" para crear nuevo archivo
3. Nombre: `examenes_tic026.gs`
4. Copia TODO el contenido de `examenes_tic026.gs` que creé
5. Pega en el editor
6. Click en **"Guardar"** (Ctrl+S)
7. Click en **"Implementar"** → **Nueva versión**
8. Espera a que se guarde ✅

---

## **PASO 3: Crear estructura de Google Sheets**

### Google Sheet: [Tu Sheet aquí]
URL: https://docs.google.com/spreadsheets/d/1uryk-XaMqH4_I3BHT4vYNTQmtQBhpq011dH_Ny483_Y/edit

**Crear 4 hojas (tabs):**

### **Hoja 1: ConfigExamen**
| ID | Codigo | Nombre | MaxIntentos | TotalPreguntas | PuntajeMaximo | FechaInicio | FechaFin | Estado |
|----|--------|--------|-------------|-----------------|---------------|-------------|----------|--------|
| 1 | TIC026 | Examen Parcial | 2 | 20 | 100 | 2026-09-22 | 2026-12-31 | Activo |

### **Hoja 2: InventarioPreguntas** 
| ID | Codigo | Numero | Pregunta | OpcionA | OpcionB | OpcionC | OpcionD | RespuestaCorrecta | Puntos |
|----|--------|--------|----------|---------|---------|---------|---------|------------------|--------|
| 1 | TIC026 | 1 | ¿Cuál es el dispositivo principal? | Memoria RAM | **Procesador** | Disco Duro | Fuente de Poder | B | 5 |
| 2 | TIC026 | 2 | ¿Qué significa TIC? | **Tecnologías de la Información y la Comunicación** | Tecnologías de Internet y Comercio | Técnicas de Ingeniería | Telecomunicaciones | A | 5 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

*Las 20 preguntas están en el HTML*

### **Hoja 3: RespuestasAlumnos** (se llena automáticamente)
| Cédula | Nombre | Apellido | Carrera | Sección | CodigoExamen | Intento | Respuestas | Puntaje | Timestamp |
|--------|--------|----------|---------|---------|-------------|---------|-----------|---------|-----------|

### **Hoja 4: ResultadosFinal** (se llena automáticamente)
| Cédula | Nombre | Apellido | Carrera | Sección | CodigoExamen | IntentosRealizados | ÚltimoIntento | MejorPuntaje | Estado | AprobadoReprobado |
|--------|--------|----------|---------|---------|-------------|-------------------|--------------|--------------|--------|------------------|

---

## **PASO 4: Enlazar HTML a Apps Script**

En el archivo `examen_parcial_tic026.html`, busca esta línea (aprox línea 430):

```javascript
const response = await fetch('/api/examen/guardar', {
```

Reemplázala con la URL de tu Apps Script desplegado:

```javascript
const response = await fetch('https://script.google.com/macros/d/[TU_DEPLOYMENT_ID]/usercopy', {
```

**Para obtener tu Deployment ID:**
1. En Apps Script → Click en "Implementar" → "Nueva implementación"
2. Tipo: "Aplicación web"
3. Ejecutar como: Tu cuenta
4. Quién tiene acceso: "Cualquiera"
5. Click en "Implementar"
6. Copia la URL que sale, extrae el ID

---

## **PASO 5: Probar el examen**

### Test 1: Acceso local
```bash
# En tu navegador local
file:///C:/Users/HP%20250%20G10/Documents/GITHUT/Centuria/CampusVirtual/app/academic/examen_parcial_tic026.html
```

### Test 2: Desde GitHub Pages
```
https://wmlumen.github.io/CampusVirtual/app/academic/examen_parcial_tic026.html
```

### Test 3: Desde Campus Virtual
```
https://wmlumen.github.io/CampusVirtual/app/alumno/index.html
# → Click en "Exámenes" → "Examen Parcial TIC026"
```

**Datos de prueba:**
- Código: `TIC026` (obligatorio)
- Nombre: `Juan Pérez`
- Cédula: `12345678`
- Carrera: `Administración de Empresa`
- Sección: `S026`
- Respuestas: Elige cualquier opción
- Esperado: Se guarda en Google Sheet + puntaje aparece

---

## **PASO 6: Integración con Campus Virtual**

### Agregar enlace en `app/alumno/index.html` (tab "Exámenes")

Busca la sección de exámenes y agrega:

```html
<div class="examen-card">
    <h4>Examen Parcial TIC026</h4>
    <p>Tecnologías de la Información y la Comunicación</p>
    <p class="meta">20 preguntas | 100 puntos | 2 intentos</p>
    <a href="../academic/examen_parcial_tic026.html" class="btn btn-primary">
        <i class="bi bi-pencil-square"></i> COMENZAR
    </a>
</div>
```

### Agregar panel docente en `app/docente.html`

Agrega sección "Resultados de Exámenes":

```html
<div class="panel-examen">
    <h3>Examen Parcial TIC026</h3>
    <table id="tablaResultados">
        <thead>
            <tr>
                <th>Alumno</th>
                <th>Cédula</th>
                <th>Puntaje</th>
                <th>Aprobado</th>
                <th>Intentos</th>
            </tr>
        </thead>
        <tbody id="bodyResultados"></tbody>
    </table>
</div>

<script>
    // Cargar resultados
    const api = new CenturiaAPI();
    api.examen.listarResultados('TIC026').then(data => {
        const tbody = document.getElementById('bodyResultados');
        data.resultados.forEach(r => {
            tbody.innerHTML += `
                <tr>
                    <td>${r.nombre} ${r.apellido}</td>
                    <td>${r.cedula}</td>
                    <td><strong>${r.puntaje}</strong></td>
                    <td>${r.aprobado ? '✓ Aprobado' : '✗ Reprobado'}</td>
                    <td>${r.intentos}</td>
                </tr>
            `;
        });
    });
</script>
```

---

## **🐛 TROUBLESHOOTING**

| Problema | Solución |
|----------|----------|
| El examen no carga | Verifica que `CenturiaSession.protect()` está presente |
| Error al guardar respuestas | Verifica que Apps Script está desplegado correctamente |
| Google Sheet vacío | Ejecuta `crearHojasExamen()` en Apps Script |
| Código TIC026 no funciona | Verifica que escribiste exactamente "TIC026" (mayúsculas) |
| El puntaje no se guarda | Verifica que Google Sheet tiene permiso de escritura |

---

## **📊 VISTA FINAL**

Después de todo instalado:

```
Campus Virtual v08.5
├── app/
│   ├── academic/
│   │   ├── examen_parcial_tic026.html ← NUEVO
│   │   ├── criterios_evaluacion.html
│   │   └── ...
│   ├── alumno/
│   │   ├── index.html (con enlace al examen)
│   │   └── ...
│   └── docente.html (con resultados)
├── Backend_Scripts/
│   ├── 01_Script_Cloud_Completo.gs
│   ├── 02_Examenes_Factura.gs
│   └── examenes_tic026.gs ← NUEVO
├── Google Sheets
│   ├── ConfigExamen
│   ├── InventarioPreguntas
│   ├── RespuestasAlumnos
│   └── ResultadosFinal
```

---

## ✅ **RESUMEN RÁPIDO**

1. ✅ Copia `examen_parcial_tic026.html` a local + GitHub
2. ✅ Agrega `examenes_tic026.gs` a Apps Script
3. ✅ Crea 4 hojas en Google Sheet
4. ✅ Enlaza HTML a Apps Script
5. ✅ Prueba con datos de test
6. ✅ Integra en Campus Virtual

**Tiempo estimado: 30 minutos**

---

## 🚀 **¡LISTO!**

Cuando termines todo, el examen estará:
- ✅ Funcional
- ✅ Guardando datos automáticamente
- ✅ Contabilizando intentos
- ✅ Calculando mejor puntaje
- ✅ Disponible en Campus Virtual

¿Necesitas ayuda en algún paso? 👍
