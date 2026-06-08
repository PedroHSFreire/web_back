import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { JWT_SECRET } from '../config/jwt';
import { RegisterRequest, LoginRequest, UsuarioResponse, Usuario } from '../types';

export const registrar = async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
  const nome = req.body.nome?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const senha = req.body.senha;

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
    const usuarioExistente = db
      .prepare('SELECT id FROM usuarios WHERE email = ?')
      .get(email) as { id: number } | undefined;

    if (usuarioExistente) {
      res.status(400).json({ success: false, erro: 'E-mail ja cadastrado' });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const insert = db.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash)
      VALUES (?, ?, ?)
    `);

    const result = insert.run(nome, email, senhaHash);
    const usuario = db
      .prepare('SELECT id, nome, email FROM usuarios WHERE id = ?')
      .get(result.lastInsertRowid) as Pick<Usuario, 'id' | 'nome' | 'email'> | undefined;

    if (!usuario) {
      res.status(500).json({ success: false, erro: 'Erro ao registrar usuario' });
      return;
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
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
  } catch (error: any) {
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ success: false, erro: 'E-mail ja cadastrado' });
      return;
    }

    console.error('Erro ao registrar:', error);
    res.status(500).json({ success: false, erro: 'Erro ao registrar usuario' });
  }
};

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  const email = req.body.email?.trim().toLowerCase();
  const senha = req.body.senha;

  if (!email || !senha) {
    res.status(400).json({ success: false, erro: 'Preencha e-mail e senha' });
    return;
  }

  try {
    const usuario = db
      .prepare('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?')
      .get(email) as Usuario | undefined;

    if (!usuario) {
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
      JWT_SECRET,
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
    const data = db
      .prepare('SELECT id, nome, email FROM usuarios WHERE id = ?')
      .get(usuarioId) as UsuarioResponse | undefined;

    if (!data) {
      res.status(404).json({ success: false, erro: 'Usuario nao encontrado' });
      return;
    }

    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Erro ao buscar usuario:', error);
    res.status(500).json({ success: false, erro: 'Erro interno' });
  }
};
