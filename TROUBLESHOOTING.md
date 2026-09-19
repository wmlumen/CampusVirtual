# 🔧 TROUBLESHOOTING - DIAGNÓSTICO Y SOLUCIONES

**Objetivo:** Identificar y resolver qué no funciona

---

## ❌ "NO FUNCIONA" - DIAGNÓSTICO

### Opción 1: ¿Cuál es el error específico?

```
A) No carga la página en absoluto
B) Carga pero Login no acepta credenciales
C) Login funciona pero Dashboard no carga
D) Dashboard carga pero faltan elementos
E) Elementos cargan pero tienen errores
F) No sé exactamente qué no funciona
```

---

## 🔍 VERIFICACIÓN PASO A PASO

### PASO 1: Verificar que el repo está actualizado
```bash
cd ~/mnt/CampusVirtual
git status
git log --oneline -5
```

**Esperado:**
- Branch: main
- Commits recientes (últimos 24 horas)
- Sin cambios sin commitear

---

### PASO 2: Verificar archivos HTML existe
```bash
ls -lh app/index.html
ls -lh app/admin/index.html
ls -lh app/admin/sections/tesoreria.html
ls -lh app/admin/sections/gestion-estudiantes.html
ls -lh app/admin/sections/arqueo-caja.html
```

**Esperado:**
- Todos los archivos existen
- Tamaño > 0 bytes

---

### PASO 3: Verificar contenido de API
```bash
grep -n "arqueoCaja\|asignarExoneracion\|darDeBaja" app/js/api.js | wc -l
```

**Esperado:**
- Salida: >= 3 (métodos agregados)

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### ❌ Error 1: "Página no carga / Error 404"

**Causa:** GitHub Pages no está actualizado o URL es incorrecta

**Soluciones:**

A) Verificar URL correcta:
```
Incorrecta: https://wmlumen.github.io/CampusVirtual/app
Correcta:   https://wmlumen.github.io/CampusVirtual/app/index.html
```

B) Limpiar caché:
```
Windows/Linux: Ctrl + Shift + Supr
Mac: Cmd + Shift + Supr
```

C) Forzar recarga:
```
Windows/Linux: Ctrl + F5
Mac: Cmd + Shift + R
```

D) Verificar que GitHub tiene los archivos:
```
https://github.com/wmlumen/CampusVirtual/tree/main/app
```

---

### ❌ Error 2: "Usuario no encontrado al loguear"

**Causa:** Los usuarios aún no están creados en Google Sheets

**Soluciones:**

A) Crear usuarios manualmente:
```
1. Abrir Google Sheets del proyecto
2. Ir a hoja: RegistroAlumnos
3. Agregar fila:
   Cédula: 888888888
   Nombre: Usuario
   Apellido: Académico
   Email: wmlumen@gmail.com
```

B) Ejecutar script GAS automático:
```
1. Extensiones → Apps Script
2. Copiar: app/Backend_Scripts/CREAR_USUARIOS_ADMIN.gs
3. Ejecutar: crearUsuariosAdmin()
```

C) Verificar que datos están en Google Sheets:
```
1. Abrir Google Sheets
2. Verificar hojas: RegistroAlumnos, Roles
3. Buscar cédula: 888888888
```

---

### ❌ Error 3: "Contraseña incorrecta"

**Causa:** Las contraseñas no están configuradas o están mal hasheadas

**Soluciones:**

A) Crear hoja Contraseñas:
```
1. En Google Sheets
2. Crear hoja: Contraseñas
3. Headers: Cédula | PasswordHash | Último cambio
4. Fila: 888888888 | YWNhZGVtaWMxMjM= | 2026-09-19
```

B) Usar contraseña en plain text (testing):
```
En backend GAS, modificar validación:
if (passwordIngresada === "academico123") {
  // Login exitoso
}
```

C) Ejecutar configuración de contraseñas:
```
En Google Apps Script:
ss = SpreadsheetApp.getActiveSpreadsheet();
configurarContrasenasAdmin(ss);
```

---

### ❌ Error 4: "Dashboard no carga datos"

**Causa:** API no está conectada o Google Sheets tiene problemas

**Soluciones:**

A) Verificar conexión a Google Sheets:
```
1. Abrir Google Sheets directamente
2. Ver si tiene datos en hojas
3. Verificar permisos de acceso
```

B) Verificar API está llamando correctamente:
```
Abrir console (F12)
Ver si hay errores de CORS o autenticación
```

C) Limpiar cache y recargar:
```
Ctrl + Shift + R (fuerza recarga sin caché)
```

---

### ❌ Error 5: "Elementos de Tesorería/Arqueo no aparecen"

