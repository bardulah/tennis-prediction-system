package main

import (
    "context"
    "encoding/json"
    "errors"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"
    "strings"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/cors"
    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/jackc/pgx/v5/pgconn"
)

type server struct {
    db *pgxpool.Pool
}

type prediction struct {
    PredictionID              int        `json:"prediction_id"`
    MatchID                   string     `json:"match_id"`
    PredictionDate            *time.Time `json:"prediction_date,omitempty"`
    PredictionDay             *time.Time `json:"prediction_day,omitempty"`
    Tournament                string     `json:"tournament"`
    Surface                   string     `json:"surface"`
    Player1                   string     `json:"player1"`
    Player2                   string     `json:"player2"`
    OddsPlayer1               float64    `json:"odds_player1"`
    OddsPlayer2               float64    `json:"odds_player2"`
    PredictedWinner           string     `json:"predicted_winner"`
    ConfidenceScore           int        `json:"confidence_score"`
    Reasoning                 *string    `json:"reasoning,omitempty"`
    RiskAssessment            *string    `json:"risk_assessment,omitempty"`
    ValueBet                  *bool      `json:"value_bet,omitempty"`
    RecommendedAction         *string    `json:"recommended_action,omitempty"`
    DataQualityScore          *int       `json:"data_quality_score,omitempty"`
    LearningPhase             *string    `json:"learning_phase,omitempty"`
    DaysOperated              *int       `json:"days_operated,omitempty"`
    SystemAccuracyAtPrediction *float64   `json:"system_accuracy_at_prediction,omitempty"`
    DataLimitations           *string    `json:"data_limitations,omitempty"`
    Player1DataAvailable      *bool      `json:"player1_data_available,omitempty"`
    Player2DataAvailable      *bool      `json:"player2_data_available,omitempty"`
    H2HDataAvailable          *bool      `json:"h2h_data_available,omitempty"`
    SurfaceDataAvailable      *bool      `json:"surface_data_available,omitempty"`
    SimilarMatchesCount       *int       `json:"similar_matches_count,omitempty"`
    ActualWinner              *string    `json:"actual_winner,omitempty"`
    PredictionCorrect         *bool      `json:"prediction_correct,omitempty"`
    ConfidenceBucket          *string    `json:"confidence_bucket,omitempty"`
    CreatedAt                 *time.Time `json:"created_at,omitempty"`
    LiveScore                 *string    `json:"live_score,omitempty"`
    LiveStatus                *string    `json:"live_status,omitempty"`
    LastUpdated               *time.Time `json:"last_updated,omitempty"`
}

type predictionsResponse struct {
    Data []prediction      `json:"data"`
    Meta responseMeta      `json:"meta"`
}

type responseMeta struct {
    Total       int `json:"total"`
    Page        int `json:"page"`
    PageSize    int `json:"page_size"`
    TotalPages  int `json:"total_pages"`
}

func main() {
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        log.Fatal("DATABASE_URL env var is required")
    }

    ctx := context.Background()
    pool, err := pgxpool.New(ctx, dbURL)
    if err != nil {
        log.Fatalf("failed to create pgx pool: %v", err)
    }
    defer pool.Close()

    port := os.Getenv("PORT")
    if port == "" {
        port = "3001"
    }

    r := chi.NewRouter()
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins:   []string{"*"},
        AllowedMethods:   []string{"GET", "OPTIONS"},
        AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
        AllowCredentials: false,
        MaxAge:           300,
    }))

    srv := &server{db: pool}
    r.Get("/api/predictions", srv.handleListPredictions)
    r.Get("/api/filters", srv.handleGetFilters)
    r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        _, _ = w.Write([]byte("ok"))
    })

    log.Printf("listening on :%s", port)
    if err := http.ListenAndServe(":"+port, r); err != nil {
        log.Fatalf("server error: %v", err)
    }
}

