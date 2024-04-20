import type { FetchErrors } from "~/lib/shared/types";
import z from 'zod';
import { fail } from '@sveltejs/kit';

/**
 * Wrapper function for actions that makes sure errors come back to the client in a familiar, expected format
 */
export async function actionWrap(fn: () => Promise<Response | void>) {
    try {
        const result = await fn();
        return result;
    } catch (err) {
        // Redirects
        if (err?.location) {
            throw err;
        }

        let body: { errors: FetchErrors };
        if (err instanceof z.ZodError) {
            body = { errors: err.flatten().fieldErrors };
        } else if (err instanceof Error) {
            body = { errors: err.message };
        } else {
            body = { errors: 'Invalid error' };
        }
        console.error('Error:', err);
        return fail(400, body);
    }
}
