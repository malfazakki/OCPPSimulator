/// <reference types="@types/bun" />
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Ensure data directory exists
const dataDir = join(import.meta.dir, "../data");
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, "simulator.db");
export const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.exec("PRAGMA journal_mode = WAL;");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS charge_points (
    id TEXT PRIMARY KEY,
    label TEXT,
    csms_url TEXT,
    protocol TEXT DEFAULT 'ocpp1.6',
    status TEXT DEFAULT 'disconnected',
    device_settings TEXT,
    ocpp_config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cp_id TEXT NOT NULL,
    connector_id INTEGER NOT NULL DEFAULT 1,
    transaction_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS' | 'COMPLETED'
    id_tag TEXT DEFAULT 'DEMO1234',
    meter_start_wh REAL NOT NULL DEFAULT 0,
    current_energy_wh REAL NOT NULL DEFAULT 0,
    current_soc REAL NOT NULL DEFAULT 30,
    power_kw REAL NOT NULL DEFAULT 0,
    current_a REAL NOT NULL DEFAULT 0,
    voltage_v REAL NOT NULL DEFAULT 230,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_tx_cp_status ON transactions(cp_id, status);
  CREATE INDEX IF NOT EXISTS idx_tx_ocpp_id ON transactions(transaction_id);

  CREATE TABLE IF NOT EXISTS ocpp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cp_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    direction TEXT NOT NULL, -- 'IN' | 'OUT'
    message_type TEXT NOT NULL, -- 'CALL' | 'CALLRESULT' | 'CALLERROR'
    action TEXT,
    payload TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_logs_cp ON ocpp_logs(cp_id, timestamp);
`);

console.log(`[Simulator DB] SQLite initialized successfully at: ${dbPath}`);
