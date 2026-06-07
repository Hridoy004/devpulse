import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";
import { userController } from "./user.controller";

const router = Router();

router.get("/", auth(USER_ROLE.maintainer), userController.getAllUsers);
router.get("/:id", userController.getSingleUser);

export const userRouter = router;
