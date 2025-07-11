import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

import userRoutes from "./routes/userRoutes";
import sensorRoutes from "./routes/sensorRoutes";
import dataRoutes from "./routes/dataRoutes";
import aiRoutes from "./routes/aiRoutes";
import rootaiRoutes from "./routes/rootaiRoutes";
import tagRoutes from "./routes/tagRoutes";

const app = express();

app.use(
  session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

dotenv.config({ path: "./.env" });

app.use(bodyParser.json());

app.use(cors());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Expose-Headers", "Authorization");
  next();
});

app.use(express.json());
app.use("/users", userRoutes);
app.use("/sensors", sensorRoutes);
app.use("/api", dataRoutes);
app.use("/ai", aiRoutes);
app.use("/rootai", rootaiRoutes);
app.use("/api", tagRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, I am the API server!");
});

const host: string = "0.0.0.0";

var httpServer = http.createServer(app);
const port: number = 3420;
httpServer.listen(port, host, () => {
  console.log(`Listening at http://localhost:${port}`);
});
