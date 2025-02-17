-- Add time columns to time_progress table
ALTER TABLE time_progress
  ADD COLUMN start_hour integer NOT NULL DEFAULT 6,
  ADD COLUMN start_minute integer NOT NULL DEFAULT 0,
  ADD COLUMN end_hour integer NOT NULL DEFAULT 6,
  ADD COLUMN end_minute integer NOT NULL DEFAULT 0;

-- Add check constraints for valid time values
ALTER TABLE time_progress
  ADD CONSTRAINT time_progress_start_hour_check CHECK (start_hour >= 0 AND start_hour <= 23),
  ADD CONSTRAINT time_progress_start_minute_check CHECK (start_minute >= 0 AND start_minute <= 59),
  ADD CONSTRAINT time_progress_end_hour_check CHECK (end_hour >= 0 AND end_hour <= 23),
  ADD CONSTRAINT time_progress_end_minute_check CHECK (end_minute >= 0 AND end_minute <= 59);

-- Create function to validate time range
CREATE OR REPLACE FUNCTION validate_time_progress_range()
RETURNS trigger AS $$
BEGIN
  -- Convert dates and times to timestamps for comparison
  DECLARE
    start_timestamp timestamptz;
    end_timestamp timestamptz;
  BEGIN
    start_timestamp := (NEW.start_date + 
      make_interval(hours => NEW.start_hour, mins => NEW.start_minute))::timestamptz;
    end_timestamp := (NEW.end_date + 
      make_interval(hours => NEW.end_hour, mins => NEW.end_minute))::timestamptz;

    IF end_timestamp <= start_timestamp THEN
      RAISE EXCEPTION 'End time must be after start time';
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time range validation
DROP TRIGGER IF EXISTS validate_time_progress_range_trigger ON time_progress;
CREATE TRIGGER validate_time_progress_range_trigger
  BEFORE INSERT OR UPDATE ON time_progress
  FOR EACH ROW
  EXECUTE FUNCTION validate_time_progress_range();