**Causa:** Los botones no están agregados al sidebar o selectores son incorrectos

**Soluciones:**

A) Verificar que botones están en admin/index.html:
```bash
grep -n "tesoreria\|arqueo-caja" app/admin/index.html
```

B) Agregar botones manualmente si no están:
```html
<button @click="switchTab('tesoreria')">
  <i class="bi bi-credit-card-fill"></i> Tesorería
</button>

<button @click="switchTab('arqueo-caja')">
  <i class="bi bi-calculator-fill"></i> Arqueo de Caja
</button>
```

C) Verificar que switchTab() tiene los casos:
```bash
grep -A 2 "case 'tesoreria'" app/admin/js/admin.js
grep -A 2 "case 'arqueo-caja'" app/admin/js/admin.js
```

---

## 🧪 TESTS DE VERIFICACIÓN

### Test 1: ¿GitHub Pages está actualizado?
```bash
# Verificar último commit
git log --oneline -1

# Verificar rama
git branch

# Esperado: 
# main (HEAD) con commit reciente
```

### Test 2: ¿Los archivos HTML existen?
```bash
test -f app/index.html && echo "✅ index.html existe" || echo "❌ Falta"
test -f app/admin/sections/tesoreria.html && echo "✅ tesoreria.html existe" || echo "❌ Falta"
test -f app/admin/sections/arqueo-caja.html && echo "✅ arqueo-caja.html existe" || echo "❌ Falta"
```

### Test 3: ¿API tiene los métodos?
```bash
grep -c "arqueoCaja" app/js/api.js && echo "✅ arqueoCaja existe" || echo "❌ No existe"
grep -c "asignarExoneracion" app/js/api.js && echo "✅ asignarExoneracion existe" || echo "❌ No existe"
```

### Test 4: ¿Google Sheets tiene datos?
```
1. Abrir Google Sheets del proyecto
2. Verificar 3 hojas:
   ✅ RegistroAlumnos (datos de estudiantes)
   ✅ Roles (roles de usuarios)
   ✅ Contraseñas (hashes de pass)
```

---

## 🎯 SOLUCIÓN RÁPIDA (15 minutos)

Si nada funciona, seguir esto:

### Paso 1: Actualizar repositorio
```bash
cd ~/mnt/CampusVirtual
git pull origin main
git log --oneline -1
```

### Paso 2: Crear usuarios manualmente
```
Abrir Google Sheets → RegistroAlumnos
Agregar:
- Cédula: 888888888
- Nombre: Usuario
- Apellido: Académico
- Email: wmlumen@gmail.com
```

### Paso 3: Crear contraseña
```
Crear hoja "Contraseñas"
Agregar:
- Cédula: 888888888
- Password: academico123 (plain text)
```

### Paso 4: Probar login
```
URL: https://wmlumen.github.io/CampusVirtual/app/index.html
Cédula: 888888888
Contraseña: academico123
```

### Paso 5: Si login funciona
```
✅ Sistema funcional
❌ Si no, revisar console (F12) para ver error
```

---

## 📞 INFORMACIÓN PARA DEBUG

### Verificación Local
```bash
cd ~/mnt/CampusVirtual
python3 -m http.server 8080
# Luego: http://localhost:8080/app/index.html
```

### Ver Logs de Git
```bash
git log --oneline app/js/api.js
git log --oneline app/admin/sections/
```

### Verificar Últimos Cambios
```bash
git diff HEAD~5 HEAD --stat
```

---

## 🔗 REFERENCIAS IMPORTANTES

| Recurso | Link |
|---------|------|
| Repo GitHub | https://github.com/wmlumen/CampusVirtual |
| App en vivo | https://wmlumen.github.io/CampusVirtual/app/index.html |
| Google Sheets | Verificar acceso en Extensiones → Apps Script |
| Documentación | INTEGRACION_PENDIENTE.md |

---

## ❓ PREGUNTAS DE DIAGNÓSTICO

Responde estas para identificar el problema:

1. **¿Carga la página?**
   - Sí / No / Parcialmente

2. **¿Aparece pantalla de login?**
   - Sí / No / Sí pero vacía

3. **¿Aceptan la cédula?**
   - Sí / No / "Usuario no encontrado"

4. **¿Aceptan la contraseña?**
   - Sí / No / "Contraseña incorrecta"

5. **¿Carga el dashboard?**
   - Sí / No / Sí pero sin datos

6. **¿Hay errores en console?** (F12)
   - Sí / No / No sé

---

**Si responden a estas preguntas, podré ayudar específicamente**

---

**Sistema:** Campus Virtual Centuria  
**Creado:** 2026-09-19
