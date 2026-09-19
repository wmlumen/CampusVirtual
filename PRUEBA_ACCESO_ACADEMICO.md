# 🧪 PRUEBA DEL ACCESO ACADÉMICO - Campus Virtual Centuria

**Objetivo:** Verificar que el usuario Académico puede acceder y que funcionan todos los elementos

---

## 📋 DATOS DE LOGIN

| Campo | Valor |
|---|---|
| **URL** | https://wmlumen.github.io/CampusVirtual/app/index.html |
| **Cédula** | 888888888 |
| **Contraseña** | academico123 |
| **Rol** | Acceso Académico |
| **Email** | wmlumen@gmail.com |

---

## 🔐 PASO 1: ACCEDER AL LOGIN

1. Abrir navegador
2. Ir a: **https://wmlumen.github.io/CampusVirtual/app/index.html**
3. Debe mostrar pantalla de login

```
┌─────────────────────────────────┐
│   CAMPUS VIRTUAL CENTURIA       │
│                                 │
│   [Buscar mi registro]          │
│                                 │
│   Ingresa tu cédula:            │
│   ├─────────────────────────┤   │
│   │ 888888888               │   │
│   └─────────────────────────┘   │
│                                 │
│   [Buscar] [Registrarse]        │
└─────────────────────────────────┘
```

---

## 🔑 PASO 2: INGRESAR CÉDULA

1. En campo "Ingresa tu cédula" escribir: **888888888**
2. Click en botón **[Buscar mi registro]**
3. Debe mostrar nombre: "Usuario Académico"

```
┌─────────────────────────────────┐
│   Bienvenido(a) Usuario         │
│   Académico                     │
│                                 │
│   Ingresa tu contraseña:        │
│   ├─────────────────────────┤   │
│   │ •••••••••••             │   │
│   └─────────────────────────┘   │
│                                 │
│   [Ingresar al Portal]          │
└─────────────────────────────────┘
```

---

## 🔓 PASO 3: INGRESAR CONTRASEÑA

1. En campo "Ingresa tu contraseña" escribir: **academico123**
2. Click en **[Ingresar al Portal]**
3. Debe redirigir a dashboard académico

---

## ✅ PASO 4: VERIFICAR DASHBOARD ACADÉMICO

Después de login, debe mostrar:

### A. Barra de Navegación
- ✅ Logo Campus Virtual
- ✅ Nombre del usuario: "Usuario Académico"
- ✅ Opciones de menú
- ✅ Botón cerrar sesión

### B. Sidebar (Menú Izquierdo)
Debe mostrar opciones según rol Académico:

```
├─ 📊 Dashboard
├─ 📚 Cursos/Asignaturas
├─ 👥 Estudiantes
├─ 📋 Calificaciones
├─ 📅 Calendario
├─ 📄 Reportes
├─ ⚙️ Configuración
└─ 🚪 Cerrar Sesión
```

### C. Área Principal

#### 1️⃣ Tarjeta de Bienvenida
```
┌─────────────────────────────┐
│ Bienvenido, Usuario Académico│
│                              │
│ Última conexión: [fecha/hora]│
│ Rol: Acceso Académico        │
└─────────────────────────────┘
```

#### 2️⃣ Estadísticas (KPIs)
```
┌──────────────┐ ┌──────────────┐
│ 12 Estudiantes│ │ 5 Asignaturas│
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ 24 Asistencias│ │ 85% Promedio │
└──────────────┘ └──────────────┘
```

#### 3️⃣ Tabla de Cursos
```
┌─────────────────────────────────────┐
│ Asignaturas Asignadas               │
├─────────────┬──────────┬────────────┤
│ Asignatura  │ Carrera  │ Sección    │
├─────────────┼──────────┼────────────┤
│ Matemática  │ Admón.   │ S026       │
│ Contabilidad│ Contab.  │ LV026      │
│ Sistemas    │ Sistemas │ MJ026      │
└─────────────┴──────────┴────────────┘
```

---

## 🧪 PASO 5: PROBAR ELEMENTOS

### ✅ Elemento 1: Ver Estudiantes

1. Click en menú **👥 Estudiantes**
2. Debe mostrar lista de estudiantes
3. Verificar columnas:
   - Cédula
   - Nombre
   - Apellido
   - Carrera
   - Grado
   - Email
   - Estado (Activo/Bloqueado/Baja)

**Resultado esperado:**
```
✅ Carga correctamente
✅ Muestra datos de estudiantes
✅ Filtros funcionan (por carrera, grado, sección)
✅ Pagination funciona
```

### ✅ Elemento 2: Calificaciones

1. Click en menú **📋 Calificaciones**
2. Debe mostrar tabla de calificaciones
3. Verificar:
   - Estudiante
   - Asignatura
   - Nota parcial 1, 2
   - Nota final
   - Estado (Aprobado/Reprobado)

**Resultado esperado:**
```
✅ Carga correctamente
✅ Muestra notas por asignatura
✅ Cálculo correcto de promedios
✅ Exportar CSV funciona
```

### ✅ Elemento 3: Asistencia

1. Click en menú **📅 Asistencia**
2. Debe mostrar registro de asistencias
3. Verificar:
   - Fecha
   - Hora
   - Estudiante
   - Estado (Presente/Ausente)
   - Observaciones

