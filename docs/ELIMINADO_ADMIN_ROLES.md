# Eliminacion: admin_roles.html (Stub obsoleto)

**Fecha:** 2026-09-20
**Archivo eliminado/transformado:** `app/admin/admin_roles.html`

---

## Que era

`admin_roles.html` era un archivo stub de 17 lineas que solo redirigia a `admin/index.html`. Contenia:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- v08.5: Security Guard -->
    <script src="../js/session-guard.js"></script>
    <script>CenturiaSession.protect();</script>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=index.html">
    <title>Redirigiendo al Panel Admin...</title>
</head>
<body>
    <p style="font-family:Montserrat,sans-serif;text-align:center;margin-top:40px;color:#64748b;">
        Redirigiendo al <a href="index.html" style="color:#007A33;font-weight:600;">Panel Administrativo</a>...
    </p>
    <script>window.location.href='index.html';</script>
</body>
</html>
```

## Por que existia

Probablemente fue un archivo temporal creado cuando el modulo de roles estaba en desarrollo. La funcionalidad real de gestion de roles ya existe dentro de `admin/index.html` en la pestaña "Roles y Permisos" de `admin/sections/usuarios.html`.

## Que se hizo

1. **`admin/admin_roles.html`** — Ahora redirige a `index.html#roles` (antes redirigia a `index.html`)
2. **`admin/upload_alumnos.html` linea 85** — Cambiado `admin_roles.html` -> `index.html`
3. **`admin/upload_alumnos.html` linea 203** — Cambiado `admin_roles.html` -> `index.html`
4. **`Materiales_Clases/Unidad_01.txt` linea 301** — Cambiado `../admin/admin_roles.html` -> `../admin/index.html`

## Donde esta la funcionalidad real

La gestion de roles esta completa en:

- **UI:** `admin/sections/usuarios.html` (pestana "Roles y Permisos", lineas 343-436)
- **JS:** `admin/js/admin.js` (funciones `guardarRol()`, `editarRol()`, `eliminarRol()`, lineas 570-629)
- **API:** `js/api.js` (objeto `API.roles` con `list()`, `create()`, `save()`, `delete()`, lineas 761-767)
- **Permisos definidos:** 15 permisos (ver_cursos, editar_cursos, ver_notas, etc.)

## Permisos disponibles en el sistema

```
ver_cursos, editar_cursos, ver_notas, editar_notas,
ver_asistencia, editar_asistencia, ver_calendario, editar_calendario,
ver_documentos, editar_documentos, gestionar_usuarios,
gestionar_roles, ver_reportes, ver_tesoreria, ver_config
```

## Si se quiere recuperar

El archivo original era trivial (solo redirect). No hay nada que recuperar. Si se necesita un pagina dedicada de roles, se puede crear desde cero usando la UI que ya existe en `usuarios.html` como referencia.
