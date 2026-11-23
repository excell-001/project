import { supabase } from './supabaseClient';

export const schoolService = {
  async getSchoolById(schoolId) {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateSchool(schoolId, payload) {
    const { data, error } = await supabase
      .from('schools')
      .update(payload)
      .eq('id', schoolId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getSubjects(schoolId) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('school_id', schoolId)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createSubject(schoolId, { code, name }) {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ school_id: schoolId, code, name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};