# Funcionalidades de HOMPANY

Guía de producto para quien use o revise la app. La periodicidad está detallada en [`recurrence.md`](./recurrence.md). Los avisos, en [`notifications.md`](./notifications.md).

## Pantallas

| Tab | Para qué sirve |
|-----|----------------|
| **Home** | Tres secciones: **Feed** (estado, ranking, cuentas), **Agenda** (calendario + lista), **Piso** (Wi‑Fi/reglas). Campanita de avisos. Menú ⋮: ausencias, modo silencio, visitas, iconos. |
| **Tareas** | En curso / Historial. Chips **Tuya** / **Compañero**. Botón **+** para crear. Filtros, tipos, intercambios, foto. Ayuda `?`. |
| **Gastos** | Súper, casa, ocio + tipos. Chips **Debes** / **Tú pagaste**. Botón **+** para crear. Ayuda `?`. |
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
- Historial: **Programada** + **Realización** (`completed_at`).
- Completar con foto según ajustes del piso: **opcional/obligatoria** y **cámara o galería / solo cámara**.
- Al **impugnar**: motivo obligatorio → banner *Requiere revisión: motivo…* hasta nueva entrega.
- Al **aprobar**: sugerencia opcional.
- **Intercambiar** solo en pendientes/vencidas. **Eliminar** dentro de Editar. Crear con **+**.
- **No se puede reabrir** una tarea cerrada. **Repetir** crea una nueva (sin movimiento “repetí” en historial de actividad).
- Badges: Pendiente, En revisión, Completado, Atrasado, **Por compañero**, Omitido, etc.
- Chips de propiedad: **Tuya** / **Compañero** en tarjetas de tarea; **Debes** / **Tú pagaste** / **Pagado** en gastos.
- Botones de acción de tareas usan copy de Mico (`mascotReaction`).

## Filtros

No hay píldora «Todos». Si ninguna categoría, periodicidad, alcance (Mis tareas / Compañeros) o dirección de deuda está activa, se lista todo. Pulsar de nuevo la píldora activa la desmarca.

- **Tareas:** tipos = **Tareas rápidas** + tipos personalizados del hogar (`home_item_types`). Sin Zonas. Estados en curso: Pendiente / En revisión / Pausada. Historial: Completada / Atrasado / Por compañero / Omitida.
- **Gastos:** kinds builtin (Súper, Casa, Ocio) + tipos personalizados. Dirección: **Mis deudas** / **Mis cobros**. Estados en curso: Pendiente / Pausado. Historial: Saldado / Atrasado / Omitido.
- La pausa de recurrencia se filtra con el chip **Pausada/Pausado** (ya no hay «Ver pausadas y archivadas» en el menú ⋮).

## Gastos

- Tipos: Supermercado, Casa, **Ocio**, más personalizados del hogar.
- **Reparto:** Igualitario | Porcentajes (suman 100) | Cantidades fijas (suman el total). «Dividir entre todos» incluye o excluye al pagador del pool.
- **Listas compartidas:** participantes elegibles, gasto vinculado obligatorio, aviso de lo que falta y rotación opcional del comprador.
- **Una vez**: mismo selector de fecha y hora que en tareas. Recurrentes usan el motor compartido y el título de periodo (p. ej. `Alquiler - Agosto 2026`).
- Ticket/recibo sin etiqueta «opcional».
- Countdown si hay fecha límite («Quedan Xd para saldar»).
- Estado UI: gastos `OPEN` → **Pendiente**; vencidos por fecha → **Atrasado**; **Saldado** en verde.
- **Liquidación:** en **Mis cobros**, el acreedor usa **Saldar** / **Saldar todo** / **Deshacer**. En **Mis deudas**, **Solicitar** liquidación está bloqueada de momento (avisos al acreedor más adelante).
- Eliminar dentro de Editar. Crear con **+**. **No reabrir**. **Repetir** sin log de actividad “repetí”.

## Salud y agenda

