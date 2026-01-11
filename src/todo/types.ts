export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date_added: string;
  date_finished: string | null;

  relativePath?: string;
  line?: number;

  // 👇 IDENTIDAD PERSISTENTE
  sourceKey?: string;
}
