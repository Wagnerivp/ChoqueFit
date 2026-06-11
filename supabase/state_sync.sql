-- ==============================================================================
-- SQL PARA SINCRONIZAÇÃO COMPLETA DO ESTADO DO APLICATIVO (choqueFitState_v1)
-- ==============================================================================

-- Abordagem 1: Armazenamento Estruturado (Relacional)
-- Vamos adicionar as colunas que estão no frontend mas não estavam no banco de dados.
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'intro',
    ADD COLUMN IF NOT EXISTS app_signed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS module_start_weight_kg DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS dashboard_state TEXT DEFAULT 'report_weight',
    ADD COLUMN IF NOT EXISTS drinks_alcohol BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS smokes BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS trains_regularly BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS completed_mission_ids INTEGER[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS dashboard_active_tab TEXT DEFAULT 'today',
    ADD COLUMN IF NOT EXISTS dashboard_stock_tab TEXT DEFAULT 'shopping',
    ADD COLUMN IF NOT EXISTS weekly_spent DECIMAL(10,2) DEFAULT 143.50,
    ADD COLUMN IF NOT EXISTS monthly_spent DECIMAL(10,2) DEFAULT 540.20,
    ADD COLUMN IF NOT EXISTS tomorrow_prepared BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_weight_report_date TEXT,
    ADD COLUMN IF NOT EXISTS infraction_paid_date TEXT,
    ADD COLUMN IF NOT EXISTS app_start_date TEXT,
    ADD COLUMN IF NOT EXISTS goal_duration_months INT DEFAULT 2;

-- Adicionando log de humor diário e peso diário para a engine do aplicativo
ALTER TABLE daily_checkins
    ADD COLUMN IF NOT EXISTS mood_stress INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mood_anxiety INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mood_hunger INT DEFAULT 0;

-- ------------------------------------------------------------------------------
-- Abordagem 2: Armazenamento Híbrido (JSONB) - IDEAL PARA O LOCAL STORAGE ATUAL
-- Cria uma tabela dedicada para sincronizar o "choqueFitState_v1" completo facilmente.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_app_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Ativar segurança (RLS) para proteger os dados de estado
ALTER TABLE user_app_state ENABLE ROW LEVEL SECURITY;

-- Política para permitir que o usuário salve e leia apenas seu próprio estado
CREATE POLICY "Usuários gerenciam seu próprio estado do app" ON user_app_state
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Função para atualizar automaticamente a data de última sincronização
CREATE OR REPLACE FUNCTION update_last_synced_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_synced_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para invocar a função no UPDATE
DROP TRIGGER IF EXISTS trg_update_last_synced_at ON user_app_state;
CREATE TRIGGER trg_update_last_synced_at
    BEFORE UPDATE ON user_app_state
    FOR EACH ROW
    EXECUTE FUNCTION update_last_synced_at();
