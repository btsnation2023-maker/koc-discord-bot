require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DISCORD_TOKEN    = process.env.DISCORD_TOKEN;
const CHANNEL_NAME     = 'koc-apply';          // Channel where button lives
const SHEET_ID         = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CREDS     = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
// ──────────────────────────────────────────────────────────────────────────────

// ─── GOOGLE SHEETS SETUP ─────────────────────────────────────────────────────
const auth = new google.auth.GoogleAuth({
  credentials: GOOGLE_CREDS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function appendToSheet(data) {
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

  // Ensure header row exists on first run
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A1:G1',
  }).catch(() => null);

  if (!existing?.data?.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Timestamp', 'Discord Username', 'Social Media Link', 'Contact Number', 'Email', 'On TikTok Shop?', 'Promoted EHP Labs Before?']],
      },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
        data.username,
        data.socialLink,
        data.contactNumber,
        data.email,
        data.onTiktokShop,
        data.promotedEhp,
      ]],
    },
  });
}
// ──────────────────────────────────────────────────────────────────────────────

// ─── DISCORD CLIENT ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Track the persistent message ID to avoid duplicates
const postedChannels = new Set();

async function postApplyButton(channel) {
  if (postedChannels.has(channel.id)) return;

  // Clean up any old bot messages in the channel
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const botMessages = messages.filter(m => m.author.id === client.user.id);
    if (botMessages.size > 0) {
      await channel.bulkDelete(botMessages).catch(() => {
        botMessages.forEach(m => m.delete().catch(() => {}));
      });
    }
  } catch (_) {}

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🚀 KOC (Kind of Creator) Application')
    .setDescription(
      '**Welcome to the EHP Labs KOC Program!**\n\n' +
      'We\'re looking for passionate creators to join our family.\n\n' +
      '📌 Click the button below to apply and share your details with our team.\n\n' +
      '> Applications are reviewed within 3–5 business days.'
    )
    .setThumbnail('https://i.imgur.com/AfFp7pu.png')
    .setFooter({ text: 'EHP Labs × KOC Program • Applications open 24/7' })
    .setTimestamp();

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('koc_apply_btn')
      .setLabel('✨ Apply Now for KOC')
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [button] });
  postedChannels.add(channel.id);
  console.log(`✅ Apply button posted in #${channel.name}`);
}

// ─── ON READY ─────────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`🤖 Bot online as ${client.user.tag}`);

  // Find the koc-apply channel across all guilds and post the button
  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.find(
      c => c.name === CHANNEL_NAME && c.isTextBased()
    );
    if (channel) {
      await postApplyButton(channel);
    }
  }
});

// Re-post button if someone joins a new guild
client.on('guildCreate', async guild => {
  await guild.channels.fetch();
  const channel = guild.channels.cache.find(
    c => c.name === CHANNEL_NAME && c.isTextBased()
  );
  if (channel) await postApplyButton(channel);
});

// ─── BUTTON INTERACTION → OPEN MODAL ─────────────────────────────────────────
client.on('interactionCreate', async interaction => {

  // ── Button click: show the modal ──────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === 'koc_apply_btn') {

    const modal = new ModalBuilder()
      .setCustomId('koc_apply_modal')
      .setTitle('KOC Application — EHP Labs');

    const socialInput = new TextInputBuilder()
      .setCustomId('social_link')
      .setLabel('Your Social Media Link(s)')
      .setPlaceholder('https://instagram.com/yourhandle or TikTok link...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(300);

    const contactInput = new TextInputBuilder()
      .setCustomId('contact_number')
      .setLabel('Contact Number (with country code)')
      .setPlaceholder('+61 400 000 000')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const emailInput = new TextInputBuilder()
      .setCustomId('email')
      .setLabel('Email Address')
      .setPlaceholder('you@example.com')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const tiktokShopInput = new TextInputBuilder()
      .setCustomId('tiktok_shop')
      .setLabel('Are you on TikTok Shop? (Yes / No)')
      .setPlaceholder('Yes or No')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

    const promotedEhpInput = new TextInputBuilder()
      .setCustomId('promoted_ehp')
      .setLabel('Have you promoted EHP Labs before? (Yes / No)')
      .setPlaceholder('Yes or No')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

    modal.addComponents(
      new ActionRowBuilder().addComponents(socialInput),
      new ActionRowBuilder().addComponents(contactInput),
      new ActionRowBuilder().addComponents(emailInput),
      new ActionRowBuilder().addComponents(tiktokShopInput),
      new ActionRowBuilder().addComponents(promotedEhpInput),
    );

    await interaction.showModal(modal);
    return;
  }

  // ── Modal submitted: save to Google Sheets ───────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === 'koc_apply_modal') {
    await interaction.deferReply({ ephemeral: true });

    const data = {
      username:      `${interaction.user.username} (${interaction.user.id})`,
      socialLink:    interaction.fields.getTextInputValue('social_link'),
      contactNumber: interaction.fields.getTextInputValue('contact_number'),
      email:         interaction.fields.getTextInputValue('email'),
      onTiktokShop:  interaction.fields.getTextInputValue('tiktok_shop'),
      promotedEhp:   interaction.fields.getTextInputValue('promoted_ehp'),
    };

    try {
      await appendToSheet(data);
      console.log(`📋 Application received from ${data.username}`);

      await interaction.editReply({
        content:
          '✅ **Application received!**\n\n' +
          'Thank you for applying to the EHP Labs KOC Program. Our team will review your application and reach out within **3–5 business days**.\n\n' +
          '_Keep creating — we\'ll be in touch!_ 💪',
      });

    } catch (err) {
      console.error('Google Sheets error:', err);
      await interaction.editReply({
        content: '❌ Something went wrong saving your application. Please DM an admin or try again shortly.',
      });
    }
  }
});

// ─── KEEP ALIVE + AUTO-RECONNECT ─────────────────────────────────────────────
client.on('error', err => console.error('Discord client error:', err));
client.on('warn', msg => console.warn('Discord warning:', msg));

process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));

client.login(DISCORD_TOKEN);
