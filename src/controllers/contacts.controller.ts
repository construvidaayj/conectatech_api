//src/controllers/contacts.controller.ts
import { Request, Response } from 'express';
import { pool } from '../config/lib/db';
import { Contact, Vehicle } from '../types/typesTablesDB';

export const getContacts = async (req: Request, res: Response): Promise<any> => {
    try {
        const [rows] = await pool.query<Array<any>>(`
      SELECT
        c.id,
        c.full_name,
        c.boss_name,
        c.position,
        c.created_at,
        c.updated_at,
        c.created_by_user_id,
        v.id AS vehicle_id,
        v.plate AS vehicle_plate,
        v.type AS vehicle_type,
        u.email AS created_by_user_email,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT('id', cn.id, 'numero', cn.number)
          ),
          '[]'
        ) AS contact_numbers_json
      FROM contacts c
      LEFT JOIN vehicles v ON c.vehicle_id = v.id
      JOIN users u ON c.created_by_user_id = u.id
      LEFT JOIN contact_numbers cn ON cn.contact_id = c.id
      GROUP BY
        c.id, c.full_name, c.boss_name, c.position, c.created_at, c.updated_at,
        c.created_by_user_id, v.id, v.plate, v.type, u.email
      ORDER BY c.created_at DESC
    `);

        const contacts = rows.map((row: any) => {

            return {
                id: row.id,
                full_name: row.full_name,
                boss_name: row.boss_name,
                position: row.position,
                created_at: row.created_at,
                updated_at: row.updated_at,
                created_by_user_id: row.created_by_user_id,
                vehicle: row.vehicle_id
                    ? {
                        id: row.vehicle_id,
                        plate: row.vehicle_plate,
                        type: row.vehicle_type
                    }
                    : null,
                contact_numbers: JSON.parse(row.contact_numbers_json)
            };
        });

        res.status(200).json(contacts);
    } catch (error) {
        console.error('Error al obtener contactos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener contactos.' });
    }
};

export const createContact = async (req: Request, res: Response): Promise<any> => {
    const { full_name, boss_name, position, vehicle_plate, vehicle_type, contact_numbers } = req.body;
    const created_by_user_id = req.user?.userId; // Obtenido del token JWT

    if (!created_by_user_id) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    if (!full_name || !boss_name || !position || !contact_numbers || !Array.isArray(contact_numbers) || contact_numbers.length === 0) {
        return res.status(400).json({ message: 'Nombre completo, nombre del jefe, cargo y al menos un número de contacto son requeridos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let vehicleId: number | null = null;
        if (vehicle_plate && vehicle_type) {
            // Verificar si el vehículo ya existe
            const [existingVehicles] = await connection.query<Vehicle[]>('SELECT id FROM vehicles WHERE plate = ?', [vehicle_plate]);
            if (existingVehicles.length > 0) {
                vehicleId = existingVehicles[0].id;
            } else {
                // Crear nuevo vehículo si no existe
                const [vehicleResult] = await connection.query('INSERT INTO vehicles (plate, type) VALUES (?, ?)', [vehicle_plate, vehicle_type]);
                vehicleId = (vehicleResult as any).insertId;
            }
        }

        const [contactResult] = await connection.query(
            'INSERT INTO contacts (full_name, boss_name, position, vehicle_id, created_by_user_id) VALUES (?, ?, ?, ?, ?)',
            [full_name, boss_name, position, vehicleId, created_by_user_id]
        );
        const contactId = (contactResult as any).insertId;

        // Insertar números de contacto
        for (const number of contact_numbers) {
            if (number) { // Asegurarse de que el número no sea vacío
                await connection.query('INSERT INTO contact_numbers (contact_id, number) VALUES (?, ?)', [contactId, number]);
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Contacto creado exitosamente.', id: contactId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al crear contacto:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear contacto.' });
    } finally {
        if (connection) connection.release();
    }
};

export const getContactById = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query<Array<Contact & { vehicle_plate: string | null; vehicle_type: string | null; created_by_user_email: string; contact_numbers: string | null }>>(`
          SELECT
              c.id,
              c.full_name,
              c.boss_name,
              c.position,
              c.created_at,
              c.updated_at,
              v.plate AS vehicle_plate,
              v.type AS vehicle_type,
              u.email AS created_by_user_email,
              COALESCE(JSON_ARRAYAGG(cn.number), '[]') AS contact_numbers_json
          FROM contacts c
          LEFT JOIN vehicles v ON c.vehicle_id = v.id
          JOIN users u ON c.created_by_user_id = u.id
          LEFT JOIN contact_numbers cn ON cn.contact_id = c.id
          WHERE c.id = ?
          GROUP BY c.id, c.full_name, c.boss_name, c.position, c.created_at, c.updated_at, v.plate, v.type, u.email
      `, [id]);

        if (rows.length > 0) {
            const contact = {
                ...rows[0],
                contact_numbers: JSON.parse(rows[0].contact_numbers_json || '[]') as string[],
            };
            delete (contact as any).contact_numbers_json;
            res.status(200).json(contact);
        } else {
            res.status(404).json({ message: 'Contacto no encontrado.' });
        }
    } catch (error) {
        console.error('Error al obtener contacto por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener contacto.' });
    }
};

export const updateContact = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { full_name, boss_name, position, vehicle_plate, vehicle_type, contact_numbers } = req.body;
   
    if (!full_name || !boss_name || !position || !contact_numbers || !Array.isArray(contact_numbers) || contact_numbers.length === 0) {
        return res.status(400).json({ message: 'Nombre completo, nombre del jefe, cargo y al menos un número de contacto son requeridos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let vehicleId: number | null = null;
        if (vehicle_plate && vehicle_type) {
            const [existingVehicles] = await connection.query<Vehicle[]>('SELECT id FROM vehicles WHERE plate = ?', [vehicle_plate]);
            if (existingVehicles.length > 0) {
                vehicleId = existingVehicles[0].id;
            } else {
                const [vehicleResult] = await connection.query('INSERT INTO vehicles (plate, type) VALUES (?, ?)', [vehicle_plate, vehicle_type]);
                vehicleId = (vehicleResult as any).insertId;
            }
        }

        const [updateResult] = await connection.query(
            'UPDATE contacts SET full_name = ?, boss_name = ?, position = ?, vehicle_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [full_name, boss_name, position, vehicleId, id]
        );

        if ((updateResult as any).affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Contacto no encontrado o no se realizaron cambios.' });
        }

        // Eliminar números de contacto antiguos e insertar nuevos
        await connection.query('DELETE FROM contact_numbers WHERE contact_id = ?', [id]);
        for (const number of contact_numbers) {
            if (number) {
                await connection.query('INSERT INTO contact_numbers (contact_id, number) VALUES (?, ?)', [id, number]);
            }
        }

        await connection.commit();
        res.status(200).json({ message: 'Contacto actualizado exitosamente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al actualizar contacto:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar contacto.' });
    } finally {
        if (connection) connection.release();
    }
};

export const deleteContact = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.query('DELETE FROM contact_numbers WHERE contact_id = ?', [id]);

        const [result] = await connection.query('DELETE FROM contacts WHERE id = ?', [id]);

        if ((result as any).affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Contacto no encontrado.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Contacto eliminado exitosamente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al eliminar contacto:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar contacto.' });
    } finally {
        if (connection) connection.release();
    }
};