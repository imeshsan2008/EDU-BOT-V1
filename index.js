const fs = require("fs");
const path = require("path");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const express = require("express");
const qrcode = require("qrcode"); // QR කේත නිර්මාණය සඳහා
const sessionId = "session100"; // සෙෂන් සඳහා තනි අංකය
const app = express();
const port = 8000; 
const bot_name = "EDUBOT";
const menuimg = "https://i.ibb.co/cgBMdb7/image.png";
const pastRequests = new Map(); // To track user navigation through menus
const menuRequests = new Map();
const textbookRequests = new Map(); // To track user navigation through menus
const os = require('os');

const { downloadPDFsFromFolder,downloadcredsFromFolder } = require('./mega');
const { checkPrime } = require("crypto");


  
// QR කේත URL එක හඳුනාගැනීම සඳහා
let qrCodeURL = "https://i.ibb.co/cgBMdb7/image.png";

const serviceName = process.env.SERVICE_NAME;
// Get total memory
const totalMemory = os.totalmem();

// Get free memory
const freeMemory = os.freemem();
const usedMemory = totalMemory - freeMemory;
const usedMemoryMB = (usedMemory / (1024 * 1024)).toFixed(2);

const RAM = usedMemoryMB;
console.log('RAM: ',RAM);

let botSettings = {
  PREFIX: ".",
  pastEnabled:true,
  ALLOW_GROUP_MESSAGES: true,
  ALLOW_PRIVATE_MESSAGES: true,
};
const {
  PREFIX,
  pastEnabled,
  ALLOW_GROUP_MESSAGES,
  ALLOW_PRIVATE_MESSAGES,
  
} = botSettings;

console.log(`Detected service name: ${serviceName}`);

async function addReaction(sock, messageKey, reactionEmoji) {
  try {
    if (messageKey) {
      await sock.sendMessage(messageKey.remoteJid, {
        react: { text: reactionEmoji, key: messageKey },
      });
      console.log("Reaction added successfully!");
    }
  } catch (error) {
    console.error("Error adding reaction:", error);
  }
}


async function sendPDF(sock, sender, folderPath, subject, year) {
  try {
    const uploadingText = `📤 Uploading ${subject} - ${year}, please wait... 
    ${"> " + bot_name + " | O/L Past Papers Downloader"}`;
    
    const subjectYearFolder = path.join(folderPath, subject, year);
    // console.log('subyear', subjectYearFolder);

    // Check if the directory exists
    if (!fs.existsSync(subjectYearFolder)) {
      throw new Error("The specified folder does not exist.");
    }

    // List all PDF files in the directory
    const filesInFolder = fs.readdirSync(subjectYearFolder).filter(file => file.endsWith('.pdf'));

    await sock.sendMessage(sender, { text: uploadingText });

    if (filesInFolder.length === 0) {
      throw new Error("No PDF files were found.");
    }

    // Send each PDF file
    for (const file of filesInFolder) {
      const fullPath = path.join(subjectYearFolder, file);
      const fileBuffer = fs.readFileSync(fullPath);

      await sock.sendMessage(sender, {
        document: fileBuffer,
        mimetype: "application/pdf",
        fileName: file,
        caption: `> ${bot_name}`,
      });

      // Optionally delete the file after sending
      // fs.unlinkSync(fullPath);
       // Remove the file from the folder after sending
    }

    console.log("PDF files sent successfully.");
  } catch (error) {
    console.error("Error in sendPDF:", error.message);
    await sock.sendMessage(sender, {
      text: `❌ An error occurred while processing your request: ${error.message}\n> ${bot_name}`,
    });
  }
}