- **Mico**: voz del tutorial de onboarding (1ª apertura + Ajustes → Ver tutorial). El Feed no muestra cara ni bocadillos «Mico dice».
- **Info del piso** en Feed: Wi‑Fi, portal, basura, notas.
- **Reglas y quejas** en Feed (quejas pueden ser anónimas).
- **Agenda — avisos del piso**: visitas, reparaciones, eventos (rango de fechas, marcadores en calendario).
- Barra de salud: **Excelente** / **Regular** / **Crítico**.
- Una sola franja: Pendientes | Entregadas | Completadas.
- **Clasificación** del piso: ranking por `reputation_points`, con nombre e info de tareas (hechas, pendientes, en revisión, vencidas). Calculado en Postgres (`get_home_leaderboard`).
- Home se divide en **Feed** / **Agenda** / **Piso**.
- **Agenda:** filtros, calendario, leyenda de colores (azul / cielo / ámbar) y lista. Ausencias / modo silencio / visitas → menú ⋮.
- **Avisos in-app:** solo campanita + inbox (no lista en el Feed). Ver [`notifications.md`](./notifications.md).
- **Ayuda:** iconos `?` en cabeceras y secciones clave.
- **Tutorial:** tour interactivo v2 (cambia secciones / pestañas) desde 1ª apertura o Ajustes.
- **Filtros Agenda:** botón Filtros (🙈/🐵) con `Mis cosas` | `Compañeros` (sin selección = Todo el piso) + chips `Tareas` / `Gastos`.
- **Calendario:** vista semanal = **7 días desde hoy** (sin días pasados; la flecha atrás se bloquea en hoy) o mes completo (botón Mes/Semana). Puntos: azul (tuyas), cielo hueco (compañeros), ámbar (gastos), violeta (ausencias), celeste (exámenes).
- **Lista:** días continuos con tarjetas; tap en día del calendario hace scroll a esa sección. Vacío: «Nada previsto».
- Tareas (azul) y gastos (ámbar); **abiertas** vs **programadas** (tarjetas atenuadas). Gastos solo si estás involucrado.
- **Ausencias** (Agenda): dos tipos — **Puntual** (solo tareas + reasignación) e **Indefinida/planificada** (congela la app salvo gastos atrasados). Sin «Estancia en el piso».
- **Modo silencio** (morado): periodos de baja presión. Franjas violetas en calendario/lista con `🔇`.
- **Modo silencio:** al impugnar una tarea de alguien en exámenes, el resto ve: «Recuerda que [Nombre] está en periodo de exámenes» (también documentado para notificaciones push futuras).
- Asignación manual a alguien ausente en la fecha: bloqueo con `⚠️ [Nombre] estará ausente en esta fecha` (formulario de tarea y reasignación en agenda).
- Si todos los del pool están ausentes en una fecha recurrente, esa ejecución se omite automáticamente.
- Programada: sheet con cancelar esta fecha / reasignar (admin o acreedor) / intercambiar (asignado).
- Tocar una tarjeta abierta en Tareas/Gastos abre **Editar** (sin menú ⋮).
- Tocar un ítem abierto en Agenda abre su tarjeta en Tareas/Gastos (resaltada). Programadas abren sheet de acciones.
- Al **crear** una tarea o gasto, la app salta a su tarjeta en el tablero (feedback visual breve).
- Avisos: ya no van en el Feed; se abren desde el menú ⋮ → **Avisos / Notificaciones**.

## Layout

- Un solo título por pantalla (`ScreenHeader`). La cabecera nativa de tabs está oculta.
- El scroll nativo no hace overscroll (sin franja blanca encima de los tabs). Ajustes deja margen inferior para «Cerrar sesión».

## Iconos

Tres paquetes incluidos (Clásico gratis; **Hogar** y **Play** con **HOMPANY Plus**). También puedes **importar un pack JSON** (Plus): emojis por clave de tarea/gasto; se guarda en el dispositivo. Ver [`monetization.md`](./monetization.md).

## HOMPANY Plus (RevenueCat)

En **Ajustes**: sección Plus → Mejorar / Restaurar. Desbloquea packs no-Clásico e importación JSON. El resto de la app (tareas, gastos, agenda) es gratis.
