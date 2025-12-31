import { Request, Response, NextFunction } from 'express';
import { CompanyService } from './company.service';
import { UpdateCompanyDto, UpgradeCompanyDto } from './company.schema';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Send success response with data
 */
function sendSuccess(res: Response, message: string, data?: any, statusCode: number = 200) {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
}

/**
 * Send error response
 */
function sendError(res: Response, message: string, statusCode: number = 400) {
  res.status(statusCode).json({
    status: 'error',
    message,
  });
}

/**
 * Handle async errors
 */
function catchAsync(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// COMPANY CONTROLLERS
// ============================================================================

/**
 * Get Company Details
 * 
 * @route   GET /api/v1/companies/:companyId
 * @desc    Retrieve company information including plan details and employee count
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
export const getCompany = catchAsync(async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const company = await CompanyService.getCompanyById(companyId);
    sendSuccess(res, 'Company details retrieved successfully', company);
  } catch (error: any) {
    if (error.message === 'Company not found') {
      return sendError(res, 'Company not found', 404);
    }
    throw error;
  }
});

/**
 * Update Company Settings
 * 
 * @route   PATCH /api/v1/companies/:companyId
 * @desc    Update company configuration (timezone, currency, logo, etc.)
 * @access  ORG_ADMIN, SUPER_ADMIN
 */
export const updateCompany = catchAsync(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const updateData: UpdateCompanyDto = req.body;

  try {
    const updatedCompany = await CompanyService.updateCompany(companyId, updateData);
    
    sendSuccess(
      res, 
      'Company settings updated successfully', 
      updatedCompany
    );
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma not found error
      return sendError(res, 'Company not found', 404);
    }
    throw error;
  }
});

/**
 * Get Dashboard Statistics
 * 
 * @route   GET /api/v1/companies/:companyId/dashboard
 * @desc    Retrieve admin dashboard metrics and KPIs
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { date, range } = req.query;

  // Parse date if provided
  let targetDate: Date | undefined;
  if (date && typeof date === 'string') {
    targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }
  }

  try {
    const stats = await CompanyService.getDashboardStats(companyId, targetDate);
    
    sendSuccess(
      res, 
      'Dashboard statistics retrieved successfully', 
      {
        ...stats,
        generatedAt: new Date(),
        dateRange: range || 'TODAY',
      }
    );
  } catch (error: any) {
    if (error.message === 'Company not found') {
      return sendError(res, 'Company not found', 404);
    }
    throw error;
  }
});

/**
 * Get Company Audit Logs
 * 
 * @route   GET /api/v1/companies/:companyId/audit-logs
 * @desc    Retrieve paginated audit trail for compliance and monitoring
 * @access  ORG_ADMIN, SUPER_ADMIN
 */
export const getCompanyAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { 
    page = '1', 
    limit = '20', 
    startDate, 
    endDate, 
    action, 
    userId 
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  // Validate pagination parameters
  if (isNaN(pageNum) || pageNum < 1) {
    return sendError(res, 'Invalid page number', 400);
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return sendError(res, 'Invalid limit (must be between 1-100)', 400);
  }

  try {
    const auditLogs = await CompanyService.getAuditLogs(
      companyId,
      pageNum,
      limitNum,
      {
        startDate: startDate as string,
        endDate: endDate as string,
        action: action as string,
        userId: userId as string,
      }
    );

    sendSuccess(res, 'Audit logs retrieved successfully', auditLogs);
  } catch (error: any) {
    throw error;
  }
});

/**
 * Initiate Plan Upgrade
 * 
 * @route   POST /api/v1/companies/:companyId/billing/upgrade
 * @desc    Generate payment order for plan upgrade (Razorpay integration)
 * @access  ORG_ADMIN, SUPER_ADMIN
 */
export const initiateUpgrade = catchAsync(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const upgradeData: UpgradeCompanyDto = req.body;

  try {
    const paymentOrder = await CompanyService.initiateUpgrade(companyId, upgradeData);
    
    sendSuccess(
      res, 
      'Payment order created successfully', 
      paymentOrder,
      201
    );
  } catch (error: any) {
    if (error.message === 'Plan not found') {
      return sendError(res, 'Selected plan not found', 404);
    }
    throw error;
  }
});

/**
 * Get Billing History
 * 
 * @route   GET /api/v1/companies/:companyId/billing/invoices
 * @desc    Retrieve payment history and invoices for the company
 * @access  ORG_ADMIN, SUPER_ADMIN
 */
export const getBillingHistory = catchAsync(async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const billingHistory = await CompanyService.getBillingHistory(companyId);
    
    sendSuccess(
      res, 
      'Billing history retrieved successfully', 
      {
        invoices: billingHistory,
        totalInvoices: billingHistory.length,
        retrievedAt: new Date(),
      }
    );
  } catch (error: any) {
    throw error;
  }
});