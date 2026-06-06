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
      <TabsList>
        <TabsTrigger value="day">Today</TabsTrigger>
        <TabsTrigger value="week">7 days</TabsTrigger>
        <TabsTrigger value="month">30 days</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
