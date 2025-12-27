import { WeeklyRuleType } from '@prisma/client';

export interface WeeklyRuleDto {
    dayOfWeek: number;
    rule: WeeklyRuleType;
}
