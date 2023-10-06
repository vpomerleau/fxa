/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ApolloClient, NormalizedCacheObject, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ErrorHandler, onError } from '@apollo/client/link/error';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { cache, sessionToken, typeDefs } from './cache';

export const pagesRequiringAuthentication = ['settings'];

export const errorHandler: ErrorHandler = ({ graphQLErrors, networkError }) => {
  let reauth = false;

  const currentPageRequiresAuthentication = pagesRequiringAuthentication.some(
    (urlSnippet) => {
      // We check if the url for the current page contains the path of a page which requires authentication
      return (
        window?.location?.pathname &&
        window.location.pathname.includes(urlSnippet)
      );
    }
  );

  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      if (error.message === 'Invalid token') {
        reauth = true;
      } else if (error.message === 'Must verify') {
        // Any place we reference `account`, like `account.sendVerificationCode()` in
        // ConfirmSignupCode, (over)fetches account data. When we finish refactoring
        // ConfirmSignupCode to the container component pattern, this will no longer
        // be a problem, but for now, we do not want to redirect on that page when
        // there's an authentication problem; we just want to redirect to /signin
        // if the account is not in localStorage, which is handled in ConfirmSignupCode
        // container. So, for now, we don't care about that page here. We'll still
        // likely want to modify this for cases where the service is NOT sync.
        if (!window?.location.pathname.includes('confirm_signup_code')) {
          return window.location.replace(
            `/signin_token_code?action=email&service=sync`
          );
        }
      }
    }
  }
  if (networkError && 'statusCode' in networkError) {
    if (networkError.statusCode === 401) {
      reauth = true;
    }
  }
  if (reauth && currentPageRequiresAuthentication) {
    window.location.replace(
      `/signin?redirect_to=${encodeURIComponent(window.location.pathname)}`
    );
  } else {
    if (!reauth) {
      console.error('graphql errors', graphQLErrors, networkError);
    }
  }
};

let apolloClientInstance: ApolloClient<NormalizedCacheObject>;
export function createApolloClient(gqlServerUri: string) {
  if (apolloClientInstance) {
    return apolloClientInstance;
  }

  // httpLink makes the actual requests to the server
  const httpLink = new BatchHttpLink({
    uri: `${gqlServerUri}/graphql`,
  });

  // authLink sets the Authentication header on outgoing requests
  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        Authorization: 'Bearer ' + sessionToken(),
      },
    };
  });

  // errorLink handles error responses from the server
  const errorLink = onError(errorHandler);

  apolloClientInstance = new ApolloClient({
    cache,
    link: from([errorLink, authLink, httpLink]),
    typeDefs,
  });

  return apolloClientInstance;
}
