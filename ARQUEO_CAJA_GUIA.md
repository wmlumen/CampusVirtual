# 🏦 ARQUEO DE CAJA - Guía de Uso

**Sistema de reconciliación de ingresos con segmentación flexible**

---

## 📊 PANTALLA PRINCIPAL

```
┌─────────────────────────────────────────────────────────────┐
│  ARQUEO DE CAJA - Reconciliación de Ingresos               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FILTROS:                                                     │
│  ┌────────────────┐ ┌─────────────┐ ┌────────────────────┐  │
│  │ Período        │ │ Segmentar   │ │ Descargar CSV     │  │
│  │ [Este Mes ▼]   │ │ [General ▼] │ │ [📥 Descargar]    │  │
│  └────────────────┘ └─────────────┘ └────────────────────┘  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                        RESUMEN                               │
│  ┌──────────────────┐ ┌──────────────────┐                  │
│  │ 2,500,000 Gs.   │ │ 25,000 Gs.       │                  │
│  │ Total Ingresado │ │ Pago Promedio    │                  │
│  │ 156 pagos       │ │ Min: 5K - Max: 500K                 │
│  └──────────────────┘ └──────────────────┘                  │
│  ┌──────────────────┐ ┌──────────────────┐                  │
│  │ Transferencia   │ │ 85 estudiantes   │                  │
│  │ Método Más Used │ │ Que Pagaron      │                  │
│  │ 78 veces        │ │ 42.5% del total  │                  │
│  └──────────────────┘ └──────────────────┘                  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                      TABLA DE ARQUEO                        │
│                                                               │
│  Segmento         │ Pagos │ Monto      │ Prom.  │ %        │
│  ─────────────────┼───────┼────────────┼────────┼──────    │
│  GENERAL          │ 156   │ 2,500,000  │ 25K    │ 100%     │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    GRÁFICO DE DISTRIBUCIÓN                  │
│                                                               │
│       2,500,000 Gs. │ ████████████████████████████          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 EJEMPLOS DE USO

### Caso 1: Arqueo por Carrera

**Selecciones:**
- Período: Este Mes
- Segmentar por: Carrera

**Resultado:**

```
Carrera                  │ Pagos │ Monto        │ Promedio  │ %
─────────────────────────┼───────┼──────────────┼───────────┼─────
Contabilidad             │ 45    │ 1,125,000    │ 25,000    │ 45%
Administración           │ 38    │ 900,000      │ 23,684    │ 36%
Sistemas                 │ 22    │ 275,000      │ 12,500    │ 11%
Enfermería               │ 17    │ 200,000      │ 11,765    │ 8%
                         │─────  │──────────────│           │────
TOTAL                    │ 156   │ 2,500,000    │ 25,000    │ 100%
```

**Acciones:**
- ✅ Ver pagos de Contabilidad
- ✅ Ver pagos de Administración
- etc.

### Caso 2: Arqueo por Grado + Carrera

**Selecciones:**
- Período: Este Semestre
- Segmentar por: Carrera + Grado

**Resultado:**

```
Segmento                 │ Pagos │ Monto        │ Promedio  │ %
─────────────────────────┼───────┼──────────────┼───────────┼─────
Contabilidad - 1er Año   │ 20    │ 500,000      │ 25,000    │ 20%
Contabilidad - 2do Año   │ 15    │ 375,000      │ 25,000    │ 15%
Contabilidad - 3er Año   │ 10    │ 250,000      │ 25,000    │ 10%
Administración - 1er Año │ 18    │ 450,000      │ 25,000    │ 18%
Sistemas - 2do Año       │ 22    │ 275,000      │ 12,500    │ 11%
Enfermería - 1er Año     │ 17    │ 200,000      │ 11,765    │ 8%
Otros                    │ 54    │ 450,000      │ 8,333     │ 18%
                         │─────  │──────────────│           │────
TOTAL                    │ 156   │ 2,500,000    │ 25,000    │ 100%
```

---

## 📈 VISTA DETALLE - Pagos de un Segmento

**Click en botón "Ver Pagos" de cualquier segmento:**

```
DETALLE DE PAGOS - Contabilidad

