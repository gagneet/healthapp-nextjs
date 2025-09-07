import { promises as fs } from 'fs';
import path from 'path';

export const getApiDocs = async () => {
  const filePath = path.join(process.cwd(), 'public', 'swagger.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const spec = JSON.parse(fileContents);
  return spec;
};
