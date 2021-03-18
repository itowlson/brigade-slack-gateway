**Currently just the skeleton of a Slack app endpoint**

Things you need to do to set up the Slack side of this:

* Create an app
* Set up the following UI touchpoints:
  - Slash commands: create with the name `/biscuits` and this as the request URL (e.g. `blah.ngrok.io/slack/events`)
  - Interactivity & Shortcuts:
    - Turn on with this as the request URL
    - Message shortcut with the callback id `biscuit_shortcut`
    - Global shortcut with the callback id `global_biscuit_me`
- Add the bot to the channel(s) you use for testing
- In OAuth & Permissions:
  - Grant the bot `chat:write` permission
  - Copy the bot token into the `SLACK_BOT_TOKEN` env var
- In Basic Information:
  - Copy the signing secret into the `SLACK_SIGNING_SECRET` env var
- Basic Information > Install your app

To run the server: `npm run start` and set up localhost forwarding at ngrok
