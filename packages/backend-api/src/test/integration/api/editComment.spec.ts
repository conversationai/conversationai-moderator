/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import * as chai from "chai";

import {
  Comment,
} from '@conversationai/moderator-backend-core';

import {
  expect,
  makeComment,
} from '../../test_helper';

import {
  app,
} from './test_helper';

const URL = `/services/editComment`;

describe(URL, () => {
    it('should return 404', async () => {
        try {
            const apiClient = chai.request(app);

            const { status } = await apiClient.patch(URL).send({
                data: {
                    commentId: '1',
                    text: 'lol',
                    authorName: 'what',
                    authorLocation: 'NYC',
                },
            });

            expect(status).to.be.equal(404);
        } catch (err) {
            expect(err.response.status).to.be.equal(404);
        }

    });

    it('should return 422', async () => {
        try {
            const apiClient = chai.request(app);
            const { status } = await apiClient.patch(URL).send({
                data: {
                    commentId: 1,
                    text: 1,
                    authorName: 1,
                    authorLocation: 1,
                },
            });

            expect(status).to.be.equal(422);
        } catch (err) {
            expect(err.response.status).to.be.equal(422);
        }

    });

    it('should return 200', async () => {
        try {
            const apiClient = chai.request(app);
            const comment = await makeComment();
            const updatedText = 'I’m living everyday like a hustle, another drug to juggle. Another day, another struggle.';
            const updatedAuthorName = 'Biggie';
            const updatedAuthorLocation = 'LA';

            const { status } = await apiClient.patch(URL).send({
                data: {
                    commentId: comment.id.toString(),
                    text: updatedText,
                    authorName: updatedAuthorName,
                    authorLocation: updatedAuthorLocation,
                },
            });

            const updatedComment = await Comment.findOne({ where: { id: comment.id }});
            const { name, location } = JSON.parse(updatedComment!.get('author'));

            expect(status).to.be.equal(200);
            expect(updatedComment!.get('text')).to.be.equal(updatedText);
            expect(name).to.be.equal(updatedAuthorName);
            expect(location).to.be.equal(updatedAuthorLocation);

        } catch (err) {
            expect(err.response.status).to.be.equal(200);
        }
    });
});
