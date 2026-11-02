---
name: designing-ux-ui
description: Crea diseños de sistemas de gestión de arte siguiendo principios de arquitectura limpia, diseño atómico y estética de "Galería Premium". Úsalo cuando el usuario pida diseñar interfaces para colecciones de arte.
---

# Designing UX/UI for Artico

Este skill asegura que todas las interfaces del proyecto **artico** cumplan con los estándares de **Arquitecto de Sistemas Principal** y una estética sofisticada de museo/galería. Se centra en la visualización de obras de arte en alta fidelidad y la gestión eficiente de metadatos.

## Cuándo usar este skill
- Al diseñar galerías, visores de obras o catálogos de arte.
- Al crear sistemas de diseño (tokens) con temática "Art Gallery".
- Al implementar componentes visuales que requieran un "vibe" premium.

## Flujo de trabajo

- [ ] **Fase 1: Planificación (Plan)**
    - Definir jerarquía visual priorizando la obra de arte.
    - Identificar componentes atómicos específicos (Card de Obra, Visor de Detalles, Provenance Timeline).
- [ ] **Fase 2: Validación (Validate)**
    - Verificar la pureza de la UI (separación estricta de lógica).
    - Validar que los tokens de diseño (oro, mármol, blanco puro) se apliquen consistentemente.
- [ ] **Fase 3: Ejecución (Execute)**
    - Implementar tokens en `index.css`.
    - Asegurar que el componente de imagen maneje `Loading` con un skeleton elegante y `Error` con estilo.

## Instrucciones

### 1. Estética "Museum/Gallery" (The Art Vibe)
- **Paleta de Colores**: Fondo blanco puro (`#FFFFFF`) o negro galería (`#0A0A0A`). Acentos en dorado (`#C5A049`) para elementos de prestigio.
- **Tipografía**: Títulos en Serif elegante (ej. Playfair Display) para denotar historia y arte. Cuerpo en Sans-serif (ej. Inter) para legibilidad.
- **Visualización**: Las imágenes de las obras deben ser las protagonistas. Usar sombras suaves y bordes finos para que las piezas "floten".

### 2. Tokenización y Diseño Atómico
- **Variables**: Prohibido usar `#hex` o `px` hardcodeados. Usar `var(--art-color-...)`.
- **Componentización**: Extraer componentes si superan las 20 líneas o tienen estados complejos.

## Recursos
- Plantilla de Tokens: `resources/design_tokens_template.json`

---

## Checklist de Calidad para Artico
- [ ] ¿Es la obra de arte el elemento principal de la vista?
- [ ] ¿Se usan los tokens de la paleta "Gallery"?
- [ ] ¿Maneja estados de carga de imágenes pesadas con skeletons elegantes?
- [ ] ¿Separa la lógica de metadatos de la capa visual?
