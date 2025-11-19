import { SupabaseClient } from "../supabase/supabaseClient.ts";

export class AgentController {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async index() {
    const { data, error } = await this.supabaseClient
      .from('agents')
      .select(`
        *
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async show(id: string) {
    const { data, error } = await this.supabaseClient
      .from('agents')
      .select(`
        *
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  async getActive() {
    const { data, error } = await this.supabaseClient
      .from('agents')
      .select(`
        *
      `)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async store(data: {
    name?: string;
    legal_name?: string;
    unique_no?: string;
    status?: string;
    disabled_reason?: string;
    parent_id?: string;
    user_id?: string;
  }) {
    const { data: agent, error } = await this.supabaseClient
      .from('agents')
      .insert([data])
      .select(`
        *
      `)
      .single();

    if (error) throw error;
    return agent;
  }

  async update(id: string, data: {
    name?: string;
    legal_name?: string;
    unique_no?: string;
    status?: string;
    disabled_reason?: string;
    parent_id?: string;
    user_id?: string;
  }) {
    const { data: agent, error } = await this.supabaseClient
      .from('agents')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select(`
        *
      `)
      .single();

    if (error) throw error;
    return agent;
  }

  async destroy(id: string) {
    const { error } = await this.supabaseClient
      .from('agents')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) throw error;
    return true;
  }
} 