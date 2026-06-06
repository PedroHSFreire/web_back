import type { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterRequest, LoginRequest, UsuarioResponse } from '../types';

export const registrar = async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
    const { nome, email, senha } = req.body;

    // Validações
    if (!nome || !email || !senha) {
        res.status(400).json({ erro: 'Preencha todos os campos' });
        return;
    }

    if (senha.length < 6) {
        res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
        return;
    }

    if (nome.length < 3) {
        res.status(400).json({ erro: 'Nome deve ter no mínimo 3 caracteres' });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ erro: 'E-mail inválido' });
        return;
    }

    try {
        // Verificar se email já existe
        const { data: usuarioExistente } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (usuarioExistente) {
            res.status(400).json({ erro: 'E-mail já cadastrado' });
            return;
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Inserir usuário
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nome, email, senha_hash: senhaHash }])
            .select();

        if (error) throw error;

        const usuario = data[0] as any;

        // Gerar token
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
            mensagem: 'Usuário criado com sucesso',
            token,
            usuario: usuarioResponse
        });

    } catch (error) {
        console.error('Erro ao registrar:', error);
        res.status(500).json({ erro: 'Erro ao registrar usuário' });
    }
};

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        res.status(400).json({ erro: 'Preencha e-mail e senha' });
        return;
    }

    try {
        // Buscar usuário
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            res.status(401).json({ erro: 'E-mail ou senha inválidos' });
            return;
        }

        // Validar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            res.status(401).json({ erro: 'E-mail ou senha inválidos' });
            return;
        }

        // Gerar token
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
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: usuarioResponse
        });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};