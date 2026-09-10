export interface SalaryStructureInput {
  annualCtc: number;
  basicPercentage?: number; // default 50%
  hraPercentage?: number; // default 40% of basic
  variableAnnual?: number;
  includePf?: boolean; // default true
  pfCappedAtStatutory?: boolean; // default false (actual 12% of basic)
  includeGratuity?: boolean; // default true
}

export interface SalaryStructureBreakdown {
  annualCtc: number;
  monthlyCtc: number;
  annualGross: number;
  monthlyGross: number;
  components: {
    basic: { monthly: number; annual: number };
    hra: { monthly: number; annual: number };
    specialAllowance: { monthly: number; annual: number };
    variablePay: { monthly: number; annual: number };
    employerPf: { monthly: number; annual: number };
    gratuity: { monthly: number; annual: number };
  };
}

export function calculateIndianCtc(input: SalaryStructureInput): SalaryStructureBreakdown {
  const annualCtc = Math.round(input.annualCtc);
  const basicPct = (input.basicPercentage ?? 50) / 100;
  const hraPct = (input.hraPercentage ?? 40) / 100;
  const variableAnnual = Math.round(input.variableAnnual ?? 0);
  const includePf = input.includePf ?? true;
  const pfCapped = input.pfCappedAtStatutory ?? false;
  const includeGratuity = input.includeGratuity ?? true;

  // Fixed portion before retiral contributions
  // Preliminary basic is based on (CTC - Variable)
  const basePool = Math.max(0, annualCtc - variableAnnual);
  const annualBasic = Math.round(basePool * basicPct);
  const monthlyBasic = Math.round(annualBasic / 12);

  const annualHra = Math.round(annualBasic * hraPct);
  const monthlyHra = Math.round(annualHra / 12);

  // PF: 12% of Basic
  let monthlyPf = 0;
  if (includePf) {
    if (pfCapped) {
      monthlyPf = Math.min(1800, Math.round(monthlyBasic * 0.12));
    } else {
      monthlyPf = Math.round(monthlyBasic * 0.12);
    }
  }
  const annualPf = monthlyPf * 12;

  // Gratuity: ~4.81% of Basic = (15/26)/12 * basic per month -> (15/26) * monthlyBasic per year
  let annualGratuity = 0;
  if (includeGratuity) {
    annualGratuity = Math.round((15 / 26) * monthlyBasic);
  }
  const monthlyGratuity = Math.round(annualGratuity / 12);

  // Retirals sum
  const annualRetirals = annualPf + annualGratuity;

  // Special allowance is the balancing figure so that:
  // annualBasic + annualHra + annualSpecial + annualRetirals + variableAnnual = annualCtc
  const accounted = annualBasic + annualHra + annualRetirals + variableAnnual;
  const annualSpecial = Math.max(0, annualCtc - accounted);
  const monthlySpecial = Math.round(annualSpecial / 12);

  const annualGross = annualBasic + annualHra + annualSpecial;
  const monthlyGross = monthlyBasic + monthlyHra + monthlySpecial;

  return {
    annualCtc,
    monthlyCtc: Math.round(annualCtc / 12),
    annualGross,
    monthlyGross,
    components: {
      basic: { monthly: monthlyBasic, annual: annualBasic },
      hra: { monthly: monthlyHra, annual: annualHra },
      specialAllowance: { monthly: monthlySpecial, annual: annualSpecial },
      variablePay: { monthly: Math.round(variableAnnual / 12), annual: variableAnnual },
      employerPf: { monthly: monthlyPf, annual: annualPf },
      gratuity: { monthly: monthlyGratuity, annual: annualGratuity },
    },
  };
}

export function validateSalaryComponents(
  annualCtc: number,
  components: {
    basicAnnual: number;
    hraAnnual: number;
    specialAllowanceAnnual: number;
    variableAnnual: number;
    employerPfAnnual: number;
    gratuityAnnual: number;
  }
): { isValid: boolean; difference: number } {
  const sum =
    components.basicAnnual +
    components.hraAnnual +
    components.specialAllowanceAnnual +
    components.variableAnnual +
    components.employerPfAnnual +
    components.gratuityAnnual;

  const diff = Math.abs(sum - annualCtc);
  return {
    isValid: diff <= 12, // Allow small rounding differences within Rs 12
    difference: diff,
  };
}