Estudiante               │ Cédula    │ Fecha      │ Monto     │ Comprobante
─────────────────────────┼───────────┼────────────┼───────────┼────────────
Juan García              │ 12345678  │ 2026-09-15 │ 50,000    │ Transferencia
María López              │ 87654321  │ 2026-09-14 │ 75,000    │ Efectivo
Carlos Mendez            │ 45678901  │ 2026-09-10 │ 25,000    │ Cheque
...                      │ ...       │ ...        │ ...       │ ...
```

---

## ⏱️ PERÍODOS DISPONIBLES

| Período | Rango | Uso Típico |
|---------|-------|-----------|
| **Hoy** | 00:00 - Ahora | Arqueo diario rápido |
| **Esta Semana** | Lunes - Hoy | Control semanal |
| **Este Mes** | 1 - Hoy | Cierre mensual |
| **Este Semestre** | Sem inicio - Hoy | Reporte académico |
| **Este Año** | 1 Ene - Hoy | Análisis anual |
| **Rango personalizado** | Desde-Hasta | Auditoría específica |

---

## 🔍 SEGMENTACIONES DISPONIBLES

### General
- Sin segmentación
- Muestra totales consolidados

### Por Carrera
- Agrupa por programa académico
- Ideal para reportes por facultad

### Por Grado
- Agrupa por año de estudio (1er, 2do, 3er año)
- Identifica patrones de pago por nivel

### Por Sección
- Agrupa por grupo/clase
- Auditoría de secciones específicas

### Por Carrera + Grado
- Segmentación dual más detallada
- Vista completa de ingreso por programa-nivel

---

## 📊 MÉTRICAS MOSTRADAS

### Resumen General (4 KPIs)

1. **Total Ingresado**
   - Suma de todos los pagos en el período
   - Ej: 2,500,000 Gs.

2. **Pago Promedio**
   - Total ÷ Cantidad de pagos
   - Ej: 25,000 Gs.

3. **Método Más Usado**
   - Tipo de pago más frecuente + cantidad
   - Ej: Transferencia (78 veces)

4. **Estudiantes que Pagaron**
   - Cantidad de estudiantes únicos
   - % sobre total de estudiantes
   - Ej: 85 estudiantes (42.5%)

### Por Segmento

1. **Cantidad de Pagos** - Número de transacciones
2. **Monto Total** - Suma en Gs.
3. **Pago Promedio** - Promedio por pago
4. **Min - Max** - Rango de montos
5. **% del Total** - Porcentaje de participación

---

## 💾 DESCARGA CSV

**Botón: Descargar CSV**

Archivo generado: `arqueo-caja-2026-09-19.csv`

Contenido:
```csv
Arqueo de Caja - 19/09/2026

Período: Este Mes
Segmentado por: Carrera

RESUMEN
Total Ingresado,2500000
Cantidad de Pagos,156
Pago Promedio,25000
Estudiantes,85

DETALLE POR SEGMENTO
Segmento,Cantidad,Monto,Promedio,Mínimo,Máximo,Porcentaje
"Contabilidad",45,1125000,25000,5000,100000,45.0%
"Administración",38,900000,23684,10000,75000,36.0%
...
```

Usos:
- ✅ Importar a Excel para análisis
- ✅ Enviar a contabilidad para auditoría
- ✅ Generar reportes combinados
- ✅ Mantener archivo histórico

---

## 🔐 VALIDACIONES Y CONTROLES

### Descrepancias Detectadas
El sistema puede identificar:
- ❌ Pagos sin comprobante
- ❌ Montos duplicados en fecha cercana
- ❌ Pagos de estudiantes bloqueados
- ❌ Desviaciones en promedio de carrera

**Acceso:** API `arqueoDiscrepancias()` + panel futuro

---

## 📋 CHECKLIST DE INTEGRACIÓN

- [ ] Botón "Arqueo de Caja" en sidebar admin
- [ ] switchTab() case 'arqueo-caja'
- [ ] Backend GAS: arqueoCaja()
- [ ] Backend GAS: obtenerPagosPorSegmento()
- [ ] Backend GAS: reporteArqueoDetallado()
- [ ] Backend GAS: arqueoDiscrepancias()
- [ ] Incluir Chart.js para gráficos
- [ ] Pruebas con datos reales

---

## ⚙️ NOTAS TÉCNICAS

**Moneda:** Gs. (Guaraníes)
```javascript
numero.toLocaleString('es-PY') + ' Gs.'
// 1234567 → 1.234.567 Gs.
```

**Gráfico:** Chart.js (barras horizontal/vertical por segmento)

**Rendimiento:** Optimizar con índices en BD:
- estudiantes(cedula, estado)
- pagos(fecha, carrera, grado, sección)
- exoneraciones(cedula, fecha)

---

**Última actualización:** 2026-09-19
**Sistema:** Campus Virtual Centuria
