# TODO - Turnero Hospital (Roadmap técnico)

## Fase 1 — Decisiones y ajustes de base de datos

- [x] Confirmar diseño:
  - [x] Direcciones: 1 sola por usuario (UNIQUE por id_user)
  - [x] Disponibilidad/límites por fecha: tabla `doctor_daily_capacity` (historial)
- [x] Aplicar `sequelize.sync({ force: true })` para regenerar tablas.
  - Nota: se perderán datos actuales (según tu confirmación).
- [x] Ajustar modelo `address` a 1 dirección por usuario (UNIQUE).

## Fase 2 — Modelos Sequelize nuevos/modificados

- [ ] Modificar modelo `user`:
  - [ ] agregar `dni` (hasheado)
  - [ ] agregar `nacionalidad`
  - [ ] agregar `telefono` (hasheado)
- [ ] Modificar modelo `address`:
  - [ ] imponer unicidad `id_user` (1 dirección por usuario)
- [ ] Crear modelo `doctor`:
  - [ ] nombre, apellido, especialidad
  - [ ] (opcional) `activo` si lo queremos para UI diaria adicional
- [ ] Crear modelo `doctor_daily_capacity`:
  - [ ] date
  - [ ] id_doctor
  - [ ] limit_turns
  - [ ] enabled (si aplica)
- [ ] Crear modelo `turn`:
  - [ ] id_doctor, id_user
  - [ ] date, status
  - [ ] fields de confirmación (confirmedAt/by)
  - [ ] (si aplica) snapshot/refs para paciente presencial

## Fase 3 — Backend (controllers/routes)

- [ ] Endpoints para admin/secretario:
  - [ ] editar usuarios ajenos (nombre/apellido/dni/nacionalidad/telefono)
  - [ ] gestionar dirección única del usuario (crear/editar)
  - [ ] CRUD de doctores + activar/pausar (si se implementa vía `doctor.activo`)
  - [ ] setear availability y límites por día (doctor_daily_capacity)
- [ ] Endpoints para usuario:
  - [ ] pedir turno (seleccionar doctor disponible para la fecha)
- [ ] Endpoints para secretario:
  - [ ] confirmar turno / cancelar (y que el cupo vuelva a estar disponible)

## Fase 4 — Frontend

- [ ] Panel secretario/admin:
  - [ ] Gestión de doctores
  - [ ] Gestión de disponibilidad + límite por fecha
  - [ ] Gestión de turnos pendientes/confirmados
- [ ] Usuario:
  - [ ] UI para pedir turno (doctor disponible)
  - [ ] Edición de perfil/cuenta
- [ ] Autocompletado de “paciente presencial” (si se decide tabla dedicada)

## Fase 5 — Testing

- [ ] Levantar backend y verificar:
  - [ ] sync(force:true) sin errores
  - [ ] CRUD de doctores
  - [ ] capacidad diaria limita turnos
  - [ ] confirmación/cancelación funciona y actualiza historial
