// File: api/bot.js (with welcome message and debugging)
import axios from 'axios';
import { Buffer } from 'buffer';

// --- CONFIGURATION ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// --- IMPORTANT: UPDATE THESE VALUES ---
const GITHUB_REPO_OWNER = 'abyssinialibrary'; // Replace with your GitHub username
const GITHUB_REPO_NAME = 'abyssinia-library-v2'; // The name of your existing repository
const GITHUB_REPO_PATH = 'src/content/summaries';
// ---

async function sendMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, { chat_id: chatId, text: text, parse_mode: 'Markdown' });
}

async function createFileOnGitHub(filePath, content, commitMessage) {
    const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`;
    const encodedContent = Buffer.from(content).toString('base64');
    const data = { message: commitMessage, content: encodedContent, branch: 'main' };
    const headers = { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' };
    await axios.put(url, data, { headers });
}

export default async function handler(request, response) {
    // Debugging log
    console.log("--- Environment Variables ---");
    console.log("TELEGRAM_BOT_TOKEN exists:", !!TELEGRAM_BOT_TOKEN);
    console.log("ADMIN_USER_ID exists:", !!ADMIN_USER_ID);
    console.log("GITHUB_TOKEN exists:", !!GITHUB_TOKEN);
    console.log("---------------------------");

    try {
        const { body } = request;
        if (!body || !body.message) {
            return response.status(200).send('OK. Not a message.');
        }

        const message = body.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text || ''; // Ensure text is not undefined

        if (!TELEGRAM_BOT_TOKEN || !ADMIN_USER_ID || !GITHUB_TOKEN) {
            console.error("One or more environment variables are missing!");
            return response.status(500).send('Server configuration error.');
        }

        // --- SECURITY CHECK ---
        if (userId.toString() !== ADMIN_USER_ID) {
            await sendMessage(chatId, "❌ You are not authorized to use this bot.");
            return response.status(200).send('Unauthorized user.');
        }
        
        // --- NEW: HANDLE THE /start COMMAND ---
        if (text === '/start') {
            const welcomeMessage = `👋 Welcome, Admin!
            
This is your private **Content Assistant Bot** for the Abyssinia Library.

**To add a new book summary:**
1. Go to your public channel and find the book file message.
2. **Forward** that message here.
3. **Reply** to the forwarded message with the summary details in this format:

\`\`\`
Title: The Book Title
Author: The Author's Name
Category: The Book's Category
Description: A short, one-sentence description.
---
The full, detailed summary text starts here...
\`\`\`

The bot will handle the rest!`;

            await sendMessage(chatId, welcomeMessage);
            return response.status(200).send('Welcome message sent.');
        }


        // --- WORKFLOW CHECK FOR ADDING A BOOK ---
        if (!message.reply_to_message || !message.reply_to_message.forward_from_chat) {
            await sendMessage(chatId, "⚠️ Invalid command. Please send `/start` for instructions or use the forward-and-reply method to add a new book.");
            return response.status(200).send('Invalid workflow.');
        }

        // --- DATA EXTRACTION ---
        const forwardedMsg = message.reply_to_message;
        const channelUsername = forwardedMsg.forward_from_chat.username;
        const messageId = forwardedMsg.forward_from_message_id;
        const downloadUrl = `https://t.me/${channelUsername}/${messageId}`;

        const parts = text.split('\n---\n');
        if (parts.length < 2) {
            await sendMessage(chatId, "❌ Invalid format. Please make sure your summary details are separated by `---`.");
            return response.status(200).send('Invalid format.');
        }

        const frontmatterText = parts[0];
        const contentText = parts[1].trim();

        const frontmatter = {};
        frontmatterText.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                frontmatter[key.trim().toLowerCase()] = valueParts.join(':').trim();
            }
        });
        
        const { title, author, category, description } = frontmatter;
        if (!title || !author || !category || !description) {
            await sendMessage(chatId, "❌ Missing fields. Please ensure Title, Author, Category, and Description are all present.");
            return response.status(200).send('Missing fields.');
        }

        // --- FILE CREATION ---
        const finalMdContent = `---
title: "${title}"
author: "${author}"
category: "${category}"
description: "${description}"
pubDate: ${new Date().toISOString().split('T')[0]}
downloadUrl: "${downloadUrl}"
---

${contentText}
`;
        
        const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.md`;
        const filePath = `${GITHUB_REPO_PATH}/${fileName}`;
        const commitMessage = `feat: add summary for "${title}" via bot`;

        await createFileOnGitHub(filePath, finalMdContent, commitMessage);
        await sendMessage(chatId, `✅ Success! Summary for *${title}* has been added. A new deployment has started automatically.`);
        
        return response.status(200).send('OK');

    } catch (error) {
        console.error('Error processing request:', error);
        if (request.body && request.body.message) {
            await sendMessage(request.body.message.chat.id, `🔥 An error occurred: ${error.message}`);
        }
        return response.status(500).send('Internal Server Error');
    }
}