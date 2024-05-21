import { HttpError, HttpStatus } from '@/config/errors';
import { keywordUnsplashImages, randomUnsplashImages } from '@/models';

export const getImages = async (
  keyword: string,
): Promise<randomUnsplashImages | keywordUnsplashImages> => {
  try {
    const res = await fetch(
      `https://api.unsplash.com/${keyword && 'search/'}photos?` +
        new URLSearchParams({
          query: keyword,
          per_page: '20',
          page: '1',
          client_id: Bun.env.UNSPLASH_ACCESS_KEY!,
        }),
      {
        method: 'GET',
      },
    );
    const data = await res.json();

    if (keyword)
      return (data as keywordUnsplashImages).results.map((image) => {
        return {
          urls: {
            full: image.urls.full,
            regular: image.urls.regular,
            thumb: image.urls.thumb,
          },
          user: {
            username: image.user.username,
            name: image.user.name,
            profile_image: {
              small: image.user.profile_image.small,
            },
            links: {
              html: image.user.links.html,
            },
          },
          links: {
            download_location: image.links.download_location,
          },
        };
      });
    else
      return (data as randomUnsplashImages).map((image) => {
        return {
          urls: {
            full: image.urls.full,
            regular: image.urls.regular,
            thumb: image.urls.thumb,
          },
          user: {
            username: image.user.username,
            name: image.user.name,
            profile_image: {
              small: image.user.profile_image.small,
            },
            links: {
              html: image.user.links.html,
            },
          },
          links: {
            download_location: image.links.download_location,
          },
        };
      });
  } catch (err) {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Could not fetch unplash images',
    });
  }
};

export const triggerDownload = async (url: string) => {
  const requestUrl =
    `${url}${url.includes('?') ? '&' : '?'}` +
    new URLSearchParams({
      client_id: Bun.env.UNSPLASH_ACCESS_KEY!,
    });

  const res = await fetch(requestUrl, {
    method: 'GET',
  });
  const data = await res.json();
  return data;
};
