"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaggedPlant = exports.updatePlantDescription = exports.queryPlantDetails = exports.addPlant = exports.getVarietyDetails = exports.getPlantVarieties = exports.getPlantDetails = exports.getAllPlants = void 0;
const dbConnect_1 = __importDefault(require("../db/dbConnect"));
const aiController_1 = require("./aiController");
const addPlant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const plant = req.body.plant || null;
    const variety = req.body.variety || null;
    const properties = req.body.properties || null;
    const plantExists = yield checkForPlant(plant);
    if (plantExists && !variety) {
        console.log("Plant already exists in the database");
        return res.status(200).json({ error: `Oops! This Plant has already been added` });
    }
    if (!plantExists) {
        if (!variety) {
            console.log("Variety not provided, adding Only the plant to the database");
            try {
                yield addPlantToDB(plant, properties);
                console.log("Plant added to the database");
                return res.status(200).json({ message: "Plant added to the database" });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({
                    error: "Server Connection Error: Failed to add plant to the the Database",
                });
            }
        }
        if (variety) {
            console.log("Variety provided, Creating Plant Info for Main Plant Species");
            const plantInfo = yield (0, aiController_1.queryAIForPlantInfo)(plant, null, properties);
            const convertedPlantInfo = Object.entries(plantInfo).map(([key, value]) => {
                return { title: key, value: value };
            });
            try {
                yield addPlantToDB(plant, convertedPlantInfo);
                console.log("Plant added to the database");
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({
                    error: "Server Connection Error: Failed to add plant to the the Database",
                });
            }
        }
    }
    const varietyExists = variety ? yield checkForVariety(variety) : false;
    if (varietyExists && variety) {
        console.log("Variety already exists in the database");
        return res.status(200).json({ error: `Oops! This Variety of ${plant} has already been added` });
    }
    if (!varietyExists && variety) {
        try {
            yield addVarietyToDB(plant, variety, properties);
            console.log("Variety added to the database");
            res.status(200).json({ message: "Variety added to the database" });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Server Connection Error: Failed to add variety to the the Database",
            });
        }
    }
});
exports.addPlant = addPlant;
const getAllPlants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const SQL = `SELECT * FROM plants`;
    try {
        const response = yield (0, dbConnect_1.default)(SQL);
        res.status(200).json(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server Connection Error: Failed to fetch data from the the Database",
        });
    }
});
exports.getAllPlants = getAllPlants;
const getPlantVarieties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const plant = req.params.plant || null;
    const SQL = isNaN(Number(plant)) ? `SELECT * FROM plants_variety WHERE plant = ?` : `SELECT * FROM plants_variety WHERE id = ?`;
    const values = [plant];
    try {
        const response = yield (0, dbConnect_1.default)(SQL, values);
        res.status(200).json(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server Connection Error: Failed to fetch data from the the Database",
        });
    }
});
exports.getPlantVarieties = getPlantVarieties;
const getPlantDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const plant = req.params.plant || null;
    try {
        const response = yield queryPlantDetails(plant);
        if (response.length === 0) {
            return res.status(404).json({ error: `Oops! ${plant} does not exist in the database` });
        }
        let data = response[0];
        res.status(200).json(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server Connection Error: Failed to fetch data from the the Database",
        });
    }
});
exports.getPlantDetails = getPlantDetails;
const getVarietyDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const variety = req.params.variety || null;
    const SQL = isNaN(Number(variety)) ? `SELECT * FROM plants_variety WHERE name = ?` : `SELECT * FROM plants_variety WHERE id = ?`;
    const values = [variety];
    try {
        const response = yield (0, dbConnect_1.default)(SQL, values);
        if (response.length === 0) {
            return res.status(404).json({ error: `Oops! ${variety} does not exist in the database` });
        }
        let data = response[0];
        return res.status(200).json(data);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Server Connection Error: Failed to fetch data from the the Database",
        });
    }
});
exports.getVarietyDetails = getVarietyDetails;
const getTaggedPlant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tagId = req.params.tagId;
    const sql = "SELECT plant_id FROM tag_mappings WHERE tag_id = ?";
    const values = [tagId];
    try {
        const response = yield (0, dbConnect_1.default)(sql, values);
        if (response.length === 0) {
            return res.status(404).json({ error: "Tag not found" });
        }
        res.status(200).json({ plantId: response[0].plant_id });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Connection Error: Failed to fetch data from the the Database" });
    }
});
exports.getTaggedPlant = getTaggedPlant;
const queryPlantDetails = (plant) => __awaiter(void 0, void 0, void 0, function* () {
    const SQL = isNaN(Number(plant)) ? `SELECT * FROM plants WHERE LOWER(name) = LOWER(?)` : `SELECT * FROM plants WHERE id = ?`;
    const values = [plant];
    try {
        const response = yield (0, dbConnect_1.default)(SQL, values);
        return response;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
});
exports.queryPlantDetails = queryPlantDetails;
const updatePlantDescription = (plant, description) => __awaiter(void 0, void 0, void 0, function* () {
    const SQL = `UPDATE plants SET description = ? WHERE LOWER(name) = LOWER(?)`;
    const values = [description, plant];
    try {
        const response = yield (0, dbConnect_1.default)(SQL, values);
        return response;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
});
exports.updatePlantDescription = updatePlantDescription;
const checkForPlant = (plant) => __awaiter(void 0, void 0, void 0, function* () {
    const SQL = `SELECT * FROM plants WHERE LOWER(name) = LOWER(?)`;
    const values = [plant];
    try {
        const response = yield (0, dbConnect_1.default)(SQL, values);
        if (response.length === 0) {
            return false;
        }
        return true;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
});
const checkForVariety = (variety) => __awaiter(void 0, void 0, void 0, function* () {
    const SQL = `SELECT * FROM plants_variety WHERE LOWER(name) = LOWER(?)`;
    const values = [variety];
    try {
        const response = yield (0, dbConnect_1.default)(SQL, values);
        if (response.length === 0) {
            return false;
        }
        return true;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
});
const addPlantToDB = (plant, properties) => __awaiter(void 0, void 0, void 0, function* () {
    const SQL = `INSERT INTO plants (name, description, harvestTime, howtoSow, spacing , growsWith, avoid) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [plant];
    if (properties) {
        properties.forEach((property) => {
            values.push(property.value);
        });
    }
    try {
        yield (0, dbConnect_1.default)(SQL, values);
        return true;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
});
const addVarietyToDB = (plant, variety, properties) => __awaiter(void 0, void 0, void 0, function* () {
    const SQL = `INSERT INTO plants_variety (name, plant, description, harvestTime, howtoSow, spacing , growsWith, avoid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [variety, plant];
    if (properties) {
        properties.forEach((property) => {
            values.push(property.value);
        });
    }
    try {
        yield (0, dbConnect_1.default)(SQL, values);
        return true;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
});
