export const uploadImageForSchedule = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
  
    const res = await fetch('http://localhost:5000/parse', {
      method: 'POST',
      body: formData,
    });
  
    if (!res.ok) throw new Error('Failed to parse image');
    return res.json(); // returns { entries: [...] }
    };
