
import { Member, ChitGroup } from './types';

/**
 * Strips all non-digit characters and extracts only the last 10 digits.
 */
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
};

/**
 * Generates an Official WhatsApp API Link.
 * Using api.whatsapp.com/send is more robust for Android WebViews (APKs) 
 * as it avoids the immediate redirect to the whatsapp:// protocol.
 */
export const getWhatsAppUrl = (phone: string, message: string): string => {
  const cleaned = cleanPhoneNumber(phone);
  const finalPhone = `91${cleaned}`;
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`;
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

  return `*GTS CHITS - PAYMENT DUE*\n\n` +
    `Dear *${member.name}*,\n\n` +
    `Your installment for *Month ${month}* is pending.\n\n` +
    `*Group:* ${group.name}\n` +
    `*Amount:* ₹${amount.toLocaleString()}\n` +
    `*Due Date:* ${formattedDueDate}\n\n` +
    `Please settle via UPI or Cash.\n\n` +
    `Thank you,\n` +
    `*GTS CHITS*`;
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
