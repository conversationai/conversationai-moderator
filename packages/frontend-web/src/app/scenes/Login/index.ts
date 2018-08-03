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

import { pick } from 'lodash';
import qs from 'qs';
import { generate } from 'randomstring';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { IReturnURL, setCSRF, setReturnURL } from '../../util';
import { Login as PureLogin } from './Login';

export const Login = compose(
  withRouter,
  connect(createStructuredSelector({
    errorMessage: (_: any, { errorMessage }: any) => {
      if (errorMessage) {
        return errorMessage;
      }

      const query = qs.parse(window.location.search.replace(/^\?/, ''));

      if (query.error && query.error === 'true') {
        return query.errorMessage || 'An error occured.';
      } else {
        return false;
      }
    },

    csrf: () => {
      const csrf = generate();

      setCSRF(csrf);

      return csrf;
    },

    returnURL: (_: any, { location }: any) => {
      const returnDetails = pick(location, ['pathname', 'query']) as IReturnURL;

      setReturnURL(returnDetails);

      return returnDetails;
    },
  })),
)(PureLogin) as any;
