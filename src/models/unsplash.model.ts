export type randomUnsplashImages = {
  urls: { full: string; regular: string; thumb: string };
  user: {
    username: string;
    name: string;
    profile_image: {
      small: string;
    };
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
  };
}[];

export type keywordUnsplashImages = {
  results: randomUnsplashImages;
};
