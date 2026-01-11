export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date_added: string;
  date_finished: string | null;

  // Campos nuevos
  relativePath?: string;
  line?: number;
}
