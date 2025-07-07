// backend/src/controllers/custom-fields.controller.ts

import asyncHandler from 'express-async-handler';
import {  Response } from 'express';
import * as CustomFieldService from '../services/custom-fields.service';
import { FieldType } from '@prisma/client';

/**
 * @desc    Get all custom fields for the logged-in user
 * @route   GET /api/v1/custom-fields
 * @access  Private
 */
export const getCustomFields = asyncHandler(async (req: any, res: Response) => {
    const fields = await CustomFieldService.getFieldsForUser(req.user.id);
    res.status(200).json(fields);
});

/**
 * @desc    Create a new custom field
 * @route   POST /api/v1/custom-fields
 * @access  Private
 */
export const createCustomField = asyncHandler(
    async (req: any, res: Response) => {
        const { name, type } = req.body;
        if (!name || !type) {
            res.status(400);
            throw new Error('Field name and type are required.');
        }
        // Basic validation for the enum
        if (!Object.values(FieldType).includes(type)) {
            res.status(400);
            throw new Error('Invalid field type provided.');
        }
        // FIXED: The service expects three arguments, not two.
        const field = await CustomFieldService.createField(
            req.user.id,
            name,
            type
        );
        res.status(201).json(field);
    }
);

/**
 * @desc    Delete a custom field
 * @route   DELETE /api/v1/custom-fields/:id
 * @access  Private
 */
export const deleteCustomField = asyncHandler(
    async (req: any, res: Response) => {
        const { id } = req.params;
        await CustomFieldService.deleteField(id, req.user.id);
        res.status(200).json({
            id,
            message: 'Custom field deleted successfully.',
        });
    }
)