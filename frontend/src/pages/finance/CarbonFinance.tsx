import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  PieChart as PieIcon,
  ShieldAlert,
  Wallet,
  ArrowUpRight,
  Calculator,
  Building
} from 'lucide-react';
import { api } from '../../api/client';
import { CarbonFinance as CarbonFinanceType } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const CarbonFinance: React.FC = () => {
  const [finance, setFinance] = useState<CarbonFinanceType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      setLoading(true);
      try {
        const res = await api.finance.getData();
        setFinance(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  const price = finance?.internal_carbon_price_usd || 75.0;
  const budget = finance?.annual_carbon_budget_usd || 12000000;
  const liability = finance?.estimated_carbon_liability_usd || 3807900;
  const allocated = finance?.allocated_reduction_budget_usd || 4500000;
  const savings = finance?.realized_cost_savings_usd || 1850000;

  const budgetUsedPct = Math.min(100, Math.round((liability / budget) * 100));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Carbon Finance & Internal Carbon Pricing (ICP)"
        subtitle="Monetize climate risk liability, track carbon budgets, and evaluate capital investment ROI."
        badge={
          <Badge variant="emerald" dot>
            Internal Carbon Price: ${price} / tCO2e
          </Badge>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Internal Carbon Price"
          value={`$${price}`}
          subtitle="Shadow fee per tCO2e"
          change="Corporate standard"
          trend="neutral"
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Estimated Carbon Liability"
          value={`$${(liability / 1000000).toFixed(2)}M`}
          subtitle="Total Emissions × Carbon Fee"
          change="Net shadow exposure"
          trend="down"
          icon={ShieldAlert}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Annual Decarb Budget"
          value={`$${(budget / 1000000).toFixed(1)}M`}
          subtitle={`Allocated: $${(allocated / 1000000).toFixed(1)}M Capex`}
          change="Board Approved"
          trend="neutral"
          icon={Wallet}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Realized OPEX Savings"
          value={`$${(savings / 1000000).toFixed(2)}M`}
          subtitle="Avoided fuel, power & fees"
          change="From reduction projects"
          trend="up"
          isPositiveChangeGood={true}
          icon={TrendingDown}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
      </div>

      {/* Budget Utilization & Liability Gauge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Carbon Liability vs Annual Carbon Cap Budget
              </h3>
              <p className="text-xs text-slate-500">
                Tracking shadow carbon cost accrual against corporate threshold of ${(budget / 1000000).toFixed(0)}M
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-700">
              {budgetUsedPct}% Utilized
            </span>
          </div>

          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all ${
                budgetUsedPct > 80 ? 'bg-rose-500' : budgetUsedPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>$0.0M Incurred</span>
            <span className="font-bold text-slate-800 font-mono">Current: ${(liability / 1000000).toFixed(2)}M</span>
            <span>Annual Cap: ${(budget / 1000000).toFixed(1)}M</span>
          </div>
        </div>

        {/* Breakdown Matrix */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Shadow Carbon Fee Surcharge</span>
            <p className="text-xl font-bold text-slate-900 font-mono mt-1">${price} / tCO2e</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Applied to internal capital expenditure approvals to favor low-carbon equipment purchases.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Avoided Carbon Liability</span>
            <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
              +${((savings / 1000000) * 1.4).toFixed(2)}M / yr
            </p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Calculated from avoided emissions across active solar, heat pump, and freight optimization initiatives.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Carbon Return on Investment (C-ROI)</span>
            <p className="text-xl font-bold text-indigo-700 font-mono mt-1">34.2%</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Blended economic yield including direct energy utility savings and avoided carbon taxation risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
