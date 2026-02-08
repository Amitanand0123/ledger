/**
 * Validation utilities for input data
 */

export interface ValidationResult {
    valid: boolean;
    message?: string;
}

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { valid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true };
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): ValidationResult => {
    if (!email) {
        return { valid: false, message: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }

    return { valid: true };
};

/**
 * Validates name (no special characters except spaces, hyphens, apostrophes)
 */
export const validateName = (name: string): ValidationResult => {
    if (!name) {
        return { valid: false, message: 'Name is required' };
    }

    if (name.trim().length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters long' };
    }

    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
        return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    return { valid: true };
};
