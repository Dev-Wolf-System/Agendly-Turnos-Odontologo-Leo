# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Este archivo proporciona orientación a Claude Code cuando trabaja con código en este repositorio.

## 📌 Descripción del Proyecto

**Avax Health** Sistema Saas que ayude a clinicas y consultorios a gestiona los pacientes, historial medico, gestion de turnos, que lleva la contabilidad, inventario y proveedores todo esto impulsado por IA

- Programación de citas para clínicas dentales  
- Automatización de WhatsApp mediante n8n + Evolution API  
- Panel administrativo  
- Atención al cliente impulsada por IA (OpenAI)  
- Integraciones externas:
  - Google Calendar  
  - Google Docs  
  - Gmail  
  - Google Sheets  
  - Mercado Pago  

## 🧰 Stack Tecnológico

- **Backend:** NestJS (Node.js), TypeScript, PostgreSQL, Redis  
- **Frontend:** Next.js (React), TailwindCSS, Shadcn UI  
- **Automatización:** workflows de n8n, Evolution API (WhatsApp), OpenAI  
- **Pagos:** Mercado Pago  

## 🏗️ Arquitectura

Monolito modular diseñado para una futura migración a microservicios.  
Multi-tenant (multi-clínica) desde su concepción.

### Backend

Sigue las convenciones de NestJS:

- Organización basada en módulos:
  - `/modules/patients`
  - `/modules/appointments`
  - `/modules/payments`
- Separación de responsabilidades:
  - **Controllers → Services → Repositories**
- Uso de **DTOs** para toda validación de requests  
- Utilidades compartidas en `/common`  
- Configuración centralizada en `/config`  

### Frontend

Basado en la estructura **App Router** de Next.js:

- `/app` → rutas  
- `/components` → componentes UI  
- `/services` → llamadas a la API  
- `/hooks` → hooks personalizados  

## 📏 Guías de Desarrollo

- Todo el código debe ser **TypeScript con tipado estricto**  
- La lógica de negocio debe vivir en los **services**, nunca en los controllers  
- Diseñar todos los modelos de datos y APIs con soporte **multi-tenant**  
- Responder en español cuando el usuario escribe en español  