import { Request, Response } from 'express';
import axios from "axios";
import dbQueryPromise from "../db/dbConnect";
import { queryAIForPlantInfo } from "./aiController";

interface PlantProperty {
  title: string;
  value: string;
}

interface PlantData {
  plant: string;
  variety?: string;
  properties: PlantProperty[];
}

const addPlant = async (req: Request, res: Response) => {
  const plant: string | null = req.body.plant || null;
  const variety: string | null = req.body.variety || null;
  const properties: PlantProperty[] | null = req.body.properties || null;

  const plantExists: boolean = await checkForPlant(plant);

  if (plantExists && !variety) {
    console.log("Plant already exists in the database");
    return res.status(200).json({ error: `Oops! This Plant has already been added` });
  }

  if (!plantExists) {
    if (!variety) {
      console.log("Variety not provided, adding Only the plant to the database");
      try {
        await addPlantToDB(plant, properties);
        console.log("Plant added to the database");
        return res.status(200).json({ message: "Plant added to the database" });
      } catch (error: any) {
        console.error(error);
        return res.status(500).json({
          error: "Server Connection Error: Failed to add plant to the the Database",
        });
      }
    }

    if (variety) {
      console.log("Variety provided, Creating Plant Info for Main Plant Species");

      const plantInfo: { [key: string]: string } = await queryAIForPlantInfo(plant, null, properties);

      const convertedPlantInfo: PlantProperty[] = Object.entries(plantInfo).map(([key, value]) => {
        return { title: key, value: value };
      });

      try {
        await addPlantToDB(plant, convertedPlantInfo);
        console.log("Plant added to the database");
      } catch (error: any) {
        console.error(error);
        return res.status(500).json({
          error: "Server Connection Error: Failed to add plant to the the Database",
        });
      }
    }
  }

  const varietyExists: boolean = variety ? await checkForVariety(variety) : false;

  if (varietyExists && variety) {
    console.log("Variety already exists in the database");
    return res.status(200).json({ error: `Oops! This Variety of ${plant} has already been added` });
  }

  if (!varietyExists && variety) {
    try {
      await addVarietyToDB(plant, variety, properties);
      console.log("Variety added to the database");
      res.status(200).json({ message: "Variety added to the database" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        error: "Server Connection Error: Failed to add variety to the the Database",
      });
    }
  }
};

const getAllPlants = async (req: Request, res: Response) => {
  const SQL: string = `SELECT * FROM plants`;

  try {
    const response: any[] = await dbQueryPromise(SQL);

    res.status(200).json(response);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};

const getPlantVarieties = async (req: Request, res: Response) => {
  const plant: string | null = req.params.plant || null;

  const SQL: string = isNaN(Number(plant)) ? `SELECT * FROM plants_variety WHERE plant = ?` : `SELECT * FROM plants_variety WHERE id = ?`;
  const values: (string | null)[] = [plant];

  try {
    const response: any[] = await dbQueryPromise(SQL, values);

    res.status(200).json(response);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};

const getPlantDetails = async (req: Request, res: Response) => {
  const plant: string | null = req.params.plant || null;

  try {
    const response: any[] = await queryPlantDetails(plant);

    if (response.length === 0) {
      return res.status(404).json({ error: `Oops! ${plant} does not exist in the database` });
    }

    let data: any = response[0];

    res.status(200).json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};
const getVarietyDetails = async (req: Request, res: Response) => {
  const variety: string | null = req.params.variety || null;

  const SQL: string = isNaN(Number(variety)) ? `SELECT * FROM plants_variety WHERE name = ?` : `SELECT * FROM plants_variety WHERE id = ?`;

  const values: (string | null)[] = [variety];

  try {
    const response: any[] = await dbQueryPromise(SQL, values);

    if (response.length === 0) {
      return res.status(404).json({ error: `Oops! ${variety} does not exist in the database` });
    }

    let data: any = response[0];

    return res.status(200).json(data);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      error: "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};

const getTaggedPlant = async (req: Request, res: Response) => {
  const tagId: string = req.params.tagId;
  const sql: string = "SELECT plant_id FROM tag_mappings WHERE tag_id = ?";
  const values: string[] = [tagId];

  try {
    const response: any[] = await dbQueryPromise(sql, values);

    if (response.length === 0) {
      return res.status(404).json({ error: "Tag not found" });
    }

    res.status(200).json({ plantId: response[0].plant_id });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Server Connection Error: Failed to fetch data from the the Database" });
  }
};

const queryPlantDetails = async (plant: string | null): Promise<any[]> => {
  const SQL: string = isNaN(Number(plant)) ? `SELECT * FROM plants WHERE LOWER(name) = LOWER(?)` : `SELECT * FROM plants WHERE id = ?`;
  const values: (string | null)[] = [plant];

  try {
    const response: any[] = await dbQueryPromise(SQL, values);

    return response;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

const updatePlantDescription = async (plant: string, description: string): Promise<any> => {
  const SQL: string = `UPDATE plants SET description = ? WHERE LOWER(name) = LOWER(?)`;
  const values: string[] = [description, plant];

  try {
    const response: any = await dbQueryPromise(SQL, values);
    return response;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

const checkForPlant = async (plant: string | null): Promise<boolean> => {
  const SQL: string = `SELECT * FROM plants WHERE LOWER(name) = LOWER(?)`;
  const values: (string | null)[] = [plant];

  try {
    const response: any[] = await dbQueryPromise(SQL, values);

    if (response.length === 0) {
      return false;
    }
    return true;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

const checkForVariety = async (variety: string | null): Promise<boolean> => {
  const SQL: string = `SELECT * FROM plants_variety WHERE LOWER(name) = LOWER(?)`;
  const values: (string | null)[] = [variety];

  try {
    const response: any[] = await dbQueryPromise(SQL, values);

    if (response.length === 0) {
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

const addPlantToDB = async (plant: string | null, properties: PlantProperty[] | null): Promise<boolean> => {
  const SQL: string = `INSERT INTO plants (name, description, harvestTime, howtoSow, spacing , growsWith, avoid) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const values: (string | number | null)[] = [plant];

  if (properties) {
    properties.forEach((property) => {
      values.push(property.value);
    });
  }


  try {
    await dbQueryPromise(SQL, values);
    return true;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

const addVarietyToDB = async (plant: string | null, variety: string | null, properties: PlantProperty[] | null): Promise<boolean> => {
  const SQL: string = `INSERT INTO plants_variety (name, plant, description, harvestTime, howtoSow, spacing , growsWith, avoid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const values: (string | number | null)[] = [variety, plant];

  if (properties) {
    properties.forEach((property) => {
      values.push(property.value);
    });
  }

  try {
    await dbQueryPromise(SQL, values);
    return true;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export {
  getAllPlants,
  getPlantDetails,
  getPlantVarieties,
  getVarietyDetails,
  addPlant,
  queryPlantDetails,
  updatePlantDescription,
  getTaggedPlant,
};
