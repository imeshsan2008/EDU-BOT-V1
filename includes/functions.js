


async function deleteMessage(sock, sender, Message) {
	try {
		await sock.sendMessage(sender, {
			delete: {
			  remoteJid: sender,
			  id: Message.key.id,
			  participant: Message.key.participant || sender, // Ensure participant is set for group chats
			},
		  });
		  console.log('Message deleted successfully');
	} catch (error) {
	  console.error("Error deleteing message:", error);
	}
  }
  module.exports = deleteMessage;
  