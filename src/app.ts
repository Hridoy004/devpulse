import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { authRouter } from "./modules/auth/auth.route";
import { issueRouter } from "./modules/issues/issues.route";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5000",
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server",
    author: "Aliza",
  });
});

app.use("/api/issues", issueRouter);
app.use("/api/auth", authRouter);

app.use(globalErrorHandler);

export default app;
