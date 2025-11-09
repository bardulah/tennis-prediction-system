-- Database Cleanup Script: Remove Empty Metabase Tables
-- WARNING: Only drop tables confirmed to be Metabase leftovers
-- DO NOT RUN without user approval

-- LIST OF TABLES TO DROP (All confirmed empty and Metabase-related)
-- Total: 64 tables to remove

-- Drop Metabase core tables
DROP TABLE IF EXISTS metabase_database CASCADE;
DROP TABLE IF EXISTS metabase_field CASCADE;
DROP TABLE IF EXISTS metabase_fieldvalues CASCADE;
DROP TABLE IF EXISTS metabase_table CASCADE;

-- Drop user management tables
DROP TABLE IF EXISTS core_user CASCADE;
DROP TABLE IF EXISTS core_session CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS activity CASCADE;

-- Drop permissions tables
DROP TABLE IF EXISTS permissions_group_membership CASCADE;
DROP TABLE IF EXISTS application_permissions_revision CASCADE;
DROP TABLE IF EXISTS permissions_revision CASCADE;

-- Drop collection/bookmark tables
DROP TABLE IF EXISTS collection CASCADE;
DROP TABLE IF EXISTS collection_bookmark CASCADE;
DROP TABLE IF EXISTS collection_permission_graph_revision CASCADE;
DROP TABLE IF EXISTS bookmark_ordering CASCADE;

-- Drop dashboard/UI tables
DROP TABLE IF EXISTS dashboard_bookmark CASCADE;
DROP TABLE IF EXISTS dashboard_favorite CASCADE;
DROP TABLE IF EXISTS dashboard_tab CASCADE;
DROP TABLE IF EXISTS dashboardcard_series CASCADE;

-- Drop report/dashboard tables
DROP TABLE IF EXISTS report_card CASCADE;
DROP TABLE IF EXISTS report_cardfavorite CASCADE;
DROP TABLE IF EXISTS report_dashboard CASCADE;
DROP TABLE IF EXISTS report_dashboardcard CASCADE;

-- Drop pulse/notification tables
DROP TABLE IF EXISTS pulse CASCADE;
DROP TABLE IF EXISTS pulse_card CASCADE;
DROP TABLE IF EXISTS pulse_channel CASCADE;
DROP TABLE IF EXISTS pulse_channel_recipient CASCADE;

-- Drop query system tables
DROP TABLE IF EXISTS query CASCADE;
DROP TABLE IF EXISTS query_action CASCADE;
DROP TABLE IF EXISTS query_cache CASCADE;
DROP TABLE IF EXISTS query_execution CASCADE;
DROP TABLE IF EXISTS native_query_snippet CASCADE;

-- Drop metric/segment/dimension tables
DROP TABLE IF EXISTS metric CASCADE;
DROP TABLE IF EXISTS metric_important_field CASCADE;
DROP TABLE IF EXISTS segment CASCADE;
DROP TABLE IF EXISTS dimension CASCADE;
DROP TABLE IF EXISTS parameter_card CASCADE;

-- Drop model/AI tables
DROP TABLE IF EXISTS model_index CASCADE;
DROP TABLE IF EXISTS model_index_value CASCADE;

-- Drop timeline/event tables
DROP TABLE IF EXISTS timeline CASCADE;
DROP TABLE IF EXISTS timeline_event CASCADE;

-- Drop misc Metabase tables
DROP TABLE IF EXISTS sandboxes CASCADE;
DROP TABLE IF EXISTS secret CASCADE;
DROP TABLE IF EXISTS setting CASCADE;
DROP TABLE IF EXISTS task_history CASCADE;
DROP TABLE IF EXISTS view_log CASCADE;
DROP TABLE IF EXISTS data_migrations CASCADE;
DROP TABLE IF EXISTS persisted_info CASCADE;
DROP TABLE IF EXISTS dependency CASCADE;
DROP TABLE IF EXISTS revision CASCADE;
DROP TABLE IF EXISTS computation_job CASCADE;
DROP TABLE IF EXISTS computation_job_result CASCADE;
DROP TABLE IF EXISTS moderation_review CASCADE;
DROP TABLE IF EXISTS implicit_action CASCADE;
DROP TABLE IF EXISTS http_action CASCADE;

-- Drop action/label tables
DROP TABLE IF EXISTS action CASCADE;
DROP TABLE IF EXISTS label CASCADE;
DROP TABLE IF EXISTS card_bookmark CASCADE;
DROP TABLE IF EXISTS card_label CASCADE;

-- Drop Quartz scheduler tables (empty remnants)
DROP TABLE IF EXISTS qrtz_job_details CASCADE;
DROP TABLE IF EXISTS qrtz_triggers CASCADE;
DROP TABLE IF EXISTS qrtz_simple_triggers CASCADE;
DROP TABLE IF EXISTS qrtz_cron_triggers CASCADE;
DROP TABLE IF EXISTS qrtz_blob_triggers CASCADE;
DROP TABLE IF EXISTS qrtz_calendars CASCADE;
DROP TABLE IF EXISTS qrtz_paused_trigger_grps CASCADE;
DROP TABLE IF EXISTS qrtz_fired_triggers CASCADE;
DROP TABLE IF EXISTS qrtz_simprop_triggers CASCADE;
-- NOTE: Keeping qrtz_locks and qrtz_scheduler_state as they have 1-2 rows

-- VERIFICATION QUERY
-- Run this after cleanup to verify:
-- SELECT COUNT(*) as tables_remaining FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- SELECT COUNT(*) as rows_remaining FROM pg_stat_user_tables WHERE schemaname = 'public' AND n_tup_ins > 0;
