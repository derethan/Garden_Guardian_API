/***************************************
 *  This Controller is used to handle the API requests
 *  To the Different API Endpoints for Plant Information.
 *
 * The API requests are made to the following APIs:
 * 1. Fruityvice API - Used to get information about fruits
 * 2. Trefle API - Used to get information about plants
 * 3.  GG Database - Used to store information about plants
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
    return res
      .status(201)
      .json({ error: `Oops! This Plant has already been added` });
  }

  // Handle the case where the plant does not exist in the database

  // NOTE: Plant Generation may need to handle the case where the AI does not return any information
  // It should Return an error for this before attempting to add the plant to the database
  // But, in the event that doesnt work as intended it may need to be handled here as well
  
  if (!plantExists) {
    // If Variety is not provided, use generated plant info for Main plant species from client
    if (!variety) {
      console.log(
        "Variety not provided, adding Only the plant to the database"
      );

      // If the Plant is added to the database, return a success message
      if (addPlantToDB(plant, properties)) {
        console.log("Plant added to the database");
        return res.status(200).json({ message: "Plant added to the database" });
      }
    }

    // If variety is provided, generate default Plant data for Main plant species before adding to Database
    if (variety) {
      console.log(
        "Variety provided, Creating Plant Info for Main Plant Species"
      );

      // Query AI for Plant Information
      const plantInfo = await queryAIForPlantInfo(plant, null, properties);

      // Convert the plantInfo to an Array of objects with a Title and Value
      const convertedPlantInfo = Object.entries(plantInfo).map(
        ([key, value]) => {
          return { title: key, value: value };
        }
      );

      // If the Plant is added to the database, return a success message
      if (addPlantToDB(plant, convertedPlantInfo)) {
        console.log("Plant added to the database");
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
    return res
      .status(201)
      .json({ error: `Oops! This Variety of ${plant} has already been added` });
  }

  // If the Variety does not exist in the database, add it
  if (!varietyExists && variety) {
    if (addVarietyToDB(plant, variety, properties)) {
      console.log("Variety added to the database");
      res.status(200).json({ message: "Variety added to the database" });
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
      error:
        "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};


//Route to Get all Varieties of a Plant from the GG Database and return them to the client
const getPlantVariety = async (req, res) => {
  const plant = req.params.plant;

  const SQL = `SELECT * FROM plants_variety WHERE plant = ?`;
  const values = [plant];

  try {
    const response = await dbQueryPromise(SQL, values);

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};

/************************************************************
 * Functions to Add/Remove/Update Plants in the GG Database
 * ***********************************************************/

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
    res.status(500).json({
      error: "Server Connection Error: Failed to add plant to the the Database",
    });
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
    res.status(500).json({
      error: "Server Connection Error: Failed to add plant to the the Database",
    });
  }
};


module.exports = {
  getAllPlants,
  getPlantVariety,
  addPlant,
};
