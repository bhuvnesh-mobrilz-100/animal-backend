import { NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'AnimalClick API',
    version: '1.0.0',
    description: 'Swagger/OpenAPI specification for AnimalClick server-side APIs.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      AuthRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      },
      SignupRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          name: { type: 'string' },
          role_ids: {
            type: 'array',
            items: { type: 'integer' },
          },
        },
        required: ['email', 'password', 'role_ids'],
      },
      UserSession: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          expires_at: { type: 'integer' },
          token_type: { type: 'string' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          user: { type: 'object', additionalProperties: true },
          profile: { type: 'object', additionalProperties: true },
          session: { $ref: '#/components/schemas/UserSession' },
          roles: {
            type: 'array',
            items: { $ref: '#/components/schemas/Role' },
          },
          permissions: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      Role: {
        type: 'object',
        properties: {
          role_id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          is_system_role: { type: 'boolean' },
          permissions: {
            type: 'array',
            items: { $ref: '#/components/schemas/Permission' },
          },
        },
      },
      Permission: {
        type: 'object',
        properties: {
          permission_id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          resource: { type: 'string' },
          action: { type: 'string' },
        },
      },
      DashboardSummary: {
        type: 'object',
        additionalProperties: { type: 'integer' },
      },
      TableListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      TableItemResponse: {
        type: 'object',
        properties: {
          data: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logged in successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        summary: 'Register user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignupRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get authenticated user context',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User context returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    auth_user: { type: 'object', additionalProperties: true },
                    profile: { type: 'object', additionalProperties: true },
                    roles: { type: 'array', items: { $ref: '#/components/schemas/Role' } },
                    permissions: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refresh_token: { type: 'string' },
                },
                required: ['refresh_token'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'New token generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    session: { $ref: '#/components/schemas/UserSession' },
                    user: { type: 'object', additionalProperties: true },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/roles': {
      get: {
        summary: 'List all roles and their permissions',
        responses: {
          '200': {
            description: 'Roles returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roles: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Role' },
                    },
                  },
                },
              },
            },
          },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/dashboard/summary': {
      get: {
        summary: 'Get dashboard summary counts based on user permissions',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard summary returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: { $ref: '#/components/schemas/DashboardSummary' },
                    permissions: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/places': {
      get: {
        summary: 'Autocomplete places from Google Places API',
        parameters: [
          {
            name: 'input',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Search input text',
          },
        ],
        responses: {
          '200': {
            description: 'Place autocomplete results',
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: true },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/places/details': {
      get: {
        summary: 'Get Google place details',
        parameters: [
          {
            name: 'place_id',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Place ID to fetch details for',
          },
        ],
        responses: {
          '200': {
            description: 'Place details returned',
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: true },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/{table}': {
      get: {
        summary: 'List or query rows for a table',
        parameters: [
          {
            name: 'table',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Table name',
          },
          {
            name: 'select',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Columns to select, e.g. * or id,name',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
          {
            name: 'orderBy',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'order',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['asc', 'desc'] },
          },
        ],
        responses: {
          '200': {
            description: 'Table rows returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TableListResponse' },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Table not allowed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        summary: 'Insert row(s) into table',
        parameters: [
          {
            name: 'table',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Table name',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: {
          '200': {
            description: 'Row inserted successfully',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', additionalProperties: true } } } },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Table not allowed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/{table}/{id}': {
      get: {
        summary: 'Fetch a single row by id',
        parameters: [
          {
            name: 'table',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'primaryKey',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Primary key field name if not default id',
          },
        ],
        responses: {
          '200': {
            description: 'Single row returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TableItemResponse' },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Table not allowed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      patch: {
        summary: 'Update a row by id',
        parameters: [
          {
            name: 'table',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'primaryKey',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: {
          '200': {
            description: 'Row updated successfully',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', additionalProperties: true } } } },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Table not allowed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        summary: 'Delete a row by id',
        parameters: [
          {
            name: 'table',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'primaryKey',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Row deleted successfully',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', additionalProperties: true } } } },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Table not allowed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
