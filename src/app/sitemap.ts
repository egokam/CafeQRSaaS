import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://qerve.egokam.site',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://qerve.egokam.site/get-started',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://qerve.egokam.site/tutorial',
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  ];
}
