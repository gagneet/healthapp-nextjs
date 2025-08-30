import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';
import { GenericLabClient, LabIntegrationConfig } from '@/lib/lab-integrations/GenericLabClient';

export interface CreateLabOrderData {
  doctorId: string;
  patientId: string;
  testCodes: string[];
  priority: 'routine' | 'urgent' | 'stat' | 'asap';
  fastingRequired?: boolean;
  specialInstructions?: string;
  expectedCollectionDate?: Date;
  orderReason?: string;
}

export interface LabResultData {
  orderId: string;
  testResults: Array<{
    testCode: string;
    testName: string;
    result: string;
    unit?: string;
    referenceRange?: string;
    status: 'normal' | 'abnormal' | 'critical' | 'pending';
    flag?: 'high' | 'low' | 'critical_high' | 'critical_low';
    notes?: string;
  }>;
  labId?: string;
  collectedAt?: Date;
  processedAt?: Date;
  reviewedBy?: string;
}

export interface LabTestCatalog {
  testCode: string;
  testName: string;
  category: 'hematology' | 'chemistry' | 'microbiology' | 'immunology' | 'molecular' | 'toxicology';
  description: string;
  specimen: 'blood' | 'urine' | 'saliva' | 'stool' | 'tissue' | 'swab';
  turnaroundTime: number; // hours
  cost: number;
  fastingRequired: boolean;
  referenceRanges: {
    male?: { min?: number; max?: number; unit: string };
    female?: { min?: number; max?: number; unit: string };
    pediatric?: { min?: number; max?: number; unit: string };
  };
}

export class LaboratoryService {
  private readonly LAB_API_URL = process.env.LAB_API_URL || 'https://api.lab-partner.com/v1';
  private readonly LAB_API_KEY = process.env.LAB_API_KEY || 'demo-key';

  /**
   * Get available lab tests catalog
   */
  async getLabTestCatalog(category?: string): Promise<{ success: boolean; tests?: LabTestCatalog[]; error?: string }> {
    try {
      // In production, this would fetch from external lab API or internal database
      const mockTestCatalog: LabTestCatalog[] = [
        {
          testCode: 'CBC',
          testName: 'Complete Blood Count',
          category: 'hematology',
          description: 'Comprehensive blood analysis including RBC, WBC, platelets',
          specimen: 'blood',
          turnaroundTime: 4,
          cost: 35.00,
          fastingRequired: false,
          referenceRanges: {
            male: { min: 4.5, max: 5.5, unit: '10^6/μL' },
            female: { min: 4.0, max: 5.2, unit: '10^6/μL' }
          }
        },
        {
          testCode: 'CMP',
          testName: 'Comprehensive Metabolic Panel',
          category: 'chemistry',
          description: 'Blood chemistry panel including glucose, electrolytes, kidney function',
          specimen: 'blood',
          turnaroundTime: 6,
          cost: 45.00,
          fastingRequired: true,
          referenceRanges: {
            male: { min: 70, max: 100, unit: 'mg/dL' },
            female: { min: 70, max: 100, unit: 'mg/dL' }
          }
        },
        {
          testCode: 'LIPID',
          testName: 'Lipid Panel',
          category: 'chemistry',
          description: 'Cholesterol, triglycerides, HDL, LDL analysis',
          specimen: 'blood',
          turnaroundTime: 8,
          cost: 40.00,
          fastingRequired: true,
          referenceRanges: {
            male: { min: 0, max: 200, unit: 'mg/dL' },
            female: { min: 0, max: 200, unit: 'mg/dL' }
          }
        },
        {
          testCode: 'HBA1C',
          testName: 'Hemoglobin A1C',
          category: 'chemistry',
          description: '3-month average blood glucose levels',
          specimen: 'blood',
          turnaroundTime: 4,
          cost: 30.00,
          fastingRequired: false,
          referenceRanges: {
            male: { min: 4.0, max: 5.6, unit: '%' },
            female: { min: 4.0, max: 5.6, unit: '%' }
          }
        },
        {
          testCode: 'TSH',
          testName: 'Thyroid Stimulating Hormone',
          category: 'immunology',
          description: 'Thyroid function screening test',
          specimen: 'blood',
          turnaroundTime: 12,
          cost: 25.00,
          fastingRequired: false,
          referenceRanges: {
            male: { min: 0.4, max: 4.0, unit: 'mIU/L' },
            female: { min: 0.4, max: 4.0, unit: 'mIU/L' }
          }
        },
        {
          testCode: 'UA',
          testName: 'Urinalysis',
          category: 'chemistry',
          description: 'Complete urine analysis including microscopy',
          specimen: 'urine',
          turnaroundTime: 2,
          cost: 20.00,
          fastingRequired: false,
          referenceRanges: {
            male: { min: 0, max: 0, unit: 'cells/hpf' },
            female: { min: 0, max: 0, unit: 'cells/hpf' }
          }
        }
      ];

      const filteredTests = category 
        ? mockTestCatalog.filter(test => test.category === category)
        : mockTestCatalog;

      return {
        success: true,
        tests: filteredTests
      };

    } catch (error) {
      console.error('Error fetching lab test catalog:', error);
      return {
        success: false,
        error: 'Failed to fetch lab test catalog'
      };
    }
  }

