import { Router } from 'express';
import { listarTarefas, criarTarefa, atualizarTarefa, alternarTarefa, excluirTarefa } from '../controllers/taskController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', listarTarefas);
router.post('/', criarTarefa);
router.put('/:id', atualizarTarefa);
router.put('/:id/toggle', alternarTarefa);
router.delete('/:id', excluirTarefa);
export default router;
