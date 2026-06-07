import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterRequest, LoginRequest, UsuarioResponse } from '../types';

export const registrar = async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    res.status(400).json({ success: false, erro: 'Preencha todos os campos' });
    return;
  }
  if (senha.length < 6) {
    res.status(400).json({ success: false, erro: 'Senha deve ter no minimo 6 caracteres' });
    return;
  }
  if (nome.length < 3) {
    res.status(400).json({ success: false, erro: 'Nome deve ter no minimo 3 caracteres' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ success: false, erro: 'E-mail invalido' });
    return;
  }

  try {
    const { data: usuarioExistente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (usuarioExistente) {
      res.status(400).json({ success: false, erro: 'E-mail ja cadastrado' });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nome, email, senha_hash: senhaHash }])
      .select();

    if (error) throw error;

    const usuario = data[0];
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const usuarioResponse: UsuarioResponse = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    };

    res.status(201).json({
      success: true,
      mensagem: 'Usuario criado com sucesso',
      token,
      user: usuarioResponse
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({ success: false, erro: 'Erro ao registrar usuario' });
  }
};

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ success: false, erro: 'Preencha e-mail e senha' });
    return;
  }

  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !usuario) {
      res.status(401).json({ success: false, erro: 'E-mail ou senha invalidos' });
      return;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      res.status(401).json({ success: false, erro: 'E-mail ou senha invalidos' });
      return;
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const usuarioResponse: UsuarioResponse = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    };

    res.json({
      success: true,
      mensagem: 'Login realizado com sucesso',
      token,
      user: usuarioResponse
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ success: false, erro: 'Erro ao fazer login' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = req.usuarioId!;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('id', usuarioId)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, erro: 'Usuario nao encontrado' });
      return;
    }

    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Erro ao buscar usuario:', error);
    res.status(500).json({ success: false, erro: 'Erro interno' });
  }
};