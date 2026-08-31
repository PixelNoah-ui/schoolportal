-- =============================================================================
-- GRADE MANAGEMENT MODULE - SUPABASE RELATIONSHIPS
-- =============================================================================

-- Create grade_levels table
CREATE TABLE IF NOT EXISTS grade_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  level_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index on level_number for sorting
CREATE INDEX IF NOT EXISTS idx_grade_levels_level_number ON grade_levels(level_number);

-- Add grade_id column to students table with foreign key constraint
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES grade_levels(id) ON DELETE SET NULL;

-- Create index on students.grade_id for faster queries
CREATE INDEX IF NOT EXISTS idx_students_grade_id ON students(grade_id);

-- =============================================================================
-- RELATIONSHIP LINKING CODE (RLC)
-- =============================================================================
-- Table: grade_levels
-- Columns: id (PK), name, level_number
--
-- Relationship: grade_levels -> students
-- Type: One-to-Many (One grade can have many students)
-- Foreign Key: students.grade_id -> grade_levels.id
-- Cascade: ON DELETE SET NULL (removes grade reference if grade deleted)
--
-- Query Students by Grade:
-- SELECT students.* FROM students 
-- WHERE grade_id = {grade_id}
--
-- Query Grade with Student Count:
-- SELECT g.*, COUNT(s.id) as student_count 
-- FROM grade_levels g
-- LEFT JOIN students s ON s.grade_id = g.id
-- GROUP BY g.id
--
-- Query Student with Grade Details:
-- SELECT s.*, g.name, g.level_number 
-- FROM students s
-- LEFT JOIN grade_levels g ON s.grade_id = g.id
-- =============================================================================

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - ADMIN ONLY CRUD
-- =============================================================================

-- Enable RLS on grade_levels table
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;

-- Allow ALL authenticated users to READ grades (for dropdowns, joins, etc.)
CREATE POLICY "Anyone can read grades"
  ON grade_levels FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to INSERT new grades
CREATE POLICY "Admins can create grades"
  ON grade_levels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to UPDATE grades
CREATE POLICY "Admins can update grades"
  ON grade_levels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to DELETE grades
CREATE POLICY "Admins can delete grades"
  ON grade_levels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default grades
INSERT INTO grade_levels (name, level_number) VALUES
  ('Grade 1', 1),
  ('Grade 2', 2),
  ('Grade 3', 3),
  ('Grade 4', 4),
  ('Grade 5', 5),
  ('Grade 6', 6),
  ('Grade 7', 7),
  ('Grade 8', 8),
  ('Grade 9', 9),
  ('Grade 10', 10),
  ('Grade 11', 11),
  ('Grade 12', 12)
ON CONFLICT (name) DO NOTHING;

-- Assign existing students without a grade to Grade 1 (if any exist)
UPDATE students 
SET grade_id = (SELECT id FROM grade_levels WHERE name = 'Grade 1')
WHERE grade_id IS NULL
AND created_at < NOW();
