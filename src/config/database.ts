import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const dbPath =
  process.env.SQLITE_PATH ??
  (isVercel ? '/tmp/app.sqlite' : path.join(process.cwd(), 'data', 'app.sqlite'));

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Geral',
    prioridade TEXT NOT NULL DEFAULT 'Média',
    concluida INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
  CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON tarefas(usuario_id);
`);

export interface UsuarioRow {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  created_at: string;
}

export interface TarefaRow {
  id: number;
  usuario_id: number;
  titulo: string;
  categoria: string;
  prioridade: 'Baixa' | 'Média' | 'Alta';
  concluida: number;
  created_at: string;
}
