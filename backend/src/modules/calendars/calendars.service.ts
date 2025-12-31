import { prisma } from '@/utils/prisma';
import { 
  CreateCalendarRequestDto, 
  UpdateCalendarRequestDto,
  CreateWeeklyRuleRequestDto,
  UpdateWeeklyRuleRequestDto,
  CreateHolidayRequestDto,
  UpdateHolidayRequestDto,
  CalendarResponseDto,
  CalendarDetailsResponseDto,
  WeeklyRuleResponseDto,
  HolidayResponseDto
} from './calendars.schema';

// ============================================================================
// CALENDAR SERVICE
// ============================================================================

export class CalendarService {
  /**
   * Get all calendars for a company with pagination and search
   */
  static async getCalendars(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    nameFilter?: string
  ) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      companyId,
    };

    if (nameFilter) {
      whereClause.name = {
        contains: nameFilter,
        mode: 'insensitive',
      };
    }

    const [calendars, total] = await Promise.all([
      prisma.calendar.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { employees: true },
          },
        },
      }),
      prisma.calendar.count({ where: whereClause }),
    ]);

    return {
      calendars: calendars.map((calendar): CalendarResponseDto => ({
        id: calendar.id,
        companyId: calendar.companyId,
        name: calendar.name,
        dayStartTime: calendar.dayStartTime,
        dayEndTime: calendar.dayEndTime,
        employeeCount: calendar._count.employees,
      })),
      total,
    };
  }

  /**
   * Get calendar by ID with full details
   */
  static async getCalendarById(calendarId: string, companyId: string): Promise<CalendarDetailsResponseDto> {
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
      include: {
        weeklyRules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        holidays: {
          orderBy: { date: 'asc' },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!calendar) {
      throw new Error('Calendar not found');
    }

    if (calendar.companyId !== companyId) {
      throw new Error('Access denied');
    }

    return {
      id: calendar.id,
      companyId: calendar.companyId,
      name: calendar.name,
      dayStartTime: calendar.dayStartTime,
      dayEndTime: calendar.dayEndTime,
      weeklyRules: calendar.weeklyRules.map((rule): WeeklyRuleResponseDto => ({
        id: rule.id,
        calendarId: rule.calendarId,
        dayOfWeek: rule.dayOfWeek,
        type: rule.type,
        strategy: rule.strategy,
        interval: rule.interval || undefined,
        referenceDate: rule.referenceDate || undefined,
        positions: rule.positions.length > 0 ? rule.positions : undefined,
      })),
      holidays: calendar.holidays.map((holiday): HolidayResponseDto => ({
        id: holiday.id,
        calendarId: holiday.calendarId,
        date: holiday.date,
        name: holiday.name,
        isOptional: holiday.isOptional,
      })),
      employeeCount: calendar._count.employees,
    };
  }

  /**
   * Create a new calendar
   */
  static async createCalendar(
    companyId: string, 
    createData: CreateCalendarRequestDto
  ): Promise<CalendarResponseDto> {
    // Check if calendar name already exists in company
    const existingCalendar = await prisma.calendar.findFirst({
      where: {
        companyId,
        name: createData.name,
      },
    });

    if (existingCalendar) {
      throw new Error('Calendar with this name already exists');
    }

    const calendar = await prisma.calendar.create({
      data: {
        companyId,
        name: createData.name,
        dayStartTime: createData.dayStartTime,
        dayEndTime: createData.dayEndTime,
      },
    });

    return {
      id: calendar.id,
      companyId: calendar.companyId,
      name: calendar.name,
      dayStartTime: calendar.dayStartTime,
      dayEndTime: calendar.dayEndTime,
      employeeCount: 0,
    };
  }

  /**
   * Update an existing calendar
   */
  static async updateCalendar(
    calendarId: string,
    companyId: string,
    updateData: UpdateCalendarRequestDto
  ): Promise<CalendarResponseDto> {
    // Verify calendar exists and belongs to company
    const existingCalendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!existingCalendar) {
      throw new Error('Calendar not found');
    }

    if (existingCalendar.companyId !== companyId) {
      throw new Error('Access denied');
    }

    // Check if new name conflicts
    if (updateData.name && updateData.name !== existingCalendar.name) {
      const nameConflict = await prisma.calendar.findFirst({
        where: {
          companyId,
          name: updateData.name,
          id: { not: calendarId },
        },
      });

      if (nameConflict) {
        throw new Error('Calendar with this name already exists');
      }
    }

    const updatedCalendar = await prisma.calendar.update({
      where: { id: calendarId },
      data: updateData,
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    return {
      id: updatedCalendar.id,
      companyId: updatedCalendar.companyId,
      name: updatedCalendar.name,
      dayStartTime: updatedCalendar.dayStartTime,
      dayEndTime: updatedCalendar.dayEndTime,
      employeeCount: updatedCalendar._count.employees,
    };
  }

  /**
   * Delete a calendar
   */
  static async deleteCalendar(calendarId: string, companyId: string): Promise<void> {
    // Verify calendar exists and belongs to company
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!calendar) {
      throw new Error('Calendar not found');
    }

    if (calendar.companyId !== companyId) {
      throw new Error('Access denied');
    }

    // Check if calendar is assigned to any employees
    const employeeCount = await prisma.employee.count({
      where: { calendarId },
    });

    if (employeeCount > 0) {
      throw new Error('Cannot delete calendar that is assigned to employees');
    }

    await prisma.calendar.delete({
      where: { id: calendarId },
    });
  }

  /**
   * Get weekly rules for a calendar
   */
  static async getWeeklyRules(calendarId: string, companyId: string) {
    // Validate calendar access
    await this.validateCalendarAccess(calendarId, companyId);

    const rules = await prisma.calendarWeeklyRule.findMany({
      where: { calendarId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return {
      rules: rules.map((rule): WeeklyRuleResponseDto => ({
        id: rule.id,
        calendarId: rule.calendarId,
        dayOfWeek: rule.dayOfWeek,
        type: rule.type,
        strategy: rule.strategy,
        interval: rule.interval || undefined,
        referenceDate: rule.referenceDate || undefined,
        positions: rule.positions.length > 0 ? rule.positions : undefined,
      })),
      total: rules.length,
    };
  }

  /**
   * Create a weekly rule for a calendar
   */
  static async createWeeklyRule(
    calendarId: string,
    companyId: string,
    createData: CreateWeeklyRuleRequestDto
  ): Promise<WeeklyRuleResponseDto> {
    // Validate calendar access
    await this.validateCalendarAccess(calendarId, companyId);

    // Check for existing rule with same dayOfWeek
    const existingRule = await prisma.calendarWeeklyRule.findFirst({
      where: {
        calendarId,
        dayOfWeek: createData.dayOfWeek,
        type: createData.type,
        strategy: createData.strategy,
      },
    });

    if (existingRule) {
      throw new Error('A rule with the same configuration already exists for this day');
    }

    const rule = await prisma.calendarWeeklyRule.create({
      data: {
        calendarId,
        dayOfWeek: createData.dayOfWeek,
        type: createData.type,
        strategy: createData.strategy,
        interval: createData.interval,
        referenceDate: createData.referenceDate ? new Date(createData.referenceDate) : null,
        positions: createData.positions || [],
      },
    });

    return {
      id: rule.id,
      calendarId: rule.calendarId,
      dayOfWeek: rule.dayOfWeek,
      type: rule.type,
      strategy: rule.strategy,
      interval: rule.interval || undefined,
      referenceDate: rule.referenceDate || undefined,
      positions: rule.positions.length > 0 ? rule.positions : undefined,
    };
  }

  /**
   * Update a weekly rule
   */
  static async updateWeeklyRule(
    ruleId: string,
    calendarId: string,
    companyId: string,
    updateData: UpdateWeeklyRuleRequestDto
  ): Promise<WeeklyRuleResponseDto> {
    // Validate calendar access
    await this.validateCalendarAccess(calendarId, companyId);

    // Verify rule exists and belongs to calendar
    const existingRule = await prisma.calendarWeeklyRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule || existingRule.calendarId !== calendarId) {
      throw new Error('Weekly rule not found');
    }

    const rule = await prisma.calendarWeeklyRule.update({
      where: { id: ruleId },
      data: {
        ...updateData,
        referenceDate: updateData.referenceDate ? new Date(updateData.referenceDate) : undefined,
      },
    });

    return {
      id: rule.id,
      calendarId: rule.calendarId,
      dayOfWeek: rule.dayOfWeek,
      type: rule.type,
      strategy: rule.strategy,
      interval: rule.interval || undefined,
      referenceDate: rule.referenceDate || undefined,
      positions: rule.positions.length > 0 ? rule.positions : undefined,
    };
  }

  /**
   * Delete a weekly rule
   */
  static async deleteWeeklyRule(ruleId: string, calendarId: string, companyId: string): Promise<void> {
    // Validate calendar access
    await this.validateCalendarAccess(calendarId, companyId);

    // Verify rule exists and belongs to calendar
    const existingRule = await prisma.calendarWeeklyRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule || existingRule.calendarId !== calendarId) {
      throw new Error('Weekly rule not found');
    }

    await prisma.calendarWeeklyRule.delete({
      where: { id: ruleId },
    });
  }

  /**
   * Get holidays for a calendar
   */
  static async getHolidays(calendarId: string, companyId: string, year?: number) {
    // Validate calendar access
    await this.validateCalendarAccess(calendarId, companyId);

    const whereClause: any = { calendarId };

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      whereClause.date = {
        gte: startOfYear,
        lt: endOfYear,
      };
    }

    const holidays = await prisma.calendarHoliday.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    return {
      holidays: holidays.map((holiday): HolidayResponseDto => ({
        id: holiday.id,
        calendarId: holiday.calendarId,
        date: holiday.date,
        name: holiday.name,
        isOptional: holiday.isOptional,
      })),
      total: holidays.length,
    };
  }

  /**
   * Create a holiday for a calendar
   */
  static async createHoliday(
    calendarId: string,
    companyId: string,
    createData: CreateHolidayRequestDto
  ): Promise<HolidayResponseDto> {
    // Validate calendar access
    await this.validateCalendarAccess(calendarId, companyId);

    const holidayDate = new Date(createData.date);

    // Check if holiday already exists for this date
    const existingHoliday = await prisma.calendarHoliday.findUnique({
      where: {
        calendarId_date: {
          calendarId,
          date: holidayDate,
        },
      },
    });

    if (existingHoliday) {
      throw new Error('Holiday already exists for this date');
    }

    const holiday = await prisma.calendarHoliday.create({
      data: {
        calendarId,
        date: holidayDate,
        name: createData.name,
        isOptional: createData.isOptional || false,
      },
    });

    return {
      id: holiday.id,
      calendarId: holiday.calendarId,
      date: holiday.date,
      name: holiday.name,
      isOptional: holiday.isOptional,
    };
  }

  /**
   * Update a holiday
   */
  static async updateHoliday(
    holidayId: string,
    calendarId: string,
    companyId: string,
    updateData: UpdateHolidayRequestDto
  ): Promise<HolidayResponseDto> {
    // Validate calendar access
    await this.validateCalendarAccess(calendarId, companyId);

    // Verify holiday exists and belongs to calendar
    const existingHoliday = await prisma.calendarHoliday.findUnique({
      where: { id: holidayId },
    });

    if (!existingHoliday || existingHoliday.calendarId !== calendarId) {
      throw new Error('Holiday not found');
    }

    const holiday = await prisma.calendarHoliday.update({
      where: { id: holidayId },
      data: updateData,
    });

    return {
      id: holiday.id,
      calendarId: holiday.calendarId,
      date: holiday.date,
      name: holiday.name,
      isOptional: holiday.isOptional,
    };
  }

  /**
   * Delete a holiday
   */
  static async deleteHoliday(holidayId: string, calendarId: string, companyId: string): Promise<void> {
    // Validate calendar access
    await this.validateCalendarAccess(calendarId, companyId);

    // Verify holiday exists and belongs to calendar
    const existingHoliday = await prisma.calendarHoliday.findUnique({
      where: { id: holidayId },
    });

    if (!existingHoliday || existingHoliday.calendarId !== calendarId) {
      throw new Error('Holiday not found');
    }

    await prisma.calendarHoliday.delete({
      where: { id: holidayId },
    });
  }

  /**
   * Validate calendar access for the given company
   */
  private static async validateCalendarAccess(calendarId: string, companyId: string): Promise<void> {
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!calendar) {
      throw new Error('Calendar not found');
    }

    if (calendar.companyId !== companyId) {
      throw new Error('Access denied');
    }
  }
}