func (s *server) handleListPredictions(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    page := parseIntQuery(r, "page", 1)
    if page < 1 {
        page = 1
    }
    pageSize := parseIntQuery(r, "pageSize", 25)
    if pageSize < 1 {
        pageSize = 25
    }
    if pageSize > 1000 {
        pageSize = 1000
    }

    filters := collectFilters(r)
    query, args := buildPredictionQuery(filters, page, pageSize)
    countQuery, countArgs := buildPredictionCountQuery(filters)

    total, err := s.fetchTotal(ctx, countQuery, countArgs)
    if err != nil {
        httpError(w, err, http.StatusInternalServerError)
        return
    }

    rows, err := s.db.Query(ctx, query, args...)
    if err != nil {
        httpError(w, err, http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var results []prediction
    for rows.Next() {
        var p prediction
        err := rows.Scan(
            &p.PredictionID,
            &p.MatchID,
            &p.PredictionDate,
            &p.PredictionDay,
            &p.Tournament,
            &p.Surface,
            &p.Player1,
            &p.Player2,
            &p.OddsPlayer1,
            &p.OddsPlayer2,
            &p.PredictedWinner,
            &p.ConfidenceScore,
            &p.Reasoning,
            &p.RiskAssessment,
            &p.ValueBet,
            &p.RecommendedAction,
            &p.DataQualityScore,
            &p.LearningPhase,
            &p.DaysOperated,
            &p.SystemAccuracyAtPrediction,
            &p.DataLimitations,
            &p.Player1DataAvailable,
            &p.Player2DataAvailable,
            &p.H2HDataAvailable,
            &p.SurfaceDataAvailable,
            &p.SimilarMatchesCount,
            &p.ActualWinner,
            &p.PredictionCorrect,
            &p.ConfidenceBucket,
            &p.CreatedAt,
            &p.LiveScore,
            &p.LiveStatus,
            &p.LastUpdated,
            &p.ActualWinner,
        )
        if err != nil {
            httpError(w, err, http.StatusInternalServerError)
            return
        }
        results = append(results, p)
    }
    if rows.Err() != nil {
        httpError(w, rows.Err(), http.StatusInternalServerError)
        return
    }

    totalPages := intDivCeil(total, pageSize)

    respondJSON(w, predictionsResponse{
        Data: results,
        Meta: responseMeta{
            Total:      total,
            Page:       page,
            PageSize:   pageSize,
            TotalPages: totalPages,
        },
    })
}

func (s *server) fetchTotal(ctx context.Context, query string, args []any) (int, error) {
    row := s.db.QueryRow(ctx, query, args...)
    var total int
    if err := row.Scan(&total); err != nil {
        return 0, err
    }
    return total, nil
}

type filtersResponse struct {
    Tournaments    []string `json:"tournaments"`
    Surfaces       []string `json:"surfaces"`
    LearningPhases []string `json:"learning_phases"`
}

func (s *server) handleGetFilters(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // Get unique tournaments
    tournamentsQuery := `SELECT DISTINCT tournament FROM predictions WHERE tournament IS NOT NULL AND tournament != '' ORDER BY tournament`
    tournamentRows, err := s.db.Query(ctx, tournamentsQuery)
    if err != nil {
        httpError(w, err, http.StatusInternalServerError)
        return
    }
    defer tournamentRows.Close()

    var tournaments []string
    for tournamentRows.Next() {
        var tournament string
        if err := tournamentRows.Scan(&tournament); err != nil {
            httpError(w, err, http.StatusInternalServerError)
            return
        }
        tournaments = append(tournaments, tournament)
    }

    // Get unique surfaces
    surfacesQuery := `SELECT DISTINCT surface FROM predictions WHERE surface IS NOT NULL AND surface != '' ORDER BY surface`
    surfaceRows, err := s.db.Query(ctx, surfacesQuery)
    if err != nil {
        httpError(w, err, http.StatusInternalServerError)
        return
    }
    defer surfaceRows.Close()

    var surfaces []string
    for surfaceRows.Next() {
        var surface string
        if err := surfaceRows.Scan(&surface); err != nil {
            httpError(w, err, http.StatusInternalServerError)
            return
        }
        surfaces = append(surfaces, surface)
    }

    // Get unique learning phases
    phasesQuery := `SELECT DISTINCT learning_phase FROM predictions WHERE learning_phase IS NOT NULL AND learning_phase != '' ORDER BY learning_phase`
    phaseRows, err := s.db.Query(ctx, phasesQuery)
    if err != nil {
        httpError(w, err, http.StatusInternalServerError)
        return
    }
    defer phaseRows.Close()

    var phases []string
    for phaseRows.Next() {
        var phase string
        if err := phaseRows.Scan(&phase); err != nil {
            httpError(w, err, http.StatusInternalServerError)
            return
        }
        phases = append(phases, phase)
    }

    respondJSON(w, filtersResponse{
        Tournaments:    tournaments,
        Surfaces:       surfaces,
        LearningPhases: phases,
    })
}

type filterSet struct {
    Search           string
    Tournament       string
    Surface          string
    LearningPhase    string
    RecommendedAction string
    PredictionCorrect *bool
    ValueBet         *bool
    MinConfidence    *int
    MaxConfidence    *int
    DateFrom         *time.Time
    DateTo           *time.Time
    SortBy           string
    SortDir          string
}

func collectFilters(r *http.Request) filterSet {
    search := strings.TrimSpace(r.URL.Query().Get("search"))
    tournament := strings.TrimSpace(r.URL.Query().Get("tournament"))
    surface := strings.TrimSpace(r.URL.Query().Get("surface"))
    learningPhase := strings.TrimSpace(r.URL.Query().Get("learningPhase"))
    recommendedAction := strings.TrimSpace(r.URL.Query().Get("recommendedAction"))

    var predictionCorrect *bool
    if v := strings.TrimSpace(r.URL.Query().Get("predictionCorrect")); v != "" {
        if b, err := strconv.ParseBool(v); err == nil {
            predictionCorrect = &b
        }
    }

    var valueBet *bool
    if v := strings.TrimSpace(r.URL.Query().Get("valueBet")); v != "" {
        if b, err := strconv.ParseBool(v); err == nil {
            valueBet = &b
        }
    }

    var minConfidence *int
    if v := strings.TrimSpace(r.URL.Query().Get("minConfidence")); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            minConfidence = &n
        }
    }

    var maxConfidence *int
    if v := strings.TrimSpace(r.URL.Query().Get("maxConfidence")); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            maxConfidence = &n
        }
    }

    var dateFrom *time.Time
    if v := strings.TrimSpace(r.URL.Query().Get("dateFrom")); v != "" {
        if t, err := time.Parse("2006-01-02", v); err == nil {
            dateFrom = &t
        }
    }

    var dateTo *time.Time
    if v := strings.TrimSpace(r.URL.Query().Get("dateTo")); v != "" {
        if t, err := time.Parse("2006-01-02", v); err == nil {
            dateTo = &t
        }
    }

    sortBy := sanitizeSortBy(r.URL.Query().Get("sortBy"))
    sortDir := sanitizeSortDir(r.URL.Query().Get("sortDir"))

    return filterSet{
        Search:            search,
        Tournament:        tournament,
        Surface:           surface,
        LearningPhase:     learningPhase,
        RecommendedAction: recommendedAction,
        PredictionCorrect: predictionCorrect,
        ValueBet:          valueBet,
        MinConfidence:     minConfidence,
        MaxConfidence:     maxConfidence,
        DateFrom:          dateFrom,
        DateTo:            dateTo,
        SortBy:            sortBy,
        SortDir:           sortDir,
    }
}

