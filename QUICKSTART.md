These are instructions on how to get a youtube instance of moderator running on a Google Cloud compute VM.

Step 0:
-------

Create a Google cloud project and a VM running 'Ubuntu 18.04 LTS Minimal' in the [Google console](https://console.cloud.google.com/compute/instances).

You'll also need to create a [firewall rule](https://console.cloud.google.com/networking/firewalls/list) to allow
traffic on ports 8000 and 8080, and add that rule to your VM network tags.

You'll also need to allocate a domain name for your new VM  - unfortunately the Google OAuth servers won't work with IP addresses.

Step 1:
-------

Create an OAuth2.0 Client ID  entry in the [Google console](https://console.developers.google.com/apis/credentials).
Add the following Authorised redirect URIs:

```
http://<domain name from step 0>:8080/auth/callback/google
http://<domain name from step 0>:8080/youtube/callback
```

Step 2:
-------

Open a terminal to the VM and install the following packages.
  
```
sudo apt update
sudo apt dist-upgrade -y
sudo apt install -y nodejs npm docker.io git
sudo usermod -a -G docker `whoami`
sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
exit
```

Step 3:
-------

Open a *new* terminal and download the code:

```
git clone git@github.com:conversationai/conversationai-moderator.git conversationai-moderator
cd conversationai-moderator
```

Step 4:
-------

Get a google cloud API key for the ConversationAI service.  (To be documented...)

Step 5:
-------

Set the following environment variables
```
export URL_BASE=http://<domain name from step 0>
export GOOGLE_CLIENT_ID=<Client ID from step 1>
export GOOGLE_CLIENT_SECRET=<Client secret from step 1>
export GOOGLE_CLOUD_API_KEY=<API key from step 4>

export MODERATOR_FLAVOR=youtube
export DATABASE_PASSWORD=password
export TOKEN_SECRET="sdf"
export ATTRIBUTE_REQUESTS
read -r -d '' ATTRIBUTE_REQUESTS << EOM
{
  "ATTACK_ON_AUTHOR": {},
  "ATTACK_ON_COMMENTER": {},
  "INCOHERENT": {},
  "INFLAMMATORY": {},
  "OBSCENE": {},
  "OFF_TOPIC": {},
  "SPAM": {} ,
  "UNSUBSTANTIAL": {},
  "LIKELY_TO_REJECT": {},
  "TOXICITY": {}
}
EOM
```

Step 6:
-------

Run the service

```
docker-compose -f deployments/local/docker-compose.yml up -d
```

When it is up and running, point your browser in the right direction:
http://<domain name from step 0>:8000/
