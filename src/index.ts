import * as slack from '@slack/bolt';
import * as brigade from '@brigadecore/brigade-sdk';

const port = 13033;
const BRIGADE_URL = 'https://localhost:8443';
const SLACK_GATEWAY_ID = 'slack';
const SLACK_EVENT_CREATOR_SA_TOKEN = process.env.SLACK_EVENT_CREATOR_SA_TOKEN || 'ERROR: NO SERVICE ACCOUNT TOKEN';

const app = new slack.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
});

async function brigClient(): Promise<brigade.APIClient> {
    return new brigade.APIClient(BRIGADE_URL, SLACK_EVENT_CREATOR_SA_TOKEN, { allowInsecureConnections: true });
}

app.command('/biscuits', onSlashBiscuit);
app.shortcut('biscuit_shortcut', onBiscuitButton);
app.shortcut('global_biscuit_me', onBiscuitButton);

async function runServer() {
    await app.start(port);
    console.log('Slack gateway running');
}

runServer();

async function onSlashBiscuit(command: slack.SlackCommandMiddlewareArgs & slack.AllMiddlewareArgs): Promise<void> {
    command.ack(`Unleashing a ${command.payload.text} into the system`);
    const evts = await (await brigClient()).core().events().create({
        source: SLACK_GATEWAY_ID,
        type: 'slash_command',
        // labels: {
        //     command: command.payload.command,
        //     channel: command.payload.channel_name
        // },
        payload: JSON.stringify(command),
    });
    console.log(JSON.stringify(evts));
}

async function onBiscuitButton(command: slack.SlackShortcutMiddlewareArgs & slack.AllMiddlewareArgs): Promise<void> {
    if (command.payload.type === 'message_action') {
        command.ack();
        await command.say(`Here is your ${command.payload.message.text}`);  // bot needs chat:write scope, *AND* to be added to channel
    } else {
        command.ack();
        // await command.say('Thank you for using Global Biscuit Services');  // not defined (because no channel ID in global case?)
        // await command.respond('Thank you for using Global Biscuit Services');  // not defined either (no response_url?)
        await command.client.views.open({
            trigger_id: command.shortcut.trigger_id,
            view: {
                type: 'modal',
                title: { type: 'plain_text', text: 'Biscuit Services' },
                blocks: [
                    { type: 'section', text: { type: 'plain_text', text: 'Thank you and enjoy your biscuit' } }
                ]
            }
        });
    }
}
