-- Tennis Prediction System Database Schema
-- PostgreSQL 17+ compatible

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- System metadata table (single row with system-wide information)
CREATE TABLE system_metadata (
    id INTEGER PRIMARY KEY DEFAULT 1,
    days_operated INTEGER NOT NULL DEFAULT 0,
    learning_phase VARCHAR(50) NOT NULL DEFAULT 'phase1_data_collection',
    overall_accuracy NUMERIC(5,2) DEFAULT 0.00,
    total_predictions_made INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    incorrect_predictions INTEGER DEFAULT 0,
    avg_confidence_when_correct NUMERIC(5,2),
    avg_confidence_when_incorrect NUMERIC(5,2),
    accuracy_high_confidence NUMERIC(5,2),
    accuracy_medium_confidence NUMERIC(5,2),
    accuracy_low_confidence NUMERIC(5,2),
    total_matches_processed INTEGER DEFAULT 0,
    pinecone_record_count INTEGER DEFAULT 0,
    data_quality_score INTEGER DEFAULT 50,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_result_date DATE,
    max_confidence_allowed INTEGER DEFAULT 60
);

-- Insert initial system metadata
INSERT INTO system_metadata (id, days_operated, learning_phase) VALUES (1, 0, 'phase1_data_collection');

-- Players table with comprehensive statistics
CREATE TABLE players (
    player_id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL UNIQUE,
    nationality VARCHAR(100),
    total_matches INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    win_rate_overall NUMERIC(5,2) DEFAULT 0.00,
    win_rate_clay NUMERIC(5,2) DEFAULT 0.00,
    win_rate_hard NUMERIC(5,2) DEFAULT 0.00,
    win_rate_grass NUMERIC(5,2) DEFAULT 0.00,
    matches_clay INTEGER DEFAULT 0,
    matches_hard INTEGER DEFAULT 0,
    matches_grass INTEGER DEFAULT 0,
    avg_odds_when_winning NUMERIC(8,2),
    avg_odds_when_losing NUMERIC(8,2),
    avg_odds_overall NUMERIC(8,2),
    upset_wins_count INTEGER DEFAULT 0,
    upset_losses_count INTEGER DEFAULT 0,
    favorite_wins_count INTEGER DEFAULT 0,
    favorite_losses_count INTEGER DEFAULT 0,
    giant_killer_score NUMERIC(5,2) DEFAULT 0.00,
    recent_form_last_5 VARCHAR(20),
    recent_form_last_10 VARCHAR(20),
    wins_last_5 INTEGER DEFAULT 0,
    wins_last_10 INTEGER DEFAULT 0,
    momentum_score NUMERIC(5,2) DEFAULT 0.00,
    vs_favorites_win_rate NUMERIC(5,2),
    vs_underdogs_win_rate NUMERIC(5,2),
    consistency_score NUMERIC(5,2),
    first_seen_date DATE DEFAULT CURRENT_DATE,
    last_match_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_tournaments INTEGER DEFAULT 0
);

