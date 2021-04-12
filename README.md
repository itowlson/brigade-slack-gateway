# Slack Gateway for Brigade 2

This is currently a very basic Slack gateway that accepts slash commands, message
actions and global shortcuts and emits them into Brigade for projects to pick up
and process.

It works with Brigade 2 alpha 3.  At the moment it has been tested only for
local development.

# Setup

## Local development infrastructure

* Set up localhost forwarding at ngrok (to port 13033). Note the URL.

## In Slack

* In Slack admin, create an app
* In Slack admin, set up the following UI touchpoints:
  - Slash commands: create with the desired name `/launch` and the gateway as the
    request URL (e.g. `blah.ngrok.io/slack/events`)
  - Interactivity & Shortcuts:
    - Turn on with the gateway as the request URL
    - Message shortcut(s) with desired callback IDs e.g. `launch_from_message`
    - Global shortcut(s) with desired callback IDs e.g. `launch_all_the_things`
- In the Slack app, add the bot to the channel(s) you use for testing
  (invite the app to the channel)
- In Slack admin, in OAuth & Permissions:
  - Grant the bot `chat:write` permission
  - Copy the bot token into the `SLACK_BOT_TOKEN` env var
- In Slack admin, in Basic Information:
  - Copy the signing secret into the `SLACK_SIGNING_SECRET` env var
  - Install your app into your workspace

## In Brigade

* `brig -k service-account create --id slack-event-creator --description "creates events"`
  - Copy the token into the `SLACK_EVENT_CREATOR_SA_TOKEN` env var
* `brig -k role grant EVENT_CREATOR --service-account slack-event-creator --source slack`

## In your development environment

* Ensure you have picked up the `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` and
  `SLACK_EVENT_CREATOR_SA_TOKEN` environment variables
* Run the gateway: `npm run start`

# Notes and limitations

At the moment, the gateway is confined to a single Slack application.  If you want to configure
events into multiple Slack applications, you'll need to deploy multiple instances of the
gateway.

**TODO:** What is the right way to remove this limitation (if we want to)?  Skip the Bolt
stuff and just pass on messages directly, with the application ID as a label or even
a qualifier?  This makes it the workflow's problem to verify the signature though...

# Gateway information

The ID of the Slack gateway is `slack`.

# Events

Event bodies adhere to the Slack Bolt API (v3.3) where possible. This is not
necessarily the most convenient or internally consistent to work with, but it
is familiar to Slack developers, and well documented by Slack, and we don't want
to create a different way of representing Slack messages.

## Event type: `slash_command`

Dispatched when the user enters a slash command message that has been
mapped to the gateway URL in the Slack application.  See
https://api.slack.com/interactivity/slash-commands#what_are_commands

### Labels

* **command:** the command name, including the slash (e.g. `/release`)
* **channel:** the name of the channel, excluding the `#` (e.g. `hound-activities`)

### Event schema

* **body:** conforms to the Bolt `SlashCommand` interface
* **responseToken:** a string token that can be used to send bot responses via the Slack API

## Event type: `message_action`

Dispatched when the user chooses a message-level shortcut that has been
mapped to the gateway URL in the Slack application.  See
https://api.slack.com/interactivity/shortcuts/using#shortcut_types

### Labels

* **callback_id:** the action ID defined in the Slack application (e.g. `release`)
* **channel:** the name of the channel, excluding the `#` (e.g. `hound-activities`)

### Event schema

* **body:** conforms to the Bolt `MessageShortcut` interface
* **responseToken:** a string token that can be used to send bot responses via the Slack API

## Event type: `shortcut`

Dispatched when the user chooses a global-level shortcut that has been
mapped to the gateway URL in the Slack application. See
https://api.slack.com/interactivity/shortcuts/using#shortcut_types


### Labels

* **callback_id:** the action ID defined in the Slack application (e.g. `release`)

### Event schema

* **body:** conforms to the Bolt `GlobalShortcut` interface
* **responseToken:** a string token that can be used to send bot responses via the Slack API
