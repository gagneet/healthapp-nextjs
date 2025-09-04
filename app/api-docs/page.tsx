import { getApiDocs } from '@/lib/swagger';
import ReactSwagger from './react-swagger';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - HealthApp',
  description: 'Interactive API documentation for the HealthApp API'
};

export default async function IndexPage() {
  try {
    const spec = await getApiDocs();
    return (
      <section className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4 text-center py-6">API Documentation</h1>
        <ReactSwagger spec={spec} />
      </section>
    );
  } catch (error) {
    return (
      <section className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4 text-center py-6">API Documentation</h1>
        <div className="p-4 bg-red-100 text-red-700 rounded-lg shadow-md">
          <p className="font-semibold">Failed to load API documentation.</p>
          <p>We encountered an error while trying to load the spec. Please try again later or contact support if the problem persists.</p>
        </div>
      </section>
    );
  }
}