-- Matches table with comprehensive match information
CREATE TABLE matches (
    match_id SERIAL PRIMARY KEY,
    match_unique_id VARCHAR(255) NOT NULL UNIQUE,
    match_date DATE NOT NULL,
    tournament VARCHAR(500) NOT NULL,
    country VARCHAR(100),
    surface VARCHAR(50) NOT NULL,
    player1 VARCHAR(255) NOT NULL,
    player1_nationality VARCHAR(100),
    player2 VARCHAR(255) NOT NULL,
    player2_nationality VARCHAR(100),
    odds_player1 NUMERIC(8,2) NOT NULL,
    odds_player2 NUMERIC(8,2) NOT NULL,
    implied_prob_player1 NUMERIC(5,2),
    implied_prob_player2 NUMERIC(5,2),
    score VARCHAR(100),
    winner VARCHAR(255) NOT NULL,
    loser VARCHAR(255) NOT NULL,
    odds_winner NUMERIC(8,2),
    odds_loser NUMERIC(8,2),
    is_upset BOOLEAN DEFAULT FALSE,
    favorite VARCHAR(255),
    favorite_won BOOLEAN,
    prediction_id INTEGER REFERENCES predictions(prediction_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_winner CHECK (winner = player1 OR winner = player2),
    CONSTRAINT valid_loser CHECK (loser = player1 OR loser = player2),
    CONSTRAINT different_players CHECK (player1 != player2)
);

-- Predictions table with AI-generated predictions
CREATE TABLE predictions (
    prediction_id SERIAL PRIMARY KEY,
    match_id VARCHAR(255) NOT NULL UNIQUE,
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prediction_day DATE DEFAULT CURRENT_DATE,
    tournament VARCHAR(500) NOT NULL,
    surface VARCHAR(50) NOT NULL,
    player1 VARCHAR(255) NOT NULL,
    player2 VARCHAR(255) NOT NULL,
    odds_player1 NUMERIC(8,2) NOT NULL,
    odds_player2 NUMERIC(8,2) NOT NULL,
    predicted_winner VARCHAR(255) NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    reasoning TEXT,
    risk_assessment VARCHAR(20),
    value_bet BOOLEAN DEFAULT FALSE,
    recommended_action VARCHAR(20),
    data_quality_score INTEGER,
    learning_phase VARCHAR(50),
    days_operated INTEGER,
    system_accuracy_at_prediction NUMERIC(5,2),
    data_limitations TEXT,
    player1_data_available BOOLEAN DEFAULT FALSE,
    player2_data_available BOOLEAN DEFAULT FALSE,
    h2h_data_available BOOLEAN DEFAULT FALSE,
    surface_data_available BOOLEAN DEFAULT FALSE,
    similar_matches_count INTEGER DEFAULT 0,
    actual_winner VARCHAR(255),
    prediction_correct BOOLEAN,
    confidence_bucket VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player insights discovered from learning analysis
CREATE TABLE player_insights (
    insight_id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    insight_description TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    supporting_data JSONB,
    discovered_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(player_name, insight_type, discovered_date)
);

-- Learning log for tracking system improvements
CREATE TABLE learning_log (
    log_id SERIAL PRIMARY KEY,
    log_date DATE NOT NULL,
    log_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    learning_data JSONB,
    impact_score INTEGER DEFAULT 5,
    related_prediction_id INTEGER REFERENCES predictions(prediction_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player statistics view for easier queries
CREATE VIEW player_stats AS
SELECT 
    p.*,
    CASE 
        WHEN p.total_matches > 0 THEN 
            ROUND((p.total_wins::NUMERIC / p.total_matches) * 100, 2)
        ELSE 0.00 
    END as computed_win_rate,
    CASE 
        WHEN p.matches_clay > 0 THEN 
            ROUND((p.wins_clay::NUMERIC / p.matches_clay) * 100, 2)
        ELSE 0.00 
    END as computed_clay_win_rate,
    CASE 
        WHEN p.matches_hard > 0 THEN 
            ROUND((p.wins_hard::NUMERIC / p.matches_hard) * 100, 2)
        ELSE 0.00 
    END as computed_hard_win_rate,
    CASE 
        WHEN p.matches_grass > 0 THEN 
            ROUND((p.wins_grass::NUMERIC / p.matches_grass) * 100, 2)
        ELSE 0.00 
    END as computed_grass_win_rate
FROM players p;

-- Performance tracking view
CREATE VIEW prediction_performance AS
SELECT 
    DATE(prediction_day) as prediction_date,
    COUNT(*) as total_predictions,
    SUM(CASE WHEN prediction_correct = TRUE THEN 1 ELSE 0 END) as correct_predictions,
    SUM(CASE WHEN prediction_correct = FALSE THEN 1 ELSE 0 END) as incorrect_predictions,
    ROUND(AVG(confidence_score), 2) as avg_confidence,
    AVG(CASE WHEN prediction_correct = TRUE THEN confidence_score END) as avg_confidence_correct,
    AVG(CASE WHEN prediction_correct = FALSE THEN confidence_score END) as avg_confidence_incorrect,
    COUNT(CASE WHEN confidence_score >= 60 THEN 1 END) as high_confidence_count,
    COUNT(CASE WHEN confidence_score >= 50 AND confidence_score < 60 THEN 1 END) as medium_confidence_count,
    COUNT(CASE WHEN confidence_score < 50 THEN 1 END) as low_confidence_count
FROM predictions 
WHERE prediction_day IS NOT NULL
GROUP BY DATE(prediction_day)
ORDER BY prediction_date DESC;

-- Indexes for performance
CREATE INDEX idx_players_name ON players(player_name);
CREATE INDEX idx_players_nationality ON players(nationality);
CREATE INDEX idx_players_last_match ON players(last_match_date);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_players ON matches(player1, player2);
CREATE INDEX idx_matches_winner ON matches(winner);
CREATE INDEX idx_matches_surface ON matches(surface);
CREATE INDEX idx_predictions_day ON predictions(prediction_day);
CREATE INDEX idx_predictions_correct ON predictions(prediction_correct);
CREATE INDEX idx_predictions_confidence ON predictions(confidence_score);
CREATE INDEX idx_predictions_winner ON predictions(predicted_winner);
CREATE INDEX idx_player_insights_player ON player_insights(player_name);
CREATE INDEX idx_player_insights_type ON player_insights(insight_type);
CREATE INDEX idx_learning_log_date ON learning_log(log_date);
CREATE INDEX idx_learning_log_type ON learning_log(log_type);

-- Function to update player statistics after match completion
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total match counts for both players
    UPDATE players 
    SET 
        total_matches = total_matches + 1,
        last_match_date = NEW.match_date,
        last_updated = NOW()
    WHERE player_name IN (NEW.player1, NEW.player2);
    
    -- Update win/loss records
    IF NEW.winner = NEW.player1 THEN
        UPDATE players SET 
            total_wins = total_wins + 1,
            wins_last_5 = (wins_last_5 + 1) % 5,
            wins_last_10 = (wins_last_10 + 1) % 10,
            last_match_date = NEW.match_date
        WHERE player_name = NEW.player1;
        
        UPDATE players SET 
            total_losses = total_losses + 1
        WHERE player_name = NEW.player2;
    ELSE
        UPDATE players SET 
            total_wins = total_wins + 1,
            wins_last_5 = (wins_last_5 + 1) % 5,
            wins_last_10 = (wins_last_10 + 1) % 10,
            last_match_date = NEW.match_date
        WHERE player_name = NEW.player2;
        
        UPDATE players SET 
            total_losses = total_losses + 1
        WHERE player_name = NEW.player1;
    END IF;
    
    -- Update surface-specific statistics
    UPDATE players 
    SET 
        matches_clay = CASE WHEN NEW.surface = 'Clay' THEN matches_clay + 1 ELSE matches_clay END,
        matches_hard = CASE WHEN NEW.surface = 'Hard' THEN matches_hard + 1 ELSE matches_hard END,
        matches_grass = CASE WHEN NEW.surface = 'Grass' THEN matches_grass + 1 ELSE matches_grass END
    WHERE player_name IN (NEW.player1, NEW.player2);
    
    -- Update odds averages
    UPDATE players 
    SET 
        avg_odds_when_winning = CASE 
            WHEN winner = player_name THEN NEW.odds_winner 
            ELSE avg_odds_when_winning 
        END,
        avg_odds_when_losing = CASE 
            WHEN winner != player_name THEN NEW.odds_loser 
            ELSE avg_odds_when_losing 
        END
    WHERE player_name IN (NEW.player1, NEW.player2);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update player stats
CREATE TRIGGER trigger_update_player_stats
    AFTER INSERT ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats();

-- Function to calculate prediction confidence buckets
CREATE OR REPLACE FUNCTION calculate_confidence_bucket(confidence INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF confidence >= 60 THEN
        RETURN 'high';
    ELSIF confidence >= 50 THEN
        RETURN 'medium';
    ELSE
        RETURN 'low';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update prediction accuracy
CREATE OR REPLACE FUNCTION update_prediction_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    -- Update prediction_correct based on actual winner
    IF NEW.actual_winner IS NOT NULL THEN
        UPDATE predictions 
        SET 
            prediction_correct = (predicted_winner = NEW.actual_winner),
            confidence_bucket = calculate_confidence_bucket(confidence_score)
        WHERE match_id = NEW.match_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update prediction accuracy
CREATE TRIGGER trigger_update_prediction_accuracy
    AFTER UPDATE ON predictions
    FOR EACH ROW
    WHEN (OLD.actual_winner IS DISTINCT FROM NEW.actual_winner)
    EXECUTE FUNCTION update_prediction_accuracy();

-- Comments for documentation
COMMENT ON TABLE system_metadata IS 'System-wide metadata including accuracy tracking and learning phase';
COMMENT ON TABLE players IS 'Player profiles with comprehensive statistics and performance metrics';
COMMENT ON TABLE matches IS 'Historical match data with odds and results information';
COMMENT ON TABLE predictions IS 'AI-generated predictions with confidence scoring and reasoning';
COMMENT ON TABLE player_insights IS 'Player-specific insights discovered through learning analysis';
COMMENT ON TABLE learning_log IS 'System learning and pattern discovery tracking';

COMMENT ON COLUMN players.giant_killer_score IS 'Score indicating player ability to beat higher-ranked opponents';
COMMENT ON COLUMN players.momentum_score IS 'Recent form indicator based on recent match performance';
COMMENT ON COLUMN predictions.confidence_score IS 'AI confidence level from 0-100, adjusted by learning phase';
COMMENT ON COLUMN predictions.data_quality_score IS 'Quality indicator of data available for prediction (0-100)';
