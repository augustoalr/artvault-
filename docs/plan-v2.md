# ArtVault v2 — Plan de Implementación Integral

> Basado en `clarificacion.txt` — Sistema de Fichas Técnicas para Patrimonio Cultural

---

## 📊 Análisis de Brechas: Estado Actual vs. Requerido

| Funcionalidad | Actual | Requerido |
|---|---|---|
| Campos Pág. 1 (datos técnicos) | 6 campos | 14+ campos |
| Pág. 2 (historia + biografía) | ❌ No existe | Movimientos + Biografía autor |
| Pág. 3 (montaje + valoración) | ❌ No existe | Montaje + Observaciones + Avalúo |
| Pág. 4 (conservación) | ❌ No existe | Diagnóstico + Recomendaciones + Fotos |
| Listas desplegables dinámicas | ❌ Texto fijo | Categoría, Procedencia, Tipo foto, etc. |
| Historial de movimientos | ❌ No existe | Log de préstamos/ubicaciones |
| Exportar PDF (individual/masivo) | ❌ No existe | Selección de páginas + exportación masiva |
| Eliminar con contraseña maestra | ❌ Soft delete simple | Modal con password admin |
| Historial de cambios visual | Audit logs en DB | Timeline visual por usuario |
| Auto-compresión de fotos | < 300kb hardcoded | < 1MB con feedback al usuario |
| Backup export/import | ❌ No existe | JSON/CSV export + import |
| Separación conservación | ❌ Todo junto | Pág 4 solo para rol conservador |

---

## 🗄️ FASE 1: Migración de Base de Datos

### 1.1 Nuevas tablas

```
catalog_options          → Valores dinámicos para dropdowns
  id, category, value, created_by, created_at
  (categories: "categoria", "procedencia", "tipo_fotografico", "investigador")

artwork_movements        → Historial de préstamos/movimientos
  id, artwork_id, location, date_from, date_to, notes, created_by, created_at

artwork_conservation     → Página 4 separada (solo conservadores)
  id, artwork_id, diagnosis, recommendations, 
  conservator_id, created_at, updated_at

artwork_valuations       → Datos financieros (Página 3)
  id, artwork_id, value_bs, value_usd, appraisal_date,
  approved_by, reviewed_by, created_at
```

### 1.2 Campos nuevos en `artworks` (Páginas 1-3)

```sql
-- Página 1: Campos faltantes
category TEXT,                    -- Lista desplegable (catalog_options)
provenance TEXT,                  -- Procedencia (catalog_options)
entry_date DATE,                  -- Fecha de ingreso
original_owner TEXT,              -- Propietario original
owner_address TEXT,               -- Dirección
artwork_location TEXT,            -- Localización de la obra
photo_type TEXT,                  -- Tipo de registro fotográfico (catalog_options)
photographer TEXT,                -- Nombre del fotógrafo

-- Página 2: Historia y biografía
author_biography TEXT,            -- Biografía del autor
biography_researcher TEXT,        -- Investigador (catalog_options)

-- Página 3: Montaje y observaciones
mounting_description TEXT,        -- Descripción del montaje
general_observations TEXT,        -- Observaciones generales
registered_by UUID,               -- Automático: usuario actual
reviewed_by TEXT,                  -- Manual: quién revisó
```

### 1.3 Configuración global

```
app_settings
  id, key, value
  → "master_password" (hash bcrypt) para eliminación
```

---

## 🎨 FASE 2: Rediseño del Formulario (4 Páginas)

### Stepper actualizado: 4 pasos

| Paso | Nombre | Quién llena | Campos |
|---|---|---|---|
| 1 | **Datos Técnicos** | Editor/Admin | N° registro, Autor, Título, Fecha, Categoría*, Técnica, Medidas, Procedencia*, Fecha ingreso, Propietario, Dirección, Localización, Tipo foto*, Fotógrafo + **Foto principal** |
| 2 | **Historia y Biografía** | Editor/Admin | Movimientos (sub-formulario automatizado), Biografía del autor, Investigador* |
| 3 | **Montaje y Valoración** | Editor/Admin | Descripción del montaje, Observaciones generales, Aprobado por, Valor Bs, Valor USD, Fecha avalúo, Registrado por (auto), Revisado por, Fecha (auto) |
| 4 | **Conservación** | **Solo Conservador/Admin** | Diagnóstico, Recomendaciones, Fotos de conservación (2 campos) |

> (*) = Lista desplegable dinámica con opción "＋ Agregar nuevo"

### 2.1 Componente: `DynamicSelect`
- Dropdown con búsqueda
- Botón "＋ Agregar" que abre mini-modal inline
- Guarda nuevo valor en `catalog_options`
- Se reutiliza en Categoría, Procedencia, Tipo Fotográfico, Investigador

