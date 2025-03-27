import { FC, Fragment, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout';
import { setCookie, useInfiniteScroll } from '../utils';
import { DataLimit, Post } from '../constants';
import { RootState } from '../store';
import { PostCard, PostCreateButton } from '../components/Post';
import { Container, Button, Spacing, LoadingDots, Skeleton, Text } from '../components/ui';
import { openAuthPopup, PopupType, setAuthUser, setToken } from '../store/auth';
import { CommunityIcon } from '../components/ui/icons';
import Seo from '../components/Seo';
import Cookies from 'js-cookie'; // Cookie handling

const fetchPostsByFollowing = async ({ pageParam = 0 }) => {
  const { data } = await axios.get(`/posts/follow?offset=${pageParam}&limit=${DataLimit.PostsByFollowing}`);
  return data;
};

const verifyHasuraAuth = async (token: string, dispatch: any) => {
  try {
    const response = await axios.post('http://localhost:4000/verifyHasuraAuth', { token });

    if (response.data) {
      const user = response.data.user; // Extract user from response
      console.log('User authenticated:', user);

      dispatch(
        setAuthUser({
          ...user,
          isOnline: true, // Mark user as online
        })
      );

      setCookie(Cookies.Token, response?.data?.userToken); // Store token in cookies
      dispatch(setToken(response?.data?.userToken)); // Store token in Redux

      axios.defaults.headers.common['Authorization'] = `bearer ${response?.data?.userToken}`; // Set Axios default auth
    }
  } catch (error) {
    console.error('Authentication failed:', error);
  }
};

const Home: FC = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { data, isFetching, isFetchingNextPage } = useInfiniteScroll({
    key: 'postsByFollowing',
    apiCall: fetchPostsByFollowing,
    enabled: authUser !== null,
    dataLimit: DataLimit.PostsByFollowing,
  });
  // useEffect(() => {
  //   const token =
  //     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsibW9iaWxlX3VzZXIiXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoibW9iaWxlX3VzZXIiLCJ4LWhhc3VyYS11c2VyLWlkIjoiZmJjY2IwOTYtMDU3Ni00MzQ5LTkzNjctN2YyNTE1NWYyMmYyIn0sImlhdCI6MTc0MzA1Mjg4NSwiZXhwIjoxNzQzMDY3Mjg1fQ.kLvr59F15cxEcI0hvkRzchflEcaxqQKBvM_UWPc3jMw'; // Get token from cookies
  //   if (token && !authUser) {
  //     verifyHasuraAuth(token, dispatch); // Authenticate user
  //   }
  // }, [authUser, dispatch]);

  const openAuthModal = () => {
    dispatch(openAuthPopup(PopupType.Sign_Up));
  };

  if (isFetching && !isFetchingNextPage) {
    return (
      <Layout>
        <Skeleton count={10} height={300} bottom="sm" />
      </Layout>
    );
  }

  const isEmpty = !data?.pages[0] || data.pages.every((p) => p.length === 0);

  return (
    <Layout>
      <Seo title="Home" />
      <div>
        {authUser && <PostCreateButton queryKey="postsByFollowing" />}

        {isEmpty && (
          <Container centered padding="lg" bgColor="white" shadow="sm">
            <CommunityIcon width="40" />

            <Spacing top="sm">
              {!authUser && (
                <Button inline onClick={openAuthModal} color="primary">
                  Sign up
                </Button>
              )}
              <Spacing top="sm">
                <Text>{!authUser && 'And'} Follow community members to see their posts in the News Feed.</Text>
              </Spacing>
            </Spacing>
          </Container>
        )}

        {data?.pages?.map((posts, i) => {
          return (
            <Fragment key={i}>
              {posts?.map((post: Post) => (
                <PostCard displayChannelName queryKey="postsByFollowing" key={post._id} post={post} />
              ))}

              {isFetchingNextPage && <LoadingDots />}
            </Fragment>
          );
        })}
      </div>
    </Layout>
  );
};

export default Home;
