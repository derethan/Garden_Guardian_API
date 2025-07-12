"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv = __importStar(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const sensorRoutes_1 = __importDefault(require("./routes/sensorRoutes"));
const dataRoutes_1 = __importDefault(require("./routes/dataRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const rootaiRoutes_1 = __importDefault(require("./routes/rootaiRoutes"));
const tagRoutes_1 = __importDefault(require("./routes/tagRoutes"));
const app = (0, express_1.default)();
app.use((0, express_session_1.default)({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));
dotenv.config({ path: "./.env" });
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.use((req, res, next) => {
    res.header("Access-Control-Expose-Headers", "Authorization");
    next();
});
app.use(express_1.default.json());
app.use("/users", userRoutes_1.default);
app.use("/sensors", sensorRoutes_1.default);
app.use("/api", dataRoutes_1.default);
app.use("/ai", aiRoutes_1.default);
app.use("/rootai", rootaiRoutes_1.default);
app.use("/api", tagRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Hello, I am the API server!");
});
const host = "0.0.0.0";
var httpServer = http.createServer(app);
const port = 3420;
httpServer.listen(port, host, () => {
    console.log(`Listening at http://localhost:${port}`);
});
