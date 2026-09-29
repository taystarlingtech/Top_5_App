export type Team = "ACES" | "Alpha" | "Awesomes";

export type DayRow = {
  id: string;
  person: string;
  team: Team;
  day: string;
  topLabel: string;
  topDone: boolean;
  highLabel: string;
  highDone: boolean;
  med1Label: string;
  med1Done: boolean;
  med2Label: string;
  med2Done: boolean;
  lowLabel: string;
  lowDone: boolean;
  notes: string;
  top5: boolean;
  exercise: boolean;
  reading: boolean;
};

export type GridRow = DayRow & {
  daily: number;
  week: number;
};
