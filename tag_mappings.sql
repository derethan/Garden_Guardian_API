CREATE TABLE tag_mappings (
  tag_id VARCHAR(50) PRIMARY KEY,
  plant_id INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
