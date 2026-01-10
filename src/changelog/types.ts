export type ChangelogEntry = {
  text: string;
};

export type ChangelogSection = {
  name: string;
  entries: ChangelogEntry[];
};

export type ChangelogVersion = {
  version: string;
  date: string; // ISO
  sections: Record<string, ChangelogEntry[]>;
};
