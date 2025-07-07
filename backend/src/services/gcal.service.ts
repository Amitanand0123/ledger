// backend/src/services/gcal.service.ts

import { google } from 'googleapis';
import config from '../config';

const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
);

/**
 * Generates an authentication URL for the user to grant calendar access.
 * @param state - An optional string to be passed through the OAuth flow for validation.
 */
export const getAuthUrl = (state?: string) => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Critical for obtaining a refresh token
        prompt: 'consent', // Ensures user sees the consent screen every time
        scope: ['https://www.googleapis.com/auth/calendar.events'],
        state: state, // FIXED: Pass the state parameter
    });
};

/**
 * Exchanges the one-time authorization code for access and refresh tokens.
 */
export const getTokensFromCode = async (code: string) => {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
        console.warn(`No refresh token returned from Google OAuth.`);
    }
    return tokens;
};

/**
 * Creates a calendar event using a stored refresh token.
 */
export const createCalendarEvent = async (
    refreshToken: string,
    summary: string,
    description: string,
    startDateTime: string,
    endDateTime: string
) => {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary,
                description,
                start: { dateTime: startDateTime, timeZone: 'UTC' }, // Best practice to use UTC
                end: { dateTime: endDateTime, timeZone: 'UTC' },
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to create Google Calendar event:', error);
        throw new Error('Could not schedule interview on Google Calendar.');
    }
}