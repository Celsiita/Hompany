/**
 * Error thrown when a home-scoped operation is attempted without an active home_id.
 */
export class MissingHomeIdError extends Error {
  constructor(message = 'home_id is required for home-scoped data access') {
    super(message);
    this.name = 'MissingHomeIdError';
  }
}

/**
 * Asserts and returns a non-empty home_id string.
 * Enforces the multi-tenancy rule: never query home-scoped tables without home_id.
 *
 * @param homeId - Candidate home identifier from context or caller.
 * @returns The validated home_id.
 * @throws {MissingHomeIdError} When homeId is null, undefined or blank.
 */
export function requireHomeId(homeId: string | null | undefined): string {
  if (typeof homeId !== 'string' || homeId.trim().length === 0) {
    throw new MissingHomeIdError();
  }

  return homeId.trim();
}