func buildPredictionQuery(filters filterSet, page, pageSize int) (string, []any) {
    base := strings.Builder{}
    base.WriteString(`SELECT
        p.prediction_id,
        p.match_id,
        p.prediction_date,
        p.prediction_day,
        p.tournament,
        p.surface,
        p.player1,
        p.player2,
        p.odds_player1,
        p.odds_player2,
        p.predicted_winner,
        p.confidence_score,
        p.reasoning,
        p.risk_assessment,
        p.value_bet,
        p.recommended_action,
        p.data_quality_score,
        p.learning_phase,
        p.days_operated,
        p.system_accuracy_at_prediction,
        p.data_limitations,
        p.player1_data_available,
        p.player2_data_available,
        p.h2h_data_available,
        p.surface_data_available,
        p.similar_matches_count,
        p.actual_winner,
        p.prediction_correct,
        p.confidence_bucket,
        p.created_at,
        l.live_score,
        l.live_status,
        l.last_updated,
        l.actual_winner
        FROM predictions p
        LEFT JOIN live_matches l ON l.match_identifier = p.match_id`)

    clauses, args := buildWhereClauses(filters)
    if len(clauses) > 0 {
        base.WriteString(" WHERE ")
        base.WriteString(strings.Join(clauses, " AND "))
    }

    orderBy := filters.SortBy
    if orderBy == "" {
        orderBy = "prediction_day"
    }
    
    // Handle special sorting for predicted odds (calculated field)
    if orderBy == "predicted_odds" {
        orderBy = "CASE WHEN predicted_winner = player1 THEN odds_player1 ELSE odds_player2 END"
    }
    
    dir := filters.SortDir
    if dir == "" {
        dir = "DESC"
    }
    base.WriteString(" ORDER BY ")
    base.WriteString(orderBy)
    base.WriteRune(' ')
    base.WriteString(dir)

    placeholder := len(args) + 1
    base.WriteString(fmt.Sprintf(" LIMIT $%d OFFSET $%d", placeholder, placeholder+1))

    limit := pageSize
    offset := (page - 1) * pageSize
    args = append(args, limit, offset)

    return base.String(), args
}

