import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../../package.json';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Music Community API Documentation',
    version,
    description: 'API documentation for the Music Community platform',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      url: 'https://music-community.example.com',
      email: 'support@music-community.example.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Base URL',
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
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'Music',
      description: 'Music tracks and albums',
    },
    {
      name: 'Stems',
      description: 'Stems management',
    },
    {
      name: 'Genres',
      description: 'Music genres',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: ['./src/server/api/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
