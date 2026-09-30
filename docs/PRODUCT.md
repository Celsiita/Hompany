# Funcionalidades de HOMPANY

Guía de producto para quien use o revise la app. La periodicidad está detallada en [`recurrence.md`](./recurrence.md). Los avisos, en [`notifications.md`](./notifications.md).

## Pantallas

| Tab | Para qué sirve |
|-----|----------------|
| **Inicio** | **Feed** (estado, ranking, reputación Plus) y **Agenda** (calendario + lista). Campanita de avisos. |
| **Piso** | Vida del hogar (lo mío + compañeros), reclamar silencio, Wi‑Fi, reglas. |
| **Tareas** | En curso / Historial. Chips **Tuya** / **Compañero**. Botón **+** para crear. Filtros, tipos, intercambios, foto. Ayuda `?`. |
| **Gastos** | Súper/casa/ocio. Chips **Debes** / **Tú pagaste**. Botón **+** para crear. Ayuda `?`. |
| **Ajustes** | Perfil, Plus, iconos, invitación, compañeros, tutorial, foto de prueba (admin), cuenta. |

No hay cabecera nativa duplicada: el título vive solo en la pantalla.

## Cuenta y piso

- Login / registro con **ojo** para mostrar u ocultar la contraseña.
- **Copiar** el código de invitación (feedback «¡Copiado!»).
- Menú ⋮ de cada compañero: historial de actividad, hacer/revocar admin, expulsar (admin).
- **Abandonar piso** (confirma). Si eres el último owner, el rol pasa a otro; si no queda nadie, el piso se borra.
- **Eliminar cuenta**: aviso de pisos asociados, borra membresías y el usuario de Auth.
- Todas las bajas (cuenta, tarea, gasto, miembro, rol, sesión) piden confirmación.

## Tareas

- Estados: pendiente → foto → aprobación / vencida / tarde / por compañero / omitida.
- **Una vez**: selector de fecha y hora; tipo **Fecha límite** o **Fecha de ejecución**. Al completar/saldar → solo Historial.
- Recurrentes: el calendario fija el **primer vencimiento**; semanal/mensual sincronizan día de la semana o día del mes (obligatorios). Sin «meses activos» en UI; **pausa indefinida** sí.
- Recurrentes: primer vencimiento en el **periodo actual** si el día aún no ha pasado; cuenta atrás al próximo `due_at` de la instancia abierta.
- Historial: Completada / Por compañero / Atrasado / Omitida (filtros de historial incluyen chip **Por compañero**).
- Completar con foto según ajustes del piso: **opcional/obligatoria** y **cámara o galería / solo cámara**.
- Al **impugnar**: motivo obligatorio → banner *Requiere revisión: motivo…* hasta nueva entrega.
- Al **aprobar**: sugerencia opcional.
- **Intercambiar** solo en pendientes/vencidas. **Eliminar** dentro de Editar. Crear con **+**.
- **No se puede reabrir** una tarea cerrada. **Repetir** crea una nueva (sin movimiento “repetí” en historial de actividad).
- Badges: Pendiente, En revisión, Completado, Atrasado, **Por compañero**, Omitido, etc.
- Chips de propiedad: **Tuya** / **Compañero** en tarjetas de tarea; **Debes** / **Tú pagaste** / **Pagado** en gastos.
- Botones de acción de tareas usan copy de Mico (`mascotReaction`).

## UX (claridad Shipaton)

- Jerarquía: secciones Feed con barra teal; tabs Home / En curso–Historial en pastillas sólidas.
- Semántica: tareas azul, gastos ámbar, deudas rosa, cobros ámbar, urgentes rojo.
- Filtros iguales en Agenda/Tareas/Gastos (grupos etiquetados + pastillas).
- Feedback: toasts flotantes sin botones; campanita para avisos urgentes.
- Ayuda `?` y tutorial Mico con foco visual en la zona explicada.

- **Tareas:** tipos = **Tareas rápidas** + tipos personalizados del hogar (`home_item_types`). Sin Zonas. Estados en curso: Pendiente / En revisión / Pausada. Historial: Completada / Atrasado / Por compañero / Omitida.
- **Gastos:** kinds builtin (Súper, Casa, Ocio) + tipos personalizados. Dirección: **Mis deudas** / **Mis cobros**. Estados en curso: Pendiente / Pausado. Historial: Saldado / Atrasado / Omitido.
- La pausa de recurrencia se filtra con el chip **Pausada/Pausado** (ya no hay «Ver pausadas y archivadas» en el menú ⋮).

## Gastos

- Tipos: Supermercado, Casa, **Ocio**, más personalizados del hogar.
- **Reparto:** Igualitario | Porcentajes (suman 100) | Cantidades fijas (suman el total). «Dividir entre todos» incluye o excluye al pagador del pool.
- **Una vez**: mismo selector de fecha y hora que en tareas. Recurrentes usan el motor compartido y el título de periodo (p. ej. `Alquiler - Agosto 2026`).
- Ticket/recibo sin etiqueta «opcional».
- Countdown si hay fecha límite («Quedan Xd para saldar»).
- Estado UI: gastos `OPEN` → **Pendiente**; vencidos por fecha → **Atrasado**; **Saldado** en verde.
- **Liquidación:** en **Mis cobros**, el acreedor usa **Saldar** / **Saldar todo** / **Deshacer**. En **Mis deudas**, **Solicitar** liquidación está bloqueada de momento (avisos al acreedor más adelante).
- Eliminar dentro de Editar. Crear con **+**. **No reabrir**. **Repetir** sin log de actividad “repetí”.

