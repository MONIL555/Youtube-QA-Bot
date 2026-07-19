import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.js';
import { parseDocument } from '../services/fileParserService.js';
import { AppError } from '../middleware/errorHandler.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/msword', // doc
    'application/vnd.ms-powerpoint', // ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'text/plain'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF, DOCX, TXT, and PPT are allowed.', 400), false);
  }
};

export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export const processFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const { path: filePath, mimetype, originalname } = req.file;

    // Extract text from the file
    const extractedText = await parseDocument(filePath, mimetype);

    // Delete the temporary uploaded file to save space
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    // Use Gemini to generate a short summary
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Summarize the following document in 2-3 concise sentences:\n\n${extractedText.substring(0, 10000)}`;
    
    let summary = 'Document summary not available.';
    try {
      const result = await model.generateContent(prompt);
      summary = result.response.text();
    } catch (summaryErr) {
      console.error("Error generating summary:", summaryErr);
    }

    // Save document to DB
    const doc = await Document.create({
      userId: req.user.id,
      filename: req.file.filename,
      originalName: originalname,
      fileType: mimetype,
      extractedText,
      summary
    });

    res.status(200).json({
      success: true,
      file: doc
    });
  } catch (err) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const files = await Document.find({ userId: req.user.id })
      .select('-extractedText') // Don't send the full text for the history list
      .sort({ createdAt: -1 })
      .limit(20);
    const formatted = files.map(f => ({
      videoId: f._id, // Map for VideoCard key and onClick
      id: f._id,
      url: f.originalName, // Show filename in place of URL
      title: f.summary && !f.summary.includes('processing') ? f.summary.substring(0, 70) + '...' : f.originalName,
      channel: 'Local Document',
      createdAt: f.createdAt,
      mediaType: 'document'
    }));

    res.status(200).json({ success: true, files: formatted });
  } catch (err) {
    next(err);
  }
};
