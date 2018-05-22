# bootstrap-moderator

Moderator is only useful if you have data. This directory contains sample comments
and a Python script that uses the Moderator API to add that data to an instance
of Moderator.

To use the Moderator API, you'll need a JWT auth token for a "service" user in
your Moderator app. A "service" user has permission to use the
[publisher API](../docs/osmod_publisher_api.md) to read and write articles and
comments to the Moderator database.

To generate a JWT token for a service user:

* Set the `TOKEN_SECRET` and `TOKEN_ISSUER` environment variables to the value
they are set to in the instance of Moderator you are using. They will either be
set as environment variables in the deployment process, or set to the default values
in the Moderator [config](../packages/config/index.js).
* Run the following command from the `/packages/cli` directory.

```
./bin/osmod.js users:get-token --id={USER_ID}
```

where `USER_ID` is the id of a Moderator user with type `service`.

Next, you need to set the `MODERATOR_AUTH` environment variable using the JWT
you just generated. You also need to set the `MODERATOR_API`.

```shell
# The JWT authentication token generated for a Moderator service user
export MODERATOR_AUTH="JWT {a-valid-jwt-for-a-service-user}"

# The URL of the Moderator API
export MODERATOR_API=
```

Now you can run the bootstrap script to load comments and articles into your Moderator
instance.
```
python3 bootstrap_reviews.py
```
