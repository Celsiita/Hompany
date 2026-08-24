# Funcionalidades de HOMPANY

Guía de producto para quien use o revise la app. La periodicidad está detallada en [`recurrence.md`](./recurrence.md). Los avisos, en [`notifications.md`](./notifications.md).

## Pantallas

| Tab | Para qué sirve |
|-----|----------------|
| **Home** | Pestañas **Feed** (salud, métricas, **clasificación**, deudas) y **Agenda** (7 días + calendario mensual). Menú ⋮: avisos e iconos. |
| **Tareas** | Tablero En curso / Historial. Filtros, intercambios, foto de prueba. Menú ⋮: crear, ver pausadas/archivadas. |
| **Gastos** | Súper, casa y ocio. En curso / Historial. Menú ⋮: crear, ver pausados/archivados. |
| **Ajustes** | Perfil, iconos, código de invitación, compañeros, abandonar piso, borrar cuenta, sesión. |

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
- Completar con foto **opcional** (cámara, galería o sin foto).
- Títulos de ciclo: `Alquiler - Agosto 2026`; diaria/semanal con el primer día del periodo.
- **Intercambiar** es un botón ⇄. **Eliminar** está dentro de Editar. Crear solo desde el menú ⋮.
- En tarjetas se ve el **nombre** del asignado, no solo la inicial.
- Countdown = fecha exacta + días de calendario (`Vence el 15 mar (en 3 días)`).
- Badges: Pendiente (ámbar), En revisión (azul), Completada (verde), etc.

## Filtros

No hay píldora «Todos». Si ninguna categoría, periodicidad, alcance (Mis tareas / Compañeros) o dirección de deuda está activa, se lista todo. Pulsar de nuevo la píldora activa la desmarca.

## Gastos

- Tipos: Supermercado, Casa, **Ocio**.
- **Una vez**: mismo selector de fecha y hora que en tareas. Recurrentes usan el motor compartido y el título de periodo (p. ej. `Alquiler - Agosto 2026`).
- Ticket/recibo **opcional**.
- Countdown si hay fecha límite («Quedan Xd para saldar»).
- Estado UI: gastos `OPEN` se muestran como **Pendiente** (no «Abierto»); **Saldado** en verde.
- **Liquidación:** en **Me deben**, el acreedor usa **Saldar** / **Saldar todo** / **Deshacer**. En **Lo que debo**, **Solicitar** liquidación está bloqueada de momento (avisos al acreedor más adelante).
- Eliminar también va dentro de Editar. Crear solo desde el menú ⋮.

## Salud y agenda

- Barra de salud: **Excelente** (verde ≥ 70 %), **Regular** (ámbar), **Crítico** (rojo < 40 % o hay vencidas).
- Una sola franja: Pendientes | Entregadas | Completadas.
- **Clasificación** del piso: ranking por `reputation_points`, con nombre e info de tareas (hechas, pendientes, en revisión, vencidas). Calculado en Postgres (`get_home_leaderboard`).
- Home se divide en **Feed** (resumen) y **Agenda** (vistas temporales).
- Agenda de 7 días (sin cambios de diseño): tus ítems en azul, los de compañeros en gris. Tocar un ítem abre su tarjeta en Tareas/Gastos (resaltada), sin abrir edición.
- Calendario mensual: navegación mes a mes; puntos **azul** (tuyos) y **verde** (compañeros). Pulsar un día abre la lista; un ítem abre el tablero con la tarjeta enfocada.
- Al **crear** una tarea o gasto, la app salta a su tarjeta en el tablero (feedback visual breve).
- Avisos: ya no van en el Feed; se abren desde el menú ⋮ → **Avisos / Notificaciones**.

## Layout

- Un solo título por pantalla (`ScreenHeader`). La cabecera nativa de tabs está oculta.
- El scroll nativo no hace overscroll (sin franja blanca encima de los tabs). Ajustes deja margen inferior para «Cerrar sesión».

## Iconos

Tres paquetes incluidos (Clásico, Hogar, Play) en Ajustes o en Home ⋮. También puedes **importar un pack JSON** (emojis por clave de tarea/gasto); se guarda en el dispositivo y se usa en tarjetas y en la agenda de 7 días.
