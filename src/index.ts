// import { IncomingMessage, ServerResponse } from 'http';
import * as slack from '@slack/bolt';

// import * as signature from './signature';

const port = 13033;

// function rawBodyBuffer(req: IncomingMessage, _res: ServerResponse, buf: Buffer, encoding: BufferEncoding) {
//     if (buf && buf.length) {
//         req['rawBody'] = buf.toString(encoding || 'utf8');
//     }
// }

// const app = express();
const app = new slack.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
});

app.command('/biscuits', onSlashBiscuit);
app.shortcut('biscuit_shortcut', onBiscuitButton);
app.shortcut('global_biscuit_me', onBiscuitButton);

async function runServer() {
    await app.start(port);
    console.log('Slack gateway running');
}

runServer();

async function onSlashBiscuit(command: slack.SlackCommandMiddlewareArgs & slack.AllMiddlewareArgs): Promise<void> {
    command.ack(`Here is your ${command.payload.text}`);
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