async function sendtextbookfromMega(sock, sender, folderPath,  subject) {
  try {
    const uploadingText = `📤 Uploading ${subject}, please wait... 
    ${"> " + bot_name + " | O/L Text Books Downloader"}`;
    
    const subjectFolder = path.join(folderPath, subject);
    // console.log('subyear', subjectYearFolder);

    // Check if the directory exists
    if (!fs.existsSync(subjectFolder)) {
      throw new Error("The specified folder does not exist.");
    }

    // List all PDF files in the directory
    const filesInFolder = fs.readdirSync(subjectFolder).filter(file => file.endsWith('.pdf'));

    await sock.sendMessage(sender, { text: uploadingText });

    if (filesInFolder.length === 0) {
      throw new Error("No PDF files were found.");
    }

    // Send each PDF file
    for (const file of filesInFolder) {
      const fullPath = path.join(subjectFolder, file);
      const fileBuffer = fs.readFileSync(fullPath);

      await sock.sendMessage(sender, {
        document: fileBuffer,
        mimetype: "application/pdf",
        fileName: file,
        caption: `> ${bot_name}`,
      });

      // Optionally delete the file after sending
      // fs.unlinkSync(fullPath);
       // Remove the file from the folder after sending
    }

    console.log("PDF files sent successfully.");
  } catch (error) {
    console.error("Error in sendPDF:", error.message);
    await sock.sendMessage(sender, {
      text: `❌ An error occurred while processing your request: ${error.message}\n> ${bot_name}`,
    });
  }
}
async function handleMenuCommand(sock, messageKey, sender, menuMsgId,pushname) {
  await addReaction(sock, messageKey, "📃");
  const menuText = `
👋 *HELLO ${pushname}!*

╭─🌟 「 *System Info* 」 🌟  
│ 💻 *RAM USAGE* - ${RAM}  
│ ⏱️ *RUNTIME* -   
╰──────────●●►  

╭──────────●●►  
│ 📜 *Menu List*  
│ ────────────────  
│   
│ - *${PREFIX}alive* - Check if the Bot is Alive  
│ - *${PREFIX}text* - Download O/L Textbooks  
│ - *${PREFIX}past* - Download 5 Years of O/L Past Papers  
│  
╰───────────●●►  

${"> " + bot_name}
`;


  
const imageMessage = {
  image: { url: menuimg },  // Provide the URL of the image you want to send
  caption: menuText, // Add the menu text as the caption for the image
};

const sentmessage = await sock.sendMessage(sender, imageMessage); // Directly pass the imageMessage object

  menuRequests.set(sender, { menuMsgId: sentmessage.key.id });
}



async function alivemessage(sock, messageKey, sender, pushname) {
  await addReaction(sock, messageKey, "📃");
  const AliveText = `
  👋 *HELLO ${pushname}!*  
╭─🌟 「 *System Info* 」 🌟  
│ 💻 *RAM USAGE* - ${RAM}  
│ ⏱️ *RUNTIME* -  
╰──────────●●►  
╭──────────●●►  
│ 📜 *Contact Information & Developer Profile*  
│   ────────────────  
│    
│ 👨‍💻 *Developer:*  
│    💻 *Imesh Sandeepa*  
│
│ 📱 *WhatsApp:*  
│    📲 *+94768902513*  
│
│ 📧 *Email:*
│    ✉️ *imeshsan2008@gmail.com*  
│
│ 🌐 *Website:* 
│    🔗 *https://imeshsan2008.github.io/*  
│
│ 🚀 *.menu to access the command panel*
|  
│
╰───────────●●►  
  
${"> " + bot_name}
`;
  
const imageMessage = {
  image: { url: menuimg },  // Provide the URL of the image you want to send
  caption: AliveText, // Add the menu text as the caption for the image
};

const sentmessage = await sock.sendMessage(sender, imageMessage); // Directly pass the imageMessage object

  menuRequests.set(sender, { menuMsgId: sentmessage.key.id });
}
// Function to send the subject menu
async function sendSubjectMenu(sock, sender, messageKey) {
  await addReaction(sock, messageKey, "📂");

  const subjectMenu = `
╭─「 *Subject Menu* 」
│ *O/L Past Papers*
│
│*Main Subjects*
│-----------------
│ 1. Buddhism
│ 2. Sinhala Language
| 3. Sinhala Literary
│ 4. Mathematics
│ 5. English Language
│ 6. Science
│ 7. History
│
│*First Group Subject*
│-----------------
│  8. Business & Accounting Studies
│  9. Citizenship Education
| 10.Communication & Media Studies
|
│*Second Group Subject*
│-----------------
│ 11. Art 
│ 12. Drama
│ 13. Music
│ 14. Dancing
│
│*Third Group Subject*
│-----------------
│ 15. Information and Communication Technology 
│ 16. Health & Physical Education
| 17. Agriculture & Food Technology
|  
│
│
│ *Reply to number or .past <number>*
╰───────────────●●►

${"> " + bot_name + " | O/L Past Paper Downloader"}`;

const imageMessage = {
  image: { url: menuimg },  // Provide the URL of the image you want to send
  caption: subjectMenu, // Add the menu text as the caption for the image
};

const sentmessage = await sock.sendMessage(sender, imageMessage); 


  pastRequests.set(sender, { stage: "subject", menuMsgId: sentmessage.key.id });
}
//  console.log(pastRequests);

