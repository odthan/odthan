#!/bin/bash
# Recrée la base de test et applique toutes les migrations (PGHOST/PGPORT/PGUSER requis)
set -e
psql -q -c "drop database if exists t" -c "create database t" 2>/dev/null
psql -q -d t -v ON_ERROR_STOP=1 -f tests/mock_supabase.sql 2>/dev/null
for f in supabase/migrations/*.sql; do psql -q -d t -v ON_ERROR_STOP=1 -f "$f"; done
