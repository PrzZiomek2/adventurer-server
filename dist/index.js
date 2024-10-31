"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.pgData = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const pg_1 = require("pg");
require("dotenv/config");
const routes_1 = __importDefault(require("./routes"));
const kafka_1 = require("./services/kafka");
const app = (0, express_1.default)();
const port = 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use((0, compression_1.default)({ threshold: 512 }));
app.use((_, res, next) => {
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
exports.pgData = {
    user: "postgres",
    password: process.env.PG_DB_PASSWORD,
    host: "localhost",
    port: 5432,
    database: process.env.PG_DB_NAME,
};
exports.client = new pg_1.Client(exports.pgData);
exports.client.connect().then(() => {
    console.log("pg database connected");
});
app.use(routes_1.default);
(0, kafka_1.runKafkaConsumer)().catch(console.error);
app.listen(port, () => {
    console.log(`server listening at http://localhost:${port}`);
});
