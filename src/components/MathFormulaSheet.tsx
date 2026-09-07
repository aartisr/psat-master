import React from 'react';
import { X, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { MathView } from './common/MathRenderer';

interface MathFormulaSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MathFormulaSheet: React.FC<MathFormulaSheetProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">PSAT / SAT Math Reference Sheet</h2>
              <p className="text-xs text-slate-300">Official College Board standard formulas & constants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm">
          {/* Section 1: Geometric 2D & 3D Formulas */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> 2D & 3D Geometry Reference
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">Circle Area & Circumference</div>
                <div className="text-indigo-700 font-bold"><MathView math="A = \pi r^2" /></div>
                <div className="text-indigo-700 font-bold"><MathView math="C = 2\pi r = \pi d" /></div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">Rectangle & Triangle</div>
                <div className="text-indigo-700 font-bold"><MathView math="A = \ell w" /></div>
                <div className="text-indigo-700 font-bold"><MathView math="A = \frac{1}{2} b h" /></div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">Right Cylinder & Prism</div>
                <div className="text-indigo-700 font-bold"><MathView math="V = \pi r^2 h" /></div>
                <div className="text-indigo-700 font-bold"><MathView math="V = \ell w h" /></div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">Sphere & Cone Volume</div>
                <div className="text-indigo-700 font-bold"><MathView math="V = \frac{4}{3} \pi r^3" /></div>
                <div className="text-indigo-700 font-bold"><MathView math="V = \frac{1}{3} \pi r^2 h" /></div>
              </div>
            </div>
          </div>

          {/* Section 2: Special Right Triangles & Pythagorean Theorem */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
              Right Triangles & Trigonometry
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">Pythagorean Theorem</div>
                <div className="text-indigo-700 font-black text-base"><MathView math="a^2 + b^2 = c^2" /></div>
                <p className="text-[11px] text-slate-600">Common triples: 3-4-5, 5-12-13, 8-15-17, 7-24-25</p>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">Special Right: 30° - 60° - 90°</div>
                <div className="text-indigo-700 font-bold text-sm">Sides: <MathView math="x, x\sqrt{3}, 2x" /></div>
                <p className="text-[11px] text-slate-600">Opposite 30°: <MathView math="x" />, Opposite 60°: <MathView math="x\sqrt{3}" />, Hypotenuse: <MathView math="2x" /></p>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">Special Right: 45° - 45° - 90°</div>
                <div className="text-indigo-700 font-bold text-sm">Sides: <MathView math="x, x, x\sqrt{2}" /></div>
                <p className="text-[11px] text-slate-600">Isosceles right triangle. Hypotenuse = <MathView math="\text{leg} \times \sqrt{2}" /></p>
              </div>
            </div>
          </div>

          {/* Section 3: Essential Constants & Angles */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-900 uppercase tracking-wide">College Board Reference Facts</div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>The number of degrees of arc in a circle is <strong>360°</strong>.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>The number of radians of arc in a circle is <MathView math="2\pi" />.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>The sum of the measures in degrees of the angles of a triangle is <strong>180°</strong>.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>SOH-CAH-TOA</strong>: <MathView math="\sin = \frac{\text{Opp}}{\text{Hyp}}, \cos = \frac{\text{Adj}}{\text{Hyp}}, \tan = \frac{\text{Opp}}{\text{Adj}}" /></span>
              </li>
            </ul>
          </div>

          {/* Section 4: High-Yield Algebra & Quadratic Rules */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
              Essential Algebra & Coordinate Geometry
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">Slope & Linear Forms</div>
                <div className="text-slate-800"><MathView math="m = \frac{y_2 - y_1}{x_2 - x_1}" /></div>
                <div className="text-slate-800"><MathView math="y = mx + b" /></div>
                <div className="text-[11px] text-slate-500">Perpendicular lines: <MathView math="m_1 \cdot m_2 = -1" /></div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">Quadratic Vertex & Roots</div>
                <div className="text-slate-800"><MathView math="x_v = -\frac{b}{2a}" /></div>
                <div className="text-slate-800"><MathView math="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" /></div>
                <div className="text-[11px] text-slate-500">Discriminant <MathView math="\Delta = b^2 - 4ac" /> (&gt;0: 2 roots, =0: 1 root, &lt;0: 0 roots)</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">Circle Equation</div>
                <div className="text-slate-800"><MathView math="(x - h)^2 + (y - k)^2 = r^2" /></div>
                <div className="text-[11px] text-slate-500">Center is <MathView math="(h, k)" /> and radius is <MathView math="r" />.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
          >
            Close Reference Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
