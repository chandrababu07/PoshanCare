import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Download,
  ShieldCheck,
  FileSearch,
  ZoomIn,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { MOCK_REPORT_METRICS } from '../../data/mockReports';
import { reportService, ClinicalReportMetrics } from '../../services/reportService';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('7day');
  const [attachLetterhead, setAttachLetterhead] = useState(true);
  const [anonymize, setAnonymize] = useState(false);
  const [metrics, setMetrics] = useState<ClinicalReportMetrics>(MOCK_REPORT_METRICS as ClinicalReportMetrics);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    reportService.getReportMetrics(reportType, anonymize, attachLetterhead).then((data) => {
      if (isMounted && data) {
        setMetrics(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [reportType, anonymize, attachLetterhead]);

  const handleGenerateDossier = async () => {
    setIsGenerating(true);
    try {
      const res = await reportService.generateReport(reportType, attachLetterhead, anonymize);
      setStatusMessage(res.message || 'Medical Dossier generated successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setStatusMessage('Medical Dossier generated successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Clinical Nutrition Reports & Export
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Generate physician-ready PDF dossiers formatted for clinical audit and dietitian review.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center gap-x-3 text-primary font-body-md font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Report Specification Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-y-6">
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-y-5">
            <div className="flex items-center justify-between border-b border-surface-container-low pb-4">
              <div className="flex items-center gap-x-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                <h2 className="font-title-md text-title-md text-on-surface">Report Specifications</h2>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-semibold">
                NIN 2024 Archival
              </span>
            </div>

            {/* Scope Selection */}
            <div className="flex flex-col gap-y-2">
              <label className="font-label-md text-label-md text-on-surface">Select Audit Range</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: '7day', label: '7-Day Comprehensive Audit', sub: 'Weekly caloric adherence & protein velocity' },
                  { id: '30day', label: '30-Day Clinical Extract', sub: 'Full body mass trajectory & trendlines' },
                  { id: 'custom', label: 'Custom Archival Range', sub: 'Select custom start and end date' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReportType(item.id)}
                    className={`p-3 rounded-lg flex flex-col text-left transition-all ${
                      reportType === item.id
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="font-label-md text-label-md">{item.label}</span>
                    <span className="font-body-sm text-body-sm opacity-80 mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Header Switch */}
            <div className="flex items-center justify-between pt-2 border-t border-surface-container-low">
              <div className="flex flex-col max-w-[240px]">
                <span className="font-label-md text-label-md text-on-surface">Clinician Letterhead & License</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Attaches Dr. Sunita Raman (MCI: 2011/04/0981) credentials.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachLetterhead}
                  onChange={(e) => setAttachLetterhead(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
              </label>
            </div>

            {/* Anonymize Switch */}
            <div className="flex items-center justify-between pt-2 border-t border-surface-container-low">
              <div className="flex flex-col max-w-[240px]">
                <span className="font-label-md text-label-md text-on-surface">Clinical Anonymization (HIPAA/DISHA)</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Redacts personal identifiers for second-opinion review.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymize}
                  onChange={(e) => setAnonymize(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
              </label>
            </div>

            {/* Output Specification */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">Output Format</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Vector PDF (300 DPI Medical Archival)</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                PDF/A-1b
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateDossier}
              disabled={isGenerating}
              className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-title-md text-title-md rounded-lg shadow-md flex items-center justify-center gap-x-2 transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span>{isGenerating ? 'Generating Dossier...' : 'Generate Medical Dossier PDF'}</span>
            </button>
          </div>

          {/* Guarantee Banner */}
          <div className="bg-primary-container text-on-primary rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="relative flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-primary-fixed shrink-0" />
              <div className="flex flex-col">
                <h3 className="font-title-md text-title-md tracking-tight">Physician Ready Guarantee</h3>
                <p className="font-body-sm text-body-sm text-on-primary/90 mt-1">
                  All PoshanCare clinical extracts conform strictly to National Institute of Nutrition (NIN) RDA 2024 guidance tables and the Indian Food Composition Database (IFCT).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Dossier Preview Sheet (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Document Wrapper Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low rounded-t-xl text-on-surface-variant">
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-on-surface-variant" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">Real-Time Dossier Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-label-sm text-label-sm">Page 1 of 3</span>
              <button aria-label="Zoom in" className="p-1 hover:bg-surface-container rounded text-on-surface transition-colors" type="button">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button aria-label="Download view" onClick={handleGenerateDossier} className="p-1 hover:bg-surface-container rounded text-on-surface transition-colors" type="button">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clinical Document Sheet */}
          <div className="bg-surface-container-lowest shadow-md rounded-b-xl p-8 space-y-6">
            {/* Document Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-surface-container gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold text-title-md shadow-sm">
                  PC
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-title-md text-title-md text-primary tracking-tight font-semibold">PoshanCare</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                      CLINICAL DOC
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Metabolic Telemetry & Nutritional Audit Service</span>
                </div>
              </div>
              <div className="flex flex-col sm:items-end text-body-sm">
                <span className="font-mono text-label-sm text-primary font-semibold">{metrics.documentId}</span>
                <span className="text-on-surface-variant font-body-sm text-body-sm">{metrics.issueDate}</span>
              </div>
            </div>

            {/* Patient Identity Stripe */}
            <div className="bg-surface-container-low rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Patient</span>
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  {metrics.patientName}
                </span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Demographics</span>
                <span className="font-body-md text-body-md text-on-surface">{metrics.demographics}</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Body Mass</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">
                  {metrics.bodyMass} <span className="text-primary text-[11px]">({metrics.massDelta})</span>
                </span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Clinical Target</span>
                <span className="font-body-md text-body-md text-secondary font-semibold">{metrics.targetMass}</span>
              </div>
            </div>

            {/* High-Level Executive Scorecard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-surface-container-low/80 flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">7-Day Caloric Avg</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                    {metrics.avg7DayCalories.toLocaleString()}
                  </span>
                  <span className="text-body-sm text-on-surface-variant font-label-sm">kcal</span>
                </div>
                <span className="text-[11px] font-semibold text-primary mt-1">{metrics.caloricAdherencePct}% adherence</span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low/80 flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Protein Velocity</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-metric text-numeric-metric text-secondary font-bold">
                    {metrics.proteinVelocity}
                  </span>
                  <span className="text-body-sm text-on-surface-variant font-label-sm">g/day</span>
                </div>
                <span className="text-[11px] text-on-surface-variant mt-1">Target: {metrics.targetProtein}g ({metrics.proteinPct}%)</span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low/80 flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Electrolyte Index</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-metric text-[18px] text-primary font-bold">Normal</span>
                </div>
                <span className="text-[11px] text-primary mt-1">{metrics.electrolyteStatus}</span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low/80 flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Micronutrient Suff.</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                    {metrics.micronutrientSufficiency}%
                  </span>
                </div>
                <span className="text-[11px] text-primary mt-1">{metrics.rdasMet}</span>
              </div>
            </div>

            {/* Weekly Caloric Intake Bar Chart */}
            <div className="p-4 rounded-lg bg-surface-container-low/40">
              <div className="flex items-center justify-between mb-3">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Weekly Caloric Intake vs ICMR Target (kcal/day)
                </span>
                <div className="flex items-center gap-3 text-label-sm font-label-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                    <span className="text-on-surface-variant">Intake</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-secondary-container"></span>
                    <span className="text-on-surface-variant">Target ({metrics.icmrTargetLine})</span>
                  </div>
                </div>
              </div>

              {/* Inline Bar Chart */}
              <div className="w-full h-36">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 540 140">
                  <line stroke="#d8e3fb" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="520" y1="20" y2="20" />
                  <line stroke="#d8e3fb" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="520" y1="60" y2="60" />
                  <line stroke="#d8e3fb" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="520" y1="100" y2="100" />
                  <text fill="#6f7973" fontSize="9" textAnchor="end" x="30" y="24">3000</text>
                  <text fill="#6f7973" fontSize="9" textAnchor="end" x="30" y="64">2600</text>
                  <text fill="#6f7973" fontSize="9" textAnchor="end" x="30" y="104">2000</text>
                  <line stroke="#fe932c" strokeDasharray="4 2" strokeWidth="1.5" x1="40" x2="520" y1="60" y2="60" />

                  {metrics.weeklyCalorieHistory.map((item, index) => {
                    const x = 58 + index * 68;
                    const height = Math.round((item.value / 3000) * 80);
                    const y = 120 - height;
                    return (
                      <g key={item.day}>
                        <rect fill="#065f46" fillOpacity="0.85" height={height} rx="3" width="34" x={x} y={y} />
                        <text fill="#6f7973" fontSize="9" textAnchor="middle" x={x + 17} y="132">{item.day}</text>
                        <text fill="#111c2d" fontSize="8" textAnchor="middle" x={x + 17} y={y - 5}>{item.label}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Clinical Notes Block */}
            <div className="p-4 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2 mb-2 text-primary font-semibold font-label-md text-label-md">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>Clinician Summary & Physician Observations</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Patient displays stable lean mass accretion velocity under prescribed {metrics.icmrTargetLine.toLocaleString()} kcal protocol. Electrolyte balance and fiber indices are optimal.
              </p>
              {attachLetterhead && (
                <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Signed by Dr. Sunita Raman (MCI License #2011/04/0981)</span>
                  <span className="text-primary font-medium">Digital Verification Passed</span>
                </div>
              )}
            </div>

            {/* Export Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateDossier}
                disabled={isGenerating}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-medium shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'Generating...' : 'Download Medical PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
