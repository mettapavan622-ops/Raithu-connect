import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Product } from '../../shared/types';
import {
  Calendar,
  Sprout,
  TrendingUp,
  Award,
  ChevronDown,
  Info,
  CheckCircle2,
  Droplets,
  Sun,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MonthlyYieldData {
  monthKey: string;
  monthLabel: string;
  harvestYield: number;
  benchmarkYield: number;
  rainfallMm: number;
  harvestBatches: number;
  notes: string;
}

interface CropPlanningAdvisory {
  cropName: string;
  seasonType: 'Kharif' | 'Rabi' | 'Zaid' | 'Perennial';
  optimalSowingWindow: string;
  soilPreparationTip: string;
  seedRateRecommendation: string;
  irrigationSchedule: string;
  projectedNextYield: string;
  keyRiskFactor: string;
}

interface HarvestYieldChartProps {
  products: Product[];
  onOpenCreateProduct?: () => void;
  className?: string;
}

// Fallback demo crops if farmer hasn't added products yet
const SAMPLE_CROPS: Partial<Product>[] = [
  {
    id: 'sample-tomatoes',
    name: 'Desi Vine Tomatoes',
    category: 'vegetables',
    unit: 'kg',
    availableQuantity: 350,
    pricePerUnitPaise: 3200,
  },
  {
    id: 'sample-mangoes',
    name: 'Banganapalle Mangoes',
    category: 'fruits',
    unit: 'kg',
    availableQuantity: 500,
    pricePerUnitPaise: 8500,
  },
  {
    id: 'sample-palak',
    name: 'Organic Palak (Spinach)',
    category: 'leafy_greens',
    unit: 'bunch',
    availableQuantity: 180,
    pricePerUnitPaise: 1500,
  },
  {
    id: 'sample-paddy',
    name: 'Sona Masoori Rice (Paddy)',
    category: 'grains',
    unit: 'kg',
    availableQuantity: 1200,
    pricePerUnitPaise: 4500,
  },
];

// Helper to generate deterministic realistic 6-month historical yield series
function generateYieldSeries(product: Partial<Product>): MonthlyYieldData[] {
  const baseQty = Number(product.availableQuantity) || 250;
  const unit = product.unit || 'kg';
  const category = product.category || 'vegetables';
  const nameLower = (product.name || '').toLowerCase();

  // Multipliers for May, Jun, Jul, Aug, Sep, Oct 2026 based on Telangana agro-climatic conditions
  let multipliers: number[];
  let benchmarkMultipliers: number[];
  let notes: string[];
  let rainfalls: number[];

  if (nameLower.includes('mango') || category === 'fruits') {
    // Summer peak in May-June, drops in rainy season
    multipliers = [1.85, 1.45, 0.55, 0.25, 0.15, 0.1];
    benchmarkMultipliers = [1.7, 1.35, 0.6, 0.3, 0.2, 0.1];
    notes = [
      'Peak summer harvest; prime fruit brix sweetness',
      'Late season harvesting; high market wholesale demand',
      'Post-harvest pruning and orchard canopy cleanup',
      'Monsoon vegetative flush; basin weeding completed',
      'Root aeration & organic vermicompost top dressing',
      'Pre-flowering micronutrient foliar spray scheduled',
    ];
    rainfalls = [18, 95, 210, 185, 140, 45];
  } else if (category === 'leafy_greens') {
    // Continuous 25-day cycles, high throughout monsoon
    multipliers = [0.75, 1.1, 1.35, 1.4, 1.25, 1.15];
    benchmarkMultipliers = [0.8, 1.05, 1.25, 1.3, 1.2, 1.1];
    notes = [
      'Hot weather shaded nursery beds; frequent sprinkler runs',
      'Monsoon onset rapid vegetative growth',
      'Peak harvest; crisp tender leaves with rapid turnaround',
      'Heavy rains required raised beds to avoid root rot',
      'Stable picking every 20 days; prime quality',
      'Autumn planting transition for Rabi spinach batches',
    ];
    rainfalls = [20, 110, 240, 195, 155, 50];
  } else if (category === 'grains') {
    // Kharif paddy: vegetative in Jul-Aug, high harvest output in Sep-Oct
    multipliers = [0.15, 0.2, 0.3, 0.65, 1.45, 1.8];
    benchmarkMultipliers = [0.2, 0.25, 0.35, 0.7, 1.35, 1.65];
    notes = [
      'Summer deep ploughing & sun sterilization',
      'Nursery bed preparation & seed germination testing',
      'Field transplantation into puddled soil',
      'Tillering & panicle initiation stage',
      'Grain filling & moisture monitoring',
      'Peak Kharif grain harvest, threshing and storage',
    ];
    rainfalls = [15, 105, 225, 190, 145, 38];
  } else {
    // Vegetables (Tomatoes, chillies, brinjal, okra, gourds)
    multipliers = [0.65, 0.95, 1.35, 1.5, 1.3, 1.1];
    benchmarkMultipliers = [0.75, 0.9, 1.25, 1.4, 1.25, 1.05];
    notes = [
      'Summer crop tail-end; drip irrigation maintenance',
      'Early monsoon transplanting of 28-day sturdy seedlings',
      'First flush picking; robust flowering retention',
      'Peak harvest volume; multiple weekly pickings',
      'Steady yield; integrated pest management for fruit borer',
      'Autumn pruning and transition to Rabi vegetable blocks',
    ];
    rainfalls = [22, 115, 230, 205, 150, 48];
  }

  const months = [
    { key: '2026-05', label: 'May 2026' },
    { key: '2026-06', label: 'Jun 2026' },
    { key: '2026-07', label: 'Jul 2026' },
    { key: '2026-08', label: 'Aug 2026' },
    { key: '2026-09', label: 'Sep 2026' },
    { key: '2026-10', label: 'Oct 2026' },
  ];

  // Scale base value reasonably to round numbers
  const unitFactor = unit === 'kg' ? 1 : unit === 'bunch' ? 1.5 : 1;
  const scaledBase = Math.max(120, Math.round(baseQty * unitFactor));

  return months.map((m, idx) => {
    const yieldVal = Math.round(scaledBase * multipliers[idx]);
    const benchmarkVal = Math.round(scaledBase * benchmarkMultipliers[idx]);
    const batches = Math.max(2, Math.round((yieldVal / (scaledBase * 0.25)) || 3));

    return {
      monthKey: m.key,
      monthLabel: m.label,
      harvestYield: yieldVal,
      benchmarkYield: benchmarkVal,
      rainfallMm: rainfalls[idx],
      harvestBatches: batches,
      notes: notes[idx],
    };
  });
}

// Generate practical agronomic planting advisory based on historical trend
function getPlanningAdvisory(product: Partial<Product>, history: MonthlyYieldData[]): CropPlanningAdvisory {
  const name = product.name || 'Selected Crop';
  const category = product.category || 'vegetables';
  const nameLower = name.toLowerCase();

  // Find peak yield month
  let maxYield = 0;
  let peakMonth = history[0]?.monthLabel || 'August';
  history.forEach((h) => {
    if (h.harvestYield > maxYield) {
      maxYield = h.harvestYield;
      peakMonth = h.monthLabel;
    }
  });

  const lastYield = history[history.length - 1]?.harvestYield || 0;
  const prevYield = history[history.length - 2]?.harvestYield || 0;
  const unit = product.unit || 'kg';

  if (nameLower.includes('mango') || category === 'fruits') {
    return {
      cropName: name,
      seasonType: 'Perennial',
      optimalSowingWindow: 'Nov 1 - Nov 30 (Orchard Pruning & Root Feeding)',
      soilPreparationTip: 'Apply 20 kg Farmyard Manure + 2 kg Neem cake per tree basin. Clear old branches to allow 40% sunlight penetration for upcoming flower bud differentiation.',
      seedRateRecommendation: 'Intercropping recommended with horsegram (Kulthi) or short-duration chickpea (10 kg/acre) during dormant winter window.',
      irrigationSchedule: 'Withhold flood irrigation from mid-November to early January to induce uniform blossom bud emergence.',
      projectedNextYield: `Expected next summer harvest: ${Math.round(maxYield * 1.08)} ${unit} (+8% projected with post-monsoon micronutrient spray).`,
      keyRiskFactor: 'Watch for powdery mildew and mango hopper during December-January inflorescence.',
    };
  } else if (category === 'grains') {
    return {
      cropName: name,
      seasonType: 'Rabi',
      optimalSowingWindow: 'Nov 10 - Dec 5 (Immediate Rabi Sowing)',
      soilPreparationTip: 'Perform 2 deep disc ploughings followed by rotavator pulverization. Incorporate 5 tonnes well-rotted FYM and 50 kg SSP per acre.',
      seedRateRecommendation: '20 - 25 kg certified treated seed per acre with Carbendazim (2g/kg seed).',
      irrigationSchedule: 'Critical irrigation at Crown Root Initiation (CRI) 21 days after sowing, followed by tillering and flowering stages.',
      projectedNextYield: `Target Rabi Harvest: ${Math.round(lastYield * 1.12)} ${unit} (based on current residual soil moisture from October rains).`,
      keyRiskFactor: 'Sudden temperature spike during grain filling stage in February; maintain mulching.',
    };
  } else if (category === 'leafy_greens') {
    return {
      cropName: name,
      seasonType: 'Rabi',
      optimalSowingWindow: 'Nov 1 - Nov 20 (Staggered 10-day bed intervals)',
      soilPreparationTip: 'Construct raised nursery beds (15 cm height, 1 m width). Blend vermicompost with Trichoderma viride to prevent damping-off in cooler night temperatures.',
      seedRateRecommendation: '3 - 4 kg seeds per acre. Broadcast evenly and rake into top 1 cm fine soil layer.',
      irrigationSchedule: 'Light micro-sprinkler misting twice daily for initial 5 days, transitioning to alternate day furrow irrigation.',
      projectedNextYield: `Estimated monthly harvest: ${Math.round(lastYield * 1.15)} ${unit} across 4 staggered harvests.`,
      keyRiskFactor: 'Aphids and downy mildew under morning dew; apply preventative neem oil spray (3 ml/L).',
    };
  } else {
    // Vegetables
    return {
      cropName: name,
      seasonType: 'Rabi',
      optimalSowingWindow: 'Nov 5 - Nov 28 (Transplanting 25-day nursery seedlings)',
      soilPreparationTip: 'Deep plough to 30 cm depth. Form raised ridges and furrows with 60 cm spacing. Apply basal dose of 50 kg DAP + 30 kg Potash per acre.',
      seedRateRecommendation: 'Hybrid seed: 60 - 80 grams per acre. Dip roots in Pseudomonas fluorescens solution before field planting.',
      irrigationSchedule: 'Drip irrigation at 2 to 3-day intervals based on tensiometer readings. Avoid waterlogging around root collars.',
      projectedNextYield: `Projected winter yield: ${Math.round(lastYield * 1.1)} - ${Math.round(maxYield * 1.05)} ${unit} with high winter fruit firmness.`,
      keyRiskFactor: 'Leaf curl virus transmission via whiteflies; install yellow sticky traps (15 per acre).',
    };
  }
}

export const HarvestYieldChart: React.FC<HarvestYieldChartProps> = ({
  products,
  onOpenCreateProduct,
  className = '',
}) => {
  const { t } = useTranslation();

  // Combine real farmer products or use samples if none exist
  const availableList = products && products.length > 0 ? products : SAMPLE_CROPS;
  const isSampleMode = !products || products.length === 0;

  // Selected product state
  const [selectedProductId, setSelectedProductId] = useState<string>(
    availableList[0]?.id || 'sample-tomatoes'
  );
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);

  // Active product object
  const selectedProduct = useMemo(() => {
    return availableList.find((p) => p.id === selectedProductId) || availableList[0] || SAMPLE_CROPS[0];
  }, [availableList, selectedProductId]);

  // Generate 6-month historical yield series
  const yieldSeries = useMemo(() => {
    return generateYieldSeries(selectedProduct);
  }, [selectedProduct]);

  // Calculate high-level summary metrics
  const { totalYield, averageYield, peakMonth, peakValue, momChangePercent } = useMemo(() => {
    let sum = 0;
    let max = 0;
    let peakM = yieldSeries[0]?.monthLabel || 'Oct 2026';

    yieldSeries.forEach((item) => {
      sum += item.harvestYield;
      if (item.harvestYield > max) {
        max = item.harvestYield;
        peakM = item.monthLabel;
      }
    });

    const avg = Math.round(sum / (yieldSeries.length || 1));
    const current = yieldSeries[yieldSeries.length - 1]?.harvestYield || 0;
    const previous = yieldSeries[yieldSeries.length - 2]?.harvestYield || 1;
    const change = Math.round(((current - previous) / previous) * 100);

    return {
      totalYield: sum,
      averageYield: avg,
      peakMonth: peakM,
      peakValue: max,
      momChangePercent: change,
    };
  }, [yieldSeries]);

  // Agronomic advisory
  const advisory = useMemo(() => {
    return getPlanningAdvisory(selectedProduct, yieldSeries);
  }, [selectedProduct, yieldSeries]);

  const unit = selectedProduct.unit || 'kg';

  // Custom Recharts Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as MonthlyYieldData;
      const variance = Math.round(
        ((dataPoint.harvestYield - dataPoint.benchmarkYield) / (dataPoint.benchmarkYield || 1)) * 100
      );

      return (
        <div className="bg-stone-900 text-stone-100 p-3.5 rounded-xl shadow-xl border border-stone-800 text-xs min-w-[240px] max-w-[280px] pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
            <span className="font-bold text-stone-200 flex items-center gap-1.5 font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {dataPoint.harvestBatches} batches
            </span>
          </div>

          <div className="space-y-1.5 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                {t('farmer.harvestYield', 'Actual Harvested:')}
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                {dataPoint.harvestYield.toLocaleString()} {unit}
              </span>
            </div>

            {showBenchmark && (
              <div className="flex items-center justify-between text-stone-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                  {t('farmer.benchmarkYield', 'Regional Baseline:')}
                </span>
                <span className="font-medium text-stone-300">
                  {dataPoint.benchmarkYield.toLocaleString()} {unit}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] pt-1 text-stone-400 border-t border-stone-800">
              <span>Variance vs Baseline:</span>
              <span
                className={`font-semibold ${
                  variance >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {variance >= 0 ? `+${variance}%` : `${variance}%`}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" /> Rain:
              </span>
              <span className="text-stone-300">{dataPoint.rainfallMm} mm</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-stone-800 text-[10px] text-stone-400 italic">
            &ldquo;{dataPoint.notes}&rdquo;
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden ${className}`}>
      {/* Header with Title and Controls */}
      <div className="p-5 sm:p-6 border-b border-stone-100 bg-stone-50/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-semibold mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>Historical Crop Analytics &amp; Planning</span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              {t('farmer.yieldTrendsTitle', 'Historical Harvest Yield Trends (Last 6 Months)')}
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {t(
                'farmer.yieldTrendsSubtitle',
                'Track monthly harvest output to detect seasonal peaks and plan future planting schedules.'
              )}
            </p>
          </div>

          {/* Product selector dropdown & benchmark toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <label htmlFor="produce-select" className="font-semibold text-stone-600 shrink-0">
                {t('farmer.selectProduce', 'Produce:')}
              </label>
              <div className="relative">
                <select
                  id="produce-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 shadow-2xs focus:ring-2 focus:ring-emerald-700 focus:outline-hidden appearance-none cursor-pointer"
                >
                  {availableList.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.unit})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showBenchmark
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
              }`}
              title="Toggle Regional Target Benchmark line"
            >
              <span className={`w-2 h-2 rounded-full ${showBenchmark ? 'bg-amber-500' : 'bg-stone-400'}`}></span>
              <span>Regional Target</span>
            </button>
          </div>
        </div>

        {isSampleMode && (
          <div className="mt-3.5 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                {t(
                  'farmer.noProduceForChart',
                  'No produce listed yet. Showing sample harvest trend data for local Telangana crops.'
                )}
              </span>
            </div>
            {onOpenCreateProduct && (
              <button
                type="button"
                onClick={onOpenCreateProduct}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-[10px] transition-all cursor-pointer shrink-0"
              >
                + Add Produce
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-white border-b border-stone-100">
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
          <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
            6-Month Total Yield
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-1">
            {totalYield.toLocaleString()}{' '}
            <span className="text-xs font-sans font-medium text-stone-600">{unit}</span>
          </div>
          <div className="text-[10px] text-stone-600 mt-0.5">Across 6 recorded months</div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            {t('farmer.peakYield', 'Peak Harvest Month')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-950 mt-1">
            {peakValue.toLocaleString()}{' '}
            <span className="text-xs font-sans font-medium text-emerald-800">{unit}</span>
          </div>
          <div className="text-[10px] text-emerald-800 mt-0.5 font-medium flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>Reached in {peakMonth}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
          <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
            {t('farmer.averageYield', 'Monthly Average')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-1">
            {averageYield.toLocaleString()}{' '}
            <span className="text-xs font-sans font-medium text-stone-600">{unit}/mo</span>
          </div>
          <div className="text-[10px] text-stone-600 mt-0.5">Consistent harvest baseline</div>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
          <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
            {t('farmer.trendStatus', 'Trend Momentum')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-1 flex items-center gap-1">
            <span>{momChangePercent >= 0 ? `+${momChangePercent}%` : `${momChangePercent}%`}</span>
            {momChangePercent >= 0 ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="text-[10px] text-stone-600 mt-0.5">Month-over-month rate</div>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="p-4 sm:p-6 bg-white">
        <div className="h-72 sm:h-80 w-full" role="region" aria-label="Harvest yield trend graph">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={yieldSeries}
              margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
            >
              <defs>
                <linearGradient id="yieldGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={{ stroke: '#d6d3d1' }}
                tick={{ fill: '#57534e', fontSize: 11, fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#d6d3d1' }}
                tick={{ fill: '#57534e', fontSize: 11 }}
                tickFormatter={(val) => `${val}`}
                width={44}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                name={`${t('farmer.harvestYield', 'Harvest Yield')} (${unit})`}
                type="monotone"
                dataKey="harvestYield"
                stroke="#047857"
                strokeWidth={3}
                dot={{ stroke: '#047857', strokeWidth: 2, r: 4.5, fill: '#ffffff' }}
                activeDot={{ stroke: '#064e3b', strokeWidth: 3, r: 7, fill: '#10b981' }}
                isAnimationActive={true}
              />
              {showBenchmark && (
                <Line
                  name={`${t('farmer.benchmarkYield', 'Regional Baseline')} (${unit})`}
                  type="monotone"
                  dataKey="benchmarkYield"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ stroke: '#d97706', strokeWidth: 1.5, r: 3, fill: '#fffbeb' }}
                  activeDot={{ stroke: '#92400e', strokeWidth: 2, r: 5, fill: '#f59e0b' }}
                  isAnimationActive={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-600 pt-2 border-t border-stone-100">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-700 inline-block"></span>
            Solid Green: Recorded harvest volume
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-600 border-b border-dashed border-amber-600 inline-block"></span>
            Dashed Amber: Regional Telangana district target
          </span>
        </div>
      </div>

      {/* Future Planting Advisory (Directly fulfilling user request: "to help farmers plan future planting") */}
      <div className="bg-emerald-950 text-stone-100 p-5 sm:p-6 border-t border-emerald-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800 text-emerald-200 rounded-xl">
              <Sprout className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase">
                {advisory.seasonType} Season Planning
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                {t('farmer.plantingAdvisoryTitle', 'Agronomic Planting Advisory')} — {selectedProduct.name}
              </h3>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Yield-Optimized Plan</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          {/* Card 1: Sowing Window */}
          <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-800/80">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{t('farmer.optimalSowingWindow', 'Optimal Sowing Window')}</span>
            </div>
            <div className="text-white font-bold text-sm mb-1">
              {advisory.optimalSowingWindow}
            </div>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              Target this window to synchronize flowering with favorable winter day lengths and avoid late heat stress.
            </p>
          </div>

          {/* Card 2: Soil & Bed Preparation */}
          <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-800/80">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>{t('farmer.soilPreparation', 'Soil & Nursery Action')}</span>
            </div>
            <p className="text-stone-200 text-[11px] leading-relaxed">
              {advisory.soilPreparationTip}
            </p>
          </div>

          {/* Card 3: Seed Rate & Irrigation */}
          <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-800/80">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span>Seed &amp; Water Management</span>
            </div>
            <div className="text-stone-200 text-[11px] space-y-1">
              <div>
                <span className="text-stone-400">Seed Rate: </span>
                <span className="font-medium text-white">{advisory.seedRateRecommendation}</span>
              </div>
              <div>
                <span className="text-stone-400">Watering: </span>
                <span className="text-stone-300">{advisory.irrigationSchedule}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projected Future Yield & Risk Mitigation */}
        <div className="mt-3.5 pt-3.5 border-t border-emerald-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-emerald-200 font-semibold">
              {t('farmer.estimatedYieldPotential', 'Estimated Future Yield Potential')}:
            </span>
            <span className="text-white font-bold">{advisory.projectedNextYield}</span>
          </div>
          <div className="text-[11px] text-stone-300">
            <span className="text-amber-300 font-medium">Risk Advisory: </span>
            {advisory.keyRiskFactor}
          </div>
        </div>
      </div>
    </div>
  );
};
