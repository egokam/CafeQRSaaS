import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://qerve.egokam.site',
      lastModified: new Date(),
    },
    {
      url: 'https://qerve.egokam.site/get-started',
      lastModified: new Date(),
    }
  ];
}
