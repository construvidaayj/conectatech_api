//src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { pool } from '../config/lib/db';
import bcrypt from 'bcrypt';
import { User } from '../types/typesTablesDB';


export const createUser = async (req: Request, res: Response): Promise<any> => {
    const { email, password, first_name, last_name, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Correo electrónico y contraseña son requeridos.' });
    }

    try {
        // Tipamos el resultado con <User[]>
        const [existingUsers] = await pool.query<User[]>(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const userRole = role && ['admin', 'supervisor', 'user'].includes(role) ? role : 'user';

        await pool.query(
            'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
            [email, password_hash, userRole, first_name || null, last_name || null]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
};