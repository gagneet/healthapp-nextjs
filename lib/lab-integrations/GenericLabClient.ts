export interface LabIntegrationConfig {
  id: string;
  name: string;
  apiKey: string;
  apiUrl: string;
}

export interface LabOrderPayload {
  orderNumber: string;
  patient: {
    id: string;
    name: string;
    dateOfBirth: Date;
    gender: string;
  };
  physician: {
    id: string;
    name: string;
    npi: string;
  };
  tests: string[];
  priority: string;
  specialInstructions?: string;
}

export class GenericLabClient {
  protected config: LabIntegrationConfig;

  constructor(config: LabIntegrationConfig) {
    this.config = config;
  }

  async submitOrder(payload: LabOrderPayload): Promise<{ success: boolean; externalOrderId?: string; error?: string }> {
    console.log(`Submitting order to ${this.config.name} at ${this.config.apiUrl}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Mock implementation
    // In a real implementation, you would use a library like axios or fetch
    // to make a POST request to the lab's API endpoint with the payload.
    // The API key would be included in the headers for authentication.

    return {
      success: true,
      externalOrderId: `EXT-${payload.orderNumber}`,
    };
  }

  async checkOrderStatus(externalOrderId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    console.log(`Checking status for order ${externalOrderId} at ${this.config.name}`);

    // Mock implementation
    return {
      success: true,
      status: 'in_progress',
    };
  }
}
