import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CreateTaskRequest, TarefaFrontend } from '../types';

export const listarTarefas = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = req.usuarioId!;

  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tarefas: TarefaFrontend[] = (data || []).map(t => ({
      id: t.id,
      title: t.titulo,
      completed: t.concluida,
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
  const { title, category, priority } = req.body;

  if (!title || title.trim() === '') {
    res.status(400).json({ success: false, erro: 'Título é obrigatório' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('tarefas')
      .insert([{
        usuario_id: usuarioId,
        titulo: title.trim(),
        categoria: category || 'Geral',
        prioridade: priority || 'Média',
        concluida: false
      }])
      .select();

    if (error) throw error;

    const novaTarefa: TarefaFrontend = {
      id: data[0].id,
      title: data[0].titulo,
      completed: data[0].concluida,
      category: data[0].categoria,
      priority: data[0].prioridade as 'Baixa' | 'Média' | 'Alta'
    };

    res.status(201).json({ success: true, task: novaTarefa });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ success: false, erro: 'Erro ao criar tarefa' });
  }
};

export const alternarTarefa = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const usuarioId = req.usuarioId!;

  try {
    const { data: tarefa, error: findError } = await supabase
      .from('tarefas')
      .select('concluida')
      .eq('id', id)
      .eq('usuario_id', usuarioId)
      .single();

    if (findError || !tarefa) {
      res.status(404).json({ success: false, erro: 'Tarefa não encontrada' });
      return;
    }

    const { error: updateError } = await supabase
      .from('tarefas')
      .update({ concluida: !tarefa.concluida })
      .eq('id', id);

    if (updateError) throw updateError;

    // Buscar tarefa atualizada para retornar no formato frontend
    const { data: updated, error: fetchError } = await supabase
      .from('tarefas')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const tarefaAtualizada: TarefaFrontend = {
      id: updated.id,
      title: updated.titulo,
      completed: updated.concluida,
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
    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id)
      .eq('usuario_id', usuarioId);

    if (error) throw error;

    res.json({ success: true, mensagem: 'Tarefa excluída' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ success: false, erro: 'Erro ao excluir tarefa' });
  }
};