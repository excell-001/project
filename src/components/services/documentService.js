import { supabase } from './supabaseClient';

const BUCKET_NAME = 'supervision-files';

export const documentService = {
  async uploadDocument({ supervisionId, userId, docType, file, caption }) {
    const ext = file.name.split('.').pop();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `${supervisionId}/${docType}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        supervision_id: supervisionId,
        uploaded_by: userId,
        doc_type: docType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        caption: caption || null,
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      throw dbError;
    }

    return data;
  },

  async getSignedUrl(filePath, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },

  async deleteDocument(doc) {
    await supabase.storage.from(BUCKET_NAME).remove([doc.file_path]);
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id);
    if (error) throw error;
  },
};