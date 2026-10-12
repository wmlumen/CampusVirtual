/**
 * Asigna un rol a una cuenta del Campus (lo que miran las reglas de Firestore).
 * Uso, en la PC, desde la carpeta del proyecto:
 *   node tools/asignar-rol.js CEDULA ROL
 * Roles: alumno, docente, academico, administracion_general, admin, administrador_plataforma,
 *        admin_filial, asistencia_estudiante
 * Si la ficha tenía carrera/sección "ADMIN" (método viejo para marcar administradores) y el rol
 * nuevo es de administración, esos campos se limpian. También queda activa.
 */
const { iniciar, normalizarCedula } = require('./cv-admin-comun');
// Catálogo canónico (v2026-10-12, auditoría RBAC); 'academico' y 'asistencia_estudiante' se mantienen como alias históricos.
const ROLES = ['alumno', 'docente', 'academico', 'direccion_academica', 'coordinador_carrera', 'calidad_academica', 'secretaria_academica',
  'tesoreria', 'atencion_estudiante', 'asistencia_estudiante', 'disenador_instruccional', 'administracion_general', 'admin',
  'administrador_plataforma', 'admin_filial'];
// --adicional: agrega el rol como segundo rol (roles_activos) sin cambiar el principal (ej.: un administrador que también es docente).
const ADICIONAL = process.argv.includes('--adicional');
const ADMIN = ['admin', 'administrador_plataforma', 'administracion_general'];
(async () => {
  const ced = normalizarCedula(process.argv[2]);
  const rol = String(process.argv[3] || '').trim().toLowerCase();
  if (!ced || ROLES.indexOf(rol) < 0) throw new Error('Uso: node tools/asignar-rol.js CEDULA ROL\nRoles: ' + ROLES.join(', '));
  iniciar();
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();
  const q = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get();
  if (q.empty) throw new Error('No existe una ficha con la cédula ' + ced);
  const doc = q.docs[0], d = doc.data();
  if (ADICIONAL) {
    const extra = Array.from(new Set((d.roles_activos || []).concat([rol]))).filter(r => r !== d.rol);
    await doc.ref.update({ roles_activos: extra, updated_at: new Date().toISOString() });
    console.log('Listo: ' + ced + ' conserva el rol principal "' + d.rol + '" y ahora además tiene: ' + extra.join(', ') + '.');
    return;
  }
  const cambios = { rol, estado: 'activo', updated_at: new Date().toISOString() };
  if (Array.isArray(d.roles) && d.roles.length) {
    cambios.roles = [{ rol, estado: 'activo', carrera: '', seccion: '' }].concat(d.roles.filter(r => String(r.rol || '').toLowerCase() !== rol));
  }
  if (ADMIN.indexOf(rol) >= 0) {
    if (String(d.carrera || '').toUpperCase() === 'ADMIN') cambios.carrera = '';
    if (String(d.seccion || '').toUpperCase() === 'ADMIN') cambios.seccion = '';
  }
  await doc.ref.update(cambios);
  await db.collection('cedulas').doc(ced).set({ rol, estado: 'activo', actualizado: cambios.updated_at }, { merge: true });
  console.log('Listo: ' + ced + ' (' + ((d.nombre || '') + ' ' + (d.apellido || '')).trim() + ') ahora tiene el rol "' + rol + '". Rol anterior: "' + (d.rol || '—') + '".');
  console.log('Cerrá sesión en el Campus y volvé a entrar.');
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
