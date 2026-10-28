/**
 * Fonte única de verdade para os cálculos financeiros do Nail Flow.
 *
 * Regra de lucro por atendimento:
 *   lucro = preço final cobrado - custo dos produtos consumidos
 *
 * O custo vem de `products_used` (quantidade x custo unitário do produto).
 * Quando o consumo não foi registrado, assume-se custo zero — nesse caso o
 * lucro é o próprio valor cobrado.
 * Quando existe consumo registrado mas o custo unitário do produto é
 * desconhecido, o lucro é tratado como DESCONHECIDO (null) e não entra na soma.
 * Nenhum valor é inventado ou estimado por percentual.
 */

export function computeAppointmentProfit(appointment, productsById = {}) {
  const price = Number(appointment?.final_price);
  if (!Number.isFinite(price)) return null;

  const used = Array.isArray(appointment?.products_used) ? appointment.products_used : [];
  if (used.length === 0) return price;

  let cost = 0;
  for (const item of used) {
    const product = productsById[item?.product_id];
    const unitCost = Number(product?.cost_unit);
    if (!Number.isFinite(unitCost)) return null;
    const qty = Number(item?.qty ?? item?.quantity) || 0;
    cost += unitCost * qty;
  }

  return price - cost;
}

/**
 * Consolida uma lista de atendimentos concluídos.
 * `profitComplete` indica se TODOS os atendimentos tinham custo conhecido —
 * a interface deve sinalizar quando o lucro é parcial.
 */
export function summarizeAppointments(appointments = [], productsById = {}) {
  let revenue = 0;
  let profit = 0;
  let knownProfitCount = 0;

  for (const appointment of appointments) {
    revenue += Number(appointment?.final_price) || 0;
    const value = computeAppointmentProfit(appointment, productsById);
    if (value !== null) {
      profit += value;
      knownProfitCount += 1;
    }
  }

  const total = appointments.length;

  return {
    revenue,
    profit,
    total,
    profitComplete: total === 0 || knownProfitCount === total,
  };
}