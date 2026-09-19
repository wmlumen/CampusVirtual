# 👤 CREAR USUARIOS ADMINISTRATIVOS

**Objetivo:** Crear dos usuarios de administración para pruebas

---

## 📋 USUARIOS A CREAR

| Rol | Cédula | Contraseña | Email |
|---|---|---|---|
| **Administrador** | 999999999 | admin123 | wmlumen@gmail.com |
| **Acceso Académico** | 888888888 | academico123 | wmlumen@gmail.com |

---

## ⚙️ OPCIÓN 1: Automático (Recomendado)

### Paso 1: Copiar el script GAS

1. Abrir Google Sheets del proyecto
2. Ir a **Extensiones → Apps Script**
3. Crear nuevo archivo: **+ → Script**
4. Copiar contenido de: `CREAR_USUARIOS_ADMIN.gs`
5. Guardar con Ctrl+S

### Paso 2: Ejecutar función

1. En el editor GAS, seleccionar: **crearUsuariosAdmin**
2. Click en ▶️ Ejecutar
3. Autorizar si es necesario
4. Ver logs (Ctrl+Enter)

### Paso 3: Verificar (Opcional)

1. Ejecutar: **verificarUsuariosAdmin()**
2. Ver logs para confirmar inserción

---

## 📝 OPCIÓN 2: Manual (Google Sheets)

### Paso 1: Abrir hojas

1. Ir a Google Sheets del proyecto
2. Ir a hoja **"RegistroAlumnos"** (crear si no existe)

### Paso 2: Insertar Administrador

En **RegistroAlumnos**, agregar fila:

```
| Cédula    | Nombre | Apellido      | Email             | Grado | Carrera | Sección |
|-----------|--------|---------------|-------------------|-------|---------|---------|
| 999999999 | Usuario| Administrador | wmlumen@gmail.com | -     | -       | -       |
```

### Paso 3: Insertar Académico

En **RegistroAlumnos**, agregar fila:

```
| Cédula    | Nombre | Apellido | Email             | Grado | Carrera | Sección |
|-----------|--------|----------|-------------------|-------|---------|---------|
| 888888888 | Usuario| Académico| wmlumen@gmail.com | -     | -       | -       |
```

### Paso 4: Ir a hoja "Roles"

1. Abrir hoja **"Roles"** (crear si no existe)
2. Headers: `Cédula | Nombre | Rol | Carrera | Sección | Asignatura | Estado | FechaAsignación | AsignadoPor`

### Paso 5: Insertar Administrador en Roles

```
| Cédula    | Nombre                  | Rol             | Carrera | Sección | Asignatura | Estado | FechaAsignación | AsignadoPor |
|-----------|-------------------------|-----------------|---------|---------|------------|--------|-----------------|-------------|
| 999999999 | Usuario Administrador   | Administrador   | -       | -       | -          | Activo | 2026-09-19      | Sistema     |
```

### Paso 6: Insertar Académico en Roles

```
| Cédula    | Nombre              | Rol                | Carrera | Sección | Asignatura | Estado | FechaAsignación | AsignadoPor |
|-----------|---------------------|------------------|---------|---------|------------|--------|-----------------|-------------|
| 888888888 | Usuario Académico   | Acceso Académico   | -       | -       | -          | Activo | 2026-09-19      | Sistema     |
```

---

## 🔐 CONFIGURAR CONTRASEÑAS

### Opción A: Script GAS (Automático)

```javascript
// En el editor GAS:
ss = SpreadsheetApp.getActiveSpreadsheet();
configurarContrasenasAdmin(ss);
```

### Opción B: Hoja de Contraseñas (Manual)

1. Crear hoja **"Contraseñas"**
2. Headers: `Cédula | PasswordHash | Último cambio`

3. Agregar filas:

```
| Cédula    | PasswordHash               | Último cambio       |
|-----------|---------------------------|-------------------|
| 999999999 | YWRtaW4xMjM=             | 2026-09-19 02:30  |
| 888888888 | YWNhZGVtaWMxMjM=         | 2026-09-19 02:30  |
```

**Nota:** Los valores son base64 de las contraseñas:
- `YWRtaW4xMjM=` = base64("admin123")
- `YWNhZGVtaWMxMjM=` = base64("academico123")

---

## 🧪 PROBAR LOGIN

### Con Administrador

1. Ir a login: `app/index.html`
2. Cédula: **999999999**
3. Contraseña: **admin123**
4. ✅ Debe redirigir a panel admin

### Con Académico

1. Ir a login: `app/index.html`
2. Cédula: **888888888**
3. Contraseña: **academico123**
4. ✅ Debe redirigir a panel académico

---

## 🗂️ ESTRUCTURA DE DATOS

### RegistroAlumnos
```
Cédula | Nombre | Apellido | Email | Grado | Carrera | Sección
```

### Roles
```
Cédula | Nombre | Rol | Carrera | Sección | Asignatura | Estado | FechaAsignación | AsignadoPor
```

### Contraseñas (Opcional)
```
Cédula | PasswordHash | Último cambio
```

---

## ✅ CHECKLIST

- [ ] Script GAS copiado o datos insertados manualmente
- [ ] 2 usuarios en RegistroAlumnos
- [ ] 2 usuarios en Roles con estado "Activo"
- [ ] Contraseñas configuradas
- [ ] Login probado con Administrador
- [ ] Login probado con Académico
- [ ] Ambos pueden acceder a sus paneles respectivos

---

## 🐛 TROUBLESHOOTING

### "Usuario no encontrado en login"
✅ Verificar que cédula está en RegistroAlumnos
✅ Sin espacios adicionales o mayúsculas diferentes

### "Contraseña incorrecta"
✅ Verificar que está en hoja Contraseñas
✅ Verificar que está hashcode en base64
✅ Probar desactivar caché del navegador (Ctrl+Shift+Supr)

### "No acceso a panel"
✅ Verificar que Rol está en hoja Roles
✅ Verificar que Estado = "Activo"
✅ Verificar que Rol es exactamente "Administrador" o "Acceso Académico"

---

## 📞 NOTAS

- Email es informativo (wmlumen@gmail.com para ambos)
- Cédulas ficticias (999999999, 888888888) para testing
- Contraseñas en base64 es para seguridad mínima
- En producción usar bcrypt o similar

---

**Creado:** 2026-09-19  
**Sistema:** Campus Virtual Centuria
