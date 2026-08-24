/**
 * Database types for HOMPANY public schema.
 * Keep in sync with supabase/migrations. Prefer regenerating with:
 * `npm run types:generate`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      homes: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      home_members: {
        Row: {
          id: string;
          home_id: string;
          user_id: string;
          role: Database['public']['Enums']['home_member_role'];
          reputation_points: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          user_id: string;
          role?: Database['public']['Enums']['home_member_role'];
          reputation_points?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['home_member_role'];
          reputation_points?: number;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'home_members_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'home_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          description: string | null;
          status: Database['public']['Enums']['task_status'];
          category: Database['public']['Enums']['task_category'];
          icon: string;
          recurrence: Database['public']['Enums']['task_recurrence'];
          is_template: boolean;
          template_id: string | null;
          created_by: string | null;
          base_title: string | null;
          auto_assign: boolean;
          recurrence_config: Json;
          assigned_to: string | null;
          completed_by: string | null;
          due_at: string;
          due_mode: Database['public']['Enums']['due_mode'];
          completed_at: string | null;
          proof_image_url: string | null;
          points_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          title: string;
          description?: string | null;
          status?: Database['public']['Enums']['task_status'];
          category?: Database['public']['Enums']['task_category'];
          icon?: string;
          recurrence?: Database['public']['Enums']['task_recurrence'];
          is_template?: boolean;
          template_id?: string | null;
          created_by?: string | null;
          base_title?: string | null;
          auto_assign?: boolean;
          recurrence_config?: Json;
          assigned_to?: string | null;
          completed_by?: string | null;
          due_at: string;
          due_mode?: Database['public']['Enums']['due_mode'];
          completed_at?: string | null;
          proof_image_url?: string | null;
          points_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          title?: string;
          description?: string | null;
          status?: Database['public']['Enums']['task_status'];
          category?: Database['public']['Enums']['task_category'];
          icon?: string;
          recurrence?: Database['public']['Enums']['task_recurrence'];
          is_template?: boolean;
          template_id?: string | null;
          created_by?: string | null;
          base_title?: string | null;
          auto_assign?: boolean;
          recurrence_config?: Json;
          assigned_to?: string | null;
          completed_by?: string | null;
          due_at?: string;
          due_mode?: Database['public']['Enums']['due_mode'];
          completed_at?: string | null;
          proof_image_url?: string | null;
          points_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'task_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      task_templates: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          description: string | null;
          category: Database['public']['Enums']['task_category'];
          icon: string;
          recurrence: Database['public']['Enums']['task_recurrence'];
          points_value: number;
          is_active: boolean;
          base_title: string | null;
          auto_assign: boolean;
          recurrence_config: Json;
          due_mode: Database['public']['Enums']['due_mode'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          title: string;
          description?: string | null;
          category?: Database['public']['Enums']['task_category'];
          icon?: string;
          recurrence?: Database['public']['Enums']['task_recurrence'];
          points_value?: number;
          is_active?: boolean;
          base_title?: string | null;
          auto_assign?: boolean;
          recurrence_config?: Json;
          due_mode?: Database['public']['Enums']['due_mode'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          title?: string;
          description?: string | null;
          category?: Database['public']['Enums']['task_category'];
          icon?: string;
          recurrence?: Database['public']['Enums']['task_recurrence'];
          points_value?: number;
          is_active?: boolean;
          base_title?: string | null;
          auto_assign?: boolean;
          recurrence_config?: Json;
          due_mode?: Database['public']['Enums']['due_mode'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_templates_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
        ];
      };
      task_template_assignees: {
        Row: {
          id: string;
          home_id: string;
          template_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          template_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          template_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_template_assignees_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'task_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_template_assignees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_template_assignees_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
        ];
      };
      task_assignees: {
        Row: {
          id: string;
          home_id: string;
          task_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          task_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          task_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_assignees_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_assignees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_assignees_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
        ];
      };
      task_reviews: {
        Row: {
          id: string;
          home_id: string;
          task_id: string;
          reviewer_id: string;
          vote: Database['public']['Enums']['task_review_vote'];
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          task_id: string;
          reviewer_id: string;
          vote: Database['public']['Enums']['task_review_vote'];
          emoji?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          task_id?: string;
          reviewer_id?: string;
          vote?: Database['public']['Enums']['task_review_vote'];
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          description: string | null;
          kind: Database['public']['Enums']['expense_kind'];
          amount: number;
          currency: string;
          paid_by: string;
          status: Database['public']['Enums']['expense_status'];
          receipt_image_url: string | null;
          recurrence: Database['public']['Enums']['expense_recurrence'];
          base_title: string | null;
          series_id: string | null;
          due_at: string | null;
          due_mode: Database['public']['Enums']['due_mode'];
          completed_at: string | null;
          recurrence_config: Json;
          auto_assign: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          title: string;
          description?: string | null;
          kind: Database['public']['Enums']['expense_kind'];
          amount?: number;
          currency?: string;
          paid_by: string;
          status?: Database['public']['Enums']['expense_status'];
          receipt_image_url?: string | null;
          recurrence?: Database['public']['Enums']['expense_recurrence'];
          base_title?: string | null;
          series_id?: string | null;
          due_at?: string | null;
          due_mode?: Database['public']['Enums']['due_mode'];
          completed_at?: string | null;
          recurrence_config?: Json;
          auto_assign?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          title?: string;
          description?: string | null;
          kind?: Database['public']['Enums']['expense_kind'];
          amount?: number;
          currency?: string;
          paid_by?: string;
          status?: Database['public']['Enums']['expense_status'];
          receipt_image_url?: string | null;
          recurrence?: Database['public']['Enums']['expense_recurrence'];
          base_title?: string | null;
          series_id?: string | null;
          due_at?: string | null;
          due_mode?: Database['public']['Enums']['due_mode'];
          completed_at?: string | null;
          recurrence_config?: Json;
          auto_assign?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_paid_by_fkey';
            columns: ['paid_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      expense_shares: {
        Row: {
          id: string;
          home_id: string;
          expense_id: string;
          user_id: string;
          share_amount: number;
          settlement_status: Database['public']['Enums']['expense_share_settlement_status'];
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          expense_id: string;
          user_id: string;
          share_amount?: number;
          settlement_status?: Database['public']['Enums']['expense_share_settlement_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          expense_id?: string;
          user_id?: string;
          share_amount?: number;
          settlement_status?: Database['public']['Enums']['expense_share_settlement_status'];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_shares_expense_id_fkey';
            columns: ['expense_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_shares_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_shares_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
        ];
      };
      task_swap_requests: {
        Row: {
          id: string;
          home_id: string;
          task_id: string;
          from_user_id: string;
          to_user_id: string;
          status: Database['public']['Enums']['task_swap_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          task_id: string;
          from_user_id: string;
          to_user_id: string;
          status?: Database['public']['Enums']['task_swap_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          task_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          status?: Database['public']['Enums']['task_swap_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_swap_requests_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_swap_requests_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_swap_requests_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_swap_requests_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      home_activity_events: {
        Row: {
          id: string;
          home_id: string;
          actor_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          summary: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          actor_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          summary: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          actor_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          summary?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'home_activity_events_home_id_fkey';
            columns: ['home_id'];
            isOneToOne: false;
            referencedRelation: 'homes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'home_activity_events_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_home_member: {
        Args: { p_home_id: string };
        Returns: boolean;
      };
      is_home_owner: {
        Args: { p_home_id: string };
        Returns: boolean;
      };
      is_home_admin: {
        Args: { p_home_id: string };
        Returns: boolean;
      };
      set_home_member_role: {
        Args: {
          p_home_id: string;
          p_user_id: string;
          p_role: Database['public']['Enums']['home_member_role'];
        };
        Returns: undefined;
      };
      create_home: {
        Args: { p_name: string };
        Returns: Json;
      };
      get_home_by_invite_code: {
        Args: { p_code: string };
        Returns: {
          id: string;
          name: string;
          invite_code: string;
        }[];
      };
      join_home_by_invite_code: {
        Args: { p_code: string };
        Returns: Json;
      };
      seed_default_home_tasks: {
        Args: { p_home_id: string };
        Returns: undefined;
      };
      seed_default_home_expenses: {
        Args: { p_home_id: string };
        Returns: undefined;
      };
      leave_home: {
        Args: { p_home_id: string };
        Returns: undefined;
      };
      kick_home_member: {
        Args: { p_home_id: string; p_user_id: string };
        Returns: undefined;
      };
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      get_home_leaderboard: {
        Args: { p_home_id: string };
        Returns: {
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          reputation_points: number;
          rank: number;
          tasks_pending: number;
          tasks_submitted: number;
          tasks_completed: number;
          tasks_overdue: number;
          task_points_earned: number;
        }[];
      };
    };
    Enums: {
      task_status:
        | 'PENDING'
        | 'SUBMITTED'
        | 'COMPLETED'
        | 'OVERDUE'
        | 'RESOLVED_LATE'
        | 'RESOLVED_BY_PEER'
        | 'SKIPPED';
      home_member_role: 'owner' | 'admin' | 'member';
      task_category: 'ZONE' | 'QUICK' | 'GROCERY';
      task_recurrence: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
      task_review_vote: 'APPROVE' | 'DISPUTE';
      task_swap_status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
      expense_kind: 'GROCERY' | 'HOUSE' | 'PEER';
      expense_status: 'OPEN' | 'SETTLED' | 'ARCHIVED';
      expense_recurrence: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
      expense_share_settlement_status: 'PENDING' | 'REQUESTED' | 'SETTLED';
      due_mode: 'DEADLINE' | 'EXECUTION';
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type Home = Tables<'homes'>;
export type HomeMember = Tables<'home_members'>;
export type Task = Tables<'tasks'>;
export type TaskTemplate = Tables<'task_templates'>;
export type Profile = Tables<'profiles'>;
export type TaskAssignee = Tables<'task_assignees'>;
export type TaskTemplateAssignee = Tables<'task_template_assignees'>;
export type TaskReview = Tables<'task_reviews'>;
export type Expense = Tables<'expenses'>;
export type ExpenseShare = Tables<'expense_shares'>;
export type TaskSwapRequest = Tables<'task_swap_requests'>;
export type HomeActivityEvent = Tables<'home_activity_events'>;

export type TaskAssigneeWithProfile = TaskAssignee & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
};

export type TaskWithRelations = Task & {
  task_assignees: TaskAssigneeWithProfile[];
};

export type TaskSwapRequestWithProfiles = TaskSwapRequest & {
  from_profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
  to_profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
};

export type HomeActivityEventWithActor = HomeActivityEvent & {
  actor: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
};

export type TaskTemplateAssigneeWithProfile = TaskTemplateAssignee & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
};

export type TaskTemplateWithRelations = TaskTemplate & {
  task_template_assignees: TaskTemplateAssigneeWithProfile[];
};

export type ExpenseShareWithProfile = ExpenseShare & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
};

export type ExpenseWithRelations = Expense & {
  payer: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
  expense_shares: ExpenseShareWithProfile[];
};
