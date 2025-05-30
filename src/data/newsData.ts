// src/data/newsData.ts
export interface NewsItem {
    id: string;
    title: string;
    category: string;
    date: string;
    imageSrc: string;
    summary?: string;
    href?: string;
  }
  
  export interface FeaturedNewsItem extends NewsItem {
    fullDescription: string;
  }
  
  export const featuredNewsData: FeaturedNewsItem[] = [
    {
      id: 'featured-news-1',
      title: 'NPT 1.5 Our Most Intelligent Models Are Getting Even Better',
      category: 'MAJOR UPDATE',
      date: 'May 2025',
      imageSrc: '/images/news/featured/fes.gif', // Pastikan path gambar benar
      fullDescription: 'NPT 1.5 represents a significant leap forward, offering enhanced reasoning, coding, and multimodal understanding. This iteration focuses on efficiency and broader accessibility for complex problem-solving.',
      href: "#detail-berita-1"
    },
    {
      id: 'featured-news-2',
      title: 'We Announcing a new Vision AI G02K',
      category: 'LABS',
      date: 'May 2025',
      imageSrc: '/images/news/featured/featured-news-2.jpg', // Pastikan path gambar benar
      fullDescription: 'A new model vision that can detect at all complex object and have knowledge about all indonesia object',
      href: "#detail-berita-2"
    }
    // Tambahkan item berita unggulan lainnya jika perlu
  ];
  
  export const allNewsItemsFromData: NewsItem[] = [
    // Item Berita ke-1 (Anda modifikasi sendiri)
    {
      id: 'news-item-1',
      title: 'OpenGen Founded: Our Journey Begins',
      category: 'COMPANY NEWS',
      date: 'December 20, 2023',
      imageSrc: '/images/news/se01.jpg',
      summary: 'OpenGen officially starts its mission to democratize AI.',
      href: '#OpenGenFounded'
    },
    {
      id: 'news-item-2',
      title: 'Introducing NPT 0.5',
      category: 'Models',
      date: 'October 05, 2024',
      imageSrc: '/images/npt-0.5.jpg',
      summary: 'Our New Models LLM, focused speed',
      href: '#IntroducingNPT05'
    },
    {
      id: 'news-item-3',
      title: 'Training Thought of Process NPT',
      category: 'RESEARCH',
      date: 'October 14, 2024',
      imageSrc: '/images/news/neural1.jpg',
      summary: 'Our training for create a Reasoning Model likely ChatGPT o1.',
      href: '#TrainingToPNPT'
    },
    {
      id: 'news-item-4',
      title: 'Introducing NPT 0.6: a Fast Reasoning Model',
      category: 'Models',
      date: 'December 21, 2024',
      imageSrc: '/images/npt-0.6.jpg',
      summary: 'Our LLM now can reasoning before answer the input user.',
      href: '#NPT06'
    },
    {
      id: 'news-item-5',
      title: 'Our NPT 0.6 Now more Efficient',
      category: 'MODEL DEVELOPMENT',
      date: 'January 19, 2025',
      imageSrc: '/images/news/rss01.gif',
      summary: 'Improved Math, Code and Thinking Process',
      href: '#NPT06E'
    },
    {
        id: 'news-item-6',
        title: 'Introducing API Keys for Developer',
        category: 'API',
        date: 'January 26, 2025',
        imageSrc: '/images/news/list/gambar-berita-5.jpg',
        summary: 'Fitur dan pembaruan lengkap untuk model Alpha 5.0 yang baru saja dirilis.',
        href: '#KeyAPIDevs01'
    },
    {
      id: 'news-item-7',
      title: 'Introducing NPT 0.8: Best of Our LLM',
      category: 'Models',
      date: 'Febuary 02, 2025',
      imageSrc: '/images/news/list/gambar-berita-5.jpg',
      summary: 'Fitur dan pembaruan lengkap untuk model Alpha 5.0 yang baru saja dirilis.',
      href: '#IntroduceNPT08'
    },
    {
      id: 'news-item-8',
      title: 'Advancing NPT security safeguards',
      category: 'AI Ethical & Security',
      date: 'Febuary 25, 2025',
      imageSrc: '/images/news/list/gambar-berita-5.jpg',
      summary: 'Fitur dan pembaruan lengkap untuk model Alpha 5.0 yang baru saja dirilis.',
      href: '#NPTSecurityS0'
    },
    {
      id: 'news-item-9',
      title: 'The Develoment of Next NPT',
      category: 'Research',
      date: 'March 02, 2025',
      imageSrc: '/images/news/list/gambar-berita-5.jpg',
      summary: 'Fitur dan pembaruan lengkap untuk model Alpha 5.0 yang baru saja dirilis.',
      href: '#detail-berita-list-5'
    },
    {
      id: 'news-item-10',
      title: 'Introducing NPT 1.0',
      category: 'Models',
      date: 'March 05, 2025',
      imageSrc: '/images/npt-1.0.jpg',
      summary: 'Fitur dan pembaruan lengkap untuk model Alpha 5.0 yang baru saja dirilis.',
      href: '#thebignpt1'
    },
    {
      id: 'news-item-11',
      title: 'Our LLM More 5x Faster',
      category: 'Performance',
      date: 'March 08, 2025',
      imageSrc: '/images/',
      summary: 'Fitur dan pembaruan lengkap untuk model Alpha 5.0 yang baru saja dirilis.',
      href: '#gpunewcloud'
    },
    {
      id: 'news-item-12',
      title: 'Introducing NPT 1.0 Think',
      category: 'Models',
      date: 'March 08, 2025',
      imageSrc: '/images/npt-1.0-think.jpg',
      summary: 'Fitur dan pembaruan lengkap untuk model Alpha 5.0 yang baru saja dirilis.',
      href: '#thebignpt1'
    },
    {
      id: 'news-item-13',
      title: 'We Use a New Cloud Computing Services',
      category: 'Server',
      date: 'March 19, 2025',
      imageSrc: '/images/',
      summary: 'Fitur dan pembaruan lengkap untuk model Alpha 5.0 yang baru saja dirilis.',
      href: '#newserver'
    },
  ];