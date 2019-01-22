# bootstrap-moderator

Moderator is only useful if you have data. This directory contains sample comments
and a Python script that uses the Moderator API to add that data to an instance
of Moderator.

(As an alternative to the instructions here, you can use the osmod CLI tool to
generate comments based on "Alice in Wonderland".  See
```bash
bin/osmod comments:generate --help
```
for detais.)

To use the Moderator API, you'll need a JWT authentication token for a "service" user in
your Moderator app. A "service" user has permission to use the
[publisher API](../docs/osmod_publisher_api.md) to read and write articles and
comments to the Moderator database.

You can view and create service users, and view their web tokens on the Settings page
of the OSMod UI.

To use a token, set the `MODERATOR_AUTH` environment variable as shown below:
```shell
# The JWT authentication token for a Moderator service user
export MODERATOR_AUTH="JWT {jwt-authentication-token-from-settings-page}"
```

You'll also have to tell the script how to connect to the moderator backend:
```shell
# The URL of the Moderator API.  If running locally as described in the
# root README, use:
export MODERATOR_API=http://127.0.0.1:8080
```

Make sure the Moderator API is running and then run the bootstrap script to load
comments and articles into your Moderator instance.
```
python3 bootstrap_reviews.py
```