func buildPredictionCountQuery(filters filterSet) (string, []any) {
    base := strings.Builder{}
    base.WriteString("SELECT COUNT(*) FROM predictions p LEFT JOIN live_matches l ON l.match_identifier = p.match_id")
    clauses, args := buildWhereClauses(filters)
    if len(clauses) > 0 {
        base.WriteString(" WHERE ")
        base.WriteString(strings.Join(clauses, " AND "))
    }
    return base.String(), args
}

func buildWhereClauses(filters filterSet) ([]string, []any) {
    clauses := []string{}
    args := []any{}

    addClause := func(clause string, value any) {
        clauses = append(clauses, clause)
        args = append(args, value)
    }

    if filters.Search != "" {
        like := fmt.Sprintf("%%%s%%", strings.ToLower(filters.Search))
        addClause(fmt.Sprintf("(LOWER(p.tournament) LIKE $%d OR LOWER(p.player1) LIKE $%d OR LOWER(p.player2) LIKE $%d)", len(args)+1, len(args)+1, len(args)+1), like)
    }

    if filters.Tournament != "" {
        addClause(fmt.Sprintf("p.tournament = $%d", len(args)+1), filters.Tournament)
    }

    if filters.Surface != "" {
        addClause(fmt.Sprintf("p.surface = $%d", len(args)+1), filters.Surface)
    }

    if filters.LearningPhase != "" {
        addClause(fmt.Sprintf("p.learning_phase = $%d", len(args)+1), filters.LearningPhase)
    }

    if filters.RecommendedAction != "" {
        addClause(fmt.Sprintf("p.recommended_action = $%d", len(args)+1), filters.RecommendedAction)
    }

    if filters.PredictionCorrect != nil {
        addClause(fmt.Sprintf("p.prediction_correct = $%d", len(args)+1), *filters.PredictionCorrect)
    }

    if filters.ValueBet != nil {
        addClause(fmt.Sprintf("p.value_bet = $%d", len(args)+1), *filters.ValueBet)
    }

    if filters.MinConfidence != nil {
        addClause(fmt.Sprintf("p.confidence_score >= $%d", len(args)+1), *filters.MinConfidence)
    }

    if filters.MaxConfidence != nil {
        addClause(fmt.Sprintf("p.confidence_score <= $%d", len(args)+1), *filters.MaxConfidence)
    }

    if filters.DateFrom != nil {
        addClause(fmt.Sprintf("p.prediction_day >= $%d", len(args)+1), *filters.DateFrom)
    }

    if filters.DateTo != nil {
        addClause(fmt.Sprintf("p.prediction_day <= $%d", len(args)+1), *filters.DateTo)
    }

    return clauses, args
}

func sanitizeSortBy(raw string) string {
    allowed := map[string]struct{}{
        "prediction_day": {},
        "created_at":    {},
        "confidence_score": {},
        "system_accuracy_at_prediction": {},
        "predicted_odds": {},
    }
    if _, ok := allowed[raw]; ok {
        return raw
    }
    return ""
}

func sanitizeSortDir(raw string) string {
    upper := strings.ToUpper(raw)
    if upper == "ASC" || upper == "DESC" {
        return upper
    }
    return ""
}

func parseIntQuery(r *http.Request, key string, fallback int) int {
    v := strings.TrimSpace(r.URL.Query().Get(key))
    if v == "" {
        return fallback
    }
    n, err := strconv.Atoi(v)
    if err != nil {
        return fallback
    }
    return n
}

func httpError(w http.ResponseWriter, err error, status int) {
    var pgErr *pgconn.PgError
    if errors.As(err, &pgErr) {
        log.Printf("pg error: %v", pgErr)
    } else {
        log.Printf("error: %v", err)
    }
    respondJSONWithStatus(w, status, map[string]string{"error": "internal server error"})
}

func respondJSON(w http.ResponseWriter, payload any) {
    respondJSONWithStatus(w, http.StatusOK, payload)
}

func respondJSONWithStatus(w http.ResponseWriter, status int, payload any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    if err := json.NewEncoder(w).Encode(payload); err != nil {
        log.Printf("failed to write response: %v", err)
    }
}

func intDivCeil(numerator, denominator int) int {
    if denominator == 0 {
        return 0
    }
    return (numerator + denominator - 1) / denominator
}
