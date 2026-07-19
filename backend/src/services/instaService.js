import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import path from 'path';
import fs from 'fs';
import https from 'https';

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const fetchInstagramMetadata = async (url) => {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    
    let ogImage = imageMatch ? imageMatch[1].replace(/&amp;/g, '&') : null;
    let ogUsername = null;
    if (descMatch) {
      const userMatch = descMatch[1].match(/- ([A-Za-z0-9_.]+) on [A-Z][a-z]+ \d+, \d+:/);
      if (userMatch) ogUsername = userMatch[1];
    }
    return { ogImage, ogUsername };
  } catch (err) {
    return { ogImage: null, ogUsername: null };
  }
};


export const processInstaPost = async (url) => {
  const downloadDir = path.join(process.cwd(), 'temp_insta');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const uniqueId = `insta_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  try {
    const { snapsave } = await import('snapsave-media-downloader');
    const [result, metadata] = await Promise.all([
      snapsave(url),
      fetchInstagramMetadata(url)
    ]);
    const { ogImage, ogUsername } = metadata;

    if (!result || !result.success || !result.data || !result.data.media || result.data.media.length === 0) {
      throw new Error("Failed to extract media from Instagram URL");
    }

    const geminiFileUris = [];
    const uploadedFiles = [];
    let isVideo = false;

    let index = 0;
    for (const item of result.data.media) {
      const ext = item.type === 'video' ? '.mp4' : '.jpg';
      const fileName = `${uniqueId}_${index}${ext}`;
      const filePath = path.join(downloadDir, fileName);
      
      await downloadFile(item.url, filePath);
      
      const mimeType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
      if (item.type === 'video') isVideo = true;

      const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType: mimeType,
        displayName: fileName,
      });

      geminiFileUris.push(uploadResult.file.uri);
      uploadedFiles.push({ name: uploadResult.file.name, uri: uploadResult.file.uri, mimeType });
      fs.unlinkSync(filePath);
      index++;
    }

    // 4. Generate summary using Gemini
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    
    // Prepare parts (URIs and text prompt)
    const promptParts = [
      { text: "Analyze this Instagram post (could be an image, video, or carousel). Provide a concise, engaging summary of what you see. Mention the mood, main subjects, and any noticeable actions or text.\n\nALSO, if you can clearly see an Instagram username/handle anywhere in the media (e.g. from a watermark, tag, or text), extract it. If not, just use 'Instagram User'.\n\nFINALLY, create a short, catchy title (max 50 chars) for this post.\n\nReturn EXACTLY this JSON format and nothing else: {\"title\": \"catchy title\", \"summary\": \"your summary here\", \"author\": \"extracted author or Instagram User\"}" }
    ];
    
    for (const f of uploadedFiles) {
      promptParts.push({
        fileData: {
          mimeType: f.mimeType,
          fileUri: f.uri
        }
      });
      // Wait for ACTIVE state if it's a video
      if (f.mimeType.startsWith('video')) {
        let fileState = await fileManager.getFile(f.name);
        while (fileState.state === 'PROCESSING') {
          await new Promise(resolve => setTimeout(resolve, 2500));
          fileState = await fileManager.getFile(f.name);
        }
      }
    }

    let summary = "Summary not available.";
    let author = "Instagram User";
    let title = "Instagram Post";
    try {
      const result = await model.generateContent(promptParts);
      let text = result.response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.error("Gemini JSON parse failed. Raw text:", text);
      }
      
      if (parsed) {
        summary = parsed.summary || summary;
        author = parsed.author || author;
        title = parsed.title || title;
      }
    } catch (summaryErr) {
      console.error("Gemini Summary Error Stack:", summaryErr.stack || summaryErr.message || summaryErr);
      if (summaryErr.message && summaryErr.message.includes('processing')) {
         summary = "Media is still processing. Please try asking questions in a few moments.";
      }
    }

    return {
      author: ogUsername || author,
      title,
      caption: '',
      mediaType: isVideo ? 'video' : (geminiFileUris.length > 1 ? 'carousel' : 'image'),
      geminiFileUris,
      summary,
      thumbnail: ogImage || result.data.media[0].thumbnail || result.data.media[0].url || ''
    };

  } catch (err) {
    // Cleanup any lingering files on error
    try {
      const allFiles = fs.readdirSync(downloadDir).filter(f => f.startsWith(uniqueId));
      for (const file of allFiles) fs.unlinkSync(path.join(downloadDir, file));
    } catch (e) {}
    
    console.error("Insta process error:", err);
    throw new Error(`Failed to process Instagram post: ${err.message}`);
  }
};
