export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: {
          message: this.message,
          code: this.code || 'ERROR',
        },
      }),
      {
        status: this.statusCode,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

export const Errors = {
  unauthorized: () =>
    new ApiError(401, 'Invalid or missing API key', 'UNAUTHORIZED'),
  rateLimited: (resetAt: number) =>
    new ApiError(
      429,
      `Rate limit exceeded. Resets at ${new Date(resetAt).toISOString()}`,
      'RATE_LIMITED',
    ),
  notFound: (resource: string) =>
    new ApiError(404, `${resource} not found`, 'NOT_FOUND'),
  badRequest: (message: string) => new ApiError(400, message, 'BAD_REQUEST'),
  internal: (message = 'Internal server error') =>
    new ApiError(500, message, 'INTERNAL_ERROR'),
};
