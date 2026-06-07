import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StatsPeriod } from "@/hooks/use-stats";

type Props = {
  value: StatsPeriod;
  onChange: (value: StatsPeriod) => void;
};

export function PeriodSelector({ value, onChange }: Props) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as StatsPeriod)}
    >
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="day" className="flex-1 sm:flex-none sm:min-w-20">Today</TabsTrigger>
        <TabsTrigger value="week" className="flex-1 sm:flex-none sm:min-w-20">7 days</TabsTrigger>
        <TabsTrigger value="month" className="flex-1 sm:flex-none sm:min-w-20">30 days</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
