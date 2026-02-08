import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as CustomFieldService from '../services/custom-fields.service.js';
import { fieldTypeEnum } from '../db/schema/index.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

const VALID_FIELD_TYPES = fieldTypeEnum.enumValues;

export const getCustomFields = asyncHandler(async (req: any, res: Response) => {
    const fields = await CustomFieldService.getFieldsForUser(req.user.id);
    sendSuccess(res, 200, fields);
});

export const createCustomField = asyncHandler(async (req: any, res: Response) => {
    const { name, type } = req.body;
    if (!name || !type) {
        throw new ValidationError('Field name and type are required.');
    }
    if (!VALID_FIELD_TYPES.includes(type)) {
        throw new ValidationError('Invalid field type provided.');
    }
    const field = await CustomFieldService.createField(req.user.id, name, type);
    sendSuccess(res, 201, field);
});

export const deleteCustomField = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    await CustomFieldService.deleteField(id, req.user.id);
    sendSuccess(res, 200, { id }, { message: 'Custom field deleted successfully.' });
});
