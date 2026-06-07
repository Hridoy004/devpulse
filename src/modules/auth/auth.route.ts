import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.loginUser);
router.post("/refresh-token", authController.refreshToken);

export const authRouter = router;
