import { supabase } from './supabaseClient';

export const authService = {
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        school:schools (
          id,
          name,
          npsn,
          principal_name,
          academic_year_default,
          score_config
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Jika role guru, ambil juga relasi record di tabel teachers
    let teacherRecord = null;
    if (data?.role === 'teacher') {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*, subject:subjects(id, name, code)')
        .eq('profile_id', userId)
        .maybeSingle();
      teacherRecord = teacherData;
    }

    return { ...data, teacherRecord };
  },
};