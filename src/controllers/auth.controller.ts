//src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { pool } from '../config/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../types/typesTablesDB';

const JWT_SECRET = process.env.JWT_SECRET || 'superSecretJWTKeyExample123';

export const registerUser = async (req: Request, res: Response): Promise<any> => {
  const { email, password, first_name, last_name, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo electrónico y contraseña son requeridos.' });
  }

  try {
    const [existingUsers] = await pool.query<User[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = role && ['maestro', 'supervisor', 'normal'].includes(role) ? role : 'normal';

    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, userRole, first_name || null, last_name || null]
    );

    const insertId = (result as any).insertId;

    const [newUserRows] = await pool.query<User[]>(
      'SELECT id, email, role, first_name, last_name FROM users WHERE id = ?',
      [insertId]
    );

    const newUser = newUserRows[0];

    if (newUser) {
      // Devuelve el objeto del usuario completo en la respuesta
      res.status(201).json({
        message: 'Usuario registrado exitosamente.',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
        }
      });
    } else {
      res.status(500).json({ message: 'Error interno del servidor: No se pudo recuperar el usuario recién creado.' });
    }
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
  }
};

export const loginUser = async (req: Request, res: Response):Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo electrónico y contraseña son requeridos.' });
  }

  try {
    const [users] = await pool.query<User[]>(
      'SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login exitoso.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
  }
};

export const getMe = async (req: Request, res: Response):Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado.' });
  }

  try {
    const [users] = await pool.query<User[]>(
      'SELECT id, email, role, first_name, last_name FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const user = users[0];
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
