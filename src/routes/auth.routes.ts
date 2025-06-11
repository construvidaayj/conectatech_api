import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.get('/me', protect, getMe); // Ruta protegida para obtener el perfil del usuario

export default authRouter;