export const uploadPhoto = async (uri: string, userId: string) => {
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('entry-photos')
    .upload(fileName, photoBlob);
    
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('entry-photos')
    .getPublicUrl(fileName);
    
  return publicUrl;
};