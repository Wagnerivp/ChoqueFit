-- SUPABASE_SCHEMA_MODULES_16_TO_20.sql
-- ==============================================================================
-- COMANDO TÁTICO: EXPANSÃO DE MÓDULOS 16-20
-- ==============================================================================

-- 1. ALTER TABLE: Adicionando Módulo 17 (Psicologia) e 19 (Ecossistema) nas logs diárias
ALTER TABLE daily_logs 
ADD COLUMN IF NOT EXISTS stress_level INT CHECK (stress_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS anxiety_level INT CHECK (anxiety_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS hunger_level INT CHECK (hunger_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS water_consumed_ml INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS steps_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4,2) DEFAULT 0.0;

-- 2. CREATE TABLE: Módulo 16 (Receitas) e Tracker de Refeições via Gemini Vision
CREATE TABLE IF NOT EXISTS meal_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_url TEXT,
    dish_name TEXT,
    calories INT,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fats_g DECIMAL(5,2),
    is_approved BOOLEAN,
    feedback_ai TEXT
);

CREATE TABLE IF NOT EXISTS generated_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recipe_name TEXT NOT NULL,
    ingredients JSONB NOT NULL,
    instructions TEXT NOT NULL,
    macros JSONB NOT NULL
);

-- 3. CREATE TABLE: Módulo 18 (Gamificação Social, Avatar e Desafios)
CREATE TABLE IF NOT EXISTS avatars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_level INT DEFAULT 1,
    experience_points INT DEFAULT 0,
    appearance_tier VARCHAR(50) DEFAULT 'RECRUTA', -- Muda conforme perda de peso
    tactical_coins INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS community_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reward_coins INT DEFAULT 100,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_challenge_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
    progress_status VARCHAR(50) DEFAULT 'ACTIVE',
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, challenge_id)
);

-- 4. CREATE TABLE: Módulo 20 (Academia e Rotinas de Treino)
CREATE TABLE IF NOT EXISTS workout_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL, -- Ex: 'Em Casa', 'Academia', 'Iniciante'
    title VARCHAR(255) NOT NULL,
    estimated_duration_mins INT,
    difficulty VARCHAR(50),
    exercises JSONB NOT NULL -- Relacionamento desnormalizado para as séries e reps
);
