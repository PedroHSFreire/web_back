import { Router } from 'express';
import { listarTarefas, criarTarefa, alternarTarefa, excluirTarefa } from '../controllers/taskController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listarTarefas);
router.post('/', criarTarefa);
router.put('/:id/toggle', alternarTarefa); // <-- agora com /toggle
router.delete('/:id', excluirTarefa);

export default router;