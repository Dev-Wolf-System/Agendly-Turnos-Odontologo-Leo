# Prompts maestros — Avax Health

Esta carpeta contiene **prompts senior, self-contained**, listos para pasarle a Claude (claude.ai, Claude Code o API). Cada uno carga el contexto completo del producto y dispara un flujo de trabajo profesional.

## 📂 Contenido

| Archivo | Para qué sirve | Salida esperada |
|---------|----------------|-----------------|
| [`01-documentacion-tecnica-y-funcional.md`](./01-documentacion-tecnica-y-funcional.md) | Generar la documentación oficial del sistema (técnica + funcional + operativa) | 17 capítulos en Markdown organizados en `docs/`, con diagramas Mermaid, ejemplos de API, matriz de roles, glosario y FAQ |
| [`02-marketing-y-contenido.md`](./02-marketing-y-contenido.md) | Producir toda la artillería de marketing y contenido | Landing principal + landings por especialidad, anuncios pagos (Meta/Google/LinkedIn/YouTube), reels orgánicos para 30 días, secuencias de email, outreach frío, casos de éxito, pitch deck, calendario 90 días |

## 🚀 Cómo usarlos

1. Abrí el `.md` que necesitás.
2. Copiá **TODO** lo que está dentro del bloque `## PROMPT` (incluido el rol, el contexto, las personas, los entregables y las instrucciones operativas).
3. Pegalo como primer mensaje en una conversación nueva con Claude.
4. Claude te va a devolver primero un **plan** (no genera todo de una). Aprobalo o pedile ajustes.
5. Después seguís el plan paso por paso.

## 🧠 Por qué están diseñados así

- **Self-contained:** no necesitás explicarle a Claude qué es Avax Health — el prompt ya lo explica.
- **Anti-invención:** ambos prompts incluyen instrucciones explícitas de marcar `⚠ pendiente de validar` cuando falte info, en lugar de inventar.
- **Plan-first workflow:** Claude devuelve un plan antes de producir, así corregís el rumbo sin desperdiciar trabajo.
- **Calidad senior:** los prompts establecen la barra ("cero stock copy", "cero placeholders genéricos", "cada CTA accionable") en lugar de dejarlo al criterio del modelo.

## 🔄 Mantenimiento

Cada vez que el producto evolucione de forma material (nueva feature core, cambio de pricing, cambio de stack), actualizá la sección de contexto del prompt correspondiente. Los prompts viven con el producto — no son un artefacto de "hecho una vez".
