import { supabase } from './supabaseClient';

export const teacherService = {
  async getTeachers(schoolId) {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        subject:subjects(id, code, name),
        profile:profiles(id, email, role)
      `)
      .eq('school_id', schoolId)
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createTeacher(payload) {
    // Jika email cocok dengan akun di profiles yang belum tertaut, tautkan otomatis
    let linkedProfileId = null;
    if (payload.email) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', payload.email.trim())
        .eq('role', 'teacher')
        .maybeSingle();
      if (existingProfile) {
        linkedProfileId = existingProfile.id;
      }
    }

    const { data, error } = await supabase
      .from('teachers')
      .insert({
        ...payload,
        profile_id: linkedProfileId,
      })
      .select(`*, subject:subjects(id, code, name)`)
      .single();

    if (error) throw error;
    return data;
  },

  async updateTeacher(teacherId, payload) {
    let updateData = { ...payload };

    if (payload.email) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', payload.email.trim())
        .eq('role', 'teacher')
        .maybeSingle();
      if (existingProfile) {
        updateData.profile_id = existingProfile.id;
      }
    }

    const { data, error } = await supabase
      .from('teachers')
      .update(updateData)
      .eq('id', teacherId)
      .select(`*, subject:subjects(id, code, name)`)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTeacher(teacherId) {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', teacherId);
    if (error) throw error;
  },
};