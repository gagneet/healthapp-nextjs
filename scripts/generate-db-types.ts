import { Client } from 'pg';
import * as fs from 'fs';

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://healthapp_user:pg_password@192.168.0.148:5433/healthapp_dev',
});

async function generateTypes() {
  try {
    await client.connect();
    console.log('Connected to database successfully');

  // Get all tables in public schema
  const tablesRes = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  `);

  let typeDefs = `// AUTO-GENERATED TYPES FROM DB\n\n`;

  for (const { table_name } of tablesRes.rows) {
    const columnsRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [table_name]);

    typeDefs += `export interface ${toPascalCase(table_name)} {\n`;
    for (const col of columnsRes.rows) {
      typeDefs += `  ${col.column_name}${col.is_nullable === 'YES' ? '?' : ''}: ${pgTypeToTs(col.data_type)};\n`;
    }
    typeDefs += `}\n\n`;
  }

  // Ensure types directory exists
  if (!fs.existsSync('./src/types')) {
    fs.mkdirSync('./src/types', { recursive: true });
  }

  fs.writeFileSync('./src/types/db.ts', typeDefs);
  await client.end();
  console.log('Types generated in src/types/db.ts');
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

// Helper: Convert snake_case to PascalCase
function toPascalCase(str: string) {
  return str.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase());
}

// Helper: Map PG types to TypeScript types
function pgTypeToTs(pgType: string): string {
  switch (pgType) {
    case 'integer':
    case 'smallint':
    case 'bigint':
    case 'numeric':
    case 'real':
    case 'double precision':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'character varying':
    case 'varchar':
    case 'text':
    case 'uuid':
    case 'char':
      return 'string';
    case 'timestamp without time zone':
    case 'timestamp with time zone':
    case 'date':
      return 'Date';
    case 'json':
    case 'jsonb':
      return 'any';
    default:
      return 'any'; // fallback, extend as needed
  }
}

generateTypes().catch(console.error);