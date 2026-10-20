// One response for the dashboard page: KPIs, the 6-month chart, NG by supplier,
// recent inspections and (role-dependent) the waiting / drafts lists.

const dashboardRepository = require('../repositories/dashboard.repository');
const { CHECK_ROLES } = require('../constants/auth');

const PERIODS = new Set(['month', '90d', 'quarter', 'year']);

async function stats(user, period = 'month') {
  if (!PERIODS.has(period)) period = 'month';
  const [kpis, chart, bySupplier, recent, waiting, drafts] = await Promise.all([
    dashboardRepository.kpis(period),
    dashboardRepository.monthly(6),
    dashboardRepository.ngBySupplier(period),
    dashboardRepository.recent(5),
    dashboardRepository.waiting(5),
    dashboardRepository.drafts(user.userid, 5),
  ]);
  return {
    kpis,
    chart,
    bySupplier,
    recent,
    // "Waiting for your check" only makes sense to the roles that can sign off
    // an inspection; the others see an empty list so the card hides itself.
    waiting: CHECK_ROLES.includes(user.role) ? waiting : [],
    drafts,
  };
}

module.exports = { stats };