## Salud y agenda

- **Mico**: voz del tutorial de onboarding (1ª apertura + Ajustes → Ver tutorial). El Feed no muestra cara ni bocadillos «Mico dice».
- **Info del piso** en Piso: Wi‑Fi, portal, basura, notas.
- **Reglas y quejas** en Piso (quejas pueden ser anónimas).
- **Agenda — avisos del piso**: visitas, reparaciones, eventos (rango de fechas, marcadores en calendario).
- Barra de salud: **Excelente** / **Regular** / **Crítico**.
- Una sola franja: Pendientes | Entregadas | Completadas.
- **Clasificación** del piso: ranking por `reputation_points`, con nombre e info de tareas (hechas, pendientes, en revisión, vencidas). Calculado en Postgres (`get_home_leaderboard`).
- Home se divide en **Feed** / **Agenda**. **Piso** es tab propia (tras Inicio).
- **Agenda:** filtros, calendario semanal compacto; el `?` junto al mes abre la leyenda de colores. Crear/editar vida del hogar → **Piso**.
- **Avisos in-app:** solo campanita + inbox (no lista en el Feed). Ver [`notifications.md`](./notifications.md).
- **Ayuda:** iconos `?` en cabeceras y secciones clave.
- **Tutorial:** tour interactivo v2 (cambia secciones / pestañas) desde 1ª apertura o Ajustes.
- **Filtros Agenda:** botón Filtros con **Quién** (`Mis cosas` | `Compañeros`), **Qué** (`Tareas` / `Gastos`) y **Vida** (`Ausencias` | `Silencio` | `Visitas`). Debes/Te deben se ven por color en calendario (Gastos + Mis cosas).
- **Calendario:** vista semanal por defecto (7 días desde hoy; atrás bloqueada en hoy) o mes (`Ver mes` / `Ver semana`). Puntos: azul / cielo hueco / rosa / ámbar. 🔇 y 🧳 solo en el día.
- **Lista:** días continuos con tarjetas; tap en día del calendario hace scroll a esa sección. Vacío: «Libre». Botón ↑ para volver arriba en Agenda, Tareas y Gastos.
- **Piso:** tres recuadros (Ausencias / Silencio / Visitas) abren modal; **Reclamar silencio** CTA; botón **Emparejar** (teaser matching / Plus); Wi‑Fi/reglas/quejas.
- **Plus:** insights de reputación en Feed (puesto, gap al #1, pts por tareas). Packs de iconos gratis. Roadmap: matching (listados + solicitud). Botón Emparejar también en Inicio.
- Tareas (azul) y gastos (ámbar); **abiertas** vs **programadas** (tarjetas atenuadas). Gastos solo si estás involucrado.
- **Ausencias** (⋮): **Corta** (finde/viaje — solo tareas + reasignación) y **Larga / baja** (congela la app salvo gastos atrasados).
- **Modo silencio** (morado): periodos de baja presión. Franjas violetas en calendario/lista con `🔇`.
- **Modo silencio:** al impugnar una tarea de alguien en exámenes, el resto ve: «Recuerda que [Nombre] está en periodo de exámenes» (también documentado para notificaciones push futuras).
- Asignación manual a alguien ausente en la fecha: bloqueo con `⚠️ [Nombre] estará ausente en esta fecha` (formulario de tarea y reasignación en agenda).
- Si todos los del pool están ausentes en una fecha recurrente, esa ejecución se omite automáticamente.
- Programada: sheet con cancelar esta fecha / reasignar (admin o acreedor) / intercambiar (asignado).
- Tocar una tarjeta abierta en Tareas/Gastos abre **Editar** (sin menú ⋮).
- Tocar un ítem abierto en Agenda abre su tarjeta en Tareas/Gastos (resaltada). Programadas abren sheet de acciones.
- Al **crear** una tarea o gasto, la app salta a su tarjeta en el tablero (feedback visual breve).
- Avisos: ya no van en el Feed; se abren solo desde la campanita.

## Layout

- Un solo título por pantalla (`ScreenHeader`). La cabecera nativa de tabs está oculta.
- Pull-to-refresh en Feed, Agenda, Tareas y Gastos (tint teal). El bounce del scroll solo sirve para eso.

## Iconos

Tres paquetes incluidos (**Clásico**, **Hogar**, **Play**) y packs importados — **todos gratis**. Ver [`monetization.md`](./monetization.md).

## HOMPANY Plus (RevenueCat)

En **Ajustes**: sección Plus → Ver / Restaurar. Hoy: **insights de reputación** en el Feed. Roadmap: matching piso ↔ gente (teaser en tab **Piso**). El core del hogar es gratis.
