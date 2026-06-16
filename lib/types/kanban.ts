// Representa uma coluna do Kanban (ex: Backlog, To Do, In Progress, Done)
export interface KanbanColumn {
  id: string;
  name: string;
  color: string;   // formato #RRGGBB
  order: number;
  project: string | null; // UUID do projeto, ou null = coluna global
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Representação compacta de um TestCase para exibição no card do board
export interface KanbanCard {
  id: string;
  case_id: string;
  title: string;
  status: string;
  status_display: string;
  project: string;
  project_name: string;
  tags: { id: string; name: string; color: string }[];
  board_position: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority_display: string;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  assigned_to_initials: string | null;
  assigned_to_avatar: string | null;
}

// Coluna do board com os cards já aninhados — resposta do GET /kanban/board/
export interface KanbanBoardColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  project: string | null;
  cases: KanbanCard[];
  cases_count: number;
}

// Body enviado para POST /test-cases/{id}/move/
export interface MoveCasePayload {
  column_id: string;
  position: number;
}