**Resultado esperado:**
```
✅ Carga correctamente
✅ Filtros por fecha, estudiante
✅ Estadísticas de asistencia
✅ Gráfico de attendance
```

### ✅ Elemento 4: Calendario

1. Click en menú **📅 Calendario**
2. Debe mostrar:
   - Eventos académicos
   - Evaluaciones programadas
   - Fechas importantes

**Resultado esperado:**
```
✅ Calendario carga correctamente
✅ Eventos muestran detalles
✅ Navegación entre meses funciona
✅ Vista día/semana/mes
```

### ✅ Elemento 5: Reportes

1. Click en menú **📄 Reportes**
2. Debe permitir generar:
   - Reporte de calificaciones
   - Reporte de asistencia
   - Reporte de estudiantes
   - Exportar en CSV/PDF

**Resultado esperado:**
```
✅ Filtros funcionan
✅ Descarga CSV/PDF correctamente
✅ Datos se exportan completos
✅ Formato es legible
```

### ✅ Elemento 6: Perfil

1. Click en **⚙️ Configuración → Mi Perfil**
2. Debe mostrar:
   - Datos personales (Nombre, Apellido, Cédula)
   - Email: wmlumen@gmail.com
   - Rol: Acceso Académico
   - Datos de facturación (RUC - si aplica)

**Resultado esperado:**
```
✅ Carga datos correctamente
✅ Puede editar datos
✅ Botón cambiar contraseña funciona
✅ Subir foto de perfil funciona
```

### ✅ Elemento 7: Mensajes/Notificaciones

1. Verificar icono de notificaciones (campana)
2. Debe mostrar:
   - Calificaciones publicadas
   - Cambios de horario
   - Anuncios importantes

**Resultado esperado:**
```
✅ Notificaciones cargan
✅ Marca como leído funciona
✅ Eliminar notificaciones funciona
```

---

## 📊 PASO 6: VERIFICAR TESORERÍA (Si tiene acceso)

Si el usuario Académico tiene permisos de tesorería:

### Arqueo de Caja
1. Click en **💳 Tesorería → Arqueo de Caja**
2. Debe mostrar:
   - Período (Hoy, Semana, Mes, etc.)
   - Segmentación (General, Carrera, Grado)
   - Total ingresado
   - Gráfico de distribución

**Verificar:**
```
✅ Filtros de período funcionan
✅ Segmentación actualiza tabla
✅ Gráfico se renderiza
✅ Descarga CSV funciona
```

### Pagos
1. Click en **💳 Tesorería → Pagos**
2. Debe permitir:
   - Registrar pago (Monto + Comprobante)
   - Ver historial de pagos
   - Filtrar por estudiante/período

**Verificar:**
```
✅ Registrar pago funciona
✅ Validación de campos
✅ Comprobante se guarda
✅ Historial actualiza
```

---

## 🔓 PASO 7: CERRAR SESIÓN

1. Click en **🚪 Cerrar Sesión**
2. Debe limpiar sesión
3. Redirigir a login

**Resultado esperado:**
```
✅ Sesión se cierra correctamente
✅ No hay datos en localStorage
✅ Redirige a login
✅ Puede volver a loguear
```

---

## 📋 CHECKLIST FINAL

### Login
- [ ] Cédula aceptada (888888888)
- [ ] Contraseña validada (academico123)
- [ ] Nombre mostrado correctamente
- [ ] Redirige a dashboard

### Dashboard Principal
- [ ] Bienvenida mostrada
- [ ] KPIs cargan (estudiantes, cursos, etc)
- [ ] Menú lateral visible
- [ ] Barra superior con usuario

### Estudiantes
- [ ] Lista carga correctamente
- [ ] Filtros funcionan
- [ ] Datos mostrados completos
- [ ] Puede ver detalles de estudiante

### Calificaciones
- [ ] Tabla carga correctamente
- [ ] Notas se muestran
- [ ] Promedios calculan bien
- [ ] Exportar CSV funciona

### Asistencia
- [ ] Registro carga
- [ ] Filtros por fecha
- [ ] Estadísticas correctas
- [ ] Gráfico se renderiza

### Calendario
- [ ] Eventos cargan
- [ ] Navegación funciona
- [ ] Detalles de evento se muestran

### Reportes
- [ ] Generación de reportes
- [ ] Filtros aplicables
- [ ] Descarga CSV/PDF

### Perfil
- [ ] Datos mostrados correctamente
- [ ] Email visible
- [ ] Rol mostrado
- [ ] Puede editar datos

### Notificaciones
- [ ] Ícono visible
- [ ] Notificaciones cargan
- [ ] Marca como leído

### Tesorería (si aplica)
- [ ] Arqueo de caja funciona
- [ ] Filtros actualizan
- [ ] Gráficos renderizan

### Seguridad
- [ ] Botón cerrar sesión visible
- [ ] Logout funciona correctamente
- [ ] Session se limpia

---

## 🎯 RESULTADO FINAL

Si todos los elementos funcionan correctamente:

```
✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
USUARIO ACADÉMICO FUNCIONA CORRECTAMENTE
✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
```

---

**Creado:** 2026-09-19  
**Sistema:** Campus Virtual Centuria  
**Usuario:** Acceso Académico (888888888)
