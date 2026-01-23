
import { Member, ChitGroup } from './types';

/**
 * Strips all non-digit characters and extracts only the last 10 digits.
 */
export const cleanPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
};

/**
 * Generates a direct WhatsApp link with the 91 prefix and no '+' symbol.
 */
export const getWhatsAppUrl = (phone: string, message: string): string => {
  const cleaned = cleanPhoneNumber(phone);
  const finalPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Calculates the expected monthly installment based on pre-defined master entry.
 * From the NEXT month of winning, the member pays the prized installment.
 */
export const calculateExpectedAmount = (
  group: ChitGroup, 
  member: Member, 
  targetMonth: number
): number => {
  if (!group || !member) return 0;
  
  // Rule: If member won in Month 5, they pay regular in Month 5, and Prized from Month 6 onwards.
  if (member.isPrized && member.prizedMonth !== undefined && targetMonth > member.prizedMonth) {
    return group.prizedInstallment;
  }
  
  return group.regularInstallment;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const calculateChitEndDate = (startDate: string, months: number): string => {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months - 1);
  return date.toISOString().split('T')[0];
};

export const getCurrentChitMonth = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  return Math.max(1, diffMonths);
};

export const getReminderDate = (startDate: string, monthNumber: number): string => {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + monthNumber - 1);
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const generateReminderMessage = (member: Member, group: ChitGroup, month: number, amount: number): string => {
  const dueDate = new Date(group.startDate);
  dueDate.setMonth(dueDate.getMonth() + month - 1);
  const formattedDueDate = dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return `*GTS CHITS - PAYMENT REMINDER*\n\nDear *${member.name}*,\n\nMonthly chit payment for Month ${month} is due.\n\n*Group:* ${group.name}\n*Amount:* ₹${amount.toLocaleString()}\n*Due Date:* ${formattedDueDate}\n\nKindly ignore if already paid.\n\nThank you,\n*GTS CHITS*`;
};

export const generateForecastMessage = (member: Member, group: ChitGroup, currentMonth: number): string => {
  let forecastStr = `*GTS CHITS - 3 MONTH FORECAST*\n\nSubscriber: *${member.name}*\nGroup: ${group.name}\n\n*Upcoming Installments:*`;
  
  for (let i = 1; i <= 3; i++) {
    const nextMonth = currentMonth + i;
    if (nextMonth <= group.totalMonths) {
      const amount = calculateExpectedAmount(group, member, nextMonth);
      forecastStr += `\nMonth ${nextMonth}: ₹${amount.toLocaleString()}`;
    }
  }
  
  forecastStr += `\n\n_Note: Forecast is based on current prize allotment status._\n\n*GTS CHITS*`;
  return forecastStr;
};