// Function to send the subject menu
async function sendtextbooksSubjectMenu(sock, sender, messageKey) {
  await addReaction(sock, messageKey, "📂");

  const subjectMenu = `
╭─「 *Text Books Menu* 」
│ *O/L Text Books*
│
│*Main Subjects*
│-----------------
│ 1. Buddhism
│ 2. Sinhala Language
| 3. Sinhala Literary
│ 4. Mathematics
│ 5. English Language
│ 6. Science
│ 7. History
│
│*First Group Subject*
│-----------------
│ 8. Business & Accounting Studies
│ 9. Citizenship Education
| 10. Communication & Media Studies
│
│*Third Group Subject*
│-----------------
│ 11. Information and Communication Technology 
│ 12. Health & Physical Education
│ 13. Agriculture & Food Technology
|
|
│ *Reply to number or .past <number>*
╰───────────────●●►

${"> " + bot_name + " | O/L Text Books Downloader"}`;
const imageMessage = {
  image: { url: menuimg },  // Provide the URL of the image you want to send
  caption: subjectMenu, // Add the menu text as the caption for the image
};

const sentmessage = await sock.sendMessage(sender, imageMessage); 


  textbookRequests.set(sender, { stage: "textbooks", menuMsgId: sentmessage.key.id });
}
// Function to send the year menu
async function sendYearMenu(sock, sender, subject) {
  
  const yearMenu = `
╭─「 ${subject} Year Menu 」
│ 1. 2023(2024)
│ 2. 2022(2023)
│ 3. 2021(2022)
│ 4. 2020
│ 5. 2019
╰───────────────●●►

${"> " + bot_name + " | O/L Past Paper Downloader"}`;

  const sentMessage = await sock.sendMessage(sender, {
    text: yearMenu,
  });

  pastRequests.set(sender, {
    stage: "year",
    subject,
    menuMsgId: sentMessage.key.id,
  });
}
async function fetchPastPapers(sock, sender, subject, year) {
  const folderPath = `db/past/${subject}/${year}`;
 
  const downloadingmessage =`📥 Downloading ${subject} - ${year}, please wait... 

  ${"> " + bot_name + " | O/L Past Paper Downloader"}`;


  await sock.sendMessage(sender, { text:downloadingmessage});



    await sendPDFFromMega(sock, sender, folderPath,subject, year);
    
}

