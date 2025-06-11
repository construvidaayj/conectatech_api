//src/controllers/resources.controller.ts
import { Request, Response } from 'express';
import { pool } from '../config/lib/db';
import { Resource } from '../types/typesTablesDB';

export const getResources = async (req: Request, res: Response):Promise<any> => {
    try {
         
        const [rows] = await pool.query<Array<Resource & { created_by_user_email: string }>>(`
            SELECT
                r.id,
                r.title,
                r.detail,
                r.type_resource,
                r.url_resource,
                r.created_at,
                r.updated_at,
                u.email AS created_by_user_email
            FROM resources r
            JOIN users u ON r.created_by_user_id = u.id
            ORDER BY r.created_at DESC
        `);
        console.log(JSON.stringify(rows, null, 2));
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener recursos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener recursos.' });
    }
};

export const createResource = async (req: Request, res: Response):Promise<any> => {
    const { title, detail, type_resource, url_resource } = req.body;
    const created_by_user_id = req.user?.userId; // Obtenido del token JWT

    if (!created_by_user_id) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    if (!title || !type_resource || !url_resource) {
        return res.status(400).json({ message: 'Título, tipo de recurso y URL del recurso son requeridos.' });
    }
    const validTypes: Array<Resource['type_resource']> = ['video', 'documento', 'articulo', 'audio', 'otro'];
    if (!validTypes.includes(type_resource)) {
      return res.status(400).json({ message: `Tipo de recurso inválido. Debe ser uno de: ${validTypes.join(', ')}.` });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO resources (title, detail, type_resource, url_resource, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [title, detail || null, type_resource, url_resource, created_by_user_id]
        );
        res.status(201).json({ message: 'Recurso creado exitosamente.', id: (result as any).insertId });
    } catch (error) {
        console.error('Error al crear recurso:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear recurso.' });
    }
};

export const getResourceById = async (req: Request, res: Response):Promise<any> => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query<Array<Resource & { created_by_user_email: string }>>(`
            SELECT
                r.id,
                r.title,
                r.detail,
                r.type_resource,
                r.url_resource,
                r.created_at,
                r.updated_at,
                u.email AS created_by_user_email
            FROM resources r
            JOIN users u ON r.created_by_user_id = u.id
            WHERE r.id = ?
        `, [id]);

        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Recurso no encontrado.' });
        }
    } catch (error) {
        console.error('Error al obtener recurso por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener recurso.' });
    }
};

export const updateResource = async (req: Request, res: Response):Promise<any> => {
    const { id } = req.params;
    const { title, detail, type_resource, url_resource } = req.body;

    if (!title || !type_resource || !url_resource) {
        return res.status(400).json({ message: 'Título, tipo de recurso y URL del recurso son requeridos.' });
    }
    const validTypes: Array<Resource['type_resource']> = ['video', 'documento',];
    if (!validTypes.includes(type_resource)) {
      return res.status(400).json({ message: `Tipo de recurso inválido. Debe ser uno de: ${validTypes.join(', ')}.` });
    }

    try {
        const [result] = await pool.query(
            'UPDATE resources SET title = ?, detail = ?, type_resource = ?, url_resource = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, detail || null, type_resource, url_resource, id]
        );
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ message: 'Recurso no encontrado o no se realizaron cambios.' });
        }
        res.status(200).json({ message: 'Recurso actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar recurso:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar recurso.' });
    }
};

export const deleteResource = async (req: Request, res: Response):Promise<any> => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM resources WHERE id = ?', [id]);
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ message: 'Recurso no encontrado.' });
        }
        res.status(200).json({ message: 'Recurso eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar recurso:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar recurso.' });
    }
};