'use client'

export const dynamic = 'force-dynamic'





import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

// Add this type definition
type OpenAPISpecification = {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, any>;
  components?: Record<string, any>;
  tags?: Array<{ name: string; description?: string }>;
};

type Props = {
  spec: OpenAPISpecification,
};

function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
