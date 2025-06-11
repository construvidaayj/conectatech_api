//src/config/server/severExpress.ts
import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
import authRouter from "../../routes/auth.routes";
import contactsRouter from "../../routes/contacts.routes";
import resourcesRouter from "../../routes/resources.routes";

export const serverApp: Application = express();

serverApp.use(morgan("dev"));
serverApp.use(express.json())
serverApp.use(cors());
serverApp.use("/api/auth", authRouter);
serverApp.use("/api/contacts", contactsRouter);
serverApp.use("/api/resources", resourcesRouter);