import * as slack from '@slack/bolt';
import * as brigade from '@brigadecore/brigade-sdk';

const port = 13033;
const BRIGADE_URL = 'https://localhost:8443';
const SLACK_GATEWAY_ID = 'slack';
const SLACK_EVENT_CREATOR_SA_TOKEN = process.env.SLACK_EVENT_CREATOR_SA_TOKEN || 'ERROR: NO SERVICE ACCOUNT TOKEN';

// TODO: We can get rid of this once Slack release with the slash command regex update
class MyApp extends slack.App {
    constructor(opts: slack.AppOptions | undefined) {
        super(opts);
    }

    public allCommands(...listeners: slack.Middleware<slack.SlackCommandMiddlewareArgs>[]): void {
        this.thisListeners().push([slack.onlyCommands, matchAnyCommandName(), ...listeners] as slack.Middleware<slack.AnyMiddlewareArgs>[]);
    }

    private thisListeners(): slack.Middleware<slack.AnyMiddlewareArgs>[][] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this as any).listeners;
    }
}

function matchAnyCommandName(): slack.Middleware<slack.SlackCommandMiddlewareArgs> {
    return async ({next}) => {
        if (next) {
            await next();
        }
    };
}

const app = new MyApp({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
});

function brigClient(): brigade.APIClient {
    return new brigade.APIClient(BRIGADE_URL, SLACK_EVENT_CREATOR_SA_TOKEN, { allowInsecureConnections: true });
}

app.allCommands(onSlashCommand);
app.shortcut(/.+/, onShortcut);

async function runServer() {
    await app.start(port);
    console.log('Slack gateway running');
}

runServer();

async function onSlashCommand(command: slack.SlackCommandMiddlewareArgs & slack.AllMiddlewareArgs): Promise<void> {
    const payload = {
        body: command.body,
        responseToken: command.client.token
    };
    const labels = {
        command: command.payload.command,
        channel: command.payload.channel_name
    };
    const evt = {
        source: SLACK_GATEWAY_ID,
        type: 'slash_command',
        payload: JSON.stringify(payload),
        labels,
    };
    const createdEvts = await brigClient().core().events().create(evt);
    console.log(`Created ${createdEvts.items.length} event(s) for ${command.payload.command} ${command.payload.text}`);
    command.ack(`Unleashed a ${command.payload.text} into the system - picked up by ${createdEvts.items[0].projectID}`);
}

async function onShortcut(shortcut: slack.SlackShortcutMiddlewareArgs & slack.AllMiddlewareArgs): Promise<void> {
    const payload = {
        body: shortcut.body,
        responseToken: shortcut.client.token
    };
    const labels: { [key: string]: string } = {
        callback_id: shortcut.payload.callback_id,
    };
    if (shortcut.payload.type === 'message_action') {
        labels.channel = shortcut.payload.channel.name;
    }
    const evt: brigade.core.Event = {
        source: SLACK_GATEWAY_ID,
        type: shortcut.payload.type,
        payload: JSON.stringify(payload),
        labels,
    };
    const createdEvts = await brigClient().core().events().create(evt);
    console.log(`Created ${createdEvts.items.length} event(s) for ${shortcut.payload.type}`);
    shortcut.ack();
}
