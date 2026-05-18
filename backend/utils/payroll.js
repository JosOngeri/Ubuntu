// Payroll calculation utilities

function calculateDailyRate(baseSalary, workingDays) {
  if (!baseSalary || !workingDays) return 0;
  return baseSalary / workingDays;
}

function calculateOvertime(hours, rate, multiplier = 1.5) {
  if (!hours || !rate) return 0;
  return hours * rate * multiplier;
}

function calculateExtraTime(hours, rate, multiplier = 2) {
  if (!hours || !rate) return 0;
  return hours * rate * multiplier;
}

function calculateKpiRaise(base, kpiAchieved, kpiTarget, raisePercent = 0.1) {
  if (!base || !kpiAchieved || !kpiTarget) return 0;
  return kpiAchieved > kpiTarget ? base * raisePercent : 0;
}

module.exports = {
  calculateDailyRate,
  calculateOvertime,
  calculateExtraTime,
  calculateKpiRaise
};
