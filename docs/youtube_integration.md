# OS Moderator YouTube integration

## Synchronisation of Channels and Videos

In the OSMod UI, Channels are mapped to categories/sections, Videos are mapped to articles.
  
When syncing with YouTube, we fetch all channels that the YouTube account can access, but we only 
synchronise against videos that we already know about.  In particular, if a video has no comments, 
then it will not appear.   

Channel/Video synchronisation is kicked periodically (currently once a day).  Though the UI provides a mechanism
for doing an immediate sync.  Synchronisation occurs only while OSMod is active, i.e., when there is at least 
one moderator actively using the tool. 

Channel and Video data is fetched using the following APIS:

### Channel data: 

API: google.youtube('v3').channels.list
    
For each channel we access the snippet brandingSettings: 
we are only interested in the id, snippet.titlename, and brandingSettings.channel.moderateComments fields.

If moderateComments is false, we assume that this channel is not being managed by OSModerator, 
and take no further action.  
We eventually plan on providing a mechanism for enabling moderateComments via the OSMOD UI.

### Video data

API: google.youtube('v3').videos.list

We fetch videos that we know about and that are being actively managed.  A video is actively managed if its
channel is active and we've seen some comments for that video.

For each video, we store the id, title, description, channel ID and URL. 

## Synchronisation of Comments

API: google.youtube('v3').commentThreads.list

For each active channel, we periodically poll the API for new comments to process.  
We do this every few minutes.  We narrow the search by only requesting 
those comments that haven't yet been moderated (heldForReview).

For each comment and reply, we are interested in the following:
 - id
 - snippet.textDisplay
 - snippet.publishedAt
 - snippet.videoId 
 - snippet.authorDisplayName
 - snippet.authorProfileImageUrl
 - snippet.authorChannelId.value

### Backsync of comments

API: google.youtube('v3').comments.setModerationStatus

We request the snippet and replies.

Once we have decided what to do with a comment, we set its moderation status via the above API:
