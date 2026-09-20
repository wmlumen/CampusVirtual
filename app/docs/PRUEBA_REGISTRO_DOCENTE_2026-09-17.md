# Prueba de registro docente y aprobación administrativa

Fecha: 17 de septiembre de 2026.
Sitio probado: https://wmlumen.github.io/CampusVirtual/
Versión visible: v2026.09.16-r9.

## Resultado

Flujo no completado. El registro público no ofrece una solicitud docente y el envío termina con un aviso de cédula duplicada. No se confirmó la creación de una cuenta ni una solicitud pendiente. No se aprobó ningún usuario.

## Prueba en el navegador

1. Abrir el portal, pulsar Entrar y Registrarse.
2. Completar identidad ficticia: cédula 9909172601, nombre Prueba Docente, apellido QA Autonomo y correo docente.qa.20260917@example.com.
3. El primer paso indica «FOTO DEL ALUMNO». No ofrece selector de rol docente.
4. Avanzar a datos académicos y pulsar Revisar sin elegir grado, carrera ni sección.
5. El resumen permite continuar y muestra S026 aunque no se seleccionó una sección. Muestra además una contraseña calculada a partir del nombre, apellido y cédula.
6. Pulsar Guardar y Acceder. Aparece «Esta cedula ya esta registrada. Deseas recuperar tu contrasena?». Cancelar la recuperación.
7. Abrir /CampusVirtual/admin/index.html. Redirige a /CampusVirtual/index.html. No había sesión administrativa disponible.

## Diagnóstico de la copia local

- app/index.html, registrarYAcceder: fija rol alumno y llama a auth.register; no solicita aprobación docente.
- app/index.html, captura de errores: msg.includes('registr') clasifica también «No se pudo registrar» como cédula duplicada. El aviso observado no acredita un duplicado real.
- app/js/api.js, authRegister: devuelve «No se pudo registrar» ante una respuesta HTTP no exitosa sin mensaje JSON interpretable.
- app/js/api.js: baseUrl apunta a /api/ del origen. El workflow de Pages publica los archivos estáticos de app y elimina PHP. Existe una incompatibilidad entre esa ruta PHP y el despliegue estático; no se obtuvo el estado HTTP exacto de la petición de registro durante esta prueba.
- api/auth.php: register inserta directamente en users; la aprobación de api/usuarios.php consulta usuarios_pendientes. En los archivos inspeccionados no se encontró la inserción de la solicitud pública en esa cola.
- app/admin/sections/usuarios.html y app/admin/js/admin.js: el recorrido implementado es Usuarios → Pendientes → seleccionar rol docente → Aprobar. No fue posible ejecutarlo con una sesión autenticada.

## Criterios pendientes para validar el circuito completo

1. Registro docente público con estado pendiente confirmado por el backend disponible en producción.
2. Aparición de esa misma solicitud en Usuarios → Pendientes.
3. Aprobación con rol docente desde una sesión administrativa autorizada.
4. Inicio de sesión del docente aprobado, con permisos docentes y sin acceso administrativo.
5. Denegación de acceso docente mientras la solicitud siga pendiente.

Se probaron las pantallas publicadas y se inspeccionó la implementación local. No se modificó ni desplegó código funcional, ni se confirmó persistencia en la base de datos.
