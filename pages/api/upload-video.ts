import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Files } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
      uploadDir,
      keepExtensions: true,
    });

    const [fields, files]: [any, Files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    // Log the received files for debugging
    console.log('Received files:', files);

    const file = files.video?.[0] || files.video; // Handle both array and single file cases
    if (!file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Generate public URL for the uploaded file
    const fileName = path.basename(file.filepath);
    const fileUrl = `/uploads/${fileName}`;

    return res.status(200).json({ fileUrl });
  } catch (error: any) {
    console.error('Upload error details:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File size exceeds the limit (100MB)' });
    }
    return res.status(500).json({ error: `Upload failed: ${error.message || 'Unknown error'}` });
  }
} 
