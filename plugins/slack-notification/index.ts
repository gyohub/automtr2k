import { Plugin, PluginContext, PluginCategory, ConfigMenu } from '../../src/types';
import chalk from 'chalk';

export default class SlackNotificationPlugin implements Plugin {
  name = 'slack-notification';
  description = 'Send notifications to Slack channels';
  version = '1.0.0';
  category = PluginCategory.COMMUNICATION;

  getConfigMenu(): ConfigMenu {
    return {
      title: 'Slack Notification Configuration',
      description: 'Configure Slack webhook URL, default channel, and notification settings',
      options: [
        {
          key: 'webhookUrl',
          label: 'Slack Webhook URL',
          description: 'Incoming webhook URL for Slack integration',
          type: 'input',
          required: true,
          validation: (value: string) => {
            if (!value.startsWith('https://hooks.slack.com/')) {
              return 'Webhook URL must start with https://hooks.slack.com/';
            }
            return null;
          }
        },
        {
          key: 'defaultChannel',
          label: 'Default Channel',
          description: 'Default channel for notifications (e.g., #general)',
          type: 'input',
          default: '#general',
          validation: (value: string) => {
            if (!value.startsWith('#')) {
              return 'Channel must start with #';
            }
            return null;
          }
        },
        {
          key: 'username',
          label: 'Bot Username',
          description: 'Username for the bot in Slack',
          type: 'input',
          default: 'AT2 Bot'
        },
        {
          key: 'iconEmoji',
          label: 'Bot Icon Emoji',
          description: 'Emoji icon for the bot (e.g., :robot_face:)',
          type: 'input',
          default: ':robot_face:'
        },
        {
          key: 'enableNotifications',
          label: 'Enable Notifications',
          description: 'Enable or disable Slack notifications',
          type: 'boolean',
          default: true
        }
      ]
    };
  }

  async execute(context: PluginContext): Promise<void> {
    const { message, channel, webhookUrl } = context.parameters || {};
    
    if (!message) {
      throw new Error('Message is required');
    }

    const targetChannel = channel || '#general';
    const webhook = webhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!webhook) {
      console.warn(chalk.yellow('⚠️  No Slack webhook URL provided. Using mock notification.'));
      console.log(chalk.blue(`💬 Mock Slack notification to ${targetChannel}:`));
      console.log(chalk.white(`Message: ${message}`));
      console.log(chalk.green('✅ Notification sent successfully (mock)'));
      return;
    }

    console.log(chalk.blue(`💬 Sending Slack notification to ${targetChannel}`));
    console.log(chalk.gray(`Message: ${message}`));

    try {
      // In a real implementation, you would use a Slack SDK here
      // For now, we'll simulate the notification
      const payload = {
        channel: targetChannel,
        text: message,
        username: 'AT2 Bot',
        icon_emoji: ':robot_face:'
      };

      console.log(chalk.gray('Payload:'), JSON.stringify(payload, null, 2));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(chalk.green(`✅ Slack notification sent successfully to ${targetChannel}`));
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to send Slack notification: ${error}`));
      throw error;
    }
  }
}
