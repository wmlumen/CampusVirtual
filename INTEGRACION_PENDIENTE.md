# 📋 INTEGRACIÓN PENDIENTE - Tesorería y Gestión de Estudiantes

## ✅ YA COMPLETADO

### 1️⃣ API Methods (app/js/api.js)
- ✅ `CenturiaAPI.tesoreria.listarEstudiantes()`
- ✅ `CenturiaAPI.tesoreria.asignarExoneracion()`
- ✅ `CenturiaAPI.tesoreria.registrarPago()`
- ✅ `CenturiaAPI.tesoreria.obtenerHistorialPagos()`
- ✅ `CenturiaAPI.tesoreria.reporteCobranzas()`
- ✅ `CenturiaAPI.gestionEstudiantes.actualizarRUC()`
- ✅ `CenturiaAPI.gestionEstudiantes.darDeBaja()`
- ✅ `CenturiaAPI.gestionEstudiantes.bloquearEstudiante()`
- ✅ `CenturiaAPI.gestionEstudiantes.desbloquearEstudiante()`
- ✅ `CenturiaAPI.gestionEstudiantes.obtenerEstado()`
- ✅ `CenturiaAPI.gestionEstudiantes.listarBajas()`

### 2️⃣ Interfaces HTML
- ✅ `app/admin/sections/tesoreria.html` (Pagos, Exoneraciones, Estudiantes)
- ✅ `app/admin/sections/gestion-estudiantes.html` (RUC, Bajas, Bloqueos)

### 3️⃣ Funciones de Validación
- ✅ `verificarEstadoEstudiante(cedula)` - Valida estado en login
- ✅ `mostrarBloqueado(motivo, fecha)` - Modal de bloqueo

### 4️⃣ Sección RUC en Perfil
- ✅ `editarRUC()`, `guardarRUC()`, `cargarRUC()` - Gestión de RUC

---

## 🔧 PRÓXIMOS PASOS DE INTEGRACIÓN

### PASO 1️⃣: Agregar botones al sidebar de admin
**Archivo:** `app/admin/index.html` (línea ~100)

```html
<!-- Después del botón de Configuración, agregar: -->
<button @click="switchTab('tesoreria')" 
    :class="activeTab==='tesoreria' ? 'tab-active' : 'tab-inactive'"
    class="text-left px-6 py-3 text-xs flex items-center gap-3 transition-colors">
    <i class="bi bi-credit-card-fill text-base"></i> Tesorería
</button>

<button @click="switchTab('estudiantes-gestion')" 
    :class="activeTab==='estudiantes-gestion' ? 'tab-active' : 'tab-inactive'"
    class="text-left px-6 py-3 text-xs flex items-center gap-3 transition-colors">
    <i class="bi bi-shield-check-fill text-base"></i> Gestión Estudiantes
</button>
```

### PASO 2️⃣: Cargar secciones dinámicamente
**Archivo:** `app/admin/js/admin.js`

En la función `switchTab()`, agregar:

```javascript
case 'tesoreria':
    loadSection('tesoreria');
    break;
case 'estudiantes-gestion':
    loadSection('gestion-estudiantes');
    break;
```

### PASO 3️⃣: Validación en login
**Archivo:** `app/index.html` o donde esté el login

Después de validar credenciales exitosas:

```javascript
if (loginExitoso) {
    const user = CenturiaAPI.getCurrentUser();
    if (user.rol === 'alumno') {
        const puedeAcceder = await verificarEstadoEstudiante(user.cedula);
        if (!puedeAcceder) {
            return; // Mostrado modal de bloqueo
        }
    }
    window.location.href = 'dashboard.html';
}
```

Incluir funciones de `verificarEstadoEstudiante` y `mostrarBloqueado`.

### PASO 4️⃣: Campo RUC en perfil
**Archivo:** `app/perfil.html`

Agregar sección antes de los formularios:

```html
<div class="sec">
    <div class="sec-title"><i class="bi bi-file-earmark"></i> Datos de Facturación</div>
    <p class="text-gray-600 text-xs mb-4">El RUC es recomendado para facturación</p>
    
    <div class="form-group">
        <label for="ruc">RUC (Registro Único Contribuyente)</label>
        <div class="flex gap-2">
            <input type="text" id="ruc" placeholder="Ej: 12345678-9" 
                class="flex-1 px-3 py-2 border rounded text-sm" readonly>
            <button @click="editarRUC()" class="px-4 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                Editar
            </button>
        </div>
    </div>
</div>
```

En `DOMContentLoaded`, agregar:
```javascript
cargarRUC(); // Cargar RUC del perfil
```

---

## 📊 FLUJO DE NEGOCIO