async function fetchtextbooks(sock, sender, textboook) {
  // console.log(textboook);
  
  const folderPath = `db/textbooks/`;

  // await sock.sendMessage(sender, { text:downloadingmessage});


    await sendtextbookfromMega(sock, sender, folderPath,textboook);
    
}
// බොට් ආරම්භ කිරීමේ විධානය
async function startBot(sessionId) {
  console.log(`Starting bot for session: ${sessionId}...`);

  const authStatePath = path.join("auth_info", sessionId);
  const { state, saveCreds } = await useMultiFileAuthState(authStatePath);
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // Terminal එකේ QR කේතය නොපෙන්වන්න
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "close") {
      console.log(
        `Session ${sessionId}: Connection closed, attempting to reconnect...`
      );
      setTimeout(() => startBot(sessionId), 5000);
    } else if (connection === "open") {
      
      console.log(`Session ${sessionId}: Bot connected successfully!`);

      app.get("/", (res) => {
        res.send("<h1>BOT STARTED</h1>");
      
      });
    }

    if (qr) {
      console.log(`Session ${sessionId}: QR code generated.`);
      try {
        qrCodeURL = await qrcode.toDataURL(qr); // QR කේතය URL එකක් ලෙස පවත්වන්න
      } catch (err) {
        console.error(`Error generating QR code: ${err.message}`);
      }
    }

    if (lastDisconnect?.error) {
      console.error(
        `Session ${sessionId}: Connection error:`,
        lastDisconnect.error
      );
    }
  });
  

  sock.ev.on("messages.upsert", async (messageUpdate) => {
    try {
            const message = messageUpdate.messages?.[0];
      if (!message || !message.key) return;
      const sender = message.key.remoteJid; // Message sender
      if (!sender) return;
      const isGroup = sender.endsWith("@g.us");
      const isNewsletterSender = sender.includes("@newsletter");
      const isBroadcastSender = sender.includes("@broadcast");
      const contextInfo = message.message?.extendedTextMessage?.contextInfo;
      const quotedMsgId = contextInfo?.stanzaId;
      const messageKey = message.key;
      const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text;
      const menuMsgId = message.key.id;

      const request = pastRequests.get(sender);

      const textbooksrequest = textbookRequests.get(sender);
      const subjects = {
        1: "Buddhism",
        2: "Sinhala Language",
        3: "Sinhala Literary",
        4: "Mathematics",
        5: "English Language",
        6: "Science",
        7: "History",
        8: "Business & Accounting Studies",
        9: "Citizenship Education",
        10: "Communication & Media Studies",
        11: "Art",
        12: "Drama",
        13: "Music",
        14: "Dancing",
        15: "Information and Communication Technology",
        16: "Health & Physical Education",
        17: "Agriculture & Food Technology"
    };
        

    const textbook = subjects[text];
    // const incu =   text.split(' ')[0] === `${PREFIX}text`
    let final;

        if (text) { // Check if text is not undefined or null
            final = text.split(' ')[1];
        }
    const latsfinal = subjects[final];
    const latssfinal = subjects[final];
    
      const subject = subjects[text]; // Ignore messages from newsletters and broadcasts
      const pushname = message.pushName || 'User';

      if (isNewsletterSender || isBroadcastSender) {
        return;
      }
      if (text?.startsWith(`${PREFIX}`)) {
        if (
          (isGroup && !ALLOW_GROUP_MESSAGES) ||
          (!isGroup && !ALLOW_PRIVATE_MESSAGES)
        )
          return;
      }
      if (text === `${PREFIX}menu`) {       
         await handleMenuCommand(sock, message.key, sender, menuMsgId,pushname);
      }
    else if (text === `${PREFIX}alive`) {       
         await alivemessage(sock, message.key, sender,pushname);
      }  else if (text === `${PREFIX}past`) {
        if (!pastEnabled) {
          await sock.sendMessage(sender, {
            text: `*bot's owner disable ${PREFIX}past command* 📴`,
          });
        } else {
          await sendSubjectMenu(sock, sender, messageKey);
        }
      } else if (text === `${PREFIX}text`) {
        if (!pastEnabled) {
          await sock.sendMessage(sender, {
            text: `*bot's owner disable ${PREFIX}past command* 📴`,
          });
        } else {
                  await addReaction(sock, messageKey, "📂");

          await sendtextbooksSubjectMenu(sock, sender, messageKey);
        }
      } else if (text?.startsWith(`${PREFIX}text`) && latsfinal) {
        // console.log('sc');
        await addReaction(sock, messageKey, "📂");

        await fetchtextbooks(sock, sender, latsfinal);
        
      }
  else if (text?.startsWith(`${PREFIX}past`) && latssfinal) {
        // console.log('sc');
        await addReaction(sock, messageKey, "📂");

        await sendYearMenu(sock, sender, latsfinal);
        
      }    else if (
        textbooksrequest?.stage === "textbooks" &&
        textbooksrequest.menuMsgId === quotedMsgId
      ) {
        if (!subject) {
          return sock.sendMessage(sender, {
            text: "🚧 *This section is under development* 🚧",
          });
        }

        await fetchtextbooks(sock, sender, textbook);
      }
       else if (
        request?.stage === "subject" &&
        request.menuMsgId === quotedMsgId
      ) {
        if (!subject) {
          return sock.sendMessage(sender, {
            text: "🚧 *This section is under development* 🚧",
          });
        }

        await sendYearMenu(sock, sender, subject);
      } else if (
        request?.stage === "year" &&
        request.menuMsgId === quotedMsgId
      ) {
        const years = {
          1: "2023(2024)",
          2: "2022(2023)",
          3: "2021(2022)",
          4: "2020",
          5: "2019",
        };
        const year = years[text];

        if (!year) {
          return sock.sendMessage(sender, {
            text: "🚧 *This section is under development* 🚧",
          });
        }
        await sendPDF(sock, sender,'db/past', request.subject, year);
      } else if (
        request?.stage === "pdf" &&
        request.menuMsgId === quotedMsgId
      ) {
        // await sendSelectedPDF(sock, sender, text, request);
      }else if (contextInfo) {
        // Only proceed if contextInfo exists
        const quotedMsg = contextInfo?.quotedMessage; // console.log(menuRequests); // console.log('quotedMsgId:',quotedMsgId); // Check if it's a reply to the fb command message
       
  
}
 
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });
}

// if (fs.existsSync("auth_info/"+sessionId+"/creds.json")) {
//   startBot(sessionId);
// console.log('CREDS FILE DETECTED STARTING BOT...');

// } else {
// console.log('NO DETECT CREDS FILE DOWNLOADING...');

// downloadcredsFromFolder("auth_info/"+sessionId,sessionId);
// }


// Express සේවාදායකය QR කේතය පෙන්වීම සඳහා
app.get("/", (req, res) => {
  if (qrCodeURL) {
    res.send(`
            <h1>Scan this QR code to connect your WhatsApp:</h1>
            <img src="${qrCodeURL}" alt="QR Code" />
        `);
  } else {
    res.send("<h1>QR code not generated yet. Please wait...</h1>");
  }
});

// Express 
app.listen(port, () => {
  console.log(`QR code server is running at http://localhost:${port}`);
});

startBot(sessionId);
