import { LucideIcon } from "lucide-react";

interface FinancialCardProps {
  icon: LucideIcon;
  label: string;
  amount: string;
  bgClass: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function FinancialCard({
  icon: Icon,
  label,
  amount,
  bgClass,
  trend,
}: FinancialCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgClass}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>

      <p className="mb-2 text-2xl font-semibold text-gray-900">{amount}</p>

      {trend ? (
        <p className={`text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
          {trend.isPositive ? "↑" : "↓"} {trend.value}
        </p>
      ) : null}
    </div>
  );
}