import { SupabaseClient } from "../supabase/supabaseClient.ts";

// Add type definition for POS data
type PosStatus = 'active' | 'inactive';

interface PosData {
  name: string;
  disabled_reason: string;
  agent_id: string;
  status: PosStatus;
  public_key?: string;
}

export class PosController {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Create a new POS entry
   */
  async store(data: PosData) {
    const { data: pos, error } = await this.supabaseClient
      .from('points_of_sale')
      .insert([{ 
        name: data.name,
        disabled_reason: data.disabled_reason,
        agent_id: data.agent_id,
        status: data.status
      }])
      .select()
      .single();

    if (error) throw error;
    return pos;
  }

  /**
   * Get all POS entries
   */
  async index() {
    const { data, error } = await this.supabaseClient
      .from('points_of_sale')
      .select(`
        *,
        agent:agents(*)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get a single POS entry
   */
  async show(id: string) {
    const { data, error } = await this.supabaseClient
      .from('points_of_sale')
      .select(`
        *,
        agent:agents(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a POS entry
   */
  async update(id: string, data: Partial<PosData>) {
    const { data: pos, error } = await this.supabaseClient
      .from('points_of_sale')
      .update({ 
        name: data.name,
        disabled_reason: data.disabled_reason,
        agent_id: data.agent_id,
        status: data.status,
        public_key: data.public_key,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return pos;
  }

  /**
   * Delete a POS entry
   */
  async destroy(id: string) {
    const { error } = await this.supabaseClient
      .from('points_of_sale')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) throw error;
    return true;
  }

  async getActive() {
    const { data, error } = await this.supabaseClient
      .from('points_of_sale')
      .select(`
        *,
        agent:agents(*)
      `)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get active POS entries where public_key is null
   */
  async getActiveUnconfigured() {
    const { data, error } = await this.supabaseClient
      .from('points_of_sale')
      .select(`
        *,
        agent:agents(*)
      `)
      .eq('status', 'active')
      .is('public_key', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
} 