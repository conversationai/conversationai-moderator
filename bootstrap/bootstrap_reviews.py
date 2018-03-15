import csv
import requests
import datetime, json, os


# A JWT generated for a service Moderator user
AUTH = os.getenv("MODERATOR_AUTH")

# The URL of the Moderator API
API_URL = os.getenv("MODERATOR_API", "127.0.0.1:8080")

# The number of reviews per category to import into Moderator
REVIEWS_PER_CATEGORY = 100

class moderator_client(object):

    def __init__(self, auth, api_url):
        self.api_url = api_url
        self.headers = {
            'content-type': "application/json",
            'authorization': auth,
            'cache-control': "no-cache",
        }

    def create_article(self, sourceId, title, text, url, category):
        '''
        Create an article in Moderator using the publisher API.
        '''

        data = {
            "data": [
                {
                    "sourceId": sourceId,

                    "categoryId": category,
                    "title": title,
                    "createdAt": str(datetime.datetime.now()),
                    "text": text,
                    "url": url,
                }
            ]
        }

        payload = json.dumps(data)




        try:
            print("Adding article", sourceId)

            url = self.api_url + "/publisher/articles"
            response = requests.post(url, data=payload, headers=self.headers)
            status = response.status_code

            if status != 200:
                print("Received non-200 response from /publisher/articles:", status)

            print("Response:", response.json())
            print()

        except Exception as e:
            print("Error calling /publisher/articles:", e)

    def create_comment(self, review_id, product_id, text, author_location, author_name):
        '''
        Create a comment in Moderator using the publisher API.
        '''

        data = {
            "data": [
                {
                    "articleId": product_id,
                    "sourceId": review_id,
                    "authorSourceId": "4",
                    "text": text,
                    "author": {
                        "email": "person@email.com",
                        "location": author_location,
                        "name": author_name,
                        "avatarURL": "www.purple.com",
                    },
                    "createdAt":str(datetime.datetime.now()),
                }
            ]
        }

        payload = json.dumps(data)

        try:
            print("Adding comment {0} to product {1}".format(review_id, product_id))

            url = self.api_url + "/publisher/comments"
            response = requests.post(url, data=payload, headers=self.headers)
            status = response.status_code

            if status != 200:
                print("Received non 200 response from /publisher/comments:", status)

            print("Response:", response.json())
            print()

        except Exception as e:
            print("Error calling /publisher/comments:", e)

if __name__ == "__main__":

    # Assumes CSV format with the first line as the header
    # and the first field as the comment text
    datasets = [
        {
            'name': 'wikipedia',
            'path': 'wikipedia.csv',
            'article_id': '787',
            'article_title': 'Wikipedia 1/9/17',
            'article_summary': 'Some comments from Wikipedia.',
            'category': 'Wikipedia'
        },
        {
            'name': 'brexit',
            'path': 'brexit.csv',
            'article_id': '123',
            'article_title': 'Brexit 9/1/2017',
            'article_summary': 'Some thoughts about brexit...',
            'category': 'Brexit'
        },
        {
            'name': 'climate',
            'path': 'climate.csv',
            'article_id': '456',
            'article_title': 'Climate Change 3/10/18',
            'article_summary': 'Some thoughts about climate change...',
            'category': 'Climate Change'
        },
        {
            'name': 'election',
            'path': 'election.csv',
            'article_id': '789',
            'article_title': 'US Election 10/20/17',
            'article_summary': 'Some thoughts about the US election...',
            'category': 'US Election'
        },
    ]

    moderator = moderator_client(AUTH, API_URL)

    for d in datasets:

        # create an article
        title = d['article_title']
        url = 'https://jigsaw.google.com/'
        summary = d['article_summary']
        article_id = d['article_id']
        data_path = d['path']
        dataset_name = d['name']

        print('Loading data for {}'.format(title))
        moderator.create_article(article_id, title, summary, url, d['category'])

        file = open(data_path, 'r')
        lines = csv.reader(file)

        # create a comments
        for i, item in enumerate(lines):

            # assume first line of file is a header
            if i == 0:
                continue

            comment_id = '{}_{}'.format(dataset_name, i)
            username = 'Lucas Dixon' # CHANGE THIS
            text = item[0]

            moderator.create_comment(comment_id, article_id, text, "USA", username)
