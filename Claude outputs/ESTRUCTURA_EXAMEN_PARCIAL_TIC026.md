# ESTRUCTURA: Examen Parcial TIC026

## 🎯 FLUJO DEL EXAMEN

```
┌─────────────────────────────────────────────────────────┐
│ 1. VALIDACIÓN DE CÓDIGO                                 │
│    Ingresa código: TIC026                               │
│    ✓ Correcto → Continúa a PASO 2                       │
│    ✗ Incorrecto → Bloquea (máx 3 intentos)              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. DATOS PERSONALES (Pantalla única)                    │
│    - Nombre: _________________ (obligatorio)            │
│    - Apellido: ________________ (obligatorio)           │
│    - Cédula: _________________ (obligatorio, único)     │
│    - Carrera: [dropdown]                                │
│      • Administración de Empresa                        │
│      • Administración Aduanera                          │
│      • Gestión Pública                                  │
│    - Sección: [radio button]                            │
│      ○ S026                                             │
│      ○ LV026                                            │
│    [CONTINUAR]                                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. EXAMEN - PREGUNTAS UNA POR UNA                       │
│                                                         │
│    PREGUNTA 1 de 20                                     │
│    ┌──────────────────────────────────────────────────┐ │
│    │ ¿Cuál es la definición de...?                    │ │
│    │                                                  │ │
│    │ ○ Opción A                                       │ │
│    │ ○ Opción B                                       │ │
│    │ ○ Opción C                                       │ │
│    │ ○ Opción D                                       │ │
│    │                                                  │ │
│    │ [ SIGUIENTE ]  [ ANTERIOR ]                      │ │
│    └──────────────────────────────────────────────────┘ │
│                                                         │
│    Progreso: ████████░░░░░░░░░░░░ 8/20                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. RESUMEN Y ENVÍO                                      │
│    Preguntas respondidas: 20/20                         │
│    [ ENVIAR RESPUESTAS ]                                │
│                                                         │
│    ✓ Respuestas guardadas                              │
│    Puntaje: 85/100                                     │
│    Intento: 1/2                                         │
│                                                         │
│    [ INTENTAR DE NUEVO ] (si quedan intentos)          │
│    [ SALIR ]                                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 TABLA DE GOOGLE SHEETS - Estructura de datos

### **Hoja 1: ConfigExamen**
```
| ID | Codigo | Asignatura | TotalPreguntas | PuntajeMaximo | Intentos | FechaInicio | FechaFin | Estado |
|----|--------|-----------|------------------|------|---------|---------|------|
| 1  | TIC026 | TIC        | 20               | 100  | 2       | 2026-09-22 | 2026-12-31 | Activo |
```

### **Hoja 2: InventarioPreguntas**
```
| ID | CodigoExamen | NumPregunta | Pregunta | OpcionA | OpcionB | OpcionC | OpcionD | RespuestaCorrecta | Puntos |
|----|-------------|------------|----------|---------|---------|---------|---------|------------------|--------|
| 1  | TIC026      | 1          | ¿Qué es...? | ... | ... | ... | ... | C | 5 |
| 2  | TIC026      | 2          | ¿Cuál es...? | ... | ... | ... | ... | B | 5 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| 20 | TIC026      | 20         | ... | ... | ... | ... | ... | ... | 5 |
```

### **Hoja 3: RespuestasAlumnos**
```
| ID | Cedula | Nombre | Apellido | Carrera | Seccion | CodigoExamen | Intento | Pregunta | RespuestaAlumno | Correcta | Timestamp | Puntaje |
|----|--------|--------|----------|---------|---------|-------------|---------|----------|-----------------|----------|-----------|---------|
| 1  | 123456 | Juan   | Pérez    | Admin Emp | S026   | TIC026      | 1       | 1        | C               | Sí       | 2026-09-22 10:30 | 5 |
| 2  | 123456 | Juan   | Pérez    | Admin Emp | S026   | TIC026      | 1       | 2        | B               | Sí       | 2026-09-22 10:35 | 5 |
```

### **Hoja 4: ResultadosFinal**
```
| Cedula | Nombre | Apellido | Carrera | Seccion | CodigoExamen | Intento1 | Intento2 | PuntajeMaximo | PuntajeFinal | Aprobado |
|--------|--------|----------|---------|---------|-------------|----------|----------|---------------|-------------|----------|
| 123456 | Juan   | Pérez    | Admin Emp | S026   | TIC026      | 75       | 85       | 100           | 85          | Sí       |
```

---

## 🔐 VALIDACIONES

| Campo | Validación |
|-------|-----------|
| Código de acceso | Debe ser exactamente "TIC026" (case-sensitive) |
| Nombre/Apellido | Mínimo 3 caracteres, solo letras y espacios |
| Cédula | Formato: 8 dígitos, única (no puede repetirse) |
| Carrera | Selección obligatoria (dropdown) |
| Sección | Selección obligatoria (radio button) |
| Respuestas | Una respuesta por pregunta antes de continuar |

---

## 🔄 LÓGICA DE INTENTOS

```javascript
// Pseudo-código
if (intento === 1 && puntajeFinal < 70) {
    mostrarBotón("INTENTAR DE NUEVO");
    registrarIntento(2);
} else if (intento === 2) {
    mostrarMensaje("Examen finalizado. No hay más intentos.");
    guardarPuntajeFinal(Math.max(intento1, intento2));
}
```

**Regla**: Siempre guardar el **puntaje máximo** de los 2 intentos.

---

## 📋 CAMPOS EN CADA PREGUNTA

```json
{
  "id": 1,
  "numero": 1,
  "texto": "¿Cuál es la definición de administración?",
  "opciones": {
    "A": "Es el proceso de planificar...",
    "B": "Es una ciencia exacta...",
    "C": "Es la aplicación de recursos...",
    "D": "Ninguna de las anteriores"
  },
  "respuestaCorrecta": "C",
  "puntos": 5,
  "puntajeTotal": 100,
  "tiempoLimite": null // null = sin límite, o en segundos
}
```

---

## 🔗 CONEXIÓN CON CAMPUS VIRTUAL

```
Flujo completo:
1. Alumno ingresa a: /app/academic/examen_parcial_tic026.html
2. Sistema valida sesión (CenturiaSession.protect())
3. Solicitá código TIC026
4. Captura datos y guarda en Sheets
5. Ejecuta examen
6. Guarda resultados en hoja ResultadosFinal
7. Docente ve resultados en docente.html → Calificaciones
```

---

## ✅ CHECKLIST ANTES DE CREAR

- [ ] Google Sheet creada
- [ ] Hojas configuradas (ConfigExamen, InventarioPreguntas, RespuestasAlumnos, ResultadosFinal)
- [ ] Preguntas redactadas (20 preguntas con respuestas correctas)
- [ ] Apps Script conectado a Sheets
- [ ] HTML del examen creado
- [ ] Validaciones implementadas
- [ ] Test con alumno de prueba
- [ ] Publicado en GitHub

