# 🏛️ ARTVAULT - HANDOVER MAESTRO: TECH LEAD & MULTI-AGENT MANAGER

Este documento contiene las especificaciones completas para transferir el proyecto a una nueva sesión de Antigravity donde un **Programador Senior / Tech Lead Manager** coordinará a los agentes de desarrollo.

---

## 1. PASO 1: ABRIR EL PROYECTO COMO WORKSPACE ACTIVO EN ANTIGRAVITY

Actualmente estabas en una conversación global sin espacio de trabajo enlazado. Para que los agentes reconozcan automáticamente los archivos, las skills y las ramas:

1. En el menú superior de Antigravity (o VS Code): **File ➔ Open Folder...** (o *Abrir Carpeta...*).
2. Selecciona la carpeta del proyecto:
   📂 `D:\Proyectos\artico`
3. Al abrir la carpeta como Workspace:
   - Antigravity detectará la carpeta `.agent/skills/` con todas las habilidades instaladas (`verification-before-completion`, `executing-plans`, etc.).
   - Detectará automáticamente el repositorio Git `https://github.com/augustoalr/artvault-.git`.

---

## 2. EL ROL DEL TECH LEAD / MANAGER (CÓMO TRABAJARÁ)

El agente de la conversación principal actuará como **Staff Software Engineer & Project Manager**.
- **No se apresura a picar código desordenado:** Diseña la arquitectura, desglosa tareas atómicas y define la estrategia de Git.
- **Estrategia de Ramas / Worktrees:** 
  Te indicará cuándo abrir una nueva rama o *Worktree* (por ejemplo: `git checkout -b feat/chief-portal-backend`).
- **Orquestación de Agentes:**
  Te entregará prompts exactos, delimitados y listos para copiar en subagentes o nuevas pestañas de desarrollo, indicándote:
  > *"Abre una nueva pestaña, selecciona 'Local Checkout' en la rama `feat/...` y dale esta instrucción al agente ejecutor"*.
- **Control de Calidad (Code Review & Merge):**
  Una vez que el agente ejecutor termine, el Tech Lead revisará el código contra las reglas de diseño (Separación de Responsabilidades, Chesterton's Fence, Tokens de diseño), correrá la verificación técnica y hará el push a GitHub.

---

## 3. PROMPT MAESTRO PARA INICIAR LA CONVERSACIÓN CON EL MANAGER

Copia y pega el siguiente bloque en la nueva conversación:

```markdown
Actúa como Staff Software Engineer, Arquitecto de Sistemas Principal y Technical Project Manager (Tech Lead). 
Tu rol principal en esta conversación es ser el DIRECTOR Y MANAGER del proyecto "ArtVault" (ubicado en este workspace). Coordinarás la arquitectura, desglosarás las tareas en fases atómicas y me indicarás qué ramas o worktrees crear y qué instrucciones exactas asignar a los agentes ejecutores en cada etapa.

================================================================================
ESTADO ACTUAL DEL PROYECTO (100% VERIFICADO):
================================================================================
1. Stack: Next.js 16 (App Router + Turbopack), TypeScript, Tailwind CSS v4, @supabase/ssr, pg, jspdf.
2. Repositorio Git: https://github.com/augustoalr/artvault-.git (Rama principal: `main`, al día).
3. Base de Datos & Backend:
   - Proyecto en la nube Supabase activo: `https://xxakmzbrkqwtbqamsrez.supabase.co`.
   - Buckets en Storage creados: `artworks` (con las fotos ya cargadas) y `signatures`.
   - Esquema FASE 1 completada:
     * Enum `user_role` incluye: 'admin', 'editor', 'conservador', 'visitante', 'seguridad', 'bienes', 'jefe'.
     * Enum `movement_request_status` incluye: 'pending', 'pending_chief', 'pending_security', 'authorized', 'rejected'.
     * Tabla `movement_requests` ya cuenta con: `chief_name`, `chief_id_number`, `chief_department`, `chief_authorized_at`, `chief_signature_path`, `authorized_artwork_ids`.
     * Políticas RLS y funciones actualizadas sin recursión.
4. Skills de ingeniería disponibles en `.agent/skills/`:
   `verification-before-completion`, `executing-plans`, `writing-plans`, `requesting-code-review`, `designing-ux-ui`, etc.

================================================================================
OBJETIVO GENERAL EN CURSO:
Implementar el Flujo de Autorización en Dos Fases para Traslados de Obras Externas:
Etapa 1: Aval del Jefe/Director (Firma Digital, Selección Parcial, Historial).
Etapa 2: Autorización del Oficial de Seguridad física (con Banner de aval previo).
================================================================================

TAREAS PENDIENTES POR EJECUTAR:
- FASE 2: Backend & Servicios (`movementService.ts`, `chiefService.ts`, `securityService.ts`).
  * Al crear traslado externo: estado inicial `pending_chief`.
  * Acción `authorizeByChief`: guardar firma en bucket `signatures`, registrar `chief_name`, `chief_department`, fecha y `authorized_artwork_ids` aprobados (selección parcial 3/5). Cambiar estado a `pending_security`.
  * Acción de Seguridad: solo procesar solicitudes en `pending_security`.
- FASE 3: UI Portal del Jefe (`/chief-portal` y `ChiefPortalView.tsx`).
  * Checklist de obras (no obligatorio marcar todas; selección parcial).
  * Diálogo de confirmación ("Vas a autorizar X de Y obras. ¿Confirmar?").
  * Campos editables de Jefe y Dependencia (pre-llenados pero modificables para preservar historial inalterable).
  * Componente de Firma Dual: Pestaña 1 (Subir imagen/sello), Pestaña 2 (Dibujar firma en Canvas).
  * Sección de Historial de aprobaciones y botón de exportar/previsualizar acta PDF.
- FASE 4: Portal de Seguridad (`SecurityPortalView.tsx`).
  * Filtrar bandeja a solicitudes en `pending_security`.
  * Banner destacado: "Esta solicitud cuenta con el aval previo de: [Nombre del Jefe] - [Oficina]".
- FASE 5: Pruebas End-to-End, Verificación (`verification-before-completion`) y Git Push.

================================================================================
TUS PRIMERAS ACCIONES COMO MANAGER:
1. Revisa la estructura de carpetas de este workspace y confirma que reconoces el estado actual.
2. Define la estrategia de ramas/worktrees para la FASE 2 y FASE 3.
3. Entrégame el plan de trabajo inmediato y la primera instrucción lista para asignarle al agente ejecutor (indicándome en qué rama o worktree trabajar).
```
