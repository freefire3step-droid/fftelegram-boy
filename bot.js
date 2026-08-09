const TelegramBot = require('node-telegram-bot-api');

// Railway-এর Variable থেকে আপনার দেওয়া টোকেনটি নিবে
const token = process.env.BOT_TOKEN; 
const bot = new TelegramBot(token, { polling: true });

// লাইক এবং ডিসলাইকের ডাটা সেভ রাখার জন্য একটি অবজেক্ট
const likesData = {};

// ১. প্রিমিয়াম /start কমান্ড (ইন্টারেক্টিভ বাটনসহ)
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 FF Info', callback_data: 'ff_info' }, { text: '🔥 Create Post', callback_data: 'help_post' }],
        [{ text: '💻 Developer GitHub', url: 'https://github.com/' }] // এখানে আপনার গিটহাব লিংক দিতে পারেন
      ]
    }
  };

  bot.sendMessage(chatId, `হ্যালো *${userName}*! ⚡\nপ্রিমিয়াম ফ্রি ফায়ার বটে আপনাকে স্বাগতম। নিচের বাটনগুলো থেকে আপনার পছন্দের অপশনটি বেছে নিন:`, options);
});

// ২. লাইক/ডিসলাইক বট ফিচার (/post কমান্ড)
// কেউ "/post হ্যালো সবাই" লিখলে বট সেটি লাইক বাটনসহ একটি সুন্দর পোস্ট হিসেবে পাবলিশ করবে
bot.onText(/\/post (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const content = match[1];
  const postId = Date.now().toString(); // পোস্টের জন্য ইউনিক আইডি

  // এই পোস্টের লাইক-ডিসলাইক কাউন্ট জিরো থেকে শুরু হবে
  likesData[postId] = { up: 0, down: 0 };

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👍 0', callback_data: `up_${postId}` },
          { text: '👎 0', callback_data: `down_${postId}` }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, `📢 *নতুন পোস্ট:*\n\n${content}`, options);
});

// ৩. ফ্রি ফায়ার ইউজার ইনফো (Fake Loading Animation-সহ)
bot.onText(/\/info (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userUid = match[1];

  // প্রথমে একটি লোডিং মেসেজ পাঠাবে
  const sentMsg = await bot.sendMessage(chatId, `⏳ *${userUid}* এর ডাটা সার্ভার থেকে খোঁজা হচ্ছে...`, { parse_mode: 'Markdown' });

  // ২ সেকেন্ড পর মেসেজটি নিজে থেকেই আপডেট হয়ে রেজাল্ট দেখাবে (Premium Feel)
  setTimeout(() => {
    bot.editMessageText(`✅ *Player UID:* ${userUid}\n*Status:* Online 🟢\n*Level:* 72 (Demo)\n*Rank:* Heroic 🔥`, {
      chat_id: chatId,
      message_id: sentMsg.message_id,
      parse_mode: 'Markdown'
    });
  }, 2000);
});

// ৪. বাটন ক্লিকের অ্যাকশন কন্ট্রোল (Callback Queries)
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  // Start মেনুর বাটনে ক্লিক করলে স্ক্রিনে পপ-আপ মেসেজ দিবে
  if (data === 'ff_info') {
    bot.answerCallbackQuery(query.id, { text: 'ইনফো দেখতে টাইপ করুন: /info আপনার_ইউআইডি', show_alert: true });
  }
  if (data === 'help_post') {
    bot.answerCallbackQuery(query.id, { text: 'নতুন পোস্ট করতে টাইপ করুন: /post আপনার_লেখা', show_alert: true });
  }

  // লাইক বা ডিসলাইক বাটনে ক্লিক করলে রিয়েল-টাইমে সংখ্যা বাড়বে
  if (data.startsWith('up_') || data.startsWith('down_')) {
    const action = data.split('_')[0];
    const postId = data.split('_')[1];

    if (likesData[postId]) {
      if (action === 'up') likesData[postId].up += 1;
      if (action === 'down') likesData[postId].down += 1;

      // নতুন লাইক কাউন্ট দিয়ে বাটন আপডেট করা
      const newMarkup = {
        inline_keyboard: [
          [
            { text: `👍 ${likesData[postId].up}`, callback_data: `up_${postId}` },
            { text: `👎 ${likesData[postId].down}`, callback_data: `down_${postId}` }
          ]
        ]
      };

      bot.editMessageReplyMarkup(newMarkup, {
        chat_id: chatId,
        message_id: messageId
      });
    }
    // টেলিগ্রামকে বোঝানো যে ক্লিক রিসিভ হয়েছে (লোডিং আইকন থামাতে)
    bot.answerCallbackQuery(query.id); 
  }
});

console.log('Premium Bot has started successfully!');
