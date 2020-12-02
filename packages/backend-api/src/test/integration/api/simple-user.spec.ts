/*
Copyright 2020 Google Inc.

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

import * as chai from 'chai';

import {User} from '../../../models';
import {expect, makeUser} from '../../fixture';
import {app} from './test_helper';

const BASE_URL = `/services/simple`;

describe(BASE_URL, () => {
  describe('user create', () => {
    afterEach(async () => {
      await User.destroy({where: {}});
    });

    it('Should create a system user', async () => {
      const apiClient = chai.request(app);

      const res = await apiClient.post(`${BASE_URL}/user`).send({
        name: 'test system user',
        group: 'service',
        isActive: true,
      });

      expect(res.status).to.equal(200);
      const users = await User.findAll({where: {}});
      expect(users.length).to.equal(1);
      expect(users[0].group).to.equal('service');
    });

    it('Should create a normal user', async () => {
      const apiClient = chai.request(app);

      const res = await apiClient.post(`${BASE_URL}/user`).send({
        name: 'test normal user',
        email: 'test@example.com',
        group: 'admin',
        isActive: true,
      });

      expect(res.status).to.equal(200);
      const users = await User.findAll({where: {}});
      expect(users.length).to.equal(1);
      expect(users[0].group).to.equal('admin');
    });

    it('Should fail to create a normal user as no email address', async () => {
      const apiClient = chai.request(app);

      const res = await apiClient.post(`${BASE_URL}/user`).send({
        name: 'test normal user',
        group: 'admin',
        isActive: true,
      });

      expect(res.status).to.equal(400);
      expect(await User.count({where: {}})).to.equal(0);
    });

    it('Should fail to create a user with a forbidden type', async () => {
      const apiClient = chai.request(app);

      const res = await apiClient.post(`${BASE_URL}/user`).send({
        name: 'test normal user',
        email: 'test@example.com',
        group: 'moderator',
        isActive: true,
      });

      expect(res.status).to.equal(400);
      expect(await User.count({where: {}})).to.equal(0);
    });
  });

  describe('user get/update', () => {
    let general: User;
    let admin: User;
    let service: User;
    let moderator: User;

    before(async () => {
      general = await makeUser({group: 'general', email: 'general@example.com'});
      admin = await makeUser({group: 'admin', email: 'admin@example.com'});
      service = await makeUser({group: 'service', email: 'service@example.com'});
      moderator = await makeUser({group: 'moderator', email: 'moderator@example.com'});
      await makeUser({group: 'youtube', email: 'youtube@example.com'});
    });

    after(async () => {
      await User.destroy({where: {}});
    });

    it('Get should just get service users', async () => {
      const apiClient = chai.request(app);
      const { status, body } = await apiClient.get(`${BASE_URL}/systemUsers/service`);
      expect(status).to.equal(200);
      expect(body.users.length).to.equal(1);
      expect(body.users[0].email).to.equal('service@example.com');
    });

    it('Get should just get moderator users', async () => {
      const apiClient = chai.request(app);
      const { status, body } = await apiClient.get(`${BASE_URL}/systemUsers/moderator`);
      expect(status).to.equal(200);
      expect(body.users.length).to.equal(1);
      expect(body.users[0].email).to.equal('moderator@example.com');
    });

    it('Update general to admin plus email address change', async () => {
      const apiClient = chai.request(app);
      const res = await apiClient.post(`${BASE_URL}/user/update/${general.id}`).send({
        name: 'updated name',
        email: 'updated@example.com',
        group: 'admin',
        isActive: false,
      });

      expect(res.status).to.equal(200);
      const user = await User.findOne({where: {id: general.id}});
      expect(user?.name).to.equal('updated name');
      expect(user?.email).to.equal('updated@example.com');
      expect(user?.group).to.equal('admin');
      expect(user?.isActive).to.equal(false);
    });

    it('Update admin to service shouldn\'t change anything', async () => {
      const apiClient = chai.request(app);
      const res = await apiClient.post(`${BASE_URL}/user/update/${admin.id}`).send({
        group: 'service',
      });

      expect(res.status).to.equal(200);
      const user = await User.findOne({where: {id: admin.id}});
      expect(user?.group).to.equal('admin');
    });

    it('Update service to general shouldn\'t change anything', async () => {
      const apiClient = chai.request(app);
      const res = await apiClient.post(`${BASE_URL}/user/update/${service.id}`).send({
        group: 'general',
      });

      expect(res.status).to.equal(200);
      const user = await User.findOne({where: {id: service.id}});
      expect(user?.group).to.equal('service');
    });

    it('Can only update isActive for moderator', async () => {
      const apiClient = chai.request(app);
      const res = await apiClient.post(`${BASE_URL}/user/update/${moderator.id}`).send({
        name: 'new name',
        group: 'general',
        isActive: false,
      });

      expect(res.status).to.equal(200);
      const user = await User.findOne({where: {id: moderator.id}});
      expect(user?.group).to.equal('moderator');
      expect(user?.isActive).to.equal(false);
    });
  });
});
