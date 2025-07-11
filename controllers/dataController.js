/***************************************
 *  This Controller is used to handle the API requests
 *  To the Different API Endpoints for Plant Information.
 *
 * The API requests are made to the following APIs:
GG Database - Used to store information about plants
 * ************************************/

/***************************************
 *  Import Required Libraries
 * ************************************/
const axios = require("axios");

/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require("../db/dbConnect"); // Import dbconnect.js
const { queryAIForPlantInfo } = require("./aiController");

/************************************************************
 *  Functions to Handle API Requests to the GG Database
 * ***********************************************************/

// Route to handle Adding Plants & Varieties to the GG Database
const addPlant = async (req, res) => {
  const plant = req.body.plant || null;
  const variety = req.body.variety || null;
  const properties = req.body.properties || null;

  /****************************************************
   Handle Adding and Verifying the Plant in the Database
  ****************************************************/

  //Check if the plant exists in the database
  const plantExists = await checkForPlant(plant);

  // If the plant exists in the database, and a variety is not provided, return an error
  // useCase: Used when a plant is added without a variety, prevent duplicate plants
  if (plantExists && !variety) {
    console.log("Plant already exists in the database");
    return res.status(200).json({ error: `Oops! This Plant has already been added` });
  }

  // Handle the case where the plant does not exist in the database
  if (!plantExists) {
    // If Variety is not provided, use generated plant info for Main plant species from client
    if (!variety) {
      console.log("Variety not provided, adding Only the plant to the database");
      try {
        await addPlantToDB(plant, properties);
        console.log("Plant added to the database");
        return res.status(200).json({ message: "Plant added to the database" });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          error: "Server Connection Error: Failed to add plant to the the Database",
        });
      }
    }

    // If variety is provided, generate default Plant data for Main plant species before adding to Database
    if (variety) {
      console.log("Variety provided, Creating Plant Info for Main Plant Species");

      // Query AI for Plant Information
      const plantInfo = await queryAIForPlantInfo(plant, null, properties);

      // Convert the plantInfo to an Array of objects with a Title and Value
      const convertedPlantInfo = Object.entries(plantInfo).map(([key, value]) => {
        return { title: key, value: value };
      });

      try {
        await addPlantToDB(plant, convertedPlantInfo);
        console.log("Plant added to the database");
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          error: "Server Connection Error: Failed to add plant to the the Database",
        });
      }
    }
  }

  /*********************************************************** 
   Handle Adding and Verifying the Plant Variety in the Database
  *************************************************************/

  // Check if the Variety exists in the database, if so return an error
  const varietyExists = variety ? await checkForVariety(variety) : false;

  if (varietyExists && variety) {
    console.log("Variety already exists in the database");
    return res.status(200).json({ error: `Oops! This Variety of ${plant} has already been added` });
  }

  // If the Variety does not exist in the database, add it
  if (!varietyExists && variety) {
    try {
      await addVarietyToDB(plant, variety, properties);
      console.log("Variety added to the database");
      res.status(200).json({ message: "Variety added to the database" });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Server Connection Error: Failed to add variety to the the Database",
      });
    }
  }
};

