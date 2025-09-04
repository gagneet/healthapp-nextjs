import swaggerJsdoc from 'swagger-jsdoc';

export const getApiDocs = async () => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'HealthApp API',
        version: '1.0',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
    apis: ['./app/api-docs/swagger-definitions.js', './app/api/health/route.ts'], // files containing annotations
  };

  const spec = swaggerJsdoc(options);
  return spec;
};
