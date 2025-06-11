import { Router } from 'express';
import { getResources, createResource, getResourceById, updateResource, deleteResource } from '../controllers/resources.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const resourcesRouter = Router();

// Todas las rutas de recursos requieren autenticación
resourcesRouter.get('/', protect, getResources);
resourcesRouter.post('/', protect, createResource);
resourcesRouter.get('/:id', protect, getResourceById);
resourcesRouter.put('/:id', protect, updateResource);
resourcesRouter.delete('/:id', protect, deleteResource);

export default resourcesRouter;