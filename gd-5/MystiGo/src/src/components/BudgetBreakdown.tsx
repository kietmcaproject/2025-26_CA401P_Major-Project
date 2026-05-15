import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Plane, Hotel, UtensilsCrossed, Camera, ShoppingBag } from "lucide-react";

interface BudgetBreakdownProps {
  flightCost: number;
  hotelCost: number;
  currencySymbol: string;
  estimatedBudget?: string;
}

const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--black))",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
];

const BudgetBreakdown = ({ flightCost, hotelCost, currencySymbol, estimatedBudget }: BudgetBreakdownProps) => {
  // Estimate food & activities as proportions of total
  const totalBooked = flightCost + hotelCost;
  const estimatedFood = Math.round(totalBooked * 0.2) || 0;
  const estimatedActivities = Math.round(totalBooked * 0.15) || 0;
  const estimatedShopping = Math.round(totalBooked * 0.1) || 0;
  const grandTotal = totalBooked + estimatedFood + estimatedActivities + estimatedShopping;

  const data = [
    { name: "Flights", value: flightCost, icon: Plane, color: COLORS[0] },
    { name: "Hotels", value: hotelCost, icon: Hotel, color: COLORS[1] },
    { name: "Food & Dining", value: estimatedFood, icon: UtensilsCrossed, color: COLORS[2] },
    { name: "Activities", value: estimatedActivities, icon: Camera, color: COLORS[3] },
    { name: "Shopping & Misc", value: estimatedShopping, icon: ShoppingBag, color: COLORS[4] },
  ].filter(d => d.value > 0);

  if (grandTotal === 0) return null;

  return (
    <Card className="bg-white rounded-xl p-6">
      <h4 className="font-bold text-sm text-gray-900 mb-4 text-center">Budget Breakdown</h4>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, ""]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3 w-full">
          {data.map((item) => {
            const Icon = item.icon;
            const percentage = Math.round((item.value / grandTotal) * 100);
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">{item.name}</span>
                    <span className="text-xs font-bold text-gray-900">
                      {currencySymbol}{item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 w-8 text-right flex-shrink-0">{percentage}%</span>
              </div>
            );
          })}
          
          <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Total</span>
            <span className="text-lg font-black text-gray-900">
              {currencySymbol}{grandTotal.toLocaleString()}
            </span>
          </div>
          
          {estimatedFood > 0 && (
            <p className="text-[10px] text-gray-400 italic">
              * Food, activities & shopping are estimated based on your trip budget
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BudgetBreakdown;
