const fs = require('fs');
const dbQueryPromise = require('./db/dbConnect');

const sql = fs.readFileSync('./tag_mappings.sql', 'utf8');

dbQueryPromise(sql)
  .then(() => {
    console.log('Successfully executed SQL script');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error executing SQL script:', err);
    process.exit(1);
  });
