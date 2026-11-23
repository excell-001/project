import { supabase } from './supabaseClient';

export const supervisionService = {
  async getSupervisions(schoolId) {
    const { data, error } = await supabase
      .from('supervisions')
      .select(`
        *,
        teacher:teachers(id, full_name, nip, rank_grade),
        subject:subjects(id, code, name),
        supervisor:profiles!supervisions_supervisor_id_fkey(id, full_name, nip)
      `)
      .eq('school_id', schoolId)
      .order('supervision_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getSupervisionDetail(supervisionId) {
    const [
      { data: supervision, error: supErr },
      { data: items, error: itemErr },
      { data: scores, error: scoreErr },
      { data: recommendation },
      { data: documents },
      { data: signatures },
    ] = await Promise.all([
      supabase
        .from('supervisions')
        .select(`
          *,
          school:schools(*),
          teacher:teachers(*, subject:subjects(id, code, name)),
          subject:subjects(id, code, name),
          supervisor:profiles!supervisions_supervisor_id_fkey(id, full_name, nip, email)
        `)
        .eq('id', supervisionId)
        .single(),
      supabase
        .from('assessment_items')
        .select('*')
        .order('component', { ascending: true })
        .order('item_order', { ascending: true }),
      supabase
        .from('assessment_scores')
        .select('*')
        .eq('supervision_id', supervisionId),
      supabase
        .from('recommendations')
        .select('*')
        .eq('supervision_id', supervisionId)
        .maybeSingle(),
      supabase
        .from('documents')
        .select('*')
        .eq('supervision_id', supervisionId)
        .order('created_at', { ascending: false }),
      supabase
        .from('signatures')
        .select('*')
        .eq('supervision_id', supervisionId),
    ]);

    if (supErr) throw supErr;
    if (itemErr) throw itemErr;
    if (scoreErr) throw scoreErr;

    return {
      supervision,
      items: items || [],
      scores: scores || [],
      recommendation: recommendation || null,
      documents: documents || [],
      signatures: signatures || [],
    };
  },

  async createSupervision(payload) {
    const { data, error } = await supabase
      .from('supervisions')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async saveAssessmentScores(supervisionId, scoreEntries, summaryResult) {
    if (scoreEntries.length > 0) {
      const { error: upsertErr } = await supabase
        .from('assessment_scores')
        .upsert(scoreEntries, { onConflict: 'supervision_id,item_id' });
      if (upsertErr) throw upsertErr;
    }

    const nextStatus = summaryResult.allCompleted
      ? 'awaiting_signature'
      : 'in_progress';

    const { data, error: updateErr } = await supabase
      .from('supervisions')
      .update({
        planning_score: summaryResult.planningScore,
        execution_score: summaryResult.executionScore,
        evaluation_score: summaryResult.evaluationScore,
        final_score: summaryResult.finalScore,
        category: summaryResult.category,
        status: nextStatus,
      })
      .eq('id', supervisionId)
      .select()
      .single();

    if (updateErr) throw updateErr;
    return data;
  },

  async saveRecommendation(supervisionId, payload) {
    const { data, error } = await supabase
      .from('recommendations')
      .upsert(
        { supervision_id: supervisionId, ...payload },
        { onConflict: 'supervision_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async saveSignature(payload) {
    const { data, error } = await supabase
      .from('signatures')
      .upsert(payload, { onConflict: 'supervision_id,signer_role' })
      .select()
      .single();
    if (error) throw error;

    // Cek apakah tanda tangan supervisor & guru keduanya sudah lengkap
    const { data: allSigs } = await supabase
      .from('signatures')
      .select('signer_role')
      .eq('supervision_id', payload.supervision_id);

    const roles = new Set((allSigs || []).map((s) => s.signer_role));
    if (roles.has('supervisor') && roles.has('teacher')) {
      await supabase
        .from('supervisions')
        .update({ status: 'completed' })
        .eq('id', payload.supervision_id);
    }

    return data;
  },
};