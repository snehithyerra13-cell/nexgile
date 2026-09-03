import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Layers,
  Component,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Recycle,
  BarChart2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Product, ProductMaterial, ProductLifecycleStage } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Products: React.FC = () => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stages, setStages] = useState<ProductLifecycleStage[]>([]);
  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  // Product Form
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Enterprise Hardware');
  const [weight, setWeight] = useState(15.0);
  const [production, setProduction] = useState(50000);
  const [targetPcf, setTargetPcf] = useState(12.0);

  // Material Form
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState(5.0);
  const [matUnit, setMatUnit] = useState('kg');
  const [matSupplier, setMatSupplier] = useState('Apex Precision Alloys Ltd');
  const [matFactor, setMatFactor] = useState(8.45);
  const [matRecycled, setMatRecycled] = useState(20.0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.products.getAll();
      setProducts(res.data);
      if (res.data.length > 0 && !selectedProduct) {
        handleSelectProduct(res.data[0]);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSelectProduct = async (prod: Product) => {
    setSelectedProduct(prod);
    try {
      const [stageRes, matRes] = await Promise.all([
        api.products.getLifecycle(prod.id),
        api.products.getMaterials(prod.id),
      ]);
      setStages(stageRes.data);
      setMaterials(matRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.products.create({
        sku: sku.toUpperCase(),
        name,
        category,
        weight_kg: weight,
        unit: 'unit',
        annual_production: production,
        target_pcf: targetPcf,
      });
      showToast('success', 'Product Created', `Created product ${res.data.name}`);
      setIsProductModalOpen(false);
      await fetchProducts();
      handleSelectProduct(res.data);
    } catch (err: any) {
      showToast('error', 'Error creating product', err.response?.data?.detail || 'Validation failed');
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.products.addMaterial(selectedProduct.id, {
        material_name: matName,
        quantity: matQty,
        unit: matUnit,
        supplier_name: matSupplier,
        emission_factor: matFactor,
        recycled_percentage: matRecycled,
      });
      showToast('success', 'BOM Updated', `Added ${matName} to Bill of Materials`);
      setIsMaterialModalOpen(false);
      // Refresh current product
      const updated = await api.products.getById(selectedProduct.id);
      setSelectedProduct(updated.data);
      handleSelectProduct(updated.data);
    } catch (err: any) {
      showToast('error', 'Error adding BOM item', err.response?.data?.detail || 'Validation failed');
    }
  };

  const stageColors: Record<string, string> = {
    'Raw Materials': '#0d9488',
    'Manufacturing': '#059669',
    'Packaging': '#10b981',
    'Transportation': '#3b82f6',
    'Distribution': '#6366f1',
    'Product Use': '#f59e0b',
    'End of Life': '#8b5cf6',
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Product Carbon Footprint (PCF) & Life Cycle Assessment (LCA)"
        subtitle="Cradle-to-grave ISO 14067 footprinting across 7 lifecycle stages and high-resolution Bill of Materials (BOM) carbon accounting."
        badge={
          <Badge variant="emerald" dot>
            ISO 14067 Ready
          </Badge>
        }
        actions={
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register Product</span>
          </button>
        }
      />

      {/* Product Selector Horizontal Scroller */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {products.map((p) => {
          const isSelected = selectedProduct?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectProduct(p)}
              className={`p-3.5 rounded-2xl border text-left transition shrink-0 w-64 ${
                isSelected
                  ? 'bg-emerald-50/50 border-emerald-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  {p.sku}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{p.category}</span>
              </div>
              <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-black text-slate-900 font-mono">
                  {p.total_pcf} <span className="text-[11px] font-normal text-slate-500">kgCO2e</span>
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    p.total_pcf <= p.target_pcf ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  Tgt: {p.target_pcf} kg
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedProduct && (
        <div className="space-y-6">
          {/* Main Product Spotlight Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {selectedProduct.sku}
                  </span>
                  <Badge variant="emerald" size="sm">
                    {selectedProduct.category}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedProduct.name}</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">{selectedProduct.description}</p>
              </div>

              {/* High-level summary metrics */}
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total PCF</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    {selectedProduct.total_pcf} <span className="text-xs font-normal text-slate-500">kgCO2e/unit</span>
                  </p>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Annual Production</span>
                  <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                    {selectedProduct.annual_production.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                  </p>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Annual Product Footprint</span>
                  <p className="text-xl font-black text-emerald-600 font-mono mt-0.5">
                    {Math.round((selectedProduct.total_pcf * selectedProduct.annual_production) / 1000).toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500">tCO2e/yr</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 7 Lifecycle Stages Visualization */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Lifecycle Stage Emissions Breakdown (Cradle-to-Grave)</span>
              </h3>

              <div className="h-56 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stages} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="stage_name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} kg`} />
                    <Tooltip
                      formatter={(value: any) => [`${value} kgCO2e`, 'Emissions']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="emissions_kg_co2e" radius={[6, 6, 0, 0]}>
                      {stages.map((st, idx) => (
                        <Cell key={`cell-${idx}`} fill={stageColors[st.stage_name] || '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stage Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
                {stages.map((st) => (
                  <div key={st.id} className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-center">
                    <span className="text-[10px] text-slate-500 font-medium block truncate">{st.stage_name}</span>
                    <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{st.emissions_kg_co2e} kg</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{st.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bill of Materials (BOM) Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Component className="w-4 h-4 text-emerald-600" />
                  <span>Bill of Materials (BOM) & Carbon Hotspots</span>
                </h3>
                <p className="text-xs text-slate-500">Material level emission intensities and circular recycled content</p>
              </div>
              <button
                onClick={() => setIsMaterialModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add BOM Material</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Material / Component</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Emission Factor</th>
                    <th className="py-3 px-4">Recycled %</th>
                    <th className="py-3 px-4 text-right">Calculated Footprint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {materials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{m.material_name}</td>
                      <td className="py-3 px-4 text-slate-600">{m.supplier_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        {m.quantity} {m.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.emission_factor} kgCO2e/kg</td>
                      <td className="py-3 px-4">
                        {m.recycled_percentage > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Recycle className="w-3 h-3 text-emerald-500" />
                            {m.recycled_percentage}% Circular
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">0% Virgin</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {m.calculated_emissions} kgCO2e
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Register New Product Architecture"
        subtitle="Establishes lifecycle stage baseline and product carbon target"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">SKU Number</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono uppercase focus:bg-white"
              placeholder="NX-PRD-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="e.g. DecarbX Intelligent Power Converter"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Weight (kg)</label>
              <input
                type="number"
                step="any"
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Production (Units)</label>
              <input
                type="number"
                required
                value={production}
                onChange={(e) => setProduction(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target PCF (kgCO2e)</label>
              <input
                type="number"
                step="any"
                required
                value={targetPcf}
                onChange={(e) => setTargetPcf(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Material Modal */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        title="Add BOM Material Component"
        subtitle={`Add to Bill of Materials for ${selectedProduct?.name}`}
      >
        <form onSubmit={handleAddMaterial} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Material Name</label>
            <input
              type="text"
              required
              value={matName}
              onChange={(e) => setMatName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="e.g. Die-Cast Structural Magnesium Shell"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                required
                value={matQty}
                onChange={(e) => setMatQty(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                value={matUnit}
                onChange={(e) => setMatUnit(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supplier Name</label>
            <input
              type="text"
              required
              value={matSupplier}
              onChange={(e) => setMatSupplier(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emission Factor (kgCO2e/unit)</label>
              <input
                type="number"
                step="any"
                required
                value={matFactor}
                onChange={(e) => setMatFactor(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recycled Scrap %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={matRecycled}
                onChange={(e) => setMatRecycled(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMaterialModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              Commit Material
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