### 2.2 Componente: `MovementManager`
- Sub-formulario para Página 2
- Fields: Ubicación, Desde, Hasta, Notas
- Botón "＋ Agregar movimiento"
- Lista cronológica de movimientos existentes
- Automatiza el texto tipo "Salón Bolívar desde 19-08-2025 hasta 31-12-2025"

### 2.3 Componente: `ConservationTab`
- Visible en la ficha pero **bloqueado** para editores
- Badge: "🔒 Solo equipo de conservación"
- Para conservadores/admin: formulario completo con diagnóstico + recomendaciones + 2 fotos

---

## 📄 FASE 3: Exportación PDF

### 3.1 Individual
## Phase 3: Report & PDF Export (Focus: Hardcopy)
- [x] Create `PdfService` (using `jspdf` or `react-pdf` on client/server).
- [x] Design technical sheet template (A4 format).
    - [x] Page 1: Technical Data + Main Photo.
    - [x] Page 2: History/Biography.
    - [x] Page 3: Valuation/Mounting.
    - [x] Page 4: Conservation (optional).
- [x] Implement "Export PDF" button on Artwork Detail and List View.
- [x] Batch export functionality (e.g. export filtered list).

## Phase 4: Security & Audit Overhaul (Focus: Protection)
- [x] Implement Master Password logic in `SettingsActions`.
    - [x] Hashing/Verification.
    - [x] `VerifyMasterPassword` middleware/helper.
- [x] Protect "Hard Delete" with Master Password modal.
- [x] Implement `ActivityLog` (Audit Trail) viewer in Dashboard.
    - [x] Track: Insert, Update, Delete, Login, Backup.
    - [x] Visual timeline of changes.

## Phase 5: Media Management (Focus: Storage)
- [x] Set up Supabase Storage buckets (`artworks`, `documents`).
- [x] Implement `ImageService` for upload/optimization.
- [x] Create `ImageUpload` component with drag-and-drop.
    - [x] Auto-compress images to <1MB.
    - [x] Generate standardized filenames.
- [x] Integrate `ImageUpload` into `ArtworkForm`.

## Phase 6: Backup & Data Safety (Focus: Disaster Recovery)
- [x] Create `BackupService` (JSON dump of all tables).
- [x] Implement "Download Backup" in Admin Settings.
- [x] Implement "Restore Backup" with Master Password check.
    - [x] Validation of JSON structure.
    - [x] Upsert logic.

## Phase 7: Advanced Search & Navigation (Focus: Discovery)
- [x] Build `AdvancedSearch` component with filters:
    - [x] Search (text), Inventory #, Author, Classification, Year Range.
- [x] Integrate search into `Dashboard/Artworks`.
- [x] Ensure PDF export respects current search filters.

### 5.2 Organización de fotos
- Foto principal (Pág 1, lado derecho)
- Fotos de conservación (Pág 4, dos campos)

---

## 💾 FASE 6: Backup Export/Import

### 6.1 Exportar
- Admin → Settings → "Exportar Backup"
- Genera archivo JSON con:
  - Todas las obras + relaciones
  - Opciones de catálogo
  - Movimientos
  - Datos de conservación
  - Valoraciones
- Opcional: incluir media (ZIP con fotos + JSON)

### 6.2 Importar
- Admin → Settings → "Importar Backup"
- Validación previa del archivo
- Preview de datos a importar
- Confirmar → inserción con manejo de conflictos (skip/overwrite)

---

## 🔍 FASE 7: Búsqueda Avanzada

### Filtros principales (tu recomendación)
1. **N° de registro** — búsqueda exacta/parcial
2. **Autor** — búsqueda fuzzy
3. **Título** — búsqueda fuzzy
4. **Técnica** — dropdown filtrable

### Filtros secundarios (expandibles)
- Categoría, Procedencia, Estado de conservación, Rango de fechas

### Resultados
- Vista de tabla con columnas configurables
- Vista de galería (cards)
- Selección múltiple para exportación masiva

---

## 📋 Orden de Ejecución

| Prioridad | Fase | Estimado |
|---|---|---|
| 🔴 P0 | **Fase 1**: Migración DB (campos + tablas nuevas) | Primero |
| 🔴 P0 | **Fase 2**: Rediseño formulario 4 páginas | Segundo |
| 🟡 P1 | **Fase 5**: Fotos (compresión + upload a Storage) | Tercero |
| 🟡 P1 | **Fase 4**: Contraseña maestra + historial visual | Cuarto |
| 🟢 P2 | **Fase 7**: Búsqueda avanzada | Quinto |
| 🟢 P2 | **Fase 3**: Exportación PDF | Sexto |
| 🔵 P3 | **Fase 6**: Backup export/import | Séptimo |
