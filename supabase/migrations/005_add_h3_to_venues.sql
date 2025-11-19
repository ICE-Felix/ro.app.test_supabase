-- Add H3 column to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS h3 TEXT;

-- Create index on H3 column for efficient querying
CREATE INDEX IF NOT EXISTS idx_venues_h3 ON venues(h3);

-- Create index on location coordinates for bounding box queries
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues(location_latitude, location_longitude) 
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Function to calculate H3 cell for given coordinates
CREATE OR REPLACE FUNCTION calculate_h3_cell(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS TEXT AS $$
BEGIN
    -- This function will be implemented using the h3-js library in the application
    -- For now, we'll return NULL and let the application handle H3 calculation
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update existing venues with H3 cells (this will be run by the application)
-- The application will calculate H3 cells and update the venues
-- This is a placeholder for the bulk update that will be done programmatically

-- Add comment to the H3 column
COMMENT ON COLUMN venues.h3 IS 'H3 cell identifier for geospatial indexing and distance queries';