//Route to Get all Plants from the GG Database and return them to the client
const getAllPlants = async (req, res) => {
  const SQL = `SELECT * FROM plants`;

  try {
    const response = await dbQueryPromise(SQL);

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};

//Route to Get all Varieties of a Plant from the GG Database and return them to the client
const getPlantVarieties = async (req, res) => {
  const plant = req.params.plant || null;

  const SQL = isNaN(plant) ? `SELECT * FROM plants_variety WHERE plant = ?` : `SELECT * FROM plants_variety WHERE id = ?`;
  const values = [plant];

  try {
    const response = await dbQueryPromise(SQL, values);

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};

// TODO: Merge these 2 routes and find a way to join both tables from the database
//       and retrive the info based on a supplied Plant or variety Name/ID
//       For refference see: userController.getGardenPlants
const getPlantDetails = async (req, res) => {
  const plant = req.params.plant || null;

  try {
    const response = await queryPlantDetails(plant);

    //If the response is empty, the plant does not exist
    if (response.length === 0) {
      return res.status(404).json({ error: `Oops! ${plant} does not exist in the database` });
    }

    let data = response[0]; //Get the first item in the response array

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};
const getVarietyDetails = async (req, res) => {
  const variety = req.params.variety || null;

  const SQL = isNaN(variety) ? `SELECT * FROM plants_variety WHERE name = ?` : `SELECT * FROM plants_variety WHERE id = ?`;

  const values = [variety];

  try {
    const response = await dbQueryPromise(SQL, values);

    //If the response is empty, the variety does not exist
    if (response.length === 0) {
      return res.status(404).json({ error: `Oops! ${variety} does not exist in the database` });
    }

    let data = response[0];

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};

const getTaggedPlant = async (req, res) => {
  const tagId = req.params.tagId;
  const sql = "SELECT plant_id FROM tag_mappings WHERE tag_id = ?";
  const values = [tagId];

  try {
    const response = await dbQueryPromise(sql, values);

    if (response.length === 0) {
      return res.status(404).json({ error: "Tag not found" });
    }

    res.status(200).json({ plantId: response[0].plant_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Connection Error: Failed to fetch data from the the Database" });
  }
};

/************************************************************
 * Functions to Add/Remove/Update Plants in the GG Database
 * ***********************************************************/
//Function to query the Database for the plant details
const queryPlantDetails = async (plant) => {
  const SQL = isNaN(plant) ? `SELECT * FROM plants WHERE LOWER(name) = LOWER(?)` : `SELECT * FROM plants WHERE id = ?`;
  const values = [plant];

  try {
    const response = await dbQueryPromise(SQL, values);

    return response;
  } catch (error) {
    console.error(error);
    return;
  }
};

//Function to update a plant desctiption to the GG database
const updatePlantDescription = async (plant, description) => {
  // prepare the SQL query to add the plant to the database
  const SQL = `UPDATE plants SET description = ? WHERE LOWER(name) = LOWER(?)`;
  const values = [description, plant];

  try {
    const response = await dbQueryPromise(SQL, values);
    return response;
  } catch (error) {
    console.error(error);
    return;
  }
};

// Function to Check if the plant already exists in the GG database
const checkForPlant = async (plant) => {
  //check if the plant exists in the database
  const SQL = `SELECT * FROM plants WHERE LOWER(name) = LOWER(?)`;
  const values = [plant];

  try {
    const response = await dbQueryPromise(SQL, values);

    //If the response is empty, the plant does not exist
    if (response.length === 0) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// Function to Check if the Variety exists in the GG database
const checkForVariety = async (variety) => {
  //check if the variety exists in the database
  const SQL = `SELECT * FROM plants_variety WHERE LOWER(name) = LOWER(?)`;
  const values = [variety];

  try {
    const response = await dbQueryPromise(SQL, values);

    //If the response is empty, the variety does not exist
    if (response.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// Function to add the plant to the GG database
const addPlantToDB = async (plant, properties) => {
  // prepare the SQL query to add the plant to the database
  const SQL = `INSERT INTO plants (name, description, harvestTime, howtoSow, spacing , growsWith, avoid) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const values = [plant];

  //Loop through the properties and add them to the values array
  properties.forEach((property) => {
    values.push(property.value);
  });

  try {
    const response = await dbQueryPromise(SQL, values);
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Function to add the variety to the GG database
const addVarietyToDB = async (plant, variety, properties) => {
  // prepare the SQL query to add the plant to the database
  const SQL = `INSERT INTO plants_variety (name, plant, description, harvestTime, howtoSow, spacing , growsWith, avoid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [variety, plant];

  //Loop through the properties and add them to the values array
  properties.forEach((property) => {
    values.push(property.value);
  });

  try {
    const response = await dbQueryPromise(SQL, values);
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  getAllPlants,
  getPlantDetails,
  getPlantVarieties,
  getVarietyDetails,
  addPlant,
  queryPlantDetails,
  updatePlantDescription,
  getTaggedPlant,
};