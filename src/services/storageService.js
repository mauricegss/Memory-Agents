import { supabase } from '../lib/supabase';

export async function uploadFileToStorage(file, bucket, folderPath) {
  const fileName = `${folderPath}/${Math.random().toString(36).substring(2)}.jpg`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
    
  return publicUrl;
}

export const storageService = {
  uploadImage: uploadFileToStorage
};
