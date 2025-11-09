#!/bin/bash

# Database Cleanup Verification Script
# Run this to get exact counts and user approval before cleanup

echo "🔍 TENNIS DATABASE CLEANUP VERIFICATION"
echo "========================================"
echo ""

echo "📊 CURRENT DATABASE STATE:"
echo ""

echo "Tables with data (TENNIS SYSTEM - KEEP THESE):"
echo "----------------------------------------------"
psql "$DATABASE_URL" -c "
SELECT 
  schemaname, 
  relname as tablename, 
  n_tup_ins as row_count 
FROM pg_stat_user_tables 
WHERE schemaname = 'public' AND n_tup_ins > 0 
ORDER BY n_tup_ins DESC;
"

echo ""
echo "Empty tables to be removed (METABASE LEFTOVERS):"
echo "------------------------------------------------"
psql "$DATABASE_URL" -c "
SELECT 
  schemaname, 
  relname as tablename, 
  n_tup_ins as row_count 
FROM pg_stat_user_tables 
WHERE schemaname = 'public' AND n_tup_ins = 0 
ORDER BY tablename;
"

echo ""
echo "🚨 SPECIAL CASE:"
echo "head_to_head_cache (0 rows) - KEEP (tennis-related head-to-head stats)"

echo ""
echo "SUMMARY:"
echo "--------"
TOTAL_TABLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
TABLES_WITH_DATA=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname = 'public' AND n_tup_ins > 0;")
EMPTY_TABLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname = 'public' AND n_tup_ins = 0;")

echo "Total tables: $TOTAL_TABLES"
echo "Tables with data (KEEP): $TABLES_WITH_DATA"  
echo "Empty tables (REMOVE): $EMPTY_TABLES"

echo ""
echo "⚠️  IMPORTANT: This will drop $EMPTY_TABLES empty Metabase tables"
echo "🎾 Tennis system tables will be preserved"
echo ""
echo "Continue? (yes/no)"
