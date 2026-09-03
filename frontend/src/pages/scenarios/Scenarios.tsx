import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  TrendingDown,
  Target,
  Zap,
  Truck,
  Building,
  Plane,
  Gauge,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../../api/client';
import { ScenarioCalculateResponse } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const Scenarios: React.FC = () => {
  // Slider states
  const [renewableElec, setRenewableElec] = useState(50);
  const [fleetElectrification, setFleetElectrification] = useState(40);
  const [supplierReduction, setSupplierReduction] = useState(25);
  const [travelReduction, setTravelReduction] = useState(30);
  const [energyEfficiency, setEnergyEfficiency] = useState(15);

  const [result, setResult] = useState<ScenarioCalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.scenarios.calculate({
        renewable_elec_pct: renewableElec,
        fleet_electrification_pct: fleetElectrification,
        supplier_reduction_pct: supplierReduction,
        travel_reduction_pct: travelReduction,
        energy_efficiency_pct: energyEfficiency,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSimulate();
  }, [renewableElec, fleetElectrification, supplierReduction, travelReduction, energyEfficiency]);

  const handleReset = () => {
    setRenewableElec(0);
    setFleetElectrification(0);
    setSupplierReduction(0);
    setTravelReduction(0);
    setEnergyEfficiency(0);
  };

  const comparisonChartData = result
    ? [
        {
          name: 'Baseline 2024',
          'Scope 1': Math.round(result.current_emissions_tco2e * 0.22),
          'Scope 2': Math.round(result.current_emissions_tco2e * 0.32),
          'Scope 3': Math.round(result.current_emissions_tco2e * 0.46),
          Total: result.current_emissions_tco2e,
        },
        {
          name: 'What-If Scenario',
          'Scope 1': result.scope1_projected_tco2e,
          'Scope 2': result.scope2_projected_tco2e,
          'Scope 3': result.scope3_projected_tco2e,
          Total: result.projected_emissions_tco2e,
        },
        {
          name: '2030 Target',
          'Scope 1': Math.round(result.target_2030_emissions_tco2e * 0.20),
          'Scope 2': Math.round(result.target_2030_emissions_tco2e * 0.25),
          'Scope 3': Math.round(result.target_2030_emissions_tco2e * 0.55),
          Total: result.target_2030_emissions_tco2e,
        },
      ]
    : [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="What-If Decarbonization Scenario Modeling Sandbox"
        subtitle="Simulate real-time multi-lever operational interventions, renewable power sourcing, fleet electrification, and value chain cuts."
        badge={
          <Badge variant="emerald" dot>
            Real-Time Engine
          </Badge>
        }
        actions={
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Levers</span>
          </button>
        }
      />

      {/* Top Simulation Result KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Projected Footprint"
          value={`${result ? result.projected_emissions_tco2e.toLocaleString() : '—'} tCO2e`}
          subtitle={`Current: ${result ? result.current_emissions_tco2e.toLocaleString() : '—'} t`}
          change={`-${result?.projected_reduction_pct || 0}% Cut`}
          trend="down"
          icon={TrendingDown}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Avoided Annual Emissions"
          value={`${result ? result.projected_reduction_tco2e.toLocaleString() : '—'} tCO2e`}
          subtitle="Net annual abatement"
          change="Combined levers"
          trend="up"
          isPositiveChangeGood={true}
          icon={Zap}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="Gap to 2030 Target"
          value={`${result ? result.gap_to_2030_target_tco2e.toLocaleString() : '—'} tCO2e`}
          subtitle={`Target: ${result ? result.target_2030_emissions_tco2e.toLocaleString() : '—'} t`}
          change={result?.gap_to_2030_target_tco2e === 0 ? 'Goal Surpassed' : 'Remaining Gap'}
          trend={result?.gap_to_2030_target_tco2e === 0 ? 'down' : 'neutral'}
          icon={Target}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Projected OPEX Savings"
          value={`$${result ? (result.projected_cost_savings_usd / 1000000).toFixed(2) : '—'}M`}
          subtitle="Annual fuel, power & carbon fee"
          change="Avoided liability"
          trend="up"
          isPositiveChangeGood={true}
          icon={DollarSign}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Interactive Sliders & Live Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5 Interactive Sliders */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Decarbonization Levers</span>
              </h3>
              <p className="text-xs text-slate-500">Adjust levers to simulate target trajectories</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
              Feasibility: {result?.feasibility_score || 85}%
            </span>
          </div>

          {/* Lever 1: Renewable Electricity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Renewable Electricity Transition (VPPA / Rooftop Solar)
              </span>
              <span className="font-bold font-mono text-emerald-600">{renewableElec}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={renewableElec}
              onChange={(e) => setRenewableElec(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Current Grid)</span>
              <span>100% RE100</span>
            </div>
          </div>

          {/* Lever 2: Fleet Electrification */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                Fleet Electrification (Electric Delivery Cargo Vans)
              </span>
              <span className="font-bold font-mono text-emerald-600">{fleetElectrification}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fleetElectrification}
              onChange={(e) => setFleetElectrification(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (ICE Diesel)</span>
              <span>100% Zero-Emission</span>
            </div>
          </div>

          {/* Lever 3: Supplier Decarbonization */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                Scope 3 Supplier Carbon Reduction Mandate
              </span>
              <span className="font-bold font-mono text-emerald-600">{supplierReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={supplierReduction}
              onChange={(e) => setSupplierReduction(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Status Quo)</span>
              <span>50% Aggressive Mandate</span>
            </div>
          </div>

          {/* Lever 4: Business Travel Reduction */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-sky-500" />
                Business Flight Curtailment & Virtual Collaboration
              </span>
              <span className="font-bold font-mono text-emerald-600">{travelReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={travelReduction}
              onChange={(e) => setTravelReduction(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% Full Travel</span>
              <span>100% Virtual</span>
            </div>
          </div>

          {/* Lever 5: Energy Efficiency */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-teal-500" />
                Facility Smart BMS & VFD Heat Recovery
              </span>
              <span className="font-bold font-mono text-emerald-600">{energyEfficiency}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={energyEfficiency}
              onChange={(e) => setEnergyEfficiency(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% Baseline</span>
              <span>30% Deep Retrofit</span>
            </div>
          </div>
        </div>

        {/* Right: Comparative Chart & Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Scenario Trajectory Comparison
                </h3>
                <p className="text-xs text-slate-500">Current Footprint vs Scenario Projection vs SBTi Target</p>
              </div>
              <Badge variant="blue" size="sm">
                Interactive Simulation
              </Badge>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} tCO2e`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Scope 1" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Scope 2" stackId="a" fill="#0d9488" />
                  <Bar dataKey="Scope 3" stackId="a" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scope savings scorecard */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800">Scope 1 Savings</span>
              <p className="text-base font-extrabold text-amber-900 font-mono mt-0.5">
                -{result ? result.scope1_savings_tco2e.toLocaleString() : '0'} t
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
              <span className="text-[10px] uppercase font-bold text-teal-800">Scope 2 Savings</span>
              <p className="text-base font-extrabold text-teal-900 font-mono mt-0.5">
                -{result ? result.scope2_savings_tco2e.toLocaleString() : '0'} t
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-800">Scope 3 Savings</span>
              <p className="text-base font-extrabold text-blue-900 font-mono mt-0.5">
                -{result ? result.scope3_savings_tco2e.toLocaleString() : '0'} t
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
