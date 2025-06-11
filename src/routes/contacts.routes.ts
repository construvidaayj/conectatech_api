import { Router } from 'express';
import { getContacts, createContact, getContactById, updateContact, deleteContact } from '../controllers/contacts.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const contactsRouter = Router();

// Todas las rutas de contactos requieren autenticación
contactsRouter.get('/', protect, getContacts);
contactsRouter.post('/', protect, createContact);
contactsRouter.get('/:id', protect, getContactById);
contactsRouter.put('/:id', protect, updateContact);
contactsRouter.delete('/:id', protect, deleteContact);

export default contactsRouter;