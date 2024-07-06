import type { FetchErrors } from "~/lib/shared/types";
import z from 'zod';
import { json } from '@sveltejs/kit';

/**
 * Wrapper function for API endpoints to ensure errors come back to the client in an expected format
 */
export async function errCatcher(fn: () => Promise<Response>) {
    try {
        const result = await fn();
        return result;
    } catch (err) {
        let body: { errors: FetchErrors };
        if (err instanceof z.ZodError) {
            body = { errors: err.flatten().fieldErrors };
        } else if (err instanceof Error) {
            body = { errors: err.message };
        } else {
            body = { errors: 'Invalid error' };
        }
        console.error('Error:', err);
        return json(body, { status: 400 });
    }
}
