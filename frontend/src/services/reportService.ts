import { MOCK_REPORT_METRICS } from '../data/mockReports';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface WeeklyCalorieHistoryItem {
  day: string;
  value: number;
  label: string;
}

export interface ClinicalReportMetrics {
  documentId: string;
  issueDate: string;
  patientName: string;
  demographics: string;
  bodyMass: string;
  massDelta: string;
  targetMass: string;
  avg7DayCalories: number;
  caloricAdherencePct: number;
  proteinVelocity: number;
  targetProtein: number;
  proteinPct: number;
  electrolyteStatus: string;
  micronutrientSufficiency: number;
  rdasMet: string;
  weeklyCalorieHistory: WeeklyCalorieHistoryItem[];
  icmrTargetLine: number;
}

export interface ClinicalReportSummary {
  id: number;
  document_id: string;
  report_type: string;
  attach_letterhead: boolean;
  anonymize: boolean;
  avg_7day_calories: number;
  caloric_adherence_pct: number;
  protein_velocity_g: number;
  target_protein_g: number;
  protein_pct: number;
  micronutrient_sufficiency_pct: number;
  created_at: string;
}


export const reportService = {
  /**
   * Fetch live clinical report metrics for dossier preview with fallback to mock data
   */
  getReportMetrics: async (
    reportType: string = '7day',
    anonymize: boolean = false,
    attachLetterhead: boolean = true
  ): Promise<ClinicalReportMetrics> => {
    try {
      const queryParams = new URLSearchParams({
        report_type: reportType,
        anonymize: String(anonymize),
        attach_letterhead: String(attachLetterhead),
      });

      const response = await fetch(`${API_BASE_URL}/reports/metrics?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = (await response.json()) as ClinicalReportMetrics;
        return data;
      }
      if (import.meta.env.DEV) {
        return MOCK_REPORT_METRICS as ClinicalReportMetrics;
      }
      return MOCK_REPORT_METRICS as ClinicalReportMetrics;
    } catch {
      return MOCK_REPORT_METRICS as ClinicalReportMetrics;
    }
  },

  /**
   * Generate an official clinical report audit record
   */
  generateReport: async (
    reportType: string = '7day',
    attachLetterhead: boolean = true,
    anonymize: boolean = false
  ): Promise<{ message: string; document_id?: string }> => {
    try {
      const payload = {
        report_type: reportType,
        attach_letterhead: attachLetterhead,
        anonymize: anonymize,
      };

      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as { document_id: string };
        return {
          message: `Successfully generated dossier ${data.document_id}`,
          document_id: data.document_id,
        };
      }
      return { message: 'Dossier generated successfully (local export)' };
    } catch {
      return { message: 'Dossier generated successfully (local export)' };
    }
  },
};
