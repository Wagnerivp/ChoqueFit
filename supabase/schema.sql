-- ==============================================================================
-- CHOQUE FIT - SUPABASE POSTGRESQL SCHEMA (CORE MODULES 1-9)
-- ==============================================================================

-- Habilitar extensão para geração de chaves únicas (UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (O "Recruta")
-- ------------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INT NOT NULL CHECK (age >= 14),
    initial_weight_kg DECIMAL(5,2) NOT NULL,
    target_weight_kg DECIMAL(5,2) NOT NULL,
    height_cm INT NOT NULL,
    budget_level TEXT NOT NULL CHECK (budget_level IN ('BAIXO', 'MEDIO', 'ALTO')),
    routine_wake_up TIME NOT NULL,
    routine_sleep TIME NOT NULL,
    training_time TIME DEFAULT '18:30',
    training_end_time TIME DEFAULT '19:30',
    status TEXT DEFAULT 'ONBOARDING' CHECK (status IN ('ONBOARDING', 'ACTIVE', 'PUNISHED', 'CONCLUDED')),
    contract_signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 2. DAILY_CHECKINS (Dashboard da Verdade & Detector de Mentiras)
-- ------------------------------------------------------------------------------
CREATE TABLE daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_weight_kg DECIMAL(5,2),                      -- Exigido antes das 09h00!
    weight_logged_at TIMESTAMPTZ,
    water_ok BOOLEAN DEFAULT FALSE,
    workout_ok BOOLEAN DEFAULT FALSE,
    diet_ok BOOLEAN DEFAULT FALSE,
    ai_inconsistency_alert TEXT,                         -- Registra se o Gemini notou farsa nos dados
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, checkin_date)
);

-- ------------------------------------------------------------------------------
-- 3. MEALS (Motor Nutricional do Gemini & Adiamento Tático)
-- ------------------------------------------------------------------------------
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    meal_type TEXT NOT NULL,                             -- EX: 'Desjejum', 'Almoço', 'Jantar'
    scheduled_time TIME NOT NULL,
    consumed_time TIME,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OK', 'SKIPPED', 'SNOOZED')),
    snooze_reason TEXT,                                  -- Justificativa para o atraso (Módulo 6)
    snooze_count INT DEFAULT 0,
    ingredients_json JSONB NOT NULL,                     -- Dados estruturados do Gemini
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 4. PANTRY (Gestão Doméstica & Estoque)
-- ------------------------------------------------------------------------------
CREATE TABLE pantry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    unit TEXT NOT NULL,                                  -- EX: 'g', 'ml', 'unidades'
    requires_restock BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, ingredient_name)
);

-- ------------------------------------------------------------------------------
-- 5. SOCIAL_EVENTS (Flexibilidade / Folga Social)
-- ------------------------------------------------------------------------------
CREATE TABLE social_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type TEXT CHECK (event_type IN ('CHEATING_MEAL', 'TRAVEL')),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ADAPTED_BY_AI', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 8. REFERRALS (Loop Viral de Crescimento)
-- ------------------------------------------------------------------------------
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referred_email TEXT NOT NULL,
    status TEXT DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'CONVERTED', 'REWARD_CLAIMED')),
    reward_granted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(referrer_id, referred_email)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA E ISOLAMENTO DE DADOS
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Exemplo RLS Profiles: O usuário só pode ver e alterar seu próprio perfil.
CREATE POLICY "Usuários acessam apenas seu próprio perfil." ON profiles
    FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Usuários acessam apenas seus checkins." ON daily_checkins
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários acessam apenas suas refeições." ON meals
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários gerenciam apenas sua própria despensa." ON pantry
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários acessam apenas seus eventos." ON social_events
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários veem apenas suas próprias indicações." ON referrals
    FOR ALL
    USING (auth.uid() = referrer_id);

-- ==============================================================================
-- MÓDULO 10: GAMIFICAÇÃO MILITAR E SALA DE TROFÉUS (HISTÓRICO DE SERVIÇO)
-- ==============================================================================

-- 1. ATUALIZAÇÃO DA TABELA PROFILES (Missão Ativa do Usuário)
-- Adiciona as colunas para o rastreamento da patente e pontos de honra na missão atual
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS current_rank TEXT DEFAULT 'RECRUTA',
    ADD COLUMN IF NOT EXISTS honor_points INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_mission_name TEXT DEFAULT 'Operação Inicial';

-- 2. NOVA TABELA: SERVICE_RECORDS (Histórico de Serviço / Sala de Troféus)
-- Armazena o registro imutável das missões concluídas e a patente máxima alcançada
CREATE TABLE IF NOT EXISTS service_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mission_name TEXT NOT NULL,                     -- Nome da missão vencida (Ex: 'Projeto Secar Pochete')
    final_rank TEXT NOT NULL,                       -- Patente final conquistada na missão (Ex: 'CORONEL FULL')
    total_honor_points INT NOT NULL,                -- Total de pontos acumulados na missão
    started_at TIMESTAMPTZ NOT NULL,                -- Data de início da missão
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()), -- Data em que bateu a meta
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. ROW LEVEL SECURITY (RLS) PARA A SALA DE TROFÉUS
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

-- Política: O usuário só pode ver seus próprios troféus (histórico de serviço)
CREATE POLICY "Usuários acessam apenas seus status de troféus." ON service_records
    FOR ALL
    USING (auth.uid() = user_id);

-- ==============================================================================
-- MÓDULO 15: CENTRAL DE LOGÍSTICA E INTENDÊNCIA (ESTOQUE, COMPRAS E FINANÇAS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS shopping_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    ingredient_name TEXT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    unit TEXT NOT NULL,
    purchased BOOLEAN DEFAULT FALSE,
    price_paid DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam apenas sua própria lista de compras." ON shopping_list
    FOR ALL
    USING (auth.uid() = user_id);
