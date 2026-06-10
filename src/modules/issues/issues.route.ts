import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";
import { issueController } from "./issues.controller";

const router = Router();

router.post(
  "/",
  auth(USER_ROLE.maintainer, USER_ROLE.contributor),
  issueController.createIssue,
);
router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleUser);

export const issueRouter = router;
