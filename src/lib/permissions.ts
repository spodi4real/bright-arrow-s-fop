import type { Role, User } from '@prisma/client';

export type Action =
  // Missions
  | 'mission.create'
  | 'mission.view.all'
  | 'mission.view.assignedOnly'
  | 'mission.start'
  | 'mission.endDay'
  | 'mission.endMission'
  | 'mission.invite'
  | 'mission.export'
  // Violations
  | 'violation.create'
  | 'violation.view'
  // Targets
  | 'target.manage'
  | 'target.view.allUsers'
  | 'target.view.self'
  // KPIs / bonus
  | 'kpi.viewAll'
  | 'kpi.viewSelf'
  | 'bonus.viewAll'
  // Financial
  | 'expense.create'
  | 'expense.viewAll'
  | 'expense.viewSelf'
  | 'expense.approve'
  | 'pocketMoney.issue'
  | 'pocketMoney.viewAll'
  | 'pocketMoney.viewSelf'
  | 'exchangeRate.edit'
  // Agenda
  | 'agenda.view.all'
  | 'agenda.view.self'
  | 'agenda.manageEvents'
  | 'agenda.manageHolidays'
  // Files
  | 'files.viewAll'
  | 'files.viewScoped'
  | 'files.viewExpensesOnly'
  | 'files.uploadGeneral'
  | 'files.delete'
  // Users
  | 'user.manage'
  // Reports
  | 'reports.admin'
  | 'reports.mission'
  | 'reports.financial';

const matrix: Record<Role, Action[]> = {
  admin: [
    'mission.create',
    'mission.view.all',
    'mission.start',
    'mission.endDay',
    'mission.endMission',
    'mission.invite',
    'mission.export',
    'violation.create',
    'violation.view',
    'target.manage',
    'target.view.allUsers',
    'kpi.viewAll',
    'kpi.viewSelf',
    'bonus.viewAll',
    'expense.create',
    'expense.viewAll',
    'expense.viewSelf',
    'expense.approve',
    'pocketMoney.issue',
    'pocketMoney.viewAll',
    'pocketMoney.viewSelf',
    'exchangeRate.edit',
    'agenda.view.all',
    'agenda.manageEvents',
    'agenda.manageHolidays',
    'files.viewAll',
    'files.uploadGeneral',
    'files.delete',
    'user.manage',
    'reports.admin',
    'reports.mission',
    'reports.financial',
  ],
  supervisor: [
    'mission.create',
    'mission.view.all',
    'mission.start',
    'mission.endDay',
    'mission.endMission',
    'mission.invite',
    'mission.export',
    'violation.create',
    'violation.view',
    'kpi.viewAll',
    'kpi.viewSelf',
    'bonus.viewAll',
    'agenda.view.all',
    'agenda.manageEvents',
    'files.viewAll',
    'files.uploadGeneral',
    'reports.mission',
  ],
  iskra: [
    'mission.create',
    'mission.view.all',
    'mission.start',
    'mission.endDay',
    'mission.endMission',
    'mission.invite',
    'mission.export',
    'violation.create',
    'agenda.view.self',
    'files.viewAll',
    'files.uploadGeneral',
    'reports.mission',
  ],
  accountant: [
    'expense.viewAll',
    'expense.approve',
    'pocketMoney.issue',
    'pocketMoney.viewAll',
    'exchangeRate.edit',
    'agenda.view.self', // only holidays/reference - filtered in queries
    'files.viewExpensesOnly',
    'reports.financial',
  ],
  engineer: [
    'mission.create',
    'mission.view.assignedOnly',
    'mission.start',
    'mission.endDay',
    'mission.endMission',
    'mission.invite',
    'mission.export',
    'violation.create',
    'target.view.self',
    'kpi.viewSelf',
    'expense.create',
    'expense.viewSelf',
    'pocketMoney.viewSelf',
    'agenda.view.self',
    'files.viewScoped',
    'reports.mission',
  ],
};

export function can(user: Pick<User, 'role'> | null | undefined, action: Action): boolean {
  if (!user) return false;
  return matrix[user.role]?.includes(action) ?? false;
}

export function canAny(user: Pick<User, 'role'> | null | undefined, ...actions: Action[]): boolean {
  return actions.some((a) => can(user, a));
}

export function rolesAllowed(action: Action): Role[] {
  return (Object.keys(matrix) as Role[]).filter((r) => matrix[r].includes(action));
}
