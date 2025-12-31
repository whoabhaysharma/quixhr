import { prisma } from '@/utils/prisma';
import { UpdateCompanyDto, UpgradeCompanyDto } from './company.schema';

// ============================================================================
// TYPES
// ============================================================================
interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  absentToday: number;
  pendingLeaves: number;
  companyInfo: {
    name: string;
    plan: string;
    planExpiry: Date | null;
  };
}

interface AuditLog {
  id: string;
  action: string;
  details: any;
  userId: string;
  userName: string;
  timestamp: Date;
}

interface PaginatedAuditLogs {
  logs: AuditLog[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface BillingInvoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  planName: string;
  billingCycle: string;
  createdAt: Date;
  paidAt: Date | null;
}

// ============================================================================
// COMPANY SERVICE
// ============================================================================

export class CompanyService {
  /**
   * Get company details with plan information
   */
  static async getCompanyById(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        plan: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    return {
      id: company.id,
      name: company.name,
      timezone: company.timezone,
      currency: company.currency,
      logo: company.logo,
      description: company.description,
      website: company.website,
      phone: company.phone,
      address: company.address,
      settings: company.settings,
      plan: company.plan,
      employeeCount: company._count.employees,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  /**
   * Update company settings
   */
  static async updateCompany(companyId: string, updateData: UpdateCompanyDto) {
    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    return company;
  }

  /**
   * Get dashboard statistics for company admin
   */
  static async getDashboardStats(companyId: string, date?: Date): Promise<DashboardStats> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get company info with plan
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Get employee counts
    const [totalEmployees, activeEmployees, absentToday, pendingLeaves] = await Promise.all([
      // Total employees
      prisma.employee.count({
        where: { companyId },
      }),

      // Active employees (not terminated)
      prisma.employee.count({
        where: {
          companyId,
          status: 'ACTIVE',
        },
      }),

      // Absent today (simplified - could be enhanced with attendance tracking)
      prisma.leave.count({
        where: {
          employee: { companyId },
          status: 'APPROVED',
          startDate: { lte: endOfDay },
          endDate: { gte: startOfDay },
        },
      }),

      // Pending leave requests
      prisma.leave.count({
        where: {
          employee: { companyId },
          status: 'PENDING',
        },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      absentToday,
      pendingLeaves,
      companyInfo: {
        name: company.name,
        plan: company.plan?.name || 'Free',
        planExpiry: company.plan?.expiryDate || null,
      },
    };
  }

  /**
   * Get paginated audit logs for the company
   */
  static async getAuditLogs(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      startDate?: string;
      endDate?: string;
      action?: string;
      userId?: string;
    } = {}
  ): Promise<PaginatedAuditLogs> {
    const offset = (page - 1) * limit;

    const whereClause: any = {
      companyId,
    };

    // Apply filters
    if (filters.startDate) {
      whereClause.createdAt = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(filters.endDate),
      };
    }
    if (filters.action) {
      whereClause.action = { contains: filters.action };
    }
    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    const formattedLogs: AuditLog[] = logs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      userId: log.userId,
      userName: `${log.user.firstName} ${log.user.lastName}`,
      timestamp: log.createdAt,
    }));

    return {
      logs: formattedLogs,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }

  /**
   * Initiate plan upgrade (generate Razorpay order)
   */
  static async initiateUpgrade(companyId: string, upgradeData: UpgradeCompanyDto) {
    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: upgradeData.planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Calculate amount based on billing cycle
    const amount = upgradeData.billingCycle === 'YEARLY'
      ? plan.yearlyPrice || plan.monthlyPrice * 12
      : plan.monthlyPrice;

    // Create pending payment record
    const paymentOrder = await prisma.payment.create({
      data: {
        companyId,
        planId: plan.id,
        amount,
        currency: 'INR', // Default for Razorpay
        status: 'PENDING',
        paymentMethod: upgradeData.paymentMethod,
        billingCycle: upgradeData.billingCycle,
        metadata: {
          planName: plan.name,
          upgradeRequestedAt: new Date(),
        },
      },
    });

    // Here you would integrate with Razorpay API
    // For now, return mock order details
    const razorpayOrder = {
      orderId: `order_${Date.now()}`,
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
    };

    return {
      paymentId: paymentOrder.id,
      razorpay: razorpayOrder,
      plan: {
        id: plan.id,
        name: plan.name,
        features: plan.features,
      },
    };
  }

  /**
   * Get billing history for the company
   */
  static async getBillingHistory(companyId: string): Promise<BillingInvoice[]> {
    const payments = await prisma.payment.findMany({
      where: { companyId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      planName: payment.plan.name,
      billingCycle: payment.billingCycle,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
    }));
  }
}