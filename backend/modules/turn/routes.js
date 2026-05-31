import express from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { checkRole, ROLES } from "../../middleware/role.middleware.js";
import turnController from "./controller.js";

const router = express.Router();
const ctrl = turnController();

// Usuario pide turno
router.post(
  "/",
  verifyJWT,
  checkRole([ROLES.USER, ROLES.ADMIN, ROLES.SECRETARY]),
  async (req, res, next) => {
    try {
      const { id_doctor, date, id_user, id_patient_record } = req.body;

      // Si es un usuario común, solo puede pedir para sí mismo.
      // Si es Staff, puede usar los IDs enviados en el body.
      const targetUser =
        req.user.id_role === ROLES.USER ? req.user.id_user : id_user;

      const created = await ctrl.requestTurn({
        id_doctor: parseInt(id_doctor, 10),
        date,
        id_user: targetUser,
        id_patient_record: id_patient_record || null,
      });
      return res.json({ error: false, body: created });
    } catch (err) {
      next(err);
    }
  },
);

// Mis turnos
router.get(
  "/my",
  verifyJWT,
  checkRole([ROLES.USER, ROLES.ADMIN, ROLES.SECRETARY]),
  async (req, res, next) => {
    try {
      const list = await ctrl.myTurns(req.user.id_user);
      return res.json({ error: false, body: list });
    } catch (err) {
      next(err);
    }
  },
);

// Pending (secretario/admin)
router.get(
  "/pending",
  verifyJWT,
  checkRole([ROLES.ADMIN, ROLES.SECRETARY]),
  async (req, res, next) => {
    try {
      const list = await ctrl.pendingTurns();
      return res.json({ error: false, body: list });
    } catch (err) {
      next(err);
    }
  },
);

// Confirmar
router.put(
  "/:id_turn/confirm",
  verifyJWT,
  checkRole([ROLES.ADMIN, ROLES.SECRETARY]),
  async (req, res, next) => {
    try {
      const updated = await ctrl.confirmTurn(
        parseInt(req.params.id_turn, 10),
        req.user.id_user,
      );
      return res.json({ error: false, body: updated });
    } catch (err) {
      next(err);
    }
  },
);

// Cancelar
router.put(
  "/:id_turn/cancel",
  verifyJWT,
  checkRole([ROLES.ADMIN, ROLES.SECRETARY]),
  async (req, res, next) => {
    try {
      const updated = await ctrl.cancelTurn(parseInt(req.params.id_turn, 10));
      return res.json({ error: false, body: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
