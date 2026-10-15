import type { ZodObject } from "zod";

export function envSchema(schema: ZodObject, object: Record<string, unknown>) {
	const validity = schema.safeParse(object);
	if (!validity.success) {
		throw new Error(`Invalid environment variables: ${JSON.stringify(validity.error.message, null, 2)}`);
	} else {
		return validity.data as Record<string, unknown>;
	}
}