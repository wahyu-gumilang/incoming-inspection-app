const db = require('../config/db');
const AppError = require('../utils/app-error');
const aqlRepository = require('../repositories/aql.repository');
const { findPlanRow, rowProblems } = require('./aql');
const { INSPECT_CATEGORY } = require('../constants/inspection');

const CATEGORY_NAME = {
  [INSPECT_CATEGORY.NORMAL]: 'Normal',
  [INSPECT_CATEGORY.REDUCE]: 'Reduced',
  [INSPECT_CATEGORY.TIGHTENING]: 'Tightened',
};

const planNotFound = (planid) => new AppError(404, 'NOT_FOUND', `AQL plan ${planid} not found`);

async function listPlans() {
  const plans = await aqlRepository.listPlans();
  return Promise.all(
    plans.map(async (plan) => {
      const rows = await aqlRepository.rows(plan.planid);
      // Which categories the plan covers, so the UI can grey out the others.
      return { ...plan, categories: [...new Set(rows.map((r) => r.inspectcategory))] };
    }),
  );
}

async function getPlan(planid) {
  const plan = await aqlRepository.findPlan(planid);
  if (!plan) throw planNotFound(planid);
  return { ...plan, rows: await aqlRepository.rows(planid) };
}

// The plan new inspections use, with its rows.
async function defaultPlan() {
  const plan = await aqlRepository.findDefaultPlan();
  if (!plan) throw new AppError(422, 'BUSINESS_RULE', 'No default AQL plan is set');
  return { ...plan, rows: await aqlRepository.rows(plan.planid) };
}

// Sample size, Ac and Re for one delivery. planId defaults to the default plan.
async function lookup({ lot, category, planId }) {
  const plan = planId ? await getPlan(planId) : await defaultPlan();
  const row = findPlanRow(plan.rows, lot, category);
  if (!row) {
    throw new AppError(
      422,
      'BUSINESS_RULE',
      `AQL plan "${plan.name}" has no ${CATEGORY_NAME[category]} rows`,
      [{ field: 'category', message: 'is not covered by this plan' }],
    );
  }
  return { planid: plan.planid, lot, inspectcategory: category, ...row };
}

// Replaces one category's rows in one transaction. Saved inspections keep their own snapshot.
async function replaceRows(planid, category, rows) {
  if (!(await aqlRepository.findPlan(planid))) throw planNotFound(planid);
  const problems = rowProblems(rows);
  if (problems.length)
    throw new AppError(422, 'BUSINESS_RULE', 'The AQL rows are not consistent', problems);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await aqlRepository.replaceRows(planid, category, rows, conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return getPlan(planid);
}

async function setDefault(planid) {
  if (!(await aqlRepository.findPlan(planid))) throw planNotFound(planid);
  await aqlRepository.setDefault(planid);
  return getPlan(planid);
}

module.exports = { listPlans, getPlan, defaultPlan, lookup, replaceRows, setDefault };