  /**
   * Create a new lab order
   */
  async createLabOrder(data: CreateLabOrderData) {
    try {
      // Generate unique order number
      const orderNumber = `LAB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Calculate total estimated cost (mock calculation)
      const testCatalog = await this.getLabTestCatalog();
      let totalCost = 0;
      let fastingRequired = false;

      if (testCatalog.success && testCatalog.tests) {
        data.testCodes.forEach(code => {
          const test = testCatalog.tests?.find(t => t.testCode === code);
          if (test) {
            totalCost += test.cost;
            if (test.fastingRequired) fastingRequired = true;
          }
        });
      }

      // Create lab order in database
      const labOrder = await prisma.labOrder.create({
        data: {
          order_number: orderNumber,
          doctorId: data.doctorId,
          patientId: data.patientId,
          ordered_tests: data.testCodes,
          priority: data.priority,
          status: 'pending',
          fasting_required: data.fastingRequired || fastingRequired,
          special_instructions: data.specialInstructions,
          expected_collection_date: data.expectedCollectionDate,
          order_reason: data.orderReason,
          estimated_cost: totalCost,
          estimated_tat_hours: Math.max(...data.testCodes.map(() => 12)), // Mock calculation
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              specialty: {
                select: {
                  name: true
                }
              }
            }
          },
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  date_of_birth: true,
                  gender: true
                }
              }
            }
          }
        }
      });

      // In production, submit order to external lab system
      await this.submitOrderToLab(labOrder);

      return {
        success: true,
        order: labOrder,
        message: 'Lab order created successfully'
      };

    } catch (error) {
      console.error('Error creating lab order:', error);
      return {
        success: false,
        error: 'Failed to create lab order',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process lab results (typically called by lab system webhook)
   */
  async processLabResults(resultsData: LabResultData) {
    try {
      // Find the lab order
      const labOrder = await prisma.labOrder.findUnique({
        where: { id: resultsData.orderId },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        }
      });

      if (!labOrder) {
        return {
          success: false,
          error: 'Lab order not found'
        };
      }

      // Create lab results
      const results = await Promise.all(
        resultsData.testResults.map(result => 
          prisma.labResult.create({
            data: {
              lab_order_id: resultsData.orderId,
              test_code: result.testCode,
              test_name: result.testName,
              result_value: result.result,
              unit: result.unit,
              reference_range: result.referenceRange,
              status: result.status,
              abnormal_flag: result.flag,
              notes: result.notes,
              collected_at: resultsData.collectedAt,
              processed_at: resultsData.processedAt || new Date(),
              reviewed_by: resultsData.reviewedBy,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          })
        )
      );

      // Update lab order status
      const hasAbnormal = resultsData.testResults.some(r => r.status === 'abnormal' || r.status === 'critical');
      const hasCritical = resultsData.testResults.some(r => r.status === 'critical');
      
      const updatedOrder = await prisma.labOrder.update({
        where: { id: resultsData.orderId },
        data: {
          status: 'completed',
          results_available: true,
          abnormal_results: hasAbnormal,
          critical_results: hasCritical,
          completed_at: new Date(),
          updatedAt: new Date(),
        }
      });

      // Trigger notifications for critical results
      if (hasCritical) {
        await this.handleCriticalResults(labOrder, results.filter(r => 
          resultsData.testResults.find(tr => tr.testCode === r.test_code)?.status === 'critical'
        ));
      }

      return {
        success: true,
        order: updatedOrder,
        results,
        message: 'Lab results processed successfully'
      };

    } catch (error) {
      console.error('Error processing lab results:', error);
      return {
        success: false,
        error: 'Failed to process lab results',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get lab orders for a patient or doctor
   */
  async getLabOrders(userId: string, userRole: 'doctor' | 'patient', status?: string) {
    try {
      const whereClause = userRole === 'doctor' 
        ? { doctorId: userId }
        : { patientId: userId };

      if (status) {
        (whereClause as any).status = status;
      }

      const orders = await prisma.labOrder.findMany({
        where: whereClause,
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              specialty: {
                select: {
                  name: true
                }
              }
            }
          },
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  date_of_birth: true
                }
              }
            }
          },
          results: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        orders,
        message: 'Lab orders retrieved successfully'
      };

    } catch (error) {
      console.error('Error fetching lab orders:', error);
      return {
        success: false,
        error: 'Failed to fetch lab orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get detailed lab results for an order
   */
  async getLabResults(orderId: string, userId: string, userRole: 'doctor' | 'patient') {
    try {
      // Verify access permissions
      const order = await prisma.labOrder.findUnique({
        where: { id: orderId },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
          results: {
            orderBy: [
              { test_code: 'asc' },
              { createdAt: 'desc' }
            ]
          }
        }
      });

      if (!order) {
        return {
          success: false,
          error: 'Lab order not found'
        };
      }

      // Check permissions
      const hasAccess = userRole === 'doctor' 
        ? order.doctorId === userId
        : order.patientId === userId;

      if (!hasAccess) {
        return {
          success: false,
          error: 'Access denied'
        };
      }

      // Analyze results for summary
      const resultsSummary = this.analyzeResults(order.results);

      return {
        success: true,
        order,
        results: order.results,
        summary: resultsSummary,
        message: 'Lab results retrieved successfully'
      };

    } catch (error) {
      console.error('Error fetching lab results:', error);
      return {
        success: false,
        error: 'Failed to fetch lab results',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit order to external lab system
   */
  private async submitOrderToLab(order: any) {
    try {
      // In a real application, you would fetch the lab integration configuration
      // from a secure store based on the doctor's or organization's preference.
      const mockLabConfig: LabIntegrationConfig = {
        id: 'quest',
        name: 'Quest Diagnostics',
        apiKey: process.env.QUEST_API_KEY || 'fake-key',
        apiUrl: 'https://api.questdiagnostics.com/v1',
      };

      const labClient = new GenericLabClient(mockLabConfig);

      const payload = {
        orderNumber: order.order_number,
        patient: {
          id: order.patient.user.id,
          name: `${order.patient.user.firstName} ${order.patient.user.lastName}`,
          dateOfBirth: order.patient.user.date_of_birth,
          gender: order.patient.user.gender,
        },
        physician: {
          id: order.doctor.user.id,
          name: `${order.doctor.user.firstName} ${order.doctor.user.lastName}`,
          npi: order.doctor.medical_license_number,
        },
        tests: order.ordered_tests,
        priority: order.priority,
        specialInstructions: order.special_instructions,
      };

      const result = await labClient.submitOrder(payload);

      if (result.success && result.externalOrderId) {
        await prisma.labOrder.update({
          where: { id: order.id },
          data: { external_lab_order_id: result.externalOrderId },
        });
      }

      return result;

    } catch (error) {
      console.error('Error submitting to lab system:', error);
      throw error;
    }
  }

  /**
   * Handle critical lab results
   */
  private async handleCriticalResults(order: any, criticalResults: any[]) {
    try {
      // Create critical alerts
      const alerts = await Promise.all(
        criticalResults.map(result => 
          prisma.medicalAlert.create({
            data: {
              patientId: order.patientId,
              doctorId: order.doctorId,
              alert_type: 'critical_lab_result',
              severity: 'critical',
              title: `Critical Lab Result: ${result.test_name}`,
              description: `Critical result for ${result.test_name}: ${result.result_value} ${result.unit}`,
              data: {
                orderId: order.id,
                testCode: result.test_code,
                result: result.result_value,
                referenceRange: result.reference_range
              },
              requires_action: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          })
        )
      );

      // In production, trigger immediate notifications (SMS, phone call, etc.)
      console.log('Critical lab results detected, alerts created:', alerts.length);

      return alerts;
    } catch (error) {
      console.error('Error handling critical results:', error);
      throw error;
    }
  }

  /**
   * Analyze lab results for summary insights
   */
  private analyzeResults(results: any[]) {
    const summary = {
      totalTests: results.length,
      normalCount: 0,
      abnormalCount: 0,
      criticalCount: 0,
      pendingCount: 0,
      categories: {} as Record<string, number>,
      insights: [] as string[]
    };

    results.forEach(result => {
      switch (result.status) {
        case 'normal':
          summary.normalCount++;
          break;
        case 'abnormal':
          summary.abnormalCount++;
          break;
        case 'critical':
          summary.criticalCount++;
          break;
        case 'pending':
          summary.pendingCount++;
          break;
      }

      // Count by test category (would be enhanced with actual test categorization)
      const category = this.categorizeTest(result.test_code);
      summary.categories[category] = (summary.categories[category] || 0) + 1;
    });

    // Generate insights
    if (summary.criticalCount > 0) {
      summary.insights.push(`${summary.criticalCount} critical result${summary.criticalCount > 1 ? 's' : ''} require immediate attention`);
    }
    if (summary.abnormalCount > 0) {
      summary.insights.push(`${summary.abnormalCount} abnormal result${summary.abnormalCount > 1 ? 's' : ''} found`);
    }
    if (summary.normalCount === summary.totalTests) {
      summary.insights.push('All test results are within normal ranges');
    }

    return summary;
  }

  /**
   * Categorize test by code (simplified mapping)
   */
  private categorizeTest(testCode: string): string {
    const categoryMap: Record<string, string> = {
      'CBC': 'Hematology',
      'CMP': 'Chemistry',
      'LIPID': 'Chemistry',
      'HBA1C': 'Diabetes',
      'TSH': 'Endocrinology',
      'UA': 'Urinalysis'
    };

    return categoryMap[testCode] || 'General';
  }

  /**
   * Get lab trend analysis for a patient and test code
   */
  async getLabTrendAnalysis(patientId: string, testCode: string) {
    try {
      const results = await prisma.labResult.findMany({
        where: {
          lab_order: {
            patientId: patientId,
          },
          test_code: testCode,
        },
        orderBy: {
          result_date: 'asc',
        },
        select: {
          result_date: true,
          numeric_value: true,
          result_unit: true,
          reference_range: true,
        },
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('Error fetching lab trend analysis:', error);
      return {
        success: false,
        error: 'Failed to fetch lab trend analysis',
      };
    }
  }

  /**
   * Cancel a lab order (if not yet processed)
   */
  async cancelLabOrder(orderId: string, userId: string, reason: string) {
    try {
      const order = await prisma.labOrder.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return {
          success: false,
          error: 'Lab order not found'
        };
      }

      // Verify permissions (only ordering doctor can cancel)
      if (order.doctorId !== userId) {
        return {
          success: false,
          error: 'Only the ordering physician can cancel this order'
        };
      }

      // Check if order can be cancelled
      if (['completed', 'cancelled'].includes(order.status)) {
        return {
          success: false,
          error: `Cannot cancel order with status: ${order.status}`
        };
      }

      // Update order status
      const cancelledOrder = await prisma.labOrder.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date(),
          updatedAt: new Date(),
        }
      });

      // Notify lab system to cancel order
      // In production, make API call to external lab system

      return {
        success: true,
        order: cancelledOrder,
        message: 'Lab order cancelled successfully'
      };

    } catch (error) {
      console.error('Error cancelling lab order:', error);
      return {
        success: false,
        error: 'Failed to cancel lab order',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default new LaboratoryService();