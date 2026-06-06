export interface Usuario {
    id: number;
    nome: string;
    email: string;
    senha_hash: string;
    created_at: Date;
}

export interface Tarefa {
    id: number;
    usuario_id: number;
    titulo: string;
    categoria: string;
    prioridade: 'Baixa' | 'Média' | 'Alta';
    concluida: boolean;
    created_at: Date;
}

export interface TarefaFrontend {
    id: number;
    title: string;
    completed: boolean;
    category: string;
    priority: 'Baixa' | 'Média' | 'Alta';
}

export interface UsuarioResponse {
    id: number;
    nome: string;
    email: string;
}

export interface LoginRequest {
    email: string;
    senha: string;
}

export interface RegisterRequest {
    nome: string;
    email: string;
    senha: string;
}

export interface CreateTaskRequest {
    title: string;
    category?: string;
    priority?: 'Baixa' | 'Média' | 'Alta';
}

export interface AuthPayload {
    id: number;
    email: string;
}