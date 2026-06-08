import { Request, Response } from 'express';
import { db, TarefaRow } from '../config/database';
import { CreateTaskRequest, TarefaFrontend } from '../types';

type TaskRow = Pick<TarefaRow, 'id' | 'titulo' | 'categoria' | 'prioridade' | 'concluida'>;

export const listarTarefas = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = req.usuarioId!;

  try {
    const rows = db.prepare(`
      SELECT id, titulo, categoria, prioridade, concluida
      FROM tarefas
      WHERE usuario_id = ?
      ORDER BY created_at DESC, id DESC
    `).all(usuarioId) as TaskRow[];

    const tarefas: TarefaFrontend[] = rows.map(t => ({
      id: t.id,
      title: t.titulo,
      completed: Boolean(t.concluida),
      category: t.categoria,
      priority: t.prioridade as 'Baixa' | 'Média' | 'Alta'
    }));

    res.json({ success: true, tasks: tarefas });
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar tarefas' });
  }
};

export const criarTarefa = async (req: Request<{}, {}, CreateTaskRequest>, res: Response): Promise<void> => {
  const usuarioId = req.usuarioId!;
  const titulo = req.body.title?.trim();
  const categoria = req.body.category?.trim() || 'Geral';
  const prioridade = req.body.priority || 'Média';

  if (!titulo) {
    res.status(400).json({ success: false, erro: 'Título é obrigatório' });
    return;
  }

  try {
    const insert = db.prepare(`
      INSERT INTO tarefas (usuario_id, titulo, categoria, prioridade, concluida)
      VALUES (?, ?, ?, ?, 0)
    `);

    const result = insert.run(usuarioId, titulo, categoria, prioridade);

    const data = db
      .prepare(`
        SELECT id, titulo, categoria, prioridade, concluida
        FROM tarefas
        WHERE id = ?
      `)
      .get(result.lastInsertRowid) as TaskRow | undefined;

    if (!data) {
      res.status(500).json({ success: false, erro: 'Erro ao criar tarefa' });
      return;
    }

    const novaTarefa: TarefaFrontend = {
      id: data.id,
      title: data.titulo,
      completed: Boolean(data.concluida),
      category: data.categoria,
      priority: data.prioridade as 'Baixa' | 'Média' | 'Alta'
    };

    res.status(201).json({ success: true, task: novaTarefa });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ success: false, erro: 'Erro ao criar tarefa' });
  }
};

export const atualizarTarefa = async (req: Request<{ id: string }, {}, CreateTaskRequest>, res: Response): Promise<void> => {
  const { id } = req.params;
  const usuarioId = req.usuarioId!;
  const titulo = req.body.title?.trim();
  const categoria = req.body.category?.trim() || 'Geral';
  const prioridade = req.body.priority || 'Média';

  if (!titulo) {
    res.status(400).json({ success: false, erro: 'Título é obrigatório' });
    return;
  }

  try {
    const result = db.prepare(`
      UPDATE tarefas
      SET titulo = ?, categoria = ?, prioridade = ?
      WHERE id = ? AND usuario_id = ?
    `).run(titulo, categoria, prioridade, id, usuarioId);

    if (result.changes === 0) {
      res.status(404).json({ success: false, erro: 'Tarefa não encontrada' });
      return;
    }

    const updated = db
      .prepare(`
        SELECT id, titulo, categoria, prioridade, concluida
        FROM tarefas
        WHERE id = ? AND usuario_id = ?
      `)
      .get(id, usuarioId) as TaskRow | undefined;

    if (!updated) {
      res.status(404).json({ success: false, erro: 'Tarefa não encontrada' });
      return;
    }

    const tarefaAtualizada: TarefaFrontend = {
      id: updated.id,
      title: updated.titulo,
      completed: Boolean(updated.concluida),
      category: updated.categoria,
      priority: updated.prioridade as 'Baixa' | 'Média' | 'Alta'
    };

    res.json({ success: true, task: tarefaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ success: false, erro: 'Erro ao atualizar tarefa' });
  }
};

export const alternarTarefa = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const usuarioId = req.usuarioId!;

  try {
    const tarefa = db
      .prepare('SELECT concluida FROM tarefas WHERE id = ? AND usuario_id = ?')
      .get(id, usuarioId) as Pick<TarefaRow, 'concluida'> | undefined;

    if (!tarefa) {
      res.status(404).json({ success: false, erro: 'Tarefa não encontrada' });
      return;
    }

    db.prepare(`
      UPDATE tarefas
      SET concluida = ?
      WHERE id = ? AND usuario_id = ?
    `).run(tarefa.concluida ? 0 : 1, id, usuarioId);

    const updated = db
      .prepare(`
        SELECT id, titulo, categoria, prioridade, concluida
        FROM tarefas
        WHERE id = ? AND usuario_id = ?
      `)
      .get(id, usuarioId) as TaskRow | undefined;

    if (!updated) {
      res.status(404).json({ success: false, erro: 'Tarefa não encontrada' });
      return;
    }

    const tarefaAtualizada: TarefaFrontend = {
      id: updated.id,
      title: updated.titulo,
      completed: Boolean(updated.concluida),
      category: updated.categoria,
      priority: updated.prioridade as 'Baixa' | 'Média' | 'Alta'
    };

    res.json({ success: true, task: tarefaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ success: false, erro: 'Erro ao atualizar tarefa' });
  }
};

export const excluirTarefa = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const usuarioId = req.usuarioId!;

  try {
    const result = db
      .prepare('DELETE FROM tarefas WHERE id = ? AND usuario_id = ?')
      .run(id, usuarioId);

    if (result.changes === 0) {
      res.status(404).json({ success: false, erro: 'Tarefa não encontrada' });
      return;
    }

    res.json({ success: true, mensagem: 'Tarefa excluída' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ success: false, erro: 'Erro ao excluir tarefa' });
  }
};