### Bloqueo de Estudiante:
```
Alumno no paga
    ↓
Tesorería registra pago faltante
    ↓
Admin/Tesorería bloquea estudiante
    ↓
Siguiente login: verificarEstadoEstudiante()
    ↓
Si BLOQUEADO: Mostrar modal → Denegar acceso
Si ACTIVO: Permitir acceso
```

### Exoneración Flexible:
```
Alumno recibe beca del 25%
    ↓
Tesorería asigna exoneración (25%, "Beca", "Cuotas")
    ↓
Backend aplica descuento SOLO a cuotas
    ↓
Otros gastos NO tienen descuento
```

---

## 💾 BACKEND PENDIENTE (Google Apps Script)

Se necesitan implementar estas funciones:

| Función | Descripción |
|---------|-------------|
| `tesoreria_listar_estudiantes()` | Listar con cálculos de pendiente |
| `tesoreria_asignar_exoneracion()` | Guardar exoneración flexible |
| `tesoreria_registrar_pago()` | Registrar pago con comprobante |
| `tesoreria_obtener_historial()` | Historial de pagos del alumno |
| `estudiante_actualizar_ruc()` | Guardar RUC en base de datos |
| `estudiante_dar_de_baja()` | Cambiar estado a BAJA |
| `estudiante_bloquear()` | Cambiar estado a BLOQUEADO |
| `estudiante_desbloquear()` | Cambiar estado a ACTIVO |
| `estudiante_obtener_estado()` | Validar en login |

---

## 💰 DETALLES TÉCNICOS

**Moneda:** Gs. (Guaraníes)
```javascript
const formatoGs = (monto) => monto.toLocaleString('es-PY') + ' Gs.';
```

**Estados:**
- `ACTIVO` - Puede acceder
- `BLOQUEADO` - Sin acceso (muestra motivo)
- `BAJA` - Retirado del sistema

**Roles que asignan exoneraciones:**
- Académico ✅
- Tesorería ✅
- Admin ✅

**Exoneración selectiva:**
- Aplica a: Cuotas, algunos gastos
- NO aplica a: Otros costos

---

## 📝 CHECKLIST FINAL

- [ ] Botones Tesorería + Gestión Estudiantes en sidebar
- [ ] switchTab() actualizado con casos new
- [ ] Validación de estado en login
- [ ] Sección RUC en perfil.html
- [ ] Llamadas a cargarRUC() en DOMContentLoaded
- [ ] Backend GAS implementado
- [ ] Pruebas de flujo completo
- [ ] Pruebas de exoneración selectiva


---

## 🏦 ARQUEO DE CAJA (Nuevo)

**Fecha:** 19 Septiembre 2026
**Estado:** ✅ Interfaz HTML + API Methods (frontend completo)

### CARACTERÍSTICAS

✅ **Períodos flexibles:**
- Hoy
- Esta Semana  
- Este Mes
- Este Semestre
- Este Año
- Rango personalizado (desde-hasta)

✅ **Segmentación:**
- General (total sin segmentación)
- Por Carrera
- Por Grado
- Por Sección
- Por Carrera + Grado

✅ **Métricas por segmento:**
- Cantidad de pagos
- Monto total ingresado
- Pago promedio
- Monto mínimo y máximo
- Porcentaje del total

✅ **Características:**
- Resumen general con 4 KPIs
- Tabla de segmentación dinámmica
- Gráfico de distribución (barras)
- Detalle de pagos por segmento
- Descarga CSV

### API METHODS AGREGADOS

```javascript
CenturiaAPI.tesoreria.arqueoCaja(fechaDesde, fechaHasta, segmentarPor)
  → Retorna: {general: {...}, segmentado: [...]}

CenturiaAPI.tesoreria.obtenerPagosPorSegmento(segmentoId)
  → Retorna: Array de pagos con detalles

CenturiaAPI.tesoreria.reporteArqueoDetallado(fechaDesde, fechaHasta, formato)
  → Retorna: Reporte multi-vista (json|csv|pdf)

CenturiaAPI.tesoreria.arqueoDiscrepancias(fechaDesde, fechaHasta)
  → Retorna: Array de inconsistencias detectadas
```

### ARCHIVO GENERADO

```
✅ app/admin/sections/arqueo-caja.html (500+ líneas)
```

### PRÓXIMO PASO DE INTEGRACIÓN

Agregar botón al sidebar de admin:

```html
<button @click="switchTab('arqueo-caja')" 
    :class="activeTab==='arqueo-caja' ? 'tab-active' : 'tab-inactive'"
    class="text-left px-6 py-3 text-xs flex items-center gap-3 transition-colors">
    <i class="bi bi-calculator-fill text-base"></i> Arqueo de Caja
</button>
```

En `switchTab()`:
```javascript
case 'arqueo-caja':
    loadSection('arqueo-caja');
    break;
```

---
