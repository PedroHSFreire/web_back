import { Router } from 'express';
import { listarTarefas, criarTarefa, alternarTarefa, excluirTarefa } from '../controllers/taskController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas de tarefas exigem autenticação
router.use(authMiddleware);

router.get('/', listarTarefas);
router.post('/', criarTarefa);
router.put('/:id/toggle', alternarTarefa);
router.delete('/:id', excluirTarefa);

export default router;